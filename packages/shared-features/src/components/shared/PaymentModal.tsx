import { useState, useEffect } from 'react';
import { 
  X, Wallet, CreditCard, Banknote, 
  CheckCircle2, Loader2, Lock, 
  AlertCircle, ShieldCheck, ChevronRight
} from 'lucide-react';
import { cn, apiManager } from '../../index';
import { useQuery } from '@tanstack/react-query';
import { MPinModal } from './MPinModal';
import { FocusTrap } from './FocusTrap';
import type { WalletAccount, Booking } from '../../types';

interface PaymentModalProps {
 isOpen: boolean;
 onClose: () => void;
 onSuccess: (method: 'Cash' | 'Wallet' | 'Online') => void;
 booking: Booking;
}

function PaymentSectionHeader({ title, titleHighlight, subtitle, onBack }: { title: string; titleHighlight: string; subtitle: string; onBack: () => void }) {
 return (
 <div className="space-y-8 animate-fade-in p-8">
 <button onClick={onBack} className="text-xxxxs font-semibold text-pure-black/40 hover:text-pure-black flex items-center gap-2 mb-4">
 ← Change Method
 </button>
 <div className="space-y-2">
 <h2 className="text-2xl font-light text-pure-black tracking-tight">{title} <span className="font-semibold">{titleHighlight}</span></h2>
 <p className="text-[10px] font-medium text-pure-black/40">{subtitle}</p>
 </div>
 </div>
 );
}

export default function PaymentModal({ isOpen, onClose, onSuccess, booking }: PaymentModalProps) {
 const [method, setMethod] = useState<'Cash' | 'Wallet' | 'Online' | null>(null);
 const [isProcessing, setIsProcessing] = useState(false);
 const [cardData, setCardData] = useState({ number: '', expiry: '', cvc: '', name: '' });
 const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
 const [showMPin, setShowMPin] = useState(false);

 const { data: wallets = [] } = useQuery({
 queryKey: ['wallets'],
 queryFn: () => apiManager.getWalletAccounts(),
 enabled: isOpen
 });

  if (!isOpen) return null;

  // Focus management for accessibility
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = '';
      };
    }
  }, [isOpen]);

  const executeFinalPayment = async () => {
 setIsProcessing(true);
 try {
 await apiManager.recordPayment(booking.id, { method: method!, amount: booking.amount });
 setIsProcessing(false);
 onSuccess(method!);
 } catch (err) {
 console.error('Payment failed:', err);
 setIsProcessing(false);
 alert('Internal settlement branch synchronization error. Please check wallet balance.');
 }
 };

 const handlePayment = async () => {
 if (!method) return;
 
 if (method === 'Wallet') {
 setShowMPin(true);
 } else {
 executeFinalPayment();
 }
 };

 const renderSelection = () => (
 <div className="space-y-8 animate-fade-in text-center p-8">
 <div className="mb-8">
 <h2 className="text-3xl font-light text-pure-black tracking-tight">Recieve <span className="font-semibold">Payment</span></h2>
 <p className="text-xs font-medium text-pure-black/40 mt-2 px-12 leading-relaxed">
 Select a settlement channel for booking <span className="text-pure-black font-bold">{booking.referenceNo}</span>
 </p>
 </div>

 <div className="grid grid-cols-1 gap-6">
 {[
 { id: 'Wallet', label: 'Agency Wallet', icon: Wallet, desc: 'Instant branch balance deduction', color: 'bg-apple-blue/10 text-apple-blue' },
 { id: 'Online', label: 'Credit / Debit Card', icon: CreditCard, desc: 'Secure payment gateway sync', color: 'bg-black/5 text-near-black' },
 { id: 'Cash', label: 'Cash Settlement', icon: Banknote, desc: 'Manual cash handling record', color: 'bg-filter-bg text-near-black' },
 ].map((m) => (
 <button
 key={m.id}
 onClick={() => setMethod(m.id as 'Cash' | 'Wallet' | 'Online')}
 className="group flex items-center gap-6 p-6 rounded-xl bg-light-gray border border-black/5 hover:border-apple-blue/30 hover:bg-white hover:shadow-apple transition-all text-left relative overflow-hidden"
 >
 <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shrink-0 shadow-sm", m.color)}>
 <m.icon size={24} />
 </div>
 <div className="flex-1">
 <h3 className="text-sm font-semibold text-pure-black">{m.label}</h3>
 <p className="text-[10px] font-medium text-pure-black/40 mt-0.5">{m.desc}</p>
 </div>
 <ChevronRight size={18} className="text-pure-black/10 group-hover:text-apple-blue group-hover:translate-x-1 transition-all"/>
 </button>
 ))}
 </div>
 
 <p className="text-[10px] font-bold text-pure-black/20 tracking-tight pt-4">
 PCI-DSS Compliance Level 1 Branch
 </p>
 </div>
 );

 const renderWallet = () => (
 <div className="space-y-8 animate-fade-in">
 <PaymentSectionHeader
 title="Select"
 titleHighlight="Account"
 subtitle="Available funds in your agency ecosystem"
 onBack={() => setMethod(null)}
 />

 <div className="space-y-4">
 {wallets.map((w: WalletAccount) => (
 <button
 key={w.id}
 disabled={w.balance < booking.amount}
 onClick={() => setSelectedWallet(w.id)}
 className={cn(
"w-full flex justify-between items-center p-6 rounded-xl border transition-all text-left",
 selectedWallet === w.id ?"bg-near-black border-black text-white shadow-apple scale-[1.02]":"bg-light-gray border-black/5 text-near-black hover:border-apple-blue/30",
 w.balance < booking.amount &&"opacity-40 grayscale cursor-not-allowed"
 )}
 >
 <div className="space-y-1">
 <span className="text-nano font-semibold opacity-60">{w.name} ({w.type})</span>
 <div className="text-subheading-bold tabular-nums">
 <span className="text-nano font-bold mr-1 opacity-40">{w.currency}</span>
 {w.balance.toLocaleString()}
 </div>
 </div>
 {selectedWallet === w.id && <CheckCircle2 size={24} className="text-apple-blue"/>}
 {w.balance < booking.amount && <AlertCircle size={20} className="text-black/20"/>}
 </button>
 ))}
 </div>

 <button
 onClick={handlePayment}
 disabled={!selectedWallet || isProcessing}
 className="w-full py-5 bg-black text-apple-blue rounded-xl text-xs font-semibold tracking-tight shadow-sm hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
 >
 {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18} />}
 {isProcessing ? 'Synchronizing Ledger...' : `Authorize ${booking.currency} ${booking.amount.toLocaleString()}`}
 </button>
 </div>
 );

 const renderOnline = () => (
 <div className="space-y-8 animate-fade-in">
 <PaymentSectionHeader
 title="Card"
 titleHighlight="Gateway"
 subtitle="Global settlement via secure card branch"
 onBack={() => setMethod(null)}
 />

 <div className="space-y-6">
 <div className="space-y-4 p-8 bg-near-black rounded-xl text-white shadow-apple border border-white/10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
 <CreditCard size={120} />
 </div>
 <div className="relative space-y-8">
 <div className="flex justify-between items-center">
 <div className="w-12 h-10 bg-apple-blue rounded-md shadow-inner"/>
 <div className="text-[10px] font-semibold italic opacity-40">Global Branch</div>
 </div>
 <div className="space-y-2">
 <label className="text-[9px] font-semibold opacity-30">Branch Number</label>
 <input 
 placeholder="0000 0000 0000 0000"
 value={cardData.number}
 onChange={e => setCardData({...cardData, number: e.target.value})}
 className="w-full bg-transparent text-xl font-light tracking-tight outline-none placeholder:text-white/10"
 />
 </div>
 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-1">
 <label className="text-[9px] font-semibold opacity-30">Expiry</label>
 <input placeholder="MM/YY"className="bg-transparent text-sm font-bold outline-none placeholder:text-white/10"/>
 </div>
 <div className="space-y-1">
 <label className="text-[9px] font-semibold opacity-30">Security Branch</label>
 <input placeholder="CVC"className="bg-transparent text-sm font-bold outline-none placeholder:text-white/10"/>
 </div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-3 px-6 py-4 bg-black/5 border border-navy/5 rounded-xl">
 <Lock size={16} className="text-pure-black/20"/>
 <p className="text-[9px] font-medium text-pure-black/40 leading-relaxed">
 Data is encrypted with AES-256 GCM. Your full card details are never stored on our local hub.
 </p>
 </div>

 <button
 onClick={handlePayment}
 disabled={isProcessing}
 className="w-full py-5 bg-near-black text-apple-blue rounded-xl text-nano font-semibold tracking-tight shadow-apple hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
 >
 {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <ShieldCheck size={18} />}
 {isProcessing ? 'Processing Transaction...' : `Pay ${booking.currency} ${booking.amount.toLocaleString()}`}
 </button>
 </div>
 </div>
 );

 const renderCash = () => (
 <div className="space-y-8 animate-fade-in p-10 text-center">
 <button onClick={() => setMethod(null)} className="text-xxxxs font-semibold text-pure-black/40 hover:text-pure-black flex items-center gap-2 mb-4 mx-auto">
 ← Change Method
 </button>

 <div className="w-20 h-20 bg-apple-blue/5 rounded-pill flex items-center justify-center text-apple-blue mx-auto mb-6 border border-apple-blue/10">
 <Banknote size={40} />
 </div>

 <div className="space-y-2">
 <h2 className="text-2xl font-light text-pure-black tracking-tight">Cash <span className="font-semibold">Acknowledgement</span></h2>
 <p className="text-[10px] font-medium text-pure-black/40 px-8 leading-relaxed">Confirm physical cash collection from the agent / customer</p>
 </div>

 <div className="bg-light-gray p-6 rounded-xl border border-navy/5 space-y-4">
 <div className="flex justify-between items-center text-[10px] font-semibold text-pure-black/30">
 <span>Settlement Amount</span>
 <span className="text-pure-black font-bold">{booking.currency} {booking.amount.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-semibold text-pure-black/30 border-t border-navy/5 pt-4">
 <span>Processing Branch</span>
 <span className="text-pure-black">{booking.referenceNo}</span>
 </div>
 </div>

 <button
 onClick={handlePayment}
 disabled={isProcessing}
 className="w-full py-5 bg-near-black text-apple-blue rounded-xl text-nano font-semibold tracking-tight shadow-apple hover:scale-[1.02] active:scale-95 disabled:opacity-50 transition-all flex items-center justify-center gap-3"
 >
 {isProcessing ? <Loader2 size={18} className="animate-spin"/> : <CheckCircle2 size={18} />}
 {isProcessing ? 'Recording Entry...' : 'Confirm Cash Received'}
 </button>
 </div>
 );

 const getContent = () => {
 switch (method) {
 case 'Wallet': return renderWallet();
 case 'Online': return renderOnline();
 case 'Cash': return renderCash();
 default: return renderSelection();
 }
 };

  return (
  <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[120] flex items-center justify-center p-6 animate-fade-in" role="dialog" aria-modal="true" aria-labelledby="payment-modal-title">
  <FocusTrap isActive={isOpen}>
  <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-apple border border-black/5 animate-fade-in relative">
  <button 
  onClick={onClose}
  className="absolute top-6 right-6 w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-near-black hover:bg-black/10 transition-all shadow-sm z-10"
  aria-label="Close payment modal"
  >
  <X size={16} />
  </button>

  <div className="p-6 sm:p-8">
  {getContent()}
  </div>
  </div>
  </FocusTrap>

  <MPinModal 
  isOpen={showMPin}
  onClose={() => setShowMPin(false)}
  onSuccess={executeFinalPayment}
  title="Authorize Wallet Deduction"
  description="Encrypted M-Pin required to authorize the deduction from your agency trust account."
  amount={booking.amount}
  currency={booking.currency}
  />
  </div>
  );
}
