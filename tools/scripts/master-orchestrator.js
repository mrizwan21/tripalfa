#!/usr/bin/env node
/**
 * Master Test Agent Orchestrator
 * 
 * High-level orchestration for running all E2E tests
 * with multiple agents in autonomous mode.
 */

import { spawn } from 'child_process';
import { mkdirSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ORCHESTRATION_CONFIG = {
  // Execution strategy
  strategy: 'parallel', // 'sequential' | 'parallel' | 'yolo'
  
  // Agent settings
  maxConcurrentAgents: 3,
  retryOnFailure: true,
  maxRetries: 2,
  
  // Timeout settings (ms)
  agentTimeout: 300000, // 5 minutes per agent
  totalTimeout: 1800000, // 30 minutes total
  
  // Reporting
  generateReport: true,
  saveArtifacts: true,
  
  // Modules to test
  modules: [
    'auth',
    'flights',
    'hotels',
    'bookings',
    'profile',
    'dashboard',
    'loyalty',
    'wallet',
    'navigation',
    'forms',
    'components',
    'api',
  ],
};

class MasterOrchestrator {
  constructor(config = {}) {
    this.config = { ...ORCHESTRATION_CONFIG, ...config };
    this.results = [];
    this.startTime = null;
  }

  async execute() {
    this.startTime = new Date();
    console.log('\n🚀 Master Test Orchestrator Starting...\n');
    console.log('Configuration:');
    console.log(`  Strategy: ${this.config.strategy}`);
    console.log(`  Modules: ${this.config.modules.length}`);
    console.log(`  Max Concurrent: ${this.config.maxConcurrentAgents}`);
    console.log(`  Retries: ${this.config.maxRetries}`);
    console.log('');

    try {
      if (this.config.strategy === 'parallel') {
        await this.runParallel();
      } else if (this.config.strategy === 'yolo') {
        await this.runYolo();
      } else {
        await this.runSequential();
      }

      this.printSummary();
      this.generateReport();
      
      return this.results;
    } catch (error) {
      console.error('❌ Orchestration failed:', error.message);
      process.exit(1);
    }
  }

  async runSequential() {
    console.log('Running in SEQUENTIAL mode...\n');
    
    for (const moduleId of this.config.modules) {
      console.log(`\n📍 Module: ${moduleId}`);
      const result = await this.runAgent(moduleId);
      this.results.push(result);
    }
  }

  async runParallel() {
    console.log('Running in PARALLEL mode...\n');
    
    const queue = [...this.config.modules];
    const running = new Set();
    const results = [];

    while (queue.length > 0 || running.size > 0) {
      while (running.size < this.config.maxConcurrentAgents && queue.length > 0) {
        const moduleId = queue.shift();
        const promise = this.runAgent(moduleId).then(result => {
          running.delete(promise);
          results.push(result);
          return result;
        });
        running.add(promise);
      }

      if (running.size > 0) {
        await Promise.race(running);
      }
    }

    this.results = results;
  }

  async runYolo() {
    console.log('Running in YOLO mode...\n');
    console.log('⚠️  Autonomous execution - no interruptions\n');
    
    const script = join(process.cwd(), 'tools/scripts/autonomous-agent.js');
    
    return new Promise((resolve) => {
      const proc = spawn('node', [script, '--all'], {
        stdio: 'inherit',
        shell: true,
      });

      proc.on('close', (code) => {
        this.results = [{ 
          moduleId: 'all', 
          status: code === 0 ? 'passed' : 'failed' 
        }];
        resolve();
      });
    });
  }

  runAgent(moduleId) {
    return new Promise((resolve) => {
      const script = join(process.cwd(), 'tools/scripts/autonomous-agent.js');
      
      const proc = spawn('node', [script, moduleId], {
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        env: { ...process.env, CI: 'true' },
      });

      let output = '';
      let errorOutput = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });

      proc.stderr.on('data', (data) => {
        errorOutput += data.toString();
        process.stderr.write(data.toString());
      });

      proc.on('close', (code) => {
        const status = code === 0 ? 'passed' : 'failed';
        console.log(`${status === 'passed' ? '✅' : '❌'} ${moduleId}: ${status}`);
        resolve({ moduleId, status, code });
      });

      proc.on('error', (error) => {
        resolve({ moduleId, status: 'error', error: error.message });
      });
    });
  }

  printSummary() {
    const endTime = new Date();
    const duration = endTime - this.startTime;
    
    const passed = this.results.filter(r => r.status === 'passed').length;
    const failed = this.results.filter(r => r.status === 'failed').length;
    const errors = this.results.filter(r => r.status === 'error').length;

    console.log('\n' + '='.repeat(70));
    console.log('📊 ORCHESTRATION SUMMARY');
    console.log('='.repeat(70));
    console.log(`Total Duration: ${Math.round(duration / 1000)}s`);
    console.log(`Modules: ${this.results.length}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`⚠️  Errors: ${errors}`);
    console.log('='.repeat(70));

    this.results.forEach(r => {
      const icon = r.status === 'passed' ? '✅' : r.status === 'failed' ? '❌' : '⚠️';
      console.log(`${icon} ${r.moduleId}`);
    });

    const success = passed === this.results.length;
    console.log('\n' + (success ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'));
    console.log('='.repeat(70) + '\n');
  }

  generateReport() {
    if (!this.config.generateReport) return;

    const reportDir = join(process.cwd(), 'test-results');
    
    if (!existsSync(reportDir)) {
      mkdirSync(reportDir, { recursive: true });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const reportFile = join(reportDir, `orchestration-report-${timestamp}.json`);

    const report = {
      timestamp: this.startTime.toISOString(),
      duration: new Date() - this.startTime,
      config: this.config,
      results: this.results,
      summary: {
        total: this.results.length,
        passed: this.results.filter(r => r.status === 'passed').length,
        failed: this.results.filter(r => r.status === 'failed').length,
        errors: this.results.filter(r => r.status === 'error').length,
      },
    };

    writeFileSync(reportFile, JSON.stringify(report, null, 2));
    console.log(`📄 Report saved to: ${reportFile}`);
  }
}

// CLI interface
const args = process.argv.slice(2);

const orchestrator = new MasterOrchestrator({
  strategy: args.includes('--yolo') ? 'yolo' : 
            args.includes('--parallel') ? 'parallel' : 'sequential',
});

orchestrator.execute()
  .then(() => {
    const allPassed = orchestrator.results.every(r => r.status === 'passed');
    process.exit(allPassed ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
