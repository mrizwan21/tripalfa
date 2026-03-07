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

interface CurrencyData {
    code: string;
    name?: string;
    symbol?: string;
}

interface ChainData {
    id: string;
    name?: string;
    website?: string;
}

interface CityData {
    id: string;
    name?: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
}

interface FacilityData {
    id: string;
    name?: string;
    facilityId?: string;
}

class StaticDataImporter {
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
                    console.log(`⚠️  Retry ${retries}/${this.retryCount} for ${url.split('/').pop()}`);
                    await new Promise(resolve => setTimeout(resolve, this.retryDelay));
                } else {
                    throw error;
                }
            }
        }
    }

    async importCurrencies(): Promise<number> {
        console.log('💱 Importing currencies...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/currencies`);
            if (!data.data || !Array.isArray(data.data)) {
                console.log('ℹ️  No currency data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const currency of data.data as CurrencyData[]) {
                    if (!currency.code) continue;

                    try {
                        await client.query(
                            `INSERT INTO currencies (id, code, name, symbol) 
               VALUES ($1, $2, $3, $4)
               ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name`,
                            [
                                currency.code,
                                currency.code,
                                currency.name || null,
                                currency.symbol || null
                            ]
                        );
                        imported++;
                    } catch (e) {
                        // Skip individual errors
                    }
                }
                console.log(`✓ Imported ${imported} currencies`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Failed to import currencies: ${(error as Error).message}`);
            return 0;
        }
    }

    async importChains(): Promise<number> {
        console.log('⛓️  Importing hotel chains...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/chains`);
            if (!data.data || !Array.isArray(data.data)) {
                console.log('ℹ️  No chain data available');
                return 0;
            }

            const client = await pool.connect();
            try {
                let imported = 0;
                for (const chain of data.data as ChainData[]) {
                    if (!chain.id) continue;

                    try {
                        await client.query(
                            `INSERT INTO hotel_chains (id, name, website) 
               VALUES ($1, $2, $3)
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                            [
                                chain.id,
                                chain.name || null,
                                chain.website || null
                            ]
                        );
                        imported++;
                    } catch (e) {
                        // Skip individual errors
                    }
                }
                console.log(`✓ Imported ${imported} hotel chains`);
                return imported;
            } finally {
                client.release();
            }
        } catch (error) {
            console.log(`✗ Failed to import chains: ${(error as Error).message}`);
            return 0;
        }
    }

    async importCities(): Promise<number> {
        console.log('🏙️  Importing cities...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/cities`);
            if (!data.data || !Array.isArray(data.data)) {
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
               ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name`,
                            [
                                city.id,
                                city.name || null,
                                city.countryCode || null,
                                city.latitude || null,
                                city.longitude || null
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
            console.log(`✗ Failed to import cities: ${(error as Error).message}`);
            return 0;
        }
    }

    async importFacilities(): Promise<number> {
        console.log('🛏️  Importing hotel facilities...');
        try {
            const data = await this.fetchWithRetry(`${BASE_URL}/facilities`);
            if (!data.data || !Array.isArray(data.data)) {
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
                                facility.facilityId || facility.id
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
            console.log(`✗ Failed to import facilities: ${(error as Error).message}`);
            return 0;
        }
    }

    async run(): Promise<void> {
        try {
            console.log('\n🌐 Starting LiteAPI Static Data Import to LOCAL PostgreSQL\n');

            const results = {
                currencies: await this.importCurrencies(),
                chains: await this.importChains(),
                cities: await this.importCities(),
                facilities: await this.importFacilities(),
            };

            console.log('\n✅ Static Data Import Summary:');
            console.log(`   💱 Currencies: ${results.currencies}`);
            console.log(`   ⛓️  Hotel Chains: ${results.chains}`);
            console.log(`   🏙️  Cities: ${results.cities}`);
            console.log(`   🛏️  Facilities: ${results.facilities}`);
            console.log('\n✓ All static data imported successfully!\n');
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
