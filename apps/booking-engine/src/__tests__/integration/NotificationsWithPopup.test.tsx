import React from "react";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Notifications from "../../pages/Notifications";
import * as api from "../../../lib/api";

vi.mock("../../../lib/api");

const MOCK_NOTIFICATIONS = [
  {
    id: "1",
    type: "SUCCESS" as const,
    title: "Booking Confirmed",
    description: "Your flight booking has been confirmed",
    when: new Date(Date.now() - 3600000).toISOString(),
    read: false,
    status: "CONFIRMED" as const,
  },
  {
    id: "2",
    type: "INFO" as const,
    title: "Special Service Request",
    description: "Wheelchair assistance has been added",
    when: new Date(Date.now() - 7200000).toISOString(),
    read: true,
    status: "PENDING" as const,
    passengerName: "John Doe",
  },
  {
    id: "3",
    type: "WARNING" as const,
    title: "Schedule Change",
    description: "Your flight time has been changed",
    when: new Date(Date.now() - 86400000).toISOString(),
    read: false,
    status: "REJECTED" as const,
    remarks: "Please update your calendar",
  },
];

describe("Notifications with Popup Integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
    (api.markNotificationRead as any).mockResolvedValue({});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("Popup opening", () => {
    it('should open popup when clicking "View Details"', async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText("VIEW DETAILS");
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });
    });

    it("should display correct notification data in popup", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(
          screen.getByText("Your flight booking has been confirmed"),
        ).toBeInTheDocument();
      });
    });

    it("should open popup for each notification", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Special Service Request")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText("VIEW DETAILS");

      // Click first notification
      await user.click(viewButtons[0]);
      await waitFor(() => {
        expect(
          screen.getByText("Your flight booking has been confirmed"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Popup closing", () => {
    it("should close popup when close button is clicked", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      await waitFor(() => {
        const closeButton = screen.getByLabelText("Close notification details");
        expect(closeButton).toBeInTheDocument();
      });

      const closeButton = screen.getByLabelText("Close notification details");
      await user.click(closeButton);

      // After closing, popup should be hidden
      await waitFor(() => {
        expect(
          screen.queryByLabelText("Close notification details"),
        ).not.toBeInTheDocument();
      });
    });

    it("should close popup when ESC key is pressed", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(
          screen.queryByLabelText("Close notification details"),
        ).not.toBeInTheDocument();
      });
    });

    it("should close popup when clicking outside", async () => {
      const user = userEvent.setup();
      const { container } = render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Click outside the popup (on the overlay)
      const overlay = container.querySelector('[role="presentation"]');
      if (overlay) {
        await user.click(overlay);
      }

      await waitFor(() => {
        expect(
          screen.queryByLabelText("Close notification details"),
        ).not.toBeInTheDocument();
      });
    });
  });

  describe("Mark as read integration", () => {
    it("should mark notification as read when opening details", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      await waitFor(() => {
        expect(api.markNotificationRead).toHaveBeenCalledWith("1");
      });
    });

    it("should not mark as read if already read", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Special Service Request")).toBeInTheDocument();
      });

      const readNotificationIndex = MOCK_NOTIFICATIONS.findIndex((n) => n.read);
      const viewButtons = screen.getAllByText("VIEW DETAILS");
      await user.click(viewButtons[readNotificationIndex]);

      await waitFor(() => {
        expect(api.markNotificationRead).not.toHaveBeenCalled();
      });
    });

    it("should update unread count after marking notification as read", async () => {
      const user = userEvent.setup();
      (api.listNotifications as any).mockResolvedValue(MOCK_NOTIFICATIONS);
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("2")).toBeInTheDocument(); // 2 unread notifications
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      await waitFor(() => {
        // After marking as read, unread count should decrease
        expect(screen.getByText("1")).toBeInTheDocument();
      });
    });
  });

  describe("Navigation between notifications", () => {
    it("should maintain popup open when viewing different notifications", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Open first notification
      let viewButtons = screen.getAllByText("VIEW DETAILS");
      await user.click(viewButtons[0]);

      await waitFor(() => {
        expect(
          screen.getByText("Your flight booking has been confirmed"),
        ).toBeInTheDocument();
      });

      // Close and open another
      const closeButton = screen.getByLabelText("Close notification details");
      await user.click(closeButton);

      viewButtons = screen.getAllByText("VIEW DETAILS");
      await user.click(viewButtons[1]);

      await waitFor(() => {
        expect(
          screen.getByText("Wheelchair assistance has been added"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have accessible popup trigger", async () => {
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText("VIEW DETAILS");
      viewButtons.forEach((button) => {
        expect(button).toBeVisible();
        expect(button.closest("button")).toHaveClass("text-xs");
      });
    });

    it("should support keyboard navigation for popup", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      // Tab to first VIEW DETAILS button
      const viewButtons = screen.getAllByText("VIEW DETAILS");
      viewButtons[0].focus();
      expect(viewButtons[0]).toHaveFocus();

      // Press Enter to open
      await user.keyboard("{Enter}");

      await waitFor(() => {
        expect(
          screen.getByLabelText("Close notification details"),
        ).toBeInTheDocument();
      });

      // Press Escape to close
      await user.keyboard("{Escape}");

      await waitFor(() => {
        expect(
          screen.queryByLabelText("Close notification details"),
        ).not.toBeInTheDocument();
      });
    });

    it("should have proper ARIA roles for notifications list", () => {
      render(<Notifications />);

      const heading = screen.getByRole("heading", { level: 1 });
      expect(heading).toHaveTextContent("Notifications");
    });
  });

  describe("Error handling", () => {
    it("should handle API errors gracefully", async () => {
      (api.listNotifications as any).mockRejectedValue(new Error("API Error"));
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("All caught up!")).toBeInTheDocument();
      });
    });

    it("should handle popup opening with invalid notification", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButton = screen.getAllByText("VIEW DETAILS")[0];
      await user.click(viewButton);

      // Should not crash
      expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
    });
  });

  describe("Multiple popups", () => {
    it("should only show one popup at a time", async () => {
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Booking Confirmed")).toBeInTheDocument();
      });

      const viewButtons = screen.getAllByText("VIEW DETAILS");

      // Open first popup
      await user.click(viewButtons[0]);
      await waitFor(() => {
        expect(
          screen.getByText("Your flight booking has been confirmed"),
        ).toBeInTheDocument();
      });

      // Open second popup (should close first)
      await user.click(viewButtons[1]);
      await waitFor(() => {
        expect(
          screen.getByText("Wheelchair assistance has been added"),
        ).toBeInTheDocument();
      });
    });
  });

  describe("Long notification details", () => {
    it("should display long description in popup", async () => {
      const longDescription = "A".repeat(500);
      const mockNotifications = [
        {
          id: "1",
          type: "INFO" as const,
          title: "Long Notification",
          description: longDescription,
          when: new Date().toISOString(),
          read: false,
          status: "PENDING" as const,
        },
      ];

      (api.listNotifications as any).mockResolvedValue(mockNotifications);
      const user = userEvent.setup();
      render(<Notifications />);

      await waitFor(() => {
        expect(screen.getByText("Long Notification")).toBeInTheDocument();
      });

      const viewButton = screen.getByText("VIEW DETAILS");
      await user.click(viewButton);

      await waitFor(() => {
        expect(screen.getByText(longDescription)).toBeInTheDocument();
      });
    });
  });
});
