import express from 'express';
import crypto from 'crypto';

const router = express.Router();

// Idempotency tracking
const processedWebhooks = new Set<string>();

/**
 * Dispatches notifications to users
 * This is a mock implementation that can be replaced with actual notification service
 * In production, this would integrate with NotificationService or similar
 */
async function dispatchNotification(notification: any): Promise<boolean> {
  try {
    // Log the notification dispatch attempt
    console.log('[Notification Dispatch]', {
      type: notification.type,
      title: notification.title,
      channels: notification.channels,
      priority: notification.priority,
    });

    // In production, this would call:
    // await notificationService.send(notification);
    // For now, we just log success to indicate the dispatch attempt was made
    console.info('Notification dispatched successfully:', notification.type);
    return true;
  } catch (error) {
    console.error('Failed to dispatch notification:', error);
    // Don't throw - allow processing to continue and return 200 to prevent retries
    return false;
  }
}

/**
 * Validates webhook signature for safety
 */
function validateWebhookSignature(
  rawPayload: string,
  signature: string,
  webhookSecret: string
): boolean {
  try {
    const computedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(rawPayload)
      .digest('hex');

    return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(computedSignature));
  } catch (error) {
    console.error('Signature validation error:', error);
    return false;
  }
}

/**
 * Maps webhook events to notification payloads
 */
function mapWebhookToNotification(eventType: string, data: any): any {
  const base = {
    type: eventType,
    priority: 'medium',
    channels: ['email', 'in_app'],
  };

  switch (eventType) {
    case 'availability_changed':
      return {
        ...base,
        title: '📊 Availability Updated',
        message: `Availability has changed for ${data.hotelName || 'property'}. Current availability: ${data.available}/${data.total}.`,
        priority: 'medium',
        metadata: {
          hotelId: data.hotelId,
          available: data.available,
          total: data.total,
          checkIn: data.checkIn,
          checkOut: data.checkOut,
        },
      };
    case 'price_changed':
      return {
        ...base,
        title: '💰 Price Update',
        message: `Price has changed for ${data.hotelName || 'property'}. New price: ${data.newPrice} ${data.currency}.`,
        priority: 'medium',
        metadata: {
          hotelId: data.hotelId,
          oldPrice: data.oldPrice,
          newPrice: data.newPrice,
          currency: data.currency,
          percentageChange: ((data.newPrice - data.oldPrice) / data.oldPrice) * 100,
        },
      };
    case 'property_discontinued':
      return {
        ...base,
        title: '❌ Property No Longer Available',
        message: `${data.hotelName || 'Property'} is no longer available for booking.`,
        priority: 'high',
        channels: ['email', 'sms', 'in_app'],
        metadata: {
          hotelId: data.hotelId,
          reason: data.reason || 'Property discontinued',
          discontinuedDate: data.discontinuedDate,
        },
      };
    default:
      return {
        ...base,
        title: 'Inventory Update',
        message: `An inventory update has occurred: ${eventType}`,
        metadata: data,
      };
  }
}

// Duffel Webhook Handler
// Events: order.created, order.payment_required, order.confirmed, order.processing, order.cancelled, order.changed, payment.succeeded, payment.failed
router.post('/duffel', async (req, res) => {
    try {
        const event = req.body;
        const signature = req.get('X-Duffel-Signature') || '';
        const webhookSecret = process.env.DUFFEL_WEBHOOK_SECRET || '';

        // Validate signature
        if (webhookSecret && signature) {
            const rawPayload = JSON.stringify(req.body);
            const isValid = validateWebhookSignature(rawPayload, signature, webhookSecret);
            if (!isValid) {
                console.warn('Invalid Duffel webhook signature');
                return res.status(200).json({ received: true }); // Return 200 to prevent retries
            }
        } else {
            console.warn('Missing Duffel webhook signature or secret');
        }

        // Idempotency check
        const webhookId = event.id || `${event.type}_${Date.now()}`;
        if (processedWebhooks.has(webhookId)) {
            console.info(`Duffel webhook already processed: ${webhookId}`);
            return res.status(200).json({ received: true, duplicate: true });
        }
        processedWebhooks.add(webhookId);

        console.log('[Duffel Webhook]', event.type, event.data?.id);
        
        const bookingId = event.data?.id;

        switch (event.type) {
            case 'order.created':
                console.log(`Duffel Order Created: ${bookingId}`);
                // Dispatch notification
                const createdNotification = mapWebhookToNotification('order_created', {
                    orderId: bookingId,
                    hotelName: event.data?.slices?.[0]?.segments?.[0]?.marketing_airline?.name || 'Booking',
                });
                await dispatchNotification(createdNotification);
                break;

            case 'order.payment_required':
                console.log(`Duffel Order Awaiting Payment: ${bookingId}`);
                const paymentNotification = mapWebhookToNotification('payment_required', {
                    orderId: bookingId,
                    amount: event.data?.total_amount,
                    currency: event.data?.total_currency,
                });
                await dispatchNotification(paymentNotification);
                break;

            case 'order.processing':
                console.log(`Duffel Order Processing: ${bookingId}`);
                break;

            case 'order.confirmed':
                console.log(`Duffel Order Confirmed: ${bookingId}`);
                break;

            case 'order.cancelled':
                console.log(`Duffel Order Cancelled: ${bookingId}`);
                const cancelledNotification = mapWebhookToNotification('order_cancelled', {
                    orderId: bookingId,
                    reason: event.data?.cancellation_reason,
                });
                await dispatchNotification(cancelledNotification);
                break;

            case 'order.changed':
                console.log(`Duffel Order Schedule Change: ${bookingId}`);
                const scheduleNotification = mapWebhookToNotification('order_itinerary_change', {
                    orderId: bookingId,
                });
                await dispatchNotification(scheduleNotification);
                break;

            case 'payment.succeeded':
                console.log(`Duffel Payment Succeeded for: ${bookingId}`);
                break;

            case 'payment.failed':
                console.log(`Duffel Payment Failed for: ${bookingId}`);
                const failedPaymentNotification = mapWebhookToNotification('payment_failed', {
                    orderId: bookingId,
                });
                await dispatchNotification(failedPaymentNotification);
                break;

            default:
                console.log(`Unhandled Duffel Event: ${event.type}`);
        }

        // Always return 200 to prevent supplier retries
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Duffel Webhook Error:', error);
        // Still return 200 to prevent retries
        res.status(200).json({ received: true });
    }
});

// LiteAPI Webhook Handler
// Common statuses: confirmed, voucher_issued, cancelled, failed
router.post('/liteapi', async (req, res) => {
    try {
        const event = req.body;
        const signature = req.get('X-API-Signature') || '';
        const webhookSecret = process.env.LITEAPI_WEBHOOK_SECRET || '';

        // Validate signature
        if (webhookSecret && signature) {
            const rawPayload = JSON.stringify(req.body);
            const isValid = validateWebhookSignature(rawPayload, signature, webhookSecret);
            if (!isValid) {
                console.warn('Invalid LiteAPI webhook signature');
                return res.status(200).json({ received: true }); // Return 200 to prevent retries
            }
        } else {
            console.warn('Missing LiteAPI webhook signature or secret');
        }

        // Idempotency check
        const webhookId = event.id || event.idempotency_key || `${event.bookingId}_${Date.now()}`;
        if (processedWebhooks.has(webhookId)) {
            console.info(`LiteAPI webhook already processed: ${webhookId}`);
            return res.status(200).json({ received: true, duplicate: true });
        }
        processedWebhooks.add(webhookId);

        console.log('[LiteAPI Webhook]', event.status, event.bookingId);

        const bookingId = event.bookingId;
        const status = event.status;

        if (!bookingId) {
            console.warn('LiteAPI Webhook missing bookingId');
            return res.status(200).json({ received: true }); // Return 200 instead of 400
        }

        switch (status) {
            case 'confirmed':
                console.log(`LiteAPI Booking Confirmed: ${bookingId}`);
                const confirmedNotification = mapWebhookToNotification('booking_confirmed', {
                    bookingId,
                    hotelName: event.hotelName,
                    checkIn: event.checkIn,
                    checkOut: event.checkOut,
                });
                await dispatchNotification(confirmedNotification);
                break;

            case 'voucher_issued':
                console.log(`LiteAPI Voucher Issued: ${bookingId}`);
                const voucherNotification = mapWebhookToNotification('voucher_issued', {
                    bookingId,
                    hotelName: event.hotelName,
                });
                await dispatchNotification(voucherNotification);
                break;

            case 'cancelled':
                console.log(`LiteAPI Booking Cancelled: ${bookingId}`);
                const liteapiCancelledNotification = mapWebhookToNotification('booking_cancelled', {
                    bookingId,
                    hotelName: event.hotelName,
                });
                await dispatchNotification(liteapiCancelledNotification);
                break;

            case 'failed':
                console.log(`LiteAPI Booking Failed: ${bookingId}`);
                const failedBookingNotification = mapWebhookToNotification('booking_failed', {
                    bookingId,
                    error: event.error?.message,
                });
                await dispatchNotification(failedBookingNotification);
                break;

            default:
                console.log(`Unhandled LiteAPI Status: ${status}`);
        }

        // Always return 200 to prevent supplier retries
        res.status(200).json({ received: true });
    } catch (error) {
        console.error('LiteAPI Webhook Error:', error);
        // Still return 200 to prevent retries
        res.status(200).json({ received: true });
    }
});

export default router;
