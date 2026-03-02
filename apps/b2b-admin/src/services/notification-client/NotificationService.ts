/**
 * Notification Service - Backend Integration Layer
 *
 * Handles:
 * - Creating and sending notifications
 * - Managing notification templates
 * - Campaign scheduling and execution
 * - Delivery tracking and analytics
 * - Multi-channel coordination
 *
 * This service now uses the centralized APIManager for all API calls,
 * providing consistent error handling, caching, and request/response interceptors.
 *
 * Types are now aligned with @tripalfa/api-clients package.
 */

import { APIManager } from "../api-manager/APIManager.js";
import type {
  NotificationTemplate,
  NotificationCampaign,
  Notification,
  NotificationChannel,
  ChannelConfig,
  DeliveryStatusResponse,
  FrequencyConfig,
  CreateNotificationRequest,
  SendNotificationResponse,
  CreateTemplateRequest,
  CreateCampaignRequest,
  CampaignExecutionResponse,
  DeliveryAnalytics,
} from "@tripalfa/api-clients";

// Get the singleton APIManager instance
const apiManager = APIManager.getInstance();

// ============================================================================
// TYPE ALIASES - Re-export for backward compatibility
// ============================================================================

// Alias for backward compatibility
export type DeliveryStatus = DeliveryStatusResponse;

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NotificationService {
  private apiBaseUrl: string;
  private apiKey: string;

  constructor(baseUrl: string = "/api", apiKey: string = "") {
    this.apiBaseUrl = baseUrl;
    this.apiKey = apiKey;
  }

  /**
   * Create and send a notification
   * Uses centralized APIManager for consistent error handling and caching
   */
  async sendNotification(
    request: CreateNotificationRequest,
  ): Promise<SendNotificationResponse> {
    try {
      const response = await apiManager.post<any>(
        `${this.apiBaseUrl}/notifications/send`,
        request,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to send notification",
        );
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error sending notification:", error);
      throw error;
    }
  }

  /**
   * Create a notification template
   * Uses centralized APIManager for consistent error handling
   */
  async createTemplate(
    request: CreateTemplateRequest,
  ): Promise<NotificationTemplate> {
    try {
      const response = await apiManager.post<NotificationTemplate>(
        `${this.apiBaseUrl}/notifications/templates`,
        request,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to create template");
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error creating template:", error);
      throw error;
    }
  }

  /**
   * Get template by ID
   * Uses centralized APIManager with caching support
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    try {
      const response = await apiManager.get<NotificationTemplate>(
        `${this.apiBaseUrl}/notifications/templates/${templateId}`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Template not found");
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error fetching template:", error);
      throw error;
    }
  }

  /**
   * List all templates
   * Uses centralized APIManager with caching support
   */
  async listTemplates(
    limit: number = 50,
    offset: number = 0,
  ): Promise<NotificationTemplate[]> {
    try {
      const response = await apiManager.get<NotificationTemplate[]>(
        `${this.apiBaseUrl}/notifications/templates`,
        { params: { limit, offset } },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to list templates");
      }

      return response.data || [];
    } catch (error) {
      console.error("[NotificationService] Error listing templates:", error);
      throw error;
    }
  }

  /**
   * Update template
   * Uses centralized APIManager
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>,
  ): Promise<NotificationTemplate> {
    try {
      const response = await apiManager.patch<NotificationTemplate>(
        `${this.apiBaseUrl}/notifications/templates/${templateId}`,
        updates,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to update template");
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error updating template:", error);
      throw error;
    }
  }

  /**
   * Delete template
   * Uses centralized APIManager
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const response = await apiManager.delete(
        `${this.apiBaseUrl}/notifications/templates/${templateId}`,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to delete template");
      }
    } catch (error) {
      console.error("[NotificationService] Error deleting template:", error);
      throw error;
    }
  }

  /**
   * Create a campaign
   * Uses centralized APIManager
   */
  async createCampaign(
    request: CreateCampaignRequest,
  ): Promise<NotificationCampaign> {
    try {
      const response = await apiManager.post<NotificationCampaign>(
        `${this.apiBaseUrl}/notifications/campaigns`,
        request,
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to create campaign");
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error creating campaign:", error);
      throw error;
    }
  }

  /**
   * Execute campaign immediately
   * Uses centralized APIManager
   */
  async executeCampaign(
    campaignId: string,
  ): Promise<CampaignExecutionResponse> {
    try {
      const response = await apiManager.post<CampaignExecutionResponse>(
        `${this.apiBaseUrl}/notifications/campaigns/${campaignId}/execute`,
        {},
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to execute campaign",
        );
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error executing campaign:", error);
      throw error;
    }
  }

  /**
   * Pause campaign
   * Uses centralized APIManager
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      const response = await apiManager.post(
        `${this.apiBaseUrl}/notifications/campaigns/${campaignId}/pause`,
        {},
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to pause campaign");
      }
    } catch (error) {
      console.error("[NotificationService] Error pausing campaign:", error);
      throw error;
    }
  }

  /**
   * Resume campaign
   * Uses centralized APIManager
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      const response = await apiManager.post(
        `${this.apiBaseUrl}/notifications/campaigns/${campaignId}/resume`,
        {},
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to resume campaign");
      }
    } catch (error) {
      console.error("[NotificationService] Error resuming campaign:", error);
      throw error;
    }
  }

  /**
   * Get delivery analytics
   * Uses centralized APIManager with caching support
   */
  async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    channel?: string,
  ): Promise<DeliveryAnalytics> {
    try {
      const params: Record<string, string> = {
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      };
      if (channel) params.channel = channel;

      const response = await apiManager.get<DeliveryAnalytics>(
        `${this.apiBaseUrl}/notifications/analytics`,
        { params },
      );

      if (!response.success) {
        throw new Error(response.error?.message || "Failed to fetch analytics");
      }

      return {
        totalSent: response.data?.totalSent || 0,
        successCount: response.data?.successCount || 0,
        failureCount: response.data?.failureCount || 0,
        deliveryRate: response.data?.deliveryRate || 0,
        openCount: response.data?.openCount,
        clickCount: response.data?.clickCount,
        unsubscribeCount: response.data?.unsubscribeCount,
        bounceCount: response.data?.bounceCount,
        chartData:
          response.data?.chartData?.map((item: any) => ({
            timestamp: item.timestamp,
            count: item.count,
          })) || [],
      };
    } catch (error) {
      console.error("[NotificationService] Error fetching analytics:", error);
      throw error;
    }
  }

  /**
   * Get delivery status for a notification
   * Uses centralized APIManager
   */
  async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus> {
    try {
      const response = await apiManager.get<DeliveryStatus>(
        `${this.apiBaseUrl}/notifications/${notificationId}/status`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to fetch delivery status",
        );
      }

      return response.data!;
    } catch (error) {
      console.error(
        "[NotificationService] Error fetching delivery status:",
        error,
      );
      throw error;
    }
  }

  /**
   * List notifications
   * Uses centralized APIManager with caching support
   */
  async listNotifications(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    try {
      const response = await apiManager.get<Notification[]>(
        `${this.apiBaseUrl}/notifications`,
        { params: { limit, offset } },
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to list notifications",
        );
      }

      return response.data || [];
    } catch (error) {
      console.error(
        "[NotificationService] Error listing notifications:",
        error,
      );
      throw error;
    }
  }

  /**
   * Delete a notification
   * Uses centralized APIManager
   */
  async deleteNotification(notificationId: string): Promise<void> {
    try {
      const response = await apiManager.delete(
        `${this.apiBaseUrl}/notifications/${notificationId}`,
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to delete notification",
        );
      }
    } catch (error) {
      console.error(
        "[NotificationService] Error deleting notification:",
        error,
      );
      throw error;
    }
  }

  /**
   * Retry failed deliveries
   * Uses centralized APIManager
   */
  async retryFailedDeliveries(
    notificationId: string,
  ): Promise<SendNotificationResponse> {
    try {
      const response = await apiManager.post<SendNotificationResponse>(
        `${this.apiBaseUrl}/notifications/${notificationId}/retry`,
        {},
      );

      if (!response.success) {
        throw new Error(
          response.error?.message || "Failed to retry deliveries",
        );
      }

      return response.data!;
    } catch (error) {
      console.error("[NotificationService] Error retrying deliveries:", error);
      throw error;
    }
  }
}

export default NotificationService;
