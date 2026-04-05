import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Auth Service API',
    version: '1.0.0',
    description:
      'Authentication and authorization service handling OAuth, FusionAuth integration, and local authentication for TripAlfa',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3003,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/auth` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Authentication', description: 'Authentication endpoints' },
    { name: 'OAuth', description: 'OAuth and social login endpoints' },
    { name: 'FusionAuth', description: 'FusionAuth integration endpoints' },
    { name: 'Local Auth', description: 'Local authentication endpoints' },
  ],
});

export { swaggerSpec };

export function setupAuthSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
