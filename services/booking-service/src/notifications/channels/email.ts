import { Notification, NotificationChannel } from '../interfaces.js';

export class EmailChannel implements NotificationChannel {
  name = 'email';

  constructor(private transporter?: any) {}

  async send(notification: Notification): Promise<boolean> {
    // Minimal implementation: integrate with real email provider in production
    try {
      // If transporter provided, use it; otherwise log and succeed
      if (this.transporter && this.transporter.sendMail) {
        await this.transporter.sendMail({
          to: notification.userId,
          subject: notification.title,
          text: notification.message,
        });
      } else {
        console.info(`[EmailChannel] mock send to ${notification.userId}: ${notification.title}`);
      }
      return true;
    } catch (err) {
      console.error('[EmailChannel] send error', err);
      return false;
    }
  }
}
