import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const OPENEXCHANGE_API_KEY = '328ae500da7f485cad0ba5b48d33265a';
const STATIC_DATABASE_URL =
  process.env.STATIC_DATABASE_URL ||
  'postgres://postgres:postgres@localhost:5432/staticdatabase';

const pool = new Pool({
  connectionString: STATIC_DATABASE_URL
});

const BASE_CURRENCY = 'USD';
const SOURCE = 'openexchangerates';

type ExchangeRatesResponse = {
  rates?: Record<string, number>;
  timestamp?: number;
};

async function fetchAndSaveRates(): Promise<void> {
  console.log(`[${new Date().toISOString()}] Starting FX fetch job...`);

  try {
    const url = `https://openexchangerates.org/api/latest.json?app_id=${OPENEXCHANGE_API_KEY}&base=${BASE_CURRENCY}`;
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = (await response.json()) as ExchangeRatesResponse;

    if (!data || !data.rates) {
      throw new Error('Invalid response from OpenExchangeRates: missing rates');
    }
    if (!data.timestamp) {
      throw new Error('Invalid response from OpenExchangeRates: missing timestamp');
    }

    const fetchedAt = new Date(data.timestamp * 1000);
    const rates = data.rates;
    const rateCount = Object.keys(rates).length;

    await pool.query(
      `
            INSERT INTO exchange_rate_snapshots (source, base_currency, rates, fetched_at, status)
            VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT DO NOTHING
        `,
      [SOURCE, BASE_CURRENCY, JSON.stringify(rates), fetchedAt]
    );

    console.log(
      `[${new Date().toISOString()}] Successfully fetched and saved ${rateCount} exchange rates.`
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error(`[${new Date().toISOString()}] FX fetch failed:`, message);
    process.exit(1);
  }
}

fetchAndSaveRates()
  .then(() => {
    pool.end();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
