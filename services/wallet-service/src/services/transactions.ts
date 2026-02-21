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
    currency,
    payerId,
    payeeId,
    bookingId,
    invoiceId,
    idempotencyKey,
    status = 'completed',
  } = opts;

  const transaction = await prisma.walletTransaction.create({
    data: {
      walletId,
      type,
      flow,
      amount,
      currency,
      payerId,
      payeeId,
      bookingId,
      invoiceId,
      idempotencyKey,
      status,
    },
  });

  return transaction;
}

export async function insertLedgerEntries(
  transactionId: string,
  entries: Array<{
    account: string;
    debit?: number;
    credit?: number;
    currency: string;
    description?: string;
  }>
): Promise<void> {
  await prisma.walletLedger.createMany({
    data: entries.map((entry) => ({
      transactionId,
      account: entry.account,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      currency: entry.currency,
      description: entry.description,
    })),
  });
}

export default { insertTransactionRecord, insertLedgerEntries };
