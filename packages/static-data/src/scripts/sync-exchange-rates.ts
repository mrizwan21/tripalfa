import axios from "axios";
import { Pool, PoolConfig } from "pg";
import dotenv from "dotenv";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

// Get the directory of the current script file
const __filename = fileURLToPath(new URL(import.meta.url).href);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, "../../../../.env") });

const OXR_APP_ID = "657df7ddc8e74c46b931bf257890f8c8";
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || "postgresql://postgres@localhost:5432/staticdatabase";

// ISO 4217 Decimal Precision Mapping
// Source: https://en.wikipedia.org/wiki/ISO_4217
const CURRENCY_PRECISION: Record<string, number> = {
    BIF: 0, CLP: 0, DJF: 0, GNF: 0, ISK: 0, JPY: 0, KMF: 0, KRW: 0, PYG: 0,
    RWF: 0, UGX: 0, VND: 0, VUV: 0, XAF: 0, XOF: 0, XPF: 0,
    BHD: 3, IQD: 3, JOD: 3, KWD: 3, LYD: 3, OMR: 3, TND: 3,
    CLF: 4,
};

async function syncExchangeRates() {
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
        const client = await pool.connect();
        try {
            console.log("🏗️ Initializing liteapi_currencies table...");
            await client.query(`
                CREATE TABLE IF NOT EXISTS liteapi_currencies (
                    code VARCHAR(10) PRIMARY KEY,
                    name VARCHAR(100),
                    rate_vs_usd DECIMAL(20, 10),
                    precision INTEGER DEFAULT 2,
                    updated_at TIMESTAMP DEFAULT NOW(),
                    metadata JSONB
                );
            `);

            console.log("Fetching latest exchange rates from Open Exchange Rates...");
            const response = await axios.get(`https://openexchangerates.org/api/latest.json?app_id=${OXR_APP_ID}`);

            if (!response.data || !response.data.rates) {
                throw new Error("Invalid response from OXR API");
            }

            const rates = response.data.rates;
            const timestamp = new Date(response.data.timestamp * 1000);

            console.log(`Received rates for ${Object.keys(rates).length} currencies (as of ${timestamp.toISOString()})`);

            await client.query("BEGIN");

            let updatedCount = 0;
            let insertedCount = 0;

            for (const [code, rate] of Object.entries(rates)) {
                const precision = CURRENCY_PRECISION[code] ?? 2;

                const result = await client.query(
                    `INSERT INTO liteapi_currencies (code, name, rate_vs_usd, precision, updated_at, metadata)
                     VALUES ($1, $1, $2, $3, $4, jsonb_build_object('oxr_timestamp', $5::bigint))
                     ON CONFLICT (code) DO UPDATE 
                     SET rate_vs_usd = EXCLUDED.rate_vs_usd, 
                         precision = EXCLUDED.precision, 
                         updated_at = EXCLUDED.updated_at,
                         metadata = COALESCE(liteapi_currencies.metadata, '{}'::jsonb) || EXCLUDED.metadata
                     RETURNING (xmax = 0) as inserted`,
                    [code, rate, precision, new Date(), response.data.timestamp]
                );

                if (result.rows[0].inserted) {
                    insertedCount++;
                } else {
                    updatedCount++;
                }
            }

            await client.query("COMMIT");
            console.log(`Successfully synced exchange rates: ${updatedCount} updated, ${insertedCount} inserted.`);
        } catch (err) {
            await client.query("ROLLBACK");
            throw err;
        } finally {
            client.release();
        }
    } catch (error: any) {
        console.error("Error syncing exchange rates:", error.message);
    } finally {
        await pool.end();
    }
}

syncExchangeRates();
