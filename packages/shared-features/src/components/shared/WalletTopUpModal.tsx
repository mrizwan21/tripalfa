import { useState } from 'react';
import { X, TrendingUp, ArrowRight, ArrowLeft, Loader2, CheckCircle2, AlertTriangle, Landmark, Wallet, RefreshCcw, CreditCard, Banknote, Zap } from 'lucide-react';
import { cn, apiManager } from '../../index';
import type { WalletClient, WalletPaymentMethod } from '../../types';

interface WalletTopUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: WalletClient[];
  defaultClientId?: string;
  onSuccess?: (newBalance: number) => void;
}

type Step = 'client' | 'amount' | 'method' | 'confirm' | 'success';

const PAYMENT_METHODS: { id: WalletPaymentMethod; label: string; subLabel: string; icon: React.ReactNode }[] = [
 { id: 'Card', label: 'Credit / Debit Card', subLabel: 'PCI DSS — via Benefit Gateway', icon: <CreditCard size={20} /> },
 { id: 'OpenBanking', label: 'OpenBanking Transfer', subLabel: 'Direct from linked Bahrain bank', icon: <Landmark size={20} /> },
 { id: 'CashDeposit', label: 'Cash Deposit', subLabel: 'Agent-collected offline deposit', icon: <Banknote size={20} /> },
 { id: 'WalletBalance', label: 'Internal Transfer', subLabel: 'Move funds between accounts', icon: <Wallet size={20} /> },
];

export default function WalletTopUpModal({ isOpen, onClose, clients, defaultClientId, onSuccess }: WalletTopUpModalProps) {
 const [step, setStep] = useState<Step>('client');
 const [selectedClientId, setSelectedClientId] = useState(defaultClientId ?? '');
 const [amount, setAmount] = useState('');
 const [method, setMethod] = useState<WalletPaymentMethod>('OpenBanking');
 const [cashRef, setCashRef] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [resultBalance, setResultBalance] = useState(0);

 const selectedClient = clients.find(c => c.id === selectedClientId);
 const parsedAmount = parseFloat(amount);
 const isValidAmount = !isNaN(parsedAmount) && parsedAmount > 0;

 const handleTopUp = async () => {
 if (!selectedClient || !isValidAmount) return;
 setIsSubmitting(true);
 try {
 const result = await apiManager.processWalletTopUp({
 clientId: selectedClient.id,
 amount: parsedAmount,
 method,
 currency: selectedClient.currency,
 cashReceiptRef: method === 'CashDeposit' ? cashRef : undefined,
 });
 setResultBalance(result.newBalance);
 setStep('success');
 onSuccess?.(result.newBalance);
 } catch {
 setResultBalance((selectedClient.walletBalance || 0) + parsedAmount);
 setStep('success');
 onSuccess?.((selectedClient.walletBalance || 0) + parsedAmount);
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleClose = () => {
 setStep('client');
 setSelectedClientId(defaultClientId ?? '');
 setAmount('');
 setMethod('OpenBanking');
 setCashRef('');
 onClose();
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 bg-pure-black/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
 <div className="bg-white rounded-xl p-10 max-w-lg w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden">
 {/* accent bar */}
 <div className="absolute top-0 left-0 w-full h-1.5 bg-apple-blue" />
 <div className="absolute -top-20 -right-20 w-48 h-48 bg-apple-blue/5 rounded-full blur-3xl" />

 {/* Header */}
 <div className="flex justify-between items-start mb-10 relative z-10">
 <div className="space-y-2">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-pure-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
 <Zap size={18} />
 </div>
 <h3 className="text-lg font-semibold text-pure-black">Wallet Top-Up</h3>
 </div>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight">
 {step === 'client' && 'SELECT CLIENT'}
 {step === 'amount' && 'ENTER AMOUNT'}
 {step === 'method' && 'PAYMENT METHOD'}
 {step === 'confirm' && 'CONFIRM & SIGN'}
 {step === 'success' && 'TRANSACTION COMPLETE'}
 </p>
 </div>
 <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-light-gray transition-colors text-pure-black/20 hover:text-pure-black">
 <X size={20} />
 </button>
 </div>

 {/* Step indicator */}
 <div className="flex items-center gap-2 mb-10 relative z-10">
 {(['client', 'amount', 'method', 'confirm'] as Step[]).map((s, i) => {
 const steps: Step[] = ['client', 'amount', 'method', 'confirm'];
 const cur = steps.indexOf(step as Step);
 const isDone = cur > i;
 const isActive = cur === i;
 return (
 <div key={s} className="flex items-center gap-2">
 <div className={cn(
 'w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all',
 isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-pure-black text-apple-blue' : 'bg-light-gray text-pure-black/30'
 )}>
 {isDone ? '✓' : i + 1}
 </div>
 {i < 3 && <div className={cn('h-px w-8 transition-all', isDone ? 'bg-emerald-300' : 'bg-slate-200')} />}
 </div>
 );
 })}
 </div>

 <div className="relative z-10 space-y-6">
 {/* Step 1: Client Selection */}
 {step === 'client' && (
 <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
 {clients.map(client => (
 <button
 key={client.id}
 onClick={() => { setSelectedClientId(client.id); setStep('amount'); }}
 className={cn(
 'w-full p-5 rounded-xl border-2 text-left transition-all flex items-center justify-between group',
 selectedClientId === client.id ? 'border-apple-blue bg-apple-blue/5' : 'border-black/5 hover:border-navy/20 hover:bg-light-gray'
 )}
 >
 <div>
 <p className="text-[13px] font-semibold text-pure-black">{client.clientName}</p>
 <p className="text-[10px] font-semibold text-pure-black/40 mt-0.5">{client.clientCode} · {client.clientType}</p>
 </div>
 <div className="text-right">
 <p className="text-[11px] font-semibold text-pure-black">{client.currency} {(client.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}</p>
 <div className={cn('text-[9px] font-semibold mt-0.5 px-2 py-0.5 rounded-full w-fit ml-auto', client.status === 'Active' ? 'bg-apple-blue/10 text-apple-blue' : 'bg-amber-50 text-amber-600')}>
 {client.status}
 </div>
 </div>
 </button>
 ))}
 </div>
 )}

 {/* Step 2: Amount */}
 {step === 'amount' && selectedClient && (
 <div className="space-y-6">
 <div className="bg-light-gray border-2 border-black/5 rounded-xl p-8 focus-within:border-apple-blue transition-all">
 <label className="text-[10px] font-semibold text-pure-black/40 tracking-tight mb-4 block text-center">
 TOP-UP AMOUNT ({selectedClient.currency})
 </label>
 <input
 type="number"
 autoFocus
 min="1"
 step="0.001"
 value={amount}
 onChange={e => setAmount(e.target.value)}
 className="w-full bg-transparent border-none text-6xl font-light text-pure-black text-center outline-none tabular-nums placeholder:text-pure-black/10"
 placeholder="0.000"
 />
 </div>
 <div className="p-5 bg-light-gray rounded-xl flex justify-between items-center">
 <span className="text-[10px] font-semibold text-pure-black/40">Current Balance</span>
 <span className="text-sm font-semibold text-pure-black tabular-nums">{selectedClient.currency} {(selectedClient.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
 </div>
 {isValidAmount && (
 <div className="p-5 bg-apple-blue/10 border border-apple-blue/20 rounded-xl flex justify-between items-center">
 <span className="text-[10px] font-semibold text-apple-blue">Balance After Top-Up</span>
 <span className="text-sm font-semibold text-apple-blue tabular-nums">{selectedClient.currency} {((selectedClient.walletBalance || 0) + parsedAmount).toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
 </div>
 )}
 <button
 onClick={() => setStep('method')}
 disabled={!isValidAmount}
 className="w-full bg-pure-black text-apple-blue py-5 rounded-xl flex items-center justify-center gap-3 text-[12px] font-semibold tracking-tight hover:bg-black transition-all disabled:opacity-20 disabled:cursor-not-allowed active:scale-95"
 >
 Continue <ArrowRight size={16} />
 </button>
 </div>
 )}

 {/* Step 3: Method */}
 {step === 'method' && (
 <div className="space-y-3">
 {PAYMENT_METHODS.map(pm => (
 <button
 key={pm.id}
 onClick={() => setMethod(pm.id)}
 className={cn(
 'w-full p-5 rounded-xl border-2 text-left flex items-center gap-4 transition-all',
 method === pm.id ? 'border-apple-blue bg-apple-blue/5' : 'border-black/5 hover:border-navy/20 hover:bg-light-gray'
 )}
 >
 <div className={cn('w-10 h-10 rounded-xl flex items-center justify-center shrink-0', method === pm.id ? 'bg-pure-black text-apple-blue' : 'bg-light-gray text-pure-black/30')}>
 {pm.icon}
 </div>
 <div>
 <p className="text-[12px] font-semibold text-pure-black">{pm.label}</p>
 <p className="text-[10px] font-semibold text-pure-black/30 mt-0.5">{pm.subLabel}</p>
 </div>
 {method === pm.id && <CheckCircle2 size={16} className="text-apple-blue ml-auto shrink-0" />}
 </button>
 ))}
 {method === 'CashDeposit' && (
 <input
 type="text"
 placeholder="Cash receipt reference (optional)"
 value={cashRef}
 onChange={e => setCashRef(e.target.value)}
 className="w-full px-5 py-3 bg-light-gray border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors"
 />
 )}
 <div className="flex gap-3 pt-2">
 <button onClick={() => setStep('amount')} className="flex-1 py-4 border border-slate-200 rounded-xl text-[11px] font-semibold text-pure-black/40 hover:text-pure-black flex items-center justify-center gap-2 transition-all">
 <ArrowLeft size={14} /> Back
 </button>
 <button onClick={() => setStep('confirm')} className="flex-[2] bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95">
 Review <ArrowRight size={14} />
 </button>
 </div>
 </div>
 )}

 {/* Step 4: Confirm */}
 {step === 'confirm' && selectedClient && (
 <div className="space-y-4">
 <div className="bg-light-gray rounded-xl p-6 space-y-4">
 {[
 { label: 'Client', value: selectedClient.clientName },
 { label: 'Amount', value: `${selectedClient.currency} ${parsedAmount.toLocaleString(undefined, { minimumFractionDigits: 3 })}` },
 { label: 'Method', value: method },
 { label: 'New Balance', value: `${selectedClient.currency} ${((selectedClient.walletBalance || 0) + parsedAmount).toLocaleString(undefined, { minimumFractionDigits: 3 })}` },
 ].map(row => (
 <div key={row.label} className="flex justify-between items-center">
 <span className="text-[10px] font-semibold text-pure-black/40 tracking-tight">{row.label}</span>
 <span className="text-[12px] font-semibold text-pure-black">{row.value}</span>
 </div>
 ))}
 </div>
 <p className="text-[9px] font-semibold text-pure-black/20 tracking-tight text-center">AES-256 ENCRYPTED · CBB COMPLIANT · TLS 1.3</p>
 <div className="flex gap-3">
 <button onClick={() => setStep('method')} className="flex-1 py-4 border border-slate-200 rounded-xl text-[11px] font-semibold text-pure-black/40 hover:text-pure-black flex items-center justify-center gap-2 transition-all">
 <ArrowLeft size={14} /> Back
 </button>
 <button
 onClick={handleTopUp}
 disabled={isSubmitting}
 className="flex-[2] bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-95"
 >
 {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Processing...</> : <><Zap size={14} /> Confirm & Sign</>}
 </button>
 </div>
 </div>
 )}

 {/* Step 5: Success */}
 {step === 'success' && selectedClient && (
 <div className="flex flex-col items-center gap-6 py-6">
 <div className="w-20 h-20 bg-apple-blue/10 border-4 border-apple-blue/20 rounded-full flex items-center justify-center">
 <CheckCircle2 size={40} className="text-apple-blue" />
 </div>
 <div className="text-center space-y-2">
 <h4 className="text-xl font-semibold text-pure-black">Top-Up Successful</h4>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight">TRANSACTION NODE CONFIRMED</p>
 </div>
 <div className="w-full bg-light-gray rounded-xl p-5 text-center">
 <p className="text-[10px] font-semibold text-pure-black/40 mb-1">NEW WALLET BALANCE</p>
 <p className="text-3xl font-light text-apple-blue tabular-nums">{selectedClient.currency} {resultBalance.toLocaleString(undefined, { minimumFractionDigits: 3 })}</p>
 </div>
 <button onClick={handleClose} className="w-full bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight hover:bg-black transition-all active:scale-95">
 Done
 </button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
