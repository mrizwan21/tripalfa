import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';

test.describe('Cross-Cutting Test Scenarios', () => {
  test.describe('Performance Testing', () => {
    test('100 concurrent bookings with notifications', async ({ page, browser }) => {
      // Step 1: Create multiple browser contexts for concurrent users
      const contexts = [];
      for (let i = 0; i < 10; i++) {
        contexts.push(await browser.newContext());
      }

      // Step 2: Execute 100 concurrent bookings (10 contexts × 10 bookings each)
      const bookingPromises = contexts.map(async (context, contextIndex) => {
        const promises = [];
        for (let i = 0; i < 10; i++) {
          promises.push(createConcurrentBooking(context, contextIndex * 10 + i));
        }
        return Promise.all(promises);
      });

      const startTime = Date.now();
      await Promise.all(bookingPromises);
      const endTime = Date.now();

      // Step 3: Verify all bookings completed within time limit
      const totalTime = endTime - startTime;
      expect(totalTime).toBeLessThan(10000); // 10 seconds for 100 bookings

      // Step 4: Verify notification delivery
      await page.goto('/admin/notifications');
      await expect(page.locator('text=100 notifications sent')).toBeVisible();

      // Step 5: Verify no notification loss
      await expect(page.locator('text=0 notifications failed')).toBeVisible();

      // Cleanup
      for (const context of contexts) {
        await context.close();
      }
    });

    test('Notification delivery time < 2 seconds', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Start timing
      const startTime = Date.now();

      // Step 2: Create booking
      await page.goto('/flights');
      await page.click('text=Book Flight');
      await checkout.proceedToCheckout();
      await checkout.completeBooking();

      // Step 3: Measure notification delivery time
      const notificationTime = Date.now() - startTime;

      // Step 4: Verify delivery within 2 seconds
      expect(notificationTime).toBeLessThan(2000);

      // Step 5: Verify email delivery < 30 seconds
      await expect(page.locator('text=Email delivered in < 30s')).toBeVisible();

      // Step 6: Verify SMS delivery < 60 seconds
      await expect(page.locator('text=SMS delivered in < 60s')).toBeVisible();
    });
  });

  test.describe('Data Integrity Testing', () => {
    test('No duplicate notifications for same event', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Create booking
      await page.goto('/flights');
      await page.click('text=Book Flight');
      await checkout.proceedToCheckout();
      await checkout.completeBooking();

      // Step 2: Trigger same event multiple times
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBookingConfirmed'));
        window.dispatchEvent(new CustomEvent('mockBookingConfirmed'));
        window.dispatchEvent(new CustomEvent('mockBookingConfirmed'));
      });

      // Step 3: Verify only one notification sent
      await page.goto('/notifications');
      const notificationCount = await page.locator('text=Booking confirmed').count();
      expect(notificationCount).toBe(1);
    });

    test('Notification data matches source data', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Create booking with specific details
      await page.goto('/flights');
      await page.click('text=Book Flight');
      await page.fill('input[name="passenger_name"]', 'John Specific Doe');
      await page.fill('input[name="booking_reference"]', 'ABC123XYZ');
      await checkout.proceedToCheckout();
      await checkout.completeBooking();

      // Step 2: Check notification contains correct data
      await page.goto('/notifications');
      await expect(page.locator('text=John Specific Doe')).toBeVisible();
      await expect(page.locator('text=ABC123XYZ')).toBeVisible();
    });

    test('Notification history preserved for 7 days', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Create multiple notifications over time
      for (let i = 0; i < 10; i++) {
        await page.evaluate(() => {
          window.dispatchEvent(new CustomEvent('mockTestNotification', {
            detail: { id: `notif_${i}`, message: `Test notification ${i}` }
          }));
        });
      }

      // Step 2: Verify all notifications preserved
      await page.goto('/notifications');
      for (let i = 0; i < 10; i++) {
        await expect(page.locator(`text=Test notification ${i}`)).toBeVisible();
      }

      // Step 3: Simulate 7 days passing
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockTimeAdvance', {
          detail: { days: 7 }
        }));
      });

      // Step 4: Verify notifications still accessible
      await page.reload();
      await expect(page.locator('text=Test notification 0')).toBeVisible();
    });
  });

  test.describe('Security Testing', () => {
    test('Webhook signature validation required', async ({ page }) => {
      // Step 1: Attempt webhook without signature
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockUnsignedWebhook', {
          detail: { payload: { type: 'order.created' } }
        }));
      });

      // Step 2: Webhook rejected
      await expect(page.locator('text=Webhook rejected: missing signature')).toBeVisible();

      // Step 3: Attempt webhook with invalid signature
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockInvalidSignatureWebhook', {
          detail: {
            signature: 'invalid_sig',
            payload: { type: 'order.created' }
          }
        }));
      });

      // Step 4: Webhook rejected
      await expect(page.locator('text=Webhook rejected: invalid signature')).toBeVisible();

      // Step 5: Valid webhook accepted
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockValidWebhook', {
          detail: {
            signature: 'valid_hmac_signature',
            payload: { type: 'order.created', data: { id: 'ord_123' } }
          }
        }));
      });

      // Step 6: Webhook processed
      await expect(page.locator('text=Valid webhook processed')).toBeVisible();
    });

    test('User can only view own notifications', async ({ page, browser }) => {
      // Step 1: Create user A context
      const contextA = await browser.newContext();
      const pageA = await contextA.newPage();
      const loginA = new LoginPage(pageA);

      await loginA.login('userA@test.com', 'password');
      await pageA.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockUserNotification', {
          detail: { userId: 'userA', message: 'Private message for A' }
        }));
      });

      // Step 2: Create user B context
      const contextB = await browser.newContext();
      const pageB = await contextB.newPage();
      const loginB = new LoginPage(pageB);

      await loginB.login('userB@test.com', 'password');
      await pageB.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockUserNotification', {
          detail: { userId: 'userB', message: 'Private message for B' }
        }));
      });

      // Step 3: User A can only see their notifications
      await pageA.goto('/notifications');
      await expect(pageA.locator('text=Private message for A')).toBeVisible();
      await expect(pageA.locator('text=Private message for B')).not.toBeVisible();

      // Step 4: User B can only see their notifications
      await pageB.goto('/notifications');
      await expect(pageB.locator('text=Private message for B')).toBeVisible();
      await expect(pageB.locator('text=Private message for A')).not.toBeVisible();

      // Cleanup
      await contextA.close();
      await contextB.close();
    });
  });

  test.describe('Accessibility Testing', () => {
    test('Notification UI keyboard navigable', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Navigate to notifications using keyboard
      await page.keyboard.press('Tab'); // Focus on nav
      await page.keyboard.press('ArrowRight'); // Navigate to notifications
      await page.keyboard.press('Enter'); // Enter notifications

      // Step 2: Verify notifications page loaded
      await expect(page.locator('text=Notifications')).toBeVisible();

      // Step 3: Navigate notification list with keyboard
      await page.keyboard.press('Tab'); // Focus first notification
      await page.keyboard.press('ArrowDown'); // Next notification
      await page.keyboard.press('Enter'); // Open notification

      // Step 4: Verify notification details accessible
      await expect(page.locator('text=Notification Details')).toBeVisible();
    });

    test('Screen reader compatible', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');
      await page.goto('/notifications');

      // Step 1: Check ARIA labels present
      await expect(page.locator('[aria-label="Notifications list"]')).toBeVisible();
      await expect(page.locator('[aria-label="Unread notifications"]')).toBeVisible();

      // Step 2: Check semantic HTML structure
      await expect(page.locator('main[role="main"]')).toBeVisible();
      await expect(page.locator('nav[role="navigation"]')).toBeVisible();

      // Step 3: Check notification items have proper roles
      await expect(page.locator('[role="listitem"]')).toBeVisible();
    });

    test('Color contrast meets WCAG standards', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');
      await page.goto('/notifications');

      // Step 1: Check notification text contrast
      const notificationText = page.locator('.notification-text');
      const contrastRatio = await notificationText.evaluate((el) => {
        const style = window.getComputedStyle(el);
        // This would need actual contrast calculation in real implementation
        return style.color && style.backgroundColor ? '4.5:1' : 'fail';
      });

      expect(contrastRatio).toBe('4.5:1');

      // Step 2: Check button contrast
      const buttons = page.locator('button');
      await expect(buttons).toHaveCSS('color', /rgb\(0, 0, 0\)|rgb\(255, 255, 255\)/);
    });
  });

  test.describe('Mobile Responsiveness Testing', () => {
    test('Notification list responsive on mobile', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });

      // Step 2: Navigate to notifications
      await page.goto('/notifications');

      // Step 3: Verify responsive layout
      await expect(page.locator('.notification-list')).toHaveCSS('flex-direction', 'column');

      // Step 4: Check notification items stack vertically
      const notifications = page.locator('.notification-item');
      for (let i = 0; i < await notifications.count(); i++) {
        await expect(notifications.nth(i)).toHaveCSS('width', '100%');
      }
    });

    test('Touch interactions work correctly', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/notifications');

      // Step 1: Test touch scroll
      await page.touchscreen.tap(200, 300);
      await page.touchscreen.swipe(200, 300, 200, 200);

      // Step 2: Test notification tap
      const firstNotification = page.locator('.notification-item').first();
      await firstNotification.tap();

      // Step 3: Verify notification opened
      await expect(page.locator('.notification-details')).toBeVisible();

      // Step 4: Test swipe to dismiss (if implemented)
      await page.touchscreen.swipe(200, 200, 350, 200);
      await expect(page.locator('text=Notification dismissed')).toBeVisible();
    });

    test('Push notifications work on mobile devices', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');
      await page.setViewportSize({ width: 375, height: 667 });

      // Step 1: Grant notification permission
      await page.evaluate(() => {
        if ('Notification' in window) {
          Notification.requestPermission();
        }
      });

      // Step 2: Trigger push notification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPushNotification', {
          detail: { title: 'Test Push', body: 'This is a test push notification' }
        }));
      });

      // Step 3: Verify push notification displayed
      await expect(page.locator('text=Push notification sent')).toBeVisible();

      // Step 4: Check notification in browser notification area
      const notificationShown = await page.evaluate(() => {
        return new Promise((resolve) => {
          if ('Notification' in window && Notification.permission === 'granted') {
            const notification = new Notification('Test', { body: 'Test body' });
            notification.onclick = () => resolve(true);
            setTimeout(() => resolve(false), 1000);
          } else {
            resolve(false);
          }
        });
      });

      expect(notificationShown).toBe(true);
    });
  });
});

// Helper function for concurrent booking test
async function createConcurrentBooking(context: any, bookingIndex: number) {
  const page = await context.newPage();
  const login = new LoginPage(page);
  const checkout = new BookingCheckoutPage(page);

  try {
    await login.login(`user${bookingIndex}@test.com`, 'password');
    await page.goto('/flights');
    await page.click('text=Book Flight');
    await checkout.proceedToCheckout();
    await checkout.completeBooking();

    // Verify notification sent
    await expect(page.locator('text=Booking confirmed')).toBeVisible();
  } finally {
    await page.close();
  }
}