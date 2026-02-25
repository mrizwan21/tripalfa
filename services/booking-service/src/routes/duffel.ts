/**
 * Duffel Flight API Routes
 * Handles all Duffel API endpoints for flight bookings with Hybrid Caching
 * 
 * Architecture:
 * - Redis Cache: Fast in-memory responses for frequent queries
 * - NEON Database: Persistent storage for bookings and transactions
 * - API Manager: Unified response processing through cache layer
 * 
 * Documentation: https://duffel.com/docs/api/v2
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@tripalfa/shared-database';
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

const router: Router = Router();

// ============================================================================
// Environment Configuration
// ============================================================================

const DUFFEL_API_URL = process.env.DUFFEL_API_URL || 'https://api.duffel.com';
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN;
const DUFFEL_VERSION = 'v2';

// ============================================================================
// Duffel API Helper Functions
// ============================================================================

/**
 * Make authenticated request to Duffel API
 */
async function duffelRequest<T>(
  endpoint: string,
  method: string = 'GET',
  body?: object
): Promise<T> {
  const url = `${DUFFEL_API_URL}${endpoint}`;

  const response = await fetch(url, {
    method,
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Duffel-Version': DUFFEL_VERSION,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Duffel API Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// OFFER REQUESTS - Flight Search
// ============================================================================

/**
 * POST /api/duffel/offer-requests
 * Create an offer request (search for flights) with hybrid caching
 * 
 * Flow:
 * 1. Validate request
 * 2. Call Duffel API
 * 3. Store offer request in NEON
 * 4. Cache offers in Redis
 * 5. Return response
 */
router.post('/offer-requests', async (req: Request, res: Response) => {
  try {
    const { 
      slices, 
      passengers, 
      cabin_class, 
      return_available_services,
      // Private fares support
      source,
      payment_partner,
      brand_id,
      loyalty_programme_accounts
    } = req.body;

    if (!slices || !Array.isArray(slices) || slices.length === 0) {
      return res.status(400).json({ error: 'slices is required' });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: 'passengers is required' });
    }

    // Build offer request data
    const offerRequestData: any = {
      slices,
      passengers,
      cabin_class: cabin_class || 'economy',
      return_available_services: return_available_services ?? true,
    };

    // Add private fares support
    // Source can be: 'duffel' (default), 'alliance', 'airline', 'corporate'
    if (source) {
      offerRequestData.source = source;
    }

    // Payment partner for private fares (e.g., 'airline' for corporate deals)
    if (payment_partner) {
      offerRequestData.payment_partner = payment_partner;
    }

    // Brand ID for airline-specific private fares
    if (brand_id) {
      offerRequestData.brand_id = brand_id;
    }

    // Loyalty programme accounts for frequent flyer benefits
    if (loyalty_programme_accounts && Array.isArray(loyalty_programme_accounts)) {
      offerRequestData.loyalty_programme_accounts = loyalty_programme_accounts;
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/offer_requests', 'POST', {
      data: offerRequestData,
    });

    const requestId = duffelResponse.data.id;

    // Store in database
    const offerRequest = await prisma.duffelOfferRequest.create({
      data: {
        externalId: requestId,
        slices: slices,
        passengers: passengers,
        cabinClass: cabin_class,
        status: 'pending',
        expiresAt: new Date(duffelResponse.data.expires_at),
      },
    });

    // Process through API Manager (caches in Redis + NEON)
    const managedResponse = await OfferRequestManager.processResponse(
      requestId,
      duffelResponse.data
    );

    res.json({
      success: true,
      data: managedResponse.data,
      localId: offerRequest.id,
      cached: false,
      source: 'api',
      message: 'Offer request created and cached for quick retrieval',
    });
  } catch (error: any) {
    console.error('[Duffel] Create offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/offer-requests/:id
 * Get offer request by ID with Redis + NEON hybrid caching
 */
router.get('/offer-requests/:id', cacheOfferRequestMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API
    try {
      const duffelResponse = await duffelRequest<any>(`/air/offer_requests/${id}`);
      
      // Process through API Manager (caches in Redis + NEON)
      await OfferRequestManager.processResponse(id, duffelResponse.data);
      
      return res.json({
        success: true,
        data: duffelResponse.data,
        cached: false,
        source: 'api',
      });
    } catch (duffelError) {
      // Fallback to database
      const offerRequest = await prisma.duffelOfferRequest.findUnique({
        where: { externalId: String(id) },
        include: { offers: true },
      });

      if (offerRequest) {
        return res.json({
          success: true,
          data: offerRequest,
          cached: false,
          source: 'neon',
        });
      }

      // Try by local ID
      const localRequest = await prisma.duffelOfferRequest.findUnique({
        where: { id: String(id) },
        include: { offers: true },
      });

      if (localRequest) {
        return res.json({
          success: true,
          data: localRequest,
          source: 'database',
        });
      }

      return res.status(404).json({ error: 'Offer request not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/offer-requests
 * List all offer requests
 */
router.get('/offer-requests', async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0 } = req.query;

    const offerRequests = await prisma.duffelOfferRequest.findMany({
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
      include: { offers: true },
    });

    res.json({
      success: true,
      data: offerRequests,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: offerRequests.length,
      },
    });
  } catch (error: any) {
    console.error('[Duffel] List offer requests error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// OFFERS - Get Available Flight Offers
// ============================================================================

/**
 * GET /api/duffel/offers/:id
 * Get offer by ID with Redis + NEON hybrid caching
 */
router.get('/offers/:id', cacheOfferMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/offers/${id}`);
      
      // Process through API Manager (caches in Redis + NEON)
      await OfferManager.processResponse(id, duffelResponse.data);
      
      return res.json({
        success: true,
        data: duffelResponse.data,
        cached: false,
        source: 'api',
      });
    } catch (duffelError) {
      // Fallback to database
      const offer = await prisma.duffelOffer.findUnique({
        where: { externalId: String(id) },
      });

      if (offer) {
        return res.json({
          success: true,
          data: offer,
          cached: false,
          source: 'neon',
        });
      }

      return res.status(404).json({ error: 'Offer not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get offer error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDERS - Create and Manage Bookings
// ============================================================================

/**
 * POST /api/duffel/orders
 * Create a flight order (booking) with hybrid caching
 * 
 * Flow:
 * 1. Validate required fields
 * 2. Call Duffel API
 * 3. Store order in NEON
 * 4. Cache order in Redis
 * 5. Return response
 */
router.post('/orders', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
  try {
    const { selected_offers, passengers, payments, metadata, contact, userId, loyalty_programme_accounts } = req.body;

    if (!selected_offers || !Array.isArray(selected_offers) || selected_offers.length === 0) {
      return res.status(400).json({ error: 'selected_offers is required' });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: 'passengers is required' });
    }

    // Build order request data
    const orderRequestData: any = {
      selected_offers,
      passengers,
      payments,
      metadata,
      contact,
    };

    // Add loyalty programme accounts for frequent flyer benefits
    if (loyalty_programme_accounts && Array.isArray(loyalty_programme_accounts)) {
      orderRequestData.loyalty_programme_accounts = loyalty_programme_accounts;
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/orders', 'POST', {
      data: orderRequestData,
    });

    const orderData = duffelResponse.data;
    const orderId = orderData.id;

    // Store in database
    const order = await prisma.duffelOrder.create({
      data: {
        externalId: orderId,
        userId: userId,
        customerEmail: contact?.email,
        customerPhone: contact?.phone,
        status: orderData.status || 'pending',
        type: orderData.type,
        slices: orderData.slices,
        passengers: orderData.passengers,
        baseAmount: orderData.base_amount,
        taxAmount: orderData.tax_amount || 0,
        totalAmount: orderData.total_amount,
        currency: orderData.total_currency || 'USD',
        confirmedAt: orderData.confirmed_at ? new Date(orderData.confirmed_at) : null,
      },
    });

    // Process through API Manager (caches in Redis + NEON)
    const managedResponse = await OrderManager.processResponse(orderId, orderData, userId);

    res.json({
      success: true,
      data: managedResponse.data,
      localId: order.id,
      cached: false,
      source: 'api',
      message: 'Order created and cached for quick retrieval',
    });
  } catch (error: any) {
    console.error('[Duffel] Create order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/orders/:id
 * Get order by ID with Redis + NEON hybrid caching
 */
router.get('/orders/:id', cacheOrderMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/orders/${id}`);
      
      // Process through API Manager (caches in Redis + NEON)
      await OrderManager.processResponse(id, duffelResponse.data);
      
      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(id) },
        include: {
          cancellations: true,
          changes: true,
        },
      });

      if (order) {
        return res.json({
          success: true,
          data: order,
          source: 'database',
        });
      }

      // Try by local ID
      const localOrder = await prisma.duffelOrder.findUnique({
        where: { id: String(id) },
        include: {
          cancellations: true,
          changes: true,
        },
      });

      if (localOrder) {
        return res.json({
          success: true,
          data: localOrder,
          source: 'database',
        });
      }

      return res.status(404).json({ error: 'Order not found' });
    }
  } catch (error: any) {
    console.error('[Duffel] Get order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/orders
 * List all orders
 */
router.get('/orders', async (req: Request, res: Response) => {
  try {
    const { limit = 20, offset = 0, status } = req.query;

    const orders = await prisma.duffelOrder.findMany({
      where: status ? { status: status as string } : undefined,
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
      include: {
        cancellations: true,
        changes: true,
      },
    });

    res.json({
      success: true,
      data: orders,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total: orders.length,
      },
    });
  } catch (error: any) {
    console.error('[Duffel] List orders error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/duffel/orders/:id
 * Update order (add services, etc.)
 */
router.patch('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const updateData = req.body;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/orders/${id}`, 'PATCH', {
      data: updateData,
    });

    // Update in database
    await prisma.duffelOrder.updateMany({
      where: { externalId: String(id) },
      data: {
        status: duffelResponse.data.status,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Update order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/orders/:id/available-services
 * Get available services (ancillaries) for an order with caching
 */
router.get('/orders/:id/available-services', cacheAvailableServicesMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
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
    console.error('[Duffel] Get available services error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/orders/:id/price
 * Price an order with payment method
 */
router.post('/orders/:id/price', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { payment } = req.body;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/orders/${id}/price`, 'POST', {
      data: { payment },
    });

    // Invalidate services cache after pricing
    await AvailableServicesManager.invalidate(id);

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Price order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/order-services
 * Add services (baggage, meals, seats) to an order with cache invalidation
 */
router.post('/order-services', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
  try {
    const { order_id, services } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ error: 'services is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/order_services', 'POST', {
      data: {
        order_id,
        services,
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Add services error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER CANCELLATIONS
// ============================================================================
/**
 * POST /api/duffel/order-cancellations
 * Create a cancellation request with cache invalidation
 * 
 * Flow:
 * 1. Create cancellation quote (unconfirmed)
 * 2. Returns refund details including:
 *    - refund_amount, refund_currency
 *    - refund_to: 'original_form_of_payment' or 'airline_credits'
 *    - airline_credits: array of credit details (if refunding to credits)
 *    - expires_at: quote expiration
 * 3. User reviews and confirms via /confirm endpoint
 */
router.post('/order-cancellations', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
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
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

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
          refundAmount: cancellationData.refund_amount ? Number(cancellationData.refund_amount) : 0,
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
      message: cancellationData.refund_to === 'airline_credits' 
        ? 'Cancellation quote created. Refund will be issued as airline credits.'
        : 'Cancellation request created',
    });
  } catch (error: any) {
    console.error('[Duffel] Create cancellation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/order-cancellations/:id
 * Get cancellation by ID with Redis + NEON hybrid caching
 */
router.get('/order-cancellations/:id', cacheCancellationMiddleware, async (req: Request, res: Response) => {
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
});

/**
 * GET /api/duffel/order-cancellations
 * List all cancellations
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
 * POST /api/duffel/order-cancellations/:id/confirm
 * Confirm a cancellation
 */
router.post('/order-cancellations/:id/confirm', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/order_cancellations/${id}/confirm`, 'POST');

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
 * POST /api/duffel/cfar-offers
 * Create a Cancel for Any Reason (CFAR) offer request
 * 
 * CFAR allows customers to cancel their booking for any reason
 * and receive a refund (typically partial).
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
 * GET /api/duffel/cfar-offers/:id
 * Get a CFAR offer by ID
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
 * POST /api/duffel/cfar-contracts
 * Create a CFAR contract (purchase CFAR coverage)
 */
router.post('/cfar-contracts', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
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
            metadata: {
              ...(order.metadata as object || {}),
              cfar_contract_id: contractData.id,
              cfar_status: contractData.status,
            },
          },
        });

        // Invalidate cache
        await OrderManager.invalidate(contractData.order_id, order.userId);
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
});

/**
 * GET /api/duffel/cfar-contracts/:id
 * Get a CFAR contract by ID
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
 * POST /api/duffel/cfar-claims
 * Create a CFAR claim (request refund under CFAR)
 */
router.post('/cfar-claims', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
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
            metadata: {
              ...(order.metadata as object || {}),
              cfar_claim_id: claimData.id,
              cfar_claim_status: claimData.status,
              refund_amount: claimData.refund_amount,
            },
          },
        });

        // Invalidate cache
        await OrderManager.invalidate(claimData.order_id, order.userId);
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
});

/**
 * GET /api/duffel/cfar-claims/:id
 * Get a CFAR claim by ID
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
 * POST /api/duffel/order-change-requests
 * Create an order change request
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
 * GET /api/duffel/order-change-requests/:id
 * Get order change request by ID
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
 * POST /api/duffel/order-changes
 * Create a pending order change
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
 * POST /api/duffel/order-changes/confirm
 * Confirm an order change
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
 * GET /api/duffel/order-changes/:id
 * Get order change by ID
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
 * GET /api/duffel/seat-maps
 * Get seat map for an offer or order with Redis caching
 */
router.get('/seat-maps', cacheSeatMapMiddleware, async (req: Request, res: Response) => {
  try {
    const { offer_id, order_id, segment_id } = req.query;

    if (!offer_id && !order_id) {
      return res.status(400).json({ error: 'offer_id or order_id is required' });
    }

    const params = new URLSearchParams();
    if (offer_id) params.append('offer_id', offer_id as string);
    if (order_id) params.append('order_id', order_id as string);
    if (segment_id) params.append('segment_id', segment_id as string);

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/seat_maps?${params}`);

    // Process through API Manager (caches in Redis)
    const seatMapData = duffelResponse.data;
    await SeatMapManager.processResponse(seatMapData, offer_id as string, order_id as string);

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
 * POST /api/duffel/payment-intents
 * Create a payment intent for a hold order
 * 
 * Flow for Hold Orders:
 * 1. Create order with type: 'hold'
 * 2. Create payment intent with order_id
 * 3. Frontend uses client_token for payment
 * 4. Payment is confirmed automatically
 */
router.post('/payment-intents', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
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
      await prisma.duffelOrder.update({
        where: { id: order.id },
        data: {
          paymentStatus: 'pending',
          metadata: {
            ...(order.metadata as object || {}),
            paymentIntentId: paymentIntentData.id,
            paymentIntentStatus: paymentIntentData.status,
          },
        },
      });
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
});

/**
 * GET /api/duffel/payment-intents/:id
 * Get payment intent by ID
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
 * POST /api/duffel/payment-intents/:id/confirm
 * Confirm a payment intent (for card payments)
 */
router.post('/payment-intents/:id/confirm', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/payment_intents/${id}/actions/confirm`, 'POST');

    const paymentIntentData = duffelResponse.data;

    // Update order payment status
    if (paymentIntentData.status === 'succeeded') {
      const order = await prisma.duffelOrder.findFirst({
        where: {
          metadata: {
            path: ['paymentIntentId'],
            equals: id,
          },
        },
      });

      if (order) {
        await prisma.duffelOrder.update({
          where: { id: order.id },
          data: {
            paymentStatus: 'paid',
            status: 'paid',
            metadata: {
              ...(order.metadata as object || {}),
              paymentIntentStatus: 'succeeded',
              paidAt: new Date().toISOString(),
            },
          },
        });

        // Invalidate order cache
        await OrderManager.invalidate(order.externalId, order.userId);
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
});

/**
 * POST /api/duffel/orders/:id/pay
 * Pay for a hold order using Duffel balance
 * Simplified endpoint for instant payment
 */
router.post('/orders/:id/pay', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { payment_method_type = 'balance' } = req.body;

    // Get order first to check status
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: String(id) },
    });

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot pay for a cancelled order' });
    }

    if (order.status === 'paid' || order.status === 'confirmed' || order.status === 'ticketed') {
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
      await prisma.duffelOrder.update({
        where: { id: order.id },
        data: {
          status: 'paid',
          paymentStatus: 'paid',
          metadata: {
            ...(order.metadata as object || {}),
            paymentIntentId: paymentIntentData.id,
            paidAt: new Date().toISOString(),
          },
        },
      });

      // Invalidate cache
      await OrderManager.invalidate(id, order.userId);
    }

    res.json({
      success: true,
      data: {
        order_id: id,
        payment_intent: paymentIntentData,
        status: paymentIntentData.status,
        message: paymentIntentData.status === 'succeeded' ? 'Payment successful' : 'Payment pending',
      },
    });
  } catch (error: any) {
    console.error('[Duffel] Pay for order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// HOLD ORDERS - Create Order with Hold Type
// ============================================================================

/**
 * POST /api/duffel/orders/hold
 * Create a hold order (book now, pay later)
 * 
 * This creates an order with type: 'hold' which reserves the booking
 * for a limited time (usually 24-48 hours) before payment is required.
 */
router.post('/orders/hold', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
  try {
    const { selected_offers, passengers, contact, userId, metadata, loyalty_programme_accounts } = req.body;

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
    const order = await prisma.duffelOrder.create({
      data: {
        externalId: orderId,
        userId: userId,
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
        paymentStatus: 'awaiting_payment',
        metadata: {
          ...metadata,
          payment_required_by: orderData.payment_requirements?.payment_required_by,
        },
      },
    });

    // Process through API Manager (caches in Redis + NEON)
    const managedResponse = await OrderManager.processResponse(orderId, orderData, userId);

    res.json({
      success: true,
      data: managedResponse.data,
      localId: order.id,
      cached: false,
      source: 'api',
      type: 'hold',
      message: 'Hold order created. Payment required before expiry.',
      payment_required_by: orderData.payment_requirements?.payment_required_by,
    });
  } catch (error: any) {
    console.error('[Duffel] Create hold order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BAGS & ANCILLARIES
// ============================================================================

/**
 * GET /api/duffel/offers/:id/available-services
 * Get available services (baggage, seats, meals) for an offer
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
 * POST /api/duffel/bags
 * Add baggage to an order
 * 
 * Request body:
 * - order_id: The order to add baggage to
 * - services: Array of baggage services to add
 */
router.post('/bags', invalidateCacheAfterMutationMiddleware, async (req: Request, res: Response) => {
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
});

/**
 * GET /api/duffel/orders/:id/available-services
 * Get available services for an existing order
 */
router.get('/orders/:id/available-services', cacheAvailableServicesMiddleware, async (req: Request, res: Response) => {
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
});

// ============================================================================
// LOYALTY PROGRAMME ACCOUNTS
// ============================================================================

/**
 * GET /api/duffel/loyalty-programme-accounts
 * List loyalty programme accounts for a passenger
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
 * POST /api/duffel/loyalty-programme-accounts
 * Create a loyalty programme account for a passenger
 */
router.post('/loyalty-programme-accounts', async (req: Request, res: Response) => {
  try {
    const { passenger_id, airline_iata_code, account_number } = req.body;

    if (!passenger_id || !airline_iata_code || !account_number) {
      return res.status(400).json({ 
        error: 'passenger_id, airline_iata_code, and account_number are required' 
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
 * GET /api/duffel/loyalty-programme-accounts/:id
 * Get a loyalty programme account by ID
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
 * DELETE /api/duffel/loyalty-programme-accounts/:id
 * Delete a loyalty programme account
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
 * GET /api/duffel/airline-initiated-changes
 * List airline-initiated changes
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
 * PATCH /api/duffel/airline-initiated-changes/:id
 * Update airline-initiated change response
 */
router.patch('/airline-initiated-changes/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action_taken } = req.body;

    if (!action_taken) {
      return res.status(400).json({ error: 'action_taken is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/airline_initiated_changes/${id}`, 'PATCH', {
      data: { action_taken },
    });

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
 * POST /api/duffel/airline-initiated-changes/:id/accept
 * Accept airline-initiated change
 */
router.post('/airline-initiated-changes/:id/accept', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/airline_initiated_changes/${id}/accept`, 'POST');

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
 * GET /api/duffel/airports
 * Search airports and cities via Duffel places API
 * Proxied endpoint to avoid exposing Duffel API key in frontend
 */
router.get('/airports', async (req: Request, res: Response) => {
  try {
    const { q, limit = 10 } = req.query;

    if (!q || typeof q !== 'string' || q.length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" is required (min 2 characters)' });
    }

    // Call Duffel Places API
    const params = new URLSearchParams();
    params.append('query', q);
    params.append('limit', String(limit));

    const duffelResponse = await duffelRequest<any>(`/air/places?${params}`, 'GET');

    // Transform to consistent format for frontend autocomplete
    const places = (duffelResponse.data || []).map((place: any) => ({
      type: place.type === 'airport' ? 'AIRPORT' : 'CITY',
      icon: place.type === 'airport' ? 'plane' : 'map-pin',
      title: place.type === 'airport' ? `${place.name} (${place.iata_code})` : place.name,
      subtitle: place.city_name ? `${place.city_name}, ${place.country_name}` : place.country_name || '',
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
    });
  } catch (error: any) {
    console.error('[Duffel] Airports search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/places/suggestions
 * Find airports within a geographic area using Duffel Places API
 * Documentation: https://duffel.com/docs/guides/finding-airports-within-an-area
 * 
 * Use cases:
 * - Find airports near a specific location (e.g., near Lagos, Portugal)
 * - Find nearby airports when traveling to a destination without its own airport
 * - Support "airports near me" functionality
 * 
 * Query parameters:
 * - lat: Latitude coordinate (required)
 * - lng: Longitude coordinate (required)
 * - rad: Search radius in meters (optional, default: 100000 = 100km)
 * - query: Optional search string to filter results
 */
router.get('/places/suggestions', async (req: Request, res: Response) => {
  try {
    const { lat, lng, rad, query } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) are required parameters' 
      });
    }

    // Validate lat/lng are valid numbers
    const latitude = parseFloat(lat as string);
    const longitude = parseFloat(lng as string);
    
    if (isNaN(latitude) || isNaN(longitude)) {
      return res.status(400).json({ 
        error: 'Latitude and longitude must be valid numbers' 
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

    console.log('[Duffel] Finding airports within area:', { lat: latitude, lng: longitude, rad: params.get('rad'), query });

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
      city: place.city ? {
        id: place.city.id,
        name: place.city.name,
        iataCode: place.city.iata_code,
        countryCode: place.city.iata_country_code,
      } : null,
      // Airports within city (for city-type results)
      airports: place.airports?.map((airport: any) => ({
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
 * GET /api/duffel/nearby-airports
 * Convenience endpoint to find airports near a location
 * Uses the places/suggestions API under the hood
 * 
 * Query parameters:
 * - lat: Latitude coordinate (required)
 * - lng: Longitude coordinate (required)
 * - radius: Search radius in km (optional, default: 100)
 */
router.get('/nearby-airports', async (req: Request, res: Response) => {
  try {
    const { lat, lng, radius } = req.query;

    // Validate required parameters
    if (!lat || !lng) {
      return res.status(400).json({ 
        error: 'Latitude (lat) and longitude (lng) are required parameters' 
      });
    }

    // Convert radius from km to meters (default: 100km)
    const radiusInMeters = radius ? parseInt(radius as string) * 1000 : 100000;

    // Build the places/suggestions URL
    const params = new URLSearchParams();
    params.append('lat', lat as string);
    params.append('lng', lng as string);
    params.append('rad', String(radiusInMeters));

    console.log('[Duffel] Finding nearby airports:', { lat, lng, radiusKm: radius });

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
