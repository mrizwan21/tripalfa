/**
 * sync-facilities.ts
 * ------------------------------------
 * Fetches LiteAPI facility data (/data/facilities) and populates the hotel.facilities table.
 * 
 * This script is a standalone utility for syncing hotel facility reference data.
 * Facilities include amenities like WiFi, Pool, Gym, Parking, etc.
 *
 * Endpoint: GET /data/facilities
 * Schema: hotel.facilities (id, name, translations, created_at, updated_at)
 */

import { fileURLToPath } from "url";
import * as dotenv from "dotenv";
dotenv.config();

import type { AxiosInstance } from "axios";
import { createLiteApiClient, get } from "./utils/http";
import { query, closePool } from "./utils/db";
import { createLogger } from "./utils/logger";
import { cache } from "./utils/cache";
import { withRetry } from "./utils/retry";

const log = createLogger("Facilities");

// ---- Types ------------------------------------------------

interface LiteFacility {
  id: number;
  name: string;
  [key: string]: unknown; // Language translations
}

interface LiteAPIListResponse<T> {
  data: T[];
}

// ---- Validation -------------------------------------------

function validateFacility(facility: LiteFacility): boolean {
  if (facility.id == null || !facility.name) {
    log.warn(`Invalid facility record: missing id or name`);
    return false;
  }
  return true;
}

/**
 * Sanitize a string for PostgreSQL UTF8 storage.
 * Removes null bytes (0x00) and other invalid UTF8 sequences.
 */
function sanitizeString(str: string | null | undefined): string | null {
  if (!str) return null;
  return str
    .replace(/\0/g, "")
    .split("")
    .filter((char) => {
      const code = char.charCodeAt(0);
      return (
        code === 9 || code === 10 || code === 13 || (code >= 32 && code !== 127)
      );
    })
    .join("")
    .trim();
}

/**
 * Extract translations from facility object.
 * LiteAPI returns additional keys that represent translations in different languages.
 */
function extractTranslations(facility: LiteFacility): Record<string, string> {
  const { id, name, ...rest } = facility;
  const translations: Record<string, string> = {};

  for (const [key, value] of Object.entries(rest)) {
    // Translation keys are typically short (2-5 chars for language codes)
    // and contain string values
    if (
      typeof value === "string" &&
      key.length <= 10 &&
      key !== "description" &&
      key !== "type"
    ) {
      const sanitized = sanitizeString(value);
      if (sanitized) {
        translations[key] = sanitized;
      }
    }
  }

  return translations;
}

// ---- Sync Functions ---------------------------------------

async function fetchFacilities(client: AxiosInstance): Promise<LiteFacility[]> {
  log.info("Fetching facilities from LiteAPI /data/facilities...");

  // Check cache first (24 hour TTL)
  let facilities: LiteFacility[] | null = cache.get<LiteFacility[]>(
    "/data/facilities",
  );

  if (facilities) {
    log.info(`Facilities loaded from cache (${facilities.length} records)`);
    return facilities;
  }

  // Fetch fresh data from API
  const resp = await withRetry(
    () => get<LiteAPIListResponse<LiteFacility>>(client, "/data/facilities"),
    "Fetch facilities",
    { maxAttempts: 3 },
  );

  facilities = resp.data ?? [];

  if (!Array.isArray(facilities)) {
    throw new Error(
      `Invalid response format: expected array, got ${typeof facilities}`,
    );
  }

  // Cache for 24 hours
  cache.set("/data/facilities", facilities);

  log.success(`Fetched ${facilities.length} facilities from API`);
  return facilities;
}

async function upsertFacilities(facilities: LiteFacility[]): Promise<number> {
  log.info(`Upserting ${facilities.length} facilities into hotel.facilities...`);

  let successCount = 0;
  let skipCount = 0;
  const failedIds: number[] = [];

  for (const facility of facilities) {
    try {
      // Validate facility record
      if (!validateFacility(facility)) {
        skipCount++;
        continue;
      }

      // Sanitize string fields
      const sanitizedName = sanitizeString(facility.name);

      if (!sanitizedName) {
        log.warn(
          `Skipping facility with empty name: ${JSON.stringify(facility)}`,
        );
        skipCount++;
        continue;
      }

      // Extract and prepare translations
      const translations = extractTranslations(facility);
      const translationsJson =
        Object.keys(translations).length > 0
          ? JSON.stringify(translations)
          : null;

      // Upsert into database
      await query(
        `INSERT INTO hotel.facilities (id, name, translations, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (id) DO UPDATE SET
           name            = EXCLUDED.name,
           translations    = EXCLUDED.translations,
           updated_at      = NOW()`,
        [facility.id, sanitizedName, translationsJson],
      );

      successCount++;
    } catch (err) {
      log.warn(
        `Failed to upsert facility ${facility.id}: ${(err as Error).message}`,
      );
      failedIds.push(facility.id);
    }
  }

  if (skipCount > 0) {
    log.info(`Skipped ${skipCount} invalid facility records`);
  }

  if (failedIds.length > 0) {
    log.warn(`Failed to upsert facility IDs: ${failedIds.join(", ")}`);
  }

  log.success(`Successfully upserted ${successCount} facilities`);
  return successCount;
}

async function validateAndReport(): Promise<void> {
  log.info("");
  log.info("──────────────────────────────────────────────────");
  log.info("FACILITIES DATABASE VALIDATION & REPORT");
  log.info("──────────────────────────────────────────────────");

  interface CountRow {
    count: string;
  }

  // Total count
  const countResult = await query<CountRow>(
    "SELECT COUNT(*) as count FROM hotel.facilities",
  );
  const totalCount = countResult[0]?.count ?? "0";
  log.success(`  Total facilities in database: ${totalCount}`);

  // Count facilities with translations
  const translationsResult = await query<CountRow>(
    "SELECT COUNT(*) as count FROM hotel.facilities WHERE translations IS NOT NULL",
  );
  const withTranslations = translationsResult[0]?.count ?? "0";
  log.info(`  Facilities with translations: ${withTranslations}`);

  // Sample facilities
  interface FacilitySample {
    id: number;
    name: string;
    translations: string | null;
  }

  const samples = await query<FacilitySample>(
    "SELECT id, name, translations FROM hotel.facilities ORDER BY id ASC LIMIT 15",
  );

  if (samples.length > 0) {
    log.info("");
    log.info("Sample facilities:");
    for (const facility of samples) {
      const transCount = facility.translations
        ? Object.keys(JSON.parse(facility.translations)).length
        : 0;
      const transLabel =
        transCount > 0 ? ` (+${transCount} translations)` : "";
      log.info(
        `  • [${String(facility.id).padStart(3)}] ${facility.name}${transLabel}`,
      );
    }
  }

  // Verify schema
  interface SchemaCheck {
    column_name: string;
  }

  const schemaCheck = await query<SchemaCheck>(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'hotel' AND table_name = 'facilities'
     ORDER BY ordinal_position`,
  );

  if (schemaCheck.length > 0) {
    log.info("");
    log.info("Database schema columns:");
    for (const col of schemaCheck) {
      log.info(`  • ${col.column_name}`);
    }
  }

  // Verify indexes
  interface IndexCheck {
    indexname: string;
  }

  const indexCheck = await query<IndexCheck>(
    `SELECT indexname FROM pg_indexes 
     WHERE tablename = 'facilities' AND schemaname = 'hotel'
     ORDER BY indexname`,
  );

  if (indexCheck.length > 0) {
    log.info("");
    log.info("Database indexes:");
    for (const idx of indexCheck) {
      log.info(`  • ${idx.indexname}`);
    }
  }

  log.info("──────────────────────────────────────────────────");
  log.info("");
}

// ---- Main ------------------------------------------------

export async function syncFacilities(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) throw new Error("LITEAPI_KEY environment variable is not set");

  const httpClient = createLiteApiClient(apiKey);

  try {
    log.info("Starting facilities static database sync...");
    log.info("");

    // Fetch facilities from LiteAPI
    const facilities = await fetchFacilities(httpClient);

    // Upsert into database
    const upsertedCount = await upsertFacilities(facilities);

    // Validate and report
    await validateAndReport();

    log.success("Facilities database sync completed successfully!");
  } catch (err) {
    log.error(`Sync failed: ${(err as Error).message}`);
    throw err;
  }
}

// Node.js-compatible main module check
if (require.main === module) {
  syncFacilities()
    .then(() => {
      closePool();
      process.exit(0);
    })
    .catch((err: unknown) => {
      log.error((err as Error).message);
      closePool();
      process.exit(1);
    });
}