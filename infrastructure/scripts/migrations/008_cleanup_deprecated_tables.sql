-- Final Cleanup of Deprecated Static Data Tables
-- Version: 1.0

DO $$
BEGIN
    RAISE NOTICE '🚀 Starting final cleanup of deprecated tables...';

    -- 1. Drop Hotel-related legacy tables
    -- Note: We already migrated data to canonical_hotels, hotel_supplier_references, hotel_images, hotel_amenity_instances
    DROP TABLE IF EXISTS hotel_supplier_mappings CASCADE;
    DROP TABLE IF EXISTS room_supplier_mappings CASCADE;
    DROP TABLE IF EXISTS hotel_facilities CASCADE;
    DROP TABLE IF EXISTS hotels CASCADE;

    RAISE NOTICE '✅ Hotel legacy tables removed.';

    -- 2. Drop Flight-related legacy tables
    -- Note: We already migrated data to flight_routes
    DROP TABLE IF EXISTS amadeus_flight_routes CASCADE;
    DROP TABLE IF EXISTS canonical_flight_routes CASCADE;
    DROP TABLE IF EXISTS flight_route_mappings CASCADE;

    RAISE NOTICE '✅ Flight legacy tables removed.';

    -- 3. Drop Hotelston-specific reference tables (if any remain)
    DROP TABLE IF EXISTS hotelston_countries CASCADE;
    DROP TABLE IF EXISTS hotelston_cities CASCADE;
    DROP TABLE IF EXISTS hotelston_hotel_chains CASCADE;
    DROP TABLE IF EXISTS hotelston_hotel_facilities CASCADE;
    DROP TABLE IF EXISTS hotelston_hotel_types CASCADE;

    RAISE NOTICE '✅ Hotelston reference tables removed.';

END $$;
