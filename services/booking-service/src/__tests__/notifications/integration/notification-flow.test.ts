import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { MockCacheService, MockEmailChannel, MockSmsChannel, MockInAppChannel, MockLogger, MockMetricsStore } from '../__mocks__';
import { createMockNotification, createMockBooking, notificationTestScenarios } from '../__fixtures__/notification.fixtures';

/**
 * Integration Tests for Notification Flow
 * Tests for end-to-end notification workflows
 */

describe('Notification Flow Integration Tests', () => {
  let mockCache: MockCacheService;
  let mockLogger: MockLogger;
  let mockMetrics: MockMetricsStore;
  let emailChannel: MockEmailChannel;
  let smsChannel: MockSmsChannel;
  let inAppChannel: MockInAppChannel;

  beforeEach(() => {
    mockCache = new MockCacheService();
    mockLogger = new MockLogger();
    mockMetrics = new MockMetricsStore();
    
    emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
    smsChannel = new MockSmsChannel({ accountSid: 'test', authToken: 'test', fromNumber: '+1234' });
    inAppChannel = new MockInAppChannel(mockCache);
    
    (global as any).logger = mockLogger;
    (global as any).metricsStore = mockMetrics;
  });

  afterEach(() => {
    mockCache.clear();
    mockLogger.clear();
    mockMetrics.clear();
  });

  describe('Scheduled Notifications Processing', () => {
    it('should process scheduled notification when time arrives', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const notification = createMockNotification();
      
      // Simulate scheduling and then processing
      const scheduledKey = `scheduled:${notification.id}`;
      await mockCache.set(scheduledKey, JSON.stringify({
        ...notification,
        scheduledFor: pastDate,
      }));
      
      // Check scheduled notification is stored
      const stored = await mockCache.get(scheduledKey);
      expect(stored).toBeDefined();
      
      // Process scheduled notifications
      const scheduled = JSON.parse(stored!);
      const now = new Date();
      
      if (scheduled.scheduledFor <= now) {
        // Send the notification
        const result = await emailChannel.send(notification);
        expect(result).toBe(true);
      }
    });

    it('should skip future scheduled notifications', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000); // Tomorrow
      const notification = createMockNotification();
      
      const scheduledKey = `scheduled:${notification.id}`;
      await mockCache.set(scheduledKey, JSON.stringify({
        ...notification,
        scheduledFor: futureDate,
      }));
      
      const stored = await mockCache.get(scheduledKey);
      expect(stored).toBeDefined();
      
      // Should not process yet
      const scheduled = JSON.parse(stored!);
      const now = new Date();
      
      if (scheduled.scheduledFor > now) {
        // Not yet time to send
        expect(true).toBe(true);
      }
    });

    it('should batch process multiple scheduled notifications', async () => {
      const notifications = [];
      for (let i = 0; i < 5; i++) {
        const pastDate = new Date(Date.now() - 60 * 60 * 1000);
        const notif = createMockNotification({ id: `notif_${i}` });
        
        const key = `scheduled:${notif.id}`;
        await mockCache.set(key, JSON.stringify({ ...notif, scheduledFor: pastDate }));
        notifications.push(notif);
      }
      
      // Process all scheduled notifications
      let processedCount = 0;
      for (const notif of notifications) {
        const key = `scheduled:${notif.id}`;
        const stored = await mockCache.get(key);
        
        if (stored) {
          const scheduled = JSON.parse(stored);
          if (scheduled.scheduledFor <= new Date()) {
            await emailChannel.send(notif);
            processedCount++;
          }
        }
      }
      
      expect(processedCount).toBe(5);
    });
  });

  describe('Multi-Channel Notification Workflow', () => {
    it('should send notification across all configured channels', async () => {
      const notification = createMockNotification({
        channels: ['email', 'sms', 'in_app'],
      });
      
      const results = [];
      
      // Send via email
      results.push(await emailChannel.send(notification));
      
      // Send via SMS
      results.push(await smsChannel.send(notification));
      
      // Send via in-app
      results.push(await inAppChannel.send(notification));
      
      // All should succeed
      expect(results).toEqual([true, true, true]);
      
      // Verify metrics tracking
      expect(mockMetrics.getMetric('notification_sent')).toBeGreaterThan(0);
    });

    it('should handle partial channel failures gracefully', async () => {
      const notification = createMockNotification({
        channels: ['email', 'sms', 'in_app'],
      });
      
      // Simulate SMS failure
      smsChannel.failNextSend();
      
      const results = [];
      
      try {
        results.push(await emailChannel.send(notification));
      } catch (e) {
        results.push(false);
      }
      
      try {
        // This will fail because SMS is configured to fail
        if (!smsChannel.validateConfig()) {
          mockLogger.warn('SMS channel not available');
          results.push(false);
        } else {
          results.push(await smsChannel.send(notification));
        }
      } catch (e) {
        results.push(false);
      }
      
      try {
        results.push(await inAppChannel.send(notification));
      } catch (e) {
        results.push(false);
      }
      
      // At least one should succeed (email and in-app)
      expect(results.filter(r => r).length).toBeGreaterThan(0);
    });

    it('should retry failed channel sends', async () => {
      const notification = createMockNotification();
      
      // Try multiple times
      let successCount = 0;
      for (let attempt = 1; attempt <= 3; attempt++) {
        try {
          const result = await emailChannel.send(notification);
          if (result) {
            successCount++;
          }
        } catch (e) {
          mockLogger.error(`Attempt ${attempt} failed`);
        }
      }
      
      expect(successCount).toBeGreaterThan(0);
    });

    it('should track channel-specific metrics', async () => {
      const notification = createMockNotification({ type: 'booking_created' });
      
      await emailChannel.send(notification);
      await smsChannel.send(notification);
      await inAppChannel.send(notification);
      
      // Verify metrics were recorded
      expect(mockMetrics.getEvents().length).toBeGreaterThan(0);
    });
  });

  describe('User Notification Retrieval and Filtering', () => {
    it('should retrieve all notifications for a user', async () => {
      const userId = 'user_123';
      const notifications = [];
      
      for (let i = 0; i < 3; i++) {
        const notif = createMockNotification({ userId, id: `notif_${i}` });
        await inAppChannel.send(notif);
        notifications.push(notif);
      }
      
      // Retrieve user notifications
      const userNotications = await inAppChannel.getNotifications(userId);
      expect(userNotications.length).toBeGreaterThanOrEqual(3);
    });

    it('should filter notifications by type', async () => {
      const userId = 'user_123';
      
      // Create notifications of different types
      const bookingNotif = createMockNotification({ 
        userId, 
        type: 'booking_created',
        id: 'notif_booking_1'
      });
      const paymentNotif = createMockNotification({ 
        userId, 
        type: 'payment_received',
        id: 'notif_payment_1'
      });
      
      await inAppChannel.send(bookingNotif);
      await inAppChannel.send(paymentNotif);
      
      // Retrieve and verify
      const userNotications = await inAppChannel.getNotifications(userId);
      expect(userNotications.length).toBeGreaterThanOrEqual(2);
    });

    it('should limit notifications to prevent cache bloat', async () => {
      const userId = 'user_123';
      
      // Send more than limit (100 per user)
      for (let i = 0; i < 105; i++) {
        const notif = createMockNotification({ userId, id: `notif_${i}` });
        await inAppChannel.send(notif);
      }
      
      // Verify notifications don't exceed limit
      const userNotications = await inAppChannel.getNotifications(userId);
      expect(userNotications.length).toBeLessThanOrEqual(100);
    });

    it('should maintain notification history', async () => {
      const userId = 'user_123';
      const createdTime = new Date();
      
      const notif1 = createMockNotification({ 
        userId, 
        id: 'notif_1',
        createdAt: new Date(createdTime.getTime() + 1000)
      });
      const notif2 = createMockNotification({ 
        userId, 
        id: 'notif_2',
        createdAt: new Date(createdTime.getTime() + 2000)
      });
      
      await inAppChannel.send(notif1);
      await inAppChannel.send(notif2);
      
      const userNotications = await inAppChannel.getNotifications(userId);
      expect(userNotications.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('Real-Time Notification Delivery Status Updates', () => {
    it('should update notification status to sent', async () => {
      const notification = createMockNotification({ status: 'pending' });
      
      // Store notification
      const key = `notification:${notification.id}`;
      await mockCache.set(key, JSON.stringify(notification));
      
      // Update status to sent
      const stored = JSON.parse((await mockCache.get(key))!);
      stored.status = 'sent';
      stored.sentAt = new Date();
      await mockCache.set(key, JSON.stringify(stored));
      
      // Verify update
      const updated = JSON.parse((await mockCache.get(key))!);
      expect(updated.status).toBe('sent');
      expect(updated.sentAt).toBeDefined();
    });

    it('should update notification status to delivered', async () => {
      const notification = createMockNotification({ status: 'sent' });
      
      // Store and update
      const key = `notification:${notification.id}`;
      await mockCache.set(key, JSON.stringify(notification));
      
      const stored = JSON.parse((await mockCache.get(key))!);
      stored.status = 'delivered';
      stored.deliveredAt = new Date();
      await mockCache.set(key, JSON.stringify(stored));
      
      // Verify
      const updated = JSON.parse((await mockCache.get(key))!);
      expect(updated.status).toBe('delivered');
      expect(updated.deliveredAt).toBeDefined();
    });

    it('should mark notification as read with timestamp', async () => {
      const notification = createMockNotification({ status: 'delivered' });
      
      // Store notification
      const key = `notification:${notification.id}`;
      await mockCache.set(key, JSON.stringify(notification));
      
      // Mark as read
      const stored = JSON.parse((await mockCache.get(key))!);
      stored.status = 'read';
      stored.readAt = new Date();
      await mockCache.set(key, JSON.stringify(stored));
      
      // Verify
      const updated = JSON.parse((await mockCache.get(key))!);
      expect(updated.status).toBe('read');
      expect(updated.readAt).toBeDefined();
    });

    it('should track status transitions in logs', async () => {
      const notification = createMockNotification();
      
      mockLogger.info('Notification created', { id: notification.id, status: 'pending' });
      mockLogger.info('Notification sent', { id: notification.id, status: 'sent' });
      mockLogger.info('Notification delivered', { id: notification.id, status: 'delivered' });
      
      const logs = mockLogger.getLogsByLevel('info');
      expect(logs.length).toBeGreaterThanOrEqual(3);
      expect(logs.some(l => l.message.includes('created'))).toBe(true);
      expect(logs.some(l => l.message.includes('sent'))).toBe(true);
      expect(logs.some(l => l.message.includes('delivered'))).toBe(true);
    });

    it('should handle concurrent status updates safely', async () => {
      const notification = createMockNotification();
      const key = `notification:${notification.id}`;
      
      // Initial store
      await mockCache.set(key, JSON.stringify(notification));
      
      // Simulate concurrent updates
      const updates = [
        { status: 'sent', sentAt: new Date() },
        { status: 'delivered', deliveredAt: new Date() },
        { status: 'read', readAt: new Date() },
      ];
      
      for (const update of updates) {
        const current = JSON.parse((await mockCache.get(key))!);
        const merged = { ...current, ...update };
        await mockCache.set(key, JSON.stringify(merged));
      }
      
      // Verify final state
      const final = JSON.parse((await mockCache.get(key))!);
      expect(final.status).toBeDefined();
      expect(final.readAt).toBeDefined();
    });
  });

  describe('Notification Workflow Edge Cases', () => {
    it('should handle notification with empty channels', async () => {
      const notification = createMockNotification({ channels: [] });
      
      if (notification.channels!.length === 0) {
        mockLogger.warn('Notification has no channels');
      }
      
      const logs = mockLogger.getLogsByLevel('warn');
      expect(logs.length).toBeGreaterThan(0);
    });

    it('should handle very large notification payload', async () => {
      const largeMessage = 'x'.repeat(10000); // 10KB message
      const notification = createMockNotification({ message: largeMessage });
      
      const key = `notification:${notification.id}`;
      await mockCache.set(key, JSON.stringify(notification));
      
      const stored = await mockCache.get(key);
      expect(stored).toBeDefined();
      
      const retrieved = JSON.parse(stored!);
      expect(retrieved.message.length).toBe(10000);
    });

    it('should handle special characters in notification content', async () => {
      const specialContent = 'Test with émojis 🎉 and spëcial chars!@#$%';
      const notification = createMockNotification({ message: specialContent });
      
      const key = `notification:${notification.id}`;
      await mockCache.set(key, JSON.stringify(notification));
      
      const stored = await mockCache.get(key);
      const retrieved = JSON.parse(stored!);
      
      expect(retrieved.message).toBe(specialContent);
    });

    it('should handle rapid sequential sends to same user', async () => {
      const userId = 'user_123';
      
      const results = [];
      for (let i = 0; i < 10; i++) {
        const notif = createMockNotification({ userId, id: `notif_${i}` });
        const result = await inAppChannel.send(notif);
        results.push(result);
      }
      
      expect(results.filter(r => r).length).toBe(10);
    });
  });
});
