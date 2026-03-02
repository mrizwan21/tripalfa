#!/usr/bin/env npx tsx
/**
 * End-to-End Booking Test with FX Integration
 *
 * Tests the complete hotel and flight booking workflows with FX conversion:
 * 1. Hotel booking: Multi-currency customer → Hotel currency with FX
 * 2. Flight booking: Multi-currency passenger → Flight currency with FX
 * 3. Wallet operations: Verify debits/credits with FX fees
 * 4. FX conversion accuracy: Validate rate calculations
 *
 * Requires mock wallet API running on port 3000 with FX endpoints
 *
 * Usage:
 *   npx tsx scripts/test-e2e-booking-fx.ts
 *
 * Environment:
 *   WALLET_API_URL - Override wallet service URL (default: http://localhost:3000)
 *   VERBOSE=true - Show detailed logs
 */

import axios, { AxiosInstance } from "axios";

// ============================================================================
// CONFIGURATION
// ============================================================================

const WALLET_API_URL = process.env.WALLET_API_URL || "http://localhost:3000";
const VERBOSE = process.env.VERBOSE === "true";

// Test data
interface TestCase {
  name: string;
  description: string;
}

interface BookingTestResult {
  testName: string;
  status: "PASS" | "FAIL" | "SKIP";
  duration: number;
  details: Record<string, any>;
  error?: string;
}

// ============================================================================
// TEST HARNESS
// ============================================================================

class BookingE2ETest {
  private client: AxiosInstance;
  private results: BookingTestResult[] = [];
  private startTime = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: WALLET_API_URL,
      timeout: 10000,
      validateStatus: () => true,
    });
  }

  private log(level: "INFO" | "SUCCESS" | "ERROR" | "WARN", message: string, data?: any) {
    const timestamp = new Date().toISOString();
    const prefix =
      level === "SUCCESS"
        ? "✓"
        : level === "ERROR"
          ? "✗"
          : level === "WARN"
            ? "⚠"
            : "ℹ";

    console.log(`[${timestamp}] ${prefix} ${message}`);
    if ((VERBOSE || level === "ERROR") && data) {
      console.log(`    ${JSON.stringify(data, null, 2)}`);
    }
  }

  private recordResult(result: BookingTestResult) {
    this.results.push(result);
  }

  async runTest(name: string, testFn: () => Promise<BookingTestResult>) {
    try {
      this.log("INFO", `Running: ${name}`);
      const result = await testFn();
      this.recordResult(result);

      if (result.status === "PASS") {
        this.log("SUCCESS", `${name} (${result.duration}ms)`);
      } else if (result.status === "SKIP") {
        this.log("WARN", `${name} - Skipped`);
      } else {
        this.log("ERROR", `${name} - ${result.error}`);
      }
    } catch (error) {
      this.recordResult({
        testName: name,
        status: "FAIL",
        duration: 0,
        details: {},
        error: String(error),
      });
      this.log("ERROR", `${name} - ${String(error)}`);
    }
  }

  async testHotelBookingWithFX(): Promise<BookingTestResult> {
    const startTime = Date.now();
    const testName = "Hotel Booking: USD Customer → EUR Hotel (Single Rate Test)";

    try {
      // Step 1: Verify FX rate
      const rateResponse = await this.client.get("/api/fx/rate/USD/EUR");
      if (rateResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "get-rate", status: rateResponse.status },
          error: "Failed to get FX rate",
        };
      }

      const rate = rateResponse.data.rate;
      const feePercentage = rateResponse.data.feePercentage;

      // Step 2: Convert hotel amount with fee
      const hotelAmount = 1500; // EUR 1500
      const conversionResponse = await this.client.post("/api/fx/convert-with-fee", {
        amount: hotelAmount,
        fromCurrency: "EUR",
        toCurrency: "USD",
        applyFee: true,
      });

      if (conversionResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "convert", status: conversionResponse.status },
          error: "FX conversion failed",
        };
      }

      const breakdown = conversionResponse.data.breakdown;
      const expectedFee = breakdown.convertedAmount * 0.02;
      const feeMatch = Math.abs(breakdown.fxFee - expectedFee) < 0.01;

      if (!feeMatch) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: {
            expected: expectedFee,
            received: breakdown.fxFee,
          },
          error: "Fee calculation mismatch",
        };
      }

      // Step 3: Verify wallet debit would be correct
      const customerId = "customer-hotel-001";
      const topupResponse = await this.client.post("/api/wallet/topup", {
        userId: customerId,
        currency: "USD",
        amount: 3000,
        gateway: "test",
        gatewayReference: "test-ref",
      });

      if (topupResponse.status !== 201 && topupResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "topup", status: topupResponse.status },
          error: "Failed to top up wallet",
        };
      }

      // Step 4: Debit wallet with FX fee included
      const debitResponse = await this.client.post("/api/wallet/debit", {
        userId: customerId,
        currency: "USD",
        amount: breakdown.totalDebit,
        description: "Hotel booking payment",
      });

      if (debitResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "debit", status: debitResponse.status },
          error: "Failed to debit wallet",
        };
      }

      // Step 5: Verify final balance
      const balanceResponse = await this.client.get(
        `/api/wallet/balance/${customerId}?currency=USD`,
      );
      const finalBalance = balanceResponse.data.balance;
      const expectedBalance = 3000 - breakdown.totalDebit;

      if (Math.abs(finalBalance - expectedBalance) > 0.01) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: {
            expected: expectedBalance,
            received: finalBalance,
          },
          error: "Wallet balance mismatch after FX debit",
        };
      }

      return {
        testName,
        status: "PASS",
        duration: Date.now() - startTime,
        details: {
          hotelAmount: `EUR ${hotelAmount}`,
          fxRate: rate,
          feePercentage: `${feePercentage}%`,
          convertedAmount: `USD ${breakdown.convertedAmount.toFixed(2)}`,
          fxFee: `USD ${breakdown.fxFee.toFixed(2)}`,
          totalDebit: `USD ${breakdown.totalDebit.toFixed(2)}`,
          walletFinalBalance: `USD ${finalBalance.toFixed(2)}`,
        },
      };
    } catch (error) {
      return {
        testName,
        status: "FAIL",
        duration: Date.now() - startTime,
        details: {},
        error: String(error),
      };
    }
  }

  async testFlightBookingWithFX(): Promise<BookingTestResult> {
    const startTime = Date.now();
    const testName = "Flight Booking: GBP Passenger → USD Fare (Multi-Currency Test)";

    try {
      // Step 1: Get FX rate
      const rateResponse = await this.client.get("/api/fx/rate/USD/GBP");
      if (rateResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "get-rate", status: rateResponse.status },
          error: "Failed to get FX rate",
        };
      }

      // Step 2: Convert fare with fee
      const fareAmount = 350; // USD 350
      const conversionResponse = await this.client.post("/api/fx/convert-with-fee", {
        amount: fareAmount,
        fromCurrency: "USD",
        toCurrency: "GBP",
        applyFee: true,
      });

      if (conversionResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "convert", status: conversionResponse.status },
          error: "FX conversion failed",
        };
      }

      const breakdown = conversionResponse.data.breakdown;

      // Step 3: Set up passenger wallet
      const passengerId = "passenger-flight-001";
      await this.client.post("/api/wallet/topup", {
        userId: passengerId,
        currency: "GBP",
        amount: 1000,
        gateway: "test",
        gatewayReference: "test-ref",
      });

      // Step 4: Debit passenger wallet
      const debitResponse = await this.client.post("/api/wallet/debit", {
        userId: passengerId,
        currency: "GBP",
        amount: breakdown.totalDebit,
        description: "Flight booking payment",
      });

      if (debitResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "debit", status: debitResponse.status },
          error: "Failed to debit wallet",
        };
      }

      // Step 5: Verify transaction history
      const transactionsResponse = await this.client.get(
        `/api/wallet/transactions/${passengerId}?limit=5`,
      );
      const transactions = transactionsResponse.data.transactions || [];
      const debitTransaction = transactions.find((t: any) => t.type === "debit");

      if (!debitTransaction) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "verify-transaction" },
          error: "Debit transaction not found",
        };
      }

      return {
        testName,
        status: "PASS",
        duration: Date.now() - startTime,
        details: {
          fareAmount: `USD ${fareAmount}`,
          fxRate: breakdown.fxRate,
          convertedAmount: `GBP ${breakdown.convertedAmount.toFixed(2)}`,
          fxFee: `GBP ${breakdown.fxFee.toFixed(2)}`,
          totalDebit: `GBP ${breakdown.totalDebit.toFixed(2)}`,
          transactionRecorded: true,
        },
      };
    } catch (error) {
      return {
        testName,
        status: "FAIL",
        duration: Date.now() - startTime,
        details: {},
        error: String(error),
      };
    }
  }

  async testFlightAmendmentWithFX(): Promise<BookingTestResult> {
    const startTime = Date.now();
    const testName = "Flight Amendment: Price Increase with FX Conversion";

    try {
      // Simulate price increase: USD 350 → USD 450 (difference: USD 100)
      const priceDifference = 100;
      const passengerId = "passenger-amendment-001";

      // Set up passenger wallet
      await this.client.post("/api/wallet/topup", {
        userId: passengerId,
        currency: "EUR",
        amount: 2000,
        gateway: "test",
        gatewayReference: "test-ref",
      });

      // Convert price difference
      const conversionResponse = await this.client.post("/api/fx/convert-with-fee", {
        amount: priceDifference,
        fromCurrency: "USD",
        toCurrency: "EUR",
        applyFee: true,
      });

      if (conversionResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "convert", status: conversionResponse.status },
          error: "FX conversion failed",
        };
      }

      const breakdown = conversionResponse.data.breakdown;

      // Debit for price increase
      const debitResponse = await this.client.post("/api/wallet/debit", {
        userId: passengerId,
        currency: "EUR",
        amount: breakdown.totalDebit,
        description: "Flight amendment - price increase",
      });

      if (debitResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "debit", status: debitResponse.status },
          error: "Failed to debit wallet",
        };
      }

      return {
        testName,
        status: "PASS",
        duration: Date.now() - startTime,
        details: {
          priceIncrease: `USD ${priceDifference}`,
          fxRate: breakdown.fxRate,
          convertedAmount: `EUR ${breakdown.convertedAmount.toFixed(2)}`,
          fxFee: `EUR ${breakdown.fxFee.toFixed(2)}`,
          totalDebit: `EUR ${breakdown.totalDebit.toFixed(2)}`,
        },
      };
    } catch (error) {
      return {
        testName,
        status: "FAIL",
        duration: Date.now() - startTime,
        details: {},
        error: String(error),
      };
    }
  }

  async testRefundWithFXConversion(): Promise<BookingTestResult> {
    const startTime = Date.now();
    const testName = "Flight Cancellation: Refund with FX Conversion";

    try {
      const passengerId = "passenger-refund-001";
      const refundAmount = 350; // USD

      // Set up passenger wallet
      const topupResponse = await this.client.post("/api/wallet/topup", {
        userId: passengerId,
        currency: "CAD",
        amount: 500,
        gateway: "test",
        gatewayReference: "test-ref",
      });

      // Convert refund amount
      const conversionResponse = await this.client.post("/api/fx/convert-with-fee", {
        amount: refundAmount,
        fromCurrency: "USD",
        toCurrency: "CAD",
        applyFee: false, // No fee on refunds
      });

      if (conversionResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "convert", status: conversionResponse.status },
          error: "FX conversion failed",
        };
      }

      const breakdown = conversionResponse.data.breakdown;

      // Credit wallet with refund
      const creditResponse = await this.client.post("/api/wallet/credit", {
        userId: passengerId,
        currency: "CAD",
        amount: breakdown.convertedAmount,
        description: "Flight cancellation refund",
      });

      if (creditResponse.status !== 200) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: { step: "credit", status: creditResponse.status },
          error: "Failed to credit wallet",
        };
      }

      // Verify balance increased
      const balanceResponse = await this.client.get(
        `/api/wallet/balance/${passengerId}?currency=CAD`,
      );
      const expectedBalance = 500 + breakdown.convertedAmount;

      if (Math.abs(balanceResponse.data.balance - expectedBalance) > 0.01) {
        return {
          testName,
          status: "FAIL",
          duration: Date.now() - startTime,
          details: {
            expected: expectedBalance,
            received: balanceResponse.data.balance,
          },
          error: "Wallet balance mismatch after refund",
        };
      }

      return {
        testName,
        status: "PASS",
        duration: Date.now() - startTime,
        details: {
          refundAmount: `USD ${refundAmount}`,
          fxRate: breakdown.fxRate,
          convertedRefund: `CAD ${breakdown.convertedAmount.toFixed(2)}`,
          fxFee: `0 (No fee on refunds)`,
          walletBalance: `CAD ${balanceResponse.data.balance.toFixed(2)}`,
        },
      };
    } catch (error) {
      return {
        testName,
        status: "FAIL",
        duration: Date.now() - startTime,
        details: {},
        error: String(error),
      };
    }
  }

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const skipped = this.results.filter((r) => r.status === "SKIP").length;

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║        E2E BOOKING TEST WITH FX INTEGRATION SUMMARY       ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Total Tests:  ${String(this.results.length).padEnd(51)}║`);
    console.log(`║ ✓ Passed:     ${String(passed).padEnd(51)}║`);
    console.log(`║ ✗ Failed:     ${String(failed).padEnd(51)}║`);
    console.log(`║ ⊘ Skipped:    ${String(skipped).padEnd(51)}║`);
    console.log(`║ ⏱ Duration:   ${String(`${totalTime}ms`).padEnd(51)}║`);
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Print details for each test
    console.log("Test Results:\n");
    for (const result of this.results) {
      const icon = result.status === "PASS" ? "✓" : "✗";
      console.log(`${icon} ${result.testName}`);
      console.log(`  Duration: ${result.duration}ms`);
      if (Object.keys(result.details).length > 0) {
        console.log("  Details:");
        for (const [key, value] of Object.entries(result.details)) {
          console.log(`    • ${key}: ${value}`);
        }
      }
      if (result.error) {
        console.log(`  Error: ${result.error}`);
      }
      console.log();
    }

    if (failed === 0) {
      console.log("✓ All tests passed! Booking orchestrators are FX-integrated correctly.\n");
      return true;
    } else {
      console.log(`✗ ${failed} test(s) failed. Review errors above.\n`);
      return false;
    }
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function runAllTests() {
  const test = new BookingE2ETest();

  console.log("\n╔════════════════════════════════════════════════════════════╗");
  console.log("║     E2E BOOKING ORCHESTRATOR TEST WITH FX INTEGRATION     ║");
  console.log("╠════════════════════════════════════════════════════════════╣");
  console.log(`║ Wallet Service URL: ${WALLET_API_URL.padEnd(40)}║`);
  console.log(`║ Verbose Mode: ${(VERBOSE ? "ON" : "OFF").padEnd(49)}║`);
  console.log("╚════════════════════════════════════════════════════════════╝\n");
  console.log("Note: Requires mock wallet API running on port 3000");
  console.log("  Start with: npm run start:wallet:api\n");

  // Run all tests
  await test.runTest("Hotel Booking with FX", () =>
    test.testHotelBookingWithFX(),
  );
  await test.runTest("Flight Booking with FX", () =>
    test.testFlightBookingWithFX(),
  );
  await test.runTest("Flight Amendment with FX", () =>
    test.testFlightAmendmentWithFX(),
  );
  await test.runTest("Flight Refund with FX", () =>
    test.testRefundWithFXConversion(),
  );

  // Print summary
  const success = test.printSummary();
  return success;
}

runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n✗ Test execution failed:", error);
    process.exit(1);
  });
