import { http, HttpResponse } from 'msw';
import type { NotificationItem } from '../../../lib/notification-types';
import { MOCK_NOTIFICATION_LIST } from './fixtures';

/**
 * MSW (Mock Service Worker) handlers for notification API endpoints
 * Provides mocked HTTP responses for API integration tests
 */

const API_BASE_URL = 'http://localhost:3000';

// Store for managing notification state during tests
let notificationsStore: Map<string, NotificationItem> = new Map();

/**
 * Initialize the notifications store with mock data
 */
export const initializeNotificationsStore = (initialNotifications: NotificationItem[] = MOCK_NOTIFICATION_LIST) => {
  notificationsStore.clear();
  initialNotifications.forEach(notif => {
    notificationsStore.set(notif.id, notif);
  });
};

/**
 * Reset the notifications store
 */
export const resetNotificationsStore = () => {
  notificationsStore.clear();
};

/**
 * Get all notifications from store
 */
export const getNotificationsFromStore = (): NotificationItem[] => {
  return Array.from(notificationsStore.values());
};

/**
 * Add notification to store
 */
export const addNotificationToStore = (notification: NotificationItem) => {
  notificationsStore.set(notification.id, notification);
};

/**
 * MSW handlers for API mocking
 */
export const handlers = [
  /**
   * GET /api/notifications - List all notifications
   * Query parameters:
   *   - page: pagination page number
   *   - limit: items per page
   *   - type: filter by notification type
   *   - status: filter by notification status
   *   - read: filter by read status (true/false)
   */
  http.get(`${API_BASE_URL}/api/notifications`, ({ request }) => {
    try {
      const url = new URL(request.url);
      const page = parseInt(url.searchParams.get('page') || '1');
      const limit = parseInt(url.searchParams.get('limit') || '20');
      const type = url.searchParams.get('type');
      const status = url.searchParams.get('status');
      const read = url.searchParams.get('read');

      let results = getNotificationsFromStore();

      // Apply filters
      if (type) {
        results = results.filter(n => n.type === type);
      }
      if (status) {
        results = results.filter(n => n.status === status);
      }
      if (read !== null) {
        const isRead = read === 'true';
        results = results.filter(n => n.read === isRead);
      }

      // Sort by date (newest first)
      results.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

      // Paginate
      const total = results.length;
      const startIndex = (page - 1) * limit;
      const paginatedResults = results.slice(startIndex, startIndex + limit);

      return HttpResponse.json({
        success: true,
        data: paginatedResults,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to fetch notifications',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * GET /api/notifications/:id - Get single notification
   */
  http.get(`${API_BASE_URL}/api/notifications/:id`, ({ params }) => {
    try {
      const { id } = params;
      const notification = notificationsStore.get(id as string);

      if (!notification) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Notification not found',
          },
          { status: 404 }
        );
      }

      return HttpResponse.json({
        success: true,
        data: notification,
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to fetch notification',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * PATCH /api/notifications/:id/read - Mark notification as read
   */
  http.patch(`${API_BASE_URL}/api/notifications/:id/read`, ({ params }) => {
    try {
      const { id } = params;
      const notification = notificationsStore.get(id as string);

      if (!notification) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Notification not found',
          },
          { status: 404 }
        );
      }

      const updatedNotification = { ...notification, read: true };
      notificationsStore.set(id as string, updatedNotification);

      return HttpResponse.json({
        success: true,
        data: updatedNotification,
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to mark notification as read',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * PATCH /api/notifications/:id/unread - Mark notification as unread
   */
  http.patch(`${API_BASE_URL}/api/notifications/:id/unread`, ({ params }) => {
    try {
      const { id } = params;
      const notification = notificationsStore.get(id as string);

      if (!notification) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Notification not found',
          },
          { status: 404 }
        );
      }

      const updatedNotification = { ...notification, read: false };
      notificationsStore.set(id as string, updatedNotification);

      return HttpResponse.json({
        success: true,
        data: updatedNotification,
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to mark notification as unread',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * POST /api/notifications/search - Search notifications
   * Request body: { query: string }
   */
  http.post(`${API_BASE_URL}/api/notifications/search`, async ({ request }) => {
    try {
      const body = await request.json() as { query: string };
      const query = body.query?.toLowerCase() || '';

      if (!query) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Search query is required',
          },
          { status: 400 }
        );
      }

      const results = getNotificationsFromStore().filter(
        n =>
          n.title.toLowerCase().includes(query) ||
          n.description.toLowerCase().includes(query) ||
          (n.passengerName?.toLowerCase().includes(query) ?? false) ||
          (n.remarks?.toLowerCase().includes(query) ?? false)
      );

      return HttpResponse.json({
        success: true,
        data: results,
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to search notifications',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * PATCH /api/notifications/bulk-read - Mark multiple notifications as read
   * Request body: { ids: string[] }
   */
  http.patch(`${API_BASE_URL}/api/notifications/bulk-read`, async ({ request }) => {
    try {
      const body = await request.json() as { ids: string[] };
      const ids = body.ids || [];

      if (!Array.isArray(ids) || ids.length === 0) {
        return HttpResponse.json(
          {
            success: false,
            error: 'IDs array is required and must not be empty',
          },
          { status: 400 }
        );
      }

      const updatedNotifications: NotificationItem[] = [];

      ids.forEach(id => {
        const notification = notificationsStore.get(id);
        if (notification) {
          const updated = { ...notification, read: true };
          notificationsStore.set(id, updated);
          updatedNotifications.push(updated);
        }
      });

      return HttpResponse.json({
        success: true,
        data: updatedNotifications,
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to update notifications',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * DELETE /api/notifications/:id - Delete a notification
   */
  http.delete(`${API_BASE_URL}/api/notifications/:id`, ({ params }) => {
    try {
      const { id } = params;
      const exists = notificationsStore.has(id as string);

      if (!exists) {
        return HttpResponse.json(
          {
            success: false,
            error: 'Notification not found',
          },
          { status: 404 }
        );
      }

      notificationsStore.delete(id as string);

      return HttpResponse.json({
        success: true,
        message: 'Notification deleted successfully',
      });
    } catch (error) {
      return HttpResponse.json(
        {
          success: false,
          error: 'Failed to delete notification',
        },
        { status: 500 }
      );
    }
  }),

  /**
   * Error handler - for testing error scenarios
   */
  http.get(`${API_BASE_URL}/api/notifications/error/test`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Test error response',
      },
      { status: 500 }
    );
  }),
];

// Export error handlers for testing error scenarios
export const errorHandlers = [
  http.get(`${API_BASE_URL}/api/notifications`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }),

  http.patch(`${API_BASE_URL}/api/notifications/:id/read`, () => {
    return HttpResponse.json(
      {
        success: false,
        error: 'Failed to update notification',
      },
      { status: 500 }
    );
  }),
];
