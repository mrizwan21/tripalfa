import axios from 'axios';

// ============================================================================
// NOTIFICATION TYPES - Aligned with b2b-admin feature types
// ============================================================================

export type NotificationChannel = 'email' | 'sms' | 'push' | 'in_app' | 'webhook';
export type NotificationPriority = 'low' | 'medium' | 'high' | 'critical';
export type NotificationStatus = 'draft' | 'scheduled' | 'sent' | 'failed' | 'cancelled';
export type NotificationType =
  | 'booking'
  | 'payment'
  | 'finance'
  | 'system'
  | 'user'
  | 'alert'
  | 'promotion'
  | 'compliance'
  | 'custom';

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'bounced' | 'opened' | 'clicked';
export type ScheduleFrequency = 'once' | 'daily' | 'weekly' | 'monthly' | 'custom';

export interface TemplateVariable {
  name: string;
  description: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'json';
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
  operator: 'equals' | 'not_equals' | 'contains' | 'greater_than' | 'less_than';
  value: any;
  action: 'send' | 'skip';
}

export interface NotificationRecipient {
  id: string;
  type: 'user' | 'company' | 'email' | 'phone' | 'webhook';
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
  batchDigest: 'instant' | 'hourly' | 'daily' | 'weekly' | 'never';
  quietHours?: { start: string; end: string };
  typePreferences: Record<NotificationType, boolean>;
  typeChannels: Record<NotificationType, NotificationChannel[]>;
  unsubscribedCategories: string[];
}

export interface FrequencyConfig {
  interval: number;
  unit: 'minutes' | 'hours' | 'days' | 'weeks' | 'months';
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
  status: 'draft' | 'scheduled' | 'active' | 'paused' | 'completed' | 'cancelled';
  
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
  channels: Record<string, { status: string; deliveredAt?: string; error?: string }>;
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
  status: 'queued' | 'sent' | 'failed';
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
  type: 'one_time' | 'recurring';
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
  status: 'running' | 'completed' | 'failed';
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

export class NotificationService {
  private static baseURL = process.env.VITE_NOTIFICATION_SERVICE_URL || 'http://localhost:3004';

  /**
   * Create and send a notification
   */
  static async sendNotification(request: CreateNotificationRequest): Promise<SendNotificationResponse> {
    try {
      const response = await axios.post<SendNotificationResponse>(
        `${this.baseURL}/api/notifications/send`,
        request
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to send notification: ${error}`);
    }
  }

  /**
   * Create a notification template
   */
  static async createTemplate(request: CreateTemplateRequest): Promise<NotificationTemplate> {
    try {
      const response = await axios.post<NotificationTemplate>(
        `${this.baseURL}/api/notifications/templates`,
        request
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create template: ${error}`);
    }
  }

  /**
   * Get template by ID
   */
  static async getTemplate(templateId: string): Promise<NotificationTemplate> {
    try {
      const response = await axios.get<NotificationTemplate>(
        `${this.baseURL}/api/notifications/templates/${templateId}`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get template: ${error}`);
    }
  }

  /**
   * List all templates
   */
  static async listTemplates(limit: number = 50, offset: number = 0): Promise<NotificationTemplate[]> {
    try {
      const response = await axios.get<NotificationTemplate[]>(
        `${this.baseURL}/api/notifications/templates`,
        { params: { limit, offset } }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to list templates: ${error}`);
    }
  }

  /**
   * Update template
   */
  static async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>
  ): Promise<NotificationTemplate> {
    try {
      const response = await axios.patch<NotificationTemplate>(
        `${this.baseURL}/api/notifications/templates/${templateId}`,
        updates
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to update template: ${error}`);
    }
  }

  /**
   * Delete template
   */
  static async deleteTemplate(templateId: string): Promise<void> {
    try {
      await axios.delete(`${this.baseURL}/api/notifications/templates/${templateId}`);
    } catch (error) {
      throw new Error(`Failed to delete template: ${error}`);
    }
  }

  /**
   * Create a campaign
   */
  static async createCampaign(request: CreateCampaignRequest): Promise<NotificationCampaign> {
    try {
      const response = await axios.post<NotificationCampaign>(
        `${this.baseURL}/api/notifications/campaigns`,
        request
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to create campaign: ${error}`);
    }
  }

  /**
   * Execute campaign immediately
   */
  static async executeCampaign(campaignId: string): Promise<CampaignExecutionResponse> {
    try {
      const response = await axios.post<CampaignExecutionResponse>(
        `${this.baseURL}/api/notifications/campaigns/${campaignId}/execute`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to execute campaign: ${error}`);
    }
  }

  /**
   * Pause campaign
   */
  static async pauseCampaign(campaignId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/api/notifications/campaigns/${campaignId}/pause`);
    } catch (error) {
      throw new Error(`Failed to pause campaign: ${error}`);
    }
  }

  /**
   * Resume campaign
   */
  static async resumeCampaign(campaignId: string): Promise<void> {
    try {
      await axios.post(`${this.baseURL}/api/notifications/campaigns/${campaignId}/resume`);
    } catch (error) {
      throw new Error(`Failed to resume campaign: ${error}`);
    }
  }

  /**
   * Get delivery analytics
   */
  static async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    channel?: string
  ): Promise<DeliveryAnalytics> {
    try {
      const response = await axios.get<DeliveryAnalytics>(
        `${this.baseURL}/api/notifications/analytics`,
        {
          params: {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            ...(channel && { channel }),
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get delivery analytics: ${error}`);
    }
  }

  /**
   * Get delivery status for a notification
   */
  static async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus> {
    try {
      const response = await axios.get<DeliveryStatus>(
        `${this.baseURL}/api/notifications/${notificationId}/status`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to get delivery status: ${error}`);
    }
  }

  /**
   * Retry failed deliveries
   */
  static async retryFailedDeliveries(notificationId: string): Promise<SendNotificationResponse> {
    try {
      const response = await axios.post<SendNotificationResponse>(
        `${this.baseURL}/api/notifications/${notificationId}/retry`
      );

      return response.data;
    } catch (error) {
      throw new Error(`Failed to retry deliveries: ${error}`);
    }
  }
}

export default NotificationService;