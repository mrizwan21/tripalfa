/**
 * 10-service-requests.ts — ServiceRequest, Approval, ClientSwitchApproval
 */
import { PrismaClient } from '../../generated/prisma-client';
import { faker } from '@faker-js/faker';
import { BOOKING_IDS } from './09-bookings.js';
import { TENANT_IDS, USER_IDS } from './02-tenants.js';
import { log, randomPastDate } from './helpers/faker.js';

export async function seedServiceRequests(prisma: PrismaClient) {
  console.log('\n🛎️  [10-service-requests] Seeding service requests...');

  const bookingKeys = Object.keys(BOOKING_IDS);
  if (bookingKeys.length === 0) {
    console.warn('No bookings found to attach service requests to. Skipping.');
    return;
  }

  const requests = [
    { type: 'REFUND' as const, status: 'OPEN' as const },
    { type: 'REFUND' as const, status: 'PROCESSING' as const },
    { type: 'REFUND' as const, status: 'COMPLETED' as const },
    { type: 'RESCHEDULE' as const, status: 'OPEN' as const },
    { type: 'RESCHEDULE' as const, status: 'APPROVED' as const },
    { type: 'RESCHEDULE' as const, status: 'REJECTED' as const },
    { type: 'CANCEL' as const, status: 'COMPLETED' as const },
    { type: 'CANCEL' as const, status: 'REJECTED' as const },
    { type: 'CLIENT_SWITCH' as const, status: 'OPEN' as const },
    { type: 'CLIENT_SWITCH' as const, status: 'APPROVED' as const },
  ];

  let srCount = 0;
  let approvalCount = 0;
  let clientSwitchCount = 0;

  for (let i = 0; i < requests.length; i++) {
    const req = requests[i];
    // Pick a random booking, prefer ones that make sense (e.g. TICKETED for refunds)
    const bookingId = faker.helpers.arrayElement(bookingKeys);

    const sr = await prisma.serviceRequest.create({
      data: {
        bookingId,
        type: req.type,
        status: req.status,
        requestDate: randomPastDate(1, 30),
        requestedBy: USER_IDS.sub1Agent,
        requestRemarks: faker.lorem.sentence(),
        approvalDate: ['APPROVED', 'COMPLETED', 'REJECTED', 'PROCESSING'].includes(req.status) ? randomPastDate(1, 15) : null,
        approvedBy: ['APPROVED', 'COMPLETED', 'REJECTED', 'PROCESSING'].includes(req.status) ? USER_IDS.sub1Admin : null,
        approvalRemarks: req.status === 'REJECTED' ? 'Not permitted by fare rules' : 'Approved',
        processedDate: req.status === 'COMPLETED' ? randomPastDate(1, 5) : null,
        processedBy: req.status === 'COMPLETED' ? USER_IDS.masterAdmin : null,
      },
    });
    srCount++;

    // Add Approval hierarchy for REFUND and RESCHEDULE
    if (['REFUND', 'RESCHEDULE'].includes(req.type)) {
      await prisma.approval.create({
        data: {
          serviceRequestId: sr.id,
          bookingId,
          level: 'LEVEL_1',
          approverEmail: 'admin@gulftravelsolutions.com',
          approverName: 'Gulf Admin',
          status: ['APPROVED', 'COMPLETED', 'PROCESSING'].includes(req.status) ? 'Approved' : req.status === 'REJECTED' ? 'Rejected' : 'Pending',
          actionDate: ['OPEN', 'PENDING'].includes(req.status) ? null : randomPastDate(1, 10),
        },
      });
      approvalCount++;

      // If it's a high value refund, require LEVEL_2
      if (req.type === 'REFUND' && req.status !== 'OPEN') {
        await prisma.approval.create({
          data: {
            serviceRequestId: sr.id,
            bookingId,
            level: 'LEVEL_2',
            approverEmail: 'superadmin@tripalfa.com',
            approverName: 'Super Admin',
            status: ['COMPLETED', 'PROCESSING'].includes(req.status) ? 'Approved' : 'Pending',
            actionDate: ['COMPLETED', 'PROCESSING'].includes(req.status) ? randomPastDate(1, 5) : null,
          },
        });
        approvalCount++;
      }
    }

    // Client Switch specific data
    if (req.type === 'CLIENT_SWITCH') {
      await prisma.clientSwitchApproval.create({
        data: {
          bookingId,
          fromCorporateId: TENANT_IDS.corp1,
          toCorporateId: TENANT_IDS.corp2,
          reason: 'Billed to wrong cost center',
          status: req.status === 'APPROVED' ? 'Approved' : 'Pending',
          level1Approver: USER_IDS.corp1Admin,
          level1Status: req.status === 'APPROVED' ? 'Approved' : 'Pending',
          level1Date: req.status === 'APPROVED' ? randomPastDate(1, 5) : null,
        },
      });
      clientSwitchCount++;
    }
  }

  log('10-service-requests', 'ServiceRequest', srCount);
  log('10-service-requests', 'Approval', approvalCount);
  log('10-service-requests', 'ClientSwitchApproval', clientSwitchCount);
}
