import { defineConfig, devices, PlaywrightTestConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load test environment variables with fallback
const envFile = process.env.TEST_ENV === 'ci' ? '.env.test.ci' : '.env.test';
dotenv.config({ path: path.resolve(__dirname, envFile) });

/**
 * Enhanced Playwright Configuration for E2E Testing
 * Epic: 99ed40b1-7f2a-4835-8eda-9976e060bb30
 * Spec: d0e3e304-309a-40c0-8e50-cc7e6322d692
 *
 * This enhanced configuration provides:
 * - Environment-specific settings (local, ci, staging, production)
 * - Advanced reporting (HTML, JSON, JUnit, Allure-ready)
 * - Test categorization and tagging
 * - Mobile and cross-browser testing
 * - Visual regression testing support
 * - Performance monitoring
 * - Enhanced debugging capabilities
 */

// Environment detection
const isCI = !!process.env.CI;
const isStaging = process.env.TEST_ENV === 'staging';
const isProduction = process.env.TEST_ENV === 'production';
const testEnv = process.env.TEST_ENV || 'local';

// Test categorization tags
const TEST_CATEGORIES = {
  SMOKE: '@smoke',
  CRITICAL: '@critical',
  REGRESSION: '@regression',
  FLIGHT: '@flight',
  HOTEL: '@hotel',
  WALLET: '@wallet',
  PAYMENT: '@payment',
  BOOKING: '@booking',
  ERROR: '@error',
  API: '@api',
  VISUAL: '@visual',
  ACCESSIBILITY: '@a11y',
  PERFORMANCE: '@performance',
} as const;

// Environment-specific timeouts
const TIMEOUTS = {
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

const currentTimeouts = TIMEOUTS[testEnv as keyof typeof TIMEOUTS] || TIMEOUTS.local;

// Reporter configuration based on environment
function getReporters(): PlaywrightTestConfig['reporter'] {
  const reporters: PlaywrightTestConfig['reporter'] = [
    ['list'], // Console output
    ['html', {
      outputFolder: `playwright-report-${testEnv}`,
      open: isCI ? 'never' : 'on-failure',
    }],
    ['json', {
      outputFile: `test-results/results-${testEnv}.json`,
    }],
  ];

  // Add JUnit reporter for CI integration
  if (isCI) {
    reporters.push(['junit', {
      outputFile: `test-results/junit-${testEnv}.xml`,
    }]);
  }

  // Add line reporter for better CI output
  if (isCI) {
    reporters.push(['line']);
  }

  // Allure reporter support (if ALLURE_RESULTS_DIR is set)
  if (process.env.ALLURE_RESULTS_DIR) {
    reporters.push(['allure-playwright']);
  }

  return reporters;
}

// Browser configurations
function getProjects() {
  const projects: PlaywrightTestConfig['projects'] = [
    // Setup project (runs before all tests)
    {
      name: 'setup',
      testMatch: /global\.setup\.ts/,
      teardown: 'teardown',
    },

    // Teardown project (runs after all tests)
    {
      name: 'teardown',
      testMatch: /global\.teardown\.ts/,
    },

    // Chromium - Primary browser
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/fixtures/storageState.json',
      },
      dependencies: ['setup'],
    },

    // Chromium - High DPI
    {
      name: 'chromium-high-dpi',
      use: {
        ...devices['Desktop Chrome HiDPI'],
        storageState: './tests/fixtures/storageState.json',
      },
      dependencies: ['setup'],
    },
  ];

  // Add Firefox for non-CI environments or when explicitly enabled
  if (!isCI || process.env.TEST_FIREFOX === 'true') {
    projects.push({
      name: 'firefox',
      use: {
        ...devices['Desktop Firefox'],
        storageState: './tests/fixtures/storageState.json',
      },
      dependencies: ['setup'],
    });
  }

  // Add WebKit for non-CI environments or when explicitly enabled
  if (!isCI || process.env.TEST_WEBKIT === 'true') {
    projects.push({
      name: 'webkit',
      use: {
        ...devices['Desktop Safari'],
        storageState: './tests/fixtures/storageState.json',
      },
      dependencies: ['setup'],
    });
  }

  // Mobile browsers
  if (process.env.TEST_MOBILE === 'true' || testEnv === 'staging') {
    projects.push(
      {
        name: 'mobile-chrome',
        use: {
          ...devices['Pixel 5'],
          storageState: './tests/fixtures/storageState.json',
        },
        dependencies: ['setup'],
      },
      {
        name: 'mobile-safari',
        use: {
          ...devices['iPhone 12'],
          storageState: './tests/fixtures/storageState.json',
        },
        dependencies: ['setup'],
      }
    );
  }

  // Tablet browsers
  if (process.env.TEST_TABLET === 'true') {
    projects.push({
      name: 'tablet-chrome',
      use: {
        ...devices['iPad (gen 7)'],
        storageState: './tests/fixtures/storageState.json',
      },
      dependencies: ['setup'],
    });
  }

  // Visual regression testing project
  if (process.env.TEST_VISUAL === 'true') {
    projects.push({
      name: 'visual-regression',
      use: {
        ...devices['Desktop Chrome'],
        storageState: './tests/fixtures/storageState.json',
      },
      testMatch: /.*\.visual\.spec\.ts/,
      dependencies: ['setup'],
    });
  }

  // Smoke tests only (fast feedback)
  if (process.env.TEST_SMOKE_ONLY === 'true') {
    return projects.filter(p =>
      p.name === 'setup' ||
      p.name === 'teardown' ||
      p.name === 'chromium'
    );
  }

  return projects;
}

// Metadata for test runs
const testRunMetadata = {
  environment: testEnv,
  timestamp: new Date().toISOString(),
  ci: isCI,
  branch: process.env.GITHUB_REF_NAME || 'local',
  commit: process.env.GITHUB_SHA || 'unknown',
  buildId: process.env.GITHUB_RUN_ID || 'local',
  nodeVersion: process.version,
  platform: process.platform,
};

// Main configuration
export default defineConfig({
  // Test directory
  testDir: './tests/e2e',

  // Test file patterns
  testMatch: /.*\.spec\.ts/,
  testIgnore: process.env.TEST_SMOKE_ONLY === 'true'
    ? /.*(?<!\.smoke)\.spec\.ts/
    : undefined,

  // Timeout settings - environment specific
  timeout: currentTimeouts.test,
  expect: {
    timeout: currentTimeouts.expect,
    // Visual comparison options
    toHaveScreenshot: {
      maxDiffPixels: 100,
      threshold: 0.2,
    },
    toMatchSnapshot: {
      maxDiffPixelRatio: 0.02,
    },
  },

  // Test execution settings
  fullyParallel: !isCI, // Run tests in parallel for speed (except CI)
  forbidOnly: isCI, // Fail CI if test.only is used
  retries: isCI ? 2 : 1, // Retry failed tests
  workers: isCI ? 2 : undefined, // Parallel workers
  maxFailures: isCI ? 5 : undefined, // Stop after 5 failures in CI

  // Reporter configuration
  reporter: getReporters(),

  // Global test settings
  use: {
    // Base URL for navigation
    baseURL: process.env.BASE_URL || 'http://localhost:3002',

    // API URL for backend calls
    apiBaseURL: process.env.API_URL || 'http://localhost:3003',

    // Trace settings (for debugging)
    trace: isCI ? 'on-first-retry' : 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: isCI ? 'retain-on-failure' : 'on',

    // Timeout settings
    actionTimeout: currentTimeouts.action,
    navigationTimeout: currentTimeouts.navigation,

    // Browser context options
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,

    // Storage state (for authenticated tests)
    storageState: './tests/fixtures/storageState.json',

    // Test metadata
    testIdAttribute: 'data-testid',

    // Action logging
    actionLog: process.env.DEBUG_TESTS === 'true',

    // Custom test options
    testEnv,
    testRunMetadata,

    // Launch options
    launchOptions: {
      slowMo: process.env.SLOW_MO ? parseInt(process.env.SLOW_MO, 10) : 0,
      devtools: process.env.DEBUG_TESTS === 'true',
    },

    // Context options
    contextOptions: {
      recordHar: process.env.RECORD_HAR === 'true' ? {
        path: 'test-results/network.har',
      } : undefined,
    },
  },

  // Test projects (browsers)
  projects: getProjects(),

  // Global setup and teardown
  globalSetup: path.resolve(__dirname, './tests/helpers/global.setup.ts'),
  globalTeardown: path.resolve(__dirname, './tests/helpers/globalTeardown.ts'),

  // Output directory for test artifacts
  outputDir: `test-results-${testEnv}/`,

  // Snapshot directory for visual regression
  snapshotDir: './tests/snapshots',

  // Web server configuration
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3002',
    reuseExistingServer: !isCI,
    timeout: 120000,
    env: {
      NODE_ENV: 'test',
      TEST_MODE: 'true',
    },
  },

  // Preserve output for debugging
  preserveOutput: 'always',

  // Update snapshots in CI when explicitly requested
  updateSnapshots: process.env.UPDATE_SNAPSHOTS === 'true' ? 'all' : 'missing',

  // Quiet mode for less verbose output
  quiet: process.env.QUIET_TESTS === 'true',

  // Seed for reproducible test runs
  seed: process.env.TEST_SEED ? parseInt(process.env.TEST_SEED, 10) : undefined,
});

// Export test categories for use in tests
export { TEST_CATEGORIES, testRunMetadata, currentTimeouts };
