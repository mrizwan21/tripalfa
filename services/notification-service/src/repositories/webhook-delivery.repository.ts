/**
 * Repository for Webhook Delivery database operations
 * Provides data access layer for webhook delivery tracking with proper error handling
 */

import { opsDb } from '../database.js';
import {
  WebhookDelivery,
  WebhookDeliveryStatus,
  WebhookProvider,
  CreateWebhookDeliveryInput,
  UpdateWebhookDeliveryInput,
  WebhookDeliveryFilter,
  PaginatedWebhookDeliveries,
} from '../types/webhook-delivery.js';
import { logError } from '../utils/error-handler.js';

export class WebhookDeliveryRepository {
  /**
   * Create a new webhook delivery record
   */
  async create(data: CreateWebhookDeliveryInput): Promise<WebhookDelivery> {
    try {
      const delivery = await opsDb.webhook_delivery.create({
        data: {
          provider: data.provider,
          eventType: data.eventType,
          webhookId: data.webhookId,
          payload: data.payload,
          signature: data.signature,
          verificationStatus: data.verificationStatus,
          endpointUrl: data.endpointUrl,
          customerId: data.customerId,
          subscriptionId: data.subscriptionId,
          maxRetries: data.maxRetries ?? 3,
          status: WebhookDeliveryStatus.PENDING,
          attemptCount: 0,
        },
      });

      return this.mapToInternal(delivery);
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.create', error, { data });
      throw error;
    }
  }

  /**
   * Find a webhook delivery by ID
   */
  async findById(id: string): Promise<WebhookDelivery | null> {
    try {
      const delivery = await opsDb.webhook_delivery.findUnique({
        where: { id },
      });

      return delivery ? this.mapToInternal(delivery) : null;
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.findById', error, { id });
      throw error;
    }
  }

  /**
   * Find webhook deliveries by filter with pagination
   */
  async findMany(
    filter: WebhookDeliveryFilter,
    page: number = 1,
    limit: number = 50
  ): Promise<PaginatedWebhookDeliveries> {
    try {
      const skip = (page - 1) * limit;

      const where: any = {};

      if (filter.provider) {
        where.provider = filter.provider;
      }

      if (filter.eventType) {
        where.eventType = filter.eventType;
      }

      if (filter.status) {
        where.status = filter.status;
      }

      if (filter.customerId) {
        where.customerId = filter.customerId;
      }

      if (filter.subscriptionId) {
        where.subscriptionId = filter.subscriptionId;
      }

      if (filter.fromDate || filter.toDate) {
        where.createdAt = {};
        if (filter.fromDate) {
          where.createdAt.gte = filter.fromDate;
        }
        if (filter.toDate) {
          where.createdAt.lte = filter.toDate;
        }
      }

      const [deliveries, total] = await Promise.all([
        opsDb.webhook_delivery.findMany({
          where,
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        opsDb.webhook_delivery.count({ where }),
      ]);

      const totalPages = Math.ceil(total / limit);

      return {
        data: deliveries.map(delivery => this.mapToInternal(delivery)),
        pagination: {
          total,
          page,
          limit,
          totalPages,
        },
      };
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.findMany', error, { filter, page, limit });
      throw error;
    }
  }

  /**
   * Update a webhook delivery record
   */
  async update(id: string, data: UpdateWebhookDeliveryInput): Promise<WebhookDelivery> {
    try {
      const delivery = await opsDb.webhook_delivery.update({
        where: { id },
        data: {
          status: data.status,
          attemptCount: data.attemptCount,
          nextRetryAt: data.nextRetryAt,
          responseStatusCode: data.responseStatusCode,
          responseBody: data.responseBody,
          responseHeaders: data.responseHeaders,
          deliveredAt: data.deliveredAt,
          lastError: data.lastError,
          errorCode: data.errorCode,
        },
      });

      return this.mapToInternal(delivery);
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.update', error, { id, data });
      throw error;
    }
  }

  /**
   * Increment attempt count and update status
   */
  async incrementAttempt(id: string, error?: string): Promise<WebhookDelivery> {
    try {
      const delivery = await opsDb.webhook_delivery.update({
        where: { id },
        data: {
          attemptCount: { increment: 1 },
          lastError: error,
          updatedAt: new Date(),
        },
      });

      return this.mapToInternal(delivery);
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.incrementAttempt', error, { id });
      throw error;
    }
  }

  /**
   * Find deliveries that need retry (status = FAILED or RETRYING, nextRetryAt <= now, attemptCount < maxRetries)
   */
  async findPendingRetries(limit: number = 100): Promise<WebhookDelivery[]> {
    try {
      const now = new Date();

      const deliveries = await opsDb.webhook_delivery.findMany({
        where: {
          OR: [
            { status: WebhookDeliveryStatus.FAILED },
            { status: WebhookDeliveryStatus.RETRYING },
          ],
          attemptCount: { lt: opsDb.webhook_delivery.fields.maxRetries },
          nextRetryAt: { lte: now },
        },
        orderBy: { nextRetryAt: 'asc' },
        take: limit,
      });

      return deliveries.map(delivery => this.mapToInternal(delivery));
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.findPendingRetries', error, { limit });
      throw error;
    }
  }

  /**
   * Find deliveries by status
   */
  async findByStatus(
    status: WebhookDeliveryStatus,
    limit: number = 100
  ): Promise<WebhookDelivery[]> {
    try {
      const deliveries = await opsDb.webhook_delivery.findMany({
        where: { status },
        orderBy: { createdAt: 'desc' },
        take: limit,
      });

      return deliveries.map(delivery => this.mapToInternal(delivery));
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.findByStatus', error, { status, limit });
      throw error;
    }
  }

  /**
   * Delete a webhook delivery record (for cleanup)
   */
  async delete(id: string): Promise<boolean> {
    try {
      await opsDb.webhook_delivery.delete({
        where: { id },
      });
      return true;
    } catch (error: unknown) {
      logError('WebhookDeliveryRepository.delete', error, { id });
      throw error;
    }
  }

  /**
   * Map database model to internal type
   */
  private mapToInternal(dbModel: any): WebhookDelivery {
    return {
      id: dbModel.id,
      provider: dbModel.provider,
      eventType: dbModel.eventType,
      webhookId: dbModel.webhookId,
      payload: dbModel.payload,
      signature: dbModel.signature,
      verificationStatus: dbModel.verificationStatus,
      endpointUrl: dbModel.endpointUrl,
      customerId: dbModel.customerId,
      subscriptionId: dbModel.subscriptionId,
      status: dbModel.status as WebhookDeliveryStatus,
      attemptCount: dbModel.attemptCount,
      maxRetries: dbModel.maxRetries,
      nextRetryAt: dbModel.nextRetryAt,
      responseStatusCode: dbModel.responseStatusCode,
      responseBody: dbModel.responseBody,
      responseHeaders: dbModel.responseHeaders,
      deliveredAt: dbModel.deliveredAt,
      lastError: dbModel.lastError,
      errorCode: dbModel.errorCode,
      createdAt: dbModel.createdAt,
      updatedAt: dbModel.updatedAt,
    };
  }
}
