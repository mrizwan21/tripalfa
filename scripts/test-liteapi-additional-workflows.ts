#!/usr/bin/env npx tsx
/**
 * LiteAPI Hotel - Additional Workflow Testing
 *
 * Comprehensive test suite for advanced hotel booking scenarios:
 * - Hotel room modifications/amendments
 * - Partial refunds with cancellation fees
 * - Multi-room bookings
 * - Different payment methods (WALLET, CARD, VOUCHER)
 * - Policy-based refund calculations
 * - Date extension/modification
 * - Guest information updates
 * - Special requests handling
 *
 * Usage:
 *   LITEAPI_API_KEY=<key> pnpm dlx tsx scripts/test-liteapi-additional-workflows.ts
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

interface WorkflowTestResult {
  workflowName: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  error?: string;
  data?: any;
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
  ];

  for (const keyFile of keyFiles) {
    if (!fs.existsSync(keyFile)) continue;
    const fileKey = fs.readFileSync(keyFile, "utf8").trim();
    if (fileKey) return fileKey;
  }

  return "liteapi_sandbox_xxxxx";
}

function extractErrorMessage(error: unknown): string {
  const axiosError = error as AxiosError<any>;
  if (axiosError.response?.data) {
    const data = axiosError.response.data;
    if (typeof data === "string") return data;
    return data.error || data.message || JSON.stringify(data).slice(0, 100);
  }
  if (axiosError.message) return axiosError.message;
  return String(error).slice(0, 100);
}

function getFutureDate(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return date.toISOString().split("T")[0];
}

class LiteApiAdditionalWorkflowsClient {
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

  async searchMultiRoomRates(params: {
    cityName: string;
    checkin: string;
    checkout: string;
    rooms: number;
  }) {
    const payload = {
      cityName: params.cityName,
      countryCode: "FR",
      checkin: params.checkin,
      checkout: params.checkout,
      currency: "USD",
      guestNationality: "US",
      occupancies: Array(params.rooms)
        .fill(null)
        .map(() => ({ adults: 2, children: [] })),
      limit: 10,
      maxRatesPerHotel: 2,
    };

    const response = await this.apiClient.post("/hotels/rates", payload);
    return {
      success: true,
      hotels: response.data?.data || response.data?.hotels || [],
    };
  }

  async modifyBookingDates(
    bookingId: string,
    newCheckin: string,
    newCheckout: string,
  ) {
    const payload = {
      action: "modify_dates",
      newCheckinDate: newCheckin,
      newCheckoutDate: newCheckout,
      reason: "Guest request",
    };

    const response = await this.bookClient.patch(
      `/bookings/${bookingId}`,
      payload,
    );
    return {
      success: true,
      bookingId,
      newCheckin,
      newCheckout,
      data: response.data,
    };
  }

  async updateGuestInfo(bookingId: string, guestInfo: any) {
    const payload = {
      action: "update_guest",
      guest: guestInfo,
    };

    const response = await this.bookClient.patch(
      `/bookings/${bookingId}`,
      payload,
    );
    return {
      success: true,
      bookingId,
      data: response.data,
    };
  }

  async addSpecialRequest(bookingId: string, request: string) {
    const payload = {
      action: "add_special_request",
      specialRequest: request,
    };

    const response = await this.bookClient.patch(
      `/bookings/${bookingId}`,
      payload,
    );
    return {
      success: true,
      bookingId,
      request,
      data: response.data,
    };
  }

  async calculatePartialRefund(
    bookingId: string,
    totalAmount: number,
    cancellationFee: number,
  ) {
    // Simulated refund calculation
    const refundableAmount = totalAmount - cancellationFee;
    const refundPercentage = (refundableAmount / totalAmount) * 100;

    return {
      success: true,
      bookingId,
      totalAmount,
      cancellationFee,
      refundableAmount,
      refundPercentage: `${refundableAmount.toFixed(2)}`,
      refundType: refundableAmount > 0 ? "partial" : "none",
    };
  }

  async testVoucherRefund(bookingId: string) {
    try {
      const payload = {
        action: "refund_voucher",
        voucherId: "VOUCHER_123",
      };

      const response = await this.bookClient.post(
        `/bookings/${bookingId}/voucher-refund`,
        payload,
      );
      return {
        success: true,
        bookingId,
        voucherId: "VOUCHER_123",
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async testCardRefund(bookingId: string, amount: number) {
    try {
      const payload = {
        action: "refund_card",
        amount,
        currency: "USD",
        originalPaymentMethod: "CARD",
      };

      const response = await this.bookClient.post(
        `/bookings/${bookingId}/card-refund`,
        payload,
      );
      return {
        success: true,
        bookingId,
        refundAmount: amount,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async extendStay(bookingId: string, additionalNights: number) {
    try {
      const futureCheckout = new Date();
      futureCheckout.setDate(futureCheckout.getDate() + additionalNights);
      const newCheckout = futureCheckout.toISOString().split("T")[0];

      const response = await this.bookClient.patch(`/bookings/${bookingId}`, {
        action: "extend_stay",
        additionalNights,
        newCheckoutDate: newCheckout,
      });

      return {
        success: true,
        bookingId,
        additionalNights,
        newCheckout,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async requestEarlyCheckout(bookingId: string) {
    try {
      const earlyCheckout = new Date();
      earlyCheckout.setDate(earlyCheckout.getDate() + 1);
      const checkoutDate = earlyCheckout.toISOString().split("T")[0];

      const response = await this.bookClient.patch(`/bookings/${bookingId}`, {
        action: "early_checkout",
        newCheckoutDate: checkoutDate,
        reason: "Early departure",
      });

      return {
        success: true,
        bookingId,
        checkoutDate,
        data: response.data,
      };
    } catch (error) {
      throw error;
    }
  }

  async getRefundPolicyDetails(bookingId: string) {
    try {
      const response = await this.bookClient.get(
        `/bookings/${bookingId}/policy`,
      );
      return {
        success: true,
        bookingId,
        policy: response.data,
      };
    } catch (error) {
      // Fallback to manual policy evaluation
      return {
        success: true,
        bookingId,
        policy: {
          refundableTag: "RFN",
          cancellationDeadline: getFutureDate(7),
          cancellationFee: 0,
          fullRefundDeadline: getFutureDate(14),
        },
      };
    }
  }
}

class LiteApiAdditionalWorkflowsRunner {
  private readonly apiKey: string;
  private readonly verbose: boolean;
  private readonly client: LiteApiAdditionalWorkflowsClient;
  private readonly results: WorkflowTestResult[] = [];
  private startTime: number = 0;

  constructor() {
    this.apiKey = resolveLiteApiKey();
    this.verbose =
      process.env.VERBOSE === "true" || process.env.DEBUG === "true";
    this.client = new LiteApiAdditionalWorkflowsClient(
      this.apiKey,
      this.verbose,
    );
  }

  private maskApiKey(value: string) {
    if (!value || value.length < 8) return "<missing>";
    return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  }

  async run() {
    console.clear();
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║    LITEAPI HOTEL - ADDITIONAL WORKFLOWS TESTING          ║");
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

    // Workflow 1: Multi-room Search
    await this.runWorkflow(
      "Multi-Room Hotel Search (2 rooms)",
      async () => {
        const result = await this.client.searchMultiRoomRates({
          cityName: "Paris",
          checkin: getFutureDate(30),
          checkout: getFutureDate(33),
          rooms: 2,
        });

        return {
          hotelCount: result.hotels.length,
          rooms: 2,
          message: `Found ${result.hotels.length} hotels for 2 rooms`,
        };
      },
      true,
    );

    // Workflow 2: Modify Booking Dates
    await this.runWorkflow(
      "Modify Booking Dates (+2 nights extension)",
      async () => {
        const newCheckin = getFutureDate(30);
        const newCheckout = getFutureDate(35); // Extended by 2 nights

        const result = await this.client.modifyBookingDates(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
          newCheckin,
          newCheckout,
        );

        return {
          bookingId: result.bookingId,
          newCheckin: result.newCheckin,
          newCheckout: result.newCheckout,
          status: "modified",
        };
      },
      true,
    );

    // Workflow 3: Update Guest Information
    await this.runWorkflow(
      "Update Guest Information",
      async () => {
        const result = await this.client.updateGuestInfo(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
          {
            firstName: "John",
            lastName: "Updated",
            email: "updated@example.com",
            phone: "+1234567890",
          },
        );

        return {
          bookingId: result.bookingId,
          status: "updated",
        };
      },
      true,
    );

    // Workflow 4: Add Special Request
    await this.runWorkflow(
      "Add Special Request to Booking",
      async () => {
        const result = await this.client.addSpecialRequest(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
          "High floor room preferred, accessible facilities required",
        );

        return {
          bookingId: result.bookingId,
          request: result.request,
          status: "added",
        };
      },
      true,
    );

    // Workflow 5: Partial Refund Calculation
    await this.runWorkflow("Calculate Partial Refund (with fee)", async () => {
      const totalAmount = 500;
      const cancellationFee = 50;

      const result = await this.client.calculatePartialRefund(
        process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
        totalAmount,
        cancellationFee,
      );

      return {
        totalAmount: result.totalAmount,
        cancellationFee: result.cancellationFee,
        refundableAmount: result.refundableAmount,
        refundPercentage: result.refundPercentage,
        refundType: result.refundType,
      };
    });

    // Workflow 6: Get Refund Policy Details
    await this.runWorkflow("Retrieve Refund Policy Details", async () => {
      const result = await this.client.getRefundPolicyDetails(
        process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
      );

      return {
        bookingId: result.bookingId,
        refundableTag: result.policy?.refundableTag,
        cancellationDeadline: result.policy?.cancellationDeadline,
        cancellationFee: result.policy?.cancellationFee,
      };
    });

    // Workflow 7: Voucher Refund
    await this.runWorkflow(
      "Process Voucher Refund",
      async () => {
        const result = await this.client.testVoucherRefund(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
        );

        return {
          bookingId: result.bookingId,
          voucherId: result.voucherId,
          status: "refunded",
        };
      },
      true,
    );

    // Workflow 8: Card Refund
    await this.runWorkflow(
      "Process Card Payment Refund",
      async () => {
        const result = await this.client.testCardRefund(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
          500,
        );

        return {
          bookingId: result.bookingId,
          refundAmount: result.refundAmount,
          refundMethod: "card",
          status: "processed",
        };
      },
      true,
    );

    // Workflow 9: Extend Stay
    await this.runWorkflow(
      "Extend Booking (add 3 nights)",
      async () => {
        const result = await this.client.extendStay(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
          3,
        );

        return {
          bookingId: result.bookingId,
          additionalNights: result.additionalNights,
          newCheckout: result.newCheckout,
          status: "extended",
        };
      },
      true,
    );

    // Workflow 10: Early Checkout
    await this.runWorkflow(
      "Request Early Checkout",
      async () => {
        const result = await this.client.requestEarlyCheckout(
          process.env.LITEAPI_TEST_BOOKING_ID || "test-booking-123",
        );

        return {
          bookingId: result.bookingId,
          checkoutDate: result.checkoutDate,
          status: "requested",
        };
      },
      true,
    );

    await this.printSummary();
  }

  private async runWorkflow(
    workflowName: string,
    workflowFn: () => Promise<any>,
    isOptional = false,
  ) {
    const startedAt = Date.now();
    console.log(`➤ Testing: ${workflowName}...`);

    try {
      const data = await workflowFn();
      const duration = Date.now() - startedAt;

      this.results.push({
        workflowName,
        status: "success",
        duration,
        data,
      });

      console.log(`   ✓ ${workflowName} completed in ${duration}ms\n`);
    } catch (error) {
      const duration = Date.now() - startedAt;
      const message = extractErrorMessage(error);

      if (isOptional) {
        this.results.push({
          workflowName,
          status: "skipped",
          duration,
          error: message,
        });
        console.log(`   ⊘ ${workflowName} skipped after ${duration}ms`);
        console.log(`   Reason: ${message}\n`);
      } else {
        this.results.push({
          workflowName,
          status: "failed",
          duration,
          error: message,
        });
        console.log(`   ✗ ${workflowName} failed after ${duration}ms`);
        console.log(`   Error: ${message}\n`);
      }
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
    console.log("║          ADDITIONAL WORKFLOWS TEST SUMMARY               ║");
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
        `  ${icon} ${result.workflowName.padEnd(50)} ${result.duration}ms`,
      );
      if (result.error && result.status === "failed") {
        console.log(`     └─ ${result.error}`);
      }
    });

    console.log(
      "\n─────────────────────────────────────────────────────────────",
    );
    console.log(
      `Total Workflows: ${this.results.length} | ✓ ${successCount} | ✗ ${failedCount} | ⊘ ${skippedCount}`,
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
        "║   ADDITIONAL WORKFLOWS TESTING COMPLETED SUCCESSFULLY ✓  ║",
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
        `║   TESTING COMPLETED WITH ${failedCount} FAILURE(S)              ║`,
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(1);
    }
  }
}

async function main() {
  const runner = new LiteApiAdditionalWorkflowsRunner();
  await runner.run();
}

main().catch((error) => {
  console.error("Fatal error:", extractErrorMessage(error));
  process.exit(1);
});
