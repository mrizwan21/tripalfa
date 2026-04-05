/**
 * Webhook Delivery Types
 *
 * Defines types for webhook delivery tracking system
 */

export enum WebhookDeliveryStatus {
  PENDING = 'PENDING',
  DELIVERING = 'DELIVERING',
  DELIVERED = 'DELIVERED',
  FAILED = 'FAILED',
  RETRYING = 'RETRYING',
  DEAD_LETTER = 'DEAD_LETTER',
}

export enum WebhookProvider {
  DUFFEL = 'duffel',
  LITEAPI = 'liteapi',
  INTERNAL = 'internal',
  STRIPE = 'stripe',
  OTHER = 'other',
}

export interface WebhookDelivery {
  id: string;
  // Source information
  provider: WebhookProvider | string;
  eventType: string;
  webhookId?: string;
  payload?: any;
  signature?: string;
  verificationStatus?: 'verified' | 'invalid' | 'skipped';

  // Target information
  endpointUrl: string;
  customerId?: string;
  subscriptionId?: string;

  // Delivery status
  status: WebhookDeliveryStatus;
  attemptCount: number;
  maxRetries: number;
  nextRetryAt?: Date;

  // Response details
  responseStatusCode?: number;
  responseBody?: string;
  responseHeaders?: any;
  deliveredAt?: Date;

  // Error information
  lastError?: string;
  errorCode?: string;

  // Timestamps
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateWebhookDeliveryInput {
  provider: WebhookProvider | string;
  eventType: string;
  webhookId?: string;
  payload?: any;
  signature?: string;
  verificationStatus?: 'verified' | 'invalid' | 'skipped';
  endpointUrl: string;
  customerId?: string;
  subscriptionId?: string;
  maxRetries?: number;
}

export interface UpdateWebhookDeliveryInput {
  status?: WebhookDeliveryStatus;
  attemptCount?: number;
  nextRetryAt?: Date;
  responseStatusCode?: number;
  responseBody?: string;
  responseHeaders?: any;
  deliveredAt?: Date;
  lastError?: string;
  errorCode?: string;
}

export interface WebhookDeliveryFilter {
  provider?: string;
  eventType?: string;
  status?: WebhookDeliveryStatus;
  customerId?: string;
  subscriptionId?: string;
  fromDate?: Date;
  toDate?: Date;
}

export interface PaginatedWebhookDeliveries {
  data: WebhookDelivery[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
