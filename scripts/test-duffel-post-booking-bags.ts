/**
 * Duffel Post-Booking Bags API Test Suite
 * Tests all baggage service endpoints
 *
 * Usage:
 *   npx ts-node scripts/test-duffel-post-booking-bags.ts              # Run all tests
 *   npx ts-node scripts/test-duffel-post-booking-bags.ts eligibility # Test single endpoint
 */

import axios, { AxiosError } from 'axios';

// Configuration from environment variables
const API_BASE_URL = process.env.API_BASE_URL || 'http://localhost:3007/api';
const TEST_ORDER_ID = process.env.TEST_ORDER_ID || 'ord_duffel123';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'test-bearer-token';
const VERBOSE = process.env.VERBOSE === 'true';

interface TestResult {
  name: string;
  passed: boolean;
  message?: string;
  error?: string;
  data?: any;
}

const results: TestResult[] = [];

// Create axios instance with default headers
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Authorization': `Bearer ${AUTH_TOKEN}`,
    'Content-Type': 'application/json',
  },
  validateStatus: () => true, // Don't throw on any status code
});

function log(title: string, data?: any) {
  console.log(`\n${title}`);
  if (data && VERBOSE) {
    console.log(JSON.stringify(data, null, 2));
  }
}

function logResponse(response: any) {
  if (VERBOSE) {
    console.log(`Status: ${response.status}`);
    console.log(`Data: ${JSON.stringify(response.data, null, 2)}`);
  }
}

/**
 * Test 1: Check baggage eligibility
 */
async function testCheckBaggageEligibility(): Promise<TestResult> {
  try {
    log(`\n📋 Testing: Check Baggage Eligibility`);
    log(`Endpoint: GET /bookings/orders/${TEST_ORDER_ID}/baggage-eligibility`);

    const response = await api.get(`/bookings/orders/${TEST_ORDER_ID}/baggage-eligibility`);
    logResponse(response);

    const passed = response.status === 200 && response.data.success;

    if (passed) {
      const eligible = response.data.data?.eligible;
      log(`✅ Eligibility Check Success`, {
        eligible,
        availableBaggages: response.data.data?.availableBaggages?.length || 0,
      });
    } else {
      log(`❌ Eligibility Check Failed`, response.data);
    }

    return {
      name: 'Check Baggage Eligibility',
      passed,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof AxiosError ? error.message : String(error);
    log(`❌ Error checking eligibility: ${message}`);
    return {
      name: 'Check Baggage Eligibility',
      passed: false,
      error: message,
    };
  }
}

/**
 * Test 2: Get available baggages
 */
async function testGetAvailableBaggages(): Promise<TestResult> {
  try {
    log(`\n🛄 Testing: Get Available Baggages`);
    log(`Endpoint: GET /bookings/orders/${TEST_ORDER_ID}/available-baggage`);

    const response = await api.get(`/bookings/orders/${TEST_ORDER_ID}/available-baggage`);
    logResponse(response);

    const passed = response.status === 200 && response.data.success;

    if (passed) {
      const baggages = response.data.data?.baggages || [];
      log(`✅ Available Baggages Retrieved`, {
        count: baggages.length,
        baggages: baggages.slice(0, 2), // Show first 2
      });

      if (baggages.length === 0) {
        log(`⚠️  Warning: No baggage services available for this order`);
      }
    } else {
      log(`❌ Failed to retrieve baggages`, response.data);
    }

    return {
      name: 'Get Available Baggages',
      passed,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof AxiosError ? error.message : String(error);
    log(`❌ Error retrieving baggages: ${message}`);
    return {
      name: 'Get Available Baggages',
      passed: false,
      error: message,
    };
  }
}

/**
 * Test 3: Get available baggages and extract service IDs for booking
 */
async function getAvailableBaggageServices(): Promise<any[]> {
  try {
    const response = await api.get(`/bookings/orders/${TEST_ORDER_ID}/available-baggage`);
    return response.data?.data?.baggages || [];
  } catch {
    return [];
  }
}

/**
 * Test 4: Book baggage services
 */
async function testBookBaggageServices(): Promise<TestResult> {
  try {
    log(`\n🎫 Testing: Book Baggage Services`);
    log(`Endpoint: POST /bookings/orders/${TEST_ORDER_ID}/book-baggage`);

    // Get available baggages first
    const availableBaggages = await getAvailableBaggageServices();

    if (availableBaggages.length === 0) {
      log(`⚠️  Cannot test booking: No available baggages for this order`);
      return {
        name: 'Book Baggage Services',
        passed: false,
        message: 'No available baggages to book',
      };
    }

    // Build booking request with first available baggage
    const firstBag = availableBaggages[0];
    const bookingRequest = {
      baggages: [
        {
          id: firstBag.id,
          quantity: 1,
        },
      ],
      payment: {
        type: 'balance',
        currency: firstBag.totalCurrency,
        amount: firstBag.totalAmount,
      },
    };

    log(`Booking request:`, bookingRequest);

    const response = await api.post(`/bookings/orders/${TEST_ORDER_ID}/book-baggage`, bookingRequest);
    logResponse(response);

    const passed = (response.status === 201 || response.status === 200) && response.data.success;

    if (passed) {
      log(`✅ Baggage Booking Success`, {
        baggagesBooked: response.data.data?.baggagesBooked,
        totalAmount: response.data.data?.totalAmount,
        totalCurrency: response.data.data?.totalCurrency,
      });
    } else {
      log(`❌ Baggage Booking Failed`, response.data);
    }

    return {
      name: 'Book Baggage Services',
      passed,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof AxiosError ? error.message : String(error);
    log(`❌ Error booking baggage: ${message}`);
    return {
      name: 'Book Baggage Services',
      passed: false,
      error: message,
    };
  }
}

/**
 * Test 5: Get booked baggages
 */
async function testGetOrderBaggages(): Promise<TestResult> {
  try {
    log(`\n📦 Testing: Get Booked Baggage Services`);
    log(`Endpoint: GET /bookings/orders/${TEST_ORDER_ID}/baggage-services`);

    const response = await api.get(`/bookings/orders/${TEST_ORDER_ID}/baggage-services`);
    logResponse(response);

    const passed = response.status === 200 && response.data.success;

    if (passed) {
      const baggages = response.data.data?.baggages || [];
      log(`✅ Booked Baggages Retrieved`, {
        count: baggages.length,
        baggages: baggages.slice(0, 2), // Show first 2
      });

      if (baggages.length === 0) {
        log(`ℹ️  Information: No baggage services booked on this order yet`);
      }
    } else {
      log(`❌ Failed to retrieve booked baggages`, response.data);
    }

    return {
      name: 'Get Booked Baggage Services',
      passed,
      data: response.data,
    };
  } catch (error) {
    const message = error instanceof AxiosError ? error.message : String(error);
    log(`❌ Error retrieving booked baggages: ${message}`);
    return {
      name: 'Get Booked Baggage Services',
      passed: false,
      error: message,
    };
  }
}

/**
 * Run complete workflow test
 */
async function runCompleteWorkflow(): Promise<void> {
  log(`\n🔄 Running Complete Workflow Test`);
  log(`Order ID: ${TEST_ORDER_ID}`);
  log(`API Base: ${API_BASE_URL}`);

  // Step 1: Check eligibility
  const eligibilityResult = await testCheckBaggageEligibility();
  results.push(eligibilityResult);

  if (!eligibilityResult.passed) {
    log(`❌ Workflow stopped: Order not eligible for baggage`);
    return;
  }

  // Step 2: Get available baggages
  const availableResult = await testGetAvailableBaggages();
  results.push(availableResult);

  if (!availableResult.passed) {
    log(`❌ Workflow stopped: Could not retrieve available baggages`);
    return;
  }

  // Step 3: Book baggage (commented out to avoid actual charges - uncomment to test)
  // const bookResult = await testBookBaggageServices();
  // results.push(bookResult);
  // if (!bookResult.passed) {
  //   log(`❌ Workflow stopped: Could not book baggage`);
  //   return;
  // }

  // Step 4: Get booked baggages
  const bookedResult = await testGetOrderBaggages();
  results.push(bookedResult);

  log(`\n✅ Workflow test complete`);
}

/**
 * Run single test by name
 */
async function runSingleTest(testName: string): Promise<void> {
  const testMap: { [key: string]: () => Promise<TestResult> } = {
    eligibility: testCheckBaggageEligibility,
    available: testGetAvailableBaggages,
    book: testBookBaggageServices,
    booked: testGetOrderBaggages,
  };

  const testFn = testMap[testName.toLowerCase()];

  if (!testFn) {
    console.log(`\n❌ Unknown test: ${testName}`);
    console.log(`Available tests: eligibility, available, book, booked`);
    return;
  }

  log(`\n🧪 Running single test: ${testName}`);
  const result = await testFn();
  results.push(result);
}

/**
 * Print test results summary
 */
function printResults(): void {
  log(`\n${'='.repeat(60)}`);
  log(`📊 Test Results Summary`);
  log(`${'='.repeat(60)}`);

  if (results.length === 0) {
    log(`No tests ran`);
    return;
  }

  let passed = 0;
  let failed = 0;

  results.forEach((result) => {
    const status = result.passed ? '✅' : '❌';
    console.log(`${status} ${result.name}`);

    if (result.message) {
      console.log(`   Message: ${result.message}`);
    }
    if (result.error) {
      console.log(`   Error: ${result.error}`);
    }

    if (result.passed) {
      passed++;
    } else {
      failed++;
    }
  });

  log(`\n📈 Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  log(`Success rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);
  log(`${'='.repeat(60)}\n`);
}

/**
 * Main execution
 */
async function main(): Promise<void> {
  try {
    const testArg = process.argv[2];

    if (testArg) {
      // Run single test
      await runSingleTest(testArg);
    } else {
      // Run complete workflow
      await runCompleteWorkflow();
    }

    // Print results
    printResults();

    // Exit with appropriate code
    const failed = results.filter((r) => !r.passed).length;
    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

// Run tests
main();
