/**
 * 12-invoices.ts — Invoice, CorporateInvoice, SupplierSettlement
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { BOOKING_IDS } from './09-bookings.js';
import { WALLET_IDS } from './08-wallets.js';
import { SUPPLIER_WALLET_IDS } from './03-suppliers.js';
import { log, genInvoiceNo, genCorpInvoiceNo, genSettlementNo, daysAgo } from './helpers/faker.js';

export async function seedInvoices(prisma: PrismaClient) {
  console.log('\n🧾 [12-invoices] Seeding invoices and settlements...');

  let invCount = 0;
  let corpInvCount = 0;
  let settCount = 0;

  // 1. Regular Invoices (per booking)
  // We'll just create a few invoices for the first 15 bookings
  const bookingIds = Object.keys(BOOKING_IDS).slice(0, 15);
  for (const bookingId of bookingIds) {
    const amount = faker.number.float({ min: 100, max: 1500, fractionDigits: 2 });
    await prisma.invoice.create({
      data: {
        invoiceNumber: genInvoiceNo(),
        bookingId,
        totalAmount: amount,
        currency: 'BHD',
        status: faker.helpers.arrayElement(['PENDING', 'PAID', 'PAID']),
        dueDate: daysAgo(-7), // 7 days in future
        lineItems: [
          { description: 'Flight Ticket', amount: amount * 0.9 },
          { description: 'Service Fee', amount: amount * 0.1 },
        ],
      },
    });
    invCount++;
  }

  // 2. Corporate Invoices
  // We seeded corporate accounts with IDs matching `corp-acc-${walletId}`
  const corpWallets = [WALLET_IDS.corp1, WALLET_IDS.corp2, WALLET_IDS.corp3, WALLET_IDS.corp4];
  for (const walletId of corpWallets) {
    const corpAccId = `corp-acc-${walletId}`;
    
    // Check if corp account exists first
    const corpAcc = await prisma.corporateAccount.findUnique({ where: { id: corpAccId } });
    if (!corpAcc) continue;

    // Paid invoice
    await prisma.corporateInvoice.create({
      data: {
        invoiceNo: genCorpInvoiceNo(corpAcc.corporateId),
        corporateAccountId: corpAcc.id,
        billingPeriodStart: daysAgo(60),
        billingPeriodEnd: daysAgo(30),
        totalAmount: faker.number.float({ min: 5000, max: 20000, fractionDigits: 2 }),
        currency: 'BHD',
        status: 'PAID',
        dueDate: daysAgo(15),
        paidAt: daysAgo(10),
        paymentMethod: 'BANK_TRANSFER',
        lineItems: [{ description: 'Monthly Travel Spend', amount: 15000 }],
      },
    });
    corpInvCount++;

    // Pending invoice
    await prisma.corporateInvoice.create({
      data: {
        invoiceNo: genCorpInvoiceNo(corpAcc.corporateId),
        corporateAccountId: corpAcc.id,
        billingPeriodStart: daysAgo(30),
        billingPeriodEnd: daysAgo(0),
        totalAmount: faker.number.float({ min: 2000, max: 15000, fractionDigits: 2 }),
        currency: 'BHD',
        status: 'PENDING',
        dueDate: daysAgo(-15),
        lineItems: [{ description: 'Monthly Travel Spend', amount: 8000 }],
      },
    });
    corpInvCount++;
  }

  // 3. Supplier Settlements
  const supWallets = Object.values(SUPPLIER_WALLET_IDS);
  for (const walletId of supWallets) {
    const supWalletId = `sup-wallet-${walletId.replace('sup-wallet-', '')}`; // the owner ID
    
    const supWallet = await prisma.supplierWallet.findUnique({ where: { id: supWalletId } });
    if (!supWallet) continue;

    // Paid settlement
    await prisma.supplierSettlement.create({
      data: {
        settlementNo: genSettlementNo(supWallet.supplierId),
        supplierWalletId: supWallet.id,
        settlementPeriodStart: daysAgo(60),
        settlementPeriodEnd: daysAgo(30),
        totalAmount: faker.number.float({ min: 10000, max: 50000, fractionDigits: 2 }),
        currency: supWallet.settlementCurrency,
        status: 'PAID',
        paidAt: daysAgo(15),
        paymentMethod: 'BANK_TRANSFER',
      },
    });
    settCount++;

    // Pending settlement
    await prisma.supplierSettlement.create({
      data: {
        settlementNo: genSettlementNo(supWallet.supplierId),
        supplierWalletId: supWallet.id,
        settlementPeriodStart: daysAgo(30),
        settlementPeriodEnd: daysAgo(0),
        totalAmount: faker.number.float({ min: 5000, max: 30000, fractionDigits: 2 }),
        currency: supWallet.settlementCurrency,
        status: 'PENDING',
      },
    });
    settCount++;
  }

  log('12-invoices', 'Invoice', invCount);
  log('12-invoices', 'CorporateInvoice', corpInvCount);
  log('12-invoices', 'SupplierSettlement', settCount);
}
