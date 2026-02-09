import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { Search, MapPin, Calendar, User, ChevronRight, ChevronLeft } from 'lucide-react';
import { SearchAutocomplete, Suggestion } from '../components/ui/SearchAutocomplete';
import { TravelerSelector } from '../components/ui/TravelerSelector';
import { CabinSelector } from '../components/ui/CabinSelector';
import { DualMonthCalendar } from '../components/ui/DualMonthCalendar';
import { format } from 'date-fns';

export default function FlightHome() {
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState('Middle East');
    const [from, setFrom] = useState('');
    const [to, setTo] = useState('');
    const [fromCode, setFromCode] = useState('');
    const [toCode, setToCode] = useState('');
    const [departureDate, setDepartureDate] = useState<Date | null>(null);
    const [returnDate, setReturnDate] = useState<Date | null>(null);
    const [tripType, setTripType] = useState<'roundTrip' | 'oneWay' | 'multiCity'>('roundTrip');

    const handleSearch = () => {
        const params = new URLSearchParams();
        if (fromCode) params.set('origin', fromCode);
        else if (from) params.set('origin', from); // fallback

        if (toCode) params.set('destination', toCode);
        else if (to) params.set('destination', to); // fallback

        if (departureDate) params.set('departureDate', format(departureDate, 'yyyy-MM-dd'));
        if (returnDate && tripType === 'roundTrip') params.set('returnDate', format(returnDate, 'yyyy-MM-dd'));
        params.set('adults', '1'); // Default to 1 adult
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

                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            {/* Trip Type & Class */}
                            <div className="col-span-12 flex gap-4 mb-2 text-white text-sm font-medium px-2 items-center flex-wrap">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trip"
                                        checked={tripType === 'roundTrip'}
                                        onChange={() => setTripType('roundTrip')}
                                        className="accent-[#8B5CF6] w-4 h-4"
                                    /> Round Trip
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trip"
                                        checked={tripType === 'oneWay'}
                                        onChange={() => setTripType('oneWay')}
                                        className="accent-[#8B5CF6] w-4 h-4"
                                    /> One Way
                                </label>
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="radio"
                                        name="trip"
                                        checked={tripType === 'multiCity'}
                                        onChange={() => setTripType('multiCity')}
                                        className="accent-[#8B5CF6] w-4 h-4"
                                    /> Multi-City
                                </label>
                                <div className="ml-auto flex items-center gap-4">
                                    <CabinSelector />
                                    <TravelerSelector />
                                </div>
                            </div>

                            {/* From Input */}
                            <div className="col-span-12 md:col-span-3">
                                <SearchAutocomplete
                                    type="flight"
                                    placeholder="From where?"
                                    icon={<MapPin size={20} />}
                                    value={from}
                                    onChange={setFrom}
                                    onSelect={(loc: Suggestion) => {
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
                            <div className="hidden md:flex col-span-1 items-center justify-center pb-2">
                                <button
                                    onClick={() => {
                                        const tmp = from; setFrom(to); setTo(tmp);
                                        const tmpCode = fromCode; setFromCode(toCode); setToCode(tmpCode);
                                    }}
                                    className="bg-white/20 p-2 rounded-full hover:bg-white/30 backdrop-blur-sm text-white transition-colors"
                                >
                                    <div className="bg-white rounded-full p-1 shadow-lg">
                                        <ChevronRight size={16} className="text-[#8B5CF6]" />
                                    </div>
                                </button>
                            </div>

                            {/* To Input */}
                            <div className="col-span-12 md:col-span-3">
                                <SearchAutocomplete
                                    type="flight"
                                    placeholder="To where?"
                                    icon={<MapPin size={20} />}
                                    value={to}
                                    onChange={setTo}
                                    onSelect={(loc: Suggestion) => {
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

                            {/* Date Picker - Dual Month Calendar */}
                            <div className="col-span-12 md:col-span-3">
                                <DualMonthCalendar
                                    departureDate={departureDate}
                                    returnDate={returnDate}
                                    onDepartureDateChange={setDepartureDate}
                                    onReturnDateChange={setReturnDate}
                                    mode="flight"
                                    departureLabel="Departure"
                                    returnLabel="Return"
                                />
                            </div>

                            {/* Search Button */}
                            <div className="col-span-12 md:col-span-2">
                                <button
                                    onClick={handleSearch}
                                    data-testid="flight-search-submit"
                                    className="w-full h-12 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-bold text-base rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2"
                                >
                                    <Search size={20} />
                                    Search
                                </button>
                            </div>
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

            {/* Popular Flights Carousel */}
            <div className="container mx-auto px-4 py-12">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Popular flights in top destinations</h2>
                <p className="text-gray-500 mb-8 text-sm">Find deals on domestic and international flights</p>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                        { city: 'Dubai', img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkR1YmFpIENpdHkgSW1hZ2U8L3RleHQ+PC9zdmc+' },
                        { city: 'Giza', img: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjRjNFNUYxIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzAwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkdpemEgQ2l0eSBJbWFnZTwvdGV4dD48L3N2Zz4=' },
                        { city: 'Bangkok', img: 'https://images.unsplash.com/photo-1508009603885-50cf7c579365?auto=format&fit=crop&q=80' },
                        { city: 'Buckingham', img: 'https://images.unsplash.com/photo-1526129318478-62ed807ebdf9?auto=format&fit=crop&q=80' },
                        { city: 'London', img: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80' },
                    ].map((dest, i) => (
                        <div key={i} className="group relative rounded-xl overflow-hidden aspect-[4/3] cursor-pointer shadow-md">
                            <img src={dest.img} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10"></div>
                            <div className="absolute bottom-0 left-0 w-full bg-[#FFD700] py-2 text-center font-bold text-xs uppercase tracking-wider text-black">
                                {dest.city}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between items-center mt-4">
                    <button className="p-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200"><ChevronLeft size={20} /></button>
                    <button className="p-2 rounded-full bg-blue-600 text-white shadow-lg shadow-blue-200"><ChevronRight size={20} /></button>
                </div>
            </div>

            {/* Trending Flights Lists with Region Tabs */}
            <div className="container mx-auto px-4 py-12 bg-white rounded-3xl mb-20 shadow-sm border border-gray-100">
                <div className="flex items-center gap-8 border-b pb-4 mb-8 overflow-x-auto">
                    <h3 className="font-bold text-lg whitespace-nowrap">Trending Flights</h3>
                    {['Middle East', 'Asia', 'Europe', 'Africa', 'Americas', 'Australia'].map(region => (
                        <button
                            key={region}
                            className={`text-sm font-bold pb-4 -mb-4 border-b-2 transition-colors whitespace-nowrap px-2 ${activeTab === region ? 'border-[#003B95] text-[#003B95]' : 'border-transparent text-gray-500 hover:text-gray-800'}`}
                            onClick={() => setActiveTab(region)}
                        >
                            {region}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                    {/* Mock data switching based on tab - simplifying for demo */}
                    <div className="space-y-3">
                        <p className="text-[#6366F1] font-bold text-sm bg-indigo-50 inline-block px-2 py-1 rounded">{activeTab}</p>
                        <ul className="text-xs text-blue-500 space-y-2 font-medium">
                            <li>Flights to Popular City 1, {activeTab}</li>
                            <li>Flights to Popular City 2, {activeTab}</li>
                            <li>Flights to Popular City 3, {activeTab}</li>
                            <li>Flights to Popular City 4, {activeTab}</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <p className="text-gray-500 font-bold text-sm">Top Destinations</p>
                        <ul className="text-xs text-blue-500 space-y-2 font-medium">
                            <li>Cheap flights to Capital A</li>
                            <li>Cheap flights to Hub B</li>
                            <li>Cheap flights to Resort C</li>
                            <li>Cheap flights to Island D</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <p className="text-gray-500 font-bold text-sm">From Your Location</p>
                        <ul className="text-xs text-blue-500 space-y-2 font-medium">
                            <li>Direct to City X</li>
                            <li>Direct to City Y</li>
                            <li>Direct to City Z</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        <p className="text-gray-500 font-bold text-sm">Airlines</p>
                        <ul className="text-xs text-blue-500 space-y-2 font-medium">
                            <li>{activeTab} Airlines</li>
                            <li>National Carrier</li>
                            <li>Low Cost Fly</li>
                        </ul>
                    </div>
                </div>
            </div>
        </TripLogerLayout>
    );
}