// ============================================================================
// TripAlfa Shared Types - Pricing Domain
// Markup, Commission, Tax, and Discount management
// ============================================================================

import {
  MarkupType,
  CommissionType,
  CommissionTargetType,
  SettlementStatus,
  DiscountType,
  RedemptionStatus,
  TaxType,
  ReclaimStatus,
  ClaimStatus,
} from './enums';

// ============================================================================
// Markup Rule Types
// ============================================================================
export interface MarkupConditions {
  supplierCode?: string[];
  fareClass?: string[];
  advanceBookingDays?: { min?: number; max?: number };
  travelDateRange?: { from: string; to: string };
  cabinClass?: string[];
  routeType?: 'domestic' | 'international' | 'all';
  [key: string]: unknown;
}

export interface MarkupRule {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  priority: number;
  
  // Scope
  applicableTo: string[];
  serviceTypes: string[];
  
  // Markup
  markupType: MarkupType;
  markupValue: number;
  minMarkup?: number;
  maxMarkup?: number;
  
  // Conditions
  conditions?: MarkupConditions;
  
  // Applicability
  supplierIds: string[];
  branchIds: string[];
  userIds: string[];
  
  isActive: boolean;
  validFrom: string;
  validTo?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface MarkupRuleCreate {
  companyId?: string;
  name: string;
  code: string;
  priority?: number;
  applicableTo: string[];
  serviceTypes?: string[];
  markupType: MarkupType;
  markupValue: number;
  minMarkup?: number;
  maxMarkup?: number;
  conditions?: MarkupConditions;
  supplierIds?: string[];
  branchIds?: string[];
  userIds?: string[];
  validFrom: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
}

export interface MarkupRuleUpdate {
  name?: string;
  priority?: number;
  applicableTo?: string[];
  serviceTypes?: string[];
  markupType?: MarkupType;
  markupValue?: number;
  minMarkup?: number;
  maxMarkup?: number;
  conditions?: MarkupConditions;
  supplierIds?: string[];
  branchIds?: string[];
  userIds?: string[];
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Commission Rule Types
// ============================================================================
export interface CommissionConditions {
  supplierCode?: string[];
  volumeThreshold?: { min?: number; max?: number };
  fareClass?: string[];
  [key: string]: unknown;
}

export interface CommissionRule {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  priority: number;
  
  // Scope
  applicableTo: string[];
  serviceTypes: string[];
  
  // Commission
  commissionType: CommissionType;
  commissionValue: number;
  minCommission?: number;
  maxCommission?: number;
  
  // Target
  targetType: CommissionTargetType;
  targetId?: string;
  
  // Conditions
  conditions?: CommissionConditions;
  supplierIds: string[];
  
  isActive: boolean;
  validFrom: string;
  validTo?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface CommissionRuleCreate {
  companyId?: string;
  name: string;
  code: string;
  priority?: number;
  applicableTo: string[];
  serviceTypes?: string[];
  commissionType: CommissionType;
  commissionValue: number;
  minCommission?: number;
  maxCommission?: number;
  targetType: CommissionTargetType;
  targetId?: string;
  conditions?: CommissionConditions;
  supplierIds?: string[];
  validFrom: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
}

export interface CommissionRuleUpdate {
  name?: string;
  priority?: number;
  applicableTo?: string[];
  serviceTypes?: string[];
  commissionType?: CommissionType;
  commissionValue?: number;
  minCommission?: number;
  maxCommission?: number;
  targetType?: CommissionTargetType;
  targetId?: string;
  conditions?: CommissionConditions;
  supplierIds?: string[];
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Commission Settlement Types
// ============================================================================
export interface CommissionSettlement {
  id: string;
  commissionRuleId: string;
  bookingId: string;
  
  // Amounts
  baseAmount: number;
  commissionAmount: number;
  currency: string;
  
  // Settlement
  status: SettlementStatus;
  settledAmount?: number;
  settledAt?: string;
  settlementRef?: string;
  
  // Target
  targetType: CommissionTargetType;
  targetId: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

// ============================================================================
// Discount Coupon Types
// ============================================================================
export interface DiscountConditions {
  firstBookingOnly?: boolean;
  specificRoutes?: string[];
  excludedRoutes?: string[];
  [key: string]: unknown;
}

export interface DiscountCoupon {
  id: string;
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  
  // Discount
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  
  // Conditions
  minOrderAmount?: number;
  applicableTo: string[];
  conditions?: DiscountConditions;
  
  // Usage limits
  totalUsageLimit?: number;
  perUserLimit: number;
  currentUsage: number;
  
  // Validity
  isActive: boolean;
  validFrom: string;
  validTo: string;
  
  // Restrictions
  allowedUserIds: string[];
  excludedUserIds: string[];
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface DiscountCouponCreate {
  companyId?: string;
  code: string;
  name: string;
  description?: string;
  discountType: DiscountType;
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  applicableTo: string[];
  conditions?: DiscountConditions;
  totalUsageLimit?: number;
  perUserLimit?: number;
  validFrom: string;
  validTo: string;
  allowedUserIds?: string[];
  excludedUserIds?: string[];
  metadata?: Record<string, unknown>;
}

export interface DiscountCouponUpdate {
  name?: string;
  description?: string;
  discountType?: DiscountType;
  discountValue?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  applicableTo?: string[];
  conditions?: DiscountConditions;
  totalUsageLimit?: number;
  perUserLimit?: number;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  allowedUserIds?: string[];
  excludedUserIds?: string[];
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Coupon Redemption Types
// ============================================================================
export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  bookingId: string;
  
  // Discount applied
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  
  // Status
  status: RedemptionStatus;
  reversedAt?: string;
  reverseReason?: string;
  
  createdAt: string;
}

// ============================================================================
// Coupon Validation
// ============================================================================
export interface CouponValidation {
  code: string;
  userId: string;
  bookingType: string;
  amount: number;
  currency: string;
}

export interface CouponValidationResult {
  valid: boolean;
  coupon?: DiscountCoupon;
  discountAmount?: number;
  errorMessage?: string;
  errorCode?: 'INVALID_CODE' | 'EXPIRED' | 'USAGE_LIMIT' | 'MIN_AMOUNT' | 'NOT_APPLICABLE';
}

// ============================================================================
// Tax Definition Types
// ============================================================================
export interface TaxDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: TaxType;
  category: string;
  
  // Jurisdiction
  country?: string;
  region?: string;
  
  // Default rate
  defaultRate: number;
  
  // Reclamation
  isReclaimable: boolean;
  reclaimRate?: number;
  
  isActive: boolean;
  validFrom: string;
  validTo?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaxDefinitionCreate {
  code: string;
  name: string;
  description?: string;
  type: TaxType;
  category: string;
  country?: string;
  region?: string;
  defaultRate: number;
  isReclaimable?: boolean;
  reclaimRate?: number;
  validFrom: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
}

export interface TaxDefinitionUpdate {
  name?: string;
  description?: string;
  type?: TaxType;
  category?: string;
  defaultRate?: number;
  isReclaimable?: boolean;
  reclaimRate?: number;
  isActive?: boolean;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Tax Calculation Types
// ============================================================================
export interface TaxCalculation {
  id: string;
  bookingId: string;
  taxDefinitionId: string;
  
  // Calculation
  baseAmount: number;
  rate: number;
  taxAmount: number;
  currency: string;
  
  // Reclamation
  isReclaimable: boolean;
  reclaimAmount?: number;
  reclaimStatus?: ReclaimStatus;
  
  // Audit
  ruleApplied?: Record<string, unknown>;
  
  createdAt: string;
}

// ============================================================================
// Tax Reclamation Types
// ============================================================================
export interface TaxReclamationClaim {
  id: string;
  taxCalculationId: string;
  claimRef: string;
  status: ClaimStatus;
  
  // Amounts
  claimAmount: number;
  approvedAmount?: number;
  currency: string;
  
  // Processing
  submittedAt: string;
  submittedBy: string;
  processedAt?: string;
  processedBy?: string;
  
  // Documentation
  documents?: { name: string; url: string; type: string }[];
  notes?: string;
  rejectionReason?: string;
  
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface TaxReclamationClaimCreate {
  taxCalculationId: string;
  claimAmount: number;
  currency: string;
  documents?: { name: string; url: string; type: string }[];
  notes?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Pricing Calculation Request/Response
// ============================================================================
export interface PricingCalculationRequest {
  bookingType: string;
  baseAmount: number;
  currency: string;
  companyId?: string;
  branchId?: string;
  userId?: string;
  supplierId?: string;
  serviceDetails?: Record<string, unknown>;
  couponCode?: string;
}

export interface PricingCalculationResponse {
  baseAmount: number;
  markup: number;
  markupRuleId?: string;
  taxes: TaxCalculation[];
  totalTax: number;
  discount: number;
  couponId?: string;
  commission: number;
  commissionRuleId?: string;
  totalAmount: number;
  breakdown: {
    label: string;
    amount: number;
    type: 'base' | 'markup' | 'tax' | 'discount' | 'fee';
  }[];
}

// ============================================================================
// Pricing Rule List Types
// ============================================================================
export interface MarkupRuleListParams {
  page?: number;
  limit?: number;
  companyId?: string;
  applicableTo?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface CommissionRuleListParams {
  page?: number;
  limit?: number;
  companyId?: string;
  applicableTo?: string;
  targetType?: CommissionTargetType;
  isActive?: boolean;
  sortBy?: 'name' | 'priority' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}

export interface DiscountCouponListParams {
  page?: number;
  limit?: number;
  companyId?: string;
  search?: string;
  applicableTo?: string;
  isActive?: boolean;
  sortBy?: 'name' | 'code' | 'validFrom' | 'createdAt';
  sortOrder?: 'asc' | 'desc';
}
