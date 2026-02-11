/**
 * API Manager Service
 * Tracks API usage, monitors rate limits, quotas, and sends notifications
 * Integrates with external API clients to monitor usage patterns
 */

import axios from 'axios';
import logger from '../utils/logger';

export interface APIUsageRecord {
  apiKey: string;
  endpoint: string;
  method: string;
  timestamp: number;
  responseTime: number;
  statusCode: number;
  error?: string;
}

export interface APIQuotaConfig {
  apiKey: string;
  dailyLimit: number;
  hourlyLimit: number;
  monthlyLimit: number;
}

export interface APIRateLimitConfig {
  apiKey: string;
  requestsPerMinute: number;
  requestsPerHour: number;
  burstLimit: number;
}

export class APIManagerService {
  private usageRecords: Map<string, APIUsageRecord[]> = new Map();
  private quotaConfigs: Map<string, APIQuotaConfig> = new Map();
  private rateLimitConfigs: Map<string, APIRateLimitConfig> = new Map();
  private webhookUrl: string;
  private isEnabled: boolean;

  constructor() {
    this.webhookUrl = process.env.API_MANAGER_WEBHOOK_URL || 'http://localhost:3001/api/webhooks/api-manager';
    this.isEnabled = process.env.API_MANAGER_ENABLED === 'true';

    // Initialize default configs for known API keys
    this.initializeDefaultConfigs();

    logger.info('[APIManager] Service initialized', {
      enabled: this.isEnabled,
      webhookUrl: this.webhookUrl
    });
  }

  /**
   * Initialize default API configurations
   */
  private initializeDefaultConfigs(): void {
    // Duffel API configuration
    const duffelApiKey = process.env.DUFFEL_API_KEY;
    if (duffelApiKey) {
      this.quotaConfigs.set(duffelApiKey, {
        apiKey: duffelApiKey,
        dailyLimit: 10000,
        hourlyLimit: 1000,
        monthlyLimit: 300000
      });

      this.rateLimitConfigs.set(duffelApiKey, {
        apiKey: duffelApiKey,
        requestsPerMinute: 60,
        requestsPerHour: 1000,
        burstLimit: 10
      });
    }

    // LiteAPI configuration
    const liteApiKey = process.env.LITEAPI_KEY;
    if (liteApiKey) {
      this.quotaConfigs.set(liteApiKey, {
        apiKey: liteApiKey,
        dailyLimit: 5000,
        hourlyLimit: 500,
        monthlyLimit: 150000
      });

      this.rateLimitConfigs.set(liteApiKey, {
        apiKey: liteApiKey,
        requestsPerMinute: 30,
        requestsPerHour: 500,
        burstLimit: 5
      });
    }
  }

  /**
   * Record API usage
   */
  async recordUsage(record: APIUsageRecord): Promise<void> {
    if (!this.isEnabled) return;

    try {
      const key = record.apiKey;
      if (!this.usageRecords.has(key)) {
        this.usageRecords.set(key, []);
      }

      const records = this.usageRecords.get(key)!;
      records.push(record);

      // Keep only last 24 hours of records
      const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);
      const recentRecords = records.filter(r => r.timestamp > oneDayAgo);
      this.usageRecords.set(key, recentRecords);

      // Check for alerts
      await this.checkForAlerts(key);

      logger.debug('[APIManager] Usage recorded', {
        apiKey: this.maskApiKey(key),
        endpoint: record.endpoint,
        statusCode: record.statusCode
      });
    } catch (error) {
      logger.error('[APIManager] Error recording usage:', error);
    }
  }

  /**
   * Check for rate limit and quota alerts
   */
  private async checkForAlerts(apiKey: string): Promise<void> {
    const now = Date.now();
    const records = this.usageRecords.get(apiKey) || [];

    // Check rate limits
    await this.checkRateLimits(apiKey, records, now);

    // Check quotas
    await this.checkQuotas(apiKey, records, now);

    // Check for API health issues
    await this.checkApiHealth(apiKey, records);
  }

  /**
   * Check rate limit violations
   */
  private async checkRateLimits(apiKey: string, records: APIUsageRecord[], now: number): Promise<void> {
    const config = this.rateLimitConfigs.get(apiKey);
    if (!config) return;

    // Check per minute
    const minuteAgo = now - (60 * 1000);
    const minuteRequests = records.filter(r => r.timestamp > minuteAgo).length;

    if (minuteRequests >= config.requestsPerMinute * 0.85) { // 85% threshold
      await this.sendEvent({
        eventType: 'rate_limit_warning',
        apiKey,
        currentUsage: minuteRequests,
        limit: config.requestsPerMinute,
        threshold: 85,
        resetTime: new Date(now + (60 * 1000)).toISOString(),
        timestamp: new Date().toISOString()
      });
    }

    // Check per hour
    const hourAgo = now - (60 * 60 * 1000);
    const hourRequests = records.filter(r => r.timestamp > hourAgo).length;

    if (hourRequests >= config.requestsPerHour * 0.9) { // 90% threshold
      await this.sendEvent({
        eventType: 'rate_limit_warning',
        apiKey,
        currentUsage: hourRequests,
        limit: config.requestsPerHour,
        threshold: 90,
        resetTime: new Date(now + (60 * 60 * 1000)).toISOString(),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check quota violations
   */
  private async checkQuotas(apiKey: string, records: APIUsageRecord[], now: number): Promise<void> {
    const config = this.quotaConfigs.get(apiKey);
    if (!config) return;

    // Check hourly quota
    const hourAgo = now - (60 * 60 * 1000);
    const hourUsage = records.filter(r => r.timestamp > hourAgo).length;

    if (hourUsage >= config.hourlyLimit * 0.95) { // 95% threshold
      await this.sendEvent({
        eventType: 'quota_exceeded',
        apiKey,
        currentUsage: hourUsage,
        limit: config.hourlyLimit,
        resetTime: new Date(now + (60 * 60 * 1000)).toISOString(),
        timestamp: new Date().toISOString()
      });
    }

    // Check daily quota
    const dayAgo = now - (24 * 60 * 60 * 1000);
    const dayUsage = records.filter(r => r.timestamp > dayAgo).length;

    if (dayUsage >= config.dailyLimit * 0.95) { // 95% threshold
      await this.sendEvent({
        eventType: 'quota_exceeded',
        apiKey,
        currentUsage: dayUsage,
        limit: config.dailyLimit,
        resetTime: new Date(now + (24 * 60 * 60 * 1000)).toISOString(),
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Check API health based on error rates
   */
  private async checkApiHealth(apiKey: string, records: APIUsageRecord[]): Promise<void> {
    const recentRecords = records.filter(r => r.timestamp > Date.now() - (60 * 60 * 1000)); // Last hour
    if (recentRecords.length < 10) return; // Need minimum sample size

    const errorCount = recentRecords.filter(r => r.statusCode >= 500).length;
    const errorRate = errorCount / recentRecords.length;

    if (errorRate > 0.1) { // 10% error rate threshold
      await this.sendEvent({
        eventType: 'api_health_check_failed',
        apiKey,
        error: `High error rate detected: ${(errorRate * 100).toFixed(1)}%`,
        severity: 'high',
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * Send event to API manager webhook
   */
  private async sendEvent(event: any): Promise<void> {
    if (!this.isEnabled) return;

    try {
      await axios.post(this.webhookUrl, event, {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json'
        }
      });

      logger.info('[APIManager] Event sent to webhook', {
        eventType: event.eventType,
        apiKey: this.maskApiKey(event.apiKey)
      });
    } catch (error) {
      logger.error('[APIManager] Failed to send event to webhook:', error);
    }
  }

  /**
   * Mask API key for logging
   */
  private maskApiKey(apiKey: string): string {
    if (apiKey.length <= 8) return '***';
    return apiKey.substring(0, 4) + '***' + apiKey.substring(apiKey.length - 4);
  }

  /**
   * Get usage statistics for an API key
   */
  getUsageStats(apiKey: string): {
    today: number;
    thisHour: number;
    thisMinute: number;
    totalErrors: number;
  } {
    const records = this.usageRecords.get(apiKey) || [];
    const now = Date.now();

    return {
      today: records.filter(r => r.timestamp > now - (24 * 60 * 60 * 1000)).length,
      thisHour: records.filter(r => r.timestamp > now - (60 * 60 * 1000)).length,
      thisMinute: records.filter(r => r.timestamp > now - (60 * 1000)).length,
      totalErrors: records.filter(r => r.statusCode >= 400).length
    };
  }

  /**
   * Update configuration for an API key
   */
  updateQuotaConfig(apiKey: string, config: Partial<APIQuotaConfig>): void {
    const existing = this.quotaConfigs.get(apiKey) || { apiKey, dailyLimit: 1000, hourlyLimit: 100, monthlyLimit: 30000 };
    this.quotaConfigs.set(apiKey, { ...existing, ...config });
  }

  /**
   * Update rate limit configuration
   */
  updateRateLimitConfig(apiKey: string, config: Partial<APIRateLimitConfig>): void {
    const existing = this.rateLimitConfigs.get(apiKey) || { apiKey, requestsPerMinute: 60, requestsPerHour: 1000, burstLimit: 10 };
    this.rateLimitConfigs.set(apiKey, { ...existing, ...config });
  }

  /**
   * Check if API key is approaching limits
   */
  isApproachingLimits(apiKey: string): {
    rateLimit: boolean;
    quota: boolean;
    percentage: number;
  } {
    const stats = this.getUsageStats(apiKey);
    const quotaConfig = this.quotaConfigs.get(apiKey);
    const rateConfig = this.rateLimitConfigs.get(apiKey);

    let maxPercentage = 0;

    // Check rate limits
    if (rateConfig) {
      const ratePercentage = (stats.thisMinute / rateConfig.requestsPerMinute) * 100;
      maxPercentage = Math.max(maxPercentage, ratePercentage);
    }

    // Check quotas
    if (quotaConfig) {
      const quotaPercentage = (stats.thisHour / quotaConfig.hourlyLimit) * 100;
      maxPercentage = Math.max(maxPercentage, quotaPercentage);
    }

    return {
      rateLimit: maxPercentage >= 80,
      quota: maxPercentage >= 90,
      percentage: maxPercentage
    };
  }
}

// Export singleton instance
export const apiManagerService = new APIManagerService();