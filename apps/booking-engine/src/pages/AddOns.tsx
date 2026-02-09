import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Plane, ChevronLeft, ChevronRight, Shield, Briefcase, Info, BadgeCheck, Star, ArrowLeft, Check, Ticket, Gift, CreditCard, ChevronDown, Armchair, Utensils, Luggage, User } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '../lib/utils';
import { FlightSegment } from '../lib/srs-types';
import { fetchLoyaltyPrograms } from '../lib/api';
import { 
    SeatSelectionPopup, 
    BaggageSelectionPopup, 
    MealSelectionPopup, 
    SpecialServicesPopup 
} from '../components/ancillary';
import { 
    Passenger, 
    FlightSegmentInfo, 
    SelectedSeat, 
    SelectedBaggage, 
    SelectedMeal, 
    SelectedSpecialService,
    AncillarySelections,
    calculateAncillarySummary,
    getPassengerAvatar
} from '../lib/ancillary-types';

interface LoyaltyProgram {
    id: string;
    airlineCode: string;
    airlineName: string;
    programName: string;
}

export default function AddOns() {
    const navigate = useNavigate();
    const location = useLocation();

    // Extract dynamic data from navigation state
    const { flight, selectedFare, passengers } = location.state || {};

    const [selectedAddons, setSelectedAddons] = useState<string[]>([]);
    const [couponApplied, setCouponApplied] = useState(false);
    const [couponCode, setCouponCode] = useState('');
    const [loyaltyPrograms, setLoyaltyPrograms] = useState<LoyaltyProgram[]>([]);
    const [selectedProgram, setSelectedProgram] = useState<string>('');
    const [frequentFlyerNumber, setFrequentFlyerNumber] = useState('');
    const [loyaltyDropdownOpen, setLoyaltyDropdownOpen] = useState(false);

    // Ancillary popup visibility states
    const [showSeatPopup, setShowSeatPopup] = useState(false);
    const [showBaggagePopup, setShowBaggagePopup] = useState(false);
    const [showMealPopup, setShowMealPopup] = useState(false);
    const [showSpecialServicesPopup, setShowSpecialServicesPopup] = useState(false);

    // Ancillary selections
    const [selectedSeats, setSelectedSeats] = useState<SelectedSeat[]>([]);
    const [selectedBaggage, setSelectedBaggage] = useState<SelectedBaggage[]>([]);
    const [selectedMeals, setSelectedMeals] = useState<SelectedMeal[]>([]);
    const [selectedSpecialServices, setSelectedSpecialServices] = useState<SelectedSpecialService[]>([]);

    // Fetch loyalty programs on mount
    useEffect(() => {
        const loadLoyaltyPrograms = async () => {
            try {
                const programs = await fetchLoyaltyPrograms();
                setLoyaltyPrograms(programs);
            } catch (error) {
                console.error('Failed to load loyalty programs:', error);
            }
        };
        loadLoyaltyPrograms();
    }, []);

    // Format passengers for ancillary components
    const formattedPassengers: Passenger[] = useMemo(() => {
        const passengerList: Passenger[] = [];
        let id = 1;
        
        // Add adults
        for (let i = 0; i < (passengers?.adults || 1); i++) {
            passengerList.push({
                id: `adult-${i + 1}`,
                type: 'Adult',
                firstName: `Adult ${i + 1}`,
                lastName: '',
                avatar: getPassengerAvatar(`Adult ${i + 1}`)
            });
            id++;
        }
        
        // Add children
        for (let i = 0; i < (passengers?.children || 0); i++) {
            passengerList.push({
                id: `child-${i + 1}`,
                type: 'Child',
                firstName: `Child ${i + 1}`,
                lastName: '',
                avatar: getPassengerAvatar(`Child ${i + 1}`)
            });
            id++;
        }
        
        // Add infants (only for meals and special services, not seats)
        for (let i = 0; i < (passengers?.infants || 0); i++) {
            passengerList.push({
                id: `infant-${i + 1}`,
                type: 'Infant',
                firstName: `Infant ${i + 1}`,
                lastName: '',
                avatar: getPassengerAvatar(`Infant ${i + 1}`)
            });
            id++;
        }
        
        return passengerList;
    }, [passengers]);

    // Format segments for ancillary components
    const formattedSegments: FlightSegmentInfo[] = useMemo(() => {
        if (!flight?.segments) return [];
        
        return flight.segments.map((seg: FlightSegment, idx: number) => ({
            id: `segment-${idx + 1}`,
            flightNumber: seg.flightNumber || `${seg.airline || 'XX'}${100 + idx}`,
            origin: seg.origin,
            destination: seg.destination,
            originCity: seg.originCity,
            destinationCity: seg.destinationCity,
            departureTime: seg.departureTime,
            arrivalTime: seg.arrivalTime,
            airline: seg.airline,
            airlineLogo: seg.airlineLogo
        }));
    }, [flight]);

    // Passengers eligible for seat selection (exclude infants)
    const seatEligiblePassengers = formattedPassengers.filter(p => p.type !== 'Infant');

    // Check if flight is LCC (low cost carrier)
    const isLCC = flight?.isLCC || flight?.carrierType === 'LCC' || false;

    // Calculate ancillary totals
    const ancillarySummary = calculateAncillarySummary({
        seats: selectedSeats,
        baggage: selectedBaggage,
        meals: selectedMeals,
        specialServices: selectedSpecialServices
    });

    const adults = passengers?.adults || 1;
    const children = passengers?.children || 0;
    const infants = passengers?.infants || 0;

    // Core pricing from the selected flight/fare
    const farePerPerson = selectedFare?.price || flight?.amount || 11000;
    const baseFare = farePerPerson * adults + (farePerPerson * 0.8 * children);

    const toggleAddon = (id: string) => {
        setSelectedAddons(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const calculateAddonTotal = () => {
        // Dynamic addon pricing (mocked per passenger for now)
        return selectedAddons.length * 240 * adults;
    };

    const addonTotal = calculateAddonTotal();
    const ancillaryTotal = ancillarySummary.total;
    const subTotal = baseFare + addonTotal + ancillaryTotal;
    const discount = couponApplied ? 129 : 0;
    const finalTotal = subTotal - discount;

    if (!flight) {
        return (
            <TripLogerLayout>
                <div className="flex h-screen items-center justify-center">
                    <div className="text-center">
                        <h2 className="text-2xl font-black text-gray-900 mb-4">No flight selected</h2>
                        <Button onClick={() => navigate('/flights')}>Go Back to Search</Button>
                    </div>
                </div>
            </TripLogerLayout>
        );
    }

    return (
        <TripLogerLayout>
            <div className="bg-[#F8F9FA] min-h-screen font-sans" data-testid="addons-page">

                {/* Top Sticky Header: Route Summary */}
                <div className="bg-[#1E1B4B] sticky top-0 z-40">
                    <div className="container mx-auto px-4 py-3 max-w-7xl flex items-center divide-x divide-white/10">
                        <button
                            onClick={() => navigate(-1)}
                            className="pr-6 text-white hover:text-[#8B5CF6] transition-colors"
                        >
                            <ArrowLeft size={24} />
                        </button>

                        {/* Segments Loop */}
                        {(flight.segments || []).map((seg: FlightSegment, i: number) => (
                            <div key={i} className="px-8 flex items-center gap-6">
                                <div className="flex items-center gap-3">
                                    <div className="text-center">
                                        <p className="text-lg font-black text-white">{seg.origin}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{seg.originCity}</p>
                                    </div>
                                    <div className="w-8 h-8 rounded-full bg-[#FFD700] flex items-center justify-center">
                                        <Plane size={14} className="text-[#1E1B4B]" />
                                    </div>
                                    <div className="text-center">
                                        <p className="text-lg font-black text-white">{seg.destination}</p>
                                        <p className="text-[10px] text-gray-400 font-bold">{seg.destinationCity}</p>
                                    </div>
                                </div>
                                <div className="h-10 w-px bg-white/10 mx-2" />
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-[#8B5CF6]">
                                        {new Date(seg.departureTime).toLocaleDateString([], { month: 'short', day: 'numeric' })} | {new Date(seg.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                    <p className="text-xs font-bold text-white mt-1">{seg.airline}</p>
                                    <p className="text-[10px] text-gray-400">{i === 0 ? 'Outgoing' : 'Segment'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="container mx-auto px-4 py-10 max-w-7xl">
                    <div className="flex flex-col lg:flex-row gap-8">

                        {/* Main Content: Add-ons Cards */}
                        <div className="flex-1 space-y-10">
                            <button
                                onClick={() => navigate(-1)}
                                className="flex items-center gap-2 text-[#8B5CF6] font-black text-xs uppercase tracking-widest mb-4 hover:translate-x-1 transition-transform"
                            >
                                <ArrowLeft size={16} /> Back
                            </button>

                            {/* Refund Protect Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden group">
                                <div className="h-64 relative bg-[url('https://images.unsplash.com/photo-1557804506-669a67965ba0')] bg-cover bg-center">
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="w-14 h-14 rounded-2xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-xl shadow-purple-500/20">
                                                <Shield size={32} />
                                            </div>
                                            <h2 className="text-3xl font-black text-[#FFD700]">Refund Protect</h2>
                                        </div>
                                        <p className="text-white/80 text-sm font-medium leading-relaxed max-w-md">
                                            Receive a FULL refund if you cannot travel due to a reason listed in the T&C, including 100% refundable booking.
                                        </p>
                                    </div>
                                </div>
                                <div className="p-10 space-y-8">
                                    <div className="flex items-center justify-between bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                        <h3 className="text-lg font-black text-gray-900">100% of your ticket are covered</h3>
                                        <div className="flex items-center gap-4">
                                            <span className="bg-[#FFD700] text-[#1E1B4B] text-[10px] font-black px-4 py-1.5 rounded-lg uppercase tracking-widest">Recommended!</span>
                                            <BadgeCheck size={32} className="text-gray-300" />
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-x-12 gap-y-4">
                                        {[
                                            'Sickness, accident or injury', 'Pre-existing medical conditions', 'Death of immediate family',
                                            'Travel Disruption', 'Adverse weather', 'Theft of documents'
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3">
                                                <Check size={16} className="text-[#8B5CF6]" />
                                                <span className="text-sm font-bold text-gray-500">{item}</span>
                                            </div>
                                        ))}
                                        <button className="text-[#8B5CF6] text-sm font-black mt-2 underline pl-7">... and more</button>
                                    </div>

                                    <div className="bg-purple-50/50 rounded-2xl p-6 border border-purple-100 flex items-center justify-between">
                                        <div className="space-y-1">
                                            <p className="text-xs font-black text-gray-900">Refund Protect has a 5* rating on TrustPilot</p>
                                            <p className="text-[10px] font-bold text-gray-400">Based on over 20,000 Independent customer reviews</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Star className="text-[#10B981] fill-[#10B981]" size={20} />
                                            <span className="text-sm font-black text-[#10B981]">Trustpilot</span>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-between pt-4">
                                        <div className="flex gap-4">
                                            <button
                                                onClick={() => toggleAddon('refund')}
                                                className={`px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${selectedAddons.includes('refund')
                                                    ? 'bg-[#8B5CF6] text-white shadow-lg shadow-purple-200'
                                                    : 'border-2 border-gray-100 text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6]'
                                                    }`}
                                            >
                                                {selectedAddons.includes('refund') ? 'Selected' : 'Add to Cart'}
                                            </button>
                                            <button
                                                onClick={() => selectedAddons.includes('refund') && toggleAddon('refund')}
                                                className={`px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${!selectedAddons.includes('refund') ? 'border-[#8B5CF6] text-[#8B5CF6] bg-purple-50' : 'border-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                No thanks
                                            </button>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Only</p>
                                            <p className="text-2xl font-black text-gray-900">{formatCurrency(240)}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Baggage - TraceMe Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="h-56 relative bg-[url('https://images.unsplash.com/photo-1581092160562-40aa08e78837')] bg-cover bg-center">
                                    <div className="absolute inset-0 bg-black/40" />
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white"><Briefcase size={24} /></div>
                                            <h2 className="text-2xl font-black text-white">Baggage - TraceMe</h2>
                                        </div>
                                        <p className="text-white/80 text-xs font-medium">Avoid inconvenience & expenses due to mishandled and delayed bags.</p>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="flex items-center justify-between mb-8 bg-gray-50/50 p-6 rounded-3xl border border-gray-100">
                                        <h3 className="text-lg font-black text-gray-900">Secure your Bags</h3>
                                        <span className="bg-[#FFD700] text-[#1E1B4B] text-[10px] font-black px-4 py-1.5 rounded-lg">Recommended!</span>
                                    </div>
                                    <ul className="space-y-4 mb-10">
                                        {[
                                            'Receive Smart ID tags for your bags recognized at over 250 airports globally',
                                            'Receive your recovered bags at your destination airport',
                                            'Receive $1,000 if your bags are not available at the airport within 100 hours'
                                        ].map((item, i) => (
                                            <li key={i} className="flex items-start gap-3">
                                                <Check size={16} className="text-[#8B5CF6] mt-1 shrink-0" />
                                                <span className="text-sm font-bold text-gray-500 leading-relaxed">{item}</span>
                                            </li>
                                        ))}
                                    </ul>
                                    <div className="flex items-center justify-between">
                                        <div className="flex gap-4">
                                            <button
                                                data-testid="baggage-addon"
                                                onClick={() => toggleAddon('baggage')}
                                                className={`px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${selectedAddons.includes('baggage') ? 'bg-[#8B5CF6] border-[#8B5CF6] text-white shadow-lg shadow-purple-200' : 'border-gray-100 text-gray-400 hover:border-[#8B5CF6] hover:text-[#8B5CF6]'
                                                    }`}
                                            >
                                                {selectedAddons.includes('baggage') ? 'Selected' : 'Add to Cart'}
                                            </button>
                                            <button
                                                onClick={() => selectedAddons.includes('baggage') && toggleAddon('baggage')}
                                                className={`px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest border-2 transition-all ${!selectedAddons.includes('baggage') ? 'border-[#8B5CF6] text-[#8B5CF6] bg-purple-50' : 'border-gray-100 text-gray-400'
                                                    }`}
                                            >
                                                No thanks
                                            </button>
                                        </div>
                                        <p className="text-2xl font-black text-gray-900">{formatCurrency(240)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Seat Selection Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="h-48 relative bg-gradient-to-br from-purple-600 to-indigo-700">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1436491865332-7a61a109cc05')] bg-cover bg-center opacity-30" />
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white"><Armchair size={24} /></div>
                                            <h2 className="text-2xl font-black text-white">Seat Selection</h2>
                                        </div>
                                        <p className="text-white/80 text-xs font-medium">Choose your preferred seats for a comfortable journey</p>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex -space-x-2">
                                            {seatEligiblePassengers.map((p, i) => (
                                                <div key={p.id} className="w-8 h-8 rounded-full bg-purple-100 border-2 border-white flex items-center justify-center text-xs font-bold text-purple-600">
                                                    {p.firstName.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {seatEligiblePassengers.length} passenger{seatEligiblePassengers.length !== 1 ? 's' : ''} - {formattedSegments.length} flight{formattedSegments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    
                                    {selectedSeats.length > 0 && (
                                        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-sm font-bold text-green-700">
                                                {selectedSeats.length} seat{selectedSeats.length !== 1 ? 's' : ''} selected - {formatCurrency(ancillarySummary.seats)}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setShowSeatPopup(true)}
                                            className="px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-[#8B5CF6] text-white shadow-lg shadow-purple-200 hover:bg-[#7C3AED] transition-all"
                                        >
                                            {selectedSeats.length > 0 ? 'Modify Seats' : 'Select Seats'}
                                        </button>
                                        <p className="text-lg font-black text-gray-400">From {formatCurrency(isLCC ? 150 : 250)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Meal Selection Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="h-48 relative bg-gradient-to-br from-orange-500 to-red-600">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1544025162-d76694265947')] bg-cover bg-center opacity-30" />
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white"><Utensils size={24} /></div>
                                            <h2 className="text-2xl font-black text-white">In-Flight Meals</h2>
                                        </div>
                                        <p className="text-white/80 text-xs font-medium">{isLCC ? 'Pre-order delicious meals for your flight' : 'Choose your preferred meal options'}</p>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex -space-x-2">
                                            {formattedPassengers.map((p, i) => (
                                                <div key={p.id} className="w-8 h-8 rounded-full bg-orange-100 border-2 border-white flex items-center justify-center text-xs font-bold text-orange-600">
                                                    {p.firstName.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {formattedPassengers.length} passenger{formattedPassengers.length !== 1 ? 's' : ''} - {formattedSegments.length} flight{formattedSegments.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    
                                    {selectedMeals.length > 0 && (
                                        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-sm font-bold text-green-700">
                                                {selectedMeals.length} meal{selectedMeals.length !== 1 ? 's' : ''} selected - {formatCurrency(ancillarySummary.meals)}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setShowMealPopup(true)}
                                            className="px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-[#8B5CF6] text-white shadow-lg shadow-purple-200 hover:bg-[#7C3AED] transition-all"
                                        >
                                            {selectedMeals.length > 0 ? 'Modify Meals' : 'Select Meals'}
                                        </button>
                                        <p className="text-lg font-black text-gray-400">{isLCC ? `From ${formatCurrency(350)}` : 'Included'}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Extra Baggage Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="h-48 relative bg-gradient-to-br from-teal-500 to-cyan-600">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1565026057447-bc90a3dceb87')] bg-cover bg-center opacity-30" />
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white"><Luggage size={24} /></div>
                                            <h2 className="text-2xl font-black text-white">Extra Baggage</h2>
                                        </div>
                                        <p className="text-white/80 text-xs font-medium">Add additional checked baggage to your booking</p>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex -space-x-2">
                                            {formattedPassengers.filter(p => p.type !== 'Infant').map((p, i) => (
                                                <div key={p.id} className="w-8 h-8 rounded-full bg-teal-100 border-2 border-white flex items-center justify-center text-xs font-bold text-teal-600">
                                                    {p.firstName.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            {isLCC ? 'No baggage included' : '23kg per passenger included'}
                                        </span>
                                    </div>
                                    
                                    {selectedBaggage.length > 0 && (
                                        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-sm font-bold text-green-700">
                                                {selectedBaggage.length} extra bag{selectedBaggage.length !== 1 ? 's' : ''} - {formatCurrency(ancillarySummary.baggage)}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setShowBaggagePopup(true)}
                                            className="px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-[#8B5CF6] text-white shadow-lg shadow-purple-200 hover:bg-[#7C3AED] transition-all"
                                        >
                                            {selectedBaggage.length > 0 ? 'Modify Baggage' : 'Add Baggage'}
                                        </button>
                                        <p className="text-lg font-black text-gray-400">From {formatCurrency(500)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Special Services Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl overflow-hidden">
                                <div className="h-48 relative bg-gradient-to-br from-pink-500 to-rose-600">
                                    <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1521737604893-d14cc237f11d')] bg-cover bg-center opacity-20" />
                                    <div className="absolute inset-0 p-10 flex flex-col justify-end">
                                        <div className="flex items-center gap-4 mb-2">
                                            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center text-white"><User size={24} /></div>
                                            <h2 className="text-2xl font-black text-white">Special Services</h2>
                                        </div>
                                        <p className="text-white/80 text-xs font-medium">Request wheelchair, bassinet, or other assistance</p>
                                    </div>
                                </div>
                                <div className="p-10">
                                    <div className="flex items-center gap-4 mb-6">
                                        <div className="flex -space-x-2">
                                            {formattedPassengers.map((p, i) => (
                                                <div key={p.id} className="w-8 h-8 rounded-full bg-pink-100 border-2 border-white flex items-center justify-center text-xs font-bold text-pink-600">
                                                    {p.firstName.charAt(0)}
                                                </div>
                                            ))}
                                        </div>
                                        <span className="text-sm text-gray-500">
                                            Subject to availability
                                        </span>
                                    </div>
                                    
                                    {selectedSpecialServices.length > 0 && (
                                        <div className="mb-6 p-4 bg-green-50 rounded-xl border border-green-100">
                                            <p className="text-sm font-bold text-green-700">
                                                {selectedSpecialServices.length} service{selectedSpecialServices.length !== 1 ? 's' : ''} requested - {ancillarySummary.specialServices === 0 ? 'Free' : formatCurrency(ancillarySummary.specialServices)}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="flex items-center justify-between">
                                        <button
                                            onClick={() => setShowSpecialServicesPopup(true)}
                                            className="px-10 py-4 rounded-xl text-xs font-black uppercase tracking-widest bg-[#8B5CF6] text-white shadow-lg shadow-purple-200 hover:bg-[#7C3AED] transition-all"
                                        >
                                            {selectedSpecialServices.length > 0 ? 'Modify Services' : 'Request Service'}
                                        </button>
                                        <p className="text-lg font-black text-gray-400">Usually Free</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Sidebar: Fare Summary */}
                        <div className="lg:w-96 space-y-6">

                            {/* Main Summary Card */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl p-8 space-y-8">
                                <div className="flex items-center gap-3 pb-6 border-b border-gray-50">
                                    <div className="w-10 h-10 rounded-xl bg-purple-50 flex items-center justify-center text-[#8B5CF6]">
                                        <CreditCard size={20} />
                                    </div>
                                    <h3 className="text-lg font-black text-gray-900 uppercase tracking-widest">Fare Summary</h3>
                                </div>

                                {/* Air Ticket Breakdown */}
                                <div className="space-y-4">
                                    <div className="flex items-start gap-3">
                                        <Plane size={16} className="text-[#8B5CF6] mt-1" />
                                        <div className="flex-1 space-y-2">
                                            <div className="flex justify-between text-xs font-bold text-gray-500">
                                                <span>Air Ticket :</span>
                                                <div className="text-right">
                                                    <p>{formatCurrency(farePerPerson)} x {adults} Adult{adults > 1 ? 's' : ''}</p>
                                                    {children > 0 && <p>{formatCurrency(farePerPerson * 0.8)} x {children} Child{children > 1 ? 'ren' : ''}</p>}
                                                </div>
                                            </div>
                                            <div className="flex justify-between items-center pt-2">
                                                <span className="text-sm font-black text-gray-900">Base Fare:</span>
                                                <span className="text-sm font-black text-gray-900">{formatCurrency(baseFare * 0.85)}</span>
                                            </div>
                                            <div className="flex justify-between items-center text-[10px] text-gray-400 font-bold">
                                                <span>Taxes & Fees:</span>
                                                <span>{formatCurrency(baseFare * 0.15)}</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Add-ons Breakdown */}
                                <div className="pt-8 border-t border-gray-50 space-y-6">
                                    <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Travel Add-on's</p>
                                    <div className="space-y-3">
                                        {selectedAddons.length > 0 ? (
                                            selectedAddons.map((addon, i) => (
                                                <div key={i} className="flex justify-between text-[11px] font-bold text-gray-500">
                                                    <span className="capitalize">{addon.replace('-', ' ')} Service:</span>
                                                    <span>{formatCurrency(240)} x {adults}</span>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-[11px] font-bold text-gray-300 italic">No protection add-ons selected</p>
                                        )}
                                        <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                                            <span className="text-sm font-black text-gray-900">Add-ons Total:</span>
                                            <span className="text-sm font-black text-gray-900">{formatCurrency(addonTotal)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Ancillary Services Breakdown */}
                                {ancillaryTotal > 0 && (
                                    <div className="pt-8 border-t border-gray-50 space-y-6">
                                        <p className="text-sm font-black text-gray-900 uppercase tracking-widest">Ancillary Services</p>
                                        <div className="space-y-3">
                                            {selectedSeats.length > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-gray-500">
                                                    <span>Seat Selection ({selectedSeats.length}):</span>
                                                    <span>{formatCurrency(ancillarySummary.seats)}</span>
                                                </div>
                                            )}
                                            {selectedMeals.length > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-gray-500">
                                                    <span>Meals ({selectedMeals.length}):</span>
                                                    <span>{formatCurrency(ancillarySummary.meals)}</span>
                                                </div>
                                            )}
                                            {selectedBaggage.length > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-gray-500">
                                                    <span>Extra Baggage ({selectedBaggage.length}):</span>
                                                    <span>{formatCurrency(ancillarySummary.baggage)}</span>
                                                </div>
                                            )}
                                            {selectedSpecialServices.length > 0 && (
                                                <div className="flex justify-between text-[11px] font-bold text-gray-500">
                                                    <span>Special Services ({selectedSpecialServices.length}):</span>
                                                    <span>{ancillarySummary.specialServices === 0 ? 'Free' : formatCurrency(ancillarySummary.specialServices)}</span>
                                                </div>
                                            )}
                                            <div className="flex justify-between items-center pt-2 border-t border-dashed border-gray-100">
                                                <span className="text-sm font-black text-gray-900">Ancillary Total:</span>
                                                <span className="text-sm font-black text-gray-900">{formatCurrency(ancillaryTotal)}</span>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Totals Bar */}
                                <div className="bg-[#FFD700] rounded-[2rem] p-8 -mx-4 shadow-xl shadow-yellow-100">
                                    <div className="space-y-4">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black text-[#1E1B4B] uppercase">Grand Total :</span>
                                            <span className="text-sm font-black text-[#1E1B4B]">{formatCurrency(subTotal)}</span>
                                        </div>
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm font-black text-[#1E1B4B] uppercase">Discount Applied :</span>
                                            <span className="text-sm font-black text-[#1E1B4B]">{formatCurrency(discount)}</span>
                                        </div>
                                        <div className="h-px bg-[#1E1B4B]/10 my-2" />
                                        <div className="flex justify-between items-center">
                                            <span className="text-lg font-black text-[#1E1B4B]">Total :</span>
                                            <span className="text-xl font-black text-[#1E1B4B]">{formatCurrency(finalTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Coupon Section */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-lg p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Ticket className="text-[#8B5CF6]" size={20} />
                                    <p className="text-xs font-black text-gray-900">You have a discount coupon?</p>
                                </div>
                                <p className="text-[10px] font-bold text-gray-400 mb-4 uppercase tracking-widest">Please add your discount voucher</p>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={couponCode}
                                        onChange={(e) => setCouponCode(e.target.value)}
                                        placeholder="TRIPALFA129"
                                        className="flex-1 h-12 rounded-xl bg-gray-50 border border-gray-100 px-4 text-[10px] font-bold outline-none focus:border-[#8B5CF6]"
                                    />
                                    <Button
                                        onClick={() => {
                                            if (couponCode.toUpperCase() === 'TRIPALFA129') {
                                                setCouponApplied(true);
                                            }
                                        }}
                                        className="bg-[#8B5CF6] text-white px-3 h-12 rounded-xl text-[7px] font-black uppercase tracking-widest whitespace-nowrap"
                                    >
                                        Apply coupon
                                    </Button>
                                </div>
                            </div>

                            {/* Loyalty Program */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 shadow-lg p-8">
                                <div className="flex items-center gap-3 mb-6">
                                    <Gift className="text-[#8B5CF6]" size={20} />
                                    <h4 className="text-sm font-black text-gray-900">Loyalty Program</h4>
                                </div>
                                <p className="text-[10px] text-gray-400 font-bold leading-relaxed mb-6 uppercase tracking-widest">Being part of a family is a rewarding experience. Which is why we have redefined loyalty.</p>
                                <div className="space-y-4">
                                    {/* Loyalty Program Dropdown */}
                                    <div className="relative">
                                        <button
                                            onClick={() => setLoyaltyDropdownOpen(!loyaltyDropdownOpen)}
                                            className="w-full flex items-center justify-between h-12 px-4 rounded-xl border border-gray-100 text-sm font-bold text-gray-700 hover:border-[#8B5CF6] transition-colors"
                                        >
                                            <span className={selectedProgram ? 'text-gray-900' : 'text-gray-400'}>
                                                {selectedProgram 
                                                    ? loyaltyPrograms.find(p => p.id === selectedProgram)?.programName 
                                                    : 'Select Loyalty Program'}
                                            </span>
                                            <ChevronDown size={18} className={`transition-transform ${loyaltyDropdownOpen ? 'rotate-180' : ''}`} />
                                        </button>
                                        {loyaltyDropdownOpen && (
                                            <div className="absolute z-20 mt-2 w-full bg-white rounded-xl border border-gray-100 shadow-xl max-h-64 overflow-y-auto">
                                                {loyaltyPrograms.length === 0 ? (
                                                    <div className="px-4 py-3 text-sm text-gray-400">Loading programs...</div>
                                                ) : (
                                                    loyaltyPrograms.map(program => (
                                                        <button
                                                            key={program.id}
                                                            onClick={() => {
                                                                setSelectedProgram(program.id);
                                                                setLoyaltyDropdownOpen(false);
                                                            }}
                                                            className={`w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors ${
                                                                selectedProgram === program.id ? 'bg-purple-50' : ''
                                                            }`}
                                                        >
                                                            <div className="text-sm font-bold text-gray-900">{program.programName}</div>
                                                            <div className="text-xs text-gray-400">{program.airlineName} ({program.airlineCode})</div>
                                                        </button>
                                                    ))
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex gap-2">
                                        <input 
                                            id="frequent-flyer-number" 
                                            name="frequent-flyer-number" 
                                            type="text" 
                                            value={frequentFlyerNumber}
                                            onChange={(e) => setFrequentFlyerNumber(e.target.value)}
                                            placeholder="Frequent Flyer Number" 
                                            className="flex-1 h-12 rounded-xl border border-gray-100 px-4 text-sm font-bold outline-none focus:border-[#8B5CF6]" 
                                        />
                                        <Button 
                                            onClick={() => {
                                                if (selectedProgram && frequentFlyerNumber) {
                                                    console.log('Loyalty saved:', { program: selectedProgram, number: frequentFlyerNumber });
                                                }
                                            }}
                                            className="bg-[#8B5CF6] text-white px-8 h-12 rounded-xl text-[10px] font-black uppercase tracking-widest"
                                        >
                                            Submit
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Terms & Submit */}
                            <div className="bg-white rounded-[2rem] border border-gray-100 p-8 space-y-6">
                                <label className="flex gap-4 cursor-pointer group">
                                    <div className="w-5 h-5 rounded border-2 border-[#FFD700] shrink-0 mt-1 flex items-center justify-center">
                                        <div className="w-2.5 h-2.5 bg-[#FFD700] rounded-sm" />
                                    </div>
                                    <p className="text-[10px] text-gray-400 font-bold leading-relaxed group-hover:text-gray-600 transition-colors">
                                        I have read and accept your travel conditions, Fare Rules, the airline's general terms and conditions, and I have verified that I have entered my booking information correctly.
                                    </p>
                                </label>
                                <Button
                                    data-testid="continue-button"
                                    onClick={() => navigate('/passenger-details', {
                                        state: {
                                            flight,
                                            passengers,
                                            selectedFare,
                                            selectedAddons,
                                            finalTotal,
                                            ancillarySelections: {
                                                seats: selectedSeats,
                                                baggage: selectedBaggage,
                                                meals: selectedMeals,
                                                specialServices: selectedSpecialServices
                                            }
                                        }
                                    })}
                                    className="w-full py-5 rounded-2xl bg-[#8B5CF6] hover:bg-[#7C3AED] text-white font-black text-sm uppercase tracking-[3px] shadow-[0_12px_40_rgba(139,92,246,0.3)] transition-all active:scale-95"
                                >
                                    Submit
                                </Button>
                            </div>

                        </div>
                    </div>
                </div>

            </div>

            {/* Ancillary Popups */}
            <SeatSelectionPopup
                isOpen={showSeatPopup}
                onClose={() => setShowSeatPopup(false)}
                onConfirm={(seats) => {
                    setSelectedSeats(seats);
                    setShowSeatPopup(false);
                }}
                isLCC={isLCC}
                offerId={flight?.offerId}
                passengers={seatEligiblePassengers}
                segments={formattedSegments}
                existingSelections={selectedSeats}
            />

            <BaggageSelectionPopup
                isOpen={showBaggagePopup}
                onClose={() => setShowBaggagePopup(false)}
                onConfirm={(baggage) => {
                    setSelectedBaggage(baggage);
                    setShowBaggagePopup(false);
                }}
                isLCC={isLCC}
                passengers={formattedPassengers.filter(p => p.type !== 'Infant')}
                segments={formattedSegments}
                existingSelections={selectedBaggage}
            />

            <MealSelectionPopup
                isOpen={showMealPopup}
                onClose={() => setShowMealPopup(false)}
                onConfirm={(meals) => {
                    setSelectedMeals(meals);
                    setShowMealPopup(false);
                }}
                isLCC={isLCC}
                passengers={formattedPassengers}
                segments={formattedSegments}
                existingSelections={selectedMeals}
            />

            <SpecialServicesPopup
                isOpen={showSpecialServicesPopup}
                onClose={() => setShowSpecialServicesPopup(false)}
                onConfirm={(services) => {
                    setSelectedSpecialServices(services);
                    setShowSpecialServicesPopup(false);
                }}
                passengers={formattedPassengers}
                segments={formattedSegments}
                existingSelections={selectedSpecialServices}
            />
        </TripLogerLayout>
    );
}
