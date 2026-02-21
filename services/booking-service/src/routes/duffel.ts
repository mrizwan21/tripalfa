/**
 * Duffel Flight API Routes
 * Handles all Duffel API endpoints for flight bookings
 * 
 * Documentation: https://duffel.com/docs/api/v2
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@tripalfa/shared-database';

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
 * Create an offer request (search for flights)
 */
router.post('/offer-requests', async (req: Request, res: Response) => {
  try {
    const { slices, passengers, cabin_class, return_available_services } = req.body;

    if (!slices || !Array.isArray(slices) || slices.length === 0) {
      return res.status(400).json({ error: 'slices is required' });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: 'passengers is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/offer_requests', 'POST', {
      data: {
        slices,
        passengers,
        cabin_class: cabin_class || 'economy',
        return_available_services: return_available_services ?? true,
      },
    });

    // Store in database
    const offerRequest = await prisma.duffelOfferRequest.create({
      data: {
        externalId: duffelResponse.data.id,
        slices: slices,
        passengers: passengers,
        cabinClass: cabin_class,
        status: 'pending',
        expiresAt: new Date(duffelResponse.data.expires_at),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
      localId: offerRequest.id,
    });
  } catch (error: any) {
    console.error('[Duffel] Create offer request error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/offer-requests/:id
 * Get offer request by ID
 */
router.get('/offer-requests/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/offer_requests/${id}`);
      return res.json({
        success: true,
        data: duffelResponse.data,
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
          source: 'database',
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
 * Get offer by ID
 */
router.get('/offers/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/offers/${id}`);
      return res.json({
        success: true,
        data: duffelResponse.data,
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
          source: 'database',
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
 * Create a flight order (booking)
 */
router.post('/orders', async (req: Request, res: Response) => {
  try {
    const { selected_offers, passengers, payments, metadata, contact } = req.body;

    if (!selected_offers || !Array.isArray(selected_offers) || selected_offers.length === 0) {
      return res.status(400).json({ error: 'selected_offers is required' });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: 'passengers is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/orders', 'POST', {
      data: {
        selected_offers,
        passengers,
        payments,
        metadata,
        contact,
      },
    });

    const orderData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.create({
      data: {
        externalId: orderData.id,
        customerEmail: contact?.email,
        customerPhone: contact?.phone,
        status: orderData.status || 'pending',
        type: orderData.type,
        slices: orderData.slices,
        passengers: orderData.passengers,
        baseAmount: orderData.total_amount,
        taxAmount: orderData.tax_amount || 0,
        totalAmount: orderData.total_amount,
        currency: orderData.total_currency || 'USD',
        confirmedAt: orderData.confirmed_at ? new Date(orderData.confirmed_at) : null,
      },
    });

    res.json({
      success: true,
      data: orderData,
      localId: order.id,
    });
  } catch (error: any) {
    console.error('[Duffel] Create order error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/orders/:id
 * Get order by ID
 */
router.get('/orders/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/orders/${id}`);
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
 * Get available services (ancillaries) for an order
 */
router.get('/orders/:id/available-services', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/orders/${id}/available_services`);

    res.json({
      success: true,
      data: duffelResponse.data,
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
router.post('/orders/:id/price', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { payment } = req.body;

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>(`/air/orders/${id}/price`, 'POST', {
      data: { payment },
    });

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
 * Add services (baggage, meals, seats) to an order
 */
router.post('/order-services', async (req: Request, res: Response) => {
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
 * Create a cancellation request
 */
router.post('/order-cancellations', async (req: Request, res: Response) => {
  try {
    const { order_id } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: 'order_id is required' });
    }

    // Call Duffel API
    const duffelResponse = await duffelRequest<any>('/air/order_cancellations', 'POST', {
      data: { order_id },
    });

    const cancellationData = duffelResponse.data;

    // Find the order in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      // Store in database
      await prisma.duffelOrderCancellation.create({
        data: {
          externalId: cancellationData.id,
          orderId: order.id,
          status: 'pending',
        },
      });
    }

    res.json({
      success: true,
      data: cancellationData,
    });
  } catch (error: any) {
    console.error('[Duffel] Create cancellation error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/order-cancellations/:id
 * Get cancellation by ID
 */
router.get('/order-cancellations/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelRequest<any>(`/air/order_cancellations/${id}`);
      return res.json({
        success: true,
        data: duffelResponse.data,
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
          source: 'database',
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
 * Get seat map for an offer or order
 */
router.get('/seat-maps', async (req: Request, res: Response) => {
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

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error('[Duffel] Get seat map error:', error.message);
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

// ============================================================================
// Export Router
// ============================================================================

export default router;
