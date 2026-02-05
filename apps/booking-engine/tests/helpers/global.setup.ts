import { test as setup } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedTestData } from '../../../../services/booking-service/src/__tests__/setup';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Setup project test - runs before all E2E tests
setup('global setup', async ({ page }) => {
  // Seed test data before authentication
  await seedTestData();

  // Wait for application to be available
  await page.goto(process.env.BASE_URL || 'http://localhost:3002');
  await page.waitForLoadState('networkidle');

  try {
    // Generate storageState.json by logging in as test user
    await page.goto('/login');
    await page.getByLabel('Email address').fill(process.env.TEST_USER_EMAIL || 'testuser1@example.com');
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    await page.waitForURL('**/dashboard', { timeout: 10000 });

    // Save storage state for authenticated tests
    const storageStatePath = path.resolve(__dirname, '../fixtures/storageState.json');
    await page.context().storageState({ path: storageStatePath });
  } catch (error) {
    console.warn('Failed to generate storage state in setup:', error);
    throw error; // Fail setup if authentication fails
  }
});
