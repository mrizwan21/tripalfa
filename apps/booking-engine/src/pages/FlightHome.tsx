import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Search, MapPin, Calendar, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { SearchAutocomplete, Suggestion } from '../components/ui/SearchAutocomplete';
import { TravelerSelector } from '../components/ui/TravelerSelector';
import { CabinSelector } from '../components/ui/CabinSelector';
import { DualMonthCalendar } from '../components/ui/DualMonthCalendar';
import { format } from 'date-fns';

interface PopularDestination {
  id: string;
  name: string;
  countryName: string;
  countryCode: string;
  hotelCount: number;
  imageUrl?: string | null;
  destinationType?: string;
}

const PLACEHOLDER_DESTINATION_IMAGE = '/images/placeholder-destination.jpg';

export default function FlightHome() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Middle East');
    const [popularDestinations, setPopularDestinations] = useState<PopularDestination[]>([]);
    const [carouselStart, setCarouselStart] = useState(0);
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [fromCode, setFromCode] = useState('');
    const [toCode, setToCode] = useState('');
    const [departureDate, setDepartureDate] = useState<Date | null>(null);
    const [returnDate, setReturnDate] = useState<Date | null>(null);
    const [tripType, setTripType] = useState<'roundTrip' | 'oneWay' | 'multiCity'>('roundTrip');
    
    // Multi-city legs (minimum 2)
    const [multiCityLegs, setMultiCityLegs] = useState<Array<{
        from: string; fromCode: string; to: string; toCode: string; date: Date | null;
    }>>([
        { from: '', fromCode: '', to: '', toCode: '', date: null },
        { from: '', fromCode: '', to: '', toCode: '', date: null },
    ]);
    
    const addMultiCityLeg = () => {
        setMultiCityLegs(prev => [...prev, { from: '', fromCode: '', to: '', toCode: '', date: null }]);
    };
    
    const removeMultiCityLeg = (idx: number) => {
        if (multiCityLegs.length > 2) {
            setMultiCityLegs(prev => prev.filter((_, i) => i !== idx));
        }
    };
    
    const updateMultiCityLeg = (idx: number, field: string, value: any) => {
        setMultiCityLegs(prev => prev.map((leg, i) => i === idx ? { ...leg, [field]: value } : leg));
    };

    // Fetch popular destinations from PostgreSQL via static-data-service
    useEffect(() => {
        fetch('/static/popular-destinations?limit=20')
            .then(r => r.json())
            .then(d => {
                const data = Array.isArray(d) ? d : (d.data || []);
                setPopularDestinations(data.slice(0, 20));
            })
            .catch(() => {
                // Empty state — no hardcoded fallback destinations per spec
                setPopularDestinations([]);
            });
    }, []);

    const handleSearch = () => {
        const params = new URLSearchParams();
        params.set('tripType', tripType);
        
        // Multi-city: use leg[i][origin], leg[i][destination], leg[i][date] params
        if (tripType === 'multiCity') {
            multiCityLegs.forEach((leg, i) => {
                if (leg.fromCode) params.set(`leg[${i}][origin]`, leg.fromCode);
                else if (leg.from) params.set(`leg[${i}][origin]`, leg.from);
                if (leg.toCode) params.set(`leg[${i}][destination]`, leg.toCode);
                else if (leg.to) params.set(`leg[${i}][destination]`, leg.to);
                if (leg.date) params.set(`leg[${i}][date]`, format(leg.date, 'yyyy-MM-dd'));
            });
            params.set('adults', '1');
            navigate(`/flights/list?${params.toString()}`);
            return;
        }
        
        // One-way / Round-trip
        if (fromCode) params.set('origin', fromCode);
        else if (from) params.set('origin', from);

        if (toCode) params.set('destination', toCode);
        else if (to) params.set('destination', to);

        if (departureDate) params.set('departureDate', format(departureDate, 'yyyy-MM-dd'));
        if (returnDate && tripType === 'roundTrip') params.set('returnDate', format(returnDate, 'yyyy-MM-dd'));
        params.set('adults', '1');
        navigate(`/flights/list?${params.toString()}`);
    };

    return (
        <TripLogerLayout>
            {/* Hero Section */}
            <div className="relative h-[600px] flex items-center justify-center">
                {/* Background Image: Airplane Window/Wing view */}
                <div
                    className="absolute inset-0 bg-cover bg-center z-0"
                    style={{ backgroundImage: "url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05?q=80&w=2074&auto=format&fit=crop')" }}
                >
                    <div className="absolute inset-0 bg-black/20"></div>
                </div>

                <div className="container mx-auto px-4 relative z-10 flex flex-col items-center">
                    <h1 className="text-3xl md:text-5xl font-bold text-white mb-8 text-center drop-shadow-lg">
                        Compare and book flights with ease
                    </h1>
                    <p className="text-white/90 mb-8 max-w-2xl text-center drop-shadow-md">
                        Discover your next dream destination
                    </p>

                    {/* Glassmorphic Search Card */}
                    <div className="w-full max-w-5xl bg-white/10 backdrop-blur-md border border-white/20 rounded-3xl p-6 shadow-2xl" data-testid="flight-search-form">
                        {/* Hidden inputs for E2E testing */}
                        <select data-testid="flight-trip-type" className="hidden" value={tripType} onChange={(e) => setTripType(e.target.value as 'roundTrip' | 'oneWay' | 'multiCity')}>
                            <option value="roundTrip">Round Trip</option>
                            <option value="oneWay">One Way</option>
                            <option value="multiCity">Multi-City</option>
                        </select>
                        <input 
                            type="text" 
                            data-testid="flight-date" 
                            className="hidden" 
                            value={departureDate ? format(departureDate, 'yyyy-MM-dd') : ''} 
                            onChange={(e) => {
                                const date = new Date(e.target.value);
                                if (!isNaN(date.getTime())) {
                                    setDepartureDate(date);
                                }
                            }}
                        />

                        {/* Tabs */}
                        <div className="inline-flex bg-white/20 rounded-full p-1 mb-6 backdrop-blur-sm">
                            <button
                                onClick={() => navigate('/hotels')}
                                className="px-6 py-2 rounded-full text-white font-medium hover:bg-white/10 transition-colors flex items-center gap-2"
                            >
                                <span>Stays</span>
                            </button>
                            <button
                                className="px-6 py-2 rounded-full bg-white text-[#003B95] font-bold shadow-md flex items-center gap-2"
                            >
                                <span>Flights</span>
                            </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
                            {/* Trip Type & Class (Radio/Dropdowns) can go here relative */}
                            <div className="col-span-12 flex gap-4 mb-2 text-white text-xs font-bold px-2 items-center flex-wrap uppercase tracking-wider">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trip"
                                        checked={tripType === 'roundTrip'}
                                        onChange={() => setTripType('roundTrip')}
                                        className="accent-[#FFD700]"
                                    /> Round Trip
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trip"
                                        checked={tripType === 'oneWay'}
                                        onChange={() => setTripType('oneWay')}
                                        className="accent-[#FFD700]"
                                    /> One Way
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trip"
                                        checked={tripType === 'multiCity'}
                                        onChange={() => setTripType('multiCity')}
                                        className="accent-[#FFD700]"
                                    /> Multi-City
                                </label>
                                <div className="ml-auto flex items-center gap-4">
                                    <CabinSelector />
                                    <TravelerSelector />
                                </div>
                            </div>

                            {/* From Input */}
                            <div className="col-span-12 md:col-span-3 h-12">
                                <SearchAutocomplete
                                    type="flight"
                                    placeholder="From where?"
                                    icon={<MapPin size={20} />}
                                    value={from}
                                    onChange={setFrom}
                                    onSelect={(loc: Suggestion) => {
                                        // Display format: "Airport Name (CODE)"
                                        if (loc.type === 'AIRPORT') {
                                            setFrom(`${loc.title} (${loc.code})`);
                                            setFromCode(String(loc.code));
                                        } else {
                                            setFrom(loc.title);
                                            setFromCode(loc.title);
                                        }
                                    }}
                                    dataTestId="flight-from"
                                />
                            </div>

                            {/* Swap Icon */}
                            <div className="hidden md:flex col-span-1 items-center justify-center">
                                <button
                                    onClick={() => {
                                        const tmp = from; setFrom(to); setTo(tmp);
                                        const tmpCode = fromCode; setFromCode(toCode); setToCode(tmpCode);
                                    }}
                                    className="bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
                                >
                                    <div className="bg-white rounded-full p-1 shadow-lg">
                                        <ChevronRight size={16} className="text-[#003B95]" />
                                    </div>
                                </button>
                            </div>

                            {/* To Input */}
                            <div className="col-span-12 md:col-span-3 h-12">
                                <SearchAutocomplete
                                    type="flight"
                                    placeholder="To where?"
                                    icon={<MapPin size={20} />}
                                    value={to}
                                    onChange={setTo}
                                    onSelect={(loc: Suggestion) => {
                                        // Display format: "Airport Name (CODE)"
                                        if (loc.type === 'AIRPORT') {
                                            setTo(`${loc.title} (${loc.code})`);
                                            setToCode(String(loc.code));
                                        } else {
                                            setTo(loc.title);
                                            setToCode(loc.title);
                                        }
                                    }}
                                    dataTestId="flight-to"
                                />
                            </div>

                            {/* ── MULTI-CITY LEGS UI ────────────────────────────────────────────── */}
                            {tripType === 'multiCity' ? (
                                <div className="col-span-12 space-y-3">
                                    {multiCityLegs.map((leg, idx) => (
                                        <div key={idx} className="grid grid-cols-12 gap-2 items-center bg-white/5 rounded-xl p-3">
                                            <div className="col-span-3">
                                                <SearchAutocomplete
                                                    type="flight"
                                                    placeholder={`Leg ${idx + 1} From`}
                                                    icon={<MapPin size={16} />}
                                                    value={leg.from}
                                                    onChange={(v) => updateMultiCityLeg(idx, 'from', v)}
                                                    onSelect={(loc: Suggestion) => {
                                                        if (loc.type === 'AIRPORT') {
                                                            updateMultiCityLeg(idx, 'from', `${loc.title} (${loc.code})`);
                                                            updateMultiCityLeg(idx, 'fromCode', String(loc.code));
                                                        } else {
                                                            updateMultiCityLeg(idx, 'from', loc.title);
                                                            updateMultiCityLeg(idx, 'fromCode', loc.title);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <SearchAutocomplete
                                                    type="flight"
                                                    placeholder={`Leg ${idx + 1} To`}
                                                    icon={<MapPin size={16} />}
                                                    value={leg.to}
                                                    onChange={(v) => updateMultiCityLeg(idx, 'to', v)}
                                                    onSelect={(loc: Suggestion) => {
                                                        if (loc.type === 'AIRPORT') {
                                                            updateMultiCityLeg(idx, 'to', `${loc.title} (${loc.code})`);
                                                            updateMultiCityLeg(idx, 'toCode', String(loc.code));
                                                        } else {
                                                            updateMultiCityLeg(idx, 'to', loc.title);
                                                            updateMultiCityLeg(idx, 'toCode', loc.title);
                                                        }
                                                    }}
                                                />
                                            </div>
                                            <div className="col-span-3">
                                                <input
                                                    type="date"
                                                    value={leg.date ? format(leg.date, 'yyyy-MM-dd') : ''}
                                                    onChange={(e) => {
                                                        const d = e.target.value ? new Date(e.target.value) : null;
                                                        updateMultiCityLeg(idx, 'date', d);
                                                    }}
                                                    className="w-full h-10 px-3 rounded-lg bg-white/90 text-gray-900 text-sm font-medium border-0 focus:ring-2 focus:ring-[#FFD700]"
                                                />
                                            </div>
                                            <div className="col-span-3 flex items-center gap-2">
                                                {multiCityLegs.length > 2 && (
                                                    <button
                                                        onClick={() => removeMultiCityLeg(idx)}
                                                        className="text-red-400 hover:text-red-300 text-xs font-bold"
                                                    >
                                                        Remove
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                    <button
                                        onClick={addMultiCityLeg}
                                        className="text-white/80 hover:text-white text-xs font-bold flex items-center gap-1"
                                    >
                                        + Add another leg
                                    </button>
                                    
                                    {/* Multi-city Search Button */}
                                    <div className="pt-2">
                                        <button
                                            onClick={handleSearch}
                                            data-testid="flight-search-submit"
                                            className="h-12 px-8 bg-[#FFD700] hover:bg-[#F4CE14] text-black font-bold text-base rounded-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Search Multi-City
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <>
                                    {/* Date Picker - Dual Month Calendar */}
                                    <div className="col-span-12 md:col-span-3">
                                        <DualMonthCalendar
                                            departureDate={departureDate}
                                            returnDate={returnDate}
                                            onDepartureDateChange={setDepartureDate}
                                            onReturnDateChange={setReturnDate}
                                            mode="flight"
                                            departureLabel="Departure"
                                            returnLabel={tripType === 'roundTrip' ? 'Return' : undefined}
                                        />
                                    </div>

                                    {/* Search Button */}
                                    <div className="col-span-12 md:col-span-2">
                                        <button
                                            onClick={handleSearch}
                                            data-testid="flight-search-submit"
                                            className="w-full h-12 bg-[#FFD700] hover:bg-[#F4CE14] text-black font-bold text-base rounded-lg shadow-lg shadow-yellow-500/20 transition-all flex items-center justify-center gap-2"
                                        >
                                            Search
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Benefits Bar */}
            <div className="container mx-auto px-4 py-8">
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100 flex flex-col md:flex-row justify-around items-center gap-6">
                    <div className="flex items-center gap-4">
                        <img src="https://cdn-icons-png.flaticon.com/512/751/751463.png" className="w-10 h-10 object-contain" alt="Search" />
                        <div>
                            <h3 className="font-bold text-[#FF8C00]">Search a huge selection</h3>
                            <p className="text-xs text-gray-500 max-w-[200px]">Easily compare flights, airlines, and find the cheapest ones.</p>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-gray-100 hidden md:block"></div>
                    <div className="flex items-center gap-4">
                        <img src="https://cdn-icons-png.flaticon.com/512/2645/2645607.png" className="w-10 h-10 object-contain" alt="Fees" />
                        <div>
                            <h3 className="font-bold text-[#FF8C00]">Pay no hidden fees</h3>
                            <p className="text-xs text-gray-500 max-w-[200px]">Get the clearest price display with no hidden costs.</p>
                        </div>
                    </div>
                    <div className="w-px h-12 bg-gray-100 hidden md:block"></div>
                    <div className="flex items-center gap-4">
                        <img src="https://cdn-icons-png.flaticon.com/512/2921/2921226.png" className="w-10 h-10 object-contain" alt="Flexibility" />
                        <div>
                            <h3 className="font-bold text-[#FF8C00]">Get more flexibility</h3>
                            <p className="text-xs text-gray-500 max-w-[200px]">Change your dates or cancel easily with select providers.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Popular Flights Carousel – data from PostgreSQL */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular flights in top destinations</h2>
                <p className="text-gray-500 mb-8 text-sm">
                    Find deals on domestic and international flights
                    {popularDestinations.length > 0 && (
                        <span className="ml-2 text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium">
                            {popularDestinations.length} destinations from DB
                        </span>
                    )}
                </p>

                {/* Carousel window: show 5 at a time */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {popularDestinations.length > 0
                        ? popularDestinations.slice(carouselStart, carouselStart + 5).map((dest, i) => (
                            <div
                                key={dest.id}
                                className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer shadow-md"
                                onClick={() => navigate(`/hotels?destination=${encodeURIComponent(dest.name)}`)}
                            >
                                <img
                                    src={dest.imageUrl || '/images/placeholder-destination.jpg'}
                                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                    alt={dest.name}
                                />
                                <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10"></div>
                                <div className="absolute bottom-0 left-0 w-full bg-[#FFD700] py-2 text-center font-bold text-xs uppercase tracking-wider text-black">
                                    {dest.name}
                                    {dest.countryCode && <span className="ml-1 opacity-60">· {dest.countryCode}</span>}
                                </div>
                            </div>
                          ))
                        : /* Loading skeleton */
                          Array.from({ length: 5 }).map((_, i) => (
                            <div key={i} className="rounded-xl overflow-hidden aspect-[4/3] bg-gray-200 animate-pulse" />
                          ))
                    }
                </div>
                <div className="flex justify-between items-center mt-4">
                    <button
                        className="p-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 disabled:opacity-40"
                        onClick={() => setCarouselStart(Math.max(0, carouselStart - 5))}
                        disabled={carouselStart === 0}
                    >
                        <ChevronLeft size={20} />
                    </button>
                    <span className="text-xs text-gray-400">{carouselStart + 1}–{Math.min(carouselStart + 5, popularDestinations.length)} of {popularDestinations.length}</span>
                    <button
                        className="p-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200 disabled:opacity-40"
                        onClick={() => setCarouselStart(Math.min(popularDestinations.length - 5, carouselStart + 5))}
                        disabled={carouselStart + 5 >= popularDestinations.length}
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>
            </div>

            {/* Trending Destinations from PostgreSQL */}
            <div className="container mx-auto px-4 py-12 bg-white rounded-3xl mb-20 shadow-sm border border-gray-100">
                <div className="flex items-center gap-8 border-b pb-4 mb-8 overflow-x-auto">
                    <h3 className="font-bold text-lg whitespace-nowrap">Trending Destinations</h3>
                    {['All', 'Cities', 'Regions', 'Countries'].map(tab => (
                        <button
                            key={tab}
                            className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${activeTab === tab ? 'border-[#003B95] text-[#003B95]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
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
                                .filter(d => activeTab === 'All' || d.destinationType?.toLowerCase().includes(activeTab.toLowerCase().replace('ies','y').replace('s','')) )
                                .slice(0, 5)
                                .map(d => (
                                    <li key={d.id} className="hover:underline cursor-pointer" onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}>
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
                                <li key={d.id} className="hover:underline cursor-pointer" onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}>
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
                                <li key={d.id} className="hover:underline cursor-pointer" onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}>
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
                                <li key={d.id} className="hover:underline cursor-pointer" onClick={() => navigate(`/hotels?destination=${encodeURIComponent(d.name)}`)}>
                                    {d.name}, {d.countryCode}
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </div>
        </TripLogerLayout>
    );
}