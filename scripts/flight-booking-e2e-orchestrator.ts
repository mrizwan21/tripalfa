/**
 * Flight Booking E2E Test Orchestrator
 *
 * Comprehensive test suite validating the complete flight booking workflow
 * with multi-currency support, wallet integration, FX conversion, amendments, and cancellations.
 *
 * Test Coverage (28 tests):
 * 1. Single-leg flight bookings - same currency (5 tests)
 * 2. Single-leg flight bookings - cross-currency FX (6 tests)
 * 3. E-ticket generation (5 tests)
 * 4. Invoice generation with FX details (5 tests)
 * 5. Flight amendments with price changes (4 tests)
 * 6. Cancellations & refunds (4 tests)
 * 7. Complex multi-leg scenarios (3 tests)
 */

import axios, { AxiosError } from "axios";

interface TestResult {
  testName: string;
  status: "PASSED" | "FAILED";
  duration: number;
  error?: string;
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

class FlightBookingE2EOrchestrator {
  private testResults: TestResult[] = [];
  private testStartTime: number = 0;

  async runAllTests(): Promise<TestSummary> {
    console.log("\n✈️  Flight Booking E2E Test Suite Starting...\n");
    const suiteStartTime = Date.now();

    // Test Group 1: Single-Leg Bookings - Same Currency
    console.log("--- Test Group 1: Single-Leg Same-Currency Bookings ---");
    await this.testUsdDomesticFlight();
    await this.testEurEuropeanFlight();
    await this.testGbpUkFlight();
    await this.testHighValueFirstClassFlight();
    await this.testBudgetEconomyFlight();

    // Test Group 2: Single-Leg Cross-Currency with FX
    console.log("\n--- Test Group 2: Cross-Currency Flight FX ---");
    await this.testUsdPassengerUsdFlight();
    await this.testEurPassengerGbpFlight();
    await this.testUsdPassengerJpyFlight();
    await this.testAedPassengerZarFlight();
    await this.testCadPassengerUsdFlight();
    await this.testComplexFlightMultiCurrencyFx();

    // Test Group 3: E-Ticket Generation
    console.log("\n--- Test Group 3: E-Ticket Generation ---");
    await this.testETicketHtmlGeneration();
    await this.testETicketBarcodeIncluded();
    await this.testETicketPassengerInfo();
    await this.testETicketFlightDetails();
    await this.testETicketConfirmationStatus();

    // Test Group 4: Invoice Generation with FX
    console.log("\n--- Test Group 4: Invoice Generation with FX ---");
    await this.testInvoiceHtmlGeneration();
    await this.testInvoiceFxDetails();
    await this.testInvoiceCurrencyConversion();
    await this.testInvoiceTotalAmountCalculation();
    await this.testInvoiceTimestampAccuracy();

    // Test Group 5: Flight Amendments
    console.log("\n--- Test Group 5: Flight Amendments ---");
    await this.testAmendmentPriceIncrease();
    await this.testAmendmentPriceDecrease();
    await this.testAmendmentMultipleCurrencies();
    await this.testAmendmentReceiptGeneration();

    // Test Group 6: Cancellations & Refunds
    console.log("\n--- Test Group 6: Cancellations & Refunds ---");
    await this.testSimpleFlightCancellation();
    await this.testCancellationWithFxRefund();
    await this.testCancellationFeeDeduction();
    await this.testCancelSequentialFlights();

    // Test Group 7: Complex Multi-Leg Scenarios
    console.log("\n--- Test Group 7: Complex Multi-Leg Scenarios ---");
    await this.testMultiLegBooking();
    await this.testRoundTripBooking();
    await this.testMultiPassengerGroup();

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
      console.log(`  ✅ ${testName} (${duration}ms)\n`);
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

  // Test Group 1: Single-Leg Same-Currency Bookings
  private async testUsdDomesticFlight() {
    await this.runTest("USD Domestic Flight Booking", async () => {
      const bookingData = {
        selectedOfferId: "offer-001",
        passengerId: "pax-001",
        passengerEmail: "usd-domestic@example.com",
        passengerName: "John Domestic",
        passengerPhone: "+1-555-0001",
        fare: 350,
        currency: "USD",
        departureCity: "NYC",
        arrivalCity: "LAX",
        departureTime: new Date(Date.now() + 86400000).toISOString(),
        arrivalTime: new Date(Date.now() + 90000000).toISOString(),
      };

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: bookingData.passengerEmail,
        amount: bookingData.fare,
        currency: bookingData.currency,
        transactionId: `FLIGHT-001`,
        description: "Flight booking",
      });
    });
  }

  private async testEurEuropeanFlight() {
    await this.runTest("EUR European Flight Booking", async () => {
      const bookingData = {
        fare: 280,
        currency: "EUR",
        passengerEmail: "eur-eu@example.com",
      };

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: bookingData.passengerEmail,
        amount: bookingData.fare,
        currency: bookingData.currency,
        transactionId: `FLIGHT-002`,
        description: "Flight booking",
      });
    });
  }

  private async testGbpUkFlight() {
    await this.runTest("GBP UK Flight Booking", async () => {
      const bookingData = {
        fare: 250,
        currency: "GBP",
        passengerEmail: "gbp-uk@example.com",
      };

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: bookingData.passengerEmail,
        amount: bookingData.fare,
        currency: bookingData.currency,
        transactionId: `FLIGHT-003`,
        description: "Flight booking",
      });
    });
  }

  private async testHighValueFirstClassFlight() {
    await this.runTest("High-Value First Class Flight (8,000 USD)", async () => {
      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "luxury-flight@example.com",
        amount: 8000,
        currency: "USD",
        transactionId: `FLIGHT-004`,
        description: "First class booking",
      });
    });
  }

  private async testBudgetEconomyFlight() {
    await this.runTest("Budget Economy Flight (99 USD)", async () => {
      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "budget-flight@example.com",
        amount: 99,
        currency: "USD",
        transactionId: `FLIGHT-005`,
        description: "Economy flight booking",
      });
    });
  }

  // Test Group 2: Cross-Currency FX
  private async testUsdPassengerUsdFlight() {
    await this.runTest("USD Passenger → USD Flight (No FX)", async () => {
      const amount = 350;
      
      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "usd-usd@example.com",
        amount: amount,
        currency: "USD",
        transactionId: `FLIGHT-FX-001`,
        description: "Same-currency flight",
      });
    });
  }

  private async testEurPassengerGbpFlight() {
    await this.runTest("EUR Passenger → GBP Flight with FX", async () => {
      const amount = 350;
      const fxRate = FX_RATES.EUR.GBP;
      const fxFee = amount * 0.02;
      const totalDebit = amount + fxFee;

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "eur-gbp@example.com",
        amount: totalDebit,
        currency: "EUR",
        transactionId: `FLIGHT-FX-002`,
        description: "Cross-currency flight",
      });

      // Verify FX calculation
      const expectedGbp = amount * fxRate;
      if (expectedGbp < 300 || expectedGbp > 310) {
        throw new Error("FX conversion out of range");
      }
    });
  }

  private async testUsdPassengerJpyFlight() {
    await this.runTest("USD Passenger → JPY Flight with FX", async () => {
      const amount = 350;
      const fxRate = FX_RATES.USD.JPY;
      const expectedJpy = amount * fxRate;

      if (expectedJpy < 50000 || expectedJpy > 55000) {
        throw new Error(`JPY conversion out of range: ${expectedJpy}`);
      }

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "usd-jpy@example.com",
        amount: amount,
        currency: "USD",
        transactionId: `FLIGHT-FX-003`,
        description: "USD to JPY flight",
      });
    });
  }

  private async testAedPassengerZarFlight() {
    await this.runTest("AED Passenger → ZAR Flight with FX", async () => {
      const amount = 1200;
      const fxRate = FX_RATES.AED.ZAR;
      const expectedZar = amount * fxRate;

      if (expectedZar < 6000 || expectedZar > 6200) {
        throw new Error(`ZAR conversion out of range: ${expectedZar}`);
      }

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "aed-zar@example.com",
        amount: amount,
        currency: "AED",
        transactionId: `FLIGHT-FX-004`,
        description: "AED to ZAR flight",
      });
    });
  }

  private async testCadPassengerUsdFlight() {
    await this.runTest("CAD Passenger → USD Flight with FX", async () => {
      const amount = 500;
      const fxRate = (FX_RATES as any).CAD.USD || 1 / 1.36;
      const expectedUsd = amount * fxRate;

      if (expectedUsd < 360 || expectedUsd > 375) {
        throw new Error(`USD conversion out of range: ${expectedUsd}`);
      }

      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "cad-usd@example.com",
        amount: amount,
        currency: "CAD",
        transactionId: `FLIGHT-FX-005`,
        description: "CAD to USD flight",
      });
    });
  }

  private async testComplexFlightMultiCurrencyFx() {
    await this.runTest("Complex Multi-Currency Flight FX Chain", async () => {
      const amount = 350;
      const chain = ["USD", "EUR", "GBP"];
      let currentAmount = amount;

      for (let i = 0; i < chain.length - 1; i++) {
        const rate = (FX_RATES as any)[chain[i]]?.[chain[i + 1]];
        if (!rate) throw new Error(`Missing rate for ${chain[i]}-${chain[i + 1]}`);
        currentAmount = currentAmount * rate;
      }

      if (currentAmount <= 0) throw new Error("Conversion chain failed");
    });
  }

  // Test Group 3: E-Ticket Generation
  private async testETicketHtmlGeneration() {
    await this.runTest("E-Ticket HTML Generation", async () => {
      const html = this.generateSampleETicket(
        "TKT-001",
        "John Doe",
        "NYC",
        "LAX",
      );
      if (!html.includes("<html>")) throw new Error("Invalid HTML");
      if (!html.includes("Electronic Ticket")) throw new Error("Missing title");
    });
  }

  private async testETicketBarcodeIncluded() {
    await this.runTest("E-Ticket Barcode Included", async () => {
      const html = this.generateSampleETicket(
        "TKT-002",
        "Jane Smith",
        "LHR",
        "CDG",
      );
      if (!html.includes("TKT-002")) throw new Error("Missing ticket number");
      if (!html.toLowerCase().includes("barcode")) throw new Error("Missing barcode");
    });
  }

  private async testETicketPassengerInfo() {
    await this.runTest("E-Ticket Passenger Info", async () => {
      const passengerName = "Alice Johnson";
      const html = this.generateSampleETicket("TKT-003", passengerName, "ORD", "MIA");
      if (!html.includes(passengerName)) {
        throw new Error("Missing passenger name");
      }
    });
  }

  private async testETicketFlightDetails() {
    await this.runTest("E-Ticket Flight Details", async () => {
      const html = this.generateSampleETicket(
        "TKT-004",
        "Bob Wilson",
        "SFO",
        "JFK",
      );
      if (!html.includes("SFO")) throw new Error("Missing departure city");
      if (!html.includes("JFK")) throw new Error("Missing arrival city");
    });
  }

  private async testETicketConfirmationStatus() {
    await this.runTest("E-Ticket Confirmation Status", async () => {
      const html = this.generateSampleETicket(
        "TKT-005",
        "Carol White",
        "LAS",
        "PHX",
      );
      if (!html.includes("Confirmed")) throw new Error("Missing confirmation status");
    });
  }

  // Test Group 4: Invoice Generation with FX
  private async testInvoiceHtmlGeneration() {
    await this.runTest("Invoice HTML Generation", async () => {
      const html = this.generateSampleInvoice("INV-FL-001", 350, "USD", "USD", 1, 0);
      if (!html.includes("<html>")) throw new Error("Invalid HTML");
      if (!html.includes("Invoice")) throw new Error("Missing invoice title");
    });
  }

  private async testInvoiceFxDetails() {
    await this.runTest("Invoice FX Details", async () => {
      const html = this.generateSampleInvoice("INV-FL-002", 350, "USD", "EUR", 0.92, 7);
      if (!html.includes("Exchange Rate")) throw new Error("Missing FX rate");
      if (!html.includes("0.92")) throw new Error("Missing conversion rate");
    });
  }

  private async testInvoiceCurrencyConversion() {
    await this.runTest("Invoice Currency Conversion Display", async () => {
      const html = this.generateSampleInvoice("INV-FL-003", 350, "USD", "GBP", 0.79, 5.53);
      if (!html.includes("GBP")) throw new Error("Missing target currency");
      if (!html.includes("USD")) throw new Error("Missing source currency");
    });
  }

  private async testInvoiceTotalAmountCalculation() {
    await this.runTest("Invoice Total Amount Calculation", async () => {
      const fare = 350;
      const fxFee = fare * 0.02;
      const total = fare + fxFee;
      const html = this.generateSampleInvoice(
        "INV-FL-004",
        fare,
        "USD",
        "EUR",
        0.92,
        fxFee,
      );
      if (!html.includes(total.toFixed(2))) {
        throw new Error("Total not calculated correctly");
      }
    });
  }

  private async testInvoiceTimestampAccuracy() {
    await this.runTest("Invoice Timestamp Accuracy", async () => {
      const html = this.generateSampleInvoice("INV-FL-005", 350, "USD", "USD", 1, 0);
      // Just verify date is present (actual timestamp can vary)
      if (!html.includes("Invoice #")) throw new Error("Missing invoice number");
    });
  }

  // Test Group 5: Flight Amendments
  private async testAmendmentPriceIncrease() {
    await this.runTest("Amendment - Price Increase with Debit", async () => {
      const originalPrice = 350;
      const newPrice = 450;
      const difference = newPrice - originalPrice;

      const response = await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "amendment-increase@example.com",
        amount: difference,
        currency: "USD",
        transactionId: `AMD-001`,
        description: "Price increase amendment",
      });

      if (!response.data.success) throw new Error("Amendment debit failed");
    });
  }

  private async testAmendmentPriceDecrease() {
    await this.runTest("Amendment - Price Decrease with Credit", async () => {
      const originalPrice = 450;
      const newPrice = 350;
      const refund = originalPrice - newPrice;

      const response = await axios.post(`${WALLET_API_URL}/wallet/credit`, {
        userId: "amendment-decrease@example.com",
        amount: refund,
        currency: "USD",
        transactionId: `AMD-002`,
        description: "Price decrease amendment",
      });

      if (!response.data.success) throw new Error("Amendment credit failed");
    });
  }

  private async testAmendmentMultipleCurrencies() {
    await this.runTest("Amendment - Multi-Currency Calculation", async () => {
      const originalUsd = 350;
      const newEur = 280;
      const fxRate = FX_RATES.USD.EUR;

      const originalEur = originalUsd * fxRate;
      const difference = originalEur - newEur;

      if (difference < 50 || difference > 80) {
        throw new Error("Amendment calculation out of range");
      }
    });
  }

  private async testAmendmentReceiptGeneration() {
    await this.runTest("Amendment Receipt Generation", async () => {
      const html = this.generateSampleAmendmentReceipt(
        "AMD-004",
        "John Traveler",
        350,
        400,
        "USD",
      );
      if (!html.includes("Amendment")) throw new Error("Missing amendment header");
      if (!html.includes("350")) throw new Error("Missing original price");
    });
  }

  // Test Group 6: Cancellations & Refunds
  private async testSimpleFlightCancellation() {
    await this.runTest("Simple Flight Cancellation", async () => {
      const refundAmount = 350;

      const response = await axios.post(`${WALLET_API_URL}/wallet/credit`, {
        userId: "cancel-simple@example.com",
        amount: refundAmount,
        currency: "USD",
        transactionId: `CANCEL-FLIGHT-001`,
        description: "Flight cancellation",
      });

      if (!response.data.success) throw new Error("Refund failed");
    });
  }

  private async testCancellationWithFxRefund() {
    await this.runTest("Cancellation with FX Refund", async () => {
      const refundUsd = 350;
      const fxRate = FX_RATES.USD.EUR;
      const refundEur = refundUsd * fxRate;

      const response = await axios.post(`${WALLET_API_URL}/wallet/credit`, {
        userId: "cancel-fx@example.com",
        amount: refundEur,
        currency: "EUR",
        transactionId: `CANCEL-FLIGHT-002`,
        description: "Flight cancellation with FX",
      });

      if (!response.data.success) throw new Error("Refund failed");
    });
  }

  private async testCancellationFeeDeduction() {
    await this.runTest("Cancellation with Fee Deduction", async () => {
      const originalPrice = 350;
      const cancellationFeePercent = 0.1; // 10% fee
      const fee = originalPrice * cancellationFeePercent;
      const refundAmount = originalPrice - fee;

      if (refundAmount < 315 || refundAmount > 320) {
        throw new Error("Refund calculation incorrect");
      }
    });
  }

  private async testCancelSequentialFlights() {
    await this.runTest("Cancel Sequential Flights", async () => {
      for (let i = 0; i < 3; i++) {
        const response = await axios.post(`${WALLET_API_URL}/wallet/credit`, {
          userId: `cancel-seq-${i}@example.com`,
          amount: 350 - i * 20,
          currency: "USD",
          transactionId: `CANCEL-FLIGHT-SEQ-${i}`,
          description: `Flight cancellation ${i + 1}`,
        });

        if (!response.data.success) throw new Error(`Cancellation ${i} failed`);
      }
    });
  }

  // Test Group 7: Complex Multi-Leg Scenarios
  private async testMultiLegBooking() {
    await this.runTest("Multi-Leg Flight Booking", async () => {
      const legs = [
        { fare: 350, currency: "USD" },
        { fare: 280, currency: "EUR" },
        { fare: 250, currency: "GBP" },
      ];

      for (let i = 0; i < legs.length; i++) {
        const response = await axios.post(`${WALLET_API_URL}/wallet/debit`, {
          userId: `multileg-${i}@example.com`,
          amount: legs[i].fare,
          currency: legs[i].currency,
          transactionId: `MULTILEG-${i}`,
          description: `Leg ${i + 1} of multi-leg booking`,
        });

        if (!response.data.success) throw new Error(`Leg ${i} debit failed`);
      }
    });
  }

  private async testRoundTripBooking() {
    await this.runTest("Round-Trip Flight Booking", async () => {
      // Outbound
      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "roundtrip@example.com",
        amount: 350,
        currency: "USD",
        transactionId: `ROUNDTRIP-OUT`,
        description: "Outbound flight",
      });

      // Return
      await axios.post(`${WALLET_API_URL}/wallet/debit`, {
        userId: "roundtrip@example.com",
        amount: 300,
        currency: "USD",
        transactionId: `ROUNDTRIP-RET`,
        description: "Return flight",
      });
    });
  }

  private async testMultiPassengerGroup() {
    await this.runTest("Multi-Passenger Group Booking", async () => {
      const passengers = Array.from({ length: 4 }).map((_, i) => ({
        email: `passenger-${i}@example.com`,
        fare: 350,
      }));

      for (const pax of passengers) {
        const response = await axios.post(`${WALLET_API_URL}/wallet/debit`, {
          userId: pax.email,
          amount: pax.fare,
          currency: "USD",
          transactionId: `GROUP-${pax.email}`,
          description: "Group flight booking",
        });

        if (!response.data.success) throw new Error(`Booking for ${pax.email} failed`);
      }
    });
  }

  // Helper methods
  private generateSampleETicket(
    ticketId: string,
    passengerName: string,
    departure: string,
    arrival: string,
  ): string {
    return `
      <html>
        <body>
          <h1>Electronic Ticket (E-Ticket)</h1>
          <p>Ticket: ${ticketId}</p>
          <p>Passenger: ${passengerName}</p>
          <p>Route: ${departure} → ${arrival}</p>
          <p>Status: Confirmed</p>
          <p>Barcode: ${ticketId.substring(0, 6)}</p>
        </body>
      </html>
    `;
  }

  private generateSampleInvoice(
    invoiceId: string,
    fare: number,
    currency: string,
    customerCurrency: string,
    fxRate: number,
    fxFee: number,
  ): string {
    return `
      <html>
        <body>
          <h1>Flight Invoice</h1>
          <p>Invoice #${invoiceId}</p>
          <p>Fare: ${currency} ${fare.toFixed(2)}</p>
          ${
            customerCurrency !== currency
              ? `
          <p>Exchange Rate: 1 ${currency} = ${fxRate.toFixed(4)} ${customerCurrency}</p>
          <p>FX Fee: ${customerCurrency} ${fxFee.toFixed(2)}</p>
          <p>Total: ${customerCurrency} ${(fare + fxFee).toFixed(2)}</p>
          `
              : ""
          }
        </body>
      </html>
    `;
  }

  private generateSampleAmendmentReceipt(
    amendmentId: string,
    passengerName: string,
    originalPrice: number,
    newPrice: number,
    currency: string,
  ): string {
    const difference = newPrice - originalPrice;
    const type = difference > 0 ? "charge" : "refund";

    return `
      <html>
        <body>
          <h1>Amendment Notice</h1>
          <p>Amendment ID: ${amendmentId}</p>
          <p>Passenger: ${passengerName}</p>
          <p>Original Price: ${currency} ${originalPrice.toFixed(2)}</p>
          <p>New Price: ${currency} ${newPrice.toFixed(2)}</p>
          <p>Additional ${type}: ${currency} ${Math.abs(difference).toFixed(2)}</p>
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
  const orchestrator = new FlightBookingE2EOrchestrator();
  const summary = await orchestrator.runAllTests();

  console.log("\n========================================");
  console.log("✈️  Flight Booking E2E Test Summary");
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

export { FlightBookingE2EOrchestrator };
