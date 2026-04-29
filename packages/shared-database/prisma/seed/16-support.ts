/**
 * 16-support.ts — SupportTicket, TicketMessage, OfflineChangeRequest, AuditLog
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { BOOKING_IDS } from './09-bookings.js';
import { log, genRequestRef, randomPastDate } from './helpers/faker.js';

export async function seedSupport(prisma: PrismaClient) {
  console.log('\n🎧 [16-support] Seeding support tickets, offline requests, and audit logs...');

  let ticketCount = 0;
  let messageCount = 0;
  let ocrCount = 0;
  let ocrAuditCount = 0;
  let auditCount = 0;

  // 1. Support Tickets
  const statuses = ['OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];
  for (let i = 0; i < 10; i++) {
    const status = faker.helpers.arrayElement(statuses);
    const bookingId = faker.datatype.boolean() ? faker.helpers.arrayElement(Object.keys(BOOKING_IDS)) : null;

    const ticket = await prisma.supportTicket.create({
      data: {
        tenantId: TENANT_IDS.master,
        userId: USER_IDS.sub1Agent,
        subject: `Issue with booking ${bookingId || 'general'}`,
        description: faker.lorem.paragraph(),
        status,
        priority: faker.helpers.arrayElement(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
        assignedTo: status !== 'OPEN' ? USER_IDS.superAdmin : null,
        relatedTo: bookingId,
        createdAt: randomPastDate(5, 30),
      },
    });
    ticketCount++;

    // Messages
    const numMsgs = faker.number.int({ min: 1, max: 5 });
    for (let j = 0; j < numMsgs; j++) {
      await prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          userId: j % 2 === 0 ? USER_IDS.sub1Agent : USER_IDS.superAdmin,
          sender: j % 2 === 0 ? 'USER' : 'AGENT',
          message: faker.lorem.sentences(2),
          isInternal: j === numMsgs - 1 && status !== 'RESOLVED' ? true : false,
          createdAt: new Date(ticket.createdAt.getTime() + j * 1000 * 60 * 60),
        },
      });
      messageCount++;
    }
  }

  // 2. Offline Change Requests
  const requestTypes = ['REFUND', 'RESCHEDULE', 'NAME_CHANGE', 'REISSUE'];
  for (let i = 0; i < 8; i++) {
    const reqType = faker.helpers.arrayElement(requestTypes);
    const status = faker.helpers.arrayElement(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'REJECTED']);
    const bookingId = faker.helpers.arrayElement(Object.keys(BOOKING_IDS));

    const ocr = await prisma.offlineChangeRequest.create({
      data: {
        requestRef: genRequestRef(),
        bookingId,
        requestType: reqType,
        status,
        requestedBy: USER_IDS.sub1Agent,
        requestedRole: 'AGENT',
        assignedTo: status !== 'PENDING' ? USER_IDS.masterAdmin : null,
        priority: 'MEDIUM',
        subject: `Offline ${reqType} for ${bookingId}`,
        description: faker.lorem.paragraph(),
        createdAt: randomPastDate(1, 15),
      },
    });
    ocrCount++;

    // OCR Audit Logs
    await prisma.offlineRequestAuditLog.create({
      data: {
        requestId: ocr.id, action: 'CREATED', performedBy: USER_IDS.sub1Agent, role: 'AGENT',
        newStatus: 'PENDING', createdAt: ocr.createdAt,
      },
    });
    ocrAuditCount++;

    if (status !== 'PENDING') {
      await prisma.offlineRequestAuditLog.create({
        data: {
          requestId: ocr.id, action: 'STATUS_CHANGED', performedBy: USER_IDS.masterAdmin, role: 'ADMIN',
          oldStatus: 'PENDING', newStatus: status, createdAt: new Date(ocr.createdAt.getTime() + 1000 * 60 * 60 * 2),
        },
      });
      ocrAuditCount++;
    }
  }

  // 3. System Audit Logs
  for (let i = 0; i < 30; i++) {
    const actions = ['USER_LOGIN', 'USER_LOGOUT', 'SETTINGS_UPDATED', 'REPORT_DOWNLOADED', 'ROLE_CHANGED'];
    await prisma.auditLog.create({
      data: {
        tenantId: TENANT_IDS.master,
        userId: USER_IDS.masterAdmin,
        action: faker.helpers.arrayElement(actions),
        resource: 'System',
        entity: 'UserSession',
        ipAddress: faker.internet.ipv4(),
        userAgent: faker.internet.userAgent(),
        details: JSON.stringify({ device: 'MacBook' }),
        severity: 'INFO',
        createdAt: randomPastDate(1, 14),
      },
    });
    auditCount++;
  }

  log('16-support', 'SupportTicket', ticketCount);
  log('16-support', 'TicketMessage', messageCount);
  log('16-support', 'OfflineChangeRequest', ocrCount);
  log('16-support', 'OfflineRequestAuditLog', ocrAuditCount);
  log('16-support', 'AuditLog', auditCount);
}
