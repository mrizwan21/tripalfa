/**
 * sync-facilities-full.ts
 * ------------------------------------
 * Enhanced facilities sync with complete language translation support.
 * 
 * Features:
 * - Captures ALL language translations from LiteAPI response
 * - Test mode: Limit to N facilities for validation
 * - Comprehensive logging of imported data
 * - Detailed translation coverage reporting
 * - Validates all data is saved to local database
 *
 * Endpoint: GET https://api.liteapi.travel/v3.0/data/facilities
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

const log = createLogger("Facilities-Full");

// ---- Environment Configuration ----

const TEST_MODE = process.env.SYNC_TEST_MODE === "true";
const TEST_LIMIT = Number(process.env.SYNC_TEST_LIMIT ?? 100);
const VERBOSE_LOGGING = process.env.SYNC_VERBOSE === "true";

// ---- Types ------------------------------------------------

interface LiteFacility {
  id: number;
  name: string;
  [key: string]: unknown; // All language translations
}

interface LiteAPIListResponse<T> {
  data: T[];
}

interface TranslationStats {
  facilityId: number;
  facilityName: string;
  languageCount: number;
  languages: string[];
  translations: Record<string, string>;
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
 * Extract ALL translations from facility object.
 * Captures any string-valued keys as language translations.
 * 
 * Example API response structure:
 * {
 *   "id": 1,
 *   "name": "WiFi",
 *   "en": "WiFi",
 *   "fr": "WiFi",
 *   "es": "WiFi",
 *   "de": "WiFi",
 *   "pt": "WiFi",
 *   "zh": "WiFi",
 *   "ja": "WiFi",
 *   "ko": "WiFi"
 * }
 */
function extractAllTranslations(facility: LiteFacility): TranslationStats {
  const { id, name, ...rest } = facility;
  const translations: Record<string, string> = {};
  const languages: string[] = [];
  let skippedFields = 0;

  if (VERBOSE_LOGGING) {
    log.info(`Processing facility ID ${id}: "${name}"`);
    log.info(`  Raw keys in response: ${Object.keys({ id, name, ...rest }).join(", ")}`);
  }

  for (const [key, value] of Object.entries(rest)) {
    // Standard fields to skip
    const skipFields = [
      "description",
      "type",
      "category",
      "image",
      "images",
      "imageurl",
      "image_url",
      "icon",
      "iconurl",
      "icon_url",
      "sorting",
      "order",
      "active",
      "enabled",
      "isactive",
      "is_active",
    ];

    // Check if this is a field to skip
    if (skipFields.includes(key.toLowerCase())) {
      skippedFields++;
      if (VERBOSE_LOGGING) {
        log.debug(`  Skipping known field: ${key}`);
      }
      continue;
    }

    // Only process string values as translations
    if (typeof value === "string" && value.trim()) {
      const sanitized = sanitizeString(value);
      if (sanitized) {
        const langCode = key.toLowerCase();
        translations[langCode] = sanitized;
        languages.push(langCode);

        if (VERBOSE_LOGGING) {
          log.debug(`  Translation [${langCode}]: ${sanitized.substring(0, 60)}`);
        }
      }
    } else if (VERBOSE_LOGGING && typeof value !== "string") {
      log.debug(`  Skipping non-string value for key "${key}" (type: ${typeof value})`);
    }
  }

  if (VERBOSE_LOGGING) {
    log.info(
      `  Total translations: ${languages.length}, Skipped fields: ${skippedFields}`
    );
  }

  return {
    facilityId: id,
    facilityName: name,
    languageCount: languages.length,
    languages: languages.sort(),
    translations,
  };
}

// ---- Sync Functions ---------------------------------------

async function fetchFacilities(client: AxiosInstance): Promise<LiteFacility[]> {
  log.info("Fetching facilities from LiteAPI /data/facilities...");

  if (TEST_MODE) {
    log.warn(`TEST MODE ENABLED: Will limit to ${TEST_LIMIT} facilities`);
  }

  // Check cache first (24 hour TTL)
  let facilities: LiteFacility[] | null = cache.get<LiteFacility[]>(
    "/data/facilities",
  );

  if (facilities && !TEST_MODE) {
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

  // Apply test limit if enabled
  if (TEST_MODE && facilities.length > TEST_LIMIT) {
    const originalCount = facilities.length;
    facilities = facilities.slice(0, TEST_LIMIT);
    log.warn(
      `TEST MODE: Limited facilities from ${originalCount} to ${TEST_LIMIT} for testing`,
    );
  }

  // Cache for 24 hours (unless test mode)
  if (!TEST_MODE) {
    cache.set("/data/facilities", facilities);
  }

  log.success(`Fetched ${facilities.length} facilities from API`);
  return facilities;
}

async function upsertFacilities(
  facilities: LiteFacility[],
): Promise<{
  successCount: number;
  skipCount: number;
  transactionStats: TranslationStats[];
}> {
  log.info(`Upserting ${facilities.length} facilities into hotel.facilities...`);

  let successCount = 0;
  let skipCount = 0;
  const failedIds: number[] = [];
  const transactionStats: TranslationStats[] = [];

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

      // Extract ALL translations
      const transStats = extractAllTranslations(facility);
      const translationsJson =
        Object.keys(transStats.translations).length > 0
          ? JSON.stringify(transStats.translations)
          : null;

      log.info(
        `Facility ${facility.id}: "${sanitizedName}" with ${transStats.languageCount} language translations [${transStats.languages.join(", ")}]`,
      );

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
      transactionStats.push(transStats);
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
  return { successCount, skipCount, transactionStats };
}

async function verifyImportedData(): Promise<void> {
  log.info("");
  log.info("──────────────────────────────────────────────────");
  log.info("VERIFYING IMPORTED DATA");
  log.info("──────────────────────────────────────────────────");

  interface FacilityCheck {
    id: number;
    name: string;
    translation_count: number;
    translations: string;
  }

  // Verify recent insertions
  const recentFacilities = await query<FacilityCheck>(
    `SELECT 
       id, 
       name, 
       jsonb_object_keys(translations) as translation_count,
       translations::text
     FROM hotel.facilities 
     WHERE updated_at > NOW() - INTERVAL '5 minutes'
     ORDER BY id ASC`,
  );

  if (recentFacilities.length === 0) {
    log.warn("No recently updated facilities found!");
    return;
  }

  log.success(`Verified ${recentFacilities.length} recently imported facilities`);
  log.info("");
  log.info("Sample of imported facilities with translations:");

  for (const facility of recentFacilities.slice(0, 10)) {
    try {
      const translations = JSON.parse(facility.translations);
      const langCount = Object.keys(translations).length;
      const languages = Object.keys(translations).sort().join(", ");
      log.info(
        `  • [ID ${facility.id}] ${facility.name} (${langCount} languages: ${languages.substring(0, 100)})`,
      );

      // Log some sample translations
      if (VERBOSE_LOGGING && Object.keys(translations).length > 0) {
        const sampleLangs = Object.keys(translations).slice(0, 3);
        for (const lang of sampleLangs) {
          log.debug(
            `    - ${lang}: ${translations[lang].substring(0, 60)}`,
          );
        }
      }
    } catch (err) {
      log.warn(`Could not parse translations for facility ${facility.id}`);
    }
  }

  log.info("");
}

async function generateTranslationReport(
  stats: TranslationStats[],
): Promise<void> {
  log.info("");
  log.info("──────────────────────────────────────────────────");
  log.info("TRANSLATION COVERAGE REPORT");
  log.info("──────────────────────────────────────────────────");

  // Aggregate language coverage
  const allLanguages = new Set<string>();
  const languageFrequency: Record<string, number> = {};

  for (const stat of stats) {
    for (const lang of stat.languages) {
      allLanguages.add(lang);
      languageFrequency[lang] = (languageFrequency[lang] || 0) + 1;
    }
  }

  log.success(`Total unique languages across all facilities: ${allLanguages.size}`);
  log.info(`Languages: ${Array.from(allLanguages).sort().join(", ")}`);

  log.info("");
  log.info("Language Coverage (facilities with translation):");

  const sortedLangs = Object.entries(languageFrequency).sort(
    (a, b) => b[1] - a[1],
  );

  for (const [lang, count] of sortedLangs.slice(0, 20)) {
    const percentage = Math.round((count / stats.length) * 100);
    const bar = "█".repeat(Math.round(percentage / 5));
    log.info(`  ${lang.padEnd(6)} │ ${bar.padEnd(20)} │ ${count}/${stats.length} (${percentage}%)`);
  }

  // Translation completeness
  const withTranslations = stats.filter((s) => s.languageCount > 0).length;
  const withoutTranslations = stats.length - withTranslations;

  log.info("");
  log.info("Translation Completeness:");
  log.info(`  With translations: ${withTranslations}/${stats.length}`);
  log.info(`  Without translations: ${withoutTranslations}/${stats.length}`);

  const avgTranslations = Math.round(
    stats.reduce((sum, s) => sum + s.languageCount, 0) / stats.length,
  );
  log.info(`  Average translations per facility: ${avgTranslations}`);

  log.info("──────────────────────────────────────────────────");
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

  // Count active facilities
  const activeResult = await query<CountRow>(
    "SELECT COUNT(*) as count FROM hotel.facilities WHERE is_active = TRUE",
  );
  const activeCount = activeResult[0]?.count ?? "0";
  log.info(`  Active facilities: ${activeCount}`);

  // Sample facilities with detailed translation info
  interface FacilitySample {
    id: number;
    name: string;
    translations: string | null;
  }

  const samples = await query<FacilitySample>(
    "SELECT id, name, translations FROM hotel.facilities ORDER BY id ASC LIMIT 20",
  );

  if (samples.length > 0) {
    log.info("");
    log.info("Sample facilities with translation counts:");
    for (const facility of samples) {
      const transCount = facility.translations
        ? Object.keys(JSON.parse(facility.translations)).length
        : 0;
      const transLabel =
        transCount > 0 ? ` (+${transCount} languages)` : " (no translations)";
      log.info(
        `  • [${String(facility.id).padStart(4)}] ${facility.name}${transLabel}`,
      );
    }
  }

  log.info("──────────────────────────────────────────────────");
  log.info("");
}

// ---- Main ------------------------------------------------

export async function syncFacilitiesFull(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) throw new Error("LITEAPI_KEY environment variable is not set");

  const httpClient = createLiteApiClient(apiKey);

  try {
    log.info("Starting facilities sync with full translation support...");
    
    if (TEST_MODE) {
      log.warn(`🧪 TEST MODE ACTIVE: Limiting to ${TEST_LIMIT} facilities`);
    }
    if (VERBOSE_LOGGING) {
      log.warn("📝 VERBOSE LOGGING ENABLED: Detailed translation logging");
    }

    log.info("");

    // Fetch facilities from LiteAPI
    const facilities = await fetchFacilities(httpClient);

    // Upsert into database with comprehensive logging
    const { successCount, skipCount, transactionStats } =
      await upsertFacilities(facilities);

    // Verify data was actually saved
    await verifyImportedData();

    // Generate translation coverage report
    if (transactionStats.length > 0) {
      await generateTranslationReport(transactionStats);
    }

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
  syncFacilitiesFull()
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