import { MarkupRule, CommissionRule } from "./rules";
import { DiscountCoupon } from "./coupon";
import { LoyaltyTier } from "./loyalty";

/**
 * Pricing calculation request
 */
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

/**
 * Pricing calculation response with breakdown
 */
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

/**
 * Applied rules in pricing calculation
 */
export interface AppliedRules {
  markupRule?: MarkupRule;
  discountCoupon?: DiscountCoupon;
  commissionRule?: CommissionRule;
  corporateContract?: any;
  loyaltyTier?: LoyaltyTier;
}

/**
 * Corporate contract
 */
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

/**
 * Pricing audit log
 */
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

/**
 * Tax-related types
 */
export type TaxType = "vat" | "gst" | "sales_tax" | "service_tax" | "other";
export type ReclaimStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "partially_approved";
export type ClaimStatus =
  | "submitted"
  | "in_review"
  | "approved"
  | "rejected"
  | "paid";

export interface TaxDefinition {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: TaxType;
  category: string;
  country?: string;
  region?: string;
  defaultRate: number;
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

export interface TaxCalculation {
  id: string;
  bookingId: string;
  taxDefinitionId: string;
  baseAmount: number;
  rate: number;
  taxAmount: number;
  currency: string;
  isReclaimable: boolean;
  reclaimAmount?: number;
  reclaimStatus?: ReclaimStatus;
  ruleApplied?: Record<string, unknown>;
  createdAt: string;
}

export interface TaxReclamationClaim {
  id: string;
  taxCalculationId: string;
  claimRef: string;
  status: ClaimStatus;
  claimAmount: number;
  approvedAmount?: number;
  currency: string;
  submittedAt: string;
  submittedBy: string;
  processedAt?: string;
  processedBy?: string;
  documents?: {
    name: string;
    url: string;
    type: string;
  }[];
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
  documents?: {
    name: string;
    url: string;
    type: string;
  }[];
  notes?: string;
  metadata?: Record<string, unknown>;
}
