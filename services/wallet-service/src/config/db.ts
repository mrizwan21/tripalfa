// src/config/db.ts
// Postgres connection pool for Neon

import pg from 'pg';
// import { logger } from '../utils/logger';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is required');
}

const poolConfig = {
  connectionString: databaseUrl,
  // SSL: enable TLS verification by default for Neon. To explicitly disable verification
  // (only for debugging) set DB_SSL_REJECT_UNAUTHORIZED=false in env and DB_SSL=true.
  ssl:
    process.env.DB_SSL === 'true' || process.env.NODE_ENV === 'production'
      ? { rejectUnauthorized: process.env.DB_SSL_REJECT_UNAUTHORIZED !== 'false' }
      : false,
  // Neon serverless: use small pool size and short idle timeout
  max: Number(process.env.PG_MAX_CLIENTS) || 10,
  min: Number(process.env.PG_MIN_CLIENTS) || 2,
  idleTimeoutMillis: Number(process.env.PG_IDLE_TIMEOUT_MS) || 30000,
  connectionTimeoutMillis: Number(process.env.PG_CONN_TIMEOUT_MS) || 5000,
  // Neon-friendly: allow process to exit when idle, set application name and statement timeout
  allowExitOnIdle: true,
  application_name: process.env.PGAPPNAME || 'wallet-service',
  statement_timeout: Number(process.env.PG_STATEMENT_TIMEOUT_MS) || 60000,
};

// Create a typed Pool instance so ESLint/TypeScript recognize correct types
const poolInstance = new (pg as any).Pool(poolConfig as any);
export const pool = poolInstance;

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

pool.on('connect', (client) => {
  client.query('SET search_path TO public').catch((err) => {
    console.error('Error setting search_path', err);
  });
});

export default pool;
