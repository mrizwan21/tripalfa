import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Contact Service API',
    version: '1.0.0',
    description: 'Contact management service handling contacts, activities, and preferences',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3025,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/contact` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Contacts', description: 'Contact management endpoints' },
    { name: 'Activities', description: 'Activity tracking endpoints' },
    { name: 'Preferences', description: 'Contact preferences endpoints' },
  ],
});

export { swaggerSpec };

export function setupContactSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
