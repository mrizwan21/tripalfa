import { useState } from 'react';
import { Layout } from '../components/Layout';
import { 
 Calendar as CalendarIcon, 
 ChevronRight, 
 Plane, 
 Hotel,
 Activity,
 Users,
 Zap,
 Database,
 Box,
 Layers,
} from 'lucide-react';
import { generateCalendarMatrix } from '../lib/calendarUtils';
import DayDetailModal from '../components/shared/DayDetailModal';
import { cn, type Booking } from '../index';

export default function TravelCalendarPage() {
 const [currentDate] = useState(new Date(2026, 3, 8));
 const [viewFilter, setViewFilter] = useState<'all' | 'flight' | 'hotel' | 'group' | 'offline'>('all');
 const [loading] = useState(false);
 const [selectedDay, setSelectedDay] = useState<{ date: Date; bookings: Booking[] } | null>(null);
 const [bookings] = useState<Booking[]>([]);
 
 const month = currentDate.getMonth();
 const year = currentDate.getFullYear();
 const calendarMatrix = generateCalendarMatrix(month, year, bookings);

 return (
 <Layout>
 <div className="max-w-[1600px] mx-auto animate-fade-in space-y-12 px-6 lg:px-12 pb-32">
 
 {/* Cinematic Temporal Header */}
 <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-12 border-b border-navy/5 pb-12 mt-16">
 <div className="space-y-6">
 <div className="flex items-center gap-4">
 <div className="w-2.5 h-2.5 rounded-full bg-apple-blue animate-pulse glow-gold"/>
 <span className="text-[10px] font-semibold text-pure-black/30 tracking-tight">Temporal Manifest Hub: CAL-SYNC</span>
 </div>
 <h1 className="text-5xl lg:text-7xl font-semibold text-pure-black leading-none flex items-center gap-8">
 <div className="w-16 h-16 lg:w-20 lg:h-20 bg-pure-black text-apple-blue rounded-xl lg:rounded-xl flex items-center justify-center shadow-sm">
 <CalendarIcon size={40} />
 </div>
 Temporal <span className="text-apple-blue">Manifest</span>
 </h1>
 <div className="flex items-center gap-4">
 <span className="text-[11px] font-semibold text-pure-black/40 bg-light-gray px-5 py-2 rounded-xl border border-navy/5">Global Scheduling Ledger Stable</span>
 <div className="flex items-center gap-2 px-4 py-2 bg-apple-blue/10 rounded-xl border border-apple-blue/20 font-mono">
 <Activity size={14} className="text-apple-blue animate-pulse"/>
 <span className="text-[9px] font-semibold text-apple-blue leading-none">REALTIME_TEMPORAL_SYNC</span>
 </div>
 </div>
 </div>
 
 {/* Handshake Filter System */}
 <div className="flex bg-light-gray p-2 rounded-xl shadow-inner border border-navy/5">
 {[
 { id: 'all', label: 'Master Nodes', icon: Layers },
 { id: 'flight', label: 'AVIATION', icon: Plane },
 { id: 'hotel', label: 'HOSPITALITY', icon: Hotel },
 { id: 'group', label: 'Group Sync', icon: Users },
 { id: 'offline', label: 'Void', icon: Zap },
 ].map(f => (
 <button
 key={f.id}
 onClick={() => setViewFilter(f.id as typeof viewFilter)}
 className={cn(
"flex items-center gap-4 px-8 py-5 rounded-xl text-[10px] font-semibold tracking-tight transition-all duration-700 relative overflow-hidden group/tab",
 viewFilter === f.id
 ?"bg-pure-black text-apple-blue shadow-sm scale-105 z-10"
 :"bg-transparent text-pure-black/30 hover:text-pure-black hover:bg-white"
 )}
 >
 <f.icon size={18} className={cn(viewFilter === f.id ?"text-apple-blue":"text-pure-black/20")} />
 <span className="hidden xl:inline">{f.label}</span>
 </button>
 ))}
 </div>
 </div>

 {/* Global Calendar Infrastructure */}
 <div className="bg-white rounded-xl border border-navy/5 shadow-sm overflow-hidden relative group/calendar">
 {loading && (
 <div className="absolute inset-0 z-50 backdrop-blur-md bg-white/40 flex flex-col items-center justify-center gap-8">
 <div className="relative">
 <Loader2 className="animate-spin text-apple-blue opacity-10"size={80} />
 <div className="absolute inset-0 flex items-center justify-center">
 <Database size={32} className="text-pure-black opacity-20"/>
 </div>
 </div>
 <span className="text-[12px] font-semibold text-pure-black/10 tracking-tight animate-pulse">Recalibrating Temporal Grid...</span>
 </div>
 )}

 {/* Weekday Grid */}
 <div className="grid grid-cols-7 border-b border-navy/5 bg-light-gray/50 relative overflow-hidden">
 <div className="absolute inset-0 bg-apple-blue/5 opacity-0 group-hover/calendar:opacity-100 transition-opacity duration-1000 -skew-x-12 translate-x-1/2"/>
 {['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((day) => (
 <div key={day} className="py-8 text-center text-[11px] font-semibold text-pure-black/30 tracking-tight border-r border-navy/5 last:border-r-0 relative z-10">
 {day}
 </div>
 ))}
 </div>

 <div className="divide-y divide-navy/5 relative z-10">
 {calendarMatrix.map((week, weekIdx) => (
 <div key={weekIdx} className="grid grid-cols-7 divide-x divide-navy/5 min-h-[180px]">
 {week.map((day, dayIdx) => {
 const isToday = day.date.toDateString() === new Date().toDateString();
 const hasFlights = day.bookings.some(b => b.service === 'Flight');
 const hasHotels = day.bookings.some(b => b.service === 'Hotel');
 const hasGroups = day.bookings.some(b => b.referenceNo?.startsWith('GRP-'));

 return (
 <div 
 key={dayIdx} 
 onClick={() => day.bookings.length > 0 && setSelectedDay({ date: day.date, bookings: day.bookings })}
 className={cn(
"relative group/day p-6 transition-all duration-700",
 !day.isCurrentMonth ?"bg-light-gray/30 opacity-10":"bg-white hover:bg-light-gray/50 cursor-pointer shadow-inner-sm",
 day.bookings.length > 0 &&"hover:shadow-sm z-10"
 )}
 >
 <div className="flex justify-between items-start mb-6">
 <div className={cn(
"text-lg font-semibold transition-all duration-500",
 isToday ?"w-12 h-12 bg-pure-black text-apple-blue rounded-xl flex items-center justify-center shadow-sm scale-110":"text-pure-black group-hover/day:text-apple-blue"
 )}>
 {day.date.getDate()}
 </div>
 {day.bookings.length > 0 && (
 <div className="flex flex-col items-end">
 <span className="px-3 py-1 bg-pure-black text-apple-blue-dark rounded-xl text-[10px] font-semibold shadow-sm group-hover/day:scale-110 transition-transform">
 {day.bookings.length} SHARDS
 </span>
 </div>
 )}
 </div>

 <div className="space-y-3 mt-auto">
 {hasFlights && (
 <div className="flex items-center gap-3 text-sky-600 transition-all group-hover/day:translate-x-1">
 <div className="w-1.5 h-1.5 rounded-full bg-sky-500 shadow-sky"/>
 <span className="text-[9px] font-semibold">{day.bookings.filter(b => b.service === 'Flight').length} AVIATION</span>
 </div>
 )}
 {hasHotels && (
 <div className="flex items-center gap-3 text-rose-600 transition-all group-hover/day:translate-x-1">
 <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-rose"/>
 <span className="text-[9px] font-semibold">{day.bookings.filter(b => b.service === 'Hotel').length} HOSPITALITY</span>
 </div>
 )}
 {hasGroups && (
 <div className="flex items-center gap-3 text-apple-blue-dark transition-all group-hover/day:translate-x-1">
 <div className="w-1.5 h-1.5 rounded-full bg-apple-blue shadow-sm"/>
 <span className="text-[9px] font-semibold">{day.bookings.filter(b => b.referenceNo?.startsWith('GRP-')).length} GROUP</span>
 </div>
 )}
 </div>

 {day.bookings.length > 0 && (
 <div className="absolute bottom-6 right-6 opacity-0 group-hover/day:opacity-100 transition-all duration-500 translate-x-4 group-hover/day:translate-x-0">
 <ChevronRight size={16} className="text-apple-blue"/>
 </div>
 )}
 {isToday && (
 <div className="absolute top-0 left-0 w-full h-[3px] bg-apple-blue shadow-sm"/>
 )}
 </div>
 );
 })}
 </div>
 ))}
 </div>
 </div>

 {/* Temporal Stats Matrix */}
 <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-8">
 {[
 { label: 'Total Temporal Volume', value: bookings.filter(b => dayInsideMonth(new Date(b.travelDate), month, year)).length, icon: CalendarIcon, color: 'navy', desc: 'Active Month Nodes' },
 { label: 'Flight Bookings', value: bookings.filter(b => b.service === 'Flight' && dayInsideMonth(new Date(b.travelDate), month, year)).length, icon: Plane, color: 'sky', desc: 'Provider Flight' },
 { label: 'Properties', value: bookings.filter(b => b.service === 'Hotel' && dayInsideMonth(new Date(b.travelDate), month, year)).length, icon: Hotel, color: 'rose', desc: 'Provider Hotel' },
 { label: 'Group Manifests', value: bookings.filter(b => b.referenceNo?.startsWith('GRP-') && dayInsideMonth(new Date(b.travelDate), month, year)).length, icon: Users, color: 'gold', desc: 'Aggregate Groups' },
 ].map((stat, i) => (
 <div key={i} className="bg-white p-10 rounded-xl border border-navy/5 shadow-sm group hover:bg-light-gray hover:shadow-sm transition-all duration-700 relative overflow-hidden">
 <div className="absolute top-0 right-0 p-12 opacity-[0.03] group-hover:scale-125 transition-transform duration-1000 text-pure-black pointer-events-none">
 <stat.icon size={100} />
 </div>
 
 <div className="flex items-center justify-between mb-8 relative z-10">
 <div className={cn(
"w-14 h-14 rounded-xl flex items-center justify-center transition-all duration-500 shadow-sm",
 stat.color === 'navy' ?"bg-pure-black text-apple-blue": 
 stat.color === 'sky' ?"bg-sky-50 text-sky-600 border border-sky-100":
 stat.color === 'rose' ?"bg-rose-50 text-rose-600 border border-rose-100":"bg-apple-blue/10 text-apple-blue-dark border border-gold/20"
 )}>
 <stat.icon size={28} />
 </div>
 <div className="w-1.5 h-1.5 rounded-full bg-pure-black/10 group-hover:bg-apple-blue transition-colors shadow-sm-sm"/>
 </div>

 <div className="relative z-10">
 <p className="text-[11px] font-semibold text-pure-black/30 tracking-tight mb-3 leading-none">{stat.label}</p>
 <div className="text-3xl lg:text-4xl font-semibold text-pure-black tabular-nums leading-none">
 {stat.value}
 </div>
 <div className="mt-4 flex items-center gap-2">
 <div className="w-1 h-1 rounded-full bg-pure-black/10"/>
 <span className="text-[9px] font-semibold text-pure-black/10 tracking-tight">{stat.desc}</span>
 </div>
 </div>
 </div>
 ))}
 </div>

 {/* Global Advisory Branch */}
 <div className="pt-16 pb-12 flex flex-col items-center gap-10 text-center relative">
 <div className="absolute top-1/2 left-0 w-full h-px bg-pure-black opacity-[0.03] -z-10"/>
 <div className="flex items-center gap-8 bg-white px-12 relative z-10">
 <Box size={24} className="text-pure-black opacity-20"/>
 <div className="w-20 h-px bg-apple-blue/30"/>
 <Zap size={24} className="text-apple-blue"/>
 </div>
 <p className="text-[11px] font-semibold text-pure-black/20 tracking-tight leading-[2.8] max-w-5xl">
"TEMPORAL MANIFEST NODES ARE SYNCHRONIZED ACROSS THE DISTRIBUTED INVENTORY NEXUS. 
 <br />DIRECTIVE SCHEDULING IS SUBJECT TO GOVERNANCE AUDITING PROTOCOLS. 
 NODAL VISUALIZATION IS INHERITED FROM THE AUTHORITATIVE MASTER LEDGER."
 </p>
 <div className="flex items-center gap-3">
 <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-emerald"/>
 <span className="text-[8px] font-semibold text-pure-black/10 tracking-tight font-mono">AUTH::TEMPORAL_HUB_7F221B</span>
 </div>
 </div>

 </div>

 <DayDetailModal 
 isOpen={!!selectedDay}
 onClose={() => setSelectedDay(null)}
 date={selectedDay?.date || new Date()}
 bookings={selectedDay?.bookings || []}
 />
 </Layout>
 );
}

const Loader2 = ({ size, className }: { size?: number, className?: string }) => (
 <svg 
 width={size} 
 height={size} 
 viewBox="0 0 24 24"
 fill="none"
 stroke="currentColor"
 strokeWidth="2"
 strokeLinecap="round"
 strokeLinejoin="round"
 className={className}
 >
 <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
 </svg>
);

function dayInsideMonth(date: Date, month: number, year: number) {
 return date.getMonth() === month && date.getFullYear() === year;
}