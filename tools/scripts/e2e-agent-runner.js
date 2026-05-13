#!/usr/bin/env node
/**
 * Playwright Test Agent Runner
 * 
 * Runs specific test suites with isolated contexts for parallel execution.
 * Designed for autonomous execution in CI/CD environments.
 */

import { execSync, spawn } from 'child_process';
import { existsSync } from 'fs';
import { join } from 'path';

const WORKSPACE_ROOT = process.cwd();
const BOOKING_ENGINE_PATH = join(WORKSPACE_ROOT, 'apps/booking-engine');

// Test configuration profiles
const PROFILES = {
  development: {
    baseURL: 'http://localhost:5174',
    timeout: 45000,
    retries: 0,
    workers: 2,
  },
  ci: {
    baseURL: 'http://localhost:5174',
    timeout: 60000,
    retries: 2,
    workers: 4,
  },
  staging: {
    baseURL: process.env.STAGING_URL || 'https://staging.tripalfa.com',
    timeout: 60000,
    retries: 2,
    workers: 4,
  },
  production: {
    baseURL: process.env.PRODUCTION_URL || 'https://tripalfa.com',
    timeout: 60000,
    retries: 1,
    workers: 8,
  },
};

// Module definitions with test patterns
const MODULES = {
  auth: {
    pattern: 'tests/e2e/auth/*.spec.ts',
    description: 'Authentication & Authorization',
    dependencies: [],
  },
  flights: {
    pattern: 'tests/e2e/flights/*.spec.ts',
    description: 'Flight Search & Booking',
    dependencies: ['auth'],
  },
  hotels: {
    pattern: 'tests/e2e/hotels/*.spec.ts',
    description: 'Hotel Search & Booking',
    dependencies: ['auth'],
  },
  bookings: {
    pattern: 'tests/e2e/bookings/*.spec.ts',
    description: 'Booking Management',
    dependencies: ['auth'],
  },
  profile: {
    pattern: 'tests/e2e/profile/*.spec.ts',
    description: 'User Profile Management',
    dependencies: ['auth'],
  },
  dashboard: {
    pattern: 'tests/e2e/dashboard/*.spec.ts',
    description: 'Dashboard & Analytics',
    dependencies: ['auth'],
  },
  loyalty: {
    pattern: 'tests/e2e/loyalty/*.spec.ts',
    description: 'Loyalty Program',
    dependencies: ['auth'],
  },
  wallet: {
    pattern: 'tests/e2e/wallet/*.spec.ts',
    description: 'Wallet & Payments',
    dependencies: ['auth'],
  },
  navigation: {
    pattern: 'tests/e2e/navigation/*.spec.ts',
    description: 'Navigation & Routing',
    dependencies: [],
  },
  forms: {
    pattern: 'tests/e2e/forms/*.spec.ts',
    description: 'Form Validation',
    dependencies: [],
  },
  components: {
    pattern: 'tests/e2e/components/*.spec.ts',
    description: 'Interactive Components',
    dependencies: [],
  },
  api: {
    pattern: 'tests/e2e/api/*.spec.ts',
    description: 'API Integration',
    dependencies: [],
  },
};

class TestRunner {
  constructor(options = {}) {
    this.profile = options.profile || 'development';
    this.moduleId = options.moduleId;
    this.config = PROFILES[this.profile];
    this.verbose = options.verbose || false;
  }

  async run() {
    console.log(`\n🧪 Starting Test Runner`);
    console.log(`Profile: ${this.profile}`);
    console.log(`Module: ${this.moduleId || 'all'}`);
    
    try {
      await this.ensureDependencies();
      await this.startDevServer();
      await this.runTests();
    } catch (error) {
      console.error('❌ Test execution failed:', error.message);
      process.exit(1);
    }
  }

  async ensureDependencies() {
    console.log('\n📦 Checking dependencies...');
    
    try {
      execSync('pnpm install', { 
        stdio: 'inherit',
        cwd: BOOKING_ENGINE_PATH 
      });
    } catch (error) {
      throw new Error('Failed to install dependencies');
    }
  }

  async startDevServer() {
    console.log('\n🚀 Starting development server...');
    
    return new Promise((resolve, reject) => {
      const server = spawn('pnpm', ['dev:test'], {
        cwd: BOOKING_ENGINE_PATH,
        shell: true,
        stdio: ['ignore', 'pipe', 'pipe'],
      });

      let serverReady = false;
      const timeout = setTimeout(() => {
        if (!serverReady) {
          reject(new Error('Server startup timeout'));
        }
      }, 60000);

      server.stdout.on('data', (data) => {
        const output = data.toString();
        if (output.includes('Local:') || output.includes('localhost:5174')) {
          serverReady = true;
          clearTimeout(timeout);
          console.log('✅ Development server ready');
          resolve(server);
        }
        
        if (this.verbose) {
          console.log(output);
        }
      });

      server.stderr.on('data', (data) => {
        if (this.verbose) {
          console.error(data.toString());
        }
      });
    });
  }

  async runTests() {
    console.log('\n⚙️  Running Playwright tests...');
    
    const pattern = this.moduleId 
      ? MODULES[this.moduleId]?.pattern || `tests/e2e/${this.moduleId}/*.spec.ts`
      : 'tests/e2e/**/*.spec.ts';

    const args = [
      'test:e2e',
      '--',
      pattern,
      `--reporter=${this.verbose ? 'list' : 'html'}`,
    ];

    try {
      execSync(`pnpm ${args.join(' ')}`, {
        cwd: BOOKING_ENGINE_PATH,
        stdio: 'inherit',
        shell: true,
        env: {
          ...process.env,
          CI: 'true',
        },
      });
      console.log('\n✅ Tests completed successfully');
    } catch (error) {
      console.error('\n❌ Tests failed');
      throw error;
    }
  }
}

// CLI interface
const args = process.argv.slice(2);
const options = {
  profile: 'development',
  verbose: false,
};

args.forEach(arg => {
  if (arg.startsWith('--profile=')) {
    options.profile = arg.split('=')[1];
  } else if (arg.startsWith('--module=')) {
    options.moduleId = arg.split('=')[1];
  } else if (arg === '--verbose' || arg === '-v') {
    options.verbose = true;
  }
});

const runner = new TestRunner(options);
runner.run();
