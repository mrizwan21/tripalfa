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

export function createOpenApiSpec(config: OpenApiConfig): object {
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
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http' as const,
          scheme: 'bearer' as const,
          bearerFormat: 'JWT',
        },
        apiKeyAuth: {
          type: 'apiKey' as const,
          in: 'header' as const,
          name: 'X-API-Key',
        },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
            message: { type: 'string' },
          },
        },
        Pagination: {
          type: 'object',
          properties: {
            page: { type: 'integer', example: 1 },
            limit: { type: 'integer', example: 20 },
            total: { type: 'integer' },
            totalPages: { type: 'integer' },
          },
        },
      },
    },
    ...(config.swaggerDefinition || {}),
  };

  return swaggerJSDoc({
    definition: baseDefinition,
    apis: ['./src/routes/**/*.ts', './src/controllers/**/*.ts'],
  });
}

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
    properties: {
      amount: { type: 'number', example: 150.00 },
      currency: { type: 'string', example: 'USD' },
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
      page: { type: 'integer', example: 1, default: 1 },
      limit: { type: 'integer', example: 20, default: 20 },
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
};
