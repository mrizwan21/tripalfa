#!/usr/bin/env node
/**
 * Test Innstant Static Data API - Fetch Sample Data
 * 
 * Usage: npx tsx scripts/test-innstant-data.ts
 */

import axios from 'axios';
import * as fs from 'fs';

const STATIC_DATA_URL = 'https://static-data.innstant-servers.com';
const API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';

async function fetchAllData() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        Innstant Static Data API - Data Fetch Test                ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const headers = {
    'X-API-Key': API_KEY,
    'Accept': 'application/json',
  };

  // Test countries endpoint
  console.log('📡 Fetching countries...');
  try {
    const countriesRes = await axios.get(`${STATIC_DATA_URL}/countries`, { headers, timeout: 60000 });
    const countries = Array.isArray(countriesRes.data) ? countriesRes.data : [];
    console.log(`   ✅ Countries: ${countries.length}`);
    console.log(`   📄 Sample: ${JSON.stringify(countries[0], null, 2)}`);
    
    // Save to file
    fs.writeFileSync('./innstant-countries.json', JSON.stringify(countries, null, 2));
    console.log(`   💾 Saved to innstant-countries.json`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test currencies endpoint
  console.log('\n📡 Fetching currencies...');
  try {
    const currenciesRes = await axios.get(`${STATIC_DATA_URL}/currencies`, { headers, timeout: 60000 });
    const currencies = Array.isArray(currenciesRes.data) ? currenciesRes.data : [];
    console.log(`   ✅ Currencies: ${currencies.length}`);
    console.log(`   📄 Sample: ${JSON.stringify(currencies[0], null, 2)}`);
    
    // Save to file
    fs.writeFileSync('./innstant-currencies.json', JSON.stringify(currencies, null, 2));
    console.log(`   💾 Saved to innstant-currencies.json`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Test hotels endpoint with different parameters
  console.log('\n📡 Testing hotels endpoint with parameters...');
  
  const hotelTests = [
    { page: 1, limit: 10 },
    { country: 'US', limit: 10 },
    { country_code: 'US', limit: 10 },
    { destination: 'NYC', limit: 10 },
    { city: 'Dubai', limit: 10 },
    { hotel_id: '12345' },
    { ids: ['12345', '67890'] },
  ];

  for (const params of hotelTests) {
    console.log(`\n   Testing params: ${JSON.stringify(params)}`);
    try {
      const response = await axios.get(`${STATIC_DATA_URL}/hotels`, { 
        headers, 
        params,
        timeout: 30000 
      });
      
      if (response.data && !response.data.error) {
        console.log(`   ✅ Success!`);
        console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 500)}...`);
      } else {
        console.log(`   ⚠️ Empty response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  // Try POST request for hotels
  console.log('\n📡 Testing POST /hotels...');
  const postTests = [
    { request: 'getHotels', limit: 10 },
    { request: 'searchHotels', limit: 10 },
    { action: 'getHotels', limit: 10 },
    { method: 'getHotels', limit: 10 },
    { type: 'hotels', limit: 10 },
  ];

  for (const body of postTests) {
    console.log(`\n   Testing body: ${JSON.stringify(body)}`);
    try {
      const response = await axios.post(`${STATIC_DATA_URL}/hotels`, body, { 
        headers: { ...headers, 'Content-Type': 'application/json' },
        timeout: 30000 
      });
      
      if (response.data && !response.data.error) {
        console.log(`   ✅ Success!`);
        console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 500)}...`);
      } else {
        console.log(`   ⚠️ Empty response: ${JSON.stringify(response.data)}`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error}`);
    }
  }

  // Try to find the correct endpoint structure
  console.log('\n📡 Testing root endpoint...');
  try {
    const response = await axios.get(`${STATIC_DATA_URL}/`, { headers, timeout: 30000 });
    console.log(`   📄 Response: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    console.log(`   ❌ Error: ${error}`);
  }

  // Check if there's a documentation or help endpoint
  console.log('\n📡 Checking for documentation endpoints...');
  const docEndpoints = ['/docs', '/api-docs', '/swagger', '/help', '/api', '/v1', '/status'];
  
  for (const endpoint of docEndpoints) {
    try {
      const response = await axios.get(`${STATIC_DATA_URL}${endpoint}`, { headers, timeout: 10000 });
      console.log(`   ✅ ${endpoint}: ${JSON.stringify(response.data).substring(0, 200)}...`);
    } catch (error) {
      // Silently skip
    }
  }
}

fetchAllData().catch(console.error);
