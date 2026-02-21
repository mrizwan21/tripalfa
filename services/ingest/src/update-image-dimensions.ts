#!/usr/bin/env node
/**
 * Update Image Dimensions Script
 * 
 * This script updates existing hotel images in the database with their actual dimensions.
 * It reads images from local storage and extracts width/height using sharp.
 * 
 * Usage:
 *   npx tsx src/update-image-dimensions.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';

// Load environment variables FIRST before any other imports
const envPath = path.resolve(process.cwd(), '.env.services');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
  console.log(`Loaded environment from: ${envPath}`);
} else {
  // Try parent directory (when running from services/ingest)
  const parentEnvPath = path.resolve(process.cwd(), '../../.env.services');
  if (fs.existsSync(parentEnvPath)) {
    dotenv.config({ path: parentEnvPath });
    console.log(`Loaded environment from: ${parentEnvPath}`);
  } else {
    console.warn('No .env.services file found, checking for DATABASE_URL');
  }
}

// Now import the modules that depend on environment variables
import sharp from 'sharp';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Initialize Prisma with pg adapter
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';
console.log(`Using database: ${connectionString.replace(/:[^:@]+@/, ':****@')}`);

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const IMAGE_STORAGE_PATH = process.env.IMAGE_STORAGE_PATH || './storage/hotel-images';

interface ImageUpdateResult {
  total: number;
  updated: number;
  skipped: number;
  failed: number;
  errors: Array<{ id: string; error: string }>;
}

async function updateImageDimensions(): Promise<ImageUpdateResult> {
  const result: ImageUpdateResult = {
    total: 0,
    updated: 0,
    skipped: 0,
    failed: 0,
    errors: [],
  };

  console.log('=== Updating Hotel Image Dimensions ===\n');

  // Find all images that are stored locally but missing dimensions
  const images = await prisma.hotelImage.findMany({
    where: {
      url: { contains: 'hotel-images' },
      OR: [
        { width: null },
        { height: null },
      ],
    },
    select: {
      id: true,
      url: true,
      width: true,
      height: true,
      fileSize: true,
    },
  });

  result.total = images.length;
  console.log(`Found ${images.length} images to process\n`);

  if (images.length === 0) {
    console.log('No images need dimension updates.');
    return result;
  }

  // Process in batches
  const batchSize = 50;
  for (let i = 0; i < images.length; i += batchSize) {
    const batch = images.slice(i, i + batchSize);
    
    console.log(`Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(images.length / batchSize)}...`);

    for (const image of batch) {
      try {
        // Construct full path if needed
        const fullPath = image.url.startsWith('/') 
          ? image.url 
          : path.resolve(process.cwd(), image.url);
        
        // Check if file exists
        if (!fs.existsSync(fullPath)) {
          result.skipped++;
          continue;
        }

        // Get image metadata using sharp
        const metadata = await sharp(fullPath).metadata();
        
        if (metadata.width && metadata.height) {
          // Update database record
          await prisma.hotelImage.update({
            where: { id: image.id },
            data: {
              width: metadata.width,
              height: metadata.height,
              fileSize: fs.statSync(fullPath).size,
            },
          });
          
          result.updated++;
          
          if (result.updated % 100 === 0) {
            console.log(`  Updated ${result.updated}/${result.total} images...`);
          }
        } else {
          result.skipped++;
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        result.failed++;
        result.errors.push({ id: image.id, error: errorMessage });
        
        if (result.errors.length <= 10) {
          console.error(`  Error processing image ${image.id}: ${errorMessage}`);
        }
      }
    }
  }

  return result;
}

async function main(): Promise<void> {
  try {
    const result = await updateImageDimensions();

    console.log('\n=== Update Complete ===');
    console.log(`Total images processed: ${result.total}`);
    console.log(`Updated: ${result.updated}`);
    console.log(`Skipped: ${result.skipped}`);
    console.log(`Failed: ${result.failed}`);
    
    if (result.errors.length > 0) {
      console.log(`\nFirst 10 errors:`);
      result.errors.slice(0, 10).forEach((err, i) => {
        console.log(`  ${i + 1}. ${err.id}: ${err.error}`);
      });
    }
  } catch (error) {
    console.error('Script failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    await pool.end();
  }
}

main();
