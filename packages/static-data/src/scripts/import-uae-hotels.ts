/**
 * UAE Hotels Import Script
 * 
 * This script specifically imports hotels from the United Arab Emirates
 * using the LITEAPI static data endpoints and saves them to the local
 * PostgreSQL database.
 * 
 * Usage: npm run import:uae
 */

import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import fs from "fs";
import path from "path";

// Load environment variables
dotenv.config();

const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || "prod_1ca7e299-f889-4462-8e32-ce421ab66a93";
const LITEAPI_BASE_URL = "https://api.liteapi.travel/v3.0";
const DB_NAME = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";
const SQL_TMP_FILE = "/tmp/uae_hotels_import.sql";

if (!LITEAPI_API_KEY) {
    console.error("Error: LITEAPI_API_KEY environment variable is required");
    process.exit(1);
}

const headers = {
    "X-API-Key": LITEAPI_API_KEY,
    "Content-Type": "application/json",
};

// PostgreSQL connection pool
const poolConfig: PoolConfig = {
    connectionString: DB_NAME,
};

if (process.env.NODE_ENV === 'production') {
    (poolConfig as any).max = 10;
    (poolConfig as any).idleTimeoutMillis = 30000;
    (poolConfig as any).connectionTimeoutMillis = 10000;
} else {
    (poolConfig as any).max = 5;
    (poolConfig as any).idleTimeoutMillis = 30000;
    (poolConfig as any).connectionTimeoutMillis = 10000;
}

const pool = new Pool(poolConfig);

async function fetchLiteData(endpoint: string) {
    const url = endpoint.startsWith('http') ? endpoint : `${LITEAPI_BASE_URL}${endpoint}`;
    console.log(`Fetching from ${url}...`);
    const response = await fetch(url, { headers });
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to fetch ${endpoint}: ${response.statusText} - ${error}`);
    }
    const json: any = await response.json();
    return json.data || json;
}

function runSqlBatch(queries: string[], batchSize = 50) {
    if (queries.length === 0) return;
    for (let i = 0; i < queries.length; i += batchSize) {
        const batch = queries.slice(i, i + batchSize);
        fs.writeFileSync(SQL_TMP_FILE, 'BEGIN;\n' + batch.join('\n') + '\nCOMMIT;');
        try {
            const { execSync } = require('child_process');
            execSync(`psql ${DB_NAME} -f ${SQL_TMP_FILE}`, { stdio: 'pipe' });
            console.log(`Batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(queries.length / batchSize)} completed successfully`);
        } catch (error: any) {
            console.error(`Batch insertion failed at index ${i}. First query: ${batch[0]?.substring(0, 100)}...`);
            console.error("Error details:", error.message);
            // If batch fails, try individual insertion for this batch
            if (batchSize > 1) {
                console.log("Retrying batch with smaller size...");
                runSqlBatch(batch, 1);
            }
        }
    }
}

function esc(val: any): string {
    if (val === null || val === undefined) return 'NULL';
    if (typeof val === 'string') return `'${val.replace(/'/g, "''")}'`;
    if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
    return val.toString();
}

async function ensureTablesExist() {
    console.log("Ensuring required tables exist...");

    const createTablesQuery = `
        -- Create hotel schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS hotel;
        
        -- Create countries table if it doesn't exist
        CREATE TABLE IF NOT EXISTS shared.countries (
            code        CHAR(2)      NOT NULL,
            name        VARCHAR(100) NOT NULL,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_countries PRIMARY KEY (code)
        );
        
        -- Create hotel chains table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.chains (
            id          INTEGER      NOT NULL,
            name        VARCHAR(200) NOT NULL,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_chains PRIMARY KEY (id)
        );
        
        -- Create hotel types table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.types (
            id          INTEGER      NOT NULL,
            name        VARCHAR(100) NOT NULL,
            created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            updated_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_types PRIMARY KEY (id)
        );
        
        -- Create hotel facilities table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.facilities (
            id            INTEGER       NOT NULL,
            name          VARCHAR(200)  NOT NULL,
            translations  JSONB         NULL,
            created_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
            updated_at    TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_facilities PRIMARY KEY (id)
        );
        
        -- Create IATA airports table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.iata_airports (
            code         CHAR(3)       NOT NULL,
            name         VARCHAR(200)  NOT NULL,
            latitude     DOUBLE PRECISION NULL,
            longitude    DOUBLE PRECISION NULL,
            country_code CHAR(2)       NULL,
            CONSTRAINT pk_iata_airports PRIMARY KEY (code)
        );
        
        -- Create cities table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.cities (
            id           BIGSERIAL    NOT NULL,
            country_code CHAR(2)      NOT NULL,
            city_name    VARCHAR(200) NOT NULL,
            created_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_liteapi_cities PRIMARY KEY (id),
            CONSTRAINT uq_liteapi_city UNIQUE (country_code, city_name)
        );
        
        -- Create hotels table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.hotels (
            id                        VARCHAR(20)   NOT NULL,
            name                      VARCHAR(300)  NOT NULL,
            description               TEXT          NULL,
            important_information     TEXT          NULL,
            country_code              CHAR(2)       NULL,
            city                      VARCHAR(200)  NULL,
            address                   VARCHAR(500)  NULL,
            zip                       VARCHAR(20)   NULL,
            latitude                  DOUBLE PRECISION NULL,
            longitude                 DOUBLE PRECISION NULL,
            nearest_airport_code      CHAR(3)       NULL,
            currency_code             CHAR(3)       NULL,
            stars                     NUMERIC(3,1)  NULL,
            chain_id                  INTEGER       NULL,
            hotel_type_id             INTEGER       NULL,
            rating                    NUMERIC(4,2)  NULL,
            review_count              INTEGER       NOT NULL DEFAULT 0,
            main_photo                TEXT          NULL,
            thumbnail                 TEXT          NULL,
            video_url                 TEXT          NULL,
            phone                     VARCHAR(50)   NULL,
            fax                       VARCHAR(50)   NULL,
            email                     VARCHAR(200)  NULL,
            checkin_start             VARCHAR(20)   NULL,
            checkin_end               VARCHAR(20)   NULL,
            checkout                  VARCHAR(20)   NULL,
            checkin_instructions      JSONB         NULL,
            checkin_special_instructions TEXT       NULL,
            parking_available         BOOLEAN       NULL,
            children_allowed          BOOLEAN       NULL,
            pets_allowed              BOOLEAN       NULL,
            group_room_min            NUMERIC(6,1)  NULL,
            accessibility_attributes  JSONB         NULL,
            semantic_tags             JSONB         NULL,
            semantic_persona          VARCHAR(200)  NULL,
            semantic_style            VARCHAR(200)  NULL,
            semantic_location_type    VARCHAR(200)  NULL,
            semantic_story            TEXT          NULL,
            roh_id                    INTEGER       NULL,
            is_deleted                BOOLEAN       NOT NULL DEFAULT FALSE,
            deleted_at                TIMESTAMPTZ   NULL,
            last_synced_at            TIMESTAMPTZ   NULL,
            created_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
            updated_at                TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotels PRIMARY KEY (id)
        );
        
        -- Create hotel images table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.images (
            id            BIGSERIAL    NOT NULL,
            hotel_id      VARCHAR(20)  NOT NULL,
            url           TEXT         NOT NULL,
            url_hd        TEXT         NULL,
            caption       TEXT         NULL,
            display_order INTEGER      NOT NULL DEFAULT 0,
            is_default    BOOLEAN      NOT NULL DEFAULT FALSE,
            created_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_images PRIMARY KEY (id)
        );
        
        -- Create hotel facility map table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.hotel_facility_map (
            hotel_id    VARCHAR(20)  NOT NULL,
            facility_id INTEGER      NOT NULL,
            CONSTRAINT pk_hotel_facility_map PRIMARY KEY (hotel_id, facility_id)
        );
        
        -- Create hotel rooms table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.rooms (
            id              INTEGER      NOT NULL,
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
            CONSTRAINT pk_hotel_rooms PRIMARY KEY (id)
        );
        
        -- Create room bed types table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.room_bed_types (
            id          BIGSERIAL    NOT NULL,
            room_id     INTEGER      NOT NULL,
            bed_type    VARCHAR(100) NULL,
            bed_size    VARCHAR(100) NULL,
            quantity    SMALLINT     NOT NULL DEFAULT 1,
            CONSTRAINT pk_room_bed_types PRIMARY KEY (id)
        );
        
        -- Create room amenities table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.room_amenities (
            amenity_id  INTEGER      NOT NULL,
            name        VARCHAR(200) NOT NULL,
            CONSTRAINT pk_room_amenities PRIMARY KEY (amenity_id)
        );
        
        -- Create room amenity map table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.room_amenity_map (
            room_id     INTEGER  NOT NULL,
            amenity_id  INTEGER  NOT NULL,
            sort_order  SMALLINT NOT NULL DEFAULT 0,
            CONSTRAINT pk_room_amenity_map PRIMARY KEY (room_id, amenity_id)
        );
        
        -- Create room photos table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.room_photos (
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
            CONSTRAINT pk_room_photos PRIMARY KEY (id)
        );
        
        -- Create hotel policies table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.policies (
            id              BIGSERIAL    NOT NULL,
            hotel_id        VARCHAR(20)  NOT NULL,
            policy_type     VARCHAR(100) NOT NULL,
            name            VARCHAR(200) NULL,
            description     TEXT         NULL,
            child_policy    TEXT         NULL,
            pet_policy      TEXT         NULL,
            parking_policy  TEXT         NULL,
            CONSTRAINT pk_hotel_policies PRIMARY KEY (id),
            CONSTRAINT uq_hotel_policy UNIQUE (hotel_id, policy_type)
        );
        
        -- Create hotel reviews table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.reviews (
            id              BIGSERIAL    NOT NULL,
            hotel_id        VARCHAR(20)  NOT NULL,
            average_score   NUMERIC(4,1) NULL,
            reviewer_country CHAR(2)     NULL,
            traveler_type   VARCHAR(100) NULL,
            reviewer_name   VARCHAR(200) NULL,
            review_date     TIMESTAMPTZ  NULL,
            headline        VARCHAR(500) NULL,
            language_code   VARCHAR(10)  NULL,
            pros            TEXT         NULL,
            cons            TEXT         NULL,
            source          VARCHAR(100) NULL,
            created_at      TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_reviews PRIMARY KEY (id)
        );
        
        -- Create sentiment analysis table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.sentiment_analysis (
            hotel_id      VARCHAR(20)  NOT NULL,
            pros          JSONB        NOT NULL DEFAULT '[]',
            cons          JSONB        NOT NULL DEFAULT '[]',
            categories    JSONB        NOT NULL DEFAULT '[]',
            updated_at    TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_sentiment PRIMARY KEY (hotel_id)
        );
        
        -- Create accessibility table if it doesn't exist
        CREATE TABLE IF NOT EXISTS hotel.accessibility (
            hotel_id     VARCHAR(20)  NOT NULL,
            attributes   JSONB        NULL,
            updated_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
            CONSTRAINT pk_hotel_accessibility PRIMARY KEY (hotel_id)
        );
    `;

    try {
        const { execSync } = require('child_process');
        fs.writeFileSync(SQL_TMP_FILE, createTablesQuery);
        execSync(`psql ${DB_NAME} -f ${SQL_TMP_FILE}`, { stdio: 'pipe' });
        console.log("Tables ensured successfully");
    } catch (error: any) {
        console.error("Error ensuring tables:", error.message);
        throw error;
    }
}

async function importUAEHotels() {
    console.log("Starting UAE Hotels Import...");

    // Ensure tables exist
    await ensureTablesExist();

    // 1. Import UAE Country
    console.log("1. Importing UAE Country...");
    const countries = await fetchLiteData("/data/countries");
    const uaeCountry = countries.find((c: any) => c.code === "AE");

    if (uaeCountry) {
        const countryQuery = `
            INSERT INTO shared.countries (code, name, created_at, updated_at)
            VALUES (${esc(uaeCountry.code)}, ${esc(uaeCountry.name)}, NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
        `;
        runSqlBatch([countryQuery]);
        console.log("✓ UAE country imported");
    }

    // 2. Import Reference Data (Chains, Types, Facilities)
    console.log("2. Importing Reference Data...");

    // Import Chains
    const chains = await fetchLiteData("/data/chains");
    const chainQueries = chains.map((c: any) => `
        INSERT INTO hotel.chains (id, name, created_at, updated_at)
        VALUES (${esc(c.id)}, ${esc(c.name)}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
    `);
    runSqlBatch(chainQueries);
    console.log("✓ Hotel chains imported");

    // Import Types
    const types = await fetchLiteData("/data/hotelTypes");
    const typeQueries = types.map((t: any) => `
        INSERT INTO hotel.types (id, name, created_at, updated_at)
        VALUES (${esc(t.id)}, ${esc(t.name)}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();
    `);
    runSqlBatch(typeQueries);
    console.log("✓ Hotel types imported");

    // Import Facilities
    const facilities = await fetchLiteData("/data/facilities");
    const facilityQueries = facilities.map((f: any) => `
        INSERT INTO hotel.facilities (id, name, translations, created_at, updated_at)
        VALUES (${esc(f.facility_id)}, ${esc(f.facility)}, ${esc(f.translations || null)}, NOW(), NOW())
        ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, translations = EXCLUDED.translations, updated_at = NOW();
    `);
    runSqlBatch(facilityQueries);
    console.log("✓ Hotel facilities imported");

    // 3. Import IATA Codes
    console.log("3. Importing IATA Codes...");
    const iataCodes = await fetchLiteData("/data/iataCodes");
    const iataQueries = iataCodes.map((i: any) => `
        INSERT INTO hotel.iata_airports (code, name, latitude, longitude, country_code)
        VALUES (${esc(i.code)}, ${esc(i.name)}, ${i.latitude || 'NULL'}, ${i.longitude || 'NULL'}, ${esc(i.countryCode)})
        ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, country_code = EXCLUDED.country_code;
    `);
    runSqlBatch(iataQueries);
    console.log("✓ IATA codes imported");

    // 4. Import UAE Cities
    console.log("4. Importing UAE Cities...");
    const uaeCities = await fetchLiteData("/data/cities?countryCode=AE");
    const cityQueries = uaeCities.map((c: any) => `
        INSERT INTO hotel.cities (country_code, city_name, created_at)
        VALUES ('AE', ${esc(c.name)}, NOW())
        ON CONFLICT (country_code, city_name) DO NOTHING;
    `);
    runSqlBatch(cityQueries);
    console.log("✓ UAE cities imported");

    // 5. Import Hotels for UAE
    console.log("5. Importing UAE Hotels...");

    // Get UAE IATA codes for major cities
    const uaeIataCodes = iataCodes.filter((i: any) => i.countryCode === "AE");
    console.log(`Found ${uaeIataCodes.length} IATA codes for UAE`);

    let totalHotelsImported = 0;

    for (const city of uaeIataCodes) {
        console.log(`\nImporting hotels for ${city.name} (${city.code})...`);

        try {
            const hotels = await fetchLiteData(`/data/hotels?countryCode=AE&iataCode=${city.code}`);
            console.log(`Found ${hotels.length} hotels in ${city.name}`);

            const hotelQueries = hotels.map((h: any) => {
                // Extract key information from hotel data
                const hotelQuery = `
                    INSERT INTO hotel.hotels (
                        id, name, description, important_information,
                        country_code, city, address, zip, latitude, longitude,
                        nearest_airport_code, currency_code, stars, chain_id,
                        hotel_type_id, rating, review_count, main_photo, thumbnail,
                        video_url, phone, fax, email, checkin_start, checkin_end,
                        checkout, checkin_instructions, checkin_special_instructions,
                        parking_available, children_allowed, pets_allowed,
                        group_room_min, accessibility_attributes, semantic_tags,
                        semantic_persona, semantic_style, semantic_location_type,
                        semantic_story, roh_id, is_deleted, deleted_at, last_synced_at,
                        created_at, updated_at
                    ) VALUES (
                        ${esc(h.id)}, ${esc(h.name)}, ${esc(h.description || null)},
                        ${esc(h.importantInformation || null)}, 'AE', ${esc(h.city || city.name)},
                        ${esc(h.address || null)}, ${esc(h.zip || null)},
                        ${h.latitude || 'NULL'}, ${h.longitude || 'NULL'},
                        ${esc(city.code)}, ${esc(h.currencyCode || null)},
                        ${h.starRating || 'NULL'}, ${h.chainId || 'NULL'},
                        ${h.hotelTypeId || 'NULL'}, ${h.rating || 'NULL'},
                        ${h.reviewCount || 0}, ${esc(h.mainPhoto || null)},
                        ${esc(h.thumbnail || null)}, ${esc(h.videoUrl || null)},
                        ${esc(h.phone || null)}, ${esc(h.fax || null)},
                        ${esc(h.email || null)}, ${esc(h.checkinStart || null)},
                        ${esc(h.checkinEnd || null)}, ${esc(h.checkout || null)},
                        ${esc(h.checkinInstructions || null)},
                        ${esc(h.checkinSpecialInstructions || null)},
                        ${h.parkingAvailable || 'NULL'}, ${h.childrenAllowed || 'NULL'},
                        ${h.petsAllowed || 'NULL'}, ${h.groupRoomMin || 'NULL'},
                        ${esc(h.accessibilityAttributes || null)},
                        ${esc(h.semanticTags || null)}, ${esc(h.semanticPersona || null)},
                        ${esc(h.semanticStyle || null)}, ${esc(h.semanticLocationType || null)},
                        ${esc(h.semanticStory || null)}, ${h.rohId || 'NULL'},
                        FALSE, NULL, NOW(), NOW(), NOW()
                    )
                    ON CONFLICT (id) DO UPDATE SET
                        name = EXCLUDED.name,
                        description = EXCLUDED.description,
                        important_information = EXCLUDED.important_information,
                        city = EXCLUDED.city,
                        address = EXCLUDED.address,
                        zip = EXCLUDED.zip,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        currency_code = EXCLUDED.currency_code,
                        stars = EXCLUDED.stars,
                        chain_id = EXCLUDED.chain_id,
                        hotel_type_id = EXCLUDED.hotel_type_id,
                        rating = EXCLUDED.rating,
                        review_count = EXCLUDED.review_count,
                        main_photo = EXCLUDED.main_photo,
                        thumbnail = EXCLUDED.thumbnail,
                        video_url = EXCLUDED.video_url,
                        phone = EXCLUDED.phone,
                        fax = EXCLUDED.fax,
                        email = EXCLUDED.email,
                        checkin_start = EXCLUDED.checkin_start,
                        checkin_end = EXCLUDED.checkin_end,
                        checkout = EXCLUDED.checkout,
                        checkin_instructions = EXCLUDED.checkin_instructions,
                        checkin_special_instructions = EXCLUDED.checkin_special_instructions,
                        parking_available = EXCLUDED.parking_available,
                        children_allowed = EXCLUDED.children_allowed,
                        pets_allowed = EXCLUDED.pets_allowed,
                        group_room_min = EXCLUDED.group_room_min,
                        accessibility_attributes = EXCLUDED.accessibility_attributes,
                        semantic_tags = EXCLUDED.semantic_tags,
                        semantic_persona = EXCLUDED.semantic_persona,
                        semantic_style = EXCLUDED.semantic_style,
                        semantic_location_type = EXCLUDED.semantic_location_type,
                        semantic_story = EXCLUDED.semantic_story,
                        roh_id = EXCLUDED.roh_id,
                        last_synced_at = NOW(),
                        updated_at = NOW();
                `;
                return hotelQuery;
            });

            runSqlBatch(hotelQueries);
            totalHotelsImported += hotels.length;
            console.log(`✓ Imported ${hotels.length} hotels from ${city.name}`);

        } catch (error: any) {
            console.error(`Failed to import hotels for ${city.name}:`, error.message);
        }
    }

    console.log(`\n=== IMPORT SUMMARY ===`);
    console.log(`Total hotels imported: ${totalHotelsImported}`);
    console.log(`Database: ${DB_NAME}`);
    console.log(`Import completed successfully!`);

    // Clean up temporary file
    if (fs.existsSync(SQL_TMP_FILE)) {
        fs.unlinkSync(SQL_TMP_FILE);
    }

    // Close database connection
    await pool.end();
}

// Run the import
if (import.meta.url === `file://${process.argv[1]}`) {
    importUAEHotels().catch((error) => {
        console.error("Import failed:", error);
        process.exit(1);
    });
}

export { importUAEHotels };