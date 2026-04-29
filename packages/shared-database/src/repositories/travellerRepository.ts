/**
 * Traveller Repository
 * Centralized management for CorporateTraveller and TravellerProfile.
 */

import { getBookingDb, getCrmDb } from '../index';
import { CorporateTraveller, TravellerProfile, Prisma } from '../../generated/prisma-client';

// ─── Corporate Traveller ──────────────────────────────────────────────────────

export async function findCorporateTraveller(id: string): Promise<CorporateTraveller | null> {
  return getBookingDb().corporateTraveller.findUnique({
    where: { id },
  });
}

export async function findCorporateTravellers(input: {
  tenantId: string;
  corporateId?: string;
  email?: string;
}): Promise<CorporateTraveller[]> {
  return getBookingDb().corporateTraveller.findMany({
    where: {
      tenantId: input.tenantId,
      ...(input.corporateId && { corporateId: input.corporateId }),
      ...(input.email && { email: input.email }),
    },
    orderBy: { lastName: 'asc' },
  });
}

export async function searchCorporateTravellers(input: {
  query: string;
  tenantId: string;
  take?: number;
}): Promise<CorporateTraveller[]> {
  const searchTerm = input.query.toLowerCase();
  return getBookingDb().corporateTraveller.findMany({
    where: {
      tenantId: input.tenantId,
      OR: [
        { firstName: { contains: searchTerm, mode: 'insensitive' } },
        { lastName: { contains: searchTerm, mode: 'insensitive' } },
        { employeeId: { contains: searchTerm, mode: 'insensitive' } },
        { email: { contains: searchTerm, mode: 'insensitive' } },
        { phone: { contains: searchTerm, mode: 'insensitive' } }
      ]
    },
    orderBy: { lastName: 'asc' },
    take: input.take || 20
  });
}

export async function createCorporateTraveller(data: Prisma.CorporateTravellerCreateInput): Promise<CorporateTraveller> {
  return getBookingDb().corporateTraveller.create({ data });
}

export async function updateCorporateTraveller(
  employeeId: string,
  data: Prisma.CorporateTravellerUpdateInput
): Promise<CorporateTraveller> {
  return getBookingDb().corporateTraveller.update({
    where: { employeeId },
    data
  });
}

// ─── Traveller Profile ────────────────────────────────────────────────────────

// ─── Traveller Profile ────────────────────────────────────────────────────────

export async function findTravellerProfile(id: string): Promise<TravellerProfile | null> {
  return getCrmDb().travellerProfile.findUnique({
    where: { id },
    include: {
      passports: true,
      visas: true,
      dependents: true,
      preferences: true,
      documents: true,
      personalCards: true,
      associatedClients: true,
    },
  });
}

export async function createTravellerProfile(data: Prisma.TravellerProfileCreateInput): Promise<TravellerProfile> {
  return getCrmDb().travellerProfile.create({ data });
}

export async function updateTravellerProfile(id: string, data: Prisma.TravellerProfileUpdateInput): Promise<TravellerProfile> {
  return getCrmDb().travellerProfile.update({
    where: { id },
    data,
  });
}

export async function deleteTravellerProfile(id: string): Promise<TravellerProfile> {
  return getCrmDb().travellerProfile.delete({
    where: { id },
  });
}

export async function findTravellerProfiles(params: {
  where?: Prisma.TravellerProfileWhereInput;
  include?: Prisma.TravellerProfileInclude;
  orderBy?: Prisma.TravellerProfileOrderByWithRelationInput;
  skip?: number;
  take?: number;
}): Promise<TravellerProfile[]> {
  return getCrmDb().travellerProfile.findMany({
    where: params.where,
    include: params.include,
    orderBy: params.orderBy ?? { createdAt: 'desc' },
    skip: params.skip,
    take: params.take,
  });
}

export async function countTravellerProfiles(where: Prisma.TravellerProfileWhereInput): Promise<number> {
  return getCrmDb().travellerProfile.count({ where });
}

export async function upsertTravellerProfile(
  tenantId: string,
  email: string,
  data: Prisma.TravellerProfileUpdateInput & Prisma.TravellerProfileCreateInput
): Promise<TravellerProfile> {
  const existing = await getCrmDb().travellerProfile.findFirst({
    where: { tenantId, email },
  });

  if (existing) {
    return getCrmDb().travellerProfile.update({
      where: { id: existing.id },
      data,
    });
  }

  return getCrmDb().travellerProfile.create({
    data: { ...data, tenantId, email } as Prisma.TravellerProfileCreateInput,
  });
}

// ─── Related Models ───────────────────────────────────────────────────────────

export async function createPassport(data: Prisma.ClientPassportCreateInput) {
  return getCrmDb().clientPassport.create({ data });
}

export async function findPassports(where: Prisma.ClientPassportWhereInput) {
  return getCrmDb().clientPassport.findMany({ where });
}

export async function deletePassports(where: Prisma.ClientPassportWhereInput) {
  return getCrmDb().clientPassport.deleteMany({ where });
}

export async function createVisa(data: Prisma.ClientVisaCreateInput) {
  return getCrmDb().clientVisa.create({ data });
}

export async function findVisas(where: Prisma.ClientVisaWhereInput) {
  return getCrmDb().clientVisa.findMany({ where });
}

export async function deleteVisas(where: Prisma.ClientVisaWhereInput) {
  return getCrmDb().clientVisa.deleteMany({ where });
}

export async function createDependent(data: Prisma.ClientDependentCreateInput) {
  return getCrmDb().clientDependent.create({ data });
}

export async function findDependents(where: Prisma.ClientDependentWhereInput) {
  return getCrmDb().clientDependent.findMany({ where });
}

export async function deleteDependents(where: Prisma.ClientDependentWhereInput) {
  return getCrmDb().clientDependent.deleteMany({ where });
}

export async function createPreferences(data: Prisma.ClientPreferencesCreateInput) {
  return getCrmDb().clientPreferences.create({ data });
}

export async function updatePreferences(travellerId: string, data: Prisma.ClientPreferencesUpdateInput) {
  return getCrmDb().clientPreferences.update({
    where: { travellerId },
    data,
  });
}

export async function findPreferences(travellerId: string) {
  return getCrmDb().clientPreferences.findUnique({
    where: { travellerId },
  });
}

export async function createClientDocument(data: Prisma.ClientDocumentCreateInput) {
  return getCrmDb().clientDocument.create({ data });
}

export async function findClientDocuments(where: Prisma.ClientDocumentWhereInput) {
  return getCrmDb().clientDocument.findMany({ where });
}

export async function deleteDocument(id: string) {
  return getCrmDb().clientDocument.delete({
    where: { id },
  });
}

export async function createPersonalCard(data: Prisma.ClientPersonalCardCreateInput) {
  return getCrmDb().clientPersonalCard.create({ data });
}

export async function findPersonalCards(where: Prisma.ClientPersonalCardWhereInput) {
  return getCrmDb().clientPersonalCard.findMany({ where });
}

export async function deletePersonalCards(where: Prisma.ClientPersonalCardWhereInput) {
  return getCrmDb().clientPersonalCard.deleteMany({ where });
}

export async function createClientAssociation(data: Prisma.ClientAssociationCreateInput) {
  return getCrmDb().clientAssociation.create({ data });
}

export async function deleteClientAssociation(id: string) {
  return getCrmDb().clientAssociation.delete({ where: { id } });
}

export async function findClientAssociations(travellerId: string) {
  return getCrmDb().clientAssociation.findMany({ where: { travellerId } });
}

export async function createCommunicationLog(data: Prisma.CommunicationLogCreateInput) {
  return getCrmDb().communicationLog.create({ data });
}

export async function findCommunicationLogs(where: Prisma.CommunicationLogWhereInput) {
  return getCrmDb().communicationLog.findMany({ 
    where,
    orderBy: { timestamp: 'desc' },
    take: 10
  });
}

/**
 * Aggregates client management statistics for reporting
 */
export async function getClientManagementSummary() {
  const db = getCrmDb();
  
  const [
    totalClients,
    activeClients,
    vipClients,
    cipClients,
    regularClients,
    expiringPassports,
    expiringVisas
  ] = await Promise.all([
    db.travellerProfile.count(),
    db.travellerProfile.count({ where: { status: 'Active' } }),
    db.travellerProfile.count({ where: { travellerType: 'VIP' } }),
    db.travellerProfile.count({ where: { travellerType: 'CIP' } }),
    db.travellerProfile.count({ where: { travellerType: 'Regular' } }),
    db.clientPassport.count({
      where: {
        status: { in: ['About to Expire', 'Expired'] }
      }
    }),
    db.clientVisa.count({
      where: {
        dateOfExpiry: {
          lte: new Date(new Date().getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        }
      }
    })
  ]);

  return {
    totalClients,
    activeClients,
    vipClients,
    cipClients,
    regularClients,
    expiringPassports,
    expiringVisas
  };
}

export async function createIntegrationLog(data: Prisma.IntegrationLogCreateInput) {
  return getCrmDb().integrationLog.create({ data });
}
