import { test, expect } from '@playwright/test';

test.describe('EnhancedBookingCard Navigation', () => {
  test('should navigate between tabs and display correct content', async ({ page }) => {
    await page.goto('/bookings/BK-99120');
    // Overview tab
    await expect(page.getByText(/Customer Information/i)).toBeVisible();
    // Itinerary tab
    await page.getByRole('tab', { name: /Itinerary/i }).click();
    await expect(page.getByText(/London to Dubai/i)).toBeVisible();
    // Passengers tab
    await page.getByRole('tab', { name: /Passengers/i }).click();
    await expect(page.getByText(/LEAD/i)).toBeVisible();
    // Payments tab
    await page.getByRole('tab', { name: /Payments/i }).click();
    await expect(page.getByText(/Payment History/i)).toBeVisible();
    // Documents tab
    await page.getByRole('tab', { name: /Documents/i }).click();
    await expect(page.getByText(/Booking Documents/i)).toBeVisible();
    // History tab
    await page.getByRole('tab', { name: /History/i }).click();
    await expect(page.getByText(/Booking History/i)).toBeVisible();
  });
});
