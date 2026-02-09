/**
 * Integration Test: Seat Maps Feature
 * Tests the complete backend-frontend integration flow
 */

import fetch from 'node-fetch';

const API_BASE = 'http://localhost:3001';
const FRONTEND_URL = 'http://localhost:5173';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  error?: string;
  duration: number;
}

const results: TestResult[] = [];

async function test(name: string, fn: () => Promise<void>) {
  const start = Date.now();
  try {
    await fn();
    results.push({
      name,
      status: 'PASS',
      duration: Date.now() - start
    });
    console.log(`✅ ${name} (${Date.now() - start}ms)`);
  } catch (error: any) {
    results.push({
      name,
      status: 'FAIL',
      error: error.message,
      duration: Date.now() - start
    });
    console.log(`❌ ${name}: ${error.message}`);
  }
}

async function testBookingFlow() {
  const response = await fetch(
    `${API_BASE}/bookings/flight/seat-maps?offerId=offer_00007ZiY9N4mTK0K`,
    { headers: { Accept: 'application/json' } }
  );
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  const data: any = await response.json();
  
  if (!data.success) {
    throw new Error('Response success: false');
  }
  
  if (!data.data.seat_maps) {
    throw new Error('Missing seat_maps in response');
  }
  
  if (!data.data.aircraft_config) {
    throw new Error('Missing aircraft_config in response');
  }
}

async function testPostBookingFlow() {
  const response = await fetch(
    `${API_BASE}/bookings/flight/seat-maps?orderId=ord_00007XiY9N4mTK0K`,
    { headers: { Accept: 'application/json' } }
  );
  
  if (response.status !== 200) {
    throw new Error(`Expected 200, got ${response.status}`);
  }
  
  const data: any = await response.json();
  
  if (!data.success) {
    throw new Error('Response success: false');
  }
  
  if (!data.data.current_seats) {
    throw new Error('Missing current_seats in post-booking response');
  }
  
  if (!Array.isArray(data.data.current_seats)) {
    throw new Error('current_seats should be an array');
  }
}

async function testMissingParameterError() {
  const response = await fetch(
    `${API_BASE}/bookings/flight/seat-maps`,
    { headers: { Accept: 'application/json' } }
  );
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  const data: any = await response.json();
  
  if (data.error !== 'MISSING_PARAMETER') {
    throw new Error(`Expected MISSING_PARAMETER error, got ${data.error}`);
  }
}

async function testInvalidIdError() {
  const response = await fetch(
    `${API_BASE}/bookings/flight/seat-maps?offerId=invalid`,
    { headers: { Accept: 'application/json' } }
  );
  
  if (response.status !== 400) {
    throw new Error(`Expected 400, got ${response.status}`);
  }
  
  const data: any = await response.json();
  
  if (data.error !== 'INVALID_OFFER_ID') {
    throw new Error(`Expected INVALID_OFFER_ID error, got ${data.error}`);
  }
}

async function testFrontendAvailable() {
  const response = await fetch(FRONTEND_URL);
  if (response.status !== 200) {
    throw new Error(`Frontend returned ${response.status}`);
  }
}

async function runTests() {
  console.log('\n🧪 SEAT MAPS INTEGRATION TEST SUITE\n');
  console.log('Testing endpoints...\n');
  
  await test('Booking Flow - Get Available Seats', testBookingFlow);
  await test('Post-Booking Flow - Get Current + Available Seats', testPostBookingFlow);
  await test('Error Handling - Missing Parameter', testMissingParameterError);
  await test('Error Handling - Invalid ID', testInvalidIdError);
  await test('Frontend Available', testFrontendAvailable);
  
  console.log('\n📊 TEST RESULTS\n');
  
  const passed = results.filter(r => r.status === 'PASS').length;
  const failed = results.filter(r => r.status === 'FAIL').length;
  
  results.forEach(r => {
    const status = r.status === 'PASS' ? '✅' : '❌';
    console.log(`${status} ${r.name.padEnd(50)} ${r.duration}ms`);
    if (r.error) {
      console.log(`   Error: ${r.error}`);
    }
  });
  
  console.log(`\n${passed} PASSED | ${failed} FAILED\n`);
  
  if (failed > 0) {
    console.log('⚠️  Some tests failed. Ensure both services are running:');
    console.log('   Backend: npm run dev --workspace=@tripalfa/booking-service');
    console.log('   Frontend: npm run dev --workspace=@tripalfa/booking-engine\n');
    process.exit(1);
  } else {
    console.log('✅ All tests passed! Integration is working correctly.\n');
    process.exit(0);
  }
}

// Wait a moment for services to potentially start, then run tests
setTimeout(runTests, 2000);
