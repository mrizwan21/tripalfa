import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';

export const dynamicPrisma = new PrismaClient({
    datasources: { db: { url: process.env.DATABASE_URL } }
});

export const staticPrisma = new PrismaClient({
    datasources: { db: { url: process.env.STATIC_DATABASE_URL } }
});

export const staticPool = new Pool({
    connectionString: process.env.STATIC_DATABASE_URL
});
