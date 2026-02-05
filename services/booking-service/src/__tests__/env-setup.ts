import { config as dotenvConfig } from 'dotenv';

// Load test environment variables BEFORE any modules are imported
dotenvConfig({ path: '.env.test' });

// Set default test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://neondb_owner:REDACTED@ep-ancient-base-afwb58uq-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';