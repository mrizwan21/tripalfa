import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY;
const BASE_URL = 'https://api.liteapi.travel/v3.0/data';
const DB_URL = "postgresql://postgres@localhost:5432/staticdatabase";

if (!LITEAPI_API_KEY) {
    console.error('❌ LITEAPI_API_KEY is missing in .env.local');
    process.exit(1);
}

const pool = new pg.Pool({
    connectionString: DB_URL,
    max: 10,
});

interface FetchOptions {
    headers?: Record<string, string>;
    method?: string;
    body?: string;
}

class UnifiedImporter {
    async fetchWithRetry(url: string, options: FetchOptions = {}, retries = 3): Promise<unknown> {
        for (let i = 0; i < retries; i++) {
            try {
                const response = await fetch(url, {
                    method: options.method || 'GET',
                    headers: {
                        'X-API-Key': LITEAPI_API_KEY as string,
                        'Accept': 'application/json',
                        'Content-Type': 'application/json',
                        ...options.headers,
                    },
                    body: options.body,
                });

                if (!response.ok) {
                    const text = await response.text();
                    throw new Error(`HTTP ${response.status}: ${text}`);
                }

                const json = await response.json();
                return json.data || json;
            } catch (error) {
                console.error(`  ⚠️ Attempt ${i + 1} failed: ${(error as Error).message}`);
                if (i === retries - 1) throw error;
                await new Promise(r => setTimeout(r, 2000));
            }
        }
        throw new Error('Max retries reached');
    }

    async importCountries(): Promise<unknown[]> {
        console.log('🌐 Fetching countries...');
        const countries = await this.fetchWithRetry(`${BASE_URL}/countries`) as Array<{ code: string; name: string }>;
        console.log(`✅ Fetched ${countries.length} countries.`);

        const client = await pool.connect();
        try {
            for (const country of countries) {
                await client.query(
                    `INSERT INTO shared.countries (code, name, updated_at)
           VALUES ($1, $2, NOW())
           ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
                    [country.code, country.name]
                );
            }
            console.log(`✅ Imported ${countries.length} countries to shared.countries.`);
            return countries;
        } finally {
            client.release();
        }
    }

    async importCities(countries: Array<{ code: string }>): Promise<void> {
        console.log('🏙️ Importing cities for all countries...');
        let totalImported = 0;
        const client = await pool.connect();

        try {
            for (const country of countries) {
                process.stdout.write(`  Processing ${country.code}... `);
                try {
                    const cities = await this.fetchWithRetry(`${BASE_URL}/cities?countryCode=${country.code}`) as Array<{ city?: string }>;
                    if (Array.isArray(cities)) {
                        for (const city of cities) {
                            if (!city.city) continue;
                            await client.query(
                                `INSERT INTO hotel.cities (country_code, city_name)
                 VALUES ($1, $2)
                 ON CONFLICT (country_code, city_name) DO NOTHING`,
                                [country.code, city.city]
                            );
                            totalImported++;
                        }
                        process.stdout.write(`Done (${cities.length} cities)\n`);
                    } else {
                        process.stdout.write(`No data\n`);
                    }
                } catch (e) {
                    process.stdout.write(`Error: ${(e as Error).message}\n`);
                }
            }
            console.log(`✅ Total cities processed/imported: ${totalImported}`);
        } finally {
            client.release();
        }
    }

    async importHotelTypes(): Promise<void> {
        console.log('🏨 Fetching hotel types...');
        try {
            const types = await this.fetchWithRetry(`${BASE_URL}/hotelTypes`) as Array<{ id: string; name: string }>;
            const client = await pool.connect();
            try {
                for (const type of types) {
                    await client.query(
                        `INSERT INTO hotel.types (id, name, updated_at)
             VALUES ($1, $2, NOW())
             ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW()`,
                        [parseInt(type.id), type.name]
                    );
                }
                console.log(`✅ Imported ${types.length} hotel types.`);
            } finally {
                client.release();
            }
        } catch (e) {
            console.error(`❌ Failed to import hotel types: ${(e as Error).message}`);
        }
    }

    async importIATACodes(): Promise<void> {
        console.log('✈️ Fetching IATA codes...');
        try {
            const codes = await this.fetchWithRetry(`${BASE_URL}/iataCodes`) as Array<{ code: string; name: string; latitude?: number; longitude?: number; countryCode?: string }>;
            const client = await pool.connect();
            try {
                for (const code of codes) {
                    await client.query(
                        `INSERT INTO hotel.iata_airports (code, name, latitude, longitude, country_code)
             VALUES ($1, $2, $3, $4, $5)
             ON CONFLICT (code) DO UPDATE SET
                name = EXCLUDED.name,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                country_code = EXCLUDED.country_code`,
                        [code.code, code.name, code.latitude, code.longitude, code.countryCode]
                    );
                }
                console.log(`✅ Imported ${codes.length} IATA codes.`);
            } finally {
                client.release();
            }
        } catch (e) {
            console.error(`❌ Failed to import IATA codes: ${(e as Error).message}`);
        }
    }

    async run(): Promise<void> {
        console.log('🚀 Starting Unified Static Data Import to staticdatabase...');
        try {
            const countries = await this.importCountries() as Array<{ code: string }>;
            await this.importHotelTypes();
            await this.importIATACodes();
            // Import cities last as it's the most time consuming
            await this.importCities(countries);

            console.log('\n✨ All tasks completed successfully!');
        } catch (error) {
            console.error('💥 Critical failure:', (error as Error).message);
        } finally {
            await pool.end();
        }
    }
}

const importer = new UnifiedImporter();
importer.run().catch(console.error);
