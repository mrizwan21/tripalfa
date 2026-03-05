/**
 * Notification Repository - API Integration
 *
 * Acts as the data access layer, providing a clean interface
 * between the frontend components and the backend API.
 */

import { NotificationService, type DeliveryStatus } from "@/services/notification-client/NotificationService";
import {
  type CreateNotificationRequest,
  type CreateTemplateRequest,
  type CreateCampaignRequest,
  type SendNotificationResponse,
  type DeliveryAnalytics,
  type CampaignExecutionResponse,
  type Notification,
  type NotificationTemplate,
  type NotificationCampaign,
} from "@tripalfa/api-clients";

// ============================================================================
// REPOSITORY CLASS
// ============================================================================

export class NotificationRepository {
  private notificationService: NotificationService;

  constructor(apiBaseUrl: string = "/api") {
    this.notificationService = new NotificationService(apiBaseUrl);
  }

  /**
   * Send a notification (from NotificationTemplateBuilder)
   */
  async sendNotification(
    request: CreateNotificationRequest,
  ): Promise<SendNotificationResponse> {
    return this.notificationService.sendNotification(request);
  }

  /**
   * Get notification delivery status (for NotificationAnalyticsOverview)
   */
  async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus> {
    return this.notificationService.getDeliveryStatus(notificationId);
  }

  /**
   * Get delivery analytics (for NotificationAnalyticsOverview)
   */
  async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    channel?: string,
  ): Promise<DeliveryAnalytics> {
    return this.notificationService.getDeliveryAnalytics(
      startDate,
      endDate,
      channel,
    );
  }

  /**
   * Create template (from NotificationTemplateBuilder)
   */
  async createTemplate(
    request: CreateTemplateRequest,
  ): Promise<NotificationTemplate> {
    return this.notificationService.createTemplate(request);
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    return this.notificationService.getTemplate(templateId);
  }

  /**
   * List templates (for NotificationTemplateBuilder and NotificationCampaignManager)
   */
  async listTemplates(
    limit: number = 50,
    offset: number = 0,
  ): Promise<NotificationTemplate[]> {
    return this.notificationService.listTemplates(limit, offset);
  }

  /**
   * List notifications (for NotificationCenter activity feed)
   */
  async listNotifications(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    return this.notificationService.listNotifications(limit, offset);
  }

  /**
   * Delete notification (from NotificationCenter activity feed)
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return this.notificationService.deleteNotification(notificationId);
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>,
  ): Promise<NotificationTemplate> {
    return this.notificationService.updateTemplate(templateId, updates);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    return this.notificationService.deleteTemplate(templateId);
  }

  /**
   * Create campaign (from NotificationCampaignManager)
   */
  async createCampaign(
    request: CreateCampaignRequest,
  ): Promise<NotificationCampaign> {
    return this.notificationService.createCampaign(request);
  }

  /**
   * Execute campaign (from NotificationCampaignManager and NotificationScheduler)
   */
  async executeCampaign(
    campaignId: string,
  ): Promise<CampaignExecutionResponse> {
    return this.notificationService.executeCampaign(campaignId);
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    return this.notificationService.pauseCampaign(campaignId);
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    return this.notificationService.resumeCampaign(campaignId);
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(
    notificationId: string,
  ): Promise<SendNotificationResponse> {
    return this.notificationService.retryFailedDeliveries(notificationId);
  }
}

export default NotificationRepository;
