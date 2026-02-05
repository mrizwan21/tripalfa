-- Static Data Database Redesign Migration
-- Version: 1.0
-- Date: 2026-02-02
-- Description: Implements unified, supplier-agnostic canonical model for hotels and flights

-- ============================================================================
-- PHASE 1: CREATE NEW REFERENCE TABLES
-- ============================================================================

-- Data Suppliers Registry
CREATE TABLE IF NOT EXISTS data_suppliers (
    code VARCHAR(50) PRIMARY KEY,
    name TEXT NOT NULL,
    
    -- API Details
    api_type VARCHAR(50), -- 'REST', 'SOAP', 'GRAPHQL', 'FILE'
    base_url TEXT,
    
    -- Data Coverage
    provides_hotels BOOLEAN DEFAULT false,
    provides_flights BOOLEAN DEFAULT false,
    provides_content BOOLEAN DEFAULT false, -- Rich descriptions/images
    
    -- Priority for merging (lower = preferred)
    content_priority INTEGER DEFAULT 100,
    
    -- Sync Status
    is_active BOOLEAN DEFAULT true,
    last_full_sync_at TIMESTAMPTZ,
    last_incremental_sync_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed suppliers
INSERT INTO data_suppliers (code, name, provides_hotels, provides_flights, provides_content, content_priority, api_type) VALUES
('GIATA', 'GIATA', true, false, true, 10, 'REST'),
('LITEAPI', 'LiteAPI', true, false, false, 50, 'REST'),
('HOTELSTON', 'Hotelston', true, false, true, 40, 'SOAP'),
('INNSTANT', 'Innstant Travel', true, true, false, 60, 'REST'),
('DUFFEL', 'Duffel', false, true, false, 20, 'REST'),
('AMADEUS', 'Amadeus', true, true, false, 30, 'REST')
ON CONFLICT (code) DO UPDATE SET
    name = EXCLUDED.name,
    provides_hotels = EXCLUDED.provides_hotels,
    provides_flights = EXCLUDED.provides_flights,
    provides_content = EXCLUDED.provides_content,
    content_priority = EXCLUDED.content_priority;

-- ============================================================================
-- PHASE 2: ENHANCE REFERENCE TABLES
-- ============================================================================

-- Add columns to countries if they don't exist
DO $$
BEGIN
    -- Add iso2 column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'iso2') THEN
        ALTER TABLE countries ADD COLUMN iso2 VARCHAR(2);
    END IF;
    
    -- Add iso3 column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'iso3') THEN
        ALTER TABLE countries ADD COLUMN iso3 VARCHAR(3);
    END IF;
    
    -- Add continent column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'continent') THEN
        ALTER TABLE countries ADD COLUMN continent VARCHAR(20);
    END IF;
    
    -- Add currency_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'currency_code') THEN
        ALTER TABLE countries ADD COLUMN currency_code VARCHAR(3);
    END IF;
    
    -- Add phone_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'phone_code') THEN
        ALTER TABLE countries ADD COLUMN phone_code VARCHAR(10);
    END IF;
    
    -- Add capital column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'capital') THEN
        ALTER TABLE countries ADD COLUMN capital TEXT;
    END IF;
    
    -- Add flag_emoji column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'flag_emoji') THEN
        ALTER TABLE countries ADD COLUMN flag_emoji TEXT;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'countries' AND column_name = 'is_active') THEN
        ALTER TABLE countries ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Merge hotelston_countries into countries
INSERT INTO countries (code, name, created_at, updated_at)
SELECT code, name, created_at, updated_at
FROM hotelston_countries
ON CONFLICT (code) DO NOTHING;

-- Add columns to cities if they don't exist
DO $$
BEGIN
    -- Add ascii_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'ascii_name') THEN
        ALTER TABLE cities ADD COLUMN ascii_name TEXT;
    END IF;
    
    -- Add state_province column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'state_province') THEN
        ALTER TABLE cities ADD COLUMN state_province TEXT;
    END IF;
    
    -- Add state_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'state_code') THEN
        ALTER TABLE cities ADD COLUMN state_code VARCHAR(10);
    END IF;
    
    -- Add is_capital column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'is_capital') THEN
        ALTER TABLE cities ADD COLUMN is_capital BOOLEAN DEFAULT false;
    END IF;
    
    -- Add is_major column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cities' AND column_name = 'is_major') THEN
        ALTER TABLE cities ADD COLUMN is_major BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Merge hotelston_cities into cities
INSERT INTO cities (name, country, country_code, latitude, longitude, population, timezone, created_at, updated_at)
SELECT name, country, country_code, latitude, longitude, population, timezone, created_at, updated_at
FROM hotelston_cities
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PHASE 3: CREATE NORMALIZED AMENITIES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS amenities (
    id SERIAL PRIMARY KEY,
    
    code VARCHAR(100) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    
    category VARCHAR(50), -- 'CONNECTIVITY', 'RECREATION', 'SERVICES', 'ROOM', 'ACCESSIBILITY'
    icon TEXT,
    
    -- For room vs hotel level distinction
    applies_to VARCHAR(20) DEFAULT 'both', -- 'hotel', 'room', 'both'
    
    is_popular BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Migrate hotel_facilities to amenities
INSERT INTO amenities (code, name, category, created_at)
SELECT 
    UPPER(REPLACE(REPLACE(REPLACE(name, ' ', '_'), '/', '_'), '-', '_')) AS code,
    name,
    COALESCE(category, 'GENERAL') AS category,
    created_at
FROM hotel_facilities
ON CONFLICT (code) DO NOTHING;

-- Also merge hotelston_hotel_facilities
INSERT INTO amenities (code, name, category, created_at)
SELECT 
    UPPER(REPLACE(REPLACE(REPLACE(name, ' ', '_'), '/', '_'), '-', '_')) AS code,
    name,
    COALESCE(category, 'GENERAL') AS category,
    created_at
FROM hotelston_hotel_facilities
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PHASE 4: ENHANCE HOTEL CHAINS
-- ============================================================================

DO $$
BEGIN
    -- Add parent_chain_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_chains' AND column_name = 'parent_chain_id') THEN
        ALTER TABLE hotel_chains ADD COLUMN parent_chain_id INTEGER REFERENCES hotel_chains(id);
    END IF;
    
    -- Add tier column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_chains' AND column_name = 'tier') THEN
        ALTER TABLE hotel_chains ADD COLUMN tier VARCHAR(20);
    END IF;
    
    -- Add loyalty_program column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_chains' AND column_name = 'loyalty_program') THEN
        ALTER TABLE hotel_chains ADD COLUMN loyalty_program TEXT;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_chains' AND column_name = 'is_active') THEN
        ALTER TABLE hotel_chains ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
END $$;

-- Merge hotelston_hotel_chains into hotel_chains
INSERT INTO hotel_chains (name, code, website, logo_url, country, created_at, updated_at)
SELECT 
    name, 
    COALESCE(code, UPPER(REPLACE(SUBSTRING(name, 1, 10), ' ', '_')) || '_' || id::text) AS code,
    website, 
    logo_url, 
    country, 
    created_at, 
    updated_at
FROM hotelston_hotel_chains
ON CONFLICT (code) DO NOTHING;

-- ============================================================================
-- PHASE 5: ENHANCE HOTEL TYPES
-- ============================================================================

DO $$
BEGIN
    -- Add code column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_types' AND column_name = 'code') THEN
        ALTER TABLE hotel_types ADD COLUMN code VARCHAR(50);
    END IF;
    
    -- Add icon column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_types' AND column_name = 'icon') THEN
        ALTER TABLE hotel_types ADD COLUMN icon TEXT;
    END IF;
    
    -- Add sort_order column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_types' AND column_name = 'sort_order') THEN
        ALTER TABLE hotel_types ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;
END $$;

-- Update hotel_types with codes
UPDATE hotel_types SET code = UPPER(REPLACE(name, ' ', '_')) WHERE code IS NULL;

-- Make code unique (if not already)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_indexes WHERE indexname = 'hotel_types_code_key'
    ) THEN
        CREATE UNIQUE INDEX hotel_types_code_key ON hotel_types(code);
    END IF;
END $$;

-- Merge hotelston_hotel_types
INSERT INTO hotel_types (name, description, code, created_at, updated_at)
SELECT 
    name, 
    description,
    UPPER(REPLACE(name, ' ', '_')) AS code,
    created_at, 
    updated_at
FROM hotelston_hotel_types
ON CONFLICT DO NOTHING;

-- ============================================================================
-- PHASE 6: ENHANCE CANONICAL HOTELS
-- ============================================================================

DO $$
BEGIN
    -- Add slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'slug') THEN
        ALTER TABLE canonical_hotels ADD COLUMN slug TEXT;
    END IF;
    
    -- Add postal_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'postal_code') THEN
        ALTER TABLE canonical_hotels ADD COLUMN postal_code TEXT;
    END IF;
    
    -- Add city_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'city_id') THEN
        ALTER TABLE canonical_hotels ADD COLUMN city_id INTEGER;
    END IF;
    
    -- Add country_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'country_code') THEN
        ALTER TABLE canonical_hotels ADD COLUMN country_code VARCHAR(3);
    END IF;
    
    -- Add timezone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'timezone') THEN
        ALTER TABLE canonical_hotels ADD COLUMN timezone TEXT;
    END IF;
    
    -- Add hotel_type_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'hotel_type_id') THEN
        ALTER TABLE canonical_hotels ADD COLUMN hotel_type_id INTEGER;
    END IF;
    
    -- Add chain_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'chain_id') THEN
        ALTER TABLE canonical_hotels ADD COLUMN chain_id INTEGER;
    END IF;
    
    -- Add description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'description') THEN
        ALTER TABLE canonical_hotels ADD COLUMN description TEXT;
    END IF;
    
    -- Add short_description column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'short_description') THEN
        ALTER TABLE canonical_hotels ADD COLUMN short_description TEXT;
    END IF;
    
    -- Add website column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'website') THEN
        ALTER TABLE canonical_hotels ADD COLUMN website TEXT;
    END IF;
    
    -- Add phone column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'phone') THEN
        ALTER TABLE canonical_hotels ADD COLUMN phone TEXT;
    END IF;
    
    -- Add email column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'email') THEN
        ALTER TABLE canonical_hotels ADD COLUMN email TEXT;
    END IF;
    
    -- Add checkin_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'checkin_time') THEN
        ALTER TABLE canonical_hotels ADD COLUMN checkin_time TIME;
    END IF;
    
    -- Add checkout_time column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'checkout_time') THEN
        ALTER TABLE canonical_hotels ADD COLUMN checkout_time TIME;
    END IF;
    
    -- Add policies column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'policies') THEN
        ALTER TABLE canonical_hotels ADD COLUMN policies JSONB;
    END IF;
    
    -- Add user_rating column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'user_rating') THEN
        ALTER TABLE canonical_hotels ADD COLUMN user_rating DECIMAL(3,2);
    END IF;
    
    -- Add review_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'review_count') THEN
        ALTER TABLE canonical_hotels ADD COLUMN review_count INTEGER DEFAULT 0;
    END IF;
    
    -- Add content_score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'content_score') THEN
        ALTER TABLE canonical_hotels ADD COLUMN content_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add primary_source column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'primary_source') THEN
        ALTER TABLE canonical_hotels ADD COLUMN primary_source VARCHAR(50);
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'is_active') THEN
        ALTER TABLE canonical_hotels ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add search_vector column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_hotels' AND column_name = 'search_vector') THEN
        ALTER TABLE canonical_hotels ADD COLUMN search_vector TSVECTOR;
    END IF;
END $$;

-- Add foreign key constraints
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_canonical_hotels_chain'
    ) THEN
        ALTER TABLE canonical_hotels ADD CONSTRAINT fk_canonical_hotels_chain 
            FOREIGN KEY (chain_id) REFERENCES hotel_chains(id) ON DELETE SET NULL;
    END IF;
END $$;

-- Create indexes on canonical_hotels
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_city ON canonical_hotels(city);
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_country ON canonical_hotels(country);
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_country_code ON canonical_hotels(country_code);
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_chain ON canonical_hotels(chain_id);
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_rating ON canonical_hotels(star_rating);
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_active ON canonical_hotels(is_active);
CREATE INDEX IF NOT EXISTS idx_canonical_hotels_search ON canonical_hotels USING gin(search_vector);

-- ============================================================================
-- PHASE 7: CREATE HOTEL SUPPLIER REFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_supplier_references (
    id SERIAL PRIMARY KEY,
    canonical_hotel_id INTEGER NOT NULL REFERENCES canonical_hotels(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) NOT NULL,
    supplier_hotel_id TEXT NOT NULL,
    
    -- Mapping Confidence
    match_confidence DECIMAL(3,2) DEFAULT 1.00,
    match_method VARCHAR(50),
    
    -- Supplier-Specific Raw Data
    raw_data JSONB,
    
    -- Sync Status
    last_synced_at TIMESTAMPTZ,
    sync_status VARCHAR(20) DEFAULT 'active',
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(supplier_code, supplier_hotel_id)
);

CREATE INDEX IF NOT EXISTS idx_hotel_supplier_refs_canonical ON hotel_supplier_references(canonical_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_supplier_refs_supplier ON hotel_supplier_references(supplier_code, supplier_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_supplier_refs_status ON hotel_supplier_references(sync_status);

-- Migrate from hotel_supplier_mappings to hotel_supplier_references
INSERT INTO hotel_supplier_references (canonical_hotel_id, supplier_code, supplier_hotel_id, match_confidence, created_at)
SELECT 
    canonical_hotel_id,
    supplier_name AS supplier_code,
    supplier_external_id AS supplier_hotel_id,
    1.00 AS match_confidence,
    created_at
FROM hotel_supplier_mappings
WHERE canonical_hotel_id IS NOT NULL AND supplier_external_id IS NOT NULL
ON CONFLICT (supplier_code, supplier_hotel_id) DO NOTHING;

-- ============================================================================
-- PHASE 8: CREATE HOTEL IMAGES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_images (
    id SERIAL PRIMARY KEY,
    canonical_hotel_id INTEGER NOT NULL REFERENCES canonical_hotels(id) ON DELETE CASCADE,
    
    url TEXT NOT NULL,
    url_hash TEXT NOT NULL,
    
    -- Variants
    thumbnail_url TEXT,
    small_url TEXT,
    medium_url TEXT,
    large_url TEXT,
    
    -- Metadata
    caption TEXT,
    category VARCHAR(50),
    is_primary BOOLEAN DEFAULT false,
    sort_order INTEGER DEFAULT 0,
    
    -- Provenance
    source_supplier VARCHAR(50),
    source_id TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(canonical_hotel_id, url_hash)
);

CREATE INDEX IF NOT EXISTS idx_hotel_images_hotel ON hotel_images(canonical_hotel_id);
CREATE INDEX IF NOT EXISTS idx_hotel_images_primary ON hotel_images(canonical_hotel_id, is_primary);

-- ============================================================================
-- PHASE 9: CREATE HOTEL AMENITY INSTANCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS hotel_amenity_instances (
    canonical_hotel_id INTEGER NOT NULL REFERENCES canonical_hotels(id) ON DELETE CASCADE,
    amenity_id INTEGER NOT NULL REFERENCES amenities(id) ON DELETE CASCADE,
    
    source_supplier VARCHAR(50),
    
    PRIMARY KEY (canonical_hotel_id, amenity_id)
);

-- ============================================================================
-- PHASE 10: ENHANCE CANONICAL ROOM TYPES
-- ============================================================================

DO $$
BEGIN
    -- Add slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'slug') THEN
        ALTER TABLE canonical_room_types ADD COLUMN slug TEXT;
    END IF;
    
    -- Add standardized_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'standardized_name') THEN
        ALTER TABLE canonical_room_types ADD COLUMN standardized_name TEXT;
    END IF;
    
    -- Add room_class column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'room_class') THEN
        ALTER TABLE canonical_room_types ADD COLUMN room_class VARCHAR(50);
    END IF;
    
    -- Add room_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'room_type') THEN
        ALTER TABLE canonical_room_types ADD COLUMN room_type VARCHAR(50);
    END IF;
    
    -- Add max_adults column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'max_adults') THEN
        ALTER TABLE canonical_room_types ADD COLUMN max_adults INTEGER;
    END IF;
    
    -- Add max_children column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'max_children') THEN
        ALTER TABLE canonical_room_types ADD COLUMN max_children INTEGER;
    END IF;
    
    -- Add bed_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'bed_type') THEN
        ALTER TABLE canonical_room_types ADD COLUMN bed_type TEXT;
    END IF;
    
    -- Add bed_count column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'bed_count') THEN
        ALTER TABLE canonical_room_types ADD COLUMN bed_count INTEGER DEFAULT 1;
    END IF;
    
    -- Add room_size_sqm column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'room_size_sqm') THEN
        ALTER TABLE canonical_room_types ADD COLUMN room_size_sqm DECIMAL(6,2);
    END IF;
    
    -- Add view_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'view_type') THEN
        ALTER TABLE canonical_room_types ADD COLUMN view_type TEXT;
    END IF;
    
    -- Add is_accessible column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'is_accessible') THEN
        ALTER TABLE canonical_room_types ADD COLUMN is_accessible BOOLEAN DEFAULT false;
    END IF;
    
    -- Add is_smoking_allowed column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'is_smoking_allowed') THEN
        ALTER TABLE canonical_room_types ADD COLUMN is_smoking_allowed BOOLEAN DEFAULT false;
    END IF;
    
    -- Add content_score column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'content_score') THEN
        ALTER TABLE canonical_room_types ADD COLUMN content_score INTEGER DEFAULT 0;
    END IF;
    
    -- Add is_active column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'is_active') THEN
        ALTER TABLE canonical_room_types ADD COLUMN is_active BOOLEAN DEFAULT true;
    END IF;
    
    -- Add images column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'canonical_room_types' AND column_name = 'images') THEN
        ALTER TABLE canonical_room_types ADD COLUMN images JSONB;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_canonical_rooms_hotel ON canonical_room_types(canonical_hotel_id);

-- ============================================================================
-- PHASE 11: CREATE ROOM SUPPLIER REFERENCES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS room_supplier_references (
    id SERIAL PRIMARY KEY,
    canonical_room_id INTEGER NOT NULL REFERENCES canonical_room_types(id) ON DELETE CASCADE,
    supplier_code VARCHAR(50) NOT NULL,
    supplier_room_id TEXT NOT NULL,
    
    match_confidence DECIMAL(3,2) DEFAULT 1.00,
    raw_data JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(supplier_code, supplier_room_id)
);

CREATE INDEX IF NOT EXISTS idx_room_supplier_refs_room ON room_supplier_references(canonical_room_id);

-- Migrate from room_supplier_mappings
INSERT INTO room_supplier_references (canonical_room_id, supplier_code, supplier_room_id, match_confidence, created_at)
SELECT 
    canonical_room_id,
    supplier_name AS supplier_code,
    supplier_room_id::text AS supplier_room_id,
    1.00 AS match_confidence,
    created_at
FROM room_supplier_mappings
WHERE canonical_room_id IS NOT NULL
ON CONFLICT (supplier_code, supplier_room_id) DO NOTHING;

-- ============================================================================
-- PHASE 12: ENHANCE AIRLINES TABLE
-- ============================================================================

DO $$
BEGIN
    -- Add short_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airlines' AND column_name = 'short_name') THEN
        ALTER TABLE airlines ADD COLUMN short_name TEXT;
    END IF;
    
    -- Add logo_symbol_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airlines' AND column_name = 'logo_symbol_url') THEN
        ALTER TABLE airlines ADD COLUMN logo_symbol_url TEXT;
    END IF;
    
    -- Add primary_color column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airlines' AND column_name = 'primary_color') THEN
        ALTER TABLE airlines ADD COLUMN primary_color VARCHAR(7);
    END IF;
    
    -- Add is_low_cost column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airlines' AND column_name = 'is_low_cost') THEN
        ALTER TABLE airlines ADD COLUMN is_low_cost BOOLEAN DEFAULT false;
    END IF;
    
    -- Add country_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airlines' AND column_name = 'country_code') THEN
        ALTER TABLE airlines ADD COLUMN country_code VARCHAR(3);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_airlines_alliance ON airlines(alliance);
CREATE INDEX IF NOT EXISTS idx_airlines_country_code ON airlines(country_code);

-- ============================================================================
-- PHASE 13: ENHANCE AIRCRAFT TABLE
-- ============================================================================

DO $$
BEGIN
    -- Rename table from aircraft to aircraft_types if needed
    -- For now, just add columns to existing aircraft table
    
    -- Add icao_code column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'icao_code') THEN
        ALTER TABLE aircraft ADD COLUMN icao_code VARCHAR(5);
    END IF;
    
    -- Add manufacturer column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'manufacturer') THEN
        ALTER TABLE aircraft ADD COLUMN manufacturer TEXT;
    END IF;
    
    -- Add model column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'model') THEN
        ALTER TABLE aircraft ADD COLUMN model TEXT;
    END IF;
    
    -- Add passenger_capacity column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'passenger_capacity') THEN
        ALTER TABLE aircraft ADD COLUMN passenger_capacity INTEGER;
    END IF;
    
    -- Add max_range_km column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'max_range_km') THEN
        ALTER TABLE aircraft ADD COLUMN max_range_km INTEGER;
    END IF;
    
    -- Add cruise_speed_kmh column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'cruise_speed_kmh') THEN
        ALTER TABLE aircraft ADD COLUMN cruise_speed_kmh INTEGER;
    END IF;
    
    -- Add category column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aircraft' AND column_name = 'category') THEN
        ALTER TABLE aircraft ADD COLUMN category VARCHAR(50);
    END IF;
END $$;

-- ============================================================================
-- PHASE 14: ENHANCE AIRPORTS TABLE
-- ============================================================================

DO $$
BEGIN
    -- Add short_name column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airports' AND column_name = 'short_name') THEN
        ALTER TABLE airports ADD COLUMN short_name TEXT;
    END IF;
    
    -- Add city_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airports' AND column_name = 'city_id') THEN
        ALTER TABLE airports ADD COLUMN city_id INTEGER;
    END IF;
    
    -- Add elevation_ft column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airports' AND column_name = 'elevation_ft') THEN
        ALTER TABLE airports ADD COLUMN elevation_ft INTEGER;
    END IF;
    
    -- Add airport_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airports' AND column_name = 'airport_type') THEN
        ALTER TABLE airports ADD COLUMN airport_type VARCHAR(50) DEFAULT 'large_airport';
    END IF;
    
    -- Add is_international column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'airports' AND column_name = 'is_international') THEN
        ALTER TABLE airports ADD COLUMN is_international BOOLEAN DEFAULT false;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_airports_city_id ON airports(city_id);

-- ============================================================================
-- PHASE 15: CREATE UNIFIED FLIGHT ROUTES TABLE
-- ============================================================================

-- Add source_suppliers column to flight_routes if not using amadeus tables
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'flight_routes') THEN
        -- Add columns to existing flight_routes
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_routes' AND column_name = 'source_suppliers') THEN
            ALTER TABLE flight_routes ADD COLUMN source_suppliers TEXT[];
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_routes' AND column_name = 'distance_km') THEN
            ALTER TABLE flight_routes ADD COLUMN distance_km INTEGER;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'flight_routes' AND column_name = 'typical_duration_minutes') THEN
            ALTER TABLE flight_routes ADD COLUMN typical_duration_minutes INTEGER;
        END IF;
    END IF;
END $$;

-- Migrate amadeus_flight_routes to canonical_flight_routes (keeping canonical as the main table)
INSERT INTO canonical_flight_routes (origin_iata, destination_iata, airline_iata, is_active, created_at, updated_at)
SELECT origin_iata, destination_iata, airline_iata, is_active, created_at, updated_at
FROM amadeus_flight_routes
ON CONFLICT (origin_iata, destination_iata, airline_iata) DO NOTHING;

-- ============================================================================
-- PHASE 16: UPDATE HOTEL TRANSLATIONS TABLE
-- ============================================================================

-- Add foreign key reference if not exists
DO $$
BEGIN
    -- Add canonical_hotel_id column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_translations' AND column_name = 'canonical_hotel_id') THEN
        ALTER TABLE hotel_translations ADD COLUMN canonical_hotel_id INTEGER;
    END IF;
    
    -- Add source_supplier column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_translations' AND column_name = 'source_supplier') THEN
        ALTER TABLE hotel_translations ADD COLUMN source_supplier VARCHAR(50);
    END IF;
    
    -- Add short_description column if not exists
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'hotel_translations' AND column_name = 'short_description') THEN
        ALTER TABLE hotel_translations ADD COLUMN short_description TEXT;
    END IF;
END $$;

-- Link hotel_translations to canonical_hotels via supplier mapping
UPDATE hotel_translations ht
SET canonical_hotel_id = hsr.canonical_hotel_id
FROM hotel_supplier_references hsr
WHERE hsr.supplier_hotel_id = ht.hotel_id::text
  AND hsr.supplier_code = 'GIATA'
  AND ht.canonical_hotel_id IS NULL;

-- ============================================================================
-- PHASE 17: CREATE SEARCH VECTOR FUNCTION AND TRIGGER
-- ============================================================================

-- Function to update search vector
CREATE OR REPLACE FUNCTION update_hotel_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector('english', COALESCE(NEW.name, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.city, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.country, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.address, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for search vector
DROP TRIGGER IF EXISTS trig_update_hotel_search_vector ON canonical_hotels;
CREATE TRIGGER trig_update_hotel_search_vector
    BEFORE INSERT OR UPDATE ON canonical_hotels
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_search_vector();

-- Update existing records with search vector
UPDATE canonical_hotels SET search_vector = 
    setweight(to_tsvector('english', COALESCE(name, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(city, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(country, '')), 'B') ||
    setweight(to_tsvector('english', COALESCE(address, '')), 'C') ||
    setweight(to_tsvector('english', COALESCE(description, '')), 'D')
WHERE search_vector IS NULL;

-- ============================================================================
-- PHASE 18: UPDATE TRIGGERS
-- ============================================================================

-- Trigger for hotel_supplier_references
CREATE OR REPLACE FUNCTION update_hotel_supplier_refs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hotel_supplier_refs_updated_at ON hotel_supplier_references;
CREATE TRIGGER update_hotel_supplier_refs_updated_at
    BEFORE UPDATE ON hotel_supplier_references
    FOR EACH ROW
    EXECUTE FUNCTION update_hotel_supplier_refs_updated_at();

-- Trigger for data_suppliers
DROP TRIGGER IF EXISTS update_data_suppliers_updated_at ON data_suppliers;
CREATE TRIGGER update_data_suppliers_updated_at
    BEFORE UPDATE ON data_suppliers
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for canonical_room_types
DROP TRIGGER IF EXISTS update_canonical_room_types_ts ON canonical_room_types;
CREATE TRIGGER update_canonical_room_types_ts
    BEFORE UPDATE ON canonical_room_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- PHASE 19: CALCULATE CONTENT SCORES
-- ============================================================================

-- Update content scores for canonical_hotels based on data completeness
UPDATE canonical_hotels SET content_score = (
    (CASE WHEN name IS NOT NULL AND name != '' THEN 10 ELSE 0 END) +
    (CASE WHEN address IS NOT NULL AND address != '' THEN 10 ELSE 0 END) +
    (CASE WHEN city IS NOT NULL AND city != '' THEN 10 ELSE 0 END) +
    (CASE WHEN country IS NOT NULL AND country != '' THEN 10 ELSE 0 END) +
    (CASE WHEN latitude IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN longitude IS NOT NULL THEN 10 ELSE 0 END) +
    (CASE WHEN star_rating IS NOT NULL AND star_rating > 0 THEN 10 ELSE 0 END) +
    (CASE WHEN description IS NOT NULL AND description != '' THEN 10 ELSE 0 END) +
    (CASE WHEN images IS NOT NULL AND images != '[]'::jsonb THEN 10 ELSE 0 END) +
    (CASE WHEN amenities IS NOT NULL AND amenities != '[]'::jsonb THEN 10 ELSE 0 END)
);

-- ============================================================================
-- MIGRATION COMPLETE
-- ============================================================================

-- Log completion
INSERT INTO data_imports (supplier_code, entity_type, total_records, created_records, updated_records, status, started_at, completed_at, triggered_by)
VALUES ('SYSTEM', 'schema_migration', 0, 0, 0, 'completed', NOW(), NOW(), 'migration_004');

-- Summary output
DO $$
DECLARE
    v_canonical_hotels INTEGER;
    v_supplier_refs INTEGER;
    v_amenities INTEGER;
    v_routes INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_canonical_hotels FROM canonical_hotels;
    SELECT COUNT(*) INTO v_supplier_refs FROM hotel_supplier_references;
    SELECT COUNT(*) INTO v_amenities FROM amenities;
    SELECT COUNT(*) INTO v_routes FROM canonical_flight_routes;
    
    RAISE NOTICE '=== Migration Summary ===';
    RAISE NOTICE 'Canonical Hotels: %', v_canonical_hotels;
    RAISE NOTICE 'Supplier References: %', v_supplier_refs;
    RAISE NOTICE 'Amenities: %', v_amenities;
    RAISE NOTICE 'Flight Routes: %', v_routes;
    RAISE NOTICE '========================';
END $$;
