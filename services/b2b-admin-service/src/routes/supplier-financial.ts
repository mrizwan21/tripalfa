import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";

const router: Router = Router();

// All financial routes require authentication
router.use(authMiddleware);

// ============================================
// SUPPLIER FINANCIAL MANAGEMENT
// ============================================

/**
 * GET /api/suppliers/:supplierId/financial
 * Get supplier's financial profile
 */
router.get(
  "/:supplierId/financial",
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

      // Get financial profile
      const financial = await prisma.supplierFinancial.findUnique({
        where: { supplierId: supplierId as string },
      });

      if (!financial) {
        res.status(404).json({ error: "Financial profile not found. Create one first." });
        return;
      }

      res.json({ data: financial });
    } catch (error) {
      console.error("Error fetching financial profile:", error);
      res.status(500).json({ error: "Failed to fetch financial profile" });
    }
  }
);

/**
 * PUT /api/suppliers/:supplierId/financial
 * Create or update supplier's financial profile
 */
router.put(
  "/:supplierId/financial",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const updateData = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      // Check if profile exists
      const existingProfile = await prisma.supplierFinancial.findUnique({
        where: { supplierId: supplierId as string },
      });

      let financial;

      if (existingProfile) {
        // Update existing profile
        financial = await prisma.supplierFinancial.update({
          where: { supplierId: supplierId as string },
          data: updateData,
        });
        res.json({
          message: "Financial profile updated successfully",
          data: financial,
        });
      } else {
        // Create new profile
        financial = await prisma.supplierFinancial.create({
          data: {
            supplierId: supplierId as string,
            paymentTerms: updateData.paymentTerms || "30_days",
            settlementCycle: updateData.settlementCycle || "monthly",
            commissionStructure: updateData.commissionStructure,
            minimumPayoutAmount: updateData.minimumPayoutAmount,
            bankAccountName: updateData.bankAccountName,
            bankAccountNumber: updateData.bankAccountNumber,
            bankCode: updateData.bankCode,
            swiftCode: updateData.swiftCode,
            accountHolderName: updateData.accountHolderName,
            country: updateData.country,
            currency: updateData.currency || "USD",
            taxId: updateData.taxId,
            paymentHolds: updateData.paymentHolds || false,
            holdReason: updateData.holdReason,
            holdExpiresAt: updateData.holdExpiresAt,
          },
        });
        res.status(201).json({
          message: "Financial profile created successfully",
          data: financial,
        });
      }
    } catch (error) {
      console.error("Error managing financial profile:", error);
      res.status(500).json({ error: "Failed to manage financial profile" });
    }
  }
);

/**
 * GET /api/suppliers/:supplierId/payment-terms
 * List payment terms for supplier
 */
router.get(
  "/:supplierId/payment-terms",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "10" } = req.query;

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

      const [terms, total] = await Promise.all([
        prisma.supplierPaymentTerm.findMany({
          where: { supplierId: supplierId as string },
          skip,
          take: limitNum,
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierPaymentTerm.count({
          where: { supplierId: supplierId as string },
        }),
      ]);

      res.json({
        data: terms,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching payment terms:", error);
      res.status(500).json({ error: "Failed to fetch payment terms" });
    }
  }
);

/**
 * POST /api/suppliers/:supplierId/payment-terms
 * Add payment term
 */
router.post(
  "/:supplierId/payment-terms",
  requirePermission("suppliers:create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { termType, daysFromBooking, percentageRequired, minimumAmount, description } = req.body;

      // Validation
      if (!termType) {
        res.status(400).json({ error: "termType is required" });
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

      const term = await prisma.supplierPaymentTerm.create({
        data: {
          supplierId: supplierId as string,
          termType,
          daysFromBooking: daysFromBooking || 0,
          percentageRequired,
          minimumAmount,
          description,
        },
      });

      res.status(201).json({
        message: "Payment term added successfully",
        data: term,
      });
    } catch (error) {
      console.error("Error creating payment term:", error);
      res.status(500).json({ error: "Failed to create payment term" });
    }
  }
);

/**
 * PUT /api/suppliers/:supplierId/payment-terms/:termId
 * Update payment term
 */
router.put(
  "/:supplierId/payment-terms/:termId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, termId } = req.params;
      const updateData = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      // Verify term exists
      const term = await prisma.supplierPaymentTerm.findFirst({
        where: { id: termId as string, supplierId: supplierId as string },
      });
      if (!term) {
        res.status(404).json({ error: "Payment term not found" });
        return;
      }

      const updated = await prisma.supplierPaymentTerm.update({
        where: { id: termId as string },
        data: updateData,
      });

      res.json({
        message: "Payment term updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating payment term:", error);
      res.status(500).json({ error: "Failed to update payment term" });
    }
  }
);

/**
 * DELETE /api/suppliers/:supplierId/payment-terms/:termId
 * Remove payment term
 */
router.delete(
  "/:supplierId/payment-terms/:termId",
  requirePermission("suppliers:delete"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, termId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId as string },
      });
      if (!supplier) {
        res.status(404).json({ error: "Supplier not found" });
        return;
      }

      // Verify term exists
      const term = await prisma.supplierPaymentTerm.findFirst({
        where: { id: termId as string, supplierId: supplierId as string },
      });
      if (!term) {
        res.status(404).json({ error: "Payment term not found" });
        return;
      }

      await prisma.supplierPaymentTerm.delete({ where: { id: termId as string } });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting payment term:", error);
      res.status(500).json({ error: "Failed to delete payment term" });
    }
  }
);

export default router;
