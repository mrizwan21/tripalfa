// src/services/walletHelpers.ts
// Shared DB helper functions for walletService using Prisma
// These wrappers maintain backward compatibility with code that passes a client

import * as ledgerOps from './ledgerOps.js';
import * as walletOps from './walletOps.js';
import { insertTransactionRecord } from './transactions.js';

// Re-export insertTransactionRecord from transactions module
export { insertTransactionRecord };

export const ensureWalletExists = walletOps.ensureWalletExists;
export const checkIdempotency = walletOps.checkIdempotency;
export const lockWallet = walletOps.lockWallet;

// Wrapper functions that ignore the client parameter (Prisma handles transactions internally)
export async function insertLedgerEntries(_client: any, txId: string, entries: Array<any>) {
  return ledgerOps.insertLedgerEntries(txId, entries);
}

export async function reserveCommissionAndLedger(
  _client: any, 
  agencyWalletId: string, 
  commission: number, 
  currency: string, 
  customerId?: string, 
  agencyId?: string, 
  bookingId?: string
) {
  return ledgerOps.reserveCommissionAndLedger(agencyWalletId, commission, currency, customerId, agencyId, bookingId);
}

export async function createTransferLedger(
  _client: any, 
  txId: string, 
  currency: string, 
  fromAccount: string, 
  toAccount: string, 
  amount: number
) {
  return ledgerOps.createTransferLedger(txId, currency, fromAccount, toAccount, amount);
}

export const processCustomerDebit = walletOps.processCustomerDebit;
export const processAgencyCredit = walletOps.processAgencyCredit;
