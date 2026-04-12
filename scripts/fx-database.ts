/**
 * FX Analytics Database Connection
 * Connects to static database (staticdatabase on port 5433/5435)
 * All FX analytics persisted via PostgreSQL instead of in-memory
 */

import { Pool, PoolClient } from "pg";

// Static database connection - same as staticdatabase used by LiteAPI/Duffel
const STATIC_DB_URL =
  process.env.STATIC_DATABASE_URL ||
  "postgresql://postgres:postgres@localhost:5433/staticdatabase";

let pool: Pool | null = null;

/**
 * Initialize database connection pool
 */
function initializeFxDatabase(): Pool {
  if (!pool) {
    pool = new Pool({
      connectionString: STATIC_DB_URL,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on("error", (err) => {
      console.error("[FX DB] Unexpected error on idle client:", err);
    });
  }
  return pool;
}

/**
 * Get database connection
 */
function getFxDatabase(): Pool {
  if (!pool) {
    return initializeFxDatabase();
  }
  return pool;
}

/**
 * Get a single client from pool
 */
async function getFxDatabaseClient(): Promise<PoolClient> {
  const db = getFxDatabase();
  return db.connect();
}

/**
 * Close database connection
 */
async function closeFxDatabase(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

// ============================================================
// FX RATES OPERATIONS
// ============================================================

async function getFxRate(from: string, to: string): Promise<any> {
  const db = getFxDatabase();
  const result = await db.query(
    `
    SELECT id, from_currency, to_currency, rate::NUMERIC as rate, fee_percentage, 
           last_updated_at, cache_ttl_seconds
    FROM shared.fx_rates 
    WHERE from_currency = $1 AND to_currency = $2
    LIMIT 1
  `,
    [from.toUpperCase(), to.toUpperCase()],
  );
  const row = result.rows[0];
  if (row) {
    row.rate = parseFloat(row.rate); // Ensure rate is a number
  }
  return row || null;
}

async function saveFxRate(
  from: string,
  to: string,
  rate: number,
  feePercentage: number = from === to ? 0 : 2,
): Promise<void> {
  const db = getFxDatabase();
  await db.query(
    `
    INSERT INTO shared.fx_rates 
    (from_currency, to_currency, rate, fee_percentage, last_updated_at, fetched_at)
    VALUES ($1, $2, $3, $4, NOW(), NOW())
    ON CONFLICT (from_currency, to_currency) 
    DO UPDATE SET 
      rate = EXCLUDED.rate,
      last_updated_at = NOW(),
      fetched_at = NOW()
  `,
    [from.toUpperCase(), to.toUpperCase(), rate, feePercentage],
  );
}

// ============================================================
// FX CONVERSIONS LOGGING
// ============================================================

async function logFxConversion(conversion: {
  from_currency: string;
  to_currency: string;
  from_amount: number;
  to_amount: number;
  fx_rate_used: number;
  fx_fee_amount: number;
  fx_fee_percentage: number;
  total_debit: number;
  booking_id?: string;
  user_id?: string;
  wallet_transaction_id?: string;
  conversion_type: string;
}): Promise<string> {
  const db = getFxDatabase();
  const result = await db.query(
    `
    INSERT INTO shared.fx_conversions 
    (from_currency, to_currency, from_amount, to_amount, fx_rate_used, 
     fx_fee_amount, fx_fee_percentage, total_debit, booking_id, user_id, 
     wallet_transaction_id, conversion_type, status)
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 'completed')
    RETURNING id
  `,
    [
      conversion.from_currency.toUpperCase(),
      conversion.to_currency.toUpperCase(),
      conversion.from_amount,
      conversion.to_amount,
      conversion.fx_rate_used,
      conversion.fx_fee_amount,
      conversion.fx_fee_percentage,
      conversion.total_debit,
      conversion.booking_id || null,
      conversion.user_id || null,
      conversion.wallet_transaction_id || null,
      conversion.conversion_type,
    ],
  );
  return result.rows[0].id;
}

// ============================================================
// FX ANALYTICS OPERATIONS
// ============================================================

async function updateFxAnalytics(
  from: string,
  to: string,
  feeAmount: number,
  fromAmount: number,
  toAmount: number,
): Promise<void> {
  const db = getFxDatabase();
  const fromCurr = from.toUpperCase();
  const toCurr = to.toUpperCase();

  await db.query(
    `
    INSERT INTO shared.fx_analytics 
    (from_currency, to_currency, total_conversions, total_volume_from, 
     total_volume_to, total_fees_collected, average_rate, 
     conversions_with_fee, last_conversion_at)
    VALUES 
    ($1, $2, 1, $3, $4, CAST($5 AS NUMERIC), $6, CASE WHEN CAST($5 AS NUMERIC) > 0 THEN 1 ELSE 0 END, NOW())
    ON CONFLICT (from_currency, to_currency) 
    DO UPDATE SET 
      total_conversions = shared.fx_analytics.total_conversions + 1,
      total_volume_from = shared.fx_analytics.total_volume_from + CAST($3 AS NUMERIC),
      total_volume_to = shared.fx_analytics.total_volume_to + CAST($4 AS NUMERIC),
      total_fees_collected = shared.fx_analytics.total_fees_collected + CAST($5 AS NUMERIC),
      average_rate = (CAST($6 AS NUMERIC) + shared.fx_analytics.average_rate * CAST(shared.fx_analytics.total_conversions AS NUMERIC)) / CAST((shared.fx_analytics.total_conversions + 1) AS NUMERIC),
      conversions_with_fee = shared.fx_analytics.conversions_with_fee + CASE WHEN CAST($5 AS NUMERIC) > 0 THEN 1 ELSE 0 END,
      last_conversion_at = NOW(),
      updated_at = NOW()
  `,
    [
      fromCurr,
      toCurr,
      fromAmount,
      toAmount,
      feeAmount,
      toAmount / fromAmount, // average rate
    ],
  );
}

async function getFxAnalytics(
  from?: string,
  to?: string,
): Promise<any[]> {
  const db = getFxDatabase();

  let query = "SELECT * FROM shared.fx_analytics_named";
  const params: string[] = [];

  if (from && to) {
    query += " WHERE from_currency = $1 AND to_currency = $2";
    params.push(from.toUpperCase(), to.toUpperCase());
  } else if (from) {
    query += " WHERE from_currency = $1 OR to_currency = $1";
    params.push(from.toUpperCase());
  }

  query += " ORDER BY total_conversions DESC";

  const result = await db.query(query, params);
  return result.rows;
}

async function getTopFxPairs(limit: number = 10): Promise<any[]> {
  const db = getFxDatabase();
  const result = await db.query(
    `
    SELECT * FROM shared.fx_top_pairs_by_volume
    LIMIT $1
  `,
    [limit],
  );
  return result.rows;
}

async function getFxAnalyticsSummary(): Promise<any> {
  const db = getFxDatabase();
  const result = await db.query(`
    SELECT 
      COUNT(*) as total_pairs,
      SUM(total_conversions) as total_conversions,
      SUM(total_fees_collected) as total_fees_collected,
      AVG(average_rate) as average_rate,
      MAX(updated_at) as last_updated
    FROM shared.fx_analytics
  `);
  return result.rows[0];
}

// ============================================================
// FX CACHE METADATA OPERATIONS
// ============================================================

async function saveFxCacheMetadata(
  from: string,
  to: string,
  rate: number,
  ttlSeconds: number = 3600,
): Promise<void> {
  const db = getFxDatabase();
  const expiresAt = new Date(Date.now() + ttlSeconds * 1000);

  await db.query(
    `
    INSERT INTO shared.fx_cache_metadata 
    (from_currency, to_currency, rate, expires_at, ttl_seconds, cached_at)
    VALUES ($1, $2, $3, $4, $5, NOW())
    ON CONFLICT (from_currency, to_currency) 
    DO UPDATE SET 
      rate = EXCLUDED.rate,
      cached_at = NOW(),
      expires_at = EXCLUDED.expires_at,
      hit_count = hit_count + 1,
      last_hit_at = NOW()
  `,
    [
      from.toUpperCase(),
      to.toUpperCase(),
      rate,
      expiresAt,
      ttlSeconds,
    ],
  );
}

async function getFxCacheStats(): Promise<any> {
  const db = getFxDatabase();
  const result = await db.query(`
    SELECT 
      COUNT(*) as total_cached,
      COUNT(CASE WHEN expires_at > NOW() THEN 1 END) as active_cached,
      COUNT(CASE WHEN expires_at <= NOW() THEN 1 END) as expired_cached,
      SUM(hit_count) as total_hits,
      SUM(miss_count) as total_misses,
      AVG(hit_count) as avg_hits
    FROM shared.fx_cache_metadata
  `);
  return result.rows[0];
}

async function queryFxCacheMetadata(from?: string, to?: string): Promise<any[]> {
  const db = getFxDatabase();

  let query = `
    SELECT 
      from_currency,
      to_currency,
      CONCAT(from_currency, '_', to_currency) as pair,
      rate,
      cached_at,
      expires_at,
      EXTRACT(EPOCH FROM (expires_at - cached_at))::int as ttl_seconds,
      EXTRACT(EPOCH FROM (NOW() - cached_at))::int as age_seconds,
      hit_count,
      miss_count,
      (expires_at > NOW()) as is_active
    FROM shared.fx_cache_metadata
  `;

  const params: string[] = [];

  if (from && to) {
    query += " WHERE from_currency = $1 AND to_currency = $2";
    params.push(from.toUpperCase(), to.toUpperCase());
  } else if (from) {
    query += " WHERE from_currency = $1 OR to_currency = $1";
    params.push(from.toUpperCase());
  }

  query += " ORDER BY cached_at DESC";

  const result = await db.query(query, params);
  return result.rows;
}

// ============================================================
// DAILY ANALYTICS OPERATIONS
// ============================================================

async function getDailyFxAnalytics(
  fromDate?: Date,
  toDate?: Date,
): Promise<any[]> {
  const db = getFxDatabase();

  let query = "SELECT * FROM shared.fx_daily_analytics";
  const params: any[] = [];

  if (fromDate && toDate) {
    query += " WHERE analytics_date >= $1 AND analytics_date <= $2";
    params.push(fromDate, toDate);
  } else if (fromDate) {
    query += " WHERE analytics_date >= $1";
    params.push(fromDate);
  }

  query += " ORDER BY analytics_date DESC";

  const result = await db.query(query, params);
  return result.rows;
}

async function archiveDailyAnalytics(
  dateToArchive: Date,
): Promise<void> {
  const db = getFxDatabase();

  // Calculate daily aggregates from conversions
  await db.query(
    `
    INSERT INTO shared.fx_daily_analytics 
    (analytics_date, from_currency, to_currency, total_conversions, 
     total_volume_from, total_volume_to, total_fees_collected, 
     opening_rate, closing_rate, min_rate, max_rate, average_rate)
    SELECT 
      DATE($10) as analytics_date,
      from_currency,
      to_currency,
      COUNT(*) as total_conversions,
      SUM(from_amount) as total_volume_from,
      SUM(to_amount) as total_volume_to,
      SUM(fx_fee_amount) as total_fees_collected,
      (ARRAY_AGG(fx_rate_used ORDER BY created_at ASC))[1] as opening_rate,
      (ARRAY_AGG(fx_rate_used ORDER BY created_at DESC))[1] as closing_rate,
      MIN(fx_rate_used) as min_rate,
      MAX(fx_rate_used) as max_rate,
      AVG(fx_rate_used) as average_rate
    FROM shared.fx_conversions
    WHERE DATE(created_at) = DATE($10)
    GROUP BY from_currency, to_currency
    ON CONFLICT (analytics_date, from_currency, to_currency) 
    DO UPDATE SET 
      total_conversions = EXCLUDED.total_conversions,
      total_volume_from = EXCLUDED.total_volume_from,
      total_volume_to = EXCLUDED.total_volume_to,
      total_fees_collected = EXCLUDED.total_fees_collected,
      updated_at = NOW()
  `,
    [dateToArchive],
  );
}

// ============================================================
// HEALTH CHECK
// ============================================================

async function checkFxDatabaseHealth(): Promise<{
  status: string;
  connected: boolean;
  tables: string[];
  error?: string;
}> {
  try {
    const db = getFxDatabase();
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'shared' 
      AND table_name LIKE 'fx_%'
      ORDER BY table_name
    `);

    return {
      status: "healthy",
      connected: true,
      tables: result.rows.map((r: any) => r.table_name),
    };
  } catch (error) {
    return {
      status: "unhealthy",
      connected: false,
      tables: [],
      error: String(error),
    };
  }
}
export {
  initializeFxDatabase,
  getFxDatabase,
  getFxDatabaseClient,
  closeFxDatabase,
  getFxRate,
  saveFxRate,
  logFxConversion,
  updateFxAnalytics,
  getFxAnalytics,
  getTopFxPairs,
  getFxAnalyticsSummary,
  saveFxCacheMetadata,
  getFxCacheStats,
  queryFxCacheMetadata,
  getDailyFxAnalytics,
  archiveDailyAnalytics,
  checkFxDatabaseHealth,
};
