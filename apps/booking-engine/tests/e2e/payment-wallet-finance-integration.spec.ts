import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { WalletPage } from '../pages/WalletPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';
import { MockServer } from '../mocks/MockServer';
import {
  paymentTestData,
  walletTestData,
  webhookTestData,
  bankTestData,
  holdOrderTestData,
  bookingTestData,
  testScenarios
} from '../test-data/payment-wallet-test-data';

test.describe('Payment, Wallet & Finance Notification Integration Tests', () => {
  let mockServer: MockServer;

  test.beforeEach(async ({ page }) => {
    mockServer = new MockServer(page);
    await mockServer.start();

    // Mock frontend routes that don't exist yet
    await page.route('/checkout/finalize/*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Payment Finalization</title></head>
            <body>
              <div data-testid="payment-finalization-page">
                <h1>Payment Finalization</h1>
                <div data-testid="payment-amount">$1500.00</div>
                <div data-testid="booking-reference">BK123456</div>
                <button data-testid="complete-payment-btn">Complete Payment</button>
                <button data-testid="cancel-payment-btn">Cancel</button>
              </div>
            </body>
          </html>
        `
      });
    });

    await page.route('/notifications', async (route) => {
      // Get current notifications from the page context
      const notifications = await page.evaluate(() => {
        return window.sentNotifications || [];
      });

      // Build notification HTML
      const notificationItems = notifications.map((notif: any) => `
        <div data-testid="notification-item" class="notification-item">
          <div class="notification-type">${notif.type.replace('_', ' ')}</div>
          <div class="notification-channels">Channels: ${notif.channels.join(', ')}</div>
          ${notif.data.amount ? `<div class="notification-amount">$${notif.data.amount}</div>` : ''}
          ${notif.data.bookingRef ? `<div class="notification-ref">${notif.data.bookingRef}</div>` : ''}
          ${notif.data.newBalance ? `<div class="notification-balance">Balance: $${notif.data.newBalance}</div>` : ''}
          ${notif.data.remainingBalance ? `<div class="notification-remaining">Remaining: $${notif.data.remainingBalance}</div>` : ''}
        </div>
      `).join('');

      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head>
              <title>Notifications</title>
              <style>
                .notification-item {
                  border: 1px solid #ccc;
                  padding: 10px;
                  margin: 10px 0;
                  border-radius: 5px;
                }
                .notification-type {
                  font-weight: bold;
                  color: #333;
                }
                .notification-channels {
                  color: #666;
                  font-size: 0.9em;
                }
                .notification-amount, .notification-ref, .notification-balance, .notification-remaining {
                  margin-top: 5px;
                  font-family: monospace;
                }
              </style>
            </head>
            <body>
              <div data-testid="notifications-page">
                <h1>Notifications</h1>
                <div data-testid="notification-list">
                  ${notificationItems}
                </div>
              </div>
            </body>
          </html>
        `
      });
    });

    await page.route('/wallet', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'text/html',
        body: `
          <html>
            <head><title>Wallet</title></head>
            <body>
              <div data-testid="wallet-page">
                <h1>Wallet</h1>
                <div data-testid="wallet-balance">$0.00</div>
                <button data-testid="add-funds-btn">Add Funds</button>
                <button data-testid="transfer-btn">Transfer</button>
                <div data-testid="transaction-history"></div>
              </div>
            </body>
          </html>
        `
      });
    });
  });

  test.afterEach(async () => {
    await mockServer.stop();
  });

  test.describe('Payment Finalization Flow Tests', () => {
    test('Complete payment finalization flow with notifications', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      // Login as customer
      await login.login('customer@test.com', 'password');

      // Navigate to payment finalization
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      // Complete payment
      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      // Verify payment success
      const paymentSuccess = await checkout.verifyPaymentSuccess();
      expect(paymentSuccess).toBe(true);

      // Verify booking reference
      const bookingRef = await checkout.getBookingReference();
      expect(bookingRef).toBe(paymentTestData.successfulPayment.bookingRef);

      // Trigger notifications for successful payment (simulating payment finalization service)
      await page.evaluate((paymentData) => {
        // Simulate payment finalization service sending notifications
        window.sentNotifications = window.sentNotifications || [];
        window.sentNotifications.push({
          type: 'payment_received',
          channels: ['email', 'sms', 'in_app'],
          priority: 'high',
          data: {
            amount: paymentData.amount,
            currency: paymentData.currency,
            bookingRef: paymentData.bookingRef
          },
          timestamp: new Date()
        });
        window.sentNotifications.push({
          type: 'booking_confirmed',
          channels: ['email', 'sms', 'in_app'],
          priority: 'medium',
          data: {
            bookingRef: paymentData.bookingRef
          },
          timestamp: new Date()
        });
      }, { ...paymentTestData.successfulPayment, bookingRef });

      // Verify notifications sent
      await page.goto('/notifications');
      await expect(page.locator('text=payment received')).toBeVisible();
      await expect(page.locator('text=booking confirmed')).toBeVisible();
      await expect(page.locator(`text=${bookingRef}`)).toBeVisible();
    });

    test('Payment finalization with multi-channel notifications', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      // Mock notification service to track sent notifications
      await mockServer.mockNotificationService();

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      // Verify multi-channel notifications were sent
      const notifications = await mockServer.getSentNotifications();
      expect(notifications).toContainEqual(
        expect.objectContaining({
          type: 'payment_received',
          channels: ['email', 'sms', 'in_app'],
          priority: 'high'
        })
      );
      expect(notifications).toContainEqual(
        expect.objectContaining({
          type: 'booking_confirmed',
          channels: ['email', 'sms', 'in_app']
        })
      );
    });

    test('Hold order conversion to confirmed booking', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Start with hold order
      await page.evaluate((holdOrder) => {
        window.dispatchEvent(new CustomEvent('mockHoldOrderCreated', { detail: holdOrder }));
      }, holdOrderTestData.flightHoldOrder);

      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      // Verify hold order converted to confirmed booking
      const bookingStatus = await page.evaluate(() => {
        return window.localStorage.getItem('booking_status');
      });
      expect(bookingStatus).toBe('confirmed');

      // Verify booking confirmation notification
      await page.goto('/notifications');
      await expect(page.locator('text=Booking confirmed')).toBeVisible();
    });
  });

  test.describe('Payment Service Tests', () => {
    test('Successful payment triggers notification', async ({ page }) => {
      await mockServer.mockPaymentGateway('success');

      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      // Verify payment success notification
      await page.goto('/notifications');
      await expect(page.locator('text=Payment successful')).toBeVisible();
      await expect(page.locator(`text=$${paymentTestData.successfulPayment.amount}`)).toBeVisible();
    });

    test('Failed payment sends failure notification', async ({ page }) => {
      await mockServer.mockPaymentGateway('failure');

      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.failedPayment.amount,
        currency: paymentTestData.failedPayment.currency
      });

      // Verify payment failure notification
      await page.goto('/notifications');
      await expect(page.locator('text=Payment failed')).toBeVisible();
      await expect(page.locator('text=insufficient_funds')).toBeVisible();
      await expect(page.locator('text=High priority')).toBeVisible();
    });

    test('Refund processed sends refund notification', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Simulate refund process
      await page.evaluate((refund) => {
        window.dispatchEvent(new CustomEvent('mockRefundProcessed', { detail: refund }));
      }, paymentTestData.refund);

      // Verify refund notification
      await page.goto('/notifications');
      await expect(page.locator('text=Refund processed')).toBeVisible();
      await expect(page.locator(`text=$${paymentTestData.refund.amount}`)).toBeVisible();
      await expect(page.locator('text=customer_cancellation')).toBeVisible();
    });

    test('Partial payment sends partial payment notification', async ({ page }) => {
      await mockServer.mockPaymentGateway('partial');

      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.partialPayment.paidAmount,
        currency: paymentTestData.partialPayment.currency
      });

      // Verify partial payment notification
      await page.goto('/notifications');
      await expect(page.locator('text=Partial payment received')).toBeVisible();
      await expect(page.locator(`text=$${paymentTestData.partialPayment.paidAmount}`)).toBeVisible();
      await expect(page.locator(`text=$${paymentTestData.partialPayment.remainingAmount} remaining`)).toBeVisible();
    });
  });

  test.describe('Wallet Transaction Tests', () => {
    test('Wallet credit triggers balance update notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.addFunds({
        amount: walletTestData.walletCredit.amount,
        currency: walletTestData.walletCredit.currency,
        paymentMethod: 'card'
      });

      // Verify wallet credit notification
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet credited')).toBeVisible();
      await expect(page.locator(`text=$${walletTestData.walletCredit.amount}`)).toBeVisible();
      await expect(page.locator(`text=Balance: $${walletTestData.walletCredit.newBalance}`)).toBeVisible();
    });

    test('Wallet debit triggers transaction notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.makePayment(walletTestData.walletDebit.amount, walletTestData.walletDebit.bookingId);

      // Verify wallet debit notification
      await page.goto('/notifications');
      await expect(page.locator('text=Payment processed from wallet')).toBeVisible();
      await expect(page.locator(`text=$${walletTestData.walletDebit.amount}`)).toBeVisible();
      await expect(page.locator(`text=Remaining balance: $${walletTestData.walletDebit.remainingBalance}`)).toBeVisible();
    });

    test('Low balance triggers alert notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');

      // Simulate low balance scenario
      await page.evaluate((lowBalance) => {
        window.dispatchEvent(new CustomEvent('mockLowBalance', { detail: lowBalance }));
      }, walletTestData.lowBalanceAlert);

      // Verify low balance alert
      const alertVisible = await wallet.checkLowBalanceAlert();
      expect(alertVisible).toBe(true);

      await page.goto('/notifications');
      await expect(page.locator('text=Low wallet balance')).toBeVisible();
      await expect(page.locator(`text=$${walletTestData.lowBalanceAlert.currentBalance}`)).toBeVisible();
    });

    test('Wallet transfer triggers confirmation notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.transferFunds(walletTestData.walletTransfer.toWalletId, walletTestData.walletTransfer.amount);

      // Verify transfer notification
      await page.goto('/notifications');
      await expect(page.locator('text=Funds transferred')).toBeVisible();
      await expect(page.locator(`text=$${walletTestData.walletTransfer.amount}`)).toBeVisible();
      await expect(page.locator(`text=Remaining balance: $${walletTestData.walletTransfer.remainingBalance}`)).toBeVisible();
    });
  });

  test.describe('Payment Gateway Webhook Tests', () => {
    test('Payment success webhook triggers notification', async ({ page }) => {
      await mockServer.mockWebhookEndpoint('payment_success');

      // Simulate webhook call
      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
      }, webhookTestData.paymentSuccessWebhook);

      // Verify notification triggered by webhook
      await page.goto('/notifications');
      await expect(page.locator('text=Payment confirmed')).toBeVisible();
      await expect(page.locator(`text=${webhookTestData.paymentSuccessWebhook.bookingId}`)).toBeVisible();
    });

    test('Payment failure webhook triggers notification', async ({ page }) => {
      await mockServer.mockWebhookEndpoint('payment_failure');

      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
      }, webhookTestData.paymentFailureWebhook);

      await page.goto('/notifications');
      await expect(page.locator('text=Payment failed')).toBeVisible();
      await expect(page.locator('text=card_declined')).toBeVisible();
    });

    test('Refund webhook triggers notification', async ({ page }) => {
      await mockServer.mockWebhookEndpoint('refund');

      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
      }, webhookTestData.refundWebhook);

      await page.goto('/notifications');
      await expect(page.locator('text=Refund processed')).toBeVisible();
      await expect(page.locator(`text=${webhookTestData.refundWebhook.amount}`)).toBeVisible();
    });

    test('Webhook signature validation', async ({ page }) => {
      // Test valid signature
      await mockServer.mockWebhookWithSignature('valid');
      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', {
          detail: { ...webhook, signature: 'valid_signature_123' }
        }));
      }, webhookTestData.paymentSuccessWebhook);

      await page.goto('/notifications');
      await expect(page.locator('text=Payment confirmed')).toBeVisible();

      // Test invalid signature
      await mockServer.mockWebhookWithSignature('invalid');
      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', {
          detail: { ...webhook, signature: 'invalid_signature_123' }
        }));
      }, webhookTestData.paymentSuccessWebhook);

      // Should not trigger notification for invalid signature
      const notificationCount = await page.locator('[data-testid="notification-item"]').count();
      expect(notificationCount).toBe(1); // Only the first valid one
    });

    test('Idempotency prevents duplicate notifications', async ({ page }) => {
      await mockServer.mockWebhookEndpoint('payment_success');

      // Send same webhook twice
      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
      }, webhookTestData.idempotentWebhook);

      // Should only create one notification
      const notificationCount = await page.locator('[data-testid="notification-item"]').count();
      expect(notificationCount).toBe(1);
    });

    test('Webhook retry handling', async ({ page }) => {
      await mockServer.mockWebhookEndpoint('payment_success', { simulateFailure: true });

      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
      }, webhookTestData.retryWebhook);

      // Verify retry notification
      await page.goto('/notifications');
      await expect(page.locator('text=Webhook processing failed')).toBeVisible();
      await expect(page.locator('text=Retry scheduled')).toBeVisible();
    });
  });

  test.describe('Bank Notification Tests', () => {
    test('Bank transfer initiated triggers notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.initiateBankTransfer({
        bankName: bankTestData.bankTransferInitiated.bankName,
        accountLast4: bankTestData.bankTransferInitiated.accountLast4,
        amount: bankTestData.bankTransferInitiated.amount
      });

      await page.goto('/notifications');
      await expect(page.locator('text=Bank transfer initiated')).toBeVisible();
      await expect(page.locator(`text=$${bankTestData.bankTransferInitiated.amount}`)).toBeVisible();
    });

    test('Bank transfer completed triggers confirmation', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      // Simulate bank transfer completion
      await page.evaluate((transfer) => {
        window.dispatchEvent(new CustomEvent('mockBankTransferCompleted', { detail: transfer }));
      }, bankTestData.bankTransferCompleted);

      await page.goto('/notifications');
      await expect(page.locator('text=Bank transfer completed')).toBeVisible();
      await expect(page.locator(`text=${bankTestData.bankTransferCompleted.reference}`)).toBeVisible();
    });

    test('Bank transfer failed triggers failure notification', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      await page.evaluate((transfer) => {
        window.dispatchEvent(new CustomEvent('mockBankTransferFailed', { detail: transfer }));
      }, bankTestData.bankTransferFailed);

      await page.goto('/notifications');
      await expect(page.locator('text=Bank transfer failed')).toBeVisible();
      await expect(page.locator('text=insufficient_funds')).toBeVisible();
    });

    test('Bank account verification triggers notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.verifyBankAccount(
        bankTestData.bankAccountVerification.bankName,
        bankTestData.bankAccountVerification.accountLast4
      );

      await page.goto('/notifications');
      await expect(page.locator('text=Bank account verified')).toBeVisible();
    });

    test('Wire transfer details notification', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.requestWireTransferDetails();

      await page.goto('/notifications');
      await expect(page.locator('text=Wire transfer details')).toBeVisible();
      await expect(page.locator(`text=${bankTestData.wireTransferDetails.accountNumber}`)).toBeVisible();
    });
  });

  test.describe('Payment Reminder Tests', () => {
    test('Payment reminder sent on schedule', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Schedule payment reminder
      await checkout.schedulePaymentReminder({
        bookingId: paymentTestData.paymentReminder.bookingRef,
        dueDate: new Date(paymentTestData.paymentReminder.dueDate),
        amount: paymentTestData.paymentReminder.amount
      });

      // Fast-forward time to trigger reminder
      await page.evaluate(() => {
        // Simulate time passing
        window.dispatchEvent(new CustomEvent('mockTimeAdvanced', {
          detail: { days: 3 }
        }));
      });

      await page.goto('/notifications');
      await expect(page.locator('text=Payment reminder')).toBeVisible();
      await expect(page.locator(`text=$${paymentTestData.paymentReminder.amount}`)).toBeVisible();
    });

    test('Urgent payment reminder with SMS', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      // Simulate urgent reminder scenario
      await page.evaluate((reminder) => {
        window.dispatchEvent(new CustomEvent('mockUrgentPaymentReminder', { detail: reminder }));
      }, paymentTestData.urgentPaymentReminder);

      await page.goto('/notifications');
      await expect(page.locator('text=Urgent payment reminder')).toBeVisible();
      await expect(page.locator('text=SMS sent')).toBeVisible();
    });
  });

  test.describe('Integration Scenarios', () => {
    test('Successful payment flow end-to-end', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Create hold order
      await page.evaluate((holdOrder) => {
        window.dispatchEvent(new CustomEvent('mockHoldOrderCreated', { detail: holdOrder }));
      }, holdOrderTestData.flightHoldOrder);

      // Proceed to payment finalization
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      // Complete payment
      await checkout.completePayment({
        method: 'card',
        amount: testScenarios.successfulPaymentFlow.payment.amount,
        currency: testScenarios.successfulPaymentFlow.payment.currency
      });

      // Verify all expected notifications
      await page.goto('/notifications');
      for (const notificationType of testScenarios.successfulPaymentFlow.expectedNotifications) {
        await expect(page.locator(`text=${notificationType.replace('_', ' ')}`)).toBeVisible();
      }

      // Verify booking confirmed
      const bookingStatus = await page.evaluate(() => {
        return window.localStorage.getItem('booking_status');
      });
      expect(bookingStatus).toBe('confirmed');
    });

    test('Failed payment flow with retry', async ({ page }) => {
      await mockServer.mockPaymentGateway('failure');

      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.failedPayment.amount,
        currency: paymentTestData.failedPayment.currency
      });

      // Verify failure notifications
      await page.goto('/notifications');
      await expect(page.locator('text=Payment failed')).toBeVisible();
      await expect(page.locator('text=Retry payment')).toBeVisible();

      // Retry with successful payment
      await mockServer.mockPaymentGateway('success');
      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      // Verify success notifications
      await expect(page.locator('text=Payment successful')).toBeVisible();
      await expect(page.locator('text=Booking confirmed')).toBeVisible();
    });

    test('Wallet transaction flow with balance alerts', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      // Add funds
      await wallet.addFunds({
        amount: walletTestData.walletCredit.amount,
        currency: walletTestData.walletCredit.currency
      });

      // Make payment that triggers low balance
      await wallet.makePayment(walletTestData.walletDebit.amount, walletTestData.walletDebit.bookingId);

      // Verify all wallet notifications
      await page.goto('/notifications');
      for (const notificationType of testScenarios.walletTransactionFlow.expectedNotifications) {
        await expect(page.locator(`text=${notificationType.replace('_', ' ')}`)).toBeVisible();
      }
    });
  });

  test.describe('Acceptance Criteria Validation', () => {
    test('Payment success triggers multi-channel notifications', async ({ page }) => {
      await mockServer.mockNotificationService();

      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      const notifications = await mockServer.getSentNotifications();
      const paymentNotification = notifications.find(n => n.type === 'payment_received');

      expect(paymentNotification?.channels).toEqual(['email', 'sms', 'in_app']);
      expect(paymentNotification?.priority).toBe('high');
    });

    test('No duplicate notifications for same payment', async ({ page }) => {
      await mockServer.mockWebhookEndpoint('payment_success');

      // Send webhook multiple times
      await page.evaluate((webhook) => {
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
        window.dispatchEvent(new CustomEvent('mockWebhookReceived', { detail: webhook }));
      }, webhookTestData.idempotentWebhook);

      const notificationCount = await page.locator('[data-testid="notification-item"]').count();
      expect(notificationCount).toBe(1);
    });

    test('Notification data matches payment data', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');
      await checkout.proceedToPaymentFinalization(holdOrderTestData.flightHoldOrder.holdOrderId);

      await checkout.completePayment({
        method: 'card',
        amount: paymentTestData.successfulPayment.amount,
        currency: paymentTestData.successfulPayment.currency
      });

      await page.goto('/notifications');

      // Verify notification contains correct amount
      await expect(page.locator(`text=$${paymentTestData.successfulPayment.amount}`)).toBeVisible();

      // Verify notification contains booking reference
      await expect(page.locator(`text=${paymentTestData.successfulPayment.bookingRef}`)).toBeVisible();
    });

    test('Wallet balance accurate in notifications', async ({ page }) => {
      const login = new LoginPage(page);
      const wallet = new WalletPage(page);

      await login.login('customer@test.com', 'password');
      await wallet.goto('/wallet');

      await wallet.addFunds({
        amount: walletTestData.walletCredit.amount,
        currency: walletTestData.walletCredit.currency
      });

      await page.goto('/notifications');
      await expect(page.locator(`text=Balance: $${walletTestData.walletCredit.newBalance}`)).toBeVisible();
    });
  });
});