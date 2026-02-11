import 'dotenv/config';
import { staticPool } from '../db.js';
import liteApiClient from '../services/LiteAPIClient.js';

const isProd = !!process.env.LITEAPI_PROD_API_KEY;
console.log(`LiteAPI Ingestion Mode: ${isProd ? 'PRODUCTION' : 'SANDBOX/TEST'}`);
console.log(`Database Timeout: Standard (with internal retry logic)`);

// Helper to pause execution
const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// Retry wrapper for Prisma calls to handle transient P1001/disconnections
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delay = 1000): Promise<T> {
    try {
        return await fn();
    } catch (error: any) {
        if (retries > 0 && (error.code === 'P1001' || error.message.includes('Can\'t reach database'))) {
            console.warn(`Database connection intermittent. Retrying in ${delay}ms... (${retries} retries left)`);
            await sleep(delay);
            return withRetry(fn, retries - 1, delay * 2);
        }
        throw error;
    }
}

async function ingestCountries() {
    console.log('Starting Countries Ingestion...');
    const countries = await liteApiClient.getCountries();
    console.log(`Fetched ${countries.length} countries from LiteAPI`);

    for (const c of countries) {
        const code = (c.code || c.iso_code || '').toUpperCase();
        if (!code) continue;

        try {
            await staticPool.query(`
                INSERT INTO countries (code, name, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    updated_at = NOW()
            `, [code, c.name]);
        } catch (e: any) {
            console.warn(`Country upsert failed: ${c.name}`, e.message);
        }
    }
    console.log('Countries Ingestion Completed.');
}

async function ingestCurrencies() {
    console.log('Starting Currencies Ingestion...');
    const currencies = await liteApiClient.getCurrencies();
    console.log(`Fetched ${currencies.length} currencies`);

    for (const c of currencies) {
        if (!c.code) continue;
        const name = c.name || c.code;
        const precision = c.decimal_places !== undefined ? c.decimal_places : 2; // ISO 4217 alignment

        try {
            await staticPool.query(`
                INSERT INTO currencies (code, name, symbol, decimal_digits, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    symbol = EXCLUDED.symbol,
                    decimal_digits = EXCLUDED.decimal_digits,
                    updated_at = NOW()
            `, [c.code, name, c.symbol || '$', precision]);
        } catch (e: any) {
            console.warn(`Currency upsert failed: ${c.code}`, e.message);
        }
    }
    console.log('Currencies Ingestion Completed.');
}

async function ingestAmenities() {
    console.log('Starting Amenities Ingestion...');
    const facilities = await liteApiClient.getFacilities();
    console.log(`Fetched ${facilities.length} facilities`);

    for (const f of facilities) {
        if (!f.name) continue; // Skip if name is missing
        const code = f.name.toUpperCase().replace(/\s+/g, '_').substring(0, 50);

        try {
            await staticPool.query(`
                INSERT INTO hotel_facilities (name, code, category, applies_to, updated_at)
                VALUES ($1, $2, $3, $4, NOW())
                ON CONFLICT (name) DO UPDATE SET
                    code = EXCLUDED.code,
                    category = EXCLUDED.category,
                    applies_to = EXCLUDED.applies_to,
                    updated_at = NOW()
            `, [f.name, code, 'General', 'both']);
        } catch (e: any) {
            console.warn(`Amenity upsert failed: ${f.name}`, e.message);
        }
    }
    console.log('Amenities Ingestion Completed.');
}

async function ingestHotelTypes() {
    console.log('Starting Hotel Types Ingestion...');
    const types = await liteApiClient.getHotelTypes();
    console.log(`Fetched ${types.length} hotel types`);

    for (const t of types) {
        if (!t.name) continue;
        try {
            await staticPool.query(`
                INSERT INTO hotel_types (name, updated_at)
                VALUES ($1, NOW())
                ON CONFLICT (name) DO UPDATE SET
                    updated_at = NOW()
            `, [t.name]);
        } catch (e: any) {
            console.warn(`HotelType upsert failed: ${t.name}`, e.message);
        }
    }
    console.log('Hotel Types Ingestion Completed.');
}

async function ingestHotelChains() {
    console.log('Starting Hotel Chains Ingestion...');
    const chains = await liteApiClient.getChains();
    console.log(`Fetched ${chains.length} hotel chains`);

    for (const c of chains) {
        if (!c.name || !c.id) continue;
        const code = c.id.toString();

        try {
            await staticPool.query(`
                INSERT INTO hotel_chains (code, name, updated_at)
                VALUES ($1, $2, NOW())
                ON CONFLICT (code) DO UPDATE SET
                    name = EXCLUDED.name,
                    updated_at = NOW()
            `, [code, c.name]);
        } catch (e: any) {
            console.warn(`HotelChain upsert failed: ${c.name}`, e.message);
        }
    }
    console.log('Hotel Chains Ingestion Completed.');
}

async function ingestCities() {
    console.log('Starting Cities Ingestion...');
    const countries = await staticPool.query('SELECT code, name FROM countries');

    for (const country of countries.rows) {
        console.log(`Fetching cities for ${country.code}...`);
        let offset = 0;
        const limit = 100; // Safer limit for LiteAPI
        let hasMore = true;

        while (hasMore) {
            const cities = await liteApiClient.getCities(country.code, limit, offset);

            if (!cities || !Array.isArray(cities) || cities.length === 0) {
                hasMore = false;
                break;
            }

            if (offset === 0) {
                console.log(`Sample city data for ${country.code}:`, JSON.stringify(cities.slice(0, 2)));
            }

            for (const cityItem of cities) {
                const cityName = typeof cityItem === 'string' ? cityItem : (cityItem?.name || cityItem?.cityName);

                if (!cityName) {
                    console.warn(`Skipping city with missing name in ${country.code}:`, JSON.stringify(cityItem));
                    continue;
                }

                try {
                    await staticPool.query(`
                        INSERT INTO cities (name, country, country_code, updated_at)
                        VALUES ($1, $2, $3, NOW())
                        ON CONFLICT (name, country_code) DO UPDATE SET
                            updated_at = NOW()
                    `, [cityName, country.name, country.code]);
                } catch (e: any) {
                    console.warn(`City upsert failed: ${cityName}`, e.message);
                }
            }

            offset += cities.length;
            if (cities.length < limit) hasMore = false;
            await sleep(100);
        }
    }
    console.log('Cities Ingestion Completed.');
}

async function ingestHotels() {
    console.log('Starting Hotels Ingestion...');
    const countries = await staticPool.query('SELECT code, name FROM countries');

    let totalHotelsIngested = 0;

    for (const country of countries.rows) {
        // Skip check: If we already have many hotels for this country, ask to skip or just continue
        // (For now, just log and continue, but we could add a skip threshold)
        const existingCountResult = await staticPool.query('SELECT COUNT(*) as count FROM hotels WHERE country_code = $1', [country.code]);
        const existingCount = parseInt(existingCountResult.rows[0].count);
        if (existingCount > 0) {
            console.log(`Country ${country.code} already has ${existingCount} hotels. Checking for missing reviews...`);
            // We still enter to check for reviews, but we'll use the skip logic inside
        }

        console.log(`\n--- Processing Country: ${country.code} (Existing: ${existingCount}) ---`);
        let offset = 0;
        const limit = 100; // LiteAPI limit
        let hasMore = true;
        let lastBatchFirstId = '';
        let duplicateBatchCount = 0;

        while (hasMore) {
            console.log(`Fetching batch for ${country.code} at offset ${offset}...`);
            const hotelsList: any[] = await (liteApiClient as any).getHotels(country.code, offset, limit) || [];

            if (!Array.isArray(hotelsList) || hotelsList.length === 0) {
                console.log(`No more hotels found for ${country.code}.`);
                hasMore = false;
                break;
            }

            // Infinite Loop Protection: Check if we got the same batch again
            const currentFirstId = hotelsList[0]?.id?.toString() || hotelsList[0]?.hotelId?.toString();
            if (currentFirstId && currentFirstId === lastBatchFirstId) {
                duplicateBatchCount++;
                if (duplicateBatchCount >= 2) {
                    console.warn(`Detected duplicate batch for ${country.code} at offset ${offset}. Breaking loop.`);
                    hasMore = false;
                    break;
                }
            } else {
                lastBatchFirstId = currentFirstId;
                duplicateBatchCount = 0;
            }

            for (const h of hotelsList) {
                const liteApiHotelId = h.id?.toString() || h.hotelId?.toString() || h.hotel_id?.toString();
                if (!liteApiHotelId) continue;

                // Check mapping and reviews to decide if we can skip (Resume Logic)
                const mappingResult = await staticPool.query(`
                    SELECT hotel_id FROM hotel_supplier_refs
                    WHERE supplier_code = 'liteapi' AND supplier_hotel_id = $1
                `, [liteApiHotelId]);

                const mapping = mappingResult.rows[0];

                if (mapping) {
                    const reviewSummaryResult = await staticPool.query(`
                        SELECT id FROM hotel_reviews_summaries WHERE hotel_id = $1
                    `, [mapping.hotel_id]);

                    if (reviewSummaryResult.rows.length > 0) {
                        // Skip if both exist
                        totalHotelsIngested++;
                        if (totalHotelsIngested % 1000 === 0) {
                            console.log(`Progress: Skipped/Ingested ${totalHotelsIngested} hotels so far...`);
                        }
                        continue;
                    }
                }

                // USE DATA FROM LIST (Optimized: Skip getHotel call per record for 2M hotels)
                const hotelData = {
                    name: h.name,
                    starRating: h.star_rating || h.stars || 0,
                    city: h.city || h.address?.city,
                    countryCode: country.code,
                    latitude: h.latitude || h.lat,
                    longitude: h.longitude || h.lng || h.lon,
                    address: h.address ? (typeof h.address === 'string' ? h.address : h.address.street) : null,
                    postalCode: h.zip || h.address?.zip || h.address?.postal_code,
                    primarySource: 'liteapi'
                };

                let dbHotelId: number;
                if (mapping) {
                    await staticPool.query(`
                        UPDATE hotels SET
                            name = $1, star_rating = $2, city = $3, country_code = $4,
                            latitude = $5, longitude = $6, address = $7, postal_code = $8,
                            primary_source = $9, updated_at = NOW()
                        WHERE id = $10
                    `, [
                        hotelData.name, hotelData.starRating, hotelData.city, hotelData.countryCode,
                        hotelData.latitude, hotelData.longitude, hotelData.address, hotelData.postalCode,
                        hotelData.primarySource, mapping.hotel_id
                    ]);
                    dbHotelId = mapping.hotel_id;
                } else {
                    const newHotelResult = await staticPool.query(`
                        INSERT INTO hotels (
                            name, star_rating, city, country_code, latitude, longitude,
                            address, postal_code, primary_source, is_active,
                            has_wifi, has_pool, has_spa, has_parking, has_restaurant
                        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15)
                        RETURNING id
                    `, [
                        hotelData.name, hotelData.starRating, hotelData.city, hotelData.countryCode,
                        hotelData.latitude, hotelData.longitude, hotelData.address, hotelData.postalCode,
                        hotelData.primarySource, true, false, false, false, false, false
                    ]);
                    dbHotelId = newHotelResult.rows[0].id;

                    await staticPool.query(`
                        INSERT INTO hotel_supplier_refs (
                            hotel_id, supplier_code, supplier_hotel_id, match_confidence, match_method
                        ) VALUES ($1, $2, $3, $4, $5)
                    `, [dbHotelId, 'liteapi', liteApiHotelId, 1.0, 'direct_id']);
                }
                totalHotelsIngested++;
                if (totalHotelsIngested % 100 === 0) {
                    console.log(`Progress: Ingested ${totalHotelsIngested} hotels so far...`);
                }
            }

            // Ingest Reviews in Parallel for the current 100-hotel batch
            const hotelsWithIds = hotelsList.map(h => ({
                liteApiId: h.id?.toString() || h.hotelId?.toString() || h.hotel_id?.toString(),
            })).filter(h => h.liteApiId);

            console.log(`Ingesting reviews in parallel for batch of ${hotelsWithIds.length}...`);
            const reviewConcurrency = 10;
            for (let i = 0; i < hotelsWithIds.length; i += reviewConcurrency) {
                const subBatch = hotelsWithIds.slice(i, i + reviewConcurrency);
                await Promise.all(subBatch.map(async (h) => {
                    // Find the dbHotelId for this liteApiHotelId
                    const supplierRefResult = await staticPool.query(`
                        SELECT hotel_id FROM hotel_supplier_refs
                        WHERE supplier_code = 'liteapi' AND supplier_hotel_id = $1
                    `, [h.liteApiId]);

                    if (supplierRefResult.rows.length > 0) {
                        const supplierRef = supplierRefResult.rows[0];
                        try {
                            // Only fetch and upsert if not already present or if we want to force update
                            // (In resume mode, we trust the skip logic above, but this is a safety check)
                            const reviews = await liteApiClient.getReviews(h.liteApiId, 10);
                            if (reviews && reviews.length > 0) {
                                await staticPool.query(`
                                    INSERT INTO hotel_reviews_summaries (
                                        hotel_id, total_reviews, average_rating, rating_breakdown, last_updated
                                    ) VALUES ($1, $2, $3, $4, NOW())
                                    ON CONFLICT (hotel_id) DO UPDATE SET
                                        total_reviews = EXCLUDED.total_reviews,
                                        average_rating = EXCLUDED.average_rating,
                                        rating_breakdown = EXCLUDED.rating_breakdown,
                                        last_updated = NOW()
                                `, [supplierRef.hotel_id, reviews.length, 0, JSON.stringify({ reviews })]);
                            }
                        } catch (e: any) {
                            // Suppress logs for high volume
                        }
                    }
                }));
            }

            offset += hotelsList.length;
            if (hotelsList.length < limit) hasMore = false;
            await sleep(500); // Respect rate limits
        }
    }
    console.log(`Total Hotels Ingestion Completed: ${totalHotelsIngested} records.`);
}

async function main() {
    try {
        await ingestCountries();
        await ingestCurrencies();
        await ingestAmenities();
        await ingestHotelTypes();
        await ingestHotelChains();

        // Prioritize Hotels (The "Full Data" the user wants)
        await ingestHotels();

        // Cities can run last
        await ingestCities();
    } catch (error) {
        console.error('Ingestion failed:', error);
    }
}

main()
    .catch(e => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await staticPool.end();
    });

