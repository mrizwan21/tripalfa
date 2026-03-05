/**
 * Unified Playwright Configuration for E2E Testing
 * 
 * This configuration consolidates all testing needs into a single master config:
 * - Local development with real APIs
 * - CI/CD pipelines
 * - Staging/Production environments
 * - Cross-browser testing
 * - Visual regression testing
 * 
 * Usage:
 *   npm run test:e2e              # Run all E2E tests (local, real APIs)
 *   npm run test:e2e:mock        # Run E2E tests with MSW mocks
 *   npm run test:e2e:ci          # Run tests optimized for CI
 *   npm run test:e2e:staging     # Run against staging environment
 *   npm run test:e2e:smoke       # Run smoke tests only
 *   npm run test:e2e:ui          # Run with Playwright UI
 *   npm run test:e2e:debug       # Run in debug mode
 *   npm run test:e2e:visual      # Run visual regression tests
 *   npm run test:e2e:mobile      # Run mobile tests
 *   npm run test:e2e:cross       # Run cross-browser tests
 */

import { defineConfig, devices, PlaywrightTestConfig } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Detect test mode from environment
const isCI = !!process.env.CI;
const isMockMode = process.env.TEST_MODE_MOCK === "true";
const testEnv = process.env.TEST_ENV || "local";

// Load environment-specific variables
const envFile = testEnv === "ci" ? ".env.test.ci" : 
                testEnv === "staging" ? ".env.test.staging" : 
                ".env.test";
dotenv.config({ path: path.resolve(__dirname, envFile) });

// Test categories for filtering
const TEST_CATEGORIES = {
  SMOKE: "@smoke",
  CRITICAL: "@critical",
  REGRESSION: "@regression",
  FLIGHT: "@flight",
  HOTEL: "@hotel",
  WALLET: "@wallet",
  PAYMENT: "@payment",
  BOOKING: "@booking",
  ERROR: "@error",
  API: "@api",
  VISUAL: "@visual",
  ACCESSIBILITY: "@a11y",
  PERFORMANCE: "@performance",
} as const;

// Environment-specific timeout configurations
const TIMEOUTS: Record<string, { test: number; expect: number; action: number; navigation: number }> = {
  local: {
    test: 60000,
    expect: 10000,
    action: 15000,
    navigation: 30000,
  },
  ci: {
    test: 90000,
    expect: 15000,
    action: 20000,
    navigation: 45000,
  },
  staging: {
    test: 120000,
    expect: 20000,
    action: 25000,
    navigation: 60000,
  },
  production: {
    test: 180000,
    expect: 30000,
    action: 30000,
    navigation: 90000,
  },
};

const currentTimeouts = TIMEOUTS[testEnv] || TIMEOUTS.local;

// Base URL configuration based on environment
const getBaseURL = () => {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  
  switch (testEnv) {
    case "ci":
      return process.env.CI_BASE_URL || "http://localhost:3002";
    case "staging":
      return process.env.STAGING_URL || "https://staging.tripalfa.com";
    case "production":
      return process.env.PRODUCTION_URL || "https://tripalfa.com";
    default:
      return "http://localhost:5173";
  }
};

// API Base URL for backend calls
const getAPIURL = () => {
  if (process.env.API_URL) return process.env.API_URL;
  if (process.env.VITE_API_BASE_URL) return process.env.VITE_API_BASE_URL;
  
  switch (testEnv) {
    case "ci":
      return "http://localhost:3003";
    case "staging":
      return "https://api.staging.tripalfa.com";
    case "production":
      return "https://api.tripalfa.com";
    default:
      return "http://localhost:3003";
  }
};

// Reporter configuration
function getReporters(): PlaywrightTestConfig["reporter"] {
  const reporters: PlaywrightTestConfig["reporter"] = [
    ["list"],
    [
      "html",
      {
        outputFolder: `playwright-report-${testEnv}`,
        open: isCI ? "never" : "on-failure",
      },
    ],
    [
      "json",
      {
        outputFile: `test-results/results-${testEnv}.json`,
      },
    ],
  ];

  // Add JUnit reporter for CI
  if (isCI) {
    reporters.push([
      "junit",
      {
        outputFile: `test-results/junit-${testEnv}.xml`,
      },
    ]);
    reporters.push(["line"]);
  }

  // Allure support
  if (process.env.ALLURE_RESULTS_DIR) {
    reporters.push(["allure-playwright"]);
  }

  return reporters;
}

// Project configuration
function getProjects() {
  const baseProjects: PlaywrightTestConfig["projects"] = [
    // Setup project
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
      teardown: "teardown",
    },
    // Teardown project
    {
      name: "teardown",
      testMatch: /global\.teardown\.ts/,
    },
  ];

  // Chromium - always included
  baseProjects.push({
    name: "chromium",
    use: {
      ...devices["Desktop Chrome"],
      storageState: "./tests/fixtures/storageState.json",
    },
    dependencies: ["setup"],
  });

  // Firefox - optional, enabled via env
  if (!isCI || process.env.TEST_FIREFOX === "true") {
    baseProjects.push({
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "./tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    });
  }

  // WebKit - optional, enabled via env
  if (!isCI || process.env.TEST_WEBKIT === "true") {
    baseProjects.push({
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: "./tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    });
  }

  // Mobile tests - opt-in
  if (process.env.TEST_MOBILE === "true" || testEnv === "staging") {
    baseProjects.push(
      {
        name: "mobile-chrome",
        use: {
          ...devices["Pixel 5"],
          storageState: "./tests/fixtures/storageState.json",
        },
        dependencies: ["setup"],
      },
      {
        name: "mobile-safari",
        use: {
          ...devices["iPhone 12"],
          storageState: "./tests/fixtures/storageState.json",
        },
        dependencies: ["setup"],
      }
    );
  }

  // Tablet tests - opt-in
  if (process.env.TEST_TABLET === "true") {
    baseProjects.push({
      name: "tablet-chrome",
      use: {
        ...devices["iPad (gen 7)"],
        storageState: "./tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    });
  }

  // Visual regression - opt-in
  if (process.env.TEST_VISUAL === "true") {
    baseProjects.push({
      name: "visual-regression",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "./tests/fixtures/storageState.json",
      },
      testMatch: /.*\.visual\.spec\.ts/,
      dependencies: ["setup"],
    });
  }

  // Smoke tests - limited scope
  if (process.env.TEST_SMOKE_ONLY === "true") {
    return baseProjects.filter(
      (p) => p.name === "setup" || p.name === "teardown" || p.name === "chromium"
    );
  }

  return baseProjects;
}

// Web server configuration
function getWebServer() {
  // For staging/production, no web server needed
  if (testEnv === "staging" || testEnv === "production") {
    return undefined;
  }

  return {
    command: testEnv === "ci" ? "npm run dev" : "npm run dev:test",
    url: testEnv === "ci" ? "http://localhost:3002" : "http://localhost:5173",
    reuseExistingServer: !isCI,
    timeout: 120000,
    env: {
      NODE_ENV: "test",
      VITE_TEST_MODE: isMockMode ? "true" : "false",
      VITE_API_BASE_URL: getAPIURL(),
    },
  };
}

// Main configuration export
export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",
  
  // Test file patterns
  testMatch: /.*\.spec\.ts/,
  testIgnore: process.env.TEST_SMOKE_ONLY === "true" 
    ? /.*(?<!\.smoke)\.spec\.ts/ 
    : undefined,

  // Timeouts
  timeout: currentTimeouts.test,
  expect: {
    timeout: currentTimeouts.expect,
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  // Test execution
  fullyParallel: !isCI,
  forbidOnly: isCI,
  retries: isCI ? 2 : 1,
  workers: isCI ? 2 : undefined,
  maxFailures: isCI ? 5 : undefined,

  // Reporters
  reporter: getReporters(),

  // Global settings
  use: {
    baseURL: getBaseURL(),
    apiBaseURL: getAPIURL(),
    
    // Trace & video
    trace: isCI ? "on-first-retry" : "retain-on-failure",
    screenshot: "only-on-failure",
    video: isCI ? "retain-on-failure" : "on",
    
    // Timeouts
    actionTimeout: currentTimeouts.action,
    navigationTimeout: currentTimeouts.navigation,
    
    // Browser context
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    
    // Auth
    storageState: "./tests/fixtures/storageState.json",
    
    // Test ID
    testIdAttribute: "data-testid",
    
    // Test metadata
    testEnv,
    isMockMode,
    
    // Launch options
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
      devtools: process.env.DEBUG_TESTS === "true",
    },
    
    // HAR recording
    contextOptions: {
      recordHar: process.env.RECORD_HAR === "true"
        ? { path: "test-results/network.har" }
        : undefined,
    },
  },

  // Projects
  projects: getProjects(),

  // Global setup/teardown
  globalSetup: path.resolve(__dirname, "./tests/helpers/global.setup.ts"),
  globalTeardown: path.resolve(__dirname, "./tests/helpers/globalTeardown.ts"),

  // Output
  outputDir: `test-results-${testEnv}/`,
  snapshotDir: "./tests/snapshots",
  preserveOutput: "always",

  // Web server
  webServer: getWebServer(),

  // Snapshots
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === "true" ? "all" : "missing",

  // Quiet mode
  quiet: process.env.QUIET_TESTS === "true",

  // Seed for reproducibility
  seed: process.env.TEST_SEED ? parseInt(process.env.TEST_SEED, 10) : undefined,
});

// Export for use in tests
export { TEST_CATEGORIES, currentTimeouts, getBaseURL, getAPIURL };
