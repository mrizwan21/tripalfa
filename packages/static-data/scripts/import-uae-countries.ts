/**
 * UAE Countries Import Script
 *
 * This script imports country data from LITEAPI and stores it in PostgreSQL database.
 */

import { Pool } from 'pg';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || 'prod_1ca7e299-f889-4462-8e32-ce421ab66a93';
const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';
const DB_NAME =
  process.env.STATIC_DATABASE_URL || 'postgresql://postgres@localhost:5432/staticdatabase';

// Statistics tracking
const stats = {
  totalCountries: 0,
  processedCountries: 0,
  insertedCountries: 0,
  errors: 0,
  startTime: Date.now(),
};

/**
 * Initialize database connection
 */
async function initDatabase() {
  console.log('🔧 Initializing database connection...');

  const pool = new Pool({
    connectionString: DB_NAME,
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 10000,
  });

  try {
    const client = await pool.connect();
    console.log('✅ Database connection established');
    client.release();
    return pool;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    throw error;
  }
}

/**
 * Create countries table if it doesn't exist
 */
async function createCountriesTable(pool) {
  console.log('🏗️  Creating countries table...');

  const schemaSQL = `
        -- Create countries table
        CREATE TABLE IF NOT EXISTS hotel.countries (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            alpha2_code VARCHAR(2) UNIQUE,
            alpha3_code VARCHAR(3) UNIQUE,
            numeric_code INTEGER UNIQUE,
            demonym VARCHAR,
            currency_code VARCHAR(3),
            currency_name VARCHAR,
            currency_symbol VARCHAR,
            phone_prefix VARCHAR,
            continent VARCHAR,
            capital VARCHAR,
            population INTEGER,
            area_km2 DECIMAL(15,2),
            timezones TEXT[],
            languages TEXT[],
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_countries_alpha2 ON hotel.countries(alpha2_code);
        CREATE INDEX IF NOT EXISTS idx_countries_alpha3 ON hotel.countries(alpha3_code);
        CREATE INDEX IF NOT EXISTS idx_countries_numeric ON hotel.countries(numeric_code);
    `;

  try {
    const client = await pool.connect();
    await client.query(schemaSQL);
    client.release();
    console.log('✅ Countries table created/updated');
  } catch (error) {
    console.error('❌ Countries table creation failed:', error.message);
    throw error;
  }
}

/**
 * Fetch countries from LITEAPI
 */
async function fetchCountriesFromAPI() {
  console.log('🌐 Fetching countries from LITEAPI...');

  const headers = {
    'X-API-Key': LITEAPI_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${LITEAPI_BASE_URL}/data/countries`, {
      headers,
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const countries = data.data || data;

    if (!Array.isArray(countries)) {
      throw new Error('Invalid response format from API');
    }

    console.log(`🎉 Successfully fetched ${countries.length} countries from API`);
    return countries;
  } catch (error) {
    console.error('❌ Error fetching countries from API:', error.message);
    throw error;
  }
}

/**
 * Validate country data
 */
function validateCountryData(country) {
  const errors = [];

  if (!country.id) errors.push('Missing country ID');
  if (!country.name) errors.push('Missing country name');

  // Validate codes
  if (country.alpha2Code && country.alpha2Code.length !== 2) {
    errors.push('Invalid alpha2 code length');
  }

  if (country.alpha3Code && country.alpha3Code.length !== 3) {
    errors.push('Invalid alpha3 code length');
  }

  if (
    country.numericCode &&
    (isNaN(country.numericCode) || country.numericCode < 1 || country.numericCode > 999)
  ) {
    errors.push('Invalid numeric code');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Process and insert countries
 */
async function processCountries(pool, countries) {
  console.log(`🚀 Starting to process ${countries.length} countries...`);

  stats.totalCountries = countries.length;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const country of countries) {
      await processSingleCountry(client, country);
    }

    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

/**
 * Process a single country
 */
async function processSingleCountry(client, country) {
  // Validate data
  const validation = validateCountryData(country);
  if (!validation.isValid) {
    console.warn(`⚠️  Skipping invalid country ${country.id}: ${validation.errors.join(', ')}`);
    stats.errors++;
    return;
  }

  try {
    // Prepare country data
    const countryData = {
      id: country.id,
      name: country.name,
      alpha2_code: country.alpha2Code || country.code || null,
      alpha3_code: country.alpha3Code || null,
      numeric_code: country.numericCode || null,
      demonym: country.demonym || null,
      currency_code: country.currencyCode || null,
      currency_name: country.currencyName || null,
      currency_symbol: country.currencySymbol || null,
      phone_prefix: country.phonePrefix || null,
      continent: country.continent || null,
      capital: country.capital || null,
      population: country.population || null,
      area_km2: country.area || null,
      timezones: country.timezones || null,
      languages: country.languages || null,
    };

    // Insert or update country
    const countryQuery = `
            INSERT INTO hotel.countries (
                id, name, alpha2_code, alpha3_code, numeric_code, demonym,
                currency_code, currency_name, currency_symbol, phone_prefix,
                continent, capital, population, area_km2, timezones, languages, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                alpha2_code = EXCLUDED.alpha2_code,
                alpha3_code = EXCLUDED.alpha3_code,
                numeric_code = EXCLUDED.numeric_code,
                demonym = EXCLUDED.demonym,
                currency_code = EXCLUDED.currency_code,
                currency_name = EXCLUDED.currency_name,
                currency_symbol = EXCLUDED.currency_symbol,
                phone_prefix = EXCLUDED.phone_prefix,
                continent = EXCLUDED.continent,
                capital = EXCLUDED.capital,
                population = EXCLUDED.population,
                area_km2 = EXCLUDED.area_km2,
                timezones = EXCLUDED.timezones,
                languages = EXCLUDED.languages,
                updated_at = NOW()
        `;

    await client.query(countryQuery, Object.values(countryData));
    stats.insertedCountries++;
  } catch (error) {
    console.error(`❌ Error processing country ${country.id}:`, error.message);
    stats.errors++;
    throw error;
  }
}

/**
 * Save data to JSON file for backup
 */
async function saveDataToFile(countries) {
  console.log('💾 Saving countries data to JSON file...');

  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'uae-countries.json');
  await fs.writeFile(filePath, JSON.stringify(countries, null, 2));

  console.log(`✅ Countries data saved to ${filePath}`);
}

/**
 * Generate final report
 */
function generateReport() {
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const avgSpeed = stats.processedCountries / Math.max(elapsed, 1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 COUNTRIES IMPORT COMPLETION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Countries Processed: ${stats.processedCountries}`);
  console.log(`Countries Inserted/Updated: ${stats.insertedCountries}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(
    `Success Rate: ${(((stats.processedCountries - stats.errors) / stats.processedCountries) * 100).toFixed(1)}%`
  );
  console.log(`Processing Speed: ${avgSpeed.toFixed(1)} countries/second`);
  console.log(`Total Time: ${elapsed} seconds`);
  console.log('='.repeat(60));

  if (stats.errors === 0) {
    console.log('🎉 Countries import completed successfully with no errors!');
  } else {
    console.log(
      `⚠️  Countries import completed with ${stats.errors} errors. Check logs above for details.`
    );
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting UAE Countries Import Process');
  console.log('='.repeat(60));

  let pool;

  try {
    // Initialize database
    pool = await initDatabase();

    // Create countries table
    await createCountriesTable(pool);

    // Fetch data from API
    const countries = await fetchCountriesFromAPI();

    if (countries.length === 0) {
      console.log('❌ No countries found in API response');
      return;
    }

    // Save raw data to file
    await saveDataToFile(countries);

    // Process countries
    await processCountries(pool, countries);

    // Generate report
    generateReport();
  } catch (error) {
    console.error('❌ Countries import process failed:', error);
    process.exit(1);
  } finally {
    if (pool) {
      await pool.end();
      console.log('🔌 Database connection closed');
    }
  }
}

// Run the import process
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export { main as importUAECountries };
