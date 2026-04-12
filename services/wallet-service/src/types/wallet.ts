// src/types/index.ts
// Comprehensive TypeScript types for wallet service

import type { Prisma } from "@prisma/client";

/**
 * Branded type for monetary values to distinguish from regular numbers
 * This provides type safety for financial calculations
 */
export type MonetaryValue = Prisma.Decimal | number | string;

/**
 * Helper type for Prisma Decimal-like values
 * Use this when accepting balance/amount values from Prisma queries
 */
export type DecimalLike = { toString(): string } | number | null | undefined;

/**
 * Safely convert a MonetaryValue to a number
 * This is the recommended way to handle Prisma Decimal values in calculations
 *
 * @param value - The monetary value to convert (Decimal, number, string, null, or undefined)
 * @param defaultValue - The default value to return if the input is null/undefined (default: 0)
 * @returns A number suitable for calculations
 *
 * @example
 * const balance = toNumber(wallet.balance); // Decimal -> number
 * const amount = toNumber(transaction.amount, 0); // with default
 */
export function toNumber(value: DecimalLike, defaultValue: number = 0): number {
  if (value === null || value === undefined) return defaultValue;
  if (typeof value === "number") return value;
  const parsed = Number(value.toString());
  return isNaN(parsed) ? defaultValue : parsed;
}

/**
 * Prisma Wallet type from the generated client
 * Use this type when working with Prisma query results
 */
export type PrismaWallet = Prisma.WalletGetPayload<{}>;

/**
 * Prisma WalletTransaction type from the generated client
 */
export type PrismaWalletTransaction = Prisma.WalletTransactionGetPayload<{}>;

/**
 * Prisma WalletLedger type from the generated client
 */
export type PrismaWalletLedger = Prisma.WalletLedgerGetPayload<{}>;

/**
 * Convert a Prisma Wallet result to our Wallet interface type
 * This provides a type-safe mapping that handles Decimal conversions
 *
 * @param prismaWallet - The wallet from a Prisma query
 * @returns A Wallet with proper type conversions applied
 */
function mapPrismaWallet(prismaWallet: PrismaWallet): Wallet {
  return {
    id: prismaWallet.id,
    userId: prismaWallet.userId,
    balance: prismaWallet.balance,
    reservedBalance: prismaWallet.reservedBalance,
    currency: prismaWallet.currency,
    status: prismaWallet.status,
    dailyLimit: prismaWallet.dailyLimit ?? undefined,
    monthlyLimit: prismaWallet.monthlyLimit ?? undefined,
    createdAt: prismaWallet.createdAt,
    updatedAt: prismaWallet.updatedAt,
  };
}

/**
 * Convert a Prisma WalletTransaction result to our WalletTransaction interface type
 *
 * @param prismaTx - The transaction from a Prisma query
 * @returns A WalletTransaction with proper type conversions applied
 */
function mapPrismaTransaction(
  prismaTx: PrismaWalletTransaction,
): WalletTransaction {
  return {
    id: prismaTx.id,
    walletId: prismaTx.walletId,
    payerId: prismaTx.payerId,
    payeeId: prismaTx.payeeId,
    referenceId: prismaTx.referenceId,
    idempotencyKey: prismaTx.idempotencyKey,
    type: prismaTx.type,
    flow: prismaTx.flow,
    amount: prismaTx.amount,
    balance: prismaTx.balance ?? undefined,
    currency: prismaTx.currency,
    credit: prismaTx.credit ?? undefined,
    debit: prismaTx.debit ?? undefined,
    description: prismaTx.description,
    bookingId: prismaTx.bookingId,
    paymentId: prismaTx.paymentId,
    metadata: prismaTx.metadata,
    status: prismaTx.status,
    createdAt: prismaTx.createdAt,
  };
}

enum UserType {
  CUSTOMER = "customer",
  AGENCY = "agency",
  TRAVEL_SUPPLIER = "travel_supplier",
  ADMIN = "admin",
}

enum TransactionType {
  TOPUP = "topup",
  DEBIT = "debit",
  CUSTOMER_PURCHASE = "customer_purchase",
  AGENCY_PURCHASE = "agency_purchase",
  SUPPLIER_SETTLEMENT = "supplier_settlement",
  AGENCY_COMMISSION = "agency_commission",
  REFUND = "refund",
  CHARGEBACK = "chargeback",
  INTERNAL_TRANSFER = "internal_transfer",
  FEE = "fee",
  REVERSAL = "reversal",
}

enum TransactionFlow {
  CUSTOMER_TO_SUPPLIER = "customer_to_supplier",
  SUPPLIER_TO_AGENCY = "supplier_to_agency",
  AGENCY_TO_CUSTOMER = "agency_to_customer",
  INTERNAL = "internal",
}

enum TransactionStatus {
  PENDING = "pending",
  COMPLETED = "completed",
  FAILED = "failed",
  REVERSED = "reversed",
  DISPUTED = "disputed",
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

// Wallet model (Prisma-compatible)
export interface Wallet {
  id: string;
  userId: string;
  balance: MonetaryValue; // Decimal from Prisma - use toNumber() helper for calculations
  reservedBalance: MonetaryValue; // Decimal from Prisma - required in schema
  currency: string;
  status: string;
  dailyLimit?: MonetaryValue;
  monthlyLimit?: MonetaryValue;
  createdAt: Date;
  updatedAt: Date;
}

// WalletTransaction (Prisma-compatible)
export interface WalletTransaction {
  id: string;
  walletId: string;
  payerId?: string | null;
  payeeId?: string | null;
  referenceId?: string | null;
  idempotencyKey?: string | null;
  type: string;
  flow?: string | null;
  amount: MonetaryValue; // Decimal from Prisma - use toNumber() helper for calculations
  balance?: MonetaryValue; // Optional - may not be present in all queries
  currency: string;
  credit?: MonetaryValue;
  debit?: MonetaryValue;
  description?: string | null;
  bookingId?: string | null;
  paymentId?: string | null;
  metadata?: any;
  status: string;
  createdAt: Date;
}

// WalletLedger (Prisma-compatible)
export interface WalletLedger {
  id: string;
  walletId: string;
  transactionId: string;
  entryType: string; // debit, credit
  amount: MonetaryValue; // Decimal from Prisma - use toNumber() helper for calculations
  balance: MonetaryValue; // Decimal from Prisma - required in schema
  currency: string;
  credit?: MonetaryValue;
  debit?: MonetaryValue;
  accountType: string; // main, pending, held, reserve
  account?: string | null; // Legacy
  createdAt: Date;
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
  status: "active" | "stale" | "error";
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

interface TransferOptions {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}

// Multi-party transaction flows
interface CustomerPurchaseFlow {
  customerId: string;
  agencyId: string;
  supplierId: string;
  amount: number;
  currency: string;
  bookingId: string;
  commissionRate: number; // agency commission percentage
  idempotencyKey: string;
}

interface SupplierSettlementFlow {
  supplierId: string;
  agencyId: string;
  settlementAmount: number;
  currency: string;
  invoiceId: string;
  deductedCommission: number;
  idempotencyKey: string;
}

interface RefundOptions {
  originalTransactionId: string;
  userId: string;
  amount?: number; // null for full refund
  reason: string;
  idempotencyKey: string;
}

// API Request/Response types

interface TopupRequest {
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
  reason: string;
  idempotencyKey: string;
}

interface WalletTransferRequest {
  userId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  idempotencyKey: string;
}

interface TransferResponse {
  success: boolean;
  transaction?: Transaction;
  error?: string;
}

interface WalletBalanceResponse {
  walletId: string;
  currency: string;
  balance: number;
  status: string;
}

interface TransactionHistoryRequest {
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
  balance?: number; // Optional - can be calculated from wallet balance
  currency: string;
  payerId?: string;
  payeeId?: string;
  bookingId?: string;
  paymentId?: string;
  idempotencyKey?: string;
  status?: string;
}

export default {
  UserType,
  TransactionType,
  TransactionFlow,
  TransactionStatus,
};
