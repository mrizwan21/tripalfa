import { Notification, NotificationChannel } from '../interfaces.js';

export class SMSChannel implements NotificationChannel {
  name = 'sms';

  constructor(private provider?: any) {}

  async send(notification: Notification): Promise<boolean> {
    try {
      if (this.provider && this.provider.sendSMS) {
        await this.provider.sendSMS(notification.userId, notification.message);
      } else {
        console.info(`[SMSChannel] mock send to ${notification.userId}: ${notification.message}`);
      }
      return true;
    } catch (err) {
      console.error('[SMSChannel] send error', err);
      return false;
    }
  }
}
