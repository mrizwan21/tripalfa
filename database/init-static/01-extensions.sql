-- =============================================================================
-- 01-extensions.sql
-- Enable PostgreSQL extensions for the static database
-- Runs automatically on first container start via docker-entrypoint-initdb.d
-- =============================================================================

-- pg_trgm: Trigram-based text search for LIKE/ILIKE queries
-- Enables GIN indexes that dramatically speed up pattern matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;
