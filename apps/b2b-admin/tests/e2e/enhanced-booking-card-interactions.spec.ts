import { test, expect } from '@playwright/test';

test.describe('EnhancedBookingCard Interactions', () => {
  test('should open and close payment modal', async ({ page }) => {
    await page.goto('/bookings/BK-99120');
    await page.getByRole('button', { name: /Process Payment/i }).first().click();
    await expect(page.getByText(/Process Payment/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText(/Process Payment/i)).not.toBeVisible();
  });

  test('should open and close refund modal', async ({ page }) => {
    await page.goto('/bookings/BK-99120');
    await page.getByRole('button', { name: /Process Refund/i }).first().click();
    await expect(page.getByText(/Process Refund/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText(/Process Refund/i)).not.toBeVisible();
  });

  test('should open and close amendment modal', async ({ page }) => {
    await page.goto('/bookings/BK-99120');
    await page.getByRole('button', { name: /Request Amendment/i }).first().click();
    await expect(page.getByText(/Request Amendment/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText(/Request Amendment/i)).not.toBeVisible();
  });

  test('should open and close import modal', async ({ page }) => {
    await page.goto('/bookings/BK-99120');
    await page.getByRole('button', { name: /Import from GDS/i }).click();
    await expect(page.getByText(/Import from GDS/i)).toBeVisible();
    await page.getByRole('button', { name: /Cancel/i }).click();
    await expect(page.getByText(/Import from GDS/i)).not.toBeVisible();
  });
});
