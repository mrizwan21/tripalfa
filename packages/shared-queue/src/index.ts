// ============================================================
// OTA PLATFORM - SHARED QUEUE
// ============================================================
// BullMQ/Redis queue abstractions
// ============================================================

import { Queue, Worker, Job, QueueEvents } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis(process.env.REDIS_URL || 'redis://localhost:6379', {
  maxRetriesPerRequest: null,
});

export enum QueueName {
  NOTIFICATIONS = 'notifications',
  PAYMENTS = 'payments',
  BOOKINGS = 'bookings',
  AUDIT = 'audit',
  EMAIL = 'email',
  TICKETS = 'ticketing',
  THEMES = 'themes',
}

export type CentralizedEventType = 'TICKET_CREATED' | 'THEME_UPDATED';

export interface QueueJobData {
  tenantId?: string;
  userId?: string;
  bookingRef?: string;
  [key: string]: any;
}

export class QueueManager {
  private static queues = new Map<QueueName, Queue>();
  private static workers = new Map<string, Worker>();

  static getQueue(name: QueueName): Queue {
    if (!this.queues.has(name)) {
      this.queues.set(name, new Queue(name, { connection }));
    }
    return this.queues.get(name)!;
  }

  static async enqueue(queueName: QueueName, data: QueueJobData, options = {}): Promise<Job> {
    const queue = this.getQueue(queueName);
    return queue.add(queueName, data, { removeOnComplete: true, removeOnFail: false, ...options });
  }

  static createWorker(
    queueName: QueueName,
    processor: (job: Job) => Promise<any>,
    concurrency = 10
  ): Worker {
    const key = `${queueName}-${processor.name}`;
    if (this.workers.has(key)) return this.workers.get(key)!;

    const worker = new Worker(queueName, processor, {
      connection,
      concurrency,
    });

    this.workers.set(key, worker);
    return worker;
  }

  static async getQueueEvents(queueName: QueueName): Promise<QueueEvents> {
    return new QueueEvents(queueName, { connection });
  }

  static async close(): Promise<void> {
    for (const [, worker] of this.workers) {
      await worker.close();
    }
    for (const [, queue] of this.queues) {
      await queue.close();
    }
    await connection.quit();
  }
}
