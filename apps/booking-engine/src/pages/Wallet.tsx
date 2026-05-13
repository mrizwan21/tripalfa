import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWallets, listWalletTransactions } from '../lib/api';
import { formatCurrency } from '@tripalfa/ui-components';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { DEMO_CONFIG } from '../lib/constants/theme';
import {
  Wallet as WalletIcon,
  ArrowUpRight,
  ArrowLeftRight,
  CreditCard,
  TrendingUp,
  MoreHorizontal,
  Plus,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

type WalletAccount = Record<string, any>;

type Tx = {
  id: string;
  type: 'topup' | 'spend' | 'refund' | 'transfer';
  currency: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
};

function Wallet(): React.JSX.Element {
  const navigate = useNavigate();
  const { config: runtimeConfig } = useTenantRuntime();
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);

  if (!runtimeConfig.features.walletEnabled) {
    return (
      <TripLogerLayout>
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center w-full max-w-xl">
            <h1 className="text-2xl font-bold text-[#1d1d1f] mb-2">Wallet Disabled</h1>
            <p className="text-sm text-gray-600 mb-6">
              Wallet is currently disabled by your admin settings.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchWallets(), listWalletTransactions()])
      .then(([accountsRes, txsRes]) => {
        // Use fetched accounts or fallback to default USD wallet for demo/testing
        const fetchedAccounts = accountsRes || [];

        // Only show fallback wallet in demo mode
        if (fetchedAccounts.length === 0 && DEMO_CONFIG.enabled) {
          setAccounts([
            {
              id: 'default-usd-wallet',
              currency: DEMO_CONFIG.defaultCurrency,
              currentBalance: DEMO_CONFIG.defaultWalletBalance,
              pendingBalance: 0,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        } else if (fetchedAccounts.length > 0) {
          setAccounts(fetchedAccounts);
        } else {
          // No accounts and not in demo mode - show empty state
          setAccounts([]);
        }
        setTxs(txsRes || []);
      })
      .catch(() => {
        // Only show fallback wallet on error in demo mode
        if (DEMO_CONFIG.enabled) {
          setAccounts([
            {
              id: 'default-usd-wallet',
              currency: DEMO_CONFIG.defaultCurrency,
              currentBalance: DEMO_CONFIG.defaultWalletBalance,
              pendingBalance: 0,
              status: 'active',
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            },
          ]);
        } else {
          setAccounts([]);
        }
        setTxs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalBalanceUSD = useMemo(() => {
    // Mock conversion to USD for total display
    const rates: Record<string, number> = {
      USD: 1,
      EUR: 1.18,
      GBP: 1.39,
      AED: 0.27,
    };
    return accounts.reduce((acc, a) => acc + a.currentBalance * (rates[a.currency] || 1), 0);
  }, [accounts]);

  return (
    <TripLogerLayout>
      <div className="min-h-screen bg-gray-50 pb-20 font-sans">
        {/* Header */}
        <div className="bg-white border-b border-gray-100 pt-8 pb-16 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex justify-between items-start mb-8 gap-4">
              <div>
                <h1 className="text-2xl font-bold text-[#1d1d1f] mb-1">My Wallet</h1>
                <p className="text-sm text-gray-600">Manage your funds & transactions</p>
              </div>
              <div className="w-10 h-10 bg-[#003b95]/10 rounded-xl flex items-center justify-center border border-[#003b95]/20">
                <WalletIcon size={18} className="text-[#003b95]" />
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">Total Balance (Est. USD)</p>
                <h2 className="text-2xl font-bold text-[#1d1d1f]" data-testid="wallet-balance">
                  {formatCurrency(totalBalanceUSD, 'USD')}
                </h2>
                <div className="flex items-center gap-2 text-[#003b95] text-sm font-semibold mt-1">
                  <TrendingUp size={14} />
                  <span>+12.5% this month</span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-start lg:justify-end">
                <button
                  onClick={() => navigate('/wallet/topup')}
                  data-testid="topup-btn"
                  disabled={!runtimeConfig.features.walletTopupEnabled}
                  className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200 inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={16} /> Top Up
                </button>
                <button
                  onClick={() => navigate('/wallet/transfer')}
                  data-testid="transfer-btn"
                  className="border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors inline-flex items-center gap-2"
                >
                  <ArrowLeftRight size={16} /> Transfer
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-6 relative z-20 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
              My Accounts
            </h3>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => (
              <div
                key={account.currency}
                className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 p-5"
              >
                <div className="flex justify-between items-start mb-3 gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-gray-700 border border-gray-100">
                    <span className="text-sm font-bold">{account.currency}</span>
                  </div>
                  <button
                    className="text-gray-400 hover:text-gray-700 transition-colors p-2 rounded-lg hover:bg-gray-50"
                  >
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                <div>
                  <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-1">{account.currency} Wallet</p>
                  <h3 className="text-xl font-bold text-[#1d1d1f]">
                    {formatCurrency(account.currentBalance, account.currency)}
                  </h3>
                </div>
              </div>
            ))}

            {/* Add New Account Mock */}
            <button
              className="bg-white border border-dashed border-gray-200 rounded-xl flex flex-col items-center justify-center gap-2 text-gray-400 hover:border-[#003b95]/30 hover:bg-[#003b95]/5 transition-all min-h-[120px] px-4 py-2 text-sm font-semibold"
            >
              <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center border border-gray-100">
                <Plus size={16} className="text-gray-500" />
              </div>
              <span className="text-xs font-semibold">Open New Account</span>
            </button>
          </div>

          {/* Recent Transactions */}
          <div
            className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden"
            data-testid="transaction-list"
          >
            <div className="p-5 border-b border-gray-100 flex items-center justify-between gap-2">
              <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                Recent Transactions
              </h3>
              <button
                className="text-xs font-semibold text-gray-600 hover:text-[#003b95] transition-colors px-3 py-1.5 rounded-lg hover:bg-gray-50"
                data-testid="wallet-transactions"
              >
                View All
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/70">
                  <tr>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Transaction
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-4 text-[11px] font-bold text-gray-500 uppercase tracking-wider text-right">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {txs.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              tx.type === 'topup'
                                ? 'bg-[#003b95]/10 text-[#003b95]'
                                : tx.type === 'spend'
                                  ? 'bg-gray-100 text-gray-600'
                                  : tx.type === 'transfer'
                                    ? 'bg-gray-100 text-gray-600'
                                    : 'bg-gray-100 text-gray-500'
                            }`}
                          >
                            {tx.type === 'topup' && <ArrowUpRight size={16} />}
                            {tx.type === 'spend' && <CreditCard size={16} />}
                            {tx.type === 'transfer' && <ArrowLeftRight size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#1d1d1f]">
                              {tx.description || tx.type}
                            </p>
                            <p className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                              {tx.id}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-sm font-semibold text-gray-600">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-5">
                        <span className="px-3 py-1 bg-[#003b95]/10 text-[#003b95] border border-[#003b95]/20 rounded-full text-[11px] font-bold uppercase tracking-wider">
                          {tx.status}
                        </span>
                      </td>
                      <td
                        className={`px-6 py-5 text-right font-bold text-sm ${
                          tx.type === 'topup' ? 'text-[#003b95]' : 'text-[#1d1d1f]'
                        }`}
                      >
                        {tx.type === 'topup' ? '+' : '-'}
                        {formatCurrency(tx.amount, tx.currency)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </TripLogerLayout>
  );
}

export default Wallet;
