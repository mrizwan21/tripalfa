import { Pool } from 'pg';
import crypto from 'crypto';

const pool = new Pool({
    connectionString: process.env.STATIC_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/staticdatabase'
});

async function populateNormalizedTables() {
    console.log('🚀 Starting data normalization...');
    const client = await pool.connect();

    try {
        // 1. Fetch all amenities for mapping
        console.log('Fetching amenities mapping...');
        const amenityResult = await client.query('SELECT id, code FROM amenities');
        const amenityMap = new Map<string, number>();
        amenityResult.rows.forEach(row => amenityMap.set(row.code, row.id));

        // 2. Process Canonical Hotels
        console.log('Processing canonical_hotels...');
        const hotelsResult = await client.query('SELECT id, amenities, images FROM canonical_hotels WHERE amenities IS NOT NULL OR images IS NOT NULL');

        for (const hotel of hotelsResult.rows) {
            const hotelId = hotel.id;

            // Process Amenities
            if (hotel.amenities && Array.isArray(hotel.amenities)) {
                for (const amenityName of hotel.amenities) {
                    if (typeof amenityName !== 'string') continue;

                    const code = amenityName.toUpperCase()
                        .replace(/\s+/g, '_')
                        .replace(/\//g, '_')
                        .replace(/-/g, '_')
                        .replace(/[^A-Z0-9_]/g, '');

                    const amenityId = amenityMap.get(code);
                    if (amenityId) {
                        await client.query(
                            'INSERT INTO hotel_amenity_instances (canonical_hotel_id, amenity_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                            [hotelId, amenityId]
                        );
                    }
                }
            }

            // Process Images
            if (hotel.images && Array.isArray(hotel.images)) {
                for (let i = 0; i < hotel.images.length; i++) {
                    const img = hotel.images[i];
                    const url = typeof img === 'string' ? img : img.url;
                    if (!url) continue;

                    const urlHash = crypto.createHash('md5').update(url).digest('hex');
                    const caption = typeof img === 'object' ? img.caption : null;
                    const isPrimary = i === 0;

                    await client.query(
                        `INSERT INTO hotel_images (canonical_hotel_id, url, url_hash, caption, is_primary, sort_order) 
                         VALUES ($1, $2, $3, $4, $5, $6) 
                         ON CONFLICT (canonical_hotel_id, url_hash) DO NOTHING`,
                        [hotelId, url, urlHash, caption, isPrimary, i]
                    );
                }
            }
        }

        console.log('✅ Data normalization completed successfully!');
    } catch (error) {
        console.error('❌ Data normalization failed:', error);
    } finally {
        client.release();
        await pool.end();
    }
}

populateNormalizedTables();
