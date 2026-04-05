/**
 * UAE Airports Import Script
 *
 * This script imports airport data from LITEAPI and stores it in PostgreSQL database.
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
  totalAirports: 0,
  processedAirports: 0,
  insertedAirports: 0,
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
 * Create airports table if it doesn't exist
 */
async function createAirportsTable(pool) {
  console.log('🏗️  Creating airports table...');

  const schemaSQL = `
        -- Create airports table
        CREATE TABLE IF NOT EXISTS hotel.airports (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            iata_code VARCHAR(3),
            icao_code VARCHAR(4),
            city VARCHAR,
            country_code VARCHAR(2),
            country_name VARCHAR,
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            timezone VARCHAR,
            utc_offset VARCHAR,
            elevation_ft INTEGER,
            runway_length_ft INTEGER,
            runway_surface VARCHAR,
            type VARCHAR,
            status VARCHAR,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_airports_iata ON hotel.airports(iata_code);
        CREATE INDEX IF NOT EXISTS idx_airports_icao ON hotel.airports(icao_code);
        CREATE INDEX IF NOT EXISTS idx_airports_country_code ON hotel.airports(country_code);
        CREATE INDEX IF NOT EXISTS idx_airports_city ON hotel.airports(city);
    `;

  try {
    const client = await pool.connect();
    await client.query(schemaSQL);
    client.release();
    console.log('✅ Airports table created/updated');
  } catch (error) {
    console.error('❌ Airports table creation failed:', error.message);
    throw error;
  }
}

/**
 * Fetch airports from LITEAPI
 */
async function fetchAirportsFromAPI() {
  console.log('🌐 Fetching airports from LITEAPI...');

  const headers = {
    'X-API-Key': LITEAPI_API_KEY,
    'Content-Type': 'application/json',
  };

  try {
    const response = await fetch(`${LITEAPI_BASE_URL}/data/airports?countryCode=AE`, {
      headers,
      timeout: 30000,
    });

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();
    const airports = data.data || data;

    if (!Array.isArray(airports)) {
      throw new Error('Invalid response format from API');
    }

    console.log(`🎉 Successfully fetched ${airports.length} UAE airports from API`);
    return airports;
  } catch (error) {
    console.error('❌ Error fetching airports from API:', error.message);
    throw error;
  }
}

/**
 * Validate airport data
 */
function validateAirportData(airport) {
  const errors = [];

  if (!airport.id) errors.push('Missing airport ID');
  if (!airport.name) errors.push('Missing airport name');
  if (!airport.countryCode || airport.countryCode !== 'AE') errors.push('Invalid country code');

  // Validate codes
  if (airport.iataCode && airport.iataCode.length !== 3) {
    errors.push('Invalid IATA code length');
  }

  if (airport.icaoCode && airport.icaoCode.length !== 4) {
    errors.push('Invalid ICAO code length');
  }

  // Validate numeric fields
  if (
    airport.latitude &&
    (isNaN(airport.latitude) || airport.latitude < -90 || airport.latitude > 90)
  ) {
    errors.push('Invalid latitude');
  }

  if (
    airport.longitude &&
    (isNaN(airport.longitude) || airport.longitude < -180 || airport.longitude > 180)
  ) {
    errors.push('Invalid longitude');
  }

  if (airport.elevationFt && isNaN(airport.elevationFt)) {
    errors.push('Invalid elevation');
  }

  if (airport.runwayLengthFt && isNaN(airport.runwayLengthFt)) {
    errors.push('Invalid runway length');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Process and insert airports
 */
async function processAirports(pool, airports) {
  console.log(`🚀 Starting to process ${airports.length} airports...`);

  stats.totalAirports = airports.length;
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const airport of airports) {
      await processSingleAirport(client, airport);
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
 * Process a single airport
 */
async function processSingleAirport(client, airport) {
  // Validate data
  const validation = validateAirportData(airport);
  if (!validation.isValid) {
    console.warn(`⚠️  Skipping invalid airport ${airport.id}: ${validation.errors.join(', ')}`);
    stats.errors++;
    return;
  }

  try {
    // Prepare airport data
    const airportData = {
      id: airport.id,
      name: airport.name,
      iata_code: airport.iataCode || null,
      icao_code: airport.icaoCode || null,
      city: airport.city || airport.municipality || null,
      country_code: 'AE',
      country_name: airport.country || 'United Arab Emirates',
      latitude: airport.latitude || null,
      longitude: airport.longitude || null,
      timezone: airport.timezone || null,
      utc_offset: airport.utcOffset || null,
      elevation_ft: airport.elevationFt || null,
      runway_length_ft: airport.runwayLengthFt || null,
      runway_surface: airport.runwaySurface || null,
      type: airport.type || null,
      status: airport.status || null,
    };

    // Insert or update airport
    const airportQuery = `
            INSERT INTO hotel.airports (
                id, name, iata_code, icao_code, city, country_code, country_name,
                latitude, longitude, timezone, utc_offset, elevation_ft,
                runway_length_ft, runway_surface, type, status, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                iata_code = EXCLUDED.iata_code,
                icao_code = EXCLUDED.icao_code,
                city = EXCLUDED.city,
                country_name = EXCLUDED.country_name,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                timezone = EXCLUDED.timezone,
                utc_offset = EXCLUDED.utc_offset,
                elevation_ft = EXCLUDED.elevation_ft,
                runway_length_ft = EXCLUDED.runway_length_ft,
                runway_surface = EXCLUDED.runway_surface,
                type = EXCLUDED.type,
                status = EXCLUDED.status,
                updated_at = NOW()
        `;

    await client.query(airportQuery, Object.values(airportData));
    stats.insertedAirports++;
  } catch (error) {
    console.error(`❌ Error processing airport ${airport.id}:`, error.message);
    stats.errors++;
    throw error;
  }
}

/**
 * Save data to JSON file for backup
 */
async function saveDataToFile(airports) {
  console.log('💾 Saving airports data to JSON file...');

  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'uae-airports.json');
  await fs.writeFile(filePath, JSON.stringify(airports, null, 2));

  console.log(`✅ Airports data saved to ${filePath}`);
}

/**
 * Generate final report
 */
function generateReport() {
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const avgSpeed = stats.processedAirports / Math.max(elapsed, 1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 AIRPORTS IMPORT COMPLETION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Airports Processed: ${stats.processedAirports}`);
  console.log(`Airports Inserted/Updated: ${stats.insertedAirports}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(
    `Success Rate: ${(((stats.processedAirports - stats.errors) / stats.processedAirports) * 100).toFixed(1)}%`
  );
  console.log(`Processing Speed: ${avgSpeed.toFixed(1)} airports/second`);
  console.log(`Total Time: ${elapsed} seconds`);
  console.log('='.repeat(60));

  if (stats.errors === 0) {
    console.log('🎉 Airports import completed successfully with no errors!');
  } else {
    console.log(
      `⚠️  Airports import completed with ${stats.errors} errors. Check logs above for details.`
    );
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting UAE Airports Import Process');
  console.log('='.repeat(60));

  let pool;

  try {
    // Initialize database
    pool = await initDatabase();

    // Create airports table
    await createAirportsTable(pool);

    // Fetch data from API
    const airports = await fetchAirportsFromAPI();

    if (airports.length === 0) {
      console.log('❌ No UAE airports found in API response');
      return;
    }

    // Save raw data to file
    await saveDataToFile(airports);

    // Process airports
    await processAirports(pool, airports);

    // Generate report
    generateReport();
  } catch (error) {
    console.error('❌ Airports import process failed:', error);
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

export { main as importUAEAirports };
