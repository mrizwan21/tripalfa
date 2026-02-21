// src/jobs/fxFetcher.ts
// Hourly scheduled job to fetch and store FX snapshots from OpenExchangeRates

import fetch from 'node-fetch';
import cron from 'node-cron';
import { prisma } from '../config/db.js';
import { saveSnapshot } from '../services/fxService.js';
import { logger } from '../utils/logger.js';

const SERVICE_NAME = 'fxFetcher';
const OXR_KEY = process.env.OPENEXCHANGE_KEY;
const OXR_URL = 'https://openexchangerates.org/api/latest.json';
const BASE_CURRENCY = 'USD';
const SOURCE = 'openexchangerates';
const FETCH_TIMEOUT_MS = 15000;
const MAX_RETRIES = 3;
const RETRY_BACKOFF_MS = 2000;

interface OXRResponse {
  rates: Record<string, number>;
  timestamp: number;
}

/**
 * Fetch rates from OpenExchangeRates API with exponential backoff retries
 */
async function fetchRatesWithRetry(retryCount: number = 0): Promise<OXRResponse> {
  if (!OXR_KEY) {
    throw new Error('OPENEXCHANGE_KEY environment variable not set');
  }

  const url = `${OXR_URL}?app_id=${OXR_KEY}&base=${BASE_CURRENCY}`;

  try {
    logger.info(
      `${SERVICE_NAME}: Fetching rates from OpenExchangeRates (attempt ${retryCount + 1}/${MAX_RETRIES})`
    );

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

    const response = await fetch(url, {
      signal: controller.signal as any,
    } as any);

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = (await response.json()) as OXRResponse;

    if (!data.rates) {
      throw new Error('Invalid response: missing rates field');
    }

    logger.info(
      `${SERVICE_NAME}: Successfully fetched rates with ${Object.keys(data.rates).length} currencies`
    );
    return data;
  } catch (err) {
    const error = err as Error;
    logger.warn(`${SERVICE_NAME}: Fetch attempt ${retryCount + 1} failed: ${error.message}`);

    if (retryCount < MAX_RETRIES - 1) {
      const backoffMs = RETRY_BACKOFF_MS * Math.pow(2, retryCount);
      logger.info(`${SERVICE_NAME}: Retrying in ${backoffMs}ms...`);
      await new Promise((resolve) => setTimeout(resolve, backoffMs));
      return fetchRatesWithRetry(retryCount + 1);
    }

    throw err;
  }
}

/**
 * Main fetch and save operation
 */
export async function fetchAndSaveRates(): Promise<any> {
  const startTime = Date.now();

  try {
    logger.info(`${SERVICE_NAME}: Starting FX fetch job`);

    // 1. Fetch from API
    const data = await fetchRatesWithRetry();

    // 2. Convert timestamp to ISO string
    const fetchedAt = new Date(data.timestamp * 1000);

    // 3. Save to database
    const snapshot = await saveSnapshot(SOURCE, BASE_CURRENCY, data.rates, fetchedAt);

    const duration = Date.now() - startTime;
    logger.info(`${SERVICE_NAME}: FX fetch completed in ${duration}ms`, {
      snapshotId: snapshot.id,
      fetchedAt,
      currencyCount: Object.keys(data.rates).length,
    });

    // 4. Emit success metric
    await emitMetric('fx_fetch_success', 1, duration);

    return snapshot;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: FX fetch failed`, err as Error);

    // Emit failure metric and alert
    await emitMetric('fx_fetch_failure', 1);
    await alertOnFailure(err as Error);

    throw err;
  }
}

/**
 * Emit metrics (placeholder for Prometheus/monitoring integration)
 */
async function emitMetric(
  metricName: string,
  value: number,
  duration?: number
): Promise<void> {
  logger.info(
    `${SERVICE_NAME}: Metric - ${metricName}: ${value}${duration ? ` (${duration}ms)` : ''}`
  );
}

/**
 * Alert on repeated failures
 */
async function alertOnFailure(err: Error): Promise<void> {
  try {
    const threeHoursAgo = new Date();
    threeHoursAgo.setHours(threeHoursAgo.getHours() - 3);
    
    const failCount = await prisma.exchangeRate.count({
      where: {
        source: SOURCE,
        fetchedAt: { lt: threeHoursAgo },
      },
    });

    if (failCount >= 3) {
      logger.warn(
        `${SERVICE_NAME}: 3+ consecutive FX fetch failures in last 3 hours. Alerting ops.`
      );
    }
  } catch (alertErr) {
    logger.error(`${SERVICE_NAME}: Failed to check alert threshold`, alertErr as Error);
  }
}

/**
 * Schedule FX fetcher (every hour at :05)
 */
function scheduleFxFetcher(): void {
  logger.info(`${SERVICE_NAME}: Scheduling FX fetch job (every hour at :05)`);

  cron.schedule('5 * * * *', async () => {
    try {
      await fetchAndSaveRates();
    } catch (err) {
      logger.error(`${SERVICE_NAME}: Scheduled job failed`, err as Error);
    }
  });

  logger.info(`${SERVICE_NAME}: Cron job scheduled`);
}

/**
 * Manual trigger for immediate fetch
 */
async function triggerNow(): Promise<void> {
  try {
    const snapshot = await fetchAndSaveRates();
    console.log('✓ FX fetch successful:', snapshot);
    process.exit(0);
  } catch (err) {
    console.error('✗ FX fetch failed:', err);
    process.exit(1);
  }
}

// ============================================================================
// ENTRY POINT
// ============================================================================

if (process.argv[2] === '--now') {
  triggerNow();
} else {
  scheduleFxFetcher();
  logger.info(`${SERVICE_NAME}: Job scheduler running. Press Ctrl+C to exit.`);
}

export { scheduleFxFetcher, triggerNow };
