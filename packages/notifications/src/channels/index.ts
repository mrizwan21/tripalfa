/**
 * @tripalfa/notifications - Notification Channels
 * Base and concrete implementations for notification delivery channels
 */

import { createLogger, Logger } from "@tripalfa/shared-utils/logger";
import {
  Notification,
  NotificationChannel,
  ChannelError,
  EmailConfig,
  SMSConfig,
  PushConfig,
  BrevoEmailConfig,
  isBrevoConfig,
} from "../types";
import { Resend } from "resend";

/**
 * Abstract base class for notification channels
 */
export abstract class BaseChannel implements NotificationChannel {
  protected logger: Logger;
  protected name: string = "BaseChannel";

  constructor(logger?: Logger) {
    this.logger = logger || createLogger({ serviceName: "notifications" });
  }

  abstract send(notification: Notification): Promise<boolean>;
  abstract validateConfig(): boolean;

  getName(): string {
    return this.name;
  }

  protected logSend(
    notification: Notification,
    success: boolean,
    error?: Error,
  ): void {
    if (success) {
      this.logger.info(
        {
          notificationId: notification.id,
          channel: this.name,
          userId: notification.userId,
        },
        `Notification sent via ${this.name}`,
      );
    } else {
      this.logger.warn(
        {
          notificationId: notification.id,
          channel: this.name,
          userId: notification.userId,
          error: error?.message,
        },
        `Failed to send notification via ${this.name}`,
      );
    }
  }
}

/**
 * Email Channel Implementation with Brevo Integration
 * Supports both Brevo API and legacy SMTP configurations
 */
export class EmailChannel extends BaseChannel {
  protected name = "email";
  private config: EmailConfig;
  private setupSuccess = false;
  private resendApi: Resend | null = null;

  constructor(config: EmailConfig, logger?: Logger) {
    super(logger);
    this.config = config;
    this.setupSuccess = this.validateConfig();

    // Initialize Resend API if using Brevo config
    if (isBrevoConfig(config)) {
      this.resendApi = new Resend(config.apiKey);
    }
  }

  validateConfig(): boolean {
    // Validate Brevo config
    if (isBrevoConfig(this.config)) {
      return !!(this.config.apiKey && this.config.from);
    }

    // Validate SMTP config
    return !!(
      this.config.from &&
      this.config.host &&
      this.config.port &&
      this.config.auth.user &&
      this.config.auth.pass
    );
  }

  /**
   * Send email using Resend API
   */
  private async sendViaBrevo(
    notification: Notification,
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.resendApi) {
      throw new ChannelError("Resend API not initialized", "email");
    }

    const brevoConfig = this.config as BrevoEmailConfig;

    try {
      const response = await this.resendApi.emails.send({
        from: `${brevoConfig.fromName || "TripAlfa"} <${brevoConfig.from}>`,
        to: notification.userId,
        subject: notification.title,
        html: notification.message,
        text: notification.data?.textContent || this.stripHtml(notification.message),
        reply_to: brevoConfig.replyTo || undefined,
        headers: {
          'X-Notification-Id': notification.id,
          'X-Tags': [notification.type, `priority-${notification.priority}`].join(','),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      this.logger.error(
        { error: error.message, notificationId: notification.id },
        "Resend API error",
      );
      throw error;
    }
  }

  /**
   * Send email using SMTP (fallback/legacy)
   */
  private async sendViaSMTP(
    notification: Notification,
  ): Promise<{ success: boolean; messageId?: string }> {
    // SMTP implementation would go here
    // For now, we log and simulate
    this.logger.warn(
      { notificationId: notification.id },
      "SMTP email sending not fully implemented. Consider migrating to Brevo.",
    );

    await new Promise((resolve) => setTimeout(resolve, 100));

    return {
      success: true,
      messageId: `smtp-${Date.now()}`,
    };
  }

  /**
   * Strip HTML tags from content for plain text version
   */
  private stripHtml(html: string): string {
    return html
      .replace(/<[^>]*>/g, "")
      .replace(/\s+/g, " ")
      .trim();
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      if (!this.setupSuccess) {
        throw new ChannelError(
          "Email channel not properly configured",
          "email",
        );
      }

      this.logger.debug(
        {
          notificationId: notification.id,
          recipient: notification.userId,
          subject: notification.title,
          provider: isBrevoConfig(this.config) ? "brevo" : "smtp",
        },
        "Sending email notification",
      );

      let result: { success: boolean; messageId?: string };

      if (isBrevoConfig(this.config)) {
        result = await this.sendViaBrevo(notification);
      } else {
        result = await this.sendViaSMTP(notification);
      }

      if (result.success) {
        this.logSend(notification, true);
        this.logger.info(
          { notificationId: notification.id, messageId: result.messageId },
          "Email sent successfully",
        );
      }

      return result.success;
    } catch (error) {
      this.logSend(notification, false, error as Error);
      return false;
    }
  }

  /**
   * Send a templated email using Resend
   */
  async sendTemplatedEmail(
    to: string,
    templateId: number,
    params: Record<string, any>,
  ): Promise<{ success: boolean; messageId?: string }> {
    if (!this.resendApi) {
      throw new ChannelError(
        "Templated emails require Resend configuration",
        "email",
      );
    }

    const brevoConfig = this.config as BrevoEmailConfig;

    try {
      // Resend doesn't support template IDs directly, so we'll send as HTML
      // Templates should be rendered before calling this method
      const htmlContent = params.htmlContent || "<p>Email content not provided</p>";
      
      const response = await this.resendApi.emails.send({
        from: `${brevoConfig.fromName || "TripAlfa"} <${brevoConfig.from}>`,
        to,
        subject: params.subject || "TripAlfa Notification",
        html: htmlContent,
        headers: {
          'X-Template-Id': templateId.toString(),
        },
      });

      if (response.error) {
        throw new Error(response.error.message);
      }

      return {
        success: true,
        messageId: response.data?.id,
      };
    } catch (error: any) {
      this.logger.error(
        { error: error.message, templateId },
        "Resend template email error",
      );
      return { success: false };
    }
  }
}

/**
 * SMS Channel Implementation
 */
export class SMSChannel extends BaseChannel {
  protected name = "sms";
  private config: SMSConfig;
  private setupSuccess = false;

  constructor(config: SMSConfig, logger?: Logger) {
    super(logger);
    this.config = config;
    this.setupSuccess = this.validateConfig();
  }

  validateConfig(): boolean {
    return !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.fromNumber
    );
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      if (!this.setupSuccess) {
        throw new ChannelError("SMS channel not properly configured", "sms");
      }

      // Mock SMS sending - replace with actual Twilio implementation
      this.logger.debug(
        {
          notificationId: notification.id,
          recipient: notification.userId,
          message: notification.title,
        },
        "Sending SMS notification",
      );

      // Simulate SMS sending
      await new Promise((resolve) => setTimeout(resolve, 150));

      this.logSend(notification, true);
      return true;
    } catch (error) {
      this.logSend(notification, false, error as Error);
      return false;
    }
  }
}

/**
 * Push Notification Channel Implementation
 */
export class PushNotificationChannel extends BaseChannel {
  protected name = "push";
  private config: PushConfig;
  private setupSuccess = false;

  constructor(config: PushConfig, logger?: Logger) {
    super(logger);
    this.config = config;
    this.setupSuccess = this.validateConfig();
  }

  validateConfig(): boolean {
    return !!(
      this.config.fcmServerKey ||
      (this.config.apnsCert && this.config.apnsKey)
    );
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      if (!this.setupSuccess) {
        throw new ChannelError("Push channel not properly configured", "push");
      }

      // Mock push notification sending
      this.logger.debug(
        {
          notificationId: notification.id,
          recipient: notification.userId,
          title: notification.title,
        },
        "Sending push notification",
      );

      // Simulate push notification
      await new Promise((resolve) => setTimeout(resolve, 200));

      this.logSend(notification, true);
      return true;
    } catch (error) {
      this.logSend(notification, false, error as Error);
      return false;
    }
  }
}

/**
 * In-App Notification Channel Implementation
 */
export class InAppNotificationChannel extends BaseChannel {
  protected name = "in_app";
  private notifications: Map<string, Notification[]> = new Map();

  validateConfig(): boolean {
    return true; // No external config needed
  }

  async send(notification: Notification): Promise<boolean> {
    try {
      const key = `user:${notification.userId}`;

      if (!this.notifications.has(key)) {
        this.notifications.set(key, []);
      }

      this.notifications.get(key)!.push(notification);

      // Keep only last 100 notifications per user
      const userNotifications = this.notifications.get(key)!;
      if (userNotifications.length > 100) {
        userNotifications.splice(0, userNotifications.length - 100);
      }

      this.logSend(notification, true);
      return true;
    } catch (error) {
      this.logSend(notification, false, error as Error);
      return false;
    }
  }

  /**
   * Get in-app notifications for a user
   */
  getUserNotifications(userId: string): Notification[] {
    return this.notifications.get(`user:${userId}`) || [];
  }

  /**
   * Clear in-app notifications for a user
   */
  clearUserNotifications(userId: string): void {
    this.notifications.delete(`user:${userId}`);
  }
}

/**
 * Null Channel (no-op implementation for testing)
 */
export class NullChannel extends BaseChannel {
  protected name = "null";

  validateConfig(): boolean {
    return true;
  }

  async send(_notification: Notification): Promise<boolean> {
    return true; // Always succeeds silently
  }
}
