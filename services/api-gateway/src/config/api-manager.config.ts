/**
 * API Manager Configuration
 * Centralized endpoint and service routing configuration for TripAlfa
 *
 * This configuration manages:
 * - All API endpoints (150+ total across all services)
 * - Service routing and load balancing
 * - Authentication and authorization
 * - Rate limiting policies
 * - Request/response transformation
 * - Error handling and retry logic
 *
 * Services:
 * - Notification Service (15 endpoints)
 * - Rule Engine Service (13 endpoints)
 * - Booking Service (existing endpoints)
 * - Payment Service (wallet endpoints)
 * - KYC Service (3 endpoints)
 * - Marketing Service (3 endpoints)
 * - B2B Admin Service (70+ endpoints)
 * - Booking Engine Service (25+ endpoints)
 */

export interface ServiceConfig {
  name: string;
  baseUrl: string;
  port: number;
  timeout: number;
  retryPolicy: {
    maxRetries: number;
    backoffMs: number;
    codes: number[]; // HTTP status codes to retry
  };
  rateLimitPolicy: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  healthCheck: {
    enabled: boolean;
    interval: number;
    endpoint: string;
  };
}

export interface EndpointConfig {
  id: string;
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE' | 'PUT';
  path: string;
  serviceId: string;
  description: string;
  requiresAuth: boolean;
  rateLimit: {
    requestsPerMinute: number;
    requestsPerHour: number;
  };
  timeout: number;
}

// ============================================
// SERVICE CONFIGURATIONS
// ============================================

// Service port mappings - centralized for easier maintenance
// Can be overridden via environment variables (e.g., NOTIFICATION_SERVICE_PORT)
const SERVICE_PORTS: Record<string, string> = {
  NOTIFICATION_SERVICE: '3009',
  USER_SERVICE: '3004',
  ORGANIZATION_SERVICE: '3006',
  BOOKING_SERVICE: '3001',
  PAYMENT_SERVICE: '3007',
  RULE_ENGINE_SERVICE: '3010',
  KYC_SERVICE: '3011',
  MARKETING_SERVICE: '3012',
  B2B_ADMIN_SERVICE: '3020',
  BOOKING_ENGINE_SERVICE: '3021',
};

// Helper function to get service URL with environment-based fallback
// All services run locally using localhost
function getServiceUrl(serviceName: string, port?: string): string {
  const baseUrl = process.env[`${serviceName}_URL`];
  if (baseUrl) return baseUrl;

  const host = 'localhost';

  // Use provided port, environment variable, or centralized SERVICE_PORTS
  const servicePort =
    port || process.env[`${serviceName}_PORT`] || SERVICE_PORTS[serviceName] || '3000';
  return `http://${host}:${servicePort}`;
}

// Startup validation function - run at module load to detect configuration issues
function validateServiceConfiguration(): {
  valid: boolean;
  warnings: string[];
  errors: string[];
} {
  const warnings: string[] = [];
  const errors: string[] = [];

  console.log('[API Manager] Running in local development mode');

  // Validate critical service URLs are configured
  const criticalServices = [
    'NOTIFICATION_SERVICE',
    'USER_SERVICE',
    'BOOKING_SERVICE',
    'PAYMENT_SERVICE',
  ];
  for (const service of criticalServices) {
    const url = getServiceUrl(service);
    if (url.includes('localhost') && process.env.NODE_ENV === 'production') {
      warnings.push(`Service ${service} is using localhost in production mode`);
    }
  }

  // NOTE: STATIC_DATA_SERVICE was removed - static data now uses in-memory fallbacks
  // See apps/booking-engine/src/lib/constants/*-static-data.ts for fallback data

  // Validate all service ports are defined
  const requiredPorts = [
    'NOTIFICATION_SERVICE',
    'USER_SERVICE',
    'ORGANIZATION_SERVICE',
    'BOOKING_SERVICE',
    'PAYMENT_SERVICE',
    'RULE_ENGINE_SERVICE',
    'KYC_SERVICE',
    'MARKETING_SERVICE',
    'B2B_ADMIN_SERVICE',
    'BOOKING_ENGINE_SERVICE',
  ];
  for (const service of requiredPorts) {
    if (!SERVICE_PORTS[service]) {
      errors.push(`Service ${service} is missing port configuration`);
    }
  }

  if (warnings.length > 0) {
    console.warn('[API Manager] Configuration warnings:', warnings);
  }
  if (errors.length > 0) {
    console.error('[API Manager] Configuration errors:', errors);
  }

  return { valid: errors.length === 0, warnings, errors };
}

// Run validation at module load time (only in non-test environments)
if (process.env.NODE_ENV !== 'test') {
  validateServiceConfiguration();
}

const SERVICES: Record<string, ServiceConfig> = {
  notificationService: {
    name: 'Notification Service',
    baseUrl: getServiceUrl('NOTIFICATION_SERVICE'),
    port: parseInt(
      process.env.NOTIFICATION_SERVICE_PORT || SERVICE_PORTS['NOTIFICATION_SERVICE'] || '3009'
    ),
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
    baseUrl: getServiceUrl('USER_SERVICE'),
    port: parseInt(process.env.USER_SERVICE_PORT || SERVICE_PORTS['USER_SERVICE'] || '3004'),
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
    baseUrl: getServiceUrl('ORGANIZATION_SERVICE'),
    port: parseInt(
      process.env.ORGANIZATION_SERVICE_PORT || SERVICE_PORTS['ORGANIZATION_SERVICE'] || '3006'
    ),
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
    baseUrl: getServiceUrl('BOOKING_SERVICE'),
    port: parseInt(process.env.BOOKING_SERVICE_PORT || SERVICE_PORTS['BOOKING_SERVICE'] || '3001'),
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
    baseUrl: getServiceUrl('PAYMENT_SERVICE'),
    port: parseInt(process.env.PAYMENT_SERVICE_PORT || SERVICE_PORTS['PAYMENT_SERVICE'] || '3007'),
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
    baseUrl: getServiceUrl('RULE_ENGINE_SERVICE'),
    port: parseInt(
      process.env.RULE_ENGINE_SERVICE_PORT || SERVICE_PORTS['RULE_ENGINE_SERVICE'] || '3010'
    ),
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
    baseUrl: getServiceUrl('KYC_SERVICE'),
    port: parseInt(process.env.KYC_SERVICE_PORT || SERVICE_PORTS['KYC_SERVICE'] || '3011'),
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
    baseUrl: getServiceUrl('MARKETING_SERVICE'),
    port: parseInt(
      process.env.MARKETING_SERVICE_PORT || SERVICE_PORTS['MARKETING_SERVICE'] || '3012'
    ),
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
  b2bAdminService: {
    name: 'B2B Admin Service',
    baseUrl: getServiceUrl('B2B_ADMIN_SERVICE'),
    port: parseInt(
      process.env.B2B_ADMIN_SERVICE_PORT || SERVICE_PORTS['B2B_ADMIN_SERVICE'] || '3020'
    ),
    timeout: 15000,
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
  bookingEngineService: {
    name: 'Booking Engine Service',
    baseUrl: getServiceUrl('BOOKING_ENGINE_SERVICE'),
    port: parseInt(
      process.env.BOOKING_ENGINE_SERVICE_PORT || SERVICE_PORTS['BOOKING_ENGINE_SERVICE'] || '3021'
    ),
    timeout: 30000,
    retryPolicy: {
      maxRetries: 3,
      backoffMs: 2000,
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
};

// ============================================
// NOTIFICATION ENDPOINTS (15 Total)
// ============================================

const NOTIFICATION_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// RULE ENGINE ENDPOINTS (13 Total)
// ============================================

const RULE_ENGINE_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// AUDIT ENDPOINTS
// ============================================

const AUDIT_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// TAX ENDPOINTS
// ============================================

const TAX_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// BOOKING ENDPOINTS
// ============================================

const BOOKING_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// KYC ENDPOINTS
// ============================================

const KYC_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// MARKETING ENDPOINTS
// ============================================

const MARKETING_ENDPOINTS: EndpointConfig[] = [
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
];

// ============================================
// WALLET ENDPOINTS (NEW)
// ============================================

const WALLET_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'exchange_rates_latest',
    method: 'GET',
    path: '/api/exchange-rates/latest',
    serviceId: 'bookingService',
    description: 'Get latest FX rates from static DB',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 120, requestsPerHour: 5000 },
    timeout: 5000,
  },
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
];

// ============================================
// DUFFEL FLIGHT API ENDPOINTS
// ============================================

const DUFFEL_ENDPOINTS: EndpointConfig[] = [
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
  // Places Suggestions - Find airports within geographic area
  {
    id: 'duffel_places_suggestions',
    method: 'GET',
    path: '/api/duffel/places/suggestions',
    serviceId: 'bookingService',
    description:
      'Find airports within a geographic area (Duffel Places API) - https://duffel.com/docs/guides/finding-airports-within-an-area',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 2000 },
    timeout: 5000,
  },
  // Nearby Airports - Convenience endpoint
  {
    id: 'duffel_nearby_airports',
    method: 'GET',
    path: '/api/duffel/nearby-airports',
    serviceId: 'bookingService',
    description: 'Find nearby airports - convenience endpoint using Duffel Places API',
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
  // Booking Amend - Update guest information
  {
    id: 'booking_amend',
    method: 'PUT',
    path: '/api/bookings/:bookingId/amend',
    serviceId: 'bookingService',
    description: 'Update guest information for an existing booking (holder details)',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 10000,
  },
];

// ============================================
// B2B ADMIN ENDPOINTS - Companies
// ============================================

const B2B_ADMIN_COMPANY_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'b2b_companies_list',
    method: 'GET',
    path: '/api/b2b/companies',
    serviceId: 'b2bAdminService',
    description: 'List all B2B companies',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_companies_create',
    method: 'POST',
    path: '/api/b2b/companies',
    serviceId: 'b2bAdminService',
    description: 'Create a new B2B company',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_companies_get',
    method: 'GET',
    path: '/api/b2b/companies/:id',
    serviceId: 'b2bAdminService',
    description: 'Get B2B company details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_companies_update',
    method: 'PATCH',
    path: '/api/b2b/companies/:id',
    serviceId: 'b2bAdminService',
    description: 'Update B2B company',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_companies_delete',
    method: 'DELETE',
    path: '/api/b2b/companies/:id',
    serviceId: 'b2bAdminService',
    description: 'Delete B2B company',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'b2b_companies_departments_list',
    method: 'GET',
    path: '/api/b2b/companies/:id/departments',
    serviceId: 'b2bAdminService',
    description: 'List company departments',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_companies_departments_create',
    method: 'POST',
    path: '/api/b2b/companies/:id/departments',
    serviceId: 'b2bAdminService',
    description: 'Create company department',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'b2b_companies_stats',
    method: 'GET',
    path: '/api/b2b/companies/:id/stats',
    serviceId: 'b2bAdminService',
    description: 'Get company statistics',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
];

// ============================================
// B2B ADMIN ENDPOINTS - Users
// ============================================

const B2B_ADMIN_USER_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'b2b_users_list',
    method: 'GET',
    path: '/api/b2b/users',
    serviceId: 'b2bAdminService',
    description: 'List all B2B users',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_users_create',
    method: 'POST',
    path: '/api/b2b/users',
    serviceId: 'b2bAdminService',
    description: 'Create a new B2B user',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_users_get',
    method: 'GET',
    path: '/api/b2b/users/:id',
    serviceId: 'b2bAdminService',
    description: 'Get B2B user details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_users_update',
    method: 'PATCH',
    path: '/api/b2b/users/:id',
    serviceId: 'b2bAdminService',
    description: 'Update B2B user',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_users_delete',
    method: 'DELETE',
    path: '/api/b2b/users/:id',
    serviceId: 'b2bAdminService',
    description: 'Delete B2B user',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'b2b_users_roles',
    method: 'GET',
    path: '/api/b2b/users/:id/roles',
    serviceId: 'b2bAdminService',
    description: 'Get user roles',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_users_assign_role',
    method: 'POST',
    path: '/api/b2b/users/:id/roles',
    serviceId: 'b2bAdminService',
    description: 'Assign role to user',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'b2b_users_remove_role',
    method: 'DELETE',
    path: '/api/b2b/users/:id/roles/:roleId',
    serviceId: 'b2bAdminService',
    description: 'Remove role from user',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'b2b_users_notifications',
    method: 'GET',
    path: '/api/b2b/users/:id/notifications',
    serviceId: 'b2bAdminService',
    description: 'Get user notifications',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_users_bookings',
    method: 'GET',
    path: '/api/b2b/users/:id/bookings',
    serviceId: 'b2bAdminService',
    description: 'Get user bookings',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
];

// ============================================
// B2B ADMIN ENDPOINTS - Bookings Management
// ============================================

const B2B_ADMIN_BOOKING_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'b2b_bookings_list',
    method: 'GET',
    path: '/api/b2b/bookings',
    serviceId: 'b2bAdminService',
    description: 'List all B2B bookings',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_bookings_get',
    method: 'GET',
    path: '/api/b2b/bookings/:id',
    serviceId: 'b2bAdminService',
    description: 'Get B2B booking details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_bookings_update',
    method: 'PATCH',
    path: '/api/b2b/bookings/:id',
    serviceId: 'b2bAdminService',
    description: 'Update B2B booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_bookings_queues',
    method: 'GET',
    path: '/api/b2b/bookings/queues',
    serviceId: 'b2bAdminService',
    description: 'List booking queues',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_bookings_cancel',
    method: 'POST',
    path: '/api/b2b/bookings/:id/cancel',
    serviceId: 'b2bAdminService',
    description: 'Cancel B2B booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'b2b_bookings_refund',
    method: 'POST',
    path: '/api/b2b/bookings/:id/refund',
    serviceId: 'b2bAdminService',
    description: 'Process booking refund',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 15000,
  },
  {
    id: 'b2b_bookings_documents',
    method: 'GET',
    path: '/api/b2b/bookings/:id/documents',
    serviceId: 'b2bAdminService',
    description: 'Get booking documents',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_bookings_payments',
    method: 'GET',
    path: '/api/b2b/bookings/:id/payments',
    serviceId: 'b2bAdminService',
    description: 'Get booking payments',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
];

// ============================================
// B2B ADMIN ENDPOINTS - Finance
// ============================================

const B2B_ADMIN_FINANCE_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'b2b_wallets_list',
    method: 'GET',
    path: '/api/b2b/wallets',
    serviceId: 'b2bAdminService',
    description: 'List all B2B wallets',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_wallets_get',
    method: 'GET',
    path: '/api/b2b/wallets/:id',
    serviceId: 'b2bAdminService',
    description: 'Get wallet details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_wallets_balance',
    method: 'GET',
    path: '/api/b2b/wallets/:id/balance',
    serviceId: 'b2bAdminService',
    description: 'Get wallet balance',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 5000,
  },
  {
    id: 'b2b_wallets_credit',
    method: 'POST',
    path: '/api/b2b/wallets/:id/credit',
    serviceId: 'b2bAdminService',
    description: 'Credit wallet',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'b2b_wallets_debit',
    method: 'POST',
    path: '/api/b2b/wallets/:id/debit',
    serviceId: 'b2bAdminService',
    description: 'Debit wallet',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'b2b_transactions_list',
    method: 'GET',
    path: '/api/b2b/transactions',
    serviceId: 'b2bAdminService',
    description: 'List all transactions',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_transactions_get',
    method: 'GET',
    path: '/api/b2b/transactions/:id',
    serviceId: 'b2bAdminService',
    description: 'Get transaction details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_settlements_list',
    method: 'GET',
    path: '/api/b2b/settlements',
    serviceId: 'b2bAdminService',
    description: 'List all settlements',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_settlements_create',
    method: 'POST',
    path: '/api/b2b/settlements',
    serviceId: 'b2bAdminService',
    description: 'Create settlement',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'b2b_settlements_process',
    method: 'POST',
    path: '/api/b2b/settlements/:id/process',
    serviceId: 'b2bAdminService',
    description: 'Process settlement',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 15000,
  },
  {
    id: 'b2b_disputes_list',
    method: 'GET',
    path: '/api/b2b/disputes',
    serviceId: 'b2bAdminService',
    description: 'List all disputes',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_disputes_create',
    method: 'POST',
    path: '/api/b2b/disputes',
    serviceId: 'b2bAdminService',
    description: 'Create dispute',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_disputes_resolve',
    method: 'POST',
    path: '/api/b2b/disputes/:id/resolve',
    serviceId: 'b2bAdminService',
    description: 'Resolve dispute',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'b2b_exchange_rates_list',
    method: 'GET',
    path: '/api/b2b/exchange-rates',
    serviceId: 'b2bAdminService',
    description: 'List exchange rates',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 50, requestsPerHour: 2000 },
    timeout: 5000,
  },
  {
    id: 'b2b_exchange_rates_update',
    method: 'POST',
    path: '/api/b2b/exchange-rates',
    serviceId: 'b2bAdminService',
    description: 'Update exchange rates',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'b2b_reports_generate',
    method: 'POST',
    path: '/api/b2b/reports',
    serviceId: 'b2bAdminService',
    description: 'Generate financial report',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 30000,
  },
  {
    id: 'b2b_reports_list',
    method: 'GET',
    path: '/api/b2b/reports',
    serviceId: 'b2bAdminService',
    description: 'List generated reports',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
];

// ============================================
// B2B ADMIN ENDPOINTS - Suppliers
// ============================================

// Phase 2 & Phase 3 Supplier Management Endpoints
// Routes for: Products, Mappings, Financial, Wallets, Payments, Payment Gateway Webhooks
const B2B_ADMIN_SUPPLIER_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'b2b_suppliers_list',
    method: 'GET',
    path: '/api/suppliers',
    serviceId: 'b2bAdminService',
    description: 'List all suppliers',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_create',
    method: 'POST',
    path: '/api/suppliers',
    serviceId: 'b2bAdminService',
    description: 'Create supplier',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_get',
    method: 'GET',
    path: '/api/suppliers/:id',
    serviceId: 'b2bAdminService',
    description: 'Get supplier details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_update',
    method: 'PUT',
    path: '/api/suppliers/:id',
    serviceId: 'b2bAdminService',
    description: 'Update supplier',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_delete',
    method: 'DELETE',
    path: '/api/suppliers/:id',
    serviceId: 'b2bAdminService',
    description: 'Delete supplier',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_credentials',
    method: 'GET',
    path: '/api/suppliers/:id/credentials',
    serviceId: 'b2bAdminService',
    description: 'Get supplier credentials',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_credentials_create',
    method: 'POST',
    path: '/api/suppliers/:id/credentials',
    serviceId: 'b2bAdminService',
    description: 'Create supplier credential',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_credentials_update',
    method: 'PUT',
    path: '/api/suppliers/:id/credentials/:credId',
    serviceId: 'b2bAdminService',
    description: 'Update supplier credentials',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_credentials_delete',
    method: 'DELETE',
    path: '/api/suppliers/:id/credentials/:credId',
    serviceId: 'b2bAdminService',
    description: 'Delete supplier credentials',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_sync_logs',
    method: 'GET',
    path: '/api/suppliers/:id/sync-logs',
    serviceId: 'b2bAdminService',
    description: 'Get supplier sync logs',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_sync_trigger',
    method: 'POST',
    path: '/api/suppliers/:id/sync',
    serviceId: 'b2bAdminService',
    description: 'Trigger supplier sync',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 8000,
  },
  // Phase 2 - Supplier Products
  {
    id: 'b2b_suppliers_products_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/products',
    serviceId: 'b2bAdminService',
    description: 'List supplier products',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_products_create',
    method: 'POST',
    path: '/api/suppliers/:supplierId/products',
    serviceId: 'b2bAdminService',
    description: 'Create supplier product',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_products_update',
    method: 'PUT',
    path: '/api/suppliers/:supplierId/products/:productId',
    serviceId: 'b2bAdminService',
    description: 'Update supplier product',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_products_delete',
    method: 'DELETE',
    path: '/api/suppliers/:supplierId/products/:productId',
    serviceId: 'b2bAdminService',
    description: 'Delete supplier product',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  // Phase 2 - Product Mappings
  {
    id: 'b2b_suppliers_mappings_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/mappings',
    serviceId: 'b2bAdminService',
    description: 'List product mappings',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_mappings_create',
    method: 'POST',
    path: '/api/suppliers/:supplierId/mappings',
    serviceId: 'b2bAdminService',
    description: 'Create product mapping',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_mappings_update',
    method: 'PUT',
    path: '/api/suppliers/:supplierId/mappings/:mappingId',
    serviceId: 'b2bAdminService',
    description: 'Update product mapping',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_mappings_approve',
    method: 'POST',
    path: '/api/suppliers/:supplierId/mappings/:mappingId/approve',
    serviceId: 'b2bAdminService',
    description: 'Approve product mapping',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_mappings_delete',
    method: 'DELETE',
    path: '/api/suppliers/:supplierId/mappings/:mappingId',
    serviceId: 'b2bAdminService',
    description: 'Delete product mapping',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  // Phase 2 - Mapping Parameters
  {
    id: 'b2b_suppliers_mapping_parameters_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/mappings/:mappingId/parameters',
    serviceId: 'b2bAdminService',
    description: 'List mapping parameters',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_mapping_parameters_create',
    method: 'POST',
    path: '/api/suppliers/:supplierId/mappings/:mappingId/parameters',
    serviceId: 'b2bAdminService',
    description: 'Create mapping parameter',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_mapping_parameters_update',
    method: 'PUT',
    path: '/api/suppliers/:supplierId/mappings/:mappingId/parameters/:parameterId',
    serviceId: 'b2bAdminService',
    description: 'Update mapping parameter',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_mapping_parameters_delete',
    method: 'DELETE',
    path: '/api/suppliers/:supplierId/mappings/:mappingId/parameters/:parameterId',
    serviceId: 'b2bAdminService',
    description: 'Delete mapping parameter',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  // Phase 2 - Financial Details
  {
    id: 'b2b_suppliers_financial_get',
    method: 'GET',
    path: '/api/suppliers/:supplierId/financial',
    serviceId: 'b2bAdminService',
    description: 'Get supplier financial profile',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_financial_update',
    method: 'PUT',
    path: '/api/suppliers/:supplierId/financial',
    serviceId: 'b2bAdminService',
    description: 'Update supplier financial profile',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  // Phase 2 - Payment Terms
  {
    id: 'b2b_suppliers_payment_terms_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/payment-terms',
    serviceId: 'b2bAdminService',
    description: 'List payment terms',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_payment_terms_create',
    method: 'POST',
    path: '/api/suppliers/:supplierId/payment-terms',
    serviceId: 'b2bAdminService',
    description: 'Create payment term',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  // Phase 2 - Supplier Wallets
  {
    id: 'b2b_suppliers_wallets_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/wallets',
    serviceId: 'b2bAdminService',
    description: 'List supplier wallets',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_wallets_create',
    method: 'POST',
    path: '/api/suppliers/:supplierId/wallets',
    serviceId: 'b2bAdminService',
    description: 'Create supplier wallet',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_wallet_approvals_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/wallet-approvals',
    serviceId: 'b2bAdminService',
    description: 'List wallet approval requests',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_wallet_approvals_approve',
    method: 'POST',
    path: '/api/suppliers/:supplierId/wallet-approvals/:approvalId/approve',
    serviceId: 'b2bAdminService',
    description: 'Approve wallet request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  // Phase 2 - Payments
  {
    id: 'b2b_suppliers_payments_list',
    method: 'GET',
    path: '/api/suppliers/:supplierId/payments',
    serviceId: 'b2bAdminService',
    description: 'List supplier payments',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_suppliers_payments_create',
    method: 'POST',
    path: '/api/suppliers/:supplierId/payments',
    serviceId: 'b2bAdminService',
    description: 'Create payment request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_payment_logs',
    method: 'GET',
    path: '/api/suppliers/:supplierId/payment-logs',
    serviceId: 'b2bAdminService',
    description: 'Get payment audit logs',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  // Phase 3 - Payment Gateway (Payments with gateway integration)
  {
    id: 'b2b_suppliers_payments_retry',
    method: 'POST',
    path: '/api/suppliers/:supplierId/payments/:paymentId/retry',
    serviceId: 'b2bAdminService',
    description: 'Retry payment processing',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 8000,
  },
  {
    id: 'b2b_suppliers_payments_cancel',
    method: 'POST',
    path: '/api/suppliers/:supplierId/payments/:paymentId/cancel',
    serviceId: 'b2bAdminService',
    description: 'Cancel payment request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 8000,
  },
  {
    id: 'b2b_payment_statistics',
    method: 'GET',
    path: '/api/suppliers/:supplierId/payment-statistics',
    serviceId: 'b2bAdminService',
    description: 'Get payment statistics',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 1000 },
    timeout: 5000,
  },
  // Phase 3 - Webhooks
  {
    id: 'b2b_webhooks_stripe',
    method: 'POST',
    path: '/api/webhooks/stripe',
    serviceId: 'b2bAdminService',
    description: 'Stripe payment webhooks',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 },
    timeout: 8000,
  },
  {
    id: 'b2b_webhooks_paypal',
    method: 'POST',
    path: '/api/webhooks/paypal',
    serviceId: 'b2bAdminService',
    description: 'PayPal payment webhooks',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 },
    timeout: 8000,
  },
  {
    id: 'b2b_webhooks_test',
    method: 'POST',
    path: '/api/webhooks/test',
    serviceId: 'b2bAdminService',
    description: 'Test payment webhooks',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 100, requestsPerHour: 5000 },
    timeout: 8000,
  },
];

// ============================================
// B2B ADMIN ENDPOINTS - Rules
// ============================================

const B2B_ADMIN_RULE_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'b2b_markup_rules_list',
    method: 'GET',
    path: '/api/b2b/markup-rules',
    serviceId: 'b2bAdminService',
    description: 'List all markup rules',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_markup_rules_create',
    method: 'POST',
    path: '/api/b2b/markup-rules',
    serviceId: 'b2bAdminService',
    description: 'Create markup rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_markup_rules_get',
    method: 'GET',
    path: '/api/b2b/markup-rules/:id',
    serviceId: 'b2bAdminService',
    description: 'Get markup rule details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'b2b_markup_rules_update',
    method: 'PATCH',
    path: '/api/b2b/markup-rules/:id',
    serviceId: 'b2bAdminService',
    description: 'Update markup rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_markup_rules_delete',
    method: 'DELETE',
    path: '/api/b2b/markup-rules/:id',
    serviceId: 'b2bAdminService',
    description: 'Delete markup rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'b2b_supplier_deals_list',
    method: 'GET',
    path: '/api/b2b/supplier-deals',
    serviceId: 'b2bAdminService',
    description: 'List all supplier deals',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_supplier_deals_create',
    method: 'POST',
    path: '/api/b2b/supplier-deals',
    serviceId: 'b2bAdminService',
    description: 'Create supplier deal',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_supplier_deals_update',
    method: 'PATCH',
    path: '/api/b2b/supplier-deals/:id',
    serviceId: 'b2bAdminService',
    description: 'Update supplier deal',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 8000,
  },
  {
    id: 'b2b_commissions_list',
    method: 'GET',
    path: '/api/b2b/commissions',
    serviceId: 'b2bAdminService',
    description: 'List all commissions',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 8000,
  },
  {
    id: 'b2b_commissions_create',
    method: 'POST',
    path: '/api/b2b/commissions',
    serviceId: 'b2bAdminService',
    description: 'Create commission rule',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 8000,
  },
];

// ============================================

// ============================================
// BOOKING ENGINE ENDPOINTS - Flights
// ============================================

const BOOKING_ENGINE_FLIGHT_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'be_flight_search',
    method: 'POST',
    path: '/api/booking-engine/flights/search',
    serviceId: 'bookingEngineService',
    description: 'Search flights via Duffel API',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    timeout: 30000,
  },
  {
    id: 'be_flight_offer_get',
    method: 'GET',
    path: '/api/booking-engine/flights/offers/:id',
    serviceId: 'bookingEngineService',
    description: 'Get flight offer details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  {
    id: 'be_flight_booking_create',
    method: 'POST',
    path: '/api/booking-engine/flights/bookings',
    serviceId: 'bookingEngineService',
    description: 'Create flight booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 30000,
  },
  {
    id: 'be_flight_booking_get',
    method: 'GET',
    path: '/api/booking-engine/flights/bookings/:id',
    serviceId: 'bookingEngineService',
    description: 'Get flight booking details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  {
    id: 'be_flight_booking_list',
    method: 'GET',
    path: '/api/booking-engine/flights/bookings',
    serviceId: 'bookingEngineService',
    description: 'List flight bookings',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  {
    id: 'be_flight_booking_cancel',
    method: 'POST',
    path: '/api/booking-engine/flights/bookings/:id/cancel',
    serviceId: 'bookingEngineService',
    description: 'Cancel flight booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 15000,
  },
  {
    id: 'be_flight_airports',
    method: 'GET',
    path: '/api/booking-engine/flights/airports',
    serviceId: 'bookingEngineService',
    description: 'Search airports and cities',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 2000 },
    timeout: 10000,
  },
];

// ============================================
// BOOKING ENGINE ENDPOINTS - Hotels
// ============================================

const BOOKING_ENGINE_HOTEL_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'be_hotel_search',
    method: 'POST',
    path: '/api/booking-engine/hotels/search',
    serviceId: 'bookingEngineService',
    description: 'Search hotels via LITEAPI',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    timeout: 30000,
  },
  {
    id: 'be_hotel_details',
    method: 'GET',
    path: '/api/booking-engine/hotels/:hotelId',
    serviceId: 'bookingEngineService',
    description: 'Get hotel details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 15000,
  },
  {
    id: 'be_hotel_rates',
    method: 'POST',
    path: '/api/booking-engine/hotels/rates',
    serviceId: 'bookingEngineService',
    description: 'Get hotel rates',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    timeout: 20000,
  },
  {
    id: 'be_hotel_booking_create',
    method: 'POST',
    path: '/api/booking-engine/hotels/bookings',
    serviceId: 'bookingEngineService',
    description: 'Create hotel booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 30000,
  },
  {
    id: 'be_hotel_booking_get',
    method: 'GET',
    path: '/api/booking-engine/hotels/bookings/:id',
    serviceId: 'bookingEngineService',
    description: 'Get hotel booking details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  {
    id: 'be_hotel_booking_list',
    method: 'GET',
    path: '/api/booking-engine/hotels/bookings',
    serviceId: 'bookingEngineService',
    description: 'List hotel bookings',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  {
    id: 'be_hotel_booking_cancel',
    method: 'POST',
    path: '/api/booking-engine/hotels/bookings/:id/cancel',
    serviceId: 'bookingEngineService',
    description: 'Cancel hotel booking',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 15000,
  },
  {
    id: 'be_hotel_destinations',
    method: 'GET',
    path: '/api/booking-engine/hotels/destinations',
    serviceId: 'bookingEngineService',
    description: 'Search hotel destinations',
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 2000 },
    timeout: 10000,
  },
];

// ============================================
// HYBRID HOTEL API ENDPOINTS (Static DB + Live Rates)
// ============================================
// STATIC DATA ENDPOINTS - REMOVED
// Static data is now served directly from packages/static-data on port 3002
// and bypasses the API gateway entirely.
// ============================================

// ============================================
// HOTEL HYBRID ENDPOINTS (Static DB + Live Rates)
// ============================================
const HOTEL_HYBRID_ENDPOINTS: EndpointConfig[] = [
  // Hotel search with live rates
  {
    id: "hotel-hybrid-search",
    method: "GET",
    path: "/api/hotel/hybrid/search",
    serviceId: "BOOKING_ENGINE_SERVICE",
    description: "Search hotels with live rates",
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    timeout: 15000,
  },
  // Hotel details with live rates
  {
    id: "hotel-hybrid-details",
    method: "GET",
    path: "/api/hotel/hybrid/:hotelId",
    serviceId: "BOOKING_ENGINE_SERVICE",
    description: "Get hotel details with live rates",
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 60, requestsPerHour: 1000 },
    timeout: 15000,
  },
  // Hotel availability check
  {
    id: "hotel-hybrid-availability",
    method: "POST",
    path: "/api/hotel/hybrid/availability",
    serviceId: "BOOKING_ENGINE_SERVICE",
    description: "Check hotel room availability with live rates",
    requiresAuth: false,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 500 },
    timeout: 20000,
  },
];

// ============================================
// BOOKING ENGINE ENDPOINTS - Offline Requests
// ============================================

const BOOKING_ENGINE_OFFLINE_ENDPOINTS: EndpointConfig[] = [
  {
    id: 'be_offline_requests_list',
    method: 'GET',
    path: '/api/booking-engine/offline-requests',
    serviceId: 'bookingEngineService',
    description: 'List offline booking requests',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 10000,
  },
  {
    id: 'be_offline_requests_create',
    method: 'POST',
    path: '/api/booking-engine/offline-requests',
    serviceId: 'bookingEngineService',
    description: 'Create offline booking request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 500 },
    timeout: 15000,
  },
  {
    id: 'be_offline_requests_get',
    method: 'GET',
    path: '/api/booking-engine/offline-requests/:id',
    serviceId: 'bookingEngineService',
    description: 'Get offline request details',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 30, requestsPerHour: 1000 },
    timeout: 5000,
  },
  {
    id: 'be_offline_requests_update',
    method: 'PATCH',
    path: '/api/booking-engine/offline-requests/:id',
    serviceId: 'bookingEngineService',
    description: 'Update offline request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 20, requestsPerHour: 500 },
    timeout: 10000,
  },
  {
    id: 'be_offline_requests_submit_pricing',
    method: 'POST',
    path: '/api/booking-engine/offline-requests/:id/pricing',
    serviceId: 'bookingEngineService',
    description: 'Submit pricing for offline request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 10000,
  },
  {
    id: 'be_offline_requests_approve',
    method: 'POST',
    path: '/api/booking-engine/offline-requests/:id/approve',
    serviceId: 'bookingEngineService',
    description: 'Approve offline request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 15000,
  },
  {
    id: 'be_offline_requests_reject',
    method: 'POST',
    path: '/api/booking-engine/offline-requests/:id/reject',
    serviceId: 'bookingEngineService',
    description: 'Reject offline request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
  {
    id: 'be_offline_requests_cancel',
    method: 'POST',
    path: '/api/booking-engine/offline-requests/:id/cancel',
    serviceId: 'bookingEngineService',
    description: 'Cancel offline request',
    requiresAuth: true,
    rateLimit: { requestsPerMinute: 10, requestsPerHour: 200 },
    timeout: 5000,
  },
];

// ============================================
// STATIC DATA ENDPOINTS - REMOVED
// Static data is now served directly from packages/static-data on port 3002
// and bypasses the API gateway entirely.
// ============================================

// ============================================
// API MANAGER CLASS
// ============================================

class APIManager {
  private services: Map<string, ServiceConfig> = new Map();
  private endpoints: Map<string, EndpointConfig> = new Map();
  private routeMap: Map<string, EndpointConfig> = new Map();

  constructor() {
    // Register services
    Object.entries(SERVICES).forEach(([key, config]) => {
      this.services.set(key, config);
    });

    // Register endpoints
    const allEndpoints = [
      ...NOTIFICATION_ENDPOINTS,
      ...RULE_ENGINE_ENDPOINTS,
      ...AUDIT_ENDPOINTS,
      ...TAX_ENDPOINTS,
      ...BOOKING_ENDPOINTS,
      ...KYC_ENDPOINTS,
      ...MARKETING_ENDPOINTS,
      ...WALLET_ENDPOINTS,
      ...DUFFEL_ENDPOINTS,
      ...B2B_ADMIN_COMPANY_ENDPOINTS,
      ...B2B_ADMIN_USER_ENDPOINTS,
      ...B2B_ADMIN_BOOKING_ENDPOINTS,
      ...B2B_ADMIN_FINANCE_ENDPOINTS,
      ...B2B_ADMIN_SUPPLIER_ENDPOINTS,
      ...B2B_ADMIN_RULE_ENDPOINTS,
      ...BOOKING_ENGINE_FLIGHT_ENDPOINTS,
      ...BOOKING_ENGINE_HOTEL_ENDPOINTS,
      ...BOOKING_ENGINE_OFFLINE_ENDPOINTS,
      ...HOTEL_HYBRID_ENDPOINTS, // Hybrid hotel endpoints (Static DB + Live Rates)
    ];
    allEndpoints.forEach(endpoint => {
      this.endpoints.set(endpoint.id, endpoint);

      // Create route map for fast lookup
      const routeKey = `${endpoint.method} ${endpoint.path}`;
      this.routeMap.set(routeKey, endpoint);
    });
  }

  /**
   * Get runtime health status of all services
   * Returns a map of service name to health status
   */
  async getServicesHealth(): Promise<
    Record<string, { healthy: boolean; latency?: number; error?: string }>
  > {
    const healthStatus: Record<string, { healthy: boolean; latency?: number; error?: string }> = {};

    const checkPromises = Array.from(this.services.entries()).map(async ([name, config]) => {
      const start = Date.now();
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), config.timeout);

        const response = await fetch(`${config.baseUrl}${config.healthCheck.endpoint}`, {
          method: 'GET',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);
        const latency = Date.now() - start;

        healthStatus[name] = {
          healthy: response.ok,
          latency,
          error: response.ok ? undefined : `HTTP ${response.status}`,
        };
      } catch (error: any) {
        const latency = Date.now() - start;
        healthStatus[name] = {
          healthy: false,
          latency,
          error: error.message || 'Connection failed',
        };
      }
    });

    await Promise.all(checkPromises);
    return healthStatus;
  }

  /**
   * Get endpoint configuration by route
   * Supports parameter matching (e.g., /api/rules/:id)
   */
  getEndpoint(method: string, path: string): EndpointConfig | undefined {
    // Try exact match first
    const exactMatch = this.routeMap.get(`${method} ${path}`);
    if (exactMatch) return exactMatch;

    // Try parameter matching
    return Array.from(this.endpoints.values()).find(endpoint => {
      if (endpoint.method !== method) return false;

      const pattern = endpoint.path.replace(/:[^\/]+/g, '[^/]+');
      const regex = new RegExp(`^${pattern}$`);
      return regex.test(path);
    });
  }

  /**
   * Get service configuration
   */
  getService(serviceId: string): ServiceConfig | undefined {
    return this.services.get(serviceId);
  }

  /**
   * Get all endpoints for a service
   */
  getEndpointsByService(serviceId: string): EndpointConfig[] {
    return Array.from(this.endpoints.values()).filter(e => e.serviceId === serviceId);
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
      hotelHybridEndpoints: HOTEL_HYBRID_ENDPOINTS.length,
      b2bAdminEndpoints:
        B2B_ADMIN_COMPANY_ENDPOINTS.length +
        B2B_ADMIN_USER_ENDPOINTS.length +
        B2B_ADMIN_BOOKING_ENDPOINTS.length +
        B2B_ADMIN_FINANCE_ENDPOINTS.length +
        B2B_ADMIN_SUPPLIER_ENDPOINTS.length +
        B2B_ADMIN_RULE_ENDPOINTS.length,
      bookingEngineEndpoints:
        BOOKING_ENGINE_FLIGHT_ENDPOINTS.length +
        BOOKING_ENGINE_HOTEL_ENDPOINTS.length +
        BOOKING_ENGINE_OFFLINE_ENDPOINTS.length,
      services: Array.from(this.services.keys()),
    };
  }
}

export default new APIManager();
