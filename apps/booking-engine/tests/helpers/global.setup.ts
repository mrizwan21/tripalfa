import { FullConfig } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let backendProcess: any;
let mockServerProcess: any;

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...');

  try {
    // Kill any existing process on port 3004
    console.log('🧹 Cleaning up any existing mock server on port 3004...');
    try {
      const { execSync } = require('child_process');
      execSync('lsof -ti:3004 | xargs kill -9 2>/dev/null || true', { stdio: 'inherit' });
    } catch (error) {
      // Ignore errors if no process is running on the port
    }

    // Start mock API server for external services
    console.log('📡 Starting mock API server...');
    mockServerProcess = spawn('node', ['tests/mocks/mock-server.js'], {
      cwd: path.resolve(__dirname, '../../'),
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'test' }
    });

    // Wait for mock server to be ready
    await waitForServer('http://localhost:3004', 30000);

    // Skip backend services for now - using MSW mocks instead
    console.log('🔧 Skipping backend services - using MSW mocks for frontend testing');

    // Wait for backend to be ready (commented out)
    // console.log('🔧 Starting backend services...');
    // backendProcess = spawn('npm', ['run', 'dev:test'], {
    //   cwd: path.resolve(__dirname, '../../../services/booking-service'),
    //   stdio: 'inherit',
    //   env: {
    //     ...process.env,
    //     NODE_ENV: 'test',
    //     PORT: '3003',
    //     DATABASE_URL: 'postgresql://neondb_owner:password@localhost:5432/neondb_test'
    //   }
    // });

    // Wait for backend to be ready (commented out)
    // await waitForServer('http://localhost:3003', 60000);
    // await setupTestDatabase();

    console.log('✅ Global setup complete - all services running');

  } catch (error) {
    console.error('❌ Global setup failed:', error);
    await globalTeardown();
    throw error;
  }
}

async function waitForServer(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Server at ${url} did not start within ${timeout}ms`);
}

async function setupTestDatabase(): Promise<void> {
  // Run database migrations and seed test data
  const { execSync } = require('child_process');

  try {
    // Run migrations
    execSync('npm run db:migrate', {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'postgresql://neondb_owner:password@localhost:5432/neondb_test' }
    });

    // Seed test data
    execSync('npm run db:seed:test', {
      cwd: path.resolve(__dirname, '../../../'),
      stdio: 'inherit',
      env: { ...process.env, DATABASE_URL: 'postgresql://neondb_owner:password@localhost:5432/neondb_test' }
    });

  } catch (error) {
    console.warn('⚠️ Database setup failed, continuing with tests (may need manual setup):', error.message);
  }
}

async function globalTeardown() {
  console.log('🧹 Running global teardown...');

  if (backendProcess) {
    console.log('🛑 Stopping backend services...');
    try {
      backendProcess.kill('SIGTERM');
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!backendProcess.killed) {
        backendProcess.kill('SIGKILL');
      }
    } catch (error) {
      console.warn('⚠️ Error stopping backend process:', error.message);
    }
  }

  if (mockServerProcess) {
    console.log('🛑 Stopping mock API server...');
    try {
      mockServerProcess.kill('SIGTERM');
      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 2000));
      if (!mockServerProcess.killed) {
        mockServerProcess.kill('SIGKILL');
      }
    } catch (error) {
      console.warn('⚠️ Error stopping mock server process:', error.message);
    }
  }

  // Additional cleanup - kill any remaining processes on port 3004
  try {
    const { execSync } = require('child_process');
    execSync('lsof -ti:3004 | xargs kill -9 2>/dev/null || true', { stdio: 'inherit' });
  } catch (error) {
    // Ignore errors
  }

  console.log('✅ Global teardown complete');
}

export default globalSetup;
export { globalTeardown };
