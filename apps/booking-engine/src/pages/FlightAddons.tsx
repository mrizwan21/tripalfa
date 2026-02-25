/**
 * FlightAddons – Add-ons / Ancillary Services Page
 * =================================================
 * All data is sourced in real-time from Duffel's available_services
 * returned with every offer.  No prices, service names, or types are
 * hardcoded here – everything flows from the offer object passed via
 * React Router's location.state.
 *
 * Services that Duffel provides via available_services:
 *   • baggage  – priced extras; id + quantity passed to BookingCheckout
 *   • seat     – navigates to /seat-selection (handled by SeatMaps API)
 *
 * Meal & Special-Request preferences use IATA SSR industry codes.
 * These are standard codes (not Duffel-specific or hardcoded prices)
 * and are forwarded to the order as metadata/passenger SSR.
 */

import React, { useState, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
    Luggage, Utensils, Armchair, ShieldCheck,
    ArrowRight, Check, Plus, AlertCircle, Loader2,
    ChevronDown, ChevronUp, Info
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { TripLogerLayout } from '../components/layout/TripLogerLayout';

// ─── IATA Standard Meal SSR Codes (industry standard – not hardcoded business logic) ─
const IATA_MEAL_SSRS = [
    { code: 'RVML', label: 'Regular Meal',        description: 'Standard airline meal' },
    { code: 'VGML', label: 'Vegetarian Meal',      description: 'Lacto-ovo vegetarian' },
    { code: 'AVML', label: 'Asian Vegetarian',     description: 'Asian/Indian vegetarian' },
    { code: 'MOML', label: 'Halal Meal',           description: 'Muslim meal – halal certified' },
    { code: 'KSML', label: 'Kosher Meal',          description: 'Jewish dietary law certified' },
    { code: 'VLML', label: 'Vegan Meal',           description: 'No animal products' },
    { code: 'LSML', label: 'Low Sodium',           description: 'Low salt / low sodium' },
    { code: 'DBML', label: 'Diabetic Meal',        description: 'Low sugar / diabetic diet' },
    { code: 'LCML', label: 'Low Calorie',          description: 'Calorie controlled' },
    { code: 'GFML', label: 'Gluten Free',          description: 'No gluten or wheat products' },
    { code: 'CHML', label: "Children's Meal",      description: 'Kid-friendly portion and menu' },
    { code: 'BBML', label: 'Baby Meal',            description: 'Baby food (under 2 years)' },
] as const;

// ─── IATA Standard Special Service Request (SSR) Codes ──────────────────────
const IATA_SPECIAL_SSRS = [
    { code: 'WCHR', label: 'Wheelchair (Ramp)',     description: 'Cannot climb stairs; can walk short distances' },
    { code: 'WCHC', label: 'Wheelchair (Full)',      description: 'Completely immobile; carried to seat' },
    { code: 'WCHS', label: 'Wheelchair (Steps)',     description: 'Cannot climb aircraft steps' },
    { code: 'BLND', label: 'Blind Passenger',        description: 'Visually impaired traveller' },
    { code: 'DEAF', label: 'Deaf/Hard of Hearing',   description: 'Hearing impaired traveller' },
    { code: 'MEDA', label: 'Medical Case',           description: 'Requires medical assistance' },
    { code: 'OXYG', label: 'Oxygen Required',        description: 'Requires supplemental oxygen' },
    { code: 'DPNA', label: 'Disabled – No Assistance', description: 'Disabled but self-sufficient' },
    { code: 'UMNR', label: 'Unaccompanied Minor',   description: 'Child travelling without adult' },
    { code: 'STCR', label: 'Stretcher',             description: 'Passenger transported on stretcher' },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DuffelAncillary {
    id: string;
    name: string;
    description?: string;
    price: number;          // numeric (already parsed from total_amount)
    currency: string;
    type: 'baggage' | 'seat' | 'other';
    raw?: {
        maximum_quantity?: number;
        passenger_ids?: string[];
        segment_ids?: string[];
        metadata?: {
            type?: string;
            maximum_weight_kg?: number;
            maximum_depth_cm?: number;
            maximum_length_cm?: number;
            maximum_width_cm?: number;
        };
    };
}

interface SelectedBaggageService {
    id: string;
    quantity: number;
    name: string;
    priceEach: number;
    currency: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatMoney(amount: number, currency: string): string {
    try {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency,
            minimumFractionDigits: 2,
        }).format(amount);
    } catch {
        return `${currency} ${amount.toFixed(2)}`;
    }
}

function baggageLabel(svc: DuffelAncillary): string {
    const meta = svc.raw?.metadata;
    if (!meta) return svc.name || 'Extra Baggage';
    const typeLabel = meta.type === 'carry_on_bag' ? 'Carry-on Bag' : 'Checked Bag';
    const weightStr = meta.maximum_weight_kg ? ` – up to ${meta.maximum_weight_kg}kg` : '';
    const dimStr = (meta.maximum_length_cm && meta.maximum_width_cm && meta.maximum_depth_cm)
        ? ` (${meta.maximum_length_cm}×${meta.maximum_width_cm}×${meta.maximum_depth_cm}cm)`
        : '';
    return `${typeLabel}${weightStr}${dimStr}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function FlightAddons() {
    const navigate = useNavigate();
    const location = useLocation();

    // Flight + passengers come from navigation state set in FlightList.tsx
    const { flight, passengers: passengersCount, selectedFare } = (location.state || {}) as {
        flight: any;
        passengers?: { adults: number; children: number; infants: number };
        selectedFare?: any;
    };

    // ── Baggage state (Duffel available_services, type=baggage) ──────────────
    const [selectedBaggage, setSelectedBaggage] = useState<Map<string, SelectedBaggageService>>(new Map());

    // ── Meal SSR state ────────────────────────────────────────────────────────
    const [selectedMeals, setSelectedMeals] = useState<Set<string>>(new Set());
    const [showMealDetails, setShowMealDetails] = useState(false);

    // ── Special Requests SSR state ────────────────────────────────────────────
    const [selectedSSRs, setSelectedSSRs] = useState<Set<string>>(new Set());
    const [showSSRDetails, setShowSSRDetails] = useState(false);

    // ── Redirect if no flight was passed ──────────────────────────────────────
    if (!flight) {
        return (
            <TripLogerLayout>
                <div className="min-h-screen flex items-center justify-center bg-[#F8F9FA]">
                    <div className="text-center space-y-4">
                        <AlertCircle size={48} className="text-red-400 mx-auto" />
                        <h2 className="text-xl font-bold text-gray-900">No flight selected</h2>
                        <p className="text-gray-500 text-sm">Please go back and select a flight first.</p>
                        <Button onClick={() => navigate('/flights')} className="bg-[#152467] text-white rounded-xl px-8 py-3 font-bold">
                            Back to Flights
                        </Button>
                    </div>
                </div>
            </TripLogerLayout>
        );
    }

    // ── Partition ancillaries from Duffel by type ────────────────────────────
    const baggageServices: DuffelAncillary[] = useMemo(
        () => (flight.ancillaries || []).filter((a: DuffelAncillary) => a.type === 'baggage'),
        [flight]
    );
    const hasSeatServices: boolean = useMemo(
        () => (flight.ancillaries || []).some((a: DuffelAncillary) => a.type === 'seat'),
        [flight]
    );

    // ── Baggage handlers ──────────────────────────────────────────────────────
    const maxQty = (svc: DuffelAncillary) => svc.raw?.maximum_quantity ?? 1;

    const handleBaggageQty = (svc: DuffelAncillary, qty: number) => {
        if (qty <= 0) {
            setSelectedBaggage(prev => { const m = new Map(prev); m.delete(svc.id); return m; });
        } else {
            setSelectedBaggage(prev => new Map(prev).set(svc.id, {
                id: svc.id,
                quantity: Math.min(qty, maxQty(svc)),
                name: baggageLabel(svc),
                priceEach: svc.price,
                currency: svc.currency,
            }));
        }
    };

    // ── Total calculation (only priced Duffel services count) ────────────────
    const baggageTotal = useMemo(() => {
        let t = 0;
        selectedBaggage.forEach(s => { t += s.priceEach * s.quantity; });
        return t;
    }, [selectedBaggage]);

    const grandTotal = (flight.amount || 0) + baggageTotal;
    const currency = flight.currency || (baggageServices[0]?.currency) || 'USD';

    // ── Selected services to forward to PassengerDetails / BookingCheckout ───
    const selectedServiceIds = Array.from(selectedBaggage.values()).map(s => ({
        id: s.id,
        quantity: s.quantity,
    }));

    const handleContinue = () => {
        navigate('/passenger-details', {
            state: {
                flight,
                passengers: passengersCount,
                selectedFare,
                // Priced baggage services (Duffel service IDs + quantities)
                selectedServices: selectedServiceIds,
                // Meal + Special Request SSR codes (free preferences)
                mealSSRs: Array.from(selectedMeals),
                specialSSRs: Array.from(selectedSSRs),
                totalPrice: grandTotal,
            },
        });
    };

    return (
        <TripLogerLayout>
            <div className="bg-[#F8F9FA] min-h-screen pb-32 font-sans">

                {/* ── Progress Header ─────────────────────────────────────── */}
                <div className="bg-white border-b border-gray-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-[40%] h-full bg-gradient-to-l from-purple-50/50 to-transparent pointer-events-none" />
                    <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div className="space-y-4">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-xl bg-[#152467] flex items-center justify-center text-white shadow-lg shadow-purple-100">
                                        <Plus size={16} />
                                    </div>
                                    <h1 className="text-[10px] font-black text-[#152467] uppercase tracking-[0.3em]">Enhance Experience</h1>
                                </div>
                                <h2 className="text-3xl font-black text-gray-900 tracking-tighter">Premium Add-ons</h2>
                                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                    Services sourced in real-time from {flight.airline || 'the airline'}
                                </p>
                            </div>
                            {/* Step breadcrumb */}
                            <div className="flex items-center gap-4 bg-gray-50/50 p-2 rounded-2xl border border-gray-100">
                                {[
                                    { label: 'Selection', sub: 'Flight Secured', done: true },
                                    { label: 'Current',   sub: 'Add-ons',        done: false },
                                    { label: 'Next',      sub: 'Passengers',     done: false },
                                ].map((step, i) => (
                                    <div key={i} className={`flex items-center gap-3 px-6 py-2 ${i < 2 ? 'border-r border-gray-200' : ''}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step.done ? 'bg-green-100 text-green-600' : i === 1 ? 'bg-purple-100 text-purple-600' : 'bg-gray-100 text-gray-400'}`}>
                                            {step.done ? <Check size={14} /> : <Plus size={14} />}
                                        </div>
                                        <div className="text-left">
                                            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">{step.label}</p>
                                            <p className="text-[11px] font-bold text-gray-900">{step.sub}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="container mx-auto px-4 max-w-7xl mt-12">
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

                        {/* ── Main Column ───────────────────────────────────── */}
                        <div className="lg:col-span-8 space-y-10">

                            {/* ── 1. Extra Baggage (real Duffel available_services) ── */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-blue-50 flex items-center justify-center text-blue-600 shadow-inner">
                                        <Luggage size={32} strokeWidth={1.5} />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Extra Baggage</h3>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            Prices set by {flight.airline || 'the airline'} – fetched live from Duffel
                                        </p>
                                    </div>
                                </div>

                                {baggageServices.length === 0 ? (
                                    <div className="p-10 flex items-center gap-4 text-gray-400">
                                        <Info size={18} />
                                        <p className="text-sm font-semibold">
                                            No additional baggage services are available for this fare.
                                            Check your included allowance below.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="p-10 space-y-4">
                                        {baggageServices.map(svc => {
                                            const selected = selectedBaggage.get(svc.id);
                                            const qty = selected?.quantity ?? 0;
                                            const max = maxQty(svc);
                                            return (
                                                <div key={svc.id}
                                                    className={`flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-200 ${qty > 0 ? 'border-[#152467] bg-purple-50/30 ring-2 ring-[#152467]/10' : 'border-gray-100 hover:border-gray-200'}`}>
                                                    <div className="flex-1">
                                                        <p className={`text-sm font-black ${qty > 0 ? 'text-[#152467]' : 'text-gray-900'}`}>
                                                            {baggageLabel(svc)}
                                                        </p>
                                                        <p className="text-[11px] font-bold text-gray-400 mt-1">
                                                            {formatMoney(svc.price, svc.currency)} each · max {max} per person
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-3">
                                                        <button
                                                            onClick={() => handleBaggageQty(svc, qty - 1)}
                                                            disabled={qty === 0}
                                                            className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                                                        >−</button>
                                                        <span className="w-8 text-center font-black text-gray-900">{qty}</span>
                                                        <button
                                                            onClick={() => handleBaggageQty(svc, qty + 1)}
                                                            disabled={qty >= max}
                                                            className="w-9 h-9 rounded-full bg-[#152467] flex items-center justify-center text-white hover:bg-[#0A1C50] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg"
                                                        >+</button>
                                                    </div>
                                                </div>
                                            );
                                        })}

                                        {/* Included baggage info */}
                                        {flight.includedBags?.length > 0 && (
                                            <div className="mt-6 p-5 rounded-2xl bg-green-50 border border-green-100">
                                                <p className="text-[11px] font-black text-green-700 uppercase tracking-widest mb-2">Already included in your fare</p>
                                                {flight.includedBags.map((b: any, i: number) => (
                                                    <p key={i} className="text-xs text-green-600 font-semibold">
                                                        ✓ {b.quantity}× {b.type} bag
                                                        {b.maximum_weight_kg ? ` – up to ${b.maximum_weight_kg}kg` : b.weight ? ` – up to ${b.weight}kg` : ''}
                                                    </p>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                )}
                            </div>

                            {/* ── 2. Seat Selection ──────────────────────────── */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                                <div className="p-10 border-b border-gray-50 flex items-center gap-8">
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-purple-50 flex items-center justify-center text-purple-600 shadow-inner">
                                        <Armchair size={32} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Seat Selection</h3>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {hasSeatServices
                                                ? 'Seat map with pricing loaded from Duffel seat_maps API'
                                                : 'Seat map available – pricing shown on selection screen'}
                                        </p>
                                    </div>
                                    <Button
                                        onClick={() =>
                                            navigate('/seat-selection', {
                                                state: {
                                                    offer: flight,
                                                    passengers: passengersCount,
                                                },
                                            })
                                        }
                                        className="h-12 px-8 bg-[#152467] hover:bg-[#0A1C50] text-white rounded-xl text-[11px] font-black uppercase tracking-widest shadow-lg shadow-purple-200 flex items-center gap-2"
                                    >
                                        Choose Seat <ArrowRight size={16} />
                                    </Button>
                                </div>
                            </div>

                            {/* ── 3. Meal Preferences (IATA SSR codes) ──────── */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                                <button
                                    onClick={() => setShowMealDetails(v => !v)}
                                    className="w-full p-10 border-b border-gray-50 flex items-center gap-8 text-left hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-orange-50 flex items-center justify-center text-orange-600 shadow-inner flex-shrink-0">
                                        <Utensils size={32} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Meal Preference</h3>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {selectedMeals.size > 0
                                                ? `${selectedMeals.size} preference${selectedMeals.size > 1 ? 's' : ''} selected`
                                                : 'IATA SSR dietary preferences – complimentary request'}
                                        </p>
                                    </div>
                                    {showMealDetails ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>

                                {showMealDetails && (
                                    <div className="p-10 grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {IATA_MEAL_SSRS.map(meal => {
                                            const active = selectedMeals.has(meal.code);
                                            return (
                                                <button
                                                    key={meal.code}
                                                    onClick={() => setSelectedMeals(prev => {
                                                        const s = new Set(prev);
                                                        if (s.has(meal.code)) s.delete(meal.code); else s.add(meal.code);
                                                        return s;
                                                    })}
                                                    className={`flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-200 text-left ${active
                                                        ? 'border-[#152467] bg-purple-50/40 ring-2 ring-[#152467]/10'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'}`}
                                                >
                                                    <div>
                                                        <p className={`text-sm font-black transition-colors ${active ? 'text-[#152467]' : 'text-gray-900'}`}>
                                                            {meal.label}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">{meal.description}</p>
                                                        <p className="text-[9px] font-mono text-gray-300 mt-0.5">SSR: {meal.code}</p>
                                                    </div>
                                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-all ${active ? 'bg-[#152467] border-[#152467]' : 'border-gray-200'}`}>
                                                        {active && <Check size={14} className="text-white stroke-[3px]" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>

                            {/* ── 4. Special Requests (IATA SSR codes) ─────── */}
                            <div className="bg-white rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40 overflow-hidden">
                                <button
                                    onClick={() => setShowSSRDetails(v => !v)}
                                    className="w-full p-10 border-b border-gray-50 flex items-center gap-8 text-left hover:bg-gray-50/50 transition-colors"
                                >
                                    <div className="w-16 h-16 rounded-[1.5rem] bg-teal-50 flex items-center justify-center text-teal-600 shadow-inner flex-shrink-0">
                                        <ShieldCheck size={32} strokeWidth={1.5} />
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="text-2xl font-black text-gray-900 tracking-tight">Special Assistance</h3>
                                        <p className="text-[11px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                                            {selectedSSRs.size > 0
                                                ? `${selectedSSRs.size} request${selectedSSRs.size > 1 ? 's' : ''} selected`
                                                : 'Mobility, medical & accessibility – IATA SSR codes'}
                                        </p>
                                    </div>
                                    {showSSRDetails ? <ChevronUp size={20} className="text-gray-400" /> : <ChevronDown size={20} className="text-gray-400" />}
                                </button>

                                {showSSRDetails && (
                                    <div className="p-10 space-y-4">
                                        {IATA_SPECIAL_SSRS.map(ssr => {
                                            const active = selectedSSRs.has(ssr.code);
                                            return (
                                                <button
                                                    key={ssr.code}
                                                    onClick={() => setSelectedSSRs(prev => {
                                                        const s = new Set(prev);
                                                        if (s.has(ssr.code)) s.delete(ssr.code); else s.add(ssr.code);
                                                        return s;
                                                    })}
                                                    className={`w-full flex items-center justify-between p-6 rounded-[1.5rem] border transition-all duration-200 text-left ${active
                                                        ? 'border-teal-500 bg-teal-50/40 ring-2 ring-teal-500/10'
                                                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50/50'}`}
                                                >
                                                    <div>
                                                        <p className={`text-sm font-black transition-colors ${active ? 'text-teal-700' : 'text-gray-900'}`}>
                                                            {ssr.label}
                                                        </p>
                                                        <p className="text-[10px] text-gray-400 mt-0.5">{ssr.description}</p>
                                                        <p className="text-[9px] font-mono text-gray-300 mt-0.5">SSR: {ssr.code}</p>
                                                    </div>
                                                    <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-all ${active ? 'bg-teal-500 border-teal-500' : 'border-gray-200'}`}>
                                                        {active && <Check size={14} className="text-white stroke-[3px]" />}
                                                    </div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* ── Sidebar Summary ───────────────────────────────── */}
                        <div className="lg:col-span-4">
                            <div className="bg-[#111827] rounded-[2.5rem] p-10 text-white shadow-2xl sticky top-32">
                                <h3 className="text-xs font-black uppercase tracking-[0.3em] text-[#152467] mb-8">Trip Summary</h3>

                                <div className="space-y-5 mb-10 pb-10 border-b border-white/10">

                                    {/* Base fare */}
                                    <div className="flex justify-between items-center">
                                        <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Base Fare</span>
                                        <span className="text-white font-black text-sm">{formatMoney(flight.amount || 0, currency)}</span>
                                    </div>

                                    {/* Flight info */}
                                    {flight.origin && flight.destination && (
                                        <div className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                                            {flight.origin} → {flight.destination}
                                            {flight.airline && <span className="ml-2 text-gray-600">· {flight.airline}</span>}
                                        </div>
                                    )}

                                    {/* Selected baggage (real prices from Duffel) */}
                                    {Array.from(selectedBaggage.values()).map(svc => (
                                        <div key={svc.id} className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                {svc.name} ×{svc.quantity}
                                            </span>
                                            <span className="text-[11px] font-black text-[#152467]">
                                                +{formatMoney(svc.priceEach * svc.quantity, svc.currency)}
                                            </span>
                                        </div>
                                    ))}

                                    {/* Meal preferences (no cost) */}
                                    {selectedMeals.size > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Meal Preference ×{selectedMeals.size}
                                            </span>
                                            <span className="text-[11px] font-black text-green-400">Complimentary</span>
                                        </div>
                                    )}

                                    {/* Special requests (no cost) */}
                                    {selectedSSRs.size > 0 && (
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                                                Special Assistance ×{selectedSSRs.size}
                                            </span>
                                            <span className="text-[11px] font-black text-green-400">Complimentary</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-8">
                                    <div className="flex justify-between items-center">
                                        <span className="text-lg font-black uppercase tracking-widest">Total</span>
                                        <span className="text-3xl font-black text-[#152467]">{formatMoney(grandTotal, currency)}</span>
                                    </div>

                                    <Button
                                        onClick={handleContinue}
                                        className="w-full h-16 bg-[#152467] hover:bg-[#0A1C50] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl shadow-purple-900/40 transition-all hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3"
                                    >
                                        Confirm & Continue <ArrowRight size={18} />
                                    </Button>

                                    <button
                                        onClick={() => navigate(-1)}
                                        className="w-full text-[10px] font-bold text-gray-500 hover:text-white transition-colors uppercase tracking-[0.2em]"
                                    >
                                        Modify Flight Selection
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
