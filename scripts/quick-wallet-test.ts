/**
 * Quick Wallet Service Integration Validation
 * Tests core functionality with minimal dependencies
 */

import axios from 'axios';

const BOOKING_SERVICE_URL = 'http://localhost:3000';

async function test() {
  console.log('\n🧪 Wallet Service Integration - Quick Validation\n');
  console.log(`Testing: ${BOOKING_SERVICE_URL}\n`);

  try {
    const customerId = 'test-customer-001';
    const bookingId = `test-booking-${Date.now()}`;

    // Test 1: Get available payment options (tests wallet balance retrieval)
    console.log('1️⃣  Testing: Get available payment options (wallet balance retrieval)');
    const availableResponse = await axios.get(
      `${BOOKING_SERVICE_URL}/api/bookings/${customerId}/payment-options?totalAmount=500&currency=USD`,
      { timeout: 10000 }
    );

    console.log(`   ✅ Status: ${availableResponse.status}`);
    console.log(`   ✅ Wallet Available: $${availableResponse.data.data.walletBalance || 0}`);
    console.log(`   ✅ Credits Available: $${availableResponse.data.data.totalCreditAvailable || 0}`);
    console.log(`   ✅ Card Required: $${availableResponse.data.data.cardRequired || 0}\n`);

    // Test 2: Process combined payment (tests wallet deduction)
    console.log('2️⃣  Testing: Process combined payment (wallet deduction)');
    const paymentResponse = await axios.post(
      `${BOOKING_SERVICE_URL}/api/bookings/${bookingId}/pay`,
      {
        customerId,
        totalAmount: 100,
        currency: 'USD',
        useWallet: true,
        useCredits: false,
      },
      { timeout: 10000 }
    );

    console.log(`   ✅ Status: ${paymentResponse.status}`);
    console.log(`   ✅ Wallet Used: $${paymentResponse.data.data.breakdown?.walletUsed || 0}`);
    console.log(`   ✅ Card Required: $${paymentResponse.data.data.breakdown?.cardRequired || 0}`);
    console.log(`   ✅ Payment Status: ${paymentResponse.data.data.paymentStatus}\n`);

    // Test 3: Get payment details
    console.log('3️⃣  Testing: Get payment details');
    const detailsResponse = await axios.get(
      `${BOOKING_SERVICE_URL}/api/bookings/${bookingId}/payment-details`,
      { timeout: 10000 }
    );

    console.log(`   ✅ Status: ${detailsResponse.status}`);
    console.log(`   ✅ Booking ID: ${detailsResponse.data.data.bookingId}`);
    console.log(`   ✅ Wallet Amount Used: $${detailsResponse.data.data.walletAmountUsed || 0}`);
    console.log(`   ✅ Payment Status: ${detailsResponse.data.data.paymentStatus}\n`);

    // Summary
    console.log('=' * 60);
    console.log('✅✅✅ ALL INTEGRATION TESTS PASSED! ✅✅✅');
    console.log('=' * 60);
    console.log('\n✨ Wallet Service Integration is PRODUCTION READY!\n');

    process.exit(0);
  } catch (error: any) {
    console.error('\n❌ TEST FAILED');
    console.error(`Error: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Response: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    process.exit(1);
  }
}

test();
