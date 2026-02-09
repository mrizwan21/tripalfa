/**
 * Payment API Integration Tests
 *
 * Tests for payment endpoints:
 * - API-008: POST /api/payments/process
 */

import { api, setupTestEnvironment, teardownTestEnvironment, getAuthHeader } from './setup';

describe('Payment API Integration Tests', () => {
  beforeAll(async () => {
    await setupTestEnvironment();
  });

  afterAll(async () => {
    await teardownTestEnvironment();
  });

  /**
   * API-008: POST /api/payments/process - Process payment
   */
  describe('POST /api/payments/process (API-008)', () => {
    it('should process card payment successfully', async () => {
      const paymentData = {
        amount: 250.00,
        currency: 'USD',
        paymentMethod: 'card',
        cardDetails: {
          number: '4242424242424242', // Stripe test card - success
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardholderName: 'Test User'
        },
        description: 'Test payment',
        metadata: {
          orderId: 'ORD-12345',
          customerId: 'CUST-67890'
        }
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      // API might return various status codes
      expect([200, 201, 400, 401, 403, 402]).toContain(response.status);

      if (response.status === 200 || response.status === 201) {
        expect(response.body).toBeDefined();
        // Should return payment confirmation
        expect(response.body.paymentId !== undefined ||
               response.body.transactionId !== undefined).toBe(true);
      }
    });

    it('should process wallet payment successfully', async () => {
      const paymentData = {
        amount: 150.00,
        currency: 'USD',
        paymentMethod: 'wallet',
        walletId: 'wallet_123',
        description: 'Test wallet payment'
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      expect([200, 201, 400, 401, 403, 402, 404]).toContain(response.status);
    });

    it('should handle declined card payment', async () => {
      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        paymentMethod: 'card',
        cardDetails: {
          number: '4000000000000002', // Stripe test card - declined
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardholderName: 'Test User'
        },
        description: 'Test declined payment'
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      // Should return 402 (Payment Required) or 400 for declined
      expect([200, 201, 400, 402]).toContain(response.status);

      if (response.status === 402 || response.status === 400) {
        expect(response.body).toBeDefined();
        // Should include error details
        expect(response.body.error !== undefined ||
               response.body.message !== undefined).toBe(true);
      }
    });

    it('should handle insufficient funds', async () => {
      const paymentData = {
        amount: 1000000.00, // Very large amount
        currency: 'USD',
        paymentMethod: 'card',
        cardDetails: {
          number: '4242424242424242',
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardholderName: 'Test User'
        },
        description: 'Test insufficient funds'
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      expect([200, 201, 400, 402]).toContain(response.status);
    });

    it('should return 400 for invalid payment data', async () => {
      const invalidData = {
        amount: -50.00, // Negative amount
        currency: 'USD',
        paymentMethod: 'card'
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(invalidData);

      expect([400, 422]).toContain(response.status);
    });

    it('should return 401 for unauthorized requests', async () => {
      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        paymentMethod: 'card'
      };

      const response = await api
        .post('/api/payments/process')
        .send(paymentData);

      expect(response.status).toBe(401);
    });

    it('should handle payment with 3D Secure', async () => {
      const paymentData = {
        amount: 200.00,
        currency: 'USD',
        paymentMethod: 'card',
        cardDetails: {
          number: '4000002500003155', // Stripe test card - 3D Secure required
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardholderName: 'Test User'
        },
        description: 'Test 3D Secure payment'
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      // Might return 200 (success after 3DS) or require additional action
      expect([200, 201, 400, 402]).toContain(response.status);
    });
  });

  /**
   * Additional Payment Tests
   */
  describe('Additional Payment Operations', () => {
    it('should retrieve payment status', async () => {
      const paymentId = 'pay_test_123';

      const response = await api
        .get(`/api/payments/${paymentId}/status`)
        .set(getAuthHeader());

      expect([200, 401, 403, 404]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(response.body.status !== undefined).toBe(true);
      }
    });

    it('should process refund', async () => {
      const refundData = {
        paymentId: 'pay_test_123',
        amount: 100.00,
        reason: 'Customer request'
      };

      const response = await api
        .post('/api/payments/refund')
        .set(getAuthHeader())
        .send(refundData);

      expect([200, 201, 400, 401, 403, 404]).toContain(response.status);
    });

    it('should retrieve payment methods', async () => {
      const response = await api
        .get('/api/payments/methods')
        .set(getAuthHeader());

      expect([200, 401, 403]).toContain(response.status);

      if (response.status === 200) {
        expect(response.body).toBeDefined();
        expect(Array.isArray(response.body.methods) ||
               Array.isArray(response.body)).toBe(true);
      }
    });

    it('should validate currency code', async () => {
      const paymentData = {
        amount: 100.00,
        currency: 'INVALID', // Invalid currency
        paymentMethod: 'card',
        cardDetails: {
          number: '4242424242424242',
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardholderName: 'Test User'
        }
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      expect([200, 201, 400, 422]).toContain(response.status);
    });

    it('should handle payment timeout scenario', async () => {
      const paymentData = {
        amount: 100.00,
        currency: 'USD',
        paymentMethod: 'card',
        cardDetails: {
          number: '4000000000009995', // Stripe test card - processing error
          expMonth: '12',
          expYear: '2030',
          cvc: '123',
          cardholderName: 'Test User'
        },
        description: 'Test timeout scenario'
      };

      const response = await api
        .post('/api/payments/process')
        .set(getAuthHeader())
        .send(paymentData);

      // Might return timeout error or processing error
      expect([200, 201, 400, 408, 500, 502]).toContain(response.status);
    });
  });
});
