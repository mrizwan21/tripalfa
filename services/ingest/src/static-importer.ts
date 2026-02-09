import axios from 'axios';
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';
import * as stringSimilarity from 'string-similarity';
import { findOrCreateCanonicalHotel, HotelData } from './mapping-utils';
import { HotelbedsImporter } from './hotelbeds-importer';
import { ingestGiataHotels } from './giata-importer';
import { runImports as ingestHotelstonHotels } from './hotelston-importer';
import { fetchAndSaveRates } from './fx-fetcher';

declare let require: any;
declare let module: any;

// Load .env from project root (two levels up)
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

// Supplier API Config
const DUFFEL_API_KEY = process.env.DUFFEL_TEST_API_KEY;
const LITEAPI_API_KEY = process.env.LITEAPI_TEST_API_KEY;
const OPENEXCHANGE_API_KEY = '328ae500da7f485cad0ba5b48d33265a';
const AMADEUS_API_KEY = 'ysooMMHlsqpHubLEW0AGwraAKLboqFw6';
const AMADEUS_API_SECRET = '64gvpnvvNOqp2k9K';
const AMADEUS_BASE_URL = 'https://test.api.amadeus.com';
const HOTELBEDS_API_KEY = process.env.HOTELBEDS_API_KEY;
const HOTELBEDS_API_SECRET = process.env.HOTELBEDS_API_SECRET;
const HOTELBEDS_API_KEY_2 = process.env.HOTELBEDS_API_KEY_2 || 'YOUR_SECOND_API_KEY';
const HOTELBEDS_API_SECRET_2 = process.env.HOTELBEDS_API_SECRET_2 || 'YOUR_SECOND_API_SECRET';

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const pool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});

// Hubwayz Config
const HUBWAYZ_BASE_URL = 'https://static-data.innstant-servers.com';
const HUBWAYZ_API_KEY = process.env.INNSTANT_API_KEY || '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';

async function ingestHotelbedsHotels() {
    const limit = process.argv[3] ? parseInt(process.argv[3].split('=')[1]) : undefined;

    const credentials = [];
    if (HOTELBEDS_API_KEY && HOTELBEDS_API_SECRET) {
        credentials.push({ apiKey: HOTELBEDS_API_KEY, secret: HOTELBEDS_API_SECRET });
    }
    if (HOTELBEDS_API_KEY_2 && HOTELBEDS_API_SECRET_2 && HOTELBEDS_API_KEY_2 !== 'YOUR_SECOND_API_KEY') {
        credentials.push({ apiKey: HOTELBEDS_API_KEY_2, secret: HOTELBEDS_API_SECRET_2 });
    }

    if (credentials.length === 0) {
        throw new Error('No Hotelbeds credentials found in .env');
    }

    const importer = new HotelbedsImporter(pool, credentials);
    await importer.ingestHotels(limit);
}

async function main() {
    console.log('--- Starting Static Data Ingestion ---');

    const ingestType = process.argv[2]; // Optional: airports, airlines, aircraft, hotels, currencies, amadeus, amadeus-bulk

    try {
        if (!ingestType || ingestType === 'amadeus' || ingestType === 'amadeus-bulk') {
            console.log('✈️ Ingesting Amadeus Flight Data...');
            if (ingestType === 'amadeus-bulk') {
                await ingestAmadeusBulk();
            } else {
                await ingestAmadeusFlightData();
            }
        }

        if (ingestType === 'currencies') {
            await ingestOpenExchangeRates();
            await ingestOpenExchangeCurrencies();
        } else if (ingestType === 'airports') {
            await ingestDuffelAirports();
        } else if (ingestType === 'airlines') {
            await ingestDuffelAirlines();
        } else if (ingestType === 'aircraft') {
            await ingestDuffelAircraft();
        } else if (ingestType === 'loyalty-programs') {
            await ingestDuffelLoyaltyPrograms();
        } else if (ingestType === 'nationalities') {
            await ingestLiteAPINationalities();
        } else if (ingestType === 'chains') {
            await ingestLiteAPIChains();
        } else if (ingestType === 'extras') {
            await ingestLiteAPIStaticExtras();
        } else if (ingestType === 'hotels') {
            await ingestLiteAPIHotels();
        } else if (ingestType === 'cities') {
            await ingestCitiesFromAirports();
        } else if (ingestType === 'amadeus-bulk') {
            await ingestAmadeusBulk();
        } else if (ingestType === 'hubwayz-markets') {
            await ingestHubwayzMarkets();
        } else if (ingestType === 'hubwayz-destinations') {
            await ingestHubwayzDestinations();
        } else if (ingestType === 'amadeus-hotels') {
            await ingestAmadeusHotelsByCity();
        } else if (ingestType === 'amadeus-sentiments') {
            await ingestAmadeusHotelSentiments();
        } else if (ingestType === 'hotelbeds-hotels') {
            await ingestHotelbedsHotels();
        } else if (ingestType === 'giata-hotels') {
            await ingestGiataHotels();
        } else if (ingestType === 'hotelston-hotels') {
            await ingestHotelstonHotels();
        } else if (!ingestType) {
            // Full run (Scheduler style)
            await ingestOpenExchangeRates();
            await ingestOpenExchangeCurrencies();
            await ingestDuffelAirports();
            await ingestDuffelAirlines();
            await ingestDuffelAircraft();
            await ingestDuffelLoyaltyPrograms();
            await ingestLiteAPINationalities();
            await ingestLiteAPIChains();
            await ingestLiteAPIStaticExtras();
            await ingestLiteAPIHotels();
            await ingestHubwayzMarkets();
            await ingestHubwayzDestinations();
            console.log('--- Initial Bulk Ingestion complete ---');
        }
    } catch (error: any) {
        console.error('Ingestion failed:', error.message);
        if (error.response) {
            console.error('API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await pool.end();
        console.log('--- Ingestion Complete ---');
    }
}

// Mock ingestion functions have been removed.
// All static data must be ingested from real external APIs.

async function upsertAirports(airports: any[]) {
    for (const airport of airports) {
        await pool.query(`
            INSERT INTO airports (iata_code, name, city, country, country_code, latitude, longitude, is_active, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
            ON CONFLICT (iata_code) DO UPDATE SET
                name = COALESCE(NULLIF(EXCLUDED.name, ''), airports.name),
                city = COALESCE(NULLIF(EXCLUDED.city, ''), airports.city),
                country = COALESCE(NULLIF(EXCLUDED.country, ''), airports.country),
                country_code = COALESCE(NULLIF(EXCLUDED.country_code, ''), airports.country_code),
                latitude = COALESCE(EXCLUDED.latitude, airports.latitude),
                longitude = COALESCE(EXCLUDED.longitude, airports.longitude),
                updated_at = NOW()
        `, [
            airport.iata_code,
            airport.name,
            airport.city_name || '',
            airport.country_name || '',
            airport.iata_country_code || '',
            airport.latitude,
            airport.longitude,
            true
        ]);
    }
}

async function upsertAirlines(airlines: any[]) {
    for (const airline of airlines) {
        if (!airline.iata_code) {
            console.warn(`⚠️ Skipping airline ${airline.name} (No IATA code)`);
            continue;
        }
        await pool.query(`
            INSERT INTO airlines (iata_code, name, logo_url, is_active, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (iata_code) DO UPDATE SET
                name = COALESCE(NULLIF(EXCLUDED.name, ''), airlines.name),
                logo_url = COALESCE(NULLIF(EXCLUDED.logo_url, ''), airlines.logo_url),
                updated_at = NOW()
        `, [
            airline.iata_code,
            airline.name,
            airline.logo_symbol_url,
            true
        ]);
    }
}

async function matchAndMapFlightRoute(route: any, supplierRouteId: number, supplierName: string) {
    // 1. Find or create canonical route
    const result = await pool.query(`
        INSERT INTO canonical_flight_routes (origin_iata, destination_iata, airline_iata, is_active, updated_at)
        VALUES ($1, $2, $3, $4, NOW())
        ON CONFLICT (origin_iata, destination_iata, airline_iata) DO UPDATE SET
            is_active = EXCLUDED.is_active,
            updated_at = NOW()
        RETURNING id
    `, [route.origin, route.destination, route.airline, true]);

    const canonicalId = result.rows[0].id;

    // 2. Map supplier route to canonical route
    await pool.query(`
        INSERT INTO flight_route_mappings (canonical_route_id, supplier_route_id, supplier_name)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
    `, [canonicalId, supplierRouteId, supplierName]);

    return canonicalId;
}

async function upsertFlightRoutes(routes: any[]) {
    for (const route of routes) {
        const result = await pool.query(`
            INSERT INTO amadeus_flight_routes (origin_iata, destination_iata, airline_iata, is_active, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (origin_iata, destination_iata, airline_iata) DO UPDATE SET
                is_active = EXCLUDED.is_active,
                updated_at = NOW()
            RETURNING id
        `, [route.origin, route.destination, route.airline, true]);

        const supplierRouteId = result.rows[0].id;
        await matchAndMapFlightRoute(route, supplierRouteId, 'AMADEUS');
    }
}

async function upsertFlightInspirations(inspirations: any[]) {
    for (const ins of inspirations) {
        await pool.query(`
            INSERT INTO amadeus_flight_inspirations (origin, destination, departure_date, return_date, price_amount, price_currency, updated_at)
            VALUES ($1, $2, $3, $4, $5, $6, NOW())
        `, [ins.origin, ins.destination, ins.departureDate, ins.returnDate, ins.price.total, 'EUR']); // Default to EUR for Amadeus test
    }
}

async function upsertChains(chains: any[]) {
    for (const chain of chains) {
        try {
            await pool.query(`
                INSERT INTO hotel_chains (name, code, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = COALESCE(NULLIF(EXCLUDED.name, ''), hotel_chains.name),
                    updated_at = NOW()
            `, [chain.name, String(chain.id)]);
        } catch (e: any) {
            if (e.code === '23505') {
                // Ignore unique constraint violations (name or code)
                continue;
            }
            throw e;
        }
    }
}

export async function ingestDuffelAirports() {
    console.log('✈️ Ingesting Duffel Airports (with pagination)...');
    let allAirports: any[] = [];
    let afterCursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
        const url: string = afterCursor
            ? `https://api.duffel.com/air/airports?limit=200&after=${afterCursor}`
            : 'https://api.duffel.com/air/airports?limit=200';

        const response: any = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${DUFFEL_API_KEY}`, 'Duffel-Version': 'v2' }
        });

        const airports = response.data.data;
        allAirports = allAirports.concat(airports);
        process.stdout.write(`.`);

        afterCursor = response.data.meta?.after || null;
        hasMore = !!afterCursor && airports.length > 0;
    }

    console.log(`\n💾 Upserting ${allAirports.length} airports...`);
    await upsertAirports(allAirports);
    console.log(`✅ Ingested ${allAirports.length} airports in total`);
}

export async function ingestDuffelLoyaltyPrograms() {
    console.log('🏅 Ingesting Duffel Loyalty Programs (with pagination)...');
    let allPrograms: any[] = [];
    let afterCursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
        const url: string = afterCursor
            ? `https://api.duffel.com/air/loyalty_programmes?limit=200&after=${afterCursor}`
            : 'https://api.duffel.com/air/loyalty_programmes?limit=200';

        const response: any = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${DUFFEL_API_KEY}`, 'Duffel-Version': 'v2' }
        });

        const programs = response.data.data;
        allPrograms = allPrograms.concat(programs);
        process.stdout.write(`.`);

        afterCursor = response.data.meta?.after || null;
        hasMore = !!afterCursor && programs.length > 0;
    }

    console.log(`\n💾 Upserting ${allPrograms.length} loyalty programs...`);
    await upsertLoyaltyPrograms(allPrograms);
    console.log(`✅ Ingested ${allPrograms.length} loyalty programs in total`);
}

async function upsertLoyaltyPrograms(programs: any[]) {
    for (const program of programs) {
        // Skip programs without an ID (code) as we can't upsert without it
        if (!program.id) {
            console.warn(`⚠️ Skipping loyalty program ${program.name} (No code/id)`);
            continue;
        }
        try {
            await pool.query(`
                INSERT INTO loyalty_programs (name, code, airline_id, updated_at)
                VALUES ($1, $2, (SELECT id FROM airlines WHERE iata_code = $3 LIMIT 1), NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = COALESCE(NULLIF(EXCLUDED.name, ''), loyalty_programs.name),
                    updated_at = NOW()
            `, [
                program.name,
                program.id, // Using Duffel ID as code for uniqueness
                program.airline_iata_code || null // Use airline_iata_code if available
            ]);
        } catch (e: any) {
            console.warn(`⚠️ Failed to upsert loyalty program ${program.name}: ${e.message}`);
        }
    }
}

export async function ingestDuffelAirlines() {
    console.log('🛩️ Ingesting Duffel Airlines (with pagination)...');
    let allAirlines: any[] = [];
    let afterCursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
        const url: string = afterCursor
            ? `https://api.duffel.com/air/airlines?limit=200&after=${afterCursor}`
            : 'https://api.duffel.com/air/airlines?limit=200';

        const response: any = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${DUFFEL_API_KEY}`, 'Duffel-Version': 'v2' }
        });

        const airlines = response.data.data;
        allAirlines = allAirlines.concat(airlines);
        process.stdout.write(`.`);

        afterCursor = response.data.meta?.after || null;
        hasMore = !!afterCursor && airlines.length > 0;
    }

    console.log(`\n💾 Upserting ${allAirlines.length} airlines...`);
    await upsertAirlines(allAirlines);
    console.log(`✅ Ingested ${allAirlines.length} airlines in total`);
}

export async function ingestDuffelAircraft() {
    console.log('🚁 Ingesting Duffel Aircraft (with pagination)...');
    let allAircraft: any[] = [];
    let afterCursor: string | null = null;
    let hasMore = true;

    while (hasMore) {
        const url: string = afterCursor
            ? `https://api.duffel.com/air/aircraft?limit=200&after=${afterCursor}`
            : 'https://api.duffel.com/air/aircraft?limit=200';

        const response: any = await axios.get(url, {
            headers: { 'Authorization': `Bearer ${DUFFEL_API_KEY}`, 'Duffel-Version': 'v2' }
        });

        const aircraftList = response.data.data;
        allAircraft = allAircraft.concat(aircraftList);
        process.stdout.write(`.`);

        afterCursor = response.data.meta?.after || null;
        hasMore = !!afterCursor && aircraftList.length > 0;
    }

    console.log(`\n💾 Upserting ${allAircraft.length} aircraft...`);
    for (const aircraft of allAircraft) {
        await pool.query(`
            INSERT INTO aircraft (id, iata_code, name, is_active, updated_at)
            VALUES ($1, $2, $3, $4, NOW())
            ON CONFLICT (iata_code) DO UPDATE SET
                name = EXCLUDED.name,
                updated_at = NOW()
        `, [
            aircraft.id,
            aircraft.iata_code,
            aircraft.name,
            true
        ]);
    }
    console.log(`✅ Ingested ${allAircraft.length} aircraft in total`);
}

export async function ingestLiteAPINationalities() {
    console.log('🌐 Ingesting LiteAPI Nationalities/Countries...');
    const response = await axios.get('https://api.liteapi.travel/v3.0/data/countries', {
        headers: { 'X-API-Key': LITEAPI_API_KEY }
    });
    const countries = (response.data as any).data;

    for (const country of countries) {
        // Upsert to nationalities table (standardized for B2C/B2B selectors)
        await pool.query(`
            INSERT INTO nationalities (code, name, country, updated_at)
            VALUES ($1, $2, $3, NOW())
            ON CONFLICT (code) DO UPDATE SET
                name = COALESCE(NULLIF(EXCLUDED.name, ''), nationalities.name),
                country = COALESCE(NULLIF(EXCLUDED.country, ''), nationalities.country),
                updated_at = NOW()
        `, [country.code, country.name, country.name]);

        // Upsert to countries table (extended schema if exists)
        try {
            await pool.query(`
                INSERT INTO countries (code, name, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    status = 'active',
                    name = COALESCE(NULLIF(EXCLUDED.name, ''), countries.name),
                    updated_at = NOW()
            `, [country.code, country.name]);
        } catch (e) {
            // Table might not have 'status' or might not exist
        }
    }
    console.log(`✅ Ingested ${countries.length} nationalities`);
}

export async function ingestLiteAPIChains() {
    console.log('🏨 Ingesting LiteAPI Chains...');
    const response = await axios.get('https://api.liteapi.travel/v3.0/data/chains', {
        headers: { 'X-API-Key': LITEAPI_API_KEY }
    });
    await upsertChains((response.data as any).data);
}


// findOrCreateCanonicalHotel removed - using shared utility in mapping-utils.ts

async function findOrCreateCanonicalRoom(hotelId: number, room: any, supplierRoomId: number, supplierName: string) {
    // 1. Search for existing canonical room in the hotel
    const existing = await pool.query(`
        SELECT id, name, max_occupancy 
        FROM canonical_room_types 
        WHERE canonical_hotel_id = $1
    `, [hotelId]);

    let canonicalId = null;

    const roomName = room.name || room.roomName;
    for (const row of existing.rows) {
        const nameSimilarity = stringSimilarity.compareTwoStrings((roomName || '').toLowerCase(), row.name.toLowerCase());

        // Match if name is very similar and occupancy matches (if available)
        if (nameSimilarity > 0.85 && (!room.max_occupancy || room.max_occupancy === row.max_occupancy)) {
            canonicalId = row.id;
            break;
        }
    }

    // 2. If no match, create new canonical room
    if (!canonicalId) {
        const result = await pool.query(`
            INSERT INTO canonical_room_types (canonical_hotel_id, name, description, max_occupancy, amenities)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id
        `, [
            hotelId,
            roomName,
            room.description || '',
            room.max_occupancy || room.maxAdults || 2,
            JSON.stringify(room.amenities || [])
        ]);
        canonicalId = result.rows[0].id;
    }

    // 3. Create mapping
    await pool.query(`
        INSERT INTO room_supplier_mappings (canonical_room_id, supplier_room_id, supplier_name)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
    `, [canonicalId, supplierRoomId, supplierName]);

    return canonicalId;
}

export async function ingestLiteAPIHotels() {
    console.log('🌍 Fetching country list for full hotel ingestion...');
    const countriesResponse = await axios.get('https://api.liteapi.travel/v3.0/data/countries', {
        headers: { 'X-API-Key': LITEAPI_API_KEY }
    });
    const countries = (countriesResponse.data as any).data;
    console.log(`✅ Found ${countries.length} countries. Starting sequential ingestion...`);

    for (const country of countries) {
        let offset = 0;
        const limit = 5000;
        let hasMore = true;

        console.log(`📍 Processing Country: ${country.name} (${country.code})`);

        while (hasMore) {
            try {
                const response = await axios.get(`https://api.liteapi.travel/v3.0/data/hotels?countryCode=${country.code}&offset=${offset}&limit=${limit}`, {
                    headers: { 'X-API-Key': LITEAPI_API_KEY }
                });

                const hotels = (response.data as any).data;
                if (!hotels || hotels.length === 0) {
                    hasMore = false;
                    continue;
                }

                // For the first few hotels, fetch details to get rooms (Static Detail API)
                for (let i = 0; i < Math.min(hotels.length, 5); i++) {
                    try {
                        const detailRes = await axios.get(`https://api.liteapi.travel/v3.0/data/hotel?hotelId=${hotels[i].id}`, {
                            headers: { 'X-API-Key': LITEAPI_API_KEY }
                        });
                        if ((detailRes.data as any).data) {
                            hotels[i] = { ...hotels[i], ...(detailRes.data as any).data };
                        }
                    } catch (e: any) {
                        console.warn(`⚠️ Failed to fetch details for hotel ${hotels[i].id}: ${e.message}`);
                    }
                }

                await upsertHotels(hotels);
                console.log(`   - Ingested ${hotels.length} hotels (Total Offset: ${offset}) for ${country.code}`);

                if (hotels.length < limit) {
                    hasMore = false;
                } else {
                    offset += limit;
                }
            } catch (error: any) {
                console.error(`❌ Error fetching hotels for ${country.code} at offset ${offset}:`, error.message);
                hasMore = false; // Skip to next country on error for now, or retry
            }
        }
    }
}

async function upsertHotels(hotels: any[]) {
    for (const hotel of hotels) {
        const hotelImages = (hotel.main_photo || hotel.image) ? JSON.stringify([{ url: hotel.main_photo || hotel.image }]) : JSON.stringify([]);
        const result = await pool.query(`
            INSERT INTO hotels (name, address, city, country, star_rating, images, amenities, updated_at, external_id, external_source)
            VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
            ON CONFLICT (external_id, external_source) DO UPDATE SET
                name = EXCLUDED.name,
                address = EXCLUDED.address,
                city = EXCLUDED.city,
                country = EXCLUDED.country,
                star_rating = EXCLUDED.star_rating,
                images = EXCLUDED.images,
                amenities = EXCLUDED.amenities,
                updated_at = NOW()
            RETURNING id
        `, [
            hotel.name,
            hotel.address || '',
            hotel.city || '',
            hotel.country || '',
            hotel.stars || 0,
            hotelImages,
            JSON.stringify(hotel.facilities || hotel.facilityIds || hotel.amenities || []),
            hotel.id,
            'LITEAPI'
        ]);

        const supplierHotelId = result.rows[0].id;

        const hotelData: HotelData = {
            name: hotel.name,
            address: hotel.address,
            city: hotel.city,
            country: hotel.country,
            country_code: hotel.country_code || hotel.countryCode || null,
            stars: hotel.stars,
            latitude: hotel.latitude,
            longitude: hotel.longitude,
            amenities: hotel.facilities || hotel.facilityIds || hotel.amenities || [],
            images: hotel.main_photo || hotel.image ? [{ url: hotel.main_photo || hotel.image }] : [],
            external_id: hotel.id,
            external_source: 'LITEAPI'
        };

        const canonicalHotelId = await findOrCreateCanonicalHotel(pool, hotelData, supplierHotelId);

        // 4. Handle Rooms if present (from detail API or enhanced bulk)
        if (hotel.rooms) {
            await upsertRooms(canonicalHotelId, supplierHotelId, hotel.rooms, 'LITEAPI');
        }
    }
}

async function upsertRooms(canonicalHotelId: number, supplierHotelId: number, rooms: any[] | any, supplierName: string) {
    const roomsArray = Array.isArray(rooms) ? rooms : Object.values(rooms);
    console.log(`🏠 Upserting ${roomsArray.length} rooms for hotel ${supplierHotelId}...`);
    for (const room of roomsArray as any[]) {
        const roomName = room.name || room.roomName;
        if (!roomName) continue;

        const result = await pool.query(`
            INSERT INTO hotel_room_types (hotel_id, name, description, max_occupancy, bed_type, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW())
            RETURNING id
        `, [
            supplierHotelId,
            roomName,
            room.description || '',
            room.max_occupancy || room.maxAdults || 2,
            room.bed_type || '',
        ]);

        const supplierRoomId = result.rows[0].id;
        await findOrCreateCanonicalRoom(canonicalHotelId, room, supplierRoomId, supplierName);
    }
}

export async function ingestLiteAPIStaticExtras() {
    console.log('💱 Ingesting LiteAPI Currencies...');
    const currencies = (await axios.get('https://api.liteapi.travel/v3.0/data/currencies', { headers: { 'X-API-Key': LITEAPI_API_KEY } })).data as any;
    const currencyData = currencies.data;
    if (currencyData.length > 0) console.log('Sample Currency Object:', JSON.stringify(currencyData[0], null, 2));

    for (const currency of currencyData) {
        const name = currency.currency || currency.name; // v3 uses .currency
        if (!currency.code || !name) continue;
        await pool.query(`
            INSERT INTO currencies (code, name, symbol, updated_at) VALUES ($1, $2, $3, NOW())
            ON CONFLICT (code) DO UPDATE SET name=EXCLUDED.name, symbol=EXCLUDED.symbol, updated_at=NOW()
        `, [currency.code, name, currency.symbol || currency.code]);
    }
    console.log(`✅ Ingested ${currencies.length} currencies`);

    console.log('🏊 Ingesting LiteAPI Facilities...');
    const facilitiesRes = (await axios.get('https://api.liteapi.travel/v3.0/data/facilities', { headers: { 'X-API-Key': LITEAPI_API_KEY } })).data as any;
    const facilities = facilitiesRes.data;
    if (facilities.length > 0) console.log('Sample Facility Object:', JSON.stringify(facilities[0], null, 2));

    for (const facility of facilities) {
        // v3 uses .facility for the name
        const name = typeof facility === 'string' ? facility : (facility.facility || facility.name || facility.facilityName);
        if (!name) continue;
        await pool.query(`
            INSERT INTO hotel_facilities (name, category, updated_at) VALUES ($1, $2, NOW())
            ON CONFLICT (name) DO NOTHING
        `, [name, facility.group_name || 'General']);
    }
    console.log(`✅ Ingested ${facilities.length} facilities`);

    console.log('🏨 Ingesting LiteAPI Hotel Types...');
    const typesRes = (await axios.get('https://api.liteapi.travel/v3.0/data/hotelTypes', { headers: { 'X-API-Key': LITEAPI_API_KEY } })).data as any;
    const types = typesRes.data;
    if (types.length > 0) console.log('Sample Hotel Type Object:', JSON.stringify(types[0], null, 2));

    for (const type of types) {
        const name = typeof type === 'string' ? type : (type.name || type.typeName);
        if (!name) continue;
        await pool.query(`
            INSERT INTO hotel_types (name, updated_at) VALUES ($1, NOW())
            ON CONFLICT (name) DO NOTHING
        `, [name]);
    }
    console.log(`✅ Ingested ${types.length} hotel types`);
}

export async function ingestCitiesFromAirports() {
    console.log('🏙️ Ingesting Cities from Airports...');

    // Extract unique cities from airports table
    const result = await pool.query(`
        INSERT INTO cities (name, country, country_code, latitude, longitude, timezone, is_popular, created_at, updated_at)
        SELECT DISTINCT ON (city, country_code)
            city,
            country,
            country_code,
            latitude,
            longitude,
            timezone,
            FALSE,
            NOW(),
            NOW()
        FROM airports
        WHERE city IS NOT NULL AND city != ''
        ON CONFLICT DO NOTHING
        RETURNING id
    `);

    console.log(`✅ Ingested ${result.rowCount} cities from airports`);

    // Mark some major cities as popular
    const popularCities = ['London', 'New York', 'Paris', 'Dubai', 'Singapore', 'Hong Kong', 'Tokyo', 'Los Angeles', 'Bangkok', 'Istanbul'];
    await pool.query(`
        UPDATE cities 
        SET is_popular = TRUE 
        WHERE name = ANY($1)
    `, [popularCities]);
}

export async function ingestOpenExchangeCurrencies() {
    console.log('💱 Ingesting OpenExchangeRates Currencies...');
    try {
        const response = await axios.get(`https://openexchangerates.org/api/currencies.json?app_id=${OPENEXCHANGE_API_KEY}`);
        const currencies = response.data as any; // Object with code: name mapping

        let count = 0;
        for (const [code, name] of Object.entries(currencies)) {
            await pool.query(`
                INSERT INTO currencies (code, name, symbol, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    updated_at = NOW()
            `, [code, name, code]); // We don't have symbols from this endpoint, using code as fallback
            count++;
        }
        console.log(`✅ Ingested ${count} currencies from OpenExchangeRates`);
    } catch (error: any) {
        console.error('❌ Error fetching currencies from OpenExchangeRates:', error.message);
        throw error;
    }
}

async function ingestOpenExchangeRates() {
    console.log('\n💱 Fetching OpenExchangeRates Exchange Rates...');
    try {
        await fetchAndSaveRates();
    } catch (error: any) {
        console.error('❌ FX fetch failed:', error.message);
    }
}

async function getAmadeusAccessToken() {
    const response = await axios.post(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`,
        new URLSearchParams({
            grant_type: 'client_credentials',
            client_id: AMADEUS_API_KEY,
            client_secret: AMADEUS_API_SECRET
        }), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    }
    );
    return (response.data as any).access_token;
}

async function ingestAmadeusFlightData() {
    console.log('🔑 Authenticating with Amadeus...');
    const token = await getAmadeusAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    console.log('🛩️ Ingesting Amadeus Airlines...');
    const airlinesResponse = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/airlines`, { headers });
    const airlines = (airlinesResponse.data as any).data;
    await upsertAirlines(airlines.map((a: any) => ({
        iata_code: a.iataCode,
        name: a.commonName || a.businessName,
        logo_symbol_url: null // Amadeus doesn't provide logos directly
    })));
    console.log(`✅ Ingested ${airlines.length} airlines from Amadeus`);

    console.log('✈️ Ingesting Amadeus Airports (Major Hubs)...');
    // Amadeus requires keyword for locations. We'll fetch for common regions to get a good base set.
    const keywords = ['LON', 'NYC', 'DXB', 'SIN', 'HKG', 'PAR', 'FRA', 'TYO', 'SYD', 'BOM'];
    let totalAirports = 0;
    for (const kw of keywords) {
        try {
            const res = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=AIRPORT&keyword=${kw}`, { headers });
            const airports = (res.data as any).data;
            if (airports && airports.length > 0) {
                await upsertAirports(airports.map((a: any) => ({
                    iata_code: a.iataCode,
                    name: a.name,
                    city_name: a.address.cityName,
                    country_name: a.address.countryName,
                    iata_country_code: a.address.countryCode,
                    latitude: a.geoCode.latitude,
                    longitude: a.geoCode.longitude
                })));
                totalAirports += airports.length;
            }
        } catch (e: any) {
            console.warn(`⚠️ Failed to fetch airports for keyword ${kw}: ${e.message}`);
        }
    }
    console.log(`✅ Ingested ${totalAirports} airports from Amadeus`);
}

export async function ingestAmadeusBulk() {
    console.log('🔑 Authenticating with Amadeus bulk...');
    const token = await getAmadeusAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    // 1. Airlines
    console.log('🛩️ Ingesting Amadeus Airlines (Bulk)...');
    const airlinesRes = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/airlines`, { headers });
    await upsertAirlines((airlinesRes.data as any).data.map((a: any) => ({
        iata_code: a.iataCode,
        name: a.commonName || a.businessName,
        logo_symbol_url: null
    })));

    // 2. Airports for special test regions (US, ES, GB, DE, IN)
    console.log('✈️ Ingesting Amadeus Airports for Test Regions...');
    const regions = ['US', 'ES', 'GB', 'DE', 'IN'];
    for (const region of regions) {
        try {
            await sleep(1000); // Rate limiting
            // Amadeus test data has specific sets for these countries
            const res = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations?subType=AIRPORT&keyword=${region}&countryCode=${region}`, { headers });
            if ((res.data as any).data) {
                await upsertAirports((res.data as any).data.map((a: any) => ({
                    iata_code: a.iataCode,
                    name: a.name,
                    city_name: a.address.cityName,
                    country_name: a.address.countryName,
                    iata_country_code: a.address.countryCode,
                    latitude: a.geoCode.latitude,
                    longitude: a.geoCode.longitude
                })));
                console.log(`✅ Ingested ${(res.data as any).data.length} airports for ${region}`);
            }
        } catch (e: any) {
            console.warn(`⚠️ Failed to fetch airports for region ${region}: ${e.message}`);
        }
    }

    // 3. Flight Inspirations (Trending)
    console.log('🌟 Ingesting Flight Inspirations...');
    const origins = ['MAD', 'NYC', 'LON', 'PAR', 'BER'];
    for (const origin of origins) {
        try {
            await sleep(1000); // Rate limiting
            const res = await axios.get(`${AMADEUS_BASE_URL}/v1/shopping/flight-destinations?origin=${origin}`, { headers });
            if ((res.data as any).data) {
                await upsertFlightInspirations((res.data as any).data);
                console.log(`✅ Ingested ${(res.data as any).data.length} inspirations for ${origin}`);
            }
        } catch (e: any) {
            console.warn(`⚠️ Failed to fetch inspirations for ${origin}: ${e.message}`);
        }
    }

    // 4. Airport Routes for Major Hubs
    console.log('🗺️ Ingesting Airport Routes...');
    for (const origin of origins) {
        try {
            await sleep(1000); // Rate limiting
            const res = await axios.get(`${AMADEUS_BASE_URL}/v1/airport/direct-destinations?departureAirportCode=${origin}`, { headers });
            if ((res.data as any).data) {
                const routes = (res.data as any).data.map((dest: any) => ({
                    origin,
                    destination: dest.iataCode,
                    airline: null
                }));
                await upsertFlightRoutes(routes);
                console.log(`✅ Ingested ${routes.length} routes from ${origin}`);
            }
        } catch (e: any) {
            console.warn(`⚠️ Failed to fetch routes for ${origin}: ${e.message}`);
            if (e.response) console.warn('   - Error Detail:', JSON.stringify(e.response.data, null, 2));
        }
    }
}

async function ingestHubwayzMarkets() {
    console.log('🔗 Ingesting Hubwayz Markets...');
    try {
        const response = await axios.get(`${HUBWAYZ_BASE_URL}/markets`, {
            headers: { 'Authorization': `Bearer ${HUBWAYZ_API_KEY}` }
        });
        const markets = response.data as any[];

        for (const market of markets) {
            await pool.query(`
                INSERT INTO markets (market_id, title, countries, updated_at)
                VALUES ($1, $2, $3, NOW())
                ON CONFLICT (market_id) DO UPDATE SET
                    title = EXCLUDED.title,
                    countries = EXCLUDED.countries,
                    updated_at = NOW()
            `, [market.marketId, market.title, JSON.stringify(market.countries)]);
        }
        console.log(`✅ Ingested ${markets.length} Hubwayz markets`);
    } catch (error: any) {
        console.error('❌ Hubwayz Markets Ingestion failed:', error.message);
    }
}

async function ingestHubwayzDestinations() {
    console.log('🗺️ Ingesting Hubwayz Destinations (by country)...');
    const countriesRes = await pool.query(`SELECT code FROM countries`);
    const countries = countriesRes.rows.map(r => r.code);

    let total = 0;
    for (const code of countries) {
        try {
            const response = await axios.get(`${HUBWAYZ_BASE_URL}/destinations/${code}`, {
                headers: { 'Authorization': `Bearer ${HUBWAYZ_API_KEY}` }
            });
            const destinations = response.data;
            if (!destinations || !Array.isArray(destinations)) continue;

            for (const dest of destinations) {
                await pool.query(`
                    INSERT INTO destinations (external_id, country_code, name, type, seoname, latitude, longitude, updated_at)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())
                    ON CONFLICT (external_id) DO UPDATE SET
                        name = EXCLUDED.name,
                        type = EXCLUDED.type,
                        seoname = EXCLUDED.seoname,
                        latitude = EXCLUDED.latitude,
                        longitude = EXCLUDED.longitude,
                        updated_at = NOW()
                `, [
                    dest.id,
                    dest.countryid,
                    dest.name,
                    dest.type,
                    dest.seoname,
                    dest.lat,
                    dest.lon
                ]);
            }
            total += destinations.length;
            process.stdout.write(`.`);
        } catch (error: any) {
            // Skip 404s or empty countries
        }
    }
    console.log(`\n✅ Ingested ${total} Hubwayz destinations across ${countries.length} countries`);
}

async function ingestAmadeusHotelsByCity() {
    console.log('🏨 Ingesting Amadeus Hotels by City...');
    const token = await getAmadeusAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    const cityCodes = ['PAR', 'LON', 'NYC', 'DXB', 'SIN', 'SYD', 'TYO', 'FRA', 'BOM', 'ROM', 'BCN', 'MAD', 'BER', 'AMS'];
    let total = 0;

    for (const code of cityCodes) {
        try {
            console.log(`Processing city: ${code}...`);
            await new Promise(resolve => setTimeout(resolve, 1000)); // Rate limit

            const response = await axios.get(`${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?cityCode=${code}`, { headers });
            const hotels = (response.data as any).data;
            if (!hotels || !Array.isArray(hotels)) continue;

            for (const hotel of hotels) {
                const hotelImages = JSON.stringify([]);
                const amenities = JSON.stringify([]);
                const address = hotel.address?.lines?.join(', ') || hotel.address?.cityName || 'Unknown Address';

                await pool.query(`
                    INSERT INTO hotels (name, address, city, country, star_rating, images, amenities, updated_at, external_id, external_source)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), $8, $9)
                    ON CONFLICT (external_id, external_source) DO UPDATE SET
                        name = EXCLUDED.name,
                        address = EXCLUDED.address,
                        city = EXCLUDED.city,
                        country = EXCLUDED.country,
                        updated_at = NOW()
                `, [
                    hotel.name,
                    address,
                    hotel.address?.cityName || '',
                    hotel.address?.countryCode || '',
                    0,
                    hotelImages,
                    amenities,
                    hotel.hotelId,
                    'AMADEUS'
                ]);
                total++;
            }
            console.log(`✅ Ingested ${hotels.length} hotels for city ${code}`);
        } catch (error: any) {
            if (error.response?.status === 429) {
                console.warn(`⏳ Rate limited for ${code}. Waiting 5s...`);
                await new Promise(resolve => setTimeout(resolve, 5000));
            } else {
                console.error(`❌ Amadeus Hotel Ingestion failed for ${code}:`, error.message, error.response?.status);
            }
        }
    }
    console.log(`✅ Total Amadeus hotels ingested: ${total}`);
}

async function ingestAmadeusHotelSentiments() {
    console.log('🎭 Ingesting Amadeus Hotel Sentiments...');
    const token = await getAmadeusAccessToken();
    const headers = { Authorization: `Bearer ${token}` };

    const hotelsRes = await pool.query(`SELECT id, external_id FROM hotels WHERE external_source = 'AMADEUS' LIMIT 50`);
    const hotels = hotelsRes.rows;

    for (const hotel of hotels) {
        try {
            const response = await axios.get(`${AMADEUS_BASE_URL}/v2/e-reputation/hotel-sentiments?hotelIds=${hotel.external_id}`, { headers });
            const sentimentData = (response.data as any).data?.[0];
            if (!sentimentData) continue;

            const sentiments = sentimentData.sentiments || {};

            await pool.query(`
                INSERT INTO hotel_reviews_summary (
                    hotel_id, total_reviews, average_rating, rating_breakdown, 
                    service_rating, common_amenities_rating, location_rating, 
                    cleanliness_rating, value_rating, last_updated
                )
                VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
                ON CONFLICT (hotel_id) DO UPDATE SET
                    total_reviews = EXCLUDED.total_reviews,
                    average_rating = EXCLUDED.average_rating,
                    rating_breakdown = EXCLUDED.rating_breakdown,
                    service_rating = EXCLUDED.service_rating,
                    common_amenities_rating = EXCLUDED.common_amenities_rating,
                    location_rating = EXCLUDED.location_rating,
                    cleanliness_rating = EXCLUDED.cleanliness_rating,
                    value_rating = EXCLUDED.value_rating,
                    last_updated = NOW()
            `, [
                hotel.id,
                sentimentData.numberOfReviews || 0,
                sentimentData.overallRating ? sentimentData.overallRating / 20 : 0,
                JSON.stringify(sentiments),
                sentiments.service ? sentiments.service / 20 : null,
                sentiments.facilities ? sentiments.facilities / 20 : null,
                sentiments.location ? sentiments.location / 20 : null,
                sentiments.roomComfort ? sentiments.roomComfort / 20 : null,
                sentiments.valueForMoney ? sentiments.valueForMoney / 20 : null
            ]);
            console.log(`✅ Sentiments ingested for hotel ${hotel.external_id}`);
        } catch (error: any) {
            // Handle 404 or missing data in test environment
        }
    }
}


if (require.main === module) {
    main();
}
