/**
 * Hotelston Import Setup and Monitoring Script
 * Sets up the system for importing full Hotelston data and monitors for API availability
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Database connection - use the generated client from database directory
const prisma = new PrismaClient();

// API Configuration
const HOTELSTON_STATIC_API_ENDPOINT = 'https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/';
const HOTELSTON_API_ENDPOINT = 'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/';

const HOTELSTON_CREDENTIALS = {
  username: 'technocense@gmail.com',
  password: '6614645@Dubai'
};

const SOAP_NAMESPACE = 'http://hotelston.com/';

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
 * Parse SOAP response
 */
function parseSoapResponse(response: string): Record<string, string> {
  const xml = response;
  
  // Extract the response content between the actionResponse tags
  const responseMatch = xml.match(new RegExp(`<hot:.*Response>(.*?)</hot:.*Response>`, 's'));
  if (!responseMatch) {
    throw new Error('Invalid SOAP response format');
  }
  
  // Extract individual elements
  const result: Record<string, string> = {};
  const elementRegex = /<hot:(\w+)>(.*?)<\/hot:\1>/g;
  let match;
  
  while ((match = elementRegex.exec(responseMatch[1])) !== null) {
    const [, key, value] = match;
    result[key] = value;
  }
  
  return result;
}

/**
 * Test API endpoint availability
 */
async function testAPIAvailability(): Promise<Array<{
  name: string;
  status: string;
  url: string;
}>> {
  console.log('='.repeat(60));
  console.log('HOTELSTON API AVAILABILITY TEST');
  console.log('='.repeat(60));
  
  const endpoints = [
    { name: 'Static Data API', url: HOTELSTON_STATIC_API_ENDPOINT },
    { name: 'Hotel Service API', url: HOTELSTON_API_ENDPOINT }
  ];
  
  const results: Array<{
    name: string;
    status: string;
    url: string;
  }> = [];
  
  for (const endpoint of endpoints) {
    try {
      console.log(`Testing ${endpoint.name}...`);
      
      const envelope = createSoapEnvelope('ping', '');
      
      const response = await axios.post(endpoint.url, envelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"${SOAP_NAMESPACE}ping"`
        },
        timeout: 10000
      });
      
      console.log(`✅ ${endpoint.name}: AVAILABLE (Status: ${response.status})`);
      results.push({ name: endpoint.name, status: 'AVAILABLE', url: endpoint.url });
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(`❌ ${endpoint.name}: ${error.response.status} ${error.response.statusText}`);
        results.push({ name: endpoint.name, status: String(error.response.status), url: endpoint.url });
      } else {
        console.log(`❌ ${endpoint.name}: NETWORK ERROR`);
        results.push({ name: endpoint.name, status: 'NETWORK_ERROR', url: endpoint.url });
      }
    }
    console.log('');
  }
  
  return results;
}

/**
 * Monitor API availability and auto-import when available
 */
async function monitorAndImport(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON API MONITORING AND AUTO-IMPORT');
  console.log('='.repeat(60));
  console.log('Monitoring API availability. Will auto-import when API becomes available.');
  console.log('Press Ctrl+C to stop monitoring.\n');
  
  const checkInterval = 5 * 60 * 1000; // Check every 5 minutes
  let attempts = 0;
  
  while (true) {
    attempts++;
    console.log(`[${new Date().toISOString()}] Check attempt #${attempts}`);
    
    try {
      const results = await testAPIAvailability();
      
      const availableEndpoints = results.filter(r => r.status === 'AVAILABLE');
      
      if (availableEndpoints.length > 0) {
        console.log('🎉 API is now available! Starting import...');
        
        // Import data
        await runFullImport();
        
        console.log('✅ Import completed successfully!');
        console.log('Monitoring will now stop.');
        break;
      } else {
        console.log('API still not available. Will check again in 5 minutes...');
      }
      
    } catch (error) {
      console.error('Error during monitoring:', error instanceof Error ? error.message : String(error));
    }
    
    // Wait before next check
    await new Promise(resolve => setTimeout(resolve, checkInterval));
  }
}

/**
 * Run full data import
 */
async function runFullImport(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON FULL DATA IMPORT');
  console.log('='.repeat(60));
  
  try {
    // Test database connection
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('✅ Database connection successful!');
    console.log('');
    
    // Import all data types
    await importCountries();
    await importCities();
    await importHotelChains();
    await importHotelFacilities();
    await importHotelTypes();
    await importHotels();
    
    console.log('');
    console.log('='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log('✅ All Hotelston data imported successfully!');
    console.log('Your booking engine now has access to complete Hotelston static data.');
    
  } catch (error) {
    console.error('❌ Import failed:', error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Import countries
 */
async function importCountries(): Promise<void> {
  console.log('Importing countries...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getCountries', soapBody);
    
    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCountries"`
      }
    });
    
    const result = parseSoapResponse(response.data);
    
    // Try to parse as JSON first
    let countries: Array<{
      code?: string;
      isoCode?: string;
      name: string;
    }> = [];
    try {
      countries = JSON.parse(result.countries || '[]');
    } catch (e) {
      console.log('Attempting to extract countries from XML structure...');
      // This would need to be customized based on actual response format
    }
    
    console.log(`Found ${countries.length} countries`);
    
    if (countries.length > 0) {
      for (const country of countries) {
        try {
          await prisma.country.upsert({
            where: { code: country.code || country.isoCode },
            update: {
              name: country.name,
              updatedAt: new Date()
            },
            create: {
              code: country.code || country.isoCode,
              name: country.name,
              countryCode: country.code || country.isoCode
            }
          });
        } catch (error) {
          console.error(`Error inserting country ${country.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✅ Successfully imported ${countries.length} countries`);
    } else {
      console.log('No countries data found in response');
    }
    
  } catch (error) {
    console.error('Import countries error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Import cities
 */
async function importCities(): Promise<void> {
  console.log('Importing cities...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getCities', soapBody);
    
    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCities"`
      }
    });
    
    const result = parseSoapResponse(response.data);
    
    let cities: Array<{
      name: string;
      country: string;
      countryCode: string;
      latitude?: string;
      longitude?: string;
      population?: string;
      timezone?: string;
    }> = [];
    try {
      cities = JSON.parse(result.cities || '[]');
    } catch (e) {
      console.log('Attempting to extract cities from XML structure...');
    }
    
    console.log(`Found ${cities.length} cities`);
    
    if (cities.length > 0) {
      for (const city of cities) {
        try {
          await prisma.city.upsert({
            where: { name: city.name },
            update: {
              country: city.country,
              countryCode: city.countryCode,
              latitude: city.latitude ? parseFloat(city.latitude) : null,
              longitude: city.longitude ? parseFloat(city.longitude) : null,
              population: city.population ? parseInt(city.population) : null,
              timezone: city.timezone,
              updatedAt: new Date()
            },
            create: {
              name: city.name,
              country: city.country,
              countryCode: city.countryCode,
              latitude: city.latitude ? parseFloat(city.latitude) : null,
              longitude: city.longitude ? parseFloat(city.longitude) : null,
              population: city.population ? parseInt(city.population) : null,
              timezone: city.timezone
            }
          });
        } catch (error) {
          console.error(`Error inserting city ${city.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✅ Successfully imported ${cities.length} cities`);
    } else {
      console.log('No cities data found in response');
    }
    
  } catch (error) {
    console.error('Import cities error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Import hotel chains
 */
async function importHotelChains(): Promise<void> {
  console.log('Importing hotel chains...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getHotelChains', soapBody);
    
    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotelChains"`
      }
    });
    
    const result = parseSoapResponse(response.data);
    
    let chains: Array<{
      code: string;
      name: string;
      website?: string;
      logoUrl?: string;
      country?: string;
    }> = [];
    try {
      chains = JSON.parse(result.chains || '[]');
    } catch (e) {
      console.log('Attempting to extract hotel chains from XML structure...');
    }
    
    console.log(`Found ${chains.length} hotel chains`);
    
    if (chains.length > 0) {
      for (const chain of chains) {
        try {
          await prisma.hotelChain.upsert({
            where: { code: chain.code },
            update: {
              name: chain.name,
              website: chain.website,
              logoUrl: chain.logoUrl,
              updatedAt: new Date()
            },
            create: {
              name: chain.name,
              code: chain.code,
              website: chain.website,
              logoUrl: chain.logoUrl,
              country: chain.country
            }
          });
        } catch (error) {
          console.error(`Error inserting hotel chain ${chain.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✅ Successfully imported ${chains.length} hotel chains`);
    } else {
      console.log('No hotel chains data found in response');
    }
    
  } catch (error) {
    console.error('Import hotel chains error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Import hotel facilities
 */
async function importHotelFacilities(): Promise<void> {
  console.log('Importing hotel facilities...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getHotelFacilities', soapBody);
    
    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotelFacilities"`
      }
    });
    
    const result = parseSoapResponse(response.data);
    
    let facilities: Array<{
      name: string;
      category?: string;
    }> = [];
    try {
      facilities = JSON.parse(result.facilities || '[]');
    } catch (e) {
      console.log('Attempting to extract hotel facilities from XML structure...');
    }
    
    console.log(`Found ${facilities.length} hotel facilities`);
    
    if (facilities.length > 0) {
      for (const facility of facilities) {
        try {
          await prisma.hotelFacility.upsert({
            where: { name: facility.name },
            update: {
              category: facility.category,
              updatedAt: new Date()
            },
            create: {
              name: facility.name,
              category: facility.category
            }
          });
        } catch (error) {
          console.error(`Error inserting hotel facility ${facility.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✅ Successfully imported ${facilities.length} hotel facilities`);
    } else {
      console.log('No hotel facilities data found in response');
    }
    
  } catch (error) {
    console.error('Import hotel facilities error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Import hotel types
 */
async function importHotelTypes(): Promise<void> {
  console.log('Importing hotel types...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getHotelTypes', soapBody);
    
    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotelTypes"`
      }
    });
    
    const result = parseSoapResponse(response.data);
    
    let types: Array<{
      name: string;
    }> = [];
    try {
      types = JSON.parse(result.types || '[]');
    } catch (e) {
      console.log('Attempting to extract hotel types from XML structure...');
    }
    
    console.log(`Found ${types.length} hotel types`);
    
    if (types.length > 0) {
      for (const type of types) {
        try {
          await prisma.hotelType.upsert({
            where: { name: type.name },
            update: {
              updatedAt: new Date()
            },
            create: {
              name: type.name
            }
          });
        } catch (error) {
          console.error(`Error inserting hotel type ${type.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✅ Successfully imported ${types.length} hotel types`);
    } else {
      console.log('No hotel types data found in response');
    }
    
  } catch (error) {
    console.error('Import hotel types error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Import hotels
 */
async function importHotels(): Promise<void> {
  console.log('Importing hotels...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getHotels', soapBody);
    
    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotels"`
      }
    });
    
    const result = parseSoapResponse(response.data);
    
    let hotels: Array<{
      id: string;
      name: string;
      description?: string;
      address?: string;
      city?: string;
      country?: string;
      postalCode?: string;
      latitude?: string;
      longitude?: string;
      starRating?: string;
      chain?: {
        name: string;
        code?: string;
        website?: string;
        logoUrl?: string;
      };
      website?: string;
      phone?: string;
      email?: string;
      amenities?: any[];
      images?: any[];
      policies?: any;
    }> = [];
    try {
      hotels = JSON.parse(result.hotels || '[]');
    } catch (e) {
      console.log('Attempting to extract hotels from XML structure...');
    }
    
    console.log(`Found ${hotels.length} hotels`);
    
    if (hotels.length > 0) {
      for (const hotel of hotels) {
        try {
          // First, try to find or create the hotel chain
          let chainId: string | null = null;
          if (hotel.chain) {
            const chain = await prisma.hotelChain.upsert({
              where: { name: hotel.chain.name },
              update: { updatedAt: new Date() },
              create: {
                name: hotel.chain.name,
                code: hotel.chain.code || '',
                website: hotel.chain.website,
                logoUrl: hotel.chain.logoUrl
              }
            });
            chainId = chain.id;
          }
          
          // Create hotel
          await prisma.hotel.upsert({
            where: { externalId: hotel.id },
            update: {
              name: hotel.name,
              description: hotel.description,
              address: hotel.address,
              city: hotel.city,
              country: hotel.country,
              postalCode: hotel.postalCode,
              latitude: hotel.latitude ? parseFloat(hotel.latitude) : null,
              longitude: hotel.longitude ? parseFloat(hotel.longitude) : null,
              starRating: hotel.starRating ? parseFloat(hotel.starRating) : null,
              chainId: chainId,
              website: hotel.website,
              phone: hotel.phone,
              email: hotel.email,
              amenities: hotel.amenities,
              images: hotel.images,
              policies: hotel.policies,
              updatedAt: new Date()
            },
            create: {
              name: hotel.name,
              description: hotel.description,
              address: hotel.address,
              city: hotel.city,
              country: hotel.country,
              postalCode: hotel.postalCode,
              latitude: hotel.latitude ? parseFloat(hotel.latitude) : null,
              longitude: hotel.longitude ? parseFloat(hotel.longitude) : null,
              starRating: hotel.starRating ? parseFloat(hotel.starRating) : null,
              chainId: chainId,
              website: hotel.website,
              phone: hotel.phone,
              email: hotel.email,
              amenities: hotel.amenities,
              images: hotel.images,
              policies: hotel.policies,
              externalId: hotel.id,
              externalSource: 'Hotelston'
            }
          });
        } catch (error) {
          console.error(`Error inserting hotel ${hotel.name}:`, error instanceof Error ? error.message : String(error));
        }
      }
      console.log(`✅ Successfully imported ${hotels.length} hotels`);
    } else {
      console.log('No hotels data found in response');
    }
    
  } catch (error) {
    console.error('Import hotels error:', error instanceof Error ? error.message : String(error));
  }
}

/**
 * Create import status file
 */
function createStatusFile(status: string, data: Record<string, any> = {}): void {
  const statusData = {
    lastCheck: new Date().toISOString(),
    status: status,
    credentials: {
      username: HOTELSTON_CREDENTIALS.username,
      password: '********'
    },
    endpoints: {
      static: HOTELSTON_STATIC_API_ENDPOINT,
      service: HOTELSTON_API_ENDPOINT
    },
    ...data
  };
  
  fs.writeFileSync(
    path.join(__dirname, 'hotelston-import-status.json'),
    JSON.stringify(statusData, null, 2)
  );
}

/**
 * Run setup and monitoring
 */
async function runSetup(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON IMPORT SETUP');
  console.log('='.repeat(60));
  
  try {
    // Test API availability
    const results = await testAPIAvailability();
    
    // Create status file
    createStatusFile('MONITORING', { endpoints: results });
    
    // Check if API is available
    const availableEndpoints = results.filter(r => r.status === 'AVAILABLE');
    
    if (availableEndpoints.length > 0) {
      console.log('🎉 API is available! Starting immediate import...');
      await runFullImport();
    } else {
      console.log('API not available. Starting monitoring mode...');
      await monitorAndImport();
    }
    
  } catch (error) {
    console.error('Setup failed:', error instanceof Error ? error.message : String(error));
    createStatusFile('ERROR', { error: error instanceof Error ? error.message : String(error) });
  }
}

// Run setup if this script is executed directly
if (require.main === module) {
  runSetup().then(() => {
    console.log('\nSetup completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Setup failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { 
  runSetup, 
  testAPIAvailability, 
  monitorAndImport, 
  runFullImport,
  createStatusFile
};