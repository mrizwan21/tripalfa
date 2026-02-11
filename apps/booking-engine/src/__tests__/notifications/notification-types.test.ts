import { describe, it, expect, beforeEach } from 'vitest';
import type { NotificationItem } from '../../../lib/notification-types';
import {
  MOCK_NOTIFICATION_LIST,
  MOCK_SSR_NOTIFICATION,
  MOCK_CONFIRMATION_NOTIFICATION,
  MOCK_REJECTED_AMENDMENT_NOTIFICATION,
  MOCK_SYSTEM_NOTIFICATION,
  getUnreadNotifications,
  getNotificationCountByStatus,
  getNotificationCountByType,
  sortNotificationsByDateNewest,
  filterNotificationsByType,
  filterNotificationsByStatus,
  searchNotifications,
  createMockNotification,
  getUnreadNotificationCount,
} from './__mocks__/fixtures';

/**
 * Test suite for Notification types and validation
 * Validates notification data structures, types, and utility functions
 */

describe('Notification Types and Validation', () => {
  describe('Notification Structure Validation', () => {
    /**
     * Test 1: Verify all notification types are defined correctly
     * Tests that notifications have required fields and correct types
     */
    it('should have all required notification fields', () => {
      MOCK_NOTIFICATION_LIST.forEach(notification => {
        // Validate required fields
        expect(notification).toHaveProperty('id');
        expect(notification).toHaveProperty('type');
        expect(notification).toHaveProperty('title');
        expect(notification).toHaveProperty('description');
        expect(notification).toHaveProperty('when');
        expect(notification).toHaveProperty('read');
        expect(notification).toHaveProperty('status');

        // Validate field types
        expect(typeof notification.id).toBe('string');
        expect(typeof notification.type).toBe('string');
        expect(typeof notification.title).toBe('string');
        expect(typeof notification.description).toBe('string');
        expect(typeof notification.when).toBe('string');
        expect(typeof notification.read).toBe('boolean');
        expect(typeof notification.status).toBe('string');

        // Validate that dates are ISO strings
        expect(new Date(notification.when)).toBeInstanceOf(Date);
        expect(isNaN(new Date(notification.when).getTime())).toBe(false);
      });
    });

    /**
     * Test 2: Verify all notification statuses are valid
     * Tests that status field only contains allowed values
     */
    it('should only have valid notification statuses', () => {
      const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'INFO', 'CANCELLED'];

      MOCK_NOTIFICATION_LIST.forEach(notification => {
        expect(validStatuses).toContain(notification.status);
      });
    });

    /**
     * Test 3: Verify all notification types are valid
     * Tests that type field only contains allowed values
     */
    it('should only have valid notification types', () => {
      const validTypes = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'];

      MOCK_NOTIFICATION_LIST.forEach(notification => {
        expect(validTypes).toContain(notification.type);
      });
    });

    /**
     * Test 4: Verify mock notification data validity
     * Validates that all pre-configured mock notifications have valid data
     */
    it('should have valid mock notification data', () => {
      const mockNotifications = [
        MOCK_SSR_NOTIFICATION,
        MOCK_CONFIRMATION_NOTIFICATION,
        MOCK_REJECTED_AMENDMENT_NOTIFICATION,
        MOCK_SYSTEM_NOTIFICATION,
      ];

      mockNotifications.forEach(notif => {
        // Each notification must have a title
        expect(notif.title.length).toBeGreaterThan(0);

        // Each notification must have a description
        expect(notif.description.length).toBeGreaterThan(0);

        // ID must be non-empty string
        expect(notif.id.length).toBeGreaterThan(0);

        // Date must be valid ISO string
        const date = new Date(notif.when);
        expect(date).toBeInstanceOf(Date);
        expect(isNaN(date.getTime())).toBe(false);

        // Status must be one of allowed values
        const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'INFO', 'CANCELLED'];
        expect(validStatuses).toContain(notif.status);

        // Optional fields, if present, should have valid types
        if (notif.passengerName) {
          expect(typeof notif.passengerName).toBe('string');
          expect(notif.passengerName.length).toBeGreaterThan(0);
        }

        if (notif.segment) {
          expect(typeof notif.segment).toBe('string');
          expect(notif.segment.length).toBeGreaterThan(0);
        }

        if (notif.price !== undefined) {
          expect(typeof notif.price).toBe('number');
          expect(notif.price).toBeGreaterThanOrEqual(0);
        }

        if (notif.currency) {
          expect(typeof notif.currency).toBe('string');
          expect(notif.currency.length).toBe(3); // ISO 4217 currency codes are 3 characters
        }

        if (notif.remarks) {
          expect(typeof notif.remarks).toBe('string');
        }
      });
    });
  });

  describe('Type Guard Functions', () => {
    /**
     * Test 5: Validate type guards work correctly for filtering unread notifications
     * Tests that unread filter accurately identifies unread notifications
     */
    it('should correctly identify unread notifications', () => {
      const unreadNotifications = getUnreadNotifications(MOCK_NOTIFICATION_LIST);

      // All returned notifications should have read === false
      unreadNotifications.forEach(notif => {
        expect(notif.read).toBe(false);
      });

      // Count should match
      const unreadCount = MOCK_NOTIFICATION_LIST.filter(n => !n.read).length;
      expect(unreadNotifications).toHaveLength(unreadCount);
    });

    /**
     * Test 6: Validate status counting function
     * Tests that notification count by status is accurate
     */
    it('should accurately count notifications by status', () => {
      const statuses: ('PENDING' | 'CONFIRMED' | 'REJECTED' | 'INFO' | 'CANCELLED')[] = [
        'PENDING',
        'CONFIRMED',
        'REJECTED',
        'INFO',
        'CANCELLED',
      ];

      statuses.forEach(status => {
        const count = getNotificationCountByStatus(MOCK_NOTIFICATION_LIST, status);
        const expectedCount = MOCK_NOTIFICATION_LIST.filter(n => n.status === status).length;
        expect(count).toBe(expectedCount);
      });
    });

    /**
     * Test 7: Validate type counting function
     * Tests that notification count by type is accurate
     */
    it('should accurately count notifications by type', () => {
      const types: ('SUCCESS' | 'INFO' | 'WARNING' | 'ERROR')[] = [
        'SUCCESS',
        'INFO',
        'WARNING',
        'ERROR',
      ];

      types.forEach(type => {
        const count = getNotificationCountByType(MOCK_NOTIFICATION_LIST, type);
        const expectedCount = MOCK_NOTIFICATION_LIST.filter(n => n.type === type).length;
        expect(count).toBe(expectedCount);
      });
    });

    /**
     * Test 8: Validate sorting and filtering functions
     * Tests that notifications can be filtered and sorted correctly
     */
    it('should correctly sort notifications by date', () => {
      const sorted = sortNotificationsByDateNewest(MOCK_NOTIFICATION_LIST);

      // For each pair of consecutive notifications, first should be newer than second
      for (let i = 0; i < sorted.length - 1; i++) {
        const current = new Date(sorted[i].when).getTime();
        const next = new Date(sorted[i + 1].when).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }
    });

    /**
     * Test 9: Validate type filtering function
     * Tests that notifications can be filtered by type
     */
    it('should correctly filter notifications by type', () => {
      const successNotifications = filterNotificationsByType(MOCK_NOTIFICATION_LIST, 'SUCCESS');

      successNotifications.forEach(notif => {
        expect(notif.type).toBe('SUCCESS');
      });
    });

    /**
     * Test 10: Validate status filtering function
     * Tests that notifications can be filtered by status
     */
    it('should correctly filter notifications by status', () => {
      const confirmedNotifications = filterNotificationsByStatus(MOCK_NOTIFICATION_LIST, 'CONFIRMED');

      confirmedNotifications.forEach(notif => {
        expect(notif.status).toBe('CONFIRMED');
      });
    });

    /**
     * Test 11: Validate search function
     * Tests that notifications can be searched by title, description, and passenger name
     */
    it('should correctly search notifications', () => {
      // Search by title
      const titleSearch = searchNotifications(MOCK_NOTIFICATION_LIST, 'Booking');
      expect(titleSearch.length).toBeGreaterThan(0);
      titleSearch.forEach(notif => {
        const content = `${notif.title} ${notif.description}`.toLowerCase();
        expect(content).toContain('booking');
      });

      // Search by passenger name
      const passengerSearch = searchNotifications(
        MOCK_NOTIFICATION_LIST,
        MOCK_SSR_NOTIFICATION.passengerName || 'John'
      );
      expect(passengerSearch.length).toBeGreaterThan(0);
    });

    /**
     * Test 12: Validate unread count function
     * Tests that the unread notification count is accurate
     */
    it('should accurately count unread notifications', () => {
      const unreadCount = getUnreadNotificationCount(MOCK_NOTIFICATION_LIST);
      const expectedCount = MOCK_NOTIFICATION_LIST.filter(n => !n.read).length;
      expect(unreadCount).toBe(expectedCount);
    });

    /**
     * Test 13: Validate mock notification factory
     * Tests that the mock notification factory creates valid notifications
     */
    it('should create valid mock notifications from factory', () => {
      const mockNotif = createMockNotification();

      // Should have all required fields
      expect(mockNotif).toHaveProperty('id');
      expect(mockNotif).toHaveProperty('type');
      expect(mockNotif).toHaveProperty('title');
      expect(mockNotif).toHaveProperty('description');
      expect(mockNotif).toHaveProperty('when');
      expect(mockNotif).toHaveProperty('read');
      expect(mockNotif).toHaveProperty('status');

      // Should have valid types
      expect(typeof mockNotif.id).toBe('string');
      expect(typeof mockNotif.type).toBe('string');
      expect(typeof mockNotif.title).toBe('string');
      expect(typeof mockNotif.read).toBe('boolean');

      // Type and status should be in valid values
      const validTypes = ['SUCCESS', 'INFO', 'WARNING', 'ERROR'];
      const validStatuses = ['PENDING', 'CONFIRMED', 'REJECTED', 'INFO', 'CANCELLED'];
      expect(validTypes).toContain(mockNotif.type);
      expect(validStatuses).toContain(mockNotif.status);
    });

    /**
     * Test 14: Validate mock notification factory with overrides
     * Tests that the factory correctly applies overrides
     */
    it('should apply overrides to mock notifications', () => {
      const customTitle = 'Custom Test Title';
      const mockNotif = createMockNotification({
        title: customTitle,
        read: true,
        status: 'CONFIRMED',
      });

      expect(mockNotif.title).toBe(customTitle);
      expect(mockNotif.read).toBe(true);
      expect(mockNotif.status).toBe('CONFIRMED');
    });

    /**
     * Test 15: Validate notification data consistency
     * Tests that all fields maintain consistency and data integrity
     */
    it('should maintain data consistency across all notifications', () => {
      MOCK_NOTIFICATION_LIST.forEach(notif => {
        // IDs must be unique
        const idCount = MOCK_NOTIFICATION_LIST.filter(n => n.id === notif.id).length;
        expect(idCount).toBe(1);

        // Titles and descriptions must not be empty
        expect(notif.title.trim().length).toBeGreaterThan(0);
        expect(notif.description.trim().length).toBeGreaterThan(0);

        // When date should be parseable
        const date = new Date(notif.when);
        expect(date.getTime()).toBeLessThanOrEqual(Date.now());

        // Price should not be negative if present
        if (notif.price !== undefined) {
          expect(notif.price).toBeGreaterThanOrEqual(0);
        }
      });
    });

    /**
     * Test 16: Validate edge cases and empty data handling
     * Tests that functions handle edge cases gracefully
     */
    it('should handle edge cases gracefully', () => {
      const emptyArray: NotificationItem[] = [];

      expect(getUnreadNotifications(emptyArray)).toHaveLength(0);
      expect(getUnreadNotificationCount(emptyArray)).toBe(0);
      expect(getNotificationCountByStatus(emptyArray, 'CONFIRMED')).toBe(0);
      expect(getNotificationCountByType(emptyArray, 'SUCCESS')).toBe(0);
      expect(sortNotificationsByDateNewest(emptyArray)).toHaveLength(0);
      expect(filterNotificationsByType(emptyArray, 'SUCCESS')).toHaveLength(0);
      expect(filterNotificationsByStatus(emptyArray, 'CONFIRMED')).toHaveLength(0);
      expect(searchNotifications(emptyArray, 'test')).toHaveLength(0);
    });
  });
});
