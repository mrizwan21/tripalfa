import { PrismaClient, NotificationType, NotificationChannelType, NotificationStatus } from '@prisma/client';
import nodemailer from 'nodemailer';
import twilio from 'twilio';

interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannelType[];
  priority?: 'low' | 'medium' | 'high';
  actionUrl?: string;
}

interface EmailConfig {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export class NotificationService {
  private prisma: PrismaClient;
  private emailTransporter: nodemailer.Transporter | null = null;
  private twilioClient: twilio.Twilio | null = null;
  private emailConfig: EmailConfig | null = null;
  private smsConfig: SMSConfig | null = null;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.initializeProviders();
  }

  private initializeProviders() {
    // Email configuration
    if (
      process.env.EMAIL_HOST &&
      process.env.EMAIL_PORT &&
      process.env.EMAIL_USER &&
      process.env.EMAIL_PASS
    ) {
      this.emailConfig = {
        from: process.env.EMAIL_FROM || 'noreply@tripalfa.com',
        host: process.env.EMAIL_HOST,
        port: parseInt(process.env.EMAIL_PORT),
        secure: process.env.EMAIL_SECURE === 'true',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      };

      this.emailTransporter = nodemailer.createTransport(this.emailConfig);
    }

    // SMS configuration (Twilio)
    if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
      this.smsConfig = {
        accountSid: process.env.TWILIO_ACCOUNT_SID,
        authToken: process.env.TWILIO_AUTH_TOKEN,
        fromNumber: process.env.TWILIO_FROM_NUMBER || '+1234567890',
      };

      this.twilioClient = twilio(this.smsConfig.accountSid, this.smsConfig.authToken);
    }
  }

  /**
   * Send notification through multiple channels
   */
  async sendNotification(payload: NotificationPayload): Promise<string> {
    const { userId, type, title, message, data, channels, priority = 'medium', actionUrl } = payload;

    // Get user preferences
    const preferences = await this.getUserPreferences(userId);

    // Determine channels to use
    const activeChannels = this.determineChannels(channels, preferences);

    // Create notification record in database
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        data: data || {},
        priority,
        actionUrl,
        status: 'sent',
        readAt: null,
        channels: activeChannels,
      },
    });

    // Send through each channel
    const sendPromises = activeChannels.map((channel) => this.sendViaChannel(notification.id, channel, payload, preferences));

    await Promise.allSettled(sendPromises);

    return notification.id;
  }

  /**
   * Send via specific channel
   */
  private async sendViaChannel(
    notificationId: string,
    channel: NotificationChannelType,
    payload: NotificationPayload,
    preferences: any
  ): Promise<void> {
    try {
      switch (channel) {
        case 'email':
          await this.sendEmail(payload, preferences);
          break;
        case 'sms':
          await this.sendSMS(payload, preferences);
          break;
        case 'push':
          await this.sendPushNotification(payload);
          break;
        case 'in_app':
          // In-app notifications are already persisted, no additional action needed
          break;
      }

      // Log successful send
      await this.prisma.notificationLog.create({
        data: {
          notificationId,
          channel,
          status: 'delivered',
          sentAt: new Date(),
        },
      });
    } catch (error) {
      // Log failed send
      await this.prisma.notificationLog.create({
        data: {
          notificationId,
          channel,
          status: 'failed',
          error: error instanceof Error ? error.message : 'Unknown error',
          sentAt: new Date(),
        },
      });
    }
  }

  /**
   * Send email notification
   */
  private async sendEmail(payload: NotificationPayload, preferences: any): Promise<void> {
    if (!this.emailTransporter || !this.emailConfig) {
      throw new Error('Email service not configured');
    }

    // Get user email
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { email: true },
    });

    if (!user?.email) {
      throw new Error('User email not found');
    }

    // Generate email HTML
    const htmlContent = this.generateEmailHTML(payload);

    // Send email
    await this.emailTransporter.sendMail({
      from: this.emailConfig.from,
      to: user.email,
      subject: payload.title,
      html: htmlContent,
      text: payload.message,
    });
  }

  /**
   * Send SMS notification
   */
  private async sendSMS(payload: NotificationPayload, preferences: any): Promise<void> {
    if (!this.twilioClient || !this.smsConfig) {
      throw new Error('SMS service not configured');
    }

    // Get user phone number
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: { phoneNumber: true },
    });

    if (!user?.phoneNumber) {
      throw new Error('User phone number not found');
    }

    // Send SMS
    await this.twilioClient.messages.create({
      body: `${payload.title}: ${payload.message}`,
      from: this.smsConfig.fromNumber,
      to: user.phoneNumber,
    });
  }

  /**
   * Send push notification
   */
  private async sendPushNotification(payload: NotificationPayload): Promise<void> {
    // Get user's push subscription
    const subscription = await this.prisma.pushSubscription.findFirst({
      where: { userId: payload.userId, isActive: true },
    });

    if (!subscription) {
      return; // Push notifications not subscribed
    }

    // Send push notification via Web Push API
    // This would typically use the 'web-push' npm package
    // For now, we'll just log as pushed
    console.log(`Push notification sent to ${payload.userId}:`, payload.title);
  }

  /**
   * Get user notification preferences
   */
  private async getUserPreferences(userId: string) {
    return await this.prisma.notificationPreference.findUnique({
      where: { userId },
    });
  }

  /**
   * Determine which channels to use based on preferences and fallbacks
   */
  private determineChannels(requestedChannels: NotificationChannelType[] | undefined, preferences: any): NotificationChannelType[] {
    if (!preferences) {
      // Default channels if no preferences set
      return ['in_app', 'email'];
    }

    const channels: NotificationChannelType[] = [];

    if (requestedChannels) {
      // Use requested channels, filtered by preferences
      for (const channel of requestedChannels) {
        if (this.isChannelEnabled(channel, preferences)) {
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
   * Check if a channel is enabled in preferences
   */
  private isChannelEnabled(channel: NotificationChannelType, preferences: any): boolean {
    switch (channel) {
      case 'email':
        return preferences?.emailEnabled !== false;
      case 'sms':
        return preferences?.smsEnabled !== false;
      case 'push':
        return preferences?.pushEnabled !== false;
      case 'in_app':
        return true; // Always enabled
      default:
        return false;
    }
  }

  /**
   * Generate HTML email template
   */
  private generateEmailHTML(payload: NotificationPayload): string {
    const { title, message, actionUrl, data } = payload;

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #007bff; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; background-color: #f9f9f9; }
            .footer { text-align: center; padding: 10px; font-size: 12px; color: #666; }
            .button { display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h2>${title}</h2>
            </div>
            <div class="content">
              <p>${message}</p>
              ${actionUrl ? `<p><a href="${actionUrl}" class="button">View Details</a></p>` : ''}
              ${data?.bookingId ? `<p><strong>Booking ID:</strong> ${data.bookingId}</p>` : ''}
              ${data?.requestId ? `<p><strong>Request ID:</strong> ${data.requestId}</p>` : ''}
            </div>
            <div class="footer">
              <p>© ${new Date().getFullYear()} TripAlfa. All rights reserved.</p>
              <p>You're receiving this because of your notification preferences.</p>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Mark notification as read
   */
  async markAsRead(notificationId: string): Promise<void> {
    await this.prisma.notification.update({
      where: { id: notificationId },
      data: { readAt: new Date(), status: 'read' },
    });
  }

  /**
   * Get user's notifications
   */
  async getUserNotifications(userId: string, limit = 50, offset = 0) {
    return await this.prisma.notification.findMany({
      where: { userId },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
      include: {
        logs: true,
      },
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: string): Promise<number> {
    return await this.prisma.notification.count({
      where: {
        userId,
        status: 'sent',
        readAt: null,
      },
    });
  }

  /**
   * Update notification preferences
   */
  async updatePreferences(userId: string, preferences: Partial<any>): Promise<void> {
    await this.prisma.notificationPreference.upsert({
      where: { userId },
      create: {
        userId,
        ...preferences,
      },
      update: preferences,
    });
  }

  /**
   * Delete notification
   */
  async deleteNotification(notificationId: string): Promise<void> {
    await this.prisma.notification.delete({
      where: { id: notificationId },
    });
  }

  /**
   * Bulk delete notifications
   */
  async deleteOldNotifications(daysOld = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.prisma.notification.deleteMany({
      where: {
        createdAt: {
          lt: cutoffDate,
        },
        status: 'read',
      },
    });

    return result.count;
  }
}
