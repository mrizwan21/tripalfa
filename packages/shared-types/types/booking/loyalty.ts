import type { LoyaltyTierRecord, CustomerLoyaltyRecord } from '../loyalty';

export interface LoyaltyTransaction {
  id: string;
  customerId: string;
  points: number;
  type: 'EARN' | 'REDEEM' | 'EXPIRE' | 'BONUS' | 'ADJUSTMENT';
  description: string;
  bookingReference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TierBenefits {
  id: string;
  name: string;
  level: number;
  minPoints: number;
  maxPoints: number;
  discountPercentage: number;
  pointsMultiplier: number;
  benefits: string[];
  color?: string;
  icon?: string;
}

export interface LoyaltyStatus {
  tier: TierBenefits;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  pointsExpiringDate?: string;
  expiringPoints?: number;
  nextTierThreshold: number;
  pointsUntilNextTier: number;
  nextTierPerks?: string[];
  lastActivityDate?: string;
}

// UI-specific types for loyalty badges and progress indicators
export interface BadgeConfig {
  size: 'xs' | 'sm' | 'md' | 'lg';
  variant?: 'solid' | 'outline';
  showPoints?: boolean;
  showTierName?: boolean;
}

export interface ProgressConfig {
  showLabel?: boolean;
  showPercentage?: boolean;
  animated?: boolean;
  height?: number;
}

export interface PointsDisplayConfig {
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  showAnimation?: boolean;
  format?: 'simple' | 'detailed';
}

// Tier colors and styling
export const TIER_COLORS = {
  SILVER: '#C0C0C0',
  GOLD: '#FFD700',
  PLATINUM: '#E5E4E2',
  DIAMOND: '#00CED1',
} as const;

export const TIER_STYLES = {
  SILVER: {
    color: '#C0C0C0',
    bgGradient: 'from-gray-100 to-gray-300',
    textColor: 'text-gray-800',
  },
  GOLD: {
    color: '#FFD700',
    bgGradient: 'from-yellow-100 to-yellow-300',
    textColor: 'text-yellow-900',
  },
  PLATINUM: {
    color: '#E5E4E2',
    bgGradient: 'from-gray-100 to-gray-200',
    textColor: 'text-gray-800',
  },
  DIAMOND: {
    color: '#00CED1',
    bgGradient: 'from-cyan-100 to-cyan-400',
    textColor: 'text-cyan-900',
  },
} as const;

// Form-related types
export interface RedemptionForm {
  points: number;
  bookingId?: string;
  description: string;
}

export interface RedemptionResult {
  success: boolean;
  pointsRemaining: number;
  redemptionAmount: number;
  message: string;
}

// Points-related types
export interface PointsEarningBreakdown {
  basePoints: number;
  tierMultiplier: number;
  bonusPoints: number;
  totalPoints: number;
}

export interface ExpiringPointsWarning {
  points: number;
  daysUntilExpiry: number;
  expiryDate: string;
}

// Feature flags
export interface LoyaltyFeatures {
  enablePointsRedeeming: boolean;
  enableTierUpgradeNotifications: boolean;
  enablePointsExpiryWarnings: boolean;
  enableBonusPoints: boolean;
}

// Analytics
export interface LoyaltyAnalytics {
  averagePointsPerUser: number;
  averagePointsRedeemed: number;
  totalUsersInProgram: number;
  tierDistribution: Record<string, number>;
}
