// src/services/ledgerOps.ts
// Prisma-based ledger operations
import { prisma } from "@tripalfa/shared-database";
import { insertTransactionRecord } from "./transactions.js";
// Using string-based arithmetic for financial precision

// UUID validation regex pattern (RFC 4122 compliant)
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/**
 * Validate that a string is a valid UUID format
 * @param id - The string to validate
 * @throws Error if the ID is not a valid UUID format
 */
function validateUuid(id: string, context: string = "ID"): void {
  if (!id || typeof id !== "string") {
    throw new Error(`Invalid ${context}: expected non-empty string`);
  }
  if (!UUID_REGEX.test(id)) {
    throw new Error(
      `Invalid ${context}: "${id.substring(0, 8)}..." is not a valid UUID format`,
    );
  }
}

/**
 * Convert a number to cents (integer) using string manipulation
 * This avoids floating-point precision issues by working with strings
 *
 * @example
 * toCents(123.45) => 12345
 * toCents(0.1 + 0.2) => 30 (handles 0.30000000000000004 correctly)
 * toCents(-50.00) => -5000 (negative values allowed for refunds/reversals)
 *
 * @throws Error if amount is NaN, not a number, or infinite
 */
function toCents(amount: number): number {
  // Input validation
  if (typeof amount !== "number") {
    throw new Error(`Invalid amount: expected number, got ${typeof amount}`);
  }
  if (isNaN(amount)) {
    throw new Error("Invalid amount: NaN is not allowed");
  }
  if (!isFinite(amount)) {
    throw new Error("Invalid amount: infinite values are not allowed");
  }
  // Note: Negative values are allowed for refunds, chargebacks, and reversals

  // Convert to string with fixed decimal places to avoid floating-point errors
  // Using 6 decimal places for intermediate precision, then rounding to 2 for currency
  const fixedStr = amount.toFixed(6);
  const parsed = parseFloat(fixedStr);

  // Round to 2 decimal places for currency, then convert to cents
  const rounded = Math.round(parsed * 100) / 100;
  return Math.round(rounded * 100);
}

/**
 * Convert cents back to decimal amount with proper precision
 * Returns a number with exactly 2 decimal places
 */
function fromCents(cents: number): number {
  // Ensure we return a clean decimal value
  const result = cents / 100;
  // Round to 2 decimal places to clean up any floating-point artifacts
  return Math.round(result * 100) / 100;
}

/**
 * Add two monetary amounts safely using cents arithmetic
 * Prevents floating-point errors like 0.1 + 0.2 !== 0.3
 */
function addMonetary(a: number, b: number): number {
  return fromCents(toCents(a) + toCents(b));
}

/**
 * Subtract two monetary amounts safely using cents arithmetic
 */
function subtractMonetary(a: number, b: number): number {
  return fromCents(toCents(a) - toCents(b));
}

/**
 * Get the latest balance from the ledger for a wallet within a transaction
 * Uses FOR UPDATE row-level locking to prevent race conditions in concurrent scenarios.
 *
 * IMPORTANT: This function MUST be called within a Prisma transaction ($transaction).
 * The FOR UPDATE lock ensures that concurrent transactions wait for this transaction
 * to complete before reading the balance, preventing double-spending and incorrect balances.
 *
 * @param tx - Prisma transaction client (from $transaction callback)
 * @param walletId - The wallet ID to get the balance for
 * @returns The latest balance from the ledger, or 0 if no entries exist
 */
async function getLatestLedgerBalanceWithLock(
  tx: any,
  walletId: string,
): Promise<number> {
  // Validate UUID format before using in raw SQL query
  validateUuid(walletId, "walletId");

  // Use raw query with FOR UPDATE to acquire row-level lock
  // This prevents concurrent transactions from reading the same balance
  // until this transaction commits or rolls back
  const result = await tx.$queryRaw<Array<{ balance: bigint }>>`
    SELECT balance FROM wallet_ledger 
    WHERE wallet_id = ${walletId}::uuid 
    ORDER BY created_at DESC 
    LIMIT 1 
    FOR UPDATE
  `;

  if (result && result.length > 0) {
    // Handle both bigint and numeric types from PostgreSQL
    const balance = result[0].balance;
    return typeof balance === "bigint" ? Number(balance) : Number(balance);
  }

  return 0;
}

/**
 * Get the current wallet balance directly from the wallets table with row lock.
 * This is used as the source of truth when no ledger entries exist yet.
 *
 * @param tx - Prisma transaction client
 * @param walletId - The wallet ID to get the balance for
 * @returns The current wallet balance, or 0 if wallet not found
 */
async function getWalletBalanceWithLock(
  tx: any,
  walletId: string,
): Promise<number> {
  // Validate UUID format before using in raw SQL query
  validateUuid(walletId, "walletId");

  const result = await tx.$queryRaw<Array<{ balance: bigint }>>`
    SELECT balance FROM wallets 
    WHERE id = ${walletId}::uuid 
    FOR UPDATE
  `;

  if (result && result.length > 0) {
    const balance = result[0].balance;
    return typeof balance === "bigint" ? Number(balance) : Number(balance);
  }

  return 0;
}

export async function insertLedgerEntries(
  walletId: string,
  txId: string,
  currentBalance: number,
  entries: Array<{
    account: string;
    accountType?: string;
    debit?: number;
    credit?: number;
    currency: string;
    description?: string;
  }>,
  tx?: any, // Optional Prisma transaction client for atomic operations
): Promise<void> {
  if (!entries.length) return;

  // Validate UUIDs before any database operations
  validateUuid(walletId, "walletId");
  validateUuid(txId, "transactionId");

  // Use provided transaction or create new one
  const executeInTransaction = async (transactionClient: any) => {
    // CRITICAL: Use FOR UPDATE row-level locking to prevent race conditions
    // This ensures concurrent transactions wait for this transaction to complete
    // before reading the balance, preventing double-spending and incorrect balances.
    // We try the ledger first, then fall back to the wallet table if no entries exist.
    let startingBalance: number;

    // First, try to get the latest ledger balance with row lock
    const latestLedgerBalance = await getLatestLedgerBalanceWithLock(
      transactionClient,
      walletId,
    );

    if (latestLedgerBalance !== 0) {
      // We have ledger entries - use the latest balance from ledger
      startingBalance = latestLedgerBalance;
    } else {
      // No ledger entries yet - get balance directly from wallet table with lock
      // This is the source of truth for new wallets
      startingBalance = await getWalletBalanceWithLock(
        transactionClient,
        walletId,
      );
    }

    // Use integer cents for all calculations to avoid floating-point precision issues
    let runningBalanceCents = toCents(startingBalance);

    const ledgerEntries = entries.map((entry) => {
      const debitCents = toCents(entry.debit || 0);
      const creditCents = toCents(entry.credit || 0);
      const amountCents = debitCents - creditCents;
      runningBalanceCents += amountCents;

      return {
        walletId,
        transactionId: txId,
        entryType: amountCents >= 0 ? "debit" : "credit",
        amount: fromCents(Math.abs(amountCents)),
        balance: fromCents(runningBalanceCents),
        currency: entry.currency,
        accountType: entry.accountType || "main",
        account: entry.account,
        debit: fromCents(debitCents),
        credit: fromCents(creditCents),
        description: entry.description,
      };
    });

    await transactionClient.walletLedger.createMany({
      data: ledgerEntries,
    });
  };

  if (tx) {
    // Use existing transaction
    await executeInTransaction(tx);
  } else {
    // Create new transaction for atomic operation
    await prisma.$transaction(executeInTransaction);
  }
}

export async function createTransferLedger(
  walletId: string,
  txId: string,
  currentBalance: number,
  currency: string,
  fromAccount: string,
  toAccount: string,
  amount: number,
): Promise<void> {
  await insertLedgerEntries(walletId, txId, currentBalance, [
    {
      account: fromAccount,
      debit: amount,
      credit: 0,
      currency,
      description: "Transfer debit",
    },
    {
      account: toAccount,
      debit: 0,
      credit: amount,
      currency,
      description: "Transfer credit",
    },
  ]);
}

export async function reserveCommissionAndLedger(
  agencyWalletId: string,
  commission: number,
  currency: string,
  customerId?: string,
  agencyId?: string,
  bookingId?: string,
): Promise<any> {
  if (commission <= 0) return null;

  // Validate UUID before database operations
  validateUuid(agencyWalletId, "agencyWalletId");

  // Wrap entire operation in transaction to prevent race conditions
  return await prisma.$transaction(async (tx) => {
    // CRITICAL: Use FOR UPDATE lock to prevent concurrent modifications
    // This ensures we get a consistent balance for commission calculation
    const walletBalance = await getWalletBalanceWithLock(tx, agencyWalletId);

    if (walletBalance === 0) {
      // Double-check if wallet exists but has zero balance vs not found
      const walletExists = await tx.wallet.findUnique({
        where: { id: agencyWalletId },
        select: { id: true },
      });
      if (!walletExists) {
        throw new Error(`Wallet not found: ${agencyWalletId}`);
      }
    }

    // Calculate the new balance after reserving commission using safe arithmetic
    const currentBalance = subtractMonetary(walletBalance, commission);

    const commissionTx = await tx.walletTransaction.create({
      data: {
        walletId: agencyWalletId,
        type: "commission",
        amount: commission,
        balance: currentBalance,
        currency,
        payerId: customerId,
        payeeId: agencyId,
        bookingId,
        status: "reserved",
      },
    });

    // Create ledger entries within the same transaction
    await insertLedgerEntries(
      agencyWalletId,
      commissionTx.id,
      currentBalance,
      [
        {
          account: `commission_reserved:${currency}:${agencyId}`,
          accountType: "reserve",
          debit: commission,
          credit: 0,
          currency,
          description: "Commission reserved (debit)",
        },
        {
          account: `commission_pending:${currency}`,
          accountType: "pending",
          debit: 0,
          credit: commission,
          currency,
          description: "Commission reserved (credit)",
        },
      ],
      tx,
    );

    return commissionTx;
  });
}

export default {
  insertLedgerEntries,
  createTransferLedger,
  reserveCommissionAndLedger,
};
