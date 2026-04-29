/**
 * Tenant Repository
 */

import { Prisma } from '../../generated/prisma-client';
import { getMasterDb } from '../index';

/**
 * Find a tenant by ID
 */
export async function findTenantById(id: string, options?: { includeRelations?: boolean }) {
  return getMasterDb().tenant.findUnique({
    where: { id },
    include: options?.includeRelations ? {
      subAgencies: true,
      parent: true,
      salesChannels: true,
    } : undefined
  });
}

/**
 * Find a tenant by agent code
 */
export async function findTenantByCode(agentCode: string) {
  return getMasterDb().tenant.findUnique({
    where: { agentCode }
  });
}

/**
 * Create a new tenant
 */
export async function createTenant(data: any) {
  return getMasterDb().tenant.create({ data });
}

/**
 * Update a tenant
 */
export async function updateTenant(id: string, data: any) {
  return getMasterDb().tenant.update({
    where: { id },
    data
  });
}

/**
 * Find many tenants with filters
 */
export async function findManyTenants(params: {
  where?: Prisma.TenantWhereInput;
  orderBy?: Prisma.TenantOrderByWithRelationInput;
  take?: number;
  skip?: number;
  include?: Prisma.TenantInclude;
}) {
  return getMasterDb().tenant.findMany(params);
}
