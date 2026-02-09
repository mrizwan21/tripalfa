/**
 * Jest Global Setup for Integration Tests
 *
 * Runs once before all test suites when INTEGRATION_DB=true
 * - Bootstraps test HTTP server (on ephemeral port)
 * - Stores server URL globally for test access
 * - Seeds test data and verifies database connectivity
 * - Configures test environment (authentication, cleanup)
 */

import { setupTestEnvironment, seedTestUsers } from './setup';
import { testServer } from './test-server';

export default async function globalSetup(): Promise<void> {
  console.log('\n🔧 Jest Global Setup - Integration Tests\n');

  try {
    // Step 1: Start test HTTP server (on ephemeral port to avoid conflicts)
    console.log('📡 Starting test HTTP server...');
    await testServer.start(0); // 0 = auto-assign available port

    // Step 2: Store server URL globally for test access
    const testUrl = testServer.getApiUrl();
    globalThis.TEST_API_URL = testUrl;
    process.env.BOOKING_SERVICE_API = testUrl;
    console.log(`✅ Test server running: ${testUrl}`);

    // Step 3: Setup test environment (authenticate users, verify API)
    await setupTestEnvironment();

    // Step 4: Seed test users if needed
    await seedTestUsers();

    console.log('\n✅ Global setup complete\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Attempt cleanup on failure
    try {
      await testServer.stop();
    } catch (cleanupError) {
      console.error('❌ Cleanup after setup failure:', cleanupError);
    }
    // Don't throw - let individual tests fail if they need the setup
  }
}

// Augment global namespace for TypeScript
declare global {
  var TEST_API_URL: string | undefined;
}
