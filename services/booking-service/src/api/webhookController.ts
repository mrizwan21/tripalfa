/**
 * Webhook Controller
 * Handles incoming webhooks from external suppliers (Duffel, LiteAPI)
 * Routes events through the centralized notification management system
 */

import { Request, Response } from 'express';
import logger from '../utils/logger';
import { CacheService } from '../cache/redis';
import { NotificationService } from '../services/notificationService';
import {
  processDuffelWebhook,
  mapDuffelEventToNotification,
  extractCustomerIdFromWebhookEvent,
  DuffelWebhookPayload,
} from '../integrations/duffelWebhookHandler';
import {
  processLiteAPIWebhook,
  mapLiteAPIEventToNotification,
  extractCustomerIdFromLiteAPIWebhookEvent,
  LiteAPIWebhookPayload,
} from '../integrations/liteapiWebhookHandler';
import { processAPIManagerEvent, APIManagerEvent } from '../integrations/apiManagerHandler';
import { processSupplierOnboardingEvent, SupplierOnboardingEvent } from '../integrations/supplierOnboardingHandler';
import { processCustomerOnboardingEvent, CustomerOnboardingEvent } from '../integrations/customerOnboardingHandler';
import { sendBookingConfirmationEmail } from '../integrations/bookingConfirmationHandler';

// Initialize services
const cache = new CacheService();
const notificationService = new NotificationService(cache);

// Idempotency tracking for webhooks (cache key -> webhook ID)
const processedWebhooks = new Set<string>();

/**
 * Handles Duffel webhook events
 * Validates signature, processes event, and sends customer notification
 */
export async function handleDuffelWebhook(req: Request, res: Response): Promise<Response> {
  try {
    const webhookSecret = process.env.DUFFEL_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      logger.warn('DUFFEL_WEBHOOK_SECRET not configured - webhooks cannot be validated');
      // Return 200 to prevent Duffel from retrying, but don't process
      return res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    }

    // Process and validate webhook
    const { valid, event, error } = await processDuffelWebhook(req, webhookSecret);

    if (!valid || !event) {
      logger.warn(`Invalid webhook attempt: ${error}`);
      // Always return 200 to prevent Duffel from retrying
      return res.status(200).json({ success: true, message: 'Webhook received' });
    }

    // Idempotency check - prevent duplicate processing using event ID or idempotency key
    const idempotencyKey = event.idempotency_key || event.id;
    const cacheKey = `webhook_processed:duffel:${idempotencyKey}`;
    
    const isAlreadyProcessed = await cache.get(cacheKey);
    if (isAlreadyProcessed) {
      logger.info(`Webhook already processed (idempotency): ${event.id}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook already processed',
        webhookId: event.id 
      });
    }

    // Extract customer ID from event
    const customerId = extractCustomerIdFromWebhookEvent(event);

    if (!customerId) {
      logger.warn(`Could not extract customer ID from webhook: ${event.id}`);
      // Cache as processed and return success
      await cache.set(cacheKey, 'processed', 86400); // 24 hour TTL
      return res.status(200).json({
        success: true,
        message: 'Webhook received but customer ID could not be determined',
      });
    }

    // Map Duffel event to notification
    const notification = mapDuffelEventToNotification(event, customerId);

    if (!notification) {
      logger.warn(`Could not map webhook to notification: ${event.type}`);
      // Cache as processed
      await cache.set(cacheKey, 'processed', 86400);
      return res.status(200).json({
        success: true,
        message: 'Webhook received but could not be mapped to notification',
      });
    }

    // Dispatch notification through NotificationService
    let notificationResult = null;
    try {
      notificationResult = await notificationService.sendNotification(notification as any);
      logger.info(`Notification dispatched:`, {
        webhookId: event.id,
        notificationId: (notificationResult as any).id,
        notificationStatus: (notificationResult as any).status,
        customerId,
        channels: (notificationResult as any).channels,
      });
    } catch (notificationError) {
      logger.error('Error dispatching notification:', notificationError);
      // Notification dispatch failure is not critical - continue processing
      notificationResult = {
        id: `notif_fallback_${Date.now()}`,
        status: 'failed',
        message: 'Notification dispatch failed',
      } as any;
    }

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
      }
    }

    // Mark webhook as processed in idempotency cache
    await cache.set(cacheKey, 'processed', 86400); // 24 hour TTL

    // Track webhook processing
    await trackWebhookProcessing({
      webhookId: event.id,
      webhookType: event.type,
      customerId,
      notificationId: notificationResult?.id || 'unknown',
      status: notificationResult?.status || 'processed',
      liveMode: event.live_mode,
      idempotencyKey: event.idempotency_key,
    });

    return res.status(200).json({
      success: true,
      data: {
        webhookId: event.id,
        notificationId: notificationResult?.id,
        notificationStatus: notificationResult?.status,
      },
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Error handling Duffel webhook:', error);
    // Return 200 anyway to prevent Duffel retries
    return res.status(200).json({
      success: true,
      message: 'Webhook received',
    });
  }
}

/**
 * Handles LiteAPI webhook events
 * Validates signature, processes event, and sends customer notification
 */
export async function handleLiteAPIWebhook(req: Request, res: Response): Promise<Response> {
  try {
    const webhookSecret = process.env.LITEAPI_WEBHOOK_SECRET || '';

    if (!webhookSecret) {
      logger.warn('LITEAPI_WEBHOOK_SECRET not configured - webhooks cannot be validated');
      // Return 200 to prevent LiteAPI from retrying
      return res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    }

    // Process and validate webhook
    const { valid, event, error } = await processLiteAPIWebhook(req, webhookSecret);

    if (!valid || !event) {
      logger.warn(`Invalid LiteAPI webhook attempt: ${error}`);
      // Always return 200 to prevent LiteAPI from retrying
      return res.status(200).json({ success: true, message: 'Webhook received' });
    }

    // Idempotency check - prevent duplicate processing using event ID or idempotency key
    const idempotencyKey = event.idempotency_key || event.id;
    const cacheKey = `webhook_processed:liteapi:${idempotencyKey}`;
    
    const isAlreadyProcessed = await cache.get(cacheKey);
    if (isAlreadyProcessed) {
      logger.info(`LiteAPI webhook already processed (idempotency): ${event.id}`);
      return res.status(200).json({ 
        success: true, 
        message: 'Webhook already processed',
        webhookId: event.id 
      });
    }

    // Extract customer ID from event
    const customerId = extractCustomerIdFromLiteAPIWebhookEvent(event);

    if (!customerId) {
      logger.warn(`Could not extract customer ID from LiteAPI webhook: ${event.id}`);
      // Cache as processed
      await cache.set(cacheKey, 'processed', 86400);
      return res.status(200).json({
        success: true,
        message: 'Webhook received but customer ID could not be determined',
      });
    }

    // Map LiteAPI event to notification
    const notification = mapLiteAPIEventToNotification(event, customerId);

    if (!notification) {
      logger.warn(`Could not map LiteAPI webhook to notification: ${event.status}`);
      // Cache as processed
      await cache.set(cacheKey, 'processed', 86400);
      return res.status(200).json({
        success: true,
        message: 'Webhook received but could not be mapped to notification',
      });
    }

    // Dispatch notification through NotificationService
    let notificationResult = null;
    try {
      notificationResult = await notificationService.sendNotification(notification as any);
      logger.info(`LiteAPI notification dispatched:`, {
        webhookId: event.id,
        notificationId: (notificationResult as any).id,
        notificationStatus: (notificationResult as any).status,
        customerId,
        bookingId: event.bookingId,
        channels: (notificationResult as any).channels,
      });
    } catch (notificationError) {
      logger.error('Error dispatching LiteAPI notification:', notificationError);
      notificationResult = {
        id: `notif_fallback_${Date.now()}`,
        status: 'failed',
        message: 'Notification dispatch failed',
      } as any;
    }

    // Mark webhook as processed in idempotency cache
    await cache.set(cacheKey, 'processed', 86400); // 24 hour TTL

    // Track webhook processing
    await trackWebhookProcessing({
      webhookId: event.id,
      webhookType: event.status,
      customerId,
      notificationId: (notificationResult as any)?.id || 'unknown',
      status: notificationResult?.status || 'processed',
      liveMode: event.live_mode || true,
      idempotencyKey: event.idempotency_key || '',
    });

    return res.status(200).json({
      success: true,
      data: {
        webhookId: event.id,
        notificationId: notificationResult?.id,
        notificationStatus: notificationResult?.status,
        bookingId: event.bookingId,
      },
      message: 'Webhook processed successfully',
    });
  } catch (error) {
    logger.error('Error handling LiteAPI webhook:', error);
    // Return 200 anyway to prevent LiteAPI retries
    return res.status(200).json({
      success: true,
      message: 'Webhook received',
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

/**
 * Handles API Manager events
 * Processes rate limit, quota, key expiration, and health check events
 * Dispatches admin notifications via email, SMS, and in-app channels
 */
export async function handleAPIManagerEvent(req: Request, res: Response): Promise<Response> {
  try {
    const event: APIManagerEvent = req.body;

    // Validate required fields
    if (!event.eventType || !event.apiKey || !event.timestamp) {
      logger.warn('Invalid API manager event - missing required fields', event);
      return res.status(200).json({
        success: false,
        message: 'Missing required event fields',
      });
    }

    logger.info('[API Manager Event]', {
      eventType: event.eventType,
      apiKey: event.apiKey,
      severity: event.severity || 'normal',
    });

    // Process API manager event and create notification
    const { success, notification, error } = await processAPIManagerEvent(event);

    if (!success) {
      logger.error('Failed to process API manager event:', error);
      // Still return 200 to prevent retries from event source
      return res.status(200).json({
        success: false,
        message: 'Event processing failed',
        error,
      });
    }

    if (!notification) {
      logger.warn('No notification generated for API manager event:', event.eventType);
      return res.status(200).json({
        success: true,
        message: 'Event received but no notification generated',
      });
    }

    // Get admin recipient (from notification or environment variable)
    const adminUserId = notification.recipient || process.env.ADMIN_EMAIL || 'admin@tripalfa.com';

    // Dispatch notification to admin via all specified channels
    try {
      const dispatchResult = await notificationService.sendNotification({
        userId: adminUserId,
        title: notification.title,
        message: notification.message,
        type: notification.type,
        priority: notification.priority,
        channels: notification.channels as Array<'email' | 'sms' | 'push' | 'in_app'>,
        metadata: notification.metadata,
      } as any);

      const dispatchResultAny = dispatchResult as any;
      if (!dispatchResultAny.success) {
        logger.warn('Notification dispatch completed with warnings:', dispatchResultAny.errors);
      } else {
        logger.info('API manager notification dispatched successfully', {
          notificationId: notification.id,
          channels: notification.channels,
          type: notification.type,
        });
      }
    } catch (notificationError) {
      logger.error('Error dispatching API manager notification:', notificationError);
      // Don't fail the webhook - continue to return 200
    }

    return res.status(200).json({
      success: true,
      message: 'API manager event processed and notification dispatched',
      notificationId: notification.id,
    });
  } catch (error) {
    logger.error('Error handling API manager event:', error);
    // Always return 200 to prevent retries from event source
    return res.status(200).json({
      success: false,
      message: 'Error processing API manager event',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handles Supplier Onboarding events
 * Processes supplier registration, wallet assignment, and wallet activation
 * Dispatches admin and supplier notifications via email, SMS, and in-app channels
 */
export async function handleSupplierOnboardingEvent(req: Request, res: Response): Promise<Response> {
  try {
    const event: SupplierOnboardingEvent = req.body;

    // Validate required fields
    if (!event.eventType || !event.supplierId || !event.supplierName || !event.supplierEmail || !event.timestamp) {
      logger.warn('Invalid supplier onboarding event - missing required fields', event);
      return res.status(200).json({
        success: false,
        message: 'Missing required event fields',
      });
    }

    logger.info('[Supplier Onboarding Event]', {
      eventType: event.eventType,
      supplierId: event.supplierId,
      supplierName: event.supplierName,
    });

    // Process supplier onboarding event and create notifications
    const { success, notifications, error } = await processSupplierOnboardingEvent(event);

    if (!success) {
      logger.error('Failed to process supplier onboarding event:', error);
      // Still return 200 to prevent retries from event source
      return res.status(200).json({
        success: false,
        message: 'Event processing failed',
        error,
      });
    }

    if (!notifications || notifications.length === 0) {
      logger.warn('No notifications generated for supplier onboarding event:', event.eventType);
      return res.status(200).json({
        success: true,
        message: 'Event received but no notifications generated',
      });
    }

    // Dispatch notifications to both admin and supplier
    const dispatchedNotifications: string[] = [];
    try {
      for (const notification of notifications) {
        try {
          const dispatchResult = await notificationService.sendNotification({
            userId: notification.recipient,
            title: notification.title,
            message: notification.message,
            type: notification.type,
            priority: notification.priority,
            channels: notification.channels as Array<'email' | 'sms' | 'push' | 'in_app'>,
            metadata: notification.metadata,
          } as any);

          const dispatchResultAny = dispatchResult as any;
          if (!dispatchResultAny.success) {
            logger.warn(
              `Notification dispatch completed with warnings for ${notification.recipientType}:`,
              dispatchResultAny.errors
            );
          } else {
            logger.info('Supplier onboarding notification dispatched successfully', {
              notificationId: notification.id,
              recipientType: notification.recipientType,
              channels: notification.channels,
              type: notification.type,
            });
          }
          dispatchedNotifications.push(notification.id);
        } catch (notificationError) {
          logger.error(
            `Error dispatching notification to ${notification.recipientType}:`,
            notificationError
          );
          // Continue to next notification
        }
      }
    } catch (notificationError) {
      logger.error('Error dispatching supplier onboarding notifications:', notificationError);
      // Don't fail the webhook - continue to return 200
    }

    return res.status(200).json({
      success: true,
      message: 'Supplier onboarding event processed and notifications dispatched',
      notificationIds: dispatchedNotifications,
      notificationCount: dispatchedNotifications.length,
    });
  } catch (error) {
    logger.error('Error handling supplier onboarding event:', error);
    // Always return 200 to prevent retries from event source
    return res.status(200).json({
      success: false,
      message: 'Error processing supplier onboarding event',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Handles Customer Onboarding events
 * Processes customer registration, profile completion, account verification, and payment method addition
 * Dispatches admin and customer notifications via email, SMS, and in-app channels
 */
export async function handleCustomerOnboardingEvent(req: Request, res: Response): Promise<Response> {
  try {
    const event: CustomerOnboardingEvent = req.body;

    // Validate required fields
    if (!event.eventType || !event.customerId || !event.customerName || !event.customerEmail || !event.timestamp) {
      logger.warn('Invalid customer onboarding event - missing required fields', event);
      return res.status(200).json({
        success: false,
        message: 'Missing required event fields',
      });
    }

    logger.info('[Customer Onboarding Event]', {
      eventType: event.eventType,
      customerId: event.customerId,
      customerName: event.customerName,
    });

    // Process customer onboarding event and create notifications
    const { success, notifications, error } = await processCustomerOnboardingEvent(event);

    if (!success) {
      logger.warn('Failed to process customer onboarding event:', error);
      return res.status(200).json({
        success: false,
        message: 'Failed to process customer onboarding event',
        error,
      });
    }

    const dispatchedNotifications: string[] = [];

    try {
      if (notifications && notifications.length > 0) {
        for (const notification of notifications) {
          try {
            const dispatchResult = await notificationService.sendNotification({
              userId: notification.recipient,
              title: notification.title,
              message: notification.message,
              type: notification.type,
              priority: notification.priority,
              channels: notification.channels as Array<'email' | 'sms' | 'push' | 'in_app'>,
              metadata: notification.metadata,
            } as any);

            const dispatchResultAny = dispatchResult as any;
            if (!dispatchResultAny.success) {
              logger.warn(
                `Notification dispatch completed with warnings for ${notification.recipientType}:`,
                dispatchResultAny.errors
              );
            } else {
              logger.info('Customer onboarding notification dispatched successfully', {
                notificationId: notification.id,
                recipientType: notification.recipientType,
                channels: notification.channels,
                type: notification.type,
              });
            }
            dispatchedNotifications.push(notification.id);
          } catch (notificationError) {
            logger.error(
              `Error dispatching notification to ${notification.recipientType}:`,
              notificationError
            );
            // Continue to next notification
          }
        }
      }
    } catch (notificationError) {
      logger.error('Error dispatching customer onboarding notifications:', notificationError);
      // Don't fail the webhook - continue to return 200
    }

    return res.status(200).json({
      success: true,
      message: 'Customer onboarding event processed and notifications dispatched',
      notificationIds: dispatchedNotifications,
      notificationCount: dispatchedNotifications.length,
    });
  } catch (error) {
    logger.error('Error handling customer onboarding event:', error);
    // Always return 200 to prevent retries from event source
    return res.status(200).json({
      success: false,
      message: 'Error processing customer onboarding event',
      error: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
