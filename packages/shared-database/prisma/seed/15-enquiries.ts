/**
 * 15-enquiries.ts — Enquiry, CorporateTraveller
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { log, genEnquiryId, randomPastDate } from './helpers/faker.js';

export async function seedEnquiries(prisma: PrismaClient) {
  console.log('\n📨 [15-enquiries] Seeding enquiries and corporate travellers...');

  let corpTravellerCount = 0;
  let enquiryCount = 0;

  // 1. Corporate Travellers
  const corpTravellers = [];
  for (let i = 0; i < 15; i++) {
    const isVIP = faker.datatype.boolean({ probability: 0.2 });
    const corpId = faker.helpers.arrayElement([TENANT_IDS.corp1, TENANT_IDS.corp2, TENANT_IDS.corp3]);
    const corpName = corpId === TENANT_IDS.corp1 ? 'BPC' : corpId === TENANT_IDS.corp2 ? 'GFH' : 'STV';

    const ct = await prisma.corporateTraveller.create({
      data: {
        tenantId: TENANT_IDS.master,
        employeeId: `EMP-${corpName}-${faker.string.numeric(4)}`,
        corporateId: corpId,
        corporateName: corpName,
        title: faker.helpers.arrayElement(['Mr', 'Ms', 'Dr']),
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        designation: faker.person.jobTitle(),
        department: faker.commerce.department(),
        email: faker.internet.email(),
        phone: `+9733${faker.string.numeric(7)}`,
        fop: 'INVOICE',
        vip: isVIP,
        cip: faker.datatype.boolean({ probability: 0.3 }),
        frequentFlyerNos: isVIP ? { EK: `EK${faker.string.numeric(9)}` } : undefined,
        travelCoordinator: faker.person.fullName(),
        last3Bookings: [{ ref: `BK-${faker.string.numeric(4)}`, date: '2025-01-15' }],
      },
    });
    corpTravellers.push(ct);
    corpTravellerCount++;
  }

  // 2. Enquiries
  const statuses = ['Pending', 'Quoted', 'Approved', 'Rejected'];
  for (let i = 0; i < 10; i++) {
    const status = faker.helpers.arrayElement(statuses);
    const ct = faker.helpers.arrayElement(corpTravellers);

    await prisma.enquiry.create({
      data: {
        enquiryId: genEnquiryId(),
        tenantId: TENANT_IDS.master,
        type: 'Quote',
        corporateId: ct.corporateId,
        travellerId: ct.id,
        travellerName: `${ct.firstName} ${ct.lastName}`,
        status,
        itineraries: [
          { origin: 'BAH', destination: 'DXB', date: '2026-06-01' },
          { origin: 'DXB', destination: 'LHR', date: '2026-06-05' },
        ],
        approverEmails: [faker.internet.email()],
        sendToEmployeeFirst: faker.datatype.boolean(),
        includeCheapest: true,
        createdBy: USER_IDS.corp1Admin,
        assignedTo: status !== 'Pending' ? USER_IDS.sub1Agent : null,
        approvedDate: status === 'Approved' ? randomPastDate(1, 5) : null,
        createdAt: randomPastDate(5, 30),
      },
    });
    enquiryCount++;
  }

  log('15-enquiries', 'CorporateTraveller', corpTravellerCount);
  log('15-enquiries', 'Enquiry', enquiryCount);
}
