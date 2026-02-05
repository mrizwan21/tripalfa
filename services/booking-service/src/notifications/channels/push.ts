import { Notification, NotificationChannel } from '../interfaces.js';

export class PushChannel implements NotificationChannel {
  name = 'push';

  constructor(private client?: any) {}

  async send(notification: Notification): Promise<boolean> {
    try {
      // Placeholder: integrate with FCM/APNs
      if (this.client && this.client.send) {
        await this.client.send(notification.userId, { title: notification.title, body: notification.message });
      } else {
        console.info(`[PushChannel] mock send to ${notification.userId}: ${notification.title}`);
      }
      return true;
    } catch (err) {
      console.error('[PushChannel] send error', err);
      return false;
    }
  }
}
