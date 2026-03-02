// src/services/fxService.ts
// FX rate fetching, conversion, and snapshot management using Prisma
import { prisma } from "../config/db.js";
import { logger } from "../utils/logger.js";
import type { FxConversionResult } from "../types/wallet.js";

const SERVICE_NAME = "fxService";

// Cache for latest rates
let cachedRates: Record<string, number> = {};
let cachedAt: Date | null = null;

/**
 * Get all FX rates from database (caches internally)
 */
async function getAllRates(): Promise<Record<string, number>> {
  // Use cache if less than 1 hour old
  if (cachedAt && Date.now() - cachedAt.getTime() < 60 * 60 * 1000) {
    return cachedRates;
  }

  try {
    const rates = await prisma.exchangeRate.findMany({
      where: {
        fetchedAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
      orderBy: { fetchedAt: "desc" },
    });

    // Build rates map from targetCurrency
    const ratesMap: Record<string, number> = {};
    for (const r of rates) {
      if (!ratesMap[r.targetCurrency]) {
        ratesMap[r.targetCurrency] = Number(r.rate);
      }
    }

    cachedRates = ratesMap;
    cachedAt = new Date();

    return ratesMap;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: getAllRates failed`, err as Error);
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
  destCurrency: string,
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
    const rates = await getAllRates();

    // Validate currency codes exist in rates
    if (!rates[srcCurrency]) {
      throw new Error(`Missing FX rate for source currency: ${srcCurrency}`);
    }
    if (!rates[destCurrency]) {
      throw new Error(
        `Missing FX rate for destination currency: ${destCurrency}`,
      );
    }

    const rateSrc = rates[srcCurrency];
    const rateDest = rates[destCurrency];

    const amountInBase = parseFloat(String(amount)) / rateSrc;
    const converted = amountInBase * rateDest;
    const fxRate = converted / parseFloat(String(amount));

    return {
      converted: Number(converted.toFixed(6)),
      fxRate: Number(fxRate.toFixed(12)),
      baseCurrency: "USD",
      baseAmount: Number(amountInBase.toFixed(6)),
      fetchedAt: cachedAt || new Date(),
      isStale: cachedAt ? isSnapshotStale(cachedAt) : true,
    };
  } catch (err) {
    logger.error(
      `${SERVICE_NAME}: convertAmount(${amount}, ${srcCurrency}, ${destCurrency}) failed`,
      err as Error,
    );
    throw err;
  }
}

/**
 * Save FX rate to database (called by fxFetcher job)
 */
export async function saveSnapshot(
  source: string,
  baseCurrency: string,
  rates: Record<string, number>,
  fetchedAt: Date,
): Promise<any> {
  try {
    // Save each rate as a separate record
    for (const [targetCurrency, rate] of Object.entries(rates)) {
      await prisma.exchangeRate.upsert({
        where: {
          source_baseCurrency_targetCurrency: {
            source,
            baseCurrency,
            targetCurrency,
          },
        },
        update: {
          rate,
          fetchedAt,
        },
        create: {
          source,
          baseCurrency,
          targetCurrency,
          rate,
          fetchedAt,
        },
      });
    }

    // Invalidate cache
    cachedRates = {};
    cachedAt = null;

    logger.info(`${SERVICE_NAME}: Snapshot saved for ${fetchedAt}`);
    return { success: true, fetchedAt };
  } catch (err) {
    logger.error(`${SERVICE_NAME}: saveSnapshot failed`, err as Error);
    throw err;
  }
}

/**
 * Get historical snapshots for a date range
 */
export async function getSnapshotHistory(
  startDate: Date,
  endDate: Date,
  _currency?: string,
): Promise<any[]> {
  try {
    const snapshots = await prisma.exchangeRate.findMany({
      where: {
        fetchedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { fetchedAt: "desc" },
    });

    return snapshots;
  } catch (err) {
    logger.error(`${SERVICE_NAME}: getSnapshotHistory failed`, err as Error);
    throw err;
  }
}

/**
 * Mark old snapshots as stale
 */
export async function markSnapshotStale(_snapshotId: string): Promise<void> {
  try {
    // Mark all rates older than 3 hours as stale by deleting them
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    await prisma.exchangeRate.deleteMany({
      where: {
        fetchedAt: { lt: threeHoursAgo },
      },
    });
    logger.warn(`${SERVICE_NAME}: Old snapshots marked as stale`);
  } catch (err) {
    logger.error(`${SERVICE_NAME}: markSnapshotStale failed`, err as Error);
    throw err;
  }
}

/**
 * Get the most recent FX rate for a single currency pair
 */
export async function getRate(
  srcCurrency: string,
  destCurrency: string,
): Promise<number> {
  if (srcCurrency === destCurrency) return 1.0;

  try {
    const rates = await getAllRates();

    const rateSrc = rates[srcCurrency];
    const rateDest = rates[destCurrency];

    if (!rateSrc || !rateDest) {
      throw new Error(`Missing rates for ${srcCurrency}/${destCurrency}`);
    }

    return rateDest / rateSrc;
  } catch (err) {
    logger.error(
      `${SERVICE_NAME}: getRate(${srcCurrency}, ${destCurrency}) failed`,
      err as Error,
    );
    throw err;
  }
}

// Keep initializeFxService for backward compatibility
export function initializeFxService(_pgPool: any): void {
  // No longer needed - using Prisma directly
  logger.info(`${SERVICE_NAME}: FX service initialized with Prisma`);
}

// For backward compatibility - get latest snapshot
export async function getLatestSnapshot(): Promise<any> {
  const rates = await getAllRates();
  return {
    rates,
    fetchedAt: cachedAt || new Date(),
    baseCurrency: "USD",
  };
}

export default {
  initializeFxService,
  getLatestSnapshot,
  convertAmount,
  saveSnapshot,
  isSnapshotStale,
  getSnapshotHistory,
  markSnapshotStale,
  getRate,
};
