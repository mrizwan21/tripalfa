// CRM Service Database Configuration
// Uses finance database for CRM data

import { PrismaClient } from '@prisma/client';

// Create Prisma client with finance database connection
const prisma = new PrismaClient({
  datasources: {
    db: {
      url: process.env.FINANCE_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

export { prisma };
