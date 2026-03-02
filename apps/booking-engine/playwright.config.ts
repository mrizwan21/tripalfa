import { defineConfig, devices } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, ".env.test") });

// @ts-ignore
declare global {
  namespace NodeJS {
    interface ProcessEnv {
      CI?: string;
      BASE_URL?: string;
    }
  }
}

/**
 * Playwright Configuration for E2E Testing
 * Phase 1: Critical E2E Testing Foundation
 *
 * This configuration is optimized for:
 * - Fast test execution (parallel mode)
 * - Reliable test runs (auto-waiting, retries)
 * - Great debugging (traces, screenshots, videos)
 * - Test isolation (clean state per test)
 */
export default defineConfig({
  // Test directory
  testDir: "./tests/e2e",

  // Enhanced timeout settings
  timeout: 90000, // 90 seconds for complex flows
  expect: {
    timeout: 15000, // 15 seconds for assertions
  },

  // Enhanced test execution settings
  fullyParallel: true, // Run tests in parallel for speed
  forbidOnly: !!process.env.CI, // Fail CI if test.only is used
  retries: process.env.CI ? 3 : 2, // Enhanced retry strategy
  workers: process.env.CI ? 2 : 4, // Parallel workers

  // Reporter configuration
  reporter: [
    ["list"], // Console output
    [
      "html",
      {
        outputFolder: "playwright-report",
        open: "never", // Don't auto-open report
      },
    ],
    [
      "json",
      {
        outputFile: "test-results/results.json",
      },
    ],
    // Add JUnit reporter for CI integration (future)
    // ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Enhanced global test settings
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || "http://localhost:5173",

    // Enhanced trace settings (for debugging)
    trace: "retain-on-failure", // Capture trace on failure
    screenshot: "only-on-failure", // Screenshot on failure
    video: "retain-on-failure", // Video on failure

    // Enhanced timeout settings
    actionTimeout: 20000, // 20 seconds for actions
    navigationTimeout: 45000, // 45 seconds for navigation

    // Enhanced browser context options
    viewport: { width: 1440, height: 900 }, // Larger viewport for better testing
    ignoreHTTPSErrors: true,

    // Enhanced storage state (for authenticated tests)
    storageState: "./tests/fixtures/storageState.json",

    // Additional reliability settings
    headless: process.env.CI ? true : false, // Headless in CI, headed locally
    launchOptions: {
      // Slower execution for more reliable tests
      slowMo: process.env.CI ? 0 : 100,
    },
  },

  // Test projects (browsers)
  projects: [
    // Setup project (runs before all tests)
    {
      name: "setup",
      testMatch: /global\.setup\.ts/,
    },

    // Chromium (primary browser for Phase 1)
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        // Use storage state from setup
        storageState: "./tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    },

    // Firefox browser (Phase 2)
    {
      name: "firefox",
      use: {
        ...devices["Desktop Firefox"],
        storageState: "./tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    },

    // WebKit browser (Phase 2)
    {
      name: "webkit",
      use: {
        ...devices["Desktop Safari"],
        storageState: "./tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    },

    // Mobile browsers (Phase 3)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
  ],

  // Global setup and teardown
  globalSetup: path.resolve(__dirname, "./tests/helpers/global.setup.ts"),
  globalTeardown: path.resolve(__dirname, "./tests/helpers/globalTeardown.ts"),

  // Output directory for test artifacts
  outputDir: "test-results/",

  // Web server configuration - Playwright will start/stop the dev server automatically
  webServer: {
    command: "npm run dev:test",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120000, // 2 minutes to start
    env: {
      NODE_ENV: "test",
      VITE_TEST_MODE: "true",
      VITE_API_BASE_URL: "http://localhost:3003",
    },
  },
});
