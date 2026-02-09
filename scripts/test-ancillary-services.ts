/**
 * Ancillary Services Integration Tests
 * Tests endpoints for both booking and post-booking flows
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.BASE_URL || 'http://localhost:3001';
const TEST_OFFER_ID = 'off_00009htYpSCXrwaB9DnUm0';
const TEST_ORDER_ID = 'ord_00009hthhsUZ8W4LxQgkjo';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({ name, status: 'PASS', duration: Date.now() - start });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error) {
    results.push({
      name,
      status: 'FAIL',
      duration: Date.now() - start,
      error: error instanceof Error ? error.message : String(error)
    });
    console.log(`❌ ${name} - ${error instanceof Error ? error.message : error}`);
  }
}

async function testHealthEndpoint() {
  return test('Health endpoint responds', async () => {
    const response = await fetch(`${BASE_URL}/health`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as any;
    if (data.status !== 'healthy') throw new Error('Service not healthy');
  });
}

async function testGetServicesForBooking() {
  return test('GET services for booking (valid offer)', async () => {
    const response = await fetch(
      `${BASE_URL}/bookings/ancillary/services?offerId=${TEST_OFFER_ID}`
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}`);
    }
    // 404 is expected if offer doesn't exist in test environment
  });
}

async function testGetServicesForBookingMissingParam() {
  return test('GET services - missing parameters (should fail)', async () => {
    const response = await fetch(`${BASE_URL}/bookings/ancillary/services`);
    if (response.ok) throw new Error('Should have failed with missing parameters');
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });
}

async function testGetServicesForBookingBothParams() {
  return test('GET services - both offerId and orderId (should fail)', async () => {
    const response = await fetch(
      `${BASE_URL}/bookings/ancillary/services?offerId=test&orderId=test`
    );
    if (response.ok) throw new Error('Should have failed with both parameters');
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });
}

async function testGetServicesForOrder() {
  return test('GET services for post-booking (valid order)', async () => {
    const response = await fetch(
      `${BASE_URL}/bookings/ancillary/services?orderId=${TEST_ORDER_ID}`
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}`);
    }
    // 404 is expected if order doesn't exist in test environment
  });
}

async function testSelectServicesForBooking() {
  return test('POST select services for booking', async () => {
    const response = await fetch(`${BASE_URL}/bookings/ancillary/services/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: TEST_OFFER_ID,
        services: [
          { id: 'ase_test_1', quantity: 1 },
          { id: 'ase_test_2', quantity: 2 }
        ]
      })
    });
    if (response.ok || response.status === 400 || response.status === 404) {
      // OK, or expected errors for test data
      return;
    }
    throw new Error(`HTTP ${response.status}`);
  });
}

async function testSelectServicesForBookingMissingServices() {
  return test('POST select services - missing services array (should fail)', async () => {
    const response = await fetch(`${BASE_URL}/bookings/ancillary/services/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ offerId: TEST_OFFER_ID })
    });
    if (response.ok) throw new Error('Should have failed with missing services');
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });
}

async function testSelectServicesEmptyArray() {
  return test('POST select services - empty array (should fail)', async () => {
    const response = await fetch(`${BASE_URL}/bookings/ancillary/services/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerId: TEST_OFFER_ID,
        services: []
      })
    });
    if (response.ok) throw new Error('Should have failed with empty array');
    if (response.status !== 400) {
      throw new Error(`Expected 400, got ${response.status}`);
    }
  });
}

async function testAddServicesToOrder() {
  return test('POST add services to order', async () => {
    const response = await fetch(`${BASE_URL}/bookings/ancillary/services/select`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: TEST_ORDER_ID,
        services: [
          { id: 'ase_test_1', quantity: 1 }
        ]
      })
    });
    if (response.ok || response.status === 400 || response.status === 404) {
      return;
    }
    throw new Error(`HTTP ${response.status}`);
  });
}

async function testGetServiceCategories() {
  return test('GET service categories', async () => {
    const response = await fetch(
      `${BASE_URL}/bookings/ancillary/services/categories`
    );
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as any;
    if (!Array.isArray(data.data)) {
      throw new Error('Expected array of categories');
    }
    if (data.data.length === 0) {
      throw new Error('Should have at least one category');
    }
  });
}

async function testGetServiceDetails() {
  return test('GET service details', async () => {
    const response = await fetch(
      `${BASE_URL}/bookings/ancillary/services/details/test_service_id`
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}`);
    }
  });
}

async function testFilterByServiceType() {
  return test('GET services with serviceType filter', async () => {
    const response = await fetch(
      `${BASE_URL}/bookings/ancillary/services?offerId=${TEST_OFFER_ID}&serviceType=baggage`
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`HTTP ${response.status}`);
    }
  });
}

async function runAllTests() {
  console.log('\n📋 Ancillary Services Integration Tests\n');
  console.log(`Base URL: ${BASE_URL}`);
  console.log('-------------------------------------------\n');

  // Basic endpoint tests
  console.log('🔍 Basic Endpoint Tests:');
  await testHealthEndpoint();
  await testGetServiceCategories();
  await testGetServiceDetails();

  console.log('\n📦 Booking Flow Tests:');
  await testGetServicesForBooking();
  await testGetServicesForBookingMissingParam();
  await testGetServicesForBookingBothParams();
  await testSelectServicesForBooking();
  await testSelectServicesForBookingMissingServices();
  await testSelectServicesEmptyArray();
  await testFilterByServiceType();

  console.log('\n🛒 Post-Booking Flow Tests:');
  await testGetServicesForOrder();
  await testAddServicesToOrder();

  // Summary
  console.log('\n-------------------------------------------');
  console.log('📊 Test Summary\n');

  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  const total = results.length;
  const duration = results.reduce((sum, r) => sum + r.duration, 0);

  console.log(`Total: ${total} | Passed: ${passed} ✅ | Failed: ${failed} ❌`);
  console.log(`Total Duration: ${duration}ms\n`);

  if (failed > 0) {
    console.log('❌ Failed Tests:\n');
    results
      .filter(r => r.status === 'FAIL')
      .forEach(r => {
        console.log(`  • ${r.name}`);
        if (r.error) console.log(`    → ${r.error}`);
      });
  }

  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});
