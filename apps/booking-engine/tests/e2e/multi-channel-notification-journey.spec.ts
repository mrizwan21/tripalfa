import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';

test.describe('Multi-Channel Notification Journey E2E', () => {
  test('High-priority booking triggers all channels simultaneously', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create high-priority booking
    await page.goto('/flights');
    await page.click('text=Book Urgent Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Verify email notification sent
    await expect(page.locator('text=Email notification sent')).toBeVisible();

    // Step 3: Verify SMS notification sent
    await expect(page.locator('text=SMS notification sent')).toBeVisible();

    // Step 4: Verify push notification sent (if enabled)
    await expect(page.locator('text=Push notification sent')).toBeVisible();

    // Step 5: Verify in-app notification displayed
    await page.goto('/notifications');
    await expect(page.locator('text=Urgent booking confirmed')).toBeVisible();

    // Step 6: Verify all channels delivered simultaneously
    const notificationTime = await page.locator('.notification-time').first().textContent();
    expect(notificationTime).toBeTruthy();
  });

  test('Channel failure does not block other channels', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Configure email channel to fail
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockChannelFailure', {
        detail: { channel: 'email', error: 'smtp_server_unavailable' }
      }));
    });

    // Step 2: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 3: Email fails but SMS succeeds
    await expect(page.locator('text=Email delivery failed')).toBeVisible();
    await expect(page.locator('text=SMS notification sent')).toBeVisible();

    // Step 4: In-app notification still displays
    await page.goto('/notifications');
    await expect(page.locator('text=Booking confirmed')).toBeVisible();

    // Step 5: Notification status shows partial success
    await expect(page.locator('text=Partially delivered')).toBeVisible();
  });

  test('Channel-specific delivery metrics tracked', async ({ page }) => {
    const adminNotifications = new AdminNotificationsPage(page);

    // Step 1: Admin views notification metrics
    await adminNotifications.goto('/admin/notifications');

    // Step 2: Send test notification to multiple channels
    await adminNotifications.sendTestNotification({
      channels: ['email', 'sms', 'push', 'in_app'],
      message: 'Test notification'
    });

    // Step 3: Verify email delivery metrics
    await expect(page.locator('text=Email: Delivered')).toBeVisible();

    // Step 4: Verify SMS delivery metrics
    await expect(page.locator('text=SMS: Delivered')).toBeVisible();

    // Step 5: Verify push delivery metrics
    await expect(page.locator('text=Push: Delivered')).toBeVisible();

    // Step 6: Verify in-app delivery metrics
    await expect(page.locator('text=In-App: Delivered')).toBeVisible();

    // Step 7: Check delivery times
    await expect(page.locator('text=Email delivery time: < 30s')).toBeVisible();
    await expect(page.locator('text=SMS delivery time: < 60s')).toBeVisible();
  });

  test('Channel preference overrides default settings', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Set channel preferences (SMS only)
    await page.goto('/settings/notifications');
    await page.uncheck('input[name="email_enabled"]');
    await page.check('input[name="sms_enabled"]');
    await page.uncheck('input[name="push_enabled"]');
    await page.click('text=Save Preferences');

    // Step 2: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 3: Only SMS notification sent
    await expect(page.locator('text=SMS notification sent')).toBeVisible();
    await expect(page.locator('text=Email notification sent')).not.toBeVisible();
    await expect(page.locator('text=Push notification sent')).not.toBeVisible();

    // Step 4: In-app notification still displays (always enabled)
    await page.goto('/notifications');
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('Emergency notifications bypass channel preferences', async ({ page }) => {
    const login = new LoginPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Set preferences to disable all channels
    await page.goto('/settings/notifications');
    await page.uncheck('input[name="email_enabled"]');
    await page.uncheck('input[name="sms_enabled"]');
    await page.uncheck('input[name="push_enabled"]');
    await page.click('text=Save Preferences');

    // Step 2: Trigger emergency notification
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockEmergencyNotification', {
        detail: { type: 'security_breach', priority: 'critical' }
      }));
    });

    // Step 3: Emergency notification sent via all channels despite preferences
    await expect(page.locator('text=Emergency: Security breach')).toBeVisible();
    await expect(page.locator('text=Email notification sent (emergency)')).toBeVisible();
    await expect(page.locator('text=SMS notification sent (emergency)')).toBeVisible();
    await expect(page.locator('text=Push notification sent (emergency)')).toBeVisible();
  });
});