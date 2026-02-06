/**
 * Jest Global Teardown for Integration Tests
 *
 * Runs once after all test suites when INTEGRATION_DB=true
 * Cleans up all test data to prevent data leakage
 */

import { teardownTestEnvironment } from './setup';

export default async function globalTeardown(): Promise<void> {
  console.log('\n🧹 Jest Global Teardown - Integration Tests\n');

  try {
    // Teardown test environment (cleanup all test data)
    await teardownTestEnvironment();

    console.log('\n✅ Global teardown complete\n');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - cleanup failures shouldn't fail the test suite
  }
}
