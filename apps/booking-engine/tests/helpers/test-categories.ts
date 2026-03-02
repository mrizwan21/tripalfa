/**
 * Test Categorization Utilities
 * Epic: 99ed40b1-7f2a-4835-8eda-9976e060bb30
 * Spec: d0e3e304-309a-40c0-8e50-cc7e6322d692
 *
 * This module provides test categorization tags and utilities for organizing
 * and filtering E2E tests by category, priority, and type.
 */

import { test } from "@playwright/test";

/**
 * Test category tags for organizing tests
 */
export const TEST_CATEGORIES = {
  // Priority levels
  SMOKE: "@smoke",
  CRITICAL: "@critical",
  REGRESSION: "@regression",

  // Feature areas
  FLIGHT: "@flight",
  HOTEL: "@hotel",
  WALLET: "@wallet",
  PAYMENT: "@payment",
  BOOKING: "@booking",
  USER: "@user",
  AUTH: "@auth",

  // Test types
  ERROR: "@error",
  VALIDATION: "@validation",
  TIMEOUT: "@timeout",
  NETWORK: "@network",
  API: "@api",
  E2E: "@e2e",

  // Special testing
  VISUAL: "@visual",
  ACCESSIBILITY: "@a11y",
  PERFORMANCE: "@performance",
  SECURITY: "@security",

  // Environment
  LOCAL: "@local",
  CI: "@ci",
  STAGING: "@staging",
  PRODUCTION: "@prod",

  // Browser
  CHROMIUM: "@chromium",
  FIREFOX: "@firefox",
  WEBKIT: "@webkit",
  MOBILE: "@mobile",
  TABLET: "@tablet",
} as const;

/**
 * Test priority levels
 */
export const TEST_PRIORITY = {
  P0: "@P0", // Critical - must pass
  P1: "@P1", // High - should pass
  P2: "@P2", // Medium - nice to have
  P3: "@P3", // Low - future consideration
} as const;

/**
 * Test metadata interface
 */
export interface TestMetadata {
  category?: string;
  priority?: string;
  feature?: string;
  story?: string;
  ticket?: string;
  author?: string;
  created?: string;
  updated?: string;
}

/**
 * Create a test with metadata and tags
 */
export function createTaggedTest(
  title: string,
  metadata: TestMetadata,
  testFn: any,
) {
  const tags: string[] = [];

  if (metadata.category) tags.push(metadata.category);
  if (metadata.priority) tags.push(metadata.priority);
  if (metadata.feature) tags.push(`@feature:${metadata.feature}`);
  if (metadata.story) tags.push(`@story:${metadata.story}`);
  if (metadata.ticket) tags.push(`@ticket:${metadata.ticket}`);

  const tagString = tags.length > 0 ? ` ${tags.join(" ")}` : "";
  const fullTitle = `${title}${tagString}`;

  return test(fullTitle, testFn);
}

/**
 * Test decorator for adding metadata
 */
export function withMetadata(metadata: TestMetadata) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      // Add metadata to test context
      const testInfo = args.find(
        (arg) => arg && typeof arg === "object" && "title" in arg,
      );
      if (testInfo) {
        (testInfo as any).metadata = metadata;
      }
      return originalMethod.apply(this, args);
    };

    return descriptor;
  };
}

/**
 * Filter tests by category
 */
export function filterByCategory(tests: string[], category: string): string[] {
  return tests.filter((test) => test.includes(category));
}

/**
 * Filter tests by priority
 */
export function filterByPriority(tests: string[], priority: string): string[] {
  return tests.filter((test) => test.includes(priority));
}

/**
 * Get all smoke tests
 */
export function getSmokeTests(tests: string[]): string[] {
  return filterByCategory(tests, TEST_CATEGORIES.SMOKE);
}

/**
 * Get all critical tests
 */
export function getCriticalTests(tests: string[]): string[] {
  return filterByPriority(tests, TEST_PRIORITY.P0);
}

/**
 * Get tests by feature area
 */
export function getTestsByFeature(tests: string[], feature: string): string[] {
  return tests.filter((test) => test.includes(`@feature:${feature}`));
}

/**
 * Test suite builder for organizing tests
 */
export class TestSuiteBuilder {
  private tests: Array<{
    title: string;
    metadata: TestMetadata;
    fn: Function;
  }> = [];

  addTest(title: string, metadata: TestMetadata, fn: Function): this {
    this.tests.push({ title, metadata, fn });
    return this;
  }

  build(): void {
    this.tests.forEach(({ title, metadata, fn }) => {
      createTaggedTest(title, metadata, fn as any);
    });
  }

  filterByCategory(category: string): TestSuiteBuilder {
    const filtered = new TestSuiteBuilder();
    filtered.tests = this.tests.filter((t) => t.metadata.category === category);
    return filtered;
  }

  filterByPriority(priority: string): TestSuiteBuilder {
    const filtered = new TestSuiteBuilder();
    filtered.tests = this.tests.filter((t) => t.metadata.priority === priority);
    return filtered;
  }
}

/**
 * Generate test report metadata
 */
export function generateTestReportMetadata(
  testResults: any[],
  options: { includeFlaky?: boolean; includeSkipped?: boolean } = {},
): object {
  const { includeFlaky = true, includeSkipped = true } = options;

  const passed = testResults.filter((r) => r.status === "passed").length;
  const failed = testResults.filter((r) => r.status === "failed").length;
  const flaky = includeFlaky
    ? testResults.filter((r) => r.status === "flaky").length
    : 0;
  const skipped = includeSkipped
    ? testResults.filter((r) => r.status === "skipped").length
    : 0;

  // Group by category
  const byCategory: Record<string, number> = {};
  Object.values(TEST_CATEGORIES).forEach((cat) => {
    const count = testResults.filter(
      (r) => r.title && r.title.includes(cat),
    ).length;
    if (count > 0) {
      byCategory[cat] = count;
    }
  });

  // Group by priority
  const byPriority: Record<string, number> = {};
  Object.values(TEST_PRIORITY).forEach((pri) => {
    const count = testResults.filter(
      (r) => r.title && r.title.includes(pri),
    ).length;
    if (count > 0) {
      byPriority[pri] = count;
    }
  });

  return {
    summary: {
      total: testResults.length,
      passed,
      failed,
      flaky,
      skipped,
      passRate:
        testResults.length > 0 ? (passed / testResults.length) * 100 : 0,
    },
    byCategory,
    byPriority,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Export all test tags for use in test files
 */
export const TAGS = {
  ...TEST_CATEGORIES,
  ...TEST_PRIORITY,
};

export default {
  TEST_CATEGORIES,
  TEST_PRIORITY,
  createTaggedTest,
  withMetadata,
  filterByCategory,
  filterByPriority,
  getSmokeTests,
  getCriticalTests,
  getTestsByFeature,
  TestSuiteBuilder,
  generateTestReportMetadata,
  TAGS,
};
