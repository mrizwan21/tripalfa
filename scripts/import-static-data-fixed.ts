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

interface CityData {
    id?: string;
    code?: string;
    cityId?: string;
    name?: string;
    cityName?: string;
    countryCode?: string;
    country?: string;
    latitude?: string;
    longitude?: string;
}

interface FacilityData {
    id?: string;
    facilityId?: string;
    name?: string;
    facilityName?: string;
}

class StaticDataImporter {
    retryCount: number = 3;
    retryDelay: number = 2000;

    async fetchWithRetry(url: string, options: any = {}): Promise<any> {
        let retries = 0;
        while (retries < this.retryCount) {
            try {
                console.log(`  📡 Fetching: ${url}`);
                const response = await fetch(url, {
                    headers: {
                        'X-API-Key': process.env.LITEAPI_API_KEY || '',
                    },
                    ...options
                });

                if (!response.ok) {
                    console.log(`  ⚠️  HTTP ${response.status}`);
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log(`  ✓ Retrieved data`);
                return data;
            } catch (error) {
                retries++;
                if (retries < this.retryCount) {
                    console.log(`  ⚠️  Retry ${retries}/${this.retryCount}`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    console.log(`  ✗ Failed: ${(error as Error).message}`);
                    throw error;
                }
            }
        }
    }

    async importCities(): Promise<number> {
        console.log('\n🏙️  Importing cities...');
        try {
            let data: any;

            // Try different endpoints
            try {
                data = await this.fetchWithRetry(`${BASE_URL}/cities`);
            } catch (e1) {
                console.log('  Trying alternative endpoint...');
                data = await this.fetchWithRetry(`${BASE_URL}/destinations`);
            }

            if (!data.data || !Array.isArray(data.data)) {
                console.log('ℹ️  No city data available from API');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const city of data.data as CityData[]) {
                    const cityId = city.id || city.code || city.cityId;
                    if (!cityId) continue;

                    try {
                        await client.query(
                            `INSERT INTO cities (id, name, country_code, latitude, longitude) 
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                            [
                                cityId,
                                city.name || city.cityName || null,
                                city.countryCode || city.country || null,
                                city.latitude ? parseFloat(city.latitude) : null,
                                city.longitude ? parseFloat(city.longitude) : null
                            ]
                        );
                        imported++;
                    } catch (e) {
                        // Skip individual errors
                    }
                }
                console.log(`✓ Imported ${imported} cities`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Cities import failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async importFacilities(): Promise<number> {
        console.log('\n🛏️  Importing hotel facilities...');
        try {
            let data: any;

            // Try different endpoints
            try {
                data = await this.fetchWithRetry(`${BASE_URL}/facilities`);
            } catch (e1) {
                console.log('  Trying alternative endpoint...');
                data = await this.fetchWithRetry(`${BASE_URL}/amenities`);
            }

            if (!data.data || !Array.isArray(data.data)) {
                console.log('ℹ️  No facilities data available from API');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const facility of data.data as FacilityData[]) {
                    const facilityId = facility.id || facility.facilityId;
                    if (!facilityId) continue;

                    try {
                        await client.query(
                            `INSERT INTO hotel_facilities (id, name, facility_id) 
               VALUES ($1, $2, $3)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                            [
                                facilityId,
                                facility.name || facility.facilityName || null,
                                facility.facilityId ? parseInt(facility.facilityId) : (parseInt(facilityId) || null)
                            ]
                        );
                        imported++;
                    } catch (e) {
                        // Skip individual errors
                    }
                }
                console.log(`✓ Imported ${imported} hotel facilities`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Facilities import failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async run(): Promise<void> {
        try {
            console.log('\n🌐 Importing Missing Static Data to LOCAL PostgreSQL\n');

            const cities = await this.importCities();
            const facilities = await this.importFacilities();

            console.log('\n✅ Missing Data Import Summary:');
            console.log(`   🏙️  Cities: ${cities}`);
            console.log(`   🛏️  Facilities: ${facilities}`);
            console.log('\n✓ Import attempt completed!\n');
        } catch (error) {
            console.error('\n✗ Import failed:', error);
            process.exit(1);
        } finally {
            await pool.end();
        }
    }
}

const importer = new StaticDataImporter();
importer.run().catch(console.error);
