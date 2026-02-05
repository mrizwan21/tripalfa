import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Search, MapPin, Calendar, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { SearchAutocomplete, Suggestion } from '../components/ui/SearchAutocomplete';
import { GuestSelector } from '../components/ui/GuestSelector';
import { DualMonthCalendar } from '../components/ui/DualMonthCalendar';
import { format } from 'date-fns';

export default function HotelHome() {
    const navigate = useNavigate();
    const [location, setLocation] = useState('');
    const [checkinDate, setCheckinDate] = useState<Date | null>(null);
    const [checkoutDate, setCheckoutDate] = useState<Date | null>(null);
    const [countryCode, setCountryCode] = useState<string | null>(null);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.set('location', location);
        if (countryCode) params.set('countryCode', countryCode);
        if (checkinDate) params.set('checkin', format(checkinDate, 'yyyy-MM-dd'));
        if (checkoutDate) params.set('checkout', format(checkoutDate, 'yyyy-MM-dd'));
        navigate(`/hotels/list?${params.toString()}`);
    };

    return (
        <TripLogerLayout>
            {/* Hero Section */}
            <div className="relative h-[650px] flex items-center justify-center overflow-hidden">
                {/* Background with purple gradient overlay */}
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1566073771259-6a8506099945?q=80&w=2069&auto=format&fit=crop')" }}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/80 via-[#8B5CF6]/60 to-[#A855F7]/40"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
                    <div className="mb-4">
                        <span className="px-6 py-2 bg-[#FFD700] rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-yellow-200/50">
                            Best Price Guaranteed
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 text-center drop-shadow-2xl tracking-tight">
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-white/80 font-bold text-lg uppercase tracking-[0.3em] mb-8">Curated Hotels Worldwide</p>

                    {/* Glassmorphic Search Card */}
                    <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl">
                        {/* Tabs */}
                        <div className="inline-flex bg-white/20 rounded-full p-1 mb-6 backdrop-blur-sm">
                            <button
                                className="px-6 py-2 rounded-full bg-white text-[#003B95] font-bold shadow-md flex items-center gap-2"
                            >
                                <span>🏨</span> Stays
                            </button>
                            <button
                                onClick={() => navigate('/flights')}
                                className="px-6 py-2 rounded-full text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <span>✈️</span> Flights
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                            {/* Destination Input */}
                            <div className="col-span-12 md:col-span-4 h-14">
                                <SearchAutocomplete
                                    type="hotel"
                                    placeholder="City, Property, District or Address"
                                    icon={<MapPin size={18} className="text-[#6366F1]" />}
                                    value={location}
                                    onChange={setLocation}
                                    onSelect={(item: Suggestion) => {
                                        setLocation(item.title);
                                        setCountryCode(item.countryCode || null);
                                    }}
                                />
                            </div>

                            {/* Date Picker - Dual Month Calendar for Check-in/Check-out */}
                            <div className="col-span-12 md:col-span-4">
                                <DualMonthCalendar
                                    departureDate={checkinDate}
                                    returnDate={checkoutDate}
                                    onDepartureDateChange={setCheckinDate}
                                    onReturnDateChange={setCheckoutDate}
                                    mode="hotel"
                                    departureLabel="Check-in"
                                    returnLabel="Check-out"
                                />
                            </div>

                            {/* Guests Input */}
                            <div className="col-span-12 md:col-span-2 h-14">
                                <GuestSelector />
                            </div>

                            {/* Search Button */}
                            <div className="col-span-12 md:col-span-2">
                                <button
                                    onClick={handleSearch}
                                    className="w-full h-14 bg-[#FFD700] hover:bg-[#F4CE14] text-black font-bold text-lg rounded-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    Search
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Bar - Consistent across pages */}
            <div className="container mx-auto px-4 py-12">
                <div className="flex flex-col md:flex-row justify-around items-center gap-8 mb-16">
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-blue-50 rounded-full text-blue-600">
                            <Search size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Search a huge selection</h3>
                            <p className="text-xs text-gray-500 max-w-[200px]">Compare hotel prices from multiple sites.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-orange-50 rounded-full text-orange-500">
                            <MapPin size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Pay no hidden fees</h3>
                            <p className="text-xs text-gray-500 max-w-[200px]">Get the clearest price display with no hidden costs.</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="p-3 bg-green-50 rounded-full text-green-500">
                            <Calendar size={24} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-900">Get more flexibility</h3>
                            <p className="text-xs text-gray-500 max-w-[200px]">Change your dates or cancel easily.</p>
                        </div>
                    </div>
                </div>

                {/* Trending Hotels / Large cards */}
                <h2 className="text-xl font-bold text-gray-900 mb-6 uppercase tracking-wider text-center md:text-left">Cheap Hotel deals in popular destinations</h2>

                <div className="bg-[#6366F1] rounded-2xl p-8 mb-16 flex flex-col md:flex-row gap-8 items-center">
                    <div className="flex-1 text-white">
                        <h3 className="text-3xl font-bold mb-4">Backpacking Sri Lanka</h3>
                        <p className="text-white/80 text-sm leading-relaxed mb-6">
                            Traveling is a unique experience as it's the best way to unplug from the pushes and pulls of daily life. It helps us to forget about our problems, frustrations, and fears at home. During our journey, we experience life in different ways. We explore new places, cultures, cuisines, traditions, and ways of living.
                        </p>
                        <button className="bg-white text-[#6366F1] px-6 py-2 rounded-lg font-bold hover:bg-opacity-90 transition">Read More</button>
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-4">
                        <img src="https://images.unsplash.com/photo-1546737033-07416763823d?auto=format&fit=crop&q=80" className="rounded-xl w-full h-32 object-cover" />
                        <img src="https://images.unsplash.com/photo-1596422846543-75c6fc197f07?auto=format&fit=crop&q=80" className="rounded-xl w-full h-32 object-cover" />
                        <img src="https://images.unsplash.com/photo-1588668214407-6ea9a6d8c272?auto=format&fit=crop&q=80" className="rounded-xl w-full h-32 object-cover" />
                        <img src="https://images.unsplash.com/photo-1572455044327-7348c1be7267?auto=format&fit=crop&q=80" className="rounded-xl w-full h-32 object-cover" />
                    </div>
                </div>

                {/* Carousel Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-16">
                    {[
                        { name: 'Melbourne', label: 'An amazing journey', img: 'https://images.unsplash.com/photo-1514395465013-2af9ff512306?auto=format&fit=crop&q=80' },
                        { name: 'Paris', label: 'Eiffel Tower', img: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80' },
                        { name: 'London', label: 'London Eye', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80' },
                        { name: 'Columbia', label: 'Amazing streets', img: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&q=80' }
                    ].map((dest, i) => (
                        <div key={i} className="group rounded-xl overflow-hidden shadow-lg border border-gray-100">
                            <div className="relative h-64 overflow-hidden">
                                <img src={dest.img} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12 text-center">
                                    <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                                    <p className="text-white/80 text-xs font-medium">{dest.label}</p>
                                </div>
                            </div>
                            <div className="p-4 bg-white">
                                <button className="w-full bg-[#FFD700] hover:bg-[#F4CE14] text-black font-bold py-2 rounded transition-colors text-sm">Book a Hotel</button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </TripLogerLayout>
    );
}
