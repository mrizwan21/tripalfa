#!/usr/bin/env node
/**
 * LiteAPI Hotel Details Import - Simple Node.js Version
 * 
 * Imports complete hotel details from LiteAPI to local Docker PostgreSQL
 * 
 * Usage:
 *   node scripts/import-hotel-details-simple.js
 *   WORKER_ID=0 TOTAL_WORKERS=4 node scripts/import-hotel-details-simple.js
 */

const { Pool } = require('pg');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.services' });

// Configuration
const CONFIG = {
  LITEAPI_BASE_URL: process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0',
  LITEAPI_API_KEY: process.env.LITEAPI_API_KEY || '',
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase',
  DELAY_MS: parseInt(process.env.DELAY_MS || '1050'),
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '100'),
  WORKER_ID: parseInt(process.env.WORKER_ID || '0'),
  TOTAL_WORKERS: parseInt(process.env.TOTAL_WORKERS || '1'),
  LOG_INTERVAL: parseInt(process.env.LOG_INTERVAL || '10'),
  CHECKPOINT_FILE: path.join(__dirname, `.hotel-details-worker-${process.env.WORKER_ID || '0'}.json`),
};

const pool = new Pool({ connectionString: CONFIG.DATABASE_URL, max: 10 });

// State
let requestCount = 0;
let lastRequestTime = Date.now();

// Checkpoint functions
function loadCheckpoint() {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const data = JSON.parse(fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8'));
      console.log(`📂 Resuming from checkpoint: ${data.totalProcessed} processed`);
      return data;
    }
  } catch (e) {}
  return {
    lastMappingId: '',
    totalProcessed: 0,
    successCount: 0,
    failedCount: 0,
    skippedCount: 0,
    workerId: CONFIG.WORKER_ID,
  };
}

function saveCheckpoint(cp) {
  cp.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(cp, null, 2));
}

// Rate limiting
async function waitForRateLimit() {
  const elapsed = Date.now() - lastRequestTime;
  if (elapsed < CONFIG.DELAY_MS) {
    await new Promise(r => setTimeout(r, CONFIG.DELAY_MS - elapsed));
  }
  lastRequestTime = Date.now();
  requestCount++;
}

// Fetch hotel details
async function fetchHotelDetails(hotelId) {
  await waitForRateLimit();
  
  try {
    const response = await axios.get(`${CONFIG.LITEAPI_BASE_URL}/data/hotel`, {
      params: { hotelId },
      headers: { 'X-API-Key': CONFIG.LITEAPI_API_KEY },
      timeout: 30000,
    });
    return response.data?.data || response.data;
  } catch (error) {
    if (error.response?.status === 429) {
      console.log('   ⚠️  Rate limited, waiting 60s...');
      await new Promise(r => setTimeout(r, 60000));
      return fetchHotelDetails(hotelId);
    }
    return null;
  }
}

// Import hotel details
async function importHotelDetails(canonicalHotelId, supplierHotelId, details) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    
    // Update canonical_hotels
    await client.query(`
      UPDATE canonical_hotels SET
        description = COALESCE($2, description),
        latitude = COALESCE($3, latitude),
        longitude = COALESCE($4, longitude),
        address = COALESCE($5, address),
        star_rating = COALESCE($6, star_rating),
        chain_name = CASE WHEN $7 = 'Not Available' THEN chain_name ELSE COALESCE($7, chain_name) END,
        email = COALESCE(NULLIF($8, ''), email),
        phone = COALESCE(NULLIF($9, ''), phone),
        website = COALESCE(NULLIF($10, ''), website),
        check_in_time = COALESCE(NULLIF($11, ''), check_in_time),
        check_out_time = COALESCE(NULLIF($12, ''), check_out_time),
        main_photo = COALESCE($13, main_photo),
        updated_at = NOW()
      WHERE id = $1
    `, [
      canonicalHotelId,
      details.hotelDescription,
      details.location?.latitude ?? details.latitude,
      details.location?.longitude ?? details.longitude,
      details.address,
      details.starRating ?? details.stars,
      details.chainName ?? details.chain,
      details.email,
      details.phone,
      details.website,
      details.checkinCheckoutTimes?.checkin_start,
      details.checkinCheckoutTimes?.checkout,
      details.main_photo || details.thumbnail,
    ]);
    
    // Insert main image
    if (details.main_photo || details.thumbnail) {
      await client.query(`
        INSERT INTO hotel_images (hotel_id, image_url, image_type, is_primary, created_at)
        VALUES ($1, $2, 'hotel', true, NOW())
        ON CONFLICT DO NOTHING
      `, [canonicalHotelId, details.main_photo || details.thumbnail]);
    }
    
    // Insert all images
    if (details.hotelImages?.length > 0) {
      for (const img of details.hotelImages) {
        const url = img.urlHd || img.url;
        if (url) {
          await client.query(`
            INSERT INTO hotel_images (hotel_id, image_url, image_type, title, is_primary, created_at)
            VALUES ($1, $2, 'hotel', $3, $4, NOW())
            ON CONFLICT DO NOTHING
          `, [canonicalHotelId, url, img.caption || null, img.defaultImage || false]);
        }
      }
    }
    
    // Insert description
    if (details.hotelDescription?.trim()) {
      await client.query(`
        INSERT INTO hotel_descriptions (hotel_id, language_code, description_type, content, created_at, updated_at)
        VALUES ($1, 'en', 'general', $2, NOW(), NOW())
        ON CONFLICT (hotel_id, language_code, description_type)
        DO UPDATE SET content = EXCLUDED.content, updated_at = NOW()
      `, [canonicalHotelId, details.hotelDescription.trim()]);
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

// Main import function
async function main() {
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Hotel Details Import                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   API URL: ${CONFIG.LITEAPI_BASE_URL}`);
  console.log(`   Database: ${CONFIG.DATABASE_URL.replace(/:[^:@]+@/, ':****@')}`);
  console.log(`   Worker: ${CONFIG.WORKER_ID + 1}/${CONFIG.TOTAL_WORKERS}`);
  console.log(`   Rate Limit: ${CONFIG.DELAY_MS}ms`);
  console.log('');
  
  // Get supplier ID
  const supplierResult = await pool.query(`SELECT id FROM suppliers WHERE code = 'liteapi' LIMIT 1`);
  const supplierId = supplierResult.rows[0]?.id;
  if (!supplierId) {
    console.error('❌ LiteAPI supplier not found');
    process.exit(1);
  }
  console.log(`   ✅ Supplier ID: ${supplierId}`);
  
  // Get total count with timeout
  console.log('   📊 Counting hotels...');
  const countResult = await pool.query(`
    SELECT reltuples::bigint AS estimate 
    FROM pg_class WHERE relname = 'supplier_hotel_mappings'
  `);
  const totalCount = parseInt(countResult.rows[0].estimate) || 1450664;
  console.log(`   📊 Total hotels (estimated): ${totalCount.toLocaleString()}`);
  
  // Load checkpoint
  const cp = loadCheckpoint();
  let processed = cp.totalProcessed;
  let success = cp.successCount;
  let failed = cp.failedCount;
  let skipped = cp.skippedCount;
  let lastMappingId = cp.lastMappingId || '';
  
  const startTime = Date.now();
  
  // Process in batches
  while (true) {
    const query = lastMappingId
      ? `SELECT id, supplier_hotel_id, canonical_hotel_id FROM supplier_hotel_mappings WHERE supplier_id = $1 AND is_active = true AND id > $2 ORDER BY id ASC LIMIT $3`
      : `SELECT id, supplier_hotel_id, canonical_hotel_id FROM supplier_hotel_mappings WHERE supplier_id = $1 AND is_active = true ORDER BY id ASC LIMIT $2`;
    
    const params = lastMappingId
      ? [supplierId, lastMappingId, CONFIG.BATCH_SIZE]
      : [supplierId, CONFIG.BATCH_SIZE];
    
    const result = await pool.query(query, params);
    if (result.rows.length === 0) break;
    
    // Filter for this worker
    const rows = result.rows.filter((_, i) => (i % CONFIG.TOTAL_WORKERS) === CONFIG.WORKER_ID);
    
    for (const row of rows) {
      try {
        const details = await fetchHotelDetails(row.supplier_hotel_id);
        if (details) {
          await importHotelDetails(row.canonical_hotel_id, row.supplier_hotel_id, details);
          success++;
        } else {
          skipped++;
        }
      } catch (e) {
        console.error(`   ❌ Error: ${row.supplier_hotel_id} - ${e.message}`);
        failed++;
      }
      
      processed++;
      lastMappingId = row.id;
      
      if (processed % CONFIG.LOG_INTERVAL === 0) {
        const elapsed = (Date.now() - startTime) / 1000;
        const rate = processed / elapsed;
        const eta = (totalCount - processed) / rate / 60;
        
        console.log(`   Progress: ${processed.toLocaleString()}/${totalCount.toLocaleString()} ` +
          `(${((processed/totalCount)*100).toFixed(1)}%) | ` +
          `✅${success} ❌${failed} ⏭️${skipped} | ` +
          `Rate: ${rate.toFixed(1)}/s | ETA: ${eta > 0 ? Math.floor(eta) + 'm' : '--'}`);
        
        saveCheckpoint({ lastMappingId, totalProcessed: processed, successCount: success, failedCount: failed, skippedCount: skipped, workerId: CONFIG.WORKER_ID });
      }
    }
    
    saveCheckpoint({ lastMappingId, totalProcessed: processed, successCount: success, failedCount: failed, skippedCount: skipped, workerId: CONFIG.WORKER_ID });
  }
  
  const elapsed = (Date.now() - startTime) / 1000;
  console.log('\n══════════════════════════════════════════════════════════════════');
  console.log('✅ IMPORT COMPLETED');
  console.log('══════════════════════════════════════════════════════════════════');
  console.log(`   Total: ${processed.toLocaleString()}`);
  console.log(`   Success: ${success.toLocaleString()}`);
  console.log(`   Failed: ${failed.toLocaleString()}`);
  console.log(`   Time: ${(elapsed/60).toFixed(2)} minutes`);
  console.log(`   API Requests: ${requestCount}`);
  
  try { fs.unlinkSync(CONFIG.CHECKPOINT_FILE); } catch (e) {}
  await pool.end();
}

main().catch(e => { console.error('❌ Fatal:', e); process.exit(1); });