// src/services/fxService.ts
// FX rate fetching, conversion, and snapshot management
// Single source of truth: reads latest snapshot from Postgres

import { logger } from '../utils/logger.js';
import { ExchangeRateSnapshot, FxConversionResult } from '../types/wallet.js';

const SERVICE_NAME = 'fxService';

let pool: any;

export function initializeFxService(pgPool: any): void {
  pool = pgPool;
}

function getPool(): any {
  if (pool) return pool;
  // Allow tests to inject a global pool to avoid circular imports
  const gp = (global as any).PG_POOL as any | undefined;
  if (gp) return gp;
  throw new Error('FX service pool is not initialized');
}

/**
 * Get the latest FX snapshot from Postgres
 */
export async function getLatestSnapshot(): Promise<ExchangeRateSnapshot> {
  try {
    const result = await getPool().query(
      `SELECT id, base_currency as "baseCurrency", rates, fetched_at as "fetchedAt", 
              created_at as "createdAt", status
       FROM exchange_rate_snapshots
       WHERE status = 'active'
       ORDER BY fetched_at DESC
       LIMIT 1`
    );

    if (!result.rows.length) {
      logger.error(`${SERVICE_NAME}: No FX snapshot available`);
      throw new Error('No FX snapshot available');
    }

    return result.rows[0];
  } catch (err) {
    logger.error(`${SERVICE_NAME}: getLatestSnapshot failed`, err as Error);
    throw err;
  }
}

/**
 * Check if snapshot is stale (older than 3 hours)
 */
export function isSnapshotStale(fetchedAt: Date): boolean {
  const thresholdMs = 3 * 60 * 60 * 1000; // 3 hours
  return Date.now() - new Date(fetchedAt).getTime() > thresholdMs;
}

/**
 * Convert amount from source to destination currency using latest snapshot
 */
export async function convertAmount(
  amount: number,
  srcCurrency: string,
  destCurrency: string
): Promise<FxConversionResult> {
  // Short-circuit: same currency
  if (srcCurrency === destCurrency) {
    return {
      converted: Number(amount.toFixed(6)),
      fxRate: 1.0,
      baseCurrency: srcCurrency,
      baseAmount: Number(amount.toFixed(6)),
      fetchedAt: new Date(),
      isStale: false,
    };
  }

  try {
    const snapshot = await getLatestSnapshot();
    const { rates, baseCurrency, fetchedAt } = snapshot;
    const isStale = isSnapshotStale(fetchedAt);

    if (isStale) {
      logger.warn(`${SERVICE_NAME}: Using stale FX snapshot (${fetchedAt})`);
    }

    // Validate currency codes exist in snapshot
    if (!rates[srcCurrency]) {
      throw new Error(`Missing FX rate for source currency: ${srcCurrency}`);
    }
    if (!rates[destCurrency]) {
      throw new Error(`Missing FX rate for destination currency: ${destCurrency}`);
    }

    const rateSrc = parseFloat(String(rates[srcCurrency]));
    const rateDest = parseFloat(String(rates[destCurrency]));

    const amountInBase = parseFloat(String(amount)) / rateSrc;
    const converted = amountInBase * rateDest;
    const fxRate = converted / parseFloat(String(amount));

    return {
      converted: Number(converted.toFixed(6)),
      fxRate: Number(fxRate.toFixed(12)),
      baseCurrency,
      baseAmount: Number(amountInBase.toFixed(6)),
      fetchedAt: new Date(fetchedAt),
      isStale,
    };
  } catch (err) {
    logger.error(
      `${SERVICE_NAME}: convertAmount(${amount}, ${srcCurrency}, ${destCurrency}) failed`,
      err as Error
    );
    throw err;
  }
}

/**
 * Save FX snapshot to Postgres (called by fxFetcher job)
 */
export async function saveSnapshot(
  source: string,
  baseCurrency: string,
  rates: Record<string, number>,
  fetchedAt: Date
): Promise<ExchangeRateSnapshot> {
  const client = await getPool().connect();
  try {
    // Check if this exact snapshot already exists (idempotency)
    const existing = await client.query(
      `SELECT id FROM exchange_rate_snapshots
       WHERE source = $1 AND base_currency = $2 AND fetched_at = $3`,
      [source, baseCurrency, fetchedAt]
    );

    if (existing.rows.length) {
      logger.info(`${SERVICE_NAME}: Snapshot for ${fetchedAt} already exists, skipping insert`);
      return existing.rows[0] as unknown as ExchangeRateSnapshot;
    }

    // Insert new snapshot
    const result = await client.query(
      `INSERT INTO exchange_rate_snapshots (source, base_currency, rates, fetched_at, status)
       VALUES ($1, $2, $3, $4, 'active')
       RETURNING id, source, base_currency as "baseCurrency", rates, fetched_at as "fetchedAt", 
                 status, created_at as "createdAt"`,
      [source, baseCurrency, JSON.stringify(rates), fetchedAt]
    );

    logger.info(`${SERVICE_NAME}: Snapshot saved for ${fetchedAt}`);
    return result.rows[0];
  } finally {
    client.release();
  }
}

/**
 * Provide CommonJS-compatible named exports for environments where
 * the module system interop wraps exports into a default object
 * (helps ts-jest / Jest resolve named exports reliably).
 */
/* istanbul ignore next */
if (typeof module !== 'undefined' && (module as any).exports) {
  try {
    Object.assign((module as any).exports, {
      initializeFxService,
      getLatestSnapshot,
      convertAmount,
      saveSnapshot,
      isSnapshotStale,
      getSnapshotHistory,
      markSnapshotStale,
      getRate,
    });
  } catch (e) {
    // ignore
  }
}

/**
 * Get historical snapshots for a date range
 */
export async function getSnapshotHistory(
  startDate: Date,
  endDate: Date,
  currency?: string
): Promise<ExchangeRateSnapshot[]> {
  try {
    let query = `SELECT * FROM exchange_rate_snapshots
                 WHERE fetched_at BETWEEN $1 AND $2`;
    const params: (Date | string)[] = [startDate, endDate];

    if (currency) {
      query += ` AND rates ? $3`;
      params.push(currency);
    }

    query += ` ORDER BY fetched_at DESC`;

    const result = await getPool().query(query, params);
    return result.rows;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: getSnapshotHistory failed`, err as Error);
    throw err;
  }
}

/**
 * Mark a snapshot as stale
 */
export async function markSnapshotStale(snapshotId: string): Promise<void> {
  try {
    await getPool().query(
      `UPDATE exchange_rate_snapshots
       SET status = 'stale'
       WHERE id = $1`,
      [snapshotId]
    );
    logger.warn(`${SERVICE_NAME}: Snapshot ${snapshotId} marked as stale`);
  } catch (err) {
    logger.error(`${SERVICE_NAME}: markSnapshotStale failed`, err as Error);
    throw err;
  }
}

/**
 * Get the most recent FX rate for a single currency pair
 */
export async function getRate(srcCurrency: string, destCurrency: string): Promise<number> {
  if (srcCurrency === destCurrency) return 1.0;

  try {
    const snapshot = await getLatestSnapshot();
    const rateSrc = parseFloat(String(snapshot.rates[srcCurrency]));
    const rateDest = parseFloat(String(snapshot.rates[destCurrency]));

    if (!rateSrc || !rateDest) {
      throw new Error(`Missing rates for ${srcCurrency}/${destCurrency}`);
    }

    return rateDest / rateSrc;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: getRate(${srcCurrency}, ${destCurrency}) failed`, err as Error);
    throw err;
  }
}


