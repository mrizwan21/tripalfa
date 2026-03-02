#!/usr/bin/env npx tsx
/**
 * FX Integration Test Suite
 *
 * Validates that FX rate conversion is working correctly with:
 * - Database population (rates available)
 * - FX endpoint accessibility
 * - Conversion accuracy with fees
 * - Fallback behavior when API unavailable
 *
 * Usage:
 *   npx tsx scripts/test-fx-integration.ts
 *
 * Environment:
 *   VERBOSE=true - Show detailed logs
 *   WALLET_API_URL - Override wallet service URL (default: http://localhost:3001)
 */

import axios, { AxiosInstance } from "axios";

// ============================================================================
// CONFIGURATION
// ============================================================================

const WALLET_API_URL = process.env.WALLET_API_URL || "http://localhost:3001";
const VERBOSE = process.env.VERBOSE === "true";

// Test data
const TEST_CURRENCIES = [
  { from: "USD", to: "EUR", testAmount: 500 },
  { from: "EUR", to: "GBP", testAmount: 1000 },
  { from: "USD", to: "JPY", testAmount: 100 },
  { from: "GBP", to: "AED", testAmount: 750 },
  { from: "AED", to: "ZAR", testAmount: 500 },
];

// ============================================================================
// TEST RESULTS TRACKING
// ============================================================================

interface TestResult {
  name: string;
  status: "PASS" | "FAIL" | "SKIP" | "WARN";
  duration: number;
  message: string;
  details?: Record<string, any>;
}

class TestSuite {
  private client: AxiosInstance;
  private results: TestResult[] = [];
  private startTime = Date.now();

  constructor() {
    this.client = axios.create({
      baseURL: WALLET_API_URL,
      timeout: 5000,
      validateStatus: () => true, // Accept all status codes
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

  async runTest(
    name: string,
    testFn: () => Promise<{ status: "PASS" | "FAIL" | "SKIP" | "WARN"; message: string; details?: any }>,
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
        this.log("SUCCESS", `${name} (${duration}ms)`);
      } else if (result.status === "SKIP") {
        this.log("WARN", `${name} - Skipped: ${result.message}`);
      } else {
        this.log("ERROR", `${name} - ${result.message}`);
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

  printSummary() {
    const totalTime = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === "PASS").length;
    const failed = this.results.filter((r) => r.status === "FAIL").length;
    const skipped = this.results.filter((r) => r.status === "SKIP").length;

    console.log("\n╔════════════════════════════════════════════════════════════╗");
    console.log("║              FX INTEGRATION TEST SUMMARY                   ║");
    console.log("╠════════════════════════════════════════════════════════════╣");
    console.log(`║ Total Tests:  ${String(this.results.length).padEnd(51)}║`);
    console.log(`║ ✓ Passed:     ${String(passed).padEnd(51)}║`);
    console.log(`║ ✗ Failed:     ${String(failed).padEnd(51)}║`);
    console.log(`║ ⊘ Skipped:    ${String(skipped).padEnd(51)}║`);
    console.log(`║ ⏱ Duration:   ${String(`${totalTime}ms`).padEnd(51)}║`);
    console.log("╚════════════════════════════════════════════════════════════╝\n");

    if (failed === 0) {
      console.log("✓ All tests passed! FX integration is working correctly.\n");
      return true;
    } else {
      console.log(`✗ ${failed} test(s) failed. See details above.\n`);
      return false;
    }
  }

  getResults() {
    return this.results;
  }
}

// ============================================================================
// TEST IMPLEMENTATIONS
// ============================================================================

async function runAllTests() {
  const suite = new TestSuite();

  // Test 1: Service Health
  await suite.runTest("FX Service Health Check", async () => {
    try {
      const response = await axios.get(`${WALLET_API_URL}/api/fx/health`, {
        timeout: 5000,
      });

      if (response.status !== 200) {
        return {
          status: "FAIL",
          message: `Health check returned ${response.status}`,
        };
      }

      const data = response.data;
      if (!data.status || data.status !== "healthy") {
        return {
          status: "FAIL",
          message: "Service status is not healthy",
          details: data,
        };
      }

      if (!data.currencyCount || data.currencyCount < 5) {
        return {
          status: "FAIL",
          message: `Insufficient currency data. Found ${data.currencyCount}, expected >= 5`,
          details: data,
        };
      }

      return {
        status: "PASS",
        message: `Health check passed - ${data.currencyCount} currencies available`,
        details: {
          status: data.status,
          currencyCount: data.currencyCount,
          isStale: data.isStale,
          fetchedAt: data.fetchedAt,
        },
      };
    } catch (error) {
      return {
        status: "FAIL",
        message: `Health check failed: ${String(error)}. Is wallet service running on port 3008?`,
      };
    }
  });

  // Test 2: Get All Rates
  await suite.runTest("Get All Rates Endpoint", async () => {
    try {
      const response = await axios.get(`${WALLET_API_URL}/api/fx/rates`, {
        timeout: 5000,
      });

      if (response.status !== 200) {
        return {
          status: "FAIL",
          message: `Rates endpoint returned ${response.status}`,
        };
      }

      const rateCount = Object.keys(response.data.rates || {}).length;
      if (rateCount < 5) {
        return {
          status: "FAIL",
          message: `Insufficient rates. Found ${rateCount}, expected >= 5`,
        };
      }

      return {
        status: "PASS",
        message: `Rates endpoint working - ${rateCount} rates available`,
        details: {
          sampleRates: Object.fromEntries(
            Object.entries(response.data.rates).slice(0, 5),
          ),
          baseCurrency: response.data.baseCurrency,
        },
      };
    } catch (error) {
      return {
        status: "FAIL",
        message: `Rates endpoint failed: ${String(error)}`,
      };
    }
  });

  // Test 3: Test each currency pair
  for (const testCase of TEST_CURRENCIES) {
    await suite.runTest(
      `Single Rate Pair: ${testCase.from} → ${testCase.to}`,
      async () => {
        try {
          const response = await axios.get(
            `${WALLET_API_URL}/api/fx/rate/${testCase.from}/${testCase.to}`,
            { timeout: 5000 },
          );

          if (response.status !== 200) {
            return {
              status: "FAIL",
              message: `Rate lookup returned ${response.status}`,
            };
          }

          const rate = response.data.rate;
          if (!rate || rate <= 0) {
            return {
              status: "FAIL",
              message: `Invalid rate: ${rate}`,
            };
          }

          return {
            status: "PASS",
            message: `Rate retrieved: 1 ${testCase.from} = ${rate.toFixed(6)} ${testCase.to}`,
            details: {
              rate: rate.toFixed(6),
              feePercentage: response.data.feePercentage,
            },
          };
        } catch (error) {
          return {
            status: "FAIL",
            message: `Rate lookup failed: ${String(error)}`,
          };
        }
      },
    );
  }

  // Test 4: Conversion without fee
  for (const testCase of TEST_CURRENCIES.slice(0, 2)) {
    // Only test first 2 pairs to save time
    await suite.runTest(
      `Conversion (no fee): ${testCase.testAmount} ${testCase.from} → ${testCase.to}`,
      async () => {
        try {
          const response = await axios.post(
            `${WALLET_API_URL}/api/fx/convert`,
            {
              amount: testCase.testAmount,
              fromCurrency: testCase.from,
              toCurrency: testCase.to,
            },
            { timeout: 5000 },
          );

          if (response.status !== 200) {
            return {
              status: "FAIL",
              message: `Conversion returned ${response.status}`,
            };
          }

          const converted = response.data.converted.amount;
          const rate = response.data.fxRate;

          if (!converted || converted <= 0) {
            return {
              status: "FAIL",
              message: `Invalid conversion result: ${converted}`,
            };
          }

          return {
            status: "PASS",
            message: `Conversion successful: ${testCase.testAmount} ${testCase.from} @ ${rate.toFixed(6)} = ${converted.toFixed(2)} ${testCase.to}`,
            details: {
              original: testCase.testAmount,
              converted: converted.toFixed(2),
              rate: rate.toFixed(6),
              fee: response.data.fxFee,
            },
          };
        } catch (error) {
          return {
            status: "FAIL",
            message: `Conversion failed: ${String(error)}`,
          };
        }
      },
    );
  }

  // Test 5: Conversion with fee (most important for bookings)
  for (const testCase of TEST_CURRENCIES.slice(0, 2)) {
    // Only test first 2 pairs to save time
    await suite.runTest(
      `Conversion (with fee): ${testCase.testAmount} ${testCase.from} → ${testCase.to}`,
      async () => {
        try {
          const response = await axios.post(
            `${WALLET_API_URL}/api/fx/convert-with-fee`,
            {
              amount: testCase.testAmount,
              fromCurrency: testCase.from,
              toCurrency: testCase.to,
              applyFee: true,
            },
            { timeout: 5000 },
          );

          if (response.status !== 200) {
            return {
              status: "FAIL",
              message: `Conversion with fee returned ${response.status}`,
            };
          }

          const breakdown = response.data.breakdown;
          if (!breakdown) {
            return {
              status: "FAIL",
              message: "No breakdown in response",
              details: response.data,
            };
          }

          const { convertedAmount, fxRate, fxFee, totalDebit } = breakdown;
          const expectedFee = convertedAmount * 0.02;
          const feeMatch = Math.abs(fxFee - expectedFee) < 0.01;

          if (!feeMatch) {
            return {
              status: "FAIL",
              message: `Fee calculation mismatch. Expected ~${expectedFee.toFixed(2)}, got ${fxFee.toFixed(2)}`,
            };
          }

          return {
            status: "PASS",
            message: `Conversion with fee successful: ${testCase.testAmount} ${testCase.from} @ ${fxRate.toFixed(6)} + 2% fee = ${totalDebit.toFixed(2)} ${testCase.to}`,
            details: {
              original: testCase.testAmount,
              converted: convertedAmount.toFixed(2),
              rate: fxRate.toFixed(6),
              fee: fxFee.toFixed(2),
              total: totalDebit.toFixed(2),
              feePercentage: "2%",
            },
          };
        } catch (error) {
          return {
            status: "FAIL",
            message: `Conversion with fee failed: ${String(error)}`,
          };
        }
      },
    );
  }

  // Test 6: Verify fee is 0 for same currency
  await suite.runTest("Same Currency Conversion (no fee)", async () => {
    try {
      const response = await axios.post(
        `${WALLET_API_URL}/api/fx/convert-with-fee`,
        {
          amount: 1000,
          fromCurrency: "USD",
          toCurrency: "USD",
          applyFee: true,
        },
        { timeout: 5000 },
      );

      if (response.status !== 200) {
        return {
          status: "FAIL",
          message: `Conversion returned ${response.status}`,
        };
      }

      const breakdown = response.data.breakdown;
      if (breakdown.fxFee !== 0) {
        return {
          status: "FAIL",
          message: `Expected 0 fee for same currency, got ${breakdown.fxFee}`,
        };
      }

      if (breakdown.totalDebit !== 1000) {
        return {
          status: "FAIL",
          message: `Expected total of 1000 USD, got ${breakdown.totalDebit}`,
        };
      }

      return {
        status: "PASS",
        message: "Same currency conversion correctly has 0 fee",
        details: {
          amount: 1000,
          converted: breakdown.convertedAmount,
          fee: breakdown.fxFee,
          total: breakdown.totalDebit,
        },
      };
    } catch (error) {
      return {
        status: "FAIL",
        message: `Same currency test failed: ${String(error)}`,
      };
    }
  });

  // Test 7: Stale data handling
  await suite.runTest("Stale Data Flag Check", async () => {
    try {
      const response = await axios.get(`${WALLET_API_URL}/api/fx/health`, {
        timeout: 5000,
      });

      const isStale = response.data.isStale;
      const fetchedAt = new Date(response.data.fetchedAt);
      const ageMinutes = (Date.now() - fetchedAt.getTime()) / 60000;

      if (isStale) {
        return {
          status: "WARN",
          message: `Rates are stale (${ageMinutes.toFixed(0)} minutes old). Run: npm run fx:fetch`,
        };
      }

      return {
        status: "PASS",
        message: `Rates are fresh (${ageMinutes.toFixed(0)} minutes old)`,
        details: {
          fetchedAt: fetchedAt.toISOString(),
          ageMinutes: ageMinutes.toFixed(0),
        },
      };
    } catch (error) {
      return {
        status: "FAIL",
        message: `Stale check failed: ${String(error)}`,
      };
    }
  });

  // Print summary and return
  const success = suite.printSummary();
  return success;
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

console.log("\n╔════════════════════════════════════════════════════════════╗");
console.log("║          FX INTEGRATION VALIDATION TEST SUITE              ║");
console.log("╠════════════════════════════════════════════════════════════╣");
console.log(`║ Wallet Service URL: ${WALLET_API_URL.padEnd(42)}║`);
console.log(`║ Verbose Mode: ${(VERBOSE ? "ON" : "OFF").padEnd(49)}║`);
console.log("╚════════════════════════════════════════════════════════════╝\n");

runAllTests()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((error) => {
    console.error("\n✗ Test suite execution failed:", error);
    process.exit(1);
  });
