/**
 * sync-hotel-reviews.ts
 * Fetches hotel reviews from LiteAPI /data/reviews endpoint for all hotels
 * and inserts them into the hotel.reviews table.
 */

import * as dotenv from "dotenv";
dotenv.config();

import pLimit from "p-limit";
import { createLiteApiClient, get } from "./utils/http";
import { query, closePool } from "./utils/db";
import { createLogger } from "./utils/logger";
import { withRetry } from "./utils/retry";
import type { AxiosInstance } from "axios";

const log = createLogger("HotelReviews");

const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 20);
const API_CALL_DELAY_MS = Number(process.env.LITEAPI_API_CALL_DELAY_MS ?? 200);
const MAX_RETRY_ATTEMPTS = Number(process.env.LITEAPI_MAX_RETRY_ATTEMPTS ?? 2);
const HOTEL_BATCH_SIZE = Number(process.env.REVIEW_SYNC_BATCH_SIZE ?? 5000);
const REQUEST_TIMEOUT_MS = Number(process.env.REVIEW_SYNC_TIMEOUT_MS ?? 30000);

interface LiteReview {
  averageScore: number;
  country: string;
  type: string;
  name: string;
  date: string;
  headline: string;
  language: string;
  pros: string;
  cons: string;
}

interface LiteReviewsResponse {
  data: LiteReview[];
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function sanitizeString(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  const trimmed = input.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function sanitizeCountryCode(input: unknown): string | null {
  if (!input || typeof input !== "string") return null;
  const normalized = input.trim().toLowerCase();
  return /^[a-z]{2}$/.test(normalized) ? normalized : null;
}

function getValidLanguageCode(
  language: string | undefined,
  validLangSet: Set<string>,
): string | null {
  const langCode = language?.toLowerCase();
  return langCode && validLangSet.has(langCode) ? langCode : null;
}

async function insertSingleReview(
  hotelId: string,
  review: LiteReview,
  validLangSet: Set<string>,
): Promise<boolean> {
  const inserted = await query(
    `INSERT INTO hotel.reviews (
      hotel_id, average_score, reviewer_country, traveler_type,
      reviewer_name, review_date, headline, language_code, pros, cons, source
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
    ON CONFLICT DO NOTHING
    RETURNING hotel_id`,
    [
      hotelId,
      review.averageScore ?? null,
      sanitizeCountryCode(review.country),
      sanitizeString(review.type),
      sanitizeString(review.name),
      review.date ? new Date(review.date) : null,
      sanitizeString(review.headline),
      getValidLanguageCode(review.language, validLangSet),
      sanitizeString(review.pros),
      sanitizeString(review.cons),
      "liteapi",
    ],
  );

  return inserted.length > 0;
}

async function initProgressTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS review_sync_progress (
      hotel_id TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      reviews_count INT DEFAULT 0,
      error_message TEXT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getPendingHotelIds(limit: number): Promise<string[]> {
  const results = await query<{ id: string }>(
    "SELECT id FROM hotel.hotels WHERE id NOT IN (SELECT hotel_id FROM review_sync_progress WHERE status = 'completed') ORDER BY id LIMIT $1",
    [limit],
  );
  return results.map((r) => r.id);
}

async function updateProgress(
  hotelId: string,
  status: string,
  reviewCount: number = 0,
  errorMsg?: string,
): Promise<void> {
  await query(
    `INSERT INTO review_sync_progress (hotel_id, status, reviews_count, error_message, updated_at)
     VALUES ($1, $2, $3, $4, NOW())
     ON CONFLICT (hotel_id) DO UPDATE SET status = $2, reviews_count = $3, error_message = $4, updated_at = NOW()`,
    [hotelId, status, reviewCount, errorMsg || null],
  );
}

async function fetchHotelReviews(
  client: AxiosInstance,
  hotelId: string,
): Promise<LiteReview[]> {
  await sleep(API_CALL_DELAY_MS);

  const reviews = await withRetry(
    async () => {
      const resp = await get<LiteReviewsResponse>(client, "/data/reviews", {
        hotelId,
        timeout: 4,
      }, {
        timeout: REQUEST_TIMEOUT_MS,
      });
      return resp.data || [];
    },
    `Fetch reviews for hotel ${hotelId}`,
    { maxAttempts: MAX_RETRY_ATTEMPTS, initialDelayMs: 300 },
  );

  return reviews;
}

async function insertHotelReviews(
  hotelId: string,
  reviews: LiteReview[],
): Promise<number> {
  if (!reviews.length) return 0;

  // Get valid language codes
  const validLanguages = await query<{ code: string }>(
    "SELECT code FROM shared.languages",
  );
  const validLangSet = new Set(validLanguages.map((l) => l.code));

  let insertedCount = 0;
  for (const review of reviews) {
    try {
      const inserted = await insertSingleReview(hotelId, review, validLangSet);
      if (inserted) {
        insertedCount++;
      }
    } catch (err) {
      log.warn(
        `Failed to insert review for hotel ${hotelId}: ${(err as Error).message}`,
      );
    }
  }
  return insertedCount;
}

async function syncSingleHotelReviews(
  client: AxiosInstance,
  hotelId: string,
): Promise<{ success: boolean; count: number; error?: string; skipped?: boolean }> {
  try {
    await updateProgress(hotelId, "in_progress");
    const reviews = await fetchHotelReviews(client, hotelId);
    const insertedCount = await insertHotelReviews(hotelId, reviews);
    await updateProgress(hotelId, "completed", insertedCount);
    return { success: true, count: insertedCount };
  } catch (err) {
    const errorMsg = (err as Error).message;
    
    // Skip hotels that timeout - mark as failed and move on
    if (errorMsg.includes("timeout") || errorMsg.includes("ECONNRESET")) {
      log.warn(`Skipping ${hotelId} due to timeout/connection issue`);
      await updateProgress(hotelId, "failed", 0, "timeout_skipped");
      return { success: false, count: 0, error: errorMsg, skipped: true };
    }
    
    log.error(`Failed to sync reviews for ${hotelId}: ${errorMsg}`);
    await updateProgress(hotelId, "failed", 0, errorMsg);
    return { success: false, count: 0, error: errorMsg };
  }
}

async function main(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) throw new Error("LITEAPI_KEY is not set");

  const httpClient = createLiteApiClient(apiKey);
  log.info("Starting hotel reviews import...");

  await initProgressTable();

  const limit = pLimit(CONCURRENCY);
  let totalReviews = 0;
  let successCount = 0;
  let failedCount = 0;
  let skippedCount = 0;
  let processedCount = 0;
  let batchNumber = 0;

  while (true) {
    const pendingHotels = await getPendingHotelIds(HOTEL_BATCH_SIZE);
    if (pendingHotels.length === 0) {
      break;
    }

    batchNumber++;
    log.info(`Processing batch ${batchNumber}: ${pendingHotels.length} pending hotels...`);

    await Promise.all(
      pendingHotels.map((hotelId) =>
        limit(async () => {
          const result = await syncSingleHotelReviews(httpClient, hotelId);
          processedCount++;

          if (result.success) {
            successCount++;
            totalReviews += result.count;
            if (result.count > 0) {
              log.debug(`✓ ${hotelId}: ${result.count} reviews`);
            }
          } else {
            if (result.skipped) {
              skippedCount++;
            } else {
              failedCount++;
            }
          }

          if (processedCount % 500 === 0) {
            log.info(
              `Progress: ${processedCount} hotels (${successCount} success, ${skippedCount} skipped, ${failedCount} failed), ${totalReviews} reviews imported`,
            );
          }
        }),
      ),
    );
    
    log.info(`Batch ${batchNumber} complete: ${processedCount} total hotels processed`);
  }

  log.success(`
Hotel reviews import complete!
  ✓ Hotels successful: ${successCount}
  ⏭  Hotels skipped (timeout): ${skippedCount}
  ✗ Hotels failed: ${failedCount}
  📊 Total processed: ${processedCount}
  📊 Total reviews: ${totalReviews}`);

  try {
    const stats = await query<{
      total_hotels: string;
      total_reviews: string;
    }>(
      `SELECT 
        COUNT(DISTINCT hotel_id)::text as total_hotels,
        COUNT(*)::text as total_reviews
      FROM hotel.reviews`,
    );
    if (stats.length > 0) {
      log.info(
        `Database: ${stats[0].total_hotels} hotels, ${stats[0].total_reviews} total reviews`,
      );
    }
  } catch (err) {
    log.warn(`Could not fetch stats: ${(err as Error).message}`);
  }
}

if (require.main === module) {
  main()
    .then(() => closePool())
    .catch((err) => {
      log.error(String(err));
      process.exit(1);
    });
}
