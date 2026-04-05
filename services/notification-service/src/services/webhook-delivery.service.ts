/**
 * Webhook Delivery Service
 *
 * Handles webhook delivery with retry logic, exponential backoff, and monitoring
 */

import crypto from 'crypto';
import { WebhookDeliveryRepository } from '../repositories/webhook-delivery.repository.js';
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookProvider,
  CreateWebhookDeliveryInput,
  UpdateWebhookDeliveryInput,
  WebhookDeliveryFilter,
  PaginatedWebhookDeliveries,
} from '../types/webhook-delivery.js';
import { logError, logInfo, logWarn } from '../utils/error-handler.js';

export class WebhookDeliveryService {
  private repository: WebhookDeliveryRepository;
  private webhookSecret: string;

  constructor(webhookSecret?: string) {
    this.repository = new WebhookDeliveryRepository();
    this.webhookSecret = webhookSecret || process.env.WEBHOOK_SECRET || 'development_secret';
  }

  /**
   * Verify webhook signature using HMAC
   */
  verifySignature(payload: string, signature: string, secret?: string): boolean {
    if (!signature) return false;

    const expectedSignature = crypto
      .createHmac('sha256', secret || this.webhookSecret)
      .update(payload)
      .digest('hex');

    try {
      return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature));
    } catch {
      return false;
    }
  }

  /**
   * Create a new webhook delivery record
   */
  async createDelivery(input: CreateWebhookDeliveryInput): Promise<WebhookDelivery> {
    try {
      logInfo('WebhookDeliveryService.createDelivery', {
        provider: input.provider,
        eventType: input.eventType,
      });

      const delivery = await this.repository.create(input);

      // Immediately attempt delivery (async)
      this.attemptDelivery(delivery.id).catch(error => {
        logError('WebhookDeliveryService.createDelivery.attemptDelivery', error, {
          deliveryId: delivery.id,
        });
      });

      return delivery;
    } catch (error: unknown) {
      logError('WebhookDeliveryService.createDelivery', error, { input });
      throw error;
    }
  }

  /**
   * Process incoming webhook from Duffel or other providers
   */
  async processIncomingWebhook(
    provider: WebhookProvider | string,
    eventType: string,
    payload: any,
    endpointUrl: string,
    signature?: string,
    customerId?: string,
    subscriptionId?: string
  ): Promise<WebhookDelivery> {
    try {
      logInfo('WebhookDeliveryService.processIncomingWebhook', {
        provider,
        eventType,
        endpointUrl,
      });

      // Verify signature if provided
      let verificationStatus: 'verified' | 'invalid' | 'skipped' = 'skipped';
      if (signature) {
        const payloadString = typeof payload === 'string' ? payload : JSON.stringify(payload);
        const isValid = this.verifySignature(payloadString, signature);
        verificationStatus = isValid ? 'verified' : 'invalid';

        if (!isValid) {
          logWarn('WebhookDeliveryService.processIncomingWebhook.invalidSignature', {
            provider,
            eventType,
          });
        }
      }

      const input: CreateWebhookDeliveryInput = {
        provider,
        eventType,
        payload,
        signature,
        verificationStatus,
        endpointUrl,
        customerId,
        subscriptionId,
        maxRetries: 5, // Default max retries
      };

      return await this.createDelivery(input);
    } catch (error: unknown) {
      logError('WebhookDeliveryService.processIncomingWebhook', error, {
        provider,
        eventType,
      });
      throw error;
    }
  }

  /**
   * Attempt to deliver a webhook to the target endpoint
   */
  async attemptDelivery(deliveryId: string): Promise<boolean> {
    try {
      const delivery = await this.repository.findById(deliveryId);
      if (!delivery) {
        logError('WebhookDeliveryService.attemptDelivery.deliveryNotFound', null, { deliveryId });
        return false;
      }

      // Check if max retries exceeded
      if (delivery.attemptCount >= delivery.maxRetries) {
        logWarn('WebhookDeliveryService.attemptDelivery.maxRetriesExceeded', {
          deliveryId,
          attemptCount: delivery.attemptCount,
          maxRetries: delivery.maxRetries,
        });

        await this.repository.update(deliveryId, {
          status: WebhookDeliveryStatus.DEAD_LETTER,
          lastError: 'Max retries exceeded',
        });
        return false;
      }

      // Update status to DELIVERING
      await this.repository.update(deliveryId, {
        status: WebhookDeliveryStatus.DELIVERING,
      });

      logInfo('WebhookDeliveryService.attemptDelivery.starting', {
        deliveryId,
        endpointUrl: delivery.endpointUrl,
        attempt: delivery.attemptCount + 1,
      });

      // Prepare request
      const payload = delivery.payload || {};
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'User-Agent': 'TripAlfa-Webhook-Delivery/1.0',
        'X-Webhook-Id': delivery.id,
        'X-Webhook-Event': delivery.eventType,
        'X-Webhook-Provider': delivery.provider,
      };

      // Add signature if available
      if (delivery.signature) {
        headers['X-Webhook-Signature'] = delivery.signature;
      }

      // Make HTTP request
      const startTime = Date.now();
      let response: Response;
      try {
        // Create abort controller with timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

        response = await fetch(delivery.endpointUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
      } catch (fetchError: unknown) {
        const errorMessage = fetchError.message || 'Network error';
        const duration = Date.now() - startTime;

        logWarn('WebhookDeliveryService.attemptDelivery.fetchError', {
          deliveryId,
          error: errorMessage,
          duration,
        });

        await this.handleDeliveryFailure(deliveryId, errorMessage);
        return false;
      }

      const duration = Date.now() - startTime;
      const responseStatusCode = response.status;
      let responseBody = '';

      try {
        responseBody = await response.text();
      } catch {
        // Ignore body reading errors
      }

      logInfo('WebhookDeliveryService.attemptDelivery.response', {
        deliveryId,
        statusCode: responseStatusCode,
        duration,
      });

      // Check if successful (2xx status)
      if (responseStatusCode >= 200 && responseStatusCode < 300) {
        await this.handleDeliverySuccess(
          deliveryId,
          responseStatusCode,
          responseBody,
          response.headers
        );
        return true;
      } else {
        const errorMessage = `HTTP ${responseStatusCode}: ${responseBody.substring(0, 200)}`;
        await this.handleDeliveryFailure(
          deliveryId,
          errorMessage,
          responseStatusCode,
          responseBody,
          response.headers
        );
        return false;
      }
    } catch (error: unknown) {
      logError('WebhookDeliveryService.attemptDelivery', error, { deliveryId });

      // Update delivery as failed
      try {
        await this.repository.update(deliveryId, {
          status: WebhookDeliveryStatus.FAILED,
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      } catch (updateError) {
        // Ignore update errors
      }

      return false;
    }
  }

  /**
   * Handle successful delivery
   */
  private async handleDeliverySuccess(
    deliveryId: string,
    statusCode: number,
    responseBody: string,
    headers: Headers
  ): Promise<void> {
    try {
      const responseHeaders: Record<string, string> = {};
      headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });

      await this.repository.update(deliveryId, {
        status: WebhookDeliveryStatus.DELIVERED,
        responseStatusCode: statusCode,
        responseBody: responseBody.substring(0, 5000), // Limit size
        responseHeaders,
        deliveredAt: new Date(),
      });

      logInfo('WebhookDeliveryService.handleDeliverySuccess', {
        deliveryId,
        statusCode,
      });
    } catch (error: unknown) {
      logError('WebhookDeliveryService.handleDeliverySuccess', error, { deliveryId });
    }
  }

  /**
   * Handle delivery failure with retry logic
   */
  private async handleDeliveryFailure(
    deliveryId: string,
    errorMessage: string,
    statusCode?: number,
    responseBody?: string,
    headers?: Headers
  ): Promise<void> {
    try {
      const delivery = await this.repository.findById(deliveryId);
      if (!delivery) return;

      const attemptCount = delivery.attemptCount + 1;
      const maxRetries = delivery.maxRetries;

      // Calculate exponential backoff with jitter
      const baseDelay = Math.pow(2, attemptCount) * 1000; // 2^attempt seconds in milliseconds
      const jitter = Math.random() * 1000; // Up to 1 second jitter
      const delay = Math.min(baseDelay + jitter, 30000); // Cap at 30 seconds

      const nextRetryAt = new Date(Date.now() + delay);
      const willRetry = attemptCount < maxRetries;

      // Convert Headers to object safely
      let responseHeaders: Record<string, string> | undefined;
      if (headers && 'entries' in headers) {
        responseHeaders = Object.fromEntries((headers as any).entries());
      }

      await this.repository.update(deliveryId, {
        status: willRetry ? WebhookDeliveryStatus.RETRYING : WebhookDeliveryStatus.FAILED,
        attemptCount,
        nextRetryAt: willRetry ? nextRetryAt : undefined,
        responseStatusCode: statusCode,
        responseBody: responseBody ? responseBody.substring(0, 5000) : undefined,
        responseHeaders,
        lastError: errorMessage.substring(0, 2000),
        errorCode: statusCode ? `HTTP_${statusCode}` : 'NETWORK_ERROR',
      });

      logWarn('WebhookDeliveryService.handleDeliveryFailure', {
        deliveryId,
        attemptCount,
        maxRetries,
        willRetry,
        nextRetryAt: willRetry ? nextRetryAt.toISOString() : undefined,
        error: errorMessage.substring(0, 200),
      });

      // Schedule retry if applicable
      if (willRetry) {
        setTimeout(() => {
          this.attemptDelivery(deliveryId).catch(error => {
            logError('WebhookDeliveryService.handleDeliveryFailure.retryScheduled', error, {
              deliveryId,
            });
          });
        }, delay);
      }
    } catch (error: unknown) {
      logError('WebhookDeliveryService.handleDeliveryFailure', error, { deliveryId });
    }
  }

  /**
   * Process pending retries (to be called by a scheduled job)
   */
  async processPendingRetries(limit: number = 100): Promise<number> {
    try {
      const pendingDeliveries = await this.repository.findPendingRetries(limit);

      logInfo('WebhookDeliveryService.processPendingRetries', {
        count: pendingDeliveries.length,
      });

      const promises = pendingDeliveries.map(delivery =>
        this.attemptDelivery(delivery.id).catch(error => {
          logError('WebhookDeliveryService.processPendingRetries.attempt', error, {
            deliveryId: delivery.id,
          });
          return false;
        })
      );

      const results = await Promise.all(promises);
      const successful = results.filter(result => result === true).length;

      return successful;
    } catch (error: unknown) {
      logError('WebhookDeliveryService.processPendingRetries', error, { limit });
      throw error;
    }
  }

  /**
   * Get webhook delivery by ID
   */
  async getDelivery(id: string): Promise<WebhookDelivery | null> {
    try {
      return await this.repository.findById(id);
    } catch (error: unknown) {
      logError('WebhookDeliveryService.getDelivery', error, { id });
      throw error;
    }
  }

  /**
   * List webhook deliveries with filtering and pagination
   */
  async listDeliveries(
    filter: WebhookDeliveryFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedWebhookDeliveries> {
    try {
      return await this.repository.findMany(filter, page, limit);
    } catch (error: unknown) {
      logError('WebhookDeliveryService.listDeliveries', error, { filter, page, limit });
      throw error;
    }
  }

  /**
   * Get delivery statistics
   */
  async getStatistics(timeRangeHours: number = 24): Promise<any> {
    try {
      const now = new Date();
      const fromDate = new Date(now.getTime() - timeRangeHours * 60 * 60 * 1000);

      const [total, byStatus, byProvider] = await Promise.all([
        this.repository.findMany({ fromDate }, 1, 1),
        Promise.all(
          Object.values(WebhookDeliveryStatus).map(status =>
            this.repository.findMany({ status, fromDate }, 1, 1).then(result => ({
              status,
              count: result.pagination.total,
            }))
          )
        ),
        Promise.all(
          Object.values(WebhookProvider).map(provider =>
            this.repository.findMany({ provider, fromDate }, 1, 1).then(result => ({
              provider,
              count: result.pagination.total,
            }))
          )
        ),
      ]);

      return {
        timeRange: {
          from: fromDate.toISOString(),
          to: now.toISOString(),
          hours: timeRangeHours,
        },
        total: total.pagination.total,
        byStatus: byStatus.reduce(
          (acc, item) => {
            acc[item.status] = item.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        byProvider: byProvider.reduce(
          (acc, item) => {
            acc[item.provider] = item.count;
            return acc;
          },
          {} as Record<string, number>
        ),
        successRate:
          total.pagination.total > 0
            ? (byStatus.find(s => s.status === WebhookDeliveryStatus.DELIVERED)?.count || 0) /
              total.pagination.total
            : 0,
      };
    } catch (error: unknown) {
      logError('WebhookDeliveryService.getStatistics', error, { timeRangeHours });
      throw error;
    }
  }
}
