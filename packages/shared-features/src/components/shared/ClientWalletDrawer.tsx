import { useState, useEffect } from 'react';
import { X, ArrowUpRight, ArrowDownRight, Landmark, CreditCard, Banknote, History, Brain, ChevronRight, Wallet } from 'lucide-react';
import { cn, apiManager } from '../../index';
import { CreditEligibilityPanel } from './CreditEligibilityPanel';
import type { WalletClient, WalletTransaction, CreditFacility } from '../../types';

interface ClientWalletDrawerProps {
 isOpen: boolean;
 client: WalletClient | null;
 onClose: () => void;
 onTopUp?: () => void;
}

const METHOD_ICON: Record<string, React.ReactNode> = {
 OpenBanking: <Landmark size={12} />,
 Card: <CreditCard size={12} />,
 Cash: <Banknote size={12} />,
 WalletBalance: <Wallet size={12} />,
};

const CATEGORY_COLOR: Record<string, string> = {
 'Top-Up': 'bg-apple-blue/10 text-apple-blue border-apple-blue/20',
 'Service Payment': 'bg-pure-black text-white border-navy',
 'Credit Draw': 'bg-purple-50 text-purple-700 border-purple-200',
 'Credit Repayment': 'bg-sky-50 text-sky-700 border-sky-200',
 'Bulk Payout': 'bg-amber-50 text-amber-700 border-amber-200',
 'Refund': 'bg-teal-50 text-teal-700 border-teal-200',
 'Interest Charge': 'bg-rose-50 text-rose-700 border-rose-200',
 'Fee': 'bg-light-gray text-pure-black border-slate-200',
 'Adjustment': 'bg-light-gray text-pure-black/60 border-slate-200',
};

type DrawerTab = 'ledger' | 'credit' | 'ai-score';

export default function ClientWalletDrawer({ isOpen, client, onClose, onTopUp }: ClientWalletDrawerProps) {
 const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
 const [facility, setFacility] = useState<CreditFacility | null>(null);
 const [isLoading, setIsLoading] = useState(true);
 const [activeTab, setActiveTab] = useState<DrawerTab>('ledger');

 useEffect(() => {
 if (!client || !isOpen) return;
 setIsLoading(true);
 setActiveTab('ledger');
 Promise.all([
 apiManager.getWalletTransactions(client.id),
 apiManager.getClientCreditFacility(client.id),
 ]).then(([txs, fac]) => {
 setTransactions(txs);
 setFacility(fac);
 }).catch(() => {}).finally(() => setIsLoading(false));
 }, [client, isOpen]);

 const formatBHD = (n: number) => `BHD ${n.toLocaleString(undefined, { minimumFractionDigits: 3 })}`;
 const formatDate = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });

 if (!client) return null;

 const statusColor: Record<string, string> = {
 Active: 'bg-apple-blue/10 text-apple-blue border border-apple-blue/20',
 Restricted: 'bg-amber-50 text-amber-700 border border-amber-200',
 Frozen: 'bg-rose-50 text-rose-700 border border-rose-200',
 'Pending KYC': 'bg-light-gray text-pure-black/50 border border-slate-200',
 };

  const utilizationPct = (client.creditLimit || 0) > 0 ? ((client.creditUsed || 0) / (client.creditLimit || 0)) * 100 : 0;

 return (
 <>
 {/* Overlay */}
 <div
 className={cn('fixed inset-0 bg-pure-black/50 backdrop-blur-sm z-[150] transition-opacity duration-300', isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none')}
 onClick={onClose}
 />
 {/* Drawer */}
 <div className={cn(
 'fixed top-0 right-0 h-full w-full max-w-xl bg-white z-[160] shadow-[−40px_0_80px_rgba(0,0,0,0.2)] transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] flex flex-col',
 isOpen ? 'translate-x-0' : 'translate-x-full'
 )}>
 {/* Header */}
 <div className="p-8 border-b border-black/5 shrink-0">
 <div className="flex items-start justify-between mb-6">
 <div>
 <h3 className="text-xl font-semibold text-pure-black">{client.clientName}</h3>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight mt-1">{client.clientCode} · {client.clientType}</p>
 </div>
 <div className="flex items-center gap-3">
  <span className={cn('px-3 py-1 rounded-full text-[9px] font-semibold', client.status ? statusColor[client.status] : 'bg-light-gray')}>
 {client.status}
 </span>
 <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-light-gray transition-colors text-pure-black/20 hover:text-pure-black">
 <X size={18} />
 </button>
 </div>
 </div>

 {/* Balances */}
 <div className="grid grid-cols-2 gap-4 mb-6">
 <div className="p-5 bg-pure-black rounded-xl">
 <p className="text-[8px] font-semibold text-white/30 tracking-tight mb-1">WALLET BALANCE</p>
 <p className="text-xl font-semibold text-white tabular-nums">{formatBHD(client.walletBalance || 0)}</p>
 {client.pendingBalance !== undefined && client.pendingBalance > 0 && <p className="text-[9px] text-white/30 mt-0.5">+ {formatBHD(client.pendingBalance || 0)} pending</p>}
 </div>
 <div className={cn('p-5 rounded-xl', client.creditEnabled ? 'bg-purple-50 border border-purple-100' : 'bg-light-gray border border-black/5')}>
 <p className="text-[8px] font-semibold text-pure-black/30 tracking-tight mb-1">CREDIT AVAILABLE</p>
 <p className={cn('text-xl font-semibold tabular-nums', client.creditEnabled ? 'text-purple-700' : 'text-pure-black/20')}>
 {client.creditEnabled ? formatBHD(client.creditAvailable || 0) : '—'}
 </p>
 {client.creditEnabled && <p className="text-[9px] text-purple-400 mt-0.5">of {formatBHD(client.creditLimit || 0)}</p>}
 </div>
 </div>

 {/* Credit utilization bar */}
 {client.creditEnabled && (
 <div className="mb-4">
 <div className="flex justify-between text-[9px] font-semibold text-pure-black/30 mb-1.5">
 <span>Credit Utilization</span>
 <span className={cn(utilizationPct > 80 ? 'text-rose-500' : 'text-pure-black/40')}>{utilizationPct.toFixed(0)}%</span>
 </div>
 <div className="h-2 w-full bg-light-gray rounded-full overflow-hidden">
 <div
 className={cn('h-full rounded-full transition-all duration-700', utilizationPct > 80 ? 'bg-rose-500' : utilizationPct > 50 ? 'bg-amber-400' : 'bg-purple-500')}
 style={{ width: `${Math.min(utilizationPct, 100)}%` }}
 />
 </div>
 </div>
 )}

 {/* Quick Action */}
 <button
 onClick={onTopUp}
 className="w-full py-3 bg-pure-black text-apple-blue rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95"
 >
 Top Up Wallet <ChevronRight size={14} />
 </button>
 </div>

 {/* Tabs */}
 <div className="flex items-center gap-2 px-8 py-4 border-b border-black/5 shrink-0 bg-light-gray/50">
 {([
 { id: 'ledger' as DrawerTab, label: 'Ledger', icon: <History size={12} /> },
 { id: 'credit' as DrawerTab, label: 'Credit Facility', icon: <Wallet size={12} /> },
 { id: 'ai-score' as DrawerTab, label: 'AI Score', icon: <Brain size={12} /> },
 ]).map(tab => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id)}
 className={cn(
 'px-4 py-2 rounded-xl text-[10px] font-semibold flex items-center gap-1.5 transition-all',
 activeTab === tab.id ? 'bg-pure-black text-apple-blue shadow-sm' : 'text-pure-black/40 hover:text-pure-black hover:bg-white'
 )}
 >
 {tab.icon} {tab.label}
 </button>
 ))}
 </div>

 {/* Content */}
 <div className="flex-1 overflow-y-auto p-8">
 {isLoading ? (
 <div className="flex items-center justify-center py-12 gap-3">
 <div className="w-5 h-5 border-2 border-apple-blue border-t-transparent rounded-full animate-spin" />
 <span className="text-[10px] font-semibold text-pure-black/30 tracking-tight">Loading...</span>
 </div>
 ) : (
 <>
 {/* Ledger Tab */}
 {activeTab === 'ledger' && (
 <div className="space-y-3">
 {transactions.length === 0 ? (
 <div className="flex flex-col items-center gap-4 py-12">
 <History size={32} className="text-pure-black/10" />
 <p className="text-[11px] font-semibold text-pure-black/30">No transactions yet</p>
 </div>
 ) : transactions.map(tx => (
 <div key={tx.id} className="flex items-start gap-4 p-4 bg-light-gray rounded-xl hover:bg-light-gray transition-colors group">
 <div className={cn('w-9 h-9 rounded-xl flex items-center justify-center shrink-0', tx.type === 'Credit' ? 'bg-apple-blue/10 text-apple-blue' : 'bg-rose-50 text-rose-600')}>
 {tx.type === 'Credit' ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
 </div>
 <div className="flex-1 min-w-0">
 <div className="flex items-start justify-between gap-2">
 <p className="text-[11px] font-semibold text-pure-black leading-tight truncate">{tx.description}</p>
 <span className={cn('text-[12px] font-semibold tabular-nums shrink-0', tx.type === 'Credit' ? 'text-apple-blue' : 'text-rose-600')}>
 {tx.type === 'Credit' ? '+' : '−'}{formatBHD(tx.amount)}
 </span>
 </div>
 <div className="flex items-center gap-2 mt-1.5 flex-wrap">
 <span className="text-[9px] font-semibold text-pure-black/30">{formatDate(tx.date)}</span>
 <span className={cn('px-2 py-0.5 rounded-full text-[8px] font-semibold border', CATEGORY_COLOR[tx.category] ?? 'bg-light-gray text-pure-black border-slate-200')}>
 {tx.category}
 </span>
 <span className="flex items-center gap-1 text-[8px] font-semibold text-pure-black/20">
 {METHOD_ICON[tx.method]} {tx.method}
 </span>
 </div>
 <div className="flex items-center justify-between mt-1">
 <span className="text-[9px] font-mono text-pure-black/20">{tx.reference}</span>
 <span className="text-[9px] font-semibold text-pure-black/20">Bal: {formatBHD(tx.runningBalance)}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 )}

 {/* Credit Facility Tab */}
 {activeTab === 'credit' && (
 <div className="space-y-4">
 {!client.creditEnabled || !facility ? (
 <div className="flex flex-col items-center gap-4 py-12 text-center">
 <Wallet size={32} className="text-pure-black/10" />
 <p className="text-[11px] font-semibold text-pure-black/30">No credit facility active</p>
 <p className="text-[10px] font-semibold text-pure-black/20">This client has not been approved for a credit line. Check the AI Score tab for eligibility.</p>
 </div>
 ) : (
 <>
 <div className="p-6 bg-purple-50 border border-purple-200 rounded-xl">
 <p className="text-[9px] font-semibold text-purple-400 tracking-tight mb-4">CREDIT FACILITY SUMMARY</p>
 {[
 { label: 'Deposit Held', value: formatBHD(facility.depositAmount) },
 { label: 'Credit Limit', value: formatBHD(facility.creditLimit) },
 { label: 'Ratio', value: `1 : ${(facility.creditLimit / facility.depositAmount).toFixed(1)}` },
 { label: 'Used', value: formatBHD(facility.creditUsed) },
 { label: 'Available', value: formatBHD(facility.creditAvailable) },
 { label: 'APR', value: `${facility.apr}%` },
 { label: 'Grace Period', value: `${facility.gracePeriodDays} days` },
 ].map(r => (
 <div key={r.label} className="flex justify-between items-center py-2 border-b border-purple-100 last:border-0">
 <span className="text-[10px] font-semibold text-purple-600/60">{r.label}</span>
 <span className="text-[12px] font-semibold text-purple-800">{r.value}</span>
 </div>
 ))}
 </div>
 {facility.repaymentDueDate && (
 <div className={cn('p-4 rounded-xl border flex items-start gap-3', new Date(facility.repaymentDueDate) < new Date() ? 'bg-rose-50 border-rose-200' : 'bg-amber-50 border-amber-200')}>
 <div className="shrink-0">
 <div className={cn('w-2 h-2 rounded-full mt-1.5', new Date(facility.repaymentDueDate) < new Date() ? 'bg-rose-500 animate-pulse' : 'bg-amber-500')} />
 </div>
 <div>
 <p className={cn('text-[11px] font-semibold', new Date(facility.repaymentDueDate) < new Date() ? 'text-rose-700' : 'text-amber-700')}>
 {new Date(facility.repaymentDueDate) < new Date() ? 'Repayment OVERDUE' : 'Repayment Due'}
 </p>
 <p className="text-[9px] font-semibold text-pure-black/30 mt-0.5">
 {new Date(facility.repaymentDueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
 {facility.outstandingInterest && facility.outstandingInterest > 0 ? ` · Interest: BHD ${facility.outstandingInterest.toFixed(3)}` : ''}
 </p>
 </div>
 </div>
 )}
 <div className="flex items-center gap-3 p-4 bg-light-gray rounded-xl">
 <div className={cn('w-8 h-8 rounded-full flex items-center justify-center', facility.autoRepayEnabled ? 'bg-apple-blue/10' : 'bg-slate-200')}>
 <div className={cn('w-3 h-3 rounded-full', facility.autoRepayEnabled ? 'bg-emerald-500' : 'bg-slate-400')} />
 </div>
 <div>
 <p className="text-[11px] font-semibold text-pure-black">Auto-Repayment</p>
 <p className="text-[9px] font-semibold text-pure-black/30">{facility.autoRepayEnabled ? 'Enabled — repayment linked to bank account' : 'Disabled'}</p>
 </div>
 </div>
 </>
 )}
 </div>
 )}

 {/* AI Score Tab */}
 {activeTab === 'ai-score' && (
 <CreditEligibilityPanel client={client} adminMode={true} />
 )}
 </>
 )}
 </div>
 </div>
 </>
 );
}
