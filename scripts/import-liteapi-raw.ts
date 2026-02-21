#!/usr/bin/env node
/**
 * LiteAPI Static Data Importer - Raw SQL Version
 * Uses raw SQL instead of Prisma to bypass schema issues
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables - use override to ensure values are set
dotenv.config({ path: path.resolve(process.cwd(), '.env.services'), override: true });
console.log("LITEAPI_API_KEY:", process.env.LITEAPI_API_KEY ? "set" : "NOT SET");
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "set" : "NOT SET");

import { Pool } from 'pg';

// LiteAPI Configuration
const rawBaseUrl = process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0';
const LITEAPI_BASE_URL = rawBaseUrl.endsWith('/v3.0') ? rawBaseUrl : `${rawBaseUrl.replace(/\/$/, '')}/v3.0`;
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || '';

// Database connection - use raw SQL only
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';
const pool = new Pool({ connectionString });

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

const PAGE_SIZE = 200;

async function fetchLiteAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  const response = await axios.get<any>(url, {
    headers: { 'X-API-Key': LITEAPI_API_KEY, 'Accept': 'application/json' },
    params,
    timeout: 120000,
  });
  return response.data?.data || response.data;
}

async function importHotelsForCountry(countryCode: string, limit?: number): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  // Get supplier ID using raw SQL
  const supplierResult = await pool.query("SELECT id FROM suppliers WHERE code = 'liteapi'");
  if (supplierResult.rows.length === 0) {
    console.error('   ERROR: Supplier "liteapi" not found');
    return result;
  }
  const supplierId = supplierResult.rows[0].id;

  try {
    let offset = 0;
    let totalFetched = 0;
    let hasMore = true;
    const maxHotels = limit || 100000;

    while (hasMore && totalFetched < maxHotels) {
      const params = { 
        countryCode,
        limit: String(Math.min(PAGE_SIZE, maxHotels - totalFetched)),
        offset: String(offset)
      };

      const response = await axios.get(`${LITEAPI_BASE_URL}/data/hotels`, {
        headers: { 'X-API-Key': LITEAPI_API_KEY, 'Accept': 'application/json' },
        params,
        timeout: 120000,
      });
      
      const hotels = response.data?.data || response.data || [];
      const total = response.data?.total || hotels.length;

      if (offset === 0) {
        console.log(`   Total hotels available for ${countryCode}: ${total}`);
      }

      if (hotels.length === 0) {
        hasMore = false;
        break;
      }

      result.total += hotels.length;
      totalFetched += hotels.length;

      // Process hotels in batches for better performance
      for (const hotel of hotels) {
        try {
          if (!hotel.id) {
            result.skipped++;
            continue;
          }

          // Check if mapping exists using raw SQL
          const existingMapping = await pool.query(
            `SELECT id, canonical_hotel_id FROM supplier_hotel_mappings 
             WHERE supplier_id = $1 AND supplier_hotel_id = $2`,
            [supplierId, hotel.id]
          );

          if (existingMapping.rows.length > 0) {
            // Update existing canonical hotel
            await pool.query(
              `UPDATE canonical_hotels SET 
                name = $1, name_normalized = $2, description = $3, city = $4,
                country_code = $5, country = $6, latitude = $7, longitude = $8,
                star_rating = $9, chain_name = $10, metadata = $11, updated_at = NOW()
               WHERE id = $12`,
              [
                hotel.name, hotel.name?.toLowerCase(), hotel.hotelDescription, hotel.city || '',
                hotel.country?.toUpperCase() || '', hotel.country?.toUpperCase() || '',
                hotel.latitude, hotel.longitude, hotel.stars || null,
                hotel.chain !== 'Not Available' ? hotel.chain : null,
                JSON.stringify({
                  mainPhoto: hotel.main_photo, thumbnail: hotel.thumbnail,
                  rating: hotel.rating, reviewCount: hotel.reviewCount,
                  facilityIds: hotel.facilityIds, hotelTypeId: hotel.hotelTypeId,
                }),
                existingMapping.rows[0].canonical_hotel_id
              ]
            );
            result.updated++;
          } else {
            // Check if canonical_code exists from another supplier
            const canonicalCodeValue = `LITE_${hotel.id}`;
            const existingCanonical = await pool.query(
              `SELECT id FROM canonical_hotels WHERE canonical_code = $1`,
              [canonicalCodeValue]
            );
            
            if (existingCanonical.rows.length > 0) {
              // Just create the mapping
              const mappingId = crypto.randomUUID();
              await pool.query(
                `INSERT INTO supplier_hotel_mappings
                  (id, canonical_hotel_id, supplier_id, supplier_hotel_id, match_type, sync_status,
                   last_synced_at, supplier_data, is_active, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, 'auto', 'synced', NOW(), $5, $6, NOW(), NOW())`,
                [
                  mappingId, existingCanonical.rows[0].id, supplierId, hotel.id,
                  JSON.stringify(hotel), !hotel.deletedAt
                ]
              );
              result.created++;
            } else {
              // Create new canonical hotel - generate UUID
              const canonicalId = crypto.randomUUID();
              
              await pool.query(
                `INSERT INTO canonical_hotels 
                  (id, canonical_code, name, name_normalized, description, city, country_code, country,
                   latitude, longitude, star_rating, chain_name, status, metadata, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())`,
                [
                  canonicalId, canonicalCodeValue, hotel.name, hotel.name?.toLowerCase(),
                  hotel.hotelDescription, hotel.city || '', hotel.country?.toUpperCase() || '',
                  hotel.country?.toUpperCase() || '', hotel.latitude, hotel.longitude,
                  hotel.stars || null, hotel.chain !== 'Not Available' ? hotel.chain : null,
                  hotel.deletedAt ? 'inactive' : 'active',
                  JSON.stringify({
                    mainPhoto: hotel.main_photo, thumbnail: hotel.thumbnail,
                    rating: hotel.rating, reviewCount: hotel.reviewCount,
                    facilityIds: hotel.facilityIds, hotelTypeId: hotel.hotelTypeId,
                  })
                ]
              );

              // Create supplier mapping
              const mappingId = crypto.randomUUID();
              await pool.query(
                `INSERT INTO supplier_hotel_mappings
                  (id, canonical_hotel_id, supplier_id, supplier_hotel_id, match_type, sync_status,
                   last_synced_at, supplier_data, is_active, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, 'auto', 'synced', NOW(), $5, $6, NOW(), NOW())`,
                [
                  mappingId, canonicalId, supplierId, hotel.id,
                  JSON.stringify(hotel), !hotel.deletedAt
                ]
              );

              result.created++;
            }
          }
        } catch (error: any) {
          result.failed++;
          if (result.failed <= 3) {
            console.error(`   Error: ${error.message}`);
          }
        }
      }

      offset += hotels.length;
      
      if (hotels.length < PAGE_SIZE) {
        hasMore = false;
      }
      
      if (totalFetched % 1000 < PAGE_SIZE) {
        console.log(`   Progress: ${totalFetched} hotels processed for ${countryCode}`);
      }
      
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`   Completed ${countryCode}: ${result.created} created, ${result.updated} updated`);
  } catch (error: any) {
    console.error(`   Error fetching hotels for ${countryCode}:`, error.message);
  }

  return result;
}

async function importHotels(countryCode?: string, limit?: number): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching hotels from LiteAPI...');

  if (!countryCode) {
    console.log('   No countryCode specified. Importing hotels for all countries...');
    const countries = await fetchLiteAPI<any[]>('/data/countries');
    
    const countriesToProcess = countries.filter((c: any) => c.code);
    console.log(`   Found ${countriesToProcess.length} countries to process`);
    
    for (let i = 0; i < countriesToProcess.length; i++) {
      const country = countriesToProcess[i];
      console.log(`   [${i + 1}/${countriesToProcess.length}] Processing hotels for ${country.code} (${country.name})...`);
      const countryResult = await importHotelsForCountry(country.code, limit);
      result.total += countryResult.total;
      result.created += countryResult.created;
      result.updated += countryResult.updated;
      result.skipped += countryResult.skipped;
      result.failed += countryResult.failed;
    }
  } else {
    const countryResult = await importHotelsForCountry(countryCode, limit);
    result.total = countryResult.total;
    result.created = countryResult.created;
    result.updated = countryResult.updated;
    result.skipped = countryResult.skipped;
    result.failed = countryResult.failed;
  }

  console.log(`   ✅ Hotels: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`);
  return result;
}

async function main() {
  const args = process.argv.slice(2);
  let countryCode: string | undefined;
  let limit: number | undefined;

  for (const arg of args) {
    if (arg.startsWith('--countryCode=')) countryCode = arg.split('=')[1].toUpperCase();
    if (arg.startsWith('--limit=')) limit = parseInt(arg.split('=')[1], 10);
  }

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Static Data Import (Raw SQL)                     ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   Base URL: ${LITEAPI_BASE_URL}`);
  if (countryCode) console.log(`   Country Code: ${countryCode}`);
  if (limit) console.log(`   Limit: ${limit}`);

  if (!LITEAPI_API_KEY) {
    console.warn('\n⚠️  Warning: LITEAPI_API_KEY not set');
  }

  try {
    await importHotels(countryCode, limit);
    console.log('\n✅ Import completed!');
  } catch (error: any) {
    console.error('\n❌ Import failed:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
