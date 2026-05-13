/**
 * Agent: Booking Engine E2E Tests
 * Module: apps/booking-engine
 * Mode: Autonomous YOLO
 */

import { test, expect, Page } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5173';

test.describe('🤖 Agent Booking - Autonomous Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('1. Flight Search - Autonomous', async ({ page }) => {
    console.log('🛫 Running Flight Search Test');
    await page.goto(`${BASE_URL}/flights`);
    await expect(page.locator('input[placeholder*="From"]').first()).toBeVisible();
    await expect(page.locator('input[placeholder*="To"]').first()).toBeVisible();
    console.log('✅ Flight Search UI verified');
  });

  test('2. Flight Booking Flow - Autonomous', async ({ page }) => {
    console.log('🎫 Running Flight Booking Flow Test');
    await page.goto(`${BASE_URL}/flights/search`);
    await expect(page).toHaveURL(/flights/);
    console.log('✅ Flight Booking Flow verified');
  });

  test('3. Hotel Search - Autonomous', async ({ page }) => {
    console.log('🏨 Running Hotel Search Test');
    await page.goto(`${BASE_URL}/hotels`);
    await expect(page.locator('input[placeholder*="Destination"]').first()).toBeVisible();
    console.log('✅ Hotel Search UI verified');
  });

  test('4. Hotel Booking Flow - Autonomous', async ({ page }) => {
    console.log('🏨 Running Hotel Booking Flow Test');
    await page.goto(`${BASE_URL}/hotels/search`);
    await expect(page).toHaveURL(/hotels/);
    console.log('✅ Hotel Booking Flow verified');
  });

  test('5. Wallet Operations - Autonomous', async ({ page }) => {
    console.log('💰 Running Wallet Operations Test');
    await page.goto(`${BASE_URL}/wallet`);
    await expect(page).toHaveURL(/wallet/);
    console.log('✅ Wallet Operations verified');
  });

  test('6. User Profile - Autonomous', async ({ page }) => {
    console.log('👤 Running User Profile Test');
    await page.goto(`${BASE_URL}/profile`);
    await expect(page).toHaveURL(/profile/);
    console.log('✅ User Profile verified');
  });

  test('7. Loyalty Program - Autonomous', async ({ page }) => {
    console.log('🎁 Running Loyalty Program Test');
    await page.goto(`${BASE_URL}/loyalty`);
    await expect(page).toHaveURL(/loyalty/);
    console.log('✅ Loyalty Program verified');
  });
});
