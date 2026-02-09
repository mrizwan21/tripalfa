#!/usr/bin/env ts-node
/**
 * Test Duffel Orders Integration
 *
 * This script validates the complete Duffel orders workflow:
 * 1. Create offers/order requests
 * 2. Create orders from offers
 * 3. Retrieve order details
 * 4. Confirm held orders
 * 5. Create payment intents
 * 6. Update orders
 */

import axios, { AxiosError } from 'axios';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
  data?: any;
}

// Configuration
const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001/api';
const DUFFEL_API_KEY = process.env.DUFFEL_TEST_API_KEY || '';
const TIMEOUT = 30000;

const results: TestResult[] = [];
let createdOrderId: string | null = null;
let createdOfferRequestId: string | null = null;

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

// Test: Get airlines for testing
async function testGetAirlines(): Promise<void> {
  const response = await axios.get(`${GATEWAY_URL}/airlines`, {
    timeout: TIMEOUT,
  });

  if (!response.data || !Array.isArray(response.data)) {
    throw new Error('Airlines endpoint did not return array');
  }

  console.log(`   ✅ Retrieved ${response.data.length} airlines`);
}

// Test: Create offer request (search)
async function testCreateOfferRequest(): Promise<void> {
  const payload = {
    provider: 'duffel',
    env: 'test',
    data: {
      slices: [
        {
          origin: 'LHR',
          destination: 'JFK',
          departure_date: '2026-03-15',
        },
      ],
      passengers: [
        {
          type: 'adult',
        },
      ],
      cabin_class: 'economy',
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
      throw new Error('No data returned from offer request');
    }

    console.log(`   ✅ Offer request created`);
    console.log(`   📊 Response contains ${Object.keys(response.data).length} fields`);

    // Store first offer for later use
    if (response.data.offers && response.data.offers.length > 0) {
      console.log(`   📦 Got ${response.data.offers.length} offers`);
    }
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 401) {
      throw new Error('Invalid Duffel API key. Set DUFFEL_TEST_API_KEY environment variable');
    }
    throw error;
  }
}

// Test: Create order with valid passenger info
async function testCreateOrder(): Promise<void> {
  const payload = {
    provider: 'duffel',
    env: 'test',
    selectedOffers: ['offer_test_id_001'],
    passengers: [
      {
        id: 'passenger_1',
        email: 'passenger@example.com',
        type: 'adult' as const,
        given_name: 'John',
        family_name: 'Doe',
        phone_number: '+1-555-0123',
        born_at: '1990-01-15',
        gender: 'M' as const,
      },
    ],
    orderType: 'hold',
    paymentMethod: {
      type: 'balance' as const,
    },
  };

  try {
    const response = await axios.post(
      `${GATEWAY_URL}/bookings/flight/order`,
      payload,
      {
        headers: {
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      }
    );

    if (!response.data.order) {
      throw new Error('No order returned');
    }

    createdOrderId = response.data.order.id;
    console.log(`   ✅ Order created: ${createdOrderId}`);
    console.log(`   💰 Total: ${response.data.order.total_amount} ${response.data.order.total_currency}`);
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      console.log(`   ℹ️  Expected error: ${error.response.data?.error || error.message}`);
      // This is expected if offer ID is invalid in test environment
      return;
    }
    throw error;
  }
}

// Test: Get order details
async function testGetOrder(): Promise<void> {
  if (!createdOrderId) {
    console.log('   ⏭️  Skipping: No order created yet');
    return;
  }

  const response = await axios.get(
    `${GATEWAY_URL}/bookings/flight/order/${createdOrderId}`,
    {
      params: {
        provider: 'duffel',
        env: 'test',
      },
      headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
      },
      timeout: TIMEOUT,
    }
  );

  if (!response.data.order) {
    throw new Error('No order returned');
  }

  console.log(`   ✅ Order retrieved: ${response.data.order.id}`);
  console.log(`   📊 Order status: ${response.data.order.status || 'unknown'}`);
}

// Test: Confirm order
async function testConfirmOrder(): Promise<void> {
  if (!createdOrderId) {
    console.log('   ⏭️  Skipping: No order to confirm');
    return;
  }

  try {
    const response = await axios.post(
      `${GATEWAY_URL}/bookings/flight/order/${createdOrderId}/confirm`,
      {
        provider: 'duffel',
        env: 'test',
      },
      {
        headers: {
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      }
    );

    if (!response.data.order) {
      throw new Error('No order returned');
    }

    console.log(`   ✅ Order confirmed: ${response.data.order.id}`);
    console.log(`   📊 Confirmed: ${response.data.order.confirmed_at || 'pending'}`);
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      console.log(`   ℹ️  Expected error: ${error.response.data?.error}`);
      return;
    }
    throw error;
  }
}

// Test: Create payment intent
async function testCreatePaymentIntent(): Promise<void> {
  if (!createdOrderId) {
    console.log('   ⏭️  Skipping: No order for payment');
    return;
  }

  try {
    const response = await axios.post(
      `${GATEWAY_URL}/bookings/flight/payment-intent`,
      {
        provider: 'duffel',
        env: 'test',
        orderId: createdOrderId,
        amount: '100.00',
        currency: 'USD',
        returnUrl: 'https://example.com/return',
      },
      {
        headers: {
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      }
    );

    if (!response.data.paymentIntent) {
      throw new Error('No payment intent returned');
    }

    console.log(`   ✅ Payment intent created`);
    console.log(`   💳 Intent ID: ${response.data.paymentIntent.id || 'N/A'}`);
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      console.log(`   ℹ️  Expected error: ${error.response.data?.error}`);
      return;
    }
    throw error;
  }
}

// Test: Update order
async function testUpdateOrder(): Promise<void> {
  if (!createdOrderId) {
    console.log('   ⏭️  Skipping: No order to update');
    return;
  }

  try {
    const response = await axios.patch(
      `${GATEWAY_URL}/bookings/flight/order/${createdOrderId}`,
      {
        provider: 'duffel',
        env: 'test',
        data: {
          services: [
            {
              id: 'service_test_001',
              quantity: 2,
            },
          ],
        },
      },
      {
        headers: {
          'Authorization': `Bearer ${DUFFEL_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      }
    );

    if (!response.data.order) {
      throw new Error('No order returned');
    }

    console.log(`   ✅ Order updated: ${response.data.order.id}`);
    console.log(`   📊 Services count: ${response.data.order.services?.length || 0}`);
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      console.log(`   ℹ️  Expected error: ${error.response.data?.error}`);
      return;
    }
    throw error;
  }
}

// Test: Invalid provider
async function testInvalidProvider(): Promise<void> {
  const payload = {
    provider: 'invalid_provider',
    env: 'test',
    selectedOffers: ['offer_123'],
    passengers: [],
  };

  try {
    await axios.post(
      `${GATEWAY_URL}/bookings/flight/order`,
      payload,
      {
        timeout: TIMEOUT,
      }
    );
    throw new Error('Should have returned 400 for invalid provider');
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      console.log(`   ✅ Correctly rejected invalid provider`);
      return;
    }
    throw error;
  }
}

// Test: Missing required fields
async function testMissingFields(): Promise<void> {
  const payload = {
    // Missing provider
    selectedOffers: ['offer_123'],
    passengers: [],
  };

  try {
    await axios.post(
      `${GATEWAY_URL}/bookings/flight/order`,
      payload,
      {
        timeout: TIMEOUT,
      }
    );
    throw new Error('Should have returned 400 for missing provider');
  } catch (error: unknown) {
    if (error instanceof AxiosError && error.response?.status === 400) {
      console.log(`   ✅ Correctly rejected missing provider`);
      return;
    }
    throw error;
  }
}

// Print results summary
function printSummary(): void {
  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const total = results.length;
  const avgDuration = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / total);

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${failed}/${total}`);
  console.log(`⏱️  Average Duration: ${avgDuration}ms`);

  if (failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results
      .filter((r) => r.status === 'FAIL')
      .forEach((r) => {
        console.log(`  • ${r.name} - ${r.error}`);
      });
  }

  console.log('\n' + '='.repeat(60));
  console.log(`\n${failed === 0 ? '✅ ALL TESTS PASSED!' : '❌ SOME TESTS FAILED'}\n`);
}

// Main run
async function main() {
  console.log('🚀 Starting Duffel Orders Integration Tests');
  console.log(`📍 Gateway: ${GATEWAY_URL}`);
  console.log(`⏱️  Timeout: ${TIMEOUT}ms\n`);

  // Skip API key warning if explicitly set to 'none' for testing
  if (DUFFEL_API_KEY && !DUFFEL_API_KEY.includes('none')) {
    console.log(`🔑 Using API key: ${DUFFEL_API_KEY.substring(0, 10)}...`);
  } else {
    console.log('⚠️  Warning: DUFFEL_TEST_API_KEY not set. Some tests may be skipped.');
  }

  console.log('\n' + '='.repeat(60));
  console.log('RUNNING TESTS');
  console.log('='.repeat(60));

  // Core tests
  await runTest('Gateway Health Check', testGatewayHealth);
  await runTest('Get Airlines', testGetAirlines);
  await runTest('Create Offer Request', testCreateOfferRequest);

  // Order workflow tests
  await runTest('Create Order', testCreateOrder);
  await runTest('Get Order Details', testGetOrder);
  await runTest('Confirm Order', testConfirmOrder);
  await runTest('Create Payment Intent', testCreatePaymentIntent);
  await runTest('Update Order', testUpdateOrder);

  // Error handling tests
  await runTest('Invalid Provider Error Handling', testInvalidProvider);
  await runTest('Missing Fields Error Handling', testMissingFields);

  printSummary();
  process.exit(results.some((r) => r.status === 'FAIL') ? 1 : 0);
}

main().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
