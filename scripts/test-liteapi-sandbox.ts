import axios from 'axios';
import 'dotenv/config';

/**
 * LiteAPI Sandbox Test
 * Tests hotel search with sandbox credentials
 */

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

const LITEAPI_KEY = process.env.LITEAPI_TEST_API_KEY || 'test_key';
const LITEAPI_BASE_URL = 'https://api.liteapi.travel/v3.0';

async function runTest(
  name: string,
  testFn: () => Promise<any>
): Promise<void> {
  const start = Date.now();
  try {
    const result = await testFn();
    const duration = Date.now() - start;
    results.push({
      test: name,
      status: 'PASS',
      duration,
      message: 'Test passed',
      details: result
    });
    console.log(`✓ ${name} (${duration}ms)`);
  } catch (error: any) {
    const duration = Date.now() - start;
    const errorMsg = error.response?.data?.message || error.message;
    results.push({
      test: name,
      status: 'FAIL',
      duration,
      message: errorMsg,
      details: error.response?.data || error.message
    });
    console.log(`✗ ${name} - ${errorMsg}`);
  }
}

async function testHotelSearch(): Promise<any> {
  const response = await axios.post(
    `${LITEAPI_BASE_URL}/hotels/search`,
    {
      location: 'Dubai',
      checkin: '2026-03-15',
      checkout: '2026-03-17',
      adults: 2,
      children: 0,
      currency: 'AED'
    },
    {
      headers: {
        'X-API-Key': LITEAPI_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  return {
    hotelCount: response.data.data?.length || 0,
    sample: response.data.data?.[0] || null,
    hasData: !!response.data.data
  };
}

async function testHotelSearchLondon(): Promise<any> {
  const response = await axios.post(
    `${LITEAPI_BASE_URL}/hotels/search`,
    {
      location: 'London',
      checkin: '2026-04-01',
      checkout: '2026-04-03',
      adults: 2,
      children: 1,
      currency: 'GBP'
    },
    {
      headers: {
        'X-API-Key': LITEAPI_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  return {
    hotelCount: response.data.data?.length || 0,
    location: 'London',
    hasData: !!response.data.data
  };
}

async function testHotelAvailability(): Promise<any> {
  const response = await axios.post(
    `${LITEAPI_BASE_URL}/availability`,
    {
      checkin: '2026-03-15',
      checkout: '2026-03-17',
      currency: 'AED',
      guestNationality: 'US',
      occupancies: [
        {
          adults: 2,
          children: 0
        }
      ],
      cityName: 'Dubai',
      countryCode: 'AE'
    },
    {
      headers: {
        'X-API-Key': LITEAPI_KEY,
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  return {
    resultCount: response.data.data?.length || 0,
    hasAvailability: Array.isArray(response.data.data),
    sample: response.data.data?.[0] || null
  };
}

async function testHotelCatalog(): Promise<any> {
  const response = await axios.get(
    `${LITEAPI_BASE_URL}/data/hotels`,
    {
      headers: {
        'X-API-Key': LITEAPI_KEY,
        'Content-Type': 'application/json'
      },
      params: {
        countryCode: 'AE',
        limit: 10
      },
      timeout: 30000
    }
  );
  
  return {
    hotelCount: response.data.data?.length || 0,
    sample: response.data.data?.[0] || null,
    hasMetadata: !!response.data.meta
  };
}

async function main() {
  console.log('\n========================================');
  console.log('LiteAPI Sandbox Testing');
  console.log('========================================\n');
  
  console.log(`API Key: ${LITEAPI_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${LITEAPI_BASE_URL}\n`);
  
  console.log('Running tests...\n');
  
  await runTest('Test 1: Hotel Search (Dubai)', testHotelSearch);
  await runTest('Test 2: Hotel Search (London)', testHotelSearchLondon);
  await runTest('Test 3: Hotel Availability', testHotelAvailability);
  await runTest('Test 4: Hotel Catalog', testHotelCatalog);
  
  // Summary
  console.log('\n========================================');
  console.log('Test Results Summary');
  console.log('========================================\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  
  console.log(`Total Tests: ${results.length}`);
  console.log(`Passed: ${passed}`);
  console.log(`Failed: ${failed}`);
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time: ${(totalTime / results.length).toFixed(2)}ms\n`);
  
  // Detailed results
  console.log('Detailed Results:');
  results.forEach(r => {
    const icon = r.status === 'PASS' ? '✓' : '✗';
    console.log(`${icon} ${r.test} (${r.duration}ms)`);
    console.log(`  Message: ${r.message}`);
    if (r.details) {
      console.log(`  Details: ${JSON.stringify(r.details).substring(0, 100)}...`);
    }
  });
  
  console.log('\n========================================\n');
  
  if (failed === 0) {
    console.log('✓ All LiteAPI tests completed!');
  } else {
    console.log(`✗ ${failed} test(s) failed - check configuration`);
  }
}

main().catch(console.error);
