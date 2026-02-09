/**
 * Notification Service Core Testing
 * 
 * Tests cover:
 * - Multi-channel notification delivery configuration
 * - Core notification creation and delivery
 * - Channel-specific delivery logic
 * - Notification status tracking
 * - Error handling and resilience
 * - Provider integration (Email, SMS, Push, In-App)
 * - Notification retrieval and listing
 */

import axios from 'axios';

/**
 * Get test API URL from global setup or environment
 * Global setup (global-setup.ts) bootstraps test server and sets this URL
 */
function getTestApiUrl(): string {
  // First check global test URL (set by global-setup.ts)
  if (typeof globalThis !== 'undefined' && (globalThis as any).TEST_API_URL) {
    return (globalThis as any).TEST_API_URL;
  }
  // Fall back to environment variable
  if (process.env.BOOKING_SERVICE_API) {
    return process.env.BOOKING_SERVICE_API;
  }
  throw new Error(
    'TEST_API_URL not available. Test server may not have been bootstrapped by global-setup.ts'
  );
}

const API_BASE_URL = getTestApiUrl();

describe('Notification Service - Core Delivery', () => {
  let notificationId: string;
  let userId: string;
  let orderId: string;

  beforeEach(() => {
    userId = `user-${Date.now()}`;
    orderId = `order-${Date.now()}`;
  });

  describe('Multi-Channel Notification Creation', () => {
    it('should create a notification with email channel', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'booking_confirmation',
        priority: 'high',
        content: {
          email: {
            subject: 'Your Booking Confirmation',
            body: 'Thank you for booking with us!',
            htmlBody: '<p>Thank you for booking with us!</p>',
          },
        },
        metadata: {
          bookingRef: 'BOOK123',
          customerName: 'John Doe',
          destination: 'Paris',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.id).toBeDefined();
      expect(response.data.channels).toContain('email');
      expect(response.data.status).toBe('pending');
      expect(response.data.priority).toBe('high');
      notificationId = response.data.id;
    });

    it('should create a notification with SMS channel', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['sms'],
        notificationType: 'booking_reminder',
        priority: 'medium',
        content: {
          sms: {
            message: 'Your booking confirmation code: ABC123',
          },
        },
        metadata: {
          bookingRef: 'BOOK123',
          phoneNumber: '+1234567890',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.channels).toContain('sms');
      expect(response.data.status).toBe('pending');
    });

    it('should create a notification with push notification channel', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['push'],
        notificationType: 'booking_update',
        priority: 'high',
        content: {
          push: {
            title: 'Booking Updated',
            body: 'Your booking has been confirmed',
            deepLink: 'app://booking/BOOK123',
          },
        },
        metadata: {
          bookingRef: 'BOOK123',
          deviceToken: 'abc123device',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.channels).toContain('push');
    });

    it('should create a notification with in-app channel', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['in_app'],
        notificationType: 'payment_confirmation',
        priority: 'medium',
        content: {
          in_app: {
            title: 'Payment Received',
            message: 'Your payment has been processed',
            icon: 'check-circle',
          },
        },
        metadata: {
          amount: '500.00',
          currency: 'USD',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.channels).toContain('in_app');
    });

    it('should create a multi-channel notification', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email', 'sms', 'push', 'in_app'],
        notificationType: 'urgent_booking_alert',
        priority: 'high',
        content: {
          email: {
            subject: 'Urgent: Booking Needs Attention',
            body: 'Your booking requires immediate action',
          },
          sms: {
            message: 'Your booking needs attention. Check your email.',
          },
          push: {
            title: 'Action Required',
            body: 'Your booking needs attention',
          },
          in_app: {
            title: 'Urgent!',
            message: 'Your booking needs attention',
          },
        },
        metadata: {
          bookingRef: 'BOOK123',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.channels).toHaveLength(4);
      expect(response.data.channels).toContain('email');
      expect(response.data.channels).toContain('sms');
      expect(response.data.channels).toContain('push');
      expect(response.data.channels).toContain('in_app');
    });
  });

  describe('Notification Delivery', () => {
    beforeEach(async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email', 'sms'],
        notificationType: 'test_notification',
        content: {
          email: {
            subject: 'Test',
            body: 'Test content',
          },
          sms: {
            message: 'Test SMS',
          },
        },
      });
      notificationId = response.data.id;
    });

    it('should track email delivery status', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'sent',
          sentAt: new Date().toISOString(),
          messageId: 'email-123',
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.channelStatus.email).toBe('sent');
      expect(response.data.channelStatus.email_sent_at).toBeDefined();
    });

    it('should track SMS delivery status', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'sms',
          status: 'delivered',
          deliveredAt: new Date().toISOString(),
          messageId: 'sms-456',
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.channelStatus.sms).toBe('delivered');
    });

    it('should track push notification delivery', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['push'],
        notificationType: 'push_test',
        content: {
          push: {
            title: 'Test',
            body: 'Test push',
          },
        },
      });

      const updateResponse = await axios.patch(
        `${API_BASE_URL}/notifications/${response.data.id}`,
        {
          channel: 'push',
          status: 'opened',
          openedAt: new Date().toISOString(),
        }
      );

      expect(updateResponse.data.channelStatus.push).toBe('opened');
    });

    it('should mark notification as failed on delivery error', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'failed',
          error: 'Invalid email address',
          failureReason: 'invalid_email',
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.channelStatus.email).toBe('failed');
    });
  });

  describe('Notification Retrieval', () => {
    beforeEach(async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'test_retrieval',
        content: {
          email: {
            subject: 'Test',
            body: 'Test',
          },
        },
      });
      notificationId = response.data.id;
    });

    it('should retrieve notification by ID', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/${notificationId}`
      );

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(notificationId);
      expect(response.data.userId).toBe(userId);
      expect(response.data.orderId).toBe(orderId);
    });

    it('should list all notifications for a user', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          page: 1,
          limit: 10,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(10);
      expect(response.data.pagination.total).toBeGreaterThanOrEqual(1);
    });

    it('should filter notifications by type', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          notificationType: 'test_retrieval',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
      const hasTestNotif = response.data.data.some(
        (n: any) => n.notificationType === 'test_retrieval'
      );
      expect(hasTestNotif).toBe(true);
    });

    it('should filter notifications by status', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          status: 'pending',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toBeInstanceOf(Array);
    });

    it('should sort notifications by creation date', async () => {
      // Create multiple notifications
      await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'sort_test_1',
        content: {
          email: { subject: 'Test 1', body: 'Body 1' },
        },
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'sort_test_2',
        content: {
          email: { subject: 'Test 2', body: 'Body 2' },
        },
      });

      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          sortBy: 'createdAt',
          order: 'desc',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Channel Configuration', () => {
    it('should validate required fields for email channel', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: ['email'],
          notificationType: 'test',
          content: {
            email: {
              // Missing subject and body
            },
          },
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });

    it('should validate SMS message length (max 160 chars)', async () => {
      const longMessage = 'a'.repeat(161);
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: ['sms'],
          notificationType: 'test',
          content: {
            sms: {
              message: longMessage,
            },
          },
        },
        { validateStatus: () => true }
      );

      expect([400, 422]).toContain(response.status);
    });

    it('should validate push notification has title and body', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: ['push'],
          notificationType: 'test',
          content: {
            push: {
              // Missing required fields
            },
          },
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
    });

    it('should support custom channel metadata', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'custom_metadata_test',
        content: {
          email: {
            subject: 'Test',
            body: 'Test',
          },
        },
        metadata: {
          booking_ref: 'ABC123',
          customer_segment: 'premium',
          campaign_id: 'camp_123',
          send_time_optimization: true,
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.metadata.booking_ref).toBe('ABC123');
      expect(response.data.metadata.customer_segment).toBe('premium');
    });
  });

  describe('Error Handling & Resilience', () => {
    it('should handle invalid user ID gracefully', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId: '', // Invalid
          orderId: 'order123',
          channels: ['email'],
          notificationType: 'test',
          content: {
            email: {
              subject: 'Test',
              body: 'Test',
            },
          },
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });

    it('should handle missing channels gracefully', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: [], // Empty
          notificationType: 'test',
          content: {},
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
    });

    it('should handle invalid notification type', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: ['email'],
          notificationType: 'invalid_type_xyz',
          content: {
            email: {
              subject: 'Test',
              body: 'Test',
            },
          },
        },
        { validateStatus: () => true }
      );

      // Should either accept or return helpful error
      if (response.status !== 201) {
        expect(response.data.error).toBeDefined();
      }
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/non-existent-id`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
    });

    it('should handle concurrent notification deliveries', async () => {
      const promises = Array.from({ length: 5 }).map(() =>
        axios.post(`${API_BASE_URL}/notifications`, {
          userId,
          orderId,
          channels: ['email', 'sms'],
          notificationType: 'concurrent_test',
          content: {
            email: { subject: 'Test', body: 'Test' },
            sms: { message: 'Test' },
          },
        })
      );

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(201);
        expect(response.data.id).toBeDefined();
      });

      // All should have unique IDs
      const ids = responses.map((r) => r.data.id);
      expect(new Set(ids).size).toBe(5);
    });
  });

  describe('Notification Status Lifecycle', () => {
    it('should transition from pending to sent', async () => {
      const createResponse = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'status_test',
        content: {
          email: {
            subject: 'Test',
            body: 'Test',
          },
        },
      });

      expect(createResponse.data.status).toBe('pending');

      const updateResponse = await axios.patch(
        `${API_BASE_URL}/notifications/${createResponse.data.id}`,
        {
          channel: 'email',
          status: 'sent',
          sentAt: new Date().toISOString(),
        }
      );

      expect(updateResponse.data.status).toBe('sent');
    });

    it('should track all channel statuses', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email', 'sms', 'push'],
        notificationType: 'multi_channel_status',
        content: {
          email: { subject: 'Test', body: 'Test' },
          sms: { message: 'Test' },
          push: { title: 'Test', body: 'Test' },
        },
      });

      const notification = response.data;
      expect(notification.channelStatus.email).toBe('pending');
      expect(notification.channelStatus.sms).toBe('pending');
      expect(notification.channelStatus.push).toBe('pending');
    });
  });

  describe('Notification Deletion', () => {
    it('should soft delete a notification', async () => {
      const createResponse = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'delete_test',
        content: {
          email: {
            subject: 'Test',
            body: 'Test',
          },
        },
      });

      const notifId = createResponse.data.id;

      const deleteResponse = await axios.delete(
        `${API_BASE_URL}/notifications/${notifId}`
      );

      expect(deleteResponse.status).toBe(200);

      const retrieveResponse = await axios.get(
        `${API_BASE_URL}/notifications/${notifId}`,
        { validateStatus: () => true }
      );

      expect(retrieveResponse.status).toBe(404);
    });
  });
});
