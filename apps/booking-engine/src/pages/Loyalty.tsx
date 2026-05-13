import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Star as Trophy,
  Gift,
  Clock,
  Zap,
  Shield,
  Star,
  History,
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../components/layout/PageHeader';
import { useLoyaltyBalance } from '../hooks/useLoyaltyBalance';
import { loyaltyApi } from '../api/loyaltyApi';
import { LoyaltyTierBadge } from '../components/loyalty/LoyaltyTierBadge';
import { PointsDisplay } from '../components/loyalty/PointsDisplay';
import { DEFAULT_CONTENT_CONFIG, loadTenantContentConfig } from '../lib/tenantContentConfig';
import { Label } from '../components/ui/label';

type TierBenefits = Record<string, any>;

// Utility
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
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <PageHeader title="Loyalty Hub" subtitle="Manage your elite status and rewards." />

      {/* Main Tier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
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
              <h2 className="text-lg font-bold text-[#1d1d1f]">
                {typeof currentTierName === 'string' ? currentTierName : ''} Elite
              </h2>
              <p className="text-sm text-gray-600">Member since 2024</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-gray-500 uppercase tracking-wider gap-4">
              <span>Progress to Gold</span>
              <span>{Math.round(tierProgress)}%</span>
            </div>
            <div className="h-3 w-full bg-gray-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-[#003b95]"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600">
              <span className="font-bold text-[#1d1d1f]">
                {nextTierPoints - currentPoints} points
              </span>{' '}
              needed to reach Gold.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">Available Balance</p>
          <PointsDisplay
            currentPoints={currentPoints}
            pointsToEarn={250}
            config={{ size: 'lg', format: 'simple', showAnimation: true }}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRedeem}
              className="flex-1 py-2.5 px-5 rounded-lg border border-gray-200 text-gray-700 font-semibold text-sm hover:bg-gray-50 transition-colors"
            >
              Redeem
            </button>
            <button
              onClick={handleHistory}
              className="flex-1 py-2.5 px-5 rounded-lg bg-[#003b95] text-white font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
            >
              History
            </button>
          </div>
        </div>
      </div>

      {/* Redeem Modal */}
      {showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-bold text-[#1d1d1f]">Redeem Points</h3>
              <button
                onClick={() => setShowRedeemModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Available Points
                </label>
                <div className="text-2xl font-bold text-[#003b95]">
                  {currentPoints.toLocaleString()} points
                </div>
              </div>
              <div>
                <label className="block text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
                  Points to Redeem
                </label>
                <input
                  type="number"
                  placeholder="Enter points"
                  className="w-full h-12 rounded-xl border border-gray-200 bg-white px-4 text-sm text-gray-900 placeholder:text-gray-400 outline-none transition-all duration-200 hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10"
                  max={currentPoints}
                />
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                <p className="text-sm text-gray-600">100 points = $1 USD credit</p>
              </div>
              <button 
                className="w-full bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
                onClick={() => setShowRedeemModal(false)}
              >
                Redeem Points
              </button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistoryModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-lg font-bold text-[#1d1d1f]">Points History</h3>
              <button
                onClick={() => setShowHistoryModal(false)}
                className="text-gray-500 hover:text-gray-700 p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                ✕
              </button>
            </div>
            <div className="divide-y divide-gray-100">
              {transactionHistory.map(txn => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between py-4 gap-2"
                >
                  <div>
                    <p className="font-medium text-[#1d1d1f] text-sm">{txn.description}</p>
                    <p className="text-xs text-gray-500">{txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p
                      className={`font-bold text-sm ${txn.points > 0 ? 'text-[#003b95]' : 'text-gray-500'}`}
                    >
                      {txn.points > 0 ? '+' : ''}
                      {txn.points}
                    </p>
                    <p className="text-xs text-gray-500">{txn.status}</p>
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
          <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider flex items-center gap-2">
                <Star className="text-yellow-500 fill-yellow-500" size={18} />
                Tier Benefits
              </h3>
              <span className="px-3 py-1 bg-[#003b95]/10 text-[#003b95] rounded-full text-[11px] font-bold uppercase tracking-wider">
                Active
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {processedBenefits.map((benefit: any) => (
                <div
                  key={benefit.id}
                  className={cn(
                    'p-4 rounded-xl border border-gray-100 flex items-center gap-3 transition-all',
                    benefit.unlocked
                      ? 'bg-white shadow-sm hover:shadow-md'
                      : 'bg-gray-50 opacity-60'
                  )}
                >
                  <div
                    className={cn(
                      'w-10 h-10 rounded-xl flex items-center justify-center',
                      benefit.unlocked
                        ? 'bg-[#003b95]/10 text-[#003b95]'
                        : 'bg-gray-200 text-gray-400'
                    )}
                  >
                    <benefit.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-[#1d1d1f] text-sm">{benefit.name}</p>
                    <p className="text-xs text-gray-500">
                      {benefit.unlocked ? 'Active' : `Unlocks at ${benefit.tierName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Points Warning */}
          {expiring && expiring.points > 0 && (
            <div className="bg-[#003b95]/5 border border-[#003b95]/10 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-[#003b95]/10 rounded-full text-[#003b95]">
                <Clock size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-[#1d1d1f]">Expiring Points</h4>
                <p className="text-sm text-gray-600">
                  You have <span className="font-bold">{expiring.points} points</span> expiring on{' '}
                  {expiring.date}.
                </p>
              </div>
              <button
                className="text-sm font-semibold text-[#003b95] hover:text-[#002a6e] px-3 py-1.5 rounded-lg hover:bg-[#003b95]/10 transition-colors"
              >
                Redeem Now
              </button>
            </div>
          )}
        </div>

        {/* Coupons Section */}
        <div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <div className="flex justify-between items-center mb-4 gap-4">
              <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                Available Coupons
              </h3>
              <button
                className="text-xs font-semibold text-gray-600 hover:text-[#003b95] px-3 py-1.5 rounded-lg hover:bg-gray-50 transition-colors"
              >
                View All
              </button>
            </div>

            <div className="space-y-3">
              {coupons.map(coupon => (
                <div key={coupon.id} className="bg-gray-50 p-4 rounded-xl border border-gray-100 hover:shadow-sm transition-all">
                  <div className="flex justify-between items-start mb-2 gap-4">
                    <div>
                      <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                        {coupon.type} Discount
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-[#1d1d1f]">{coupon.discount}</span>
                        <Gift size={16} className="text-[#003b95]" />
                      </div>
                    </div>
                    <code className="text-xs px-2 py-1 bg-white rounded-lg border border-gray-100 text-gray-500 font-mono">
                      {coupon.id}
                    </code>
                  </div>
                  <p className="text-xs text-gray-600 mb-2">{coupon.desc}</p>
                  <span className="text-xs font-semibold text-red-500">Exp: {coupon.valid}</span>
                </div>
              ))}

              <button
                className="w-full py-3 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-gray-400 hover:border-[#003b95]/30 hover:bg-[#003b95]/5 hover:text-[#003b95] transition-colors"
              >
                Browse more rewards
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoyaltyPage;
