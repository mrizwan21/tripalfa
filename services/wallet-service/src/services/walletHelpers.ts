// src/services/walletHelpers.ts
// Shared DB helper functions for walletService to improve testability and reduce file size

import type { Wallet, Transaction } from '../types/wallet';
import * as ledgerOps from './ledgerOps';
import * as walletOps from './walletOps';

// Re-export insertTransactionRecord from transactions module
export { insertTransactionRecord } from './transactions';

export const ensureWalletExists = walletOps.ensureWalletExists;
export const checkIdempotency = walletOps.checkIdempotency;
export const lockWallet = walletOps.lockWallet;

type TxRecordOpts = {
  walletId: string;
  type: string;
  flow?: string | null;
  amount: number;
  currency: string;
  payerId?: string;
  payeeId?: string;
  bookingId?: string;
  invoiceId?: string;
  idempotencyKey?: string;
  status?: string;
};


export async function insertLedgerEntries(client: any, txId: string, entries: Array<any>) {
  return ledgerOps.insertLedgerEntries(client, txId, entries);
}

export async function reserveCommissionAndLedger(client: any, agencyWalletId: string, commission: number, currency: string, customerId?: string, agencyId?: string, bookingId?: string) {
  return ledgerOps.reserveCommissionAndLedger(client, agencyWalletId, commission, currency, customerId, agencyId, bookingId);
}

export async function createTransferLedger(client: any, txId: string, currency: string, fromAccount: string, toAccount: string, amount: number) {
  return ledgerOps.createTransferLedger(client, txId, currency, fromAccount, toAccount, amount);
}

export const processCustomerDebit = walletOps.processCustomerDebit;
export const processAgencyCredit = walletOps.processAgencyCredit;
