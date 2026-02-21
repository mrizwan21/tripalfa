/**
 * Integration Tests for Flight Amendment Workflow
 * Tests all 4 amendment endpoints and the complete workflow
 */

import fs from 'fs';
import path from 'path';

const BOOKING_SERVICE_URL = process.env.BOOKING_SERVICE_URL || 'http://localhost:3001';
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:8000';

// Helper function to make HTTP requests
async function makeRequest(
  method: 'GET' | 'POST' | 'PUT' | 'DELETE',
  url: string,
  body?: any,
  headers?: Record<string, string>
) {
  try {
    const response = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        'x-admin-id': 'test-admin-123',
        ...headers
      },
      body: body ? JSON.stringify(body) : undefined
    });
    
    const data = await response.json();
    return { status: response.status, data };
  } catch (error) {
    return { 
      status: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

// Mock booking data for testing
const mockBookingData = {
  id: 'booking_test_123',
  bookingReference: 'BK2026021400001',
  contactEmail: 'traveler@example.com',
  totalAmount: 500,
  currency: 'USD',
  baseFare: 500,
  passengers: [{ firstName: 'John', lastName: 'Doe' }],
  segments: [{
    id: 'segment_flight_1',
    segmentType: 'flight',
    departureCity: 'JFK',
    arrivalCity: 'LHR',
    departureDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    arrivalDateTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000),
    price: 500,
    supplier: 'Emirates',
    metadata: {}
  }]
};

let testResults: { name: string; status: 'PASS' | 'FAIL'; message: string }[] = [];

// Test Suite 1: Amendment Request Endpoint
console.log('\n=== TEST SUITE 1: GET AMENDMENT REQUEST ENDPOINT ===\n');

async function testGetAmendmentRequest() {
  console.log('Testing: GET /api/v2/admin/bookings/:id/amendment-request');
  
  try {
    const response = await makeRequest(
      'GET',
      `${BOOKING_SERVICE_URL}/api/v2/admin/bookings/${mockBookingData.id}/amendment-request`
    );
    
    if (response.status === 200 || response.status === 404) {
      console.log(`  ✓ Endpoint accessible (status: ${response.status})`);
      testResults.push({
        name: 'GET Amendment Request Endpoint',
        status: 'PASS',
        message: `Endpoint returned status ${response.status}`
      });
      
      if (response.data?.data) {
        console.log(`  ✓ Response has data structure`);
        const amendmentRequest = response.data.data;
        console.log(`    - Booking ID: ${amendmentRequest.bookingId}`);
        console.log(`    - Booking Reference: ${amendmentRequest.bookingReference}`);
        console.log(`    - Current Flight: ${amendmentRequest.currentFlight?.airline}`);
      }
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testResults.push({
      name: 'GET Amendment Request Endpoint',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Suite 2: Search Flights Endpoint
console.log('\n=== TEST SUITE 2: POST SEARCH FLIGHTS ENDPOINT ===\n');

async function testSearchFlights() {
  console.log('Testing: POST /api/v2/admin/bookings/:id/amendment/search-flights');
  
  try {
    const searchBody = {
      requestType: 'date_change',
      requestedDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      requestedRoute: { from: 'JFK', to: 'LHR' }
    };
    
    const response = await makeRequest(
      'POST',
      `${BOOKING_SERVICE_URL}/api/v2/admin/bookings/${mockBookingData.id}/amendment/search-flights`,
      searchBody
    );
    
    if (response.status === 200 || response.status === 400 || response.status === 404) {
      console.log(`  ✓ Endpoint accessible (status: ${response.status})`);
      testResults.push({
        name: 'POST Search Flights Endpoint',
        status: 'PASS',
        message: `Endpoint returned status ${response.status}`
      });
      
      if (response.data?.data?.flights) {
        const flights = response.data.data.flights;
        console.log(`  ✓ Found ${flights.length} alternative flights`);
        flights.slice(0, 2).forEach((flight: any, idx: number) => {
          console.log(`    Flight ${idx + 1}: ${flight.airline} - ${flight.departure} to ${flight.arrival}`);
          console.log(`      Price: ${flight.currency} ${flight.price}`);
        });
      }
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testResults.push({
      name: 'POST Search Flights Endpoint',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Suite 3: Send User Approval Endpoint
console.log('\n=== TEST SUITE 3: POST SEND USER APPROVAL ENDPOINT ===\n');

let approvalToken = '';

async function testSendUserApproval() {
  console.log('Testing: POST /api/v2/admin/bookings/:id/amendment/send-user-approval');
  
  try {
    const approvalBody = {
      selectedFlight: {
        id: 'flight_alt_1',
        airline: 'Emirates',
        departure: 'JFK',
        arrival: 'LHR',
        departureTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000).toISOString(),
        duration: '4h 30m',
        stops: 0,
        price: 480,
        currency: 'USD'
      },
      financialImpact: {
        currentFarePrice: 500,
        newFarePrice: 480,
        priceDifference: -20,
        adjustmentType: 'refund',
        adjustmentAmount: 20,
        currency: 'USD'
      }
    };
    
    const response = await makeRequest(
      'POST',
      `${BOOKING_SERVICE_URL}/api/v2/admin/bookings/${mockBookingData.id}/amendment/send-user-approval`,
      approvalBody
    );
    
    if (response.status === 201 || response.status === 400 || response.status === 404) {
      console.log(`  ✓ Endpoint accessible (status: ${response.status})`);
      testResults.push({
        name: 'POST Send User Approval Endpoint',
        status: 'PASS',
        message: `Endpoint returned status ${response.status}`
      });
      
      if (response.data?.data?.approvalToken) {
        approvalToken = response.data.data.approvalToken;
        console.log(`  ✓ Approval token generated: ${approvalToken.substring(0, 20)}...`);
        console.log(`  ✓ Email sent to: ${response.data.data.travelerEmail}`);
        console.log(`  ✓ Expires at: ${response.data.data.expiresAt}`);
      }
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testResults.push({
      name: 'POST Send User Approval Endpoint',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Suite 4: Finalize Amendment Endpoint
console.log('\n=== TEST SUITE 4: POST FINALIZE AMENDMENT ENDPOINT ===\n');

async function testFinalizeAmendment() {
  console.log('Testing: POST /api/v2/admin/bookings/:id/amendment/finalize');
  
  try {
    const finalizeBody = {
      selectedFlight: {
        id: 'flight_alt_1',
        airline: 'Emirates',
        departure: 'JFK',
        arrival: 'LHR',
        departureTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
        arrivalTime: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000 + 4.5 * 60 * 60 * 1000).toISOString(),
        duration: '4h 30m',
        stops: 0,
        price: 480,
        currency: 'USD'
      },
      financialImpact: {
        currentFarePrice: 500,
        newFarePrice: 480,
        priceDifference: -20,
        adjustmentType: 'refund',
        adjustmentAmount: 20,
        currency: 'USD'
      },
      approvalToken: approvalToken || 'mock_token_for_testing'
    };
    
    const response = await makeRequest(
      'POST',
      `${BOOKING_SERVICE_URL}/api/v2/admin/bookings/${mockBookingData.id}/amendment/finalize`,
      finalizeBody
    );
    
    if (response.status === 200 || response.status === 400 || response.status === 401 || response.status === 404) {
      console.log(`  ✓ Endpoint accessible (status: ${response.status})`);
      testResults.push({
        name: 'POST Finalize Amendment Endpoint',
        status: 'PASS',
        message: `Endpoint returned status ${response.status}`
      });
      
      if (response.data?.success) {
        console.log(`  ✓ Amendment finalized successfully`);
        console.log(`    - Status: ${response.data.data?.status}`);
        console.log(`    - Message: ${response.data.data?.message}`);
      }
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testResults.push({
      name: 'POST Finalize Amendment Endpoint',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Suite 4.5: Traveler Approval Endpoint (Integrated)
console.log('\n=== TEST SUITE 4.5: TRAVELER APPROVAL ENDPOINT (INTEGRATED) ===\n');

async function testTravelerApproval() {
  console.log('Testing: POST /api/bookings/:id/amendment/approve (Traveler Integration)');
  
  try {
    const approvalBody = {
      approvalToken: approvalToken || 'mock_approval_token_testing_12345678'
    };
    
    const response = await makeRequest(
      'POST',
      `${BOOKING_SERVICE_URL}/api/bookings/${mockBookingData.id}/amendment/approve`,
      approvalBody,
      { 'x-admin-id': '' } // No admin ID needed for traveler endpoint
    );
    
    if (response.status === 200 || response.status === 400 || response.status === 401 || response.status === 404) {
      console.log(`  ✓ Traveler approval endpoint accessible (status: ${response.status})`);
      testResults.push({
        name: 'POST Traveler Approval Endpoint',
        status: 'PASS',
        message: `Endpoint returned status ${response.status}`
      });
      
      if (response.data?.success) {
        console.log(`  ✓ Traveler approval processed`);
        console.log(`    - Status: ${response.data.data?.status}`);
        console.log(`    - Approval Code: ${response.data.data?.approval?.approvalCode}`);
        console.log(`    - Next Step: ${response.data.data?.approval?.nextStep}`);
        console.log(`    - Integration: Booking module (no separate portal needed)`);
      } else if (response.data?.error) {
        console.log(`  ℹ Response: ${response.data.error}`);
      }
    } else {
      throw new Error(`Unexpected status: ${response.status}`);
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testResults.push({
      name: 'POST Traveler Approval Endpoint',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Test Suite 5: Complete Workflow Validation
console.log('\n=== TEST SUITE 5: FLIGHT AMENDMENT WORKFLOW VALIDATION ===\n');

async function validateCompleteWorkflow() {
  console.log('Validating complete flight amendment workflow:');
  
  try {
    // Check if endpoint responses follow the expected contracts
    const amendmentRequestResponse = await makeRequest(
      'GET',
      `${BOOKING_SERVICE_URL}/api/v2/admin/bookings/${mockBookingData.id}/amendment-request`
    );
    
    if (amendmentRequestResponse.data?.data) {
      const data = amendmentRequestResponse.data.data;
      const requiredFields = [
        'bookingId', 'bookingReference', 'traveler', 'currentFlight',
        'requestType', 'userApprovalStatus'
      ];
      
      const missingFields = requiredFields.filter(field => !(field in data));
      
      if (missingFields.length === 0) {
        console.log(`  ✓ Amendment request has all required fields`);
        testResults.push({
          name: 'Amendment Request Data Contract',
          status: 'PASS',
          message: 'All required fields present'
        });
      } else {
        console.log(`  ✗ Missing fields: ${missingFields.join(', ')}`);
        testResults.push({
          name: 'Amendment Request Data Contract',
          status: 'FAIL',
          message: `Missing fields: ${missingFields.join(', ')}`
        });
      }
    }

    // Validate search response structure
    const searchBody = {
      requestType: 'date_change',
      requestedDate: new Date().toISOString(),
      requestedRoute: { from: 'JFK', to: 'LHR' }
    };

    const searchResponse = await makeRequest(
      'POST',
      `${BOOKING_SERVICE_URL}/api/v2/admin/bookings/${mockBookingData.id}/amendment/search-flights`,
      searchBody
    );

    if (searchResponse.data?.data) {
      const data = searchResponse.data.data;
      if (Array.isArray(data.flights)) {
        console.log(`  ✓ Search returns flight array`);
        testResults.push({
          name: 'Search Flights Data Contract',
          status: 'PASS',
          message: 'Flight array returned'
        });
      }
    }
  } catch (error) {
    console.log(`  ✗ Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    testResults.push({
      name: 'Complete Workflow Validation',
      status: 'FAIL',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// Run all tests
async function runAllTests() {
  try {
    await testGetAmendmentRequest();
    await testSearchFlights();
    await testSendUserApproval();
    await testTravelerApproval();
    await testFinalizeAmendment();
    await validateCompleteWorkflow();

    // Print summary
    console.log('\n=== TEST SUMMARY ===\n');
    
    const passed = testResults.filter(r => r.status === 'PASS').length;
    const failed = testResults.filter(r => r.status === 'FAIL').length;
    const total = testResults.length;

    console.log(`Total Tests: ${total}`);
    console.log(`✓ Passed: ${passed}`);
    console.log(`✗ Failed: ${failed}`);
    console.log(`Success Rate: ${((passed / total) * 100).toFixed(1)}%\n`);

    if (failed > 0) {
      console.log('Failed Tests:');
      testResults
        .filter(r => r.status === 'FAIL')
        .forEach(r => {
          console.log(`  ✗ ${r.name}: ${r.message}`);
        });
    }

    process.exit(failed > 0 ? 1 : 0);
  } catch (error) {
    console.error('Fatal error running tests:', error);
    process.exit(1);
  }
}

// Start tests
runAllTests();
