import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Organization Service API',
    version: '1.0.0',
    description:
      'Organization management service for company profiles, branding, and marketing campaigns',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3006,
  productionUrl: process.env.PRODUCTION_URL
    ? `${process.env.PRODUCTION_URL}/organization`
    : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Organization', description: 'Organization management endpoints' },
    { name: 'Branding', description: 'Branding configuration endpoints' },
    { name: 'Campaigns', description: 'Marketing campaign endpoints' },
  ],
});

export { swaggerSpec };

export function setupOrganizationSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
