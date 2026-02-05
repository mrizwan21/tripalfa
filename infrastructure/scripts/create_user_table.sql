-- Create minimal users table for storing preferences
-- Run against the same static database used by other static tables (e.g., staticdatabase)
-- Example:
--   psql -d staticdatabase -f scripts/create_user_table.sql

CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT,
  language TEXT DEFAULT 'English',
  currency TEXT DEFAULT 'USD',
  notifications BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  CONSTRAINT users_pkey PRIMARY KEY (id)
);

-- Upsert a sample user for local testing
INSERT INTO users (id, email, language, currency)
VALUES ('user_1', 'test@tripalfa.com', 'English', 'USD')
ON CONFLICT (id) DO NOTHING;

-- Trigger to update updated_at on change
CREATE OR REPLACE FUNCTION update_users_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger WHERE tgname = 'update_users_updated_at'
  ) THEN
    CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_users_updated_at();
  END IF;
END;
$$;