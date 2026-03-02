/**
 * Error classes for the Rules Engine package
 */

/**
 * Base error for all rule-related errors
 */
export class RuleEngineError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 400,
    public readonly details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "RuleEngineError";
    Object.setPrototypeOf(this, RuleEngineError.prototype);
  }
}

/**
 * Thrown when a rule is not found
 */
export class RuleNotFoundError extends RuleEngineError {
  constructor(ruleId: string) {
    super(`Rule with ID '${ruleId}' not found`, "RULE_NOT_FOUND", 404, {
      ruleId,
    });
    this.name = "RuleNotFoundError";
    Object.setPrototypeOf(this, RuleNotFoundError.prototype);
  }
}

/**
 * Thrown when a rule is invalid
 */
export class InvalidRuleError extends RuleEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "INVALID_RULE", 400, details);
    this.name = "InvalidRuleError";
    Object.setPrototypeOf(this, InvalidRuleError.prototype);
  }
}

/**
 * Thrown when a coupon is invalid or expired
 */
export class InvalidCouponError extends RuleEngineError {
  constructor(code: string, reason: string) {
    super(`Coupon '${code}' is invalid: ${reason}`, "INVALID_COUPON", 400, {
      code,
      reason,
    });
    this.name = "InvalidCouponError";
    Object.setPrototypeOf(this, InvalidCouponError.prototype);
  }
}

/**
 * Thrown when a coupon is not found
 */
export class CouponNotFoundError extends RuleEngineError {
  constructor(code: string) {
    super(`Coupon with code '${code}' not found`, "COUPON_NOT_FOUND", 404, {
      code,
    });
    this.name = "CouponNotFoundError";
    Object.setPrototypeOf(this, CouponNotFoundError.prototype);
  }
}

/**
 * Thrown when pricing calculation fails
 */
export class PricingCalculationError extends RuleEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "PRICING_CALCULATION_ERROR", 400, details);
    this.name = "PricingCalculationError";
    Object.setPrototypeOf(this, PricingCalculationError.prototype);
  }
}

/**
 * Thrown when loyalty operation fails
 */
export class LoyaltyError extends RuleEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "LOYALTY_ERROR", 400, details);
    this.name = "LoyaltyError";
    Object.setPrototypeOf(this, LoyaltyError.prototype);
  }
}

/**
 * Thrown when tax calculation fails
 */
export class TaxCalculationError extends RuleEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "TAX_CALCULATION_ERROR", 400, details);
    this.name = "TaxCalculationError";
    Object.setPrototypeOf(this, TaxCalculationError.prototype);
  }
}

/**
 * Thrown when a rule matching operation fails
 */
export class RuleMatchingError extends RuleEngineError {
  constructor(message: string, details?: Record<string, unknown>) {
    super(message, "RULE_MATCHING_ERROR", 400, details);
    this.name = "RuleMatchingError";
    Object.setPrototypeOf(this, RuleMatchingError.prototype);
  }
}
