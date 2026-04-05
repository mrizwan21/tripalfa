// src/routes/settlementRoute.ts
// POST /api/wallet/settlement
// Supplier settlement flow: Agency settles with Supplier after customer purchase

import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import Joi from 'joi';
import walletService from '../services/walletService.js';
import * as fxService from '../services/fxService.js';
import { authMiddleware } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';

const router: ExpressRouter = Router();
const SERVICE_NAME = 'settlementRoute';

// Validation schema
const settlementSchema = Joi.object({
  supplierId: Joi.string().uuid().required(),
  settlementAmount: Joi.number().positive().required(),
  deductedCommission: Joi.number().min(0).required(),
  currency: Joi.string().length(3).uppercase().required(),
  invoiceId: Joi.string().required(),
  idempotencyKey: Joi.string().uuid().required(),
});

/**
 * @swagger
 * /api/wallet/settlement:
 *   post:
 *     summary: Process supplier settlement
 *     tags: [Settlements]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierId, settlementAmount, deductedCommission, currency, invoiceId, idempotencyKey]
 *             properties:
 *               supplierId:
 *                 type: string
 *                 format: uuid
 *               settlementAmount:
 *                 type: number
 *               deductedCommission:
 *                 type: number
 *               currency:
 *                 type: string
 *               invoiceId:
 *                 type: string
 *               idempotencyKey:
 *                 type: string
 *                 format: uuid
 *     responses:
 *       200:
 *         description: Settlement successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 transaction:
 *                   type: object
 *                 summary:
 *                   type: object
 *       400:
 *         description: Bad request
 *       402:
 *         description: Insufficient funds
 *       404:
 *         description: Resource not found
 *       409:
 *         description: Duplicate settlement
 *       500:
 *         description: Server error
 */
router.post(
  '/api/wallet/settlement',
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      // 1. Validate request
      const { error, value } = settlementSchema.validate(req.body);
      if (error) {
        return res.status(400).json({ success: false, error: error.message });
      }

      const {
        supplierId,
        settlementAmount,
        deductedCommission,
        currency,
        invoiceId,
        idempotencyKey,
      } = value;
      const agencyId = (req as any).userId; // From authMiddleware

      // Validate agencyId
      if (!agencyId) {
        return res.status(401).json({ success: false, error: 'Unauthorized' });
      }

      logger.info(
        `${SERVICE_NAME}: Settlement request - agency: ${agencyId}, supplier: ${supplierId}, amount: ${settlementAmount} ${currency}`
      );

      // 2. Verify FX snapshot available
      try {
        await fxService.getLatestSnapshot();
      } catch (err) {
        logger.warn(`${SERVICE_NAME}: FX snapshot unavailable`);
        return res.status(503).json({
          success: false,
          error: 'FX rates unavailable. Please try again.',
        });
      }

      // 3. Ensure supplier wallet exists
      await walletService.createWallet(supplierId, currency);

      // 4. Execute supplier settlement flow
      const transaction = await walletService.supplierSettlementFlow({
        supplierId,
        agencyId,
        settlementAmount,
        currency,
        invoiceId,
        deductedCommission,
        idempotencyKey,
      });

      const totalDebited = settlementAmount + deductedCommission;

      logger.info(`${SERVICE_NAME}: Settlement completed - transaction: ${transaction.id}`);

      return res.status(200).json({
        success: true,
        transaction: {
          id: transaction.id,
          type: transaction.type,
          flow: transaction.flow,
          amount: transaction.amount,
          currency: transaction.currency,
          status: transaction.status,
          bookingId: transaction.bookingId,
          invoiceId: transaction.bookingId, // Backwards compatibility - maps to bookingId
          createdAt: transaction.createdAt,
        },
        summary: {
          agencyDebited: totalDebited,
          supplierCredited: settlementAmount,
          commissionDeducted: deductedCommission,
          net: settlementAmount,
        },
      });
    } catch (err) {
      const error = err as Error;

      if (error.message.includes('Insufficient')) {
        logger.warn(`${SERVICE_NAME}: Insufficient funds - ${error.message}`);
        return res.status(402).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('not found')) {
        logger.warn(`${SERVICE_NAME}: Resource not found - ${error.message}`);
        return res.status(404).json({
          success: false,
          error: error.message,
        });
      }

      if (error.message.includes('Duplicate')) {
        logger.warn(`${SERVICE_NAME}: Duplicate transaction - ${error.message}`);
        return res.status(409).json({
          success: false,
          error: 'Duplicate settlement detected',
        });
      }

      logger.error(`${SERVICE_NAME}: Settlement failed`, error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process settlement',
      });
    }
  }
);

export default router;
