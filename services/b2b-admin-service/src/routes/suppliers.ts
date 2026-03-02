import { Router, Response } from "express";
import { prisma } from "../database.js";
import {
  AuthRequest,
  authMiddleware,
  requirePermission,
} from "../middleware/auth.js";
import {
  validateZod,
  paginationSchema,
  createSupplierSchema,
  idParamSchema,
} from "../middleware/validate.js";
import { Prisma } from "@prisma/client";

// Import supplier management sub-routes
import supplierProductsRoutes from "./supplier-products.js";
import supplierMappingsRoutes from "./supplier-mappings.js";
import supplierFinancialRoutes from "./supplier-financial.js";
import supplierWalletsRoutes from "./supplier-wallets.js";
import supplierPaymentsRoutes from "./supplier-payments-phase3.js"; // Phase 3: Payment gateway integration
import webhookRoutes from "./webhooks.js"; // Phase 3: Payment gateway webhooks

const router: Router = Router();

// All supplier routes require authentication
router.use(authMiddleware);

// GET /api/suppliers - List all suppliers
router.get(
  "/",
  requirePermission("suppliers:read"),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;
      const { type, status } = req.query;
      
      // Convert to numbers explicitly
      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (status !== undefined) {
        where.status = status === "true";
      }

      if (search) {
        where.OR = [
          { name: { contains: search, mode: Prisma.QueryMode.insensitive } },
          { code: { contains: search, mode: Prisma.QueryMode.insensitive } },
        ];
      }

      const [suppliers, total] = await Promise.all([
        prisma.supplier.findMany({
          where,
          skip: (pageNum - 1) * limitNum,
          take: limitNum,
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: "desc" },
          include: {
            _count: {
              select: {
                hotelMappings: true,
                credentials: true,
                syncLogs: true,
              },
            },
          },
        }),
        prisma.supplier.count({ where }),
      ]);

      res.json({
        success: true,
        data: suppliers,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (error) {
      console.error("Error fetching suppliers:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch suppliers",
      });
    }
  },
);

// GET /api/suppliers/:id - Get supplier by ID
router.get(
  "/:id",
  requirePermission("suppliers:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          credentials: {
            orderBy: { createdAt: "desc" },
          },
          syncLogs: {
            take: 10,
            orderBy: { createdAt: "desc" },
          },
          hotelMappings: {
            take: 20,
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      console.error("Error fetching supplier:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch supplier",
      });
    }
  },
);

// POST /api/suppliers - Create new supplier
router.post(
  "/",
  requirePermission("suppliers:create"),
  validateZod(createSupplierSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      // Check if code already exists
      const existingSupplier = await prisma.supplier.findUnique({
        where: { code: data.code },
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          error: "Supplier with this code already exists",
        });
      }

      const supplier = await prisma.supplier.create({
        data: {
          code: data.code,
          name: data.name,
          supplierType: data.type,
          apiEndpoint: data.apiBaseUrl || null,
          supportedRoutes:
            data.features && typeof data.features === "object"
              ? Object.keys(data.features).filter((key) => Boolean(data.features[key]))
              : [],
          metadata: {
            ...(data.metadata || {}),
            apiKey: data.apiKey || null,
            apiSecret: data.apiSecret || null,
            apiCredentials: data.apiCredentials || null,
            rateLimitPerMin: data.rateLimitPerMin || null,
            rateLimitPerDay: data.rateLimitPerDay || null,
            features: data.features || null,
          },
        },
      });

      res.status(201).json({
        success: true,
        data: supplier,
        message: "Supplier created successfully",
      });
    } catch (error) {
      console.error("Error creating supplier:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create supplier",
      });
    }
  },
);

// PUT /api/suppliers/:id - Update supplier
router.put(
  "/:id",
  requirePermission("suppliers:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const data = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
          name: data.name,
          supplierType: data.type,
          apiEndpoint: data.apiBaseUrl,
          supportedRoutes:
            data.features && typeof data.features === "object"
              ? Object.keys(data.features).filter((key) => Boolean(data.features[key]))
              : undefined,
          metadata:
            data.metadata ||
            data.apiKey ||
            data.apiSecret ||
            data.apiCredentials ||
            data.rateLimitPerMin ||
            data.rateLimitPerDay ||
            data.syncEnabled !== undefined ||
            data.syncInterval !== undefined ||
            data.features
              ? {
                  ...(supplier.metadata && typeof supplier.metadata === "object"
                    ? (supplier.metadata as Record<string, unknown>)
                    : {}),
                  ...(data.metadata || {}),
                  apiKey: data.apiKey,
                  apiSecret: data.apiSecret,
                  apiCredentials: data.apiCredentials,
                  rateLimitPerMin: data.rateLimitPerMin,
                  rateLimitPerDay: data.rateLimitPerDay,
                  syncEnabled: data.syncEnabled,
                  syncInterval: data.syncInterval,
                  features: data.features,
                }
              : undefined,
        },
      });

      res.json({
        success: true,
        data: updatedSupplier,
        message: "Supplier updated successfully",
      });
    } catch (error) {
      console.error("Error updating supplier:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update supplier",
      });
    }
  },
);

// PUT /api/suppliers/:id/status - Toggle supplier status
router.put(
  "/:id/status",
  requirePermission("suppliers:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { status } = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: { status: status ? "active" : "inactive" },
      });

      res.json({
        success: true,
        data: updatedSupplier,
        message: `Supplier ${status ? "activated" : "deactivated"} successfully`,
      });
    } catch (error) {
      console.error("Error updating supplier status:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update supplier status",
      });
    }
  },
);

// DELETE /api/suppliers/:id - Delete supplier
router.delete(
  "/:id",
  requirePermission("suppliers:delete"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          _count: {
            select: { hotelMappings: true, walletApprovals: true },
          },
          wallet: true,
        },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      // Check if supplier has mappings
      if (supplier._count.hotelMappings > 0) {
        return res.status(400).json({
          success: false,
          error: "Cannot delete supplier with existing hotel mappings",
        });
      }

      // Check if supplier has wallets
      if (supplier.wallet) {
        return res.status(409).json({
          success: false,
          error: "Cannot delete supplier with existing wallets. Clear all financial liabilities first.",
        });
      }

      await prisma.supplier.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: "Supplier deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting supplier:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete supplier",
      });
    }
  },
);

// ============================================
// Supplier Credentials Routes
// ============================================

// GET /api/suppliers/:id/credentials - Get supplier credentials
router.get(
  "/:id/credentials",
  requirePermission("suppliers:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const credentials = await prisma.supplierCredential.findMany({
        where: { supplierId: id },
        orderBy: { createdAt: "desc" },
      });

      // Mask sensitive data
      const maskedCredentials = credentials.map((cred) => ({
        ...cred,
        name: cred.environment,
        apiKey: cred.apiKey ? "••••••••" + cred.apiKey.slice(-4) : null,
        apiSecret: cred.apiSecret ? "••••••••" : null,
      }));

      res.json({
        success: true,
        data: maskedCredentials,
      });
    } catch (error) {
      console.error("Error fetching credentials:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch credentials",
      });
    }
  },
);

// POST /api/suppliers/:id/credentials - Add supplier credentials
router.post(
  "/:id/credentials",
  requirePermission("suppliers:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, apiKey, apiSecret } = req.body;

      if (!name || !apiKey) {
        return res.status(400).json({
          success: false,
          error: "Name and API key are required",
        });
      }

      // Check if credential name already exists for this supplier
      const existing = await prisma.supplierCredential.findFirst({
        where: {
          supplierId: id,
          environment: name,
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Credential with this name already exists",
        });
      }

      const credential = await prisma.supplierCredential.create({
        data: {
          supplierId: id,
          environment: name,
          apiKey,
          apiSecret: apiSecret || null,
        },
      });

      res.status(201).json({
        success: true,
        data: {
          ...credential,
          name: credential.environment,
          apiKey: "••••••••" + credential.apiKey.slice(-4),
          apiSecret: credential.apiSecret ? "••••••••" : null,
        },
        message: "Credential added successfully",
      });
    } catch (error) {
      console.error("Error adding credential:", error);
      res.status(500).json({
        success: false,
        error: "Failed to add credential",
      });
    }
  },
);

// PUT /api/suppliers/:id/credentials/:credId - Update credential
router.put(
  "/:id/credentials/:credId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, credId } = req.params;
      const { apiKey, apiSecret, status } = req.body;

      const credential = await prisma.supplierCredential.findFirst({
        where: { id: credId, supplierId: id },
      });

      if (!credential) {
        return res.status(404).json({
          success: false,
          error: "Credential not found",
        });
      }

      const updateData: any = {};
      if (apiKey) updateData.apiKey = apiKey;
      if (apiSecret) updateData.apiSecret = apiSecret;
      if (status) updateData.isActive = status === "active";

      const updatedCredential = await prisma.supplierCredential.update({
        where: { id: credId },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          ...updatedCredential,
          name: updatedCredential.environment,
          apiKey: "••••••••" + updatedCredential.apiKey.slice(-4),
          apiSecret: updatedCredential.apiSecret ? "••••••••" : null,
        },
        message: "Credential updated successfully",
      });
    } catch (error) {
      console.error("Error updating credential:", error);
      res.status(500).json({
        success: false,
        error: "Failed to update credential",
      });
    }
  },
);

// DELETE /api/suppliers/:id/credentials/:credId - Delete credential
router.delete(
  "/:id/credentials/:credId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, credId } = req.params;

      const credential = await prisma.supplierCredential.findFirst({
        where: { id: credId, supplierId: id },
      });

      if (!credential) {
        return res.status(404).json({
          success: false,
          error: "Credential not found",
        });
      }

      await prisma.supplierCredential.delete({
        where: { id: credId },
      });

      res.json({
        success: true,
        message: "Credential deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting credential:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete credential",
      });
    }
  },
);

// ============================================
// Supplier Sync Routes
// ============================================

// GET /api/suppliers/:id/sync-logs - Get supplier sync logs
router.get(
  "/:id/sync-logs",
  requirePermission("suppliers:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, dataType, status } = req.query;

      const where: any = { supplierId: id };
      if (dataType) where.metadata = { path: ["dataType"], equals: dataType };
      if (status) where.status = status;

      const [logs, total] = await Promise.all([
        prisma.supplierSyncLog.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierSyncLog.count({ where }),
      ]);

      res.json({
        success: true,
        data: logs,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching sync logs:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch sync logs",
      });
    }
  },
);

// POST /api/suppliers/:id/sync - Trigger supplier sync
router.post(
  "/:id/sync",
  requirePermission("suppliers:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { syncType = "incremental", dataType = "hotels" } = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: "Supplier not found",
        });
      }

      if (supplier.status !== "active") {
        return res.status(400).json({
          success: false,
          error: "Supplier is not active",
        });
      }

      // Create sync log
      const syncLog = await prisma.supplierSyncLog.create({
        data: {
          supplierId: id,
          syncType,
          status: "pending",
          metadata: { dataType },
        },
      });

      // In a real implementation, this would trigger a background job
      // For now, we just create the log and return

      res.json({
        success: true,
        data: syncLog,
        message: "Sync initiated successfully",
      });
    } catch (error) {
      console.error("Error triggering sync:", error);
      res.status(500).json({
        success: false,
        error: "Failed to trigger sync",
      });
    }
  },
);

// ============================================
// Supplier Hotel Mappings Routes
// ============================================

// GET /api/suppliers/:id/hotel-mappings - Get supplier hotel mappings
router.get(
  "/:id/hotel-mappings",
  requirePermission("suppliers:read"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, search } = req.query;

      const where: any = { supplierId: id };

      if (search) {
        where.OR = [
          {
            supplierHotelId: {
              contains: search as string,
              mode: Prisma.QueryMode.insensitive,
            },
          },
          {
            hotelName: {
              contains: search as string,
              mode: Prisma.QueryMode.insensitive,
            },
          },
        ];
      }

      const [mappings, total] = await Promise.all([
        prisma.supplierHotelMapping.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: "desc" },
        }),
        prisma.supplierHotelMapping.count({ where }),
      ]);

      res.json({
        success: true,
        data: mappings,
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total,
          totalPages: Math.ceil(total / Number(limit)),
        },
      });
    } catch (error) {
      console.error("Error fetching hotel mappings:", error);
      res.status(500).json({
        success: false,
        error: "Failed to fetch hotel mappings",
      });
    }
  },
);

// POST /api/suppliers/:id/hotel-mappings - Create hotel mapping
router.post(
  "/:id/hotel-mappings",
  requirePermission("suppliers:update"),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const {
        canonicalHotelId,
        supplierHotelId,
        supplierHotelCode,
        matchType,
        matchConfidence,
      } = req.body;

      if (!canonicalHotelId || !supplierHotelId) {
        return res.status(400).json({
          success: false,
          error: "Canonical hotel ID and supplier hotel ID are required",
        });
      }

      // Check if mapping already exists
      const existing = await prisma.supplierHotelMapping.findFirst({
        where: {
          supplierId: id,
          supplierHotelId,
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: "Mapping already exists for this supplier hotel ID",
        });
      }

      const mapping = await prisma.supplierHotelMapping.create({
        data: {
          supplierId: id,
          supplierHotelId,
          localHotelId: canonicalHotelId || null,
          hotelName: supplierHotelCode || null,
        },
      });

      res.status(201).json({
        success: true,
        data: mapping,
        message: "Hotel mapping created successfully",
      });
    } catch (error) {
      console.error("Error creating hotel mapping:", error);
      res.status(500).json({
        success: false,
        error: "Failed to create hotel mapping",
      });
    }
  },
);

// DELETE /api/suppliers/:id/hotel-mappings/:mappingId - Delete hotel mapping
router.delete(
  "/:id/hotel-mappings/:mappingId",
  requirePermission("suppliers:update"),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, mappingId } = req.params;

      const mapping = await prisma.supplierHotelMapping.findFirst({
        where: { id: mappingId, supplierId: id },
      });

      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: "Hotel mapping not found",
        });
      }

      await prisma.supplierHotelMapping.delete({
        where: { id: mappingId },
      });

      res.json({
        success: true,
        message: "Hotel mapping deleted successfully",
      });
    } catch (error) {
      console.error("Error deleting hotel mapping:", error);
      res.status(500).json({
        success: false,
        error: "Failed to delete hotel mapping",
      });
    }
  },
);

// ============================================
// SUPPLIER MANAGEMENT MODULE ROUTES
// ============================================
// Mount Phase 2 supplier management sub-routes
router.use("/", supplierProductsRoutes);
router.use("/", supplierMappingsRoutes);
router.use("/", supplierFinancialRoutes);
router.use("/", supplierWalletsRoutes);
router.use("/", supplierPaymentsRoutes);

// Mount Phase 3 payment gateway webhooks (outside auth - signature verified internally)
router.use("/webhooks", webhookRoutes);

export default router;
