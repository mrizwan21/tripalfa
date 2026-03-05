// src/types/index.ts
// Type definitions for wallet service

import type { MonetaryValue } from "./wallet.js";

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: MonetaryValue; // Decimal from Prisma - use toNumber() helper for calculations
  reservedBalance: MonetaryValue; // Decimal from Prisma - required in schema
  status: "active" | "frozen" | "closed";
  createdAt: Date;
  updatedAt: Date;
}

export enum TransactionType {
  Topup = "topup",
  Debit = "debit",
  Transfer = "transfer",
  Refund = "refund",
  Payout = "payout",
  Dispute = "dispute",
  Reversal = "reversal",
  FxAdjustment = "fx_adjustment",
}

export enum TransactionStatus {
  Pending = "pending",
  Completed = "completed",
  Failed = "failed",
  Reversed = "reversed",
}

export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  amount: number;
  currency: string;
  fxRate?: number;
  baseCurrency?: string;
  baseAmount?: number;
  gateway?: string;
  gatewayReference?: string;
  gatewayFee?: number;
  counterparty?: string;
  description?: string;
  status: TransactionStatus;
  idempotencyKey?: string;
  exchangeSnapshotFetchedAt?: Date;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface LedgerEntry {
  id: string;
  transactionId?: string;
  account: string;
  debit: number;
  credit: number;
  currency: string;
  description?: string;
  createdAt: Date;
}

export interface ExchangeRateSnapshot {
  id: string;
  source: string;
  baseCurrency: string;
  rates: Record<string, number>;
  fetchedAt: Date;
  status: "active" | "stale" | "error";
  errorMessage?: string;
  createdAt: Date;
}

export interface Settlement {
  id: string;
  gateway: string;
  gatewaySettlementId?: string;
  currency: string;
  amount: number;
  fees: number;
  netAmount?: number;
  settledAt: Date;
  status: "pending" | "completed" | "failed" | "reversed";
  reconciliationStatus: "unmatched" | "matched" | "disputed";
  raw?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface FxConversionResult {
  converted: number;
  fxRate: number;
  baseCurrency: string;
  baseAmount: number;
  fetchedAt: Date;
  isStale: boolean;
}

export interface TransferRequest {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}

export interface TransferResponse {
  success: boolean;
  transaction?: {
    id: string;
    fromWalletId: string;
    toWalletId: string;
    type: string;
    amount: number;
    fromCurrency: string;
    converted: number;
    toCurrency: string;
    fxRate: number;
    baseAmount: number;
    baseCurrency: string;
    status: string;
    createdAt: Date;
  };
  error?: string;
}

export interface TopupRequest {
  userId: string;
  currency: string;
  amount: number;
  gateway?: string;
  gatewayReference?: string;
  gatewayFee?: number;
  idempotencyKey: string;
}

export interface DebitRequest {
  userId: string;
  currency: string;
  amount: number;
  counterparty: string;
  gateway?: string;
  idempotencyKey: string;
}

export interface RefundRequest {
  originalTransactionId: string;
  userId: string;
  amount?: number;
  idempotencyKey: string;
}

export interface ReconciliationResult {
  success: boolean;
  matched: number;
  fxAdjustments: number;
  chargebacks: number;
  unreconciled: number;
}

export interface AuthPayload {
  userId: string;
  iat: number;
}

// Global declarations for test environment
declare global {
  // eslint-disable-next-line no-var
  var PG_POOL: import("pg").Pool | undefined;
}
