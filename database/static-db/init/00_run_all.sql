-- ============================================================
-- 00_run_all.sql
-- Orchestrator script — executed by Docker init or manual psql
-- Runs all schema files in order.
-- ============================================================

\echo '==> 001: Extensions & schemas'
\i /docker-entrypoint-initdb.d/001_extensions.sql

\echo '==> 002: Shared reference tables'
\i /docker-entrypoint-initdb.d/002_shared_reference.sql

\echo '==> 003: LiteAPI hotel domain'
\i /docker-entrypoint-initdb.d/003_liteapi_hotel_domain.sql

\echo '==> 004: Duffel flight domain'
\i /docker-entrypoint-initdb.d/004_duffel_flight_domain.sql

\echo '==> 005: Performance indexes'
\i /docker-entrypoint-initdb.d/005_indexes.sql

\echo '==> 006: Convenience views'
\i /docker-entrypoint-initdb.d/006_views.sql

\echo '==> Static database schema initialised successfully!'
