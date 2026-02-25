-- ============================================================
-- 004_duffel_flight_domain.sql
-- All tables for Duffel flight static data:
--   duffel_airlines, duffel_aircraft, duffel_cities,
--   duffel_airports, duffel_city_airport_map,
--   duffel_loyalty_programmes, duffel_places
-- ============================================================

-- ------------------------------------------------------------
-- AIRLINES
-- Source: Duffel GET /air/airlines
-- ------------------------------------------------------------
CREATE TABLE flight.airlines (
    id                         VARCHAR(50)   NOT NULL,   -- Duffel ID e.g. "arl_00001876aqC8c5umZmrRds"
    iata_code                  CHAR(2)       NULL,       -- nullable for non-IATA carriers
    name                       VARCHAR(200)  NOT NULL,
    logo_symbol_url            TEXT          NULL,
    logo_lockup_url            TEXT          NULL,
    conditions_of_carriage_url TEXT          NULL,
    created_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                 TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_duffel_airlines     PRIMARY KEY (id),
    CONSTRAINT uq_airline_iata_code   UNIQUE (iata_code)  -- partial: only where not null
);

COMMENT ON TABLE  flight.airlines IS 'Airline reference — Duffel GET /air/airlines';
COMMENT ON COLUMN flight.airlines.id       IS 'Duffel internal ID e.g. arl_00001876aqC8c5umZmrRds';
COMMENT ON COLUMN flight.airlines.iata_code IS '2-letter IATA code; NULL for non-IATA carriers';

-- Drop the unique constraint and replace with partial unique index
ALTER TABLE flight.airlines DROP CONSTRAINT IF EXISTS uq_airline_iata_code;
CREATE UNIQUE INDEX uq_airline_iata_code ON flight.airlines (iata_code) WHERE iata_code IS NOT NULL;

-- ------------------------------------------------------------
-- AIRCRAFT
-- Source: Duffel GET /air/aircraft
-- ------------------------------------------------------------
CREATE TABLE flight.aircraft (
    id          VARCHAR(50)   NOT NULL,   -- Duffel ID e.g. "arc_00009UhD4ongolulWd91Ky"
    iata_code   VARCHAR(10)   NOT NULL,   -- 3-char IATA e.g. "380"
    name        VARCHAR(200)  NOT NULL,   -- "Airbus Industries A380"
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_duffel_aircraft  PRIMARY KEY (id),
    CONSTRAINT uq_aircraft_iata    UNIQUE (iata_code)
);

COMMENT ON TABLE flight.aircraft IS 'Aircraft type reference — Duffel GET /air/aircraft';

-- ------------------------------------------------------------
-- CITIES (Duffel metropolitan areas)
-- Source: Duffel GET /air/cities
-- Note: distinct from hotel.cities which is LiteAPI-sourced
-- ------------------------------------------------------------
CREATE TABLE flight.cities (
    id                  VARCHAR(20)   NOT NULL,   -- Duffel ID e.g. "cit_lon_gb"
    iata_code           CHAR(3)       NOT NULL,   -- 3-letter city IATA code e.g. "LON"
    name                VARCHAR(200)  NOT NULL,
    iata_country_code   CHAR(2)       NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_duffel_cities PRIMARY KEY (id),
    CONSTRAINT uq_duffel_city_iata UNIQUE (iata_code)
    -- No FK on iata_country_code: Duffel uses IATA country codes (e.g. XK=Kosovo)
    -- that are not always present in shared.countries (ISO 3166-1 from LiteAPI)
);

COMMENT ON TABLE flight.cities IS 'IATA metropolitan city areas — Duffel GET /air/cities';

-- ------------------------------------------------------------
-- AIRPORTS
-- Source: Duffel GET /air/airports
-- ------------------------------------------------------------
CREATE TABLE flight.airports (
    id                  VARCHAR(20)   NOT NULL,   -- Duffel ID e.g. "arp_lhr_gb"
    iata_code           CHAR(3)       NOT NULL,   -- 3-letter airport IATA e.g. "LHR"
    icao_code           CHAR(4)       NULL,       -- 4-char ICAO e.g. "EGLL"
    name                VARCHAR(200)  NOT NULL,
    iata_city_code      CHAR(3)       NULL,       -- parent city IATA code
    city_id             VARCHAR(20)   NULL,       -- FK flight.cities
    iata_country_code   CHAR(2)       NULL,
    city_name           VARCHAR(200)  NULL,       -- denormalised city name for convenience
    latitude            DOUBLE PRECISION NULL,
    longitude           DOUBLE PRECISION NULL,
    time_zone           VARCHAR(100)  NULL,       -- tz database name e.g. "Europe/London"
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_duffel_airports    PRIMARY KEY (id),
    CONSTRAINT uq_duffel_airport_iata UNIQUE (iata_code),
    CONSTRAINT fk_airport_city        FOREIGN KEY (city_id) REFERENCES flight.cities   (id) ON DELETE SET NULL
    -- No FK on iata_country_code: Duffel uses IATA country codes not always in shared.countries
);

COMMENT ON TABLE  flight.airports IS 'Airport reference — Duffel GET /air/airports';
COMMENT ON COLUMN flight.airports.city_id IS 'FK to flight.cities; NULL for airports not assigned to a metropolitan area';

-- ------------------------------------------------------------
-- PLACES  (union of airports + cities for search suggestions)
-- Source: Duffel GET /places/suggestions
-- Snapshot table so we can search without hitting the API each time
-- ------------------------------------------------------------
CREATE TABLE flight.places (
    id                  VARCHAR(20)   NOT NULL,   -- Duffel place ID
    type                VARCHAR(10)   NOT NULL,   -- "airport" | "city"
    iata_code           CHAR(3)       NOT NULL,
    name                VARCHAR(200)  NOT NULL,
    iata_city_code      CHAR(3)       NULL,
    city_name           VARCHAR(200)  NULL,
    iata_country_code   CHAR(2)       NULL,
    icao_code           CHAR(4)       NULL,
    latitude            DOUBLE PRECISION NULL,
    longitude           DOUBLE PRECISION NULL,
    time_zone           VARCHAR(100)  NULL,
    created_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_duffel_places  PRIMARY KEY (id),
    CONSTRAINT chk_place_type    CHECK (type IN ('airport', 'city'))
    -- No FK on iata_country_code: Duffel uses IATA country codes absent from shared.countries
    -- No unique on iata_code: airports and cities can share the same IATA code
);

COMMENT ON TABLE flight.places IS 'Unified place search table (airports + cities) — built from Duffel /places/suggestions crawl';

-- Full-text search index on places name/iata
CREATE INDEX idx_places_name_trgm ON flight.places USING GIN (name gin_trgm_ops);
CREATE INDEX idx_places_iata_trgm ON flight.places USING GIN (iata_code gin_trgm_ops);

-- ------------------------------------------------------------
-- LOYALTY PROGRAMMES
-- Source: Duffel GET /air/loyalty_programmes
-- programme_type distinguishes flight vs hotel programmes
-- (Duffel exposes both in the same endpoint)
-- ------------------------------------------------------------
CREATE TABLE flight.loyalty_programmes (
    id               VARCHAR(50)   NOT NULL,   -- Duffel ID e.g. "loy_00001876aqC8c5umZmrRds"
    name             VARCHAR(200)  NOT NULL,
    alliance         VARCHAR(100)  NULL,       -- "OneWorld", "Star Alliance", null
    logo_url         TEXT          NULL,
    owner_airline_id VARCHAR(50)   NULL,       -- FK flight.airlines
    programme_type   VARCHAR(10)   NOT NULL DEFAULT 'flight',  -- "flight" | "hotel"
    created_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at       TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_loyalty_programmes     PRIMARY KEY (id),
    CONSTRAINT chk_programme_type        CHECK (programme_type IN ('flight', 'hotel'))
    -- No FK on owner_airline_id: some programmes reference IDs not present in airlines table
);

COMMENT ON TABLE  flight.loyalty_programmes IS 'Airline & hotel loyalty programmes — Duffel GET /air/loyalty_programmes';
COMMENT ON COLUMN flight.loyalty_programmes.programme_type IS '"flight" or "hotel" — discriminator since Duffel serves both';
COMMENT ON COLUMN flight.loyalty_programmes.owner_airline_id IS 'FK to flight.airlines; NULL for hotel loyalty programmes';

CREATE INDEX idx_loyalty_type ON flight.loyalty_programmes (programme_type);
