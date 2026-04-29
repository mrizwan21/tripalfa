-- ============================================================
-- 001_extensions.sql
-- Enable required PostgreSQL extensions
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";       -- UUID generation
CREATE EXTENSION IF NOT EXISTS "pg_trgm";         -- Trigram indexing for fuzzy text search
CREATE EXTENSION IF NOT EXISTS "unaccent";        -- Unaccented search support
CREATE EXTENSION IF NOT EXISTS "btree_gin";       -- GIN support for scalar types

-- Create schemas to namespace domains
CREATE SCHEMA IF NOT EXISTS shared;
CREATE SCHEMA IF NOT EXISTS hotel;
CREATE SCHEMA IF NOT EXISTS flight;

SET search_path = public, shared, hotel, flight;
