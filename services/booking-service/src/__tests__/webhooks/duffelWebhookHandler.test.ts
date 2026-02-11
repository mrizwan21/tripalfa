/**
 * Duffel Webhook Handler Tests
 * Tests for event mapping, customer ID extraction, and webhook processing
 */

import {
  mapDuffelEventToNotification,
  extractCustomerIdFromWebhookEvent,
  DuffelWebhookPayload,
} from '../../integrations/duffelWebhookHandler';

describe('Duffel Webhook Handler', () => {
  const customerId = 'customer_123';
  const baseWebhookPayload = {
    id: 'webhook_123',
    type: 'order.created',
    live_mode: false,
    created_at: new Date().toISOString(),
    idempotency_key: 'idem_123',
    data: {
      object: {
        id: 'ord_123',
        booking_reference: 'ABC123',
        custom_metadata: {
          customer_id: customerId,
        },
        total_amount: '1500.00',
        total_currency: 'USD',
        passengers: [{ id: 'pass_1' }, { id: 'pass_2' }],
      },
    },
  };

  describe('mapDuffelEventToNotification', () => {
    it('should map order.created event correctly', () => {
      const notification = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Booking Confirmed');
      expect(notification?.message).toContain('ord_123');
      expect(notification?.type).toBe('duffel_order.created');
      expect(notification?.priority).toBe('high');
      expect(notification?.channels).toContain('email');
      expect(notification?.channels).toContain('in_app');
      expect(notification?.userId).toBe(customerId);
      expect(notification?.metadata?.webhookId).toBe('webhook_123');
      expect(notification?.metadata?.sourceSystem).toBe('duffel');
      expect(notification?.metadata?.orderId).toBe('ord_123');
      expect(notification?.metadata?.orderDetails?.passengers).toBe(2);
    });

    it('should map order.updated event correctly', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order.updated',
        data: {
          ...baseWebhookPayload.data,
          object: {
            ...baseWebhookPayload.data.object,
            updated_at: new Date().toISOString(),
          },
        },
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toBe('Booking Updated');
      expect(notification?.priority).toBe('medium');
      expect(notification?.type).toBe('duffel_order.updated');
    });

    it('should map airline_initiated_change_detected event with urgent priority', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order.airline_initiated_change_detected',
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Flight Schedule Change');
      expect(notification?.priority).toBe('urgent');
      expect(notification?.channels).toContain('sms');
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('review_schedule_change');
    });

    it('should map order_change_request.created event', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order_change_request.created',
        data: {
          object: {
            id: 'changereq_123',
            order_id: 'ord_123',
          },
        },
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toBe('Change Request Created');
      expect(notification?.priority).toBe('high');
      expect(notification?.metadata?.changeRequestId).toBe('changereq_123');
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('review_change_options');
    });

    it('should map order_change_request.expires_soon with urgent priority', () => {
      const expiresAt = new Date(Date.now() + 3600000).toISOString();
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order_change_request.expires_soon',
        data: {
          object: {
            id: 'changereq_123',
            order_id: 'ord_123',
            expires_at: expiresAt,
          },
        },
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Change Request Expiring');
      expect(notification?.priority).toBe('urgent');
      expect(notification?.channels).toContain('sms');
      expect(notification?.metadata?.expiresAt).toBe(expiresAt);
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('select_change_option');
    });

    it('should map order_change.confirmed event', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order_change.confirmed',
        data: {
          object: {
            id: 'change_123',
            order_id: 'ord_123',
            slices: [{ id: 'slice_1' }],
          },
        },
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Booking Change Confirmed');
      expect(notification?.priority).toBe('high');
      expect(notification?.metadata?.orderChangeId).toBe('change_123');
    });

    it('should map order_change.rejected event with support action', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order_change.rejected',
        data: {
          object: {
            id: 'change_123',
            order_id: 'ord_123',
          },
        },
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Booking Change Rejected');
      expect(notification?.priority).toBe('high');
      expect(notification?.channels).toContain('sms');
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('contact_support');
    });

    it('should map ping.triggered test event', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'ping.triggered',
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toBe('Test Notification');
      expect(notification?.priority).toBe('low');
      expect(notification?.channels).toEqual(['in_app']);
      expect(notification?.metadata?.isTestEvent).toBe(true);
    });

    it('should handle unmapped event types gracefully', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'unknown.event.type',
      };

      const notification = mapDuffelEventToNotification(payload, customerId);

      expect(notification).not.toBeNull();
      expect(notification?.title).toBe('Booking Update');
      expect(notification?.title).not.toBeNull();
      expect(notification?.metadata?.eventData).toBeDefined();
    });

    it('should preserve webhook metadata in notification', () => {
      const notification = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);

      expect(notification?.metadata?.webhookId).toBe('webhook_123');
      expect(notification?.metadata?.webhookType).toBe('order.created');
      expect(notification?.metadata?.sourceSystem).toBe('duffel');
      expect(notification?.metadata?.idempotencyKey).toBe('idem_123');
      expect(notification?.metadata?.liveMode).toBe(false);
    });

    it('should include order details in notification metadata', () => {
      const notification = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);

      expect(notification?.metadata?.orderDetails?.total).toBe('1500.00');
      expect(notification?.metadata?.orderDetails?.currency).toBe('USD');
      expect(notification?.metadata?.orderDetails?.passengers).toBe(2);
    });

    it('should set correct channels based on event type urgency', () => {
      // Normal events: in_app + email
      const normalEvent = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);
      expect(normalEvent?.channels).toEqual(expect.arrayContaining(['in_app', 'email']));

      // Urgent events: in_app + email + sms
      const urgentEvent: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'order.airline_initiated_change_detected',
      };
      const urgentNotif = mapDuffelEventToNotification(urgentEvent, customerId);
      expect(urgentNotif?.channels).toEqual(expect.arrayContaining(['in_app', 'email', 'sms']));

      // Test events: in_app only
      const testEvent: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        type: 'ping.triggered',
      };
      const testNotif = mapDuffelEventToNotification(testEvent, customerId);
      expect(testNotif?.channels).toEqual(['in_app']);
    });

    it('should handle missing event data gracefully', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        data: {
          object: {},
        },
      };

      const notification = mapDuffelEventToNotification(payload, customerId);
      expect(notification).not.toBeNull();
    });
  });

  describe('extractCustomerIdFromWebhookEvent', () => {
    it('should extract customer ID from custom_metadata', () => {
      const customerId = extractCustomerIdFromWebhookEvent(baseWebhookPayload as DuffelWebhookPayload);
      expect(customerId).toBe('customer_123');
    });

    it('should return null when custom_metadata.customer_id is missing', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        data: {
          object: {
            id: 'ord_123',
            // No custom_metadata
          },
        },
      };

      const customerId = extractCustomerIdFromWebhookEvent(payload);
      expect(customerId).toBeNull();
    });

    it('should return null when custom_metadata is empty', () => {
      const payload: DuffelWebhookPayload = {
        ...baseWebhookPayload,
        data: {
          object: {
            id: 'ord_123',
            custom_metadata: {},
          },
        },
      };

      const customerId = extractCustomerIdFromWebhookEvent(payload);
      expect(customerId).toBeNull();
    });

    it('should handle malformed payload gracefully', () => {
      // @ts-ignore
      expect(() => extractCustomerIdFromWebhookEvent(null)).not.toThrow();
      // @ts-ignore
      expect(() => extractCustomerIdFromWebhookEvent(undefined)).not.toThrow();
      // @ts-ignore
      expect(() => extractCustomerIdFromWebhookEvent({})).not.toThrow();
    });

    it('should return null for invalid data structure', () => {
      const payload: any = {
        ...baseWebhookPayload,
        data: {
          // Missing object key
          object: undefined,
        },
      };

      const customerId = extractCustomerIdFromWebhookEvent(payload);
      expect(customerId).toBeNull();
    });
  });

  describe('Notification metadata consistency', () => {
    it('should maintain consistent notification ID format', () => {
      const notif1 = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);
      const notif2 = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);

      expect(notif1?.id).toMatch(/^notif_\d+_[a-z0-9]+$/);
      expect(notif2?.id).toMatch(/^notif_\d+_[a-z0-9]+$/);
      // IDs should be different (unique)
      expect(notif1?.id).not.toBe(notif2?.id);
    });

    it('should always include sourceSystem in metadata', () => {
      const eventTypes = [
        'order.created',
        'order.updated',
        'order.airline_initiated_change_detected',
        'order_change_request.created',
        'ping.triggered',
      ];

      eventTypes.forEach((eventType) => {
        const payload: DuffelWebhookPayload = {
          ...baseWebhookPayload,
          type: eventType as any,
        };

        const notification = mapDuffelEventToNotification(payload, customerId);
        expect(notification?.metadata?.sourceSystem).toBe('duffel');
      });
    });

    it('should set correct notification userId', () => {
      const notification = mapDuffelEventToNotification(baseWebhookPayload as DuffelWebhookPayload, customerId);
      expect(notification?.userId).toBe(customerId);
    });
  });

  describe('Priority assignments', () => {
    it('should assign correct priorities to different event types', () => {
      const priorityMap = {
        'order.created': 'high',
        'order.updated': 'medium',
        'order.airline_initiated_change_detected': 'urgent',
        'order_change_request.created': 'high',
        'order_change_request.expires_soon': 'urgent',
        'order_change.confirmed': 'high',
        'order_change.rejected': 'high',
        'ping.triggered': 'low',
      };

      Object.entries(priorityMap).forEach(([eventType, expectedPriority]) => {
        const payload: DuffelWebhookPayload = {
          ...baseWebhookPayload,
          type: eventType as any,
        };

        const notification = mapDuffelEventToNotification(payload, customerId);
        expect(notification?.priority).toBe(expectedPriority);
      });
    });
  });
});
