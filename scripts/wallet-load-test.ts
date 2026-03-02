/**
 * Wallet System Load Testing Suite
 * Tests concurrent wallet operations under various load scenarios
 * 
 * Scenarios:
 * - Light Load: 10 concurrent users, 5 minutes
 * - Normal Load: 50 concurrent users, 10 minutes
 * - Peak Load: 100 concurrent users, 15 minutes
 * - Stress Load: 250 concurrent users until failure
 */

import axios, { AxiosInstance } from 'axios';
import { performance } from 'perf_hooks';
import fs from 'fs';
import path from 'path';

interface LoadTestConfig {
  baseURL: string;
  duration: number; // milliseconds
  concurrentUsers: number;
  rampUpTime: number; // milliseconds
  warmupDuration: number; // milliseconds
}

interface MetricsSnapshot {
  timestamp: number;
  responseTime: number;
  success: boolean;
  operation: string;
  statusCode?: number;
  error?: string;
}

interface OperationMetrics {
  operation: string;
  count: number;
  successes: number;
  failures: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  p50: number;
  p95: number;
  p99: number;
  throughput: number; // ops/sec
  errorRate: number; // %
}

interface LoadTestResults {
  testName: string;
  config: LoadTestConfig;
  startTime: number;
  endTime: number;
  duration: number;
  totalOperations: number;
  totalSuccesses: number;
  totalFailures: number;
  overallThroughput: number;
  operationMetrics: Map<string, OperationMetrics>;
  bottlenecks: string[];
  recommendations: string[];
  systemHealthCheckpoints: {
    timestamp: number;
    activeConnections: number;
    dbQueryTime: number;
    memoryUsage: number;
  }[];
}

class WalletLoadTestSuite {
  private client: AxiosInstance;
  private metrics: MetricsSnapshot[] = [];
  private config: LoadTestConfig;
  private testResults: LoadTestResults | null = null;
  private activeOperations: number = 0;
  private systemHealthCheckpoints: any[] = [];

  constructor(config: LoadTestConfig) {
    this.config = config;
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: 30000,
      validateStatus: () => true, // Don't throw on any status
    });
  }

  /**
   * Execute ramp-up phase
   * Gradually increase concurrent users
   */
  private async rampUp(): Promise<void> {
    console.log(`\n📈 Ramping up to ${this.config.concurrentUsers} concurrent users...`);
    const step = Math.ceil(this.config.concurrentUsers / 10);
    const stepDuration = this.config.rampUpTime / 10;

    for (let i = step; i <= this.config.concurrentUsers; i += step) {
      console.log(`  → ${Math.min(i, this.config.concurrentUsers)} users`);
      await this.delay(stepDuration);
    }
  }

  /**
   * Execute warmup phase
   * Get the system stabilized before actual test
   */
  private async warmup(): Promise<void> {
    console.log(`\n🔥 Warming up system for ${this.config.warmupDuration / 1000}s...`);
    const warmupEndTime = Date.now() + this.config.warmupDuration;

    while (Date.now() < warmupEndTime) {
      await Promise.all([
        this.operationWalletTopUp(),
        this.operationWalletBalance(),
        this.operationWalletTransfer(),
      ]).catch(() => {});
    }

    this.metrics = []; // Clear warmup metrics
    console.log(`  ✓ Warmup complete`);
  }

  /**
   * Wallet Top-Up Operation
   */
  private async operationWalletTopUp(): Promise<void> {
    const operationName = 'wallet_topup';
    const startTime = performance.now();

    try {
      this.activeOperations++;
      const response = await this.client.post('/wallet/topup', {
        userId: `user_${Math.floor(Math.random() * 1000)}`,
        amount: Math.random() * 5000 + 500,
        currency: ['USD', 'EUR', 'AED', 'GBP'][Math.floor(Math.random() * 4)],
        paymentMethod: 'card',
        idempotencyKey: `topup_${Date.now()}_${Math.random()}`,
      });

      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        statusCode: response.status,
        success: response.status === 200,
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Wallet Balance Check Operation
   */
  private async operationWalletBalance(): Promise<void> {
    const operationName = 'wallet_balance';
    const startTime = performance.now();
    const userId = `user_${Math.floor(Math.random() * 1000)}`;

    try {
      this.activeOperations++;
      const response = await this.client.get(`/wallet/balance/${userId}`);

      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        statusCode: response.status,
        success: response.status === 200,
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Wallet Payment Operation
   */
  private async operationWalletPayment(): Promise<void> {
    const operationName = 'wallet_payment';
    const startTime = performance.now();

    try {
      this.activeOperations++;
      const response = await this.client.post('/wallet/pay', {
        userId: `user_${Math.floor(Math.random() * 100)}`,
        amount: Math.random() * 2000 + 100,
        currency: ['USD', 'EUR', 'AED'][Math.floor(Math.random() * 3)],
        bookingId: `booking_${Math.random().toString(36).substr(2, 9)}`,
      });

      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        statusCode: response.status,
        success: response.status === 200,
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Wallet Settlement Operation
   */
  private async operationWalletSettlement(): Promise<void> {
    const operationName = 'wallet_settlement';
    const startTime = performance.now();

    try {
      this.activeOperations++;
      const response = await this.client.post('/wallet/settlement', {
        supplierId: `supplier_${Math.floor(Math.random() * 5)}`,
        agencyId: `agency_${Math.floor(Math.random() * 10)}`,
        settlementAmount: Math.random() * 5000 + 500,
        currency: ['USD', 'EUR', 'AED'][Math.floor(Math.random() * 3)],
        invoiceId: `inv_${Date.now()}_${Math.random()}`,
        deductedCommission: Math.random() * 500,
      });

      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        statusCode: response.status,
        success: response.status === 200,
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Wallet Refund Operation
   */
  private async operationWalletRefund(): Promise<void> {
    const operationName = 'wallet_refund';
    const startTime = performance.now();

    try {
      this.activeOperations++;
      const response = await this.client.post('/wallet/refund', {
        userId: `user_${Math.floor(Math.random() * 100)}`,
        amount: Math.random() * 2000 + 100,
        currency: ['USD', 'EUR', 'AED'][Math.floor(Math.random() * 3)],
        reason: 'customer_request',
        bookingId: `booking_${Math.random().toString(36).substr(2, 9)}`,
      });

      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        statusCode: response.status,
        success: response.status === 200,
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Wallet Transfer Operation
   */
  private async operationWalletTransfer(): Promise<void> {
    const operationName = 'wallet_transfer';
    const startTime = performance.now();

    try {
      this.activeOperations++;
      const response = await this.client.post('/wallet/transfer', {
        fromUserId: `user_${Math.floor(Math.random() * 500)}`,
        toUserId: `user_${Math.floor(Math.random() * 500) + 500}`,
        amount: Math.random() * 1000 + 50,
        currency: ['USD', 'EUR', 'AED', 'GBP'][Math.floor(Math.random() * 4)],
        description: 'Inter-wallet transfer',
        idempotencyKey: `transfer_${Date.now()}_${Math.random()}`,
      });

      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        statusCode: response.status,
        success: response.status === 200,
      });
    } catch (error: any) {
      const responseTime = performance.now() - startTime;
      this.recordMetric({
        operation: operationName,
        responseTime,
        success: false,
        error: error.message || 'Unknown error',
      });
    } finally {
      this.activeOperations--;
    }
  }

  /**
   * Health check operation for monitoring
   */
  private async systemHealthCheck(): Promise<void> {
    try {
      const response = await this.client.get('/health');
      if (response.status === 200) {
        this.systemHealthCheckpoints.push({
          timestamp: Date.now(),
          activeConnections: response.data.activeConnections || 0,
          dbQueryTime: response.data.dbQueryTime || 0,
          memoryUsage: process.memoryUsage().heapUsed / 1024 / 1024, // MB
        });
      }
    } catch {
      // Health check failed, continue test
    }
  }

  /**
   * Record a metric snapshot
   */
  private recordMetric(metric: Partial<MetricsSnapshot>): void {
    this.metrics.push({
      timestamp: Date.now(),
      ...metric,
    } as MetricsSnapshot);
  }

  /**
   * Run the load test
   */
  async run(testName: string): Promise<LoadTestResults> {
    console.log(`\n${'═'.repeat(80)}`);
    console.log(`🧪 WALLET LOAD TEST: ${testName}`);
    console.log(`${'═'.repeat(80)}`);
    console.log(`Configuration:`);
    console.log(`  • Concurrent Users: ${this.config.concurrentUsers}`);
    console.log(`  • Test Duration: ${this.config.duration / 1000}s`);
    console.log(`  • Ramp-up Time: ${this.config.rampUpTime / 1000}s`);
    console.log(`  • Base URL: ${this.config.baseURL}`);

    const startTime = Date.now();

    // Warmup phase
    await this.warmup();

    // Ramp-up phase
    await this.rampUp();

    // Main load test
    console.log(`\n⚡ Running main load test...`);
    const testEndTime = startTime + this.config.duration;
    const healthCheckInterval = setInterval(() => this.systemHealthCheck(), 5000);

    const operations = [
      () => this.operationWalletTopUp(),
      () => this.operationWalletBalance(),
      () => this.operationWalletPayment(),
      () => this.operationWalletSettlement(),
      () => this.operationWalletRefund(),
      () => this.operationWalletTransfer(),
    ];

    // Generate load with concurrent users
    while (Date.now() < testEndTime) {
      const promises: Promise<void>[] = [];

      for (let i = 0; i < this.config.concurrentUsers; i++) {
        const operation = operations[Math.floor(Math.random() * operations.length)];
        promises.push(operation().catch(() => {}));
      }

      await Promise.all(promises);

      // Log progress every 10 iterations
      if (this.metrics.length % 100 === 0) {
        const ops = this.metrics.filter(m => m.success).length;
        const pct = ((Date.now() - startTime) / this.config.duration * 100).toFixed(1);
        process.stdout.write(
          `\r  Progress: ${pct}% | Operations: ${ops} | Avg Response: ${this.getAverageResponseTime().toFixed(0)}ms | Active: ${this.activeOperations}`
        );
      }
    }

    clearInterval(healthCheckInterval);
    const endTime = Date.now();

    console.log(`\n  ✓ Load test completed\n`);

    // Calculate results
    this.testResults = this.calculateResults(testName, startTime, endTime);
    return this.testResults;
  }

  /**
   * Calculate test results and metrics
   */
  private calculateResults(testName: string, startTime: number, endTime: number): LoadTestResults {
    const duration = endTime - startTime;
    const operationMetricsMap = new Map<string, OperationMetrics>();

    // Group metrics by operation
    const operationGroups: { [key: string]: MetricsSnapshot[] } = {};
    for (const metric of this.metrics) {
      if (!operationGroups[metric.operation]) {
        operationGroups[metric.operation] = [];
      }
      operationGroups[metric.operation].push(metric);
    }

    // Calculate metrics for each operation
    let totalSuccesses = 0;
    let totalFailures = 0;

    for (const [operation, metrics] of Object.entries(operationGroups)) {
      const successMetrics = metrics.filter(m => m.success);
      const failureMetrics = metrics.filter(m => !m.success);
      const responseTimes = successMetrics.map(m => m.responseTime).sort((a, b) => a - b);

      const opMetrics: OperationMetrics = {
        operation,
        count: metrics.length,
        successes: successMetrics.length,
        failures: failureMetrics.length,
        avgTime: responseTimes.length > 0 ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length : 0,
        minTime: responseTimes.length > 0 ? responseTimes[0] : 0,
        maxTime: responseTimes.length > 0 ? responseTimes[responseTimes.length - 1] : 0,
        p50: this.percentile(responseTimes, 50),
        p95: this.percentile(responseTimes, 95),
        p99: this.percentile(responseTimes, 99),
        throughput: (successMetrics.length / duration) * 1000,
        errorRate: metrics.length > 0 ? (failureMetrics.length / metrics.length) * 100 : 0,
      };

      operationMetricsMap.set(operation, opMetrics);
      totalSuccesses += opMetrics.successes;
      totalFailures += opMetrics.failures;
    }

    // Identify bottlenecks
    const bottlenecks = this.identifyBottlenecks(operationMetricsMap);
    const recommendations = this.generateRecommendations(operationMetricsMap, bottlenecks);

    return {
      testName,
      config: this.config,
      startTime,
      endTime,
      duration,
      totalOperations: this.metrics.length,
      totalSuccesses,
      totalFailures,
      overallThroughput: (totalSuccesses / duration) * 1000,
      operationMetrics: operationMetricsMap,
      bottlenecks,
      recommendations,
      systemHealthCheckpoints: this.systemHealthCheckpoints,
    };
  }

  /**
   * Calculate percentile
   */
  private percentile(sortedValues: number[], p: number): number {
    if (sortedValues.length === 0) return 0;
    const index = Math.ceil((p / 100) * sortedValues.length) - 1;
    return sortedValues[Math.max(0, index)];
  }

  /**
   * Get average response time
   */
  private getAverageResponseTime(): number {
    if (this.metrics.length === 0) return 0;
    const sum = this.metrics.reduce((acc, m) => acc + m.responseTime, 0);
    return sum / this.metrics.length;
  }

  /**
   * Identify performance bottlenecks
   */
  private identifyBottlenecks(metrics: Map<string, OperationMetrics>): string[] {
    const bottlenecks: string[] = [];

    for (const [operation, opMetrics] of metrics.entries()) {
      // High error rate
      if (opMetrics.errorRate > 5) {
        bottlenecks.push(`❌ ${operation}: High error rate (${opMetrics.errorRate.toFixed(1)}%)`);
      }

      // High P99 latency
      if (opMetrics.p99 > 1000) {
        bottlenecks.push(`⚠️  ${operation}: High P99 latency (${opMetrics.p99.toFixed(0)}ms)`);
      }

      // Low throughput
      if (opMetrics.throughput < 10) {
        bottlenecks.push(`📉 ${operation}: Low throughput (${opMetrics.throughput.toFixed(1)} ops/sec)`);
      }
    }

    return bottlenecks;
  }

  /**
   * Generate optimization recommendations
   */
  private generateRecommendations(metrics: Map<string, OperationMetrics>, bottlenecks: string[]): string[] {
    const recommendations: string[] = [];

    if (bottlenecks.length === 0) {
      recommendations.push('✅ System performing well under load');
    } else {
      recommendations.push('🔧 Performance Issues Detected:');

      for (const [operation, opMetrics] of metrics.entries()) {
        if (opMetrics.p99 > 500) {
          recommendations.push(`  → Optimize ${operation} queries (current P99: ${opMetrics.p99.toFixed(0)}ms)`);
        }

        if (opMetrics.avgTime > 200) {
          recommendations.push(`  → Add caching at ${operation} layer`);
        }

        if (opMetrics.errorRate > 1) {
          recommendations.push(`  → Increase timeout/retry logic for ${operation}`);
        }
      }

      recommendations.push('  → Consider database connection pool optimization');
      recommendations.push('  → Review query execution plans for slow operations');
      recommendations.push('  → Implement request rate limiting if needed');
    }

    return recommendations;
  }

  /**
   * Print results
   */
  printResults(): void {
    if (!this.testResults) {
      console.log('❌ No results available');
      return;
    }

    const r = this.testResults;

    console.log(`\n${'═'.repeat(80)}`);
    console.log(`📊 LOAD TEST RESULTS: ${r.testName}`);
    console.log(`${'═'.repeat(80)}\n`);

    // Summary
    console.log(`Summary:`);
    console.log(`  Duration:              ${(r.duration / 1000).toFixed(1)}s`);
    console.log(`  Total Operations:      ${r.totalOperations}`);
    console.log(`  Successful:            ${r.totalSuccesses} (${((r.totalSuccesses / r.totalOperations) * 100).toFixed(1)}%)`);
    console.log(`  Failed:                ${r.totalFailures} (${((r.totalFailures / r.totalOperations) * 100).toFixed(1)}%)`);
    console.log(`  Overall Throughput:    ${r.overallThroughput.toFixed(2)} ops/sec\n`);

    // Per-operation metrics
    console.log(`Per-Operation Metrics:`);
    console.log(`${'─'.repeat(80)}`);

    for (const [_, opMetrics] of r.operationMetrics.entries()) {
      console.log(`\n${opMetrics.operation.toUpperCase()}`);
      console.log(`  Count:                 ${opMetrics.count}`);
      console.log(`  Success Rate:          ${((opMetrics.successes / opMetrics.count) * 100).toFixed(1)}%`);
      console.log(`  Throughput:            ${opMetrics.throughput.toFixed(2)} ops/sec`);
      console.log(`  Response Times (ms):`);
      console.log(`    Min:                 ${opMetrics.minTime.toFixed(0)}`);
      console.log(`    Avg:                 ${opMetrics.avgTime.toFixed(0)}`);
      console.log(`    P50:                 ${opMetrics.p50.toFixed(0)}`);
      console.log(`    P95:                 ${opMetrics.p95.toFixed(0)}`);
      console.log(`    P99:                 ${opMetrics.p99.toFixed(0)}`);
      console.log(`    Max:                 ${opMetrics.maxTime.toFixed(0)}`);
    }

    // Bottlenecks
    if (r.bottlenecks.length > 0) {
      console.log(`\n${'─'.repeat(80)}`);
      console.log(`⚠️  Bottlenecks Detected:\n`);
      for (const bottleneck of r.bottlenecks) {
        console.log(`  ${bottleneck}`);
      }
    }

    // Recommendations
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`💡 Recommendations:\n`);
    for (const rec of r.recommendations) {
      console.log(`  ${rec}`);
    }

    console.log(`\n${'═'.repeat(80)}\n`);
  }

  /**
   * Save results to JSON file
   */
  saveResults(filename: string): void {
    if (!this.testResults) {
      console.log('❌ No results to save');
      return;
    }

    // Convert Map to object for JSON serialization
    const operationMetricsObj: { [key: string]: OperationMetrics } = {};
    for (const [key, value] of this.testResults.operationMetrics.entries()) {
      operationMetricsObj[key] = value;
    }

    const resultsForSaving = {
      ...this.testResults,
      operationMetrics: operationMetricsObj,
    };

    const reportDir = path.join(process.cwd(), 'test-reports');
    if (!fs.existsSync(reportDir)) {
      fs.mkdirSync(reportDir, { recursive: true });
    }

    const filepath = path.join(reportDir, filename);
    fs.writeFileSync(filepath, JSON.stringify(resultsForSaving, null, 2));
    console.log(`✅ Results saved to ${filepath}`);
  }

  /**
   * Helper: delay execution
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

/**
 * Run all load test scenarios
 */
async function runAllLoadTests(): Promise<void> {
  const baseURL = process.env.WALLET_API_URL || 'http://localhost:3001/api';

  // Test scenarios
  const scenarios = [
    {
      name: '🟢 Light Load (10 users, 60s)',
      config: {
        baseURL,
        duration: 60000,
        concurrentUsers: 10,
        rampUpTime: 5000,
        warmupDuration: 5000,
      } as LoadTestConfig,
    },
    {
      name: '🟡 Normal Load (50 users, 120s)',
      config: {
        baseURL,
        duration: 120000,
        concurrentUsers: 50,
        rampUpTime: 10000,
        warmupDuration: 5000,
      } as LoadTestConfig,
    },
    {
      name: '🔴 Peak Load (100 users, 180s)',
      config: {
        baseURL,
        duration: 180000,
        concurrentUsers: 100,
        rampUpTime: 15000,
        warmupDuration: 5000,
      } as LoadTestConfig,
    },
  ];

  for (const scenario of scenarios) {
    const suite = new WalletLoadTestSuite(scenario.config);
    const results = await suite.run(scenario.name);
    suite.printResults();
    suite.saveResults(`wallet-load-test-${Date.now()}.json`);

    // Stop if peak load test shows issues
    if (scenario.name.includes('Peak Load') && results.totalFailures > 0) {
      console.log(
        `\n⚠️  Peak load test detected issues. Consider reviewing recommendations before stress testing.`
      );
      break;
    }
  }

  console.log(`\n✅ All load tests completed!`);
}

// Run tests
runAllLoadTests().catch(error => {
  console.error('❌ Load test failed:', error);
  process.exit(1);
});
