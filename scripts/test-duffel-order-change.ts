/**
 * Duffel Order Change API Test Script
 * 
 * This script demonstrates how to use the order change functionality
 * through the Duffel API integration.
 * 
 * Usage: npx ts-node scripts/test-duffel-order-change.ts
 */

import fetch from 'node-fetch';

const BASE_URL = process.env.API_BASE_URL || 'http://localhost:3007/api';
const AUTH_TOKEN = process.env.AUTH_TOKEN || 'your-auth-token';

// Test order ID (replace with your test order)
const TEST_ORDER_ID = process.env.TEST_ORDER_ID || 'ord_0000A8LBrykRxt3J1MGlcG';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * Make API request with authentication
 */
async function apiCall<T>(
  method: string,
  endpoint: string,
  body?: any
): Promise<T> {
  const url = `${BASE_URL}${endpoint}`;
  console.log(`\n📡 ${method} ${endpoint}`);

  try {
    const options: any = {
      method,
      headers: {
        'Authorization': `Bearer ${AUTH_TOKEN}`,
        'Content-Type': 'application/json'
      }
    };

    if (body) {
      options.body = JSON.stringify(body);
      console.log('📤 Request body:', JSON.stringify(body, null, 2));
    }

    const response = await fetch(url, options);
    const data = (await response.json()) as T;

    if (!response.ok) {
      console.error('❌ Error:', (data as any).error);
      throw new Error((data as any).error || `HTTP ${response.status}`);
    }

    console.log('✅ Response:', JSON.stringify(data, null, 2));
    return data;
  } catch (error) {
    console.error('💥 Request failed:', error);
    throw error;
  }
}

/**
 * Test 1: Check if order is changeable
 */
async function testCheckEligibility(): Promise<string | null> {
  console.log('\n====================================');
  console.log('🔍 TEST 1: Check Order Change Eligibility');
  console.log('====================================');

  try {
    const response = await apiCall<any>(
      'GET',
      `/bookings/orders/${TEST_ORDER_ID}/change-eligibility`
    );

    if (!response.data?.changeable) {
      console.log('⚠️  Order is not changeable');
      return null;
    }

    console.log('✅ Order is changeable');
    const sliceId = response.data.changeableSlices[0]?.id;
    console.log(`📍 First changeable slice ID: ${sliceId}`);
    return sliceId;
  } catch (error) {
    console.error('Test failed');
    return null;
  }
}

/**
 * Test 2: Create order change request
 */
async function testCreateChangeRequest(sliceId: string): Promise<string | null> {
  console.log('\n====================================');
  console.log('📝 TEST 2: Create Order Change Request');
  console.log('====================================');

  try {
    const response = await apiCall<any>(
      'POST',
      `/bookings/orders/${TEST_ORDER_ID}/change-request`,
      {
        slices: {
          remove: [
            {
              slice_id: sliceId
            }
          ],
          add: [
            {
              origin: 'LAX',
              destination: 'JFK',
              departure_date: '2026-06-24',
              cabin_class: 'economy'
            }
          ]
        }
      }
    );

    const changeRequestId = response.data?.id;
    console.log(`✅ Change request created: ${changeRequestId}`);
    return changeRequestId;
  } catch (error) {
    console.error('Test failed');
    return null;
  }
}

/**
 * Test 3: Get available change offers
 */
async function testGetOffers(changeRequestId: string): Promise<string | null> {
  console.log('\n====================================');
  console.log('🎟️  TEST 3: Get Available Change Offers');
  console.log('====================================');

  try {
    const response = await apiCall<any>(
      'GET',
      `/bookings/order-changes/${changeRequestId}/offers`
    );

    const offersCount = response.data?.offersCount || 0;
    console.log(`✅ Found ${offersCount} offers`);

    if (offersCount === 0) {
      console.log('⚠️  No offers available');
      return null;
    }

    const firstOferId = response.data?.offers[0]?.id;
    console.log(`📍 First offer ID: ${firstOferId}`);
    console.log(`💰 Price change: ${response.data?.offers[0]?.changeTotalCurrency} ${response.data?.offers[0]?.changeTotalAmount}`);
    console.log(`⚖️  Penalty: ${response.data?.offers[0]?.penaltyTotalAmount}`);

    return firstOferId;
  } catch (error) {
    console.error('Test failed');
    return null;
  }
}

/**
 * Test 4: Create pending order change
 */
async function testCreatePendingChange(offerId: string): Promise<string | null> {
  console.log('\n====================================');
  console.log('⏳ TEST 4: Create Pending Order Change');
  console.log('====================================');

  try {
    const response = await apiCall<any>(
      'POST',
      '/bookings/order-changes/pending',
      {
        orderChangeOfferId: offerId
      }
    );

    const changeId = response.data?.id;
    console.log(`✅ Pending change created: ${changeId}`);
    console.log(`💰 Total change amount: ${response.data?.changeTotalCurrency} ${response.data?.changeTotalAmount}`);
    return changeId;
  } catch (error) {
    console.error('Test failed');
    return null;
  }
}

/**
 * Test 5: Get pending change status
 */
async function testGetChangeStatus(changeId: string): Promise<void> {
  console.log('\n====================================');
  console.log('📊 TEST 5: Get Pending Change Status');
  console.log('====================================');

  try {
    const response = await apiCall<any>(
      'GET',
      `/bookings/order-changes/${changeId}/status`
    );

    console.log(`✅ Status retrieved`);
    console.log(`📋 Confirmed: ${response.data?.confirmed}`);
    console.log(`💰 Change amount: ${response.data?.changeTotalCurrency} ${response.data?.changeTotalAmount}`);
    console.log(`⚖️  Penalty: ${response.data?.penaltyTotalCurrency} ${response.data?.penaltyTotalAmount}`);
  } catch (error) {
    console.error('Test failed');
  }
}

/**
 * Test 6: Confirm order change
 */
async function testConfirmChange(changeId: string): Promise<void> {
  console.log('\n====================================');
  console.log('✅ TEST 6: Confirm Order Change');
  console.log('====================================');

  try {
    const response = await apiCall<any>(
      'POST',
      `/bookings/order-changes/${changeId}/confirm`,
      {
        payment: {
          type: 'balance',
          currency: 'GBP',
          amount: '0.00' // Change is a credit in this example
        }
      }
    );

    console.log(`✅ Order change confirmed`);
    console.log(`🎯 Confirmed at: ${response.data?.confirmedAt}`);
  } catch (error) {
    console.error('Test failed');
  }
}

/**
 * Run all tests in sequence
 */
async function runAllTests(): Promise<void> {
  console.log(`
╔════════════════════════════════════════════════════════╗
║    Duffel Order Change API Integration Tests          ║
╚════════════════════════════════════════════════════════╝
`);

  console.log(`Configuration:`);
  console.log(`- Base URL: ${BASE_URL}`);
  console.log(`- Test Order ID: ${TEST_ORDER_ID}`);

  try {
    // Test 1: Check eligibility
    const sliceId = await testCheckEligibility();
    if (!sliceId) {
      console.log('\n⚠️  Cannot proceed - order is not changeable');
      return;
    }

    // Test 2: Create change request
    const changeRequestId = await testCreateChangeRequest(sliceId);
    if (!changeRequestId) {
      console.log('\n⚠️  Cannot proceed - failed to create change request');
      return;
    }

    // Test 3: Get offers
    const offerId = await testGetOffers(changeRequestId);
    if (!offerId) {
      console.log('\n⚠️  Cannot proceed - no offers available');
      return;
    }

    // Test 4: Create pending change
    const changeId = await testCreatePendingChange(offerId);
    if (!changeId) {
      console.log('\n⚠️  Cannot proceed - failed to create pending change');
      return;
    }

    // Test 5: Get status
    await testGetChangeStatus(changeId);

    // Test 6: Confirm (optional - only if you want to finalize)
    const confirm = process.env.CONFIRM_CHANGE === 'true';
    if (confirm) {
      await testConfirmChange(changeId);
    } else {
      console.log('\n💡 To confirm the change, set CONFIRM_CHANGE=true');
    }

    console.log(`
╔════════════════════════════════════════════════════════╗
║              ✅ All Tests Completed!                  ║
╚════════════════════════════════════════════════════════╝
`);
  } catch (error) {
    console.error(`\n❌ Test suite failed:`, error);
    process.exit(1);
  }
}

/**
 * Run specific test
 */
async function runSpecificTest(testName: string): Promise<void> {
  const sliceId = 'sli_0000A8L6Pqy4nZVh0nPdK6'; // Replace with actual slice ID
  const changeRequestId = 'ocr_0000A8LBrykRxt3J1MGlcG'; // Replace with actual request ID
  const offerId = 'oco_0000A8LBrykRxt3J1MGlcG'; // Replace with actual offer ID
  const changeId = 'och_0000A8LBrykRxt3J1MGlcG'; // Replace with actual change ID

  switch (testName.toLowerCase()) {
    case 'eligibility':
      await testCheckEligibility();
      break;
    case 'request':
      await testCreateChangeRequest(sliceId);
      break;
    case 'offers':
      await testGetOffers(changeRequestId);
      break;
    case 'pending':
      await testCreatePendingChange(offerId);
      break;
    case 'status':
      await testGetChangeStatus(changeId);
      break;
    case 'confirm':
      await testConfirmChange(changeId);
      break;
    default:
      console.log(`❌ Unknown test: ${testName}`);
      console.log('Available tests: eligibility, request, offers, pending, status, confirm');
  }
}

// Main execution
const args = process.argv.slice(2);
if (args.length > 0) {
  runSpecificTest(args[0]).catch(console.error);
} else {
  runAllTests().catch(console.error);
}
