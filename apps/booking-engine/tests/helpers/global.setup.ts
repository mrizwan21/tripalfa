import { FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...');
  console.log('✅ Global setup complete (database seeding skipped for testing)');
}

export default globalSetup;
