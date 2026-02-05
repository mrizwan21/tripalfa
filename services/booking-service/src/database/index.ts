import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
import logger from '../utils/logger';

// Initialize Neon connection pool
const connectionString = process.env.DATABASE_URL;
const pool = new Pool({ connectionString });

// Initialize Prisma Client with Neon adapter
const adapter = new PrismaNeon(pool as any);
const prisma = new PrismaClient({
  adapter,
  log: [
    {
      emit: 'event',
      level: 'query',
    },
    {
      emit: 'event',
      level: 'error',
    },
    {
      emit: 'event',
      level: 'info',
    },
    {
      emit: 'event',
      level: 'warn',
    },
  ],
});

// Log database queries in development
if (process.env.NODE_ENV === 'development') {
  prisma.$on('query', (e: any) => {
    logger.debug('Database Query', {
      query: e.query,
      params: e.params,
      duration: e.duration,
    });
  });
}

// Log database errors
prisma.$on('error', (e: any) => {
  logger.error('Database Error', {
    error: e,
  });
});

// Log database warnings
prisma.$on('warn', (e: any) => {
  logger.warn('Database Warning', {
    warning: e,
  });
});

// Graceful shutdown
process?.on('SIGINT', async () => {
  logger.info('Received SIGINT, closing database connection...');
  await prisma.$disconnect();
  process?.exit(0);
});

process?.on('SIGTERM', async () => {
  logger.info('Received SIGTERM, closing database connection...');
  await prisma.$disconnect();
  process?.exit(0);
});

export { prisma };
export * from '@prisma/client';