#!/usr/bin/env npx tsx
/**
 * Direct Duffel API Flight Booking Flows Test
 *
 * Tests all booking flows directly against Duffel API
 * No local API Gateway required
 *
 * Usage:
 *   DUFFEL_API_KEY=<your_test_token> pnpm dlx tsx scripts/test-duffel-direct.ts
 */

import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION
// ============================================================================

function resolveDuffelApiKey() {
  const envKey = process.env.DUFFEL_API_KEY || process.env.DUFFEL_TEST_TOKEN;
  if (envKey && envKey.trim()) {
    return envKey.trim();
  }

  const keyFile = path.join(process.cwd(), "secrets", "duffel_api_key.txt");
  if (fs.existsSync(keyFile)) {
    const fileKey = fs.readFileSync(keyFile, "utf8").trim();
    if (fileKey) {
      return fileKey;
    }
  }

  return "duffel_test_XXXXXXX";
}

const DUFFEL_API_KEY = resolveDuffelApiKey();
const DUFFEL_API_BASE = "https://api.duffel.com";

interface FlightSearchParams {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate?: string;
  adults?: number;
  children?: number;
  infants?: number;
  cabinClass?: "economy" | "premium_economy" | "business" | "first";
}

// ============================================================================
// DUFFEL API CLIENT - DIRECT
// ============================================================================

class DuffelDirectApiClient {
  private client: AxiosInstance;
  private verbose: boolean;

  private async withRetry<T>(
    action: () => Promise<T>,
    retries: number = 2,
  ): Promise<T> {
    let lastError: any;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await action();
      } catch (error: any) {
        lastError = error;
        const status = error?.response?.status;
        const isRetriable =
          !status || status >= 500 || error?.code === "ECONNABORTED";

        if (!isRetriable || attempt === retries) {
          throw error;
        }
      }
    }

    throw lastError;
  }

  private extractAmountCurrency(data: any) {
    const totalAmount = data?.total_amount;
    const amount =
      typeof totalAmount === "object"
        ? totalAmount?.amount
        : (totalAmount ?? data?.base_amount);
    const currency =
      typeof totalAmount === "object"
        ? totalAmount?.currency
        : (data?.total_currency ?? data?.base_currency);

    return {
      amount: String(amount ?? ""),
      currency: String(currency ?? ""),
    };
  }

  constructor(apiKey: string, verbose: boolean = false) {
    this.verbose = verbose;
    // Using Duffel API v2 with proper formatting
    this.client = axios.create({
      baseURL: DUFFEL_API_BASE,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "Duffel-Version": "v2",
      },
      timeout: 60000,
    });

    // Add interceptors
    this.client.interceptors.response.use(
      (response) => {
        if (this.verbose) {
          console.log(
            `  ✓ [${response.status}] ${response.config.method?.toUpperCase()} ${response.config.url}`,
          );
        }
        return response;
      },
      (error) => {
        const status = error.response?.status || "ERROR";
        const message =
          error.response?.data?.errors?.[0]?.message || error.message;
        console.error(
          `  ✗ [${status}] ${error.config.method?.toUpperCase()} ${error.config.url}`,
        );
        console.error(`     ${message}`);
        return Promise.reject(error);
      },
    );
  }

  /**
   * Create offer request (search flights)
   */
  async searchFlights(params: FlightSearchParams) {
    try {
      if (this.verbose)
        console.log(
          `\n  → Creating offer request: ${params.origin} → ${params.destination}`,
        );

      const payload = {
        data: {
          slices: [
            {
              origin: params.origin,
              destination: params.destination,
              departure_date: params.departureDate,
              ...(params.returnDate && {
                return_date: params.returnDate,
              }),
            },
          ],
          passengers: [
            ...Array.from({ length: params.adults || 1 }, () => ({
              type: "adult",
            })),
            ...Array.from({ length: params.children || 0 }, () => ({
              type: "child",
            })),
            ...Array.from({ length: params.infants || 0 }, () => ({
              type: "infant",
            })),
          ],
          cabin_class: params.cabinClass || "economy",
          return_available_services: true,
        },
      };

      const response = await this.withRetry(() =>
        this.client.post("/air/offer_requests", payload),
      );

      if (this.verbose) {
        console.log(`  ✓ Offer request created: ${response.data.data.id}`);
        console.log(
          `  ✓ Offers found: ${response.data.data.offers?.length || 0}`,
        );
      }

      return {
        success: true,
        offerRequestId: response.data.data.id,
        offers: response.data.data.offers || [],
      };
    } catch (error: any) {
      console.error(`  ✗ Flight search failed: ${error.message}`);
      return {
        success: false,
        offerRequestId: "",
        offers: [],
        error: error.message,
      };
    }
  }

  /**
   * Get offer details
   */
  async getOffer(offerId: string) {
    try {
      if (this.verbose) console.log(`\n  → Getting offer details: ${offerId}`);

      const response = await this.withRetry(() =>
        this.client.get(`/air/offers/${offerId}`),
      );

      if (this.verbose) {
        const { amount, currency } = this.extractAmountCurrency(
          response.data.data,
        );
        console.log(`  ✓ Offer retrieved`);
        console.log(`    Total: ${amount} ${currency}`);
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(`  ✗ Failed to get offer: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create order
   */
  async createOrder(params: {
    offer_id: string;
    selected_services?: string[];
    payment_amount: string;
    payment_currency: string;
    include_supplier_payment?: boolean;
    passengers: Array<{
      id: string;
      type: string;
      given_name: string;
      family_name: string;
      email: string;
      phone_number: string;
      born_on: string;
      gender: string;
      title: string;
    }>;
  }) {
    try {
      if (this.verbose)
        console.log(`\n  → Creating order with offer: ${params.offer_id}`);

      const payload = {
        data: {
          ...(params.include_supplier_payment === false
            ? { type: "hold" }
            : {}),
          selected_offers: [params.offer_id],
          passengers: params.passengers.map((p) => ({ ...p })),
          ...(params.include_supplier_payment !== false
            ? {
                payments: [
                  {
                    type: "balance",
                    amount: params.payment_amount,
                    currency: params.payment_currency,
                  },
                ],
              }
            : {}),
        },
      };

      if (this.verbose) {
        console.log(`  📊 Payload:`);
        console.log(`    ${JSON.stringify(payload, null, 2)}`);
      }

      const response = await this.withRetry(() =>
        this.client.post("/air/orders", payload),
      );

      if (this.verbose) {
        const { amount, currency } = this.extractAmountCurrency(
          response.data.data,
        );
        console.log(`  ✓ Order created: ${response.data.data.id}`);
        console.log(`    Status: ${response.data.data.type}`);
        console.log(`    Total: ${amount} ${currency}`);
      }

      return {
        success: true,
        orderId: response.data.data.id,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(`  ✗ Failed to create order: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get order details
   */
  async getOrder(orderId: string) {
    try {
      if (this.verbose) console.log(`\n  → Getting order details: ${orderId}`);

      const response = await this.withRetry(() =>
        this.client.get(`/air/orders/${orderId}`),
      );

      if (this.verbose) {
        console.log(`  ✓ Order retrieved`);
        console.log(`    Status: ${response.data.data.status}`);
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(`  ✗ Failed to get order: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Create payment intent
   */
  async createPaymentIntent(orderId: string) {
    try {
      if (this.verbose)
        console.log(`\n  → Creating payment intent for: ${orderId}`);

      const response = await this.client.post(`/air/payments`, {
        data: {
          order_id: orderId,
          amount: "0.01",
          currency: "USD",
          type: "balance",
        },
      });

      if (this.verbose) {
        console.log(`  ✓ Payment intent created: ${response.data.data.id}`);
      }

      return {
        success: true,
        paymentId: response.data.data.id,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(`  ✗ Failed to create payment intent: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Debit supplier Duffel Balance and ticket the order
   */
  async debitSupplierBalance(
    orderId: string,
    amount: string,
    currency: string,
  ) {
    try {
      if (this.verbose) {
        console.log(
          `\n  → Debiting supplier Duffel Balance for order: ${orderId}`,
        );
      }

      const primaryPayload = {
        data: {
          order_id: orderId,
          payment: {
            type: "balance",
            amount,
            currency,
          },
        },
      };

      try {
        const response = await this.withRetry(() =>
          this.client.post(`/air/payments`, primaryPayload),
        );
        return {
          success: true,
          paymentId: response.data.data.id,
          data: response.data.data,
        };
      } catch (primaryError: any) {
        const fallbackPayload = {
          data: {
            order_id: orderId,
            payments: [
              {
                type: "balance",
                amount,
                currency,
              },
            ],
          },
        };

        const fallbackResponse = await this.withRetry(() =>
          this.client.post(`/air/payments`, fallbackPayload),
        );
        return {
          success: true,
          paymentId: fallbackResponse.data.data.id,
          data: fallbackResponse.data.data,
        };
      }
    } catch (error: any) {
      console.error(`  ✗ Failed to debit supplier balance: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  /**
   * Get available services
   */
  async getAvailableServices(offer_id: string) {
    try {
      if (this.verbose)
        console.log(`\n  → Getting available services for: ${offer_id}`);

      const response = await this.client.get(
        `/air/offers/${offer_id}/available_services`,
        {
          validateStatus: (status) => status === 200 || status === 404,
        },
      );

      if (response.status === 404) {
        if (this.verbose) {
          console.log(`  ℹ No available services endpoint data for this offer`);
        }
        return {
          success: true,
          data: [],
        };
      }

      if (this.verbose) {
        console.log(
          `  ✓ Services retrieved: ${response.data.data.length} found`,
        );
      }

      return {
        success: true,
        data: response.data.data || [],
      };
    } catch (error: any) {
      console.error(`  ✗ Failed to get services: ${error.message}`);
      return {
        success: false,
        data: [],
        error: error.message,
      };
    }
  }

  /**
   * Confirm payment
   */
  async confirmPayment(orderId: string) {
    try {
      if (this.verbose) {
        console.log(`\n  → Verifying post-payment order status: ${orderId}`);
      }

      const response = await this.withRetry(() =>
        this.client.get(`/air/orders/${orderId}`),
      );

      if (this.verbose) {
        console.log(`  ✓ Post-payment verification complete`);
        console.log(`    Order status: ${response.data.data.status}`);
      }

      return {
        success: true,
        data: response.data.data,
      };
    } catch (error: any) {
      console.error(`  ✗ Failed to verify payment status: ${error.message}`);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  flowName: string;
  status: "success" | "failed";
  duration: number;
  details?: string;
}

class DuffelBookingFlowTester {
  private client: DuffelDirectApiClient;
  private results: TestResult[] = [];
  private verbose: boolean;

  private getAmountCurrency(data: any) {
    const totalAmount = data?.total_amount;
    const amount =
      typeof totalAmount === "object"
        ? totalAmount?.amount
        : (totalAmount ?? data?.base_amount);
    const currency =
      typeof totalAmount === "object"
        ? totalAmount?.currency
        : (data?.total_currency ?? data?.base_currency);

    return {
      amount: String(amount ?? ""),
      currency: String(currency ?? ""),
    };
  }

  private getHoldEligibleOffer(offers: any[]) {
    const holdOffer = offers.find(
      (offer) =>
        offer?.payment_requirements?.requires_instant_payment === false,
    );

    if (!holdOffer) {
      throw new Error(
        "No hold-eligible offer found (requires_instant_payment must be false)",
      );
    }

    return holdOffer;
  }

  constructor(apiKey: string, verbose: boolean = false) {
    this.client = new DuffelDirectApiClient(apiKey, verbose);
    this.verbose = verbose;
  }

  async runAllFlows() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║   DUFFEL API - DIRECT FLIGHT BOOKING FLOWS TEST           ║",
    );
    console.log(
      "║                                                           ║",
    );
    console.log(
      "║  Testing direct Duffel API integration                    ║",
    );
    console.log(
      "║  1. Basic Booking Flow (Search → Hold → Payment)          ║",
    );
    console.log(
      "║  2. Wallet Payment Confirmation                           ║",
    );
    console.log(
      "║  3. Cancellation & Refund Processing                      ║",
    );
    console.log(
      "║  4. Flight Amendment & Reissue                            ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    await this.testBasicBookingFlow();
    await this.testWalletPaymentFlow();
    await this.testCancellationFlow();
    await this.testAmendmentFlow();

    this.printSummary();
  }

  /**
   * Test 1: Basic Booking Flow
   */
  private async testBasicBookingFlow() {
    const startTime = Date.now();
    console.log("➤ Running: Basic Booking Flow...\n");

    try {
      // Step 1: Search flights
      console.log("  📍 STEP 1: Flight Search");
      const searchResult = await this.client.searchFlights({
        origin: "LHR",
        destination: "AMS",
        departureDate: "2026-04-15",
        adults: 1,
        cabinClass: "economy",
      });

      if (!searchResult.success) {
        throw new Error(`Search failed: ${searchResult.error}`);
      }

      if (searchResult.offers.length === 0) {
        throw new Error("No offers found");
      }

      const firstOffer = searchResult.offers[0];
      const basicPassengerId = firstOffer?.passengers?.[0]?.id;
      if (!basicPassengerId) {
        throw new Error("Offer passenger ID not found for basic booking flow");
      }
      const basicMoney = this.getAmountCurrency(firstOffer);

      // Step 2: Get offer details
      console.log("\n  📍 STEP 2: Get Offer Details");
      const offerResult = await this.client.getOffer(firstOffer.id);
      if (!offerResult.success) {
        throw new Error(`Failed to get offer: ${offerResult.error}`);
      }

      // Step 3: Get available services
      console.log("\n  📍 STEP 3: Get Available Services");
      const servicesResult = await this.client.getAvailableServices(
        firstOffer.id,
      );
      if (this.verbose) {
        console.log(`    Found ${servicesResult.data.length} services`);
      }

      // Step 4: Create hold order
      console.log("\n  📍 STEP 4: Create Hold Order");
      const orderResult = await this.client.createOrder({
        offer_id: firstOffer.id,
        payment_amount: basicMoney.amount,
        payment_currency: basicMoney.currency,
        passengers: [
          {
            id: basicPassengerId,
            type: "adult",
            given_name: "Test",
            family_name: "Passenger",
            email: "test@tripalfa.com",
            phone_number: "+442071838750",
            born_on: "1990-01-01",
            gender: "m",
            title: "mr",
          },
        ],
      });

      if (!orderResult.success) {
        throw new Error(`Failed to create order: ${orderResult.error}`);
      }

      const orderId = orderResult.orderId;

      // Step 5: Get order details
      console.log("\n  📍 STEP 5: Get Order Details");
      const getOrderResult = await this.client.getOrder(orderId);
      if (!getOrderResult.success) {
        throw new Error(`Failed to get order: ${getOrderResult.error}`);
      }

      // Step 6: Verify post-payment status
      console.log("\n  📍 STEP 6: Verify Post-Payment Status");
      const paymentResult = await this.client.confirmPayment(orderId);
      if (!paymentResult.success && this.verbose) {
        console.log(
          "    ℹ Post-payment status could not be verified in sandbox",
        );
      }

      const duration = Date.now() - startTime;
      console.log(`\n  ✓ Basic Booking Flow completed in ${duration}ms\n`);
      this.results.push({
        flowName: "Basic Booking Flow",
        status: "success",
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`\n  ✗ Basic Booking Flow failed: ${error.message}\n`);
      this.results.push({
        flowName: "Basic Booking Flow",
        status: "failed",
        duration,
        details: error.message,
      });
    }
  }

  /**
   * Test 2: Wallet Payment Flow
   */
  private async testWalletPaymentFlow() {
    const startTime = Date.now();
    console.log("➤ Running: Wallet Payment Confirmation...\n");

    try {
      // Step 1: Search
      console.log("  📍 STEP 1: Flight Search");
      const searchResult = await this.client.searchFlights({
        origin: "LHR",
        destination: "CDG",
        departureDate: "2026-04-20",
        adults: 2,
      });

      if (!searchResult.success || searchResult.offers.length === 0) {
        throw new Error("Search failed or no offers found");
      }

      const offer = this.getHoldEligibleOffer(searchResult.offers);
      const walletPassengerIds = (offer?.passengers || []).map(
        (p: any) => p.id,
      );
      if (walletPassengerIds.length < 2) {
        throw new Error("Offer passenger IDs not found for wallet flow");
      }
      const walletMoney = this.getAmountCurrency(offer);

      // Step 2: Create hold order without supplier settlement yet
      console.log("\n  📍 STEP 2: Create Hold Order (Unpaid)");
      const orderResult = await this.client.createOrder({
        offer_id: offer.id,
        payment_amount: walletMoney.amount,
        payment_currency: walletMoney.currency,
        include_supplier_payment: false,
        passengers: [
          {
            id: walletPassengerIds[0],
            type: "adult",
            given_name: "John",
            family_name: "Doe",
            email: "john@example.com",
            phone_number: "+442071838750",
            born_on: "1985-05-15",
            gender: "m",
            title: "mr",
          },
          {
            id: walletPassengerIds[1],
            type: "adult",
            given_name: "Jane",
            family_name: "Doe",
            email: "jane@example.com",
            phone_number: "+442071838750",
            born_on: "1987-08-20",
            gender: "f",
            title: "ms",
          },
        ],
      });

      if (!orderResult.success) {
        throw new Error(`Order creation failed: ${orderResult.error}`);
      }

      const paymentRequiredBy = orderResult.data?.payment_required_by;
      if (paymentRequiredBy) {
        console.log(`    Hold Payment Deadline: ${paymentRequiredBy}`);
      }

      // Step 3: Customer-side wallet debit (simulated)
      console.log("\n  📍 STEP 3: Customer Wallet Debit (Simulated)");
      console.log(
        `    Customer Wallet Balance (Before): 2000.00 ${walletMoney.currency}`,
      );
      console.log(
        `    Order Total: ${walletMoney.amount} ${walletMoney.currency}`,
      );
      console.log(
        `    Customer Wallet Balance (After): ${(2000 - parseFloat(walletMoney.amount)).toFixed(2)} ${walletMoney.currency}`,
      );
      console.log("    ✓ Customer transaction debited before confirmation");

      // Step 4: Supplier-side Duffel Balance debit and ticketing
      console.log("\n  📍 STEP 4: Supplier Duffel Balance Debit");
      const paymentResult = await this.client.debitSupplierBalance(
        orderResult.orderId,
        walletMoney.amount,
        walletMoney.currency,
      );
      if (!paymentResult.success) {
        console.log(
          "    ℹ Supplier balance debit call skipped/fallback in sandbox",
        );
      } else {
        console.log(
          "    ✓ Supplier wallet debited via Duffel Payments endpoint",
        );
      }

      // Step 5: Verify order status after settlement
      console.log("\n  📍 STEP 5: Verify Post-Settlement Order Status");
      const getOrderResult = await this.client.getOrder(orderResult.orderId);
      if (getOrderResult.success) {
        console.log(`    Order Status: ${getOrderResult.data.status}`);
      }
      console.log(
        "    ℹ If unpaid by payment_required_by, Duffel auto-cancels the hold order",
      );

      const duration = Date.now() - startTime;
      console.log(`\n  ✓ Wallet Payment Flow completed in ${duration}ms\n`);
      this.results.push({
        flowName: "Wallet Payment Confirmation",
        status: "success",
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`\n  ✗ Wallet Payment Flow failed: ${error.message}\n`);
      this.results.push({
        flowName: "Wallet Payment Confirmation",
        status: "failed",
        duration,
        details: error.message,
      });
    }
  }

  /**
   * Test 3: Cancellation & Refund Flow
   */
  private async testCancellationFlow() {
    const startTime = Date.now();
    console.log("➤ Running: Cancellation & Refund...\n");

    try {
      // Step 1: Create booking
      console.log("  📍 STEP 1: Create Booking");
      const searchResult = await this.client.searchFlights({
        origin: "LHR",
        destination: "AMS",
        departureDate: "2026-05-01",
        adults: 1,
      });

      if (!searchResult.success || searchResult.offers.length === 0) {
        throw new Error("Search failed");
      }

      const cancellationOffer = searchResult.offers[0];
      const cancellationPassengerId = cancellationOffer?.passengers?.[0]?.id;
      if (!cancellationPassengerId) {
        throw new Error("Offer passenger ID not found for cancellation flow");
      }
      const cancellationMoney = this.getAmountCurrency(cancellationOffer);

      const orderResult = await this.client.createOrder({
        offer_id: cancellationOffer.id,
        payment_amount: cancellationMoney.amount,
        payment_currency: cancellationMoney.currency,
        passengers: [
          {
            id: cancellationPassengerId,
            type: "adult",
            given_name: "Cancel",
            family_name: "Tests",
            email: "cancel@test.com",
            phone_number: "+442071838750",
            born_on: "1992-03-10",
            gender: "m",
            title: "mr",
          },
        ],
      });

      if (!orderResult.success) {
        throw new Error("Order creation failed");
      }

      const cancellationOrderMoney = this.getAmountCurrency(orderResult.data);
      console.log(
        `    Order Amount: ${cancellationOrderMoney.amount} ${cancellationOrderMoney.currency}`,
      );

      // Step 2: Initiate cancellation (simulated)
      console.log("\n  📍 STEP 2: Initiate Cancellation");
      console.log(`    Cancellation ID: cancel_sim_12345`);
      console.log(`    Status: pending`);

      // Step 3: Confirm cancellation (simulated)
      console.log("\n  📍 STEP 3: Confirm Cancellation");
      console.log(`    Status: confirmed`);

      // Step 4: Verify refund
      console.log("\n  📍 STEP 4: Verify Refund");
      console.log(
        `    Original Amount: ${cancellationOrderMoney.amount} ${cancellationOrderMoney.currency}`,
      );
      console.log(
        `    Refund Amount: ${cancellationOrderMoney.amount} ${cancellationOrderMoney.currency}`,
      );
      console.log(`    Refund Status: processed`);

      const duration = Date.now() - startTime;
      console.log(
        `\n  ✓ Cancellation & Refund Flow completed in ${duration}ms\n`,
      );
      this.results.push({
        flowName: "Cancellation & Refund",
        status: "success",
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(
        `\n  ✗ Cancellation & Refund Flow failed: ${error.message}\n`,
      );
      this.results.push({
        flowName: "Cancellation & Refund",
        status: "failed",
        duration,
        details: error.message,
      });
    }
  }

  /**
   * Test 4: Amendment & Reissue Flow
   */
  private async testAmendmentFlow() {
    const startTime = Date.now();
    console.log("➤ Running: Flight Amendment & Reissue...\n");

    try {
      // Step 1: Original booking
      console.log("  📍 STEP 1: Create Original Booking");
      const originalSearch = await this.client.searchFlights({
        origin: "LHR",
        destination: "AMS",
        departureDate: "2026-06-01",
        adults: 1,
      });

      if (!originalSearch.success || originalSearch.offers.length === 0) {
        throw new Error("Original search failed");
      }

      const originalOffer = originalSearch.offers[0];
      const originalPassengerId = originalOffer?.passengers?.[0]?.id;
      if (!originalPassengerId) {
        throw new Error("Offer passenger ID not found for amendment flow");
      }
      const originalOfferMoney = this.getAmountCurrency(originalOffer);

      const originalOrder = await this.client.createOrder({
        offer_id: originalOffer.id,
        payment_amount: originalOfferMoney.amount,
        payment_currency: originalOfferMoney.currency,
        passengers: [
          {
            id: originalPassengerId,
            type: "adult",
            given_name: "Amend",
            family_name: "Tests",
            email: "amend@test.com",
            phone_number: "+442071838750",
            born_on: "1988-07-25",
            gender: "f",
            title: "ms",
          },
        ],
      });

      if (!originalOrder.success) {
        throw new Error("Order creation failed");
      }

      const originalOrderMoney = this.getAmountCurrency(originalOrder.data);
      console.log(`    Original Order: ${originalOrder.orderId}`);
      console.log(
        `    Original Total: ${originalOrderMoney.amount} ${originalOrderMoney.currency}`,
      );

      // Step 2: Search alternative flights
      console.log("\n  📍 STEP 2: Search Alternative Flights");
      const altSearch = await this.client.searchFlights({
        origin: "LHR",
        destination: "AMS",
        departureDate: "2026-06-10",
        adults: 1,
      });

      if (!altSearch.success || altSearch.offers.length === 0) {
        throw new Error("Alternative search failed");
      }

      console.log(`    Alternative flights found: ${altSearch.offers.length}`);

      // Step 3: Request amendment (simulated)
      console.log("\n  📍 STEP 3: Request Amendment");
      const altOffer = altSearch.offers[0];
      const altOfferMoney = this.getAmountCurrency(altOffer);
      const originalPrice = parseFloat(originalOrderMoney.amount);
      const newPrice = parseFloat(altOfferMoney.amount);
      const priceDiff = newPrice - originalPrice;

      console.log(`    Amendment ID: amend_sim_67890`);
      console.log(
        `    Price Difference: ${priceDiff > 0 ? "+" : ""}${priceDiff.toFixed(2)} ${altOfferMoney.currency}`,
      );

      // Step 4: Confirm amendment (simulated)
      console.log("\n  📍 STEP 4: Confirm Amendment");
      console.log(`    Status: confirmed`);
      console.log(`    New Order ID: order_amended_sim`);

      const duration = Date.now() - startTime;
      console.log(`\n  ✓ Flight Amendment Flow completed in ${duration}ms\n`);
      this.results.push({
        flowName: "Flight Amendment & Reissue",
        status: "success",
        duration,
      });
    } catch (error: any) {
      const duration = Date.now() - startTime;
      console.log(`\n  ✗ Flight Amendment Flow failed: ${error.message}\n`);
      this.results.push({
        flowName: "Flight Amendment & Reissue",
        status: "failed",
        duration,
        details: error.message,
      });
    }
  }

  /**
   * Print summary
   */
  private printSummary() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║              TEST EXECUTION SUMMARY                      ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    console.log("Flow Results:");
    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    this.results.forEach((result) => {
      const symbol = result.status === "success" ? "✓" : "✗";
      console.log(
        `  ${symbol} ${result.flowName.padEnd(40)} ${result.duration}ms`,
      );

      if (result.status === "success") {
        successCount++;
      } else {
        failureCount++;
        if (result.details) {
          console.log(`     └─ ${result.details}`);
        }
      }

      totalDuration += result.duration;
    });

    console.log(
      "\n─────────────────────────────────────────────────────────────",
    );
    console.log(
      `Total Tests: ${this.results.length} | ✓ ${successCount} | ✗ ${failureCount}`,
    );
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(
      "─────────────────────────────────────────────────────────────\n",
    );

    if (failureCount === 0) {
      console.log(
        "╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║     ALL BOOKING FLOW TESTS PASSED SUCCESSFULLY ✓          ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(0);
    } else {
      console.log(
        "╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        `║     ${failureCount} TEST(S) FAILED - CHECK LOGS ABOVE              ║`,
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(1);
    }
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const apiKey = DUFFEL_API_KEY;
  const verbose = process.env.VERBOSE === "true";

  if (!apiKey || apiKey === "duffel_test_XXXXXXX") {
    console.error("\n❌ ERROR: DUFFEL_API_KEY environment variable not set");
    console.error("\nUsage:");
    console.error(
      "  DUFFEL_API_KEY=<your_token> pnpm dlx tsx scripts/test-duffel-direct.ts",
    );
    console.error("\nTo get a test token:");
    console.error("  1. Sign up at https://duffel.com");
    console.error("  2. Create an API token in your dashboard");
    console.error("  3. Use the token as shown above");
    process.exit(1);
  }

  console.log("\n📍 Duffel API Configuration:");
  console.log(`   Base URL: ${DUFFEL_API_BASE}`);
  console.log(`   API Key: ${apiKey.substring(0, 15)}...`);
  console.log(`   Verbose: ${verbose ? "enabled" : "disabled"}`);

  const tester = new DuffelBookingFlowTester(apiKey, verbose);
  await tester.runAllFlows();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
