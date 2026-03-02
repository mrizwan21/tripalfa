/**
 * sync-exchange-rates.ts
 * ------------------------------------
 * Fetches latest exchange rates from OpenExchangeRates (base=USD)
 * and maps ISO 4217 decimal precision, then upserts into:
 *   shared.currencies       (rate_vs_usd, decimal_precision, rate_updated_at)
 *   shared.exchange_rate_history  (immutable audit log)
 *
 * App ID: 8d44ab64feac4666aed17e66dd939a9e
 */

import * as dotenv from "dotenv";
dotenv.config();

import { createOERClient, get } from "./utils/http";
import { query, withTransaction, closePool } from "./utils/db";
import { createLogger } from "./utils/logger";

const log = createLogger("ExchangeRates");

// ISO 4217 decimal precision (minor unit digits) — standard reference
const DECIMAL_PRECISION: Record<string, number> = {
  // 0 decimal places
  BIF: 0,
  CLP: 0,
  DJF: 0,
  GNF: 0,
  ISK: 0,
  JPY: 0,
  KMF: 0,
  KRW: 0,
  MGA: 0,
  PYG: 0,
  RWF: 0,
  UGX: 0,
  VND: 0,
  VUV: 0,
  XAF: 0,
  XOF: 0,
  XPF: 0,
  // 3 decimal places
  BHD: 3,
  IQD: 3,
  JOD: 3,
  KWD: 3,
  LYD: 3,
  MRU: 3,
  OMR: 3,
  TND: 3,
  // 8 decimal places for crypto
  BTC: 8,
  ETH: 8,
  XBT: 8,
  // Default: 2
};

interface OERResponse {
  disclaimer: string;
  license: string;
  timestamp: number;
  base: string;
  rates: Record<string, number>;
}

export async function syncExchangeRates(): Promise<void> {
  const appId = process.env.OER_APP_ID;
  if (!appId) throw new Error("OER_APP_ID is not set");

  log.info("Fetching latest rates from OpenExchangeRates...");
  const client = createOERClient(appId);
  const data = await get<OERResponse>(client, "/latest.json", {
    app_id: appId,
  });

  const effectiveAt = new Date(data.timestamp * 1000);
  const rates = data.rates; // { USD: 1, EUR: 0.848512, ... }
  const codes = Object.keys(rates);

  log.info(
    `Received ${codes.length} currency rates (base=${data.base}, effective=${effectiveAt.toISOString()})`,
  );

  await withTransaction(async (client) => {
    let upserted = 0;
    let logged = 0;

    for (const [code, rate] of Object.entries(rates)) {
      const decimalPrecision = DECIMAL_PRECISION[code] ?? 2;

      // Upsert into shared.currencies
      await client.query(
        `INSERT INTO shared.currencies (code, name, decimal_precision, rate_vs_usd, rate_updated_at)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (code) DO UPDATE SET
           rate_vs_usd       = EXCLUDED.rate_vs_usd,
           decimal_precision = EXCLUDED.decimal_precision,
           rate_updated_at   = EXCLUDED.rate_updated_at,
           updated_at        = NOW()`,
        [code, code, decimalPrecision, rate, effectiveAt],
      );
      upserted++;

      // Append to audit log
      await client.query(
        `INSERT INTO shared.exchange_rate_history (currency_code, rate_vs_usd, effective_at, source)
         VALUES ($1, $2, $3, 'openexchangerates')
         ON CONFLICT DO NOTHING`,
        [code, rate, effectiveAt],
      );
      logged++;
    }

    log.success(
      `Upserted ${upserted} currency rates, logged ${logged} history rows`,
    );
  });
}

// Run as standalone script
if (require.main === module) {
  syncExchangeRates()
    .then(() => {
      log.success("Exchange rate sync complete");
      return closePool();
    })
    .catch((err: unknown) => {
      log.error(`Exchange rate sync failed: ${(err as Error).message}`);
      process.exit(1);
    });
}
