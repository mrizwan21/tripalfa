// src/types/index.ts
// Type definitions for wallet service

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

interface TopUpRequest {
  userId: string;
  currency: string;
  amount: number;
  gateway?: string;
  gatewayReference?: string;
  gatewayFee?: number;
  idempotencyKey: string;
}

interface DebitRequest {
  userId: string;
  currency: string;
  amount: number;
  counterparty: string;
  gateway?: string;
  idempotencyKey: string;
}

interface RefundRequest {
  originalTransactionId: string;
  userId: string;
  amount?: number;
  idempotencyKey: string;
}

interface ReconciliationResult {
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
  var PG_POOL: import('pg').Pool | undefined;
}
