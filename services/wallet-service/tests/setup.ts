// tests/setup.ts
// TypeScript test setup: initialize services and DB pool for tests
(function loadEnv() {
  try {
    // load .env from service root so DATABASE_URL is available during tests
     
    const dotenv = require('dotenv');
    const path = require('path');
    dotenv.config({ path: path.resolve(__dirname, '../.env') });
  } catch (err) {
    // ignore if dotenv not available
  }
})();

import { Pool } from 'pg';

// Ensure pg returns numeric types as JS numbers in tests (NUMERIC OID = 1700)
 
const pg = require('pg');
if (pg && pg.types && typeof pg.types.setTypeParser === 'function') {
  pg.types.setTypeParser(1700, (val: string) => (val === null ? null : parseFloat(val)));
}

// Create test pool directly to avoid importing `src/config/db` (prevents circular imports)
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
(global as any).PG_POOL = pool;
 

// Ensure tests use the dedicated test schema created by migrations
(async () => {
  try {
    await pool.query("SET search_path TO wallet_test,public");
  } catch (err) {
    // ignore if schema not present
  }
})();

// Increase test timeout
jest.setTimeout(30000);

// Clean up database after all tests
afterAll(async () => {
  await pool.end();
});

