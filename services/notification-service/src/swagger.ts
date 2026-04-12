import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Notification Service API',
    version: '1.0.0',
    description:
      'Notification delivery service for managing and sending notifications across channels',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3005,
  productionUrl: process.env.PRODUCTION_URL
    ? `${process.env.PRODUCTION_URL}/notifications`
    : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [{ name: 'Notifications', description: 'Notification management and delivery endpoints' }],
});

{ swaggerSpec }

export function setupNotificationSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
