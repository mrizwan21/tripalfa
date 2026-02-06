import { jest } from '@jest/globals';
import { Prisma, PrismaClient } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';
const request = require('supertest');
const jwt = require('jsonwebtoken');

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
   
  var buildInventoryRequest: (overrides?: Record<string, unknown>) => any;

  var makeInventory: (overrides?: Record<string, unknown>) => Promise<any>;
   
  var makePricingRule: (overrides?: Record<string, unknown>) => Promise<any>;

  var expectInventoryResponse: (res: any, expectedFields?: any) => void;
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
  // Force reload database module after environment variables are set
  if (process.env.INTEGRATION_DB === 'true') {
    jest.resetModules();
    const { prisma: freshPrisma } = await import('../database/index');
    global.prismaClient = freshPrisma;
  }

  global.api = request(app);

  // Optional DB connect for integration tests
  if (process.env.INTEGRATION_DB === 'true') {
    try {
      await global.prismaClient.$connect();
    } catch (e) {
      // Continue without hard failing when DB is not available
      console.warn('Database connection failed:', e);
    }
  }
}, 30000);

// Clear mocks and optionally truncate tables before each test
beforeEach(async () => {
  jest.clearAllMocks();

  // Truncate all relevant tables in test DB only when enabled
  if (process.env.INTEGRATION_DB === 'true' && process.env.TEST_DB_RESET === 'true') {
    try {
      // Use a longer timeout for this operation (30 seconds)
      const truncatePromise = global.prismaClient.$transaction([
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_tags" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "tags" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "audit_logs" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_notes" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_documents" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_communications" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_amendments" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_refunds" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "booking_notifications" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "bookings" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "customers" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "branches" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "companies" CASCADE`),
        global.prismaClient.$executeRawUnsafe(`TRUNCATE TABLE "suppliers" CASCADE`),
      ]);
      
      await Promise.race([
        truncatePromise,
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Database truncation timeout')), 30000)
        )
      ]);
    } catch (e) {
      // Allow tests to proceed even if truncate is not possible
      console.warn('Database truncation failed or timed out:', e);
    }
  }
}, 40000);

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

global.makeInventory = async (overrides = {}) => {
  const { supplier, ...restOverrides } = overrides;
  const resolvedSupplier = supplier || (await global.makeSupplier());
  
  const data = {
    supplierId: resolvedSupplier.id,
    productCode: `PROD-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`,
    name: 'Test Product',
    description: 'Test inventory item',
    quantity: 100,
    available: 100,
    reserved: 0,
    price: new Decimal(150),
    currency: 'USD',
    minimumPrice: new Decimal(120),
    status: 'active',
    serviceTypes: ['flight'],
    lastStockCheck: new Date(),
    ...restOverrides,
  };

  if (process.env.INTEGRATION_DB === 'true') {
    return (prisma as any).inventory.create({ data });
  }
  return { id: randomId(), ...data, createdAt: new Date(), lastUpdated: new Date() };
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
// Only assign once to prevent auth duplication on multiple setup calls
if (!global.post) {
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
  global.buildInventoryRequest = buildInventoryRequest;
  global.expectInventoryResponse = expectInventoryResponse;
}

export async function seedTestData() {
  // Set env vars for test database integration
  if (process.env.INTEGRATION_DB !== 'true') {
    process.env.INTEGRATION_DB = 'true';
    process.env.TEST_DB_RESET = 'true';
  }
  
  // Ensure only one instance of Prisma client exists
  if (!global.prismaClient) {
    const { prisma: freshPrisma } = await import('../database/index');
    global.prismaClient = freshPrisma;
  }
  
  // Establish database connection if needed
  try {
    if (!global.prismaClient) {
      await global.prismaClient.$connect();
    }
  } catch {
    // Connection may already exist or be unavailable
  }
}

export async function cleanupTestData() {
  // Properly disconnect and clear Prisma client to prevent auth duplication
  if (global.prismaClient) {
    try {
      await global.prismaClient.$disconnect();
    } catch {
      // Ignore disconnection errors
    } finally {
      // Clear the reference to allow fresh instantiation on next seed
      global.prismaClient = undefined as any;
    }
  }
}
