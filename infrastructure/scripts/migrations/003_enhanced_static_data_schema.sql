-- Enhanced Static Data Schema Migration
-- Adds proper normalization and relationships for static data management

-- Drop the generic static_data table if it exists
DROP TABLE IF EXISTS static_data;

-- Enhanced Airports table with better relationships
CREATE TABLE airports (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    icao_code VARCHAR(4),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enhanced Airlines table
CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(2) UNIQUE NOT NULL,
    icao_code VARCHAR(3),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    logo_url TEXT,
    website VARCHAR(255),
    alliance VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Countries table
CREATE TABLE countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    iso_code VARCHAR(2),
    continent VARCHAR(50),
    currency VARCHAR(3),
    phone_code VARCHAR(10),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Cities table with proper relationships
CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    country_name VARCHAR(255) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population BIGINT,
    timezone VARCHAR(50),
    is_popular BOOLEAN DEFAULT false,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (country_code) REFERENCES countries(code)
);

-- Currencies table
CREATE TABLE currencies (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    symbol VARCHAR(5),
    decimal_places INTEGER DEFAULT 2,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Chains table
CREATE TABLE hotel_chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) UNIQUE NOT NULL,
    code VARCHAR(10) UNIQUE,
    website VARCHAR(255),
    logo_url TEXT,
    country VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Facilities table
CREATE TABLE hotel_facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    description TEXT,
    is_common BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Hotel Types table
CREATE TABLE hotel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Loyalty Programs table
CREATE TABLE loyalty_programs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(20) UNIQUE NOT NULL,
    airline_id INTEGER,
    logo_url TEXT,
    logo_symbol_url TEXT,
    alliance VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    FOREIGN KEY (airline_id) REFERENCES airlines(id)
);

-- Hotelston-specific tables
CREATE TABLE hotelston_countries (
    id SERIAL PRIMARY KEY,
    code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hotelston_cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    country_code VARCHAR(3) NOT NULL,
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    population BIGINT,
    timezone VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hotelston_hotel_chains (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(10),
    website VARCHAR(255),
    logo_url TEXT,
    country VARCHAR(255),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hotelston_hotel_facilities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE hotelston_hotel_types (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Data import tracking table
CREATE TABLE data_imports (
    id SERIAL PRIMARY KEY,
    source VARCHAR(50) NOT NULL, -- 'innstant', 'duffel', 'hotelston'
    entity_type VARCHAR(50) NOT NULL, -- 'airports', 'airlines', etc.
    total_records INTEGER NOT NULL,
    imported_records INTEGER NOT NULL,
    failed_records INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'completed', -- 'pending', 'running', 'completed', 'failed'
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    error_details TEXT,
    metadata JSONB
);

-- Data source configuration table
CREATE TABLE data_sources (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL, -- 'api', 'file', 'manual'
    endpoint VARCHAR(500),
    api_key VARCHAR(500),
    is_active BOOLEAN DEFAULT true,
    last_sync_at TIMESTAMPTZ,
    sync_interval_minutes INTEGER DEFAULT 1440, -- 24 hours default
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_airports_iata_code ON airports(iata_code);
CREATE INDEX idx_airports_country_code ON airports(country_code);
CREATE INDEX idx_airports_city ON airports(city);

CREATE INDEX idx_airlines_iata_code ON airlines(iata_code);
CREATE INDEX idx_airlines_country ON airlines(country);
CREATE INDEX idx_airlines_alliance ON airlines(alliance);

CREATE INDEX idx_countries_code ON countries(code);
CREATE INDEX idx_countries_name ON countries(name);

CREATE INDEX idx_cities_country_code ON cities(country_code);
CREATE INDEX idx_cities_name ON cities(name);
CREATE INDEX idx_cities_popular ON cities(is_popular);

CREATE INDEX idx_currencies_code ON currencies(code);

CREATE INDEX idx_hotel_chains_name ON hotel_chains(name);
CREATE INDEX idx_hotel_chains_code ON hotel_chains(code);

CREATE INDEX idx_hotel_facilities_name ON hotel_facilities(name);
CREATE INDEX idx_hotel_facilities_category ON hotel_facilities(category);

CREATE INDEX idx_hotel_types_name ON hotel_types(name);

CREATE INDEX idx_loyalty_programs_code ON loyalty_programs(code);
CREATE INDEX idx_loyalty_programs_airline_id ON loyalty_programs(airline_id);

CREATE INDEX idx_data_imports_source ON data_imports(source);
CREATE INDEX idx_data_imports_entity_type ON data_imports(entity_type);
CREATE INDEX idx_data_imports_status ON data_imports(status);
CREATE INDEX idx_data_imports_started_at ON data_imports(started_at);

CREATE INDEX idx_data_sources_name ON data_sources(name);
CREATE INDEX idx_data_sources_active ON data_sources(is_active);

-- Triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_airports_updated_at BEFORE UPDATE ON airports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_airlines_updated_at BEFORE UPDATE ON airlines FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_countries_updated_at BEFORE UPDATE ON countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_cities_updated_at BEFORE UPDATE ON cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_currencies_updated_at BEFORE UPDATE ON currencies FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotel_chains_updated_at BEFORE UPDATE ON hotel_chains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotel_facilities_updated_at BEFORE UPDATE ON hotel_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotel_types_updated_at BEFORE UPDATE ON hotel_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_loyalty_programs_updated_at BEFORE UPDATE ON loyalty_programs FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotelston_countries_updated_at BEFORE UPDATE ON hotelston_countries FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotelston_cities_updated_at BEFORE UPDATE ON hotelston_cities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotelston_hotel_chains_updated_at BEFORE UPDATE ON hotelston_hotel_chains FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotelston_hotel_facilities_updated_at BEFORE UPDATE ON hotelston_hotel_facilities FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_hotelston_hotel_types_updated_at BEFORE UPDATE ON hotelston_hotel_types FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_data_sources_updated_at BEFORE UPDATE ON data_sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();