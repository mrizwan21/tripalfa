// src/services/transactions.ts
// Prisma-based transaction operations
import { prisma } from '@tripalfa/shared-database';
import type { WalletTransaction, TransactionInsertOptions } from '../types/wallet.js';

export async function insertTransactionRecord(opts: TransactionInsertOptions): Promise<WalletTransaction> {
  const {
    walletId,
    type,
    flow = null,
    amount,
    balance,
    currency,
    payerId,
    payeeId,
    bookingId,
    paymentId,
    idempotencyKey,
    status = 'completed',
  } = opts;

  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId,
      type,
      flow,
      amount,
      balance,
      currency,
      payerId,
      payeeId,
      bookingId,
      paymentId,
      idempotencyKey,
      status,
    },
  });

  return transaction;
}

export default { insertTransactionRecord };
