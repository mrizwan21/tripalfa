import { NotificationItem } from '../../lib/notification-types';

/**
 * Mock notification factory function
 * Creates test notifications with default or custom values
 */
export function createMockNotification(overrides?: Partial<NotificationItem>): NotificationItem {
  const defaults: NotificationItem = {
    id: `notif-${Date.now()}`,
    type: 'SUCCESS',
    title: 'Test Notification',
    description: 'This is a test notification',
    when: new Date().toISOString(),
    read: false,
  };

  return { ...defaults, ...overrides };
}

/**
 * Create multiple mock notifications
 */
export function createMockNotifications(count: number): NotificationItem[] {
  return Array.from({ length: count }, (_, i) =>
    createMockNotification({
      id: `notif-${i}`,
      title: `Notification ${i}`,
      read: i % 2 === 0, // Alternate between read and unread
    })
  );
}

/**
 * Create mock SUCCESS notification
 */
export function createMockSuccessNotification(overrides?: Partial<NotificationItem>): NotificationItem {
  return createMockNotification({
    type: 'SUCCESS',
    title: 'Operation Successful',
    description: 'Your request completed successfully',
    status: 'CONFIRMED',
    ...overrides,
  });
}

/**
 * Create mock INFO notification
 */
export function createMockInfoNotification(
  overrides?: Partial<NotificationItem>
): NotificationItem {
  return createMockNotification({
    type: 'INFO',
    title: 'Information Update',
    description: 'Here is some important information',
    status: 'INFO',
    ...overrides,
  });
}

/**
 * Create mock WARNING notification
 */
export function createMockWarningNotification(
  overrides?: Partial<NotificationItem>
): NotificationItem {
  return createMockNotification({
    type: 'WARNING',
    title: 'Warning Alert',
    description: 'Please review this important warning',
    status: 'PENDING',
    ...overrides,
  });
}

/**
 * Create mock ERROR notification
 */
export function createMockErrorNotification(
  overrides?: Partial<NotificationItem>
): NotificationItem {
  return createMockNotification({
    type: 'ERROR',
    title: 'Error Occurred',
    description: 'An error has occurred',
    status: 'REJECTED',
    ...overrides,
  });
}

/**
 * Group notifications by status
 */
export function groupNotificationsByStatus(
  notifications: NotificationItem[]
): { [key: string]: NotificationItem[] } {
  return notifications.reduce(
    (acc, notification) => {
      const status = notification.status;
      if (!acc[status]) {
        acc[status] = [];
      }
      acc[status].push(notification);
      return acc;
    },
    {} as { [key: string]: NotificationItem[] }
  );
}

/**
 * Group notifications by type
 */
export function groupNotificationsByType(
  notifications: NotificationItem[]
): { [key: string]: NotificationItem[] } {
  return notifications.reduce(
    (acc, notification) => {
      const type = notification.type;
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(notification);
      return acc;
    },
    {} as { [key: string]: NotificationItem[] }
  );
}

/**
 * Filter unread notifications
 */
export function getUnreadNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return notifications.filter((n) => !n.read);
}

/**
 * Filter read notifications
 */
export function getReadNotifications(notifications: NotificationItem[]): NotificationItem[] {
  return notifications.filter((n) => n.read);
}

/**
 * Sort notifications by date descending (newest first)
 */
export function sortNotificationsByDateDesc(notifications: NotificationItem[]): NotificationItem[] {
  return [...notifications].sort(
    (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
  );
}

/**
 * Sort notifications by date ascending (oldest first)
 */
export function sortNotificationsByDateAsc(notifications: NotificationItem[]): NotificationItem[] {
  return [...notifications].sort(
    (a, b) => new Date(a.when).getTime() - new Date(b.when).getTime()
  );
}

/**
 * Get unread count
 */
export function getUnreadCount(notifications: NotificationItem[]): number {
  return notifications.filter((n) => !n.read).length;
}

/**
 * Check if notification should be highlighted
 */
export function shouldHighlightNotification(notification: NotificationItem): boolean {
  return !notification.read || notification.status === 'PENDING';
}

/**
 * Format notification date for display
 */
export function formatNotificationDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Get status badge styling
 */
export function getStatusBadgeClass(status: string): string {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-emerald-50 text-emerald-600 border-emerald-100';
    case 'PENDING':
      return 'bg-amber-50 text-amber-600 border-amber-100';
    case 'REJECTED':
      return 'bg-rose-50 text-rose-600 border-rose-100';
    case 'INFO':
      return 'bg-primary/5 text-primary border-primary/10';
    case 'CANCELLED':
      return 'bg-slate-50 text-slate-600 border-slate-100';
    default:
      return 'bg-slate-50 text-slate-600 border-slate-100';
  }
}

/**
 * Get notification type icon class
 */
export function getNotificationTypeIcon(type: string): string {
  switch (type) {
    case 'SSR':
      return 'utensils';
    case 'ITINERARY_CHANGE':
      return 'calendar';
    case 'CONFIRMATION':
      return 'check-circle';
    case 'AMENDMENT':
      return 'edit';
    case 'SYSTEM':
      return 'info';
    default:
      return 'bell';
  }
}
