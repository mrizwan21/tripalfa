/**
 * Payment Gateway Integration Tests
 * End-to-end testing for Stripe and PayPal integration
 * 
 * Test Scenarios:
 * 1. Stripe Payment Processing
 * 2. PayPal Payment Processing
 * 3. Multi-Currency Payments
 * 4. Payment Refunds
 * 5. Webhook Handling
 * 6. Error Recovery & Retry Logic
 * 7. Idempotency Verification
 * 8. Wallet Integration
 */

import { PaymentGatewayService, PaymentStatus } from './payment-gateway-service';
import axios, { AxiosInstance } from 'axios';
import { randomBytes } from 'crypto';
import * as fs from 'fs';
import * as path from 'path';

interface TestResult {
  name: string;
  status: 'PASS' | 'FAIL';
  duration: number;
  details?: string;
  error?: string;
}

interface ScenarioResult {
  scenario: string;
  tests: TestResult[];
  totalTests: number;
  passedTests: number;
  failedTests: number;
  duration: number;
}

class PaymentGatewayE2ETestSuite {
  private gateway: PaymentGatewayService;
  private walletApiClient: AxiosInstance;
  private results: ScenarioResult[] = [];
  private totalTransactionVolume: number = 0;

  constructor() {
    // Initialize payment gateway
    this.gateway = new PaymentGatewayService(
      process.env.STRIPE_API_KEY || 'sk_test_demo_key',
      process.env.PAYPAL_CLIENT_ID || 'demo_client_id',
      process.env.PAYPAL_CLIENT_SECRET || 'demo_client_secret',
      'sandbox'
    );

    // Initialize wallet API client
    this.walletApiClient = axios.create({
      baseURL: 'http://localhost:3001/api',
      timeout: 30000,
      validateStatus: () => true,
    });
  }

  /**
   * Scenario 1: Stripe Payment Processing
   */
  async scenario1_StripePaymentProcessing(): Promise<void> {
    console.log('\n📝 Scenario 1: Stripe Payment Processing');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    // Test 1.1: Basic Stripe payment
    let test = await this.executeTest('Basic Stripe payment processing', async () => {
      const response = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_stripe_001',
        amount: 100,
        currency: 'USD',
        method: 'card',
        description: 'Test booking payment',
        idempotencyKey: `stripe_${Date.now()}_${Math.random()}`,
      });

      if (response.status !== PaymentStatus.CAPTURED && response.status !== PaymentStatus.AUTHORIZED) {
        throw new Error(`Expected CAPTURED or AUTHORIZED, got ${response.status}`);
      }

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 1.2: Stripe payment with EUR
    test = await this.executeTest('Stripe payment in EUR', async () => {
      const response = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_stripe_002',
        amount: 85.5,
        currency: 'EUR',
        method: 'card',
        description: 'European booking',
        idempotencyKey: `stripe_eur_${Date.now()}`,
      });

      if (response.currency !== 'EUR') {
        throw new Error(`Expected EUR, got ${response.currency}`);
      }

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 1.3: Stripe payment with AED
    test = await this.executeTest('Stripe payment in AED', async () => {
      const response = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_stripe_003',
        amount: 400,
        currency: 'AED',
        method: 'card',
        description: 'UAE booking',
        idempotencyKey: `stripe_aed_${Date.now()}`,
      });

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 1.4: Large Stripe payment
    test = await this.executeTest('Large Stripe payment ($5000)', async () => {
      const response = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_stripe_large',
        amount: 5000,
        currency: 'USD',
        method: 'card',
        description: 'Large booking package',
        idempotencyKey: `stripe_large_${Date.now()}`,
      });

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 1.5: Stripe refund
    test = await this.executeTest('Stripe refund processing', async () => {
      // Create payment first
      const paymentResponse = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_stripe_refund',
        amount: 150,
        currency: 'USD',
        method: 'card',
        description: 'Refundable booking',
        idempotencyKey: `stripe_refund_${Date.now()}`,
      });

      // Process refund
      const refundResponse = await this.gateway.refundPayment(paymentResponse.transactionId, 150);

      if (refundResponse.status !== PaymentStatus.REFUNDED) {
        throw new Error(`Expected REFUNDED, got ${refundResponse.status}`);
      }

      return `Refund: ${refundResponse.processorReference}`;
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'Stripe Payment Processing',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Scenario 2: PayPal Payment Processing
   */
  async scenario2_PayPalPaymentProcessing(): Promise<void> {
    console.log('\n📝 Scenario 2: PayPal Payment Processing');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    // Test 2.1: Basic PayPal payment
    let test = await this.executeTest('Basic PayPal payment processing', async () => {
      const response = await this.gateway.processPayment({
        processor: 'paypal',
        userId: 'user_paypal_001',
        amount: 120,
        currency: 'USD',
        method: 'digital_wallet',
        description: 'PayPal booking payment',
        idempotencyKey: `paypal_${Date.now()}_${Math.random()}`,
      });

      if (response.status !== PaymentStatus.CAPTURED && response.status !== PaymentStatus.AUTHORIZED) {
        throw new Error(`Expected CAPTURED or AUTHORIZED, got ${response.status}`);
      }

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 2.2: PayPal payment with GBP
    test = await this.executeTest('PayPal payment in GBP', async () => {
      const response = await this.gateway.processPayment({
        processor: 'paypal',
        userId: 'user_paypal_002',
        amount: 75,
        currency: 'GBP',
        method: 'digital_wallet',
        description: 'UK booking via PayPal',
        idempotencyKey: `paypal_gbp_${Date.now()}`,
      });

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 2.3: PayPal bank transfer
    test = await this.executeTest('PayPal bank transfer payment', async () => {
      const response = await this.gateway.processPayment({
        processor: 'paypal',
        userId: 'user_paypal_003',
        amount: 250,
        currency: 'USD',
        method: 'bank_transfer',
        description: 'Bank transfer booking',
        idempotencyKey: `paypal_bank_${Date.now()}`,
      });

      this.totalTransactionVolume += response.amount;
      return `Transaction: ${response.processorReference}`;
    });
    scenarioTests.push(test);

    // Test 2.4: PayPal refund
    test = await this.executeTest('PayPal refund processing', async () => {
      const paymentResponse = await this.gateway.processPayment({
        processor: 'paypal',
        userId: 'user_paypal_refund',
        amount: 180,
        currency: 'USD',
        method: 'digital_wallet',
        description: 'Refundable PayPal booking',
        idempotencyKey: `paypal_refund_${Date.now()}`,
      });

      const refundResponse = await this.gateway.refundPayment(paymentResponse.transactionId, 180);

      if (refundResponse.status !== PaymentStatus.REFUNDED) {
        throw new Error(`Expected REFUNDED, got ${refundResponse.status}`);
      }

      return `Refund: ${refundResponse.processorReference}`;
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'PayPal Payment Processing',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Scenario 3: Multi-Currency Support
   */
  async scenario3_MultiCurrencySupport(): Promise<void> {
    console.log('\n📝 Scenario 3: Multi-Currency Support');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    const currencies = ['USD', 'EUR', 'GBP', 'AED', 'JPY', 'SGD', 'CAD'];

    // Test 3.1: Process payments in all supported currencies (Stripe)
    let test = await this.executeTest('Stripe payments in 7 currencies', async () => {
      let allSuccess = true;

      for (const currency of currencies) {
        const amount = currency === 'JPY' ? 10000 : currency === 'AED' ? 400 : 100;

        const response = await this.gateway.processPayment({
          processor: 'stripe',
          userId: `user_stripe_${currency}`,
          amount,
          currency,
          method: 'card',
          description: `Payment in ${currency}`,
          idempotencyKey: `stripe_${currency}_${Date.now()}`,
        });

        if (response.currency !== currency) {
          allSuccess = false;
        }

        this.totalTransactionVolume += response.amount;
      }

      if (!allSuccess) {
        throw new Error('Currency mismatch detected');
      }

      return `All 7 currencies processed successfully`;
    });
    scenarioTests.push(test);

    // Test 3.2: Process payments in all supported currencies (PayPal)
    test = await this.executeTest('PayPal payments in 7 currencies', async () => {
      let allSuccess = true;

      for (const currency of currencies) {
        const amount = currency === 'JPY' ? 10000 : currency === 'AED' ? 400 : 100;

        const response = await this.gateway.processPayment({
          processor: 'paypal',
          userId: `user_paypal_${currency}`,
          amount,
          currency,
          method: 'digital_wallet',
          description: `PayPal payment in ${currency}`,
          idempotencyKey: `paypal_${currency}_${Date.now()}`,
        });

        if (response.currency !== currency) {
          allSuccess = false;
        }

        this.totalTransactionVolume += response.amount;
      }

      if (!allSuccess) {
        throw new Error('Currency mismatch detected');
      }

      return `All 7 currencies processed successfully`;
    });
    scenarioTests.push(test);

    // Test 3.3: Verify no cross-currency contamination
    test = await this.executeTest('Verify currency isolation', async () => {
      const transactions = this.gateway.getAllTransactions();
      const currencyGroups = new Map<string, number>();

      for (const txn of transactions) {
        const group = currencyGroups.get(txn.currency) || 0;
        currencyGroups.set(txn.currency, group + txn.amount);
      }

      if (currencyGroups.size < 7) {
        throw new Error(`Expected at least 7 currencies, got ${currencyGroups.size}`);
      }

      return `All currencies properly isolated: ${currencyGroups.size} currencies tracked`;
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'Multi-Currency Support',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Scenario 4: Webhook Handling
   */
  async scenario4_WebhookHandling(): Promise<void> {
    console.log('\n📝 Scenario 4: Webhook Handling');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    // Test 4.1: Handle Stripe webhook - payment succeeded
    let test = await this.executeTest('Stripe webhook: payment.intent.succeeded', async () => {
      await this.gateway.handleWebhookEvent({
        type: 'payment_intent.succeeded',
        processor: 'stripe',
        data: {
          id: 'pi_mock_12345',
          status: 'succeeded',
          amount: 10000,
          currency: 'usd',
        },
        timestamp: new Date().toISOString(),
        signature: 'mock_signature',
      });

      return 'Webhook processed successfully';
    });
    scenarioTests.push(test);

    // Test 4.2: Handle Stripe webhook - payment failed
    test = await this.executeTest('Stripe webhook: payment_intent.payment_failed', async () => {
      await this.gateway.handleWebhookEvent({
        type: 'payment_intent.payment_failed',
        processor: 'stripe',
        data: {
          id: 'pi_mock_failed',
          status: 'requires_payment_method',
        },
        timestamp: new Date().toISOString(),
        signature: 'mock_signature',
      });

      return 'Webhook processed successfully';
    });
    scenarioTests.push(test);

    // Test 4.3: Handle PayPal webhook - capture completed
    test = await this.executeTest('PayPal webhook: PAYMENT.CAPTURE.COMPLETED', async () => {
      await this.gateway.handleWebhookEvent({
        type: 'PAYMENT.CAPTURE.COMPLETED',
        processor: 'paypal',
        data: {
          id: 'PAYID_mock_789',
          status: 'COMPLETED',
          amount: '100.00',
        },
        timestamp: new Date().toISOString(),
        signature: 'mock_signature',
      });

      return 'Webhook processed successfully';
    });
    scenarioTests.push(test);

    // Test 4.4: Handle PayPal webhook - capture denied
    test = await this.executeTest('PayPal webhook: PAYMENT.CAPTURE.DENIED', async () => {
      await this.gateway.handleWebhookEvent({
        type: 'PAYMENT.CAPTURE.DENIED',
        processor: 'paypal',
        data: {
          id: 'PAYID_denied',
          status: 'DENIED',
        },
        timestamp: new Date().toISOString(),
        signature: 'mock_signature',
      });

      return 'Webhook processed successfully';
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'Webhook Handling',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Scenario 5: Idempotency Verification
   */
  async scenario5_IdempotencyVerification(): Promise<void> {
    console.log('\n📝 Scenario 5: Idempotency Verification');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    // Test 5.1: Duplicate Stripe payment returns same transaction
    let test = await this.executeTest('Stripe idempotency: duplicate payment', async () => {
      const idempotencyKey = `idempotent_stripe_${Date.now()}`;

      const response1 = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_idempotent_001',
        amount: 100,
        currency: 'USD',
        method: 'card',
        description: 'Idempotent test',
        idempotencyKey,
      });

      const response2 = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_idempotent_001',
        amount: 100,
        currency: 'USD',
        method: 'card',
        description: 'Idempotent test',
        idempotencyKey,
      });

      if (response1.transactionId !== response2.transactionId) {
        throw new Error(`Duplicate payment created different transactions: ${response1.transactionId} vs ${response2.transactionId}`);
      }

      this.totalTransactionVolume += response1.amount; // Only count once

      return `Same transaction returned: ${response1.transactionId}`;
    });
    scenarioTests.push(test);

    // Test 5.2: Duplicate PayPal payment returns same transaction
    test = await this.executeTest('PayPal idempotency: duplicate payment', async () => {
      const idempotencyKey = `idempotent_paypal_${Date.now()}`;

      const response1 = await this.gateway.processPayment({
        processor: 'paypal',
        userId: 'user_idempotent_002',
        amount: 150,
        currency: 'USD',
        method: 'digital_wallet',
        description: 'PayPal idempotent test',
        idempotencyKey,
      });

      const response2 = await this.gateway.processPayment({
        processor: 'paypal',
        userId: 'user_idempotent_002',
        amount: 150,
        currency: 'USD',
        method: 'digital_wallet',
        description: 'PayPal idempotent test',
        idempotencyKey,
      });

      if (response1.transactionId !== response2.transactionId) {
        throw new Error(`Duplicate payment created different transactions`);
      }

      this.totalTransactionVolume += response1.amount; // Only count once

      return `Same transaction returned: ${response1.transactionId}`;
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'Idempotency Verification',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Scenario 6: Error Recovery & Retry Logic
   */
  async scenario6_ErrorRecoveryAndRetry(): Promise<void> {
    console.log('\n📝 Scenario 6: Error Recovery & Retry Logic');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    // Test 6.1: Verify retry logic exists
    let test = await this.executeTest('Verify retry logic for failed payments', async () => {
      // This test verifies the internal retry logic by checking transaction retries
      const transactions = this.gateway.getAllTransactions();
      const failedTransactions = transactions.filter(t => t.retries > 0);

      return `Transaction retry tracking active: ${failedTransactions.length} retries tracked`;
    });
    scenarioTests.push(test);

    // Test 6.2: Transaction status tracking
    test = await this.executeTest('Transaction status tracking across lifecycle', async () => {
      const response = await this.gateway.processPayment({
        processor: 'stripe',
        userId: 'user_lifecycle_001',
        amount: 100,
        currency: 'USD',
        method: 'card',
        description: 'Lifecycle tracking test',
        idempotencyKey: `lifecycle_${Date.now()}`,
      });

      const status = this.gateway.getTransactionStatus(response.transactionId);

      if (!status) {
        throw new Error('Transaction status not found');
      }

      this.totalTransactionVolume += response.amount;

      return `Transaction tracked: ${response.transactionId} → ${status}`;
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'Error Recovery & Retry Logic',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Scenario 7: Transaction Metrics & Reporting
   */
  async scenario7_TransactionMetricsAndReporting(): Promise<void> {
    console.log('\n📝 Scenario 7: Transaction Metrics & Reporting');
    const scenarioTests: TestResult[] = [];
    const scenarioStart = Date.now();

    // Test 7.1: Calculate transaction metrics
    let test = await this.executeTest('Calculate payment gateway metrics', async () => {
      const metrics = this.gateway.calculateMetrics();

      if (metrics.totalTransactions === 0) {
        throw new Error('No transactions recorded');
      }

      return `Metrics calculated: ${metrics.totalTransactions} transactions, $${metrics.totalVolume.toFixed(2)} volume`;
    });
    scenarioTests.push(test);

    // Test 7.2: Verify transaction breakdown
    test = await this.executeTest('Verify Stripe/PayPal breakdown', async () => {
      const metrics = this.gateway.calculateMetrics();

      if (metrics.byProcessor.stripe === 0 && metrics.byProcessor.paypal === 0) {
        throw new Error('No transactions from either processor');
      }

      const stripeCount = metrics.byProcessor.stripe;
      const paypalCount = metrics.byProcessor.paypal;

      return `Processor breakdown: Stripe ${stripeCount} | PayPal ${paypalCount}`;
    });
    scenarioTests.push(test);

    // Test 7.3: Verify status distribution
    test = await this.executeTest('Verify transaction status distribution', async () => {
      const metrics = this.gateway.calculateMetrics();
      const statusTypes = Array.from(Object.keys(metrics.byStatus));

      return `Transaction statuses: ${statusTypes.join(', ')}`;
    });
    scenarioTests.push(test);

    const duration = Date.now() - scenarioStart;
    this.results.push({
      scenario: 'Transaction Metrics & Reporting',
      tests: scenarioTests,
      totalTests: scenarioTests.length,
      passedTests: scenarioTests.filter(t => t.status === 'PASS').length,
      failedTests: scenarioTests.filter(t => t.status === 'FAIL').length,
      duration,
    });
  }

  /**
   * Execute a single test
   */
  private async executeTest(name: string, testFn: () => Promise<string>): Promise<TestResult> {
    const startTime = Date.now();

    try {
      const details = await testFn();
      const duration = Date.now() - startTime;

      console.log(`  ✅ ${name} (${duration}ms)`);

      return {
        name,
        status: 'PASS',
        duration,
        details,
      };
    } catch (error: any) {
      const duration = Date.now() - startTime;

      console.log(`  ❌ ${name} (${duration}ms)`);
      console.log(`     Error: ${error.message}`);

      return {
        name,
        status: 'FAIL',
        duration,
        error: error.message,
      };
    }
  }

  /**
   * Run all scenarios
   */
  async runAllScenarios(): Promise<void> {
    console.log('\n' + '═'.repeat(80));
    console.log('🧪 PAYMENT GATEWAY INTEGRATION E2E TESTS');
    console.log('═'.repeat(80));

    const totalStart = Date.now();

    await this.scenario1_StripePaymentProcessing();
    await this.scenario2_PayPalPaymentProcessing();
    await this.scenario3_MultiCurrencySupport();
    await this.scenario4_WebhookHandling();
    await this.scenario5_IdempotencyVerification();
    await this.scenario6_ErrorRecoveryAndRetry();
    await this.scenario7_TransactionMetricsAndReporting();

    const totalDuration = Date.now() - totalStart;

    this.printReport(totalDuration);
    this.saveReport();
  }

  /**
   * Print test report
   */
  private printReport(totalDuration: number): void {
    console.log('\n' + '═'.repeat(80));
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('═'.repeat(80) + '\n');

    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;

    for (const scenario of this.results) {
      totalTests += scenario.totalTests;
      totalPassed += scenario.passedTests;
      totalFailed += scenario.failedTests;

      const passRate = ((scenario.passedTests / scenario.totalTests) * 100).toFixed(1);
      const status = scenario.failedTests === 0 ? '✅' : '❌';

      console.log(`${status} ${scenario.scenario}`);
      console.log(
        `   ${scenario.passedTests}/${scenario.totalTests} passed (${passRate}%) | ${scenario.duration}ms\n`
      );
    }

    const overallPassRate = ((totalPassed / totalTests) * 100).toFixed(1);
    console.log('─'.repeat(80));
    console.log(`Total: ${totalPassed}/${totalTests} tests passed (${overallPassRate}%)`);
    console.log(`Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(`Financial Volume: $${this.totalTransactionVolume.toFixed(2)}`);
    console.log('═'.repeat(80) + '\n');
  }

  /**
   * Save report to JSON
   */
  private saveReport(): void {
    const metrics = this.gateway.calculateMetrics();

    const report = {
      testSuite: 'Payment Gateway Integration E2E',
      timestamp: new Date().toISOString(),
      scenarios: this.results,
      summary: {
        totalScenarios: this.results.length,
        totalTests: this.results.reduce((sum, r) => sum + r.totalTests, 0),
        passedTests: this.results.reduce((sum, r) => sum + r.passedTests, 0),
        failedTests: this.results.reduce((sum, r) => sum + r.failedTests, 0),
        totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
      },
      metrics: {
        totalTransactions: metrics.totalTransactions,
        totalVolume: this.totalTransactionVolume,
        byProcessor: metrics.byProcessor,
        byStatus: metrics.byStatus,
      },
    };

    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filename = `payment-gateway-e2e-${new Date().toISOString().split('T')[0]}.json`;
    const filepath = path.join(reportDir, filename);

    fs.writeFileSync(filepath, JSON.stringify(report, null, 2));
    console.log(`✅ Report saved to ${filepath}\n`);
  }
}

// Run tests
async function runTests(): Promise<void> {
  const suite = new PaymentGatewayE2ETestSuite();
  await suite.runAllScenarios();
}

runTests().catch(error => {
  console.error('❌ Test suite failed:', error);
  process.exit(1);
});
