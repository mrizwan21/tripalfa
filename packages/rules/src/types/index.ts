/**
 * Type definitions for the Rules Engine package
 */

export * from "./rules";
export * from "./coupon";
export * from "./pricing";
export * from "./loyalty";
export * from "./deals";
export * from "./analytics";
export * from "./plb";

// Re-export commonly used types for convenience
export type {
  MarkupRule,
  MarkupRuleCreate,
  MarkupRuleUpdate,
  MarkupType,
  MarkupConditions,
  CommissionRule,
  CommissionRuleCreate,
  CommissionRuleUpdate,
  CommissionType,
  CommissionConditions,
  CommissionTargetType,
  CommissionSettlement,
  RuleMatchContext,
} from "./rules";

export type {
  DiscountCoupon,
  DiscountCouponCreate,
  DiscountCouponUpdate,
  CouponRedemption,
  CouponValidation,
  CouponValidationResult,
  DiscountType,
  RedemptionStatus,
} from "./coupon";

export type {
  PricingCalculationRequest,
  PricingCalculationResponse,
  AppliedRules,
  CorporateContract,
  CorporateContractCreate,
  CorporateContractUpdate,
  PricingAuditLog,
  PricingAuditLogCreate,
  TaxDefinition,
  TaxDefinitionCreate,
  TaxDefinitionUpdate,
  TaxCalculation,
  TaxReclamationClaim,
  TaxReclamationClaimCreate,
} from "./pricing";

export type {
  LoyaltyTier,
  CustomerLoyalty,
  LoyaltyTransaction,
  LoyaltyTransactionCreate,
} from "./loyalty";

export type {
  AirlineDealCategory,
  AirlineDealMetadata,
  AirlineDeal,
  AirlineDealCreate,
  AirlineDealUpdate,
  PrivateFareConfig,
  NDCSpecialDeal,
  AirlineContract,
} from "./deals";
