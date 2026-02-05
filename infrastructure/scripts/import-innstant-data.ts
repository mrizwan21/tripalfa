#!/usr/bin/env node

/**
 * Import full dataset from Innstant Travel Static Data API to local PostgreSQL
 * 
 * This script fetches all static data from Innstant Travel API and imports it
 * into the local PostgreSQL database with proper data transformation and validation.
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

// Innstant Travel API Configuration
const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

// Database connection
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// API endpoints to fetch
const ENDPOINTS = [
  { name: 'airports', endpoint: '/airports' },
  { name: 'airlines', endpoint: '/airlines' },
  { name: 'countries', endpoint: '/countries' },
  { name: 'cities', endpoint: '/cities' },
  { name: 'currencies', endpoint: '/currencies' },
  { name: 'hotel-chains', endpoint: '/hotel-chains' },
  { name: 'hotel-facilities', endpoint: '/hotel-facilities' },
  { name: 'hotel-types', endpoint: '/hotel-types' },
  { name: 'loyalty-programs', endpoint: '/loyalty-programs' },
];

// Helper function to fetch data from Innstant API
async function fetchInnstantData(endpoint: string): Promise<any> {
  try {
    const response = await fetch(`${INNSTANT_BASE_URL}${endpoint}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${INNSTANT_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    console.log(`✓ Successfully fetched ${endpoint}: ${JSON.stringify(data).length} bytes`);
    return data;
  } catch (error) {
    console.error(`✗ Failed to fetch ${endpoint}:`, error instanceof Error ? error.message : String(error));
    return null;
  }
}

// Transform and validate airport data
function transformAirportData(data: any): Array<{
  iataCode: string;
  icaoCode: string | null;
  name: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  timezone: string | null;
  isActive: boolean;
}> {
  if (!data || !data.airports) return [];
  
  return data.airports.map((airport: any) => ({
    iataCode: airport.iata_code || airport.code || '',
    icaoCode: airport.icao_code || null,
    name: airport.name || airport.airport_name || '',
    city: airport.city || airport.city_name || '',
    country: airport.country || airport.country_name || '',
    countryCode: airport.country_code || '',
    latitude: airport.latitude ? parseFloat(airport.latitude) : null,
    longitude: airport.longitude ? parseFloat(airport.longitude) : null,
    timezone: airport.timezone || null,
    isActive: airport.is_active !== false,
  })).filter((airport: any) => airport.iataCode && airport.iataCode.length === 3);
}

// Transform and validate airline data
function transformAirlineData(data: any): Array<{
  iataCode: string;
  icaoCode: string | null;
  name: string;
  country: string | null;
  logoUrl: string | null;
  website: string | null;
  alliance: string | null;
  isActive: boolean;
}> {
  if (!data || !data.airlines) return [];
  
  return data.airlines.map((airline: any) => ({
    iataCode: airline.iata_code || airline.code || '',
    icaoCode: airline.icao_code || null,
    name: airline.name || airline.airline_name || '',
    country: airline.country || null,
    logoUrl: airline.logo_url || null,
    website: airline.website || null,
    alliance: airline.alliance || null,
    isActive: airline.is_active !== false,
  })).filter((airline: any) => airline.iataCode && airline.iataCode.length === 2);
}

// Transform and validate country data
function transformCountryData(data: any): Array<{
  code: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.countries) return [];
  
  return data.countries.map((country: any) => ({
    code: country.code || country.country_code || '',
    name: country.name || country.country_name || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((country: any) => country.code && country.code.length === 2);
}

// Transform and validate city data
function transformCityData(data: any): Array<{
  name: string;
  country: string;
  countryCode: string;
  latitude: number | null;
  longitude: number | null;
  population: number | null;
  timezone: string | null;
  isPopular: boolean;
  imageUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.cities) return [];
  
  return data.cities.map((city: any) => ({
    name: city.name || city.city_name || '',
    country: city.country || city.country_name || '',
    countryCode: city.country_code || '',
    latitude: city.latitude ? parseFloat(city.latitude) : null,
    longitude: city.longitude ? parseFloat(city.longitude) : null,
    population: city.population ? parseInt(city.population, 10) : null,
    timezone: city.timezone || null,
    isPopular: city.is_popular || false,
    imageUrl: city.image_url || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((city: any) => city.name && city.country);
}

// Transform and validate currency data
function transformCurrencyData(data: any): Array<{
  code: string;
  name: string;
  symbol: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.currencies) return [];
  
  return data.currencies.map((currency: any) => ({
    code: currency.code || currency.currency_code || '',
    name: currency.name || currency.currency_name || '',
    symbol: currency.symbol || null,
    isActive: currency.is_active !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((currency: any) => currency.code && currency.code.length === 3);
}

// Transform and validate hotel chain data
function transformHotelChainData(data: any): Array<{
  name: string;
  code: string;
  website: string | null;
  logoUrl: string | null;
  country: string | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.hotelChains) return [];
  
  return data.hotelChains.map((chain: any) => ({
    name: chain.name || chain.chain_name || '',
    code: chain.code || chain.chain_code || '',
    website: chain.website || null,
    logoUrl: chain.logo_url || null,
    country: chain.country || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((chain: any) => chain.name && chain.code);
}

// Transform and validate hotel facility data
function transformHotelFacilityData(data: any): Array<{
  name: string;
  category: string | null;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.hotelFacilities) return [];
  
  return data.hotelFacilities.map((facility: any) => ({
    name: facility.name || facility.facility_name || '',
    category: facility.category || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((facility: any) => facility.name);
}

// Transform and validate hotel type data
function transformHotelTypeData(data: any): Array<{
  name: string;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.hotelTypes) return [];
  
  return data.hotelTypes.map((type: any) => ({
    name: type.name || type.type_name || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((type: any) => type.name);
}

// Transform and validate loyalty program data
function transformLoyaltyProgramData(data: any): Array<{
  id: string;
  name: string;
  logoUrl: string | null;
  logoSymbolUrl: string | null;
  alliance: string | null;
  ownerAirlineId: string | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}> {
  if (!data || !data.loyaltyPrograms) return [];
  
  return data.loyaltyPrograms.map((program: any) => ({
    id: program.id || program.program_id || '',
    name: program.name || program.program_name || '',
    logoUrl: program.logo_url || null,
    logoSymbolUrl: program.logo_symbol_url || null,
    alliance: program.alliance || null,
    ownerAirlineId: program.owner_airline_id || null,
    isActive: program.is_active !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter((program: any) => program.id && program.name);
}

// Import function for each data type
async function importData(): Promise<void> {
  console.log('🚀 Starting Innstant Travel Static Data Import...\n');

  for (const { name, endpoint } of ENDPOINTS) {
    console.log(`📦 Fetching ${name} data...`);
    const rawData = await fetchInnstantData(endpoint);
    
    if (!rawData) {
      console.log(`❌ Skipping ${name} - failed to fetch data\n`);
      continue;
    }

    console.log(`📊 Processing ${name} data...`);
    let transformedData: any[] = [];
    let modelName = '';

    switch (name) {
      case 'airports':
        transformedData = transformAirportData(rawData);
        modelName = 'Airport';
        break;
      case 'airlines':
        transformedData = transformAirlineData(rawData);
        modelName = 'Airline';
        break;
      case 'countries':
        transformedData = transformCountryData(rawData);
        modelName = 'Nationality';
        break;
      case 'cities':
        transformedData = transformCityData(rawData);
        modelName = 'City';
        break;
      case 'currencies':
        transformedData = transformCurrencyData(rawData);
        modelName = 'Currency';
        break;
      case 'hotel-chains':
        transformedData = transformHotelChainData(rawData);
        modelName = 'HotelChain';
        break;
      case 'hotel-facilities':
        transformedData = transformHotelFacilityData(rawData);
        modelName = 'HotelFacility';
        break;
      case 'hotel-types':
        transformedData = transformHotelTypeData(rawData);
        modelName = 'HotelType';
        break;
      case 'loyalty-programs':
        transformedData = transformLoyaltyProgramData(rawData);
        modelName = 'LoyaltyProgram';
        break;
    }

    if (transformedData.length === 0) {
      console.log(`⚠️  No valid data found for ${name}\n`);
      continue;
    }

    console.log(`💾 Importing ${transformedData.length} ${name} records...`);
    
    try {
      // Clear existing data for this model
      await prisma[modelName as keyof typeof prisma].deleteMany({});
      console.log(`🧹 Cleared existing ${name} data`);

      // Import new data
      await prisma[modelName as keyof typeof prisma].createMany({
        data: transformedData,
        skipDuplicates: true,
      });

      console.log(`✅ Successfully imported ${transformedData.length} ${name} records\n`);
    } catch (error) {
      console.error(`❌ Failed to import ${name}:`, error instanceof Error ? error.message : String(error));
      console.log('');
    }
  }
}

// Generate summary report
async function generateReport(): Promise<void> {
  console.log('📈 Import Summary Report:');
  console.log('========================');
  
  const counts = await Promise.all([
    prisma.airport.count(),
    prisma.airline.count(),
    prisma.nationality.count(),
    prisma.city.count(),
    prisma.currency.count(),
    prisma.hotelChain.count(),
    prisma.hotelFacility.count(),
    prisma.hotelType.count(),
    prisma.loyaltyProgram.count(),
  ]);

  const models = [
    'Airports', 'Airlines', 'Countries', 'Cities', 
    'Currencies', 'Hotel Chains', 'Hotel Facilities', 
    'Hotel Types', 'Loyalty Programs'
  ];

  models.forEach((model, index) => {
    console.log(`${model}: ${counts[index]} records`);
  });

  console.log('\n🎉 Import completed successfully!');
  console.log('💡 You can now use the static data in your booking engine.');
}

// Main execution
async function main(): Promise<void> {
  try {
    console.log('🎯 Innstant Travel Static Data Import Tool');
    console.log('==========================================\n');

    // Check database connection
    await prisma.$connect();
    console.log('🔗 Connected to PostgreSQL database\n');

    // Run import
    await importData();

    // Generate report
    await generateReport();

  } catch (error) {
    console.error('💥 Import failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

export { importData, generateReport };