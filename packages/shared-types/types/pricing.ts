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
} from "./enums";

// ============================================================================
// Markup Rule Types
// ============================================================================
export interface MarkupConditions {
  supplierCode?: string[];
  fareClass?: string[];
  advanceBookingDays?: { min?: number; max?: number };
  travelDateRange?: { from: string; to: string };
  cabinClass?: string[];
  routeType?: "domestic" | "international" | "all";
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
  errorCode?:
    | "INVALID_CODE"
    | "EXPIRED"
    | "USAGE_LIMIT"
    | "MIN_AMOUNT"
    | "NOT_APPLICABLE";
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
    type: "base" | "markup" | "tax" | "discount" | "fee";
  }[];
}

// ============================================================================
// Loyalty System Types
// ============================================================================
export interface LoyaltyTier {
  id: string;
  name: string;
  tierLevel: number;
  minPoints: number;
  maxPoints?: number;
  discountPercentage: number;
  pointsMultiplier: number;
  freeCancellation: boolean;
  prioritySupport: boolean;
  freeUpgrades: boolean;
  loungeAccess: boolean;
  benefits?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoyalty {
  id: string;
  userId: string;
  currentTierId?: string;
  currentTier?: LoyaltyTier;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  tierQualifiedAt?: string;
  nextTierPointsNeeded?: number;
  pointsExpiringSoon: number;
  pointsExpiryDate?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

export interface LoyaltyTransaction {
  id: string;
  userId: string;
  bookingId?: string;
  transactionType: "earn" | "redeem" | "expire" | "bonus" | "adjustment";
  points: number;
  description: string;
  balanceAfter: number;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LoyaltyTransactionCreate {
  userId: string;
  bookingId?: string;
  transactionType: "earn" | "redeem" | "expire" | "bonus" | "adjustment";
  points: number;
  description: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}

// ============================================================================
// Corporate Contract Types
// ============================================================================
export interface CorporateContract {
  id: string;
  companyId: string;
  contractNumber: string;
  name: string;
  contractType: "volume" | "preferred" | "enterprise";
  status: "draft" | "active" | "expired" | "cancelled";
  baseDiscountPercentage: number;
  serviceDiscounts?: Record<string, unknown>;
  volumeTiers?: Record<string, unknown>;
  creditLimit?: number;
  paymentTerms?: string;
  monthlyMinimum?: number;
  validFrom: string;
  validTo?: string;
  autoRenew: boolean;
  approvedBy?: string;
  approvedAt?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: string;
  updatedBy?: string;
}

export interface CorporateContractCreate {
  companyId: string;
  contractNumber: string;
  name: string;
  contractType: "volume" | "preferred" | "enterprise";
  baseDiscountPercentage?: number;
  serviceDiscounts?: Record<string, unknown>;
  volumeTiers?: Record<string, unknown>;
  creditLimit?: number;
  paymentTerms?: string;
  monthlyMinimum?: number;
  validFrom: string;
  validTo?: string;
  autoRenew?: boolean;
  approvalNotes?: string;
}

export interface CorporateContractUpdate {
  name?: string;
  contractType?: "volume" | "preferred" | "enterprise";
  status?: "draft" | "active" | "expired" | "cancelled";
  baseDiscountPercentage?: number;
  serviceDiscounts?: Record<string, unknown>;
  volumeTiers?: Record<string, unknown>;
  creditLimit?: number;
  paymentTerms?: string;
  monthlyMinimum?: number;
  validFrom?: string;
  validTo?: string;
  autoRenew?: boolean;
  approvalNotes?: string;
}

// ============================================================================
// Pricing Audit Log Types
// ============================================================================
export interface PricingAuditLog {
  id: string;
  bookingId?: string;
  baseAmount: number;
  markupAmount: number;
  discountAmount: number;
  commissionAmount: number;
  loyaltyDiscount: number;
  finalAmount: number;
  currency: string;
  markupRulesApplied?: unknown[];
  discountRulesApplied?: unknown[];
  commissionRulesApplied?: unknown[];
  corporateContractApplied?: Record<string, unknown>;
  loyaltyTierApplied?: Record<string, unknown>;
  priceBreakdown?: Record<string, unknown>;
  createdAt: string;
}

export interface PricingAuditLogCreate {
  bookingId?: string;
  baseAmount: number;
  markupAmount: number;
  discountAmount: number;
  commissionAmount: number;
  loyaltyDiscount: number;
  finalAmount: number;
  currency: string;
  markupRulesApplied?: unknown[];
  discountRulesApplied?: unknown[];
  commissionRulesApplied?: unknown[];
  corporateContractApplied?: Record<string, unknown>;
  loyaltyTierApplied?: Record<string, unknown>;
  priceBreakdown?: Record<string, unknown>;
}

// ============================================================================
// Supplier Deals Types
// ============================================================================

export interface SupplierDeal {
  id: string;
  name: string;
  code: string;
  productType: "flight" | "hotel";
  supplierCodes: string[];
  dealType: "private_fare" | "ndc_special" | "corporate" | "group";
  discountType: "percentage" | "fixed" | "tiered";
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  status: "active" | "paused" | "expired" | "pending_approval";
  priority: number;
  isCombinableWithCoupons: boolean;
  validFrom: string;
  validTo: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDealCreate {
  name: string;
  code: string;
  productType: "flight" | "hotel";
  supplierCodes: string[];
  dealType: "private_fare" | "ndc_special" | "corporate" | "group";
  discountType: "percentage" | "fixed" | "tiered";
  discountValue: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  priority?: number;
  isCombinableWithCoupons?: boolean;
  validFrom: string;
  validTo: string;
  metadata?: Record<string, unknown>;
  mappingRules: DealMappingRules[];
}

export interface SupplierDealUpdate {
  name?: string;
  code?: string;
  supplierCodes?: string[];
  dealType?: "private_fare" | "ndc_special" | "corporate" | "group";
  discountType?: "percentage" | "fixed" | "tiered";
  discountValue?: number;
  maxDiscount?: number;
  minOrderAmount?: number;
  status?: "active" | "paused" | "expired" | "pending_approval";
  priority?: number;
  isCombinableWithCoupons?: boolean;
  validFrom?: string;
  validTo?: string;
  metadata?: Record<string, unknown>;
  mappingRules?: DealMappingRules[];
}

export interface DealMappingRules {
  journeyType?: "domestic" | "international" | "regional" | "all";
  bookingClasses?: string[];
  rbds?: string[];
  cabinClasses?: string[];
  originCities?: string[];
  destinationCities?: string[];
  originCountries?: string[];
  destinationCountries?: string[];
  regions?: string[];
  routes?: string[];
  channels?: string[];
  b2bCompanyIds?: string[];
  hotelCategories?: string[];
  hotelStarRatings?: number[];
  conditions?: Record<string, unknown>;
}

export interface DealApplication {
  id: string;
  dealId: string;
  bookingId?: string;
  bookingReference?: string;
  appliedAmount: number;
  originalAmount: number;
  discountAmount: number;
  currency: string;
  customerType: "b2c" | "b2b";
  customerId?: string;
  companyId?: string;
  appliedAt: string;
  metadata?: Record<string, unknown>;
}

export interface DealFilters {
  status?: string[];
  productType?: string[];
  supplierCodes?: string[];
  dealType?: string[];
  validFrom?: string;
  validTo?: string;
  priority?: { min?: number; max?: number };
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface SearchCriteria {
  productType: "flight" | "hotel";
  origin?: string;
  destination?: string;
  departureDate?: string;
  returnDate?: string;
  cabinClass?: string;
  bookingClass?: string;
  rbd?: string;
  supplierCodes?: string[];
  hotelCategory?: string;
  hotelStarRating?: number;
  route?: string;
}

export interface CustomerContext {
  type: "b2c" | "b2b";
  customerId?: string;
  companyId?: string;
  tier?: string;
  channel: string;
  loyaltyTier?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ConflictReport {
  conflictingDeals: SupplierDeal[];
  conflictReasons: string[];
  recommendations: string[];
}
