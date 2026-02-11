/**
 * LiteAPI Webhook Handler Tests
 * Tests for event mapping, customer ID extraction, and notification generation
 */

import {
  mapLiteAPIEventToNotification,
  extractCustomerIdFromLiteAPIWebhookEvent,
  LiteAPIWebhookPayload,
  Notification,
} from '../../integrations/liteapiWebhookHandler';

describe('LiteAPI Webhook Handler Tests', () => {
  const customerId = 'cust_12345';

  const baseWebhookPayload: LiteAPIWebhookPayload = {
    id: 'webhook_liteapi_001',
    bookingId: 'hotel_booking_123',
    status: 'confirmed',
    hotelName: 'Burj Al Arab',
    checkIn: '2026-03-15',
    checkOut: '2026-03-17',
    totalPrice: 2500,
    currency: 'AED',
    nights: 2,
    guests: 2,
    roomType: 'Suite',
    custom_metadata: {
      customer_id: customerId,
    },
    timestamp: '2026-02-09T10:00:00Z',
    idempotency_key: 'idemp_key_001',
    live_mode: true,
  };

  describe('mapLiteAPIEventToNotification', () => {
    it('should map confirmed event to booking confirmed notification', () => {
      const notification = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Hotel Booking Confirmed');
      expect(notification?.message).toContain('Burj Al Arab');
      expect(notification?.message).toContain('hotel_booking_123');
      expect(notification?.priority).toBe('high');
      expect(notification?.channels).toEqual(expect.arrayContaining(['in_app', 'email']));
      expect(notification?.metadata?.hotelDetails?.name).toBe('Burj Al Arab');
      expect(notification?.metadata?.hotelDetails?.checkIn).toBe('2026-03-15');
      expect(notification?.metadata?.hotelDetails?.totalPrice).toBe(2500);
    });

    it('should map voucher_issued event to voucher ready notification', () => {
      const voucherPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        status: 'voucher_issued',
      };

      const notification = mapLiteAPIEventToNotification(voucherPayload, customerId);

      expect(notification?.title).toContain('Voucher Issued');
      expect(notification?.message).toContain('voucher');
      expect(notification?.message).toContain('2026-03-15');
      expect(notification?.priority).toBe('high');
      expect(notification?.metadata?.voucherAvailable).toBe(true);
    });

    it('should map cancelled event to booking cancelled notification', () => {
      const cancelledPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        status: 'cancelled',
      };

      const notification = mapLiteAPIEventToNotification(cancelledPayload, customerId);

      expect(notification?.title).toContain('Booking Cancelled');
      expect(notification?.message).toContain('cancelled');
      expect(notification?.priority).toBe('high');
      expect(notification?.channels).toEqual(expect.arrayContaining(['in_app', 'email', 'sms']));
      expect(notification?.metadata?.cancelled).toBe(true);
    });

    it('should map failed event to booking failed notification with urgency', () => {
      const failedPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        status: 'failed',
        error: {
          code: 'PAYMENT_FAILED',
          message: 'Payment declined by card issuer',
        },
      };

      const notification = mapLiteAPIEventToNotification(failedPayload, customerId);

      expect(notification?.title).toContain('Booking Failed');
      expect(notification?.message).toContain('Payment declined');
      expect(notification?.priority).toBe('urgent');
      expect(notification?.channels).toEqual(expect.arrayContaining(['in_app', 'email', 'sms']));
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('contact_support');
      expect(notification?.metadata?.error?.message).toBe('Payment declined by card issuer');
    });

    it('should preserve booking details in metadata for all status types', () => {
      const statuses = ['confirmed', 'voucher_issued', 'cancelled', 'failed'];

      for (const status of statuses) {
        const payload: LiteAPIWebhookPayload = {
          ...baseWebhookPayload,
          status,
        };

        const notification = mapLiteAPIEventToNotification(payload, customerId);

        expect(notification?.metadata?.bookingId).toBe('hotel_booking_123');
        expect(notification?.metadata?.sourceSystem).toBe('liteapi');
        expect(notification?.metadata?.idempotencyKey).toBe('idemp_key_001');
        expect(notification?.metadata?.liveMode).toBe(true);
      }
    });

    it('should set correct notification type based on status', () => {
      const payload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        status: 'confirmed',
      };

      const notification = mapLiteAPIEventToNotification(payload, customerId);

      expect(notification?.type).toBe('liteapi_booking_confirmed');
    });

    it('should include hotel details in confirmed notification', () => {
      const notification = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);

      expect(notification?.metadata?.hotelDetails).toEqual({
        name: 'Burj Al Arab',
        checkIn: '2026-03-15',
        checkOut: '2026-03-17',
        nights: 2,
        guests: 2,
        roomType: 'Suite',
        totalPrice: 2500,
        currency: 'AED',
      });
    });

    it('should generate unique notification IDs', () => {
      const notif1 = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);
      const notif2 = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);

      expect(notif1?.id).not.toBe(notif2?.id);
      expect(notif1?.id).toMatch(/^notif_\d+_[a-z0-9]+$/);
    });

    it('should handle missing optional fields gracefully', () => {
      const minimalPayload: LiteAPIWebhookPayload = {
        id: 'webhook_minimal',
        bookingId: 'booking_123',
        status: 'confirmed',
        custom_metadata: { customer_id: customerId },
      };

      const notification = mapLiteAPIEventToNotification(minimalPayload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Hotel Booking Confirmed');
    });

    it('should set low priority for test events', () => {
      const testPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        status: 'ping.triggered',
      };

      const notification = mapLiteAPIEventToNotification(testPayload, customerId);

      expect(notification?.priority).toBe('medium');
    });

    it('should include guest information in notification metadata', () => {
      const notification = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);

      expect(notification?.metadata?.hotelDetails?.guests).toBe(2);
      expect(notification?.metadata?.hotelDetails?.nights).toBe(2);
      expect(notification?.metadata?.hotelDetails?.roomType).toBe('Suite');
    });

    it('should set correct channels for urgent events', () => {
      const urgentPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        status: 'failed',
      };

      const notification = mapLiteAPIEventToNotification(urgentPayload, customerId);

      expect(notification?.channels).toContain('sms');
      expect(notification?.channels).toContain('email');
      expect(notification?.channels).toContain('in_app');
    });

    it('should include timestamp in metadata', () => {
      const notification = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);

      expect(notification?.metadata?.timestamp).toBe('2026-02-09T10:00:00Z');
    });

    it('should use default timestamp when not provided', () => {
      const noTimestampPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        timestamp: undefined,
      };

      const notification = mapLiteAPIEventToNotification(noTimestampPayload, customerId);

      expect(notification?.metadata?.timestamp).toBeDefined();
      expect(notification?.metadata?.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}/);
    });

    it('should assign correct userId from customerId', () => {
      const notification = mapLiteAPIEventToNotification(baseWebhookPayload, customerId);

      expect(notification?.userId).toBe(customerId);
    });
  });

  describe('extractCustomerIdFromLiteAPIWebhookEvent', () => {
    it('should extract customer ID from custom_metadata', () => {
      const customerId = extractCustomerIdFromLiteAPIWebhookEvent(baseWebhookPayload);

      expect(customerId).toBe('cust_12345');
    });

    it('should return null when custom_metadata is missing', () => {
      const noMetadataPayload: LiteAPIWebhookPayload = {
        id: 'webhook_no_meta',
        bookingId: 'booking_456',
        status: 'confirmed',
      };

      const customerId = extractCustomerIdFromLiteAPIWebhookEvent(noMetadataPayload);

      expect(customerId).toBeNull();
    });

    it('should return null when customer_id is missing from metadata', () => {
      const noCustomerIdPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        custom_metadata: {},
      };

      const customerId = extractCustomerIdFromLiteAPIWebhookEvent(noCustomerIdPayload);

      expect(customerId).toBeNull();
    });

    it('should extract customer ID from various booking statuses', () => {
      const statuses = ['confirmed', 'voucher_issued', 'cancelled', 'failed'];

      for (const status of statuses) {
        const payload: LiteAPIWebhookPayload = {
          ...baseWebhookPayload,
          status,
        };

        const customerId = extractCustomerIdFromLiteAPIWebhookEvent(payload);
        expect(customerId).toBe('cust_12345');
      }
    });

    it('should handle empty custom_metadata gracefully', () => {
      const emptyMetadataPayload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        custom_metadata: undefined,
      };

      const customerId = extractCustomerIdFromLiteAPIWebhookEvent(emptyMetadataPayload);

      expect(customerId).toBeNull();
    });

    it('should handle numeric customer IDs', () => {
      const payload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        custom_metadata: {
          customer_id: '987654321',
        },
      };

      const customerId = extractCustomerIdFromLiteAPIWebhookEvent(payload);

      expect(customerId).toBe('987654321');
    });

    it('should preserve customer ID format', () => {
      const testCustomerId = 'CUST-2026-ABC-XYZ';
      const payload: LiteAPIWebhookPayload = {
        ...baseWebhookPayload,
        custom_metadata: {
          customer_id: testCustomerId,
        },
      };

      const customerId = extractCustomerIdFromLiteAPIWebhookEvent(payload);

      expect(customerId).toBe(testCustomerId);
    });
  });

  describe('Notification consistency checks', () => {
    it('should include webhookId in all notifications', () => {
      const statuses = ['confirmed', 'voucher_issued', 'cancelled', 'failed'];

      for (const status of statuses) {
        const payload: LiteAPIWebhookPayload = {
          ...baseWebhookPayload,
          status,
        };

        const notification = mapLiteAPIEventToNotification(payload, customerId);

        expect(notification?.metadata?.webhookId).toBe('webhook_liteapi_001');
      }
    });

    it('should maintain consistent metadata structure across all events', () => {
      const statuses = ['confirmed', 'voucher_issued', 'cancelled', 'failed'];
      const requiredMetadataFields = [
        'webhookId',
        'webhookType',
        'sourceSystem',
        'bookingId',
        'idempotencyKey',
        'liveMode',
        'timestamp',
      ];

      for (const status of statuses) {
        const payload: LiteAPIWebhookPayload = {
          ...baseWebhookPayload,
          status,
        };

        const notification = mapLiteAPIEventToNotification(payload, customerId);

        for (const field of requiredMetadataFields) {
          expect(notification?.metadata?.[field]).toBeDefined();
        }
      }
    });

    it('should set all notifications with userId equal to customerId', () => {
      const statuses = ['confirmed', 'voucher_issued', 'cancelled', 'failed'];

      for (const status of statuses) {
        const payload: LiteAPIWebhookPayload = {
          ...baseWebhookPayload,
          status,
        };

        const notification = mapLiteAPIEventToNotification(payload, customerId);

        expect(notification?.userId).toBe(customerId);
      }
    });
  });
});
