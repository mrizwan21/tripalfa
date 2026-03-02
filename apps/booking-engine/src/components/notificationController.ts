import { Request, Response, NextFunction } from "express";
import { createLogger } from "@tripalfa/shared-utils/logger";
const logger = createLogger({ serviceName: "booking-engine" });

// Types for notification operations
interface CreateNotificationRequest {
  userId: string;
  orderId?: string;
  channels: ("email" | "sms" | "push" | "in_app")[];
  notificationType: string;
  priority?: "low" | "medium" | "high" | "urgent";
  content: Record<string, any>;
  metadata?: Record<string, any>;
  scheduledFor?: Date;
}

interface UpdateNotificationRequest {
  channel?: string;
  status?: "pending" | "sent" | "failed" | "delivered" | "opened";
  sentAt?: string;
  deliveredAt?: string;
  openedAt?: string;
  error?: string;
  failureReason?: string;
}

interface ListNotificationsQuery {
  userId?: string;
  page?: number | string;
  limit?: number | string;
  notificationType?: string;
  status?: string;
  sortBy?: string;
  order?: "asc" | "desc";
}

// In-memory storage for notifications during this implementation
// In production, this would be replaced with database storage
const notificationStorage = new Map<string, any>();
let notificationIdCounter = 0;

/**
 * Generate unique notification ID
 */
function generateNotificationId(): string {
  return `notif-${Date.now()}-${++notificationIdCounter}`;
}

/**
 * Create a new notification
 * POST /api/notifications
 */
export const createNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const {
      userId,
      orderId,
      channels,
      notificationType,
      priority = "medium",
      content,
      metadata,
      scheduledFor,
    }: CreateNotificationRequest = req.body;

    // Validation
    if (!userId) {
      res.status(400).json({
        error: "userId is required",
        message: "User ID must be provided",
      });
      return;
    }

    if (!channels || channels.length === 0) {
      res.status(400).json({
        error: "channels is required",
        message: "At least one channel must be specified",
      });
      return;
    }

    if (!notificationType) {
      res.status(400).json({
        error: "notificationType is required",
        message: "Notification type must be specified",
      });
      return;
    }

    if (!content || Object.keys(content).length === 0) {
      res.status(400).json({
        error: "content is required",
        message: "Notification content must be provided",
      });
      return;
    }

    // Validate that all channels have corresponding content
    for (const channel of channels) {
      const channelKey = channel.replace("_", "");
      if (!content[channel] && !content[channelKey]) {
        logger.warn(`Missing content for channel: ${channel}`);
      }
    }

    // Create notification object
    const notificationId = generateNotificationId();
    const now = new Date();

    const notification = {
      id: notificationId,
      userId,
      orderId: orderId || undefined,
      channels,
      notificationType,
      priority,
      content,
      metadata: metadata || {},
      status: "pending",
      channelStatus: channels.reduce(
        (acc, channel) => {
          acc[channel] = "pending";
          return acc;
        },
        {} as Record<string, string>,
      ),
      scheduledFor: scheduledFor ? new Date(scheduledFor) : undefined,
      sentAt: undefined,
      deliveredAt: undefined,
      openedAt: undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Store notification
    notificationStorage.set(notificationId, notification);

    logger.info(`Notification created: ${notificationId}`, {
      userId,
      channels,
      notificationType,
    });

    res.status(201).json({
      id: notification.id,
      userId: notification.userId,
      orderId: notification.orderId,
      channels: notification.channels,
      notificationType: notification.notificationType,
      priority: notification.priority,
      status: notification.status,
      channelStatus: notification.channelStatus,
      createdAt: notification.createdAt,
      updatedAt: notification.updatedAt,
    });
  } catch (error) {
    logger.error("Error creating notification", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

/**
 * Get notification by ID
 * GET /api/notifications/:id
 */
export const getNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : (req.params.id as string);

    const notification = notificationStorage.get(id);

    if (!notification) {
      res.status(404).json({
        error: "Not Found",
        message: `Notification ${id} not found`,
      });
      return;
    }

    res.status(200).json(notification);
  } catch (error) {
    logger.error("Error retrieving notification", {
      error: error instanceof Error ? error.message : "Unknown error",
      notificationId: req.params.id,
    });
    next(error);
  }
};

/**
 * List notifications with pagination and filtering
 * GET /api/notifications
 */
export const listNotifications = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const query: ListNotificationsQuery = req.query as any;
    const page = Math.max(1, parseInt(String(query.page || 1), 10));
    const limit = Math.min(100, parseInt(String(query.limit || 10), 10));
    const sortBy = query.sortBy || "createdAt";
    const order = query.order || "desc";

    let notifications = Array.from(notificationStorage.values());

    // Filter by userId
    if (query.userId) {
      notifications = notifications.filter((n) => n.userId === query.userId);
    }

    // Filter by notification type
    if (query.notificationType) {
      notifications = notifications.filter(
        (n) => n.notificationType === query.notificationType,
      );
    }

    // Filter by status
    if (query.status) {
      notifications = notifications.filter((n) => n.status === query.status);
    }

    // Sort
    notifications.sort((a, b) => {
      let aVal = a[sortBy as keyof typeof a];
      let bVal = b[sortBy as keyof typeof b];

      // Handle dates
      if (aVal instanceof Date) {
        aVal = aVal.getTime() as any;
      }
      if (bVal instanceof Date) {
        bVal = bVal.getTime() as any;
      }

      if (order === "asc") {
        return aVal > bVal ? 1 : -1;
      } else {
        return aVal < bVal ? 1 : -1;
      }
    });

    // Paginate
    const total = notifications.length;
    const start = (page - 1) * limit;
    const end = start + limit;
    const paginatedNotifications = notifications.slice(start, end);

    res.status(200).json({
      data: paginatedNotifications,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error("Error listing notifications", {
      error: error instanceof Error ? error.message : "Unknown error",
    });
    next(error);
  }
};

/**
 * Update timestamps on a notification
 */
function updateTimestamps(
  notification: any,
  updates: UpdateNotificationRequest,
): void {
  if (updates.sentAt) {
    notification.sentAt = new Date(updates.sentAt);
  }
  if (updates.deliveredAt) {
    notification.deliveredAt = new Date(updates.deliveredAt);
  }
  if (updates.openedAt) {
    notification.openedAt = new Date(updates.openedAt);
  }
}

/**
 * Update error information on a notification
 */
function updateErrorInfo(
  notification: any,
  updates: UpdateNotificationRequest,
): void {
  if (updates.error) {
    notification.error = updates.error;
  }
  if (updates.failureReason) {
    notification.failureReason = updates.failureReason;
  }
}

/**
 * Update notification status
 * PATCH /api/notifications/:id
 */
export const updateNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : (req.params.id as string);
    const updates: UpdateNotificationRequest = req.body;

    const notification = notificationStorage.get(id);

    if (!notification) {
      res.status(404).json({
        error: "Not Found",
        message: `Notification ${id} not found`,
      });
      return;
    }

    // Update channel-specific status if channel is specified
    if (updates.channel && updates.status) {
      if (!notification.channelStatus) {
        notification.channelStatus = {};
      }
      notification.channelStatus[updates.channel] = updates.status;
    }

    // Update notification-level status if provided
    if (updates.status) {
      notification.status = updates.status;
    }

    // Update timestamps and error info
    updateTimestamps(notification, updates);
    updateErrorInfo(notification, updates);

    notification.updatedAt = new Date();

    // Update storage
    notificationStorage.set(id, notification);

    logger.info(`Notification updated: ${id}`, {
      status: updates.status,
      channel: updates.channel,
    });

    res.status(200).json(notification);
  } catch (error) {
    logger.error("Error updating notification", {
      error: error instanceof Error ? error.message : "Unknown error",
      notificationId: req.params.id,
    });
    next(error);
  }
};

/**
 * Delete notification (soft delete)
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  try {
    const id = Array.isArray(req.params.id)
      ? req.params.id[0]
      : (req.params.id as string);

    const notification = notificationStorage.get(id);

    if (!notification) {
      res.status(404).json({
        error: "Not Found",
        message: `Notification ${id} not found`,
      });
      return;
    }

    // Soft delete by removing from storage
    notificationStorage.delete(id);

    logger.info(`Notification deleted: ${id}`, {
      userId: notification.userId,
    });

    res.status(200).json({
      success: true,
      message: `Notification ${id} deleted successfully`,
    });
  } catch (error) {
    logger.error("Error deleting notification", {
      error: error instanceof Error ? error.message : "Unknown error",
      notificationId: req.params.id,
    });
    next(error);
  }
};
