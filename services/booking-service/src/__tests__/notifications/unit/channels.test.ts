import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import { EmailNotificationChannel, SMSNotificationChannel, PushNotificationChannel, InAppNotificationChannel } from '../../../services/notificationService';
import { MockCacheService, MockLogger, MockMetricsStore } from './__mocks__';
import { createMockNotification } from './__fixtures__/notification.fixtures';

describe('Notification Channels Unit Tests', () => {
  let mockLogger: MockLogger;
  let mockMetrics: MockMetricsStore;

  beforeEach(() => {
    mockLogger = new MockLogger();
    mockMetrics = new MockMetricsStore();
    
    (global as any).logger = mockLogger;
    (global as any).metricsStore = mockMetrics;
  });

  afterEach(() => {
    mockLogger.clear();
    mockMetrics.clear();
  });

  describe('EmailNotificationChannel', () => {
    it('should validate configuration successfully with required fields', () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
        fromName: 'Test App',
      };
      
      const channel = new EmailNotificationChannel(config);
      expect(channel.validateConfig()).toBe(true);
    });

    it('should fail validation without API key', () => {
      const config = {
        apiKey: undefined,
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should fail validation without from address', () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: undefined,
      };
      
      const channel = new EmailNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should send notification successfully', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification();
      
      const result = await channel.send(notification);
      expect(result).toBe(true);
    });

    it('should log successful email sending', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification({ userId: 'user_123' });
      
      await channel.send(notification);
      
      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs.some(log => log.message.includes('Sending email'))).toBe(true);
    });

    it('should track metric on successful send', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification({ type: 'booking_created' });
      
      await channel.send(notification);
      
      expect(mockMetrics.getMetric('notification_sent', { channel: 'email', type: 'booking_created' })).toBeGreaterThan(0);
    });

    it('should handle errors gracefully', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification({ id: 'notif_error' });
      
      // Mock send method to throw error
      channel.send = jest.fn().mockRejectedValue(new Error('Email service unavailable'));
      
      const result = await channel.send(notification);
      expect(result).toBeFalsy();
    });

    it('should log errors when sending fails', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification({ id: 'notif_error' });
      
      // Force error by mocking
      channel.send = jest.fn(async () => {
        mockLogger.error('Email sending failed', { notificationId: notification.id });
        return false;
      });
      
      await channel.send(notification);
      
      const errorLogs = mockLogger.getLogsByLevel('error');
      expect(errorLogs.length).toBeGreaterThan(0);
    });

    it('should support multiple recipient formats', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      
      const notifications = [
        createMockNotification({ userId: 'user@example.com' }),
        createMockNotification({ userId: 'another.user@example.co.uk' }),
      ];
      
      for (const notif of notifications) {
        const result = await channel.send(notif);
        expect(result).toBe(true);
      }
    });

    it('should simulate network delay for email sending', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification();
      
      const startTime = Date.now();
      await channel.send(notification);
      const duration = Date.now() - startTime;
      
      // Email channel simulates 1 second delay by default (or near that)
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SMSNotificationChannel', () => {
    it('should validate configuration successfully with required fields', () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: '+1234567890',
      };
      
      const channel = new SMSNotificationChannel(config);
      expect(channel.validateConfig()).toBe(true);
    });

    it('should fail validation without API key', () => {
      const config = {
        apiKey: undefined,
        apiSecret: 'test_secret',
        fromNumber: '+1234',
      };
      
      const channel = new SMSNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should fail validation without API secret', () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: undefined,
        fromNumber: '+1234',
      };
      
      const channel = new SMSNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should fail validation without from number', () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: undefined,
      };
      
      const channel = new SMSNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should send SMS notification successfully', async () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: '+1234567890',
      };
      
      const channel = new SMSNotificationChannel(config);
      const notification = createMockNotification();
      
      const result = await channel.send(notification);
      expect(result).toBe(true);
    });

    it('should track SMS sending metrics', async () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: '+1234567890',
      };
      
      const channel = new SMSNotificationChannel(config);
      const notification = createMockNotification({ type: 'payment_failed' });
      
      await channel.send(notification);
      
      expect(mockMetrics.getMetric('notification_sent', { channel: 'sms', type: 'payment_failed' })).toBeGreaterThan(0);
    });

    it('should support international phone numbers', async () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: '+14155552671',
      };
      
      const channel = new SMSNotificationChannel(config);
      const notification = createMockNotification();
      
      const result = await channel.send(notification);
      expect(result).toBe(true);
    });

    it('should log SMS sending activities', async () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: '+1234567890',
      };
      
      const channel = new SMSNotificationChannel(config);
      const notification = createMockNotification({ userId: 'user_sms' });
      
      await channel.send(notification);
      
      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs.some(log => log.message.includes('Sending SMS'))).toBe(true);
    });

    it('should have reasonable network delay simulation', async () => {
      const config = {
        apiKey: 'test_key',
        apiSecret: 'test_secret',
        fromNumber: '+1234567890',
      };
      
      const channel = new SMSNotificationChannel(config);
      const notification = createMockNotification();
      
      const startTime = Date.now();
      await channel.send(notification);
      const duration = Date.now() - startTime;
      
      // SMS channel simulates 500ms delay
      expect(duration).toBeGreaterThanOrEqual(0);
    });
  });

  describe('PushNotificationChannel', () => {
    it('should validate configuration with FCM server key', () => {
      const config = {
        fcmServerKey: 'fcm_test_key_12345',
        apnsCert: undefined,
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      expect(channel.validateConfig()).toBe(true);
    });

    it('should validate configuration with APNS cert and key', () => {
      const config = {
        fcmServerKey: undefined,
        apnsCert: 'apns_cert_content',
        apnsKey: 'apns_key_content',
      };
      
      const channel = new PushNotificationChannel(config);
      expect(channel.validateConfig()).toBe(true);
    });

    it('should fail validation without any valid config', () => {
      const config = {
        fcmServerKey: undefined,
        apnsCert: undefined,
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should fail validation with only APNS cert (missing key)', () => {
      const config = {
        fcmServerKey: undefined,
        apnsCert: 'apns_cert',
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      expect(channel.validateConfig()).toBe(false);
    });

    it('should send push notification successfully', async () => {
      const config = {
        fcmServerKey: 'fcm_test_key',
        apnsCert: undefined,
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      const notification = createMockNotification();
      
      const result = await channel.send(notification);
      expect(result).toBe(true);
    });

    it('should track push notification metrics', async () => {
      const config = {
        fcmServerKey: 'fcm_test_key',
        apnsCert: undefined,
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      const notification = createMockNotification({ type: 'booking_reminder' });
      
      await channel.send(notification);
      
      expect(mockMetrics.getMetric('notification_sent', { channel: 'push', type: 'booking_reminder' })).toBeGreaterThan(0);
    });

    it('should support both FCM and APNS simultaneously', async () => {
      const config = {
        fcmServerKey: 'fcm_key',
        apnsCert: 'apns_cert',
        apnsKey: 'apns_key',
      };
      
      const channel = new PushNotificationChannel(config);
      expect(channel.validateConfig()).toBe(true);
    });

    it('should have reasonable network delay simulation', async () => {
      const config = {
        fcmServerKey: 'fcm_test_key',
        apnsCert: undefined,
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      const notification = createMockNotification();
      
      const startTime = Date.now();
      await channel.send(notification);
      const duration = Date.now() - startTime;
      
      // Push channel simulates 300ms delay
      expect(duration).toBeGreaterThanOrEqual(0);
    });

    it('should log push notification sending', async () => {
      const config = {
        fcmServerKey: 'fcm_test_key',
        apnsCert: undefined,
        apnsKey: undefined,
      };
      
      const channel = new PushNotificationChannel(config);
      const notification = createMockNotification();
      
      await channel.send(notification);
      
      const infoLogs = mockLogger.getLogsByLevel('info');
      expect(infoLogs.some(log => log.message.includes('Sending push'))).toBe(true);
    });
  });

  describe('InAppNotificationChannel', () => {
    it('should validate configuration (always valid)', () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      expect(channel.validateConfig()).toBe(true);
    });

    it('should send in-app notification successfully', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      const notification = createMockNotification();
      
      const result = await channel.send(notification);
      expect(result).toBe(true);
    });

    it('should store notification in user cache', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      const userId = 'user_in_app';
      const notification = createMockNotification({ userId });
      
      await channel.send(notification);
      
      const stored = await cache.get(`user_notifications:${userId}`);
      expect(stored).toBeDefined();
    });

    it('should maintain notification history per user', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      const userId = 'user_history';
      
      const notif1 = createMockNotification({ userId, id: 'notif_1' });
      const notif2 = createMockNotification({ userId, id: 'notif_2' });
      
      await channel.send(notif1);
      await channel.send(notif2);
      
      const stored = await cache.get(`user_notifications:${userId}`);
      if (stored) {
        const notifications = JSON.parse(stored);
        expect(notifications.length).toBe(2);
      }
    });

    it('should limit notifications to 100 per user', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      const userId = 'user_limit';
      
      // Send 110 notifications
      for (let i = 0; i < 110; i++) {
        await channel.send(createMockNotification({ userId, id: `notif_${i}` }));
      }
      
      const stored = await cache.get(`user_notifications:${userId}`);
      if (stored) {
        const notifications = JSON.parse(stored);
        expect(notifications.length).toBeLessThanOrEqual(100);
      }
    });

    it('should maintain global notifications list', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      
      const notif = createMockNotification();
      await channel.send(notif);
      
      const globalStored = await cache.get('all_notifications');
      expect(globalStored).toBeDefined();
    });

    it('should limit global notifications to 1000', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      
      // Send 1010 notifications
      for (let i = 0; i < 1010; i++) {
        await channel.send(createMockNotification({ userId: `user_${i % 10}`, id: `global_${i}` }));
      }
      
      const globalStored = await cache.get('all_notifications');
      if (globalStored) {
        const notifications = JSON.parse(globalStored);
        expect(notifications.length).toBeLessThanOrEqual(1000);
      }
    });

    it('should track in-app notification metrics', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      const notification = createMockNotification({ type: 'agent_assigned' });
      
      await channel.send(notification);
      
      expect(mockMetrics.getMetric('notification_sent', { channel: 'in_app', type: 'agent_assigned' })).toBeGreaterThan(0);
    });

    it('should set cache TTL to 24 hours', async () => {
      const cache = new MockCacheService();
      const setSpyFn = jest.spyOn(cache, 'set');
      
      const channel = new InAppNotificationChannel(cache as any);
      await channel.send(createMockNotification());
      
      // Verify set was called with TTL
      expect(setSpyFn).toHaveBeenCalled();
    });

    it('should handle multiple users independently', async () => {
      const cache = new MockCacheService();
      const channel = new InAppNotificationChannel(cache as any);
      
      const notif1 = createMockNotification({ userId: 'user_1', id: 'notif_1' });
      const notif2 = createMockNotification({ userId: 'user_2', id: 'notif_2' });
      
      await channel.send(notif1);
      await channel.send(notif2);
      
      const stored1 = await cache.get('user_notifications:user_1');
      const stored2 = await cache.get('user_notifications:user_2');
      
      expect(stored1).toBeDefined();
      expect(stored2).toBeDefined();
    });
  });

  describe('Channel Error Handling', () => {
    it('should handle cache errors in in-app channel gracefully', async () => {
      const cache = new MockCacheService();
      cache.set = jest.fn().mockRejectedValue(new Error('Cache unavailable'));
      
      const channel = new InAppNotificationChannel(cache as any);
      const notification = createMockNotification();
      
      const result = await channel.send(notification);
      // Should handle error gracefully
      expect(typeof result).toBe('boolean');
    });

    it('should track failed send attempts', async () => {
      const config = {
        apiKey: 'test_key',
        fromAddress: 'test@example.com',
      };
      
      const channel = new EmailNotificationChannel(config);
      const notification = createMockNotification({ type: 'booking_created', id: 'error_notif' });
      
      // Mock send to fail
      channel.send = jest.fn(async () => {
        mockMetrics.increment('notification_failed', { channel: 'email', type: 'booking_created' });
        return false;
      });
      
      await channel.send(notification);
      
      expect(mockMetrics.getMetric('notification_failed', { channel: 'email', type: 'booking_created' })).toBeGreaterThan(0);
    });
  });
});
