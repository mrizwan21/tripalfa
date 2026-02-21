import React, { useEffect, useState } from 'react';
import type { ProgressConfig } from '@/types/loyalty';

interface TierProgressBarProps {
  currentPoints?: number;
  nextTierThreshold?: number;
  tierName?: string;
  config?: ProgressConfig;
}

export function TierProgressBar({
  currentPoints = 0,
  nextTierThreshold = 1000,
  tierName = 'Bronze',
  config,
}: TierProgressBarProps) {
  const showLabel = config?.showLabel ?? true;
  const showPercentage = config?.showPercentage ?? true;
  const animated = config?.animated ?? true;
  const height = config?.height ?? 8;

  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const percentage = Math.min(
      (currentPoints / nextTierThreshold) * 100,
      100
    );

    // Animate progress bar
    if (animated) {
      let animatingProgress = 0;
      const interval = setInterval(() => {
        if (animatingProgress < percentage) {
          animatingProgress += 1;
          setProgress(animatingProgress);
        } else {
          clearInterval(interval);
        }
      }, 10);
      return () => clearInterval(interval);
    } else {
      setProgress(percentage);
    }
  }, [currentPoints, nextTierThreshold, animated]);

  const pointsNeeded = Math.max(nextTierThreshold - currentPoints, 0);

  return (
    <div className="w-full space-y-2">
      {showLabel && (
        <div className="flex justify-between items-start">
          <div>
            <p className="text-sm font-bold text-gray-700">{tierName}</p>
            <p className="text-xs text-gray-500">
              {currentPoints.toLocaleString()} / {nextTierThreshold.toLocaleString()} points
            </p>
          </div>
          {showPercentage && (
            <span className="text-sm font-bold text-gray-600">
              {Math.round(progress)}%
            </span>
          )}
        </div>
      )}

      <div
        className="w-full bg-gray-200 rounded-full overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <div
          className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300 ease-out rounded-full"
          style={{ width: `${progress}%` }}
        />
      </div>

      {pointsNeeded > 0 && (
        <p className="text-xs text-gray-500">
          {pointsNeeded.toLocaleString()} points until next tier
        </p>
      )}
    </div>
  );
}
