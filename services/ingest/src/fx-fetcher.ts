
import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load .env from project root
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const OPENEXCHANGE_API_KEY = '328ae500da7f485cad0ba5b48d33265a';
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';
const BASE_CURRENCY = 'USD';
const SOURCE = 'openexchangerates';

const pool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});

interface OpenExchangeRatesResponse {
    disclaimer?: string;
    license?: string;
    timestamp: number;
    base: string;
    rates: Record<string, number>;
}

export async function fetchAndSaveRates(): Promise<void> {
    console.log(`[${new Date().toISOString()}] Starting FX fetch job...`);

    try {
        const url = `https://openexchangerates.org/api/latest.json?app_id=${OPENEXCHANGE_API_KEY}&base=${BASE_CURRENCY}`;

        const response = await axios.get<OpenExchangeRatesResponse>(url);

        if (response.status !== 200) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = response.data;

        if (!data || !data.rates) {
            throw new Error('Invalid response from OpenExchangeRates: missing rates');
        }

        const fetchedAt = new Date(data.timestamp * 1000);
        const rates = data.rates;
        const rateCount = Object.keys(rates).length;

        // Save to database
        await pool.query(`
            INSERT INTO exchange_rate_snapshots (source, base_currency, rates, fetched_at, status)
            VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT DO NOTHING
        `, [SOURCE, BASE_CURRENCY, JSON.stringify(rates), fetchedAt]);

        console.log(`[${new Date().toISOString()}] Successfully fetched and saved ${rateCount} exchange rates.`);
    } catch (error: any) {
        console.error(`[${new Date().toISOString()}] FX fetch failed:`, error.message);
        throw error;
    }
}
