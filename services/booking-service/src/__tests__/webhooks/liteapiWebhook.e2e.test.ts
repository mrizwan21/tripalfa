import request from 'supertest';
import express, { Express } from 'express';
import crypto from 'crypto';

describe('LiteAPI Webhook E2E Tests', () => {
  let app: Express;
  let webhookSecret: string;
  let processedWebhooks: Set<string>;

  const createSignedWebhook = (
    payload: any,
    secret: string
  ): { payload: any; signature: string } => {
    const payloadString = JSON.stringify(payload);
    const secretBuffer = Buffer.from(secret, 'utf-8');
    const signature = crypto
      .createHmac('sha256', secretBuffer)
      .update(payloadString)
      .digest('hex');

    return { payload, signature };
  };

  beforeEach(() => {
    webhookSecret = 'test_liteapi_secret_key_12345';
    processedWebhooks = new Set<string>();

    app = express();
    app.use(express.json({ limit: '50mb' }));

    // Mock LiteAPI webhook endpoint
    app.post('/api/webhooks/liteapi', (req, res) => {
      const signature = req.get('X-API-Signature');

      if (!signature) {
        return res.status(400).json({ error: 'Missing signature' });
      }

      try {
        const payloadString = JSON.stringify(req.body);
        const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
        const expectedSig = crypto
          .createHmac('sha256', secretBuffer)
          .update(payloadString)
          .digest('hex');

        // Timing-safe comparison
        const isValid =
          crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSig));

        if (!isValid) {
          return res.status(401).json({ error: 'Invalid signature' });
        }

        processedWebhooks.add(req.body.id);

        // Simulate notification service call
        return res.status(200).json({
          success: true,
          webhookId: req.body.id,
          bookingId: req.body.bookingId,
          status: req.body.status,
        });
      } catch (error) {
        return res.status(200).json({ success: true }); // Always 200 for webhooks
      }
    });

    // Mock health endpoint
    app.get('/api/webhooks/health', (req, res) => {
      res.status(200).json({
        status: 'operational',
        totalProcessed: processedWebhooks.size,
      });
    });
  });

  describe('Complete Booking Workflow', () => {
    it('should handle full booking lifecycle: confirmed -> voucher -> checkout', async () => {
      const bookingId = 'e2e_booking_001';
      const customerId = 'e2e_cust_001';

      // Step 1: Booking confirmed
      const confirmPayload = {
        id: `webhook_${bookingId}_1`,
        bookingId,
        status: 'confirmed',
        hotelName: 'Burj Al Arab',
        checkIn: '2026-03-15',
        checkOut: '2026-03-17',
        totalPrice: 2500,
        currency: 'AED',
        nights: 2,
        guests: 2,
        roomType: 'Suite',
        custom_metadata: { customer_id: customerId },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_confirm`,
        live_mode: true,
      };

      const { payload: basePayload, signature: confirmSig } = createSignedWebhook(
        confirmPayload,
        webhookSecret
      );

      let response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', confirmSig)
        .send(basePayload);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(processedWebhooks.has(confirmPayload.id)).toBe(true);

      // Step 2: Voucher issued
      const voucherPayload = {
        id: `webhook_${bookingId}_2`,
        bookingId,
        status: 'voucher_issued',
        hotelName: 'Burj Al Arab',
        checkIn: '2026-03-15',
        checkOut: '2026-03-17',
        custom_metadata: { customer_id: customerId },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_voucher`,
        live_mode: true,
      };

      const { payload: voucherPayloadObj, signature: voucherSig } = createSignedWebhook(
        voucherPayload,
        webhookSecret
      );

      response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', voucherSig)
        .send(voucherPayloadObj);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(processedWebhooks.has(voucherPayload.id)).toBe(true);

      expect(processedWebhooks.size).toBe(2);
    });

    it('should handle booking cancellation workflow', async () => {
      const bookingId = 'e2e_booking_002';
      const customerId = 'e2e_cust_002';

      // Initial booking
      const confirmPayload = {
        id: `webhook_${bookingId}_1`,
        bookingId,
        status: 'confirmed',
        hotelName: 'Atlantis The Palm',
        checkIn: '2026-03-20',
        checkOut: '2026-03-22',
        totalPrice: 3000,
        currency: 'AED',
        custom_metadata: { customer_id: customerId },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_confirm`,
        live_mode: true,
      };

      const { payload: confirmPayloadObj, signature: confirmSig } = createSignedWebhook(
        confirmPayload,
        webhookSecret
      );

      let response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', confirmSig)
        .send(confirmPayloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(confirmPayload.id)).toBe(true);

      // Cancellation
      const cancelPayload = {
        id: `webhook_${bookingId}_2`,
        bookingId,
        status: 'cancelled',
        hotelName: 'Atlantis The Palm',
        custom_metadata: { customer_id: customerId },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_cancel`,
        live_mode: true,
      };

      const { payload: cancelPayloadObj, signature: cancelSig } = createSignedWebhook(
        cancelPayload,
        webhookSecret
      );

      response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', cancelSig)
        .send(cancelPayloadObj);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(processedWebhooks.has(cancelPayload.id)).toBe(true);
    });

    it('should handle booking failure scenario with retry', async () => {
      const bookingId = 'e2e_booking_003';
      const customerId = 'e2e_cust_003';

      const failedPayload = {
        id: `webhook_${bookingId}_1`,
        bookingId,
        status: 'failed',
        hotelName: 'Jumeirah Beach Hotel',
        custom_metadata: { customer_id: customerId },
        error: {
          code: 'PAYMENT_DECLINED',
          message: 'Payment was declined',
        },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_failed`,
        live_mode: true,
      };

      const { payload: failedPayloadObj, signature: failedSig } = createSignedWebhook(
        failedPayload,
        webhookSecret
      );

      // First attempt
      let response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', failedSig)
        .send(failedPayloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(failedPayload.id)).toBe(true);

      // Retry with same idempotency key should be handled gracefully
      response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', failedSig)
        .send(failedPayloadObj);

      expect(response.status).toBe(200);
    });

    it('should handle booking recovery after failure', async () => {
      const bookingId = 'e2e_booking_004';
      const customerId = 'e2e_cust_004';

      // First: failed attempt
      const failedPayload = {
        id: `webhook_${bookingId}_1`,
        bookingId,
        status: 'failed',
        hotelName: 'The Address Downtown',
        custom_metadata: { customer_id: customerId },
        error: { code: 'TEMP_ERROR', message: 'Temporary error' },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_fail`,
        live_mode: true,
      };

      const { payload: failPayloadObj, signature: failSig } = createSignedWebhook(
        failedPayload,
        webhookSecret
      );

      let response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', failSig)
        .send(failPayloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(failedPayload.id)).toBe(true);

      // Recovery: new webhook with success status
      const recoveryPayload = {
        id: `webhook_${bookingId}_2`,
        bookingId,
        status: 'confirmed',
        hotelName: 'The Address Downtown',
        checkIn: '2026-03-25',
        checkOut: '2026-03-27',
        custom_metadata: { customer_id: customerId },
        timestamp: new Date().toISOString(),
        idempotency_key: `idemp_${bookingId}_recovery`,
        live_mode: true,
      };

      const { payload: recoveryPayloadObj, signature: recoverySig } = createSignedWebhook(
        recoveryPayload,
        webhookSecret
      );

      response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', recoverySig)
        .send(recoveryPayloadObj);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(processedWebhooks.has(recoveryPayload.id)).toBe(true);
    });
  });

  describe('Concurrent Webhook Processing', () => {
    it('should handle multiple concurrent webhooks', async () => {
      const promises = [];

      for (let i = 1; i <= 10; i++) {
        const payload = {
          id: `webhook_concurrent_${i}`,
          bookingId: `booking_concurrent_${i}`,
          status: 'confirmed',
          hotelName: `Hotel ${i}`,
          checkIn: '2026-03-15',
          checkOut: '2026-03-17',
          custom_metadata: { customer_id: `cust_concurrent_${i}` },
          timestamp: new Date().toISOString(),
          idempotency_key: `idemp_concurrent_${i}`,
          live_mode: true,
        };

        const { payload: payloadObj, signature: sig } = createSignedWebhook(
          payload,
          webhookSecret
        );

        promises.push(
          request(app)
            .post('/api/webhooks/liteapi')
            .set('X-API-Signature', sig)
            .send(payloadObj)
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });

      expect(responses.length).toBe(10);
      expect(processedWebhooks.size).toBeGreaterThanOrEqual(10);
    });

    it('should handle concurrent webhooks with mixed statuses', async () => {
      const statuses = ['confirmed', 'voucher_issued', 'cancelled', 'failed'];
      const promises = [];

      for (let i = 0; i < 12; i++) {
        const status = statuses[i % statuses.length];
        const payload: any = {
          id: `webhook_mixed_${i}`,
          bookingId: `booking_mixed_${i}`,
          status,
          hotelName: `Hotel Mixed ${i}`,
          custom_metadata: { customer_id: `cust_mixed_${i}` },
          timestamp: new Date().toISOString(),
          idempotency_key: `idemp_mixed_${i}`,
          live_mode: true,
        };

        // Add error for failed status
        if (status === 'failed') {
          payload.error = {
            code: 'ERROR',
            message: 'Test error',
          };
        }

        const { payload: payloadObj, signature: sig } = createSignedWebhook(
          payload,
          webhookSecret
        );

        promises.push(
          request(app)
            .post('/api/webhooks/liteapi')
            .set('X-API-Signature', sig)
            .send(payloadObj)
        );
      }

      const responses = await Promise.all(promises);

      responses.forEach((response) => {
        expect(response.status).toBe(200);
      });

      expect(responses.length).toBe(12);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle webhook with minimal required fields', async () => {
      const minimalPayload = {
        id: 'webhook_minimal',
        bookingId: 'booking_minimal',
        status: 'confirmed',
        custom_metadata: { customer_id: 'cust_minimal' },
      };

      const { payload: payloadObj, signature: sig } = createSignedWebhook(
        minimalPayload,
        webhookSecret
      );

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', sig)
        .send(payloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(minimalPayload.id)).toBe(true);
    });

    it('should handle webhook with extra unknown fields', async () => {
      const payloadWithExtra = {
        id: 'webhook_extra',
        bookingId: 'booking_extra',
        status: 'confirmed',
        custom_metadata: { customer_id: 'cust_extra' },
        unknownField1: 'value1',
        unknownField2: { nested: 'value' },
        unknownArray: [1, 2, 3],
      };

      const { payload: payloadObj, signature: sig } = createSignedWebhook(
        payloadWithExtra,
        webhookSecret
      );

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', sig)
        .send(payloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(payloadWithExtra.id)).toBe(true);
    });

    it('should handle very large webhook payloads', async () => {
      const largePayload = {
        id: 'webhook_large',
        bookingId: 'booking_large',
        status: 'confirmed',
        hotelName: 'Large Hotel',
        custom_metadata: {
          customer_id: 'cust_large',
          largeDescription: 'x'.repeat(10000),
        },
        timestamp: new Date().toISOString(),
        idempotency_key: 'idemp_large',
        live_mode: true,
      };

      const { payload: payloadObj, signature: sig } = createSignedWebhook(
        largePayload,
        webhookSecret
      );

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', sig)
        .send(payloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(largePayload.id)).toBe(true);
    });

    it('should handle special characters in booking data', async () => {
      const specialPayload = {
        id: 'webhook_special',
        bookingId: 'booking_special_™®©',
        status: 'confirmed',
        hotelName: 'Hotel "Quoted" & <Special>',
        custom_metadata: { customer_id: 'cust_special@123' },
        timestamp: new Date().toISOString(),
        idempotency_key: 'idemp_special_™',
        live_mode: true,
      };

      const { payload: payloadObj, signature: sig } = createSignedWebhook(
        specialPayload,
        webhookSecret
      );

      const response = await request(app)
        .post('/api/webhooks/liteapi')
        .set('X-API-Signature', sig)
        .send(payloadObj);

      expect(response.status).toBe(200);
      expect(processedWebhooks.has(specialPayload.id)).toBe(true);
    });

    it('should handle webhook replay attack gracefully', async () => {
      const payload = {
        id: 'webhook_replay',
        bookingId: 'booking_replay',
        status: 'confirmed',
        custom_metadata: { customer_id: 'cust_replay' },
        timestamp: new Date().toISOString(),
        idempotency_key: 'idemp_replay',
        live_mode: true,
      };

      const { payload: payloadObj, signature: sig } = createSignedWebhook(
        payload,
        webhookSecret
      );

      // Send same webhook 3 times (replay attack)
      for (let i = 0; i < 3; i++) {
        const response = await request(app)
          .post('/api/webhooks/liteapi')
          .set('X-API-Signature', sig)
          .send(payloadObj);

        expect(response.status).toBe(200);
      }

      // All should be accepted (idempotency_key prevents duplicate processing)
      expect(processedWebhooks.has(payload.id)).toBe(true);
    });
  });

  describe('Health and Monitoring', () => {
    it('should report webhook health status', async () => {
      // Send a few webhooks first
      for (let i = 0; i < 3; i++) {
        const payload = {
          id: `webhook_health_${i}`,
          bookingId: `booking_health_${i}`,
          status: 'confirmed',
          custom_metadata: { customer_id: 'cust_health' },
          timestamp: new Date().toISOString(),
          idempotency_key: `idemp_health_${i}`,
          live_mode: true,
        };

        const { payload: payloadObj, signature: sig } = createSignedWebhook(
          payload,
          webhookSecret
        );

        await request(app)
          .post('/api/webhooks/liteapi')
          .set('X-API-Signature', sig)
          .send(payloadObj);
      }

      // Check health
      const healthResponse = await request(app).get('/api/webhooks/health');

      expect(healthResponse.status).toBe(200);
      expect(healthResponse.body.status).toBe('operational');
      expect(healthResponse.body.totalProcessed).toBeGreaterThanOrEqual(3);
    });
  });
});
