/**
 * 05-travellers.ts — TravellerProfile and all sub-tables
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS } from './02-tenants.js';
import { log, daysAgo, daysFromNow, randomPastDate } from './helpers/faker.js';

export const TRAVELLER_IDS = {
  t1: 'traveller-001', t2: 'traveller-002', t3: 'traveller-003',
  t4: 'traveller-004', t5: 'traveller-005', t6: 'traveller-006',
  t7: 'traveller-007', t8: 'traveller-008', t9: 'traveller-009',
  t10: 'traveller-010', t11: 'traveller-011', t12: 'traveller-012',
  t13: 'traveller-013', t14: 'traveller-014', t15: 'traveller-015',
  t16: 'traveller-016', t17: 'traveller-017', t18: 'traveller-018',
  t19: 'traveller-019', t20: 'traveller-020',
} as const;

// Type for first 5 travellers (used in passport data)
type TravellerID5 = typeof TRAVELLER_IDS.t1 | typeof TRAVELLER_IDS.t2 | typeof TRAVELLER_IDS.t3 | typeof TRAVELLER_IDS.t4 | typeof TRAVELLER_IDS.t5;

const profiles = [
  { id: TRAVELLER_IDS.t1, first: 'Ahmed', last: 'Al-Mansoori', type: 'VIP', dob: '1978-05-15', nat: 'Bahraini' },
  { id: TRAVELLER_IDS.t2, first: 'Fatima', last: 'Hassan', type: 'CIP', dob: '1985-09-22', nat: 'Bahraini' },
  { id: TRAVELLER_IDS.t3, first: 'Khalid', last: 'Al-Rashid', type: 'Regular', dob: '1990-03-10', nat: 'Saudi' },
  { id: TRAVELLER_IDS.t4, first: 'Nour', last: 'Ibrahim', type: 'Regular', dob: '1993-11-28', nat: 'Jordanian' },
  { id: TRAVELLER_IDS.t5, first: 'Saeed', last: 'Al-Farsi', type: 'VIP', dob: '1970-07-04', nat: 'Emirati' },
  { id: TRAVELLER_IDS.t6, first: 'Layla', last: 'Khalifa', type: 'Regular', dob: '1995-02-14', nat: 'Bahraini' },
  { id: TRAVELLER_IDS.t7, first: 'Omar', last: 'Al-Sayed', type: 'Regular', dob: '1988-06-30', nat: 'Egyptian' },
  { id: TRAVELLER_IDS.t8, first: 'Reem', last: 'Al-Qasim', type: 'CIP', dob: '1982-12-01', nat: 'Kuwaiti' },
  { id: TRAVELLER_IDS.t9, first: 'Tariq', last: 'Mansoor', type: 'Regular', dob: '1997-04-18', nat: 'Saudi' },
  { id: TRAVELLER_IDS.t10, first: 'Hana', last: 'Yousuf', type: 'Regular', dob: '1991-08-25', nat: 'Bahraini' },
  { id: TRAVELLER_IDS.t11, first: 'Faris', last: 'Al-Khalid', type: 'Regular', dob: '1986-01-12', nat: 'Omani' },
  { id: TRAVELLER_IDS.t12, first: 'Sara', last: 'Al-Ansari', type: 'VIP', dob: '1975-10-09', nat: 'Qatari' },
  { id: TRAVELLER_IDS.t13, first: 'Hassan', last: 'Al-Mutairi', type: 'Regular', dob: '1999-03-21', nat: 'Kuwaiti' },
  { id: TRAVELLER_IDS.t14, first: 'Mariam', last: 'Al-Otaibi', type: 'Regular', dob: '1992-07-17', nat: 'Saudi' },
  { id: TRAVELLER_IDS.t15, first: 'Jaber', last: 'Al-Harbi', type: 'Regular', dob: '1983-05-05', nat: 'Saudi' },
  { id: TRAVELLER_IDS.t16, first: 'Aisha', last: 'Al-Zaabi', type: 'CIP', dob: '1979-11-11', nat: 'Emirati' },
  { id: TRAVELLER_IDS.t17, first: 'Yusuf', last: 'Al-Balushi', type: 'Regular', dob: '1994-09-03', nat: 'Omani' },
  { id: TRAVELLER_IDS.t18, first: 'Muna', last: 'Al-Shamsi', type: 'Regular', dob: '1987-06-22', nat: 'Emirati' },
  { id: TRAVELLER_IDS.t19, first: 'Adel', last: 'Al-Dosari', type: 'Regular', dob: '1996-02-08', nat: 'Bahraini' },
  { id: TRAVELLER_IDS.t20, first: 'Dina', last: 'Morsi', type: 'Regular', dob: '1989-04-14', nat: 'Egyptian' },
];

export async function seedTravellers(prisma: PrismaClient) {
  console.log('\n🧳 [05-travellers] Seeding traveller profiles...');

  for (const p of profiles) {
    await prisma.travellerProfile.upsert({
      where: { id: p.id },
      update: {},
      create: {
        id: p.id,
        tenantId: TENANT_IDS.sub1,
        title: p.id === TRAVELLER_IDS.t2 || p.id === TRAVELLER_IDS.t4 ? 'Ms' : 'Mr',
        firstName: p.first,
        lastName: p.last,
        dateOfBirth: p.dob,
        gender: ['t2','t4','t6','t8','t10','t12','t14','t16','t18','t20'].some(x => p.id.includes(x)) ? 'Female' : 'Male',
        nationality: p.nat,
        travellerType: p.type,
        email: `${p.first.toLowerCase()}.${p.last.toLowerCase().replace('-','')}@tripalfa-test.com`,
        mobile: `+973 3${faker.number.int({ min: 1000000, max: 9999999 })}`,
        status: 'Active',
        preferredLanguage: 'en',
        gdprConsent: true,
        gdprConsentDate: daysAgo(365),
        marketingConsent: faker.datatype.boolean(),
        syncStatus: p.type === 'VIP' ? 'SYNCED' : faker.helpers.arrayElement(['SYNCED', 'SYNCED', 'PENDING', 'FAILED']),
        homeAddress: {
          streetAddress: `${faker.number.int({ min: 1, max: 999 })} ${faker.location.street()}`,
          country: 'Bahrain',
          city: 'Manama',
          postCode: faker.location.zipCode(),
        },
      },
    });
  }
  log('05-travellers', 'TravellerProfile', profiles.length);

  // Passports — expiring soon for t1 (triggers alert scenario)
  const passportData: Array<{ tid: TravellerID5; no: string; exp: string; primary: boolean }> = [
    { tid: TRAVELLER_IDS.t1, no: 'BH123456789', exp: '2025-06-15', primary: true },   // ← expiring soon
    { tid: TRAVELLER_IDS.t2, no: 'BH987654321', exp: '2027-09-01', primary: true },
    { tid: TRAVELLER_IDS.t3, no: 'SA456789012', exp: '2026-03-22', primary: true },
    { tid: TRAVELLER_IDS.t4, no: 'JO789012345', exp: '2028-11-30', primary: true },
    { tid: TRAVELLER_IDS.t5, no: 'AE234567890', exp: '2025-08-20', primary: true },   // ← expiring soon
    { tid: TRAVELLER_IDS.t5, no: 'AE111222333', exp: '2026-01-15', primary: false },  // dual passport
  ];
  // Fill remaining travellers with generic passports (cast to TravellerID5 to allow assignment)
  for (const p of profiles.slice(5)) {
    passportData.push({ tid: p.id as TravellerID5, no: `PP${faker.string.numeric(9)}`, exp: '2027-12-31', primary: true });
  }

  let passCount = 0;
  for (const pp of passportData) {
    await prisma.clientPassport.create({
      data: {
        travellerId: pp.tid,
        passportNumber: pp.no,
        dateOfBirth: profiles.find(p => p.id === pp.tid)?.dob ?? '1990-01-01',
        nationality: profiles.find(p => p.id === pp.tid)?.nat ?? 'Unknown',
        issuingCountry: 'Bahrain',
        expiryDate: pp.exp,
        isPrimary: pp.primary,
        status: new Date(pp.exp) < daysFromNow(60) ? 'About to Expire' : 'Active',
      },
    });
    passCount++;
  }
  log('05-travellers', 'ClientPassport', passCount);

  // Visas
  let visaCount = 0;
  const visaTravellers = [TRAVELLER_IDS.t1, TRAVELLER_IDS.t3, TRAVELLER_IDS.t5, TRAVELLER_IDS.t7, TRAVELLER_IDS.t9];
  for (const tid of visaTravellers) {
    await prisma.clientVisa.create({
      data: {
        travellerId: tid,
        visaNumber: `VIS${faker.string.numeric(8)}`,
        country: faker.helpers.arrayElement(['United Kingdom', 'USA', 'Schengen', 'Australia']),
        type: faker.helpers.arrayElement(['Tourist', 'Business', 'Multiple Entry']),
        dateOfIssue: '2023-06-01',
        dateOfExpiry: '2025-05-31',
      },
    });
    visaCount++;
  }
  log('05-travellers', 'ClientVisa', visaCount);

  // Dependents for VIP travellers
  let depCount = 0;
  for (const tid of [TRAVELLER_IDS.t1, TRAVELLER_IDS.t5, TRAVELLER_IDS.t12]) {
    await prisma.clientDependent.create({
      data: {
        travellerId: tid,
        firstName: faker.person.firstName('female'),
        lastName: profiles.find(p => p.id === tid)?.last ?? 'Al-Family',
        gender: 'Female',
        dateOfBirth: '1985-03-12',
        relation: 'Spouse',
        status: 'Active',
        email: faker.internet.email(),
        mobile: `+973 3${faker.number.int({ min: 1000000, max: 9999999 })}`,
        passportNumber: `DEP${faker.string.numeric(8)}`,
        passportExpiry: '2027-01-01',
        passportNationality: 'Bahraini',
      },
    });
    // Child dependent
    await prisma.clientDependent.create({
      data: {
        travellerId: tid,
        firstName: faker.person.firstName(),
        lastName: profiles.find(p => p.id === tid)?.last ?? 'Al-Family',
        gender: faker.helpers.arrayElement(['Male', 'Female']),
        dateOfBirth: '2015-07-20',
        relation: 'Child',
        status: 'Active',
      },
    });
    depCount += 2;
  }
  log('05-travellers', 'ClientDependent', depCount);

  // Preferences for all travellers
  let prefCount = 0;
  for (const p of profiles) {
    await prisma.clientPreferences.upsert({
      where: { travellerId: p.id },
      update: {},
      create: {
        travellerId: p.id,
        flightPreferences: {
          longHaulSeat: 'Aisle',
          shortHaulSeat: 'Window',
          mealPreference: 'Halal',
          classPreference: p.type === 'VIP' ? 'Business' : 'Economy',
          preferredAirlines: ['EK', 'QR'],
          loyaltyPrograms: [{ airline: 'EK', number: `EK${faker.string.numeric(9)}` }],
        },
        hotelPreferences: {
          roomPreference: 'King',
          smokingPreference: 'Non-Smoking',
          starRating: p.type === 'VIP' ? 5 : 4,
          facilities: ['Pool', 'Gym', 'WiFi'],
        },
      },
    });
    prefCount++;
  }
  log('05-travellers', 'ClientPreferences', prefCount);

  // CustomAlerts (passport expiry alerts)
  let alertCount = 0;
  for (const tid of [TRAVELLER_IDS.t1, TRAVELLER_IDS.t5]) {
    await prisma.customAlert.create({
      data: {
        travellerId: tid,
        alertType: 'PASSPORT_EXPIRY',
        title: 'Passport Expiring Soon',
        message: 'Passenger passport expires within 60 days. Action required.',
        severity: 'HIGH',
        triggerDate: daysFromNow(45),
        isRecurring: false,
        isActive: true,
        notificationChannels: ['EMAIL', 'IN_APP'],
      },
    });
    alertCount++;
  }
  // Birthday alert
  await prisma.customAlert.create({
    data: {
      travellerId: TRAVELLER_IDS.t2,
      alertType: 'BIRTHDAY',
      title: 'VIP Birthday Reminder',
      message: 'Send birthday greetings and offer',
      severity: 'LOW',
      triggerDate: daysFromNow(30),
      isRecurring: true,
      recurrenceRule: '0 9 22 9 *',
      isActive: true,
      notificationChannels: ['EMAIL'],
    },
  });
  alertCount++;
  log('05-travellers', 'CustomAlert', alertCount);

  // CommunicationLogs
  let commCount = 0;
  for (const p of profiles.slice(0, 8)) {
    for (let i = 0; i < 3; i++) {
      await prisma.communicationLog.create({
        data: {
          travellerId: p.id,
          type: faker.helpers.arrayElement(['EMAIL', 'CALL', 'SMS']),
          subject: faker.helpers.arrayElement(['Booking Confirmation', 'Passport Reminder', 'Invoice', 'Follow Up']),
          content: faker.lorem.sentence(),
          status: 'SENT',
          timestamp: randomPastDate(1, 90),
        },
      });
      commCount++;
    }
  }
  log('05-travellers', 'CommunicationLog', commCount);
}
