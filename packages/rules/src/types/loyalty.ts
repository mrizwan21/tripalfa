/**
 * Loyalty tier definition
 */
export interface LoyaltyTier {
  id: string;
  name: string;
  tierLevel: number;
  minPoints: number;
  maxPoints?: number;
  discountPercentage: number;
  pointsMultiplier: number;
  freeCancellation: boolean;
  prioritySupport: boolean;
  freeUpgrades: boolean;
  loungeAccess: boolean;
  benefits?: Record<string, unknown>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Customer loyalty account
 */
export interface CustomerLoyalty {
  id: string;
  userId: string;
  currentTierId?: string;
  currentTier?: LoyaltyTier;
  totalPoints: number;
  availablePoints: number;
  lifetimePoints: number;
  tierQualifiedAt?: string;
  nextTierPointsNeeded?: number;
  pointsExpiringSoon: number;
  pointsExpiryDate?: string;
  lastActivityAt: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Loyalty transaction record
 */
export interface LoyaltyTransaction {
  id: string;
  userId: string;
  bookingId?: string;
  transactionType: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
  points: number;
  description: string;
  balanceAfter: number;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface LoyaltyTransactionCreate {
  userId: string;
  bookingId?: string;
  transactionType: 'earn' | 'redeem' | 'expire' | 'bonus' | 'adjustment';
  points: number;
  description: string;
  expiresAt?: string;
  metadata?: Record<string, unknown>;
}
