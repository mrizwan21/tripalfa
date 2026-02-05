import express from 'express';

const router = express.Router();

// Duffel Webhook Handler
// Events: order.created, order.payment_required, order.confirmed, order.processing, order.cancelled, order.changed, payment.succeeded, payment.failed
router.post('/duffel', async (req, res) => {
    try {
        const event = req.body;
        console.log('[Duffel Webhook]', event.type, event.data?.id);

        // TODO: Verify webhook signature (Duffel-Signature header)

        const bookingId = event.data?.id;

        switch (event.type) {
            case 'order.created':
                // Initial booking creation from supplier side (if applicable)
                console.log(`Duffel Order Created: ${bookingId}`);
                break;

            case 'order.payment_required':
                // Hold created, waiting for payment
                console.log(`Duffel Order Awaiting Payment: ${bookingId}`);
                // updateBookingStatus(bookingId, 'HOLD_CONFIRMED');
                break;

            case 'order.processing':
                // Payment captured, ticketing in progress
                console.log(`Duffel Order Processing: ${bookingId}`);
                // updateBookingStatus(bookingId, 'TICKETING');
                break;

            case 'order.confirmed':
                // Ticketed
                console.log(`Duffel Order Confirmed: ${bookingId}`);
                // updateBookingStatus(bookingId, 'CONFIRMED', event.data);
                break;

            case 'order.cancelled':
                console.log(`Duffel Order Cancelled: ${bookingId}`);
                // updateBookingStatus(bookingId, 'CANCELLED');
                break;

            case 'order.changed':
                console.log(`Duffel Order Schedule Change: ${bookingId}`);
                // notifyUser(bookingId, 'SCHEDULE_CHANGE', event.data);
                break;

            case 'payment.succeeded':
                console.log(`Duffel Payment Succeeded for: ${bookingId}`);
                break;

            case 'payment.failed':
                console.log(`Duffel Payment Failed for: ${bookingId}`);
                // updateBookingStatus(bookingId, 'PAYMENT_FAILED');
                break;

            default:
                console.log(`Unhandled Duffel Event: ${event.type}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('Duffel Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

// LiteAPI Webhook Handler
// Common statuses: confirmed, voucher_issued, cancelled, failed
router.post('/liteapi', async (req, res) => {
    try {
        const event = req.body;
        console.log('[LiteAPI Webhook]', event.type || event.status, event.bookingId);

        const bookingId = event.bookingId;
        const status = event.status; // LiteAPI usually sends 'status' field directly or nested

        if (!bookingId) {
            console.warn('LiteAPI Webhook missing bookingId');
            res.status(400).send('Missing bookingId');
            return;
        }

        switch (status) {
            case 'confirmed':
                console.log(`LiteAPI Booking Confirmed: ${bookingId}`);
                // updateBookingStatus(bookingId, 'CONFIRMED');
                break;

            case 'voucher_issued':
                console.log(`LiteAPI Voucher Issued: ${bookingId}`);
                // updateBookingStatus(bookingId, 'COMPLETED');
                break;

            case 'cancelled':
                console.log(`LiteAPI Booking Cancelled: ${bookingId}`);
                // updateBookingStatus(bookingId, 'CANCELLED');
                break;

            case 'failed':
                console.log(`LiteAPI Booking Failed: ${bookingId}`);
                // updateBookingStatus(bookingId, 'FAILED', event.error);
                break;

            default:
                console.log(`Unhandled LiteAPI Status: ${status}`);
        }

        res.status(200).json({ received: true });
    } catch (error) {
        console.error('LiteAPI Webhook Error:', error);
        res.status(500).json({ error: 'Webhook processing failed' });
    }
});

export default router;
