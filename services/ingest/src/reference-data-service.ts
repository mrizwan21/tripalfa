/**
 * Hotel Reference Data Service
 * Shared service for all hotel import adapters
 */

import { prisma } from '@tripalfa/shared-database';

const cache = new Map<string, Map<string, any>>();

export interface RoomCategoryWithTranslations {
  id: string; seqId: string; type: string | null; category: string | null;
  redflag: boolean; score: number;
  nameEn: string | null; nameSp: string | null; namePt: string | null;
  nameFr: string | null; nameIt: string | null; nameDe: string | null;
  nameRu: string | null; nameIl: string | null; nameCn: string | null;
  nameIn: string | null; nameAe: string | null;
}

export async function getRoomCategories(): Promise<Map<string, RoomCategoryWithTranslations>> {
  if (cache.has('roomCategories')) return cache.get('roomCategories')!;
  const categories = await prisma.roomCategory.findMany({ where: { isActive: true } });
  const map = new Map<string, RoomCategoryWithTranslations>();
  for (const cat of categories) map.set(cat.seqId, cat as RoomCategoryWithTranslations);
  cache.set('roomCategories', map);
  return map;
}

export async function getPolicyTerms(): Promise<{
  positive: Map<string, any>; negative: Map<string, any>; association: Map<string, any>;
}> {
  const terms = await prisma.policyTerm.findMany({ where: { isActive: true } });
  const result = { positive: new Map(), negative: new Map(), association: new Map() };
  for (const term of terms) {
    if (term.type === 'positive') result.positive.set(term.seqId, term);
    else if (term.type === 'negative') result.negative.set(term.seqId, term);
    else result.association.set(term.seqId, term);
  }
  return result;
}

export async function getBoardTypes(): Promise<Map<string, any>> {
  if (cache.has('boardTypes')) return cache.get('boardTypes')!;
  const types = await prisma.boardTypeScore.findMany({ where: { isActive: true } });
  const map = new Map<string, any>();
  for (const type of types) map.set(type.seqId, type);
  cache.set('boardTypes', map);
  return map;
}

export async function mapHotelAmenity(supplierId: string, supplierCode: string): Promise<{ amenityId: string; name: string } | null> {
  const mapping = await prisma.hotelAmenitySupplierMapping.findUnique({
    where: { supplierId_supplierCode: { supplierId, supplierCode } },
    include: { amenity: true },
  });
  return mapping ? { amenityId: mapping.amenityId, name: mapping.amenity.name } : null;
}

export async function mapRoomAmenity(supplierId: string, supplierCode: string): Promise<{ amenityId: string; name: string } | null> {
  const mapping = await prisma.roomAmenitySupplierMapping.findUnique({
    where: { supplierId_supplierCode: { supplierId, supplierCode } },
    include: { amenity: true },
  });
  return mapping ? { amenityId: mapping.amenityId, name: mapping.amenity.name } : null;
}

export function clearCache(): void { cache.clear(); }
