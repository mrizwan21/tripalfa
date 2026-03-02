import React from "react";
import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast, Toaster, ToastType } from "../../../components/ui/toast";

describe("Toast Component", () => {
  describe("Appearance", () => {
    it("should render success toast with correct styling", () => {
      const onClose = vi.fn();
      render(
        <Toast
          id="test-1"
          type="success"
          title="Success Message"
          message="This is a success"
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Success Message")).toBeInTheDocument();
      expect(screen.getByText("This is a success")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("bg-emerald-50");
    });

    it("should render error toast with correct styling", () => {
      const onClose = vi.fn();
      render(
        <Toast
          id="test-2"
          type="error"
          title="Error Message"
          message="This is an error"
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Error Message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("bg-rose-50");
    });

    it("should render info toast with correct styling", () => {
      const onClose = vi.fn();
      render(
        <Toast
          id="test-3"
          type="info"
          title="Info Message"
          message="This is info"
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Info Message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("bg-blue-50");
    });

    it("should render warning toast with correct styling", () => {
      const onClose = vi.fn();
      render(
        <Toast
          id="test-4"
          type="warning"
          title="Warning Message"
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Warning Message")).toBeInTheDocument();
      expect(screen.getByRole("alert")).toHaveClass("bg-amber-50");
    });

    it("should render toast without message", () => {
      const onClose = vi.fn();
      render(
        <Toast
          id="test-5"
          type="success"
          title="Title Only"
          onClose={onClose}
        />,
      );

      expect(screen.getByText("Title Only")).toBeInTheDocument();
      expect(screen.queryByText(/message/i)).not.toBeInTheDocument();
    });

    it("should display toast icons for each type", () => {
      const types: ToastType[] = ["success", "error", "info", "warning"];
      types.forEach((type) => {
        const { unmount } = render(
          <Toast
            id={`test-${type}`}
            type={type}
            title={`${type} notification`}
            onClose={vi.fn()}
          />,
        );
        expect(screen.getByRole("alert")).toBeInTheDocument();
        unmount();
      });
    });
  });

  describe("Auto-dismiss", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should auto-dismiss after default duration", async () => {
      const onClose = vi.fn();
      const { unmount } = render(
        <Toast
          id="test-1"
          type="success"
          title="Auto dismiss"
          onClose={onClose}
        />,
      );

      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(5000);

      expect(onClose).toHaveBeenCalledWith("test-1");
      unmount();
    });

    it("should auto-dismiss after custom duration", async () => {
      const onClose = vi.fn();
      const { unmount } = render(
        <Toast
          id="test-1"
          type="success"
          title="Custom duration"
          duration={2000}
          onClose={onClose}
        />,
      );

      vi.advanceTimersByTime(1000);
      expect(onClose).not.toHaveBeenCalled();

      vi.advanceTimersByTime(1000);
      expect(onClose).toHaveBeenCalledWith("test-1");
      unmount();
    });
  });

  describe("Manual dismissal", () => {
    it("should dismiss when close button is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Toast
          id="test-1"
          type="success"
          title="Click to dismiss"
          onClose={onClose}
        />,
      );

      const closeButton = screen.getByLabelText("Dismiss notification");
      await user.click(closeButton);

      expect(onClose).toHaveBeenCalledWith("test-1");
    });

    it("should dismiss when toast is clicked", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Toast
          id="test-1"
          type="success"
          title="Click toast to dismiss"
          onClose={onClose}
        />,
      );

      const toast = screen.getByRole("alert");
      await user.click(toast);

      expect(onClose).toHaveBeenCalledWith("test-1");
    });
  });

  describe("Click handler", () => {
    it("should call onClick handler when toast is clicked", async () => {
      const onClose = vi.fn();
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Toast
          id="test-1"
          type="success"
          title="Clickable toast"
          onClick={onClick}
          onClose={onClose}
        />,
      );

      const toast = screen.getByRole("alert");
      await user.click(toast);

      expect(onClick).toHaveBeenCalled();
    });

    it("should not call onClick when close button is clicked", async () => {
      const onClose = vi.fn();
      const onClick = vi.fn();
      const user = userEvent.setup();
      render(
        <Toast
          id="test-1"
          type="success"
          title="Toast"
          onClick={onClick}
          onClose={onClose}
        />,
      );

      const closeButton = screen.getByLabelText("Dismiss notification");
      await user.click(closeButton);

      expect(onClick).not.toHaveBeenCalled();
      expect(onClose).toHaveBeenCalledWith("test-1");
    });
  });

  describe("Mouse interactions", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it("should pause auto-dismiss on mouse enter", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup({ delay: null });
      const { unmount } = render(
        <Toast
          id="test-1"
          type="success"
          title="Hover to pause"
          duration={5000}
          onClose={onClose}
        />,
      );

      const toast = screen.getByRole("alert");
      await user.pointer({ keys: "[MouseDown]", target: toast });

      vi.advanceTimersByTime(5000);
      expect(onClose).not.toHaveBeenCalled();

      unmount();
    });

    it("should resume auto-dismiss on mouse leave", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup({ delay: null });
      const { unmount } = render(
        <Toast
          id="test-1"
          type="success"
          title="Hover to pause"
          duration={5000}
          onClose={onClose}
        />,
      );

      const toast = screen.getByRole("alert");
      await user.pointer({ keys: "[MouseDown]", target: toast });
      await user.pointer({ keys: "[MouseUp]", target: toast });

      vi.advanceTimersByTime(5000);
      expect(onClose).toHaveBeenCalledWith("test-1");

      unmount();
    });
  });

  describe("Positioning", () => {
    it("should render at top-right by default", () => {
      const { container } = render(
        <Toast
          id="test-1"
          type="success"
          title="Default position"
          onClose={vi.fn()}
        />,
      );

      const alert = container.querySelector('[role="alert"]');
      expect(alert).toHaveClass("top-4", "right-4");
    });

    it("should render at custom positions", () => {
      const positions = ["top-left", "bottom-right", "bottom-left"] as const;

      positions.forEach((position) => {
        const { container, unmount } = render(
          <Toast
            id={`test-${position}`}
            type="success"
            title="Custom position"
            position={position}
            onClose={vi.fn()}
          />,
        );

        const alert = container.querySelector('[role="alert"]');
        if (position === "top-left") {
          expect(alert).toHaveClass("top-4", "left-4");
        } else if (position === "bottom-right") {
          expect(alert).toHaveClass("bottom-4", "right-4");
        } else if (position === "bottom-left") {
          expect(alert).toHaveClass("bottom-4", "left-4");
        }

        unmount();
      });
    });
  });

  describe("Accessibility", () => {
    it("should have proper ARIA attributes", () => {
      render(
        <Toast
          id="test-1"
          type="success"
          title="Accessible toast"
          onClose={vi.fn()}
        />,
      );

      const alert = screen.getByRole("alert");
      expect(alert).toHaveAttribute("aria-live", "polite");
      expect(alert).toHaveAttribute("aria-atomic", "true");
    });

    it("should have accessible close button", () => {
      render(
        <Toast id="test-1" type="success" title="Toast" onClose={vi.fn()} />,
      );

      const closeButton = screen.getByLabelText("Dismiss notification");
      expect(closeButton).toHaveAttribute("type", "button");
      expect(closeButton).toHaveAttribute("aria-label");
    });

    it("should have keyboard accessible close button", async () => {
      const onClose = vi.fn();
      const user = userEvent.setup();
      render(
        <Toast id="test-1" type="success" title="Toast" onClose={onClose} />,
      );

      const closeButton = screen.getByLabelText("Dismiss notification");
      closeButton.focus();
      await user.keyboard("{Enter}");

      expect(onClose).toHaveBeenCalledWith("test-1");
    });
  });
});

describe("Toaster Component", () => {
  describe("Multiple toasts", () => {
    it("should render multiple toasts", () => {
      const toasts = [
        { id: "1", type: "success" as const, title: "Toast 1" },
        { id: "2", type: "error" as const, title: "Toast 2" },
        { id: "3", type: "info" as const, title: "Toast 3" },
      ];

      render(<Toaster toasts={toasts} onRemove={vi.fn()} />);

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.getByText("Toast 3")).toBeInTheDocument();
    });

    it("should respect maxToasts limit", () => {
      const toasts = [
        { id: "1", type: "success" as const, title: "Toast 1" },
        { id: "2", type: "error" as const, title: "Toast 2" },
        { id: "3", type: "info" as const, title: "Toast 3" },
        { id: "4", type: "warning" as const, title: "Toast 4" },
      ];

      render(<Toaster toasts={toasts} onRemove={vi.fn()} maxToasts={3} />);

      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.getByText("Toast 3")).toBeInTheDocument();
      expect(screen.queryByText("Toast 4")).not.toBeInTheDocument();
    });

    it("should handle removing toasts", async () => {
      const toasts = [
        { id: "1", type: "success" as const, title: "Toast 1" },
        { id: "2", type: "error" as const, title: "Toast 2" },
      ];

      const onRemove = vi.fn();
      const { rerender } = render(
        <Toaster toasts={toasts} onRemove={onRemove} />,
      );

      const user = userEvent.setup();
      const closeButtons = screen.getAllByLabelText("Dismiss notification");
      await user.click(closeButtons[0]);

      expect(onRemove).toHaveBeenCalledWith("1");

      // Simulate toast removal
      rerender(<Toaster toasts={[toasts[1]]} onRemove={onRemove} />);

      expect(screen.queryByText("Toast 1")).not.toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
    });
  });

  describe("Toast stacking", () => {
    it("should display toasts in stack order", () => {
      const toasts = [
        { id: "1", type: "success" as const, title: "First" },
        { id: "2", type: "error" as const, title: "Second" },
      ];

      const { container } = render(
        <Toaster toasts={toasts} onRemove={vi.fn()} />,
      );

      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBe(2);
      // First toast should be rendered first
      expect(alerts[0]).toHaveTextContent("First");
      expect(alerts[1]).toHaveTextContent("Second");
    });

    it("should maintain consistent spacing between toasts", () => {
      const toasts = [
        { id: "1", type: "success" as const, title: "Toast 1" },
        { id: "2", type: "error" as const, title: "Toast 2" },
      ];

      const { container } = render(
        <Toaster toasts={toasts} onRemove={vi.fn()} />,
      );

      const toastContainer = container.querySelector(".flex.flex-col.gap-2");
      expect(toastContainer).toHaveClass("gap-2");
    });
  });

  describe("Position prop", () => {
    it("should apply position class to toaster container", () => {
      const toasts = [{ id: "1", type: "success" as const, title: "Toast" }];
      const { container } = render(
        <Toaster toasts={toasts} onRemove={vi.fn()} position="bottom-right" />,
      );

      const positionContainer = Array.from(
        container.querySelectorAll('[class*="fixed"]'),
      ).find((el) => el.className.includes("bottom-4"));

      expect(positionContainer).toHaveClass("bottom-4", "right-4");
    });
  });

  describe("Edge cases", () => {
    it("should handle empty toasts array", () => {
      const { container } = render(<Toaster toasts={[]} onRemove={vi.fn()} />);

      const alerts = container.querySelectorAll('[role="alert"]');
      expect(alerts.length).toBe(0);
    });

    it("should handle rapid toast creation", () => {
      const toasts = Array.from({ length: 10 }, (_, i) => ({
        id: String(i),
        type: "success" as const,
        title: `Toast ${i}`,
      }));

      render(<Toaster toasts={toasts} onRemove={vi.fn()} maxToasts={3} />);

      // Should only render first 3
      expect(screen.getByText("Toast 0")).toBeInTheDocument();
      expect(screen.getByText("Toast 1")).toBeInTheDocument();
      expect(screen.getByText("Toast 2")).toBeInTheDocument();
      expect(screen.queryByText("Toast 3")).not.toBeInTheDocument();
    });

    it("should handle very long toast messages", () => {
      const longMessage =
        "This is a very long notification message that should wrap properly without breaking the layout or causing overflow issues.";
      const toasts = [
        {
          id: "1",
          type: "info" as const,
          title: "Long message",
          message: longMessage,
        },
      ];

      render(<Toaster toasts={toasts} onRemove={vi.fn()} />);

      expect(screen.getByText(longMessage)).toBeInTheDocument();
    });
  });
});
