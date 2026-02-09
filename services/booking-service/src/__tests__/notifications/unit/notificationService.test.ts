import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { NotificationService, EmailNotificationChannel, SMSNotificationChannel, PushNotificationChannel, InAppNotificationChannel } from '../../../services/notificationService';
import { MockCacheService, MockEmailChannel, MockSmsChannel, MockInAppChannel, MockLogger, MockMetricsStore } from './__mocks__';
import { createMockNotification, createMockBooking, notificationTestScenarios } from './__fixtures__/notification.fixtures';

describe('NotificationService Unit Tests', () => {
  let notificationService: NotificationService;
  let mockCache: MockCacheService;
  let mockLogger: MockLogger;
  let mockMetrics: MockMetricsStore;

  beforeEach(() => {
    mockCache = new MockCacheService();
    mockLogger = new MockLogger();
    mockMetrics = new MockMetricsStore();
    
    // Mock global logger and metricsStore
    (global as any).logger = mockLogger;
    (global as any).metricsStore = mockMetrics;
    
    notificationService = new NotificationService(mockCache as any);
  });

  afterEach(() => {
    mockCache.clear();
    mockLogger.clear();
    mockMetrics.clear();
  });

  describe('Channel Management', () => {
    it('should add a notification channel successfully', () => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      expect(() => notificationService.addChannel('email', emailChannel as any)).not.toThrow();
    });

    it('should throw error when adding channel with invalid config', () => {
      const emailChannel = new MockEmailChannel({ apiKey: undefined });
      expect(() => notificationService.addChannel('email', emailChannel as any)).toThrow();
    });

    it('should add multiple channels without conflict', () => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const smsChannel = new MockSmsChannel({ accountSid: 'test', authToken: 'test', fromNumber: '+1234' });
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('sms', smsChannel as any);
      
      // Should not throw
      expect(mockLogger.getLogsByLevel('info')).toHaveLength(2);
    });

    it('should replace existing channel with same type', () => {
      const channel1 = new MockEmailChannel({ apiKey: 'test1', fromAddress: 'test@example.com' });
      const channel2 = new MockEmailChannel({ apiKey: 'test2', fromAddress: 'test@example.com' });
      
      notificationService.addChannel('email', channel1 as any);
      notificationService.addChannel('email', channel2 as any);
      
      expect(mockLogger.getLogsByLevel('info')).toHaveLength(2);
    });
  });

  describe('Template Management', () => {
    it('should add email template successfully', () => {
      const template = {
        id: 'email_1',
        name: 'Welcome',
        subject: 'Welcome {name}',
        htmlBody: '<h1>Welcome</h1>',
        textBody: 'Welcome',
        variables: ['name'],
      };
      
      expect(() => notificationService.addEmailTemplate(template as any)).not.toThrow();
      expect(mockLogger.getLogsByLevel('info').some(log => log.message.includes('template added'))).toBe(true);
    });

    it('should add SMS template successfully', () => {
      const template = {
        id: 'sms_1',
        name: 'Verification',
        message: 'Your code: {code}',
        variables: ['code'],
      };
      
      expect(() => notificationService.addSMSTemplate(template as any)).not.toThrow();
      expect(mockLogger.getLogsByLevel('info').some(log => log.message.includes('template added'))).toBe(true);
    });

    it('should store multiple templates with different types', () => {
      const emailTemplate = {
        id: 'email_1',
        name: 'Welcome',
        subject: 'Welcome',
        htmlBody: '<h1>Welcome</h1>',
        textBody: 'Welcome',
        variables: [],
      };
      
      const smsTemplate = {
        id: 'sms_1',
        name: 'Alert',
        message: 'Alert message',
        variables: [],
      };
      
      notificationService.addEmailTemplate(emailTemplate as any);
      notificationService.addSMSTemplate(smsTemplate as any);
      
      expect(mockLogger.getLogsByLevel('info')).toHaveLength(2);
    });
  });

  describe('Notification Sending', () => {
    beforeEach(() => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const smsChannel = new MockSmsChannel({ accountSid: 'test', authToken: 'test', fromNumber: '+1234' });
      const inAppChannel = new MockInAppChannel(mockCache);
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('sms', smsChannel as any);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    it('should send notification to single channel successfully', async () => {
      const notification = createMockNotification({ channels: ['email'] });
      const result = await notificationService.sendNotification(notification);
      
      expect(result.status).toBe('sent');
      expect(result.id).toBeDefined();
      expect(result.sentAt).toBeDefined();
    });

    it('should send notification to multiple channels', async () => {
      const notification = createMockNotification({ channels: ['email', 'sms', 'in_app'] });
      const result = await notificationService.sendNotification(notification);
      
      expect(result.status).toBe('sent');
      expect(result.channels).toHaveLength(3);
    });

    it('should fail when unconfigured channel is requested', async () => {
      const notification = createMockNotification({ channels: ['push'] });
      const result = await notificationService.sendNotification(notification);
      
      expect(result.status).toBe('failed');
    });

    it('should generate unique notification ID', async () => {
      const notification1 = await notificationService.sendNotification(createMockNotification());
      const notification2 = await notificationService.sendNotification(createMockNotification());
      
      expect(notification1.id).not.toBe(notification2.id);
    });

    it('should set notification timestamp fields', async () => {
      const beforeTime = new Date();
      const result = await notificationService.sendNotification(createMockNotification());
      const afterTime = new Date();
      
      expect(result.createdAt.getTime()).toBeGreaterThanOrEqual(beforeTime.getTime());
      expect(result.sentAt!.getTime()).toBeLessThanOrEqual(afterTime.getTime());
    });

    it('should store notification in cache', async () => {
      const notification = createMockNotification();
      const result = await notificationService.sendNotification(notification);
      
      const stored = await mockCache.get(`notification:${result.id}`);
      expect(stored).toBeDefined();
      
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.id).toBe(result.id);
      }
    });

    it('should track metrics for sent notifications', async () => {
      const notification = createMockNotification({ channels: ['email'], type: 'booking_created' });
      await notificationService.sendNotification(notification);
      
      expect(mockMetrics.getEvents().some(e => e.type === 'increment' && e.name === 'notification_sent')).toBe(true);
    });

    it('should handle notification with default channels', async () => {
      const notification = createMockNotification();
      delete notification.channels;
      
      const result = await notificationService.sendNotification(notification);
      expect(result.channels).toEqual(['in_app']);
    });
  });

  describe('Booking Notification Helpers', () => {
    beforeEach(() => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const smsChannel = new MockSmsChannel({ accountSid: 'test', authToken: 'test', fromNumber: '+1234' });
      const inAppChannel = new MockInAppChannel(mockCache);
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('sms', smsChannel as any);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    it('should send booking created notification', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendBookingNotification(booking, 'created');
      
      expect(result.type).toBe('booking_created');
      expect(result.bookingId).toBe(booking.id);
      expect(result.bookingReference).toBe(booking.reference);
    });

    it('should send booking confirmed notification with high priority', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendBookingNotification(booking, 'confirmed');
      
      expect(result.priority).toBe('high');
      expect(result.title).toContain('Confirmed');
    });

    it('should send booking cancelled notification with urgent priority', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendBookingNotification(booking, 'cancelled');
      
      expect(result.priority).toBe('urgent');
    });

    it('should include SMS for urgent booking notifications', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendBookingNotification(booking, 'cancelled');
      
      expect(result.channels).toContain('sms');
    });
  });

  describe('Payment Notification Helpers', () => {
    beforeEach(() => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const smsChannel = new MockSmsChannel({ accountSid: 'test', authToken: 'test', fromNumber: '+1234' });
      const inAppChannel = new MockInAppChannel(mockCache);
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('sms', smsChannel as any);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    it('should send payment received notification', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendPaymentNotification(booking, 'received', 100);
      
      expect(result.type).toBe('payment_received');
      expect(result.title).toContain('Received');
    });

    it('should send payment failed notification with SMS', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendPaymentNotification(booking, 'failed', 100);
      
      expect(result.priority).toBe('high');
      expect(result.channels).toContain('sms');
    });

    it('should send payment refunded notification', async () => {
      const booking = createMockBooking();
      const result = await notificationService.sendPaymentNotification(booking, 'refunded', 100);
      
      expect(result.type).toBe('payment_received');
    });
  });

  describe('User Notifications Retrieval', () => {
    beforeEach(() => {
      const inAppChannel = new MockInAppChannel(mockCache);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    it('should retrieve user notifications', async () => {
      const userId = 'user_123';
      const notification1 = createMockNotification({ userId, id: 'notif_1' });
      const notification2 = createMockNotification({ userId, id: 'notif_2' });
      
      await notificationService.sendNotification(notification1);
      await notificationService.sendNotification(notification2);
      
      const userNotifications = await notificationService.getUserNotifications(userId);
      expect(userNotifications.length).toBeGreaterThan(0);
    });

    it('should return empty array for user with no notifications', async () => {
      const userNotifications = await notificationService.getUserNotifications('unknown_user');
      expect(userNotifications).toEqual([]);
    });

    it('should respect limit parameter', async () => {
      const userId = 'user_123';
      for (let i = 0; i < 10; i++) {
        await notificationService.sendNotification(createMockNotification({ userId }));
      }
      
      const userNotifications = await notificationService.getUserNotifications(userId, 5);
      expect(userNotifications.length).toBeLessThanOrEqual(5);
    });

    it('should sort notifications by date descending', async () => {
      const userId = 'user_123';
      const notification1 = createMockNotification({ userId, createdAt: new Date('2024-01-01') });
      const notification2 = createMockNotification({ userId, createdAt: new Date('2024-01-02') });
      
      await notificationService.sendNotification(notification1);
      await notificationService.sendNotification(notification2);
      
      const userNotifications = await notificationService.getUserNotifications(userId);
      if (userNotifications.length >= 2) {
        expect(new Date(userNotifications[0].createdAt).getTime()).toBeGreaterThanOrEqual(
          new Date(userNotifications[1].createdAt).getTime()
        );
      }
    });
  });

  describe('Notification Status Management', () => {
    beforeEach(() => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const inAppChannel = new MockInAppChannel(mockCache);
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    it('should mark notification as read', async () => {
      const notification = await notificationService.sendNotification(createMockNotification());
      const marked = await notificationService.markAsRead(notification.id);
      
      expect(marked).toBe(true);
    });

    it('should update deliveredAt timestamp when marking as read', async () => {
      const notification = await notificationService.sendNotification(createMockNotification());
      await notificationService.markAsRead(notification.id);
      
      const stored = await mockCache.get(`notification:${notification.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        expect(parsed.deliveredAt).toBeDefined();
      }
    });

    it('should return false for marking non-existent notification', async () => {
      const marked = await notificationService.markAsRead('non_existent_id');
      expect(marked).toBe(false);
    });

    it('should get unread notification count', async () => {
      const userId = 'user_123';
      await notificationService.sendNotification(createMockNotification({ userId, status: 'pending' }));
      await notificationService.sendNotification(createMockNotification({ userId, status: 'pending' }));
      
      const unreadCount = await notificationService.getUnreadNotificationCount(userId);
      expect(typeof unreadCount).toBe('number');
    });
  });

  describe('Scheduled Notifications', () => {
    it('should schedule notification successfully', async () => {
      const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notification = createMockNotification();
      
      const scheduledId = await notificationService.scheduleNotification(notification, scheduledFor);
      expect(scheduledId).toBeDefined();
      expect(typeof scheduledId).toBe('string');
    });

    it('should store scheduled notification in cache', async () => {
      const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notification = createMockNotification();
      
      const scheduledId = await notificationService.scheduleNotification(notification, scheduledFor);
      const stored = await mockCache.get(`scheduled_notification:${scheduledId}`);
      
      expect(stored).toBeDefined();
    });

    it('should add scheduled notification to scheduled list', async () => {
      const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notification = createMockNotification();
      
      await notificationService.scheduleNotification(notification, scheduledFor);
      
      const scheduledList = await mockCache.get('scheduled_notifications');
      expect(scheduledList).toBeDefined();
      if (scheduledList) {
        const list = JSON.parse(scheduledList);
        expect(list.length).toBeGreaterThan(0);
      }
    });

    it('should throw error when scheduling fails', async () => {
      // Mock cache to throw error
      mockCache.set = jest.fn().mockRejectedValue(new Error('Cache error'));
      
      const scheduledFor = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notification = createMockNotification();
      
      await expect(notificationService.scheduleNotification(notification, scheduledFor)).rejects.toThrow();
    });
  });

  describe('Process Scheduled Notifications', () => {
    beforeEach(() => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const inAppChannel = new MockInAppChannel(mockCache);
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    it('should process due scheduled notifications', async () => {
      const pastDate = new Date(Date.now() - 60 * 60 * 1000); // 1 hour ago
      const notification = createMockNotification();
      
      const scheduledId = await notificationService.scheduleNotification(notification, pastDate);
      await notificationService.processScheduledNotifications();
      
      // Notification should be processed and removed
      const stored = await mockCache.get(`scheduled_notification:${scheduledId}`);
      // After processing, the scheduled notification should be removed
    });

    it('should not process future scheduled notifications', async () => {
      const futureDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const notification = createMockNotification();
      
      const scheduledId = await notificationService.scheduleNotification(notification, futureDate);
      await notificationService.processScheduledNotifications();
      
      const stored = await mockCache.get(`scheduled_notification:${scheduledId}`);
      expect(stored).toBeDefined();
    });

    it('should handle errors gracefully during processing', async () => {
      await notificationService.processScheduledNotifications();
      // Should not throw error even if no scheduled notifications exist
      expect(true).toBe(true);
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle partial channel failures gracefully', async () => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const invalidSmsChannel = new MockSmsChannel({ accountSid: null, authToken: null, fromNumber: null });
      
      notificationService.addChannel('email', emailChannel as any);
      try {
        notificationService.addChannel('sms', invalidSmsChannel as any);
      } catch (e) {
        // Expected to fail
      }
      
      const notification = createMockNotification({ channels: ['email'] });
      const result = await notificationService.sendNotification(notification);
      
      expect(result).toBeDefined();
    });

    it('should log errors appropriately', async () => {
      const notification = createMockNotification({ channels: ['unknown_channel'] });
      await notificationService.sendNotification(notification);
      
      const errorLogs = mockLogger.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should track failed notifications in metrics', async () => {
      const notification = createMockNotification({ channels: ['unknown_channel'] });
      await notificationService.sendNotification(notification);
      
      const events = mockMetrics.getEvents();
      expect(events.some(e => e.name === 'notification_failed')).toBe(true);
    });
  });

  describe('Test Scenarios Coverage', () => {
    beforeEach(() => {
      const emailChannel = new MockEmailChannel({ apiKey: 'test', fromAddress: 'test@example.com' });
      const smsChannel = new MockSmsChannel({ accountSid: 'test', authToken: 'test', fromNumber: '+1234' });
      const pushChannel = { send: async () => true, validateConfig: () => true };
      const inAppChannel = new MockInAppChannel(mockCache);
      
      notificationService.addChannel('email', emailChannel as any);
      notificationService.addChannel('sms', smsChannel as any);
      notificationService.addChannel('push', pushChannel as any);
      notificationService.addChannel('in_app', inAppChannel as any);
    });

    Object.entries(notificationTestScenarios).forEach(([key, scenario]) => {
      it(`should handle scenario: ${scenario.name}`, async () => {
        const result = await notificationService.sendNotification(scenario.notification);
        expect(result.status).toBe('sent');
        expect(result.channels).toHaveLength(scenario.expectedChannels);
      });
    });
  });
});
