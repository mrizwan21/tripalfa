/**
 * Notification Service - Backend Integration Layer
 *
 * Handles:
 * - Creating and sending notifications
 * - Managing notification templates
 * - Campaign scheduling and execution
 * - Delivery tracking and analytics
 * - Multi-channel coordination
 */

import type {
  NotificationTemplate,
  NotificationCampaign,
  NotificationChannel,
  ChannelConfig as NotificationChannelConfig,
  UserNotificationPreferences as NotificationPreferences,
  DeliveryStatus,
  FrequencyConfig as ScheduleConfig,
} from '@/features/notifications/types-notification'

// ============================================================================
// SERVICE INTERFACES
// ============================================================================

export interface CreateNotificationRequest {
  title: string
  message: string
  type: 'transactional' | 'system'
  channels: string[]
  recipients: string[]
  variables?: Record<string, string>
  priority?: 'low' | 'normal' | 'high'
  metadata?: Record<string, any>
}

export interface SendNotificationResponse {
  notificationId: string
  deliveryId?: string
  status: 'queued' | 'sent' | 'failed'
  channels: Record<string, DeliveryStatus>
  timestamp: Date
  errors?: Array<{ channel: string; error: string }>
}

export interface CreateTemplateRequest {
  name: string
  description?: string
  type: 'email' | 'sms' | 'push' | 'in_app'
  subject?: string
  body: string
  variables: Array<{ name: string; description?: string; type: string }>
  channels: NotificationChannelConfig[]
}

export interface CreateCampaignRequest {
  name: string
  description?: string
  title: string
  message: string
  type: 'one_time' | 'recurring'
  channels: string[]
  targetSegment?: string
  schedule?: ScheduleConfig
  maxRecipients?: number
}

export interface CampaignExecutionResponse {
  campaignId: string
  executionId: string
  totalRecipients: number
  sentCount: number
  failedCount: number
  status: 'running' | 'completed' | 'failed'
  startedAt: Date
  completedAt?: Date
  errors?: string[]
}

export interface DeliveryAnalytics {
  totalSent: number
  successCount: number
  failureCount: number
  deliveryRate: number
  openCount?: number
  clickCount?: number
  unsubscribeCount?: number
  bounceCount?: number
  chartData: Array<{ timestamp: Date; count: number }>
}

// ============================================================================
// SERVICE CLASS
// ============================================================================

export class NotificationService {
  private apiBaseUrl: string
  private apiKey: string

  constructor(baseUrl: string = '/api', apiKey: string = '') {
    this.apiBaseUrl = baseUrl
    this.apiKey = apiKey
  }

  /**
   * Create and send a notification
   */
  async sendNotification(
    request: CreateNotificationRequest
  ): Promise<SendNotificationResponse> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/send`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to send notification: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      }
    } catch (error) {
      console.error('[NotificationService] Error sending notification:', error)
      throw error
    }
  }

  /**
   * Create a notification template
   */
  async createTemplate(request: CreateTemplateRequest): Promise<NotificationTemplate> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/templates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to create template: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[NotificationService] Error creating template:', error)
      throw error
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<NotificationTemplate> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/templates/${templateId}`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Template not found: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[NotificationService] Error fetching template:', error)
      throw error
    }
  }

  /**
   * List all templates
   */
  async listTemplates(limit: number = 50, offset: number = 0): Promise<NotificationTemplate[]> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/notifications/templates?limit=${limit}&offset=${offset}`,
        {
          headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to list templates: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[NotificationService] Error listing templates:', error)
      throw error
    }
  }

  /**
   * Update template
   */
  async updateTemplate(
    templateId: string,
    updates: Partial<CreateTemplateRequest>
  ): Promise<NotificationTemplate> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/templates/${templateId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(updates),
      })

      if (!response.ok) {
        throw new Error(`Failed to update template: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[NotificationService] Error updating template:', error)
      throw error
    }
  }

  /**
   * Delete template
   */
  async deleteTemplate(templateId: string): Promise<void> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/templates/${templateId}`, {
        method: 'DELETE',
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to delete template: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[NotificationService] Error deleting template:', error)
      throw error
    }
  }

  /**
   * Create a campaign
   */
  async createCampaign(request: CreateCampaignRequest): Promise<NotificationCampaign> {
    try {
      const response = await fetch(`${this.apiBaseUrl}/notifications/campaigns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.apiKey && { 'X-API-Key': this.apiKey }),
        },
        body: JSON.stringify(request),
      })

      if (!response.ok) {
        throw new Error(`Failed to create campaign: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[NotificationService] Error creating campaign:', error)
      throw error
    }
  }

  /**
   * Execute campaign immediately
   */
  async executeCampaign(campaignId: string): Promise<CampaignExecutionResponse> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/notifications/campaigns/${campaignId}/execute`,
        {
          method: 'POST',
          headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to execute campaign: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        startedAt: new Date(data.startedAt),
        completedAt: data.completedAt ? new Date(data.completedAt) : undefined,
      }
    } catch (error) {
      console.error('[NotificationService] Error executing campaign:', error)
      throw error
    }
  }

  /**
   * Pause campaign
   */
  async pauseCampaign(campaignId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/notifications/campaigns/${campaignId}/pause`,
        {
          method: 'POST',
          headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to pause campaign: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[NotificationService] Error pausing campaign:', error)
      throw error
    }
  }

  /**
   * Resume campaign
   */
  async resumeCampaign(campaignId: string): Promise<void> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/notifications/campaigns/${campaignId}/resume`,
        {
          method: 'POST',
          headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to resume campaign: ${response.statusText}`)
      }
    } catch (error) {
      console.error('[NotificationService] Error resuming campaign:', error)
      throw error
    }
  }

  /**
   * Get delivery analytics
   */
  async getDeliveryAnalytics(
    startDate: Date,
    endDate: Date,
    channel?: string
  ): Promise<DeliveryAnalytics> {
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        ...(channel && { channel }),
      })

      const response = await fetch(`${this.apiBaseUrl}/notifications/analytics?${params}`, {
        headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch analytics: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        chartData: data.chartData?.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp),
        })) || [],
      }
    } catch (error) {
      console.error('[NotificationService] Error fetching analytics:', error)
      throw error
    }
  }

  /**
   * Get delivery status for a notification
   */
  async getDeliveryStatus(notificationId: string): Promise<DeliveryStatus> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/notifications/${notificationId}/status`,
        {
          headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to fetch delivery status: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('[NotificationService] Error fetching delivery status:', error)
      throw error
    }
  }

  /**
   * Retry failed deliveries
   */
  async retryFailedDeliveries(notificationId: string): Promise<SendNotificationResponse> {
    try {
      const response = await fetch(
        `${this.apiBaseUrl}/notifications/${notificationId}/retry`,
        {
          method: 'POST',
          headers: this.apiKey ? { 'X-API-Key': this.apiKey } : {},
        }
      )

      if (!response.ok) {
        throw new Error(`Failed to retry deliveries: ${response.statusText}`)
      }

      const data = await response.json()
      return {
        ...data,
        timestamp: new Date(data.timestamp),
      }
    } catch (error) {
      console.error('[NotificationService] Error retrying deliveries:', error)
      throw error
    }
  }
}

export default NotificationService
