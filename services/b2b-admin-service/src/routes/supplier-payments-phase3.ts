/**
 * Supplier Payment Routes with Payment Gateway Integration (Phase 3)
 * Handles payment processing through Stripe and other payment gateways
 */

import { Router, Response } from 'express';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import PaymentGatewayFactory from '../services/payment-gateway/factory.js';
import PaymentRetryService from '../services/payment-gateway/retry.js';

const router: Router = Router();
const retryService = new PaymentRetryService();

router.use(authMiddleware);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments:
 *   post:
 *     summary: Create payment with gateway processing
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [paymentType, amount, currency]
 *             properties:
 *               paymentType:
 *                 type: string
 *                 enum: [payout, refund, adjustment, reversal]
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               paymentMethod:
 *                 type: string
 *               bankDetails:
 *                 type: object
 *               description:
 *                 type: string
 *               scheduledFor:
 *                 type: string
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       400:
 *         description: Validation or processing error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       404:
 *         description: Supplier or wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       409:
 *         description: Wallet not approved or insufficient balance
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post(
  '/:supplierId/payments',
  requirePermission('suppliers:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const {
        paymentType,
        amount,
        currency,
        paymentMethod,
        bankDetails,
        description,
        scheduledFor,
      } = req.body;

      if (!paymentType) {
        res
          .status(400)
          .json({ error: 'paymentType is required (payout|refund|adjustment|reversal)' });
        return;
      }
      if (!amount || amount <= 0) {
        res.status(400).json({ error: 'amount is required and must be > 0' });
        return;
      }
      if (!currency) {
        res.status(400).json({ error: 'currency is required' });
        return;
      }

      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const wallet = await prisma.supplierWallet.findFirst({
        where: { supplierId: supplierId as string, deletedAt: null },
      });
      if (!wallet) {
        res.status(404).json({ error: 'Supplier wallet not found' });
        return;
      }

      if (wallet.approvalStatus !== 'approved') {
        res.status(409).json({ error: 'Wallet must be approved first' });
        return;
      }

      if (paymentType === 'payout') {
        const walletBalance = Number(wallet.balance);
        if (walletBalance < amount) {
          res.status(409).json({
            error: `Insufficient balance. Available: ${walletBalance}, Required: ${amount}`,
          });
          return;
        }
      }

      const payment = await prisma.supplierPayment.create({
        data: {
          supplierId: supplierId as string,
          walletId: wallet.id,
          paymentType,
          amount,
          currency,
          paymentMethod: paymentMethod || 'bank_transfer',
          status: 'pending',
          metadata: {
            description,
            scheduledFor,
            bankDetails: bankDetails ? { ...bankDetails } : null,
            initiatedBy: req.user?.id,
            initiatedAt: new Date().toISOString(),
          } as any,
        },
      });

      if (!scheduledFor) {
        try {
          const gatewayConfig = {
            provider: 'stripe',
            apiKey: process.env.STRIPE_API_KEY || '',
            testMode: process.env.NODE_ENV !== 'production',
          };

          const gateway = PaymentGatewayFactory.getGateway(gatewayConfig as any);
          await gateway.initialize();

          const response = await gateway.processPayment({
            supplierId: supplierId as string,
            walletId: wallet.id,
            amount,
            currency,
            type: paymentType as 'payout' | 'refund' | 'adjustment',
            method: paymentMethod || 'bank_transfer',
            description,
            bankDetails,
            metadata: { paymentId: payment.id, supplierId },
          });

          await prisma.supplierPayment.update({
            where: { id: payment.id },
            data: {
              status: response.status,
              transactionReference: response.transactionId,
              processedAt: response.status === 'completed' ? new Date() : null,
              metadata: {
                ...(payment.metadata as any),
                gatewayResponse: response,
                processingTime: response.processingTime,
              } as any,
            },
          });

          if (response.status === 'completed') {
            const currentBalance = Number(wallet.balance);
            let newBalance = currentBalance;
            if (paymentType === 'payout') {
              newBalance = currentBalance - amount;
            } else if (paymentType === 'refund' || paymentType === 'adjustment') {
              newBalance = currentBalance + amount;
            }

            await prisma.supplierWallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance },
            });
          }

          await prisma.supplierPaymentLog.create({
            data: {
              supplierId: supplierId as string,
              walletId: wallet.id,
              paymentId: payment.id,
              action: 'processed',
              previousBalance: Number(wallet.balance),
              newBalance:
                response.status === 'completed'
                  ? Number(wallet.balance) + (paymentType === 'payout' ? -amount : amount)
                  : Number(wallet.balance),
              actorId: req.user?.id || 'system',
              actorType: 'system',
              notes: `Payment processed via ${response.gateway}`,
              metadata: { transactionId: response.transactionId } as any,
            },
          });
        } catch (error: any) {
          console.error('Payment gateway processing error:', error);

          await prisma.supplierPayment.update({
            where: { id: payment.id },
            data: {
              status: 'failed',
              failureReason: error.message,
              metadata: {
                ...(payment.metadata as any),
                error: error.message,
                errorCode: error.code,
                retriable: error.retriable,
              } as any,
            },
          });

          if (error.retriable) {
            await retryService.scheduleRetry(payment, error);
          }

          res.status(400).json({
            error: error.message,
            transactionId: payment.id,
            retriable: error.retriable,
            suggestion: error.retriable
              ? 'Payment will be retried automatically'
              : 'Please resolve the issue and resubmit',
          });
          return;
        }
      }

      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          walletId: wallet.id,
          paymentId: payment.id,
          action: 'created',
          previousBalance: Number(wallet.balance),
          newBalance: Number(wallet.balance),
          actorId: req.user?.id || 'system',
          actorType: 'system',
          notes: `Payment created: ${paymentType} of ${currency} ${amount}`,
        },
      });

      res.status(201).json({ message: 'Payment created successfully', data: payment });
    } catch (error) {
      console.error('Error creating payment:', error);
      res.status(500).json({ error: 'Failed to create payment' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments:
 *   get:
 *     summary: List supplier payments with filters
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema: { type: string }
 *         description: Filter by payment status
 *       - in: query
 *         name: paymentType
 *         schema: { type: string }
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: List of supplier payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *       404:
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get(
  '/:supplierId/payments',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = '1', limit = '25', status, paymentType } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 25;
      const skip = (pageNum - 1) * limitNum;

      const supplier = await prisma.supplier.findUnique({ where: { id: supplierId as string } });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const whereClause: any = { supplierId: supplierId as string };
      if (status) whereClause.status = status;
      if (paymentType) whereClause.paymentType = paymentType;

      const [payments, total] = await Promise.all([
        prisma.supplierPayment.findMany({
          where: whereClause,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.supplierPayment.count({ where: whereClause }),
      ]);

      res.json({
        data: payments.map(p => ({ ...p, amount: Number(p.amount) })),
        pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
      });
    } catch (error) {
      console.error('Error fetching payments:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments/{paymentId}:
 *   get:
 *     summary: Get payment details
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get(
  '/:supplierId/payments/:paymentId',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentId } = req.params;

      const payment = await prisma.supplierPayment.findFirst({
        where: { id: paymentId as string, supplierId: supplierId as string },
      });

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      res.json({ data: { ...payment, amount: Number(payment.amount) } });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({ error: 'Failed to fetch payment' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments/{paymentId}/retry:
 *   post:
 *     summary: Manually retry failed payment
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment scheduled for retry
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     message: { type: string }
 *                     paymentId: { type: string }
 *                     status: { type: string }
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       409:
 *         description: Only failed payments can be retried
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.post(
  '/:supplierId/payments/:paymentId/retry',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentId } = req.params;

      const payment = await prisma.supplierPayment.findFirst({
        where: { id: paymentId as string, supplierId: supplierId as string },
      });

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      if (payment.status !== 'failed') {
        res.status(409).json({ error: 'Only failed payments can be retried' });
        return;
      }

      await retryService.scheduleRetry(payment, new Error('Manual retry requested'));

      res.json({
        message: 'Payment scheduled for retry',
        paymentId: payment.id,
        status: 'pending_retry',
      });
    } catch (error) {
      console.error('Error retrying payment:', error);
      res.status(500).json({ error: 'Failed to retry payment' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments/{paymentId}/cancel:
 *   delete:
 *     summary: Cancel pending payment
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema: { type: string }
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason: { type: string }
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data: { type: object }
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       409:
 *         description: Only pending payments can be cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.delete(
  '/:supplierId/payments/:paymentId/cancel',
  requirePermission('suppliers:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentId } = req.params;
      const { reason } = req.body;

      const payment = await prisma.supplierPayment.findFirst({
        where: { id: paymentId as string, supplierId: supplierId as string },
      });
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      if (payment.status !== 'pending') {
        res.status(409).json({ error: 'Only pending payments can be cancelled' });
        return;
      }

      const updated = await prisma.supplierPayment.update({
        where: { id: paymentId as string },
        data: {
          status: 'cancelled',
          failureReason: reason,
          metadata: {
            ...(payment.metadata as any),
            cancelledBy: req.user?.id,
            cancelledAt: new Date().toISOString(),
            cancelReason: reason,
          },
        },
      });

      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          walletId: payment.walletId,
          paymentId,
          action: 'cancelled',
          actorId: req.user?.id || 'system',
          actorType: 'system',
          notes: `Payment cancelled: ${payment.paymentType} of ${payment.currency} ${Number(payment.amount)}${
            reason ? `. Reason: ${reason}` : ''
          }`,
        },
      });

      res.json({
        message: 'Payment cancelled successfully',
        data: {
          ...updated,
          amount: Number(updated.amount),
        },
      });
    } catch (error) {
      console.error('Error cancelling payment:', error);
      res.status(500).json({ error: 'Failed to cancel payment' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payment-logs:
 *   get:
 *     summary: Get payment audit logs
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 25 }
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema: { type: string }
 *         description: Filter by action
 *     responses:
 *       200:
 *         description: Payment logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: array
 *                   items: { type: object }
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page: { type: integer }
 *                     limit: { type: integer }
 *                     total: { type: integer }
 *                     pages: { type: integer }
 *       404:
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get(
  '/:supplierId/payment-logs',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = '1', limit = '25', action } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 25;
      const skip = (pageNum - 1) * limitNum;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const whereClause: any = { supplierId: supplierId as string };
      if (action) {
        whereClause.action = action;
      }

      const [logs, total] = await Promise.all([
        prisma.supplierPaymentLog.findMany({
          where: whereClause,
          skip,
          take: limitNum,
          orderBy: { createdAt: 'desc' },
        }),
        prisma.supplierPaymentLog.count({ where: whereClause }),
      ]);

      res.json({
        data: logs.map(l => ({
          ...l,
          previousBalance: l.previousBalance ? Number(l.previousBalance) : null,
          newBalance: l.newBalance ? Number(l.newBalance) : null,
          amount: l.amount ? Number(l.amount) : null,
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      res.status(500).json({ error: 'Failed to fetch payment logs' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payment-stats:
 *   get:
 *     summary: Get payment statistics
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema: { type: string }
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Payment statistics retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean }
 *                 data:
 *                   type: object
 *                   properties:
 *                     supplierId: { type: string }
 *                     paymentStats: { type: object }
 *                     retryStats: { type: object }
 *                     lastUpdated: { type: string, format: date-time }
 *       500:
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: false }
 *                 error: { type: string }
 */
router.get(
  '/:supplierId/payment-stats',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;

      const stats = await getPaymentSummary(supplierId as string);
      const retryStats = await retryService.getRetryStats();

      res.json({
        supplierId,
        paymentStats: stats,
        retryStats,
        lastUpdated: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error fetching payment stats:', error);
      res.status(500).json({ error: 'Failed to fetch payment stats' });
    }
  }
);

async function getPaymentSummary(supplierId: string) {
  const payments = await prisma.supplierPayment.findMany({
    where: { supplierId },
  });

  return {
    total: payments.length,
    completed: payments.filter(p => p.status === 'completed').length,
    pending: payments.filter(p => p.status === 'pending').length,
    processing: payments.filter(p => p.status === 'processing').length,
    failed: payments.filter(p => p.status === 'failed').length,
    cancelled: payments.filter(p => p.status === 'cancelled').length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
  };
}

export default router;
