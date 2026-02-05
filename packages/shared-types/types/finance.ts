// ============================================================================
// TripAlfa Shared Types - Finance Domain
// Wallet management with Mojaloop integration
// ============================================================================

import {
  WalletType,
  WalletStatus,
  LedgerEntryType,
  LedgerDirection,
  MojaloopStatus,
} from './enums';

// ============================================================================
// Common Financial Types
// ============================================================================
export interface InvoiceLineItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

// ============================================================================
// Wallet Types
// ============================================================================
export interface Wallet {
  id: string;
  companyId?: string;
  userId?: string;
  walletRef: string;
  type: WalletType;
  status: WalletStatus;

  // Balances
  currency: string;
  balance: number;
  availableBalance: number;
  holdBalance: number;

  // Limits
  dailyLimit?: number;
  monthlyLimit?: number;
  transactionLimit?: number;

  // Mojaloop
  mojaloopAccountId?: string;

  lastTransactionAt?: string;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface WalletCreate {
  companyId?: string;
  userId?: string;
  type: WalletType;
  currency: string;
  dailyLimit?: number;
  monthlyLimit?: number;
  transactionLimit?: number;
  metadata?: Record<string, unknown>;
}

export interface WalletUpdate {
  status?: WalletStatus;
  dailyLimit?: number;
  monthlyLimit?: number;
  transactionLimit?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Ledger Entry Types
// ============================================================================
export interface LedgerEntry {
  id: string;
  walletId: string;
  transactionId?: string;
  entryRef: string;

  type: LedgerEntryType;
  direction: LedgerDirection;

  // Amounts
  currency: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;

  // Reference
  referenceType?: string;
  referenceId?: string;

  description: string;
  notes?: string;

  // Mojaloop
  mojaloopTransferId?: string;

  createdAt: string;
}

export interface LedgerEntryCreate {
  walletId: string;
  transactionId?: string;
  type: LedgerEntryType;
  direction: LedgerDirection;
  amount: number;
  referenceType?: string;
  referenceId?: string;
  description: string;
  notes?: string;
  mojaloopTransferId?: string;
}

// ============================================================================
// Mojaloop Mapping Types
// ============================================================================
export interface MojaloopMapping {
  id: string;
  walletId: string;

  // Mojaloop identifiers
  dfspId: string;
  participantId: string;
  accountId: string;

  status: MojaloopStatus;
  verifiedAt?: string;

  config?: Record<string, unknown>;

  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MojaloopMappingCreate {
  walletId: string;
  dfspId: string;
  participantId: string;
  accountId: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export interface MojaloopMappingUpdate {
  status?: MojaloopStatus;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Wallet Operations
// ============================================================================
export interface WalletTopup {
  walletId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletWithdrawal {
  walletId: string;
  amount: number;
  currency: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    routingNumber?: string;
    swiftCode?: string;
  };
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletTransfer {
  fromWalletId: string;
  toWalletId: string;
  amount: number;
  currency: string;
  description?: string;
  metadata?: Record<string, unknown>;
}

export interface WalletHold {
  walletId: string;
  amount: number;
  currency: string;
  referenceType: string;
  referenceId: string;
  description?: string;
  expiresAt?: string;
}

export interface WalletHoldRelease {
  holdId: string;
  releaseType: 'capture' | 'release';
  captureAmount?: number;
}

// ============================================================================
// Wallet Balance Check
// ============================================================================
export interface WalletBalanceCheck {
  walletId: string;
  amount: number;
  currency: string;
}

export interface WalletBalanceCheckResult {
  sufficient: boolean;
  availableBalance: number;
  shortfall?: number;
}

// ============================================================================
// Wallet List/Search Types
// ============================================================================
export interface WalletListParams {
  page?: number;
  limit?: number;
  companyId?: string;
  userId?: string;
  type?: WalletType;
  status?: WalletStatus;
  currency?: string;
  sortBy?: 'balance' | 'createdAt' | 'lastTransactionAt';
  sortOrder?: 'asc' | 'desc';
}

export interface WalletListResponse {
  data: Wallet[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface LedgerEntryListParams {
  page?: number;
  limit?: number;
  walletId?: string;
  type?: LedgerEntryType;
  direction?: LedgerDirection;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'amount';
  sortOrder?: 'asc' | 'desc';
}

export interface LedgerEntryListResponse {
  data: LedgerEntry[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    totalCredits: number;
    totalDebits: number;
    netAmount: number;
  };
}

// ============================================================================
// Wallet with Relations
// ============================================================================
export interface WalletWithRelations extends Wallet {
  company?: {
    id: string;
    code: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  mojaloopMapping?: MojaloopMapping;
  recentEntries?: LedgerEntry[];
}

// ============================================================================
// Wallet Statistics
// ============================================================================
export interface WalletStatistics {
  walletId: string;
  period: {
    from: string;
    to: string;
  };
  summary: {
    openingBalance: number;
    closingBalance: number;
    totalCredits: number;
    totalDebits: number;
    transactionCount: number;
  };
  byType: {
    type: LedgerEntryType;
    count: number;
    totalAmount: number;
  }[];
  dailyBalances: {
    date: string;
    openingBalance: number;
    closingBalance: number;
    credits: number;
    debits: number;
  }[];
}
