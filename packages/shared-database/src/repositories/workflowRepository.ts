/**
 * Workflow Repository
 * Handles B2B specialized workflows: Client Switch Approvals and Service Requests.
 */

import { ClientSwitchApproval, ServiceRequest, Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

export async function createClientSwitchApproval(data: Prisma.ClientSwitchApprovalCreateInput): Promise<ClientSwitchApproval> {
  return getBookingDb().clientSwitchApproval.create({ data });
}

export async function findClientSwitchApprovalById(id: string): Promise<ClientSwitchApproval | null> {
  return getBookingDb().clientSwitchApproval.findUnique({
    where: { id },
  });
}

export async function updateClientSwitchApproval(id: string, data: Prisma.ClientSwitchApprovalUpdateInput): Promise<ClientSwitchApproval> {
  return getBookingDb().clientSwitchApproval.update({
    where: { id },
    data,
  });
}

export async function createServiceRequest(data: Prisma.ServiceRequestCreateInput): Promise<ServiceRequest> {
  return getBookingDb().serviceRequest.create({ data });
}

export async function findServiceRequestById(id: string): Promise<ServiceRequest | null> {
  return getBookingDb().serviceRequest.findUnique({
    where: { id },
    include: {
      booking: true,
    },
  });
}

export async function updateServiceRequest(id: string, data: Prisma.ServiceRequestUpdateInput): Promise<ServiceRequest> {
  return getBookingDb().serviceRequest.update({
    where: { id },
    data,
  });
}

export async function findServiceRequests(params: {
  where?: Prisma.ServiceRequestWhereInput;
  include?: Prisma.ServiceRequestInclude;
  orderBy?: Prisma.ServiceRequestOrderByWithRelationInput;
}): Promise<ServiceRequest[]> {
  return getBookingDb().serviceRequest.findMany({
    where: params.where,
    include: params.include,
    orderBy: params.orderBy ?? { requestDate: 'desc' },
  });
}
