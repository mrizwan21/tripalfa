export type DiscountType = 'percentage' | 'fixed';
export type RedemptionStatus = 'pending' | 'redeemed' | 'reversed' | 'expired';

/**
 * Coupon discount conditions
 */
export interface DiscountConditions {
  firstBookingOnly?: boolean;
  specificRoutes?: string[];
  excludedRoutes?: string[];
  [key: string]: unknown;
}

/**
 * Discount coupon definition
 */
export interface DiscountCoupon {
  id: string;
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
  perUserLimit: number;
  currentUsage: number;
  isActive: boolean;
  validFrom: string;
  validTo: string;
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

/**
 * Coupon redemption record
 */
export interface CouponRedemption {
  id: string;
  couponId: string;
  userId: string;
  bookingId: string;
  originalAmount: number;
  discountAmount: number;
  finalAmount: number;
  currency: string;
  status: RedemptionStatus;
  reversedAt?: string;
  reverseReason?: string;
  createdAt: string;
}

/**
 * Coupon validation request
 */
export interface CouponValidation {
  code: string;
  userId: string;
  bookingType: string;
  amount: number;
  currency: string;
}

/**
 * Coupon validation result
 */
export interface CouponValidationResult {
  valid: boolean;
  coupon?: DiscountCoupon;
  discountAmount?: number;
  errorMessage?: string;
  errorCode?: 'INVALID_CODE' | 'EXPIRED' | 'USAGE_LIMIT' | 'MIN_AMOUNT' | 'NOT_APPLICABLE';
}
