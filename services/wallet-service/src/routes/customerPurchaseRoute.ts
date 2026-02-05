// src/routes/customerPurchaseRoute.ts
// POST /api/wallet/purchase
// Customer purchase flow: customer -> agency -> supplier with commission deduction

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import walletService from '../services/walletService.js';
import { authMiddleware } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();
const SERVICE_NAME = 'customerPurchaseRoute';

// Type definitions
interface PurchaseRequestBody {
  amount: number;
  currency: string;
  agencyId: string;
  supplierId: string;
  bookingId: string;
  commissionRate: number;
  idempotencyKey: string;
}

// Validation schema
const purchaseSchema = Joi.object({
  amount: Joi.number().positive().required(),
  currency: Joi.string().length(3).uppercase().required(),
  agencyId: Joi.string().uuid().required(),
  supplierId: Joi.string().uuid().required(),
  bookingId: Joi.string().required(),
  commissionRate: Joi.number().min(0).max(100).required(),
  idempotencyKey: Joi.string().uuid().required(),
});

/**
 * POST /api/wallet/purchase
 * Customer purchase with agency intermediary and supplier settlement
 */
router.post('/purchase', authMiddleware, async (req: Request, res: Response): Promise<void> => {
  const { userId } = req.user || {};
  const { amount, currency, agencyId, supplierId, bookingId, commissionRate, idempotencyKey } =
    req.body as PurchaseRequestBody;

  // Input validation
  if (!userId || !amount || !currency || !agencyId || !supplierId || !bookingId || !commissionRate || !idempotencyKey) {
    res.status(400).json({
      error: 'Missing required fields',
    });
    return;
  }

  try {
    // Validate input with Joi
    const { error } = purchaseSchema.validate(req.body);
    if (error) {
      res.status(400).json({
        error: 'Validation failed',
        details: error.details.map(d => d.message),
      });
      return;
    }

    logger.info(`${SERVICE_NAME}: Purchase request - customer: ${userId}, amount: ${amount} ${currency}`);

    // Execute customer purchase flow
    const transaction = await walletService.customerPurchaseFlow({
      customerId: userId,
      agencyId,
      supplierId,
      amount,
      currency,
      bookingId,
      commissionRate,
      idempotencyKey,
    });

    logger.info(`${SERVICE_NAME}: Purchase completed - transaction: ${transaction.id}`);

    res.json({
      success: true,
      transaction,
    });
  } catch (error: any) {
    if (error.message?.includes('Insufficient funds')) {
      logger.warn(`${SERVICE_NAME}: Insufficient funds - ${error.message}`);
      res.status(402).json({
        error: 'Insufficient funds',
        message: error.message,
      });
    } else if (error.message?.includes('Resource not found')) {
      logger.warn(`${SERVICE_NAME}: Resource not found - ${error.message}`);
      res.status(404).json({
        error: 'Resource not found',
        message: error.message,
      });
    } else if (error.message?.includes('Duplicate transaction')) {
      logger.warn(`${SERVICE_NAME}: Duplicate transaction - ${error.message}`);
      res.status(409).json({
        error: 'Duplicate transaction',
        message: error.message,
      });
    } else {
      logger.error(`${SERVICE_NAME}: Purchase failed`, error);
      res.status(500).json({
        error: 'Purchase failed',
        message: error.message,
      });
    }
  }
});

export default router;
