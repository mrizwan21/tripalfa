/**
 * NotificationService - API Client for Notification Service
 * 
 * ## Migration Guide (Breaking Change in v2.0.0)
 * 
 * This service has been converted from static methods to instance methods.
 * 
 * ### Before (static methods - deprecated):
 * ```typescript
 * await NotificationService.sendNotification(request);
 * await NotificationService.getNotifications(userId);
 * ```
 * 
 * ### After (instance methods):
 * ```typescript
 * // Option 1: Create instance with custom base URL
 * const service = new NotificationService('http://localhost:3004');
 * await service.sendNotification(request);
 * await service.getNotifications(userId);
 * 
 * // Option 2: Use global default base URL
 * setDefaultBaseUrl('http://localhost:3004');
 * const service = new NotificationService();
 * await service.sendNotification(request);
 * ```
 * 
 * ### Environment Variable
 * Defaults to VITE_NOTIFICATION_SERVICE_URL or http://localhost:3004
 */
import axios from "axios";
import { getEnv } from "./env.js";
import { getErrorMessage } from "./utils.js";

// ============================================================================
// DEFAULT BASE URL - Can be overridden via setDefaultBaseUrl()
// ============================================================================

let defaultBaseUrl: string | undefined = undefined;

// Service instance cache for static method backward compatibility
// Prevents creating new instances on every deprecated static method call
const serviceInstanceCache = new Map<string, NotificationService>();
const MAX_CACHE_SIZE = 100; // Prevent unbounded memory growth

/**
 * Normalize URL to prevent cache pollution from variations
 * (e.g., trailing slashes, query params, different protocols, casing)
 *
 * NOTE: This normalization intentionally removes standard ports (80 for HTTP, 443 for HTTPS)
 * but PRESERVES non-standard ports. This means:
 *   - "http://api:80" and "http://api" will share a cache key
 *   - "http://api:3000" and "http://api" will have DIFFERENT cache keys
 *   - "http://api:8080" and "http://api" will have DIFFERENT cache keys
 *
 * If your services use non-standard ports, ensure consistent URL formatting
 * across your codebase to avoid cache misses.
 *
 * @internal
 */
function normalizeBaseUrl(url: string | undefined): string {
  if (!url) return "default";
  
  try {
    // Normalize casing and trim whitespace
    const trimmedUrl = url.trim().toLowerCase();
    const parsed = new URL(trimmedUrl);
    
    // Normalize to just protocol, host, and pathname (no query, hash, trailing slash, or port 80/443)
    let host = parsed.host;
    // Remove default ports for cleaner keys
    if (host.endsWith(':80')) {
      host = host.slice(0, -3);
    } else if (host.endsWith(':443')) {
      host = host.slice(0, -4);
    }
    
    const normalized = `${parsed.protocol}//${host}${parsed.pathname.replace(/\/$/, "")}`;
    return normalized;
  } catch {
    // If URL parsing fails, normalize casing and trim only
    return url.trim().toLowerCase();
  }
}

/**
 * Get or create a cached NotificationService instance for the given baseUrl
 * @internal Used by deprecated static methods for performance
 */
function getCachedService(baseUrl?: string): NotificationService {
  const rawUrl = baseUrl || defaultBaseUrl;
  const key = normalizeBaseUrl(rawUrl);
  
  // Don't cache instances with invalid URLs to prevent cache pollution
  // Invalid URLs return as-is from normalizeBaseUrl (not "default" or normalized)
  const isInvalidUrl = key === rawUrl && rawUrl !== undefined && rawUrl !== "default";
  if (isInvalidUrl) {
    console.warn(`[NotificationService] Creating uncached instance for invalid URL: ${rawUrl}`);
    return new NotificationService(baseUrl);
  }
  
  let instance = serviceInstanceCache.get(key);
  if (!instance) {
    instance = new NotificationService(baseUrl);
    // Prevent unbounded growth by removing oldest entry when at capacity
    if (serviceInstanceCache.size >= MAX_CACHE_SIZE) {
      const firstKey = serviceInstanceCache.keys().next().value;
      serviceInstanceCache.delete(firstKey);
    }
    serviceInstanceCache.set(key, instance);
  }
  return instance;
}

/**
 * Set the default base URL for all NotificationService instances and static methods.
 * This allows configuring a custom service URL before making API calls.
 */
function setDefaultBaseUrl(baseUrl: string): void {
  defaultBaseUrl = baseUrl;
  // Clear cache when default URL changes to ensure new instances use the updated URL
  serviceInstanceCache.clear();
}

/**
 * Get the current default base URL
 */
function getDefaultBaseUrl(): string | undefined {
  return defaultBaseUrl;
}

// ============================================================================
// NOTIFICATION TYPES - Aligned with b2b-admin feature types
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

export interface NotificationRecipient {
  id: string;
  type: "user" | "company" | "email" | "phone" | "webhook";
  value: string;
  preferences?: UserNotificationPreferences;
}

export interface UserNotificationPreferences {
  userId: string;
  emailEnabled: boolean;
  smsEnabled: boolean;
  pushEnabled: boolean;
  inAppEnabled: boolean;
  webhookEnabled: boolean;
  batchDigest: "instant" | "hourly" | "daily" | "weekly" | "never";
  quietHours?: { start: string; end: string };
  typePreferences: Record<NotificationType, boolean>;
  typeChannels: Record<NotificationType, NotificationChannel[]>;
  unsubscribedCategories: string[];
}

export interface FrequencyConfig {
  interval: number;
  unit: "minutes" | "hours" | "days" | "weeks" | "months";
  endDate?: string;
  maxOccurrences?: number;
  dayOfWeek?: number[];
  dayOfMonth?: number;
}

export interface RetryPolicy {
  maxRetries: number;
  backoffMs: number;
  backoffMultiplier: number;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  recipients: NotificationRecipient[];
  variables?: Record<string, string>;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
  status: NotificationStatus;
  createdAt: string;
  sentAt?: string;
}

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
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
  version: number;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;

  // Templates
  templateIds: string[];

  // Recipients
  recipients: NotificationRecipient[];
  totalRecipients?: number;

  // Schedule
  startDate: string;
  endDate?: string;
  sequence?: NotificationSequence[];

  // Status
  status:
    | "draft"
    | "scheduled"
    | "active"
    | "paused"
    | "completed"
    | "cancelled";

  // Metrics
  metrics?: NotificationAnalytics;

  // Metadata
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  tags: string[];
}

export interface NotificationSequence {
  order: number;
  templateId: string;
  delayAfterPrevious?: number;
  conditions?: NotificationCondition[];
}

export interface NotificationAnalytics {
  templateId: string;
  templateName: string;
  totalSent: number;
  totalFailed: number;
  totalBounced: number;
  deliveryRate: number;
  totalOpened: number;
  openRate: number;
  totalClicked: number;
  clickRate: number;
  periodStart: string;
  periodEnd: string;
}

export interface DeliveryStatusResponse {
  notificationId: string;
  status: DeliveryStatus;
  channels: Record<
    string,
    { status: string; deliveredAt?: string; error?: string }
  >;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: NotificationType;
  channels: NotificationChannel[];
  recipients: string[];
  variables?: Record<string, string>;
  priority?: NotificationPriority;
  metadata?: Record<string, any>;
}

export interface SendNotificationResponse {
  notificationId: string;
  deliveryId?: string;
  status: "queued" | "sent" | "failed";
  channels: Record<string, DeliveryStatusResponse>;
  timestamp: string;
  errors?: Array<{ channel: string; error: string }>;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: NotificationType;
  category?: string;
  subject?: string;
  body: string;
  htmlBody?: string;
  variables: TemplateVariable[];
  supportedChannels: NotificationChannel[];
  channelConfigs?: Record<NotificationChannel, ChannelConfig>;
  defaultPriority?: NotificationPriority;
  defaultChannels?: NotificationChannel[];
  tags?: string[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  title: string;
  message: string;
  type: "one_time" | "recurring";
  channels: NotificationChannel[];
  targetSegment?: string;
  schedule?: FrequencyConfig;
  maxRecipients?: number;
  templateIds?: string[];
}

export interface CampaignExecutionResponse {
  campaignId: string;
  executionId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: "running" | "completed" | "failed";
  startedAt: string;
  completedAt?: string;
  errors?: string[];
}

export interface DeliveryAnalytics {
  totalSent: number;
  successCount: number;
  failureCount: number;
  deliveryRate: number;
  openCount?: number;
  clickCount?: number;
  unsubscribeCount?: number;
  bounceCount?: number;
  chartData: Array<{ timestamp: string; count: number }>;
}
// Note: DeliveryStatus is already exported as DeliveryStatusResponse above

class NotificationService {
  private baseUrl: string;

  /**
   * Create a new NotificationService instance
   * @param baseUrl - Optional custom base URL (defaults to VITE_NOTIFICATION_SERVICE_URL env var)
   */
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || defaultBaseUrl || getEnv("VITE_NOTIFICATION_SERVICE_URL", "http://localhost:3004");
  }

  /**
   * Get the base URL used by this instance
   */
  getBaseUrl(): string {
    return this.baseUrl;
  }

  /**
   * Create and send a notification
   */
  async sendNotification(
    request: CreateNotificationRequest,
  ): Promise<SendNotificationResponse> {
    try {
      const response = await axios.post<SendNotificationResponse>(
        `${this.baseUrl}/api/notifications/send`,
        request,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to send notification: ${message}`, { cause: error });
    }
  }

  /**
   * Create a notification template
   */
  async createTemplate(
    request: CreateTemplateRequest,
  ): Promise<NotificationTemplate> {
    try {
      const response = await axios.post<NotificationTemplate>(
        `${this.baseUrl}/api/notifications/templates`,
        request,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to create template: ${message}`, { cause: error });
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    try {
      const response = await axios.get<NotificationTemplate>(
        `${this.baseUrl}/api/notifications/templates/${templateId}`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get template: ${message}`, { cause: error });
    }
  }

  /**
   * List all templates
   */
  async listTemplates(
    limit: number = 50,
    offset: number = 0,
  ): Promise<NotificationTemplate[]> {
    try {
      const response = await axios.get<NotificationTemplate[]>(
        `${this.baseUrl}/api/notifications/templates`,
        { params: { limit, offset } },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to list templates: ${message}`, { cause: error });
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>,
  ): Promise<NotificationTemplate> {
    try {
      const response = await axios.patch<NotificationTemplate>(
        `${this.baseUrl}/api/notifications/templates/${templateId}`,
        updates,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to update template: ${message}`, { cause: error });
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/api/notifications/templates/${templateId}`,
      );
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to delete template: ${message}`, { cause: error });
    }
  }

  /**
   * Create a campaign
   */
  async createCampaign(
    request: CreateCampaignRequest,
  ): Promise<NotificationCampaign> {
    try {
      const response = await axios.post<NotificationCampaign>(
        `${this.baseUrl}/api/notifications/campaigns`,
        request,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to create campaign: ${message}`, { cause: error });
    }
  }

  /**
   * Execute campaign immediately
   */
  async executeCampaign(
    campaignId: string,
  ): Promise<CampaignExecutionResponse> {
    try {
      const response = await axios.post<CampaignExecutionResponse>(
        `${this.baseUrl}/api/notifications/campaigns/${campaignId}/execute`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to execute campaign: ${message}`, { cause: error });
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/notifications/campaigns/${campaignId}/pause`,
      );
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to pause campaign: ${message}`, { cause: error });
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await axios.post(
        `${this.baseUrl}/api/notifications/campaigns/${campaignId}/resume`,
      );
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to resume campaign: ${message}`, { cause: error });
    }
  }

  /**
   * Get delivery analytics
   */
  async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    channel?: string,
  ): Promise<DeliveryAnalytics> {
    try {
      const response = await axios.get<DeliveryAnalytics>(
        `${this.baseUrl}/api/notifications/analytics`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ...(channel && { channel }),
          },
        },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get delivery analytics: ${message}`, { cause: error });
    }
  }

  /**
   * Get delivery status for a notification
   */
  async getDeliveryStatus(
    notificationId: string,
  ): Promise<DeliveryStatus> {
    try {
      const response = await axios.get<DeliveryStatus>(
        `${this.baseUrl}/api/notifications/${notificationId}/status`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to get delivery status: ${message}`, { cause: error });
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(
    notificationId: string,
  ): Promise<SendNotificationResponse> {
    try {
      const response = await axios.post<SendNotificationResponse>(
        `${this.baseUrl}/api/notifications/${notificationId}/retry`,
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to retry deliveries: ${message}`, { cause: error });
    }
  }

  /**
   * List all notifications
   */
  async listNotifications(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    try {
      const response = await axios.get<Notification[]>(
        `${this.baseUrl}/api/notifications`,
        { params: { limit, offset } },
      );

      return response.data;
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to list notifications: ${message}`, { cause: error });
    }
  }

  /**
   * Delete a notification by ID
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      await axios.delete(
        `${this.baseUrl}/api/notifications/${notificationId}`,
      );
    } catch (error) {
      const message = getErrorMessage(error);
      throw new Error(`Failed to delete notification: ${message}`, { cause: error });
    }
  }
}

// ============================================================================
// DEPRECATED: Static method wrappers for backward compatibility
// @deprecated Use instance methods instead: new NotificationService().sendNotification(...)
// ============================================================================

/**
 * Helper to warn about deprecated usage - only logs in development
 * to prevent spamming production logs
 */
function warnDeprecated(methodName: string, alternative: string): void {
  if (typeof process !== "undefined" && process.env.NODE_ENV === "development") {
    console.warn(
      `WARNING: NotificationService.${methodName}() is deprecated. Use '${alternative}' instead.`
    );
  }
}

const NotificationServiceStatic = NotificationService as unknown as {
  sendNotification(request: CreateNotificationRequest, baseUrl?: string): Promise<SendNotificationResponse>;
  createTemplate(request: CreateTemplateRequest, baseUrl?: string): Promise<NotificationTemplate>;
  getTemplate(templateId: string, baseUrl?: string): Promise<NotificationTemplate>;
  listTemplates(limit?: number, offset?: number, baseUrl?: string): Promise<NotificationTemplate[]>;
  updateTemplate(templateId: string, updates: Partial<CreateTemplateRequest>, baseUrl?: string): Promise<NotificationTemplate>;
  deleteTemplate(templateId: string, baseUrl?: string): Promise<void>;
  createCampaign(request: CreateCampaignRequest, baseUrl?: string): Promise<NotificationCampaign>;
  executeCampaign(campaignId: string, baseUrl?: string): Promise<CampaignExecutionResponse>;
  pauseCampaign(campaignId: string, baseUrl?: string): Promise<void>;
  resumeCampaign(campaignId: string, baseUrl?: string): Promise<void>;
  getDeliveryAnalytics(startDate: Date, endDate: Date, channel?: string, baseUrl?: string): Promise<DeliveryAnalytics>;
  getDeliveryStatus(notificationId: string, baseUrl?: string): Promise<DeliveryStatus>;
  retryFailedDeliveries(notificationId: string, baseUrl?: string): Promise<SendNotificationResponse>;
  listNotifications(limit?: number, offset?: number, baseUrl?: string): Promise<Notification[]>;
  deleteNotification(notificationId: string, baseUrl?: string): Promise<void>;
};

/** @deprecated Use instance method instead: new NotificationService().sendNotification(request) */
NotificationServiceStatic.sendNotification = async function (
  request: CreateNotificationRequest,
  baseUrl?: string,
): Promise<SendNotificationResponse> {
  warnDeprecated("sendNotification", "new NotificationService().sendNotification()");
  return getCachedService(baseUrl).sendNotification(request);
};

/** @deprecated Use instance method instead: new NotificationService().createTemplate(request) */
NotificationServiceStatic.createTemplate = async function (
  request: CreateTemplateRequest,
  baseUrl?: string,
): Promise<NotificationTemplate> {
  warnDeprecated("createTemplate", "new NotificationService().createTemplate()");
  return getCachedService(baseUrl).createTemplate(request);
};

/** @deprecated Use instance method instead: new NotificationService().getTemplate(templateId) */
NotificationServiceStatic.getTemplate = async function (
  templateId: string,
  baseUrl?: string,
): Promise<NotificationTemplate> {
  warnDeprecated("getTemplate", "new NotificationService().getTemplate()");
  return getCachedService(baseUrl).getTemplate(templateId);
};

/** @deprecated Use instance method instead: new NotificationService().listTemplates(limit, offset) */
NotificationServiceStatic.listTemplates = async function (
  limit: number = 50,
  offset: number = 0,
  baseUrl?: string,
): Promise<NotificationTemplate[]> {
  warnDeprecated("listTemplates", "new NotificationService().listTemplates()");
  return getCachedService(baseUrl).listTemplates(limit, offset);
};

/** @deprecated Use instance method instead: new NotificationService().updateTemplate(templateId, updates) */
NotificationServiceStatic.updateTemplate = async function (
  templateId: string,
  updates: Partial<CreateTemplateRequest>,
  baseUrl?: string,
): Promise<NotificationTemplate> {
  warnDeprecated("updateTemplate", "new NotificationService().updateTemplate()");
  return getCachedService(baseUrl).updateTemplate(templateId, updates);
};

/** @deprecated Use instance method instead: new NotificationService().deleteTemplate(templateId) */
NotificationServiceStatic.deleteTemplate = async function (
  templateId: string,
  baseUrl?: string
): Promise<void> {
  warnDeprecated("deleteTemplate", "new NotificationService().deleteTemplate()");
  return getCachedService(baseUrl).deleteTemplate(templateId);
};

/** @deprecated Use instance method instead: new NotificationService().createCampaign(request) */
NotificationServiceStatic.createCampaign = async function (
  request: CreateCampaignRequest,
  baseUrl?: string,
): Promise<NotificationCampaign> {
  warnDeprecated("createCampaign", "new NotificationService().createCampaign()");
  return getCachedService(baseUrl).createCampaign(request);
};

/** @deprecated Use instance method instead: new NotificationService().executeCampaign(campaignId) */
NotificationServiceStatic.executeCampaign = async function (
  campaignId: string,
  baseUrl?: string,
): Promise<CampaignExecutionResponse> {
  warnDeprecated("executeCampaign", "new NotificationService().executeCampaign()");
  return getCachedService(baseUrl).executeCampaign(campaignId);
};

/** @deprecated Use instance method instead: new NotificationService().pauseCampaign(campaignId) */
NotificationServiceStatic.pauseCampaign = async function (
  campaignId: string,
  baseUrl?: string
): Promise<void> {
  warnDeprecated("pauseCampaign", "new NotificationService().pauseCampaign()");
  return getCachedService(baseUrl).pauseCampaign(campaignId);
};

/** @deprecated Use instance method instead: new NotificationService().resumeCampaign(campaignId) */
NotificationServiceStatic.resumeCampaign = async function (
  campaignId: string,
  baseUrl?: string
): Promise<void> {
  warnDeprecated("resumeCampaign", "new NotificationService().resumeCampaign()");
  return getCachedService(baseUrl).resumeCampaign(campaignId);
};

/** @deprecated Use instance method instead: new NotificationService().getDeliveryAnalytics(startDate, endDate, channel) */
NotificationServiceStatic.getDeliveryAnalytics = async function (
  startDate: Date,
  endDate: Date,
  channel?: string,
  baseUrl?: string,
): Promise<DeliveryAnalytics> {
  warnDeprecated("getDeliveryAnalytics", "new NotificationService().getDeliveryAnalytics()");
  return getCachedService(baseUrl).getDeliveryAnalytics(startDate, endDate, channel);
};

/** @deprecated Use instance method instead: new NotificationService().getDeliveryStatus(notificationId) */
NotificationServiceStatic.getDeliveryStatus = async function (
  notificationId: string,
  baseUrl?: string,
): Promise<DeliveryStatus> {
  warnDeprecated("getDeliveryStatus", "new NotificationService().getDeliveryStatus()");
  return getCachedService(baseUrl).getDeliveryStatus(notificationId);
};

/** @deprecated Use instance method instead: new NotificationService().retryFailedDeliveries(notificationId) */
NotificationServiceStatic.retryFailedDeliveries = async function (
  notificationId: string,
  baseUrl?: string,
): Promise<SendNotificationResponse> {
  warnDeprecated("retryFailedDeliveries", "new NotificationService().retryFailedDeliveries()");
  return getCachedService(baseUrl).retryFailedDeliveries(notificationId);
};

/** @deprecated Use instance method instead: new NotificationService().listNotifications(limit, offset) */
NotificationServiceStatic.listNotifications = async function (
  limit: number = 50,
  offset: number = 0,
  baseUrl?: string,
): Promise<Notification[]> {
  warnDeprecated("listNotifications", "new NotificationService().listNotifications()");
  return getCachedService(baseUrl).listNotifications(limit, offset);
};

/** @deprecated Use instance method instead: new NotificationService().deleteNotification(notificationId) */
NotificationServiceStatic.deleteNotification = async function (
  notificationId: string,
  baseUrl?: string,
): Promise<void> {
  warnDeprecated("deleteNotification", "new NotificationService().deleteNotification()");
  return getCachedService(baseUrl).deleteNotification(notificationId);
};

export default NotificationService;
