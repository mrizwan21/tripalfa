/**
 * Main export file for the Rules Engine package (@tripalfa/rules)
 *
 * Exports all types, services, utilities, and middleware for pricing, deal management, commission, and analytics.
 */

// Types
export * from './types';

// Services
export { RuleMatchingEngine } from './services/ruleMatchingEngine';
export { PricingEngine } from './services/pricingEngine';
export { DealService } from './services/dealService';
export { DealMatchingEngine } from './services/dealMatchingEngine';
export { CommissionManager } from './services/commissionManager';
export { AnalyticsService } from './services/analyticsService';
export { PLBService } from './services/plbService';
export { MarkupService } from './services/markupService';
export { AirlineDealsService } from './services/airlineDealsService';

// Utilities
export * from './utils';

// Middleware
export {
  createPricingCalculationMiddleware,
  createRuleValidationMiddleware,
  createCouponValidationMiddleware,
  createRuleEngineErrorHandler
} from './middleware';

// Re-export commonly used items for convenience
export type {
  MarkupRule,
  CommissionRule,
  DiscountCoupon,
  PricingCalculationRequest,
  PricingCalculationResponse,
  LoyaltyTier,
  CustomerLoyalty,
  RuleMatchContext,
  CorporateContract,
  SupplierDeal,
  SupplierDealCreate,
  SupplierDealUpdate,
  DealMatchResult,
  SearchCriteria,
  CustomerContext,
  DealMappingRules,
  DealPerformance,
  DashboardOverview,
  AnalyticsEvent,
  PLBProgram,
  PLBTier,
  PLBSnapshot,
  PLBCalculationBreakdown,
  AirlinePerformance,
  AirlineDealCategory,
  AirlineDealMetadata,
  AirlineDeal,
  AirlineDealCreate,
  AirlineDealUpdate,
  PrivateFareConfig,
  NDCSpecialDeal,
  AirlineContract
} from './types';

export {
  RuleEngineError,
  RuleNotFoundError,
  InvalidRuleError,
  InvalidCouponError,
  CouponNotFoundError,
  PricingCalculationError,
  LoyaltyError,
  TaxCalculationError,
  RuleMatchingError
} from './errors';
