/**
 * Notification Management - Complete Type Definitions
 *
 * Includes types for:
 * - Notification templates
 * - Scheduled notifications
 * - Delivery channels (email, SMS, push, webhook)
 * - Notification history & analytics
 * - Template variables and conditions
 */

// ============================================================================
// CORE NOTIFICATION TYPES
// ============================================================================

export type NotificationChannel =
  | "email"
  | "sms"
  | "push"
  | "in_app"
  | "webhook";
export type NotificationPriority = "low" | "medium" | "high" | "critical";
export type NotificationStatus =
  | "draft"
  | "scheduled"
  | "sent"
  | "failed"
  | "cancelled";
export type NotificationType =
  | "booking"
  | "payment"
  | "finance"
  | "system"
  | "user"
  | "alert"
  | "promotion"
  | "compliance"
  | "custom";

export type DeliveryStatus =
  | "pending"
  | "sent"
  | "failed"
  | "bounced"
  | "opened"
  | "clicked";
export type ScheduleFrequency =
  | "once"
  | "daily"
  | "weekly"
  | "monthly"
  | "custom";

// ============================================================================
// NOTIFICATION TEMPLATE
// ============================================================================

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: NotificationType;
  category: string;

  // Content
  subject: string;
  body: string;
  htmlBody?: string;

  // Variables
  variables: TemplateVariable[];

  // Channels
  supportedChannels: NotificationChannel[];
  channelConfigs: Record<NotificationChannel, ChannelConfig>;

  // Priority & rules
  defaultPriority: NotificationPriority;
  defaultChannels: NotificationChannel[];

  // Conditions (if/then rules)
  conditions?: NotificationCondition[];

  // Status
  enabled: boolean;
  archived: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
  version: number;
}

export interface TemplateVariable {
  name: string;
  description: string;
  type: "string" | "number" | "date" | "boolean" | "json";
  required: boolean;
  defaultValue?: any;
  example?: string;
}

export interface ChannelConfig {
  enabled: boolean;
  fromAddress?: string;
  fromName?: string;
  replyTo?: string;
  headers?: Record<string, string>;
  signature?: string;
  template?: string;
}

export interface NotificationCondition {
  id: string;
  variable: string;
  operator: "equals" | "not_equals" | "contains" | "greater_than" | "less_than";
  value: any;
  action: "send" | "skip";
}

// ============================================================================
// SCHEDULED NOTIFICATION
// ============================================================================

export interface ScheduledNotification {
  id: string;
  templateId: string;
  templateName?: string;

  // Recipients
  recipients: NotificationRecipient[] | RecipientGroup;

  // Variables
  variables: Record<string, any>;

  // Scheduling
  scheduledFor: Date;
  frequency: ScheduleFrequency;
  frequencyConfig?: FrequencyConfig;

  // Override defaults
  priority?: NotificationPriority;
  channels?: NotificationChannel[];

  // Status & tracking
  status: NotificationStatus;
  sentCount?: number;
  failureCount?: number;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  campaignId?: string;

  // Execution
  lastExecutedAt?: Date;
  nextExecutionAt?: Date;
  retryPolicy?: RetryPolicy;
}

export interface NotificationRecipient {
  id: string;
  type: "user" | "company" | "email" | "phone" | "webhook";
  value: string;
  preferences?: UserNotificationPreferences;
}

export type RecipientGroup = {
  type: "segment" | "filter";
  segmentId?: string;
  filter?: RecipientFilter;
};

export interface RecipientFilter {
  field: string;
  operator: "equals" | "contains" | "in" | "greater_than" | "less_than";
  value: any;
}

export interface FrequencyConfig {
  interval: number;
  unit: "minutes" | "hours" | "days" | "weeks" | "months";
  endDate?: Date;
  maxOccurrences?: number;
  dayOfWeek?: number[]; // 0-6 for weekly
  dayOfMonth?: number; // 1-31 for monthly
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

// ============================================================================
// NOTIFICATION DELIVERY
// ============================================================================

export interface NotificationDelivery {
  id: string;
  notificationId: string;
  templateId: string;
  recipient: string;
  channel: NotificationChannel;

  // Content
  subject?: string;
  body: string;

  // Status
  status: DeliveryStatus;
  errorMessage?: string;
  errorCode?: string;

  // Tracking
  sentAt?: Date;
  openedAt?: Date;
  clickedAt?: Date;
  clickedLink?: string;

  // Metadata
  externalId?: string;
  provider?: string;
  metadata?: Record<string, any>;
}

// ============================================================================
// USER NOTIFICATION PREFERENCES
// ============================================================================

export interface UserNotificationPreferences {
  userId: string;

  // Channel preferences
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  webhookEnabled: boolean;

  // Frequency preferences
  batchDigest: "instant" | "hourly" | "daily" | "weekly" | "never";
  quietHours?: { start: string; end: string }; // "HH:MM" format

  // Notification type preferences
  typePreferences: Record<NotificationType, boolean>;

  // Channels per type
  typeChannels: Record<NotificationType, NotificationChannel[]>;

  // Unsubscribe lists
  unsubscribedCategories: string[];
}

// ============================================================================
// NOTIFICATION ANALYTICS
// ============================================================================

export interface NotificationAnalytics {
  templateId: string;
  templateName: string;

  // Delivery metrics
  totalSent: number;
  totalFailed: number;
  totalBounced: number;
  deliveryRate: number; // percentage

  // Engagement metrics
  totalOpened: number;
  openRate: number;
  uniqueOpens: number;
  uniqueOpenRate: number;

  totalClicked: number;
  clickRate: number;
  uniqueClicks: number;
  uniqueClickRate: number;

  // Channel breakdown
  channelMetrics: Record<NotificationChannel, ChannelMetrics>;

  // Time metrics
  averageDeliveryTime: number; // in seconds
  averageTimeToOpen: number; // in seconds

  // Period
  periodStart: Date;
  periodEnd: Date;

  // Trending
  trend: "up" | "down" | "stable";
  trendPercentage: number;
}

export interface ChannelMetrics {
  sent: number;
  failed: number;
  bounced: number;
  opened: number;
  clicked: number;
  openRate: number;
  clickRate: number;
}

// ============================================================================
// NOTIFICATION HISTORY
// ============================================================================

export interface NotificationHistory {
  id: string;
  templateId: string;
  templateName?: string;

  // Delivery info
  recipients: string[]; // email/phone/user IDs
  channels: NotificationChannel[];

  // Timeline
  scheduledForDate: Date;
  sentAt: Date;

  // Results
  successCount: number;
  failureCount: number;
  status: NotificationStatus;

  // Details
  summary: string;
  details: NotificationHistoryDetail[];

  // Context
  campaignId?: string;
  source: "manual" | "automated" | "api";
}

export interface NotificationHistoryDetail {
  recipient: string;
  channel: NotificationChannel;
  status: DeliveryStatus;
  sentAt: Date;
  error?: string;
}

// ============================================================================
// NOTIFICATION CHANNEL CONFIGURATION (Settings)
// ============================================================================

export interface EmailChannelSettings {
  enabled: boolean;
  provider: "smtp" | "sendgrid" | "mailgun" | "aws_ses";
  senderEmail: string;
  senderName: string;
  replyTo?: string;

  // SMTP config (if provider is smtp)
  smtpHost?: string;
  smtpPort?: number;
  smtpUser?: string;
  smtpPassword?: string;
  smtpUseSSL?: boolean;

  // API keys (if using third-party)
  apiKey?: string;
  apiSecret?: string;

  // Templates
  defaultTemplate?: string;
  customTemplates?: Record<string, string>;

  // DKIM/SPF
  dkimEnabled?: boolean;
  spfEnabled?: boolean;

  // Rate limiting
  rateLimit?: number; // emails per minute
}

export interface SMSChannelSettings {
  enabled: boolean;
  provider: "twilio" | "sns" | "vonage";
  accountId: string;
  authKey: string;
  fromNumber?: string;

  // Template
  messageTemplate?: string;

  // Rate limiting
  rateLimit?: number; // messages per minute
}

export interface PushChannelSettings {
  enabled: boolean;
  provider: "firebase" | "apns" | "fcm";
  apiKey: string;

  // Firebase config
  projectId?: string;
  serviceAccountKey?: Record<string, any>;

  // Template
  titleTemplate?: string;
  bodyTemplate?: string;
  iconUrl?: string;

  // Deep linking
  deepLinkBase?: string;
}

export interface WebhookChannelSettings {
  enabled: boolean;

  // Webhooks
  webhooks: WebhookConfig[];

  // Headers
  defaultHeaders?: Record<string, string>;

  // Auth
  authType?: "none" | "basic" | "bearer" | "api_key";
  authValue?: string;

  // Retry
  retryPolicy?: RetryPolicy;

  // Signature
  includeSignature?: boolean;
  signatureAlgorithm?: "sha256" | "sha512";
}

export interface WebhookConfig {
  id: string;
  url: string;
  method: "POST" | "PUT" | "PATCH";
  headers?: Record<string, string>;
  active: boolean;
  description?: string;
}

// ============================================================================
// NOTIFICATION CAMPAIGN
// ============================================================================

export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;

  // Templates
  templateIds: string[];

  // Recipients
  recipients: NotificationRecipient[] | RecipientGroup;
  totalRecipients?: number;

  // Schedule
  startDate: Date;
  endDate?: Date;
  sequence?: NotificationSequence[];

  // Status
  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "completed"
    | "cancelled";

  // Analytics
  metrics?: NotificationAnalytics;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  tags: string[];
}

export interface NotificationSequence {
  order: number;
  templateId: string;
  delayAfterPrevious?: number; // minutes
  conditions?: NotificationCondition[];
}

// ============================================================================
// NOTIFICATION REQUEST (API)
// ============================================================================

export interface SendNotificationRequest {
  templateId: string;
  recipients: string[]; // emails/phone numbers
  variables?: Record<string, any>;
  channels?: NotificationChannel[];
  priority?: NotificationPriority;
  scheduledFor?: Date;
  campaignId?: string;
  metadata?: Record<string, any>;
}

export interface SendNotificationResponse {
  success: boolean;
  notificationId: string;
  recipientsQueued: number;
  failedRecipients?: string[];
}
