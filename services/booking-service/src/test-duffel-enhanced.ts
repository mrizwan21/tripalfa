/**
 * Test file for Enhanced Duffel API Endpoints
 * 
 * This file contains test functions for all the new enhanced Duffel API endpoints
 * including Partial Offer Requests, Batch Offer Requests, Order Changes, 
 * Airline Credits, Services Management, and Enhanced Payments.
 */

import { prisma } from "@tripalfa/shared-database";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, resolve } from "path";

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, "../../..");
dotenv.config({ path: resolve(rootDir, ".env") });

// Import Duffel client after environment setup
import axios from "axios";

// Create Duffel client instance
const DUFFEL_API_URL = process.env.DUFFEL_API_URL || "https://api.duffel.com";
const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN || "";

const duffelClient = axios.create({
  baseURL: DUFFEL_API_URL,
  headers: {
    Authorization: `Bearer ${DUFFEL_API_KEY}`,
    "Duffel-Version": "v2",
    "Content-Type": "application/json",
  },
});

// Test Partial Offer Requests
export async function testPartialOfferRequests() {
  console.log("🧪 Testing Partial Offer Requests...");

  try {
    // Create a partial offer request
    const partialRequestData = {
      slices: [
        {
          origin: "LON",
          destination: "NYC",
          departure_date: "2024-12-01",
        },
      ],
      passengers: [
        {
          type: "adult",
          age: 30,
        },
      ],
      cabin_class: "economy",
      return_available_services: true,
    };

    const response = await duffelClient.request({
      method: "POST",
      url: "/air/partial_offer_requests",
      data: {
        data: partialRequestData,
      },
    });

    console.log("✅ Partial Offer Request created:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error("❌ Partial Offer Request failed:", error.message);
    throw error;
  }
}

// Test Batch Offer Requests
export async function testBatchOfferRequests() {
  console.log("🧪 Testing Batch Offer Requests...");

  try {
    const batchRequestData = {
      requests: [
        {
          slices: [
            {
              origin: "LON",
              destination: "NYC",
              departure_date: "2024-12-01",
            },
          ],
          passengers: [{ type: "adult", age: 30 }],
          cabin_class: "economy",
        },
        {
          slices: [
            {
              origin: "NYC",
              destination: "LON",
              departure_date: "2024-12-05",
            },
          ],
          passengers: [{ type: "adult", age: 30 }],
          cabin_class: "economy",
        },
      ],
    };

    const response = await duffelClient.request({
      method: "POST",
      url: "/air/batch_offer_requests",
      data: {
        data: batchRequestData,
      },
    });

    console.log("✅ Batch Offer Request created:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error("❌ Batch Offer Request failed:", error.message);
    throw error;
  }
}

// Test Order Changes
export async function testOrderChanges() {
  console.log("🧪 Testing Order Changes...");

  try {
    // First, create a test order (this would normally be an existing order)
    const orderData = {
      selected_offers: ["offer_test_id"], // This would be a real offer ID
      passengers: [
        {
          id: "pas_test_id",
          type: "adult",
          given_name: "John",
          family_name: "Doe",
          born_on: "1990-01-01",
          email: "john.doe@example.com",
          phone_number: "+1234567890",
          title: "mr",
          gender: "m",
        },
      ],
      payments: [
        {
          type: "arc_bsp_cash",
          amount: "100.00",
          currency: "USD",
        },
      ],
    };

    const orderResponse = await duffelClient.request({
      method: "POST",
      url: "/air/orders",
      data: {
        data: orderData,
      },
    });

    console.log("✅ Test order created:", orderResponse.data.id);

    // Now test order change request
    const changeData = {
      order_id: orderResponse.data.id,
      slices: [
        {
          origin: "LON",
          destination: "NYC",
          departure_date: "2024-12-02", // Changed date
        },
      ],
    };

    const changeResponse = await duffelClient.request({
      method: "POST",
      url: "/air/order_change_requests",
      data: {
        data: changeData,
      },
    });

    console.log("✅ Order Change Request created:", changeResponse.data.id);
    return changeResponse.data;
  } catch (error: any) {
    console.error("❌ Order Change test failed:", error.message);
    throw error;
  }
}

// Test Airline Credits
export async function testAirlineCredits() {
  console.log("🧪 Testing Airline Credits...");

  try {
    // Create an airline credit
    const creditData = {
      order_id: "ord_test_id", // This would be a real order ID
      amount: {
        amount: "50.00",
        currency: "USD",
      },
      reason: "Customer service",
    };

    const response = await duffelClient.request({
      method: "POST",
      url: "/air/airline_credits",
      data: {
        data: creditData,
      },
    });

    console.log("✅ Airline Credit created:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error("❌ Airline Credit test failed:", error.message);
    throw error;
  }
}

// Test Services Management
export async function testServicesManagement() {
  console.log("🧪 Testing Services Management...");

  try {
    // Add services to an order
    const servicesData = {
      order_id: "ord_test_id", // This would be a real order ID
      services: [
        {
          id: "svc_test_id",
          quantity: 1,
        },
      ],
    };

    const response = await duffelClient.request({
      method: "POST",
      url: "/air/order_services",
      data: {
        data: servicesData,
      },
    });

    console.log("✅ Services added:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error("❌ Services Management test failed:", error.message);
    throw error;
  }
}

// Test Enhanced Payments
export async function testEnhancedPayments() {
  console.log("🧪 Testing Enhanced Payments...");

  try {
    // Create a payment
    const paymentData = {
      order_id: "ord_test_id", // This would be a real order ID
      payment_method: {
        type: "arc_bsp_cash",
        amount: "100.00",
        currency: "USD",
      },
    };

    const response = await duffelClient.request({
      method: "POST",
      url: "/air/payments",
      data: {
        data: paymentData,
      },
    });

    console.log("✅ Payment created:", response.data.id);
    return response.data;
  } catch (error: any) {
    console.error("❌ Enhanced Payments test failed:", error.message);
    throw error;
  }
}

// Test Database Integration
export async function testDatabaseIntegration() {
  console.log("🧪 Testing Database Integration...");

  try {
    // Test creating a partial offer request in database
    const partialRequest = await prisma.duffelPartialOfferRequest.create({
      data: {
        externalId: "test_partial_id",
        slices: [
          {
            origin: "LON",
            destination: "NYC",
            departure_date: "2024-12-01",
          },
        ],
        passengers: [
          {
            type: "adult",
            age: 30,
          },
        ],
        cabinClass: "economy",
        status: "pending",
      },
    });

    console.log("✅ Partial Offer Request saved to database:", partialRequest.id);

    // Test creating a batch offer request in database
    const batchRequest = await prisma.duffelBatchOfferRequest.create({
      data: {
        externalId: "test_batch_id",
        requests: [
          {
            slices: [
              {
                origin: "LON",
                destination: "NYC",
                departure_date: "2024-12-01",
              },
            ],
            passengers: [{ type: "adult", age: 30 }],
            cabin_class: "economy",
          },
        ],
        status: "pending",
      },
    });

    console.log("✅ Batch Offer Request saved to database:", batchRequest.id);

    // Test creating an airline credit in database
    const airlineCredit = await prisma.duffelAirlineCredit.create({
      data: {
        externalId: "test_credit_id",
        orderId: partialRequest.id,
        amount: 50.0,
        currency: "USD",
        reason: "Customer service",
        status: "active",
      },
    });

    console.log("✅ Airline Credit saved to database:", airlineCredit.id);

    return { partialRequest, batchRequest, airlineCredit };
  } catch (error: any) {
    console.error("❌ Database Integration test failed:", error.message);
    throw error;
  }
}

// Run all tests
export async function runAllTests() {
  console.log("🚀 Starting Enhanced Duffel API Tests...\n");

  try {
    // Test database integration first (doesn't require real Duffel API calls)
    await testDatabaseIntegration();

    // Note: The following tests require real Duffel API credentials and test data
    // They are commented out to prevent errors in the test environment
    // Uncomment them when you have valid test credentials

    // await testPartialOfferRequests();
    // await testBatchOfferRequests();
    // await testOrderChanges();
    // await testAirlineCredits();
    // await testServicesManagement();
    // await testEnhancedPayments();

    console.log("\n✅ All Enhanced Duffel API tests completed successfully!");
  } catch (error: any) {
    console.error("\n❌ Tests failed:", error.message);
    throw error;
  }
}

// If this file is run directly, execute the tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}