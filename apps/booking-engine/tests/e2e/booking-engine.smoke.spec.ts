// E2E Test Foundation for Booking Engine
// This file sets up the basic structure for end-to-end tests.

import { test, expect } from '../fixtures/unhideFixture';

// Example smoke test for Booking Engine homepage
test.describe('Booking Engine E2E Smoke Tests', () => {
  test('Homepage loads and displays main elements', async ({ page, isMobile }) => {
    await page.goto('/'); // Use relative URL with baseURL
    await expect(page).toHaveTitle(/Booking Engine/i);
    await expect(page.locator('header')).toBeVisible();
    await expect(page.locator('footer')).toBeVisible();

    // Navigation is hidden on mobile devices
    if (!isMobile) {
      await expect(page.locator('nav')).toBeVisible();
    }
  });
});
