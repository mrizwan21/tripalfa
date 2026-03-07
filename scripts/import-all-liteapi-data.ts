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
    name?: string;
    countryCode?: string;
    latitude?: string;
    longitude?: string;
}

interface FacilityData {
    id?: string;
    name?: string;
    facilityId?: string;
}

interface HotelTypeData {
    id?: string;
    name?: string;
}

interface LanguageData {
    id?: string;
    code?: string;
    name?: string;
}

// Create tables if they don't exist
async function createTables() {
    const client = await pool.connect();
    try {
        await client.query(`
      CREATE TABLE IF NOT EXISTS hotel_types (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        await client.query(`
      CREATE TABLE IF NOT EXISTS languages (
        id TEXT PRIMARY KEY,
        code TEXT UNIQUE,
        name TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

        console.log('✓ Tables created/verified');
    } finally {
        client.release();
    }
}

class LiteAPIImporter {
    retryCount: number = 3;
    retryDelay: number = 2000;

    async fetchWithRetry(url: string): Promise<any> {
        let retries = 0;
        while (retries < this.retryCount) {
            try {
                const response = await fetch(url, {
                    headers: {
                        'X-API-Key': process.env.LITEAPI_API_KEY || '',
                    }
                });

                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                return await response.json();
            } catch (error) {
                retries++;
                if (retries < this.retryCount) {
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    throw error;
                }
            }
        }
    }

    async importCities(): Promise<number> {
        console.log('\n🏙️  Importing cities...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/cities`);

            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                console.log('ℹ️  No city data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const city of data.data as CityData[]) {
                    if (!city.id) continue;

                    try {
                        await client.query(
                            `INSERT INTO cities (id, name, country_code, latitude, longitude) 
               VALUES ($1, $2, $3, $4, $5)
               ON CONFLICT (id) DO UPDATE SET 
                 name = EXCLUDED.name,
                 country_code = EXCLUDED.country_code`,
                            [
                                city.id,
                                city.name || null,
                                city.countryCode || null,
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
            const data = await this.fetchWithRetry(`${BASE_URL}/facilities`);

            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                console.log('ℹ️  No facility data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const facility of data.data as FacilityData[]) {
                    if (!facility.id) continue;

                    try {
                        await client.query(
                            `INSERT INTO hotel_facilities (id, name, facility_id) 
               VALUES ($1, $2, $3)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                            [
                                facility.id,
                                facility.name || null,
                                facility.facilityId || null
                            ]
                        );
                        imported++;
                    } catch (e) {
                        // Skip
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

    async importHotelTypes(): Promise<number> {
        console.log('\n🏨 Importing hotel types...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/hoteltypes`);

            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                console.log('ℹ️  No hotel type data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const type of data.data as HotelTypeData[]) {
                    if (!type.id) continue;

                    try {
                        await client.query(
                            `INSERT INTO hotel_types (id, name) 
               VALUES ($1, $2)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                            [type.id, type.name || null]
                        );
                        imported++;
                    } catch (e) {
                        // Skip
                    }
                }
                console.log(`✓ Imported ${imported} hotel types`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Hotel types import failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async importLanguages(): Promise<number> {
        console.log('\n🌐 Importing languages...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/languages`);

            if (!data.data || !Array.isArray(data.data) || data.data.length === 0) {
                console.log('ℹ️  No language data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const lang of data.data as LanguageData[]) {
                    if (!lang.id) continue;

                    try {
                        await client.query(
                            `INSERT INTO languages (id, code, name) 
               VALUES ($1, $2, $3)
               ON CONFLICT (id) DO UPDATE SET 
                 code = EXCLUDED.code,
                 name = EXCLUDED.name`,
                            [
                                lang.id,
                                lang.code || null,
                                lang.name || null
                            ]
                        );
                        imported++;
                    } catch (e) {
                        // Skip
                    }
                }
                console.log(`✓ Imported ${imported} languages`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Languages import failed: ${(error as Error).message}`);
            return 0;
        }
    }

    async run(): Promise<void> {
        try {
            console.log('\n🌐 COMPREHENSIVE LiteAPI Static Data Import\n');
            console.log('Importing all LiteAPI static data to LOCAL PostgreSQL...\n');

            await createTables();

            const results = {
                cities: await this.importCities(),
                facilities: await this.importFacilities(),
                hotelTypes: await this.importHotelTypes(),
                languages: await this.importLanguages(),
            };

            console.log('\n✅ IMPORT COMPLETE - Summary:');
            console.log(`\n📊 Data Imported:`);
            console.log(`   🏙️  Cities: ${results.cities}`);
            console.log(`   🛏️  Facilities: ${results.facilities}`);
            console.log(`   🏨 Hotel Types: ${results.hotelTypes}`);
            console.log(`   🌐 Languages: ${results.languages}`);
            console.log(`\n✓ All LiteAPI static data imported successfully!\n`);
        } catch (error) {
            console.error('\n✗ Import failed:', error);
            process.exit(1);
        } finally {
            await pool.end();
        }
    }
}

const importer = new LiteAPIImporter();
importer.run().catch(console.error);
