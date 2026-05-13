-- Enable pg_stat_statements extension for Postgres monitoring
CREATE EXTENSION IF NOT EXISTS pg_stat_statements;

-- Verify installation
SELECT * FROM pg_stat_statements LIMIT 5;
