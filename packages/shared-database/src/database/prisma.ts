import 'dotenv/config';
import pg from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma-client/index.js';

export type { PrismaClient as GeneratedPrismaClient } from '../../generated/prisma-client/index.js';

function createPrismaClient(url: string) {
  const pool = new pg.Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  return new GeneratedPrismaClient({ adapter } as any);
}

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://user:password@localhost:5433/tripalfa_platform';

export const prisma = createPrismaClient(DATABASE_URL);

export { GeneratedPrismaClient as PrismaClient };