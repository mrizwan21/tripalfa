// Validation schemas using Zod for API Gateway forms
import { z } from "zod";

type Environment = "development" | "staging" | "production";

// ============================================================================
// AUTHENTICATION SCHEMAS
// ============================================================================

const apiKeyAuthSchema = z.object({
  type: z.literal("api-key"),
  credentials: z.object({
    apiKey: z.string().min(1, "API key is required"),
    keyLocation: z.enum(["header", "query"]).optional(),
  }),
});

const oauth2AuthSchema = z.object({
  type: z.literal("oauth2"),
  credentials: z.object({
    clientId: z.string().min(1, "Client ID is required"),
    clientSecret: z.string().min(1, "Client secret is required"),
    tokenUrl: z.string().url("Valid token URL required"),
    scopes: z.array(z.string()).optional(),
  }),
});

const jwtAuthSchema = z.object({
  type: z.literal("jwt"),
  credentials: z.object({
    secret: z.string().min(1, "JWT secret is required"),
    algorithm: z.string().default("HS256"),
  }),
});

const bearerAuthSchema = z.object({
  type: z.literal("bearer"),
  credentials: z.object({
    token: z.string().min(1, "Bearer token is required"),
  }),
});

const basicAuthSchema = z.object({
  type: z.literal("basic"),
  credentials: z.object({
    username: z.string().min(1, "Username is required"),
    password: z.string().min(1, "Password is required"),
  }),
});

export const authenticationSchema = z.discriminatedUnion("type", [
  apiKeyAuthSchema,
  oauth2AuthSchema,
  jwtAuthSchema,
  bearerAuthSchema,
  basicAuthSchema,
]);

// ============================================================================
// ENDPOINT SCHEMAS
// ============================================================================

export const endpointSchema = z.object({
  name: z.string().min(1, "Endpoint name is required"),
  method: z.enum(["GET", "POST", "PUT", "PATCH", "DELETE"]),
  url: z.string().url("Valid URL path required"),
  description: z.string().optional(),
  timeout: z
    .number()
    .min(1000, "Minimum 1 second")
    .max(60000, "Maximum 60 seconds"),
  retryPolicy: z.object({
    maxRetries: z.number().min(0).max(5),
    backoffMultiplier: z.number().min(1).max(5),
    initialDelay: z.number().min(100),
  }),
  headers: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string(),
      type: z.enum(["authorization", "api-key", "custom"]),
      isRequired: z.boolean(),
      isSensitive: z.boolean().optional(),
    }),
  ),
  queryParameters: z.array(
    z.object({
      name: z.string().min(1),
      value: z.string().optional(),
      type: z.enum(["static", "dynamic", "conditional"]),
      isRequired: z.boolean(),
    }),
  ),
  cacheEnabled: z.boolean(),
  cacheTTL: z.number().optional(),
});

// ============================================================================
// ENVIRONMENT-SPECIFIC CONFIG SCHEMAS
// ============================================================================

export const developmentConfigSchema = z.object({
  environment: z.literal("development"),
  baseUrl: z.string().url("Valid base URL required"),
  apiVersion: z.string().optional(),
  authenticationType: z.enum(["api-key", "oauth2", "jwt", "bearer", "basic"]),
  authenticationCredentials: z.record(z.string(), z.unknown()),
  headers: z.array(z.any()).optional(),
  queryParameters: z.array(z.any()).optional(),
  endpoints: z.array(z.any()),
  timeout: z.number().min(5000).max(60000),
  maxRetries: z.number().min(0).max(10),
  rateLimit: z.number().optional(),
  requiresSSL: z.boolean(),
  monitoringEnabled: z.boolean(),
  // Development: more permissive
});

export const stagingConfigSchema = z.object({
  environment: z.literal("staging"),
  baseUrl: z.string().url("Valid base URL required"),
  apiVersion: z.string(),
  authenticationType: z.enum(["api-key", "oauth2", "jwt", "bearer", "basic"]),
  authenticationCredentials: z.record(z.string(), z.unknown()),
  headers: z.array(z.any()),
  queryParameters: z.array(z.any()),
  endpoints: z.array(z.any()).min(1, "At least one endpoint required"),
  timeout: z.number().min(5000).max(30000),
  maxRetries: z.number().min(1).max(5),
  rateLimit: z.number().optional(),
  requiresSSL: z.literal(true),
  monitoringEnabled: z.literal(true),
});

export const productionConfigSchema = z.object({
  environment: z.literal("production"),
  baseUrl: z.string().url("Valid base URL required"),
  apiVersion: z.string(),
  authenticationType: z.enum(["api-key", "oauth2", "jwt", "bearer", "basic"]),
  authenticationCredentials: z
    .record(z.string(), z.unknown())
    .refine(
      (credentials) => Object.keys(credentials).length > 0,
      "At least one credential is required",
    ),
  headers: z.array(z.any()),
  queryParameters: z.array(z.any()),
  endpoints: z.array(z.any()).min(1, "At least one endpoint required"),
  timeout: z.number().min(5000).max(15000),
  maxRetries: z.number().min(0).max(3),
  rateLimit: z.number().optional(),
  requiresSSL: z.literal(true),
  monitoringEnabled: z.literal(true),
  // Production: strict validation
});

// ============================================================================
// ROUTING SCHEMAS
// ============================================================================

export const geographyRoutingSchema = z.object({
  geography: z.string().min(1, "Geography name required"),
  geographyType: z.enum(["global", "regional", "country"]),
  countryCode: z.string().optional(),
  regionCode: z.string().optional(),
  preferredEndpoint: z.string().min(1, "Primary endpoint required"),
  fallbackEndpointIds: z.array(z.string()),
  isActive: z.boolean(),
});

export const channelRoutingSchema = z.object({
  channel: z.enum(["web", "mobile", "b2b", "b2c", "api"]),
  priority: z.number().min(1).max(10),
  preferredEndpoint: z.string().min(1, "Endpoint required"),
  fallbackEndpointIds: z.array(z.string()),
  isActive: z.boolean(),
});

// ============================================================================
// GATEWAY FORM SCHEMAS
// ============================================================================

const environmentSpecificConfigSchema = z.discriminatedUnion("environment", [
  developmentConfigSchema,
  stagingConfigSchema,
  productionConfigSchema,
]);

export const gatewayFormSchema = z.object({
  environments: z
    .array(environmentSpecificConfigSchema)
    .min(1, "At least one environment required"),
  activeEnvironment: z.enum(["development", "staging", "production"]),
  globalHeaders: z.array(z.any()),
  globalQueryParameters: z.array(z.any()),
  productConfigs: z.array(
    z.object({
      productId: z.string().min(1),
      endpoints: z.array(z.any()),
    }),
  ),
  geographyRoutings: z.array(geographyRoutingSchema),
  channelRoutings: z.array(channelRoutingSchema),
  allowDevelopment: z.boolean(),
  requireStagingApproval: z.boolean(),
  requireProductionApproval: z.boolean(),
  productionDeploymentWindow: z
    .object({
      dayOfWeek: z.number().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
      endTime: z.string().regex(/^\d{2}:\d{2}$/, "Invalid time format"),
    })
    .optional(),
  notes: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

// ============================================================================
// VALIDATION FUNCTIONS
// ============================================================================

export const validateEnvironmentConfig = (
  data: unknown,
  environment: Environment,
) => {
  if (environment === "development") {
    return developmentConfigSchema.safeParse(data);
  } else if (environment === "staging") {
    return stagingConfigSchema.safeParse(data);
  } else if (environment === "production") {
    return productionConfigSchema.safeParse(data);
  }
  return { success: false, error: new Error("Invalid environment") };
};

export const validateGatewayForm = (data: unknown) => {
  return gatewayFormSchema.safeParse(data);
};

export const validateEndpoint = (data: unknown) => {
  return endpointSchema.safeParse(data);
};

export const validateAuthentication = (data: unknown) => {
  return authenticationSchema.safeParse(data);
};

export const validateGeographyRouting = (data: unknown) => {
  return geographyRoutingSchema.safeParse(data);
};

export const validateChannelRouting = (data: unknown) => {
  return channelRoutingSchema.safeParse(data);
};

// ============================================================================
// ERROR FORMATTER
// ============================================================================

export const formatValidationErrors = (
  errors: z.ZodError["issues"] | undefined,
): Record<string, string> => {
  if (!errors) return {};

  return errors.reduce(
    (acc, error) => {
      const path = error.path.join(".");
      acc[path] = error.message;
      return acc;
    },
    {} as Record<string, string>,
  );
};
