import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchWallets, listWalletTransactions } from '../lib/api';
import { WalletAccount } from '../lib/srs-types';
import { formatCurrency } from '../lib/utils';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Wallet as WalletIcon, ArrowUpRight, ArrowLeftRight, History, CreditCard, TrendingUp, Download, MoreHorizontal, Plus } from 'lucide-react';
import { Button } from '../components/ui/Button';

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
        setAccounts(accountsRes || []);
        setTxs(txsRes || []);
      })
      .catch(() => {
        setAccounts([]);
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
      <div className="min-h-screen bg-[#F8F9FA] pb-20 font-sans">
        {/* Elite Header with Gradient */}
        <div className="bg-[#111827] text-white pt-12 pb-32 rounded-b-[3rem] relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-purple-900/40 rounded-full blur-3xl pointer-events-none -translate-y-1/2 translate-x-1/4" />

          <div className="container mx-auto px-4 relative z-10">
            <div className="flex justify-between items-start mb-12">
              <div>
                <h1 className="text-3xl font-black tracking-tight mb-2">My Wallet</h1>
                <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Manage your funds & transactions</p>
              </div>
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-sm border border-white/10">
                <WalletIcon size={20} className="text-[#8B5CF6]" />
              </div>
            </div>

            {/* Total Balance Card */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <div className="space-y-2">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Total Balance (Est. USD)</p>
                <h2 className="text-5xl font-black tracking-tighter">{formatCurrency(totalBalanceUSD, 'USD')}</h2>
                <div className="flex items-center gap-2 text-green-400 text-xs font-bold mt-2">
                  <TrendingUp size={14} />
                  <span>+12.5% this month</span>
                </div>
              </div>

              <div className="flex items-center gap-4 justify-start lg:justify-end">
                <Button
                  onClick={() => navigate('/wallet/topup')}
                  className="h-14 px-8 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-[10px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                >
                  <Plus size={16} /> Top Up
                </Button>
                <Button
                  onClick={() => navigate('/wallet/transfer')}
                  className="h-14 px-8 bg-white/10 hover:bg-white/20 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest backdrop-blur-md border border-white/10 transition-all hover:-translate-y-1 active:scale-95 flex items-center gap-3"
                >
                  <ArrowLeftRight size={16} /> Transfer
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 -mt-20 relative z-20 space-y-8">
          {/* Accounts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map(account => (
              <div key={account.currency} className="bg-white p-6 rounded-[2rem] shadow-xl shadow-gray-200/50 border border-gray-100 hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-12 h-12 bg-gray-50 rounded-2xl flex items-center justify-center text-gray-400 group-hover:bg-purple-50 group-hover:text-[#8B5CF6] transition-colors">
                    <span className="text-sm font-black">{account.currency}</span>
                  </div>
                  <button className="text-gray-300 hover:text-gray-600 transition-colors">
                    <MoreHorizontal size={20} />
                  </button>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{account.currency} Wallet</p>
                  <h3 className="text-2xl font-black text-gray-900 tracking-tight">{formatCurrency(account.currentBalance, account.currency)}</h3>
                </div>
              </div>
            ))}

            {/* Add New Account Mock */}
            <button className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-[2rem] flex flex-col items-center justify-center gap-4 text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6] hover:bg-purple-50/30 transition-all min-h-[180px]">
              <div className="w-12 h-12 bg-white rounded-full shadow-sm flex items-center justify-center">
                <Plus size={20} />
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest">Open New Account</span>
            </button>
          </div>

          {/* Recent Transactions */}
          <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-sm overflow-hidden">
            <div className="p-8 border-b border-gray-50 flex items-center justify-between">
              <h3 className="text-lg font-black text-gray-900 tracking-tight">Recent Transactions</h3>
              <button className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-widest hover:text-[#7C3AED] transition-colors">View All</button>
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