import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Marketing Service API',
    version: '1.0.0',
    description: 'Marketing service for campaign management, promo codes, and marketing analytics',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3012,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/marketing` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Marketing', description: 'Marketing campaign management endpoints' },
    { name: 'Promo Codes', description: 'Promotional code management and validation endpoints' },
    { name: 'Analytics', description: 'Marketing analytics endpoints' },
  ],
});

{ swaggerSpec }

export function setupMarketingSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
