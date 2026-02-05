import { Notification, NotificationChannel } from '../interfaces.js';

export class NotificationServiceCore {
  private channels: Map<string, NotificationChannel> = new Map();

  constructor(private cacheClient?: any, private metrics?: any, private logger?: any) {}

  addChannel(channel: NotificationChannel): void {
    this.channels.set(channel.name, channel);
    this.logger?.info?.(`Notification channel added: ${channel.name}`);
  }

  async send(notification: Notification): Promise<Notification> {
    notification.createdAt = notification.createdAt || new Date().toISOString();
    notification.status = 'pending';

    const channels = notification.channels || ['in_app'];
    const results = await Promise.all(
      channels.map(async (ch) => {
        const channel = this.channels.get(ch);
        if (!channel) return false;
        try {
          const ok = await channel.send(notification);
          if (ok) this.metrics?.increment?.('notification_sent', { channel: ch, type: notification.type });
          else this.metrics?.increment?.('notification_failed', { channel: ch, type: notification.type });
          return ok;
        } catch (err) {
          this.logger?.error?.(`Channel ${ch} failed`, err);
          this.metrics?.increment?.('notification_failed', { channel: ch, type: notification.type });
          return false;
        }
      })
    );

    const successCount = results.filter(Boolean).length;
    const totalCount = results.length || 1;
    notification.status = successCount === totalCount ? 'sent' : 'failed';
    notification.sentAt = new Date().toISOString();
    notification.updatedAt = new Date().toISOString();

    // Persist into cache for retrieval
    try {
      await this.cacheClient?.set?.(`notification:${notification.id}`, JSON.stringify(notification), 604800);
    } catch (err) {
      this.logger?.error?.('Failed to persist notification', err);
    }

    this.logger?.info?.(`Notification ${notification.id} status=${notification.status}`);
    return notification;
  }

  async getNotification(id: string): Promise<Notification | null> {
    try {
      const raw = await this.cacheClient?.get?.(`notification:${id}`);
      if (!raw) return null;
      return JSON.parse(raw) as Notification;
    } catch (err) {
      this.logger?.error?.('Failed to get notification', err);
      return null;
    }
  }
}
