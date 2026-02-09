import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import liteApiClient from '../services/LiteAPIClient.js';
const prisma = new PrismaClient();
// Helper to pause execution
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));
async function ingestCountries() {
    console.log('Starting Countries Ingestion...');
    const countries = await liteApiClient.getCountries();
    console.log(`Fetched ${countries.length} countries from LiteAPI`);
    for (const c of countries) {
        const code = (c.code || c.iso_code || '').toUpperCase();
        if (!code)
            continue;
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
        if (!c.code)
            continue;
        await prisma.currency.upsert({
            where: { code: c.code },
            update: { name: c.name },
            create: { code: c.code, name: c.name, symbol: c.symbol || '$' }
        }).catch(e => console.warn(`Currency upsert failed: ${c.code}`, e.message));
    }
    console.log('Currencies Ingestion Completed.');
}
async function ingestAmenities() {
    console.log('Starting Amenities Ingestion...');
    const facilities = await liteApiClient.getFacilities();
    console.log(`Fetched ${facilities.length} facilities`);
    for (const f of facilities) {
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
        }
        else {
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
async function ingestCities() {
    console.log('Starting Cities Ingestion...');
    const countries = await prisma.country.findMany();
    for (const country of countries) {
        console.log(`Fetching cities for ${country.code}...`);
        let offset = 0;
        const limit = 1000;
        let hasMore = true;
        while (hasMore) {
            const cities = await liteApiClient.getCities(country.code, limit, offset);
            if (!cities || cities.length === 0) {
                hasMore = false;
                break;
            }
            for (const city of cities) {
                // City doesn't have unique constraint on name/countryCode in schema,
                // so we findFirst then create or update.
                const existing = await prisma.city.findFirst({
                    where: { name: city.name, countryCode: country.code }
                });
                if (existing) {
                    await prisma.city.update({
                        where: { id: existing.id },
                        data: { updatedAt: new Date() }
                    });
                }
                else {
                    await prisma.city.create({
                        data: {
                            name: city.name,
                            countryCode: country.code,
                            country: country.name
                        }
                    }).catch(e => console.warn(`City creation failed: ${city.name}`, e.message));
                }
            }
            offset += cities.length;
            if (cities.length < limit)
                hasMore = false;
            await sleep(200);
        }
    }
    console.log('Cities Ingestion Completed.');
}
async function ingestHotels() {
    console.log('Starting Hotels Ingestion...');
    const countries = await prisma.country.findMany();
    for (const country of countries) {
        console.log(`Fetching hotels for Country: ${country.code}...`);
        let offset = 0;
        const limit = 1000;
        let hasMore = true;
        while (hasMore) {
            const hotelsList = await liteApiClient.getHotels(country.code, offset, limit) || [];
            if (hotelsList.length === 0) {
                hasMore = false;
                break;
            }
            for (const h of hotelsList) {
                const liteApiHotelId = h.id?.toString() || h.hotel_id?.toString();
                if (!liteApiHotelId)
                    continue;
                // Check mapping first
                const mapping = await prisma.hotelSupplierRef.findUnique({
                    where: {
                        supplierCode_supplierHotelId: {
                            supplierCode: 'liteapi',
                            supplierHotelId: liteApiHotelId
                        }
                    }
                });
                const hotelData = {
                    name: h.name,
                    starRating: h.star_rating || h.stars || 0,
                    city: h.city || h.address?.city,
                    countryCode: country.code,
                    latitude: h.latitude,
                    longitude: h.longitude,
                    policies: { raw: h },
                    primarySource: 'liteapi'
                };
                if (mapping) {
                    // Update existing hotel
                    await prisma.hotel.update({
                        where: { id: mapping.hotelId },
                        data: hotelData
                    }).catch(e => console.warn(`Hotel update failed: ${h.name}`, e.message));
                }
                else {
                    // Create new hotel and mapping
                    try {
                        const newHotel = await prisma.hotel.create({
                            data: {
                                ...hotelData,
                                isActive: true
                            }
                        });
                        await prisma.hotelSupplierRef.create({
                            data: {
                                hotelId: newHotel.id,
                                supplierCode: 'liteapi',
                                supplierHotelId: liteApiHotelId,
                                matchConfidence: 1.0,
                                matchMethod: 'direct_id'
                            }
                        });
                    }
                    catch (e) {
                        console.warn(`Hotel creation failed: ${h.name}`, e.message);
                    }
                }
            }
            offset += hotelsList.length;
            if (hotelsList.length < limit)
                hasMore = false;
            await sleep(200);
        }
    }
    console.log('Hotels Ingestion Completed.');
}
async function main() {
    try {
        await ingestCountries();
        await ingestCurrencies();
        await ingestAmenities();
        await ingestCities();
        await ingestHotels();
    }
    catch (error) {
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
