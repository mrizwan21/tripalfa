import { describe, it, expect } from "vitest";
import {
  NotificationType,
  NotificationStatus,
  NotificationItem,
  MOCK_NOTIFICATIONS,
} from "../../lib/notification-types";

describe("notification-types", () => {
  describe("Type Definitions", () => {
    it("should define all notification types", () => {
      const notificationTypes: NotificationType[] = [
        "SUCCESS",
        "INFO",
        "WARNING",
        "ERROR",
      ];
      expect(notificationTypes).toHaveLength(4);
    });

    it("should define all notification statuses", () => {
      const statuses: NotificationStatus[] = [
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "INFO",
        "CANCELLED",
      ];
      expect(statuses).toHaveLength(5);
    });
  });

  describe("Mock Data Validation", () => {
    it("should have valid mock notifications", () => {
      expect(MOCK_NOTIFICATIONS).toBeDefined();
      expect(Array.isArray(MOCK_NOTIFICATIONS)).toBe(true);
      expect(MOCK_NOTIFICATIONS.length).toBeGreaterThan(0);
    });

    it("all mock notifications should have required fields", () => {
      MOCK_NOTIFICATIONS.forEach((notification) => {
        expect(notification).toHaveProperty("id");
        expect(notification).toHaveProperty("type");
        expect(notification).toHaveProperty("title");
        expect(notification).toHaveProperty("description");
        expect(notification).toHaveProperty("when");
        expect(notification).toHaveProperty("read");
      });
    });

    it("should have notifications with correct type values", () => {
      const validTypes: NotificationType[] = [
        "SUCCESS",
        "INFO",
        "WARNING",
        "ERROR",
      ];
      MOCK_NOTIFICATIONS.forEach((notification) => {
        expect(validTypes).toContain(notification.type);
      });
    });

    it("should have notifications with correct status values", () => {
      const validStatuses: NotificationStatus[] = [
        "PENDING",
        "CONFIRMED",
        "REJECTED",
        "INFO",
        "CANCELLED",
      ];
      MOCK_NOTIFICATIONS.forEach((notification) => {
        if (notification.status) {
          expect(validStatuses).toContain(notification.status);
        }
      });
    });

    it("SUCCESS notification should have correct structure", () => {
      const success = MOCK_NOTIFICATIONS.find((n) => n.type === "SUCCESS");
      expect(success).toBeDefined();
      expect(success?.status).toBe("CONFIRMED");
    });

    it("INFO notifications should have valid when field", () => {
      const infoNotifications = MOCK_NOTIFICATIONS.filter(
        (n) => n.type === "INFO",
      );
      expect(infoNotifications.length).toBeGreaterThan(0);

      infoNotifications.forEach((notification) => {
        expect(notification.when).toBeDefined();
        expect(() => new Date(notification.when)).not.toThrow();
      });
    });

    it("should have notifications with timestamps", () => {
      MOCK_NOTIFICATIONS.forEach((notification) => {
        const date = new Date(notification.when);
        expect(isNaN(date.getTime())).toBe(false);
      });
    });

    it("should have unique notification IDs", () => {
      const ids = MOCK_NOTIFICATIONS.map((n) => n.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(MOCK_NOTIFICATIONS.length);
    });

    it("read field should be boolean", () => {
      MOCK_NOTIFICATIONS.forEach((notification) => {
        expect(typeof notification.read).toBe("boolean");
      });
    });

    it("should have correct pricing for notifications with prices", () => {
      const priced = MOCK_NOTIFICATIONS.filter((n) => n.price !== undefined);
      priced.forEach((notification) => {
        expect(typeof notification.price).toBe("number");
        expect(notification.price).toBeGreaterThanOrEqual(0);
        if (notification.price && notification.price > 0) {
          expect(notification.currency).toBeDefined();
        }
      });
    });
  });

  describe("Mock Data Statistics", () => {
    it("should have at least one read and one unread notification", () => {
      const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;
      const readCount = MOCK_NOTIFICATIONS.filter((n) => n.read).length;
      expect(unreadCount).toBeGreaterThan(0);
      expect(readCount).toBeGreaterThan(0);
    });

    it("should have various notification types represented", () => {
      const types = new Set(MOCK_NOTIFICATIONS.map((n) => n.type));
      expect(types.size).toBeGreaterThanOrEqual(2);
    });
  });
});
