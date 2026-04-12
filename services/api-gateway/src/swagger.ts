import swaggerJsdoc from 'swagger-jsdoc';
import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa API Gateway',
    version: '1.0.0',
    description:
      'Central API Gateway for TripAlfa microservices - routes, authenticates, and forwards requests to backend services',
    contact: {
      name: 'TripAlfa Engineering',
      email: 'engineering@tripalfa.com',
    },
  },
  port: parseInt(process.env.API_GATEWAY_PORT || '3000', 10),
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/gateway` : undefined,
  routePaths: ['./src/**/*.ts'],
  tags: [
    { name: 'Gateway', description: 'API Gateway endpoints' },
    { name: 'Health', description: 'Health check endpoints' },
    { name: 'OAuth', description: 'OAuth forwarding endpoints' },
  ],
});

{
  swaggerSpec;
}

export function setupGatewaySwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
