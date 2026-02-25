import { Request, Response, NextFunction } from 'express';
import { PricingEngine } from '../services/pricingEngine';
import { PricingCalculationRequest } from '../types';

/**
 * Pricing calculation middleware
 */
export function createPricingCalculationMiddleware(
  pricingEngine: PricingEngine
) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const calculationRequest: PricingCalculationRequest = req.body;

      // Validate request
      if (!calculationRequest.bookingType || calculationRequest.baseAmount === undefined) {
        return res.status(400).json({
          error: 'Missing required fields: bookingType, baseAmount'
        });
      }

      // Calculate pricing
      const pricing = await pricingEngine.calculatePricing(calculationRequest);

      // Attach to request for further processing
      (req as any).pricing = pricing;
      next();
    } catch (error) {
      res.status(500).json({
        error: 'Pricing calculation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Rule validation middleware
 */
export function createRuleValidationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const rule = req.body;

      // Basic validation
      if (!rule.name || !rule.code) {
        return res.status(400).json({
          error: 'Invalid rule: missing name or code'
        });
      }

      if (rule.priority === undefined || typeof rule.priority !== 'number') {
        return res.status(400).json({
          error: 'Invalid rule: priority must be a number'
        });
      }

      if (!Array.isArray(rule.applicableTo) || rule.applicableTo.length === 0) {
        return res.status(400).json({
          error: 'Invalid rule: applicableTo must be a non-empty array'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'Rule validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Coupon validation middleware
 */
export function createCouponValidationMiddleware() {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const coupon = req.body;

      // Basic validation
      if (!coupon.code || !coupon.name) {
        return res.status(400).json({
          error: 'Invalid coupon: missing code or name'
        });
      }

      if (!coupon.discountType || !['percentage', 'fixed'].includes(coupon.discountType)) {
        return res.status(400).json({
          error: 'Invalid coupon: discountType must be "percentage" or "fixed"'
        });
      }

      if (coupon.discountValue === undefined || coupon.discountValue < 0) {
        return res.status(400).json({
          error: 'Invalid coupon: discountValue must be >= 0'
        });
      }

      if (!coupon.validFrom || !coupon.validTo) {
        return res.status(400).json({
          error: 'Invalid coupon: validFrom and validTo dates are required'
        });
      }

      next();
    } catch (error) {
      res.status(500).json({
        error: 'Coupon validation failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  };
}

/**
 * Error handling middleware for rules engine
 */
export function createRuleEngineErrorHandler() {
  return (error: Error, _req: Request, res: Response, _next: NextFunction) => {
    const statusCode = (error as any).statusCode || 500;
    const code = (error as any).code || 'UNKNOWN_ERROR';

    res.status(statusCode).json({
      error: error.message,
      code,
      details: (error as any).details
    });
  };
}
