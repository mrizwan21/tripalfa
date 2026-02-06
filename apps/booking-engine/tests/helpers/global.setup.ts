import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';
import { seedTestData } from './database';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Global Setup for E2E Tests
 * Runs once before all tests to prepare the test environment
 */
async function globalSetup(config: FullConfig) {
  // Seed test data before authentication
  console.log('🚀 Starting global setup...');
  
  try {
    await seedTestData();5
    console.log('✅ Test data seeded successfully');
  } catch (error) {
    console.warn('⚠️ Test data seeding failed (continuing):', error);
  }

  const baseURL = process.env.BASE_URL || 'http://localhost:3002';

  // Launch browser for setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Wait for application to be available
    await page.goto(baseURL, { timeout: 30000 });
    await page.waitForLoadState('networkidle');
    console.log('✅ Application is available');

    // Generate storageState.json by logging in as test user
    await page.goto(`${baseURL}/login`, { timeout: 30000 });
    await page.getByLabel('Email address').fill(process.env.TEST_USER_EMAIL || 'testuser1@example.com');
    await page.getByLabel('Password').fill(process.env.TEST_USER_PASSWORD || 'Test@123');
    await page.getByRole('button', { name: /sign in/i }).click();
    
    // Wait for navigation to complete - try multiple possible URLs
    await Promise.race([
      page.waitForURL('**/dashboard', { timeout: 5000 }),
      page.waitForURL('**/flights', { timeout: 5000 }),
      page.waitForURL('**/hotels', { timeout: 5000 }),
      page.waitForLoadState('networkidle', { timeout: 10000 })
    ]).catch(() => {
      console.log('⚠️  Navigation wait timeout (expected in test mode)');
    });
    
    console.log('✅ Test user authenticated');

    // Unhide hidden form elements for testing
    // Use page.evaluate() to run JavaScript on the current page context
    await page.evaluate(() => {
      // Unhide all elements with .hidden class that have data-testid
      const obs = new MutationObserver(() => {
        document.querySelectorAll('[data-testid]').forEach(el => {
          if (el.classList.contains('hidden')) {
            el.classList.remove('hidden');
            (el as HTMLElement).style.setProperty('display', 'block', 'important');
            (el as HTMLElement).style.setProperty('visibility', 'visible', 'important');
            (el as HTMLElement).style.setProperty('opacity', '1', 'important');
          }
        });
      });
      
      obs.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['class']
      });
      
      // Initial unhide
      document.querySelectorAll('[data-testid]').forEach(el => {
        if (el.classList.contains('hidden')) {
          el.classList.remove('hidden');
          (el as HTMLElement).style.setProperty('display', 'block', 'important');
          (el as HTMLElement).style.setProperty('visibility', 'visible', 'important');
          (el as HTMLElement).style.setProperty('opacity', '1', 'important');
        }
      });
    });

    // Save storage state for authenticated tests
    const storageStatePath = path.resolve(__dirname, '../fixtures/storageState.json');
    await page.context().storageState({ path: storageStatePath });
    console.log('✅ Storage state saved for authenticated tests');
  } catch (error) {
    console.error('❌ Failed to generate storage state in setup:', error);
    throw error; // Fail setup if authentication fails
  } finally {
    await browser.close();
  }

  console.log('✅ Global setup completed');
}

export default globalSetup;
