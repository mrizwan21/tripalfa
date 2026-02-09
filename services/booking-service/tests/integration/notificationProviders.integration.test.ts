/**
 * Notification Providers Integration Tests
 * 
 * Tests for all notification channel providers: Email, SMS, Push, In-App
 */
import { EmailProvider } from '../../src/notification/providers/EmailProvider';
import { SMSProvider } from '../../src/notification/providers/SMSProvider';
import { PushProvider } from '../../src/notification/providers/PushProvider';
import { InAppProvider } from '../../src/notification/providers/InAppProvider';
import { ProviderFactory } from '../../src/notification/providers/ProviderFactory';

// ============================================================================
// Email Provider Tests
// ============================================================================

describe('EmailProvider', () => {
  let emailProvider: EmailProvider;

  beforeEach(() => {
    emailProvider = new EmailProvider(
      'test-api-key',
      'test@example.com',
      true // mock mode
    );
  });

  describe('send', () => {
    it('should send email successfully', async () => {
      const response = await emailProvider.send('user@example.com', {
        subject: 'Test Subject',
        body: 'Test Body',
      });

      expect(response.status).toBe('sent');
      expect(response.messageId).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should reject invalid email address', async () => {
      await expect(
        emailProvider.send('invalid-email', {
          subject: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow('Invalid email address');
    });

    it('should support HTML body', async () => {
      const response = await emailProvider.send('user@example.com', {
        subject: 'Test',
        body: 'Plain text',
        htmlBody: '<p>HTML Body</p>',
      });

      expect(response.status).toBe('sent');
    });

    it('should support reply-to address', async () => {
      const response = await emailProvider.send('user@example.com', {
        subject: 'Test',
        body: 'Test',
        replyTo: 'reply@example.com',
      });

      expect(response.status).toBe('sent');
    });
  });

  describe('sendBulk', () => {
    it('should send to multiple recipients', async () => {
      const recipients = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
      const responses = await emailProvider.sendBulk(recipients, {
        subject: 'Bulk Email',
        body: 'This is bulk email',
      });

      expect(responses).toHaveLength(3);
      expect(responses.every((r) => r.status === 'sent')).toBe(true);
    });

    it('should handle partial failures in bulk send', async () => {
      const recipients = ['user@example.com', 'invalid-email', 'another@example.com'];
      const responses = await emailProvider.sendBulk(recipients, {
        subject: 'Bulk Email',
        body: 'Test',
      });

      expect(responses).toHaveLength(3);
    });
  });

  describe('isConfigured', () => {
    it('should return true when in mock mode', () => {
      expect(emailProvider.isConfigured()).toBe(true);
    });

    it('should return false when not configured and not in mock mode', () => {
      const notConfigured = new EmailProvider('', '', false);
      expect(notConfigured.isConfigured()).toBe(false);
    });
  });
});

// ============================================================================
// SMS Provider Tests
// ============================================================================

describe('SMSProvider', () => {
  let smsProvider: SMSProvider;

  beforeEach(() => {
    smsProvider = new SMSProvider(
      'test-account-sid',
      'test-auth-token',
      '+1234567890',
      true // mock mode
    );
  });

  describe('send', () => {
    it('should send SMS successfully', async () => {
      const response = await smsProvider.send('+1234567890', {
        message: 'Test SMS message',
      });

      expect(response.status).toBe('sent');
      expect(response.messageId).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should reject invalid phone number', async () => {
      await expect(
        smsProvider.send('invalid', {
          message: 'Test',
        })
      ).rejects.toThrow('Invalid phone number');
    });

    it('should reject message exceeding maximum length', async () => {
      const longMessage = 'a'.repeat(161);
      await expect(
        smsProvider.send('+1234567890', {
          message: longMessage,
        })
      ).rejects.toThrow('SMS message exceeds 160 characters');
    });
  });

  describe('splitLongMessage', () => {
    it('should not split short messages', () => {
      const message = 'Short message';
      const parts = smsProvider.splitLongMessage(message);
      expect(parts).toHaveLength(1);
      expect(parts[0]).toBe(message);
    });

    it('should split long messages with part numbers', () => {
      const message = 'a'.repeat(200);
      const parts = smsProvider.splitLongMessage(message);
      expect(parts.length).toBeGreaterThan(1);
      expect(parts[0]).toContain('(1/');
    });

    it('should handle multi-part SMS correctly', () => {
      const message = 'a'.repeat(500);
      const parts = smsProvider.splitLongMessage(message);
      
      // Each part should be <= concatenation limit
      parts.forEach((part, index) => {
        expect(part.length).toBeLessThanOrEqual(162); // 153 + header length
        // Should contain part number
        expect(part).toContain(`(${index + 1}/`);
      });
    });
  });

  describe('sendBulk', () => {
    it('should send to multiple phone numbers', async () => {
      const recipients = ['+1111111111', '+2222222222', '+3333333333'];
      const responses = await smsProvider.sendBulk(recipients, {
        message: 'Bulk SMS',
      });

      expect(responses).toHaveLength(3);
      expect(responses.every((r) => r.status === 'sent')).toBe(true);
    });
  });

  describe('isConfigured', () => {
    it('should return true when in mock mode', () => {
      expect(smsProvider.isConfigured()).toBe(true);
    });
  });
});

// ============================================================================
// Push Provider Tests
// ============================================================================

describe('PushProvider', () => {
  let pushProvider: PushProvider;

  beforeEach(() => {
    pushProvider = new PushProvider(
      'test-project-id',
      'test-key-id',
      'test-private-key',
      'test@example.com',
      true // mock mode
    );
  });

  describe('send', () => {
    it('should send push notification successfully', async () => {
      const deviceToken = 'a'.repeat(100); // Valid token length
      const response = await pushProvider.send(deviceToken, {
        title: 'Test Title',
        body: 'Test Body',
      });

      expect(response.status).toBe('sent');
      expect(response.messageId).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should reject invalid device token', async () => {
      await expect(
        pushProvider.send('invalid', {
          title: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow('Invalid device token format');
    });

    it('should reject missing title', async () => {
      const deviceToken = 'a'.repeat(100);
      await expect(
        pushProvider.send(deviceToken, {
          title: '',
          body: 'Test',
        })
      ).rejects.toThrow('requires both title and body');
    });

    it('should reject missing body', async () => {
      const deviceToken = 'a'.repeat(100);
      await expect(
        pushProvider.send(deviceToken, {
          title: 'Test',
          body: '',
        })
      ).rejects.toThrow('requires both title and body');
    });

    it('should reject title exceeding 200 characters', async () => {
      const deviceToken = 'a'.repeat(100);
      const longTitle = 'a'.repeat(201);
      
      await expect(
        pushProvider.send(deviceToken, {
          title: longTitle,
          body: 'Test',
        })
      ).rejects.toThrow('title exceeds 200 characters');
    });

    it('should reject body exceeding 4000 characters', async () => {
      const deviceToken = 'a'.repeat(100);
      const longBody = 'a'.repeat(4001);
      
      await expect(
        pushProvider.send(deviceToken, {
          title: 'Test',
          body: longBody,
        })
      ).rejects.toThrow('body exceeds 4000 characters');
    });

    it('should support notification data and metadata', async () => {
      const deviceToken = 'a'.repeat(100);
      const response = await pushProvider.send(
        deviceToken,
        {
          title: 'Test',
          body: 'Test Body',
          data: { 'key': 'value' },
          icon: 'icon_url',
          image: 'image_url',
        },
        { userId: 'user-123' }
      );

      expect(response.status).toBe('sent');
    });
  });

  describe('sendMulticast', () => {
    it('should send to multiple devices', async () => {
      const deviceTokens = [
        'a'.repeat(100),
        'b'.repeat(100),
        'c'.repeat(100),
      ];
      const responses = await pushProvider.sendMulticast(deviceTokens, {
        title: 'Multicast Title',
        body: 'Multicast Body',
      });

      expect(responses).toHaveLength(3);
      expect(responses.every((r) => r.status === 'sent')).toBe(true);
    });
  });

  describe('sendToTopic', () => {
    it('should send to topic successfully', async () => {
      const response = await pushProvider.sendToTopic('booking-updates', {
        title: 'Topic Title',
        body: 'Topic Body',
      });

      expect(response.status).toBe('sent');
      expect(response.messageId).toBeDefined();
    });

    it('should reject invalid topic name', async () => {
      await expect(
        pushProvider.sendToTopic('', {
          title: 'Test',
          body: 'Test',
        })
      ).rejects.toThrow('Invalid topic name');
    });
  });

  describe('subscribeToTopic', () => {
    it('should subscribe device to topic', async () => {
      const deviceToken = 'a'.repeat(100);
      await expect(
        pushProvider.subscribeToTopic(deviceToken, 'booking-updates')
      ).resolves.toBeUndefined();
    });
  });

  describe('unsubscribeFromTopic', () => {
    it('should unsubscribe device from topic', async () => {
      const deviceToken = 'a'.repeat(100);
      await expect(
        pushProvider.unsubscribeFromTopic(deviceToken, 'booking-updates')
      ).resolves.toBeUndefined();
    });
  });

  describe('isConfigured', () => {
    it('should return true when in mock mode', () => {
      expect(pushProvider.isConfigured()).toBe(true);
    });
  });
});

// ============================================================================
// In-App Provider Tests
// ============================================================================

describe('InAppProvider', () => {
  let inAppProvider: InAppProvider;

  beforeEach(() => {
    inAppProvider = new InAppProvider(undefined, undefined, true); // mock mode
  });

  describe('send', () => {
    it('should send in-app notification successfully', async () => {
      const response = await inAppProvider.send('user-123', {
        title: 'Test Title',
        message: 'Test Message',
      });

      expect(response.status).toBe('sent');
      expect(response.messageId).toBeDefined();
      expect(response.timestamp).toBeInstanceOf(Date);
    });

    it('should reject missing title', async () => {
      await expect(
        inAppProvider.send('user-123', {
          title: '',
          message: 'Test',
        })
      ).rejects.toThrow('requires title and message');
    });

    it('should reject missing message', async () => {
      await expect(
        inAppProvider.send('user-123', {
          title: 'Test',
          message: '',
        })
      ).rejects.toThrow('requires title and message');
    });

    it('should reject title exceeding 200 characters', async () => {
      const longTitle = 'a'.repeat(201);
      await expect(
        inAppProvider.send('user-123', {
          title: longTitle,
          message: 'Test',
        })
      ).rejects.toThrow('title exceeds 200 characters');
    });

    it('should reject message exceeding 2000 characters', async () => {
      const longMessage = 'a'.repeat(2001);
      await expect(
        inAppProvider.send('user-123', {
          title: 'Test',
          message: longMessage,
        })
      ).rejects.toThrow('message exceeds 2000 characters');
    });

    it('should support action URL and label', async () => {
      const response = await inAppProvider.send('user-123', {
        title: 'Test',
        message: 'Test Message',
        actionUrl: 'https://example.com/action',
        actionLabel: 'Click here',
        priority: 'high',
      });

      expect(response.status).toBe('sent');
    });
  });

  describe('sendToMany', () => {
    it('should send to multiple users', async () => {
      const userIds = ['user-1', 'user-2', 'user-3'];
      const responses = await inAppProvider.sendToMany(userIds, {
        title: 'Bulk Notification',
        message: 'This is a bulk in-app notification',
      });

      expect(responses).toHaveLength(3);
      expect(responses.every((r) => r.status === 'sent')).toBe(true);
    });
  });

  describe('sendToSegment', () => {
    it('should send to segment successfully', async () => {
      const response = await inAppProvider.sendToSegment('premium-users', {
        title: 'Premium Offer',
        message: 'Special offer for premium members',
      });

      expect(response.status).toBe('sent');
    });

    it('should reject invalid segment ID', async () => {
      await expect(
        inAppProvider.sendToSegment('', {
          title: 'Test',
          message: 'Test',
        })
      ).rejects.toThrow('Invalid segment ID');
    });
  });

  describe('getNotifications', () => {
    it('should return user notifications', async () => {
      const notifications = await inAppProvider.getNotifications('user-123');
      expect(Array.isArray(notifications)).toBe(true);
    });

    it('should support pagination options', async () => {
      const notifications = await inAppProvider.getNotifications('user-123', {
        limit: 10,
        offset: 0,
        unreadOnly: true,
      });

      expect(Array.isArray(notifications)).toBe(true);
    });
  });

  describe('markAsRead', () => {
    it('should mark notification as read', async () => {
      await expect(
        inAppProvider.markAsRead('notification-id', 'user-123')
      ).resolves.toBeUndefined();
    });
  });

  describe('deleteNotification', () => {
    it('should delete notification', async () => {
      await expect(
        inAppProvider.deleteNotification('notification-id', 'user-123')
      ).resolves.toBeUndefined();
    });
  });

  describe('isConfigured', () => {
    it('should always return true for in-app provider', () => {
      expect(inAppProvider.isConfigured()).toBe(true);
    });
  });
});

// ============================================================================
// Provider Factory Tests
// ============================================================================

describe('ProviderFactory', () => {
  let factory: ProviderFactory;

  beforeEach(() => {
    factory = new ProviderFactory({
      sendgridApiKey: 'test-key',
      sendgridFromEmail: 'test@example.com',
      twilioAccountSid: 'test-sid',
      twilioAuthToken: 'test-token',
      twilioPhoneNumber: '+1234567890',
      firebaseProjectId: 'test-project',
      firebasePrivateKeyId: 'key-id',
      firebasePrivateKey: 'private-key',
      firebaseClientEmail: 'test@firebase.com',
      mockMode: true,
    });
  });

  describe('getProvider', () => {
    it('should get email provider', () => {
      const provider = factory.getProvider('email');
      expect(provider).toBeInstanceOf(EmailProvider);
    });

    it('should get SMS provider', () => {
      const provider = factory.getProvider('sms');
      expect(provider).toBeInstanceOf(SMSProvider);
    });

    it('should get push provider', () => {
      const provider = factory.getProvider('push');
      expect(provider).toBeInstanceOf(PushProvider);
    });

    it('should get in-app provider', () => {
      const provider = factory.getProvider('in_app');
      expect(provider).toBeInstanceOf(InAppProvider);
    });

    it('should throw error for unknown channel', () => {
      expect(() => factory.getProvider('unknown' as any)).toThrow('Unknown channel');
    });
  });

  describe('getAllProviders', () => {
    it('should return all providers', () => {
      const providers = factory.getAllProviders();
      expect(providers.email).toBeInstanceOf(EmailProvider);
      expect(providers.sms).toBeInstanceOf(SMSProvider);
      expect(providers.push).toBeInstanceOf(PushProvider);
      expect(providers.in_app).toBeInstanceOf(InAppProvider);
    });
  });

  describe('getConfiguredProviders', () => {
    it('should return all configured providers in mock mode', () => {
      const configured = factory.getConfiguredProviders();
      expect(configured).toContain('email');
      expect(configured).toContain('sms');
      expect(configured).toContain('push');
      expect(configured).toContain('in_app');
    });
  });

  describe('healthCheck', () => {
    it('should return health status of all providers', async () => {
      const health = await factory.healthCheck();
      expect(health.email).toBe(true);
      expect(health.sms).toBe(true);
      expect(health.push).toBe(true);
      expect(health.in_app).toBe(true);
    });
  });

  describe('createFromEnvironment', () => {
    it('should create factory from environment variables', () => {
      const factory = ProviderFactory.createFromEnvironment(true);
      expect(factory).toBeInstanceOf(ProviderFactory);
    });
  });
});
