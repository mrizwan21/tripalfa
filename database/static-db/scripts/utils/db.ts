import { Pool, PoolClient, QueryResultRow } from "pg";
import * as dotenv from "dotenv";

dotenv.config();

const pool = new Pool({
  host: process.env.STATICDB_HOST ?? "localhost",
  port: Number(process.env.STATICDB_PORT ?? 5435),
  database: process.env.STATICDB_NAME ?? "tripalfa_static",
  user: process.env.STATICDB_USER ?? "staticdb_admin",
  password: process.env.STATICDB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30_000,
  connectionTimeoutMillis: 10_000,
  statement_timeout: 1_800_000, // Increased to 30 minutes for massive country imports (AU=57k hotels)
});

pool.on("error", (err) => {
  console.error("[DB] Unexpected pool error:", err.message);
});

/** Execute a query and return rows. */
export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  values?: unknown[],
): Promise<T[]> {
  const { rows } = await pool.query<T>(text, values);
  return rows;
}

/** Get a client for transaction management. */
export async function getClient(): Promise<PoolClient> {
  return pool.connect();
}

/**
 * Run callback inside a transaction.
 * Auto-commits on success, rolls back on error.
 */
export async function withTransaction<T>(
  fn: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    const result = await fn(client);
    await client.query("COMMIT");
    return result;
  } catch (err) {
    await client.query("ROLLBACK");
    throw err;
  } finally {
    client.release();
  }
}

/** Gracefully close the pool. */
export async function closePool(): Promise<void> {
  await pool.end();
}

export default pool;
