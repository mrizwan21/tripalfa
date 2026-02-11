/**
 * Service Configuration
 * Central configuration management for Document Service
 */

import dotenv from 'dotenv';
import { createLogger } from '../utils/logger';

// Load environment variables
dotenv.config();

const logger = createLogger('Config');

export interface ServiceConfig {
  // Server
  port: number;
  nodeEnv: 'development' | 'production' | 'test';
  host: string;

  // Database
  databaseUrl: string;
  databasePoolMin: number;
  databasePoolMax: number;

  // Cache
  redisUrl: string;
  cacheEnabled: boolean;
  cacheTTL: number;

  // JWT
  jwtSecret: string;
  jwtExpiry: number;

  // Storage
  storageType: 'local' | 's3';
  storagePath: string;
  maxFileSize: string;

  // Document Processing
  templateCacheEnabled: boolean;
  documentRetentionDays: number;
  autoCleanupEnabled: boolean;
  pdfTimeout: number;

  // External Services
  apiGatewayUrl: string;
  notificationServiceUrl: string;

  // Logging
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

/**
 * Parse environment variables into configuration
 */
function parseConfig(): ServiceConfig {
  const config: ServiceConfig = {
    // Server
    port: parseInt(process.env.SERVICE_PORT || '3004'),
    nodeEnv: (process.env.NODE_ENV as any) || 'development',
    host: process.env.SERVICE_HOST || '0.0.0.0',

    // Database
    databaseUrl: process.env.DATABASE_URL || 'postgresql://user:password@localhost:5432/document_service',
    databasePoolMin: parseInt(process.env.DATABASE_POOL_MIN || '2'),
    databasePoolMax: parseInt(process.env.DATABASE_POOL_MAX || '10'),

    // Cache
    redisUrl: process.env.REDIS_URL || 'redis://localhost:6379',
    cacheEnabled: process.env.CACHE_ENABLED !== 'false',
    cacheTTL: parseInt(process.env.CACHE_TTL || '3600'),

    // JWT
    jwtSecret: process.env.JWT_SECRET || 'dev-secret-key',
    jwtExpiry: parseInt(process.env.JWT_EXPIRY || '86400'),

    // Storage
    storageType: (process.env.STORAGE_TYPE as any) || 'local',
    storagePath: process.env.STORAGE_PATH || './uploads',
    maxFileSize: process.env.MAX_FILE_SIZE || '50m',

    // Document Processing
    templateCacheEnabled: process.env.TEMPLATE_CACHE_ENABLED !== 'false',
    documentRetentionDays: parseInt(process.env.DOCUMENT_RETENTION_DAYS || '90'),
    autoCleanupEnabled: process.env.AUTO_CLEANUP_ENABLED !== 'false',
    pdfTimeout: parseInt(process.env.PDF_TIMEOUT_MS || '30000'),

    // External Services
    apiGatewayUrl: process.env.API_GATEWAY_URL || 'http://localhost:3000',
    notificationServiceUrl: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3005',

    // Logging
    logLevel: (process.env.LOG_LEVEL as any) || 'info',
  };

  return config;
}

/**
 * Validate required configuration
 */
function validateConfig(config: ServiceConfig): void {
  const validStorageTypes = ['local', 's3'];
  const validNodeEnvs = ['development', 'production', 'test'];
  const validLogLevels = ['debug', 'info', 'warn', 'error'];

  if (!validNodeEnvs.includes(config.nodeEnv)) {
    throw new Error(`Invalid NODE_ENV: ${config.nodeEnv}`);
  }

  if (!validStorageTypes.includes(config.storageType)) {
    throw new Error(`Invalid STORAGE_TYPE: ${config.storageType}`);
  }

  if (!validLogLevels.includes(config.logLevel)) {
    throw new Error(`Invalid LOG_LEVEL: ${config.logLevel}`);
  }

  if (!config.databaseUrl) {
    throw new Error('DATABASE_URL is required');
  }

  if (config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid SERVICE_PORT: ${config.port}`);
  }

  logger.info('Configuration validated successfully');
}

// Parse and validate configuration
const config = parseConfig();
validateConfig(config);

logger.info('Service configuration loaded', {
  environment: config.nodeEnv,
  port: config.port,
  storage: config.storageType,
  cache: config.cacheEnabled,
});

export default config;
