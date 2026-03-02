#!/usr/bin/env npx tsx
/**
 * LiteAPI Hotel - Performance & Load Testing
 *
 * Comprehensive performance metrics:
 * - Response time measurement (min/max/avg/p95/p99)
 * - Concurrent request handling
 * - Throughput analysis (requests per second)
 * - Memory usage tracking
 * - Endpoint comparison
 * - Load stress testing
 * - Bottleneck identification
 *
 * Usage:
 *   LITEAPI_API_KEY=<key> pnpm dlx tsx scripts/test-liteapi-performance.ts
 *   LOAD_LEVEL=high pnpm dlx tsx scripts/test-liteapi-performance.ts
 */

import axios, { AxiosError, AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

interface PerformanceMetrics {
  endpoint: string;
  method: string;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  totalDuration: number;
  minResponseTime: number;
  maxResponseTime: number;
  avgResponseTime: number;
  p95ResponseTime: number;
  p99ResponseTime: number;
  throughput: number; // requests per second
  errorRate: number; // percentage
  memoryUsage: {
    heapUsedMB: number;
    heapTotalMB: number;
    rssMB: number;
  };
}

function resolveLiteApiKey() {
  const envKey =
    process.env.LITEAPI_API_KEY ||
    process.env.LITEAPI_SANDBOX_API_KEY ||
    process.env.VITE_LITEAPI_TEST_API_KEY;

  if (envKey?.trim()) {
    return envKey.trim();
  }

  const keyFiles = [
    path.join(process.cwd(), "secrets", "liteapi_api_key.txt"),
    path.join(process.cwd(), "secrets", "liteapi_sandbox_key.txt"),
  ];

  for (const keyFile of keyFiles) {
    if (!fs.existsSync(keyFile)) continue;
    const fileKey = fs.readFileSync(keyFile, "utf8").trim();
    if (fileKey) return fileKey;
  }

  return "liteapi_sandbox_xxxxx";
}

function calculatePercentile(sortedTimes: number[], percentile: number): number {
  const index = Math.ceil((percentile / 100) * sortedTimes.length) - 1;
  return sortedTimes[Math.max(0, index)];
}

const getLoadLevel = (): { concurrent: number; iterations: number } => {
  const level = (process.env.LOAD_LEVEL || "medium").toLowerCase();
  switch (level) {
    case "light":
      return { concurrent: 5, iterations: 20 };
    case "low":
      return { concurrent: 10, iterations: 50 };
    case "medium":
      return { concurrent: 25, iterations: 100 };
    case "high":
      return { concurrent: 50, iterations: 200 };
    case "stress":
      return { concurrent: 100, iterations: 500 };
    default:
      return { concurrent: 25, iterations: 100 };
  }
};

class LiteApiPerformanceClient {
  private apiClient: AxiosInstance;
  private bookClient: AxiosInstance;
  private verbose: boolean;

  constructor(apiKey: string, verbose = false) {
    this.verbose = verbose;

    const headers = {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
    };

    this.apiClient = axios.create({
      baseURL: process.env.LITEAPI_API_BASE_URL || "https://api.liteapi.travel/v3.0",
      timeout: Number(process.env.LITEAPI_TIMEOUT_MS || 90000),
      headers,
    });

    this.bookClient = axios.create({
      baseURL: process.env.LITEAPI_BOOK_BASE_URL || "https://book.liteapi.travel/v3.0",
      timeout: Number(process.env.LITEAPI_TIMEOUT_MS || 90000),
      headers,
    });
  }

  async performanceTest(endpoint: string, method: string, concurrent: number, iterations: number) {
    const responseTimes: number[] = [];
    let successCount = 0;
    let failureCount = 0;

    console.log(
      `   ⏱ Running ${iterations} requests (${concurrent} concurrent) to ${method} ${endpoint}...`,
    );

    const startTime = Date.now();

    // Execute requests in batches
    for (let i = 0; i < iterations; i += concurrent) {
      const batch = [];
      const batchSize = Math.min(concurrent, iterations - i);

      for (let j = 0; j < batchSize; j++) {
        batch.push(this.timedRequest(endpoint, responseTimes, successCount, failureCount));
      }

      await Promise.all(batch);
    }

    const totalDuration = Date.now() - startTime;
    const avgTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const sortedTimes = [...responseTimes].sort((a, b) => a - b);

    return {
      totalRequests: iterations,
      successfulRequests: successCount,
      failedRequests: failureCount,
      totalDuration,
      minResponseTime: Math.min(...responseTimes),
      maxResponseTime: Math.max(...responseTimes),
      avgResponseTime: Math.round(avgTime),
      p95ResponseTime: calculatePercentile(sortedTimes, 95),
      p99ResponseTime: calculatePercentile(sortedTimes, 99),
      throughput: Math.round((iterations / totalDuration) * 1000),
      errorRate: (failureCount / iterations) * 100,
    };
  }

  private async timedRequest(
    endpoint: string,
    responseTimes: number[],
    successCount: number,
    failureCount: number,
  ) {
    const startTime = Date.now();

    try {
      if (endpoint === "/data/languages") {
        await this.apiClient.get(endpoint);
      } else if (endpoint === "/hotels/rates") {
        await this.apiClient.post(endpoint, {
          cityName: "Paris",
          countryCode: "FR",
          checkin: "2026-04-01",
          checkout: "2026-04-04",
          currency: "USD",
          guestNationality: "US",
          occupancies: [{ adults: 2, children: [] }],
          limit: 5,
        });
      } else {
        await this.apiClient.get(endpoint);
      }

      responseTimes.push(Date.now() - startTime);
      successCount++;
    } catch (error) {
      responseTimes.push(Date.now() - startTime);
      failureCount++;
    }
  }
}

class LiteApiPerformanceRunner {
  private readonly apiKey: string;
  private readonly verbose: boolean;
  private readonly client: LiteApiPerformanceClient;
  private readonly results: PerformanceMetrics[] = [];
  private startTime: number = 0;
  private readonly loadLevel: { concurrent: number; iterations: number };

  constructor() {
    this.apiKey = resolveLiteApiKey();
    this.verbose = process.env.VERBOSE === "true" || process.env.DEBUG === "true";
    this.client = new LiteApiPerformanceClient(this.apiKey, this.verbose);
    this.loadLevel = getLoadLevel();
  }

  private maskApiKey(value: string) {
    if (!value || value.length < 8) return "<missing>";
    return `${value.substring(0, 6)}...${value.substring(value.length - 4)}`;
  }

  private getMemoryUsage() {
    const memUsage = process.memoryUsage();
    return {
      heapUsedMB: Math.round(memUsage.heapUsed / 1024 / 1024),
      heapTotalMB: Math.round(memUsage.heapTotal / 1024 / 1024),
      rssMB: Math.round(memUsage.rss / 1024 / 1024),
    };
  }

  async run() {
    console.clear();
    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║      LITEAPI HOTEL - PERFORMANCE & LOAD TESTING          ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    console.log("📍 LiteAPI Configuration:");
    console.log(`   API URL:  ${process.env.LITEAPI_API_BASE_URL || "https://api.liteapi.travel/v3.0"}`);
    console.log(`   API Key:  ${this.maskApiKey(this.apiKey)}`);
    console.log(`   Load Level: ${(process.env.LOAD_LEVEL || "medium").toUpperCase()}`);
    console.log(`   Concurrent: ${this.loadLevel.concurrent}, Iterations: ${this.loadLevel.iterations}\n`);

    if (!this.apiKey || this.apiKey.includes("xxxxx")) {
      throw new Error("LiteAPI key not found");
    }

    this.startTime = Date.now();

    // Test 1: Connectivity/Languages Endpoint
    console.log("➤ Testing: GET /data/languages (connectivity)...");
    const langMetrics = await this.client.performanceTest(
      "/data/languages",
      "GET",
      this.loadLevel.concurrent,
      this.loadLevel.iterations,
    );
    console.log(`   ✓ Completed\n`);

    // Test 2: Hotel Rates Search Endpoint
    console.log("➤ Testing: POST /hotels/rates (search)...");
    const ratesMetrics = await this.client.performanceTest(
      "/hotels/rates",
      "POST",
      Math.ceil(this.loadLevel.concurrent / 2), // Fewer concurrent for heavy endpoint
      Math.ceil(this.loadLevel.iterations / 2),
    );
    console.log(`   ✓ Completed\n`);

    // Store results
    this.results.push({
      endpoint: "/data/languages",
      method: "GET",
      totalRequests: langMetrics.totalRequests,
      successfulRequests: langMetrics.successfulRequests,
      failedRequests: langMetrics.failedRequests,
      totalDuration: langMetrics.totalDuration,
      minResponseTime: langMetrics.minResponseTime,
      maxResponseTime: langMetrics.maxResponseTime,
      avgResponseTime: langMetrics.avgResponseTime,
      p95ResponseTime: langMetrics.p95ResponseTime,
      p99ResponseTime: langMetrics.p99ResponseTime,
      throughput: langMetrics.throughput,
      errorRate: langMetrics.errorRate,
      memoryUsage: this.getMemoryUsage(),
    });

    this.results.push({
      endpoint: "/hotels/rates",
      method: "POST",
      totalRequests: ratesMetrics.totalRequests,
      successfulRequests: ratesMetrics.successfulRequests,
      failedRequests: ratesMetrics.failedRequests,
      totalDuration: ratesMetrics.totalDuration,
      minResponseTime: ratesMetrics.minResponseTime,
      maxResponseTime: ratesMetrics.maxResponseTime,
      avgResponseTime: ratesMetrics.avgResponseTime,
      p95ResponseTime: ratesMetrics.p95ResponseTime,
      p99ResponseTime: ratesMetrics.p99ResponseTime,
      throughput: ratesMetrics.throughput,
      errorRate: ratesMetrics.errorRate,
      memoryUsage: this.getMemoryUsage(),
    });

    await this.printSummary();
  }

  private async printSummary() {
    const totalDuration = Date.now() - this.startTime;

    console.log("\n╔═══════════════════════════════════════════════════════════╗");
    console.log("║           PERFORMANCE TEST RESULTS SUMMARY               ║");
    console.log("╚═══════════════════════════════════════════════════════════╝\n");

    this.results.forEach((result) => {
      console.log(`📊 ${result.method} ${result.endpoint}`);
      console.log(`   Requests: ${result.totalRequests} total | ${result.successfulRequests} succeeded | ${result.failedRequests} failed`);
      console.log(`   Error Rate: ${result.errorRate.toFixed(2)}%`);
      console.log(
        `   Response Time (ms): min=${result.minResponseTime} | max=${result.maxResponseTime} | avg=${result.avgResponseTime}`,
      );
      console.log(
        `   Percentiles: p95=${result.p95ResponseTime.toFixed(0)}ms | p99=${result.p99ResponseTime.toFixed(0)}ms`,
      );
      console.log(`   Throughput: ${result.throughput} req/s`);
      console.log(
        `   Memory: heap ${result.memoryUsage.heapUsedMB}MB/${result.memoryUsage.heapTotalMB}MB | rss ${result.memoryUsage.rssMB}MB`,
      );
      console.log("");
    });

    // Performance Summary
    const avgResponseTime =
      this.results.reduce((sum, r) => sum + r.avgResponseTime, 0) / this.results.length;
    const avgThroughput =
      this.results.reduce((sum, r) => sum + r.throughput, 0) / this.results.length;
    const totalErrorRate =
      (this.results.reduce((sum, r) => sum + r.failedRequests, 0) /
        this.results.reduce((sum, r) => sum + r.totalRequests, 0)) *
      100;

    console.log("📈 Overall Performance Metrics:");
    console.log(`   Avg Response Time: ${Math.round(avgResponseTime)}ms`);
    console.log(`   Avg Throughput: ${Math.round(avgThroughput)} req/s`);
    console.log(`   Overall Error Rate: ${totalErrorRate.toFixed(2)}%`);
    console.log(`   Test Duration: ${(totalDuration / 1000).toFixed(2)}s`);

    console.log("\n─────────────────────────────────────────────────────────────");
    console.log(`Total Endpoints Tested: ${this.results.length}`);
    console.log(`Total Load Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log("─────────────────────────────────────────────────────────────\n");

    if (totalErrorRate < 5) {
      console.log("╔═══════════════════════════════════════════════════════════╗");
      console.log("║         PERFORMANCE TEST COMPLETED SUCCESSFULLY ✓         ║");
      console.log("╚═══════════════════════════════════════════════════════════╝\n");
      process.exit(0);
    } else {
      console.log("╔═══════════════════════════════════════════════════════════╗");
      console.log(`║   PERFORMANCE TEST COMPLETED (${totalErrorRate.toFixed(2)}% errors)         ║`);
      console.log("╚═══════════════════════════════════════════════════════════╝\n");
      process.exit(totalErrorRate > 10 ? 1 : 0);
    }
  }
}

async function main() {
  const runner = new LiteApiPerformanceRunner();
  await runner.run();
}

main().catch((error) => {
  console.error("Fatal error:", error.message);
  process.exit(1);
});
