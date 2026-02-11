/**
 * API Manager Webhook Handler
 * Processes API manager events (rate limits, quota, key expiration, health checks)
 * and dispatches admin notifications
 */

import logger from '../utils/logger';

export interface APIManagerEvent {
  eventType: string;
  apiKey: string;
  currentUsage?: number;
  limit?: number;
  threshold?: number;
  resetTime?: string;
  expiryDate?: string;
  error?: string;
  severity?: string;
  timestamp: string;
}

export interface APIManagerNotification {
  id: string;
  recipient: string;
  type: string;
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
  metadata: Record<string, any>;
}

/**
 * Creates an API manager notification from an event
 */
export function createAPIManagerNotification(event: APIManagerEvent): APIManagerNotification | null {
  const baseNotification: APIManagerNotification = {
    id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    recipient: process.env.ADMIN_EMAIL || 'admin@tripalfa.com',
    type: `api_manager_${event.eventType}`,
    title: '',
    message: '',
    priority: 'medium',
    channels: ['email', 'in_app'],
    metadata: {
      eventType: event.eventType,
      apiKey: event.apiKey,
      sourceSystem: 'api_manager',
      timestamp: event.timestamp,
    },
  };

  switch (event.eventType) {
    case 'rate_limit_warning':
      baseNotification.title = '⚠️ API Rate Limit Warning';
      baseNotification.message = `Your API usage is approaching the limit. Current: ${event.currentUsage}/${event.limit} requests.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['email', 'in_app', 'sms'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        currentUsage: event.currentUsage,
        limit: event.limit,
        usagePercentage: ((event.currentUsage || 0) / (event.limit || 1)) * 100,
        threshold: event.threshold,
        resetTime: event.resetTime,
        recommendedActions: ['Optimize API calls', 'Request for higher limit'],
      };
      return baseNotification;

    case 'quota_exceeded':
      baseNotification.title = '🚫 API Quota Exceeded';
      baseNotification.message = `Your API quota has been exceeded. Usage: ${event.currentUsage}/${event.limit} requests.`;
      baseNotification.priority = 'urgent';
      baseNotification.channels = ['email', 'sms', 'in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        currentUsage: event.currentUsage,
        limit: event.limit,
        overageAmount: (event.currentUsage || 0) - (event.limit || 0),
        resetTime: event.resetTime,
        requiresAction: true,
        actionType: 'request_quota_increase',
      };
      return baseNotification;

    case 'api_key_expiring':
      baseNotification.title = '⏰ API Key Expiring Soon';
      baseNotification.message = `Your API key will expire on ${event.expiryDate}. Please renew it to avoid service interruption.`;
      baseNotification.priority = 'high';
      baseNotification.channels = ['email', 'in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        expiryDate: event.expiryDate,
        requiresAction: true,
        actionType: 'renew_api_key',
      };
      return baseNotification;

    case 'api_key_expired':
      baseNotification.title = '❌ API Key Expired';
      baseNotification.message = `Your API key expired on ${event.expiryDate}. Service is unavailable.`;
      baseNotification.priority = 'urgent';
      baseNotification.channels = ['email', 'sms', 'in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        expiryDate: event.expiryDate,
        requiresAction: true,
        actionType: 'renew_api_key_immediately',
      };
      return baseNotification;

    case 'api_health_check_failed':
      baseNotification.title = '🔴 API Integration Error';
      baseNotification.message = `API health check failed. Service may be experiencing issues: ${event.error}`;
      baseNotification.priority = 'urgent';
      baseNotification.channels = ['email', 'sms', 'in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        error: event.error,
        severity: event.severity || 'high',
        requiresAction: true,
        actionType: 'investigate_api_health',
      };
      return baseNotification;

    case 'rate_limit_reset':
      baseNotification.title = 'ℹ️ API Rate Limit Reset';
      baseNotification.message = `Your API rate limit has been reset. Current usage: 0/${event.limit}.`;
      baseNotification.priority = 'low';
      baseNotification.channels = ['in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        limit: event.limit,
        resetTime: event.resetTime,
      };
      return baseNotification;

    case 'quota_limit_increased':
      baseNotification.title = '✅ API Quota Increased';
      baseNotification.message = `Your API quota has been increased to ${event.limit} requests.`;
      baseNotification.priority = 'low';
      baseNotification.channels = ['email', 'in_app'];
      baseNotification.metadata = {
        ...baseNotification.metadata,
        newLimit: event.limit,
      };
      return baseNotification;

    default:
      logger.warn(`Unhandled API manager event type: ${event.eventType}`);
      return null;
  }
}

/**
 * Processes an API manager event and returns notification data
 */
export async function processAPIManagerEvent(
  event: APIManagerEvent
): Promise<{ success: boolean; notification?: APIManagerNotification; error?: string }> {
  try {
    if (!event.eventType || !event.apiKey || !event.timestamp) {
      return {
        success: false,
        error: 'Missing required event fields: eventType, apiKey, timestamp',
      };
    }

    const notification = createAPIManagerNotification(event);

    if (!notification) {
      return {
        success: false,
        error: `Unable to map event type: ${event.eventType}`,
      };
    }

    logger.info(`API manager event processed`, {
      eventType: event.eventType,
      apiKey: event.apiKey,
      notificationId: notification.id,
      priority: notification.priority,
    });

    return {
      success: true,
      notification,
    };
  } catch (error) {
    logger.error('Error processing API manager event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}
