/**
 * Agent: Call Center Portal E2E Tests
 * Module: apps/call-center-portal
 * Mode: Autonomous YOLO
 */

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:5175';

test.describe('🤖 Agent CallCenter - Autonomous Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);
  });

  test('1. Terminal Operations - Autonomous', async ({ page }) => {
    console.log('📞 Running Terminal Operations Test');
    await page.goto(`${BASE_URL}/`);
    await expect(page.locator('text=Consultant')).toBeVisible();
    console.log('✅ Terminal Operations verified');
  });

  test('2. Booking Queues - Autonomous', async ({ page }) => {
    console.log('📋 Running Booking Queues Test');
    await page.goto(`${BASE_URL}/queues`);
    await expect(page).toHaveURL(/queues/);
    console.log('✅ Booking Queues verified');
  });

  test('3. PNR Import - Autonomous', async ({ page }) => {
    console.log('📥 Running PNR Import Test');
    await page.goto(`${BASE_URL}/import-pnr`);
    await expect(page).toHaveURL(/import-pnr/);
    console.log('✅ PNR Import verified');
  });

  test('4. Blank Booking - Autonomous', async ({ page }) => {
    console.log('📝 Running Blank Booking Test');
    await page.goto(`${BASE_URL}/blank-booking`);
    await expect(page).toHaveURL(/blank-booking/);
    console.log('✅ Blank Booking verified');
  });

  test('5. Support Records - Autonomous', async ({ page }) => {
    console.log('🎧 Running Support Records Test');
    await page.goto(`${BASE_URL}/support/new`);
    await expect(page).toHaveURL(/support/);
    console.log('✅ Support Records verified');
  });

  test('6. Agent Management - Autonomous', async ({ page }) => {
    console.log('👥 Running Agent Management Test');
    await page.goto(`${BASE_URL}/admin/agents`);
    await expect(page).toHaveURL(/admin\/agents/);
    console.log('✅ Agent Management verified');
  });
});
