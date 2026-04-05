/* eslint-disable no-restricted-syntax, @typescript-eslint/no-unused-vars */

/**
 * Webhook Routes
 *
 * Handles incoming webhooks from:
 * - Duffel API (flight bookings, cancellations, changes)
 * - LITEAPI (hotel bookings, cancellations, modifications)
 *
 * Endpoints:
 * - POST /api/webhooks/duffel - Duffel webhook handler
 * - POST /api/webhooks/liteapi - LITEAPI webhook handler
 * - GET  /api/webhooks/logs - View webhook delivery history
 * - POST /api/webhooks/test - Test webhook endpoint
 *
 * This module is responsible for receiving webhooks, validating signatures,
 * logging them, and forwarding to appropriate services for processing.
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '../database.js';
import crypto from 'crypto';

const router: ExpressRouter = Router();

// Environment Configuration
const NODE_ENV = process.env.NODE_ENV || 'development';
const isProduction = NODE_ENV === 'production';

// WEBHOOK_SECRET - fail fast in production if not set
const webhookSecretFromEnv = process.env.WEBHOOK_SECRET;
if (isProduction && !webhookSecretFromEnv) {
  throw new Error('WEBHOOK_SECRET environment variable is required in production');
}
const WEBHOOK_SECRET = webhookSecretFromEnv || (isProduction ? undefined : 'development_secret');

const BOOKING_SERVICE_URL =
  process.env.BOOKING_SERVICE_URL || (isProduction ? undefined : 'http://localhost:3000');

if (isProduction && !BOOKING_SERVICE_URL) {
  throw new Error('BOOKING_SERVICE_URL environment variable is required in production');
}
const ENABLE_WEBHOOK_SIGNATURE_VERIFICATION =
  process.env.ENABLE_WEBHOOK_SIGNATURE_VERIFICATION === 'true' || NODE_ENV === 'production';

// ============================================
// Webhook Event Types
// ============================================

// Duffel Event Types
type DuffelEventType =
  | 'order.created'
  | 'order.updated'
  | 'order.cancelled'
  | 'flight_schedule_changed'
  | 'airline_initiated_change'
  | 'seat_map_updated'
  | 'order_change_completed';

// LITEAPI Event Types
type LiteApiEventType =
  | 'booking.confirmed'
  | 'booking.cancelled'
  | 'booking.modified'
  | 'booking.pending';

// Webhook Log Interface
interface WebhookLog {
  id: string;
  source: 'duffel' | 'liteapi';
  eventType: string;
  payload: any;
  processed: boolean;
  processedAt?: Date;
  error?: string;
  retryCount: number;
  createdAt: Date;
}

// ============================================
// Utility Functions
// ============================================

/**
 * Verify webhook signature
 */
function verifySignature(payload: string, signature: string): boolean {
  if (!signature || !WEBHOOK_SECRET) return false;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
}

/**
 * Log webhook event to database using Prisma
 */
async function logWebhook(
  source: 'duffel' | 'liteapi',
  eventType: string,
  payload: any,
  processed: boolean = false,
  error?: string
): Promise<WebhookLog> {
  try {
    const logEntry = await prisma.webhook_event.create({
      data: {
        provider: source,
        eventType: eventType,
        payload: payload,
        status: processed ? 'processed' : 'received',
        processedAt: processed ? new Date() : null,
        metadata: error ? { error } : {},
      },
    });

    console.log(`[Webhook] ${source.toUpperCase()} - ${eventType}:`, {
      processed,
      error,
      timestamp: new Date().toISOString(),
      id: logEntry.id,
    });

    return {
      id: logEntry.id,
      source,
      eventType,
      payload,
      processed,
      processedAt: processed ? new Date() : undefined,
      error,
      retryCount: 0,
      createdAt: new Date(),
    };
  } catch (dbError: unknown) {
    // Fallback to console logging if database fails
    console.log(`[Webhook] ${source.toUpperCase()} - ${eventType}:`, {
      processed,
      error,
      timestamp: new Date().toISOString(),
    });

    return {
      id: crypto.randomUUID(),
      source,
      eventType,
      payload,
      processed,
      processedAt: processed ? new Date() : undefined,
      error,
      retryCount: 0,
      createdAt: new Date(),
    };
  }
}

/**
 * Forward webhook to booking service for processing
 */
async function forwardToBookingService(
  source: string,
  eventType: string,
  data: any
): Promise<void> {
  try {
    const response = await fetch(`${BOOKING_SERVICE_URL}/api/internal/webhooks/process`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        source,
        eventType,
        data,
        timestamp: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Webhook] Booking service error: ${response.status} - ${errorText}`);
      throw new Error(`Booking service returned ${response.status}`);
    }

    console.log(`[Webhook] Forwarded to booking service: ${source} - ${eventType}`);
  } catch (error: unknown) {
    console.error('[Webhook] Failed to forward to booking service:', error);
    throw error;
  }
}

/**
 * Send flight booking confirmation email
 */
async function sendFlightConfirmation(data: any): Promise<void> {
  try {
    const { order_id, customer_email, customer_name, passenger_name } = data;

    // Build flight confirmation payload
    const confirmationPayload = {
      orderId: order_id,
      bookingReference: order_id,
      customerEmail: customer_email || data.email || 'customer@example.com',
      customerName: customer_name || passenger_name || 'Valued Customer',
      flights: data.flights || [],
      passengers: data.passengers || [],
      totalAmount: data.total_amount || '0',
      currency: data.currency || 'USD',
      userId: data.userId,
    };

    console.log(`[Webhook] Sending flight confirmation for order ${order_id}`);

    // Call the flight confirmation endpoint
    const response = await fetch(
      `${BOOKING_SERVICE_URL}/api/internal/notifications/flight/confirmation`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(confirmationPayload),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Webhook] Flight confirmation failed: ${response.status} - ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log(`[Webhook] Flight confirmation sent: ${result.notificationId}`);
  } catch (error: unknown) {
    console.error(
      '[Webhook] Flight confirmation error:',
      error instanceof Error ? error.message : 'Unknown error'
    );
  }
}

// ============================================
// API Routes
// ============================================

/**
 * @swagger
 * /api/webhooks/duffel:
 *   post:
 *     summary: Receive Duffel webhook events
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               type:
 *                 type: string
 *                 description: Duffel event type
 *               data:
 *                 type: object
 *                 description: Event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *         description: Missing event type
 *       401:
 *         description: Invalid signature
 *       500:
 *         description: Server error
 */
router.post('/duffel', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-duffel-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature in production or when explicitly enabled
    if (ENABLE_WEBHOOK_SIGNATURE_VERIFICATION) {
      if (!signature) {
        console.warn('[Webhook] Missing Duffel signature header');
        return res.status(401).json({ error: 'Missing signature header' });
      }

      if (!verifySignature(payload, signature)) {
        console.warn('[Webhook] Invalid Duffel signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      console.log('[Webhook] Duffel signature verified successfully');
    } else {
      console.log('[Webhook] Duffel signature verification disabled (development mode)');
    }

    const { type, data } = req.body;

    if (!type) {
      return res.status(400).json({ error: 'Missing event type' });
    }

    console.log(`[Webhook] Received Duffel event: ${type}`);

    // Log the webhook
    const logEntry = await logWebhook('duffel', type, data, false);

    try {
      // Forward to booking service for processing
      await forwardToBookingService('duffel', type, data);

      // Update log as processed
      await logWebhook('duffel', type, data, true);

      // Send flight confirmation for order.created events
      if (type === 'order.created') {
        await sendFlightConfirmation(data);
      }

      res.json({ success: true, received: true, logId: logEntry.id });
    } catch (error: unknown) {
      // Update log with error
      await logWebhook('duffel', type, data, false, error.message);
      throw error;
    }
  } catch (error: unknown) {
    console.error('[Webhook] Duffel webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * @swagger
 * /api/webhooks/liteapi:
 *   post:
 *     summary: Receive LITEAPI webhook events
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               event_type:
 *                 type: string
 *                 description: LITEAPI event type
 *               data:
 *                 type: object
 *                 description: Event payload
 *     responses:
 *       200:
 *         description: Webhook processed successfully
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
 *         description: Missing event type
 *       401:
 *         description: Invalid signature
 *       500:
 *         description: Server error
 */
router.post('/liteapi', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['x-liteapi-signature'] as string;
    const payload = JSON.stringify(req.body);

    // Verify signature in production or when explicitly enabled
    if (ENABLE_WEBHOOK_SIGNATURE_VERIFICATION) {
      if (!signature) {
        console.warn('[Webhook] Missing LITEAPI signature header');
        return res.status(401).json({ error: 'Missing signature header' });
      }

      if (!verifySignature(payload, signature)) {
        console.warn('[Webhook] Invalid LITEAPI signature');
        return res.status(401).json({ error: 'Invalid signature' });
      }

      console.log('[Webhook] LITEAPI signature verified successfully');
    } else {
      console.log('[Webhook] LITEAPI signature verification disabled (development mode)');
    }

    const { event_type, data } = req.body;

    if (!event_type) {
      return res.status(400).json({ error: 'Missing event_type' });
    }

    console.log(`[Webhook] Received LITEAPI event: ${event_type}`);

    // Log the webhook
    const logEntry = await logWebhook('liteapi', event_type, data, false);

    try {
      // Forward to booking service for processing
      await forwardToBookingService('liteapi', event_type, data);

      // Update log as processed
      await logWebhook('liteapi', event_type, data, true);

      res.json({ success: true, received: true, logId: logEntry.id });
    } catch (error: unknown) {
      // Update log with error
      await logWebhook('liteapi', event_type, data, false, error.message);
      throw error;
    }
  } catch (error: unknown) {
    console.error('[Webhook] LITEAPI webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

/**
 * @swagger
 * /api/webhooks/logs:
 *   get:
 *     summary: Get webhook delivery logs
 *     tags: [Webhooks]
 *     parameters:
 *       - in: query
 *         name: source
 *         schema:
 *           type: string
 *           enum: [duffel, liteapi]
 *         description: Filter by webhook source
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 50
 *         description: Number of logs to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           default: 0
 *         description: Number of logs to skip
 *     responses:
 *       200:
 *         description: Webhook logs retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *       500:
 *         description: Server error
 */
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { source, limit = 50, offset = 0 } = req.query;

    // Build filter conditions
    const where: any = {};

    if (source) {
      // Map source to supplier
      const supplierMap: Record<string, string> = {
        duffel: 'duffel',
        liteapi: 'liteapi',
      };
      where.supplier = supplierMap[source as string] || source;
    }

    const [logs, total] = await Promise.all([
      prisma.webhook_event.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(offset),
        take: Number(limit),
      }),
      prisma.webhook_event.count({ where }),
    ]);

    // Transform logs to match our interface
    const transformedLogs = logs.map((log: any) => ({
      id: log.id,
      source: log.provider === 'duffel' ? 'duffel' : 'liteapi',
      eventType: log.eventType,
      payload: log.payload,
      processed: log.status === 'processed',
      processedAt: log.processedAt,
      error: log.metadata?.error,
      createdAt: log.createdAt,
    }));

    res.json({
      success: true,
      data: transformedLogs,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total,
      },
    });
  } catch (error: unknown) {
    console.error('[Webhook] Logs error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/webhooks/test:
 *   post:
 *     summary: Test webhook endpoint
 *     tags: [Webhooks]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               source:
 *                 type: string
 *                 default: duffel
 *               event_type:
 *                 type: string
 *               data:
 *                 type: object
 *     responses:
 *       200:
 *         description: Test webhook processed successfully
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
 */
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { source = 'duffel', event_type, data } = req.body;

    console.log(`[Webhook] Test webhook received: ${source} - ${event_type}`);

    // Log test webhook
    await logWebhook(source as 'duffel' | 'liteapi', event_type, data, true);

    res.json({
      success: true,
      message: `Test webhook processed: ${source} - ${event_type}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    console.error('[Webhook] Test error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/webhooks/status:
 *   get:
 *     summary: Get webhook configuration status
 *     tags: [Webhooks]
 *     responses:
 *       200:
 *         description: Webhook configuration status
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
 */
router.get('/status', async (req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: {
        duffel: {
          enabled: true,
          endpoint: '/api/webhooks/duffel',
          events: [
            'order.created',
            'order.updated',
            'order.cancelled',
            'flight_schedule_changed',
            'airline_initiated_change',
            'seat_map_updated',
            'order_change_completed',
          ],
        },
        liteapi: {
          enabled: true,
          endpoint: '/api/webhooks/liteapi',
          events: ['booking.confirmed', 'booking.cancelled', 'booking.modified', 'booking.pending'],
        },
        webhookSecret: WEBHOOK_SECRET ? '***configured***' : '***not configured***',
        bookingServiceUrl: BOOKING_SERVICE_URL,
      },
    });
  } catch (error: unknown) {
    console.error('[Webhook] Status error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/webhooks/retry/{logId}:
 *   post:
 *     summary: Retry a failed webhook delivery
 *     tags: [Webhooks]
 *     parameters:
 *       - in: path
 *         name: logId
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook log ID to retry
 *     responses:
 *       200:
 *         description: Retry successful
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
 *         description: Webhook log not found
 *       500:
 *         description: Server error
 */
router.post('/retry/:logId', async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;
    const logIdStr = Array.isArray(logId) ? logId[0] : logId;

    // Find the webhook log
    const log = await prisma.webhook_event.findUnique({
      where: { id: logIdStr },
    });

    if (!log) {
      return res.status(404).json({ success: false, error: 'Webhook log not found' });
    }

    // Retry forwarding to booking service
    await forwardToBookingService(log.provider, log.eventType, log.payload);

    // Update log
    await prisma.webhook_event.update({
      where: { id: logIdStr },
      data: {
        status: 'processed',
        processedAt: new Date(),
        metadata: {},
      },
    });

    res.json({
      success: true,
      message: `Retry successful for webhook ${logIdStr}`,
    });
  } catch (error: unknown) {
    console.error('[Webhook] Retry error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
