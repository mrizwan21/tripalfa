import axios from 'axios';

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'transactional' | 'marketing' | 'system';
  channels: string[];
  recipients: string[];
  variables?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
  status: 'queued' | 'sent' | 'failed';
  createdAt: string;
  sentAt?: string;
}

export interface NotificationTemplate {
  id: string;
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  body: string;
  variables: Array<{ name: string; description?: string; type: string }>;
  channels: any[];
  createdAt: string;
  updatedAt: string;
}

export interface NotificationCampaign {
  id: string;
  name: string;
  description?: string;
  title: string;
  message: string;
  type: 'one_time' | 'recurring';
  channels: string[];
  targetSegment?: string;
  schedule?: any;
  maxRecipients?: number;
  status: 'draft' | 'scheduled' | 'running' | 'completed' | 'paused';
  createdAt: string;
}

export interface DeliveryStatus {
  notificationId: string;
  status: 'delivered' | 'failed' | 'pending';
  channels: Record<string, { status: string; deliveredAt?: string; error?: string }>;
  updatedAt: string;
}

export interface CreateNotificationRequest {
  title: string;
  message: string;
  type: 'transactional' | 'marketing' | 'system';
  channels: string[];
  recipients: string[];
  variables?: Record<string, string>;
  priority?: 'low' | 'normal' | 'high';
  metadata?: Record<string, any>;
}

export interface SendNotificationResponse {
  notificationId: string;
  deliveryId?: string;
  status: 'queued' | 'sent' | 'failed';
  channels: Record<string, DeliveryStatus>;
  timestamp: Date;
  errors?: Array<{ channel: string; error: string }>;
}

export interface CreateTemplateRequest {
  name: string;
  description?: string;
  type: 'email' | 'sms' | 'push' | 'in_app';
  subject?: string;
  body: string;
  variables: Array<{ name: string; description?: string; type: string }>;
  channels: any[];
}

export interface CreateCampaignRequest {
  name: string;
  description?: string;
  title: string;
  message: string;
  type: 'one_time' | 'recurring';
  channels: string[];
  targetSegment?: string;
  schedule?: any;
  maxRecipients?: number;
}

export interface CampaignExecutionResponse {
  campaignId: string;
  executionId: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  status: 'running' | 'completed' | 'failed';
  startedAt: Date;
  completedAt?: Date;
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
  chartData: Array<{ timestamp: Date; count: number }>;
}

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