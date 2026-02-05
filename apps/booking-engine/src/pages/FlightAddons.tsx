import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
    Luggage, Utensils, Armchair, ShieldCheck,
    ArrowRight, ArrowLeft, Plus, Minus, Check,
    Star, Coffee, Wifi, Tv, RefreshCw
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { formatCurrency } from '../lib/utils';
import { AddExtraBaggage } from '../components/flight/AddExtraBaggage';
import { SeatSelection } from '../components/flight/SeatSelection';
import { api } from '../lib/api';

export default function FlightAddons() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const id = searchParams.get('id');
    const [flight, setFlight] = useState<any>(null);

    const [addons, setAddons] = useState({
        extraBaggages: 0,
        meals: [] as string[],
        travelInsurance: false,
        priorityBoarding: false,
        wifi: false
    });

    useEffect(() => {
        if (id) {
            fetchFlightDetails(id);
        }
    }, [id]);

    const fetchFlightDetails = async (flightId: string) => {
        try {
            const flightData = await api.get(`/flights/${flightId}`);
            setFlight(flightData);
        } catch (error) {
            console.error('Failed to fetch flight details:', error);
            // Could navigate back or show error
        }
    };

    if (!flight) return null;

    const toggleMeal = (meal: string) => {
        setAddons(prev => ({
            ...prev,
            meals: prev.meals.includes(meal)
                ? prev.meals.filter(m => m !== meal)
                : [...prev.meals, meal]
        }));
    };

    const calculateTotal = () => {
        let total = flight.amount || 0;
        total += addons.extraBaggages * 50;
        total += addons.meals.length * 15;
        if (addons.travelInsurance) total += 35;
        if (addons.priorityBoarding) total += 20;
        if (addons.wifi) total += 15;
        return total;
    };

    return (
        <TripLogerLayout>
            <div className="bg-[#F8F9FA] min-h-screen pb-32 font-sans">
                {/* Elite Progress Header */}
                <div className="bg-white border-b border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#8B5CF6] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                                        <Plus size={16} />
                                    </div>
                                    <h1 className="text-[10px] font-black text-[#8B5CF6] uppercase tracking-[0.3em]">Enhance Experience</h1>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Premium Add-ons</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Tailor your journey with elite services</p>
                            </div>

                            <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 items-center">
                                <div className="flex items-center gap-3 px-6 py-2 border-r border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                                        <Check size={14} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Selection</p>
                                        <p className="text-[11px] font-bold text-gray-900">Flight Secured</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-2 border-r border-gray-200">
                                    <div className="w-8 h-8 rounded-full bg-purple-100 text-purple-600 flex items-center justify-center">
                                        <Plus size={14} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Current</p>
                                        <p className="text-[11px] font-bold text-gray-900">Add-ons</p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 px-6 py-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-100 text-gray-400 flex items-center justify-center">
                                        <Plus size={14} />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Next</p>
                                        <p className="text-[11px] font-bold text-gray-900">Passengers</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-7xl mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                        {/* Main Content Area */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* Extra Baggage Section */}
                            <AddExtraBaggage
                                count={addons.extraBaggages}
                                onChange={(val) => setAddons(p => ({ ...p, extraBaggages: val }))}
                            />

                            {/* In-flight Meals Section */}
                            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden group hover:shadow-2xl hover:shadow-orange-100/50 transition-all duration-500">
                                <div className="p-12 border-b border-gray-50">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner">
                                            <Utensils size={32} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Gourmet Dining</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">Select your preferred dining options</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-12 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {['Standard Meal', 'Vegetarian Elite', 'Low Sodium', 'Halal Verified'].map(meal => (
                                        <button
                                            key={meal}
                                            onClick={() => toggleMeal(meal)}
                                            className={`flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-300 ${addons.meals.includes(meal)
                                                ? 'border-[#8B5CF6] bg-white shadow-xl shadow-purple-100 ring-4 ring-[#8B5CF6]/5 scale-[1.02]'
                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="text-left">
                                                <p className={`text-sm font-black transition-colors ${addons.meals.includes(meal) ? 'text-[#8B5CF6]' : 'text-gray-900'}`}>{meal}</p>
                                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{formatCurrency(15)}</p>
                                            </div>
                                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${addons.meals.includes(meal) ? 'bg-[#8B5CF6] border-[#8B5CF6]' : 'border-gray-200'
                                                }`}>
                                                {addons.meals.includes(meal) && <Check size={16} className="text-white stroke-[3px]" />}
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Priority & Comfort Section */}
                            <div className="bg-white rounded-[3rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden group hover:shadow-2xl hover:shadow-purple-100/50 transition-all duration-500">
                                <div className="p-12 border-b border-gray-50">
                                    <div className="flex items-center gap-8">
                                        <div className="w-16 h-16 rounded-[1.5rem] bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                                            <Armchair size={32} strokeWidth={1.5} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black text-gray-900 tracking-tight">Priority & Comfort</h3>
                                            <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-2">Make your journey more comfortable</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="p-12 space-y-6">
                                    {/* Refund Protect Highlight */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-[2.5rem] p-10 border border-purple-100 relative overflow-hidden group">
                                        <div className="absolute top-0 right-0 w-64 h-64 bg-white/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                                        <div className="flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                                            <div className="flex items-center gap-8">
                                                <div className="w-16 h-16 rounded-[1.5rem] bg-white flex items-center justify-center text-[#8B5CF6] shadow-xl">
                                                    <RefreshCw size={32} strokeWidth={1.5} />
                                                </div>
                                                <div className="space-y-1">
                                                    <h3 className="text-xl font-black text-gray-900 tracking-tight">Refund Protection</h3>
                                                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-relaxed max-w-sm">Get 100% refund for any reason. Protect your booking against unexpected changes.</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-8">
                                                <div className="text-right">
                                                    <p className="text-[9px] font-black text-gray-400 uppercase tracking-[0.2em]">One-time fee</p>
                                                    <p className="text-2xl font-black text-[#8B5CF6]">{formatCurrency(29)}</p>
                                                </div>
                                                <Button
                                                    onClick={() => setAddons(prev => ({ ...prev, travelInsurance: !prev.travelInsurance }))}
                                                    className={`h-14 px-10 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${addons.travelInsurance
                                                        ? 'bg-green-500 text-white hover:bg-green-600'
                                                        : 'bg-[#8B5CF6] text-white hover:bg-[#7C3AED] shadow-xl shadow-purple-200'
                                                        }`}
                                                >
                                                    {addons.travelInsurance ? (
                                                        <span className="flex items-center gap-2"><Check size={14} /> Added to Cart</span>
                                                    ) : (
                                                        'Add to Cart'
                                                    )}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>

                                    {[
                                        { id: 'priorityBoarding', label: 'Priority Boarding', icon: <Star size={20} />, price: 20, desc: 'Be among the first to board' },
                                        { id: 'wifi', label: 'High Speed Wi-Fi', icon: <Wifi size={20} />, price: 15, desc: 'Unlimited connectivity during flight' }
                                    ].map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setAddons(prev => ({ ...prev, [p.id]: !prev[p.id as keyof typeof prev] }))}
                                            className={`w-full flex items-center justify-between p-8 rounded-[2rem] border transition-all duration-300 ${addons[p.id as keyof typeof addons]
                                                ? 'border-[#8B5CF6] bg-white shadow-xl shadow-purple-100 ring-4 ring-[#8B5CF6]/5 scale-[1.02]'
                                                : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'
                                                }`}
                                        >
                                            <div className="flex items-center gap-6 text-left">
                                                <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${addons[p.id as keyof typeof addons] ? 'bg-[#8B5CF6]/10 text-[#8B5CF6]' : 'bg-gray-50 text-gray-400'
                                                    }`}>
                                                    {p.icon}
                                                </div>
                                                <div>
                                                    <p className={`text-sm font-black ${addons[p.id as keyof typeof addons] ? 'text-[#8B5CF6]' : 'text-gray-900'}`}>{p.label}</p>
                                                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-1">{p.desc}</p>
                                                </div>
                                            </div>
                                            <div className="text-right flex items-center gap-6">
                                                <p className="text-lg font-black text-gray-900">{formatCurrency(p.price)}</p>
                                                <div className={`w-12 h-7 rounded-full relative transition-colors duration-300 ${addons[p.id as keyof typeof addons] ? 'bg-green-500' : 'bg-gray-200'
                                                    }`}>
                                                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all duration-300 shadow-sm ${addons[p.id as keyof typeof addons] ? 'left-6' : 'left-1'
                                                        }`} />
                                                </div>
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Seat Selection Integration */}
                            <SeatSelection />
                        </div>

                        {/* Sidebar Sticky Summary */}
                        <div className="lg:col-span-4">
                            <div className="bg-[#111827] rounded-[2.5rem] p-10 text-white shadow-2xl sticky top-32">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#8B5CF6] mb-8">Trip Summary</h3>

                                <div className="space-y-6 mb-10 pb-10 border-b border-white/10">
                                    <div className="flex justify-between items-center text-[11px] font-bold text-gray-400 uppercase tracking-widest">
                                        <span>Base Fare</span>
                                        <span className="text-white font-black">{formatCurrency(flight.amount)}</span>
                                    </div>

                                    {addons.extraBaggages > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Extra Baggage x{addons.extraBaggages}</span>
                                            <span className="text-[11px] font-black text-[#8B5CF6]">+{formatCurrency(addons.extraBaggages * 50)}</span>
                                        </div>
                                    )}

                                    {addons.meals.length > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Gourmet Meals x{addons.meals.length}</span>
                                            <span className="text-[11px] font-black text-[#8B5CF6]">+{formatCurrency(addons.meals.length * 15)}</span>
                                        </div>
                                    )}

                                    {addons.priorityBoarding && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Priority Boarding</span>
                                            <span className="text-[11px] font-black text-[#8B5CF6]">+{formatCurrency(20)}</span>
                                        </div>
                                    )}

                                    {addons.travelInsurance && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Travel Insurance</span>
                                            <span className="text-[11px] font-black text-[#8B5CF6]">+{formatCurrency(35)}</span>
                                        </div>
                                    )}

                                    {addons.wifi && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">High Speed Wi-Fi</span>
                                            <span className="text-[11px] font-black text-[#8B5CF6]">+{formatCurrency(15)}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black uppercase tracking-widest">Total</span>
                                        <span className="text-3xl font-black text-[#8B5CF6]">{formatCurrency(calculateTotal())}</span>
                                    </div>
                                    <Button
                                        onClick={() => navigate(`/passenger-details?type=flight&id=${id}`, { state: { flight, addons, totalPrice: calculateTotal() } })}
                                        className="w-full h-16 bg-[#8B5CF6] hover:bg-[#7C3AED] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Confirm & Continue <ArrowRight size={18} />
                                    </Button>
                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-full text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Modify Selection
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </TripLogerLayout>
    );
}
