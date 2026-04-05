import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa User Service API',
    version: '1.0.0',
    description: 'User management service handling user profiles, preferences, and authentication',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3002,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/users` : undefined,
  routePaths: ['./src/**/*.ts'],
  tags: [
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Preferences', description: 'User preferences endpoints' },
  ],
});

export { swaggerSpec };

export function setupUserSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
