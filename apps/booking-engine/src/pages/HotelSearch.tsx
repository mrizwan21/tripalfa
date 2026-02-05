import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, MapPin, Star, Wifi, Coffee, Waves, Calendar, User, ChevronDown, ChevronRight, Check, Filter, ArrowUpDown, RotateCcw, Building2 } from 'lucide-react';
import { searchHotels } from '../lib/api';
import { formatCurrency } from '../lib/utils';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';

export default function HotelSearch() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Form State
  const [location, setLocation] = useState(searchParams.get('location') || 'Dubai');
  const [checkin, setCheckin] = useState(searchParams.get('checkin') || '');
  const [checkout, setCheckout] = useState(searchParams.get('checkout') || '');
  const [adults, setAdults] = useState(Number(searchParams.get('adults')) || 2);
  const [children, setChildren] = useState(Number(searchParams.get('children')) || 0);
  const [rooms, setRooms] = useState(Number(searchParams.get('rooms')) || 1);

  // Results State
  const [hotels, setHotels] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Filter State
  const [activeFilter, setActiveFilter] = useState<number | null>(null);
  const [starFilter, setStarFilter] = useState<number | null>(null);

  // Perform search
  const handleSearch = async () => {
    setIsLoading(true);
    setHasSearched(true);
    try {
      const result = await searchHotels({
        location,
        checkin,
        checkout,
        adults,
        children,
        rooms
      });
      setHotels(result.hotels || []);
      // Update URL params
      setSearchParams({ location, checkin, checkout, adults: String(adults), children: String(children), rooms: String(rooms) });
    } catch (error) {
      console.error('Search failed:', error);
      setHotels([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-search on mount if params exist
  useEffect(() => {
    if (searchParams.get('location')) {
      handleSearch();
    }
  }, []);

  // Close filter dropdown on outside click
  useEffect(() => {
    const handleClick = () => setActiveFilter(null);
    window.addEventListener('click', handleClick);
    return () => window.removeEventListener('click', handleClick);
  }, []);

  // Filter hotels by star rating
  const filteredHotels = starFilter
    ? hotels.filter(h => h.rating >= starFilter)
    : hotels;

  return (
    <TripLogerLayout>
      <div className="bg-[#F9FAFB] min-h-screen pt-28">

        {/* Hero Section with Search */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1] via-[#8B5CF6] to-[#A855F7]">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80')] bg-cover bg-center opacity-20" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          </div>

          <div className="container mx-auto px-4 max-w-6xl relative z-10 py-16">
            <div className="text-center mb-12">
              <h1 className="text-5xl font-black text-white tracking-tight mb-4 drop-shadow-2xl">Find Your Perfect Stay</h1>
              <p className="text-white/80 font-bold text-lg uppercase tracking-[0.3em]">Curated Hotels Worldwide</p>
            </div>

            {/* Premium Search Card */}
            <Card className="p-0 bg-white/95 backdrop-blur-2xl shadow-[0_30px_60px_-20px_rgba(0,0,0,0.4)] border border-white/50 rounded-[2.5rem] overflow-visible relative">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <div className="px-6 py-2 bg-[#FFD700] rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-yellow-200/50">
                  Best Price Guaranteed
                </div>
              </div>

              <div className="p-8 pt-10">
                <div className="grid grid-cols-1 md:grid-cols-6 gap-6">
                  {/* Destination */}
                  <div className="md:col-span-2 space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Destination</label>
                    <div className="relative group">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-[#6366F1] group-hover:scale-110 transition-transform" size={18} />
                      <input
                        type="text"
                        value={location}
                        onChange={(e) => setLocation(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6366F1] focus:bg-white hover:bg-white transition-all"
                        placeholder="Where are you going?"
                      />
                    </div>
                  </div>

                  {/* Check-in */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Check-in</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#6366F1] transition-colors" size={16} />
                      <input
                        type="date"
                        value={checkin}
                        onChange={(e) => setCheckin(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#6366F1] focus:bg-white hover:bg-white cursor-pointer transition-all"
                      />
                    </div>
                  </div>

                  {/* Check-out */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Check-out</label>
                    <div className="relative group">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#6366F1] transition-colors" size={16} />
                      <input
                        type="date"
                        value={checkout}
                        onChange={(e) => setCheckout(e.target.value)}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#6366F1] focus:bg-white hover:bg-white cursor-pointer transition-all"
                      />
                    </div>
                  </div>

                  {/* Guests */}
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">Guests</label>
                    <div className="relative group">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-hover:text-[#6366F1] transition-colors" size={16} />
                      <select
                        value={adults}
                        onChange={(e) => setAdults(Number(e.target.value))}
                        className="w-full h-14 pl-12 pr-4 bg-gray-50 border-2 border-transparent rounded-2xl text-sm font-bold text-gray-700 focus:outline-none focus:border-[#6366F1] focus:bg-white hover:bg-white cursor-pointer transition-all appearance-none"
                      >
                        {[1, 2, 3, 4, 5, 6].map(n => (
                          <option key={n} value={n}>{n} Adult{n > 1 ? 's' : ''}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    </div>
                  </div>

                  {/* Search Button */}
                  <div className="flex items-end">
                    <Button
                      onClick={handleSearch}
                      disabled={isLoading}
                      className="w-full h-14 bg-[#6366F1] hover:bg-[#5558E3] font-black rounded-2xl shadow-xl shadow-indigo-200 uppercase text-[10px] tracking-[0.2em] transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <>
                          <Search size={18} className="mr-2" /> Search
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Results Section */}
        <div className="container mx-auto px-4 max-w-6xl py-12">
          {!hasSearched ? (
            /* Popular Destinations */
            <div className="space-y-8">
              <div className="text-center">
                <h2 className="text-3xl font-black text-gray-900 tracking-tight">Popular Destinations</h2>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-[0.3em] mt-2">Explore trending hotels worldwide</p>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { name: 'Dubai', image: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80', hotels: '2,450+' },
                  { name: 'London', image: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80', hotels: '3,120+' },
                  { name: 'Paris', image: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80', hotels: '2,890+' },
                  { name: 'New York', image: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80', hotels: '4,200+' }
                ].map((dest, i) => (
                  <div
                    key={i}
                    onClick={() => { setLocation(dest.name); handleSearch(); }}
                    className="group relative h-64 rounded-[2rem] overflow-hidden cursor-pointer shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all duration-500"
                  >
                    <img src={dest.image} alt={dest.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                    <div className="absolute bottom-6 left-6">
                      <h3 className="text-2xl font-black text-white tracking-tight">{dest.name}</h3>
                      <p className="text-[10px] font-bold text-white/70 uppercase tracking-widest mt-1">{dest.hotels} Hotels</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : isLoading ? (
            /* Loading State */
            <div className="flex flex-col items-center justify-center py-32">
              <div className="w-16 h-16 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mb-6" />
              <p className="text-gray-500 font-black uppercase tracking-[0.3em] text-sm">Searching the globe...</p>
            </div>
          ) : filteredHotels.length === 0 ? (
            /* No Results */
            <div className="text-center py-32">
              <Building2 size={64} className="mx-auto text-gray-200 mb-6" />
              <h3 className="text-2xl font-black text-gray-400">No hotels found</h3>
              <p className="text-gray-400 mt-2">Try adjusting your search criteria</p>
            </div>
          ) : (
            /* Results Grid */
            <div className="space-y-8">
              {/* Filter Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-black text-gray-900">{filteredHotels.length} Hotels Found</h2>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">In {location}</p>
                </div>

                <div className="flex gap-3">
                  {[5, 4, 3].map(stars => (
                    <button
                      key={stars}
                      onClick={() => setStarFilter(starFilter === stars ? null : stars)}
                      className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all flex items-center gap-2 ${starFilter === stars
                          ? 'bg-[#6366F1] text-white shadow-lg shadow-indigo-200'
                          : 'bg-white text-gray-500 border border-gray-200 hover:border-[#6366F1] hover:text-[#6366F1]'
                        }`}
                    >
                      {stars}+ <Star size={12} className="fill-current" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Hotel Cards */}
              <div className="space-y-6">
                {filteredHotels.map((hotel: any) => (
                  <Card key={hotel.id} className="group overflow-hidden border-none shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex h-72 bg-white rounded-[2rem]">
                    {/* Hotel Image */}
                    <div className="w-[35%] relative overflow-hidden">
                      <img
                        src={hotel.image}
                        alt={hotel.name}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                      />
                      <div className="absolute top-4 left-4">
                        <span className="bg-white/90 backdrop-blur-md px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest text-[#6366F1] shadow-xl border border-white/50">
                          Top Rated
                        </span>
                      </div>
                    </div>

                    {/* Hotel Info */}
                    <div className="flex-1 p-8 flex flex-col">
                      <div className="flex justify-between items-start">
                        <div className="flex-1 pr-6">
                          <div className="flex items-center gap-1 mb-2">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} size={14} className={i < hotel.rating ? "text-yellow-400 fill-current" : "text-gray-200"} />
                            ))}
                          </div>
                          <h3 className="text-2xl font-black text-gray-900 group-hover:text-[#6366F1] transition-colors leading-tight mb-2">{hotel.name}</h3>
                          <div className="flex items-center gap-1.5 text-gray-500">
                            <MapPin size={14} className="text-[#6366F1]" />
                            <span className="text-[11px] font-black uppercase tracking-tighter">{hotel.location}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest mb-1">From</p>
                          <p className="text-3xl font-black text-[#6366F1] tracking-tighter">{formatCurrency(hotel.price?.amount || hotel.pricePerNight || 500)}</p>
                          <p className="text-[10px] text-gray-400 font-bold mt-1">per night</p>
                        </div>
                      </div>

                      <div className="mt-4 p-4 bg-gray-50 rounded-2xl flex flex-wrap gap-4">
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 uppercase"><Wifi size={14} className="text-blue-500" /> WiFi</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 uppercase"><Coffee size={14} className="text-orange-500" /> Breakfast</span>
                        <span className="flex items-center gap-1.5 text-[10px] font-black text-gray-600 uppercase"><Waves size={14} className="text-cyan-500" /> Pool</span>
                      </div>

                      <div className="mt-auto flex items-center justify-between pt-4">
                        <div className="flex items-center gap-3">
                          <div className="bg-[#FFD700] text-black w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shadow-lg">{hotel.rating || '4.5'}</div>
                          <div>
                            <p className="text-[10px] font-black uppercase tracking-tighter text-gray-900 leading-none">Excellent</p>
                            <p className="text-[9px] font-bold text-gray-400 uppercase leading-none mt-1">420 Reviews</p>
                          </div>
                        </div>
                        <Button
                          className="bg-[#6366F1] hover:bg-[#5558E3] h-12 px-8 font-black rounded-xl shadow-lg shadow-indigo-100 uppercase text-[9px] tracking-wide transition-all hover:scale-105 active:scale-95"
                          onClick={() => navigate(`/hotels/${hotel.id}`)}
                        >
                          View Rooms <ChevronRight size={16} className="ml-1" />
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </TripLogerLayout>
  );
}
