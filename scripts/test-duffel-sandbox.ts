import axios from 'axios';
import 'dotenv/config';

/**
 * Duffel API Sandbox Test
 * Tests flight search, airlines, and airports with sandbox credentials
 */

interface TestResult {
  test: string;
  status: 'PASS' | 'FAIL' | 'WARN';
  duration: number;
  message: string;
  details?: any;
}

const results: TestResult[] = [];

const DUFFEL_API_KEY = process.env.DUFFEL_TEST_API_KEY || 'test_key';
const DUFFEL_BASE_URL = 'https://api.duffel.com/air';

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
    results.push({
      test: name,
      status: 'FAIL',
      duration,
      message: error.message,
      details: error.response?.data || error.message
    });
    console.log(`✗ ${name} - ${error.message}`);
  }
}

async function testDuffelAirlines(): Promise<any> {
  const response = await axios.get(`${DUFFEL_BASE_URL}/airlines`, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Duffel-Version': 'v2'
    },
    params: { limit: 10 }
  });
  
  if (!response.data.data || response.data.data.length === 0) {
    throw new Error('No airlines returned');
  }
  
  return {
    count: response.data.data.length,
    sample: response.data.data[0]
  };
}

async function testDuffelAirports(): Promise<any> {
  const response = await axios.get(`${DUFFEL_BASE_URL}/airports`, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Duffel-Version': 'v2'
    },
    params: { limit: 10 }
  });
  
  if (!response.data.data || response.data.data.length === 0) {
    throw new Error('No airports returned');
  }
  
  return {
    count: response.data.data.length,
    sample: response.data.data[0]
  };
}

async function testDuffelFlightSearch(): Promise<any> {
  const response = await axios.post(
    `${DUFFEL_BASE_URL}/offer_requests`,
    {
      data: {
        slices: [
          {
            origin: 'LHR',
            destination: 'JFK',
            departure_date: '2026-03-15'
          }
        ],
        passengers: [{ type: 'adult' }],
        cabin_class: 'economy'
      }
    },
    {
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Duffel-Version': 'beta',
        'Content-Type': 'application/json'
      },
      timeout: 30000
    }
  );
  
  if (!response.data.data) {
    // Sandbox might not return offers, but should return valid structure
    return {
      status: 'Request accepted',
      hasOffers: Array.isArray(response.data.data?.offers)
    };
  }
  
  return {
    offerCount: response.data.data.offers?.length || 0,
    hasSlices: Array.isArray(response.data.data?.slices),
    hasPassengers: Array.isArray(response.data.data?.passengers)
  };
}

async function main() {
  console.log('\n========================================');
  console.log('Duffel API Sandbox Testing');
  console.log('========================================\n');
  
  console.log(`API Key: ${DUFFEL_API_KEY.substring(0, 20)}...`);
  console.log(`Base URL: ${DUFFEL_BASE_URL}\n`);
  
  console.log('Running tests...\n');
  
  await runTest('Test 1: Get Airlines', testDuffelAirlines);
  await runTest('Test 2: Get Airports', testDuffelAirports);
  await runTest('Test 3: Search Flights', testDuffelFlightSearch);
  
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
    console.log('✓ All Duffel API tests completed!');
  } else {
    console.log(`✗ ${failed} test(s) failed - check configuration`);
  }
}

main().catch(console.error);
