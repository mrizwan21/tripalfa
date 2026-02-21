import { useState, useCallback, useEffect } from 'react';
import { loyaltyApi } from '@/api/loyaltyApi';
import type { LoyaltyStatus, TierBenefits } from '@/types/loyalty';
import type { CustomerLoyalty } from '@tripalfa/shared-types';

interface UseLoyaltyBalanceOptions {
  userId?: string;
  autoRefreshInterval?: number | null;
  onBalanceChange?: (balance: LoyaltyStatus | null) => void;
}

interface UseLoyaltyBalanceReturn {
  balance: LoyaltyStatus | null;
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useLoyaltyBalance(
  options: UseLoyaltyBalanceOptions = {}
): UseLoyaltyBalanceReturn {
  const { userId, autoRefreshInterval = 30000, onBalanceChange } = options;

  const [balance, setBalance] = useState<LoyaltyStatus | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const [loyalty, tiers] = await Promise.all([
        loyaltyApi.getUserLoyalty(userId),
        loyaltyApi.getTierBenefits(),
      ]);

      // Find current and next tier
      const sortedTiers = tiers.sort((a, b) => a.minPoints - b.minPoints);
      const currentTier = sortedTiers.reverse().find(t => loyalty.currentPoints >= t.minPoints);
      const nextTier = sortedTiers.find(t => loyalty.currentPoints < t.maxPoints);

      const tierStatus: LoyaltyStatus = {
        tier: currentTier || sortedTiers[0],
        currentPoints: loyalty.currentPoints,
        totalPointsEarned: loyalty.totalPointsEarned || 0,
        totalPointsRedeemed: loyalty.totalPointsRedeemed || 0,
        pointsExpiringDate: loyalty.pointsExpiringDate,
        nextTierThreshold: nextTier?.minPoints || loyalty.currentPoints + 1000,
        pointsUntilNextTier: Math.max(
          (nextTier?.minPoints || loyalty.currentPoints + 1000) - loyalty.currentPoints,
          0
        ),
        nextTierPerks: nextTier?.benefits || [],
      };

      setBalance(tierStatus);
      onBalanceChange?.(tierStatus);
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Failed to fetch loyalty balance';
      setError(errorMessage);
      setBalance(null);
    } finally {
      setIsLoading(false);
    }
  }, [userId, onBalanceChange]);

  // Initial load
  useEffect(() => {
    if (userId) {
      refresh();
    }
  }, [userId, refresh]);

  // Auto-refresh interval
  useEffect(() => {
    if (!autoRefreshInterval || !userId) return;

    const interval = setInterval(() => {
      refresh();
    }, autoRefreshInterval);

    return () => clearInterval(interval);
  }, [userId, autoRefreshInterval, refresh]);

  return {
    balance,
    isLoading,
    error,
    refresh,
  };
}
