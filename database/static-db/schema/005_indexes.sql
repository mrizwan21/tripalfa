-- ============================================================
-- 005_indexes.sql
-- Performance-optimised indexes covering all common query
-- patterns: geographic search, text search, FK lookups,
-- filter combos used by hotel & flight booking UI.
-- ============================================================

-- ==============  SHARED  ====================================

-- Country name text search
CREATE INDEX idx_countries_name_trgm ON shared.countries USING GIN (name gin_trgm_ops);

-- Currency lookup by code (already PK — extra trgm for autocomplete)
CREATE INDEX idx_currencies_name_trgm ON shared.currencies USING GIN (name gin_trgm_ops);

-- Language lookup
CREATE INDEX idx_languages_code_name ON shared.languages (code, name);

-- ==============  HOTEL DOMAIN  ==============================

-- Hotels: geographic bounding-box queries (most common search pattern)
CREATE INDEX idx_hotels_lat_lng    ON hotel.hotels (latitude, longitude)
    WHERE is_deleted = FALSE;

-- Hotels: country + city filter (dropdown search)
CREATE INDEX idx_hotels_country_city ON hotel.hotels (country_code, city)
    WHERE is_deleted = FALSE;

-- Hotels: star + rating filter
CREATE INDEX idx_hotels_stars_rating ON hotel.hotels (stars, rating)
    WHERE is_deleted = FALSE;

-- Hotels: facilities quick-filter (already a joined table, but hotel-level array coverage)
CREATE INDEX idx_hotels_chain_type ON hotel.hotels (chain_id, hotel_type_id)
    WHERE is_deleted = FALSE;

-- Hotels: nearest airport lookup
CREATE INDEX idx_hotels_airport ON hotel.hotels (nearest_airport_code)
    WHERE nearest_airport_code IS NOT NULL;

-- Hotels: soft-delete filter (cover index for listing active hotels)
CREATE INDEX idx_hotels_active ON hotel.hotels (id)
    WHERE is_deleted = FALSE;

-- Hotels: text search on name
CREATE INDEX idx_hotels_name_trgm ON hotel.hotels USING GIN (name gin_trgm_ops)
    WHERE is_deleted = FALSE;

-- Hotels: last-synced for incremental updates
CREATE INDEX idx_hotels_last_synced ON hotel.hotels (last_synced_at);

-- Hotel images: lookup by hotel
CREATE INDEX idx_hotel_images_hotel ON hotel.images (hotel_id, is_default);

-- Hotel facility map: facility→hotels (reverse lookup)
CREATE INDEX idx_hfm_facility ON hotel.hotel_facility_map (facility_id);

-- Hotel rooms: lookup by hotel
CREATE INDEX idx_rooms_hotel ON hotel.rooms (hotel_id);

-- Room bed types: lookup by room
CREATE INDEX idx_rbt_room ON hotel.room_bed_types (room_id);

-- Room amenity map: amenity→rooms reverse lookup
CREATE INDEX idx_ram_amenity ON hotel.room_amenity_map (amenity_id);

-- Room photos: lookup by room
CREATE INDEX idx_room_photos_room ON hotel.room_photos (room_id, is_main);

-- Hotel policies: type filter
CREATE INDEX idx_policies_hotel_type ON hotel.policies (hotel_id, policy_type);

-- Hotel reviews: hotel + date (timeline query)
CREATE INDEX idx_reviews_hotel_date ON hotel.reviews (hotel_id, review_date DESC);

-- Hotel reviews: by source
CREATE INDEX idx_reviews_source ON hotel.reviews (source, hotel_id);

-- Hotel cities: city name text search
CREATE INDEX idx_hotel_cities_name_trgm ON hotel.cities USING GIN (city_name gin_trgm_ops);

-- IATA airports: geo lookup
CREATE INDEX idx_iata_airports_geo ON hotel.iata_airports (latitude, longitude);
CREATE INDEX idx_iata_airports_country ON hotel.iata_airports (country_code);

-- ==============  FLIGHT DOMAIN  =============================

-- Airlines: IATA code (unique index already exists, add trgm)
CREATE INDEX idx_airlines_name_trgm ON flight.airlines USING GIN (name gin_trgm_ops);

-- Aircraft: name text search
CREATE INDEX idx_aircraft_name_trgm ON flight.aircraft USING GIN (name gin_trgm_ops);

-- Duffel cities: country filter
CREATE INDEX idx_duffel_cities_country ON flight.cities (iata_country_code);
CREATE INDEX idx_duffel_cities_name_trgm ON flight.cities USING GIN (name gin_trgm_ops);

-- Airports: country + city index
CREATE INDEX idx_airports_country ON flight.airports (iata_country_code);
CREATE INDEX idx_airports_city    ON flight.airports (city_id);
CREATE INDEX idx_airports_geo     ON flight.airports (latitude, longitude);
CREATE INDEX idx_airports_name_trgm ON flight.airports USING GIN (name gin_trgm_ops);
CREATE INDEX idx_airports_tz      ON flight.airports (time_zone);

-- Loyalty programmes: airline → programmes
CREATE INDEX idx_loyalty_airline ON flight.loyalty_programmes (owner_airline_id);

-- ==============  COMPOSITE / COVERING  ======================

-- Common hotel search: "hotels in US with >=4 stars rated >=8"
CREATE INDEX idx_hotels_search_cover ON hotel.hotels (country_code, stars, rating, id, name)
    WHERE is_deleted = FALSE;

-- Common flight search: airport autocomplete by country
CREATE INDEX idx_airports_country_iata ON flight.airports (iata_country_code, iata_code, name);
