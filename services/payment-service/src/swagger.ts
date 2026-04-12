import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Payment Service API',
    version: '1.0.0',
    description:
      'Payment processing service handling payments, virtual cards, and tax calculations',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3007,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/payments` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Payments', description: 'Payment processing endpoints' },
    { name: 'Virtual Cards', description: 'Virtual card management endpoints' },
    { name: 'Tax', description: 'Tax calculation endpoints' },
  ],
});

{ swaggerSpec }

export function setupPaymentSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
