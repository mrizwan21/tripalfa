import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa B2B Admin API',
    version: '1.0.0',
    description:
      'B2B administration service for managing companies, users, bookings, finance, suppliers, and business rules',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3020,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/b2b-admin` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Companies', description: 'Company management endpoints' },
    { name: 'Users', description: 'User management endpoints' },
    { name: 'Bookings', description: 'Booking management endpoints' },
    { name: 'Finance', description: 'Financial operations endpoints' },
    { name: 'Suppliers', description: 'Supplier management endpoints' },
    { name: 'Rules', description: 'Business rules endpoints' },
  ],
});

{ swaggerSpec }

export function setupB2BAdminSwagger(app: Application): void {
  setupSwagger(app as unknown as Parameters<typeof setupSwagger>[0], swaggerSpec, '/api-docs');
}
