#!/usr/bin/env node
/**
 * Test Innstant Search API - Based on Documentation
 * 
 * Documentation: https://docs.innstant-servers.com/#Flow
 * 
 * Usage: npx tsx scripts/test-innstant-search.ts
 */

import axios from 'axios';

const SEARCH_URL = 'https://connect.mishor5.innstant-servers.com';
const APPLICATION_KEY = '$2y$10$MU80MuAe5SkB4EkALGTNX.CKGSbrEIRbZZbanWKVlQruNTnhPovLS';
const ACCESS_TOKEN = '$2y$10$wlIPpzB4fJvnaLVokrbAo.jjD4KhZlZVeCc/xf7hcilENIzFDXUhO';

async function testSearchAPI() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        Innstant Search API Test (Mishor 5)                       ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  const headers = {
    'Aether-application-key': APPLICATION_KEY,
    'Aether-access-token': ACCESS_TOKEN,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  // Test 1: Simple search by destination
  console.log('📡 Test 1: Search hotels by destination (Dubai)...');
  try {
    const response = await axios.post(`${SEARCH_URL}/search`, {
      destination: 'DXB',
      checkIn: '2026-03-15',
      checkOut: '2026-03-17',
      rooms: [{ adults: 2, children: 0 }],
      currency: 'USD',
      language: 'en',
    }, { headers, timeout: 60000 });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Keys: ${Object.keys(response.data).join(', ')}`);
    console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(`   ❌ Status: ${axiosError.response?.status}`);
    console.log(`   📄 Error: ${JSON.stringify(axiosError.response?.data || axiosError.message).substring(0, 300)}`);
  }

  // Test 2: Search with different destination format
  console.log('\n📡 Test 2: Search with destination object...');
  try {
    const response = await axios.post(`${SEARCH_URL}/search`, {
      destination: {
        type: 'city',
        code: 'DXB',
      },
      checkIn: '2026-03-15',
      checkOut: '2026-03-17',
      rooms: [{ adults: 2, children: 0 }],
      currency: 'USD',
    }, { headers, timeout: 60000 });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Keys: ${Object.keys(response.data).join(', ')}`);
    console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(`   ❌ Status: ${axiosError.response?.status}`);
    console.log(`   📄 Error: ${JSON.stringify(axiosError.response?.data || axiosError.message).substring(0, 300)}`);
  }

  // Test 3: Try root endpoint with request type
  console.log('\n📡 Test 3: Root endpoint with request type...');
  try {
    const response = await axios.post(`${SEARCH_URL}/`, {
      request: 'search',
      destination: 'DXB',
      checkIn: '2026-03-15',
      checkOut: '2026-03-17',
      rooms: [{ adults: 2, children: 0 }],
      currency: 'USD',
    }, { headers, timeout: 60000 });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Keys: ${Object.keys(response.data).join(', ')}`);
    console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(`   ❌ Status: ${axiosError.response?.status}`);
    console.log(`   📄 Error: ${JSON.stringify(axiosError.response?.data || axiosError.message).substring(0, 300)}`);
  }

  // Test 4: Try to get static data through search API
  console.log('\n📡 Test 4: Get static data through search API...');
  try {
    const response = await axios.post(`${SEARCH_URL}/`, {
      request: 'getStaticData',
      type: 'hotels',
      limit: 10,
    }, { headers, timeout: 60000 });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Keys: ${Object.keys(response.data).join(', ')}`);
    console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(`   ❌ Status: ${axiosError.response?.status}`);
    console.log(`   📄 Error: ${JSON.stringify(axiosError.response?.data || axiosError.message).substring(0, 300)}`);
  }

  // Test 5: Try to get destinations
  console.log('\n📡 Test 5: Get destinations...');
  try {
    const response = await axios.post(`${SEARCH_URL}/`, {
      request: 'getDestinations',
    }, { headers, timeout: 60000 });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Keys: ${Object.keys(response.data).join(', ')}`);
    console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(`   ❌ Status: ${axiosError.response?.status}`);
    console.log(`   📄 Error: ${JSON.stringify(axiosError.response?.data || axiosError.message).substring(0, 300)}`);
  }

  // Test 6: Try hotels request
  console.log('\n📡 Test 6: Get hotels list...');
  try {
    const response = await axios.post(`${SEARCH_URL}/`, {
      request: 'getHotels',
      country: 'AE',
      limit: 10,
    }, { headers, timeout: 60000 });

    console.log(`   ✅ Status: ${response.status}`);
    console.log(`   📦 Keys: ${Object.keys(response.data).join(', ')}`);
    console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 500)}...`);
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    console.log(`   ❌ Status: ${axiosError.response?.status}`);
    console.log(`   📄 Error: ${JSON.stringify(axiosError.response?.data || axiosError.message).substring(0, 300)}`);
  }

  // Test 7: Try with different endpoint paths
  console.log('\n📡 Test 7: Testing different endpoint paths...');
  const endpoints = ['/api/search', '/api/v1/search', '/v1/search', '/hotel/search'];
  
  for (const endpoint of endpoints) {
    try {
      const response = await axios.post(`${SEARCH_URL}${endpoint}`, {
        destination: 'DXB',
        checkIn: '2026-03-15',
        checkOut: '2026-03-17',
        rooms: [{ adults: 2 }],
        currency: 'USD',
      }, { headers, timeout: 30000 });

      console.log(`   ✅ ${endpoint}: Status ${response.status}`);
      console.log(`      Sample: ${JSON.stringify(response.data).substring(0, 200)}...`);
    } catch (error) {
      const axiosError = error as { response?: { status?: number } };
      console.log(`   ❌ ${endpoint}: Status ${axiosError.response?.status || 'N/A'}`);
    }
  }
}

testSearchAPI().catch(console.error);
