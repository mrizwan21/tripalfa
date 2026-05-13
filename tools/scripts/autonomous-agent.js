#!/usr/bin/env node
/**
 * Autonomous Test Agent
 * 
 * Self-contained agent that runs tests for a specific module
 * without human intervention. Designed for YOLO mode execution.
 */

import { spawn } from 'child_process';
import { writeFileSync } from 'fs';
import { join } from 'path';

const MODULE_CONFIGS = {
  auth: {
    name: 'Authentication Agent',
    tests: 'tests/e2e/auth/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  flights: {
    name: 'Flight Booking Agent',
    tests: 'tests/e2e/flights/*.spec.ts',
    timeout: 60000,
    retries: 2,
  },
  hotels: {
    name: 'Hotel Booking Agent',
    tests: 'tests/e2e/hotels/*.spec.ts',
    timeout: 60000,
    retries: 2,
  },
  bookings: {
    name: 'Booking Management Agent',
    tests: 'tests/e2e/bookings/*.spec.ts',
    timeout: 45000,
    retries: 1,
  },
  profile: {
    name: 'Profile Agent',
    tests: 'tests/e2e/profile/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  dashboard: {
    name: 'Dashboard Agent',
    tests: 'tests/e2e/dashboard/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  loyalty: {
    name: 'Loyalty Agent',
    tests: 'tests/e2e/loyalty/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  wallet: {
    name: 'Wallet Agent',
    tests: 'tests/e2e/wallet/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  navigation: {
    name: 'Navigation Agent',
    tests: 'tests/e2e/navigation/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  forms: {
    name: 'Forms Agent',
    tests: 'tests/e2e/forms/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  components: {
    name: 'Components Agent',
    tests: 'tests/e2e/components/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
  api: {
    name: 'API Integration Agent',
    tests: 'tests/e2e/api/*.spec.ts',
    timeout: 30000,
    retries: 1,
  },
};

class AutonomousAgent {
  constructor(moduleId) {
    this.moduleId = moduleId;
    this.config = MODULE_CONFIGS[moduleId];
    this.status = 'initializing';
    this.startTime = null;
    this.endTime = null;
    
    if (!this.config) {
      throw new Error(`Unknown module: ${moduleId}`);
    }
  }

  async execute() {
    this.status = 'running';
    this.startTime = new Date();
    
    console.log(`\n🤖 [${this.config.name}] Starting autonomous execution...`);
    console.log(`   Module: ${this.moduleId}`);
    console.log(`   Tests: ${this.config.tests}`);
    console.log(`   Timeout: ${this.config.timeout}ms`);
    console.log(`   Retries: ${this.config.retries}`);
    
    return new Promise((resolve) => {
      const args = [
        'test:e2e',
        '--',
        this.config.tests,
        '--reporter=list',
        '--retries=' + this.config.retries,
        '--timeout=' + this.config.timeout,
      ];

      const proc = spawn('pnpm', args, {
        cwd: join(process.cwd(), 'apps/booking-engine'),
        stdio: ['inherit', 'pipe', 'pipe'],
        shell: true,
        env: {
          ...process.env,
          CI: 'true',
          PLAYWRIGHT_WORKERS: '2',
        },
      });

      let output = '';
      let errors = '';

      proc.stdout.on('data', (data) => {
        output += data.toString();
        process.stdout.write(data.toString());
      });

      proc.stderr.on('data', (data) => {
        errors += data.toString();
        process.stderr.write(data.toString());
      });

      proc.on('close', (code) => {
        this.endTime = new Date();
        this.status = code === 0 ? 'passed' : 'failed';
        
        const result = {
          moduleId: this.moduleId,
          moduleName: this.config.name,
          status: this.status,
          code,
          startTime: this.startTime.toISOString(),
          endTime: this.endTime.toISOString(),
          duration: this.endTime - this.startTime,
          output: output.substring(0, 10000),
          errors: errors.substring(0, 5000),
        };

        this.writeResult(result);
        resolve(result);
      });

      proc.on('error', (error) => {
        this.status = 'error';
        this.endTime = new Date();
        
        const result = {
          moduleId: this.moduleId,
          moduleName: this.config.name,
          status: 'error',
          error: error.message,
          startTime: this.startTime.toISOString(),
          endTime: this.endTime.toISOString(),
        };

        this.writeResult(result);
        resolve(result);
      });
    });
  }

  writeResult(result) {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const resultFile = join(
      process.cwd(),
      'test-results',
      `agent-${this.moduleId}-${timestamp}.json`
    );

    try {
      writeFileSync(resultFile, JSON.stringify(result, null, 2));
      console.log(`\n📄 Results written to: ${resultFile}`);
    } catch (error) {
      console.error('Failed to write result file:', error.message);
    }
  }
}

// CLI execution
const args = process.argv.slice(2);

if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
  console.log(`
Autonomous Test Agent - YOLO Mode

Usage:
  node tools/scripts/autonomous-agent.js <module>
  node tools/scripts/autonomous-agent.js --all

Modules:
  ${Object.keys(MODULE_CONFIGS).join(', ')}

Examples:
  node tools/scripts/autonomous-agent.js auth
  node tools/scripts/autonomous-agent.js flights
  node tools/scripts/autonomous-agent.js --all
`);
  process.exit(0);
}

async function main() {
  if (args.includes('--all')) {
    // Run all modules sequentially
    const results = [];
    for (const moduleId of Object.keys(MODULE_CONFIGS)) {
      const agent = new AutonomousAgent(moduleId);
      const result = await agent.execute();
      results.push(result);
    }
    
    const passed = results.filter(r => r.status === 'passed').length;
    console.log(`\n\n📊 Final Summary: ${passed}/${results.length} modules passed`);
    process.exit(passed === results.length ? 0 : 1);
  } else {
    // Run specific module
    const [moduleId] = args;
    const agent = new AutonomousAgent(moduleId);
    const result = await agent.execute();
    process.exit(result.status === 'passed' ? 0 : 1);
  }
}

main().catch(console.error);
