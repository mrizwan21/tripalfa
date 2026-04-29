/**
 * Webhook Repository
 * Handles webhook log CRUD operations.
 */

import { WebhookLog } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export interface CreateWebhookLogInput {
  supplier: string;
  eventType: string;
  raw_payload: any;
  processed?: boolean;
  processedAt?: Date | null;
  error?: string | null;
  retryCount?: number;
}

export async function createWebhookLog(data: CreateWebhookLogInput): Promise<WebhookLog> {
  const db = await getBookingDb();
  return db.webhookLog.create({
    data: {
      supplier: data.supplier,
      eventType: data.eventType,
      raw_payload: data.raw_payload,
      processed: data.processed ?? false,
      processedAt: data.processedAt ?? null,
      error: data.error ?? null,
      retryCount: data.retryCount ?? 0,
    },
  });
}
