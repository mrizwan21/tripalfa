import { Request, Response } from 'express';
import { NotificationService } from '../services/notificationService';
import { prisma } from '@tripalfa/database';

const notificationService = new NotificationService(prisma);

/**
 * Send notification (admin/internal use)
 * POST /api/notifications/send
 */
export const sendNotification = async (req: Request, res: Response) => {
  try {
    const { userId, type, title, message, data, channels, priority, actionUrl } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({
        error: 'Missing required fields: userId, type, title, message',
      });
    }

    const notificationId = await notificationService.sendNotification({
      userId,
      type,
      title,
      message,
      data,
      channels,
      priority,
      actionUrl,
    });

    res.status(201).json({
      data: { notificationId },
      meta: { success: true },
    });
  } catch (error) {
    console.error('Error sending notification:', error);
    res.status(500).json({
      error: 'Failed to send notification',
    });
  }
};

/**
 * Get user notifications
 * GET /api/notifications
 */
export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { limit = '50', offset = '0' } = req.query;

    const notifications = await notificationService.getUserNotifications(
      userId,
      parseInt(limit as string),
      parseInt(offset as string)
    );

    const unreadCount = await notificationService.getUnreadCount(userId);
    const total = await prisma.notification.count({
      where: { userId },
    });

    res.json({
      data: notifications,
      meta: {
        total,
        unreadCount,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      error: 'Failed to fetch notifications',
    });
  }
};

/**
 * Mark notification as read
 * PATCH /api/notifications/:id/read
 */
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await notificationService.markAsRead(id);

    res.json({
      data: { success: true },
      meta: { message: 'Notification marked as read' },
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      error: 'Failed to mark notification as read',
    });
  }
};

/**
 * Mark all notifications as read
 * PATCH /api/notifications/read-all
 */
export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const result = await prisma.notification.updateMany({
      where: {
        userId,
        status: 'sent',
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: 'read',
      },
    });

    res.json({
      data: { count: result.count },
      meta: { message: `${result.count} notifications marked as read` },
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      error: 'Failed to mark notifications as read',
    });
  }
};

/**
 * Delete notification
 * DELETE /api/notifications/:id
 */
export const deleteNotification = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification || notification.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await notificationService.deleteNotification(id);

    res.json({
      data: { success: true },
      meta: { message: 'Notification deleted' },
    });
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      error: 'Failed to delete notification',
    });
  }
};

/**
 * Get unread notification count
 * GET /api/notifications/count/unread
 */
export const getUnreadCount = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const count = await notificationService.getUnreadCount(userId);

    res.json({
      data: { unreadCount: count },
      meta: { success: true },
    });
  } catch (error) {
    console.error('Error getting unread count:', error);
    res.status(500).json({
      error: 'Failed to get unread count',
    });
  }
};

/**
 * Get notification preferences
 * GET /api/notifications/preferences
 */
export const getPreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const preferences = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    // Return default preferences if not found
    const defaultPreferences = {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      offlineRequestUpdates: true,
      priceDropAlerts: true,
      bookingReminders: true,
      promotionalEmails: false,
    };

    res.json({
      data: preferences || defaultPreferences,
      meta: { success: true },
    });
  } catch (error) {
    console.error('Error fetching preferences:', error);
    res.status(500).json({
      error: 'Failed to fetch preferences',
    });
  }
};

/**
 * Update notification preferences
 * PATCH /api/notifications/preferences
 */
export const updatePreferences = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const { emailEnabled, smsEnabled, pushEnabled, offlineRequestUpdates, priceDropAlerts, bookingReminders, promotionalEmails } = req.body;

    await notificationService.updatePreferences(userId, {
      emailEnabled,
      smsEnabled,
      pushEnabled,
      offlineRequestUpdates,
      priceDropAlerts,
      bookingReminders,
      promotionalEmails,
    });

    const updated = await prisma.notificationPreference.findUnique({
      where: { userId },
    });

    res.json({
      data: updated,
      meta: { message: 'Preferences updated successfully' },
    });
  } catch (error) {
    console.error('Error updating preferences:', error);
    res.status(500).json({
      error: 'Failed to update preferences',
    });
  }
};

/**
 * Register push subscription
 * POST /api/notifications/subscribe
 */
export const subscribeToPush = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const { subscription } = req.body;

    if (!userId || !subscription) {
      return res.status(400).json({
        error: 'Missing required fields: subscription',
      });
    }

    const pushSub = await prisma.pushSubscription.create({
      data: {
        userId,
        endpoint: subscription.endpoint,
        auth: subscription.keys?.auth,
        p256dh: subscription.keys?.p256dh,
        isActive: true,
      },
    });

    res.status(201).json({
      data: pushSub,
      meta: { message: 'Successfully subscribed to push notifications' },
    });
  } catch (error) {
    console.error('Error subscribing to push:', error);
    res.status(500).json({
      error: 'Failed to subscribe to push notifications',
    });
  }
};

/**
 * Unsubscribe from push notifications
 * DELETE /api/notifications/subscribe/:id
 */
export const unsubscribeFromPush = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify ownership
    const subscription = await prisma.pushSubscription.findUnique({
      where: { id },
    });

    if (!subscription || subscription.userId !== userId) {
      return res.status(403).json({ error: 'Forbidden' });
    }

    await prisma.pushSubscription.delete({
      where: { id },
    });

    res.json({
      data: { success: true },
      meta: { message: 'Unsubscribed from push notifications' },
    });
  } catch (error) {
    console.error('Error unsubscribing from push:', error);
    res.status(500).json({
      error: 'Failed to unsubscribe from push notifications',
    });
  }
};
