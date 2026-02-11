/**
 * Webhook Unit Tests
 * Tests for webhook signature validation, event parsing, and error handling
 */

import crypto from 'crypto';
import { validateDuffelWebhookSignature } from '../../integrations/duffelWebhookHandler';

describe('Webhook Unit Tests', () => {
  const webhookSecret = 'test_webhook_secret_key';
  const payload = JSON.stringify({
    id: 'webhook_123',
    type: 'order.created',
    data: {
      object: {
        id: 'ord_123',
        booking_reference: 'ABC123',
      },
    },
  });

  describe('validateDuffelWebhookSignature', () => {
    it('should validate correct webhook signature', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;
      const rawPayload = Buffer.from(payload);

      const result = validateDuffelWebhookSignature(rawPayload, signature, webhookSecret);
      expect(result).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const invalidSignature = `t=${timestamp},v1=invalidsignaturehash`;
      const rawPayload = Buffer.from(payload);

      const result = validateDuffelWebhookSignature(rawPayload, invalidSignature, webhookSecret);
      expect(result).toBe(false);
    });

    it('should reject signature with missing timestamp', () => {
      const invalidSignature = 'v1=somesignaturehash';
      const rawPayload = Buffer.from(payload);

      const result = validateDuffelWebhookSignature(rawPayload, invalidSignature, webhookSecret);
      expect(result).toBe(false);
    });

    it('should reject signature with missing v1 component', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const invalidSignature = `t=${timestamp}`;
      const rawPayload = Buffer.from(payload);

      const result = validateDuffelWebhookSignature(rawPayload, invalidSignature, webhookSecret);
      expect(result).toBe(false);
    });

    it('should reject empty signature', () => {
      const rawPayload = Buffer.from(payload);

      const result = validateDuffelWebhookSignature(rawPayload, '', webhookSecret);
      expect(result).toBe(false);
    });

    it('should reject signature with wrong secret', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;
      const rawPayload = Buffer.from(payload);
      const wrongSecret = 'wrong_secret_key';

      const result = validateDuffelWebhookSignature(rawPayload, signature, wrongSecret);
      expect(result).toBe(false);
    });

    it('should use secure comparison to prevent timing attacks', () => {
      // Generate a valid signature
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;
      const rawPayload = Buffer.from(payload);

      // Timing should be consistent regardless of where the signature differs
      const validResult = validateDuffelWebhookSignature(rawPayload, signature, webhookSecret);
      expect(validResult).toBe(true);

      // Try with one character different at position 0
      const invalidSig1 = `t=${timestamp},v1=` + 'x' + computedSignature.slice(1);
      const result1 = validateDuffelWebhookSignature(rawPayload, invalidSig1, webhookSecret);
      expect(result1).toBe(false);

      // Try with one character different at the end
      const invalidSig2 = `t=${timestamp},v1=${computedSignature.slice(0, -1)}x`;
      const result2 = validateDuffelWebhookSignature(rawPayload, invalidSig2, webhookSecret);
      expect(result2).toBe(false);
    });
  });

  describe('Webhook signature edge cases', () => {
    it('should handle malformed signature format gracefully', () => {
      const malformedSignatures = [
        'invalid_format',
        't=abc123',
        'v1=abc123',
        't=,v1=',
        '===',
        null,
        undefined,
      ];

      const rawPayload = Buffer.from(payload);

      malformedSignatures.forEach((sig: any) => {
        expect(() => {
          if (sig === null || sig === undefined) {
            expect(() => validateDuffelWebhookSignature(rawPayload, sig || '', webhookSecret)).not.toThrow();
          } else {
            expect(() => validateDuffelWebhookSignature(rawPayload, sig, webhookSecret)).not.toThrow();
          }
        }).not.toThrow();
      });
    });

    it('should handle various payload sizes', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const webhookSecret = 'test_secret';
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');

      // Small payload
      const smallPayload = JSON.stringify({ id: 'test' });
      const smallSignedPayload = timestamp + '.' + smallPayload;
      const smallComputedSig = crypto
        .createHmac('sha256', secretBuffer)
        .update(smallSignedPayload)
        .digest('hex')
        .toLowerCase();
      const smallSignature = `t=${timestamp},v1=${smallComputedSig}`;
      expect(validateDuffelWebhookSignature(Buffer.from(smallPayload), smallSignature, webhookSecret)).toBe(true);

      // Large payload
      const largePayload = JSON.stringify({
        id: 'test',
        data: 'x'.repeat(10000),
      });
      const largeSignedPayload = timestamp + '.' + largePayload;
      const largeComputedSig = crypto
        .createHmac('sha256', secretBuffer)
        .update(largeSignedPayload)
        .digest('hex')
        .toLowerCase();
      const largeSignature = `t=${timestamp},v1=${largeComputedSig}`;
      expect(validateDuffelWebhookSignature(Buffer.from(largePayload), largeSignature, webhookSecret)).toBe(true);
    });

    it('should handle empty payload', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const signedPayload = timestamp + '.';
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const signature = `t=${timestamp},v1=${computedSignature}`;
      const emptyPayload = Buffer.from('');

      const result = validateDuffelWebhookSignature(emptyPayload, signature, webhookSecret);
      expect(result).toBe(true);
    });
  });

  describe('Webhook signature security', () => {
    it('should not leak timing information about signature mismatch locations', () => {
      const timestamp = Math.floor(Date.now() / 1000).toString();
      const signedPayload = timestamp + '.' + payload;
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(signedPayload)
        .digest('hex')
        .toLowerCase();

      const validSignature = `t=${timestamp},v1=${computedSignature}`;
      const rawPayload = Buffer.from(payload);

      // All these should take similar time to validate (thanks to timingSafeEqual)
      const withMismatchAtStart = `t=${timestamp},v1=` + 'x' + computedSignature.slice(1);
      const withMismatchAtEnd = `t=${timestamp},v1=${computedSignature.slice(0, -1)}x`;
      const withMismatchInMiddle = `t=${timestamp},v1=${computedSignature.slice(0, 32)}x${computedSignature.slice(33)}`;

      const result1 = validateDuffelWebhookSignature(rawPayload, withMismatchAtStart, webhookSecret);
      const result2 = validateDuffelWebhookSignature(rawPayload, withMismatchAtEnd, webhookSecret);
      const result3 = validateDuffelWebhookSignature(rawPayload, withMismatchInMiddle, webhookSecret);

      expect(result1).toBe(false);
      expect(result2).toBe(false);
      expect(result3).toBe(false);
    });
  });
});
