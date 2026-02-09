-- ============================================================================
-- Hotel Schema Optimization Migration
-- Version: 1.0
-- Date: 2026-02-08
-- Description: Optimized schema for 2M hotels at 100 RPS with <200ms latency
-- ============================================================================

-- Enable trigram extension for fuzzy search (run as superuser if needed)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ============================================================================
-- STEP 1: Add new columns to hotels table
-- ============================================================================

-- Add denormalized facility flags for O(1) filtering
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS short_description TEXT;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS country_code CHAR(2);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS chain_code VARCHAR(10);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS hotel_type VARCHAR(50);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS facility_ids INTEGER[] DEFAULT '{}';
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_wifi BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_pool BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_spa BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_parking BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_restaurant BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_gym BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_beach BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS has_pet_friendly BOOLEAN DEFAULT false;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS review_score DECIMAL(3,2);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS review_count INTEGER DEFAULT 0;
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS primary_source VARCHAR(50);
ALTER TABLE hotels ADD COLUMN IF NOT EXISTS content_score INTEGER DEFAULT 0;

-- Modify existing columns to be nullable for flexibility
ALTER TABLE hotels ALTER COLUMN address DROP NOT NULL;
ALTER TABLE hotels ALTER COLUMN city DROP NOT NULL;
ALTER TABLE hotels ALTER COLUMN country DROP NOT NULL;

-- ============================================================================
-- STEP 2: Create critical indexes for search performance
-- ============================================================================

-- Composite index for location + rating + chain filtering
CREATE INDEX IF NOT EXISTS idx_hotels_search_composite 
  ON hotels(country_code, city, star_rating, chain_code) 
  WHERE is_active = true;

-- GIN index for facility array filtering
CREATE INDEX IF NOT EXISTS idx_hotels_facilities_gin 
  ON hotels USING GIN(facility_ids);

-- Trigram index for fuzzy name search
CREATE INDEX IF NOT EXISTS idx_hotels_name_trgm 
  ON hotels USING GIN(name gin_trgm_ops);

-- Sorting indexes
CREATE INDEX IF NOT EXISTS idx_hotels_rating_score 
  ON hotels(star_rating, review_score) 
  WHERE is_active = true;

-- Single column indexes for common filters
CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotels(city);
CREATE INDEX IF NOT EXISTS idx_hotels_country_code ON hotels(country_code);
CREATE INDEX IF NOT EXISTS idx_hotels_chain_id ON hotels(chain_id);
CREATE INDEX IF NOT EXISTS idx_hotels_is_active ON hotels(is_active);

-- ============================================================================
-- STEP 3: Create hotel_rooms table
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  room_type_code VARCHAR(10) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  max_occupancy SMALLINT NOT NULL,
  bed_type VARCHAR(50),
  size_sqm DECIMAL(6,2),
  view_type VARCHAR(50),
  
  -- Denormalized amenity flags
  amenity_ids INTEGER[] DEFAULT '{}',
  has_balcony BOOLEAN DEFAULT false,
  has_kitchen BOOLEAN DEFAULT false,
  has_bathtub BOOLEAN DEFAULT false,
  has_air_con BOOLEAN DEFAULT false,
  has_minibar BOOLEAN DEFAULT false,
  has_safe BOOLEAN DEFAULT false,
  
  -- Media
  images JSONB DEFAULT '[]',
  
  -- Metadata
  is_accessible BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Room indexes
CREATE INDEX IF NOT EXISTS idx_rooms_hotel ON hotel_rooms(hotel_id);
CREATE INDEX IF NOT EXISTS idx_rooms_occupancy ON hotel_rooms(max_occupancy);
CREATE INDEX IF NOT EXISTS idx_rooms_view_type ON hotel_rooms(view_type);
CREATE INDEX IF NOT EXISTS idx_rooms_type_code ON hotel_rooms(room_type_code);
CREATE INDEX IF NOT EXISTS idx_rooms_amenities_gin ON hotel_rooms USING GIN(amenity_ids);

-- ============================================================================
-- STEP 4: Create room_rates table (hot data)
-- ============================================================================

CREATE TABLE IF NOT EXISTS room_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES hotel_rooms(id) ON DELETE CASCADE,
  hotel_id INTEGER NOT NULL, -- Denormalized for faster joins
  
  -- Pricing
  board_basis VARCHAR(10) NOT NULL, -- RO, BB, HB, FB, AI
  price_amount DECIMAL(10,2) NOT NULL,
  currency_code CHAR(3) DEFAULT 'USD',
  tax_amount DECIMAL(10,2) DEFAULT 0,
  price_includes_tax BOOLEAN DEFAULT false,
  payment_type VARCHAR(20), -- prepay, pay_at_hotel
  
  -- Availability window
  valid_from DATE NOT NULL,
  valid_to DATE NOT NULL,
  
  -- Rate metadata
  cancellation_policy VARCHAR(50),
  refundable BOOLEAN DEFAULT true,
  supplier_code VARCHAR(50),
  supplier_rate_id VARCHAR(100),
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Rate indexes for availability and price filtering
CREATE INDEX IF NOT EXISTS idx_rates_hotel_date 
  ON room_rates(hotel_id, valid_from, valid_to);
CREATE INDEX IF NOT EXISTS idx_rates_search 
  ON room_rates(hotel_id, board_basis, payment_type, price_amount) 
  WHERE valid_to >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_rates_price_range 
  ON room_rates(price_amount, currency_code) 
  WHERE valid_to >= CURRENT_DATE;
CREATE INDEX IF NOT EXISTS idx_rates_room ON room_rates(room_id);

-- ============================================================================
-- STEP 5: Create hotel_supplier_refs table
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_supplier_refs (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  supplier_code VARCHAR(50) NOT NULL,
  supplier_hotel_id VARCHAR(100) NOT NULL,
  match_confidence DECIMAL(3,2) DEFAULT 1.00,
  match_method VARCHAR(50),
  raw_data JSONB,
  last_synced_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(supplier_code, supplier_hotel_id)
);

CREATE INDEX IF NOT EXISTS idx_supplier_refs_hotel ON hotel_supplier_refs(hotel_id);

-- ============================================================================
-- STEP 6: Create hotel_images_optimized table
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_images_optimized (
  id SERIAL PRIMARY KEY,
  hotel_id INTEGER NOT NULL REFERENCES hotels(id) ON DELETE CASCADE,
  url TEXT NOT NULL,
  thumbnail_url TEXT,
  type VARCHAR(50) DEFAULT 'general', -- main, room, exterior, pool, etc.
  caption TEXT,
  sort_order INTEGER DEFAULT 0,
  width INTEGER,
  height INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hotel_images_type ON hotel_images_optimized(hotel_id, type);
CREATE INDEX IF NOT EXISTS idx_hotel_images_order ON hotel_images_optimized(hotel_id, sort_order);

-- ============================================================================
-- STEP 7: Create materialized view for popular searches
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS mv_hotel_search_cache AS
SELECT 
  h.country_code,
  h.city,
  h.chain_code,
  h.star_rating::integer as star_rating,
  COUNT(*) as hotel_count,
  AVG(h.review_score) as avg_rating,
  MIN(r.price_amount) as min_price,
  MAX(r.price_amount) as max_price
FROM hotels h
LEFT JOIN room_rates r ON h.id = r.hotel_id 
  AND r.valid_to >= CURRENT_DATE
WHERE h.is_active = true
GROUP BY h.country_code, h.city, h.chain_code, h.star_rating;

CREATE UNIQUE INDEX IF NOT EXISTS idx_mv_search_cache 
  ON mv_hotel_search_cache(country_code, city, chain_code, star_rating);

-- ============================================================================
-- STEP 8: Create refresh function for materialized view
-- ============================================================================

CREATE OR REPLACE FUNCTION refresh_hotel_search_cache()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_hotel_search_cache;
END;
$$ LANGUAGE plpgsql;

-- Schedule to run every 6 hours (use pg_cron if available)
-- SELECT cron.schedule('refresh-hotel-cache', '0 */6 * * *', 'SELECT refresh_hotel_search_cache()');

-- ============================================================================
-- STEP 9: Create helper function to set denormalized flags
-- ============================================================================

CREATE OR REPLACE FUNCTION update_hotel_facility_flags()
RETURNS TRIGGER AS $$
DECLARE
  wifi_id INTEGER;
  pool_id INTEGER;
  spa_id INTEGER;
  parking_id INTEGER;
  restaurant_id INTEGER;
  gym_id INTEGER;
BEGIN
  -- Get amenity IDs (adjust based on your amenities table)
  SELECT id INTO wifi_id FROM amenities WHERE code = 'WIFI' LIMIT 1;
  SELECT id INTO pool_id FROM amenities WHERE code = 'SWIMMING_POOL' LIMIT 1;
  SELECT id INTO spa_id FROM amenities WHERE code = 'SPA' LIMIT 1;
  SELECT id INTO parking_id FROM amenities WHERE code = 'PARKING' LIMIT 1;
  SELECT id INTO restaurant_id FROM amenities WHERE code = 'RESTAURANT' LIMIT 1;
  SELECT id INTO gym_id FROM amenities WHERE code = 'FITNESS_CENTER' LIMIT 1;
  
  -- Update boolean flags based on facility_ids array
  NEW.has_wifi := wifi_id = ANY(NEW.facility_ids);
  NEW.has_pool := pool_id = ANY(NEW.facility_ids);
  NEW.has_spa := spa_id = ANY(NEW.facility_ids);
  NEW.has_parking := parking_id = ANY(NEW.facility_ids);
  NEW.has_restaurant := restaurant_id = ANY(NEW.facility_ids);
  NEW.has_gym := gym_id = ANY(NEW.facility_ids);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update flags when facility_ids changes
DROP TRIGGER IF EXISTS trg_update_hotel_facility_flags ON hotels;
CREATE TRIGGER trg_update_hotel_facility_flags
  BEFORE INSERT OR UPDATE OF facility_ids ON hotels
  FOR EACH ROW
  EXECUTE FUNCTION update_hotel_facility_flags();

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

COMMENT ON TABLE hotels IS 'Optimized hotel table with denormalized fields for 100 RPS search queries';
COMMENT ON TABLE hotel_rooms IS 'Optimized room table with amenity flags for fast filtering';
COMMENT ON TABLE room_rates IS 'Hot data table for availability and pricing queries';
COMMENT ON MATERIALIZED VIEW mv_hotel_search_cache IS 'Pre-computed search aggregations, refresh every 6 hours';
