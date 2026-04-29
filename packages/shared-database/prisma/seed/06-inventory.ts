/**
 * 06-inventory.ts — InventoryBlock, InventoryTransaction, InventoryAllocation
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS } from './02-tenants.js';
import { log, daysAgo, daysFromNow } from './helpers/faker.js';

export const INVENTORY_IDS = {
  flightBlock1: 'inv-flight-001',
  flightBlock2: 'inv-flight-002',
  flightBlock3: 'inv-flight-003',
  flightBlock4: 'inv-flight-004',
  flightBlock5: 'inv-flight-005',
  hotelBlock1:  'inv-hotel-001',
  hotelBlock2:  'inv-hotel-002',
  hotelBlock3:  'inv-hotel-003',
  hotelBlock4:  'inv-hotel-004',
  hotelBlock5:  'inv-hotel-005',
} as const;

export async function seedInventory(prisma: PrismaClient) {
  console.log('\n🗄️  [06-inventory] Seeding inventory blocks...');

  const blocks = [
    // Flight blocks
    { id: INVENTORY_IDS.flightBlock1, type: 'Flight' as const, provider: 'SABRE', reference: 'SAB-BLK-DXB-LHR-001', total: 50, available: 22, cost: 380, sell: 450, expiry: daysFromNow(60), status: 'Active' as const, agentCode: 'MASTER001' },
    { id: INVENTORY_IDS.flightBlock2, type: 'Flight' as const, provider: 'DUFFEL', reference: 'DUF-BLK-BAH-DXB-001', total: 30, available: 0, cost: 90, sell: 120, expiry: daysAgo(5), status: 'Depleted' as const, agentCode: 'MASTER001' },
    { id: INVENTORY_IDS.flightBlock3, type: 'Flight' as const, provider: 'SABRE', reference: 'SAB-BLK-BAH-LHR-002', total: 20, available: 8, cost: 420, sell: 510, expiry: daysFromNow(90), status: 'Active' as const, agentCode: 'SUBA001' },
    { id: INVENTORY_IDS.flightBlock4, type: 'Flight' as const, provider: 'AMADEUS', reference: 'AMD-BLK-BAH-CDG-001', total: 40, available: 0, cost: 350, sell: 420, expiry: daysAgo(30), status: 'Expired' as const, agentCode: 'MASTER001' },
    { id: INVENTORY_IDS.flightBlock5, type: 'Flight' as const, provider: 'DUFFEL', reference: 'DUF-BLK-RUH-LHR-001', total: 25, available: 10, cost: 480, sell: 570, expiry: daysFromNow(45), status: 'Active' as const, agentCode: 'SUBA002' },
    // Hotel blocks
    { id: INVENTORY_IDS.hotelBlock1, type: 'Hotel' as const, provider: 'LITEAPI', reference: 'LITE-BLK-DXB-HTL-001', total: 100, available: 45, cost: 120, sell: 160, expiry: daysFromNow(30), status: 'Active' as const, agentCode: 'MASTER001' },
    { id: INVENTORY_IDS.hotelBlock2, type: 'Hotel' as const, provider: 'LOCAL_HOTEL_DIRECT', reference: 'LOCAL-BLK-BAH-HTL-001', total: 60, available: 60, cost: 80, sell: 110, expiry: daysFromNow(120), status: 'Active' as const, agentCode: 'SUBA001' },
    { id: INVENTORY_IDS.hotelBlock3, type: 'Hotel' as const, provider: 'LITEAPI', reference: 'LITE-BLK-RUH-HTL-001', total: 80, available: 0, cost: 95, sell: 130, expiry: daysAgo(10), status: 'Depleted' as const, agentCode: 'MASTER001' },
    { id: INVENTORY_IDS.hotelBlock4, type: 'Hotel' as const, provider: 'LOCAL_HOTEL_DIRECT', reference: 'LOCAL-BLK-BAH-HTL-002', total: 40, available: 18, cost: 150, sell: 200, expiry: daysFromNow(75), status: 'Active' as const, agentCode: 'SUBA001' },
    { id: INVENTORY_IDS.hotelBlock5, type: 'Hotel' as const, provider: 'LITEAPI', reference: 'LITE-BLK-IST-HTL-001', total: 50, available: 50, cost: 70, sell: 100, expiry: daysFromNow(180), status: 'Active' as const, agentCode: 'MASTER001' },
  ];

  for (const b of blocks) {
    await prisma.inventoryBlock.upsert({
      where: { id: b.id },
      update: {},
      create: {
        id: b.id, type: b.type, provider: b.provider, reference: b.reference,
        totalQuantity: b.total, availableQuantity: b.available,
        costPerUnit: b.cost, sellPricePerUnit: b.sell,
        expiryDate: b.expiry, status: b.status,
        tenantId: TENANT_IDS.master, agentCode: b.agentCode,
      },
    });
  }
  log('06-inventory', 'InventoryBlock', blocks.length);

  // CarryForward child block from expired block4
  await prisma.inventoryBlock.upsert({
    where: { id: 'inv-flight-004-cf' },
    update: {},
    create: {
      id: 'inv-flight-004-cf',
      type: 'Flight', provider: 'AMADEUS',
      reference: 'AMD-BLK-BAH-CDG-001-CF',
      totalQuantity: 5, availableQuantity: 3,
      costPerUnit: 350, sellPricePerUnit: 420,
      expiryDate: daysFromNow(60), status: 'CarryForwarded',
      tenantId: TENANT_IDS.master, agentCode: 'MASTER001',
      parentBlockId: INVENTORY_IDS.flightBlock4,
    },
  });
  log('06-inventory', 'InventoryBlock (CarryForward)', 1);

  // Transactions for active blocks
  let txnCount = 0;
  for (const b of blocks.filter(x => x.status === 'Active')) {
    const sold = b.total - b.available;
    // Purchase transaction
    await prisma.inventoryTransaction.create({
      data: {
        inventoryBlockId: b.id, quantity: b.total,
        type: 'Purchase', description: `Initial purchase of ${b.reference}`,
        tenantId: TENANT_IDS.master, agentCode: b.agentCode,
      },
    });
    txnCount++;
    // Sale transactions
    if (sold > 0) {
      const numSales = faker.number.int({ min: 2, max: 5 });
      const qtyPerSale = Math.floor(sold / numSales);
      for (let i = 0; i < numSales; i++) {
        await prisma.inventoryTransaction.create({
          data: {
            inventoryBlockId: b.id, quantity: i === numSales - 1 ? sold - qtyPerSale * (numSales - 1) : qtyPerSale,
            type: 'Sale', description: `Booking sale`,
            bookingRef: `BK-20250401-${faker.string.numeric(4)}`,
            tenantId: TENANT_IDS.master, agentCode: b.agentCode,
          },
        });
        txnCount++;
      }
    }
  }
  log('06-inventory', 'InventoryTransaction', txnCount);

  // Allocations
  let allocCount = 0;
  for (const b of [INVENTORY_IDS.flightBlock1, INVENTORY_IDS.hotelBlock1]) {
    for (const status of ['Reserved', 'Confirmed', 'Released']) {
      await prisma.inventoryAllocation.create({
        data: {
          inventoryBlockId: b, bookingRef: `BK-20250401-${faker.string.numeric(4)}`,
          tenantId: TENANT_IDS.sub1, quantity: faker.number.int({ min: 1, max: 3 }),
          reservedUntil: daysFromNow(status === 'Released' ? -1 : 2),
          status, confirmedAt: status === 'Confirmed' ? daysAgo(1) : null,
          releasedAt: status === 'Released' ? daysAgo(1) : null,
        },
      });
      allocCount++;
    }
  }
  log('06-inventory', 'InventoryAllocation', allocCount);
}
