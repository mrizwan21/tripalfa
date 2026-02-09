import logger from '../utils/logger';
import { CacheService } from '../cache/redis';
import { metricsStore } from '../monitoring/metrics';
// Booking shape is complex across modules; use `any` here to avoid tight coupling in this service.
type Booking = any;

export interface Notification {
  id: string;
  type: 'booking_created' | 'booking_confirmed' | 'booking_cancelled' | 'payment_received' | 'agent_assigned' | 'booking_reminder' | 'payment_reminder';
  title: string;
  message: string;
  userId: string;
  userName: string;
  bookingId?: string;
  bookingReference?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: ('email' | 'sms' | 'push' | 'in_app')[];
  status: 'pending' | 'sent' | 'failed' | 'delivered';
  scheduledFor?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface EmailTemplate {
  id: string;
  name: string;
  subject: string;
  html: string;
  text: string;
  variables: string[];
  createdAt: Date;
}

export interface SMSTemplate {
  id: string;
  name: string;
  message: string;
  variables: string[];
  createdAt: Date;
}

export interface NotificationChannel {
  send(notification: Notification): Promise<boolean>;
  validateConfig(): boolean;
}

export class EmailChannel implements NotificationChannel {
  private config: {
    smtpHost: string;
    smtpPort: number;
    smtpUser: string;
    smtpPass: string;
    fromEmail: string;
    fromName: string;
  };

  constructor(config: any) {
    this.config = config;
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      // Mock email sending - in production, use a service like SendGrid, AWS SES, etc.
      logger.info(`Sending email to ${notification.userId}: ${notification.title}`);
      
      // Simulate email sending delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      (metricsStore as any).increment('notification_sent', { channel: 'email', type: notification.type });
      return true;
    } catch (error) {
      logger.error(`Email sending failed for notification ${notification.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: notification.userId,
      });
      (metricsStore as any).increment('notification_failed', { channel: 'email', type: notification.type });
      return false;
    }
  }

  validateConfig(): boolean {
    return !!(
      this.config.smtpHost &&
      this.config.smtpPort &&
      this.config.smtpUser &&
      this.config.smtpPass &&
      this.config.fromEmail
    );
  }
}

export class SMSChannel implements NotificationChannel {
  private config: {
    apiKey: string;
    apiSecret: string;
    fromNumber: string;
  };

  constructor(config: any) {
    this.config = config;
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      // Mock SMS sending - in production, use a service like Twilio, AWS SNS, etc.
      logger.info(`Sending SMS to ${notification.userId}: ${notification.title}`);
      
      // Simulate SMS sending delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      (metricsStore as any).increment('notification_sent', { channel: 'sms', type: notification.type });
      return true;
    } catch (error) {
      logger.error(`SMS sending failed for notification ${notification.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: notification.userId,
      });
      (metricsStore as any).increment('notification_failed', { channel: 'sms', type: notification.type });
      return false;
    }
  }

  validateConfig(): boolean {
    return !!(
      this.config.apiKey &&
      this.config.apiSecret &&
      this.config.fromNumber
    );
  }
}

export class PushNotificationChannel implements NotificationChannel {
  private config: {
    fcmServerKey: string;
    apnsCert: string;
    apnsKey: string;
  };

  constructor(config: any) {
    this.config = config;
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      // Mock push notification sending - in production, use Firebase Cloud Messaging, etc.
      logger.info(`Sending push notification to ${notification.userId}: ${notification.title}`);
      
      // Simulate push notification delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      (metricsStore as any).increment('notification_sent', { channel: 'push', type: notification.type });
      return true;
    } catch (error) {
      logger.error(`Push notification failed for notification ${notification.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: notification.userId,
      });
      (metricsStore as any).increment('notification_failed', { channel: 'push', type: notification.type });
      return false;
    }
  }

  validateConfig(): boolean {
    return !!(
      this.config.fcmServerKey ||
      (this.config.apnsCert && this.config.apnsKey)
    );
  }
}

export class InAppNotificationChannel implements NotificationChannel {
  private cache: CacheService;

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      // Store in-app notification in cache for real-time delivery
      const key = `user_notifications:${notification.userId}`;
      const userNotifications = await this.cache.get(key) || '[]';
        const notifications = JSON.parse(String(userNotifications));
      
      notifications.push(notification);
      
      // Keep only last 100 notifications per user
      if (notifications.length > 100) {
        notifications.splice(0, notifications.length - 100);
      }
      
      await this.cache.set(key, JSON.stringify(notifications), 86400); // 24 hours
      
      // Also store in a global notifications list for admin dashboard
      const globalKey = 'all_notifications';
      const allNotifications = await this.cache.get(globalKey) || '[]';
        const globalNotifications = JSON.parse(String(allNotifications));
      
      globalNotifications.push(notification);
      
      // Keep only last 1000 notifications globally
      if (globalNotifications.length > 1000) {
        globalNotifications.splice(0, globalNotifications.length - 1000);
      }
      
      await this.cache.set(globalKey, JSON.stringify(globalNotifications), 86400);
      
      (metricsStore as any).increment('notification_sent', { channel: 'in_app', type: notification.type });
      return true;
    } catch (error) {
      logger.error(`In-app notification failed for notification ${notification.id}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId: notification.userId,
      });
      (metricsStore as any).increment('notification_failed', { channel: 'in_app', type: notification.type });
      return false;
    }
  }

  validateConfig(): boolean {
    return true; // In-app notifications don't need external config
  }
}

export class NotificationService {
  private channels: Map<string, NotificationChannel> = new Map();
  private cache: CacheService;
  private templates: Map<string, EmailTemplate | SMSTemplate> = new Map();

  constructor(cache: CacheService) {
    this.cache = cache;
  }

  addChannel(type: string, channel: NotificationChannel): void {
    if (!channel.validateConfig()) {
      throw new Error(`Invalid configuration for ${type} channel`);
    }
    
    this.channels.set(type, channel);
    logger.info(`Notification channel added: ${type}`);
  }

  addEmailTemplate(template: EmailTemplate): void {
    this.templates.set(`email:${template.id}`, template);
    logger.info(`Email template added: ${template.name}`);
  }

  addSMSTemplate(template: SMSTemplate): void {
    this.templates.set(`sms:${template.id}`, template);
    logger.info(`SMS template added: ${template.name}`);
  }

  async sendNotification(notification: Partial<Notification>): Promise<Notification> {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      status: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
      channels: notification.channels || ['in_app'],
    } as Notification;

    try {
      const results = await Promise.allSettled(
        (fullNotification.channels || []).map(channelType => {
          const channel = this.channels.get(channelType);
          if (!channel) {
            throw new Error(`Channel ${channelType} not configured`);
          }
          return channel.send(fullNotification);
        })
      );

      const successCount = results.filter(result => result.status === 'fulfilled' && result.value).length;
      const totalCount = results.length;

      fullNotification.status = successCount === totalCount ? 'sent' : 'failed';
      fullNotification.sentAt = new Date();
      fullNotification.updatedAt = new Date();

      // Store notification in cache
      await this.cache.set(`notification:${fullNotification.id}`, JSON.stringify(fullNotification), 604800); // 7 days

      logger.info(`Notification ${fullNotification.id} sent to ${successCount}/${totalCount} channels`);
      
      return fullNotification;
    } catch (error) {
      logger.error(`Notification sending failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        notificationId: fullNotification.id,
      });
      
      fullNotification.status = 'failed';
      fullNotification.updatedAt = new Date();
      
      return fullNotification;
    }
  }

  async sendBookingNotification(
    booking: Booking,
    type: 'created' | 'confirmed' | 'cancelled' | 'updated',
    userId?: string
  ): Promise<Notification> {
    const user = userId ? await this.getUser(userId) : booking.createdByUser;
    
    const notificationData = {
      bookingId: booking.id,
      bookingReference: booking.reference,
      customerName: booking.customerInfo.name,
      bookingType: booking.type,
      bookingDate: booking.timeline.bookingDate,
      travelDate: booking.timeline.travelDate,
      amount: booking.pricing.sellingAmount,
      currency: booking.pricing.currency,
    };

    const notification: Partial<Notification> = {
      type: 'booking_created',
      title: this.getBookingNotificationTitle(type, booking.type),
      message: this.getBookingNotificationMessage(type, booking.type, notificationData),
      userId: user?.id || booking.customerInfo.email,
      userName: user?.name || booking.customerInfo.name,
      bookingId: booking.id,
      bookingReference: booking.reference,
      priority: this.getBookingNotificationPriority(type),
      channels: ['in_app', 'email'],
    };

    // Add SMS for high-priority notifications
    if (notification.priority === 'high' || notification.priority === 'urgent') {
      notification.channels!.push('sms');
    }

    return this.sendNotification(notification);
  }

  async sendPaymentNotification(
    booking: Booking,
    paymentStatus: 'received' | 'failed' | 'refunded',
    amount: number
  ): Promise<Notification> {
    const user = booking.createdByUser || { id: booking.customerInfo.email, name: booking.customerInfo.name };

    const notification: Partial<Notification> = {
      type: 'payment_received',
      title: this.getPaymentNotificationTitle(paymentStatus),
      message: this.getPaymentNotificationMessage(paymentStatus, amount, booking.pricing.currency, booking.reference),
      userId: user.id,
      userName: user.name,
      bookingId: booking.id,
      bookingReference: booking.reference,
      priority: paymentStatus === 'failed' ? 'high' : 'medium',
      channels: ['in_app', 'email'],
    };

    if (paymentStatus === 'failed') {
      notification.channels!.push('sms');
    }

    return this.sendNotification(notification);
  }

  async sendAgentAssignmentNotification(
    booking: Booking,
    agentId: string
  ): Promise<Notification> {
    const agent = await this.getUser(agentId);
    const user = booking.createdByUser || { id: booking.customerInfo.email, name: booking.customerInfo.name };

    const notification: Partial<Notification> = {
      type: 'agent_assigned',
      title: 'Booking Assigned to Agent',
      message: `Booking ${booking.reference} has been assigned to ${agent?.name || 'an agent'}.`,
      userId: user.id,
      userName: user.name,
      bookingId: booking.id,
      bookingReference: booking.reference,
      priority: 'medium',
      channels: ['in_app', 'email'],
    };

    return this.sendNotification(notification);
  }

  async sendBookingReminder(
    booking: Booking,
    daysUntilTravel: number
  ): Promise<Notification> {
    const user = booking.createdByUser || { id: booking.customerInfo.email, name: booking.customerInfo.name };

    const notification: Partial<Notification> = {
      type: 'booking_reminder',
      title: 'Upcoming Travel Reminder',
      message: `Your ${booking.type} booking ${booking.reference} is scheduled for ${booking.timeline.travelDate}. Please ensure all travel documents are ready.`,
      userId: user.id,
      userName: user.name,
      bookingId: booking.id,
      bookingReference: booking.reference,
      priority: daysUntilTravel <= 3 ? 'high' : 'medium',
      channels: ['in_app', 'email'],
    };

    if (daysUntilTravel <= 1) {
      notification.channels!.push('sms');
    }

    return this.sendNotification(notification);
  }

  async sendPaymentReminder(
    booking: Booking,
    daysUntilDue: number
  ): Promise<Notification> {
    const user = booking.createdByUser || { id: booking.customerInfo.email, name: booking.customerInfo.name };

    const notification: Partial<Notification> = {
      type: 'payment_reminder',
      title: 'Payment Due Reminder',
      message: `Payment for booking ${booking.reference} is due in ${daysUntilDue} days. Amount: ${booking.pricing.sellingAmount} ${booking.pricing.currency}.`,
      userId: user.id,
      userName: user.name,
      bookingId: booking.id,
      bookingReference: booking.reference,
      priority: daysUntilDue <= 2 ? 'high' : 'medium',
      channels: ['in_app', 'email', 'sms'],
    };

    return this.sendNotification(notification);
  }

  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const key = `user_notifications:${userId}`;
      const notifications = await this.cache.get(key);
      
      if (!notifications) {
        return [];
      }

        const parsedNotifications = JSON.parse(String(notifications));
      
      // Sort by created date, newest first
      return parsedNotifications
        .sort((a: Notification, b: Notification) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error(`Failed to get notifications for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return [];
    }
  }

  async getUnreadNotificationCount(userId: string): Promise<number> {
    try {
      const notifications = await this.getUserNotifications(userId);
      return notifications.filter(n => n.status === 'pending').length;
    } catch (error) {
      logger.error(`Failed to get unread count for user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return 0;
    }
  }

  async markAsRead(notificationId: string): Promise<boolean> {
    try {
      const notification = await this.getNotification(notificationId);
      if (!notification) {
        return false;
      }

      notification.status = 'delivered';
      notification.deliveredAt = new Date();
      notification.updatedAt = new Date();

      await this.cache.set(`notification:${notificationId}`, JSON.stringify(notification), 604800);
      return true;
    } catch (error) {
      logger.error(`Failed to mark notification ${notificationId} as read`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return false;
    }
  }

  async scheduleNotification(notification: Partial<Notification>, scheduledFor: Date): Promise<string> {
    const fullNotification: Notification = {
      ...notification,
      id: this.generateId(),
      status: 'pending',
      scheduledFor,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as Notification;

    try {
      // Store scheduled notification
      const key = `scheduled_notification:${fullNotification.id}`;
      await this.cache.set(key, JSON.stringify(fullNotification), Math.floor((scheduledFor.getTime() - Date.now()) / 1000));
      
      // Add to scheduled notifications list
      const scheduledListKey = 'scheduled_notifications';
      const scheduledList = await this.cache.get(scheduledListKey) || '[]';
      const list = JSON.parse(String(scheduledList));
      
      list.push({
        id: fullNotification.id,
        scheduledFor: scheduledFor.toISOString(),
        userId: fullNotification.userId,
      });
      
      await this.cache.set(scheduledListKey, JSON.stringify(list), 604800);
      
      logger.info(`Notification ${fullNotification.id} scheduled for ${scheduledFor}`);
      return fullNotification.id;
    } catch (error) {
      logger.error(`Failed to schedule notification`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async processScheduledNotifications(): Promise<void> {
    try {
      const scheduledListKey = 'scheduled_notifications';
      const scheduledList = await this.cache.get(scheduledListKey);
      
      if (!scheduledList) {
        return;
      }

      const list = JSON.parse(String(scheduledList));
      const now = new Date();
      const toProcess: any[] = [];
      const remaining: any[] = [];

      for (const item of list) {
        if (new Date(item.scheduledFor) <= now) {
          toProcess.push(item);
        } else {
          remaining.push(item);
        }
      }

      // Process due notifications
      for (const item of toProcess) {
        try {
          const notificationKey = `scheduled_notification:${item.id}`;
          const notificationData = await this.cache.get(notificationKey);
          
          if (notificationData) {
              const notification = JSON.parse(String(notificationData));
            await this.sendNotification(notification);
            
            // Remove from scheduled storage
            await this.cache.del(notificationKey);
          }
        } catch (error) {
          logger.error(`Failed to process scheduled notification ${item.id}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      // Update remaining scheduled notifications list
      await this.cache.set(scheduledListKey, JSON.stringify(remaining), 604800);
    } catch (error) {
      logger.error(`Failed to process scheduled notifications`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  private async getNotification(notificationId: string): Promise<Notification | null> {
    try {
      const notification = await this.cache.get(`notification:${notificationId}`);
      return notification ? JSON.parse(String(notification)) : null;
    } catch (error) {
      logger.error(`Failed to get notification ${notificationId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  private async getUser(userId: string): Promise<{ id: string; name: string } | null> {
    // Mock user lookup - in production, this would query your user database
    try {
      const user = await this.cache.get(`user:${userId}`);
      return user ? JSON.parse(String(user)) : null;
    } catch (error) {
      logger.error(`Failed to get user ${userId}`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return null;
    }
  }

  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getBookingNotificationTitle(type: string, bookingType: string): string {
    switch (type) {
      case 'created':
        return `${bookingType.toUpperCase()} Booking Created`;
      case 'confirmed':
        return `${bookingType.toUpperCase()} Booking Confirmed`;
      case 'cancelled':
        return `${bookingType.toUpperCase()} Booking Cancelled`;
      case 'updated':
        return `${bookingType.toUpperCase()} Booking Updated`;
      default:
        return 'Booking Notification';
    }
  }

  private getBookingNotificationMessage(type: string, bookingType: string, data: any): string {
    switch (type) {
      case 'created':
        return `New ${bookingType} booking ${data.bookingReference} created for ${data.customerName} on ${data.bookingDate}.`;
      case 'confirmed':
        return `Your ${bookingType} booking ${data.bookingReference} has been confirmed. Travel date: ${data.travelDate}.`;
      case 'cancelled':
        return `Your ${bookingType} booking ${data.bookingReference} has been cancelled.`;
      case 'updated':
        return `Your ${bookingType} booking ${data.bookingReference} has been updated.`;
      default:
        return 'Booking notification received.';
    }
  }

  private getBookingNotificationPriority(type: string): 'low' | 'medium' | 'high' | 'urgent' {
    switch (type) {
      case 'confirmed':
        return 'high';
      case 'cancelled':
        return 'urgent';
      case 'created':
      case 'updated':
        return 'medium';
      default:
        return 'medium';
    }
  }

  private getPaymentNotificationTitle(status: string): string {
    switch (status) {
      case 'received':
        return 'Payment Received';
      case 'failed':
        return 'Payment Failed';
      case 'refunded':
        return 'Payment Refunded';
      default:
        return 'Payment Notification';
    }
  }

  private getPaymentNotificationMessage(status: string, amount: number, currency: string, reference: string): string {
    switch (status) {
      case 'received':
        return `Payment of ${amount} ${currency} received for booking ${reference}.`;
      case 'failed':
        return `Payment of ${amount} ${currency} for booking ${reference} failed. Please try again.`;
      case 'refunded':
        return `Payment of ${amount} ${currency} for booking ${reference} has been refunded.`;
      default:
        return 'Payment notification received.';
    }
  }
}