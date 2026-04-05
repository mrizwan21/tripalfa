import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/suppliers/{supplierId}/mappings:
 *   get:
 *     summary: List product mappings
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 10
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: productType
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
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
  "/:supplierId/mappings",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId } = req.params;
      const { page = "1", limit = "10", status, productType } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;
      const skip = (pageNum - 1) * limitNum;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const where: any = { supplierId };
      if (status) where.status = status;
      if (productType) where.productType = productType;

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
 * @swagger
 * /api/suppliers/{supplierId}/mappings:
 *   post:
 *     summary: Create product mapping
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - supplierProductId
 *               - productType
 *             properties:
 *               supplierProductId:
 *                 type: string
 *               productType:
 *                 type: string
 *               platformProductId:
 *                 type: string
 *               marketNames:
 *                 type: array
 *                 items:
 *                   type: string
 *               geographyZones:
 *                 type: array
 *                 items:
 *                   type: string
 *               seasonalApplicable:
 *                 type: string
 *               businessRules:
 *                 type: object
 *     responses:
 *       201:
 *         description: Success
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
 *         description: Missing required fields
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

      if (!supplierProductId || !productType) {
        return res.status(400).json({
          success: false,
          error: "Missing required fields: supplierProductId, productType",
        });
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const product = await prisma.supplierProduct.findFirst({
        where: { id: supplierProductId, supplierId },
      });
      if (!product) {
        return res.status(404).json({
          success: false,
          error: "Supplier product not found",
        });
      }

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
 * @swagger
 * /api/suppliers/{supplierId}/mappings/{mappingId}:
 *   put:
 *     summary: Update product mapping
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
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
  "/:supplierId/mappings/:mappingId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;
      const updateData = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

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
 * @swagger
 * /api/suppliers/{supplierId}/mappings/{mappingId}/approve:
 *   post:
 *     summary: Admin approves product mapping
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               matchConfidence:
 *                 type: number
 *               approvalNotes:
 *                 type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
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
  "/:supplierId/mappings/:mappingId/approve",
  requirePermission("suppliers:approve"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;
      const { matchConfidence, approvalNotes } = req.body;
      const approvedBy = req.user?.userId;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

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
 * @swagger
 * /api/suppliers/{supplierId}/mappings/{mappingId}:
 *   delete:
 *     summary: Deactivate product mapping
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Mapping deactivated successfully
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
  "/:supplierId/mappings/:mappingId",
  requirePermission("suppliers:delete"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

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

/**
 * @swagger
 * /api/suppliers/{supplierId}/mappings/{mappingId}/parameters:
 *   get:
 *     summary: List mapping parameters
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
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
  "/:supplierId/mappings/:mappingId/parameters",
  requirePermission("suppliers:read"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

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
 * @swagger
 * /api/suppliers/{supplierId}/mappings/{mappingId}/parameters:
 *   post:
 *     summary: Add mapping parameter
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - parameterType
 *               - parameterName
 *               - parameterValue
 *             properties:
 *               parameterType:
 *                 type: string
 *               parameterName:
 *                 type: string
 *               parameterValue:
 *                 type: number
 *               unit:
 *                 type: string
 *               marketName:
 *                 type: string
 *               validFrom:
 *                 type: string
 *                 format: date-time
 *               validTo:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Success
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
 *         description: Missing required fields
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

      if (!parameterType || !parameterName || parameterValue === undefined) {
        return res.status(400).json({
          success: false,
          error:
            "Missing required fields: parameterType, parameterName, parameterValue",
        });
      }

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

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
 * @swagger
 * /api/suppliers/{supplierId}/mappings/{mappingId}/parameters/{parameterId}:
 *   delete:
 *     summary: Remove mapping parameter
 *     tags: [Supplier Mappings]
 *     parameters:
 *       - in: path
 *         name: supplierId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: mappingId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: parameterId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Parameter removed successfully
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
  "/:supplierId/mappings/:mappingId/parameters/:parameterId",
  requirePermission("suppliers:delete"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { supplierId, mappingId, parameterId } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id: supplierId },
      });
      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const mapping = await prisma.supplierProductMapping.findFirst({
        where: { id: mappingId, supplierId },
      });
      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Mapping not found",
        });
      }

      const parameter = await prisma.productMappingParameter.findFirst({
        where: { id: parameterId, mappingId },
      });
      if (!parameter) {
        return res.status(404).json({
          success: false,
          error: "Parameter not found",
        });
      }

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
