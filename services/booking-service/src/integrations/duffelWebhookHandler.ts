/**
 * Duffel Webhook Handler
 * Processes incoming webhooks from Duffel and routes them to the notification system
 * Handles signature validation, event parsing, and customer notifications
 */

import crypto from 'crypto';
import { Request, Response } from 'express';
import logger from '../utils/logger';
import { sendBookingConfirmationEmail } from './bookingConfirmationHandler';

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

export interface DuffelWebhookPayload {
  id: string;
  type: string;
  live_mode: boolean;
  created_at: string;
  idempotency_key: string;
  data: {
    object: Record<string, any>;
  };
}

export interface WebhookEvent {
  eventType: string;
  orderId: string;
  customerId: string;
  eventData: Record<string, any>;
  timestamp: string;
}

/**
 * Validates Duffel webhook signature
 * Ensures the webhook came from Duffel and not a malicious actor
 */
export function validateDuffelWebhookSignature(
  rawPayload: Buffer,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    // Format: t=1616202842,v1=8aebaa7ecaf36950721e4321b6a56d7493d13e73814de672ac5ce4ddd7435054
    const pairs = signature.split(',').map((pair) => {
      const [key, value] = pair.split('=');
      return { key, value };
    });

    const timestampPair = pairs.find((p) => p.key === 't');
    const signaturePair = pairs.find((p) => p.key === 'v1');

    if (!timestampPair || !signaturePair) {
      logger.warn('Invalid webhook signature format');
      return false;
    }

    const timestamp = timestampPair.value;
    const providedSignature = signaturePair.value;

    // Recreate the signature using the webhook secret
    const signedPayload = timestamp + '.' + rawPayload.toString('utf-8');
    const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
    const computedSignature = crypto
      .createHmac('sha256', secretBuffer)
      .update(signedPayload)
      .digest('hex')
      .toLowerCase();

    // Use secure comparison to prevent timing attacks
    return crypto.timingSafeEqual(Buffer.from(providedSignature), Buffer.from(computedSignature));
  } catch (error) {
    logger.error('Webhook signature validation error:', error);
    return false;
  }
}

/**
 * Maps Duffel webhook events to customer notifications
 * Converts supplier events into user-friendly notification messages
 */
export function mapDuffelEventToNotification(
  webhook: DuffelWebhookPayload,
  customerId: string
): Notification | null {
  const baseNotification: Notification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    userId: customerId,
    title: '',
    message: '',
    type: `duffel_${webhook.type}`,
    priority: 'medium',
    channels: ['in_app', 'email'],
    metadata: {
      webhookId: webhook.id,
      webhookType: webhook.type,
      sourceSystem: 'duffel',
      idempotencyKey: webhook.idempotency_key,
      liveMode: webhook.live_mode,
    },
  };

  const eventData = webhook.data.object;

  switch (webhook.type) {
    case 'order.created':
      baseNotification.title = 'Booking Confirmed ✈️';
      baseNotification.message = `Your flight booking (Order ${eventData.id}) has been successfully created.`;
      baseNotification.priority = 'high';
      baseNotification.metadata = {
        ...baseNotification.metadata,
        orderId: eventData.id,
        orderDetails: {
          total: eventData.total_amount,
          currency: eventData.total_currency,
          passengers: eventData.passengers?.length || 0,
        },
      };
      return baseNotification;

    case 'order.updated':
      baseNotification.title = 'Booking Updated';
      baseNotification.message = `Your booking (Order ${eventData.id}) has been updated.`;
      baseNotification.priority = 'medium';
      baseNotification.metadata = {
        ...baseNotification.metadata,
        orderId: eventData.id,
        updatedAt: eventData.updated_at,
      };
      return baseNotification;

    case 'order.airline_initiated_change_detected':
      baseNotification.title = '⚠️ Flight Schedule Change Detected';
      baseNotification.message = `The airline has initiated a schedule change for your booking (Order ${eventData.id}). Please review the changes.`;
      baseNotification.priority = 'urgent';
      baseNotification.channels = ['in_app', 'email', 'sms'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        orderId: eventData.id,
        requiresAction: true,
        actionType: 'review_schedule_change',
      };
      return baseNotification;

    case 'order_change_request.created':
      baseNotification.title = 'Change Request Created';
      baseNotification.message = `A change request has been created for your booking. Check available options.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['in_app', 'email'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        changeRequestId: eventData.id,
        orderId: eventData.order_id,
        requiresAction: true,
        actionType: 'review_change_options',
      };
      return baseNotification;

    case 'order_change_request.expires_soon':
      baseNotification.title = '⏰ Change Request Expiring Soon';
      baseNotification.message = `Your change request expires soon. Make a selection to avoid expiration.`;
      baseNotification.priority = 'urgent';
      baseNotification.channels = ['in_app', 'email', 'sms'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        changeRequestId: eventData.id,
        orderId: eventData.order_id,
        expiresAt: eventData.expires_at,
        requiresAction: true,
        actionType: 'select_change_option',
      };
      return baseNotification;

    case 'order_change.confirmed':
      baseNotification.title = '✅ Booking Change Confirmed';
      baseNotification.message = `Your booking change has been confirmed. New itinerary details are available.`;
      baseNotification.priority = 'high';
      baseNotification.metadata = {
        ...baseNotification.metadata,
        orderChangeId: eventData.id,
        orderId: eventData.order_id,
        newSlices: eventData.slices,
      };
      return baseNotification;

    case 'order_change.rejected':
      baseNotification.title = '❌ Booking Change Rejected';
      baseNotification.message = `Your booking change could not be completed. Contact support for assistance.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['in_app', 'email', 'sms'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        orderChangeId: eventData.id,
        orderId: eventData.order_id,
        requiresAction: true,
        actionType: 'contact_support',
      };
      return baseNotification;

    case 'ping.triggered':
      // Test event - minimal notification
      baseNotification.title = 'Test Notification';
      baseNotification.message = 'This is a test webhook from Duffel.';
      baseNotification.priority = 'low';
      baseNotification.channels = ['in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        isTestEvent: true,
      };
      return baseNotification;

    default:
      logger.warn(`Unhandled webhook event type: ${webhook.type}`);
      baseNotification.title = 'Booking Update';
      baseNotification.message = `Your booking has a new update. Event type: ${webhook.type}`;
      baseNotification.metadata = {
        ...baseNotification.metadata,
        eventData,
      };
      return baseNotification;
  }
}

/**
 * Extracts customer ID from Duffel webhook event data
 */
export function extractCustomerIdFromWebhookEvent(webhookData: DuffelWebhookPayload): string | null {
  try {
    const eventData = webhookData.data.object;

    // Try to extract from order-related events
    if (eventData.custom_metadata?.customer_id) {
      return eventData.custom_metadata.customer_id;
    }

    // Try to extract from order ID if it contains customer reference
    if (eventData.id) {
      // Parse from order ID structure if available
      logger.info(`Could not extract customer_id from webhook event: ${webhookData.id}`);
      return null;
    }

    return null;
  } catch (error) {
    logger.error('Error extracting customer ID from webhook:', error);
    return null;
  }
}

/**
 * Processes incoming Duffel webhook
 * Validates signature, extracts data, and returns structured event
 */
export async function processDuffelWebhook(
  req: Request,
  webhookSecret: string
): Promise<{ valid: boolean; event?: DuffelWebhookPayload; error?: string }> {
  try {
    // Validate signature
    const signature = req.headers['x-duffel-signature'] as string;
    if (!signature) {
      return { valid: false, error: 'Missing X-Duffel-Signature header' };
    }

    const rawPayload = (req as any).rawBody || Buffer.from(JSON.stringify(req.body));
    const isValid = validateDuffelWebhookSignature(rawPayload, signature, webhookSecret);

    if (!isValid) {
      return { valid: false, error: 'Invalid webhook signature' };
    }

    // Parse event
    const event = req.body as DuffelWebhookPayload;

    if (!event.type || !event.id) {
      return { valid: false, error: 'Invalid webhook payload structure' };
    }

    logger.info(`Valid Duffel webhook received: ${event.type} (${event.id})`);
    return { valid: true, event };
  } catch (error) {
    logger.error('Error processing Duffel webhook:', error);
    return { valid: false, error: String(error) };
  }
}
