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
  Luggage,
  Utensils,
  Armchair,
  ShieldCheck,
  ArrowRight,
  Check,
  Plus,
  AlertCircle,
  Loader2,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';
import { Button } from '../components/ui/button'
import { TripLogerLayout } from '../components/layout/TripLogerLayout';
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

// ─── IATA Standard Meal SSR Codes (industry standard – not hardcoded business logic) ─
const IATA_MEAL_SSRS = [
  { code: 'RVML', label: 'Regular Meal', description: 'Standard airline meal' },
  {
    code: 'VGML',
    label: 'Vegetarian Meal',
    description: 'Lacto-ovo vegetarian',
  },
  {
    code: 'AVML',
    label: 'Asian Vegetarian',
    description: 'Asian/Indian vegetarian',
  },
  {
    code: 'MOML',
    label: 'Halal Meal',
    description: 'Muslim meal – halal certified',
  },
  {
    code: 'KSML',
    label: 'Kosher Meal',
    description: 'Jewish dietary law certified',
  },
  { code: 'VLML', label: 'Vegan Meal', description: 'No animal products' },
  { code: 'LSML', label: 'Low Sodium', description: 'Low salt / low sodium' },
  {
    code: 'DBML',
    label: 'Diabetic Meal',
    description: 'Low sugar / diabetic diet',
  },
  { code: 'LCML', label: 'Low Calorie', description: 'Calorie controlled' },
  {
    code: 'GFML',
    label: 'Gluten Free',
    description: 'No gluten or wheat products',
  },
  {
    code: 'CHML',
    label: "Children's Meal",
    description: 'Kid-friendly portion and menu',
  },
  {
    code: 'BBML',
    label: 'Baby Meal',
    description: 'Baby food (under 2 years)',
  },
] as const;

// ─── IATA Standard Special Service Request (SSR) Codes ──────────────────────
const IATA_SPECIAL_SSRS = [
  {
    code: 'WCHR',
    label: 'Wheelchair (Ramp)',
    description: 'Cannot climb stairs; can walk short distances',
  },
  {
    code: 'WCHC',
    label: 'Wheelchair (Full)',
    description: 'Completely immobile; carried to seat',
  },
  {
    code: 'WCHS',
    label: 'Wheelchair (Steps)',
    description: 'Cannot climb aircraft steps',
  },
  {
    code: 'BLND',
    label: 'Blind Passenger',
    description: 'Visually impaired traveller',
  },
  {
    code: 'DEAF',
    label: 'Deaf/Hard of Hearing',
    description: 'Hearing impaired traveller',
  },
  {
    code: 'MEDA',
    label: 'Medical Case',
    description: 'Requires medical assistance',
  },
  {
    code: 'OXYG',
    label: 'Oxygen Required',
    description: 'Requires supplemental oxygen',
  },
  {
    code: 'DPNA',
    label: 'Disabled – No Assistance',
    description: 'Disabled but self-sufficient',
  },
  {
    code: 'UMNR',
    label: 'Unaccompanied Minor',
    description: 'Child travelling without adult',
  },
  {
    code: 'STCR',
    label: 'Stretcher',
    description: 'Passenger transported on stretcher',
  },
] as const;

// ─── Types ────────────────────────────────────────────────────────────────────
interface DuffelAncillary {
  id: string;
  name: string;
  description?: string;
  price: number; // numeric (already parsed from total_amount)
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
  const dimStr =
    meta.maximum_length_cm && meta.maximum_width_cm && meta.maximum_depth_cm
      ? ` (${meta.maximum_length_cm}×${meta.maximum_width_cm}×${meta.maximum_depth_cm}cm)`
      : '';
  return `${typeLabel}${weightStr}${dimStr}`;
}

// ─── Component ────────────────────────────────────────────────────────────────
function FlightAddons() {
  const navigate = useNavigate();
  const location = useLocation();
  const { config: runtimeConfig } = useTenantRuntime();

  // Flight + passengers come from navigation state set in FlightList.tsx
  const {
    flight,
    passengers: passengersCount,
    selectedFare,
  } = (location.state || {}) as {
    flight: any;
    passengers?: { adults: number; children: number; infants: number };
    selectedFare?: any;
  };

  // ── Baggage state (Duffel available_services, type=baggage) ──────────────
  const [selectedBaggage, setSelectedBaggage] = useState<Map<string, SelectedBaggageService>>(
    new Map()
  );

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
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 gap-2">
          <div className="text-center space-y-4">
            <AlertCircle size={48} className="text-red-400 mx-auto" />
            <h2 className="text-xl font-bold text-gray-900">
              No flight selected
            </h2>
            <p className="text-sm text-gray-500">
              Please go back and select a flight first.
            </p>
            <button
              onClick={() => navigate('/flights')}
              className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
            >
              Back to Flights
            </button>
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
      setSelectedBaggage(prev => {
        const m = new Map(prev);
        m.delete(svc.id);
        return m;
      });
    } else {
      setSelectedBaggage(prev =>
        new Map(prev).set(svc.id, {
          id: svc.id,
          quantity: Math.min(qty, maxQty(svc)),
          name: baggageLabel(svc),
          priceEach: svc.price,
          currency: svc.currency,
        })
      );
    }
  };

  // ── Total calculation (only priced Duffel services count) ───────────────
  const baggageTotal = useMemo(() => {
    let t = 0;
    selectedBaggage.forEach(s => {
      t += s.priceEach * s.quantity;
    });
    return t;
  }, [selectedBaggage]);

  const grandTotal = (flight.amount || 0) + baggageTotal;
  const currency = flight.currency || baggageServices[0]?.currency || 'USD';

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
        selectedServices: runtimeConfig.features.ancillariesEnabled ? selectedServiceIds : [],
        // Meal + Special Request SSR codes (free preferences)
        mealSSRs: runtimeConfig.features.ancillariesEnabled ? Array.from(selectedMeals) : [],
        specialSSRs: runtimeConfig.features.ancillariesEnabled ? Array.from(selectedSSRs) : [],
        totalPrice: grandTotal,
      },
    });
  };

  if (!runtimeConfig.features.flightBookingEnabled) {
    return (
      <TripLogerLayout>
        <div className="min-h-screen flex items-center justify-center bg-gray-50/50 px-4 gap-2">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 text-center max-w-xl w-full">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">Flight Booking Disabled</h1>
            <p className="text-sm font-semibold text-gray-500 mb-6">
              Flight booking is currently disabled by your admin settings.
            </p>
            <button
              onClick={() => navigate('/')}
              className="bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] transition-all duration-200"
            >
              Back to Home
            </button>
          </div>
        </div>
      </TripLogerLayout>
    );
  }

  return (
    <TripLogerLayout>
      <div className="bg-gray-50/50 min-h-screen pb-32 font-sans">
        {/* ── Progress Header ─────────────────────────────────────── */}
        <div className="bg-white border-b border-gray-100 shadow-sm overflow-hidden relative">
          <div className="absolute top-0 right-0 w-[40%] h-full bg-blue-50/30 pointer-events-none" />
          <div className="container mx-auto px-4 max-w-7xl pt-12 pb-10 relative z-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-[#003b95] flex items-center justify-center text-white shadow-sm">
                    <Plus size={16} />
                  </div>
                  <h1 className="text-sm font-bold text-[#003b95] uppercase tracking-wider">
                    Enhance Experience
                  </h1>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
                  Premium Add-ons
                </h2>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                  Services sourced in real-time from {flight.airline || 'the airline'}
                </p>
              </div>
              {/* Step breadcrumb */}
              <div className="flex items-center gap-4 bg-gray-50 p-2 rounded-xl border border-gray-100">
                {[
                  { label: 'Selection', sub: 'Flight Secured', done: true },
                  { label: 'Current', sub: 'Add-ons', done: false },
                  { label: 'Next', sub: 'Passengers', done: false },
                ].map((step, i) => (
                  <div
                    key={i}
                    className={`flex items-center gap-3 px-6 py-2 ${i < 2 ? 'border-r border-gray-100' : ''}`}
                  >
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold ${step.done ? 'bg-green-100 text-green-700' : i === 1 ? 'bg-blue-100 text-[#003b95]' : 'bg-gray-100 text-gray-400'}`}
                    >
                      {step.done ? <Check size={14} /> : <Plus size={14} />}
                    </div>
                    <div className="text-left">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                        {step.label}
                      </p>
                      <p className="text-xs font-bold text-gray-900">{step.sub}</p>
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <Luggage size={28} strokeWidth={1.5} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      Extra Baggage
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                      Prices set by {flight.airline || 'the airline'} – fetched live from Duffel
                    </p>
                  </div>
                </div>

                {baggageServices.length === 0 ? (
                  <div className="p-8 flex items-center gap-4 text-gray-500">
                    <Info size={18} className="text-gray-400" />
                    <p className="text-sm font-semibold">
                      No additional baggage services are available for this fare. Check your
                      included allowance below.
                    </p>
                  </div>
                ) : (
                  <div className="p-8 space-y-4">
                    {baggageServices.map(svc => {
                      const selected = selectedBaggage.get(svc.id);
                      const qty = selected?.quantity ?? 0;
                      const max = maxQty(svc);
                      return (
                        <div
                          key={svc.id}
                          className={`flex items-center justify-between p-5 rounded-xl border transition-all duration-300 ${qty > 0 ? 'bg-white border-[#003b95] shadow-sm ring-2 ring-[#003b95]/10' : 'bg-white border-gray-100 hover:border-gray-200'}`}
                        >
                          <div className="flex-1 gap-4">
                            <p className={`text-sm font-bold ${qty > 0 ? 'text-[#003b95]' : 'text-gray-900'}`}>
                              {baggageLabel(svc)}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">
                              {formatMoney(svc.price, svc.currency)} each · max {max} per person
                            </p>
                          </div>
                          <div className="flex items-center gap-3">
                            <button
                              onClick={() => handleBaggageQty(svc, qty - 1)}
                              disabled={qty === 0 || !runtimeConfig.features.ancillariesEnabled}
                              className="w-9 h-9 rounded-full border border-gray-200 flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg transition-colors"
                            >
                              −
                            </button>
                            <span className="w-8 text-center font-bold text-gray-900">
                              {qty}
                            </span>
                            <button
                              onClick={() => handleBaggageQty(svc, qty + 1)}
                              disabled={qty >= max || !runtimeConfig.features.ancillariesEnabled}
                              className="w-9 h-9 rounded-full bg-[#003b95] flex items-center justify-center text-white hover:bg-[#002a6e] disabled:opacity-30 disabled:cursor-not-allowed font-bold text-lg shadow-sm transition-colors"
                            >
                              +
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {/* Included baggage info */}
                    {flight.includedBags?.length > 0 && (
                      <div className="mt-6 p-5 rounded-xl bg-green-50 border border-green-100">
                        <p className="text-xs font-bold text-green-800 uppercase tracking-wider mb-2">
                          Already included in your fare
                        </p>
                        {flight.includedBags.map((b: any, i: number) => (
                          <p key={i} className="text-xs text-green-700 font-semibold">
                            ✓ {b.quantity}× {b.type} bag
                            {b.maximum_weight_kg
                              ? ` – up to ${b.maximum_weight_kg}kg`
                              : b.weight
                                ? ` – up to ${b.weight}kg`
                                : ''}
                          </p>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* ── 2. Seat Selection ──────────────────────────── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <div className="p-8 border-b border-gray-100 flex items-center gap-6">
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm">
                    <Armchair size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 gap-4">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      Seat Selection
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                      {hasSeatServices
                        ? 'Seat map with pricing loaded from Duffel seat_maps API'
                        : 'Seat map available – pricing shown on selection screen'}
                    </p>
                  </div>
                  <button
                    onClick={() =>
                      runtimeConfig.features.seatSelectionEnabled &&
                      navigate('/seat-selection', {
                        state: {
                          offer: flight,
                          passengers: passengersCount,
                        },
                      })
                    }
                    disabled={!runtimeConfig.features.seatSelectionEnabled}
                    className="h-12 px-6 bg-[#003b95] hover:bg-[#002a6e] disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center gap-2"
                  >
                    Choose Seat <ArrowRight size={16} />
                  </button>
                </div>
              </div>

              {/* ── 3. Meal Preferences (IATA SSR codes) ──────── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <button
                  disabled={!runtimeConfig.features.ancillariesEnabled}
                  onClick={() => setShowMealDetails(v => !v)}
                  className="w-full p-8 border-b border-gray-100 flex items-center gap-6 text-left hover:bg-gray-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                    <Utensils size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 gap-4">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      Meal Preference
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                      {selectedMeals.size > 0
                        ? `${selectedMeals.size} preference${selectedMeals.size > 1 ? 's' : ''} selected`
                        : 'IATA SSR dietary preferences – complimentary request'}
                    </p>
                  </div>
                  {showMealDetails ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </button>

                {showMealDetails && (
                  <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                    {IATA_MEAL_SSRS.map(meal => {
                      const active = selectedMeals.has(meal.code);
                      return (
                        <button
                          key={meal.code}
                          onClick={() =>
                            setSelectedMeals(prev => {
                              const s = new Set(prev);
                              if (s.has(meal.code)) s.delete(meal.code);
                              else s.add(meal.code);
                              return s;
                            })
                          }
                          className={`flex items-center justify-between p-5 rounded-xl border transition-all duration-300 text-left ${
                            active
                              ? 'bg-white border-[#003b95] shadow-sm ring-2 ring-[#003b95]/10'
                              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-bold transition-colors ${active ? 'text-[#003b95]' : 'text-gray-900'}`}>
                              {meal.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {meal.description}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                              SSR: {meal.code}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-all ${active ? 'bg-[#003b95] border-[#003b95]' : 'border-gray-300'}`}
                          >
                            {active && <Check size={14} className="text-white" />}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* ── 4. Special Requests (IATA SSR codes) ─────── */}
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
                <button
                  disabled={!runtimeConfig.features.ancillariesEnabled}
                  onClick={() => setShowSSRDetails(v => !v)}
                  className="w-full p-8 border-b border-gray-100 flex items-center gap-6 text-left hover:bg-gray-50/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <div className="w-14 h-14 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600 shadow-sm flex-shrink-0">
                    <ShieldCheck size={28} strokeWidth={1.5} />
                  </div>
                  <div className="flex-1 gap-4">
                    <h3 className="text-xl font-bold text-gray-900 tracking-tight">
                      Special Assistance
                    </h3>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mt-1">
                      {selectedSSRs.size > 0
                        ? `${selectedSSRs.size} request${selectedSSRs.size > 1 ? 's' : ''} selected`
                        : 'Mobility, medical & accessibility – IATA SSR codes'}
                    </p>
                  </div>
                  {showSSRDetails ? (
                    <ChevronUp size={20} className="text-gray-400" />
                  ) : (
                    <ChevronDown size={20} className="text-gray-400" />
                  )}
                </button>

                {showSSRDetails && (
                  <div className="p-8 space-y-4">
                    {IATA_SPECIAL_SSRS.map(ssr => {
                      const active = selectedSSRs.has(ssr.code);
                      return (
                        <button
                          key={ssr.code}
                          onClick={() =>
                            setSelectedSSRs(prev => {
                              const s = new Set(prev);
                              if (s.has(ssr.code)) s.delete(ssr.code);
                              else s.add(ssr.code);
                              return s;
                            })
                          }
                          className={`w-full flex items-center justify-between p-5 rounded-xl border transition-all duration-300 text-left ${
                            active
                              ? 'bg-white border-[#003b95] shadow-sm ring-2 ring-[#003b95]/10'
                              : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                          }`}
                        >
                          <div>
                            <p className={`text-sm font-bold transition-colors ${active ? 'text-[#003b95]' : 'text-gray-900'}`}>
                              {ssr.label}
                            </p>
                            <p className="text-xs text-gray-500 mt-0.5">
                              {ssr.description}
                            </p>
                            <p className="text-[10px] font-mono text-gray-400 mt-0.5">
                              SSR: {ssr.code}
                            </p>
                          </div>
                          <div
                            className={`w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 ml-3 transition-all ${active ? 'bg-[#003b95] border-[#003b95]' : 'border-gray-300'}`}
                          >
                            {active && <Check size={14} className="text-white" />}
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
              <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-8 sticky top-32">
                <h3 className="text-sm font-bold text-[#003b95] uppercase tracking-wider mb-6">
                  Trip Summary
                </h3>

                <div className="space-y-4 mb-6 pb-6 border-b border-gray-100">
                  {/* Base fare */}
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      Base Fare
                    </span>
                    <span className="text-sm font-bold text-gray-900">
                      {formatMoney(flight.amount || 0, currency)}
                    </span>
                  </div>

                  {/* Flight info */}
                  {flight.origin && flight.destination && (
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                      {flight.origin} → {flight.destination}
                      {flight.airline && (
                        <span className="ml-2 text-gray-400">· {flight.airline}</span>
                      )}
                    </div>
                  )}

                  {/* Selected baggage (real prices from Duffel) */}
                  {Array.from(selectedBaggage.values()).map(svc => (
                    <div key={svc.id} className="flex justify-between items-center gap-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        {svc.name} ×{svc.quantity}
                      </span>
                      <span className="text-xs font-bold text-gray-900">
                        +{formatMoney(svc.priceEach * svc.quantity, svc.currency)}
                      </span>
                    </div>
                  ))}

                  {/* Meal preferences (no cost) */}
                  {selectedMeals.size > 0 && (
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Meal Preference ×{selectedMeals.size}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Included</span>
                    </div>
                  )}

                  {/* Special requests (no cost) */}
                  {selectedSSRs.size > 0 && (
                    <div className="flex justify-between items-center gap-4">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                        Special Assistance ×{selectedSSRs.size}
                      </span>
                      <span className="bg-green-100 text-green-800 px-2.5 py-0.5 rounded-full text-xs font-semibold">Included</span>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-center gap-4">
                    <span className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total</span>
                    <span className="text-2xl font-bold text-[#1d1d1f]">
                      {formatMoney(grandTotal, currency)}
                    </span>
                  </div>

                  <button
                    onClick={handleContinue}
                    className="w-full h-14 bg-[#003b95] hover:bg-[#002a6e] text-white rounded-lg font-semibold text-sm shadow-md transition-all duration-200 flex items-center justify-center gap-3"
                  >
                    Confirm & Continue <ArrowRight size={18} />
                  </button>

                  <button
                    onClick={() => navigate(-1)}
                    className="w-full text-xs font-bold text-gray-500 hover:text-gray-900 transition-colors uppercase tracking-wider"
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

export default FlightAddons;
