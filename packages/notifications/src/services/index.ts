/**
 * @tripalfa/notifications - Services Index
 * Exports all notification services and the main manager
 */

export { BaseNotificationService } from './base';

import { createLogger, Logger } from '@tripalfa/shared-utils/logger';
import { BaseNotificationService } from './base';
import {
  Notification,
  NotificationPayload,
  NotificationChannelType,
  NotificationPreferences,
  NotificationChannel,
  ChannelConfig,
} from '../types';

/**
 * Main Notification Manager
 * Central service that orchestrates multi-channel notifications
 */
export class NotificationManager extends BaseNotificationService {
  private channels: Map<NotificationChannelType, NotificationChannel> = new Map();
  private notifications: Map<string, Notification> = new Map();
  private preferences: Map<string, NotificationPreferences> = new Map();
  private nextId = 0;

  constructor(logger?: Logger) {
    // Use provided logger or create shared logger
    const loggerInstance = logger || createLogger({ serviceName: 'notifications' });
    super(loggerInstance);
  }

  /**
   * Register a notification channel
   */
  registerChannel(channel: NotificationChannel): void {
    const channelName = channel.getName() as NotificationChannelType;

    if (!this.validateChannel(channelName)) {
      throw new Error(`Invalid channel name: ${channelName}`);
    }

    if (!channel.validateConfig()) {
      this.logger.warn({ channel: channelName }, 'Channel configuration invalid');
    }

    this.channels.set(channelName, channel);
    this.logNotificationEvent('manager', 'channel_registered', { channel: channelName });
  }

  /**
   * Send a notification through configured channels
   */
  async sendNotification(payload: NotificationPayload): Promise<string> {
    try {
      // Validate payload
      this.validatePayload(payload);

      // Get user preferences
      const preferences = this.preferences.get(payload.userId) || this.getDefaultPreferences(payload.userId);

      // Determine channels to use
      const channels = this.determineChannels(payload.channels, preferences);

      // Create notification record
      const notification: Notification = {
        id: this.generateNotificationId(),
        userId: payload.userId,
        type: payload.type,
        title: payload.title,
        message: payload.message,
        data: payload.data,
        priority: payload.priority || 'medium',
        channels,
        status: 'pending',
        actionUrl: payload.actionUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Store notification
      this.notifications.set(notification.id, notification);

      // Send through all channels concurrently
      const results = await Promise.allSettled(
        channels.map((channelType) => this.sendViaChannel(notification, channelType))
      );

      // Update notification status
      const successCount = results.filter((r) => r.status === 'fulfilled' && r.value).length;
      notification.status = successCount === channels.length ? 'sent' : 'failed';
      notification.sentAt = new Date();
      notification.updatedAt = new Date();

      this.notifications.set(notification.id, notification);

      this.logNotificationEvent(notification.id, 'sent', {
        channels,
        successCount,
        totalChannels: channels.length,
      });

      return notification.id;
    } catch (error) {
      this.logError(error as Error, { payload });
      throw error;
    }
  }

  /**
   * Send notification via specific channel
   */
  private async sendViaChannel(notification: Notification, channelType: NotificationChannelType): Promise<boolean> {
    const channel = this.channels.get(channelType);

    if (!channel) {
      this.logger.warn({ channel: channelType }, `Channel not configured: ${channelType}`);
      return false;
    }

    try {
      return await channel.send(notification);
    } catch (error) {
      this.logError(error as Error, {
        notificationId: notification.id,
        channel: channelType,
      });
      return false;
    }
  }

  /**
   * Get user notifications
   */
  async getNotifications(userId: string, limit: number = 50, offset: number = 0): Promise<Notification[]> {
    const userNotifications = Array.from(this.notifications.values()).filter((n) => n.userId === userId);

    const sorted = this.sortNotifications(userNotifications, 'createdAt', 'desc');
    const paginated = this.paginate(sorted, limit, offset);

    return paginated;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notification = this.notifications.get(notificationId);

    if (!notification) {
      throw new Error(`Notification ${notificationId} not found`);
    }

    notification.status = 'read';
    notification.readAt = new Date();
    notification.updatedAt = new Date();

    this.notifications.set(notificationId, notification);
    this.logNotificationEvent(notificationId, 'marked_read');
  }

  /**
   * Mark all user notifications as read
   */
  async markAllAsRead(userId: string): Promise<void> {
    const userNotifications = Array.from(this.notifications.values()).filter((n) => n.userId === userId);

    for (const notification of userNotifications) {
      if (notification.status !== 'read') {
        notification.status = 'read';
        notification.readAt = new Date();
        notification.updatedAt = new Date();
        this.notifications.set(notification.id, notification);
      }
    }

    this.logNotificationEvent('manager', 'all_marked_read', { userId, count: userNotifications.length });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    this.notifications.delete(notificationId);
    this.logNotificationEvent(notificationId, 'deleted');
  }

  /**
   * Get unread count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return Array.from(this.notifications.values()).filter(
      (n) => n.userId === userId && n.status === 'pending'
    ).length;
  }

  /**
   * Get user preferences
   */
  async getPreferences(userId: string): Promise<NotificationPreferences> {
    return this.preferences.get(userId) || this.getDefaultPreferences(userId);
  }

  /**
   * Update user preferences
   */
  async updatePreferences(userId: string, updates: Partial<NotificationPreferences>): Promise<void> {
    const current = this.preferences.get(userId) || this.getDefaultPreferences(userId);
    const updated = { ...current, ...updates };

    this.preferences.set(userId, updated);
    this.logNotificationEvent('manager', 'preferences_updated', { userId });
  }

  /**
   * Determine which channels to use based on preferences
   */
  private determineChannels(requestedChannels: NotificationChannelType[] | undefined, preferences: NotificationPreferences): NotificationChannelType[] {
    const channels: NotificationChannelType[] = [];

    if (requestedChannels) {
      for (const channel of requestedChannels) {
        if (this.isChannelEnabledForUser(channel, preferences)) {
          channels.push(channel);
        }
      }
    } else {
      // Use all enabled channels from preferences
      if (preferences.emailEnabled) channels.push('email');
      if (preferences.smsEnabled) channels.push('sms');
      if (preferences.pushEnabled) channels.push('push');
    }

    // Always include in_app
    if (!channels.includes('in_app')) {
      channels.push('in_app');
    }

    return channels;
  }

  /**
   * Check if a channel is enabled for user
   */
  private isChannelEnabledForUser(channel: NotificationChannelType, preferences: NotificationPreferences): boolean {
    switch (channel) {
      case 'email':
        return preferences.emailEnabled;
      case 'sms':
        return preferences.smsEnabled;
      case 'push':
        return preferences.pushEnabled;
      case 'in_app':
        return true; // Always enabled
      default:
        return false;
    }
  }

  /**
   * Get default preferences
   */
  private getDefaultPreferences(userId: string): NotificationPreferences {
    return {
      userId,
      emailEnabled: true,
      smsEnabled: false,
      pushEnabled: true,
      offlineRequestUpdates: true,
      priceDropAlerts: true,
      bookingReminders: true,
      promotionalEmails: false,
    };
  }

  /**
   * Generate unique notification ID
   */
  private generateNotificationId(): string {
    return `notif-${Date.now()}-${++this.nextId}`;
  }

  /**
   * Get channel instance
   */
  getChannel(channelType: NotificationChannelType): NotificationChannel | undefined {
    return this.channels.get(channelType);
  }

  /**
   * Get all registered channels
   */
  getChannels(): Map<NotificationChannelType, NotificationChannel> {
    return this.channels;
  }

  /**
   * Statistics and monitoring
   */
  getStats() {
    const totalNotifications = this.notifications.size;
    const sentNotifications = Array.from(this.notifications.values()).filter((n) => n.status === 'sent').length;
    const failedNotifications = Array.from(this.notifications.values()).filter((n) => n.status === 'failed').length;
    const readNotifications = Array.from(this.notifications.values()).filter((n) => n.status === 'read').length;

    return {
      totalNotifications,
      sentNotifications,
      failedNotifications,
      readNotifications,
      failureRate: totalNotifications > 0 ? (failedNotifications / totalNotifications) * 100 : 0,
      registeredChannels: this.channels.size,
    };
  }
}
