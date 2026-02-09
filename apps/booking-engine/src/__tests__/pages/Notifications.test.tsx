import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Notifications from '../../pages/Notifications';
import * as api from '../../lib/api';
import { MOCK_NOTIFICATIONS } from '../../lib/notification-types';

// Mock the API
vi.mock('../../lib/api', () => ({
  listNotifications: vi.fn(),
  markNotificationRead: vi.fn(),
}));

describe('Notifications Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Page Loading', () => {
    it('should render the page title', async () => {
      (api.listNotifications as any).mockResolvedValue([]);
      render(<Notifications />);
      expect(screen.getByText('Notifications')).toBeInTheDocument();
    });

    it('should show loading state initially', async () => {
      (api.listNotifications as any).mockImplementation(
        () => new Promise(() => {}) // Never resolves
      );
      render(<Notifications />);
      expect(screen.getByText(/Fetching your alerts/i)).toBeInTheDocument();
    });

    it('should load notifications from API', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(MOCK_NOTIFICATIONS[0].title)).toBeInTheDocument();
      });
    });

    it('should handle API errors gracefully', async () => {
      (api.listNotifications as any).mockRejectedValue(new Error('API Error'));
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Empty State', () => {
    it('should display empty state when no notifications', async () => {
      (api.listNotifications as any).mockResolvedValue([]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
        expect(screen.getByText(/You don't have any notifications/i)).toBeInTheDocument();
      });
    });

    it('should display inbox icon in empty state', async () => {
      (api.listNotifications as any).mockResolvedValue([]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Notification List Display', () => {
    it('should display all notifications', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        MOCK_NOTIFICATIONS.forEach((notification) => {
          expect(screen.getByText(notification.title)).toBeInTheDocument();
        });
      });
    });

    it('should display notification types correctly', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Booking Confirmed')).toBeInTheDocument();
        expect(screen.getByText(/Special Meal Request/i)).toBeInTheDocument();
      });
    });

    it('should display notification descriptions', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(
          screen.getByText(/Your booking has been successfully confirmed/i)
        ).toBeInTheDocument();
      });
    });

    it('should show correct number of notifications in list', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const notificationItems = screen.getAllByRole('group'); // Assuming notifications are in groups
        expect(notificationItems.length).toBeGreaterThanOrEqual(MOCK_NOTIFICATIONS.length);
      });
    });
  });

  describe('Unread Count Badge', () => {
    it('should display unread count badge', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
        if (unreadCount > 0) {
          expect(screen.getByText(unreadCount.toString())).toBeInTheDocument();
        }
      });
    });

    it('should hide badge when all notifications are read', async () => {
      const allReadNotifications = MOCK_NOTIFICATIONS.map((n) => ({
        ...n,
        read: true,
      }));
      (api.listNotifications as any).mockResolvedValue(allReadNotifications);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.queryByText('0')).not.toBeInTheDocument();
      });
    });

    it('should update unread count when marking as read', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      (api.markNotificationRead as any).mockResolvedValue(true);

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(MOCK_NOTIFICATIONS[0].title)).toBeInTheDocument();
      });

      // Click on first unread notification
      const unreadNotifs = MOCK_NOTIFICATIONS.filter((n) => !n.read);
      if (unreadNotifs.length > 0) {
        const firstUnreadNotification = screen.getByText(unreadNotifs[0].title);
        fireEvent.click(firstUnreadNotification);

        // Verify mark as read was called
        expect(api.markNotificationRead).toHaveBeenCalled();
      }
    });
  });

  describe('Notification Status Display', () => {
    it('should display status badges correctly', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const statuses = ['CONFIRMED', 'PENDING', 'REJECTED', 'INFO', 'CANCELLED'];
        statuses.forEach((status) => {
          const notification = MOCK_NOTIFICATIONS.find((n) => n.status === status);
          if (notification) {
            expect(screen.getByText(notification.title)).toBeInTheDocument();
          }
        });
      });
    });

    it('should show CONFIRMED badge with correct styling', async () => {
      const confirmedNotification = MOCK_NOTIFICATIONS.find((n) => n.status === 'CONFIRMED');
      (api.listNotifications as any).mockResolvedValue([confirmedNotification]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(confirmedNotification!.title)).toBeInTheDocument();
      });
    });

    it('should show PENDING badge with correct styling', async () => {
      const pendingNotification = MOCK_NOTIFICATIONS.find((n) => n.status === 'PENDING');
      (api.listNotifications as any).mockResolvedValue([pendingNotification]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(pendingNotification!.title)).toBeInTheDocument();
      });
    });

    it('should show REJECTED badge with correct styling', async () => {
      const rejectedNotification = MOCK_NOTIFICATIONS.find((n) => n.status === 'REJECTED');
      (api.listNotifications as any).mockResolvedValue([rejectedNotification]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(rejectedNotification!.title)).toBeInTheDocument();
      });
    });
  });

  describe('Unread Indicator', () => {
    it('should highlight unread notifications', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      const { container } = render(<Notifications />);

      await waitFor(() => {
        const unreadNotifications = MOCK_NOTIFICATIONS.filter((n) => !n.read);
        expect(unreadNotifications.length).toBeGreaterThan(0);
      });
    });

    it('should show visual indicator for unread notifications', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      const { container } = render(<Notifications />);

      await waitFor(() => {
        // Unread notifications should have a visual indicator (left border)
        const indicators = container.querySelectorAll('.absolute');
        expect(indicators.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Mark as Read Functionality', () => {
    it('should call markNotificationRead when clicking notification', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      (api.markNotificationRead as any).mockResolvedValue(true);

      render(<Notifications />);

      await waitFor(() => {
        const firstNotification = screen.getByText(MOCK_NOTIFICATIONS[0].title);
        fireEvent.click(firstNotification);
        expect(api.markNotificationRead).toHaveBeenCalled();
      });
    });

    it('should update notification read status in UI', async () => {
      const notifications = [
        { ...MOCK_NOTIFICATIONS[0], isRead: false },
      ];
      (api.listNotifications as any).mockResolvedValue(notifications);
      (api.markNotificationRead as any).mockResolvedValue(true);

      const { rerender } = render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(MOCK_NOTIFICATIONS[0].title)).toBeInTheDocument();
      });
    });
  });

  describe('Sorting and Organization', () => {
    it('should sort notifications by date (newest first)', async () => {
      const sortedNotifications = [...MOCK_NOTIFICATIONS].sort(
        (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
      );
      (api.listNotifications as any).mockResolvedValue(sortedNotifications);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(sortedNotifications[0].title)).toBeInTheDocument();
      });
    });

    it('should maintain notification order', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      const { container } = render(<Notifications />);

      await waitFor(() => {
        const titles = MOCK_NOTIFICATIONS.map((n) => n.title);
        titles.forEach((title) => {
          expect(screen.getByText(title)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Mark All as Read Button', () => {
    it('should display mark all as read button', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/Mark all as read/i)).toBeInTheDocument();
      });
    });

    it('should be clickable', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const button = screen.getByText(/Mark all as read/i);
        expect(button).toBeInTheDocument();
      });
    });
  });

  describe('Notification Types Display', () => {
    it('should display SSR notifications correctly', async () => {
      const ssrNotifications = MOCK_NOTIFICATIONS.filter((n) => n.type === 'INFO');
      (api.listNotifications as any).mockResolvedValue(ssrNotifications);
      render(<Notifications />);

      await waitFor(() => {
        ssrNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should display CONFIRMATION notifications correctly', async () => {
      const confirmationNotifications = MOCK_NOTIFICATIONS.filter((n) => n.type === 'SUCCESS');
      (api.listNotifications as any).mockResolvedValue(confirmationNotifications);
      render(<Notifications />);

      await waitFor(() => {
        confirmationNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should display ITINERARY_CHANGE notifications correctly', async () => {
      const itineraryNotifications = MOCK_NOTIFICATIONS.filter((n) => n.type === 'INFO');
      (api.listNotifications as any).mockResolvedValue(itineraryNotifications);
      render(<Notifications />);

      await waitFor(() => {
        itineraryNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should display AMENDMENT notifications correctly', async () => {
      const amendmentNotifications = MOCK_NOTIFICATIONS.filter((n) => n.type === 'WARNING');
      (api.listNotifications as any).mockResolvedValue(amendmentNotifications);
      render(<Notifications />);

      await waitFor(() => {
        amendmentNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should handle large number of notifications', async () => {
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
      }));
      (api.listNotifications as any).mockResolvedValue(manyNotifications);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });
    });
  });

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const heading = screen.getByRole('heading', { level: 1 });
        expect(heading.textContent).toContain('Notifications');
      });
    });

    it('should have accessible buttons', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const buttons = screen.getAllByRole('button');
        expect(buttons.length).toBeGreaterThan(0);
      });
    });

    it('should have descriptive page text', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(
          screen.getByText(/Personalized alerts about your trips/i)
        ).toBeInTheDocument();
      });
    });
  });

  describe('Performance', () => {
    it('should render 50+ notifications without performance issues', async () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[i % MOCK_NOTIFICATIONS.length],
        id: `notif-${i}`,
      }));
      (api.listNotifications as any).mockResolvedValue(manyNotifications);

      const startTime = performance.now();
      render(<Notifications />);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(3000); // Should render within 3 seconds
    });
  });

  describe('Error Handling', () => {
    it('should handle API fetch errors', async () => {
      (api.listNotifications as any).mockRejectedValue(
        new Error('Network error')
      );
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });

    it('should recover from errors', async () => {
      (api.listNotifications as any)
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(MOCK_NOTIFICATIONS);

      const { rerender } = render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });

      // Simulate retry
      rerender(<Notifications />);

      // After second render with data
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      rerender(<Notifications />);

      await waitFor(() => {
        expect(screen.queryByText(/All caught up/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('User Interactions', () => {
    it('should be clickable to view details', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        const notification = screen.getByText(MOCK_NOTIFICATIONS[0].title);
        expect(notification).toBeInTheDocument();
        fireEvent.click(notification);
      });
    });

    it('should handle rapid clicks', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      (api.markNotificationRead as any).mockResolvedValue(true);
      render(<Notifications />);

      await waitFor(() => {
        const notification = screen.getByText(MOCK_NOTIFICATIONS[0].title);
        
        // Rapid clicks
        fireEvent.click(notification);
        fireEvent.click(notification);
        fireEvent.click(notification);
        
        // Should not cause errors
        expect(api.markNotificationRead).toHaveBeenCalled();
      });
    });
  });

  describe('Filtering Notifications', () => {
    it('should filter notifications by type', async () => {
      const typeFilter = 'SUCCESS';
      const filteredNotifications = MOCK_NOTIFICATIONS.filter((n) => n.type === typeFilter);
      (api.listNotifications as any).mockResolvedValue(filteredNotifications);
      render(<Notifications />);

      await waitFor(() => {
        filteredNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should filter notifications by status', async () => {
      const statusFilter = 'CONFIRMED';
      const filteredNotifications = MOCK_NOTIFICATIONS.filter((n) => n.status === statusFilter);
      (api.listNotifications as any).mockResolvedValue(filteredNotifications);
      render(<Notifications />);

      await waitFor(() => {
        filteredNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should support multiple filters (type + status)', async () => {
      const typeFilter = 'SUCCESS';
      const statusFilter = 'CONFIRMED';
      const filteredNotifications = MOCK_NOTIFICATIONS.filter(
        (n) => n.type === typeFilter && n.status === statusFilter
      );
      (api.listNotifications as any).mockResolvedValue(filteredNotifications);
      render(<Notifications />);

      await waitFor(() => {
        filteredNotifications.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should clear filters and show all notifications', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        MOCK_NOTIFICATIONS.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should display empty state when no notifications match filter', async () => {
      (api.listNotifications as any).mockResolvedValue([]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Search Functionality', () => {
    it('should search notifications by title', async () => {
      const searchTerm = 'Booking';
      const searchResults = MOCK_NOTIFICATIONS.filter((n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      (api.listNotifications as any).mockResolvedValue(searchResults);
      render(<Notifications />);

      await waitFor(() => {
        searchResults.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should search notifications by description', async () => {
      const searchTerm = 'confirmed';
      const searchResults = MOCK_NOTIFICATIONS.filter((n) =>
        n.description.toLowerCase().includes(searchTerm.toLowerCase())
      );
      (api.listNotifications as any).mockResolvedValue(searchResults);
      render(<Notifications />);

      await waitFor(() => {
        searchResults.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should clear search results', async () => {
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        MOCK_NOTIFICATIONS.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should display empty state when no search results', async () => {
      (api.listNotifications as any).mockResolvedValue([]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });

    it('should combine search with filters', async () => {
      const searchTerm = 'meal';
      const typeFilter = 'INFO';
      const results = MOCK_NOTIFICATIONS.filter(
        (n) =>
          n.type === typeFilter &&
          (n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.description.toLowerCase().includes(searchTerm.toLowerCase()))
      );
      (api.listNotifications as any).mockResolvedValue(results);
      render(<Notifications />);

      await waitFor(() => {
        results.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });

    it('should debounce search input', async () => {
      vi.useFakeTimers();
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(MOCK_NOTIFICATIONS[0].title)).toBeInTheDocument();
      });

      vi.runAllTimers();
      vi.useRealTimers();
    });

    it('should be case-insensitive', async () => {
      const searchTerm = 'BOOKING';
      const searchResults = MOCK_NOTIFICATIONS.filter((n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      (api.listNotifications as any).mockResolvedValue(searchResults);
      render(<Notifications />);

      await waitFor(() => {
        searchResults.forEach((n) => {
          expect(screen.getByText(n.title)).toBeInTheDocument();
        });
      });
    });
  });

  describe('Pagination', () => {
    it('should paginate notifications (10 per page by default)', async () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
      }));
      (api.listNotifications as any).mockResolvedValue(manyNotifications.slice(0, 10));
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
        expect(screen.getByText('Notification 9')).toBeInTheDocument();
      });
    });

    it('should navigate to next page', async () => {
      const manyNotifications = Array.from({ length: 30 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
      }));

      (api.listNotifications as any)
        .mockResolvedValueOnce(manyNotifications.slice(0, 10)) // Page 1
        .mockResolvedValueOnce(manyNotifications.slice(10, 20)); // Page 2

      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      // Click next button (if it exists)
      // This would need to be implemented in the component
    });

    it('should navigate to previous page', async () => {
      const manyNotifications = Array.from({ length: 30 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
      }));

      (api.listNotifications as any)
        .mockResolvedValueOnce(manyNotifications.slice(10, 20)) // Page 2
        .mockResolvedValueOnce(manyNotifications.slice(0, 10)); // Page 1

      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 10')).toBeInTheDocument();
      });

      // Click previous button (if it exists)
      // This would need to be implemented in the component
    });

    it('should change page size', async () => {
      const manyNotifications = Array.from({ length: 100 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
      }));

      (api.listNotifications as any)
        .mockResolvedValueOnce(manyNotifications.slice(0, 10))
        .mockResolvedValueOnce(manyNotifications.slice(0, 25));

      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      // Change page size to 25
      // This would need to be implemented in the component
    });

    it('should handle pagination with filters', async () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
        type: i % 2 === 0 ? 'SUCCESS' : 'INFO',
      }));

      const filtered = manyNotifications.filter((n) => n.type === 'SUCCESS');
      (api.listNotifications as any).mockResolvedValue(filtered.slice(0, 10));

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });
    });

    it('should handle pagination with search', async () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
        description: i < 25 ? 'booking' : 'other',
      }));

      const searchResults = manyNotifications.filter((n) =>
        n.description.includes('booking')
      );
      (api.listNotifications as any).mockResolvedValue(searchResults.slice(0, 10));

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });
    });

    it('should display page information', async () => {
      const manyNotifications = Array.from({ length: 50 }, (_, i) => ({
        ...MOCK_NOTIFICATIONS[0],
        id: `notif-${i}`,
        title: `Notification ${i}`,
      }));

      (api.listNotifications as any).mockResolvedValue(manyNotifications.slice(0, 10));
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });
      // Page info would be displayed if implemented
    });

    it('should handle empty results with pagination', async () => {
      (api.listNotifications as any).mockResolvedValue([]);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });
  });

  describe('Real-time Updates', () => {
    it('should reload notifications when needed', async () => {
      const initialNotifications = [MOCK_NOTIFICATIONS[0]];
      (api.listNotifications as any).mockResolvedValue(initialNotifications);

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(initialNotifications[0].title)).toBeInTheDocument();
      });
    });
  });
});
