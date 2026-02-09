import { describe, it, expect } from '@jest/globals';

/**
 * Test utility helpers and common assertions
 */

/**
 * Common test utilities for notification tests
 */
export class NotificationTestHelper {
  /**
   * Verify notification has all required fields
   */
  static validateNotificationStructure(notification: any): boolean {
    const requiredFields = ['id', 'type', 'title', 'message', 'userId', 'status', 'createdAt'];
    return requiredFields.every(field => field in notification);
  }

  /**
   * Verify notification has valid status
   */
  static isValidNotificationStatus(status: string): boolean {
    const validStatuses = ['pending', 'sent', 'delivered', 'failed'];
    return validStatuses.includes(status);
  }

  /**
   * Verify notification has valid priority
   */
  static isValidPriority(priority: string): boolean {
    const validPriorities = ['low', 'medium', 'high', 'urgent'];
    return validPriorities.includes(priority);
  }

  /**
   * Verify notification channels are valid
   */
  static areValidChannels(channels: string[]): boolean {
    const validChannels = ['email', 'sms', 'push', 'in_app'];
    return channels.every(channel => validChannels.includes(channel));
  }

  /**
   * Calculate notification delivery SLA (in milliseconds)
   */
  static calculateDeliverySLA(priority: string): number {
    const slaMap: Record<string, number> = {
      urgent: 1000, // 1 second
      high: 5000, // 5 seconds
      medium: 30000, // 30 seconds
      low: 60000, // 1 minute
    };
    return slaMap[priority] || 60000;
  }

  /**
   * Create assertion helpers for common checks
   */
  static createAssertions(notification: any) {
    return {
      hasRequiredFields: () => NotificationTestHelper.validateNotificationStructure(notification),
      isValidStatus: () => NotificationTestHelper.isValidNotificationStatus(notification.status),
      isValidPriority: () => NotificationTestHelper.isValidPriority(notification.priority),
      hasValidChannels: () => NotificationTestHelper.areValidChannels(notification.channels || []),
      hasTimestamps: () => notification.createdAt && notification.updatedAt,
      hasDeliveryMetrics: () =>
        notification.sentAt !== undefined || notification.status === 'pending',
    };
  }
}

/**
 * Test data generators
 */
export class TestDataGenerator {
  /**
   * Generate random user ID
   */
  static generateUserId(): string {
    return `user_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random booking reference
   */
  static generateBookingReference(): string {
    return `BK${Date.now()}${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
  }

  /**
   * Generate random notification ID
   */
  static generateNotificationId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random job ID
   */
  static generateJobId(): string {
    return `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Generate random email
   */
  static generateEmail(): string {
    const random = Math.random().toString(36).substr(2, 9);
    return `test_${random}@example.com`;
  }

  /**
   * Generate random phone number
   */
  static generatePhoneNumber(): string {
    return `+1${Math.floor(Math.random() * 9000000000) + 1000000000}`;
  }

  /**
   * Generate array of random notifications
   */
  static generateNotifications(count: number): any[] {
    const notifications = [];
    for (let i = 0; i < count; i++) {
      notifications.push({
        id: this.generateNotificationId(),
        type: 'booking_created',
        title: `Test Notification ${i}`,
        message: `This is test notification ${i}`,
        userId: this.generateUserId(),
        status: 'pending',
        priority: 'medium',
        channels: ['email', 'in_app'],
        createdAt: new Date(),
        updatedAt: new Date(),
      });
    }
    return notifications;
  }

  /**
   * Generate random delay (milliseconds)
   */
  static generateRandomDelay(minMs = 0, maxMs = 60000): number {
    return Math.floor(Math.random() * (maxMs - minMs + 1)) + minMs;
  }
}

/**
 * Performance testing utilities
 */
export class PerformanceTestHelper {
  /**
   * Measure execution time of async function
   */
  static async measureExecutionTime<T>(fn: () => Promise<T>): Promise<{ result: T; duration: number }> {
    const startTime = performance.now();
    const result = await fn();
    const duration = performance.now() - startTime;
    return { result, duration };
  }

  /**
   * Assert execution time is within threshold
   */
  static assertExecutionTime(duration: number, maxDurationMs: number): boolean {
    return duration <= maxDurationMs;
  }

  /**
   * Calculate average execution time
   */
  static calculateAverageExecutionTime(durations: number[]): number {
    if (durations.length === 0) return 0;
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  /**
   * Calculate percentile execution time
   */
  static calculatePercentile(durations: number[], percentile: number): number {
    const sorted = durations.sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)] || 0;
  }
}

/**
 * Mock data builders
 */
export class MockDataBuilder {
  private notification: any = {};
  private booking: any = {};

  /**
   * Start building notification
   */
  static notification(): MockDataBuilder {
    return new MockDataBuilder();
  }

  /**
   * Set notification type
   */
  withType(type: string): this {
    this.notification.type = type;
    return this;
  }

  /**
   * Set notification priority
   */
  withPriority(priority: string): this {
    this.notification.priority = priority;
    return this;
  }

  /**
   * Set notification channels
   */
  withChannels(channels: string[]): this {
    this.notification.channels = channels;
    return this;
  }

  /**
   * Set notification user
   */
  forUser(userId: string): this {
    this.notification.userId = userId;
    return this;
  }

  /**
   * Set notification status
   */
  withStatus(status: string): this {
    this.notification.status = status;
    return this;
  }

  /**
   * Build the notification
   */
  build(): any {
    return {
      id: TestDataGenerator.generateNotificationId(),
      type: this.notification.type || 'booking_created',
      title: 'Test Notification',
      message: 'Test message',
      userId: this.notification.userId || TestDataGenerator.generateUserId(),
      status: this.notification.status || 'pending',
      priority: this.notification.priority || 'medium',
      channels: this.notification.channels || ['email', 'in_app'],
      createdAt: new Date(),
      updatedAt: new Date(),
      ...this.notification,
    };
  }
}

/**
 * Integration test scenarios
 */
export class IntegrationScenarios {
  /**
   * Scenario: User receives notification immediately
   */
  static get immediateDelivery() {
    return {
      name: 'Immediate Delivery',
      priority: 'urgent',
      expectedDelay: 0,
      channels: ['push', 'sms', 'email'],
    };
  }

  /**
   * Scenario: User receives notification within SLA
   */
  static get withinSLA() {
    return {
      name: 'Within SLA',
      priority: 'high',
      expectedDelay: 5000,
      channels: ['email', 'in_app'],
    };
  }

  /**
   * Scenario: User receives notification eventually
   */
  static get eventualDelivery() {
    return {
      name: 'Eventual Delivery',
      priority: 'low',
      expectedDelay: 60000,
      channels: ['in_app'],
    };
  }

  /**
   * Scenario: Notification retried on failure
   */
  static get retryOnFailure() {
    return {
      name: 'Retry on Failure',
      maxRetries: 3,
      backoffStrategy: 'exponential',
      initialDelay: 1000,
    };
  }

  /**
   * Scenario: Batch notifications sent
   */
  static get batchSending() {
    return {
      name: 'Batch Sending',
      batchSize: 100,
      totalNotifications: 1000,
      parallelization: 'enabled',
    };
  }

  /**
   * Scenario: Recurring notifications scheduled
   */
  static get recurringNotifications() {
    return {
      name: 'Recurring Notifications',
      pattern: '0 9 * * *',
      timezone: 'UTC',
      maxOccurrences: null, // Unlimited
    };
  }
}

/**
 * Error simulation utilities
 */
export class ErrorSimulator {
  /**
   * Simulate channel unavailability
   */
  static createChannelUnavailableError(): Error {
    return new Error('Channel unavailable for communication');
  }

  /**
   * Simulate rate limiting
   */
  static createRateLimitError(): Error {
    return new Error('Rate limit exceeded, please retry after 60 seconds');
  }

  /**
   * Simulate invalid configuration
   */
  static createInvalidConfigError(): Error {
    return new Error('Invalid channel configuration provided');
  }

  /**
   * Simulate template not found
   */
  static createTemplateNotFoundError(templateId: string): Error {
    return new Error(`Template ${templateId} not found`);
  }

  /**
   * Simulate cache error
   */
  static createCacheError(): Error {
    return new Error('Cache service unavailable');
  }

  /**
   * Simulate database error
   */
  static createDatabaseError(): Error {
    return new Error('Database connection failed');
  }

  /**
   * Simulate network timeout
   */
  static createNetworkTimeoutError(): Error {
    return new Error('Network request timed out after 30 seconds');
  }

  /**
   * Simulate authentication failure
   */
  static createAuthenticationError(): Error {
    return new Error('Authentication failed for notification service');
  }
}

/**
 * Report generation utilities for test results
 */
export class TestReportGenerator {
  private results: any[] = [];

  /**
   * Add test result
   */
  addResult(testName: string, passed: boolean, duration: number, details?: any): this {
    this.results.push({
      testName,
      passed,
      duration,
      details,
      timestamp: new Date(),
    });
    return this;
  }

  /**
   * Get summary statistics
   */
  getSummary(): any {
    const total = this.results.length;
    const passed = this.results.filter(r => r.passed).length;
    const failed = total - passed;
    const totalDuration = this.results.reduce((sum, r) => sum + r.duration, 0);

    return {
      total,
      passed,
      failed,
      passRate: total > 0 ? ((passed / total) * 100).toFixed(2) + '%' : 'N/A',
      totalDuration: totalDuration.toFixed(2) + 'ms',
      averageDuration: (totalDuration / total).toFixed(2) + 'ms',
      slowestTest: this.results.reduce((max, r) => (r.duration > max.duration ? r : max)),
    };
  }

  /**
   * Get failed tests
   */
  getFailedTests(): any[] {
    return this.results.filter(r => !r.passed);
  }

  /**
   * Generate report in JSON format
   */
  generateJsonReport(): string {
    return JSON.stringify({
      summary: this.getSummary(),
      results: this.results,
      generatedAt: new Date(),
    }, null, 2);
  }
}

/**
 * Assertion helpers
 */
export class AssertionHelpers {
  /**
   * Assert array contains all items
   */
  static assertContainsAll<T>(array: T[], items: T[]): void {
    items.forEach(item => {
      if (!array.includes(item)) {
        throw new Error(`Array does not contain ${item}`);
      }
    });
  }

  /**
   * Assert notification meets SLA
   */
  static assertNotificationMeetsSLA(notification: any, maxDurationMs: number): void {
    if (!notification.sentAt || !notification.createdAt) {
      throw new Error('Notification missing timestamp fields');
    }

    const duration = notification.sentAt.getTime() - notification.createdAt.getTime();
    if (duration > maxDurationMs) {
      throw new Error(`Notification did not meet SLA: ${duration}ms > ${maxDurationMs}ms`);
    }
  }

  /**
   * Assert template variables are replaced
   */
  static assertTemplateVariablesReplaced(text: string): void {
    const unreplacedPattern = /\{[a-zA-Z_][a-zA-Z0-9_]*\}/;
    if (unreplacedPattern.test(text)) {
      throw new Error(`Text contains unreplaced variables: ${text}`);
    }
  }

  /**
   * Assert job has retry configuration
   */
  static assertJobHasRetryConfig(job: any): void {
    if (!job.options || job.options.attempts === undefined) {
      throw new Error('Job missing retry configuration');
    }
  }
}
