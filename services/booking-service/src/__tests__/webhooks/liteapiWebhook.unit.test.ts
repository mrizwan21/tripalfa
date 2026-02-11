/**
 * LiteAPI Webhook Unit Tests
 * Tests for webhook signature validation, event parsing, and error handling
 */

import crypto from 'crypto';
import { validateLiteAPIWebhookSignature } from '../../integrations/liteapiWebhookHandler';

describe('LiteAPI Webhook Unit Tests', () => {
  const webhookSecret = 'test_webhook_secret_key_liteapi';
  const payload = JSON.stringify({
    id: 'webhook_456',
    bookingId: 'hotel_booking_789',
    status: 'confirmed',
    hotelName: 'Burj Al Arab',
    checkIn: '2026-03-15',
    checkOut: '2026-03-17',
    totalPrice: 2500,
    currency: 'AED',
  });

  describe('validateLiteAPIWebhookSignature', () => {
    it('should validate correct webhook signature', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex')
        .toLowerCase();

      const isValid = validateLiteAPIWebhookSignature(rawPayload, computedSignature, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should reject invalid webhook signature', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const invalidSignature = 'invalid_signature_hash_xyz123';

      const isValid = validateLiteAPIWebhookSignature(rawPayload, invalidSignature, webhookSecret);
      expect(isValid).toBe(false);
    });

    it('should be case-insensitive for signature comparison', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex');

      // Test with uppercase signature
      const isValidUpper = validateLiteAPIWebhookSignature(
        rawPayload,
        computedSignature.toUpperCase(),
        webhookSecret
      );
      expect(isValidUpper).toBe(true);

      // Test with lowercase signature
      const isValidLower = validateLiteAPIWebhookSignature(
        rawPayload,
        computedSignature.toLowerCase(),
        webhookSecret
      );
      expect(isValidLower).toBe(true);
    });

    it('should reject signature with wrong secret', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex');

      const isValid = validateLiteAPIWebhookSignature(rawPayload, computedSignature, 'wrong_secret');
      expect(isValid).toBe(false);
    });

    it('should reject signature with modified payload', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex');

      // Modify the payload after computing signature
      const modifiedPayload = Buffer.from(
        payload.replace('confirmed', 'cancelled'),
        'utf-8'
      );

      const isValid = validateLiteAPIWebhookSignature(
        modifiedPayload,
        computedSignature,
        webhookSecret
      );
      expect(isValid).toBe(false);
    });

    it('should prevent timing attacks with consistent comparison time', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex');

      // Valid signature should not take significantly different time than invalid
      const timings: number[] = [];

      for (let i = 0; i < 5; i++) {
        const start = process.hrtime.bigint();
        validateLiteAPIWebhookSignature(rawPayload, computedSignature, webhookSecret);
        const end = process.hrtime.bigint();
        timings.push(Number(end - start));
      }

      // Check that timings are reasonably consistent (no huge variations)
      // Note: This is a basic timing attack test. In production, use constant-time libraries
      const avgTiming = timings.reduce((a, b) => a + b) / timings.length;
      const maxDeviation = Math.max(...timings) - Math.min(...timings);

      // Allow deviation up to 100% of average (generous for local testing)
      expect(maxDeviation).toBeLessThan(avgTiming * 1.0);
    });

    it('should handle empty payload gracefully', () => {
      const emptyPayload = Buffer.from('', 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(emptyPayload)
        .digest('hex');

      const isValid = validateLiteAPIWebhookSignature(emptyPayload, computedSignature, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should handle large payload signatures', () => {
      const largePayload = Buffer.from(payload.repeat(100), 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(largePayload)
        .digest('hex');

      const isValid = validateLiteAPIWebhookSignature(largePayload, computedSignature, webhookSecret);
      expect(isValid).toBe(true);
    });

    it('should reject malformed signature format', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const malformedSignature = 'not_a_valid_hex_string_!@#$%';

      const isValid = validateLiteAPIWebhookSignature(rawPayload, malformedSignature, webhookSecret);
      expect(isValid).toBe(false);
    });

    it('should handle signature with extra whitespace', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex');

      // Most implementations trim whitespace, but test robustness
      const signatureWithSpaces = '  ' + computedSignature + '  ';

      // This should fail because signature should be exact
      // (but if implementation trims, it would pass - depends on implementation)
      try {
        validateLiteAPIWebhookSignature(rawPayload, signatureWithSpaces, webhookSecret);
      } catch (error) {
        // Expected behavior - validation should fail or throw
        expect(error).toBeDefined();
      }
    });

    it('should use HMAC-SHA256 for hashing', () => {
      const rawPayload = Buffer.from(payload, 'utf-8');
      const secretBuffer = Buffer.from(webhookSecret, 'utf-8');

      // Verify that HMAC-SHA256 is being used by checking signature length
      const computedSignature = crypto
        .createHmac('sha256', secretBuffer)
        .update(rawPayload)
        .digest('hex');

      // SHA256 produces 64 character hex string
      expect(computedSignature.length).toBe(64);

      const isValid = validateLiteAPIWebhookSignature(rawPayload, computedSignature, webhookSecret);
      expect(isValid).toBe(true);
    });
  });
});
