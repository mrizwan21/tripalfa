import { jest } from '@jest/globals';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
const request = require('supertest');
const jwt = require('jsonwebtoken');
const { config: dotenvConfig } = require('dotenv');

// Load test environment variables
dotenvConfig({ path: '.env.test' });

// Stable env for tests - set before importing app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-key';
process.env.REDIS_HOST = process.env.REDIS_HOST || 'localhost';
process.env.REDIS_PORT = process.env.REDIS_PORT || '6379';
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgresql://neondb_owner:REDACTED@ep-ancient-base-afwb58uq-pooler.c-2.us-west-2.aws.neon.tech/neondb?sslmode=require';

import { prisma } from '../database/index';
import app from '../app';
import {
  post,
  put,
  del,
  withAuth,
  createAdminToken,
  createAgentToken,
  createSupervisorToken,
  createManagerToken,
  postAuth,
  expectSuccess,
  expectError,
  expectBookingResponse,
  expectCustomerResponse,
  expectSupplierResponse,
  generateUniqueEmail,
  generatePhoneNumber,
  generatePNR,
  generateDateRange,
  buildBookingRequest,
  buildCustomerRequest,
  buildSupplierRequest
} from './integration/utils.js';

// Augment globals for convenience in tests
declare global {
   
  var api: import('supertest').SuperTest<import('supertest').Test>;
   
  var jwtSign: any;
   
  var jwtVerify: any;
   
  var prismaClient: typeof prisma;
   
  var testEnv: { isIntegrationTest: boolean; shouldResetDB: boolean };

  // Factories
   
  var makeCustomer: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeSupplier: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeBooking: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeCompany: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeBranch: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeDocument: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeAmendment: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeRefund: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeAuditLog: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makeNote: (overrides?: Record<string, unknown>) => Promise<any>;

  // Auth token helpers
   
  var createAdminToken: (userId?: string) => string;
   
  var createAgentToken: (userId?: string) => string;
   
  var createSupervisorToken: (userId?: string) => string;
   
  var createManagerToken: (userId?: string) => string;

  // HTTP helpers
   
  var post: (path: string, data?: any) => any;
   
  var put: (path: string, data?: any) => any;
   
  var del: (path: string) => any;
   
  var withAuth: (token?: string) => { Authorization: string };
   
  var postAuth: (path: string, data: any, role: string) => Promise<any>;

  // Assertion helpers
   
  var expectSuccess: (res: any, status?: number) => void;
   
  var expectError: (res: any, status?: number, message?: string) => void;
   
  var expectBookingResponse: (res: any) => void;
   
  var expectCustomerResponse: (res: any) => void;
   
  var expectSupplierResponse: (res: any) => void;

  // Data generation helpers
   
  var generateUniqueEmail: (prefix?: string) => string;
   
  var generatePhoneNumber: () => string;
   
  var generatePNR: () => string;
   
  var generateDateRange: (daysFromNow?: number) => { checkIn: string; checkOut: string };

  // Request builders
   
  var buildBookingRequest: (overrides?: Record<string, unknown>) => any;
   
  var buildCustomerRequest: (overrides?: Record<string, unknown>) => any;
   
  var buildSupplierRequest: (overrides?: Record<string, unknown>) => any;
   
  var makePricingRule: (overrides?: Record<string, unknown>) => Promise<any>;
}

// Quiet console noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Global test utilities
global.prismaClient = prisma;
global.testEnv = {
  isIntegrationTest: process.env.INTEGRATION_DB === 'true',
  shouldResetDB: process.env.TEST_DB_RESET === 'true'
};

// Supertest app instance
beforeAll(async () => {
  global.api = request(app);

  // Optional DB connect for integration tests
  if (process.env.INTEGRATION_DB === 'true') {
    console.log('Skipping Prisma connection for debugging...');
    /*
    try {
      await prisma.$connect();
    } catch (e) {
      // Continue without hard failing when DB is not available
    }
    */
  }
});

// Clear mocks and optionally truncate tables before each test
beforeEach(async () => {
  jest.clearAllMocks();

  // Truncate all relevant tables in test DB only when enabled
  if (process.env.INTEGRATION_DB === 'true' && process.env.TEST_DB_RESET === 'true') {
    console.log('Skipping database truncation for debugging...');
    /*
    try {
      await prisma.$transaction([
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_tags" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "tags" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "audit_logs" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_notes" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_documents" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_communications" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_amendments" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_refunds" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "booking_notifications" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "bookings" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "customers" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "branches" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "companies" CASCADE`),
        prisma.$executeRawUnsafe(`TRUNCATE TABLE "suppliers" CASCADE`),
      ]);
    } catch (e) {
      // Allow tests to proceed even if truncate is not possible
      console.warn('Database truncation failed:', e);
    }
    */
  }
});

// JWT sign/verify mocks - use real JWT implementation for proper token handling
// Capture original functions before spying to avoid recursion
const originalJwtSign = jwt.sign;
const originalJwtVerify = jwt.verify;

global.jwtSign = jest
  .spyOn(jwt, 'sign')
  .mockImplementation((payload: any, secret: any, options?: any) => {
    // Use real JWT signing so tokens can be properly decoded
    return originalJwtSign(payload, secret || process.env.JWT_SECRET || 'test-jwt-secret-key', options);
  }) as any;

global.jwtVerify = jest
  .spyOn(jwt, 'verify')
  .mockImplementation(((token: string, secret: string, options?: any, callback?: any) => {
    try {
      // Use real JWT verification to decode the actual token payload
      const decoded = originalJwtVerify(token, secret || process.env.JWT_SECRET || 'test-jwt-secret-key', options);

      if (typeof callback === 'function') {
        callback(null, decoded);
        return;
      }
      return decoded;
    } catch (error) {
      if (typeof callback === 'function') {
        callback(error, null);
        return;
      }
      throw error;
    }
  }) as unknown as typeof jwt.verify);

// Simple ID generator for non-DB factories
const randomId = () => `c${Math.random().toString(36).slice(2, 12)}`;

// Factories
global.makeCustomer = async (overrides = {}) => {
  const data = {
    name: 'John Test',
    email: `john.${Date.now()}@example.com`,
    phone: '+1234567890',
    type: 'individual' as const,
    companyId: null,
    ...overrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.customer.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeSupplier = async (overrides = {}) => {
  const data = {
    name: 'Supplier Test',
    contactEmail: `supplier.${Date.now()}@example.com`,
    type: 'airline' as const,
    contactPhone: '+1987654321',
    contactName: 'Test Contact',
    ...overrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.supplier.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeBooking = async (overrides = {}) => {
  const { customer, ...restOverrides } = overrides;
  const resolvedCustomer = customer || (await global.makeCustomer());
  const data = {
    reference: `BK-${Date.now()}`,
    segment: 'FLIGHT' as const,
    status: 'CONFIRMED' as const,
    paymentStatus: 'PAID' as const,
    customerId: resolvedCustomer.id,
    customerName: resolvedCustomer.name,
    customerEmail: resolvedCustomer.email,
    serviceType: 'flight' as const,
    supplierId: null,
    supplierName: null,
    customerPrice: new Decimal(100),
    supplierPrice: new Decimal(80),
    markup: new Decimal(20),
    taxes: new Decimal(0),
    fees: new Decimal(0),
    currency: 'USD' as const,
    paymentMethod: 'wallet' as const,
    profit: new Decimal(20),
    bookedAt: new Date(),
    travelDate: null,
    returnDate: null,
    holdUntil: null,
    lastModified: new Date(),
    assignedAgent: null,
    queueStatus: 'pending' as const,
    priority: 'medium' as const,
    source: 'b2b' as const,
    ipAddress: '127.0.0.1',
    userAgent: 'jest',
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.booking.create({ data });
  }
  return { id: randomId(), ...data };
};

// New factory functions
global.makeCompany = async (overrides = {}) => {
  const data = {
    name: 'Test Company',
    email: `company.${Date.now()}@example.com`,
    phone: '+1555123456',
    address: '123 Business St',
    ...overrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.company.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeBranch = async (overrides = {}) => {
  const { company, ...restOverrides } = overrides;
  const resolvedCompany = company || (await global.makeCompany());
  const data = {
    name: 'Main Branch',
    companyId: resolvedCompany.id,
    address: '456 Branch Ave',
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.branch.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeDocument = async (overrides = {}) => {
  const { booking, ...restOverrides } = overrides;
  const resolvedBooking = booking || (await global.makeBooking());
  const data = {
    bookingId: resolvedBooking.id,
    type: 'invoice' as const,
    url: `https://example.com/docs/${Date.now()}.pdf`,
    createdBy: 'test-user',
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.document.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeAmendment = async (overrides = {}) => {
  const { booking, ...restOverrides } = overrides;
  const resolvedBooking = booking || (await global.makeBooking());
  const data = {
    bookingId: resolvedBooking.id,
    type: 'date_change' as const,
    reason: 'Customer requested date change',
    status: 'pending' as const,
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.amendment.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeRefund = async (overrides = {}) => {
  const { booking, ...restOverrides } = overrides;
  const resolvedBooking = booking || (await global.makeBooking());
  const data = {
    bookingId: resolvedBooking.id,
    amount: new Decimal(50),
    reason: 'Customer cancellation',
    status: 'pending' as const,
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.refund.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

global.makeAuditLog = async (overrides = {}) => {
  const { booking, ...restOverrides } = overrides;
  const resolvedBooking = booking || (await global.makeBooking());
  const data = {
    bookingId: resolvedBooking.id,
    action: 'status_changed',
    actor: 'test-user',
    details: { oldStatus: 'PENDING', newStatus: 'CONFIRMED' },
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.auditLog.create({ data });
  }
  return { id: randomId(), ...data, timestamp: new Date() };
};

global.makeNote = async (overrides = {}) => {
  const { booking, ...restOverrides } = overrides;
  const resolvedBooking = booking || (await global.makeBooking());
  const data = {
    bookingId: resolvedBooking.id,
    content: 'Test note content',
    author: 'test-agent',
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return prisma.note.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), updatedAt: new Date() };
};

// Pricing factory (schema does not define Pricing; return plain object or use dynamic model when present)
global.makePricingRule = async (overrides = {}) => {
  const data = {
    name: 'Default Rule',
    percentage: 10,
    active: true,
    createdAt: new Date(),
    ...overrides,
  };

  if (process.env.INTEGRATION_DB === 'true' && (prisma as any).pricingRule) {
    return (prisma as any).pricingRule.create({ data });
  }
  return data;
};


// Assign utility functions to global with correct signatures
global.post = post;
global.put = put;
global.del = del;
global.withAuth = withAuth;
global.createAdminToken = createAdminToken;
global.createAgentToken = createAgentToken;
global.createSupervisorToken = createSupervisorToken;
global.createManagerToken = createManagerToken;
// postAuth expects role: string, but global type allows role?: string | undefined
global.postAuth = (path: string, data?: any, role?: string) => postAuth(path, data, role || 'admin');
global.expectSuccess = expectSuccess;
global.expectError = expectError;
global.expectBookingResponse = expectBookingResponse;
global.expectCustomerResponse = expectCustomerResponse;
global.expectSupplierResponse = expectSupplierResponse;
global.generateUniqueEmail = generateUniqueEmail;
global.generatePhoneNumber = generatePhoneNumber;
global.generatePNR = generatePNR;
// generateDateRange expects (daysFromNow?: number), but global type expects (daysFromNow?: number, duration?: number)
global.generateDateRange = (daysFromNow?: number) => generateDateRange(daysFromNow);
global.buildBookingRequest = buildBookingRequest;
global.buildCustomerRequest = buildCustomerRequest;
global.buildSupplierRequest = buildSupplierRequest;

// Disconnect DB after tests when used
afterAll(async () => {
  if (process.env.INTEGRATION_DB === 'true') {
    try {
      await prisma.$disconnect();
    } catch {
      // ignore
    }
  }
});