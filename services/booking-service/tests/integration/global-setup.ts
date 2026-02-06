/**
 * Jest Global Setup for Integration Tests
 *
 * Runs once before all test suites when INTEGRATION_DB=true
 * Seeds test data and verifies database connectivity
 */

import { setupTestEnvironment, seedTestUsers } from './setup';

export default async function globalSetup(): Promise<void> {
  console.log('\n🔧 Jest Global Setup - Integration Tests\n');

  try {
    // Setup test environment (authenticate users, verify API)
    await setupTestEnvironment();

    // Seed test users if needed
    await seedTestUsers();

    console.log('\n✅ Global setup complete\n');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    // Don't throw - let individual tests fail if they need the setup
  }
}
