import { PrismaClient } from '@prisma/client';
import type { Prisma } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Synchronous initialization using proper ESM imports
function initPrisma(): PrismaClient {
  // For Neon with transactions: prefer DIRECT_DATABASE_URL (no pgbouncer)
  // Pgbouncer connections don't support transactions properly
  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || process.env.STATIC_DATABASE_URL;
  
  if (!databaseUrl) {
    console.warn('No database URL found in environment variables');
    console.warn('Available DB-related env vars:', Object.keys(process.env).filter(k => 
      k.includes('DATABASE') || k.includes('DB') || k.includes('POSTGRES')
    ));
    // Return a basic client that will fail gracefully
    return new PrismaClient({ log: ['error'] });
  }

  console.log('Connecting to database:', databaseUrl.substring(0, 30) + '...');

  // For Neon - use standard pg adapter for transaction support
  // Note: NeonPool/PrismaNeon has issues with interactive transactions
  if (databaseUrl.includes('neon.tech') || databaseUrl.includes('neondb')) {
    try {
      // Use standard pg Pool for Neon (supports transactions)
      const pool = new Pool({ 
        connectionString: databaseUrl,
        ssl: { rejectUnauthorized: false },
        max: 10,
      });
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const adapter = new PrismaPg(pool as any);
      
      console.log('Using PrismaPg adapter for Neon (transaction support)');
      
      return new PrismaClient({
        adapter,
        log: ['error', 'warn'],
      }) as unknown as PrismaClient;
    } catch (e) {
      console.error('Failed to create Neon client:', e);
      return new PrismaClient({ log: ['error'] });
    }
  }

  // For standard PostgreSQL (Docker, local, etc.)
  try {
    const pool = new Pool({ connectionString: databaseUrl });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const adapter = new PrismaPg(pool as any);
    
    return new PrismaClient({
      adapter,
      log: ['error', 'warn'],
    }) as unknown as PrismaClient;
  } catch (e) {
    console.error('Failed to create PostgreSQL client:', e);
    return new PrismaClient({ log: ['error'] });
  }
}

export const prisma = globalForPrisma.prisma || initPrisma();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export * from '@prisma/client';
export default prisma;