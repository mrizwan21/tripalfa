-- ============================================================
-- 010_fx_analytics.sql
-- FX (Foreign Exchange) Analytics & Rate Management
-- Tracks currency conversions, exchange rates, and analytics
-- ============================================================

-- ============================================================
-- FX EXCHANGE RATES TABLE
-- Real-time and historical exchange rates
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.fx_rates (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency       CHAR(3)         NOT NULL,
    to_currency         CHAR(3)         NOT NULL,
    rate                NUMERIC(24, 10) NOT NULL,
    fee_percentage      NUMERIC(5, 2)   NOT NULL DEFAULT 2.00,  -- Default 2% for cross-currency
    source_name         VARCHAR(50)     NOT NULL DEFAULT 'OpenExchangeRates',
    is_cached           BOOLEAN         NOT NULL DEFAULT false,
    cache_ttl_seconds   INT             NOT NULL DEFAULT 3600,   -- 1 hour default
    last_updated_at     TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    fetched_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    created_at          TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Ensure we don't duplicate rate pairs
    CONSTRAINT uq_fx_rates_pair UNIQUE (from_currency, to_currency),
    
    -- Foreign keys to currencies table
    CONSTRAINT fk_fx_rates_from FOREIGN KEY (from_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT,
    CONSTRAINT fk_fx_rates_to FOREIGN KEY (to_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT
);

COMMENT ON TABLE shared.fx_rates IS 'Real-time FX exchange rates - maintains latest rate for each currency pair';
COMMENT ON COLUMN shared.fx_rates.rate IS 'Exchange rate: 1 unit of from_currency = rate units of to_currency';
COMMENT ON COLUMN shared.fx_rates.fee_percentage IS 'FX conversion fee (0 for same currency, 2 for cross-currency)';
COMMENT ON COLUMN shared.fx_rates.is_cached IS 'Whether this rate is cached from in-memory store';
COMMENT ON COLUMN shared.fx_rates.cache_ttl_seconds IS 'Cache time-to-live in seconds';
COMMENT ON COLUMN shared.fx_rates.last_updated_at IS 'Timestamp when rate was last refreshed from source';

-- ============================================================
-- FX CONVERSIONS TABLE
-- Log of all FX conversions performed
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.fx_conversions (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency           CHAR(3)         NOT NULL,
    to_currency             CHAR(3)         NOT NULL,
    from_amount             NUMERIC(18, 2)  NOT NULL,
    to_amount               NUMERIC(18, 2)  NOT NULL,
    fx_rate_used            NUMERIC(24, 10) NOT NULL,
    fx_fee_amount           NUMERIC(18, 2)  NOT NULL,
    fx_fee_percentage       NUMERIC(5, 2)   NOT NULL,
    total_debit             NUMERIC(18, 2)  NOT NULL,
    booking_id              UUID            NULL,
    user_id                 UUID            NULL,
    wallet_transaction_id   UUID            NULL,
    conversion_type         VARCHAR(50)     NOT NULL,  -- 'booking', 'transfer', 'settlement'
    status                  VARCHAR(20)     NOT NULL DEFAULT 'completed',  -- 'completed', 'failed', 'pending'
    metadata                JSONB           NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Foreign keys
    CONSTRAINT fk_fx_conversions_from FOREIGN KEY (from_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT,
    CONSTRAINT fk_fx_conversions_to FOREIGN KEY (to_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT
);

COMMENT ON TABLE shared.fx_conversions IS 'Log of all FX conversion transactions for audit and analytics';
COMMENT ON COLUMN shared.fx_conversions.total_debit IS 'Total amount debited including fees (from_amount + fee)';
COMMENT ON COLUMN shared.fx_conversions.conversion_type IS 'Type of conversion: booking, transfer, settlement';
COMMENT ON COLUMN shared.fx_conversions.status IS 'Transaction status: completed, failed, or pending';

CREATE INDEX idx_fx_conversions_booking_id ON shared.fx_conversions(booking_id);
CREATE INDEX idx_fx_conversions_user_id ON shared.fx_conversions(user_id);
CREATE INDEX idx_fx_conversions_pair ON shared.fx_conversions(from_currency, to_currency);
CREATE INDEX idx_fx_conversions_created_at ON shared.fx_conversions(created_at);
CREATE INDEX idx_fx_conversions_status ON shared.fx_conversions(status);

-- ============================================================
-- FX ANALYTICS SUMMARY TABLE
-- Real-time aggregated metrics for FX operations
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.fx_analytics (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency           CHAR(3)         NOT NULL,
    to_currency             CHAR(3)         NOT NULL,
    total_conversions       INT             NOT NULL DEFAULT 0,
    total_volume_from       NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    total_volume_to         NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    total_fees_collected    NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    average_rate            NUMERIC(24, 10) NOT NULL DEFAULT 0,
    min_rate                NUMERIC(24, 10) NULL,
    max_rate                NUMERIC(24, 10) NULL,
    average_fee_percentage  NUMERIC(5, 2)   NOT NULL DEFAULT 2.00,
    conversions_with_fee    INT             NOT NULL DEFAULT 0,
    conversions_without_fee INT             NOT NULL DEFAULT 0,
    last_conversion_at      TIMESTAMPTZ     NULL,
    period_start            TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    period_end              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Ensure one analytics record per pair
    CONSTRAINT uq_fx_analytics_pair UNIQUE (from_currency, to_currency),
    
    -- Foreign keys
    CONSTRAINT fk_fx_analytics_from FOREIGN KEY (from_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT,
    CONSTRAINT fk_fx_analytics_to FOREIGN KEY (to_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT
);

COMMENT ON TABLE shared.fx_analytics IS 'Real-time FX analytics aggregated by currency pair';
COMMENT ON COLUMN shared.fx_analytics.total_conversions IS 'Total number of conversions for this pair';
COMMENT ON COLUMN shared.fx_analytics.total_volume_from IS 'Total amount converted FROM this currency';
COMMENT ON COLUMN shared.fx_analytics.total_volume_to IS 'Total amount converted TO this currency';
COMMENT ON COLUMN shared.fx_analytics.average_rate IS 'Average FX rate across all conversions';

CREATE INDEX idx_fx_analytics_pair ON shared.fx_analytics(from_currency, to_currency);
CREATE INDEX idx_fx_analytics_updated_at ON shared.fx_analytics(updated_at);

-- ============================================================
-- FX DAILY ANALYTICS TABLE
-- Daily aggregated metrics for historical analysis
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.fx_daily_analytics (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    analytics_date          DATE            NOT NULL,
    from_currency           CHAR(3)         NOT NULL,
    to_currency             CHAR(3)         NOT NULL,
    total_conversions       INT             NOT NULL DEFAULT 0,
    total_volume_from       NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    total_volume_to         NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    total_fees_collected    NUMERIC(18, 2)  NOT NULL DEFAULT 0,
    opening_rate            NUMERIC(24, 10) NULL,
    closing_rate            NUMERIC(24, 10) NULL,
    min_rate                NUMERIC(24, 10) NULL,
    max_rate                NUMERIC(24, 10) NULL,
    average_rate            NUMERIC(24, 10) NULL,
    created_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ     NOT NULL DEFAULT NOW(),

    -- Ensure one daily record per pair per date
    CONSTRAINT uq_fx_daily_pair_date UNIQUE (analytics_date, from_currency, to_currency),
    
    -- Foreign keys
    CONSTRAINT fk_fx_daily_from FOREIGN KEY (from_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT,
    CONSTRAINT fk_fx_daily_to FOREIGN KEY (to_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT
);

COMMENT ON TABLE shared.fx_daily_analytics IS 'Daily FX analytics for historical tracking and reporting';

CREATE INDEX idx_fx_daily_analytics_date ON shared.fx_daily_analytics(analytics_date);
CREATE INDEX idx_fx_daily_analytics_pair ON shared.fx_daily_analytics(from_currency, to_currency);
CREATE INDEX idx_fx_daily_analytics_pair_date ON shared.fx_daily_analytics(from_currency, to_currency, analytics_date);

-- ============================================================
-- FX CACHE METADATA TABLE
-- Track cache statistics and performance
-- ============================================================
CREATE TABLE IF NOT EXISTS shared.fx_cache_metadata (
    id                      UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    from_currency           CHAR(3)         NOT NULL,
    to_currency             CHAR(3)         NOT NULL,
    rate                    NUMERIC(24, 10) NOT NULL,
    cached_at               TIMESTAMPTZ     NOT NULL DEFAULT NOW(),
    expires_at              TIMESTAMPTZ     NOT NULL,
    ttl_seconds             INT             NOT NULL DEFAULT 3600,
    hit_count               INT             NOT NULL DEFAULT 0,
    miss_count              INT             NOT NULL DEFAULT 0,
    last_hit_at             TIMESTAMPTZ     NULL,

    -- Ensure one cache entry per pair
    CONSTRAINT uq_fx_cache_pair UNIQUE (from_currency, to_currency),
    
    -- Foreign keys
    CONSTRAINT fk_fx_cache_from FOREIGN KEY (from_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT,
    CONSTRAINT fk_fx_cache_to FOREIGN KEY (to_currency) 
        REFERENCES shared.currencies(code) ON DELETE RESTRICT
);

COMMENT ON TABLE shared.fx_cache_metadata IS 'Cache statistics and metadata for FX rate optimization';
COMMENT ON COLUMN shared.fx_cache_metadata.hit_count IS 'Number of times this cached rate was used';
COMMENT ON COLUMN shared.fx_cache_metadata.miss_count IS 'Number of times cache was missed for this pair';

-- ============================================================
-- VIEWS FOR FX ANALYTICS
-- ============================================================

-- View: Top currency pairs by conversion volume
CREATE OR REPLACE VIEW shared.fx_top_pairs_by_volume AS
SELECT 
    from_currency,
    to_currency,
    total_conversions,
    total_volume_from,
    total_volume_to,
    total_fees_collected,
    average_rate,
    updated_at
FROM shared.fx_analytics
WHERE total_conversions > 0
ORDER BY total_conversions DESC;

COMMENT ON VIEW shared.fx_top_pairs_by_volume IS 'Top currency pairs sorted by conversion count';

-- View: FX analytics with currency names
CREATE OR REPLACE VIEW shared.fx_analytics_named AS
SELECT 
    fa.id,
    fa.from_currency,
    cf.name as from_currency_name,
    fa.to_currency,
    ct.name as to_currency_name,
    CONCAT(fa.from_currency, '/', fa.to_currency) as pair,
    fa.total_conversions,
    fa.total_volume_from,
    fa.total_volume_to,
    fa.total_fees_collected,
    fa.average_rate,
    fa.min_rate,
    fa.max_rate,
    fa.updated_at
FROM shared.fx_analytics fa
JOIN shared.currencies cf ON fa.from_currency = cf.code
JOIN shared.currencies ct ON fa.to_currency = ct.code;

COMMENT ON VIEW shared.fx_analytics_named IS 'FX analytics with human-readable currency names';

-- ============================================================
-- GRANTS (if using role-based access control)
-- ============================================================
-- GRANT SELECT ON shared.fx_rates TO readonly_user;
-- GRANT SELECT ON shared.fx_conversions TO readonly_user;
-- GRANT SELECT ON shared.fx_analytics TO readonly_user;
-- GRANT SELECT ON shared.fx_daily_analytics TO readonly_user;
-- GRANT SELECT ON shared.fx_cache_metadata TO readonly_user;
-- GRANT ALL ON shared.fx_rates TO write_user;
-- GRANT ALL ON shared.fx_conversions TO write_user;
-- GRANT ALL ON shared.fx_analytics TO write_user;
-- GRANT ALL ON shared.fx_daily_analytics TO write_user;
-- GRANT ALL ON shared.fx_cache_metadata TO write_user;

\echo '==> FX Analytics schema created successfully!'
