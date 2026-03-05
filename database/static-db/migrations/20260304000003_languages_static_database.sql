-- ============================================================
-- Migration: Languages Static Database Setup
-- Created: 2026-03-04
-- 
-- Purpose: Establish comprehensive schema and indexing for the
-- languages reference table sourced from LiteAPI /data/languages
--
-- Changes:
--   1. Ensure shared.languages table with proper constraints
--   2. Add indexing for efficient queries
--   3. Create views for common language lookups
--   4. Add audit logging for language updates
-- ============================================================

-- ============================================================
-- 1. LANGUAGES TABLE (if not exists - for safety)
-- ============================================================

CREATE TABLE IF NOT EXISTS shared.languages (
    code        VARCHAR(10)  NOT NULL,   -- ISO 639-1 e.g. "en", "fr", "zh-TW"
    name        VARCHAR(100) NOT NULL,   -- "English", "French"
    is_enabled  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_languages PRIMARY KEY (code)
);

COMMENT ON TABLE shared.languages IS 'ISO 639-1 language reference data — sourced from LiteAPI /data/languages';
COMMENT ON COLUMN shared.languages.code IS 'ISO 639-1 language code (e.g., en, fr, es, de, zh-CN, zh-TW)';
COMMENT ON COLUMN shared.languages.name IS 'Display name of the language';
COMMENT ON COLUMN shared.languages.is_enabled IS 'Flag to enable/disable language for UI localization';

-- ============================================================
-- 2. INDEXES FOR PERFORMANCE
-- ============================================================

-- Index for language lookups by code (primary key already covers this)
CREATE UNIQUE INDEX IF NOT EXISTS idx_languages_code 
  ON shared.languages (code);

-- Index for enabled languages (common query pattern)
CREATE INDEX IF NOT EXISTS idx_languages_enabled 
  ON shared.languages (is_enabled) 
  WHERE is_enabled = TRUE;

-- Index for sorting by name
CREATE INDEX IF NOT EXISTS idx_languages_name 
  ON shared.languages (name);

-- Index for recent updates (ETL/sync tracking)
CREATE INDEX IF NOT EXISTS idx_languages_updated_at 
  ON shared.languages (updated_at DESC)
  WHERE updated_at > NOW() - INTERVAL '30 days';

-- Full-text search index on name
CREATE INDEX IF NOT EXISTS idx_languages_search
  ON shared.languages
  USING GIN (to_tsvector('english', name));

-- ============================================================
-- 3. AUDIT TRAIL TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS shared.languages_audit (
    id                BIGSERIAL      NOT NULL,
    language_code     VARCHAR(10)    NOT NULL,
    old_name          VARCHAR(100)   NULL,
    new_name          VARCHAR(100)   NULL,
    old_is_enabled    BOOLEAN        NULL,
    new_is_enabled    BOOLEAN        NULL,
    action            VARCHAR(20)    NOT NULL,  -- INSERT, UPDATE, DELETE
    changed_at        TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    changed_by        VARCHAR(100)   DEFAULT 'liteapi-sync',

    CONSTRAINT pk_languages_audit PRIMARY KEY (id),
    CONSTRAINT fk_languages_audit_code FOREIGN KEY (language_code) 
      REFERENCES shared.languages (code) ON DELETE CASCADE
);

COMMENT ON TABLE shared.languages_audit IS 'Audit trail for languages table changes (created by trigger)';
COMMENT ON COLUMN shared.languages_audit.action IS 'Type of change: INSERT, UPDATE, or DELETE';

-- Index for audit queries
CREATE INDEX IF NOT EXISTS idx_languages_audit_code 
  ON shared.languages_audit (language_code, changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_languages_audit_changed_at 
  ON shared.languages_audit (changed_at DESC);

-- ============================================================
-- 4. AUDIT TRIGGER
-- ============================================================

CREATE OR REPLACE FUNCTION shared.fn_languages_audit()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO shared.languages_audit 
      (language_code, new_name, new_is_enabled, action)
    VALUES (NEW.code, NEW.name, NEW.is_enabled, 'INSERT');
    RETURN NEW;

  ELSIF TG_OP = 'UPDATE' THEN
    INSERT INTO shared.languages_audit 
      (language_code, old_name, new_name, old_is_enabled, new_is_enabled, action)
    VALUES (NEW.code, OLD.name, NEW.name, OLD.is_enabled, NEW.is_enabled, 'UPDATE');
    RETURN NEW;

  ELSIF TG_OP = 'DELETE' THEN
    INSERT INTO shared.languages_audit 
      (language_code, old_name, old_is_enabled, action)
    VALUES (OLD.code, OLD.name, OLD.is_enabled, 'DELETE');
    RETURN OLD;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Create trigger if it doesn't exist
DROP TRIGGER IF EXISTS trg_languages_audit ON shared.languages;
CREATE TRIGGER trg_languages_audit
  AFTER INSERT OR UPDATE OR DELETE ON shared.languages
  FOR EACH ROW
  EXECUTE FUNCTION shared.fn_languages_audit();

-- ============================================================
-- 5. HELPER VIEWS
-- ============================================================

-- View: All enabled languages for UI localization
CREATE OR REPLACE VIEW shared.v_languages_enabled AS
SELECT
  code,
  name,
  is_enabled,
  created_at,
  updated_at
FROM shared.languages
WHERE is_enabled = TRUE
ORDER BY code ASC;

COMMENT ON VIEW shared.v_languages_enabled IS 'Enabled languages for UI localization and content translation';

-- View: Languages with sync metadata
CREATE OR REPLACE VIEW shared.v_languages_with_audit AS
SELECT
  l.code,
  l.name,
  l.is_enabled,
  l.created_at,
  l.updated_at,
  COALESCE(MAX(la.changed_at), l.created_at) AS last_synced_at,
  COUNT(la.id) AS total_changes
FROM shared.languages l
LEFT JOIN shared.languages_audit la ON la.language_code = l.code
GROUP BY l.code, l.name, l.is_enabled, l.created_at, l.updated_at
ORDER BY l.code ASC;

COMMENT ON VIEW shared.v_languages_with_audit IS 'Languages with audit trail and sync metadata for monitoring';

-- ============================================================
-- 6. MATERIALIZED INDEX FOR SEARCH
-- ============================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS shared.mv_languages_search AS
SELECT
  code,
  name,
  is_enabled,
  to_tsvector('english', name) AS search_vector
FROM shared.languages
WHERE is_enabled = TRUE;

CREATE INDEX IF NOT EXISTS idx_mv_languages_search_vector 
  ON shared.mv_languages_search 
  USING GIN (search_vector);

COMMENT ON MATERIALIZED VIEW shared.mv_languages_search IS 'Materialized index for full-text search on language names';

-- ============================================================
-- 7. SYNC METADATA TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS shared.languages_sync_metadata (
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
    api_endpoint         VARCHAR(200)   DEFAULT '/data/languages',
    status               VARCHAR(20)    NOT NULL DEFAULT 'success',  -- success, partial, failed
    error_message        TEXT           NULL,

    CONSTRAINT pk_languages_sync_metadata PRIMARY KEY (sync_id)
);

COMMENT ON TABLE shared.languages_sync_metadata IS 'Comprehensive metadata and statistics for each languages sync operation';

CREATE INDEX IF NOT EXISTS idx_languages_sync_completed_at 
  ON shared.languages_sync_metadata (sync_completed_at DESC);

-- ============================================================
-- 8. MIGRATION COMPLETE
-- ============================================================

SELECT 'Languages static database migration completed successfully' AS status;