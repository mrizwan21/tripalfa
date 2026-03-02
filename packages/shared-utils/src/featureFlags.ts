/**
 * Feature Flag System for Booking Management V2
 *
 * This module provides environment-based and user-segment based feature flags
 * for gradual rollout of the V2 booking management system.
 *
 * Infrastructure Flags (Environment Variables):
 * - BOOKING_V2_GATEWAY_ENABLED
 * - BOOKING_V2_BACKEND_ENABLED
 * - BOOKING_V2_FRONTEND_ENABLED
 *
 * User Segment Flags (Database/Config):
 * - enabled_segments: ["internal", "staging", "prod_10pct"]
 * - enabled_users: ["admin@tripalfa.com"]
 * - rollout_percentage: 0-100
 */

// ============================================
// Environment Configuration Types
// ============================================

export interface FeatureFlagConfig {
  // Infrastructure flags
  gatewayEnabled: boolean;
  backendEnabled: boolean;
  frontendEnabled: boolean;

  // User segment flags
  enabledSegments: string[];
  enabledUsers: string[];
  rolloutPercentage: number;

  // Global override (for emergency kill switch)
  globalEnabled: boolean;
}

export interface UserContext {
  userId: string;
  email: string;
  segment?: string;
  role?: string;
}

// ============================================
// Default Configuration
// ============================================

const DEFAULT_CONFIG: FeatureFlagConfig = {
  gatewayEnabled: process.env.BOOKING_V2_GATEWAY_ENABLED === "true",
  backendEnabled: process.env.BOOKING_V2_BACKEND_ENABLED === "true",
  frontendEnabled: process.env.BOOKING_V2_FRONTEND_ENABLED === "true",
  enabledSegments: (
    process.env.BOOKING_V2_ENABLED_SEGMENTS || "internal,staging"
  ).split(","),
  enabledUsers: (process.env.BOOKING_V2_ENABLED_USERS || "")
    .split(",")
    .filter(Boolean),
  rolloutPercentage: parseInt(
    process.env.BOOKING_V2_ROLLOUT_PERCENTAGE || "0",
    10,
  ),
  globalEnabled: process.env.BOOKING_V2_ENABLED === "true",
};

// ============================================
// Feature Flag Evaluation
// ============================================

/**
 * Check if booking V2 is enabled for a given user context
 *
 * Evaluation Order:
 * 1. Check infrastructure flags first (if disabled, return false)
 * 2. Check global override (if enabled, return true)
 * 3. Check user segment (if user in enabled_segments, return true)
 * 4. Check user ID (if user in enabled_users, return true)
 * 5. Check rollout percentage (random selection)
 * 6. Default: false
 */
export function isBookingV2Enabled(
  context: UserContext,
  config: FeatureFlagConfig = DEFAULT_CONFIG,
): boolean {
  // Phase 1: Check infrastructure flags
  if (
    !config.gatewayEnabled ||
    !config.backendEnabled ||
    !config.frontendEnabled
  ) {
    return false;
  }

  // Phase 2: Global override (emergency kill switch)
  if (config.globalEnabled) {
    return true;
  }

  // Phase 3: Check user segment
  if (context.segment && config.enabledSegments.includes(context.segment)) {
    return true;
  }

  // Phase 4: Check specific user IDs
  if (config.enabledUsers.includes(context.email)) {
    return true;
  }

  // Phase 5: Rollout percentage (deterministic based on user ID)
  if (config.rolloutPercentage > 0) {
    const userHash = hashString(context.userId);
    const normalizedHash = userHash % 100;
    if (normalizedHash < config.rolloutPercentage) {
      return true;
    }
  }

  // Default: disabled
  return false;
}

/**
 * Check if a specific V2 feature is enabled
 */
export function isFeatureEnabled(
  feature: "bookings" | "queues" | "pricing" | "invoices" | "payments",
  context: UserContext,
  config: FeatureFlagConfig = DEFAULT_CONFIG,
): boolean {
  // First check if V2 is enabled
  if (!isBookingV2Enabled(context, config)) {
    return false;
  }

  // All features are enabled when V2 is enabled
  return true;
}

// ============================================
// Helper Functions
// ============================================

/**
 * Simple hash function for deterministic user selection
 */
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash);
}

/**
 * Get feature flag configuration from environment
 */
export function getFeatureFlagConfig(): FeatureFlagConfig {
  return { ...DEFAULT_CONFIG };
}

/**
 * Update feature flag configuration (useful for testing)
 */
export function updateFeatureFlagConfig(
  updates: Partial<FeatureFlagConfig>,
): void {
  Object.assign(DEFAULT_CONFIG, updates);
}

// ============================================
// API Endpoints for Feature Flag Management
// ============================================

/**
 * Response for feature flag status endpoint
 */
export interface FeatureFlagStatusResponse {
  bookingV2: {
    enabled: boolean;
    features: {
      bookings: boolean;
      queues: boolean;
      pricing: boolean;
      invoices: boolean;
      payments: boolean;
    };
    config: {
      gatewayEnabled: boolean;
      backendEnabled: boolean;
      frontendEnabled: boolean;
      rolloutPercentage: number;
      enabledSegments: string[];
    };
  };
}

/**
 * Get feature flag status for API response
 */
export function getFeatureFlagStatus(
  context: UserContext,
): FeatureFlagStatusResponse {
  const config = getFeatureFlagConfig();
  const enabled = isBookingV2Enabled(context, config);

  return {
    bookingV2: {
      enabled,
      features: {
        bookings: isFeatureEnabled("bookings", context, config),
        queues: isFeatureEnabled("queues", context, config),
        pricing: isFeatureEnabled("pricing", context, config),
        invoices: isFeatureEnabled("invoices", context, config),
        payments: isFeatureEnabled("payments", context, config),
      },
      config: {
        gatewayEnabled: config.gatewayEnabled,
        backendEnabled: config.backendEnabled,
        frontendEnabled: config.frontendEnabled,
        rolloutPercentage: config.rolloutPercentage,
        enabledSegments: config.enabledSegments,
      },
    },
  };
}

// ============================================
// Constants
// ============================================

export const WORKFLOW_STATES = {
  DRAFT: "draft",
  QUEUED: "queued",
  PRICING: "pricing",
  INVOICED: "invoiced",
  PAYMENT_PENDING: "payment_pending",
  PAYMENT_CONFIRMED: "payment_confirmed",
  SUPPLIER_BOOKING: "supplier_booking",
  CONFIRMED: "confirmed",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
} as const;

export const QUEUE_ACTIONS = {
  SUBMIT: "submit",
  PRICE: "price",
  INVOICE: "invoice",
  CONFIRM_PAYMENT: "confirm_payment",
  BOOK_SUPPLIER: "book_supplier",
  CONFIRM: "confirm",
  COMPLETE: "complete",
  CANCEL: "cancel",
} as const;

export const API_VERSIONS = {
  V1: "v1",
  V2: "v2",
} as const;
