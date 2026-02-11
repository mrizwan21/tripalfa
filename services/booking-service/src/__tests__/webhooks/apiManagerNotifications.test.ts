/**
 * API Manager Notification Tests
 * Tests for API rate limit warnings, quota exceeded, key expiration, and integration errors
 */

describe('API Manager Notifications', () => {
  interface APIManagerEvent {
    eventType: string;
    apiKey: string;
    currentUsage?: number;
    limit?: number;
    threshold?: number;
    resetTime?: string;
    expiryDate?: string;
    error?: string;
    severity?: string;
    timestamp: string;
  }

  interface NotificationPayload {
    id: string;
    recipient: string;
    type: string;
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    channels: string[];
    metadata: Record<string, any>;
  }

  let apiManagerNotifications: NotificationPayload[] = [];

  const createAPIManagerNotification = (event: APIManagerEvent): NotificationPayload | null => {
    const baseNotification: NotificationPayload = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      recipient: 'admin@tripalfa.com',
      type: `api_manager_${event.eventType}`,
      title: '',
      message: '',
      priority: 'medium',
      channels: ['email', 'in_app'],
      metadata: {
        eventType: event.eventType,
        apiKey: event.apiKey,
        sourceSystem: 'api_manager',
        timestamp: event.timestamp,
      },
    };

    switch (event.eventType) {
      case 'rate_limit_warning':
        baseNotification.title = '⚠️ API Rate Limit Warning';
        baseNotification.message =
          `Your API usage is approaching the limit. Current: ${event.currentUsage}/${event.limit} requests.`;
        baseNotification.priority = 'high';
        baseNotification.channels = ['email', 'in_app', 'sms'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          currentUsage: event.currentUsage,
          limit: event.limit,
          usagePercentage: ((event.currentUsage || 0) / (event.limit || 1)) * 100,
          threshold: event.threshold,
          resetTime: event.resetTime,
          recommendedActions: ['Optimize API calls', 'Request for higher limit'],
        };
        return baseNotification;

      case 'quota_exceeded':
        baseNotification.title = '🚫 API Quota Exceeded';
        baseNotification.message =
          `Your API quota has been exceeded. Usage: ${event.currentUsage}/${event.limit} requests.`;
        baseNotification.priority = 'urgent';
        baseNotification.channels = ['email', 'sms', 'in_app'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          currentUsage: event.currentUsage,
          limit: event.limit,
          overageAmount: (event.currentUsage || 0) - (event.limit || 0),
          resetTime: event.resetTime,
          requiresAction: true,
          actionType: 'request_quota_increase',
        };
        return baseNotification;

      case 'api_key_expiring':
        baseNotification.title = '⏰ API Key Expiring Soon';
        baseNotification.message =
          `Your API key will expire on ${event.expiryDate}. Please renew it to avoid service interruption.`;
        baseNotification.priority = 'high';
        baseNotification.channels = ['email', 'in_app'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          expiryDate: event.expiryDate,
          requiresAction: true,
          actionType: 'renew_api_key',
        };
        return baseNotification;

      case 'api_key_expired':
        baseNotification.title = '❌ API Key Expired';
        baseNotification.message = `Your API key expired on ${event.expiryDate}. Service is unavailable.`;
        baseNotification.priority = 'urgent';
        baseNotification.channels = ['email', 'sms', 'in_app'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          expiryDate: event.expiryDate,
          requiresAction: true,
          actionType: 'renew_api_key_immediately',
        };
        return baseNotification;

      case 'api_health_check_failed':
        baseNotification.title = '🔴 API Integration Error';
        baseNotification.message =
          `API health check failed. Service may be experiencing issues: ${event.error}`;
        baseNotification.priority = 'urgent';
        baseNotification.channels = ['email', 'sms', 'in_app'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          error: event.error,
          severity: event.severity || 'high',
          requiresAction: true,
          actionType: 'investigate_api_health',
        };
        return baseNotification;

      case 'rate_limit_reset':
        baseNotification.title = 'ℹ️ API Rate Limit Reset';
        baseNotification.message = `Your API rate limit has been reset. Current usage: 0/${event.limit}.`;
        baseNotification.priority = 'low';
        baseNotification.channels = ['in_app'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          limit: event.limit,
          resetTime: event.resetTime,
        };
        return baseNotification;

      case 'quota_limit_increased':
        baseNotification.title = '✅ API Quota Increased';
        baseNotification.message = `Your API quota has been increased to ${event.limit} requests.`;
        baseNotification.priority = 'low';
        baseNotification.channels = ['email', 'in_app'];
        baseNotification.metadata = {
          ...baseNotification.metadata,
          newLimit: event.limit,
          previousLimit: baseNotification.metadata.previousLimit,
        };
        return baseNotification;

      default:
        return null;
    }
  };

  beforeEach(() => {
    apiManagerNotifications = [];
  });

  describe('Rate Limit Notifications', () => {
    it('should create rate limit warning notification', () => {
      const event: APIManagerEvent = {
        eventType: 'rate_limit_warning',
        apiKey: 'key_123',
        currentUsage: 8500,
        limit: 10000,
        threshold: 85,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Rate Limit Warning');
      expect(notification?.priority).toBe('high');
      expect(notification?.channels).toContain('sms');
      expect(notification?.message).toContain('8500/10000');
      expect(notification?.metadata?.usagePercentage).toBe(85);
      expect(notification?.metadata?.recommendedActions).toBeDefined();
    });

    it('should calculate correct usage percentage', () => {
      const event: APIManagerEvent = {
        eventType: 'rate_limit_warning',
        apiKey: 'key_123',
        currentUsage: 5000,
        limit: 10000,
        threshold: 85,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.usagePercentage).toBe(50);
    });

    it('should include reset time in notification', () => {
      const resetTime = new Date(Date.now() + 3600000).toISOString();
      const event: APIManagerEvent = {
        eventType: 'rate_limit_warning',
        apiKey: 'key_123',
        currentUsage: 8500,
        limit: 10000,
        threshold: 85,
        resetTime,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.resetTime).toBe(resetTime);
    });
  });

  describe('Quota Exceeded Notifications', () => {
    it('should create quota exceeded notification with urgent priority', () => {
      const event: APIManagerEvent = {
        eventType: 'quota_exceeded',
        apiKey: 'key_123',
        currentUsage: 10500,
        limit: 10000,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Quota Exceeded');
      expect(notification?.priority).toBe('urgent');
      expect(notification?.channels).toContain('sms');
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('request_quota_increase');
    });

    it('should calculate overage amount correctly', () => {
      const event: APIManagerEvent = {
        eventType: 'quota_exceeded',
        apiKey: 'key_123',
        currentUsage: 10750,
        limit: 10000,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.overageAmount).toBe(750);
    });

    it('should include action required flag', () => {
      const event: APIManagerEvent = {
        eventType: 'quota_exceeded',
        apiKey: 'key_123',
        currentUsage: 10500,
        limit: 10000,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.requiresAction).toBe(true);
    });
  });

  describe('API Key Expiration Notifications', () => {
    it('should create notification for expiring API key', () => {
      const expiryDate = new Date(Date.now() + 86400000).toISOString(); // 24 hours from now
      const event: APIManagerEvent = {
        eventType: 'api_key_expiring',
        apiKey: 'key_123',
        expiryDate,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('API Key Expiring');
      expect(notification?.priority).toBe('high');
      expect(notification?.message).toContain(expiryDate.split('T')[0]);
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('renew_api_key');
    });

    it('should create urgent notification for expired API key', () => {
      const expiryDate = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const event: APIManagerEvent = {
        eventType: 'api_key_expired',
        apiKey: 'key_123',
        expiryDate,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('API Key Expired');
      expect(notification?.priority).toBe('urgent');
      expect(notification?.channels).toContain('sms');
      expect(notification?.metadata?.actionType).toBe('renew_api_key_immediately');
    });

    it('should include SMS channel for expired key', () => {
      const expiryDate = new Date(Date.now() - 3600000).toISOString();
      const event: APIManagerEvent = {
        eventType: 'api_key_expired',
        apiKey: 'key_123',
        expiryDate,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.channels).toContain('email');
      expect(notification?.channels).toContain('sms');
      expect(notification?.channels).toContain('in_app');
    });
  });

  describe('API Health Check Notifications', () => {
    it('should create notification for API health check failure', () => {
      const event: APIManagerEvent = {
        eventType: 'api_health_check_failed',
        apiKey: 'key_123',
        error: 'Connection timeout',
        severity: 'high',
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('API Integration Error');
      expect(notification?.priority).toBe('urgent');
      expect(notification?.message).toContain('Connection timeout');
      expect(notification?.metadata?.error).toBe('Connection timeout');
      expect(notification?.metadata?.requiresAction).toBe(true);
      expect(notification?.metadata?.actionType).toBe('investigate_api_health');
    });

    it('should include severity level in metadata', () => {
      const event: APIManagerEvent = {
        eventType: 'api_health_check_failed',
        apiKey: 'key_123',
        error: 'Service unavailable',
        severity: 'critical',
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.severity).toBe('critical');
    });

    it('should set SMS channel for API health failures', () => {
      const event: APIManagerEvent = {
        eventType: 'api_health_check_failed',
        apiKey: 'key_123',
        error: 'Service down',
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.channels).toContain('sms');
    });
  });

  describe('Rate Limit Reset Notifications', () => {
    it('should create notification for rate limit reset', () => {
      const resetTime = new Date().toISOString();
      const event: APIManagerEvent = {
        eventType: 'rate_limit_reset',
        apiKey: 'key_123',
        limit: 10000,
        resetTime,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('Rate Limit Reset');
      expect(notification?.priority).toBe('low');
      expect(notification?.channels).toEqual(['in_app']);
    });

    it('should include limit information', () => {
      const event: APIManagerEvent = {
        eventType: 'rate_limit_reset',
        apiKey: 'key_123',
        limit: 10000,
        resetTime: new Date().toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.limit).toBe(10000);
    });
  });

  describe('Quota Limit Increase Notifications', () => {
    it('should create notification for quota limit increase', () => {
      const event: APIManagerEvent = {
        eventType: 'quota_limit_increased',
        apiKey: 'key_123',
        limit: 20000,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).not.toBeNull();
      expect(notification?.title).toContain('API Quota Increased');
      expect(notification?.priority).toBe('low');
      expect(notification?.message).toContain('20000');
    });

    it('should include new quota limit in metadata', () => {
      const event: APIManagerEvent = {
        eventType: 'quota_limit_increased',
        apiKey: 'key_123',
        limit: 50000,
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.newLimit).toBe(50000);
    });
  });

  describe('API Manager Notification Routing', () => {
    it('should route notifications to admin email', () => {
      const event: APIManagerEvent = {
        eventType: 'rate_limit_warning',
        apiKey: 'key_123',
        currentUsage: 8500,
        limit: 10000,
        threshold: 85,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.recipient).toBe('admin@tripalfa.com');
      expect(notification?.channels).toContain('email');
    });

    it('should include source system in metadata', () => {
      const event: APIManagerEvent = {
        eventType: 'rate_limit_warning',
        apiKey: 'key_123',
        currentUsage: 8500,
        limit: 10000,
        threshold: 85,
        resetTime: new Date(Date.now() + 3600000).toISOString(),
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification?.metadata?.sourceSystem).toBe('api_manager');
    });
  });

  describe('Unknown Event Types', () => {
    it('should handle unknown API manager event types gracefully', () => {
      const event: APIManagerEvent = {
        eventType: 'unknown_event',
        apiKey: 'key_123',
        timestamp: new Date().toISOString(),
      };

      const notification = createAPIManagerNotification(event);

      expect(notification).toBeNull();
    });
  });

  describe('Channel Selection Based on Severity', () => {
    it('should use SMS channel for high priority events', () => {
      const eventTypes = ['rate_limit_warning', 'quota_exceeded', 'api_key_expired', 'api_health_check_failed'];

      eventTypes.forEach((eventType) => {
        const event: APIManagerEvent = {
          eventType,
          apiKey: 'key_123',
          currentUsage: 9000,
          limit: 10000,
          expiryDate: new Date().toISOString(),
          error: 'Error',
          resetTime: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        const notification = createAPIManagerNotification(event);

        if (notification?.priority === 'urgent' || notification?.priority === 'high') {
          expect(notification?.channels).toContain('sms');
        }
      });
    });

    it('should use in_app channel for all notifications', () => {
      const eventTypes = ['rate_limit_warning', 'quota_exceeded', 'api_key_expiring', 'rate_limit_reset'];

      eventTypes.forEach((eventType) => {
        const event: APIManagerEvent = {
          eventType,
          apiKey: 'key_123',
          currentUsage: 9000,
          limit: 10000,
          threshold: 80,
          expiryDate: new Date().toISOString(),
          resetTime: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        const notification = createAPIManagerNotification(event);

        expect(notification?.channels).toContain('in_app');
      });
    });
  });

  describe('Metadata Consistency', () => {
    it('should include timestamp in all notifications', () => {
      const eventTypes = [
        'rate_limit_warning',
        'quota_exceeded',
        'api_key_expiring',
        'api_key_expired',
        'api_health_check_failed',
        'rate_limit_reset',
        'quota_limit_increased',
      ];

      eventTypes.forEach((eventType) => {
        const timestamp = new Date().toISOString();
        const event: APIManagerEvent = {
          eventType,
          apiKey: 'key_123',
          currentUsage: 9000,
          limit: 10000,
          threshold: 80,
          expiryDate: new Date().toISOString(),
          error: 'Error',
          resetTime: new Date().toISOString(),
          timestamp,
        };

        const notification = createAPIManagerNotification(event);

        if (notification) {
          expect(notification.metadata.timestamp).toBe(timestamp);
        }
      });
    });

    it('should include API key in all notifications', () => {
      const eventTypes = ['rate_limit_warning', 'quota_exceeded', 'api_key_expiring'];

      eventTypes.forEach((eventType) => {
        const apiKey = 'key_unique_123';
        const event: APIManagerEvent = {
          eventType,
          apiKey,
          currentUsage: 9000,
          limit: 10000,
          threshold: 80,
          expiryDate: new Date().toISOString(),
          resetTime: new Date().toISOString(),
          timestamp: new Date().toISOString(),
        };

        const notification = createAPIManagerNotification(event);

        if (notification) {
          expect(notification.metadata.apiKey).toBe(apiKey);
        }
      });
    });
  });
});
