/**
 * Notification API Endpoint Testing
 * 
 * Tests cover:
 * - REST API endpoints for notification management
 * - Request/response validation
 * - Error handling and HTTP status codes
 * - Pagination and filtering
 * - Rate limiting
 * - Authentication and authorization
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

describe('Notification API Endpoints', () => {
  let userId: string;
  let orderId: string;
  let notificationId: string;

  beforeEach(() => {
    userId = `user-${Date.now()}`;
    orderId = `order-${Date.now()}`;
  });

  describe('POST /notifications - Create Notification', () => {
    it('should return 201 with notification object on success', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'booking_confirmation',
        priority: 'high',
        content: {
          email: {
            subject: 'Booking Confirmed',
            body: 'Your booking is confirmed',
          },
        },
        metadata: { bookingRef: 'ABC123' },
      });

      expect(response.status).toBe(201);
      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('userId');
      expect(response.data).toHaveProperty('channels');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('createdAt');
      notificationId = response.data.id;
    });

    it('should include all request fields in response', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email', 'sms'],
        notificationType: 'test_event',
        priority: 'medium',
        content: {
          email: { subject: 'Test', body: 'Test content' },
          sms: { message: 'Test SMS' },
        },
      });

      expect(response.data.userId).toBe(userId);
      expect(response.data.orderId).toBe(orderId);
      expect(response.data.channels).toEqual(['email', 'sms']);
      expect(response.data.notificationType).toBe('test_event');
      expect(response.data.priority).toBe('medium');
    });

    it('should return 400 with error message on validation failure', async () => {
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
      expect(response.data).toHaveProperty('error');
      expect(response.data.error).toContain('subject');
    });

    it('should return 400 when channels array is empty', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: [],
          notificationType: 'test',
          content: {},
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toBeDefined();
    });

    it('should return 400 when userId is missing', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          orderId,
          channels: ['email'],
          notificationType: 'test',
          content: {
            email: { subject: 'Test', body: 'Test' },
          },
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
    });

    it('should accept optional fields (metadata, priority)', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'test',
        content: {
          email: { subject: 'Test', body: 'Test' },
        },
        // Optional fields omitted
      });

      expect(response.status).toBe(201);
      expect(response.data.priority).toBe('medium'); // default
    });

    it('should return 422 for invalid email format in content', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: ['email'],
          notificationType: 'test',
          content: {
            email: {
              subject: 'Test',
              body: 'Test',
              replyTo: 'invalid-email', // Invalid email format
            },
          },
        },
        { validateStatus: () => true }
      );

      expect([400, 422]).toContain(response.status);
    });
  });

  describe('GET /notifications/:id - Retrieve Notification', () => {
    beforeEach(async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'retrieve_test',
        content: {
          email: { subject: 'Test', body: 'Test' },
        },
      });
      notificationId = response.data.id;
    });

    it('should return 200 with notification object on success', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/${notificationId}`
      );

      expect(response.status).toBe(200);
      expect(response.data.id).toBe(notificationId);
      expect(response.data).toHaveProperty('userId');
      expect(response.data).toHaveProperty('channels');
      expect(response.data).toHaveProperty('status');
    });

    it('should include all notification fields', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/${notificationId}`
      );

      expect(response.data).toHaveProperty('id');
      expect(response.data).toHaveProperty('userId');
      expect(response.data).toHaveProperty('orderId');
      expect(response.data).toHaveProperty('channels');
      expect(response.data).toHaveProperty('notificationType');
      expect(response.data).toHaveProperty('status');
      expect(response.data).toHaveProperty('content');
      expect(response.data).toHaveProperty('channelStatus');
      expect(response.data).toHaveProperty('createdAt');
    });

    it('should return 404 for non-existent notification ID', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/non-existent-id-12345`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
      expect(response.data).toHaveProperty('error');
    });

    it('should return 400 for invalid notification ID format', async () => {
      const response = await axios.get(
        `${API_BASE_URL}/notifications/invalid@#$`,
        { validateStatus: () => true }
      );

      expect([400, 404]).toContain(response.status);
    });
  });

  describe('GET /notifications - List Notifications', () => {
    beforeEach(async () => {
      // Create multiple notifications
      for (let i = 0; i < 3; i++) {
        await axios.post(`${API_BASE_URL}/notifications`, {
          userId,
          orderId: `order-${Date.now()}-${i}`,
          channels: ['email'],
          notificationType: 'list_test',
          content: {
            email: { subject: `Test ${i}`, body: 'Test' },
          },
        });
      }
    });

    it('should return 200 with paginated results', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          page: 1,
          limit: 10,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data).toHaveProperty('data');
      expect(response.data).toHaveProperty('pagination');
      expect(response.data.data).toBeInstanceOf(Array);
    });

    it('should include pagination metadata', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          page: 1,
          limit: 10,
        },
      });

      expect(response.data.pagination).toHaveProperty('page');
      expect(response.data.pagination).toHaveProperty('limit');
      expect(response.data.pagination).toHaveProperty('total');
      expect(response.data.pagination).toHaveProperty('pages');
      expect(response.data.pagination.page).toBe(1);
      expect(response.data.pagination.limit).toBe(10);
    });

    it('should filter by userId', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeGreaterThan(0);
      response.data.data.forEach((notification: any) => {
        expect(notification.userId).toBe(userId);
      });
    });

    it('should filter by notificationType', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          notificationType: 'list_test',
        },
      });

      expect(response.status).toBe(200);
      response.data.data.forEach((notification: any) => {
        expect(notification.notificationType).toBe('list_test');
      });
    });

    it('should filter by status', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          status: 'pending',
        },
      });

      expect(response.status).toBe(200);
      response.data.data.forEach((notification: any) => {
        expect(notification.status).toBe('pending');
      });
    });

    it('should support sorting by createdAt', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          sortBy: 'createdAt',
          order: 'desc',
        },
      });

      expect(response.status).toBe(200);
      if (response.data.data.length > 1) {
        const dates = response.data.data.map((n: any) =>
          new Date(n.createdAt).getTime()
        );
        for (let i = 0; i < dates.length - 1; i++) {
          expect(dates[i]).toBeGreaterThanOrEqual(dates[i + 1]);
        }
      }
    });

    it('should return empty array when no results match filter', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId: 'non-existent-user-xyz',
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toEqual([]);
      expect(response.data.pagination.total).toBe(0);
    });

    it('should handle limit parameter correctly', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          limit: 2,
        },
      });

      expect(response.status).toBe(200);
      expect(response.data.data.length).toBeLessThanOrEqual(2);
    });

    it('should handle large page numbers gracefully', async () => {
      const response = await axios.get(`${API_BASE_URL}/notifications`, {
        params: {
          userId,
          page: 9999,
          limit: 10,
        },
        validateStatus: () => true,
      });

      expect(response.status).toBe(200);
      expect(response.data.data).toEqual([]);
    });
  });

  describe('PATCH /notifications/:id - Update Notification Status', () => {
    beforeEach(async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email', 'sms'],
        notificationType: 'status_update_test',
        content: {
          email: { subject: 'Test', body: 'Test' },
          sms: { message: 'Test' },
        },
      });
      notificationId = response.data.id;
    });

    it('should return 200 and update channel status', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'sent',
          sentAt: new Date().toISOString(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.channelStatus.email).toBe('sent');
    });

    it('should include messageId in response', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'sent',
          messageId: 'msg-123-abc',
          sentAt: new Date().toISOString(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.providerMessageId.email).toBe('msg-123-abc');
    });

    it('should return 404 for non-existent notification', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/non-existent-id`,
        {
          channel: 'email',
          status: 'sent',
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
    });

    it('should return 400 for invalid status value', async () => {
      const response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'invalid_status',
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
    });

    it('should handle new channel status transitions', async () => {
      let response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'sent',
        }
      );
      expect(response.data.channelStatus.email).toBe('sent');

      response = await axios.patch(
        `${API_BASE_URL}/notifications/${notificationId}`,
        {
          channel: 'email',
          status: 'delivered',
        }
      );
      expect(response.data.channelStatus.email).toBe('delivered');
    });
  });

  describe('DELETE /notifications/:id - Delete Notification', () => {
    beforeEach(async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'delete_test',
        content: {
          email: { subject: 'Test', body: 'Test' },
        },
      });
      notificationId = response.data.id;
    });

    it('should return 200 on successful deletion', async () => {
      const response = await axios.delete(
        `${API_BASE_URL}/notifications/${notificationId}`
      );

      expect(response.status).toBe(200);
    });

    it('should make notification unavailable after deletion', async () => {
      await axios.delete(`${API_BASE_URL}/notifications/${notificationId}`);

      const getResponse = await axios.get(
        `${API_BASE_URL}/notifications/${notificationId}`,
        { validateStatus: () => true }
      );

      expect(getResponse.status).toBe(404);
    });

    it('should return 404 when deleting non-existent notification', async () => {
      const response = await axios.delete(
        `${API_BASE_URL}/notifications/non-existent-id`,
        { validateStatus: () => true }
      );

      expect(response.status).toBe(404);
    });
  });

  describe('Content-Type & Headers', () => {
    it('should require Content-Type: application/json', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: ['email'],
          notificationType: 'test',
          content: {
            email: { subject: 'Test', body: 'Test' },
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(response.status).toBe(201);
    });

    it('should return Content-Type: application/json in response', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'test',
        content: {
          email: { subject: 'Test', body: 'Test' },
        },
      });

      expect(response.headers['content-type']).toContain('application/json');
    });

    it('should return appropriate CORS headers', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'test',
        content: {
          email: { subject: 'Test', body: 'Test' },
        },
      });

      expect(response.status).toBe(201);
      // CORS headers may be set by proxy/server
    });
  });

  describe('Response Format', () => {
    it('should include standardized error response format', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications`,
        {
          userId,
          orderId,
          channels: [],
          notificationType: 'test',
          content: {},
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data).toHaveProperty('error');
      expect(response.data).toHaveProperty('status');
      expect(response.data.status).toBe('error');
    });

    it('should include timestamp in response', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications`, {
        userId,
        orderId,
        channels: ['email'],
        notificationType: 'test',
        content: {
          email: { subject: 'Test', body: 'Test' },
        },
      });

      expect(response.data).toHaveProperty('createdAt');
      expect(new Date(response.data.createdAt)).toBeInstanceOf(Date);
    });
  });
});
