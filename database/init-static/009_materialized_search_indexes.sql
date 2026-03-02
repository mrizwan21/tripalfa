-- ============================================================
-- 009_materialized_search_indexes.sql
-- Vector indexes for semantic search and materialized view
-- for ultra-fast single-row API responses.
-- ============================================================

-- ==============  VECTOR INDEXES (IVFFlat)  ==============

-- IVFFlat index for semantic embedding (KNN search)
-- Lists parameter: sqrt(number_of_rows) is a good starting point
-- For 100K hotels: sqrt(100000) ≈ 316
-- Adjust lists based on your dataset size
CREATE INDEX idx_hotels_semantic_embedding 
ON hotel.hotels 
USING ivfflat (semantic_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE semantic_embedding IS NOT NULL AND is_deleted = FALSE;

-- IVFFlat index for visual embedding (image similarity search)
CREATE INDEX idx_hotels_visual_embedding 
ON hotel.hotels 
USING ivfflat (visual_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE visual_embedding IS NOT NULL AND is_deleted = FALSE;

-- HNSW index (alternative, better for high accuracy at scale)
-- Uncomment if you prefer HNSW over IVFFlat
-- CREATE INDEX idx_hotels_semantic_hnsw 
-- ON hotel.hotels 
-- USING hnsw (semantic_embedding vector_cosine_ops)
-- WITH (m = 16, ef_construction = 64)
-- WHERE semantic_embedding IS NOT NULL AND is_deleted = FALSE;

-- Indexes for hotel_embeddings table (if using separate table)
CREATE INDEX idx_embeddings_text 
ON hotel.embeddings 
USING ivfflat (text_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE text_embedding IS NOT NULL;

CREATE INDEX idx_embeddings_visual 
ON hotel.embeddings 
USING ivfflat (visual_embedding vector_cosine_ops)
WITH (lists = 100)
WHERE visual_embedding IS NOT NULL;

-- ==============  POSTGIS GEO INDEXES  ==============

-- GiST index for PostGIS geography (if we add geography column later)
-- ALTER TABLE hotel.hotels ADD COLUMN geo_point GEOGRAPHY(POINT, 4326);
-- CREATE INDEX idx_hotels_geo_point ON hotel.hotels USING GIST (geo_point);

-- For now, use functional index for common geo queries
CREATE INDEX idx_hotels_geo_covering 
ON hotel.hotels (latitude, longitude, id, name, stars, rating)
WHERE is_deleted = FALSE AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- GiST index for places GeoJSON boundary (polygon search)
CREATE INDEX idx_places_geojson ON hotel.places USING GIST (geojson::jsonb_path_ops) WHERE geojson IS NOT NULL;

-- ==============  JSONB FILTER INDEXES  ==============

-- GIN index for accessibility attributes filtering
CREATE INDEX idx_hotels_accessibility 
ON hotel.hotels 
USING GIN (accessibility_attributes) 
WHERE accessibility_attributes IS NOT NULL;

-- GIN index for semantic tags filtering
CREATE INDEX idx_hotels_semantic_tags 
ON hotel.hotels 
USING GIN (semantic_tags) 
WHERE semantic_tags IS NOT NULL;

-- GIN index for checkin instructions
CREATE INDEX idx_hotels_checkin 
ON hotel.hotels 
USING GIN (checkin_instructions) 
WHERE checkin_instructions IS NOT NULL;

-- ==============  ROOM SEARCH INDEXES  ==============

-- Index for room search queries
CREATE INDEX idx_rooms_search_covering 
ON hotel.rooms (hotel_id, max_adults, max_children, max_occupancy);

-- Index for room search by capacity
CREATE INDEX idx_rooms_capacity 
ON hotel.rooms (max_occupancy, max_adults, max_children);

-- ==============  MATERIALIZED VIEW: FAST SEARCH  ==============

-- Materialized view for single-row API responses
-- Optimized for /data/hotels list endpoint
CREATE MATERIALIZED VIEW hotel.mv_hotel_search AS
SELECT
    -- Core fields
    h.id,
    h.name,
    h.description,
    h.city,
    h.country_code,
    c.name                    AS country_name,
    
    -- Classification
    h.stars,
    h.rating,
    h.review_count,
    ht.name                   AS hotel_type,
    hc.name                   AS chain_name,
    
    -- Location
    h.latitude,
    h.longitude,
    h.address,
    h.zip,
    h.nearest_airport_code,
    ia.name                   AS nearest_airport_name,
    
    -- Media
    h.main_photo,
    h.thumbnail,
    
    -- Policies
    h.parking_available,
    h.children_allowed,
    h.pets_allowed,
    h.checkin_start,
    h.checkin_end,
    h.checkout,
    
    -- Currency
    h.currency_code,
    cur.name                  AS currency_name,
    cur.rate_vs_usd,
    
    -- Semantic metadata
    h.semantic_tags,
    h.semantic_persona,
    h.semantic_style,
    h.semantic_location_type,
    
    -- Aggregated facilities
    ARRAY_AGG(DISTINCT f.id) FILTER (WHERE f.id IS NOT NULL) AS facility_ids,
    ARRAY_AGG(DISTINCT f.name) FILTER (WHERE f.name IS NOT NULL) AS facility_names,
    
    -- Room summary
    COALESCE(MIN(r.max_adults), 0)        AS min_max_adults,
    COALESCE(MAX(r.max_adults), 0)        AS max_max_adults,
    COALESCE(MAX(r.max_occupancy), 0)     AS max_occupancy,
    COUNT(DISTINCT r.id)                  AS room_count,
    
    -- Image count
    COUNT(DISTINCT img.id)                AS image_count,
    
    -- Timestamps
    h.last_synced_at,
    h.updated_at
    
FROM hotel.hotels h
LEFT JOIN shared.countries c ON c.code = h.country_code
LEFT JOIN shared.currencies cur ON cur.code = h.currency_code
LEFT JOIN hotel.types ht ON ht.id = h.hotel_type_id
LEFT JOIN hotel.chains hc ON hc.id = h.chain_id
LEFT JOIN hotel.iata_airports ia ON ia.code = h.nearest_airport_code
LEFT JOIN hotel.hotel_facility_map hfm ON hfm.hotel_id = h.id
LEFT JOIN hotel.facilities f ON f.id = hfm.facility_id
LEFT JOIN hotel.rooms r ON r.hotel_id = h.id
LEFT JOIN hotel.images img ON img.hotel_id = h.id
WHERE h.is_deleted = FALSE
GROUP BY
    h.id, h.name, h.description, h.city, h.country_code, c.name,
    h.stars, h.rating, h.review_count, ht.name, hc.name,
    h.latitude, h.longitude, h.address, h.zip,
    h.nearest_airport_code, ia.name,
    h.main_photo, h.thumbnail,
    h.parking_available, h.children_allowed, h.pets_allowed,
    h.checkin_start, h.checkin_end, h.checkout,
    h.currency_code, cur.name, cur.rate_vs_usd,
    h.semantic_tags, h.semantic_persona, h.semantic_style, h.semantic_location_type,
    h.last_synced_at, h.updated_at;

-- Unique index for concurrent refresh
CREATE UNIQUE INDEX idx_mv_hotel_search_id ON hotel.mv_hotel_search (id);

-- Indexes for common search patterns on materialized view
CREATE INDEX idx_mv_hotel_search_country ON hotel.mv_hotel_search (country_code);
CREATE INDEX idx_mv_hotel_search_city ON hotel.mv_hotel_search (city);
CREATE INDEX idx_mv_hotel_search_stars ON hotel.mv_hotel_search (stars DESC NULLS LAST);
CREATE INDEX idx_mv_hotel_search_rating ON hotel.mv_hotel_search (rating DESC NULLS LAST);
CREATE INDEX idx_mv_hotel_search_geo ON hotel.mv_hotel_search (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_mv_hotel_search_facilities ON hotel.mv_hotel_search USING GIN (facility_ids);
CREATE INDEX idx_mv_hotel_search_name_trgm ON hotel.mv_hotel_search USING GIN (name gin_trgm_ops);

COMMENT ON MATERIALIZED VIEW hotel.mv_hotel_search IS 'Denormalized hotel search view optimized for /data/hotels list endpoint - refresh periodically';

-- ==============  REFRESH FUNCTIONS  ==============

-- Function to refresh the materialized view concurrently
CREATE OR REPLACE FUNCTION hotel.refresh_hotel_search_view()
RETURNS VOID
LANGUAGE SQL
AS $$
    REFRESH MATERIALIZED VIEW CONCURRENTLY hotel.mv_hotel_search;
$$;

COMMENT ON FUNCTION hotel.refresh_hotel_search_view IS 'Refreshes the hotel search materialized view concurrently (non-blocking)';

-- ==============  MATERIALIZED VIEW: PLACE SUMMARY  ==============

-- Materialized view for place-based hotel aggregation
CREATE MATERIALIZED VIEW hotel.mv_place_summary AS
SELECT
    p.id                      AS place_id,
    p.place_type,
    p.name                    AS place_name,
    p.country_code,
    c.name                    AS country_name,
    p.latitude,
    p.longitude,
    p.parent_id,
    
    -- Hotel aggregations
    COUNT(DISTINCT h.id)      AS hotel_count,
    AVG(h.rating)             AS avg_rating,
    AVG(h.stars)              AS avg_stars,
    MIN(h.stars)              AS min_stars,
    MAX(h.stars)              AS max_stars,
    
    -- Facility aggregations (top facilities in this place)
    ARRAY_AGG(DISTINCT f.name ORDER BY f.name) FILTER (WHERE f.name IS NOT NULL) AS top_facilities,
    
    -- Price range (if available from room data)
    NULL::NUMERIC             AS min_price,
    NULL::NUMERIC             AS max_price,
    
    p.updated_at
FROM hotel.places p
LEFT JOIN shared.countries c ON c.code = p.country_code
LEFT JOIN hotel.hotels h ON h.country_code = p.country_code 
    AND h.city ILIKE '%' || p.name || '%'
    AND h.is_deleted = FALSE
LEFT JOIN hotel.hotel_facility_map hfm ON hfm.hotel_id = h.id
LEFT JOIN hotel.facilities f ON f.id = hfm.facility_id
GROUP BY p.id, p.place_type, p.name, p.country_code, c.name,
         p.latitude, p.longitude, p.parent_id, p.updated_at;

CREATE UNIQUE INDEX idx_mv_place_summary_id ON hotel.mv_place_summary (place_id);
CREATE INDEX idx_mv_place_summary_country ON hotel.mv_place_summary (country_code);
CREATE INDEX idx_mv_place_summary_type ON hotel.mv_place_summary (place_type);
CREATE INDEX idx_mv_place_summary_hotel_count ON hotel.mv_place_summary (hotel_count DESC);

COMMENT ON MATERIALIZED VIEW hotel.mv_place_summary IS 'Aggregated hotel statistics per place for /data/places endpoint';

-- ==============  ROOM SEARCH MATERIALIZED VIEW  ==============

-- Materialized view for room search endpoint
CREATE MATERIALIZED VIEW hotel.mv_room_search AS
SELECT
    r.id                      AS room_id,
    r.hotel_id,
    h.name                    AS hotel_name,
    h.city,
    h.country_code,
    h.stars,
    h.rating,
    r.room_name,
    r.description,
    r.size_sqm,
    r.max_adults,
    r.max_children,
    r.max_occupancy,
    
    -- Bed types as JSON
    COALESCE(
        JSON_AGG(
            JSONB_BUILD_OBJECT(
                'bedType', rbt.bed_type,
                'bedSize', rbt.bed_size,
                'quantity', rbt.quantity
            )
        ) FILTER (WHERE rbt.id IS NOT NULL),
        '[]'::JSON
    ) AS bed_types,
    
    -- Amenities as array
    ARRAY_AGG(DISTINCT ra.name) FILTER (WHERE ra.name IS NOT NULL) AS amenities,
    
    -- Main photo
    h.main_photo              AS hotel_photo,
    (SELECT rp.url FROM hotel.room_photos rp WHERE rp.room_id = r.id AND rp.is_main = TRUE LIMIT 1) AS room_photo,
    
    h.currency_code
    
FROM hotel.rooms r
JOIN hotel.hotels h ON h.id = r.hotel_id AND h.is_deleted = FALSE
LEFT JOIN hotel.room_bed_types rbt ON rbt.room_id = r.id
LEFT JOIN hotel.room_amenity_map ram ON ram.room_id = r.id
LEFT JOIN hotel.room_amenities ra ON ra.amenity_id = ram.amenity_id
GROUP BY r.id, r.hotel_id, h.name, h.city, h.country_code, h.stars, h.rating,
         r.room_name, r.description, r.size_sqm,
         r.max_adults, r.max_children, r.max_occupancy, h.main_photo, h.currency_code;

CREATE UNIQUE INDEX idx_mv_room_search_id ON hotel.mv_room_search (room_id);
CREATE INDEX idx_mv_room_search_hotel ON hotel.mv_room_search (hotel_id);
CREATE INDEX idx_mv_room_search_occupancy ON hotel.mv_room_search (max_occupancy);

COMMENT ON MATERIALIZED VIEW hotel.mv_room_search IS 'Denormalized room search view for /data/hotels/room-search endpoint';