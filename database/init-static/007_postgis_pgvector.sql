-- ============================================================
-- 007_postgis_pgvector.sql
-- Enable PostGIS for geo queries and pgvector for semantic search
-- This file adds advanced indexing capabilities for LiteAPI
-- hotel static data endpoints.
-- ============================================================

-- ==============  POSTGIS (Geographic queries)  ==============

-- Enable PostGIS extension for geographic queries
-- Required for: bounding-box search, radius search, nearest neighbor
CREATE EXTENSION IF NOT EXISTS "postgis";

-- Enable PostGIS topology (optional, for advanced spatial operations)
-- CREATE EXTENSION IF NOT EXISTS "postgis_topology";

-- ==============  PGVECTOR (Semantic search)  ==============

-- Enable pgvector extension for vector similarity search
-- Required for: /data/hotels/semantic-search, /data/hotel/ask
-- Default dimension: 1536 (OpenAI text-embedding-3-small)
-- Adjust based on your embedding model:
--   - OpenAI text-embedding-3-small: 1536
--   - OpenAI text-embedding-3-large: 3072
--   - Cohere embed-english-v3.0: 1024
--   - Voyage AI voyage-2: 1024
CREATE EXTENSION IF NOT EXISTS "vector";

-- Set default vector dimensions for the project
-- This can be referenced by application code for validation
COMMENT ON EXTENSION "vector" IS 'pgvector extension for semantic similarity search. Default dimension: 1536 (OpenAI text-embedding-3-small)';

-- ==============  VECTOR OPERATOR CLASS (ivfflat)  ==============

-- For vector similarity search with approximate nearest neighbor (ANN)
-- Using IVF (Inverted File) index for fast KNN queries
-- Lists = sqrt(rows) is a good starting point for IVF indexes

-- ==============  POSTGIS HELPER FUNCTIONS  ==============

-- Create a helper function to convert lat/lng to PostGIS geography point
CREATE OR REPLACE FUNCTION hotel.make_geography_point(lat DOUBLE PRECISION, lng DOUBLE PRECISION)
RETURNS geography
LANGUAGE SQL
IMMUTABLE
AS $$
    SELECT ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography;
$$;

COMMENT ON FUNCTION hotel.make_geography_point IS 'Converts latitude/longitude to PostGIS geography point (SRID 4326)';

-- Function to find hotels within radius (in meters)
CREATE OR REPLACE FUNCTION hotel.hotels_within_radius(
    center_lat DOUBLE PRECISION,
    center_lng DOUBLE PRECISION,
    radius_meters INTEGER,
    p_limit INTEGER DEFAULT 100
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    name VARCHAR(300),
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    distance_meters DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        h.id,
        h.name,
        h.latitude,
        h.longitude,
        ST_Distance(
            hotel.make_geography_point(h.latitude, h.longitude),
            hotel.make_geography_point(center_lat, center_lng)
        ) AS distance_meters
    FROM hotel.hotels h
    WHERE h.is_deleted = FALSE
      AND h.latitude IS NOT NULL
      AND h.longitude IS NOT NULL
      AND ST_DWithin(
          hotel.make_geography_point(h.latitude, h.longitude),
          hotel.make_geography_point(center_lat, center_lng),
          radius_meters
      )
    ORDER BY distance_meters
    LIMIT p_limit;
$$;

COMMENT ON FUNCTION hotel.hotels_within_radius IS 'Returns hotels within a specified radius (in meters) from a center point';

-- Function for bounding box search
CREATE OR REPLACE FUNCTION hotel.hotels_in_bbox(
    min_lat DOUBLE PRECISION,
    min_lng DOUBLE PRECISION,
    max_lat DOUBLE PRECISION,
    max_lng DOUBLE PRECISION,
    p_limit INTEGER DEFAULT 1000
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    name VARCHAR(300),
    city VARCHAR(200),
    stars NUMERIC,
    rating NUMERIC,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        h.id,
        h.name,
        h.city,
        h.stars,
        h.rating,
        h.latitude,
        h.longitude
    FROM hotel.hotels h
    WHERE h.is_deleted = FALSE
      AND h.latitude IS NOT NULL
      AND h.longitude IS NOT NULL
      AND h.latitude >= min_lat
      AND h.latitude <= max_lat
      AND h.longitude >= min_lng
      AND h.longitude <= max_lng
    ORDER BY h.rating DESC NULLS LAST, h.stars DESC NULLS LAST
    LIMIT p_limit;
$$;

COMMENT ON FUNCTION hotel.hotels_in_bbox IS 'Returns hotels within a bounding box (min_lat, min_lng, max_lat, max_lng)';

-- ==============  VECTOR SIMILARITY FUNCTIONS  ==============

-- Function for semantic search with KNN (K-Nearest Neighbors)
-- Returns hotels most similar to the query embedding
CREATE OR REPLACE FUNCTION hotel.semantic_search(
    query_embedding VECTOR(1536),
    match_count INTEGER DEFAULT 20,
    filter_country_code CHAR(2) DEFAULT NULL,
    min_stars NUMERIC DEFAULT NULL,
    min_rating NUMERIC DEFAULT NULL
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    name VARCHAR(300),
    city VARCHAR(200),
    country_code CHAR(2),
    stars NUMERIC,
    rating NUMERIC,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        h.id,
        h.name,
        h.city,
        h.country_code,
        h.stars,
        h.rating,
        1 - (h.semantic_embedding <=> query_embedding) AS similarity
    FROM hotel.hotels h
    WHERE h.is_deleted = FALSE
      AND h.semantic_embedding IS NOT NULL
      AND (filter_country_code IS NULL OR h.country_code = filter_country_code)
      AND (min_stars IS NULL OR h.stars >= min_stars)
      AND (min_rating IS NULL OR h.rating >= min_rating)
    ORDER BY h.semantic_embedding <=> query_embedding
    LIMIT match_count;
$$;

COMMENT ON FUNCTION hotel.semantic_search IS 'Performs semantic similarity search on hotels using vector embeddings. Returns KNN results with cosine distance similarity';

-- Function for hybrid search (combines text + semantic + geo)
CREATE OR REPLACE FUNCTION hotel.hybrid_search(
    query_embedding VECTOR(1536),
    search_text VARCHAR DEFAULT NULL,
    center_lat DOUBLE PRECISION DEFAULT NULL,
    center_lng DOUBLE PRECISION DEFAULT NULL,
    radius_meters INTEGER DEFAULT NULL,
    country_code CHAR(2) DEFAULT NULL,
    min_stars NUMERIC DEFAULT NULL,
    min_rating NUMERIC DEFAULT NULL,
    match_count INTEGER DEFAULT 20
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    name VARCHAR(300),
    city VARCHAR(200),
    country_code CHAR(2),
    stars NUMERIC,
    rating NUMERIC,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    semantic_score FLOAT,
    text_score FLOAT,
    distance_meters FLOAT,
    combined_score FLOAT
)
LANGUAGE PLPGSQL
STABLE
AS $$
BEGIN
    RETURN QUERY
    SELECT
        h.id,
        h.name,
        h.city,
        h.country_code,
        h.stars,
        h.rating,
        h.latitude,
        h.longitude,
        CASE WHEN h.semantic_embedding IS NOT NULL 
             THEN 1 - (h.semantic_embedding <=> query_embedding)
             ELSE 0 END AS semantic_score,
        CASE WHEN search_text IS NOT NULL 
             THEN similarity(lower(h.name), lower(search_text))
             ELSE 0 END AS text_score,
        CASE WHEN center_lat IS NOT NULL AND center_lng IS NOT NULL 
                  AND h.latitude IS NOT NULL AND h.longitude IS NOT NULL
             THEN ST_Distance(
                 hotel.make_geography_point(h.latitude, h.longitude),
                 hotel.make_geography_point(center_lat, center_lng)
             )
             ELSE NULL END AS distance_meters,
        -- Combined score: weighted average of semantic and text similarity
        -- Adjust weights based on your use case
        (CASE WHEN h.semantic_embedding IS NOT NULL 
              THEN (1 - (h.semantic_embedding <=> query_embedding)) * 0.7
              ELSE 0 END +
         CASE WHEN search_text IS NOT NULL 
              THEN similarity(lower(h.name), lower(search_text)) * 0.3
              ELSE 0 END) AS combined_score
    FROM hotel.hotels h
    WHERE h.is_deleted = FALSE
      AND (country_code IS NULL OR h.country_code = country_code)
      AND (min_stars IS NULL OR h.stars >= min_stars)
      AND (min_rating IS NULL OR h.rating >= min_rating)
      -- Geo filter
      AND (center_lat IS NULL OR center_lng IS NULL OR radius_meters IS NULL
           OR (h.latitude IS NOT NULL AND h.longitude IS NOT NULL
               AND ST_DWithin(
                   hotel.make_geography_point(h.latitude, h.longitude),
                   hotel.make_geography_point(center_lat, center_lng),
                   radius_meters
               )))
    ORDER BY combined_score DESC
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION hotel.hybrid_search IS 'Performs hybrid search combining semantic similarity, text matching, and geo filtering for comprehensive hotel discovery';