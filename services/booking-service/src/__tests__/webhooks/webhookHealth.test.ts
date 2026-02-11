/**
 * Webhook Health & Monitoring Tests
 * Tests for health checks, statistics tracking, and webhook monitoring
 */

import express, { Express } from 'express';
import request from 'supertest';

describe('Webhook Health & Monitoring', () => {
  let app: Express;
  let webhookStats: { lastWebhookTime: string | null; totalProcessed: number; webhooksByType: Map<string, number> };

  beforeEach(() => {
    app = express();
    app.use(express.json());

    // Initialize webhook stats
    webhookStats = {
      lastWebhookTime: null,
      totalProcessed: 0,
      webhooksByType: new Map(),
    };

    // Health check endpoint
    app.get('/webhooks/health', (req, res) => {
      res.status(200).json({
        success: true,
        data: {
          webhook_receiver: 'operational',
          last_webhook_received: webhookStats.lastWebhookTime || 'never',
          total_webhooks_processed: webhookStats.totalProcessed,
          webhook_types_processed: Object.fromEntries(webhookStats.webhooksByType),
          timestamp: new Date().toISOString(),
        },
      });
    });

    // Mock webhook reception
    app.post('/webhooks/duffel', (req, res) => {
      webhookStats.lastWebhookTime = new Date().toISOString();
      webhookStats.totalProcessed++;
      const type = req.body.type || 'unknown';
      webhookStats.webhooksByType.set(type, (webhookStats.webhooksByType.get(type) || 0) + 1);

      res.status(200).json({
        success: true,
        message: 'Webhook received',
      });
    });
  });

  describe('Health Check Endpoint', () => {
    it('should return operational status when healthy', async () => {
      const response = await request(app).get('/webhooks/health');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.webhook_receiver).toBe('operational');
    });

    it('should include timestamp in health check response', async () => {
      const beforeTime = new Date();
      const response = await request(app).get('/webhooks/health');
      const afterTime = new Date();

      expect(response.body.data.timestamp).toBeDefined();
      const responseTime = new Date(response.body.data.timestamp);
      expect(responseTime.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(responseTime.getTime()).toBeLessThanOrEqual(afterTime.getTime() + 1000); // 1s buffer
    });

    it('should show zero webhooks before any are received', async () => {
      const response = await request(app).get('/webhooks/health');

      expect(response.body.data.total_webhooks_processed).toBe(0);
      expect(response.body.data.last_webhook_received).toBe('never');
    });

    it('should update webhook count after receiving webhook', async () => {
      // Send a webhook
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_1',
          type: 'order.created',
          data: { object: {} },
        });

      // Check health
      const healthResponse = await request(app).get('/webhooks/health');

      expect(healthResponse.body.data.total_webhooks_processed).toBe(1);
      expect(healthResponse.body.data.last_webhook_received).not.toBe('never');
    });

    it('should track last webhook timestamp correctly', async () => {
      // Send first webhook
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_1',
          type: 'order.created',
          data: { object: {} },
        });

      const firstHealthCheck = await request(app).get('/webhooks/health');
      const firstTimestamp = firstHealthCheck.body.data.last_webhook_received;

      // Wait a bit
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Send second webhook
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_2',
          type: 'order.updated',
          data: { object: {} },
        });

      const secondHealthCheck = await request(app).get('/webhooks/health');
      const secondTimestamp = secondHealthCheck.body.data.last_webhook_received;

      // Second timestamp should be after first
      expect(new Date(secondTimestamp).getTime()).toBeGreaterThan(new Date(firstTimestamp).getTime());
    });
  });

  describe('Webhook Statistics Tracking', () => {
    it('should track webhook type distribution', async () => {
      // Send different webhook types
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_1',
          type: 'order.created',
          data: { object: {} },
        });

      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_2',
          type: 'order.updated',
          data: { object: {} },
        });

      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_3',
          type: 'order.created',
          data: { object: {} },
        });

      const healthResponse = await request(app).get('/webhooks/health');

      expect(healthResponse.body.data.total_webhooks_processed).toBe(3);
      expect(healthResponse.body.data.webhook_types_processed['order.created']).toBe(2);
      expect(healthResponse.body.data.webhook_types_processed['order.updated']).toBe(1);
    });

    it('should increment total webhooks counter', async () => {
      for (let i = 0; i < 5; i++) {
        await request(app)
          .post('/webhooks/duffel')
          .send({
            id: `webhook_${i}`,
            type: 'order.created',
            data: { object: {} },
          });
      }

      const healthResponse = await request(app).get('/webhooks/health');
      expect(healthResponse.body.data.total_webhooks_processed).toBe(5);
    });

    it('should handle different event types correctly', async () => {
      const eventTypes = [
        'order.created',
        'order.updated',
        'order.airline_initiated_change_detected',
        'order_change_request.created',
        'ping.triggered',
      ];

      for (const eventType of eventTypes) {
        await request(app)
          .post('/webhooks/duffel')
          .send({
            id: `webhook_${eventType}`,
            type: eventType,
            data: { object: {} },
          });
      }

      const healthResponse = await request(app).get('/webhooks/health');

      expect(healthResponse.body.data.total_webhooks_processed).toBe(eventTypes.length);
      eventTypes.forEach((eventType) => {
        expect(healthResponse.body.data.webhook_types_processed[eventType]).toBe(1);
      });
    });

    it('should track unknown event types', async () => {
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_unknown',
          type: 'unknown.event.type',
          data: { object: {} },
        });

      const healthResponse = await request(app).get('/webhooks/health');

      expect(healthResponse.body.data.webhook_types_processed['unknown.event.type']).toBe(1);
    });

    it('should handle missing event type in webhook', async () => {
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_no_type',
          // Missing type field
          data: { object: {} },
        });

      const healthResponse = await request(app).get('/webhooks/health');

      // Should have tracked the unknown type
      expect(healthResponse.body.data.total_webhooks_processed).toBe(1);
    });
  });

  describe('Health Check Response Format', () => {
    it('should include all required fields in health check response', async () => {
      const response = await request(app).get('/webhooks/health');

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(response.body.data).toHaveProperty('webhook_receiver');
      expect(response.body.data).toHaveProperty('last_webhook_received');
      expect(response.body.data).toHaveProperty('total_webhooks_processed');
      expect(response.body.data).toHaveProperty('timestamp');
    });

    it('should return valid JSON in health check response', async () => {
      const response = await request(app).get('/webhooks/health');

      expect(() => JSON.stringify(response.body)).not.toThrow();
      expect(response.type).toMatch(/json/);
    });

    it('should have consistent response structure', async () => {
      const response1 = await request(app).get('/webhooks/health');
      const response2 = await request(app).get('/webhooks/health');

      expect(Object.keys(response1.body)).toEqual(Object.keys(response2.body));
      expect(Object.keys(response1.body.data)).toEqual(Object.keys(response2.body.data));
    });
  });

  describe('Health Check Performance', () => {
    it('should respond to health check within 100ms', async () => {
      const startTime = Date.now();
      await request(app).get('/webhooks/health');
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
    });

    it('should respond quickly even after processing many webhooks', async () => {
      // Send 100 webhooks
      for (let i = 0; i < 100; i++) {
        await request(app)
          .post('/webhooks/duffel')
          .send({
            id: `webhook_${i}`,
            type: 'order.created',
            data: { object: {} },
          });
      }

      // Health check should still be fast
      const startTime = Date.now();
      const response = await request(app).get('/webhooks/health');
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100);
      expect(response.body.data.total_webhooks_processed).toBe(100);
    });
  });

  describe('Webhook Monitoring Metrics', () => {
    it('should track webhook frequency', async () => {
      const timestamps: number[] = [];

      // Send webhooks at different times
      for (let i = 0; i < 5; i++) {
        timestamps.push(Date.now());
        await request(app)
          .post('/webhooks/duffel')
          .send({
            id: `webhook_${i}`,
            type: 'order.created',
            data: { object: {} },
          });

        if (i < 4) {
          await new Promise((resolve) => setTimeout(resolve, 50));
        }
      }

      const healthResponse = await request(app).get('/webhooks/health');
      expect(healthResponse.body.data.total_webhooks_processed).toBe(5);
    });

    it('should provide webhook type breakdown', async () => {
      // Send various event types multiple times
      const eventCounts = {
        'order.created': 3,
        'order.updated': 2,
        'order.airline_initiated_change_detected': 1,
        'order_change_request.created': 2,
      };

      for (const [eventType, count] of Object.entries(eventCounts)) {
        for (let i = 0; i < count; i++) {
          await request(app)
            .post('/webhooks/duffel')
            .send({
              id: `webhook_${eventType}_${i}`,
              type: eventType,
              data: { object: {} },
            });
        }
      }

      const healthResponse = await request(app).get('/webhooks/health');

      expect(healthResponse.body.data.total_webhooks_processed).toBe(
        Object.values(eventCounts).reduce((a, b) => a + b, 0)
      );

      for (const [eventType, expectedCount] of Object.entries(eventCounts)) {
        expect(healthResponse.body.data.webhook_types_processed[eventType]).toBe(expectedCount);
      }
    });
  });

  describe('Health Check Consistency', () => {
    it('should maintain consistent total count', async () => {
      for (let i = 0; i < 10; i++) {
        await request(app)
          .post('/webhooks/duffel')
          .send({
            id: `webhook_${i}`,
            type: 'order.created',
            data: { object: {} },
          });
      }

      // Check multiple times - count should be consistent
      for (let i = 0; i < 3; i++) {
        const response = await request(app).get('/webhooks/health');
        expect(response.body.data.total_webhooks_processed).toBe(10);
      }
    });

    it('should only advance last_webhook_received when new webhook arrives', async () => {
      await request(app)
        .post('/webhooks/duffel')
        .send({
          id: 'webhook_1',
          type: 'order.created',
          data: { object: {} },
        });

      const healthCheck1 = await request(app).get('/webhooks/health');
      const timestamp1 = healthCheck1.body.data.last_webhook_received;

      // Get health check again without sending webhook
      await new Promise((resolve) => setTimeout(resolve, 50));
      const healthCheck2 = await request(app).get('/webhooks/health');
      const timestamp2 = healthCheck2.body.data.last_webhook_received;

      // Timestamp should be the same
      expect(timestamp2).toBe(timestamp1);
    });
  });

  describe('Health Check Under Load', () => {
    it('should handle concurrent health check requests', async () => {
      const requests = Array(10)
        .fill(null)
        .map(() => request(app).get('/webhooks/health'));

      const responses = await Promise.all(requests);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    });

    it('should accurately count webhooks with concurrent requests', async () => {
      // Send 5 webhooks concurrently
      const webhookRequests = Array(5)
        .fill(null)
        .map((_, i) =>
          request(app)
            .post('/webhooks/duffel')
            .send({
              id: `webhook_${i}`,
              type: 'order.created',
              data: { object: {} },
            })
        );

      await Promise.all(webhookRequests);

      const healthResponse = await request(app).get('/webhooks/health');
      expect(healthResponse.body.data.total_webhooks_processed).toBe(5);
    });
  });
});
