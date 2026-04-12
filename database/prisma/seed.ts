import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import { log } from '@tripalfa/shared-utils/logging';

// Get database URL from environment
const databaseUrl =
  process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/postgres';
if (!databaseUrl) {
  throw new Error('DATABASE_URL must be set. Check your .env.local file.');
}

// Initialize PostgreSQL adapter
const pool = new Pool({ connectionString: databaseUrl });
const adapter = new PrismaPg(pool);

// Create Prisma client with adapter
const prisma = new PrismaClient({ adapter });

async function main(): Promise<void> {
  log.info('🌱  Starting seed…');

  // ── Application Data ───────────────────────────────────────
  // Seed core application data that belongs in the main Neon database

  // Create default company
  const defaultCompany = await prisma.company.upsert({
    where: { code: 'DEFAULT' },
    update: {},
    create: {
      code: 'DEFAULT',
      name: 'Default Company',
      type: 'b2b',
      isActive: true,
    },
  });
  log.info('Default company seeded');

  // Create default roles
  await prisma.role.createMany({
    skipDuplicates: true,
    data: [
      { name: 'admin', description: 'Administrator role', isSystem: true },
      { name: 'user', description: 'Standard user role', isSystem: true },
      { name: 'agent', description: 'Travel agent role', isSystem: true },
    ],
  });
  log.info('Default roles seeded');

  // Create default loyalty tiers
  await prisma.loyaltyTier.createMany({
    skipDuplicates: true,
    data: [
      { name: 'Bronze', level: 1, minPoints: 0, maxPoints: 999, multiplier: 1.0 },
      { name: 'Silver', level: 2, minPoints: 1000, maxPoints: 4999, multiplier: 1.1 },
      { name: 'Gold', level: 3, minPoints: 5000, maxPoints: 19999, multiplier: 1.2 },
      { name: 'Platinum', level: 4, minPoints: 20000, multiplier: 1.3 },
    ],
  });
  log.info('Default loyalty tiers seeded');

  // Create default notification templates
  await prisma.notificationTemplate.createMany({
    skipDuplicates: true,
    data: [
      {
        name: 'Booking Confirmation',
        slug: 'booking-confirmation',
        category: 'booking',
        description: 'Template for booking confirmation notifications',
        templates: {
          email: {
            subject: 'Your booking is confirmed!',
            body: 'Thank you for booking with us. Your booking reference is {{bookingRef}}.',
          },
        },
        variables: ['bookingRef', 'customerName'],
        enabled: true,
      },
      {
        name: 'Payment Confirmation',
        slug: 'payment-confirmation',
        category: 'payment',
        description: 'Template for payment confirmation notifications',
        templates: {
          email: {
            subject: 'Payment received!',
            body: 'Your payment of {{amount}} has been received.',
          },
        },
        variables: ['amount', 'transactionId'],
        enabled: true,
      },
    ],
  });
  log.info('Default notification templates seeded');

  // Create default commission rules
  await prisma.commissionRule.createMany({
    skipDuplicates: true,
    data: [
      {
        code: 'DEFAULT_FLIGHT',
        name: 'Default Flight Commission',
        serviceType: 'flight',
        ruleType: 'percentage',
        value: 5.0,
        currency: 'USD',
        isActive: true,
        priority: 100,
      },
      {
        code: 'DEFAULT_HOTEL',
        name: 'Default Hotel Commission',
        serviceType: 'hotel',
        ruleType: 'percentage',
        value: 8.0,
        currency: 'USD',
        isActive: true,
        priority: 100,
      },
    ],
  });
  log.info('Default commission rules seeded');

  // Create default markup rules
  await prisma.markupRule.createMany({
    skipDuplicates: true,
    data: [
      {
        code: 'DEFAULT_FLIGHT',
        name: 'Default Flight Markup',
        serviceType: 'flight',
        ruleType: 'percentage',
        value: 2.0,
        currency: 'USD',
        isActive: true,
        priority: 100,
      },
      {
        code: 'DEFAULT_HOTEL',
        name: 'Default Hotel Markup',
        serviceType: 'hotel',
        ruleType: 'percentage',
        value: 3.0,
        currency: 'USD',
        isActive: true,
        priority: 100,
      },
    ],
  });
  log.info('Default markup rules seeded');

  // Note: Static lookup tables (airports, airlines, countries, currencies, etc.)
  // are managed separately in the static database and should not be seeded here.
  // These tables are populated via dedicated import scripts in packages/static-data.

  log.info('🎉  Seed complete.');
}

main()
  .catch(e => {
    log.error('Seed failed', e as Error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
