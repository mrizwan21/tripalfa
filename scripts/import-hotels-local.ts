import fetch from 'node-fetch';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const pool = new pg.Pool({
    connectionString: 'postgresql://postgres@localhost:5432/tripalfa_local',
    max: 5,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
});

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';

interface CountryData {
    code: string;
    name?: string;
}

interface HotelData {
    id: string;
    primaryHotelId?: string;
    name?: string;
    hotelDescription?: string;
    hotelTypeId?: string;
    chainId?: string;
    chain?: string;
    currency?: string;
    country?: string;
    city?: string;
    latitude?: number;
    longitude?: number;
    address?: string;
    zip?: string;
    main_photo?: string;
    thumbnail?: string;
    stars?: number;
    rating?: number;
    reviewCount?: number;
    facilityIds?: string[];
}

class HotelsImporter {
    retryCount: number = 3;
    retryDelay: number = 2000;

    async fetchCountries(): Promise<CountryData[]> {
        console.log('Fetching countries list...');
        const response = await fetch(`${BASE_URL}/countries`, {
            headers: {
                'X-API-Key': process.env.LITEAPI_API_KEY || '',
            },
        });
        const data = await response.json();
        return data.data || [];
    }

    async importHotels(countriesData: CountryData[]): Promise<void> {
        console.log(`\nImporting hotels for ${countriesData.length} countries to LOCAL database...\n`);
        let totalImported = 0;
        let totalFailed = 0;

        for (let i = 0; i < countriesData.length; i++) {
            const country = countriesData[i];
            if (!country.code) continue;

            let retries = 0;
            let success = false;

            while (retries < this.retryCount && !success) {
                try {
                    const hotelsResponse = await fetch(`${BASE_URL}/hotels?countryCode=${country.code}`, {
                        headers: {
                            'X-API-Key': process.env.LITEAPI_API_KEY || '',
                        }
                    });

                    if (!hotelsResponse.ok) {
                        console.warn(`  ⚠️  Country ${country.code} (${i + 1}/${countriesData.length}): HTTP ${hotelsResponse.status}`);
                        totalFailed++;
                        success = true;
                        continue;
                    }

                    const hotelsData = await hotelsResponse.json();
                    if (!hotelsData.data || !Array.isArray(hotelsData.data)) {
                        success = true;
                        continue;
                    }

                    const client = await pool.connect();
                    try {
                        for (const hotel of hotelsData.data as HotelData[]) {
                            if (!hotel.id) continue;

                            try {
                                await client.query(
                                    `INSERT INTO hotels (
                    id, primary_hotel_id, name, description, hotel_type_id, chain_id, chain_name,
                    currency, country_code, city, latitude, longitude, address, zip_code,
                    main_photo_url, thumbnail_url, stars, rating, review_count, facility_ids
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
                  ON CONFLICT (id) DO UPDATE SET
                    name = EXCLUDED.name,
                    description = EXCLUDED.description,
                    rating = EXCLUDED.rating,
                    review_count = EXCLUDED.review_count,
                    updated_at = CURRENT_TIMESTAMP`,
                                    [
                                        hotel.id,
                                        hotel.primaryHotelId || null,
                                        hotel.name || 'Unknown Hotel',
                                        hotel.hotelDescription || null,
                                        hotel.hotelTypeId || null,
                                        hotel.chainId || null,
                                        hotel.chain || null,
                                        hotel.currency || null,
                                        hotel.country || country.code,
                                        hotel.city || null,
                                        hotel.latitude || null,
                                        hotel.longitude || null,
                                        hotel.address || null,
                                        hotel.zip || null,
                                        hotel.main_photo || null,
                                        hotel.thumbnail || null,
                                        hotel.stars || null,
                                        hotel.rating || null,
                                        hotel.reviewCount || null,
                                        hotel.facilityIds ? JSON.stringify(hotel.facilityIds) : null
                                    ]
                                );
                                totalImported++;
                            } catch (error) {
                                // Skip individual hotel errors
                            }
                        }
                    } finally {
                        client.release();
                    }

                    success = true;

                    if ((i + 1) % 25 === 0) {
                        console.log(`  ✓ Processed ${i + 1}/${countriesData.length} countries (${totalImported} hotels imported)`);
                    }
                } catch (error) {
                    retries++;
                    if (retries < this.retryCount) {
                        console.warn(`  ⚠️  Error for ${country.code} (retry ${retries}/${this.retryCount}):`, (error as Error).message);
                        await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                    } else {
                        console.warn(`  ✗ Failed to import hotels for ${country.code} after ${this.retryCount} retries`);
                        totalFailed++;
                        success = true;
                    }
                }
            }
        }

        console.log(`\n✓ Hotels import to LOCAL database completed: ${totalImported} hotels imported`);
    }

    async run(): Promise<void> {
        try {
            console.log('🏨 Starting Hotels Import to LOCAL PostgreSQL Database...\n');
            const countries = await this.fetchCountries();
            console.log(`✓ Fetched ${countries.length} countries\n`);
            await this.importHotels(countries);
            console.log('\n✓ Hotels import to local database completed!');
        } catch (error) {
            console.error('\n✗ Import failed:', error);
            process.exit(1);
        } finally {
            await pool.end();
        }
    }
}

const importer = new HotelsImporter();
importer.run().catch(console.error);
