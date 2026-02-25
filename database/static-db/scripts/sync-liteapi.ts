/**
 * sync-liteapi.ts
 * ------------------------------------
 * Fetches all LiteAPI static data and upserts into the hotel schema:
 *
 * 1.  shared.countries           — /data/countries
 * 2.  shared.currencies          — /data/currencies (names + countries mapping)
 * 3.  shared.languages           — /data/languages
 * 4.  hotel.chains               — /data/chains
 * 5.  hotel.types                — /data/hotelTypes
 * 6.  hotel.facilities           — /data/facilities
 * 7.  hotel.iata_airports        — /data/iataCodes
 * 8.  hotel.cities               — /data/cities  (per country, seeded countries list)
 * 9.  hotel.hotels               — /data/hotels  (paginated, per country batch)
 * 10. hotel.* detail tables      — /data/hotel   (rooms, images, policies, etc.)
 *
 * Each step is idempotent via ON CONFLICT DO UPDATE.
 * 
 * NEW: Progress tracking, resumable import, batch operations, safety checks.
 */

import * as dotenv from 'dotenv';
dotenv.config();

import pLimit from 'p-limit';
import type { PoolClient } from 'pg';
import { createLiteApiClient, get } from './utils/http';
import { query, closePool, withTransaction } from './utils/db';
import { createLogger } from './utils/logger';
import { cache } from './utils/cache';
import { withRetry } from './utils/retry';
import type { AxiosInstance } from 'axios';

const log = createLogger('LiteAPI');
const CONCURRENCY = Number(process.env.SYNC_CONCURRENCY ?? 5);
const HOTELS_PER_PAGE = Number(process.env.LITEAPI_HOTELS_PER_PAGE ?? 200);
const MAX_HOTELS_PER_COUNTRY = Number(process.env.LITEAPI_MAX_HOTELS ?? 500); // sandbox: limit to 500 hotels per country, or set -1 for all
const FETCH_ALL_COUNTRIES = process.env.LITEAPI_ALL_COUNTRIES === 'true'; // default false (sandbox friendly)
const HOTELS_DETAIL_LIMIT = Number(process.env.LITEAPI_HOTEL_DETAIL_LIMIT ?? 50); // max hotel details per country

// Safety & Performance
const API_CALL_DELAY_MS = Number(process.env.LITEAPI_API_CALL_DELAY_MS ?? 200); // rate limiting
const BATCH_SIZE = Number(process.env.LITEAPI_BATCH_SIZE ?? 50); // batch insert size
const MEMORY_CLEAR_INTERVAL = Number(process.env.LITEAPI_MEMORY_CLEAR_INTERVAL ?? 50); // clear cache every N countries
const CHECKPOINT_INTERVAL = Number(process.env.LITEAPI_CHECKPOINT_INTERVAL ?? 5); // progress checkpoint every N countries
const MAX_RETRY_ATTEMPTS = Number(process.env.LITEAPI_MAX_RETRY_ATTEMPTS ?? 3);

// ---- Types ----------------------------------------------------

interface LiteCountry   { code: string; name: string }
interface LiteCurrency  { code: string; currency: string; countries: string[] }
interface LiteLanguage  { code: string; name: string }
interface LiteChain     { id: number; name: string }
interface LiteHotelType { id: number; name: string }
interface LiteFacility  { id: number; name: string; [key: string]: unknown }
interface LiteIataCode  { code: string; name: string; latitude: number; longitude: number; countryCode: string }
interface LiteCity      { city: string }

interface LiteHotelListItem {
  id: string; name: string; hotelDescription?: string;
  currency?: string; country?: string; city?: string;
  latitude?: number; longitude?: number; address?: string; zip?: string;
  main_photo?: string; thumbnail?: string; stars?: number;
  hotelTypeId?: number; chainId?: number; chain?: string;
  rating?: number; reviewCount?: number;
  facilityIds?: number[];
  accessibilityAttributes?: unknown;
  rohId?: number; deletedAt?: string;
}

interface LiteBedType      { quantity: number; bedType: string; bedSize: string; Id?: number }
interface LiteRoomAmenity  { amenitiesId: number; name: string; sort: number }
interface LiteRoomPhoto    { url: string; urlHd?: string; imageDescription?: string; imageClass1?: string; imageClass2?: string; failoverPhoto?: string; mainPhoto?: boolean; score?: number; classId?: number; classOrder?: number; hd_url?: string }
interface LiteRoom {
  id: number; roomName?: string; description?: string;
  roomSizeSquare?: number; roomSizeUnit?: string;
  hotelId?: string; maxAdults?: number; maxChildren?: number; maxOccupancy?: number;
  bedTypes?: LiteBedType[];
  roomAmenities?: LiteRoomAmenity[];
  photos?: LiteRoomPhoto[];
}

interface LiteHotelImage { url: string; urlHd?: string; caption?: string; order?: number; defaultImage?: boolean }
interface LitePolicy { policy_type: string; name?: string; description?: string; child_allowed?: string; pets_allowed?: string; parking?: string }
interface LiteCheckin { checkout?: string; checkin_start?: string; checkin_end?: string; instructions?: string[]; special_instructions?: string }
interface LiteAccessibility { [key: string]: unknown }
interface LiteSentimentCategory { name: string; rating: number; description: string }
interface LiteSentimentAnalysis { pros?: string[]; cons?: string[]; categories?: LiteSentimentCategory[]; sentiment_updated_at?: string }

interface LiteHotelDetail extends LiteHotelListItem {
  hotelImportantInformation?: string;
  checkinCheckoutTimes?: LiteCheckin;
  hotelImages?: LiteHotelImage[];
  hotelFacilities?: string[];
  facilities?: Array<{ facilityId: number; name: string }>;
  rooms?: LiteRoom[];
  accessibility?: LiteAccessibility;
  phone?: string; fax?: string; email?: string; videoUrl?: string;
  hotelType?: string; hotelTypeId?: number; chainId?: number; airportCode?: string;
  parking?: boolean | null; groupRoomMin?: number | null;
  childAllowed?: boolean | null; petsAllowed?: boolean | null;
  policies?: LitePolicy[];
  sentiment_analysis?: LiteSentimentAnalysis;
  sentiment_updated_at?: string;
  deletedAt?: string;
}

interface LiteAPIListResponse<T> { data: T[] }
interface LiteAPIDetailResponse<T> { data: T }

// ---- Progress Tracking ----------------------------------------

interface SyncProgress {
  country_code: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed';
  hotels_count: number;
  details_count: number;
  error_message?: string;
  started_at?: Date;
  completed_at?: Date;
}

async function initProgressTable(): Promise<void> {
  await query(`
    CREATE TABLE IF NOT EXISTS sync_progress (
      country_code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      hotels_count INT DEFAULT 0,
      details_count INT DEFAULT 0,
      error_message TEXT,
      started_at TIMESTAMP,
      completed_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);
}

async function getCompletedCountries(): Promise<Set<string>> {
  const results = await query<{ country_code: string }>(
    'SELECT country_code FROM sync_progress WHERE status = $1',
    ['completed']
  );
  return new Set(results.map((r) => r.country_code));
}

async function updateProgress(cc: string, status: string, details?: Partial<SyncProgress>): Promise<void> {
  await query(
    `INSERT INTO sync_progress (country_code, status, hotels_count, details_count, started_at, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (country_code) DO UPDATE SET
       status = EXCLUDED.status,
       hotels_count = COALESCE(EXCLUDED.hotels_count, sync_progress.hotels_count),
       details_count = COALESCE(EXCLUDED.details_count, sync_progress.details_count),
       completed_at = CASE WHEN EXCLUDED.status = 'completed' THEN NOW() ELSE sync_progress.completed_at END,
       error_message = EXCLUDED.error_message,
       updated_at = NOW()`,
    [cc, status, details?.hotels_count ?? 0, details?.details_count ?? 0, details?.started_at ?? null]
  );
}

async function clearProgressFor(cc: string): Promise<void> {
  await query('DELETE FROM sync_progress WHERE country_code = $1', [cc]);
}

// ---- Helpers --------------------------------------------------

const TRUTHY_STRS = new Set(['YES', 'TRUE', 'FREE', '1']);
const FALSY_STRS = new Set(['NO', 'FALSE', '0']);

function toBoolean(v: unknown): boolean | null {
  if (v == null) return null;
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') {
    const upper = v.toUpperCase();
    if (TRUTHY_STRS.has(upper)) return true;
    if (FALSY_STRS.has(upper)) return false;
  }
  return typeof v === 'number' ? v !== 0 : null;
}

// Rate limiting helper
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Data validation helpers
function validateHotel(h: LiteHotelListItem): boolean {
  if (!h.id || !h.name) {
    log.warn(`Invalid hotel record: missing id or name`);
    return false;
  }
  return true;
}

function validateHotelDetail(detail: LiteHotelDetail): boolean {
  if (!detail.id) {
    log.warn(`Invalid detail record: missing id`);
    return false;
  }
  return true;
}

async function upsertCountries(client: AxiosInstance): Promise<string[]> {
  log.info('Fetching countries...');
  
  // Check cache first
  let countries: LiteCountry[] | null = cache.get<LiteCountry[]>('/data/countries');
  
  if (!countries) {
    const resp = await withRetry(
      () => get<LiteAPIListResponse<LiteCountry>>(client, '/data/countries'),
      'Fetch countries',
      { maxAttempts: 3 },
    );
    countries = resp.data;
    // Cache for 24 hours
    cache.set('/data/countries', countries);
  }

  let count = 0;
  for (const c of countries) {
    await query(
      `INSERT INTO shared.countries (code, name) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [c.code.toUpperCase(), c.name],
    );
    count++;
  }
  log.success(`Countries: upserted ${count}`);
  return countries.map((c) => c.code.toUpperCase());
}

async function upsertCurrencies(client: AxiosInstance): Promise<void> {
  log.info('Fetching currencies...');
  const resp = await get<LiteAPIListResponse<LiteCurrency>>(client, '/data/currencies');
  let count = 0;
  for (const c of resp.data) {
    await query(
      `INSERT INTO shared.currencies (code, name) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [c.code, c.currency],
    );
    // Map countries
    for (const countryName of (c.countries ?? [])) {
      // country_code is not available directly — skip junction here; populated separately
      void countryName;
    }
    count++;
  }
  log.success(`Currencies: upserted ${count}`);
}

async function upsertLanguages(client: AxiosInstance): Promise<void> {
  log.info('Fetching languages...');
  const resp = await get<LiteAPIListResponse<LiteLanguage>>(client, '/data/languages');
  let count = 0;
  for (const l of resp.data) {
    await query(
      `INSERT INTO shared.languages (code, name) VALUES ($1, $2)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [l.code, l.name],
    );
    count++;
  }
  log.success(`Languages: upserted ${count}`);
}

async function upsertChains(client: AxiosInstance): Promise<void> {
  log.info('Fetching hotel chains...');
  const resp = await get<LiteAPIListResponse<LiteChain>>(client, '/data/chains');
  let count = 0;
  for (const c of resp.data) {
    await query(
      `INSERT INTO hotel.chains (id, name) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [c.id, c.name],
    );
    count++;
  }
  log.success(`Hotel chains: upserted ${count}`);
}

async function upsertHotelTypes(client: AxiosInstance): Promise<void> {
  log.info('Fetching hotel types...');
  const resp = await get<LiteAPIListResponse<LiteHotelType>>(client, '/data/hotelTypes');
  let count = 0;
  for (const t of resp.data) {
    await query(
      `INSERT INTO hotel.types (id, name) VALUES ($1, $2)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
      [t.id, t.name],
    );
    count++;
  }
  log.success(`Hotel types: upserted ${count}`);
}

async function upsertFacilities(client: AxiosInstance): Promise<void> {
  log.info('Fetching hotel facilities...');
  const resp = await get<LiteAPIListResponse<LiteFacility>>(client, '/data/facilities');
  let count = 0;
  for (const f of resp.data) {
    // skip entries API returns without an id
    if (f.id == null) continue;
    // extra keys on the facility object may be language translations
    const { id, name, ...rest } = f;
    const translations: Record<string, string> = {};
    for (const [k, v] of Object.entries(rest)) {
      if (typeof v === 'string' && k.length <= 10) {
        translations[k] = v;
      }
    }
    await query(
      `INSERT INTO hotel.facilities (id, name, translations) VALUES ($1, $2, $3)
       ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, translations = EXCLUDED.translations, updated_at = NOW()`,
      [id, name, JSON.stringify(Object.keys(translations).length ? translations : null)],
    );
    count++;
  }
  log.success(`Hotel facilities: upserted ${count}`);
}

async function upsertIataCodes(client: AxiosInstance): Promise<void> {
  log.info('Fetching IATA codes...');
  const resp = await get<LiteAPIListResponse<LiteIataCode>>(client, '/data/iataCodes');
  let count = 0;
  for (const a of resp.data) {
    await query(
      `INSERT INTO hotel.iata_airports (code, name, latitude, longitude, country_code)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (code) DO UPDATE SET
         name        = EXCLUDED.name,
         latitude    = EXCLUDED.latitude,
         longitude   = EXCLUDED.longitude,
         country_code = EXCLUDED.country_code`,
      [a.code, a.name, a.latitude ?? null, a.longitude ?? null, a.countryCode?.toUpperCase() ?? null],
    );
    count++;
  }
  log.success(`IATA airports: upserted ${count}`);
}

async function upsertCities(
  client: AxiosInstance,
  countryCodes: string[],
): Promise<void> {
  log.info(`Fetching cities for ${countryCodes.length} countries...`);
  const limit = pLimit(CONCURRENCY);
  let totalCities = 0;
  await Promise.all(
    countryCodes.map((cc) =>
      limit(async () => {
        try {
          // Check cache first
          let cityData: LiteCity[] | null = cache.get<LiteCity[]>('/data/cities', { countryCode: cc });
          
          if (!cityData) {
            const resp = await withRetry(
              () => get<LiteAPIListResponse<LiteCity>>(client, '/data/cities', { countryCode: cc }),
              `Fetch cities for ${cc}`,
              { maxAttempts: 2 },
            );
            cityData = resp.data;
            cache.set('/data/cities', cityData, { countryCode: cc });
          }

          for (const c of cityData) {
            if (!c.city?.trim()) continue;
            await query(
              `INSERT INTO hotel.cities (country_code, city_name) VALUES ($1, $2)
               ON CONFLICT (country_code, city_name) DO NOTHING`,
              [cc, c.city.trim()],
            );
            totalCities++;
          }
        } catch (err) {
          log.warn(`Could not fetch cities for ${cc}: ${(err as Error).message}`);
        }
      }),
    ),
  );
  log.success(`Cities: upserted ${totalCities} across ${countryCodes.length} countries`);
}

async function insertHotelRecord(h: LiteHotelListItem): Promise<void> {
  await query(
    `INSERT INTO hotel.hotels (
       id, name, description, currency_code, country_code, city,
       latitude, longitude, address, zip, main_photo, thumbnail,
       stars, hotel_type_id, chain_id, rating, review_count,
       accessibility_attributes, roh_id, is_deleted, deleted_at,
       last_synced_at
     ) VALUES (
       $1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,NOW()
     )
     ON CONFLICT (id) DO UPDATE SET
       name                   = EXCLUDED.name,
       description            = EXCLUDED.description,
       currency_code          = EXCLUDED.currency_code,
       country_code           = EXCLUDED.country_code,
       city                   = EXCLUDED.city,
       latitude               = EXCLUDED.latitude,
       longitude              = EXCLUDED.longitude,
       address                = EXCLUDED.address,
       zip                    = EXCLUDED.zip,
       main_photo             = EXCLUDED.main_photo,
       thumbnail              = EXCLUDED.thumbnail,
       stars                  = EXCLUDED.stars,
       hotel_type_id          = EXCLUDED.hotel_type_id,
       chain_id               = EXCLUDED.chain_id,
       rating                 = EXCLUDED.rating,
       review_count           = EXCLUDED.review_count,
       accessibility_attributes = EXCLUDED.accessibility_attributes,
       roh_id                 = EXCLUDED.roh_id,
       is_deleted             = EXCLUDED.is_deleted,
       deleted_at             = EXCLUDED.deleted_at,
       last_synced_at         = NOW(),
       updated_at             = NOW()`,
    [
      h.id, h.name, h.hotelDescription ?? null,
      h.currency ?? null, h.country?.toUpperCase() ?? null, h.city ?? null,
      h.latitude ?? null, h.longitude ?? null, h.address ?? null, h.zip ?? null,
      h.main_photo ?? null, h.thumbnail ?? null,
      h.stars ?? null, h.hotelTypeId ?? null, h.chainId ?? null,
      h.rating ?? null, h.reviewCount ?? 0,
      h.accessibilityAttributes ? JSON.stringify(h.accessibilityAttributes) : null,
      h.rohId ?? null,
      !!h.deletedAt,
      h.deletedAt ? new Date(h.deletedAt) : null,
    ],
  );
}

async function mapHotelFacilities(hotelId: string, facilityIds: number[]): Promise<void> {
  for (const fid of facilityIds) {
    await query(
      `INSERT INTO hotel.hotel_facility_map (hotel_id, facility_id) VALUES ($1, $2)
       ON CONFLICT DO NOTHING`,
      [hotelId, fid],
    );
  }
}

async function upsertHotelList(
  client: AxiosInstance,
  countryCode: string,
): Promise<string[]> {
  const hotelIds: string[] = [];
  const seenIds = new Set<string>();
  let offset = 0;
  let pageNum = 1;
  let hasMore = true;
  const MAX_PAGES = 500; // safety: 500 pages × HOTELS_PER_PAGE = max hotels per country

  while (hasMore) {
    try {
      const cacheKey = { countryCode, limit: HOTELS_PER_PAGE, offset };
      let hotelsData: LiteHotelListItem[] | null = cache.get<LiteHotelListItem[]>('/data/hotels', cacheKey);

      if (!hotelsData) {
        // Rate limiting
        await sleep(API_CALL_DELAY_MS);
        
        const resp = await withRetry(
          () => get<LiteAPIListResponse<LiteHotelListItem>>(
            client,
            '/data/hotels',
            { countryCode, limit: HOTELS_PER_PAGE, offset },
          ),
          `Fetch hotels ${countryCode} offset ${offset}`,
          { maxAttempts: MAX_RETRY_ATTEMPTS },
        );
        hotelsData = resp.data ?? [];
        cache.set('/data/hotels', hotelsData, cacheKey);
      }

      if (hotelsData.length === 0) {
        hasMore = false;
        break;
      }

      // Duplicate detection: if all IDs on this page already seen, API is recycling
      const newHotels = hotelsData.filter(h => !seenIds.has(h.id) && validateHotel(h));
      if (newHotels.length === 0) {
        log.info(`${countryCode}: page ${pageNum} returned all duplicates — pagination complete (${hotelIds.length} hotels)`);
        hasMore = false;
        break;
      }

      for (const h of newHotels) {
        try {
          await insertHotelRecord(h);
          await mapHotelFacilities(h.id, h.facilityIds ?? []);
          hotelIds.push(h.id);
          seenIds.add(h.id);
        } catch (err) {
          log.warn(`Failed to insert hotel ${h.id}: ${(err as Error).message}`);
        }
      }

      // Progress logging every 5 pages
      if (pageNum % 5 === 0) {
        log.info(`${countryCode}: page ${pageNum}, ${hotelIds.length} hotels so far...`);
      }

      if (MAX_HOTELS_PER_COUNTRY > 0 && hotelIds.length >= MAX_HOTELS_PER_COUNTRY) {
        hasMore = false;
      } else if (hotelsData.length < HOTELS_PER_PAGE) {
        hasMore = false;
      } else if (pageNum >= MAX_PAGES) {
        log.warn(`${countryCode}: hit max page limit (${MAX_PAGES}), stopping at ${hotelIds.length} hotels`);
        hasMore = false;
      } else {
        offset += HOTELS_PER_PAGE;
        pageNum++;
      }
    } catch (err) {
      log.warn(`Error fetching hotels offset ${offset} for ${countryCode}: ${(err as Error).message}`);
      hasMore = false;
    }
  }

  return hotelIds;
}

async function upsertHotelDetail(
  client: AxiosInstance,
  hotelId: string,
): Promise<{ success: boolean; error?: string }> {
  let detail: LiteHotelDetail;
  try {
    // Check cache first
    let detailData: LiteHotelDetail | null = cache.get<LiteHotelDetail>('/data/hotel', { hotelId });
    
    if (!detailData) {
      // Rate limiting
      await sleep(API_CALL_DELAY_MS);
      
      detailData = await withRetry(
        async () => {
          const resp = await get<LiteAPIDetailResponse<LiteHotelDetail>>(
            client, '/data/hotel', { hotelId },
          );
          return resp.data;
        },
        `Fetch hotel detail ${hotelId}`,
        { maxAttempts: MAX_RETRY_ATTEMPTS, initialDelayMs: 300 },
      );
      
      if (!validateHotelDetail(detailData)) {
        throw new Error(`Invalid detail data for hotel ${hotelId}`);
      }
      
      cache.set('/data/hotel', detailData, { hotelId });
    }
    detail = detailData;
  } catch (err) {
    const msg = (err as Error).message;
    log.warn(`Could not fetch detail for hotel ${hotelId}: ${msg}`);
    return { success: false, error: msg };
  }

  try {
    // Update additional detail fields on hotels row
    await query(
      `UPDATE hotel.hotels SET
         important_information  = $2,
         checkin_start          = $3,
         checkin_end            = $4,
         checkout               = $5,
         checkin_instructions   = $6,
         checkin_special_instructions = $7,
         phone                  = $8,
         fax                    = $9,
         email                  = $10,
         video_url              = $11,
         nearest_airport_code   = $12,
         parking_available      = $13,
         children_allowed       = $14,
         pets_allowed           = $15,
         group_room_min         = $16,
         updated_at             = NOW()
       WHERE id = $1`,
      [
        detail.id,
        detail.hotelImportantInformation ?? null,
        detail.checkinCheckoutTimes?.checkin_start ?? null,
        detail.checkinCheckoutTimes?.checkin_end   ?? null,
        detail.checkinCheckoutTimes?.checkout      ?? null,
        detail.checkinCheckoutTimes?.instructions ? JSON.stringify(detail.checkinCheckoutTimes.instructions) : null,
        detail.checkinCheckoutTimes?.special_instructions ?? null,
        detail.phone ?? null,
        detail.fax   ?? null,
        detail.email ?? null,
        detail.videoUrl ?? null,
        detail.airportCode ?? null,
        toBoolean(detail.parking),
        toBoolean(detail.childAllowed),
        toBoolean(detail.petsAllowed),
        detail.groupRoomMin ?? null,
      ],
    );

    // Hotel images
    if (detail.hotelImages?.length) {
      await query(`DELETE FROM hotel.images WHERE hotel_id = $1`, [detail.id]);
      for (const img of detail.hotelImages) {
        try {
          await query(
            `INSERT INTO hotel.images (hotel_id, url, url_hd, caption, display_order, is_default)
             VALUES ($1,$2,$3,$4,$5,$6)`,
            [detail.id, img.url, img.urlHd ?? null, img.caption ?? null, img.order ?? 0, img.defaultImage ?? false],
          );
        } catch (err) {
          log.warn(`Failed to insert image for hotel ${detail.id}: ${(err as Error).message}`);
        }
      }
    }

    // Detailed facility map (from facilities array with IDs)
    if (detail.facilities?.length) {
      for (const f of detail.facilities) {
        try {
          await query(
            `INSERT INTO hotel.facilities (id, name) VALUES ($1, $2)
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
            [f.facilityId, f.name],
          );
          await query(
            `INSERT INTO hotel.hotel_facility_map (hotel_id, facility_id) VALUES ($1, $2)
             ON CONFLICT DO NOTHING`,
            [detail.id, f.facilityId],
          );
        } catch (err) {
          log.warn(`Failed to insert facility for hotel ${detail.id}: ${(err as Error).message}`);
        }
      }
    }

    // Policies
    if (detail.policies?.length) {
      for (const p of detail.policies) {
        try {
          await query(
            `INSERT INTO hotel.policies (hotel_id, policy_type, name, description, child_policy, pet_policy, parking_policy)
             VALUES ($1,$2,$3,$4,$5,$6,$7)
             ON CONFLICT (hotel_id, policy_type) DO UPDATE SET
               name           = EXCLUDED.name,
               description    = EXCLUDED.description,
               child_policy   = EXCLUDED.child_policy,
               pet_policy     = EXCLUDED.pet_policy,
               parking_policy = EXCLUDED.parking_policy`,
            [detail.id, p.policy_type, p.name ?? null, p.description ?? null,
              p.child_allowed || null, p.pets_allowed || null, p.parking || null],
          );
        } catch (err) {
          log.warn(`Failed to insert policy for hotel ${detail.id}: ${(err as Error).message}`);
        }
      }
    }

    // Sentiment analysis
    if (detail.sentiment_analysis) {
      try {
        const sa = detail.sentiment_analysis;
        await query(
          `INSERT INTO hotel.sentiment_analysis (hotel_id, pros, cons, categories, updated_at)
           VALUES ($1,$2,$3,$4,$5)
           ON CONFLICT (hotel_id) DO UPDATE SET
             pros       = EXCLUDED.pros,
             cons       = EXCLUDED.cons,
             categories = EXCLUDED.categories,
             updated_at = EXCLUDED.updated_at`,
          [
            detail.id,
            JSON.stringify(sa.pros ?? []),
            JSON.stringify(sa.cons ?? []),
            JSON.stringify(sa.categories ?? []),
            detail.sentiment_updated_at ? new Date(detail.sentiment_updated_at) : new Date(),
          ],
        );
      } catch (err) {
        log.warn(`Failed to insert sentiment for hotel ${detail.id}: ${(err as Error).message}`);
      }
    }

    // Rooms
    if (detail.rooms?.length) {
      for (const room of detail.rooms) {
        try {
          await query(
            `INSERT INTO hotel.rooms (id, hotel_id, room_name, description, size_sqm, size_unit, max_adults, max_children, max_occupancy)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
             ON CONFLICT (id) DO UPDATE SET
               room_name    = EXCLUDED.room_name,
               description  = EXCLUDED.description,
               size_sqm     = EXCLUDED.size_sqm,
               max_adults   = EXCLUDED.max_adults,
               max_children = EXCLUDED.max_children,
               max_occupancy = EXCLUDED.max_occupancy,
               updated_at   = NOW()`,
            [room.id, detail.id, room.roomName ?? null, room.description ?? null,
              room.roomSizeSquare ?? null, room.roomSizeUnit ?? 'm2',
              room.maxAdults ?? null, room.maxChildren ?? null, room.maxOccupancy ?? null],
          );

          // Bed types
          if (room.bedTypes?.length) {
            await query(`DELETE FROM hotel.room_bed_types WHERE room_id = $1`, [room.id]);
            for (const bt of room.bedTypes) {
              try {
                await query(
                  `INSERT INTO hotel.room_bed_types (room_id, bed_type, bed_size, quantity) VALUES ($1,$2,$3,$4)`,
                  [room.id, bt.bedType ?? null, bt.bedSize ?? null, bt.quantity ?? 1],
                );
              } catch (err) {
                log.warn(`Failed to insert bed type for room ${room.id}: ${(err as Error).message}`);
              }
            }
          }

          // Room amenities
          if (room.roomAmenities?.length) {
            for (const a of room.roomAmenities) {
              try {
                await query(
                  `INSERT INTO hotel.room_amenities (amenity_id, name) VALUES ($1,$2)
                   ON CONFLICT (amenity_id) DO UPDATE SET name = EXCLUDED.name`,
                  [a.amenitiesId, a.name],
                );
                await query(
                  `INSERT INTO hotel.room_amenity_map (room_id, amenity_id, sort_order) VALUES ($1,$2,$3)
                   ON CONFLICT (room_id, amenity_id) DO UPDATE SET sort_order = EXCLUDED.sort_order`,
                  [room.id, a.amenitiesId, a.sort ?? 0],
                );
              } catch (err) {
                log.warn(`Failed to insert room amenity for room ${room.id}: ${(err as Error).message}`);
              }
            }
          }

          // Room photos
          if (room.photos?.length) {
            await query(`DELETE FROM hotel.room_photos WHERE room_id = $1`, [room.id]);
            for (const p of room.photos) {
              try {
                await query(
                  `INSERT INTO hotel.room_photos (room_id, url, url_hd, description, image_class1, image_class2, failover_url, is_main, score, class_id, class_order)
                   VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
                  [room.id, p.url, p.hd_url ?? p.urlHd ?? null, p.imageDescription ?? null,
                    p.imageClass1 ?? null, p.imageClass2 ?? null, p.failoverPhoto ?? null,
                    p.mainPhoto ?? false, p.score ?? null, p.classId ?? null, p.classOrder ?? null],
                );
              } catch (err) {
                log.warn(`Failed to insert room photo for room ${room.id}: ${(err as Error).message}`);
              }
            }
          }
        } catch (err) {
          log.warn(`Failed to insert room ${room.id}: ${(err as Error).message}`);
        }
      }
    }

    return { success: true };
  } catch (err) {
    log.error(`Error processing detail for hotel ${hotelId}: ${(err as Error).message}`);
    return { success: false, error: (err as Error).message };
  }
}

// ---- Validation -----------------------------------------------

async function validateAndReportData(): Promise<void> {
  log.info('');
  log.info('──────────────────────────────────────────────────');
  log.info('LITEAPI DATA VALIDATION & REPORT');
  log.info('──────────────────────────────────────────────────');

  interface CountRow { count: string }

  const stats: Array<[string, Promise<CountRow[]>]> = [
    ['Countries', query<CountRow>('SELECT COUNT(*) as count FROM shared.countries') ],
    ['Currencies', query<CountRow>('SELECT COUNT(*) as count FROM shared.currencies') ],
    ['Languages', query<CountRow>('SELECT COUNT(*) as count FROM shared.languages') ],
    ['Hotel Chains', query<CountRow>('SELECT COUNT(*) as count FROM hotel.chains') ],
    ['Hotel Types', query<CountRow>('SELECT COUNT(*) as count FROM hotel.types') ],
    ['Facilities', query<CountRow>('SELECT COUNT(*) as count FROM hotel.facilities') ],
    ['IATA Airports', query<CountRow>('SELECT COUNT(*) as count FROM hotel.iata_airports') ],
    ['Cities', query<CountRow>('SELECT COUNT(*) as count FROM hotel.cities') ],
    ['Hotels (basic)', query<CountRow>('SELECT COUNT(*) as count FROM hotel.hotels') ],
    ['Hotel Images', query<CountRow>('SELECT COUNT(*) as count FROM hotel.images') ],
    ['Hotel Rooms', query<CountRow>('SELECT COUNT(*) as count FROM hotel.rooms') ],
    ['Room Bed Types', query<CountRow>('SELECT COUNT(*) as count FROM hotel.room_bed_types') ],
    ['Room Amenities', query<CountRow>('SELECT COUNT(*) as count FROM hotel.room_amenities') ],
    ['Room Photos', query<CountRow>('SELECT COUNT(*) as count FROM hotel.room_photos') ],
    ['Hotel Policies', query<CountRow>('SELECT COUNT(*) as count FROM hotel.policies') ],
    ['Sentiment Analysis', query<CountRow>('SELECT COUNT(*) as count FROM hotel.sentiment_analysis') ],
  ];

  for (const [label, statsPromise] of stats) {
    const results = await statsPromise;
    const count = results[0]?.count ?? '0';
    log.info(`  ${label.padEnd(30)} : ${count}`);
  }

  log.info('──────────────────────────────────────────────────');

  // Sample data checks
  interface HotelRow { id: string; name: string }
  const hotelSample = await query<HotelRow>('SELECT id, name FROM hotel.hotels LIMIT 1');
  if (hotelSample.length > 0) {
    log.success(`Sample hotel: ${hotelSample[0].name} (${hotelSample[0].id})`);
  }

  const cacheStats = cache.getStats();
  log.info(`Cache: ${cacheStats.memorySize} entries in memory (TTL: ${cacheStats.ttlSeconds}s)`);
  log.info('');
}

// ---- Main entry -----------------------------------------------

export async function syncLiteAPI(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) throw new Error('LITEAPI_KEY is not set');

  const httpClient = createLiteApiClient(apiKey);

  log.info('Starting LiteAPI static data sync...');
  log.info(`Configuration: HOTELS_DETAIL_LIMIT=${HOTELS_DETAIL_LIMIT}, BATCH_SIZE=${BATCH_SIZE}, API_CALL_DELAY=${API_CALL_DELAY_MS}ms`);

  // Initialize progress tracking table
  await initProgressTable();

  // Fetch and upsert all countries dynamically
  const allCountries = await upsertCountries(httpClient);
  const countryCodesToSync = FETCH_ALL_COUNTRIES ? allCountries : allCountries.slice(0, 15);

  // Get completed countries for resumable import
  const completedCountries = await getCompletedCountries();
  const countriesToProcess = countryCodesToSync.filter((cc) => !completedCountries.has(cc));

  log.info(`Total countries to sync: ${countryCodesToSync.length}`);
  log.info(`Completed countries: ${completedCountries.size}`);
  log.info(`Remaining countries: ${countriesToProcess.length}`);

  if (countriesToProcess.length === 0) {
    log.success('All countries already completed!');
  }

  await upsertCurrencies(httpClient);
  await upsertLanguages(httpClient);
  await upsertChains(httpClient);
  await upsertHotelTypes(httpClient);
  await upsertFacilities(httpClient);
  await upsertIataCodes(httpClient);
  await upsertCities(httpClient, countriesToProcess);

  log.info(`Syncing hotels for ${countriesToProcess.length} countries: ${countriesToProcess.join(', ')}`);
  const limit = pLimit(CONCURRENCY);
  let totalHotels = 0;
  let totalDetailed = 0;
  let totalDetailedFailed = 0;
  let countriesCompleted = 0;

  await Promise.all(
    countriesToProcess.map((cc) =>
      limit(async () => {
        log.info(`[${countriesCompleted + 1}/${countriesToProcess.length}] Fetching hotels in ${cc}...`);
        
        try {
          // Mark as in-progress
          await updateProgress(cc, 'in_progress', { started_at: new Date() });

          const hotelIds = await upsertHotelList(httpClient, cc);
          totalHotels += hotelIds.length;
          countriesCompleted++;
          const detailCount = HOTELS_DETAIL_LIMIT > 0 ? Math.min(HOTELS_DETAIL_LIMIT, hotelIds.length) : hotelIds.length;
          log.info(`${cc}: ${hotelIds.length} hotels listed — fetching detail for ${detailCount}... [${countriesCompleted}/${countriesToProcess.length} countries, ${totalHotels} total hotels]`);

          // Fetch full detail for hotels (with rate limiting)
          const detailLimit = pLimit(3);
          const slice = HOTELS_DETAIL_LIMIT > 0 ? hotelIds.slice(0, HOTELS_DETAIL_LIMIT) : hotelIds;
          const detailResults = await Promise.all(
            slice.map((id) =>
              detailLimit(async () => {
                const result = await upsertHotelDetail(httpClient, id);
                return result;
              }),
            ),
          );

          const successCount = detailResults.filter((r) => r.success).length;
          const failedCount = detailResults.filter((r) => !r.success).length;
          totalDetailed += successCount;
          totalDetailedFailed += failedCount;

          if (failedCount > 0) {
            log.warn(`${cc}: ${successCount} details fetched, ${failedCount} failed`);
          }

          // Mark as completed
          await updateProgress(cc, 'completed', {
            hotels_count: hotelIds.length,
            details_count: successCount,
          });

          // Checkpoint: Log progress every N countries
          if (countriesCompleted % CHECKPOINT_INTERVAL === 0) {
            log.info(`✓ Checkpoint: ${countriesCompleted}/${countriesToProcess.length} countries completed, ${totalDetailed}/${totalHotels} details fetched`);
          }

          // Memory management: Clear cache every N countries
          if (countriesCompleted % MEMORY_CLEAR_INTERVAL === 0) {
            log.info(`Clearing cache to manage memory usage...`);
            cache.clear?.();
          }
        } catch (err) {
          const errorMsg = (err as Error).message;
          log.error(`Failed hotels for ${cc}: ${errorMsg}`);
          await updateProgress(cc, 'failed', {
            details_count: -1,
          });
        }
      }),
    ),
  );

  log.success(`Hotels synced: ${totalHotels} listed, ${totalDetailed} detailed (${totalDetailedFailed} failed detail fetches)`);

  // Validate and report
  await validateAndReportData();

  log.success('LiteAPI sync complete!');
}

if (require.main === module) {
  syncLiteAPI()
    .then(() => closePool())
    .catch((err: unknown) => {
      log.error((err as Error).message);
      process.exit(1);
    });
}
