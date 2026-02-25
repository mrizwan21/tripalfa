-- ============================================================
-- 006_views.sql
-- Convenience views that denormalise common query patterns
-- so application code doesn't need multi-way joins.
-- ============================================================

-- ------------------------------------------------------------
-- v_hotels_summary
-- Flat view combining hotel + chain/type name + currency + country
-- Used by hotel listing / search results pages
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW hotel.v_hotels_summary AS
SELECT
    h.id,
    h.name,
    h.stars,
    h.rating,
    h.review_count,
    h.city,
    h.address,
    h.zip,
    h.latitude,
    h.longitude,
    h.country_code,
    c.name                    AS country_name,
    h.currency_code,
    cur.name                  AS currency_name,
    cur.rate_vs_usd,
    cur.decimal_precision     AS currency_decimals,
    ht.name                   AS hotel_type,
    hc.name                   AS chain_name,
    h.main_photo,
    h.thumbnail,
    h.nearest_airport_code,
    ia.name                   AS nearest_airport_name,
    h.parking_available,
    h.children_allowed,
    h.pets_allowed,
    h.checkin_start,
    h.checkin_end,
    h.checkout,
    h.semantic_tags,
    h.semantic_persona,
    h.semantic_style,
    h.semantic_location_type,
    h.last_synced_at
FROM   hotel.hotels h
LEFT   JOIN shared.countries   c   ON c.code   = h.country_code
LEFT   JOIN shared.currencies  cur ON cur.code  = h.currency_code
LEFT   JOIN hotel.types        ht  ON ht.id     = h.hotel_type_id
LEFT   JOIN hotel.chains       hc  ON hc.id     = h.chain_id
LEFT   JOIN hotel.iata_airports ia ON ia.code   = h.nearest_airport_code
WHERE  h.is_deleted = FALSE;

COMMENT ON VIEW hotel.v_hotels_summary IS 'Denormalised hotel listing view — joins chain, type, currency, country names';

-- ------------------------------------------------------------
-- v_hotels_with_facilities
-- Aggregates facility IDs + names into arrays on one row per hotel
-- Useful for UI filter chips and hotel card badge rendering
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW hotel.v_hotels_with_facilities AS
SELECT
    h.id,
    h.name,
    h.stars,
    h.rating,
    h.city,
    h.country_code,
    ARRAY_AGG(f.id   ORDER BY f.id) FILTER (WHERE f.id IS NOT NULL) AS facility_ids,
    ARRAY_AGG(f.name ORDER BY f.id) FILTER (WHERE f.id IS NOT NULL) AS facility_names
FROM   hotel.hotels h
LEFT   JOIN hotel.hotel_facility_map hfm ON hfm.hotel_id    = h.id
LEFT   JOIN hotel.facilities         f   ON f.id            = hfm.facility_id
WHERE  h.is_deleted = FALSE
GROUP  BY h.id, h.name, h.stars, h.rating, h.city, h.country_code;

COMMENT ON VIEW hotel.v_hotels_with_facilities IS 'Hotel rows with facility IDs and names aggregated into arrays';

-- ------------------------------------------------------------
-- v_hotel_rooms_full
-- Room detail with bed types and amenities aggregated
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW hotel.v_hotel_rooms_full AS
SELECT
    r.id               AS room_id,
    r.hotel_id,
    r.room_name,
    r.description,
    r.size_sqm,
    r.size_unit,
    r.max_adults,
    r.max_children,
    r.max_occupancy,
    -- Bed types as JSON array
    COALESCE(
        JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
                'bedType', rbt.bed_type,
                'bedSize', rbt.bed_size,
                'quantity', rbt.quantity
            )
        ) FILTER (WHERE rbt.id IS NOT NULL),
        '[]'::JSON
    ) AS bed_types,
    -- Amenities as JSON array
    COALESCE(
        JSON_AGG(
            DISTINCT JSONB_BUILD_OBJECT(
                'amenityId', ra.amenity_id,
                'name',      ra.name,
                'sortOrder', ram.sort_order
            )
        ) FILTER (WHERE ra.amenity_id IS NOT NULL),
        '[]'::JSON
    ) AS amenities
FROM   hotel.rooms r
LEFT   JOIN hotel.room_bed_types   rbt ON rbt.room_id   = r.id
LEFT   JOIN hotel.room_amenity_map ram ON ram.room_id   = r.id
LEFT   JOIN hotel.room_amenities   ra  ON ra.amenity_id = ram.amenity_id
GROUP  BY r.id, r.hotel_id, r.room_name, r.description,
          r.size_sqm, r.size_unit, r.max_adults, r.max_children, r.max_occupancy;

COMMENT ON VIEW hotel.v_hotel_rooms_full IS 'Room detail view with bed types and amenities aggregated as JSON';

-- ------------------------------------------------------------
-- v_airports_full
-- Duffel airports joined with city and country names
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW flight.v_airports_full AS
SELECT
    ap.id,
    ap.iata_code,
    ap.icao_code,
    ap.name              AS airport_name,
    ap.city_name,
    ap.iata_city_code,
    c.iata_code          AS city_iata,
    c.name               AS city_name_official,
    ap.iata_country_code,
    co.name              AS country_name,
    ap.latitude,
    ap.longitude,
    ap.time_zone
FROM   flight.airports ap
LEFT   JOIN flight.cities   c  ON c.id   = ap.city_id
LEFT   JOIN shared.countries co ON co.code = ap.iata_country_code;

COMMENT ON VIEW flight.v_airports_full IS 'Airport details joined with Duffel city and shared country tables';

-- ------------------------------------------------------------
-- v_currencies_with_rate
-- Currencies with formatted rate and country list
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW shared.v_currencies_with_rate AS
SELECT
    cur.code,
    cur.name,
    cur.decimal_precision,
    cur.rate_vs_usd,
    cur.rate_updated_at,
    COALESCE(
        ARRAY_AGG(co.name ORDER BY co.name) FILTER (WHERE co.name IS NOT NULL),
        '{}'::TEXT[]
    ) AS countries
FROM   shared.currencies cur
LEFT   JOIN shared.currency_countries cc ON cc.currency_code = cur.code
LEFT   JOIN shared.countries          co ON co.code          = cc.country_code
GROUP  BY cur.code, cur.name, cur.decimal_precision, cur.rate_vs_usd, cur.rate_updated_at;

COMMENT ON VIEW shared.v_currencies_with_rate IS 'Currencies with exchange rate and aggregated country list';
