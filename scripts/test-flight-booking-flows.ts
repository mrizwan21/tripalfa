#!/usr/bin/env npx tsx
/**
 * Comprehensive Flight Booking Flows Test Runner
 *
 * Tests complete booking workflows:
 * 1. Basic booking flow (search → hold → payment)
 * 2. Wallet payment confirmation flow
 * 3. Cancellation & refund flow
 * 4. Flight amendment & reissue flow
 *
 * Usage: npx tsx scripts/test-flight-booking-flows.ts
 */

import {
  DuffelFlightIntegrationTests,
  type TestConfig,
} from "../apps/booking-engine/tests/api-integration/duffel-flight-integration.test.js";

// ============================================================================
// CONFIGURATION
// ============================================================================

const TEST_CONFIG: TestConfig = {
  apiBaseUrl:
    process.env.API_BASE_URL ||
    process.env.API_GATEWAY_URL ||
    process.env.BOOKING_SERVICE_API_URL ||
    "http://localhost:3001/api",
  duffelApiUrl: process.env.DUFFEL_API_URL || "https://api.duffel.com",
  duffelToken: process.env.DUFFEL_API_KEY,
  testMode: true,
  requestTimeoutMs: Number(process.env.DUFFEL_TEST_TIMEOUT_MS || 90000),
};

// ============================================================================
// TEST RUNNER
// ============================================================================

interface FlowTestResult {
  flowName: string;
  status: "success" | "failed" | "skipped";
  duration: number;
  error?: string;
  data?: any;
}

class FlightBookingFlowTestRunner {
  private tester: DuffelFlightIntegrationTests;
  private results: FlowTestResult[] = [];
  private startTime: number = 0;

  constructor(config: TestConfig) {
    this.tester = new DuffelFlightIntegrationTests(config);
  }

  /**
   * Run all booking flow tests
   */
  async runAllFlows(): Promise<void> {
    console.clear();
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     COMPREHENSIVE FLIGHT BOOKING FLOWS TEST SUITE          ║",
    );
    console.log(
      "║                                                           ║",
    );
    console.log(
      "║  Testing:                                                 ║",
    );
    console.log(
      "║  1. Basic Booking Flow (Hold → Payment)                   ║",
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

    this.startTime = Date.now();

    // Test 1: Basic booking flow
    await this.runFlow("Basic Booking Flow", () =>
      this.tester.testCompleteBookingFlow(),
    );

    // Test 2: Wallet payment flow
    await this.runFlow("Wallet Payment Confirmation", () =>
      this.tester.testWalletPaymentFlow(),
    );

    // Test 3: Cancellation & refund flow
    await this.runFlow("Cancellation & Refund", () =>
      this.tester.testCancellationAndRefundFlow(),
    );

    // Test 4: Flight amendment
    await this.runFlow("Flight Amendment & Reissue", () =>
      this.tester.testFlightAmendmentFlow(),
    );

    // Print summary
    await this.printSummary();
  }

  /**
   * Run a single flow test
   */
  private async runFlow(
    flowName: string,
    testFn: () => Promise<any>,
  ): Promise<void> {
    const flowStartTime = Date.now();
    let result: FlowTestResult = {
      flowName,
      status: "skipped",
      duration: 0,
    };

    try {
      console.log(`\n➤ Running: ${flowName}...`);

      const data = await testFn();
      const duration = Date.now() - flowStartTime;

      result = {
        flowName,
        status: "success",
        duration,
        data,
      };

      console.log(`   ✓ ${flowName} completed in ${duration}ms\n`);
    } catch (error: any) {
      const duration = Date.now() - flowStartTime;

      result = {
        flowName,
        status: "failed",
        duration,
        error: error.message || String(error),
      };

      // Don't throw - let all flows run
      console.log(`   ✗ ${flowName} failed after ${duration}ms`);
      console.log(`   Error: ${result.error}\n`);
    }

    this.results.push(result);
  }

  /**
   * Print test summary
   */
  private async printSummary(): Promise<void> {
    const totalDuration = Date.now() - this.startTime;
    const successCount = this.results.filter(
      (r) => r.status === "success",
    ).length;
    const failedCount = this.results.filter(
      (r) => r.status === "failed",
    ).length;
    const skipCount = this.results.filter((r) => r.status === "skipped").length;

    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║              TEST EXECUTION SUMMARY                      ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    console.log("Flow Results:");
    this.results.forEach((result) => {
      const statusIcon =
        result.status === "success"
          ? "✓"
          : result.status === "failed"
            ? "✗"
            : "⊘";
      const statusColor =
        result.status === "success"
          ? "\x1b[32m"
          : result.status === "failed"
            ? "\x1b[31m"
            : "\x1b[33m";
      const resetColor = "\x1b[0m";

      console.log(
        `  ${statusColor}${statusIcon}${resetColor} ${result.flowName.padEnd(40)} ${result.duration}ms`,
      );

      if (result.error) {
        console.log(`     └─ ${result.error}`);
      }
    });

    console.log("\n" + "─".repeat(61));
    console.log(
      `Total Tests: ${this.results.length} | ✓ ${successCount} | ✗ ${failedCount} | ⊘ ${skipCount}`,
    );
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log("─".repeat(61));

    if (failedCount === 0 && successCount > 0) {
      console.log(
        "\n╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║     ALL BOOKING FLOW TESTS PASSED SUCCESSFULLY ✓          ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
    } else if (failedCount > 0) {
      console.log(
        "\n╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        `║     SOME TESTS FAILED (${failedCount} failures)                      ║`,
      );
      console.log(
        "║     Check the logs above for details                     ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
    }

    // Print detailed results for debugging
    if (process.env.VERBOSE === "true" || process.env.DEBUG === "true") {
      console.log("\n" + "═".repeat(61));
      console.log("DETAILED RESULTS");
      console.log("═".repeat(61) + "\n");

      this.results.forEach((result, index) => {
        console.log(`\n[${index + 1}] ${result.flowName}`);
        console.log(`    Status: ${result.status}`);
        console.log(`    Duration: ${result.duration}ms`);

        if (result.data) {
          console.log("    Data:");
          console.log(JSON.stringify(result.data, null, 6));
        }

        if (result.error) {
          console.log(`    Error: ${result.error}`);
        }
      });
    }

    // Exit with appropriate code
    process.exit(failedCount > 0 ? 1 : 0);
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  try {
    const runner = new FlightBookingFlowTestRunner(TEST_CONFIG);
    await runner.runAllFlows();
  } catch (error) {
    console.error("\nFatal error:", error);
    process.exit(1);
  }
}

main();
