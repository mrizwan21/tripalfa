import { X, Plane, Hotel, User, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../../index';
import type { Booking } from '../../types';

interface DayDetailModalProps {
 isOpen: boolean;
 onClose: () => void;
 date: Date;
 bookings: Booking[];
}

export default function DayDetailModal({ isOpen, onClose, date, bookings }: DayDetailModalProps) {
 const navigate = useNavigate();
 if (!isOpen) return null;

 return (
 <div className="fixed inset-0 z-[100] flex items-center justify-end p-6 backdrop-blur-sm bg-black/20 animate-fade-in">
 <div 
 className="bg-white w-full max-w-xl h-full rounded-xl shadow-sm shadow-2xl overflow-hidden animate-slide-left relative flex flex-col"
 >
 <button 
 onClick={onClose}
 className="absolute top-10 right-10 w-12 h-12 rounded-xl bg-light-gray flex items-center justify-center text-pure-black hover:bg-light-gray transition-all z-10 border border-navy/5"
 >
 <X size={20} />
 </button>

 <div className="p-12 border-b border-navy/5 bg-light-gray/50">
 <div className="space-y-1">
 <p className="text-[10px] font-semibold text-pure-black/30 tracking-tight">Internal Ledger</p>
 <h2 className="text-4xl font-semibold text-pure-black tracking-tight">
 {date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}
 </h2>
 </div>
 <div className="flex gap-4 mt-8">
 <div className="px-4 py-2 bg-black text-white rounded-xl text-[10px] font-semibold flex items-center gap-2">
 <Plane size={14} className="text-apple-blue"/> {bookings.filter(b => b.service === 'Flight').length} Flights
 </div>
 <div className="px-4 py-2 bg-black/5 text-pure-black rounded-xl text-[10px] font-semibold flex items-center gap-2">
 <Hotel size={14} /> {bookings.filter(b => b.service === 'Hotel').length} Hotels
 </div>
 </div>
 </div>

 <div className="flex-1 overflow-y-auto p-12 space-y-6 custom-scrollbar">
 {bookings.length > 0 ? bookings.map((booking) => (
 <div 
 key={booking.id}
 className="group p-8 bg-white border border-navy/5 rounded-xl hover:border-apple-blue/30 hover:shadow-stripe transition-all duration-500 relative overflow-hidden"
 >
 <div className="flex justify-between items-start mb-6">
 <div className="flex items-center gap-4">
 <div className={cn(
"w-12 h-12 rounded-xl flex items-center justify-center shadow-inner",
 booking.service === 'Flight' ?"bg-blue-50 text-blue-600":"bg-orange-50 text-orange-600"
 )}>
 {booking.service === 'Flight' ? <Plane size={24} /> : <Hotel size={24} />}
 </div>
 <div>
 <h4 className="text-lg font-semibold text-pure-black tracking-tight leading-none mb-1">
 {booking.service === 'Hotel' ? booking.hotelName : booking.route}
 </h4>
 <p className="text-[9px] font-semibold text-pure-black/30">{booking.airline || 'Standard Branch'}</p>
 </div>
 </div>
 <div className="text-right">
 <p className="text-[9px] font-semibold text-pure-black/20 mb-1">PNR Branch</p>
 <p className="text-sm font-semibold text-apple-blue-dark">{booking.pnr}</p>
 </div>
 </div>

 <div className="flex items-center justify-between pt-6 border-t border-navy/5">
 <div className="flex items-center gap-3">
 <div className="w-8 h-8 rounded-full bg-light-gray flex items-center justify-center text-pure-black/40">
 <User size={14} />
 </div>
 <span className="text-xs font-bold text-pure-black">{booking.passengerName}</span>
 </div>
 <button 
 onClick={() => navigate(`/itinerary/${booking.id}`)}
 className="flex items-center gap-2 text-[10px] font-semibold text-pure-black hover:text-apple-blue transition-colors"
 >
 Open Card <ExternalLink size={12} />
 </button>
 </div>
 </div>
 )) : (
 <div className="py-20 text-center opacity-20 space-y-4">
 <div className="w-20 h-20 bg-light-gray rounded-full flex items-center justify-center mx-auto">
 <Plane size={40} />
 </div>
 <p className="text-[10px] font-semibold tracking-tight">No nodal travel archived for this date</p>
 </div>
 )}
 </div>

 <div className="p-10 border-t border-navy/5 bg-light-gray relative overflow-hidden">
 <div className="absolute top-0 left-0 w-1 h-full bg-apple-blue"/>
 <p className="text-xxxxs font-semibold text-pure-black/30 leading-none mb-2">Internal Hub Governance</p>
 <p className="text-[10px] font-bold text-pure-black/60">All travel nodes reflect the current synchronized state of the GDS ledger.</p>
 </div>
 </div>
 </div>
 );
}
