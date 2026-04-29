-- ============================================================
-- 20260313000002_sync_liteapi_currencies.sql
-- Sync liteapi_currencies table with rounding rules
-- Ensures frontend API has access to decimal precision and cash rounding
-- ============================================================

-- Add cash_rounding column to liteapi_currencies if not exists
ALTER TABLE public.liteapi_currencies
ADD COLUMN IF NOT EXISTS cash_rounding NUMERIC(10, 4) NULL,
ADD COLUMN IF NOT EXISTS rounding_mode VARCHAR(20) DEFAULT 'round_half_up';

COMMENT ON COLUMN public.liteapi_currencies.cash_rounding IS 'Cash rounding increment calculated from decimal precision; e.g., 0.01 for 2 decimals, 0.001 for 3 decimals';
COMMENT ON COLUMN public.liteapi_currencies.rounding_mode IS 'Rounding method: round_half_up (default)';

-- Create index for rounding lookups
CREATE INDEX IF NOT EXISTS idx_liteapi_currencies_rounding ON public.liteapi_currencies (cash_rounding) 
WHERE cash_rounding IS NOT NULL;
