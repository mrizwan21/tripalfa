import { useState } from 'react';
import { X, AlertTriangle, RefreshCcw, Loader2 } from 'lucide-react';
import { cn } from '../../index';
import { apiManager } from '../../index';
import { useApp } from '../../context/AppContext';
import type { Booking, AmendmentType } from '../../types';

interface AmendmentModalProps {
 isOpen: boolean;
 onClose: () => void;
 booking: Booking;
 onSuccess: () => void;
}

export default function AmendmentModal({ isOpen, onClose, booking, onSuccess }: AmendmentModalProps) {
 const { addNotification } = useApp();
 const [type, setType] = useState<AmendmentType>('NameChange');
 const [description, setDescription] = useState('');
 const [isSubmitting, setIsSubmitting] = useState(false);

 if (!isOpen) return null;

 // Enforce Section 13: No amendments allowed on Provisional bookings
 if (booking.authorizationStatus === 'Provisional') {
 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
 <div className="bg-white rounded-xl w-full max-w-md overflow-hidden shadow-2xl scale-in p-10 text-center">
 <div className="w-20 h-20 bg-amber-50 rounded-xl flex items-center justify-center text-amber-500 mb-8 border border-amber-100 mx-auto animate-bounce-slow">
 <AlertTriangle size={32} />
 </div>
 <h2 className="text-xl font-bold text-pure-black tracking-tight mb-4">Modification Locked</h2>
 <p className="text-xs font-semibold text-pure-black/40 leading-relaxed mb-8">
 This booking is currently in a "Provisional" holding state. Under Section 13 Governance Protocols, amendments cannot be processed until administrative authorization is granted.
 </p>
 <button onClick={onClose} className="w-full py-4 bg-black text-white text-[11px] font-bold rounded-xl">
 Acknowledge & Close
 </button>
 </div>
 </div>
 );
 }

 const handleSubmit = async () => {
 setIsSubmitting(true);
 try {
 await apiManager.submitAmendment(booking.id, {
 type,
 description,
 requestedBy: 'Agent Desk',
 });
 addNotification({ 
 title: 'Amendment Requested', 
 message: 'The modification branch has been dispatched to the Provider Ledger.', 
 type: 'success' 
 });
 onSuccess();
 onClose();
 } catch {
 addNotification({ 
 title: 'Transmission Failed', 
 message: 'Could not sync the amendment request to the primary branch.', 
 type: 'error' 
 });
 } finally {
 setIsSubmitting(false);
 }
 };

 return (
 <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
 <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-2xl scale-in border border-white/20">
 {/* Header */}
 <div className="px-10 py-8 border-b border-navy/5 flex justify-between items-center bg-light-gray/50">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-apple-blue shadow-lg">
 <RefreshCcw size={20} />
 </div>
 <div>
 <h2 className="text-xl font-bold text-pure-black tracking-tight leading-none mb-1.5">Amendment Workspace</h2>
 <p className="text-[10px] font-bold text-pure-black/30 tracking-tight">{booking.referenceNo} • Request Module</p>
 </div>
 </div>
 <button onClick={onClose} className="text-pure-black/20 hover:text-red-500 transition-colors p-2 bg-white rounded-full shadow-sm">
 <X size={20} />
 </button>
 </div>

 {/* Content */}
 <div className="p-10 space-y-8">
 <div>
 <label className="text-[10px] font-bold text-pure-black/40 tracking-tight block mb-4">Modification Type</label>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
 {[
 { id: 'NameChange', label: 'Name Branch Sync' },
 { id: 'DateChange', label: 'Schedule Revision' },
 { id: 'SectorCancel', label: 'Partial System Void' },
 { id: 'AncillaryAdd', label: 'Ancillary Injection' }
 ].map(opt => (
 <button
 key={opt.id}
 onClick={() => setType(opt.id as AmendmentType)}
 className={cn(
 "py-3 px-4 rounded-xl text-[10px] font-bold transition-all border",
 type === opt.id ? "bg-black border-black text-apple-blue shadow-lg scale-105" : "bg-white border-navy/5 text-pure-black/40 hover:border-apple-blue/30"
 )}
 >
 {opt.label}
 </button>
 ))}
 </div>
 </div>

 <div>
 <label className="text-[10px] font-bold text-pure-black/40 tracking-tight block mb-4">Detailed Request Envelope</label>
 <textarea 
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 placeholder="Inject specific parameters regarding the amendment requirement (e.g., Target Date: DD-MM-YYYY)"
 className="w-full bg-light-gray border border-navy/5 rounded-xl p-6 text-xs font-medium text-pure-black focus:outline-none focus:ring-2 focus:ring-apple-blue/20 resize-none h-32"
 />
 </div>

 <div className="p-6 bg-apple-blue/5 border border-apple-blue/20 rounded-xl flex items-start gap-4">
 <AlertTriangle size={20} className="text-apple-blue shrink-0 mt-0.5" />
 <div>
 <h4 className="text-[11px] font-bold text-pure-black mb-1">Financial Penalty Warning</h4>
 <p className="text-[10px] font-medium text-pure-black/50 leading-relaxed">
 Amendment nodes are dispatched directly to the GDS framework. Provider-specific penalties may automatically deduct from your organizational credit ledger upon approval.
 </p>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="px-10 py-8 bg-light-gray/80 border-t border-navy/5 flex justify-end gap-3 flex-wrap">
 <button 
 onClick={onClose}
 className="px-8 py-3 text-[11px] font-bold text-pure-black/40 hover:text-pure-black transition-colors"
 >
 Abort Matrix
 </button>
 <button 
 onClick={handleSubmit}
 disabled={!description.trim() || isSubmitting}
 className="px-10 py-3 bg-apple-blue text-pure-black rounded-xl text-[11px] font-bold shadow-xl hover:scale-105 disabled:opacity-30 disabled:scale-100 transition-all flex items-center justify-center min-w-[200px]"
 >
 {isSubmitting ? <Loader2 size={16} className="animate-spin" /> : "DISPATCH AMENDMENT NODE"}
 </button>
 </div>
 </div>
 </div>
 );
}
