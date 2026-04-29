-- ============================================================
-- 20260313000001_add_currency_rounding.sql
-- Add cash rounding rules to shared.currencies table
-- for OpenExchangeRates currency import enhancement
-- ============================================================

-- Add cash_rounding column to store rounding rules
-- Values: NULL (no cash rounding), '0.01', '0.05', '0.10', etc.
ALTER TABLE shared.currencies
ADD COLUMN IF NOT EXISTS cash_rounding NUMERIC(10, 4) NULL,
ADD COLUMN IF NOT EXISTS rounding_mode VARCHAR(20) DEFAULT 'round_half_up';

COMMENT ON COLUMN shared.currencies.cash_rounding IS 'Cash rounding increment for this currency (e.g. 0.05 for 5 cent rounding); NULL means standard decimal precision applies';
COMMENT ON COLUMN shared.currencies.rounding_mode IS 'Rounding method: round_half_up (default), round_down, round_toward_zero, etc.';

-- Create index for queries filtering currencies by rounding rules
CREATE INDEX IF NOT EXISTS idx_currencies_rounding ON shared.currencies (cash_rounding, rounding_mode) WHERE cash_rounding IS NOT NULL;

-- Add index for efficient lookups by code (if not exists)
CREATE INDEX IF NOT EXISTS idx_currencies_code ON shared.currencies (code);
