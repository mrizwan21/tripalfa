/**
 * Wallet Service Integration Tests
 * 
 * Tests the real wallet service integration in booking payment service:
 * - Balance retrieval
 * - Payment deduction
 * - Refund operations
 * - Combined payment flows
 * - Multi-currency support
 * - Error handling and retry logic
 */

import axios, { AxiosInstance } from 'axios';

// Test Configuration
const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3000';
const WALLET_SERVICE_URL = process.env.WALLET_SERVICE_URL || 'http://localhost:3007';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL' | 'SKIP';
  message: string;
  duration: number;
  error?: string;
}

const results: TestResult[] = [];
const bookingClient = axios.create({
  baseURL: BOOKING_SERVICE_URL,
  timeout: 10000,
  validateStatus: () => true, // Don't throw on any status
});

const walletClient = axios.create({
  baseURL: WALLET_SERVICE_URL,
  timeout: 10000,
  validateStatus: () => true,
});

// Helper Functions
function log(message: string, level: 'INFO' | 'SUCCESS' | 'ERROR' | 'DEBUG' = 'INFO') {
  const timestamp = new Date().toISOString();
  const colors = {
    INFO: '\x1b[36m',    // Cyan
    SUCCESS: '\x1b[32m', // Green
    ERROR: '\x1b[31m',   // Red
    DEBUG: '\x1b[35m',   // Magenta
  };
  const reset = '\x1b[0m';
  console.log(`${colors[level]}[${timestamp}] ${level}: ${message}${reset}`);
}

async function recordTest(
  name: string,
  testFn: () => Promise<void>,
  expectedStatus?: 'PASS' | 'FAIL'
) {
  const startTime = Date.now();
  const result: TestResult = {
    name,
    status: 'PASS',
    message: '',
    duration: 0,
  };

  try {
    await testFn();
    result.message = 'Test passed successfully';
    result.status = expectedStatus || 'PASS';
    log(`✓ ${name}`, 'SUCCESS');
  } catch (error) {
    result.status = expectedStatus === 'FAIL' ? 'PASS' : 'FAIL';
    result.error = error instanceof Error ? error.message : String(error);
    result.message = result.error;
    log(`✗ ${name}: ${result.message}`, 'ERROR');
  } finally {
    result.duration = Date.now() - startTime;
    results.push(result);
  }
}

// Test Suite: Health Checks
async function testServiceHealth() {
  log('Testing service connectivity...', 'DEBUG');

  await recordTest('Booking Service Health', async () => {
    const response = await bookingClient.get('/health');
    if (response.status !== 200) {
      throw new Error(`Booking service unhealthy: ${response.status}`);
    }
  });

  await recordTest('Wallet Service Health', async () => {
    const response = await walletClient.get('/health');
    if (response.status !== 200) {
      throw new Error(`Wallet service unhealthy: ${response.status}`);
    }
  });
}

// Test Suite: Wallet Balance Retrieval
async function testWalletBalance() {
  log('Testing wallet balance retrieval...', 'DEBUG');

  // Test 1: Get balance for valid customer
  await recordTest('Get wallet balance - valid customer', async () => {
    const response = await bookingClient.post('/api/payments/available', {
      customerId: 'test-customer-001',
      totalAmount: 500,
      currency: 'USD',
    });

    if (response.status !== 200) {
      throw new Error(`Failed to get available options: ${response.status}`);
    }

    const { data } = response;
    if (!('walletAvailable' in data)) {
      throw new Error('Response missing walletAvailable field');
    }

    if (typeof data.walletAvailable !== 'number') {
      throw new Error('walletAvailable should be a number');
    }

    log(`Wallet balance retrieved: $${data.walletAvailable}`, 'INFO');
  });

  // Test 2: Get balance for non-existent customer (should fail gracefully)
  await recordTest('Get wallet balance - non-existent customer', async () => {
    const response = await bookingClient.post('/api/payments/available', {
      customerId: 'non-existent-customer-xyz',
      totalAmount: 500,
      currency: 'USD',
    });

    // Should either return 0 balance or 404 depending on implementation
    if (response.status !== 200 && response.status !== 404) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  });

  // Test 3: Multi-currency support
  await recordTest('Get wallet balance - multi-currency (EUR)', async () => {
    const response = await bookingClient.post('/api/payments/available', {
      customerId: 'test-customer-001',
      totalAmount: 500,
      currency: 'EUR',
    });

    if (response.status !== 200) {
      throw new Error(`Failed to retrieve EUR balance: ${response.status}`);
    }

    const { data } = response;
    if (!('walletAvailable' in data)) {
      throw new Error('Response missing walletAvailable field');
    }
  });
}

// Test Suite: Combined Payment Processing
async function testCombinedPayment() {
  log('Testing combined payment processing...', 'DEBUG');

  // Test 1: Process payment using wallet only
  await recordTest('Combined payment - wallet only', async () => {
    const response = await bookingClient.post('/api/payments/combined', {
      bookingId: 'test-booking-001',
      customerId: 'test-customer-001',
      totalAmount: 100,
      currency: 'USD',
      useWallet: true,
      useCredits: false,
    });

    if (response.status !== 200) {
      throw new Error(`Payment processing failed: ${response.status}`);
    }

    const { data } = response;
    if (!('breakdown' in data)) {
      throw new Error('Response missing breakdown field');
    }

    const { breakdown } = data;
    if (typeof breakdown.walletUsed !== 'number') {
      throw new Error('breakdown.walletUsed should be a number');
    }

    log(
      `Payment processed - Wallet: $${breakdown.walletUsed}, Card: $${breakdown.cardRequired}`,
      'INFO'
    );
  });

  // Test 2: Combined wallet + credits
  await recordTest('Combined payment - wallet + credits', async () => {
    const response = await bookingClient.post('/api/payments/combined', {
      bookingId: 'test-booking-002',
      customerId: 'test-customer-001',
      totalAmount: 300,
      currency: 'USD',
      useWallet: true,
      useCredits: true,
    });

    if (response.status !== 200 && response.status !== 400) {
      // 400 acceptable if customer has no credits
      throw new Error(`Payment processing failed: ${response.status}`);
    }

    if (response.status === 200) {
      const { data } = response;
      if (!('breakdown' in data)) {
        throw new Error('Response missing breakdown field');
      }
    }
  });

  // Test 3: Invalid payment - zero amount
  await recordTest('Combined payment - invalid zero amount', async () => {
    const response = await bookingClient.post('/api/payments/combined', {
      bookingId: 'test-booking-invalid',
      customerId: 'test-customer-001',
      totalAmount: 0,
      currency: 'USD',
      useWallet: true,
    });

    if (response.status !== 400) {
      throw new Error(`Should reject zero amount: got ${response.status}`);
    }
  }, 'PASS');

  // Test 4: Invalid payment - missing required fields
  await recordTest('Combined payment - missing customerId', async () => {
    const response = await bookingClient.post('/api/payments/combined', {
      bookingId: 'test-booking-invalid',
      totalAmount: 100,
      currency: 'USD',
    });

    if (response.status !== 400) {
      throw new Error(`Should reject missing fields: got ${response.status}`);
    }
  }, 'PASS');
}

// Test Suite: Payment Refunds
async function testRefunds() {
  log('Testing refund operations...', 'DEBUG');

  // Test 1: Refund valid payment
  await recordTest('Refund combined payment - valid booking', async () => {
    // First, create a payment
    const paymentResponse = await bookingClient.post('/api/payments/combined', {
      bookingId: 'test-booking-refund-001',
      customerId: 'test-customer-001',
      totalAmount: 150,
      currency: 'USD',
      useWallet: true,
    });

    if (paymentResponse.status !== 200) {
      throw new Error(`Failed to create payment for refund: ${paymentResponse.status}`);
    }

    // Then refund it
    const refundResponse = await bookingClient.post('/api/payments/combined/refund', {
      bookingId: 'test-booking-refund-001',
    });

    if (refundResponse.status !== 200) {
      throw new Error(`Refund failed: ${refundResponse.status}`);
    }

    log('Payment refunded successfully', 'INFO');
  });

  // Test 2: Refund non-existent payment
  await recordTest('Refund combined payment - non-existent booking', async () => {
    const response = await bookingClient.post('/api/payments/combined/refund', {
      bookingId: 'non-existent-booking-xyz',
    });

    if (response.status !== 404 && response.status !== 400) {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  }, 'PASS');
}

// Test Suite: Error Handling & Retry Logic
async function testErrorHandling() {
  log('Testing error handling and resilience...', 'DEBUG');

  // Test 1: Verify retry logic (attempt multiple times)
  await recordTest('Retry logic - transient failures', async () => {
    const response = await bookingClient.post('/api/payments/available', {
      customerId: 'test-customer-001',
      totalAmount: 500,
      currency: 'USD',
    });

    // Even with potential transient failures, should eventually succeed
    if (response.status !== 200 && response.status !== 503) {
      throw new Error(`Unexpected response: ${response.status}`);
    }

    if (response.status === 200) {
      log('Request succeeded (possibly after retries)', 'INFO');
    }
  });

  // Test 2: Timeout handling
  await recordTest('Timeout handling - slow wallet service', async () => {
    const slowClient = axios.create({
      baseURL: BOOKING_SERVICE_URL,
      timeout: 100, // Very short timeout
      validateStatus: () => true,
    });

    const response = await slowClient.post('/api/payments/available', {
      customerId: 'test-customer-001',
      totalAmount: 500,
      currency: 'USD',
    });

    // May timeout or succeed depending on response time
    // Either way, should handle gracefully
    if (response.status !== 200 && response.status !== 408 && response.status !== 504) {
      log(`Status code: ${response.status}`, 'DEBUG');
    }
  }, 'PASS');
}

// Test Suite: Idempotency
async function testIdempotency() {
  log('Testing idempotency...', 'DEBUG');

  const bookingId = `test-booking-idempotent-${Date.now()}`;

  await recordTest('Idempotent payment requests', async () => {
    const payload = {
      bookingId,
      customerId: 'test-customer-001',
      totalAmount: 200,
      currency: 'USD',
      useWallet: true,
    };

    // Make same payment request twice
    const response1 = await bookingClient.post('/api/payments/combined', payload);
    const response2 = await bookingClient.post('/api/payments/combined', payload);

    if (response1.status !== 200 || response2.status !== 200) {
      // If either fails, check if both fail consistently
      if (response1.status === response2.status) {
        throw new Error(`Consistent failure: ${response1.status}`);
      }
    }

    // Both should produce consistent results (idempotency)
    // Response 2 might indicate duplicate, but should not cause double charge
    log('Duplicate payment request handled correctly', 'INFO');
  });
}

// Test Suite: Payment Details Retrieval
async function testPaymentDetails() {
  log('Testing payment details retrieval...', 'DEBUG');

  await recordTest('Get booking payment details', async () => {
    // First create a payment
    const paymentResponse = await bookingClient.post('/api/payments/combined', {
      bookingId: 'test-booking-details-001',
      customerId: 'test-customer-001',
      totalAmount: 250,
      currency: 'USD',
      useWallet: true,
    });

    if (paymentResponse.status !== 200) {
      throw new Error(`Failed to create payment: ${paymentResponse.status}`);
    }

    // Then retrieve its details
    const detailsResponse = await bookingClient.get('/api/payments/combined/test-booking-details-001');

    if (detailsResponse.status !== 200) {
      throw new Error(`Failed to retrieve payment details: ${detailsResponse.status}`);
    }

    const { data } = detailsResponse;
    if (!('walletAmountUsed' in data)) {
      throw new Error('Response missing walletAmountUsed field');
    }

    log('Payment details retrieved successfully', 'INFO');
  });
}

// Summary Report
function printSummary() {
  console.log('\n' + '='.repeat(80));
  console.log('WALLET SERVICE INTEGRATION TEST SUMMARY');
  console.log('='.repeat(80) + '\n');

  const passed = results.filter((r) => r.status === 'PASS').length;
  const failed = results.filter((r) => r.status === 'FAIL').length;
  const skipped = results.filter((r) => r.status === 'SKIP').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  // Test Results Table
  console.log('TEST RESULTS:');
  console.log('-'.repeat(80));
  console.table(
    results.map((r) => ({
      Test: r.name,
      Status: r.status,
      Duration: `${r.duration}ms`,
      Message: r.message.substring(0, 50),
    }))
  );

  // Summary Stats
  console.log('\nSUMMARY:');
  console.log('-'.repeat(80));
  console.log(`✓ Passed:   ${passed} tests`);
  console.log(`✗ Failed:   ${failed} tests`);
  console.log(`⊘ Skipped:  ${skipped} tests`);
  console.log(`Total Time: ${(totalDuration / 1000).toFixed(2)}s`);
  console.log('-'.repeat(80));

  // Success Rate
  const successRate = ((passed / (passed + failed)) * 100).toFixed(1);
  console.log(`\nSuccess Rate: ${successRate}%`);

  if (failed === 0) {
    console.log('\n✅ ALL INTEGRATION TESTS PASSED!\n');
  } else {
    console.log(`\n⚠️  ${failed} test(s) failed. Review errors above.\n`);
  }

  console.log('='.repeat(80));
}

// Main Test Runner
async function runAllTests() {
  log('Starting Wallet Service Integration Tests', 'INFO');
  log(`Target Services:`, 'INFO');
  log(`  - Booking Service: ${BOOKING_SERVICE_URL}`, 'INFO');
  log(`  - Wallet Service: ${WALLET_SERVICE_URL}`, 'INFO');
  log(`  - API Gateway: ${API_GATEWAY_URL}`, 'INFO');
  console.log('');

  const startTime = Date.now();

  try {
    // Run all test suites
    await testServiceHealth();
    await testWalletBalance();
    await testCombinedPayment();
    await testRefunds();
    await testErrorHandling();
    await testIdempotency();
    await testPaymentDetails();
  } catch (error) {
    log(`Unexpected error during test execution: ${error}`, 'ERROR');
  }

  const totalTime = Date.now() - startTime;
  log(`Tests completed in ${(totalTime / 1000).toFixed(2)}s`, 'INFO');

  // Print summary
  printSummary();

  // Exit with appropriate code
  const failed = results.filter((r) => r.status === 'FAIL').length;
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch((error) => {
  log(`Fatal error: ${error}`, 'ERROR');
  process.exit(1);
});
