import { PrismaClient } from '@prisma/client';
import { PrismaNeon } from '@prisma/adapter-neon';
import { Pool } from '@neondatabase/serverless';
import logger from '../utils/logger';

// Lazy initialization of Prisma client to ensure environment variables are loaded
let prismaInstance: PrismaClient | null = null;

const getPrismaClient = (): PrismaClient => {
  if (!prismaInstance) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is not set');
    }

    // Initialize Neon connection pool
    const pool = new Pool({ connectionString });

    // Initialize Prisma Client with Neon adapter
    const adapter = new PrismaNeon(pool as any);
    prismaInstance = new PrismaClient({
      adapter,
    });

    // Log database queries in development
    if (process.env.NODE_ENV === 'development') {
      (prismaInstance as any).$on('query', (e: any) => {
        logger.debug('Database Query', {
          query: e.query,
          params: e.params,
          duration: e.duration,
        });
      });
    }

    // Log database errors
    (prismaInstance as any).$on('error', (e: any) => {
      logger.error('Database Error', {
        error: e,
      });
    });

    // Log database warnings
    (prismaInstance as any).$on('warn', (e: any) => {
      logger.warn('Database Warning', {
        warning: e,
      });
    });

    // Graceful shutdown
    process?.on('SIGINT', async () => {
      logger.info('Received SIGINT, closing database connection...');
      await prismaInstance!.$disconnect();
      process?.exit(0);
    });

    process?.on('SIGTERM', async () => {
      logger.info('Received SIGTERM, closing database connection...');
      await prismaInstance!.$disconnect();
      process?.exit(0);
    });
  }
  return prismaInstance;
};

// Export the lazy-initialized Prisma client as a getter
export const prisma = new Proxy({} as PrismaClient, {
  get(target, prop) {
    const client = getPrismaClient();
    return (client as any)[prop];
  }
});
export * from '@prisma/client';
