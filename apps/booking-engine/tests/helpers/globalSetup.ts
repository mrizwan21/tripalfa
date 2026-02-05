import { seedTestData } from '../../../../services/booking-service/src/__tests__/setup';
import fs from 'fs';
import path from 'path';
import { chromium } from '@playwright/test';

export default async function globalSetup() {
  await seedTestData();
  // Generate storageState.json by logging in as test user
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('http://localhost:3000/login');
  await page.getByTestId('login-email').fill('testuser1@example.com');
  await page.getByTestId('login-password').fill('Test@123');
  await page.getByTestId('login-submit').click();
  await page.waitForNavigation();
  const storageStatePath = path.resolve(__dirname, '../fixtures/storageState.json');
  await page.context().storageState({ path: storageStatePath });
  await browser.close();
}
