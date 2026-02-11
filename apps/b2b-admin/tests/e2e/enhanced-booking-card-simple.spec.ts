import { test, expect } from '@playwright/test';

test.describe('EnhancedBookingCard Simple Test', () => {
  test('should render the EnhancedBookingCard and show all main sections', async ({ page }) => {
    // Load the simple HTML test file
    await page.goto(`file://${process.cwd()}/test-enhanced-booking-card.html`);

    // Wait for the page to load
    await page.waitForLoadState('networkidle');

    // Check that the main heading is visible
    await expect(page.getByRole('heading', { name: 'Booking BK-001' })).toBeVisible();

    // Check that all section headings are visible
    await expect(page.getByRole('heading', { name: 'Customer Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Supplier Information' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Financial Summary' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Payments' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'History' })).toBeVisible();

    // Check that booking ID is displayed
    await expect(page.getByText('BK-001')).toBeVisible();

    // Check some key content is visible
    await expect(page.getByText('John Doe')).toBeVisible();
    await expect(page.getByText('john@example.com')).toBeVisible();
    await expect(page.getByText('Airline Corp')).toBeVisible();

    console.log('✅ EnhancedBookingCard test passed - all sections rendered correctly');
  });
});