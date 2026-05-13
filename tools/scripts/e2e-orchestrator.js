#!/usr/bin/env node
/**
 * Multi-Agent E2E Test Orchestrator
 * 
 * Distributes test execution across multiple agents for parallel testing
 * of different modules without interruption.
 */

import { spawn } from 'child_process';
import { readdir } from 'fs/promises';
import { join } from 'path';

const TEST_MODULES = {
  auth: {
    name: 'Authentication Module',
    dir: 'tests/e2e/auth',
    tests: ['login.spec.ts', 'register.spec.ts', 'forgot-password.spec.ts'],
    priority: 'high',
  },
  flights: {
    name: 'Flight Booking Module',
    dir: 'tests/e2e/flights',
    tests: [
      'flight-search.spec.ts',
      'flight-list.spec.ts',
      'flight-booking.spec.ts',
      'flight-full-flow.spec.ts',
      'multileg-flights.spec.ts',
      'flight-filters-advanced.spec.ts',
      'ancillaries-addons.spec.ts',
    ],
    priority: 'high',
  },
  hotels: {
    name: 'Hotel Booking Module',
    dir: 'tests/e2e/hotels',
    tests: [
      'hotel-list.spec.ts',
      'hotel-search.spec.ts',
      'hotel-booking.spec.ts',
      'hotel-full-flow.spec.ts',
    ],
    priority: 'high',
  },
  bookings: {
    name: 'Booking Management Module',
    dir: 'tests/e2e/bookings',
    tests: [
      'booking-management.spec.ts',
      'booking-detail-postbooking.spec.ts',
      'documents-templates.spec.ts',
    ],
    priority: 'medium',
  },
  profile: {
    name: 'User Profile Module',
    dir: 'tests/e2e/profile',
    tests: ['profile.spec.ts', 'account-settings.spec.ts'],
    priority: 'medium',
  },
  navigation: {
    name: 'Navigation Module',
    dir: 'tests/e2e/navigation',
    tests: [
      'routing.spec.ts',
      'notifications-alerts.spec.ts',
      'notification-preferences.spec.ts',
    ],
    priority: 'medium',
  },
  loyalty: {
    name: 'Loyalty Module',
    dir: 'tests/e2e/loyalty',
    tests: ['loyalty.spec.ts'],
    priority: 'low',
  },
  wallet: {
    name: 'Wallet Module',
    dir: 'tests/e2e/wallet',
    tests: ['wallet.spec.ts'],
    priority: 'low',
  },
  dashboard: {
    name: 'Dashboard Module',
    dir: 'tests/e2e/dashboard',
    tests: ['dashboard.spec.ts'],
    priority: 'medium',
  },
  forms: {
    name: 'Forms Module',
    dir: 'tests/e2e/forms',
    tests: ['form-validation.spec.ts'],
    priority: 'medium',
  },
  components: {
    name: 'Interactive Components Module',
    dir: 'tests/e2e/components',
    tests: ['interactive-modals.spec.ts'],
    priority: 'low',
  },
  api: {
    name: 'API Integration Module',
    dir: 'tests/e2e/api',
    tests: ['api-error-handling.spec.ts'],
    priority: 'high',
  },
};

class TestAgent {
  constructor(moduleId, config) {
    this.moduleId = moduleId;
    this.config = config;
    this.status = 'pending';
    this.process = null;
  }

  async run() {
    this.status = 'running';
    console.log(`\n🤖 Agent ${this.moduleId.toUpperCase()} starting...`);
    
    const testPattern = `${this.config.dir}/*.spec.ts`;
    
    return new Promise((resolve) => {
      const args = [
        'test:e2e',
        '--',
        testPattern,
        '--reporter=list',
      ];

      const proc = spawn('pnpm', args, {
        stdio: 'inherit',
        shell: true,
        env: { ...process.env, CI: 'true' },
      });

      this.process = proc;

      proc.on('close', (code) => {
        this.status = code === 0 ? 'passed' : 'failed';
        console.log(`\n✅ Agent ${this.moduleId.toUpperCase()} completed: ${this.status}`);
        resolve({ moduleId: this.moduleId, status: this.status, code });
      });

      proc.on('error', (error) => {
        this.status = 'error';
        console.error(`\n❌ Agent ${this.moduleId.toUpperCase()} error:`, error.message);
        resolve({ moduleId: this.moduleId, status: 'error', error: error.message });
      });
    });
  }

  stop() {
    if (this.process) {
      this.process.kill('SIGTERM');
      this.status = 'stopped';
    }
  }
}

class TestOrchestrator {
  constructor() {
    this.agents = [];
    this.results = [];
  }

  async runAllModules() {
    console.log('🚀 Starting Multi-Agent E2E Test Execution\n');
    console.log('='.repeat(60));
    
    const modules = Object.keys(TEST_MODULES);
    const agentPromises = [];

    // Create and start agents for all modules
    for (const moduleId of modules) {
      const config = TEST_MODULES[moduleId];
      const agent = new TestAgent(moduleId, config);
      this.agents.push(agent);
      agentPromises.push(agent.run());
      
      // Small delay between agent starts to avoid resource contention
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // Wait for all agents to complete
    this.results = await Promise.all(agentPromises);
    
    this.printSummary();
    return this.results;
  }

  async runSpecificModules(moduleIds) {
    console.log('🚀 Starting Selective Multi-Agent E2E Test Execution\n');
    
    const agentPromises = [];
    
    for (const moduleId of moduleIds) {
      if (TEST_MODULES[moduleId]) {
        const config = TEST_MODULES[moduleId];
        const agent = new TestAgent(moduleId, config);
        this.agents.push(agent);
        agentPromises.push(agent.run());
        await new Promise(resolve => setTimeout(resolve, 500));
      } else {
        console.warn(`⚠️  Module '${moduleId}' not found, skipping...`);
      }
    }

    this.results = await Promise.all(agentPromises);
    this.printSummary();
    return this.results;
  }

  printSummary() {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST EXECUTION SUMMARY');
    console.log('='.repeat(60));
    
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;
    
    console.log(`\nTotal Modules: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Errors: ${errors}`);
    
    console.log('\nModule Details:');
    this.results.forEach(result => {
      const icon = result.status === 'passed' ? '✅' : result.status === 'failed' ? '❌' : '⚠️';
      console.log(`  ${icon} ${result.moduleId}: ${result.status}`);
    });
    
    const allPassed = passed === this.results.length;
    console.log('\n' + '='.repeat(60));
    console.log(allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED');
    console.log('='.repeat(60));
    
    process.exit(allPassed ? 0 : 1);
  }
}

// CLI Interface
const args = process.argv.slice(2);
const orchestrator = new TestOrchestrator();

if (args.includes('--all')) {
  orchestrator.runAllModules();
} else if (args.length > 0) {
  orchestrator.runSpecificModules(args);
} else {
  // Default: run all modules
  orchestrator.runAllModules();
}
