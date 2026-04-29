import { useState } from 'react';
import { X, CheckCircle2, ShieldAlert, RotateCcw, Lock } from 'lucide-react';
import { apiManager } from '../../index';
import { useApp } from '../../context/AppContext';
import { MPinModal } from './MPinModal';
import type { Booking } from '../../types';

interface RefundModalProps {
 isOpen: boolean;
 onClose: () => void;
 booking: Booking;
 onRefundSuccess?: () => void;
}

export default function RefundModal({ onClose, booking, onRefundSuccess }: RefundModalProps) {
 const { addNotification } = useApp();
 const [selectedPassengers, setSelectedPassengers] = useState<string[]>([]);
 const [agreed, setAgreed] = useState(false);
 const [captcha, setCaptcha] = useState('');
 const [isProcessing, setIsProcessing] = useState(false);
 const [showMPin, setShowMPin] = useState(false);

 // Mock Captcha
 const captchaNodes = ['f2d4sf', 'n8m2p9', 'k3x7z2'];
 const activeCaptcha = captchaNodes[0];

 const executeFinalRefund = async () => {
 setIsProcessing(true);
 try {
 await apiManager.refundBooking(booking.id, { 
 note: 'Customer requested cancellation via portal UI branch.',
 amount: booking.amount // Refunding 100% for demo
 });
 setIsProcessing(false);
 addNotification({
 title: 'Refund Processed',
 message: `PNR ${booking.pnr} has been cancelled and funds credited to your wallet.`,
 type: 'success'
 });
 if (onRefundSuccess) onRefundSuccess();
 onClose();
 } catch (err) {
 console.error('Refund failed:', err);
 setIsProcessing(false);
 alert('Refund synchronization failed. Please contact priority support.');
 }
 };

 const handleRefund = () => {
 if (!agreed || !captcha) return;
 setShowMPin(true);
 };

 return (
 <div className="modal-overlay active bg-black/80 backdrop-blur-md"style={{display:'flex', alignItems:'center', justifyContent:'center', zIndex: 1000}}>
 <div className="modal-content card max-w-500 w-full p-0 overflow-hidden animate-scale shadow-2xl scale-100">
 <div className="card-header bg-black p-20 px-24 flex justify-between items-center text-white">
 <div className="flex items-center gap-12">
 <RotateCcw size={18} className="text-apple-blue"/>
 <h2 className="text-sm font-semibold">Refund Branch Itinerary</h2>
 </div>
 <button onClick={onClose} className="text-white/60 hover:text-white transition-colors"><X size={20} /></button>
 </div>

 <div className="p-24 bg-light-navy/5 border-bottom flex justify-between items-center">
 <div>
 <div className="text-xxxxs font-semibold text-muted mb-4">Route Sector</div>
 <div className="text-sm font-semibold text-pure-black tracking-tight">{booking.route || 'Global Hub'}</div>
 </div>
 <div className="flex items-center gap-8">
 <input 
 type="checkbox"
 id="selectAll"
 className="w-14 h-14 accent-navy"
 checked={selectedPassengers.length > 0}
 onChange={() => setSelectedPassengers(['passenger-1'])}
 />
 <label htmlFor="selectAll"className="text-xxxxs font-semibold text-pure-black cursor-pointer">Select All Nodes</label>
 </div>
 </div>

 <div className="p-24">
 <div className="p-16 border rounded-xl bg-white mb-24 flex justify-between items-start">
 <div className="flex items-start gap-12">
 <input 
 type="checkbox"
 className="mt-4 w-14 h-14 accent-navy"
 checked={selectedPassengers.includes('passenger-1')}
 onChange={() => setSelectedPassengers(['passenger-1'])}
 />
 <div>
 <div className="text-xxs font-semibold text-pure-black tracking-tight">{booking.passengerName} | Adult</div>
 <div className="text-xxxxs font-semibold text-muted mt-2">PNR — {booking.pnr || 'ZRY-849'}</div>
 </div>
 </div>
 <div className="text-right">
 <span className="badge badge-green text-[8px] px-8 py-2">CONFIRMED</span>
 <div className="text-xxxxs font-bold text-muted mt-4">Ticket: {booking.ticketNo || '0655581038506'}</div>
 </div>
 </div>

 <div className="alert bg-apple-blue/5 border border-apple-blue/20 p-16 rounded-xl mb-24 flex gap-12 items-start">
 <ShieldAlert size={16} className="text-apple-blue-dark mt-2"/>
 <div className="flex-1">
 <div className="text-xxxxs font-semibold text-apple-blue-dark mb-4">Important Settlement Note</div>
 <p className="text-xxxxs text-pure-black font-bold leading-relaxed opacity-60">
 Booking will be auto-cancelled and refunded upon validation. Nodal cancellation charges apply according to airline fare rules.
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-16 mb-24">
 <div className="bg-light-navy/5 p-16 rounded-xl flex items-center justify-center border border-dashed border-apple-blue-light/40 relative overflow-hidden">
 <span className="text-lg font-semibold text-pure-black italic tracking-tight opacity-40 select-none">{activeCaptcha}</span>
 <Lock size={12} className="absolute top-8 right-8 text-apple-blue opacity-20"/>
 </div>
 <input 
 type="text"
 placeholder="Captcha*"
 className="form-control-refined text-xxs font-semibold text-center"
 value={captcha}
 onChange={(e) => setCaptcha(e.target.value)}
 />
 </div>

 <div className="flex items-center gap-12 mb-24">
 <input 
 type="checkbox"
 id="agree"
 className="w-14 h-14 accent-navy"
 checked={agreed}
 onChange={(e) => setAgreed(e.target.checked)}
 />
 <label htmlFor="agree"className="text-xxxxs font-semibold text-pure-black cursor-pointer opacity-60">I accept fare rule branch definitions</label>
 </div>

 <button 
 disabled={!agreed || !captcha || isProcessing}
 onClick={handleRefund}
 className={`btn btn-full py-16 font-semibold text-xxs shadow-xl flex items-center justify-center gap-12 transition-all ${(!agreed || !captcha) ? 'bg-slate-200 text-near-black/40 border-none cursor-not-allowed' : 'btn-navy'}`}
 >
 {isProcessing ? 'SYNCHRONIZING HUB...' : 'PROCEED WITH REFUND'}
 {!isProcessing && <CheckCircle2 size={16} />}
 </button>
 </div>
 </div>

 <MPinModal 
 isOpen={showMPin}
 onClose={() => setShowMPin(false)}
 onSuccess={executeFinalRefund}
 title="Authorize Refund Execution"
 description="Authorization required to credit the ledger funds back to the agent wallet."
 amount={booking.amount}
 currency={booking.currency}
 />
 </div>
 );
}
