/**
 * 13-commissions.ts — CommissionSharingRule, CommissionTransaction
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { RULE_IDS } from './07-markup-rules.js';
import { TENANT_IDS } from './02-tenants.js';
import { log, genCommissionTxnSlug } from './helpers/faker.js';

export async function seedCommissions(prisma: PrismaClient) {
  console.log('\n🤝 [13-commissions] Seeding commission sharing rules and transactions...');

  let sharingRuleCount = 0;
  let txnCount = 0;

  // 1. Commission Sharing Rules
  const sharingRules = [
    {
      commissionRuleId: RULE_IDS.commSabre,
      shareType: 'Percentage', shareValue: 40.0,
      recipientType: 'SubAgent', customerId: TENANT_IDS.sub1,
      minBookingValue: 0, isActive: true,
    },
    {
      commissionRuleId: RULE_IDS.commSabre,
      shareType: 'Percentage', shareValue: 50.0,
      recipientType: 'SubAgent', customerId: TENANT_IDS.sub5, // High volume agent gets better share
      minBookingValue: 1000, isActive: true,
    },
    {
      commissionRuleId: RULE_IDS.commLiteAPI,
      shareType: 'Percentage', shareValue: 30.0,
      recipientType: 'SubAgent', customerId: null, // Default share for all subagents
      minBookingValue: 0, isActive: true,
    },
    {
      commissionRuleId: RULE_IDS.commDuffel,
      shareType: 'Fixed', shareValue: 2.5, // Shared flat fee per segment
      recipientType: 'Corporate', customerId: TENANT_IDS.corp1,
      minBookingValue: 0, isActive: true,
    },
    {
      commissionRuleId: RULE_IDS.commLocal,
      shareType: 'Percentage', shareValue: 60.0,
      recipientType: 'SubAgent', customerId: TENANT_IDS.sub2,
      minBookingValue: 0, isActive: true,
    },
  ];

  const createdSharingRules = [];
  for (const rule of sharingRules) {
    const created = await prisma.commissionSharingRule.create({
      data: rule,
    });
    createdSharingRules.push(created);
    sharingRuleCount++;
  }

  // 2. Commission Transactions
  // We'll generate a few mock transactions representing shared commissions on bookings
  for (const sr of createdSharingRules) {
    const numTxns = faker.number.int({ min: 2, max: 6 });
    for (let i = 0; i < numTxns; i++) {
      const baseComm = faker.number.float({ min: 10, max: 150, fractionDigits: 2 });
      let sharedAmount = 0;
      
      if (sr.shareType === 'Percentage') {
        sharedAmount = baseComm * (sr.shareValue / 100);
      } else {
        sharedAmount = sr.shareValue;
      }
      const retainedAmount = baseComm - sharedAmount;

      await prisma.commissionTransaction.create({
        data: {
          bookingRef: `BK-20250401-${faker.string.numeric(4)}`,
          commissionRuleId: sr.commissionRuleId,
          sharingRuleId: sr.id,
          baseCommission: baseComm,
          sharedAmount,
          retainedAmount,
          currency: 'BHD',
          recipientType: sr.recipientType,
          recipientId: sr.customerId,
          status: faker.helpers.arrayElement(['Pending', 'Paid', 'Paid', 'Paid', 'Reversed']),
          paidAt: faker.helpers.arrayElement([new Date(), null]),
          slug: genCommissionTxnSlug(),
          description: `Shared commission for booking`,
        },
      });
      txnCount++;
    }
  }

  log('13-commissions', 'CommissionSharingRule', sharingRuleCount);
  log('13-commissions', 'CommissionTransaction', txnCount);
}
