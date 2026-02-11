/**
 * Webhook Routes
 * Receives incoming webhooks from external suppliers (Duffel, LiteAPI)
 * Routes are public and do not require authentication
 * All security is handled via webhook signature validation
 * 
 * IMPORTANT: Raw body capture happens in app.ts via express.raw() middleware
 * mounted BEFORE express.json() for the /api/webhooks path. This ensures
 * the raw bytes are available to rawBodyMiddleware for signature validation.
 */

import express, { Router } from 'express';
import { handleDuffelWebhook, handleLiteAPIWebhook, webhookHealthCheck, testWebhookHandler, handleAPIManagerEvent, handleSupplierOnboardingEvent, handleCustomerOnboardingEvent } from '../api/webhookController';
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
  rawBodyMiddleware, // Captures raw body (available via express.raw) and parses JSON
  handleDuffelWebhook // Handler uses req.rawBody for signature validation after middleware
);

// ============================================================================
// LiteAPI Webhook Routes (Public - No Authentication Required)
// ============================================================================

/**
 * POST /api/webhooks/liteapi
 * Main webhook endpoint for LiteAPI (hotel provider) events
 * Accepts: confirmed, voucher_issued, cancelled, failed
 * Signature validation required via X-API-Signature header
 * Routes events to centralized notification management module
 */
router.post(
  '/liteapi',
  rawBodyMiddleware, // Captures raw body (available via express.raw) and parses JSON
  handleLiteAPIWebhook // Handler uses req.rawBody for signature validation after middleware
);

// ============================================================================
// API Manager Event Routes (Internal - Receives Rate Limits, Quota, Key Events)
// ============================================================================

/**
 * POST /api/webhooks/api-manager
 * Webhook endpoint for API manager events (rate limits, quota, key expiration, health checks)
 * Receives: rate_limit_warning, quota_exceeded, api_key_expiring, api_key_expired,
 *           api_health_check_failed, rate_limit_reset, quota_limit_increased
 * Dispatches admin notifications via email, SMS, and in-app channels
 * No signature validation required (internal event source)
 */
router.post('/api-manager', express.json(), handleAPIManagerEvent);

// ============================================================================
// Supplier Onboarding Event Routes (Internal - Supplier Lifecycle Events)
// ============================================================================

/**
 * POST /api/webhooks/supplier-onboarding
 * Webhook endpoint for supplier lifecycle events (registration, wallet assignment, wallet activation)
 * Receives: supplier_registered, wallet_assigned, wallet_activated
 * Dispatches admin and supplier notifications via email, SMS, and in-app channels
 * No signature validation required (internal event source)
 */
router.post('/supplier-onboarding', express.json(), handleSupplierOnboardingEvent);

// ============================================================================
// Customer Onboarding Event Routes (Internal - Customer Lifecycle Events)
// ============================================================================

/**
 * POST /api/webhooks/customer-onboarding
 * Webhook endpoint for customer lifecycle events (registration, profile completion, verification, payment)
 * Receives: customer_registered, profile_completed, account_verified, payment_method_added
 * Dispatches admin and customer notifications via email, SMS, and in-app channels
 * No signature validation required (internal event source)
 */
router.post('/customer-onboarding', express.json(), handleCustomerOnboardingEvent);

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
