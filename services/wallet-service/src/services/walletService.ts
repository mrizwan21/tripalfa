// src/services/walletService.ts
// Complete wallet operations supporting multi-user flows:
// Customers, Agencies, Travel Suppliers with selling, purchasing, settlement, and refund scenarios

import uuidv4 from 'uuid';
import { pool } from '../config/db';
import { getLatestSnapshot } from './fxService';
import { logger } from '../utils/logger';
import { checkIdempotency, processCustomerDebit, processAgencyCredit, ensureWalletExists, lockWallet } from './walletOps';
import { insertTransactionRecord } from './transactions';
import { insertLedgerEntries, reserveCommissionAndLedger, createTransferLedger } from './ledgerOps';

import type {
  Wallet,
  Transaction,
  TransactionType,
  TransactionStatus,
  UserType,
} from '../types/wallet';

const SERVICE_NAME = 'walletService';

interface WalletService {
  createWallet(userId: string, currency: string): Promise<Wallet>;
  getWalletBalance(userId: string, currency: string): Promise<number | null>;
  getUserWallets(userId: string): Promise<Wallet[]>;
  customerPurchaseFlow(flow: CustomerPurchaseFlow): Promise<Transaction>;
  supplierSettlementFlow(flow: SupplierSettlementFlow): Promise<Transaction>;
}

interface CustomerPurchaseFlow {
  customerId: string;
  agencyId: string;
  supplierId: string;
  amount: number;
  currency: string;
  bookingId: string;
  commissionRate: number;
  idempotencyKey: string;
}

interface SupplierSettlementFlow {
  supplierId: string;
  agencyId: string;
  settlementAmount: number;
  currency: string;
  invoiceId: string;
  deductedCommission: number;
  idempotencyKey: string;
}

const walletService: WalletService = {} as WalletService;

// Helpers are split into `walletOps`, `transactions`, and `ledgerOps` for reuse and testability


/**
 * Create a wallet for a user in a specific currency
 */
walletService.createWallet = async function(userId: string, currency: string): Promise<Wallet> {
  // Use upsert to avoid unique constraint failure if wallet already exists
  const client = await pool.connect();
  try {
    await client.query(`BEGIN`);

    await client.query(
      `INSERT INTO wallets (user_id, currency, balance, status)
       VALUES ($1, $2, 0.00, 'active')
       ON CONFLICT (user_id, currency) DO NOTHING`,
      [userId, currency]
    );

    const result = await client.query(
      `SELECT id, user_id as "userId", currency, balance, status, created_at as "createdAt", updated_at as "updatedAt"
       FROM wallets
       WHERE user_id = $1 AND currency = $2`,
      [userId, currency]
    );

    await client.query(`COMMIT`);

    if (result.rows.length === 0) {
      throw new Error('Failed to create or fetch wallet');
    }

    return result.rows[0];
  } catch (err) {
    await client.query(`ROLLBACK`);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Get wallet balance for a user in a specific currency
 */
walletService.getWalletBalance = async function(userId: string, currency: string): Promise<number | null> {
  const result = await pool.query(
    'SELECT balance FROM wallets WHERE user_id = $1 AND currency = $2 AND status = \'active\'',
    [userId, currency]
  );

  return result.rows.length > 0 ? result.rows[0].balance : null;
};

/**
 * Get all wallets for a user
 */
walletService.getUserWallets = async function(userId: string): Promise<Wallet[]> {
  const result = await pool.query(
    `SELECT id, user_id as "userId", currency, balance, status, created_at as "createdAt", updated_at as "updatedAt"
     FROM wallets
     WHERE user_id = $1
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
};

/**
 * Customer purchase flow: customer -> agency -> supplier with commission deduction
 */
walletService.customerPurchaseFlow = async function(flow: CustomerPurchaseFlow): Promise<Transaction> {
  const { customerId, agencyId, supplierId, amount, currency, bookingId, commissionRate, idempotencyKey } =
    flow;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await checkIdempotency(client, idempotencyKey);

    const { customerTx, customerWallet } = await processCustomerDebit(
      client,
      customerId,
      currency,
      amount,
      agencyId,
      bookingId,
      idempotencyKey
    );

    const { agencyTx, agencyWallet } = await processAgencyCredit(client, agencyId, currency, amount, customerId, bookingId);

    const commission = Number((Number(amount) * (Number(commissionRate) / 100)).toFixed(6));
    await reserveCommissionAndLedger(client, agencyWallet.id, commission, currency, customerId, agencyId, bookingId);

    await createTransferLedger(
      client,
      customerTx.id,
      currency,
      `wallet:${currency}:${customerWallet.id}`,
      `wallet:${currency}:${agencyWallet.id}`,
      amount
    );

    await client.query('COMMIT');
    return customerTx;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`${SERVICE_NAME}: customerPurchaseFlow failed`, err as Error);
    throw err;
  } finally {
    client.release();
  }
};

/**
 * Supplier settlement flow
 */
walletService.supplierSettlementFlow = async function(flow: SupplierSettlementFlow): Promise<Transaction> {
  const { supplierId, agencyId, settlementAmount, currency, invoiceId, deductedCommission, idempotencyKey } = flow;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await checkIdempotency(client, idempotencyKey);

    // Ensure wallets exist
    await ensureWalletExists(client, supplierId, currency);
    await ensureWalletExists(client, agencyId, currency);

    // Lock agency wallet and validate funds
    const agencyWallet = await lockWallet(client, agencyId, currency);
    const totalDebit = Number(settlementAmount) + Number(deductedCommission || 0);
    if (Number(agencyWallet.balance) < totalDebit) throw new Error('Insufficient funds');

    // Debit agency
    await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2`, [totalDebit, agencyWallet.id]);

    // Credit supplier
    const supplierWallet = await lockWallet(client, supplierId, currency);
    await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2`, [settlementAmount, supplierWallet.id]);

    // Create settlement transaction recorded on supplier wallet
    const settlementTx = await insertTransactionRecord(client, {
      walletId: supplierWallet.id,
      type: 'supplier_settlement',
      flow: 'supplier_to_agency',
      amount: settlementAmount,
      currency,
      payerId: agencyId,
      payeeId: supplierId,
      invoiceId,
      idempotencyKey,
      status: 'completed',
    });

    // Ledger entries: debit agency total, credit supplier amount, credit commission
    await insertLedgerEntries(client, settlementTx.id, [
      { account: `wallet:${currency}:${agencyWallet.id}`, debit: totalDebit, credit: 0, currency, description: 'Agency settlement debit' },
      { account: `wallet:${currency}:${supplierWallet.id}`, debit: 0, credit: settlementAmount, currency, description: 'Supplier settlement credit' },
      { account: `commission:deducted:${currency}`, debit: 0, credit: deductedCommission || 0, currency, description: 'Commission deducted' },
    ]);

    await client.query('COMMIT');
    return settlementTx;
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`${SERVICE_NAME}: supplierSettlementFlow failed`, err as Error);
    throw err;
  } finally {
    client.release();
  }
};

// CommonJS compatibility for test runners that load compiled modules differently
if (typeof module !== "undefined" && module.exports) {
  module.exports = walletService;
}

// ES module export
export default walletService;
