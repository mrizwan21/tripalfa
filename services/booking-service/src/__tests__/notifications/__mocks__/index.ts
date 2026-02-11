import { CacheService } from '../../../cache/redis';

/**
 * Mock implementations for testing
 */

export class MockCacheService implements Partial<CacheService> {
  private store: Map<string, string> = new Map();

  async get<T>(key: string): Promise<T | null> {
    const data = this.store.get(key);
    return data ? JSON.parse(data) as T : null;
  }

  async set(key: string, value: any, ttl?: number): Promise<void> {
    this.store.set(key, JSON.stringify(value));
  }

  async del(key: string): Promise<void> {
    this.store.delete(key);
  }

  async exists(key: string): Promise<boolean> {
    return this.store.has(key);
  }

  async incr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    const next = current + 1;
    this.store.set(key, next.toString());
    return next;
  }

  async decr(key: string): Promise<number> {
    const current = parseInt(this.store.get(key) || '0', 10);
    const next = current - 1;
    this.store.set(key, next.toString());
    return next;
  }

  async expireAt(key: string, timestamp: number): Promise<boolean> {
    // Mock implementation - just return true if key exists
    return this.store.has(key);
  }

  clear(): void {
    this.store.clear();
  }

  getAll(): Map<string, string> {
    return new Map(this.store);
  }

  getStoredKeys(): string[] {
    return Array.from(this.store.keys());
  }
}

export class MockEmailChannel {
  private config: any;
  private deliveryLog: any[] = [];

  constructor(config: any) {
    this.config = config;
  }

  async send(notification: any): Promise<boolean> {
    this.deliveryLog.push({
      timestamp: new Date(),
      notification,
      status: 'sent',
    });
    return true;
  }

  validateConfig(): boolean {
    return !!(this.config.apiKey && this.config.fromAddress);
  }

  getDeliveryLog(): any[] {
    return this.deliveryLog;
  }

  failNextSend(): void {
    // Will cause next send to fail
    this.config.apiKey = null;
  }

  reset(): void {
    this.deliveryLog = [];
    this.config = { ...this.config };
  }
}

export class MockSmsChannel {
  private config: any;
  private deliveryLog: any[] = [];

  constructor(config: any) {
    this.config = config;
  }

  async send(notification: any): Promise<boolean> {
    this.deliveryLog.push({
      timestamp: new Date(),
      notification,
      status: 'sent',
    });
    return true;
  }

  validateConfig(): boolean {
    return !!(
      this.config.accountSid &&
      this.config.authToken &&
      this.config.fromNumber
    );
  }

  getDeliveryLog(): any[] {
    return this.deliveryLog;
  }

  failNextSend(): void {
    this.config.accountSid = null;
  }

  reset(): void {
    this.deliveryLog = [];
  }
}

export class MockPushChannel {
  private config: any;
  private deliveryLog: any[] = [];

  constructor(config: any) {
    this.config = config;
  }

  async send(notification: any): Promise<boolean> {
    this.deliveryLog.push({
      timestamp: new Date(),
      notification,
      status: 'sent',
    });
    return true;
  }

  validateConfig(): boolean {
    return !!(this.config.serverKey || this.config.senderId);
  }

  getDeliveryLog(): any[] {
    return this.deliveryLog;
  }

  failNextSend(): void {
    this.config.serverKey = null;
  }

  reset(): void {
    this.deliveryLog = [];
  }
}

export class MockInAppChannel {
  private cache: any;

  constructor(cache: any) {
    this.cache = cache;
  }

  async send(notification: any): Promise<boolean> {
    const key = `user_notifications:${notification.userId}`;
    const existing = await this.cache.get(key);
    const notifications = existing ? JSON.parse(existing) : [];
    notifications.push(notification);
    await this.cache.set(key, JSON.stringify(notifications));
    return true;
  }

  validateConfig(): boolean {
    return true;
  }

  async getNotifications(userId: string): Promise<any[]> {
    const key = `user_notifications:${userId}`;
    const data = await this.cache.get(key);
    return data ? JSON.parse(data) : [];
  }
}

export class MockBullQueue {
  private jobs: Map<string, any> = new Map();
  private processedJobs: any[] = [];
  private failJobs: Set<string> = new Set();

  async add(name: string, data: any, options?: any): Promise<any> {
    const jobId = `job_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const job = {
      id: jobId,
      name,
      data,
      options,
      attempts: 0,
      status: 'pending',
      createdAt: new Date(),
    };
    this.jobs.set(jobId, job);
    return job;
  }

  async process(processor: (job: any) => Promise<any>): Promise<void> {
    for (const [jobId, job] of this.jobs) {
      if (this.failJobs.has(jobId)) {
        job.status = 'failed';
        continue;
      }

      try {
        await processor(job);
        job.status = 'completed';
        this.processedJobs.push(job);
      } catch (error) {
        job.status = 'failed';
        job.error = error;
      }
    }
  }

  async getJob(jobId: string): Promise<any | undefined> {
    return this.jobs.get(jobId);
  }

  getProcessedJobs(): any[] {
    return this.processedJobs;
  }

  simulateJobFailure(jobId: string): void {
    this.failJobs.add(jobId);
  }

  clear(): void {
    this.jobs.clear();
    this.processedJobs = [];
    this.failJobs.clear();
  }
}

/**
 * Mock logger for testing
 */
export class MockLogger {
  private logs: any[] = [];

  info(message: string, meta?: any): void {
    this.logs.push({ level: 'info', message, meta, timestamp: new Date() });
  }

  error(message: string, meta?: any): void {
    this.logs.push({ level: 'error', message, meta, timestamp: new Date() });
  }

  warn(message: string, meta?: any): void {
    this.logs.push({ level: 'warn', message, meta, timestamp: new Date() });
  }

  debug(message: string, meta?: any): void {
    this.logs.push({ level: 'debug', message, meta, timestamp: new Date() });
  }

  getLogs(): any[] {
    return this.logs;
  }

  getLogsByLevel(level: string): any[] {
    return this.logs.filter(log => log.level === level);
  }

  clear(): void {
    this.logs = [];
  }
}

/**
 * Mock metrics store for testing
 */
export class MockMetricsStore {
  private metrics: Map<string, number> = new Map();
  private events: any[] = [];

  increment(name: string, tags?: any): void {
    const key = `${name}:${JSON.stringify(tags || {})}`;
    const current = this.metrics.get(key) || 0;
    this.metrics.set(key, current + 1);
    this.events.push({ type: 'increment', name, tags, timestamp: new Date() });
  }

  gauge(name: string, value: number, tags?: any): void {
    const key = `${name}:${JSON.stringify(tags || {})}`;
    this.metrics.set(key, value);
    this.events.push({ type: 'gauge', name, value, tags, timestamp: new Date() });
  }

  histogram(name: string, value: number, tags?: any): void {
    this.events.push({ type: 'histogram', name, value, tags, timestamp: new Date() });
  }

  getMetric(name: string, tags?: any): number {
    const key = `${name}:${JSON.stringify(tags || {})}`;
    return this.metrics.get(key) || 0;
  }

  getEvents(): any[] {
    return this.events;
  }

  clear(): void {
    this.metrics.clear();
    this.events = [];
  }
}
