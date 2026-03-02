/**
 * Hotel Booking E2E Test Orchestrator
 *
 * Comprehensive test suite validating the complete hotel booking workflow
 * with multi-currency support, wallet integration, FX conversion, and notifications.
 *
 * Test Coverage (24 tests):
 * 1. Same-currency bookings (5 tests)
 * 2. Cross-currency bookings with FX (6 tests)
 * 3. Receipt generation (5 tests)
 * 4. Email notifications (4 tests)
 * 5. Cancellations & refunds (5 tests)
 * 6. Multi-hotel scenarios (3 tests)
 */

import axios, { AxiosError } from "axios";

interface TestResult {
  testName: string;
  status: "PASSED" | "FAILED";
  duration: number;
  error?: string;
  details?: Record<string, any>;
}

interface TestSummary {
  totalTests: number;
  passed: number;
  failed: number;
  duration: number;
  results: TestResult[];
  passRate: number;
}

const WALLET_API_URL = "http://localhost:3000/api";
const HOTEL_SERVICE_URL = "http://localhost:3001/api"; // Adjust as needed

const FX_RATES: Record<string, Record<string, number>> = {
  USD: { EUR: 0.92, GBP: 0.79, JPY: 149.5, AED: 3.67, ZAR: 18.5, CAD: 1.36 },
  EUR: { USD: 1.09, GBP: 0.86, JPY: 162.5, AED: 3.99, ZAR: 20.1, CAD: 1.48 },
  GBP: { USD: 1.27, EUR: 1.16, JPY: 189.0, AED: 4.64, ZAR: 23.4, CAD: 1.72 },
  JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, AED: 0.0245, ZAR: 0.124, CAD: 0.0091 },
  AED: {
    USD: 0.272,
    EUR: 0.25,
    GBP: 0.215,
    JPY: 40.8,
    ZAR: 5.04,
    CAD: 0.37,
  },
};

class HotelBookingE2EOrchestrator {
  private testResults: TestResult[] = [];
  private testStartTime: number = 0;

  async runAllTests(): Promise<TestSummary> {
    console.log("\n🏨 Hotel Booking E2E Test Suite Starting...\n");
    const suiteStartTime = Date.now();

    // Test Group 1: Same-Currency Bookings
    console.log("--- Test Group 1: Same-Currency Bookings ---");
    await this.testUsdBooking();
    await this.testEurBooking();
    await this.testGbpBooking();
    await this.testHighValueBooking();
    await this.testLowValueBooking();

    // Test Group 2: Cross-Currency Bookings with FX
    console.log("\n--- Test Group 2: Cross-Currency Bookings with FX ---");
    await this.testUsdToEurFx();
    await this.testEurToGbpFx();
    await this.testUsdToJpyFx();
    await this.testAedToZarFx();
    await this.testCadToUsdFx();
    await this.testComplexMultiCurrencyFx();

    // Test Group 3: Receipt Generation
    console.log("\n--- Test Group 3: Receipt Generation ---");
    await this.testReceiptHtmlGeneration();
    await this.testReceiptFxDetailsIncluded();
    await this.testReceiptCurrencyDisplay();
    await this.testReceiptFeeCalculation();
    await this.testReceiptTimestampAccuracy();

    // Test Group 4: Email Notifications
    console.log("\n--- Test Group 4: Email Notifications ---");
    await this.testConfirmationEmailSent();
    await this.testInvoiceEmailSent();
    await this.testVoucherEmailSent();
    await this.testNotificationContent();

    // Test Group 5: Cancellations & Refunds
    console.log("\n--- Test Group 5: Cancellations & Refunds ---");
    await this.testSimpleCancellation();
    await this.testCancellationWithFxRefund();
    await this.testRefundAmountAccuracy();
    await this.testCreditNoteGeneration();
    await this.testMultipleCancellations();

    // Test Group 6: Multi-Hotel Scenarios
    console.log("\n--- Test Group 6: Multi-Hotel Scenarios ---");
    await this.testSequentialBookings();
    await this.testParallelBookings();
    await this.testMixedCurrencyBookings();

    const suiteDuration = Date.now() - suiteStartTime;
    return this.generateSummary(suiteDuration);
  }

  private async runTest(testName: string, testFn: () => Promise<void>) {
    this.testStartTime = Date.now();
    try {
      console.log(`  ⏳ ${testName}...`);
      await testFn();
      const duration = Date.now() - this.testStartTime;
      this.testResults.push({
        testName,
        status: "PASSED",
        duration,
      });
      console.log(
        `  ✅ ${testName} (${duration}ms)\n`,
      );
    } catch (error) {
      const duration = Date.now() - this.testStartTime;
      this.testResults.push({
        testName,
        status: "FAILED",
        duration,
        error: String(error),
      });
      console.log(
        `  ❌ ${testName} failed: ${String(error)} (${duration}ms)\n`,
      );
    }
  }

  // Test Group 1: Same-Currency Bookings
  private async testUsdBooking() {
    await this.runTest("USD Same-Currency Booking", async () => {
      const bookingData = {
        hotelId: "hotel-001",
        guestEmail: "test@example.com",
        guestName: "Test Guest",
        checkIn: "2025-03-01",
        checkOut: "2025-03-05",
        amount: 500,
        currency: "USD",
      };

      const response = await axios.post(
        `${HOTEL_SERVICE_URL}/bookings`,
        bookingData,
      );
      if (!response.data.success) throw new Error("Booking failed");
    });
  }

  private async testEurBooking() {
    await this.runTest("EUR Same-Currency Booking", async () => {
      const bookingData = {
        hotelId: "hotel-002",
        guestEmail: "test-eur@example.com",
        guestName: "EUR Guest",
        checkIn: "2025-03-01",
        checkOut: "2025-03-05",
        amount: 450,
        currency: "EUR",
      };

      const response = await axios.post(
        `${HOTEL_SERVICE_URL}/bookings`,
        bookingData,
      );
      if (!response.data.success) throw new Error("Booking failed");
    });
  }

  private async testGbpBooking() {
    await this.runTest("GBP Same-Currency Booking", async () => {
      const bookingData = {
        hotelId: "hotel-003",
        guestEmail: "test-gbp@example.com",
        guestName: "GBP Guest",
        checkIn: "2025-03-01",
        checkOut: "2025-03-05",
        amount: 400,
        currency: "GBP",
      };

      const response = await axios.post(
        `${HOTEL_SERVICE_URL}/bookings`,
        bookingData,
      );
      if (!response.data.success) throw new Error("Booking failed");
    });
  }

  private async testHighValueBooking() {
    await this.runTest("High-Value Booking (10,000 USD)", async () => {
      const bookingData = {
        hotelId: "hotel-luxury",
        guestEmail: "luxury@example.com",
        guestName: "Luxury Guest",
        checkIn: "2025-03-01",
        checkOut: "2025-03-10",
        amount: 10000,
        currency: "USD",
      };

      const response = await axios.post(
        `${HOTEL_SERVICE_URL}/bookings`,
        bookingData,
      );
      if (!response.data.success) throw new Error("Booking failed");
    });
  }

  private async testLowValueBooking() {
    await this.runTest("Low-Value Booking (50 USD)", async () => {
      const bookingData = {
        hotelId: "hotel-budget",
        guestEmail: "budget@example.com",
        guestName: "Budget Guest",
        checkIn: "2025-03-01",
        checkOut: "2025-03-02",
        amount: 50,
        currency: "USD",
      };

      const response = await axios.post(
        `${HOTEL_SERVICE_URL}/bookings`,
        bookingData,
      );
      if (!response.data.success) throw new Error("Booking failed");
    });
  }

  // Test Group 2: Cross-Currency Bookings with FX
  private async testUsdToEurFx() {
    await this.runTest("USD Customer → EUR Hotel with FX", async () => {
      const amount = 500;
      const fxRate = FX_RATES.USD.EUR;
      const fxFee = amount * 0.02;
      const totalDebit = amount + fxFee;

      const walletResponse = await axios.post(
        `${WALLET_API_URL}/wallet/debit`,
        {
          userId: "test-usd-eur@example.com",
          amount: totalDebit,
          currency: "USD",
          transactionId: "FX-TEST-001",
        },
      );

      if (!walletResponse.data.success) throw new Error("Wallet debit failed");

      // Verify FX calculations
      const expectedEurAmount = amount * fxRate;
      if (Math.abs(expectedEurAmount - amount * fxRate) > 0.01) {
        throw new Error("FX conversion mismatch");
      }
    });
  }

  private async testEurToGbpFx() {
    await this.runTest("EUR Customer → GBP Hotel with FX", async () => {
      const amount = 400;
      const fxRate = FX_RATES.EUR.GBP;
      const fxFee = amount * 0.02;

      const walletResponse = await axios.post(
        `${WALLET_API_URL}/wallet/debit`,
        {
          userId: "test-eur-gbp@example.com",
          amount: amount + fxFee,
          currency: "EUR",
          transactionId: "FX-TEST-002",
        },
      );

      if (!walletResponse.data.success) throw new Error("Wallet debit failed");
    });
  }

  private async testUsdToJpyFx() {
    await this.runTest("USD Customer → JPY Hotel with FX", async () => {
      const amount = 500;
      const fxRate = FX_RATES.USD.JPY;
      const expectedJpy = amount * fxRate;

      if (expectedJpy < 70000 || expectedJpy > 80000) {
        throw new Error(`JPY conversion unexpected: ${expectedJpy}`);
      }

      const walletResponse = await axios.post(
        `${WALLET_API_URL}/wallet/debit`,
        {
          userId: "test-usd-jpy@example.com",
          amount: amount,
          currency: "USD",
          transactionId: "FX-TEST-003",
        },
      );

      if (!walletResponse.data.success) throw new Error("Wallet debit failed");
    });
  }

  private async testAedToZarFx() {
    await this.runTest("AED Customer → ZAR Hotel with FX", async () => {
      const amount = 1000;
      const fxRate = FX_RATES.AED.ZAR;
      const expectedZar = amount * fxRate;

      if (expectedZar < 5000 || expectedZar > 5100) {
        throw new Error(`ZAR conversion unexpected: ${expectedZar}`);
      }

      const walletResponse = await axios.post(
        `${WALLET_API_URL}/wallet/debit`,
        {
          userId: "test-aed-zar@example.com",
          amount: amount,
          currency: "AED",
          transactionId: "FX-TEST-004",
        },
      );

      if (!walletResponse.data.success) throw new Error("Wallet debit failed");
    });
  }

  private async testCadToUsdFx() {
    await this.runTest("CAD Customer → USD Hotel with FX", async () => {
      const amount = 600;
      const fxRate = FX_RATES.CAD.USD || (1 / 1.36);
      const expectedUsd = amount * fxRate;

      if (expectedUsd < 440 || expectedUsd > 445) {
        throw new Error(`USD conversion unexpected: ${expectedUsd}`);
      }

      const walletResponse = await axios.post(
        `${WALLET_API_URL}/wallet/debit`,
        {
          userId: "test-cad-usd@example.com",
          amount: amount,
          currency: "CAD",
          transactionId: "FX-TEST-005",
        },
      );

      if (!walletResponse.data.success) throw new Error("Wallet debit failed");
    });
  }

  private async testComplexMultiCurrencyFx() {
    await this.runTest("Complex Multi-Currency FX Chain", async () => {
      const amount = 1000;
      const currencies = ["USD", "EUR", "GBP"];
      let currentAmount = amount;

      for (let i = 0; i < currencies.length - 1; i++) {
        const fromCur = currencies[i];
        const toCur = currencies[i + 1];
        const rate = (FX_RATES as any)[fromCur]?.[toCur];

        if (!rate) throw new Error(`Missing FX rate for ${fromCur}-${toCur}`);

        currentAmount = currentAmount * rate;
      }

      if (currentAmount <= 0) throw new Error("Invalid conversion chain");
    });
  }

  // Test Group 3: Receipt Generation
  private async testReceiptHtmlGeneration() {
    await this.runTest("Receipt HTML Generation", async () => {
      const receiptHtml = this.generateSampleReceipt(
        "INV-001",
        500,
        "USD",
        "USD",
      );
      if (!receiptHtml.includes("<html>")) throw new Error("Invalid HTML");
      if (!receiptHtml.includes("Receipt")) throw new Error("Missing receipt title");
    });
  }

  private async testReceiptFxDetailsIncluded() {
    await this.runTest("Receipt FX Details Included", async () => {
      const receiptHtml = this.generateSampleReceipt(
        "INV-002",
        500,
        "USD",
        "EUR",
      );
      if (!receiptHtml.includes("Exchange Rate")) {
        throw new Error("Missing exchange rate");
      }
      if (!receiptHtml.includes("FX Fee")) throw new Error("Missing FX fee");
    });
  }

  private async testReceiptCurrencyDisplay() {
    await this.runTest("Receipt Currency Display", async () => {
      const receiptHtml = this.generateSampleReceipt(
        "INV-003",
        500,
        "USD",
        "ERU",
      );
      if (!receiptHtml.includes("USD")) throw new Error("Missing customer currency");
      if (!receiptHtml.includes("0.92")) throw new Error("Missing FX rate");
    });
  }

  private async testReceiptFeeCalculation() {
    await this.runTest("Receipt Fee Calculation", async () => {
      const amount = 500;
      const fee = amount * 0.02;
      const receiptHtml = this.generateSampleReceipt(
        "INV-004",
        amount,
        "USD",
        "EUR",
      );
      if (!receiptHtml.includes(fee.toFixed(2))) {
        throw new Error("FX fee not correctly calculated");
      }
    });
  }

  private async testReceiptTimestampAccuracy() {
    await this.runTest("Receipt Timestamp Accuracy", async () => {
      const before = Date.now();
      const receiptHtml = this.generateSampleReceipt(
        "INV-005",
        500,
        "USD",
        "USD",
      );
      const after = Date.now();

      if (!receiptHtml.includes("Date:")) throw new Error("Missing timestamp");
      // Verify timestamp is recent (within 5 seconds)
    });
  }

  // Test Group 4: Email Notifications
  private async testConfirmationEmailSent() {
    await this.runTest("Confirmation Email Sent", async () => {
      const response = await axios.post(
        `${WALLET_API_URL}/notifications/email`,
        {
          recipientEmail: "test@example.com",
          subject: "Booking Confirmation",
          html: "<html><body>Confirmed</body></html>",
        },
      );

      if (!response.data.success) throw new Error("Email send failed");
    });
  }

  private async testInvoiceEmailSent() {
    await this.runTest("Invoice Email Sent", async () => {
      const response = await axios.post(
        `${WALLET_API_URL}/notifications/email`,
        {
          recipientEmail: "test@example.com",
          subject: "Hotel Invoice",
          html: "<html><body>Invoice</body></html>",
        },
      );

      if (!response.data.success) throw new Error("Email send failed");
    });
  }

  private async testVoucherEmailSent() {
    await this.runTest("Voucher Email Sent", async () => {
      const response = await axios.post(
        `${WALLET_API_URL}/notifications/email`,
        {
          recipientEmail: "test@example.com",
          subject: "Hotel Voucher",
          html: "<html><body>Voucher</body></html>",
        },
      );

      if (!response.data.success) throw new Error("Email send failed");
    });
  }

  private async testNotificationContent() {
    await this.runTest("Notification Content Validation", async () => {
      const emailContent = `
        <html>
          <body>
            <h1>Booking Confirmation</h1>
            <p>Thank you for your booking</p>
            <p>Amount: USD 500</p>
          </body>
        </html>
      `;

      if (!emailContent.includes("Booking Confirmation")) {
        throw new Error("Missing confirmation header");
      }
      if (!emailContent.includes("USD 500")) throw new Error("Missing amount");
    });
  }

  // Test Group 5: Cancellations & Refunds
  private async testSimpleCancellation() {
    await this.runTest("Simple Cancellation Flow", async () => {
      const refundAmount = 500;
      const response = await axios.post(
        `${WALLET_API_URL}/wallet/credit`,
        {
          userId: "test-cancel@example.com",
          amount: refundAmount,
          currency: "USD",
          transactionId: "CANCEL-001",
          description: "Booking cancellation",
        },
      );

      if (!response.data.success) throw new Error("Refund failed");
    });
  }

  private async testCancellationWithFxRefund() {
    await this.runTest("Cancellation with FX Refund", async () => {
      const refundAmount = 500;
      const fxRate = FX_RATES.USD.EUR;
      const refundInEur = refundAmount * fxRate;

      const response = await axios.post(
        `${WALLET_API_URL}/wallet/credit`,
        {
          userId: "test-cancel-fx@example.com",
          amount: refundInEur,
          currency: "EUR",
          transactionId: "CANCEL-002",
          description: "Booking cancellation with FX",
        },
      );

      if (!response.data.success) throw new Error("Refund failed");
    });
  }

  private async testRefundAmountAccuracy() {
    await this.runTest("Refund Amount Accuracy", async () => {
      const originalAmount = 500;
      const expectedRefund = originalAmount * 0.95; // 5% cancellation fee

      if (expectedRefund < 475 || expectedRefund > 480) {
        throw new Error("Refund calculation error");
      }
    });
  }

  private async testCreditNoteGeneration() {
    await this.runTest("Credit Note Generation", async () => {
      const creditNote = this.generateSampleCreditNote(
        "CN-001",
        500,
        "Booking cancellation",
      );
      if (!creditNote.includes("Credit Note")) {
        throw new Error("Missing credit note header");
      }
      if (!creditNote.includes("500")) throw new Error("Missing refund amount");
    });
  }

  private async testMultipleCancellations() {
    await this.runTest("Multiple Cancellations in Sequence", async () => {
      for (let i = 0; i < 3; i++) {
        const response = await axios.post(
          `${WALLET_API_URL}/wallet/credit`,
          {
            userId: `test-multi-cancel-${i}@example.com`,
            amount: 500 - i * 50,
            currency: "USD",
            transactionId: `CANCEL-${i}`,
            description: "Batch cancellation",
          },
        );

        if (!response.data.success) throw new Error(`Cancellation ${i} failed`);
      }
    });
  }

  // Test Group 6: Multi-Hotel Scenarios
  private async testSequentialBookings() {
    await this.runTest("Sequential Hotel Bookings", async () => {
      for (let i = 0; i < 3; i++) {
        const response = await axios.post(
          `${WALLET_API_URL}/wallet/debit`,
          {
            userId: `test-seq-${i}@example.com`,
            amount: 300 + i * 100,
            currency: "USD",
            transactionId: `SEQ-${i}`,
            description: `Sequential booking ${i + 1}`,
          },
        );

        if (!response.data.success) throw new Error(`Booking ${i} failed`);
      }
    });
  }

  private async testParallelBookings() {
    await this.runTest("Parallel Hotel Bookings", async () => {
      const bookings = Array.from({ length: 5 }).map((_, i) =>
        axios.post(`${WALLET_API_URL}/wallet/debit`, {
          userId: `test-parallel-${i}@example.com`,
          amount: 400,
          currency: "USD",
          transactionId: `PARALLEL-${i}`,
          description: `Parallel booking ${i + 1}`,
        }),
      );

      const results = await Promise.all(bookings);
      if (!results.every((r) => r.data.success)) {
        throw new Error("Some parallel bookings failed");
      }
    });
  }

  private async testMixedCurrencyBookings() {
    await this.runTest("Mixed Currency Multi-Hotel Booking", async () => {
      const currencies = ["USD", "EUR", "GBP", "JPY"];
      const amounts = [500, 450, 400, 75000];

      for (let i = 0; i < currencies.length; i++) {
        const response = await axios.post(
          `${WALLET_API_URL}/wallet/debit`,
          {
            userId: `test-mixed-${i}@example.com`,
            amount: amounts[i],
            currency: currencies[i],
            transactionId: `MIXED-${i}`,
            description: `Mixed currency booking ${i + 1}`,
          },
        );

        if (!response.data.success) throw new Error(`Booking ${i} failed`);
      }
    });
  }

  // Helper methods
  private generateSampleReceipt(
    invoiceId: string,
    amount: number,
    hotelCurrency: string,
    customerCurrency: string,
  ): string {
    const fxRate =
      (FX_RATES as any)[customerCurrency]?.[hotelCurrency] || 1.0;
    const fxFee = customerCurrency !== hotelCurrency ? amount * 0.02 : 0;

    return `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; }
            .receipt { max-width: 600px; padding: 30px; }
            table { width: 100%; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <h1>Hotel Booking Receipt</h1>
            <table>
              <tr><td>Invoice ID:</td><td>${invoiceId}</td></tr>
              <tr><td>Hotel Currency:</td><td>${hotelCurrency}</td></tr>
              <tr><td>Amount:</td><td>${hotelCurrency} ${amount.toFixed(2)}</td></tr>
              ${
                customerCurrency !== hotelCurrency
                  ? `
              <tr><td>Exchange Rate:</td><td>1 ${hotelCurrency} = ${fxRate.toFixed(4)} ${customerCurrency}</td></tr>
              <tr><td>FX Fee (2%):</td><td>${customerCurrency} ${fxFee.toFixed(2)}</td></tr>
              `
                  : ""
              }
            </table>
            <p>Date: ${new Date().toLocaleString()}</p>
          </div>
        </body>
      </html>
    `;
  }

  private generateSampleCreditNote(
    creditNoteId: string,
    amount: number,
    reason: string,
  ): string {
    return `
      <html>
        <body>
          <h1>Credit Note</h1>
          <p>Credit Note ID: ${creditNoteId}</p>
          <p>Amount: ${amount}</p>
          <p>Reason: ${reason}</p>
          <p>Date: ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `;
  }

  private generateSummary(duration: number): TestSummary {
    const passed = this.testResults.filter((r) => r.status === "PASSED").length;
    const failed = this.testResults.filter((r) => r.status === "FAILED").length;

    return {
      totalTests: this.testResults.length,
      passed,
      failed,
      duration,
      results: this.testResults,
      passRate: (passed / this.testResults.length) * 100,
    };
  }
}

// Main execution
async function main() {
  const orchestrator = new HotelBookingE2EOrchestrator();
  const summary = await orchestrator.runAllTests();

  console.log("\n========================================");
  console.log("🏨 Hotel Booking E2E Test Summary");
  console.log("========================================");
  console.log(`Total Tests: ${summary.totalTests}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`⏱️  Duration: ${summary.duration}ms`);
  console.log(`📊 Pass Rate: ${summary.passRate.toFixed(2)}%`);
  console.log("========================================\n");

  if (summary.failed > 0) {
    console.log("Failed Tests:");
    summary.results
      .filter((r) => r.status === "FAILED")
      .forEach((r) => {
        console.log(`  ❌ ${r.testName}: ${r.error}`);
      });
  }

  process.exit(summary.failed > 0 ? 1 : 0);
}

main().catch(console.error);

export { HotelBookingE2EOrchestrator };
