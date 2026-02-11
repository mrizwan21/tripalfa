import { faker } from '@faker-js/faker';
import type { NotificationItem } from '../../../lib/notification-types';

/**
 * Mock notification fixtures for comprehensive testing
 * Includes all notification types, statuses, and edge cases
 */

// Notification type options
export const NOTIFICATION_TYPES = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'] as const;
export const NOTIFICATION_STATUSES = ['PENDING', 'CONFIRMED', 'REJECTED', 'INFO', 'CANCELLED'] as const;

/**
 * Factory function to create mock notifications with optional overrides
 * Allows flexible test data generation
 */
export const createMockNotification = (
  overrides?: Partial<NotificationItem>
): NotificationItem => {
  const baseNotification: NotificationItem = {
    id: faker.string.uuid(),
    type: faker.helpers.arrayElement(['SUCCESS', 'INFO', 'WARNING', 'ERROR']),
    title: faker.commerce.productName(),
    description: faker.commerce.productDescription().slice(0, 100),
    when: faker.date.recent().toISOString(),
    read: faker.datatype.boolean(),
    status: faker.helpers.arrayElement(['PENDING', 'CONFIRMED', 'REJECTED', 'INFO', 'CANCELLED']),
  };

  return {
    ...baseNotification,
    ...(faker.datatype.boolean() && { passengerName: faker.person.fullName() }),
    ...(faker.datatype.boolean() && { segment: `${faker.location.city()} - ${faker.location.city()}` }),
    ...(faker.datatype.boolean() && { price: faker.number.float({ min: 10, max: 1000, precision: 0.01 }) }),
    ...(faker.datatype.boolean() && { currency: faker.finance.currencyCode() }),
    ...(faker.datatype.boolean() && { remarks: faker.lorem.sentence().slice(0, 50) }),
    ...overrides,
  };
};

/**
 * Pre-configured mock notifications covering all scenarios
 */
export const MOCK_SSR_NOTIFICATION: NotificationItem = {
  id: 'notif-ssr-1',
  type: 'SUCCESS',
  title: 'Special Service Request Accepted',
  description: 'Wheelchair assistance has been added to your booking',
  when: new Date(Date.now() - 3600000).toISOString(),
  read: false,
  status: 'CONFIRMED',
  passengerName: 'John Doe',
  segment: 'JFK - LHR',
  price: 0,
  currency: 'USD',
};

export const MOCK_ITINERARY_CHANGE_NOTIFICATION: NotificationItem = {
  id: 'notif-itinerary-1',
  type: 'WARNING',
  title: 'Itinerary Change Notification',
  description: 'Flight EY123 departure time has been changed from 10:00 to 10:30 AM',
  when: new Date(Date.now() - 1800000).toISOString(),
  read: false,
  status: 'INFO',
  segment: 'LHR - CDG',
};

export const MOCK_CONFIRMATION_NOTIFICATION: NotificationItem = {
  id: 'notif-conf-1',
  type: 'SUCCESS',
  title: 'Booking Confirmation',
  description: 'Your booking has been successfully confirmed. Confirmation code: TR-123456',
  when: new Date(Date.now() - 900000).toISOString(),
  read: true,
  status: 'CONFIRMED',
};

export const MOCK_AMENDMENT_NOTIFICATION: NotificationItem = {
  id: 'notif-amend-1',
  type: 'INFO',
  title: 'Amendment Request',
  description: 'Request to change return flight date to 25 Oct 2024',
  when: new Date(Date.now() - 450000).toISOString(),
  read: false,
  status: 'PENDING',
  passengerName: 'Jane Smith',
  remarks: 'Pending supplier approval',
};

export const MOCK_REJECTED_AMENDMENT_NOTIFICATION: NotificationItem = {
  id: 'notif-amend-reject-1',
  type: 'ERROR',
  title: 'Amendment Request Rejected',
  description: 'Your request to change the flight date could not be processed',
  when: new Date(Date.now() - 518400000).toISOString(),
  read: false,
  status: 'REJECTED',
  remarks: 'No seats available in the same cabin class',
};

export const MOCK_SYSTEM_NOTIFICATION: NotificationItem = {
  id: 'notif-system-1',
  type: 'INFO',
  title: 'System Maintenance',
  description: 'The booking system will undergo maintenance on 2024-03-15 from 22:00 to 23:00 UTC',
  when: new Date(Date.now() - 120000).toISOString(),
  read: true,
  status: 'INFO',
};

export const MOCK_CANCELLED_NOTIFICATION: NotificationItem = {
  id: 'notif-cancel-1',
  type: 'WARNING',
  title: 'Booking Cancelled',
  description: 'Your booking has been cancelled as requested',
  when: new Date(Date.now() - 86400000).toISOString(),
  read: true,
  status: 'CANCELLED',
};

export const MOCK_MEAL_REQUEST_NOTIFICATION: NotificationItem = {
  id: 'notif-meal-1',
  type: 'INFO',
  title: 'Special Meal Request',
  description: 'Asian Veg-Meal requested for your booking',
  when: new Date(Date.now() - 172800000).toISOString(),
  read: false,
  status: 'CONFIRMED',
  passengerName: 'Ahmed Hassan',
  segment: 'DXB - JFK',
  price: 50,
  currency: 'AED',
};

export const MOCK_SEAT_SELECTION_NOTIFICATION: NotificationItem = {
  id: 'notif-seat-1',
  type: 'SUCCESS',
  title: 'Seat Selection Confirmed',
  description: 'Seat 1A selected and reserved for your booking',
  when: new Date(Date.now() - 259200000).toISOString(),
  read: true,
  status: 'CONFIRMED',
  passengerName: 'Sarah Johnson',
  segment: 'LHR - BKK',
  price: 25,
  currency: 'GBP',
};

export const MOCK_REFUND_NOTIFICATION: NotificationItem = {
  id: 'notif-refund-1',
  type: 'SUCCESS',
  title: 'Refund Processed',
  description: 'Your refund of $500.00 has been processed successfully',
  when: new Date(Date.now() - 345600000).toISOString(),
  read: false,
  status: 'CONFIRMED',
  price: 500,
  currency: 'USD',
};

/**
 * Pre-configured batch of notifications for list testing
 */
export const MOCK_NOTIFICATION_LIST: NotificationItem[] = [
  MOCK_SSR_NOTIFICATION,
  MOCK_ITINERARY_CHANGE_NOTIFICATION,
  MOCK_CONFIRMATION_NOTIFICATION,
  MOCK_AMENDMENT_NOTIFICATION,
  MOCK_REJECTED_AMENDMENT_NOTIFICATION,
  MOCK_SYSTEM_NOTIFICATION,
  MOCK_CANCELLED_NOTIFICATION,
  MOCK_MEAL_REQUEST_NOTIFICATION,
  MOCK_SEAT_SELECTION_NOTIFICATION,
  MOCK_REFUND_NOTIFICATION,
];

/**
 * Get filtered list of unread notifications
 */
export const getUnreadNotifications = (notifications: NotificationItem[]): NotificationItem[] => {
  return notifications.filter(notif => !notif.read);
};

/**
 * Get notification count by status
 */
export const getNotificationCountByStatus = (
  notifications: NotificationItem[],
  status: NotificationItem['status']
): number => {
  return notifications.filter(notif => notif.status === status).length;
};

/**
 * Get notification count by type
 */
export const getNotificationCountByType = (
  notifications: NotificationItem[],
  type: NotificationItem['type']
): number => {
  return notifications.filter(notif => notif.type === type).length;
};

/**
 * Sort notifications by date (newest first)
 */
export const sortNotificationsByDateNewest = (notifications: NotificationItem[]): NotificationItem[] => {
  return [...notifications].sort((a, b) => {
    return new Date(b.when).getTime() - new Date(a.when).getTime();
  });
};

/**
 * Sort notifications by date (oldest first)
 */
export const sortNotificationsByDateOldest = (notifications: NotificationItem[]): NotificationItem[] => {
  return [...notifications].sort((a, b) => {
    return new Date(a.when).getTime() - new Date(b.when).getTime();
  });
};

/**
 * Filter notifications by type
 */
export const filterNotificationsByType = (
  notifications: NotificationItem[],
  type: NotificationItem['type']
): NotificationItem[] => {
  return notifications.filter(notif => notif.type === type);
};

/**
 * Filter notifications by status
 */
export const filterNotificationsByStatus = (
  notifications: NotificationItem[],
  status: NotificationItem['status']
): NotificationItem[] => {
  return notifications.filter(notif => notif.status === status);
};

/**
 * Search notifications by title and description
 */
export const searchNotifications = (
  notifications: NotificationItem[],
  query: string
): NotificationItem[] => {
  const lowerCaseQuery = query.toLowerCase();
  return notifications.filter(
    notif =>
      notif.title.toLowerCase().includes(lowerCaseQuery) ||
      notif.description.toLowerCase().includes(lowerCaseQuery) ||
      (notif.passengerName?.toLowerCase().includes(lowerCaseQuery) ?? false)
  );
};

/**
 * Paginate notifications
 */
export const paginateNotifications = (
  notifications: NotificationItem[],
  page: number,
  pageSize: number = 10
): NotificationItem[] => {
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  return notifications.slice(startIndex, endIndex);
};

/**
 * Get total pages for pagination
 */
export const getTotalPages = (totalItems: number, pageSize: number = 10): number => {
  return Math.ceil(totalItems / pageSize);
};

/**
 * Get notification by ID
 */
export const getNotificationById = (
  notifications: NotificationItem[],
  id: string
): NotificationItem | undefined => {
  return notifications.find(notif => notif.id === id);
};

/**
 * Mark notification as read
 */
export const markNotificationAsRead = (
  notifications: NotificationItem[],
  id: string
): NotificationItem[] => {
  return notifications.map(notif =>
    notif.id === id ? { ...notif, read: true } : notif
  );
};

/**
 * Mark multiple notifications as read
 */
export const markNotificationsAsRead = (
  notifications: NotificationItem[],
  ids: string[]
): NotificationItem[] => {
  const idSet = new Set(ids);
  return notifications.map(notif =>
    idSet.has(notif.id) ? { ...notif, read: true } : notif
  );
};

/**
 * Mark notification as unread
 */
export const markNotificationAsUnread = (
  notifications: NotificationItem[],
  id: string
): NotificationItem[] => {
  return notifications.map(notif =>
    notif.id === id ? { ...notif, read: false } : notif
  );
};

/**
 * Get unread notification count
 */
export const getUnreadNotificationCount = (notifications: NotificationItem[]): number => {
  return notifications.filter(notif => !notif.read).length;
};

/**
 * Create notifications with specific date ranges for testing
 */
export const createNotificationWithDate = (
  daysAgo: number,
  overrides?: Partial<NotificationItem>
): NotificationItem => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  
  return createMockNotification({
    when: date.toISOString(),
    ...overrides,
  });
};

/**
 * Create a batch of notifications for a specific date range
 */
export const createNotificationBatch = (
  count: number,
  dateRangeStart: number = 0,
  dateRangeEnd: number = 30
): NotificationItem[] => {
  return Array.from({ length: count }, (_, i) => {
    const daysAgo = Math.floor(Math.random() * (dateRangeEnd - dateRangeStart) + dateRangeStart);
    return createNotificationWithDate(daysAgo);
  });
};

/**
 * Mock API response for notifications list endpoint
 */
export const createMockApiResponse = (notifications: NotificationItem[] = MOCK_NOTIFICATION_LIST) => {
  return {
    success: true,
    data: notifications,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock API response for single notification endpoint
 */
export const createMockSingleNotificationResponse = (notification: NotificationItem) => {
  return {
    success: true,
    data: notification,
    timestamp: new Date().toISOString(),
  };
};

/**
 * Mock API error response
 */
export const createMockErrorResponse = (message: string = 'Internal server error') => {
  return {
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  };
};
