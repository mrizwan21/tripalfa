import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { TierBenefits, BadgeConfig } from '@/types/loyalty';
import { TIER_STYLES } from '@/types/loyalty';

interface LoyaltyTierBadgeProps {
  tier: TierBenefits;
  config?: BadgeConfig;
}

export function LoyaltyTierBadge({ tier, config }: LoyaltyTierBadgeProps) {
  // Handle case where tier is not provided or is invalid
  if (!tier || !tier.name) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br from-gray-300 to-gray-400">
          <TrendingUp className="h-full w-full p-1" />
        </div>
        <div className="flex flex-col">
          <span className="font-bold text-gray-600">Bronze</span>
        </div>
      </div>
    );
  }

  const size = config?.size || 'md';
  const showPoints = config?.showPoints ?? false;
  const showTierName = config?.showTierName ?? true;

  const sizeClasses = {
    xs: 'h-6 w-6 text-xs',
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
  };

  const tierName = tier.name.toUpperCase();
  const tierStyle = TIER_STYLES[tierName as keyof typeof TIER_STYLES];

  if (!tierStyle) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br from-gray-300 to-gray-400`}
          title={tier.name}
        >
          <TrendingUp className="h-full w-full p-1" />
        </div>
        {showTierName && (
          <div className="flex flex-col">
            <span className="font-bold text-gray-600">{tier.name}</span>
            {showPoints && tier.level && (
              <span className="text-xs text-gray-500">Tier {tier.level}</span>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <div
        className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br ${tierStyle.bgGradient}`}
        title={tier.name}
      >
        <TrendingUp className="h-full w-full p-1" />
      </div>
      {showTierName && (
        <div className="flex flex-col">
          <span className={`font-bold ${tierStyle.textColor}`}>{tier.name}</span>
          {showPoints && tier.level && (
            <span className="text-xs text-gray-500">Tier {tier.level}</span>
          )}
        </div>
      )}
    </div>
  );
}
