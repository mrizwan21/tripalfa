#!/usr/bin/env node
/**
 * Mishor Content Import Script
 * 
 * Imports hotel content (images, descriptions, amenities) from Mishor CSV files
 * into the canonical database structure.
 * 
 * Usage:
 *   npx tsx scripts/import-mishor-content.ts           # Import all
 *   npx tsx scripts/import-mishor-content.ts --images  # Import only images
 *   npx tsx scripts/import-mishor-content.ts --descriptions  # Import only descriptions
 *   npx tsx scripts/import-mishor-content.ts --amenities  # Import only amenities
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import { Pool } from 'pg';

dotenv.config({ path: '.env.services', override: true });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase'
});

const MISHOR_DIR = path.join(process.cwd(), 'mishor_static');

// ============================================
// Table Creation (Removed)
// Scripts now write directly to Prisma-managed tables
// ============================================
async function createTables() {
  console.log('\n📋 Skipping legacy table creation (using Prisma schema)');
}

// ============================================
// Import Images
// ============================================

async function importImages(batchSize = 5000): Promise<number> {
  console.log('\n🖼️  Importing hotel images...');

  // Get all image files
  const imageFiles = fs.readdirSync(MISHOR_DIR)
    .filter(f => f.startsWith('hotel_images.part') && f.endsWith('.csv'))
    .sort();

  let totalImported = 0;

  for (const file of imageFiles) {
    console.log(`   Processing ${file}...`);
    const filePath = path.join(MISHOR_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n').slice(1); // Skip header

    let batch: { hotelId: number; url: string; title: string }[] = [];

    for (const line of lines) {
      if (!line.trim()) continue;

      // Parse CSV - handle quoted fields
      const match = line.match(/^(\d+),([^,]*),(.*)$/);
      if (!match) continue;

      const hotelId = parseInt(match[1]);
      const url = match[2].replace(/^"|"$/g, '');
      const title = match[3]?.replace(/^"|"$/g, '') || '';

      if (!url || !url.startsWith('http')) continue;

      batch.push({ hotelId, url, title });

      await pool.query(`
          INSERT INTO "HotelImage" (id, "canonicalHotelId", url, "urlHash", "imageType", "isPrimary", "sizeVariant", "displayOrder", status, "createdAt", "updatedAt")
          VALUES ${batch.map((_, i) => `(gen_random_uuid()::text, $${i * 3 + 1}::text, $${i * 3 + 2}, md5($${i * 3 + 2}), 'hotel', false, 'original', 0, 'active', NOW(), NOW())`).join(', ')}
          ON CONFLICT ("urlHash") DO NOTHING
        `, batch.flatMap(b => [b.hotelId, b.url, b.title]));

      totalImported += batch.length;
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await pool.query(`
        INSERT INTO "HotelImage" (id, "canonicalHotelId", url, "urlHash", "imageType", "isPrimary", "sizeVariant", "displayOrder", status, "createdAt", "updatedAt")
        VALUES ${batch.map((_, i) => `(gen_random_uuid()::text, $${i * 3 + 1}::text, $${i * 3 + 2}, md5($${i * 3 + 2}), 'hotel', false, 'original', 0, 'active', NOW(), NOW())`).join(', ')}
        ON CONFLICT ("urlHash") DO NOTHING
      `, batch.flatMap(b => [b.hotelId, b.url, b.title]));
    totalImported += batch.length;
  }

  console.log(`   ✅ ${file}: ${totalImported} images imported`);
}

console.log(`   ✅ Total hotel images: ${totalImported}`);
return totalImported;
}

// ============================================
// Import Descriptions
// ============================================

async function importDescriptions(): Promise<number> {
  console.log('\n📝 Importing hotel descriptions...');

  const filePath = path.join(MISHOR_DIR, 'hotel_descriptions.csv');
  const content = fs.readFileSync(filePath, 'utf-8');
  const lines = content.split('\n').slice(1); // Skip header

  let totalImported = 0;
  const batchSize = 1000;
  let batch: { hotelId: number; description: string }[] = [];

  for (const line of lines) {
    if (!line.trim()) continue;

    // Find the first comma to split id and description
    const firstComma = line.indexOf(',');
    if (firstComma === -1) continue;

    const hotelId = parseInt(line.substring(0, firstComma));
    // Description is everything after the first comma, remove surrounding quotes
    let description = line.substring(firstComma + 1);
    if (description.startsWith('"') && description.endsWith('"')) {
      description = description.slice(1, -1);
    }
    // Unescape double quotes
    description = description.replace(/""/g, '"');

    if (isNaN(hotelId) || !description.trim()) continue;

    batch.push({ hotelId, description });

    if (batch.length >= batchSize) {
      await pool.query(`
        INSERT INTO "HotelDescription" (id, "canonicalHotelId", "languageCode", "descriptionType", content, "isPrimary", "createdAt", "updatedAt")
        VALUES ${batch.map((_, i) => `(gen_random_uuid()::text, $${i * 2 + 1}::text, 'en', 'general', $${i * 2 + 2}, true, NOW(), NOW())`).join(', ')}
        ON CONFLICT ("canonicalHotelId", "languageCode", "descriptionType") DO UPDATE SET content = EXCLUDED.content, "updatedAt" = NOW()
      `, batch.flatMap(b => [b.hotelId, b.description]));

      totalImported += batch.length;
      batch = [];
    }
  }

  // Insert remaining
  if (batch.length > 0) {
    await pool.query(`
      INSERT INTO "HotelDescription" (id, "canonicalHotelId", "languageCode", "descriptionType", content, "isPrimary", "createdAt", "updatedAt")
      VALUES ${batch.map((_, i) => `(gen_random_uuid()::text, $${i * 2 + 1}::text, 'en', 'general', $${i * 2 + 2}, true, NOW(), NOW())`).join(', ')}
      ON CONFLICT ("canonicalHotelId", "languageCode", "descriptionType") DO UPDATE SET content = EXCLUDED.content, "updatedAt" = NOW()
    `, batch.flatMap(b => [b.hotelId, b.description]));
    totalImported += batch.length;
  }

  console.log(`   ✅ Total descriptions: ${totalImported}`);
  return totalImported;
}

// ============================================
// Import Amenities (Skipped)
// ============================================
// The old raw script isn't capable of looking up mapping IDs in the new Prisma schema.
// Please use the 'import-mishor-static.sh' script to import amenities instead.
async function importAmenities(): Promise<number> {
  console.log('\n🏨 Skipping hotel amenities (use the bash static import script for this)');
  return 0;
}

// ============================================
// Main
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const doImages = args.includes('--images') || args.includes('--all') || args.length === 0;
  const doDescriptions = args.includes('--descriptions') || args.includes('--all') || args.length === 0;
  const doAmenities = args.includes('--amenities') || args.includes('--all') || args.length === 0;

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        Mishor Content Import (Images, Descriptions, Amenities)   ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   Importing: ${doImages ? 'Images ' : ''}${doDescriptions ? 'Descriptions ' : ''}${doAmenities ? 'Amenities' : ''}`.trim());

  try {
    // Create tables
    await createTables();

    const results = {
      images: 0,
      descriptions: 0,
      amenities: 0,
    };

    if (doImages) {
      results.images = await importImages();
    }

    if (doDescriptions) {
      results.descriptions = await importDescriptions();
    }

    if (doAmenities) {
      results.amenities = await importAmenities();
    }

    console.log('\n╔══════════════════════════════════════════════════════════════════╗');
    console.log('║                      IMPORT COMPLETED                           ║');
    console.log('╚══════════════════════════════════════════════════════════════════╝');
    console.log(`   Hotel Images:      ${results.images.toLocaleString()}`);
    console.log(`   Descriptions:      ${results.descriptions.toLocaleString()}`);
    console.log(`   Amenities:         ${results.amenities.toLocaleString()}`);
    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('\n❌ Import failed:', (error as Error).message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
