#!/usr/bin/env node
import * as dotenv from 'dotenv';
import axios from 'axios';
import { Pool } from 'pg';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

dotenv.config({ path: '.env.services', override: true });

// ES module compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CONFIG = {
  LITEAPI_BASE_URL: process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0',
  LITEAPI_API_KEY: process.env.LITEAPI_API_KEY || '',
  BATCH_SIZE: parseInt(process.env.BATCH_SIZE || '1000'),
  DELAY_MS: parseInt(process.env.DELAY_MS || '50'),
  MAX_RETRIES: parseInt(process.env.MAX_RETRIES || '3'),
  CHECKPOINT_FILE: path.join(__dirname, '.import-checkpoint.json'),
  PROGRESS_LOG_INTERVAL: parseInt(process.env.PROGRESS_LOG_INTERVAL || '100'),
  // Parallel workers support
  WORKER_ID: parseInt(process.env.WORKER_ID || '0'),
  TOTAL_WORKERS: parseInt(process.env.TOTAL_WORKERS || '1'),
};

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase',
  max: 10,
});

// Checkpoint interface
interface Checkpoint {
  lastProcessedId: string;
  totalProcessed: number;
  successCount: number;
  failedCount: number;
  lastUpdated: string;
  workerId: number;
}

// Default checkpoint
const DEFAULT_CHECKPOINT: Checkpoint = {
  lastProcessedId: '',
  totalProcessed: 0,
  successCount: 0,
  failedCount: 0,
  lastUpdated: new Date().toISOString(),
  workerId: CONFIG.WORKER_ID,
};

// Load checkpoint from file
function loadCheckpoint(): Checkpoint {
  try {
    if (fs.existsSync(CONFIG.CHECKPOINT_FILE)) {
      const data = fs.readFileSync(CONFIG.CHECKPOINT_FILE, 'utf-8');
      const checkpoint = JSON.parse(data) as Checkpoint;

      // Only use checkpoint for same worker
      if (checkpoint.workerId === CONFIG.WORKER_ID) {
        console.log(`   📂 Resuming from checkpoint: ${checkpoint.totalProcessed} processed, last ID: ${checkpoint.lastProcessedId}`);
        return checkpoint;
      }
    }
  } catch (error) {
    console.log('   ⚠️  Could not load checkpoint, starting fresh');
  }
  return { ...DEFAULT_CHECKPOINT, workerId: CONFIG.WORKER_ID };
}

// Save checkpoint to file
function saveCheckpoint(checkpoint: Checkpoint): void {
  checkpoint.lastUpdated = new Date().toISOString();
  fs.writeFileSync(CONFIG.CHECKPOINT_FILE, JSON.stringify(checkpoint, null, 2));
}

// Setup database tables
async function setupDatabase() {
  console.log('\n📋 Setting up database tables...');

  try {
    // Create checkpoint table for database-level tracking
    await pool.query(`
      CREATE TABLE IF NOT EXISTS import_checkpoints (
        id SERIAL PRIMARY KEY,
        import_type TEXT NOT NULL,
        worker_id INT DEFAULT 0,
        last_processed_id TEXT,
        total_processed INT DEFAULT 0,
        success_count INT DEFAULT 0,
        failed_count INT DEFAULT 0,
        updated_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(import_type, worker_id)
      )
    `);

    console.log('   ✅ Database tables ready');
  }

// Fetch hotel details with retry
async function fetchHotelDetails(hotelId: string, retries = 0): Promise<any> {
    try {
      const response = await axios.get(`${CONFIG.LITEAPI_BASE_URL}/data/hotel`, {
        params: { hotelId },
        headers: { 'X-API-Key': CONFIG.LITEAPI_API_KEY },
        timeout: 15000
      });
      return response.data.data;
    } catch (error: any) {
      if (retries < CONFIG.MAX_RETRIES && error.code !== '404') {
        await new Promise(r => setTimeout(r, 1000 * (retries + 1)));
        return fetchHotelDetails(hotelId, retries + 1);
      }
      return null;
    }
  }

  // Import single hotel data
  async function importHotel(hotelId: string, canonicalId: string): Promise<boolean> {
    const details = await fetchHotelDetails(hotelId);
    if (!details) return false;

    const updates: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Main photo
      if (details.thumbnail || details.main_photo) {
        const mainPhoto = details.thumbnail || details.main_photo;
        // We will add it to the standard HotelImage table
        await client.query(
          `INSERT INTO "HotelImage" (id, "canonicalHotelId", url, "urlHash", "imageType", "isPrimary", "sizeVariant", "displayOrder", status, "createdAt", "updatedAt") 
         VALUES (gen_random_uuid()::text, $1, $2, md5($2), 'hotel', true, 'original', 0, 'active', NOW(), NOW()) 
         ON CONFLICT ("urlHash") DO NOTHING`,
          [canonicalId, mainPhoto]
        );
      }

      // Description
      if (details.hotelDescription) {
        await client.query(
          `INSERT INTO "HotelDescription" (id, "canonicalHotelId", "languageCode", "descriptionType", content, "isPrimary", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, 'en', 'general', $2, true, NOW(), NOW())
         ON CONFLICT ("canonicalHotelId", "languageCode", "descriptionType") DO UPDATE SET content = EXCLUDED.content, "updatedAt" = NOW()`,
          [canonicalId, details.hotelDescription]
        );
      }

      // Hotel images
      if (details.hotelImages && Array.isArray(details.hotelImages)) {
        for (const img of details.hotelImages) {
          const imgUrl = img.url || img.urlHd;
          if (imgUrl) {
            await client.query(
              `INSERT INTO "HotelImage" (id, "canonicalHotelId", url, "urlHash", "imageType", "isPrimary", "sizeVariant", "displayOrder", status, "createdAt", "updatedAt") 
             VALUES (gen_random_uuid()::text, $1, $2, md5($2), 'hotel', $3, 'original', 0, 'active', NOW(), NOW()) 
             ON CONFLICT ("urlHash") DO NOTHING`,
              [canonicalId, imgUrl, img.defaultImage || false]
            );
          }
        }
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

  // Get total count for progress display
  async function getTotalCount(): Promise<number> {
    const result = await pool.query(`
    SELECT COUNT(*) as total 
    FROM supplier_hotel_mappings sm 
    JOIN suppliers s ON s.id = sm.supplier_id 
    WHERE s.code = 'liteapi' 
    AND sm.supplier_hotel_id IS NOT NULL
  `);
    return parseInt(result.rows[0].total);
  }

  // Load checkpoint from database
  async function loadCheckpointFromDb(): Promise<Checkpoint | null> {
    const result = await pool.query(
      `SELECT * FROM import_checkpoints 
     WHERE import_type = 'liteapi_hotel_content' 
     AND worker_id = $1`,
      [CONFIG.WORKER_ID]
    );

    if (result.rows.length > 0) {
      const row = result.rows[0];
      return {
        lastProcessedId: row.last_processed_id || '',
        totalProcessed: row.total_processed || 0,
        successCount: row.success_count || 0,
        failedCount: row.failed_count || 0,
        lastUpdated: row.updated_at.toISOString(),
        workerId: row.worker_id,
      };
    }
    return null;
  }

  // Save checkpoint to database
  async function saveCheckpointToDb(checkpoint: Checkpoint): Promise<void> {
    await pool.query(
      `INSERT INTO import_checkpoints (import_type, worker_id, last_processed_id, total_processed, success_count, failed_count, updated_at)
     VALUES ('liteapi_hotel_content', $1, $2, $3, $4, $5, NOW())
     ON CONFLICT (import_type, worker_id)
     DO UPDATE SET
       last_processed_id = $2,
       total_processed = $3,
       success_count = $4,
       failed_count = $5,
       updated_at = NOW()`,
      [checkpoint.workerId, checkpoint.lastProcessedId, checkpoint.totalProcessed, checkpoint.successCount, checkpoint.failedCount]
    );
  }

  // Main import function with pagination
  async function importAllHotels() {
    console.log('\n🔄 Fetching hotel IDs from database...');

    const totalCount = await getTotalCount();
    const totalWorkers = CONFIG.TOTAL_WORKERS;
    const workerId = CONFIG.WORKER_ID;

    console.log(`   Total hotels in database: ${totalCount.toLocaleString()}`);
    console.log(`   Worker ${workerId + 1} of ${totalWorkers}`);
    console.log(`   Batch size: ${CONFIG.BATCH_SIZE}`);

    // Calculate offset for this worker
    const workerOffset = workerId;
    const workerStride = totalWorkers;

    // Load checkpoint
    let checkpoint = await loadCheckpointFromDb() || loadCheckpoint();
    console.log(`   📊 Previous progress: ${checkpoint.totalProcessed.toLocaleString()} processed`);

    let success = checkpoint.successCount;
    let failed = checkpoint.failedCount;
    let processed = checkpoint.totalProcessed;
    let lastProcessedId = checkpoint.lastProcessedId;

    const startTime = Date.now();
    let batchCount = 0;

    // Paginated query loop
    while (true) {
      // Build query based on checkpoint
      let whereClause = `s.code = 'liteapi' AND sm.supplier_hotel_id IS NOT NULL`;
      const params: any[] = [];

      if (lastProcessedId) {
        whereClause += ` AND sm.id > $1`;
        params.push(lastProcessedId);
      }

      // Add worker distribution
      if (totalWorkers > 1) {
        whereClause += ` AND (sm.id::bigint % ${totalWorkers}) = ${workerId}`;
      }

      const limitParam = params.length + 1;
      params.push(CONFIG.BATCH_SIZE);

      const query = `
      SELECT sm.id, sm.supplier_hotel_id, sm.canonical_hotel_id 
      FROM supplier_hotel_mappings sm 
      JOIN suppliers s ON s.id = sm.supplier_id 
      WHERE ${whereClause}
      ORDER BY sm.id ASC
      LIMIT $${limitParam}
    `;

      const result = await pool.query(query, params);

      if (result.rows.length === 0) {
        console.log('\n   ✅ No more hotels to process');
        break;
      }

      console.log(`\n   📦 Processing batch ${++batchCount} (${result.rows.length} hotels)...`);

      for (let i = 0; i < result.rows.length; i++) {
        const row = result.rows[i];
        const progressInBatch = i + 1;

        // Progress display
        if (progressInBatch % CONFIG.PROGRESS_LOG_INTERVAL === 0 || progressInBatch === result.rows.length) {
          const elapsed = (Date.now() - startTime) / 1000;
          const rate = processed / elapsed;
          const remaining = totalCount - processed;
          const eta = remaining / rate / 60; // minutes

          process.stdout.write(
            `\r   Progress: ${processed.toLocaleString()}/${totalCount.toLocaleString()} ` +
            `(${((processed / totalCount) * 100).toFixed(2)}%) | ` +
            `Rate: ${rate.toFixed(1)}/s | ` +
            `ETA: ${eta > 0 ? Math.floor(eta) + 'm' : '--'}`
          );
        }

        try {
          const ok = await importHotel(row.supplier_hotel_id, row.canonical_hotel_id);
          if (ok) success++; else failed++;
        } catch (error) {
          failed++;
        }

        processed++;
        lastProcessedId = row.id;

        // Delay between API calls
        if (CONFIG.DELAY_MS > 0) {
          await new Promise(r => setTimeout(r, CONFIG.DELAY_MS));
        }
      }

      // Save checkpoint after each batch
      checkpoint = {
        lastProcessedId,
        totalProcessed: processed,
        successCount: success,
        failedCount: failed,
        lastUpdated: new Date().toISOString(),
        workerId: CONFIG.WORKER_ID,
      };

      saveCheckpoint(checkpoint);
      await saveCheckpointToDb(checkpoint);

      console.log(`\n   💾 Checkpoint saved: ${processed.toLocaleString()} processed`);
    }

    const elapsed = (Date.now() - startTime) / 1000;
    console.log(`\n\n   ✅ Import completed!`);
    console.log(`   📊 Final Stats:`);
    console.log(`      - Total processed: ${processed.toLocaleString()}`);
    console.log(`      - Success: ${success.toLocaleString()}`);
    console.log(`      - Failed: ${failed.toLocaleString()}`);
    console.log(`      - Time elapsed: ${(elapsed / 60).toFixed(2)} minutes`);
    console.log(`      - Average rate: ${(processed / elapsed).toFixed(2)} hotels/sec`);

    // Clear checkpoint after successful completion
    try {
      fs.unlinkSync(CONFIG.CHECKPOINT_FILE);
      await pool.query(
        `DELETE FROM import_checkpoints 
       WHERE import_type = 'liteapi_hotel_content' 
       AND worker_id = $1`,
        [CONFIG.WORKER_ID]
      );
      console.log('   🧹 Checkpoint cleared');
    } catch (e) { /* ignore */ }

    return { success, failed, processed };
  }

  // Main entry point
  async function main() {
    console.log('╔══════════════════════════════════════════════════════════════════╗');
    console.log('║        LiteAPI Hotel Content Import (Paginated)                  ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`   Base URL: ${CONFIG.LITEAPI_BASE_URL}`);
    console.log(`   Batch Size: ${CONFIG.BATCH_SIZE}`);
    console.log(`   Delay: ${CONFIG.DELAY_MS}ms`);
    console.log(`   Worker: ${CONFIG.WORKER_ID + 1}/${CONFIG.TOTAL_WORKERS}`);

    try {
      await setupDatabase();
      console.log('\n📥 Starting paginated import...');
      await importAllHotels();
      console.log('\n✅ All done!');
    } catch (error) {
      console.error('\n❌ Error:', (error as Error).message);
      console.error((error as Error).stack);
      process.exit(1);
    } finally {
      await pool.end();
    }
  }

  main();