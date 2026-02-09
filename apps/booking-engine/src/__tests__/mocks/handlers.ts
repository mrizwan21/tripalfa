import { http, HttpResponse } from 'msw';
import { faker } from '@faker-js/faker';
import type { NotificationItem } from '../../../types/notification-types';

const BASE_URL = 'http://localhost:3000';

// Mock notification factory
export const createMockNotification = (overrides?: Partial<NotificationItem>): NotificationItem => {
  const types: NotificationItem['type'][] = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'];
  const statuses: NotificationItem['status'][] = ['PENDING', 'CONFIRMED', 'REJECTED', 'INFO', 'CANCELLED'];
  
  return {
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(types),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription(),
    when: faker.date.recent().toISOString(),
    read: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(statuses),
    ...(faker.datatype.boolean() && { passengerName: faker.person.fullName() }),
    ...(faker.datatype.boolean() && { segment: faker.location.city() }),
    ...(faker.datatype.boolean() && { price: faker.number.float({ min: 10, max: 1000, precision: 0.01 }) }),
    ...(faker.datatype.boolean() && { currency: faker.finance.currencyCode() }),
    ...(faker.datatype.boolean() && { remarks: faker.lorem.sentence() }),
    ...overrides,
  };
};

// Store to track notifications in memory
let notificationsStore: Map<string, NotificationItem> = new Map();

// Initialize with some mock notifications
const initializeStore = () => {
  const initialNotifications = [
    createMockNotification({
      id: 'notif-1',
      type: 'SUCCESS',
      title: 'Booking Confirmed',
      description: 'Your flight booking has been confirmed',
      read: false,
      status: 'CONFIRMED',
    }),
    createMockNotification({
      id: 'notif-2',
      type: 'INFO',
      title: 'Special Service Request',
      description: 'Wheelchair assistance has been added',
      read: true,
      status: 'PENDING',
      passengerName: 'John Doe',
    }),
    createMockNotification({
      id: 'notif-3',
      type: 'WARNING',
      title: 'Schedule Change',
      description: 'Your flight time has been changed',
      read: false,
      status: 'REJECTED',
      remarks: 'Please update your calendar',
    }),
  ];

  notificationsStore.clear();
  initialNotifications.forEach((notif) => {
    notificationsStore.set(notif.id, notif);
  });
};

// Initialize on module load
initializeStore();

export const handlers = [
  // GET /api/notifications
  http.get(`${BASE_URL}/api/notifications`, ({ request }) => {
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1', 10);
    const pageSize = parseInt(url.searchParams.get('pageSize') || '10', 10);
    const type = url.searchParams.get('type');
    const status = url.searchParams.get('status');
    const search = url.searchParams.get('search');

    let notifications = Array.from(notificationsStore.values());

    // Apply filters
    if (type) {
      notifications = notifications.filter((n) => n.type === type);
    }

    if (status) {
      notifications = notifications.filter((n) => n.status === status);
    }

    if (search) {
      const searchLower = search.toLowerCase();
      notifications = notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(searchLower) ||
          n.description.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date (newest first)
    notifications.sort((a, b) => new Date(b.when).getTime() - new Date(a.when).getTime());

    // Paginate
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const paginatedNotifications = notifications.slice(start, end);

    return HttpResponse.json({
      data: paginatedNotifications,
      metadata: {
        total: notifications.length,
        page,
        pageSize,
        totalPages: Math.ceil(notifications.length / pageSize),
      },
    });
  }),

  // GET /api/notifications/:id
  http.get(`${BASE_URL}/api/notifications/:id`, ({ params }) => {
    const { id } = params;
    const notification = notificationsStore.get(id as string);

    if (!notification) {
      return HttpResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    return HttpResponse.json(notification);
  }),

  // POST /api/notifications/:id/read
  http.post(`${BASE_URL}/api/notifications/:id/read`, ({ params }) => {
    const { id } = params;
    const notification = notificationsStore.get(id as string);

    if (!notification) {
      return HttpResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notification.read = true;
    notificationsStore.set(id as string, notification);

    return HttpResponse.json(notification);
  }),

  // POST /api/notifications/mark-read (bulk)
  http.post(`${BASE_URL}/api/notifications/mark-read`, async ({ request }) => {
    const body = await request.json() as { ids?: string[] };
    const ids = body.ids || [];

    ids.forEach((id) => {
      const notification = notificationsStore.get(id);
      if (notification) {
        notification.read = true;
        notificationsStore.set(id, notification);
      }
    });

    return HttpResponse.json({ success: true });
  }),

  // GET /api/notifications/unread-count
  http.get(`${BASE_URL}/api/notifications/unread-count`, () => {
    const unreadCount = Array.from(notificationsStore.values()).filter((n) => !n.read).length;

    return HttpResponse.json({ count: unreadCount });
  }),

  // DELETE /api/notifications/:id
  http.delete(`${BASE_URL}/api/notifications/:id`, ({ params }) => {
    const { id } = params;

    if (!notificationsStore.has(id as string)) {
      return HttpResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    notificationsStore.delete(id as string);

    return HttpResponse.json({ success: true });
  }),

  // Error simulation endpoints for testing
  http.get(`${BASE_URL}/api/notifications/error/500`, () => {
    return HttpResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }),

  http.get(`${BASE_URL}/api/notifications/error/timeout`, async () => {
    await new Promise((resolve) => setTimeout(resolve, 10000));
    return HttpResponse.json({ data: [] });
  }),

  http.get(`${BASE_URL}/api/notifications/error/network`, () => {
    return HttpResponse.error();
  }),
];

// Helper to reset store
export const resetNotificationsStore = () => {
  initializeStore();
};

// Helper to add notification
export const addMockNotification = (notification: NotificationItem) => {
  notificationsStore.set(notification.id, notification);
};

// Helper to get all notifications
export const getAllMockNotifications = () => {
  return Array.from(notificationsStore.values());
};

// Helper to clear store
export const clearMockNotifications = () => {
  notificationsStore.clear();
};
