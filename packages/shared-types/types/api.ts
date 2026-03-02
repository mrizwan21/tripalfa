// ============================================================================
// TripAlfa Shared Types - API Types
// Request/Response types, Pagination, Errors, Common API patterns
// ============================================================================

// ============================================================================
// Pagination Types
// ============================================================================
export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

// ============================================================================
// API Response Types
// ============================================================================
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  timestamp: string;
  requestId?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: ApiError;
  timestamp: string;
  requestId?: string;
}

export interface ApiError {
  code: string;
  message: string;
  details?: ApiErrorDetail[];
  stack?: string;
}

export interface ApiErrorDetail {
  field?: string;
  message: string;
  code?: string;
}

// ============================================================================
// HTTP Error Codes
// ============================================================================
export type HttpStatusCode =
  | 200 // OK
  | 201 // Created
  | 204 // No Content
  | 400 // Bad Request
  | 401 // Unauthorized
  | 403 // Forbidden
  | 404 // Not Found
  | 409 // Conflict
  | 422 // Unprocessable Entity
  | 429 // Too Many Requests
  | 500 // Internal Server Error
  | 502 // Bad Gateway
  | 503 // Service Unavailable
  | 504; // Gateway Timeout

// ============================================================================
// API Error Codes
// ============================================================================
export const API_ERROR_CODES = {
  // Authentication
  AUTH_REQUIRED: "AUTH_REQUIRED",
  INVALID_CREDENTIALS: "INVALID_CREDENTIALS",
  TOKEN_EXPIRED: "TOKEN_EXPIRED",
  TOKEN_INVALID: "TOKEN_INVALID",
  REFRESH_TOKEN_EXPIRED: "REFRESH_TOKEN_EXPIRED",
  SESSION_EXPIRED: "SESSION_EXPIRED",

  // Authorization
  FORBIDDEN: "FORBIDDEN",
  INSUFFICIENT_PERMISSIONS: "INSUFFICIENT_PERMISSIONS",
  ROLE_NOT_ALLOWED: "ROLE_NOT_ALLOWED",

  // Validation
  VALIDATION_ERROR: "VALIDATION_ERROR",
  INVALID_INPUT: "INVALID_INPUT",
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FORMAT: "INVALID_FORMAT",

  // Resource
  NOT_FOUND: "NOT_FOUND",
  ALREADY_EXISTS: "ALREADY_EXISTS",
  CONFLICT: "CONFLICT",
  DELETED: "DELETED",

  // Business Logic
  BUSINESS_RULE_VIOLATION: "BUSINESS_RULE_VIOLATION",
  INSUFFICIENT_BALANCE: "INSUFFICIENT_BALANCE",
  BOOKING_NOT_ALLOWED: "BOOKING_NOT_ALLOWED",
  BOOKING_FAILED: "BOOKING_FAILED",
  PAYMENT_FAILED: "PAYMENT_FAILED",
  REFUND_NOT_ALLOWED: "REFUND_NOT_ALLOWED",

  // Rate Limiting
  RATE_LIMIT_EXCEEDED: "RATE_LIMIT_EXCEEDED",
  QUOTA_EXCEEDED: "QUOTA_EXCEEDED",

  // External Services
  SUPPLIER_ERROR: "SUPPLIER_ERROR",
  GDS_ERROR: "GDS_ERROR",
  PAYMENT_GATEWAY_ERROR: "PAYMENT_GATEWAY_ERROR",
  EXTERNAL_SERVICE_ERROR: "EXTERNAL_SERVICE_ERROR",
  TIMEOUT_ERROR: "TIMEOUT_ERROR",

  // Server
  INTERNAL_ERROR: "INTERNAL_ERROR",
  SERVICE_UNAVAILABLE: "SERVICE_UNAVAILABLE",
  DATABASE_ERROR: "DATABASE_ERROR",
} as const;

export type ApiErrorCode =
  (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

// ============================================================================
// Filter/Search Types
// ============================================================================
export interface DateRangeFilter {
  from?: string;
  to?: string;
}

export interface NumberRangeFilter {
  min?: number;
  max?: number;
}

export interface SearchParams {
  query?: string;
  fields?: string[];
}

export interface FilterOperator {
  eq?: unknown;
  ne?: unknown;
  gt?: number | string;
  gte?: number | string;
  lt?: number | string;
  lte?: number | string;
  in?: unknown[];
  notIn?: unknown[];
  contains?: string;
  startsWith?: string;
  endsWith?: string;
  isNull?: boolean;
}

// ============================================================================
// Bulk Operations
// ============================================================================
export interface BulkOperationResult {
  totalCount: number;
  successCount: number;
  failureCount: number;
  errors?: BulkOperationError[];
}

export interface BulkOperationError {
  index: number;
  id?: string;
  error: string;
}

export interface BulkDeleteRequest {
  ids: string[];
}

export interface BulkUpdateRequest<T> {
  ids: string[];
  data: Partial<T>;
}

// ============================================================================
// Export/Import Types
// ============================================================================
export interface ExportRequest {
  format: "csv" | "xlsx" | "pdf" | "json";
  filters?: Record<string, unknown>;
  columns?: string[];
  fileName?: string;
}

export interface ExportResponse {
  downloadUrl: string;
  fileName: string;
  fileSize: number;
  expiresAt: string;
}

export interface ImportRequest {
  fileUrl: string;
  mapping?: Record<string, string>;
  options?: {
    skipDuplicates?: boolean;
    updateExisting?: boolean;
    validateOnly?: boolean;
  };
}

export interface ImportResult {
  totalRows: number;
  importedCount: number;
  skippedCount: number;
  errorCount: number;
  errors?: ImportError[];
}

export interface ImportError {
  row: number;
  column?: string;
  value?: unknown;
  error: string;
}

// ============================================================================
// File Upload Types
// ============================================================================
export interface UploadUrlRequest {
  fileName: string;
  contentType: string;
  fileSize: number;
}

export interface UploadUrlResponse {
  uploadUrl: string;
  fileKey: string;
  expiresAt: string;
}

export interface FileUploadComplete {
  fileKey: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
}

// ============================================================================
// Webhook Types
// ============================================================================
export interface WebhookPayload<T = unknown> {
  event: string;
  timestamp: string;
  data: T;
  signature?: string;
}

export interface WebhookDelivery {
  id: string;
  webhookId: string;
  event: string;
  payload: unknown;
  responseCode?: number;
  responseBody?: string;
  deliveredAt?: string;
  failedAt?: string;
  error?: string;
  attempts: number;
}

// ============================================================================
// Real-time Types
// ============================================================================
export interface SocketEvent<T = unknown> {
  event: string;
  data: T;
  room?: string;
  timestamp: string;
}

export interface SubscriptionRequest {
  channel: string;
  filters?: Record<string, unknown>;
}

// ============================================================================
// Search Suggestions
// ============================================================================
export interface SearchSuggestion {
  type: string;
  id: string;
  label: string;
  subtitle?: string;
  icon?: string;
  score?: number;
}

export interface SearchSuggestionsResponse {
  suggestions: SearchSuggestion[];
  totalResults: number;
}

// ============================================================================
// Health Check Types
// ============================================================================
export interface HealthCheckResponse {
  status: "healthy" | "degraded" | "unhealthy";
  version: string;
  timestamp: string;
  services: ServiceHealth[];
  uptime: number;
}

export interface ServiceHealth {
  name: string;
  status: "healthy" | "degraded" | "unhealthy";
  latency?: number;
  lastCheck: string;
  error?: string;
}

// ============================================================================
// API Request Context
// ============================================================================
export interface RequestContext {
  requestId: string;
  userId?: string;
  companyId?: string;
  userType?: string;
  ipAddress?: string;
  userAgent?: string;
  correlationId?: string;
}

// ============================================================================
// Rate Limit Info
// ============================================================================
export interface RateLimitInfo {
  limit: number;
  remaining: number;
  reset: number;
  retryAfter?: number;
}
