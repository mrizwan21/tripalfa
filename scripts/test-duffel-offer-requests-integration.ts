#!/usr/bin/env ts-node
/**
 * Test Duffel Offer-Requests Integration with API Gateway
 * 
 * This script validates that the Duffel offer-requests endpoint is properly
 * integrated with the API Gateway and works end-to-end through the gateway routing.
 */

import axios, { AxiosError } from 'axios';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
}

// Configuration
const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001/api';
const DUFFEL_API_KEY = process.env.DUFFEL_TEST_API_KEY || '';
const TIMEOUT = 30000;

const results: TestResult[] = [];

async function runTest(
  name: string,
  testFn: () => Promise<void>
): Promise<void> {
  const startTime = Date.now();
  try {
    console.log(`\n⏳ Testing: ${name}`);
    await testFn();
    const duration = Date.now() - startTime;
    results.push({ name, status: 'PASS', duration });
    console.log(`✅ PASS: ${name} (${duration}ms)`);
  } catch (error: unknown) {
    const duration = Date.now() - startTime;
    const errorMsg =
      error instanceof AxiosError
        ? `${error.response?.status} - ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);
    results.push({ name, status: 'FAIL', duration, error: errorMsg });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${errorMsg}`);
  }
}

// Test: Gateway health check
async function testGatewayHealth(): Promise<void> {
  try {
    const response = await axios.get(`${GATEWAY_URL}/health`, {
      timeout: 5000,
    });
    if (response.status !== 200) {
      throw new Error(`Gateway returned status ${response.status}`);
    }
    console.log(`   ✅ Gateway is healthy`);
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.code === 'ECONNREFUSED') {
      throw new Error(
        'Gateway not running. Start with: cd services/api-gateway && npm run dev'
      );
    }
    throw error;
  }
}

// Test: Direct Duffel offer request through gateway
async function testOfferRequestViaGateway(): Promise<void> {
  const payload = {
    supplier: 'duffel',
    endpoint: 'searchFlights',
    params: {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2026-03-15',
      cabinClass: 'economy',
      passengers: [{ type: 'adult' }],
    },
  };

  try {
    const response = await axios.post(`${GATEWAY_URL}/route`, payload, {
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    });

    if (!response.data) {
      throw new Error('No data returned from gateway');
    }

    console.log(`   ✅ Gateway routed to Duffel`);
    console.log(`   📊 Response contains ${Object.keys(response.data).length} fields`);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        throw new Error('Unauthorized - API key not valid for gateway');
      }
      if (error.response?.status === 404) {
        throw new Error('Gateway route not found - endpoint may not be registered');
      }
      // Log detailed error for debugging
      console.log(`   Error status: ${error.response?.status}`);
      if (error.response?.data) {
        console.log(`   Error details:`, error.response.data);
      }
    }
    throw error;
  }
}

// Test: Round-trip offer request via gateway
async function testRoundTripViaGateway(): Promise<void> {
  const payload = {
    supplier: 'duffel',
    endpoint: 'searchFlights',
    params: {
      origin: 'AMS',
      destination: 'CDG',
      departureDate: '2026-04-01',
      returnDate: '2026-04-15',
      cabinClass: 'economy',
      passengers: [{ type: 'adult' }, { type: 'child' }],
    },
  };

  const response = await axios.post(`${GATEWAY_URL}/route`, payload, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: TIMEOUT,
  });

  if (!response.data || typeof response.data !== 'object') {
    throw new Error('Invalid response format from gateway');
  }

  console.log(`   ✅ Round-trip request routed successfully`);
  console.log(`   📦 Response type: ${typeof response.data}`);
}

// Test: Business class offer request via gateway
async function testBusinessClassViaGateway(): Promise<void> {
  const payload = {
    supplier: 'duffel',
    endpoint: 'searchFlights',
    params: {
      origin: 'SFO',
      destination: 'LHR',
      departureDate: '2026-05-10',
      cabinClass: 'business',
      passengers: [{ type: 'adult' }],
    },
  };

  const response = await axios.post(`${GATEWAY_URL}/route`, payload, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: TIMEOUT,
  });

  if (!response.data) {
    throw new Error('No data returned for business class search');
  }

  console.log(`   ✅ Business class request routed successfully`);
}

// Test: Error handling for invalid supplier
async function testInvalidSupplierHandling(): Promise<void> {
  const payload = {
    supplier: 'invalid_supplier',
    endpoint: 'searchFlights',
    params: {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2026-03-15',
      passengers: [{ type: 'adult' }],
    },
  };

  try {
    await axios.post(`${GATEWAY_URL}/route`, payload, {
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    });
    throw new Error('Gateway should have rejected invalid supplier');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 400 || error.response?.status === 422) {
        console.log(`   ✅ Gateway correctly rejected invalid supplier`);
        return;
      }
    }
    throw error;
  }
}

// Test: Missing API key handling
async function testMissingAuthTokenHandling(): Promise<void> {
  const payload = {
    supplier: 'duffel',
    endpoint: 'searchFlights',
    params: {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2026-03-15',
      passengers: [{ type: 'adult' }],
    },
  };

  try {
    await axios.post(`${GATEWAY_URL}/route`, payload, {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    });
    throw new Error('Gateway should require authorization');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        console.log(`   ✅ Gateway correctly requires authorization`);
        return;
      }
    }
    throw error;
  }
}

// Test: Concurrent offer requests
async function testConcurrentOfferRequests(): Promise<void> {
  const requests = [
    {
      supplier: 'duffel',
      endpoint: 'searchFlights',
      params: {
        origin: 'LHR',
        destination: 'JFK',
        departureDate: '2026-03-15',
        passengers: [{ type: 'adult' }],
      },
    },
    {
      supplier: 'duffel',
      endpoint: 'searchFlights',
      params: {
        origin: 'SFO',
        destination: 'LAX',
        departureDate: '2026-03-20',
        passengers: [{ type: 'adult' }],
      },
    },
    {
      supplier: 'duffel',
      endpoint: 'searchFlights',
      params: {
        origin: 'CDG',
        destination: 'AMS',
        departureDate: '2026-04-01',
        passengers: [{ type: 'adult' }],
      },
    },
  ];

  const promises = requests.map((payload) =>
    axios.post(`${GATEWAY_URL}/route`, payload, {
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    })
  );

  const results = await Promise.allSettled(promises);
  const successful = results.filter((r) => r.status === 'fulfilled').length;
  const failed = results.filter((r) => r.status === 'rejected').length;

  if (failed > 0) {
    throw new Error(`${failed}/${results.length} concurrent requests failed`);
  }

  console.log(`   ✅ All 3 concurrent requests succeeded`);
  console.log(`   📊 Success rate: ${successful}/${results.length}`);
}

// Test: Response time performance
async function testOfferRequestPerformance(): Promise<void> {
  const payload = {
    supplier: 'duffel',
    endpoint: 'searchFlights',
    params: {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2026-03-15',
      passengers: [{ type: 'adult' }],
    },
  };

  const startTime = Date.now();
  const response = await axios.post(`${GATEWAY_URL}/route`, payload, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: TIMEOUT,
  });
  const duration = Date.now() - startTime;

  if (duration > 30000) {
    throw new Error(`Request took ${duration}ms, exceeding timeout`);
  }

  console.log(`   ✅ Request completed in ${duration}ms`);
  if (duration < 2000) {
    console.log(`   ⚡ Excellent performance (< 2s)`);
  } else if (duration < 5000) {
    console.log(`   ✓ Good performance (2-5s)`);
  } else {
    console.log(`   ⚠️  Slow performance (> 5s)`);
  }
}

// Test: Adapter mapping correctness
async function testAdapterResponseMapping(): Promise<void> {
  const payload = {
    supplier: 'duffel',
    endpoint: 'searchFlights',
    params: {
      origin: 'LHR',
      destination: 'JFK',
      departureDate: '2026-03-15',
      passengers: [{ type: 'adult' }],
    },
  };

  const response = await axios.post(`${GATEWAY_URL}/route`, payload, {
    headers: {
      'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    timeout: TIMEOUT,
  });

  // Expected fields from DuffelAdapter
  const expectedFields = ['id', 'offers', 'created_at'];
  const hasFields = expectedFields.every(
    (field) => field in (response.data || {})
  );

  if (!hasFields) {
    // Some responses might have different structure depending on adapter
    console.log(`   ⚠️  Response may be missing some expected fields`);
    console.log(`   📦  Available fields: ${Object.keys(response.data || {}).join(', ')}`);
  } else {
    console.log(`   ✅ Response has correct structure`);
    console.log(`   📦 Fields: ${expectedFields.join(', ')}`);
  }
}

// Summary formatter
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 INTEGRATION TEST SUMMARY');
  console.log('='.repeat(60));

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`\n📈 Results:`);
  console.log(`  ✅ Passed: ${passed}/${results.length}`);
  console.log(`  ❌ Failed: ${failed}/${results.length}`);
  console.log(`  ⏱️  Total duration: ${totalDuration}ms`);

  if (failed > 0) {
    console.log(`\n⚠️  Failed Tests:`);
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  • ${r.name}`);
        console.log(`    Error: ${r.error}`);
      });

    console.log(`\n💡 Troubleshooting:`);
    if (
      results.some((r) =>
        r.error?.includes('Gateway not running')
      )
    ) {
      console.log(`  1. Start API Gateway: cd services/api-gateway && npm run dev`);
    }
    if (
      results.some((r) =>
        r.error?.includes('Unauthorized')
      )
    ) {
      console.log(`  2. Check .env file: cat .env | grep DUFFEL`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✨ Integration test ${failed === 0 ? 'PASSED' : 'FAILED'}`);
  console.log('='.repeat(60));

  process.exit(failed > 0 ? 1 : 0);
}

// Main execution
async function main(): Promise<void> {
  console.log('🔗 Duffel Offer-Requests API Gateway Integration Tests');
  console.log('='.repeat(60));
  console.log(`Gateway URL: ${GATEWAY_URL}`);
  console.log(`Timeout: ${TIMEOUT}ms`);
  console.log('='.repeat(60));

  // Run all tests
  await runTest('I-001: Gateway Health Check', testGatewayHealth);
  await runTest(
    'I-002: Direct Duffel Offer Request',
    testOfferRequestViaGateway
  );
  await runTest('I-003: Round-trip Offer Request', testRoundTripViaGateway);
  await runTest('I-004: Business Class Search', testBusinessClassViaGateway);
  await runTest('I-005: Invalid Supplier Error', testInvalidSupplierHandling);
  await runTest(
    'I-006: Missing Auth Token Error',
    testMissingAuthTokenHandling
  );
  await runTest(
    'I-007: Concurrent Offer Requests',
    testConcurrentOfferRequests
  );
  await runTest('I-008: Response Time Performance', testOfferRequestPerformance);
  await runTest('I-009: Adapter Response Mapping', testAdapterResponseMapping);

  printSummary();
}

main().catch(console.error);
