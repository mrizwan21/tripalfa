import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Rule Engine Service API',
    version: '1.0.0',
    description:
      'Rule engine service for managing and evaluating business rules across the platform',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3010,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/rules` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [{ name: 'Rules', description: 'Rule management and evaluation endpoints' }],
});

{ swaggerSpec }

export function setupRuleEngineSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
