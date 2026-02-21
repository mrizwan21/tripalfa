#!/usr/bin/env node
/**
 * LiteAPI Hotel Details Complete Import
 * 
 * Imports complete hotel details from LiteAPI to local Docker PostgreSQL:
 * - Hotel images (all sizes)
 * - Hotel descriptions
 * - Hotel amenities mapping
 * - Contact information
 * - Check-in/out times
 * 
 * Usage:
 *   npx tsx scripts/import-hotel-details-complete.ts
 *   WORKER_ID=0 TOTAL_WORKERS=4 npx tsx scripts/import-hotel-details-complete.ts
 */

import * as dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// Load environment
dotenv.config({ path: '.env.services', override: true });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  LITEAPI_BASE_URL: process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0',
  LITEAPI_API_KEY: process.env.LITEAPI_API_KEY || '',
  
  // Database - LOCAL DOCKER POSTGRES
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase',
  
  // Rate limiting (60 req/min for production API)
  DELAY_MS: parseInt(process.env.DELAY_MS || '1050'), // ~57 requests per minute
  
  // Batch size for fetching hotel mappings
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '100'),
  
  // Parallel workers
  WORKER_ID: parseInt(process.env.WORKER_ID || '0'),
  TOTAL_WORKERS: parseInt(process.env.TOTAL_WORKERS || '1'),
  
  // Checkpoint file
  CHECKPOINT_FILE: path.join(__dirname, `.hotel-details-worker-${process.env.WORKER_ID || '0'}.json`),
  
  // Progress logging
  LOG_INTERVAL: parseInt(process.env.LOG_INTERVAL || '50'),
  
  // Max retries
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
};

// Database connection
const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
  max: 10,
});

// Types
interface HotelDetail {
  id: string;
  name: string;
  hotelDescription?: string;
  thumbnail?: string;
  main_photo?: string;
  hotelImages?: Array<{
    url?: string;
    urlHd?: string;
    defaultImage?: boolean;
    caption?: string;
  }>;
  hotelFacilities?: string[];
  facilities?: Array<{ name?: string; facility?: string }>;
  location?: { latitude?: number; longitude?: number };
  latitude?: number;
  longitude?: number;
  address?: string;
  city?: string;
  country?: string;
  stars?: number;
  starRating?: number;
  rating?: number;
  reviewCount?: number;
  chain?: string;
  chainName?: string;
  email?: string;
  phone?: string;
  website?: string;
  checkinCheckoutTimes?: {
    checkin_start?: string;
    checkin_end?: string;
    checkout?: string;
  };
}

interface Checkpoint {
  lastMappingId: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  skippedCount: number;
  lastUpdated: string;
  workerId: number;
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
    lastMappingId: '',
    totalProcessed: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    lastUpdated: new Date().toISOString(),
    workerId: CONFIG.WORKER_ID,
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
}

// Fetch hotel details with retry
async function fetchHotelDetails(hotelId: string): Promise<HotelDetail | null> {
  await waitForRateLimit();
  
  for (let attempt = 0; attempt < CONFIG.MAX_RETRIES; attempt++) {
    try {
      const response = await axios.get(`${CONFIG.LITEAPI_BASE_URL}/data/hotel`, {
        params: { hotelId },
        headers: {
          'X-API-Key': CONFIG.LITEAPI_API_KEY,
          'Accept': 'application/json',
        },
        timeout: 30000,
      });
      
      const data = response.data?.data || response.data;
      return data;
    } catch (error: any) {
      if (error.response?.status === 429) {
        console.log('   ⚠️  Rate limited, waiting 60 seconds...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }
      
      if (error.response?.status === 404) {
        return null;
      }
      
      if (attempt < CONFIG.MAX_RETRIES - 1) {
        await new Promise(r => setTimeout(r, 2000 * (attempt + 1)));
        continue;
      }
      
      return null;
    }
  }
  
  return null;
}

// Import hotel details to database
async function importHotelDetails(
  canonicalHotelId: string,
  supplierHotelId: string,
  details: HotelDetail
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Extract data
    const latitude = details.location?.latitude ?? details.latitude;
    const longitude = details.location?.longitude ?? details.longitude;
    const starRating = details.starRating ?? details.stars;
    const chainName = details.chainName ?? details.chain;
    const description = details.hotelDescription;
    const checkInTime = details.checkinCheckoutTimes?.checkin_start;
    const checkOutTime = details.checkinCheckoutTimes?.checkout;
    
    // 1. Update canonical_hotels with basic info
    await client.query(
      `UPDATE canonical_hotels SET
        description = COALESCE($2, description),
        latitude = COALESCE($3, latitude),
        longitude = COALESCE($4, longitude),
        address = COALESCE($5, address),
        star_rating = COALESCE($6, star_rating),
        chain_name = CASE WHEN $7 = 'Not Available' OR $7 = '' THEN chain_name ELSE COALESCE($7, chain_name) END,
        email = COALESCE(NULLIF($8, ''), email),
        phone = COALESCE(NULLIF($9, ''), phone),
        website = COALESCE(NULLIF($10, ''), website),
        check_in_time = COALESCE(NULLIF($11, ''), check_in_time),
        check_out_time = COALESCE(NULLIF($12, ''), check_out_time),
        main_photo = COALESCE($13, main_photo),
        updated_at = NOW()
      WHERE id = $1`,
      [
        canonicalHotelId,
        description,
        latitude,
        longitude,
        details.address,
        starRating,
        chainName,
        details.email,
        details.phone,
        details.website,
        checkInTime,
        checkOutTime,
        details.main_photo || details.thumbnail,
      ]
    );
    
    // 2. Insert main photo as primary image
    if (details.main_photo || details.thumbnail) {
      const mainPhoto = details.main_photo || details.thumbnail;
      const urlHash = require('crypto').createHash('md5').update(mainPhoto).digest('hex');
      
      await client.query(
        `INSERT INTO hotel_images (hotel_id, image_url, image_type, is_primary, created_at)
         VALUES ($1, $2, 'hotel', true, NOW())
         ON CONFLICT DO NOTHING`,
        [canonicalHotelId, mainPhoto]
      );
    }
    
    // 3. Insert all hotel images
    if (details.hotelImages && details.hotelImages.length > 0) {
      for (let i = 0; i < details.hotelImages.length; i++) {
        const img = details.hotelImages[i];
        const imgUrl = img.urlHd || img.url;
        if (!imgUrl) continue;
        
        await client.query(
          `INSERT INTO hotel_images (hotel_id, image_url, image_type, title, is_primary, created_at)
           VALUES ($1, $2, 'hotel', $3, $4, NOW())
           ON CONFLICT DO NOTHING`,
          [
            canonicalHotelId,
            imgUrl,
            img.caption || null,
            img.defaultImage || false,
          ]
        );
      }
    }
    
    // 4. Insert description into hotel_descriptions table
    if (description && description.trim()) {
      await client.query(
        `INSERT INTO hotel_descriptions (hotel_id, language_code, description_type, content, created_at, updated_at)
         VALUES ($1, 'en', 'general', $2, NOW(), NOW())
         ON CONFLICT (hotel_id, language_code, description_type) 
         DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()`,
        [canonicalHotelId, description.trim()]
      );
    }
    
    // 5. Store facilities in metadata for later mapping
    if (details.hotelFacilities && details.hotelFacilities.length > 0) {
      await client.query(
        `UPDATE canonical_hotels SET
          metadata = COALESCE(metadata, '{}'::jsonb) || 
          jsonb_build_object('hotelFacilities', $2::jsonb)
        WHERE id = $1`,
        [canonicalHotelId, JSON.stringify(details.hotelFacilities)]
      );
    }
    
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// Get supplier ID
async function getSupplierId(): Promise<string | null> {
  const result = await pool.query(
    `SELECT id FROM suppliers WHERE code = 'liteapi' LIMIT 1`
  );
  return result.rows[0]?.id || null;
}

// Get total count
async function getTotalCount(supplierId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as total FROM supplier_hotel_mappings 
     WHERE supplier_id = $1 AND is_active = true`,
    [supplierId]
  );
  return parseInt(result.rows[0].total);
}

// Main import function
async function importAllHotels() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Hotel Details Complete Import                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   API URL: ${CONFIG.LITEAPI_BASE_URL}`);
  console.log(`   Database: ${CONFIG.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`   Worker: ${CONFIG.WORKER_ID + 1}/${CONFIG.TOTAL_WORKERS}`);
  console.log(`   Rate Limit Delay: ${CONFIG.DELAY_MS}ms`);
  console.log(`   Batch Size: ${CONFIG.BATCH_SIZE}`);
  console.log('');
  
  // Get supplier ID
  const supplierId = await getSupplierId();
  if (!supplierId) {
    console.error('❌ LiteAPI supplier not found in database');
    process.exit(1);
  }
  console.log(`   ✅ Supplier ID: ${supplierId}`);
  
  // Get total count
  const totalCount = await getTotalCount(supplierId);
  console.log(`   📊 Total LiteAPI hotels: ${totalCount.toLocaleString()}`);
  
  // Worker distribution
  const workerOffset = CONFIG.WORKER_ID;
  const workerStride = CONFIG.TOTAL_WORKERS;
  console.log(`   📦 Processing every ${workerStride}th hotel starting at offset ${workerOffset}`);
  
  // Load checkpoint
  let checkpoint = loadCheckpoint();
  
  const startTime = Date.now();
  let success = checkpoint.successCount;
  let failed = checkpoint.failedCount;
  let skipped = checkpoint.skippedCount;
  let processed = checkpoint.totalProcessed;
  
  // Process hotels in batches
  let lastMappingId = checkpoint.lastMappingId || '';
  let hasMore = true;
  
  while (hasMore) {
    // Fetch batch of mappings
    const query = lastMappingId
      ? `SELECT id, supplier_hotel_id, canonical_hotel_id 
         FROM supplier_hotel_mappings 
         WHERE supplier_id = $1 AND is_active = true AND id > $2
         ORDER BY id ASC LIMIT $3`
      : `SELECT id, supplier_hotel_id, canonical_hotel_id 
         FROM supplier_hotel_mappings 
         WHERE supplier_id = $1 AND is_active = true
         ORDER BY id ASC LIMIT $2`;
    
    const params = lastMappingId
      ? [supplierId, lastMappingId, CONFIG.BATCH_SIZE]
      : [supplierId, CONFIG.BATCH_SIZE];
    
    const result = await pool.query(query, params);
    
    if (result.rows.length === 0) {
      hasMore = false;
      break;
    }
    
    // Filter for this worker (distribute load)
    const workerRows = result.rows.filter((_, idx) => (idx % workerStride) === workerOffset);
    
    for (const row of workerRows) {
      const { id, supplier_hotel_id, canonical_hotel_id } = row;
      
      try {
        // Fetch hotel details from LiteAPI
        const details = await fetchHotelDetails(supplier_hotel_id);
        
        if (details) {
          // Import to database
          const ok = await importHotelDetails(canonical_hotel_id, supplier_hotel_id, details);
          if (ok) {
            success++;
          } else {
            failed++;
          }
        } else {
          skipped++;
        }
      } catch (error: any) {
        console.error(`   ❌ Error processing ${supplier_hotel_id}: ${error.message}`);
        failed++;
      }
      
      processed++;
      lastMappingId = id;
      
      // Progress update
      if (processed % CONFIG.LOG_INTERVAL === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const remaining = totalCount - processed;
        const eta = remaining / rate / 60;
        
        console.log(
          `   Progress: ${processed.toLocaleString()}/${totalCount.toLocaleString()} ` +
          `(${((processed / totalCount) * 100).toFixed(2)}%) | ` +
          `✅ ${success.toLocaleString()} | ` +
          `❌ ${failed.toLocaleString()} | ` +
          `⏭️ ${skipped.toLocaleString()} | ` +
          `Rate: ${rate.toFixed(2)}/s | ` +
          `ETA: ${eta > 0 ? Math.floor(eta) + 'm' : '--'}`
        );
        
        // Save checkpoint
        checkpoint = {
          lastMappingId,
          totalProcessed: processed,
          successCount: success,
          failedCount: failed,
          skippedCount: skipped,
          lastUpdated: new Date().toISOString(),
          workerId: CONFIG.WORKER_ID,
        };
        saveCheckpoint(checkpoint);
      }
    }
    
    // Save checkpoint after each batch
    checkpoint = {
      lastMappingId,
      totalProcessed: processed,
      successCount: success,
      failedCount: failed,
      skippedCount: skipped,
      lastUpdated: new Date().toISOString(),
      workerId: CONFIG.WORKER_ID,
    };
    saveCheckpoint(checkpoint);
  }
  
  // Final summary
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('\n\n══════════════════════════════════════════════════════════════════');
  console.log('✅ IMPORT COMPLETED');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`   Total Processed: ${processed.toLocaleString()}`);
  console.log(`   Success: ${success.toLocaleString()}`);
  console.log(`   Failed: ${failed.toLocaleString()}`);
  console.log(`   Skipped: ${skipped.toLocaleString()}`);
  console.log(`   Time: ${(elapsed / 60).toFixed(2)} minutes`);
  console.log(`   Rate: ${(processed / elapsed).toFixed(2)} hotels/sec`);
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
importAllHotels().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});