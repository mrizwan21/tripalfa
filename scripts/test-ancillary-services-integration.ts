#!/usr/bin/env ts-node
/**
 * Integration Test Script: Ancillary Services API
 * Tests all ancillary service endpoints (seats, baggage, insurance, lounge)
 * Run: npx ts-node scripts/test-ancillary-services-integration.ts
 */

import axios, { AxiosError } from 'axios';

// Configuration
const API_GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3000';
const PROVIDER = process.env.PROVIDER || 'duffel';
const ENV = process.env.TEST_ENV || 'test';

// Test data
const TEST_ORDER_ID = 'ord_test_' + Date.now();
const TEST_PASSENGER_ID = 'pax_test_001';
const TEST_SERVICE_ID = 'service_seat_12A';

// Colors for output
const colors = {
    reset: '\x1b[0m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

interface TestResult {
    name: string;
    passed: boolean;
    error?: string;
    duration: number;
}

const results: TestResult[] = [];

async function runTest(
    name: string,
    fn: () => Promise<void>
): Promise<void> {
    const startTime = Date.now();
    try {
        await fn();
        const duration = Date.now() - startTime;
        results.push({ name, passed: true, duration });
        console.log(
            `${colors.green}✅${colors.reset} ${name} (${duration}ms)`
        );
    } catch (error: any) {
        const duration = Date.now() - startTime;
        const errorMessage = error.response?.data?.error || error.message;
        results.push({ name, passed: false, error: errorMessage, duration });
        console.log(
            `${colors.red}❌${colors.reset} ${name} (${duration}ms)\n   Error: ${errorMessage}`
        );
    }
}

async function testGetAncillaryOffers(): Promise<void> {
    const response = await axios.get(`${API_GATEWAY_URL}/bookings/flight/ancillary-offers`, {
        params: {
            orderId: TEST_ORDER_ID,
            type: 'seat',
            provider: PROVIDER,
            env: ENV
        }
    });

    if (!response.data.success) {
        throw new Error('Response success flag is false');
    }
    if (!response.data.data || !Array.isArray(response.data.data)) {
        throw new Error('Response data is not an array');
    }
    if (response.data.provider !== PROVIDER) {
        throw new Error(`Provider mismatch: expected ${PROVIDER}, got ${response.data.provider}`);
    }
}

async function testGetAncillaryOffersByType(): Promise<void> {
    const types = ['seat', 'baggage', 'insurance', 'lounge'];

    for (const type of types) {
        const response = await axios.get(
            `${API_GATEWAY_URL}/bookings/flight/ancillary-offers`,
            {
                params: {
                    orderId: TEST_ORDER_ID,
                    type,
                    provider: PROVIDER,
                    env: ENV
                }
            }
        );

        if (!response.data.success) {
            throw new Error(`Failed to get ${type} offers`);
        }
    }
}

async function testSelectAncillaryService(): Promise<void> {
    const response = await axios.post(
        `${API_GATEWAY_URL}/bookings/flight/ancillary-select`,
        {
            orderId: TEST_ORDER_ID,
            serviceId: TEST_SERVICE_ID,
            passengerId: TEST_PASSENGER_ID,
            provider: PROVIDER,
            env: ENV
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to select ancillary service');
    }
    if (response.data.data?.status !== 'selected') {
        throw new Error('Service not marked as selected');
    }
}

async function testRemoveAncillaryService(): Promise<void> {
    const response = await axios.delete(
        `${API_GATEWAY_URL}/bookings/flight/ancillary/${TEST_SERVICE_ID}`,
        {
            params: {
                orderId: TEST_ORDER_ID,
                provider: PROVIDER,
                env: ENV
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to remove ancillary service');
    }
}

async function testGetBaggageDetails(): Promise<void> {
    const response = await axios.get(
        `${API_GATEWAY_URL}/bookings/flight/baggage/${TEST_ORDER_ID}`,
        {
            params: {
                provider: PROVIDER,
                env: ENV
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to get baggage details');
    }
    if (!response.data.data.included || !Array.isArray(response.data.data.included)) {
        throw new Error('Baggage data structure invalid');
    }
}

async function testAddBaggage(): Promise<void> {
    const response = await axios.post(
        `${API_GATEWAY_URL}/bookings/flight/baggage/${TEST_ORDER_ID}/add`,
        {
            quantity: 1,
            baggageType: 'checked',
            passengerId: TEST_PASSENGER_ID,
            provider: PROVIDER,
            env: ENV
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to add baggage');
    }
}

async function testRemoveBaggage(): Promise<void> {
    const baggageId = 'baggage_test_' + Date.now();
    const response = await axios.delete(
        `${API_GATEWAY_URL}/bookings/flight/baggage/${TEST_ORDER_ID}/${baggageId}`,
        {
            params: {
                provider: PROVIDER,
                env: ENV
            }
        }
    );

    // This might fail if baggage doesn't exist, which is ok for this test
    if (response.status === 200 || response.status === 404) {
        return;
    }
    throw new Error(`Unexpected status code: ${response.status}`);
}

async function testGetBaggageSummary(): Promise<void> {
    const response = await axios.get(
        `${API_GATEWAY_URL}/bookings/flight/baggage-summary/${TEST_ORDER_ID}`,
        {
            params: {
                provider: PROVIDER,
                env: ENV
            }
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to get baggage summary');
    }
}

async function testGetTravelPreferences(): Promise<void> {
    const response = await axios.get(
        `${API_GATEWAY_URL}/user/preferences/travel`
    );

    // This could fail if user not authenticated, but endpoint should still work
    if (response.status === 200) {
        if (!response.data.seatPreference) {
            throw new Error('Missing seatPreference in response');
        }
    }
}

async function testSaveTravelPreferences(): Promise<void> {
    const response = await axios.post(
        `${API_GATEWAY_URL}/user/preferences/travel`,
        {
            seatPreference: 'window',
            bagAllowance: 'extra',
            insuranceEnabled: true,
            loungePreference: 'business',
            notifications: true
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to save travel preferences');
    }
}

async function testGetAncillaryDefaults(): Promise<void> {
    const response = await axios.get(
        `${API_GATEWAY_URL}/user/preferences/ancillary-defaults`
    );

    if (response.status === 200) {
        if (!response.data.baggageType) {
            throw new Error('Missing baggageType in response');
        }
    }
}

async function testSaveAncillaryDefaults(): Promise<void> {
    const response = await axios.post(
        `${API_GATEWAY_URL}/user/preferences/ancillary-defaults`,
        {
            baggageType: 'extra',
            bagQuantity: 2,
            insuranceType: 'premium',
            loungeAccess: true
        }
    );

    if (!response.data.success) {
        throw new Error('Failed to save ancillary defaults');
    }
}

async function testErrorHandling(): Promise<void> {
    try {
        await axios.get(`${API_GATEWAY_URL}/bookings/flight/ancillary-offers`, {
            params: {
                // Missing orderId - should fail
                provider: PROVIDER,
                env: ENV
            }
        });
        throw new Error('Should have failed with missing orderId');
    } catch (error: any) {
        if (error.response?.status !== 400) {
            throw new Error(`Expected 400 error, got ${error.response?.status}`);
        }
    }
}

async function testInvalidProvider(): Promise<void> {
    try {
        await axios.get(`${API_GATEWAY_URL}/bookings/flight/ancillary-offers`, {
            params: {
                orderId: TEST_ORDER_ID,
                provider: 'invalid_provider_xyz',
                env: ENV
            }
        });
        throw new Error('Should have failed with invalid provider');
    } catch (error: any) {
        if (error.response?.status !== 400) {
            throw new Error(`Expected 400 error, got ${error.response?.status}`);
        }
    }
}

async function testGatewayHealth(): Promise<void> {
    try {
        const response = await axios.get(`${API_GATEWAY_URL}/health`, {
            timeout: 5000
        });
        if (response.status !== 200) {
            throw new Error('Gateway health check failed');
        }
    } catch (error) {
        // Gateway might not have a /health endpoint, that's ok
        // Try a simple endpoint instead
        try {
            await axios.get(`${API_GATEWAY_URL}/bookings/flight/ancillary-offers?orderId=test&provider=duffel&env=test`, {
                timeout: 5000
            });
        } catch (retryError) {
            throw new Error('Unable to reach API Gateway');
        }
    }
}

async function runAllTests(): Promise<void> {
    console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}  Ancillary Services Integration Tests${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

    console.log(`${colors.cyan}Configuration:${colors.reset}`);
    console.log(`  API Gateway: ${API_GATEWAY_URL}`);
    console.log(`  Provider: ${PROVIDER}`);
    console.log(`  Environment: ${ENV}\n`);

    console.log(`${colors.cyan}Running Tests:${colors.reset}\n`);

    // Test connectivity first
    await runTest('Gateway Health Check', testGatewayHealth);

    // Ancillary Services Tests
    await runTest('Get Ancillary Offers', testGetAncillaryOffers);
    await runTest('Get Ancillary Offers by Type', testGetAncillaryOffersByType);
    await runTest('Select Ancillary Service', testSelectAncillaryService);
    await runTest('Remove Ancillary Service', testRemoveAncillaryService);

    // Baggage Tests
    await runTest('Get Baggage Details', testGetBaggageDetails);
    await runTest('Add Baggage', testAddBaggage);
    await runTest('Remove Baggage', testRemoveBaggage);
    await runTest('Get Baggage Summary', testGetBaggageSummary);

    // User Preferences Tests
    await runTest('Get Travel Preferences', testGetTravelPreferences);
    await runTest('Save Travel Preferences', testSaveTravelPreferences);
    await runTest('Get Ancillary Defaults', testGetAncillaryDefaults);
    await runTest('Save Ancillary Defaults', testSaveAncillaryDefaults);

    // Error Handling Tests
    await runTest('Error Handling - Missing Parameters', testErrorHandling);
    await runTest('Error Handling - Invalid Provider', testInvalidProvider);

    // Summary
    console.log(`\n${colors.blue}═══════════════════════════════════════${colors.reset}`);
    console.log(`${colors.blue}  Test Summary${colors.reset}`);
    console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

    const passed = results.filter(r => r.passed).length;
    const failed = results.filter(r => !r.passed).length;
    const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

    console.log(`${colors.cyan}Results:${colors.reset}`);
    console.log(`  Total Tests: ${results.length}`);
    console.log(`  ${colors.green}Passed: ${passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${failed}${colors.reset}`);
    console.log(`  Total Duration: ${totalDuration}ms\n`);

    if (failed > 0) {
        console.log(`${colors.red}Failed Tests:${colors.reset}`);
        results
            .filter(r => !r.passed)
            .forEach(r => {
                console.log(`  - ${r.name}: ${r.error}`);
            });
        console.log('');
    }

    console.log(`${colors.blue}═══════════════════════════════════════${colors.reset}\n`);

    process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runAllTests().catch(err => {
    console.error(`${colors.red}Test suite failed:${colors.reset}`, err);
    process.exit(1);
});
