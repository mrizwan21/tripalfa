// src/types/index.ts
// Comprehensive TypeScript types for wallet service

export enum UserType {
  CUSTOMER = 'customer',
  AGENCY = 'agency',
  TRAVEL_SUPPLIER = 'travel_supplier',
  ADMIN = 'admin',
}

export enum TransactionType {
  TOPUP = 'topup',
  DEBIT = 'debit',
  CUSTOMER_PURCHASE = 'customer_purchase',
  AGENCY_PURCHASE = 'agency_purchase',
  SUPPLIER_SETTLEMENT = 'supplier_settlement',
  AGENCY_COMMISSION = 'agency_commission',
  REFUND = 'refund',
  CHARGEBACK = 'chargeback',
  INTERNAL_TRANSFER = 'internal_transfer',
  FEE = 'fee',
  REVERSAL = 'reversal',
}

export enum TransactionFlow {
  CUSTOMER_TO_SUPPLIER = 'customer_to_supplier',
  SUPPLIER_TO_AGENCY = 'supplier_to_agency',
  AGENCY_TO_CUSTOMER = 'agency_to_customer',
  INTERNAL = 'internal',
}

export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REVERSED = 'reversed',
  DISPUTED = 'disputed',
}

// User model
export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  userType: UserType;
  companyName?: string;
  taxId?: string;
  bankAccountInfo?: Record<string, any>; // encrypted
  commissionRate?: number; // for agencies
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Wallet model
export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
  status: 'active' | 'frozen' | 'closed';
  createdAt: Date;
  updatedAt: Date;
}

// Transaction model
export interface Transaction {
  id: string;
  walletId: string;
  type: TransactionType;
  flow?: TransactionFlow;
  amount: number;
  currency: string;
  fxRate?: number;
  baseCurrency?: string;
  baseAmount?: number;
  
  payerId?: string; // who initiated payment
  payeeId?: string; // who receives payment
  relatedTransactionId?: string; // for linked transactions
  
  bookingId?: string;
  invoiceId?: string;
  counterparty?: string;
  description?: string;
  
  gateway?: string;
  gatewayReference?: string;
  gatewayFee?: number;
  
  status: TransactionStatus;
  idempotencyKey?: string;
  exchangeSnapshotFetchedAt?: Date;
  
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// FX Snapshot
export interface ExchangeRateSnapshot {
  id: string;
  source: string;
  baseCurrency: string;
  rates: Record<string, number>;
  fetchedAt: Date;
  status: 'active' | 'stale' | 'error';
  errorMessage?: string;
  createdAt: Date;
}

// Conversion result
export interface ConversionResult {
  converted: number;
  fxRate: number;
  baseCurrency: string;
  baseAmount: number;
  fetchedAt: Date;
  isStale: boolean;
}

// Alias for backward compatibility
export interface FxConversionResult extends ConversionResult {}

// Wallet operation options
export interface TopupOptions {
  userId: string;
  currency: string;
  amount: number;
  gateway?: string;
  gatewayReference?: string;
  gatewayFee?: number;
  idempotencyKey: string;
}

export interface DebitOptions {
  userId: string;
  currency: string;
  amount: number;
  counterparty?: string;
  gateway?: string;
  idempotencyKey: string;
}

export interface TransferOptions {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}

// Multi-party transaction flows
export interface CustomerPurchaseFlow {
  customerId: string;
  agencyId: string;
  supplierId: string;
  amount: number;
  currency: string;
  bookingId: string;
  commissionRate: number; // agency commission percentage
  idempotencyKey: string;
}

export interface SupplierSettlementFlow {
  supplierId: string;
  agencyId: string;
  settlementAmount: number;
  currency: string;
  invoiceId: string;
  deductedCommission: number;
  idempotencyKey: string;
}

export interface RefundOptions {
  originalTransactionId: string;
  userId: string;
  amount?: number; // null for full refund
  reason: string;
  idempotencyKey: string;
}

// API Request/Response types

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
  reason: string;
  idempotencyKey: string;
}

export interface WalletTransferRequest {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}

export interface TransferResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

export interface WalletBalanceResponse {
  walletId: string;
  currency: string;
  balance: number;
  status: string;
}

export interface TransactionHistoryRequest {
  userId: string;
  limit?: number;
  offset?: number;
  type?: TransactionType;
  flow?: TransactionFlow;
  startDate?: Date;
  endDate?: Date;
}

export interface TransactionHistoryResponse {
  transactions: Transaction[];
  total: number;
  limit: number;
  offset: number;
}

// FX Preview
export interface FxPreviewRequest {
  fromCurrency: string;
  toCurrency: string;
  amount: number;
}

export interface FxPreviewResponse {
  converted: number;
  fxRate: number;
  baseCurrency: string;
  baseAmount: number;
  fetchedAt: Date;
  isStale: boolean;
}

// Options used when inserting a transaction record
export interface TransactionInsertOptions {
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
}

export default {
  UserType,
  TransactionType,
  TransactionFlow,
  TransactionStatus,
};
