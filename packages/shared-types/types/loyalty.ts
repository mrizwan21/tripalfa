// Core loyalty program types
export interface LoyaltyTierRecord {
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
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLoyaltyRecord {
  id: string;
  customerId: string;
  currentTierId: string;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  pointsExpiringDate?: string;
  expiringPoints?: number;
  lastActivityDate?: string;
  isActive: boolean;
  joinedAt: string;
  updatedAt: string;
}

// Points transaction types
export interface PointsTransaction {
  id: string;
  customerId: string;
  points: number;
  type: "EARN" | "REDEEM" | "EXPIRE" | "BONUS" | "ADJUSTMENT";
  description: string;
  bookingReference?: string;
  orderReference?: string;
  expiryDate?: string;
  createdAt: string;
  processedAt?: string;
}

// Loyalty program configuration
export interface LoyaltyProgramConfig {
  id: string;
  name: string;
  description: string;
  isActive: boolean;
  tiers: LoyaltyTierRecord[];
  pointsPerDollar: number;
  pointsExpiryMonths: number;
  minimumRedemptionPoints: number;
  maximumRedemptionPoints?: number;
  redemptionRate: number; // points per dollar
  bonusPointsEnabled: boolean;
  referralBonusPoints: number;
  birthdayBonusPoints: number;
  anniversaryBonusPoints: number;
  createdAt: string;
  updatedAt: string;
}

// Points earning rules
export interface PointsEarningRule {
  id: string;
  name: string;
  description: string;
  eventType:
    | "BOOKING"
    | "PAYMENT"
    | "REFERRAL"
    | "REVIEW"
    | "BIRTHDAY"
    | "ANNIVERSARY";
  pointsAwarded: number;
  multiplier?: number;
  conditions?: Record<string, any>;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

// Redemption options
export interface RedemptionOption {
  id: string;
  name: string;
  description: string;
  pointsRequired: number;
  discountType: "PERCENTAGE" | "FIXED_AMOUNT";
  discountValue: number;
  maxRedemptionsPerCustomer?: number;
  maxRedemptionsTotal?: number;
  isActive: boolean;
  validFrom?: string;
  validUntil?: string;
  createdAt: string;
  updatedAt: string;
}

// Customer loyalty status
export interface LoyaltyStatus {
  tier: LoyaltyTierRecord;
  currentPoints: number;
  totalPointsEarned: number;
  totalPointsRedeemed: number;
  pointsExpiringDate?: string;
  expiringPoints?: number;
  nextTierThreshold: number;
  pointsUntilNextTier: number;
  nextTierPerks?: string[];
  lastActivityDate?: string;
  membershipStatus: "ACTIVE" | "INACTIVE" | "SUSPENDED";
}

// Analytics and reporting
export interface LoyaltyAnalytics {
  totalMembers: number;
  activeMembers: number;
  averagePointsPerMember: number;
  totalPointsIssued: number;
  totalPointsRedeemed: number;
  redemptionRate: number;
  tierDistribution: Record<string, number>;
  pointsExpiryRate: number;
  monthlyActiveUsers: number;
  averageSessionDuration?: number;
}

// API response types
export interface LoyaltyApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

// Form types
export interface LoyaltyEnrollmentForm {
  customerId: string;
  agreeToTerms: boolean;
  marketingConsent?: boolean;
  preferredCommunication: "EMAIL" | "SMS" | "BOTH";
}

export interface PointsRedemptionForm {
  customerId: string;
  points: number;
  redemptionOptionId: string;
  bookingId?: string;
  notes?: string;
}

// Notification types
export interface LoyaltyNotification {
  id: string;
  customerId: string;
  type:
    | "TIER_UPGRADE"
    | "POINTS_EXPIRY_WARNING"
    | "POINTS_EARNED"
    | "BONUS_POINTS"
    | "REDEMPTION_CONFIRMATION";
  title: string;
  message: string;
  data?: Record<string, any>;
  isRead: boolean;
  createdAt: string;
  expiresAt?: string;
}

// Feature flags and configuration
export interface LoyaltyFeatures {
  enablePointsEarning: boolean;
  enablePointsRedemption: boolean;
  enableTierSystem: boolean;
  enableReferralProgram: boolean;
  enableBirthdayBonuses: boolean;
  enableExpiryWarnings: boolean;
  enableNotifications: boolean;
  enableAnalytics: boolean;
}

// Constants
export const LOYALTY_TIER_NAMES = {
  SILVER: "Silver",
  GOLD: "Gold",
  PLATINUM: "Platinum",
  DIAMOND: "Diamond",
} as const;

export const LOYALTY_TRANSACTION_TYPES = {
  EARN: "EARN",
  REDEEM: "REDEEM",
  EXPIRE: "EXPIRE",
  BONUS: "BONUS",
  ADJUSTMENT: "ADJUSTMENT",
} as const;

export const LOYALTY_EVENT_TYPES = {
  BOOKING: "BOOKING",
  PAYMENT: "PAYMENT",
  REFERRAL: "REFERRAL",
  REVIEW: "REVIEW",
  BIRTHDAY: "BIRTHDAY",
  ANNIVERSARY: "ANNIVERSARY",
} as const;
