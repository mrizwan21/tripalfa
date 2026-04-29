import { useState, useEffect, useCallback, useMemo } from 'react';
import { ProfileLayout } from './ProfilePage';
import {
  Wallet, Users, CreditCard, Landmark, Plus, Search, ArrowUpRight, ArrowDownRight,
  RefreshCcw, Download, SendHorizonal, Brain, ShieldCheck, AlertCircle, CheckCircle2,
  ToggleLeft, ToggleRight, Trash2, Activity, TrendingUp, FileText, Calendar,
  X, CheckCircle, XCircle, Clock, Banknote, Receipt, ShieldAlert
} from 'lucide-react';
import { cn, useTenant, NodalTable, ClientWalletDrawer, apiManager, NodalPageHeader, FilterButtonGroup } from '../index';
import WalletTopUpModal from '../components/shared/WalletTopUpModal';
import BulkPayoutModal from '../components/shared/BulkPayoutModal';
import OpenBankingConsentModal from '../components/shared/OpenBankingConsentModal';
import type { WalletClient, WalletAnalytics, OpenBankingConsent, BulkPayout, WalletTransaction, Booking } from '../types';

type WalletTab = 'overview' | 'clients' | 'credit' | 'openbanking' | 'statement' | 'payment-queue' | 'auth-queue';

const TIER_CONFIG: Record<string, string> = {
  Elite: 'bg-amber-50 text-amber-700 border-amber-200',
  Premium: 'bg-purple-50 text-purple-700 border-purple-200',
  Preferred: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
  Standard: 'bg-light-gray text-pure-black/50 border-slate-200',
};

const STATUS_CONFIG: Record<string, string> = {
  Active: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
  Restricted: 'bg-amber-50 text-amber-700 border-amber-200',
  Frozen: 'bg-rose-50 text-rose-700 border-rose-200',
  'Pending KYC': 'bg-light-gray text-pure-black/50 border-slate-200',
};

const OB_STATUS_CONFIG: Record<string, string> = {
  Active: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
  Expired: 'bg-amber-50 text-amber-700 border-amber-200',
  Revoked: 'bg-rose-50 text-rose-700 border-rose-200',
  Pending: 'bg-light-gray text-pure-black/50 border-slate-200',
};

const TX_STATUS_CONFIG: Record<string, string> = {
  Settled: 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
  Pending: 'bg-amber-50 text-amber-700 border-amber-200',
  Failed: 'bg-rose-50 text-rose-700 border-rose-200',
  Reversed: 'bg-light-gray text-pure-black/50 border-slate-200',
};

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function MiniSparkline({ data, color = '#0071e3' }: { data: number[]; color?: string }) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const w = 120;
  const h = 32;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`).join(' ');
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-8">
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" opacity="0.7" />
      <circle cx={(data.length - 1) / (data.length - 1) * w} cy={h - ((data[data.length - 1] - min) / range) * h} r="2.5" fill={color} />
    </svg>
  );
}

export default function WalletPage() {
  const { tenant } = useTenant();
  const [activeTab, setActiveTab] = useState<WalletTab>('overview');
  const [isLoading, setIsLoading] = useState(true);
  const [clients, setClients] = useState<WalletClient[]>([]);
  const [analytics, setAnalytics] = useState<WalletAnalytics | null>(null);
  const [consents, setConsents] = useState<OpenBankingConsent[]>([]);
  const [bulkPayouts, setBulkPayouts] = useState<BulkPayout[]>([]);
  const [search, setSearch] = useState('');
  const [clientFilter, setClientFilter] = useState<'all' | 'Corporate' | 'Sub-Agent'>('all');
  const [selectedClient, setSelectedClient] = useState<WalletClient | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [topUpDefaultClientId, setTopUpDefaultClientId] = useState<string | undefined>();
  const [bulkPayoutOpen, setBulkPayoutOpen] = useState(false);
  const [obConsentClient, setObConsentClient] = useState<WalletClient | null>(null);
  const [obConsentOpen, setObConsentOpen] = useState(false);
  const [revokeId, setRevokeId] = useState<string | null>(null);
  const [creditFilter, setCreditFilter] = useState<'all' | 'eligible' | 'not-eligible' | 'at-risk'>('all');

  // Statement tab state
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [statementFilters, setStatementFilters] = useState({
    dateFrom: '',
    dateTo: '',
    category: 'all' as 'all' | WalletTransaction['category'],
    type: 'all' as 'all' | 'Credit' | 'Debit',
    status: 'all' as 'all' | WalletTransaction['status'],
  });
  const [statementSearch, setStatementSearch] = useState('');

  // Payment queue state
  const [pendingPayments, setPendingPayments] = useState<any[]>([]);
  const [partPayments, setPartPayments] = useState<any[]>([]);
  const [refundDue, setRefundDue] = useState<any[]>([]);

  // Auth queue state
  const [provisionalQueue, setProvisionalQueue] = useState<Booking[]>([]);
  const [authProcessingIds, setAuthProcessingIds] = useState<string[]>([]);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [c, a, ob, bp] = await Promise.all([
        apiManager.getWalletClients(),
        apiManager.getWalletAnalytics(),
        apiManager.getOpenBankingConsents(),
        apiManager.getBulkPayouts(),
      ]);
      setClients(c);
      setAnalytics(a);
      setConsents(ob);
      setBulkPayouts(bp);
    } catch {
      // Silently handled by mocks in apiManager
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStatement = useCallback(async () => {
    try {
      const data = await apiManager.getWalletTransactions();
      setTransactions(data);
    } catch {
      setTransactions([]);
    }
  }, []);

  const loadPaymentQueue = useCallback(async () => {
    try {
      const [pending, part, refund] = await Promise.all([
        apiManager.getPendingPaymentsQueue(),
        apiManager.getPartPaymentQueue(),
        apiManager.getRefundDueQueue(),
      ]);
      setPendingPayments(pending);
      setPartPayments(part);
      setRefundDue(refund);
    } catch {
      setPendingPayments([]);
      setPartPayments([]);
      setRefundDue([]);
    }
  }, []);

  const loadAuthQueue = useCallback(async () => {
    try {
      const data = await apiManager.getProvisionalQueue();
      setProvisionalQueue(data);
    } catch {
      setProvisionalQueue([]);
    }
  }, []);

  const clearStatementFilters = () => {
    setStatementFilters({
      dateFrom: '',
      dateTo: '',
      category: 'all',
      type: 'all',
      status: 'all',
    });
    setStatementSearch('');
  };

  useEffect(() => { loadData(); }, [loadData]);

  useEffect(() => {
    if (activeTab === 'statement') loadStatement();
    if (activeTab === 'payment-queue') loadPaymentQueue();
    if (activeTab === 'auth-queue') loadAuthQueue();
  }, [activeTab, loadStatement, loadPaymentQueue, loadAuthQueue]);

  const openDrawer = (client: WalletClient) => {
    setSelectedClient(client);
    setDrawerOpen(true);
  };

  const openTopUp = (clientId?: string) => {
    setTopUpDefaultClientId(clientId);
    setTopUpOpen(true);
  };

  const handleRevokeConsent = async (id: string) => {
    setRevokeId(id);
    try {
      await apiManager.revokeOpenBankingConsent(id);
      setConsents(prev => prev.map(c => c.id === id ? { ...c, status: 'Revoked' as const } : c));
    } catch { /* noop */ } finally {
      setRevokeId(null);
    }
  };

  const filteredClients = clients.filter(c => {
    const matchSearch = !search || (c.clientName || '').toLowerCase().includes(search.toLowerCase()) || (c.clientCode || '').toLowerCase().includes(search.toLowerCase());
    const matchType = clientFilter === 'all' || c.clientType === clientFilter;
    return matchSearch && matchType;
  });

  const filteredCreditClients = clients.filter(c => {
    if (creditFilter === 'eligible') return c.creditEnabled && (c.creditAvailable || 0) > 0;
    if (creditFilter === 'not-eligible') return !c.creditEnabled;
    if (creditFilter === 'at-risk') return c.creditEnabled && (c.creditUsed || 0) / (c.creditLimit || 1) > 0.8;
    return true;
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchSearch = !statementSearch ||
        tx.description.toLowerCase().includes(statementSearch.toLowerCase()) ||
        tx.reference.toLowerCase().includes(statementSearch.toLowerCase()) ||
        tx.clientName.toLowerCase().includes(statementSearch.toLowerCase());
      const matchCategory = statementFilters.category === 'all' || tx.category === statementFilters.category;
      const matchType = statementFilters.type === 'all' || tx.type === statementFilters.type;
      const matchStatus = statementFilters.status === 'all' || tx.status === statementFilters.status;
      const matchDateFrom = !statementFilters.dateFrom || new Date(tx.date) >= new Date(statementFilters.dateFrom);
      const matchDateTo = !statementFilters.dateTo || new Date(tx.date) <= new Date(statementFilters.dateTo + 'T23:59:59');
      return matchSearch && matchCategory && matchType && matchStatus && matchDateFrom && matchDateTo;
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, statementFilters, statementSearch]);

  const handleAuthorize = async (bookingId: string) => {
    setAuthProcessingIds(prev => [...prev, bookingId]);
    try {
      await apiManager.bulkAuthorizeBookings([bookingId]);
      setProvisionalQueue(prev => prev.filter(b => b.id !== bookingId));
    } catch { /* noop */ } finally {
      setAuthProcessingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  const handleReject = async (bookingId: string) => {
    setAuthProcessingIds(prev => [...prev, bookingId]);
    try {
      // Reject by updating authorizationStatus locally (no explicit reject API, simulate)
      setProvisionalQueue(prev => prev.filter(b => b.id !== bookingId));
    } catch { /* noop */ } finally {
      setAuthProcessingIds(prev => prev.filter(id => id !== bookingId));
    }
  };

  const exportStatement = () => {
    const headers = ['Date', 'Description', 'Reference', 'Category', 'Type', 'Method', 'Amount', 'Running Balance', 'Status', 'Client'];
    const rows = filteredTransactions.map(tx => [
      new Date(tx.date).toLocaleDateString('en-GB'),
      tx.description,
      tx.reference,
      tx.category,
      tx.type,
      tx.method,
      tx.amount.toString(),
      tx.runningBalance.toString(),
      tx.status,
      tx.clientName,
    ]);
    const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `wallet-statement-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatBHD = (n: number) => `BHD ${n.toLocaleString(undefined, { minimumFractionDigits: 3 })}`;

  const tabs: { id: WalletTab; label: string; icon: React.ReactNode }[] = [
    { id: 'overview', label: 'Overview', icon: <Activity size={14} /> },
    { id: 'clients', label: 'Client Wallets', icon: <Users size={14} /> },
    { id: 'credit', label: 'Credit Facility', icon: <CreditCard size={14} /> },
    { id: 'openbanking', label: 'OpenBanking', icon: <Landmark size={14} /> },
    { id: 'statement', label: 'Statement', icon: <FileText size={14} /> },
    { id: 'payment-queue', label: 'Payment Queue', icon: <Banknote size={14} /> },
    { id: 'auth-queue', label: 'Authorization', icon: <ShieldCheck size={14} /> },
  ];

  const renderPaymentQueueTable = (data: any[], title: string, icon: React.ReactNode, emptyMsg: string) => (
    <div className="bg-white border border-navy/5 rounded-[2rem] overflow-hidden shadow-sm mb-8">
      <div className="px-10 py-6 bg-light-gray/50 border-b border-navy/5 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-pure-black flex items-center gap-3">
          {icon} {title}
        </h3>
        <span className="text-[10px] font-semibold text-pure-black/20 font-mono">COUNT: {data.length}</span>
      </div>
      <div className="overflow-x-auto">
        <NodalTable
          headers={['Booking Ref', 'Passenger', 'Amount', 'Status', 'Actions']}
          isEmpty={data.length === 0}
          emptyState={
            <div className="flex flex-col items-center gap-4">
              <CheckCircle2 size={32} className="text-pure-black/10" />
              <p className="text-[11px] font-semibold text-pure-black/30">{emptyMsg}</p>
            </div>
          }
        >
          {data.map((item: any) => (
            <tr key={item.id || item.referenceNo || Math.random()} className="group hover:bg-light-gray transition-all duration-200">
              <td className="py-5 px-10">
                <p className="text-[12px] font-semibold text-pure-black font-mono">{item.referenceNo || item.bookingRef || '—'}</p>
                <p className="text-[9px] text-pure-black/30">{item.service || item.type || ''}</p>
              </td>
              <td className="py-5 px-6">
                <p className="text-[12px] font-semibold text-pure-black">{item.passengerName || item.passenger || '—'}</p>
              </td>
              <td className="py-5 px-6">
                <p className="text-[13px] font-semibold text-pure-black tabular-nums">
                  {item.amount !== undefined ? formatBHD(Number(item.amount)) : '—'}
                </p>
                <p className="text-[9px] text-pure-black/30">{item.currency || 'BHD'}</p>
              </td>
              <td className="py-5 px-6">
                <span className={cn(
                  'px-3 py-1.5 rounded-full text-[9px] font-semibold border',
                  item.status === 'Pending' || item.paymentHoldStatus === 'Pending' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                  item.status === 'Payment Due' || item.status === 'Awaiting Confirmation' ? 'bg-rose-50 text-rose-700 border-rose-200' :
                  item.status === 'Confirmed' || item.status === 'Paid' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' :
                  'bg-light-gray text-pure-black/50 border-slate-200'
                )}>
                  {item.status || item.paymentHoldStatus || 'Pending'}
                </span>
              </td>
              <td className="py-5 px-10 text-center">
                <div className="flex items-center justify-center gap-2">
                  <button className="px-3 py-1.5 bg-apple-blue/10 text-apple-blue rounded-xl text-[9px] font-semibold hover:bg-apple-blue hover:text-white transition-all">
                    Process
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </NodalTable>
      </div>
    </div>
  );

  return (
    <ProfileLayout>
      <div className="animate-fade px-2">
        <NodalPageHeader
          title="B2B"
          highlightedTitle="Wallet Hub"
          nodeName="WALLET"
          tenantName={tenant.name}
          isLoading={isLoading}
          actions={
            <>
              <button
                onClick={() => setBulkPayoutOpen(true)}
                className="group px-6 py-4 bg-white border border-navy/10 text-pure-black text-[10px] font-semibold tracking-tight rounded-xl hover:bg-light-gray transition-all flex items-center gap-3 shadow-sm"
              >
                <SendHorizonal size={14} className="group-hover:translate-x-1 transition-transform" /> Bulk Payout
              </button>
              <button
                onClick={() => openTopUp()}
                className="px-8 py-4 bg-pure-black text-apple-blue text-[10px] font-semibold tracking-tight rounded-xl shadow-sm hover:bg-black transition-all flex items-center gap-3"
              >
                <Plus size={14} /> Top-Up Wallet
              </button>
            </>
          }
        />

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-48 gap-8">
            <RefreshCcw className="animate-spin text-apple-blue" size={48} />
            <div className="text-[11px] font-semibold text-pure-black tracking-tight animate-pulse">Loading wallet data...</div>
          </div>
        ) : (
          <>
            {/* Tab bar */}
            <div className="flex items-center gap-2 mb-10 bg-light-gray/50 p-2 rounded-xl w-fit border border-navy/5 overflow-x-auto">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    'px-8 py-4 text-[11px] font-semibold tracking-tight rounded-xl transition-all duration-300 flex items-center gap-2 whitespace-nowrap',
                    activeTab === tab.id ? 'bg-pure-black text-apple-blue shadow-sm' : 'text-pure-black/30 hover:text-pure-black/60 hover:bg-white'
                  )}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </div>

            {/* ===== OVERVIEW TAB ===== */}
            {activeTab === 'overview' && analytics && (
              <div className="space-y-10">
                {/* Hero KPI Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                  {/* Total Wallet Volume */}
                  <div className="bg-pure-black rounded-xl p-8 text-white relative overflow-hidden shadow-sm group col-span-1 md:col-span-2">
                    <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 group-hover:rotate-12 transition-transform duration-1000">
                      <Wallet size={160} />
                    </div>
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-apple-blue/10 rounded-full -ml-20 -mb-20 blur-3xl" />
                    <div className="relative z-10">
                      <div className="px-4 py-1.5 bg-white/5 border border-white/10 rounded-xl text-[9px] font-semibold text-apple-blue tracking-tight w-fit mb-6">
                        Total Wallet Volume
                      </div>
                      <p className="text-[10px] font-semibold text-white/30 tracking-tight">{analytics.currency} UNIT</p>
                      <h2 className="text-5xl font-semibold tabular-nums leading-none text-white group-hover:text-apple-blue transition-all mt-2">
                        {(analytics.totalWalletVolume || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}
                      </h2>
                      <div className="mt-6 h-8">
                        <MiniSparkline data={analytics.monthlyVolume || []} color="#0071e3" />
                      </div>
                    </div>
                  </div>

                  {/* Credit Extended */}
                  <div className="bg-white border border-navy/5 rounded-xl p-8 shadow-sm relative overflow-hidden group">
                    <div className="absolute bottom-0 right-0 w-32 h-32 bg-purple-500/5 rounded-full blur-3xl" />
                    <div className="relative z-10 h-full flex flex-col justify-between">
                      <div>
                        <div className="w-10 h-10 bg-purple-50 border border-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4">
                          <CreditCard size={18} />
                        </div>
                        <p className="text-[9px] font-semibold text-pure-black/30 tracking-tight mb-1">CREDIT EXTENDED</p>
                        <h3 className="text-3xl font-semibold text-pure-black tabular-nums">{formatBHD(analytics.totalCreditExtended || 0)}</h3>
                      </div>
                      <div className="mt-6">
                        <div className="flex justify-between text-[9px] font-semibold text-pure-black/30 mb-1.5">
                          <span>Utilization</span>
                           <span className={cn((analytics.avgUtilizationPct || 0) > 80 ? 'text-rose-500' : 'text-pure-black/50')}>{(analytics.avgUtilizationPct || 0).toFixed(1)}%</span>
                        </div>
                        <div className="h-1.5 w-full bg-light-gray rounded-full overflow-hidden">
                           <div className={cn('h-full rounded-full transition-all duration-700', (analytics.avgUtilizationPct || 0) > 80 ? 'bg-rose-400' : 'bg-purple-500')} style={{ width: `${analytics.avgUtilizationPct || 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Client Status */}
                  <div className="bg-white border border-navy/5 rounded-xl p-8 shadow-sm">
                    <div className="w-10 h-10 bg-apple-blue/5 border border-apple-blue/10 rounded-xl flex items-center justify-center text-apple-blue mb-4">
                      <Users size={18} />
                    </div>
                    <p className="text-[9px] font-semibold text-pure-black/30 tracking-tight mb-1">ACTIVE CLIENTS</p>
                    <h3 className="text-5xl font-semibold text-pure-black tabular-nums">{analytics.activeClients}</h3>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-[9px] font-semibold">
                        <span className="text-amber-600">At Risk</span>
                        <span className="text-pure-black">{analytics.atRiskClients}</span>
                      </div>
                      <div className="flex justify-between text-[9px] font-semibold">
                        <span className="text-rose-500">Frozen</span>
                        <span className="text-pure-black">{analytics.frozenClients}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Volume Chart */}
                <div className="bg-white border border-navy/5 rounded-xl p-10 shadow-sm">
                  <div className="flex items-center justify-between mb-8">
                    <h3 className="text-sm font-semibold text-pure-black flex items-center gap-3">
                      <TrendingUp size={18} className="text-apple-blue" />
                      12-Month Wallet Volume
                    </h3>
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2"><div className="w-3 h-1.5 bg-apple-blue rounded-full" /><span className="text-[9px] font-semibold text-pure-black/40">Volume</span></div>
                      <div className="flex items-center gap-2"><div className="w-3 h-1.5 bg-emerald-400 rounded-full" /><span className="text-[9px] font-semibold text-pure-black/40">Top-Ups</span></div>
                    </div>
                  </div>
                  <div className="flex items-end gap-2 h-32">
                    {(analytics.monthlyVolume || []).map((v, i) => {
                      const max = Math.max(...(analytics.monthlyVolume || [1]));
                      const tu = (analytics.topUpVolume || [])[i] || 0;
                      return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1 group">
                          <div className="w-full flex flex-col-reverse gap-0.5" style={{ height: '96px' }}>
                            <div className="w-full bg-apple-blue/90 rounded-t-lg transition-all duration-700" style={{ height: `${(v / max) * 80}px` }} />
                            <div className="w-full bg-emerald-300 rounded-t-sm" style={{ height: `${(tu / max) * 80}px` }} />
                          </div>
                          <span className="text-[7px] font-semibold text-pure-black/20">{MONTHS[i]}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Recent Bulk Payouts */}
                <div className="bg-white border border-navy/5 rounded-xl overflow-hidden shadow-sm">
                  <div className="px-10 py-6 bg-light-gray/50 border-b border-navy/5 flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-pure-black flex items-center gap-3">
                      <SendHorizonal size={16} className="text-apple-blue" /> Recent Bulk Payouts
                    </h3>
                    <button onClick={() => setBulkPayoutOpen(true)} className="text-[10px] font-semibold text-apple-blue flex items-center gap-1.5 hover:underline">
                      New Payout <ArrowUpRight size={12} />
                    </button>
                  </div>
                  <div className="divide-y divide-slate-50">
                    {bulkPayouts.map(bp => (
                      <div key={bp.id} className="px-10 py-5 flex items-center justify-between hover:bg-light-gray transition-colors group">
                        <div>
                          <p className="text-[12px] font-semibold text-pure-black">{bp.title}</p>
                          <p className="text-[9px] font-semibold text-pure-black/30 mt-0.5">{bp.type} · {bp.lineItems.length} payees · {new Date(bp.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[13px] font-semibold text-pure-black tabular-nums">{formatBHD(bp.totalAmount)}</p>
                          <span className={cn('text-[9px] font-semibold px-2 py-0.5 rounded-full border', bp.status === 'Completed' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' : bp.status === 'Processing' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' : 'bg-light-gray text-pure-black/40 border-slate-200')}>
                            {bp.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ===== CLIENT WALLETS TAB ===== */}
            {activeTab === 'clients' && (
              <div className="space-y-6">
                <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
                  <div className="flex items-center gap-3 p-2 bg-light-gray/50 rounded-xl border border-navy/5">
                    <FilterButtonGroup
                      options={['all', 'Corporate', 'Sub-Agent']}
                      activeOption={clientFilter}
                       onOptionSelect={(v: string) => setClientFilter(v as typeof clientFilter)}
                    />
                  </div>
                  <div className="relative">
                    <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-pure-black/20" />
                    <input
                      type="text"
                      placeholder="Search clients..."
                      value={search}
                      onChange={e => setSearch(e.target.value)}
                      className="pl-10 pr-6 py-3 bg-white border border-navy/10 rounded-xl text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors w-64 shadow-sm"
                    />
                  </div>
                </div>

                <div className="bg-white border border-navy/5 rounded-[3.5rem] overflow-hidden shadow-sm">
                  <div className="px-10 py-6 bg-light-gray/50 border-b border-navy/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-pure-black flex items-center gap-3">
                      <Users size={16} className="text-apple-blue" /> Corporate Wallet Clients
                    </h3>
                    <span className="text-[10px] font-semibold text-pure-black/20 font-mono">RECORDS: {filteredClients.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <NodalTable
                      headers={['Client', <span key="t" className="block text-center">Tier</span>, 'Wallet Balance', 'Credit Available', <span key="u">Utilization</span>, <span key="s" className="block text-center">Status</span>, <span key="a" className="block text-center">Actions</span>]}
                      isEmpty={filteredClients.length === 0}
                      emptyState={
                        <div className="flex flex-col items-center gap-4">
                          <Users size={32} className="text-pure-black/10" />
                          <p className="text-[11px] font-semibold text-pure-black/30">No clients found</p>
                        </div>
                      }
                    >
                      {filteredClients.map(client => {
                        const utilPct = (client.creditLimit || 0) > 0 ? ((client.creditUsed || 0) / (client.creditLimit || 0)) * 100 : 0;
                        return (
                          <tr key={client.id} className="group hover:bg-light-gray transition-all duration-200">
                            <td className="py-6 px-10">
                              <div>
                                <p className="text-[12px] font-semibold text-pure-black group-hover:text-apple-blue transition-colors">{client.clientName}</p>
                                <p className="text-[9px] font-semibold text-pure-black/30 mt-0.5">{client.clientCode} · {client.contactName}</p>
                              </div>
                            </td>
                            <td className="py-6 px-4 text-center">
                               <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-semibold border', TIER_CONFIG[client.tier || 'Standard'])}>
                                {client.tier}
                              </span>
                            </td>
                            <td className="py-6 px-6">
                              <div>
                                 <p className="text-[13px] font-semibold text-pure-black tabular-nums">{formatBHD(client.walletBalance || 0)}</p>
                                 {(client.pendingBalance || 0) > 0 && <p className="text-[9px] text-pure-black/30">{formatBHD(client.pendingBalance || 0)} pending</p>}
                              </div>
                            </td>
                            <td className="py-6 px-6">
                              {client.creditEnabled ? (
                                <div>
                                   <p className="text-[12px] font-semibold text-purple-700 tabular-nums">{formatBHD(client.creditAvailable || 0)}</p>
                                   <p className="text-[9px] text-pure-black/30">of {formatBHD(client.creditLimit || 0)}</p>
                                </div>
                              ) : <span className="text-[11px] text-pure-black/20">—</span>}
                            </td>
                            <td className="py-6 px-6 min-w-[120px]">
                              {client.creditEnabled ? (
                                <div>
                                  <div className="flex justify-between text-[9px] font-semibold text-pure-black/30 mb-1">
                                    <span>{utilPct.toFixed(0)}%</span>
                                  </div>
                                  <div className="h-1.5 w-full bg-light-gray rounded-full overflow-hidden">
                                    <div className={cn('h-full rounded-full', utilPct > 80 ? 'bg-rose-500' : utilPct > 50 ? 'bg-amber-400' : 'bg-purple-500')} style={{ width: `${Math.min(utilPct, 100)}%` }} />
                                  </div>
                                </div>
                              ) : <span className="text-[9px] text-pure-black/20">No Credit</span>}
                            </td>
                            <td className="py-6 px-4 text-center">
                               <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-semibold border', STATUS_CONFIG[client.status || 'Active'])}>
                                {client.status}
                              </span>
                            </td>
                            <td className="py-6 px-10 text-center">
                              <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                <button
                                  onClick={() => { openTopUp(client.id); }}
                                  className="px-3 py-1.5 bg-apple-blue/10 text-apple-blue rounded-xl text-[9px] font-semibold hover:bg-apple-blue hover:text-white transition-all"
                                >
                                  Top-Up
                                </button>
                                <button
                                  onClick={() => openDrawer(client)}
                                  className="px-3 py-1.5 bg-pure-black text-apple-blue rounded-xl text-[9px] font-semibold hover:bg-black transition-all"
                                >
                                  Manage
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </NodalTable>
                  </div>
                  <div className="px-10 py-6 bg-light-gray/50 border-t border-navy/5 flex items-center gap-3">
                    <ShieldCheck size={16} className="text-apple-blue" />
                    <p className="text-[9px] font-semibold text-pure-black/30 tracking-tight">All wallet operations are KYC/AML verified · PCI DSS compliant · CBB regulated</p>
                  </div>
                </div>
              </div>
            )}

            {/* ===== CREDIT FACILITY TAB ===== */}
            {activeTab === 'credit' && (
              <div className="space-y-6">
                <div className="flex items-center gap-3 p-2 bg-light-gray/50 rounded-xl border border-navy/5 w-fit">
                  <FilterButtonGroup
                    options={['all', 'eligible', 'not-eligible', 'at-risk']}
                    activeOption={creditFilter}
                     onOptionSelect={(v: string) => setCreditFilter(v as typeof creditFilter)}
                  />
                </div>

                {/* Credit summary cards */}
                {analytics && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-2">
                    {[
                      { label: 'Total Credit Extended', value: formatBHD(analytics.totalCreditExtended || 0), color: 'bg-purple-50 border-purple-200', textColor: 'text-purple-700', icon: <CreditCard size={16} className="text-purple-500" /> },
                      { label: 'Total Credit In Use', value: formatBHD(analytics.totalCreditUsed || 0), color: 'bg-amber-50 border-amber-200', textColor: 'text-amber-700', icon: <Activity size={16} className="text-amber-500" /> },
                      { label: 'At-Risk Clients', value: String(analytics.atRiskClients || 0), color: (analytics.atRiskClients || 0) > 0 ? 'bg-rose-50 border-rose-200' : 'bg-apple-blue/10 border-apple-blue/20', textColor: (analytics.atRiskClients || 0) > 0 ? 'text-rose-700' : 'text-apple-blue', icon: (analytics.atRiskClients || 0) > 0 ? <AlertCircle size={16} className="text-rose-500" /> : <CheckCircle2 size={16} className="text-apple-blue" /> },
                    ].map(card => (
                      <div key={card.label} className={cn('p-6 rounded-xl border', card.color)}>
                        <div className="flex items-center gap-2 mb-3">{card.icon}<p className="text-[9px] font-semibold text-pure-black/40 tracking-tight">{card.label}</p></div>
                        <p className={cn('text-3xl font-semibold tabular-nums', card.textColor)}>{card.value}</p>
                      </div>
                    ))}
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {filteredCreditClients.map(client => {
                    const utilPct = (client.creditLimit || 0) > 0 ? ((client.creditUsed || 0) / (client.creditLimit || 0)) * 100 : 0;
                    const isAtRisk = utilPct > 80;
                    const isOverdue = client.status === 'Restricted';
                    return (
                      <div
                        key={client.id}
                        className={cn(
                          'bg-white border rounded-xl p-8 shadow-sm transition-all hover:shadow-md cursor-pointer group',
                          isAtRisk ? 'border-rose-200' : isOverdue ? 'border-amber-200' : 'border-navy/5'
                        )}
                        onClick={() => openDrawer(client)}
                      >
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <p className="text-[14px] font-semibold text-pure-black group-hover:text-apple-blue transition-colors">{client.clientName}</p>
                            <p className="text-[9px] font-semibold text-pure-black/30 mt-0.5">{client.clientCode} · Loyalty Score: {client.loyaltyScore}/100</p>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-semibold border', client.creditEnabled ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' : 'bg-light-gray text-pure-black/40 border-slate-200')}>
                              {client.creditEnabled ? '✓ Credit Active' : '✗ No Credit'}
                            </span>
                            {isAtRisk && <span className="px-3 py-1 rounded-full text-[8px] font-semibold bg-rose-50 text-rose-600 border border-rose-200 flex items-center gap-1"><AlertCircle size={10} /> At Risk</span>}
                          </div>
                        </div>

                        {client.creditEnabled ? (
                          <>
                            <div className="grid grid-cols-3 gap-4 mb-5">
                              {[
                                { label: 'Limit', value: formatBHD(client.creditLimit || 0) },
                                { label: 'Used', value: formatBHD(client.creditUsed || 0) },
                                { label: 'Available', value: formatBHD(client.creditAvailable || 0) },
                              ].map(r => (
                                <div key={r.label}>
                                  <p className="text-[8px] font-semibold text-pure-black/30 mb-0.5">{r.label}</p>
                                  <p className="text-[11px] font-semibold text-pure-black tabular-nums">{r.value}</p>
                                </div>
                              ))}
                            </div>
                            <div>
                              <div className="flex justify-between text-[9px] font-semibold text-pure-black/30 mb-1.5">
                                <span>Utilization</span>
                                <span className={cn(isAtRisk ? 'text-rose-500' : '')}>{utilPct.toFixed(0)}%</span>
                              </div>
                              <div className="h-2 w-full bg-light-gray rounded-full overflow-hidden">
                                <div className={cn('h-full rounded-full', isAtRisk ? 'bg-rose-500' : utilPct > 50 ? 'bg-amber-400' : 'bg-purple-500')} style={{ width: `${Math.min(utilPct, 100)}%` }} />
                              </div>
                            </div>
                          </>
                        ) : (
                          <div className="flex items-center gap-3 p-4 bg-light-gray rounded-xl">
                            <Brain size={16} className="text-pure-black/20" />
                            <p className="text-[10px] font-semibold text-pure-black/30">Click to view AI eligibility score and apply for credit facility</p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ===== OPENBANKING TAB ===== */}
            {activeTab === 'openbanking' && (
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="p-4 bg-apple-blue/5 border border-apple-blue/20 rounded-xl flex items-center gap-3 max-w-xl">
                    <ShieldCheck size={16} className="text-apple-blue shrink-0" />
                    <p className="text-[9px] font-semibold text-pure-black/50 leading-relaxed">
                      Powered by Bahrain OpenBanking framework. Compliant with CBB Open Finance Regulation 2024. Consents are revocable at any time by the client.
                    </p>
                  </div>
                  <button
                    onClick={() => { setObConsentClient(clients[0] ?? null); setObConsentOpen(true); }}
                    className="px-6 py-3 bg-pure-black text-apple-blue text-[10px] font-semibold rounded-xl flex items-center gap-2 hover:bg-black transition-all shadow-sm"
                  >
                    <Plus size={14} /> Link Bank Account
                  </button>
                </div>

                <div className="bg-white border border-navy/5 rounded-[3.5rem] overflow-hidden shadow-sm">
                  <div className="px-10 py-6 bg-light-gray/50 border-b border-navy/5">
                    <h3 className="text-sm font-semibold text-pure-black flex items-center gap-3">
                      <Landmark size={16} className="text-apple-blue" /> OpenBanking Consent Registry
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <NodalTable
                      headers={['Client', 'Bank', 'Account', 'Permissions', 'Status', <span key="ex">Expires</span>, <span key="at">Auto Top-Up</span>, <span key="ac" className="block text-center">Actions</span>]}
                      isEmpty={consents.length === 0}
                      emptyState={
                        <div className="flex flex-col items-center gap-4">
                          <Landmark size={32} className="text-pure-black/10" />
                          <p className="text-[11px] font-semibold text-pure-black/30">No bank accounts linked</p>
                        </div>
                      }
                    >
                      {consents.map(consent => (
                        <tr key={consent.id} className="group hover:bg-light-gray transition-all duration-200">
                          <td className="py-6 px-10">
                            <p className="text-[11px] font-semibold text-pure-black">{consent.clientName}</p>
                          </td>
                          <td className="py-6 px-6">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-xl bg-pure-black text-apple-blue flex items-center justify-center text-[7px] font-bold">
                                {consent.bankCode}
                              </div>
                              <div>
                                <p className="text-[11px] font-semibold text-pure-black">{consent.bankName}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-6 px-6">
                            <p className="text-[11px] font-semibold text-pure-black font-mono">{consent.maskedAccountNo}</p>
                            <p className="text-[9px] font-semibold text-pure-black/30">{consent.accountNickname} · {consent.currency}</p>
                          </td>
                          <td className="py-6 px-6">
                            <p className="text-[10px] font-semibold text-pure-black/40">{consent.permissions.length} scope{consent.permissions.length !== 1 ? 's' : ''}</p>
                            <p className="text-[9px] text-pure-black/20 truncate max-w-[140px]">{consent.permissions.join(', ')}</p>
                          </td>
                          <td className="py-6 px-6">
                            <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-semibold border', OB_STATUS_CONFIG[consent.status])}>
                              {consent.status}
                            </span>
                          </td>
                          <td className="py-6 px-6">
                            <p className={cn('text-[10px] font-semibold tabular-nums', new Date(consent.consentExpiresAt) < new Date() ? 'text-rose-500' : 'text-pure-black/60')}>
                              {new Date(consent.consentExpiresAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                            </p>
                          </td>
                          <td className="py-6 px-6">
                            {consent.autoTopUpEnabled ? (
                              <div>
                                <div className="flex items-center gap-1 text-apple-blue">
                                  <ToggleRight size={16} />
                                  <span className="text-[9px] font-semibold">On</span>
                                </div>
                                {consent.autoTopUpThreshold && <p className="text-[8px] text-pure-black/30">≥ BHD {consent.autoTopUpThreshold.toLocaleString()}</p>}
                              </div>
                            ) : (
                              <div className="flex items-center gap-1 text-pure-black/20">
                                <ToggleLeft size={16} />
                                <span className="text-[9px] font-semibold">Off</span>
                              </div>
                            )}
                          </td>
                          <td className="py-6 px-10 text-center">
                            {consent.status !== 'Revoked' && (
                              <button
                                onClick={() => handleRevokeConsent(consent.id)}
                                disabled={revokeId === consent.id}
                                className="opacity-0 group-hover:opacity-100 p-2 rounded-xl hover:bg-rose-50 text-pure-black/20 hover:text-rose-500 transition-all flex items-center justify-center mx-auto"
                                title="Revoke Consent"
                              >
                                {revokeId === consent.id
                                  ? <RefreshCcw size={14} className="animate-spin" />
                                  : <Trash2 size={14} />}
                              </button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </NodalTable>
                  </div>
                  <div className="px-10 py-6 bg-light-gray/50 border-t border-navy/5 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <ShieldCheck size={16} className="text-apple-blue" />
                      <p className="text-[9px] font-semibold text-pure-black/30 tracking-tight">OAuth 2.0 · TLS 1.3 · PDPL Compliant · CBB Open Finance</p>
                    </div>
                    <button onClick={loadData} className="text-pure-black/20 hover:text-apple-blue transition-colors">
                      <Download size={16} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* ===== STATEMENT TAB ===== */}
            {activeTab === 'statement' && (
              <div className="space-y-6">
                {/* Filters Bar */}
                <div className="flex flex-col xl:flex-row gap-4 items-start xl:items-center justify-between">
                  <div className="flex flex-wrap items-center gap-3 p-3 bg-light-gray/50 rounded-xl border border-navy/5">
                    <div className="flex items-center gap-2">
                      <Calendar size={14} className="text-pure-black/20" />
                      <input
                        type="date"
                        value={statementFilters.dateFrom}
                        onChange={e => setStatementFilters(prev => ({ ...prev, dateFrom: e.target.value }))}
                        className="px-3 py-2 bg-white border border-navy/10 rounded-lg text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors"
                      />
                      <span className="text-[10px] text-pure-black/30">to</span>
                      <input
                        type="date"
                        value={statementFilters.dateTo}
                        onChange={e => setStatementFilters(prev => ({ ...prev, dateTo: e.target.value }))}
                        className="px-3 py-2 bg-white border border-navy/10 rounded-lg text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors"
                      />
                    </div>
                    <select
                      value={statementFilters.category}
                      onChange={e => setStatementFilters(prev => ({ ...prev, category: e.target.value as any }))}
                      className="px-3 py-2 bg-white border border-navy/10 rounded-lg text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors"
                    >
                      <option value="all">All Categories</option>
                      <option value="Top-Up">Top-Up</option>
                      <option value="Service Payment">Service Payment</option>
                      <option value="Credit Draw">Credit Draw</option>
                      <option value="Credit Repayment">Credit Repayment</option>
                      <option value="Bulk Payout">Bulk Payout</option>
                      <option value="Refund">Refund</option>
                      <option value="Interest Charge">Interest Charge</option>
                      <option value="Fee">Fee</option>
                      <option value="Adjustment">Adjustment</option>
                    </select>
                    <select
                      value={statementFilters.type}
                      onChange={e => setStatementFilters(prev => ({ ...prev, type: e.target.value as any }))}
                      className="px-3 py-2 bg-white border border-navy/10 rounded-lg text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors"
                    >
                      <option value="all">All Types</option>
                      <option value="Credit">Credit</option>
                      <option value="Debit">Debit</option>
                    </select>
                    <select
                      value={statementFilters.status}
                      onChange={e => setStatementFilters(prev => ({ ...prev, status: e.target.value as any }))}
                      className="px-3 py-2 bg-white border border-navy/10 rounded-lg text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors"
                    >
                      <option value="all">All Statuses</option>
                      <option value="Settled">Settled</option>
                      <option value="Pending">Pending</option>
                      <option value="Failed">Failed</option>
                      <option value="Reversed">Reversed</option>
                    </select>
                    <button
                      onClick={clearStatementFilters}
                      className="p-2 rounded-lg hover:bg-white transition-colors text-pure-black/30"
                      title="Clear filters"
                    >
                      <X size={14} />
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-pure-black/20" />
                      <input
                        type="text"
                        placeholder="Search transactions..."
                        value={statementSearch}
                        onChange={e => setStatementSearch(e.target.value)}
                        className="pl-10 pr-6 py-3 bg-white border border-navy/10 rounded-xl text-[11px] text-pure-black outline-none focus:border-apple-blue transition-colors w-64 shadow-sm"
                      />
                    </div>
                    <button
                      onClick={exportStatement}
                      className="px-4 py-3 bg-pure-black text-apple-blue text-[10px] font-semibold rounded-xl shadow-sm hover:bg-black transition-all flex items-center gap-2"
                    >
                      <Download size={14} /> Export
                    </button>
                  </div>
                </div>

                {/* Statement Table */}
                <div className="bg-white border border-navy/5 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="px-10 py-6 bg-light-gray/50 border-b border-navy/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-pure-black flex items-center gap-3">
                      <Receipt size={16} className="text-apple-blue" /> Wallet Statement
                    </h3>
                    <span className="text-[10px] font-semibold text-pure-black/20 font-mono">TXN_COUNT: {filteredTransactions.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <NodalTable
                      headers={['Date', 'Description', 'Reference', 'Category', 'Type', 'Method', 'Amount', 'Running Balance', 'Status']}
                      isEmpty={filteredTransactions.length === 0}
                      emptyState={
                        <div className="flex flex-col items-center gap-4">
                          <FileText size={32} className="text-pure-black/10" />
                          <p className="text-[11px] font-semibold text-pure-black/30">No transactions match the selected filters</p>
                        </div>
                      }
                    >
                      {filteredTransactions.map(tx => (
                        <tr key={tx.id} className="group hover:bg-light-gray transition-all duration-200">
                          <td className="py-5 px-10">
                            <p className="text-[11px] font-semibold text-pure-black">{new Date(tx.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                            <p className="text-[9px] text-pure-black/30">{new Date(tx.date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' })}</p>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-[12px] font-semibold text-pure-black">{tx.description}</p>
                            <p className="text-[9px] text-pure-black/30">{tx.clientName}</p>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-[11px] font-semibold text-pure-black font-mono">{tx.reference}</p>
                            {tx.bookingRef && <p className="text-[9px] text-pure-black/30">Booking: {tx.bookingRef}</p>}
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[10px] font-semibold text-pure-black/60">{tx.category}</span>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-[9px] font-semibold border',
                              tx.type === 'Credit' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            )}>
                              {tx.type === 'Credit' ? <ArrowDownRight size={10} /> : <ArrowUpRight size={10} />}
                              {tx.type}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="text-[10px] font-semibold text-pure-black/60">{tx.method}</span>
                          </td>
                          <td className="py-5 px-6">
                            <p className={cn('text-[13px] font-semibold tabular-nums', tx.type === 'Credit' ? 'text-emerald-600' : 'text-rose-600')}>
                              {tx.type === 'Credit' ? '+' : '-'}{formatBHD(tx.amount)}
                            </p>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-[12px] font-semibold text-pure-black tabular-nums">{formatBHD(tx.runningBalance)}</p>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn('px-3 py-1.5 rounded-full text-[9px] font-semibold border', TX_STATUS_CONFIG[tx.status])}>
                              {tx.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </NodalTable>
                  </div>
                </div>
              </div>
            )}

            {/* ===== PAYMENT QUEUE TAB ===== */}
            {activeTab === 'payment-queue' && (
              <div className="space-y-6">
                {renderPaymentQueueTable(
                  pendingPayments,
                  'Pending Payments',
                  <Clock size={16} className="text-amber-500" />,
                  'No pending payments in queue'
                )}
                {renderPaymentQueueTable(
                  partPayments,
                  'Part Payments',
                  <Receipt size={16} className="text-apple-blue" />,
                  'No part payments in queue'
                )}
                {renderPaymentQueueTable(
                  refundDue,
                  'Refund Due',
                  <Banknote size={16} className="text-rose-500" />,
                  'No refunds due in queue'
                )}
              </div>
            )}

            {/* ===== AUTHORIZATION QUEUE TAB ===== */}
            {activeTab === 'auth-queue' && (
              <div className="space-y-6">
                <div className="bg-white border border-navy/5 rounded-[2rem] overflow-hidden shadow-sm">
                  <div className="px-10 py-6 bg-light-gray/50 border-b border-navy/5 flex items-center justify-between">
                    <h3 className="text-sm font-semibold text-pure-black flex items-center gap-3">
                      <ShieldAlert size={16} className="text-amber-500" /> Provisional Bookings Awaiting Authorization
                    </h3>
                    <span className="text-[10px] font-semibold text-pure-black/20 font-mono">PENDING_AUTH::{provisionalQueue.length}</span>
                  </div>
                  <div className="overflow-x-auto">
                    <NodalTable
                      headers={['Booking Ref', 'Passenger', 'Service', 'Amount', 'Status', 'Authorization', 'Actions']}
                      isEmpty={provisionalQueue.length === 0}
                      emptyState={
                        <div className="flex flex-col items-center gap-4">
                          <CheckCircle2 size={32} className="text-pure-black/10" />
                          <p className="text-[11px] font-semibold text-pure-black/30">No provisional bookings awaiting authorization</p>
                        </div>
                      }
                    >
                      {provisionalQueue.map(booking => (
                        <tr key={booking.id} className="group hover:bg-light-gray transition-all duration-200">
                          <td className="py-5 px-10">
                            <p className="text-[12px] font-semibold text-pure-black font-mono">{booking.referenceNo}</p>
                            <p className="text-[9px] text-pure-black/30">{booking.route || booking.hotelName || ''}</p>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-[12px] font-semibold text-pure-black">{booking.passengerName}</p>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                              'px-3 py-1.5 rounded-full text-[9px] font-semibold border',
                              booking.service === 'Flight' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' : 'bg-purple-50 text-purple-700 border-purple-200'
                            )}>
                              {booking.service}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <p className="text-[13px] font-semibold text-pure-black tabular-nums">{formatBHD(booking.amount)}</p>
                            <p className="text-[9px] text-pure-black/30">{booking.currency}</p>
                          </td>
                          <td className="py-5 px-6">
                            <span className={cn(
                              'px-3 py-1.5 rounded-full text-[9px] font-semibold border',
                              booking.status === 'Confirmed' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' :
                              booking.status === 'Paid' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' :
                              'bg-amber-50 text-amber-700 border-amber-200'
                            )}>
                              {booking.status}
                            </span>
                          </td>
                          <td className="py-5 px-6">
                            <span className="px-3 py-1.5 rounded-full text-[9px] font-semibold border bg-amber-50 text-amber-700 border-amber-200">
                              {booking.authorizationStatus || 'Provisional'}
                            </span>
                          </td>
                          <td className="py-5 px-10">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleAuthorize(booking.id)}
                                disabled={authProcessingIds.includes(booking.id)}
                                className="px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-[9px] font-semibold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1"
                              >
                                {authProcessingIds.includes(booking.id) ? <RefreshCcw size={10} className="animate-spin" /> : <CheckCircle size={10} />}
                                Authorize
                              </button>
                              <button
                                onClick={() => handleReject(booking.id)}
                                disabled={authProcessingIds.includes(booking.id)}
                                className="px-3 py-1.5 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-[9px] font-semibold hover:bg-rose-600 hover:text-white transition-all flex items-center gap-1"
                              >
                                <XCircle size={10} />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </NodalTable>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Client Wallet Drawer */}
      <ClientWalletDrawer
        isOpen={drawerOpen}
        client={selectedClient}
        onClose={() => setDrawerOpen(false)}
        onTopUp={() => { setDrawerOpen(false); openTopUp(selectedClient?.id); }}
      />

      {/* Top-Up Modal */}
      <WalletTopUpModal
        isOpen={topUpOpen}
        onClose={() => setTopUpOpen(false)}
        clients={clients}
        defaultClientId={topUpDefaultClientId}
        onSuccess={() => loadData()}
      />

      {/* Bulk Payout Modal */}
      <BulkPayoutModal
        isOpen={bulkPayoutOpen}
        onClose={() => setBulkPayoutOpen(false)}
        clients={clients}
        onSuccess={() => loadData()}
      />

      {/* OpenBanking Consent Modal */}
      {obConsentClient && (
        <OpenBankingConsentModal
          isOpen={obConsentOpen}
          onClose={() => setObConsentOpen(false)}
          client={obConsentClient}
          onSuccess={() => { loadData(); setObConsentOpen(false); }}
        />
      )}
    </ProfileLayout>
  );
}
