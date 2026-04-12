/**
 * Shared validation utilities for booking-engine-service
 */

export interface ValidationOptions {
  /** Maximum allowed length for the ID */
  maxLength?: number;
  /** Whether to allow colons in the ID (used in some Duffel ID formats) */
  allowColons?: boolean;
}

const DEFAULT_OPTIONS: ValidationOptions = {
  maxLength: 128,
  allowColons: true,
};

/**
 * Validates and sanitizes an ID parameter for API calls.
 *
 * Security features:
 * - Rejects path traversal attempts (.., /, \, %00)
 * - Validates against allowed character set
 * - Enforces length limits to prevent DoS
 * - Returns URL-encoded result for safe use in API paths
 *
 * @param id - The ID to validate
 * @param options - Validation options
 * @returns URL-encoded safe ID string
 * @throws Error if ID is invalid
 *
 * @example
 * validateApiId('off_abc123') // returns 'off_abc123'
 * validateApiId('off_../etc') // throws 'Invalid ID: contains dangerous characters'
 */
function validateApiId(
  id: string,
  options: ValidationOptions = {},
): string {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  if (!id || typeof id !== "string") {
    throw new Error("Invalid ID: ID must be a non-empty string");
  }

  // Length validation FIRST to prevent DoS attacks via regex catastrophic backtracking
  if (id.length === 0 || id.length > opts.maxLength!) {
    throw new Error(
      `Invalid ID: length must be between 1 and ${opts.maxLength} characters`,
    );
  }

  // Check for dangerous characters that could indicate injection attempts
  const dangerousPatterns = ["..", "/", "\\", "%00", "\x00"];
  for (const pattern of dangerousPatterns) {
    if (id.includes(pattern)) {
      throw new Error("Invalid ID: contains dangerous characters");
    }
  }

  // Build regex pattern based on options
  // Base: alphanumeric, underscore, hyphen
  // Optional: colon (for Duffel-style IDs like "off_xxx:yyy")
  const allowedChars = opts.allowColons
    ? /^[a-zA-Z0-9_\-:]+$/
    : /^[a-zA-Z0-9_\-]+$/;

  if (!allowedChars.test(id)) {
    throw new Error("Invalid ID: contains invalid characters");
  }

  // Return URL-encoded for safe API usage
  return encodeURIComponent(id);
}

/**
 * Validates a Duffel API ID.
 * Duffel IDs typically look like: "off_xxx", "ord_xxx", "oar_xxx"
 * Allows alphanumeric, hyphens, underscores, and colons.
 *
 * @param id - The Duffel ID to validate
 * @returns URL-encoded safe ID string
 * @throws Error if ID is invalid
 */
export function validateDuffelId(id: string): string {
  return validateApiId(id, { allowColons: true, maxLength: 128 });
}

/**
 * Validates a LiteAPI ID.
 * LiteAPI IDs are typically alphanumeric with underscores and hyphens.
 * Does not allow colons.
 *
 * @param id - The LiteAPI ID to validate
 * @returns URL-encoded safe ID string
 * @throws Error if ID is invalid
 */
export function validateLiteApiId(id: string): string {
  return validateApiId(id, { allowColons: false, maxLength: 128 });
}

/**
 * Validates an ID is a valid UUID format.
 *
 * @param id - The UUID to validate
 * @returns The UUID string if valid
 * @throws Error if ID is not a valid UUID
 */
function validateUuid(id: string): string {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidRegex.test(id)) {
    throw new Error("Invalid ID: must be a valid UUID");
  }

  return id.toLowerCase();
}
