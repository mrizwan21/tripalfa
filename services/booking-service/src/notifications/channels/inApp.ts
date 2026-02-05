import { Notification, NotificationChannel } from '../interfaces.js';

export class InAppChannel implements NotificationChannel {
  name = 'in_app';

  constructor(private cacheClient?: any) {}

  async send(notification: Notification): Promise<boolean> {
    try {
      const key = `user_notifications:${notification.userId}`;
      if (this.cacheClient && this.cacheClient.get && this.cacheClient.set) {
        const raw = (await this.cacheClient.get(key)) || '[]';
        const list = JSON.parse(raw as string);
        list.push(notification);
        if (list.length > 100) list.splice(0, list.length - 100);
        await this.cacheClient.set(key, JSON.stringify(list), 86400);
      } else {
        console.info(`[InAppChannel] cached for ${notification.userId}: ${notification.title}`);
      }
      return true;
    } catch (err) {
      console.error('[InAppChannel] send error', err);
      return false;
    }
  }
}
