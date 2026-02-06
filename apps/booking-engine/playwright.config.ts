import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

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
  testDir: './tests/e2e',

  // Timeout settings
  timeout: 60000, // 60 seconds per test
  expect: {
    timeout: 10000, // 10 seconds for assertions
  },

  // Test execution settings
  fullyParallel: true, // Run tests in parallel for speed
  forbidOnly: !!process.env.CI, // Fail CI if test.only is used
  retries: process.env.CI ? 2 : 1, // Retry failed tests
  workers: process.env.CI ? 2 : undefined, // Parallel workers

  // Reporter configuration
  reporter: [
    ['list'], // Console output
    ['html', {
      outputFolder: 'playwright-report',
      open: 'never' // Don't auto-open report
    }],
    ['json', {
      outputFile: 'test-results/results.json'
    }],
    // Add JUnit reporter for CI integration (future)
    // ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Global test settings
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3002',

    // Trace settings (for debugging)
    trace: 'on-first-retry', // Capture trace on retry
    screenshot: 'only-on-failure', // Screenshot on failure
    video: 'retain-on-failure', // Video on failure

    // Timeout settings
    actionTimeout: 15000, // 15 seconds for actions
    navigationTimeout: 30000, // 30 seconds for navigation

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Storage state (for authenticated tests)
    storageState: './tests/fixtures/storageState.json',
  },

  // Test projects (browsers)
  projects: [
    // Setup project (runs before all tests)
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
    },

    // Chromium (primary browser for Phase 1)
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        // Use storage state from setup
        storageState: './tests/fixtures/storageState.json',
      },
      dependencies: ['setup'],
    },

    // Add more browsers in Phase 2
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'] },
    //   dependencies: ['setup'],
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'] },
    //   dependencies: ['setup'],
    // },

    // Mobile browsers (Phase 3)
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    //   dependencies: ['setup'],
    // },
  ],

  // Global setup and teardown
  // globalSetup: path.resolve(__dirname, './tests/helpers/global.setup.ts'),
  // globalTeardown: path.resolve(__dirname, './tests/helpers/globalTeardown.ts'),

  // Output directory for test artifacts
  outputDir: 'test-results/',

  // Web server (optional - if you want Playwright to start the dev server)
  // Uncomment if you want automatic server startup
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3002',
  //   reuseExistingServer: !process.env.CI,
  //   timeout: 120000, // 2 minutes to start
  // },
});
