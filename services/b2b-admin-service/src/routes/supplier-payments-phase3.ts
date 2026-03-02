/**
 * Supplier Payment Routes with Payment Gateway Integration (Phase 3)
 * Handles payment processing through Stripe and other payment gateways
 */

import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";
import PaymentGatewayFactory from "../services/payment-gateway/factory.js";
import PaymentRetryService from "../services/payment-gateway/retry.js";

const router: Router = Router();
const retryService = new PaymentRetryService();

// All payment routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER PAYMENT PROCESSING (Phase 3)
// ============================================

/**
 * POST /api/suppliers/:supplierId/payments
 * Create payment request with gateway processing
 */
router.post(
  "/:supplierId/payments",
  requirePermission("suppliers:create"),
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

      // Validation
      if (!paymentType) {
        res.status(400).json({
          error: "paymentType is required (payout|refund|adjustment|reversal)",
        });
        return;
      }
      if (!amount || amount <= 0) {
        res.status(400).json({ error: "amount is required and must be > 0" });
        return;
      }
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

      // Get wallet
      const wallet = await prisma.supplierWallet.findFirst({
        where: {
          supplierId: supplierId as string,
          deletedAt: null,
        },
      });
      if (!wallet) {
        res.status(404).json({ error: "Supplier wallet not found" });
        return;
      }

      // Check wallet is approved
      if (wallet.approvalStatus !== "approved") {
        res.status(409).json({ error: "Wallet must be approved first" });
        return;
      }

      // For payouts, check sufficient balance
      if (paymentType === "payout") {
        const walletBalance = Number(wallet.balance);
        if (walletBalance < amount) {
          res.status(409).json({
            error: `Insufficient balance. Available: ${walletBalance}, Required: ${amount}`,
          });
          return;
        }
      }

      // Create payment record (initially pending)
      const payment = await prisma.supplierPayment.create({
        data: {
          supplierId: supplierId as string,
          walletId: wallet.id,
          paymentType,
          amount,
          currency,
          paymentMethod: paymentMethod || "bank_transfer",
          status: "pending",
          metadata: {
            description,
            scheduledFor,
            bankDetails: bankDetails ? { ...bankDetails } : null,
            initiatedBy: req.user?.id,
            initiatedAt: new Date().toISOString(),
          } as any,
        },
      });

      // If not scheduled, process immediately via gateway
      if (!scheduledFor) {
        try {
          const gatewayConfig = {
            provider: "stripe",
            apiKey: process.env.STRIPE_API_KEY || "",
            testMode: process.env.NODE_ENV !== "production",
          };

          const gateway = PaymentGatewayFactory.getGateway(gatewayConfig as any);
          await gateway.initialize();

          const response = await gateway.processPayment({
            supplierId: supplierId as string,
            walletId: wallet.id,
            amount,
            currency,
            type: paymentType as "payout" | "refund" | "adjustment",
            method: paymentMethod || "bank_transfer",
            description,
            bankDetails,
            metadata: {
              paymentId: payment.id,
              supplierId,
            },
          });

          // Update payment with gateway response
          await prisma.supplierPayment.update({
            where: { id: payment.id },
            data: {
              status: response.status,
              transactionReference: response.transactionId,
              processedAt: response.status === "completed" ? new Date() : null,
              metadata: {
                ...(payment.metadata as any),
                gatewayResponse: response,
                processingTime: response.processingTime,
              } as any,
            },
          });

          // If payment completed, update wallet balance
          if (response.status === "completed") {
            const currentBalance = Number(wallet.balance);
            let newBalance = currentBalance;
            if (paymentType === "payout") {
              newBalance = currentBalance - amount;
            } else if (paymentType === "refund" || paymentType === "adjustment") {
              newBalance = currentBalance + amount;
            }

            await prisma.supplierWallet.update({
              where: { id: wallet.id },
              data: { balance: newBalance },
            });
          }

          // Log audit
          await prisma.supplierPaymentLog.create({
            data: {
              supplierId: supplierId as string,
              walletId: wallet.id,
              paymentId: payment.id,
              action: "processed",
              previousBalance: Number(wallet.balance),
              newBalance: response.status === "completed"
                ? Number(wallet.balance) + (paymentType === "payout" ? -amount : amount)
                : Number(wallet.balance),
              actorId: req.user?.id || "system",
              actorType: "system",
              notes: `Payment processed via ${response.gateway}`,
              metadata: {
                transactionId: response.transactionId,
              } as any,
            },
          });
        } catch (error: any) {
          console.error("Payment gateway processing error:", error);

          // Mark as failed in database
          await prisma.supplierPayment.update({
            where: { id: payment.id },
            data: {
              status: "failed",
              failureReason: error.message,
              metadata: {
                ...(payment.metadata as any),
                error: error.message,
                errorCode: error.code,
                retriable: error.retriable,
              } as any,
            },
          });

          // Schedule for retry if retriable
          if (error.retriable) {
            await retryService.scheduleRetry(payment, error);
          }

          res.status(400).json({
            error: error.message,
            transactionId: payment.id,
            retriable: error.retriable,
            suggestion: error.retriable
              ? "Payment will be retried automatically"
              : "Please resolve the issue and resubmit",
          });
          return;
        }
      }

      // Log creation
      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          walletId: wallet.id,
          paymentId: payment.id,
          action: "created",
          previousBalance: Number(wallet.balance),
          newBalance: Number(wallet.balance),
          actorId: req.user?.id || "system",
          actorType: "system",
          notes: `Payment created: ${paymentType} of ${currency} ${amount}`,
        },
      });

      res.status(201).json({
        message: "Payment created successfully",
        data: payment,
      });
    } catch (error) {
      console.error("Error creating payment:", error);
      res.status(500).json({ error: "Failed to create payment" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/payments
 * List supplier payments with filters
 */
router.get(
  "/:supplierId/payments",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "10", status, paymentType } = req.query;

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
      if (paymentType) {
        whereClause.paymentType = paymentType;
      }

      const [payments, total] = await Promise.all([
        prisma.supplierPayment.findMany({
          where: whereClause,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierPayment.count({ where: whereClause }),
      ]);

      res.json({
        data: payments.map((p) => ({
          ...p,
          amount: Number(p.amount),
        })),
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
        summary: {
          byStatus: await getPaymentSummary(supplierId as string),
        },
      });
    } catch (error) {
      console.error("Error fetching payments:", error);
      res.status(500).json({ error: "Failed to fetch payments" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/payments/:paymentId
 * Get payment details
 */
router.get(
  "/:supplierId/payments/:paymentId",
  requirePermission("suppliers:read"),
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
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      res.json({
        data: {
          ...payment,
          amount: Number(payment.amount),
        },
      });
    } catch (error) {
      console.error("Error fetching payment:", error);
      res.status(500).json({ error: "Failed to fetch payment" });
    }
  }
);

/**
 * POST /api/suppliers/:supplierId/payments/:paymentId/retry
 * Manually retry a failed payment
 */
router.post(
  "/:supplierId/payments/:paymentId/retry",
  requirePermission("suppliers:update"),
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
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      if (payment.status !== "failed") {
        res.status(409).json({ error: "Only failed payments can be retried" });
        return;
      }

      // Schedule immediate retry
      await retryService.scheduleRetry(payment, new Error("Manual retry requested"));

      res.json({
        message: "Payment scheduled for retry",
        paymentId: payment.id,
        status: "pending_retry",
      });
    } catch (error) {
      console.error("Error retrying payment:", error);
      res.status(500).json({ error: "Failed to retry payment" });
    }
  }
);

/**
 * DELETE /api/suppliers/:supplierId/payments/:paymentId/cancel
 * Cancel pending payment
 */
router.delete(
  "/:supplierId/payments/:paymentId/cancel",
  requirePermission("suppliers:delete"),
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
        res.status(404).json({ error: "Payment not found" });
        return;
      }

      if (payment.status !== "pending") {
        res.status(409).json({ error: "Only pending payments can be cancelled" });
        return;
      }

      // Update payment
      const updated = await prisma.supplierPayment.update({
        where: { id: paymentId as string },
        data: {
          status: "cancelled",
          failureReason: reason,
          metadata: {
            ...(payment.metadata as any),
            cancelledBy: req.user?.id,
            cancelledAt: new Date().toISOString(),
            cancelReason: reason,
          },
        },
      });

      // Create audit log
      await prisma.supplierPaymentLog.create({
        data: {
          supplierId: supplierId as string,
          walletId: payment.walletId,
          paymentId,
          action: "cancelled",
          actorId: req.user?.id || "system",
          actorType: "system",
          notes: `Payment cancelled: ${payment.paymentType} of ${payment.currency} ${Number(payment.amount)}${
            reason ? `. Reason: ${reason}` : ""
          }`,
        },
      });

      res.json({
        message: "Payment cancelled successfully",
        data: {
          ...updated,
          amount: Number(updated.amount),
        },
      });
    } catch (error) {
      console.error("Error cancelling payment:", error);
      res.status(500).json({ error: "Failed to cancel payment" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/payment-logs
 * Get payment audit logs
 */
router.get(
  "/:supplierId/payment-logs",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "25", action } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 25;
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
      if (action) {
        whereClause.action = action;
      }

      const [logs, total] = await Promise.all([
        prisma.supplierPaymentLog.findMany({
          where: whereClause,
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierPaymentLog.count({ where: whereClause }),
      ]);

      res.json({
        data: logs.map((l) => ({
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
      console.error("Error fetching payment logs:", error);
      res.status(500).json({ error: "Failed to fetch payment logs" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/payment-stats
 * Get payment statistics
 */
router.get(
  "/:supplierId/payment-stats",
  requirePermission("suppliers:read"),
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
      console.error("Error fetching payment stats:", error);
      res.status(500).json({ error: "Failed to fetch payment stats" });
    }
  }
);

// ============================================
// HELPERS
// ============================================

async function getPaymentSummary(supplierId: string) {
  const payments = await prisma.supplierPayment.findMany({
    where: { supplierId },
  });

  return {
    total: payments.length,
    completed: payments.filter((p) => p.status === "completed").length,
    pending: payments.filter((p) => p.status === "pending").length,
    processing: payments.filter((p) => p.status === "processing").length,
    failed: payments.filter((p) => p.status === "failed").length,
    cancelled: payments.filter((p) => p.status === "cancelled").length,
    totalAmount: payments.reduce((sum, p) => sum + Number(p.amount), 0),
  };
}

export default router;
