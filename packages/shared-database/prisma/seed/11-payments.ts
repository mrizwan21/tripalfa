/**
 * 11-payments.ts — WalletTransaction, WalletHold, WalletRefund, WalletReconciliationLog, FinancialEvent, LedgerEntry
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { WALLET_IDS } from './08-wallets.js';
import { BOOKING_IDS } from './09-bookings.js';
import { USER_IDS } from './02-tenants.js';
import { log, genTxnNo, genHoldNo, genRefundNo, genLedgerEntryNo, daysAgo } from './helpers/faker.js';

export async function seedPayments(prisma: PrismaClient) {
  console.log('\n💳 [11-payments] Seeding payments and ledger entries...');

  const bookingKeys = Object.keys(BOOKING_IDS);

  let txnCount = 0;
  let holdCount = 0;
  let refundCount = 0;
  let reconCount = 0;
  let eventCount = 0;
  let ledgerCount = 0;

  // For each agent wallet, create some transaction history
  for (const walletId of Object.values(WALLET_IDS)) {
    if (!walletId.includes('-agt-')) continue;

    const currencyAccounts = await prisma.currencyAccount.findMany({ where: { walletId } });
    if (currencyAccounts.length === 0) continue;

    const mainAcc = currencyAccounts.find(a => a.currency === 'BHD') || currencyAccounts[0];
    const usdAcc = currencyAccounts.find(a => a.currency === 'USD') || currencyAccounts[0];

    // 1. Initial Deposit (CREDIT)
    const depTxn = await prisma.walletTransaction.create({
      data: {
        walletId,
        currencyAccountId: mainAcc.id,
        referenceId: `DEP-${faker.string.numeric(6)}`,
        amount: 20000,
        currency: mainAcc.currency,
        balanceAfter: 20000,
        category: 'PAYMENT',
        type: 'CREDIT',
        status: 'Completed',
        description: 'Initial Bank Transfer',
        transactionNo: genTxnNo(),
        paymentMethod: 'BANK_TRANSFER',
        processedAt: daysAgo(30),
      },
    });
    txnCount++;

    await prisma.ledgerEntry.createMany({
      data: [
        { entryNo: genLedgerEntryNo(), transactionId: depTxn.id, entryType: 'DEBIT', amount: 20000, currency: mainAcc.currency, accountId: 'ledger-cash', description: 'Bank Deposit' },
        { entryNo: genLedgerEntryNo(), transactionId: depTxn.id, entryType: 'CREDIT', amount: 20000, currency: mainAcc.currency, accountId: 'ledger-client-funds', description: 'Client Wallet Credit' },
      ],
    });
    ledgerCount += 2;

    await prisma.financialEvent.create({
      data: { eventType: 'WALLET_CREDIT', entity: 'WalletTransaction', entityId: depTxn.id, amount: 20000, currency: mainAcc.currency },
    });
    eventCount++;

    // 2. Flight Booking Deduction (DEBIT)
    const bookingId1 = faker.helpers.arrayElement(bookingKeys);
    const bkTxn = await prisma.walletTransaction.create({
      data: {
        walletId,
        currencyAccountId: mainAcc.id,
        referenceId: bookingId1,
        bookingId: bookingId1,
        amount: 500,
        currency: mainAcc.currency,
        balanceAfter: 19500,
        category: 'FLIGHT_BOOKING',
        type: 'DEBIT',
        status: 'Completed',
        description: 'Flight Booking Payment',
        transactionNo: genTxnNo(),
        processedAt: daysAgo(15),
      },
    });
    txnCount++;

    await prisma.ledgerEntry.createMany({
      data: [
        { entryNo: genLedgerEntryNo(), transactionId: bkTxn.id, bookingId: bookingId1, entryType: 'DEBIT', amount: 500, currency: mainAcc.currency, accountId: 'ledger-client-funds', description: 'Client Wallet Debit' },
        { entryNo: genLedgerEntryNo(), transactionId: bkTxn.id, bookingId: bookingId1, entryType: 'CREDIT', amount: 500, currency: mainAcc.currency, accountId: 'ledger-rev-flight', description: 'Flight Revenue' },
      ],
    });
    ledgerCount += 2;

    await prisma.financialEvent.create({
      data: { eventType: 'WALLET_DEBIT', entity: 'WalletTransaction', entityId: bkTxn.id, amount: 500, currency: mainAcc.currency },
    });
    eventCount++;

    // 3. Hold placed then released (PROVISIONAL -> CANCELLED)
    const holdAmount = faker.number.float({ min: 100, max: 1000, fractionDigits: 2 });
    const hold = await prisma.walletHold.create({
      data: {
        walletId,
        currencyAccountId: mainAcc.id,
        holdNo: genHoldNo(),
        bookingRef: `BK-TEST-${faker.string.numeric(4)}`,
        amount: holdAmount,
        currency: mainAcc.currency,
        status: 'RELEASED',
        reason: 'Provisional Booking Hold',
        releasedAt: daysAgo(5),
      },
    });
    holdCount++;

    await prisma.financialEvent.createMany({
      data: [
        { eventType: 'HOLD_PLACED', entity: 'WalletHold', entityId: hold.id, amount: holdAmount, currency: mainAcc.currency, createdAt: daysAgo(6) },
        { eventType: 'HOLD_RELEASED', entity: 'WalletHold', entityId: hold.id, amount: holdAmount, currency: mainAcc.currency, createdAt: daysAgo(5) },
      ],
    });
    eventCount += 2;

    // 4. Refund
    const refAmount = faker.number.float({ min: 50, max: 300, fractionDigits: 2 });
    const refund = await prisma.walletRefund.create({
      data: {
        walletId,
        refundNo: genRefundNo(),
        originalTransactionId: bkTxn.id,
        bookingRef: `BK-TEST-${faker.string.numeric(4)}`,
        originalAmount: refAmount + 50,
        penaltyAmount: 50,
        refundAmount: refAmount,
        currency: mainAcc.currency,
        status: 'Processed',
        reason: 'Customer Cancellation',
        processedAt: daysAgo(2),
        processedBy: USER_IDS.masterAdmin,
      },
    });
    refundCount++;

    // Refund Credit Transaction
    const refTxn = await prisma.walletTransaction.create({
      data: {
        walletId,
        currencyAccountId: mainAcc.id,
        referenceId: refund.id,
        amount: refAmount,
        currency: mainAcc.currency,
        balanceAfter: 19500 + refAmount, // simplified
        category: 'REFUND',
        type: 'CREDIT',
        status: 'Completed',
        description: 'Booking Refund',
        transactionNo: genTxnNo(),
        processedAt: daysAgo(2),
      },
    });
    txnCount++;

    // 5. FX Transaction (Booking in USD, charged to BHD wallet)
    if (usdAcc && mainAcc) {
      await prisma.walletTransaction.create({
        data: {
          walletId,
          currencyAccountId: mainAcc.id,
          referenceId: `FX-${faker.string.numeric(6)}`,
          amount: 100 * 0.376, // BHD amount
          currency: mainAcc.currency,
          balanceAfter: 19500 + refAmount - (100 * 0.376), // simplified
          category: 'HOTEL_BOOKING',
          type: 'DEBIT',
          status: 'Completed',
          description: 'Hotel Booking (USD)',
          transactionNo: genTxnNo(),
          fxRate: 0.376,
          originalAmount: 100,
          originalCurrency: 'USD',
          processedAt: daysAgo(1),
        },
      });
      txnCount++;
    }

    // 6. Reconciliation Log
    await prisma.walletReconciliationLog.create({
      data: {
        walletId,
        currency: mainAcc.currency,
        balanceBefore: 19500 + refAmount - (100 * 0.376), // simplified
        balanceAfter: 19500 + refAmount - (100 * 0.376), // match
        systemBalance: 19500 + refAmount - (100 * 0.376),
        ledgerBalance: 19500 + refAmount - (100 * 0.376),
        discrepancy: 0,
        adjustedAmount: 0,
        reason: 'Monthly Reconciliation',
        status: 'RECONCILED',
        reconciledBy: USER_IDS.superAdmin,
        reconciledAt: daysAgo(0),
      },
    });
    reconCount++;
  }

  log('11-payments', 'WalletTransaction', txnCount);
  log('11-payments', 'WalletHold', holdCount);
  log('11-payments', 'WalletRefund', refundCount);
  log('11-payments', 'WalletReconciliationLog', reconCount);
  log('11-payments', 'FinancialEvent', eventCount);
  log('11-payments', 'LedgerEntry', ledgerCount);
}
