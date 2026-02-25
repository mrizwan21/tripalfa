import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWallets, listWalletTransactions } from '../lib/api';
import { WalletAccount } from '../lib/srs-types';
import { formatCurrency } from '@tripalfa/ui-components';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { DEMO_CONFIG } from '../lib/constants/theme';
import { Wallet as WalletIcon, ArrowUpRight, ArrowLeftRight, History, CreditCard, TrendingUp, Download, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '../components/ui/button';

type Tx = {
  id: string;
  type: 'topup' | 'spend' | 'refund' | 'transfer';
  currency: string;
  amount: number;
  date: string;
  status: string;
  description?: string;
};

export default function Wallet(): React.JSX.Element {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<WalletAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [txs, setTxs] = useState<Tx[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchWallets(),
      listWalletTransactions()
    ])
      .then(([accountsRes, txsRes]) => {
        // Use fetched accounts or fallback to default USD wallet for demo/testing
        const fetchedAccounts = accountsRes || [];
        
        // Only show fallback wallet in demo mode
        if (fetchedAccounts.length === 0 && DEMO_CONFIG.enabled) {
          setAccounts([{
            id: 'default-usd-wallet',
            currency: DEMO_CONFIG.defaultCurrency,
            currentBalance: DEMO_CONFIG.defaultWalletBalance,
            pendingBalance: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }]);
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
          setAccounts([{
            id: 'default-usd-wallet',
            currency: DEMO_CONFIG.defaultCurrency,
            currentBalance: DEMO_CONFIG.defaultWalletBalance,
            pendingBalance: 0,
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }]);
        } else {
          setAccounts([]);
        }
        setTxs([]);
      })
      .finally(() => setLoading(false));
  }, []);

  const totalBalanceUSD = useMemo(() => {
    // Mock conversion to USD for total display
    const rates: Record<string, number> = { USD: 1, EUR: 1.18, GBP: 1.39, AED: 0.27 };
    return accounts.reduce((acc, a) => acc + (a.currentBalance * (rates[a.currency] || 1)), 0);
  }, [accounts]);

  return (
    <TripLogerLayout>
      <div className="min-h-screen bg-slate-50 pb-20 font-sans">
        {/* Header - Clean White Style */}
        <div className="bg-white border-b border-slate-200 pt-8 pb-16 relative overflow-hidden">
          <div className="container mx-auto px-4 relative z-10">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight mb-1">My Wallet</h1>
                <p className="text-slate-500 text-sm">Manage your funds & transactions</p>
              </div>
              <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center border border-purple-100">
                <WalletIcon size={18} className="text-purple-600" />
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-1">
                <p className="text-xs text-slate-500">Total Balance (Est. USD)</p>
                <h2 className="text-3xl font-semibold" data-testid="wallet-balance">{formatCurrency(totalBalanceUSD, 'USD')}</h2>
                <div className="flex items-center gap-2 text-green-600 text-xs font-medium mt-1">
                  <TrendingUp size={14} />
                  <span>+12.5% this month</span>
                </div>
              </div>

              <div className="flex items-center gap-3 justify-start lg:justify-end">
                <Button
                  onClick={() => navigate('/wallet/topup')}
                  data-testid="topup-btn"
                  className={`h-10 px-6 ${DEMO_CONFIG.enabled ? 'bg-[#152467]' : 'bg-purple-600'} hover:bg-purple-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all`}
                >
                  <Plus size={16} /> Top Up
                </Button>
                <Button
                  onClick={() => navigate('/wallet/transfer')}
                  data-testid="transfer-btn"
                  className="h-10 px-6 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-sm font-medium border border-slate-200 transition-all"
                >
                  <ArrowLeftRight size={16} /> Transfer
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-6 relative z-20 space-y-6">
          {/* Section Header */}
          <div className="flex items-center justify-between">
            <h3 className="text-base font-semibold text-slate-900">My Accounts</h3>
          </div>

          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {accounts.map(account => (
              <div key={account.currency} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
                <div className="flex justify-between items-start mb-3">
                  <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center text-slate-600 group-hover:bg-purple-50 group-hover:text-purple-600 transition-colors">
                    <span className="text-sm font-medium">{account.currency}</span>
                  </div>
                  <button className="text-slate-400 hover:text-slate-600 transition-colors">
                    <MoreHorizontal size={16} />
                  </button>
                </div>
                <div>
                  <p className="text-xs text-slate-500 mb-1">{account.currency} Wallet</p>
                  <h3 className="text-xl font-semibold text-slate-900">{formatCurrency(account.currentBalance, account.currency)}</h3>
                </div>
              </div>
            ))}

            {/* Add New Account Mock */}
            <button className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl flex flex-col items-center justify-center gap-2 text-slate-400 hover:border-purple-400 hover:text-purple-600 hover:bg-purple-50/30 transition-all min-h-[120px]">
              <div className="w-8 h-8 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Plus size={16} />
              </div>
              <span className="text-xs font-medium">Open New Account</span>
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden" data-testid="transaction-list">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-base font-medium text-slate-900">Recent Transactions</h3>
              <button className="text-xs font-medium text-purple-600 hover:text-purple-700 transition-colors" data-testid="wallet-transactions">View All</button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50/50">
                  <tr>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Transaction</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                    <th className="px-8 py-4 text-[9px] font-black text-gray-400 uppercase tracking-widest text-right">Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {txs.map(tx => (
                    <tr key={tx.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${tx.type === 'topup' ? 'bg-green-50 text-green-600' :
                            tx.type === 'spend' ? 'bg-blue-50 text-blue-600' :
                              tx.type === 'transfer' ? 'bg-purple-50 text-purple-600' :
                                'bg-gray-50 text-gray-500'
                            }`}>
                            {tx.type === 'topup' && <ArrowUpRight size={16} />}
                            {tx.type === 'spend' && <CreditCard size={16} />}
                            {tx.type === 'transfer' && <ArrowLeftRight size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-gray-900">{tx.description || tx.type}</p>
                            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{tx.id}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-500">
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-3 py-1 bg-green-50 text-green-600 border border-green-100 rounded-full text-[9px] font-black uppercase tracking-widest">
                          {tx.status}
                        </span>
                      </td>
                      <td className={`px-8 py-6 text-right font-black text-sm ${tx.type === 'topup' ? 'text-green-600' : 'text-gray-900'
                        }`}>
                        {tx.type === 'topup' ? '+' : '-'}{formatCurrency(tx.amount, tx.currency)}
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