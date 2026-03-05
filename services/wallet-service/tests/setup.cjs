// tests/setup.cjs
const path = require("path");
const dotenv = require("dotenv");
const pg = require("pg");

const { Pool } = pg;
const rootEnvPath = path.resolve(__dirname, "../.env");
dotenv.config({ path: rootEnvPath });

const connStr = (process.env.DATABASE_URL || "").replace(/^"|"$/g, "");
global.PG_POOL = new Pool({ connectionString: connStr });

jest.setTimeout(30000);

afterAll(async () => {
  const pool = global.PG_POOL;
  if (pool && typeof pool.end === "function") {
    await pool.end();
  }
});