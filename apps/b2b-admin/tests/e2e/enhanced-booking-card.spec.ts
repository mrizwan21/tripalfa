import { test, expect } from '@playwright/test';

// This test assumes the EnhancedBookingCard is routed at /bookings/:id
// and that a mock or test booking with id 'BK-99120' exists in the test environment.

test.describe('EnhancedBookingCard E2E', () => {
  test('should render the EnhancedBookingCard and show all main sections', async ({ page }) => {
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', error => console.log('PAGE ERROR:', error.message));
    
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    console.log('Page loaded, checking content...');
    const bodyText = await page.textContent('body');
    console.log('Body text:', bodyText);
    await expect(page.getByRole('heading', { name: /Booking/i })).toBeVisible();
    await expect(page.getByText(/Customer Information/i)).toBeVisible();
    await expect(page.getByText(/Supplier Information/i)).toBeVisible();
    await expect(page.getByText(/Financial Summary/i)).toBeVisible();
    await expect(page.getByText(/Overview/i)).toBeVisible();
    await expect(page.getByText(/Payments/i)).toBeVisible();
    await expect(page.getByText(/Documents/i)).toBeVisible();
    await expect(page.getByText(/History/i)).toBeVisible();
  });
});
