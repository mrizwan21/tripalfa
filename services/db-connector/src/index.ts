import { Pool } from 'pg';

// Exports two DB pools used across services:
// - staticPool: local Postgres for static/master data
// - realtimePool: Neon Postgres for realtime/high-cardinality data

const staticPool = new Pool({
  connectionString: process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase',
});

const realtimePool = new Pool({
  connectionString: process.env.REALTIME_DATABASE_URL || process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/realtimedb',
  // Neon serverless hints:
  ssl:
    process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  max: Number(process.env.PG_MAX_CLIENTS) || 10,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  allowExitOnIdle: true,
});

export async function queryStatic(text: string, params?: any[]) {
  return staticPool.query(text, params);
}

export async function queryRealtime(text: string, params?: any[]) {
  return realtimePool.query(text, params);
}
