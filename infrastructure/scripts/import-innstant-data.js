#!/usr/bin/env node

/**
 * Import full dataset from Innstant Travel Static Data API to local PostgreSQL
 * 
 * This script fetches all static data from Innstant Travel API and imports it
 * into the local PostgreSQL database with proper data transformation and validation.
 */

const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

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
async function fetchInnstantData(endpoint) {
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
    console.error(`✗ Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

// Transform and validate airport data
function transformAirportData(data) {
  if (!data || !data.airports) return [];
  
  return data.airports.map(airport => ({
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
  })).filter(airport => airport.iataCode && airport.iataCode.length === 3);
}

// Transform and validate airline data
function transformAirlineData(data) {
  if (!data || !data.airlines) return [];
  
  return data.airlines.map(airline => ({
    iataCode: airline.iata_code || airline.code || '',
    icaoCode: airline.icao_code || null,
    name: airline.name || airline.airline_name || '',
    country: airline.country || null,
    logoUrl: airline.logo_url || null,
    website: airline.website || null,
    alliance: airline.alliance || null,
    isActive: airline.is_active !== false,
  })).filter(airline => airline.iataCode && airline.iataCode.length === 2);
}

// Transform and validate country data
function transformCountryData(data) {
  if (!data || !data.countries) return [];
  
  return data.countries.map(country => ({
    code: country.code || country.country_code || '',
    name: country.name || country.country_name || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(country => country.code && country.code.length === 2);
}

// Transform and validate city data
function transformCityData(data) {
  if (!data || !data.cities) return [];
  
  return data.cities.map(city => ({
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
  })).filter(city => city.name && city.country);
}

// Transform and validate currency data
function transformCurrencyData(data) {
  if (!data || !data.currencies) return [];
  
  return data.currencies.map(currency => ({
    code: currency.code || currency.currency_code || '',
    name: currency.name || currency.currency_name || '',
    symbol: currency.symbol || null,
    isActive: currency.is_active !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(currency => currency.code && currency.code.length === 3);
}

// Transform and validate hotel chain data
function transformHotelChainData(data) {
  if (!data || !data.hotelChains) return [];
  
  return data.hotelChains.map(chain => ({
    name: chain.name || chain.chain_name || '',
    code: chain.code || chain.chain_code || '',
    website: chain.website || null,
    logoUrl: chain.logo_url || null,
    country: chain.country || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(chain => chain.name && chain.code);
}

// Transform and validate hotel facility data
function transformHotelFacilityData(data) {
  if (!data || !data.hotelFacilities) return [];
  
  return data.hotelFacilities.map(facility => ({
    name: facility.name || facility.facility_name || '',
    category: facility.category || null,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(facility => facility.name);
}

// Transform and validate hotel type data
function transformHotelTypeData(data) {
  if (!data || !data.hotelTypes) return [];
  
  return data.hotelTypes.map(type => ({
    name: type.name || type.type_name || '',
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(type => type.name);
}

// Transform and validate loyalty program data
function transformLoyaltyProgramData(data) {
  if (!data || !data.loyaltyPrograms) return [];
  
  return data.loyaltyPrograms.map(program => ({
    id: program.id || program.program_id || '',
    name: program.name || program.program_name || '',
    logoUrl: program.logo_url || null,
    logoSymbolUrl: program.logo_symbol_url || null,
    alliance: program.alliance || null,
    ownerAirlineId: program.owner_airline_id || null,
    isActive: program.is_active !== false,
    createdAt: new Date(),
    updatedAt: new Date(),
  })).filter(program => program.id && program.name);
}

// Import function for each data type
async function importData() {
  console.log('🚀 Starting Innstant Travel Static Data Import...\n');

  for (const { name, endpoint } of ENDPOINTS) {
    console.log(`📦 Fetching ${name} data...`);
    const rawData = await fetchInnstantData(endpoint);
    
    if (!rawData) {
      console.log(`❌ Skipping ${name} - failed to fetch data\n`);
      continue;
    }

    console.log(`📊 Processing ${name} data...`);
    let transformedData = [];
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
      await prisma[modelName].deleteMany({});
      console.log(`🧹 Cleared existing ${name} data`);

      // Import new data
      await prisma[modelName].createMany({
        data: transformedData,
        skipDuplicates: true,
      });

      console.log(`✅ Successfully imported ${transformedData.length} ${name} records\n`);
    } catch (error) {
      console.error(`❌ Failed to import ${name}:`, error.message);
      console.log('');
    }
  }
}

// Generate summary report
async function generateReport() {
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
async function main() {
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
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { importData, generateReport };