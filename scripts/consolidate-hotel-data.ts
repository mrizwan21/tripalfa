/**
 * Hotel Data Consolidation Script
 * ===============================
 * Consolidates all scattered hotel data into the PostgreSQL static database.
 * 
 * Data Sources:
 * 1. Mishor CSV files (mishor_static/)
 * 2. Innstant JSON files (root directory)
 * 3. LiteAPI API (via existing import scripts)
 * 
 * Output: Unified data in staticdatabase (port 5433)
 * 
 * Usage:
 *   npx tsx scripts/consolidate-hotel-data.ts              # Full consolidation
 *   npx tsx scripts/consolidate-hotel-data.ts --analyze    # Analyze only
 *   npx tsx scripts/consolidate-hotel-data.ts --mishor     # Mishor only
 *   npx tsx scripts/consolidate-hotel-data.ts --innstant   # Innstant only
 */

import { Pool } from 'pg';
import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';

// PostgreSQL connection for static database
const STATIC_DB_URL = process.env.STATIC_DATABASE_URL || 
                      'postgresql://postgres:postgres@localhost:5433/staticdatabase';

const pool = new Pool({ connectionString: STATIC_DB_URL });

// Mishor static directory
const MISHOR_DIR = path.join(process.cwd(), 'mishor_static');

// ============================================
// ANALYSIS FUNCTIONS
// ============================================

interface DataSummary {
  source: string;
  dataType: string;
  fileCount: number;
  estimatedRecords: number;
  status: 'found' | 'missing' | 'imported';
}

async function analyzeMishorData(): Promise<DataSummary[]> {
  const summary: DataSummary[] = [];
  
  // Check hotels.csv
  const hotelsFile = path.join(MISHOR_DIR, 'hotels.csv');
  if (fs.existsSync(hotelsFile)) {
    const content = fs.readFileSync(hotelsFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).length - 1; // minus header
    summary.push({ source: 'mishor', dataType: 'hotels', fileCount: 1, estimatedRecords: lines, status: 'found' });
  } else {
    summary.push({ source: 'mishor', dataType: 'hotels', fileCount: 0, estimatedRecords: 0, status: 'missing' });
  }
  
  // Check hotel images
  const imageFiles = fs.readdirSync(MISHOR_DIR).filter(f => f.startsWith('hotel_images.part') && f.endsWith('.csv'));
  let imageCount = 0;
  for (const file of imageFiles) {
    const content = fs.readFileSync(path.join(MISHOR_DIR, file), 'utf-8');
    imageCount += content.split('\n').filter(l => l.trim()).length - 1;
  }
  summary.push({ source: 'mishor', dataType: 'hotel_images', fileCount: imageFiles.length, estimatedRecords: imageCount, status: imageFiles.length > 0 ? 'found' : 'missing' });
  
  // Check hotel facilities
  const facilityFiles = fs.readdirSync(MISHOR_DIR).filter(f => f.startsWith('hotel_facilities') && f.endsWith('.csv'));
  let facilityCount = 0;
  for (const file of facilityFiles) {
    const content = fs.readFileSync(path.join(MISHOR_DIR, file), 'utf-8');
    facilityCount += content.split('\n').filter(l => l.trim()).length - 1;
  }
  summary.push({ source: 'mishor', dataType: 'hotel_facilities', fileCount: facilityFiles.length, estimatedRecords: facilityCount, status: facilityFiles.length > 0 ? 'found' : 'missing' });
  
  // Check hotel descriptions
  const descFile = path.join(MISHOR_DIR, 'hotel_descriptions.csv');
  if (fs.existsSync(descFile)) {
    const content = fs.readFileSync(descFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).length - 1;
    summary.push({ source: 'mishor', dataType: 'hotel_descriptions', fileCount: 1, estimatedRecords: lines, status: 'found' });
  } else {
    summary.push({ source: 'mishor', dataType: 'hotel_descriptions', fileCount: 0, estimatedRecords: 0, status: 'missing' });
  }
  
  // Check destinations
  const destFile = path.join(MISHOR_DIR, 'destinations.csv');
  if (fs.existsSync(destFile)) {
    const content = fs.readFileSync(destFile, 'utf-8');
    const lines = content.split('\n').filter(l => l.trim()).length - 1;
    summary.push({ source: 'mishor', dataType: 'destinations', fileCount: 1, estimatedRecords: lines, status: 'found' });
  } else {
    summary.push({ source: 'mishor', dataType: 'destinations', fileCount: 0, estimatedRecords: 0, status: 'missing' });
  }
  
  return summary;
}

async function analyzeInnstantData(): Promise<DataSummary[]> {
  const summary: DataSummary[] = [];
  
  // Check countries JSON
  const countriesFile = path.join(process.cwd(), 'innstant-countries.json');
  if (fs.existsSync(countriesFile)) {
    const content = JSON.parse(fs.readFileSync(countriesFile, 'utf-8'));
    summary.push({ 
      source: 'innstant', 
      dataType: 'countries', 
      fileCount: 1, 
      estimatedRecords: Array.isArray(content) ? content.length : Object.keys(content).length,
      status: 'found'
    });
  } else {
    summary.push({ source: 'innstant', dataType: 'countries', fileCount: 0, estimatedRecords: 0, status: 'missing' });
  }
  
  // Check currencies JSON
  const currenciesFile = path.join(process.cwd(), 'innstant-currencies.json');
  if (fs.existsSync(currenciesFile)) {
    const content = JSON.parse(fs.readFileSync(currenciesFile, 'utf-8'));
    summary.push({ 
      source: 'innstant', 
      dataType: 'currencies', 
      fileCount: 1, 
      estimatedRecords: Array.isArray(content) ? content.length : Object.keys(content).length,
      status: 'found'
    });
  } else {
    summary.push({ source: 'innstant', dataType: 'currencies', fileCount: 0, estimatedRecords: 0, status: 'missing' });
  }
  
  return summary;
}

async function analyzeDatabaseData(): Promise<DataSummary[]> {
  const summary: DataSummary[] = [];
  
  const tables = [
    { name: 'canonical_hotels', dataType: 'hotels' },
    { name: '"SupplierHotelMapping"', dataType: 'hotel_mappings' },
    { name: '"HotelImage"', dataType: 'hotel_images' },
    { name: '"HotelAmenityMapping"', dataType: 'hotel_amenities' },
    { name: '"HotelDescription"', dataType: 'hotel_descriptions' },
    { name: '"HotelReview"', dataType: 'hotel_reviews' },
    { name: '"Destination"', dataType: 'destinations' },
    { name: '"HotelAmenity"', dataType: 'amenity_definitions' },
    { name: '"HotelType"', dataType: 'hotel_types' },
    { name: '"HotelChain"', dataType: 'hotel_chains' },
    { name: '"BoardType"', dataType: 'board_types' },
    { name: 'suppliers', dataType: 'suppliers' },
    { name: '"Airline"', dataType: 'airlines' },
    { name: '"Airport"', dataType: 'airports' },
    { name: '"Country"', dataType: 'countries' },
    { name: '"Currency"', dataType: 'currencies' },
  ];
  
  for (const table of tables) {
    try {
      const result = await pool.query(`SELECT COUNT(*) as count FROM ${table.name}`);
      const count = parseInt(result.rows[0].count);
      summary.push({
        source: 'database',
        dataType: table.dataType,
        fileCount: 0,
        estimatedRecords: count,
        status: count > 0 ? 'imported' : 'empty'
      });
    } catch (error) {
      summary.push({
        source: 'database',
        dataType: table.dataType,
        fileCount: 0,
        estimatedRecords: 0,
        status: 'missing'
      });
    }
  }
  
  return summary;
}

// ============================================
// IMPORT FUNCTIONS
// ============================================

async function importMishorHotels(): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  
  const hotelsFile = path.join(MISHOR_DIR, 'hotels.csv');
  if (!fs.existsSync(hotelsFile)) {
    result.errors.push('hotels.csv not found');
    return result;
  }
  
  console.log('\n📊 Importing Mishor hotels...');
  
  // Get or create mishor supplier
  const supplierResult = await pool.query(`
    INSERT INTO suppliers (code, name, type, status, "createdAt", "updatedAt")
    VALUES ('mishor', 'Mishor', 'hotel', true, NOW(), NOW())
    ON CONFLICT (code) DO UPDATE SET name = 'Mishor'
    RETURNING id
  `);
  const supplierId = supplierResult.rows[0].id;
  
  // Read CSV
  const content = fs.readFileSync(hotelsFile, 'utf-8');
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    relax_column_count: true,
  });
  
  console.log(`   Found ${records.length} records in hotels.csv`);
  
  // Process in batches
  const batchSize = 100;
  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);
    
    for (const record of batch) {
      try {
        // Extract fields (adjust column names based on actual CSV structure)
        const hotelId = record.hotel_id || record.id || record.HotelId;
        const name = record.name || record.Name || record.hotel_name;
        const city = record.city || record.City;
        const country = record.country || record.Country || record.country_code;
        const countryCode = record.country_code || record.CountryCode;
        const address = record.address || record.Address;
        const latitude = parseFloat(record.latitude || record.Latitude || '0');
        const longitude = parseFloat(record.longitude || record.Longitude || '0');
        const starRating = parseFloat(record.star_rating || record.StarRating || record.stars || '0');
        
        if (!name || !hotelId) {
          result.skipped++;
          continue;
        }
        
        // Insert into canonical_hotels
        const canonicalResult = await pool.query(`
          INSERT INTO canonical_hotels (
            name, name_normalized, city, country, country_code, address,
            latitude, longitude, star_rating, status, "is_active", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, 'active', true, NOW(), NOW())
          ON CONFLICT DO NOTHING
          RETURNING id
        `, [
          name,
          name.toLowerCase(),
          city || null,
          country || null,
          countryCode || null,
          address || null,
          isNaN(latitude) ? null : latitude,
          isNaN(longitude) ? null : longitude,
          isNaN(starRating) ? null : starRating,
        ]);
        
        if (canonicalResult.rows.length > 0) {
          const canonicalId = canonicalResult.rows[0].id;
          
          // Create supplier mapping
          await pool.query(`
            INSERT INTO "SupplierHotelMapping" (
              "canonicalHotelId", "supplierId", "supplierHotelId", "matchType", "isActive", "createdAt", "updatedAt"
            ) VALUES ($1, $2, $3, 'auto', true, NOW(), NOW())
            ON CONFLICT DO NOTHING
          `, [canonicalId, supplierId, hotelId]);
          
          result.imported++;
        } else {
          result.skipped++;
        }
        
      } catch (error) {
        result.errors.push(`Row ${i}: ${error.message}`);
      }
    }
    
    // Progress update
    if ((i + batchSize) % 1000 === 0) {
      console.log(`   Processed ${Math.min(i + batchSize, records.length)} / ${records.length} records...`);
    }
  }
  
  return result;
}

async function importMishorImages(): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  
  const imageFiles = fs.readdirSync(MISHOR_DIR)
    .filter(f => f.startsWith('hotel_images.part') && f.endsWith('.csv'))
    .sort();
  
  if (imageFiles.length === 0) {
    result.errors.push('No hotel_images.part*.csv files found');
    return result;
  }
  
  console.log(`\n📊 Importing Mishor hotel images (${imageFiles.length} files)...`);
  
  // Get mishor supplier ID
  const supplierResult = await pool.query(`SELECT id FROM suppliers WHERE code = 'mishor' LIMIT 1`);
  if (supplierResult.rows.length === 0) {
    result.errors.push('Mishor supplier not found. Run hotel import first.');
    return result;
  }
  const supplierId = supplierResult.rows[0].id;
  
  // Build hotel mapping cache
  const mappingCache = new Map<string, string>();
  const mappingsResult = await pool.query(`
    SELECT sm."supplierHotelId", sm."canonicalHotelId"
    FROM "SupplierHotelMapping" sm
    JOIN suppliers s ON s.id = sm."supplierId"
    WHERE s.code = 'mishor'
  `);
  mappingsResult.rows.forEach(r => mappingCache.set(r.supplierHotelId, r.canonicalHotelId));
  
  console.log(`   Loaded ${mappingCache.size} hotel mappings into cache`);
  
  let totalProcessed = 0;
  
  for (const file of imageFiles) {
    const filePath = path.join(MISHOR_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    
    for (const record of records) {
      try {
        const hotelId = record.hotel_id || record.HotelId;
        const imageUrl = record.url || record.image_url || record.ImageURL;
        
        if (!hotelId || !imageUrl) {
          result.skipped++;
          continue;
        }
        
        const canonicalId = mappingCache.get(hotelId);
        if (!canonicalId) {
          result.skipped++;
          continue;
        }
        
        // Generate URL hash for deduplication
        const crypto = await import('crypto');
        const urlHash = crypto.createHash('md5').update(imageUrl).digest('hex');
        
        // Insert image
        await pool.query(`
          INSERT INTO "HotelImage" (
            "canonicalHotelId", url, "urlHash", "supplierId", "supplierImageId",
            "isPrimary", status, "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, $5, false, 'active', NOW(), NOW())
          ON CONFLICT ("urlHash") DO NOTHING
        `, [canonicalId, imageUrl, urlHash, supplierId, `${hotelId}_${result.imported}`]);
        
        result.imported++;
        
      } catch (error) {
        result.errors.push(`${file}: ${error.message}`);
      }
    }
    
    totalProcessed += records.length;
    console.log(`   Processed ${file} (${records.length} records, total: ${totalProcessed})`);
  }
  
  return result;
}

async function importMishorFacilities(): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  
  const facilityFiles = fs.readdirSync(MISHOR_DIR)
    .filter(f => f.startsWith('hotel_facilities') && f.endsWith('.csv'))
    .sort();
  
  if (facilityFiles.length === 0) {
    result.errors.push('No hotel_facilities*.csv files found');
    return result;
  }
  
  console.log(`\n📊 Importing Mishor hotel facilities (${facilityFiles.length} files)...`);
  
  // Get mishor supplier ID
  const supplierResult = await pool.query(`SELECT id FROM suppliers WHERE code = 'mishor' LIMIT 1`);
  if (supplierResult.rows.length === 0) {
    result.errors.push('Mishor supplier not found');
    return result;
  }
  const supplierId = supplierResult.rows[0].id;
  
  // Build caches
  const hotelCache = new Map<string, string>();
  const hotelMappings = await pool.query(`
    SELECT sm."supplierHotelId", sm."canonicalHotelId"
    FROM "SupplierHotelMapping" sm
    JOIN suppliers s ON s.id = sm."supplierId"
    WHERE s.code = 'mishor'
  `);
  hotelMappings.rows.forEach(r => hotelCache.set(r.supplierHotelId, r.canonicalHotelId));
  
  const amenityCache = new Map<string, string>();
  const amenities = await pool.query(`SELECT id, code FROM "HotelAmenity"`);
  amenities.rows.forEach(r => amenityCache.set(r.code, r.id));
  
  let totalProcessed = 0;
  
  for (const file of facilityFiles) {
    const filePath = path.join(MISHOR_DIR, file);
    const content = fs.readFileSync(filePath, 'utf-8');
    
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      relax_column_count: true,
    });
    
    for (const record of records) {
      try {
        const hotelId = record.hotel_id || record.HotelId;
        const facilityCode = record.facility_code || record.code || record.Code;
        const facilityName = record.name || record.Name || record.facility_name;
        
        if (!hotelId || !facilityCode) {
          result.skipped++;
          continue;
        }
        
        const canonicalId = hotelCache.get(hotelId);
        if (!canonicalId) {
          result.skipped++;
          continue;
        }
        
        // Get or create amenity
        let amenityId = amenityCache.get(facilityCode);
        if (!amenityId) {
          const amenityResult = await pool.query(`
            INSERT INTO "HotelAmenity" (code, name, "isActive", "createdAt", "updatedAt")
            VALUES ($1, $2, true, NOW(), NOW())
            ON CONFLICT (code) DO UPDATE SET name = $2
            RETURNING id
          `, [facilityCode, facilityName || facilityCode]);
          
          amenityId = amenityResult.rows[0].id;
          amenityCache.set(facilityCode, amenityId);
        }
        
        // Create mapping
        await pool.query(`
          INSERT INTO "HotelAmenityMapping" (
            "canonicalHotelId", "amenityId", "supplierId", "supplierAmenityCode",
            "isFree", "isVerified", "createdAt", "updatedAt"
          ) VALUES ($1, $2, $3, $4, true, false, NOW(), NOW())
          ON CONFLICT ("canonicalHotelId", "amenityId") DO NOTHING
        `, [canonicalId, amenityId, supplierId, facilityCode]);
        
        result.imported++;
        
      } catch (error) {
        result.errors.push(`${file}: ${error.message}`);
      }
    }
    
    totalProcessed += records.length;
    console.log(`   Processed ${file} (${records.length} records)`);
  }
  
  return result;
}

async function importInnstantCountries(): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  
  const filePath = path.join(process.cwd(), 'innstant-countries.json');
  if (!fs.existsSync(filePath)) {
    result.errors.push('innstant-countries.json not found');
    return result;
  }
  
  console.log('\n📊 Importing Innstant countries...');
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const countries = Array.isArray(content) ? content : Object.entries(content).map(([code, name]) => ({ code, name }));
  
  for (const country of countries) {
    try {
      const code = country.code || country.Code || country.iso;
      const name = country.name || country.Name || country.country_name;
      
      if (!code || !name) {
        result.skipped++;
        continue;
      }
      
      await pool.query(`
        INSERT INTO "Country" (code, name, "isActive", "createdAt")
        VALUES ($1, $2, true, NOW())
        ON CONFLICT (code) DO UPDATE SET name = $2
      `, [code.toUpperCase(), name]);
      
      result.imported++;
      
    } catch (error) {
      result.errors.push(`Country import: ${error.message}`);
    }
  }
  
  return result;
}

async function importInnstantCurrencies(): Promise<{ imported: number; skipped: number; errors: string[] }> {
  const result = { imported: 0, skipped: 0, errors: [] as string[] };
  
  const filePath = path.join(process.cwd(), 'innstant-currencies.json');
  if (!fs.existsSync(filePath)) {
    result.errors.push('innstant-currencies.json not found');
    return result;
  }
  
  console.log('\n📊 Importing Innstant currencies...');
  
  const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  const currencies = Array.isArray(content) ? content : Object.entries(content).map(([code, name]) => ({ code, name }));
  
  for (const currency of currencies) {
    try {
      const code = currency.code || currency.Code || currency.iso;
      const name = currency.name || currency.Name || currency.currency_name;
      const symbol = currency.symbol || currency.Symbol;
      
      if (!code || !name) {
        result.skipped++;
        continue;
      }
      
      await pool.query(`
        INSERT INTO "Currency" (code, name, symbol, "isActive", "createdAt", "updatedAt")
        VALUES ($1, $2, $3, true, NOW(), NOW())
        ON CONFLICT (code) DO UPDATE SET name = $2, symbol = COALESCE($3, "Currency".symbol)
      `, [code.toUpperCase(), name, symbol || null]);
      
      result.imported++;
      
    } catch (error) {
      result.errors.push(`Currency import: ${error.message}`);
    }
  }
  
  return result;
}

// ============================================
// MAIN
// ============================================

async function main() {
  const args = process.argv.slice(2);
  const analyzeOnly = args.includes('--analyze');
  const mishorOnly = args.includes('--mishor');
  const innstantOnly = args.includes('--innstant');
  const fullImport = !analyzeOnly && !mishorOnly && !innstantOnly;
  
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  HOTEL DATA CONSOLIDATION');
  console.log('═══════════════════════════════════════════════════════════════');
  console.log(`\n🗄️  Database: ${STATIC_DB_URL.replace(/:([^@]+)@/, ':***@')}\n`);
  
  try {
    // Test connection
    await pool.query('SELECT 1');
    console.log('✅ Database connected\n');
    
    // ANALYZE
    console.log('═══════════════════════════════════════════════════════════════');
    console.log('  DATA ANALYSIS');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    console.log('📁 Mishor CSV Files:');
    const mishorData = await analyzeMishorData();
    mishorData.forEach(d => {
      const status = d.status === 'found' ? '✅' : d.status === 'missing' ? '❌' : '📊';
      console.log(`   ${status} ${d.dataType.padEnd(20)} ${d.estimatedRecords.toLocaleString().padStart(10)} records (${d.fileCount} files)`);
    });
    
    console.log('\n📁 Innstant JSON Files:');
    const innstantData = await analyzeInnstantData();
    innstantData.forEach(d => {
      const status = d.status === 'found' ? '✅' : d.status === 'missing' ? '❌' : '📊';
      console.log(`   ${status} ${d.dataType.padEnd(20)} ${d.estimatedRecords.toLocaleString().padStart(10)} records`);
    });
    
    console.log('\n📊 Database Tables:');
    const dbData = await analyzeDatabaseData();
    dbData.forEach(d => {
      const status = d.status === 'imported' ? '✅' : d.status === 'empty' ? '⚠️ ' : '❌';
      console.log(`   ${status} ${d.dataType.padEnd(20)} ${d.estimatedRecords.toLocaleString().padStart(10)} records`);
    });
    
    if (analyzeOnly) {
      console.log('\n✅ Analysis complete. Run without --analyze to import data.\n');
      return;
    }
    
    // IMPORT
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  DATA IMPORT');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    if (fullImport || mishorOnly) {
      // Mishor Hotels
      const hotelsResult = await importMishorHotels();
      console.log(`\n   ✅ Hotels: ${hotelsResult.imported} imported, ${hotelsResult.skipped} skipped`);
      if (hotelsResult.errors.length > 0) {
        console.log(`   ⚠️  ${hotelsResult.errors.length} errors (showing first 5):`);
        hotelsResult.errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
      }
      
      // Mishor Images
      const imagesResult = await importMishorImages();
      console.log(`\n   ✅ Images: ${imagesResult.imported} imported, ${imagesResult.skipped} skipped`);
      if (imagesResult.errors.length > 0) {
        console.log(`   ⚠️  ${imagesResult.errors.length} errors (showing first 5):`);
        imagesResult.errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
      }
      
      // Mishor Facilities
      const facilitiesResult = await importMishorFacilities();
      console.log(`\n   ✅ Facilities: ${facilitiesResult.imported} imported, ${facilitiesResult.skipped} skipped`);
      if (facilitiesResult.errors.length > 0) {
        console.log(`   ⚠️  ${facilitiesResult.errors.length} errors (showing first 5):`);
        facilitiesResult.errors.slice(0, 5).forEach(e => console.log(`      - ${e}`));
      }
    }
    
    if (fullImport || innstantOnly) {
      // Innstant Countries
      const countriesResult = await importInnstantCountries();
      console.log(`\n   ✅ Countries: ${countriesResult.imported} imported, ${countriesResult.skipped} skipped`);
      
      // Innstant Currencies
      const currenciesResult = await importInnstantCurrencies();
      console.log(`\n   ✅ Currencies: ${currenciesResult.imported} imported, ${currenciesResult.skipped} skipped`);
    }
    
    // SUMMARY
    console.log('\n═══════════════════════════════════════════════════════════════');
    console.log('  CONSOLIDATION COMPLETE');
    console.log('═══════════════════════════════════════════════════════════════\n');
    
    // Show final counts
    const finalCounts = await analyzeDatabaseData();
    console.log('📊 Final database state:');
    finalCounts.forEach(d => {
      console.log(`   ${d.dataType.padEnd(20)} ${d.estimatedRecords.toLocaleString().padStart(10)}`);
    });
    
    console.log('\n✅ All hotel data consolidated into staticdatabase!\n');
    
  } catch (error) {
    console.error('\n❌ Consolidation failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();