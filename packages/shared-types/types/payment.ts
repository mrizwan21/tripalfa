// ============================================================================
// TripAlfa Shared Types - Payment Domain
// Payment gateways, methods, transactions, and refunds
// ============================================================================

import {
  PaymentProvider,
  PaymentGatewayType,
  GatewayStatus,
  PaymentMethodType,
  PaymentMethodStatus,
  TransactionType,
  TransactionStatus,
  RefundType,
  RefundStatus,
} from './enums';
import { Address } from './company';

// ============================================================================
// Payment Gateway Types
// ============================================================================
export interface PaymentGateway {
  id: string;
  code: string;
  name: string;
  provider: PaymentProvider;
  type: PaymentGatewayType;
  status: GatewayStatus;
  
  // Configuration
  config?: Record<string, unknown>;
  supportedCurrencies: string[];
  supportedMethods: string[];
  
  // Fees
  transactionFee?: number;
  fixedFee?: number;
  
  // Limits
  minAmount?: number;
  maxAmount?: number;
  
  // Settings
  isDefault: boolean;
  priority: number;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentGatewayCreate {
  code: string;
  name: string;
  provider: PaymentProvider;
  type?: PaymentGatewayType;
  config?: Record<string, unknown>;
  supportedCurrencies: string[];
  supportedMethods: string[];
  transactionFee?: number;
  fixedFee?: number;
  minAmount?: number;
  maxAmount?: number;
  isDefault?: boolean;
  priority?: number;
  metadata?: Record<string, unknown>;
}

export interface PaymentGatewayUpdate {
  name?: string;
  type?: PaymentGatewayType;
  status?: GatewayStatus;
  config?: Record<string, unknown>;
  supportedCurrencies?: string[];
  supportedMethods?: string[];
  transactionFee?: number;
  fixedFee?: number;
  minAmount?: number;
  maxAmount?: number;
  isDefault?: boolean;
  priority?: number;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Payment Method Types
// ============================================================================
export interface PaymentMethod {
  id: string;
  gatewayId: string;
  userId: string;
  type: PaymentMethodType;
  status: PaymentMethodStatus;
  
  // Card details (tokenized/masked)
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardHolderName?: string;
  
  // Bank details (masked)
  bankName?: string;
  accountLast4?: string;
  
  // Provider token
  providerToken?: string;
  providerCustomerId?: string;
  
  // Settings
  isDefault: boolean;
  nickname?: string;
  
  billingAddress?: Address;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface PaymentMethodCreate {
  gatewayId: string;
  userId: string;
  type: PaymentMethodType;
  cardBrand?: string;
  cardLast4?: string;
  cardExpMonth?: number;
  cardExpYear?: number;
  cardHolderName?: string;
  bankName?: string;
  accountLast4?: string;
  providerToken?: string;
  providerCustomerId?: string;
  isDefault?: boolean;
  nickname?: string;
  billingAddress?: Address;
  metadata?: Record<string, unknown>;
}

export interface PaymentMethodUpdate {
  status?: PaymentMethodStatus;
  cardExpMonth?: number;
  cardExpYear?: number;
  isDefault?: boolean;
  nickname?: string;
  billingAddress?: Address;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Transaction Types
// ============================================================================
export interface Transaction {
  id: string;
  transactionRef: string;
  bookingId?: string;
  userId: string;
  gatewayId: string;
  paymentMethodId?: string;
  
  type: TransactionType;
  status: TransactionStatus;
  
  // Amounts
  currency: string;
  amount: number;
  fee: number;
  netAmount: number;
  
  // Exchange rate
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  
  // Provider response
  providerRef?: string;
  providerStatus?: string;
  providerResponse?: Record<string, unknown>;
  
  // Error handling
  errorCode?: string;
  errorMessage?: string;
  
  // 3DS
  requires3ds: boolean;
  threeDsStatus?: string;
  
  // Context
  ipAddress?: string;
  userAgent?: string;
  
  // Timestamps
  processedAt?: string;
  completedAt?: string;
  failedAt?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TransactionCreate {
  bookingId?: string;
  userId: string;
  gatewayId: string;
  paymentMethodId?: string;
  type: TransactionType;
  currency: string;
  amount: number;
  originalCurrency?: string;
  originalAmount?: number;
  exchangeRate?: number;
  ipAddress?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
}

export interface TransactionUpdate {
  status?: TransactionStatus;
  providerRef?: string;
  providerStatus?: string;
  providerResponse?: Record<string, unknown>;
  errorCode?: string;
  errorMessage?: string;
  threeDsStatus?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Refund Types
// ============================================================================
export interface Refund {
  id: string;
  refundRef: string;
  transactionId: string;
  
  type: RefundType;
  status: RefundStatus;
  reason: string;
  
  // Amounts
  currency: string;
  requestedAmount: number;
  approvedAmount?: number;
  refundedAmount?: number;
  
  // Processing
  requestedBy: string;
  requestedAt: string;
  approvedBy?: string;
  approvedAt?: string;
  processedAt?: string;
  
  // Provider
  providerRef?: string;
  providerStatus?: string;
  providerResponse?: Record<string, unknown>;
  
  rejectionReason?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface RefundCreate {
  transactionId: string;
  type: RefundType;
  reason: string;
  currency: string;
  requestedAmount: number;
  metadata?: Record<string, unknown>;
}

export interface RefundUpdate {
  status?: RefundStatus;
  approvedAmount?: number;
  refundedAmount?: number;
  approvedBy?: string;
  providerRef?: string;
  providerStatus?: string;
  providerResponse?: Record<string, unknown>;
  rejectionReason?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Payment Processing Types
// ============================================================================
export interface PaymentIntent {
  gatewayId: string;
  amount: number;
  currency: string;
  paymentMethodId?: string;
  bookingId?: string;
  userId: string;
  returnUrl?: string;
  metadata?: Record<string, unknown>;
}

export interface PaymentIntentResponse {
  transactionId: string;
  transactionRef: string;
  status: TransactionStatus;
  clientSecret?: string;
  redirectUrl?: string;
  requires3ds: boolean;
}

export interface PaymentConfirmation {
  transactionId: string;
  paymentMethodId?: string;
  threeDsData?: {
    version: string;
    authenticationValue: string;
    transactionId: string;
  };
}

export interface PaymentConfirmationResponse {
  transactionId: string;
  status: TransactionStatus;
  providerRef?: string;
  errorMessage?: string;
}

// ============================================================================
// Transaction List/Search Types
// ============================================================================
export interface TransactionListParams {
  page?: number;
  limit?: number;
  search?: string;
  userId?: string;
  bookingId?: string;
  gatewayId?: string;
  type?: TransactionType;
  status?: TransactionStatus;
  fromDate?: string;
  toDate?: string;
  minAmount?: number;
  maxAmount?: number;
  sortBy?: 'createdAt' | 'amount' | 'transactionRef';
  sortOrder?: 'asc' | 'desc';
}

export interface TransactionListResponse {
  data: Transaction[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  summary?: {
    totalAmount: number;
    totalFees: number;
    transactionCount: number;
  };
}

// ============================================================================
// Transaction with Relations
// ============================================================================
export interface TransactionWithRelations extends Transaction {
  gateway?: PaymentGateway;
  paymentMethod?: PaymentMethod;
  refunds?: Refund[];
  booking?: {
    id: string;
    bookingRef: string;
    type: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
}
