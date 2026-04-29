/**
 * Asset Repository
 * Handles all favorite assets and user-specific asset storage.
 */

import { FavoriteAsset, Prisma } from '../../generated/prisma-client';
import { getBookingDb } from '../index';

/**
 * Finds all favorite assets for a user
 */
export async function findFavoriteAssets(userId: string) {
  const db = getBookingDb();
  return db.favoriteAsset.findMany({
    where: { subUserId: userId },
    orderBy: { createdAt: 'desc' }
  });
}

/**
 * Finds a specific favorite asset by ID
 */
export async function findFavoriteAssetById(id: string) {
  const db = getBookingDb();
  return db.favoriteAsset.findUnique({
    where: { id }
  });
}

/**
 * Creates a new favorite asset for a user
 */
export async function createFavoriteAsset(data: {
  subUserId: string;
  type: string;
  assetId: string;
  name: string;
  details: any;
}) {
  const db = getBookingDb();
  return db.favoriteAsset.create({
    data
  });
}

/**
 * Deletes a favorite asset
 */
export async function deleteFavoriteAsset(id: string) {
  const db = getBookingDb();
  return db.favoriteAsset.delete({
    where: { id }
  });
}
