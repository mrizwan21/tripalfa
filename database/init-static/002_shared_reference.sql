-- ============================================================
-- 002_shared_reference.sql
-- Shared reference tables used by both Hotel (LiteAPI) and
-- Flight (Duffel) domains, plus exchange rates.
-- ============================================================

-- ------------------------------------------------------------
-- COUNTRIES
-- Source: LiteAPI /data/countries + Duffel iata_country_code
-- ISO 3166-1 alpha-2
-- ------------------------------------------------------------
CREATE TABLE shared.countries (
    code        CHAR(2)      NOT NULL,          -- ISO-2 e.g. "US", "GB"
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_countries PRIMARY KEY (code)
);

COMMENT ON TABLE  shared.countries IS 'ISO 3166-1 alpha-2 country reference — sourced from LiteAPI /data/countries';
COMMENT ON COLUMN shared.countries.code IS 'Two-character ISO country code';

-- ------------------------------------------------------------
-- CURRENCIES
-- Source: LiteAPI /data/currencies + OpenExchangeRates
-- Includes rate-of-exchange (vs USD) and decimal precision
-- ------------------------------------------------------------
CREATE TABLE shared.currencies (
    code               CHAR(3)        NOT NULL,          -- ISO 4217 e.g. "USD", "EUR"
    name               VARCHAR(100)   NOT NULL,          -- "US Dollar"
    decimal_precision  SMALLINT       NOT NULL DEFAULT 2,-- 0=JPY, 2=USD, 3=KWD, 8=BTC
    rate_vs_usd        NUMERIC(24,10) NULL,               -- 1 USD = X of this currency
    rate_updated_at    TIMESTAMPTZ    NULL,               -- last OER refresh
    created_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_currencies PRIMARY KEY (code),
    CONSTRAINT chk_currency_decimal CHECK (decimal_precision >= 0 AND decimal_precision <= 8)
);

COMMENT ON TABLE  shared.currencies IS 'ISO 4217 currency reference with exchange-rate from OpenExchangeRates (base=USD)';
COMMENT ON COLUMN shared.currencies.rate_vs_usd        IS '1 USD expressed in this currency; e.g. EUR ≈ 0.848512';
COMMENT ON COLUMN shared.currencies.decimal_precision  IS 'ISO 4217 minor unit digits: 0=JPY, 2=USD/EUR, 3=KWD/BHD, 8=BTC';
COMMENT ON COLUMN shared.currencies.rate_updated_at    IS 'UTC timestamp of last successful OpenExchangeRates sync';

-- Junction: one currency can be used by many countries
CREATE TABLE shared.currency_countries (
    currency_code  CHAR(3)      NOT NULL,
    country_code   CHAR(2)      NOT NULL,

    CONSTRAINT pk_currency_countries PRIMARY KEY (currency_code, country_code),
    CONSTRAINT fk_cc_currency FOREIGN KEY (currency_code) REFERENCES shared.currencies (code) ON DELETE CASCADE,
    CONSTRAINT fk_cc_country  FOREIGN KEY (country_code)  REFERENCES shared.countries  (code) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- LANGUAGES
-- Source: LiteAPI /data/languages (ISO 639-1)
-- ------------------------------------------------------------
CREATE TABLE shared.languages (
    code        VARCHAR(10)  NOT NULL,   -- ISO 639-1 e.g. "en", "fr", "zh-TW"
    name        VARCHAR(100) NOT NULL,   -- "English", "French"
    is_enabled  BOOLEAN      NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_languages PRIMARY KEY (code)
);

COMMENT ON TABLE shared.languages IS 'Supported language codes for hotel content localisation — LiteAPI /data/languages';

-- ------------------------------------------------------------
-- EXCHANGE RATE AUDIT LOG
-- Keeps historical rates for each sync so trends can be tracked
-- ------------------------------------------------------------
CREATE TABLE shared.exchange_rate_history (
    id             BIGSERIAL      NOT NULL,
    currency_code  CHAR(3)        NOT NULL,
    rate_vs_usd    NUMERIC(24,10) NOT NULL,
    effective_at   TIMESTAMPTZ    NOT NULL,
    source         VARCHAR(50)    NOT NULL DEFAULT 'openexchangerates',
    created_at     TIMESTAMPTZ    NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_exchange_rate_history PRIMARY KEY (id),
    CONSTRAINT fk_erh_currency FOREIGN KEY (currency_code) REFERENCES shared.currencies (code) ON DELETE CASCADE
);

COMMENT ON TABLE shared.exchange_rate_history IS 'Immutable audit log of each OpenExchangeRates sync (base=USD)';

-- Index for time-series queries
CREATE INDEX idx_erh_currency_effective ON shared.exchange_rate_history (currency_code, effective_at DESC);
