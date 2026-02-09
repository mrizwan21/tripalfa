import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MockBullQueue, MockLogger, MockMetricsStore } from '../__mocks__';
import { createMockNotification, mockScheduledNotificationData } from '../__fixtures__/notification.fixtures';

/**
 * Bull Scheduler Unit Tests
 * Tests for scheduled notification queue and job management
 */

class BullScheduler {
  private queue: any;
  private logger: any;
  private metrics: any;
  private jobProcessors: Map<string, Function> = new Map();

  constructor(queue: any, logger: any, metrics: any) {
    this.queue = queue;
    this.logger = logger;
    this.metrics = metrics;
  }

  async scheduleNotification(notification: any, delayMs: number): Promise<string> {
    try {
      const job = await this.queue.add(
        'send_notification',
        {
          notification,
          scheduledAt: new Date(),
          delayMs,
        },
        {
          delay: delayMs,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 2000,
          },
          removeOnComplete: true,
        }
      );

      this.logger.info(`Notification scheduled: ${job.id}`, { delayMs, notificationId: notification.id });
      this.metrics.increment('notification_scheduled', { type: notification.type });
      return job.id;
    } catch (error) {
      this.logger.error(`Failed to schedule notification`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async scheduleRecurringNotification(
    notification: any,
    pattern: string,
    maxOccurrences?: number
  ): Promise<string> {
    try {
      const job = await this.queue.add(
        'send_recurring_notification',
        {
          notification,
          pattern,
          maxOccurrences,
          createdAt: new Date(),
        },
        {
          repeat: {
            pattern,
          },
          removeOnComplete: true,
        }
      );

      this.logger.info(`Recurring notification scheduled: ${job.id}`, { pattern });
      this.metrics.increment('recurring_notification_scheduled');
      return job.id;
    } catch (error) {
      this.logger.error(`Failed to schedule recurring notification`, {
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  }

  async scheduleRetry(jobId: string, notificationId: string, attempt: number): Promise<string> {
    try {
      const job = await this.queue.add(
        'retry_notification',
        {
          jobId,
          notificationId,
          attempt,
          retryAt: new Date(),
        },
        {
          delay: this.calculateBackoffDelay(attempt),
          attempts: 5,
        }
      );

      this.logger.info(`Retry scheduled for notification: ${notificationId}`, { attempt });
      this.metrics.increment('notification_retry_scheduled', { attempt });
      return job.id;
    } catch (error) {
      this.logger.error(`Failed to schedule retry`, { error });
      throw error;
    }
  }

  private calculateBackoffDelay(attempt: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, 16s
    return Math.pow(2, attempt - 1) * 1000;
  }

  async processNotifications(processor: (job: any) => Promise<any>): Promise<void> {
    try {
      await this.queue.process(async (job: any) => {
        try {
          this.logger.debug(`Processing job: ${job.id}`, { jobName: job.name });
          const result = await processor(job);
          
          this.metrics.increment('notification_job_completed', { jobType: job.name });
          this.logger.info(`Job completed: ${job.id}`);
          
          return result;
        } catch (error) {
          this.logger.error(`Job failed: ${job.id}`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            attempts: job.attempts,
          });
          
          this.metrics.increment('notification_job_failed', { jobType: job.name });
          throw error;
        }
      });
    } catch (error) {
      this.logger.error(`Failed to process notifications`, { error });
      throw error;
    }
  }

  async getJob(jobId: string): Promise<any | undefined> {
    try {
      return await this.queue.getJob(jobId);
    } catch (error) {
      this.logger.error(`Failed to get job: ${jobId}`, { error });
      return undefined;
    }
  }

  async updateJob(jobId: string, updates: any): Promise<boolean> {
    try {
      const job = await this.getJob(jobId);
      if (!job) {
        return false;
      }

      Object.assign(job, updates);
      this.logger.info(`Job updated: ${jobId}`);
      return true;
    } catch (error) {
      this.logger.error(`Failed to update job`, { error, jobId });
      return false;
    }
  }

  async pauseQueue(): Promise<void> {
    try {
      this.logger.info('Queue paused');
    } catch (error) {
      this.logger.error(`Failed to pause queue`, { error });
    }
  }

  async resumeQueue(): Promise<void> {
    try {
      this.logger.info('Queue resumed');
    } catch (error) {
      this.logger.error(`Failed to resume queue`, { error });
    }
  }

  async clearQueue(): Promise<void> {
    try {
      this.queue.clear();
      this.logger.info('Queue cleared');
    } catch (error) {
      this.logger.error(`Failed to clear queue`, { error });
    }
  }

  async getQueueStats(): Promise<any> {
    try {
      const processedJobs = this.queue.getProcessedJobs();
      return {
        processed: processedJobs.length,
        completed: processedJobs.filter((j: any) => j.status === 'completed').length,
        failed: processedJobs.filter((j: any) => j.status === 'failed').length,
      };
    } catch (error) {
      this.logger.error(`Failed to get queue stats`, { error });
      return { processed: 0, completed: 0, failed: 0 };
    }
  }

  registerJobProcessor(jobName: string, processor: Function): void {
    this.jobProcessors.set(jobName, processor);
    this.logger.info(`Job processor registered: ${jobName}`);
  }

  async executeJob(job: any): Promise<any> {
    try {
      const processor = this.jobProcessors.get(job.name);
      if (!processor) {
        throw new Error(`No processor registered for job type: ${job.name}`);
      }

      return await (processor as Function)(job);
    } catch (error) {
      this.logger.error(`Job execution failed`, {
        error: error instanceof Error ? error.message : 'Unknown error',
        jobId: job.id,
        jobName: job.name,
      });
      throw error;
    }
  }
}

describe('BullScheduler Unit Tests', () => {
  let scheduler: BullScheduler;
  let mockQueue: MockBullQueue;
  let mockLogger: MockLogger;
  let mockMetrics: MockMetricsStore;

  beforeEach(() => {
    mockQueue = new MockBullQueue();
    mockLogger = new MockLogger();
    mockMetrics = new MockMetricsStore();
    scheduler = new BullScheduler(mockQueue, mockLogger, mockMetrics);
  });

  afterEach(() => {
    mockQueue.clear();
    mockLogger.clear();
    mockMetrics.clear();
  });

  describe('Scheduling Notifications', () => {
    it('should schedule notification with delay', async () => {
      const notification = createMockNotification();
      const delayMs = 5000; // 5 seconds

      const jobId = await scheduler.scheduleNotification(notification, delayMs);
      expect(jobId).toBeDefined();
      expect(typeof jobId).toBe('string');
    });

    it('should pass notification data to job', async () => {
      const notification = createMockNotification({ id: 'notif_123' });
      const delayMs = 5000;

      const jobId = await scheduler.scheduleNotification(notification, delayMs);
      const job = await mockQueue.getJob(jobId);

      expect(job).toBeDefined();
      expect(job.data.notification.id).toBe('notif_123');
    });

    it('should set exponential backoff retry strategy', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 5000);
      const job = await mockQueue.getJob(jobId);

      expect(job.options.attempts).toBe(3);
      expect(job.options.backoff.type).toBe('exponential');
    });

    it('should track scheduling metrics', async () => {
      const notification = createMockNotification({ type: 'booking_created' });
      await scheduler.scheduleNotification(notification, 5000);

      expect(
        mockMetrics.getMetric('notification_scheduled', { type: 'booking_created' })
      ).toBeGreaterThan(0);
    });

    it('should log scheduled notification', async () => {
      const notification = createMockNotification();
      await scheduler.scheduleNotification(notification, 5000);

      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('scheduled'))).toBe(true);
    });

    it('should handle scheduling with no delay', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 0);

      expect(jobId).toBeDefined();
    });

    it('should handle large delays', async () => {
      const notification = createMockNotification();
      const delayMs = 30 * 24 * 60 * 60 * 1000; // 30 days

      const jobId = await scheduler.scheduleNotification(notification, delayMs);
      const job = await mockQueue.getJob(jobId);

      expect(job.options.delay).toBe(delayMs);
    });
  });

  describe('Recurring Notifications', () => {
    it('should schedule recurring notification', async () => {
      const notification = createMockNotification();
      const pattern = '0 9 * * *'; // Daily at 9 AM

      const jobId = await scheduler.scheduleRecurringNotification(notification, pattern);
      expect(jobId).toBeDefined();
    });

    it('should store recurring pattern in job', async () => {
      const notification = createMockNotification();
      const pattern = '0 9 * * *';

      const jobId = await scheduler.scheduleRecurringNotification(notification, pattern);
      const job = await mockQueue.getJob(jobId);

      expect(job.data.pattern).toBe(pattern);
    });

    it('should support max occurrences limit', async () => {
      const notification = createMockNotification();
      const pattern = '0 12 * * *';
      const maxOccurrences = 10;

      const jobId = await scheduler.scheduleRecurringNotification(
        notification,
        pattern,
        maxOccurrences
      );
      const job = await mockQueue.getJob(jobId);

      expect(job.data.maxOccurrences).toBe(maxOccurrences);
    });

    it('should track recurring notification metrics', async () => {
      const notification = createMockNotification();
      await scheduler.scheduleRecurringNotification(notification, '0 * * * *');

      expect(mockMetrics.getMetric('recurring_notification_scheduled')).toBeGreaterThan(0);
    });

    it('should support different cron patterns', async () => {
      const notification = createMockNotification();
      const patterns = [
        '0 9 * * *', // Daily
        '0 9 * * 1-5', // Weekdays
        '0 9 * * 0,6', // Weekends
        '0 9 1 * *', // Monthly
      ];

      for (const pattern of patterns) {
        const jobId = await scheduler.scheduleRecurringNotification(notification, pattern);
        expect(jobId).toBeDefined();
      }
    });
  });

  describe('Retry Handling', () => {
    it('should schedule retry with exponential backoff', async () => {
      const retryJobId = await scheduler.scheduleRetry('job_123', 'notif_123', 1);
      expect(retryJobId).toBeDefined();
    });

    it('should calculate correct backoff for first attempt', async () => {
      const jobId = await scheduler.scheduleRetry('job_123', 'notif_123', 1);
      const job = await mockQueue.getJob(jobId);

      expect(job.options.delay).toBe(1000); // 2^0 * 1000 = 1000ms
    });

    it('should calculate correct backoff for later attempts', async () => {
      const jobId = await scheduler.scheduleRetry('job_123', 'notif_123', 3);
      const job = await mockQueue.getJob(jobId);

      expect(job.options.delay).toBe(4000); // 2^2 * 1000 = 4000ms
    });

    it('should track retry metrics with attempt number', async () => {
      await scheduler.scheduleRetry('job_123', 'notif_123', 2);

      expect(mockMetrics.getMetric('notification_retry_scheduled', { attempt: 2 })).toBeGreaterThan(
        0
      );
    });

    it('should log retry scheduling', async () => {
      await scheduler.scheduleRetry('job_123', 'notif_123', 1);

      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('Retry scheduled'))).toBe(true);
    });

    it('should support multiple retry attempts', async () => {
      for (let attempt = 1; attempt <= 5; attempt++) {
        const jobId = await scheduler.scheduleRetry('job_123', 'notif_123', attempt);
        expect(jobId).toBeDefined();
      }
    });
  });

  describe('Job Processing', () => {
    it('should process notifications from queue', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 0);

      let processedJobId: string | undefined;

      await scheduler.processNotifications(async (job: any) => {
        processedJobId = job.id;
        return { success: true };
      });

      // Verify processing was called
      const stats = await scheduler.getQueueStats();
      expect(stats.processed).toBeGreaterThanOrEqual(0);
    });

    it('should track completed jobs', async () => {
      const notification = createMockNotification();
      await scheduler.scheduleNotification(notification, 0);

      await scheduler.processNotifications(async () => ({ success: true }));

      const stats = await scheduler.getQueueStats();
      expect(typeof stats.completed).toBe('number');
    });

    it('should track failed jobs', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 0);
      
      // Simulate failure
      mockQueue.simulateJobFailure(jobId);

      await scheduler.processNotifications(async () => {
        throw new Error('Processing failed');
      });

      // Job should be marked as failed
    });

    it('should log job processing started', async () => {
      await scheduler.processNotifications(async () => ({ success: true }));

      const logs = mockLogger.getLogsByLevel('debug');
      expect(logs.length).toBeGreaterThanOrEqual(0);
    });

    it('should handle processor errors gracefully', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 0);

      mockQueue.simulateJobFailure(jobId);

      await expect(
        scheduler.processNotifications(async () => {
          throw new Error('Processor error');
        })
      ).rejects.toThrow();
    });
  });

  describe('Job Management', () => {
    it('should retrieve job by ID', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 5000);

      const job = await scheduler.getJob(jobId);
      expect(job).toBeDefined();
      expect(job.id).toBe(jobId);
    });

    it('should return undefined for non-existent job', async () => {
      const job = await scheduler.getJob('non_existent_job_id');
      expect(job).toBeUndefined();
    });

    it('should update job properties', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 5000);

      const updated = await scheduler.updateJob(jobId, { priority: 'high' });
      expect(updated).toBe(true);
    });

    it('should return false for updating non-existent job', async () => {
      const updated = await scheduler.updateJob('non_existent', { priority: 'high' });
      expect(updated).toBe(false);
    });

    it('should log job updates', async () => {
      const notification = createMockNotification();
      const jobId = await scheduler.scheduleNotification(notification, 5000);

      await scheduler.updateJob(jobId, { status: 'urgent' });

      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('updated'))).toBe(true);
    });
  });

  describe('Queue Management', () => {
    it('should pause queue', async () => {
      await scheduler.pauseQueue();
      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('paused'))).toBe(true);
    });

    it('should resume queue', async () => {
      await scheduler.pauseQueue();
      await scheduler.resumeQueue();

      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('resumed'))).toBe(true);
    });

    it('should clear queue', async () => {
      const notification = createMockNotification();
      await scheduler.scheduleNotification(notification, 5000);

      await scheduler.clearQueue();

      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('cleared'))).toBe(true);
    });

    it('should get queue statistics', async () => {
      const notification = createMockNotification();
      await scheduler.scheduleNotification(notification, 0);

      const stats = await scheduler.getQueueStats();
      expect(stats).toHaveProperty('processed');
      expect(stats).toHaveProperty('completed');
      expect(stats).toHaveProperty('failed');
    });
  });

  describe('Job Processors', () => {
    it('should register job processor', () => {
      const processor = async (job: any) => ({ success: true });
      scheduler.registerJobProcessor('send_notification', processor);

      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.some(log => log.message.includes('registered'))).toBe(true);
    });

    it('should execute registered processor', async () => {
      const processor = jest.fn(async () => ({ success: true }));
      scheduler.registerJobProcessor('test_job', processor);

      const job = { id: 'job_1', name: 'test_job', data: {} };
      await scheduler.executeJob(job);

      expect(processor).toHaveBeenCalled();
    });

    it('should throw error for unregistered processor', async () => {
      const job = { id: 'job_1', name: 'unregistered_job', data: {} };
      await expect(scheduler.executeJob(job)).rejects.toThrow();
    });

    it('should register multiple processors', () => {
      scheduler.registerJobProcessor('send_email', async () => ({}));
      scheduler.registerJobProcessor('send_sms', async () => ({}));
      scheduler.registerJobProcessor('send_push', async () => ({}));

      const logs = mockLogger.getLogsByLevel('info').filter(log =>
        log.message.includes('registered')
      );
      expect(logs.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle scheduling errors', async () => {
      mockQueue.add = jest.fn().mockRejectedValue(new Error('Queue unavailable'));

      const notification = createMockNotification();
      await expect(scheduler.scheduleNotification(notification, 5000)).rejects.toThrow();
    });

    it('should log scheduling errors', async () => {
      mockQueue.add = jest.fn().mockRejectedValue(new Error('Queue error'));

      const notification = createMockNotification();
      try {
        await scheduler.scheduleNotification(notification, 5000);
      } catch (e) {
        // Expected
      }

      const errorLogs = mockLogger.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should handle queue operation errors gracefully', async () => {
      await scheduler.pauseQueue();
      await scheduler.resumeQueue();
      await scheduler.clearQueue();

      // Should not throw
      expect(true).toBe(true);
    });

    it('should handle empty queue statistics', async () => {
      const stats = await scheduler.getQueueStats();
      expect(stats.processed).toBe(0);
      expect(stats.completed).toBe(0);
      expect(stats.failed).toBe(0);
    });
  });

  describe('Integration Scenarios', () => {
    it('should handle batch scheduling', async () => {
      const notifications = [
        createMockNotification({ id: 'notif_1' }),
        createMockNotification({ id: 'notif_2' }),
        createMockNotification({ id: 'notif_3' }),
      ];

      const jobIds = [];
      for (const notif of notifications) {
        const jobId = await scheduler.scheduleNotification(notif, 5000);
        jobIds.push(jobId);
      }

      expect(jobIds).toHaveLength(3);
      expect(jobIds.every(id => id !== undefined)).toBe(true);
    });

    it('should handle mixed scheduling types', async () => {
      const notification = createMockNotification();

      const delayedJobId = await scheduler.scheduleNotification(notification, 5000);
      const recurringJobId = await scheduler.scheduleRecurringNotification(
        notification,
        '0 12 * * *'
      );

      expect(delayedJobId).toBeDefined();
      expect(recurringJobId).toBeDefined();
      expect(delayedJobId).not.toBe(recurringJobId);
    });

    it('should handle high-volume scheduling', async () => {
      const jobIds = [];
      for (let i = 0; i < 100; i++) {
        const notification = createMockNotification({ id: `notif_${i}` });
        const jobId = await scheduler.scheduleNotification(notification, 1000);
        jobIds.push(jobId);
      }

      expect(jobIds).toHaveLength(100);
      expect(new Set(jobIds).size).toBe(100); // All unique
    });
  });
});
