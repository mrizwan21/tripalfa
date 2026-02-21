#!/usr/bin/env node
/**
 * LiteAPI Full Hotel Import Script
 * 
 * Imports ~2 million hotels from LiteAPI with:
 * - Paginated fetching (200 hotels per request)
 * - Rate limit handling (60 req/min, 5000 req/day)
 * - Parallel worker support
 * - Checkpoint/resume capability
 * - Batch database inserts for performance
 * 
 * Usage:
 *   npx tsx scripts/import-liteapi-hotels-full.ts
 *   WORKER_ID=0 TOTAL_WORKERS=4 npx tsx scripts/import-liteapi-hotels-full.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';

// Load environment
const envPath = path.resolve(process.cwd(), '.env.services');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

// Configuration
const CONFIG = {
  LITEAPI_BASE_URL: process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0',
  LITEAPI_API_KEY: process.env.LITEAPI_API_KEY || '',
  
  // Rate limiting
  RATE_LIMIT_PER_MINUTE: 60,
  RATE_LIMIT_PER_DAY: 5000,
  DELAY_MS: parseInt(process.env.DELAY_MS || '1100'), // ~55 requests per minute
  
  // Pagination
  PAGE_SIZE: 200, // LiteAPI max
  
  // Parallel workers
  WORKER_ID: parseInt(process.env.WORKER_ID || '0'),
  TOTAL_WORKERS: parseInt(process.env.TOTAL_WORKERS || '1'),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase',
  
  // Checkpoint
  CHECKPOINT_FILE: path.join(process.cwd(), 'scripts', `.import-hotels-worker-${process.env.WORKER_ID || '0'}.json`),
  
  // Batch insert size
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '500'),
};

const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
  max: 20,
});

// Types
interface LiteAPIHotel {
  id: string;
  primaryHotelId?: string | null;
  name: string;
  hotelDescription?: string;
  hotelTypeId?: number;
  chain?: string;
  currency?: string;
  country?: string;
  city?: string;
  latitude?: number;
  longitude?: number;
  address?: string;
  zip?: string;
  main_photo?: string;
  thumbnail?: string;
  stars?: number;
  rating?: number;
  reviewCount?: number;
  facilityIds?: number[];
  deletedAt?: string | null;
}

interface LiteAPIResponse {
  data: LiteAPIHotel[];
  total?: number;
}

interface Checkpoint {
  lastCountryCode: string;
  lastOffset: number;
  totalProcessed: number;
  createdCount: number;
  updatedCount: number;
  skippedCount: number;
  failedCount: number;
  lastUpdated: string;
  workerId: number;
  completedCountries: string[];
}

// State
let requestCount = 0;
let lastRequestTime = Date.now();

// Checkpoint functions
function loadCheckpoint(): Checkpoint {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8');
      const checkpoint = JSON.parse(data) as Checkpoint;
      if (checkpoint.workerId === CONFIG.WORKER_ID) {
        console.log(`📂 Resuming from checkpoint: ${checkpoint.totalProcessed} processed`);
        return checkpoint;
      }
    }
  } catch (error) {
    console.log('⚠️  Could not load checkpoint, starting fresh');
  }
  return {
    lastCountryCode: '',
    lastOffset: 0,
    totalProcessed: 0,
    createdCount: 0,
    updatedCount: 0,
    skippedCount: 0,
    failedCount: 0,
    lastUpdated: new Date().toISOString(),
    workerId: CONFIG.WORKER_ID,
    completedCountries: [],
  };
}

function saveCheckpoint(checkpoint: Checkpoint): void {
  checkpoint.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

// Rate limiting
async function waitForRateLimit(): Promise<void> {
  const now = Date.now();
  const elapsed = now - lastRequestTime;
  
  if (elapsed < CONFIG.DELAY_MS) {
    await new Promise(r => setTimeout(r, CONFIG.DELAY_MS - elapsed));
  }
  
  lastRequestTime = Date.now();
  requestCount++;
  
  // Log rate limit status every 100 requests
  if (requestCount % 100 === 0) {
    const requestsPerMinute = (requestCount / ((Date.now() - (now - elapsed * requestCount)) / 60000)).toFixed(1);
    console.log(`   📊 Rate: ~${requestsPerMinute} req/min, Total requests: ${requestCount}`);
  }
}

// API call with retry
async function fetchHotels(countryCode: string, offset: number): Promise<LiteAPIResponse | null> {
  await waitForRateLimit();
  
  const maxRetries = 3;
  let lastError: any;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const response = await axios.get(`${CONFIG.LITEAPI_BASE_URL}/data/hotels`, {
        params: {
          countryCode,
          limit: CONFIG.PAGE_SIZE,
          offset,
        },
        headers: {
          'X-API-Key': CONFIG.LITEAPI_API_KEY,
          'Accept': 'application/json',
        },
        timeout: 60000,
      });
      
      return response.data;
    } catch (error: any) {
      lastError = error;
      
      if (error.response?.status === 429) {
        // Rate limited - wait longer
        console.log('   ⚠️  Rate limited, waiting 60 seconds...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }
      
      if (error.response?.status === 404) {
        return null; // No hotels for this country
      }
      
      if (attempt < maxRetries - 1) {
        console.log(`   ⚠️  Retry ${attempt + 1}/${maxRetries} for ${countryCode} offset ${offset}`);
        await new Promise(r => setTimeout(r, 5000 * (attempt + 1)));
      }
    }
  }
  
  console.error(`   ❌ Failed to fetch ${countryCode} offset ${offset}:`, lastError?.message);
  return null;
}

// Get supplier ID
async function getSupplierId(): Promise<string> {
  const result = await pool.query(
    `INSERT INTO suppliers (code, name, type, status, "apiBaseUrl", "apiKey", "syncEnabled", "syncInterval", "rateLimitPerMin", "rateLimitPerDay")
     VALUES ('liteapi', 'LiteAPI', 'hotel', true, $1, $2, true, 3600, 60, 5000)
     ON CONFLICT (code) DO UPDATE SET 
       "apiBaseUrl" = $1,
       "apiKey" = $2,
       status = true
     RETURNING id`,
    [CONFIG.LITEAPI_BASE_URL, CONFIG.LITEAPI_API_KEY]
  );
  return result.rows[0].id;
}

// Batch insert hotels
async function batchInsertHotels(hotels: LiteAPIHotel[], supplierId: string): Promise<{ created: number; updated: number; skipped: number; failed: number }> {
  const result = { created: 0, updated: 0, skipped: 0, failed: 0 };
  
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    for (const hotel of hotels) {
      try {
        if (!hotel.id || !hotel.name) {
          result.skipped++;
          continue;
        }
        
        // Check if mapping exists
        const mappingResult = await client.query(
          `SELECT "canonicalHotelId" FROM "SupplierHotelMapping" 
           WHERE "supplierId" = $1 AND "supplierHotelId" = $2`,
          [supplierId, hotel.id]
        );
        
        if (mappingResult.rows.length > 0) {
          // Update existing hotel
          await client.query(
            `UPDATE canonical_hotels SET
              name = COALESCE($2, name),
              "nameNormalized" = COALESCE(LOWER($2), "nameNormalized"),
              description = COALESCE($3, description),
              city = COALESCE($4, city),
              "countryCode" = COALESCE(UPPER($5), "countryCode"),
              country = COALESCE(UPPER($5), country),
              latitude = COALESCE($6, latitude),
              longitude = COALESCE($7, longitude),
              "starRating" = COALESCE($8, "starRating"),
              "chainName" = CASE WHEN $9 = 'Not Available' THEN "chainName" ELSE COALESCE($9, "chainName") END,
              status = CASE WHEN $10 IS NOT NULL THEN 'inactive' ELSE status END,
              "updatedAt" = NOW()
            WHERE id = $1`,
            [
              mappingResult.rows[0].canonicalHotelId,
              hotel.name,
              hotel.hotelDescription,
              hotel.city,
              hotel.country,
              hotel.latitude,
              hotel.longitude,
              hotel.stars,
              hotel.chain,
              hotel.deletedAt,
            ]
          );
          
          // Update mapping
          await client.query(
            `UPDATE "SupplierHotelMapping" SET
              "supplierData" = $3,
              "lastSyncedAt" = NOW(),
              "syncStatus" = 'synced',
              "updatedAt" = NOW()
            WHERE "supplierId" = $1 AND "supplierHotelId" = $2`,
            [supplierId, hotel.id, JSON.stringify(hotel)]
          );
          
          result.updated++;
        } else {
          // Create new canonical hotel
          const canonicalCode = `LITE_${hotel.id}`;
          
          const insertResult = await client.query(
            `INSERT INTO canonical_hotels (
              "canonicalCode", name, "nameNormalized", description,
              city, "countryCode", country, latitude, longitude,
              "starRating", "chainName", status, "isActive",
              metadata, "createdAt", "updatedAt"
            ) VALUES (
              $1, $2, LOWER($2), $3,
              $4, UPPER($5), UPPER($5), $6, $7,
              $8, CASE WHEN $9 = 'Not Available' THEN NULL ELSE $9 END, 
              CASE WHEN $10 IS NOT NULL THEN 'inactive' ELSE 'active' END,
              CASE WHEN $10 IS NOT NULL THEN false ELSE true END,
              $11, NOW(), NOW()
            ) RETURNING id`,
            [
              canonicalCode,
              hotel.name,
              hotel.hotelDescription,
              hotel.city,
              hotel.country,
              hotel.latitude,
              hotel.longitude,
              hotel.stars,
              hotel.chain,
              hotel.deletedAt,
              JSON.stringify({
                mainPhoto: hotel.main_photo,
                thumbnail: hotel.thumbnail,
                rating: hotel.rating,
                reviewCount: hotel.reviewCount,
                facilityIds: hotel.facilityIds,
                hotelTypeId: hotel.hotelTypeId,
              }),
            ]
          );
          
          const canonicalHotelId = insertResult.rows[0].id;
          
          // Create mapping
          await client.query(
            `INSERT INTO "SupplierHotelMapping" (
              "canonicalHotelId", "supplierId", "supplierHotelId",
              "matchType", "syncStatus", "lastSyncedAt", "supplierData",
              "isActive", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, 'auto', 'synced', NOW(), $4, true, NOW(), NOW())`,
            [
              canonicalHotelId,
              supplierId,
              hotel.id,
              JSON.stringify(hotel),
            ]
          );
          
          result.created++;
        }
      } catch (error) {
        result.failed++;
      }
    }
    
    await client.query('COMMIT');
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
  
  return result;
}

// Get all countries
async function getCountries(): Promise<string[]> {
  try {
    const response = await axios.get(`${CONFIG.LITEAPI_BASE_URL}/data/countries`, {
      headers: {
        'X-API-Key': CONFIG.LITEAPI_API_KEY,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    const data = response.data?.data || response.data || [];
    const countries = data.map((c: any) => c.countryCode || c.code || c).filter(Boolean);
    
    // Sort for consistent ordering
    countries.sort();
    
    return countries;
  } catch (error) {
    console.error('Failed to fetch countries:', error);
    return [];
  }
}

// Main import function
async function importHotels() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Full Hotel Import (~2M hotels)                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   API URL: ${CONFIG.LITEAPI_BASE_URL}`);
  console.log(`   Worker: ${CONFIG.WORKER_ID + 1}/${CONFIG.TOTAL_WORKERS}`);
  console.log(`   Page Size: ${CONFIG.PAGE_SIZE}`);
  console.log(`   Rate Limit Delay: ${CONFIG.DELAY_MS}ms`);
  console.log(`   Batch Size: ${CONFIG.BATCH_SIZE}`);
  console.log('');
  
  // Get supplier ID
  console.log('📋 Setting up supplier...');
  const supplierId = await getSupplierId();
  console.log(`   ✅ Supplier ID: ${supplierId}`);
  
  // Get countries
  console.log('\n📡 Fetching countries...');
  const allCountries = await getCountries();
  console.log(`   ✅ Found ${allCountries.length} countries`);
  
  // Distribute countries among workers
  const workerCountries = allCountries.filter((_, index) => index % CONFIG.TOTAL_WORKERS === CONFIG.WORKER_ID);
  console.log(`   📦 Worker ${CONFIG.WORKER_ID + 1} assigned ${workerCountries.length} countries`);
  
  // Load checkpoint
  let checkpoint = loadCheckpoint();
  
  const startTime = Date.now();
  let totalCreated = checkpoint.createdCount;
  let totalUpdated = checkpoint.updatedCount;
  let totalSkipped = checkpoint.skippedCount;
  let totalFailed = checkpoint.failedCount;
  let totalProcessed = checkpoint.totalProcessed;
  
  // Process countries
  for (const countryCode of workerCountries) {
    // Skip completed countries
    if (checkpoint.completedCountries.includes(countryCode)) {
      console.log(`   ⏭️  Skipping ${countryCode} (already completed)`);
      continue;
    }
    
    console.log(`\n🌐 Processing country: ${countryCode}`);
    
    let offset = checkpoint.lastCountryCode === countryCode ? checkpoint.lastOffset : 0;
    let countryTotal = 0;
    let countryCreated = 0;
    let countryUpdated = 0;
    let hasMore = true;
    
    while (hasMore) {
      const response = await fetchHotels(countryCode, offset);
      
      if (!response || !response.data || response.data.length === 0) {
        hasMore = false;
        break;
      }
      
      const hotels = response.data;
      const total = response.total || hotels.length;
      
      if (offset === 0) {
        console.log(`   📊 Total hotels for ${countryCode}: ${total.toLocaleString()}`);
        countryTotal = total;
      }
      
      // Batch insert
      const result = await batchInsertHotels(hotels, supplierId);
      countryCreated += result.created;
      countryUpdated += result.updated;
      totalCreated += result.created;
      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      totalFailed += result.failed;
      totalProcessed += hotels.length;
      
      offset += hotels.length;
      
      // Progress update
      const progress = ((offset / countryTotal) * 100).toFixed(1);
      const elapsed = (Date.now() - startTime) / 1000;
      const rate = totalProcessed / elapsed;
      
      console.log(
        `   Progress: ${offset.toLocaleString()}/${countryTotal.toLocaleString()} (${progress}%) | ` +
        `Created: ${totalCreated.toLocaleString()} | Updated: ${totalUpdated.toLocaleString()} | ` +
        `Rate: ${rate.toFixed(1)} hotels/sec`
      );
      
      // Update checkpoint
      checkpoint = {
        lastCountryCode: countryCode,
        lastOffset: offset,
        totalProcessed,
        createdCount: totalCreated,
        updatedCount: totalUpdated,
        skippedCount: totalSkipped,
        failedCount: totalFailed,
        lastUpdated: new Date().toISOString(),
        workerId: CONFIG.WORKER_ID,
        completedCountries: checkpoint.completedCountries,
      };
      
      // Save checkpoint every 10 pages
      if (offset % (CONFIG.PAGE_SIZE * 10) === 0) {
        saveCheckpoint(checkpoint);
      }
      
      // Check if done
      if (hotels.length < CONFIG.PAGE_SIZE) {
        hasMore = false;
      }
    }
    
    // Mark country as completed
    checkpoint.completedCountries.push(countryCode);
    checkpoint.lastOffset = 0;
    checkpoint.lastCountryCode = '';
    saveCheckpoint(checkpoint);
    
    console.log(`   ✅ Completed ${countryCode}: ${countryCreated} created, ${countryUpdated} updated`);
  }
  
  // Final summary
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('\n\n══════════════════════════════════════════════════════════════════');
  console.log('✅ IMPORT COMPLETED');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`   Total Processed: ${totalProcessed.toLocaleString()}`);
  console.log(`   Created: ${totalCreated.toLocaleString()}`);
  console.log(`   Updated: ${totalUpdated.toLocaleString()}`);
  console.log(`   Skipped: ${totalSkipped.toLocaleString()}`);
  console.log(`   Failed: ${totalFailed.toLocaleString()}`);
  console.log(`   Time: ${(elapsed / 60).toFixed(2)} minutes`);
  console.log(`   Rate: ${(totalProcessed / elapsed).toFixed(2)} hotels/sec`);
  console.log(`   API Requests: ${requestCount}`);
  console.log('══════════════════════════════════════════════════════════════════\n');
  
  // Clean up checkpoint
  try {
    fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
    console.log('🧹 Checkpoint file cleaned up');
  } catch (e) { /* ignore */ }
  
  await pool.end();
}

// Run
importHotels().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});