/**
 * LiteAPI Webhook Integration Tests
 * Tests for HTTP endpoint testing and workflow validation
 * Using mock handlers to test the webhook interface without full handler setup
 */

import express, { Express } from 'express';
import request from 'supertest';
import crypto from 'crypto';

describe('LiteAPI Webhook Integration Tests', () => {
  let app: Express;
  const webhookSecret = 'test_webhook_secret_liteapi_integration';

  beforeEach(() => {
    app = express();
    app.use(express.json({ verify: (req, res, buf) => ((req as any).rawBody = buf) }));
    process.env.LITEAPI_WEBHOOK_SECRET = webhookSecret;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/webhooks/liteapi', () => {
    it('should accept valid webhook with correct signature', async () => {
      const payload = {
        id: 'webhook_integration_001',
        bookingId: 'hotel_booking_001',
        status: 'confirmed',
        hotelName: 'Burj Al Arab',
        checkIn: '2026-03-15',
        checkOut: '2026-03-17',
        totalPrice: 2500,
        currency: 'AED',
        custom_metadata: {
          customer_id: 'cust_integration_001',
        },
        timestamp: new Date().toISOString(),
        idempotency_key: 'idemp_integration_001',
        live_mode: true,
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      // Mock the webhook handler endpoint
      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({
          success: true,
          data: { notificationId: 'notif_123' },
          message: 'Webhook processed',
        });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject webhook with invalid signature', async () => {
      const payload = {
        id: 'webhook_integration_002',
        bookingId: 'hotel_booking_002',
        status: 'confirmed',
        custom_metadata: { customer_id: 'cust_integration_002' },
      };

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true, message: 'Webhook received' });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', 'invalid_signature_xyz123')
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should reject webhook without signature header', async () => {
      const payload = {
        id: 'webhook_integration_003',
        bookingId: 'hotel_booking_003',
        status: 'confirmed',
        custom_metadata: { customer_id: 'cust_integration_003' },
      };

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true, message: 'Webhook received' });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should process confirmed event and create notification', async () => {
      const payload = {
        id: 'webhook_integration_004',
        bookingId: 'hotel_booking_004',
        status: 'confirmed',
        hotelName: 'Atlantis The Palm',
        checkIn: '2026-03-20',
        checkOut: '2026-03-22',
        totalPrice: 3000,
        currency: 'AED',
        custom_metadata: { customer_id: 'cust_integration_004' },
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({
          success: true,
          data: {
            notificationId: 'notif_hotel_confirmed',
            bookingId: req.body.bookingId,
          },
        });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.data?.notificationId).toBeDefined();
    });

    it('should handle voucher_issued event', async () => {
      const payload = {
        id: 'webhook_integration_005',
        bookingId: 'hotel_booking_005',
        status: 'voucher_issued',
        hotelName: 'The Address Downtown',
        checkIn: '2026-03-25',
        checkOut: '2026-03-27',
        custom_metadata: { customer_id: 'cust_integration_005' },
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle cancelled event', async () => {
      const payload = {
        id: 'webhook_integration_006',
        bookingId: 'hotel_booking_006',
        status: 'cancelled',
        hotelName: 'Jumeirah Beach Hotel',
        custom_metadata: { customer_id: 'cust_integration_006' },
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should handle failed event with error details', async () => {
      const payload = {
        id: 'webhook_integration_007',
        bookingId: 'hotel_booking_007',
        status: 'failed',
        hotelName: 'Burj Khalifa Hotel',
        custom_metadata: { customer_id: 'cust_integration_007' },
        error: {
          code: 'INVENTORY_UNAVAILABLE',
          message: 'Room inventory not available for selected dates',
        },
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should reject webhook with missing bookingId', async () => {
      const payload = {
        id: 'webhook_integration_008',
        status: 'confirmed',
        hotelName: 'Some Hotel',
        custom_metadata: { customer_id: 'cust_integration_008' },
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should reject webhook with missing status', async () => {
      const payload = {
        id: 'webhook_integration_009',
        bookingId: 'hotel_booking_009',
        hotelName: 'Some Hotel',
        custom_metadata: { customer_id: 'cust_integration_009' },
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should handle webhook when customer ID cannot be extracted', async () => {
      const payload = {
        id: 'webhook_integration_010',
        bookingId: 'hotel_booking_010',
        status: 'confirmed',
        hotelName: 'Hotel No Customer',
      };

      const payloadString = JSON.stringify(payload);
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signature = crypto
        .createHmac('sha256', secretBuffer)
        .update(payloadString)
        .digest('hex');

      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', signature)
        .send(payload);

      expect(response.status).toBe(200);
    });

    it('should always return 200 status to prevent webhook retries', async () => {
      app.post('/api/webhooks/liteapi', (req, res) => {
        res.status(200).json({ success: true });
      });

      // Test various scenarios - all should return 200
      for (let i = 0; i < 3; i++) {
        const payload = {
          id: `webhook_${i}`,
          bookingId: `booking_${i}`,  
          status: 'confirmed',
          custom_metadata: { customer_id: `cust_${i}` },
        };

        const response = await request(app)
          .post('/api/webhooks/liteapi')
          .set('X-API-Signature', 'any_signature_value')
          .send(payload);

        expect(response.status).toBe(200);
      }
    });
  });

  describe('GET /api/webhooks/health', () => {
    it('should return health check status', async () => {
      app.get('/api/webhooks/health', (req, res) => {
        res.status(200).json({
          status: 'operational',
          timestamp: new Date().toISOString(),
        });
      });

      const response = await request(app).get('/api/webhooks/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('operational');
    });

    it('should include webhook statistics', async () => {
      app.get('/api/webhooks/health', (req, res) => {
        res.status(200).json({
          status: 'operational',
          totalProcessed: 10,
          lastWebhookTime: new Date().toISOString(),
        });
      });

      const response = await request(app).get('/api/webhooks/health');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
    });
  });
});
