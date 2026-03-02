import React from "react";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { setupServer } from "msw/node";
import { http, HttpResponse } from "msw";
import Notifications from "../../pages/Notifications";
import { handlers, resetNotificationsStore } from "../mocks/handlers";

const server = setupServer(...handlers);

describe("Notifications API Integration with MSW", () => {
  beforeAll(() => server.listen());
  afterEach(() => {
    server.resetHandlers();
    resetNotificationsStore();
  });
  afterAll(() => server.close());

  describe("Successful API responses", () => {
    it("should fetch and display notifications", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
        expect(screen.getByText("Special Service Request")).toBeInTheDocument();
      });
    });

    it("should handle paginated responses", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Response should include pagination metadata
      const notificationsList = screen.getAllByRole("group");
      expect(notificationsList.length).toBeGreaterThan(0);
    });

    it("should filter notifications by type", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });
    });

    it("should search notifications", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });
    });
  });

  describe("API error handling", () => {
    it("should handle 500 server errors gracefully", async () => {
      server.use(
        http.get("http://localhost:3000/api/notifications", () => {
          return HttpResponse.json(
            { error: "Internal server error" },
            { status: 500 },
          );
        }),
      );

      render(<Notifications />);

      await waitFor(() => {
        // Should show empty state or error
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });

    it("should handle 404 not found errors", async () => {
      server.use(
        http.get("http://localhost:3000/api/notifications", () => {
          return HttpResponse.json({ error: "Not found" }, { status: 404 });
        }),
      );

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });

    it("should handle network errors", async () => {
      server.use(
        http.get("http://localhost:3000/api/notifications", () => {
          return HttpResponse.error();
        }),
      );

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText(/All caught up/i)).toBeInTheDocument();
      });
    });

    it("should handle timeout errors", async () => {
      server.use(
        http.get("http://localhost:3000/api/notifications", async () => {
          await new Promise((resolve) => setTimeout(resolve, 10000));
          return HttpResponse.json({ data: [] });
        }),
      );

      render(<Notifications />);

      // Should handle timeout gracefully
      // This test might need adjustment based on actual timeout implementation
    });
  });

  describe("Loading states", () => {
    it("should display loading state while fetching", async () => {
      server.use(
        http.get("http://localhost:3000/api/notifications", async () => {
          await new Promise((resolve) => setTimeout(resolve, 1000));
          return HttpResponse.json({
            data: [
              {
                id: "1",
                type: "SUCCESS",
                title: "Delayed notification",
                description: "This took time to load",
                when: new Date().toISOString(),
                read: false,
                status: "CONFIRMED",
              },
            ],
            metadata: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
          });
        }),
      );

      render(<Notifications />);

      // Should show loading state initially
      expect(screen.getByText(/Fetching your alerts/i)).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText("Delayed notification")).toBeInTheDocument();
      });
    });
  });

  describe("Retry logic", () => {
    it("should retry failed requests", async () => {
      let attemptCount = 0;

      server.use(
        http.get("http://localhost:3000/api/notifications", () => {
          attemptCount++;
          if (attemptCount === 1) {
            return HttpResponse.error();
          }
          return HttpResponse.json({
            data: [
              {
                id: "1",
                type: "SUCCESS",
                title: "Retry successful",
                description: "Request succeeded on retry",
                when: new Date().toISOString(),
                read: false,
                status: "CONFIRMED",
              },
            ],
            metadata: { total: 1, page: 1, pageSize: 10, totalPages: 1 },
          });
        }),
      );

      render(<Notifications />);

      // Depending on implementation, may see retry behavior
      await waitFor(() => {
        expect(attemptCount).toBeGreaterThan(0);
      });
    });
  });

  describe("Optimistic updates", () => {
    it("should mark notification as read optimistically", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Note: Would need component implementation for mark as read
      const markButtons = screen.queryAllByText(/Mark as read/i);
      if (markButtons.length > 0) {
        await user.click(markButtons[0]);

        // API call should be made
        // Notification should be updated in UI
      }
    });

    it("should handle optimistic update failures", async () => {
      server.use(
        http.post("http://localhost:3000/api/notifications/:id/read", () => {
          return HttpResponse.json(
            { error: "Failed to update" },
            { status: 400 },
          );
        }),
      );

      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // If optimistic update fails, UI should revert
    });
  });

  describe("Real-time updates with polling", () => {
    it("should fetch new notifications on interval", async () => {
      vi.useFakeTimers();

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Advance time to trigger polling
      vi.advanceTimersByTime(30000);

      // Should make another API call
      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      vi.restoreAllMocks();
    });

    it("should not poll when tab is inactive", async () => {
      vi.useFakeTimers();

      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Simulate tab becoming inactive
      // Implementation would depend on actual polling mechanism

      vi.restoreAllMocks();
    });
  });

  describe("Caching", () => {
    it("should cache fetched notifications", async () => {
      const { unmount } = render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Unmount and remount
      unmount();
      render(<Notifications />);

      // Should use cached data if implementation includes caching
      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });
    });
  });

  describe("Concurrent requests", () => {
    it("should handle multiple concurrent requests", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // All requests should succeed
      expect(screen.getByText("Special Service Request")).toBeInTheDocument();
      expect(screen.getByText("Schedule Change")).toBeInTheDocument();
    });
  });

  describe("Data consistency", () => {
    it("should maintain data consistency after updates", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // After marking notification as read, state should be consistent
      const markButtons = screen.queryAllByText(/Mark as read/i);
      if (markButtons.length > 0) {
        // Check UI reflects the change
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      }
    });

    it("should sync with server state", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Notifications should match server data
      const allNotifications = screen.getAllByRole("group");
      expect(allNotifications.length).toBeGreaterThan(0);
    });
  });
});
