export type NotificationChannel =
  | "email"
  | "sms"
  | "push"
  | "webhook"
  | "in_app";

export type EmailChannelSettings = {
  enabled?: boolean;
  provider?: string;
  senderEmail?: string;
  senderName?: string;
  [key: string]: any;
};

export type SMSChannelSettings = {
  enabled?: boolean;
  provider?: string;
  accountId?: string;
  authKey?: string;
  [key: string]: any;
};

export type PushChannelSettings = {
  enabled?: boolean;
  provider?: string;
  apiKey?: string;
  [key: string]: any;
};

export type WebhookChannelSettings = {
  enabled?: boolean;
  webhooks?: any[];
  [key: string]: any;
};

export interface NotificationChannelConfig {
  type: NotificationChannel;
  provider: string;
  displayName: string;
  isActive: boolean;
  settings:
    | EmailChannelSettings
    | SMSChannelSettings
    | PushChannelSettings
    | WebhookChannelSettings;
  isDefault?: boolean;
}
