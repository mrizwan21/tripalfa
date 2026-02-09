/**
 * Webhook Controller
 * Handles incoming webhooks from external suppliers (Duffel)
 * Routes events through the centralized notification management system
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import {
  processDuffelWebhook,
  mapDuffelEventToNotification,
  extractCustomerIdFromWebhookEvent,
  DuffelWebhookPayload,
} from '../integrations/duffelWebhookHandler';
import { sendBookingConfirmationEmail } from '../integrations/bookingConfirmationHandler';

/**
 * Handles Duffel webhook events
 * Validates signature, processes event, and sends customer notification
 */
export async function handleDuffelWebhook(req: Request, res: Response): Promise<Response> {
  try {
    const webhookSecret = process.env.DUFFEL_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      logger.error('DUFFEL_WEBHOOK_SECRET not configured');
      return res.status(500).json({
        success: false,
        error: 'Webhook secret not configured',
      });
    }

    // Process and validate webhook
    const { valid, event, error } = await processDuffelWebhook(req, webhookSecret);

    if (!valid || !event) {
      logger.warn(`Invalid webhook attempt: ${error}`);
      // Always return 200 to prevent Duffel from retrying, but log the error
      return res.status(200).json({ success: true, message: 'Webhook received' });
    }

    // Extract customer ID from event
    const customerId = extractCustomerIdFromWebhookEvent(event);

    if (!customerId) {
      logger.warn(`Could not extract customer ID from webhook: ${event.id}`);
      // Return success even if we can't process - prevent duplicate retries
      return res.status(200).json({
        success: true,
        message: 'Webhook received but customer ID could not be determined',
      });
    }

    // Map Duffel event to notification
    const notification = mapDuffelEventToNotification(event, customerId);

    if (!notification) {
      logger.warn(`Could not map webhook to notification: ${event.type}`);
      return res.status(200).json({
        success: true,
        message: 'Webhook received but could not be mapped to notification',
      });
    }

    // TODO: Send notification through notification service
    // For now, just log the notification that would be sent
    logger.info(`Webhook processed - notification would be sent:`, {
      webhookId: event.id,
      notificationType: notification.type,
      customerId,
      title: notification.title,
      priority: notification.priority,
    });

    // Send booking confirmation email for order.created events
    if (event.type === 'order.created') {
      try {
        const emailResult = await sendBookingConfirmationEmail(event.data.object);
        if (emailResult.success) {
          logger.info(`Booking confirmation email sent for order ${event.data.object.id}`, {
            messageId: emailResult.messageId,
          });
        } else {
          logger.warn(`Failed to send booking confirmation email for order ${event.data.object.id}`, {
            error: emailResult.error,
          });
        }
      } catch (emailError) {
        logger.error('Error sending booking confirmation email', {
          error: emailError instanceof Error ? emailError.message : String(emailError),
          orderId: event.data.object.id,
        });
        // Don't fail the webhook processing if email fails
      }
    }

    // Track webhook processing
    await trackWebhookProcessing({
      webhookId: event.id,
      webhookType: event.type,
      customerId,
      notificationId: notification.id,
      status: 'logged', // Status when notification is just logged
      liveMode: event.live_mode,
      idempotencyKey: event.idempotency_key,
    });

    return res.status(200).json({
      success: true,
      data: {
        webhookId: event.id,
        notificationId: notification.id,
        notificationStatus: 'logged',
      },
      message: 'Webhook processed and notification logged',
    });
  } catch (error) {
    logger.error('Error handling Duffel webhook:', error);
    // Return 200 anyway to prevent Duffel retries
    return res.status(200).json({
      success: false,
      error: 'Internal processing error',
    });
  }
}

/**
 * Health check endpoint for webhooks
 */
export async function webhookHealthCheck(req: Request, res: Response): Promise<Response> {
  try {
    const webhookStats = await getWebhookStats();

    return res.status(200).json({
      success: true,
      data: {
        webhook_receiver: 'operational',
        last_webhook_received: webhookStats.lastWebhookTime,
        total_webhooks_processed: webhookStats.totalProcessed,
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error) {
    logger.error('Error checking webhook health:', error);
    return res.status(500).json({
      success: false,
      error: 'Health check failed',
    });
  }
}

/**
 * Tracks webhook processing in database/cache
 */
async function trackWebhookProcessing(data: {
  webhookId: string;
  webhookType: string;
  customerId: string;
  notificationId: string;
  status: string;
  liveMode: boolean;
  idempotencyKey: string;
}): Promise<void> {
  try {
    // Log to database for audit trail
    logger.info('Webhook tracking:', {
      webhook_id: data.webhookId,
      webhook_type: data.webhookType,
      customer_id: data.customerId,
      notification_id: data.notificationId,
      status: data.status,
      live_mode: data.liveMode,
      idempotency_key: data.idempotencyKey,
      processed_at: new Date().toISOString(),
    });

    // TODO: Persist to database if needed
    // const db = getDatabase();
    // await db.webhookLogs.create({...data});
  } catch (error) {
    logger.error('Error tracking webhook:', error);
  }
}

/**
 * Gets webhook statistics
 */
async function getWebhookStats(): Promise<{
  lastWebhookTime: string | null;
  totalProcessed: number;
}> {
  try {
    // TODO: Retrieve from database if tracking is implemented
    return {
      lastWebhookTime: new Date().toISOString(),
      totalProcessed: 0,
    };
  } catch (error) {
    logger.error('Error getting webhook stats:', error);
    return {
      lastWebhookTime: null,
      totalProcessed: 0,
    };
  }
}

/**
 * Test webhook endpoint (for development/testing)
 */
export async function testWebhookHandler(req: Request, res: Response): Promise<Response> {
  try {
    logger.info('Test webhook received', req.body);

    return res.status(200).json({
      success: true,
      message: 'Test webhook received successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Error handling test webhook:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process test webhook',
    });
  }
}
