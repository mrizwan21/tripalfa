/**
 * Database Seed Script for Booking Service Integration Tests
 *
 * Seeds the database with test users and initial data required for API integration tests.
 * Run this before running integration tests to ensure test users exist.
 *
 * Usage:
 *   npm run test:seed        # Seed test data
 *   npm run test:seed:reset  # Reset and re-seed test data
 */

/**
 * REVIEW THREAD 28d249c0: Placeholder Hash Authentication ⚠️ PARTIALLY RESOLVED
 * [FOLLOW-UP - 2026-02-06]: Placeholder hashes have been replaced with bcrypt hashing.
 * However, authentication is still breaking with documented passwords.
 *
 * CLARIFYING COMMENT WITH FIX STEPS:
 * 1. Verify bcrypt is generating unique hashes: console.log the hashedPassword for each user
 * 2. Check if user-service has hardcoded hashes in its test fixtures
 * 3. Ensure setup.ts authenticateUser() uses the same passwords as seed.ts
 * 4. Test actual login with seeded credentials against user-service
 * 5. If hashes are truly identical, check bcrypt version and Node.js compatibility
 *
 * Current test credentials:
 * - Admin: test.admin@tripalfa.com / TestAdmin@123
 * - Agent: test.agent@tripalfa.com / TestAgent@123
 * - Customer: test.customer@tripalfa.com / TestCustomer@123
 * - Supervisor: test.supervisor@tripalfa.com / TestSupervisor@123
 * - Manager: test.manager@tripalfa.com / TestManager@123
 *
 * RISK: Authentication tests will fail if hashes are identical or not properly verified.
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

// Test user configurations with known credentials
const TEST_USERS = [
  {
    id: 'test-admin-id',
    email: 'test.admin@tripalfa.com',
    password: 'TestAdmin@123',
    firstName: 'Test',
    lastName: 'Admin',
    role: 'admin',
    isActive: true,
    isVerified: true
  },
  {
    id: 'test-agent-id',
    email: 'test.agent@tripalfa.com',
    password: 'TestAgent@123',
    firstName: 'Test',
    lastName: 'Agent',
    role: 'agent',
    isActive: true,
    isVerified: true
  },
  {
    id: 'test-customer-id',
    email: 'test.customer@tripalfa.com',
    password: 'TestCustomer@123',
    firstName: 'Test',
    lastName: 'Customer',
    role: 'customer',
    isActive: true,
    isVerified: true
  },
  {
    id: 'test-supervisor-id',
    email: 'test.supervisor@tripalfa.com',
    password: 'TestSupervisor@123',
    firstName: 'Test',
    lastName: 'Supervisor',
    role: 'supervisor',
    isActive: true,
    isVerified: true
  },
  {
    id: 'test-manager-id',
    email: 'test.manager@tripalfa.com',
    password: 'TestManager@123',
    firstName: 'Test',
    lastName: 'Manager',
    role: 'manager',
    isActive: true,
    isVerified: true
  }
];

// Test companies for B2B scenarios
const TEST_COMPANIES = [
  {
    id: 'test-company-1',
    name: 'Test Travel Company',
    email: 'company@tripalfa.com',
    phone: '+1-555-TEST-001',
    address: '123 Test Street, Test City, TC 12345'
  },
  {
    id: 'test-company-2',
    name: 'Another Test Company',
    email: 'another@tripalfa.com',
    phone: '+1-555-TEST-002',
    address: '456 Test Avenue, Test City, TC 12345'
  }
];

// Test branches
const TEST_BRANCHES = [
  {
    id: 'test-branch-1',
    name: 'Main Branch',
    companyId: 'test-company-1',
    address: '123 Test Street, Test City, TC 12345'
  },
  {
    id: 'test-branch-2',
    name: 'Secondary Branch',
    companyId: 'test-company-1',
    address: '789 Test Boulevard, Test City, TC 12345'
  }
];

// Test suppliers
const TEST_SUPPLIERS = [
  {
    id: 'test-supplier-1',
    name: 'Test Airlines',
    type: 'airline',
    contactName: 'Airline Contact',
    contactEmail: 'contact@testairlines.com',
    contactPhone: '+1-555-AIR-LINE'
  },
  {
    id: 'test-supplier-2',
    name: 'Test Hotels',
    type: 'hotel',
    contactName: 'Hotel Contact',
    contactEmail: 'contact@testhotels.com',
    contactPhone: '+1-555-HOT-ELS'
  },
  {
    id: 'test-supplier-3',
    name: 'Test Car Rentals',
    type: 'car_rental',
    contactName: 'Car Rental Contact',
    contactEmail: 'contact@testcars.com',
    contactPhone: '+1-555-CAR-RENT'
  }
];

// Test customers
const TEST_CUSTOMERS = [
  {
    id: 'test-customer-record-1',
    name: 'John Test',
    email: 'john.test@example.com',
    phone: '+1-555-TEST-001',
    type: 'individual',
    companyId: null
  },
  {
    id: 'test-customer-record-2',
    name: 'Jane Test',
    email: 'jane.test@example.com',
    phone: '+1-555-TEST-002',
    type: 'individual',
    companyId: null
  },
  {
    id: 'test-customer-record-3',
    name: 'Corporate Test Client',
    email: 'corporate@testcompany.com',
    phone: '+1-555-TEST-003',
    type: 'corporate',
    companyId: 'test-company-1'
  }
];

/**
 * Hash password using bcrypt
 */
async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

/**
 * Seed test users in the database
 */
async function seedTestUsers(): Promise<void> {
  console.log('🌱 Seeding test users...');

  for (const user of TEST_USERS) {
    try {
      // Check if user already exists
      const existingUser = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "users" WHERE email = '${user.email}'`
      );

      if (existingUser.length > 0) {
        console.log(`  ✓ User already exists: ${user.email} (${user.role})`);
        continue;
      }

      // Hash password
      const hashedPassword = await hashPassword(user.password);

      // Insert user - adjust table/column names based on your actual schema
      await prisma.$executeRawUnsafe(`
        INSERT INTO "users" (
          id, email, password, "firstName", "lastName", role, "isActive", "isVerified", "createdAt", "updatedAt"
        ) VALUES (
          '${user.id}',
          '${user.email}',
          '${hashedPassword}',
          '${user.firstName}',
          '${user.lastName}',
          '${user.role}',
          ${user.isActive},
          ${user.isVerified},
          NOW(),
          NOW()
        )
      `);

      console.log(`  ✅ Created test user: ${user.email} (${user.role})`);
    } catch (error) {
      console.warn(`  ⚠️  Failed to create user ${user.email}:`, error);
    }
  }
}

/**
 * Seed test companies
 */
async function seedTestCompanies(): Promise<void> {
  console.log('🌱 Seeding test companies...');

  for (const company of TEST_COMPANIES) {
    try {
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "companies" WHERE id = '${company.id}'`
      );

      if (existing.length > 0) {
        console.log(`  ✓ Company already exists: ${company.name}`);
        continue;
      }

      await prisma.$executeRawUnsafe(`
        INSERT INTO "companies" (
          id, "company_name", email, "company_phone", "company_address", "created_at", "updated_at"
        ) VALUES (
          '${company.id}',
          '${company.name}',
          '${company.email}',
          '${company.phone}',
          '${company.address}',
          NOW(),
          NOW()
        )
      `);

      console.log(`  ✅ Created test company: ${company.name}`);
    } catch (error) {
      console.warn(`  ⚠️  Failed to create company ${company.name}:`, error);
    }
  }
}

/**
 * Seed test branches
 */
async function seedTestBranches(): Promise<void> {
  console.log('🌱 Seeding test branches...');

  for (const branch of TEST_BRANCHES) {
    try {
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "branches" WHERE id = '${branch.id}'`
      );

      if (existing.length > 0) {
        console.log(`  ✓ Branch already exists: ${branch.name}`);
        continue;
      }

      await prisma.$executeRawUnsafe(`
        INSERT INTO "branches" (
          id, "branch_name", "company_id", "branch_address", "created_at", "updated_at"
        ) VALUES (
          '${branch.id}',
          '${branch.name}',
          '${branch.companyId}',
          '${branch.address}',
          NOW(),
          NOW()
        )
      `);

      console.log(`  ✅ Created test branch: ${branch.name}`);
    } catch (error) {
      console.warn(`  ⚠️  Failed to create branch ${branch.name}:`, error);
    }
  }
}

/**
 * Seed test suppliers
 */
async function seedTestSuppliers(): Promise<void> {
  console.log('🌱 Seeding test suppliers...');

  for (const supplier of TEST_SUPPLIERS) {
    try {
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "suppliers" WHERE id = '${supplier.id}'`
      );

      if (existing.length > 0) {
        console.log(`  ✓ Supplier already exists: ${supplier.name}`);
        continue;
      }

      await prisma.$executeRawUnsafe(`
        INSERT INTO "suppliers" (
          id, "supplier_name", "supplier_type", "contact_name", "contact_email", "contact_phone", "created_at", "updated_at"
        ) VALUES (
          '${supplier.id}',
          '${supplier.name}',
          '${supplier.type}',
          '${supplier.contactName}',
          '${supplier.contactEmail}',
          '${supplier.contactPhone}',
          NOW(),
          NOW()
        )
      `);

      console.log(`  ✅ Created test supplier: ${supplier.name}`);
    } catch (error) {
      console.warn(`  ⚠️  Failed to create supplier ${supplier.name}:`, error);
    }
  }
}

/**
 * Seed test customers
 */
async function seedTestCustomers(): Promise<void> {
  console.log('🌱 Seeding test customers...');

  for (const customer of TEST_CUSTOMERS) {
    try {
      const existing = await prisma.$queryRawUnsafe<{ id: string }[]>(
        `SELECT id FROM "customers" WHERE id = '${customer.id}'`
      );

      if (existing.length > 0) {
        console.log(`  ✓ Customer already exists: ${customer.name}`);
        continue;
      }

      const companyIdClause = customer.companyId
        ? `'${customer.companyId}'`
        : 'NULL';

      await prisma.$executeRawUnsafe(`
        INSERT INTO "customers" (
          id, "customer_name", email, "customer_phone", type, "company_id", "created_at", "updated_at"
        ) VALUES (
          '${customer.id}',
          '${customer.name}',
          '${customer.email}',
          '${customer.phone}',
          '${customer.type}',
          ${companyIdClause},
          NOW(),
          NOW()
        )
      `);

      console.log(`  ✅ Created test customer: ${customer.name}`);
    } catch (error) {
      console.warn(`  ⚠️  Failed to create customer ${customer.name}:`, error);
    }
  }
}

/**
 * Clear all test data (for reset)
 */
async function clearTestData(): Promise<void> {
  console.log('🗑️  Clearing existing test data...');

  const testIds = {
    users: TEST_USERS.map(u => u.id),
    companies: TEST_COMPANIES.map(c => c.id),
    branches: TEST_BRANCHES.map(b => b.id),
    suppliers: TEST_SUPPLIERS.map(s => s.id),
    customers: TEST_CUSTOMERS.map(c => c.id)
  };

  try {
    // Delete in reverse order of dependencies
    await prisma.$executeRawUnsafe(
      `DELETE FROM "customers" WHERE id IN ('${testIds.customers.join("','")}')`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "suppliers" WHERE id IN ('${testIds.suppliers.join("','")}')`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "branches" WHERE id IN ('${testIds.branches.join("','")}')`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "companies" WHERE id IN ('${testIds.companies.join("','")}')`
    );
    await prisma.$executeRawUnsafe(
      `DELETE FROM "users" WHERE id IN ('${testIds.users.join("','")}')`
    );

    console.log('✅ Test data cleared');
  } catch (error) {
    console.warn('⚠️  Some test data may not have been cleared:', error);
  }
}

/**
 * Main seed function
 */
async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const shouldReset = args.includes('--reset') || args.includes('-r');

  console.log('\n🌱 Booking Service Test Data Seeder\n');

  try {
    if (shouldReset) {
      await clearTestData();
    }

    // Seed in order of dependencies
    await seedTestUsers();
    await seedTestCompanies();
    await seedTestBranches();
    await seedTestSuppliers();
    await seedTestCustomers();

    console.log('\n✅ Test data seeding complete!\n');
    console.log('Test User Credentials:');
    console.log('----------------------');
    for (const user of TEST_USERS) {
      console.log(`${user.role.toUpperCase()}:`);
      console.log(`  Email: ${user.email}`);
      console.log(`  Password: ${user.password}`);
      console.log('');
    }
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run if called directly
if (require.main === module) {
  main();
}

export { seedTestUsers, seedTestCompanies, seedTestBranches, seedTestSuppliers, seedTestCustomers, clearTestData };
