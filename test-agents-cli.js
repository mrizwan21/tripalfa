#!/usr/bin/env node
/**
 * Test Agents CLI - Quick Command Interface
 * 
 * Usage:
 *   node test-agents-cli.js run all        - Run all tests
 *   node test-agents-cli.js run yolo       - YOLO mode
 *   node test-agents-cli.js run parallel   - Parallel mode
 *   node test-agents-cli.js run auth       - Run auth module
 *   node test-agents-cli.js status         - Check status
 *   node test-agents-cli.js report         - View report
 */

import { spawn } from 'child_process';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BOOKING_ENGINE = join(__dirname, 'apps/booking-engine');

const COMMANDS = {
  run: async (args) => {
    const target = args[0] || 'all';
    const command = target === 'all' || target === 'yolo' ? 'test:e2e:yolo'
      : target === 'parallel' ? 'test:e2e:parallel'
      : target === 'sequential' ? 'test:e2e:all'
      : `test:e2e:module --module=${target}`;
    
    console.log(`🚀 Running: ${command}`);
    runCommand(command);
  },
  
  status: () => {
    console.log('📊 Test Agent Status');
    console.log('====================');
    console.log('Modules: 12 ready');
    console.log('Mode: Autonomous YOLO');
    console.log('Status: Ready to run');
  },
  
  report: () => {
    console.log('📊 Opening test report...');
    runCommand('test:e2e:report');
  },
  
  help: () => {
    console.log(`
Test Agents CLI - Autonomous E2E Testing

Usage:
  node test-agents-cli.js <command> [args]

Commands:
  run all      - Run all tests (YOLO mode)
  run yolo     - Run all tests (autonomous)
  run parallel - Run tests in parallel
  run sequential - Run tests sequentially
  run <module> - Run specific module
                 (auth, flights, hotels, bookings, etc.)
  status       - Show status
  report       - View test report
  help         - Show this help

Examples:
  node test-agents-cli.js run all
  node test-agents-cli.js run auth
  node test-agents-cli.js run flights
  node test-agents-cli.js status
`);
  }
};

function runCommand(cmd) {
  const [command, ...args] = cmd.split(' ');
  const proc = spawn('pnpm', [command, ...args], {
    cwd: BOOKING_ENGINE,
    stdio: 'inherit',
    shell: true,
  });

  proc.on('error', (err) => {
    console.error('Error:', err.message);
    process.exit(1);
  });
}

const args = process.argv.slice(2);
const command = args[0] || 'help';

if (COMMANDS[command]) {
  COMMANDS[command](args.slice(1));
} else {
  COMMANDS.help();
}
