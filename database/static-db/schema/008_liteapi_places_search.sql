-- ============================================================
-- 008_liteapi_places_search.sql
-- Tables and indexes for LiteAPI places and advanced search:
--   - places (for /data/places, /data/places/{placeId})
--   - hotel_embeddings (for semantic/visual search)
--   - Materialized view for fast search responses
-- ============================================================

-- ------------------------------------------------------------
-- PLACES
-- Source: LiteAPI /data/places
-- Hierarchical location structure: Country → Region → City → Area
-- ------------------------------------------------------------
CREATE TABLE hotel.places (
    id              VARCHAR(50)    NOT NULL,    -- LiteAPI place ID (e.g., "place:12345")
    place_type      VARCHAR(50)    NOT NULL,    -- Country, Region, City, Area, Hotel
    name            VARCHAR(300)   NOT NULL,
    parent_id       VARCHAR(50)    NULL,        -- Self-reference for hierarchy
    country_code    CHAR(2)        NULL,
    
    -- Geographic center
    latitude        DOUBLE PRECISION NULL,
    longitude       DOUBLE PRECISION NULL,
    
    -- GeoJSON boundary (for polygon-based searches)
    geojson         JSONB          NULL,
    
    -- Metadata
    hotel_count     INTEGER        NOT NULL DEFAULT 0,
    popularity      INTEGER        NOT NULL DEFAULT 0,
    
    -- Search optimization
    search_vector   TSVECTOR       NULL,        -- Full-text search vector
    name_normalized VARCHAR(300)   NULL,        -- Unaccented, lowercase name for search
    
    created_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_places PRIMARY KEY (id),
    CONSTRAINT fk_places_parent FOREIGN KEY (parent_id) REFERENCES hotel.places (id) ON DELETE SET NULL,
    CONSTRAINT fk_places_country FOREIGN KEY (country_code) REFERENCES shared.countries (code) ON DELETE SET NULL
);

COMMENT ON TABLE hotel.places IS 'Hierarchical location data for LiteAPI /data/places - Countries, Regions, Cities, Areas';
COMMENT ON COLUMN hotel.places.place_type IS 'Type of place: Country, Region, City, Area, Hotel';
COMMENT ON COLUMN hotel.places.geojson IS 'GeoJSON polygon representing place boundary (optional)';
COMMENT ON COLUMN hotel.places.search_vector IS 'PostgreSQL full-text search vector for autocomplete';

-- Indexes for places
CREATE INDEX idx_places_type ON hotel.places (place_type);
CREATE INDEX idx_places_country ON hotel.places (country_code);
CREATE INDEX idx_places_parent ON hotel.places (parent_id);
CREATE INDEX idx_places_geo ON hotel.places (latitude, longitude) WHERE latitude IS NOT NULL;
CREATE INDEX idx_places_name_trgm ON hotel.places USING GIN (name gin_trgm_ops);
CREATE INDEX idx_places_search ON hotel.places USING GIN (search_vector);

-- Trigger to auto-update search_vector and name_normalized
CREATE OR REPLACE FUNCTION hotel.places_search_trigger()
RETURNS TRIGGER AS $$
BEGIN
    NEW.name_normalized := lower(unaccent(NEW.name));
    NEW.search_vector := to_tsvector('english', COALESCE(NEW.name, '') || ' ' || COALESCE(NEW.country_code, ''));
    RETURN NEW;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

CREATE TRIGGER trg_places_search
    BEFORE INSERT OR UPDATE ON hotel.places
    FOR EACH ROW
    EXECUTE FUNCTION hotel.places_search_trigger();

-- ------------------------------------------------------------
-- HOTEL EMBEDDINGS
-- Stores vector embeddings for semantic and visual search
-- Supports: /data/hotels/semantic-search, /data/hotel/ask
-- ------------------------------------------------------------
CREATE TABLE hotel.embeddings (
    hotel_id            VARCHAR(20)   NOT NULL,
    
    -- Text embedding (from hotel description, name, amenities)
    -- Dimension matches your embedding model (1536 = OpenAI text-embedding-3-small)
    text_embedding      VECTOR(1536)  NULL,
    
    -- Visual embedding (from hotel images)
    -- For multimodal models like CLIP
    visual_embedding    VECTOR(512)   NULL,    -- CLIP-ViT-B-32 dimension
    
    -- Embedding metadata
    text_model          VARCHAR(100)  NULL,    -- e.g., "text-embedding-3-small"
    visual_model        VARCHAR(100)  NULL,    -- e.g., "clip-vit-b-32"
    embedding_version   INTEGER       NOT NULL DEFAULT 1,
    
    -- Timestamps
    text_embedded_at    TIMESTAMPTZ   NULL,
    visual_embedded_at  TIMESTAMPTZ   NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_embeddings PRIMARY KEY (hotel_id),
    CONSTRAINT fk_embeddings_hotel FOREIGN KEY (hotel_id) REFERENCES hotel.hotels (id) ON DELETE CASCADE
);

COMMENT ON TABLE hotel.embeddings IS 'Vector embeddings for hotel semantic/visual search - LiteAPI /data/hotels/semantic-search';
COMMENT ON COLUMN hotel.embeddings.text_embedding IS 'Text embedding vector from hotel description, name, amenities (1536 dimensions for OpenAI)';
COMMENT ON COLUMN hotel.embeddings.visual_embedding IS 'Visual embedding vector from hotel images (512 dimensions for CLIP)';

-- ------------------------------------------------------------
-- ADD SEMANTIC EMBEDDING COLUMN TO HOTELS (for simpler queries)
-- This is an alternative to the separate embeddings table
-- ------------------------------------------------------------
ALTER TABLE hotel.hotels 
ADD COLUMN IF NOT EXISTS semantic_embedding VECTOR(1536) NULL;

COMMENT ON COLUMN hotel.hotels.semantic_embedding IS 'Text embedding for semantic similarity search (1536 dimensions for OpenAI text-embedding-3-small)';

-- Add visual embedding column for multimodal search
ALTER TABLE hotel.hotels 
ADD COLUMN IF NOT EXISTS visual_embedding VECTOR(512) NULL;

COMMENT ON COLUMN hotel.hotels.visual_embedding IS 'Visual embedding from hotel images for similarity search (512 dimensions for CLIP)';

-- ------------------------------------------------------------
-- PLACES SEARCH FUNCTIONS
-- ------------------------------------------------------------

-- Function to search places with autocomplete
CREATE OR REPLACE FUNCTION hotel.search_places(
    search_query VARCHAR,
    p_limit INTEGER DEFAULT 20,
    filter_type VARCHAR DEFAULT NULL,
    filter_country CHAR(2) DEFAULT NULL
)
RETURNS TABLE (
    place_id VARCHAR(50),
    place_type VARCHAR(50),
    name VARCHAR(300),
    country_code CHAR(2),
    hotel_count INTEGER,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        p.id,
        p.place_type,
        p.name,
        p.country_code,
        p.hotel_count,
        similarity(p.name_normalized, lower(unaccent(search_query))) AS similarity
    FROM hotel.places p
    WHERE (filter_type IS NULL OR p.place_type = filter_type)
      AND (filter_country IS NULL OR p.country_code = filter_country)
      AND p.name_normalized % lower(unaccent(search_query))
    ORDER BY similarity DESC, p.hotel_count DESC
    LIMIT p_limit;
$$;

COMMENT ON FUNCTION hotel.search_places IS 'Autocomplete search for places using trigram similarity';

-- Function to get place hierarchy (for breadcrumbs)
CREATE OR REPLACE FUNCTION hotel.get_place_hierarchy(
    p_place_id VARCHAR(50)
)
RETURNS TABLE (
    place_id VARCHAR(50),
    place_type VARCHAR(50),
    name VARCHAR(300),
    depth INTEGER
)
LANGUAGE SQL
STABLE
AS $$
    WITH RECURSIVE hierarchy AS (
        -- Base case: start with the requested place
        SELECT id, place_type, name, parent_id, 0 AS depth
        FROM hotel.places
        WHERE id = p_place_id
        
        UNION ALL
        
        -- Recursive case: get parent
        SELECT p.id, p.place_type, p.name, p.parent_id, h.depth + 1
        FROM hotel.places p
        JOIN hierarchy h ON p.id = h.parent_id
    )
    SELECT id::VARCHAR(50), place_type::VARCHAR(50), name, depth
    FROM hierarchy
    ORDER BY depth DESC;
$$;

COMMENT ON FUNCTION hotel.get_place_hierarchy IS 'Returns the full parent hierarchy for a place (for breadcrumb navigation)';

-- ------------------------------------------------------------
-- VISUAL SIMILARITY SEARCH (for image-based hotel discovery)
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION hotel.visual_search(
    query_embedding VECTOR(512),
    match_count INTEGER DEFAULT 20,
    filter_country_code CHAR(2) DEFAULT NULL,
    min_stars NUMERIC DEFAULT NULL
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    name VARCHAR(300),
    city VARCHAR(200),
    main_photo TEXT,
    similarity FLOAT
)
LANGUAGE SQL
STABLE
AS $$
    SELECT
        h.id,
        h.name,
        h.city,
        h.main_photo,
        1 - (h.visual_embedding <=> query_embedding) AS similarity
    FROM hotel.hotels h
    WHERE h.is_deleted = FALSE
      AND h.visual_embedding IS NOT NULL
      AND (filter_country_code IS NULL OR h.country_code = filter_country_code)
      AND (min_stars IS NULL OR h.stars >= min_stars)
    ORDER BY h.visual_embedding <=> query_embedding
    LIMIT match_count;
$$;

COMMENT ON FUNCTION hotel.visual_search IS 'Performs visual similarity search on hotels using image embeddings';

-- ------------------------------------------------------------
-- ASK HOTEL (RAG-style natural language queries)
-- Returns hotels matching natural language descriptions
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION hotel.ask(
    query_embedding VECTOR(1536),
    query_text TEXT DEFAULT NULL,
    context_filters JSONB DEFAULT NULL,
    match_count INTEGER DEFAULT 10
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    name VARCHAR(300),
    description TEXT,
    city VARCHAR(200),
    country_code CHAR(2),
    stars NUMERIC,
    rating NUMERIC,
    review_count INTEGER,
    main_photo TEXT,
    semantic_score FLOAT,
    relevance_explanation TEXT
)
LANGUAGE PLPGSQL
STABLE
AS $$
DECLARE
    v_country_code CHAR(2);
    v_min_stars NUMERIC;
    v_min_rating NUMERIC;
    v_city VARCHAR;
BEGIN
    -- Parse context filters from JSONB
    IF context_filters IS NOT NULL THEN
        v_country_code := context_filters->>'country_code';
        v_min_stars := (context_filters->>'min_stars')::NUMERIC;
        v_min_rating := (context_filters->>'min_rating')::NUMERIC;
        v_city := context_filters->>'city';
    END IF;
    
    RETURN QUERY
    SELECT
        h.id,
        h.name,
        h.description,
        h.city,
        h.country_code,
        h.stars,
        h.rating,
        h.review_count,
        h.main_photo,
        1 - (h.semantic_embedding <=> query_embedding) AS semantic_score,
        CASE 
            WHEN h.semantic_embedding IS NOT NULL THEN
                format('Matched with %.2f%% confidence based on your query',
                    (1 - (h.semantic_embedding <=> query_embedding)) * 100)
            ELSE 'No semantic match'
        END AS relevance_explanation
    FROM hotel.hotels h
    WHERE h.is_deleted = FALSE
      AND h.semantic_embedding IS NOT NULL
      AND (v_country_code IS NULL OR h.country_code = v_country_code)
      AND (v_min_stars IS NULL OR h.stars >= v_min_stars)
      AND (v_min_rating IS NULL OR h.rating >= v_min_rating)
      AND (v_city IS NULL OR h.city ILIKE '%' || v_city || '%')
    ORDER BY h.semantic_embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

COMMENT ON FUNCTION hotel.ask IS 'Natural language hotel search using RAG-style semantic matching - LiteAPI /data/hotel/ask';