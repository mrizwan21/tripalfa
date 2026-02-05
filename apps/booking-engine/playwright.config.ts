/* global process */

import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables
dotenv.config({ path: path.resolve(__dirname, '.env.test') });

/**
 * Playwright configuration optimized for Phase 1 E2E testing
 *
 * Phase 1 Optimizations:
 * - Conservative timeouts for reliable test execution
 * - Single browser (Chromium) focus for faster feedback
 * - Setup project for better test isolation
 * - Comprehensive reporting (HTML + JSON)
 * - Standardized viewport and error handling
 *
 * Future Phases:
 * - Phase 2: Add Firefox and WebKit browsers
 * - Phase 3: Add mobile browser testing
 * - CI Integration: Enable JUnit reporter and webServer
 */
export default defineConfig({
  // Test directory configuration
  testDir: './tests/e2e',

  // Global timeout settings - optimized for Phase 1
  timeout: 60000, // Overall test timeout (unchanged)

  // Expect timeout - reduced for faster assertion feedback
  expect: {
    timeout: 10000, // Reduced from 30000ms for quicker failures
  },

  // Parallel execution settings
  fullyParallel: true,
  retries: process.env.CI ? 2 : 1,
  workers: process.env.CI ? 2 : undefined,

  // CI safety check - prevent accidental test.only in CI
  forbidOnly: !!process.env.CI,

  // Reporter configuration - comprehensive reporting for Phase 1
  reporter: [
    ['list'], // Console output for development
    ['html', {
      outputFolder: 'playwright-report', // HTML report directory
      open: 'never' // Don't auto-open in browser
    }],
    ['json', {
      outputFile: 'test-results/results.json' // JSON output for analysis
    }]
    // JUnit reporter commented for future CI integration
    // ['junit', { outputFile: 'test-results/junit.xml' }],
  ],

  // Browser context options - standardized for Phase 1
  use: {
    baseURL: process.env.BASE_URL || 'http://localhost:3002',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',

    // Optimized timeouts for Phase 1
    actionTimeout: 15000, // Reduced from 30000ms for responsive feedback
    navigationTimeout: 30000, // Reduced from 60000ms for quicker detection

    // Standardized test environment
    viewport: { width: 1280, height: 720 }, // Consistent viewport across tests
    ignoreHTTPSErrors: true, // Allow HTTP for local development
  },

  // Projects configuration - Phase 1: Chromium only with setup dependency
  projects: [
    // Setup project runs before all tests for better isolation
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      use: { storageState: undefined }, // No storage state for setup
    },

    // Phase 1: Chromium only for focused testing
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'], storageState: './tests/fixtures/storageState.json' },
      dependencies: ['setup'], // Depends on setup project
    },

    // Phase 2/3: Additional browsers (commented for Phase 1)
    /*
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
    {
      name: 'Mobile Chrome',
      use: { ...devices['Pixel 5'] },
    },
    {
      name: 'Mobile Safari',
      use: { ...devices['iPhone 12'] },
    },
    */
  ],

  // Output directories
  outputDir: 'test-results/',
  snapshotDir: 'tests/__snapshots__',

  // WebServer configuration - commented for Phase 1 (manual server startup preferred)
  /*
  webServer: process.env.CI ? undefined : {
    command: 'npm run dev',
    port: 3002,
    timeout: 120000,
    reuseExistingServer: !process.env.CI,
  },
  */
});
