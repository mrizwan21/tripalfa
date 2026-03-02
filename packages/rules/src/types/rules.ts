export type MarkupType = "percentage" | "fixed" | "multiplier";
export type CommissionType = "percentage" | "fixed";
export type CommissionCalculationType = "percentage" | "fixed" | "tiered";
export type CommissionTargetType =
  | "supplier"
  | "company"
  | "platform"
  | "partner";
export type DiscountType = "percentage" | "fixed";

/**
 * Rule matching context for determining applicable rules
 */
export interface RuleMatchContext {
  serviceType?: string;
  supplierCode?: string;
  fareClass?: string;
  advanceBookingDays?: number;
  travelDate?: Date;
  cabinClass?: string;
  routeType?: "domestic" | "international" | "all";
  amount?: number;
  bookingType?: string;
  companyId?: string;
  branchId?: string;
  userId?: string;
  supplierId?: string;
  [key: string]: any;
}

/**
 * Conditions for markup rule application
 */
export interface MarkupConditions {
  supplierCode?: string[];
  fareClass?: string[];
  advanceBookingDays?: {
    min?: number;
    max?: number;
  };
  travelDateRange?: {
    from: string;
    to: string;
  };
  cabinClass?: string[];
  routeType?: "domestic" | "international" | "all";
  [key: string]: unknown;
}

/**
 * Markup rule definition
 */
export interface MarkupRule {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  priority: number;
  applicableTo: string[];
  serviceTypes: string[];
  markupType: MarkupType;
  markupValue: number;
  minMarkup?: number;
  maxMarkup?: number;
  conditions?: MarkupConditions;
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

/**
 * Conditions for commission rule application
 */
export interface CommissionConditions {
  supplierCode?: string[];
  volumeThreshold?: {
    min?: number;
    max?: number;
  };
  fareClass?: string[];
  [key: string]: unknown;
}

/**
 * Commission rule definition
 */
export interface CommissionRule {
  id: string;
  companyId?: string;
  name: string;
  code: string;
  priority: number;
  applicableTo: string[];
  serviceTypes: string[];
  commissionType: CommissionType;
  commissionValue: number;
  minCommission?: number;
  maxCommission?: number;
  targetType: CommissionTargetType;
  targetId?: string;
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

/**
 * Commission settlement record
 */
export interface CommissionSettlement {
  id: string;
  commissionRuleId?: string;
  bookingId: string;
  baseAmount?: number;
  bookingAmount?: number;
  supplierId?: string;
  commissionAmount: number;
  currency?: string;
  calculationType?: CommissionCalculationType;
  status: "pending" | "settled" | "failed" | "paid" | "cancelled";
  notes?: string;
  settledAmount?: number;
  settledAt?: string;
  settlementRef?: string;
  targetType?: CommissionTargetType;
  targetId?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}
