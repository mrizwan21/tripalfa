#!/usr/bin/env ts-node
/**
 * API Manager Endpoints Test Runner
 * 
 * Comprehensive test execution script for all Combined Payment API Manager endpoints.
 * Generates detailed test report and validation results.
 * 
 * Usage:
 *   npm run test:api:combined-payment
 *   ts-node scripts/test-combined-payment-api-manager.ts
 *   ts-node scripts/test-combined-payment-api-manager.ts --output json
 */

import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  cyan: '\x1b[36m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  gray: '\x1b[90m',
  bold: '\x1b[1m'
};

class ColorLog {
  cyan(text: string) { return `${colors.cyan}${text}${colors.reset}`; }
  blue(text: string) { return `${colors.blue}${text}${colors.reset}`; }
  green(text: string) { return `${colors.green}${text}${colors.reset}`; }
  red(text: string) { return `${colors.red}${text}${colors.reset}`; }
  yellow(text: string) { return `${colors.yellow}${text}${colors.reset}`; }
  gray(text: string) { return `${colors.gray}${text}${colors.reset}`; }
  bold(text: string) { return `${colors.bold}${text}${colors.reset}`; }
}

const chalk = new ColorLog();

interface TestResult {
  name: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  endpoint: string;
  status: number;
  success: boolean;
  message: string;
  duration: number;
  details?: Record<string, any>;
}

interface TestReport {
  timestamp: string;
  totalTests: number;
  passedTests: number;
  failedTests: number;
  totalDuration: number;
  results: TestResult[];
  summary: {
    endpoints: {
      [key: string]: {
        total: number;
        passed: number;
        failed: number;
      };
    };
    statusCodes: {
      [key: number]: number;
    };
  };
}

class ApiManagerTestRunner {
  private api: AxiosInstance;
  private baseUrl: string;
  private authToken: string = '';
  private results: TestResult[] = [];
  private startTime: number = 0;
  private testCustomerId = '45e3a860-1234-5678-9abc-def012345678';
  private testBookingId = '55e3a860-1234-5678-9abc-def012345679';
  private testCreditId = 'credit-uuid-1';

  constructor(baseUrl: string = 'http://localhost:3007') {
    this.baseUrl = baseUrl;
    this.api = axios.create({
      baseURL: baseUrl,
      timeout: 10000,
      validateStatus: () => true // Don't throw on any status
    });
  }

  /**
   * Setup authentication
   */
  async setupAuth(): Promise<boolean> {
    try {
      console.log(chalk.blue('🔐 Setting up authentication...'));
      
      // Try to login with test credentials
      const response = await this.api.post('/api/auth/login', {
        email: 'test.customer@tripalfa.com',
        password: 'TestCustomer@123'
      });

      if (response.status === 200 && (response.data.token || response.data.accessToken)) {
        this.authToken = response.data.token || response.data.accessToken;
        console.log(chalk.green('✅ Authentication successful'));
        return true;
      } else {
        // Use mock token for testing
        this.authToken = 'Bearer mock-test-token-' + Date.now();
        console.log(chalk.yellow('⚠️  Using mock token for testing'));
        return true;
      }
    } catch (error) {
      console.log(chalk.yellow('⚠️  Could not authenticate, using mock token'));
      this.authToken = 'Bearer mock-test-token-' + Date.now();
      return true;
    }
  }

  /**
   * Get auth headers
   */
  private getAuthHeaders(): Record<string, string> {
    return {
      'Authorization': `Bearer ${this.authToken}`,
      'Content-Type': 'application/json',
      'X-Request-ID': `test-${Date.now()}`
    };
  }

  /**
   * Execute a single test
   */
  private async executeTest(
    name: string,
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    endpoint: string,
    data?: any,
    headers?: Record<string, string>
  ): Promise<TestResult> {
    const startTime = Date.now();
    const mergedHeaders = { ...this.getAuthHeaders(), ...headers };

    try {
      let response;
      switch (method) {
        case 'GET':
          response = await this.api.get(endpoint, { headers: mergedHeaders });
          break;
        case 'POST':
          response = await this.api.post(endpoint, data, { headers: mergedHeaders });
          break;
        case 'PUT':
          response = await this.api.put(endpoint, data, { headers: mergedHeaders });
          break;
        case 'DELETE':
          response = await this.api.delete(endpoint, { headers: mergedHeaders });
          break;
      }

      const duration = Date.now() - startTime;
      const success = response.status >= 200 && response.status < 300;

      const result: TestResult = {
        name,
        method,
        endpoint,
        status: response.status,
        success,
        message: response.data?.message || response.statusText || 'No message',
        duration,
        details: {
          hasData: !!response.data?.data,
          hasSuccess: !!response.data?.success,
          statusText: response.statusText
        }
      };

      this.results.push(result);
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';

      const result: TestResult = {
        name,
        method,
        endpoint,
        status: 0,
        success: false,
        message: `Error: ${errorMsg}`,
        duration
      };

      this.results.push(result);
      return result;
    }
  }

  /**
   * Run all tests
   */
  async runAllTests(): Promise<TestReport> {
    console.log(chalk.cyan('\n📋 Starting API Manager Endpoint Tests\n'));
    this.startTime = Date.now();

    // Setup
    await this.setupAuth();

    console.log(chalk.blue('\n🧪 Testing Payment Options Endpoint'));
    await this.testPaymentOptionsEndpoint();

    console.log(chalk.blue('\n💳 Testing Combined Payment Processing'));
    await this.testCombinedPaymentEndpoint();

    console.log(chalk.blue('\n📊 Testing Payment Details Endpoint'));
    await this.testPaymentDetailsEndpoint();

    console.log(chalk.blue('\n🔄 Testing Refund Endpoint'));
    await this.testRefundEndpoint();

    console.log(chalk.blue('\n✨ Testing Create Booking with Payment'));
    await this.testCreateBookingWithPayment();

    console.log(chalk.blue('\n💰 Testing Apply Credits Endpoint'));
    await this.testApplyCreditsEndpoint();

    console.log(chalk.blue('\n🔗 Testing Workflow Integration'));
    await this.testWorkflowIntegration();

    return this.generateReport();
  }

  /**
   * Test Payment Options Endpoint
   */
  private async testPaymentOptionsEndpoint(): Promise<void> {
    const endpoint = `/api/bookings/${this.testCustomerId}/payment-options?totalAmount=1000&currency=USD`;
    
    const result = await this.executeTest(
      'Get payment options with valid params',
      'GET',
      endpoint
    );
    this.printTestResult(result);

    // Test without auth
    const noAuthResult = await this.executeTest(
      'Get payment options without auth',
      'GET',
      endpoint,
      undefined,
      { 'Authorization': '' }
    );
    this.printTestResult(noAuthResult);

    // Test different currencies
    const currencies = ['EUR', 'GBP', 'AED'];
    for (const currency of currencies) {
      const currencyEndpoint = `/api/bookings/${this.testCustomerId}/payment-options?totalAmount=500&currency=${currency}`;
      const currencyResult = await this.executeTest(
        `Get payment options with ${currency}`,
        'GET',
        currencyEndpoint
      );
      this.printTestResult(currencyResult);
    }
  }

  /**
   * Test Combined Payment Endpoint
   */
  private async testCombinedPaymentEndpoint(): Promise<void> {
    const endpoint = `/api/bookings/${this.testBookingId}/pay`;

    // Test with wallet and card
    const walletCardData = {
      customerId: this.testCustomerId,
      totalAmount: 1000,
      currency: 'USD',
      useWallet: true,
      walletAmount: 500,
      useCredits: false,
      creditIds: [],
      cardAmount: 500
    };

    const walletCardResult = await this.executeTest(
      'Process combined payment (wallet + card)',
      'POST',
      endpoint,
      walletCardData
    );
    this.printTestResult(walletCardResult);

    // Test with credits
    const creditsData = {
      customerId: this.testCustomerId,
      totalAmount: 1000,
      currency: 'USD',
      useWallet: true,
      walletAmount: 300,
      useCredits: true,
      creditIds: [this.testCreditId],
      cardAmount: 400
    };

    const creditsResult = await this.executeTest(
      'Process payment with credits',
      'POST',
      endpoint,
      creditsData
    );
    this.printTestResult(creditsResult);

    // Test card-only payment
    const cardOnlyData = {
      customerId: this.testCustomerId,
      totalAmount: 1000,
      currency: 'USD',
      useWallet: false,
      walletAmount: 0,
      useCredits: false,
      creditIds: [],
      cardAmount: 1000
    };

    const cardOnlyResult = await this.executeTest(
      'Process card-only payment',
      'POST',
      endpoint,
      cardOnlyData
    );
    this.printTestResult(cardOnlyResult);

    // Test with idempotency key
    const idempotencyKey = 'idempotency-' + Date.now();
    const idempotencyResult = await this.executeTest(
      'Process payment with idempotency key',
      'POST',
      endpoint,
      walletCardData,
      { 'X-Idempotency-Key': idempotencyKey }
    );
    this.printTestResult(idempotencyResult);
  }

  /**
   * Test Payment Details Endpoint
   */
  private async testPaymentDetailsEndpoint(): Promise<void> {
    const endpoint = `/api/bookings/${this.testBookingId}/payment-details`;

    const result = await this.executeTest(
      'Get payment details for booking',
      'GET',
      endpoint
    );
    this.printTestResult(result);

    // Test non-existent booking
    const noBookingResult = await this.executeTest(
      'Get payment details for non-existent booking',
      'GET',
      `/api/bookings/non-existent-id/payment-details`
    );
    this.printTestResult(noBookingResult);
  }

  /**
   * Test Refund Endpoint
   */
  private async testRefundEndpoint(): Promise<void> {
    const endpoint = `/api/bookings/${this.testBookingId}/refund`;

    const refundData = {
      reason: 'Customer requested cancellation'
    };

    const result = await this.executeTest(
      'Process refund for booking',
      'POST',
      endpoint,
      refundData
    );
    this.printTestResult(result);

    // Test partial refund
    const partialRefundData = {
      reason: 'Partial refund',
      amount: 500
    };

    const partialResult = await this.executeTest(
      'Process partial refund',
      'POST',
      endpoint,
      partialRefundData
    );
    this.printTestResult(partialResult);
  }

  /**
   * Test Create Booking with Payment
   */
  private async testCreateBookingWithPayment(): Promise<void> {
    const endpoint = '/api/bookings/create-with-payment';

    const bookingData = {
      serviceType: 'flight',
      customerId: this.testCustomerId,
      customerName: 'Test User',
      customerEmail: 'test@example.com',
      customerPhone: '+1234567890',
      totalAmount: 1000,
      currency: 'USD',
      useWallet: true,
      walletAmount: 500,
      useCredits: true,
      creditIds: [this.testCreditId],
      cardAmount: 300
    };

    const result = await this.executeTest(
      'Create flight booking with combined payment',
      'POST',
      endpoint,
      bookingData
    );
    this.printTestResult(result);

    // Test hotel booking
    const hotelData = { ...bookingData, serviceType: 'hotel', totalAmount: 2000 };
    const hotelResult = await this.executeTest(
      'Create hotel booking with combined payment',
      'POST',
      endpoint,
      hotelData
    );
    this.printTestResult(hotelResult);

    // Test incomplete data
    const incompleteResult = await this.executeTest(
      'Create booking with incomplete data',
      'POST',
      endpoint,
      { serviceType: 'flight' }
    );
    this.printTestResult(incompleteResult);
  }

  /**
   * Test Apply Credits Endpoint
   */
  private async testApplyCreditsEndpoint(): Promise<void> {
    const endpoint = `/api/bookings/${this.testBookingId}/apply-credits`;

    const creditsData = {
      creditIds: [this.testCreditId]
    };

    const result = await this.executeTest(
      'Apply single credit to booking',
      'POST',
      endpoint,
      creditsData
    );
    this.printTestResult(result);

    // Test multiple credits
    const multipleCreditsData = {
      creditIds: [this.testCreditId, 'credit-uuid-2', 'credit-uuid-3']
    };

    const multipleResult = await this.executeTest(
      'Apply multiple credits to booking',
      'POST',
      endpoint,
      multipleCreditsData
    );
    this.printTestResult(multipleResult);

    // Test empty credits
    const emptyResult = await this.executeTest(
      'Apply empty credits array',
      'POST',
      endpoint,
      { creditIds: [] }
    );
    this.printTestResult(emptyResult);
  }

  /**
   * Test Workflow Integration
   */
  private async testWorkflowIntegration(): Promise<void> {
    console.log(chalk.gray('   Complete workflow test...'));

    // Step 1: Get payment options
    const optionsEndpoint = `/api/bookings/${this.testCustomerId}/payment-options?totalAmount=1000&currency=USD`;
    const optionsResult = await this.executeTest(
      'Complete workflow: Get payment options',
      'GET',
      optionsEndpoint
    );

    // Step 2: Create booking with payment
    const bookingData = {
      serviceType: 'flight',
      customerId: this.testCustomerId,
      customerName: 'Workflow Test',
      customerEmail: 'workflow@test.com',
      customerPhone: '+1234567890',
      totalAmount: 1000,
      currency: 'USD',
      useWallet: true,
      walletAmount: 500,
      useCredits: false,
      creditIds: [],
      cardAmount: 500
    };

    const createResult = await this.executeTest(
      'Complete workflow: Create booking with payment',
      'POST',
      '/api/bookings/create-with-payment',
      bookingData
    );

    // Step 3: Get payment details (if booking created)
    if (createResult.success && createResult.details?.hasData) {
      const detailsResult = await this.executeTest(
        'Complete workflow: Get payment details',
        'GET',
        `/api/bookings/${this.testBookingId}/payment-details`
      );
    }

    this.printTestResult(optionsResult);
    this.printTestResult(createResult);
  }

  /**
   * Print test result
   */
  private printTestResult(result: TestResult): void {
    const statusIcon = result.success ? '✅' : '❌';
    const statusColor = result.success ? chalk.green : chalk.red;
    
    console.log(
      chalk.gray(`   ${statusIcon} ${result.name}`),
      statusColor(`[${result.status}]`),
      chalk.gray(`(${result.duration}ms)`)
    );

    if (!result.success && result.message.includes('Error')) {
      console.log(chalk.red(`      └─ ${result.message}`));
    }
  }

  /**
   * Generate test report
   */
  private generateReport(): TestReport {
    const totalDuration = Date.now() - this.startTime;
    const passedTests = this.results.filter(r => r.success).length;
    const failedTests = this.results.filter(r => !r.success).length;
    const totalTests = this.results.length;

    // Calculate summary
    const summary = {
      endpoints: {} as Record<string, any>,
      statusCodes: {} as Record<number, number>
    };

    for (const result of this.results) {
      // Endpoint summary
      const methodEndpoint = `${result.method} ${result.endpoint.split('?')[0]}`;
      if (!summary.endpoints[methodEndpoint]) {
        summary.endpoints[methodEndpoint] = { total: 0, passed: 0, failed: 0 };
      }
      summary.endpoints[methodEndpoint].total++;
      if (result.success) {
        summary.endpoints[methodEndpoint].passed++;
      } else {
        summary.endpoints[methodEndpoint].failed++;
      }

      // Status code summary
      const statusCode = result.status || 500;
      summary.statusCodes[statusCode] = (summary.statusCodes[statusCode] || 0) + 1;
    }

    return {
      timestamp: new Date().toISOString(),
      totalTests,
      passedTests,
      failedTests,
      totalDuration,
      results: this.results,
      summary
    };
  }

  /**
   * Print report
   */
  printReport(report: TestReport): void {
    console.log(chalk.cyan('\n' + '='.repeat(70)));
    console.log(chalk.bold('📊 TEST REPORT'));
    console.log(chalk.cyan('='.repeat(70) + '\n'));

    console.log(chalk.bold('Summary:'));
    console.log(`  Total Tests:    ${report.totalTests}`);
    console.log(`  ${chalk.green(`✅ Passed:       ${report.passedTests}`)}`);
    console.log(`  ${chalk.red(`❌ Failed:       ${report.failedTests}`)}`);
    console.log(`  ⏱️  Duration:    ${report.totalDuration}ms\n`);

    const passRate = ((report.passedTests / report.totalTests) * 100).toFixed(2);
    console.log(chalk.bold(`Pass Rate: ${passRate}%`));

    if (report.summary.endpoints) {
      console.log(chalk.bold('\nEndpoint Summary:'));
      for (const [endpoint, stats] of Object.entries(report.summary.endpoints)) {
        const endpointPassRate = ((stats.passed / stats.total) * 100).toFixed(0);
        console.log(`  ${endpoint}: ${stats.passed}/${stats.total} (${endpointPassRate}%)`);
      }
    }

    if (report.summary.statusCodes) {
      console.log(chalk.bold('\nStatus Code Distribution:'));
      for (const [code, count] of Object.entries(report.summary.statusCodes)) {
        const codeInt = parseInt(code);
        let icon = '';
        if (codeInt >= 200 && codeInt < 300) icon = '✅';
        else if (codeInt >= 400 && codeInt < 500) icon = '⚠️ ';
        else if (codeInt >= 500) icon = '❌';
        console.log(`  ${icon} ${code}: ${count}`);
      }
    }

    console.log('\n' + chalk.cyan('='.repeat(70)) + '\n');
  }

  /**
   * Export report
   */
  exportReport(report: TestReport, format: 'json' | 'html' = 'json'): void {
    const timestamp = new Date().toISOString().split('T')[0];
    const dir = 'test-results';
    mkdirSync(dir, { recursive: true });

    if (format === 'json') {
      const filename = join(dir, `combined-payment-test-report-${timestamp}.json`);
      writeFileSync(filename, JSON.stringify(report, null, 2));
      console.log(chalk.green(`\n📄 Report exported to: ${filename}`));
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const runner = new ApiManagerTestRunner(
    process.env.API_BASE_URL || 'http://localhost:3007'
  );

  const report = await runner.runAllTests();
  runner.printReport(report);

  const format = process.argv.includes('--output=html') ? 'html' : 'json';
  runner.exportReport(report, format);

  // Exit with appropriate code
  process.exit(report.failedTests > 0 ? 1 : 0);
}

main().catch(error => {
  console.error(chalk.red('Test runner error:'), error);
  process.exit(1);
});
