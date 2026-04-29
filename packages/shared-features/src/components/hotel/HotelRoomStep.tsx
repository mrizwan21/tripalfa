import { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { useTenant } from '../../context/TenantContext';
import { useQuery } from '@tanstack/react-query';
import { apiManager, cn, BookingActions, TravellerSelectionModal } from '../../index';
import { Loader2, ArrowLeft, Share2, Heart, Star, MapPin, Check, TrendingUp, ImageIcon, Calendar, Utensils, Navigation } from 'lucide-react';
import { calculateStackedMarkup } from '../../utils/markupUtils';
import type { Hotel } from '../../types';

export function HotelRoomStep({ onNext, onBack }: { onNext: () => void, onBack: () => void }) {
  const { tenant } = useTenant();
  const { agent, selectedHotelId, setSelectedRoomId } = useApp();
  const [markupRules, setMarkupRules] = useState<any[]>([]);
  const [hotel, setHotel] = useState<Hotel | null>(null);

  const { data: selectedHotel, isLoading } = useQuery({
    queryKey: ['hotel', selectedHotelId],
    queryFn: () => apiManager.getHotelById(selectedHotelId!),
    enabled: !!selectedHotelId
  });

  useEffect(() => {
    if (selectedHotel) {
      setHotel(selectedHotel);
    }
  }, [selectedHotel]);
  
  const [activeTab, setActiveTab] = useState('rooms');
  const [selectedImg, setSelectedImg] = useState(0);
 
  const handleBookRoom = (roomId: string) => {
    setSelectedRoomId(roomId);
    onNext();
  };
 
  const stackedMarkup = useMemo(() => {
    if (!hotel) return 0;
    return calculateStackedMarkup(
      hotel.price,
      markupRules,
      { hotelStars: hotel.stars, destinationCode: hotel.city }
    ).totalMarkup;
  }, [hotel, markupRules]);
 
 const finalPrice = hotel ? hotel.price + stackedMarkup : 0;

 return (
 <>
 {isLoading || !hotel ? (
 <div className="flex justify-center items-center py-60">
 <Loader2 className="animate-spin text-pure-black"size={40} />
 </div>
 ) : (
 <>
 <div className="hotel-detail-header mb-12 animate-in fade-in slide-in-from-top-4 duration-500">
 <div className="flex justify-between items-center mb-8">
 <button 
 onClick={onBack}
 className="group flex items-center gap-3 px-4 py-2 border border-navy/10 rounded-xl text-[10px] font-semibold text-pure-black hover:bg-black hover:text-white transition-all shadow-sm"
 >
 <ArrowLeft size={12} className="group-hover:-translate-x-1 transition-transform"/> 
 Back to Results Hub
 </button>
 <div className="flex items-center gap-4">
 <div className="flex bg-light-gray p-1 rounded-xl">
 <button className="p-2 text-pure-black hover:bg-white hover:shadow-sm rounded-lg transition-all"><Share2 size={16} /></button>
 <button className="p-2 text-pure-black hover:bg-white hover:shadow-sm rounded-lg transition-all"><Heart size={16} /></button>
 </div>
 <button 
 onClick={() => setActiveTab('rooms')}
 className="px-8 py-3 bg-black text-apple-blue text-[10px] font-semibold rounded-xl shadow-sm hover:scale-105 transition-all"
 >
 Reserve Master Branch
 </button>
 </div>
 </div>
 
 <div className="bg-white border border-navy/5 rounded-xl p-10 flex flex-col md:flex-row justify-between items-start md:items-center shadow-stripe relative overflow-hidden group">
 <div className="absolute top-0 left-0 w-full h-1 bg-apple-blue opacity-30"/>
 <div className="flex-1 min-w-0">
 <div className="flex items-center gap-4 mb-2">
 <h1 className="text-3xl font-semibold text-pure-black tracking-tight truncate">{hotel.name}</h1>
 <div className="flex gap-1">
 {[...Array(hotel.stars)].map((_, i) => (
 <Star key={i} size={14} className="text-apple-blue fill-gold shadow-sm-sm"/>
 ))}
 </div>
 </div>
 <div className="flex items-center gap-6">
 <div className="flex items-center gap-2 px-3 py-1 bg-light-gray border border-black/5 rounded-lg text-[9px] font-bold text-slate-500">
 <MapPin size={12} className="text-apple-blue-dark"/> {hotel.address}
 </div>
 <div className="text-[9px] font-semibold text-pure-black/30 tracking-tight ml-2">Property Audit ID: {hotel.id.split('-')[1]} • SYNCED</div>
 </div>
 </div>
 
 <div className="mt-6 md:mt-0 flex items-center gap-8">
 <div className="text-right border-r border-black/5 pr-8">
 <div className="text-[9px] font-semibold text-near-black/40 mb-1">Foundational Branch Rate</div>
 <div className="flex items-baseline gap-1">
 <span className="text-sm font-semibold text-pure-black">{hotel.currency}</span>
 <span className="text-4xl font-semibold text-pure-black tabular-nums leading-none">
 {finalPrice.toLocaleString(undefined, {minimumFractionDigits: 2})}
 </span>
 </div>
 </div>
 <div className="flex flex-col gap-2">
 <div className="px-3 py-1 bg-apple-blue/10 text-apple-blue text-[8px] font-semibold rounded-lg flex items-center gap-2">
 <Check size={10} /> Tax Inclusive Branch
 </div>
 {stackedMarkup > 0 && (
 <div className="px-3 py-1 bg-amber-50 text-amber-600 text-[8px] font-semibold rounded-lg flex items-center gap-2 animate-pulse">
 <TrendingUp size={10} /> Multi-Stack Applied
 </div>
 )}
 </div>
 </div>
 </div>
 </div>

 {/* Cinematic Stage (Gallery) */}
 <div className="grid grid-cols-12 gap-6 mb-12 h-[500px] animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150">
 <div className="col-span-8 rounded-xl overflow-hidden relative shadow-apple group border-[6px] border-white">
 <img src={hotel.images[selectedImg]} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"/>
 <div className="absolute inset-0 bg-apple-blue opacity-60"/>
 
 <div className="absolute top-8 left-8 flex flex-col gap-2">
 <div className="bg-white/90 backdrop-blur-md px-4 py-2 rounded-xl shadow-xl border border-white/20 flex items-center gap-3">
 <div className="w-8 h-8 bg-apple-blue rounded-xl flex items-center justify-center text-pure-black shadow-sm-sm">
 <ImageIcon size={14} />
 </div>
 <div className="flex flex-col">
 <span className="text-[10px] font-semibold text-pure-black leading-none">Visual Master Branch</span>
 <span className="text-[8px] font-bold text-pure-black/40 tracking-tight mt-1">Audit {selectedImg + 1} / {hotel.images.length} Captured</span>
 </div>
 </div>
 </div>

 <div className="absolute bottom-10 left-10 right-10 flex justify-between items-end">
 <div className="max-w-md bg-white/10 backdrop-blur-lg p-6 rounded-xl border border-white/10 shadow-apple">
 <p className="text-[10px] font-medium text-white/90 leading-relaxed tracking-tight italic">
"Property maintains high-density nodal standards across all wings. Exterior visual synchronization confirmed via global hub audits."
 </p>
 </div>
 </div>
 </div>
 
 <div className="col-span-4 flex flex-col gap-6 h-full">
 {hotel.images.slice(0, 3).map((img, idx) => (
 <div 
 key={idx} 
 className={cn(
"flex-1 rounded-xl overflow-hidden cursor-pointer transition-all duration-500 border-4",
 selectedImg === idx ?"border-apple-blue scale-[0.98] shadow-sm-sm":"border-white opacity-60 hover:opacity-100 grayscale hover:grayscale-0 shadow-sm"
 )}
 onClick={() => setSelectedImg(idx)}
 >
 <img src={img} className="w-full h-full object-cover"alt="thumb"/>
 </div>
 ))}
 <div className="flex-1 bg-black rounded-xl border-4 border-white shadow-sm flex flex-col items-center justify-center gap-3 group hover:bg-black-dark transition-colors cursor-pointer relative overflow-hidden">
 <div className="absolute inset-0 bg-apple-blue/5 -skew-x-12 translate-x-20"/>
 <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center text-apple-blue group-hover:scale-110 transition-transform">
 <ImageIcon size={24} />
 </div>
 <span className="text-[10px] font-semibold text-white">View All Nodes</span>
 <span className="text-[8px] font-bold text-white/30">+{hotel.images.length - 3} Visual Assets</span>
 </div>
 </div>
 </div>

 {/* Segmented Hub Navigation */}
 <div className="flex justify-center mb-12">
 <div className="bg-white border border-navy/5 p-2 rounded-xl inline-flex shadow-nav relative overflow-hidden">
 <div className="absolute inset-0 bg-apple-blue/5 opacity-40 -skew-x-12 translate-x-20"/>
 {['rooms', 'amenities', 'location'].map(tab => (
 <button 
 key={tab}
 className={cn(
"relative px-12 py-3 text-[10px] font-semibold rounded-xl transition-all duration-300 z-10",
 activeTab === tab ?"bg-black text-apple-blue shadow-sm scale-105":"text-pure-black/40 hover:text-pure-black"
 )}
 onClick={() => setActiveTab(tab)}
 >
 {tab === 'rooms' &&"Live Inventory"}
 {tab === 'amenities' &&"Hub Facilities"}
 {tab === 'location' &&"Geospatial Context"}
 </button>
 ))}
 </div>
 </div>

 <div className="tab-content min-h-[500px]">
 {activeTab === 'rooms' && (
 <div className="animate-in fade-in slide-in-from-bottom-6 duration-700">
 <div className="bg-black rounded-xl p-8 mb-12 flex flex-col md:flex-row justify-between items-center shadow-apple relative overflow-hidden group">
 <div className="absolute inset-0 bg-apple-blue/5 -skew-x-[20deg] translate-x-[400px] group-hover:translate-x-[350px] transition-transform duration-[2s]"/>
 <div className="flex gap-12 items-center z-10">
 <div className="w-16 h-16 bg-white/10 backdrop-blur rounded-xl flex items-center justify-center text-apple-blue">
 <Calendar size={32} />
 </div>
 <div className="grid grid-cols-3 gap-16 border-l border-white/10 pl-12">
 <div className="flex flex-col">
 <span className="text-[9px] text-white/30 font-semibold mb-1">Check-In Branch</span>
 <span className="text-sm font-semibold text-white">12 OCT 2026</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] text-white/30 font-semibold mb-1">Check-Out Branch</span>
 <span className="text-sm font-semibold text-white">17 OCT 2026</span>
 </div>
 <div className="flex flex-col">
 <span className="text-[9px] text-white/30 font-semibold mb-1">Capacity Branch</span>
 <span className="text-sm font-semibold text-white tracking-tight">2 ADL | 1 Unit</span>
 </div>
 </div>
 </div>
 <button className="px-10 py-4 bg-apple-blue text-pure-black text-[11px] font-semibold rounded-xl shadow-sm hover:scale-105 transition-all z-10">
 Audit Hub Parameters
 </button>
 </div>

 <div className="space-y-6">
 {hotel.rooms.map(room => (
 <div key={room.id} className="group bg-white border border-navy/5 rounded-xl p-6 flex flex-col md:flex-row gap-8 hover:shadow-apple transition-all duration-500 relative overflow-hidden">
 <div className="bg-apple-blue/5 absolute top-0 left-0 w-2 h-full"/>
 
 {/* Room Visual Branch */}
 <div className="w-full md:w-[280px] h-[200px] rounded-xl overflow-hidden relative shadow-sm flex-shrink-0">
 <img src={hotel.images[0]} alt={room.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"/>
 <div className="absolute top-6 left-6 flex flex-col gap-2">
 <div className="bg-black/80 backdrop-blur px-3 py-1 rounded-full text-[8px] font-semibold text-white">Master Allotment</div>
 <div className={cn(
"px-3 py-1 rounded-full text-[8px] font-semibold shadow-sm",
 room.refundable ?"bg-emerald-500 text-white":"bg-rose-500 text-white"
 )}>
 {room.refundable ?"Void-Capable":"Strict Non-Ref"}
 </div>
 </div>
 </div>

 {/* Room Intelligence */}
 <div className="flex-1 flex flex-col justify-between py-4">
 <div>
 <div className="flex justify-between items-start mb-4">
 <h4 className="text-xl font-semibold text-pure-black tracking-tight group-hover:text-apple-blue-dark transition-colors">{room.name}</h4>
 <div className="text-[10px] font-semibold text-pure-black/20 tracking-tight">NODE-RL-{room.id.split('-')[1]}</div>
 </div>
 <div className="grid grid-cols-2 gap-4">
 <div className="flex items-center gap-3 px-4 py-2 bg-light-gray border border-black/5 rounded-xl">
 <Utensils size={14} className="text-apple-blue-dark"/>
 <span className="text-[10px] font-bold text-pure-black tracking-tight">{room.mealPlan}</span>
 </div>
 <div className="flex items-center gap-3 px-4 py-2 bg-light-gray border border-black/5 rounded-xl">
 <Navigation size={14} className="text-apple-blue-dark"/>
 <span className="text-[10px] font-bold text-pure-black tracking-tight">{room.bedType || 'Double Bed'} Branch</span>
 </div>
 </div>
 </div>
 
 <div className="flex items-center gap-6 mt-6">
 {['AC HUB', 'MINI BAR', 'SAFE NODE', 'DESK STACK'].map(tag => (
 <span key={tag} className="text-[8px] font-semibold text-near-black/40 border border-black/5 px-3 py-1 rounded-lg">
 {tag}
 </span>
 ))}
 </div>
 </div>

 {/* Transactional Pricing Branch */}
 <div className="w-full md:w-[260px] bg-light-gray rounded-xl p-8 flex flex-col justify-between items-end border border-black/5/50">
 <div className="text-right">
 <span className="text-[9px] font-semibold text-near-black/40 mb-1 block">Live Audit Net Fare</span>
 <div className="flex items-baseline gap-1">
 <span className="text-sm font-semibold text-pure-black">{hotel.currency}</span>
 <span className="text-4xl font-semibold text-pure-black tabular-nums leading-none">
 {(room.price + stackedMarkup).toLocaleString(undefined, {minimumFractionDigits: 2})}
 </span>
 </div>
 <div className="text-[8px] font-bold text-apple-blue bg-apple-blue/10 px-3 py-1 rounded-lg inline-block mt-2">
 {hotel.currency} {((room.price + stackedMarkup) * 5).toLocaleString()} Total Stay Branch
 </div>
 </div>
 
 <button 
 onClick={() => handleBookRoom(room.id)}
 className="w-full py-4 bg-black text-apple-blue text-[11px] font-semibold rounded-xl shadow-sm hover:bg-black hover:scale-[1.02] active:scale-[0.98] transition-all"
 >
 Initialize Session
 </button>
 </div>
 </div>
 ))}
 </div>
 </div>
 )}

 {activeTab === 'amenities' && (
 <div className="animate-in fade-in zoom-in-95 duration-500 grid md:grid-cols-3 gap-8">
 <div className="md:col-span-1 bg-white border border-navy/5 rounded-xl p-10 shadow-xl">
 <h3 className="text-xs font-semibold text-pure-black tracking-tight mb-6 flex items-center gap-3">
 <Navigation size={16} className="text-apple-blue"/>
 Property Description
 </h3>
 <p className="text-xxs font-medium text-pure-black/60 leading-relaxed tracking-tight">
 {hotel.description}
 </p>
 </div>
 <div className="md:col-span-2 bg-black rounded-[3.5rem] p-12 shadow-apple relative overflow-hidden group">
 <div className="absolute inset-0 bg-apple-blue/5 -skew-x-12 translate-x-1/2"/>
 <h3 className="text-xs font-semibold text-apple-blue tracking-tight mb-8 relative z-10">Hub Facilities Hub</h3>
 <div className="grid grid-cols-2 md:grid-cols-3 gap-6 relative z-10">
 {hotel.amenities.map(a => (
 <div key={a} className="bg-white/5 backdrop-blur-md rounded-xl p-4 flex items-center gap-4 border border-white/5 group/branch hover:bg-white/10 transition-colors">
 <div className="w-8 h-8 rounded-xl bg-apple-blue/20 flex items-center justify-center text-apple-blue group-hover/branch:scale-110 transition-transform">
 <Check size={14} />
 </div>
 <span className="text-[10px] font-semibold text-white">{a}</span>
 </div>
 ))}
 </div>
 </div>
 </div>
 )}

 {activeTab === 'location' && (
 <div className="animate-in fade-in slide-in-from-right-8 duration-700 space-y-8">
 <div className="bg-white border border-navy/5 rounded-[3.5rem] p-12 shadow-xl">
 <h3 className="text-xs font-semibold text-pure-black tracking-tight mb-8 flex items-center gap-3">
 <MapPin size={18} className="text-apple-blue-dark"/>
 Geospatial Connectivity Nodes
 </h3>
 <div className="grid md:grid-cols-4 gap-6">
 {[
 { name: 'Major Airport', distance: '24 KM', time: '45 MIN BY TAXI' },
 { name: 'Transaction Hub (City Center)', distance: '0.8 KM', time: '10 MIN WALK' },
 { name: 'Supply Branch (Grocery Store)', distance: '0.2 KM', time: '3 MIN WALK' },
 { name: 'Transit Branch (Metro)', distance: '0.5 KM', time: '7 MIN WALK' }
 ].map(branch => (
 <div key={branch.name} className="bg-light-gray border border-black/5 rounded-xl p-6 hover:shadow-sm transition-all group">
 <div className="text-[10px] font-semibold text-pure-black mb-2 group-hover:text-apple-blue-dark">{branch.name}</div>
 <div className="flex justify-between items-center bg-white rounded-xl px-4 py-2 border border-slate-50 shadow-sm">
 <span className="text-sm font-semibold text-pure-black">{branch.distance}</span>
 <span className="text-[8px] font-bold text-near-black/40">{branch.time}</span>
 </div>
 </div>
 ))}
 </div>
 </div>
 <div className="h-[400px] w-full bg-black rounded-[3.5rem] relative overflow-hidden shadow-apple group border-8 border-white">
 <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] -900/40 "/>
 <div className="absolute inset-0 flex flex-col items-center justify-center gap-8 group-hover:scale-110 transition-transform duration-[2s]">
 <div className="relative">
 <div className="absolute inset-0 bg-apple-blue blur-2xl opacity-20 animate-pulse"/>
 <MapPin size={80} className="text-apple-blue relative z-10"/>
 </div>
 <div className="text-center">
 <h3 className="text-xl font-semibold text-white tracking-tight mb-2 leading-none">Master Map Stack</h3>
 <p className="text-[10px] font-semibold text-apple-blue opacity-60">Interactive Geospatial Branch Synchronization Applied</p>
 </div>
 </div>
 <div className="absolute bottom-8 right-8 bg-white/10 backdrop-blur rounded-xl px-8 py-4 border border-white/10">
 <span className="text-[9px] font-semibold text-white">LAT: {hotel.lat.toFixed(4)} | LNG: {hotel.lng.toFixed(4)}</span>
 </div>
 </div>
 </div>
 )}
 </div>
 </>
 )}
 </>
 );
}
