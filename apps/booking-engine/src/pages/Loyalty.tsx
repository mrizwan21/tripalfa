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
  Tag
} from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { useNavigate } from 'react-router-dom';

import PageHeader from '../components/layout/PageHeader';
import { useLoyaltyBalance } from '../hooks/useLoyaltyBalance';
import { loyaltyApi, TierBenefits } from '../api/loyaltyApi';
import { LoyaltyTierBadge } from '../components/loyalty/LoyaltyTierBadge';
import { PointsDisplay } from '../components/loyalty/PointsDisplay';
import { Card } from '../components/ui/card';
import { Button } from '../components/ui/button';

// Futuristic Utility
function cn(...inputs: (string | undefined | null | false)[]) {
  return twMerge(clsx(inputs));
}

// Mock data for coupons (temporary until API is available)
const MOCK_COUPONS = [
  { id: 'SAVE10', type: 'Percentage', discount: '10%', desc: 'Save 10% on your next booking', valid: '28 Feb 2026' },
  { id: 'FLAT50', type: 'Fixed', discount: '$50', desc: '$50 off flights above $500', valid: '15 Mar 2026' },
];

export default function LoyaltyPage() {
  const navigate = useNavigate();
  const { balance, isLoading } = useLoyaltyBalance();
  const [tiers, setTiers] = React.useState<TierBenefits[]>([]);
  const [expiring, setExpiring] = React.useState<{ points: number; date: string } | null>(null);
  const [showRedeemModal, setShowRedeemModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);

  // Mock transaction history
  const [transactionHistory] = useState([
    { id: 'txn-1', type: 'earn', points: 500, description: 'Flight booking DXB-LHR', date: '2024-01-15', status: 'Completed' },
    { id: 'txn-2', type: 'redeem', points: -200, description: 'Hotel discount', date: '2024-01-10', status: 'Completed' },
    { id: 'txn-3', type: 'earn', points: 150, description: 'Hotel booking Paris', date: '2024-01-05', status: 'Completed' },
    { id: 'txn-4', type: 'earn', points: 300, description: 'Flight booking LHR-NYC', date: '2023-12-28', status: 'Completed' },
    { id: 'txn-5', type: 'redeem', points: -100, description: 'Lounge access', date: '2023-12-20', status: 'Completed' },
  ]);

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
        const [loadedTiers, expiringData] = await Promise.all([
          loyaltyApi.getTierBenefits(),
          // Assume user ID is handled internally by API instance or token
          loyaltyApi.getExpiringPoints('current')
        ]);
        setTiers(loadedTiers);
        setExpiring({ points: expiringData.expiringPoints, date: expiringData.expiryDate });
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
    if (tiers.length === 0) return [
      { id: 1, name: 'Priority Boarding', icon: Zap, unlocked: true },
      { id: 2, name: 'Lounge Access', icon: Trophy, unlocked: true },
      { id: 3, name: 'Free Cancellation', icon: Shield, unlocked: false },
      { id: 4, name: '2x Points Multiplier', icon: TrendingUp, unlocked: false },
    ];

    return tiers.flatMap(t =>
      t.benefits.map(b => ({
        id: t.id + b,
        name: b,
        icon: Star, // Generic icon for dynamic benefits
        unlocked: t.level <= currentTierLevel,
        tierName: t.name
      }))
    ).filter((v, i, a) => a.findIndex(t => (t.name === v.name)) === i) // Unique benefits
      .sort((a, b) => (a.unlocked === b.unlocked ? 0 : a.unlocked ? -1 : 1)); // Active first
  }, [tiers, currentTierLevel]);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <PageHeader
        title="Loyalty Hub"
        subtitle="Manage your elite status and rewards."
      />

      {/* Main Tier Card */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center gap-4 mb-4">
            <LoyaltyTierBadge
              tier={{ name: typeof currentTierName === 'string' ? currentTierName : currentTierName?.name ?? 'Silver', level: 2, id: 'silver', minPoints: 0, maxPoints: 0, discountPercentage: 10, pointsMultiplier: 1.5, benefits: [] }}
              config={{ size: 'lg', showTierName: false }}
            />
            <div>
              <h2 className="text-2xl font-semibold text-slate-900">
                {typeof currentTierName === 'string' ? currentTierName : ''} Elite
              </h2>
              <p className="text-sm text-slate-500">Member since 2024</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm font-medium text-slate-600">
              <span>Progress to Gold</span>
              <span>{Math.round(tierProgress)}%</span>
            </div>
            <div className="h-3 w-full bg-slate-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${tierProgress}%` }}
              />
            </div>
            <p className="text-sm text-slate-500">
              <span className="font-medium text-slate-900">{nextTierPoints - currentPoints} points</span> needed to reach Gold.
            </p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-sm font-medium text-slate-500 mb-2">Available Balance</p>
          <PointsDisplay
            currentPoints={currentPoints}
            pointsToEarn={250}
            config={{ size: 'lg', format: 'simple', showAnimation: true }}
          />
          <div className="flex gap-3 mt-4">
            <button
              onClick={handleRedeem}
              className="flex-1 py-2.5 px-5 rounded-lg bg-purple-600 text-white font-medium hover:bg-purple-700 transition-colors"
            >
              Redeem
            </button>
            <button
              onClick={handleHistory}
              className="flex-1 py-2.5 px-5 rounded-lg bg-slate-100 text-slate-700 font-medium hover:bg-slate-200 transition-colors"
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
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Redeem Points</h3>
              <button onClick={() => setShowRedeemModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Available Points</label>
                <div className="text-2xl font-bold text-purple-600">{currentPoints.toLocaleString()} points</div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Points to Redeem</label>
                <input
                  type="number"
                  placeholder="Enter points"
                  className="w-full h-11 px-3 border border-slate-200 rounded-lg"
                  max={currentPoints}
                />
              </div>
              <div className="bg-slate-50 p-3 rounded-lg">
                <p className="text-sm text-slate-600">100 points = $1 USD credit</p>
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
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">Points History</h3>
              <button onClick={() => setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-600">✕</button>
            </div>
            <div className="space-y-3">
              {transactionHistory.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium text-slate-900">{txn.description}</p>
                    <p className="text-xs text-slate-500">{txn.date}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${txn.points > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {txn.points > 0 ? '+' : ''}{txn.points}
                    </p>
                    <p className="text-xs text-slate-500">{txn.status}</p>
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
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm mb-6">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
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
                    "p-4 rounded-lg border flex items-center gap-3 transition-all",
                    benefit.unlocked
                      ? "bg-slate-50 border-slate-200"
                      : "bg-slate-50 border-slate-100 opacity-50"
                  )}
                >
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    benefit.unlocked ? "bg-purple-100 text-purple-600" : "bg-slate-200 text-slate-400"
                  )}>
                    <benefit.icon size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{benefit.name}</p>
                    <p className="text-xs text-slate-500">
                      {benefit.unlocked ? 'Active' : `Unlocks at ${benefit.tierName}`}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Expiring Points Warning */}
          {(expiring && expiring.points > 0) && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-xl flex items-start gap-3">
              <div className="p-2 bg-amber-100 rounded-full text-amber-600">
                <Clock size={18} />
              </div>
              <div className="flex-1">
                <h4 className="font-medium text-amber-900">Expiring Points</h4>
                <p className="text-sm text-amber-700">
                  You have <span className="font-bold">{expiring.points} points</span> expiring on {expiring.date}.
                </p>
              </div>
              <button className="text-sm font-medium text-amber-700 hover:text-amber-900">
                Redeem Now
              </button>
            </div>
          )}
        </div>

        {/* Coupons Section */}
        <div>
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-semibold text-slate-900">Available Coupons</h3>
              <button className="text-xs text-purple-600 hover:text-purple-700">View All</button>
            </div>

            <div className="space-y-3">
              {MOCK_COUPONS.map((coupon) => (
                <div key={coupon.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <span className="text-xs font-medium text-slate-500">{coupon.type} Discount</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xl font-bold text-slate-900">{coupon.discount}</span>
                        <Gift size={16} className="text-purple-600" />
                      </div>
                    </div>
                    <code className="text-xs px-2 py-1 bg-white rounded border border-slate-200 text-slate-600">
                      {coupon.id}
                    </code>
                  </div>
                  <p className="text-xs text-slate-600 mb-2">{coupon.desc}</p>
                  <span className="text-xs text-red-500">Exp: {coupon.valid}</span>
                </div>
              ))}

              <button className="w-full py-3 border-2 border-dashed border-slate-200 rounded-lg text-sm font-medium text-slate-500 hover:border-purple-300 hover:text-purple-600 transition-colors">
                Browse more rewards
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
