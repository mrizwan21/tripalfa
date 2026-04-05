import { Router, Response } from 'express';
import { Prisma } from '@prisma/client';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import PaymentGatewayFactory from '../services/payment-gateway/factory.js';
import PaymentRetryService from '../services/payment-gateway/retry.js';

const router: Router = Router();
const retryService = new PaymentRetryService();

// All payment routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER PAYMENT PROCESSING
// ============================================

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments:
 *   post:
 *     summary: Create payment request (payout, refund, adjustment)
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, amount, currency]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [payout, refund, adjustment]
 *               amount:
 *                 type: number
 *               currency:
 *                 type: string
 *               referenceId:
 *                 type: string
 *               description:
 *                 type: string
 *               paymentGateway:
 *                 type: string
 *               scheduledFor:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Payment created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Supplier or wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       409:
 *         description: Conflict - insufficient balance or wallet not approved
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.post(
  '/:supplierId/payments',
  requirePermission('suppliers:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { type, amount, currency, referenceId, description, paymentGateway, scheduledFor } =
        req.body;

      // Validation
      if (!type) {
        res.status(400).json({ error: 'type is required (payout|refund|adjustment)' });
        return;
      }
      // Validate amount is a valid positive number
      const amountNum = Number(amount);
      if (!amount || Number.isNaN(amountNum) || amountNum <= 0) {
        res.status(400).json({ error: 'amount is required and must be a valid number > 0' });
        return;
      }
      if (!currency) {
        res.status(400).json({ error: 'currency is required' });
        return;
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      // Get wallet
      const wallet = await prisma.supplierWallet.findFirst({
        where: {
          supplierId: supplierId as string,
          deletedAt: null,
        },
      });
      if (!wallet) {
        res.status(404).json({ error: 'Supplier wallet not found' });
        return;
      }

      // Check wallet is approved
      if (wallet.approvalStatus !== 'approved') {
        res.status(409).json({ error: 'Wallet must be approved first' });
        return;
      }

      // For payouts, check sufficient balance
      if (type === 'payout' && wallet.balance < amount) {
        res.status(409).json({ error: 'Insufficient balance for payout' });
        return;
      }

      // Create payment
      const payment = await prisma.supplierPayment.create({
        data: {
          supplierId: supplierId as string,
          walletId: wallet.id,
          paymentType: type,
          amount: new Prisma.Decimal(amount),
          currency,
          status: 'pending',
          scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
          metadata: {
            referenceId,
            description,
            paymentGateway: paymentGateway || 'stripe',
          },
        },
      });

      // Create audit log
      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          paymentId: payment.id,
          action: 'created',
          previousBalance: wallet.balance,
          newBalance: wallet.balance,
          actorId: req.user?.id || 'system',
          notes: `Payment created: ${type} of ${currency} ${amount}`,
        },
      });

      res.status(201).json({
        message: 'Payment created successfully',
        data: payment,
      });
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
 *     summary: List supplier payments
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by payment status
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter by payment type
 *     responses:
 *       200:
 *         description: List of payments
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/:supplierId/payments',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = '1', limit = '10', status, type } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const whereClause: any = { supplierId: supplierId as string };
      if (status) {
        whereClause.status = status;
      }
      if (type) {
        whereClause.paymentType = type;
      }

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
        data: payments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
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
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     responses:
 *       200:
 *         description: Payment details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.get(
  '/:supplierId/payments/:paymentId',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentId } = req.params;

      const payment = await prisma.supplierPayment.findFirst({
        where: {
          id: paymentId as string,
          supplierId: supplierId as string,
        },
      });

      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      res.json({ data: payment });
    } catch (error) {
      console.error('Error fetching payment:', error);
      res.status(500).json({ error: 'Failed to fetch payment' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/payments/{paymentId}/process:
 *   put:
 *     summary: Process payment (mark as completed/failed)
 *     tags: [Supplier Payments]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [completed, failed, cancelled]
 *               transactionId:
 *                 type: string
 *               failureReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       404:
 *         description: Payment or wallet not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       409:
 *         description: Conflict - payment already processed
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.put(
  '/:supplierId/payments/:paymentId/process',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentId } = req.params;
      const { status: newStatus, transactionId, failureReason } = req.body;

      // Validation
      const validStatuses = ['completed', 'failed', 'cancelled'];
      if (!newStatus || !validStatuses.includes(newStatus)) {
        res.status(400).json({
          error: `status must be one of: ${validStatuses.join(', ')}`,
        });
        return;
      }

      // Get payment
      const payment = await prisma.supplierPayment.findFirst({
        where: {
          id: paymentId as string,
          supplierId: supplierId as string,
        },
      });
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      if (payment.status !== 'pending') {
        res.status(409).json({ error: 'Payment already processed' });
        return;
      }

      // Get wallet for balance updates
      const wallet = await prisma.supplierWallet.findUnique({
        where: { id: payment.walletId },
      });
      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      let newBalance = wallet.balance;

      // Update balance based on payment type and status
      if (newStatus === 'completed') {
        const balanceNum = wallet.balance.toNumber?.() ?? Number(wallet.balance);
        const amountNum = payment.amount.toNumber?.() ?? Number(payment.amount);
        let newBalanceNum = balanceNum;

        if (payment.paymentType === 'payout') {
          newBalanceNum = balanceNum - amountNum;
        } else if (payment.paymentType === 'refund') {
          newBalanceNum = balanceNum + amountNum;
        } else if (payment.paymentType === 'adjustment') {
          newBalanceNum = balanceNum + amountNum; // Adjustment is credit
        }

        newBalance = new Prisma.Decimal(newBalanceNum);
      }

      // Update payment
      const updated = await prisma.supplierPayment.update({
        where: { id: paymentId as string },
        data: {
          status: newStatus,
          transactionReference: transactionId,
          failureReason,
          processedAt: new Date(),
        },
      });

      // Update wallet balance if payment completed
      if (newStatus === 'completed') {
        await prisma.supplierWallet.update({
          where: { id: payment.walletId },
          data: { balance: newBalance },
        });
      }

      // Create audit log
      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          paymentId,
          action: newStatus === 'completed' ? 'processed' : 'failed',
          previousBalance: wallet.balance,
          newBalance,
          actorId: req.user?.id || 'system',
          notes: `Payment ${newStatus}: ${payment.paymentType} of ${payment.currency} ${payment.amount}${
            failureReason ? `. Reason: ${failureReason}` : ''
          }`,
        },
      });

      res.json({
        message: `Payment marked as ${newStatus}`,
        data: updated,
      });
    } catch (error) {
      console.error('Error processing payment:', error);
      res.status(500).json({ error: 'Failed to process payment' });
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
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: path
 *         name: paymentId
 *         required: true
 *         schema:
 *           type: string
 *         description: Payment ID
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *       404:
 *         description: Payment not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       409:
 *         description: Conflict - only pending payments can be cancelled
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 */
router.delete(
  '/:supplierId/payments/:paymentId/cancel',
  requirePermission('suppliers:delete'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, paymentId } = req.params;
      const { reason } = req.body;

      // Get payment
      const payment = await prisma.supplierPayment.findFirst({
        where: {
          id: paymentId as string,
          supplierId: supplierId as string,
        },
      });
      if (!payment) {
        res.status(404).json({ error: 'Payment not found' });
        return;
      }

      if (payment.status !== 'pending') {
        res.status(409).json({ error: 'Only pending payments can be cancelled' });
        return;
      }

      // Update payment
      const updated = await prisma.supplierPayment.update({
        where: { id: paymentId as string },
        data: {
          status: 'cancelled',
          failureReason: reason,
        },
      });

      // Create audit log
      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          paymentId,
          action: 'cancelled',
          previousBalance: 0, // No balance change on cancel
          newBalance: 0,
          actorId: req.user?.id || 'system',
          notes: `Payment cancelled: ${payment.paymentType} of ${payment.currency} ${payment.amount}${
            reason ? `. Reason: ${reason}` : ''
          }`,
        },
      });

      res.json({
        message: 'Payment cancelled successfully',
        data: updated,
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
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 25
 *         description: Items per page
 *       - in: query
 *         name: action
 *         schema:
 *           type: string
 *         description: Filter by action type
 *     responses:
 *       200:
 *         description: List of payment logs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                 pagination:
 *                   type: object
 *       404:
 *         description: Supplier not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 error:
 *                   type: string
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

      // Verify supplier exists
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
        data: logs,
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

export default router;
