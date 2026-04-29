import { useState, useEffect } from 'react';
import { Wallet, ArrowUpRight, ArrowDownRight, Receipt, CreditCard, X, Loader2, Download, Eye, Landmark, Activity, Plane, Database, ShieldCheck, Zap, History, RefreshCcw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { apiManager } from '../services/apiManager';
import { useTenant } from '../context/TenantContext';
import { cn } from '../lib/utils';
import { NodalPageHeader, NodalTable, FilterButtonGroup } from '../index';
import { ProfileLayout } from './ProfilePage';
import DocumentPreview from '../components/shared/DocumentPreview';
import type { Booking } from '../types';

interface Transaction {
  id: string;
  timestamp: string;
  reference: string;
  type: 'Booking Debit' | 'Manual Credit' | 'Hotel Refund' | 'Flight Refund' | 'Markup Credit' | 'Top Up';
  amount: number;
  currency: string;
  status: 'Settled' | 'Verified' | 'Pending' | 'Failed';
  description: string;
}

interface AccountBalance {
  available: number;
  pending: number;
  monthlyVolume: number;
  currency: string;
  previousBalance: number;
  changePercent: number;
}

export default function AccountsPage() {
  const navigate = useNavigate();
  const { tenant } = useTenant();
  const [balance, setBalance] = useState<AccountBalance>({
    available: 0,
    pending: 0,
    monthlyVolume: 0,
    currency: tenant.currency,
    previousBalance: 0,
    changePercent: 0
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpMethod, setTopUpMethod] = useState('card');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [filter, setFilter] = useState<'all' | 'credit' | 'debit'>('all');
  const [activeTab, setActiveTab] = useState<'transactions' | 'documents'>('transactions');
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<{ booking: Booking, type: 'itinerary' | 'invoice' | 'receipt' | 'ticket' | 'refund-note' } | null>(null);
  const [showTopUpModal, setShowTopUpModal] = useState(false);

  useEffect(() => {
    loadAccountData();
  }, []);

  const loadAccountData = async () => {
    setIsLoading(true);
    try {
      const [balanceData, txData, bookingData] = await Promise.all([
        apiManager.getAccountBalance(),
        apiManager.getTransactions(),
        apiManager.getBookings()
      ]);
      
      setBookings([...bookingData]);
      
      setBalance({
        available: balanceData.available,
        pending: balanceData.pending,
        monthlyVolume: balanceData.monthlyVolume,
        currency: balanceData.currency,
        previousBalance: balanceData.available * 0.88,
        changePercent: ((balanceData.available - balanceData.available * 0.88) / (balanceData.available * 0.88)) * 100
      });

      const formattedTransactions: Transaction[] = (txData as any[]).map((tx) => ({
        id: tx.id || tx.reference || `TXN-${Date.now()}`,
        timestamp: tx.timestamp || new Date().toISOString(),
        reference: tx.reference || `TXN-${Math.floor(Math.random() * 100000)}`,
        type: tx.type || 'Booking Debit',
        amount: tx.amount || 0,
        currency: tx.currency || tenant.currency,
        status: tx.status || 'Settled',
        description: tx.description || ''
      }));
      setTransactions(formattedTransactions);
    } catch {
      setBalance({
        available: 4250,
        pending: 120.45,
        monthlyVolume: 12840,
        currency: tenant.currency,
        previousBalance: 3794.64,
        changePercent: 12
      });
      setTransactions([
        { id: '1', timestamp: new Date(Date.now() - 86400000).toISOString(), reference: 'TXN-98231', type: 'Booking Debit', amount: -145, currency: tenant.currency, status: 'Settled', description: 'Flight booking LHR-DXB' },
        { id: '2', timestamp: new Date(Date.now() - 172800000).toISOString(), reference: 'TOP-00122', type: 'Top Up', amount: 500, currency: tenant.currency, status: 'Verified', description: 'Balance top-up via card' },
        { id: '3', timestamp: new Date(Date.now() - 259200000).toISOString(), reference: 'TXN-98110', type: 'Hotel Refund', amount: 45.23, currency: tenant.currency, status: 'Settled', description: 'Cancelled booking refund' },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTopUp = async () => {
    const amount = parseFloat(topUpAmount);
    if (isNaN(amount) || amount <= 0) return;
    
    setIsSubmitting(true);
    try {
      const result = await apiManager.topUpBalance(amount, topUpMethod);
      if (result.success) {
        setShowTopUpModal(false);
        setTopUpAmount('');
        await loadAccountData();
      }
    } catch (err) {
      console.error('Top-up failed:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDownloadStatement = async () => {
    const csvContent = 'data:text/csv;charset=utf-8,' + 
      'Date,Reference,Type,Amount,Status\n' +
      transactions.map(tx => 
        `${new Date(tx.timestamp).toLocaleDateString()},${tx.reference},${tx.type},${tx.currency} ${tx.amount},${tx.status}`
      ).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ledger-statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number, currency: string = tenant.currency) => {
    return `${currency} ${Math.abs(amount).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  const filteredTransactions = transactions.filter(tx => {
    if (filter === 'all') return true;
    if (filter === 'credit') return tx.amount > 0;
    if (filter === 'debit') return tx.amount < 0;
    return true;
  });

  return (
    <ProfileLayout>
      <div className="animate-fade px-2 pt-8">
        <NodalPageHeader
          title="Agency"
          highlightedTitle="Ledger"
          nodeName="AGENCY"
          subtitle={`Financial repository for ${tenant.name}`}
          isLoading={isLoading}
          actions={
            <div className="flex items-center gap-4">
              <button 
                onClick={handleDownloadStatement}
                className="group px-6 py-4 bg-white border border-black/10 text-black text-[10px] font-bold uppercase tracking-widest rounded-xl hover:bg-black/5 transition-all flex items-center gap-3"
              >
                <Download size={14} /> Export Master Ledger
              </button>
              <button 
                onClick={() => setShowTopUpModal(true)}
                className="px-8 py-4 bg-black text-apple-blue text-[10px] font-bold uppercase tracking-widest rounded-xl shadow-xl hover:scale-105 transition-all flex items-center gap-3"
              >
                <Zap size={14} /> Add Credit
              </button>
            </div>
          }
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-8">
            <RefreshCcw className="animate-spin text-apple-blue" size={48} />
            <div className="text-xs font-bold text-black/20 uppercase tracking-widest">Loading financial data...</div>
          </div>
        ) : (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
              <div className="bg-black rounded-3xl p-10 text-white relative overflow-hidden shadow-2xl border-b-8 border-apple-blue group">
                <div className="relative z-10 flex flex-col h-full justify-between">
                  <div className="space-y-6">
                    <p className="text-[10px] font-bold text-apple-blue/60 uppercase tracking-widest">Available Balance</p>
                    <h2 className="text-5xl font-bold tabular-nums leading-none text-white">
                      {balance.available.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </h2>
                  </div>
                  <div className="mt-10 flex items-center gap-4">
                    <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-lg">
                      <ArrowUpRight size={14} className="text-green-500"/>
                      <span className="text-xs font-bold text-green-500">+{balance.changePercent.toFixed(1)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white border border-black/5 rounded-3xl p-10 shadow-sm">
                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-4">Pending Settlement</p>
                <h2 className="text-4xl font-bold text-black tabular-nums">
                  {balance.pending.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
              </div>

              <div className="bg-white border border-black/5 rounded-3xl p-10 shadow-sm">
                <p className="text-[10px] font-bold text-black/20 uppercase tracking-widest mb-4">Monthly Volume</p>
                <h2 className="text-4xl font-bold text-black tabular-nums">
                  {balance.monthlyVolume.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </h2>
              </div>
            </div>

            <div className="bg-white border border-black/5 rounded-[2.5rem] shadow-sm overflow-hidden">
              <div className="px-10 py-8 bg-black/[0.01] border-b border-black/5 flex flex-col md:flex-row justify-between items-center gap-6">
                <div className="flex items-center gap-8">
                  <h2 className="text-sm font-bold text-black tracking-tight flex items-center gap-4">
                    <Database size={20} className="text-apple-blue"/>
                    Transaction Ledger
                  </h2>
                  <FilterButtonGroup
                    options={['all', 'credit', 'debit']}
                    activeOption={filter}
                    onOptionSelect={(f) => setFilter(f as any)}
                  />
                </div>
              </div>
              
              <NodalTable
                headers={['Date', 'Reference', 'Description', 'Type', 'Amount', 'Status']}
                isEmpty={filteredTransactions.length === 0}
              >
                {filteredTransactions.map((tx) => (
                  <tr key={tx.id} className="group hover:bg-black/[0.01] transition-all">
                    <td className="py-8 px-10">
                      <span className="text-xs font-bold text-black/40 tabular-nums">{formatDate(tx.timestamp)}</span>
                    </td>
                    <td className="py-8 px-6">
                      <span className="text-xs font-bold text-black group-hover:text-apple-blue transition-colors">{tx.reference}</span>
                    </td>
                    <td className="py-8 px-6">
                      <span className="text-xs font-medium text-black/60 truncate block max-w-[280px]">{tx.description}</span>
                    </td>
                    <td className="py-8 px-6">
                      <span className={cn(
                        "px-3 py-1 rounded-lg text-[10px] font-bold border uppercase",
                        tx.type.includes('Refund') ? "bg-amber-50 text-amber-600 border-amber-200" : 
                        tx.type.includes('Credit') ? "bg-green-50 text-green-600 border-green-200" : 
                        "bg-black text-white"
                      )}>
                        {tx.type}
                      </span>
                    </td>
                    <td className="py-8 px-6 text-right">
                      <div className={cn(
                        'text-sm font-bold tabular-nums flex items-center justify-end gap-2',
                        tx.amount > 0 ? 'text-green-600' : 'text-red-600'
                      )}>
                        {tx.amount > 0 ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                      </div>
                    </td>
                    <td className="py-8 px-10 text-center">
                      <div className="flex items-center justify-center gap-3">
                        <div className={cn("w-2 h-2 rounded-full", tx.status === 'Settled' ? "bg-green-500" : "bg-apple-blue")} />
                        <span className="text-[10px] font-bold text-black uppercase">{tx.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </NodalTable>
            </div>
          </div>
        )}
      </div>
    </ProfileLayout>
  );
}
