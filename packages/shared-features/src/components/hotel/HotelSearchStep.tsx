import { useState } from 'react';
import { format, addDays } from 'date-fns';
import { useApp } from '../../context/AppContext';
import { MapPin, Search, Star, Zap, Building2, Compass } from 'lucide-react';
import { useTenant } from '../../context/TenantContext';
import { LocationDropdown, type LocationItem, GuestDropdown, DualDatePicker, cn } from '../../index';
import { OnBehalfOfSelector } from '../../index';
import { LOCATIONS } from '../../data/mockData';
import type { HotelSearch, BookingContext } from '../../types';

export function HotelSearchStep({ onNext }: { onNext: () => void }) {
  const { tenant } = useTenant();
  const { setHotelSearch } = useApp();

  const TRENDING_HOTELS = [
  {
    name: 'Burj Al Arab',
    city: 'Dubai',
    rating: 4.9,
    image: 'https://images.unsplash.com/photo-1542314831-068cd1dbfeeb?auto=format&fit=crop&q=80&w=600',
    price: `${tenant.currency} 120`,
    tag: 'Bestseller',
  },
  {
    name: 'The Ritz-Carlton',
    city: 'Manama',
    rating: 4.8,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80&w=600',
    price: `${tenant.currency} 85`,
    tag: 'B2B Exclusive',
  },
  {
    name: 'Marina Bay Sands',
    city: 'Singapore',
    rating: 5.0,
    image: 'https://images.unsplash.com/photo-1518780664697-55e3ad937233?auto=format&fit=crop&q=80&w=600',
    price: `${tenant.currency} 150`,
    tag: 'Top Rated',
  },
  ];
 
/* ── Search state ── */
  const [destination, setDestination] = useState('loc-06'); // London
 const [checkIn, setCheckIn] = useState<Date>(addDays(new Date(), 7));
 const [checkOut, setCheckOut] = useState<Date>(addDays(new Date(), 10));
 const [rooms, setRooms] = useState(1);
 const [adults, setAdults] = useState(2);
 const [children, setChildren] = useState(0);
 const [childAges, setChildAges] = useState<number[]>([]);
 const [nationality, setNationality] = useState('');
 const [travelCategory, setTravelCategory] = useState('');

 /* ── On Behalf Of ── */
 const [bookingContext, setBookingContext] = useState<BookingContext>('direct');
 const [selectedSubAgent, setSelectedSubAgent] = useState<Parameters<typeof OnBehalfOfSelector>[0]['selectedSubAgent']>(undefined);
 const [selectedTraveller, setSelectedTraveller] = useState<Parameters<typeof OnBehalfOfSelector>[0]['selectedTraveller']>(undefined);

 const handleSearch = (e: React.FormEvent) => {
 e.preventDefault();
 const nights = checkOut && checkIn ? Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)) : 0;
  setHotelSearch({
    destination: LOCATIONS.find(l => l.id === destination || l.code === destination)?.name || destination,
    checkIn: format(checkIn, 'yyyy-MM-dd'),
    checkOut: format(checkOut, 'yyyy-MM-dd'),
    nights,
    rooms,
    adults,
    children,
    infants: 0,
  } as HotelSearch);
 onNext();
 };

 return (
 <>
 <div className="animate-fade max-w-6xl mx-auto px-4">
 
 {/* Luxury Search Explorer */}
 <div className="hotel-hero-bg min-h-[500px] p-8 md:p-14 flex flex-col items-center justify-center relative mb-16">
 
 <div className="absolute top-10 left-10 flex items-center gap-3 opacity-60">
 <div className="w-1.5 h-1.5 rounded-full bg-apple-blue animate-pulse"/>
 <span className="text-[10px] font-semibold text-white tracking-tight">System Connection Active</span>
 </div>

 <div className="relative text-center mb-12 max-w-3xl">
 <div className="inline-flex items-center gap-2.5 bg-apple-blue/10 backdrop-blur-md border border-apple-blue/30 rounded-full px-5 py-2 mb-6">
 <Building2 size={14} className="text-apple-blue"/>
 <span className="text-[10px] font-semibold text-apple-blue tracking-tight">1M+ Global Properties</span>
 </div>
 <h1 className="text-4xl md:text-5xl lg:text-7xl font-semibold text-white mb-6 leading-[1.05] tracking-tight">
 Sophisticated <span className="text-apple-blue">Stay Intelligence</span>
 </h1>
 <p className="text-sm md:text-md text-white/50 font-medium leading-relaxed max-w-xl mx-auto">
 Access wholesale contract rates and real-time inventory synchronization across every major hotel chain.
 </p>
 </div>

 {/* Frosted Glass Search Card */}
 <div className="glass-card w-full max-w-5xl p-6 md:p-8 relative translate-y-20 shadow-apple overflow-visible">
 <form onSubmit={handleSearch} className="space-y-6">
 {/* Context Selector */}
 <div className="flex flex-col gap-6">
 <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-navy/5">
 <div className="flex items-center gap-2">
 <Compass size={14} className="text-pure-black/20"/>
 <span className="text-[10px] font-semibold text-pure-black tracking-tight">Global Stay Search</span>
 </div>
 
 <div className="flex items-center gap-3">
 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
 <span className="text-[9px] font-semibold text-pure-black/40">Inventory Live</span>
 </div>
 </div>

 <OnBehalfOfSelector
 value={bookingContext}
 onChange={setBookingContext}
 selectedSubAgent={selectedSubAgent}
 selectedTraveller={selectedTraveller}
 onSubAgentChange={setSelectedSubAgent}
 onTravellerChange={setSelectedTraveller}
 />
 </div>

 {/* Central Search Strip */}
 <div className="flex flex-col md:flex-row items-stretch gap-2 bg-light-gray/50 backdrop-blur rounded-xl border border-navy/5 p-2 transition-all hover:bg-white hover:shadow-inner">
 <div className="flex-[2] min-w-0">
 <LocationDropdown 
 label="Destination or Property"
 placeholder="Search city, neighborhood, or specific hotel"
 value={destination} 
 onChange={(id) => setDestination(id)} 
          items={LOCATIONS}
 mode="hotel"
 className="border-none bg-transparent"
 />
 </div>

 <div className="w-px bg-black/5 hidden md:block my-2"/>

 <div className="flex-[1.5] min-w-0">
 <DualDatePicker
 checkIn={checkIn}
 checkOut={checkOut}
 onCheckInChange={setCheckIn}
 onCheckOutChange={setCheckOut}
 label="Stay Duration"
 className="border-none bg-transparent"
 />
 </div>

 <div className="w-px bg-black/5 hidden md:block my-2"/>

 <div className="flex-1 min-w-0">
 <GuestDropdown
 rooms={rooms}
 adults={adults}
 children={children}
 childAges={childAges}
 onChange={(data) => {
 setRooms(data.rooms);
 setAdults(data.adults);
 setChildren(data.children);
 setChildAges(data.childAges);
 }}
 className="border-none bg-transparent"
 />
 </div>
 </div>

 {/* Action Bar */}
 <div className="flex flex-wrap items-center justify-between gap-6 pt-2">
 <div className="flex flex-wrap items-center gap-6">
 <label className="flex items-center gap-2.5 cursor-pointer group">
 <div className={cn("w-4 h-4 rounded border-2 border-navy/20 flex items-center justify-center transition-all group-hover:border-apple-blue", false &&"bg-black border-navy")}>
 <input type="checkbox"className="hidden"/>
 </div>
 <span className="text-[10px] font-semibold text-pure-black/60">Show Non-Contracted Rates</span>
 </label>

 <div className="flex items-center gap-1.5 text-[9px] font-semibold text-pure-black/30 italic">
 <Zap size={11} className="text-apple-blue"/> Proprietary Cache Priority Active
 </div>
 </div>

 <div className="flex items-center gap-4">
 <select value={travelCategory} onChange={e => setTravelCategory(e.target.value)}
 className="text-[10px] font-semibold bg-white border border-navy/5 rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition-all">
 <option value="">Travel Category</option>
 {['Leisure', 'Corporate', 'VFR', 'Marine', 'Government', 'Group'].map(c => <option key={c}>{c}</option>)}
 </select>

 <select value={nationality} onChange={e => setNationality(e.target.value)}
 className="text-[10px] font-semibold bg-white border border-navy/5 rounded-xl px-4 py-2.5 outline-none focus:border-apple-blue transition-all">
 <option value="">Guest Nationality</option>
 {['Bahrain', 'Saudi Arabia', 'UAE', 'Kuwait', 'Qatar', 'Oman', 'United Kingdom', 'United States', 'India', 'Pakistan'].map(n => <option key={n}>{n}</option>)}
 </select>

 <button type="submit"className="btn-search group">
 <Search size={16} />
 <span>Search Hotels</span>
 <div className="w-5 h-5 rounded-full bg-white/10 group-hover:bg-apple-blue/20 flex items-center justify-center transition-all">
 <Building2 size={12} className="group-hover:scale-110 transition-transform"/>
 </div>
 </button>
 </div>
 </div>
 </form>
 </div>
 </div>

 {/* Trending Destinations (Trending) */}
 <div className="mt-48 mb-20 animate-slide-up">
 <div className="flex items-center justify-between mb-12">
 <div className="flex items-center gap-4">
 <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center text-apple-blue shadow-sm">
 <Star size={20} />
 </div>
 <div>
 <h2 className="text-sm font-semibold text-pure-black tracking-tight mb-1.5">Trending Destinations</h2>
 <p className="text-[10px] font-medium text-pure-black/30 tracking-tight">Exclusive B2B rates with guaranteed B2B yields</p>
 </div>
 </div>
 <button className="text-[10px] font-semibold text-pure-black/40 hover:text-pure-black border-b border-navy/10 pb-1 flex items-center gap-2">
 View Regional Locations <Search size={12} />
 </button>
 </div>
 
 <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
 {TRENDING_HOTELS.map((hotel, i) => (
 <div key={i} className="bg-white rounded-xl border border-navy/5 overflow-hidden hover:shadow-[0_40px_100px_rgba(0,30,60,0.15)] transition-all group cursor-pointer relative">
 <div className="h-64 overflow-hidden relative">
 <img src={hotel.image} alt={hotel.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"/>
 <div className="absolute inset-0 bg-apple-blue opacity-0 group-hover:opacity-100 transition-opacity"/>
 <div className="absolute top-6 right-6">
 <span className="px-4 py-1.5 bg-black/80 backdrop-blur-md text-apple-blue text-[9px] font-semibold rounded-full border border-white/10">
 {hotel.tag}
 </span>
 </div>
 </div>
 
 <div className="p-8">
 <div className="flex items-start justify-between mb-6">
 <div>
 <h3 className="text-lg font-semibold text-pure-black mb-1.5">{hotel.name}</h3>
 <div className="flex items-center gap-2 text-[10px] font-semibold text-pure-black/30">
 <MapPin size={12} className="text-apple-blue"/> {hotel.city}
 </div>
 </div>
 <div className="flex items-center gap-1.5 bg-light-gray px-3 py-1.5 rounded-xl border border-navy/5">
 <Star size={12} className="text-apple-blue"fill="currentColor"/>
 <span className="text-[11px] font-semibold text-pure-black">{hotel.rating}</span>
 </div>
 </div>
 
 <div className="pt-6 border-t border-navy/5 flex items-center justify-between">
 <div>
 <span className="text-[9px] font-semibold text-pure-black/20 block mb-1">Nightly Sector Rate</span>
 <span className="text-2xl font-semibold text-pure-black">{hotel.price}</span>
 </div>
 <div className="flex items-center gap-2 px-4 py-2 bg-apple-blue/10 text-apple-blue text-[9px] font-semibold rounded-xl">
 <Zap size={10} /> Live Rate
 </div>
 </div>
 </div>
 </div>
 ))}
 </div>
 </div>
 </div>
 </>
 );
}
