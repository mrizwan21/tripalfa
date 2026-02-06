import { FullConfig } from '@playwright/test';
import { cleanupTestData, disconnectDatabase } from './database';

/**
 * Global Teardown
 * 
 * Runs once after all tests
 * - Cleans up test data
 * - Closes database connections
 * - Performs final cleanup
 */
async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...');
  
  try {
    // 1. Clean up test data
    console.log('🗑️  Cleaning up test data...');
    await cleanupTestData();
    
    // 2. Disconnect database
    console.log('🔌 Disconnecting database...');
    await disconnectDatabase();
    
    console.log('✅ Global teardown complete');
  } catch (error) {
    console.error('❌ Global teardown failed:', error);
    // Don't throw - allow tests to complete even if cleanup fails
  }
}

export default globalTeardown;
