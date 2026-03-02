// API Gateway Types for Supplier Management Module
// Dynamic configuration for API endpoints mapped to products, geographies, channels

import type { SupplierProduct } from "./types.js";

// ============================================================================
// ENVIRONMENT TYPES
// ============================================================================

export type Environment = "development" | "staging" | "production";

export interface EnvironmentConfig {
  environment: Environment;
  baseUrl: string;
  apiVersion: string;
  isProduction: boolean;
  requiresSSL: boolean;
  allowCORS: boolean;
  rateLimit: number; // requests per second
  timeout: number; // milliseconds
  requiresApproval: boolean;
  requiresMonitoring: boolean;
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  logging: {
    enabled: boolean;
    logSensitiveData: boolean;
    logLevel: "debug" | "info" | "warn" | "error";
  };
  monitoring: {
    enabled: boolean;
    alertsEnabled: boolean;
    metricsCollectionInterval: number; // milliseconds
  };
  security: {
    verifyCertificates: boolean;
    encryptionRequired: boolean;
    minimumTLSVersion: string;
    allowedIPs?: string[];
  };
}

export const ENVIRONMENT_CONFIGS: Record<Environment, EnvironmentConfig> = {
  development: {
    environment: "development",
    baseUrl: "https://api-sandbox.supplier.local",
    apiVersion: "v1-beta",
    isProduction: false,
    requiresSSL: false,
    allowCORS: true,
    rateLimit: 1000,
    timeout: 30000,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 2,
      initialDelay: 500,
    },
    logging: {
      enabled: true,
      logSensitiveData: true,
      logLevel: "debug",
    },
    monitoring: {
      enabled: true,
      alertsEnabled: false,
      metricsCollectionInterval: 60000,
    },
    security: {
      verifyCertificates: false,
      encryptionRequired: false,
      minimumTLSVersion: "1.2",
    },
    requiresApproval: false,
    requiresMonitoring: true,
  },
  staging: {
    environment: "staging",
    baseUrl: "https://api-staging.supplier.com",
    apiVersion: "v1",
    isProduction: false,
    requiresSSL: true,
    allowCORS: true,
    rateLimit: 500,
    timeout: 15000,
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 1.5,
      initialDelay: 1000,
    },
    logging: {
      enabled: true,
      logSensitiveData: false,
      logLevel: "info",
    },
    monitoring: {
      enabled: true,
      alertsEnabled: true,
      metricsCollectionInterval: 30000,
    },
    security: {
      verifyCertificates: true,
      encryptionRequired: true,
      minimumTLSVersion: "1.3",
    },
    requiresApproval: true,
    requiresMonitoring: true,
  },
  production: {
    environment: "production",
    baseUrl: "https://api.supplier.com",
    apiVersion: "v1",
    isProduction: true,
    requiresSSL: true,
    allowCORS: false,
    rateLimit: 100,
    timeout: 10000,
    retryPolicy: {
      maxRetries: 2,
      backoffMultiplier: 1.5,
      initialDelay: 2000,
    },
    logging: {
      enabled: true,
      logSensitiveData: false,
      logLevel: "warn",
    },
    monitoring: {
      enabled: true,
      alertsEnabled: true,
      metricsCollectionInterval: 10000,
    },
    security: {
      verifyCertificates: true,
      encryptionRequired: true,
      minimumTLSVersion: "1.3",
    },
    requiresApproval: true,
    requiresMonitoring: true,
  },
};

// ============================================================================
// GATEWAY CONFIGURATION TYPES
// ============================================================================

export type APIEnvironment = "test" | "production";
export type GatewayStatus = "active" | "inactive" | "testing" | "pending";
export type HeaderType = "authorization" | "api-key" | "custom";
export type QueryParamType = "static" | "dynamic" | "conditional";
export type ChannelType = "web" | "mobile" | "b2b" | "b2c" | "api";
export type GeographyType = "global" | "regional" | "country";
export type AuthenticationType =
  | "api-key"
  | "oauth2"
  | "jwt"
  | "bearer"
  | "basic";
export type GatewayConfig = SupplierAPIGateway;

export interface CredentialValidation {
  isValid: boolean;
  errors?: string[];
  expiresAt?: string;
  scopes?: string[];
}

export interface GatewayTestResponse {
  success: boolean;
  responseTime: number;
  statusCode: number;
  responseData?: any;
  error?: string;
  environment: Environment;
  endpointId: string;
  timestamp: Date;
}

// ============================================================================
// HEADER & PARAMETER CONFIGURATION
// ============================================================================

export interface APIHeader {
  id: string;
  name: string;
  value: string;
  type: HeaderType;
  isRequired: boolean;
  isSensitive: boolean;
  description?: string;
}

export interface QueryParameter {
  id: string;
  name: string;
  value: string | null;
  type: QueryParamType;
  isRequired: boolean;
  description?: string;
  defaultValue?: string;
  validationRule?: string;
}

export interface RequestTransformation {
  id: string;
  fieldName: string;
  transformationType: "map" | "transform" | "validate" | "aggregate";
  sourceField: string;
  targetField: string;
  rule?: string;
  example?: string;
}

export interface ResponseMapping {
  id: string;
  supplierField: string;
  internalField: string;
  dataType: "string" | "number" | "boolean" | "date" | "object" | "array";
  isRequired: boolean;
  transformation?: string;
  defaultValue?: any;
  validation?: string;
}

// ============================================================================
// ENDPOINT CONFIGURATION
// ============================================================================

export interface APIEndpoint {
  id: string;
  name: string;
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  url: string;
  description?: string;
  timeout: number; // milliseconds
  retryPolicy: {
    maxRetries: number;
    backoffMultiplier: number;
    initialDelay: number;
  };
  headers: APIHeader[];
  queryParameters: QueryParameter[];
  requestBody?: {
    contentType:
      | "application/json"
      | "application/x-www-form-urlencoded"
      | "multipart/form-data";
    schema?: any;
  };
  responseMapping: ResponseMapping[];
  rateLimit?: {
    requestsPerSecond: number;
    burstSize: number;
  };
  errorHandling: {
    retryableStatusCodes: number[];
    fallbackEndpoint?: string;
    errorMapping: Record<number, string>;
  };
  testSettings?: {
    testUrl?: string;
    mockResponse?: any;
    testHeaders?: Record<string, string>;
  };
}

// ============================================================================
// PRODUCT-SPECIFIC GATEWAY CONFIGURATION
// ============================================================================

export interface ProductGatewayConfig {
  id: string;
  productId: string;
  productName: string;
  isActive: boolean;
  endpoints: APIEndpoint[];
}

// ============================================================================
// GEOGRAPHY & CHANNEL ROUTING
// ============================================================================

export interface GeographyRouting {
  id: string;
  geography: string;
  geographyType: GeographyType;
  countryCode?: string;
  regionCode?: string;
  preferredEndpoint: string;
  fallbackEndpointIds: string[];
  isActive: boolean;
}

export interface ChannelRouting {
  id: string;
  channel: ChannelType;
  priority: number;
  preferredEndpoint: string;
  fallbackEndpointIds: string[];
  isActive: boolean;
}

// ============================================================================
// ENVIRONMENT-SPECIFIC GATEWAY CONFIGURATION
// ============================================================================

export interface EnvironmentSpecificGateway {
  environment: Environment; // development, staging, production
  isActive: boolean;
  baseUrl: string;
  apiVersion: string;

  // Environment-specific credentials
  authentication: {
    type: "api-key" | "oauth2" | "jwt" | "bearer" | "basic";
    credentials: {
      [key: string]: string; // Stored securely in backend
    };
    refreshUrl?: string;
    refreshInterval?: number; // seconds
    expiresAt?: Date;
  };

  // Environment-specific headers & parameters
  headers: APIHeader[];
  queryParameters: QueryParameter[];

  // Environment-specific endpoints
  endpoints: APIEndpoint[];

  // Environment settings
  settings: {
    timeout: number;
    retryPolicy: {
      maxRetries: number;
      backoffMultiplier: number;
      initialDelay: number;
    };
    rateLimit?: number;
    requiresSSL: boolean;
  };

  // Environment-specific monitoring
  monitoring: {
    enabled: boolean;
    alertThresholds: {
      errorRate: number;
      latency: number;
    };
  };

  // Status tracking
  lastTestDate?: Date;
  lastTestStatus?: "success" | "failure";
  deployedAt?: Date;
}

// ============================================================================
// GATEWAY PROFILE (MAIN AGGREGATE)
// ============================================================================

export interface SupplierAPIGateway {
  id: string;
  supplierId: string;
  supplier?: SupplierProfile;

  // Multi-environment support
  environments: {
    development?: EnvironmentSpecificGateway;
    staging?: EnvironmentSpecificGateway;
    production?: EnvironmentSpecificGateway;
  };

  // Active environment
  activeEnvironment: Environment;
  status: GatewayStatus;

  // Global Configuration (applies to all environments)
  globalConfiguration: {
    // Global Headers & Parameters
    globalHeaders: APIHeader[];
    globalQueryParameters: QueryParameter[];

    // Product Configurations
    productConfigs: ProductGatewayConfig[];

    // Routing Rules
    geographyRoutings: GeographyRouting[];
    channelRoutings: ChannelRouting[];

    // Transformations
    requestTransformations: RequestTransformation[];
    responseTransformations: ResponseMapping[];
  };

  // Monitoring & Analytics (aggregated across all environments)
  monitoring: {
    enabled: boolean;
    trackingFields: string[];
    collectMetrics: boolean;
    metricsRetentionDays: number;
  };

  // Environment Management
  environmentManagement: {
    allowDevelopment: boolean;
    requireStagingApproval: boolean;
    requireProductionApproval: boolean;
    productionDeploymentWindow?: {
      dayOfWeek: number; // 0-6
      startTime: string; // HH:MM
      endTime: string; // HH:MM
    };
    changeLog: Array<{
      timestamp: Date;
      environment: Environment;
      changedBy: string;
      changeType: "created" | "updated" | "deployed" | "reverted";
      details: string;
    }>;
  };

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdBy: string;
  lastModifiedBy: string;
  notes?: string;
  tags?: string[];
}

// ============================================================================
// GATEWAY FORM DATA (For Create/Update)
// ============================================================================

export interface SupplierAPIGatewayFormData {
  // Environment selection
  selectedEnvironment?: Environment;
  selectedProducts?: string[];
  selectedAuthType?: AuthenticationType;
  endpoints?: any[];

  environments: Array<{
    environment: Environment;
    isActive: boolean;
    baseUrl: string;
    apiVersion?: string;
    authenticationType: "api-key" | "oauth2" | "jwt" | "bearer" | "basic";
    authenticationCredentials: Record<string, string>;
    headers: Omit<APIHeader, "id">[];
    queryParameters: Omit<QueryParameter, "id">[];
    endpoints: Omit<APIEndpoint, "id">[];
    timeout: number;
    maxRetries: number;
    rateLimit?: number;
    requiresSSL: boolean;
    monitoringEnabled: boolean;
  }>;

  activeEnvironment: Environment;

  // Global configuration
  globalHeaders: Omit<APIHeader, "id">[];
  globalQueryParameters: Omit<QueryParameter, "id">[];
  productConfigs: Array<{
    productId: string;
    endpoints: Omit<APIEndpoint, "id">[];
  }>;
  geographyRoutings: Omit<GeographyRouting, "id">[];
  channelRoutings: Omit<ChannelRouting, "id">[];

  // Environment management
  allowDevelopment: boolean;
  requireStagingApproval: boolean;
  requireProductionApproval: boolean;
  productionDeploymentWindow?: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  };

  notes?: string;
  tags?: string[];
}

// ============================================================================
// ENVIRONMENT PROMOTION & DEPLOYMENT
// ============================================================================

export interface EnvironmentPromotionRequest {
  gatewaySupplierId: string;
  fromEnvironment: Environment;
  toEnvironment: Environment;
  changeDescription: string;
  requiresApproval: boolean;
  approvers?: string[];
}

export interface EnvironmentPromotionApproval {
  id: string;
  promotionId: string;
  approverName: string;
  approverEmail: string;
  approvedAt: Date;
  comments?: string;
}

export interface EnvironmentSwitchedEvent {
  gatewaySupplierId: string;
  previousEnvironment: Environment;
  currentEnvironment: Environment;
  switchedBy: string;
  switchedAt: Date;
  reason?: string;
}

export interface EnvironmentComparison {
  gatewaySupplierId: string;
  environment1: Environment;
  environment2: Environment;
  differences: {
    baseUrl: boolean;
    apiVersion: boolean;
    authentication: boolean;
    endpoints: {
      added: string[]; // endpoint IDs
      removed: string[]; // endpoint IDs
      modified: string[]; // endpoint IDs
    };
    headers: {
      added: string[]; // header names
      removed: string[]; // header names
      modified: string[]; // header names
    };
    queryParameters: {
      added: string[]; // param names
      removed: string[]; // param names
      modified: string[]; // param names
    };
  };
  comparedAt: Date;
}

// ============================================================================
// ENVIRONMENT-SPECIFIC TESTING
// ============================================================================

export interface EnvironmentEndpointTest {
  id: string;
  environment: Environment;
  endpointId: string;
  testName: string;
  description?: string;
  isActive: boolean;
  testData: Record<string, any>;
  expectedStatusCode: number;
  expectedResponseStructure?: any;
  timeout: number;
  lastRun?: {
    timestamp: Date;
    duration: number;
    statusCode: number;
    success: boolean;
    error?: string;
    environment: Environment;
  };
}

export interface EnvironmentHealthCheck {
  gatewaySupplierId: string;
  environment: Environment;
  timestamp: Date;
  overallStatus: "healthy" | "degraded" | "unhealthy";
  checks: {
    connectivity: {
      status: "ok" | "error";
      responseTime: number;
      lastChecked: Date;
    };
    authentication: {
      status: "ok" | "error";
      credentialValid: boolean;
      expiresIn?: number;
      lastChecked: Date;
    };
    endpoints: {
      status: "ok" | "error";
      totalEndpoints: number;
      healthyEndpoints: number;
      failedEndpoints: number;
      lastChecked: Date;
    };
    performance: {
      status: "ok" | "error";
      averageLatency: number;
      errorRate: number;
      lastChecked: Date;
    };
  };
  issues: Array<{
    severity: "info" | "warning" | "error" | "critical";
    message: string;
    affectedEndpoints?: string[];
    suggestedAction: string;
  }>;
}

// ============================================================================
// ENDPOINT TEST CONFIGURATION
// ============================================================================

export interface EndpointTest {
  id: string;
  endpointId: string;
  environment: Environment;
  testName: string;
  description?: string;
  isActive: boolean;
  testData: Record<string, any>;
  expectedStatusCode: number;
  expectedResponseStructure?: any;
  timeout: number;
  lastRun?: {
    timestamp: Date;
    duration: number;
    statusCode: number;
    success: boolean;
    error?: string;
    environment: Environment;
  };
}

// ============================================================================
// GATEWAY ANALYTICS & MONITORING
// ============================================================================

export interface GatewayMetrics {
  gatewaySupplierId: string;
  environment: Environment;
  period: "hour" | "day" | "week" | "month";
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  errorRate: number; // percentage
  averageResponseTime: number; // milliseconds
  p95ResponseTime: number;
  p99ResponseTime: number;
  maxResponseTime: number;
  minResponseTime: number;
  requestsByEndpoint: Record<string, number>;
  requestsByGeography: Record<string, number>;
  requestsByChannel: Record<string, number>;
  topErrors: Array<{
    statusCode: number;
    count: number;
    message: string;
  }>;
  timestamp: Date;
}

export interface GatewayAlert {
  id: string;
  gatewaySupplierId: string;
  environment: Environment;
  severity: "info" | "warning" | "error" | "critical";
  alertType:
    | "high_error_rate"
    | "high_latency"
    | "credential_expiring"
    | "endpoint_down"
    | "quota_exceeded"
    | "environment_unhealthy";
  message: string;
  details: Record<string, any>;
  isResolved: boolean;
  createdAt: Date;
  resolvedAt?: Date;
  actionsTaken?: string[];
}

// ============================================================================
// API RESPONSES
// ============================================================================

export interface SupplierAPIGatewayResponse {
  gateway: SupplierAPIGateway;
  products: SupplierProduct[];
  activeEnvironment: Environment;
  metrics?: GatewayMetrics;
  lastTest?: {
    environment: Environment;
    timestamp: Date;
    success: boolean;
  };
  alerts?: GatewayAlert[];
  healthCheck?: {
    environment: Environment;
    status: "healthy" | "degraded" | "unhealthy";
    lastChecked: Date;
  };
}

export interface GatewayListResponse {
  gateways: SupplierAPIGateway[];
  total: number;
  page: number;
  limit: number;
}

export interface GatewayEndpointsResponse {
  endpoints: APIEndpoint[];
  productId: string;
  productName: string;
  environment: Environment;
  count: number;
}

// ============================================================================
// GATEWAY HEALTH CHECK
// ============================================================================

export interface GatewayHealthCheckResult {
  gatewaySupplierId: string;
  environment: Environment;
  overallStatus: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  checks: {
    authenticationStatus: {
      status: "ok" | "warning" | "error";
      message: string;
      credentialExpiry?: Date;
      environment: Environment;
    };
    endpointConnectivity: {
      status: "ok" | "warning" | "error";
      checkedEndpoints: number;
      failedEndpoints: number;
      failedEndpointIds: string[];
      environment: Environment;
    };
    responseValidation: {
      status: "ok" | "warning" | "error";
      lastValidationTime?: Date;
      validationErrors?: string[];
      environment: Environment;
    };
    performanceMetrics: {
      status: "ok" | "warning" | "error";
      averageLatency: number;
      errorRate: number;
      environment: Environment;
    };
  };
  issuesFound: Array<{
    severity: "low" | "medium" | "high";
    category: string;
    message: string;
    suggestedAction: string;
    environment: Environment;
  }>;
}

// ============================================================================
// GATEWAY CONFIGURATION TEMPLATES
// ============================================================================

export interface GatewayTemplate {
  id: string;
  name: string;
  description: string;
  category: string; // 'GDS', 'Booking', 'Inventory', etc.
  baseConfiguration: Partial<SupplierAPIGateway>;
  commonEndpoints: APIEndpoint[];
  productMappings: Record<string, Partial<ProductGatewayConfig>>;
  createdBy: string;
  isPublic: boolean;
}

// ============================================================================
// IMPORTED TYPES (for reference)
// ============================================================================

export type SupplierProfile = any; // Imported from shared types
