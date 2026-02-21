#!/usr/bin/env node
/**
 * LiteAPI Hotel Content Enrichment Script
 * 
 * Enriches existing LiteAPI hotels with:
 * - Hotel photos
 * - Descriptions
 * - Amenities/Facilities
 * - Room details
 * 
 * Uses the hotel detail endpoint: GET /data/hotel?hotelId=xxx
 * 
 * Usage:
 *   npx tsx scripts/enrich-liteapi-hotels.ts
 *   WORKER_ID=0 TOTAL_WORKERS=4 npx tsx scripts/enrich-liteapi-hotels.ts
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
  
  // Rate limiting (60 req/min for production)
  DELAY_MS: parseInt(process.env.DELAY_MS || '1050'), // ~57 requests per minute
  
  // Batch size for database queries
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '100'),
  
  // Parallel workers
  WORKER_ID: parseInt(process.env.WORKER_ID || '0'),
  TOTAL_WORKERS: parseInt(process.env.TOTAL_WORKERS || '1'),
  
  // Database
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase',
  
  // Checkpoint
  CHECKPOINT_FILE: path.join(process.cwd(), 'scripts', `.enrich-hotels-worker-${process.env.WORKER_ID || '0'}.json`),
  
  // Progress logging interval
  LOG_INTERVAL: parseInt(process.env.LOG_INTERVAL || '100'),
  
  // Max retries for API calls
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
};

const pool = new Pool({
  connectionString: CONFIG.DATABASE_URL,
  max: 10,
});

// Types
interface HotelDetail {
  id: string;
  name: string;
  hotelDescription?: string;
  description?: string;
  thumbnail?: string;
  main_photo?: string;
  hotelImages?: Array<{ url?: string; urlHd?: string; defaultImage?: boolean; caption?: string }>;
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
  checkinCheckoutTimes?: { checkin_start?: string; checkin_end?: string; checkout?: string };
  checkInTime?: string;
  checkOutTime?: string;
}

interface Checkpoint {
  lastMappingId: string;
  totalProcessed: number;
  enrichedCount: number;
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
    enrichedCount: 0,
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
        // Rate limited - wait longer
        console.log('   ⚠️  Rate limited, waiting 60 seconds...');
        await new Promise(r => setTimeout(r, 60000));
        continue;
      }
      
      if (error.response?.status === 404) {
        return null; // Hotel not found
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

// Enrich hotel with details
async function enrichHotel(
  canonicalHotelId: string,
  supplierHotelId: string,
  details: HotelDetail
): Promise<boolean> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Extract data from nested structures
    const latitude = details.location?.latitude ?? details.latitude;
    const longitude = details.location?.longitude ?? details.longitude;
    const starRating = details.starRating ?? details.stars;
    const chainName = details.chainName ?? details.chain;
    const description = details.hotelDescription ?? details.description;
    const checkInTime = details.checkinCheckoutTimes?.checkin_start ?? details.checkInTime;
    const checkOutTime = details.checkinCheckoutTimes?.checkout ?? details.checkOutTime;
    
    // Update canonical hotel
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
        metadata = jsonb_set(
          COALESCE(metadata, '{}'::jsonb),
          '{enrichedAt}',
          to_jsonb(NOW())
        ) || jsonb_build_object(
          'thumbnail', $14,
          'rating', $15,
          'reviewCount', $16
        ),
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
        details.thumbnail,
        details.rating,
        details.reviewCount,
      ]
    );
    
    // Insert hotel images
    if (details.hotelImages && details.hotelImages.length > 0) {
      for (let i = 0; i < details.hotelImages.length; i++) {
        const img = details.hotelImages[i];
        const imgUrl = img.urlHd || img.url;
        if (!imgUrl) continue;
        
        // Check if image already exists
        const existingImg = await client.query(
          `SELECT id FROM hotel_images WHERE hotel_id = $1 AND image_url = $2`,
          [canonicalHotelId, imgUrl]
        );
        
        if (existingImg.rows.length === 0) {
          await client.query(
            `INSERT INTO hotel_images (hotel_id, image_url, image_type, title, is_primary, created_at)
             VALUES ($1, $2, 'hotel', $3, $4, NOW())`,
            [
              canonicalHotelId,
              imgUrl,
              img.caption || null,
              img.defaultImage || i === 0,
            ]
          );
        }
      }
    }
    
    // Store amenities in metadata if available
    if (details.hotelFacilities && details.hotelFacilities.length > 0) {
      await client.query(
        `UPDATE canonical_hotels SET
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{amenities}',
            to_jsonb($2)
          )
        WHERE id = $1`,
        [canonicalHotelId, details.hotelFacilities]
      );
    }
    
    // Store room facilities if available
    if (details.facilities && details.facilities.length > 0) {
      const roomFacilities = details.facilities.map(f => f.name || f.facility).filter(Boolean);
      await client.query(
        `UPDATE canonical_hotels SET
          metadata = jsonb_set(
            COALESCE(metadata, '{}'::jsonb),
            '{roomFacilities}',
            to_jsonb($2)
          )
        WHERE id = $1`,
        [canonicalHotelId, roomFacilities]
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

// Get total count
async function getTotalCount(supplierId: string): Promise<number> {
  const result = await pool.query(
    `SELECT COUNT(*) as total FROM supplier_hotel_mappings 
     WHERE supplier_id = $1 AND is_active = true`,
    [supplierId]
  );
  return parseInt(result.rows[0].total);
}

// Get supplier ID
async function getSupplierId(): Promise<string | null> {
  const result = await pool.query(
    `SELECT id FROM suppliers WHERE code = 'liteapi' LIMIT 1`
  );
  return result.rows[0]?.id || null;
}

// Main enrichment function
async function enrichHotels() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Hotel Content Enrichment                           ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   API URL: ${CONFIG.LITEAPI_BASE_URL}`);
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
  console.log(`   📊 Total LiteAPI hotels to process: ${totalCount.toLocaleString()}`);
  
  // Worker distribution
  const workerOffset = CONFIG.WORKER_ID;
  const workerStride = CONFIG.TOTAL_WORKERS;
  console.log(`   📦 Processing every ${workerStride}th hotel starting at offset ${workerOffset}`);
  
  // Load checkpoint
  let checkpoint = loadCheckpoint();
  
  const startTime = Date.now();
  let enriched = checkpoint.enrichedCount;
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
        // Fetch hotel details
        const details = await fetchHotelDetails(supplier_hotel_id);
        
        if (details) {
          // Enrich hotel
          const success = await enrichHotel(canonical_hotel_id, supplier_hotel_id, details);
          if (success) {
            enriched++;
          } else {
            failed++;
          }
        } else {
          skipped++;
        }
      } catch (error) {
        failed++;
      }
      
      processed++;
      lastMappingId = id;
      
      // Progress update
      if (processed % CONFIG.LOG_INTERVAL === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const remaining = totalCount - processed;
        const eta = remaining / rate / 60; // minutes
        
        console.log(
          `   Progress: ${processed.toLocaleString()}/${totalCount.toLocaleString()} ` +
          `(${((processed / totalCount) * 100).toFixed(2)}%) | ` +
          `Enriched: ${enriched.toLocaleString()} | ` +
          `Failed: ${failed.toLocaleString()} | ` +
          `Rate: ${rate.toFixed(2)}/s | ` +
          `ETA: ${eta > 0 ? Math.floor(eta) + 'm' : '--'}`
        );
        
        // Save checkpoint
        checkpoint = {
          lastMappingId,
          totalProcessed: processed,
          enrichedCount: enriched,
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
      enrichedCount: enriched,
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
  console.log('✅ ENRICHMENT COMPLETED');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`   Total Processed: ${processed.toLocaleString()}`);
  console.log(`   Enriched: ${enriched.toLocaleString()}`);
  console.log(`   Skipped: ${skipped.toLocaleString()}`);
  console.log(`   Failed: ${failed.toLocaleString()}`);
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
enrichHotels().catch(error => {
  console.error('\n❌ Fatal error:', error);
  process.exit(1);
});