/**
 * @tripalfa/notifications - Type Definitions
 * Centralized type definitions for the notification management system
 */

// Notification Types
export type NotificationType =
  | 'booking_created'
  | 'booking_confirmed'
  | 'booking_cancelled'
  | 'payment_received'
  | 'payment_reminder'
  | 'agent_assigned'
  | 'booking_reminder'
  | 'price_alert'
  | 'itinerary_change'
  | 'amendment'
  | 'ssr_update'
  | 'system';

export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered' | 'read' | 'opened';

export type NotificationChannelType = 'email' | 'sms' | 'push' | 'in_app';

export type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

// Core Notification Interfaces
export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  priority: NotificationPriority;
  channels: NotificationChannelType[];
  status: NotificationStatus;
  actionUrl?: string;
  readAt?: Date;
  sentAt?: Date;
  deliveredAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface NotificationPayload {
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: Record<string, any>;
  channels?: NotificationChannelType[];
  priority?: NotificationPriority;
  actionUrl?: string;
  scheduledFor?: Date;
}

// Channel Configuration
export interface EmailConfig {
  from: string;
  host: string;
  port: number;
  secure: boolean;
  auth: {
    user: string;
    pass: string;
  };
}

export interface SMSConfig {
  accountSid: string;
  authToken: string;
  fromNumber: string;
}

export interface PushConfig {
  fcmServerKey?: string;
  apnsCert?: string;
  apnsKey?: string;
}

export interface ChannelConfig {
  email?: EmailConfig;
  sms?: SMSConfig;
  push?: PushConfig;
}

// Template Interfaces
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

// User Preferences
export interface NotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  offlineRequestUpdates: boolean;
  priceDropAlerts: boolean;
  bookingReminders: boolean;
  promotionalEmails: boolean;
}

// WebSocket Types
export interface NotificationSocketData {
  userId?: string;
  authenticated: boolean;
}

export interface BroadcastOptions {
  userId?: string;
  userIds?: string[];
  channel?: string;
  excludeUser?: string;
}

// API Response Types
export interface NotificationResponse {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  priority: NotificationPriority;
  status: NotificationStatus;
  createdAt: Date;
}

export interface NotificationListResponse {
  data: NotificationResponse[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Channel Interface
export interface NotificationChannel {
  send(notification: Notification): Promise<boolean>;
  validateConfig(): boolean;
  getName(): string;
}

// Service Interface
export interface INotificationService {
  sendNotification(payload: NotificationPayload): Promise<string>;
  getNotifications(userId: string, limit: number, offset: number): Promise<Notification[]>;
  markAsRead(notificationId: string): Promise<void>;
  markAllAsRead(userId: string): Promise<void>;
  deleteNotification(notificationId: string): Promise<void>;
  getUnreadCount(userId: string): Promise<number>;
  getPreferences(userId: string): Promise<NotificationPreferences>;
  updatePreferences(userId: string, preferences: Partial<NotificationPreferences>): Promise<void>;
}

// Logging Interface
export interface NotificationLog {
  id: string;
  notificationId: string;
  channel: NotificationChannelType;
  status: NotificationStatus;
  error?: string;
  sentAt: Date;
  createdAt: Date;
}

// Filter Options
export interface NotificationFilterOptions {
  userId?: string;
  type?: NotificationType;
  status?: NotificationStatus;
  priority?: NotificationPriority;
  startDate?: Date;
  endDate?: Date;
  limit?: number;
  offset?: number;
  sortBy?: keyof Notification;
  order?: 'asc' | 'desc';
}

// Push Subscription
export interface PushSubscription {
  id: string;
  userId: string;
  endpoint: string;
  auth: string;
  p256dh: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Error Types
export class NotificationError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = 'NotificationError';
  }
}

export class ChannelError extends NotificationError {
  constructor(message: string, public channel: NotificationChannelType) {
    super(message, 'CHANNEL_ERROR', 503);
    this.name = 'ChannelError';
  }
}

export class ValidationError extends NotificationError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends NotificationError {
  constructor(message: string) {
    super(message, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class AuthorizationError extends NotificationError {
  constructor(message: string) {
    super(message, 'UNAUTHORIZED', 401);
    this.name = 'AuthorizationError';
  }
}
