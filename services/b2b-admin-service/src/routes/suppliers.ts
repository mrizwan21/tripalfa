import { Router, Response } from 'express';
import { prisma } from '../database.js';
import { AuthRequest, authMiddleware, requirePermission } from '../middleware/auth.js';
import {
  validateZod,
  paginationSchema,
  createSupplierSchema,
  idParamSchema,
} from '../middleware/validate.js';
import { Prisma } from '@prisma/client';

// Import supplier management sub-routes
import supplierProductsRoutes from './supplier-products.js';
import supplierMappingsRoutes from './supplier-mappings.js';
import supplierFinancialRoutes from './supplier-financial.js';
import supplierWalletsRoutes from './supplier-wallets.js';
import supplierPaymentsRoutes from './supplier-payments-phase3.js';
import webhookRoutes from './webhooks.js';

const router: Router = Router();

router.use(authMiddleware);

/**
 * @swagger
 * /api/suppliers:
 *   get:
 *     summary: List all suppliers with pagination
 *     tags: [Suppliers]
 *     parameters:
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
 *         name: type
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: search
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
 */
router.get(
  '/',
  requirePermission('suppliers:read'),
  validateZod(paginationSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { page, limit, sortBy, sortOrder, search } = req.query as any;
      const { type, status } = req.query;

      const pageNum = Number(page) || 1;
      const limitNum = Number(limit) || 10;

      const where: any = {};

      if (type) {
        where.type = type;
      }

      if (status !== undefined) {
        where.status = status === 'true';
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
          orderBy: sortBy ? { [sortBy]: sortOrder } : { createdAt: 'desc' },
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
      console.error('Error fetching suppliers:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch suppliers',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   get:
 *     summary: Get supplier by ID
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
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
 *                   type: object
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.get(
  '/:id',
  requirePermission('suppliers:read'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
        include: {
          credentials: {
            orderBy: { createdAt: 'desc' },
          },
          syncLogs: {
            take: 10,
            orderBy: { createdAt: 'desc' },
          },
          hotelMappings: {
            take: 20,
          },
        },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: 'Supplier not found',
        });
      }

      res.json({
        success: true,
        data: supplier,
      });
    } catch (error) {
      console.error('Error fetching supplier:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch supplier',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers:
 *   post:
 *     summary: Create new supplier
 *     tags: [Suppliers]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [code, name]
 *             properties:
 *               code: { type: string }
 *               name: { type: string }
 *               type: { type: string }
 *               apiBaseUrl: { type: string }
 *               metadata: { type: object }
 *               apiKey: { type: string }
 *               apiSecret: { type: string }
 *               apiCredentials: { type: object }
 *               rateLimitPerMin: { type: integer }
 *               rateLimitPerDay: { type: integer }
 *               features: { type: object }
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/',
  requirePermission('suppliers:create'),
  validateZod(createSupplierSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const data = req.body;

      const existingSupplier = await prisma.supplier.findUnique({
        where: { code: data.code },
      });

      if (existingSupplier) {
        return res.status(400).json({
          success: false,
          error: 'Supplier with this code already exists',
        });
      }

      const supplier = await prisma.supplier.create({
        data: {
          code: data.code,
          name: data.name,
          supplierType: data.type,
          apiEndpoint: data.apiBaseUrl || null,
          supportedRoutes:
            data.features && typeof data.features === 'object'
              ? Object.keys(data.features).filter(key => Boolean(data.features[key]))
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
        message: 'Supplier created successfully',
      });
    } catch (error) {
      console.error('Error creating supplier:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create supplier',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   put:
 *     summary: Update supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               type: { type: string }
 *               apiBaseUrl: { type: string }
 *               metadata: { type: object }
 *               apiKey: { type: string }
 *               apiSecret: { type: string }
 *               apiCredentials: { type: object }
 *               rateLimitPerMin: { type: integer }
 *               rateLimitPerDay: { type: integer }
 *               syncEnabled: { type: boolean }
 *               syncInterval: { type: string }
 *               features: { type: object }
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
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id',
  requirePermission('suppliers:update'),
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
          error: 'Supplier not found',
        });
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: {
          name: data.name,
          supplierType: data.type,
          apiEndpoint: data.apiBaseUrl,
          supportedRoutes:
            data.features && typeof data.features === 'object'
              ? Object.keys(data.features).filter(key => Boolean(data.features[key]))
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
                  ...(supplier.metadata && typeof supplier.metadata === 'object'
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
        message: 'Supplier updated successfully',
      });
    } catch (error) {
      console.error('Error updating supplier:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update supplier',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/status:
 *   put:
 *     summary: Toggle supplier status
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: boolean
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
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/status',
  requirePermission('suppliers:update'),
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
          error: 'Supplier not found',
        });
      }

      const updatedSupplier = await prisma.supplier.update({
        where: { id },
        data: { status: status ? 'active' : 'inactive' },
      });

      res.json({
        success: true,
        data: updatedSupplier,
        message: `Supplier ${status ? 'activated' : 'deactivated'} successfully`,
      });
    } catch (error) {
      console.error('Error updating supplier status:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update supplier status',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}:
 *   delete:
 *     summary: Delete supplier
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 message:
 *                   type: string
 *       400:
 *         description: Cannot delete supplier with existing hotel mappings
 *       404:
 *         description: Supplier not found
 *       409:
 *         description: Cannot delete supplier with existing wallets
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id',
  requirePermission('suppliers:delete'),
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
          error: 'Supplier not found',
        });
      }

      if (supplier._count.hotelMappings > 0) {
        return res.status(400).json({
          success: false,
          error: 'Cannot delete supplier with existing hotel mappings',
        });
      }

      if (supplier.wallet) {
        return res.status(409).json({
          success: false,
          error:
            'Cannot delete supplier with existing wallets. Clear all financial liabilities first.',
        });
      }

      await prisma.supplier.delete({
        where: { id },
      });

      res.json({
        success: true,
        message: 'Supplier deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting supplier:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete supplier',
      });
    }
  }
);

// ============================================
// Supplier Credentials Routes
// ============================================

/**
 * @swagger
 * /api/suppliers/{id}/credentials:
 *   get:
 *     summary: Get supplier credentials
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
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
 */
router.get(
  '/:id/credentials',
  requirePermission('suppliers:read'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;

      const credentials = await prisma.supplierCredential.findMany({
        where: { supplierId: id },
        orderBy: { createdAt: 'desc' },
      });

      const maskedCredentials = credentials.map(cred => ({
        ...cred,
        name: cred.environment,
        apiKey: cred.apiKey ? '••••••••' + cred.apiKey.slice(-4) : null,
        apiSecret: cred.apiSecret ? '••••••••' : null,
      }));

      res.json({
        success: true,
        data: maskedCredentials,
      });
    } catch (error) {
      console.error('Error fetching credentials:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch credentials',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/credentials:
 *   post:
 *     summary: Add supplier credentials
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, apiKey]
 *             properties:
 *               name: { type: string }
 *               apiKey: { type: string }
 *               apiSecret: { type: string }
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/credentials',
  requirePermission('suppliers:update'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { name, apiKey, apiSecret } = req.body;

      if (!name || !apiKey) {
        return res.status(400).json({
          success: false,
          error: 'Name and API key are required',
        });
      }

      const existing = await prisma.supplierCredential.findFirst({
        where: {
          supplierId: id,
          environment: name,
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Credential with this name already exists',
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
          apiKey: '••••••••' + credential.apiKey.slice(-4),
          apiSecret: credential.apiSecret ? '••••••••' : null,
        },
        message: 'Credential added successfully',
      });
    } catch (error) {
      console.error('Error adding credential:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to add credential',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/credentials/{credId}:
 *   put:
 *     summary: Update credential
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: credId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               apiKey: { type: string }
 *               apiSecret: { type: string }
 *               status: { type: string }
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
 *       404:
 *         description: Credential not found
 *       500:
 *         description: Server error
 */
router.put(
  '/:id/credentials/:credId',
  requirePermission('suppliers:update'),
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
          error: 'Credential not found',
        });
      }

      const updateData: any = {};
      if (apiKey) updateData.apiKey = apiKey;
      if (apiSecret) updateData.apiSecret = apiSecret;
      if (status) updateData.isActive = status === 'active';

      const updatedCredential = await prisma.supplierCredential.update({
        where: { id: credId },
        data: updateData,
      });

      res.json({
        success: true,
        data: {
          ...updatedCredential,
          name: updatedCredential.environment,
          apiKey: '••••••••' + updatedCredential.apiKey.slice(-4),
          apiSecret: updatedCredential.apiSecret ? '••••••••' : null,
        },
        message: 'Credential updated successfully',
      });
    } catch (error) {
      console.error('Error updating credential:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to update credential',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/credentials/{credId}:
 *   delete:
 *     summary: Delete credential
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: credId
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
 *                 message:
 *                   type: string
 *       404:
 *         description: Credential not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/credentials/:credId',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, credId } = req.params;

      const credential = await prisma.supplierCredential.findFirst({
        where: { id: credId, supplierId: id },
      });

      if (!credential) {
        return res.status(404).json({
          success: false,
          error: 'Credential not found',
        });
      }

      await prisma.supplierCredential.delete({
        where: { id: credId },
      });

      res.json({
        success: true,
        message: 'Credential deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting credential:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete credential',
      });
    }
  }
);

// ============================================
// Supplier Sync Routes
// ============================================

/**
 * @swagger
 * /api/suppliers/{id}/sync-logs:
 *   get:
 *     summary: Get supplier sync logs
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
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
 *           default: 20
 *       - in: query
 *         name: dataType
 *         schema:
 *           type: string
 *       - in: query
 *         name: status
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
 */
router.get(
  '/:id/sync-logs',
  requirePermission('suppliers:read'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { page = 1, limit = 20, dataType, status } = req.query;

      const where: any = { supplierId: id };
      if (dataType) where.metadata = { path: ['dataType'], equals: dataType };
      if (status) where.status = status;

      const [logs, total] = await Promise.all([
        prisma.supplierSyncLog.findMany({
          where,
          skip: (Number(page) - 1) * Number(limit),
          take: Number(limit),
          orderBy: { createdAt: 'desc' },
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
      console.error('Error fetching sync logs:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch sync logs',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/sync:
 *   post:
 *     summary: Trigger supplier sync
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               syncType:
 *                 type: string
 *                 default: incremental
 *               dataType:
 *                 type: string
 *                 default: hotels
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
 *       400:
 *         description: Supplier is not active
 *       404:
 *         description: Supplier not found
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/sync',
  requirePermission('suppliers:update'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { syncType = 'incremental', dataType = 'hotels' } = req.body;

      const supplier = await prisma.supplier.findUnique({
        where: { id },
      });

      if (!supplier) {
        return res.status(404).json({
          success: false,
          error: 'Supplier not found',
        });
      }

      if (supplier.status !== 'active') {
        return res.status(400).json({
          success: false,
          error: 'Supplier is not active',
        });
      }

      const syncLog = await prisma.supplierSyncLog.create({
        data: {
          supplierId: id,
          syncType,
          status: 'pending',
          metadata: { dataType },
        },
      });

      res.json({
        success: true,
        data: syncLog,
        message: 'Sync initiated successfully',
      });
    } catch (error) {
      console.error('Error triggering sync:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to trigger sync',
      });
    }
  }
);

// ============================================
// Supplier Hotel Mappings Routes
// ============================================

/**
 * @swagger
 * /api/suppliers/{id}/hotel-mappings:
 *   get:
 *     summary: Get supplier hotel mappings
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
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
 *           default: 20
 *       - in: query
 *         name: search
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
 */
router.get(
  '/:id/hotel-mappings',
  requirePermission('suppliers:read'),
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
          orderBy: { createdAt: 'desc' },
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
      console.error('Error fetching hotel mappings:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to fetch hotel mappings',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/hotel-mappings:
 *   post:
 *     summary: Create hotel mapping
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [supplierHotelId]
 *             properties:
 *               canonicalHotelId: { type: string }
 *               supplierHotelId: { type: string }
 *               supplierHotelCode: { type: string }
 *               matchType: { type: string }
 *               matchConfidence: { type: number }
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
 *         description: Bad request
 *       500:
 *         description: Server error
 */
router.post(
  '/:id/hotel-mappings',
  requirePermission('suppliers:update'),
  validateZod(idParamSchema),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id } = req.params;
      const { canonicalHotelId, supplierHotelId, supplierHotelCode, matchType, matchConfidence } =
        req.body;

      if (!canonicalHotelId || !supplierHotelId) {
        return res.status(400).json({
          success: false,
          error: 'Canonical hotel ID and supplier hotel ID are required',
        });
      }

      const existing = await prisma.supplierHotelMapping.findFirst({
        where: {
          supplierId: id,
          supplierHotelId,
        },
      });

      if (existing) {
        return res.status(400).json({
          success: false,
          error: 'Mapping already exists for this supplier hotel ID',
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
        message: 'Hotel mapping created successfully',
      });
    } catch (error) {
      console.error('Error creating hotel mapping:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create hotel mapping',
      });
    }
  }
);

/**
 * @swagger
 * /api/suppliers/{id}/hotel-mappings/{mappingId}:
 *   delete:
 *     summary: Delete hotel mapping
 *     tags: [Suppliers]
 *     parameters:
 *       - in: path
 *         name: id
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
 *                 message:
 *                   type: string
 *       404:
 *         description: Hotel mapping not found
 *       500:
 *         description: Server error
 */
router.delete(
  '/:id/hotel-mappings/:mappingId',
  requirePermission('suppliers:update'),
  async (req: AuthRequest, res: Response) => {
    try {
      const { id, mappingId } = req.params;

      const mapping = await prisma.supplierHotelMapping.findFirst({
        where: { id: mappingId, supplierId: id },
      });

      if (!mapping) {
        return res.status(404).json({
          success: false,
          error: 'Hotel mapping not found',
        });
      }

      await prisma.supplierHotelMapping.delete({
        where: { id: mappingId },
      });

      res.json({
        success: true,
        message: 'Hotel mapping deleted successfully',
      });
    } catch (error) {
      console.error('Error deleting hotel mapping:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to delete hotel mapping',
      });
    }
  }
);

// ============================================
// SUPPLIER MANAGEMENT MODULE ROUTES
// ============================================
router.use('/', supplierProductsRoutes);
router.use('/', supplierMappingsRoutes);
router.use('/', supplierFinancialRoutes);
router.use('/', supplierWalletsRoutes);
router.use('/', supplierPaymentsRoutes);

router.use('/webhooks', webhookRoutes);

export default router;
