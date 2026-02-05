// src/services/transactions.ts
import type { TransactionInsertOptions, Transaction } from '../types/wallet.js';

export async function insertTransactionRecord(client: any, opts: TransactionInsertOptions) {
  const {
    walletId,
    type,
    flow = null,
    amount,
    currency,
    payerId,
    payeeId,
    bookingId,
    invoiceId,
    idempotencyKey,
    status = 'completed',
  } = opts;

  const result = await client.query(
    `INSERT INTO transactions (wallet_id, type, flow, amount, currency, payer_id, payee_id, booking_id, invoice_id, idempotency_key, status)
     VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
     RETURNING id, wallet_id as "walletId", type, flow, amount, currency, payer_id as "payerId", payee_id as "payeeId", booking_id as "bookingId", invoice_id as "invoiceId", status, idempotency_key as "idempotencyKey", created_at as "createdAt", updated_at as "updatedAt"`,
    [
      walletId,
      type,
      flow,
      amount,
      currency,
      payerId || null,
      payeeId || null,
      bookingId || null,
      invoiceId || null,
      idempotencyKey || null,
      status,
    ]
  );
  return result.rows[0] as Transaction;
}

export default { insertTransactionRecord };
