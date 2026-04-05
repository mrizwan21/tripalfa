/**
 * UAE Cities Import Script
 *
 * This script imports city data from LITEAPI and stores it in PostgreSQL database.
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
  totalCities: 0,
  processedCities: 0,
  insertedCities: 0,
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
 * Create cities table if it doesn't exist
 */
async function createCitiesTable(pool) {
  console.log('🏗️  Creating cities table...');

  const schemaSQL = `
        -- Create cities table
        CREATE TABLE IF NOT EXISTS hotel.cities (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            country_code VARCHAR(2),
            country_name VARCHAR,
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            timezone VARCHAR,
            population INTEGER,
            is_capital BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_cities_country_code ON hotel.cities(country_code);
        CREATE INDEX IF NOT EXISTS idx_cities_name ON hotel.cities(name);
    `;

  try {
    const client = await pool.connect();
    await client.query(schemaSQL);
    client.release();
    console.log('✅ Cities table created/updated');
  } catch (error) {
    console.error('❌ Cities table creation failed:', error.message);
    throw error;
  }
}

/**
 * Fetch cities from LITEAPI
 */
async function fetchCitiesFromAPI() {
  console.log('🌐 Fetching cities from LITEAPI...');

  const headers = {
    'X-API-Key': LITEAPI_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${LITEAPI_BASE_URL}/data/cities?countryCode=AE`, {
      headers,
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const cities = data.data || data;

    if (!Array.isArray(cities)) {
      throw new Error('Invalid response format from API');
    }

    console.log(`🎉 Successfully fetched ${cities.length} UAE cities from API`);
    return cities;
  } catch (error) {
    console.error('❌ Error fetching cities from API:', error.message);
    throw error;
  }
}

/**
 * Validate city data
 */
function validateCityData(city) {
  const errors = [];

  if (!city.id) errors.push('Missing city ID');
  if (!city.name) errors.push('Missing city name');
  if (!city.countryCode || city.countryCode !== 'AE') errors.push('Invalid country code');

  // Validate numeric fields
  if (city.latitude && (isNaN(city.latitude) || city.latitude < -90 || city.latitude > 90)) {
    errors.push('Invalid latitude');
  }

  if (city.longitude && (isNaN(city.longitude) || city.longitude < -180 || city.longitude > 180)) {
    errors.push('Invalid longitude');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Process and insert cities
 */
async function processCities(pool, cities) {
  console.log(`🚀 Starting to process ${cities.length} cities...`);

  stats.totalCities = cities.length;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const city of cities) {
      await processSingleCity(client, city);
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
 * Process a single city
 */
async function processSingleCity(client, city) {
  // Validate data
  const validation = validateCityData(city);
  if (!validation.isValid) {
    console.warn(`⚠️  Skipping invalid city ${city.id}: ${validation.errors.join(', ')}`);
    stats.errors++;
    return;
  }

  try {
    // Prepare city data
    const cityData = {
      id: city.id,
      name: city.name,
      country_code: 'AE',
      country_name: city.country || 'United Arab Emirates',
      latitude: city.latitude || null,
      longitude: city.longitude || null,
      timezone: city.timezone || null,
      population: city.population || null,
      is_capital: city.is_capital || city.capital || false,
    };

    // Insert or update city
    const cityQuery = `
            INSERT INTO hotel.cities (
                id, name, country_code, country_name, latitude, longitude,
                timezone, population, is_capital, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                country_name = EXCLUDED.country_name,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                timezone = EXCLUDED.timezone,
                population = EXCLUDED.population,
                is_capital = EXCLUDED.is_capital,
                updated_at = NOW()
        `;

    await client.query(cityQuery, Object.values(cityData));
    stats.insertedCities++;
  } catch (error) {
    console.error(`❌ Error processing city ${city.id}:`, error.message);
    stats.errors++;
    throw error;
  }
}

/**
 * Save data to JSON file for backup
 */
async function saveDataToFile(cities) {
  console.log('💾 Saving cities data to JSON file...');

  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'uae-cities.json');
  await fs.writeFile(filePath, JSON.stringify(cities, null, 2));

  console.log(`✅ Cities data saved to ${filePath}`);
}

/**
 * Generate final report
 */
function generateReport() {
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const avgSpeed = stats.processedCities / Math.max(elapsed, 1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 CITIES IMPORT COMPLETION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Cities Processed: ${stats.processedCities}`);
  console.log(`Cities Inserted/Updated: ${stats.insertedCities}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(
    `Success Rate: ${(((stats.processedCities - stats.errors) / stats.processedCities) * 100).toFixed(1)}%`
  );
  console.log(`Processing Speed: ${avgSpeed.toFixed(1)} cities/second`);
  console.log(`Total Time: ${elapsed} seconds`);
  console.log('='.repeat(60));

  if (stats.errors === 0) {
    console.log('🎉 Cities import completed successfully with no errors!');
  } else {
    console.log(
      `⚠️  Cities import completed with ${stats.errors} errors. Check logs above for details.`
    );
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting UAE Cities Import Process');
  console.log('='.repeat(60));

  let pool;

  try {
    // Initialize database
    pool = await initDatabase();

    // Create cities table
    await createCitiesTable(pool);

    // Fetch data from API
    const cities = await fetchCitiesFromAPI();

    if (cities.length === 0) {
      console.log('❌ No UAE cities found in API response');
      return;
    }

    // Save raw data to file
    await saveDataToFile(cities);

    // Process cities
    await processCities(pool, cities);

    // Generate report
    generateReport();
  } catch (error) {
    console.error('❌ Cities import process failed:', error);
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

export { main as importUAECities };
