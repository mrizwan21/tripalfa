-- ============================================================
-- 011_liteapi_fallback_cache.sql
-- Fallback caching for LiteAPI direct calls when static DB
-- doesn't have the data or it's stale.
--
-- Use Case: When hotel data is not in static DB, fetch from
-- LiteAPI /data/hotel endpoint and cache the response.
-- ============================================================

-- ==============  API RESPONSE CACHE TABLE  ==============

-- Stores raw API responses from LiteAPI direct calls
-- Used as fallback when static DB data is missing/stale
CREATE TABLE hotel.api_cache (
    hotel_id            VARCHAR(20)    NOT NULL,
    
    -- API parameters used
    language            VARCHAR(10)    NOT NULL DEFAULT 'en',
    
    -- Raw API response (full JSON)
    response_data       JSONB          NOT NULL,
    
    -- Extracted fields for quick access
    hotel_name          VARCHAR(300)   NULL,
    country_code        CHAR(2)        NULL,
    city                VARCHAR(200)   NULL,
    stars               NUMERIC(3,1)   NULL,
    rating              NUMERIC(4,2)   NULL,
    currency_code       CHAR(3)        NULL,
    
    -- Cache metadata
    source              VARCHAR(50)    NOT NULL DEFAULT 'liteapi_fallback',
    fetch_duration_ms   INTEGER        NULL,
    
    -- TTL management
    expires_at          TIMESTAMPTZ    NOT NULL,
    is_stale            BOOLEAN        NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    fetched_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_api_cache PRIMARY KEY (hotel_id, language)
);

-- Indexes for cache management
CREATE INDEX idx_api_cache_expires ON hotel.api_cache (expires_at) WHERE is_stale = FALSE;
CREATE INDEX idx_api_cache_hotel ON hotel.api_cache (hotel_id);
CREATE INDEX idx_api_cache_country ON hotel.api_cache (country_code);
CREATE INDEX idx_api_cache_fetched ON hotel.api_cache (fetched_at DESC);

COMMENT ON TABLE hotel.api_cache IS 'Fallback cache for LiteAPI direct calls - stores raw API responses when static DB data is unavailable';
COMMENT ON COLUMN hotel.api_cache.response_data IS 'Full JSON response from LiteAPI /data/hotel endpoint';
COMMENT ON COLUMN hotel.api_cache.expires_at IS 'Cache expiration time - default 24 hours for hotel data';

-- ==============  API REQUEST LOG  ==============

-- Tracks all fallback API requests for monitoring
CREATE TABLE hotel.api_request_log (
    id                  BIGSERIAL      NOT NULL,
    hotel_id            VARCHAR(20)    NOT NULL,
    language            VARCHAR(10)    NOT NULL DEFAULT 'en',
    
    -- Request details
    request_params      JSONB          NULL,
    
    -- Response details
    status_code         SMALLINT       NULL,
    response_time_ms    INTEGER        NULL,
    response_size_bytes INTEGER        NULL,
    
    -- Status
    status              VARCHAR(20)    NOT NULL DEFAULT 'pending',  -- pending, success, failed, timeout
    
    -- Error info
    error_message       TEXT           NULL,
    error_code          VARCHAR(50)    NULL,
    
    -- Source tracking
    source_trigger      VARCHAR(100)   NULL,  -- What triggered this fallback (e.g., "hotel_not_found", "stale_data")
    
    -- Timestamps
    requested_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ    NULL,

    CONSTRAINT pk_api_request_log PRIMARY KEY (id)
);

CREATE INDEX idx_api_log_hotel ON hotel.api_request_log (hotel_id, requested_at DESC);
CREATE INDEX idx_api_log_status ON hotel.api_request_log (status, requested_at DESC);
CREATE INDEX idx_api_log_time ON hotel.api_request_log (requested_at DESC);

COMMENT ON TABLE hotel.api_request_log IS 'Audit log of all LiteAPI fallback requests for monitoring and rate limiting';

-- ==============  CACHE HELPER FUNCTIONS  ==============

-- Get cached hotel data or return NULL if expired/missing
CREATE OR REPLACE FUNCTION hotel.get_cached_hotel(
    p_hotel_id VARCHAR(20),
    p_language VARCHAR(10) DEFAULT 'en'
)
RETURNS TABLE (
    hotel_id VARCHAR(20),
    response_data JSONB,
    is_stale BOOLEAN,
    cached_at TIMESTAMPTZ
)
LANGUAGE SQL
STABLE
AS $$
    SELECT 
        c.hotel_id::VARCHAR(20),
        c.response_data,
        c.is_stale,
        c.fetched_at
    FROM hotel.api_cache c
    WHERE c.hotel_id = p_hotel_id
      AND c.language = p_language
      AND (c.expires_at > NOW() OR c.is_stale = FALSE);
$$;

COMMENT ON FUNCTION hotel.get_cached_hotel IS 'Retrieves cached hotel data if available and not expired';

-- Store API response in cache
CREATE OR REPLACE FUNCTION hotel.cache_hotel_response(
    p_hotel_id VARCHAR(20),
    p_language VARCHAR(10),
    p_response_data JSONB,
    p_fetch_duration_ms INTEGER DEFAULT NULL,
    p_ttl_hours INTEGER DEFAULT 24
)
RETURNS VOID
LANGUAGE PLPGSQL
AS $$
BEGIN
    -- Upsert the cache entry
    INSERT INTO hotel.api_cache (
        hotel_id,
        language,
        response_data,
        hotel_name,
        country_code,
        city,
        stars,
        rating,
        currency_code,
        fetch_duration_ms,
        expires_at,
        fetched_at
    )
    VALUES (
        p_hotel_id,
        p_language,
        p_response_data,
        p_response_data->>'name',
        p_response_data->>'countryCode',
        p_response_data->>'city',
        (p_response_data->>'stars')::NUMERIC(3,1),
        (p_response_data->>'rating')::NUMERIC(4,2),
        p_response_data->>'currency',
        p_fetch_duration_ms,
        NOW() + (p_ttl_hours || ' hours')::INTERVAL,
        NOW()
    )
    ON CONFLICT (hotel_id, language) DO UPDATE SET
        response_data = p_response_data,
        hotel_name = p_response_data->>'name',
        country_code = p_response_data->>'countryCode',
        city = p_response_data->>'city',
        stars = (p_response_data->>'stars')::NUMERIC(3,1),
        rating = (p_response_data->>'rating')::NUMERIC(4,2),
        currency_code = p_response_data->>'currency',
        fetch_duration_ms = p_fetch_duration_ms,
        expires_at = NOW() + (p_ttl_hours || ' hours')::INTERVAL,
        is_stale = FALSE,
        fetched_at = NOW(),
        updated_at = NOW();
END;
$$;

COMMENT ON FUNCTION hotel.cache_hotel_response IS 'Stores LiteAPI hotel response in the fallback cache';

-- Log API request
CREATE OR REPLACE FUNCTION hotel.log_api_request(
    p_hotel_id VARCHAR(20),
    p_language VARCHAR(10),
    p_request_params JSONB,
    p_status_code SMALLINT,
    p_response_time_ms INTEGER,
    p_status VARCHAR,
    p_error_message TEXT DEFAULT NULL,
    p_source_trigger VARCHAR DEFAULT 'fallback'
)
RETURNS BIGINT
LANGUAGE PLPGSQL
AS $$
DECLARE
    v_id BIGINT;
BEGIN
    INSERT INTO hotel.api_request_log (
        hotel_id,
        language,
        request_params,
        status_code,
        response_time_ms,
        status,
        error_message,
        source_trigger,
        completed_at
    )
    VALUES (
        p_hotel_id,
        p_language,
        p_request_params,
        p_status_code,
        p_response_time_ms,
        p_status,
        p_error_message,
        p_source_trigger,
        CASE WHEN p_status IN ('success', 'failed', 'timeout') THEN NOW() ELSE NULL END
    )
    RETURNING id INTO v_id;
    
    RETURN v_id;
END;
$$;

COMMENT ON FUNCTION hotel.log_api_request IS 'Logs a LiteAPI fallback request for monitoring';

-- ==============  DATA RESOLUTION FUNCTION  ==============

-- Unified function to get hotel data: try static DB first, then fallback cache
CREATE OR REPLACE FUNCTION hotel.resolve_hotel_data(
    p_hotel_id VARCHAR(20),
    p_language VARCHAR(10) DEFAULT 'en',
    p_max_age_hours INTEGER DEFAULT 24
)
RETURNS TABLE (
    source              VARCHAR(50),
    hotel_id            VARCHAR(20),
    hotel_name          VARCHAR(300),
    country_code        CHAR(2),
    city                VARCHAR(200),
    stars               NUMERIC(3,1),
    rating              NUMERIC(4,2),
    currency_code       CHAR(3),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    full_data           JSONB,
    needs_fallback      BOOLEAN
)
LANGUAGE PLPGSQL
STABLE
AS $$
DECLARE
    v_static_exists BOOLEAN;
    v_cache_exists BOOLEAN;
BEGIN
    -- Check if hotel exists in static DB
    SELECT EXISTS (
        SELECT 1 FROM hotel.hotels WHERE id = p_hotel_id AND is_deleted = FALSE
    ) INTO v_static_exists;
    
    IF v_static_exists THEN
        -- Return from static DB
        RETURN QUERY
        SELECT 
            'static_db'::VARCHAR(50) AS source,
            h.id::VARCHAR(20),
            h.name::VARCHAR(300),
            h.country_code,
            h.city::VARCHAR(200),
            h.stars,
            h.rating,
            h.currency_code,
            h.latitude,
            h.longitude,
            to_jsonb(h.*) AS full_data,
            FALSE AS needs_fallback
        FROM hotel.hotels h
        WHERE h.id = p_hotel_id;
    ELSE
        -- Check fallback cache
        SELECT EXISTS (
            SELECT 1 FROM hotel.api_cache 
            WHERE hotel_id = p_hotel_id 
              AND language = p_language 
              AND expires_at > NOW()
        ) INTO v_cache_exists;
        
        IF v_cache_exists THEN
            -- Return from cache
            RETURN QUERY
            SELECT 
                'fallback_cache'::VARCHAR(50) AS source,
                c.hotel_id::VARCHAR(20),
                c.hotel_name::VARCHAR(300),
                c.country_code,
                c.city::VARCHAR(200),
                c.stars,
                c.rating,
                c.currency_code,
                (c.response_data->>'latitude')::DOUBLE PRECISION AS latitude,
                (c.response_data->>'longitude')::DOUBLE PRECISION AS longitude,
                c.response_data AS full_data,
                FALSE AS needs_fallback
            FROM hotel.api_cache c
            WHERE c.hotel_id = p_hotel_id AND c.language = p_language;
        ELSE
            -- Need to fetch from API
            RETURN QUERY
            SELECT 
                'not_found'::VARCHAR(50) AS source,
                p_hotel_id::VARCHAR(20) AS hotel_id,
                NULL::VARCHAR(300) AS hotel_name,
                NULL::CHAR(2) AS country_code,
                NULL::VARCHAR(200) AS city,
                NULL::NUMERIC(3,1) AS stars,
                NULL::NUMERIC(4,2) AS rating,
                NULL::CHAR(3) AS currency_code,
                NULL::DOUBLE PRECISION AS latitude,
                NULL::DOUBLE PRECISION AS longitude,
                NULL::JSONB AS full_data,
                TRUE AS needs_fallback;
        END IF;
    END IF;
END;
$$;

COMMENT ON FUNCTION hotel.resolve_hotel_data IS 'Resolves hotel data: tries static DB first, then fallback cache. Returns needs_fallback=TRUE if API call is required';

-- ==============  CACHE MAINTENANCE FUNCTIONS  ==============

-- Mark expired cache entries as stale
CREATE OR REPLACE FUNCTION hotel.mark_stale_cache()
RETURNS INTEGER
LANGUAGE SQL
AS $$
    UPDATE hotel.api_cache
    SET is_stale = TRUE, updated_at = NOW()
    WHERE expires_at < NOW() AND is_stale = FALSE;
    
    SELECT COUNT(*)::INTEGER FROM hotel.api_cache WHERE is_stale = TRUE;
$$;

COMMENT ON FUNCTION hotel.mark_stale_cache IS 'Marks expired cache entries as stale';

-- Clean up old cache entries and logs
CREATE OR REPLACE FUNCTION hotel.cleanup_old_cache(
    p_retention_days INTEGER DEFAULT 30
)
RETURNS INTEGER
LANGUAGE SQL
AS $$
    -- Delete old cache entries
    DELETE FROM hotel.api_cache 
    WHERE updated_at < NOW() - (p_retention_days || ' days')::INTERVAL;
    
    -- Delete old request logs
    DELETE FROM hotel.api_request_log 
    WHERE requested_at < NOW() - (p_retention_days || ' days')::INTERVAL;
    
    SELECT COALESCE(COUNT(*), 0)::INTEGER FROM hotel.api_cache;
$$;

COMMENT ON FUNCTION hotel.cleanup_old_cache IS 'Removes old cache entries and logs beyond retention period';

-- ==============  CACHE STATISTICS VIEW  ==============

CREATE OR REPLACE VIEW hotel.v_cache_statistics AS
SELECT 
    COUNT(*) AS total_cached_hotels,
    COUNT(*) FILTER (WHERE is_stale = FALSE) AS fresh_entries,
    COUNT(*) FILTER (WHERE is_stale = TRUE) AS stale_entries,
    COUNT(*) FILTER (WHERE expires_at > NOW()) AS valid_entries,
    AVG(fetch_duration_ms) FILTER (WHERE fetch_duration_ms IS NOT NULL) AS avg_fetch_time_ms,
    MIN(fetched_at) AS oldest_fetch,
    MAX(fetched_at) AS newest_fetch,
    COUNT(DISTINCT country_code) AS countries_covered
FROM hotel.api_cache;

COMMENT ON VIEW hotel.v_cache_statistics IS 'Statistics about the fallback cache';

-- ==============  API USAGE STATISTICS VIEW  ==============

CREATE OR REPLACE VIEW hotel.v_api_usage_stats AS
SELECT 
    DATE(requested_at) AS request_date,
    COUNT(*) AS total_requests,
    COUNT(*) FILTER (WHERE status = 'success') AS successful_requests,
    COUNT(*) FILTER (WHERE status = 'failed') AS failed_requests,
    COUNT(*) FILTER (WHERE status = 'timeout') AS timed_out_requests,
    AVG(response_time_ms) FILTER (WHERE response_time_ms IS NOT NULL) AS avg_response_time_ms,
    COUNT(DISTINCT hotel_id) AS unique_hotels_requested,
    COUNT(DISTINCT source_trigger) AS trigger_types
FROM hotel.api_request_log
GROUP BY DATE(requested_at)
ORDER BY DATE(requested_at) DESC;

COMMENT ON VIEW hotel.v_api_usage_stats IS 'Daily API usage statistics for fallback requests';

-- ==============  INITIALIZE  ==============

-- Create trigger to auto-update timestamps
CREATE OR REPLACE FUNCTION hotel.update_api_cache_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_api_cache_timestamp
    BEFORE UPDATE ON hotel.api_cache
    FOR EACH ROW
    EXECUTE FUNCTION hotel.update_api_cache_timestamp();