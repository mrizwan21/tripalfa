/**
 * UAE Hotels Import Script
 *
 * This script imports hotel data from LITEAPI and stores it in PostgreSQL database.
 * It handles the complete import process including data validation, error handling,
 * and progress tracking.
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

// Configuration
const CONFIG = {
  batchSize: 100,
  retryAttempts: 3,
  retryDelay: 1000,
  logProgressEvery: 100,
};

// Statistics tracking
const stats = {
  totalHotels: 0,
  processedHotels: 0,
  insertedHotels: 0,
  updatedHotels: 0,
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
 * Create database schema if it doesn't exist
 */
async function createSchema(pool) {
  console.log('🏗️  Creating database schema...');

  const schemaSQL = `
        -- Create hotel schema if it doesn't exist
        CREATE SCHEMA IF NOT EXISTS hotel;

        -- Create hotels table
        CREATE TABLE IF NOT EXISTS hotel.hotels (
            id VARCHAR PRIMARY KEY,
            name VARCHAR NOT NULL,
            city VARCHAR,
            country VARCHAR,
            country_code VARCHAR(2),
            latitude DECIMAL(10,8),
            longitude DECIMAL(11,8),
            stars INTEGER,
            rating DECIMAL(3,2),
            address TEXT,
            description TEXT,
            check_in_time VARCHAR,
            check_out_time VARCHAR,
            amenities_count INTEGER DEFAULT 0,
            images_count INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
        );

        -- Create indexes for performance
        CREATE INDEX IF NOT EXISTS idx_hotels_country_code ON hotel.hotels(country_code);
        CREATE INDEX IF NOT EXISTS idx_hotels_city ON hotel.hotels(city);
        CREATE INDEX IF NOT EXISTS idx_hotels_rating ON hotel.hotels(rating);
        CREATE INDEX IF NOT EXISTS idx_hotels_stars ON hotel.hotels(stars);

        -- Create hotel images table
        CREATE TABLE IF NOT EXISTS hotel.hotel_images (
            id SERIAL PRIMARY KEY,
            hotel_id VARCHAR REFERENCES hotel.hotels(id) ON DELETE CASCADE,
            image_url TEXT NOT NULL,
            is_primary BOOLEAN DEFAULT FALSE,
            image_type VARCHAR(50),
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create hotel amenities table
        CREATE TABLE IF NOT EXISTS hotel.hotel_amenities (
            id SERIAL PRIMARY KEY,
            name VARCHAR NOT NULL,
            category VARCHAR,
            is_popular BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(name, category)
        );

        -- Create hotel amenity mapping table
        CREATE TABLE IF NOT EXISTS hotel.hotel_amenity_mapping (
            id SERIAL PRIMARY KEY,
            hotel_id VARCHAR REFERENCES hotel.hotels(id) ON DELETE CASCADE,
            amenity_id INTEGER REFERENCES hotel.hotel_amenities(id) ON DELETE CASCADE,
            created_at TIMESTAMP DEFAULT NOW(),
            UNIQUE(hotel_id, amenity_id)
        );

        -- Create hotel descriptions table
        CREATE TABLE IF NOT EXISTS hotel.hotel_descriptions (
            id SERIAL PRIMARY KEY,
            hotel_id VARCHAR REFERENCES hotel.hotels(id) ON DELETE CASCADE,
            description_type VARCHAR(50),
            description_text TEXT,
            language_code VARCHAR(5) DEFAULT 'en',
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create hotel contacts table
        CREATE TABLE IF NOT EXISTS hotel.hotel_contacts (
            id SERIAL PRIMARY KEY,
            hotel_id VARCHAR REFERENCES hotel.hotels(id) ON DELETE CASCADE,
            contact_type VARCHAR(50),
            contact_value TEXT,
            created_at TIMESTAMP DEFAULT NOW()
        );

        -- Create hotel reviews table (placeholder data)
        CREATE TABLE IF NOT EXISTS hotel.hotel_reviews (
            id SERIAL PRIMARY KEY,
            hotel_id VARCHAR REFERENCES hotel.hotels(id) ON DELETE CASCADE,
            review_text TEXT,
            rating DECIMAL(2,1),
            reviewer_name VARCHAR,
            review_date TIMESTAMP DEFAULT NOW()
        );

        -- Create hotel rooms table (static structure)
        CREATE TABLE IF NOT EXISTS hotel.hotel_rooms (
            id SERIAL PRIMARY KEY,
            hotel_id VARCHAR REFERENCES hotel.hotels(id) ON DELETE CASCADE,
            room_type VARCHAR,
            room_name VARCHAR,
            max_occupancy INTEGER,
            bed_type VARCHAR,
            created_at TIMESTAMP DEFAULT NOW()
        );
    `;

  try {
    const client = await pool.connect();
    await client.query(schemaSQL);
    client.release();
    console.log('✅ Database schema created/updated');
  } catch (error) {
    console.error('❌ Schema creation failed:', error.message);
    throw error;
  }
}

/**
 * Fetch hotels from LITEAPI with pagination
 */
async function fetchHotelsFromAPI() {
  console.log('🌐 Fetching hotels from LITEAPI...');

  const headers = {
    'X-API-Key': LITEAPI_API_KEY,
    'Content-Type': 'application/json',
  };

  let allHotels = [];
  let page = 1;
  let hasMore = true;

  while (hasMore) {
    try {
      console.log(`📄 Fetching page ${page}...`);

      const response = await fetch(`${LITEAPI_BASE_URL}/data/hotels?page=${page}&limit=1000`, {
        headers,
        timeout: 30000,
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      const hotels = data.data || data;

      if (!Array.isArray(hotels) || hotels.length === 0) {
        hasMore = false;
        break;
      }

      // Filter for UAE hotels only
      const uaeHotels = hotels.filter(hotel => hotel.countryCode === 'AE');

      if (uaeHotels.length > 0) {
        allHotels = allHotels.concat(uaeHotels);
        console.log(
          `✅ Page ${page}: Found ${uaeHotels.length} UAE hotels (Total: ${allHotels.length})`
        );
      } else {
        console.log(`ℹ️  Page ${page}: No UAE hotels found`);
      }

      // If we got fewer than 1000 hotels, we've reached the end
      if (hotels.length < 1000) {
        hasMore = false;
      }

      page++;

      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`❌ Error fetching page ${page}:`, error.message);

      // Retry logic
      if (page <= CONFIG.retryAttempts) {
        console.log(`🔄 Retrying page ${page} (attempt ${page})...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.retryDelay * page));
        page++;
        continue;
      }

      throw error;
    }
  }

  console.log(`🎉 Successfully fetched ${allHotels.length} UAE hotels from API`);
  return allHotels;
}

/**
 * Validate hotel data
 */
function validateHotelData(hotel) {
  const errors = [];

  if (!hotel.id) errors.push('Missing hotel ID');
  if (!hotel.name) errors.push('Missing hotel name');
  if (!hotel.countryCode || hotel.countryCode !== 'AE') errors.push('Invalid country code');

  // Validate numeric fields
  if (hotel.stars && (isNaN(hotel.stars) || hotel.stars < 0 || hotel.stars > 5)) {
    errors.push('Invalid star rating');
  }

  if (hotel.rating && (isNaN(hotel.rating) || hotel.rating < 0 || hotel.rating > 10)) {
    errors.push('Invalid rating');
  }

  if (hotel.latitude && (isNaN(hotel.latitude) || hotel.latitude < -90 || hotel.latitude > 90)) {
    errors.push('Invalid latitude');
  }

  if (
    hotel.longitude &&
    (isNaN(hotel.longitude) || hotel.longitude < -180 || hotel.longitude > 180)
  ) {
    errors.push('Invalid longitude');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Process and insert hotels in batches
 */
async function processHotels(pool, hotels) {
  console.log(`🚀 Starting to process ${hotels.length} hotels...`);

  stats.totalHotels = hotels.length;

  for (let i = 0; i < hotels.length; i += CONFIG.batchSize) {
    const batch = hotels.slice(i, i + CONFIG.batchSize);

    try {
      await processBatch(pool, batch, i);

      stats.processedHotels += batch.length;

      // Log progress
      if (
        stats.processedHotels % CONFIG.logProgressEvery === 0 ||
        stats.processedHotels === stats.totalHotels
      ) {
        const progress = ((stats.processedHotels / stats.totalHotels) * 100).toFixed(1);
        const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
        console.log(
          `📊 Progress: ${stats.processedHotels}/${stats.totalHotels} (${progress}%) - ${elapsed}s elapsed`
        );
      }
    } catch (error) {
      console.error(
        `❌ Error processing batch ${Math.floor(i / CONFIG.batchSize) + 1}:`,
        error.message
      );
      stats.errors += batch.length;
    }
  }
}

/**
 * Process a single batch of hotels
 */
async function processBatch(pool, batch, startIndex) {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    for (const hotel of batch) {
      await processSingleHotel(client, hotel);
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
 * Process a single hotel
 */
async function processSingleHotel(client, hotel) {
  // Validate data
  const validation = validateHotelData(hotel);
  if (!validation.isValid) {
    console.warn(`⚠️  Skipping invalid hotel ${hotel.id}: ${validation.errors.join(', ')}`);
    stats.errors++;
    return;
  }

  try {
    // Prepare hotel data
    const hotelData = {
      id: hotel.id,
      name: hotel.name,
      city: hotel.city || hotel.address?.city || null,
      country: hotel.country || 'United Arab Emirates',
      country_code: 'AE',
      latitude: hotel.latitude || null,
      longitude: hotel.longitude || null,
      stars: hotel.stars || null,
      rating: hotel.rating || null,
      address: hotel.address?.address1 || hotel.address || null,
      description: hotel.description || null,
      check_in_time: hotel.checkInTime || null,
      check_out_time: hotel.checkOutTime || null,
      amenities_count: hotel.amenities?.length || 0,
      images_count: hotel.images?.length || 0,
    };

    // Insert or update hotel
    const hotelQuery = `
            INSERT INTO hotel.hotels (
                id, name, city, country, country_code, latitude, longitude,
                stars, rating, address, description, check_in_time, check_out_time,
                amenities_count, images_count, updated_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, NOW())
            ON CONFLICT (id) DO UPDATE SET
                name = EXCLUDED.name,
                city = EXCLUDED.city,
                country = EXCLUDED.country,
                latitude = EXCLUDED.latitude,
                longitude = EXCLUDED.longitude,
                stars = EXCLUDED.stars,
                rating = EXCLUDED.rating,
                address = EXCLUDED.address,
                description = EXCLUDED.description,
                check_in_time = EXCLUDED.check_in_time,
                check_out_time = EXCLUDED.check_out_time,
                amenities_count = EXCLUDED.amenities_count,
                images_count = EXCLUDED.images_count,
                updated_at = NOW()
        `;

    await client.query(hotelQuery, Object.values(hotelData));

    // Process images
    if (hotel.images && hotel.images.length > 0) {
      await processHotelImages(client, hotel.id, hotel.images);
    }

    // Process amenities
    if (hotel.amenities && hotel.amenities.length > 0) {
      await processHotelAmenities(client, hotel.id, hotel.amenities);
    }

    // Process descriptions
    if (hotel.descriptions && hotel.descriptions.length > 0) {
      await processHotelDescriptions(client, hotel.id, hotel.descriptions);
    }

    // Process contacts
    if (hotel.contacts && hotel.contacts.length > 0) {
      await processHotelContacts(client, hotel.id, hotel.contacts);
    }

    stats.insertedHotels++;
  } catch (error) {
    console.error(`❌ Error processing hotel ${hotel.id}:`, error.message);
    stats.errors++;
    throw error;
  }
}

/**
 * Process hotel images
 */
async function processHotelImages(client, hotelId, images) {
  const imageQuery = `
        INSERT INTO hotel.hotel_images (hotel_id, image_url, is_primary, image_type)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
    `;

  for (const image of images) {
    await client.query(imageQuery, [
      hotelId,
      image.url || image.image_url || image,
      image.is_primary || false,
      image.type || 'general',
    ]);
  }
}

/**
 * Process hotel amenities
 */
async function processHotelAmenities(client, hotelId, amenities) {
  // First, ensure amenities exist in the amenities table
  const amenityQuery = `
        INSERT INTO hotel.hotel_amenities (name, category, is_popular)
        VALUES ($1, $2, $3)
        ON CONFLICT (name, category) DO UPDATE SET
            is_popular = EXCLUDED.is_popular
        RETURNING id
    `;

  const mappingQuery = `
        INSERT INTO hotel.hotel_amenity_mapping (hotel_id, amenity_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
    `;

  for (const amenity of amenities) {
    const amenityName = typeof amenity === 'string' ? amenity : amenity.name || amenity.title;
    const amenityCategory = typeof amenity === 'string' ? 'General' : amenity.category || 'General';
    const isPopular = typeof amenity === 'object' ? amenity.is_popular || false : false;

    if (!amenityName) continue;

    try {
      const amenityResult = await client.query(amenityQuery, [
        amenityName,
        amenityCategory,
        isPopular,
      ]);
      const amenityId = amenityResult.rows[0].id;

      await client.query(mappingQuery, [hotelId, amenityId]);
    } catch (error) {
      console.warn(
        `⚠️  Could not process amenity "${amenityName}" for hotel ${hotelId}:`,
        error.message
      );
    }
  }
}

/**
 * Process hotel descriptions
 */
async function processHotelDescriptions(client, hotelId, descriptions) {
  const descQuery = `
        INSERT INTO hotel.hotel_descriptions (hotel_id, description_type, description_text, language_code)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT DO NOTHING
    `;

  for (const desc of descriptions) {
    const descType = desc.type || desc.description_type || 'general';
    const descText = desc.text || desc.description_text || desc;
    const langCode = desc.language || desc.language_code || 'en';

    if (typeof descText === 'string' && descText.trim()) {
      await client.query(descQuery, [hotelId, descType, descText, langCode]);
    }
  }
}

/**
 * Process hotel contacts
 */
async function processHotelContacts(client, hotelId, contacts) {
  const contactQuery = `
        INSERT INTO hotel.hotel_contacts (hotel_id, contact_type, contact_value)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
    `;

  for (const contact of contacts) {
    const contactType = contact.type || contact.contact_type || 'general';
    const contactValue = contact.value || contact.contact_value || contact;

    if (typeof contactValue === 'string' && contactValue.trim()) {
      await client.query(contactQuery, [hotelId, contactType, contactValue]);
    }
  }
}

/**
 * Save data to JSON file for backup
 */
async function saveDataToFile(hotels) {
  console.log('💾 Saving data to JSON file...');

  const dataDir = path.join(process.cwd(), 'data');
  await fs.mkdir(dataDir, { recursive: true });

  const filePath = path.join(dataDir, 'uae-hotels.json');
  await fs.writeFile(filePath, JSON.stringify(hotels, null, 2));

  console.log(`✅ Data saved to ${filePath}`);
}

/**
 * Generate final report
 */
function generateReport() {
  const elapsed = Math.floor((Date.now() - stats.startTime) / 1000);
  const avgSpeed = stats.processedHotels / Math.max(elapsed, 1);

  console.log('\n' + '='.repeat(60));
  console.log('📊 IMPORT COMPLETION REPORT');
  console.log('='.repeat(60));
  console.log(`Total Hotels Processed: ${stats.processedHotels}`);
  console.log(`Hotels Inserted/Updated: ${stats.insertedHotels}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(
    `Success Rate: ${(((stats.processedHotels - stats.errors) / stats.processedHotels) * 100).toFixed(1)}%`
  );
  console.log(`Processing Speed: ${avgSpeed.toFixed(1)} hotels/second`);
  console.log(`Total Time: ${elapsed} seconds`);
  console.log('='.repeat(60));

  if (stats.errors === 0) {
    console.log('🎉 Import completed successfully with no errors!');
  } else {
    console.log(`⚠️  Import completed with ${stats.errors} errors. Check logs above for details.`);
  }
}

/**
 * Main execution function
 */
async function main() {
  console.log('🚀 Starting UAE Hotels Import Process');
  console.log('='.repeat(60));

  let pool;

  try {
    // Initialize database
    pool = await initDatabase();

    // Create schema
    await createSchema(pool);

    // Fetch data from API
    const hotels = await fetchHotelsFromAPI();

    if (hotels.length === 0) {
      console.log('❌ No UAE hotels found in API response');
      return;
    }

    // Save raw data to file
    await saveDataToFile(hotels);

    // Process hotels
    await processHotels(pool, hotels);

    // Generate report
    generateReport();
  } catch (error) {
    console.error('❌ Import process failed:', error);
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

export { main as importUAEHotels };
