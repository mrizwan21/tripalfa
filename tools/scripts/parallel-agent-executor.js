#!/usr/bin/env node
/**
 * Multi-Agent Parallel Test Executor
 * 
 * Distributes test execution across multiple parallel agents
 * for maximum throughput in autonomous mode.
 */

import { spawn } from 'child_process';
import { mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

const MODULES = {
  auth: { pattern: 'tests/e2e/auth/*.spec.ts', timeout: 30000 },
  flights: { pattern: 'tests/e2e/flights/*.spec.ts', timeout: 60000 },
  hotels: { pattern: 'tests/e2e/hotels/*.spec.ts', timeout: 60000 },
  bookings: { pattern: 'tests/e2e/bookings/*.spec.ts', timeout: 45000 },
  profile: { pattern: 'tests/e2e/profile/*.spec.ts', timeout: 30000 },
  dashboard: { pattern: 'tests/e2e/dashboard/*.spec.ts', timeout: 30000 },
  loyalty: { pattern: 'tests/e2e/loyalty/*.spec.ts', timeout: 30000 },
  wallet: { pattern: 'tests/e2e/wallet/*.spec.ts', timeout: 30000 },
  navigation: { pattern: 'tests/e2e/navigation/*.spec.ts', timeout: 30000 },
  forms: { pattern: 'tests/e2e/forms/*.spec.ts', timeout: 30000 },
  components: { pattern: 'tests/e2e/components/*.spec.ts', timeout: 30000 },
  api: { pattern: 'tests/e2e/api/*.spec.ts', timeout: 30000 },
};

class ParallelExecutor {
  constructor(options = {}) {
    this.maxParallel = options.maxParallel || 4;
    this.results = [];
  }

  async runAll() {
    console.log('🚀 Starting Multi-Agent Parallel Execution\n');
    console.log(`Modules: ${Object.keys(MODULES).length}`);
    console.log(`Max Parallel: ${this.maxParallel}\n`);

    const queue = Object.entries(MODULES).map(([id, config]) => ({
      moduleId: id,
      config,
    }));

    const running = new Set();
    const results = [];

    while (queue.length > 0 || running.size > 0) {
      // Fill up to maxParallel slots
      while (running.size < this.maxParallel && queue.length > 0) {
        const task = queue.shift();
        const promise = this.runAgent(task.moduleId, task.config);
        running.add(promise);
        
        promise.then(result => {
          running.delete(promise);
          results.push(result);
        });
      }

      // Wait for at least one to complete
      if (running.size > 0) {
        await Promise.race(running);
      }
    }

    return results;
  }

  runAgent(moduleId, config) {
    return new Promise((resolve) => {
      console.log(`🤖 Starting agent: ${moduleId}`);
      
      const args = [
        'test:e2e',
        '--',
        config.pattern,
        '--reporter=list',
        `--timeout=${config.timeout}`,
      ];

      const proc = spawn('pnpm', args, {
        cwd: join(process.cwd(), 'apps/booking-engine'),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, CI: 'true' },
      });

      let output = '';
      proc.stdout.on('data', (data) => (output += data.toString()));
      proc.stderr.on('data', (data) => (output += data.toString()));

      proc.on('close', (code) => {
        const status = code === 0 ? 'passed' : 'failed';
        console.log(`${status === 'passed' ? '✅' : '❌'} Agent ${moduleId}: ${status}`);
        resolve({ moduleId, status, code });
      });

      proc.on('error', (error) => {
        console.log(`⚠️  Agent ${moduleId}: error`);
        resolve({ moduleId, status: 'error', error: error.message });
      });
    });
  }

  printSummary(results) {
    const passed = results.filter(r => r.status === 'passed').length;
    const failed = results.filter(r => r.status === 'failed').length;
    const errors = results.filter(r => r.status === 'error').length;

    console.log('\n' + '='.repeat(60));
    console.log('📊 EXECUTION SUMMARY');
    console.log('='.repeat(60));
    console.log(`Total: ${results.length} | ✅ Passed: ${passed} | ❌ Failed: ${failed} | ⚠️  Errors: ${errors}`);
    console.log('='.repeat(60));

    results.forEach(r => {
      const icon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⚠️';
      console.log(`${icon} ${r.moduleId}`);
    });

    return passed === results.length;
  }
}

// Main execution
const executor = new ParallelExecutor({ maxParallel: 3 });

executor
  .runAll()
  .then(results => {
    const success = executor.printSummary(results);
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Execution failed:', error);
    process.exit(1);
  });
