import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';

test.describe('Scheduled Notification Journey E2E', () => {
  test('Booking reminder scheduled and delivered on time', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking with travel date 7 days away
    await page.goto('/flights');
    await page.click('text=Book Flight');

    // Set travel date to 7 days from now
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const travelDate = sevenDaysFromNow.toISOString().split('T')[0];

    await page.fill('input[name="departure_date"]', travelDate);
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Verify booking reminder scheduled for 3 days before travel
    await expect(page.locator('text=Booking reminder scheduled')).toBeVisible();

    // Step 3: Admin verifies scheduled notification
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Scheduled: Booking reminder')).toBeVisible();

    // Step 4: Fast-forward time to reminder date (mock)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockTimeAdvance', {
        detail: { days: 4 } // 3 days before travel
      }));
    });

    // Step 5: Verify reminder notification sent
    await expect(page.locator('text=Booking reminder sent')).toBeVisible();

    // Step 6: Customer receives reminder notification
    await page.goto('/notifications');
    await expect(page.locator('text=Your flight departs in 3 days')).toBeVisible();

    // Step 7: Verify reminder includes travel details
    await expect(page.locator('text=Flight details included')).toBeVisible();

    // Step 8: Verify reminder includes check-in link
    await expect(page.locator('text=Check-in link provided')).toBeVisible();
  });

  test('Payment reminder scheduled and delivered', async ({ page }) => {
    const login = new LoginPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking with payment due in 2 days
    await page.goto('/flights');
    await page.click('text=Book Flight with Payment Plan');

    // Step 2: Complete partial payment
    await page.fill('input[name="partial_payment"]', '100');
    await page.click('text=Complete Partial Payment');

    // Step 3: Verify payment reminder scheduled
    await expect(page.locator('text=Payment reminder scheduled')).toBeVisible();

    // Step 4: Fast-forward time to reminder date (mock)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockTimeAdvance', {
        detail: { days: 1 } // 1 day before due date
      }));
    });

    // Step 5: Verify payment reminder sent
    await expect(page.locator('text=Payment reminder sent')).toBeVisible();

    // Step 6: Customer receives payment reminder
    await page.goto('/notifications');
    await expect(page.locator('text=Payment due tomorrow')).toBeVisible();

    // Step 7: Reminder includes payment link
    await expect(page.locator('text=Payment link included')).toBeVisible();
  });

  test('Urgent reminder for next-day travel', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking with travel tomorrow
    await page.goto('/flights');
    await page.click('text=Book Last Minute Flight');

    // Set travel date to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const travelDate = tomorrow.toISOString().split('T')[0];

    await page.fill('input[name="departure_date"]', travelDate);
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Verify urgent reminder scheduled for 1 day before
    await expect(page.locator('text=Urgent reminder scheduled')).toBeVisible();

    // Step 3: Fast-forward time to reminder time (mock)
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockTimeAdvance', {
        detail: { hours: 23 } // 1 hour before travel
      }));
    });

    // Step 4: Verify urgent reminder sent
    await expect(page.locator('text=Urgent reminder sent')).toBeVisible();

    // Step 5: Customer receives urgent reminder
    await page.goto('/notifications');
    await expect(page.locator('text=Your flight departs in 1 hour')).toBeVisible();

    // Step 6: Urgent reminder sent via multiple channels
    await expect(page.locator('text=Urgent: Email + SMS + Push sent')).toBeVisible();
  });

  test('Scheduled notification cancellation', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Verify reminders scheduled
    await expect(page.locator('text=Booking reminders scheduled')).toBeVisible();

    // Step 3: Cancel booking
    await page.click('text=Cancel Booking');
    await page.fill('textarea[name="reason"]', 'Change of plans');
    await page.click('text=Confirm Cancellation');

    // Step 4: Verify scheduled reminders cancelled
    await expect(page.locator('text=Scheduled reminders cancelled')).toBeVisible();

    // Step 5: Admin verifies no pending reminders
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=No pending reminders for cancelled booking')).toBeVisible();
  });

  test('Scheduled notification rescheduling after amendment', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Amend travel date
    await page.click('text=Amend Booking');
    await page.selectOption('select[name="amendment_type"]', 'date_change');

    // Change to 10 days from now
    const tenDaysFromNow = new Date();
    tenDaysFromNow.setDate(tenDaysFromNow.getDate() + 10);
    const newTravelDate = tenDaysFromNow.toISOString().split('T')[0];

    await page.fill('input[name="new_departure_date"]', newTravelDate);
    await page.click('text=Submit Amendment');

    // Step 3: Verify reminders rescheduled
    await expect(page.locator('text=Reminders rescheduled')).toBeVisible();

    // Step 4: Admin verifies new reminder schedule
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Reminder rescheduled for 7 days before new date')).toBeVisible();
  });
});