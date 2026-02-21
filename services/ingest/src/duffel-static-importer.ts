/**
 * Duffel Static Data Importer
 * 
 * Imports static reference data from Duffel API to PostgreSQL:
 * - Airlines (with logo download)
 * - Aircraft
 * - Airports
 * - Cities
 * - Places (for suggestions)
 * - Air Loyalty Programmes
 * - Accommodation Loyalty Programmes
 * 
 * Usage: npx tsx src/duffel-static-importer.ts [--download-logos]
 */

import { prisma } from '@tripalfa/shared-database';
import * as fs from 'fs';
import * as path from 'path';

const DUFFEL_API_URL = 'https://api.duffel.com';
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN;
const DUFFEL_VERSION = 'v2';

// Logo storage path
const LOGO_DIR = process.env.LOGO_DIR || './static-logos';
// Download logos by default - use --skip-logos to disable
const DOWNLOAD_LOGOS = !process.argv.includes('--skip-logos');

// ============================================================================
// Duffel API Helper
// ============================================================================

interface DuffelResponse<T> {
  data: T;
  meta?: {
    after?: string;
    before?: string;
    limit?: number;
  };
}

async function duffelRequest<T>(endpoint: string, params?: Record<string, string>): Promise<DuffelResponse<T>> {
  const url = new URL(`${DUFFEL_API_URL}${endpoint}`);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.append(key, value);
    });
  }

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Duffel-Version': DUFFEL_VERSION,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Duffel API Error (${response.status}): ${errorText}`);
  }

  return response.json() as Promise<DuffelResponse<T>>;
}

// Paginated fetch with cursor
async function fetchAllPages<T>(endpoint: string, pageSize: number = 100): Promise<T[]> {
  const allData: T[] = [];
  let after: string | undefined;
  
  do {
    const params: Record<string, string> = { limit: String(pageSize) };
    if (after) params.after = after;
    
    console.log(`[Duffel] Fetching ${endpoint}... (after: ${after || 'start'})`);
    
    const response = await duffelRequest<T[]>(endpoint, params);
    allData.push(...response.data);
    
    after = response.meta?.after;
    
    console.log(`[Duffel] Fetched ${response.data.length} records, total: ${allData.length}`);
    
    // Rate limiting - be gentle with the API
    await new Promise(resolve => setTimeout(resolve, 200));
  } while (after);
  
  return allData;
}

// ============================================================================
// Logo Downloader
// ============================================================================

async function downloadLogo(url: string, iataCode: string, type: 'airline' | 'hotel'): Promise<string | null> {
  if (!DOWNLOAD_LOGOS || !url) return null;
  
  try {
    const dir = path.join(LOGO_DIR, type);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    const ext = url.includes('.svg') ? 'svg' : 'png';
    const filename = `${iataCode.toLowerCase()}.${ext}`;
    const filepath = path.join(dir, filename);
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to download: ${response.status}`);
    
    const buffer = await response.arrayBuffer();
    fs.writeFileSync(filepath, Buffer.from(buffer));
    
    console.log(`[Logo] Downloaded: ${filename}`);
    return `/static-logos/${type}/${filename}`;
  } catch (error) {
    console.error(`[Logo] Failed to download for ${iataCode}:`, error);
    return null;
  }
}

// ============================================================================
// Airlines Import
// ============================================================================

interface DuffelAirline {
  iata_code: string;
  icao_code?: string;
  name: string;
  logo_url?: string;
  logo_symbol_url?: string;
  average_flight_price?: number;
}

async function importAirlines(): Promise<number> {
  console.log('\n[Duffel] Starting Airlines import...');
  
  try {
    const airlines = await fetchAllPages<DuffelAirline>('/air/airlines');
    
    let imported = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    const errors: Array<{airline: string; reason: string}> = [];
    
    for (const airline of airlines) {
      // Skip if iata_code is missing/null/empty
      if (!airline.iata_code || typeof airline.iata_code !== 'string' || airline.iata_code.trim() === '') {
        skipped++;
        skipReasons['missing_iata_code'] = (skipReasons['missing_iata_code'] || 0) + 1;
        continue;
      }
      try {
        // Download logo if available
        let logoPath = airline.logo_url;
        if (DOWNLOAD_LOGOS && (airline.logo_url || airline.logo_symbol_url)) {
          const downloaded = await downloadLogo(
            airline.logo_symbol_url || airline.logo_url || '',
            airline.iata_code,
            'airline'
          );
          if (downloaded) logoPath = downloaded;
        }
        await prisma.airline.upsert({
          where: { iata_code: airline.iata_code },
          update: {
            name: airline.name,
            icao_code: airline.icao_code,
            logo_url: logoPath,
            logo_symbol_url: airline.logo_symbol_url,
            updatedAt: new Date(),
          },
          create: {
            iata_code: airline.iata_code,
            icao_code: airline.icao_code,
            name: airline.name,
            logo_url: logoPath,
            logo_symbol_url: airline.logo_symbol_url,
            is_active: true,
          },
        });
        imported++;
      } catch (error: any) {
        skipped++;
        const reason = error?.message?.includes('Unique constraint') ? 'duplicate_constraint' : 'database_error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
        errors.push({airline: airline.iata_code, reason: error?.message || String(error)});
      }
    }
    
    console.log(`[Duffel] ✅ Imported ${imported}/${airlines.length} airlines`);
    if (skipped > 0) {
      console.log(`[Duffel] ⚠️  Skipped ${skipped} airlines:`, skipReasons);
      if (errors.length > 0 && errors.length <= 5) {
        console.log('[Duffel] Error details (first 5):', errors);
      }
    }
    return imported;
  } catch (error) {
    console.error('[Duffel] Airlines import failed:', error);
    return 0;
  }
}

// ============================================================================
// Aircraft Import
// ============================================================================

interface DuffelAircraft {
  iata_code: string;
  name: string;
  engine_count?: number;
  engine_type?: string;
  id: string;
}

async function importAircraft(): Promise<number> {
  console.log('\n[Duffel] Starting Aircraft import...');
  
  try {
    const aircraft = await fetchAllPages<DuffelAircraft>('/air/aircraft');
    
    let imported = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    
    for (const plane of aircraft) {
      // Skip if iata_code is missing
      if (!plane.iata_code || typeof plane.iata_code !== 'string' || plane.iata_code.trim() === '') {
        skipped++;
        skipReasons['missing_iata_code'] = (skipReasons['missing_iata_code'] || 0) + 1;
        continue;
      }
      try {
        await prisma.aircraft.upsert({
          where: { iata_code: plane.iata_code },
          update: {
            name: plane.name,
            engine_count: plane.engine_count,
            engine_type: plane.engine_type,
            updatedAt: new Date(),
          },
          create: {
            iata_code: plane.iata_code,
            name: plane.name,
            engine_count: plane.engine_count,
            engine_type: plane.engine_type,
            is_active: true,
          },
        });
        imported++;
      } catch (error: any) {
        skipped++;
        const reason = error?.message?.includes('Unique constraint') ? 'duplicate_constraint' : 'database_error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }
    
    console.log(`[Duffel] ✅ Imported ${imported}/${aircraft.length} aircraft`);
    if (skipped > 0) {
      console.log(`[Duffel] ⚠️  Skipped ${skipped} aircraft:`, skipReasons);
    }
    return imported;
  } catch (error) {
    console.error('[Duffel] Aircraft import failed:', error);
    return 0;
  }
}

// ============================================================================
// Airports Import
// ============================================================================

interface DuffelAirport {
  iata_code: string;
  icao_code?: string;
  name: string;
  city_name?: string;
  city?: { name: string; iata_code: string };
  country?: { name: string; iso_country_code: string };
  latitude?: number;
  longitude?: number;
  time_zone?: string;
}

async function importAirports(): Promise<number> {
  console.log('\n[Duffel] Starting Airports import...');
  
  try {
    const airports = await fetchAllPages<DuffelAirport>('/air/airports');
    
    let imported = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    
    for (const airport of airports) {
      // Skip if iata_code is missing
      if (!airport.iata_code || typeof airport.iata_code !== 'string' || airport.iata_code.trim() === '') {
        skipped++;
        skipReasons['missing_iata_code'] = (skipReasons['missing_iata_code'] || 0) + 1;
        continue;
      }
      try {
        await prisma.airport.upsert({
          where: { iata_code: airport.iata_code },
          update: {
            name: airport.name,
            icao_code: airport.icao_code,
            city: airport.city_name || airport.city?.name,
            city_code: airport.city?.iata_code,
            country: airport.country?.name,
            country_code: airport.country?.iso_country_code,
            latitude: airport.latitude,
            longitude: airport.longitude,
            timezone: airport.time_zone,
            updatedAt: new Date(),
          },
          create: {
            iata_code: airport.iata_code,
            icao_code: airport.icao_code,
            name: airport.name,
            city: airport.city_name || airport.city?.name,
            city_code: airport.city?.iata_code,
            country: airport.country?.name,
            country_code: airport.country?.iso_country_code,
            latitude: airport.latitude,
            longitude: airport.longitude,
            timezone: airport.time_zone,
            is_active: true,
          },
        });
        imported++;
      } catch (error: any) {
        skipped++;
        const reason = error?.message?.includes('Unique constraint') ? 'duplicate_icao_code' : 'database_error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }
    
    console.log(`[Duffel] ✅ Imported ${imported}/${airports.length} airports`);
    if (skipped > 0) {
      console.log(`[Duffel] ⚠️  Skipped ${skipped} airports:`, skipReasons);
    }
    return imported;
  } catch (error) {
    console.error('[Duffel] Airports import failed:', error);
    return 0;
  }
}

// ============================================================================
// Cities Import
// ============================================================================

interface DuffelCity {
  iata_code: string;
  name: string;
  country?: { name: string; iso_country_code: string };
  airports?: { iata_code: string; name: string }[];
}

async function importCities(): Promise<number> {
  console.log('\n[Duffel] Starting Cities import...');
  
  try {
    const cities = await fetchAllPages<DuffelCity>('/air/cities');
    
    let imported = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    
    for (const city of cities) {
      // Skip if iata_code is missing
      if (!city.iata_code || typeof city.iata_code !== 'string' || city.iata_code.trim() === '') {
        skipped++;
        skipReasons['missing_iata_code'] = (skipReasons['missing_iata_code'] || 0) + 1;
        continue;
      }
      try {
        await prisma.city.upsert({
          where: { iata_code: city.iata_code },
          update: {
            name: city.name,
            country: city.country?.name,
            country_code: city.country?.iso_country_code,
            updatedAt: new Date(),
          },
          create: {
            iata_code: city.iata_code,
            name: city.name,
            country: city.country?.name,
            country_code: city.country?.iso_country_code,
            is_active: true,
          },
        });
        imported++;
      } catch (error: any) {
        skipped++;
        const reason = error?.message?.includes('Unique constraint') ? 'duplicate_constraint' : 'database_error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }
    
    console.log(`[Duffel] ✅ Imported ${imported}/${cities.length} cities`);
    if (skipped > 0) {
      console.log(`[Duffel] ⚠️  Skipped ${skipped} cities:`, skipReasons);
    }
    return imported;
  } catch (error) {
    console.error('[Duffel] Cities import failed:', error);
    return 0;
  }
}

// ============================================================================
// Air Loyalty Programmes Import
// ============================================================================

interface DuffelLoyaltyProgramme {
  id: string;
  name: string;
  owner_airline_id?: string;
  alliance?: string;
  logo_url?: string;
}

// Cache to map Duffel airline IDs to IATA codes
const airlineIdCache: Map<string, string> = new Map();

async function getAirlineIATAFromDuffelId(duffelAirlineId: string): Promise<string | null> {
  if (airlineIdCache.has(duffelAirlineId)) {
    return airlineIdCache.get(duffelAirlineId) || null;
  }
  
  try {
    const response = await duffelRequest<any>(`/air/airlines/${duffelAirlineId}`);
    const airline = response.data;
    if (airline?.iata_code) {
      airlineIdCache.set(duffelAirlineId, airline.iata_code);
      return airline.iata_code;
    }
  } catch (error) {
    // Airline not found or error fetching
  }
  
  airlineIdCache.set(duffelAirlineId, '');
  return null;
}

async function importAirLoyaltyProgrammes(): Promise<number> {
  console.log('\n[Duffel] Starting Air Loyalty Programmes import...');
  
  try {
    const programmes = await fetchAllPages<DuffelLoyaltyProgramme>('/air/loyalty_programmes');
    
    // Log first 2 records to understand API response structure
    if (programmes.length > 0) {
      console.log('[Duffel] Sample loyalty programme data (first 2):');
      console.log(JSON.stringify(programmes.slice(0, 2), null, 2));
    }
    
    let imported = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    
    for (const prog of programmes) {
      // Skip if missing required unique key (prog.id)
      if (!prog.id || typeof prog.id !== 'string' || prog.id.trim() === '') {
        skipped++;
        skipReasons['missing_programme_id'] = (skipReasons['missing_programme_id'] || 0) + 1;
        continue;
      }
      
      // Get airline IATA code from owner_airline_id
      let providerCode: string | null = null;
      if (prog.owner_airline_id) {
        providerCode = await getAirlineIATAFromDuffelId(prog.owner_airline_id);
      }
      
      if (!providerCode) {
        skipped++;
        skipReasons['missing_or_unmapped_airline'] = (skipReasons['missing_or_unmapped_airline'] || 0) + 1;
        continue;
      }
      
      try {
        await prisma.loyaltyProgram.upsert({
          where: { code: prog.id },
          update: {
            name: prog.name,
            program_type: 'airline',
            provider_code: providerCode,
            logo_url: prog.logo_url,
            updatedAt: new Date(),
          },
          create: {
            code: prog.id,
            name: prog.name,
            program_type: 'airline',
            provider_code: providerCode,
            logo_url: prog.logo_url,
            cashbackRate: 0,
            is_active: true,
          },
        });
        imported++;
      } catch (error: any) {
        skipped++;
        const reason = error?.message?.includes('Unique constraint') ? 'duplicate_code' : 'database_error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }
    
    console.log(`[Duffel] ✅ Imported ${imported}/${programmes.length} air loyalty programmes`);
    if (skipped > 0) {
      console.log(`[Duffel] ⚠️  Skipped ${skipped} air loyalty programmes:`, skipReasons);
    }
    return imported;
  } catch (error) {
    console.error('[Duffel] Air Loyalty Programmes import failed:', error);
    return 0;
  }
}

// ============================================================================
// Accommodation Loyalty Programmes Import
// ============================================================================

interface DuffelAccommodationLoyaltyProgramme {
  id: string;
  name: string;
  logo_url?: string;
}

async function importAccommodationLoyaltyProgrammes(): Promise<number> {
  console.log('\n[Duffel] Starting Accommodation Loyalty Programmes import...');
  
  try {
    const programmes = await fetchAllPages<DuffelAccommodationLoyaltyProgramme>('/accommodation/loyalty_programmes');
    
    let imported = 0;
    let skipped = 0;
    const skipReasons: Record<string, number> = {};
    
    for (const prog of programmes) {
      // Skip if missing programme ID
      if (!prog.id || typeof prog.id !== 'string' || prog.id.trim() === '') {
        skipped++;
        skipReasons['missing_programme_id'] = (skipReasons['missing_programme_id'] || 0) + 1;
        continue;
      }
      try {
        // Download logo if available
        let logoPath = prog.logo_url;
        if (DOWNLOAD_LOGOS && prog.logo_url) {
          const downloaded = await downloadLogo(prog.logo_url, prog.id, 'hotel');
          if (downloaded) logoPath = downloaded;
        }
        
        await prisma.loyaltyProgram.upsert({
          where: { code: prog.id },
          update: {
            name: prog.name,
            logo_url: logoPath,
            program_type: 'hotel',
            updatedAt: new Date(),
          },
          create: {
            code: prog.id,
            name: prog.name,
            logo_url: logoPath,
            program_type: 'hotel',
            cashbackRate: 0,
            is_active: true,
          },
        });
        imported++;
      } catch (error: any) {
        skipped++;
        const reason = error?.message?.includes('Unique constraint') ? 'duplicate_code' : 'database_error';
        skipReasons[reason] = (skipReasons[reason] || 0) + 1;
      }
    }
    
    console.log(`[Duffel] ✅ Imported ${imported}/${programmes.length} accommodation loyalty programmes`);
    if (skipped > 0) {
      console.log(`[Duffel] ⚠️  Skipped ${skipped} accommodation loyalty programmes:`, skipReasons);
    }
    return imported;
  } catch (error: any) {
    if (error?.message?.includes('404')) {
      console.warn('[Duffel] Accommodation loyalty programmes endpoint not available (404) - skipping');
      return 0;
    }
    console.error('[Duffel] Accommodation Loyalty Programmes import failed:', error?.message || error);
    return 0;
  }
}

// ============================================================================
// Main Import Runner
// ============================================================================

async function main() {
  console.log('========================================');
  console.log('Duffel Static Data Importer');
  console.log('========================================');
  console.log(`Start Time: ${new Date().toISOString()}`);
  console.log(`Download Logos: ${DOWNLOAD_LOGOS}`);
  console.log('');
  
  const results = {
    airlines: 0,
    aircraft: 0,
    airports: 0,
    cities: 0,
    airLoyalty: 0,
    hotelLoyalty: 0,
  };
  
  try {
    results.airlines = await importAirlines();
    results.aircraft = await importAircraft();
    results.airports = await importAirports();
    results.cities = await importCities();
    results.airLoyalty = await importAirLoyaltyProgrammes();
    results.hotelLoyalty = await importAccommodationLoyaltyProgrammes();
    
    console.log('\n========================================');
    console.log('IMPORT SUMMARY');
    console.log('========================================');
    console.log(`Airlines:                        ${results.airlines}`);
    console.log(`Aircraft:                        ${results.aircraft}`);
    console.log(`Airports:                        ${results.airports}`);
    console.log(`Cities:                          ${results.cities}`);
    console.log(`Air Loyalty Programmes:          ${results.airLoyalty}`);
    console.log(`Accommodation Loyalty Programmes: ${results.hotelLoyalty}`);
    console.log(`Total:                           ${Object.values(results).reduce((a, b) => a + b, 0)}`);
    console.log('========================================');
    
  } catch (error) {
    console.error('[Duffel] Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// CLI entry point
if (require.main === module) {
  main()
    .then(() => {
      console.log('\n[Duffel] Import completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n[Duffel] Import failed:', error);
      process.exit(1);
    });
}

export {
  importAirlines,
  importAircraft,
  importAirports,
  importCities,
  importAirLoyaltyProgrammes,
  importAccommodationLoyaltyProgrammes,
};