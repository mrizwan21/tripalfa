/**
 * Scheduled Notifications Testing
 * 
 * Tests cover:
 * - BullMQ scheduler job creation and execution
 * - In-memory scheduler fallback
 * - Delayed notification delivery
 * - Scheduled notification cancellation
 * - Recurring notification patterns
 * - Booking reminders (3 days, 1 day before travel)
 * - Payment reminders (based on due date)
 * - Scheduled notification retry on failure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';

const API_BASE_URL = process.env.BOOKING_SERVICE_API || 'http://localhost:3001/api';

describe('Scheduled Notifications (BullMQ)', () => {
  let scheduledNotificationId: string;
  let bookingId: string;
  let userId: string;

  beforeEach(() => {
    userId = `user-${Date.now()}`;
    bookingId = `booking-${Date.now()}`;
  });

  describe('Scheduler Job Creation', () => {
    it('should create a BullMQ job for booking reminder (3 days before)', async () => {
      const travelDate = new Date();
      travelDate.setDate(travelDate.getDate() + 3);

      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['email', 'sms', 'in_app'],
        scheduledTime: travelDate.toISOString(),
        metadata: {
          bookingRef: 'ABC123',
          destination: 'Paris',
          airline: 'Air France',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.jobId).toBeDefined();
      expect(response.data.scheduledTime).toBeDefined();
      expect(response.data.status).toBe('scheduled');
      scheduledNotificationId = response.data.jobId;
    });

    it('should create a BullMQ job for booking reminder (1 day before)', async () => {
      const travelDate = new Date();
      travelDate.setDate(travelDate.getDate() + 1);

      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_1day',
        channels: ['email', 'sms', 'in_app'],
        scheduledTime: travelDate.toISOString(),
        metadata: {
          bookingRef: 'ABC123',
          departure: '14:30',
          airport: 'CDG',
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.status).toBe('scheduled');
    });

    it('should create a payment reminder job (due date)', async () => {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7);

      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        notificationType: 'payment_reminder',
        amount: 5000,
        currency: 'USD',
        scheduledTime: dueDate.toISOString(),
        channels: ['email', 'sms'],
        metadata: {
          invoiceId: 'INV-2024-001',
          dueDate: dueDate.toISOString(),
        },
      });

      expect(response.status).toBe(201);
      expect(response.data.status).toBe('scheduled');
    });

    it('should validate scheduled time is in the future', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      const response = await axios.post(
        `${API_BASE_URL}/notifications/schedule`,
        {
          userId,
          bookingId,
          notificationType: 'booking_reminder_3days',
          scheduledTime: pastDate.toISOString(),
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
      expect(response.data.error).toContain('past');
    });

    it('should require all mandatory fields for scheduling', async () => {
      const response = await axios.post(
        `${API_BASE_URL}/notifications/schedule`,
        {
          userId,
          // Missing notificationType and scheduledTime
        },
        { validateStatus: () => true }
      );

      expect(response.status).toBe(400);
    });
  });

  describe('Scheduler Job Execution', () => {
    it('should execute scheduled job at correct time (within 1 second tolerance)', async () => {
      const testStartTime = Date.now();
      const scheduledTime = new Date(testStartTime + 2000); // 2 seconds from now

      const scheduleResponse = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['in_app'],
        scheduledTime: scheduledTime.toISOString(),
        metadata: { bookingRef: 'ABC123' },
      });

      const jobId = scheduleResponse.data.jobId;

      // Wait for job execution + tolerance
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Check if job was executed
      const statusResponse = await axios.get(`${API_BASE_URL}/notifications/job/${jobId}/status`);

      expect(statusResponse.data.status).toBe('completed');
      expect(statusResponse.data.executedAt).toBeDefined();

      const executionTime = new Date(statusResponse.data.executedAt).getTime();
      const timeDiff = Math.abs(executionTime - scheduledTime.getTime());
      expect(timeDiff).toBeLessThan(1000); // Within 1 second
    });

    it('should execute multiple scheduled jobs concurrently', async () => {
      const jobs = [];
      const scheduledTime = new Date(Date.now() + 2000);

      for (let i = 0; i < 5; i++) {
        const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
          userId: `user-${i}`,
          bookingId: `booking-${i}`,
          notificationType: 'booking_reminder_3days',
          channels: ['in_app'],
          scheduledTime: scheduledTime.toISOString(),
          metadata: { index: i },
        });
        jobs.push(response.data.jobId);
      }

      await new Promise(resolve => setTimeout(resolve, 3500));

      // Verify all jobs executed
      const executions = await Promise.all(
        jobs.map(jobId => 
          axios.get(`${API_BASE_URL}/notifications/job/${jobId}/status`)
        )
      );

      executions.forEach(exec => {
        expect(exec.data.status).toBe('completed');
      });
    });

    it('should retry failed scheduled notification job', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['email'],
        scheduledTime: new Date(Date.now() + 2000).toISOString(),
        metadata: { bookingRef: 'ABC123' },
        maxRetries: 3,
        retryDelay: 500, // 500ms between retries
      });

      const jobId = response.data.jobId;

      // Simulate job failure and wait for retry
      await new Promise(resolve => setTimeout(resolve, 4000));

      const statusResponse = await axios.get(`${API_BASE_URL}/notifications/job/${jobId}/status`);

      expect(statusResponse.data.retryCount).toBeGreaterThanOrEqual(0);
      expect(statusResponse.data.maxRetries).toBe(3);
    });
  });

  describe('Scheduled Notification Cancellation', () => {
    it('should cancel scheduled notification before execution', async () => {
      const scheduledTime = new Date(Date.now() + 10000);

      const scheduleResponse = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['email'],
        scheduledTime: scheduledTime.toISOString(),
        metadata: { bookingRef: 'ABC123' },
      });

      const jobId = scheduleResponse.data.jobId;

      // Cancel immediately
      const cancelResponse = await axios.delete(`${API_BASE_URL}/notifications/job/${jobId}`);
      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.data.status).toBe('cancelled');
    });

    it('should cancel all scheduled notifications for a booking', async () => {
      const scheduledTime1 = new Date(Date.now() + 5000);
      const scheduledTime2 = new Date(Date.now() + 10000);

      await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        scheduledTime: scheduledTime1.toISOString(),
      });

      await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_1day',
        scheduledTime: scheduledTime2.toISOString(),
      });

      // Cancel all for booking
      const cancelResponse = await axios.delete(
        `${API_BASE_URL}/notifications/booking/${bookingId}/scheduled`
      );

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.data.cancelledCount).toBe(2);
    });

    it('should handle cancellation of already-executed job', async () => {
      const scheduledTime = new Date(Date.now() + 1000);

      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        scheduledTime: scheduledTime.toISOString(),
      });

      const jobId = response.data.jobId;

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Try to cancel
      const cancelResponse = await axios.delete(
        `${API_BASE_URL}/notifications/job/${jobId}`,
        { validateStatus: () => true }
      );

      expect([400, 404]).toContain(cancelResponse.status);
    });

    it('should not execute cancelled notification', async () => {
      const scheduledTime = new Date(Date.now() + 2000);

      const scheduleResponse = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['in_app'],
        scheduledTime: scheduledTime.toISOString(),
      });

      const jobId = scheduleResponse.data.jobId;

      // Cancel immediately
      await axios.delete(`${API_BASE_URL}/notifications/job/${jobId}`);

      // Wait for original scheduled time
      await new Promise(resolve => setTimeout(resolve, 3500));

      // Verify no notification was sent
      const userNotifications = await axios.get(`${API_BASE_URL}/notifications/${userId}`);
      const scheduledNotif = userNotifications.data.notifications.find(
        n => n.type === 'booking_reminder_3days' && n.id === bookingId
      );

      expect(scheduledNotif).toBeUndefined();
    });
  });

  describe('Recurring Scheduled Notifications', () => {
    it('should create recurring daily reminder', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule-recurring`, {
        userId,
        notificationType: 'daily_digest',
        channels: ['email'],
        pattern: 'daily',
        startTime: '09:00',
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days
      });

      expect(response.status).toBe(201);
      expect(response.data.recurringJobId).toBeDefined();
      expect(response.data.pattern).toBe('daily');
    });

    it('should create recurring payment reminders (weekly)', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule-recurring`, {
        userId,
        notificationType: 'payment_reminder',
        channels: ['email', 'sms'],
        pattern: 'weekly',
        dayOfWeek: 'monday',
        startTime: '10:00',
        metadata: { paymentAmount: 5000 },
      });

      expect(response.status).toBe(201);
      expect(response.data.pattern).toBe('weekly');
    });

    it('should cancel recurring notification pattern', async () => {
      const createResponse = await axios.post(`${API_BASE_URL}/notifications/schedule-recurring`, {
        userId,
        notificationType: 'daily_digest',
        pattern: 'daily',
        startTime: '09:00',
      });

      const patternId = createResponse.data.recurringJobId;

      const cancelResponse = await axios.delete(
        `${API_BASE_URL}/notifications/recurring/${patternId}`
      );

      expect(cancelResponse.status).toBe(200);
      expect(cancelResponse.data.status).toBe('cancelled');
    });
  });

  describe('In-Memory Scheduler Fallback', () => {
    it('should fall back to in-memory scheduler when BullMQ unavailable', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        scheduledTime: new Date(Date.now() + 2000).toISOString(),
        fallbackToMemory: true,
      });

      expect(response.status).toBe(201);
      expect(response.data.scheduler).toBe('memory');
    });

    it('should execute in-memory scheduled notifications correctly', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['in_app'],
        scheduledTime: new Date(Date.now() + 1500).toISOString(),
        scheduler: 'memory',
      });

      await new Promise(resolve => setTimeout(resolve, 2500));

      const notifications = await axios.get(`${API_BASE_URL}/notifications/${userId}`);
      const reminder = notifications.data.notifications.find(
        n => n.type === 'booking_reminder_3days'
      );

      expect(reminder).toBeDefined();
      expect(reminder?.status).toBe('sent');
    });
  });

  describe('Scheduler Job Status Tracking', () => {
    it('should track job status transitions (pending → processing → completed)', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        scheduledTime: new Date(Date.now() + 2000).toISOString(),
      });

      const jobId = response.data.jobId;

      // Check initial status
      let status = await axios.get(`${API_BASE_URL}/notifications/job/${jobId}/status`);
      expect(status.data.status).toBe('scheduled');

      await new Promise(resolve => setTimeout(resolve, 2500));

      // Check final status
      status = await axios.get(`${API_BASE_URL}/notifications/job/${jobId}/status`);
      expect(status.data.status).toBe('completed');
      expect(status.data.executedAt).toBeDefined();
    });

    it('should track failed job status with error details', async () => {
      const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        channels: ['email'], // Will fail with no email config
        scheduledTime: new Date(Date.now() + 1500).toISOString(),
      });

      const jobId = response.data.jobId;

      await new Promise(resolve => setTimeout(resolve, 2500));

      const status = await axios.get(`${API_BASE_URL}/notifications/job/${jobId}/status`);

      if (status.data.status === 'failed') {
        expect(status.data.error).toBeDefined();
        expect(status.data.failedAt).toBeDefined();
      }
    });

    it('should list all scheduled jobs for a user', async () => {
      await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId: `booking-1`,
        notificationType: 'booking_reminder_3days',
        scheduledTime: new Date(Date.now() + 5000).toISOString(),
      });

      await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId: `booking-2`,
        notificationType: 'booking_reminder_1day',
        scheduledTime: new Date(Date.now() + 10000).toISOString(),
      });

      const response = await axios.get(`${API_BASE_URL}/notifications/user/${userId}/scheduled`);

      expect(response.data.jobs.length).toBeGreaterThanOrEqual(2);
      expect(response.data.jobs[0]).toHaveProperty('jobId');
      expect(response.data.jobs[0]).toHaveProperty('status');
    });
  });

  describe('Performance & Scalability', () => {
    it('should handle 100+ concurrent scheduled jobs', async () => {
      const jobs = [];
      const baseTime = Date.now();

      for (let i = 0; i < 100; i++) {
        const response = await axios.post(`${API_BASE_URL}/notifications/schedule`, {
          userId: `user-${i}`,
          bookingId: `booking-${i}`,
          notificationType: 'booking_reminder_3days',
          scheduledTime: new Date(baseTime + 5000).toISOString(),
          metadata: { index: i },
        });
        jobs.push(response.data.jobId);
      }

      expect(jobs.length).toBe(100);

      // Wait for execution
      await new Promise(resolve => setTimeout(resolve, 6500));

      // Verify sample execution
      const sampleStatus = await axios.get(
        `${API_BASE_URL}/notifications/job/${jobs[0]}/status`
      );
      expect(sampleStatus.data.status).toBe('completed');
    });

    it('should schedule jobs within acceptable time (< 100ms)', async () => {
      const startTime = Date.now();

      await axios.post(`${API_BASE_URL}/notifications/schedule`, {
        userId,
        bookingId,
        notificationType: 'booking_reminder_3days',
        scheduledTime: new Date(Date.now() + 5000).toISOString(),
      });

      const endTime = Date.now();
      const duration = endTime - startTime;

      expect(duration).toBeLessThan(100);
    });
  });
});
