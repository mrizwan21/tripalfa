import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

// Load environment variables from root .env file BEFORE initializing Prisma
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const rootDir = resolve(__dirname, '../../../')
dotenv.config({ path: resolve(rootDir, '.env') })

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool as NeonPool, neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';

const globalForPrisma = global as unknown as { prisma: PrismaClient };

// Synchronous initialization using proper ESM imports
function initPrisma(): PrismaClient {
  // For Neon with transactions: prefer DIRECT_DATABASE_URL (no pgbouncer)
  // Pgbouncer connections don't support transactions properly
  // STATIC_DATABASE_URL is for static reference data (hotel + flight) via pg.Pool services — never used here
  const databaseUrl = process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL;
  
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
      const adapter = new PrismaPg(pool);
      
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
    const adapter = new PrismaPg(pool);
    
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