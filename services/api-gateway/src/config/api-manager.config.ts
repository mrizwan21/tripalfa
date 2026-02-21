/**
 * API Manager Configuration
 * Centralized endpoint and service routing configuration for TripAlfa
 * 
 * This configuration manages:
 * - All API endpoints (28 total: 15 Notification + 13 Rule Engine)
 * - Service routing and load balancing
 * - Authentication and authorization
 * - Rate limiting policies
 * - Request/response transformation
 * - Error handling and retry logic
 */

export interface ServiceConfig {
  name: string
  baseUrl: string
  port: number
  timeout: number
  retryPolicy: {
    maxRetries: number
    backoffMs: number
    codes: number[] // HTTP status codes to retry
  }
  rateLimitPolicy: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  healthCheck: {
    enabled: boolean
    interval: number
    endpoint: string
  }
}

export interface EndpointConfig {
  id: string
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT'
  path: string
  serviceId: string
  description: string
  requiresAuth: boolean
  rateLimit: {
    requestsPerMinute: number
    requestsPerHour: number
  }
  timeout: number
}

// ============================================
// SERVICE CONFIGURATIONS
// ============================================

export const SERVICES: Record<string, ServiceConfig> = {
  notificationService: {
    name: 'Notification Service',
    baseUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3005',
    port: parseInt(process.env.NOTIFICATION_SERVICE_PORT || '3005'),
    timeout: 10000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  userService: {
    name: 'User Service',
    baseUrl: process.env.USER_SERVICE_URL || 'http://user-service:3004',
    port: parseInt(process.env.USER_SERVICE_PORT || '3004'),
    timeout: 10000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  organizationService: {
    name: 'Organization Service',
    baseUrl: process.env.ORGANIZATION_SERVICE_URL || 'http://organization-service:3006',
    port: parseInt(process.env.ORGANIZATION_SERVICE_PORT || '3006'),
    timeout: 10000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  bookingService: {
    name: 'Booking Service',
    baseUrl: process.env.BOOKING_SERVICE_URL || 'http://booking-service:3001',
    port: parseInt(process.env.BOOKING_SERVICE_PORT || '3001'),
    timeout: 10000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  paymentService: {
    name: 'Payment Service',
    baseUrl: process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3007',
    port: parseInt(process.env.PAYMENT_SERVICE_PORT || '3007'),
    timeout: 10000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  ruleEngineService: {
    name: 'Rule Engine Service',
    baseUrl: process.env.RULE_ENGINE_SERVICE_URL || 'http://rule-engine-service:3010',
    port: parseInt(process.env.RULE_ENGINE_SERVICE_PORT || '3010'),
    timeout: 10000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  kycService: {
    name: 'KYC Service',
    baseUrl: process.env.KYC_SERVICE_URL || 'http://kyc-service:3011',
    port: parseInt(process.env.KYC_SERVICE_PORT || '3011'),
    timeout: 30000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 50,
      requestsPerHour: 1000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
  marketingService: {
    name: 'Marketing Service',
    baseUrl: process.env.MARKETING_SERVICE_URL || 'http://marketing-service:3012',
    port: parseInt(process.env.MARKETING_SERVICE_PORT || '3012'),
    timeout: 5000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 1000,
      codes: [408, 429, 500, 502, 503, 504],
    },
    rateLimitPolicy: {
      requestsPerMinute: 100,
      requestsPerHour: 5000,
    },
    healthCheck: {
      enabled: true,
      interval: 30000,
      endpoint: '/health',
    },
  },
}

// ============================================
// NOTIFICATION ENDPOINTS (15 Total)
// ============================================

export const NOTIFICATION_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'notification_send',
    method: 'POST',
    path: '/api/notifications/send',
    serviceId: 'notificationService',
    description: 'Send a single notification',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'notification_create_template',
    method: 'POST',
    path: '/api/notifications/templates',
    serviceId: 'notificationService',
    description: 'Create notification template',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_list_templates',
    method: 'GET',
    path: '/api/notifications/templates',
    serviceId: 'notificationService',
    description: 'List notification templates',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'notification_get_template',
    method: 'GET',
    path: '/api/notifications/templates/:id',
    serviceId: 'notificationService',
    description: 'Get template by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'notification_update_template',
    method: 'PATCH',
    path: '/api/notifications/templates/:id',
    serviceId: 'notificationService',
    description: 'Update notification template',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_delete_template',
    method: 'DELETE',
    path: '/api/notifications/templates/:id',
    serviceId: 'notificationService',
    description: 'Delete notification template',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_create_campaign',
    method: 'POST',
    path: '/api/notifications/campaigns',
    serviceId: 'notificationService',
    description: 'Create notification campaign',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 15, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_execute_campaign',
    method: 'POST',
    path: '/api/notifications/campaigns/:id/execute',
    serviceId: 'notificationService',
    description: 'Execute notification campaign',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'notification_pause_campaign',
    method: 'POST',
    path: '/api/notifications/campaigns/:id/pause',
    serviceId: 'notificationService',
    description: 'Pause notification campaign',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_resume_campaign',
    method: 'POST',
    path: '/api/notifications/campaigns/:id/resume',
    serviceId: 'notificationService',
    description: 'Resume notification campaign',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_get_analytics',
    method: 'GET',
    path: '/api/notifications/analytics',
    serviceId: 'notificationService',
    description: 'Get notification analytics',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'notification_get_status',
    method: 'GET',
    path: '/api/notifications/:id/status',
    serviceId: 'notificationService',
    description: 'Get notification delivery status',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'notification_retry',
    method: 'POST',
    path: '/api/notifications/:id/retry',
    serviceId: 'notificationService',
    description: 'Retry failed notification delivery',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'notification_get_campaign',
    method: 'GET',
    path: '/api/notifications/campaigns/:id',
    serviceId: 'notificationService',
    description: 'Get campaign details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'notification_list',
    method: 'GET',
    path: '/api/notifications',
    serviceId: 'notificationService',
    description: 'List notifications',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'notification_amendment_approval',
    method: 'POST',
    path: '/api/notifications/amendment/approval',
    serviceId: 'notificationService',
    description: 'Send flight amendment approval email to traveler',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'notification_amendment_reminder',
    method: 'POST',
    path: '/api/notifications/amendment/reminder',
    serviceId: 'notificationService',
    description: 'Send flight amendment reminder email',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'notification_amendment_confirmation',
    method: 'POST',
    path: '/api/notifications/amendment/confirmation',
    serviceId: 'notificationService',
    description: 'Send flight amendment confirmation email',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
]

// ============================================
// RULE ENGINE ENDPOINTS (13 Total)
// ============================================

export const RULE_ENGINE_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'rule_create',
    method: 'POST',
    path: '/api/rules',
    serviceId: 'ruleEngineService',
    description: 'Create rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'rule_list',
    method: 'GET',
    path: '/api/rules',
    serviceId: 'ruleEngineService',
    description: 'List rules',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'rule_get',
    method: 'GET',
    path: '/api/rules/:id',
    serviceId: 'ruleEngineService',
    description: 'Get rule details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'rule_update',
    method: 'PATCH',
    path: '/api/rules/:id',
    serviceId: 'ruleEngineService',
    description: 'Update rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'rule_delete',
    method: 'DELETE',
    path: '/api/rules/:id',
    serviceId: 'ruleEngineService',
    description: 'Delete rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'rule_execute',
    method: 'POST',
    path: '/api/rules/:id/execute',
    serviceId: 'ruleEngineService',
    description: 'Execute rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 15000,
  },
  {
    id: 'rule_debug',
    method: 'POST',
    path: '/api/rules/:id/debug',
    serviceId: 'ruleEngineService',
    description: 'Debug rule with sample data',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'rule_analyze',
    method: 'GET',
    path: '/api/rules/:id/analyze',
    serviceId: 'ruleEngineService',
    description: 'Analyze rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'rule_check_conflicts',
    method: 'POST',
    path: '/api/rules/:id/conflicts',
    serviceId: 'ruleEngineService',
    description: 'Check for rule conflicts',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'rule_get_executions',
    method: 'GET',
    path: '/api/rules/:id/executions',
    serviceId: 'ruleEngineService',
    description: 'Get rule execution history',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'rule_get_execution',
    method: 'GET',
    path: '/api/executions/:id',
    serviceId: 'ruleEngineService',
    description: 'Get specific execution',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'rule_duplicate',
    method: 'POST',
    path: '/api/rules/:id/duplicate',
    serviceId: 'ruleEngineService',
    description: 'Duplicate rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'rule_get_stats',
    method: 'GET',
    path: '/api/rules/:id/stats',
    serviceId: 'ruleEngineService',
    description: 'Get rule statistics',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
]

// ============================================
// AUDIT ENDPOINTS
// ============================================

export const AUDIT_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'audit_get_logs',
    method: 'GET',
    path: '/api/audit/logs',
    serviceId: 'bookingService',
    description: 'Get audit logs',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'audit_log_action',
    method: 'POST',
    path: '/api/audit/log',
    serviceId: 'bookingService',
    description: 'Log an action',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 2000 },
    timeout: 3000,
  },
  {
    id: 'audit_get_compliance',
    method: 'GET',
    path: '/api/audit/compliance',
    serviceId: 'bookingService',
    description: 'Get compliance report',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
]

// ============================================
// TAX ENDPOINTS
// ============================================

export const TAX_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'tax_calculate',
    method: 'GET',
    path: '/api/tax/calculate',
    serviceId: 'paymentService',
    description: 'Calculate taxes for booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 3000 },
    timeout: 3000,
  },
  {
    id: 'tax_get_rates',
    method: 'GET',
    path: '/api/tax/rates/:country',
    serviceId: 'paymentService',
    description: 'Get tax rates for country',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 3000,
  },
]

// ============================================
// SUPPORT ENDPOINTS
// ============================================

export const SUPPORT_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'support_list_tickets',
    method: 'GET',
    path: '/api/support-tickets',
    serviceId: 'userService',
    description: 'List support tickets',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'support_create_ticket',
    method: 'POST',
    path: '/api/support-tickets',
    serviceId: 'userService',
    description: 'Create support ticket',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
]

// ============================================
// BOOKING ENDPOINTS
// ============================================

export const BOOKING_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'booking_list',
    method: 'GET',
    path: '/api/admin/bookings',
    serviceId: 'bookingService',
    description: 'List all bookings',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'booking_create',
    method: 'POST',
    path: '/api/admin/bookings',
    serviceId: 'bookingService',
    description: 'Create manual booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'booking_get',
    method: 'GET',
    path: '/api/admin/bookings/:id',
    serviceId: 'bookingService',
    description: 'Get booking details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'booking_get_queues',
    method: 'GET',
    path: '/api/admin/bookings/queues',
    serviceId: 'bookingService',
    description: 'List booking queues',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'booking_pricing',
    method: 'POST',
    path: '/api/admin/bookings/:id/pricing',
    serviceId: 'bookingService',
    description: 'Post pricing for booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'booking_invoice',
    method: 'POST',
    path: '/api/admin/bookings/:id/invoice',
    serviceId: 'bookingService',
    description: 'Generate invoice for booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'booking_pay_wallet',
    method: 'POST',
    path: '/api/admin/bookings/:id/pay-wallet',
    serviceId: 'bookingService',
    description: 'Process wallet payment for booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'amendment_get_request',
    method: 'GET',
    path: '/api/admin/bookings/:id/amendment-request',
    serviceId: 'bookingService',
    description: 'Get flight amendment request details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'amendment_search_flights',
    method: 'POST',
    path: '/api/admin/bookings/:id/amendment/search-flights',
    serviceId: 'bookingService',
    description: 'Search alternative flights for amendment',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'amendment_send_approval',
    method: 'POST',
    path: '/api/admin/bookings/:id/amendment/send-user-approval',
    serviceId: 'bookingService',
    description: 'Send flight amendment to traveler for approval',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'amendment_finalize',
    method: 'POST',
    path: '/api/admin/bookings/:id/amendment/finalize',
    serviceId: 'bookingService',
    description: 'Finalize flight amendment after traveler approval',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'amendment_traveler_approve',
    method: 'POST',
    path: '/api/bookings/:id/amendment/approve',
    serviceId: 'bookingService',
    description: 'Traveler approval endpoint - integrated in booking module',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 5, requestsPerHour: 100 },
    timeout: 5000,
  },
]

// ============================================
// KYC ENDPOINTS
// ============================================

export const KYC_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'kyc_status',
    method: 'GET',
    path: '/api/kyc/status/:userId',
    serviceId: 'kycService',
    description: 'Get KYC status for a user',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'kyc_submit',
    method: 'POST',
    path: '/api/kyc/submit',
    serviceId: 'kycService',
    description: 'Submit KYC documents',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 5, requestsPerHour: 100 },
    timeout: 10000,
  },
  {
    id: 'kyc_verify',
    method: 'POST',
    path: '/api/kyc/verify/:userId',
    serviceId: 'kycService',
    description: 'Verify KYC user (admin)',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
]

// ============================================
// MARKETING ENDPOINTS
// ============================================

export const MARKETING_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'marketing_list_campaigns',
    method: 'GET',
    path: '/api/marketing/campaigns',
    serviceId: 'marketingService',
    description: 'List marketing campaigns',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'marketing_create_campaign',
    method: 'POST',
    path: '/api/marketing/campaigns',
    serviceId: 'marketingService',
    description: 'Create marketing campaign',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'marketing_update_campaign',
    method: 'PUT',
    path: '/api/marketing/campaigns/:id',
    serviceId: 'marketingService',
    description: 'Update marketing campaign status',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
]

// ============================================
// WALLET ENDPOINTS (NEW)
// ============================================

export const WALLET_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'wallet_list',
    method: 'GET',
    path: '/api/wallet',
    serviceId: 'paymentService',
    description: 'Get all user wallets',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 5000,
  },
  {
    id: 'wallet_get_balance',
    method: 'GET',
    path: '/api/wallet/balance',
    serviceId: 'paymentService',
    description: 'Get wallet balance',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 5000,
  },
  {
    id: 'wallet_fx_preview',
    method: 'GET',
    path: '/api/wallet/fx-preview',
    serviceId: 'paymentService',
    description: 'Get FX conversion preview',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 5000,
  },
  {
    id: 'wallet_credit',
    method: 'POST',
    path: '/api/wallet/credit',
    serviceId: 'paymentService',
    description: 'Credit (top-up) wallet',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'wallet_debit',
    method: 'POST',
    path: '/api/wallet/debit',
    serviceId: 'paymentService',
    description: 'Debit (payment from) wallet',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'wallet_transfer',
    method: 'POST',
    path: '/api/wallet/transfer',
    serviceId: 'paymentService',
    description: 'Transfer between wallet currencies',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'wallet_history',
    method: 'GET',
    path: '/api/wallet/history',
    serviceId: 'paymentService',
    description: 'Get wallet transaction history',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 10000,
  },
]

// ============================================
// DUFFEL FLIGHT API ENDPOINTS
// ============================================

export const DUFFEL_ENDPOINTS: EndpointConfig[] = [
  // Airports/Cities Search (for Autocomplete)
  {
    id: 'duffel_search_airports',
    method: 'GET',
    path: '/api/duffel/airports',
    serviceId: 'bookingService',
    description: 'Search airports and cities via Duffel places API (proxied)',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 2000 },
    timeout: 5000,
  },
  // Offer Requests
  {
    id: 'duffel_create_offer_request',
    method: 'POST',
    path: '/api/flights/offer-requests',
    serviceId: 'bookingService',
    description: 'Create flight search offer request (Duffel)',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    timeout: 15000,
  },
  {
    id: 'duffel_get_offer_request',
    method: 'GET',
    path: '/api/flights/offer-requests/:id',
    serviceId: 'bookingService',
    description: 'Get offer request by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'duffel_list_offer_requests',
    method: 'GET',
    path: '/api/flights/offer-requests',
    serviceId: 'bookingService',
    description: 'List all offer requests',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  // Orders
  {
    id: 'duffel_create_order',
    method: 'POST',
    path: '/api/flights/orders',
    serviceId: 'bookingService',
    description: 'Create flight booking order',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 15000,
  },
  {
    id: 'duffel_get_order',
    method: 'GET',
    path: '/api/flights/orders/:id',
    serviceId: 'bookingService',
    description: 'Get order by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'duffel_list_orders',
    method: 'GET',
    path: '/api/flights/orders',
    serviceId: 'bookingService',
    description: 'List all orders',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_update_order',
    method: 'PATCH',
    path: '/api/flights/orders/:id',
    serviceId: 'bookingService',
    description: 'Update order details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'duffel_get_order_services',
    method: 'GET',
    path: '/api/flights/orders/:id/available-services',
    serviceId: 'bookingService',
    description: 'Get available services (ancillaries)',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_price_order',
    method: 'POST',
    path: '/api/flights/orders/:id/price',
    serviceId: 'bookingService',
    description: 'Get final price for order',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'duffel_add_order_services',
    method: 'POST',
    path: '/api/flights/order-services',
    serviceId: 'bookingService',
    description: 'Add services (baggage, meals, seats)',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 10000,
  },
  // Cancellations
  {
    id: 'duffel_create_cancellation',
    method: 'POST',
    path: '/api/flights/order-cancellations',
    serviceId: 'bookingService',
    description: 'Create cancellation request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'duffel_get_cancellation',
    method: 'GET',
    path: '/api/flights/order-cancellations/:id',
    serviceId: 'bookingService',
    description: 'Get cancellation by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_list_cancellations',
    method: 'GET',
    path: '/api/flights/order-cancellations',
    serviceId: 'bookingService',
    description: 'List all cancellations',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_confirm_cancellation',
    method: 'POST',
    path: '/api/flights/order-cancellations/:id/confirm',
    serviceId: 'bookingService',
    description: 'Confirm cancellation',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  // Order Changes
  {
    id: 'duffel_create_change_request',
    method: 'POST',
    path: '/api/flights/order-change-requests',
    serviceId: 'bookingService',
    description: 'Create order change request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 15000,
  },
  {
    id: 'duffel_get_change_request',
    method: 'GET',
    path: '/api/flights/order-change-requests/:id',
    serviceId: 'bookingService',
    description: 'Get change request by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_list_change_offers',
    method: 'GET',
    path: '/api/flights/order-change-offers',
    serviceId: 'bookingService',
    description: 'List change offers for a request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_get_change_offer',
    method: 'GET',
    path: '/api/flights/order-change-offers/:id',
    serviceId: 'bookingService',
    description: 'Get change offer by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_create_order_change',
    method: 'POST',
    path: '/api/flights/order-changes',
    serviceId: 'bookingService',
    description: 'Create pending order change',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'duffel_confirm_order_change',
    method: 'POST',
    path: '/api/flights/order-changes/confirm',
    serviceId: 'bookingService',
    description: 'Confirm order change',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'duffel_get_order_change',
    method: 'GET',
    path: '/api/flights/order-changes/:id',
    serviceId: 'bookingService',
    description: 'Get order change by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  // Seat Maps
  {
    id: 'duffel_get_seat_map',
    method: 'GET',
    path: '/api/flights/seat-maps',
    serviceId: 'bookingService',
    description: 'Get seat map for offer',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  // Airline Credits
  {
    id: 'duffel_list_airline_credits',
    method: 'GET',
    path: '/api/airline-credits',
    serviceId: 'bookingService',
    description: 'List airline credits',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_get_airline_credit',
    method: 'GET',
    path: '/api/airline-credits/:id',
    serviceId: 'bookingService',
    description: 'Get airline credit by ID',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'duffel_create_airline_credit',
    method: 'POST',
    path: '/api/airline-credits',
    serviceId: 'bookingService',
    description: 'Create airline credit',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'duffel_update_airline_credit',
    method: 'PATCH',
    path: '/api/airline-credits/:id',
    serviceId: 'bookingService',
    description: 'Update airline credit',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  // Webhooks
  {
    id: 'duffel_webhook',
    method: 'POST',
    path: '/api/webhooks/duffel',
    serviceId: 'bookingService',
    description: 'Duffel webhook endpoint',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 10000,
  },
  {
    id: 'liteapi_webhook',
    method: 'POST',
    path: '/api/webhooks/liteapi',
    serviceId: 'bookingService',
    description: 'LITEAPI webhook endpoint',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 10000,
  },
  // Hotel Destinations Search (for Autocomplete)
  {
    id: 'liteapi_search_destinations',
    method: 'GET',
    path: '/api/hotels/destinations',
    serviceId: 'bookingService',
    description: 'Search hotel destinations via LiteAPI cities search (proxied)',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 2000 },
    timeout: 5000,
  },
]

// ============================================
// API MANAGER CLASS
// ============================================

export class APIManager {
  private services: Map<string, ServiceConfig> = new Map()
  private endpoints: Map<string, EndpointConfig> = new Map()
  private routeMap: Map<string, EndpointConfig> = new Map()

  constructor() {
    // Register services
    Object.entries(SERVICES).forEach(([key, config]) => {
      this.services.set(key, config)
    })

    // Register endpoints
    const allEndpoints = [
      ...NOTIFICATION_ENDPOINTS,
      ...RULE_ENGINE_ENDPOINTS,
      ...AUDIT_ENDPOINTS,
      ...TAX_ENDPOINTS,
      ...SUPPORT_ENDPOINTS,
      ...BOOKING_ENDPOINTS,
      ...KYC_ENDPOINTS,
      ...MARKETING_ENDPOINTS,
      ...WALLET_ENDPOINTS,
      ...DUFFEL_ENDPOINTS,
    ]
    allEndpoints.forEach((endpoint) => {
      this.endpoints.set(endpoint.id, endpoint)

      // Create route map for fast lookup
      const routeKey = `${endpoint.method} ${endpoint.path}`
      this.routeMap.set(routeKey, endpoint)
    })
  }

  /**
   * Get endpoint configuration by route
   * Supports parameter matching (e.g., /api/rules/:id)
   */
  getEndpoint(method: string, path: string): EndpointConfig | undefined {
    // Try exact match first
    const exactMatch = this.routeMap.get(`${method} ${path}`)
    if (exactMatch) return exactMatch

    // Try parameter matching
    return Array.from(this.endpoints.values()).find((endpoint) => {
      if (endpoint.method !== method) return false

      const pattern = endpoint.path.replace(/:[^\/]+/g, '[^/]+')
      const regex = new RegExp(`^${pattern}$`)
      return regex.test(path)
    })
  }

  /**
   * Get service configuration
   */
  getService(serviceId: string): ServiceConfig | undefined {
    return this.services.get(serviceId)
  }

  /**
   * Get all endpoints for a service
   */
  getEndpointsByService(serviceId: string): EndpointConfig[] {
    return Array.from(this.endpoints.values()).filter((e) => e.serviceId === serviceId)
  }

  /**
   * Get statistics about API configuration
   */
  getStatistics() {
    return {
      totalServices: this.services.size,
      totalEndpoints: this.endpoints.size,
      notificationEndpoints: NOTIFICATION_ENDPOINTS.length,
      ruleEngineEndpoints: RULE_ENGINE_ENDPOINTS.length,
      kycEndpoints: KYC_ENDPOINTS.length,
      marketingEndpoints: MARKETING_ENDPOINTS.length,
      duffelEndpoints: DUFFEL_ENDPOINTS.length,
      services: Array.from(this.services.keys()),
    }
  }
}


export default new APIManager()
