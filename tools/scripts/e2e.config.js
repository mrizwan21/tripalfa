/**
 * E2E Testing Configuration
 * 
 * Centralized configuration for all E2E testing scenarios
 */

export const TEST_CONFIG = {
  // Base test settings
  timeout: 45000,
  expectTimeout: 10000,
  retries: 0,
  
  // Parallelization
  fullyParallel: true,
  workers: 4,
  
  // Reporting
  reporter: [
    ['list'],
    ['html', { outputFolder: 'playwright-report', open: 'never' }],
    ['json', { outputFile: 'test-results/result.json' }],
  ],
  
  // Browser settings
  viewport: { width: 1440, height: 900 },
  
  // Test environment
  baseURL: process.env.BASE_URL || 'http://localhost:5174',
  
  // Modules to test
  modules: {
    auth: {
      dir: 'tests/e2e/auth',
      pattern: 'tests/e2e/auth/*.spec.ts',
      priority: 'high',
      timeout: 30000,
    },
    flights: {
      dir: 'tests/e2e/flights',
      pattern: 'tests/e2e/flights/*.spec.ts',
      priority: 'high',
      timeout: 60000,
    },
    hotels: {
      dir: 'tests/e2e/hotels',
      pattern: 'tests/e2e/hotels/*.spec.ts',
      priority: 'high',
      timeout: 60000,
    },
    bookings: {
      dir: 'tests/e2e/bookings',
      pattern: 'tests/e2e/bookings/*.spec.ts',
      priority: 'high',
      timeout: 45000,
    },
    profile: {
      dir: 'tests/e2e/profile',
      pattern: 'tests/e2e/profile/*.spec.ts',
      priority: 'medium',
      timeout: 30000,
    },
    dashboard: {
      dir: 'tests/e2e/dashboard',
      pattern: 'tests/e2e/dashboard/*.spec.ts',
      priority: 'medium',
      timeout: 30000,
    },
    loyalty: {
      dir: 'tests/e2e/loyalty',
      pattern: 'tests/e2e/loyalty/*.spec.ts',
      priority: 'low',
      timeout: 30000,
    },
    wallet: {
      dir: 'tests/e2e/wallet',
      pattern: 'tests/e2e/wallet/*.spec.ts',
      priority: 'medium',
      timeout: 30000,
    },
    navigation: {
      dir: 'tests/e2e/navigation',
      pattern: 'tests/e2e/navigation/*.spec.ts',
      priority: 'medium',
      timeout: 30000,
    },
    forms: {
      dir: 'tests/e2e/forms',
      pattern: 'tests/e2e/forms/*.spec.ts',
      priority: 'medium',
      timeout: 30000,
    },
    components: {
      dir: 'tests/e2e/components',
      pattern: 'tests/e2e/components/*.spec.ts',
      priority: 'low',
      timeout: 30000,
    },
    api: {
      dir: 'tests/e2e/api',
      pattern: 'tests/e2e/api/*.spec.ts',
      priority: 'high',
      timeout: 30000,
    },
  },
};

export const AGENT_CONFIG = {
  // Agent execution settings
  maxParallelAgents: 3,
  retryOnFailure: true,
  maxRetries: 2,
  
  // Timeout per agent
  agentTimeout: 300000, // 5 minutes
  
  // Reporting
  reportResults: true,
  saveScreenshots: true,
  saveVideos: true,
  
  // Execution mode
  autonomous: true,
  stopOnFailure: false,
};

export const CI_CONFIG = {
  // CI/CD specific settings
  retries: 2,
  workers: 4,
  shard: process.env.CI_SHARD ? parseInt(process.env.CI_SHARD) : 1,
  totalShards: process.env.CI_TOTAL_SHARDS ? parseInt(process.env.CI_TOTAL_SHARDS) : 1,
};
