-- Migration: Add flight.popular_routes table
-- Date: 2026-04-04
-- Purpose: Store airline route data from Jonty/airline-route-data repository

CREATE TABLE IF NOT EXISTS flight.popular_routes (
    id SERIAL PRIMARY KEY,
    origin_iata VARCHAR(3) NOT NULL,
    origin_name VARCHAR(255),
    origin_city VARCHAR(100),
    origin_country VARCHAR(100),
    destination_iata VARCHAR(3) NOT NULL,
    destination_name VARCHAR(255),
    destination_city VARCHAR(100),
    destination_country VARCHAR(100),
    carriers JSONB,
    flight_time_minutes INTEGER,
    distance_km INTEGER,
    route_popularity INTEGER,
    is_middle_east BOOLEAN DEFAULT FALSE,
    origin_region VARCHAR(100),
    destination_region VARCHAR(100),
    origin_continent VARCHAR(100),
    destination_continent VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_route UNIQUE (origin_iata, destination_iata)
);

CREATE INDEX IF NOT EXISTS idx_routes_origin ON flight.popular_routes(origin_iata);
CREATE INDEX IF NOT EXISTS idx_routes_destination ON flight.popular_routes(destination_iata);
CREATE INDEX IF NOT EXISTS idx_routes_popularity ON flight.popular_routes(route_popularity DESC);
CREATE INDEX IF NOT EXISTS idx_routes_middle_east ON flight.popular_routes(is_middle_east) WHERE is_middle_east = TRUE;
