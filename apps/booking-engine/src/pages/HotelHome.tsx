import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Search, MapPin, Calendar, User, ChevronRight, ChevronLeft, Star, Building2, TrendingUp, Loader2, BookOpen } from 'lucide-react';
import { SearchAutocomplete, Suggestion } from '../components/ui/SearchAutocomplete';
import { GuestSelector } from '../components/ui/GuestSelector';
import { DualMonthCalendar } from '../components/ui/DualMonthCalendar';
import { format } from 'date-fns';
import { usePopularDestinations, usePopularHotels } from '../hooks/useStaticData';
import { useWikivoyageGuide } from '../hooks/useWikivoyage';
import { DestinationContentCard } from '../components/DestinationContentCard';

const PLACEHOLDER_HOTEL_IMAGE = '/images/placeholder-hotel.jpg';

// Type definitions for data from PostgreSQL
interface PopularDestination {
    id: string;
    code: string;
    name: string;
    countryName: string;
    countryCode: string;
    destinationType: string;
    hotelCount: number;
    popularityScore: number;
    imageUrl: string | null;
    latitude: number | null;
    longitude: number | null;
}

interface PopularHotel {
    id: string;
    canonicalCode: string;
    name: string;
    city: string;
    countryCode: string;
    starRating: number | null;
    hotelType: string | null;
    chainName: string | null;
    qualityScore: number | null;
    primaryImage: string | null;
}

export default function HotelHome() {
    const navigate = useNavigate();
    const [location, setLocation] = useState('');
    const [checkinDate, setCheckinDate] = useState<Date | null>(null);
    const [checkoutDate, setCheckoutDate] = useState<Date | null>(null);
    const [countryCode, setCountryCode] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState('All');
    const [carouselStart, setCarouselStart] = useState(0);

    // ─── Static Data from PostgreSQL ────────────────────────────────────────────
    // Popular destinations for carousel and trending section
    const { data: popularDestinations = [], isLoading: isLoadingDestinations, error: destinationsError } = usePopularDestinations(20);
    
    // Popular hotels for featured section
    const { data: popularHotels = [], isLoading: isLoadingHotels, error: hotelsError } = usePopularHotels(8);
    
    // ─── Wikivoyage Destination Content ────────────────────────────────────────────
    // Featured destination for Wikivoyage content - pick from top destinations
    const featuredDestination = popularDestinations[0]?.name || 'Paris';
    const { data: wikivoyageContent, isLoading: isLoadingWiki } = useWikivoyageGuide(featuredDestination);

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (location) params.set('location', location);
        if (countryCode) params.set('countryCode', countryCode);
        if (checkinDate) params.set('checkin', format(checkinDate, 'yyyy-MM-dd'));
        if (checkoutDate) params.set('checkout', format(checkoutDate, 'yyyy-MM-dd'));
        navigate(`/hotels/list?${params.toString()}`);
    };

    // Helper to render star rating
    const renderStars = (rating: number | null) => {
        if (!rating) return null;
        return (
            <div className="flex items-center gap-0.5">
                {Array.from({ length: Math.min(rating, 5) }).map((_, i) => (
                    <Star key={i} size={12} className="fill-yellow-400 text-yellow-400" />
                ))}
            </div>
        );
    };

    // Helper to get destination image with fallback
    const getDestinationImage = (dest: PopularDestination): string => {
        return dest.imageUrl || PLACEHOLDER_HOTEL_IMAGE;
    };

    // Helper to get hotel image with fallback
    const getHotelImage = (hotel: PopularHotel): string => {
        return hotel.primaryImage || PLACEHOLDER_HOTEL_IMAGE;
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
                    <div className="absolute inset-0 bg-gradient-to-br from-[#6366F1]/80 via-[#152467]/60 to-[#A855F7]/40"></div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
                    <div className="mb-4">
                        <span className="px-6 py-2 bg-[#EC5C4C] rounded-full text-[9px] font-black uppercase tracking-[0.2em] text-black shadow-lg shadow-yellow-200/50">
                            Best Price Guaranteed
                        </span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-4 text-center drop-shadow-2xl tracking-tight">
                        Find Your Perfect Stay
                    </h1>
                    <p className="text-white/80 font-bold text-lg uppercase tracking-[0.3em] mb-8">Curated Hotels Worldwide</p>

                    {/* Glassmorphic Search Card */}
                    <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl"
                        data-testid="hotel-search-form">
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
                            <div className="col-span-12 md:col-span-4 h-14 [&_.h-12]:!h-14">
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
                                    dataTestId="hotel-city"
                                />
                            </div>

                            {/* Date Picker - Dual Month Calendar for Check-in/Check-out */}
                            <div className="col-span-12 md:col-span-4 [&_.h-12]:!h-14">
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
                            <div className="col-span-12 md:col-span-2 h-14 [&_.h-12]:!h-14">
                                <GuestSelector />
                            </div>

                            {/* Search Button */}
                            <div className="col-span-12 md:col-span-2">
                                <button
                                    onClick={handleSearch}
                                    data-testid="hotel-search-submit"
                                    className="w-full h-14 bg-[#EC5C4C] hover:bg-[#F4CE14] text-black font-bold text-base rounded-xl shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
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

                {/* ─── Popular Destinations Carousel (from PostgreSQL) ──────────────────────────────── */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Popular Destinations</h2>
                            <p className="text-gray-500 text-sm mt-1">
                                Explore top travel spots worldwide
                                {popularDestinations.length > 0 && (
                                    <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                                        {popularDestinations.length} destinations from DB
                                    </span>
                                )}
                            </p>
                        </div>
                    </div>

                    {/* Loading State */}
                    {isLoadingDestinations && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                            <span className="ml-3 text-gray-600">Loading destinations...</span>
                        </div>
                    )}

                    {/* Error State */}
                    {destinationsError && !isLoadingDestinations && (
                        <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-center">
                            <p className="text-red-600 text-sm">Unable to load destinations. Please try again later.</p>
                        </div>
                    )}

                    {/* Carousel Window: show 4 at a time */}
                    {!isLoadingDestinations && !destinationsError && (
                        <>
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                {popularDestinations.length > 0
                                    ? popularDestinations.slice(carouselStart, carouselStart + 4).map((dest) => (
                                        <div
                                            key={dest.id}
                                            className="group rounded-xl overflow-hidden shadow-lg border border-gray-100 cursor-pointer"
                                            onClick={() => {
                                                navigate(`/hotels/list?location=${encodeURIComponent(dest.name)}&countryCode=${dest.countryCode}`);
                                            }}
                                        >
                                            <div className="relative h-64 overflow-hidden">
                                                <img
                                                    src={getDestinationImage(dest)}
                                                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                                    alt={dest.name}
                                                />
                                                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-4 pt-12">
                                                    <h3 className="text-white font-bold text-lg">{dest.name}</h3>
                                                    <p className="text-white/80 text-xs font-medium">{dest.countryName}</p>
                                                    {dest.hotelCount > 0 && (
                                                        <p className="text-white/60 text-xs mt-1">
                                                            {dest.hotelCount.toLocaleString()} hotels
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="p-4 bg-white">
                                                <button className="w-full bg-[#EC5C4C] hover:bg-[#F4CE14] text-black font-bold py-2 rounded transition-colors text-sm">
                                                    View Hotels
                                                </button>
                                            </div>
                                        </div>
                                    ))
                                    : /* Empty state */
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] bg-gray-200 animate-pulse" />
                                    ))
                                }
                            </div>

                            {/* Carousel Navigation */}
                            {popularDestinations.length > 4 && (
                                <div className="flex justify-between items-center mt-6">
                                    <button
                                        className="p-2 rounded-full bg-[#6366F1] text-white shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                        onClick={() => setCarouselStart(Math.max(0, carouselStart - 4))}
                                        disabled={carouselStart === 0}
                                    >
                                        <ChevronLeft size={20} />
                                    </button>
                                    <span className="text-xs text-gray-400">
                                        {carouselStart + 1}–{Math.min(carouselStart + 4, popularDestinations.length)} of {popularDestinations.length}
                                    </span>
                                    <button
                                        className="p-2 rounded-full bg-[#6366F1] text-white shadow-lg shadow-indigo-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                        onClick={() => setCarouselStart(Math.min(popularDestinations.length - 4, carouselStart + 4))}
                                        disabled={carouselStart + 4 >= popularDestinations.length}
                                    >
                                        <ChevronRight size={20} />
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </section>

                {/* ─── Featured Hotels Section (from PostgreSQL) ────────────────────────────────────── */}
                <section className="mb-16">
                    <div className="flex items-center justify-between mb-6">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Featured Hotels</h2>
                            <p className="text-gray-500 text-sm mt-1">Handpicked properties for your next stay</p>
                        </div>
                        <Building2 className="w-6 h-6 text-[#6366F1]" />
                    </div>

                    {/* Loading State */}
                    {isLoadingHotels && (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-8 h-8 animate-spin text-[#6366F1]" />
                            <span className="ml-3 text-gray-600">Loading hotels...</span>
                        </div>
                    )}

                    {/* Hotel Cards Grid */}
                    {!isLoadingHotels && popularHotels.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            {popularHotels.map((hotel) => (
                                <div
                                    key={hotel.id}
                                    className="group rounded-xl overflow-hidden shadow-lg border border-gray-100 cursor-pointer bg-white hover:shadow-xl transition-shadow"
                                    onClick={() => navigate(`/hotels/detail/${hotel.id}`)}
                                >
                                    <div className="relative h-48 overflow-hidden">
                                        <img
                                            src={getHotelImage(hotel)}
                                            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                                            alt={hotel.name}
                                        />
                                        {hotel.chainName && (
                                            <div className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm px-2 py-1 rounded text-xs font-bold text-gray-700">
                                                {hotel.chainName}
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between mb-2">
                                            <h3 className="font-bold text-gray-900 text-sm line-clamp-2 leading-tight">{hotel.name}</h3>
                                            {hotel.starRating && (
                                                <div className="flex items-center gap-0.5 ml-2 shrink-0">
                                                    {Array.from({ length: Math.min(hotel.starRating, 5) }).map((_, i) => (
                                                        <Star key={i} size={10} className="fill-yellow-400 text-yellow-400" />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                        <p className="text-gray-500 text-xs mb-3">
                                            {hotel.city}{hotel.countryCode && `, ${hotel.countryCode}`}
                                        </p>
                                        {hotel.hotelType && (
                                            <span className="inline-block bg-indigo-50 text-indigo-600 text-xs px-2 py-1 rounded-full">
                                                {hotel.hotelType}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Empty State for Hotels */}
                    {!isLoadingHotels && popularHotels.length === 0 && (
                        <div className="bg-gray-50 rounded-xl p-8 text-center">
                            <Building2 className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                            <p className="text-gray-500 text-sm">No featured hotels available at the moment.</p>
                        </div>
                    )}
                </section>

                {/* ─── Featured Destination Guide from Wikivoyage ─────────────────────────────────────── */}
                {(wikivoyageContent || isLoadingWiki) && (
                    <section className="mb-16">
                        <div className="flex items-center justify-between mb-8">
                            <div>
                                <h2 className="text-xl font-bold text-gray-900 uppercase tracking-wider">Discover Your Destination</h2>
                                <p className="text-gray-500 text-sm mt-1">Travel guide powered by Wikivoyage</p>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-indigo-600">
                                <BookOpen className="w-4 h-4" />
                                <span>Powered by Wikivoyage</span>
                            </div>
                        </div>
                        
                        <DestinationContentCard
                            destination={featuredDestination}
                            content={wikivoyageContent}
                            isLoading={isLoadingWiki}
                            variant="featured"
                            onExplore={() => navigate(`/hotels/list?location=${encodeURIComponent(featuredDestination)}`)}
                        />
                    </section>
                )}

                {/* ─── Trending Destinations Section (from PostgreSQL) ─────────────────────────────── */}
                <section className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 mb-16">
                    <div className="flex items-center gap-8 border-b pb-4 mb-8 overflow-x-auto">
                        <h3 className="font-bold text-lg whitespace-nowrap flex items-center gap-2">
                            <TrendingUp className="w-5 h-5 text-[#6366F1]" />
                            Trending Destinations
                        </h3>
                        {['All', 'Cities', 'Regions', 'Countries'].map(tab => (
                            <button
                                key={tab}
                                className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${activeTab === tab ? 'border-[#6366F1] text-[#6366F1]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                                onClick={() => setActiveTab(tab)}
                            >
                                {tab}
                            </button>
                        ))}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                        {/* Column 1: Top by hotel count */}
                        <div className="space-y-3">
                            <p className="text-[#6366F1] font-bold text-sm bg-indigo-50 inline-block px-2 py-1 rounded">Most Hotels</p>
                            <ul className="text-xs text-blue-500 space-y-2 font-medium">
                                {popularDestinations
                                    .filter(d => activeTab === 'All' || d.destinationType?.toLowerCase().includes(activeTab.toLowerCase().replace('ies', 'y').replace('s', '')))
                                    .slice(0, 5)
                                    .map(d => (
                                        <li
                                            key={d.id}
                                            className="hover:underline cursor-pointer"
                                            onClick={() => navigate(`/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`)}
                                        >
                                            {d.name}, {d.countryCode}
                                            <span className="ml-1 text-gray-400">({d.hotelCount?.toLocaleString()} hotels)</span>
                                        </li>
                                    ))
                                }
                            </ul>
                        </div>

                        {/* Column 2: Next batch */}
                        <div className="space-y-3">
                            <p className="text-gray-500 font-bold text-sm">Top Destinations</p>
                            <ul className="text-xs text-blue-500 space-y-2 font-medium">
                                {popularDestinations.slice(5, 10).map(d => (
                                    <li
                                        key={d.id}
                                        className="hover:underline cursor-pointer"
                                        onClick={() => navigate(`/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`)}
                                    >
                                        {d.name}, {d.countryCode}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 3: Next batch */}
                        <div className="space-y-3">
                            <p className="text-gray-500 font-bold text-sm">More Destinations</p>
                            <ul className="text-xs text-blue-500 space-y-2 font-medium">
                                {popularDestinations.slice(10, 15).map(d => (
                                    <li
                                        key={d.id}
                                        className="hover:underline cursor-pointer"
                                        onClick={() => navigate(`/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`)}
                                    >
                                        {d.name}, {d.countryCode}
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* Column 4: Final batch */}
                        <div className="space-y-3">
                            <p className="text-gray-500 font-bold text-sm">Explore More</p>
                            <ul className="text-xs text-blue-500 space-y-2 font-medium">
                                {popularDestinations.slice(15, 20).map(d => (
                                    <li
                                        key={d.id}
                                        className="hover:underline cursor-pointer"
                                        onClick={() => navigate(`/hotels/list?location=${encodeURIComponent(d.name)}&countryCode=${d.countryCode}`)}
                                    >
                                        {d.name}, {d.countryCode}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </TripLogerLayout>
    );
}
