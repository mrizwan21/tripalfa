// ============================================================
// OTA PLATFORM - SHARED OPENAPI
// ============================================================
// OpenAPI/Swagger specification generator and middleware setup
// ============================================================

import swaggerJSDoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import type { Express } from 'express';

// ============================================================
// BASE OPENAPI CONFIG
// ============================================================

export interface OpenApiConfig {
  serviceName: string;
  serviceVersion: string;
  description: string;
  port: string | number;
  apiDocsPath?: string;
  swaggerDefinition?: Record<string, unknown>;
}

function createOpenApiSpec(config: OpenApiConfig): object {
   const baseDefinition = {
     openapi: '3.0.0',
     info: {
       title: `OTA Platform - ${config.serviceName}`,
       version: config.serviceVersion || '1.0.0',
       description: config.description,
       contact: {
         name: 'TripAlfa API Team',
         email: 'api@tripalfa.com',
       },
     },
     servers: [
       {
         url: `http://localhost:${config.port}`,
         description: 'Local Development',
       },
       {
         url: 'https://api.tripalfa.com',
         description: 'Production',
       },
     ],
     tags: [
       { name: 'Authentication', description: 'Authentication and authorization' },
       { name: 'Users', description: 'User management' },
       { name: 'Roles', description: 'Role and permission management' },
       { name: 'Bookings', description: 'Booking operations' },
       { name: 'Flights', description: 'Flight operations' },
       { name: 'Hotels', description: 'Hotel operations' },
       { name: 'Payments', description: 'Payment operations' },
       { name: 'Audit', description: 'Audit log operations' },
       { name: 'Admin', description: 'Administrative operations' },
     ],
     components: {
       securitySchemes: {
         bearerAuth: {
           type: 'http' as const,
           scheme: 'bearer' as const,
           bearerFormat: 'JWT',
           description: 'JWT Bearer token authentication. Include the JWT token in the Authorization header as \"Bearer <token>\".',
         },
         apiKeyAuth: {
           type: 'apiKey' as const,
           in: 'header' as const,
           name: 'X-API-Key',
           description: 'API key authentication for service-to-service communication.',
         },
       },
       schemas: {
         Error: {
           type: 'object',
           required: ['error', 'message', 'requestId'],
           properties: {
             error: {
               type: 'string',
               description: 'Error code',
               example: 'validation_failed',
             },
             message: {
               type: 'string',
               description: 'Human-readable error message',
               example: 'Validation failed for one or more fields',
             },
             details: {
               type: 'object',
               description: 'Field-specific error details',
               additionalProperties: true,
             },
             requestId: {
               type: 'string',
               description: 'Unique request identifier for debugging',
               example: '550e8400-e29b-41d4-a716-446655440000',
             },
           },
         },
         Error400: {
           allOf: [
             { $ref: '#/components/schemas/Error' },
             {
               properties: {
                 error: { example: 'validation_failed' },
               },
             },
           ],
         },
         Error401: {
           allOf: [
             { $ref: '#/components/schemas/Error' },
             {
               properties: {
                 error: { example: 'unauthorized' },
               },
             },
           ],
         },
         Error403: {
           allOf: [
             { $ref: '#/components/schemas/Error' },
             {
               properties: {
                 error: { example: 'forbidden' },
               },
             },
           ],
         },
         Error404: {
           allOf: [
             { $ref: '#/components/schemas/Error' },
             {
               properties: {
                 error: { example: 'not_found' },
               },
             },
           ],
         },
         Error429: {
           allOf: [
             { $ref: '#/components/schemas/Error' },
             {
               properties: {
                 error: { example: 'rate_limit_exceeded' },
               },
             },
           ],
         },
         Error500: {
           allOf: [
             { $ref: '#/components/schemas/Error' },
             {
               properties: {
                 error: { example: 'internal_server_error' },
               },
             },
           ],
         },
         Pagination: {
           type: 'object',
           properties: {
             page: { type: 'integer', example: 1, minimum: 1 },
             limit: { type: 'integer', example: 50, minimum: 1, maximum: 100 },
             totalItems: { type: 'integer', example: 1000, minimum: 0 },
             totalPages: { type: 'integer', example: 20, minimum: 0 },
             hasNext: { type: 'boolean', example: true },
             hasPrev: { type: 'boolean', example: false },
           },
         },
         PaginationMeta: {
           type: 'object',
           properties: {
             page: { type: 'integer', example: 1 },
             pageSize: { type: 'integer', example: 50 },
             totalItems: { type: 'integer', example: 1000 },
             totalPages: { type: 'integer', example: 20 },
           },
         },
         SuccessResponse: {
           type: 'object',
           required: ['success', 'data'],
           properties: {
             success: { type: 'boolean', example: true },
             data: {
               oneOf: [
                 { type: 'object' },
                 { type: 'array', items: { type: 'object' } },
               ],
             },
             meta: { $ref: '#/components/schemas/PaginationMeta' },
           },
         },
         SingleResourceResponse: {
           type: 'object',
           required: ['data'],
           properties: {
             data: {
               type: 'object',
               required: ['id', 'type', 'attributes'],
               properties: {
                 id: { type: 'string', example: '550e8400-e29b-41d4-a716-446655440000' },
                 type: { type: 'string', example: 'hotel' },
                 attributes: { type: 'object' },
                 relationships: { type: 'object' },
               },
             },
           },
         },
         ListResponse: {
           type: 'object',
           required: ['data', 'meta'],
           properties: {
             data: {
               type: 'array',
               items: { type: 'object' },
             },
             meta: { $ref: '#/components/schemas/PaginationMeta' },
           },
         },
         ValidationError: {
           type: 'object',
           additionalProperties: {
             type: 'array',
             items: { type: 'string' },
           },
         },
         Money: {
           type: 'object',
           required: ['amount', 'currency'],
           properties: {
             amount: { type: 'number', format: 'double', example: 150.00, minimum: 0 },
             currency: { type: 'string', example: 'USD', pattern: '^[A-Z]{3}$' },
           },
         },
         DateRange: {
           type: 'object',
           properties: {
             from: { type: 'string', format: 'date', example: '2024-01-01' },
             to: { type: 'string', format: 'date', example: '2024-12-31' },
           },
         },
         PaginationParams: {
           type: 'object',
           properties: {
             page: { type: 'integer', example: 1, default: 1, minimum: 1 },
             limit: { type: 'integer', example: 50, default: 50, minimum: 1, maximum: 100 },
             sortBy: { type: 'string', example: 'createdAt' },
             sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
           },
         },
         FilterParams: {
           type: 'object',
           properties: {
             filter: {
               type: 'object',
               additionalProperties: true,
               description: 'Filter criteria for results',
             },
             search: {
               type: 'string',
               description: 'Search query string',
               example: 'search term',
             },
           },
         },
         ApiKeyAuth: {
           type: 'object',
           required: ['apiKey'],
           properties: {
             apiKey: { type: 'string', description: 'API key for authentication' },
           },
         },
       },
       examples: {
         UnauthorizedError: {
           summary: 'Unauthorized error example',
           value: {
             error: 'unauthorized',
             message: 'Missing or invalid authentication token',
             requestId: '550e8400-e29b-41d4-a716-446655440000',
           },
         },
         ForbiddenError: {
           summary: 'Forbidden error example',
           value: {
             error: 'forbidden',
             message: 'Insufficient permissions to access this resource',
             requestId: '550e8400-e29b-41d4-a716-446655440000',
           },
         },
         ValidationError: {
           summary: 'Validation error example',
           value: {
             error: 'validation_failed',
             message: 'Validation failed for one or more fields',
             details: {
               email: ['Email is required', 'Email must be a valid email address'],
               password: ['Password must be at least 8 characters'],
             },
             requestId: '550e8400-e29b-41d4-a716-446655440000',
           },
         },
       },
       responses: {
         400: {
           description: 'Bad Request - Validation failed',
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/Error400' },
               examples: {
                 validationError: {
                   $ref: '#/components/examples/ValidationError',
                 },
               },
             },
           },
         },
         401: {
           description: 'Unauthorized - Missing or invalid authentication',
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/Error401' },
               examples: {
                 unauthorizedError: {
                   $ref: '#/components/examples/UnauthorizedError',
                 },
               },
             },
           },
         },
         403: {
           description: 'Forbidden - Insufficient permissions',
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/Error403' },
               examples: {
                 forbiddenError: {
                   $ref: '#/components/examples/ForbiddenError',
                 },
               },
             },
           },
         },
         404: {
           description: 'Not Found - Resource does not exist',
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/Error404' },
             },
           },
         },
         429: {
           description: 'Too Many Requests - Rate limit exceeded',
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/Error429' },
             },
           },
         },
         500: {
           description: 'Internal Server Error',
           content: {
             'application/json': {
               schema: { $ref: '#/components/schemas/Error500' },
             },
           },
         },
       },
     },
   };

   return swaggerJSDoc({
     definition: baseDefinition,
     apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
   });
 }

// Alias for createOpenApiSpec for backward compatibility
export { createOpenApiSpec as createSwaggerSpec };

// ============================================================
// SWAGGER UI SETUP
// ============================================================

export function setupSwagger(app: Express, spec: object, docsPath = '/api-docs'): void {
  app.use(docsPath, swaggerUi.serve, swaggerUi.setup(spec));
  console.log(`📖 Swagger UI available at http://localhost:${process.env.PORT || 'PORT'}${docsPath}`);
}

export function createSwaggerSetup(docsPath = '/api-docs') {
  return (app: Express, spec: object) => setupSwagger(app, spec, docsPath);
}

// ============================================================
// COMMON SCHEMAS (reusable across services)
// ============================================================

export const SCHEMAS = {
  SalesChannel: {
    type: 'string',
    enum: ['POS_DC', 'POS_SA', 'POS_CA', 'SUBAGENT', 'WEBSITE', 'MOBILE'],
    description: 'Sales channel for the booking',
  },
  BookingStatus: {
    type: 'string',
    enum: [
      'NEW_BOOKING', 'PROVISIONAL', 'AUTHORIZED', 'TICKETED',
      'DOCUMENTED', 'DISPATCHED', 'CANCELLED', 'VOID',
      'REFUNDED', 'REFUND_ON_HOLD', 'REJECTED',
    ],
  },
  ServiceType: {
    type: 'string',
    enum: ['Flight', 'Hotel', 'Car', 'FA', 'FC', 'O'],
  },
  Money: {
    type: 'object',
    required: ['amount', 'currency'],
    properties: {
      amount: { type: 'number', format: 'double', example: 150.00, minimum: 0 },
      currency: { type: 'string', example: 'USD', pattern: '^[A-Z]{3}$' },
    },
  },
  DateRange: {
    type: 'object',
    properties: {
      from: { type: 'string', format: 'date', example: '2024-01-01' },
      to: { type: 'string', format: 'date', example: '2024-12-31' },
    },
  },
  PaginationParams: {
    type: 'object',
    properties: {
      page: { type: 'integer', example: 1, default: 1, minimum: 1 },
      limit: { type: 'integer', example: 50, default: 50, minimum: 1, maximum: 100 },
      sortBy: { type: 'string', example: 'createdAt' },
      sortOrder: { type: 'string', enum: ['asc', 'desc'], default: 'desc' },
    },
  },
  ApiResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      data: { type: 'object' },
      error: { type: 'string' },
      message: { type: 'string' },
    },
  },
  User: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      email: { type: 'string', format: 'email' },
      firstName: { type: 'string' },
      lastName: { type: 'string' },
      phone: { type: 'string' },
      status: { type: 'string', enum: ['active', 'inactive', 'suspended'] },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
  Role: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      name: { type: 'string' },
      description: { type: 'string' },
      permissions: {
        type: 'array',
        items: { type: 'string' },
      },
    },
  },
  Booking: {
    type: 'object',
    properties: {
      id: { type: 'string', format: 'uuid' },
      bookingNumber: { type: 'string' },
      status: { type: 'string' },
      totalAmount: { $ref: '#/components/schemas/Money' },
      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
    },
  },
};
