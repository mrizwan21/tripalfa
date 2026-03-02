/**
 * Enhanced Test Utilities
 * Epic: 99ed40b1-7f2a-4835-8eda-9976e060bb30
 * Spec: d0e3e304-309a-40c0-8e50-cc7e6322d692
 *
 * This module provides enhanced test utilities for better debugging,
 * performance monitoring, and test management.
 */

import { Page, TestInfo, expect } from "@playwright/test";
import {
  TEST_CATEGORIES,
  TEST_PRIORITY,
  TestMetadata,
} from "./test-categories";

/**
 * Performance metrics collector
 */
export interface PerformanceMetrics {
  testName: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  navigationTimings: NavigationTiming[];
  actionTimings: ActionTiming[];
  memoryUsage?: MemoryUsage;
}

interface NavigationTiming {
  url: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface ActionTiming {
  action: string;
  selector?: string;
  startTime: number;
  endTime: number;
  duration: number;
}

interface MemoryUsage {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

/**
 * Enhanced test context with performance monitoring
 */
export class EnhancedTestContext {
  private metrics: PerformanceMetrics;
  private page: Page;
  private testInfo: TestInfo;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
    this.metrics = {
      testName: testInfo.title,
      startTime: Date.now(),
      navigationTimings: [],
      actionTimings: [],
    };

    this.setupNavigationMonitoring();
  }

  private setupNavigationMonitoring(): void {
    this.page.on("framenavigated", async (frame) => {
      if (frame === this.page.mainFrame()) {
        const timing: NavigationTiming = {
          url: frame.url(),
          startTime: Date.now(),
          endTime: 0,
          duration: 0,
        };

        try {
          await frame.waitForLoadState("networkidle");
          timing.endTime = Date.now();
          timing.duration = timing.endTime - timing.startTime;
          this.metrics.navigationTimings.push(timing);
        } catch (error) {
          // Navigation might have been interrupted
        }
      }
    });
  }

  /**
   * Record action timing
   */
  async recordAction<T>(
    actionName: string,
    action: () => Promise<T>,
    selector?: string,
  ): Promise<T> {
    const timing: ActionTiming = {
      action: actionName,
      selector,
      startTime: Date.now(),
      endTime: 0,
      duration: 0,
    };

    try {
      const result = await action();
      timing.endTime = Date.now();
      timing.duration = timing.endTime - timing.startTime;
      this.metrics.actionTimings.push(timing);
      return result;
    } catch (error) {
      timing.endTime = Date.now();
      timing.duration = timing.endTime - timing.startTime;
      this.metrics.actionTimings.push(timing);
      throw error;
    }
  }

  /**
   * Collect memory usage
   */
  async collectMemoryUsage(): Promise<MemoryUsage | undefined> {
    try {
      const metrics = await this.page.evaluate(() => {
        if ("memory" in performance && performance.memory) {
          return {
            usedJSHeapSize: (performance.memory as any).usedJSHeapSize,
            totalJSHeapSize: (performance.memory as any).totalJSHeapSize,
            jsHeapSizeLimit: (performance.memory as any).jsHeapSizeLimit,
          };
        }
        return undefined;
      });

      this.metrics.memoryUsage = metrics;
      return metrics;
    } catch (error) {
      return undefined;
    }
  }

  /**
   * Finalize metrics collection
   */
  finalize(): PerformanceMetrics {
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;
    return this.metrics;
  }

  /**
   * Get current metrics
   */
  getMetrics(): PerformanceMetrics {
    return this.metrics;
  }

  /**
   * Attach metrics to test report
   */
  async attachMetrics(): Promise<void> {
    const finalMetrics = this.finalize();
    await this.testInfo.attach("performance-metrics", {
      body: JSON.stringify(finalMetrics, null, 2),
      contentType: "application/json",
    });
  }
}

/**
 * Test retry analyzer
 */
export class RetryAnalyzer {
  private retryCount: number = 0;
  private maxRetries: number;
  private flakyPatterns: RegExp[] = [
    /timeout/i,
    /network/i,
    /navigation/i,
    /element not found/i,
    /detached/i,
  ];

  constructor(maxRetries: number = 2) {
    this.maxRetries = maxRetries;
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: Error): boolean {
    const errorMessage = error.message.toLowerCase();
    return this.flakyPatterns.some((pattern) => pattern.test(errorMessage));
  }

  /**
   * Get retry count
   */
  getRetryCount(): number {
    return this.retryCount;
  }

  /**
   * Increment retry count
   */
  incrementRetry(): void {
    this.retryCount++;
  }

  /**
   * Check if should retry
   */
  shouldRetry(error: Error): boolean {
    return this.retryCount < this.maxRetries && this.isRetryable(error);
  }
}

/**
 * Screenshot comparison utility
 */
export class ScreenshotComparator {
  private page: Page;
  private testInfo: TestInfo;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  /**
   * Take screenshot with metadata
   */
  async takeScreenshot(
    name: string,
    options?: {
      fullPage?: boolean;
      clip?: { x: number; y: number; width: number; height: number };
    },
  ): Promise<Buffer> {
    const screenshot = await this.page.screenshot({
      fullPage: options?.fullPage ?? false,
      clip: options?.clip,
    });

    await this.testInfo.attach(`screenshot-${name}`, {
      body: screenshot,
      contentType: "image/png",
    });

    return screenshot;
  }

  /**
   * Compare screenshot with baseline
   */
  async compareWithBaseline(
    name: string,
    options?: {
      threshold?: number;
      maxDiffPixels?: number;
    },
  ): Promise<{ matches: boolean; diff?: Buffer }> {
    const threshold = options?.threshold ?? 0.2;
    const maxDiffPixels = options?.maxDiffPixels ?? 100;

    try {
      await expect(this.page).toHaveScreenshot(name, {
        threshold,
        maxDiffPixels,
      });
      return { matches: true };
    } catch (error) {
      return { matches: false };
    }
  }
}

/**
 * Network monitoring utility
 */
export class NetworkMonitor {
  private page: Page;
  private requests: any[] = [];
  private responses: any[] = [];

  constructor(page: Page) {
    this.page = page;
    this.setupMonitoring();
  }

  private setupMonitoring(): void {
    this.page.on("request", (request) => {
      this.requests.push({
        url: request.url(),
        method: request.method(),
        headers: request.headers(),
        timestamp: Date.now(),
      });
    });

    this.page.on("response", async (response) => {
      this.responses.push({
        url: response.url(),
        status: response.status(),
        statusText: response.statusText(),
        headers: response.headers(),
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Get all requests
   */
  getRequests(): any[] {
    return this.requests;
  }

  /**
   * Get all responses
   */
  getResponses(): any[] {
    return this.responses;
  }

  /**
   * Get failed requests
   */
  getFailedRequests(): any[] {
    return this.responses.filter((r) => r.status >= 400);
  }

  /**
   * Clear monitoring data
   */
  clear(): void {
    this.requests = [];
    this.responses = [];
  }

  /**
   * Generate network report
   */
  generateReport(): object {
    return {
      totalRequests: this.requests.length,
      totalResponses: this.responses.length,
      failedRequests: this.getFailedRequests().length,
      requests: this.requests,
      responses: this.responses,
    };
  }
}

/**
 * Console log collector
 */
export class ConsoleCollector {
  private page: Page;
  private logs: Array<{ type: string; text: string; timestamp: number }> = [];

  constructor(page: Page) {
    this.page = page;
    this.setupCollector();
  }

  private setupCollector(): void {
    this.page.on("console", (msg) => {
      this.logs.push({
        type: msg.type(),
        text: msg.text(),
        timestamp: Date.now(),
      });
    });
  }

  /**
   * Get all logs
   */
  getLogs(): Array<{ type: string; text: string; timestamp: number }> {
    return this.logs;
  }

  /**
   * Get error logs
   */
  getErrors(): Array<{ type: string; text: string; timestamp: number }> {
    return this.logs.filter((log) => log.type === "error");
  }

  /**
   * Get warning logs
   */
  getWarnings(): Array<{ type: string; text: string; timestamp: number }> {
    return this.logs.filter((log) => log.type === "warning");
  }

  /**
   * Clear logs
   */
  clear(): void {
    this.logs = [];
  }
}

/**
 * Test data generator
 */
export class TestDataGenerator {
  /**
   * Generate unique test email
   */
  static generateEmail(prefix: string = "test"): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000);
    return `${prefix}_${timestamp}_${random}@example.com`;
  }

  /**
   * Generate unique booking reference
   */
  static generateBookingReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.floor(Math.random() * 10000)
      .toString(36)
      .toUpperCase();
    return `BK${timestamp}${random}`;
  }

  /**
   * Generate future date
   */
  static generateFutureDate(daysFromNow: number = 7): Date {
    const date = new Date();
    date.setDate(date.getDate() + daysFromNow);
    return date;
  }

  /**
   * Generate random passenger data
   */
  static generatePassenger(
    type: "adult" | "child" | "infant" = "adult",
  ): object {
    const firstNames = ["John", "Jane", "Michael", "Sarah", "David", "Emma"];
    const lastNames = [
      "Smith",
      "Johnson",
      "Williams",
      "Brown",
      "Jones",
      "Garcia",
    ];

    return {
      type,
      title: type === "adult" ? (Math.random() > 0.5 ? "Mr" : "Ms") : "Mstr",
      firstName: firstNames[Math.floor(Math.random() * firstNames.length)],
      lastName: lastNames[Math.floor(Math.random() * lastNames.length)],
      dateOfBirth: this.generateDateOfBirth(type),
    };
  }

  private static generateDateOfBirth(
    type: "adult" | "child" | "infant",
  ): string {
    const now = new Date();
    let years = 0;

    switch (type) {
      case "adult":
        years = 25 + Math.floor(Math.random() * 40);
        break;
      case "child":
        years = 5 + Math.floor(Math.random() * 10);
        break;
      case "infant":
        years = 0;
        now.setMonth(now.getMonth() - Math.floor(Math.random() * 12));
        break;
    }

    now.setFullYear(now.getFullYear() - years);
    return now.toISOString().split("T")[0];
  }
}

/**
 * Wait utilities
 */
export class WaitUtils {
  /**
   * Wait for element to be stable (not animating)
   */
  static async waitForStable(
    page: Page,
    selector: string,
    timeout: number = 5000,
  ): Promise<void> {
    await page.waitForFunction(
      (sel) => {
        const element = document.querySelector(sel);
        if (!element) return false;

        const rect = element.getBoundingClientRect();
        return new Promise((resolve) => {
          let lastRect = rect;
          let stableCount = 0;

          const check = () => {
            const currentRect = element.getBoundingClientRect();
            if (
              currentRect.x === lastRect.x &&
              currentRect.y === lastRect.y &&
              currentRect.width === lastRect.width &&
              currentRect.height === lastRect.height
            ) {
              stableCount++;
              if (stableCount >= 3) {
                resolve(true);
                return;
              }
            } else {
              stableCount = 0;
              lastRect = currentRect;
            }
            requestAnimationFrame(check);
          };

          check();
        });
      },
      selector,
      { timeout },
    );
  }

  /**
   * Wait for network idle with custom timeout
   */
  static async waitForNetworkIdle(
    page: Page,
    idleTime: number = 500,
    timeout: number = 10000,
  ): Promise<void> {
    await page.waitForLoadState("networkidle", { timeout });
  }
}

/**
 * Export all utilities
 */
export default {
  EnhancedTestContext,
  RetryAnalyzer,
  ScreenshotComparator,
  NetworkMonitor,
  ConsoleCollector,
  TestDataGenerator,
  WaitUtils,
};
