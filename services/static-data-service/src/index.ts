/**
 * Static Data Service
 * ==================
 * Lightweight Express server that serves static reference data (airports,
 * airlines, cities, currencies, destinations, hotel amenities, board types,
 * canonical hotels) directly from the local PostgreSQL database.
 *
 * Port  : 3002  (proxied by Vite as /static/* → http://localhost:3002/*)
 * Routes: see below
 */

import express, { Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import path from 'path';

dotenv.config();

const app: Application = express();
const PORT = process.env.STATIC_DATA_SERVICE_PORT || 3002;

// ─── DB Pool ──────────────────────────────────────────────────────────────────
// Priority: STATIC_DATABASE_URL (local static DB) > DATABASE_URL (Neon cloud) > fallback
const DB_URL =
  process.env.STATIC_DATABASE_URL ||
  process.env.DIRECT_DATABASE_URL ||
  process.env.DATABASE_URL ||
  'postgresql://postgres:postgres@localhost:5433/staticdatabase';

const pool = new Pool({ connectionString: DB_URL });

pool.on('error', (err) => {
  console.error('[StaticDataService] Unexpected pool error:', err.message);
});

async function query<T = any>(sql: string, params: any[] = []): Promise<T[]> {
  const client = await pool.connect();
  try {
    const result = await client.query(sql, params);
    return result.rows as T[];
  } finally {
    client.release();
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({ origin: '*' }));
app.use(express.json());

app.use((req, _res, next) => {
  console.log(`[StaticDataService] ${req.method} ${req.path}${req.query && Object.keys(req.query).length ? ' ' + JSON.stringify(req.query) : ''}`);
  next();
});

// ─── Health ───────────────────────────────────────────────────────────────────
app.get('/health', async (_req, res) => {
  try {
    await query('SELECT 1');
    res.json({ status: 'healthy', db: 'connected', service: 'static-data-service', port: PORT });
  } catch (e: any) {
    res.status(503).json({ status: 'unhealthy', db: 'disconnected', error: e.message });
  }
});

// ─── Airports ─────────────────────────────────────────────────────────────────
// GET /airports?q=london&limit=20
app.get('/airports', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    if (q.length < 1) {
      const rows = await query(
        `SELECT iata_code, name, city, country, country_code, latitude, longitude, is_active
         FROM "Airport"
         WHERE is_active = true
         ORDER BY name
         LIMIT $1`,
        [limit]
      );
      return res.json({ data: rows, total: rows.length });
    }

    const search = `%${q.toLowerCase()}%`;
    const rows = await query(
      `SELECT iata_code, name, city, country, country_code, latitude, longitude, is_active
       FROM "Airport"
       WHERE is_active = true
         AND (
           LOWER(iata_code) LIKE $1
           OR LOWER(name)    LIKE $1
           OR LOWER(city)    LIKE $1
           OR LOWER(country) LIKE $1
         )
       ORDER BY
         CASE WHEN LOWER(iata_code) = $2 THEN 0
              WHEN LOWER(iata_code) LIKE $1 THEN 1
              ELSE 2 END,
         name
       LIMIT $3`,
      [search, q.toLowerCase(), limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[airports]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Airlines ─────────────────────────────────────────────────────────────────
// GET /airlines?q=emirates&limit=50
app.get('/airlines', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Number(req.query.limit) || 100, 500);

  try {
    if (q.length < 1) {
      const rows = await query(
        `SELECT iata_code, name, logo_url, logo_symbol_url, is_active, country, country_code
         FROM "Airline"
         WHERE is_active = true
         ORDER BY name
         LIMIT $1`,
        [limit]
      );
      return res.json({ data: rows, total: rows.length });
    }

    const search = `%${q.toLowerCase()}%`;
    const rows = await query(
      `SELECT iata_code, name, logo_url, logo_symbol_url, is_active, country, country_code
       FROM "Airline"
       WHERE is_active = true
         AND (LOWER(iata_code) LIKE $1 OR LOWER(name) LIKE $1)
       ORDER BY
         CASE WHEN LOWER(iata_code) = $2 THEN 0
              WHEN LOWER(iata_code) LIKE $1 THEN 1
              ELSE 2 END,
         name
       LIMIT $3`,
      [search, q.toLowerCase(), limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[airlines]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Cities ───────────────────────────────────────────────────────────────────
// GET /cities?q=dub&limit=20
app.get('/cities', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Number(req.query.limit) || 20, 100);

  try {
    if (q.length < 1) {
      const rows = await query(
        `SELECT iata_code, name, country, country_code, latitude, longitude, timezone, is_active
         FROM "City"
         WHERE is_active = true
         ORDER BY name
         LIMIT $1`,
        [limit]
      );
      return res.json({ data: rows, total: rows.length });
    }

    const search = `%${q.toLowerCase()}%`;
    const rows = await query(
      `SELECT iata_code, name, country, country_code, latitude, longitude, timezone, is_active
       FROM "City"
       WHERE is_active = true
         AND (LOWER(iata_code) LIKE $1 OR LOWER(name) LIKE $1 OR LOWER(country) LIKE $1)
       ORDER BY
         CASE WHEN LOWER(iata_code) = $2 THEN 0
              WHEN LOWER(name) LIKE $1    THEN 1
              ELSE 2 END,
         name
       LIMIT $3`,
      [search, q.toLowerCase(), limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[cities]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Countries ────────────────────────────────────────────────────────────────
// GET /countries?q=UAE
app.get('/countries', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Number(req.query.limit) || 250, 500);

  try {
    if (q.length < 1) {
      const rows = await query(
        `SELECT code, name, currency, "phonePrefix", "isActive"
         FROM "Country"
         WHERE "isActive" = true
         ORDER BY name
         LIMIT $1`,
        [limit]
      );
      return res.json({ data: rows, total: rows.length });
    }

    const search = `%${q.toLowerCase()}%`;
    const rows = await query(
      `SELECT code, name, currency, "phonePrefix", "isActive"
       FROM "Country"
       WHERE "isActive" = true
         AND (LOWER(code) LIKE $1 OR LOWER(name) LIKE $1)
       ORDER BY name
       LIMIT $2`,
      [search, limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[countries]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Currencies ───────────────────────────────────────────────────────────────
// GET /currencies
app.get('/currencies', async (_req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT code, name, symbol, "exchangeRate", "isActive"
       FROM "Currency"
       WHERE "isActive" = true
       ORDER BY code`
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[currencies]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Destinations ─────────────────────────────────────────────────────────────
// GET /destinations?q=dubai&type=city&countryCode=AE&popular=true&limit=20
app.get('/destinations', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || '').trim();
  const countryCode = String(req.query.countryCode || '').trim().toUpperCase();
  const popularOnly = req.query.popular === 'true';
  const limit = Math.min(Number(req.query.limit) || 20, 200);

  try {
    const conditions: string[] = ['"isActive" = true'];
    const params: any[] = [];
    let p = 1;

    if (q) {
      conditions.push(
        `(LOWER(name) LIKE $${p} OR LOWER("countryName") LIKE $${p} OR LOWER(code) LIKE $${p})`
      );
      params.push(`%${q.toLowerCase()}%`);
      p++;
    }
    if (type) {
      conditions.push(`"destinationType" = $${p}`);
      params.push(type);
      p++;
    }
    if (countryCode) {
      conditions.push(`"countryCode" = $${p}`);
      params.push(countryCode);
      p++;
    }
    if (popularOnly) {
      conditions.push(`"isPopular" = true`);
    }

    params.push(limit);
    const rows = await query(
      `SELECT id, code, name, "destinationType", "countryCode", "countryName",
              "stateName", latitude, longitude, timezone,
              "popularityScore", "hotelCount", "imageUrl", "isPopular", "isActive",
              "iataCountryCode", "iataCityCode", "iataAirportCode"
       FROM "Destination"
       WHERE ${conditions.join(' AND ')}
       ORDER BY "popularityScore" DESC NULLS LAST, name
       LIMIT $${p}`,
      params
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[destinations]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Unified Suggestions (Autocomplete) ──────────────────────────────────────
// GET /suggestions?q=dubai&type=flight&limit=10
// Returns a ranked list of { type, code, title, subtitle, city, country, countryCode, latitude, longitude, icon }
app.get('/suggestions', async (req: Request, res: Response) => {
  const q = String(req.query.q || '').trim();
  const type = String(req.query.type || 'flight').toLowerCase(); // 'flight' | 'hotel'
  const limit = Math.min(Number(req.query.limit) || 10, 50);

  if (q.length < 2) {
    return res.json({ data: [], total: 0 });
  }

  const search = `%${q.toLowerCase()}%`;
  const exact = q.toLowerCase();

  try {
    if (type === 'flight') {
      // For flights: search Airports first, then Cities
      const airports = await query(
        `SELECT
           iata_code  AS code,
           name       AS title,
           city       || ', ' || country AS subtitle,
           city,
           country,
           country_code AS "countryCode",
           latitude,
           longitude,
           'AIRPORT'  AS type,
           'plane'    AS icon
         FROM "Airport"
         WHERE is_active = true
           AND (
             LOWER(iata_code) LIKE $1
             OR LOWER(name)    LIKE $1
             OR LOWER(city)    LIKE $1
           )
         ORDER BY
           CASE WHEN LOWER(iata_code) = $2 THEN 0
                WHEN LOWER(city) = $2       THEN 1
                WHEN LOWER(iata_code) LIKE $1 THEN 2
                ELSE 3 END
         LIMIT $3`,
        [search, exact, limit]
      );

      let results = airports;

      // If we have room, pad with city results
      if (results.length < limit) {
        const cityLimit = limit - results.length;
        const cities = await query(
          `SELECT
             iata_code  AS code,
             name       AS title,
             country    AS subtitle,
             name       AS city,
             country,
             country_code AS "countryCode",
             latitude,
             longitude,
             'CITY'     AS type,
             'map-pin'  AS icon
           FROM "City"
           WHERE is_active = true
             AND (LOWER(name) LIKE $1 OR LOWER(iata_code) LIKE $1)
           ORDER BY
             CASE WHEN LOWER(name) = $2 THEN 0 ELSE 1 END,
             name
           LIMIT $3`,
          [search, exact, cityLimit]
        );
        results = [...results, ...cities];
      }

      return res.json({ data: results, total: results.length });
    } else {
      // For hotels: search Destinations (cities/regions/zones) and Cities
      const destinations = await query(
        `SELECT
           id         AS code,
           name       AS title,
           COALESCE("stateName" || ', ', '') || COALESCE("countryName", '') AS subtitle,
           name       AS city,
           "countryName" AS country,
           "countryCode" AS "countryCode",
           latitude,
           longitude,
           'CITY'     AS type,
           'map-pin'  AS icon
         FROM "Destination"
         WHERE "isActive" = true
           AND "destinationType" IN ('city', 'region', 'zone', 'state', 'area')
           AND (LOWER(name) LIKE $1 OR LOWER("countryName") LIKE $1 OR LOWER("countryCode") LIKE $1)
         ORDER BY
           CASE WHEN LOWER(name) = $2 THEN 0
                WHEN LOWER(name) LIKE $1 THEN 1
                ELSE 2 END,
           "popularityScore" DESC NULLS LAST,
           "hotelCount" DESC NULLS LAST,
           name
         LIMIT $3`,
        [search, exact, limit]
      );

      let results = destinations;

      // Pad with City table results if needed
      if (results.length < limit) {
        const cityLimit = limit - results.length;
        const cities = await query(
          `SELECT
             iata_code  AS code,
             name       AS title,
             country    AS subtitle,
             name       AS city,
             country,
             country_code AS "countryCode",
             latitude,
             longitude,
             'CITY'     AS type,
             'map-pin'  AS icon
           FROM "City"
           WHERE is_active = true
             AND (LOWER(name) LIKE $1 OR LOWER(country) LIKE $1)
           ORDER BY CASE WHEN LOWER(name) = $2 THEN 0 ELSE 1 END, name
           LIMIT $3`,
          [search, exact, cityLimit]
        );
        // Deduplicate by title
        const seen = new Set(results.map((r: any) => r.title?.toLowerCase()));
        const unique = cities.filter((c: any) => !seen.has(c.title?.toLowerCase()));
        results = [...results, ...unique];
      }

      return res.json({ data: results, total: results.length });
    }
  } catch (e: any) {
    console.error('[suggestions]', e.message);
    // On DB error, return empty so the frontend can fall back to static data
    return res.json({ data: [], total: 0, _error: e.message });
  }
});

// ─── Hotel Amenities ──────────────────────────────────────────────────────────
// GET /hotel-amenities?category=Recreation&popular=true
app.get('/hotel-amenities', async (req: Request, res: Response) => {
  const category = String(req.query.category || '').trim();
  const popularOnly = req.query.popular === 'true';
  const limit = Math.min(Number(req.query.limit) || 200, 1000);

  try {
    const conditions: string[] = ['"isActive" = true'];
    const params: any[] = [];
    let p = 1;

    if (category) {
      conditions.push(`LOWER(category) = $${p}`);
      params.push(category.toLowerCase());
      p++;
    }
    if (popularOnly) {
      conditions.push(`"isPopular" = true`);
    }

    params.push(limit);
    const rows = await query(
      `SELECT code, name, category, icon, "isPopular", "sortOrder", "isActive"
       FROM "HotelAmenity"
       WHERE ${conditions.join(' AND ')}
       ORDER BY "sortOrder", name
       LIMIT $${p}`,
      params
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[hotel-amenities]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Board Types ──────────────────────────────────────────────────────────────
// GET /board-types
app.get('/board-types', async (_req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT code, name, description,
              "includesBreakfast", "includesLunch", "includesDinner",
              "includesDrinks", "includesSnacks",
              "sortOrder", "isActive"
       FROM "BoardType"
       WHERE "isActive" = true
       ORDER BY "sortOrder", name`
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[board-types]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Hotels ───────────────────────────────────────────────────────────────────
// GET /hotels/popular?limit=12
app.get('/hotels/popular', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 12, 100);
  try {
    const rows = await query(
      `SELECT
         h.id, h."canonicalCode", h.name, h.city, h."countryCode",
         h."starRating", h.latitude, h.longitude, h."hotelType",
         h."chainName", h."qualityScore",
         (SELECT url FROM "HotelImage" img
          WHERE img."canonicalHotelId" = h.id AND img."isPrimary" = true
          LIMIT 1) AS "primaryImage"
       FROM "CanonicalHotel" h
       WHERE h.status = 'active'
       ORDER BY h."qualityScore" DESC NULLS LAST, h."starRating" DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[hotels/popular]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /hotels/:id/full — Full hotel detail with rooms, images, amenities, descriptions, reviews
// This is the primary endpoint for the HotelDetail / room-selection page.
// Returns all static data in ONE call — the frontend only needs to call the
// realtime-pricing endpoint separately (for prices + cancellation policy).
app.get('/hotels/:id/full', async (req: Request, res: Response) => {
  const { id } = req.params;
  const reviewLimit = Math.min(Number(req.query.reviews) || 10, 50);

  try {
    // 1. Base hotel record
    const [hotel] = await query(
      `SELECT
         id, "canonicalCode", name, "nameNormalized",
         description, address, "addressNormalized",
         city, "cityCode", state, "stateCode",
         country, "countryCode", "postalCode",
         latitude, longitude, timezone,
         "starRating", "hotelType", "propertyType",
         "chainCode", "chainName", "brandCode", "brandName",
         phone, email, website,
         "checkInTime", "checkOutTime",
         "qualityScore", status
       FROM "CanonicalHotel"
       WHERE id = $1 OR "canonicalCode" = $1
       LIMIT 1`,
      [id]
    );

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found', id });
    }

    const hotelId = hotel.id;

    // 2. Images (ordered: primary first, then by displayOrder)
    const images = await query(
      `SELECT url, "thumbnailUrl", "imageType", "isPrimary", "sizeVariant",
              width, height, caption, "displayOrder", "qualityScore"
       FROM "HotelImage"
       WHERE "canonicalHotelId" = $1 AND status = 'active'
       ORDER BY "isPrimary" DESC, "qualityScore" DESC NULLS LAST, "displayOrder" ASC
       LIMIT 50`,
      [hotelId]
    );

    // 3. Amenities (with category info from HotelAmenity)
    const amenities = await query(
      `SELECT ha.code, ha.name, ha.category, ha.icon, ha."isPopular",
              ham."isFree", ham."operatingHours"
       FROM "HotelAmenityMapping" ham
       JOIN "HotelAmenity" ha ON ha.id = ham."amenityId"
       WHERE ham."canonicalHotelId" = $1
       ORDER BY ha.category, ha."sortOrder" NULLS LAST, ha.name`,
      [hotelId]
    );

    // 4. Descriptions (primary + English first)
    const descriptions = await query(
      `SELECT "languageCode", "descriptionType", content
       FROM "HotelDescription"
       WHERE "canonicalHotelId" = $1
       ORDER BY "isPrimary" DESC, "languageCode"
       LIMIT 10`,
      [hotelId]
    );

    // 5. Contacts
    const contacts = await query(
      `SELECT "contactType", name, phone, "phoneTollFree", fax, email, website, "isPrimary"
       FROM "HotelContact"
       WHERE "canonicalHotelId" = $1
       ORDER BY "isPrimary" DESC`,
      [hotelId]
    );

    // 6. Reviews (sample for display)
    const reviews = await query(
      `SELECT "authorName", "authorCountry", "authorAvatar",
              rating, title, "reviewText", "stayDate", "travelerType", "roomType",
              cleanliness, service, location, value
       FROM "HotelReview"
       WHERE "canonicalHotelId" = $1 AND "isActive" = true
       ORDER BY "stayDate" DESC NULLS LAST
       LIMIT $2`,
      [hotelId, reviewLimit]
    );

    // 7. Room types with their images + amenities
    const roomTypes = await query(
      `SELECT
         rt.id, rt."roomTypeCode", rt."roomTypeName",
         rt."bedType", rt."bedCount", rt."maxOccupancy",
         rt."maxAdults", rt."maxChildren", rt."roomSize",
         rt."hasBalcony", rt."hasSeaView", rt."hasMountainView", rt."hasCityView",
         rt."supplierRoomCode", rt."supplierId"
       FROM "HotelRoomType" rt
       WHERE rt."canonicalHotelId" = $1 AND rt."isActive" = true
       ORDER BY rt."roomTypeCode"`,
      [hotelId]
    );

    // For each room type, batch-fetch images and amenities (avoid N+1)
    const roomIds = roomTypes.map((r: any) => r.id);

    const allRoomImages = roomIds.length > 0 ? await query(
      `SELECT url, "thumbnailUrl", "imageType", "isPrimary", "displayOrder", "roomTypeId"
       FROM "RoomImage"
       WHERE "roomTypeId" = ANY($1::text[])
       ORDER BY "isPrimary" DESC, "displayOrder"
       LIMIT 100`,
      [roomIds]
    ) : [];

    const allRoomAmenities = roomIds.length > 0 ? await query(
      `SELECT ram."roomTypeId", ra.code, ra.name, ra.category, ra.icon
       FROM "RoomAmenityMapping" ram
       JOIN "RoomAmenity" ra ON ra.id = ram."amenityId"
       WHERE ram."roomTypeId" = ANY($1::text[])
       ORDER BY ra.category, ra.name`,
      [roomIds]
    ) : [];

    // Group by roomTypeId
    const imagesByRoom = new Map<string, any[]>();
    for (const img of allRoomImages as any[]) {
      const list = imagesByRoom.get(img.roomTypeId) || [];
      list.push(img);
      imagesByRoom.set(img.roomTypeId, list);
    }

    const amenitiesByRoom = new Map<string, any[]>();
    for (const am of allRoomAmenities as any[]) {
      const list = amenitiesByRoom.get(am.roomTypeId) || [];
      list.push(am);
      amenitiesByRoom.set(am.roomTypeId, list);
    }

    const roomsWithDetails = roomTypes.map((room: any) => {
      const roomImages = (imagesByRoom.get(room.id) || []).slice(0, 10);
      const roomAmenities = amenitiesByRoom.get(room.id) || [];

      // Build human-readable features list
      const features: string[] = [];
      if (room.bedType) features.push(`${room.bedCount || 1}x ${room.bedType}`);
      if (room.roomSize) features.push(`${room.roomSize}m²`);
      if (room.hasBalcony) features.push('Balcony');
      if (room.hasSeaView) features.push('Sea View');
      if (room.hasCityView) features.push('City View');
      if (room.hasMountainView) features.push('Mountain View');

      return {
        ...room,
        name: room.roomTypeName,
        images: roomImages,
        amenities: roomAmenities,
        features,
        // Placeholder for realtime pricing — will be filled by the frontend hook
        rates: [],
      };
    });

    // Aggregate review stats
    const ratingAvg = reviews.length > 0
      ? reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length
      : null;

    return res.json({
      data: {
        hotel,
        images,
        amenities,
        descriptions,
        contacts,
        reviews,
        rooms: roomsWithDetails,
        stats: {
          reviewCount: reviews.length,
          ratingAvg: ratingAvg ? Math.round(ratingAvg * 10) / 10 : null,
        },
      },
    });
  } catch (e: any) {
    console.error('[hotels/:id/full]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /hotels/:id/rooms — Just the room types (fast, for room selection tables)
app.get('/hotels/:id/rooms', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [hotel] = await query(
      `SELECT id FROM "CanonicalHotel" WHERE id = $1 OR "canonicalCode" = $1 LIMIT 1`,
      [id]
    );
    if (!hotel) return res.status(404).json({ error: 'Hotel not found', id });

    const rooms = await query(
      `SELECT
         rt.id, rt."roomTypeCode", rt."roomTypeName",
         rt."bedType", rt."bedCount", rt."maxOccupancy",
         rt."maxAdults", rt."maxChildren", rt."roomSize",
         rt."hasBalcony", rt."hasSeaView", rt."hasMountainView", rt."hasCityView",
         rt."supplierRoomCode", rt."supplierId",
         (
           SELECT url FROM "RoomImage" ri
           WHERE ri."roomTypeId" = rt.id AND ri."isPrimary" = true
           LIMIT 1
         ) AS "primaryImage",
         (
           SELECT json_agg(json_build_object('code', ra.code, 'name', ra.name, 'category', ra.category, 'icon', ra.icon))
           FROM "RoomAmenityMapping" ram
           JOIN "RoomAmenity" ra ON ra.id = ram."amenityId"
           WHERE ram."roomTypeId" = rt.id
         ) AS amenities
       FROM "HotelRoomType" rt
       WHERE rt."canonicalHotelId" = $1 AND rt."isActive" = true
       ORDER BY rt."roomTypeCode"`,
      [hotel.id]
    );

    return res.json({ data: rooms, total: rooms.length });
  } catch (e: any) {
    console.error('[hotels/:id/rooms]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /hotels/:id
app.get('/hotels/:id', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const [hotel] = await query(
      `SELECT
         h.*,
         (
           SELECT json_agg(json_build_object(
             'url', img.url, 'type', img."imageType", 'isPrimary', img."isPrimary",
             'sizeVariant', img."sizeVariant"
           ) ORDER BY img."isPrimary" DESC, img."displayOrder")
           FROM "HotelImage" img
           WHERE img."canonicalHotelId" = h.id AND img.status = 'active'
           LIMIT 20
         ) AS images,
         (
           SELECT json_agg(json_build_object(
             'code', ha.code, 'name', ha.name, 'category', ha.category, 'icon', ha.icon
           ))
           FROM "HotelAmenityMapping" ham
           JOIN "HotelAmenity" ha ON ha.id = ham."amenityId"
           WHERE ham."canonicalHotelId" = h.id
         ) AS amenities,
         (
           SELECT json_agg(json_build_object(
             'languageCode', hd."languageCode", 'content', hd.content,
             'descriptionType', hd."descriptionType"
           ))
           FROM "HotelDescription" hd
           WHERE hd."canonicalHotelId" = h.id
         ) AS descriptions
       FROM "CanonicalHotel" h
       WHERE h.id = $1 OR h."canonicalCode" = $1
       LIMIT 1`,
      [id]
    );

    if (!hotel) {
      return res.status(404).json({ error: 'Hotel not found', id });
    }
    return res.json({ data: hotel });
  } catch (e: any) {
    console.error('[hotels/:id]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /hotels/:id/images
app.get('/hotels/:id/images', async (req: Request, res: Response) => {
  const { id } = req.params;
  const limit = Math.min(Number(req.query.limit) || 30, 100);
  try {
    const rows = await query(
      `SELECT url, "thumbnailUrl", "imageType", "isPrimary", "sizeVariant",
              width, height, caption, "displayOrder"
       FROM "HotelImage"
       WHERE "canonicalHotelId" = $1 AND status = 'active'
       ORDER BY "isPrimary" DESC, "displayOrder"
       LIMIT $2`,
      [id, limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[hotels/:id/images]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Popular Destinations (for homepage) ─────────────────────────────────────
// GET /popular-destinations?limit=12
// Uses the pre-computed hotelCount on the Destination table instead of an
// expensive cross-table LEFT JOIN with LOWER() matching.
app.get('/popular-destinations', async (req: Request, res: Response) => {
  const limit = Math.min(Number(req.query.limit) || 12, 50);
  try {
    const rows = await query(
      `SELECT
         id::text,
         code,
         name,
         "destinationType",
         "countryCode",
         "countryName",
         latitude,
         longitude,
         "popularityScore",
         "imageUrl",
         "hotelCount"
       FROM "Destination"
       WHERE "isActive" = true
         AND "destinationType" IN ('city', 'region', 'zone')
         AND "hotelCount" > 0
       ORDER BY "hotelCount" DESC, "popularityScore" DESC NULLS LAST
       LIMIT $1`,
      [limit]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[popular-destinations]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Phone Country Codes ─────────────────────────────────────────────────────
// GET /phone-codes
// Returns a merged list of (DB Country + standard ITU phone prefix) for phone-country-code dropdowns.
// Since DB Country.phonePrefix is currently NULL, we embed the standard ITU table here
// and JOIN it with DB country names so the data is always fresh.
const ITU_PHONE_PREFIXES: Record<string, string> = {
  AF: '+93', AL: '+355', DZ: '+213', AS: '+1-684', AD: '+376', AO: '+244', AI: '+1-264',
  AQ: '+672', AG: '+1-268', AR: '+54', AM: '+374', AW: '+297', AU: '+61', AT: '+43',
  AZ: '+994', BS: '+1-242', BH: '+973', BD: '+880', BB: '+1-246', BY: '+375', BE: '+32',
  BZ: '+501', BJ: '+229', BM: '+1-441', BT: '+975', BO: '+591', BA: '+387', BW: '+267',
  BR: '+55', BN: '+673', BG: '+359', BF: '+226', BI: '+257', CV: '+238', KH: '+855',
  CM: '+237', CA: '+1', CF: '+236', TD: '+235', CL: '+56', CN: '+86', CO: '+57',
  KM: '+269', CG: '+242', CD: '+243', CR: '+506', HR: '+385', CU: '+53', CY: '+357',
  CZ: '+420', DK: '+45', DJ: '+253', DM: '+1-767', DO: '+1-809', EC: '+593', EG: '+20',
  SV: '+503', GQ: '+240', ER: '+291', EE: '+372', SZ: '+268', ET: '+251', FJ: '+679',
  FI: '+358', FR: '+33', GA: '+241', GM: '+220', GE: '+995', DE: '+49', GH: '+233',
  GR: '+30', GD: '+1-473', GT: '+502', GN: '+224', GW: '+245', GY: '+592', HT: '+509',
  HN: '+504', HK: '+852', HU: '+36', IS: '+354', IN: '+91', ID: '+62', IR: '+98',
  IQ: '+964', IE: '+353', IL: '+972', IT: '+39', JM: '+1-876', JP: '+81', JO: '+962',
  KZ: '+7', KE: '+254', KI: '+686', KP: '+850', KR: '+82', KW: '+965', KG: '+996',
  LA: '+856', LV: '+371', LB: '+961', LS: '+266', LR: '+231', LY: '+218', LI: '+423',
  LT: '+370', LU: '+352', MO: '+853', MG: '+261', MW: '+265', MY: '+60', MV: '+960',
  ML: '+223', MT: '+356', MH: '+692', MR: '+222', MU: '+230', MX: '+52', FM: '+691',
  MD: '+373', MC: '+377', MN: '+976', ME: '+382', MA: '+212', MZ: '+258', MM: '+95',
  NA: '+264', NR: '+674', NP: '+977', NL: '+31', NZ: '+64', NI: '+505', NE: '+227',
  NG: '+234', NO: '+47', OM: '+968', PK: '+92', PW: '+680', PA: '+507', PG: '+675',
  PY: '+595', PE: '+51', PH: '+63', PL: '+48', PT: '+351', PR: '+1-787', QA: '+974',
  RO: '+40', RU: '+7', RW: '+250', KN: '+1-869', LC: '+1-758', VC: '+1-784', WS: '+685',
  SM: '+378', ST: '+239', SA: '+966', SN: '+221', RS: '+381', SC: '+248', SL: '+232',
  SG: '+65', SK: '+421', SI: '+386', SB: '+677', SO: '+252', ZA: '+27', SS: '+211',
  ES: '+34', LK: '+94', SD: '+249', SR: '+597', SE: '+46', CH: '+41', SY: '+963',
  TW: '+886', TJ: '+992', TZ: '+255', TH: '+66', TL: '+670', TG: '+228', TO: '+676',
  TT: '+1-868', TN: '+216', TR: '+90', TM: '+993', TV: '+688', UG: '+256', UA: '+380',
  AE: '+971', GB: '+44', US: '+1', UY: '+598', UZ: '+998', VU: '+678', VE: '+58',
  VN: '+84', YE: '+967', ZM: '+260', ZW: '+263'
};

app.get('/phone-codes', async (_req: Request, res: Response) => {
  try {
    // Primary: read directly from DB (now populated from Kaggle dataset)
    // Returns alpha3, numericCode AND phonePrefix for all countries
    const dbCountries = await query(
      `SELECT
         code        AS "alpha2",
         "alpha3",
         "numericCode",
         name,
         "phonePrefix",
         currency
       FROM "Country"
       WHERE "isActive" = true
         AND "phonePrefix" IS NOT NULL
       ORDER BY name`,
      []
    );

    if (dbCountries.length > 0) {
      return res.json({ data: dbCountries, total: dbCountries.length });
    }

    // Fallback: merge ITU table with country names from DB (used when DB prefix is empty)
    const nameRows = await query(`SELECT code, name FROM "Country" WHERE "isActive" = true ORDER BY name`, []);
    const fallback = nameRows
      .map((c: any) => ({
        alpha2: c.code,
        alpha3: null,
        numericCode: null,
        name: c.name,
        phonePrefix: ITU_PHONE_PREFIXES[c.code] || null,
        currency: null,
      }))
      .filter((c: any) => c.phonePrefix !== null);

    return res.json({ data: fallback, total: fallback.length });
  } catch (e: any) {
    // Pure static fallback (no DB)
    const result = Object.entries(ITU_PHONE_PREFIXES).map(([code, prefix]) => ({
      alpha2: code,
      alpha3: null,
      numericCode: null,
      name: code,
      phonePrefix: prefix,
      currency: null,
    }));
    return res.json({ data: result, total: result.length });
  }
});

// ─── Loyalty Programs (extended — for passenger form) ─────────────────────────
// GET /loyalty-programs/all?type=airline&limit=200
app.get('/loyalty-programs/all', async (req: Request, res: Response) => {
  const type = String(req.query.type || '').trim();   // 'airline' | 'hotel' | ''
  const limit = Math.min(Number(req.query.limit) || 300, 500);

  try {
    const conditions: string[] = ['enabled = true'];
    const params: any[] = [];
    let p = 1;

    if (type) {
      conditions.push(`program_type = $${p}`);
      params.push(type);
      p++;
    }

    params.push(limit);
    const rows = await query(
      `SELECT id, code, name, program_type AS "programType",
              provider_code AS "providerCode", logo_url AS "logoUrl",
              "cashbackRate", enabled, status
       FROM "LoyaltyProgram"
       WHERE ${conditions.join(' AND ')}
       ORDER BY name
       LIMIT $${p}`,
      params
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[loyalty-programs/all]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Room Amenities ───────────────────────────────────────────────────────────
// GET /room-amenities?category=Technology&popular=true
app.get('/room-amenities', async (req: Request, res: Response) => {
  const category = String(req.query.category || '').trim();
  const popularOnly = req.query.popular === 'true';
  const limit = Math.min(Number(req.query.limit) || 200, 1000);

  try {
    const conditions: string[] = ['"isActive" = true'];
    const params: any[] = [];
    let p = 1;

    if (category) {
      conditions.push(`LOWER(category) = $${p}`);
      params.push(category.toLowerCase());
      p++;
    }
    if (popularOnly) {
      conditions.push(`"isPopular" = true`);
    }

    params.push(limit);
    const rows = await query(
      `SELECT code, name, category, icon, "isPopular", "sortOrder"
       FROM "RoomAmenity"
       WHERE ${conditions.join(' AND ')}
       ORDER BY "sortOrder", name
       LIMIT $${p}`,
      params
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[room-amenities]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Loyalty Programs (for flight search - duffel programmes) ─────────────────
// GET /loyalty-programs?active=true
app.get('/loyalty-programs', async (req: Request, res: Response) => {
  const activeOnly = req.query.active !== 'false';
  try {
    const rows = await query(
      `SELECT id, code, name, "program_type" AS "programType",
              "provider_code" AS "providerCode", "logo_url" AS "logoUrl",
              "cashbackRate", enabled, status
       FROM "LoyaltyProgram"
       WHERE ($1::boolean = false OR (enabled = true AND status = 'active'))
       ORDER BY name`,
      [activeOnly]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[loyalty-programs]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Supplier Mappings for Hotels ─────────────────────────────────────────────
// GET /hotels/:id/suppliers — Get all supplier mappings for a canonical hotel
app.get('/hotels/:id/suppliers', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const rows = await query(
      `SELECT 
         shm.id, shm."supplierId", shm."supplierHotelId", shm."supplierHotelCode",
         shm."matchType", shm."matchConfidence", shm."matchVerifiedAt",
         shm."lastSyncedAt", shm."syncStatus", shm."isActive",
         s.name AS "supplierName", s.type AS "supplierType", s.code AS "supplierCode"
       FROM "SupplierHotelMapping" shm
       JOIN "suppliers" s ON s.id = shm."supplierId"
       WHERE shm."canonicalHotelId" = $1 AND shm."isActive" = true
       ORDER BY shm."matchConfidence" DESC NULLS LAST`,
      [id]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[hotels/:id/suppliers]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /suppliers — List all active suppliers
app.get('/suppliers', async (req: Request, res: Response) => {
  const type = String(req.query.type || '').trim(); // 'hotel' | 'flight'
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  
  try {
    const conditions: string[] = ['status = true'];
    const params: any[] = [];
    let p = 1;

    if (type) {
      conditions.push(`type = $${p}`);
      params.push(type);
      p++;
    }

    params.push(limit);
    const rows = await query(
      `SELECT id, code, name, type, status, "apiBaseUrl", features
       FROM "suppliers"
       WHERE ${conditions.join(' AND ')}
       ORDER BY name
       LIMIT $${p}`,
      params
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[suppliers]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// GET /destinations/:id/suppliers — Get all supplier mappings for a destination
app.get('/destinations/:id/suppliers', async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const rows = await query(
      `SELECT 
         dsm.id, dsm."supplierId", dsm."supplierCode", dsm."supplierName",
         dsm."matchConfidence", dsm."isVerified",
         s.name AS "supplierName", s.type AS "supplierType"
       FROM "DestinationSupplierMapping" dsm
       JOIN "suppliers" s ON s.id = dsm."supplierId"
       WHERE dsm."destinationId" = $1
       ORDER BY dsm."matchConfidence" DESC NULLS LAST`,
      [id]
    );
    return res.json({ data: rows, total: rows.length });
  } catch (e: any) {
    console.error('[destinations/:id/suppliers]', e.message);
    return res.status(500).json({ error: e.message });
  }
});

// ─── Static Files (Airline Logos, etc.) ───────────────────────────────────────
// Serve static files from /public directory
const publicDir = path.join(__dirname, '..', 'public');
app.use('/static-logos', express.static(path.join(publicDir, 'static-logos')));

// ─── 404 ──────────────────────────────────────────────────────────────────────
app.use((_req: Request, res: Response) => {
  res.status(404).json({ error: 'Not found' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[StaticDataService] Unhandled error:', err);
  res.status(500).json({ error: err.message || 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`✅ Static Data Service running on port ${PORT}`);
  console.log(`   DB: ${DB_URL.replace(/:([^@]+)@/, ':***@')}`);
  // Verify DB connection
  try {
    await query('SELECT 1');
    console.log('   DB connection: OK');
  } catch (e: any) {
    console.warn('   DB connection: FAILED —', e.message);
    console.warn('   Set DATABASE_URL to your local PostgreSQL connection string.');
  }
});

export default app;
