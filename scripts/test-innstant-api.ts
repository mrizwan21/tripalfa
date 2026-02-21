#!/usr/bin/env node
/**
 * Test Innstant Travel API Connection
 * 
 * Tests all three Innstant API endpoints:
 * 1. Static Data API - for hotel static data
 * 2. Search API - for availability search
 * 3. Booking API - for bookings
 * 
 * Usage: npx tsx scripts/test-innstant-api.ts
 */

import axios from 'axios';

// API Credentials
const CREDENTIALS = {
  // Static Data API
  staticData: {
    baseUrl: 'https://static-data.innstant-servers.com',
    apiKey: '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6',
  },
  // Search API (Mishor 5)
  search: {
    baseUrl: 'https://connect.mishor5.innstant-servers.com',
    applicationKey: '$2y$10$MU80MuAe5SkB4EkALGTNX.CKGSbrEIRbZZbanWKVlQruNTnhPovLS',
    accessToken: '$2y$10$wlIPpzB4fJvnaLVokrbAo.jjD4KhZlZVeCc/xf7hcilENIzFDXUhO',
  },
  // Booking API
  booking: {
    baseUrl: 'https://book.mishor5.innstant-servers.com',
    applicationKey: '$2y$10$MU80MuAe5SkB4EkALGTNX.CKGSbrEIRbZZbanWKVlQruNTnhPovLS',
    accessToken: '$2y$10$wlIPpzB4fJvnaLVokrbAo.jjD4KhZlZVeCc/xf7hcilENIzFDXUhO',
  },
};

interface TestResult {
  endpoint: string;
  success: boolean;
  status?: number;
  message: string;
  data?: unknown;
  error?: string;
}

async function testStaticDataAPI(): Promise<TestResult> {
  console.log('\n📡 Testing Static Data API...');
  console.log(`   URL: ${CREDENTIALS.staticData.baseUrl}`);
  
  try {
    const response = await axios.get(`${CREDENTIALS.staticData.baseUrl}/hotels`, {
      headers: {
        'Authorization': `Bearer ${CREDENTIALS.staticData.apiKey}`,
        'Accept': 'application/json',
      },
      params: {
        limit: 5,
      },
      timeout: 30000,
    });
    
    return {
      endpoint: 'Static Data API',
      success: true,
      status: response.status,
      message: 'Connection successful',
      data: response.data,
    };
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    
    // Try alternative endpoint structure
    try {
      console.log('   Trying alternative endpoint structure...');
      const response = await axios.post(
        `${CREDENTIALS.staticData.baseUrl}/`,
        {
          request: 'getHotels',
          limit: 5,
        },
        {
          headers: {
            'X-API-Key': CREDENTIALS.staticData.apiKey,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      return {
        endpoint: 'Static Data API (POST)',
        success: true,
        status: response.status,
        message: 'Connection successful with POST method',
        data: response.data,
      };
    } catch (postError) {
      const postAxiosError = postError as { response?: { status?: number; data?: unknown }; message?: string };
      return {
        endpoint: 'Static Data API',
        success: false,
        status: postAxiosError.response?.status,
        message: 'Connection failed',
        error: postAxiosError.message || String(postError),
        data: postAxiosError.response?.data,
      };
    }
  }
}

async function testSearchAPI(): Promise<TestResult> {
  console.log('\n📡 Testing Search API (Mishor 5)...');
  console.log(`   URL: ${CREDENTIALS.search.baseUrl}`);
  
  // Test with a simple search request
  const searchPayload = {
    request: 'searchHotels',
    destination: {
      type: 'city',
      code: 'DXB', // Dubai
    },
    checkIn: '2026-03-01',
    checkOut: '2026-03-03',
    rooms: [
      {
        adults: 2,
        children: 0,
      },
    ],
    currency: 'USD',
    language: 'en',
  };
  
  try {
    const response = await axios.post(
      `${CREDENTIALS.search.baseUrl}/`,
      searchPayload,
      {
        headers: {
          'Aether-application-key': CREDENTIALS.search.applicationKey,
          'Aether-access-token': CREDENTIALS.search.accessToken,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        timeout: 60000,
      }
    );
    
    return {
      endpoint: 'Search API',
      success: true,
      status: response.status,
      message: 'Connection successful',
      data: typeof response.data === 'object' ? 
        { keys: Object.keys(response.data as object), sample: JSON.stringify(response.data).substring(0, 500) } : 
        response.data,
    };
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    
    // Try alternative endpoint
    try {
      console.log('   Trying alternative endpoint (/search)...');
      const response = await axios.post(
        `${CREDENTIALS.search.baseUrl}/search`,
        searchPayload,
        {
          headers: {
            'Aether-application-key': CREDENTIALS.search.applicationKey,
            'Aether-access-token': CREDENTIALS.search.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 60000,
        }
      );
      
      return {
        endpoint: 'Search API (/search)',
        success: true,
        status: response.status,
        message: 'Connection successful',
        data: typeof response.data === 'object' ? 
          { keys: Object.keys(response.data as object) } : 
          response.data,
      };
    } catch (postError) {
      const postAxiosError = postError as { response?: { status?: number; data?: unknown }; message?: string };
      return {
        endpoint: 'Search API',
        success: false,
        status: postAxiosError.response?.status,
        message: 'Connection failed',
        error: postAxiosError.message || String(postError),
        data: postAxiosError.response?.data,
      };
    }
  }
}

async function testBookingAPI(): Promise<TestResult> {
  console.log('\n📡 Testing Booking API...');
  console.log(`   URL: ${CREDENTIALS.booking.baseUrl}`);
  
  // Test with a simple request (just checking connectivity)
  try {
    const response = await axios.get(`${CREDENTIALS.booking.baseUrl}/health`, {
      headers: {
        'Aether-application-key': CREDENTIALS.booking.applicationKey,
        'Aether-access-token': CREDENTIALS.booking.accessToken,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });
    
    return {
      endpoint: 'Booking API',
      success: true,
      status: response.status,
      message: 'Connection successful',
      data: response.data,
    };
  } catch (error) {
    const axiosError = error as { response?: { status?: number; data?: unknown }; message?: string };
    
    // Try POST endpoint
    try {
      console.log('   Trying POST endpoint...');
      const response = await axios.post(
        `${CREDENTIALS.booking.baseUrl}/`,
        { request: 'status' },
        {
          headers: {
            'Aether-application-key': CREDENTIALS.booking.applicationKey,
            'Aether-access-token': CREDENTIALS.booking.accessToken,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          timeout: 30000,
        }
      );
      
      return {
        endpoint: 'Booking API (POST)',
        success: true,
        status: response.status,
        message: 'Connection successful',
        data: response.data,
      };
    } catch (postError) {
      const postAxiosError = postError as { response?: { status?: number; data?: unknown }; message?: string };
      return {
        endpoint: 'Booking API',
        success: false,
        status: postAxiosError.response?.status,
        message: 'Connection failed',
        error: postAxiosError.message || String(postError),
        data: postAxiosError.response?.data,
      };
    }
  }
}

async function testAPIEndpoints(): Promise<void> {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║           Innstant Travel API Connection Test                    ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  
  const results: TestResult[] = [];
  
  // Test all endpoints
  results.push(await testStaticDataAPI());
  results.push(await testSearchAPI());
  results.push(await testBookingAPI());
  
  // Print summary
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                        TEST SUMMARY                              ║');
  console.log('╠══════════════════════════════════════════════════════════════════╣');
  
  for (const result of results) {
    const status = result.success ? '✅ PASS' : '❌ FAIL';
    const statusMsg = `${status} - ${result.message}`;
    console.log(`║ ${result.endpoint.padEnd(20)} │ ${statusMsg.padEnd(35)} ║`);
    
    if (result.status) {
      console.log(`║ ${' '.padEnd(20)} │ Status: ${String(result.status).padEnd(28)} ║`);
    }
    
    if (result.error) {
      console.log(`║ ${' '.padEnd(20)} │ Error: ${result.error.substring(0, 28).padEnd(28)} ║`);
    }
    
    if (result.data && result.success) {
      const dataStr = typeof result.data === 'string' ? result.data : JSON.stringify(result.data);
      console.log(`║ ${' '.padEnd(20)} │ Data: ${dataStr.substring(0, 60)}... ║`);
    }
  }
  
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  
  // Overall result
  const allPassed = results.every(r => r.success);
  if (allPassed) {
    console.log('\n✅ All API endpoints are accessible!');
  } else {
    console.log('\n⚠️  Some API endpoints failed. Check credentials and network connectivity.');
  }
}

// Run the tests
testAPIEndpoints().catch(console.error);
