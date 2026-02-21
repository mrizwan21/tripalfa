import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
const envPath = path.resolve(process.cwd(), '.env.services');
if (fs.existsSync(envPath)) { dotenv.config({ path: envPath }); }
import { Pool } from 'pg';
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
async function main() {
  await pool.query(`CREATE TABLE IF NOT EXISTS suppliers (
    id TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    type TEXT,
    status BOOLEAN DEFAULT true,
    api_base_url TEXT,
    api_key TEXT,
    sync_enabled BOOLEAN DEFAULT true,
    sync_interval INTEGER DEFAULT 86400,
    rate_limit_per_min INTEGER,
    rate_limit_per_day INTEGER,
    current_usage JSONB,
    features JSONB,
    metadata JSONB,
    last_sync_at TIMESTAMP,
    last_sync_status TEXT,
    last_sync_records INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )`);
  console.log('✅ Suppliers table created');
  await pool.end();
}
main();
