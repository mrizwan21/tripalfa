import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";

const router: Router = Router();

// All routes require authentication
router.use(authMiddleware);

// ============================================
// PRODUCT MAPPINGS
// ============================================

/**
 * GET /:supplierId/mappings
 * List product mappings with filters
 */
router.get(
  "/:supplierId/mappings",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "10", status, productType } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Build filter
      const where: any = { supplierId };
      if (status) where.status = status;
      if (productType) where.productType = productType;

      // Get mappings
      const [mappings, total] = await Promise.all([
        prisma.supplierProductMapping.findMany({
          where,
          skip,
          take: limitNum,
          include: { supplierProduct: true, parameters: true },
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierProductMapping.count({ where }),
      ]);

      res.json({
        success: true,
        data: mappings,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          pages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching mappings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch mappings",
      });
    }
  }
);

/**
 * POST /:supplierId/mappings
 * Create product mapping
 */
router.post(
  "/:supplierId/mappings",
  requirePermission("suppliers:create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const {
        supplierProductId,
        productType,
        platformProductId,
        marketNames,
        geographyZones,
        seasonalApplicable,
        businessRules,
      } = req.body;

      // Verify required fields
      if (!supplierProductId || !productType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: supplierProductId, productType",
        });
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify product exists
      const product = await prisma.supplierProduct.findFirst({
        where: { id: supplierProductId, supplierId },
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Supplier product not found",
        });
      }

      // Create mapping
      const mapping = await prisma.supplierProductMapping.create({
        data: {
          supplierId,
          supplierProductId,
          productType,
          platformProductId,
          marketNames: marketNames || [],
          geographyZones: geographyZones || [],
          seasonalApplicable: seasonalApplicable || "year-round",
          businessRules,
          status: "pending",
          matchConfidence: 75,
        },
        include: { parameters: true },
      });

      res.status(201).json({
        success: true,
        message: "Mapping created (pending admin approval)",
        data: mapping,
      });
    } catch (error) {
      console.error("Error creating mapping:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create mapping",
      });
    }
  }
);

/**
 * PUT /:supplierId/mappings/:mappingId
 * Update product mapping
 */
router.put(
  "/:supplierId/mappings/:mappingId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;
      const updateData = req.body;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify mapping exists
      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      // Update mapping
      const updated = await prisma.supplierProductMapping.update({
        where: { id: mappingId },
        data: updateData,
        include: { parameters: true },
      });

      res.json({
        success: true,
        message: "Mapping updated successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error updating mapping:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update mapping",
      });
    }
  }
);

/**
 * POST /:supplierId/mappings/:mappingId/approve
 * Admin approves product mapping
 */
router.post(
  "/:supplierId/mappings/:mappingId/approve",
  requirePermission("suppliers:approve"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;
      const { matchConfidence, approvalNotes } = req.body;
      const approvedBy = req.user?.userId;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify mapping exists
      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      // Approve mapping
      const updated = await prisma.supplierProductMapping.update({
        where: { id: mappingId },
        data: {
          status: "active",
          approvedBy,
          approvedAt: new Date(),
          matchConfidence: matchConfidence || mapping.matchConfidence,
        },
        include: { parameters: true },
      });

      res.json({
        success: true,
        message: "Mapping approved successfully",
        data: updated,
      });
    } catch (error) {
      console.error("Error approving mapping:", error);
      res.status(500).json({
        success: false,
        error: "Failed to approve mapping",
      });
    }
  }
);

/**
 * DELETE /:supplierId/mappings/:mappingId
 * Deactivate product mapping
 */
router.delete(
  "/:supplierId/mappings/:mappingId",
  requirePermission("suppliers:delete"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify mapping exists
      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      // Deactivate (not hard delete)
      await prisma.supplierProductMapping.update({
        where: { id: mappingId },
        data: { status: "inactive" },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mapping:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete mapping",
      });
    }
  }
);

// ============================================
// MAPPING PARAMETERS
// ============================================

/**
 * GET /:supplierId/mappings/:mappingId/parameters
 * List mapping parameters
 */
router.get(
  "/:supplierId/mappings/:mappingId/parameters",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify mapping exists
      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      // Get parameters
      const parameters = await prisma.productMappingParameter.findMany({
        where: { mappingId },
        orderBy: { createdAt: "desc" },
      });

      res.json({
        success: true,
        data: parameters,
      });
    } catch (error) {
      console.error("Error fetching mapping parameters:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch mapping parameters",
      });
    }
  }
);

/**
 * POST /:supplierId/mappings/:mappingId/parameters
 * Add mapping parameter
 */
router.post(
  "/:supplierId/mappings/:mappingId/parameters",
  requirePermission("suppliers:create"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;
      const {
        parameterType,
        parameterName,
        parameterValue,
        unit,
        marketName,
        validFrom,
        validTo,
      } = req.body;

      // Verify required fields
      if (!parameterType || !parameterName || parameterValue === undefined) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: parameterType, parameterName, parameterValue",
        });
      }

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify mapping exists
      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      // Create parameter
      const parameter = await prisma.productMappingParameter.create({
        data: {
          mappingId,
          parameterType,
          parameterName,
          parameterValue,
          unit: unit || "percentage",
          marketName,
          validFrom: validFrom ? new Date(validFrom) : null,
          validTo: validTo ? new Date(validTo) : null,
        },
      });

      res.status(201).json({
        success: true,
        message: "Parameter added successfully",
        data: parameter,
      });
    } catch (error) {
      console.error("Error creating mapping parameter:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create mapping parameter",
      });
    }
  }
);

/**
 * DELETE /:supplierId/mappings/:mappingId/parameters/:parameterId
 * Remove mapping parameter
 */
router.delete(
  "/:supplierId/mappings/:mappingId/parameters/:parameterId",
  requirePermission("suppliers:delete"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId, parameterId } = req.params;

      // Verify supplier exists
      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Verify mapping exists
      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      // Verify parameter exists
      const parameter = await prisma.productMappingParameter.findFirst({
        where: { id: parameterId, mappingId },
      });
      if (!parameter) {
        return res.status(404).json({
          success: false,
          error: "Parameter not found",
        });
      }

      // Delete parameter
      await prisma.productMappingParameter.delete({
        where: { id: parameterId },
      });

      res.status(204).send();
    } catch (error) {
      console.error("Error deleting mapping parameter:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete mapping parameter",
      });
    }
  }
);

export default router;
