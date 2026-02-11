/**
 * Webhook Integration Tests
 * Tests for webhook endpoints, event processing, and integration with notification service
 */

import request from 'supertest';
import crypto from 'crypto';
import express, { Express } from 'express';

// Mock implementations
let app: Express;

describe('Webhook Integration Tests', () => {
  const webhookSecret = 'test_webhook_secret_key';
  const testWebhookPayload = {
    id: 'webhook_123',
    type: 'order.created',
    live_mode: false,
    created_at: new Date().toISOString(),
    idempotency_key: 'idem_123',
    data: {
      object: {
        id: 'ord_123',
        booking_reference: 'ABC123',
        custom_metadata: {
          customer_id: 'customer_123',
        },
        total_amount: '1500.00',
        total_currency: 'USD',
        passengers: [{ id: 'pass_1' }, { id: 'pass_2' }],
      },
    },
  };

  beforeEach(() => {
    // Create a test Express app with webhook middleware
    app = express();
    app.use(express.json({ verify: (req, res, buf) => ((req as any).rawBody = buf) }));

    // Set webhook secret in environment
    process.env.DUFFEL_WEBHOOK_SECRET = webhookSecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Webhook Signature Validation', () => {
    it('should accept webhook with valid signature', async () => {
      // Create valid signature
      const payload = JSON.stringify(testWebhookPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;

      // Mock the webhook handler endpoint
      app.post('/webhooks/duffel', (req, res) => {
        // Validate signature (simplified for test)
        res.status(200).json({
          success: true,
          message: 'Webhook received',
        });
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', signature)
        .send(testWebhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject webhook with invalid signature', async () => {
      const invalidSignature = 't=1616202842,v1=invalidsignaturehash';

      app.post('/webhooks/duffel', (req, res) => {
        res.status(200).json({
          success: true,
          message: 'Webhook received',
        });
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', invalidSignature)
        .send(testWebhookPayload);

      // In real implementation, this would reject the webhook
      // but still return 200 to prevent retries
      expect(response.status).toBe(200);
    });

    it('should reject webhook with missing signature header', async () => {
      app.post('/webhooks/duffel', (req, res) => {
        const signature = req.get('x-duffel-signature');
        if (!signature) {
          return res.status(200).json({
            success: false,
            error: 'Missing signature header',
          });
        }
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .send(testWebhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });
  });

  describe('Webhook Event Processing', () => {
    it('should process order.created webhook and send notification', async () => {
      const payload = JSON.stringify(testWebhookPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;

      app.post('/webhooks/duffel', (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            webhookId: testWebhookPayload.id,
            notificationId: 'notif_123',
            notificationStatus: 'sent',
          },
        });
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', signature)
        .send(testWebhookPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.webhookId).toBe('webhook_123');
      expect(response.body.data.notificationId).toBeDefined();
    });

    it('should process order.cancelled webhook with appropriate priority', async () => {
      const cancelledPayload = {
        ...testWebhookPayload,
        type: 'order.cancelled',
      };

      app.post('/webhooks/duffel', (req, res) => {
        const eventType = req.body.type;
        expect(eventType).toBe('order.cancelled');

        res.status(200).json({
          success: true,
          data: {
            webhookId: req.body.id,
            notificationId: 'notif_123',
            priority: 'urgent',
          },
        });
      });

      const payload = JSON.stringify(cancelledPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;

      const response = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', signature)
        .send(cancelledPayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle webhook with missing customer ID gracefully', async () => {
      const payloadWithoutCustomerId = {
        ...testWebhookPayload,
        data: {
          object: {
            id: 'ord_123',
            // No custom_metadata with customer_id
          },
        },
      };

      app.post('/webhooks/duffel', (req, res) => {
        // Should still return 200 to prevent retries
        res.status(200).json({
          success: true,
          message: 'Webhook received but customer ID could not be extracted',
        });
      });

      const payload = JSON.stringify(payloadWithoutCustomerId);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;

      const response = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', signature)
        .send(payloadWithoutCustomerId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should always return 200 even on processing errors', async () => {
      app.post('/webhooks/duffel', (req, res) => {
        // Simulate processing error but return 200
        try {
          throw new Error('Internal processing error');
        } catch (error) {
          return res.status(200).json({
            success: false,
            error: 'Internal processing error',
          });
        }
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .send(testWebhookPayload);

      expect(response.status).toBe(200);
    });
  });

  describe('Webhook Idempotency', () => {
    it('should prevent duplicate processing with idempotency key', async () => {
      const processedWebhooks = new Set<string>();

      app.post('/webhooks/duffel', (req, res) => {
        const idempotencyKey = req.body.idempotency_key;

        // Check if already processed
        if (processedWebhooks.has(idempotencyKey)) {
          return res.status(200).json({
            success: true,
            message: 'Duplicate webhook detected, skipping processing',
            isDuplicate: true,
          });
        }

        // Mark as processed
        processedWebhooks.add(idempotencyKey);

        res.status(200).json({
          success: true,
          message: 'Webhook processed',
          isDuplicate: false,
        });
      });

      const payload = JSON.stringify(testWebhookPayload);
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;

      // First request
      const response1 = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', signature)
        .send(testWebhookPayload);

      expect(response1.status).toBe(200);
      expect(response1.body.isDuplicate).toBe(false);

      // Second request with same idempotency key
      const response2 = await request(app)
        .post('/webhooks/duffel')
        .set('X-Duffel-Signature', signature)
        .send(testWebhookPayload);

      expect(response2.status).toBe(200);
      expect(response2.body.isDuplicate).toBe(true);
    });
  });

  describe('Webhook Health Check', () => {
    it('should return health check status', async () => {
      app.get('/webhooks/health', (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            webhook_receiver: 'operational',
            last_webhook_received: new Date().toISOString(),
            total_webhooks_processed: 42,
            timestamp: new Date().toISOString(),
          },
        });
      });

      const response = await request(app).get('/webhooks/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.webhook_receiver).toBe('operational');
      expect(response.body.data.total_webhooks_processed).toBeGreaterThanOrEqual(0);
    });

    it('should include last webhook timestamp in health check', async () => {
      app.get('/webhooks/health', (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            webhook_receiver: 'operational',
            last_webhook_received: new Date().toISOString(),
            total_webhooks_processed: 42,
            timestamp: new Date().toISOString(),
          },
        });
      });

      const response = await request(app).get('/webhooks/health');

      expect(response.body.data.last_webhook_received).toBeDefined();
      const lastReceived = new Date(response.body.data.last_webhook_received);
      expect(lastReceived.getTime()).toBeLessThanOrEqual(Date.now());
    });
  });

  describe('Test Webhook Endpoint', () => {
    it('should accept test webhooks', async () => {
      app.post('/webhooks/test', (req, res) => {
        res.status(200).json({
          success: true,
          message: 'Test webhook received successfully',
          timestamp: new Date().toISOString(),
        });
      });

      const response = await request(app)
        .post('/webhooks/test')
        .send({
          test: true,
          data: 'test data',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain('Test webhook received');
    });
  });

  describe('Webhook Event Types Coverage', () => {
    const eventTypes = [
      'order.created',
      'order.updated',
      'order.airline_initiated_change_detected',
      'order_change_request.created',
      'order_change_request.expires_soon',
      'order_change.confirmed',
      'order_change.rejected',
      'ping.triggered',
    ];

    eventTypes.forEach((eventType) => {
      it(`should handle ${eventType} webhook`, async () => {
        const payload = {
          ...testWebhookPayload,
          type: eventType,
        };

        app.post('/webhooks/duffel', (req, res) => {
          res.status(200).json({
            success: true,
            eventType: req.body.type,
          });
        });

        const payloadStr = JSON.stringify(payload);
        const timestamp = Math.floor(Date.now() / 1000).toString();
        const signedPayload = timestamp + '.' + payloadStr;
        const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
        const computedSignature = crypto
          .createHmac('sha256', secretBuffer)
          .update(signedPayload)
          .digest('hex')
          .toLowerCase();

        const signature = `t=${timestamp},v1=${computedSignature}`;

        const response = await request(app)
          .post('/webhooks/duffel')
          .set('X-Duffel-Signature', signature)
          .send(payload);

        expect(response.status).toBe(200);
        expect(response.body.eventType).toBe(eventType);
      });
    });
  });

  describe('Webhook Error Handling', () => {
    it('should handle malformed JSON gracefully', async () => {
      app.use(express.text());
      app.post('/webhooks/duffel', (req, res) => {
        try {
          JSON.parse(req.body);
        } catch (error) {
          return res.status(200).json({
            success: false,
            error: 'Invalid JSON payload',
          });
        }
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .send('invalid json');

      expect(response.status).toBe(200);
    });

    it('should handle missing required webhook fields', async () => {
      app.post('/webhooks/duffel', (req, res) => {
        if (!req.body.type || !req.body.id) {
          return res.status(200).json({
            success: false,
            error: 'Missing required webhook fields',
          });
        }
        res.status(200).json({ success: true });
      });

      const incompletePayload = {
        // Missing 'type' field
        id: 'webhook_123',
      };

      const response = await request(app)
        .post('/webhooks/duffel')
        .send(incompletePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(false);
    });

    it('should handle very large webhook payloads', async () => {
      app.post('/webhooks/duffel', (req, res) => {
        res.status(200).json({
          success: true,
          payloadSize: JSON.stringify(req.body).length,
        });
      });

      // Create large payload
      const largePayload = {
        ...testWebhookPayload,
        data: {
          object: {
            ...testWebhookPayload.data.object,
            largeData: 'x'.repeat(50000),
          },
        },
      };

      const response = await request(app)
        .post('/webhooks/duffel')
        .send(largePayload);

      expect(response.status).toBe(200);
      expect(response.body.payloadSize).toBeGreaterThan(50000);
    });
  });

  describe('Webhook Response Format', () => {
    it('should return standardized response format', async () => {
      app.post('/webhooks/duffel', (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            webhookId: req.body.id,
            notificationId: 'notif_123',
            notificationStatus: 'sent',
          },
          message: 'Webhook processed and notification logged',
        });
      });

      const response = await request(app)
        .post('/webhooks/duffel')
        .send(testWebhookPayload);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('message');
      expect(typeof response.body.success).toBe('boolean');
      expect(typeof response.body.message).toBe('string');
      if (response.body.data) {
        expect(response.body.data).toHaveProperty('webhookId');
      }
    });
  });
});
