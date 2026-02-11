import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';

test.describe('Preference Management Journey E2E', () => {
  test('Customer sets email-only notification preferences', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Navigate to notification preferences
    await page.goto('/settings/notifications');

    // Step 2: Configure preferences (email only)
    await page.check('input[name="email_enabled"]');
    await page.uncheck('input[name="sms_enabled"]');
    await page.uncheck('input[name="push_enabled"]');
    await page.check('input[name="in_app_enabled"]'); // Always enabled
    await page.click('text=Save Preferences');

    // Step 3: Verify preferences saved
    await expect(page.locator('text=Preferences saved successfully')).toBeVisible();

    // Step 4: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 5: Verify only email notification sent
    await expect(page.locator('text=Email notification sent')).toBeVisible();
    await expect(page.locator('text=SMS notification sent')).not.toBeVisible();
    await expect(page.locator('text=Push notification sent')).not.toBeVisible();

    // Step 6: In-app notification still displays
    await page.goto('/notifications');
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('Customer updates preferences mid-journey', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Set initial preferences (email only)
    await page.goto('/settings/notifications');
    await page.check('input[name="email_enabled"]');
    await page.uncheck('input[name="sms_enabled"]');
    await page.click('text=Save Preferences');

    // Step 2: Start booking process
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();

    // Step 3: Update preferences during checkout (add SMS)
    await page.click('text=Update Notification Preferences');
    await page.check('input[name="sms_enabled"]');
    await page.click('text=Save Preferences');

    // Step 4: Complete booking
    await checkout.completeBooking();

    // Step 5: Verify both email and SMS sent
    await expect(page.locator('text=Email notification sent')).toBeVisible();
    await expect(page.locator('text=SMS notification sent')).toBeVisible();
  });

  test('Customer disables all optional notifications', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Disable all optional notifications
    await page.goto('/settings/notifications');
    await page.uncheck('input[name="email_enabled"]');
    await page.uncheck('input[name="sms_enabled"]');
    await page.uncheck('input[name="push_enabled"]');
    await page.check('input[name="in_app_enabled"]'); // Critical notifications always enabled
    await page.click('text=Save Preferences');

    // Step 2: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 3: Verify only critical notifications sent
    await expect(page.locator('text=Email notification sent')).not.toBeVisible();
    await expect(page.locator('text=SMS notification sent')).not.toBeVisible();
    await expect(page.locator('text=Push notification sent')).not.toBeVisible();

    // Step 4: Critical notifications still sent (booking confirmation)
    await page.goto('/notifications');
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('Category-specific notification preferences', async ({ page }) => {
    const login = new LoginPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Configure category preferences
    await page.goto('/settings/notifications');

    // Enable booking notifications
    await page.check('input[name="booking_email"]');
    await page.check('input[name="booking_sms"]');

    // Disable payment notifications
    await page.uncheck('input[name="payment_email"]');
    await page.uncheck('input[name="payment_sms"]');

    // Enable reminder notifications
    await page.check('input[name="reminder_email"]');
    await page.uncheck('input[name="reminder_sms"]');

    await page.click('text=Save Preferences');

    // Step 2: Trigger booking notification
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockBookingNotification'));
    });

    // Step 3: Verify booking notification sent via preferred channels
    await expect(page.locator('text=Booking: Email notification sent')).toBeVisible();
    await expect(page.locator('text=Booking: SMS notification sent')).toBeVisible();

    // Step 4: Trigger payment notification
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockPaymentNotification'));
    });

    // Step 5: Verify payment notification not sent
    await expect(page.locator('text=Payment: Email notification sent')).not.toBeVisible();
    await expect(page.locator('text=Payment: SMS notification sent')).not.toBeVisible();

    // Step 6: Trigger reminder notification
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockReminderNotification'));
    });

    // Step 7: Verify reminder notification sent via email only
    await expect(page.locator('text=Reminder: Email notification sent')).toBeVisible();
    await expect(page.locator('text=Reminder: SMS notification sent')).not.toBeVisible();
  });

  test('Preference inheritance for guest bookings', async ({ page }) => {
    const login = new LoginPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Set preferences for guest bookings
    await page.goto('/settings/notifications');
    await page.check('input[name="guest_booking_email"]');
    await page.uncheck('input[name="guest_booking_sms"]');
    await page.click('text=Save Preferences');

    // Step 2: Create booking for guest
    await page.goto('/flights');
    await page.click('text=Book for Guest');
    await page.fill('input[name="guest_email"]', 'guest@example.com');
    await page.fill('input[name="guest_phone"]', '+1234567890');
    await page.click('text=Complete Guest Booking');

    // Step 3: Verify guest receives notifications according to host preferences
    await expect(page.locator('text=Guest booking: Email notification sent')).toBeVisible();
    await expect(page.locator('text=Guest booking: SMS notification sent')).not.toBeVisible();
  });
});