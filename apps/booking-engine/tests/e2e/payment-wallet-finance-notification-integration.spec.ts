import { test, expect } from '@playwright/test';
import { LoginPage } from '../pages/LoginPage';
import { BookingCheckoutPage } from '../pages/BookingCheckoutPage';
import { AdminNotificationsPage } from '../pages/AdminNotificationsPage';

test.describe('Payment, Wallet & Finance Notification Integration Tests', () => {
  // ============================================================================
  // PAYMENT FINALIZATION FLOW TESTS
  // ============================================================================

  test.describe('Payment Finalization Flow Tests', () => {
    test('Complete payment finalization flow with multi-channel notifications', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      // Step 1: Create hold order
      await login.login('customer@test.com', 'password');
      await page.goto('/flights');
      await page.click('text=Book Flight');

      // Mock hold order creation
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockHoldOrderCreated', {
          detail: {
            holdOrderId: 'HOLD123456',
            totalAmount: 1500.00,
            currency: 'USD',
            customerId: 'user-123',
            customerName: 'John Doe',
            type: 'flight'
          }
        }));
      });

      // Step 2: Proceed to payment finalization
      await checkout.proceedToPaymentFinalization('HOLD123456');

      // Step 3: Complete payment
      await checkout.completePayment({
        method: 'card',
        amount: 1500.00,
        currency: 'USD'
      });

      // Step 4: Verify payment_received notification sent
      await expect(page.locator('text=Payment received notification sent')).toBeVisible();
      await expect(page.locator('text=Email notification sent')).toBeVisible();
      await expect(page.locator('text=SMS notification sent')).toBeVisible();
      await expect(page.locator('text=In-app notification sent')).toBeVisible();

      // Step 5: Verify booking_confirmed notification sent
      await expect(page.locator('text=Booking confirmed notification sent')).toBeVisible();

      // Step 6: Verify document generation triggers
      await expect(page.locator('text=Invoice generated')).toBeVisible();
      await expect(page.locator('text=E-ticket generated')).toBeVisible();

      // Step 7: Verify hold order converted to confirmed booking
      await expect(page.locator('text=Booking status: confirmed')).toBeVisible();

      // Step 8: Verify notification includes correct data
      await page.goto('/notifications');
      const notifications = page.locator('.notification-item');
      await expect(notifications.filter({ hasText: 'Payment of $1500.00 USD received' })).toBeVisible();
      await expect(notifications.filter({ hasText: 'Booking BK123456 confirmed' })).toBeVisible();

      // Step 9: Verify high priority notifications include SMS
      await expect(page.locator('text=High priority: SMS included')).toBeVisible();

      // Step 10: Verify metrics tracked
      await expect(page.locator('text=Notification metrics updated')).toBeVisible();
    });

    test('Payment finalization with wallet balance payment', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Create hold order
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockHoldOrderCreated', {
          detail: {
            holdOrderId: 'HOLD789012',
            totalAmount: 800.00,
            currency: 'USD',
            customerId: 'user-123',
            customerName: 'John Doe',
            type: 'hotel'
          }
        }));
      });

      // Step 2: Pay with wallet balance
      await checkout.proceedToPaymentFinalization('HOLD789012');
      await checkout.selectPaymentMethod('wallet_balance');

      // Step 3: Complete payment
      await checkout.completePayment({
        method: 'balance',
        amount: 800.00,
        currency: 'USD'
      });

      // Step 4: Verify wallet debit notification sent
      await expect(page.locator('text=Wallet debit notification sent')).toBeVisible();
      await expect(page.locator('text=Remaining balance: $200.00')).toBeVisible();

      // Step 5: Verify booking confirmation
      await expect(page.locator('text=Hotel booking confirmed')).toBeVisible();

      // Step 6: Verify hotel voucher generated
      await expect(page.locator('text=Hotel voucher generated')).toBeVisible();
    });
  });

  // ============================================================================
  // PAYMENT SERVICE TESTS
  // ============================================================================

  test.describe('Payment Service Tests', () => {
    test('Successful payment triggers notification', async ({ page }) => {
      // Step 1: Simulate payment processing
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentSuccess', {
          detail: {
            transactionId: 'txn_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            method: 'card',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify payment success notification sent
      await expect(page.locator('text=Payment successful')).toBeVisible();
      await expect(page.locator('text=Payment received notification sent')).toBeVisible();

      // Step 3: Verify notification includes payment details
      await page.goto('/notifications');
      await expect(page.locator('text=Payment of $1500.00 USD received for booking BK123456')).toBeVisible();
    });

    test('Failed payment sends high-priority failure notification', async ({ page }) => {
      // Step 1: Simulate payment failure
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentFailure', {
          detail: {
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            error: 'insufficient_funds',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify payment failed notification sent
      await expect(page.locator('text=Payment failed')).toBeVisible();
      await expect(page.locator('text=Payment failed notification sent')).toBeVisible();

      // Step 3: Verify high priority and SMS included
      await expect(page.locator('text=High priority notification')).toBeVisible();
      await expect(page.locator('text=SMS notification sent')).toBeVisible();

      // Step 4: Verify failure reason included
      await page.goto('/notifications');
      await expect(page.locator('text=Payment failed: insufficient_funds')).toBeVisible();
      await expect(page.locator('text=Please try again with a different payment method')).toBeVisible();
    });

    test('Refund processed triggers refund notification', async ({ page }) => {
      // Step 1: Simulate refund processing
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockRefundProcessed', {
          detail: {
            transactionId: 'txn_001',
            bookingId: 'BK123456',
            refundAmount: 1500.00,
            currency: 'USD',
            reason: 'customer_cancellation',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify refund notification sent
      await expect(page.locator('text=Refund processed')).toBeVisible();
      await expect(page.locator('text=Refund notification sent')).toBeVisible();

      // Step 3: Verify refund details in notification
      await page.goto('/notifications');
      await expect(page.locator('text=Refund of $1500.00 USD processed for booking BK123456')).toBeVisible();
      await expect(page.locator('text=Reason: customer_cancellation')).toBeVisible();
    });

    test('Partial payment triggers partial payment notification', async ({ page }) => {
      // Step 1: Simulate partial payment
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPartialPayment', {
          detail: {
            bookingId: 'BK123456',
            paidAmount: 750.00,
            totalAmount: 1500.00,
            currency: 'USD',
            remainingAmount: 750.00,
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify partial payment notification sent
      await expect(page.locator('text=Partial payment received')).toBeVisible();
      await expect(page.locator('text=Partial payment notification sent')).toBeVisible();

      // Step 3: Verify amounts in notification
      await page.goto('/notifications');
      await expect(page.locator('text=Partial payment of $750.00 USD received')).toBeVisible();
      await expect(page.locator('text=Remaining balance: $750.00 USD')).toBeVisible();
    });

    test('Payment reminder notification sent on schedule', async ({ page }) => {
      // Step 1: Create booking with pending payment
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBookingWithPendingPayment', {
          detail: {
            bookingId: 'BK123456',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days from now
            amount: 1500.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Trigger payment reminder (3 days before due)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentReminderTrigger', {
          detail: { daysUntilDue: 3 }
        }));
      });

      // Step 3: Verify reminder notification sent
      await expect(page.locator('text=Payment reminder sent')).toBeVisible();

      // Step 4: Verify reminder details
      await page.goto('/notifications');
      await expect(page.locator('text=Payment due in 3 days')).toBeVisible();
      await expect(page.locator('text=Amount due: $1500.00 USD')).toBeVisible();
      await expect(page.locator('text=Payment link included')).toBeVisible();
    });

    test('Urgent payment reminder sent when due date approaching', async ({ page }) => {
      // Step 1: Trigger urgent payment reminder (1 day before due)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockUrgentPaymentReminder', {
          detail: {
            bookingId: 'BK123456',
            daysUntilDue: 1,
            amount: 1500.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify urgent reminder sent with SMS
      await expect(page.locator('text=Urgent payment reminder sent')).toBeVisible();
      await expect(page.locator('text=SMS notification sent')).toBeVisible();

      // Step 3: Verify high priority
      await expect(page.locator('text=High priority reminder')).toBeVisible();
    });
  });

  // ============================================================================
  // WALLET TRANSACTION TESTS
  // ============================================================================

  test.describe('Wallet Transaction Tests', () => {
    test('Wallet credit triggers balance update notification', async ({ page }) => {
      // Step 1: Simulate wallet credit
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWalletCredit', {
          detail: {
            walletId: 'wallet-123',
            amount: 500.00,
            currency: 'USD',
            type: 'credit',
            userId: 'user-123',
            newBalance: 1200.00
          }
        }));
      });

      // Step 2: Verify wallet credit notification sent
      await expect(page.locator('text=Wallet credit notification sent')).toBeVisible();

      // Step 3: Verify notification includes new balance
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet credited $500.00 USD')).toBeVisible();
      await expect(page.locator('text=New balance: $1200.00 USD')).toBeVisible();
    });

    test('Wallet debit triggers transaction notification', async ({ page }) => {
      // Step 1: Simulate wallet debit
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWalletDebit', {
          detail: {
            walletId: 'wallet-123',
            amount: 200.00,
            currency: 'USD',
            type: 'debit',
            bookingId: 'booking-456',
            userId: 'user-123',
            remainingBalance: 1000.00
          }
        }));
      });

      // Step 2: Verify wallet debit notification sent
      await expect(page.locator('text=Wallet debit notification sent')).toBeVisible();

      // Step 3: Verify transaction details
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet debited $200.00 USD for booking booking-456')).toBeVisible();
      await expect(page.locator('text=Remaining balance: $1000.00 USD')).toBeVisible();
    });

    test('Low balance triggers alert notification', async ({ page }) => {
      // Step 1: Simulate low balance condition
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockLowWalletBalance', {
          detail: {
            walletId: 'wallet-123',
            currentBalance: 50.00,
            threshold: 100.00,
            currency: 'USD',
            userId: 'user-123'
          }
        }));
      });

      // Step 2: Verify low balance alert sent
      await expect(page.locator('text=Low balance alert sent')).toBeVisible();
      await expect(page.locator('text=High priority alert')).toBeVisible();

      // Step 3: Verify alert includes balance details
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet balance low: $50.00 USD')).toBeVisible();
      await expect(page.locator('text=Consider adding funds')).toBeVisible();
    });

    test('Wallet transfer triggers confirmation notification', async ({ page }) => {
      // Step 1: Simulate wallet transfer
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWalletTransfer', {
          detail: {
            fromWalletId: 'wallet-123',
            toWalletId: 'wallet-456',
            amount: 300.00,
            currency: 'USD',
            userId: 'user-123',
            remainingBalance: 700.00
          }
        }));
      });

      // Step 2: Verify transfer confirmation sent
      await expect(page.locator('text=Wallet transfer notification sent')).toBeVisible();

      // Step 3: Verify transfer details
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet transfer of $300.00 USD completed')).toBeVisible();
      await expect(page.locator('text=Remaining balance: $700.00 USD')).toBeVisible();
    });

    test('Transaction history notification sent', async ({ page }) => {
      // Step 1: Request transaction history
      await page.goto('/wallet');
      await page.click('text=View Transaction History');

      // Step 2: Simulate transaction history retrieval
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockTransactionHistory', {
          detail: {
            walletId: 'wallet-123',
            transactions: [
              { id: 'txn1', type: 'credit', amount: 500.00, date: '2026-01-01' },
              { id: 'txn2', type: 'debit', amount: 200.00, date: '2026-01-02' }
            ],
            userId: 'user-123'
          }
        }));
      });

      // Step 3: Verify transaction history notification sent
      await expect(page.locator('text=Transaction history notification sent')).toBeVisible();

      // Step 4: Verify history details included
      await page.goto('/notifications');
      await expect(page.locator('text=Transaction history updated')).toBeVisible();
      await expect(page.locator('text=Recent transactions: 2')).toBeVisible();
    });

    test('Failed wallet transaction sends error notification', async ({ page }) => {
      // Step 1: Simulate failed wallet transaction
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWalletTransactionFailed', {
          detail: {
            walletId: 'wallet-123',
            amount: 200.00,
            currency: 'USD',
            error: 'insufficient_balance',
            userId: 'user-123'
          }
        }));
      });

      // Step 2: Verify error notification sent
      await expect(page.locator('text=Wallet transaction failed')).toBeVisible();
      await expect(page.locator('text=Error notification sent')).toBeVisible();

      // Step 3: Verify error details
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet transaction failed: insufficient_balance')).toBeVisible();
      await expect(page.locator('text=Please check your balance and try again')).toBeVisible();
    });
  });

  // ============================================================================
  // PAYMENT GATEWAY WEBHOOK TESTS
  // ============================================================================

  test.describe('Payment Gateway Webhook Tests', () => {
    test('Payment success webhook triggers notification', async ({ page }) => {
      // Step 1: Simulate payment success webhook
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentSuccessWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            status: 'succeeded',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify webhook processed
      await expect(page.locator('text=Payment success webhook processed')).toBeVisible();

      // Step 3: Verify notification sent
      await expect(page.locator('text=Payment received notification sent')).toBeVisible();

      // Step 4: Verify webhook signature validation passed
      await expect(page.locator('text=Webhook signature validated')).toBeVisible();
    });

    test('Payment failure webhook triggers failure notification', async ({ page }) => {
      // Step 1: Simulate payment failure webhook
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentFailureWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            status: 'failed',
            failureCode: 'card_declined',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify webhook processed
      await expect(page.locator('text=Payment failure webhook processed')).toBeVisible();

      // Step 3: Verify failure notification sent
      await expect(page.locator('text=Payment failed notification sent')).toBeVisible();

      // Step 4: Verify high priority and SMS
      await expect(page.locator('text=High priority notification')).toBeVisible();
      await expect(page.locator('text=SMS notification sent')).toBeVisible();
    });

    test('Refund webhook triggers refund notification', async ({ page }) => {
      // Step 1: Simulate refund webhook
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockRefundWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            refundId: 'ref_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            status: 'succeeded',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify webhook processed
      await expect(page.locator('text=Refund webhook processed')).toBeVisible();

      // Step 3: Verify refund notification sent
      await expect(page.locator('text=Refund notification sent')).toBeVisible();

      // Step 4: Verify refund details
      await page.goto('/notifications');
      await expect(page.locator('text=Refund of $1500.00 USD processed')).toBeVisible();
    });

    test('Chargeback webhook triggers chargeback notification', async ({ page }) => {
      // Step 1: Simulate chargeback webhook
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockChargebackWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            chargebackId: 'chb_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            reason: 'fraudulent',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify webhook processed
      await expect(page.locator('text=Chargeback webhook processed')).toBeVisible();

      // Step 3: Verify chargeback notification sent
      await expect(page.locator('text=Chargeback notification sent')).toBeVisible();

      // Step 4: Verify urgent priority
      await expect(page.locator('text=Urgent priority notification')).toBeVisible();
      await expect(page.locator('text=SMS notification sent')).toBeVisible();
      await expect(page.locator('text=Email notification sent')).toBeVisible();
    });

    test('Webhook signature validation', async ({ page }) => {
      // Step 1: Simulate webhook with valid signature
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWebhookWithValidSignature', {
          detail: {
            gateway: 'stripe',
            signature: 'valid_signature_123',
            payload: { transactionId: 'txn_001', status: 'succeeded' }
          }
        }));
      });

      // Step 2: Verify signature validation passed
      await expect(page.locator('text=Webhook signature validated')).toBeVisible();

      // Step 3: Simulate webhook with invalid signature
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWebhookWithInvalidSignature', {
          detail: {
            gateway: 'stripe',
            signature: 'invalid_signature_123',
            payload: { transactionId: 'txn_001', status: 'succeeded' }
          }
        }));
      });

      // Step 4: Verify signature validation failed
      await expect(page.locator('text=Webhook signature validation failed')).toBeVisible();
      await expect(page.locator('text=Webhook rejected')).toBeVisible();
    });

    test('Idempotency prevents duplicate notifications', async ({ page }) => {
      // Step 1: Simulate first webhook
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockIdempotentWebhook', {
          detail: {
            gateway: 'stripe',
            eventId: 'evt_123',
            transactionId: 'txn_001',
            status: 'succeeded',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify first notification sent
      await expect(page.locator('text=Payment notification sent')).toBeVisible();

      // Step 3: Simulate duplicate webhook with same event ID
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockIdempotentWebhook', {
          detail: {
            gateway: 'stripe',
            eventId: 'evt_123', // Same event ID
            transactionId: 'txn_001',
            status: 'succeeded',
            customerId: 'user-123'
          }
        }));
      });

      // Step 4: Verify duplicate webhook rejected
      await expect(page.locator('text=Duplicate webhook rejected')).toBeVisible();
      await expect(page.locator('text=No additional notification sent')).toBeVisible();
    });

    test('Webhook retry handling', async ({ page }) => {
      // Step 1: Simulate webhook processing failure
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWebhookProcessingFailure', {
          detail: {
            gateway: 'stripe',
            eventId: 'evt_456',
            retryCount: 1,
            error: 'temporary_service_unavailable'
          }
        }));
      });

      // Step 2: Verify retry logic triggered
      await expect(page.locator('text=Webhook processing failed, retry scheduled')).toBeVisible();

      // Step 3: Simulate successful retry
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWebhookRetrySuccess', {
          detail: {
            gateway: 'stripe',
            eventId: 'evt_456',
            retryCount: 2,
            status: 'processed'
          }
        }));
      });

      // Step 4: Verify retry successful
      await expect(page.locator('text=Webhook retry successful')).toBeVisible();
      await expect(page.locator('text=Notification sent')).toBeVisible();
    });
  });

  // ============================================================================
  // BANK NOTIFICATION TESTS
  // ============================================================================

  test.describe('Bank Notification Tests', () => {
    test('Bank transfer initiated triggers notification', async ({ page }) => {
      // Step 1: Simulate bank transfer initiation
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBankTransferInitiated', {
          detail: {
            transferId: 'btx_001',
            amount: 2500.00,
            currency: 'USD',
            bankName: 'Chase Bank',
            accountLast4: '1234',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify transfer initiated notification sent
      await expect(page.locator('text=Bank transfer initiated')).toBeVisible();
      await expect(page.locator('text=Bank transfer notification sent')).toBeVisible();

      // Step 3: Verify transfer details
      await page.goto('/notifications');
      await expect(page.locator('text=Bank transfer of $2500.00 USD initiated')).toBeVisible();
      await expect(page.locator('text=Chase Bank ****1234')).toBeVisible();
    });

    test('Bank transfer completed triggers confirmation notification', async ({ page }) => {
      // Step 1: Simulate bank transfer completion
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBankTransferCompleted', {
          detail: {
            transferId: 'btx_001',
            amount: 2500.00,
            currency: 'USD',
            bankName: 'Chase Bank',
            reference: 'REF123456',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify transfer completed notification sent
      await expect(page.locator('text=Bank transfer completed')).toBeVisible();
      await expect(page.locator('text=Transfer confirmation notification sent')).toBeVisible();

      // Step 3: Verify confirmation details
      await page.goto('/notifications');
      await expect(page.locator('text=Bank transfer completed: $2500.00 USD')).toBeVisible();
      await expect(page.locator('text=Reference: REF123456')).toBeVisible();
    });

    test('Bank transfer failed triggers failure notification', async ({ page }) => {
      // Step 1: Simulate bank transfer failure
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBankTransferFailed', {
          detail: {
            transferId: 'btx_001',
            amount: 2500.00,
            currency: 'USD',
            bankName: 'Chase Bank',
            error: 'insufficient_funds',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify transfer failed notification sent
      await expect(page.locator('text=Bank transfer failed')).toBeVisible();
      await expect(page.locator('text=Transfer failure notification sent')).toBeVisible();

      // Step 3: Verify failure details and retry instructions
      await page.goto('/notifications');
      await expect(page.locator('text=Bank transfer failed: insufficient_funds')).toBeVisible();
      await expect(page.locator('text=Please check your account and try again')).toBeVisible();
    });

    test('Bank account verification triggers notification', async ({ page }) => {
      // Step 1: Simulate bank account verification
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBankAccountVerification', {
          detail: {
            accountId: 'acc_001',
            bankName: 'Chase Bank',
            accountLast4: '1234',
            verificationStatus: 'verified',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Verify verification notification sent
      await expect(page.locator('text=Bank account verified')).toBeVisible();
      await expect(page.locator('text=Account verification notification sent')).toBeVisible();

      // Step 3: Verify verification details
      await page.goto('/notifications');
      await expect(page.locator('text=Bank account ****1234 verified')).toBeVisible();
      await expect(page.locator('text=You can now use this account for transfers')).toBeVisible();
    });

    test('Wire transfer details notification sent', async ({ page }) => {
      // Step 1: Request wire transfer details
      await page.goto('/wallet');
      await page.click('text=Add Funds via Wire Transfer');

      // Step 2: Simulate wire transfer details generation
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWireTransferDetails', {
          detail: {
            accountName: 'TripAlfa Inc',
            accountNumber: '1234567890',
            routingNumber: '021000021',
            bankName: 'Chase Bank',
            swiftCode: 'CHASUS33',
            amount: 5000.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 3: Verify wire transfer details notification sent
      await expect(page.locator('text=Wire transfer details sent')).toBeVisible();

      // Step 4: Verify banking details included
      await page.goto('/notifications');
      await expect(page.locator('text=Wire transfer details for $5000.00 USD')).toBeVisible();
      await expect(page.locator('text=Account: ****7890')).toBeVisible();
      await expect(page.locator('text=Routing: 021000021')).toBeVisible();
      await expect(page.locator('text=SWIFT: CHASUS33')).toBeVisible();
    });
  });

  // ============================================================================
  // END-TO-END SCENARIO TESTS
  // ============================================================================

  test.describe('End-to-End Scenario Tests', () => {
    test('Scenario 1: Successful Payment Flow', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      // Step 1: Customer submits payment for booking
      await login.login('customer@test.com', 'password');
      await page.goto('/flights');
      await page.click('text=Book Flight');
      await checkout.proceedToCheckout();
      await checkout.completeBooking();

      // Step 2: Payment gateway processes payment
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentGatewayProcessing', {
          detail: { bookingId: 'BK123456', amount: 1500.00, currency: 'USD' }
        }));
      });

      // Step 3: Payment success webhook received
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentSuccessWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 4: Payment finalization service triggered
      await expect(page.locator('text=Payment finalization triggered')).toBeVisible();

      // Step 5: Verify payment_received notification sent (email, SMS, in-app)
      await expect(page.locator('text=Payment received notification sent')).toBeVisible();
      await expect(page.locator('text=Email sent')).toBeVisible();
      await expect(page.locator('text=SMS sent')).toBeVisible();
      await expect(page.locator('text=In-app notification sent')).toBeVisible();

      // Step 6: Verify booking_confirmed notification sent
      await expect(page.locator('text=Booking confirmed notification sent')).toBeVisible();

      // Step 7: Verify documents generated (invoice, e-ticket)
      await expect(page.locator('text=Invoice generated')).toBeVisible();
      await expect(page.locator('text=E-ticket generated')).toBeVisible();

      // Step 8: Verify all notifications include correct data
      await page.goto('/notifications');
      await expect(page.locator('text=Payment of $1500.00 USD for booking BK123456')).toBeVisible();
      await expect(page.locator('text=Booking BK123456 confirmed')).toBeVisible();

      // Step 9: Verify notifications marked as sent
      await expect(page.locator('text=Notifications status: sent')).toBeVisible();

      // Step 10: Verify metrics tracked
      await expect(page.locator('text=Payment notification metrics updated')).toBeVisible();
    });

    test('Scenario 2: Failed Payment Flow', async ({ page }) => {
      const login = new LoginPage(page);
      const checkout = new BookingCheckoutPage(page);

      // Step 1: Customer submits payment
      await login.login('customer@test.com', 'password');
      await page.goto('/flights');
      await page.click('text=Book Flight');
      await checkout.proceedToCheckout();

      // Step 2: Payment gateway rejects payment
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentGatewayRejection', {
          detail: {
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            error: 'insufficient_funds'
          }
        }));
      });

      // Step 3: Payment failure webhook received
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentFailureWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            failureCode: 'card_declined',
            customerId: 'user-123'
          }
        }));
      });

      // Step 4: Verify payment_failed notification sent
      await expect(page.locator('text=Payment failed notification sent')).toBeVisible();

      // Step 5: Verify notification priority is HIGH
      await expect(page.locator('text=High priority notification')).toBeVisible();

      // Step 6: Verify SMS included in channels
      await expect(page.locator('text=SMS notification sent')).toBeVisible();

      // Step 7: Verify notification includes failure reason
      await page.goto('/notifications');
      await expect(page.locator('text=Payment failed: card_declined')).toBeVisible();
      await expect(page.locator('text=Please try again')).toBeVisible();
    });

    test('Scenario 3: Refund Processing', async ({ page }) => {
      // Step 1: Admin initiates refund
      const adminNotifications = new AdminNotificationsPage(page);
      await adminNotifications.goto('/admin/bookings');
      await adminNotifications.initiateRefund('BK123456', 1500.00, 'customer_cancellation');

      // Step 2: Refund processed by payment gateway
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockRefundProcessing', {
          detail: {
            bookingId: 'BK123456',
            refundAmount: 1500.00,
            currency: 'USD',
            reason: 'customer_cancellation'
          }
        }));
      });

      // Step 3: Refund webhook received
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockRefundWebhook', {
          detail: {
            gateway: 'stripe',
            transactionId: 'txn_stripe_001',
            refundId: 'ref_stripe_001',
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 4: Verify refund notification sent to customer
      await expect(page.locator('text=Refund notification sent')).toBeVisible();

      // Step 5: Verify notification includes refund amount
      await page.goto('/notifications');
      await expect(page.locator('text=Refund of $1500.00 USD processed')).toBeVisible();

      // Step 6: Verify notification includes refund timeline
      await expect(page.locator('text=Refund will appear in 3-5 business days')).toBeVisible();

      // Step 7: Verify wallet balance updated (if applicable)
      await expect(page.locator('text=Wallet balance updated')).toBeVisible();

      // Step 8: Verify wallet balance notification sent
      await expect(page.locator('text=Wallet balance notification sent')).toBeVisible();
    });

    test('Scenario 4: Wallet Transaction Flow', async ({ page }) => {
      const login = new LoginPage(page);

      await login.login('customer@test.com', 'password');

      // Step 1: Customer adds funds to wallet
      await page.goto('/wallet');
      await page.click('text=Add Funds');
      await page.fill('input[name="amount"]', '500');
      await page.click('text=Add Funds');

      // Step 2: Transaction recorded in wallet service
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWalletCredit', {
          detail: {
            walletId: 'wallet-123',
            amount: 500.00,
            currency: 'USD',
            userId: 'user-123',
            newBalance: 1200.00
          }
        }));
      });

      // Step 3: Verify wallet credit notification sent
      await expect(page.locator('text=Wallet credit notification sent')).toBeVisible();

      // Step 4: Verify notification includes new balance
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet credited $500.00 USD')).toBeVisible();
      await expect(page.locator('text=New balance: $1200.00 USD')).toBeVisible();

      // Step 5: Customer uses wallet for booking payment
      await page.goto('/flights');
      await page.click('text=Book Flight with Wallet');

      // Step 6: Verify wallet debit notification sent
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockWalletDebit', {
          detail: {
            walletId: 'wallet-123',
            amount: 200.00,
            currency: 'USD',
            bookingId: 'booking-456',
            userId: 'user-123',
            remainingBalance: 1000.00
          }
        }));
      });

      // Step 7: Verify wallet debit notification sent
      await expect(page.locator('text=Wallet debit notification sent')).toBeVisible();

      // Step 8: Verify notification includes remaining balance
      await page.goto('/notifications');
      await expect(page.locator('text=Wallet debited $200.00 USD')).toBeVisible();
      await expect(page.locator('text=Remaining balance: $1000.00 USD')).toBeVisible();

      // Step 9: If balance < threshold, verify low balance alert sent
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockLowWalletBalance', {
          detail: {
            walletId: 'wallet-123',
            currentBalance: 50.00,
            threshold: 100.00,
            currency: 'USD',
            userId: 'user-123'
          }
        }));
      });

      await expect(page.locator('text=Low balance alert sent')).toBeVisible();
    });

    test('Scenario 5: Payment Reminder Flow', async ({ page }) => {
      // Step 1: Booking created with pending payment
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockBookingWithPendingPayment', {
          detail: {
            bookingId: 'BK123456',
            dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
            amount: 1500.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 2: Payment due date approaching (3 days)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockPaymentReminderTrigger', {
          detail: { daysUntilDue: 3, bookingId: 'BK123456' }
        }));
      });

      // Step 3: Scheduled payment reminder triggered
      await expect(page.locator('text=Payment reminder triggered')).toBeVisible();

      // Step 4: Verify reminder notification sent
      await expect(page.locator('text=Payment reminder notification sent')).toBeVisible();

      // Step 5: Verify notification includes due date
      await page.goto('/notifications');
      await expect(page.locator('text=Payment due in 3 days')).toBeVisible();

      // Step 6: Verify notification includes amount due
      await expect(page.locator('text=Amount due: $1500.00 USD')).toBeVisible();

      // Step 7: Verify notification includes payment link
      await expect(page.locator('text=Payment link included')).toBeVisible();

      // Step 8: Payment due date approaching (1 day)
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('mockUrgentPaymentReminder', {
          detail: {
            daysUntilDue: 1,
            bookingId: 'BK123456',
            amount: 1500.00,
            currency: 'USD',
            customerId: 'user-123'
          }
        }));
      });

      // Step 9: Verify urgent reminder sent with SMS
      await expect(page.locator('text=Urgent payment reminder sent')).toBeVisible();
      await expect(page.locator('text=SMS notification sent')).toBeVisible();
    });
  });
});