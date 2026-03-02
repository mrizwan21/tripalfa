/**
 * Marketplace Transaction Orchestrator - Multi-Currency E2E Testing
 *
 * Comprehensive end-to-end testing for marketplace transactions involving:
 * - Customer-to-Supplier payments
 * - Multi-currency support with FX conversion
 * - Automatic receipt generation
 * - Email notification tracking
 * - Credit/Debit operations for both customer and supplier
 * - Reconciliation and audit trails
 *
 * Run: npm run test:api:marketplace:transactions
 */

import axios from "axios";
import { randomUUID } from "crypto";

// FX Conversion Rates (simplified for testing - would use real rates in production)
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

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

interface Merchant {
  id: string;
  name: string;
  currency: string;
  email: string;
}

interface Customer {
  id: string;
  name: string;
  currency: string;
  email: string;
}

interface Transaction {
  id: string;
  customerId: string;
  supplierId: string;
  amount: number;
  customerCurrency: string;
  supplierCurrency: string;
  fxRate: number;
  supplierAmount: number;
  fxFee: number;
  timestamp: string;
  status: "pending" | "completed" | "failed";
  receiptId?: string;
}

interface Receipt {
  id: string;
  transactionId: string;
  customerId: string;
  supplierId: string;
  customerAmount: number;
  customerCurrency: string;
  supplierAmount: number;
  supplierCurrency: string;
  fxRate: number;
  fxFee: number;
  itemDescription: string;
  timestamp: string;
  html: string;
}

interface EmailNotification {
  id: string;
  transactionId: string;
  recipientEmail: string;
  recipientType: "customer" | "supplier";
  type: "receipt" | "payment_confirmation" | "credit_notification";
  subject: string;
  status: "sent" | "failed";
  timestamp: string;
}

interface TestResult {
  testName: string;
  status: "passed" | "failed";
  duration: number;
  error?: string;
  data?: any;
}

// ============================================================================
// MARKETPLACE TRANSACTION API CLIENT
// ============================================================================

class MarketplaceTransactionClient {
  baseUrl: string;
  private testResults: TestResult[] = [];
  private transactions: Transaction[] = [];
  private receipts: Receipt[] = [];
  private notifications: EmailNotification[] = [];

  constructor(baseUrl = "http://localhost:3000/api") {
    this.baseUrl = baseUrl;
  }

  // Customer Debit Operations
  async customerDebit(customerId: string, amount: number, currency: string) {
    try {
      const response = await axios.post(`${this.baseUrl}/wallet/debit`, {
        userId: customerId,
        amount,
        currency,
        transactionType: "marketplace_purchase",
        idempotencyKey: randomUUID(),
      });
      return response.data;
    } catch (error) {
      console.error("Error debiting customer wallet:", error);
      return null;
    }
  }

  // Supplier Credit Operations
  async supplierCredit(
    supplierId: string,
    amount: number,
    currency: string,
    sourceCustomerId: string,
  ) {
    try {
      const response = await axios.post(`${this.baseUrl}/wallet/credit`, {
        userId: supplierId,
        amount,
        currency,
        transactionType: "marketplace_payment",
        sourceCustomerId,
        idempotencyKey: randomUUID(),
      });
      return response.data;
    } catch (error) {
      console.error("Error crediting supplier wallet:", error);
      return null;
    }
  }

  // FX Conversion
  getConversionRate(fromCurrency: string, toCurrency: string): number {
    if (fromCurrency === toCurrency) return 1.0;
    return FX_RATES[fromCurrency]?.[toCurrency] || 1.0;
  }

  // Calculate FX Fee (percentage-based)
  calculateFxFee(amount: number, fxRate: number): number {
    return fxRate !== 1.0 ? amount * 0.02 : 0; // 2% FX fee for cross-currency
  }

  // Generate Receipt
  generateReceipt(
    transactionId: string,
    customerId: string,
    supplierId: string,
    customerAmount: number,
    customerCurrency: string,
    supplierAmount: number,
    supplierCurrency: string,
    fxRate: number,
    fxFee: number,
    itemDescription: string,
  ): Receipt {
    const receiptId = `RCP-${Date.now()}`;
    const timestamp = new Date().toISOString();

    const html = `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
            .receipt { background: white; max-width: 800px; margin: 0 auto; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
            .header { border-bottom: 2px solid #667eea; padding-bottom: 20px; margin-bottom: 20px; }
            h1 { color: #333; margin: 0; }
            .receipt-id { color: #666; font-size: 12px; margin-top: 5px; }
            .section { margin: 20px 0; }
            .section-title { font-weight: bold; color: #333; margin-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; }
            td { padding: 8px; border-bottom: 1px solid #ddd; }
            td.label { font-weight: bold; width: 40%; }
            .amount { color: #667eea; font-size: 18px; font-weight: bold; }
            .fx-section { background: #f9f9f9; padding: 15px; border-radius: 5px; margin: 10px 0; }
            .footer { border-top: 1px solid #ddd; margin-top: 20px; padding-top: 20px; font-size: 12px; color: #666; }
            .status { color: #28a745; font-weight: bold; }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>Payment Receipt</h1>
              <div class="receipt-id">Receipt ID: ${receiptId} | Date: ${timestamp}</div>
            </div>

            <div class="section">
              <div class="section-title">Transaction Details</div>
              <table>
                <tr><td class="label">Transaction ID:</td><td>${transactionId}</td></tr>
                <tr><td class="label">Status:</td><td><span class="status">✓ Completed</span></td></tr>
                <tr><td class="label">Item/Service:</td><td>${itemDescription}</td></tr>
              </table>
            </div>

            <div class="section">
              <div class="section-title">Payment Information</div>
              <table>
                <tr><td class="label">Customer Amount:</td><td><span class="amount">${customerCurrency} ${customerAmount.toFixed(2)}</span></td></tr>
                <tr><td class="label">Payment Status:</td><td>✓ Deducted from your wallet</td></tr>
              </table>
            </div>

            ${
              customerCurrency !== supplierCurrency
                ? `
            <div class="fx-section">
              <div class="section-title">Currency Conversion Details</div>
              <table>
                <tr><td class="label">Exchange Rate:</td><td>1 ${customerCurrency} = ${fxRate.toFixed(4)} ${supplierCurrency}</td></tr>
                <tr><td class="label">Supplier Receives:</td><td><span class="amount">${supplierCurrency} ${supplierAmount.toFixed(2)}</span></td></tr>
                <tr><td class="label">FX Fee (2%):</td><td>${customerCurrency} ${fxFee.toFixed(2)}</td></tr>
              </table>
            </div>
            `
                : ""
            }

            <div class="section">
              <div class="section-title">Supplier Information</div>
              <table>
                <tr><td class="label">Merchant ID:</td><td>${supplierId}</td></tr>
                <tr><td class="label">Payment Currency:</td><td>${supplierCurrency}</td></tr>
              </table>
            </div>

            <div class="footer">
              <p><strong>Thank you for your purchase!</strong></p>
              <p>This receipt confirms the payment and currency conversion details. Please retain this receipt for your records.</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `;

    const receipt: Receipt = {
      id: receiptId,
      transactionId,
      customerId,
      supplierId,
      customerAmount,
      customerCurrency,
      supplierAmount,
      supplierCurrency,
      fxRate,
      fxFee,
      itemDescription,
      timestamp,
      html,
    };

    this.receipts.push(receipt);
    return receipt;
  }

  // Send Email Notification
  async sendEmailNotification(
    transactionId: string,
    recipientEmail: string,
    recipientType: "customer" | "supplier",
    type: "receipt" | "payment_confirmation" | "credit_notification",
    subject: string,
    receiptHtml?: string,
  ): Promise<EmailNotification> {
    try {
      await axios.post(`${this.baseUrl}/notifications/email`, {
        transactionId,
        recipientEmail,
        recipientType,
        type,
        subject,
        htmlBody: receiptHtml,
        idempotencyKey: randomUUID(),
      });

      const notification: EmailNotification = {
        id: `NOTIF-${Date.now()}`,
        transactionId,
        recipientEmail,
        recipientType,
        type,
        subject,
        status: "sent",
        timestamp: new Date().toISOString(),
      };

      this.notifications.push(notification);
      return notification;
    } catch (error) {
      console.error("Error sending email notification:", error);
      return {
        id: `NOTIF-${Date.now()}`,
        transactionId,
        recipientEmail,
        recipientType,
        type,
        subject,
        status: "failed",
        timestamp: new Date().toISOString(),
      };
    }
  }

  // Execute marketplace transaction (customer → supplier)
  async executeMarketplaceTransaction(
    customerId: string,
    supplierId: string,
    amount: number,
    customerCurrency: string,
    supplierCurrency: string,
    itemDescription: string,
    customerEmail: string,
    supplierEmail: string,
  ): Promise<{
    transaction: Transaction | null;
    receipt: Receipt | null;
    notifications: EmailNotification[];
  }> {
    const transactionId = `TXN-${Date.now()}`;
    const timestamp = new Date().toISOString();

    // Step 1: Calculate FX conversion
    const fxRate = this.getConversionRate(customerCurrency, supplierCurrency);
    const supplierAmount = amount * fxRate;
    const fxFee = this.calculateFxFee(amount, fxRate);

    console.log(
      `\n💳 Marketplace Transaction: ${customerId} → ${supplierId}`,
    );
    console.log(`   Customer: ${customerCurrency} ${amount.toFixed(2)}`);
    console.log(`   FX Rate: ${fxRate.toFixed(4)}`);
    console.log(`   Supplier: ${supplierCurrency} ${supplierAmount.toFixed(2)}`);
    if (fxFee > 0) console.log(`   FX Fee: ${customerCurrency} ${fxFee.toFixed(2)}`);

    // Step 2: Debit customer wallet
    const customerDebit = await this.customerDebit(
      customerId,
      amount + fxFee,
      customerCurrency,
    );
    if (!customerDebit) {
      console.error("✗ Failed to debit customer wallet");
      return { transaction: null, receipt: null, notifications: [] };
    }
    console.log(`✓ Customer debited: ${customerCurrency} ${(amount + fxFee).toFixed(2)}`);

    // Step 3: Credit supplier wallet
    const supplierCredit = await this.supplierCredit(
      supplierId,
      supplierAmount,
      supplierCurrency,
      customerId,
    );
    if (!supplierCredit) {
      console.error("✗ Failed to credit supplier wallet");
      return { transaction: null, receipt: null, notifications: [] };
    }
    console.log(
      `✓ Supplier credited: ${supplierCurrency} ${supplierAmount.toFixed(2)}`,
    );

    // Step 4: Generate receipt
    const receipt = this.generateReceipt(
      transactionId,
      customerId,
      supplierId,
      amount,
      customerCurrency,
      supplierAmount,
      supplierCurrency,
      fxRate,
      fxFee,
      itemDescription,
    );
    console.log(`✓ Receipt generated: ${receipt.id}`);

    // Step 5: Send email notifications
    const notifications: EmailNotification[] = [];

    const customerNotif = await this.sendEmailNotification(
      transactionId,
      customerEmail,
      "customer",
      "receipt",
      `Payment Receipt - ${itemDescription}`,
      receipt.html,
    );
    notifications.push(customerNotif);
    console.log(
      `✓ Customer notification sent to ${customerEmail} (${customerNotif.status})`,
    );

    const supplierNotif = await this.sendEmailNotification(
      transactionId,
      supplierEmail,
      "supplier",
      "credit_notification",
      `Payment Received - ${itemDescription}`,
    );
    notifications.push(supplierNotif);
    console.log(
      `✓ Supplier notification sent to ${supplierEmail} (${supplierNotif.status})`,
    );

    // Step 6: Record transaction
    const transaction: Transaction = {
      id: transactionId,
      customerId,
      supplierId,
      amount,
      customerCurrency,
      supplierCurrency,
      fxRate,
      supplierAmount,
      fxFee,
      timestamp,
      status: "completed",
      receiptId: receipt.id,
    };

    this.transactions.push(transaction);

    return { transaction, receipt, notifications };
  }

  // Get transaction history
  getTransactions(): Transaction[] {
    return this.transactions;
  }

  // Get receipts
  getReceipts(): Receipt[] {
    return this.receipts;
  }

  // Get notifications
  getNotifications(): EmailNotification[] {
    return this.notifications;
  }

  // Record test result
  recordTestResult(result: TestResult): void {
    this.testResults.push(result);
  }

  // Get test results
  getTestResults(): TestResult[] {
    return this.testResults;
  }

  // Get test summary
  getTestSummary() {
    const passed = this.testResults.filter((r) => r.status === "passed").length;
    const failed = this.testResults.filter((r) => r.status === "failed").length;
    const totalDuration = this.testResults.reduce((sum, r) => sum + r.duration, 0);

    return {
      total: this.testResults.length,
      passed,
      failed,
      passRate: ((passed / this.testResults.length) * 100).toFixed(1),
      totalDuration: (totalDuration / 1000).toFixed(1),
      transactions: this.transactions.length,
      receipts: this.receipts.length,
      notifications: this.notifications.length,
    };
  }
}

// ============================================================================
// TEST SUITE IMPLEMENTATION
// ============================================================================

class MarketplaceTransactionTestSuite {
  private client: MarketplaceTransactionClient;
  private verbose: boolean;

  // Test merchants and customers
  private merchants = {
    supplier1_usd: {
      id: "SUP-001",
      name: "Electronics Store (USD)",
      currency: "USD",
      email: "supplier1@marketplace.com",
    },
    supplier2_eur: {
      id: "SUP-002",
      name: "Fashion Boutique (EUR)",
      currency: "EUR",
      email: "supplier2@marketplace.com",
    },
    supplier3_jpy: {
      id: "SUP-003",
      name: "Japanese Goods (JPY)",
      currency: "JPY",
      email: "supplier3@marketplace.com",
    },
  };

  private customers = {
    customer1_usd: {
      id: "CUST-001",
      name: "John Doe (USD)",
      currency: "USD",
      email: "john@customer.com",
    },
    customer2_eur: {
      id: "CUST-002",
      name: "Maria Garcia (EUR)",
      currency: "EUR",
      email: "maria@customer.com",
    },
    customer3_jpy: {
      id: "CUST-003",
      name: "Yuki Tanaka (JPY)",
      currency: "JPY",
      email: "yuki@customer.com",
    },
    customer4_gbp: {
      id: "CUST-004",
      name: "Sophie Johnson (GBP)",
      currency: "GBP",
      email: "sophie@customer.com",
    },
  };

  constructor(verbose = false) {
    this.client = new MarketplaceTransactionClient();
    this.verbose = verbose;
  }

  private log(message: string, data?: any): void {
    if (this.verbose) {
      console.log(`[MarketplaceTest] ${message}`, data || "");
    }
  }

  private async test(
    name: string,
    testFn: () => Promise<boolean>,
  ): Promise<TestResult> {
    const startTime = Date.now();
    let status: "passed" | "failed" = "passed";
    let error: string | undefined;

    try {
      const result = await testFn();
      if (!result) {
        status = "failed";
        error = "Test assertion failed";
      }
    } catch (err) {
      status = "failed";
      error = String(err);
    }

    const duration = Date.now() - startTime;
    const result: TestResult = {
      testName: name,
      status,
      duration,
      error,
    };

    this.client.recordTestResult(result);
    this.printTestResult(result);
    return result;
  }

  private printTestResult(result: TestResult): void {
    const statusIcon = result.status === "passed" ? "✓" : "✗";
    const time = result.duration.toFixed(0);
    console.log(
      `  ${statusIcon} ${result.testName} (${time}ms)${result.error ? ` - ${result.error}` : ""}`,
    );
  }

  // ========================================================================
  // TEST SCENARIOS
  // ========================================================================

  async testSameCurrencyTransaction(): Promise<void> {
    console.log("\n💳 Testing: Same Currency Transactions");
    console.log("─".repeat(60));

    const { customer1_usd } = this.customers;
    const { supplier1_usd } = this.merchants;

    await this.test(
      "Same currency transaction (USD → USD)",
      async () => {
        const result = await this.client.executeMarketplaceTransaction(
          customer1_usd.id,
          supplier1_usd.id,
          100,
          customer1_usd.currency,
          supplier1_usd.currency,
          "Laptop Computer",
          customer1_usd.email,
          supplier1_usd.email,
        );
        return (
          result.transaction !== null &&
          result.transaction.fxRate === 1.0 &&
          result.transaction.fxFee === 0 &&
          result.receipt !== null
        );
      },
    );

    await this.test(
      "Verify customer received receipt",
      async () => {
        const receipts = this.client.getReceipts();
        return (
          receipts.length > 0 && receipts[receipts.length - 1].html.length > 100
        );
      },
    );

    await this.test(
      "Verify customer received email notification",
      async () => {
        const notifications = this.client.getNotifications();
        const customerNotif = notifications.find(
          (n) =>
            n.recipientType === "customer" && n.type === "receipt",
        );
        return customerNotif !== undefined && customerNotif.status === "sent";
      },
    );

    await this.test(
      "Verify supplier received credit notification",
      async () => {
        const notifications = this.client.getNotifications();
        const supplierNotif = notifications.find(
          (n) =>
            n.recipientType === "supplier" &&
            n.type === "credit_notification",
        );
        return supplierNotif !== undefined && supplierNotif.status === "sent";
      },
    );
  }

  async testCrossCurrencyTransaction(): Promise<void> {
    console.log("\n🌍 Testing: Cross-Currency Transactions with FX");
    console.log("─".repeat(60));

    const scenarios = [
      {
        name: "USD Customer → EUR Supplier",
        customer: this.customers.customer1_usd,
        supplier: this.merchants.supplier2_eur,
        amount: 100,
        description: "Designer Handbag",
      },
      {
        name: "EUR Customer → JPY Supplier",
        customer: this.customers.customer2_eur,
        supplier: this.merchants.supplier3_jpy,
        amount: 50,
        description: "Japanese Ceramics",
      },
      {
        name: "GBP Customer → USD Supplier",
        customer: this.customers.customer4_gbp,
        supplier: this.merchants.supplier1_usd,
        amount: 75,
        description: "Wireless Headphones",
      },
    ];

    for (const scenario of scenarios) {
      await this.test(
        `Cross-currency: ${scenario.name}`,
        async () => {
          const result = await this.client.executeMarketplaceTransaction(
            scenario.customer.id,
            scenario.supplier.id,
            scenario.amount,
            scenario.customer.currency,
            scenario.supplier.currency,
            scenario.description,
            scenario.customer.email,
            scenario.supplier.email,
          );
          return (
            result.transaction !== null &&
            result.transaction.fxRate !== 1.0 &&
            result.transaction.fxFee > 0 &&
            result.receipt !== null &&
            result.receipt.html.includes("Currency Conversion Details")
          );
        },
      );
    }
  }

  async testReceiptGeneration(): Promise<void> {
    console.log("\n📄 Testing: Receipt Generation & Content");
    console.log("─".repeat(60));

    await this.test(
      "Receipt contains transaction ID",
      async () => {
        const receipts = this.client.getReceipts();
        return receipts.some((r) => r.html.includes(r.transactionId));
      },
    );

    await this.test(
      "Receipt contains customer currency amount",
      async () => {
        const receipts = this.client.getReceipts();
        return receipts.some((r) =>
          r.html.includes(`${r.customerCurrency} ${r.customerAmount.toFixed(2)}`),
        );
      },
    );

    await this.test(
      "Receipt contains FX conversion details (if applicable)",
      async () => {
        const receipts = this.client.getReceipts();
        const fxReceipts = receipts.filter(
          (r) => r.customerCurrency !== r.supplierCurrency,
        );
        return fxReceipts.every((r) =>
          r.html.includes("Currency Conversion Details"),
        );
      },
    );

    await this.test(
      "Receipt contains supplier information",
      async () => {
        const receipts = this.client.getReceipts();
        return receipts.every((r) => r.html.includes(r.supplierId));
      },
    );

    await this.test(
      "Receipt HTML is well-formed",
      async () => {
        const receipts = this.client.getReceipts();
        return receipts.every(
          (r) =>
            r.html.includes("<html>") &&
            r.html.includes("</html>") &&
            r.html.includes("<table>") &&
            r.html.includes("</table>"),
        );
      },
    );
  }

  async testEmailNotifications(): Promise<void> {
    console.log("\n📧 Testing: Email Notifications");
    console.log("─".repeat(60));

    await this.test(
      "All transactions have customer notifications",
      async () => {
        const transactions = this.client.getTransactions();
        const notifications = this.client.getNotifications();
        return transactions.every((t) =>
          notifications.some(
            (n) =>
              n.transactionId === t.id && n.recipientType === "customer",
          ),
        );
      },
    );

    await this.test(
      "All transactions have supplier notifications",
      async () => {
        const transactions = this.client.getTransactions();
        const notifications = this.client.getNotifications();
        return transactions.every((t) =>
          notifications.some(
            (n) =>
              n.transactionId === t.id && n.recipientType === "supplier",
          ),
        );
      },
    );

    await this.test(
      "Customer notification contains receipt in subject",
      async () => {
        const notifications = this.client.getNotifications();
        const customerNotifs = notifications.filter(
          (n) => n.recipientType === "customer",
        );
        return customerNotifs.every(
          (n) =>
            n.type === "receipt" &&
            n.subject.includes("Receipt"),
        );
      },
    );

    await this.test(
      "Supplier notification indicates payment received",
      async () => {
        const notifications = this.client.getNotifications();
        const supplierNotifs = notifications.filter(
          (n) => n.recipientType === "supplier",
        );
        return supplierNotifs.every(
          (n) =>
            n.type === "credit_notification" &&
            n.subject.includes("Payment Received"),
        );
      },
    );
  }

  async testMultiCurrencyReconciliation(): Promise<void> {
    console.log("\n📊 Testing: Multi-Currency Reconciliation");
    console.log("─".repeat(60));

    await this.test(
      "All transactions recorded with unique IDs",
      async () => {
        const transactions = this.client.getTransactions();
        const ids = new Set(transactions.map((t) => t.id));
        return ids.size === transactions.length;
      },
    );

    await this.test(
      "FX rates correctly applied",
      async () => {
        const transactions = this.client.getTransactions();
        return transactions.every((t) => {
          if (t.customerCurrency === t.supplierCurrency) {
            return t.fxRate === 1.0 && t.fxFee === 0;
          }
          return (
            t.fxRate > 0 &&
            Math.abs(t.supplierAmount - t.amount * t.fxRate) < 0.01
          );
        });
      },
    );

    await this.test(
      "FX fees only charged for cross-currency transactions",
      async () => {
        const transactions = this.client.getTransactions();
        return transactions.every((t) => {
          if (t.customerCurrency === t.supplierCurrency) {
            return t.fxFee === 0;
          }
          return t.fxFee > 0;
        });
      },
    );

    await this.test(
      "All receipts linked to transactions",
      async () => {
        const transactions = this.client.getTransactions();
        const receipts = this.client.getReceipts();
        return transactions.every((t) =>
          receipts.some((r) => r.transactionId === t.id),
        );
      },
    );

    await this.test(
      "All notifications linked to transactions",
      async () => {
        const transactions = this.client.getTransactions();
        const notifications = this.client.getNotifications();
        return (
          notifications.length > 0 &&
          notifications.every((n) =>
            transactions.some((t) => t.id === n.transactionId),
          )
        );
      },
    );
  }

  async testComplexMultiSupplierScenario(): Promise<void> {
    console.log("\n🛒 Testing: Complex Multi-Supplier Purchasing");
    console.log("─".repeat(60));

    const customer = this.customers.customer1_usd;

    await this.test(
      "Customer can purchase from multiple suppliers in different currencies",
      async () => {
        let successCount = 0;

        const suppliers = [
          {
            supplier: this.merchants.supplier1_usd,
            amount: 100,
            description: "Laptop",
          },
          {
            supplier: this.merchants.supplier2_eur,
            amount: 50,
            description: "Watch",
          },
          {
            supplier: this.merchants.supplier3_jpy,
            amount: 200,
            description: "Phone Case",
          },
        ];

        for (const { supplier, amount, description } of suppliers) {
          const result = await this.client.executeMarketplaceTransaction(
            customer.id,
            supplier.id,
            amount,
            customer.currency,
            supplier.currency,
            description,
            customer.email,
            supplier.email,
          );
          if (result.transaction) successCount++;
        }

        return successCount === suppliers.length;
      },
    );

    await this.test(
      "Multiple purchases tracked in transaction history",
      async () => {
        const transactions = this.client.getTransactions();
        const customerTransactions = transactions.filter(
          (t) => t.customerId === customer.id,
        );
        return customerTransactions.length >= 3;
      },
    );

    await this.test(
      "Each supplier received correct currency credit",
      async () => {
        const transactions = this.client.getTransactions();
        const supplierTransactions = transactions.filter(
          (t) =>
            [
              this.merchants.supplier1_usd.id,
              this.merchants.supplier2_eur.id,
              this.merchants.supplier3_jpy.id,
            ].includes(t.supplierId),
        );

        return supplierTransactions.every((t) => {
          if (t.supplierId === this.merchants.supplier1_usd.id) {
            return t.supplierCurrency === "USD";
          } else if (t.supplierId === this.merchants.supplier2_eur.id) {
            return t.supplierCurrency === "EUR";
          } else if (t.supplierId === this.merchants.supplier3_jpy.id) {
            return t.supplierCurrency === "JPY";
          }
          return false;
        });
      },
    );
  }

  async runAllTests(): Promise<void> {
    console.log("\n╔═════════════════════════════════════════════════════════════╗");
    console.log("║ Marketplace Transaction E2E Testing Suite                   ║");
    console.log("║ Multi-Currency | Customer-Supplier | FX Conversion | Receipts║");
    console.log("╚═════════════════════════════════════════════════════════════╝");

    const startTime = Date.now();

    // Initialize wallets for all customers and suppliers
    await this.initializeWallets();

    await this.testSameCurrencyTransaction();
    await this.testCrossCurrencyTransaction();
    await this.testReceiptGeneration();
    await this.testEmailNotifications();
    await this.testMultiCurrencyReconciliation();
    await this.testComplexMultiSupplierScenario();

    const duration = ((Date.now() - startTime) / 1000).toFixed(1);
    this.printTestSummary(duration);
  }

  private async initializeWallets(): Promise<void> {
    // Initialize all customer wallets with sufficient funds
    const customers = [
      { id: "CUST-001", currency: "USD", balance: 5000 },
      { id: "CUST-002", currency: "EUR", balance: 4000 },
      { id: "CUST-003", currency: "JPY", balance: 500000 },
      { id: "CUST-004", currency: "GBP", balance: 3000 },
    ];

    // Initialize all supplier wallets
    const suppliers = [
      { id: "SUP-001", currency: "USD", balance: 10000 },
      { id: "SUP-002", currency: "EUR", balance: 8000 },
      { id: "SUP-003", currency: "JPY", balance: 1000000 },
    ];

    console.log("\n🔧 Initializing wallets for test scenarios...");

    try {
      // Create and fund customer wallets
      for (const customer of customers) {
        await axios.post(`${this.client.baseUrl}/wallet/create`, {
          userId: customer.id,
          currency: customer.currency,
        });

        await axios.post(`${this.client.baseUrl}/wallet/topup`, {
          userId: customer.id,
          currency: customer.currency,
          amount: customer.balance,
        });
      }

      // Create and fund supplier wallets
      for (const supplier of suppliers) {
        await axios.post(`${this.client.baseUrl}/wallet/create`, {
          userId: supplier.id,
          currency: supplier.currency,
        });

        await axios.post(`${this.client.baseUrl}/wallet/topup`, {
          userId: supplier.id,
          currency: supplier.currency,
          amount: supplier.balance,
        });
      }

      console.log("✓ All wallets initialized successfully\n");
    } catch (error) {
      console.error("✗ Error initializing wallets:", error);
    }
  }

  private printTestSummary(duration: string): void {
    const summary = this.client.getTestSummary();

    console.log("\n╔═════════════════════════════════════════════════════════════╗");
    console.log("║ Marketplace Transaction Test Summary                        ║");
    console.log("╠═════════════════════════════════════════════════════════════╣");
    console.log(`║ Tests: ${summary.passed}/${summary.total} passed (${summary.passRate}%)`);
    console.log(`║ Duration: ${duration}s`);
    console.log(`║ Transactions Processed: ${summary.transactions}`);
    console.log(`║ Receipts Generated: ${summary.receipts}`);
    console.log(`║ Notifications Sent: ${summary.notifications}`);
    console.log("║                                                             ║");
    console.log(
      `║ Status: ${summary.passed === summary.total ? "✓ ALL PASSED" : "✗ SOME FAILED"}`,
    );
    console.log("╚═════════════════════════════════════════════════════════════╝\n");
  }
}

// ============================================================================
// MAIN EXECUTION
// ============================================================================

async function main(): Promise<void> {
  const verbose = process.env.VERBOSE === "true";
  const testSuite = new MarketplaceTransactionTestSuite(verbose);
  await testSuite.runAllTests();
}

main().catch(console.error);
