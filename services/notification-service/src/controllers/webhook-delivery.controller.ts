/**
 * Webhook Delivery Controller
 * Handles HTTP requests for webhook delivery operations
 */

import { Request, Response } from 'express';
import { WebhookDeliveryService } from '../services/webhook-delivery.service.js';
import {
  WebhookDeliveryFilter,
  WebhookDeliveryStatus,
  WebhookProvider,
} from '../types/webhook-delivery.js';
import {
  createError,
  ErrorCode,
  formatErrorResponse,
  logError,
  logInfo,
} from '../utils/error-handler.js';

export class WebhookDeliveryController {
  private service: WebhookDeliveryService;

  constructor() {
    this.service = new WebhookDeliveryService();
  }

  /**
   * GET /webhook-deliveries - List webhook deliveries with pagination and filtering
   */
  async listDeliveries(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      // Parse query parameters
      const page = Math.max(1, parseInt(req.query.page as string) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string) || 50));

      const filter: WebhookDeliveryFilter = {};

      if (req.query.provider) {
        filter.provider = req.query.provider as string;
      }

      if (req.query.eventType) {
        filter.eventType = req.query.eventType as string;
      }

      if (req.query.status) {
        const status = req.query.status as string;
        if (Object.values(WebhookDeliveryStatus).includes(status as WebhookDeliveryStatus)) {
          filter.status = status as WebhookDeliveryStatus;
        }
      }

      if (req.query.customerId) {
        filter.customerId = req.query.customerId as string;
      }

      if (req.query.subscriptionId) {
        filter.subscriptionId = req.query.subscriptionId as string;
      }

      if (req.query.fromDate) {
        const fromDate = new Date(req.query.fromDate as string);
        if (!isNaN(fromDate.getTime())) {
          filter.fromDate = fromDate;
        }
      }

      if (req.query.toDate) {
        const toDate = new Date(req.query.toDate as string);
        if (!isNaN(toDate.getTime())) {
          filter.toDate = toDate;
        }
      }

      const result = await this.service.listDeliveries(filter, page, limit);

      const duration = Date.now() - startTime;
      logInfo('WebhookDeliveryController.listDeliveries', {
        page,
        limit,
        filter,
        total: result.pagination.total,
        duration,
      });

      res.status(200).json({
        success: true,
        data: result.data,
        pagination: result.pagination,
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logError('WebhookDeliveryController.listDeliveries', error, {
        query: req.query,
        duration,
      });

      const errorResponse = formatErrorResponse(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }

  /**
   * GET /webhook-deliveries/:id - Get a specific webhook delivery
   */
  async getDelivery(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const id = req.params.id as string;

      const delivery = await this.service.getDelivery(id);

      if (!delivery) {
        const error = createError(
          ErrorCode.NOT_FOUND,
          `Webhook delivery with ID ${id} not found`,
          404
        );
        const errorResponse = formatErrorResponse(error);
        res.status(404).json(errorResponse);
        return;
      }

      const duration = Date.now() - startTime;
      logInfo('WebhookDeliveryController.getDelivery', {
        id,
        duration,
      });

      res.status(200).json({
        success: true,
        data: delivery,
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logError('WebhookDeliveryController.getDelivery', error, {
        id: req.params.id,
        duration,
      });

      const errorResponse = formatErrorResponse(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }

  /**
   * GET /webhook-deliveries/statistics - Get delivery statistics
   */
  async getStatistics(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const timeRangeHours = Math.min(
        720,
        Math.max(1, parseInt(req.query.timeRangeHours as string) || 24)
      );

      const statistics = await this.service.getStatistics(timeRangeHours);

      const duration = Date.now() - startTime;
      logInfo('WebhookDeliveryController.getStatistics', {
        timeRangeHours,
        duration,
      });

      res.status(200).json({
        success: true,
        data: statistics,
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logError('WebhookDeliveryController.getStatistics', error, {
        query: req.query,
        duration,
      });

      const errorResponse = formatErrorResponse(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }

  /**
   * POST /webhook-deliveries/:id/retry - Retry a failed webhook delivery
   */
  async retryDelivery(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const id = req.params.id as string;

      const delivery = await this.service.getDelivery(id);

      if (!delivery) {
        const error = createError(
          ErrorCode.NOT_FOUND,
          `Webhook delivery with ID ${id} not found`,
          404
        );
        const errorResponse = formatErrorResponse(error);
        res.status(404).json(errorResponse);
        return;
      }

      // Check if delivery can be retried
      if (
        delivery.status !== WebhookDeliveryStatus.FAILED &&
        delivery.status !== WebhookDeliveryStatus.RETRYING
      ) {
        const error = createError(
          ErrorCode.CONFLICT,
          `Webhook delivery with ID ${id} is not in a retryable state (current status: ${delivery.status})`,
          409
        );
        const errorResponse = formatErrorResponse(error);
        res.status(409).json(errorResponse);
        return;
      }

      // Attempt delivery
      const success = await this.service.attemptDelivery(id);

      const duration = Date.now() - startTime;
      logInfo('WebhookDeliveryController.retryDelivery', {
        id,
        success,
        duration,
      });

      res.status(202).json({
        success: true,
        data: {
          deliveryId: id,
          retryInitiated: success,
          message: success ? 'Retry initiated successfully' : 'Retry failed',
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logError('WebhookDeliveryController.retryDelivery', error, {
        id: req.params.id,
        duration,
      });

      const errorResponse = formatErrorResponse(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }

  /**
   * POST /webhook-deliveries/internal - Internal webhook endpoint for processing incoming webhooks
   */
  async internalWebhook(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const { provider, eventType, payload, signature, endpointUrl, customerId, subscriptionId } =
        req.body;

      // Validate required fields
      if (!provider || !eventType || !endpointUrl) {
        const error = createError(
          ErrorCode.INVALID_REQUEST,
          'Missing required fields: provider, eventType, endpointUrl',
          400
        );
        const errorResponse = formatErrorResponse(error);
        res.status(400).json(errorResponse);
        return;
      }

      const service = new WebhookDeliveryService();
      const delivery = await service.processIncomingWebhook(
        provider,
        eventType,
        payload,
        endpointUrl,
        signature,
        customerId,
        subscriptionId
      );

      const duration = Date.now() - startTime;
      logInfo('WebhookDeliveryController.internalWebhook', {
        provider,
        eventType,
        endpointUrl,
        deliveryId: delivery.id,
        duration,
      });

      res.status(202).json({
        success: true,
        data: delivery,
        message: 'Webhook accepted for processing',
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logError('WebhookDeliveryController.internalWebhook', error, {
        body: req.body,
        duration,
      });

      const errorResponse = formatErrorResponse(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }

  /**
   * POST /webhook-deliveries/process-pending-retries - Process pending retries (admin endpoint)
   */
  async processPendingRetries(req: Request, res: Response): Promise<void> {
    const startTime = Date.now();

    try {
      const limit = Math.min(1000, Math.max(1, parseInt(req.body.limit as string) || 100));

      const service = new WebhookDeliveryService();
      const successful = await service.processPendingRetries(limit);

      const duration = Date.now() - startTime;
      logInfo('WebhookDeliveryController.processPendingRetries', {
        limit,
        successful,
        duration,
      });

      res.status(200).json({
        success: true,
        data: {
          processed: successful,
          limit,
          message: `Processed ${successful} pending retries`,
        },
        meta: {
          duration,
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      logError('WebhookDeliveryController.processPendingRetries', error, {
        body: req.body,
        duration,
      });

      const errorResponse = formatErrorResponse(error);
      res.status(errorResponse.status || 500).json(errorResponse);
    }
  }
}
