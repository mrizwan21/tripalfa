import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import liteApiClient from '../services/LiteAPIClient.js';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.STATIC_DATABASE_URL
        }
    },
    // Add timeout to handle slow checkpoints
    errorFormat: 'minimal',
});
// Note: Prisma 5.x+ uses a different way for timeout but we'll stick to basic retry for now.
// For the connection itself:
process.env.PRISMA_CLIENT_ENGINE_TYPE = 'binary';

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

        await prisma.country.upsert({
            where: { code },
            update: { name: c.name },
            create: { code, name: c.name }
        }).catch(e => console.warn(`Country upsert failed: ${c.name}`, e.message));
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
            await prisma.currency.upsert({
                where: { code: c.code },
                update: {
                    name: name,
                    decimalPlaces: precision
                },
                create: {
                    code: c.code,
                    name: name,
                    symbol: c.symbol || '$',
                    decimalPlaces: precision
                }
            });
        } catch (e: any) {
            if (e.message.includes('decimal_places')) {
                // Fallback if column missing
                await prisma.currency.upsert({
                    where: { code: c.code },
                    update: { name: name },
                    create: { code: c.code, name: name, symbol: c.symbol || '$' }
                }).catch(err => console.warn(`Currency fallback failed: ${c.code}`, err.message));
            } else {
                console.warn(`Currency upsert failed: ${c.code}`, e.message);
            }
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

        // Use findFirst since name isn't unique in schema
        const existing = await prisma.amenity.findFirst({
            where: { name: f.name }
        });

        if (existing) {
            await prisma.amenity.update({
                where: { id: existing.id },
                data: { category: 'General' }
            });
        } else {
            await prisma.amenity.create({
                data: {
                    name: f.name,
                    code: code,
                    category: 'General',
                    appliesTo: 'both'
                }
            }).catch(e => console.warn(`Amenity creation failed: ${f.name}`, e.message));
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
            await prisma.hotelType.upsert({
                where: { name: t.name },
                update: { updatedAt: new Date() },
                create: {
                    name: t.name
                }
            });
        } catch (e: any) {
            if (e.message.includes('description')) {
                // If description is missing in DB, try without it
                try {
                    await prisma.hotelType.upsert({
                        where: { name: t.name },
                        update: { updatedAt: new Date() },
                        create: { name: t.name }
                    });
                } catch (err: any) {
                    console.warn(`HotelType fallback failed: ${t.name}`, err.message);
                }
            } else {
                console.warn(`HotelType upsert failed: ${t.name}`, e.message);
            }
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

        // Handle name uniqueness conflict: upsert by code but check if name is already taken
        const existingByName = await prisma.hotelChain.findFirst({
            where: { name: c.name }
        });

        if (existingByName && existingByName.code !== code) {
            // If name exists but with different code, update existing one or skip
            await prisma.hotelChain.update({
                where: { id: existingByName.id },
                data: { code: code }
            }).catch(e => console.warn(`HotelChain update failed: ${c.name}`, e.message));
        } else {
            await prisma.hotelChain.upsert({
                where: { code: code },
                update: { name: c.name },
                create: {
                    code: code,
                    name: c.name
                }
            }).catch(e => console.warn(`HotelChain upsert failed: ${c.name}`, e.message));
        }
    }
    console.log('Hotel Chains Ingestion Completed.');
}

async function ingestCities() {
    console.log('Starting Cities Ingestion...');
    const countries = await prisma.country.findMany();

    for (const country of countries) {
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

                const existing = await prisma.city.findFirst({
                    where: { name: cityName, countryCode: country.code }
                });

                if (existing) {
                    await prisma.city.update({
                        where: { id: existing.id },
                        data: { updatedAt: new Date() }
                    });
                } else {
                    await prisma.city.create({
                        data: {
                            name: cityName,
                            countryCode: country.code,
                            country: country.name
                        }
                    }).catch(e => console.warn(`City creation failed: ${cityName}`, e.message));
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
    const countries = await prisma.country.findMany();

    let totalHotelsIngested = 0;

    for (const country of countries) {
        // Skip check: If we already have many hotels for this country, ask to skip or just continue
        // (For now, just log and continue, but we could add a skip threshold)
        const existingCount = await withRetry(() => prisma.hotel.count({ where: { countryCode: country.code } }));
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
                const mapping = await withRetry(() => prisma.hotelSupplierRef.findUnique({
                    where: {
                        supplierCode_supplierHotelId: {
                            supplierCode: 'liteapi',
                            supplierHotelId: liteApiHotelId
                        }
                    }
                }));

                if (mapping) {
                    const reviewSummary = await withRetry(() => prisma.hotelReviewsSummary.findUnique({
                        where: { hotelId: mapping.hotelId }
                    }));
                    if (reviewSummary) {
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
                    await withRetry(() => prisma.hotel.update({
                        where: { id: mapping.hotelId },
                        data: {
                            ...hotelData,
                            updatedAt: new Date()
                        }
                    }));
                    dbHotelId = mapping.hotelId;
                } else {
                    const newHotel = await withRetry(() => prisma.hotel.create({
                        data: {
                            ...hotelData,
                            isActive: true,
                            hasWifi: false,
                            hasPool: false,
                            hasSpa: false,
                            hasParking: false,
                            hasRestaurant: false
                        }
                    }));
                    dbHotelId = newHotel.id;

                    await withRetry(() => prisma.hotelSupplierRef.create({
                        data: {
                            hotelId: newHotel.id,
                            supplierCode: 'liteapi',
                            supplierHotelId: liteApiHotelId,
                            matchConfidence: 1.0,
                            matchMethod: 'direct_id'
                        }
                    }));
                }
                totalHotelsIngested++;
                if (totalHotelsIngested % 100 === 0) {
                    console.log(`Progress: Ingested ${totalHotelsIngested} hotels so far...`);
                }

                // PARALLEL REVIEWS: Collect IDs for batch processing
                // Note: We process in sub-batches of 10 for parallelism to avoid rate limits
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
                    const supplierRef = await withRetry(() => prisma.hotelSupplierRef.findUnique({
                        where: {
                            supplierCode_supplierHotelId: {
                                supplierCode: 'liteapi',
                                supplierHotelId: h.liteApiId
                            }
                        }
                    }));

                    if (supplierRef) {
                        try {
                            // Only fetch and upsert if not already present or if we want to force update
                            // (In resume mode, we trust the skip logic above, but this is a safety check)
                            const reviews = await liteApiClient.getReviews(h.liteApiId, 10);
                            if (reviews && reviews.length > 0) {
                                await withRetry(() => prisma.hotelReviewsSummary.upsert({
                                    where: { hotelId: supplierRef.hotelId },
                                    update: {
                                        totalReviews: reviews.length,
                                        averageRating: 0,
                                        lastUpdated: new Date(),
                                        ratingBreakdown: { reviews }
                                    },
                                    create: {
                                        hotelId: supplierRef.hotelId,
                                        totalReviews: reviews.length,
                                        averageRating: 0,
                                        ratingBreakdown: { reviews }
                                    }
                                }));
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
        await prisma.$disconnect();
    });

