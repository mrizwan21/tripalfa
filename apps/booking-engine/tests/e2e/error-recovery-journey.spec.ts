import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';

test.describe('Error Recovery Journey E2E', () => {
  test('Validation error recovery flow', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Start booking with invalid data
    await page.goto('/flights');
    await page.click('text=Book Flight');

    // Step 2: Enter invalid passenger details
    await checkout.proceedToCheckout();
    await page.fill('input[name="email"]', 'invalid-email');
    await page.fill('input[name="phone"]', 'invalid-phone');
    await page.click('text=Complete Booking');

    // Step 3: Receive validation error notification
    await expect(page.locator('text=Please correct the following errors')).toBeVisible();
    await expect(page.locator('text=Invalid email format')).toBeVisible();
    await expect(page.locator('text=Invalid phone number')).toBeVisible();

    // Step 4: Correct errors
    await page.fill('input[name="email"]', 'valid@example.com');
    await page.fill('input[name="phone"]', '+1234567890');
    await page.click('text=Complete Booking');

    // Step 5: Booking succeeds
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('Payment processing error recovery', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);
    const adminNotifications = new AdminNotificationsPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Start booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();

    // Step 2: Payment processing fails
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockPaymentProcessingError', {
        detail: { error: 'gateway_timeout' }
      }));
    });

    // Step 3: Customer receives payment error notification
    await expect(page.locator('text=Payment processing failed')).toBeVisible();
    await expect(page.locator('text=Please try again')).toBeVisible();

    // Step 4: Admin receives error alert
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Payment processing error')).toBeVisible();

    // Step 5: Customer retries with different payment method
    await checkout.selectPaymentMethod('paypal');
    await checkout.completeBooking();

    // Step 6: Payment succeeds
    await expect(page.locator('text=Payment successful')).toBeVisible();
  });

  test('System error recovery with graceful degradation', async ({ page }) => {
    const login = new LoginPage(page);
    const adminNotifications = new AdminNotificationsPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Trigger system error
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockSystemError', {
        detail: { service: 'notification_service', error: 'database_connection_failed' }
      }));
    });

    // Step 2: Admin receives critical error notification
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Critical system error')).toBeVisible();
    await expect(page.locator('text=Database connection failed')).toBeVisible();

    // Step 3: Customer receives friendly error message
    await page.goto('/notifications');
    await expect(page.locator('text=Service temporarily unavailable')).toBeVisible();
    await expect(page.locator('text=Please try again in a few minutes')).toBeVisible();

    // Step 4: System recovers
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockSystemRecovery', {
        detail: { service: 'notification_service' }
      }));
    });

    // Step 5: Recovery notification sent
    await expect(page.locator('text=Service restored')).toBeVisible();
  });

  test('Network connectivity error recovery', async ({ page }) => {
    const login = new LoginPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Start booking
    await page.goto('/flights');
    await page.click('text=Book Flight');

    // Step 2: Simulate network failure
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockNetworkError', {
        detail: { type: 'connection_lost' }
      }));
    });

    // Step 3: Receive offline notification
    await expect(page.locator('text=Connection lost')).toBeVisible();
    await expect(page.locator('text=Working offline')).toBeVisible();

    // Step 4: Data saved locally
    await expect(page.locator('text=Booking data saved locally')).toBeVisible();

    // Step 5: Network restored
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockNetworkRestored'));
    });

    // Step 6: Sync notification
    await expect(page.locator('text=Connection restored')).toBeVisible();
    await expect(page.locator('text=Synchronizing data')).toBeVisible();

    // Step 7: Booking completes successfully
    await expect(page.locator('text=Booking synchronized')).toBeVisible();
  });
});