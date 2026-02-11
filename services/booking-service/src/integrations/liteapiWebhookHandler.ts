/**
 * LiteAPI Webhook Handler
 * Processes incoming webhooks from LiteAPI (hotel booking provider)
 * Handles signature validation, event parsing, and customer notifications
 */

import crypto from 'crypto';
import { Request } from 'express';
import logger from '../utils/logger';

// Define Notification interface locally since notifications are handled by notification service
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  metadata?: Record<string, any>;
}

export interface LiteAPIWebhookPayload {
  id: string;
  bookingId: string;
  status: 'confirmed' | 'voucher_issued' | 'cancelled' | 'failed' | string;
  type?: string;
  hotelName?: string;
  checkIn?: string;
  checkOut?: string;
  totalPrice?: number;
  currency?: string;
  nights?: number;
  guests?: number;
  roomType?: string;
  custom_metadata?: {
    customer_id?: string;
  };
  error?: {
    code?: string;
    message?: string;
  };
  timestamp?: string;
  idempotency_key?: string;
  live_mode?: boolean;
  [key: string]: any;
}

export interface WebhookEvent {
  eventType: string;
  bookingId: string;
  customerId: string;
  eventData: Record<string, any>;
  timestamp: string;
}

/**
 * Validates LiteAPI webhook signature
 * Ensures the webhook came from LiteAPI and not a malicious actor
 * LiteAPI typically uses HMAC-SHA256 with X-API-Signature header
 */
export function validateLiteAPIWebhookSignature(
  rawPayload: Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // LiteAPI signature format: compute HMAC-SHA256 of payload with webhook secret
    const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
    const computedSignature = crypto
      .createHmac('sha256', secretBuffer)
      .update(rawPayload)
      .digest('hex')
      .toLowerCase();

    // Use secure comparison to prevent timing attacks
    const providedSignature = signature.toLowerCase();
    return crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(computedSignature));
  } catch (error) {
    logger.error('Webhook signature validation error:', error);
    return false;
  }
}

/**
 * Maps LiteAPI webhook events to customer notifications
 * Converts hotel booking events into user-friendly notification messages
 */
export function mapLiteAPIEventToNotification(
  webhook: LiteAPIWebhookPayload,
  customerId: string
): Notification | null {
  const baseNotification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: customerId,
    title: '',
    message: '',
    type: `liteapi_booking_${webhook.status}`,
    priority: 'medium',
    channels: ['in_app', 'email'],
    metadata: {
      webhookId: webhook.id,
      webhookType: webhook.status,
      sourceSystem: 'liteapi',
      bookingId: webhook.bookingId,
      idempotencyKey: webhook.idempotency_key,
      liveMode: webhook.live_mode ?? true,
      timestamp: webhook.timestamp || new Date().toISOString(),
    },
  };

  switch (webhook.status) {
    case 'confirmed':
      baseNotification.title = '🏨 Hotel Booking Confirmed';
      baseNotification.message = `Your hotel booking for ${webhook.hotelName} (Booking ${webhook.bookingId}) has been confirmed.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['in_app', 'email'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        hotelDetails: {
          name: webhook.hotelName,
          checkIn: webhook.checkIn,
          checkOut: webhook.checkOut,
          nights: webhook.nights,
          guests: webhook.guests,
          roomType: webhook.roomType,
          totalPrice: webhook.totalPrice,
          currency: webhook.currency,
        },
        requiresAction: false,
      };
      return baseNotification;

    case 'voucher_issued':
      baseNotification.title = '✅ Voucher Issued - Ready to Check In';
      baseNotification.message = `Your voucher for ${webhook.hotelName} is ready. Check in on ${webhook.checkIn}.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['in_app', 'email'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        hotelDetails: {
          name: webhook.hotelName,
          checkIn: webhook.checkIn,
          checkOut: webhook.checkOut,
          roomType: webhook.roomType,
        },
        requiresAction: false,
        voucherAvailable: true,
      };
      return baseNotification;

    case 'cancelled':
      baseNotification.title = '❌ Booking Cancelled';
      baseNotification.message = `Your booking for ${webhook.hotelName} (Booking ${webhook.bookingId}) has been cancelled.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['in_app', 'email', 'sms'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        hotelDetails: {
          name: webhook.hotelName,
          bookingId: webhook.bookingId,
        },
        requiresAction: false,
        cancelled: true,
      };
      return baseNotification;

    case 'failed':
      baseNotification.title = '⚠️ Booking Failed';
      baseNotification.message = `Your booking for ${webhook.hotelName} could not be completed. Error: ${webhook.error?.message || 'Unknown error'}`;
      baseNotification.priority = 'urgent';
      baseNotification.channels = ['in_app', 'email', 'sms'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        hotelDetails: {
          name: webhook.hotelName,
          bookingId: webhook.bookingId,
        },
        error: {
          code: webhook.error?.code,
          message: webhook.error?.message,
        },
        requiresAction: true,
        actionType: 'contact_support',
      };
      return baseNotification;

    default:
      logger.warn(`Unhandled LiteAPI webhook status: ${webhook.status}`);
      baseNotification.title = 'Hotel Booking Update';
      baseNotification.message = `Your booking for ${webhook.hotelName || 'your hotel'} has been updated. Status: ${webhook.status}`;
      baseNotification.metadata = {
        ...baseNotification.metadata,
        status: webhook.status,
      };
      return baseNotification;
  }
}

/**
 * Extracts customer ID from LiteAPI webhook event data
 */
export function extractCustomerIdFromLiteAPIWebhookEvent(
  webhookData: LiteAPIWebhookPayload
): string | null {
  try {
    // Try to extract from custom_metadata
    if (webhookData.custom_metadata?.customer_id) {
      return webhookData.custom_metadata.customer_id;
    }

    logger.info(`Could not extract customer_id from LiteAPI webhook event: ${webhookData.id}`);
    return null;
  } catch (error) {
    logger.error('Error extracting customer ID from LiteAPI webhook:', error);
    return null;
  }
}

/**
 * Processes incoming LiteAPI webhook
 * Validates signature, extracts data, and returns structured event
 */
export async function processLiteAPIWebhook(
  req: Request,
  webhookSecret: string
): Promise<{ valid: boolean; event?: LiteAPIWebhookPayload; error?: string }> {
  try {
    // Validate signature - LiteAPI uses X-API-Signature header
    const signature = req.headers['x-api-signature'] as string;
    if (!signature) {
      return { valid: false, error: 'Missing X-API-Signature header' };
    }

    const rawPayload = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    const isValid = validateLiteAPIWebhookSignature(rawPayload, signature, webhookSecret);

    if (!isValid) {
      return { valid: false, error: 'Invalid webhook signature' };
    }

    // Parse event
    const event = req.body as LiteAPIWebhookPayload;

    if (!event.bookingId || !event.status) {
      return { valid: false, error: 'Invalid webhook payload structure - missing bookingId or status' };
    }

    logger.info(`Valid LiteAPI webhook received: ${event.status} for booking ${event.bookingId}`);
    return { valid: true, event };
  } catch (error) {
    logger.error('Error processing LiteAPI webhook:', error);
    return { valid: false, error: String(error) };
  }
}
