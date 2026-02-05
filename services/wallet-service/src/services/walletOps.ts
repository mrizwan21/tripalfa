// src/services/walletOps.ts
import type { Wallet, Transaction } from '../types/wallet';
import { insertTransactionRecord } from './transactions';

export async function ensureWalletExists(client: any, userId: string, currency: string) {
  await client.query(
    `INSERT INTO wallets (user_id, currency, balance, status)
     VALUES ($1, $2, 0.00, 'active')
     ON CONFLICT (user_id, currency) DO NOTHING`,
    [userId, currency]
  );

  const res = await client.query(
    `SELECT id, user_id as "userId", currency, balance, status, created_at as "createdAt", updated_at as "updatedAt"
     FROM wallets WHERE user_id = $1 AND currency = $2`,
    [userId, currency]
  );
  if (res.rows.length === 0) throw new Error('Failed to ensure wallet');
  return res.rows[0] as Wallet;
}

export async function checkIdempotency(client: any, idempotencyKey: string) {
  if (!idempotencyKey) return;
  const existing = await client.query(`SELECT id FROM transactions WHERE idempotency_key = $1`, [
    idempotencyKey,
  ]);
  if (existing.rows.length) throw new Error('Duplicate transaction');
}

export async function lockWallet(client: any, userId: string, currency: string) {
  const res = await client.query(
    `SELECT id, balance FROM wallets WHERE user_id = $1 AND currency = $2 FOR UPDATE`,
    [userId, currency]
  );
  if (res.rows.length === 0) throw new Error('Wallet not found');
  return res.rows[0] as Wallet;
}

export async function processCustomerDebit(
  client: any,
  customerId: string,
  currency: string,
  amount: number,
  agencyId: string,
  bookingId: string,
  idempotencyKey?: string
) {
  await ensureWalletExists(client, customerId, currency);
  const customerWallet = await lockWallet(client, customerId, currency);
  if (Number(customerWallet.balance) < Number(amount)) throw new Error('Insufficient funds');
  await client.query(`UPDATE wallets SET balance = balance - $1 WHERE id = $2`, [amount, customerWallet.id]);
  const customerTx = await insertTransactionRecord(client, {
    walletId: customerWallet.id,
    type: 'customer_purchase',
    flow: 'customer_to_supplier',
    amount,
    currency,
    payerId: customerId,
    payeeId: agencyId,
    bookingId,
    idempotencyKey,
    status: 'completed',
  });
  return { customerTx, customerWallet } as { customerTx: Transaction; customerWallet: Wallet };
}

export async function processAgencyCredit(
  client: any,
  agencyId: string,
  currency: string,
  amount: number,
  customerId: string,
  bookingId: string
) {
  await ensureWalletExists(client, agencyId, currency);
  const agencyWallet = await lockWallet(client, agencyId, currency);
  await client.query(`UPDATE wallets SET balance = balance + $1 WHERE id = $2`, [amount, agencyWallet.id]);
  const agencyTx = await insertTransactionRecord(client, {
    walletId: agencyWallet.id,
    type: 'agency_purchase',
    flow: 'customer_to_supplier',
    amount,
    currency,
    payerId: customerId,
    payeeId: agencyId,
    bookingId,
    status: 'completed',
  });
  return { agencyTx, agencyWallet } as { agencyTx: Transaction; agencyWallet: Wallet };
}

export default { ensureWalletExists, checkIdempotency, lockWallet, processCustomerDebit, processAgencyCredit };
