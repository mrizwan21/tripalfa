/**
 * Duffel Flight API Routes
 * Handles all Duffel API endpoints for flight bookings with Hybrid Caching
 *
 * Architecture:
 * - Redis Cache: Fast in-memory responses for frequent queries
 * - Neon Database: Persistent storage for bookings and transactions
 * - API Manager: Unified response processing through cache layer
 *
 * Documentation: https://duffel.com/docs/api/v2
 */

import { Router, Request, Response } from 'express';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { prisma } from '@tripalfa/shared-database';
import { Pool } from 'pg';
import {
  cacheOfferRequestMiddleware,
  cacheOfferMiddleware,
  cacheOrderMiddleware,
  cacheSeatMapMiddleware,
  cacheAvailableServicesMiddleware,
  cacheCancellationMiddleware,
  invalidateCacheAfterMutationMiddleware,
} from '../middleware/duffel-cache.middleware.js';
import {
  OfferRequestManager,
  OfferManager,
  OrderManager,
  SeatMapManager,
  AvailableServicesManager,
  CancellationManager,
  CacheBulkOperations,
} from '../services/duffel-api-manager.service.js';
import { normalizeDuffelServices, extractServiceCategories } from '../utils/duffel-normalizer.js';

const router: Router = Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
import { duffelClient } from '../utils/duffelClient.js';

const rootDir = resolve(__dirname, '../../../../');

const DB_WRITE_TIMEOUT_MS = 1500;

// Static reference database connection
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL;
const staticDbPool = STATIC_DATABASE_URL
  ? new Pool({
      connectionString: STATIC_DATABASE_URL,
      max: 5,
      connectionTimeoutMillis: 5000,
    })
  : null;

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>(resolve => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// ============================================================================
// Duffel API Helper Functions
// ============================================================================

/**
 * Make authenticated request to Duffel API using the shared Axios client
 * Preserved for backwards compatibility with existing routes in this file
 */
async function duffelRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: object
): Promise<T> {
  try {
    const config: any = {
      method,
      url: endpoint,
    };
    if (body) {
      config.data = body;
    }
    const response = await duffelClient.request(config);
    return response.data as T;
  } catch (error: any) {
    if (error.response) {
      throw new Error(
        `Duffel API Error (${error.response.status}): ${JSON.stringify(error.response.data)}`
      );
    }
    throw error;
  }
}

// ============================================================================
// ORDERS - Create and Manage Bookings
// ============================================================================

/**
 * @swagger
 * /api/duffel/ancillary/services/select:
 *   post:
 *     summary: Select or add services to a booking/order
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [services]
 *             properties:
 *               offerId:
 *                 type: string
 *               orderId:
 *                 type: string
 *               services:
 *                 type: array
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/ancillary/services/select', async (req: Request, res: Response) => {
  try {
    const { offerId, orderId, services } = req.body;

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ error: 'services array is required' });
    }

    if (orderId) {
      // Add services to existing order
      const duffelResponse = await duffelRequest<any>('/air/order_services', 'POST', {
        data: {
          order_id: orderId,
          services: services.map(s => ({
            id: s.id,
            quantity: s.quantity || 1,
          })),
        },
      });

      res.json({
        success: true,
        data: {
          orderId,
          selectedServices: services,
          totalAmount: duffelResponse.data?.total_amount,
          currency: duffelResponse.data?.total_currency,
        },
        message: 'Services added to order successfully',
      });
    } else if (offerId) {
      // For offer booking, we just acknowledge the selection
      // The actual order creation will include these services
      res.json({
        success: true,
        data: {
          offerId,
          selectedServices: services,
          totalAmount: '0.00', // Will be calculated during order creation
          currency: 'GBP',
        },
        message: 'Services selected for booking',
      });
    } else {
      res.status(400).json({ error: 'Either offerId or orderId is required' });
    }
  } catch (error: any) {
    console.error('[Duffel] Service selection error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER CANCELLATIONS
// ============================================================================
/**
 * @swagger
 * /api/duffel/cfar-claims:
 *   post:
 *     summary: Create a CFAR claim (request refund under CFAR)
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cfar_contract_id]
 *             properties:
 *               cfar_contract_id:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: CFAR claim created
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/order-cancellations',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { order_id, userId } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      // Call Duffel API
      const duffelResponse = await duffelRequest<any>('/air/order_cancellations', 'POST', {
        data: { order_id },
      });

      const cancellationData = duffelResponse.data;
      const cancellationId = cancellationData.id;

      // Find the order in database
      const order = await withTimeout(
        prisma.duffelOrder.findUnique({
          where: { externalId: order_id },
        }),
        DB_WRITE_TIMEOUT_MS
      );

      if (order) {
        // Extract refund details from Duffel response
        const refundTo = cancellationData.refund_to || 'original_form_of_payment';
        const airlineCredits = cancellationData.airline_credits || null;

        // Store in database with full cancellation details
        await prisma.duffelOrderCancellation.create({
          data: {
            externalId: cancellationId,
            orderId: order.id,
            userId: userId || order.userId, // Track user for airline credits
            refundAmount: cancellationData.refund_amount
              ? Number(cancellationData.refund_amount)
              : 0,
            refundCurrency: cancellationData.refund_currency || 'USD',
            refundTo: refundTo,
            airlineCredits: airlineCredits,
            status: cancellationData.status || 'pending',
            expiresAt: cancellationData.expires_at ? new Date(cancellationData.expires_at) : null,
          },
        });

        // Invalidate order cache after cancellation
        await OrderManager.invalidate(order_id, order.userId);
      }

      // Process through cancellation manager
      await CancellationManager.processResponse(cancellationId, cancellationData);

      res.json({
        success: true,
        data: cancellationData,
        message:
          cancellationData.refund_to === 'airline_credits'
            ? 'Cancellation quote created. Refund will be issued as airline credits.'
            : 'Cancellation request created',
      });
    } catch (error: any) {
      console.error('[Duffel] Create cancellation error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/duffel/order-cancellations/{id}:
 *   get:
 *     summary: Get cancellation by ID
 *     tags: [Duffel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Cancellation retrieved
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
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get(
  '/order-cancellations/:id',
  cacheCancellationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Try Duffel API first
      try {
        const duffelResponse = await duffelRequest<any>(`/air/order_cancellations/${id}`);

        // Process through API Manager
        await CancellationManager.processResponse(id, duffelResponse.data);

        return res.json({
          success: true,
          data: duffelResponse.data,
          cached: false,
          source: 'api',
        });
      } catch (duffelError) {
        // Fallback to database
        const cancellation = await prisma.duffelOrderCancellation.findUnique({
          where: { externalId: String(id) },
        });

        if (cancellation) {
          return res.json({
            success: true,
            data: cancellation,
            cached: false,
            source: 'neon',
          });
        }

        return res.status(404).json({ error: 'Cancellation not found' });
      }
    } catch (error: any) {
      console.error('[Duffel] Get cancellation error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
/**
 * @swagger
 * /api/duffel/order-cancellations:
 *   get:
 *     summary: List all cancellations
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/order-cancellations', async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const cancellations = await prisma.duffelOrderCancellation.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
    });

    res.json({
      success: true,
      data: cancellations,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: cancellations.length,
      },
    });
  } catch (error: any) {
    console.error('[Duffel] List cancellations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/order-cancellations/{id}/confirm:
 *   post:
 *     summary: Confirm a cancellation
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/order-cancellations/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(
      `/air/order_cancellations/${id}/confirm`,
      'POST'
    );

    // Update in database
    await prisma.duffelOrderCancellation.updateMany({
      where: { externalId: String(id) },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    // Update order status
    const cancellation = await prisma.duffelOrderCancellation.findUnique({
      where: { externalId: String(id) },
    });

    if (cancellation) {
      await prisma.duffelOrder.update({
        where: { id: cancellation.orderId },
        data: {
          status: 'cancelled',
          cancelledAt: new Date(),
        },
      });
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Confirm cancellation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// CANCEL FOR ANY REASON (CFAR)
// ============================================================================

/**
 * @swagger
 * /api/duffel/cfar-offers:
 *   post:
 *     summary: Create a CFAR offer request
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id:
 *                 type: string
 *     responses:
 *       200:
 *         description: CFAR offers retrieved
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/cfar-offers', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    // Call Duffel API to get CFAR offers
    const duffelResponse = await duffelRequest<any>('/air/cfar_offers', 'POST', {
      data: { order_id },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
      message: 'CFAR offers retrieved',
    });
  } catch (error: any) {
    console.error('[Duffel] Get CFAR offers error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/cfar-offers/{id}:
 *   get:
 *     summary: Get a CFAR offer by ID
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/cfar-offers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelRequest<any>(`/air/cfar_offers/${id}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get CFAR offer error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/cfar-contracts:
 *   post:
 *     summary: Create a CFAR contract (purchase CFAR coverage)
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cfar_offer_id]
 *             properties:
 *               cfar_offer_id:
 *                 type: string
 *               payment_method:
 *                 type: object
 *     responses:
 *       200:
 *         description: CFAR contract created
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/cfar-contracts',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { cfar_offer_id, payment_method } = req.body;

      if (!cfar_offer_id) {
        return res.status(400).json({ error: 'cfar_offer_id is required' });
      }

      // Call Duffel API to create CFAR contract
      const duffelResponse = await duffelRequest<any>('/air/cfar_contracts', 'POST', {
        data: {
          cfar_offer_id,
          payment_method: payment_method || { type: 'balance' },
        },
      });

      const contractData = duffelResponse.data;

      // Store CFAR contract reference in order metadata
      if (contractData.order_id) {
        const order = await prisma.duffelOrder.findUnique({
          where: { externalId: contractData.order_id },
        });

        if (order) {
          await prisma.duffelOrder.update({
            where: { id: order.id },
            data: {
              status: order.status,
            },
          });

          // Invalidate cache
          await OrderManager.invalidate(contractData.order_id);
        }
      }

      res.json({
        success: true,
        data: contractData,
        message: 'CFAR contract created',
      });
    } catch (error: any) {
      console.error('[Duffel] Create CFAR contract error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/duffel/cfar-contracts/{id}:
 *   get:
 *     summary: Get a CFAR contract by ID
 *     tags: [Duffel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: CFAR contract retrieved
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
 *                 error:
 *                   type: string
 */
router.get('/cfar-contracts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelRequest<any>(`/air/cfar_contracts/${id}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get CFAR contract error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/cfar-claims:
 *   post:
 *     summary: Create a CFAR claim (request refund under CFAR)
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cfar_contract_id]
 *             properties:
 *               cfar_contract_id:
 *                 type: string
 *               reason:
 *                 type: string
 *     responses:
 *       200:
 *         description: CFAR claim created
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/cfar-claims',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { cfar_contract_id, reason } = req.body;

      if (!cfar_contract_id) {
        return res.status(400).json({ error: 'cfar_contract_id is required' });
      }

      // Call Duffel API to create CFAR claim
      const duffelResponse = await duffelRequest<any>('/air/cfar_claims', 'POST', {
        data: {
          cfar_contract_id,
          reason: reason || 'Customer requested cancellation',
        },
      });

      const claimData = duffelResponse.data;

      // Update order status
      if (claimData.order_id) {
        const order = await prisma.duffelOrder.findUnique({
          where: { externalId: claimData.order_id },
        });

        if (order) {
          await prisma.duffelOrder.update({
            where: { id: order.id },
            data: {
              status: 'cancelled',
              cancelledAt: new Date(),
            },
          });

          // Invalidate cache
          await OrderManager.invalidate(claimData.order_id);
        }
      }

      res.json({
        success: true,
        data: claimData,
        message: 'CFAR claim created',
      });
    } catch (error: any) {
      console.error('[Duffel] Create CFAR claim error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
/**
 * @swagger
 * /api/duffel/cfar-claims/{id}:
 *   get:
 *     summary: Get a CFAR claim by ID
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/cfar-claims/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelRequest<any>(`/air/cfar_claims/${id}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get CFAR claim error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER CHANGES
// ============================================================================

/**
/**
 * @swagger
 * /api/duffel/order-change-requests:
 *   post:
 *     summary: Create an order change request
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, slices]
 *             properties:
 *               order_id:
 *                 type: string
 *               slices:
 *                 type: array
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/order-change-requests', async (req: Request, res: Response) => {
  try {
    const { order_id, slices } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!slices) {
      return res.status(400).json({ error: 'slices is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/order_change_requests', 'POST', {
      data: {
        order_id,
        slices,
      },
    });

    const changeData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelOrderChange.create({
        data: {
          externalId: changeData.id,
          orderId: order.id,
          requestedChanges: slices,
          changeOffers: changeData.order_change_offers,
          status: 'pending',
        },
      });
    }

    res.json({
      success: true,
      data: changeData,
    });
  } catch (error: any) {
    console.error('[Duffel] Create change request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/order-change-requests/{id}:
 *   get:
 *     summary: Get order change request by ID
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/order-change-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/order_change_requests/${id}`);
      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const change = await prisma.duffelOrderChange.findUnique({
        where: { externalId: String(id) },
      });

      if (change) {
        return res.json({
          success: true,
          data: change,
          source: 'database',
        });
      }

      return res.status(404).json({ error: 'Change request not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get change request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/order-changes:
 *   post:
 *     summary: Create a pending order change
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [selected_order_change_offer]
 *             properties:
 *               selected_order_change_offer:
 *                 type: object
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/order-changes', async (req: Request, res: Response) => {
  try {
    const { selected_order_change_offer } = req.body;

    if (!selected_order_change_offer?.id) {
      return res.status(400).json({ error: 'selected_order_change_offer.id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/order_changes', 'POST', {
      data: {
        selected_order_change_offer,
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Create order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/order-changes/confirm:
 *   post:
 *     summary: Confirm an order change
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_change_id]
 *             properties:
 *               order_change_id:
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/order-changes/confirm', async (req: Request, res: Response) => {
  try {
    const { order_change_id } = req.body;

    if (!order_change_id) {
      return res.status(400).json({ error: 'order_change_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/order_changes/confirm', 'POST', {
      data: { order_change_id },
    });

    // Update in database
    await prisma.duffelOrderChange.updateMany({
      where: { externalId: order_change_id },
      data: {
        status: 'confirmed',
        confirmedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Confirm order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/order-changes/{id}:
 *   get:
 *     summary: Get order change by ID
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/order-changes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/order_changes/${id}`);
      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      return res.status(404).json({ error: 'Order change not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get order change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SEAT MAPS
// ============================================================================

/**
/**
 * @swagger
 * /api/duffel/seat-maps:
 *   get:
 *     summary: Get seat maps
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: offer_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: order_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: offerId
 *         schema:
 *           type: string
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: segment_id
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/seat-maps', cacheSeatMapMiddleware, async (req: Request, res: Response) => {
  try {
    const { offer_id, order_id, offerId, orderId, segment_id } = req.query;
    const actualOfferId = (offerId || offer_id) as string;
    const actualOrderId = (orderId || order_id) as string;

    if (!actualOfferId && !actualOrderId) {
      return res.status(400).json({ error: 'offerId or orderId is required' });
    }

    const params = new URLSearchParams();
    if (actualOfferId) params.append('offer_id', actualOfferId);
    if (actualOrderId) params.append('order_id', actualOrderId);
    if (segment_id) params.append('segment_id', segment_id as string);

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/seat_maps?${params.toString()}`);

    // Process through API Manager (caches in Redis)
    const seatMapData = duffelResponse.data;
    await SeatMapManager.processResponse(seatMapData, actualOfferId, actualOrderId);

    res.json({
      success: true,
      data: seatMapData,
      cached: false,
      source: 'api',
      message: 'Seat map cached for quick retrieval',
    });
  } catch (error: any) {
    console.error('[Duffel] Get seat map error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// PAYMENT INTENTS - For Hold Orders (Pay Later)
// ============================================================================

/**
 * @swagger
 * /api/duffel/payment-intents:
 *   post:
 *     summary: Create a payment intent
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id]
 *             properties:
 *               order_id:
 *                 type: string
 *               amount:
 *                 type: string
 *               currency:
 *                 type: string
 *               payment_method:
 *                 type: object
 *     responses:
 *       200:
 *         description: create a payment intent
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/payment-intents',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { order_id, amount, currency, payment_method } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      // Call Duffel API
      const duffelResponse = await duffelRequest<any>('/air/payment_intents', 'POST', {
        data: {
          order_id,
          amount: amount || undefined,
          currency: currency || 'USD',
          payment_method: payment_method || { type: 'balance' },
        },
      });

      const paymentIntentData = duffelResponse.data;

      // Store payment intent reference in order metadata
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: order_id },
      });

      if (order) {
        await withTimeout(
          prisma.duffelOrder.update({
            where: { id: order.id },
            data: { status: order.status },
          }),
          DB_WRITE_TIMEOUT_MS
        );
      }

      res.json({
        success: true,
        data: paymentIntentData,
        message: 'Payment intent created',
      });
    } catch (error: any) {
      console.error('[Duffel] Create payment intent error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
/**
 * @swagger
 * /api/duffel/payment-intents/{id}:
 *   get:
 *     summary: Get payment intent by ID
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/payment-intents/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelRequest<any>(`/air/payment_intents/${id}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get payment intent error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/payment-intents/{id}/confirm:
 *   post:
 *     summary: Confirm a payment intent
 *     tags: [Duffel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: confirm a payment intent
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
 *                 error:
 *                   type: string
 */
router.post(
  '/payment-intents/:id/confirm',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      // Call Duffel API
      const duffelResponse = await duffelRequest<any>(
        `/air/payment_intents/${id}/actions/confirm`,
        'POST'
      );

      const paymentIntentData = duffelResponse.data;

      // Update order payment status
      if (paymentIntentData.status === 'succeeded') {
        const paymentOrderId = paymentIntentData.order_id || paymentIntentData.order?.id;
        const order = paymentOrderId
          ? await withTimeout(
              prisma.duffelOrder.findUnique({
                where: { externalId: String(paymentOrderId) },
              }),
              DB_WRITE_TIMEOUT_MS
            )
          : null;

        if (order) {
          await withTimeout(
            prisma.duffelOrder.update({
              where: { id: order.id },
              data: {
                status: 'paid',
              },
            }),
            DB_WRITE_TIMEOUT_MS
          );

          // Invalidate order cache
          await withTimeout(OrderManager.invalidate(order.externalId || ''), DB_WRITE_TIMEOUT_MS);
        }
      }

      res.json({
        success: true,
        data: paymentIntentData,
        message: 'Payment confirmed',
      });
    } catch (error: any) {
      console.error('[Duffel] Confirm payment intent error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/duffel/orders/{id}/pay:
 *   post:
 *     summary: Pay for an order
 *     tags: [Duffel]
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
 *             properties:
 *               payment_method_type:
 *                 type: string
 *     responses:
 *       200:
 *         description: pay for an order
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/orders/:id/pay',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;
      const { payment_method_type = 'balance' } = req.body;

      // Get order first to check status
      const order = await withTimeout(
        prisma.duffelOrder.findUnique({
          where: { externalId: String(id) },
        }),
        DB_WRITE_TIMEOUT_MS
      );

      if (order?.status === 'cancelled') {
        return res.status(400).json({ error: 'Cannot pay for a cancelled order' });
      }

      if (
        order?.status === 'paid' ||
        order?.status === 'confirmed' ||
        order?.status === 'ticketed'
      ) {
        return res.status(400).json({ error: 'Order is already paid' });
      }

      // Create payment intent and confirm in one step
      const paymentIntentResponse = await duffelRequest<any>('/air/payment_intents', 'POST', {
        data: {
          order_id: id,
          payment_method: { type: payment_method_type },
        },
      });

      const paymentIntentData = paymentIntentResponse.data;

      // If using balance, payment is instant
      if (payment_method_type === 'balance' && paymentIntentData.status === 'succeeded') {
        // Update order in database
        if (order) {
          await withTimeout(
            prisma.duffelOrder.update({
              where: { id: order.id },
              data: {
                status: 'paid',
              },
            }),
            DB_WRITE_TIMEOUT_MS
          );
        }

        // Invalidate cache
        await withTimeout(OrderManager.invalidate(id), DB_WRITE_TIMEOUT_MS);
      }

      res.json({
        success: true,
        data: {
          order_id: id,
          payment_intent: paymentIntentData,
          status: paymentIntentData.status,
          message:
            paymentIntentData.status === 'succeeded' ? 'Payment successful' : 'Payment pending',
        },
      });
    } catch (error: any) {
      console.error('[Duffel] Pay for order error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// HOLD ORDERS - Create Order with Hold Type
// ============================================================================

/**
 * @swagger
 * /api/duffel/order-cancellations/{id}:
 *   patch:
 *     summary: Update order
 *     tags: [Duffel]
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
 *     responses:
 *       200:
 *         description: Order updated
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
 *                 error:
 *                   type: string
 */
router.post(
  '/orders/hold',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { selected_offers, passengers, contact, userId, metadata, loyalty_programme_accounts } =
        req.body;

      if (!selected_offers || !Array.isArray(selected_offers) || selected_offers.length === 0) {
        return res.status(400).json({ error: 'selected_offers is required' });
      }

      if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
        return res.status(400).json({ error: 'passengers is required' });
      }

      // Build hold order request data
      const holdOrderRequestData: any = {
        type: 'hold',
        selected_offers,
        passengers,
        contact,
        metadata,
      };

      // Add loyalty programme accounts for frequent flyer benefits
      if (loyalty_programme_accounts && Array.isArray(loyalty_programme_accounts)) {
        holdOrderRequestData.loyalty_programme_accounts = loyalty_programme_accounts;
      }

      // Call Duffel API with type: 'hold'
      const duffelResponse = await duffelRequest<any>('/air/orders', 'POST', {
        data: holdOrderRequestData,
      });

      const orderData = duffelResponse.data;
      const orderId = orderData.id;

      // Store in database
      let order: { id?: string } | null = null;
      try {
        order = await withTimeout(
          prisma.duffelOrder.create({
            data: {
              externalId: orderId,
              customerEmail: contact?.email,
              customerPhone: contact?.phone,
              status: orderData.status || 'created',
              type: 'hold',
              slices: orderData.slices,
              passengers: orderData.passengers,
              baseAmount: orderData.base_amount,
              taxAmount: orderData.tax_amount || 0,
              totalAmount: orderData.total_amount,
              currency: orderData.total_currency || 'USD',
            },
          }),
          DB_WRITE_TIMEOUT_MS
        );
      } catch (dbError: any) {
        console.warn('[Duffel] Hold order local persistence skipped:', dbError?.message || dbError);
      }

      let responseData = orderData;
      let responseSource = 'api';

      try {
        const managedResponse = await withTimeout(
          OrderManager.processResponse(orderId, orderData, userId),
          DB_WRITE_TIMEOUT_MS
        );
        if (managedResponse?.data) {
          responseData = managedResponse.data;
        }
      } catch (cacheError: any) {
        console.warn(
          '[Duffel] Hold order cache processing failed, returning API response:',
          cacheError?.message || cacheError
        );
        responseSource = 'api-fallback';
      }

      res.json({
        success: true,
        data: responseData,
        localId: order?.id,
        cached: false,
        source: responseSource,
        type: 'hold',
        message: 'Hold order created. Payment required before expiry.',
        payment_required_by: orderData.payment_requirements?.payment_required_by,
      });
    } catch (error: any) {
      console.error('[Duffel] Create hold order error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// BAGS & ANCILLARIES
// ============================================================================

/**
/**
 * @swagger
 * /api/duffel/offers/{id}/available-services:
 *   get:
 *     summary: Get available services for an offer
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/offers/:id/available-services', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelRequest<any>(`/air/offers/${id}/available_services`);

    res.json({
      success: true,
      data: duffelResponse.data,
      cached: false,
      source: 'api',
    });
  } catch (error: any) {
    console.error('[Duffel] Get available services error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/duffel/bags:
 *   post:
 *     summary: Add baggage to an order
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [order_id, services]
 *             properties:
 *               order_id:
 *                 type: string
 *               services:
 *                 type: array
 *     responses:
 *       200:
 *         description: add baggage to an order
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
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post(
  '/bags',
  invalidateCacheAfterMutationMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { order_id, services } = req.body;

      if (!order_id) {
        return res.status(400).json({ error: 'order_id is required' });
      }

      if (!services || !Array.isArray(services)) {
        return res.status(400).json({ error: 'services array is required' });
      }

      // Call Duffel API to add baggage services
      const duffelResponse = await duffelRequest<any>('/air/order_services', 'POST', {
        data: {
          order_id,
          services,
        },
      });

      // Invalidate order cache
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: order_id },
      });
      if (order) {
        await OrderManager.invalidate(order_id, order.userId);
      }

      res.json({
        success: true,
        data: duffelResponse.data,
        message: 'Baggage added to order',
      });
    } catch (error: any) {
      console.error('[Duffel] Add baggage error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/duffel/orders/{id}/available-services:
 *   get:
 *     summary: Get available services for an order
 *     tags: [Duffel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Available services retrieved
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
 *                 error:
 *                   type: string
 */
router.get(
  '/orders/:id/available-services',
  cacheAvailableServicesMiddleware,
  async (req: Request, res: Response) => {
    try {
      const { id } = req.params;

      const duffelResponse = await duffelRequest<any>(`/air/orders/${id}/available_services`);

      // Process through API Manager (caches in Redis)
      await AvailableServicesManager.processResponse(id, duffelResponse.data);

      res.json({
        success: true,
        data: duffelResponse.data,
        cached: false,
        source: 'api',
      });
    } catch (error: any) {
      console.error('[Duffel] Get order available services error:', error.message);
      res.status(500).json({ error: error.message });
    }
  }
);

// ============================================================================
// LOYALTY PROGRAMME ACCOUNTS
// ============================================================================

/**
/**
 * @swagger
 * /api/duffel/loyalty-programme-accounts:
 *   get:
 *     summary: List loyalty programme accounts
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: passenger_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/loyalty-programme-accounts', async (req: Request, res: Response) => {
  try {
    const { passenger_id, limit = 20, offset = 0 } = req.query;

    const params = new URLSearchParams();
    if (passenger_id) params.append('passenger_id', passenger_id as string);
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const duffelResponse = await duffelRequest<any>(`/air/loyalty_programme_accounts?${params}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] List loyalty accounts error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/loyalty-programme-accounts:
 *   post:
 *     summary: Create a loyalty programme account
 *     tags: [Duffel]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [passenger_id, airline_iata_code, account_number]
 *             properties:
 *               passenger_id:
 *                 type: string
 *               airline_iata_code:
 *                 type: string
 *               account_number:
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/loyalty-programme-accounts', async (req: Request, res: Response) => {
  try {
    const { passenger_id, airline_iata_code, account_number } = req.body;

    if (!passenger_id || !airline_iata_code || !account_number) {
      return res.status(400).json({
        error: 'passenger_id, airline_iata_code, and account_number are required',
      });
    }

    const duffelResponse = await duffelRequest<any>('/air/loyalty_programme_accounts', 'POST', {
      data: {
        passenger_id,
        airline_iata_code,
        account_number,
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
      message: 'Loyalty programme account added',
    });
  } catch (error: any) {
    console.error('[Duffel] Create loyalty account error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/loyalty-programme-accounts/{id}:
 *   get:
 *     summary: Get loyalty programme account by ID
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/loyalty-programme-accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const duffelResponse = await duffelRequest<any>(`/air/loyalty_programme_accounts/${id}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get loyalty account error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/loyalty-programme-accounts/{id}:
 *   delete:
 *     summary: Delete a loyalty programme account
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.delete('/loyalty-programme-accounts/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    await duffelRequest<any>(`/air/loyalty_programme_accounts/${id}`, 'DELETE');

    res.json({
      success: true,
      message: 'Loyalty programme account deleted',
    });
  } catch (error: any) {
    console.error('[Duffel] Delete loyalty account error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AIRLINE-INITIATED CHANGES
// ============================================================================

/**
/**
 * @swagger
 * /api/duffel/airline-initiated-changes:
 *   get:
 *     summary: List airline-initiated changes
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/airline-initiated-changes', async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/airline_initiated_changes?${params}`);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] List airline-initiated changes error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/airline-initiated-changes/{id}:
 *   patch:
 *     summary: Update airline-initiated change
 *     tags: [Duffel]
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
 *               action_taken:
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.patch('/airline-initiated-changes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action_taken } = req.body;

    if (!action_taken) {
      return res.status(400).json({ error: 'action_taken is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(
      `/air/airline_initiated_changes/${id}`,
      'PATCH',
      {
        data: { action_taken },
      }
    );

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Update airline-initiated change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/airline-initiated-changes/{id}/accept:
 *   post:
 *     summary: Accept airline-initiated change
 *     tags: [Duffel]
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/airline-initiated-changes/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(
      `/air/airline_initiated_changes/${id}/accept`,
      'POST'
    );

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Accept airline-initiated change error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AIRPORTS/PLACES - Airport and City Search (for Autocomplete)
// ============================================================================

/**
/**
 * @swagger
 * /api/duffel/airports:
 *   get:
 *     summary: Search airports and cities
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
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
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/airports', async (req: Request, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" is required (min 2 characters)' });
    }

    // Attempt to search local static database first for speed
    if (staticDbPool) {
      try {
        const searchTerm = `%${q}%`;
        const result = await staticDbPool.query(
          `SELECT 'AIRPORT' as type, iata_code as code, name, city_name, country_name, latitude, longitude
           FROM duffel_airports
           WHERE LOWER(name) LIKE LOWER($1) OR LOWER(iata_code) LIKE LOWER($1)
           UNION ALL
           SELECT 'CITY' as type, iata_code as code, name as name, name as city_name, country_name, latitude, longitude
           FROM duffel_cities
           WHERE LOWER(name) LIKE LOWER($1)
           LIMIT $2`,
          [searchTerm, Number(limit)]
        );

        if (result.rows.length > 0) {
          const places = result.rows.map((row: any) => ({
            type: row.type,
            icon: row.type === 'AIRPORT' ? 'plane' : 'map-pin',
            title: row.type === 'AIRPORT' ? `${row.name} (${row.code})` : row.name,
            subtitle: row.city_name
              ? `${row.city_name}, ${row.country_name}`
              : row.country_name || '',
            code: row.code,
            city: row.city_name || row.name,
            country: row.country_name || '',
            countryCode: '', // Add if available
            latitude: row.latitude,
            longitude: row.longitude,
          }));

          return res.json({
            success: true,
            data: places,
            source: 'static-db',
          });
        }
      } catch (dbError) {
        console.warn('[Duffel] Static DB search failed, falling back to API:', dbError);
      }
    }

    // Fallback to Duffel Places API
    const params = new URLSearchParams();
    params.append('query', q);
    params.append('limit', String(limit));

    const duffelResponse = await duffelRequest<any>(`/air/places?${params}`, 'GET');

    const places = (duffelResponse.data || []).map((place: any) => ({
      type: place.type === 'airport' ? 'AIRPORT' : 'CITY',
      icon: place.type === 'airport' ? 'plane' : 'map-pin',
      title: place.type === 'airport' ? `${place.name} (${place.iata_code})` : place.name,
      subtitle: place.city_name
        ? `${place.city_name}, ${place.country_name}`
        : place.country_name || '',
      code: place.iata_code || place.id,
      city: place.city_name || place.name,
      country: place.country_name || '',
      countryCode: place.country_code || '',
      latitude: place.lat,
      longitude: place.lng,
    }));

    res.json({
      success: true,
      data: places,
      source: 'api',
    });
  } catch (error: any) {
    console.error('[Duffel] Airports search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/places/suggestions:
 *   get:
 *     summary: Find airports within a geographic area
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: string
 *       - in: query
 *         name: lng
 *         schema:
 *           type: string
 *       - in: query
 *         name: rad
 *         schema:
 *           type: string
 *       - in: query
 *         name: query
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/places/suggestions', async (req: Request, res: Response) => {
  try {
    const { lat, lng, rad, query } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Latitude (lat) and longitude (lng) are required parameters',
      });
    }

    // Validate lat/lng are valid numbers
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);

    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({
        error: 'Latitude and longitude must be valid numbers',
      });
    }

    // Validate latitude/longitude ranges
    if (latitude < -90 || latitude > 90) {
      return res.status(400).json({ error: 'Latitude must be between -90 and 90' });
    }

    if (longitude < -180 || longitude > 180) {
      return res.status(400).json({ error: 'Longitude must be between -180 and 180' });
    }

    // Build query parameters for Duffel Places Suggestions API
    const params = new URLSearchParams();
    params.append('lat', String(latitude));
    params.append('lng', String(longitude));

    // Radius in meters (default: 100km = 100000m)
    if (rad) {
      const radius = parseInt(rad as string);
      if (!isNaN(radius) && radius > 0) {
        params.append('rad', String(radius));
      }
    }

    // Optional query string to filter results
    if (query && typeof query === 'string' && query.length > 0) {
      params.append('query', query);
    }

    console.log('[Duffel] Finding airports within area:', {
      lat: latitude,
      lng: longitude,
      rad: params.get('rad'),
      query,
    });

    // Call Duffel Places Suggestions API
    const duffelResponse = await duffelRequest<any>(`/places/suggestions?${params}`, 'GET');

    // Transform response to consistent format
    const places = (duffelResponse.data || []).map((place: any) => ({
      type: place.type === 'airport' ? 'AIRPORT' : 'CITY',
      subType: place.type, // Original Duffel type
      id: place.id,
      iataCode: place.iata_code,
      icaoCode: place.icao_code,
      name: place.name,
      cityName: place.city_name,
      cityCode: place.iata_city_code,
      countryName: place.country_name,
      countryCode: place.iata_country_code,
      latitude: place.latitude,
      longitude: place.longitude,
      timeZone: place.time_zone,
      // Distance from search center (if available in response)
      distance: place.distance || null,
      // City information (if available)
      city: place.city
        ? {
            id: place.city.id,
            name: place.city.name,
            iataCode: place.city.iata_code,
            countryCode: place.city.iata_country_code,
          }
        : null,
      // Airports within city (for city-type results)
      airports:
        place.airports?.map((airport: any) => ({
          id: airport.id,
          iataCode: airport.iata_code,
          icaoCode: airport.icao_code,
          name: airport.name,
          latitude: airport.latitude,
          longitude: airport.longitude,
        })) || [],
    }));

    res.json({
      success: true,
      data: places,
      meta: duffelResponse.meta || null,
      searchParams: {
        latitude,
        longitude,
        radiusMeters: parseInt(params.get('rad') || '100000'),
        query: query || null,
      },
    });
  } catch (error: any) {
    console.error('[Duffel] Places suggestions error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
/**
 * @swagger
 * /api/duffel/nearby-airports:
 *   get:
 *     summary: Find nearby airports
 *     tags: [Duffel]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: string
 *       - in: query
 *         name: lng
 *         schema:
 *           type: string
 *       - in: query
 *         name: radius
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
 *       400:
 *         description: Bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/nearby-airports', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({
        error: 'Latitude (lat) and longitude (lng) are required parameters',
      });
    }

    // Convert radius from km to meters (default: 100km)
    const radiusInMeters = radius ? parseInt(radius as string) * 1000 : 100000;

    // Build the places/suggestions URL
    const params = new URLSearchParams();
    params.append('lat', lat as string);
    params.append('lng', lng as string);
    params.append('rad', String(radiusInMeters));

    console.log('[Duffel] Finding nearby airports:', {
      lat,
      lng,
      radiusKm: radius,
    });

    // Call Duffel Places Suggestions API
    const duffelResponse = await duffelRequest<any>(`/places/suggestions?${params}`, 'GET');

    // Filter to only airports (not cities) for this endpoint
    const airports = (duffelResponse.data || [])
      .filter((place: any) => place.type === 'airport')
      .map((airport: any) => ({
        id: airport.id,
        iataCode: airport.iata_code,
        icaoCode: airport.icao_code,
        name: airport.name,
        cityName: airport.city_name,
        cityCode: airport.iata_city_code,
        countryName: airport.country_name,
        countryCode: airport.iata_country_code,
        latitude: airport.latitude,
        longitude: airport.longitude,
        timeZone: airport.time_zone,
      }));

    res.json({
      success: true,
      data: airports,
      count: airports.length,
      searchLocation: {
        latitude: parseFloat(lat as string),
        longitude: parseFloat(lng as string),
        radiusKm: radiusInMeters / 1000,
      },
    });
  } catch (error: any) {
    console.error('[Duffel] Nearby airports error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Export Router
// ============================================================================

export default router;
