/**
 * Webhook Delivery Routes
 * REST API endpoints for webhook delivery management
 */

import { Router, Request, Response } from 'express';
import { WebhookDeliveryController } from '../controllers/webhook-delivery.controller.js';
import { WebhookDeliveryService } from '../services/webhook-delivery.service.js';
import { WebhookProvider } from '../types/webhook-delivery.js';
import {
  createError,
  ErrorCode,
  formatErrorResponse,
  logError,
  logInfo,
} from '../utils/error-handler.js';

const router: Router = Router();
const controller = new WebhookDeliveryController();

/**
 * @swagger
 * tags:
 *   name: Webhook Deliveries
 *   description: Webhook Delivery Management and Monitoring
 */

/**
 * @swagger
 * /api/webhook-deliveries:
 *   get:
 *     summary: List webhook deliveries with pagination and filtering
 *     tags: [Webhook Deliveries]
 *     description: Retrieve a paginated list of webhook delivery attempts with optional filtering
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 50
 *         description: Number of items per page
 *       - in: query
 *         name: provider
 *         schema:
 *           type: string
 *           enum: [duffel, liteapi, internal, stripe, other]
 *         description: Filter by webhook provider
 *       - in: query
 *         name: eventType
 *         schema:
 *           type: string
 *         description: Filter by event type
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [PENDING, DELIVERING, DELIVERED, FAILED, RETRYING, DEAD_LETTER]
 *         description: Filter by delivery status
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: string
 *         description: Filter by customer ID
 *       - in: query
 *         name: subscriptionId
 *         schema:
 *           type: string
 *         description: Filter by subscription ID
 *       - in: query
 *         name: fromDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (ISO 8601)
 *       - in: query
 *         name: toDate
 *         schema:
 *           type: string
 *           format: date-time
 *         description: Filter by creation date (ISO 8601)
 *     responses:
 *       200:
 *         description: List of webhook deliveries
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/WebhookDelivery'
 *                 pagination:
 *                   $ref: '#/components/schemas/Pagination'
 */
router.get('/', controller.listDeliveries.bind(controller));

/**
 * @swagger
 * /api/webhook-deliveries/{id}:
 *   get:
 *     summary: Get a specific webhook delivery by ID
 *     tags: [Webhook Deliveries]
 *     description: Retrieve detailed information about a specific webhook delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook delivery ID
 *     responses:
 *       200:
 *         description: Webhook delivery details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WebhookDelivery'
 *       404:
 *         description: Webhook delivery not found
 */
router.get('/:id', controller.getDelivery.bind(controller));

/**
 * @swagger
 * /api/webhook-deliveries:
 *   post:
 *     summary: Create a new webhook delivery
 *     tags: [Webhook Deliveries]
 *     description: Manually create a webhook delivery record (for testing or manual retry)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateWebhookDeliveryInput'
 *     responses:
 *       201:
 *         description: Webhook delivery created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WebhookDelivery'
 *       400:
 *         description: Invalid input
 */
// TODO: Implement createDelivery in WebhookDeliveryController
// router.post('/', controller.createDelivery.bind(controller));

/**
 * @swagger
 * /api/webhook-deliveries/{id}/retry:
 *   post:
 *     summary: Retry a failed webhook delivery
 *     tags: [Webhook Deliveries]
 *     description: Manually trigger a retry for a failed webhook delivery
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook delivery ID
 *     responses:
 *       200:
 *         description: Retry initiated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WebhookDelivery'
 *       404:
 *         description: Webhook delivery not found
 *       400:
 *         description: Webhook delivery is not in a retryable state
 */
router.post('/:id/retry', controller.retryDelivery.bind(controller));

/**
 * @swagger
 * /api/webhook-deliveries/{id}/cancel:
 *   post:
 *     summary: Cancel a pending webhook delivery
 *     tags: [Webhook Deliveries]
 *     description: Cancel a webhook delivery that is pending or retrying
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Webhook delivery ID
 *     responses:
 *       200:
 *         description: Webhook delivery cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WebhookDelivery'
 *       404:
 *         description: Webhook delivery not found
 *       400:
 *         description: Webhook delivery cannot be cancelled
 */
// TODO: Implement cancelDelivery in WebhookDeliveryController
// router.post('/:id/cancel', controller.cancelDelivery.bind(controller));

/**
 * @swagger
 * /api/webhook-deliveries/process-pending-retries:
 *   post:
 *     summary: Process pending retries (admin endpoint)
 *     tags: [Webhook Deliveries]
 *     description: Process all pending retries (batch operation)
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               limit:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 1000
 *                 default: 100
 *                 description: Maximum number of retries to process
 *     responses:
 *       200:
 *         description: Pending retries processed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: object
 *                   properties:
 *                     processed:
 *                       type: integer
 *                       description: Number of retries successfully processed
 *                     limit:
 *                       type: integer
 *                     message:
 *                       type: string
 */
router.post('/process-pending-retries', controller.processPendingRetries.bind(controller));

/**
 * @swagger
 * /api/webhook-deliveries/internal:
 *   post:
 *     summary: Internal webhook processing endpoint
 *     tags: [Webhook Deliveries]
 *     description: Internal endpoint for services to forward webhooks for processing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               provider:
 *                 type: string
 *                 enum: [duffel, liteapi, internal, stripe, other]
 *                 description: Source provider of the webhook
 *               eventType:
 *                 type: string
 *                 description: Type of event (e.g., 'order.created', 'booking.confirmed')
 *               payload:
 *                 type: object
 *                 description: Original webhook payload
 *                 additionalProperties: true
 *               signature:
 *                 type: string
 *                 description: HMAC signature for verification (optional)
 *               endpointUrl:
 *                 type: string
 *                 format: uri
 *                 description: Target endpoint URL for delivery
 *               customerId:
 *                 type: string
 *                 description: Associated customer/tenant ID (optional)
 *               subscriptionId:
 *                 type: string
 *                 description: Webhook subscription ID (optional)
 *     responses:
 *       202:
 *         description: Webhook accepted for processing
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   $ref: '#/components/schemas/WebhookDelivery'
 *                 message:
 *                   type: string
 *       400:
 *         description: Invalid request body
 */
router.post('/internal', controller.internalWebhook.bind(controller));

export default router;
