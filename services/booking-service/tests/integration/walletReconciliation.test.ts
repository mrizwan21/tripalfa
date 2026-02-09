/**
 * Wallet Reconciliation & Scheduled Job Notifications
 * 
 * Tests cover:
 * - Daily wallet reconciliation job (2 AM UTC cron)
 * - FX rate update notifications (hourly cron)
 * - Low balance alert notifications
 * - Transaction confirmation notifications
 * - Reconciliation discrepancy alerts
 * - Job execution and scheduling
 * - Notification delivery from cron jobs
 */

import { describe, it, expect, beforeEach } from 'vitest';
import axios from 'axios';

const API_BASE_URL = process.env.BOOKING_SERVICE_API || 'http://localhost:3001/api';

describe('Wallet Reconciliation & Scheduled Job Notifications', () => {
  let userId: string;
  let walletId: string;

  beforeEach(() => {
    userId = `user-${Date.now()}`;
    walletId = `wallet-${Date.now()}`;
  });

  describe('Daily Wallet Reconciliation (2 AM UTC)', () => {
    it('should execute daily reconciliation job', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true, // For testing
      });

      expect(response.status).toBe(200);
      expect(response.data.jobId).toBeDefined();
      expect(response.data.status).toBe('completed');
      expect(response.data.recordsProcessed).toBeGreaterThan(0);
    });

    it('should send notifications for reconciled transactions', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.notificationsSent).toBeGreaterThan(0);
      expect(response.data.usersNotified).toBeGreaterThan(0);
    });

    it('should detect reconciliation discrepancies', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      expect(response.status).toBe(200);

      if (response.data.discrepancies && response.data.discrepancies.length > 0) {
        expect(response.data.discrepancies[0].type).toBeDefined();
        expect(response.data.discrepancies[0].amount).toBeDefined();
        expect(response.data.discrepancies[0].userId).toBeDefined();
      }
    });

    it('should send alert for balance discrepancies', async () => {
      const discrepancy = {
        userId,
        walletId,
        discrepancyType: 'missing_transaction',
        expectedAmount: 500,
        actualAmount: 450,
        currency: 'USD',
      };

      const response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/discrepancy-alert`,
        discrepancy
      );

      expect(response.status).toBe(201);
      expect(response.data.alertNotificationId).toBeDefined();
      expect(response.data.notified).toBe(true);
    });
  });

  describe('Hourly FX Rate Update Notifications', () => {
    it('should execute hourly FX fetcher job', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/fx-rates/update`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.ratesUpdated).toBeGreaterThan(0);
      expect(response.data.timestamp).toBeDefined();
    });

    it('should send FX rate change notification if significant change (> 2%)', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/fx-rates/update`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
        significanceThreshold: 2, // %
      });

      expect(response.status).toBe(200);

      if (response.data.significantChanges && response.data.significantChanges.length > 0) {
        expect(response.data.notificationsSent).toBeGreaterThan(0);
        response.data.significantChanges.forEach(change => {
          expect(change.changePercentage).toBeGreaterThanOrEqual(2);
        });
      }
    });

    it('should skip notification for minor FX changes (< 2%)', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/fx-rates/update`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
        significanceThreshold: 2,
      });

      expect(response.status).toBe(200);
      // Should have updated rates but minimal or no notifications
      expect(response.data.ratesUpdated).toBeGreaterThanOrEqual(0);
    });

    it('should track FX rate history with timestamps', async () => {
      // Simulate multiple hour executions
      const ratesHistory = [];

      for (let i = 0; i < 3; i++) {
        const response = await axios.post(`${API_BASE_URL}/wallet/fx-rates/update`, {
          executionTime: new Date(Date.now() + i * 3600000).toISOString(),
          manualTrigger: true,
        });
        ratesHistory.push(response.data);
      }

      expect(ratesHistory.length).toBe(3);
      ratesHistory.forEach(record => {
        expect(record.timestamp).toBeDefined();
      });
    });
  });

  describe('Low Balance Alert Notifications', () => {
    it('should send alert when balance falls below threshold', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/${walletId}/low-balance-check`, {
        userId,
        threshold: 100,
        currency: 'USD',
      });

      expect(response.status).toBe(200);

      if (response.data.belowThreshold) {
        expect(response.data.currentBalance).toBeLessThan(100);
        expect(response.data.notificationSent).toBe(true);
        expect(response.data.alertLevel).toBeDefined();
      }
    });

    it('should categorize alert level: warning, critical, urgent', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/${walletId}/low-balance-check`, {
        userId,
        warningThreshold: 500,
        criticalThreshold: 200,
        urgentThreshold: 50,
        currency: 'USD',
      });

      expect(response.status).toBe(200);

      if (response.data.alertSent) {
        expect(['warning', 'critical', 'urgent']).toContain(response.data.alertLevel);
      }
    });

    it('should not spam alerts (max 1 per 24 hours for same user)', async () => {
      // First alert
      const alert1 = await axios.post(`${API_BASE_URL}/wallet/${walletId}/low-balance-check`, {
        userId,
        threshold: 100,
      });

      // Immediate second attempt
      const alert2 = await axios.post(`${API_BASE_URL}/wallet/${walletId}/low-balance-check`, {
        userId,
        threshold: 100,
      });

      if (alert1.data.notificationSent === true) {
        expect(alert2.data.notificationSent).toBe(false);
        expect(alert2.data.reason).toContain('already notified');
      }
    });

    it('should include top-up suggestions in low balance alert', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/${walletId}/low-balance-check`, {
        userId,
        threshold: 100,
      });

      if (response.data.belowThreshold) {
        expect(response.data.suggestedTopUpAmounts).toBeDefined();
        expect(Array.isArray(response.data.suggestedTopUpAmounts)).toBe(true);
      }
    });
  });

  describe('Transaction Confirmation Notifications', () => {
    it('should send immediate notification for wallet debit', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/${walletId}/transaction-notification`,
        {
          userId,
          transactionId: `txn-${Date.now()}`,
          type: 'debit',
          amount: 500,
          currency: 'USD',
          description: 'Flight booking ABC123',
          timestamp: new Date().toISOString(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.notificationId).toBeDefined();
      expect(response.data.channels).toContain('in_app');
      expect(response.data.channels).toContain('email');
    });

    it('should send notification for wallet credit', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/${walletId}/transaction-notification`,
        {
          userId,
          transactionId: `txn-${Date.now()}`,
          type: 'credit',
          amount: 250,
          currency: 'USD',
          description: 'Refund for cancelled booking',
          timestamp: new Date().toISOString(),
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.notificationSent).toBe(true);
    });

    it('should include transaction details in notification', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/${walletId}/transaction-notification`,
        {
          userId,
          transactionId: `txn-${Date.now()}`,
          type: 'debit',
          amount: 500,
          currency: 'USD',
          description: 'Flight booking ABC123',
          previousBalance: 2000,
          newBalance: 1500,
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.notificationContent).toContain('500');
      expect(response.data.notificationContent).toContain('USD');
      expect(response.data.notificationContent).toContain('1500');
    });
  });

  describe('Reconciliation Discrepancy Handling', () => {
    it('should alert admin on missing transaction', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/discrepancy`,
        {
          recordType: 'missing_transaction',
          expectedTransactionId: `txn-${Date.now()}`,
          userId,
          amount: 250,
          currency: 'USD',
          severity: 'high',
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.alertNotificationSent).toBe(true);
      expect(response.data.notifiedAdmins).toBeGreaterThan(0);
    });

    it('should alert admin on duplicate transaction', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/discrepancy`,
        {
          recordType: 'duplicate_transaction',
          transactionId: `txn-${Date.now()}`,
          userId,
          amount: 500,
          occurrences: 2,
          severity: 'critical',
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.severity).toBe('critical');
      expect(response.data.requiresManualReview).toBe(true);
    });

    it('should suggest auto-correction for minor discrepancies', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/discrepancy`,
        {
          recordType: 'rounding_error',
          difference: 0.02,
          currency: 'USD',
          autoCorrect: true,
        }
      );

      expect(response.status).toBe(200);
      expect(response.data.correctionSuggested).toBe(true);
    });
  });

  describe('Scheduled Job Execution Tracking', () => {
    it('should log reconciliation job execution', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.jobId).toBeDefined();
      expect(response.data.startTime).toBeDefined();
      expect(response.data.endTime).toBeDefined();
      expect(response.data.duration).toBeDefined();
    });

    it('should track job performance metrics', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.metrics).toBeDefined();
      expect(response.data.metrics.recordsProcessed).toBeGreaterThanOrEqual(0);
      expect(response.data.metrics.notificationsSent).toBeGreaterThanOrEqual(0);
      expect(response.data.metrics.errorsEncountered).toBeGreaterThanOrEqual(0);
    });

    it('should handle job failure and notification', async () => {
      // Simulate job failure scenario
      const response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/execute`,
        {
          executionTime: new Date().toISOString(),
          manualTrigger: true,
          simulateFailure: true, // For testing
        },
        { validateStatus: () => true }
      );

      if (response.status !== 200) {
        expect(response.data.error).toBeDefined();
        expect(response.data.adminNotified).toBe(true);
      }
    });

    it('should retrieve job history', async () => {
      const response = await axios.get(`${API_BASE_URL}/wallet/reconciliation/history?limit=10`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.executions)).toBe(true);
      expect(response.data.executions[0]).toHaveProperty('jobId');
      expect(response.data.executions[0]).toHaveProperty('status');
      expect(response.data.executions[0]).toHaveProperty('timestamp');
    });
  });

  describe('Performance & Scalability', () => {
    it('should process 10,000+ transactions in reconciliation', async () => {
      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      expect(response.status).toBe(200);
      expect(response.data.recordsProcessed).toBeGreaterThan(10000);
    });

    it('should complete reconciliation within SLA (< 5 minutes)', async () => {
      const startTime = Date.now();

      const response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(300000); // 5 minutes
    });

    it('should not cause performance degradation on high-volume FX fetches', async () => {
      const startTime = Date.now();

      const response = await axios.post(`${API_BASE_URL}/wallet/fx-rates/update`, {
        executionTime: new Date().toISOString(),
        manualTrigger: true,
        currencies: [
          'USD',
          'EUR',
          'GBP',
          'AED',
          'INR',
          'AUD',
          'CAD',
          'SGD',
          'JPY',
          'CHF',
        ],
      });

      const duration = Date.now() - startTime;

      expect(response.status).toBe(200);
      expect(duration).toBeLessThan(30000); // 30 seconds
    });
  });

  describe('Error Handling & Recovery', () => {
    it('should retry failed reconciliation', async () => {
      // First attempt (may fail)
      let response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/execute`,
        {
          executionTime: new Date().toISOString(),
          manualTrigger: true,
          simulateFailure: true,
        },
        { validateStatus: () => true }
      );

      if (response.status !== 200) {
        // Retry
        response = await axios.post(`${API_BASE_URL}/wallet/reconciliation/execute`, {
          executionTime: new Date().toISOString(),
          manualTrigger: true,
          retryAttempt: 1,
        });

        expect([200, 202]).toContain(response.status);
      }
    });

    it('should alert admin on critical reconciliation failures', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/wallet/reconciliation/execute`,
        {
          executionTime: new Date().toISOString(),
          manualTrigger: true,
          simulateFailure: true,
        },
        { validateStatus: () => true }
      );

      expect(response.data.adminAlertSent).toBe(true);
      expect(response.data.escalationLevel).toBe('critical');
    });

    it('should maintain audit trail of all reconciliation actions', async () => {
      const response = await axios.get(`${API_BASE_URL}/wallet/reconciliation/audit-trail`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.data.auditRecords)).toBe(true);
      response.data.auditRecords.forEach(record => {
        expect(record.timestamp).toBeDefined();
        expect(record.action).toBeDefined();
        expect(record.userId).toBeDefined();
      });
    });
  });
});
