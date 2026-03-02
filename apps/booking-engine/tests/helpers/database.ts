import * as Prisma from "@prisma/client";
import users from "../fixtures/users.json";
import wallets from "../fixtures/wallets.json";

// Initialize Prisma client for test database
const PrismaClientCtor = (Prisma as any).PrismaClient;
const prisma = new PrismaClientCtor({
  datasources: {
    db: {
      url: process.env.DATABASE_URL || process.env.TEST_DATABASE_URL,
    },
  },
});

/**
 * Database Seeding Utility
 *
 * Provides functions to:
 * - Seed test data before tests
 * - Clean up test data after tests
 * - Reset database to clean state
 * - Create test data on-demand
 */

/**
 * Clean up all test data
 * Removes all records created during testing
 */
export async function cleanupTestData(): Promise<void> {
  try {
    console.log("🧹 Cleaning up test data...");

    // Delete in reverse order of dependencies
    await prisma.booking.deleteMany({
      where: {
        OR: [
          { email: { contains: "@tripalfa.com" } },
          { email: { contains: "@test.com" } },
        ],
      },
    });

    await prisma.walletTransaction.deleteMany({
      where: {
        wallet: {
          user: {
            email: { contains: "@tripalfa.com" },
          },
        },
      },
    });

    await prisma.wallet.deleteMany({
      where: {
        user: {
          email: { contains: "@tripalfa.com" },
        },
      },
    });

    await prisma.user.deleteMany({
      where: {
        OR: [
          { email: { contains: "@tripalfa.com" } },
          { email: { contains: "@test.com" } },
        ],
      },
    });

    console.log("✅ Test data cleaned up successfully");
  } catch (error) {
    console.error("❌ Error cleaning up test data:", error);
    throw error;
  }
}

/**
 * Seed test users
 * Creates test users from fixtures
 */
export async function seedTestUsers(): Promise<void> {
  try {
    console.log("👤 Seeding test users...");

    for (const [key, userData] of Object.entries(users)) {
      await prisma.user.upsert({
        where: { email: userData.email },
        update: userData,
        create: userData,
      });
      console.log(`  ✓ Created user: ${userData.email}`);
    }

    console.log("✅ Test users seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding test users:", error);
    throw error;
  }
}

/**
 * Seed test wallets
 * Creates wallets for test users
 */
export async function seedTestWallets(): Promise<void> {
  try {
    console.log("💰 Seeding test wallets...");

    for (const [key, walletData] of Object.entries(wallets)) {
      // Find user by email
      const user = await prisma.user.findUnique({
        where: { email: walletData.userEmail },
      });

      if (!user) {
        console.warn(
          `  ⚠️  User not found for wallet: ${walletData.userEmail}`,
        );
        continue;
      }

      await prisma.wallet.upsert({
        where: { userId: user.id },
        update: { balance: walletData.balance },
        create: {
          userId: user.id,
          balance: walletData.balance,
          currency: walletData.currency || "USD",
        },
      });
      console.log(`  ✓ Created wallet for: ${walletData.userEmail}`);
    }

    console.log("✅ Test wallets seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding test wallets:", error);
    throw error;
  }
}

/**
 * Seed all test data
 * Main function to seed all fixtures
 */
export async function seedTestData(): Promise<void> {
  try {
    console.log("🌱 Seeding all test data...");

    // Seed in order of dependencies
    await seedTestUsers();
    await seedTestWallets();
    // Add more seeding functions as needed

    console.log("✅ All test data seeded successfully");
  } catch (error) {
    console.error("❌ Error seeding test data:", error);
    throw error;
  }
}

/**
 * Reset database to clean state
 * Cleans up and re-seeds all test data
 */
export async function resetDatabase(): Promise<void> {
  try {
    console.log("🔄 Resetting database...");

    await cleanupTestData();
    await seedTestData();

    console.log("✅ Database reset successfully");
  } catch (error) {
    console.error("❌ Error resetting database:", error);
    throw error;
  }
}

/**
 * Create a test user on-demand
 * Useful for tests that need unique users
 */
export async function createTestUser(userData: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone?: string;
}): Promise<any> {
  try {
    const user = await prisma.user.create({
      data: userData,
    });
    console.log(`✓ Created test user: ${userData.email}`);
    return user;
  } catch (error) {
    console.error(`❌ Error creating test user: ${userData.email}`, error);
    throw error;
  }
}

/**
 * Create a test booking on-demand
 */
export async function createTestBooking(bookingData: {
  userId: string;
  type: "FLIGHT" | "HOTEL";
  status: string;
  totalAmount: number;
  bookingData: any;
}): Promise<any> {
  try {
    const booking = await prisma.booking.create({
      data: {
        ...bookingData,
        bookingReference: generateBookingReference(),
        createdAt: new Date(),
      },
    });
    console.log(`✓ Created test booking: ${booking.bookingReference}`);
    return booking;
  } catch (error) {
    console.error("❌ Error creating test booking", error);
    throw error;
  }
}

/**
 * Generate a unique booking reference
 */
function generateBookingReference(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let reference = "";
  for (let i = 0; i < 6; i++) {
    reference += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return reference;
}

/**
 * Disconnect Prisma client
 * Call this in global teardown
 */
export async function disconnectDatabase(): Promise<void> {
  await prisma.$disconnect();
  console.log("✅ Database disconnected");
}

// Export prisma client for direct use in tests
export { prisma };
