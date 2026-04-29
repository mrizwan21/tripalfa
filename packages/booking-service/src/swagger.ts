import swaggerJsdoc from 'swagger-jsdoc';
import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Booking Service API',
    version: '1.0.0',
    description:
      'Booking service for managing flight and hotel bookings, documents, and order management',
    contact: {
      name: 'TripAlfa Engineering',
      email: 'engineering@tripalfa.com',
    },
  },
  port: 3001,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/booking` : undefined,
  routePaths: ['./src/routes/*.ts', './src/routes/*.js'],
  tags: [
    { name: 'Bookings', description: 'Booking management endpoints' },
    { name: 'Flight Booking', description: 'Flight booking operations' },
    { name: 'Hotel Booking', description: 'Hotel booking operations' },
    { name: 'Hotels', description: 'Hotel search and details' },
    { name: 'Documents', description: 'Booking document management' },
    { name: 'Duffel', description: 'Duffel API integration' },
    { name: 'LiteAPI', description: 'LiteAPI integration' },
    { name: 'Order Management', description: 'Order management operations' },
    { name: 'Inventory', description: 'Inventory management' },
    { name: 'Location', description: 'Location services' },
    { name: 'Content', description: 'Content endpoints' },
    { name: 'Airline Credits', description: 'Airline credit management' },
    { name: 'Admin', description: 'Admin booking operations' },
    { name: 'Webhooks', description: 'Webhook endpoints' },
    { name: 'Audit', description: 'Audit log endpoints' },
    { name: 'Static Data', description: 'Static reference data' },
  ],
});

{ swaggerSpec }

export function setupBookingSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
