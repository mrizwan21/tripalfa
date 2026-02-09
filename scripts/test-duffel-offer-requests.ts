#!/usr/bin/env ts-node
/**
 * Test Duffel Offer-Requests Endpoint
 * 
 * This script tests the Duffel offer-requests endpoint comprehensively
 * including flight search, offer retrieval, and integration validation.
 * 
 * Documentation: https://duffel.com/docs/api/v2/offer-requests
 */

import axios, { AxiosError } from 'axios';

// Type definitions
interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  error?: string;
  data?: unknown;
}

interface SearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  cabinClass: string;
  passengers: Array<{ type: string }>;
}

interface DuffelOfferRequest {
  data: {
    slices: Array<{
      origin: string;
      destination: string;
      departure_date: string;
    }>;
    passengers: Array<{ type: string }>;
    cabin_class: string;
  };
}

interface DuffelOffer {
  id: string;
  owner: { name: string; iata_code: string };
  total_amount: string;
  total_currency: string;
  slices: Array<{
    duration: string;
    segments: Array<{
      origin: { iata_code: string };
      destination: { iata_code: string };
      departing_at: string;
      arriving_at: string;
      marketing_carrier_flight_number: string;
    }>;
  }>;
}

interface DuffelResponse {
  data: {
    id: string;
    offers?: DuffelOffer[];
    slices?: Array<{ origin: string; destination: string }>;
  };
}

// Configuration
const API_KEY = process.env.DUFFEL_TEST_API_KEY || 'duffel_pk_test_demo';
const BASE_URL = 'https://api.duffel.com/air';
const DUFFEL_VERSION = 'v2';
const TIMEOUT = 30000;

const results: TestResult[] = [];

// Test data
const testData = {
  validSearch: {
    origin: 'LHR',
    destination: 'JFK',
    departureDate: '2026-03-15',
    cabinClass: 'economy',
    passengers: [{ type: 'adult' }],
  },
  roundTrip: {
    origin: 'AMS',
    destination: 'CDG',
    departureDate: '2026-04-01',
    returnDate: '2026-04-15',
    cabinClass: 'economy',
    passengers: [{ type: 'adult' }, { type: 'child' }],
  },
  businessClass: {
    origin: 'SFO',
    destination: 'LHR',
    departureDate: '2026-05-10',
    cabinClass: 'business',
    passengers: [{ type: 'adult' }],
  },
  multiPassengers: {
    origin: 'JFK',
    destination: 'LAX',
    departureDate: '2026-03-20',
    cabinClass: 'premium_economy',
    passengers: [
      { type: 'adult' },
      { type: 'adult' },
      { type: 'child' },
      { type: 'infant_without_seat' },
    ],
  },
};

// Utility functions
function createOfferRequest(params: SearchParams): DuffelOfferRequest {
  return {
    data: {
      slices: [
        {
          origin: params.origin,
          destination: params.destination,
          departure_date: params.departureDate,
        },
      ],
      passengers: params.passengers,
      cabin_class: params.cabinClass,
    },
  };
}

function formatDuration(isoDuration: string): string {
  const hours = isoDuration.match(/(\d+)H/)?.[1] || '0';
  const minutes = isoDuration.match(/(\d+)M/)?.[1] || '0';
  return `${hours}h ${minutes}m`;
}

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
        ? `${error.response?.status} ${error.message}`
        : error instanceof Error
          ? error.message
          : String(error);
    results.push({ name, status: 'FAIL', duration, error: errorMsg });
    console.log(`❌ FAIL: ${name}`);
    console.log(`   Error: ${errorMsg}`);
  }
}

// Test functions
async function testOfferRequestBasic(): Promise<void> {
  const request = createOfferRequest(testData.validSearch);

  try {
    const response = await axios.post<DuffelResponse>(
      `${BASE_URL}/offer_requests`,
      request,
      {
        headers: {
          'Authorization': `Bearer ${API_KEY}`,
          'Duffel-Version': DUFFEL_VERSION,
          'Content-Type': 'application/json',
        },
        timeout: TIMEOUT,
      }
    );

    const { data } = response;
    if (!data?.id) throw new Error('Missing request ID in response');
    if (!data?.offers) throw new Error('Missing offers in response');

    console.log(`   📊 Found ${data.offers.length} offers`);
    console.log(`   🆔 Request ID: ${data.id}`);
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      console.error(`   Status: ${error.response?.status}`);
      console.error(`   Response:`, JSON.stringify(error.response?.data, null, 2));
    }
    throw error;
  }
}

async function testOfferRequestRoundTrip(): Promise<void> {
  const request = {
    data: {
      slices: [
        {
          origin: testData.roundTrip.origin,
          destination: testData.roundTrip.destination,
          departure_date: testData.roundTrip.departureDate,
        },
        {
          origin: testData.roundTrip.destination,
          destination: testData.roundTrip.origin,
          departure_date: testData.roundTrip.returnDate,
        },
      ],
      passengers: testData.roundTrip.passengers,
      cabin_class: testData.roundTrip.cabinClass,
    },
  };

  const response = await axios.post<DuffelResponse>(
    `${BASE_URL}/offer_requests`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    }
  );

  const { data } = response;
  if (!data?.id) throw new Error('Missing request ID');
  if (!data?.offers || data.offers.length === 0)
    throw new Error('No offers returned for round trip');

  // Verify round trip structure
  const firstOffer = (data.offers as DuffelOffer[])[0];
  if (!firstOffer.slices || firstOffer.slices.length < 2) {
    throw new Error('Round trip offers should have at least 2 slices');
  }

  console.log(`   📊 Found ${data.offers.length} round-trip offers`);
  console.log(
    `   ✈️  Slices per offer: ${firstOffer.slices.length}`
  );
}

async function testOfferRequestBusinessClass(): Promise<void> {
  const request = createOfferRequest(testData.businessClass);

  const response = await axios.post<DuffelResponse>(
    `${BASE_URL}/offer_requests`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    }
  );

  const { data } = response;
  if (!data?.id) throw new Error('Missing request ID');
  if (!data?.offers) throw new Error('No offers returned');

  const offers = (data.offers as DuffelOffer[]);
  console.log(`   📊 Found ${offers.length} business class offers`);

  // Verify pricing for business class
  if (offers.length > 0) {
    const firstOffer = offers[0];
    const price = parseFloat(firstOffer.total_amount);
    console.log(`   💰 Sample price: ${firstOffer.total_currency} ${price.toFixed(2)}`);
  }
}

async function testOfferRequestMultiPassengers(): Promise<void> {
  const request = createOfferRequest(testData.multiPassengers);

  const response = await axios.post<DuffelResponse>(
    `${BASE_URL}/offer_requests`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    }
  );

  const { data } = response;
  if (!data?.id) throw new Error('Missing request ID');
  if (!data?.offers) throw new Error('No offers returned');

  const offers = (data.offers as DuffelOffer[]);
  console.log(
    `   📊 Found ${offers.length} offers for ${testData.multiPassengers.passengers.length} passengers`
  );
  console.log(
    `   👥 Passenger mix: ${testData.multiPassengers.passengers.map((p) => p.type).join(', ')}`
  );
}

async function testOfferResponseStructure(): Promise<void> {
  const request = createOfferRequest(testData.validSearch);

  const response = await axios.post<DuffelResponse>(
    `${BASE_URL}/offer_requests`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    }
  );

  const { data } = response;
  if (!data?.offers || (data.offers as DuffelOffer[]).length === 0) {
    throw new Error('No offers to validate structure');
  }

  const offer = (data.offers as DuffelOffer[])[0];
  const requiredFields = [
    'id',
    'owner',
    'total_amount',
    'total_currency',
    'slices',
  ];

  for (const field of requiredFields) {
    if (!(field in offer)) {
      throw new Error(`Missing required field: ${field}`);
    }
  }

  const slice = offer.slices[0];
  const requiredSliceFields = ['origin', 'destination', 'duration', 'segments'];
  for (const field of requiredSliceFields) {
    if (!(field in slice)) {
      throw new Error(`Missing required slice field: ${field}`);
    }
  }

  const segment = slice.segments[0];
  const requiredSegmentFields = [
    'origin',
    'destination',
    'departing_at',
    'arriving_at',
  ];
  for (const field of requiredSegmentFields) {
    if (!(field in segment)) {
      throw new Error(`Missing required segment field: ${field}`);
    }
  }

  console.log(`   ✅ Offer structure valid`);
  console.log(`   📦 Fields: ${requiredFields.join(', ')}`);
  console.log(`   ✈️  Segments per slice: ${slice.segments.length}`);
}

async function testOfferPricing(): Promise<void> {
  const request = createOfferRequest(testData.validSearch);

  const response = await axios.post<DuffelResponse>(
    `${BASE_URL}/offer_requests`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    }
  );

  const { data } = response;
  if (!data?.offers || (data.offers as DuffelOffer[]).length === 0) {
    throw new Error('No offers to validate pricing');
  }

  const offers = (data.offers as DuffelOffer[]);
  let totalPrice = 0;
  let currency = '';

  for (const offer of offers) {
    const price = parseFloat(offer.total_amount);
    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid price in offer: ${offer.total_amount}`);
    }
    totalPrice += price;
    currency = offer.total_currency;
  }

  const avgPrice = (totalPrice / offers.length).toFixed(2);
  console.log(`   💰 Total offers: ${offers.length}`);
  console.log(`   💵 Average price: ${currency} ${avgPrice}`);
  console.log(
    `   🔄 Price range: ${currency} ${Math.min(...offers.map((o) => parseFloat(o.total_amount))).toFixed(2)} - ${Math.max(...offers.map((o) => parseFloat(o.total_amount))).toFixed(2)}`
  );
}

async function testOfferFlightDetails(): Promise<void> {
  const request = createOfferRequest(testData.validSearch);

  const response = await axios.post<DuffelResponse>(
    `${BASE_URL}/offer_requests`,
    request,
    {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    }
  );

  const { data } = response;
  if (!data?.offers || (data.offers as DuffelOffer[]).length === 0) {
    throw new Error('No offers to validate flight details');
  }

  const offer = (data.offers as DuffelOffer[])[0];
  const slice = offer.slices[0];
  const segment = slice.segments[0];

  const departure = new Date(segment.departing_at);
  const arrival = new Date(segment.arriving_at);
  const duration = formatDuration(slice.duration);

  console.log(`   ✈️  Airline: ${offer.owner.name} (${offer.owner.iata_code})`);
  console.log(
    `   🛫 Route: ${segment.origin.iata_code} → ${segment.destination.iata_code}`
  );
  console.log(`   ⏰ Departure: ${departure.toLocaleString()}`);
  console.log(`   ⏱️  Duration: ${duration}`);
  console.log(`   🛬 Stops: ${slice.segments.length - 1}`);
}

async function testInvalidOfferRequest(): Promise<void> {
  const invalidRequest = {
    data: {
      slices: [],
      passengers: [],
      cabin_class: 'invalid_class',
    },
  };

  try {
    await axios.post(`${BASE_URL}/offer_requests`, invalidRequest, {
      headers: {
        'Authorization': `Bearer ${API_KEY}`,
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    });
    throw new Error('Expected error but request succeeded');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (!error.response?.status || error.response.status > 400) {
        console.log(`   ⚠️  Expected error: ${error.response?.status}`);
        return;
      }
    }
    throw error;
  }
}

async function testMissingAuthentication(): Promise<void> {
  const request = createOfferRequest(testData.validSearch);

  try {
    await axios.post(`${BASE_URL}/offer_requests`, request, {
      headers: {
        'Duffel-Version': DUFFEL_VERSION,
        'Content-Type': 'application/json',
      },
      timeout: TIMEOUT,
    });
    throw new Error('Expected 401 error but request succeeded');
  } catch (error: unknown) {
    if (error instanceof AxiosError) {
      if (error.response?.status === 401) {
        console.log(`   ✅ Correctly rejected: 401 Unauthorized`);
        return;
      }
    }
    throw error;
  }
}

// Summary formatter
function printSummary(): void {
  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
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
  }

  console.log('\n' + '='.repeat(60));
  process.exit(failed > 0 ? 1 : 0);
}

// Main execution
async function main(): Promise<void> {
  console.log('🧪 Duffel Offer-Requests Endpoint Test Suite');
  console.log('='.repeat(60));
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`API Version: ${DUFFEL_VERSION}`);
  console.log(`Timeout: ${TIMEOUT}ms`);
  console.log('='.repeat(60));

  // Run all tests
  await runTest(
    'T-001: Basic Offer Request (One-way)',
    testOfferRequestBasic
  );
  await runTest(
    'T-002: Round-trip Offer Request',
    testOfferRequestRoundTrip
  );
  await runTest(
    'T-003: Business Class Search',
    testOfferRequestBusinessClass
  );
  await runTest(
    'T-004: Multiple Passengers (Mixed)',
    testOfferRequestMultiPassengers
  );
  await runTest(
    'T-005: Response Structure Validation',
    testOfferResponseStructure
  );
  await runTest('T-006: Pricing Validation', testOfferPricing);
  await runTest('T-007: Flight Details Extraction', testOfferFlightDetails);
  await runTest('T-008: Invalid Request Handling', testInvalidOfferRequest);
  await runTest(
    'T-009: Missing Authentication',
    testMissingAuthentication
  );

  printSummary();
}

main().catch(console.error);
