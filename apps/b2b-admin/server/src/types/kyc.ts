/**
 * KYC (Know Your Customer) Management Types
 */

export interface KYCDocument {
  id: string;
  companyId: string;
  documentType: KYCDocumentType;
  documentNumber: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  documentUrl: string;
  status: KYCDocumentStatus;
  verificationStatus?: string;
  verificationType?: string;
  transactionCount?: number;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface KYCVerification {
  id: string;
  companyId: string;
  verificationType: KYCVerificationType;
  status: KYCVerificationStatus;
  verificationData: Record<string, any>;
  verificationResult: KYCVerificationResult;
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  attempts: number;
  lastAttemptAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface KYCCompliance {
  id: string;
  companyId: string;
  complianceType: KYCComplianceType;
  status: KYCComplianceStatus;
  requirements: KYCRequirement[];
  lastCheckedAt: Date;
  nextCheckAt: Date;
  complianceScore: number;
  issues: KYCComplianceIssue[];
  createdAt: Date;
  updatedAt: Date;
}

export interface VirtualCard {
  id: string;
  companyId: string;
  cardNumber: string;
  maskedCardNumber: string;
  cvv: string;
  expiryDate: Date;
  cardholderName: string;
  currency: string;
  status: VirtualCardStatus;
  cardType: VirtualCardType;
  spendingLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  isActive: boolean;
  isBlocked: boolean;
  blockReason?: string;
  usageType: VirtualCardUsageType;
  allowedCategories: string[];
  blockedCategories: string[];
  allowedMerchants: string[];
  blockedMerchants: string[];
  allowedCountries: string[];
  blockedCountries: string[];
  allowedTimes: {
    startHour: number;
    endHour: number;
    allowedDays: number[]; // 0-6 (Sunday-Saturday)
  };
  notifications: {
    lowBalanceThreshold: number;
    transactionNotification: boolean;
    suspiciousActivityNotification: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  activatedAt?: Date;
  deactivatedAt?: Date;
  lastTransactionAt?: Date;
  transactionCount?: number;
  totalSpent?: number;
}

export interface VirtualCardTransaction {
  id: string;
  cardId: string;
  companyId: string;
  transactionType: VirtualCardTransactionType;
  amount: number;
  currency: string;
  merchantName: string;
  merchantCategory: string;
  merchantCountry: string;
  transactionDate: Date;
  authorizationCode: string;
  status: VirtualCardTransactionStatus;
  reason?: string;
  createdAt: Date;
}

export interface VirtualCardSettings {
  id: string;
  companyId: string;
  defaultSettings: {
    currency: string;
    spendingLimit: number;
    dailyLimit: number;
    monthlyLimit: number;
    perTransactionLimit: number;
    cardType: VirtualCardType;
    usageType: VirtualCardUsageType;
  };
  securitySettings: {
    requireMFA: boolean;
    requireApproval: boolean;
    maxFailedAttempts: number;
    sessionTimeout: number; // in minutes
  };
  notificationSettings: {
    emailNotifications: boolean;
    smsNotifications: boolean;
    lowBalanceThreshold: number;
    transactionThreshold: number;
    suspiciousActivityAlerts: boolean;
  };
  complianceSettings: {
    kycRequired: boolean;
    maxCardsPerCompany: number;
    maxSpendPerCard: number;
    allowedCurrencies: string[];
    restrictedCountries: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

// Enums
export enum KYCDocumentType {
  BUSINESS_REGISTRATION = 'BUSINESS_REGISTRATION',
  TAX_ID = 'TAX_ID',
  INCORPORATION_CERTIFICATE = 'INCORPORATION_CERTIFICATE',
  DIRECTOR_ID = 'DIRECTOR_ID',
  BENEFICIAL_OWNER_ID = 'BENEFICIAL_OWNER_ID',
  UTILITY_BILL = 'UTILITY_BILL',
  BANK_STATEMENT = 'BANK_STATEMENT'
}

export enum KYCDocumentStatus {
  PENDING = 'PENDING',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum KYCVerificationType {
  BUSINESS_VERIFICATION = 'BUSINESS_VERIFICATION',
  DIRECTOR_VERIFICATION = 'DIRECTOR_VERIFICATION',
  BENEFICIAL_OWNER_VERIFICATION = 'BENEFICIAL_OWNER_VERIFICATION',
  ADDRESS_VERIFICATION = 'ADDRESS_VERIFICATION'
}

export enum KYCVerificationStatus {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  VERIFIED = 'VERIFIED',
  REJECTED = 'REJECTED',
  EXPIRED = 'EXPIRED'
}

export enum KYCVerificationResult {
  PASS = 'PASS',
  FAIL = 'FAIL',
  MANUAL_REVIEW = 'MANUAL_REVIEW'
}

export enum KYCComplianceType {
  AML = 'AML', // Anti-Money Laundering
  KYC = 'KYC',
  SANCTIONS = 'SANCTIONS',
  PEP = 'PEP', // Politically Exposed Person
  CUSTOM = 'CUSTOM'
}

export enum KYCComplianceStatus {
  COMPLIANT = 'COMPLIANT',
  NON_COMPLIANT = 'NON_COMPLIANT',
  PENDING = 'PENDING',
  EXPIRED = 'EXPIRED'
}

export interface KYCRequirement {
  id: string;
  type: string;
  description: string;
  isRequired: boolean;
  validationRules: Record<string, any>;
}

export interface KYCComplianceIssue {
  id: string;
  type: string;
  description: string;
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum VirtualCardStatus {
  PENDING = 'PENDING',
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  BLOCKED = 'BLOCKED',
  EXPIRED = 'EXPIRED',
  CANCELLED = 'CANCELLED'
}

export enum VirtualCardType {
  SINGLE_USE = 'SINGLE_USE',
  MULTI_USE = 'MULTI_USE',
  RECURRING = 'RECURRING'
}

export enum VirtualCardUsageType {
  ONLINE = 'ONLINE',
  IN_STORE = 'IN_STORE',
  BOTH = 'BOTH'
}

export enum VirtualCardTransactionType {
  PURCHASE = 'PURCHASE',
  REFUND = 'REFUND',
  FEE = 'FEE',
  CHARGE = 'CHARGE'
}

export enum VirtualCardTransactionStatus {
  PENDING = 'PENDING',
  AUTHORIZED = 'AUTHORIZED',
  COMPLETED = 'COMPLETED',
  DECLINED = 'DECLINED',
  REFUNDED = 'REFUNDED',
  CHARGEBACK = 'CHARGEBACK'
}

// Request/Response Types
export interface CreateKYCDocumentRequest {
  companyId: string;
  documentType: KYCDocumentType;
  documentNumber: string;
  issueDate: Date;
  expiryDate: Date;
  issuingAuthority: string;
  documentUrl: string;
}

export interface UpdateKYCDocumentRequest {
  documentType?: KYCDocumentType;
  documentNumber?: string;
  issueDate?: Date;
  expiryDate?: Date;
  issuingAuthority?: string;
  documentUrl?: string;
  status?: KYCDocumentStatus;
  rejectionReason?: string;
}

export interface CreateVirtualCardRequest {
  companyId: string;
  cardholderName: string;
  currency: string;
  spendingLimit: number;
  dailyLimit: number;
  monthlyLimit: number;
  perTransactionLimit: number;
  cardType: VirtualCardType;
  usageType: VirtualCardUsageType;
  allowedCategories?: string[];
  blockedCategories?: string[];
  allowedCountries?: string[];
  blockedCountries?: string[];
}

export interface UpdateVirtualCardRequest {
  cardholderName?: string;
  spendingLimit?: number;
  dailyLimit?: number;
  monthlyLimit?: number;
  perTransactionLimit?: number;
  status?: VirtualCardStatus;
  isActive?: boolean;
  isBlocked?: boolean;
  blockReason?: string;
  allowedCategories?: string[];
  blockedCategories?: string[];
  allowedCountries?: string[];
  blockedCountries?: string[];
}

export interface VirtualCardQueryParams {
  companyId?: string;
  status?: VirtualCardStatus;
  cardType?: VirtualCardType;
  usageType?: VirtualCardUsageType;
  currency?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface KYCQueryParams {
  companyId?: string;
  documentType?: KYCDocumentType;
  status?: KYCDocumentStatus;
  verificationStatus?: KYCVerificationStatus;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface KYCStats {
  totalDocuments: number;
  verifiedDocuments: number;
  pendingDocuments: number;
  rejectedDocuments: number;
  expiredDocuments: number;
  verificationRate: number;
  averageProcessingTime: number; // in hours
}

export interface VirtualCardStats {
  totalCards: number;
  activeCards: number;
  blockedCards: number;
  expiredCards: number;
  totalSpend: number;
  averageSpendPerCard: number;
  utilizationRate: number;
  transactionCount: number;
}