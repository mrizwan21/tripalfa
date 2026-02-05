// src/services/ledgerOps.ts
import { insertTransactionRecord } from './transactions.js';

export async function insertLedgerEntries(client: any, txId: string, entries: Array<any>) {
  if (!entries.length) return;
  const values: any[] = [];
  const rowsSql: string[] = [];
  entries.forEach((e, idx) => {
    const base = idx * 6;
    rowsSql.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
    values.push(txId, e.account, e.debit || 0, e.credit || 0, e.currency, e.description || null);
  });
  const sql = `INSERT INTO ledger_entries (transaction_id, account, debit, credit, currency, description) VALUES ${rowsSql.join(', ')}`;
  await client.query(sql, values);
}

export async function createTransferLedger(client: any, txId: string, currency: string, fromAccount: string, toAccount: string, amount: number) {
  await insertLedgerEntries(client, txId, [
    { account: fromAccount, debit: amount, credit: 0, currency, description: 'Transfer debit' },
    { account: toAccount, debit: 0, credit: amount, currency, description: 'Transfer credit' },
  ]);
}

export async function reserveCommissionAndLedger(client: any, agencyWalletId: string, commission: number, currency: string, customerId?: string, agencyId?: string, bookingId?: string) {
  if (commission <= 0) return null;
  const commissionTx = await insertTransactionRecord(client, {
    walletId: agencyWalletId,
    type: 'agency_commission',
    amount: commission,
    currency,
    payerId: customerId,
    payeeId: agencyId,
    bookingId,
    status: 'reserved',
  });

  await insertLedgerEntries(client, commissionTx.id, [
    { account: `commission_reserved:${currency}:${agencyId}`, debit: commission, credit: 0, currency, description: 'Commission reserved (debit)' },
    { account: `commission_pending:${currency}`, debit: 0, credit: commission, currency, description: 'Commission reserved (credit)' },
  ]);
  return commissionTx;
}

export default { insertLedgerEntries, createTransferLedger, reserveCommissionAndLedger };
