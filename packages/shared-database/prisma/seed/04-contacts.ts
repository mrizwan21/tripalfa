/**
 * 04-contacts.ts — Contact, Activity, Preference
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { log, randomPastDate, randomFutureDate, daysAgo, pickOne } from './helpers/faker.js';

const ACTIVITY_TYPES = ['BOOKING', 'EMAIL', 'CALL', 'MEETING', 'NOTE', 'TASK', 'REMINDER'] as const;

export const CONTACT_IDS = {
  corp1: 'contact-corp-bpc-001', corp2: 'contact-corp-gfh-001',
  corp3: 'contact-corp-stv-001', corp4: 'contact-corp-el-001',
  corp5: 'contact-corp-vip-001', sub1:  'contact-sub-gulf-001',
  sub2:  'contact-sub-riyadh-001', sub3: 'contact-sub-dubai-001',
  sub4:  'contact-sub-jeddah-001', sub5: 'contact-sub-kuwait-001',
  ind1: 'contact-ind-001', ind2: 'contact-ind-002', ind3: 'contact-ind-003',
  ind4: 'contact-ind-004', ind5: 'contact-ind-005', ind6: 'contact-ind-006',
  ind7: 'contact-ind-007', ind8: 'contact-ind-008', ind9: 'contact-ind-009',
  ind10: 'contact-ind-010', walk1: 'contact-walk-001',
  walk2: 'contact-walk-002', walk3: 'contact-walk-003',
} as const;

export async function seedContacts(prisma: PrismaClient) {
  console.log('\n📇 [04-contacts] Seeding contacts...');

  // Corporate contacts
  const corps = [
    { id: CONTACT_IDS.corp1, company: 'Bahrain Petroleum Co', email: 'travel@bpc.com.bh', spend: 180000, tier: 'PLATINUM' },
    { id: CONTACT_IDS.corp2, company: 'Gulf Finance House', email: 'travel@gfh.com', spend: 95000, tier: 'GOLD' },
    { id: CONTACT_IDS.corp3, company: 'Saudi Telecom Ventures', email: 'corp.travel@stv.sa', spend: 320000, tier: 'PLATINUM' },
    { id: CONTACT_IDS.corp4, company: 'Emirates Logistics Ltd', email: 'admin@el-logistics.ae', spend: 60000, tier: 'SILVER' },
    { id: CONTACT_IDS.corp5, company: 'Royal VIP Enterprises', email: 'vip@royalenterprises.bh', spend: 850000, tier: 'DIAMOND' },
  ];
  for (const c of corps) {
    await prisma.contact.upsert({
      where: { id: c.id }, update: {},
      create: {
        id: c.id, tenantId: TENANT_IDS.sub1, agentCode: 'SUBA001',
        type: 'CORPORATE', status: 'Active', companyName: c.company,
        firstName: faker.person.firstName(), lastName: faker.person.lastName(),
        designation: 'Travel Manager', email: c.email,
        phone: `+973 1700 ${faker.number.int({ min: 1000, max: 9999 })}`,
        mobile: `+973 3${faker.number.int({ min: 1000000, max: 9999999 })}`,
        country: 'Bahrain', city: 'Manama',
        creditLimit: faker.number.float({ min: 10000, max: 200000, fractionDigits: 0 }),
        paymentType: 'CREDIT', payPeriod: 'Monthly',
        totalBookings: faker.number.int({ min: 50, max: 500 }), totalSpend: c.spend,
        lastBookingDate: daysAgo(faker.number.int({ min: 1, max: 30 })),
        tier: c.tier,
        travelPolicy: { maxFlightCost: 2000, hotelStars: 4, allowBusinessClass: c.tier === 'PLATINUM' || c.tier === 'DIAMOND' },
      },
    });
  }
  log('04-contacts', 'Contact (CORPORATE)', corps.length);

  // Sub-agent contacts
  const subs = [
    { id: CONTACT_IDS.sub1, company: 'Gulf Travel Solutions', email: 'admin@gulftravelsolutions.com', spend: 450000 },
    { id: CONTACT_IDS.sub2, company: 'Riyadh Express Travel', email: 'admin@riyadhexpress.com', spend: 120000 },
    { id: CONTACT_IDS.sub3, company: 'Dubai Horizons Agency', email: 'admin@dubaihorizons.com', spend: 80000 },
    { id: CONTACT_IDS.sub4, company: 'Jeddah Flyers B2B2C', email: 'admin@jeddahflyers.com', spend: 200000 },
    { id: CONTACT_IDS.sub5, company: 'Kuwait Wings Travel', email: 'admin@kuwaitwings.com', spend: 55000 },
  ];
  for (const c of subs) {
    await prisma.contact.upsert({
      where: { id: c.id }, update: {},
      create: {
        id: c.id, tenantId: TENANT_IDS.master, agentCode: 'MASTER001',
        type: 'SUB_AGENT', status: 'Active', companyName: c.company, email: c.email,
        creditLimit: 50000, paymentType: 'CREDIT', payPeriod: 'Monthly',
        totalBookings: faker.number.int({ min: 100, max: 1000 }), totalSpend: c.spend,
        lastBookingDate: daysAgo(faker.number.int({ min: 1, max: 14 })),
        country: 'Bahrain', city: 'Manama',
      },
    });
  }
  log('04-contacts', 'Contact (SUB_AGENT)', subs.length);

  // Individual contacts
  const names = [
    ['Khalid','Al-Rashid'],['Nour','Ibrahim'],['Saeed','Al-Farsi'],['Layla','Hassan'],
    ['Omar','Al-Sayed'],['Reem','Khalifa'],['Tariq','Mansoor'],['Hana','Al-Qasim'],
    ['Faris','Al-Khalid'],['Sara','Yousuf'],
  ];
  const indIds = [
    CONTACT_IDS.ind1,CONTACT_IDS.ind2,CONTACT_IDS.ind3,CONTACT_IDS.ind4,CONTACT_IDS.ind5,
    CONTACT_IDS.ind6,CONTACT_IDS.ind7,CONTACT_IDS.ind8,CONTACT_IDS.ind9,CONTACT_IDS.ind10,
  ];
  for (let i = 0; i < names.length; i++) {
    const [fn, ln] = names[i];
    const lastDays = faker.number.int({ min: 1, max: 200 });
    await prisma.contact.upsert({
      where: { id: indIds[i] }, update: {},
      create: {
        id: indIds[i], tenantId: TENANT_IDS.sub1, agentCode: 'SUBA001',
        type: 'INDIVIDUAL', status: lastDays > 180 ? 'Dormant' : 'Active',
        firstName: fn, lastName: ln,
        email: `${fn.toLowerCase()}.${ln.toLowerCase().replace('-','')}@email.com`,
        mobile: `+973 3${faker.number.int({ min: 1000000, max: 9999999 })}`,
        country: pickOne(['Bahrain','Saudi Arabia','UAE','Kuwait']),
        city: pickOne(['Manama','Riyadh','Dubai','Kuwait City']),
        creditLimit: 0, paymentType: 'CASH', payPeriod: 'Monthly',
        totalBookings: faker.number.int({ min: 1, max: 30 }),
        totalSpend: faker.number.float({ min: 500, max: 25000, fractionDigits: 0 }),
        lastBookingDate: daysAgo(lastDays),
        frequentFlyerNos: { EK: `EK${faker.string.numeric(9)}` },
      },
    });
  }
  log('04-contacts', 'Contact (INDIVIDUAL)', names.length);

  // Walk-in contacts
  const walkIds = [CONTACT_IDS.walk1, CONTACT_IDS.walk2, CONTACT_IDS.walk3];
  for (const wid of walkIds) {
    await prisma.contact.upsert({
      where: { id: wid }, update: {},
      create: {
        id: wid, tenantId: TENANT_IDS.sub1, agentCode: 'SUBA001',
        type: 'WALK_IN', status: 'Active',
        firstName: faker.person.firstName(), lastName: faker.person.lastName(),
        email: faker.internet.email(),
        mobile: `+973 3${faker.number.int({ min: 1000000, max: 9999999 })}`,
        country: 'Bahrain', city: 'Manama',
        creditLimit: 0, paymentType: 'CASH', payPeriod: 'Monthly',
        totalBookings: faker.number.int({ min: 1, max: 5 }),
        totalSpend: faker.number.float({ min: 200, max: 3000, fractionDigits: 0 }),
      },
    });
  }
  log('04-contacts', 'Contact (WALK_IN)', 3);

  // Activities for all contacts
  const allIds = Object.values(CONTACT_IDS);
  let actCount = 0;
  for (const contactId of allIds) {
    const n = faker.number.int({ min: 3, max: 6 });
    for (let j = 0; j < n; j++) {
      const type = pickOne(ACTIVITY_TYPES);
      await prisma.activity.create({
        data: {
          contactId, type,
          subject: `${type}: ${faker.lorem.words(3)}`,
          description: faker.lorem.sentence(),
          createdBy: USER_IDS.sub1Agent,
          scheduledAt: type === 'TASK' ? randomFutureDate(1, 30) : undefined,
          completedAt: type === 'EMAIL' ? randomPastDate(1, 14) : undefined,
          bookingRef: type === 'BOOKING' ? `BK-20250401-${faker.string.numeric(4)}` : undefined,
        },
      });
      actCount++;
    }
  }
  log('04-contacts', 'Activity', actCount);

  // Preferences for first 10 contacts
  let prefCount = 0;
  const prefCats = ['flight', 'hotel', 'seat', 'meal'];
  for (const cid of allIds.slice(0, 10)) {
    for (const cat of prefCats.slice(0, faker.number.int({ min: 2, max: 4 }))) {
      await prisma.preference.upsert({
        where: { contactId_category_key: { contactId: cid, category: cat, key: 'preferred' } },
        update: {},
        create: {
          contactId: cid, category: cat, key: 'preferred',
          value: cat === 'seat' ? 'Window' : cat === 'meal' ? 'Halal' : cat === 'hotel' ? '5-star' : 'Economy',
          priority: faker.number.int({ min: 0, max: 5 }),
          isRequired: faker.datatype.boolean(),
        },
      });
      prefCount++;
    }
  }
  log('04-contacts', 'Preference', prefCount);
}
