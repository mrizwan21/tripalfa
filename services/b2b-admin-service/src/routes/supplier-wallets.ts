import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";

const router: Router = Router();

// All wallet routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER WALLET MANAGEMENT
// ============================================

/**
 * GET /api/suppliers/:supplierId/wallets
 * Get supplier's wallet details
 */
router.get(
  "/:supplierId/wallets",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      const wallet = await prisma.supplierWallet.findFirst({
        where: {
          supplierId: supplierId as string,
          deletedAt: null, // Exclude soft deleted
        },
      });

      if (!wallet) {
        res.status(404).json({ error: "Wallet not found. Request creation first." });
        return;
      }

      res.json({ data: wallet });
    } catch (error) {
      console.error("Error fetching wallet:", error);
      res.status(500).json({ error: "Failed to fetch wallet" });
    }
  }
);

/**
 * POST /api/suppliers/:supplierId/wallets/request
 * Request wallet creation (creates pending approval request)
 */
router.post(
  "/:supplierId/wallets/request",
  requirePermission("suppliers:create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { currency, requestMessage } = req.body;

      // Validation
      if (!currency) {
        res.status(400).json({ error: "currency is required" });
        return;
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
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
        res.status(409).json({ error: "Wallet already exists for this supplier" });
        return;
      }

      // Create wallet in pending state
      const wallet = await prisma.supplierWallet.create({
        data: {
          supplierId: supplierId as string,
          currency,
          balance: 0,
          status: "pending",
          approvalStatus: "pending",
        },
      });

      // Create approval request
      const approvalRequest = await prisma.supplierWalletApprovalRequest.create({
        data: {
          walletId: wallet.id,
          supplierId: supplierId as string,
          requestType: "create",
          requestData: {
            currency,
            requestMessage,
            requestedAt: new Date().toISOString(),
          },
          approverRole: "finance",
          status: "pending",
        },
      });

      res.status(201).json({
        message: "Wallet request created successfully",
        data: {
          wallet,
          approvalRequest,
        },
      });
    } catch (error) {
      console.error("Error requesting wallet:", error);
      res.status(500).json({ error: "Failed to request wallet" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/wallet-approvals
 * List pending wallet approval requests
 */
router.get(
  "/:supplierId/wallet-approvals",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "10", status } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      const whereClause: any = { supplierId: supplierId as string };
      if (status) {
        whereClause.status = status;
      }

      const [requests, total] = await Promise.all([
        prisma.supplierWalletApprovalRequest.findMany({
          where: whereClause,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierWalletApprovalRequest.count({ where: whereClause }),
      ]);

      res.json({
        data: requests,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching approval requests:", error);
      res.status(500).json({ error: "Failed to fetch approval requests" });
    }
  }
);

/**
 * POST /api/suppliers/:supplierId/wallet-approvals/:requestId/approve
 * Admin approve wallet creation
 */
router.post(
  "/:supplierId/wallet-approvals/:requestId/approve",
  requirePermission("suppliers:approve"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, requestId } = req.params;
      const { approvalNotes } = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
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
        res.status(404).json({ error: "Approval request not found" });
        return;
      }

      if (approvalRequest.status !== "pending") {
        res.status(409).json({ error: "Request already processed" });
        return;
      }

      // Update request status
      const updated = await prisma.supplierWalletApprovalRequest.update({
        where: { id: requestId as string },
        data: {
          status: "approved",
          approvedBy: req.user?.id || "admin",
          respondedAt: new Date(),
          approvalNotes,
        },
      });

      // Update wallet status
      await prisma.supplierWallet.update({
        where: { id: approvalRequest.walletId },
        data: {
          status: "active",
          approvalStatus: "approved",
        },
      });

      res.json({
        message: "Wallet approved successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error approving wallet:", error);
      res.status(500).json({ error: "Failed to approve wallet" });
    }
  }
);

/**
 * POST /api/suppliers/:supplierId/wallet-approvals/:requestId/reject
 * Admin reject wallet creation
 */
router.post(
  "/:supplierId/wallet-approvals/:requestId/reject",
  requirePermission("suppliers:approve"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, requestId } = req.params;
      const { rejectionReason } = req.body;

      // Validation
      if (!rejectionReason) {
        res.status(400).json({ error: "rejectionReason is required" });
        return;
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
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
        res.status(404).json({ error: "Approval request not found" });
        return;
      }

      if (approvalRequest.status !== "pending") {
        res.status(409).json({ error: "Request already processed" });
        return;
      }

      // Update request status
      const updated = await prisma.supplierWalletApprovalRequest.update({
        where: { id: requestId as string },
        data: {
          status: "rejected",
          approvedBy: req.user?.id || "admin",
          reason: rejectionReason,
          respondedAt: new Date(),
        },
      });

      // Soft delete wallet
      await prisma.supplierWallet.update({
        where: { id: approvalRequest.walletId },
        data: {
          approvalStatus: "rejected",
          deletedAt: new Date(),
        },
      });

      res.json({
        message: "Wallet rejected successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error rejecting wallet:", error);
      res.status(500).json({ error: "Failed to reject wallet" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/wallets/balance
 * Get current wallet balance
 */
router.get(
  "/:supplierId/wallets/balance",
  requirePermission("suppliers:read"),
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
        res.status(404).json({ error: "Wallet not found" });
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
      console.error("Error fetching balance:", error);
      res.status(500).json({ error: "Failed to fetch balance" });
    }
  }
);

export default router;
