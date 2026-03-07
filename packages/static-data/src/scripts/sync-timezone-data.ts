import axios from "axios";
import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

const TIMEZONEDB_API_KEY = "X0SV76DQEO00";
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

async function syncTimezones() {
    const poolConfig: PoolConfig = {
        connectionString: STATIC_DATABASE_URL,
    };

    if (process.env.NODE_ENV === 'production') {
        (poolConfig as any).max = 10;
        (poolConfig as any).idleTimeoutMillis = 30000;
        (poolConfig as any).connectionTimeoutMillis = 10000;
    } else {
        (poolConfig as any).max = 5;
        (poolConfig as any).idleTimeoutMillis = 30000;
        (poolConfig as any).connectionTimeoutMillis = 10000;
    }

    const pool = new Pool(poolConfig);

    try {
        console.log("Fetching cities without timezones from database...");
        const client = await pool.connect();

        // Ensure timezone column exists (it might be missing in some schemas)
        await client.query(`
            ALTER TABLE liteapi_cities ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
            ALTER TABLE liteapi_cities ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
            ALTER TABLE liteapi_hotels ADD COLUMN IF NOT EXISTS timezone VARCHAR(50);
            ALTER TABLE liteapi_hotels ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT NOW();
        `);

        // Fetch cities that have coordinates but no timezone
        const citiesResult = await client.query(
            `SELECT id, name, latitude, longitude 
       FROM liteapi_cities 
       WHERE timezone IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL`
        );

        const cities = citiesResult.rows;
        console.log(`Found ${cities.length} cities to sync.`);

        for (let i = 0; i < cities.length; i++) {
            const city = cities[i];
            console.log(`[${i + 1}/${cities.length}] Fetching timezone for ${city.name} (${city.latitude}, ${city.longitude})...`);

            try {
                const response = await axios.get(`https://api.timezonedb.com/v2.1/get-time-zone`, {
                    params: {
                        key: TIMEZONEDB_API_KEY,
                        format: "json",
                        by: "position",
                        lat: city.latitude,
                        lng: city.longitude
                    }
                });

                if (response.data && response.data.zoneName) {
                    const timezone = response.data.zoneName;
                    await client.query(
                        "UPDATE liteapi_cities SET timezone = $1, updated_at = NOW() WHERE id = $2",
                        [timezone, city.id]
                    );

                    // Also update hotels in this city for faster lookups
                    await client.query(
                        "UPDATE liteapi_hotels SET timezone = $1, updated_at = NOW() WHERE city = $2",
                        [timezone, city.name]
                    );

                    console.log(`Updated ${city.name} to ${timezone}`);
                } else {
                    console.warn(`Could not find timezone for ${city.name}: ${response.data.message || "Unknown error"}`);
                }
            } catch (err: any) {
                if (err.response && err.response.status === 429) {
                    console.warn(`Rate limit hit (429), pausing for 10 seconds...`);
                    await new Promise(resolve => setTimeout(resolve, 10000));
                    i--; // Retry this city
                    continue;
                }
                console.error(`Error fetching timezone for ${city.name}:`, err.message);
            }

            // TimezoneDB Free API rate limit: 1 request per second
            // Using 1.5s to be safe
            await new Promise(resolve => setTimeout(resolve, 1500));
        }

        client.release();
        console.log("Timezone sync completed.");
    } catch (error: any) {
        console.error("Timezone sync failed:", error.message);
    } finally {
        await pool.end();
    }
}

syncTimezones();
