/* Ensure loyalty_programs has code and airline_id columns, unique index and FK */
BEGIN;

-- Add `code` column if missing
ALTER TABLE IF EXISTS loyalty_programs ADD COLUMN IF NOT EXISTS code VARCHAR(128);

-- Create unique index on code if missing (safe to run multiple times)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_class WHERE relname = 'idx_loyalty_programs_code_unique') THEN
    BEGIN
      CREATE UNIQUE INDEX idx_loyalty_programs_code_unique ON loyalty_programs(code);
    EXCEPTION WHEN duplicate_table THEN
      -- ignore if created concurrently
    END;
  END IF;
END$$;

-- Ensure airline_id exists
ALTER TABLE IF EXISTS loyalty_programs ADD COLUMN IF NOT EXISTS airline_id INTEGER;

-- Add FK constraint for airline_id if not present
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints tc
    JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
    WHERE tc.table_name = 'loyalty_programs' AND tc.constraint_type = 'FOREIGN KEY' AND kcu.column_name = 'airline_id'
  ) THEN
    BEGIN
      ALTER TABLE loyalty_programs ADD CONSTRAINT fk_loyalty_programs_airline FOREIGN KEY (airline_id) REFERENCES airlines(id) ON DELETE SET NULL;
    EXCEPTION WHEN duplicate_object THEN
      -- ignore
    END;
  END IF;
END$$;

COMMIT;
