-- Create Static Database and Tables
-- Usage:
-- 1. Create the database (requires superuser):
--    psql -U postgres -c "CREATE DATABASE staticdatabase;"
-- 2. Run this script against the `staticdatabase`:
--    psql -d staticdatabase -f scripts/create_static_database.sql

-- NOTE: Some environments (managed Postgres) do not allow CREATE DATABASE
-- from a client script. If you cannot create the database here, create it
-- using your provider console or psql as a superuser, then run this file
-- connected to the staticdatabase.

-- ===== Static Reference Tables =====

-- Airports
CREATE TABLE IF NOT EXISTS airports (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(10) UNIQUE NOT NULL,
    icao_code VARCHAR(10),
    name TEXT NOT NULL,
    city TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cities
CREATE TABLE IF NOT EXISTS cities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    country TEXT NOT NULL,
    country_code VARCHAR(10),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    population BIGINT,
    timezone TEXT,
    is_popular BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Airlines
CREATE TABLE IF NOT EXISTS airlines (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(10) UNIQUE NOT NULL,
    icao_code VARCHAR(10),
    name TEXT NOT NULL,
    country TEXT,
    logo_url TEXT,
    website TEXT,
    alliance TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Loyalty Programs (airline frequent-flyer programs)
CREATE TABLE IF NOT EXISTS loyalty_programs (
    id SERIAL PRIMARY KEY,
    code VARCHAR(128) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    airline_id INTEGER REFERENCES airlines(id),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Languages
CREATE TABLE IF NOT EXISTS languages (
    code VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Countries (basic)
CREATE TABLE IF NOT EXISTS countries (
    code VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    region TEXT,
    iso3 VARCHAR(10),
    numeric_code VARCHAR(10),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Currencies (basic)
CREATE TABLE IF NOT EXISTS currencies (
    code VARCHAR(10) PRIMARY KEY,
    name TEXT NOT NULL,
    symbol TEXT,
    decimal_digits INT DEFAULT 2,
    rounding INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotel Facilities (Amenities)
CREATE TABLE IF NOT EXISTS hotel_facilities (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    code VARCHAR(50),
    category VARCHAR(50) DEFAULT 'General',
    applies_to VARCHAR(20) DEFAULT 'both',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotel Types
CREATE TABLE IF NOT EXISTS hotel_types (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotel Chains
CREATE TABLE IF NOT EXISTS hotel_chains (
    id SERIAL PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotels
CREATE TABLE IF NOT EXISTS hotels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    star_rating NUMERIC(2,1) DEFAULT 0,
    city TEXT,
    country_code VARCHAR(2),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    address TEXT,
    postal_code VARCHAR(20),
    primary_source VARCHAR(50) DEFAULT 'liteapi',
    is_active BOOLEAN DEFAULT true,
    has_wifi BOOLEAN DEFAULT false,
    has_pool BOOLEAN DEFAULT false,
    has_spa BOOLEAN DEFAULT false,
    has_parking BOOLEAN DEFAULT false,
    has_restaurant BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotel Supplier References
CREATE TABLE IF NOT EXISTS hotel_supplier_refs (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id),
    supplier_code VARCHAR(50) NOT NULL,
    supplier_hotel_id TEXT NOT NULL,
    match_confidence DECIMAL(3,2) DEFAULT 1.0,
    match_method VARCHAR(50) DEFAULT 'direct_id',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(supplier_code, supplier_hotel_id)
);

-- Hotel Reviews Summary
CREATE TABLE IF NOT EXISTS hotel_reviews_summaries (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) UNIQUE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0,
    rating_breakdown JSONB,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Exchange Rate Snapshots
CREATE TABLE IF NOT EXISTS exchange_rate_snapshots (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL,
    base_currency VARCHAR(10) NOT NULL,
    rates JSONB NOT NULL,
    fetched_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Flight Routes
CREATE TABLE IF NOT EXISTS amadeus_flight_routes (
    id SERIAL PRIMARY KEY,
    origin_iata VARCHAR(10) NOT NULL,
    destination_iata VARCHAR(10) NOT NULL,
    airline_iata VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(origin_iata, destination_iata, airline_iata)
);

-- Flight Inspirations
CREATE TABLE IF NOT EXISTS amadeus_flight_inspirations (
    id SERIAL PRIMARY KEY,
    origin VARCHAR(10) NOT NULL,
    destination VARCHAR(10) NOT NULL,
    departure_date DATE,
    return_date DATE,
    price_amount DECIMAL(12,2),
    price_currency VARCHAR(10),
    source VARCHAR(50) DEFAULT 'amadeus',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Canonical Hotels (Merged/De-duplicated)
CREATE TABLE IF NOT EXISTS canonical_hotels (
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    city TEXT,
    country TEXT,
    star_rating NUMERIC(2,1),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    amenities JSONB,
    images JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Hotel Supplier Mappings
CREATE TABLE IF NOT EXISTS hotel_supplier_mappings (
    canonical_hotel_id INTEGER REFERENCES canonical_hotels(id),
    supplier_hotel_id INTEGER REFERENCES hotels(id),
    supplier_name VARCHAR(50) NOT NULL,
    supplier_external_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (canonical_hotel_id, supplier_hotel_id)
);

-- Canonical Room Types
CREATE TABLE IF NOT EXISTS canonical_room_types (
    id SERIAL PRIMARY KEY,
    canonical_hotel_id INTEGER REFERENCES canonical_hotels(id),
    name TEXT NOT NULL,
    description TEXT,
    max_occupancy INTEGER,
    amenities JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Room Supplier Mappings
CREATE TABLE IF NOT EXISTS room_supplier_mappings (
    canonical_room_id INTEGER REFERENCES canonical_room_types(id),
    supplier_room_id INTEGER REFERENCES hotel_room_types(id),
    supplier_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (canonical_room_id, supplier_room_id)
);

-- Canonical Flight Routes
CREATE TABLE IF NOT EXISTS canonical_flight_routes (
    id SERIAL PRIMARY KEY,
    origin_iata VARCHAR(10) NOT NULL,
    destination_iata VARCHAR(10) NOT NULL,
    airline_iata VARCHAR(10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(origin_iata, destination_iata, airline_iata)
);

-- Flight Route Mappings
CREATE TABLE IF NOT EXISTS flight_route_mappings (
    canonical_route_id INTEGER REFERENCES canonical_flight_routes(id),
    supplier_route_id INTEGER, -- Points to amadeus_flight_routes or eventually a duffel table
    supplier_name VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (canonical_route_id, supplier_route_id, supplier_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_airports_iata ON airports(iata_code);
CREATE INDEX IF NOT EXISTS idx_airports_country_code ON airports(country_code);
CREATE INDEX IF NOT EXISTS idx_cities_country_code ON cities(country_code);
CREATE INDEX IF NOT EXISTS idx_airlines_iata ON airlines(iata_code);

-- Reusable trigger to update `updated_at`
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Attach triggers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_airports_updated_at'
    ) THEN
        CREATE TRIGGER update_airports_updated_at
        BEFORE UPDATE ON airports
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_cities_updated_at'
    ) THEN
        CREATE TRIGGER update_cities_updated_at
        BEFORE UPDATE ON cities
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_airlines_updated_at'
    ) THEN
        CREATE TRIGGER update_airlines_updated_at
        BEFORE UPDATE ON airlines
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_countries_updated_at'
    ) THEN
        CREATE TRIGGER update_countries_updated_at
        BEFORE UPDATE ON countries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_currencies_updated_at'
    ) THEN
        CREATE TRIGGER update_currencies_updated_at
        BEFORE UPDATE ON currencies
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_exchange_rate_snapshots_updated_at'
    ) THEN
        CREATE TRIGGER update_exchange_rate_snapshots_updated_at
        BEFORE UPDATE ON exchange_rate_snapshots
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_amadeus_flight_routes_updated_at'
    ) THEN
        CREATE TRIGGER update_amadeus_flight_routes_updated_at
        BEFORE UPDATE ON amadeus_flight_routes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_amadeus_flight_inspirations_updated_at'
    ) THEN
        CREATE TRIGGER update_amadeus_flight_inspirations_updated_at
        BEFORE UPDATE ON amadeus_flight_inspirations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_canonical_hotels_updated_at'
    ) THEN
        CREATE TRIGGER update_canonical_hotels_updated_at
        BEFORE UPDATE ON canonical_hotels
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_canonical_room_types_updated_at'
    ) THEN
        CREATE TRIGGER update_canonical_room_types_updated_at
        BEFORE UPDATE ON canonical_room_types
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_canonical_flight_routes_updated_at'
    ) THEN
        CREATE TRIGGER update_canonical_flight_routes_updated_at
        BEFORE UPDATE ON canonical_flight_routes
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_hotel_facilities_updated_at'
    ) THEN
        CREATE TRIGGER update_hotel_facilities_updated_at
        BEFORE UPDATE ON hotel_facilities
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_hotel_types_updated_at'
    ) THEN
        CREATE TRIGGER update_hotel_types_updated_at
        BEFORE UPDATE ON hotel_types
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_hotel_chains_updated_at'
    ) THEN
        CREATE TRIGGER update_hotel_chains_updated_at
        BEFORE UPDATE ON hotel_chains
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_hotels_updated_at'
    ) THEN
        CREATE TRIGGER update_hotels_updated_at
        BEFORE UPDATE ON hotels
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger t
        JOIN pg_class c ON t.tgrelid = c.oid
        WHERE t.tgname = 'update_hotel_reviews_summaries_updated_at'
    ) THEN
        CREATE TRIGGER update_hotel_reviews_summaries_updated_at
        BEFORE UPDATE ON hotel_reviews_summaries
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END;
$$;

-- Helpful note for Prisma users:
-- If you want Prisma models to point to this separate database, add a new
-- `datasource` in `database/prisma/schema.prisma` with a different env var
-- (e.g., `STATIC_DATABASE_URL`) or manage it from a different Prisma
-- project folder. Alternatively run Prisma migrations directly against
-- `staticdatabase` (recommended for schema evolution).

-- End of script
