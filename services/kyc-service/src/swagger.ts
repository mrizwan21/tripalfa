import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa KYC Service API',
    version: '1.0.0',
    description:
      'Know Your Customer verification service for identity document submission, review, and compliance',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3011,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/kyc` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [{ name: 'KYC', description: 'KYC verification and management endpoints' }],
});

{ swaggerSpec }

export function setupKYCSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
