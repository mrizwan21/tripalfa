import React, { useEffect, useState } from "react";
import { Gift, AlertCircle } from "lucide-react";
import type { PointsDisplayConfig } from "@/types/loyalty";

interface PointsDisplayProps {
  currentPoints: number;
  pointsToEarn?: number;
  expiringPoints?: number;
  config?: PointsDisplayConfig;
}

export function PointsDisplay({
  currentPoints,
  pointsToEarn = 0,
  expiringPoints = 0,
  config,
}: PointsDisplayProps) {
  const size = config?.size || "md";
  const showLabel = config?.showLabel ?? true;
  const showAnimation = config?.showAnimation ?? true;
  const format = config?.format || "simple";

  const [displayedPoints, setDisplayedPoints] = useState(0);
  const [displayedEarning, setDisplayedEarning] = useState(0);

  // Animate points counter
  useEffect(() => {
    if (!showAnimation) {
      setDisplayedPoints(currentPoints);
      return;
    }

    let animatingPoints = 0;
    const pointsPerFrame = Math.ceil(currentPoints / 30);
    const interval = setInterval(() => {
      if (animatingPoints < currentPoints) {
        animatingPoints = Math.min(
          animatingPoints + pointsPerFrame,
          currentPoints,
        );
        setDisplayedPoints(animatingPoints);
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [currentPoints, showAnimation]);

  // Animate earning points
  useEffect(() => {
    if (!showAnimation || pointsToEarn === 0) {
      setDisplayedEarning(pointsToEarn);
      return;
    }

    let animatingEarning = 0;
    const earningPerFrame = Math.ceil(pointsToEarn / 30);
    const interval = setInterval(() => {
      if (animatingEarning < pointsToEarn) {
        animatingEarning = Math.min(
          animatingEarning + earningPerFrame,
          pointsToEarn,
        );
        setDisplayedEarning(animatingEarning);
      } else {
        clearInterval(interval);
      }
    }, 20);

    return () => clearInterval(interval);
  }, [pointsToEarn, showAnimation]);

  const sizeClasses = {
    sm: "text-lg",
    md: "text-2xl",
    lg: "text-3xl",
  };

  const labelSizeClasses = {
    sm: "text-xs",
    md: "text-sm",
    lg: "text-base",
  };

  if (format === "detailed") {
    return (
      <div className="space-y-4">
        {/* Current Points */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-4 rounded-xl border border-blue-200">
          <div className="flex items-center justify-between gap-2">
            <div>
              {showLabel && (
                <p
                  className={`${labelSizeClasses[size]} text-gray-600 font-medium`}
                >
                  Current Balance
                </p>
              )}
              <p
                className={`${sizeClasses[size]} font-black text-blue-600 mt-1`}
              >
                {displayedPoints.toLocaleString()}
              </p>
            </div>
            <Gift className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        {/* Points to Earn */}
        {pointsToEarn > 0 && (
          <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-4 rounded-xl border border-green-200">
            <div className="flex items-center justify-between gap-2">
              <div>
                {showLabel && (
                  <p
                    className={`${labelSizeClasses[size]} text-gray-600 font-medium`}
                  >
                    You'll Earn on This Booking
                  </p>
                )}
                <p
                  className={`${sizeClasses[size]} font-black text-green-600 mt-1`}
                >
                  +{displayedEarning.toLocaleString()}
                </p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500 text-white flex items-center justify-center font-bold text-sm gap-2">
                +
              </div>
            </div>
          </div>
        )}

        {/* Expiring Soon Warning */}
        {expiringPoints > 0 && (
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 p-4 rounded-xl border border-amber-200">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5 gap-4" />
              <div className="flex-1 gap-4">
                {showLabel && (
                  <p
                    className={`${labelSizeClasses[size]} text-gray-600 font-medium`}
                  >
                    Points Expiring Soon
                  </p>
                )}
                <p
                  className={`${sizeClasses[size]} font-black text-amber-600 mt-1`}
                >
                  {expiringPoints.toLocaleString()} points
                </p>
                <p className="text-xs text-amber-700 mt-2">
                  Redeem before expiry to keep your points
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Simple format
  return (
    <div className="space-y-2">
      {showLabel && (
        <p className={`${labelSizeClasses[size]} text-gray-600 font-medium`}>
          Loyalty Points
        </p>
      )}
      <p className={`${sizeClasses[size]} font-black text-gray-900`}>
        {displayedPoints.toLocaleString()}
      </p>
      {pointsToEarn > 0 && (
        <p className={`${labelSizeClasses[size]} text-green-600 font-semibold`}>
          +{displayedEarning.toLocaleString()} on this booking
        </p>
      )}
    </div>
  );
}
