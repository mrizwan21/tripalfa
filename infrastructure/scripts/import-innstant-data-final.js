#!/usr/bin/env node

/**
 * Final import script for Innstant Travel Static Data API
 * Handles the correct API response structure (objects with numeric keys)
 */

/* eslint-disable no-undef */
/* eslint-env node */

const { Client } = require('pg');
const fetch = require('node-fetch').default;

// Innstant Travel API Configuration
const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

// Database connection
const client = new Client({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/staticdatabase',
});

// API endpoints to fetch
const ENDPOINTS = [
  { name: 'airports', endpoint: '/airports', table: 'airports' },
  { name: 'airlines', endpoint: '/airlines', table: 'airlines' },
  { name: 'countries', endpoint: '/countries', table: 'nationalities' },
  { name: 'cities', endpoint: '/cities', table: 'cities' },
  { name: 'currencies', endpoint: '/currencies', table: 'currencies' },
  { name: 'hotel-chains', endpoint: '/hotel-chains', table: 'hotel_chains' },
  { name: 'hotel-facilities', endpoint: '/hotel-facilities', table: 'hotel_facilities' },
  { name: 'hotel-types', endpoint: '/hotel-types', table: 'hotel_types' },
  { name: 'loyalty-programs', endpoint: '/loyalty-programs', table: 'loyalty_programs' },
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
    console.log(`Successfully fetched ${endpoint}: ${JSON.stringify(data).length} bytes`);
    return data;
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error.message);
    return null;
  }
}

// Transform and validate airport data
function transformAirportData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const airports = Object.values(data);
  
  return airports.map(airport => ({
    iata_code: airport.iata || airport.code || '',
    icao_code: airport.icao || null,
    name: airport.name || airport.airport_name || '',
    city: airport.city || airport.city_name || '',
    country: airport.country || airport.country_name || '',
    country_code: airport.country || '',
    latitude: airport.latitude ? parseFloat(airport.latitude) : null,
    longitude: airport.longitude ? parseFloat(airport.longitude) : null,
    timezone: airport.timezone || null,
    is_active: airport.is_active !== false,
  })).filter(airport => airport.iata_code && airport.iata_code.length === 3);
}

// Transform and validate airline data
function transformAirlineData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const airlines = Object.values(data);
  
  return airlines.map(airline => ({
    iata_code: airline.iata || airline.code || '',
    icao_code: airline.icao || null,
    name: airline.name || airline.airline_name || '',
    country: airline.country || 'Unknown',
    logo_url: airline.logo_url || null,
    website: airline.website || null,
    alliance: airline.alliance || null,
    is_active: airline.is_active !== false,
  })).filter(airline => airline.iata_code && airline.iata_code.length === 2);
}

// Transform and validate country data
function transformCountryData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const countries = Object.values(data);
  
  return countries.map(country => ({
    code: country.id || country.code || country.country_code || '',
    name: country.name || country.country_name || '',
  })).filter(country => country.code && country.code.length === 2);
}

// Transform and validate city data
function transformCityData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const cities = Object.values(data);
  
  return cities.map(city => ({
    name: city.name || city.city_name || '',
    country: city.country || city.country_name || '',
    country_code: city.country || '',
    latitude: city.latitude ? parseFloat(city.latitude) : null,
    longitude: city.longitude ? parseFloat(city.longitude) : null,
    population: city.population ? parseInt(city.population, 10) : null,
    timezone: city.timezone || null,
    is_popular: city.is_popular || false,
    image_url: city.image_url || null,
  })).filter(city => city.name && city.country);
}

// Transform and validate currency data
function transformCurrencyData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const currencies = Object.values(data);
  
  return currencies.map(currency => ({
    code: currency.currencyId || currency.code || currency.currency_code || '',
    name: currency.name || currency.currency_name || '',
    symbol: currency.sign || currency.symbol || null,
    is_active: currency.active !== false,
  })).filter(currency => currency.code && currency.code.length === 3);
}

// Transform and validate hotel chain data
function transformHotelChainData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const chains = Object.values(data);
  
  return chains.map(chain => ({
    name: chain.name || chain.chain_name || '',
    code: chain.code || chain.chain_code || '',
    website: chain.website || null,
    logo_url: chain.logo_url || null,
    country: chain.country || null,
  })).filter(chain => chain.name && chain.code);
}

// Transform and validate hotel facility data
function transformHotelFacilityData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const facilities = Object.values(data);
  
  return facilities.map(facility => ({
    name: facility.name || facility.facility_name || '',
    category: facility.category || null,
  })).filter(facility => facility.name);
}

// Transform and validate hotel type data
function transformHotelTypeData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const types = Object.values(data);
  
  return types.map(type => ({
    name: type.name || type.type_name || '',
  })).filter(type => type.name);
}

// Transform and validate loyalty program data
function transformLoyaltyProgramData(data) {
  if (!data || typeof data !== 'object') return [];
  
  // Convert object with numeric keys to array
  const programs = Object.values(data);
  
  return programs.map(program => ({
    id: program.id || program.program_id || '',
    name: program.name || program.program_name || '',
    logo_url: program.logo_url || null,
    logo_symbol_url: program.logo_symbol_url || null,
    alliance: program.alliance || null,
    owner_airline_id: program.owner_airline_id || null,
    is_active: program.is_active !== false,
  })).filter(program => program.id && program.name);
}

// Import function for each data type
async function importData() {
  console.log('🚀 Starting Innstant Travel Static Data Import...\n');

  for (const { name, endpoint, table } of ENDPOINTS) {
    console.log(`Fetching ${name} data...`);
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
      // Clear existing data for this table
      await client.query(`DELETE FROM ${table}`);
      console.log(`🧹 Cleared existing ${name} data`);

      // Import new data
      if (transformedData.length > 0) {
        await insertBatch(table, transformedData);
        console.log(`✅ Successfully imported ${transformedData.length} ${name} records\n`);
      }
    } catch (error) {
      console.error(`❌ Failed to import ${name}:`, error.message);
      console.log('');
    }
  }
}

// Batch insert function
async function insertBatch(table, data) {
  if (data.length === 0) return;

  const columns = Object.keys(data[0]);
  const values = data.map(item => 
    columns.map(col => {
      const value = item[col];
      if (value === null || value === undefined) return 'NULL';
      if (typeof value === 'string') return `'${value.replace(/'/g, "''")}'`;
      if (typeof value === 'boolean') return value ? 'true' : 'false';
      return value;
    }).join(', ')
  );

  const query = `
    INSERT INTO ${table} (${columns.join(', ')}) 
    VALUES ${values.map(v => `(${v})`).join(', ')}
  `;

  await client.query(query);
}

// Generate summary report
async function generateReport() {
  console.log('📈 Import Summary Report:');
  console.log('========================');
  
  const tables = [
    { name: 'Airports', table: 'airports' },
    { name: 'Airlines', table: 'airlines' },
    { name: 'Countries', table: 'nationalities' },
    { name: 'Cities', table: 'cities' },
    { name: 'Currencies', table: 'currencies' },
    { name: 'Hotel Chains', table: 'hotel_chains' },
    { name: 'Hotel Facilities', table: 'hotel_facilities' },
    { name: 'Hotel Types', table: 'hotel_types' },
    { name: 'Loyalty Programs', table: 'loyalty_programs' },
  ];

  for (const { name, table } of tables) {
    const result = await client.query(`SELECT COUNT(*) as count FROM ${table}`);
    console.log(`${name}: ${result.rows[0].count} records`);
  }

  console.log('\n🎉 Import completed successfully!');
  console.log('💡 You can now use the static data in your booking engine.');
}

// Main execution
async function main() {
  try {
    console.log('🎯 Innstant Travel Static Data Import Tool (Final Version)');
    console.log('========================================================\n');

    // Connect to database
    await client.connect();
    console.log('🔗 Connected to PostgreSQL database\n');

    // Run import
    await importData();

    // Generate report
    await generateReport();

  } catch (error) {
    console.error('💥 Import failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the script
if (require.main === module) {
  main();
}

module.exports = { importData, generateReport };