import { Pool } from 'pg';
import pLimit from 'p-limit';
import path from 'path';
import dotenv from 'dotenv';
import { findOrCreateCanonicalHotel, HotelData } from './mapping-utils';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';

const pool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});

const limit = pLimit(20); // High concurrency for bulk mapping

const BATCH_SIZE = 2000;

async function bulkMapLiteAPI() {
    console.log('--- Starting Massive Scale LITEAPI Mapping ---');

    let processedCount = 0;
    let hasMore = true;

    while (hasMore) {
        console.log(`📡 Fetching next batch of ${BATCH_SIZE} unmapped LITEAPI hotels...`);

        // Find hotels that are NOT in hotel_supplier_mappings
        // We use a LEFT JOIN + NULL check for the mapping table
        const res = await pool.query(`
            SELECT h.* 
            FROM hotels h
            LEFT JOIN hotel_supplier_mappings m ON h.id = m.supplier_hotel_id
            WHERE h.external_source = 'LITEAPI' 
              AND h.external_id IS NOT NULL 
              AND h.external_id != ''
              AND m.supplier_hotel_id IS NULL
            LIMIT $1
        `, [BATCH_SIZE]);

        const unmappedHotels = res.rows;

        if (unmappedHotels.length === 0) {
            console.log('✅ All LITEAPI hotels have been mapped!');
            hasMore = false;
            break;
        }

        console.log(`🧪 Mapping ${unmappedHotels.length} hotels in this batch...`);

        const tasks = unmappedHotels.map(hotel =>
            limit(async () => {
                const hotelData: HotelData = {
                    name: hotel.name,
                    address: hotel.address,
                    city: hotel.city,
                    country: hotel.country,
                    stars: hotel.star_rating,
                    latitude: hotel.latitude,
                    longitude: hotel.longitude,
                    amenities: JSON.parse(JSON.stringify(hotel.amenities || [])),
                    images: JSON.parse(JSON.stringify(hotel.images || [])),
                    external_id: hotel.external_id,
                    external_source: 'LITEAPI'
                };

                await findOrCreateCanonicalHotel(pool, hotelData, hotel.id);
            })
        );

        await Promise.all(tasks);

        processedCount += unmappedHotels.length;
        console.log(`✅ Batch complete. Total processed: ${processedCount}`);
    }

    console.log('--- Massive Scale LITEAPI Mapping Complete ---');
    await pool.end();
}

bulkMapLiteAPI().catch(err => {
    console.error('❌ Bulk mapping failed:', err);
    process.exit(1);
});
