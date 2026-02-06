import { cleanupTestData } from './database';

/**
 * Global Teardown for E2E Tests
 * Runs once after all tests to clean up the test environment
 */
async function globalTeardown() {
  console.log('🧹 Starting global teardown...');

  try {
    await cleanupTestData();
    console.log('✅ Test data cleanup completed');
  } catch (error) {
    console.warn('⚠️ Test data cleanup failed:', error);
    // Don't throw - teardown should not fail the test suite
  }

  console.log('✅ Global teardown completed');
}

export default globalTeardown;
