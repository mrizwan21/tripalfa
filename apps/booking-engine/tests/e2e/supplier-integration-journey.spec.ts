import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';

test.describe('Supplier Integration Journey E2E', () => {
  test('Complete Duffel order lifecycle with webhooks', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Customer creates booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Booking sent to Duffel
    await expect(page.locator('text=Booking sent to Duffel')).toBeVisible();

    // Step 3: Duffel sends order.created webhook
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockDuffelWebhook', {
        detail: {
          type: 'order.created',
          data: { id: 'ord_123', status: 'pending' }
        }
      }));
    });

    // Step 4: Webhook processed successfully
    await expect(page.locator('text=Duffel webhook processed')).toBeVisible();

    // Step 5: Customer receives booking confirmation
    await page.goto('/notifications');
    await expect(page.locator('text=Booking confirmed')).toBeVisible();

    // Step 6: Duffel updates flight schedule
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockDuffelWebhook', {
        detail: {
          type: 'order.updated',
          data: {
            id: 'ord_123',
            status: 'confirmed',
            changes: [{ type: 'schedule_change', new_departure: '10:30' }]
          }
        }
      }));
    });

    // Step 7: Customer receives schedule change notification
    await expect(page.locator('text=Flight schedule changed')).toBeVisible();
    await expect(page.locator('text=New departure: 10:30')).toBeVisible();
  });

  test('Supplier cancellation triggers refund process', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Supplier cancels booking
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockDuffelWebhook', {
        detail: {
          type: 'order.cancelled',
          data: {
            id: 'ord_123',
            reason: 'flight_cancelled',
            refund_amount: 1200
          }
        }
      }));
    });

    // Step 3: Cancellation notification sent (urgent)
    await expect(page.locator('text=Urgent: Booking cancelled')).toBeVisible();

    // Step 4: Refund initiated automatically
    await expect(page.locator('text=Automatic refund initiated')).toBeVisible();

    // Step 5: Customer receives cancellation notification
    await page.goto('/notifications');
    await expect(page.locator('text=Your booking has been cancelled')).toBeVisible();
    await expect(page.locator('text=Refund of $1200 will be processed')).toBeVisible();

    // Step 6: Admin receives cancellation alert
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Supplier cancellation: ord_123')).toBeVisible();
  });

  test('Webhook signature validation and security', async ({ page }) => {
    // Step 1: Valid webhook received
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockValidWebhook', {
        detail: {
          signature: 'valid_signature',
          payload: { type: 'order.created', data: { id: 'ord_123' } }
        }
      }));
    });

    // Step 2: Webhook processed successfully
    await expect(page.locator('text=Valid webhook processed')).toBeVisible();

    // Step 3: Invalid webhook received
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockInvalidWebhook', {
        detail: {
          signature: 'invalid_signature',
          payload: { type: 'order.created', data: { id: 'ord_123' } }
        }
      }));
    });

    // Step 4: Invalid webhook rejected
    await expect(page.locator('text=Invalid webhook signature rejected')).toBeVisible();

    // Step 5: Security alert generated
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Security alert: Invalid webhook signature')).toBeVisible();
  });

  test('Supplier integration error handling', async ({ page }) => {
    const login = new LoginPage(page);
    const checkout = new BookingCheckoutPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create booking
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Step 2: Supplier API error occurs
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockSupplierAPIError', {
        detail: { supplier: 'duffel', error: 'rate_limit_exceeded' }
      }));
    });

    // Step 3: Error notification sent to admin
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Supplier API error: rate_limit_exceeded')).toBeVisible();

    // Step 4: Customer receives friendly error message
    await page.goto('/notifications');
    await expect(page.locator('text=Booking processing delayed')).toBeVisible();
    await expect(page.locator('text=Please check back in a few minutes')).toBeVisible();

    // Step 5: Retry mechanism triggers
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockSupplierRetrySuccess'));
    });

    // Step 6: Booking completes successfully
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  });

  test('Multi-supplier integration (Duffel + LiteAPI)', async ({ page }) => {
    const login = new LoginPage(page);

    await login.login('customer@test.com', 'password');

    // Step 1: Create multi-segment booking
    await page.goto('/flights');
    await page.click('text=Book Multi-City Flight');

    // Step 2: First segment sent to Duffel
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockSupplierRouting', {
        detail: { segment: 1, supplier: 'duffel' }
      }));
    });

    // Step 3: Second segment sent to LiteAPI
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockSupplierRouting', {
        detail: { segment: 2, supplier: 'liteapi' }
      }));
    });

    // Step 4: Both suppliers confirm bookings
    await page.evaluate(() => {
      window.dispatchEvent(new CustomEvent('mockMultiSupplierConfirmation', {
        detail: {
          duffel: { status: 'confirmed', id: 'ord_duffel_123' },
          liteapi: { status: 'confirmed', id: 'ord_liteapi_456' }
        }
      }));
    });

    // Step 5: Customer receives unified booking confirmation
    await page.goto('/notifications');
    await expect(page.locator('text=Multi-city booking confirmed')).toBeVisible();

    // Step 6: Admin sees supplier-specific details
    const adminNotifications = new AdminNotificationsPage(page);
    await adminNotifications.goto('/admin/notifications');
    await expect(page.locator('text=Duffel: ord_duffel_123 confirmed')).toBeVisible();
    await expect(page.locator('text=LiteAPI: ord_liteapi_456 confirmed')).toBeVisible();
  });
});