-- ============================================================
-- 003_liteapi_hotel_domain.sql
-- All tables for the LiteAPI hotel static data:
--   hotel_chains, hotel_types, hotel_facilities,
--   iata_airports, liteapi_cities, hotels, hotel_images,
--   hotel_facility_map, hotel_rooms, hotel_room_bed_types,
--   hotel_room_amenities, hotel_room_amenity_map,
--   hotel_room_photos, hotel_policies, hotel_reviews,
--   hotel_sentiment_analysis, hotel_semantic_metadata
-- ============================================================

-- ------------------------------------------------------------
-- HOTEL CHAINS
-- Source: LiteAPI /data/chains
-- ------------------------------------------------------------
CREATE TABLE hotel.chains (
    id          INTEGER      NOT NULL,   -- LiteAPI numeric chain ID
    name        VARCHAR(200) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_chains PRIMARY KEY (id)
);

COMMENT ON TABLE hotel.chains IS 'Hotel brand/chain lookup — LiteAPI /data/chains';

-- ------------------------------------------------------------
-- HOTEL TYPES
-- Source: LiteAPI /data/hotelTypes
-- e.g. Resort, Boutique, Hostel, Apartment
-- ------------------------------------------------------------
CREATE TABLE hotel.types (
    id          INTEGER      NOT NULL,   -- LiteAPI numeric type ID
    name        VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_types PRIMARY KEY (id)
);

COMMENT ON TABLE hotel.types IS 'Hotel classification/type lookup — LiteAPI /data/hotelTypes';

-- ------------------------------------------------------------
-- HOTEL FACILITIES
-- Source: LiteAPI /data/facilities
-- Multi-language translations stored as JSONB
-- ------------------------------------------------------------
CREATE TABLE hotel.facilities (
    id            INTEGER       NOT NULL,   -- LiteAPI numeric facility ID
    name          VARCHAR(200)  NOT NULL,   -- English default name
    translations  JSONB         NULL,       -- { "fr": "Piscine", "de": "Schwimmbad", ... }
    created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_facilities PRIMARY KEY (id)
);

COMMENT ON TABLE  hotel.facilities IS 'Hotel amenity/facility lookup with multilingual translations — LiteAPI /data/facilities';
COMMENT ON COLUMN hotel.facilities.translations IS 'JSONB map of ISO-639-1 code → localised name';

CREATE INDEX idx_hotel_facilities_translations ON hotel.facilities USING GIN (translations);

-- ------------------------------------------------------------
-- IATA AIRPORTS (LiteAPI reference)
-- Source: LiteAPI /data/iataCodes
-- Used to link hotels to nearby airports
-- ------------------------------------------------------------
CREATE TABLE hotel.iata_airports (
    code         CHAR(3)       NOT NULL,   -- 3-letter IATA code e.g. "LHR"
    name         VARCHAR(200)  NOT NULL,
    latitude     DOUBLE PRECISION NULL,
    longitude    DOUBLE PRECISION NULL,
    country_code CHAR(2)       NULL,

    CONSTRAINT pk_iata_airports PRIMARY KEY (code),
    CONSTRAINT fk_iata_country FOREIGN KEY (country_code) REFERENCES shared.countries (code) ON DELETE SET NULL
);

COMMENT ON TABLE hotel.iata_airports IS 'IATA airport codes used for hotel proximity search — LiteAPI /data/iataCodes';

-- ------------------------------------------------------------
-- LITEAPI CITIES
-- Source: LiteAPI /data/cities (requires countryCode param)
-- Each row = one city in one country
-- ------------------------------------------------------------
CREATE TABLE hotel.cities (
    id           BIGSERIAL    NOT NULL,
    country_code CHAR(2)      NOT NULL,
    city_name    VARCHAR(200) NOT NULL,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_liteapi_cities PRIMARY KEY (id),
    CONSTRAINT uq_liteapi_city  UNIQUE (country_code, city_name),
    CONSTRAINT fk_city_country  FOREIGN KEY (country_code) REFERENCES shared.countries (code) ON DELETE CASCADE
);

COMMENT ON TABLE hotel.cities IS 'Cities per country for hotel search — LiteAPI /data/cities';

CREATE INDEX idx_hotel_cities_country ON hotel.cities (country_code);

-- ------------------------------------------------------------
-- HOTELS  (main table)
-- Sources:
--   LiteAPI /data/hotels  — list & basic metadata
--   LiteAPI /data/hotel   — full detail (merges additional fields)
-- ------------------------------------------------------------
CREATE TABLE hotel.hotels (
    id                        VARCHAR(20)   NOT NULL,   -- LiteAPI hotel ID e.g. "lp1897"
    name                      VARCHAR(300)  NOT NULL,
    description               TEXT          NULL,
    important_information     TEXT          NULL,

    -- Location
    country_code              CHAR(2)       NULL,
    city                      VARCHAR(200)  NULL,
    address                   VARCHAR(500)  NULL,
    zip                       VARCHAR(20)   NULL,
    latitude                  DOUBLE PRECISION NULL,
    longitude                 DOUBLE PRECISION NULL,
    nearest_airport_code      CHAR(3)       NULL,       -- FK iata_airports

    -- Classification
    currency_code             CHAR(3)       NULL,
    stars                     NUMERIC(3,1)  NULL,       -- e.g. 3.0, 4.5
    chain_id                  INTEGER       NULL,
    hotel_type_id             INTEGER       NULL,

    -- Ratings & reviews
    rating                    NUMERIC(4,2)  NULL,       -- 0–10
    review_count              INTEGER       NOT NULL DEFAULT 0,

    -- Media
    main_photo                TEXT          NULL,
    thumbnail                 TEXT          NULL,
    video_url                 TEXT          NULL,

    -- Contact
    phone                     VARCHAR(50)   NULL,
    fax                       VARCHAR(50)   NULL,
    email                     VARCHAR(200)  NULL,

    -- Check-in / Check-out
    checkin_start             VARCHAR(20)   NULL,       -- "04:00 PM"
    checkin_end               VARCHAR(20)   NULL,       -- "12:00 AM"
    checkout                  VARCHAR(20)   NULL,       -- "11:00 AM"
    checkin_instructions      JSONB         NULL,       -- array of instruction strings
    checkin_special_instructions TEXT       NULL,

    -- Policies (booleans for quick filters)
    parking_available         BOOLEAN       NULL,
    children_allowed          BOOLEAN       NULL,
    pets_allowed              BOOLEAN       NULL,
    group_room_min            NUMERIC(6,1)  NULL,

    -- Accessibility (compact attributes from list endpoint)
    accessibility_attributes  JSONB         NULL,

    -- Semantic AI metadata (LiteAPI semantic-search)
    semantic_tags             JSONB         NULL,       -- [] of tag strings
    semantic_persona          VARCHAR(200)  NULL,
    semantic_style            VARCHAR(200)  NULL,
    semantic_location_type    VARCHAR(200)  NULL,
    semantic_story            TEXT          NULL,

    -- Internal
    roh_id                    INTEGER       NULL,       -- Room of House ID
    is_deleted                BOOLEAN       NOT NULL DEFAULT FALSE,
    deleted_at                TIMESTAMPTZ   NULL,
    last_synced_at            TIMESTAMPTZ   NULL,
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotels                PRIMARY KEY (id),
    CONSTRAINT fk_hotel_country         FOREIGN KEY (country_code) REFERENCES shared.countries (code) ON DELETE SET NULL
    -- FKs on chain_id, hotel_type_id, nearest_airport_code intentionally omitted:
    -- API data references IDs not guaranteed to be in the lookup tables
);

COMMENT ON TABLE  hotel.hotels IS 'Core hotel catalogue — merged from LiteAPI /data/hotels (list) + /data/hotel (detail)';
COMMENT ON COLUMN hotel.hotels.id                     IS 'LiteAPI hotel identifier e.g. lp1897';
COMMENT ON COLUMN hotel.hotels.accessibility_attributes IS 'Raw JSON from LiteAPI accessibilityAttributes field';
COMMENT ON COLUMN hotel.hotels.semantic_tags           IS 'AI-generated tags from /data/hotels/semantic-search';
COMMENT ON COLUMN hotel.hotels.roh_id                  IS 'LiteAPI Room-of-House ID for cross-referencing';

-- ------------------------------------------------------------
-- HOTEL IMAGES
-- Source: LiteAPI /data/hotel → hotelImages
-- ------------------------------------------------------------
CREATE TABLE hotel.images (
    id            BIGSERIAL    NOT NULL,
    hotel_id      VARCHAR(20)  NOT NULL,
    url           TEXT         NOT NULL,
    url_hd        TEXT         NULL,
    caption       TEXT         NULL,
    display_order INTEGER      NOT NULL DEFAULT 0,
    is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
    created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_images    PRIMARY KEY (id),
    CONSTRAINT fk_img_hotel       FOREIGN KEY (hotel_id) REFERENCES hotel.hotels (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- HOTEL ↔ FACILITY  (M:N junction)
-- Derived from hotels.facilityIds in list response
-- ------------------------------------------------------------
CREATE TABLE hotel.hotel_facility_map (
    hotel_id    VARCHAR(20)  NOT NULL,
    facility_id INTEGER      NOT NULL,

    CONSTRAINT pk_hotel_facility_map PRIMARY KEY (hotel_id, facility_id),
    CONSTRAINT fk_hfm_hotel    FOREIGN KEY (hotel_id)    REFERENCES hotel.hotels    (id) ON DELETE CASCADE
    -- No FK on facility_id: facilities API returns null IDs so the table may be sparse
);

-- ------------------------------------------------------------
-- HOTEL ROOMS
-- Source: LiteAPI /data/hotel → rooms
-- ------------------------------------------------------------
CREATE TABLE hotel.rooms (
    id              INTEGER      NOT NULL,   -- LiteAPI room id (numeric)
    hotel_id        VARCHAR(20)  NOT NULL,
    room_name       VARCHAR(300) NULL,
    description     TEXT         NULL,
    size_sqm        NUMERIC(8,2) NULL,
    size_unit       VARCHAR(10)  NULL DEFAULT 'm2',
    max_adults      SMALLINT     NULL,
    max_children    SMALLINT     NULL,
    max_occupancy   SMALLINT     NULL,
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_rooms PRIMARY KEY (id),
    CONSTRAINT fk_room_hotel  FOREIGN KEY (hotel_id) REFERENCES hotel.hotels (id) ON DELETE CASCADE
);

COMMENT ON TABLE hotel.rooms IS 'Hotel room catalogue — LiteAPI /data/hotel → rooms[]';

-- ------------------------------------------------------------
-- HOTEL ROOM  BED TYPES
-- Source: LiteAPI /data/hotel → rooms[].bedTypes
-- ------------------------------------------------------------
CREATE TABLE hotel.room_bed_types (
    id          BIGSERIAL    NOT NULL,
    room_id     INTEGER      NOT NULL,
    bed_type    VARCHAR(100) NULL,   -- "Large bed (King size)"
    bed_size    VARCHAR(100) NULL,   -- "151-180cm wide"
    quantity    SMALLINT     NOT NULL DEFAULT 1,

    CONSTRAINT pk_room_bed_types PRIMARY KEY (id),
    CONSTRAINT fk_rbt_room FOREIGN KEY (room_id) REFERENCES hotel.rooms (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- ROOM AMENITIES  (lookup)
-- Source: LiteAPI /data/hotel → rooms[].roomAmenities
-- ------------------------------------------------------------
CREATE TABLE hotel.room_amenities (
    amenity_id  INTEGER      NOT NULL,
    name        VARCHAR(200) NOT NULL,

    CONSTRAINT pk_room_amenities PRIMARY KEY (amenity_id)
);

COMMENT ON TABLE hotel.room_amenities IS 'Amenity reference — LiteAPI room.roomAmenities[].amenitiesId';

-- ------------------------------------------------------------
-- ROOM ↔ AMENITY  (M:N junction)
-- ------------------------------------------------------------
CREATE TABLE hotel.room_amenity_map (
    room_id     INTEGER  NOT NULL,
    amenity_id  INTEGER  NOT NULL,
    sort_order  SMALLINT NOT NULL DEFAULT 0,

    CONSTRAINT pk_room_amenity_map PRIMARY KEY (room_id, amenity_id),
    CONSTRAINT fk_ram_room    FOREIGN KEY (room_id)    REFERENCES hotel.rooms         (id)         ON DELETE CASCADE,
    CONSTRAINT fk_ram_amenity FOREIGN KEY (amenity_id) REFERENCES hotel.room_amenities (amenity_id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- HOTEL ROOM PHOTOS
-- Source: LiteAPI /data/hotel → rooms[].photos
-- ------------------------------------------------------------
CREATE TABLE hotel.room_photos (
    id                  BIGSERIAL    NOT NULL,
    room_id             INTEGER      NOT NULL,
    url                 TEXT         NOT NULL,
    url_hd              TEXT         NULL,
    description         TEXT         NULL,
    image_class1        VARCHAR(100) NULL,
    image_class2        VARCHAR(100) NULL,
    failover_url        TEXT         NULL,
    is_main             BOOLEAN      NOT NULL DEFAULT FALSE,
    score               NUMERIC(6,4) NULL,
    class_id            INTEGER      NULL,
    class_order         INTEGER      NULL,

    CONSTRAINT pk_room_photos PRIMARY KEY (id),
    CONSTRAINT fk_rp_room FOREIGN KEY (room_id) REFERENCES hotel.rooms (id) ON DELETE CASCADE
);

-- ------------------------------------------------------------
-- HOTEL POLICIES
-- Source: LiteAPI /data/hotel → policies
-- ------------------------------------------------------------
CREATE TABLE hotel.policies (
    id              BIGSERIAL    NOT NULL,
    hotel_id        VARCHAR(20)  NOT NULL,
    policy_type     VARCHAR(100) NOT NULL,   -- "POLICY_HOTEL_INTERNET", "POLICY_CHILDREN"…
    name            VARCHAR(200) NULL,
    description     TEXT         NULL,
    child_policy    TEXT         NULL,
    pet_policy      TEXT         NULL,
    parking_policy  TEXT         NULL,

    CONSTRAINT pk_hotel_policies PRIMARY KEY (id),
    CONSTRAINT fk_policy_hotel  FOREIGN KEY (hotel_id) REFERENCES hotel.hotels (id) ON DELETE CASCADE,
    CONSTRAINT uq_hotel_policy  UNIQUE (hotel_id, policy_type)
);

-- ------------------------------------------------------------
-- HOTEL REVIEWS
-- Source: LiteAPI /data/reviews
-- ------------------------------------------------------------
CREATE TABLE hotel.reviews (
    id              BIGSERIAL    NOT NULL,
    hotel_id        VARCHAR(20)  NOT NULL,
    average_score   NUMERIC(4,1) NULL,        -- 0–10
    reviewer_country CHAR(2)     NULL,
    traveler_type   VARCHAR(100) NULL,         -- "solo traveller", "business", "couple"
    reviewer_name   VARCHAR(200) NULL,
    review_date     TIMESTAMPTZ  NULL,
    headline        VARCHAR(500) NULL,
    language_code   VARCHAR(10)  NULL,
    pros            TEXT         NULL,
    cons            TEXT         NULL,
    source          VARCHAR(100) NULL,         -- "Nuitee", "Tripadvisor"
    created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_reviews PRIMARY KEY (id),
    CONSTRAINT fk_review_hotel    FOREIGN KEY (hotel_id)      REFERENCES hotel.hotels    (id) ON DELETE CASCADE,
    CONSTRAINT fk_review_language FOREIGN KEY (language_code) REFERENCES shared.languages (code) ON DELETE SET NULL
);

COMMENT ON TABLE hotel.reviews IS 'Guest reviews — LiteAPI /data/reviews';

-- ------------------------------------------------------------
-- HOTEL SENTIMENT ANALYSIS
-- Source: LiteAPI /data/reviews (getSentiment=true) or /data/hotel
-- One row per hotel (upserted on sync)
-- ------------------------------------------------------------
CREATE TABLE hotel.sentiment_analysis (
    hotel_id      VARCHAR(20)  NOT NULL,
    pros          JSONB        NOT NULL DEFAULT '[]',   -- array of strings
    cons          JSONB        NOT NULL DEFAULT '[]',
    categories    JSONB        NOT NULL DEFAULT '[]',   -- [{name, rating, description}]
    updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_sentiment PRIMARY KEY (hotel_id),
    CONSTRAINT fk_sentiment_hotel FOREIGN KEY (hotel_id) REFERENCES hotel.hotels (id) ON DELETE CASCADE
);

COMMENT ON TABLE hotel.sentiment_analysis IS 'AI sentiment analysis from LiteAPI — hotel pros/cons/category ratings';

CREATE INDEX idx_sentiment_categories ON hotel.sentiment_analysis USING GIN (categories);

-- ------------------------------------------------------------
-- HOTEL ACCESSIBILITY
-- Source: LiteAPI /data/hotel → accessibility object
-- Detailed WCAG-level attributes (advancedAccessibilityOnly=true)
-- ------------------------------------------------------------
CREATE TABLE hotel.accessibility (
    hotel_id     VARCHAR(20)  NOT NULL,
    attributes   JSONB        NULL,    -- complete accessibility object from API
    updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),

    CONSTRAINT pk_hotel_accessibility PRIMARY KEY (hotel_id),
    CONSTRAINT fk_access_hotel FOREIGN KEY (hotel_id) REFERENCES hotel.hotels (id) ON DELETE CASCADE
);
