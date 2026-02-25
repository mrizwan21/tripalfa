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
 */

import { Router, Request, Response } from 'express';
import type { Router as ExpressRouter } from 'express';
import { prisma } from '@tripalfa/shared-database';
import crypto from 'crypto';

const router: ExpressRouter = Router();

// Environment Configuration
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'development_secret';
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3009';
const NODE_ENV = process.env.NODE_ENV || 'development';
const ENABLE_WEBHOOK_SIGNATURE_VERIFICATION = process.env.ENABLE_WEBHOOK_SIGNATURE_VERIFICATION === 'true' || NODE_ENV === 'production';

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
  if (!signature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', WEBHOOK_SECRET)
    .update(payload)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  );
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
    // Map source to supplier string
    const supplierMap: Record<string, string> = {
      'duffel': 'duffel',
      'liteapi': 'innstant'
    };

    const logEntry = await prisma.webhookEvent.create({
      data: {
        supplier: supplierMap[source] || source,
        eventType: eventType,
        raw_payload: payload,
        processed: processed,
        processedAt: processed ? new Date() : null,
        error: error || null,
      }
    });

    console.log(`[Webhook] ${source.toUpperCase()} - ${eventType}:`, {
      processed,
      error,
      timestamp: new Date().toISOString(),
      id: logEntry.id
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
      createdAt: new Date()
    };
  } catch (dbError: any) {
    // Fallback to console logging if database fails
    console.log(`[Webhook] ${source.toUpperCase()} - ${eventType}:`, {
      processed,
      error,
      timestamp: new Date().toISOString()
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
      createdAt: new Date()
    };
  }
}

/**
 * Send notification for webhook event
 */
async function sendNotification(type: string, data: any): Promise<void> {
  try {
    // Use global fetch
    await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type,
        data,
        timestamp: new Date().toISOString()
      })
    }).catch(() => { });
  } catch (error) {
    console.log('[Webhook] Notification service unavailable');
  }
}

/**
 * Send flight booking confirmation email
 * Based on Duffel best practices: https://duffel.com/docs/guides/handling-flight-booking-confirmation-emails
 */
async function sendFlightConfirmation(data: any): Promise<void> {
  try {
    const {
      order_id,
      status,
      passenger_name,
      origin,
      destination,
      total_amount,
      currency,
      customer_email,
      customer_name,
      flights,
      passengers
    } = data;

    // Build flight confirmation payload
    const confirmationPayload = {
      orderId: order_id,
      bookingReference: order_id,
      customerEmail: customer_email || data.email || 'customer@example.com',
      customerName: customer_name || passenger_name || 'Valued Customer',
      flights: flights || [{
        departure: {
          airportCode: origin?.code || origin || 'DEP',
          city: origin?.city || origin || 'Departure City',
          airport: origin?.airport || origin || 'Departure Airport',
          time: data.departure_time || new Date().toISOString(),
          terminal: origin?.terminal
        },
        arrival: {
          airportCode: destination?.code || destination || 'ARR',
          city: destination?.city || destination || 'Arrival City',
          airport: destination?.airport || destination || 'Arrival Airport',
          time: data.arrival_time || new Date().toISOString(),
          terminal: destination?.terminal
        },
        airline: data.airline || 'Airline',
        flightNumber: data.flight_number || '',
        cabinClass: data.cabin_class || 'Economy',
        duration: data.duration || '',
        flightId: data.flight_id || ''
      }],
      passengers: passengers || [{
        firstName: passenger_name?.first || passenger_name || 'Passenger',
        lastName: passenger_name?.last || '',
        passengerType: 'adult'
      }],
      totalAmount: total_amount || '0',
      currency: currency || 'USD',
      userId: data.userId
    };

    console.log(`[Webhook] Sending flight confirmation for order ${order_id}`);

    // Call the flight confirmation endpoint
    const response = await fetch(`${NOTIFICATION_SERVICE_URL}/notifications/flight/confirmation/webhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(confirmationPayload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[Webhook] Flight confirmation failed: ${response.status} - ${errorText}`);
      return;
    }

    const result = await response.json();
    console.log(`[Webhook] Flight confirmation sent: ${result.notificationId}`);
  } catch (error) {
    console.error('[Webhook] Flight confirmation error:', error instanceof Error ? error.message : 'Unknown error');
  }
}

// ============================================
// Duffel Webhook Handlers
// ============================================

/**
 * Handle order.created event
 * This triggers the flight booking confirmation email flow
 * Reference: https://duffel.com/docs/guides/handling-flight-booking-confirmation-emails
 */
async function handleOrderCreated(data: any): Promise<void> {
  const { order_id, status, passenger_name, origin, destination, total_amount, currency } = data;

  console.log(`[Webhook] New order created: ${order_id}`);

  // Find or create booking
  const existingBooking = await prisma.booking.findFirst({
    where: { bookingRef: order_id }
  });

  if (!existingBooking) {
    // Create new booking from webhook data
    await prisma.booking.create({
      data: {
        bookingRef: order_id,
        userId: "webhook-user",
        baseAmount: parseFloat(total_amount) || 0,
        taxAmount: 0,
        markupAmount: 0,
        serviceType: 'flight',
        status: 'confirmed',
        totalAmount: parseFloat(total_amount) || 0,
        currency: currency || 'USD',
        metadata: {
          source: 'duffel_webhook',
          event_type: 'order.created',
          passenger_name,
          origin,
          destination,
          raw_data: data
        }
      }
    });
  }

  // Send notification
  await sendNotification('duffel_order_created', { order_id, status });

  // Send flight booking confirmation email (Duffel best practice)
  // This is triggered on order creation to send confirmation to customer
  await sendFlightConfirmation(data);
}

/**
 * Handle order.updated event
 */
async function handleOrderUpdated(data: any): Promise<void> {
  const { order_id, status, changes } = data;

  console.log(`[Webhook] Order updated: ${order_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: order_id }
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: status === 'confirmed' ? 'confirmed' : booking.status,
        metadata: {
          ...(booking.metadata as object || {}),
          lastUpdated: new Date().toISOString(),
          duffel_updates: changes
        }
      }
    });
  }

  await sendNotification('duffel_order_updated', { order_id, status, changes });
}

/**
 * Handle order.cancelled event
 */
async function handleOrderCancelled(data: any): Promise<void> {
  const { order_id, refund_amount, refund_currency } = data;

  console.log(`[Webhook] Order cancelled: ${order_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: order_id }
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        metadata: {
          ...(booking.metadata as object || {}),
          cancelledAt: new Date().toISOString(),
          refund_amount,
          refund_currency,
          cancellation_source: 'duffel_webhook'
        }
      }
    });
  }

  await sendNotification('duffel_order_cancelled', {
    order_id,
    refund_amount,
    refund_currency
  });
}

/**
 * Handle flight_schedule_changed event
 */
async function handleFlightScheduleChanged(data: any): Promise<void> {
  const { order_id, flight_id, new_departure_time, new_arrival_time, reason } = data;

  console.log(`[Webhook] Flight schedule changed: ${order_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: order_id }
  });

  if (booking) {
    // Create modification record
    await prisma.bookingModification.create({
      data: {
        bookingId: booking.id,
        modificationType: 'schedule_change',
        oldValue: { description: 'Schedule changed by airline' },
        status: 'pending'
      }
    });

    // Update booking metadata
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        metadata: {
          ...(booking.metadata as object || {}),
          scheduleChange: {
            flight_id,
            new_departure_time,
            new_arrival_time,
            reason,
            changedAt: new Date().toISOString()
          }
        }
      }
    });
  }

  await sendNotification('duffel_schedule_changed', {
    order_id,
    flight_id,
    new_departure_time
  });
}

/**
 * Handle airline_initiated_change event
 */
async function handleAirlineInitiatedChange(data: any): Promise<void> {
  const { change_id, order_id, change_type, description, options } = data;

  console.log(`[Webhook] Airline initiated change: ${change_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: order_id }
  });

  if (booking) {
    await prisma.bookingModification.create({
      data: {
        bookingId: booking.id,
        modificationType: 'airline_initiated',
        oldValue: { description: description || 'Airline initiated change' },
        status: 'pending',
      }
    });
  }

  await sendNotification('duffel_airline_change', {
    change_id,
    order_id,
    change_type
  });
}

/**
 * Handle seat_map_updated event
 */
async function handleSeatMapUpdated(data: any): Promise<void> {
  const { offer_id, order_id, seat_map_version } = data;

  console.log(`[Webhook] Seat map updated: ${offer_id || order_id}`);

  // Could invalidate cached seat maps
  await sendNotification('duffel_seat_map_updated', { offer_id, order_id });
}

/**
 * Handle order_change_completed event
 */
async function handleOrderChangeCompleted(data: any): Promise<void> {
  const { order_id, change_id, new_order_id, price_difference } = data;

  console.log(`[Webhook] Order change completed: ${order_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: order_id }
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        bookingRef: new_order_id || order_id,
        metadata: {
          ...(booking.metadata as object || {}),
          changeCompleted: {
            change_id,
            new_order_id,
            price_difference,
            completedAt: new Date().toISOString()
          }
        }
      }
    });
  }

  await sendNotification('duffel_change_completed', {
    order_id,
    change_id,
    new_order_id
  });
}

// ============================================
// LITEAPI Webhook Handlers
// ============================================

/**
 * Handle booking.confirmed event
 */
async function handleBookingConfirmed(data: any): Promise<void> {
  const { booking_id, confirmation_number, guest_name, hotel_name, checkin, checkout } = data;

  console.log(`[Webhook] Booking confirmed: ${booking_id}`);

  // Find booking in database
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { bookingRef: booking_id },
        { bookingRef: confirmation_number }
      ]
    }
  });

  if (!booking) {
    // Create new hotel booking
    await prisma.booking.create({
      data: {
        bookingRef: booking_id,
        userId: "webhook-user",
        baseAmount: 0,
        taxAmount: 0,
        markupAmount: 0,
        serviceType: 'hotel',
        status: 'confirmed',
        totalAmount: 0,
        metadata: {
          source: 'liteapi_webhook',
          event_type: 'booking.confirmed',
          guest_name,
          hotel_name,
          checkin,
          checkout,
          raw_data: data
        }
      }
    });
  } else {
    // Update existing booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'confirmed',
        metadata: {
          ...(booking.metadata as object || {}),
          confirmedAt: new Date().toISOString(),
          guest_name,
          hotel_name
        }
      }
    });
  }

  await sendNotification('liteapi_booking_confirmed', {
    booking_id,
    confirmation_number
  });
}

/**
 * Handle booking.cancelled event
 */
async function handleBookingCancelled(data: any): Promise<void> {
  const { booking_id, cancellation_id, refund_amount, currency } = data;

  console.log(`[Webhook] Booking cancelled: ${booking_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: booking_id }
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'cancelled',
        metadata: {
          ...(booking.metadata as object || {}),
          cancelledAt: new Date().toISOString(),
          cancellation_id,
          refund_amount,
          currency,
          cancellation_source: 'liteapi_webhook'
        }
      }
    });
  }

  await sendNotification('liteapi_booking_cancelled', {
    booking_id,
    cancellation_id,
    refund_amount
  });
}

/**
 * Handle booking.modified event
 */
async function handleBookingModified(data: any): Promise<void> {
  const { booking_id, modification_id, changes } = data;

  console.log(`[Webhook] Booking modified: ${booking_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: booking_id }
  });

  if (booking) {
    // Create modification record
    await prisma.bookingModification.create({
      data: {
        bookingId: booking.id,
        modificationType: 'hotel_modification',
        oldValue: { description: 'Hotel booking modified' },
        status: 'completed',
        newValue: { requestedChanges: changes },
        processedAt: new Date()
      }
    });

    // Update booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        metadata: {
          ...(booking.metadata as object || {}),
          modification_id,
          lastModified: new Date().toISOString(),
          changes
        }
      }
    });
  }

  await sendNotification('liteapi_booking_modified', {
    booking_id,
    modification_id
  });
}

/**
 * Handle booking.pending event
 */
async function handleBookingPending(data: any): Promise<void> {
  const { booking_id, status } = data;

  console.log(`[Webhook] Booking pending: ${booking_id}`);

  const booking = await prisma.booking.findFirst({
    where: { bookingRef: booking_id }
  });

  if (booking) {
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status: 'pending',
        metadata: {
          ...(booking.metadata as object || {}),
          pendingAt: new Date().toISOString(),
          pending_reason: data.reason
        }
      }
    });
  }
}

// ============================================
// API Routes
// ============================================

// POST /api/webhooks/duffel - Duffel webhook receiver
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
    await logWebhook('duffel', type, data, false);

    // Process based on event type
    switch (type) {
      case 'order.created':
        await handleOrderCreated(data);
        break;
      case 'order.updated':
        await handleOrderUpdated(data);
        break;
      case 'order.cancelled':
        await handleOrderCancelled(data);
        break;
      case 'flight_schedule_changed':
        await handleFlightScheduleChanged(data);
        break;
      case 'airline_initiated_change':
        await handleAirlineInitiatedChange(data);
        break;
      case 'seat_map_updated':
        await handleSeatMapUpdated(data);
        break;
      case 'order_change_completed':
        await handleOrderChangeCompleted(data);
        break;
      default:
        console.log(`[Webhook] Unhandled Duffel event type: ${type}`);
    }

    // Update log as processed
    await logWebhook('duffel', type, data, true);

    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('[Webhook] Duffel webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// POST /api/webhooks/liteapi - LITEAPI webhook receiver
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
    await logWebhook('liteapi', event_type, data, false);

    // Process based on event type
    switch (event_type) {
      case 'booking.confirmed':
        await handleBookingConfirmed(data);
        break;
      case 'booking.cancelled':
        await handleBookingCancelled(data);
        break;
      case 'booking.modified':
        await handleBookingModified(data);
        break;
      case 'booking.pending':
        await handleBookingPending(data);
        break;
      default:
        console.log(`[Webhook] Unhandled LITEAPI event type: ${event_type}`);
    }

    // Update log as processed
    await logWebhook('liteapi', event_type, data, true);

    res.json({ success: true, received: true });
  } catch (error: any) {
    console.error('[Webhook] LITEAPI webhook error:', error.message);
    res.status(500).json({ error: 'Webhook processing failed' });
  }
});

// GET /api/webhooks/logs - Get webhook delivery logs
router.get('/logs', async (req: Request, res: Response) => {
  try {
    const { source, limit = 50, offset = 0 } = req.query;

    // Build filter conditions
    const where: any = {};

    if (source) {
      // Map source to supplier
      const supplierMap: Record<string, string> = {
        'duffel': 'duffel',
        'liteapi': 'innstant'
      };
      where.supplier = supplierMap[source as string] || source;
    }

    const [logs, total] = await Promise.all([
      prisma.webhookEvent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: Number(offset),
        take: Number(limit),
      }),
      prisma.webhookEvent.count({ where })
    ]);

    // Transform logs to match our interface
    const transformedLogs = logs.map(log => ({
      id: log.id,
      source: log.supplier === 'duffel' ? 'duffel' : 'liteapi',
      eventType: log.eventType,
      payload: log.raw_payload,
      processed: log.processed,
      processedAt: log.processedAt,
      error: log.error,
      createdAt: log.createdAt
    }));

    res.json({
      success: true,
      data: transformedLogs,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
        total
      }
    });
  } catch (error: any) {
    console.error('[Webhook] Logs error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/webhooks/test - Test webhook endpoint
router.post('/test', async (req: Request, res: Response) => {
  try {
    const { source = 'duffel', event_type, data } = req.body;

    console.log(`[Webhook] Test webhook received: ${source} - ${event_type}`);

    // Process test webhook
    if (source === 'duffel') {
      switch (event_type) {
        case 'order.created':
          await handleOrderCreated(data || { order_id: 'test_order_123', status: 'confirmed' });
          break;
        case 'order.cancelled':
          await handleOrderCancelled(data || { order_id: 'test_order_123' });
          break;
        case 'flight_schedule_changed':
          await handleFlightScheduleChanged(data || { order_id: 'test_order_123' });
          break;
      }
    } else if (source === 'liteapi') {
      switch (event_type) {
        case 'booking.confirmed':
          await handleBookingConfirmed(data || { booking_id: 'test_booking_123' });
          break;
        case 'booking.cancelled':
          await handleBookingCancelled(data || { booking_id: 'test_booking_123' });
          break;
      }
    }

    res.json({
      success: true,
      message: `Test webhook processed: ${source} - ${event_type}`,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    console.error('[Webhook] Test error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/webhooks/status - Get webhook configuration status
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
            'order_change_completed'
          ]
        },
        liteapi: {
          enabled: true,
          endpoint: '/api/webhooks/liteapi',
          events: [
            'booking.confirmed',
            'booking.cancelled',
            'booking.modified',
            'booking.pending'
          ]
        },
        webhookSecret: WEBHOOK_SECRET ? '***configured***' : '***not configured***'
      }
    });
  } catch (error: any) {
    console.error('[Webhook] Status error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

// POST /api/webhooks/retry/:logId - Retry a failed webhook
router.post('/retry/:logId', async (req: Request, res: Response) => {
  try {
    const { logId } = req.params;

    // In production, this would retrieve the failed webhook from database
    // and retry processing it

    res.json({
      success: true,
      message: `Retry initiated for webhook ${logId}`,
      note: 'Requires webhook_events table implementation'
    });
  } catch (error: any) {
    console.error('[Webhook] Retry error:', error.message);
    res.status(500).json({ success: false, error: error.message });
  }
});

export default router;
