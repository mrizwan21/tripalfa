import pkg from 'pg';
const { Pool } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

export const staticDbPool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});

/**
 * Execute a query against the static database
 */
export async function queryStatic(text: string, params?: any[]) {
    const start = Date.now();
    try {
        const res = await staticDbPool.query(text, params);
        const duration = Date.now() - start;
        if (process.env.DEBUG_DB) {
            console.log('[StaticDB] Executed query', { text, duration, rows: res.rowCount });
        }
        return res;
    } catch (error) {
        console.error('[StaticDB] Query error', { text, error });
        throw error;
    }
}

export default staticDbPool;
