import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Running global teardown...');
  console.log('✅ Global teardown complete (database cleanup skipped)');
}

export default globalTeardown;
