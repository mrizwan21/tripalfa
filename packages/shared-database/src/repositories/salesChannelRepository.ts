/**
 * Sales Channel Repository
 */

import { getMasterDb } from '../index';

/**
 * Find sales channels for a tenant
 */
export async function findChannelsByTenant(tenantId: string) {
  return getMasterDb().salesChannelConfig.findMany({
    where: { tenantId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Create a sales channel
 */
export async function createChannel(data: any) {
  return getMasterDb().salesChannelConfig.create({ data });
}

/**
 * Update a sales channel
 */
export async function updateChannel(id: string, tenantId: string, data: any) {
  return getMasterDb().salesChannelConfig.update({
    where: { id, tenantId },
    data
  });
}
