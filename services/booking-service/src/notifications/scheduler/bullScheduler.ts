import { Notification } from '../interfaces.js';

type JobPayload = { notification: Notification };

export class BullScheduler {
  private queue: any | null = null;

  constructor(private connectionString?: string, private logger?: any) {
    // attempt to lazy-load BullMQ to avoid hard dependency at scaffold time
    try {
       
      const { Queue } = require('bullmq');
      this.queue = new Queue('notifications', { connection: { url: connectionString } });
    } catch (err) {
      this.logger?.warn?.('BullMQ not installed; falling back to in-memory scheduler');
      this.queue = null;
    }
  }

  async schedule(notification: Notification, when: Date): Promise<string> {
    const delay = Math.max(0, when.getTime() - Date.now());
    if (this.queue) {
      const job = await this.queue.add('sendNotification', { notification } as JobPayload, { delay });
      return job.id;
    }

    // Simple in-memory fallback
    const id = `mem-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    setTimeout(() => {
      // consumer should poll or this module could emit an event; scaffold only
      this.logger?.info?.(`In-memory scheduled job fired ${id} for notification ${notification.id}`);
    }, delay);
    return id;
  }
}
