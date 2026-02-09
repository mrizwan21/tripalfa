/**
 * Jest Global Teardown for Integration Tests
 *
 * Runs once after all test suites when INTEGRATION_DB=true
 * - Stops test HTTP server and closes all connections
 * - Cleans up all test data to prevent data leakage
 * - Clears test database and temporary resources
 */

import { teardownTestEnvironment } from './setup';
import { testServer } from './test-server';

export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Jest Global Teardown - Integration Tests\n');

  try {
    // Step 1: Clean up test data (before shutting down server)
    await teardownTestEnvironment();

    // Step 2: Stop test HTTP server and close all connections
    console.log('📡 Stopping test HTTP server...');
    await testServer.stop();

    // Step 3: Clear global test URL
    delete (globalThis as any).TEST_API_URL;
    delete process.env.BOOKING_SERVICE_API;

    console.log('\n✅ Global teardown complete\n');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Attempt to stop server even if cleanup failed
    try {
      await testServer.stop();
    } catch (stopError) {
      console.error('❌ Error stopping test server:', stopError);
    }
    // Don't throw - cleanup failures shouldn't fail the test suite
  }
}
