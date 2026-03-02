/**
 * Notification Repository - API Integration
 *
 * Acts as the data access layer, providing a clean interface
 * between the frontend components and the backend API.
 */

import {
  NotificationService,
  type CreateNotificationRequest,
  type CreateTemplateRequest,
  type CreateCampaignRequest,
  type SendNotificationResponse,
  type DeliveryAnalytics,
  type CampaignExecutionResponse,
  type Notification,
  type NotificationTemplate,
  type NotificationCampaign,
  type DeliveryStatus,
} from "@tripalfa/api-clients";

// ============================================================================
// REPOSITORY CLASS
// ============================================================================

export class NotificationRepository {
  constructor(apiBaseUrl: string = "/api", apiKey: string = "") {
    // Service is now static, no instance needed
  }

  /**
   * Send a notification (from NotificationTemplateBuilder)
   */
  async sendNotification(
    request: CreateNotificationRequest,
  ): Promise<SendNotificationResponse> {
    return NotificationService.sendNotification(request);
  }

  /**
   * Get notification delivery status (for NotificationAnalyticsOverview)
   */
  async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus> {
    return NotificationService.getDeliveryStatus(notificationId);
  }

  /**
   * Get delivery analytics (for NotificationAnalyticsOverview)
   */
  async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    channel?: string,
  ): Promise<DeliveryAnalytics> {
    return NotificationService.getDeliveryAnalytics(
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
    return NotificationService.createTemplate(request);
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    return NotificationService.getTemplate(templateId);
  }

  /**
   * List templates (for NotificationTemplateBuilder and NotificationCampaignManager)
   */
  async listTemplates(
    limit: number = 50,
    offset: number = 0,
  ): Promise<NotificationTemplate[]> {
    return NotificationService.listTemplates(limit, offset);
  }

  /**
   * List notifications (for NotificationCenter activity feed)
   */
  async listNotifications(
    limit: number = 50,
    offset: number = 0,
  ): Promise<Notification[]> {
    return NotificationService.listNotifications(limit, offset);
  }

  /**
   * Delete notification (from NotificationCenter activity feed)
   */
  async deleteNotification(notificationId: string): Promise<void> {
    return NotificationService.deleteNotification(notificationId);
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>,
  ): Promise<NotificationTemplate> {
    return NotificationService.updateTemplate(templateId, updates);
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    return NotificationService.deleteTemplate(templateId);
  }

  /**
   * Create campaign (from NotificationCampaignManager)
   */
  async createCampaign(
    request: CreateCampaignRequest,
  ): Promise<NotificationCampaign> {
    return NotificationService.createCampaign(request);
  }

  /**
   * Execute campaign (from NotificationCampaignManager and NotificationScheduler)
   */
  async executeCampaign(
    campaignId: string,
  ): Promise<CampaignExecutionResponse> {
    return NotificationService.executeCampaign(campaignId);
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    return NotificationService.pauseCampaign(campaignId);
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    return NotificationService.resumeCampaign(campaignId);
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(
    notificationId: string,
  ): Promise<SendNotificationResponse> {
    return NotificationService.retryFailedDeliveries(notificationId);
  }
}

export default NotificationRepository;
