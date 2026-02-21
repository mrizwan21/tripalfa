-- =============================================================================
-- 02-indexes.sql
-- GIN trigram + composite indexes for low-latency static data queries
-- Runs automatically on first container start via docker-entrypoint-initdb.d
--
-- NOTE: These indexes are applied AFTER Prisma creates the tables
--       (via prisma db push or prisma migrate). If tables don't exist yet,
--       this script will fail harmlessly — re-run it after schema push:
--         docker exec tripalfa-postgres-static psql -U postgres -d staticdatabase \
--           -f /docker-entrypoint-initdb.d/02-indexes.sql
-- =============================================================================

-- ─── Airports ─────────────────────────────────────────────────────────────────
-- Search: LOWER(iata_code) LIKE, LOWER(name) LIKE, LOWER(city) LIKE
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Airport') THEN
    CREATE INDEX IF NOT EXISTS idx_airport_name_trgm
      ON "Airport" USING gin (lower(name) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_airport_city_trgm
      ON "Airport" USING gin (lower(city) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_airport_iata_lower
      ON "Airport" (lower(iata_code));
    -- Covering index for the common active-airport query pattern
    CREATE INDEX IF NOT EXISTS idx_airport_active_covering
      ON "Airport" (is_active, iata_code)
      INCLUDE (name, city, country, country_code, latitude, longitude);
    RAISE NOTICE 'Airport indexes created';
  ELSE
    RAISE NOTICE 'Airport table not found — skipping';
  END IF;
END $$;

-- ─── Airlines ─────────────────────────────────────────────────────────────────
-- Search: LOWER(iata_code) LIKE, LOWER(name) LIKE
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Airline') THEN
    CREATE INDEX IF NOT EXISTS idx_airline_name_trgm
      ON "Airline" USING gin (lower(name) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_airline_iata_lower
      ON "Airline" (lower(iata_code));
    RAISE NOTICE 'Airline indexes created';
  ELSE
    RAISE NOTICE 'Airline table not found — skipping';
  END IF;
END $$;

-- ─── Cities ───────────────────────────────────────────────────────────────────
-- Search: LOWER(name) LIKE, LOWER(iata_code) LIKE, LOWER(country) LIKE
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'City') THEN
    CREATE INDEX IF NOT EXISTS idx_city_name_trgm
      ON "City" USING gin (lower(name) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_city_iata_lower
      ON "City" (lower(iata_code));
    RAISE NOTICE 'City indexes created';
  ELSE
    RAISE NOTICE 'City table not found — skipping';
  END IF;
END $$;

-- ─── Destinations ─────────────────────────────────────────────────────────────
-- Search: LOWER(name) LIKE, LOWER("countryName") LIKE, LOWER(code) LIKE
-- Filter: "isActive", "destinationType", "isPopular", "countryCode"
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Destination') THEN
    CREATE INDEX IF NOT EXISTS idx_dest_name_trgm
      ON "Destination" USING gin (lower(name) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_dest_country_name_trgm
      ON "Destination" USING gin (lower("countryName") gin_trgm_ops);
    -- Composite for active type+popular filter (popular-destinations, suggestions)
    CREATE INDEX IF NOT EXISTS idx_dest_active_type_popular
      ON "Destination" ("isActive", "destinationType", "isPopular")
      INCLUDE (name, "countryCode", "countryName", "popularityScore", "hotelCount");
    -- For ORDER BY hotelCount DESC (popular destinations page)
    CREATE INDEX IF NOT EXISTS idx_dest_hotel_count
      ON "Destination" ("isActive", "hotelCount" DESC)
      WHERE "hotelCount" > 0;
    RAISE NOTICE 'Destination indexes created';
  ELSE
    RAISE NOTICE 'Destination table not found — skipping';
  END IF;
END $$;

-- ─── CanonicalHotel (canonical_hotels) ────────────────────────────────────────
-- Search: hotel name, city; Order: qualityScore, starRating
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'canonical_hotels') THEN
    CREATE INDEX IF NOT EXISTS idx_canonical_hotel_name_trgm
      ON canonical_hotels USING gin (lower(name) gin_trgm_ops);
    CREATE INDEX IF NOT EXISTS idx_canonical_hotel_city_lower
      ON canonical_hotels (lower(city));
    -- Popular hotels: sorted by quality, filtered by status
    CREATE INDEX IF NOT EXISTS idx_canonical_hotel_active_quality
      ON canonical_hotels (status, quality_score DESC NULLS LAST, star_rating DESC NULLS LAST)
      INCLUDE (id, canonical_code, name, city, country_code, hotel_type, chain_name);
    RAISE NOTICE 'CanonicalHotel indexes created';
  ELSE
    RAISE NOTICE 'canonical_hotels table not found — skipping';
  END IF;
END $$;

-- ─── HotelImage ───────────────────────────────────────────────────────────────
-- Subquery: primary image for a hotel (used in /hotels/popular, /hotels/:id)
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'HotelImage') THEN
    CREATE INDEX IF NOT EXISTS idx_hotel_image_primary_covering
      ON "HotelImage" ("canonicalHotelId", "isPrimary", status)
      INCLUDE (url);
    -- Image listing: ordered by quality + display order
    CREATE INDEX IF NOT EXISTS idx_hotel_image_listing
      ON "HotelImage" ("canonicalHotelId", status, "isPrimary" DESC, "qualityScore" DESC NULLS LAST, "displayOrder");
    RAISE NOTICE 'HotelImage indexes created';
  ELSE
    RAISE NOTICE 'HotelImage table not found — skipping';
  END IF;
END $$;

-- ─── HotelReview ──────────────────────────────────────────────────────────────
-- Query: WHERE canonicalHotelId = $1 AND isActive = true ORDER BY stayDate DESC
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'HotelReview') THEN
    CREATE INDEX IF NOT EXISTS idx_hotel_review_active_date
      ON "HotelReview" ("canonicalHotelId", "isActive", "stayDate" DESC NULLS LAST);
    RAISE NOTICE 'HotelReview indexes created';
  ELSE
    RAISE NOTICE 'HotelReview table not found — skipping';
  END IF;
END $$;

-- ─── HotelRoomType ────────────────────────────────────────────────────────────
-- Query: WHERE canonicalHotelId = $1 AND isActive = true ORDER BY roomTypeCode
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'HotelRoomType') THEN
    CREATE INDEX IF NOT EXISTS idx_room_type_hotel_active
      ON "HotelRoomType" ("canonicalHotelId", "isActive", "roomTypeCode");
    RAISE NOTICE 'HotelRoomType indexes created';
  ELSE
    RAISE NOTICE 'HotelRoomType table not found — skipping';
  END IF;
END $$;

-- ─── RoomImage ────────────────────────────────────────────────────────────────
-- Subquery: primary room image, room image listing
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'RoomImage') THEN
    CREATE INDEX IF NOT EXISTS idx_room_image_primary_covering
      ON "RoomImage" ("roomTypeId", "isPrimary" DESC, "displayOrder")
      INCLUDE (url, "thumbnailUrl", "imageType");
    RAISE NOTICE 'RoomImage indexes created';
  ELSE
    RAISE NOTICE 'RoomImage table not found — skipping';
  END IF;
END $$;

-- ─── Country ──────────────────────────────────────────────────────────────────
-- Search: LOWER(code) LIKE, LOWER(name) LIKE
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'Country') THEN
    CREATE INDEX IF NOT EXISTS idx_country_name_trgm
      ON "Country" USING gin (lower(name) gin_trgm_ops);
    RAISE NOTICE 'Country indexes created';
  ELSE
    RAISE NOTICE 'Country table not found — skipping';
  END IF;
END $$;

DO $$ BEGIN
  RAISE NOTICE '✅ Static database indexes script completed';
END $$;
