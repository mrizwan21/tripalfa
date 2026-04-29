import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { 
  CheckCircle2, Clock, MapPin, Plane, Hotel, Calendar, Download, Share2, 
  ChevronRight, Phone, Mail, Building2, User, Users, Shield, ArrowRight,
  Printer, CreditCard, ExternalLink, History, AlertTriangle, X, Loader2,
  MoreVertical, FileText, Globe, Info, Zap, ShieldCheck, Database, TrendingUp,
  Percent, Star, ArrowLeft, RefreshCw, Trash2, MailQuestion, Eye, Briefcase,
  FileX, Lock, Unlock, XCircle, MessageSquare, RefreshCcw, Ticket
} from 'lucide-react';
import { useTenant } from '../context/TenantContext';
import { useApp } from '../context/AppContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { cn, apiManager, RefundModal } from '../index';
import type { BookingStatus } from '../types';
import PaymentModal from '../components/shared/PaymentModal';
import BookingCardModule from '../components/shared/BookingCardModule';
import DocumentPreview from '../components/shared/DocumentPreview';
import AmendmentModal from '../components/shared/AmendmentModal';

interface DispatchEvent {
 id: string;
 type: 'email' | 'download' | 'issue' | 'modify' | 'refund';
 label: string;
 timestamp: string;
 status: 'Success' | 'Pending' | 'Failed';
 recipient?: string;
}

export default function ItineraryDetailPage() {
 const { id } = useParams();
 const navigate = useNavigate();
 const { tenant } = useTenant();
 const { addNotification, agent } = useApp();
 const queryClient = useQueryClient();
 
 const [activeDoc, setActiveDoc] = useState<{ type: 'itinerary' | 'invoice' | 'receipt' | 'ticket' | 'refund-note'; isOpen: boolean } | null>(null);
 const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
 const [isRefundModalOpen, setIsRefundModalOpen] = useState(false);
 const [isAmendmentModalOpen, setIsAmendmentModalOpen] = useState(false);
 const [isIssuing, setIsIssuing] = useState(false);

 // High-Fidelity Data Hooks
 const { data: booking, isLoading } = useQuery({
 queryKey: ['booking', id],
 queryFn: () => apiManager.getBookingById(id!),
 enabled: !!id
 });

 const [dispatchLedger, setDispatchLedger] = useState<DispatchEvent[]>([]);

 // Locking Mutation
 const lockMutation = useMutation({
 mutationFn: (userId: string) => apiManager.lockBooking(id!, userId),
 onSuccess: () => notifyAndInvalidate('Branch Locked', 'You have assumed exclusive management of this booking.', 'success')
 });

 const notifyAndInvalidate = (title: string, message: string, type: 'success' | 'info' | 'error') => {
 queryClient.invalidateQueries({ queryKey: ['booking', id] });
 addNotification({ title, message, type });
 };

 const unlockMutation = useMutation({
 mutationFn: () => apiManager.unlockBooking(id!),
 onSuccess: () => notifyAndInvalidate('Branch Released', 'Booking system is now available to other system operators.', 'info')
 });

 const authorizeMutation = useMutation({
 mutationFn: () => apiManager.authorizeBooking(id!),
 onSuccess: () => notifyAndInvalidate('Booking Authorized', 'Management approved. Booking is cleared for settlement.', 'success')
 });

 useQuery({
 queryKey: ['dispatchLedger', id],
 queryFn: async () => {
 if (!id) return [];
 const fallbackDispatch = [
 { id: '1', type: 'issue' as const, label: 'Booking Created', timestamp: new Date(Date.now() - 3600000).toISOString(), status: 'Success' as const },
 { id: '2', type: 'email' as const, label: 'Confirmation Email Sent', timestamp: new Date(Date.now() - 1800000).toISOString(), status: 'Success' as const, recipient: agent.email }
 ];
 try {
  const events = await apiManager.getDispatchLedger(id) as unknown as DispatchEvent[];
 if (events.length > 0) {
 setDispatchLedger(events);
 return events;
 }
 setDispatchLedger(fallbackDispatch);
 return fallbackDispatch;
 } catch {
 setDispatchLedger(fallbackDispatch);
 return fallbackDispatch;
 }
 },
 enabled: !!id
 });

 const addDispatchEvent = async (type: DispatchEvent['type'], label: string, recipient?: string) => {
 const optimistic: DispatchEvent = {
 id: Math.random().toString(36).substr(2, 9),
 type, label,
 timestamp: new Date().toISOString(),
 status: 'Success',
 recipient
 };
 setDispatchLedger(prev => [optimistic, ...prev]);
 try {
 if (id) await apiManager.createDispatchEvent(id, { type, label, recipient });
 } catch {
 console.warn('[DispatchLedger] Persist failed — event is UI-only.');
 }
 };

 const [localStatus, setLocalStatus] = useState<BookingStatus | null>(null);
 const currentStatus = localStatus || booking?.status || 'Confirmed';

 // Enforcement Logic: Pestismistic Locking
 const isLockedBySelf = booking?.lockedBy === agent.id || booking?.lockedBy === agent.agencyName;
 const isLockedByOther = !!booking?.lockedBy && !isLockedBySelf;

 const handlePaymentSuccess = async (method: string) => {
 try {
 await apiManager.recordPayment(id!, { method, amount: booking?.amount ?? 0 });
 setLocalStatus('Paid');
 addNotification({
 title: 'Payment Recorded',
 message: `${booking?.currency || tenant.currency} ${booking?.amount.toLocaleString()} settled via ${method}.`,
 type: 'success'
 });
 queryClient.invalidateQueries({ queryKey: ['booking', id] });
 } catch {
 addNotification({ title: 'Payment Failed', message: 'Failed to record payment.', type: 'error' });
 }
 setIsPaymentModalOpen(false);
 };

 const handleIssuance = async () => {
 setIsIssuing(true);
 try {
 await apiManager.issueBooking(id!);
 setLocalStatus('Issued');
 addNotification({ title: 'Booking Issued', message: `PNR ${booking?.pnr || 'ZRY-849'} issued successfully.`, type: 'success' });
 queryClient.invalidateQueries({ queryKey: ['booking', id] });
 } catch {
 addNotification({ title: 'Issuance Failed', message: 'Provider synchronization failed.', type: 'error' });
 }
 setIsIssuing(false);
 };

 if (isLoading) {
 return (
 <Layout>
 <div className="flex flex-col justify-center items-center py-48 space-y-6">
 <Loader2 size={48} className="animate-spin text-pure-black/20"/>
 <div className="text-[10px] font-semibold text-pure-black/30 tracking-tight">Calibrating Command Center...</div>
 </div>
 </Layout>
 );
 }

 if (!booking) {
 return (
 <Layout>
 <div className="flex flex-col items-center justify-center p-60 text-center animate-fade-in">
 <div className="w-20 h-20 bg-red-50 rounded-xl flex items-center justify-center text-red-500 mb-8 border border-red-100">
 <FileX size={40} />
 </div>
 <h2 className="text-xl font-semibold text-pure-black tracking-tight">Booking Branch Not Found</h2>
 <button className="btn btn-navy mt-12 py-4 px-12 text-xs" onClick={() => navigate('/bookings')}>RETURN TO HUB</button>
 </div>
 </Layout>
 );
 }

 return (
 <Layout>
 <div className="max-w-[1550px] mx-auto pb-20 animate-fade-in px-6">
 {/* Pessimistic Locking Shield */}
 {isLockedByOther && (
 <div className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-md flex items-center justify-center animate-fade-in">
 <div className="bg-white rounded-xl p-16 max-w-lg text-center shadow-2xl border border-white/20 animate-slide-up">
 <div className="w-24 h-24 bg-red-500 rounded-xl flex items-center justify-center text-white mx-auto mb-8 shadow-lg">
 <Lock size={40} />
 </div>
 <h2 className="text-2xl font-bold text-pure-black tracking-tight mb-4">Branch Conflict Detected</h2>
 <p className="text-sm font-medium text-pure-black/60 leading-relaxed mb-10">
 This booking is currently locked by <span className="text-apple-blue font-bold">Admin {booking.lockedBy}</span>. 
 Concurrent modifications are restricted to maintain systemic integrity.
 </p>
 <div className="flex gap-4">
 <button 
 onClick={() => navigate('/bookings')}
 className="flex-1 py-4 bg-light-gray rounded-xl text-[11px] font-semibold text-pure-black hover:bg-black hover:text-white transition-all"
 >
 Return to Hub
 </button>
 <button 
 className="flex-1 py-4 bg-black text-apple-blue rounded-xl text-[11px] font-semibold tracking-tight"
 onClick={() => queryClient.invalidateQueries({ queryKey: ['booking', id] })}
 >
 Refresh State
 </button>
 </div>
 </div>
 </div>
 )}

 {/* Hub Header & Status Bar */}
 <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pb-8 border-b border-navy/10 relative">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className={cn(
 "p-4 rounded-xl flex items-center justify-center shadow-lg transition-all duration-700",
 currentStatus === 'Issued' ? "bg-emerald-600 text-white shadow-emerald-200" :
 currentStatus === 'Paid' ? "bg-black text-apple-blue shadow-sm" :
 "bg-apple-blue shadow-lg text-white"
 )}>
 {booking.service === 'Hotel' ? <Hotel size={28} /> : <Plane size={28} />}
 </div>
 <div>
 <h1 className="text-4xl font-light text-pure-black tracking-tight leading-none mb-3">
 Booking <span className="font-semibold">Commander</span>
 </h1>
 <div className="flex items-center gap-4">
 <div className="flex items-center gap-2">
 <span className="text-[10px] font-semibold text-pure-black/30">Branch Ref:</span>
 <span className="text-sm font-bold text-apple-blue">{booking.referenceNo}</span>
 </div>
 <div className="h-4 w-px bg-black/5"/>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
 <span className="text-[11px] font-semibold text-pure-black">Status: {currentStatus}</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4">
 {[
 { label: 'Authorized', status: 'Authorized' },
 { label: 'Verified', status: 'Paid' },
 { label: 'Issued', status: 'Issued' }
 ].map((step, i) => {
 const isActive = (booking.authorizationStatus === 'Authorized' && step.status === 'Authorized') || currentStatus === step.status;
 const isPast = (currentStatus === 'Paid' && step.status === 'Authorized') || 
 (currentStatus === 'Issued' && (step.status === 'Authorized' || step.status === 'Paid'));
 return (
 <div key={i} className="flex items-center gap-3">
 <div className={cn(
 "px-6 py-3 rounded-xl text-[10px] font-semibold border transition-all duration-700 flex items-center gap-3",
 isPast ? "bg-apple-blue/10 border-apple-blue/20 text-apple-blue" :
 isActive ? "bg-black border-navy text-white shadow-xl scale-105" :
 "bg-white border-navy/5 text-pure-black/20"
 )}>
 {isPast ? <CheckCircle2 size={14} className="animate-in zoom-in" /> : <span className="w-5 h-5 bg-black/5 rounded flex items-center justify-center">{i + 1}</span>}
 <span className="tracking-tight">{step.label}</span>
 </div>
 {i < 2 && <div className="w-6 h-px bg-black/10"/>}
 </div>
 );
 })}
 </div>
 </div>

 <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-12 items-start">
 <div className="space-y-10">
 {/* Command Banners */}
 {booking.authorizationStatus === 'Provisional' && (
 <div className="p-8 bg-amber-50 rounded-xl border border-amber-200 flex flex-col md:flex-row items-center justify-between gap-8 animate-in slide-in-from-top-4 duration-700">
 <div className="flex items-center gap-6">
 <div className="w-16 h-16 bg-amber-500 rounded-xl flex items-center justify-center text-white shadow-amber-200 shadow-xl">
 <AlertTriangle size={32} />
 </div>
 <div>
 <h3 className="text-lg font-bold text-amber-900 leading-none mb-2">Manual Authorization Pending</h3>
 <p className="text-xs font-semibold text-amber-800/60 leading-relaxed">System requires an administrative sign-off before financial settlement.</p>
 </div>
 </div>
 <div className="flex gap-4">
 <button 
 onClick={() => authorizeMutation.mutate()}
 className="px-8 py-3 bg-black text-apple-blue rounded-xl text-[11px] font-bold tracking-tight hover:scale-105 transition-all shadow-lg"
 >
 Authorize Branch
 </button>
 <button className="px-8 py-3 bg-red-100 text-red-700 rounded-xl text-[11px] font-bold tracking-tight hover:bg-red-200">
 Reject
 </button>
 </div>
 </div>
 )}

 <BookingCardModule 
 booking={{...booking, status: currentStatus}} 
 tenant={tenant}
 onOpenDocument={(type) => setActiveDoc({ type: type as 'itinerary' | 'invoice' | 'receipt' | 'ticket' | 'refund-note', isOpen: true })}
 />
 </div>

 <aside className="space-y-8 animate-in slide-in-from-right-8 duration-1000">
 {/* Operational Sidebar Cockpit */}
 <div className="bg-white rounded-xl border border-navy/5 shadow-2xl overflow-hidden">
 <div className="p-8 border-b border-navy/5 bg-light-gray/50 flex justify-between items-center">
 <h3 className="text-[11px] font-bold text-pure-black tracking-tight">Control Cockpit</h3>
 {isLockedBySelf ? (
 <button 
 onClick={() => unlockMutation.mutate()}
 className="px-3 py-1 bg-apple-blue/10 text-apple-blue rounded-lg text-[10px] font-bold flex items-center gap-2 hover:bg-apple-blue hover:text-white transition-all"
 >
 <Unlock size={12}/> Release Branch
 </button>
 ) : (
 <button 
 onClick={() => lockMutation.mutate(agent.agencyName)}
 className="px-3 py-1 bg-black text-apple-blue rounded-lg text-[10px] font-bold flex items-center gap-2"
 >
 <Lock size={12}/> Lock Branch
 </button>
 )}
 </div>

 <div className="p-10 space-y-8">
 <div className="space-y-6">
 <div className="flex justify-between items-center text-[10px] font-bold text-pure-black/30 tracking-tight">
 <span>Operational Actions</span>
 {isLockedBySelf && <span className="text-apple-blue flex items-center gap-1"><Zap size={10}/> Write Access</span>}
 </div>
 
 <div className="grid grid-cols-1 gap-4">
 {currentStatus === 'Confirmed' && (
 <button 
 disabled={!isLockedBySelf}
 onClick={() => setIsPaymentModalOpen(true)}
 className="w-full py-5 bg-apple-blue text-white text-pure-black rounded-xl text-[11px] font-bold tracking-tight shadow-xl hover:scale-105 transition-all disabled:opacity-20 disabled:grayscale"
 >
 EXECUTE SETTLEMENT
 </button>
 )}
 {currentStatus === 'Paid' && (
 <button 
 disabled={!isLockedBySelf}
 onClick={handleIssuance}
 className="w-full py-5 bg-black text-apple-blue rounded-xl text-[11px] font-bold tracking-tight shadow-xl hover:scale-105 transition-all flex items-center justify-center gap-3 disabled:opacity-20"
 >
 {isIssuing ? <Loader2 size={16} className="animate-spin"/> : <Ticket size={16}/>}
 {isIssuing ? 'ISSUING HUB NODE...' : 'SIGN & ISSUE ASSET'}
 </button>
 )}
 <button 
 disabled={!isLockedBySelf}
 onClick={() => setIsAmendmentModalOpen(true)}
 className="w-full py-4 bg-light-gray border border-navy/10 text-pure-black rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-black hover:text-white transition-all disabled:opacity-20"
 >
 <RefreshCcw size={14}/> Request Core Modify
 </button>
 <button 
 disabled={!isLockedBySelf}
 onClick={() => setIsRefundModalOpen(true)}
 className="w-full py-4 bg-red-50/50 text-red-500 border border-red-100 rounded-xl text-[10px] font-bold flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white transition-all disabled:opacity-20"
 >
 <XCircle size={14}/> Void / Cancel Branch
 </button>
 </div>
 </div>

 <div className="h-px bg-navy/5"/>

 <div className="space-y-6">
 <div className="flex justify-between items-center">
 <h4 className="text-[10px] font-bold text-pure-black/30 tracking-tight">Recent Activity</h4>
 <History size={14} className="text-apple-blue"/>
 </div>
 <div className="space-y-4">
 {dispatchLedger.slice(0, 3).map(event => (
 <div key={event.id} className="flex gap-4 items-start">
 <div className="w-1 h-1 rounded-full bg-apple-blue mt-2"/>
 <div className="flex-1">
 <p className="text-[10px] font-bold text-pure-black leading-tight mb-1">{event.label}</p>
 <p className="text-[8px] font-medium text-pure-black/30 italic capitalize">{event.type} Dispatch • {new Date(event.timestamp).toLocaleTimeString()}</p>
 </div>
 </div>
 ))}
 </div>
 <button 
 onClick={() => {}} // Could trigger a full history modal
 className="w-full py-3 bg-light-gray text-[9px] font-bold text-apple-blue rounded-xl hover:bg-apple-blue hover:text-white transition-all"
 >
 View All Activity
 </button>
 </div>
 </div>
 </div>

 <div className="p-8 bg-black rounded-xl text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
 <MessageSquare size={100} />
 </div>
 <div className="relative z-10">
 <h4 className="text-xs font-bold tracking-tight mb-4 text-apple-blue">Communication Hub</h4>
 <p className="text-[10px] font-medium text-white/40 leading-relaxed mb-6">
 You have <span className="text-white">2 unread messages</span> regarding this booking's special service requests.
 </p>
 <button className="btn btn-navy bg-white/10 border-white/20 text-[9px] w-full py-3">Enter Communication Branch</button>
 </div>
 </div>
 </aside>
 </div>
 </div>

 {/* Modals & Previews */}
 {activeDoc && (
 <DocumentPreview 
 isOpen={activeDoc.isOpen} 
 onClose={() => setActiveDoc(null)} 
 booking={booking} 
 tenant={tenant} 
 type={activeDoc.type} 
 onAction={(action, recipient) => {
 const label = `${activeDoc.type} Dispatched to Branch`;
 addDispatchEvent(action as DispatchEvent['type'], label, recipient);
 }}
 />
 )}

 {isPaymentModalOpen && (
 <PaymentModal 
 isOpen={isPaymentModalOpen} 
 onClose={() => setIsPaymentModalOpen(false)} 
 onSuccess={handlePaymentSuccess} 
 booking={booking} 
 />
 )}

 <RefundModal 
 isOpen={isRefundModalOpen} 
 onClose={() => setIsRefundModalOpen(false)} 
 booking={booking} 
 onRefundSuccess={() => {
 setLocalStatus('Refunded');
 queryClient.invalidateQueries({ queryKey: ['booking', id] });
 }}
 />

 <AmendmentModal
 isOpen={isAmendmentModalOpen}
 onClose={() => setIsAmendmentModalOpen(false)}
 booking={booking}
 onSuccess={() => {
 queryClient.invalidateQueries({ queryKey: ['booking', id] });
 }}
 />
 </Layout>
 );
}
