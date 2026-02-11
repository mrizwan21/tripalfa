import { test, expect } from '@playwright/test';

// This test assumes the test environment can provide different booking types/statuses for /bookings/:id

test.describe('EnhancedBookingCard Data-driven', () => {
  const scenarios = [
    { id: 'BK-99120', type: 'flight', status: 'confirmed', expectText: /London to Dubai/i },
    // Add more scenarios as needed, e.g. hotel, package, hold, cancelled, etc.
  ];

  for (const scenario of scenarios) {
    test(`should render booking card for ${scenario.type} (${scenario.status})`, async ({ page }) => {
      await page.goto(`/bookings/${scenario.id}`);
      await expect(page.getByText(scenario.expectText)).toBeVisible();
      await expect(page.getByText(new RegExp(scenario.status, 'i'))).toBeVisible();
    });
  }
});
