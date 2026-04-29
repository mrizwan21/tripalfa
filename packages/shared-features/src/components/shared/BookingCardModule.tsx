import { useState } from 'react';
import { 
  User, Plane, Hotel, CreditCard, 
  FileText, Globe, ShieldCheck, 
  Calendar, Receipt, Download,
  History, Settings2, Info, AlertTriangle, Scale, Clock, Zap,
  Database, ArrowRight, Ticket,
  Mail, MessageSquare, StickyNote, Building2, Landmark, Send
} from 'lucide-react';
import { cn } from '../../index';
import type { TenantConfig } from '../../context/TenantContext';
import type { Booking } from '../../types';

interface BookingCardModuleProps {
 booking: Booking;
 tenant: TenantConfig;
 onOpenDocument: (type: 'itinerary' | 'invoice' | 'receipt' | 'ticket' | 'refund-note') => void;
}

type TabType = 'traveller' | 'itinerary' | 'payment' | 'history' | 'rules' | 'document' | 'customer' | 'dispatch' | 'notes' | 'messages' | 'supplier-payment';

export default function BookingCardModule({ booking, tenant, onOpenDocument }: BookingCardModuleProps) {
 const [activeTab, setActiveTab] = useState<TabType>('itinerary');

 const tabs = [
 { id: 'itinerary', label: 'Sector Branch', icon: booking.service === 'Hotel' ? Hotel : Plane },
 { id: 'traveller', label: 'IdentityHub', icon: User },
 { id: 'customer', label: 'AccountNode', icon: Building2 },
 { id: 'payment', label: 'Settlement', icon: CreditCard },
 { id: 'supplier-payment', label: 'ProviderPay', icon: Landmark },
 { id: 'dispatch', label: 'DispatchHub', icon: Send },
 { id: 'notes', label: 'Notes', icon: StickyNote },
 { id: 'messages', label: 'Messages', icon: MessageSquare },
 { id: 'document', label: 'Assets', icon: FileText },
 { id: 'rules', label: 'Protocols', icon: Settings2 },
 { id: 'history', label: 'History', icon: History },
 ];

 const renderTraveller = () => (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-8 animate-fade-in">
 <div className="space-y-6">
 <div className="p-8 bg-white border border-black/5 rounded-xl shadow-apple relative group overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-apple-blue/5 rounded-pill -mr-16 -mt-16 blur-2xl group-hover:scale-125 transition-transform"/>
 <p className="text-[10px] font-semibold text-pure-black/20 tracking-tight mb-6 flex items-center gap-2">
 <User size={12} className="text-apple-blue"/> Primary Branch Identity
 </p>
 <div className="space-y-6 relative z-10">
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Full Legal Name (Pax 1)</span>
 <span className="text-xl font-semibold text-pure-black">{booking.passengerName}</span>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Branch DOB</span>
 <span className="text-sm font-semibold text-pure-black">{booking.passengerDob || '15 MAY 1990'}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Branch Nationality</span>
 <span className="text-sm font-semibold text-pure-black bg-apple-blue/5 px-2 py-0.5 rounded w-fit">{booking.passengerNationality || 'BHR'}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 <div className="space-y-6">
 <div className="p-8 bg-white border border-black/5 rounded-xl shadow-apple relative group overflow-hidden">
 <div className="absolute top-0 right-0 w-32 h-32 bg-black/5 rounded-pill -mr-16 -mt-16 blur-2xl"/>
 <p className="text-nano font-semibold text-black/20 tracking-tight mb-6 flex items-center gap-2">
 <ShieldCheck size={12} className="text-apple-blue"/> Regulatory Assets
 </p>
 <div className="space-y-6 relative z-10">
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Passport / Travel ID Branch</span>
 <span className="text-sm font-semibold text-pure-black">{booking.passengerPassport || 'P6788543'}</span>
 </div>
 <div className="grid grid-cols-2 gap-6">
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Branch Expiry</span>
 <span className="text-sm font-semibold text-red-500">{booking.passengerPassportExpiry || '31 DEC 2030'}</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Residency Hub</span>
 <span className="text-sm font-semibold text-pure-black">{booking.passengerResidency || 'Dubai, UAE'}</span>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 const renderItinerary = () => (
 <div className="animate-fade-in space-y-8">
 <div className="p-10 bg-near-black rounded-xl relative overflow-hidden group shadow-apple">
 <div className="absolute top-0 right-0 p-12 opacity-5 scale-150 rotate-12 transition-transform duration-1000 group-hover:rotate-45">
 <Globe size={300} />
 </div>
 <div className="absolute bottom-0 left-0 w-64 h-64 bg-apple-blue/10 rounded-pill -ml-32 -mb-32 blur-[100px]"/>
 
 <div className="relative z-10 space-y-10">
 <div className="flex justify-between items-start">
 <div className="space-y-4">
 <div className="flex items-center gap-3">
 <div className="w-10 h-10 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-apple-blue">
 {booking.service === 'Hotel' ? <Hotel size={20} /> : <Plane size={20} />}
 </div>
 <span className="text-[11px] font-semibold text-apple-blue tracking-tight">
 {booking.service} Sector Branch
 </span>
 </div>
 <h3 className="text-4xl font-semibold text-white leading-none">
 {booking.service === 'Hotel' ? booking.hotelName : booking.route}
 </h3>
 <div className="flex items-center gap-4">
 <div className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2">
 <Calendar size={12} className="text-apple-blue"/>
 <span className="text-[10px] font-semibold text-white">{booking.travelDate}</span>
 </div>
 {booking.pnr && (
 <div className="bg-apple-blue/10 border border-apple-blue/30 rounded-xl px-4 py-2 flex items-center gap-2">
 <span className="text-[9px] font-semibold text-apple-blue">PNR Branch:</span>
 <span className="text-[11px] font-semibold text-white tracking-tight">{booking.pnr}</span>
 </div>
 )}
 </div>
 </div>
 <div className="text-right">
 <div className="flex items-center gap-3 justify-end mb-4">
 <div className="w-2 h-2 rounded-pill bg-apple-blue animate-pulse"/>
 <span className="text-nano font-semibold text-apple-blue tracking-tight">Synchronized LIVE</span>
 </div>
 <div className="p-4 bg-white/5 border border-white/10 rounded-xl text-left">
 <p className="text-[8px] font-semibold text-white/20 mb-1">Carrier Link</p>
 <p className="text-sm font-semibold text-white">{booking.airline || booking.hotelName || 'GDS Hub'}</p>
 </div>
 </div>
 </div>

 <div className="grid grid-cols-4 gap-8 pt-10 border-t border-white/5">
 {[
 { label: 'Booking Origin', value: booking.bookingDate || '08 APR 2026', icon: <Clock size={12} /> },
 { label: 'Service Class', value: 'Economy Hub', icon: <Database size={12} /> },
 { label: 'Agent Branch', value: 'Az Travel Admin', icon: <User size={12} /> },
 { label: 'Provider synchronization', value: 'Sabre Api Stable', icon: <Zap size={12} /> }
 ].map((item, idx) => (
 <div key={idx} className="space-y-2">
 <p className="text-[8px] font-semibold text-white/20 flex items-center gap-2">
 {item.icon} {item.label}
 </p>
 <p className="text-xs font-bold text-white tracking-tight">{item.value}</p>
 </div>
 ))}
 </div>
 </div>
 </div>

 <div className="flex items-center justify-between p-8 bg-filter-bg rounded-xl border border-black/5">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-xl border border-black/5 flex items-center justify-center text-apple-blue shadow-sm">
 <Info size={20} />
 </div>
 <div>
 <p className="text-[11px] font-semibold text-pure-black leading-none mb-1">Operational Protocol</p>
 <p className="text-[10px] font-medium text-pure-black/30 tracking-tight">Stay synchronized with the carrier branch for real-time schedule updates.</p>
 </div>
 </div>
 <button className="px-6 py-3 bg-white border border-navy/10 text-pure-black text-[10px] font-semibold rounded-xl hover:bg-black hover:text-white transition-all">
 Audit Master Itinerary
 </button>
 </div>
 </div>
 );

 const renderPayment = () => {
 const customerGross = booking.amount + (booking.markup || 0);
 const supplierNet = booking.supplierCost || booking.amount * 0.95;
 const totalIncome = customerGross - supplierNet;

 return (
 <div className="animate-fade-in space-y-8">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 {/* Settlement Financials */}
 <div className="p-10 bg-white border border-black/5 rounded-xl shadow-apple relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-48 h-48 bg-apple-blue/5 rounded-pill -mr-24 -mt-24 blur-3xl"/>
 <p className="text-nano font-semibold text-black/20 tracking-tight mb-10">Financial Settlement Branch</p>
 
 <div className="space-y-8 relative z-10">
 <div className="flex justify-between items-end">
 <div>
 <span className="text-[9px] font-semibold text-pure-black/30 block mb-2">Agency Ledger Balance</span>
 <div className="flex items-baseline gap-2">
 <span className="text-md font-semibold text-pure-black/20">{tenant.currency}</span>
 <span className="text-4xl font-light text-pure-black tabular-nums leading-none">
 {customerGross.toLocaleString(undefined, {minimumFractionDigits: 3})}
 </span>
 </div>
 </div>
 <div className={cn(
"px-4 py-2 rounded-pill text-nano font-semibold border shadow-sm tracking-tight",
 booking.status ==='Confirmed' ?"bg-black/5 text-black/40 border-black/10 animate-pulse" :"bg-apple-blue/5 text-apple-blue border-apple-blue/20"
 )}>
 {booking.status === 'Confirmed' ? 'Settlement Pending' : 'Ledger Reconciled'}
 </div>
 </div>

 <div className="grid grid-cols-2 gap-6 pt-8 border-t border-navy/5">
 <div>
 <p className="text-[9px] font-semibold text-pure-black/20 mb-2">Supplier Net Branch</p>
 <p className="text-lg font-semibold text-pure-black tabular-nums">{tenant.currency} {supplierNet.toLocaleString()}</p>
 </div>
 <div>
 <p className="text-[9px] font-semibold text-apple-blue mb-2">Yield (Income)</p>
 <p className="text-lg font-semibold text-apple-blue tabular-nums">{tenant.currency} {totalIncome.toLocaleString()}</p>
 </div>
 </div>
 </div>
 </div>

 {/* Costing Breakup Hub */}
 <div className="p-10 bg-near-black rounded-xl shadow-apple relative overflow-hidden flex flex-col justify-between">
 <div className="absolute bottom-0 right-0 w-32 h-32 bg-apple-blue/10 rounded-pill -mr-16 -mb-16 blur-2xl"/>
 <div>
 <p className="text-[11px] font-semibold text-white/20 tracking-tight mb-8">Nodal Costing Protocol</p>
 <div className="space-y-6">
 <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-4">
 <span className="text-[10px] font-bold">Base Hub Rate</span>
 <span className="text-xs font-semibold">{tenant.currency} {booking.amount.toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center text-white/50 border-b border-white/5 pb-4">
 <span className="text-[10px] font-bold">Algorithm Markup</span>
 <span className="text-xs font-semibold text-apple-blue">+{tenant.currency} {(booking.markup || 0).toLocaleString()}</span>
 </div>
 <div className="flex justify-between items-center text-white pt-2">
 <span className="text-[12px] font-semibold tracking-tight">Total Total Value</span>
 <span className="text-2xl font-semibold text-apple-blue tabular-nums">{tenant.currency} {customerGross.toLocaleString()}</span>
 </div>
 </div>
 </div>
 <div className="mt-10 pt-6 border-t border-white/5 flex items-center justify-between">
 <div className="flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-apple-blue"/>
 <span className="text-[9px] font-semibold text-white/40">Method: {booking.paymentMethod || 'Agency Credit'}</span>
 </div>
 <button className="text-[9px] font-semibold text-apple-blue hover:text-white flex items-center gap-2">
 Audit Settlement <ArrowRight size={12} />
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 };

 const renderCustomer = () => (
 <div className="animate-fade-in space-y-8">
 <div className="p-10 bg-white border border-black/5 rounded-xl shadow-apple relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-48 h-48 bg-apple-blue/10 rounded-pill -mr-24 -mt-24 blur-3xl opacity-50"/>
 <p className="text-[11px] font-semibold text-pure-black/20 tracking-tight mb-10 flex items-center gap-2">
 <Building2 size={12} className="text-apple-blue"/> Customer Profile Branch
 </p>
 
 <div className="space-y-10 relative z-10">
 <div className="flex justify-between items-start">
 <div>
 <span className="text-[10px] font-bold text-apple-blue tracking-tight block mb-2">Corporate Entity</span>
 <h3 className="text-3xl font-semibold text-pure-black tracking-tight">{booking.customerAccount?.name || 'Ahlia University - Bahrain'}</h3>
 <p className="text-xs font-medium text-pure-black/40 mt-2">Account ID: {booking.customerAccount?.accountNo || 'ACC-99201-UA'}</p>
 </div>
 <div className="px-5 py-2 bg-black text-white rounded-xl text-[10px] font-semibold">
 {booking.customerAccount?.type || 'Corporate'} Account
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-2 gap-12 pt-10 border-t border-navy/5">
 <div className="space-y-6">
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Primary Contact Hub</span>
 <span className="text-sm font-semibold text-pure-black">Mr. Jassim Al-Mahmoud</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Authorized Branch Email</span>
 <span className="text-sm font-semibold text-apple-blue underline underline-offset-4">jassim@ahlia.edu.bh</span>
 </div>
 </div>
 <div className="space-y-6">
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Liquidity Score (Credit)</span>
 <span className="text-sm font-semibold text-pure-black">{tenant.currency} {booking.customerAccount?.creditLimit?.toLocaleString() || '25,000.000'} Available</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] font-semibold text-pure-black/30 mb-2">Outstanding Settlement</span>
 <span className="text-sm font-semibold text-red-500">{tenant.currency} {booking.customerAccount?.outstanding?.toLocaleString() || '4,200.500'} Pending</span>
 </div>
 </div>
 </div>
 </div>
 </div>

 <div className="p-8 bg-filter-bg border border-black/5 rounded-xl flex items-center justify-between group hover:bg-near-black hover:text-white transition-all duration-500 cursor-pointer">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-apple-blue shadow-sm group-hover:bg-apple-blue/20 group-hover:text-apple-blue">
 <User size={20} />
 </div>
 <div>
 <p className="text-[11px] font-semibold leading-none mb-1">View Intelligent Profile</p>
 <p className="text-[10px] font-medium opacity-40">Access historical ledger and trip patterns for this account branch.</p>
 </div>
 </div>
 <ArrowRight size={20} className="opacity-20 group-hover:opacity-100 transition-opacity" />
 </div>
 </div>
 );

 const renderDispatch = () => (
 <div className="animate-fade-in space-y-8">
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
 <div className="p-10 bg-white border border-navy/5 rounded-xl shadow-sm">
 <p className="text-[11px] font-semibold text-pure-black/20 tracking-tight mb-10">Dispatch Protocol</p>
 <div className="space-y-6">
 <div className="space-y-3">
 <label className="text-[10px] font-semibold text-pure-black/40 tracking-tight block ml-4">Recipient Branch</label>
 <input 
 type="email" 
 defaultValue="jassim@ahlia.edu.bh"
 className="w-full bg-light-gray border border-navy/5 rounded-xl px-6 py-4 text-[11px] font-semibold outline-none focus:ring-2 focus:ring-apple-blue/20"
 />
 </div>
 <div className="space-y-3">
 <label className="text-nano font-semibold text-black/40 tracking-tight block ml-4 upper-case">Asset Selection</label>
 <div className="grid grid-cols-2 gap-3">
 {['Itinerary', 'Invoice', 'Receipt', 'Ticket'].map(asset => (
 <label key={asset} className="flex items-center gap-3 p-4 bg-filter-bg rounded-xl border border-black/5 cursor-pointer hover:border-apple-blue/30 transition-all">
 <input type="checkbox" defaultChecked className="w-4 h-4 rounded-xl border-black/20 text-apple-blue" />
 <span className="text-nano font-semibold text-near-black">{asset}</span>
 </label>
 ))}
 </div>
 </div>
 <button className="w-full py-5 bg-near-black text-apple-blue rounded-xl text-nano font-semibold tracking-tight shadow-sm hover:scale-[1.02] transition-all flex items-center justify-center gap-3">
 <Send size={16} /> EXECUTE DISPATCH
 </button>
 </div>
 </div>

 <div className="p-10 bg-black rounded-xl shadow-2xl relative overflow-hidden text-white flex flex-col">
 <p className="text-[11px] font-semibold text-white/20 tracking-tight mb-10">Recent System Transmission</p>
 <div className="space-y-6 flex-1 overflow-y-auto max-h-[300px] custom-scrollbar pr-4">
 {[
 { label: 'Itinerary Dispatched', time: '10:24 AM', status: 'Sent' },
 { label: 'Invoice Constructed', time: '11:15 AM', status: 'Generated' },
 { label: 'Payment Receipt Sync', time: '09:42 AM', status: 'Live' }
 ].map((log, i) => (
 <div key={i} className="flex justify-between items-center p-5 bg-white/5 border border-white/5 rounded-xl">
 <div className="flex items-center gap-4">
 <div className="w-8 h-8 rounded-xl bg-apple-blue/10 flex items-center justify-center text-apple-blue"><Mail size={14} /></div>
 <div className="flex flex-col">
 <span className="text-nano font-semibold">{log.label}</span>
 <span className="text-xxxxs font-bold text-white/20">{log.time}</span>
 </div>
 </div>
 <span className="text-nano font-bold text-apple-blue">{log.status}</span>
 </div>
 ))}
 </div>
 <div className="mt-8 pt-6 border-t border-white/5 flex items-center gap-4 text-white/20">
 <Info size={16}/>
 <p className="text-[9px] font-medium leading-tight">All transmissions are logged in the systemic audit ledger for compliance verification.</p>
 </div>
 </div>
 </div>
 </div>
 );

 const renderNotes = () => (
 <div className="animate-fade-in space-y-8">
 <div className="p-10 bg-white border border-navy/5 rounded-xl shadow-sm overflow-hidden flex flex-col min-h-[500px]">
 <div className="flex justify-between items-center mb-10">
 <p className="text-[11px] font-semibold text-pure-black/20 tracking-tight">Administrative Logs</p>
 <button className="px-5 py-2 bg-light-gray border border-navy/10 rounded-xl text-[10px] font-semibold flex items-center gap-2 hover:bg-black hover:text-white transition-all">
 <StickyNote size={14} /> Add Internal Note
 </button>
 </div>
 
 <div className="space-y-6 flex-1">
 {(booking.notes || [
 { id: '1', author: 'System Branch', content: 'GDS PNR anchored successfully. Inventory locked.', level: 'System', timestamp: '2026-04-11T09:00:00Z' },
 { id: '2', author: 'Mohamed Rizwan', content: 'Customer requested bulkhead seat. Noted in SSR.', level: 'Internal', timestamp: '2026-04-11T10:30:00Z' }
 ]).map((note: { id: string; author: string; content: string; level: string; timestamp: string }) => (
 <div key={note.id} className="p-6 bg-light-gray border border-navy/5 rounded-xl relative group">
 <div className="flex justify-between items-start mb-4">
 <div className="flex items-center gap-3">
 <div className={cn("px-3 py-1 rounded-lg text-[8px] font-bold text-white tracking-tight", note.level === 'System' ? 'bg-black' : 'bg-apple-blue')}>
 {note.level}
 </div>
 <span className="text-xs font-bold text-pure-black">{note.author}</span>
 </div>
 <time className="text-[9px] font-semibold text-pure-black/30 tabular-nums">{new Date(note.timestamp).toLocaleTimeString()}</time>
 </div>
 <p className="text-sm font-medium text-pure-black/60 leading-relaxed tracking-tight">{note.content}</p>
 </div>
 ))}
 </div>
 </div>
 </div>
 );

 const renderMessages = () => (
 <div className="animate-fade-in space-y-8">
 <div className="p-10 bg-black rounded-xl shadow-2xl overflow-hidden flex flex-col min-h-[500px]">
 <div className="flex justify-between items-center mb-10">
 <p className="text-[11px] font-semibold text-apple-blue tracking-tight">Branch Communication Hub</p>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-pill bg-apple-blue animate-pulse"/>
 <span className="text-[10px] font-semibold text-apple-blue tracking-tight">Live Connection</span>
 </div>
 </div>
 
 <div className="flex-1 space-y-6 overflow-y-auto pr-4 custom-scrollbar">
 {(booking.messages || [
 { id: '1', sender: 'Corporate Admin', content: 'Please expedite the ticket issuance for Mr. Khan.', timestamp: '2026-04-11T11:00:00Z', isInternal: false },
 { id: '2', sender: 'Support Desk', content: 'Acknowledged. Verifying final settlement system now.', timestamp: '2026-04-11T11:05:00Z', isInternal: true }
 ]).map((msg: { id: string; sender: string; content: string; timestamp: string; isInternal: boolean }) => (
 <div key={msg.id} className={cn("flex flex-col max-w-[80%] space-y-2", msg.isInternal ? 'self-end items-end' : 'self-start items-start')}>
 <div className={cn("p-5 rounded-xl text-sm font-medium leading-relaxed", msg.isInternal ? 'bg-apple-blue text-white rounded-tr-none' : 'bg-white/10 text-white rounded-tl-none border border-white/5')}>
 {msg.content}
 </div>
 <div className="flex items-center gap-3 px-2">
 <span className="text-[9px] font-bold text-white/40">{msg.sender}</span>
 <span className="text-[8px] font-bold text-white/20">{new Date(msg.timestamp).toLocaleTimeString()}</span>
 </div>
 </div>
 ))}
 </div>

 <div className="mt-10 pt-8 border-t border-white/5">
 <div className="flex gap-4 p-4 bg-white/5 rounded-xl border border-white/10 group focus-within:border-apple-blue transition-all">
 <input 
 type="text" 
 placeholder="Inject message to hub..."
 className="flex-1 bg-transparent border-none text-white text-xs outline-none placeholder:text-white/20 px-4"
 />
 <button className="w-10 h-10 bg-apple-blue rounded-xl flex items-center justify-center text-pure-black hover:scale-105 transition-transform">
 <Send size={18} />
 </button>
 </div>
 </div>
 </div>
 </div>
 );

 const renderSupplierPayment = () => (
 <div className="animate-fade-in space-y-8">
 <div className="p-10 bg-white border border-navy/5 rounded-xl shadow-sm relative overflow-hidden group">
 <div className="absolute top-0 right-0 w-64 h-64 bg-light-gray rounded-full -mr-32 -mt-32 blur-3xl opacity-50"/>
 <p className="text-[11px] font-semibold text-pure-black/20 tracking-tight mb-10 flex items-center gap-2">
 <Landmark size={12} className="text-apple-blue"/> Provider Settlement Protocol
 </p>

 <div className="space-y-12 relative z-10">
 <div className="flex justify-between items-end">
 <div className="space-y-4">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
 <Globe size={24} />
 </div>
 <div>
 <h3 className="text-2xl font-semibold text-pure-black tracking-tight">{booking.airline || booking.hotelName || 'Sabre GDS Hub'}</h3>
 <p className="text-[10px] font-bold text-pure-black/30 tracking-tight mt-1">Provider Branch</p>
 </div>
 </div>
 </div>
 <div className="text-right">
 <span className="text-[10px] font-bold text-pure-black/30 block mb-2 tracking-tight text-apple-blue">Settlement Status</span>
 <div className={cn("px-6 py-2 rounded-xl text-[11px] font-bold border shadow-sm", 
 booking.supplierSettlementStatus === 'Settled' ? 'bg-apple-blue/10 text-apple-blue border-apple-blue/20' : 'bg-amber-50 text-amber-700 border-amber-200')}>
 {booking.supplierSettlementStatus || 'VOUCHED'}
 </div>
 </div>
 </div>

 <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-10 border-t border-navy/5">
 <div className="space-y-2">
 <p className="text-[9px] font-semibold text-pure-black/20 tracking-tight">Supplier Cost</p>
 <p className="text-xl font-semibold text-pure-black tabular-nums">{booking.currency} {booking.supplierCost?.toLocaleString() || (booking.amount * 0.95).toLocaleString()}</p>
 </div>
 <div className="space-y-2">
 <p className="text-[9px] font-semibold text-pure-black/20 tracking-tight">Settlement Date</p>
 <p className="text-xl font-semibold text-pure-black tabular-nums">15 APR 2026</p>
 </div>
 <div className="space-y-2">
 <p className="text-[9px] font-semibold text-pure-black/20 tracking-tight">Transaction ID</p>
 <p className="text-[11px] font-bold text-apple-blue tracking-tight mt-1">ST-8829104-ALPHA</p>
 </div>
 </div>

 <div className="p-8 bg-black rounded-xl text-white relative overflow-hidden group">
 <div className="absolute top-0 right-0 p-10 opacity-5 group-hover:rotate-12 transition-transform duration-700">
 <ShieldCheck size={100} />
 </div>
 <div className="flex gap-6 items-start relative z-10">
 <ShieldCheck size={24} className="text-apple-blue shrink-0 mt-1"/>
 <div>
 <h4 className="text-sm font-semibold mb-2">Provider Handshake Integrity</h4>
 <p className="text-[10px] font-medium text-white/40 leading-relaxed">
 Financial settlement with the supplier is managed via the systemic trust ledger. Discrepancies are flagged automatically to the compliance branch within T+1 operational hours.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 );

 const renderHistory = () => {
 const historicalNodes = [
 { action: 'Branch Initialized', user: 'System Bot', timestamp: booking.bookingDate || '08 APR 10:24', desc: 'PNR verification and inventory anchoring completed via GDS branch.' },
 { action: 'Profile Sync', user: 'Admin Riz', timestamp: '08 APR 11:15', desc: 'Passenger identity attributes synchronized with corporate CRM ledger.' },
 { action: 'Settlement Hub Idle', user: 'System Bot', timestamp: '08 APR 11:16', desc: 'Financial transaction branch opened. Monitoring agency credit liquidity.' },
 ];

 if (booking.status === 'Paid' || booking.status === 'Issued') {
 historicalNodes.unshift({ action: 'Ledger Settlement', user: 'Finance Gateway', timestamp: '09 APR 09:42', desc: 'Full outstanding balance reconciled. Settlement successful.' });
 }
 if (booking.status === 'Issued') {
 historicalNodes.unshift({ action: 'Branch Issuance Sign', user: 'Sabre Proxy', timestamp: '09 APR 09:45', desc: 'Electronic ticket branch signed. GDS issuance protocol finalized.' });
 }

 return (
 <div className="animate-fade-in p-4">
 <div className="relative space-y-12 before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before: before: before: before:">
 {historicalNodes.map((branch, i) => (
 <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
 {/* Icon Branch */}
 <div className="flex items-center justify-center w-10 h-10 rounded-full border border-navy/5 bg-white text-pure-black shadow-sm shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 group-hover:bg-black group-hover:text-apple-blue transition-all duration-500 z-10">
 <History size={16} />
 </div>
 {/* Content Branch */}
 <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-6 rounded-xl bg-light-gray border border-navy/5 shadow-sm group-hover:border-apple-blue/30 transition-all duration-500">
 <div className="flex items-center justify-between mb-2">
 <span className="text-[10px] font-semibold text-pure-black">{branch.action}</span>
 <time className="text-[9px] font-semibold text-pure-black/30 tabular-nums">{branch.timestamp}</time>
 </div>
 <p className="text-[11px] font-medium text-pure-black/60 leading-relaxed tracking-tight">{branch.desc}</p>
 <div className="mt-4 pt-3 border-t border-navy/5 flex items-center gap-2">
 <User size={10} className="text-apple-blue"/>
 <span className="text-xxxxs font-semibold text-pure-black/30 tracking-tight">Executed By: {branch.user}</span>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 );
 };

 const renderRules = () => (
 <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
 <div className="p-10 bg-white border border-navy/5 rounded-xl shadow-sm flex flex-col justify-between">
 <div>
 <div className="flex items-center gap-3 mb-8">
 <AlertTriangle size={20} className="text-red-500"/>
 <h4 className="text-[11px] font-semibold text-pure-black tracking-tight">Cancellation Protocol</h4>
 </div>
 <div className="space-y-6">
 <div className="p-6 bg-red-50 rounded-xl border border-red-100">
 <p className="text-[11px] font-bold text-red-900 tracking-tight leading-relaxed">
 THIS SECTOR IS NON-REFUNDABLE IN THE EVENT OF A VOLUNTARY VOID ACTION AFTER T+24 HOURS OF ISSUANCE.
 </p>
 </div>
 <div className="space-y-4 pt-4">
 <div className="flex justify-between items-center text-[10px] font-semibold text-pure-black/40">
 <span>Agency Admin Fee</span>
 <span className="text-pure-black">BHD 10.000</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-semibold text-pure-black/40">
 <span>Carrier Penalty</span>
 <span className="text-red-600">FULL BASE FARE</span>
 </div>
 </div>
 </div>
 </div>
 <button className="mt-12 py-4 bg-black text-white text-[10px] font-semibold rounded-xl hover:bg-black transition-all">
 Audit GDS Fare Rules Branch
 </button>
 </div>

 <div className="p-10 bg-white border border-navy/5 rounded-xl shadow-sm flex flex-col justify-between">
 <div>
 <div className="flex items-center gap-3 mb-8">
 <Scale size={20} className="text-apple-blue"/>
 <h4 className="text-[11px] font-semibold text-pure-black tracking-tight">Re-Issue Protocol</h4>
 </div>
 <div className="space-y-6">
 <div className="p-6 bg-light-gray rounded-xl border border-navy/5">
 <p className="text-[11px] font-medium text-pure-black/60 tracking-tight leading-relaxed">
 Date changes are permitted subject to fare difference and a fixed carrier fee branch.
 </p>
 </div>
 <div className="space-y-4 pt-4">
 <div className="flex justify-between items-center text-[10px] font-semibold text-pure-black/40">
 <span>Modification Branch Fee</span>
 <span className="text-pure-black">BHD 15.000</span>
 </div>
 <div className="flex justify-between items-center text-[10px] font-semibold text-pure-black/40">
 <span>Global Service Hub Fee</span>
 <span className="text-pure-black">BHD 5.000</span>
 </div>
 </div>
 </div>
 </div>
 <div className="mt-12 p-4 bg-apple-blue/5 border border-apple-blue/20 rounded-xl flex items-center gap-4">
 <AlertTriangle size={16} className="text-apple-blue"/>
 <p className="text-xxxxs font-bold text-pure-black/40 leading-none">Rules synchronized via GDS TST Branch-482. Penalties may fluctuate prior to re-issue sign-off.</p>
 </div>
 </div>
 </div>
 );

 const renderDocument = () => {
 type DocType = 'itinerary' | 'invoice' | 'receipt' | 'ticket' | 'refund-note';
 const docs: { type: DocType; label: string; icon: React.ComponentType<{ size?: number }>; status: string; color: string }[] = [
 { type: 'itinerary', label: 'Master Itinerary Asset', icon: Globe, status: 'Active', color: 'bg-black text-apple-blue' },
 { type: 'invoice', label: 'Tax Invoice Branch', icon: Receipt, status: 'Active', color: 'bg-black text-apple-blue' },
 { type: 'receipt', label: 'Financial Receipt', icon: CreditCard, status: (booking.status === 'Paid' || booking.status === 'Issued') ? 'Active' : 'Locked', color: 'bg-emerald-600 text-white shadow-emerald-200' },
 { type: 'ticket', label: 'Electronic Ticket GDS', icon: Ticket, status: booking.status === 'Issued' ? 'Active' : 'Locked', color: 'bg-apple-blue text-pure-black shadow-sm' },
 ];

 return (
 <div className="animate-fade-in grid grid-cols-1 md:grid-cols-2 gap-8">
 {docs.map((doc) => (
 <button
 key={doc.type}
 disabled={doc.status === 'Locked'}
 onClick={() => onOpenDocument(doc.type)}
 className={cn(
 "group flex items-center justify-between p-8 rounded-xl border transition-all text-left",
 doc.status === 'Locked' 
 ? "bg-light-gray border-transparent opacity-30 grayscale"
 : "bg-white border-navy/5 hover:border-apple-blue hover:shadow-2xl hover:translate-y-[-2px] shadow-sm"
 )}
 >
 <div className="flex items-center gap-8">
 <div className={cn("w-14 h-14 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-110", doc.color)}>
 <doc.icon size={24} />
 </div>
 <div>
 <h4 className="text-sm font-semibold text-pure-black tracking-tight leading-none mb-2">{doc.label}</h4>
 <p className="text-[10px] font-semibold text-pure-black/20 tracking-tight">{doc.status} Hub Asset</p>
 </div>
 </div>
 <div className="flex gap-2">
 <div className="w-10 h-10 rounded-xl bg-light-gray flex items-center justify-center text-pure-black/40 hover:bg-black hover:text-white transition-all"><Download size={16} /></div>
 </div>
 </button>
 ))}
 </div>
 );
 };

 const getContent = () => {
 switch (activeTab) {
 case 'itinerary': return renderItinerary();
 case 'traveller': return renderTraveller();
 case 'customer': return renderCustomer();
 case 'payment': return renderPayment();
 case 'supplier-payment': return renderSupplierPayment();
 case 'dispatch': return renderDispatch();
 case 'notes': return renderNotes();
 case 'messages': return renderMessages();
 case 'history': return renderHistory();
 case 'rules': return renderRules();
 case 'document': return renderDocument();
 default: return renderItinerary();
 }
 };

 return (
 <div className="bg-white rounded-xl border border-navy/5 shadow-2xl overflow-hidden animate-slide-up relative flex flex-col lg:flex-row min-h-[750px]">
 {/* Sidebar / Side tabs */}
 <div className="lg:w-[320px] bg-light-gray/50 border-b lg:border-b-0 lg:border-r border-navy/5 p-8 flex flex-col relative shrink-0">
 <div className="absolute top-0 left-0 w-full h-1 bg-apple-blue opacity-30"/>
 
 <div className="mb-10 animate-fade-in">
 <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center text-apple-blue shadow-sm border border-navy/5 mb-8">
 {booking.service === 'Hotel' ? <Hotel size={24} /> : <Plane size={24} />}
 </div>
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight mb-3">Booking Management System</p>
 <h3 className="text-2xl font-semibold text-pure-black leading-none">
 {booking.referenceNo}
 </h3>
 <div className="mt-4 flex items-center gap-2">
 <span className="px-2 py-1 bg-black/5 rounded text-[8px] font-semibold text-pure-black">
 Hub Sync: Live
 </span>
 </div>
 </div>

 <div className="flex lg:flex-col gap-3 flex-1 overflow-y-auto custom-scrollbar pr-2 pb-4 scrollbar-hide">
 {tabs.map((tab, idx) => (
 <button
 key={tab.id}
 onClick={() => setActiveTab(tab.id as TabType)}
 className={cn(
 "flex items-center gap-4 px-6 py-4 rounded-xl transition-all duration-500 relative group overflow-hidden shrink-0 lg:w-full text-left",
 activeTab === tab.id 
 ? "bg-black text-apple-blue shadow-sm scale-100"
 : "bg-white border border-navy/5 text-pure-black/40 hover:text-pure-black hover:border-apple-blue/30 hover:shadow-lg hover:scale-[1.02]"
 )}
 style={{ animationDelay: `${idx * 100}ms` }}
 >
 {activeTab === tab.id && <div className="absolute inset-0 bg-apple-blue/5 animate-pulse"/>}
 <div className={cn("p-3 rounded-xl transition-all", activeTab === tab.id ? "bg-white/10" : "bg-light-gray group-hover:bg-apple-blue/10 group-hover:text-apple-blue")}>
 <tab.icon size={20} className={cn("relative z-10 transition-transform duration-300", activeTab === tab.id ? "scale-110" : "group-hover:scale-110 group-hover:-rotate-3")} />
 </div>
 <div className="relative z-10 flex flex-col">
 <span className="text-[11px] font-semibold tracking-tight">{tab.label}</span>
 <span className={cn(
 "text-[8px] font-bold mt-0.5 transition-all",
 activeTab === tab.id ? "text-white/50 h-auto opacity-100 mt-1" : "h-0 opacity-0 overflow-hidden"
 )}>
 Active Branch
 </span>
 </div>
 </button>
 ))}
 </div>

 <div className="mt-8 pt-8 border-t border-navy/5">
 <p className="text-[9px] font-semibold text-pure-black/20 tracking-tight mb-4">Lifecycle Status</p>
 <div className="bg-white p-5 rounded-xl border border-navy/5 flex items-center justify-between shadow-sm relative overflow-hidden group hover:border-apple-blue/30 transition-colors">
 <div className="absolute top-0 right-0 w-8 h-8 bg-apple-blue/10 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"/>
 <div className="flex items-center gap-3 relative z-10">
 <div className={cn("w-2.5 h-2.5 rounded-pill ring-4 shadow-apple", booking.status === 'Issued' ? "bg-apple-blue ring-apple-blue/20 animate-pulse" : "bg-black/20 ring-black/5 animate-bounce")} />
 <span className="text-nano font-semibold text-near-black tracking-tight">{booking.status}</span>
 </div>
 <div className="text-[8px] font-semibold text-pure-black/30 relative z-10 flex items-center gap-1">
 <Zap size={10} className="text-apple-blue"/> LIVE
 </div>
 </div>
 </div>
 </div>

 {/* Main Content Branch */}
 <div className="flex-1 flex flex-col relative w-full overflow-hidden bg-white/50">
 <div className="p-8 lg:p-14 flex-1 overflow-y-auto">
 <div className="mb-12 flex items-center justify-between opacity-30 select-none">
 <h2 className="text-5xl font-semibold text-pure-black/5 mix-blend-multiply capitalize">
 {tabs.find(t => t.id === activeTab)?.label}
 </h2>
 <div className="w-12 h-px bg-black/20"/>
 </div>
 
 {/* Content Area */}
 <div className="relative z-10 min-h-[500px]">
 {getContent()}
 </div>
 </div>

 <div className="px-14 py-8 border-t border-navy/5 flex items-center justify-between bg-white backdrop-blur-md relative mt-auto">
 <div className="absolute top-0 left-0 w-2 h-full bg-apple-blue"/>
 <div className="absolute top-0 left-0 w-full h-px bg-apple-blue"/>
 <div className="flex items-center gap-6">
 <div className="w-12 h-12 bg-black rounded-[1rem] flex items-center justify-center text-apple-blue shadow-sm group transition-all duration-500 hover:scale-105 hover:rotate-3">
 <ShieldCheck size={24} />
 </div>
 <div>
 <p className="text-[11px] font-semibold text-pure-black tracking-tight leading-none mb-2">Ledger Integrity</p>
 <p className="text-[9px] font-bold text-apple-blue flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-apple"/> Synchronized & Secured Branch
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>
 );
}
