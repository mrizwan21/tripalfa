import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiManager } from '../index';
import { 
 Plus, CheckCircle2, Globe, 
 Trash2, Download, Mail, Plane, 
 Hotel, Search, Filter, Share2, 
 X, ShieldCheck,
 LayoutDashboard, ArrowRight
} from 'lucide-react';
import { format } from 'date-fns';
import { cn, useTenant } from '../index';
import { Layout } from '../components/Layout';
import { useApp } from '../context/AppContext';
import { useMultiSelect } from '../hooks/useMultiSelect';

export default function ItineraryBuilderPage() {
 const { tenant } = useTenant();
 const { addNotification } = useApp();
 const { selectedIds, toggleSelect: toggleSelection } = useMultiSelect();
 const [searchTerm, setSearchTerm] = useState('');
 const [showPreview, setShowPreview] = useState(false);

 const { data: bookings = [], isLoading } = useQuery({
 queryKey: ['bookings'],
 queryFn: () => apiManager.getBookings()
 });

 const filteredBookings = bookings.filter(b => 
 b.passengerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
 b.referenceNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
 (b.service === 'Hotel' && b.hotelName?.toLowerCase().includes(searchTerm.toLowerCase())) ||
 (b.service === 'Flight' && b.route?.toLowerCase().includes(searchTerm.toLowerCase()))
 );

 const selectedBookings = bookings.filter(b => selectedIds.includes(b.id));

 const handleCreateItinerary = () => {
 if (selectedIds.length === 0) return;
 setShowPreview(true);
 };

 const handleShare = () => {
 addNotification({
 title: 'Itinerary Shared',
 message: 'The consolidated itinerary has been sent to the passenger and relevant contacts.',
 type: 'success'
 });
 };

 const handleDownload = () => {
 addNotification({
 title: 'Itinerary Ready',
 message: 'Your consolidated travel document has been downloaded successfully.',
 type: 'success'
 });
 };

 return (
 <Layout>
 <div className="max-w-[1400px] mx-auto pb-20 animate-fade">
 {/* Apple Header */}
 <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-8 pb-10 border-b border-black/5">
 <div className="space-y-4">
 <div className="flex items-center gap-6">
 <div className="w-16 h-16 bg-black text-apple-blue rounded-xl flex items-center justify-center shadow-sm">
 <LayoutDashboard size={32} />
 </div>
 <div>
 <h1 className="text-[40px] font-display font-semibold text-pure-black tracking-tight leading-none">
 Itinerary <span className="text-apple-blue">Builder</span>
 </h1>
 <p className="text-[15px] font-text text-black/40 mt-3">Combine multiple bookings into a single, professional master document.</p>
 </div>
 </div>
 </div>

 <div className="flex items-center gap-4">
 <div className="flex bg-white border border-black/5 rounded-xl overflow-hidden shadow-sm focus-within:border-apple-blue/30 focus-within:ring-4 focus-within:ring-apple-blue/5 transition-all">
 <div className="px-4 flex items-center bg-light-gray text-black/30">
 <Search size={18} />
 </div>
 <input 
 type="text" 
 placeholder="Search reference or passenger..."
 className="px-6 py-3.5 text-[14px] font-text text-pure-black outline-none w-80 bg-white"
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 />
 </div>
 <button 
 onClick={handleCreateItinerary}
 disabled={selectedIds.length === 0}
 className="px-8 py-3.5 bg-black text-white rounded-xl text-[14px] font-text font-medium shadow-lg hover:bg-black/90 transition-all active:scale-95 disabled:opacity-20 flex items-center gap-2"
 >
 <Plus size={18} /> Create Master ({selectedIds.length})
 </button>
 </div>
 </div>

 <div className="grid grid-cols-1 xl:grid-cols-[1fr_380px] gap-12 items-start">
 {/* Booking Grid */}
 <div className="space-y-8">
 <div className="flex items-center justify-between px-2">
 <h2 className="text-[15px] font-display font-semibold text-pure-black flex items-center gap-3">
 <Filter size={16} className="text-apple-blue"/> Available Bookings
 </h2>
 <span className="text-[12px] font-text text-black/30">{filteredBookings.length} records found</span>
 </div>

 {isLoading ? (
 <div className="py-48 flex flex-col items-center gap-6">
 <div className="w-12 h-12 border-4 border-black/5 border-t-apple-blue rounded-full animate-spin"/>
 <span className="text-[14px] font-text text-black/40 animate-pulse">Loading booking history...</span>
 </div>
 ) : (
 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
 {filteredBookings.map((booking) => (
 <button
 key={booking.id}
 onClick={() => toggleSelection(booking.id)}
 className={cn(
 "group p-8 rounded-xl border-2 text-left transition-all duration-500 relative overflow-hidden",
 selectedIds.includes(booking.id) 
 ? "bg-black border-black text-white shadow-xl scale-[1.02]"
 : "bg-white border-black/5 text-pure-black hover:border-apple-blue/30 shadow-apple"
 )}
 >
 <div className="relative z-10 space-y-6">
 <div className="flex justify-between items-start">
 <div className="flex items-center gap-4">
 <div className={cn(
 "w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-500",
 selectedIds.includes(booking.id) ?"bg-white/10 text-apple-blue":"bg-light-gray text-black/30 group-hover:bg-apple-blue/10 group-hover:text-apple-blue"
 )}>
 {booking.service === 'Hotel' ? <Hotel size={22} /> : <Plane size={22} />}
 </div>
 <div>
 <p className={cn("text-[11px] font-text font-medium opacity-50", selectedIds.includes(booking.id) ? "text-white" : "text-black")}>{booking.referenceNo}</p>
 <h3 className="text-[17px] font-display font-semibold tracking-tight">{booking.service === 'Hotel' ? booking.hotelName : booking.route}</h3>
 </div>
 </div>
 <div className={cn(
 "w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-500",
 selectedIds.includes(booking.id) ?"bg-apple-blue border-apple-blue text-black shadow-[0_0_15px_rgba(0,113,227,0.5)]":"border-black/10 group-hover:border-apple-blue/40"
 )}>
 {selectedIds.includes(booking.id) && <CheckCircle2 size={16} />}
 </div>
 </div>

 <div className={cn("flex items-center gap-4 pt-6 border-t border-dashed", selectedIds.includes(booking.id) ? "border-white/10" : "border-black/5")}>
 <div className="flex-1">
 <p className="text-[10px] font-text font-bold tracking-tight opacity-40 mb-1">Traveler</p>
 <p className="text-[13px] font-text font-semibold">{booking.passengerName}</p>
 </div>
 <div className="flex-1 text-right">
 <p className="text-[10px] font-text font-bold tracking-tight opacity-40 mb-1">Date</p>
 <p className="text-[13px] font-text font-semibold">{booking.travelDate}</p>
 </div>
 </div>
 </div>
 
 <div className={cn(
 "absolute -right-4 -bottom-4 w-24 h-24 rounded-full blur-3xl transition-opacity duration-1000",
 selectedIds.includes(booking.id) ? "bg-apple-blue/20 opacity-100" : "bg-transparent opacity-0"
 )}/>
 </button>
 ))}
 </div>
 )}
 </div>

 {/* Builder Sidebar */}
 <aside className="sticky top-28 space-y-8 animate-fade">
 <div className="bg-white rounded-xl border border-black/5 p-8 shadow-apple relative overflow-hidden group">
 <div className="flex items-center justify-between mb-8">
 <h2 className="text-[15px] font-display font-semibold text-pure-black">Itinerary Builder</h2>
 <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center text-black/30">
 <Plus size={16} />
 </div>
 </div>

 {selectedBookings.length === 0 ? (
 <div className="py-24 px-10 text-center space-y-6 bg-light-gray/50 rounded-xl border border-dashed border-black/5">
 <div className="w-16 h-16 bg-white rounded-full mx-auto shadow-sm flex items-center justify-center text-black/10">
 <LayoutDashboard size={32} />
 </div>
 <p className="text-[13px] font-text text-black/40 leading-relaxed">
 Select bookings from the grid to begin building your consolidated itinerary.
 </p>
 </div>
 ) : (
 <div className="space-y-4">
 <div className="space-y-3 max-h-[400px] overflow-y-auto no-scrollbar pr-1">
 {selectedBookings.map((b) => (
 <div key={b.id} className="flex items-center gap-4 p-4 bg-light-gray rounded-xl border border-transparent hover:border-apple-blue/20 hover:bg-white hover:shadow-sm transition-all animate-fade group">
 <div className="w-10 h-10 rounded-[12px] bg-white flex items-center justify-center text-apple-blue shadow-sm">
 {b.service === 'Hotel' ? <Hotel size={18} /> : <Plane size={18} />}
 </div>
 <div className="flex-1 overflow-hidden">
 <p className="text-[13px] font-text font-semibold text-pure-black truncate">{b.service === 'Hotel' ? b.hotelName : b.route}</p>
 <p className="text-[11px] font-text text-black/40">{b.passengerName}</p>
 </div>
 <button 
 onClick={() => toggleSelection(b.id)}
 className="w-8 h-8 rounded-full flex items-center justify-center text-black/20 hover:text-rose-500 hover:bg-rose-50 transition-all opacity-0 group-hover:opacity-100"
 >
 <Trash2 size={16} />
 </button>
 </div>
 ))}
 </div>
 
 <div className="pt-8 mt-4 border-t border-black/5 space-y-6">
 <div className="flex justify-between items-center text-[13px] font-text px-2">
 <span className="text-black/40 font-medium">Consolidated Segments</span>
 <span className="text-pure-black font-semibold">{selectedIds.length} Bookings</span>
 </div>
 <button 
 onClick={handleCreateItinerary}
 className="w-full py-4 bg-black text-white rounded-xl text-[14px] font-text font-semibold shadow-lg hover:bg-black/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
 >
 Process Master Itinerary <ArrowRight size={18} />
 </button>
 </div>
 </div>
 )}
 </div>

 <div className="p-8 bg-apple-blue text-white rounded-xl shadow-lg relative overflow-hidden group">
 <div className="relative z-10 space-y-4">
 <div className="flex items-center gap-3">
 <div className="p-2 bg-white/20 rounded-lg">
 <ShieldCheck size={20} />
 </div>
 <h4 className="text-[15px] font-display font-semibold">Real-time Sync</h4>
 </div>
 <p className="text-[13px] font-text text-white/80 leading-relaxed font-medium">
 Itinerary segments are updated automatically when original records are modified.
 </p>
 </div>
 <Globe className="absolute -right-10 -bottom-10 w-48 h-48 opacity-10 group-hover:rotate-12 transition-transform duration-1000" />
 </div>
 </aside>
 </div>
 </div>

 {/* Full Screen Itinerary Preview */}
 {showPreview && (
 <div className="fixed inset-0 bg-black/95 backdrop-blur-[40px] z-[200] flex flex-col items-center justify-start p-8 animate-fade overflow-y-auto custom-scrollbar">
 <div className="w-full max-w-4xl space-y-8 animate-fade my-12">
 {/* Document Controls */}
 <div className="flex flex-wrap justify-between items-center bg-white/10 backdrop-blur-xl border border-white/10 p-6 rounded-xl gap-6">
 <div className="flex items-center gap-6">
 <div className="w-14 h-14 bg-white text-black rounded-xl flex items-center justify-center font-display font-bold text-lg shadow-xl">
 {tenant.id.substring(0,2)}
 </div>
 <div>
 <h2 className="text-white font-display font-semibold text-[17px]">{tenant.name}</h2>
 <p className="text-apple-blue text-[11px] font-text font-bold tracking-tight mt-1">Passenger Record • Unified</p>
 </div>
 </div>
 <div className="flex items-center gap-3">
 <button onClick={handleDownload} className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all" title="Download Record"><Download size={20} /></button>
 <button onClick={handleShare} className="w-12 h-12 bg-white/10 text-white rounded-xl flex items-center justify-center hover:bg-white/20 transition-all" title="Send to Passenger"><Mail size={20} /></button>
 <button onClick={() => setShowPreview(false)} className="w-12 h-12 bg-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all ml-4" title="Close"><X size={24} /></button>
 </div>
 </div>

 {/* Premium Document View */}
 <div className="bg-white rounded-xl overflow-hidden shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] relative">
 <div className="p-12 sm:p-24 space-y-16 relative z-10">
 {/* Brand & Reference */}
 <div className="flex flex-col sm:flex-row justify-between items-start border-b border-black/5 pb-12 gap-8">
 <div className="space-y-4">
 <h1 className="text-[48px] font-display font-light text-pure-black tracking-tight leading-none">Travel <span className="font-semibold text-apple-blue">Itinerary</span></h1>
 <div className="flex flex-wrap items-center gap-6 text-[12px] font-text font-bold tracking-tight text-black/30">
 <span>Ref: SABA-{Math.random().toString(36).substr(2,6).toUpperCase()}</span>
 <div className="w-1 h-1 rounded-full bg-black/10"/>
 <span>Date: {format(new Date(), 'dd MMMM yyyy')}</span>
 </div>
 </div>
 <div className="flex flex-col items-end gap-3 shrink-0">
 <span className="px-5 py-2 bg-apple-blue/10 text-apple-blue rounded-full text-[11px] font-text font-bold tracking-tight border border-apple-blue/20 flex items-center gap-2">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"/> Verified Record
 </span>
 </div>
 </div>

 {/* Timeline Segments */}
 <div className="space-y-16 relative">
 {/* Timeline Background Line */}
 <div className="absolute top-8 bottom-8 left-[39px] w-px bg-black/[0.03] border-l border-dashed hidden sm:block"/>
 
 {selectedBookings.map((seg, idx) => (
 <div key={seg.id} className="relative group/seg">
 <div className="flex flex-col sm:flex-row gap-12">
 {/* Timeline Connector Icon */}
 <div className="relative shrink-0 flex items-center justify-center sm:block">
 <div className={cn(
 "w-20 h-20 rounded-xl flex items-center justify-center shadow-sm z-20 relative transition-all duration-700",
 seg.service === 'Hotel' ? "bg-black text-apple-blue" : "bg-apple-blue text-white"
 )}>
 {seg.service === 'Hotel' ? <Hotel size={28} /> : <Plane size={28} />}
 </div>
 {idx < selectedBookings.length - 1 && (
 <div className="absolute top-20 left-1/2 -translate-x-1/2 w-4 h-[calc(4rem+20px)] border-l border-dashed border-black/10 hidden sm:block"/>
 )}
 </div>

 {/* Segment Details */}
 <div className="flex-1 space-y-6">
 <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
 <div>
 <div className="flex items-center gap-3 mb-2">
 <span className={cn(
"text-[10px] font-text font-bold tracking-tight px-3 py-1 rounded-full border",
 seg.service ==='Hotel' ?"bg-black text-white border-black" :"bg-apple-blue/5 text-apple-blue border-apple-blue/10"
 )}>
 {seg.service === 'Hotel' ? 'Accommodation' : 'Flight'}
 </span>
 </div>
 <h3 className="text-[28px] font-display font-semibold text-pure-black tracking-tight leading-tight">{seg.service === 'Hotel' ? seg.hotelName : seg.route}</h3>
 <div className="flex items-center gap-3 mt-2 text-[13px] font-text text-black/40 font-medium">
 <p>Reference: {seg.referenceNo}</p>
 <div className="w-1 h-1 rounded-full bg-black/10"/>
 <p>{seg.passengerName}</p>
 </div>
 </div>
 <div className="sm:text-right bg-light-gray/50 p-4 rounded-xl border border-black/5 min-w-[160px]">
 <p className="text-[10px] font-text font-bold tracking-tight text-black/30 mb-1">Travel Date</p>
 <p className="text-[18px] font-display font-bold text-pure-black">{seg.travelDate}</p>
 </div>
 </div>

 <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 p-8 bg-light-gray/40 rounded-xl border border-black/[0.03] hover:bg-white hover:shadow-xl hover:-translate-y-1 transition-all duration-500">
 <div className="space-y-1.5">
 <p className="text-[10px] font-text font-bold tracking-tight text-black/30">Confirmation</p>
 <p className="text-[15px] font-text font-bold text-apple-blue-dark tabular-nums tracking-tight">{seg.pnr || 'ZRY-849K'}</p>
 </div>
 <div className="space-y-1.5">
 <p className="text-[10px] font-text font-bold tracking-tight text-black/30">Class/Type</p>
 <p className="text-[15px] font-text font-bold text-pure-black">Premium {seg.service === 'Hotel' ? 'Room' : 'Economy'}</p>
 </div>
 <div className="space-y-1.5">
 <p className="text-[10px] font-text font-bold tracking-tight text-black/30">Status</p>
 <div className="flex items-center gap-2">
 <div className="w-2 h-2 rounded-full bg-emerald-500"/>
 <p className="text-[15px] font-text font-bold text-apple-blue">Confirmed</p>
 </div>
 </div>
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Document Footer */}
 <div className="pt-16 pb-4 border-t border-black/5 flex flex-col sm:flex-row justify-between items-center gap-8">
 <div className="flex items-center gap-6 opacity-30 grayscale grayscale-0">
 <div className="p-3 bg-black rounded-xl text-apple-blue">
 <ShieldCheck size={28} />
 </div>
 <div>
 <p className="text-[11px] font-text font-bold tracking-tight text-pure-black">Verified Document</p>
 <p className="text-[10px] font-text text-black/60 font-medium">Digitally signed & synchronized by system protocols.</p>
 </div>
 </div>
 <div className="flex gap-4 w-full sm:w-auto">
 <button 
 onClick={handleDownload}
 className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-black text-white rounded-xl text-[13px] font-text font-bold shadow-lg hover:bg-black/80 transition-all"
 >
 <Download size={18} /> Download PDF
 </button>
 <button 
 onClick={handleShare}
 className="flex-1 sm:flex-none flex items-center justify-center gap-3 px-8 py-4 bg-apple-blue text-white rounded-xl text-[13px] font-text font-bold shadow-lg hover:bg-link-blue transition-all"
 >
 <Share2 size={18} /> Send to Traveler
 </button>
 </div>
 </div>
 </div>
 </div>
 
 <p className="text-center text-white/20 text-[12px] font-text font-medium pb-12">
 &copy; 2026 {tenant.name} • Managed by Saba B2B Portal
 </p>
 </div>
 </div>
 )}
 </Layout>
 );
}
