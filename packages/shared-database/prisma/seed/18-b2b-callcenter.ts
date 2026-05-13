/**
 * 18-b2b-callcenter.ts — B2B Portal and Call Center seed data
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { log, pickOne, daysFromNow, randomFutureDate } from './helpers/faker.js';

export const B2B_BOOKING_IDS: Record<string, string> = {};
export const CALL_CENTER_AGENT_IDS: Record<string, string> = {};
export const CALL_QUEUE_IDS: Record<string, string> = {};

export async function seedB2BAndCallCenter(prisma: PrismaClient) {
  console.log('\n📞 [18-b2b-callcenter] Seeding B2B Portal and Call Center data...');

  let b2bBookingCount = 0;
  let partnerCount = 0;
  let agreementCount = 0;
  let agentCount = 0;
  let queueCount = 0;
  let callCount = 0;
  let interactionCount = 0;

  // Seed Partners for existing tenants
  const tenantIds = Object.values(TENANT_IDS);
  for (const tenantId of tenantIds) {
    // Create 2-3 partners per tenant
    for (let i = 0; i < faker.number.int({ min: 2, max: 3 }); i++) {
      const partner = await prisma.partner.create({
        data: {
          tenantId,
          name: `${faker.company.name()} ${faker.lorem.word()}`,
          code: `PARTNER-${faker.string.alphanumeric(6).toUpperCase()}`,
          type: pickOne(['RETAIL', 'CORPORATE', 'SUB_AGENT']),
          status: pickOne(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']), // Mostly active
          contactName: faker.person.fullName(),
          contactEmail: faker.internet.email(),
          contactPhone: faker.phone.number('+##########'),
          address: faker.location.streetAddress(),
          city: faker.location.city(),
          country: pickOne(['Bahrain', 'Saudi Arabia', 'UAE', 'Kuwait', 'Oman']),
          commissionRate: faker.number.float({ min: 5, max: 20, fractionDigits: 2 }),
          creditLimit: faker.number.float({ min: 10000, max: 100000, fractionDigits: 2 }),
          availableCredit: faker.number.float({ min: 5000, max: 100000, fractionDigits: 2 }),
          notes: faker.lorem.sentence(),
        },
      });
      partnerCount++;

      // Create 1-2 agreements per partner
      for (let j = 0; j < faker.number.int({ min: 1, max: 2 }); j++) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setFullYear(endDate.getFullYear() + faker.number.int({ min: 1, max: 3 }));

        await prisma.agreement.create({
          data: {
            tenantId,
            partnerId: partner.id,
            agreementNumber: `AG-${faker.string.alphanumeric(8).toUpperCase()}`,
            title: `${partner.name} Partnership Agreement`,
            type: pickOne(['STANDARD', 'COMMISSION', 'MARKUP', 'SPECIAL']),
            status: pickOne(['ACTIVE', 'ACTIVE', 'ACTIVE', 'EXPIRED', 'DRAFT']),
            startDate,
            endDate,
            commissionRate: faker.number.float({ min: 5, max: 25, fractionDigits: 2 }),
            markupRate: faker.number.float({ min: 0, max: 15, fractionDigits: 2 }),
            discountRate: faker.number.float({ min: 0, max: 10, fractionDigits: 2 }),
            terms: faker.lorem.paragraph(),
            notes: faker.lorem.sentence(),
          },
        });
        agreementCount++;
      }

      // Create 3-5 B2B bookings per partner
      for (let k = 0; k < faker.number.int({ min: 3, max: 5 }); k++) {
        const travelDate = randomFutureDate(1, 90);
        const booking = await prisma.b2BBooking.create({
          data: {
            tenantId,
            partnerId: partner.id,
            bookingRef: `B2B-${faker.string.alphanumeric(8).toUpperCase()}`,
            service: pickOne(['FLIGHT', 'HOTEL', 'CAR', 'PACKAGE']),
            productType: faker.lorem.word(),
            status: pickOne(['PENDING', 'CONFIRMED', 'CONFIRMED', 'CANCELLED', 'REFUNDED']),
            amount: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
            currency: pickOne(['USD', 'EUR', 'GBP', 'BHD']),
            commission: faker.number.float({ min: 10, max: 500, fractionDigits: 2 }),
            netAmount: faker.number.float({ min: 100, max: 5000, fractionDigits: 2 }),
            customerName: faker.person.fullName(),
            customerEmail: faker.internet.email(),
            customerPhone: faker.phone.number('+##########'),
            travelDate: travelDate.toISOString().split('T')[0],
             returnDate: faker.datatype.boolean()
               ? new Date(travelDate.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
               : null,
            pnr: faker.datatype.boolean() ? faker.string.alphanumeric(6).toUpperCase() : null,
            metadata: {
              corporateAccount: faker.datatype.boolean(),
              department: faker.lorem.word(),
            },
          },
        });
        B2B_BOOKING_IDS[`b2b-${partner.id}-${k}`] = booking.id;
        b2bBookingCount++;
      }
    }
  }

  // Seed Call Center Agents
  const agentRoles = ['AGENT', 'SUPERVISOR', 'MANAGER'];
  const agentStatuses = ['ONLINE', 'OFFLINE', 'BREAK', 'AWAY'];
  
  for (let i = 0; i < 15; i++) {
    const agent = await prisma.callCenterAgent.create({
      data: {
        tenantId: pickOne(tenantIds),
        username: `agent_${faker.internet.username()}_${i}`,
        email: `agent.${faker.internet.email()}`,
        name: faker.person.fullName(),
        role: pickOne(agentRoles),
        passwordHash: await hashPassword('Test@1234'),
        status: pickOne(agentStatuses),
        skills: pickOne([['customer_service'], ['sales'], ['technical_support'], ['refunds'], ['booking']]),
        maxConcurrentCalls: faker.number.int({ min: 1, max: 5 }),
        isActive: true,
        lastLoginAt: faker.datatype.boolean()
          ? daysFromNow(faker.number.int({ min: 1, max: 30 })) 
          : null,
      },
    });
    CALL_CENTER_AGENT_IDS[`agent-${i}`] = agent.id;
    agentCount++;
  }

  // Seed Call Queues
  const queueNames = [
    'Technical Support', 'Sales Inquiries', 'Booking Support', 
    'Refunds Department', 'General Inquiries', 'VIP Support'
  ];
  
  for (let i = 0; i < 6; i++) {
    const queue = await prisma.callQueue.create({
      data: {
        tenantId: pickOne(tenantIds),
        name: queueNames[i],
        code: `QUEUE-${faker.string.alphanumeric(4).toUpperCase()}`,
        description: faker.lorem.sentence(),
        priority: faker.number.int({ min: 1, max: 10 }),
        status: pickOne(['ACTIVE', 'ACTIVE', 'ACTIVE', 'INACTIVE']),
        slaTimeout: faker.number.int({ min: 120, max: 600 }),
      },
    });
    CALL_QUEUE_IDS[`queue-${i}`] = queue.id;
    queueCount++;

    // Assign 2-4 agents to each queue
    const agentIds = Object.values(CALL_CENTER_AGENT_IDS);
    const assignedAgents = agentIds.sort(() => 0.5 - Math.random()).slice(0, faker.number.int({ min: 2, max: 4 }));
    for (const agentId of assignedAgents) {
      await prisma.callQueueAssignment.create({
        data: {
          agentId,
          queueId: queue.id,
          priority: faker.number.int({ min: 1, max: 5 }),
          isActive: true,
        },
      });
    }
  }


  // Seed Calls
  const callDirections = ['INBOUND', 'OUTBOUND'];
  const callStatuses = ['WAITING', 'RINGING', 'ANSWERED', 'COMPLETED', 'ABANDONED'];

  for (let i = 0; i < 30; i++) {
    const call = await prisma.call.create({
      data: {
        callId: `CALL-${faker.string.alphanumeric(10).toUpperCase()}`,
        queueId: pickOne(Object.values(CALL_QUEUE_IDS)),
        agentId: faker.datatype.boolean() ? pickOne(Object.values(CALL_CENTER_AGENT_IDS)) : null,
        direction: pickOne(callDirections),
        status: pickOne(callStatuses),
        callerNumber: faker.phone.number('+##########'),
        callerName: faker.person.fullName(),
        callerEmail: faker.internet.email(),
        duration: faker.number.int({ min: 0, max: 1800 }),
        waitTime: faker.number.int({ min: 0, max: 300 }),
        talkTime: faker.number.int({ min: 0, max: 600 }),
        startedAt: daysFromNow(faker.number.int({ min: 1, max: 30 })),
        answeredAt: faker.datatype.boolean()
          ? daysFromNow(faker.number.int({ min: 1, max: 30 }))
          : null,
        endedAt: faker.datatype.boolean()
          ? daysFromNow(faker.number.int({ min: 1, max: 30 }))
          : null,
        recordingUrl: faker.datatype.boolean() ? `https://recordings.tripalfa.com/call-${i}.mp3` : null,
        disposition: pickOne(['RESOLVED', 'FOLLOW_UP', 'ESCALATED', 'DROPPED']),
        remarks: faker.lorem.sentence(),
      },
    });
    callCount++;

    // Create 1-3 interactions per call
    for (let j = 0; j < faker.number.int({ min: 1, max: 3 }); j++) {
      await prisma.callInteraction.create({
        data: {
          callId: call.id,
          agentId: pickOne(Object.values(CALL_CENTER_AGENT_IDS)),
          type: pickOne(['NOTE', 'STATUS_CHANGE', 'TRANSFER', 'CONFERENCE', 'HOLD']),
          content: faker.lorem.paragraph(),
          agentName: faker.person.fullName(),
        },
      });
      interactionCount++;
    }
  }

  log('18-b2b-callcenter', 'B2B Booking', b2bBookingCount);
  log('18-b2b-callcenter', 'Partner', partnerCount);
  log('18-b2b-callcenter', 'Agreement', agreementCount);
  log('18-b2b-callcenter', 'Call Center Agent', agentCount);
  log('18-b2b-callcenter', 'Call Queue', queueCount);
  log('18-b2b-callcenter', 'Call', callCount);
  log('18-b2b-callcenter', 'Interaction', interactionCount);
}

// Helper function for password hashing
async function hashPassword(password: string): Promise<string> {
  const bcrypt = await import('bcrypt');
  return await bcrypt.hash(password, 10);
}
