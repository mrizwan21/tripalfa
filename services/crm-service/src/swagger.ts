import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa CRM Service API',
    version: '1.0.0',
    description:
      'Customer relationship management service for tickets, customers, analytics, tasks, opportunities, workflows, and integrations',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3015,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/crm` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Tickets', description: 'Support ticket management endpoints' },
    { name: 'Customers', description: 'Customer management endpoints' },
    { name: 'Analytics', description: 'CRM analytics and reporting endpoints' },
    { name: 'Tasks', description: 'Task management endpoints' },
    { name: 'Calendar', description: 'Calendar management endpoints' },
    { name: 'Notes', description: 'Note management endpoints' },
    { name: 'Opportunities', description: 'Sales opportunity endpoints' },
    { name: 'Workflows', description: 'Workflow automation endpoints' },
    { name: 'Integrations', description: 'Third-party integration endpoints' },
    { name: 'Documents', description: 'Document management endpoints' },
    { name: 'Blocklist', description: 'Blocklist management endpoints' },
    { name: 'Favorites', description: 'Favorite items endpoints' },
    { name: 'Contact Forms', description: 'Contact form management endpoints' },
    { name: 'Duplicates', description: 'Duplicate detection endpoints' },
    { name: 'Dashboard Sync', description: 'Dashboard synchronization endpoints' },
  ],
});

{ swaggerSpec }

export function setupCRMSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
