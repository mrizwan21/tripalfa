/**
 * @tripalfa/notifications - Base Notification Service
 * Abstract base class for notification services
 */

import { Logger } from "pino";
import {
  Notification,
  NotificationPayload,
  NotificationChannelType,
  NotificationPreferences,
  INotificationService,
  NotificationFilterOptions,
  ValidationError,
} from "../types";

export abstract class BaseNotificationService implements INotificationService {
  protected logger: Logger;

  constructor(logger: Logger) {
    this.logger = logger;
  }

  /**
   * Validate notification payload
   */
  protected validatePayload(payload: NotificationPayload): void {
    if (!payload.userId) {
      throw new ValidationError("userId is required");
    }

    if (!payload.type) {
      throw new ValidationError("Notification type is required");
    }

    if (!payload.title || payload.title.trim().length === 0) {
      throw new ValidationError("Notification title is required");
    }

    if (!payload.message || payload.message.trim().length === 0) {
      throw new ValidationError("Notification message is required");
    }

    if (payload.channels && payload.channels.length === 0) {
      throw new ValidationError(
        "At least one notification channel is required",
      );
    }

    if (
      payload.priority &&
      !["low", "medium", "high", "urgent"].includes(payload.priority)
    ) {
      throw new ValidationError("Invalid notification priority");
    }
  }

  /**
   * Validate channel
   */
  protected validateChannel(channel: NotificationChannelType): boolean {
    const validChannels: NotificationChannelType[] = [
      "email",
      "sms",
      "push",
      "in_app",
    ];
    return validChannels.includes(channel);
  }

  /**
   * Abstract methods to be implemented by subclasses
   */
  abstract sendNotification(payload: NotificationPayload): Promise<string>;
  abstract getNotifications(
    userId: string,
    limit: number,
    offset: number,
  ): Promise<Notification[]>;
  abstract markAsRead(notificationId: string): Promise<void>;
  abstract markAllAsRead(userId: string): Promise<void>;
  abstract deleteNotification(notificationId: string): Promise<void>;
  abstract getUnreadCount(userId: string): Promise<number>;
  abstract getPreferences(userId: string): Promise<NotificationPreferences>;
  abstract updatePreferences(
    userId: string,
    preferences: Partial<NotificationPreferences>,
  ): Promise<void>;

  /**
   * Helper method to log notification events
   */
  protected logNotificationEvent(
    notificationId: string,
    event: string,
    details?: Record<string, any>,
  ): void {
    this.logger.info(
      {
        notificationId,
        event,
        ...details,
      },
      `Notification event: ${event}`,
    );
  }

  /**
   * Helper method to log errors
   */
  protected logError(error: Error, context?: Record<string, any>): void {
    this.logger.error(
      {
        error: error.message,
        stack: error.stack,
        ...context,
      },
      "Notification error occurred",
    );
  }

  /**
   * Helper method to apply filters
   */
  protected applyFilters(
    notifications: Notification[],
    filters: NotificationFilterOptions,
  ): Notification[] {
    let filtered = [...notifications];

    if (filters.type) {
      filtered = filtered.filter((n) => n.type === filters.type);
    }

    if (filters.status) {
      filtered = filtered.filter((n) => n.status === filters.status);
    }

    if (filters.priority) {
      filtered = filtered.filter((n) => n.priority === filters.priority);
    }

    if (filters.startDate) {
      filtered = filtered.filter((n) => n.createdAt >= filters.startDate!);
    }

    if (filters.endDate) {
      filtered = filtered.filter((n) => n.createdAt <= filters.endDate!);
    }

    return filtered;
  }

  /**
   * Helper method to sort notifications
   */
  protected sortNotifications(
    notifications: Notification[],
    sortBy: keyof Notification = "createdAt",
    order: "asc" | "desc" = "desc",
  ): Notification[] {
    return notifications.sort((a, b) => {
      let aVal = a[sortBy];
      let bVal = b[sortBy];

      if (aVal instanceof Date && bVal instanceof Date) {
        aVal = aVal.getTime() as any;
        bVal = bVal.getTime() as any;
      }

      if (aVal === undefined || bVal === undefined) {
        if (aVal === bVal) return 0;
        return aVal === undefined ? 1 : -1;
      }

      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });
  }

  /**
   * Helper method to paginate
   */
  protected paginate<T>(items: T[], limit: number, offset: number): T[] {
    const start = offset;
    const end = start + limit;
    return items.slice(start, end);
  }
}
