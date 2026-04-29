/**
 * 03-suppliers.ts — Supplier, SupplierContract, SupplierMetric, SupplierAlert, SupplierWallet, SupplierSettlement
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { log, daysAgo, randomPastDate, genSettlementNo } from './helpers/faker.js';

export const SUPPLIER_IDS = {
  sabre: 'supplier-sabre-001',
  duffel: 'supplier-duffel-001',
  liteapi: 'supplier-liteapi-001',
  amadeus: 'supplier-amadeus-001',
  localHotel: 'supplier-local-hotel-001',
} as const;

export const SUPPLIER_WALLET_IDS = {
  sabre: 'sup-wallet-sabre-001',
  duffel: 'sup-wallet-duffel-001',
  liteapi: 'sup-wallet-liteapi-001',
  amadeus: 'sup-wallet-amadeus-001',
  localHotel: 'sup-wallet-local-001',
} as const;

export async function seedSuppliers(prisma: PrismaClient) {
  console.log('\n🔌 [03-suppliers] Seeding suppliers...');

  const suppliers = [
    {
      id: SUPPLIER_IDS.sabre,
      name: 'Sabre GDS',
      code: 'SABRE',
      type: 'GDS',
      status: true,
      email: 'api@sabre.com',
      website: 'https://www.sabre.com',
      country: 'USA',
      currency: 'USD',
      creditLimit: 500000,
      availableCredit: 320000,
      settlementPeriod: 'Monthly',
      onboardingStatus: 'ACTIVE',
      contractDate: new Date('2023-01-01'),
    },
    {
      id: SUPPLIER_IDS.duffel,
      name: 'Duffel NDC',
      code: 'DUFFEL',
      type: 'NDC',
      status: true,
      email: 'support@duffel.com',
      website: 'https://duffel.com',
      country: 'United Kingdom',
      currency: 'USD',
      creditLimit: 200000,
      availableCredit: 150000,
      settlementPeriod: 'Weekly',
      onboardingStatus: 'ACTIVE',
      contractDate: new Date('2023-06-01'),
    },
    {
      id: SUPPLIER_IDS.liteapi,
      name: 'LiteAPI Hotels',
      code: 'LITEAPI',
      type: 'Bedbank',
      status: true,
      email: 'support@liteapi.travel',
      website: 'https://liteapi.travel',
      country: 'USA',
      currency: 'USD',
      creditLimit: 150000,
      availableCredit: 110000,
      settlementPeriod: 'Monthly',
      onboardingStatus: 'ACTIVE',
      contractDate: new Date('2023-09-01'),
    },
    {
      id: SUPPLIER_IDS.amadeus,
      name: 'Amadeus GDS',
      code: 'AMADEUS',
      type: 'GDS',
      status: true,
      email: 'api@amadeus.com',
      website: 'https://amadeus.com',
      country: 'Spain',
      currency: 'EUR',
      creditLimit: 300000,
      availableCredit: 280000,
      settlementPeriod: 'Monthly',
      onboardingStatus: 'AUTHORIZED',
      contractDate: new Date('2024-01-01'),
    },
    {
      id: SUPPLIER_IDS.localHotel,
      name: 'Gulf Hotels Direct',
      code: 'LOCAL_HOTEL_DIRECT',
      type: 'DirectContract',
      status: true,
      email: 'contracts@gulfhotels.bh',
      website: 'https://gulfhotels.bh',
      country: 'Bahrain',
      currency: 'BHD',
      creditLimit: 50000,
      availableCredit: 42000,
      settlementPeriod: 'Fortnightly',
      onboardingStatus: 'ACTIVE',
      contractDate: new Date('2022-07-01'),
    },
  ];

  for (const s of suppliers) {
    await prisma.supplier.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }
  log('03-suppliers', 'Supplier', suppliers.length);

  // ── SupplierContract ─────────────────────────────────────────────────────
  const contracts = [
    { supplierId: SUPPLIER_IDS.sabre, contractRef: 'CTR-SABRE-2023', startDate: new Date('2023-01-01'), endDate: new Date('2025-12-31'), netMarkup: 3.0, isActive: true },
    { supplierId: SUPPLIER_IDS.sabre, contractRef: 'CTR-SABRE-2022', startDate: new Date('2022-01-01'), endDate: new Date('2022-12-31'), netMarkup: 2.5, isActive: false },
    { supplierId: SUPPLIER_IDS.duffel, contractRef: 'CTR-DUFFEL-2023', startDate: new Date('2023-06-01'), endDate: new Date('2025-05-31'), netMarkup: 2.0, isActive: true },
    { supplierId: SUPPLIER_IDS.liteapi, contractRef: 'CTR-LITEAPI-2023', startDate: new Date('2023-09-01'), endDate: new Date('2026-08-31'), netMarkup: 4.5, isActive: true },
    { supplierId: SUPPLIER_IDS.amadeus, contractRef: 'CTR-AMADEUS-2024', startDate: new Date('2024-01-01'), endDate: new Date('2025-12-31'), netMarkup: 3.5, isActive: true },
    { supplierId: SUPPLIER_IDS.localHotel, contractRef: 'CTR-GULF-2022', startDate: new Date('2022-07-01'), endDate: new Date('2025-06-30'), netMarkup: 6.0, isActive: true },
    { supplierId: SUPPLIER_IDS.localHotel, contractRef: 'CTR-GULF-2025', startDate: new Date('2025-07-01'), endDate: new Date('2027-06-30'), netMarkup: 7.0, isActive: false, terms: 'Renewal pending signature' },
  ];

  for (const c of contracts) {
    await prisma.supplierContract.upsert({
      where: { id: `ctr-${c.contractRef.toLowerCase()}` },
      update: {},
      create: { id: `ctr-${c.contractRef.toLowerCase()}`, ...c, terms: (c as any).terms ?? 'Standard terms apply.' },
    });
  }
  log('03-suppliers', 'SupplierContract', contracts.length);

  // ── SupplierMetric (last 48 data points per supplier) ───────────────────
  let metricCount = 0;
  for (const supplierId of Object.values(SUPPLIER_IDS)) {
    for (let i = 0; i < 48; i++) {
      const ts = daysAgo(0);
      ts.setHours(ts.getHours() - i);
      await prisma.supplierMetric.create({
        data: {
          supplierId,
          timestamp: ts,
          latencyMs: faker.number.int({ min: 120, max: 800 }),
          successRate: parseFloat(faker.number.float({ min: 0.92, max: 0.999 }).toFixed(3)),
          errorCount: faker.number.int({ min: 0, max: 5 }),
          pnrVelocity: faker.number.int({ min: 2, max: 40 }),
        },
      });
      metricCount++;
    }
  }
  log('03-suppliers', 'SupplierMetric', metricCount);

  // ── SupplierAlert ────────────────────────────────────────────────────────
  const alerts = [
    { supplierId: SUPPLIER_IDS.sabre, type: 'BALANCE_LOW', threshold: 50000, status: 'ACTIVE' },
    { supplierId: SUPPLIER_IDS.duffel, type: 'LATENCY_HIGH', threshold: 500, status: 'TRIGGERED' },
    { supplierId: SUPPLIER_IDS.liteapi, type: 'ERROR_RATE_HIGH', threshold: 0.05, status: 'RESOLVED' },
    { supplierId: SUPPLIER_IDS.amadeus, type: 'BALANCE_LOW', threshold: 30000, status: 'ACTIVE' },
  ];

  for (const al of alerts) {
    await prisma.supplierAlert.create({ data: al });
  }
  log('03-suppliers', 'SupplierAlert', alerts.length);
}
