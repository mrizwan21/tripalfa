import { createSwaggerSpec, setupSwagger } from '@tripalfa/shared-openapi';
import type { Application } from 'express';

const swaggerSpec = createSwaggerSpec({
  serviceInfo: {
    title: 'TripAlfa Wallet Service API',
    version: '1.0.0',
    description:
      'Wallet and ledger service for managing transfers, purchases, settlements, transactions, and foreign exchange',
    contact: { name: 'TripAlfa Engineering', email: 'engineering@tripalfa.com' },
  },
  port: 3008,
  productionUrl: process.env.PRODUCTION_URL ? `${process.env.PRODUCTION_URL}/wallet` : undefined,
  routePaths: ['./src/routes/*.ts'],
  tags: [
    { name: 'Wallet', description: 'Wallet and ledger management endpoints' },
    { name: 'Transfers', description: 'Transfer processing endpoints' },
    { name: 'Purchases', description: 'Customer purchase endpoints' },
    { name: 'Settlements', description: 'Settlement processing endpoints' },
    { name: 'Transactions', description: 'Transaction history endpoints' },
    { name: 'Kiwi', description: 'Kiwi.com integration endpoints' },
    { name: 'FX', description: 'Foreign exchange endpoints' },
  ],
});

{ swaggerSpec }

export function setupWalletSwagger(app: Application): void {
  setupSwagger(app, swaggerSpec, '/api-docs');
}
