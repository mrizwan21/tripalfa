import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star as Trophy,
  Gift,
  Clock,
  ChevronRight,
  Zap,
  Shield,
  Star,
  Lock,
  ArrowRight,
  History,
  CreditCard,
  Tag,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../components/layout/PageHeader';
import { useLoyaltyBalance } from '../hooks/useLoyaltyBalance';
import { loyaltyApi } from '../api/loyaltyApi';
import { LoyaltyTierBadge } from '../components/loyalty/LoyaltyTierBadge';
import { PointsDisplay } from '../components/loyalty/PointsDisplay';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';
import { Label } from '@/components/ui/label';

type TierBenefits = Record<string, any>;

// Futuristic Utility
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

function LoyaltyPage() {
  const navigate = useNavigate();
  const { balance, isLoading } = useLoyaltyBalance();
  const [tiers, setTiers] = React.useState<TierBenefits[]>([]);
  const [expiring, setExpiring] = React.useState<{
    points: number;
    date: string;
  } | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [coupons, setCoupons] = useState(DEFAULT_CONTENT_CONFIG.loyalty.coupons);
  const [transactionHistory, setTransactionHistory] = useState(
    DEFAULT_CONTENT_CONFIG.loyalty.transactionHistory
  );

  const handleRedeem = () => {
    setShowRedeemModal(true);
  };

  const handleHistory = () => {
    setShowHistoryModal(true);
  };

  // Dynamic Logic: Fetch real benefits and rules
  React.useEffect(() => {
    const loadDynamicRules = async () => {
      try {
        const [loadedTiers, expiringData, contentConfig] = await Promise.all([
          loyaltyApi.getTierBenefits(),
          // Assume user ID is handled internally by API instance or token
          loyaltyApi.getExpiringPoints('current'),
          loadTenantContentConfig(),
        ]);
        setTiers(loadedTiers);
        setExpiring({
          points: expiringData.expiringPoints,
          date: expiringData.expiryDate,
        });
        setCoupons(contentConfig.loyalty.coupons);
        setTransactionHistory(contentConfig.loyalty.transactionHistory);
      } catch (e) {
        // Fallback for demo if API unreachable
        console.warn('Using fallback loyalty logic', e);
      }
    };
    loadDynamicRules();
  }, []);

  // Safe defaults if API data is loading/missing
  const currentPoints = balance?.currentPoints ?? 12500;
  const currentTierName = balance?.tier ?? 'Silver';

  // Find the next tier above the current one
  const currentTierObj = tiers.find(t => t.name === currentTierName);
  const nextTierObj = tiers
    .filter(t => (currentTierObj ? t.level > currentTierObj.level : t.level > 2))
    .sort((a, b) => a.level - b.level)[0];

  // Fallback: if no API data, assume next tier at 25000 points
  const nextTierPoints = nextTierObj?.minPoints ?? 25000;

  const tierProgress = (currentPoints / nextTierPoints) * 100;

  // Logic: Calculate benefits dynamically based on tier level
  const currentTierLevel = tiers.find(t => t.name === currentTierName)?.level || 2;
  const processedBenefits = useMemo(() => {
    // If no API data, use mocks
    if (tiers.length === 0)
      return [
        { id: 1, name: 'Priority Boarding', icon: Zap, unlocked: true },
        { id: 2, name: 'Lounge Access', icon: Trophy, unlocked: true },
        { id: 3, name: 'Free Cancellation', icon: Shield, unlocked: false },
        {
          id: 4,
          name: '2x Points Multiplier',
          icon: TrendingUp,
          unlocked: false,
        },
      ];

    return tiers
      .flatMap(t =>
        t.benefits.map(b => ({
          id: t.id + b,
          name: b,
          icon: Star, // Generic icon for dynamic benefits
          unlocked: t.level <= currentTierLevel,
          tierName: t.name,
        }))
      )
      .filter((v, i, a) => a.findIndex(t => t.name === v.name) === i) // Unique benefits
      .sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1)); // Active first
  }, [tiers, currentTierLevel]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader title="Loyalty Hub" subtitle="Manage your elite status and rewards." />

      {/* Main Tier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-background p-6 rounded-xl border border-border shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <LoyaltyTierBadge
              tier={{
                name:
                  typeof currentTierName === 'string'
                    ? currentTierName
                    : (currentTierName?.name ?? 'Silver'),
                level: 2,
                id: 'silver',
                minPoints: 0,
                maxPoints: 0,
                discountPercentage: 10,
                pointsMultiplier: 1.5,
                benefits: [],
              }}
              config={{ size: 'lg', showTierName: false }}
            />
            <div>
              <h2 className="text-2xl font-semibold text-foreground">
                {typeof currentTierName === 'string' ? currentTierName : ''} Elite
              </h2>
              <p className="text-sm text-muted-foreground">Member since 2024</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-muted-foreground gap-4">
              <span>Progress to Gold</span>
              <span>{Math.round(tierProgress)}%</span>
            </div>
            <div className="h-3 w-full bg-muted rounded-full overflow-hidden">
              <div
                className="h-full bg-[hsl(var(--primary))]"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              <span className="font-medium text-foreground">
                {nextTierPoints - currentPoints} points
              </span>{' '}
              needed to reach Gold.
            </p>
          </div>
        </div>

        <div className="bg-background p-6 rounded-xl border border-border shadow-sm">
          <p className="text-sm font-medium text-muted-foreground mb-2">Available Balance</p>
          <PointsDisplay
            currentPoints={currentPoints}
            pointsToEarn={250}
            config={{ size: 'lg', format: 'simple', showAnimation: true }}
          />
          <div className="flex gap-3 mt-4">
            <Button
              variant="outline"
              size="md"
              onClick={handleRedeem}
              className="flex-1 py-2.5 px-5 rounded-lg text-background font-medium hover:bg-muted transition-colors gap-4"
            >
              Redeem
            </Button>
            <Button
              variant="outline"
              size="md"
              onClick={handleHistory}
              className="flex-1 py-2.5 px-5 rounded-lg bg-muted text-muted-foreground font-medium hover:bg-muted/80 transition-colors gap-4"
            >
              History
            </Button>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 gap-2">
          <div className="bg-background rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-semibold">Redeem Points</h3>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowRedeemModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-2">
                  Available Points
                </Label>
                <div className="text-2xl font-bold text-purple-600">
                  {currentPoints.toLocaleString()} points
                </div>
              </div>
              <div>
                <Label className="block text-sm font-medium text-muted-foreground mb-2">
                  Points to Redeem
                </Label>
                <input
                  type="number"
                  placeholder="Enter points"
                  className="w-full h-11 px-3 border border-border rounded-lg bg-background"
                  max={currentPoints}
                />
              </div>
              <div className="bg-muted p-3 rounded-lg">
                <p className="text-sm text-muted-foreground">100 points = $1 USD credit</p>
              </div>
              <Button className="w-full" onClick={() => setShowRedeemModal(false)}>
                Redeem Points
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4 gap-2">
          <div className="bg-background rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-semibold">Points History</h3>
              <Button
                variant="outline"
                size="md"
                onClick={() => setShowHistoryModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                ✕
              </Button>
            </div>
            <div className="space-y-3">
              {transactionHistory.map(txn => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between p-3 border rounded-lg gap-2"
                >
                  <div>
                    <p className="font-medium text-foreground">{txn.description}</p>
                    <p className="text-xs text-muted-foreground">{txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-semibold ${txn.points > 0 ? 'text-blue-600' : 'text-neutral-500'}`}
                    >
                      {txn.points > 0 ? '+' : ''}
                      {txn.points}
                    </p>
                    <p className="text-xs text-muted-foreground">{txn.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Benefits Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="bg-background p-6 rounded-xl border border-border shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={18} />
                Tier Benefits
              </h3>
              <span className="text-xs font-medium px-3 py-1 rounded-full bg-purple-100 text-purple-700">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {processedBenefits.map((benefit: any) => (
                <div
                  key={benefit.id}
                  className={cn(
                    'p-4 rounded-lg border flex items-center gap-3 transition-all',
                    benefit.unlocked
                      ? 'bg-muted border-border'
                      : 'bg-muted border-border opacity-50'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-lg flex items-center justify-center',
                      benefit.unlocked
                        ? 'bg-purple-100 text-purple-600'
                        : 'bg-muted text-muted-foreground'
                    )}
                  >
                    <benefit.icon size={20} />
                  </div>
                  <div className="flex-1 gap-4">
                    <p className="font-medium text-foreground">{benefit.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {benefit.unlocked ? 'Active' : `Unlocks at ${benefit.tierName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Points Warning */}
          {expiring && expiring.points > 0 && (
            <div className="bg-neutral-50 border border-neutral-200 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-neutral-100 rounded-full text-neutral-600">
                <Clock size={18} />
              </div>
              <div className="flex-1 gap-4">
                <h4 className="font-medium text-neutral-900">Expiring Points</h4>
                <p className="text-sm text-neutral-700">
                  You have <span className="font-bold">{expiring.points} points</span> expiring on{' '}
                  {expiring.date}.
                </p>
              </div>
              <Button
                variant="ghost"
                size="md"
                className="text-sm font-medium text-neutral-700 hover:text-neutral-900 px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
              >
                Redeem Now
              </Button>
            </div>
          )}
        </div>

        {/* Coupons Section */}
        <div>
          <div className="bg-background p-5 rounded-xl border border-border shadow-sm">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="font-semibold text-foreground text-xl font-semibold tracking-tight">
                Available Coupons
              </h3>
              <Button
                variant="ghost"
                size="md"
                className="text-xs px-4 py-2 text-sm font-medium rounded-md transition-colors hover:bg-muted"
              >
                View All
              </Button>
            </div>

            <div className="space-y-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="bg-muted p-4 rounded-lg border border-border">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {coupon.type} Discount
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-foreground">{coupon.discount}</span>
                        <Gift size={16} className="text-purple-600" />
                      </div>
                    </div>
                    <code className="text-xs px-2 py-1 bg-background rounded border border-border text-muted-foreground">
                      {coupon.id}
                    </code>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{coupon.desc}</p>
                  <span className="text-xs text-red-500">Exp: {coupon.valid}</span>
                </div>
              ))}

              <Button
                variant="outline"
                size="md"
                className="w-full py-3 border-2 border-dashed border-border rounded-lg text-sm font-medium text-muted-foreground hover:border-purple-300 hover:bg-muted transition-colors"
              >
                Browse more rewards
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoyaltyPage;
