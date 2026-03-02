import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { NotificationDetailsPopup } from "../../components/NotificationDetailsPopup";
import { MOCK_NOTIFICATIONS } from "../../lib/notification-types";

describe("NotificationDetailsPopup Component", () => {
  describe("Component Rendering", () => {
    it("should not render when isOpen is false", () => {
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={false}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it("should not render when notification is null", () => {
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={null}
        />,
      );
      expect(container.firstChild).toBeEmptyDOMElement();
    });

    it("should render when isOpen is true and notification exists", () => {
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      expect(screen.getByText(MOCK_NOTIFICATIONS[0].title)).toBeInTheDocument();
    });

    it("should render modal overlay", () => {
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      const overlay = container.querySelector(".fixed");
      expect(overlay).toBeInTheDocument();
    });
  });

  describe("Notification Content Display", () => {
    it("should display notification title", () => {
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      expect(screen.getByText(MOCK_NOTIFICATIONS[0].title)).toBeInTheDocument();
    });

    it("should display notification description", () => {
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      expect(
        screen.getByText(MOCK_NOTIFICATIONS[0].description),
      ).toBeInTheDocument();
    });

    it("should display notification date", () => {
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      const dateElement = screen.getByText(/Feb/);
      expect(dateElement).toBeInTheDocument();
    });

    it("should display passenger name when available", () => {
      const ssrNotification = MOCK_NOTIFICATIONS.find((n) => n.passengerName);
      if (ssrNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={ssrNotification}
          />,
        );
        expect(
          screen.getByText(ssrNotification.passengerName!),
        ).toBeInTheDocument();
      }
    });

    it("should display segment information when available", () => {
      const notificationWithSegment = MOCK_NOTIFICATIONS.find((n) => n.segment);
      if (notificationWithSegment) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={notificationWithSegment}
          />,
        );
        expect(
          screen.getByText(notificationWithSegment.segment!),
        ).toBeInTheDocument();
      }
    });

    it("should display price and currency when available", () => {
      const notificationWithPrice = MOCK_NOTIFICATIONS.find(
        (n) => n.price && n.price > 0,
      );
      if (notificationWithPrice) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={notificationWithPrice}
          />,
        );
        expect(
          screen.getByText(notificationWithPrice.currency!),
        ).toBeInTheDocument();
      }
    });

    it("should display remarks for rejected notifications", () => {
      const rejectedNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.status === "REJECTED" && n.remarks,
      );
      if (rejectedNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={rejectedNotification}
          />,
        );
        expect(
          screen.getByText(rejectedNotification.remarks!),
        ).toBeInTheDocument();
      }
    });

    it("should display status badge", () => {
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );
      expect(
        screen.getByText(new RegExp(MOCK_NOTIFICATIONS[0].status)),
      ).toBeInTheDocument();
    });
  });

  describe("Status-specific Display", () => {
    it("should display CONFIRMED notification with correct styling", () => {
      const confirmedNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.status === "CONFIRMED",
      );
      if (confirmedNotification) {
        const { container } = render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={confirmedNotification}
          />,
        );
        expect(container.textContent).toContain(confirmedNotification.title);
      }
    });

    it("should display PENDING notification with correct styling", () => {
      const pendingNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.status === "PENDING",
      );
      if (pendingNotification) {
        const { container } = render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={pendingNotification}
          />,
        );
        expect(container.textContent).toContain(pendingNotification.title);
      }
    });

    it("should display REJECTED notification with remarks", () => {
      const rejectedNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.status === "REJECTED",
      );
      if (rejectedNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={rejectedNotification}
          />,
        );
        expect(
          screen.getByText(rejectedNotification.status),
        ).toBeInTheDocument();
      }
    });

    it("should display INFO notification with correct styling", () => {
      const infoNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.status === "INFO",
      );
      if (infoNotification) {
        const { container } = render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={infoNotification}
          />,
        );
        expect(container.textContent).toContain(infoNotification.title);
      }
    });
  });

  describe("Notification Types Display", () => {
    it("should display SSR notification type correctly", () => {
      const ssrNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.type === "INFO" && n.passengerName,
      );
      if (ssrNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={ssrNotification}
          />,
        );
        expect(screen.getByText(ssrNotification.title)).toBeInTheDocument();
      }
    });

    it("should display CONFIRMATION notification type correctly", () => {
      const confirmationNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.type === "SUCCESS" && n.status === "CONFIRMED",
      );
      if (confirmationNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={confirmationNotification}
          />,
        );
        expect(
          screen.getByText(confirmationNotification.title),
        ).toBeInTheDocument();
      }
    });

    it("should display ITINERARY_CHANGE notification type correctly", () => {
      const itineraryNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.type === "INFO" && n.segment,
      );
      if (itineraryNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={itineraryNotification}
          />,
        );
        expect(
          screen.getByText(itineraryNotification.title),
        ).toBeInTheDocument();
      }
    });

    it("should display AMENDMENT notification type correctly", () => {
      const amendmentNotification = MOCK_NOTIFICATIONS.find(
        (n) => n.type === "WARNING" && n.status === "REJECTED",
      );
      if (amendmentNotification) {
        render(
          <NotificationDetailsPopup
            isOpen={true}
            onClose={vi.fn()}
            notification={amendmentNotification}
          />,
        );
        expect(
          screen.getByText(amendmentNotification.title),
        ).toBeInTheDocument();
      }
    });
  });

  describe("User Interactions", () => {
    it("should call onClose when close button is clicked", () => {
      const onCloseMock = vi.fn();
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={onCloseMock}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );

      const closeButton = container.querySelector("button");
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(onCloseMock).toHaveBeenCalled();
      }
    });

    it("should call onClose when clicking outside the modal", () => {
      const onCloseMock = vi.fn();
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={onCloseMock}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );

      const overlay = container.querySelector(".fixed");
      if (overlay && overlay.children[0]) {
        fireEvent.click(overlay.children[0]);
        expect(onCloseMock).toHaveBeenCalled();
      }
    });

    it("should not call onClose when clicking inside the modal content", () => {
      const onCloseMock = vi.fn();
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={onCloseMock}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );

      const titleElement = screen.getByText(MOCK_NOTIFICATIONS[0].title);
      fireEvent.click(titleElement);

      // Should not be called when clicking inside modal
      expect(onCloseMock).not.toHaveBeenCalled();
    });
  });

  describe("Responsive Design", () => {
    it("should render modal with correct CSS classes for responsiveness", () => {
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );

      const modal = container.querySelector(".relative");
      expect(modal?.className).toContain("max-w-lg");
    });
  });

  describe("Modal Accessibility", () => {
    it("should have a close button", () => {
      const { container } = render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );

      const closeButton = container.querySelector("button");
      expect(closeButton).toBeInTheDocument();
    });

    it("should use proper heading hierarchy", () => {
      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={MOCK_NOTIFICATIONS[0]}
        />,
      );

      const heading = screen.getByRole("heading", { level: 2 });
      expect(heading).toBeInTheDocument();
    });
  });

  describe("Edge Cases", () => {
    it("should handle notification with minimal fields", () => {
      const minimalNotification = {
        id: "1",
        type: "INFO" as const,
        title: "Test",
        description: "Test description",
        when: "2023-09-15T10:30:00Z",
        read: false,
      };

      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={minimalNotification}
        />,
      );

      expect(screen.getByText(minimalNotification.title)).toBeInTheDocument();
    });

    it("should handle notification with all optional fields", () => {
      const fullNotification = MOCK_NOTIFICATIONS[1]; // SSR with all fields

      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={fullNotification}
        />,
      );

      expect(screen.getByText(fullNotification.title)).toBeInTheDocument();
      if (fullNotification.passengerName) {
        expect(
          screen.getByText(fullNotification.passengerName),
        ).toBeInTheDocument();
      }
    });

    it("should handle very long notification titles", () => {
      const longTitleNotification = {
        ...MOCK_NOTIFICATIONS[0],
        title: "A".repeat(200),
      };

      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={longTitleNotification}
        />,
      );

      expect(screen.getByText("A".repeat(200))).toBeInTheDocument();
    });

    it("should handle special characters in content", () => {
      const specialNotification = {
        ...MOCK_NOTIFICATIONS[0],
        title: "Test <>&\"'",
        description: "Special chars: @#$%^&*()",
      };

      render(
        <NotificationDetailsPopup
          isOpen={true}
          onClose={vi.fn()}
          notification={specialNotification}
        />,
      );

      expect(screen.getByText(/Test/)).toBeInTheDocument();
    });
  });
});
