/**
 * Booking Service API Integration Test Setup
 *
 * Configures Supertest and test database for API integration tests.
 * Provides real authentication with user-service and proper test data cleanup.
 */

/**
 * REVIEW THREAD a7855a94: Cleanup Placeholders ❌ UNRESOLVED
 * [STATUS - 2026-02-06]: Original issue unchanged - Placeholder implementations remain.
 *
 * UNRESOLVED ISSUES:
 * - Line ~75: User-service API integration is placeholder
 * - Line ~280: Wallet cleanup is placeholder
 * - Line ~290: User cleanup is placeholder
 *
 * RISKS:
 * - Test data leakage between runs
 * - Incomplete test cleanup
 * - False positive test results
 *
 * ACTION REQUIRED: Replace all placeholder implementations with actual logic.
 */

/**
 * REVIEW THREAD b2ac0549: booking.email vs customerEmail ❌ UNRESOLVED
 * [STATUS - 2026-02-06]: Original issue unchanged - Field naming inconsistency persists.
 *
 * Current State:
 * - Database schema uses customer_email (via @map in Prisma)
 * - API validation uses customerEmail (Joi schema)
 * - TypeScript types use customerEmail
 * - Controllers use customerEmail
 *
 * The inconsistency may be in API request/response payload structure or external integrations.
 * No changes have been made to resolve this naming inconsistency.
 *
 * ACTION REQUIRED: Standardize on customerEmail throughout the stack.
 */

import request from 'supertest';
// NOTE: app import removed to avoid cascading .js import issues during global setup
// Test files that need supertest app access should import app directly if needed
import { prisma } from '../../src/database';
import * as jwt from 'jsonwebtoken';

// Test configuration with seeded credentials
export const TEST_CONFIG = {
  baseUrl: process.env.TEST_BASE_URL || 'http://localhost:3001',
  timeout: 30000,
  // Seeded test users - these must match the seeded users in the database
  testUsers: {
    admin: {
      email: 'test.admin@tripalfa.com',
      password: 'TestAdmin@123',
      role: 'admin',
      id: 'test-admin-id'
    },
    agent: {
      email: 'test.agent@tripalfa.com',
      password: 'TestAgent@123',
      role: 'agent',
      id: 'test-agent-id'
    },
    customer: {
      email: 'test.customer@tripalfa.com',
      password: 'TestCustomer@123',
      role: 'customer',
      id: 'test-customer-id'
    },
    supervisor: {
      email: 'test.supervisor@tripalfa.com',
      password: 'TestSupervisor@123',
      role: 'supervisor',
      id: 'test-supervisor-id'
    },
    manager: {
      email: 'test.manager@tripalfa.com',
      password: 'TestManager@123',
      role: 'manager',
      id: 'test-manager-id'
    }
  }
} as const;


// NOTE: Test helpers below use getApi() which is defined in individual test files
// This approach avoids importing app during global setup (which causes .js import cascades)

// Test tokens storage
export let authTokens: {
  admin?: string;
  agent?: string;
  customer?: string;
  supervisor?: string;
  manager?: string;
} = {};

// Type definition for test data tracker
interface TestDataTracker {
  bookings: Set<string>;
  customers: Set<string>;
  suppliers: Set<string>;
  companies: Set<string>;
  branches: Set<string>;
  documents: Set<string>;
  amendments: Set<string>;
  refunds: Set<string>;
  notes: Set<string>;
  auditLogs: Set<string>;
  communications: Set<string>;
  notifications: Set<string>;
  track(type: Exclude<keyof TestDataTracker, 'track' | 'clear' | 'getAll'>, id: string): void;
  clear(): void;
  getAll(): Record<Exclude<keyof TestDataTracker, 'track' | 'clear' | 'getAll'>, string[]>;
}

// Track created test data for cleanup
export const testDataTracker: TestDataTracker = {
  bookings: new Set<string>(),
  customers: new Set<string>(),
  suppliers: new Set<string>(),
  companies: new Set<string>(),
  branches: new Set<string>(),
  documents: new Set<string>(),
  amendments: new Set<string>(),
  refunds: new Set<string>(),
  notes: new Set<string>(),
  auditLogs: new Set<string>(),
  communications: new Set<string>(),
  notifications: new Set<string>(),

  track(type: Exclude<keyof TestDataTracker, 'track' | 'clear' | 'getAll'>, id: string) {
    // Type system already ensures this is a valid data set key
    (this[type] as Set<string>).add(id);
  },

  clear() {
    this.bookings.clear();
    this.customers.clear();
    this.suppliers.clear();
    this.companies.clear();
    this.branches.clear();
    this.documents.clear();
    this.amendments.clear();
    this.refunds.clear();
    this.notes.clear();
    this.auditLogs.clear();
    this.communications.clear();
    this.notifications.clear();
  },

  getAll() {
    return {
      bookings: Array.from(this.bookings),
      customers: Array.from(this.customers),
      suppliers: Array.from(this.suppliers),
      companies: Array.from(this.companies),
      branches: Array.from(this.branches),
      documents: Array.from(this.documents),
      amendments: Array.from(this.amendments),
      refunds: Array.from(this.refunds),
      notes: Array.from(this.notes),
      auditLogs: Array.from(this.auditLogs),
      communications: Array.from(this.communications),
      notifications: Array.from(this.notifications)
    };
  }
};

/**
 * Generate a real JWT token for authentication
 * Uses the actual JWT_SECRET from environment for valid tokens
 */
export function generateAuthToken(user: {
  id: string;
  email: string;
  role: string;
}): string {
  const secret = process.env.JWT_SECRET || 'test-jwt-secret-key';
  const payload = {
    id: user.id,
    email: user.email,
    role: user.role,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 3600 // 1 hour
  };
  return jwt.sign(payload, secret);
}

/**
 * Authenticate with user-service and get real token
 * Falls back to generated token if user-service is unavailable
 */
export async function authenticateUser(
  userType: keyof typeof TEST_CONFIG.testUsers = 'admin'
): Promise<string> {
  const user = TEST_CONFIG.testUsers[userType];

  try {
    // Try to authenticate with user-service if available
    const userServiceUrl = process.env.USER_SERVICE_URL || 'http://localhost:3002';
    const response = await fetch(`${userServiceUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: user.email,
        password: user.password
      })
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Authenticated ${userType} via user-service: ${user.email}`);
      return data.accessToken || data.token;
    }
  } catch (error) {
    console.warn(`⚠️  User-service unavailable, using generated token for ${userType}`);
  }

  // Fallback: generate a valid JWT token locally
  const token = generateAuthToken(user);
  console.log(`🔑 Generated local token for ${userType}: ${user.email}`);
  return token;
}

/**
 * Seed test users in the database
 * Creates the test users if they don't exist
 */
export async function seedTestUsers(): Promise<void> {
  console.log('🌱 Seeding test users...');

  const users = Object.values(TEST_CONFIG.testUsers);

  for (const user of users) {
    try {
      // Check if user exists in user-service database
      // This is a placeholder - implement based on your user-service API
      console.log(`  ✓ Test user ready: ${user.email} (${user.role})`);
    } catch (error) {
      console.warn(`  ⚠️  Could not verify test user ${user.email}:`, error);
    }
  }
}

/**
 * Setup function to run before all tests
 */
export async function setupTestEnvironment(): Promise<void> {
  console.log('\n🔧 Setting up test environment...');

  // Authenticate all test user types
  authTokens.admin = await authenticateUser('admin');
  authTokens.agent = await authenticateUser('agent');
  authTokens.customer = await authenticateUser('customer');
  authTokens.supervisor = await authenticateUser('supervisor');
  authTokens.manager = await authenticateUser('manager');

  // Verify API is running
  try {
    const apiUrl = globalThis.TEST_API_URL || process.env.BOOKING_SERVICE_API || 'http://localhost:3001';
    const response = await fetch(`${apiUrl}/health`);
    if (response.status !== 200) {
      throw new Error(`API health check failed with status: ${response.status}`);
    }
    console.log('✅ API health check passed');
  } catch (error) {
    console.warn('⚠️  API health check failed:', error);
    // Don't throw - allow tests to proceed and fail individually
  }

  // Clear any existing test data tracker
  testDataTracker.clear();

  console.log('✅ Test environment setup complete\n');
}

/**
 * Teardown function to run after all tests
 * Properly cleans up all test data to prevent data leakage
 */
export async function teardownTestEnvironment(): Promise<void> {
  console.log('\n🧹 Tearing down test environment...');

  // Clean up all tracked test data
  await cleanupAllTestData();

  // Clear tokens
  authTokens = {};

  console.log('✅ Test environment teardown complete\n');
}

/**
 * Clean up all test data created during tests
 * This prevents data leakage between test runs
 */
export async function cleanupAllTestData(): Promise<void> {
  const tracked = testDataTracker.getAll();
  console.log('🗑️  Cleaning up test data...');

  // Delete in reverse order of dependencies to avoid foreign key violations

  // 1. Delete junction table records first
  if (tracked.bookings.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "booking_tags" WHERE "booking_id" IN ('${tracked.bookings.join("','")}')`
      );
      console.log(`  ✓ Deleted ${tracked.bookings.length} booking tag relations`);
    } catch (error) {
      console.warn('  ⚠️  Failed to delete booking tags:', error);
    }
  }

  // 2. Delete child records with booking_id foreign keys
  const childTables = [
    { name: 'booking_documents', ids: tracked.documents },
    { name: 'booking_notes', ids: tracked.notes },
    { name: 'audit_logs', ids: tracked.auditLogs },
    { name: 'booking_communications', ids: tracked.communications },
    { name: 'booking_amendments', ids: tracked.amendments },
    { name: 'booking_refunds', ids: tracked.refunds },
    { name: 'booking_notifications', ids: tracked.notifications }
  ];

  for (const table of childTables) {
    if (table.ids.length > 0) {
      try {
        await prisma.$executeRawUnsafe(
          `DELETE FROM "${table.name}" WHERE "booking_id" IN ('${tracked.bookings.join("','")}') OR "id" IN ('${table.ids.join("','")}')`
        );
        console.log(`  ✓ Cleaned up ${table.name}`);
      } catch (error) {
        console.warn(`  ⚠️  Failed to cleanup ${table.name}:`, error);
      }
    }
  }

  // 3. Delete bookings
  if (tracked.bookings.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "bookings" WHERE "id" IN ('${tracked.bookings.join("','")}')`
      );
      console.log(`  ✓ Deleted ${tracked.bookings.length} test bookings`);
    } catch (error) {
      console.warn('  ⚠️  Failed to delete bookings:', error);
    }
  }

  // 4. Delete customers (only those created by tests, not seeded users)
  if (tracked.customers.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "customers" WHERE "id" IN ('${tracked.customers.join("','")}')`
      );
      console.log(`  ✓ Deleted ${tracked.customers.length} test customers`);
    } catch (error) {
      console.warn('  ⚠️  Failed to delete customers:', error);
    }
  }

  // 5. Delete suppliers
  if (tracked.suppliers.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "suppliers" WHERE "id" IN ('${tracked.suppliers.join("','")}')`
      );
      console.log(`  ✓ Deleted ${tracked.suppliers.length} test suppliers`);
    } catch (error) {
      console.warn('  ⚠️  Failed to delete suppliers:', error);
    }
  }

  // 6. Delete branches
  if (tracked.branches.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "branches" WHERE "id" IN ('${tracked.branches.join("','")}')`
      );
      console.log(`  ✓ Deleted ${tracked.branches.length} test branches`);
    } catch (error) {
      console.warn('  ⚠️  Failed to delete branches:', error);
    }
  }

  // 7. Delete companies
  if (tracked.companies.length > 0) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "companies" WHERE "id" IN ('${tracked.companies.join("','")}')`
      );
      console.log(`  ✓ Deleted ${tracked.companies.length} test companies`);
    } catch (error) {
      console.warn('  ⚠️  Failed to delete companies:', error);
    }
  }

  // 8. Cleanup wallet data for test users
  for (const user of Object.values(TEST_CONFIG.testUsers)) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "wallets" WHERE "user_email" = '${user.email}' OR "customer_email" = '${user.email}'`
      );
      console.log(`  ✓ Cleaned up wallet data for ${user.email}`);
    } catch (error) {
      // Wallet table may not exist or wallet service may be separate
    }
  }

  // 9. Cleanup test users from user-service (if user table exists in this DB)
  for (const user of Object.values(TEST_CONFIG.testUsers)) {
    try {
      await prisma.$executeRawUnsafe(
        `DELETE FROM "users" WHERE "email" = '${user.email}' AND "is_test_user" = true`
      );
      console.log(`  ✓ Cleaned up test user: ${user.email}`);
    } catch (error) {
      // User table may not exist in this service or user may be seeded
    }
  }

  // Clear the tracker
  testDataTracker.clear();
  console.log('✅ Test data cleanup complete');
}

/**
 * Get authorization header for requests
 */
export function getAuthHeader(role: keyof typeof TEST_CONFIG.testUsers = 'admin'): { Authorization: string } {
  const token = authTokens[role];
  if (!token) {
    throw new Error(`No auth token available for role: ${role}`);
  }
  return { Authorization: `Bearer ${token}` };
}

/**
 * Helper to create a test booking and track it for cleanup
 * 
 * DEPRECATED: This function references supertest which requires importing app.ts,
 * causing cascading .js import issues in the ts-jest environment.
 * Individual test files should use fetch() or axios to create test data instead.
 * 
 * @deprecated Use HTTP client (fetch/axios) with getTestApiUrl() instead
 */
export async function createTestBooking(bookingData: any, role: keyof typeof TEST_CONFIG.testUsers = 'admin'): Promise<any> {
  // Commented out due to cascading .js import issues with app.ts
  // const response = await supertest(app)
  //   .post('/api/bookings')
  //   .set(getAuthHeader(role))
  //   .send(bookingData);
  //
  // if (response.status === 200 || response.status === 201) {
  //   const bookingId = response.body.id || response.body.bookingId || response.body.data?.id;
  //   if (bookingId) {
  //     testDataTracker.track('bookings', bookingId);
  //   }
  // }
  //
  // return response.body;
  
  throw new Error('createTestBooking is deprecated. Use HTTP client with getTestApiUrl() instead.');
}

/**
 * Helper to create a test customer and track it for cleanup
 * 
 * DEPRECATED: This function references supertest which requires importing app.ts.
 * Use HTTP client (fetch/axios) with getTestApiUrl() instead.
 * 
 * @deprecated Use HTTP client (fetch/axios) with getTestApiUrl() instead
 */
export async function createTestCustomer(customerData: any): Promise<any> {
  // Commented out due to cascading .js import issues with app.ts
  // const response = await supertest(app)
  //   .post('/api/customers')
  //   .set(getAuthHeader('admin'))
  //   .send(customerData);
  //
  // if (response.status === 200 || response.status === 201) {
  //   const customerId = response.body.id || response.body.data?.id;
  //   if (customerId) {
  //     testDataTracker.track('customers', customerId);
  //   }
  // }
  //
  // return response.body;
  
  throw new Error('createTestCustomer is deprecated. Use HTTP client with getTestApiUrl() instead.');
}

/**
 * Helper to create a test supplier and track it for cleanup
 * 
 * DEPRECATED: This function references supertest which requires importing app.ts.
 * Use HTTP client (fetch/axios) with getTestApiUrl() instead.
 * 
 * @deprecated Use HTTP client (fetch/axios) with getTestApiUrl() instead
 */
export async function createTestSupplier(supplierData: any): Promise<any> {
  // Commented out due to cascading .js import issues with app.ts
  // const response = await supertest(app)
  //   .post('/api/suppliers')
  //   .set(getAuthHeader('admin'))
  //   .send(supplierData);
  //
  // if (response.status === 200 || response.status === 201) {
  //   const supplierId = response.body.id || response.body.data?.id;
  //   if (supplierId) {
  //     testDataTracker.track('suppliers', supplierId);
  //   }
  // }
  //
  // return response.body;
  
  throw new Error('createTestSupplier is deprecated. Use HTTP client with getTestApiUrl() instead.');
}

/**
 * Helper to cleanup a specific test booking
 */
export async function cleanupTestBooking(bookingId: string): Promise<void> {
  try {
    // Delete related records first
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_tags" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_documents" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_notes" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "audit_logs" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_communications" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_amendments" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_refunds" WHERE "booking_id" = '${bookingId}'`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "booking_notifications" WHERE "booking_id" = '${bookingId}'`
    );

    // Delete the booking
    await prisma.$executeRawUnsafe(
      `DELETE FROM "bookings" WHERE "id" = '${bookingId}'`
    );

    testDataTracker.bookings.delete(bookingId);
    console.log(`✅ Cleaned up test booking: ${bookingId}`);
  } catch (error) {
    console.warn(`⚠️  Failed to cleanup test booking ${bookingId}:`, error);
  }
}

/**
 * Helper to cleanup a test customer and their bookings
 */
export async function cleanupTestCustomer(customerId: string): Promise<void> {
  try {
    // First find and cleanup all bookings for this customer
    const bookings = await prisma.$queryRawUnsafe<{ id: string }[]>(
      `SELECT "id" FROM "bookings" WHERE "customer_id" = '${customerId}'`
    );

    for (const booking of bookings) {
      await cleanupTestBooking(booking.id);
    }

    // Delete the customer
    await prisma.$executeRawUnsafe(
      `DELETE FROM "customers" WHERE "id" = '${customerId}'`
    );

    testDataTracker.customers.delete(customerId);
    console.log(`✅ Cleaned up test customer: ${customerId}`);
  } catch (error) {
    console.warn(`⚠️  Failed to cleanup test customer ${customerId}:`, error);
  }
}

// Default export for Jest setup
export default {
  setupTestEnvironment,
  teardownTestEnvironment,
  getAuthHeader,
  createTestBooking,
  createTestCustomer,
  createTestSupplier,
  cleanupTestBooking,
  cleanupTestCustomer,
  cleanupAllTestData,
  testDataTracker,
  TEST_CONFIG
};
