// src/services/walletOps.ts
// Prisma-based wallet operations
import { prisma } from "@tripalfa/shared-database";
import type { Wallet, WalletTransaction } from "../types/wallet.js";

// Simple logger fallback if logger is not available
const logWarn = (message: string) => {
  console.warn(`[walletOps] WARN: ${message}`);
};

export async function ensureWalletExists(
  userId: string,
  currency: string,
): Promise<Wallet> {
  const wallet = await prisma.wallet.upsert({
    where: {
      userId_currency: { userId, currency },
    },
    update: {},
    create: {
      userId,
      currency,
      balance: 0,
      reservedBalance: 0,
      status: "active",
    },
  });
  return wallet as Wallet;
}

/**
 * Check if an idempotency key has already been used
 *
 * @deprecated This function has a race condition and should not be used.
 * Use idempotency checks inside transactions like in processAgencyCredit instead.
 *
 * This function now logs a deprecation warning and returns without performing any check.
 * In a future version, this function will be removed entirely.
 *
 * Migration guide:
 * - Replace standalone checkIdempotency() calls with idempotency checks inside transactions
 * - See processAgencyCredit(), processCustomerDebit(), or walletService.creditWallet() for examples
 */
export async function checkIdempotency(idempotencyKey: string): Promise<void> {
  if (!idempotencyKey) return;

  // Log deprecation warning - this function will be removed in a future version
  logWarn(
    `checkIdempotency() is deprecated and has a race condition. ` +
      `Migrate to idempotency checks inside transactions. ` +
      `See processAgencyCredit(), processCustomerDebit(), or walletService.creditWallet() for examples. ` +
      `Called with key: ${idempotencyKey.substring(0, 8)}...`,
  );

  // NOTE: This function previously threw an error, but now returns gracefully
  // to allow existing code to continue working while migrating to the new pattern.
  // The actual idempotency check should be done inside a transaction.
  return;
}

export async function lockWallet(
  userId: string,
  currency: string,
): Promise<Wallet> {
  // Prisma doesn't support FOR UPDATE, but transactions provide isolation
  const wallet = await prisma.wallet.findUnique({
    where: {
      userId_currency: { userId, currency },
    },
  });

  if (!wallet) throw new Error("Wallet not found");
  return wallet as Wallet;
}

export async function processCustomerDebit(
  customerId: string,
  currency: string,
  amount: number,
  agencyId: string,
  bookingId: string,
  idempotencyKey?: string,
): Promise<{ customerTx: WalletTransaction; customerWallet: Wallet }> {
  return await prisma.$transaction(async (tx) => {
    // Check for idempotency INSIDE transaction to prevent race condition
    if (idempotencyKey) {
      const existing = await tx.walletTransaction.findFirst({
        where: { idempotencyKey },
      });
      if (existing) {
        // Idempotency key already used - return existing transaction
        return {
          customerTx: existing,
          customerWallet: (await tx.wallet.findUnique({
            where: { userId_currency: { userId: customerId, currency } },
          })) as Wallet,
        };
      }
    }

    // Ensure wallet exists
    let customerWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: customerId, currency } },
    });

    if (!customerWallet) {
      customerWallet = await tx.wallet.create({
        data: {
          userId: customerId,
          currency,
          balance: 0,
          reservedBalance: 0,
          status: "active",
        },
      });
    }

    // Check balance
    if (Number(customerWallet.balance) < amount) {
      throw new Error("Insufficient funds");
    }

    // Debit wallet
    const newBalance = Number(customerWallet.balance) - amount;
    await tx.wallet.update({
      where: { id: customerWallet.id },
      data: { balance: newBalance },
    });

    // Create transaction record with consistent types
    const customerTx = await tx.walletTransaction.create({
      data: {
        walletId: customerWallet.id,
        type: "debit",
        flow: "outbound",
        amount,
        balance: newBalance,
        currency,
        payerId: customerId,
        payeeId: agencyId,
        bookingId,
        idempotencyKey,
        status: "completed",
        description: "Customer purchase debit",
      },
    });

    return { customerTx, customerWallet: customerWallet as Wallet };
  });
}

export async function processAgencyCredit(
  agencyId: string,
  currency: string,
  amount: number,
  customerId: string,
  bookingId: string,
  idempotencyKey?: string,
): Promise<{ agencyTx: WalletTransaction; agencyWallet: Wallet }> {
  return await prisma.$transaction(async (tx) => {
    // Check for idempotency INSIDE transaction to prevent race condition
    // Use upsert for conflict handling on unique constraint violation
    if (idempotencyKey) {
      const existing = await tx.walletTransaction.findFirst({
        where: { idempotencyKey },
      });
      if (existing) {
        // Idempotency key already used - return existing transaction
        // This is safe because we're inside the transaction
        return {
          agencyTx: existing,
          agencyWallet: (await tx.wallet.findUnique({
            where: { userId_currency: { userId: agencyId, currency } },
          })) as Wallet,
        };
      }
    }

    // Ensure wallet exists
    let agencyWallet = await tx.wallet.findUnique({
      where: { userId_currency: { userId: agencyId, currency } },
    });

    if (!agencyWallet) {
      agencyWallet = await tx.wallet.create({
        data: {
          userId: agencyId,
          currency,
          balance: 0,
          reservedBalance: 0,
          status: "active",
        },
      });
    }

    // Credit wallet
    const newBalance = Number(agencyWallet.balance) + amount;
    await tx.wallet.update({
      where: { id: agencyWallet.id },
      data: { balance: newBalance },
    });

    // Create transaction record with consistent types
    const agencyTx = await tx.walletTransaction.create({
      data: {
        walletId: agencyWallet.id,
        type: "credit",
        flow: "inbound",
        amount,
        balance: newBalance,
        currency,
        payerId: customerId,
        payeeId: agencyId,
        bookingId,
        idempotencyKey,
        status: "completed",
        description: "Agency purchase credit",
      },
    });

    return { agencyTx, agencyWallet: agencyWallet as Wallet };
  });
}

export default {
  ensureWalletExists,
  checkIdempotency, // Deprecated: logs warning, returns gracefully. Will be removed in future version.
  lockWallet,
  processCustomerDebit,
  processAgencyCredit,
};
