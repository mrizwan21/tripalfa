// src/services/ledgerOps.ts
// Prisma-based ledger operations
import { prisma } from '@tripalfa/shared-database';
import { insertTransactionRecord } from './transactions.js';

export async function insertLedgerEntries(
  txId: string,
  entries: Array<{
    account: string;
    debit?: number;
    credit?: number;
    currency: string;
    description?: string;
  }>
): Promise<void> {
  if (!entries.length) return;

  await prisma.walletLedger.createMany({
    data: entries.map((entry) => ({
      transactionId: txId,
      account: entry.account,
      debit: entry.debit || 0,
      credit: entry.credit || 0,
      currency: entry.currency,
      description: entry.description,
    })),
  });
}

export async function createTransferLedger(
  txId: string,
  currency: string,
  fromAccount: string,
  toAccount: string,
  amount: number
): Promise<void> {
  await insertLedgerEntries(txId, [
    { account: fromAccount, debit: amount, credit: 0, currency, description: 'Transfer debit' },
    { account: toAccount, debit: 0, credit: amount, currency, description: 'Transfer credit' },
  ]);
}

export async function reserveCommissionAndLedger(
  agencyWalletId: string,
  commission: number,
  currency: string,
  customerId?: string,
  agencyId?: string,
  bookingId?: string
): Promise<any> {
  if (commission <= 0) return null;

  const commissionTx = await insertTransactionRecord({
    walletId: agencyWalletId,
    type: 'commission',
    amount: commission,
    currency,
    payerId: customerId,
    payeeId: agencyId,
    bookingId,
    status: 'reserved',
  });

  await insertLedgerEntries(commissionTx.id, [
    { account: `commission_reserved:${currency}:${agencyId}`, debit: commission, credit: 0, currency, description: 'Commission reserved (debit)' },
    { account: `commission_pending:${currency}`, debit: 0, credit: commission, currency, description: 'Commission reserved (credit)' },
  ]);

  return commissionTx;
}

export default { insertLedgerEntries, createTransferLedger, reserveCommissionAndLedger };
