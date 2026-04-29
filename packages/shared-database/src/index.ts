import * as PrismaClientModule from '../generated/prisma-client/index.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

export import Prisma = PrismaClientModule.Prisma;
export const PrismaClient = PrismaClientModule.PrismaClient;
export type PrismaClient = PrismaClientModule.PrismaClient;
export type BookingStatus = PrismaClientModule.BookingStatus;
export { SalesChannel } from '../generated/prisma-client/index.js';
export { TransactionCategory } from '../generated/prisma-client/index.js';
export { TenantStatus, TenantType } from '../generated/prisma-client/index.js';
export { ApprovalLevel } from '../generated/prisma-client/index.js';
export { Tenant } from '../generated/prisma-client/index.js';
export { CommissionRule } from '../generated/prisma-client/index.js';
export { CommissionSharingRule } from '../generated/prisma-client/index.js';
export { CommissionTransaction } from '../generated/prisma-client/index.js';
export type CreateCommissionRuleInput = Prisma.CommissionRuleCreateInput;
export type UpdateCommissionRuleInput = Prisma.CommissionRuleUpdateInput;
export type CreateCommissionSharingRuleInput = Prisma.CommissionSharingRuleCreateInput;
export type CommissionConditions = Record<string, any>;
export type CommissionCalculationResult = {
  totalCommission: number;
  agentCommission: number;
  corporateCommission: number;
  netCommission: number;
  calculationDetails: Record<string, any>;
};

// Ensure environment variables are loaded
const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Find project root (works for both src/ and dist/src/ execution)
// The compiled output is in dist/src/, source is in src/
const isDist = __dirname.endsWith(path.join('dist', 'src')) || 
               __dirname.includes(path.sep + 'dist' + path.sep + 'src');
const relativePath = isDist ? '../../../../.env' : '../../../.env';
const rootEnvPath = path.resolve(__dirname, relativePath);
console.log(`[SharedDatabase] Loading root .env from: ${rootEnvPath} (isDist: ${isDist})`);
dotenv.config(); // Load local .env
const result = dotenv.config({ path: rootEnvPath }); // Load root .env
if (result.error) {
  console.error(`[SharedDatabase] Failed to load root .env: ${result.error.message}`);
} else {
  console.log(`[SharedDatabase] Root .env loaded successfully`);
}

let prismaClient: PrismaClient | null = null;

/**
 * Gets a Prisma client instance, initialized with the appropriate database URL.
 * It searches for DATABASE_URL, then service-specific URLs like BOOKING_DATABASE_URL.
 */
export function getBookingDb(url?: string): PrismaClient {
  if (!prismaClient) {
    // Fallback chain for database URL
    const connectionUrl = url || 
                         process.env.DATABASE_URL || 
                         process.env.BOOKING_DATABASE_URL || 
                         process.env.MASTER_DATABASE_URL ||
                         process.env.PAYMENT_DATABASE_URL ||
                         process.env.INVENTORY_DATABASE_URL ||
                         process.env.NOTIFICATION_DATABASE_URL ||
                         process.env.CRM_DATABASE_URL;

    if (!connectionUrl && process.env.NODE_ENV !== 'test') {
      console.warn('⚠️ [SharedDatabase] No DATABASE_URL found in environment. Prisma may fail to initialize.');
    }

    if (connectionUrl) {
      process.env.DATABASE_URL = connectionUrl;
    }

    prismaClient = new PrismaClient({
      datasources: connectionUrl ? {
        db: {
          url: connectionUrl
        }
      } : undefined
    });

  }
  return prismaClient;
}

// Export a default prisma instance for convenience
export const prisma = getBookingDb();

export function getCrmDb(): PrismaClient {
  return getBookingDb(process.env.CRM_DATABASE_URL || process.env.MASTER_DATABASE_URL);
}

export function getMasterDb(): PrismaClient {
  return getBookingDb(process.env.MASTER_DATABASE_URL);
}

export function getPaymentDb(): PrismaClient {
  return getBookingDb(process.env.PAYMENT_DATABASE_URL || process.env.DATABASE_URL);
}

export function getInventoryDb(): PrismaClient {
  return getBookingDb(process.env.INVENTORY_DATABASE_URL || process.env.DATABASE_URL);
}

export function getNotificationDb(): PrismaClient {
  return getBookingDb(process.env.NOTIFICATION_DATABASE_URL || process.env.DATABASE_URL);
}

export function getDocumentDb(): PrismaClient {
  return getBookingDb(process.env.DOCUMENT_DATABASE_URL || process.env.DATABASE_URL);
}

export function getContactDb(): PrismaClient {
  return getBookingDb(process.env.CRM_DATABASE_URL || process.env.DATABASE_URL);
}

export async function healthCheck(client: PrismaClient): Promise<boolean> {
  try {
    await client.$queryRaw`SELECT 1`;
    return true;
  } catch (error: unknown) {
    console.error('Database health check failed:', error);
    return false;
  }
}