/**
 * sync-languages.ts
 * ------------------------------------
 * Fetches LiteAPI language data (/data/languages) and populates the shared.languages table.
 * 
 * This script is a standalone utility for syncing language reference data.
 * Languages are ISO 639-1 codes used for content localization across the platform.
 *
 * Endpoint: GET /data/languages
 * Schema: shared.languages (code, name, is_enabled, created_at, updated_at)
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

const log = createLogger("Languages");

// ---- Types ------------------------------------------------

interface LiteLanguage {
  code: string;
  name: string;
}

interface LiteAPIListResponse<T> {
  data: T[];
}

// ---- Validation -------------------------------------------

function validateLanguage(lang: LiteLanguage): boolean {
  if (!lang.code || !lang.name) {
    log.warn(`Invalid language record: missing code or name`);
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

// ---- Sync Functions ---------------------------------------

async function fetchLanguages(client: AxiosInstance): Promise<LiteLanguage[]> {
  log.info("Fetching languages from LiteAPI /data/languages...");

  // Check cache first (24 hour TTL)
  let languages: LiteLanguage[] | null = cache.get<LiteLanguage[]>(
    "/data/languages",
  );

  if (languages) {
    log.info(`Languages loaded from cache (${languages.length} records)`);
    return languages;
  }

  // Fetch fresh data from API
  const resp = await withRetry(
    () => get<LiteAPIListResponse<LiteLanguage>>(client, "/data/languages"),
    "Fetch languages",
    { maxAttempts: 3 },
  );

  languages = resp.data ?? [];

  if (!Array.isArray(languages)) {
    throw new Error(
      `Invalid response format: expected array, got ${typeof languages}`,
    );
  }

  // Cache for 24 hours
  cache.set("/data/languages", languages);

  log.success(`Fetched ${languages.length} languages from API`);
  return languages;
}

async function upsertLanguages(languages: LiteLanguage[]): Promise<number> {
  log.info(`Upserting ${languages.length} languages into shared.languages...`);

  let successCount = 0;
  let skipCount = 0;

  for (const lang of languages) {
    try {
      // Validate language record
      if (!validateLanguage(lang)) {
        skipCount++;
        continue;
      }

      // Sanitize string fields
      const sanitizedCode = sanitizeString(lang.code)?.toUpperCase();
      const sanitizedName = sanitizeString(lang.name);

      if (!sanitizedCode || !sanitizedName) {
        log.warn(
          `Skipping language with empty code or name: ${JSON.stringify(lang)}`,
        );
        skipCount++;
        continue;
      }

      // Upsert into database
      await query(
        `INSERT INTO shared.languages (code, name, is_enabled, created_at, updated_at)
         VALUES ($1, $2, $3, NOW(), NOW())
         ON CONFLICT (code) DO UPDATE SET
           name       = EXCLUDED.name,
           is_enabled = EXCLUDED.is_enabled,
           updated_at = NOW()`,
        [sanitizedCode, sanitizedName, true],
      );

      successCount++;
    } catch (err) {
      log.warn(
        `Failed to upsert language ${lang.code}: ${(err as Error).message}`,
      );
    }
  }

  if (skipCount > 0) {
    log.info(`Skipped ${skipCount} invalid language records`);
  }

  log.success(`Successfully upserted ${successCount} languages`);
  return successCount;
}

async function validateAndReport(): Promise<void> {
  log.info("");
  log.info("──────────────────────────────────────────────────");
  log.info("LANGUAGES DATABASE VALIDATION & REPORT");
  log.info("──────────────────────────────────────────────────");

  interface CountRow {
    count: string;
  }

  // Total count
  const countResult = await query<CountRow>(
    "SELECT COUNT(*) as count FROM shared.languages",
  );
  const totalCount = countResult[0]?.count ?? "0";
  log.success(`  Total languages in database: ${totalCount}`);

  // Enabled count
  const enabledResult = await query<CountRow>(
    "SELECT COUNT(*) as count FROM shared.languages WHERE is_enabled = TRUE",
  );
  const enabledCount = enabledResult[0]?.count ?? "0";
  log.info(`  Enabled languages: ${enabledCount}`);

  // Sample languages
  interface LanguageSample {
    code: string;
    name: string;
    is_enabled: boolean;
  }

  const samples = await query<LanguageSample>(
    "SELECT code, name, is_enabled FROM shared.languages ORDER BY code ASC LIMIT 10",
  );

  if (samples.length > 0) {
    log.info("");
    log.info("Sample languages:");
    for (const lang of samples) {
      const status = lang.is_enabled ? "✓" : "✗";
      log.info(`  ${status} ${lang.code.padEnd(6)} → ${lang.name}`);
    }
  }

  // Verify schema
  interface SchemaCheck {
    column_name: string;
  }

  const schemaCheck = await query<SchemaCheck>(
    `SELECT column_name FROM information_schema.columns 
     WHERE table_schema = 'shared' AND table_name = 'languages'
     ORDER BY ordinal_position`,
  );

  if (schemaCheck.length > 0) {
    log.info("");
    log.info("Database schema columns:");
    for (const col of schemaCheck) {
      log.info(`  • ${col.column_name}`);
    }
  }

  log.info("──────────────────────────────────────────────────");
  log.info("");
}

// ---- Main ------------------------------------------------

export async function syncLanguages(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) throw new Error("LITEAPI_KEY environment variable is not set");

  const httpClient = createLiteApiClient(apiKey);

  try {
    log.info("Starting languages static database sync...");
    log.info("");

    // Fetch languages from LiteAPI
    const languages = await fetchLanguages(httpClient);

    // Upsert into database
    const upsertedCount = await upsertLanguages(languages);

    // Validate and report
    await validateAndReport();

    log.success("Languages database sync completed successfully!");
  } catch (err) {
    log.error(`Sync failed: ${(err as Error).message}`);
    throw err;
  }
}

// Node.js-compatible main module check
if (require.main === module) {
  syncLanguages()
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