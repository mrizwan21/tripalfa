import { chromium, FullConfig } from '@playwright/test';
import { seedTestData } from './database';

/**
 * Global Setup
 * 
 * Runs once before all tests
 * - Seeds test database
 * - Sets up authentication (optional)
 * - Prepares test environment
 */
async function globalSetup(config: FullConfig) {
  console.log('🚀 Running global setup...');
  
  try {
    // 1. Seed test database
    console.log('📊 Seeding test database...');
    await seedTestData();
    
    // 2. Set up authentication (optional)
    // Uncomment if you want to pre-authenticate for all tests
    /*
    console.log('🔐 Setting up authentication...');
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    // Login
    await page.goto('http://localhost:3002/login');
    await page.fill('[data-testid="email-input"]', 'test.user@tripalfa.com');
    await page.fill('[data-testid="password-input"]', 'Test@1234');
    await page.click('[data-testid="login-button"]');
    await page.waitForURL('**/dashboard');
    
    // Save authentication state
    await page.context().storageState({ 
      path: './tests/fixtures/storageState.json' 
    });
    
    await browser.close();
    console.log('✅ Authentication state saved');
    */
    
    console.log('✅ Global setup complete');
  } catch (error) {
    console.error('❌ Global setup failed:', error);
    throw error;
  }
}

export default globalSetup;
