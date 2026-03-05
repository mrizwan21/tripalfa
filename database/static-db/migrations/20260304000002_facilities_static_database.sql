-- ============================================================
-- Migration: Facilities Static Database Setup
-- Created: 2026-03-04
-- 
-- Purpose: Establish comprehensive schema and indexing for the
-- facilities reference table sourced from LiteAPI /data/facilities
--
-- Changes:
--   1. Ensure hotel.facilities table with proper constraints
--   2. Add indexing for efficient queries
--   3. Create views for common facility lookups
--   4. Add audit logging for facility updates
--   5. Add multilingual support via translations
-- ============================================================

-- ============================================================
-- 1. FACILITIES TABLE (if not exists - for safety)
-- ============================================================

CREATE TABLE IF NOT EXISTS hotel.facilities (
    id              INTEGER         NOT NULL,       -- LiteAPI facility ID
    name            VARCHAR(255)    NOT NULL,       -- Facility name (e.g., "WiFi", "Swimming Pool")
    translations    JSONB           NULL,           -- Multi-language translations {en: "...", fr: "...", etc}
    description     TEXT            NULL,           -- Optional facility description
    category        VARCHAR(50)     NULL,           -- Optional category (amenity, service, policy, etc)
    is_active       BOOLEAN         NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_facilities PRIMARY KEY (id)
);

COMMENT ON TABLE hotel.facilities IS 'Hotel facility reference data — sourced from LiteAPI /data/facilities';
COMMENT ON COLUMN hotel.facilities.id IS 'Unique facility identifier from LiteAPI';
COMMENT ON COLUMN hotel.facilities.name IS 'English name of the facility (e.g., WiFi, Swimming Pool, Gym)';
COMMENT ON COLUMN hotel.facilities.translations IS 'JSON object with language-specific translations {code: name}';
COMMENT ON COLUMN hotel.facilities.description IS 'Detailed description of the facility';
COMMENT ON COLUMN hotel.facilities.category IS 'Facility category for grouping (e.g., amenity, service, accessibility)';

-- ============================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================

-- Primary key index (already created)
CREATE UNIQUE INDEX IF NOT EXISTS idx_facilities_id 
  ON hotel.facilities (id);

-- Index for name lookups and sorting
CREATE INDEX IF NOT EXISTS idx_facilities_name 
  ON hotel.facilities (name);

-- Index for active facilities (common query pattern)
CREATE INDEX IF NOT EXISTS idx_facilities_active 
  ON hotel.facilities (is_active) 
  WHERE is_active = TRUE;

-- Index for category grouping
CREATE INDEX IF NOT EXISTS idx_facilities_category 
  ON hotel.facilities (category)
  WHERE category IS NOT NULL;

-- Index for recent updates (ETL/sync tracking)
CREATE INDEX IF NOT EXISTS idx_facilities_updated_at 
  ON hotel.facilities (updated_at DESC)
  WHERE updated_at > NOW() - INTERVAL '30 days';

-- Full-text search index on name and description
CREATE INDEX IF NOT EXISTS idx_facilities_search
  ON hotel.facilities
  USING GIN (to_tsvector('english', name || ' ' || COALESCE(description, '')));

-- JSONB index for faster translation lookups
CREATE INDEX IF NOT EXISTS idx_facilities_translations
  ON hotel.facilities
  USING GIN (translations);

-- ============================================================
-- 3. AUDIT TRAIL TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS hotel.facilities_audit (
    id                BIGSERIAL      NOT NULL,
    facility_id       INTEGER        NOT NULL,
    old_name          VARCHAR(255)   NULL,
    new_name          VARCHAR(255)   NULL,
    old_translations  JSONB          NULL,
    new_translations  JSONB          NULL,
    old_is_active     BOOLEAN        NULL,
    new_is_active     BOOLEAN        NULL,
    action            VARCHAR(20)    NOT NULL,  -- INSERT, UPDATE, DELETE
    changed_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    changed_by        VARCHAR(100)   DEFAULT 'liteapi-sync',

    CONSTRAINT pk_facilities_audit PRIMARY KEY (id),
    CONSTRAINT fk_facilities_audit_id FOREIGN KEY (facility_id) 
      REFERENCES hotel.facilities (id) ON DELETE CASCADE
);

COMMENT ON TABLE hotel.facilities_audit IS 'Audit trail for facilities table changes (created by trigger)';
COMMENT ON COLUMN hotel.facilities_audit.action IS 'Type of change: INSERT, UPDATE, or DELETE';

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_facilities_audit_id 
  ON hotel.facilities_audit (facility_id, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_facilities_audit_changed_at 
  ON hotel.facilities_audit (changed_at DESC);

-- ============================================================
-- 4. AUDIT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION hotel.fn_facilities_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO hotel.facilities_audit 
      (facility_id, new_name, new_translations, new_is_active, action)
    VALUES (NEW.id, NEW.name, NEW.translations, NEW.is_active, 'INSERT');
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO hotel.facilities_audit 
      (facility_id, old_name, new_name, old_translations, new_translations, old_is_active, new_is_active, action)
    VALUES (NEW.id, OLD.name, NEW.name, OLD.translations, NEW.translations, OLD.is_active, NEW.is_active, 'UPDATE');
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO hotel.facilities_audit 
      (facility_id, old_name, old_translations, old_is_active, action)
    VALUES (OLD.id, OLD.name, OLD.translations, OLD.is_active, 'DELETE');
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trg_facilities_audit ON hotel.facilities;
CREATE TRIGGER trg_facilities_audit
  AFTER INSERT OR UPDATE OR DELETE ON hotel.facilities
  FOR EACH ROW
  EXECUTE FUNCTION hotel.fn_facilities_audit();

-- ============================================================
-- 5. HELPER VIEWS
-- ============================================================

-- View: All active facilities for display
CREATE OR REPLACE VIEW hotel.v_facilities_active AS
SELECT
  id,
  name,
  description,
  category,
  translations,
  is_active,
  created_at,
  updated_at
FROM hotel.facilities
WHERE is_active = TRUE
ORDER BY name ASC;

COMMENT ON VIEW hotel.v_facilities_active IS 'Active facilities for hotel amenity display and selection';

-- View: Facilities with translation metadata
CREATE OR REPLACE VIEW hotel.v_facilities_with_translations AS
SELECT
  f.id,
  f.name,
  f.description,
  f.category,
  f.is_active,
  JSONB_OBJECT_KEYS(f.translations) AS available_languages,
  JSONB_ARRAY_LENGTH(JSONB_OBJECT_KEYS(f.translations)::jsonb) AS translation_count,
  f.created_at,
  f.updated_at
FROM hotel.facilities f
WHERE f.translations IS NOT NULL
ORDER BY f.name ASC;

COMMENT ON VIEW hotel.v_facilities_with_translations IS 'Facilities with translation availability metrics';

-- View: Facilities with sync metadata
CREATE OR REPLACE VIEW hotel.v_facilities_with_audit AS
SELECT
  f.id,
  f.name,
  f.description,
  f.category,
  f.is_active,
  f.created_at,
  f.updated_at,
  COALESCE(MAX(fa.changed_at), f.created_at) AS last_synced_at,
  COUNT(fa.id) AS total_changes
FROM hotel.facilities f
LEFT JOIN hotel.facilities_audit fa ON fa.facility_id = f.id
GROUP BY f.id, f.name, f.description, f.category, f.is_active, f.created_at, f.updated_at
ORDER BY f.name ASC;

COMMENT ON VIEW hotel.v_facilities_with_audit IS 'Facilities with audit trail and sync metadata for monitoring';

-- ============================================================
-- 6. MATERIALIZED INDEX FOR SEARCH
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS hotel.mv_facilities_search AS
SELECT
  id,
  name,
  category,
  is_active,
  to_tsvector('english', name || ' ' || COALESCE(description, '')) AS search_vector
FROM hotel.facilities
WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_mv_facilities_search_vector 
  ON hotel.mv_facilities_search 
  USING GIN (search_vector);

COMMENT ON MATERIALIZED VIEW hotel.mv_facilities_search IS 'Materialized index for full-text search on facility names and descriptions';

-- ============================================================
-- 7. SYNC METADATA TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS hotel.facilities_sync_metadata (
    sync_id              BIGSERIAL      NOT NULL,
    total_records        INTEGER        NOT NULL DEFAULT 0,
    inserted_count       INTEGER        NOT NULL DEFAULT 0,
    updated_count        INTEGER        NOT NULL DEFAULT 0,
    deleted_count        INTEGER        NOT NULL DEFAULT 0,
    skipped_count        INTEGER        NOT NULL DEFAULT 0,
    sync_started_at      TIMESTAMPTZ    NOT NULL,
    sync_completed_at    TIMESTAMPTZ    NOT NULL,
    sync_duration_ms     INTEGER        NOT NULL,
    data_source          VARCHAR(50)    NOT NULL DEFAULT 'liteapi',
    api_endpoint         VARCHAR(200)   DEFAULT '/data/facilities',
    status               VARCHAR(20)    NOT NULL DEFAULT 'success',  -- success, partial, failed
    error_message        TEXT           NULL,

    CONSTRAINT pk_facilities_sync_metadata PRIMARY KEY (sync_id)
);

COMMENT ON TABLE hotel.facilities_sync_metadata IS 'Comprehensive metadata and statistics for each facilities sync operation';

CREATE INDEX IF NOT EXISTS idx_facilities_sync_completed_at 
  ON hotel.facilities_sync_metadata (sync_completed_at DESC);

-- ============================================================
-- 8. MIGRATION COMPLETE
-- ============================================================

SELECT 'Facilities static database migration completed successfully' AS status;