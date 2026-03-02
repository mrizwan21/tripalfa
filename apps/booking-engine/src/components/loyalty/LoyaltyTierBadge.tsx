import React from "react";
import { TrendingUp } from "lucide-react";
import type { TierBenefits, BadgeConfig } from "@/types/loyalty";
import { TIER_STYLES } from "@/types/loyalty";

interface LoyaltyTierBadgeProps {
  tier: TierBenefits;
  config?: BadgeConfig;
}

export function LoyaltyTierBadge({ tier, config }: LoyaltyTierBadgeProps) {
  // Handle case where tier is not provided or is invalid
  if (!tier || !tier.name) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br from-muted to-muted/80 gap-2">
          <TrendingUp className="h-full w-full p-1" />
        </div>
        <div className="flex flex-col gap-4">
          <span className="font-bold text-muted-foreground">Bronze</span>
        </div>
      </div>
    );
  }

  const size = config?.size || "md";
  const showPoints = config?.showPoints ?? false;
  const showTierName = config?.showTierName ?? true;

  const sizeClasses = {
    xs: "h-6 w-6 text-xs",
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  const tierName = tier.name.toUpperCase();
  const tierStyle = TIER_STYLES[tierName as keyof typeof TIER_STYLES];

  if (!tierStyle) {
    return (
      <div className="flex items-center gap-2">
        <div
          className={`${sizeClasses[size]} rounded-full flex items-center justify-center font-bold text-white shadow-md bg-gradient-to-br from-muted to-muted/80`}
          title={tier.name}
        >
          <TrendingUp className="h-full w-full p-1" />
        </div>
        {showTierName && (
          <div className="flex flex-col gap-4">
            <span className="font-bold text-muted-foreground">{tier.name}</span>
            {showPoints && tier.level && (
              <span className="text-xs text-muted-foreground">
                Tier {tier.level}
              </span>
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
        <div className="flex flex-col gap-4">
          <span className={`font-bold ${tierStyle.textColor}`}>
            {tier.name}
          </span>
          {showPoints && tier.level && (
            <span className="text-xs text-muted-foreground">
              Tier {tier.level}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
