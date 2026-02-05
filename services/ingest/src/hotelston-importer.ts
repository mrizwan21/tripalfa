/**
 * Hotelston Static Data Importer
 * TypeScript implementation for importing static data from Hotelston API into PostgreSQL database
 * 
 * This importer fetches:
 * - Countries
 * - Cities
 * - Hotel Chains
 * - Hotel Facilities
 * - Hotel Types
 * - Hotels (with full data including images, descriptions, amenities, policies)
 */

import axios from 'axios';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { findOrCreateCanonicalHotel, HotelData } from './mapping-utils';

// Load environment variables
dotenv.config({ path: path.join(__dirname, '../../../.env') });

// Database connection
const pool = new Pool({
    connectionString: process.env.STATIC_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/staticdatabase',
});

// API Configuration
const HOTELSTON_STATIC_API_ENDPOINT = process.env.HOTELSTON_STATIC_API_ENDPOINT ||
    'https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/';

const HOTELSTON_CREDENTIALS = {
    username: process.env.HOTELSTON_USERNAME || 'technocense@gmail.com',
    password: process.env.HOTELSTON_PASSWORD || '6614645@Dubai'
};

const SOAP_NAMESPACE = 'http://hotelston.com/';

// Types
interface HotelstonCountry {
    code: string;
    name: string;
    isoCode?: string;
}

interface HotelstonCity {
    id?: string;
    name: string;
    country: string;
    countryCode?: string;
    latitude?: number;
    longitude?: number;
    population?: number;
    timezone?: string;
}

interface HotelstonHotelChain {
    id?: string;
    code: string;
    name: string;
    website?: string;
    logoUrl?: string;
    country?: string;
}

interface HotelstonHotelFacility {
    id?: string;
    name: string;
    category?: string;
    icon?: string;
}

interface HotelstonHotelType {
    id?: string;
    name: string;
    description?: string;
}

interface HotelstonHotelImage {
    url: string;
    caption?: string;
    category?: string;
    isPrimary?: boolean;
    width?: number;
    height?: number;
}

interface HotelstonHotelRoom {
    id?: string;
    name: string;
    description?: string;
    maxOccupancy?: number;
    bedType?: string;
    size?: number;
    amenities?: string[];
    images?: HotelstonHotelImage[];
}

interface HotelstonHotel {
    id: string;
    name: string;
    description?: string;
    shortDescription?: string;
    address?: string;
    city?: string;
    country?: string;
    countryCode?: string;
    postalCode?: string;
    latitude?: number;
    longitude?: number;
    starRating?: number;
    userRating?: number;
    reviewCount?: number;
    chain?: HotelstonHotelChain;
    chainId?: string;
    website?: string;
    phone?: string;
    email?: string;
    fax?: string;
    checkInTime?: string;
    checkOutTime?: string;
    amenities?: string[];
    facilities?: HotelstonHotelFacility[];
    images?: HotelstonHotelImage[];
    mainImage?: string;
    rooms?: HotelstonHotelRoom[];
    policies?: {
        cancellation?: string;
        payment?: string;
        children?: string;
        pets?: string;
        smoking?: string;
        general?: string;
    };
    nearbyAttractions?: string[];
    transportLinks?: string[];
}

interface ImportResult {
    success: boolean;
    imported: number;
    errors: number;
    duration: number;
}

const STATUS_FILE = path.join(__dirname, '../hotelston-import-status.json');

/**
 * Update status file for monitoring
 */
function updateStatusFile(status: string, data: any = {}) {
    const statusData = {
        lastCheck: new Date().toISOString(),
        status,
        endpoint: HOTELSTON_STATIC_API_ENDPOINT,
        ...data
    };

    try {
        fs.writeFileSync(STATUS_FILE, JSON.stringify(statusData, null, 2));
    } catch (err) {
        // Ignore write errors
    }
}

/**
 * Create SOAP envelope for requests
 */
function createSoapEnvelope(action: string, bodyContent: string): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hot="${SOAP_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <hot:${action}Request>
      <hot:username>${HOTELSTON_CREDENTIALS.username}</hot:username>
      <hot:password>${HOTELSTON_CREDENTIALS.password}</hot:password>
      ${bodyContent}
    </hot:${action}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Parse SOAP response - handles both JSON and XML formats
 */
function parseSoapResponse(response: string): Record<string, any> {
    // Try to extract the response content between the actionResponse tags
    const responseMatch = response.match(new RegExp(`<(hot:|ns1:|ns2:)?.*Response[^>]*>(.*?)</(hot:|ns1:|ns2:)?.*Response>`, 's'));
    if (!responseMatch) {
        // Try to find any data elements
        const dataMatch = response.match(/<return>(.*?)<\/return>/s);
        if (dataMatch) {
            try {
                return JSON.parse(dataMatch[1]);
            } catch {
                return { rawData: dataMatch[1] };
            }
        }
        throw new Error('Invalid SOAP response format');
    }

    // Extract individual elements
    const result: Record<string, any> = {};
    const elementRegex = /<(hot:|ns1:|ns2:|)(\w+)>([^<]*?)<\/(hot:|ns1:|ns2:|)\2>/g;
    let match;

    while ((match = elementRegex.exec(responseMatch[2])) !== null) {
        const [, , key, value] = match;
        result[key] = value;
    }

    // Also try to extract JSON arrays
    const jsonArrayMatch = response.match(/\[[\s\S]*?\]/);
    if (jsonArrayMatch) {
        try {
            result.parsedArray = JSON.parse(jsonArrayMatch[0]);
        } catch {
            // Not valid JSON
        }
    }

    return result;
}

/**
 * Parse XML array of items
 */
function parseXmlArray(xml: string, itemTag: string): any[] {
    const items: any[] = [];
    const itemRegex = new RegExp(`<${itemTag}>(.*?)</${itemTag}>`, 'gs');
    let match;

    while ((match = itemRegex.exec(xml)) !== null) {
        const item: Record<string, any> = {};
        const fieldRegex = /<(\w+)>([^<]*?)<\/\1>/g;
        let fieldMatch;

        while ((fieldMatch = fieldRegex.exec(match[1])) !== null) {
            item[fieldMatch[1]] = fieldMatch[2];
        }

        if (Object.keys(item).length > 0) {
            items.push(item);
        }
    }

    return items;
}

/**
 * Make SOAP API request with retry logic
 */
async function makeSoapRequest(action: string, bodyContent: string = '', retries: number = 3): Promise<any> {
    const envelope = createSoapEnvelope(action, bodyContent);

    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
                headers: {
                    'Content-Type': 'text/xml; charset=utf-8',
                    'SOAPAction': `"${SOAP_NAMESPACE}${action}"`
                },
                timeout: 60000 // 60 second timeout
            });

            return parseSoapResponse(response.data as string);
        } catch (error: any) {
            console.error(`Attempt ${attempt}/${retries} failed for ${action}:`, error.message);

            if (attempt === retries) {
                throw error;
            }

            // Wait before retry (exponential backoff)
            await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, attempt)));
        }
    }
}

/**
 * Import countries
 */
async function importCountries(): Promise<ImportResult> {
    console.log('\n📍 Importing countries...');
    const startTime = Date.now();
    let imported = 0;
    let errors = 0;

    try {
        const result = await makeSoapRequest('getCountries');

        let countries: HotelstonCountry[] = [];

        // Try different parsing strategies
        if (result.parsedArray) {
            countries = result.parsedArray;
        } else if (result.countries) {
            try {
                countries = JSON.parse(result.countries);
            } catch {
                countries = parseXmlArray(result.countries, 'country');
            }
        }

        console.log(`📊 Found ${countries.length} countries`);

        for (const country of countries) {
            try {
                await pool.query(
                    `INSERT INTO countries (code, name, updated_at) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (code) DO UPDATE SET name = $2, updated_at = NOW()`,
                    [country.code || country.isoCode, country.name]
                );
                imported++;
            } catch (error: any) {
                console.error(`❌ Error inserting country ${country.name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Imported ${imported} countries (${errors} errors)`);

    } catch (error: any) {
        console.error('❌ Import countries failed:', error.message);
    }

    return { success: errors === 0, imported, errors, duration: Date.now() - startTime };
}

/**
 * Import cities
 */
async function importCities(): Promise<ImportResult> {
    console.log('\n🏙️ Importing cities...');
    const startTime = Date.now();
    let imported = 0;
    let errors = 0;

    try {
        const result = await makeSoapRequest('getCities');

        let cities: HotelstonCity[] = [];

        if (result.parsedArray) {
            cities = result.parsedArray;
        } else if (result.cities) {
            try {
                cities = JSON.parse(result.cities);
            } catch {
                cities = parseXmlArray(result.cities, 'city');
            }
        }

        console.log(`📊 Found ${cities.length} cities`);

        for (const city of cities) {
            try {
                await pool.query(
                    `INSERT INTO cities (name, country, country_code, latitude, longitude, population, timezone, updated_at) 
           VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) 
           ON CONFLICT (name) DO UPDATE SET 
             country = COALESCE($2, cities.country),
             country_code = COALESCE($3, cities.country_code),
             latitude = COALESCE($4, cities.latitude),
             longitude = COALESCE($5, cities.longitude),
             population = COALESCE($6, cities.population),
             timezone = COALESCE($7, cities.timezone),
             updated_at = NOW()`,
                    [
                        city.name,
                        city.country,
                        city.countryCode,
                        city.latitude,
                        city.longitude,
                        city.population,
                        city.timezone
                    ]
                );
                imported++;
            } catch (error: any) {
                console.error(`❌ Error inserting city ${city.name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Imported ${imported} cities (${errors} errors)`);

    } catch (error: any) {
        console.error('❌ Import cities failed:', error.message);
    }

    return { success: errors === 0, imported, errors, duration: Date.now() - startTime };
}

/**
 * Import hotel chains
 */
async function importHotelChains(): Promise<ImportResult> {
    console.log('\n🏢 Importing hotel chains...');
    const startTime = Date.now();
    let imported = 0;
    let errors = 0;

    try {
        const result = await makeSoapRequest('getHotelChains');

        let chains: HotelstonHotelChain[] = [];

        if (result.parsedArray) {
            chains = result.parsedArray;
        } else if (result.chains || result.hotelChains) {
            try {
                chains = JSON.parse(result.chains || result.hotelChains);
            } catch {
                chains = parseXmlArray(result.chains || result.hotelChains, 'chain');
            }
        }

        console.log(`📊 Found ${chains.length} hotel chains`);

        for (const chain of chains) {
            try {
                await pool.query(
                    `INSERT INTO hotel_chains (code, name, website, logo_url, country, updated_at) 
           VALUES ($1, $2, $3, $4, $5, NOW()) 
           ON CONFLICT (code) DO UPDATE SET 
             name = COALESCE($2, hotel_chains.name),
             website = COALESCE($3, hotel_chains.website),
             logo_url = COALESCE($4, hotel_chains.logo_url),
             country = COALESCE($5, hotel_chains.country),
             updated_at = NOW()`,
                    [chain.code, chain.name, chain.website, chain.logoUrl, chain.country]
                );
                imported++;
            } catch (error: any) {
                console.error(`❌ Error inserting chain ${chain.name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Imported ${imported} hotel chains (${errors} errors)`);

    } catch (error: any) {
        console.error('❌ Import hotel chains failed:', error.message);
    }

    return { success: errors === 0, imported, errors, duration: Date.now() - startTime };
}

/**
 * Import hotel facilities
 */
async function importHotelFacilities(): Promise<ImportResult> {
    console.log('\n🛎️ Importing hotel facilities...');
    const startTime = Date.now();
    let imported = 0;
    let errors = 0;

    try {
        const result = await makeSoapRequest('getHotelFacilities');

        let facilities: HotelstonHotelFacility[] = [];

        if (result.parsedArray) {
            facilities = result.parsedArray;
        } else if (result.facilities || result.hotelFacilities) {
            try {
                facilities = JSON.parse(result.facilities || result.hotelFacilities);
            } catch {
                facilities = parseXmlArray(result.facilities || result.hotelFacilities, 'facility');
            }
        }

        console.log(`📊 Found ${facilities.length} hotel facilities`);

        for (const facility of facilities) {
            try {
                await pool.query(
                    `INSERT INTO hotel_facilities (name, category, icon, updated_at) 
           VALUES ($1, $2, $3, NOW()) 
           ON CONFLICT (name) DO UPDATE SET 
             category = COALESCE($2, hotel_facilities.category),
             icon = COALESCE($3, hotel_facilities.icon),
             updated_at = NOW()`,
                    [facility.name, facility.category, facility.icon]
                );
                imported++;
            } catch (error: any) {
                console.error(`❌ Error inserting facility ${facility.name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Imported ${imported} hotel facilities (${errors} errors)`);

    } catch (error: any) {
        console.error('❌ Import hotel facilities failed:', error.message);
    }

    return { success: errors === 0, imported, errors, duration: Date.now() - startTime };
}

/**
 * Import hotel types
 */
async function importHotelTypes(): Promise<ImportResult> {
    console.log('\n🏨 Importing hotel types...');
    const startTime = Date.now();
    let imported = 0;
    let errors = 0;

    try {
        const result = await makeSoapRequest('getHotelTypes');

        let types: HotelstonHotelType[] = [];

        if (result.parsedArray) {
            types = result.parsedArray;
        } else if (result.types || result.hotelTypes) {
            try {
                types = JSON.parse(result.types || result.hotelTypes);
            } catch {
                types = parseXmlArray(result.types || result.hotelTypes, 'type');
            }
        }

        console.log(`📊 Found ${types.length} hotel types`);

        for (const type of types) {
            try {
                await pool.query(
                    `INSERT INTO hotel_types (name, description, updated_at) 
           VALUES ($1, $2, NOW()) 
           ON CONFLICT (name) DO UPDATE SET 
             description = COALESCE($2, hotel_types.description),
             updated_at = NOW()`,
                    [type.name, type.description]
                );
                imported++;
            } catch (error: any) {
                console.error(`❌ Error inserting type ${type.name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Imported ${imported} hotel types (${errors} errors)`);

    } catch (error: any) {
        console.error('❌ Import hotel types failed:', error.message);
    }

    return { success: errors === 0, imported, errors, duration: Date.now() - startTime };
}

/**
 * Import hotels with full data (including images, descriptions, amenities)
 */
async function importHotels(): Promise<ImportResult> {
    console.log('\n🏠 Importing hotels (with full data including images)...');
    const startTime = Date.now();
    let imported = 0;
    let errors = 0;

    try {
        const result = await makeSoapRequest('getHotels');

        let hotels: HotelstonHotel[] = [];

        if (result.parsedArray) {
            hotels = result.parsedArray;
        } else if (result.hotels) {
            try {
                hotels = JSON.parse(result.hotels);
            } catch {
                hotels = parseXmlArray(result.hotels, 'hotel');
            }
        }

        console.log(`📊 Found ${hotels.length} hotels`);

        for (const hotel of hotels) {
            try {
                // Prepare images array
                const images = hotel.images?.map((img: HotelstonHotelImage) => ({
                    url: img.url,
                    caption: img.caption,
                    category: img.category,
                    isPrimary: img.isPrimary,
                    width: img.width,
                    height: img.height
                })) || [];

                // Prepare amenities array
                const amenities = hotel.amenities || hotel.facilities?.map((f: HotelstonHotelFacility) => f.name) || [];

                // Prepare policies object
                const policies = hotel.policies || {};

                // Prepare HotelData for mapping-utils
                const hotelData: HotelData = {
                    name: hotel.name,
                    address: hotel.address,
                    city: hotel.city,
                    country: hotel.country,
                    country_code: hotel.countryCode,
                    stars: hotel.starRating,
                    latitude: hotel.latitude,
                    longitude: hotel.longitude,
                    amenities,
                    images: images.map(img => ({ url: img.url, caption: img.caption })),
                    external_id: hotel.id,
                    external_source: 'hotelston'
                };

                const canonicalId = await findOrCreateCanonicalHotel(pool, hotelData, 0);

                // For Hotelston, we'll use the canonicalId for room types and translations
                // (or you could query hotel_supplier_references id if preferred, 
                // but since these aren't GIATA, canonicalId is often the target for enrichment)
                const supplierRefRes = await pool.query(
                    'SELECT id FROM hotel_supplier_references WHERE supplier_code = $1 AND supplier_hotel_id = $2',
                    ['hotelston', hotel.id]
                );
                const supplierHotelId = supplierRefRes.rows[0]?.id;

                imported++;

                // Import room types if available
                if (hotel.rooms && hotel.rooms.length > 0) {
                    for (const room of hotel.rooms) {
                        try {
                            await pool.query(
                                `INSERT INTO hotel_room_types (
                  hotel_id, external_id, name, description,
                  max_occupancy, bed_type, size_sqm,
                  amenities, images, updated_at
                ) VALUES (
                  $1,
                  $2, $3, $4, $5, $6, $7, $8, $9, NOW()
                )
                ON CONFLICT (hotel_id, external_id) DO UPDATE SET
                  name = COALESCE($3, hotel_room_types.name),
                  description = COALESCE($4, hotel_room_types.description),
                  max_occupancy = COALESCE($5, hotel_room_types.max_occupancy),
                  bed_type = COALESCE($6, hotel_room_types.bed_type),
                  size_sqm = COALESCE($7, hotel_room_types.size_sqm),
                  amenities = COALESCE($8, hotel_room_types.amenities),
                  images = COALESCE($9, hotel_room_types.images),
                  updated_at = NOW()`,
                                [
                                    supplierHotelId,
                                    room.id || `${hotel.id}_${room.name}`,
                                    room.name,
                                    room.description,
                                    room.maxOccupancy,
                                    room.bedType,
                                    room.size,
                                    JSON.stringify(room.amenities || []),
                                    JSON.stringify(room.images || [])
                                ]
                            );
                        } catch (roomError: any) {
                            console.error(`❌ Error inserting room ${room.name} for hotel ${hotel.id}:`, roomError.message);
                        }
                    }
                }

                // Log progress every 100 hotels
                if (imported % 100 === 0) {
                    console.log(`📦 Imported ${imported} hotels...`);
                }

            } catch (error: any) {
                console.error(`❌ Error inserting hotel ${hotel.name}:`, error.message);
                errors++;
            }
        }

        console.log(`✅ Imported ${imported} hotels (${errors} errors)`);

    } catch (error: any) {
        console.error('❌ Import hotels failed:', error.message);
    }

    return { success: errors === 0, imported, errors, duration: Date.now() - startTime };
}

/**
 * Test API connectivity
 */
async function testApiConnectivity(): Promise<boolean> {
    console.log('\n🔌 Testing Hotelston API connectivity...');

    try {
        const envelope = createSoapEnvelope('ping', '');

        const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
            headers: {
                'Content-Type': 'text/xml; charset=utf-8',
                'SOAPAction': `"${SOAP_NAMESPACE}ping"`
            },
            timeout: 15000
        });

        // Check if response contains a successful SOAP result
        if (response.status === 200 && (response.data as string).includes('pingResponse')) {
            console.log('✅ API is accessible and responding!');
            return true;
        }

        console.log(`⚠️ API responded with status ${response.status} but invalid content.`);
        return false;

    } catch (error: any) {
        if (error.response) {
            console.log(`⚠️ API responded with status ${error.response.status}`);
            // Any non-200 response should be treated as "not ready for import"
            // especially 404 which means the destination itself is missing.
            return false;
        }
        console.error('❌ API connectivity test failed:', error.message);
        return false;
    }
}

/**
 * Monitor API availability and auto-import when available
 */
async function monitorAndImport(intervalMinutes: number = 5): Promise<void> {
    console.log('='.repeat(60));
    console.log('📡 HOTELSTON API MONITORING MODE');
    console.log('='.repeat(60));
    console.log(`Checking API every ${intervalMinutes} minutes...`);
    console.log('Press Ctrl+C to stop.\n');

    let attempts = 0;
    const intervalMs = intervalMinutes * 60 * 1000;

    while (true) {
        attempts++;
        console.log(`[${new Date().toISOString()}] Check attempt #${attempts}`);

        updateStatusFile('MONITORING', { attempts });

        const apiAvailable = await testApiConnectivity();

        if (apiAvailable) {
            console.log('🎉 API is now available! Starting import...');
            updateStatusFile('IMPORTING', { attempts });
            await runImports();
            console.log('✅ Import completed. Monitoring finished.');
            updateStatusFile('COMPLETED', { attempts, completedAt: new Date().toISOString() });
            break;
        } else {
            console.log(`API check #${attempts} failed (404/Network). Waiting ${intervalMinutes} minutes...`);
        }

        await new Promise(resolve => setTimeout(resolve, intervalMs));
    }
}

/**
 * Run all imports
 */
async function runImports(): Promise<void> {
    console.log('='.repeat(60));
    console.log('🚀 HOTELSTON STATIC DATA IMPORT');
    console.log('='.repeat(60));
    console.log(`📅 Started at: ${new Date().toISOString()}`);
    console.log(`🔧 Endpoint: ${HOTELSTON_STATIC_API_ENDPOINT}`);
    console.log(`👤 Username: ${HOTELSTON_CREDENTIALS.username}`);

    try {
        // Test database connection
        console.log('\n📡 Testing database connection...');
        await pool.query('SELECT 1');
        console.log('✅ Database connection successful!');

        // Run imports in order (dependencies first)
        const results: Record<string, ImportResult> = {};

        results.countries = await importCountries();
        results.cities = await importCities();
        results.hotelChains = await importHotelChains();
        results.hotelFacilities = await importHotelFacilities();
        results.hotelTypes = await importHotelTypes();
        results.hotels = await importHotels();

        // Summary
        console.log('\n' + '='.repeat(60));
        console.log('📋 IMPORT SUMMARY');
        console.log('='.repeat(60));

        let totalImported = 0;
        let totalErrors = 0;

        for (const [category, result] of Object.entries(results)) {
            const status = result.success ? '✅' : '⚠️';
            console.log(`${status} ${category}: ${result.imported} imported, ${result.errors} errors (${result.duration}ms)`);
            totalImported += result.imported;
            totalErrors += result.errors;
        }

        console.log('='.repeat(60));
        console.log(`📊 Total: ${totalImported} records imported, ${totalErrors} errors`);
        console.log(`📅 Completed at: ${new Date().toISOString()}`);

    } catch (error: any) {
        console.error('\n❌ Import failed:', error);
    }
}

// Main execution logic
async function main() {
    const args = process.argv.slice(2);
    const isMonitor = args.includes('--monitor');
    const monitorInterval = parseInt(args.find(a => a.startsWith('--interval='))?.split('=')[1] || '5');

    if (isMonitor) {
        await monitorAndImport(monitorInterval);
    } else {
        // Test API connectivity once first
        const apiAvailable = await testApiConnectivity();
        if (!apiAvailable) {
            console.log('⚠️ API is currently returning 404/Unavailable.');
            console.log('To wait for availability, run with: --monitor');
            process.exit(1);
        }
        await runImports();
    }

    await pool.end();
}

// Run main if this script is executed directly
if (require.main === module) {
    main().then(() => {
        console.log('\n🏁 Process completed!');
        process.exit(0);
    }).catch(error => {
        console.error('\n💥 Process failed:', error);
        process.exit(1);
    });
}

export {
    runImports,
    importCountries,
    importCities,
    importHotels,
    importHotelChains,
    importHotelFacilities,
    importHotelTypes,
    testApiConnectivity
};
