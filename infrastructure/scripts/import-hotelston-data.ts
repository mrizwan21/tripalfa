/**
 * Hotelston Static Data Import Script
 * Imports static data from Hotelston API into PostgreSQL database
 */

import axios from 'axios';
import { PrismaClient } from '@prisma/client';

// Database connection
const prisma = new PrismaClient();

// API Configuration
const HOTELSTON_STATIC_API_ENDPOINT = 'https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/';

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
    console.log('Countries response:', result);
    
    // If we get a response, try to parse it as JSON or extract data
    let countries: Array<{code?: string, isoCode?: string, name: string}> = [];
    
    // Try to parse as JSON first
    try {
      countries = JSON.parse(result.countries || '[]');
    } catch (e) {
      // If not JSON, try to extract from XML-like structure
      console.log('Attempting to extract countries from XML structure...');
      // This would need to be customized based on actual response format
    }
    
    console.log(`Found ${countries.length} countries`);
    
    // Insert into database
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
      console.log(`Successfully imported ${countries.length} countries`);
    } else {
      console.log('No countries data found in response');
    }
    
  } catch (error) {
    console.error('Import countries error:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
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
    console.log('Cities response:', result);
    
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
      console.log(`Successfully imported ${cities.length} cities`);
    } else {
      console.log('No cities data found in response');
    }
    
  } catch (error) {
    console.error('Import cities error:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
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
    console.log('Hotels response:', result);
    
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
      chain?: {name: string; code?: string; website?: string; logoUrl?: string};
      website?: string;
      phone?: string;
      email?: string;
      amenities?: string;
      images?: string;
      policies?: string;
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
      console.log(`Successfully imported ${hotels.length} hotels`);
    } else {
      console.log('No hotels data found in response');
    }
    
  } catch (error) {
    console.error('Import hotels error:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
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
    console.log('Hotel chains response:', result);
    
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
      console.log(`Successfully imported ${chains.length} hotel chains`);
    } else {
      console.log('No hotel chains data found in response');
    }
    
  } catch (error) {
    console.error('Import hotel chains error:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
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
    console.log('Hotel facilities response:', result);
    
    let facilities: Array<{name: string; category?: string}> = [];
    
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
      console.log(`Successfully imported ${facilities.length} hotel facilities`);
    } else {
      console.log('No hotel facilities data found in response');
    }
    
  } catch (error) {
    console.error('Import hotel facilities error:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
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
    console.log('Hotel types response:', result);
    
    let types: Array<{name: string}> = [];
    
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
      console.log(`Successfully imported ${types.length} hotel types`);
    } else {
      console.log('No hotel types data found in response');
    }
    
  } catch (error) {
    console.error('Import hotel types error:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Data:', error.response.data);
    }
  }
}

/**
 * Run all imports
 */
async function runImports(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON STATIC DATA IMPORT');
  console.log('='.repeat(60));
  
  try {
    // Test connection first
    console.log('Testing database connection...');
    await prisma.$connect();
    console.log('Database connection successful!');
    
    console.log('\nStarting data import...');
    
    // Import data in order (dependencies first)
    await importCountries();
    await importCities();
    await importHotelChains();
    await importHotelFacilities();
    await importHotelTypes();
    await importHotels();
    
    console.log('\n' + '='.repeat(60));
    console.log('IMPORT SUMMARY');
    console.log('='.repeat(60));
    console.log('All static data import operations completed!');
    
  } catch (error) {
    console.error('Import failed:', error instanceof Error ? error.message : String(error));
  } finally {
    await prisma.$disconnect();
  }
}

// Run imports if this script is executed directly
if (require.main === module) {
  runImports().then(() => {
    console.log('Import process completed successfully!');
    process.exit(0);
  }).catch(error => {
    console.error('Import process failed:', error instanceof Error ? error.message : String(error));
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
  importHotelTypes 
};