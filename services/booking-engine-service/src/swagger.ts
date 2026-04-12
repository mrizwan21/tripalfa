import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Booking Engine API',
    version: '1.0.0',
    description:
      'Booking engine service for flight and hotel search, offline requests, and static data management',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3021,
  productionUrl: process.env.PRODUCTION_URL
    ? `${process.env.PRODUCTION_URL}/booking-engine`
    : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Flights', description: 'Flight search and booking endpoints' },
    { name: 'Hotels', description: 'Hotel search and booking endpoints' },
    { name: 'Offline Requests', description: 'Offline booking request endpoints' },
    { name: 'Static Data', description: 'Static reference data endpoints' },
  ],
});

{ swaggerSpec }

export function setupBookingEngineSwagger(app: Application): void {
  setupSwagger(app as unknown as Parameters<typeof setupSwagger>[0], swaggerSpec, '/api-docs');
}
