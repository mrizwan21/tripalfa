// ============================================================
// DATABASE CLIENT
// ============================================================
// PostgreSQL connection pool for TripAlfa databases
// ============================================================

import { Pool } from 'pg';

// ============================================================
// Database Configuration
// ============================================================

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'tripalfa_local',
  ssl: process.env.DB_SSL === 'true' ? {
    rejectUnauthorized: false,
  } : false,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// ============================================================
// Connection Pools
// ============================================================

export const poolLocal = new Pool({
  ...dbConfig,
  database: 'tripalfa_local',
});


