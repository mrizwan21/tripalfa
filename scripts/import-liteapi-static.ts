#!/usr/bin/env node
/**
 * LiteAPI Static Data Importer
 * 
 * Imports countries, cities, currencies, IATA codes, hotel facilities,
 * hotel types, hotel chains, and languages from LiteAPI into the 
 * canonical database structure.
 * 
 * Usage: 
 *   npx tsx scripts/import-liteapi-static.ts --type=countries
 *   npx tsx scripts/import-liteapi-static.ts --type=currencies
 *   npx tsx scripts/import-liteapi-static.ts --type=all
 * 
 * LiteAPI Endpoints:
 * - GET /v3.0/data/countries - List of all countries
 * - GET /v3.0/data/cities?countryCode=XX - Cities in a country
 * - GET /v3.0/data/currencies - Supported currencies
 * - GET /v3.0/data/iataCodes - IATA codes for airports and cities
 * - GET /v3.0/data/facilities - Hotel facilities
 * - GET /v3.0/data/hotelTypes - Hotel types
 * - GET /v3.0/data/chains - Hotel chains
 * - GET /v3.0/data/languages - Supported languages
 */

import * as fs from 'fs';
import * as path from 'path';
import * as dotenv from 'dotenv';
import axios from 'axios';

// Load environment variables
const envPath = path.resolve(process.cwd(), '.env.services');
if (fs.existsSync(envPath)) {
  dotenv.config({ path: envPath });
}

import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// LiteAPI Configuration
// Ensure the base URL includes the version prefix
const rawBaseUrl = process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0';
const LITEAPI_BASE_URL = rawBaseUrl.endsWith('/v3.0') 
  ? rawBaseUrl 
  : `${rawBaseUrl.replace(/\/$/, '')}/v3.0`;
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || '';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  skipped: number;
  failed: number;
}

// ============================================
// LiteAPI Data Types
// ============================================

interface LiteAPICountry {
  countryCode: string;
  name: string;
  currencyCode?: string;
  currencyName?: string;
  phoneCode?: string;
  timeZone?: string;
}

interface LiteAPICity {
  city: string;
  // Some cities might have additional fields
  iataCode?: string;
  name?: string;
  countryCode?: string;
  countryName?: string;
  latitude?: number;
  longitude?: number;
}

interface LiteAPICurrency {
  code: string;
  name: string;
  symbol?: string;
}

interface LiteAPIIATACode {
  iataCode: string;
  name: string;
  type: 'airport' | 'city' | 'country';
  countryCode?: string;
  countryName?: string;
  cityCode?: string;
  latitude?: number;
  longitude?: number;
}

interface LiteAPIFacility {
  facility_id: number;
  facility: string;
  sort?: number;
  translation?: Array<{ lang: string; facility: string }>;
}

interface LiteAPIHotelType {
  id: number;
  name: string;
}

interface LiteAPIChain {
  id: number;
  name: string;
}

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

interface LiteAPIReview {
  id?: string;
  hotelId?: string;
  // LiteAPI actual fields
  name?: string;           // Author name
  country?: string;        // Author country (e.g., "us")
  type?: string;           // Traveler type (e.g., "solo_traveller")
  averageScore?: number;   // Rating (1-10)
  headline?: string;       // Review title
  pros?: string;           // Positive review text
  cons?: string;           // Negative review text
  date?: string;           // Review date
  language?: string;       // Language code
  source?: string;         // Review source (e.g., "Nuitee")
}

interface LiteAPILanguage {
  code: string;
  name: string;
  nativeName?: string;
}

// ============================================
// API Helper Functions
// ============================================

interface LiteAPIResponse<T> {
  data?: T;
  status?: string;
  message?: string;
}

async function fetchLiteAPI<T>(endpoint: string, params?: Record<string, string>): Promise<T> {
  const url = `${LITEAPI_BASE_URL}${endpoint}`;
  
  console.log(`   Fetching: ${url}`);
  
  const response = await axios.get<LiteAPIResponse<T> | T>(url, {
    headers: {
      'X-API-Key': LITEAPI_API_KEY,
      'Accept': 'application/json',
    },
    params,
    timeout: 120000,
  });
  
  // LiteAPI wraps responses in a `data` property
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as T;
  }
  
  // If not wrapped, return as-is
  return data as T;
}

// ============================================
// Import Functions
// ============================================

async function importCountries(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching countries from LiteAPI...');

  try {
    const countries = await fetchLiteAPI<LiteAPICountry[]>('/data/countries');
    result.total = countries.length;

    console.log(`   Fetched ${countries.length} countries`);
    
    // Debug: log first country to see structure
    if (countries.length > 0) {
      console.log('   Sample country data:', JSON.stringify(countries[0], null, 2));
    }

    for (const country of countries) {
      try {
        // Skip if no valid country code
        const code = country.countryCode || (country as any).code || (country as any).id;
        if (!code) {
          console.log('   Skipping country with no code:', JSON.stringify(country));
          result.skipped++;
          continue;
        }

        const existing = await prisma.destination.findUnique({
          where: { code },
        });

        if (existing) {
          await prisma.destination.update({
            where: { id: existing.id },
            data: {
              name: country.name,
              nameNormalized: country.name?.toLowerCase(),
              destinationType: 'country',
              level: 0,
              countryCode: country.countryCode,
              countryName: country.name,
              iataCountryCode: country.countryCode,
              timezone: country.timeZone,
            },
          });
          result.updated++;
        } else {
          await prisma.destination.create({
            data: {
              code: country.countryCode,
              name: country.name,
              nameNormalized: country.name?.toLowerCase(),
              destinationType: 'country',
              level: 0,
              countryCode: country.countryCode,
              countryName: country.name,
              iataCountryCode: country.countryCode,
              timezone: country.timeZone,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
        console.error(`   Error processing country ${country.countryCode}:`, error);
      }
    }

    console.log(`   ✅ Countries: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching countries:', error);
    throw error;
  }

  return result;
}

async function importCities(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching cities from LiteAPI...');
  console.log('   Note: LiteAPI cities endpoint only returns city names without IATA codes.');
  console.log('   Cities will be stored with generated codes for reference.');

  try {
    const countries = await fetchLiteAPI<LiteAPICountry[]>('/data/countries');
    
    // Process countries in batches to avoid too many API calls
    const batchSize = 10;
    const countryList = countries.filter(c => c.countryCode || (c as any).code);
    
    for (let i = 0; i < countryList.length; i += batchSize) {
      const batch = countryList.slice(i, i + batchSize);
      
      for (const country of batch) {
        try {
          // Get the country code from various possible field names
          const countryCode = country.countryCode || (country as any).code || (country as any).id;
          if (!countryCode) {
            continue;
          }
          
          const cities = await fetchLiteAPI<LiteAPICity[]>('/data/cities', { 
            countryCode 
          });
          
          result.total += cities.length;
          
          if (cities.length > 0) {
            console.log(`   Fetched ${cities.length} cities for ${countryCode} (${country.name})`);
          }

          for (const city of cities) {
            try {
              // LiteAPI only returns city name in the `city` field
              const cityName = city.city || city.name;
              if (!cityName || cityName.trim() === '') {
                result.skipped++;
                continue;
              }

              // Generate a unique code for the city
              const cityCode = `CITY_${countryCode}_${cityName.replace(/[^a-zA-Z0-9]/g, '_').toUpperCase().substring(0, 50)}`;
              
              // Check if city already exists
              const existingCity = await prisma.destination.findFirst({
                where: {
                  name: cityName,
                  countryCode: countryCode,
                  destinationType: 'city',
                },
              });

              if (existingCity) {
                result.skipped++;
                continue;
              }

              // Create new city entry
              await prisma.destination.create({
                data: {
                  code: cityCode,
                  name: cityName,
                  nameNormalized: cityName.toLowerCase(),
                  destinationType: 'city',
                  level: 2,
                  countryCode: countryCode,
                  countryName: country.name,
                },
              });
              result.created++;
            } catch (error) {
              result.failed++;
            }
          }
        } catch (error) {
          console.error(`   Error fetching cities for ${country.countryCode}:`, error);
        }
      }
      
      // Log progress
      if (i + batchSize < countryList.length) {
        console.log(`   Progress: ${Math.min(i + batchSize, countryList.length)}/${countryList.length} countries processed`);
      }
    }

    console.log(`   ✅ Cities: ${result.created} created, ${result.updated} updated, ${result.skipped} skipped, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching cities:', error);
    throw error;
  }

  return result;
}

async function importCurrencies(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching currencies from LiteAPI...');

  try {
    const currencies = await fetchLiteAPI<LiteAPICurrency[]>('/data/currencies');
    result.total = currencies.length;

    console.log(`   Fetched ${currencies.length} currencies`);

    for (const currency of currencies) {
      try {
        const existing = await prisma.currency.findUnique({
          where: { code: currency.code },
        });

        if (existing) {
          await prisma.currency.update({
            where: { code: currency.code },
            data: {
              name: currency.name,
              symbol: currency.symbol || currency.code,
            },
          });
          result.updated++;
        } else {
          await prisma.currency.create({
            data: {
              code: currency.code,
              name: currency.name,
              symbol: currency.symbol || currency.code,
              isActive: true,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
        console.error(`   Error processing currency ${currency.code}:`, error);
      }
    }

    console.log(`   ✅ Currencies: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching currencies:', error);
    throw error;
  }

  return result;
}

async function importIATACodes(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching IATA codes from LiteAPI...');

  try {
    const iataCodes = await fetchLiteAPI<LiteAPIIATACode[]>('/data/iataCodes');
    result.total = iataCodes.length;

    console.log(`   Fetched ${iataCodes.length} IATA codes`);

    for (const iataCode of iataCodes) {
      try {
        if (iataCode.type === 'airport') {
          const existing = await prisma.airport.findUnique({
            where: { iata_code: iataCode.iataCode },
          });

          if (existing) {
            await prisma.airport.update({
              where: { iata_code: iataCode.iataCode },
              data: {
                name: iataCode.name,
                city_code: iataCode.cityCode,
                country_code: iataCode.countryCode,
                country: iataCode.countryName,
                latitude: iataCode.latitude,
                longitude: iataCode.longitude,
              },
            });
            result.updated++;
          } else {
            await prisma.airport.create({
              data: {
                iata_code: iataCode.iataCode,
                name: iataCode.name,
                city_code: iataCode.cityCode,
                country_code: iataCode.countryCode,
                country: iataCode.countryName,
                latitude: iataCode.latitude,
                longitude: iataCode.longitude,
                is_active: true,
              },
            });
            result.created++;
          }
        } else if (iataCode.type === 'city') {
          const existingCity = await prisma.city.findUnique({
            where: { iata_code: iataCode.iataCode },
          });

          if (existingCity) {
            await prisma.city.update({
              where: { iata_code: iataCode.iataCode },
              data: {
                name: iataCode.name,
                country_code: iataCode.countryCode,
                country: iataCode.countryName,
                latitude: iataCode.latitude,
                longitude: iataCode.longitude,
              },
            });
            result.updated++;
          } else {
            await prisma.city.create({
              data: {
                iata_code: iataCode.iataCode,
                name: iataCode.name,
                country_code: iataCode.countryCode,
                country: iataCode.countryName,
                latitude: iataCode.latitude,
                longitude: iataCode.longitude,
                is_active: true,
              },
            });
            result.created++;
          }
        }
      } catch (error) {
        result.failed++;
      }
    }

    console.log(`   ✅ IATA Codes: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching IATA codes:', error);
    throw error;
  }

  return result;
}

async function importFacilities(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching hotel facilities from LiteAPI...');

  try {
    const facilities = await fetchLiteAPI<LiteAPIFacility[]>('/data/facilities');
    result.total = facilities.length;

    console.log(`   Fetched ${facilities.length} facilities`);
    
    // Debug: log first facility to see structure
    if (facilities.length > 0) {
      console.log('   Sample facility data:', JSON.stringify(facilities[0], null, 2));
    }

    for (const facility of facilities) {
      try {
        // LiteAPI uses facility_id and facility instead of code and name
        const code = `FAC_${facility.facility_id}`;
        const name = facility.facility;
        
        if (!code || !name) {
          result.skipped++;
          continue;
        }

        // Build nameLocalized from translations
        const nameLocalized: Record<string, string> = { en: name };
        if (facility.translation && Array.isArray(facility.translation)) {
          for (const t of facility.translation) {
            if (t.lang && t.facility) {
              nameLocalized[t.lang] = t.facility;
            }
          }
        }

        const existing = await prisma.hotelAmenity.findUnique({
          where: { code },
        });

        if (existing) {
          await prisma.hotelAmenity.update({
            where: { code },
            data: {
              name,
              nameLocalized,
              sortOrder: facility.sort || 0,
            },
          });
          result.updated++;
        } else {
          await prisma.hotelAmenity.create({
            data: {
              code,
              name,
              nameLocalized,
              category: 'General', // LiteAPI doesn't provide category
              sortOrder: facility.sort || 0,
              isActive: true,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
      }
    }

    console.log(`   ✅ Facilities: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching facilities:', error);
    throw error;
  }

  return result;
}

async function importHotelTypes(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching hotel types from LiteAPI...');

  try {
    const hotelTypes = await fetchLiteAPI<LiteAPIHotelType[]>('/data/hotelTypes');
    result.total = hotelTypes.length;

    console.log(`   Fetched ${hotelTypes.length} hotel types`);

    for (const hotelType of hotelTypes) {
      try {
        if (!hotelType.id && hotelType.id !== 0) {
          result.skipped++;
          continue;
        }

        // Use upsert to handle existing records with unique name constraint
        await prisma.hotelType.upsert({
          where: { externalId: hotelType.id },
          update: {
            name: hotelType.name,
            nameNormalized: hotelType.name?.toLowerCase(),
          },
          create: {
            externalId: hotelType.id,
            name: hotelType.name,
            nameNormalized: hotelType.name?.toLowerCase(),
            isActive: true,
          },
        });
        result.created++;
      } catch (error: any) {
        result.failed++;
        // If it's a unique constraint error on name, try update instead
        if (error.code === 'P2002' && error.meta?.modelName === 'HotelType') {
          try {
            // Find by name and update
            await prisma.hotelType.updateMany({
              where: { name: hotelType.name },
              data: {
                externalId: hotelType.id,
                nameNormalized: hotelType.name?.toLowerCase(),
              },
            });
            result.updated++;
            result.failed--;
          } catch (updateError) {
            console.error(`   Error updating hotel type ${hotelType.id} (${hotelType.name}):`, updateError);
          }
        } else {
          console.error(`   Error processing hotel type ${hotelType.id} (${hotelType.name}):`, error);
        }
      }
    }

    console.log(`   ✅ Hotel Types: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching hotel types:', error);
    throw error;
  }

  return result;
}

async function importHotelChains(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching hotel chains from LiteAPI...');

  try {
    const chains = await fetchLiteAPI<LiteAPIChain[]>('/data/chains');
    result.total = chains.length;

    console.log(`   Fetched ${chains.length} hotel chains`);

    for (const chain of chains) {
      try {
        if (!chain.id && chain.id !== 0) {
          result.skipped++;
          continue;
        }

        const existing = await prisma.hotelChain.findUnique({
          where: { externalId: chain.id },
        });

        if (existing) {
          await prisma.hotelChain.update({
            where: { externalId: chain.id },
            data: {
              name: chain.name,
              nameNormalized: chain.name?.toLowerCase(),
            },
          });
          result.updated++;
        } else {
          await prisma.hotelChain.create({
            data: {
              externalId: chain.id,
              name: chain.name,
              nameNormalized: chain.name?.toLowerCase(),
              isActive: true,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
      }
    }

    console.log(`   ✅ Hotel Chains: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching hotel chains:', error);
    throw error;
  }

  return result;
}

async function importHotels(countryCode?: string, limit?: number): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching hotels from LiteAPI...');
  console.log('   Note: Hotels require countryCode or other filter parameters.');

  try {
    // Build params
    const params: Record<string, string> = {};
    if (countryCode) params.countryCode = countryCode;
    if (limit) params.limit = String(limit);

    // If no country code specified, get countries and iterate
    if (!countryCode) {
      console.log('   No countryCode specified. Importing hotels for all countries...');
      const countries = await fetchLiteAPI<LiteAPICountry[]>('/data/countries');
      
      // Process ALL countries (no limit for full import)
      const countriesToProcess = countries.filter(c => c.countryCode || (c as any).code);
      
      console.log(`   Found ${countriesToProcess.length} countries to process`);
      
      for (let i = 0; i < countriesToProcess.length; i++) {
        const country = countriesToProcess[i];
        const code = country.countryCode || (country as any).code;
        if (!code) continue;
        
        console.log(`   [${i + 1}/${countriesToProcess.length}] Processing hotels for ${code} (${country.name})...`);
        const countryResult = await importHotelsForCountry(code, limit);
        result.total += countryResult.total;
        result.created += countryResult.created;
        result.updated += countryResult.updated;
        result.skipped += countryResult.skipped;
        result.failed += countryResult.failed;
        
        // Log progress every 10 countries
        if ((i + 1) % 10 === 0) {
          console.log(`   Progress: ${i + 1}/${countriesToProcess.length} countries, ${result.created} hotels created so far`);
        }
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
  } catch (error) {
    console.error('   ❌ Error fetching hotels:', error);
    throw error;
  }

  return result;
}

const PAGE_SIZE = 200; // LiteAPI max page size

async function importHotelsForCountry(countryCode: string, limit?: number): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  // Get the supplier ID from the database
  const supplier = await prisma.supplier.findUnique({
    where: { code: 'liteapi' },
  });
  
  if (!supplier) {
    console.error('   ERROR: Supplier "liteapi" not found. Please run import for other data types first.');
    return result;
  }

  try {
    let offset = 0;
    let totalFetched = 0;
    let hasMore = true;
    const maxHotels = limit || 100000; // Default to large number if no limit

    while (hasMore && totalFetched < maxHotels) {
      const params: Record<string, string> = { 
        countryCode,
        limit: String(Math.min(PAGE_SIZE, maxHotels - totalFetched)),
        offset: String(offset)
      };

      const url = `${LITEAPI_BASE_URL}/data/hotels`;
      
      const response = await axios.get(url, {
        headers: {
          'X-API-Key': LITEAPI_API_KEY,
          'Accept': 'application/json',
        },
        params,
        timeout: 120000,
      });
      
      const data = response.data;
      const hotels = Array.isArray(data) ? data : data.data || [];
      const total = data.total || hotels.length;

      if (offset === 0) {
        console.log(`   Total hotels available for ${countryCode}: ${total}`);
      }

      if (hotels.length === 0) {
        hasMore = false;
        break;
      }

      result.total += hotels.length;
      totalFetched += hotels.length;

      for (const hotel of hotels) {
        try {
          if (!hotel.id) {
            result.skipped++;
            continue;
          }

          // Check if hotel already exists via supplier mapping
          const existingMapping = await prisma.supplierHotelMapping.findUnique({
            where: {
              supplierId_supplierHotelId: {
                supplierId: supplier.id,
                supplierHotelId: hotel.id,
              },
            },
            include: { canonicalHotel: true },
          });

          if (existingMapping) {
            // Update existing hotel
            await prisma.canonicalHotel.update({
              where: { id: existingMapping.canonicalHotelId },
              data: {
                name: hotel.name,
                nameNormalized: hotel.name?.toLowerCase(),
                description: hotel.hotelDescription,
                city: hotel.city || '',
                countryCode: hotel.country?.toUpperCase() || '',
                country: hotel.country?.toUpperCase() || '',
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                starRating: hotel.stars || null,
                chainName: hotel.chain !== 'Not Available' ? hotel.chain : null,
                metadata: {
                  mainPhoto: hotel.main_photo,
                  thumbnail: hotel.thumbnail,
                  rating: hotel.rating,
                  reviewCount: hotel.reviewCount,
                  facilityIds: hotel.facilityIds,
                  hotelTypeId: hotel.hotelTypeId,
                },
              },
            });
            result.updated++;
          } else {
            // Create new canonical hotel
            const canonicalCode = `LITE_${hotel.id}`;
            
            const canonicalHotel = await prisma.canonicalHotel.create({
              data: {
                canonicalCode,
                name: hotel.name,
                nameNormalized: hotel.name?.toLowerCase(),
                description: hotel.hotelDescription,
                city: hotel.city || '',
                countryCode: hotel.country?.toUpperCase() || '',
                country: hotel.country?.toUpperCase() || '',
                latitude: hotel.latitude,
                longitude: hotel.longitude,
                starRating: hotel.stars || null,
                chainName: hotel.chain !== 'Not Available' ? hotel.chain : null,
                status: hotel.deletedAt ? 'inactive' : 'active',
                metadata: {
                  mainPhoto: hotel.main_photo,
                  thumbnail: hotel.thumbnail,
                  rating: hotel.rating,
                  reviewCount: hotel.reviewCount,
                  facilityIds: hotel.facilityIds,
                  hotelTypeId: hotel.hotelTypeId,
                },
              },
            });

            // Create supplier mapping
            await prisma.supplierHotelMapping.create({
              data: {
                canonicalHotelId: canonicalHotel.id,
                supplierId: supplier.id,
                supplierHotelId: hotel.id,
                matchType: 'auto',
                syncStatus: 'synced',
                lastSyncedAt: new Date(),
                supplierData: hotel as any,
                isActive: !hotel.deletedAt,
              },
            });

            result.created++;
          }
        } catch (error: any) {
          result.failed++;
        }
      }

      // Move to next page
      offset += hotels.length;
      
      // Check if we've fetched all hotels
      if (hotels.length < PAGE_SIZE) {
        hasMore = false;
      }
      
      // Log progress every 1000 hotels
      if (totalFetched % 1000 < PAGE_SIZE) {
        console.log(`   Progress: ${totalFetched} hotels processed for ${countryCode}`);
      }
      
      // Small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 50));
    }
    
    console.log(`   Completed ${countryCode}: ${result.created} created, ${result.updated} updated`);
  } catch (error) {
    console.error(`   Error fetching hotels for ${countryCode}:`, error);
  }

  return result;
}

async function importHotelReviews(hotelId?: string, importAll: boolean = false): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching hotel reviews from LiteAPI...');
  console.log('   Note: Reviews require a hotelId parameter.');

  try {
    if (!hotelId && !importAll) {
      console.log('   No hotelId specified. Skipping reviews import.');
      console.log('   Usage: npx tsx scripts/import-liteapi-static.ts --type=reviews --hotelId=lp123456');
      console.log('   Or use --all to import reviews for all hotels: --type=reviews --all');
      result.skipped = 0;
      return result;
    }

    // If importAll is true, get all hotels with supplier mappings
    if (importAll) {
      console.log('   Importing reviews for ALL hotels in the database...');
      
      // Get the supplier
      const supplier = await prisma.supplier.findUnique({
        where: { code: 'liteapi' },
      });
      
      if (!supplier) {
        console.error('   ERROR: Supplier "liteapi" not found. Please run import for other data types first.');
        return result;
      }

      // Get all hotel mappings for LiteAPI
      const hotelMappings = await prisma.supplierHotelMapping.findMany({
        where: {
          supplierId: supplier.id,
          isActive: true,
        },
        select: {
          supplierHotelId: true,
          canonicalHotelId: true,
        },
      });

      console.log(`   Found ${hotelMappings.length} hotels to process for reviews`);
      
      let processed = 0;
      const batchSize = 10;
      
      for (let i = 0; i < hotelMappings.length; i += batchSize) {
        const batch = hotelMappings.slice(i, i + batchSize);
        
        for (const mapping of batch) {
          try {
            const reviewResult = await importReviewsForHotel(mapping.supplierHotelId, mapping.canonicalHotelId);
            result.total += reviewResult.total;
            result.created += reviewResult.created;
            result.skipped += reviewResult.skipped;
            result.failed += reviewResult.failed;
            processed++;
            
            // Small delay to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 100));
          } catch (error) {
            console.error(`   Error processing reviews for hotel ${mapping.supplierHotelId}:`, error);
            result.failed++;
          }
        }
        
        // Log progress every batch
        if ((i + batchSize) % 100 === 0 || i + batchSize >= hotelMappings.length) {
          console.log(`   Progress: ${Math.min(i + batchSize, hotelMappings.length)}/${hotelMappings.length} hotels, ${result.created} reviews created so far`);
        }
      }
      
      console.log(`   ✅ Reviews: ${result.created} created, ${result.skipped} skipped, ${result.failed} failed`);
      return result;
    }

    // Get the supplier ID from the database (use the CUID, not the code string)
    const supplier = await prisma.supplier.findUnique({
      where: { code: 'liteapi' },
    });
    
    if (!supplier) {
      console.error('   ERROR: Supplier "liteapi" not found. Please run import for other data types first.');
      result.skipped = 0;
      return result;
    }

    if (!hotelId) {
      console.log('   No hotelId provided. Skipping reviews.');
      result.skipped = 0;
      return result;
    }

    const params: Record<string, string> = { hotelId };
    const response = await fetchLiteAPI<{ data: LiteAPIReview[] } | LiteAPIReview[]>('/data/reviews', params);
    
    const reviews = Array.isArray(response) ? response : (response as any).data || [];
    result.total = reviews.length;

    console.log(`   Fetched ${reviews.length} reviews for hotel ${hotelId}`);
    
    // Debug: log first review to see structure
    if (reviews.length > 0) {
      console.log('   Sample review data:', JSON.stringify(reviews[0], null, 2));
    }

    // Find the canonical hotel via supplier mapping (using supplier.id which is the CUID)
    if (!hotelId) {
      console.log('   No hotelId provided. Skipping reviews.');
      result.skipped = 0;
      return result;
    }

    const mapping = await prisma.supplierHotelMapping.findUnique({
      where: {
        supplierId_supplierHotelId: {
          supplierId: supplier.id,
          supplierHotelId: hotelId,
        },
      },
    });

    if (!mapping) {
      console.log(`   No canonical hotel found for hotelId ${hotelId}. Skipping reviews.`);
      console.log(`   Hint: Import the hotel first using: --type=hotels --countryCode=XX`);
      
      result.skipped = reviews.length;
      return result;
    }

    for (const review of reviews) {
      try {
        // Map LiteAPI fields to our schema
        // LiteAPI: name, averageScore, headline, pros, cons, date, type, country, language, source
        const authorName = review.name;
        const rating = review.averageScore ? review.averageScore / 2 : undefined; // Convert 1-10 to 1-5 scale
        const title = review.headline;
        const reviewText = [review.pros, review.cons].filter(Boolean).join('\n\nCons: ');
        const stayDate = review.date ? new Date(review.date) : null;
        const travelerType = review.type;
        const authorCountry = review.country?.toUpperCase();
        
        if (!authorName || rating === undefined) {
          result.skipped++;
          continue;
        }

        // Check for duplicate review
        const existingReview = await prisma.hotelReview.findFirst({
          where: {
            canonicalHotelId: mapping.canonicalHotelId,
            authorName: authorName,
            rating: rating,
          },
        });

        if (existingReview) {
          result.skipped++;
          continue;
        }

        await prisma.hotelReview.create({
          data: {
            canonicalHotelId: mapping.canonicalHotelId,
            authorName: authorName,
            authorCountry: authorCountry,
            rating: rating,
            title: title,
            reviewText: reviewText || null,
            stayDate: stayDate,
            travelerType: travelerType,
            language: review.language || 'en',
            helpfulCount: 0,
            source: review.source || 'liteapi',
            isActive: true,
          },
        });

        result.created++;
      } catch (error: any) {
        result.failed++;
        console.error(`   Error creating review for ${review.name}:`, error.message || error);
      }
    }

    console.log(`   ✅ Reviews: ${result.created} created, ${result.skipped} skipped, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching hotel reviews:', error);
    throw error;
  }

  return result;
}

// Helper function to import reviews for a single hotel
async function importReviewsForHotel(supplierHotelId: string, canonicalHotelId: number): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  try {
    const params: Record<string, string> = { hotelId: supplierHotelId };
    const url = `${LITEAPI_BASE_URL}/data/reviews`;
    
    const response = await axios.get(url, {
      headers: {
        'X-API-Key': LITEAPI_API_KEY,
        'Accept': 'application/json',
      },
      params,
      timeout: 30000,
    });
    
    const data = response.data;
    const reviews = Array.isArray(data) ? data : data.data || [];
    result.total = reviews.length;

    for (const review of reviews) {
      try {
        const authorName = review.name;
        const rating = review.averageScore ? review.averageScore / 2 : undefined;
        
        if (!authorName || rating === undefined) {
          result.skipped++;
          continue;
        }

        // Check for duplicate review
        const existingReview = await prisma.hotelReview.findFirst({
          where: {
            canonicalHotelId: canonicalHotelId,
            authorName: authorName,
            rating: rating,
          },
        });

        if (existingReview) {
          result.skipped++;
          continue;
        }

        const reviewText = [review.pros, review.cons].filter(Boolean).join('\n\nCons: ');
        
        await prisma.hotelReview.create({
          data: {
            canonicalHotelId: canonicalHotelId,
            authorName: authorName,
            authorCountry: review.country?.toUpperCase(),
            rating: rating,
            title: review.headline,
            reviewText: reviewText || null,
            stayDate: review.date ? new Date(review.date) : null,
            travelerType: review.type,
            language: review.language || 'en',
            helpfulCount: 0,
            source: review.source || 'liteapi',
            isActive: true,
          },
        });

        result.created++;
      } catch (error) {
        result.failed++;
      }
    }
  } catch (error: any) {
    // Silently skip if hotel has no reviews or error
    if (error.response?.status !== 404) {
      result.failed++;
    }
  }

  return result;
}

async function importLanguages(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, skipped: 0, failed: 0 };

  console.log('\n📡 Fetching languages from LiteAPI...');

  try {
    const languages = await fetchLiteAPI<LiteAPILanguage[]>('/data/languages');
    result.total = languages.length;

    console.log(`   Fetched ${languages.length} languages`);

    for (const language of languages) {
      try {
        const existing = await prisma.language.findUnique({
          where: { code: language.code },
        });

        if (existing) {
          await prisma.language.update({
            where: { code: language.code },
            data: {
              name: language.name,
              nativeName: language.nativeName,
            },
          });
          result.updated++;
        } else {
          await prisma.language.create({
            data: {
              code: language.code,
              name: language.name,
              nativeName: language.nativeName,
              isActive: true,
            },
          });
          result.created++;
        }
      } catch (error) {
        result.failed++;
        console.error(`   Error processing language ${language.code}:`, error);
      }
    }

    console.log(`   ✅ Languages: ${result.created} created, ${result.updated} updated, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching languages:', error);
    throw error;
  }

  return result;
}

async function updateSupplierStatus(status: string, records?: number): Promise<void> {
  const isSuccess = status === 'success';
  
  await prisma.supplier.upsert({
    where: { code: 'liteapi' },
    update: {
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      lastSyncRecords: records,
    },
    create: {
      code: 'liteapi',
      name: 'LiteAPI',
      type: 'hotel',
      status: isSuccess,
      apiBaseUrl: LITEAPI_BASE_URL,
      apiKey: LITEAPI_API_KEY,
      syncEnabled: true,
      syncInterval: 86400,
      rateLimitPerMin: 60,
      rateLimitPerDay: 10000,
      features: {
        hotels: true,
        availability: true,
        realtime: true,
        staticData: true,
      },
      metadata: {
        description: 'LiteAPI Hotel Data Provider',
        website: 'https://liteapi.travel',
      },
      lastSyncAt: new Date(),
      lastSyncStatus: status,
      lastSyncRecords: records,
    },
  });
}

// ============================================
// CLI Argument Parsing
// ============================================

const AVAILABLE_IMPORTS = [
  'countries',
  'cities', 
  'currencies',
  'iataCodes',
  'facilities',
  'hotelTypes',
  'chains',
  'hotels',
  'reviews',
  'languages',
  'all',
] as const;

type ImportType = typeof AVAILABLE_IMPORTS[number];

function printUsage(): void {
  console.log(`
╔══════════════════════════════════════════════════════════════════╗
║        LiteAPI Static Data Importer                              ║
╚══════════════════════════════════════════════════════════════════╝

Usage: npx tsx scripts/import-liteapi-static.ts [options]

Options:
  --type=<type>         Import specific data type (default: all)
  --countryCode=<code>  Country code for hotels import (e.g., US, GB)
  --hotelId=<id>        Hotel ID for reviews import (e.g., lp6588dd91)
  --limit=<num>         Limit number of records to import
  --list                List available import types
  --help                Show this help message

Available Import Types:
  countries    - Import countries into Destination model
  cities       - Import cities into Destination model (requires countries first)
  currencies   - Import currencies into Currency model
  iataCodes    - Import IATA codes into Airport and City models
  facilities   - Import hotel facilities into HotelAmenity model
  hotelTypes   - Import hotel types into HotelType model
  chains       - Import hotel chains into HotelChain model
  hotels       - Import hotels into CanonicalHotel model (requires --countryCode)
  reviews      - Import hotel reviews into HotelReview model (requires --hotelId)
  languages    - Import languages into Language model
  all          - Import all static data types (default)

Examples:
  npx tsx scripts/import-liteapi-static.ts --type=countries
  npx tsx scripts/import-liteapi-static.ts --type=currencies
  npx tsx scripts/import-liteapi-static.ts --type=hotelTypes
  npx tsx scripts/import-liteapi-static.ts --type=chains
  npx tsx scripts/import-liteapi-static.ts --type=hotels --countryCode=US --limit=100
  npx tsx scripts/import-liteapi-static.ts --type=reviews --hotelId=lp6588dd91
  npx tsx scripts/import-liteapi-static.ts              # imports all static data
`);
}

function parseArgs(): { importType: ImportType; countryCode?: string; hotelId?: string; limit?: number; importAll: boolean } {
  const args = process.argv.slice(2);
  let importType: ImportType = 'all';
  let countryCode: string | undefined;
  let hotelId: string | undefined;
  let limit: number | undefined;
  let importAll: boolean = false;

  for (const arg of args) {
    if (arg === '--help' || arg === '-h') {
      printUsage();
      process.exit(0);
    }
    if (arg === '--list') {
      console.log('\nAvailable import types:');
      AVAILABLE_IMPORTS.forEach(t => console.log(`  - ${t}`));
      process.exit(0);
    }
    if (arg === '--all') {
      importAll = true;
    }
    if (arg.startsWith('--type=')) {
      const type = arg.split('=')[1];
      if (AVAILABLE_IMPORTS.includes(type as ImportType)) {
        importType = type as ImportType;
      } else {
        console.error(`❌ Invalid import type: ${type}`);
        console.log('Available types:', AVAILABLE_IMPORTS.join(', '));
        process.exit(1);
      }
    }
    if (arg.startsWith('--countryCode=')) {
      countryCode = arg.split('=')[1].toUpperCase();
    }
    if (arg.startsWith('--hotelId=')) {
      hotelId = arg.split('=')[1];
    }
    if (arg.startsWith('--limit=')) {
      limit = parseInt(arg.split('=')[1], 10);
    }
  }

  return { importType, countryCode, hotelId, limit, importAll };
}

// ============================================
// Main Function
// ============================================

async function main() {
  const { importType, countryCode, hotelId, limit, importAll } = parseArgs();

  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Static Data Import                                ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   Base URL: ${LITEAPI_BASE_URL}`);
  console.log(`   Import Type: ${importType}`);
  if (countryCode) console.log(`   Country Code: ${countryCode}`);
  if (hotelId) console.log(`   Hotel ID: ${hotelId}`);
  if (limit) console.log(`   Limit: ${limit}`);

  if (!LITEAPI_API_KEY) {
    console.warn('\n⚠️  Warning: LITEAPI_API_KEY not set in environment variables');
    console.warn('   Please set LITEAPI_API_KEY in .env.services');
  }

  try {
    let totalRecords = 0;

    // Run import based on type
    if (importType === 'all' || importType === 'countries') {
      const result = await importCountries();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'currencies') {
      const result = await importCurrencies();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'languages') {
      const result = await importLanguages();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'facilities') {
      const result = await importFacilities();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'iataCodes') {
      const result = await importIATACodes();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'cities') {
      const result = await importCities();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'hotelTypes') {
      const result = await importHotelTypes();
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'all' || importType === 'chains') {
      const result = await importHotelChains();
      totalRecords += result.created + result.updated;
    }
    
    // Hotels and reviews are not included in 'all' - must be explicitly requested
    if (importType === 'hotels') {
      const result = await importHotels(countryCode, limit);
      totalRecords += result.created + result.updated;
    }
    
    if (importType === 'reviews') {
      const result = await importHotelReviews(hotelId, importAll);
      totalRecords += result.created + result.updated;
    }

    // Update supplier status
    await updateSupplierStatus('success', totalRecords);

    console.log('\n✅ Import completed successfully!');

  } catch (error) {
    console.error('\n❌ Import failed:', error);
    await updateSupplierStatus('failed', 0);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    // Pool cleanup is handled by prisma.$disconnect()
  }
}

main();