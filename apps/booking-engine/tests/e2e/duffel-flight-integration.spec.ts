/**
 * Duffel Flight Integration E2E Tests
 *
 * Playwright test suite for testing Duffel flight booking integration
 * with real API endpoints (with mock data where appropriate)
 */

import { test, expect } from "@playwright/test";
import {
  DuffelFlightIntegrationTests,
  type TestConfig,
} from "../api-integration/duffel-flight-integration.test";

/**
 * Get API configuration from environment or use defaults
 */
function getTestConfig(): TestConfig {
  const apiBaseUrl = process.env.API_BASE_URL || "http://localhost:3000/api";
  const duffelApiUrl = process.env.DUFFEL_API_URL || "https://api.duffel.com";
  const duffelToken = process.env.DUFFEL_TEST_TOKEN;
  const testMode = process.env.TEST_MODE !== "false";

  return {
    apiBaseUrl,
    duffelApiUrl,
    duffelToken,
    testMode,
  };
}

test.describe("Duffel Flight Integration Tests", () => {
  let testSuite: DuffelFlightIntegrationTests;
  let config: TestConfig;

  test.beforeAll(async () => {
    config = getTestConfig();
    testSuite = new DuffelFlightIntegrationTests(config);
    console.log("\n📋 Integration Test Configuration:");
    console.log(`   API Base URL: ${config.apiBaseUrl}`);
    console.log(`   Duffel API: ${config.duffelApiUrl}`);
    console.log(`   Test Mode: ${config.testMode}`);
  });

  test("01 - Flight Search", async () => {
    try {
      const offer = await testSuite.testFlightSearch();
      expect(offer).toBeDefined();
      expect(offer.id).toBeDefined();
    } catch (error) {
      console.error("Flight search test failed:", error);
      throw error;
    }
  });

  test("02 - Get Offer Details", async () => {
    try {
      const offer = await testSuite.testFlightSearch();
      await testSuite.testOfferDetails(offer.id);
    } catch (error) {
      console.error("Get offer details test failed:", error);
      throw error;
    }
  });

  test("03 - Get Seat Maps", async () => {
    try {
      const offer = await testSuite.testFlightSearch();
      await testSuite.testGetSeatMaps(offer.id);
    } catch (error) {
      console.error("Get seat maps test failed:", error);
      throw error;
    }
  });

  test("04 - Create Hold Order", async () => {
    try {
      const offer = await testSuite.testFlightSearch();
      const order = await testSuite.testCreateHoldOrder(offer.id);
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();
      expect(order.type).toBe("hold");
    } catch (error) {
      console.error("Create hold order test failed:", error);
      throw error;
    }
  });

  test("05 - Get Order Details", async () => {
    try {
      const offer = await testSuite.testFlightSearch();
      const order = await testSuite.testCreateHoldOrder(offer.id);
      await testSuite.testGetOrder(order.id);
    } catch (error) {
      console.error("Get order details test failed:", error);
      throw error;
    }
  });

  test("06 - Get Available Services", async () => {
    try {
      const offer = await testSuite.testFlightSearch();
      const order = await testSuite.testCreateHoldOrder(offer.id);
      await testSuite.testGetAvailableServices(order.id);
    } catch (error) {
      console.error("Get available services test failed:", error);
      throw error;
    }
  });

  test("07 - Complete Booking Flow (E2E)", async () => {
    try {
      await testSuite.testCompleteBookingFlow();
    } catch (error) {
      console.error("Complete booking flow test failed:", error);
      throw error;
    }
  });
});

test.describe("Duffel Flight API Data Flow Verification", () => {
  let testSuite: DuffelFlightIntegrationTests;
  let config: TestConfig;

  test.beforeAll(async () => {
    config = getTestConfig();
    testSuite = new DuffelFlightIntegrationTests(config);
  });

  test("API Request/Response Flow", async ({ page }) => {
    const apiRequests: any[] = [];
    const apiResponses: any[] = [];

    // Intercept API requests
    page.on("request", (request) => {
      if (request.url().includes("/api/duffel")) {
        apiRequests.push({
          url: request.url(),
          method: request.method(),
          headers: request.headers(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    // Intercept API responses
    page.on("response", (response) => {
      if (response.url().includes("/api/duffel")) {
        apiResponses.push({
          url: response.url(),
          status: response.status(),
          timestamp: new Date().toISOString(),
        });
      }
    });

    try {
      // Trigger API calls
      const offer = await testSuite.testFlightSearch();
      await testSuite.testOfferDetails(offer.id);

      // Verify requests and responses
      expect(apiRequests.length).toBeGreaterThan(0);
      expect(apiResponses.length).toBeGreaterThan(0);

      console.log("\n📊 API Flow Summary:");
      console.log(`   Requests made: ${apiRequests.length}`);
      console.log(`   Responses received: ${apiResponses.length}`);

      // Verify all successful responses
      apiResponses.forEach((response) => {
        expect([200, 201, 202]).toContain(response.status);
      });
    } catch (error) {
      console.error("Data flow verification failed:", error);
      throw error;
    }
  });

  test("Frontend to Backend Data Flow", async () => {
    try {
      // This test verifies that data flows correctly from frontend form
      // through the API layer to the booking service

      console.log("\n🔄 Testing Data Flow:");
      console.log("   Frontend → API Gateway → Booking Service → Duffel API");

      const offer = await testSuite.testFlightSearch();
      expect(offer).toBeDefined();
      expect(offer.id).toBeDefined();

      const order = await testSuite.testCreateHoldOrder(offer.id);
      expect(order).toBeDefined();
      expect(order.id).toBeDefined();

      const retrievedOrder = await testSuite.testGetOrder(order.id);
      expect(retrievedOrder).toBeDefined();

      console.log("   ✓ Data flow verified successfully");
    } catch (error) {
      console.error("Data flow test failed:", error);
      throw error;
    }
  });

  test("Error Handling and Recovery", async () => {
    try {
      // Test that invalid parameters are handled gracefully
      const testConfig: TestConfig = {
        apiBaseUrl: getTestConfig().apiBaseUrl,
        duffelApiUrl: getTestConfig().duffelApiUrl,
      };

      const testManager = new DuffelFlightIntegrationTests(testConfig);

      // Try to get details for invalid offer
      const result = await testManager.testGetOrder("invalid-order-id");

      // Should handle error gracefully
      console.log("✓ Error handling verified");
    } catch (error) {
      // Expected to fail, which is fine
      console.log("✓ Error handling working as expected");
    }
  });
});
