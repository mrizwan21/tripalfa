#!/usr/bin/env node
/**
 * E2E Test Runner - Main Entry Point
 * 
 * Usage:
 *   node tools/scripts/e2e-test-runner.js --all
 *   node tools/scripts/e2e-test-runner.js --module=auth
 *   node tools/scripts/e2e-test-runner.js --parallel
 *   node tools/scripts/e2e-test-runner.js --yolo
 */

import { execSync, spawn } from 'child_process';
import { readFileSync } from 'fs';
import { join } from 'path';

const MODES = {
  sequential: 'Run all tests sequentially',
  parallel: 'Run tests in parallel across multiple agents',
  yolo: 'Autonomous YOLO mode - run everything without interruption',
  smoke: 'Run only smoke tests',
  specific: 'Run specific module tests',
};

const MODULES = [
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
];

function parseArgs(args) {
  const options = {
    mode: 'sequential',
    modules: [],
    profile: 'development',
    verbose: false,
  };

  args.forEach(arg => {
    if (arg === '--all') options.mode = 'sequential';
    else if (arg === '--parallel') options.mode = 'parallel';
    else if (arg === '--yolo') options.mode = 'yolo';
    else if (arg === '--smoke') options.mode = 'smoke';
    else if (arg.startsWith('--module=')) {
      options.modules = arg.split('=')[1].split(',');
    } else if (arg.startsWith('--profile=')) {
      options.profile = arg.split('=')[1];
    } else if (arg === '--verbose' || arg === '-v') {
      options.verbose = true;
    }
  });

  return options;
}

function runCommand(command, options = {}) {
  console.log(`\n$ ${command}`);
  
  try {
    execSync(command, {
      stdio: 'inherit',
      shell: true,
      ...options,
    });
    return true;
  } catch (error) {
    console.error('Command failed:', error.message);
    return false;
  }
}

async function runSequential(modules) {
  console.log('🚀 Running E2E Tests - Sequential Mode\n');
  
  for (const module of modules) {
    const success = runCommand(
      `pnpm test:e2e -- tests/e2e/${module}/*.spec.ts --reporter=list`
    );
    
    if (!success) {
      console.log(`❌ Failed at module: ${module}`);
      return false;
    }
  }
  
  return true;
}

async function runParallel() {
  console.log('🚀 Running E2E Tests - Parallel Mode\n');
  
  const script = join(process.cwd(), 'tools/scripts/parallel-agent-executor.js');
  const success = runCommand(`node ${script}`);
  
  return success;
}

async function runYolo() {
  console.log('🚀 Running E2E Tests - YOLO Mode\n');
  console.log('⚠️  Autonomous execution - no interruptions\n');
  
  const script = join(process.cwd(), 'tools/scripts/autonomous-agent.js');
  const success = runCommand(`node ${script} --all`);
  
  return success;
}

async function runSmoke() {
  console.log('🚀 Running E2E Tests - Smoke Mode\n');
  
  const success = runCommand(
    'pnpm test:e2e:smoke'
  );
  
  return success;
}

async function main() {
  const args = process.argv.slice(2);
  const options = parseArgs(args);

  console.log('🧪 E2E Test Runner');
  console.log('==================\n');
  console.log(`Mode: ${MODES[options.mode] || options.mode}`);
  console.log(`Profile: ${options.profile}`);
  console.log(`Modules: ${options.modules.length > 0 ? options.modules.join(', ') : 'all'}\n`);

  let success = true;

  switch (options.mode) {
    case 'sequential':
      success = await runSequential(options.modules.length > 0 ? options.modules : MODULES);
      break;
    case 'parallel':
      success = await runParallel();
      break;
    case 'yolo':
      success = await runYolo();
      break;
    case 'smoke':
      success = await runSmoke();
      break;
    default:
      if (options.modules.length > 0) {
        success = await runSequential(options.modules);
      } else {
        success = await runSequential(MODULES);
      }
  }

  process.exit(success ? 0 : 1);
}

main();
