import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Database connection
const pool = new Pool({
    connectionString: process.env.STATIC_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/staticdatabase',
});

// Innstant Travel API Configuration
const INNSTANT_API_KEY = process.env.INNSTANT_API_KEY || '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

const ENDPOINTS = [
    { name: 'airports', endpoint: '/airports', table: 'airports' },
    { name: 'airlines', endpoint: '/airlines', table: 'airlines' },
    { name: 'countries', endpoint: '/countries', table: 'nationalities' },
    { name: 'cities', endpoint: '/cities', table: 'cities' },
    { name: 'currencies', endpoint: '/currencies', table: 'currencies' },
    { name: 'hotel-chains', endpoint: '/hotel-chains', table: 'hotel_chains' },
    { name: 'hotel-facilities', endpoint: '/hotel-facilities', table: 'hotel_facilities' },
    { name: 'hotel-types', endpoint: '/hotel-types', table: 'hotel_types' },
    { name: 'loyalty-programs', endpoint: '/loyalty-programs', table: 'loyalty_programs' },
];

async function fetchInnstantData(endpoint: string, useAether: boolean = false) {
    try {
        const headers: any = {
            'Content-Type': 'application/json',
        };

        if (useAether) {
            headers['aether-application-key'] = '$2y$10$MU80MuAe5SkB4EkALGTNX.CKGSbrEIRbZZbanWKVlQruNTnhPovLS';
        } else {
            headers['Authorization'] = `Bearer ${INNSTANT_API_KEY}`;
        }

        const response = await axios.get(`${INNSTANT_BASE_URL}${endpoint}`, { headers });

        if (response.status !== 200) {
            console.error(`✗ API Error ${response.status} for ${endpoint}`);
            return null;
        }

        if (JSON.stringify(response.data).length < 50) {
            console.log(`⚠️ Small response for ${endpoint}:`, JSON.stringify(response.data));
        }

        return response.data;
    } catch (error: any) {
        if (error.response?.data) {
            console.error(`✗ Failed to fetch ${endpoint}:`, error.message, '| Response:', JSON.stringify(error.response.data));
        } else {
            console.error(`✗ Failed to fetch ${endpoint}:`, error.message);
        }
        return null;
    }
}

function chunkArray<T>(array: T[], size: number): T[][] {
    const chunked: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
        chunked.push(array.slice(i, i + size));
    }
    return chunked;
}

function transformData(name: string, data: any) {
    if (!data || typeof data !== 'object') return [];
    const items = Object.values(data);

    switch (name) {
        case 'airports':
            return items.map((a: any) => ({
                iata_code: a.iata || a.code || '',
                icao_code: a.icao || null,
                name: a.name || a.airport_name || '',
                city: a.city || a.city_name || '',
                country: a.country || a.country_name || '',
                country_code: a.country || '',
                latitude: a.latitude ? parseFloat(a.latitude) : null,
                longitude: a.longitude ? parseFloat(a.longitude) : null,
                timezone: a.timezone || null,
                is_active: a.is_active !== false,
                updated_at: new Date(),
            })).filter(a => a.iata_code && a.iata_code.length === 3);

        case 'airlines':
            return items.map((a: any) => ({
                iata_code: a.iata || a.code || '',
                icao_code: a.icao || null,
                name: a.name || a.airline_name || '',
                country: a.country || 'Unknown',
                logo_url: a.logo_url || null,
                website: a.website || null,
                alliance: a.alliance || null,
                is_active: a.is_active !== false,
                updated_at: new Date(),
            })).filter(a => a.iata_code && (a.iata_code.length === 2 || a.iata_code.length === 3));

        case 'countries':
            return items.map((c: any) => ({
                code: c.id || c.code || c.country_code || '',
                name: c.name || c.country_name || '',
                country: c.name || c.country_name || '', // Required by schema
                updated_at: new Date(),
            })).filter(c => c.code && c.code.length === 2);

        case 'cities':
            return items.map((c: any) => ({
                name: c.name || c.city_name || '',
                country: c.country || c.country_name || '',
                country_code: c.country || '',
                latitude: c.latitude ? parseFloat(c.latitude) : null,
                longitude: c.longitude ? parseFloat(c.longitude) : null,
                population: c.population ? parseInt(c.population, 10) : null,
                timezone: c.timezone || null,
                is_popular: c.is_popular || false,
                image_url: c.image_url || null,
                updated_at: new Date(),
            })).filter(c => c.name && c.country);

        case 'currencies':
            return items.map((c: any) => ({
                code: c.currencyId || c.code || c.currency_code || '',
                name: c.name || c.currency_name || '',
                symbol: c.sign || c.symbol || null,
                is_active: c.active !== false,
                updated_at: new Date(),
            })).filter(c => c.code && c.code.length === 3);

        case 'hotel-chains':
            return items.map((c: any) => ({
                name: c.name || c.chain_name || '',
                code: c.code || c.chain_code || '',
                website: c.website || null,
                logo_url: c.logo_url || null,
                country: c.country || null,
                updated_at: new Date(),
            })).filter(c => c.name && c.code);

        case 'hotel-facilities':
            return items.map((f: any) => ({
                name: f.name || f.facility_name || '',
                category: f.category || null,
                updated_at: new Date(),
            })).filter(f => f.name);

        case 'hotel-types':
            return items.map((t: any) => ({
                name: t.name || t.type_name || '',
                updated_at: new Date(),
            })).filter(t => t.name);

        case 'loyalty-programs':
            return items.map((p: any) => ({
                id: p.id || p.program_id || '',
                name: p.name || p.program_name || '',
                logo_url: p.logo_url || null,
                logo_symbol_url: p.logo_symbol_url || null,
                alliance: p.alliance || null,
                owner_airline_id: p.owner_airline_id || null,
                is_active: p.is_active !== false,
                updated_at: new Date(),
            })).filter(p => p.id && p.name);

        default:
            return [];
    }
}

async function ingestHotels() {
    console.log('🏨 Starting Innstant Hotel Property Ingestion...');

    // 1. Get full list of hotel IDs
    console.log('🔍 Fetching full property ID list from /hotels-diff/1970-01-01 ...');
    // Using Aether key for metadata/id list as recommended
    const idResponse = await fetchInnstantData('/hotels-diff/1970-01-01', true);
    if (!idResponse || !Array.isArray(idResponse)) {
        console.error('❌ Failed to retrieve hotel ID list or invalid format.');
        return;
    }

    const hotelIds = idResponse;
    console.log(`✅ Found ${hotelIds.length} properties to process.`);

    // 2. Fetch metadata in batches of 500
    const batches = chunkArray(hotelIds, 500);
    let processed = 0;

    for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const idList = batch.join(',');

        const metadataResponse = await fetchInnstantData(`/hotels/${idList}`, true);
        if (!metadataResponse || typeof metadataResponse !== 'object') {
            continue;
        }

        const hotels = Object.values(metadataResponse);
        if (hotels.length === 0) continue;

        const client = await pool.connect();
        try {
            await client.query('BEGIN');

            for (const hotel of hotels as any[]) {
                if (!hotel.id) continue;

                const images = hotel.images ? JSON.stringify(hotel.images.map((img: any) => ({ url: img.url || img }))) : JSON.stringify([]);
                const amenities = JSON.stringify(hotel.facilities || hotel.amenities || []);

                // Removed "id" column to let DB use auto-increment sequence
                await client.query(`
                    INSERT INTO hotels (
                        name, address, city, country, star_rating, 
                        images, amenities, external_id, external_source, 
                        updated_at, checkin_time, checkout_time, is_active
                    )
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW(), $10, $11, true)
                    ON CONFLICT (external_id, external_source) DO UPDATE SET
                        name = EXCLUDED.name,
                        address = EXCLUDED.address,
                        city = EXCLUDED.city,
                        country = EXCLUDED.country,
                        star_rating = EXCLUDED.star_rating,
                        images = EXCLUDED.images,
                        amenities = EXCLUDED.amenities,
                        updated_at = NOW()
                `, [
                    hotel.name || 'Unknown Hotel',
                    hotel.address || '',
                    hotel.city || '',
                    hotel.country || '',
                    hotel.stars ? parseFloat(hotel.stars) : 0,
                    images,
                    amenities,
                    String(hotel.id),
                    'INNSTANT',
                    '1970-01-01 15:00:00',
                    '1970-01-01 11:00:00'
                ]);
            }

            await client.query('COMMIT');
            processed += hotels.length;

            if ((i + 1) % 10 === 0 || i === batches.length - 1) {
                console.log(`✅ Progress: ${processed}/${hotelIds.length} hotels (${Math.round((processed / hotelIds.length) * 100)}%)`);
            }
        } catch (e: any) {
            await client.query('ROLLBACK');
            console.error(`❌ Batch ${i + 1} failed:`, e.message);
        } finally {
            client.release();
        }

        await new Promise(r => setTimeout(r, 50));
    }
    console.log(`\n🎉 Hotel metadata ingestion complete. Total Hotels: ${processed}`);
}

async function runImport() {
    console.log('='.repeat(60));
    console.log('🚀 INNSTANT TRAVEL STATIC DATA IMPORT');
    console.log('='.repeat(60));

    try {
        console.log('📡 Testing database connection...');
        await pool.query('SELECT 1');
        console.log('✅ Database connection successful!\n');

        // Step 1: Standard Static Data (Airlines, Countries, etc.)
        for (const { name, endpoint, table } of ENDPOINTS) {
            console.log(`📡 Fetching ${name} from ${endpoint}...`);

            // Try Aether key for these endpoints as they often require it for Static Data now
            let rawData = await fetchInnstantData(endpoint, true);

            // Fallback to Bearer key if Aether returns error (rare but safe)
            if (!rawData || (typeof rawData === 'object' && rawData && 'error' in rawData)) {
                console.log(`🔄 Retrying ${name} with standard Authorization key...`);
                rawData = await fetchInnstantData(endpoint, false);
            }

            if (!rawData || (typeof rawData === 'object' && rawData && 'error' in rawData)) {
                console.error(`❌ Permanent error for ${name}, skipping.`);
                continue;
            }

            const items = transformData(name, rawData);
            console.log(`📊 Processing ${items.length} ${name} records...`);

            if (items.length === 0) continue;

            try {
                const client = await pool.connect();
                try {
                    await client.query('BEGIN');
                    const columns = Object.keys(items[0]);
                    const conflictColumn = columns.includes('id') ? 'id' : (columns.includes('code') ? 'code' : (columns.includes('iata_code') ? 'iata_code' : (columns.includes('name') ? 'name' : null)));

                    if (conflictColumn) {
                        for (const item of items) {
                            const keys = Object.keys(item);
                            const vals = Object.values(item);
                            const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
                            const updates = keys.map((k, i) => `${k} = EXCLUDED.${k}`).join(', ');

                            await client.query(
                                `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders}) 
                 ON CONFLICT (${conflictColumn}) DO UPDATE SET ${updates}`,
                                vals
                            );
                        }
                    } else {
                        await client.query(`DELETE FROM ${table}`);
                        for (const item of items) {
                            const keys = Object.keys(item);
                            const vals = Object.values(item);
                            const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
                            await client.query(`INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`, vals);
                        }
                    }

                    await client.query('COMMIT');
                    console.log(`✅ Successfully imported ${items.length} ${name} records\n`);
                } catch (e: any) {
                    await client.query('ROLLBACK');
                    console.error(`❌ Failed to import ${name}:`, e.message);
                } finally {
                    client.release();
                }
            } catch (e: any) {
                console.error(`❌ Database error for ${name}:`, e.message);
            }
        }

        // Step 2: Full Hotel Properties
        await ingestHotels();

        // Report final counts
        console.log('\n📈 Import Summary Report:');
        console.log('='.repeat(25));
        for (const { name, table } of ENDPOINTS) {
            const res = await pool.query(`SELECT COUNT(*) as count FROM ${table}`);
            console.log(`${name.padEnd(20)}: ${res.rows[0].count} records`);
        }
        const hotelRes = await pool.query(`SELECT COUNT(*) as count FROM hotels WHERE external_source = 'INNSTANT'`);
        console.log(`${'Innstant Hotels'.padEnd(20)}: ${hotelRes.rows[0].count} records`);

    } catch (error: any) {
        console.error('💥 Primary import process failed:', error.message);
    } finally {
        await pool.end();
    }
}

if (require.main === module) {
    runImport().then(() => {
        console.log('\n🏁 Innstant Travel import process completed!');
        process.exit(0);
    }).catch(error => {
        console.error('\n💥 Process failed:', error);
        process.exit(1);
    });
}
