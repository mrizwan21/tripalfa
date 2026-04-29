/**
 * OTA Database Seed Orchestrator
 */
import { PrismaClient } from '../../generated/prisma-client';
import { seedSystem } from './01-system.js';
import { seedTenants } from './02-tenants.js';
import { seedSuppliers } from './03-suppliers.js';
import { seedContacts } from './04-contacts.js';
import { seedTravellers } from './05-travellers.js';
import { seedInventory } from './06-inventory.js';
import { seedMarkupRules } from './07-markup-rules.js';
import { seedWallets } from './08-wallets.js';
import { seedBookings } from './09-bookings.js';
import { seedServiceRequests } from './10-service-requests.js';
import { seedPayments } from './11-payments.js';
import { seedInvoices } from './12-invoices.js';
import { seedCommissions } from './13-commissions.js';
import { seedNotifications } from './14-notifications.js';
import { seedEnquiries } from './15-enquiries.js';
import { seedSupport } from './16-support.js';
import { seedWhitelabel } from './17-whitelabel.js';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Starting Database Seed...');
  
  const args = process.argv.slice(2);
  const isReset = args.includes('--reset');
  
  if (isReset) {
    console.log('⚠️  Resetting database...');
    // Drop logic could go here, but we are using upserts for safety mostly.
    // Full DB wipe requires a specific SQL script due to FK constraints.
    console.log('Reset flag detected. Note: Script relies heavily on upserts.');
  }

  try {
    await seedSystem(prisma);
    await seedTenants(prisma);
    await seedSuppliers(prisma);
    await seedContacts(prisma);
    await seedTravellers(prisma);
    await seedInventory(prisma);
    await seedMarkupRules(prisma);
    await seedWallets(prisma);
    await seedBookings(prisma);
    await seedServiceRequests(prisma);
    await seedPayments(prisma);
    await seedInvoices(prisma);
    await seedCommissions(prisma);
    await seedNotifications(prisma);
    await seedEnquiries(prisma);
    await seedSupport(prisma);
    await seedWhitelabel(prisma);
    
    console.log('\n✅ Seed completed successfully!');
  } catch (error) {
    console.error('\n❌ Seed failed:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();
