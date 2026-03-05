// tests/setup.ts
import path from "path";
import dotenv from "dotenv";
import pg from "pg";
import { fileURLToPath } from "url";

const { Pool } = pg;

// Get __dirname equivalent in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rootEnvPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: rootEnvPath });

const connStr = (process.env.DATABASE_URL || "").replace(/^"|"$/g, "");
global.PG_POOL = new Pool({ connectionString: connStr });

// Increase test timeout
jest.setTimeout(30000);

// Clean up resources after all tests
afterAll(async () => {
  const pool = global.PG_POOL;
  if (pool && typeof pool.end === "function") {
    await pool.end();
  }
});
