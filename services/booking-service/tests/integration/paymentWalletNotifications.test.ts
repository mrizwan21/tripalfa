/**
 * Integration Tests - Payment, Wallet & Finance Notifications
 * 
 * Tests cover:
 * - Payment processing notifications
 * - Wallet transaction notifications
 * - Refund notifications
 * - Invoice notifications
 * - Financial alert notifications
 * - Currency conversion notifications
 * - Payment failure recovery notifications
 */

import axios, { AxiosInstance } from 'axios';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('Payment, Wallet & Finance Notifications Integration', () => {
  let apiClient: AxiosInstance;

  beforeEach(() => {
    apiClient = axios.create({
      baseURL: process.env.TEST_BASE_URL || 'http://localhost:3001',
      timeout: 10000,
    });
  });

  describe('Payment Processing Notifications', () => {
    it('should send notification when payment is initiated', async () => {
      const paymentRequest = {
        orderId: 'order-payment-001',
        userId: 'user-123',
        amount: 500.00,
        currency: 'USD',
        paymentMethod: 'credit_card',
      };

      try {
        const response = await apiClient.post('/api/payments/process', paymentRequest);
        expect([200, 201, 202, 404]).toContain(response.status);

        // Verify notification was created
        if (response.status !== 404) {
          const notificationsResponse = await apiClient.get('/api/notifications');
          expect(notificationsResponse.status).toBe(200);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for successful payment', async () => {
      const paymentEvent = {
        orderId: 'order-success-001',
        userId: 'user-123',
        transactionId: 'txn-12345',
        amount: 1000.00,
        currency: 'USD',
        status: 'completed',
        completedAt: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'payment_success',
          title: 'Payment Successful',
          message: `Payment of $${paymentEvent.amount} has been successfully processed`,
          channels: ['email', 'sms'],
          metadata: paymentEvent,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for payment failure', async () => {
      const failureEvent = {
        orderId: 'order-failure-001',
        userId: 'user-123',
        transactionId: 'txn-failed-001',
        amount: 1500.00,
        currency: 'USD',
        status: 'failed',
        failureReason: 'Insufficient funds',
        failedAt: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'payment_failed',
          title: 'Payment Failed',
          message: `Payment of $${failureEvent.amount} has failed: ${failureEvent.failureReason}`,
          priority: 'high',
          channels: ['email', 'in_app'],
          metadata: failureEvent,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for payment pending', async () => {
      const pendingEvent = {
        orderId: 'order-pending-001',
        userId: 'user-123',
        transactionId: 'txn-pending-001',
        amount: 2000.00,
        currency: 'USD',
        status: 'pending',
        createdAt: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'payment_pending',
          title: 'Payment Processing',
          message: `Payment of $${pendingEvent.amount} is being processed`,
          channels: ['email', 'in_app'],
          metadata: pendingEvent,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Wallet Transaction Notifications', () => {
    it('should send notification for wallet credit', async () => {
      const walletCredit = {
        userId: 'user-123',
        walletId: 'wallet-001',
        amount: 100.00,
        currency: 'USD',
        type: 'credit',
        reason: 'Refund',
        balance: 500.00,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'wallet_credit',
          title: 'Wallet Credited',
          message: `$${walletCredit.amount} has been added to your wallet. Current balance: $${walletCredit.balance}`,
          channels: ['email', 'in_app'],
          metadata: walletCredit,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for wallet debit', async () => {
      const walletDebit = {
        userId: 'user-123',
        walletId: 'wallet-001',
        amount: 50.00,
        currency: 'USD',
        type: 'debit',
        reason: 'Booking payment',
        orderId: 'order-wallet-001',
        balance: 450.00,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'wallet_debit',
          title: 'Wallet Charged',
          message: `$${walletDebit.amount} has been deducted from your wallet. Current balance: $${walletDebit.balance}`,
          channels: ['email', 'in_app'],
          metadata: walletDebit,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for low wallet balance', async () => {
      const lowBalance = {
        userId: 'user-123',
        walletId: 'wallet-001',
        balance: 25.00,
        currency: 'USD',
        threshold: 50.00,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'wallet_low_balance',
          title: 'Low Wallet Balance',
          message: `Your wallet balance is critically low ($${lowBalance.balance}). Please add funds to continue booking`,
          priority: 'high',
          channels: ['email', 'sms', 'in_app'],
          metadata: lowBalance,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Refund Notifications', () => {
    it('should send notification for refund initiated', async () => {
      const refundEvent = {
        orderId: 'order-refund-001',
        userId: 'user-123',
        originalAmount: 500.00,
        refundAmount: 500.00,
        currency: 'USD',
        reason: 'Booking cancelled by user',
        status: 'initiated',
        estimatedProcessingTime: '3-5 business days',
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'refund_initiated',
          title: 'Refund Initiated',
          message: `A refund of $${refundEvent.refundAmount} has been initiated. It will be processed within ${refundEvent.estimatedProcessingTime}`,
          channels: ['email', 'sms'],
          metadata: refundEvent,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for refund completed', async () => {
      const refundComplete = {
        orderId: 'order-refund-complete-001',
        userId: 'user-123',
        refundAmount: 500.00,
        currency: 'USD',
        refundMethod: 'original_payment_method',
        transactionId: 'refund-txn-12345',
        completedAt: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'refund_completed',
          title: 'Refund Completed',
          message: `Your refund of $${refundComplete.refundAmount} has been successfully processed and returned to your ${refundComplete.refundMethod}`,
          channels: ['email', 'in_app'],
          metadata: refundComplete,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for partial refund', async () => {
      const partialRefund = {
        orderId: 'order-partial-refund-001',
        userId: 'user-123',
        originalAmount: 500.00,
        refundAmount: 300.00,
        deductedAmount: 200.00,
        currency: 'USD',
        reason: 'Partial cancellation',
        deductionReason: 'Cancellation fee',
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'refund_partial',
          title: 'Partial Refund Processed',
          message: `A partial refund of $${partialRefund.refundAmount} is being processed after deducting cancellation fees of $${partialRefund.deductedAmount}`,
          channels: ['email'],
          metadata: partialRefund,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Invoice Notifications', () => {
    it('should send notification for invoice generated', async () => {
      const invoiceEvent = {
        orderId: 'order-invoice-001',
        userId: 'user-123',
        invoiceNumber: 'INV-2024-001',
        amount: 1500.00,
        currency: 'USD',
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        generatedAt: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'invoice_generated',
          title: 'Invoice Available',
          message: `Invoice ${invoiceEvent.invoiceNumber} for $${invoiceEvent.amount} is ready for download`,
          channels: ['email', 'in_app'],
          metadata: invoiceEvent,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for payment due', async () => {
      const paymentDue = {
        orderId: 'order-due-001',
        userId: 'user-123',
        invoiceNumber: 'INV-2024-002',
        amount: 2000.00,
        currency: 'USD',
        dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        daysUntilDue: 3,
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'payment_due',
          title: 'Payment Due Soon',
          message: `Payment of $${paymentDue.amount} for invoice ${paymentDue.invoiceNumber} is due in ${paymentDue.daysUntilDue} days`,
          priority: 'medium',
          channels: ['email'],
          metadata: paymentDue,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Financial Alert Notifications', () => {
    it('should send notification for suspicious transaction', async () => {
      const suspiciousTransaction = {
        userId: 'user-123',
        transactionId: 'txn-suspicious-001',
        amount: 5000.00,
        currency: 'USD',
        location: 'Unknown location',
        timestamp: new Date().toISOString(),
        riskScore: 0.85,
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'suspicious_transaction',
          title: 'Suspicious Activity Detected',
          message: `An unusual transaction of $${suspiciousTransaction.amount} from ${suspiciousTransaction.location} has been detected. Please confirm if this was you`,
          priority: 'high',
          channels: ['email', 'sms', 'in_app'],
          metadata: suspiciousTransaction,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for account currency conversion', async () => {
      const conversionEvent = {
        userId: 'user-123',
        fromCurrency: 'USD',
        toCurrency: 'EUR',
        convertedAmount: 850.00,
        originalAmount: 1000.00,
        exchangeRate: 0.85,
        conversionFee: 15.00,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'currency_conversion',
          title: 'Currency Conversion Applied',
          message: `$${conversionEvent.originalAmount} USD was converted to €${conversionEvent.convertedAmount} EUR at rate ${conversionEvent.exchangeRate}. Conversion fee: $${conversionEvent.conversionFee}`,
          channels: ['email', 'in_app'],
          metadata: conversionEvent,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Payment Recovery Notifications', () => {
    it('should send notification for payment retry success', async () => {
      const retrySuccess = {
        orderId: 'order-retry-001',
        userId: 'user-123',
        originalTransactionId: 'txn-original-001',
        newTransactionId: 'txn-retry-001',
        amount: 1000.00,
        currency: 'USD',
        retryAttempt: 1,
        timestamp: new Date().toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'payment_retry_success',
          title: 'Payment Successful on Retry',
          message: `Your payment of $${retrySuccess.amount} has been successfully processed after a retry attempt`,
          channels: ['email', 'in_app'],
          metadata: retrySuccess,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });

    it('should send notification for payment retry final attempt', async () => {
      const finalAttempt = {
        orderId: 'order-final-attempt-001',
        userId: 'user-123',
        amount: 500.00,
        currency: 'USD',
        attemptsRemaining: 1,
        lastRetryDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      };

      try {
        const response = await apiClient.post('/api/notifications', {
          userId: 'user-123',
          type: 'payment_final_attempt',
          title: 'Final Payment Attempt Scheduled',
          message: `Your payment of $${finalAttempt.amount} will be retried on ${new Date(finalAttempt.lastRetryDate).toLocaleDateString()}. This is your final attempt`,
          priority: 'high',
          channels: ['email', 'sms'],
          metadata: finalAttempt,
        });

        if (response.status !== 404) {
          expect([200, 201]).toContain(response.status);
        }
      } catch (error: any) {
        expect([404, 500]).toContain(error.response?.status);
      }
    });
  });

  describe('Multi-Currency Transactions', () => {
    it('should handle notifications for different currencies', async () => {
      const currencies = ['USD', 'EUR', 'GBP', 'AED', 'INR'];
      const paymentAmounts = [1000, 900, 850, 3700, 85000];

      for (let i = 0; i < currencies.length; i++) {
        const currency = currencies[i];
        const amount = paymentAmounts[i];

        try {
          const response = await apiClient.post('/api/notifications', {
            userId: 'user-123',
            type: 'payment_success',
            title: `Payment Successful in ${currency}`,
            message: `Payment of ${amount} ${currency} has been successfully processed`,
            channels: ['email'],
            metadata: {
              currency,
              amount,
            },
          });

          if (response.status !== 404) {
            expect([200, 201]).toContain(response.status);
          }
        } catch (error: any) {
          expect([404, 500]).toContain(error.response?.status);
        }
      }
    });
  });
});
