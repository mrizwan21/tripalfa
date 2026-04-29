// ============================================================
// OTA PLATFORM - SHARED CONFIG
// ============================================================
// Environment configuration and validation
// ============================================================

import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

  // Database
  MASTER_DATABASE_URL: z.string().url(),
  BOOKING_DATABASE_URL: z.string().url(),
  PAYMENT_DATABASE_URL: z.string().url(),
  INVENTORY_DATABASE_URL: z.string().url(),
  RULES_DATABASE_URL: z.string().url(),
  CRM_DATABASE_URL: z.string().url(),
  NOTIFICATION_DATABASE_URL: z.string().url(),

  // Redis
  REDIS_URL: z.string().url().default('redis://localhost:6379'),

  // Auth
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRY: z.string().default('24h'),

  // Ports
  AUTH_SERVICE_PORT: z.coerce.number().default(3000),
  BOOKING_SERVICE_PORT: z.coerce.number().default(3001),
  TENANT_SERVICE_PORT: z.coerce.number().default(3002),
  PAYMENT_SERVICE_PORT: z.coerce.number().default(3003),
  INVENTORY_SERVICE_PORT: z.coerce.number().default(3004),
  NOTIFICATION_SERVICE_PORT: z.coerce.number().default(3005),
  SUPPLIER_SERVICE_PORT: z.coerce.number().default(3006),
  DOCUMENT_SERVICE_PORT: z.coerce.number().default(3007),
  REPORTING_SERVICE_PORT: z.coerce.number().default(3008),
  WORKFLOW_SERVICE_PORT: z.coerce.number().default(3009),
  RULE_ENGINE_SERVICE_PORT: z.coerce.number().default(3010),
  SEARCH_SERVICE_PORT: z.coerce.number().default(3021),
  CONTACT_SERVICE_PORT: z.coerce.number().default(3025),

  // Gateway
  API_GATEWAY_URL: z.string().url().default('http://localhost:3030'),

  // External APIs
  DUFFEL_API_KEY: z.string().optional(),
  DUFFEL_API_URL: z.string().url().default('https://api.duffel.com'),
  LITEAPI_API_KEY: z.string().optional(),
  LITEAPI_API_BASE_URL: z.string().url().default('https://api.liteapi.travel/v3.0'),
  LITEAPI_BOOK_BASE_URL: z.string().url().default('https://book.liteapi.travel/v3.0'),
  LITEAPI_DA_BASE_URL: z.string().url().default('https://da.liteapi.travel/v1'),

  // Webhooks
  WEBHOOK_SECRET: z.string().optional(),

  // Internal Service URLs
  SUPPLIER_SERVICE_URL: z.string().url().default('http://localhost:3006'),
  BOOKING_SERVICE_URL: z.string().url().default('http://localhost:3001'),
  NOTIFICATION_SERVICE_URL: z.string().url().default('http://localhost:3005'),

  // Email
  RESEND_API_KEY: z.string().optional(),
});

export type EnvConfig = z.infer<typeof EnvSchema>;

export function validateEnv(): EnvConfig {
  const result = EnvSchema.safeParse(process.env);
  if (!result.success) {
    console.error('❌ Invalid environment variables:');
    console.error(result.error.flatten().fieldErrors);
    throw new Error('Invalid environment configuration');
  }
  return result.data;
}

export const config = validateEnv();
