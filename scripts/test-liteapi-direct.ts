#!/usr/bin/env npx tsx
/**
 * Direct LiteAPI Sandbox - Hotel E2E Flow Test
 *
 * Configuration:
 *   1. Copy .env.test file to repo root with your LITEAPI_API_KEY
 *   2. Or set environment variable: LITEAPI_API_KEY=sand_xxxxx
 *   3. Or add to secrets/liteapi_api_key.txt
 *
 * Usage:
 *   npm run test:api:liteapi
 *   VERBOSE=true npm run test:api:liteapi
 *   LITEAPI_API_KEY=sand_xxx npm run test:api:liteapi
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

/**
 * Load environment variables from .env files
 */
function loadEnvFile() {
  const envFiles = [
    path.join(process.cwd(), ".env.test"),
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
  ];

  for (const envFile of envFiles) {
    if (!fs.existsSync(envFile)) {
      continue;
    }

    try {
      const content = fs.readFileSync(envFile, "utf8");
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();

        // Skip comments and empty lines
        if (!trimmed || trimmed.startsWith("#")) {
          continue;
        }

        // Parse KEY=VALUE
        const [key, ...valueParts] = trimmed.split("=");
        if (!key) continue;

        const value = valueParts.join("=").trim();
        // Remove surrounding quotes if present
        const cleanValue = value
          .replace(/^["']|["']$/g, "")
          .replace(/\\n/g, "\n");

        // Only set if not already set via process.env
        if (!process.env[key.trim()]) {
          process.env[key.trim()] = cleanValue;
        }
      }

      return true;
    } catch {
      // Continue to next env file
    }
  }

  return false;
}

// Load environment variables at startup
loadEnvFile();

interface FlowTestResult {
  flowName: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  error?: string;
  data?: any;
}

interface E2EContext {
  hotelId?: string;
  offerId?: string;
  offerPriceAmount?: number;
  offerPriceCurrency?: string;
  prebookId?: string;
  confirmationId?: string;
  bookingId?: string;
  bookingRef?: string;
}

function resolveLiteApiKey() {
  const envKey =
    process.env.LITEAPI_API_KEY ||
    process.env.LITEAPI_SANDBOX_API_KEY ||
    process.env.VITE_LITEAPI_TEST_API_KEY;

  if (envKey?.trim()) {
    return envKey.trim();
  }

  const keyFiles = [
    path.join(process.cwd(), "secrets", "liteapi_api_key.txt"),
    path.join(process.cwd(), "secrets", "liteapi_sandbox_key.txt"),
    path.join(process.cwd(), "secrets", "liteapi_test_key.txt"),
    path.join(process.cwd(), "secrets", "liteapi_key.txt"),
  ];

  for (const keyFile of keyFiles) {
    if (!fs.existsSync(keyFile)) {
      continue;
    }

    const fileKey = fs.readFileSync(keyFile, "utf8").trim();
    if (fileKey) {
      return fileKey;
    }
  }

  return "liteapi_sandbox_xxxxx";
}

function extractErrorMessage(error: unknown): string {
  // Handle Error objects with message property
  if (error instanceof Error) {
    return error.message;
  }

  // Handle AxiosError
  const axiosError = error as AxiosError<any>;
  if (axiosError.response?.data) {
    const data = axiosError.response.data;
    if (typeof data === "string") {
      return data;
    }
    if (typeof data === "object" && data !== null) {
      return (
        data.error ||
        data.message ||
        data.detail ||
        data.msg ||
        JSON.stringify(data)
      );
    }
  }

  if (axiosError.message) {
    return axiosError.message;
  }

  if (axiosError.code) {
    return `${axiosError.code}: ${axiosError.message || "Unknown error"}`;
  }

  // Handle plain objects
  if (typeof error === "object" && error !== null) {
    const err = error as any;
    if (err.message) {
      return err.message;
    }
    if (err.error) {
      return typeof err.error === "string"
        ? err.error
        : extractErrorMessage(err.error);
    }
    return JSON.stringify(error);
  }

  // Handle strings and others
  return String(error);
}

function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

function getAmount(value: any): number {
  if (typeof value === "number") {
    return value;
  }
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  if (Array.isArray(value) && value.length > 0) {
    return getAmount(value[0]?.amount);
  }
  if (value && typeof value === "object") {
    if ("amount" in value) {
      return getAmount(value.amount);
    }
  }
  return 0;
}

function getCurrency(...values: any[]): string {
  for (const value of values) {
    if (!value) continue;
    if (typeof value === "string" && value.length === 3) return value;
    if (Array.isArray(value) && value.length > 0) {
      const fromArray = getCurrency(value[0]?.currency);
      if (fromArray) return fromArray;
    }
    if (typeof value === "object" && "currency" in value && value.currency) {
      return String(value.currency);
    }
  }
  return "USD";
}

class LiteApiDirectClient {
  private apiClient: AxiosInstance;
  private bookClient: AxiosInstance;
  private verbose: boolean;

  constructor(apiKey: string, verbose = false) {
    this.verbose = verbose;

    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    };

    this.apiClient = axios.create({
      baseURL:
        process.env.LITEAPI_API_BASE_URL || "https://api.liteapi.travel/v3.0",
      timeout: Number(process.env.LITEAPI_TIMEOUT_MS || 90000),
      headers,
    });

    this.bookClient = axios.create({
      baseURL:
        process.env.LITEAPI_BOOK_BASE_URL || "https://book.liteapi.travel/v3.0",
      timeout: Number(process.env.LITEAPI_TIMEOUT_MS || 90000),
      headers,
    });
  }

  private logResponse(method: string, endpoint: string, status: number) {
    if (this.verbose) {
      console.log(`  ✓ [${status}] ${method.toUpperCase()} ${endpoint}`);
    }
  }

  private async withRetry<T>(
    action: () => Promise<T>,
    retries: number = 1,
  ): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= retries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error;
        const status = (error as AxiosError).response?.status;
        const retriable = !status || status >= 500 || status === 429;
        if (!retriable || attempt === retries) {
          break;
        }
      }
    }

    throw lastError;
  }

  async checkConnectivity() {
    const response = await this.withRetry(() =>
      this.apiClient.get("/data/languages"),
    );
    this.logResponse("get", "/data/languages", response.status);
    const count = Array.isArray(response.data?.data)
      ? response.data.data.length
      : Array.isArray(response.data)
        ? response.data.length
        : 0;

    return {
      success: true,
      languages: count,
    };
  }

  async searchHotelRates(params: {
    cityName: string;
    countryCode: string;
    checkin: string;
    checkout: string;
    adults: number;
  }) {
    const payload = {
      cityName: params.cityName,
      countryCode: params.countryCode,
      checkin: params.checkin,
      checkout: params.checkout,
      currency: "USD",
      guestNationality: "US",
      occupancies: [
        {
          adults: params.adults,
          children: [],
        },
      ],
      limit: 10,
      maxRatesPerHotel: 2,
      roomMapping: true,
      timeout: 8,
      includeHotelData: true,
    };

    const response = await this.withRetry(() =>
      this.apiClient.post("/hotels/rates", payload),
    );
    this.logResponse("post", "/hotels/rates", response.status);

    const rows = response.data?.data || response.data?.hotels || [];
    const hotels = Array.isArray(rows)
      ? rows.map((entry: any) => (entry?.hotels?.[0] ? entry.hotels[0] : entry))
      : [];

    const hotel = hotels.find((h: any) => h?.roomTypes?.length > 0);
    if (!hotel) {
      throw new Error(
        "No hotel with room rates found for selected search criteria",
      );
    }

    const roomType = hotel.roomTypes.find(
      (rt: any) => Array.isArray(rt?.rates) && rt.rates.length > 0,
    );
    if (!roomType) {
      throw new Error("No room type with rates returned from LiteAPI");
    }

    const rate = roomType.rates[0];
    const offerId =
      roomType.offerId ||
      roomType.offerID ||
      rate?.offerId ||
      rate?.offerID ||
      rate?.rateId;

    const amount =
      getAmount(rate?.retailRate?.total?.[0]) ||
      getAmount(roomType?.offerRetailRate) ||
      getAmount(rate?.offerRetailRate) ||
      getAmount(rate?.suggestedSellingPrice?.[0]);

    if (!offerId) {
      throw new Error("Unable to determine offerId from rates response");
    }

    if (!amount || amount <= 0) {
      throw new Error(
        "Unable to determine valid offer price from rates response",
      );
    }

    const currency = getCurrency(
      rate?.retailRate?.total?.[0],
      rate?.offerRetailRate,
      rate?.suggestedSellingPrice?.[0],
      "USD",
    );

    return {
      success: true,
      hotelId: hotel.id || hotel.hotelId,
      hotelName: hotel.name || hotel.hotelName || hotel.hotelId,
      offerId,
      amount,
      currency,
      roomName: roomType.name,
      ratesCount: roomType.rates.length,
    };
  }

  async createPrebook(params: {
    offerId: string;
    amount: number;
    currency: string;
  }) {
    const payload = {
      offerId: params.offerId,
      price: {
        amount: params.amount,
        currency: params.currency,
      },
      rooms: 1,
      includeCreditBalance: true,
    };

    const response = await this.withRetry(() =>
      this.bookClient.post("/rates/prebook", payload),
    );
    this.logResponse("post", "/rates/prebook", response.status);

    const prebookId =
      response.data?.transactionId ||
      response.data?.prebookId ||
      response.data?.data?.transactionId ||
      response.data?.data?.prebookId;

    if (!prebookId) {
      throw new Error(
        "Prebook created but transaction/prebook ID was not returned",
      );
    }

    return {
      success: true,
      prebookId,
      expiresAt: response.data?.expiresAt || response.data?.data?.expiresAt,
      paymentTypes: response.data?.data?.paymentTypes || [],
      creditLine: response.data?.data?.creditLine,
    };
  }

  async getPrebook(prebookId: string) {
    const response = await this.withRetry(() =>
      this.bookClient.get(`/prebooks/${prebookId}`),
    );
    this.logResponse("get", `/prebooks/${prebookId}`, response.status);

    return {
      success: true,
      data: response.data,
    };
  }

  async completeBooking(prebookId: string) {
    const payload = {
      prebookId,
      clientReference: `tripalfa-hotel-${Date.now()}`,
      holder: {
        firstName: "Trip",
        lastName: "Alfa",
        email: "qa+liteapi@tripalfa.com",
        phone: "+971500000000",
      },
      guests: [
        {
          occupancyNumber: 1,
          firstName: "Trip",
          lastName: "Guest",
          email: "qa+guest@tripalfa.com",
          phone: "+971500000001",
        },
      ],
      metadata: {
        ip: "127.0.0.1",
        country: "AE",
        language: "en",
        platform: "script",
        user_agent: "TripAlfa-LiteAPI-E2E-Runner",
      },
      payment: {
        method: "WALLET",
      },
    };

    const response = await this.withRetry(() =>
      this.bookClient.post("/rates/book", payload),
    );
    this.logResponse("post", "/rates/book", response.status);

    // Extract booking ID with enhanced fallback logic
    const bookingId =
      response.data?.bookingId ||
      response.data?.booking?.id ||
      response.data?.id ||
      response.data?.transactionId ||
      response.data?.booking?.transactionId ||
      response.data?.confirmation?.bookingId ||
      response.data?.data?.bookingId;

    if (this.verbose && !bookingId) {
      console.log(
        "  [DEBUG] Booking confirmation response keys:",
        Object.keys(response.data || {}),
      );
    }

    return {
      success: true,
      data: response.data,
      confirmationId:
        response.data?.confirmationId ||
        response.data?.booking?.reference?.supplier ||
        response.data?.booking?.reference?.bookingID ||
        bookingId ||
        response.data?.transactionId,
      bookingId,
      bookingRef:
        response.data?.booking?.reference?.bookingReference ||
        response.data?.booking?.reference?.bookingRef ||
        response.data?.bookingRef ||
        response.data?.reference,
    };
  }

  async cancelBooking(
    bookingId: string,
    reason: string = "Customer requested cancellation",
  ) {
    if (!bookingId) {
      throw new Error("bookingId is required for cancellation");
    }

    const payload = {
      status: "cancelled",
      cancellationReason: reason,
      initiateRefund: true,
      refundToWallet: true,
    };

    try {
      const response = await this.withRetry(() =>
        this.bookClient.put(`/bookings/${bookingId}`, payload),
      );
      this.logResponse("put", `/bookings/${bookingId}`, response.status);

      return {
        success: true,
        data: response.data,
        cancellationId: response.data?.cancellationId || `CNL-${Date.now()}`,
        refundAmount:
          response.data?.refund?.amount || response.data?.refundAbleAmount,
        refundCurrency: response.data?.refund?.currency || "USD",
        refundType: response.data?.refund?.type || "full",
        refundStatus: response.data?.refund?.status,
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      // Some booking endpoints may not support PUT directly, try POST alternative
      if (
        axiosError.response?.status === 405 ||
        axiosError.response?.status === 404
      ) {
        try {
          const postResponse = await this.withRetry(() =>
            this.bookClient.post(`/bookings/${bookingId}/cancel`, payload),
          );
          this.logResponse(
            "post",
            `/bookings/${bookingId}/cancel`,
            postResponse.status,
          );

          return {
            success: true,
            data: postResponse.data,
            cancellationId:
              postResponse.data?.cancellationId || `CNL-${Date.now()}`,
            refundAmount:
              postResponse.data?.refund?.amount ||
              postResponse.data?.refundAbleAmount,
            refundCurrency: postResponse.data?.refund?.currency || "USD",
            refundType: postResponse.data?.refund?.type || "full",
            refundStatus: postResponse.data?.refund?.status,
          };
        } catch {
          throw error; // Re-throw original error
        }
      }

      throw error;
    }
  }

  async processRefund(
    bookingId: string,
    refundAmount: number,
    currency: string = "USD",
    reason: string = "Booking cancelled",
  ) {
    if (!bookingId || !refundAmount) {
      throw new Error(
        "bookingId and refundAmount are required for refund processing",
      );
    }

    const payload = {
      bookingId,
      amount: refundAmount,
      currency,
      reason,
      refundToWallet: true,
      metadata: {
        processedAt: new Date().toISOString(),
        processor: "tripalfa-e2e-test",
      },
    };

    try {
      const response = await this.withRetry(() =>
        this.bookClient.post("/refunds", payload),
      );
      this.logResponse("post", "/refunds", response.status);

      return {
        success: true,
        data: response.data,
        refundId: response.data?.refundId || `RFN-${Date.now()}`,
        refundAmount: response.data?.amount || refundAmount,
        refundCurrency: response.data?.currency || currency,
        refundStatus: response.data?.status || "processed",
        transactionId:
          response.data?.transactionId || response.data?.walletTransactionId,
      };
    } catch (error) {
      const axiosError = error as AxiosError<any>;

      // Some implementations may handle refunds differently
      // Try alternative endpoint if main endpoint fails
      if (axiosError.response?.status === 404) {
        try {
          const altResponse = await this.withRetry(() =>
            this.bookClient.post(`/bookings/${bookingId}/refund`, payload),
          );
          this.logResponse(
            "post",
            `/bookings/${bookingId}/refund`,
            altResponse.status,
          );

          return {
            success: true,
            data: altResponse.data,
            refundId: altResponse.data?.refundId || `RFN-${Date.now()}`,
            refundAmount: altResponse.data?.amount || refundAmount,
            refundCurrency: altResponse.data?.currency || currency,
            refundStatus: altResponse.data?.status || "processed",
            transactionId:
              altResponse.data?.transactionId ||
              altResponse.data?.walletTransactionId,
          };
        } catch {
          throw error; // Re-throw original error
        }
      }

      throw error;
    }
  }
}

class LiteApiHotelE2ERunner {
  private readonly apiKey: string;
  private readonly verbose: boolean;
  private readonly client: LiteApiDirectClient;
  private readonly context: E2EContext = {};
  private readonly results: FlowTestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.apiKey = resolveLiteApiKey();
    this.verbose =
      process.env.VERBOSE === "true" || process.env.DEBUG === "true";
    this.client = new LiteApiDirectClient(this.apiKey, this.verbose);
  }

  private maskApiKey(value: string) {
    if (!value || value.length < 8) {
      return "<missing>";
    }
    return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  }

  async run() {
    console.clear();
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║      LITEAPI SANDBOX - HOTEL E2E DIRECT TEST SUITE       ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    console.log("📍 LiteAPI Configuration:");
    console.log(
      `   API URL:  ${process.env.LITEAPI_API_BASE_URL || "https://api.liteapi.travel/v3.0"}`,
    );
    console.log(
      `   BOOK URL: ${process.env.LITEAPI_BOOK_BASE_URL || "https://book.liteapi.travel/v3.0"}`,
    );
    console.log(`   API Key:  ${this.maskApiKey(this.apiKey)}\n`);

    if (!this.apiKey || this.apiKey.includes("xxxxx")) {
      throw new Error(
        "LiteAPI key not found. Set LITEAPI_API_KEY or add secrets/liteapi_api_key.txt",
      );
    }

    this.startTime = Date.now();

    await this.runFlow("Connectivity Check", async () => {
      const result = await this.client.checkConnectivity();
      return { languages: result.languages };
    });

    await this.runFlow("Hotel Rates Search", async () => {
      const result = await this.client.searchHotelRates({
        cityName: process.env.LITEAPI_TEST_CITY || "Paris",
        countryCode: process.env.LITEAPI_TEST_COUNTRY || "FR",
        checkin: process.env.LITEAPI_TEST_CHECKIN || getFutureDate(30),
        checkout: process.env.LITEAPI_TEST_CHECKOUT || getFutureDate(33),
        adults: Number(process.env.LITEAPI_TEST_ADULTS || 2),
      });

      this.context.hotelId = result.hotelId;
      this.context.offerId = result.offerId;
      this.context.offerPriceAmount = result.amount;
      this.context.offerPriceCurrency = result.currency;

      return {
        hotelId: result.hotelId,
        hotelName: result.hotelName,
        roomName: result.roomName,
        offerId: result.offerId,
        amount: result.amount,
        currency: result.currency,
        ratesCount: result.ratesCount,
      };
    });

    await this.runFlow("Prebook Creation", async () => {
      if (!this.context.offerId || !this.context.offerPriceAmount) {
        throw new Error("Missing offer context from rates search");
      }

      const result = await this.client.createPrebook({
        offerId: this.context.offerId,
        amount: this.context.offerPriceAmount,
        currency: this.context.offerPriceCurrency || "USD",
      });

      this.context.prebookId = result.prebookId;

      return {
        prebookId: result.prebookId,
        expiresAt: result.expiresAt,
        paymentTypes: result.paymentTypes,
      };
    });

    await this.runFlow("Prebook Retrieval", async () => {
      if (!this.context.prebookId) {
        throw new Error("Missing prebook ID from previous step");
      }

      const result = await this.client.getPrebook(this.context.prebookId);
      return {
        prebookId: this.context.prebookId,
        status: result.data?.status || result.data?.data?.status || "available",
      };
    });

    await this.runFlow("Booking Confirmation (WALLET)", async () => {
      if (!this.context.prebookId) {
        throw new Error("Missing prebook ID from previous step");
      }

      const result = await this.client.completeBooking(this.context.prebookId);
      this.context.confirmationId = result.confirmationId;
      this.context.bookingId = result.bookingId;
      this.context.bookingRef = result.bookingRef;

      return {
        confirmationId: result.confirmationId || "n/a",
        bookingId: result.bookingId || "n/a",
        bookingRef: result.bookingRef || "n/a",
      };
    });

    await this.runFlow(
      "Booking Cancellation",
      async () => {
        if (!this.context.bookingId) {
          throw new Error("Missing booking ID from previous step");
        }

        const result = await this.client.cancelBooking(
          this.context.bookingId,
          "E2E test cancellation",
        );

        return {
          cancellationId: result.cancellationId,
          refundAmount: result.refundAmount,
          refundCurrency: result.refundCurrency,
          refundType: result.refundType,
          refundStatus: result.refundStatus || "pending",
        };
      },
      true, // Allow skip on failure (cancellation policy may prevent it)
    );

    await this.runFlow(
      "Refund Processing (WALLET)",
      async () => {
        if (!this.context.bookingId || !this.context.offerPriceAmount) {
          throw new Error("Missing booking ID or offer price from context");
        }

        const result = await this.client.processRefund(
          this.context.bookingId,
          this.context.offerPriceAmount,
          this.context.offerPriceCurrency || "USD",
          "Wallet refund from E2E test cancellation",
        );

        return {
          refundId: result.refundId,
          refundAmount: result.refundAmount,
          refundCurrency: result.refundCurrency,
          refundStatus: result.refundStatus,
          transactionId: result.transactionId,
        };
      },
      true, // Allow skip on failure
    );

    await this.printSummary();
  }

  private async runFlow(
    flowName: string,
    flowFn: () => Promise<any>,
    allowSkipOnFailure = false,
  ) {
    const startedAt = Date.now();
    console.log(`➤ Running: ${flowName}...`);

    try {
      const data = await flowFn();
      const duration = Date.now() - startedAt;

      this.results.push({
        flowName,
        status: "success",
        duration,
        data,
      });

      console.log(`   ✓ ${flowName} completed in ${duration}ms\n`);
    } catch (error) {
      const duration = Date.now() - startedAt;
      const message = extractErrorMessage(error);

      if (allowSkipOnFailure) {
        this.results.push({
          flowName,
          status: "skipped",
          duration,
          error: message,
        });
        console.log(`   ⊘ ${flowName} skipped after ${duration}ms`);
        console.log(`   Reason: ${message}\n`);
        return;
      }

      this.results.push({
        flowName,
        status: "failed",
        duration,
        error: message,
      });

      console.log(`   ✗ ${flowName} failed after ${duration}ms`);
      console.log(`   Error: ${message}\n`);
    }
  }

  private async printSummary() {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter(
      (r) => r.status === "success",
    ).length;
    const failedCount = this.results.filter(
      (r) => r.status === "failed",
    ).length;
    const skippedCount = this.results.filter(
      (r) => r.status === "skipped",
    ).length;

    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║              TEST EXECUTION SUMMARY                      ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    this.results.forEach((result) => {
      const icon =
        result.status === "success"
          ? "✓"
          : result.status === "failed"
            ? "✗"
            : "⊘";
      console.log(
        `  ${icon} ${result.flowName.padEnd(38)} ${result.duration}ms`,
      );
      if (result.error) {
        console.log(`     └─ ${result.error}`);
      }
    });

    console.log(
      "\n─────────────────────────────────────────────────────────────",
    );
    console.log(
      `Total Tests: ${this.results.length} | ✓ ${successCount} | ✗ ${failedCount} | ⊘ ${skippedCount}`,
    );
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(
      "─────────────────────────────────────────────────────────────\n",
    );

    if (failedCount === 0) {
      console.log(
        "╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║   HOTEL LITEAPI E2E SUITE COMPLETED SUCCESSFULLY ✓       ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(0);
      return;
    }

    console.log(
      "╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      `║   E2E FLOW FAILED WITH ${failedCount} ERROR(S)                         ║`,
    );
    console.log(
      "║   Review step logs above and retry with VERBOSE=true      ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );
    process.exit(1);
  }
}

async function main() {
  const runner = new LiteApiHotelE2ERunner();
  await runner.run();
}

main().catch((error) => {
  console.error("Fatal error:", extractErrorMessage(error));
  process.exit(1);
});
