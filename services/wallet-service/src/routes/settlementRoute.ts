// src/routes/settlementRoute.ts
// POST /api/wallet/settlement
// Supplier settlement flow: Agency settles with Supplier after customer purchase

import { Router, Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import walletService from '../services/walletService.js';
import * as fxService from '../services/fxService.js';
import { authMiddleware } from '../middlewares/auth.js';
import { logger } from '../utils/logger.js';

const router = Router();
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
 * POST /api/wallet/settlement
 * Agency settles payment with Supplier
 *
 * Prerequisites:
 * - Customer purchase transaction must exist
 * - Agency holds the full customer payment in wallet
 * - Commission is deducted from agency balance
 * - Supplier receives: settledAmount = fullCustomerPayment - commission
 *
 * Flow:
 * 1. Verify agency has sufficient balance (settledAmount + commission)
 * 2. Debit agency: settlementAmount + commissionDeducted
 * 3. Credit supplier: settlementAmount
 * 4. Create settlement transaction with invoice reference
 * 5. Create ledger entries for both debit and commission deduction
 *
 * Response:
 * {
 *   success: true,
 *   transaction: {
 *     id: uuid,
 *     type: 'supplier_settlement',
 *     flow: 'agency_to_supplier',
 *     amount: settlementAmount,
 *     currency: currency,
 *     status: 'completed',
 *     invoiceId: invoiceId,
 *     createdAt: timestamp
 *   },
 *   summary: {
 *     agencyDebited: settlementAmount + deductedCommission,
 *     supplierCredited: settlementAmount,
 *     commissionDeducted: deductedCommission,
 *     net: settlementAmount
 *   }
 * }
 */
router.post('/api/wallet/settlement', authMiddleware, async (req: Request, res: Response, next: NextFunction) => {
  try {
    // 1. Validate request
    const { error, value } = settlementSchema.validate(req.body);
    if (error) {
      return res.status(400).json({ success: false, error: error.message });
    }

    const { supplierId, settlementAmount, deductedCommission, currency, invoiceId, idempotencyKey } = value;
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
        invoiceId: transaction.invoiceId,
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
});

export default router;
