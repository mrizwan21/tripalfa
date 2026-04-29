/**
 * 07-markup-rules.ts — MarkupRule, CommissionRule, TaxRule + audit logs
 */
import { PrismaClient } from '../../generated/prisma-client';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { SUPPLIER_IDS } from './03-suppliers.js';
import { CONTACT_IDS } from './04-contacts.js';
import { log, daysFromNow, daysAgo } from './helpers/faker.js';

export const RULE_IDS = {
  markupBaseFlight: 'rule-mkp-flight-base',
  markupEKOverride: 'rule-mkp-flight-ek',
  markupVIPExcep: 'rule-mkp-flight-vip',
  markupHotelBase: 'rule-mkp-hotel-base',
  markupHotelAmadeus: 'rule-mkp-hotel-amadeus',
  markupCarBase: 'rule-mkp-car-base',
  markupB2B2C: 'rule-mkp-b2b2c',
  markupExpired: 'rule-mkp-expired',
  commSabre: 'rule-comm-sabre',
  commDuffel: 'rule-comm-duffel',
  commLiteAPI: 'rule-comm-liteapi',
  commLocal: 'rule-comm-local',
  taxVatBH: 'rule-tax-vat-bh',
  taxVatSA: 'rule-tax-vat-sa',
  taxCityDubai: 'rule-tax-city-dxb',
} as const;

export async function seedMarkupRules(prisma: PrismaClient) {
  console.log('\n🧮 [07-markup-rules] Seeding markup, commission, and tax rules...');

  // ── MarkupRule ─────────────────────────────────────────────────────────────
  const markups = [
    { id: RULE_IDS.markupBaseFlight, name: 'Base Flight Markup', serviceType: 'Flight', valueType: 'Percentage' as const, value: 5.0, ruleLevel: 'BASE' as const, priority: 0 },
    { id: RULE_IDS.markupEKOverride, name: 'Emirates Fixed Override', serviceType: 'Flight', valueType: 'Fixed' as const, value: 10.0, ruleLevel: 'OVERRIDE' as const, priority: 10, airlineCode: 'EK' },
    { id: RULE_IDS.markupVIPExcep, name: 'VIP Zero Markup Exception', serviceType: 'Flight', valueType: 'Percentage' as const, value: 0.0, ruleLevel: 'EXCEPTION' as const, priority: 100, customerTier: 'DIAMOND', customerId: CONTACT_IDS.corp5 },
    { id: RULE_IDS.markupHotelBase, name: 'Base Hotel Markup', serviceType: 'Hotel', valueType: 'Percentage' as const, value: 8.0, ruleLevel: 'BASE' as const, priority: 0 },
    { id: RULE_IDS.markupHotelAmadeus, name: 'Amadeus Hotel Override', serviceType: 'Hotel', valueType: 'Percentage' as const, value: 12.0, ruleLevel: 'OVERRIDE' as const, priority: 10, supplierCode: 'AMADEUS' },
    { id: RULE_IDS.markupCarBase, name: 'Base Car Markup', serviceType: 'Car', valueType: 'Percentage' as const, value: 10.0, ruleLevel: 'BASE' as const, priority: 0 },
    { id: RULE_IDS.markupB2B2C, name: 'B2B2C High Markup', serviceType: 'Flight', valueType: 'Percentage' as const, value: 15.0, ruleLevel: 'BASE' as const, priority: 5, salesChannels: ['POS-JED-B2C'], tenantId: TENANT_IDS.sub5 },
    { id: RULE_IDS.markupExpired, name: 'Summer Promo (Expired)', serviceType: 'Hotel', valueType: 'Fixed' as const, value: -5.0, ruleLevel: 'OVERRIDE' as const, priority: 50, effectiveFrom: daysAgo(90), effectiveTo: daysAgo(30), isActive: false },
  ];

  for (const rule of markups) {
    await prisma.markupRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        ...rule,
        createdBy: USER_IDS.masterAdmin,
      },
    });
  }
  log('07-markup-rules', 'MarkupRule', markups.length);

  // ── CommissionRule ─────────────────────────────────────────────────────────
  const commissions = [
    { id: RULE_IDS.commSabre, name: 'Sabre GDS Base Comm', sourceType: 'GDS' as const, serviceType: 'Flight', commissionType: 'Percentage' as const, baseCommission: 3.0, supplierCode: 'SABRE' },
    { id: RULE_IDS.commDuffel, name: 'Duffel NDC Comm', sourceType: 'Airline' as const, serviceType: 'Flight', commissionType: 'Fixed' as const, baseCommission: 5.0, supplierCode: 'DUFFEL' },
    { id: RULE_IDS.commLiteAPI, name: 'LiteAPI Hotel Comm', sourceType: 'HotelSupplier' as const, serviceType: 'Hotel', commissionType: 'Percentage' as const, baseCommission: 12.0, supplierCode: 'LITEAPI' },
    { id: RULE_IDS.commLocal, name: 'Local Direct Comm', sourceType: 'DirectContract' as const, serviceType: 'Hotel', commissionType: 'Percentage' as const, baseCommission: 15.0, supplierCode: 'LOCAL_HOTEL_DIRECT' },
  ];

  for (const rule of commissions) {
    await prisma.commissionRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        ...rule,
        createdBy: USER_IDS.masterAdmin,
      },
    });
  }
  log('07-markup-rules', 'CommissionRule', commissions.length);

  // ── TaxRule ────────────────────────────────────────────────────────────────
  const taxes = [
    { id: RULE_IDS.taxVatBH, name: 'Bahrain VAT', serviceType: 'All', valueType: 'Percentage' as const, value: 10.0, taxCode: 'VAT', taxAuthority: 'Government', isRecoverable: false, appliesToNet: true },
    { id: RULE_IDS.taxVatSA, name: 'Saudi VAT', serviceType: 'All', valueType: 'Percentage' as const, value: 15.0, taxCode: 'VAT', taxAuthority: 'ZATCA', isRecoverable: false, appliesToNet: true },
    { id: RULE_IDS.taxCityDubai, name: 'Dubai Tourism Dirham', serviceType: 'Hotel', valueType: 'Fixed' as const, value: 20.0, taxCode: 'CITY_TAX', taxAuthority: 'Local', isRecoverable: false, appliesToNet: false, destinationCode: 'DXB' },
  ];

  for (const rule of taxes) {
    await prisma.taxRule.upsert({
      where: { id: rule.id },
      update: {},
      create: {
        ...rule,
        createdBy: USER_IDS.masterAdmin,
      },
    });
  }
  log('07-markup-rules', 'TaxRule', taxes.length);

  // ── Audit Logs ─────────────────────────────────────────────────────────────
  let auditCount = 0;
  for (const mkp of markups.slice(0, 3)) {
    await prisma.markupRuleAuditLog.create({
      data: {
        ruleId: mkp.id, action: 'UPDATE',
        previousValues: JSON.stringify({ value: 4.0 }),
        newValues: JSON.stringify({ value: mkp.value }),
        changedBy: USER_IDS.masterAdmin, changedAt: daysAgo(5),
      },
    });
    auditCount++;
  }
  for (const comm of commissions.slice(0, 2)) {
    await prisma.commissionRuleAuditLog.create({
      data: {
        ruleId: comm.id, action: 'CREATE',
        newValues: JSON.stringify(comm),
        changedBy: USER_IDS.masterAdmin, changedAt: daysAgo(10),
      },
    });
    auditCount++;
  }
  log('07-markup-rules', 'AuditLogs', auditCount);
}
