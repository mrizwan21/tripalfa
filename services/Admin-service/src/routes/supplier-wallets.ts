import { Router, Response } from 'express';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';

const router: Router = Router();

// All wallet routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER WALLET MANAGEMENT
// ============================================

/**
 * @swagger
 * /api/suppliers/{supplierId}/wallets:
 *   get:
 *     summary: Get supplier wallet details
 *     tags: [Supplier Wallets]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Wallet details retrieved successfully
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
 *       500:
 *         description: Internal server error
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
  '/:supplierId/wallets',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: 'Supplier not found' });
        return;
      }

      const wallet = await prisma.supplierWallet.findFirst({
        where: {
          supplierId: supplierId as string,
          deletedAt: null, // Exclude soft deleted
        },
      });

      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found. Request creation first.' });
        return;
      }

      res.json({ data: wallet });
    } catch (error) {
      console.error('Error fetching wallet:', error);
      res.status(500).json({ error: 'Failed to fetch wallet' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/wallets/request:
 *   post:
 *     summary: Request wallet creation
 *     tags: [Supplier Wallets]
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
 *             required: [currency]
 *             properties:
 *               currency:
 *                 type: string
 *               requestMessage:
 *                 type: string
 *     responses:
 *       201:
 *         description: Wallet request created successfully
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
 *       409:
 *         description: Wallet already exists
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
 *         description: Internal server error
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
  '/:supplierId/wallets/request',
  requirePermission('suppliers:create'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { currency, requestMessage } = req.body;

      // Validation
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

      // Check if wallet already exists
      const existingWallet = await prisma.supplierWallet.findFirst({
        where: {
          supplierId: supplierId as string,
          deletedAt: null,
        },
      });
      if (existingWallet) {
        res.status(409).json({ error: 'Wallet already exists for this supplier' });
        return;
      }

      // Create wallet in pending state
      const wallet = await prisma.supplierWallet.create({
        data: {
          supplierId: supplierId as string,
          currency,
          balance: 0,
          status: 'pending',
          approvalStatus: 'pending',
        },
      });

      // Create approval request
      const approvalRequest = await prisma.supplierWalletApprovalRequest.create({
        data: {
          walletId: wallet.id,
          supplierId: supplierId as string,
          requestType: 'create',
          requestData: {
            currency,
            requestMessage,
            requestedAt: new Date().toISOString(),
          },
          approverRole: 'finance',
          status: 'pending',
        },
      });

      res.status(201).json({
        message: 'Wallet request created successfully',
        data: {
          wallet,
          approvalRequest,
        },
      });
    } catch (error) {
      console.error('Error requesting wallet:', error);
      res.status(500).json({ error: 'Failed to request wallet' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/wallet-approvals/{requestId}/reject:
 *   post:
 *     summary: Admin reject wallet creation
 *     tags: [Supplier Wallets]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *       - in: path
 *         name: requestId
 *         required: true
 *         schema:
 *           type: string
 *         description: Approval request ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [rejectionReason]
 *             properties:
 *               rejectionReason:
 *                 type: string
 *     responses:
 *       200:
 *         description: Wallet rejected successfully
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
 *         description: Supplier or request not found
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
 *         description: Request already processed
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
 *         description: Internal server error
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
  '/:supplierId/wallet-approvals/:requestId/reject',
  requirePermission('suppliers:approve'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, requestId } = req.params;
      const { rejectionReason } = req.body;

      // Validation
      if (!rejectionReason) {
        res.status(400).json({ error: 'rejectionReason is required' });
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

      // Get approval request
      const approvalRequest = await prisma.supplierWalletApprovalRequest.findFirst({
        where: {
          id: requestId as string,
          supplierId: supplierId as string,
        },
      });
      if (!approvalRequest) {
        res.status(404).json({ error: 'Approval request not found' });
        return;
      }

      if (approvalRequest.status !== 'pending') {
        res.status(409).json({ error: 'Request already processed' });
        return;
      }

      // Update request status
      const updated = await prisma.supplierWalletApprovalRequest.update({
        where: { id: requestId as string },
        data: {
          status: 'rejected',
          approvedBy: req.user?.id || 'admin',
          reason: rejectionReason,
          respondedAt: new Date(),
        },
      });

      // Soft delete wallet
      await prisma.supplierWallet.update({
        where: { id: approvalRequest.walletId },
        data: {
          approvalStatus: 'rejected',
          deletedAt: new Date(),
        },
      });

      res.json({
        message: 'Wallet rejected successfully',
        data: updated,
      });
    } catch (error) {
      console.error('Error rejecting wallet:', error);
      res.status(500).json({ error: 'Failed to reject wallet' });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{supplierId}/wallets/balance:
 *   get:
 *     summary: Get current wallet balance
 *     tags: [Supplier Wallets]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *         description: Supplier ID
 *     responses:
 *       200:
 *         description: Wallet balance retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     supplierId:
 *                       type: string
 *                     balance:
 *                       type: number
 *                     currency:
 *                       type: string
 *                     status:
 *                       type: string
 *                     approvalStatus:
 *                       type: string
 *       404:
 *         description: Wallet not found
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
 *         description: Internal server error
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
  '/:supplierId/wallets/balance',
  requirePermission('suppliers:read'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;

      const wallet = await prisma.supplierWallet.findFirst({
        where: {
          supplierId: supplierId as string,
          deletedAt: null,
        },
      });

      if (!wallet) {
        res.status(404).json({ error: 'Wallet not found' });
        return;
      }

      res.json({
        data: {
          supplierId,
          balance: wallet.balance,
          currency: wallet.currency,
          status: wallet.status,
          approvalStatus: wallet.approvalStatus,
        },
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
      res.status(500).json({ error: 'Failed to fetch balance' });
    }
  }
);

export default router;
