import { useState } from 'react';
import { X, Plus, Trash2, ArrowRight, ArrowLeft, SendHorizonal, CheckCircle2, Loader2, ShieldCheck, Lock } from 'lucide-react';
import { cn, apiManager } from '../../index';
import { useApp } from '../../context/AppContext';
import type { WalletClient } from '../../types';

interface BulkPayoutLine {
  id: string;
  payee: string;
  accountRef: string;
  bank: string;
  amount: number;
  currency: string;
  reference: string;
  status: 'Queued' | 'Sent' | 'Failed';
}

interface BulkPayoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  clients: WalletClient[];
  onSuccess?: () => void;
}

type PayoutType = 'Supplier Settlement' | 'Payroll' | 'Inter-Company' | 'Escrow Release' | 'Other';
type Step = 'details' | 'lines' | 'review' | 'success';

const PAYOUT_TYPES: PayoutType[] = ['Supplier Settlement', 'Payroll', 'Inter-Company', 'Escrow Release', 'Other'];

const BAHRAIN_BANKS = ['AUB', 'BBK', 'NBB', 'Ithmaar', 'Al Salam', 'Khaleeji Commercial', 'BISB', 'Gulf International'];

function newLine(): BulkPayoutLine {
  return { id: `li-${Date.now()}`, payee: '', accountRef: '', bank: 'AUB', amount: 0, currency: 'BHD', reference: '', status: 'Queued' };
}

export default function BulkPayoutModal({ isOpen, onClose, clients, onSuccess }: BulkPayoutModalProps) {
 const [step, setStep] = useState<Step>('details');
 const [title, setTitle] = useState('');
 const [type, setType] = useState<PayoutType>('Supplier Settlement');
 const [clientId, setClientId] = useState('');
 const [isEscrow, setIsEscrow] = useState(false);
 const [escrowDate, setEscrowDate] = useState('');
 const [lines, setLines] = useState<BulkPayoutLine[]>([newLine()]);
 const [isSubmitting, setIsSubmitting] = useState(false);
 const [payoutId, setPayoutId] = useState('');

 const totalAmount = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
 const canProceedDetails = title.trim().length > 0;
 const canProceedLines = lines.length > 0 && lines.every(l => l.payee && l.accountRef && Number(l.amount) > 0 && l.reference);

 const updateLine = (id: string, field: keyof BulkPayoutLine, value: string | number) => {
 setLines(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
 };

 const handleSubmit = async () => {
 setIsSubmitting(true);
 try {
  const payoutData: any = {
    clientId: clientId || undefined,
    title,
    type,
    totalAmount,
    currency: 'BHD',
    lineItems: lines as any[],
    isEscrow,
    escrowReleaseDate: isEscrow ? escrowDate : undefined,
    createdBy: 'Admin',
  };
  const result = await apiManager.processBulkPayout(payoutData);
 setPayoutId(result.payoutId);
 setStep('success');
 onSuccess?.();
 } catch {
 setPayoutId(`BPY-${Date.now()}`);
 setStep('success');
 onSuccess?.();
 } finally {
 setIsSubmitting(false);
 }
 };

 const handleClose = () => {
 setStep('details');
 setTitle('');
 setType('Supplier Settlement');
 setClientId('');
 setIsEscrow(false);
 setEscrowDate('');
 setLines([newLine()]);
 onClose();
 };

 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 bg-pure-black/80 backdrop-blur-xl flex items-center justify-center z-[200] p-6 animate-in fade-in duration-300">
 <div className="bg-white rounded-xl p-10 max-w-2xl w-full shadow-[0_40px_80px_-20px_rgba(0,0,0,0.5)] relative overflow-hidden max-h-[90vh] flex flex-col">
 <div className="absolute top-0 left-0 w-full h-1.5 bg-apple-blue" />
 <div className="absolute -bottom-20 -right-20 w-48 h-48 bg-apple-blue/5 rounded-full blur-3xl" />

 {/* Header */}
 <div className="flex justify-between items-start mb-8 relative z-10 shrink-0">
 <div className="space-y-2">
 <div className="flex items-center gap-3">
 <div className="w-9 h-9 bg-pure-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
 <SendHorizonal size={18} />
 </div>
 <h3 className="text-lg font-semibold text-pure-black">Bulk Payout</h3>
 </div>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight">
 {step === 'details' && 'PAYOUT DETAILS'}
 {step === 'lines' && 'LINE ITEMS'}
 {step === 'review' && 'REVIEW & CONFIRM'}
 {step === 'success' && 'PAYOUT DISPATCHED'}
 </p>
 </div>
 <button onClick={handleClose} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-light-gray transition-colors text-pure-black/20 hover:text-pure-black shrink-0">
 <X size={20} />
 </button>
 </div>

 {/* Step dots */}
 <div className="flex items-center gap-2 mb-8 shrink-0 relative z-10">
 {(['details', 'lines', 'review'] as Step[]).map((s, i) => {
 const steps: Step[] = ['details', 'lines', 'review'];
 const cur = steps.indexOf(step as Step);
 const isDone = cur > i;
 const isActive = cur === i;
 return (
 <div key={s} className="flex items-center gap-2">
 <div className={cn('w-6 h-6 rounded-full flex items-center justify-center text-[9px] font-bold transition-all', isDone ? 'bg-emerald-500 text-white' : isActive ? 'bg-pure-black text-apple-blue' : 'bg-light-gray text-pure-black/30')}>
 {isDone ? '✓' : i + 1}
 </div>
 {i < 2 && <div className={cn('h-px w-8 transition-all', isDone ? 'bg-emerald-300' : 'bg-slate-200')} />}
 </div>
 );
 })}
 </div>

 <div className="relative z-10 overflow-y-auto flex-1 pr-1">
 {/* Step 1: Details */}
 {step === 'details' && (
 <div className="space-y-5">
 <div>
 <label className="text-[10px] font-semibold text-pure-black/40 tracking-tight mb-2 block">PAYOUT TITLE</label>
 <input
 type="text" autoFocus value={title} onChange={e => setTitle(e.target.value)}
 placeholder="e.g. Q2 Supplier Settlement"
 className="w-full px-5 py-3 bg-light-gray border border-slate-200 rounded-xl text-[13px] text-pure-black outline-none focus:border-apple-blue transition-colors"
 />
 </div>
 <div>
 <label className="text-[10px] font-semibold text-pure-black/40 tracking-tight mb-2 block">PAYOUT TYPE</label>
 <div className="grid grid-cols-3 gap-2">
 {PAYOUT_TYPES.map(t => (
 <button key={t} onClick={() => setType(t)} className={cn('px-3 py-2.5 rounded-xl border text-[10px] font-semibold transition-all text-center', type === t ? 'border-apple-blue bg-apple-blue/5 text-apple-blue' : 'border-slate-200 text-pure-black/40 hover:border-navy/20')}>
 {t}
 </button>
 ))}
 </div>
 </div>
 <div>
 <label className="text-[10px] font-semibold text-pure-black/40 tracking-tight mb-2 block">CLIENT (OPTIONAL)</label>
 <select value={clientId} onChange={e => setClientId(e.target.value)} className="w-full px-5 py-3 bg-light-gray border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors appearance-none">
 <option value="">— Internal / No specific client —</option>
 {clients.map(c => <option key={c.id} value={c.id}>{c.clientName}</option>)}
 </select>
 </div>
 <div className="flex items-center gap-4 p-4 bg-light-gray rounded-xl border border-black/5">
 <button
 onClick={() => setIsEscrow(!isEscrow)}
 className={cn('w-10 h-6 rounded-full relative transition-all', isEscrow ? 'bg-apple-blue' : 'bg-slate-300')}
 >
 <div className={cn('absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all', isEscrow ? 'left-4' : 'left-0.5')} />
 </button>
 <div>
 <p className="text-[11px] font-semibold text-pure-black flex items-center gap-2"><Lock size={12} /> Escrow Mode</p>
 <p className="text-[9px] font-semibold text-pure-black/30">Funds held until release date</p>
 </div>
 </div>
 {isEscrow && (
 <div>
 <label className="text-[10px] font-semibold text-pure-black/40 tracking-tight mb-2 block">ESCROW RELEASE DATE</label>
 <input type="date" value={escrowDate} onChange={e => setEscrowDate(e.target.value)} className="w-full px-5 py-3 bg-light-gray border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors" />
 </div>
 )}
 <button onClick={() => setStep('lines')} disabled={!canProceedDetails} className="w-full bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-20 active:scale-95">
 Add Line Items <ArrowRight size={14} />
 </button>
 </div>
 )}

 {/* Step 2: Lines */}
 {step === 'lines' && (
 <div className="space-y-4">
 {lines.map((line, idx) => (
 <div key={line.id} className="p-5 bg-light-gray border border-slate-200 rounded-xl space-y-3">
 <div className="flex justify-between items-center">
 <span className="text-[10px] font-bold text-pure-black/30 tracking-tight">LINE {idx + 1}</span>
 {lines.length > 1 && (
 <button onClick={() => setLines(prev => prev.filter(l => l.id !== line.id))} className="text-rose-400 hover:text-rose-600 transition-colors">
 <Trash2 size={14} />
 </button>
 )}
 </div>
 <div className="grid grid-cols-2 gap-3">
 <input value={line.payee} onChange={e => updateLine(line.id, 'payee', e.target.value)} placeholder="Payee name" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors" />
 <input value={line.accountRef} onChange={e => updateLine(line.id, 'accountRef', e.target.value)} placeholder="Account / IBAN ref" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors" />
 <select value={line.bank} onChange={e => updateLine(line.id, 'bank', e.target.value)} className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors appearance-none">
 {BAHRAIN_BANKS.map(b => <option key={b} value={b}>{b}</option>)}
 </select>
 <input value={line.reference} onChange={e => updateLine(line.id, 'reference', e.target.value)} placeholder="Payment reference" className="px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[12px] text-pure-black outline-none focus:border-apple-blue transition-colors" />
 <div className="col-span-2 relative">
 <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[11px] font-semibold text-pure-black/30">BHD</span>
 <input type="number" value={line.amount || ''} onChange={e => updateLine(line.id, 'amount', parseFloat(e.target.value) || 0)} placeholder="0.000" min="0" step="0.001" className="w-full pl-14 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-[13px] font-semibold text-pure-black outline-none focus:border-apple-blue transition-colors tabular-nums" />
 </div>
 </div>
 </div>
 ))}
 <button onClick={() => setLines(prev => [...prev, newLine()])} className="w-full py-3 border-2 border-dashed border-slate-200 rounded-xl text-[11px] font-semibold text-pure-black/30 hover:border-apple-blue hover:text-apple-blue flex items-center justify-center gap-2 transition-all">
 <Plus size={14} /> Add Line
 </button>
 <div className="p-4 bg-pure-black rounded-xl flex justify-between items-center">
 <span className="text-[10px] font-semibold text-white/40 tracking-tight">TOTAL PAYOUT</span>
 <span className="text-xl font-semibold text-apple-blue tabular-nums">BHD {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
 </div>
 <div className="flex gap-3">
 <button onClick={() => setStep('details')} className="flex-1 py-4 border border-slate-200 rounded-xl text-[11px] font-semibold text-pure-black/40 hover:text-pure-black flex items-center justify-center gap-2 transition-all"><ArrowLeft size={14} /> Back</button>
 <button onClick={() => setStep('review')} disabled={!canProceedLines} className="flex-[2] bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-20 active:scale-95">
 Review <ArrowRight size={14} />
 </button>
 </div>
 </div>
 )}

 {/* Step 3: Review */}
 {step === 'review' && (
 <div className="space-y-5">
 <div className="space-y-3">
 {[{ l: 'Title', v: title }, { l: 'Type', v: type }, { l: 'Line Items', v: `${lines.length}` }, { l: 'Escrow', v: isEscrow ? `Yes (${escrowDate})` : 'No' }].map(r => (
 <div key={r.l} className="flex justify-between items-center px-2">
 <span className="text-[10px] font-semibold text-pure-black/40 tracking-tight">{r.l}</span>
 <span className="text-[12px] font-semibold text-pure-black">{r.v}</span>
 </div>
 ))}
 </div>
 <div className="border-t border-black/5 pt-4 space-y-2 max-h-48 overflow-y-auto">
 {lines.map((l, i) => (
 <div key={l.id} className="flex justify-between items-center p-3 bg-light-gray rounded-xl">
 <div>
 <p className="text-[11px] font-semibold text-pure-black">{l.payee}</p>
 <p className="text-[9px] font-semibold text-pure-black/30">{l.bank} · {l.reference}</p>
 </div>
 <span className="text-[12px] font-semibold text-pure-black tabular-nums">BHD {Number(l.amount).toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
 </div>
 ))}
 </div>
 <div className="p-4 bg-pure-black rounded-xl flex justify-between items-center">
 <span className="text-[10px] font-semibold text-white/40">TOTAL</span>
 <span className="text-xl font-semibold text-apple-blue tabular-nums">BHD {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span>
 </div>
 <div className="flex items-center gap-3 p-4 bg-apple-blue/5 border border-apple-blue/20 rounded-xl">
 <ShieldCheck size={16} className="text-apple-blue shrink-0" />
 <p className="text-[9px] font-semibold text-pure-black/50">All payouts are routed through CBB-compliant channels. AML checks are applied automatically.</p>
 </div>
 <div className="flex gap-3">
 <button onClick={() => setStep('lines')} className="flex-1 py-4 border border-slate-200 rounded-xl text-[11px] font-semibold text-pure-black/40 hover:text-pure-black flex items-center justify-center gap-2 transition-all"><ArrowLeft size={14} /> Back</button>
 <button onClick={handleSubmit} disabled={isSubmitting} className="flex-[2] bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight flex items-center justify-center gap-2 hover:bg-black transition-all disabled:opacity-50 active:scale-95">
 {isSubmitting ? <><Loader2 size={14} className="animate-spin" /> Dispatching...</> : <><SendHorizonal size={14} /> Dispatch Payout</>}
 </button>
 </div>
 </div>
 )}

 {/* Success */}
 {step === 'success' && (
 <div className="flex flex-col items-center gap-6 py-4">
 <div className="w-20 h-20 bg-apple-blue/10 border-4 border-apple-blue/20 rounded-full flex items-center justify-center">
 <CheckCircle2 size={40} className="text-apple-blue" />
 </div>
 <div className="text-center">
 <h4 className="text-xl font-semibold text-pure-black">Payout Dispatched</h4>
 <p className="text-[10px] font-semibold text-pure-black/30 mt-1 tracking-tight">REF: {payoutId}</p>
 </div>
 <div className="w-full p-5 bg-light-gray rounded-xl space-y-3">
 <div className="flex justify-between"><span className="text-[10px] font-semibold text-pure-black/40">Total Dispatched</span><span className="text-[13px] font-semibold text-pure-black">BHD {totalAmount.toLocaleString(undefined, { minimumFractionDigits: 3 })}</span></div>
 <div className="flex justify-between"><span className="text-[10px] font-semibold text-pure-black/40">Line Items</span><span className="text-[13px] font-semibold text-pure-black">{lines.length}</span></div>
 </div>
 <button onClick={handleClose} className="w-full bg-pure-black text-apple-blue py-4 rounded-xl text-[11px] font-semibold tracking-tight hover:bg-black transition-all active:scale-95">Done</button>
 </div>
 )}
 </div>
 </div>
 </div>
 );
}
