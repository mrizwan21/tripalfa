#!/usr/bin/env node
/**
 * LiteAPI Amenities Importer
 * 
 * Imports and categorizes facilities from LiteAPI into:
 * 1. Hotel Amenities - Property-level facilities (pool, spa, restaurant, gym, parking, etc.)
 * 2. Room Amenities - In-room facilities (WiFi, AC, TV, minibar, safe, etc.)
 * 
 * Then maps all amenities to the imported hotels.
 * 
 * Usage:
 *   npx tsx scripts/import-liteapi-amenities.ts --type=facilities    # Import and categorize facilities
 *   npx tsx scripts/import-liteapi-amenities.ts --type=map           # Map amenities to all hotels
 *   npx tsx scripts/import-liteapi-amenities.ts --type=all           # Do both
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
const LITEAPI_BASE_URL = process.env.LITEAPI_BASE_URL || 'https://api.liteapi.travel/v3.0';
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || '';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/staticdatabase';
const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// ============================================
// AMENITY CATEGORIZATION RULES
// ============================================

/**
 * Hotel Amenities - Property-level facilities
 * These are facilities available at the hotel property level
 */
const HOTEL_AMENITY_KEYWORDS = [
  // Recreation & Wellness
  'pool', 'swimming', 'spa', 'wellness', 'gym', 'fitness', 'sauna', 'jacuzzi',
  'hot tub', 'massage', 'turkish bath', 'hammam', 'steam room',
  
  // Dining & Entertainment
  'restaurant', 'bar', 'lounge', 'cafe', 'breakfast', 'dining', 'buffet',
  'room service', 'kitchen', 'bbq', 'grill', 'pub', 'nightclub',
  
  // Services
  'reception', 'concierge', 'laundry', 'dry cleaning', 'ironing',
  'luggage', 'currency exchange', 'atm', 'banking', 'tour desk',
  'car rental', 'shuttle', 'airport transfer', 'parking', 'valet',
  
  // Facilities
  'elevator', 'lift', 'garden', 'terrace', 'rooftop', 'balcony',
  'meeting room', 'conference', 'business center', 'ballroom',
  'wedding', 'event', 'library', 'game room', 'playground',
  
  // Accessibility
  'wheelchair', 'accessible', 'disability', 'ramp',
  
  // Outdoor
  'beach', 'golf', 'tennis', 'basketball', 'volleyball', 'football',
  'soccer', 'water sports', 'diving', 'snorkeling', 'skiing',
  
  // Other Property-Level
  'shop', 'store', 'gift', 'newsstand', 'salon', 'beauty',
  'pharmacy', 'medical', 'doctor', 'safe deposit box', 'storage',
];

/**
 * Room Amenities - In-room facilities
 * These are facilities available inside the guest rooms
 */
const ROOM_AMENITY_KEYWORDS = [
  // Technology
  'wifi', 'wi-fi', 'internet', 'wireless', 'ethernet',
  'tv', 'television', 'smart tv', 'cable', 'satellite',
  'phone', 'telephone', 'voip', 'ipad', 'tablet',
  'bluetooth', 'speaker', 'sound system',
  
  // Climate Control
  'air conditioning', 'ac', 'a/c', 'heating', 'climate control',
  'fan', 'ceiling fan', 'thermostat', 'temperature',
  
  // Bathroom
  'bathroom', 'shower', 'bathtub', 'bath', 'toilet', 'wc',
  'bidet', 'hair dryer', 'hairdryer', 'toiletries', 'slippers',
  'robe', 'bathrobe', 'towel', 'jacuzzi tub', 'whirlpool',
  
  // Bedding & Furniture
  'bed', 'king', 'queen', 'twin', 'double', 'single',
  'sofa', 'couch', 'desk', 'chair', 'table', 'wardrobe',
  'closet', 'drawer', 'safe', 'minibar', 'mini-bar',
  'refrigerator', 'fridge', 'microwave', 'kitchenette',
  
  // Comfort
  'balcony', 'terrace', 'patio', 'view', 'window',
  'blackout', 'curtain', 'blind', 'soundproof', 'insulation',
  
  // In-Room Services
  'room service', 'housekeeping', 'turndown', 'laundry',
  'iron', 'ironing board', 'coffee', 'tea', 'kettle',
  'wake-up', 'alarm', 'clock',
  
  // Security & Privacy
  'safe', 'lock', 'keycard', 'key card', 'do not disturb',
  'smoke detector', 'fire alarm', 'sprinkler',
];

// Specific facility IDs that are known to be room amenities
const KNOWN_ROOM_AMENITY_IDS = [
  3,   // WiFi
  5,   // Air conditioning
  8,   // TV
  10,  // Minibar
  14,  // Safe
  15,  // Hair dryer
  16,  // Telephone
  19,  // Balcony
  20,  // Heating
  22,  // Tea/Coffee maker
  25,  // Iron
  28,  // Desk
  48,  // Refrigerator
  49,  // Toilet
  51,  // Bathroom
  53,  // Wardrobe/Closet
  55,  // Towels
  58,  // Linens
  63,  // Toilet paper
  64,  // Body soap
  72,  // Outdoor furniture
  75,  // Drying rack for clothing
  78,  // Socket near the bed
  81,  // Key access
  91,  // Private bathroom
  108, // Cleaning products
  129, // Clothes rack
  140, // Cleaning supplies
  143, // Socket near the bed
  170, // Drying rack
  176, // Clothes dryer
  185, // Wardrobe
  188, // Linen
  196, // Towers/Toilet paper
  200, // Body soap
  205, // Toilet
  211, // Private bathroom in all rooms
  219, // Wardrobe or closet
  222, // Towels
  223, // Linen
  226, // Toilet paper
  231, // Body soap
  232, // Cleaning products
  236, // Drying rack
  241, // Clothes dryer
  256, // Socket near the bed
];

// Specific facility IDs that are known to be hotel amenities
const KNOWN_HOTEL_AMENITY_IDS = [
  1054, // Swimming pool
  1091, // Fitness center
  1725, // Spa
  1814, // Restaurant
  1833, // Bar
  1842, // Room service
  2066, // 24-hour front desk
  2083, // Parking
  2359, // Sauna
  2405, // Private beach area
  6848, // Airport shuttle
  1102, // Terrace
  491,  // Elevator
  492,  // Safe deposit box
  499,  // Laundry
  502,  // Dry cleaning
  519,  // Meeting facilities
  526,  // Business center
  529,  // Concierge service
  530,  // Luggage storage
  533,  // Tour desk
  535,  // Currency exchange
  536,  // ATM on site
  542,  // Gift shop
  557,  // Barber/beauty shop
  561,  // Garden
  564,  // Library
  567,  // Game room
  568,  // Kids' club
  581,  // Water park
  584,  // Massage
  590,  // Nightclub/DJ
  597,  // Karaoke
  623,  // Bowling
  626,  // Mini golf
  631,  // Tennis court
  637,  // Water sport facilities
  642,  // Golf course
  656,  // Cycling
  658,  // Hiking
  664,  // Fishing
  674,  // Live music/performance
  679,  // Movie nights
  691,  // Themed dinner nights
  692,  // Tour or class about local culture
  708,  // Happy hour
  712,  // Pub crawls
  714,  // Walking tours
  720,  // Bike tours
  757,  // Cooking class
  761,  // Horse riding
  784,  // Stand-up comedy
  789,  // Live sport events
  800,  // Movie nights
  802,  // Themed dinner nights
  803,  // Tour or class about local culture
  805,  // Pub crawls
  806,  // Walking tours
  808,  // Bike tours
  809,  // Cooking class
  822,  // Horse riding
  827,  // Stand-up comedy
  828,  // Live sport events
  835,  // Happy hour
  856,  // Water park
  857,  // Massage
  859,  // Nightclub/DJ
  880,  // Karaoke
  891,  // Bowling
  900,  // Mini golf
  901,  // Tennis court
  908,  // Water sport facilities
  916,  // Golf course
  932,  // Cycling
  933,  // Hiking
  936,  // Fishing
  940,  // Live music/performance
  941,  // Movie nights
  944,  // Themed dinner nights
  946,  // Tour or class about local culture
  954,  // Pub crawls
  966,  // Walking tours
  1003, // Bike tours
  1005, // Cooking class
  1021, // Horse riding
  1022, // Stand-up comedy
  1027, // Live sport events
  1028, // Happy hour
];

interface LiteAPIFacility {
  facility_id: number;
  facility: string;
  sort?: number;
  translation?: Array<{ lang: string; facility: string }>;
}

interface ImportResult {
  total: number;
  created: number;
  updated: number;
  failed: number;
}

/**
 * Determine if a facility is a Hotel Amenity or Room Amenity
 */
function categorizeFacility(facility: LiteAPIFacility): 'hotel' | 'room' {
  const id = facility.facility_id;
  const name = facility.facility.toLowerCase();
  
  // Check known IDs first
  if (KNOWN_HOTEL_AMENITY_IDS.includes(id)) {
    return 'hotel';
  }
  if (KNOWN_ROOM_AMENITY_IDS.includes(id)) {
    return 'room';
  }
  
  // Check keywords
  const isHotelAmenity = HOTEL_AMENITY_KEYWORDS.some(keyword => name.includes(keyword));
  const isRoomAmenity = ROOM_AMENITY_KEYWORDS.some(keyword => name.includes(keyword));
  
  // If both match, prefer room amenity (more specific)
  if (isRoomAmenity) {
    return 'room';
  }
  if (isHotelAmenity) {
    return 'hotel';
  }
  
  // Default to hotel amenity for unknown facilities
  return 'hotel';
}

/**
 * Fetch facilities from LiteAPI
 */
async function fetchFacilities(): Promise<LiteAPIFacility[]> {
  const url = `${LITEAPI_BASE_URL}/data/facilities`;
  console.log(`Fetching: ${url}`);
  
  const response = await axios.get(url, {
    headers: {
      'X-API-Key': LITEAPI_API_KEY,
      'Accept': 'application/json',
    },
    timeout: 60000,
  });
  
  const data = response.data;
  if (data && typeof data === 'object' && 'data' in data) {
    return data.data as LiteAPIFacility[];
  }
  
  return data as LiteAPIFacility[];
}

/**
 * Import and categorize facilities
 */
async function importFacilities(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0 };
  
  console.log('\n📡 Fetching facilities from LiteAPI...');
  
  try {
    // Get or create supplier
    const supplier = await prisma.supplier.upsert({
      where: { code: 'liteapi' },
      update: { lastSyncAt: new Date() },
      create: {
        code: 'liteapi',
        name: 'LiteAPI',
        type: 'hotel',
        status: true,
        apiBaseUrl: LITEAPI_BASE_URL,
        apiKey: LITEAPI_API_KEY,
        syncEnabled: true,
        syncInterval: 86400,
        rateLimitPerMin: 60,
        rateLimitPerDay: 10000,
        features: { hotels: true, availability: true, realtime: true, staticData: true },
        metadata: { description: 'LiteAPI Hotel Data Provider' },
      },
    });
    
    const facilities = await fetchFacilities();
    result.total = facilities.length;
    
    console.log(`   Fetched ${facilities.length} facilities`);
    
    let hotelAmenityCount = 0;
    let roomAmenityCount = 0;
    
    for (const facility of facilities) {
      try {
        const category = categorizeFacility(facility);
        const code = `FAC_${facility.facility_id}`;
        
        // Build localized names
        const nameLocalized: Record<string, string> = { en: facility.facility };
        if (facility.translation && Array.isArray(facility.translation)) {
          for (const t of facility.translation) {
            if (t.lang && t.facility) {
              nameLocalized[t.lang] = t.facility;
            }
          }
        }
        
        if (category === 'hotel') {
          // Create as Hotel Amenity
          const amenity = await prisma.hotelAmenity.upsert({
            where: { code },
            update: {
              name: facility.facility,
              nameLocalized,
              category: 'General',
              sortOrder: facility.sort || 0,
            },
            create: {
              code,
              name: facility.facility,
              nameLocalized,
              category: 'General',
              sortOrder: facility.sort || 0,
              isActive: true,
            },
          });
          
          // Create supplier mapping
          await prisma.hotelAmenitySupplierMapping.upsert({
            where: {
              supplierId_supplierCode: {
                supplierId: supplier.id,
                supplierCode: String(facility.facility_id),
              },
            },
            update: {
              supplierName: facility.facility,
              matchConfidence: 1.0,
              isVerified: true,
            },
            create: {
              amenityId: amenity.id,
              supplierId: supplier.id,
              supplierCode: String(facility.facility_id),
              supplierName: facility.facility,
              matchConfidence: 1.0,
              isVerified: true,
            },
          });
          
          hotelAmenityCount++;
        } else {
          // Create as Room Amenity
          const amenity = await prisma.roomAmenity.upsert({
            where: { code },
            update: {
              name: facility.facility,
              nameLocalized,
              category: 'General',
              sortOrder: facility.sort || 0,
            },
            create: {
              code,
              name: facility.facility,
              nameLocalized,
              category: 'General',
              sortOrder: facility.sort || 0,
              isActive: true,
            },
          });
          
          // Create supplier mapping
          await prisma.roomAmenitySupplierMapping.upsert({
            where: {
              supplierId_supplierCode: {
                supplierId: supplier.id,
                supplierCode: String(facility.facility_id),
              },
            },
            update: {
              supplierName: facility.facility,
              matchConfidence: 1.0,
              isVerified: true,
            },
            create: {
              amenityId: amenity.id,
              supplierId: supplier.id,
              supplierCode: String(facility.facility_id),
              supplierName: facility.facility,
              matchConfidence: 1.0,
              isVerified: true,
            },
          });
          
          roomAmenityCount++;
        }
        
        result.created++;
      } catch (error: any) {
        result.failed++;
        console.error(`   Error processing facility ${facility.facility_id}:`, error.message);
      }
    }
    
    console.log(`   ✅ Facilities: ${hotelAmenityCount} hotel amenities, ${roomAmenityCount} room amenities, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error fetching facilities:', error);
    throw error;
  }
  
  return result;
}

/**
 * Map amenities to all hotels from the metadata field
 */
async function mapAmenitiesToHotels(): Promise<ImportResult> {
  const result: ImportResult = { total: 0, created: 0, updated: 0, failed: 0 };
  
  console.log('\n📡 Mapping amenities to hotels...');
  
  try {
    // Get supplier
    const supplier = await prisma.supplier.findUnique({
      where: { code: 'liteapi' },
    });
    
    if (!supplier) {
      console.error('   ERROR: Supplier "liteapi" not found. Please run --type=facilities first.');
      return result;
    }
    
    // Get all hotel mappings with metadata
    const batchSize = 1000;
    let skip = 0;
    let totalProcessed = 0;
    
    // Get total count
    const totalCount = await prisma.supplierHotelMapping.count({
      where: { supplierId: supplier.id },
    });
    
    console.log(`   Found ${totalCount} hotels to process`);
    
    while (skip < totalCount) {
      const hotelMappings = await prisma.supplierHotelMapping.findMany({
        where: { supplierId: supplier.id },
        select: {
          id: true,
          canonicalHotelId: true,
          supplierData: true,
        },
        skip,
        take: batchSize,
      });
      
      if (hotelMappings.length === 0) break;
      
      for (const mapping of hotelMappings) {
        try {
          const supplierData = mapping.supplierData as any;
          const facilityIds: number[] = supplierData?.facilityIds || [];
          
          if (facilityIds.length === 0) {
            totalProcessed++;
            continue;
          }
          
          // Get amenity mappings for these facility IDs
          for (const facilityId of facilityIds) {
            // Check if it's a hotel amenity
            const hotelAmenityMapping = await prisma.hotelAmenitySupplierMapping.findUnique({
              where: {
                supplierId_supplierCode: {
                  supplierId: supplier.id,
                  supplierCode: String(facilityId),
                },
              },
            });
            
            if (hotelAmenityMapping) {
              // Create hotel amenity mapping
              await prisma.hotelAmenityMapping.upsert({
                where: {
                  canonicalHotelId_amenityId: {
                    canonicalHotelId: mapping.canonicalHotelId,
                    amenityId: hotelAmenityMapping.amenityId,
                  },
                },
                update: {
                  supplierId: supplier.id,
                  supplierAmenityCode: String(facilityId),
                },
                create: {
                  canonicalHotelId: mapping.canonicalHotelId,
                  amenityId: hotelAmenityMapping.amenityId,
                  supplierId: supplier.id,
                  supplierAmenityCode: String(facilityId),
                  isFree: true,
                },
              });
              result.created++;
            }
            
            // Check if it's a room amenity (for future use when we have room types)
            const roomAmenityMapping = await prisma.roomAmenitySupplierMapping.findUnique({
              where: {
                supplierId_supplierCode: {
                  supplierId: supplier.id,
                  supplierCode: String(facilityId),
                },
              },
            });
            
            if (roomAmenityMapping) {
              // Store room amenity info in hotel metadata for later room type mapping
              // This will be used when importing room types
            }
          }
          
          totalProcessed++;
          result.total++;
          
          if (totalProcessed % 1000 === 0) {
            console.log(`   Progress: ${totalProcessed}/${totalCount} hotels processed`);
          }
        } catch (error: any) {
          result.failed++;
        }
      }
      
      skip += batchSize;
    }
    
    console.log(`   ✅ Mapped ${result.created} amenity mappings, ${result.failed} failed`);
  } catch (error) {
    console.error('   ❌ Error mapping amenities:', error);
    throw error;
  }
  
  return result;
}

// ============================================
// CLI Argument Parsing
// ============================================

const AVAILABLE_TYPES = ['facilities', 'map', 'all'] as const;
type ImportType = typeof AVAILABLE_TYPES[number];

function parseArgs(): { importType: ImportType } {
  const args = process.argv.slice(2);
  let importType: ImportType = 'all';
  
  for (const arg of args) {
    if (arg.startsWith('--type=')) {
      const type = arg.split('=')[1];
      if (AVAILABLE_TYPES.includes(type as ImportType)) {
        importType = type as ImportType;
      } else {
        console.error(`❌ Invalid import type: ${type}`);
        console.log('Available types:', AVAILABLE_TYPES.join(', '));
        process.exit(1);
      }
    }
  }
  
  return { importType };
}

async function main() {
  const { importType } = parseArgs();
  
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        LiteAPI Amenities Import                                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`   Base URL: ${LITEAPI_BASE_URL}`);
  console.log(`   Import Type: ${importType}`);
  
  if (!LITEAPI_API_KEY) {
    console.warn('\n⚠️  Warning: LITEAPI_API_KEY not set in environment variables');
  }
  
  try {
    if (importType === 'all' || importType === 'facilities') {
      await importFacilities();
    }
    
    if (importType === 'all' || importType === 'map') {
      await mapAmenitiesToHotels();
    }
    
    console.log('\n✅ Import completed successfully!');
  } catch (error) {
    console.error('\n❌ Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    // Pool will be closed automatically when process exits
  }
}

main();
