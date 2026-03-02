/**
 * @tripalfa/notifications
 * Centralized notification management module for TripAlfa
 *
 * Usage:
 * import { NotificationManager, EmailChannel, SMSChannel, InAppNotificationChannel } from '@tripalfa/notifications';
 *
 * const notificationManager = new NotificationManager();
 *
 * notificationManager.registerChannel(new EmailChannel(emailConfig));
 * notificationManager.registerChannel(new SMSChannel(smsConfig));
 * notificationManager.registerChannel(new InAppNotificationChannel());
 *
 * await notificationManager.sendNotification({
 *   userId: 'user-123',
 *   type: 'booking_confirmed',
 *   title: 'Booking Confirmed',
 *   message: 'Your booking has been confirmed',
 *   channels: ['email', 'push', 'in_app'],
 * });
 */

// Export types
export * from "./types";
export {
  BrevoEmailConfig,
  SMTPEmailConfig,
  isBrevoConfig,
  isSMTPConfig,
} from "./types";

// Export services
export { NotificationManager, BaseNotificationService } from "./services";

// Export channels
export {
  BaseChannel,
  EmailChannel,
  SMSChannel,
  PushNotificationChannel,
  InAppNotificationChannel,
  NullChannel,
} from "./channels/index";

// Export middleware
export {
  createAuthMiddleware,
  createAuthorizationMiddleware,
  createErrorHandler,
  createRequestLogger,
  validateNotificationPayload,
  createRateLimitMiddleware,
  corsConfig,
} from "./middleware";

// Export logging utilities
export { createLogger, LoggerConfig } from "@tripalfa/shared-utils/logger";

// Export version
export const VERSION = "1.0.0";

import { createLogger, Logger } from "@tripalfa/shared-utils/logger";
import { NotificationManager } from "./services";
import {
  EmailChannel,
  SMSChannel,
  PushNotificationChannel,
  InAppNotificationChannel,
} from "./channels/index";
import { EmailConfig, SMSConfig, PushConfig } from "./types";

/**
 * Helper function to create a fully configured notification manager
 */
export interface NotificationManagerConfig {
  logger?: Logger;
  email?: EmailConfig;
  sms?: SMSConfig;
  push?: PushConfig;
}

export function initializeNotificationManager(
  config: NotificationManagerConfig,
): NotificationManager {
  const logger =
    config.logger || createLogger({ serviceName: "notifications" });
  const manager = new NotificationManager(logger);

  // Register channels if configured
  if (config.email) {
    manager.registerChannel(new EmailChannel(config.email));
  }

  if (config.sms) {
    manager.registerChannel(new SMSChannel(config.sms));
  }

  if (config.push) {
    manager.registerChannel(new PushNotificationChannel(config.push));
  }

  // Always register in-app channel
  manager.registerChannel(new InAppNotificationChannel());

  return manager;
}
