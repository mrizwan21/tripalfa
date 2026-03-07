/**
 * Enhanced Duffel Flight API Routes
 * Handles advanced Duffel API endpoints with Hybrid Caching
 *
 * New Endpoints:
 * - Partial Offer Requests (GET/POST /duffel/partial-offer-requests)
 * - Batch Offer Requests (GET/POST /duffel/batch-offer-requests)
 * - Order Changes (GET/POST /duffel/order-changes)
 * - Airline Credits (GET/POST /duffel/airline-credits)
 * - Services Management (GET/POST /duffel/services)
 * - Enhanced Payments (GET/POST /duffel/payments)
 */

import { Router, Request, Response } from "express";
import { prisma } from "@tripalfa/shared-database";
import { duffelClient } from "../utils/duffelClient.js";

const router: Router = Router();

const DB_WRITE_TIMEOUT_MS = 1500;

async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
): Promise<T | null> {
  return Promise.race([
    promise,
    new Promise<null>((resolve) => setTimeout(() => resolve(null), timeoutMs)),
  ]);
}

// ============================================================================
// PARTIAL OFFER REQUESTS - Advanced Flight Search
// ============================================================================

/**
 * POST /api/duffel/partial-offer-requests
 * Create a partial offer request for segment-by-segment pricing
 *
 * Use case: When you want to price individual flight segments separately
 * to get more granular control over pricing and availability
 */
router.post("/partial-offer-requests", async (req: Request, res: Response) => {
  try {
    const {
      slices,
      passengers,
      cabin_class,
      return_available_services,
    } = req.body;

    if (!slices || !Array.isArray(slices) || slices.length === 0) {
      return res.status(400).json({ error: "slices is required" });
    }

    if (!passengers || !Array.isArray(passengers) || passengers.length === 0) {
      return res.status(400).json({ error: "passengers is required" });
    }

    // Build partial offer request data
    const partialRequestData: any = {
      slices,
      passengers,
      cabin_class: cabin_class || "economy",
      return_available_services: return_available_services ?? true,
    };

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/partial_offer_requests",
      data: {
        data: partialRequestData,
      },
    });

    const requestId = duffelResponse.data.id;

    // Store in database
    let partialRequest: { id?: string } | null = null;
    try {
      partialRequest = await withTimeout(
        prisma.duffelPartialOfferRequest.create({
          data: {
            externalId: requestId,
            slices: slices,
            passengers: passengers,
            cabinClass: cabin_class,
            status: "pending",
          },
        }),
        DB_WRITE_TIMEOUT_MS,
      );
    } catch (dbError: any) {
      console.warn(
        "[Duffel] Partial offer request local persistence skipped:",
        dbError?.message || dbError,
      );
    }

    res.json({
      success: true,
      data: duffelResponse.data,
      localId: partialRequest?.id,
      message: "Partial offer request created",
    });
  } catch (error: any) {
    console.error("[Duffel] Create partial offer request error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/partial-offer-requests/:id
 * Get partial offer request by ID
 */
router.get("/partial-offer-requests/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: "GET",
        url: `/air/partial_offer_requests/${id}`,
      });

      // Store/update in database
      await prisma.duffelPartialOfferRequest.upsert({
        where: { externalId: String(id) },
        update: {
          slices: duffelResponse.data.slices,
          passengers: duffelResponse.data.passengers,
          cabinClass: duffelResponse.data.cabin_class,
          status: duffelResponse.data.status,
        },
        create: {
          externalId: duffelResponse.data.id,
          slices: duffelResponse.data.slices,
          passengers: duffelResponse.data.passengers,
          cabinClass: duffelResponse.data.cabin_class,
          status: duffelResponse.data.status,
        },
      });

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const partialRequest = await prisma.duffelPartialOfferRequest.findUnique({
        where: { externalId: String(id) },
        include: { partialOfferFares: true },
      });

      if (partialRequest) {
        return res.json({
          success: true,
          data: partialRequest,
        });
      }

      return res.status(404).json({ error: "Partial offer request not found" });
    }
  } catch (error: any) {
    console.error("[Duffel] Get partial offer request error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/partial-offer-requests/:id/fares
 * Get fares for a partial offer request
 */
router.get("/partial-offer-requests/:id/fares", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "GET",
      url: `/air/partial_offer_requests/${id}/fares`,
    });

    // Store fares in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      await prisma.duffelPartialOfferFare.createMany({
        data: duffelResponse.data.data.map((fare: any) => ({
          partialRequestId: id,
          fareId: fare.id,
          amount: parseFloat(fare.amount),
          currency: fare.currency,
          conditions: fare.conditions,
        })),
        skipDuplicates: true,
      });
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] Get partial offer fares error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// BATCH OFFER REQUESTS - Bulk Flight Search
// ============================================================================

/**
 * POST /api/duffel/batch-offer-requests
 * Create a batch offer request for multiple searches
 *
 * Use case: When you want to search multiple routes simultaneously
 * to compare prices and availability across different options
 */
router.post("/batch-offer-requests", async (req: Request, res: Response) => {
  try {
    const { requests } = req.body;

    if (!requests || !Array.isArray(requests) || requests.length === 0) {
      return res.status(400).json({ error: "requests array is required" });
    }

    // Build batch request data
    const batchRequestData: any = {
      requests: requests.map((req: any) => ({
        slices: req.slices,
        passengers: req.passengers,
        cabin_class: req.cabin_class || "economy",
      })),
    };

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/batch_offer_requests",
      data: {
        data: batchRequestData,
      },
    });

    const batchId = duffelResponse.data.id;

    // Store in database
    let batchRequest: { id?: string } | null = null;
    try {
      batchRequest = await withTimeout(
        prisma.duffelBatchOfferRequest.create({
          data: {
            externalId: batchId,
            requests: requests,
            status: "pending",
          },
        }),
        DB_WRITE_TIMEOUT_MS,
      );
    } catch (dbError: any) {
      console.warn(
        "[Duffel] Batch offer request local persistence skipped:",
        dbError?.message || dbError,
      );
    }

    res.json({
      success: true,
      data: duffelResponse.data,
      localId: batchRequest?.id,
      message: "Batch offer request created",
    });
  } catch (error: any) {
    console.error("[Duffel] Create batch offer request error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/batch-offer-requests/:id
 * Get batch offer request by ID
 */
router.get("/batch-offer-requests/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: "GET",
        url: `/air/batch_offer_requests/${id}`,
      });

      // Store/update in database
      await prisma.duffelBatchOfferRequest.upsert({
        where: { externalId: String(id) },
        update: {
          requests: duffelResponse.data.requests,
          status: duffelResponse.data.status,
          completedAt: duffelResponse.data.completed_at
            ? new Date(duffelResponse.data.completed_at)
            : null,
          results: duffelResponse.data.results,
        },
        create: {
          externalId: duffelResponse.data.id,
          requests: duffelResponse.data.requests,
          status: duffelResponse.data.status,
          completedAt: duffelResponse.data.completed_at
            ? new Date(duffelResponse.data.completed_at)
            : null,
          results: duffelResponse.data.results,
        },
      });

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const batchRequest = await prisma.duffelBatchOfferRequest.findUnique({
        where: { externalId: String(id) },
      });

      if (batchRequest) {
        return res.json({
          success: true,
          data: batchRequest,
        });
      }

      return res.status(404).json({ error: "Batch offer request not found" });
    }
  } catch (error: any) {
    console.error("[Duffel] Get batch offer request error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ORDER CHANGES - Flight Modifications
// ============================================================================

/**
 * POST /api/duffel/order-change-requests
 * Create an order change request
 */
router.post("/order-change-requests", async (req: Request, res: Response) => {
  try {
    const { order_id, slices } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    if (!slices) {
      return res.status(400).json({ error: "slices is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/order_change_requests",
      data: {
        data: {
          order_id,
          slices,
        },
      },
    });

    const changeData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelOrderChangeRequest.create({
        data: {
          externalId: changeData.id,
          orderId: order.id,
          requestedChanges: slices,
          changeOffers: changeData.order_change_offers,
          status: "pending",
        },
      });
    }

    res.json({
      success: true,
      data: changeData,
    });
  } catch (error: any) {
    console.error("[Duffel] Create order change request error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/order-change-requests/:id
 * Get order change request by ID
 */
router.get("/order-change-requests/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: "GET",
        url: `/air/order_change_requests/${id}`,
      });

      // Store/update in database
      const order = await prisma.duffelOrder.findFirst({
        where: {
          duffelOrderChangeRequests: {
            some: { externalId: String(id) },
          },
        },
      });

      if (order) {
        await prisma.duffelOrderChangeRequest.upsert({
          where: { externalId: String(id) },
          update: {
            requestedChanges: duffelResponse.data.slices,
            changeOffers: duffelResponse.data.order_change_offers,
            status: duffelResponse.data.status,
          },
          create: {
            externalId: duffelResponse.data.id,
            orderId: order.id,
            requestedChanges: duffelResponse.data.slices,
            changeOffers: duffelResponse.data.order_change_offers,
            status: duffelResponse.data.status,
          },
        });
      }

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const changeRequest = await prisma.duffelOrderChangeRequest.findUnique({
        where: { externalId: String(id) },
      });

      if (changeRequest) {
        return res.json({
          success: true,
          data: changeRequest,
        });
      }

      return res.status(404).json({ error: "Order change request not found" });
    }
  } catch (error: any) {
    console.error("[Duffel] Get order change request error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/order-changes
 * Create a pending order change
 */
router.post("/order-changes", async (req: Request, res: Response) => {
  try {
    const { selected_order_change_offer } = req.body;

    if (!selected_order_change_offer?.id) {
      return res
        .status(400)
        .json({ error: "selected_order_change_offer.id is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/order_changes",
      data: {
        data: {
          selected_order_change_offer,
        },
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] Create order change error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/order-changes/confirm
 * Confirm an order change
 */
router.post("/order-changes/confirm", async (req: Request, res: Response) => {
  try {
    const { order_change_id } = req.body;

    if (!order_change_id) {
      return res.status(400).json({ error: "order_change_id is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/order_changes/confirm",
      data: {
        data: { order_change_id },
      },
    });

    // Update in database
    await prisma.duffelOrderChangeRequest.updateMany({
      where: { externalId: order_change_id },
      data: {
        status: "confirmed",
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] Confirm order change error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AIRLINE CREDITS - Refund Management
// ============================================================================

/**
 * GET /api/duffel/airline-credits
 * List airline credits for an order
 */
router.get("/airline-credits", async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "GET",
      url: `/air/airline_credits?order_id=${order_id}`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(order_id) },
      });

      if (order) {
        await prisma.duffelAirlineCredit.createMany({
          data: duffelResponse.data.data.map((credit: any) => ({
            externalId: credit.id,
            orderId: order.id,
            amount: parseFloat(credit.amount),
            currency: credit.currency,
            reason: credit.reason,
            expiresAt: credit.expires_at ? new Date(credit.expires_at) : null,
            status: credit.status,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] List airline credits error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/airline-credits
 * Create an airline credit
 */
router.post("/airline-credits", async (req: Request, res: Response) => {
  try {
    const { order_id, amount, currency, reason } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    if (!amount || !currency) {
      return res.status(400).json({ error: "amount and currency are required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/airline_credits",
      data: {
        data: {
          order_id,
          amount: {
            amount: String(amount),
            currency: currency,
          },
          reason: reason || "Customer service",
        },
      },
    });

    const creditData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelAirlineCredit.create({
        data: {
          externalId: creditData.id,
          orderId: order.id,
          amount: parseFloat(creditData.amount),
          currency: creditData.currency,
          reason: creditData.reason,
          expiresAt: creditData.expires_at
            ? new Date(creditData.expires_at)
            : null,
          status: creditData.status,
        },
      });
    }

    res.json({
      success: true,
      data: creditData,
    });
  } catch (error: any) {
    console.error("[Duffel] Create airline credit error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/airline-credits/:id
 * Get airline credit by ID
 */
router.get("/airline-credits/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: "GET",
        url: `/air/airline_credits/${id}`,
      });

      // Store/update in database
      const credit = await prisma.duffelAirlineCredit.findUnique({
        where: { externalId: String(id) },
      });

      if (credit) {
        await prisma.duffelAirlineCredit.update({
          where: { id: credit.id },
          data: {
            amount: parseFloat(duffelResponse.data.amount),
            currency: duffelResponse.data.currency,
            reason: duffelResponse.data.reason,
            expiresAt: duffelResponse.data.expires_at
              ? new Date(duffelResponse.data.expires_at)
              : null,
            status: duffelResponse.data.status,
            usedAt: duffelResponse.data.used_at
              ? new Date(duffelResponse.data.used_at)
              : null,
          },
        });
      }

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const credit = await prisma.duffelAirlineCredit.findUnique({
        where: { externalId: String(id) },
      });

      if (credit) {
        return res.json({
          success: true,
          data: credit,
        });
      }

      return res.status(404).json({ error: "Airline credit not found" });
    }
  } catch (error: any) {
    console.error("[Duffel] Get airline credit error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SERVICES MANAGEMENT - Ancillary Services
// ============================================================================

/**
 * GET /api/duffel/services
 * List services for an order
 */
router.get("/services", async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "GET",
      url: `/air/orders/${order_id}/services`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(order_id) },
      });

      if (order) {
        await prisma.duffelService.createMany({
          data: duffelResponse.data.data.map((service: any) => ({
            externalId: service.id,
            orderId: order.id,
            type: service.type,
            name: service.name,
            description: service.description,
            amount: parseFloat(service.total_amount),
            currency: service.total_currency,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] List services error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/services
 * Add services to an order
 */
router.post("/services", async (req: Request, res: Response) => {
  try {
    const { order_id, services } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    if (!services || !Array.isArray(services)) {
      return res.status(400).json({ error: "services array is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/order_services",
      data: {
        data: {
          order_id,
          services,
        },
      },
    });

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order && duffelResponse.data.data) {
      await prisma.duffelService.createMany({
        data: duffelResponse.data.data.map((service: any) => ({
          externalId: service.id,
          orderId: order.id,
          type: service.type,
          name: service.name,
          description: service.description,
          amount: parseFloat(service.total_amount),
          currency: service.total_currency,
        })),
        skipDuplicates: true,
      });
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] Add services error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// ENHANCED PAYMENTS - Payment Management
// ============================================================================

/**
 * GET /api/duffel/payments
 * List payments for an order
 */
router.get("/payments", async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "GET",
      url: `/air/orders/${order_id}/payments`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const order = await prisma.duffelOrder.findUnique({
        where: { externalId: String(order_id) },
      });

      if (order) {
        await prisma.duffelPayment.createMany({
          data: duffelResponse.data.data.map((payment: any) => ({
            externalId: payment.id,
            orderId: order.id,
            amount: parseFloat(payment.amount),
            currency: payment.currency,
            paymentMethod: payment.payment_method?.type || "unknown",
            status: payment.status,
            gateway: payment.gateway,
            transactionId: payment.transaction_id,
          })),
          skipDuplicates: true,
        });
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] List payments error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/payments
 * Create a payment for an order
 */
router.post("/payments", async (req: Request, res: Response) => {
  try {
    const { order_id, payment_method } = req.body;

    if (!order_id) {
      return res.status(400).json({ error: "order_id is required" });
    }

    if (!payment_method) {
      return res.status(400).json({ error: "payment_method is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: "/air/payments",
      data: {
        data: {
          order_id,
          payment_method,
        },
      },
    });

    const paymentData = duffelResponse.data;

    // Store in database
    const order = await prisma.duffelOrder.findUnique({
      where: { externalId: order_id },
    });

    if (order) {
      await prisma.duffelPayment.create({
        data: {
          externalId: paymentData.id,
          orderId: order.id,
          amount: parseFloat(paymentData.amount),
          currency: paymentData.currency,
          paymentMethod: paymentData.payment_method?.type || "unknown",
          status: paymentData.status,
          gateway: paymentData.gateway,
          transactionId: paymentData.transaction_id,
        },
      });
    }

    res.json({
      success: true,
      data: paymentData,
    });
  } catch (error: any) {
    console.error("[Duffel] Create payment error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * GET /api/duffel/payments/:id
 * Get payment by ID
 */
router.get("/payments/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Try Duffel API first
    try {
      const duffelResponse = await duffelClient.request({
        method: "GET",
        url: `/air/payments/${id}`,
      });

      // Store/update in database
      const payment = await prisma.duffelPayment.findUnique({
        where: { externalId: String(id) },
      });

      if (payment) {
        await prisma.duffelPayment.update({
          where: { id: payment.id },
          data: {
            amount: parseFloat(duffelResponse.data.amount),
            currency: duffelResponse.data.currency,
            paymentMethod: duffelResponse.data.payment_method?.type || "unknown",
            status: duffelResponse.data.status,
            gateway: duffelResponse.data.gateway,
            transactionId: duffelResponse.data.transaction_id,
          },
        });
      }

      return res.json({
        success: true,
        data: duffelResponse.data,
      });
    } catch (duffelError) {
      // Fallback to database
      const payment = await prisma.duffelPayment.findUnique({
        where: { externalId: String(id) },
      });

      if (payment) {
        return res.json({
          success: true,
          data: payment,
        });
      }

      return res.status(404).json({ error: "Payment not found" });
    }
  } catch (error: any) {
    console.error("[Duffel] Get payment error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AIRLINE-INITIATED CHANGES - Proactive Changes
// ============================================================================

/**
 * GET /api/duffel/airline-initiated-changes
 * List airline-initiated changes
 */
router.get("/airline-initiated-changes", async (req: Request, res: Response) => {
  try {
    const { order_id } = req.query;

    // Build query parameters
    const params = new URLSearchParams();
    if (order_id) params.append("order_id", order_id as string);

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "GET",
      url: `/air/airline_initiated_changes?${params}`,
    });

    // Store in database
    if (duffelResponse.data.data && Array.isArray(duffelResponse.data.data)) {
      const changes = duffelResponse.data.data;

      for (const change of changes) {
        const order = await prisma.duffelOrder.findUnique({
          where: { externalId: change.order_id },
        });

        if (order) {
          await prisma.duffelAirlineInitiatedChange.upsert({
            where: { externalId: change.id },
            update: {
              changeType: change.change_type,
              details: change.details,
              actionTaken: change.action_taken,
              status: change.status,
              expiresAt: change.expires_at
                ? new Date(change.expires_at)
                : null,
            },
            create: {
              externalId: change.id,
              orderId: order.id,
              changeType: change.change_type,
              details: change.details,
              actionTaken: change.action_taken,
              status: change.status,
              expiresAt: change.expires_at
                ? new Date(change.expires_at)
                : null,
            },
          });
        }
      }
    }

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] List airline-initiated changes error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * PATCH /api/duffel/airline-initiated-changes/:id
 * Update airline-initiated change response
 */
router.patch("/airline-initiated-changes/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { action_taken } = req.body;

    if (!action_taken) {
      return res.status(400).json({ error: "action_taken is required" });
    }

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "PATCH",
      url: `/air/airline_initiated_changes/${id}`,
      data: {
        data: { action_taken },
      },
    });

    // Update in database
    await prisma.duffelAirlineInitiatedChange.updateMany({
      where: { externalId: String(id) },
      data: {
        actionTaken: action_taken,
        status: duffelResponse.data.status,
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] Update airline-initiated change error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

/**
 * POST /api/duffel/airline-initiated-changes/:id/accept
 * Accept airline-initiated change
 */
router.post("/airline-initiated-changes/:id/accept", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Call Duffel API
    const duffelResponse = await duffelClient.request({
      method: "POST",
      url: `/air/airline_initiated_changes/${id}/actions/accept`,
    });

    // Update in database
    await prisma.duffelAirlineInitiatedChange.updateMany({
      where: { externalId: String(id) },
      data: {
        actionTaken: "accept",
        status: "accepted",
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      data: duffelResponse.data,
    });
  } catch (error: any) {
    console.error("[Duffel] Accept airline-initiated change error:", error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Export Router
// ============================================================================

export default router;