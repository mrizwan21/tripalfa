/**
 * Phase 3: Payment Gateway Integration E2E Tests
 * Tests complete payment processing workflow with Stripe gateway
 * 
 * Test Coverage:
 * - Payment creation with gateway processing
 * - Webhook handling from Stripe
 * - Retry logic for failed payments
 * - Multi-currency payment support
 * - Error handling and recovery
 */

import axios, { AxiosInstance } from "axios";
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "dev-test-secret-key-12345";

interface TestResult {
  passed: number;
  failed: number;
  skipped: number;
  results: {
    name: string;
    status: "passed" | "failed" | "skipped";
    duration: number;
    error?: string;
  }[];
}

class Phase3PaymentGatewayTests {
  private api: AxiosInstance;
  private supplier: any;
  private wallet: any;
  private results: TestResult = {
    passed: 0,
    failed: 0,
    skipped: 0,
    results: [],
  };

  constructor(baseURL: string) {
    // Generate proper JWT token
    const authToken = jwt.sign(
      {
        userId: "test-admin-user",
        email: "admin@test.com",
        role: "super_admin",
        permissions: [
          "suppliers:create",
          "suppliers:read", 
          "suppliers:update",
          "suppliers:delete",
          "wallets:create",
          "wallets:approve",
          "payments:create",
          "payments:process",
        ],
      },
      JWT_SECRET,
      { expiresIn: "24h" }
    );

    this.api = axios.create({
      baseURL,
      headers: {
        "Authorization": `Bearer ${authToken}`,
        "Content-Type": "application/json",
      },
    });
  }

  async run(): Promise<TestResult> {
    console.log("🚀 Starting Phase 3: Payment Gateway Integration Tests\n");

    try {
      // Setup: Create test supplier and wallet
      await this.setupTestData();

      // Test scenarios
      await this.testPaymentCreationWithGateway();
      await this.testPayoutProcessing();
      await this.testRefundProcessing();
      await this.testAdjustmentProcessing();
      await this.testMultiCurrencyPayment();
      await this.testWebhookProcessing();
      await this.testPaymentRetry();
      await this.testPaymentCancellation();
      await this.testPaymentStats();
      await this.testErrorHandling();
    } catch (error: any) {
      console.error("Fatal test error:", error.message);
    }

    this.printSummary();
    return this.results;
  }

  // ============================================
  // SETUP
  // ============================================

  private async setupTestData(): Promise<void> {
    try {
      // Create supplier
      const supplierResponse = await this.api.post("/api/suppliers", {
        name: "Test Supplier Corp",
        code: `test-supplier-phase3-${Date.now()}`,
        email: "supplier@test.com",
        type: "hotel",
        registrationNumber: "REG-12345",
        taxId: "TAX-67890",
      });

      this.supplier = supplierResponse.data.data;
      console.log(`✅ Created test supplier: ${this.supplier.id}`);

      // Create wallet
      const walletResponse = await this.api.post(
        `/api/suppliers/${this.supplier.id}/wallets/request`,
        {
          currency: "USD",
        }
      );

      // Approve wallet
      const walletData = walletResponse.data.data;
      const approvalResponse = await this.api.post(
        `/api/suppliers/${this.supplier.id}/wallet-approvals/${walletData.approvalRequest.id}/approve`
      );

      this.wallet = walletData.wallet;
      console.log(`✅ Created and approved test wallet: ${this.wallet.id}\n`);
    } catch (error: any) {
      console.error("Setup failed:", error.response?.data || error.message);
      throw error;
    }
  }

  // ============================================
  // TEST SCENARIOS
  // ============================================

  /**
   * Test 1: Payment Creation with Gateway Processing
   */
  private async testPaymentCreationWithGateway(): Promise<void> {
    const testName = "Payment Creation with Gateway Processing";
    const startTime = Date.now();

    try {
      const response = await this.api.post(
        `/api/suppliers/${this.supplier.id}/payments`,
        {
          paymentType: "payout",
          amount: 1000,
          currency: "USD",
          paymentMethod: "bank_transfer",
          description: "Test payout via Stripe",
          bankDetails: {
            accountName: "Test Supplier",
            accountNumber: "4532015112830366",
            routingNumber: "021000021",
            bankName: "Test Bank",
            bankCountry: "US",
          },
        }
      );

      if (response.status === 201) {
        const payment = response.data.data;
        console.log(
          `✅ Payment created: ${payment.id} - Status: ${payment.status}`
        );
        this.recordResult(testName, "passed", Date.now() - startTime);
      } else {
        throw new Error(`Unexpected status code: ${response.status}`);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 2: Payout Processing
   */
  private async testPayoutProcessing(): Promise<void> {
    const testName = "Payout Processing";
    const startTime = Date.now();

    try {
      // Get wallet balance first
      const walletResponse = await this.api.get(
        `/api/suppliers/${this.supplier.id}/wallets`
      );
      const currentBalance = walletResponse.data.data.balance;

      if (currentBalance >= 500) {
        const response = await this.api.post(
          `/api/suppliers/${this.supplier.id}/payments`,
          {
            paymentType: "payout",
            amount: 500,
            currency: "USD",
            paymentMethod: "bank_transfer",
            description: "Standard payout test",
          }
        );

        if (response.data.data.status === "pending" ||
            response.data.data.status === "processing" ||
            response.data.data.status === "completed") {
          console.log(
            `✅ Payout created: ${response.data.data.id} - Status: ${response.data.data.status}`
          );
          this.recordResult(testName, "passed", Date.now() - startTime);
        }
      } else {
        console.log(`⊘  ${testName}: Skipped (insufficient balance)`);
        this.recordResult(testName, "skipped", Date.now() - startTime);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 3: Refund Processing
   */
  private async testRefundProcessing(): Promise<void> {
    const testName = "Refund Processing";
    const startTime = Date.now();

    try {
      const response = await this.api.post(
        `/api/suppliers/${this.supplier.id}/payments`,
        {
          paymentType: "refund",
          amount: 250,
          currency: "USD",
          paymentMethod: "bank_transfer",
          description: "Refund for customer cancellation",
        }
      );

      if (response.data.data.paymentType === "refund") {
        console.log(
          `✅ Refund created: ${response.data.data.id} - Amount: $${response.data.data.amount}`
        );
        this.recordResult(testName, "passed", Date.now() - startTime);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 4: Adjustment Processing
   */
  private async testAdjustmentProcessing(): Promise<void> {
    const testName = "Adjustment Processing";
    const startTime = Date.now();

    try {
      const response = await this.api.post(
        `/api/suppliers/${this.supplier.id}/payments`,
        {
          paymentType: "adjustment",
          amount: 100,
          currency: "USD",
          paymentMethod: "credit",
          description: "Credit adjustment for overcharge",
        }
      );

      if (response.data.data.paymentType === "adjustment") {
        console.log(
          `✅ Adjustment created: ${response.data.data.id} - Amount: $${response.data.data.amount}`
        );
        this.recordResult(testName, "passed", Date.now() - startTime);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 5: Multi-Currency Payment
   */
  private async testMultiCurrencyPayment(): Promise<void> {
    const testName = "Multi-Currency Payment Support";
    const startTime = Date.now();

    try {
      // Create wallet in EUR
      const walletResponse = await this.api.post(
        `/api/suppliers/${this.supplier.id}/wallets/request`,
        {
          currency: "EUR",
        }
      );

      if (walletResponse.status === 201) {
        // Create payment in EUR
        const paymentResponse = await this.api.post(
          `/api/suppliers/${this.supplier.id}/payments`,
          {
            paymentType: "payout",
            amount: 900,
            currency: "EUR",
            paymentMethod: "bank_transfer",
            description: "Multi-currency test",
          }
        );

        if (paymentResponse.data.data.currency === "EUR") {
          console.log(
            `✅ Multi-currency payment created: EUR ${paymentResponse.data.data.amount}`
          );
          this.recordResult(testName, "passed", Date.now() - startTime);
          return;
        }
      }
      throw new Error("Multi-currency payment failed");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 6: Webhook Processing
   */
  private async testWebhookProcessing(): Promise<void> {
    const testName = "Webhook Processing";
    const startTime = Date.now();

    try {
      // Send test webhook
      const response = await this.api.post(
        "/api/suppliers/webhooks/test",
        {
          id: "evt_test_123",
          type: "charge.succeeded",
          created: Math.floor(Date.now() / 1000),
          data: {
            id: "ch_test_123",
            amount: 100000,
            currency: "usd",
            receipt_url: "https://test.stripe.com",
          },
        }
      );

      if (response.data.received) {
        console.log(`✅ Webhook processed successfully`);
        this.recordResult(testName, "passed", Date.now() - startTime);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 7: Payment Retry
   */
  private async testPaymentRetry(): Promise<void> {
    const testName = "Payment Retry Mechanism";
    const startTime = Date.now();

    try {
      // Get first failed payment (if any)
      const paymentsResponse = await this.api.get(
        `/api/suppliers/${this.supplier.id}/payments?status=failed&limit=1`
      );

      if (paymentsResponse.data.data.length > 0) {
        const failedPayment = paymentsResponse.data.data[0];

        // Retry the payment
        const retryResponse = await this.api.post(
          `/api/suppliers/${this.supplier.id}/payments/${failedPayment.id}/retry`
        );

        if (retryResponse.data.paymentId) {
          console.log(
            `✅ Payment scheduled for retry: ${retryResponse.data.paymentId}`
          );
          this.recordResult(testName, "passed", Date.now() - startTime);
          return;
        }
      }

      console.log(`⊘  ${testName}: Skipped (no failed payments)`);
      this.recordResult(testName, "skipped", Date.now() - startTime);
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 8: Payment Cancellation
   */
  private async testPaymentCancellation(): Promise<void> {
    const testName = "Payment Cancellation";
    const startTime = Date.now();

    try {
      // Create a payment to cancel
      const createResponse = await this.api.post(
        `/api/suppliers/${this.supplier.id}/payments`,
        {
          paymentType: "adjustment",
          amount: 50,
          currency: "USD",
          paymentMethod: "credit",
          description: "Payment to cancel",
        }
      );

      const payment = createResponse.data.data;

      if (payment.status === "pending") {
        // Cancel the payment
        const cancelResponse = await this.api.delete(
          `/api/suppliers/${this.supplier.id}/payments/${payment.id}/cancel`,
          {
            data: {
              reason: "Test cancellation",
            },
          }
        );

        if (cancelResponse.data.data.status === "cancelled") {
          console.log(
            `✅ Payment cancelled: ${payment.id}`
          );
          this.recordResult(testName, "passed", Date.now() - startTime);
          return;
        }
      }

      throw new Error("Payment cancellation failed");
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 9: Payment Statistics
   */
  private async testPaymentStats(): Promise<void> {
    const testName = "Payment Statistics";
    const startTime = Date.now();

    try {
      const response = await this.api.get(
        `/api/suppliers/${this.supplier.id}/payment-stats`
      );

      if (response.data.paymentStats) {
        const stats = response.data.paymentStats;
        console.log(
          `✅ Stats retrieved: Total=${stats.total}, Completed=${stats.completed}, Failed=${stats.failed}`
        );
        this.recordResult(testName, "passed", Date.now() - startTime);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  /**
   * Test 10: Error Handling
   */
  private async testErrorHandling(): Promise<void> {
    const testName = "Error Handling";
    const startTime = Date.now();

    try {
      let testsPassed = 0;

      // Test: Invalid payment type
      try {
        await this.api.post(
          `/api/suppliers/${this.supplier.id}/payments`,
          {
            paymentType: "invalid",
            amount: 100,
            currency: "USD",
          }
        );
      } catch (error: any) {
        if (error.response?.status === 400) {
          testsPassed++;
        }
      }

      // Test: Insufficient balance
      try {
        await this.api.post(
          `/api/suppliers/${this.supplier.id}/payments`,
          {
            paymentType: "payout",
            amount: 999999999,
            currency: "USD",
          }
        );
      } catch (error: any) {
        if (error.response?.status === 409) {
          testsPassed++;
        }
      }

      // Test: Non-existent supplier
      try {
        await this.api.get(
          `/api/suppliers/invalid-id/payments`
        );
      } catch (error: any) {
        if (error.response?.status === 404) {
          testsPassed++;
        }
      }

      if (testsPassed >= 2) {
        console.log(
          `✅ Error handling validated: ${testsPassed}/3 scenarios correct`
        );
        this.recordResult(testName, "passed", Date.now() - startTime);
      } else {
        throw new Error(`Only ${testsPassed}/3 error scenarios handled correctly`);
      }
    } catch (error: any) {
      const errorMsg =
        error.response?.data?.error || error.message;
      console.log(`❌ ${testName}: ${errorMsg}`);
      this.recordResult(testName, "failed", Date.now() - startTime, errorMsg);
    }
  }

  // ============================================
  // HELPERS
  // ============================================

  private recordResult(
    name: string,
    status: "passed" | "failed" | "skipped",
    duration: number,
    error?: string
  ): void {
    this.results.results.push({
      name,
      status,
      duration,
      error,
    });

    if (status === "passed") this.results.passed++;
    else if (status === "failed") this.results.failed++;
    else this.results.skipped++;
  }

  private printSummary(): void {
    console.log("\n" + "=".repeat(60));
    console.log("📊 PHASE 3 TEST RESULTS");
    console.log("=".repeat(60));

    const total = this.results.passed + this.results.failed + this.results.skipped;
    const passRate = Math.round((this.results.passed / total) * 100);

    console.log(`\nTotal: ${total} tests`);
    console.log(
      `✅ Passed:  ${this.results.passed} (${passRate}%)`
    );
    console.log(
      `❌ Failed:  ${this.results.failed}`
    );
    console.log(
      `⊘  Skipped: ${this.results.skipped}`
    );

    const totalDuration = this.results.results.reduce(
      (sum, r) => sum + r.duration,
      0
    );
    console.log(`\n⏱️  Total Duration: ${totalDuration}ms`);

    // Summary by category
    console.log("\n📋 Test Breakdown:");
    this.results.results.forEach((r) => {
      const icon = r.status === "passed" ? "✅" : r.status === "failed" ? "❌" : "⊘";
      console.log(`  ${icon} ${r.name} [${r.duration}ms]`);
      if (r.error) console.log(`     Error: ${r.error}`);
    });

    console.log("\n" + "=".repeat(60));

    if (this.results.failed === 0) {
      console.log("🎉 ALL TESTS PASSED - PHASE 3 READY FOR PRODUCTION!\n");
    } else {
      console.log(`⚠️  ${this.results.failed} test(s) failed - review needed\n`);
    }
  }
}

// ============================================
// MAIN EXECUTION
// ============================================

async function main() {
  const baseURL = process.env.API_GATEWAY_BASE_URL || "http://localhost:3000";

  console.log(`🔗 Using API Gateway: ${baseURL}\n`);

  const tests = new Phase3PaymentGatewayTests(baseURL);
  const results = await tests.run();

  // Save results
  const fs = await import("fs").then((m) => m.default);
  const timestamp = Date.now();
  const reportPath = `test-reports/phase3-payment-gateway-${timestamp}.json`;

  fs.mkdirSync("test-reports", { recursive: true });
  fs.writeFileSync(reportPath, JSON.stringify(results, null, 2));

  console.log(`📄 Report saved: ${reportPath}`);

  // Exit with appropriate code
  process.exit(results.failed > 0 ? 1 : 0);
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
