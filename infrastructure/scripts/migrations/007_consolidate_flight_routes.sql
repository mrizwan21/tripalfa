-- Consolidate Flight Routes into a single unified table (v1.1)
-- Handles market pairs (no airline) and airline-specific routes

-- 1. Relax constraints on flight_routes
ALTER TABLE flight_routes 
ALTER COLUMN airline_id DROP NOT NULL,
ALTER COLUMN flight_number DROP NOT NULL,
ALTER COLUMN departure_time DROP NOT NULL,
ALTER COLUMN arrival_time DROP NOT NULL,
ALTER COLUMN duration_minutes DROP NOT NULL,
ALTER COLUMN updated_at SET DEFAULT NOW();

-- 2. Clean up old constraints
ALTER TABLE flight_routes DROP CONSTRAINT IF EXISTS flight_routes_airline_id_flight_number_origin_airport_id_de_key;
ALTER TABLE flight_routes DROP CONSTRAINT IF EXISTS flight_routes_static_unique;

-- 3. Add proper unique constraints for both cases
-- Case A: Airline-specific route
CREATE UNIQUE INDEX IF NOT EXISTS idx_flight_routes_airline_unique 
ON flight_routes (origin_airport_id, destination_airport_id, airline_id) 
WHERE airline_id IS NOT NULL;

-- Case B: Market pair (generic connection)
CREATE UNIQUE INDEX IF NOT EXISTS idx_flight_routes_market_unique 
ON flight_routes (origin_airport_id, destination_airport_id) 
WHERE airline_id IS NULL;

DO $$
BEGIN
    RAISE NOTICE '🚀 Consolidating flight routes (Market Pairs + Airline Routes)...';

    -- 4. Migrate from canonical_flight_routes (3403 records)
    INSERT INTO flight_routes (
        origin_airport_id, 
        destination_airport_id, 
        airline_id, 
        is_active, 
        source_suppliers,
        updated_at
    )
    SELECT 
        o.id as origin_airport_id,
        d.id as destination_airport_id,
        a.id as airline_id,
        cfr.is_active,
        ARRAY['GIATA_CANONICAL']::text[] as source_suppliers,
        cfr.updated_at
    FROM 
        canonical_flight_routes cfr
    JOIN airports o ON o.iata_code = cfr.origin_iata
    JOIN airports d ON d.iata_code = cfr.destination_iata
    LEFT JOIN airlines a ON a.iata_code = NULLIF(cfr.airline_iata, '')
    ON CONFLICT DO NOTHING; -- Conflict handling with multiple partial indexes is tricky in one statement

    RAISE NOTICE '✅ Canonical routes migrated.';

    -- 5. Migrate from amadeus_flight_routes (1953 records)
    INSERT INTO flight_routes (
        origin_airport_id, 
        destination_airport_id, 
        airline_id, 
        is_active, 
        source_suppliers,
        updated_at
    )
    SELECT 
        o.id as origin_airport_id,
        d.id as destination_airport_id,
        a.id as airline_id,
        afr.is_active,
        ARRAY['AMADEUS']::text[] as source_suppliers,
        afr.updated_at
    FROM 
        amadeus_flight_routes afr
    JOIN airports o ON o.iata_code = afr.origin_iata
    JOIN airports d ON d.iata_code = afr.destination_iata
    LEFT JOIN airlines a ON a.iata_code = NULLIF(afr.airline_iata, '')
    ON CONFLICT DO NOTHING;

    RAISE NOTICE '✅ Amadeus routes migrated.';

END $$;

-- 6. Summary
DO $$
DECLARE
    v_total INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_total FROM flight_routes;
    RAISE NOTICE '=== Flight Route Consolidation Summary ===';
    RAISE NOTICE 'Total Unified Routes: %', v_total;
    RAISE NOTICE '==========================================';
END $$;
