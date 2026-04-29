import { useState } from 'react';
import { 
 X, Printer, Download, Mail, 
 Plane, Hotel, CheckCircle2,
 ShieldCheck, FileText, Ticket, RotateCcw
} from 'lucide-react';
import EmailPreviewModal from './EmailPreviewModal';
import type { Booking } from '../../types';
import type { TenantConfig } from '../../context/TenantContext';
import { useApp } from '../../context/AppContext';

interface DocumentPreviewProps {
 isOpen: boolean;
 onClose: () => void;
 booking: Booking;
 tenant: TenantConfig;
 type: 'itinerary' | 'invoice' | 'receipt' | 'ticket' | 'refund-note';
 onAction?: (action: 'email' | 'download', recipient?: string) => void;
}

export default function DocumentPreview({ isOpen, onClose, booking, tenant, type, onAction }: DocumentPreviewProps) {
 const { addNotification } = useApp();
 const [showEmailModal, setShowEmailModal] = useState(false);
 const [isGenerating, setIsGenerating] = useState(false);
 const [progress, setProgress] = useState(0);

 if (!isOpen) return null;

 const handlePrint = () => {
 window.print();
 };

 const handleDownload = async () => {
 setIsGenerating(true);
 setProgress(0);
 
 // Simulate cinematic PDF construction protocol
 for (let i = 0; i <= 100; i += 5) {
 setProgress(i);
 await new Promise(resolve => setTimeout(resolve, 100));
 }
 
 setIsGenerating(false);
 addNotification({
 title: 'PDF System Generated',
 message: `${type} for ${booking.referenceNo} has been downloaded to your local branch.`,
 type: 'success'
 });
 onAction?.('download');
 };

 const handleEmail = (email: string) => {
 onAction?.('email', email);
 setShowEmailModal(false);
 };

 const isHotel = booking.service === 'Hotel';
 const subtotal = booking.amount;
 const markup = booking.markup || 0;
 const total = subtotal + markup;

 const renderItinerary = () => (
 <div className="space-y-8">
 <div className="flex justify-between items-start border-b border-navy/10 pb-8">
 <div>
 <h2 className="text-2xl font-light text-pure-black tracking-tight">Travel <span className="font-semibold">Itinerary</span></h2>
 <p className="text-[10px] font-bold text-pure-black/30 mt-1">Status: {booking.status}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-semibold text-pure-black/30">Reference</p>
 <p className="text-lg font-bold text-pure-black tabular-nums">{booking.referenceNo}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="p-6 bg-light-gray rounded-xl border border-navy/5">
 <h3 className="text-[10px] font-semibold text-pure-black/30 mb-4">Passenger</h3>
 <p className="text-sm font-bold text-pure-black">{booking.passengerName}</p>
 </div>
 <div className="p-6 bg-light-gray rounded-xl border border-navy/5">
 <h3 className="text-[10px] font-semibold text-pure-black/30 mb-4">Booking Date</h3>
 <p className="text-sm font-bold text-pure-black">{booking.bookingDate || new Date().toDateString()}</p>
 </div>
 </div>

 <div className="p-8 border border-navy/10 rounded-xl space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
 {isHotel ? <Hotel size={24} /> : <Plane size={24} />}
 </div>
 <div>
 <h4 className="text-lg font-bold text-pure-black tracking-tight">
 {isHotel ? booking.hotelName : (booking.airline || 'Scheduled Flight')}
 </h4>
 <p className="text-xs font-medium text-pure-black/40">
 {isHotel ? 'Premium Hospitality Branch' : `${booking.route} Sector Sync`}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-3 gap-4 pt-6 mt-6 border-t border-navy/5">
 <div>
 <p className="text-[9px] font-semibold text-pure-black/20">Travel Date</p>
 <p className="text-xs font-bold text-pure-black">{booking.travelDate}</p>
 </div>
 <div>
 <p className="text-[9px] font-semibold text-pure-black/20">PNR / Conf</p>
 <p className="text-xs font-bold text-apple-blue-dark tabular-nums">{booking.pnr || 'PENDING'}</p>
 </div>
 <div>
 <p className="text-[9px] font-semibold text-pure-black/20">Service</p>
 <p className="text-xs font-bold text-pure-black">{booking.service}</p>
 </div>
 </div>
 </div>

 <div className="p-6 bg-black rounded-xl text-white">
 <div className="flex items-start gap-3">
 <ShieldCheck size={16} className="text-apple-blue mt-0.5"/>
 <div>
 <p className="text-[10px] font-semibold">Booking Policy</p>
 <p className="text-[10px] font-medium text-white/60 leading-relaxed mt-1">
 This itinerary is confirmed on the global ledger. Please present this document at the time of {isHotel ? 'check-in' : 'boarding'}. Passport validation is mandatory.
 </p>
 </div>
 </div>
 </div>
 </div>
 );

 const renderInvoice = () => (
 <div className="space-y-8">
 <div className="flex justify-between items-start border-b border-navy/10 pb-8">
 <div>
 <h2 className="text-2xl font-light text-pure-black tracking-tight">Tax <span className="font-semibold">Invoice</span></h2>
 <p className="text-[10px] font-bold text-pure-black/30 mt-1">Invoice: {booking.invoiceNo || `INV-${booking.referenceNo}`}</p>
 </div>
 <div className="text-right">
 <p className="text-[10px] font-semibold text-pure-black/30">Total Amount</p>
 <p className="text-2xl font-light text-pure-black tabular-nums">
 <span className="text-sm font-bold mr-1 opacity-30">{booking.currency}</span>
 {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
 </p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8">
 <div className="space-y-3">
 <h3 className="text-[10px] font-semibold text-pure-black/30">Bill To</h3>
 <p className="text-sm font-bold text-pure-black">{booking.passengerName}</p>
 <p className="text-[10px] font-medium text-pure-black/40 leading-relaxed">
 Customer Identification: Verified<br/>
 Branch: {booking.service} Service
 </p>
 </div>
 <div className="space-y-3 text-right">
 <h3 className="text-[10px] font-semibold text-pure-black/30">Agent Branch</h3>
 <p className="text-sm font-bold text-pure-black">{tenant.name}</p>
 <p className="text-[10px] font-medium text-pure-black/40 leading-relaxed">
 {tenant.id}<br/>
 {tenant.currency} Payment Status
 </p>
 </div>
 </div>

 <table className="w-full border-collapse">
 <thead>
 <tr className="bg-light-gray text-[10px] font-semibold text-pure-black/30 border-y border-navy/5">
 <th className="py-4 px-6 text-left">Description</th>
 <th className="py-4 px-6 text-right">Base</th>
 <th className="py-4 px-6 text-right">Tax/Fees</th>
 <th className="py-4 px-6 text-right">Total</th>
 </tr>
 </thead>
 <tbody className="text-sm font-bold text-pure-black tabular-nums">
 <tr className="border-b border-navy/5">
 <td className="py-6 px-6">
 <div className="text-xs font-bold">{booking.service} Reservation</div>
 <div className="text-[9px] font-medium text-pure-black/40">{booking.referenceNo} • {booking.travelDate}</div>
 </td>
 <td className="py-6 px-6 text-right">{subtotal.toLocaleString()}</td>
 <td className="py-6 px-6 text-right">{markup.toLocaleString()}</td>
 <td className="py-6 px-6 text-right">{total.toLocaleString()}</td>
 </tr>
 </tbody>
 </table>

 <div className="flex justify-end pt-6">
 <div className="w-48 space-y-3">
 <div className="flex justify-between text-[11px] font-semibold text-pure-black/30">
 <span>Subtotal</span>
 <span className="text-pure-black">{total.toLocaleString()}</span>
 </div>
 <div className="flex justify-between text-[11px] font-semibold text-pure-black/30 border-t border-navy/10 pt-3">
 <span>Total {booking.currency}</span>
 <span className="text-xl font-light text-pure-black">{total.toLocaleString()}</span>
 </div>
 </div>
 </div>
 </div>
 );

 const renderReceipt = () => (
 <div className="space-y-8 flex flex-col items-center">
 <div className="w-20 h-20 bg-apple-blue rounded-xl flex items-center justify-center text-near-black shadow-apple mb-4">
 <CheckCircle2 size={40} />
 </div>
 <div className="text-center">
 <h2 className="text-2xl font-light text-pure-black tracking-tight">Official <span className="font-semibold">Receipt</span></h2>
 <p className="text-[10px] font-semibold text-pure-black/30 mt-1">Receipt Branch: {booking.referenceNo}-REC</p>
 </div>

 <div className="w-full space-y-4">
 <div className="p-8 bg-light-gray rounded-xl border border-navy/5 space-y-6">
 <div className="flex justify-between items-center text-xxxxs font-semibold text-pure-black/20 tracking-tight">
 <span>Settlement Authorization</span>
 <span>Ref: {booking.referenceNo}</span>
 </div>

 <div className="flex flex-col items-center py-4">
 <span className="text-sm font-bold text-pure-black/40 mb-1">Total Financial Settlement</span>
 <h2 className="text-5xl font-semibold text-pure-black tabular-nums">
 <span className="text-sm font-bold mr-1 opacity-30">{booking.currency}</span>
 {total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
 </h2>
 </div>

 <div className="grid grid-cols-2 gap-4 pt-6 border-t border-navy/5">
 <div>
 <span className="text-[9px] font-semibold text-pure-black/30 block mb-1">Payment Method</span>
 <p className="text-xs font-bold text-pure-black">{booking.paymentMethod || 'AGENCY WALLET'}</p>
 </div>
 <div className="text-right">
 <span className="text-[9px] font-semibold text-pure-black/30 block mb-1">Settlement Date</span>
 <p className="text-xs font-bold text-pure-black">{booking.paymentDate || new Date().toDateString()}</p>
 </div>
 </div>
 </div>

 <div className="p-6 bg-black rounded-xl text-left border border-white/10 relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:scale-110 transition-transform duration-700">
 <ShieldCheck size={80} />
 </div>
 <div className="relative z-10 flex items-start gap-4">
 <ShieldCheck size={18} className="text-apple-blue mt-1 shrink-0"/>
 <div>
 <p className="text-[10px] font-semibold text-white">Nodal Trust Verification</p>
 <p className="text-[10px] font-medium text-white/40 leading-relaxed mt-2">
 This transaction has been successfully recorded in the agency trust ledger. This document serves as a valid proof of payment for services rendered.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 const renderRefundNote = () => (
 <div className="space-y-8 flex flex-col items-center">
 <div className="w-20 h-20 bg-black/80 rounded-xl flex items-center justify-center text-white shadow-apple mb-4">
 <RotateCcw size={40} />
 </div>
 <div className="text-center">
 <h2 className="text-2xl font-light text-pure-black tracking-tight">Refund <span className="font-semibold">Note</span></h2>
 <p className="text-[10px] font-semibold text-pure-black/30 mt-1">Debit Memo: {booking.referenceNo}-RM</p>
 </div>

 <div className="w-full space-y-4">
 <div className="grid grid-cols-2 gap-4">
 <div className="p-6 bg-light-gray rounded-xl border border-navy/5 text-left">
 <h3 className="text-[9px] font-semibold text-pure-black/30 mb-1">Original Booking</h3>
 <p className="text-sm font-bold text-pure-black">{booking.referenceNo}</p>
 <p className="text-[10px] font-medium text-pure-black/40">{booking.bookingDate || 'Processed'}</p>
 </div>
 <div className="p-6 bg-light-gray rounded-xl border border-navy/5 text-left">
 <h3 className="text-[9px] font-semibold text-pure-black/30 mb-1">Refund Date</h3>
 <p className="text-sm font-bold text-pure-black">{booking.refundDate ? new Date(booking.refundDate).toDateString() : new Date().toDateString()}</p>
 <p className="text-[10px] font-medium text-pure-black/40">Authorized</p>
 </div>
 </div>

 <div className="p-8 border border-navy/10 rounded-xl space-y-6 bg-white shadow-sm">
 <div className="space-y-4">
 <div className="flex justify-between items-center text-xs font-bold text-pure-black/40">
 <span>Gross Booking Amount</span>
 <span className="text-pure-black">{booking.currency} {booking.amount.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center text-xs font-bold text-red-500">
 <span>Cancellation Penalty</span>
 <span>- {booking.currency} {(booking.amount - (booking.refundAmount || 0)).toLocaleString()}</span>
 </div>
 <div className="h-px bg-black/5"/>
 <div className="flex justify-between items-end">
 <div>
 <span className="text-[9px] font-semibold text-pure-black/30 block mb-1">Net Refund to Branch</span>
 <span className="text-4xl font-light text-green-600 tabular-nums">
 <span className="text-sm font-bold mr-1 opacity-30">{booking.currency}</span>
 {(booking.refundAmount || booking.amount).toLocaleString()}
 </span>
 </div>
 <div className="text-right">
 <span className="text-[9px] font-semibold text-pure-black/30 block mb-1">Status</span>
 <span className="px-3 py-1 bg-green-500/10 text-green-700 rounded-lg text-[10px] font-semibold">Credited</span>
 </div>
 </div>
 </div>
 </div>

 <div className="p-6 bg-black rounded-xl text-left border border-white/10">
 <div className="flex items-start gap-4">
 <FileText size={18} className="text-apple-blue mt-1 shrink-0"/>
 <div>
 <p className="text-[10px] font-semibold text-white">Refund Basis / Authority</p>
 <p className="text-[10px] font-medium text-white/60 leading-relaxed mt-2">
 {booking.refundNoteText || 'Standard involuntary refund processed via hub master branch. Funds have been synchronized with the agent wallet ID.'}
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 const renderTicket = () => (
 <div className="space-y-8">
 <div className="relative p-8 bg-black rounded-xl overflow-hidden text-white shadow-sm border border-white/10">
 <div className="absolute top-0 right-0 p-8 opacity-10">
 {isHotel ? <Hotel size={120} /> : <Plane size={120} />}
 </div>
 
 <div className="relative space-y-8">
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-apple-blue/20 rounded-xl text-apple-blue">
 <Ticket size={24} />
 </div>
 <div>
 <h2 className="text-xl font-semibold text-white leading-none">
 {isHotel ? 'Hotel Voucher' : 'Electronic Ticket'}
 </h2>
 <p className="text-[9px] font-bold text-white/40 tracking-tight mt-1">GDS Protocol Issued</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-[9px] font-semibold text-white/30">Ticket No.</p>
 <p className="text-lg font-bold text-apple-blue tabular-nums">{booking.ticketNo || '065-5581038506'}</p>
 </div>
 </div>

 <div className="grid grid-cols-2 gap-8 border-y border-white/10 py-8 my-8">
 <div>
 <p className="text-[9px] font-semibold text-white/30 mb-1">Traveller Name</p>
 <p className="text-sm font-bold">{booking.passengerName}</p>
 </div>
 <div className="text-right">
 <p className="text-[9px] font-semibold text-white/30 mb-1">PNR / Conf</p>
 <p className="text-sm font-bold text-apple-blue-light tabular-nums">{booking.pnr || 'ZRY-849'}</p>
 </div>
 </div>

 <div className="flex justify-between items-end">
 <div>
 <p className="text-[9px] font-semibold text-white/30 mb-1">Sector / Identity</p>
 <p className="text-xs font-bold">{isHotel ? booking.hotelName : booking.route}</p>
 <p className="text-[9px] font-bold text-white/40">{booking.travelDate}</p>
 </div>
 <div className="text-right space-y-2">
 <div className="px-3 py-1 bg-white/10 rounded-lg text-[9px] font-semibold inline-block">
 Class: Economy
 </div>
 <div className="text-[8px] font-semibold text-white/20 tracking-tight block">
 Issued: {booking.issuedDate || new Date().toDateString()}
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-6 bg-light-gray rounded-xl border border-navy/10 flex items-start gap-4">
 <Info size={16} className="text-pure-black/20 mt-1"/>
 <div className="space-y-1">
 <h4 className="text-[10px] font-semibold text-pure-black">Usage Instructions</h4>
 <p className="text-[10px] font-medium text-pure-black/40 leading-relaxed">
 Kindly present this digital voucher at the service branch. For flights, web check-in is recommended 24 hours prior to departure. Hotel check-in time is standard 14:00 local time.
 </p>
 </div>
 </div>
 </div>
 );

 const getContent = () => {
 switch (type) {
 case 'itinerary': return renderItinerary();
 case 'invoice': return renderInvoice();
 case 'receipt': return renderReceipt();
 case 'ticket': return renderTicket();
 case 'refund-note': return renderRefundNote();
 }
 };

 return (
 <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] flex items-center justify-center p-6 animate-fade-in overflow-y-auto">
 <div className="bg-white rounded-xl w-full max-w-2xl overflow-hidden shadow-sm border border-white/20 animate-slide-up relative my-auto">
 
 {/* PDF Construction Protocol Overlay */}
 {isGenerating && (
 <div className="absolute inset-0 bg-black/95 backdrop-blur-xl z-[200] flex flex-col items-center justify-center p-12 text-center animate-fade-in">
 <div className="w-24 h-24 bg-apple-blue rounded-xl flex items-center justify-center text-pure-black shadow-sm animate-pulse mb-8">
 <RotateCcw size={40} className="animate-spin-slow"/>
 </div>
 <h3 className="text-2xl font-semibold text-white mb-4">
 PDF Construction <span className="text-apple-blue">Protocol</span>
 </h3>
 <p className="text-[10px] font-semibold text-white/30 tracking-tight mb-12 max-w-xs">
 Preparing your document...
 </p>
 
 <div className="w-full max-w-xs space-y-4">
 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden border border-white/10 p-0.5">
 <div 
 className="h-full bg-apple-blue rounded-full transition-all duration-300 shadow-sm"
 style={{ width: `${progress}%` }}
 />
 </div>
 <div className="flex justify-between items-center text-[9px] font-semibold text-apple-blue tracking-tight">
 <span>Status: Calibrating System</span>
 <span className="tabular-nums">{progress}%</span>
 </div>
 </div>
 </div>
 )}

 {/* Header Actions */}
 <div className="absolute top-6 right-6 flex items-center gap-2 z-10">
 <button 
 onClick={handlePrint}
 className="w-10 h-10 rounded-xl bg-light-gray flex items-center justify-center text-pure-black hover:bg-black hover:text-white transition-all shadow-sm"
 title="Print Document"
 >
 <Printer size={16} />
 </button>
 <button 
 onClick={onClose}
 className="w-10 h-10 rounded-xl bg-black/5 flex items-center justify-center text-near-black hover:bg-black/10 transition-all shadow-sm"
 title="Close"
 >
 <X size={16} />
 </button>
 </div>

 <div className="p-12 sm:p-16">
 <div className="flex items-center gap-4 mb-10 pb-6 border-b border-navy/5">
 <div className="w-10 h-10 bg-black text-white rounded-lg flex items-center justify-center font-semibold text-xs">
 {tenant.id.substring(0,2)}
 </div>
 <div>
 <h1 className="text-lg font-semibold text-pure-black tracking-tight leading-none">{tenant.name}</h1>
 <p className="text-[8px] font-bold text-pure-black/30 tracking-tight mt-1">System ID: {tenant.id}</p>
 </div>
 </div>

 <div id="printable-area">
 {getContent()}
 </div>

 <div className="mt-12 flex items-center justify-center gap-6 pt-8 border-t border-navy/5">
 <button 
 onClick={handleDownload}
 className="flex items-center gap-2 px-6 py-3 bg-light-gray border border-navy/10 rounded-xl text-[10px] font-semibold text-pure-black hover:bg-black hover:text-white transition-all">
 <Download size={14} /> Download PDF
 </button>
 <button 
 onClick={() => setShowEmailModal(true)}
 className="flex items-center gap-2 px-6 py-3 bg-light-gray border border-navy/10 rounded-xl text-[10px] font-semibold text-pure-black hover:bg-black hover:text-white transition-all">
 <Mail size={14} /> Send Email
 </button>
 </div>
 </div>
 </div>

 <EmailPreviewModal 
 isOpen={showEmailModal}
 onClose={() => setShowEmailModal(false)}
 onSend={handleEmail}
 documentType={type.replace('-', ' ')}
 referenceNo={booking.referenceNo}
 recipientName={booking.passengerName}
 />
 </div>
 );
}

const Info = ({ size, className }: { size?: number; className?: string }) => <FileText size={size} className={className} />;
