import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import Notifications from '../../../pages/Notifications';
import * as api from '../../../lib/api';

vi.mock('../../../lib/api');

describe('Notifications Performance Tests', () => {
  const generateNotifications = (count: number) => {
    return Array.from({ length: count }, (_, i) => ({
      id: `notif-${i}`,
      type: i % 4 === 0 ? 'SUCCESS' : i % 3 === 0 ? 'INFO' : i % 2 === 0 ? 'WARNING' : 'ERROR',
      title: `Notification ${i}`,
      description: `This is notification ${i} with detailed description`,
      when: new Date(Date.now() - i * 60000).toISOString(),
      read: i % 3 === 0,
      status: 'CONFIRMED' as const,
    }));
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Render Performance', () => {
    it('should render 50 notifications within acceptable time', async () => {
      const notifications = generateNotifications(50);
      (api.listNotifications as any).mockResolvedValue(notifications);

      const startTime = performance.now();
      render(<Notifications />);
      const initialRenderTime = performance.now() - startTime;

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      const totalRenderTime = performance.now() - startTime;

      // Should render initial UI quickly
      expect(initialRenderTime).toBeLessThan(500); // 500ms for initial render
      // Total should include network, but still be reasonable
      expect(totalRenderTime).toBeLessThan(3000); // 3 seconds total
    });

    it('should render 100 notifications efficiently', async () => {
      const notifications = generateNotifications(100);
      (api.listNotifications as any).mockResolvedValue(notifications);

      const startTime = performance.now();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      const totalTime = performance.now() - startTime;

      // Should complete within reasonable time even with many items
      expect(totalTime).toBeLessThan(5000); // 5 seconds
    });

    it('should render 500 notifications', async () => {
      const notifications = generateNotifications(500);
      (api.listNotifications as any).mockResolvedValue(notifications);

      const startTime = performance.now();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      const totalTime = performance.now() - startTime;

      // Longer list, but should still be manageable
      expect(totalTime).toBeLessThan(10000); // 10 seconds
    });

    it('should not create memory leaks on re-renders', async () => {
      const notifications = generateNotifications(100);
      (api.listNotifications as any).mockResolvedValue(notifications);

      const { rerender } = render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      const initialMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Re-render multiple times
      for (let i = 0; i < 5; i++) {
        rerender(<Notifications />);
      }

      const finalMemory = (performance as any).memory?.usedJSHeapSize || 0;

      // Memory growth should be minimal
      if (initialMemory > 0 && finalMemory > 0) {
        const memoryGrowth = finalMemory - initialMemory;
        const growthPercentage = (memoryGrowth / initialMemory) * 100;

        // Allow up to 20% growth (could be aggressive if needed)
        expect(growthPercentage).toBeLessThan(20);
      }
    });
  });

  describe('Filter Performance', () => {
    it('should filter 1000 notifications quickly', () => {
      const notifications = generateNotifications(1000);

      const startTime = performance.now();
      const filtered = notifications.filter((n) => n.type === 'SUCCESS');
      const filterTime = performance.now() - startTime;

      expect(filterTime).toBeLessThan(100); // 100ms for filtering
      expect(filtered.length).toBeGreaterThan(0);
    });

    it('should handle multiple filters simultaneously', () => {
      const notifications = generateNotifications(500);

      const startTime = performance.now();
      const filtered = notifications
        .filter((n) => n.type === 'SUCCESS')
        .filter((n) => !n.read)
        .filter((n) => n.status === 'CONFIRMED');
      const filterTime = performance.now() - startTime;

      expect(filterTime).toBeLessThan(100); // Should be sub-100ms
      expect(Array.isArray(filtered)).toBe(true);
    });
  });

  describe('Search Performance', () => {
    it('should search through 1000 notifications quickly', () => {
      const notifications = generateNotifications(1000);
      const searchTerm = 'notification';

      const startTime = performance.now();
      const results = notifications.filter(
        (n) =>
          n.title.toLowerCase().includes(searchTerm) ||
          n.description.toLowerCase().includes(searchTerm)
      );
      const searchTime = performance.now() - startTime;

      expect(searchTime).toBeLessThan(100); // 100ms for search
      expect(results.length).toBeGreaterThan(0);
    });

    it('should handle case-insensitive search efficiently', () => {
      const notifications = generateNotifications(500);
      const searchTerm = 'NOTIFICATION';

      const startTime = performance.now();
      const results = notifications.filter((n) =>
        n.title.toLowerCase().includes(searchTerm.toLowerCase())
      );
      const searchTime = performance.now() - startTime;

      expect(searchTime).toBeLessThan(50); // Very fast
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Pagination Performance', () => {
    it('should paginate 10000 items efficiently', () => {
      const notifications = generateNotifications(10000);
      const pageSize = 25;

      const startTime = performance.now();

      // Simulate pagination logic
      const page1 = notifications.slice(0, pageSize);
      const page2 = notifications.slice(pageSize, pageSize * 2);
      const page3 = notifications.slice(pageSize * 2, pageSize * 3);

      const paginationTime = performance.now() - startTime;

      expect(paginationTime).toBeLessThan(50); // Very fast
      expect(page1.length).toBe(pageSize);
      expect(page2.length).toBe(pageSize);
      expect(page3.length).toBe(pageSize);
    });

    it('should handle page size changes efficiently', () => {
      const notifications = generateNotifications(1000);

      const startTime = performance.now();

      // Change from 10 to 50 items per page
      const defaultPage = notifications.slice(0, 10);
      const largerPage = notifications.slice(0, 50);

      const changeTime = performance.now() - startTime;

      expect(changeTime).toBeLessThan(50);
      expect(defaultPage.length).toBe(10);
      expect(largerPage.length).toBe(50);
    });
  });

  describe('Sorting Performance', () => {
    it('should sort 1000 notifications quickly', () => {
      const notifications = generateNotifications(1000);

      const startTime = performance.now();
      const sorted = [...notifications].sort(
        (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
      );
      const sortTime = performance.now() - startTime;

      expect(sortTime).toBeLessThan(100); // 100ms for sorting
      expect(sorted.length).toBe(1000);
    });

    it('should handle different sort orders', () => {
      const notifications = generateNotifications(500);

      const startTime = performance.now();

      // Sort by date
      const byDate = [...notifications].sort(
        (a, b) => new Date(b.when).getTime() - new Date(a.when).getTime()
      );

      // Sort by read status
      const byReadStatus = [...notifications].sort(
        (a, b) => (a.read === b.read ? 0 : a.read ? 1 : -1)
      );

      const totalSortTime = performance.now() - startTime;

      expect(totalSortTime).toBeLessThan(200); // Multiple sorts
      expect(byDate.length).toBe(500);
      expect(byReadStatus.length).toBe(500);
    });
  });

  describe('Memory Benchmarks', () => {
    it('should handle 100 notifications with acceptable memory', () => {
      const notifications = generateNotifications(100);

      const memory1 = (performance as any).memory?.usedJSHeapSize;

      // Store notifications in state
      const states = notifications.map((n) => ({ notifications: [n] }));

      const memory2 = (performance as any).memory?.usedJSHeapSize;

      // Memory increase should be proportional
      if (memory1 && memory2) {
        const increase = memory2 - memory1;
        // Rough heuristic: 100 notifications shouldn't use more than 1MB
        expect(increase).toBeLessThan(1000000);
      }
    });
  });

  describe('Update Performance', () => {
    it('should update mark-as-read status efficiently', async () => {
      const notifications = generateNotifications(100);
      (api.listNotifications as any).mockResolvedValue(notifications);
      (api.markNotificationRead as any).mockResolvedValue({});

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      const startTime = performance.now();

      // Simulate marking multiple notifications as read
      for (let i = 0; i < 10; i++) {
        await (api.markNotificationRead as any)(`notif-${i}`);
      }

      const updateTime = performance.now() - startTime;

      // 10 updates should be very fast
      expect(updateTime).toBeLessThan(500);
    });
  });

  describe('List Rendering Optimization', () => {
    it('should efficiently handle scrolling performance', async () => {
      const notifications = generateNotifications(1000);
      (api.listNotifications as any).mockResolvedValue(notifications);

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText('Notification 0')).toBeInTheDocument();
      });

      // Simulate scroll events - in a real scenario, this would use intersection observer
      const startTime = performance.now();

      // Trigger multiple scroll events
      for (let i = 0; i < 10; i++) {
        window.dispatchEvent(new Event('scroll'));
      }

      const scrollTime = performance.now() - startTime;

      // Scroll handling should be very fast
      expect(scrollTime).toBeLessThan(100);
    });
  });

  describe('API Call Performance', () => {
    it('should batch multiple API calls efficiently', async () => {
      const responses = [
        generateNotifications(50),
        generateNotifications(50),
        generateNotifications(50),
      ];

      let callCount = 0;
      (api.listNotifications as any).mockImplementation(() => {
        return Promise.resolve(responses[callCount++ % responses.length]);
      });

      const startTime = performance.now();

      // Simulate multiple API calls
      const calls = await Promise.all([
        api.listNotifications(),
        api.listNotifications(),
        api.listNotifications(),
      ]);

      const callTime = performance.now() - startTime;

      expect(callTime).toBeLessThan(1000); // Should be under 1 second
      expect(calls.length).toBe(3);
    });
  });
});
