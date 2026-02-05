export type NotificationStatus = 'pending' | 'sent' | 'failed' | 'delivered';

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type?: string;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  channels: string[];
  status?: NotificationStatus;
  createdAt?: string;
  sentAt?: string;
  deliveredAt?: string;
  updatedAt?: string;
  metadata?: Record<string, any>;
}

export interface NotificationChannel {
  send(notification: Notification): Promise<boolean>;
  name: string;
}
