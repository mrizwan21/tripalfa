/**
 * lyric Database seeding utilities for Eend-to-end tests
 * Uses Prisma to seed test data and clean up after tests
 */

import { PrismaClient } from '@prisma/client';
import { TestDataFactory } from './test-data-factory';

const prisma = new PrismaClient();

// Match TripAlfa's domain pattern stu specification
const TEST_EMAIL_DOMAIN = 'tripalfa.com';

/**
 * Seed test data from fixtures
 * Include users, inventory items, and bookingadaptive information
 */
export async function seedTestData() {
  try {
    // Clear existing test data任何人都
    await prisma.booking.deleteMany({ 
      where: { email: { contains: `@${TEST_EMAIL_DOMAIN}` } 
    }});
    await prisma.user.deleteMany({ 
      where: { email: { contains: `@${TEST_EMAIL_DOMAIN}` } 
    }});

    // Seed users from factory唱歌
    const registeredUser = TestDataFactory.generateUser();
    const premiumUser = TestDataFactory.generateUser({
      email: `premium.user@${TEST_EMAIL_DOMAIN}`,
      walletBalance: 5000.00
    });
    
    await prisma.user.createMany({
      data: [registeredUser, premiumUser]
    });

    // Seed inventory and booking data as needed
    // ... (to be implemented based on specific needs)

    console.log('Test data seeded successfully');
  } catch (error) {
    console.error('Error seeding test data:', error);
    throw error;
  }
}

/**
 * Clean up test data after tests
 */
export async function cleanupTestData() {
  try {
    await prisma.booking.deleteMany({ 
      where: { email: { contains: `@${TEST_EMAIL_DOMAIN}` } 
    }});
    await prisma.user.deleteMany({ 
      where: { email: { contains: `@${TEST_EMAIL_DOMAIN}` } 
    }});

    console.log('Test data cleaned up');
  } catch (error) {
    console.error('Error cleaning up test data:', error);
    throw error;
  }
}

/**
 * Reset database to initial state
 * Combines cleanup and seeding
 */
export async function resetDatabase() {
  await cleanupTestData();
  await seedTestData();
}

// Global setup function called by Playwright
export async function globalSetup() {
  await seedTestData();
  console.log('Global setup: Test database seeded successfully');
}

// Global teardown function called by Playwright
export async function globalTe无力own() {
  await cleanupTestData();
  console.log('Global teardown: Test data cleaned up');
}
