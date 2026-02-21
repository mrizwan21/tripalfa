#!/usr/bin/env node
/**
 * Test Innstant Static Data API - Detailed Test
 * 
 * Usage: npx tsx scripts/test-innstant-static.ts
 */

import axios from 'axios';

const STATIC_DATA_URL = 'https://static-data.innstant-servers.com';
const API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';

async function testStaticDataEndpoints() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║        Innstant Static Data API - Detailed Test                  ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  // Test different endpoint patterns
  const endpoints = [
    { method: 'GET', path: '/hotels', params: { limit: 5 } },
    { method: 'GET', path: '/hotel', params: { id: '12345' } },
    { method: 'GET', path: '/countries', params: {} },
    { method: 'GET', path: '/cities', params: { limit: 5 } },
    { method: 'GET', path: '/currencies', params: {} },
    { method: 'GET', path: '/languages', params: {} },
    { method: 'GET', path: '/facilities', params: {} },
    { method: 'GET', path: '/chains', params: {} },
    { method: 'GET', path: '/propertyTypes', params: {} },
    { method: 'POST', path: '/', body: { request: 'getHotels', limit: 5 } },
    { method: 'POST', path: '/hotels', body: { limit: 5 } },
    { method: 'GET', path: '/v1/hotels', params: { limit: 5 } },
    { method: 'GET', path: '/api/hotels', params: { limit: 5 } },
    { method: 'GET', path: '/api/v1/hotels', params: { limit: 5 } },
  ];

  for (const endpoint of endpoints) {
    console.log(`\n📡 Testing: ${endpoint.method} ${endpoint.path}`);
    
    try {
      const config: Record<string, unknown> = {
        headers: {
          'X-API-Key': API_KEY,
          'Authorization': `Bearer ${API_KEY}`,
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        timeout: 30000,
      };

      let response;
      if (endpoint.method === 'GET') {
        config.params = endpoint.params;
        response = await axios.get(`${STATIC_DATA_URL}${endpoint.path}`, config);
      } else {
        response = await axios.post(`${STATIC_DATA_URL}${endpoint.path}`, endpoint.body, config);
      }

      console.log(`   ✅ Status: ${response.status}`);
      
      // Show response structure
      const data = response.data;
      if (typeof data === 'object' && data !== null) {
        const keys = Object.keys(data);
        console.log(`   📦 Keys: ${keys.join(', ')}`);
        
        // Show sample data
        const sample = JSON.stringify(data).substring(0, 300);
        console.log(`   📄 Sample: ${sample}...`);
      } else {
        console.log(`   📄 Response: ${String(data).substring(0, 200)}`);
      }
      
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
      const status = axiosError.response?.status || 'N/A';
      const errorData = axiosError.response?.data;
      
      console.log(`   ❌ Status: ${status}`);
      if (errorData) {
        console.log(`   📄 Error: ${JSON.stringify(errorData).substring(0, 200)}`);
      } else if (axiosError.message) {
        console.log(`   📄 Error: ${axiosError.message}`);
      }
    }
  }

  // Test with different auth methods
  console.log('\n\n🔐 Testing different authentication methods...\n');
  
  const authMethods = [
    { name: 'X-API-Key header', headers: { 'X-API-Key': API_KEY } },
    { name: 'Authorization Bearer', headers: { 'Authorization': `Bearer ${API_KEY}` } },
    { name: 'api_key query param', params: { api_key: API_KEY } },
    { name: 'apikey query param', params: { apikey: API_KEY } },
    { name: 'key query param', params: { key: API_KEY } },
  ];

  for (const auth of authMethods) {
    console.log(`\n📡 Testing auth: ${auth.name}`);
    
    try {
      const config: Record<string, unknown> = {
        headers: {
          'Accept': 'application/json',
          ...auth.headers,
        },
        timeout: 30000,
      };
      
      if (auth.params) {
        config.params = auth.params;
      }

      const response = await axios.get(`${STATIC_DATA_URL}/hotels`, config);
      console.log(`   ✅ Status: ${response.status}`);
      console.log(`   📄 Sample: ${JSON.stringify(response.data).substring(0, 200)}...`);
      
    } catch (error) {
      const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
      console.log(`   ❌ Status: ${axiosError.response?.status || 'N/A'}`);
    }
  }
}

testStaticDataEndpoints().catch(console.error);
