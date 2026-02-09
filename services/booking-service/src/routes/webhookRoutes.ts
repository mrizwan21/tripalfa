/**
 * Webhook Routes
 * Receives incoming webhooks from external suppliers (Duffel)
 * Routes are public and do not require authentication
 * All security is handled via webhook signature validation
 */

import express, { Router } from 'express';
import { handleDuffelWebhook, webhookHealthCheck, testWebhookHandler } from '../api/webhookController';
import { getAvailableEmailTemplates, sendTestBookingEmail } from '../api/emailTemplateTestController';
import { rawBodyMiddleware } from '../middleware/rawBodyMiddleware';

const router: Router = Router();

// ============================================================================
// Duffel Webhook Routes (Public - No Authentication Required)
// ============================================================================

/**
 * POST /api/webhooks/duffel
 * Main webhook endpoint for Duffel supplier events
 * Accepts: order.created, order.updated, order.airline_initiated_change_detected, etc.
 * Signature validation required via X-Duffel-Signature header
 * Routes events to centralized notification management module
 */
router.post(
  '/duffel',
  rawBodyMiddleware, // Required to validate webhook signature on raw payload
  handleDuffelWebhook
);

/**
 * GET /api/webhooks/health
 * Health check endpoint for webhook receiver
 * Returns operational status and webhook statistics
 */
router.get('/health', webhookHealthCheck);

/**
 * POST /api/webhooks/test
 * Test endpoint for webhook delivery testing
 * Does not require signature validation
 * Use this to test webhook delivery from local environment
 */
router.post('/test', testWebhookHandler);

// ============================================================================
// Email Template Test Routes (For Development and Testing)
// ============================================================================

/**
 * GET /api/webhooks/email-templates
 * Get available email template styles
 * Returns list of all available template options
 */
router.get('/email-templates', getAvailableEmailTemplates);

/**
 * POST /api/webhooks/email-templates/send-test
 * Send test booking confirmation email
 * Allows testing different email template styles
 * Body: { templateStyle, toEmail, testOrderData? }
 */
router.post('/email-templates/send-test', sendTestBookingEmail);

export default router;
