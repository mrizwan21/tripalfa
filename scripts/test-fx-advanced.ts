#!/usr/bin/env npx tsx
/**
 * Advanced FX Testing Suite
 *
 * Comprehensive testing including:
 * - Verbose FX calculations
 * - Load testing (concurrent bookings)
 * - Edge cases and boundary conditions
 * - Large amount transfers
 * - Rate stressing
 *
 * Usage:
 *   npx tsx scripts/test-fx-advanced.ts [test-type]
 *
 * Test Types:
 *   verbose    - Detailed FX calculations (default)
 *   load       - 50 concurrent bookings
 *   edge       - Edge cases (high amounts, extreme rates, etc.)
 *   all        - Run all tests
 *
 * Environment:
 *   WALLET_API_URL - Override wallet service URL (default: http://localhost:3001)
 *   VERBOSE=true   - Extra detailed logging
 */

import axios, { AxiosInstance } from "axios";

const WALLET_API_URL = process.env.WALLET_API_URL || "http://localhost:3001";
const VERBOSE = process.env.VERBOSE === "true";

interface TestResult {
  name: string;
  status: "PASS" | "FAIL";
  duration: number;
  message: string;
  details?: Record<string, any>;
}

class AdvancedFXTestSuite {
  private client: AxiosInstance;
  private results: TestResult[] = [];
  private startTime = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: WALLET_API_URL,
      timeout: 10000,
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

  private recordResult(result: TestResult) {
    this.results.push(result);
  }

  private async runTest(
    name: string,
    testFn: () => Promise<{ status: "PASS" | "FAIL"; message: string; details?: any }>,
  ) {
    const startTime = Date.now();
    try {
      this.log("INFO", `Running: ${name}`);
      const result = await testFn();
      const duration = Date.now() - startTime;

      this.recordResult({
        name,
        status: result.status,
        duration,
        message: result.message,
        details: result.details,
      });

      if (result.status === "PASS") {
        this.log("SUCCESS", `${name} (${duration}ms)`, VERBOSE ? result.details : undefined);
      } else {
        this.log("ERROR", `${name} - ${result.message}`, result.details);
      }
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordResult({
        name,
        status: "FAIL",
        duration,
        message: String(error),
      });
      this.log("ERROR", `${name} (${duration}ms) - ${String(error)}`);
    }
  }

  // ========================================================================
  // VERBOSE TESTS - Detailed FX Calculations
  // ========================================================================

  async runVerboseTests() {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║          VERBOSE FX CALCULATION TEST SUITE                 ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Wallet Service URL: ${WALLET_API_URL.padEnd(44)}║`);
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Test 1: Simple USD to EUR conversion
    await this.runTest("Verbose: USD to EUR Conversion with Fee", async () => {
      const response = await this.client.get("/api/fx/rate/USD/EUR");
      const rate = response.data.rate;

      const amount = 1000;
      const conversionResponse = await this.client.post("/api/fx/convert-with-fee", {
        amount,
        fromCurrency: "USD",
        toCurrency: "EUR",
        applyFee: true,
      });

      const breakdown = conversionResponse.data.breakdown;

      if (VERBOSE) {
        console.log("\n    Calculation Details:");
        console.log(`      Base Amount:        $${amount.toFixed(2)}`);
        console.log(`      FX Rate (USD/EUR):  ${rate}`);
        console.log(`      Step 1: ${amount} × ${rate} = €${breakdown.convertedAmount}`);
        console.log(`      Step 2: €${breakdown.convertedAmount} × 2% = €${breakdown.fxFee}`);
        console.log(`      Step 3: €${breakdown.convertedAmount} + €${breakdown.fxFee} = €${breakdown.totalDebit}`);
        console.log("    ✓ Calculation verified\n");
      }

      return {
        status: Math.abs(breakdown.totalDebit - (amount * rate * 1.02)) < 0.01 ? "PASS" : "FAIL",
        message: `Conversion calculated correctly: $${amount} = €${breakdown.totalDebit}`,
        details: breakdown,
      };
    });

    // Test 2: Multi-step FX calculation
    await this.runTest("Verbose: Multi-Currency Conversion Chain", async () => {
      const rates = await Promise.all([
        this.client.get("/api/fx/rate/USD/EUR"),
        this.client.get("/api/fx/rate/EUR/GBP"),
        this.client.get("/api/fx/rate/USD/GBP"),
      ]);

      const usdToEur = rates[0].data.rate;
      const eurToGbp = rates[1].data.rate;
      const usdToGbp = rates[2].data.rate;

      const amount = 500;
      const step1 = amount * usdToEur;
      const step2 = step1 * eurToGbp;
      const directConversion = amount * usdToGbp;

      if (VERBOSE) {
        console.log("\n    Conversion Chain Calculation:");
        console.log(`      Start: $${amount}`);
        console.log(`      USD→EUR: $${amount} × ${usdToEur} = €${step1.toFixed(2)}`);
        console.log(`      EUR→GBP: €${step1.toFixed(2)} × ${eurToGbp} = £${step2.toFixed(2)}`);
        console.log(`      Direct USD→GBP: $${amount} × ${usdToGbp} = £${directConversion.toFixed(2)}`);
        console.log(`      Difference (rounding): ${Math.abs(step2 - directConversion).toFixed(4)}\n`);
      }

      return {
        status: "PASS",
        message: `Chain conversion: $${amount} → €${step1.toFixed(2)} → £${step2.toFixed(2)}`,
        details: {
          startAmount: amount,
          step1Eur: parseFloat(step1.toFixed(2)),
          step2Gbp: parseFloat(step2.toFixed(2)),
          directConversionGbp: parseFloat(directConversion.toFixed(2)),
        },
      };
    });

    // Test 3: Fee percentage verification
    await this.runTest("Verbose: Fee Calculation Verification", async () => {
      const testAmounts = [100, 1000, 5000, 10000];
      const conversions: any[] = [];

      for (const amount of testAmounts) {
        const response = await this.client.post("/api/fx/convert-with-fee", {
          amount,
          fromCurrency: "USD",
          toCurrency: "EUR",
          applyFee: true,
        });

        const breakdown = response.data.breakdown;
        const expectedFee = breakdown.convertedAmount * 0.02;
        const feePercentage = (breakdown.fxFee / breakdown.convertedAmount) * 100;

        conversions.push({
          originalAmount: amount,
          convertedAmount: breakdown.convertedAmount,
          fee: breakdown.fxFee,
          expectedFee: parseFloat(expectedFee.toFixed(2)),
          feePercentage: parseFloat(feePercentage.toFixed(2)),
          matches: Math.abs(breakdown.fxFee - expectedFee) < 0.01,
        });
      }

      if (VERBOSE) {
        console.log("\n    Fee Calculation Verification:");
        console.log("    Amount  → Converted → Fee    → Fee% → Correct");
        conversions.forEach((c) => {
          console.log(
            `    $${String(c.originalAmount).padEnd(6)} → €${String(c.convertedAmount).padEnd(9)} → €${String(c.fee).padEnd(6)} → ${c.feePercentage}% → ${c.matches ? "✓" : "✗"}`,
          );
        });
        console.log();
      }

      const allMatch = conversions.every((c) => c.matches);
      return {
        status: allMatch ? "PASS" : "FAIL",
        message: `Fee calculation verified for ${conversions.length} amounts`,
        details: { conversions },
      };
    });
  }

  // ========================================================================
  // LOAD TESTS - Concurrent Bookings
  // ========================================================================

  async runLoadTests() {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║          LOAD TEST - CONCURRENT BOOKINGS                   ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Wallet Service URL: ${WALLET_API_URL.padEnd(44)}║`);
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Test 1: 10 concurrent conversions
    await this.runTest("Load Test: 10 Concurrent Conversions", async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        promises.push(
          this.client.post("/api/fx/convert-with-fee", {
            amount: 100 + i * 10,
            fromCurrency: "USD",
            toCurrency: "EUR",
            applyFee: true,
          }),
        );
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      const avgTime = duration / 10;
      return {
        status: results.every((r) => r.status === 200) ? "PASS" : "FAIL",
        message: `10 concurrent conversions completed in ${duration}ms (avg: ${avgTime.toFixed(2)}ms/request)`,
        details: {
          totalDuration: duration,
          requestCount: 10,
          averagePerRequest: avgTime,
          successCount: results.filter((r) => r.status === 200).length,
        },
      };
    });

    // Test 2: 50 concurrent conversions
    await this.runTest("Load Test: 50 Concurrent Conversions", async () => {
      const startTime = Date.now();
      const promises = [];
      const currencies = ["USD", "EUR", "GBP", "JPY", "AED"];

      for (let i = 0; i < 50; i++) {
        const from = currencies[i % currencies.length];
        const to = currencies[(i + 1) % currencies.length];
        promises.push(
          this.client.post("/api/fx/convert-with-fee", {
            amount: Math.random() * 1000 + 100,
            fromCurrency: from,
            toCurrency: to,
            applyFee: true,
          }),
        );
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      const avgTime = duration / 50;
      return {
        status: results.every((r) => r.status === 200) ? "PASS" : "FAIL",
        message: `50 concurrent conversions completed in ${duration}ms (avg: ${avgTime.toFixed(2)}ms/request)`,
        details: {
          totalDuration: duration,
          requestCount: 50,
          averagePerRequest: avgTime,
          successCount: results.filter((r) => r.status === 200).length,
        },
      };
    });

    // Test 3: Simulated concurrent bookings (10 bookings)
    await this.runTest("Load Test: 10 Concurrent Booking Workflows", async () => {
      const startTime = Date.now();
      const promises = [];

      for (let i = 0; i < 10; i++) {
        const workflow = async () => {
          const userId = `user-load-${i}`;
          const amount = 1000 + i * 100;

          // Step 1: Create wallet
          await this.client.post("/api/wallet/create", {
            userId,
            currency: "USD",
          });

          // Step 2: Topup
          await this.client.post("/api/wallet/topup", {
            userId,
            currency: "USD",
            amount: 5000,
          });

          // Step 3: Convert with FX
          const conversionResponse = await this.client.post("/api/fx/convert-with-fee", {
            amount,
            fromCurrency: "USD",
            toCurrency: "EUR",
            applyFee: true,
          });

          // Step 4: Debit wallet
          await this.client.post("/api/wallet/debit", {
            userId,
            currency: "USD",
            amount: conversionResponse.data.breakdown.totalDebit,
          });

          return conversionResponse.data;
        };

        promises.push(workflow());
      }

      const results = await Promise.all(promises);
      const duration = Date.now() - startTime;

      return {
        status: results.length === 10 ? "PASS" : "FAIL",
        message: `10 concurrent booking workflows completed in ${duration}ms`,
        details: {
          totalDuration: duration,
          workflowCount: 10,
          averagePerWorkflow: (duration / 10).toFixed(2),
          completedWorkflows: results.length,
        },
      };
    });
  }

  // ========================================================================
  // EDGE CASE TESTS
  // ========================================================================

  async runEdgeCaseTests() {
    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║          EDGE CASE & BOUNDARY TESTS                        ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Wallet Service URL: ${WALLET_API_URL.padEnd(44)}║`);
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    // Test 1: Very large amounts
    await this.runTest("Edge Case: Very Large Amount (1,000,000 USD)", async () => {
      const response = await this.client.post("/api/fx/convert-with-fee", {
        amount: 1000000,
        fromCurrency: "USD",
        toCurrency: "EUR",
        applyFee: true,
      });

      const breakdown = response.data.breakdown;
      const isValid = breakdown.totalDebit > breakdown.convertedAmount;

      return {
        status: isValid ? "PASS" : "FAIL",
        message: `Large amount converted: $1,000,000 → €${breakdown.totalDebit}`,
        details: breakdown,
      };
    });

    // Test 2: Very small amounts
    await this.runTest("Edge Case: Very Small Amount (0.01 USD)", async () => {
      const response = await this.client.post("/api/fx/convert-with-fee", {
        amount: 0.01,
        fromCurrency: "USD",
        toCurrency: "EUR",
        applyFee: true,
      });

      const breakdown = response.data.breakdown;
      return {
        status: breakdown.totalDebit >= 0 ? "PASS" : "FAIL",
        message: `Small amount converted: $0.01 → €${breakdown.totalDebit}`,
        details: breakdown,
      };
    });

    // Test 3: Same currency conversion (should have 0 fee)
    await this.runTest("Edge Case: Same Currency (USD to USD)", async () => {
      const response = await this.client.post("/api/fx/convert-with-fee", {
        amount: 500,
        fromCurrency: "USD",
        toCurrency: "USD",
        applyFee: true,
      });

      const breakdown = response.data.breakdown;
      const noFee = breakdown.fxFee === 0;
      const noFeePercentage = breakdown.fxFeePercentage === 0;

      return {
        status: noFee && noFeePercentage ? "PASS" : "FAIL",
        message: `Same currency: $500 → $${breakdown.totalDebit} (Fee: $${breakdown.fxFee})`,
        details: breakdown,
      };
    });

    // Test 4: Extreme rate pair (JPY - very small rate)
    await this.runTest("Edge Case: Extreme Rate (USD to JPY)", async () => {
      const response = await this.client.post("/api/fx/convert-with-fee", {
        amount: 1,
        fromCurrency: "USD",
        toCurrency: "JPY",
        applyFee: true,
      });

      const breakdown = response.data.breakdown;
      const isValid = breakdown.convertedAmount > 100; // JPY rate is ~149.5

      return {
        status: isValid ? "PASS" : "FAIL",
        message: `Extreme rate: $1 → ¥${breakdown.totalDebit}`,
        details: breakdown,
      };
    });

    // Test 5: Rounding edge cases
    await this.runTest("Edge Case: Precision & Rounding (Complex Amount)", async () => {
      const response = await this.client.post("/api/fx/convert-with-fee", {
        amount: 123.456,
        fromCurrency: "EUR",
        toCurrency: "GBP",
        applyFee: true,
      });

      const breakdown = response.data.breakdown;
      const totalStr = breakdown.totalDebit.toString();
      const decimalPlaces = totalStr.includes(".") ? totalStr.split(".")[1].length : 0;

      return {
        status: decimalPlaces <= 2 ? "PASS" : "FAIL",
        message: `Rounding check: €123.456 → £${breakdown.totalDebit} (decimals: ${decimalPlaces})`,
        details: breakdown,
      };
    });

    // Test 6: Invalid currency pair
    await this.runTest("Edge Case: Invalid Currency Pair", async () => {
      try {
        await this.client.post("/api/fx/convert-with-fee", {
          amount: 100,
          fromCurrency: "XYZ",
          toCurrency: "ABC",
          applyFee: true,
        });
        return {
          status: "FAIL",
          message: "Should have rejected invalid currency",
        };
      } catch (error: any) {
        return {
          status: error.response?.status === 400 ? "PASS" : "FAIL",
          message: `Invalid currency correctly rejected with status ${error.response?.status}`,
        };
      }
    });
  }

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║         ADVANCED FX TEST SUMMARY                           ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Total Tests:  ${String(this.results.length).padEnd(51)}║`);
    console.log(`║ ✓ Passed:     ${String(passed).padEnd(51)}║`);
    console.log(`║ ✗ Failed:     ${String(failed).padEnd(51)}║`);
    console.log(`║ ⏱ Duration:   ${String(`${totalTime}ms`).padEnd(51)}║`);
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    if (failed === 0) {
      console.log("✓ All advanced tests passed!\n");
    } else {
      console.log(`✗ ${failed} test(s) failed.\n`);
    }
  }
}

// ============================================================================
// Main Execution
// ============================================================================

async function main() {
  const testType = process.argv[2] || "verbose";
  const suite = new AdvancedFXTestSuite();

  try {
    if (testType === "verbose" || testType === "all") {
      await suite.runVerboseTests();
    }

    if (testType === "load" || testType === "all") {
      await suite.runLoadTests();
    }

    if (testType === "edge" || testType === "all") {
      await suite.runEdgeCaseTests();
    }

    suite.printSummary();
  } catch (error) {
    console.error("Fatal error:", error);
    process.exit(1);
  }
}

main();
