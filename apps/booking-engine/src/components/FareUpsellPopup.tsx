/**
 * FareUpsellPopup — presents 3+ fare tiers derived from real Duffel API data.
 *
 * Business logic lives in useFareUpsell() hook (src/hooks/useFareUpsell.ts).
 * This component is pure presentation.  The parent passes a Flight object;
 * we derive fares, highlight the currently-selected tier, and let the user
 * upgrade before proceeding to checkout.
 */
import React, { useState } from 'react';
import { X, Check, DollarSign, ChevronLeft, ChevronRight, Star, Tag, Zap } from 'lucide-react';
import { Button } from './ui/button';
import { Flight } from '../lib/srs-types';
import { useFareUpsell } from '../hooks/useFareUpsell';

// ─── Public types (re-exported so callers can reference them) ─────────────────

export interface FareBenefit {
  label:     string;
  included:  boolean;
  price?:    string;
}

export interface FareFlexibility {
  label:    string;
  included: boolean;
  type?:    'cancel' | 'change';
  price?:   string;
}

export interface FareOption {
  id:            string;
  name:          string;
  price:         number;
  originalPrice: number;
  cabin:         string;
  benefits:      FareBenefit[];
  flexibility:   FareFlexibility[];
  keywords?:     string[];
  notes?:        string[];
  selected?:     boolean;
}

export interface FareUpsellPopupProps {
  isOpen:  boolean;
  onClose: () => void;
  /** Called when user confirms a fare tier upgrade */
  onSelect: (fare: FareOption) => void;
  flight:   Flight;
  /**
   * Pre-selected fare ID — if provided, that column will be highlighted.
   * If omitted the hook's default selection is used.
   */
  selectedFareId?: string;
}

// ─── Component ────────────────────────────────────────────────────────────────

export const FareUpsellPopup = ({
  isOpen,
  onClose,
  onSelect,
  flight,
  selectedFareId: externalSelectedId,
}: FareUpsellPopupProps) => {

  // ── Derive fare tiers from real API data (or synthetic fallback)
  const { fares, selectedFareId: hookSelectedId } = useFareUpsell(flight);
  const defaultId = externalSelectedId ?? hookSelectedId;

  // ── Local selection state — user can preview a different tier before confirming
  const [activeFareId, setActiveFareId] = useState<string>(defaultId);

  // ── Carousel offset for smaller viewports (shows 3 at a time)
  const [offset, setOffset] = useState(0);
  const visibleCount = 3;
  const canPrev = offset > 0;
  const canNext = offset + visibleCount < fares.length;
  const visibleFares = fares.slice(offset, offset + visibleCount);

  if (!isOpen) return null;

  const handleSelect = (fare: FareOption) => {
    setActiveFareId(fare.id);
    onSelect(fare);
  };

  const selectedFare = fares.find(f => f.id === activeFareId) ?? fares[0];

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-xl animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white w-full max-w-6xl rounded-[3rem] shadow-[0_48px_150px_-20px_rgba(0,0,0,0.4)] overflow-hidden animate-in zoom-in-95 fade-in duration-500 border border-white/40 max-h-[90vh] flex flex-col">

        {/* ── Header ───────────────────────────────────────────────────────────── */}
        <div className="px-12 py-8 flex items-center justify-between border-b border-gray-50 shrink-0">
          <div className="flex items-center gap-5">
            <button
              onClick={onClose}
              className="p-3 rounded-full hover:bg-gray-100 transition-colors border border-transparent hover:border-gray-200"
            >
              <X size={20} className="text-gray-900" />
            </button>
            <div>
              <h2 className="text-xl font-black text-gray-900 uppercase tracking-[0.15em]">
                Choose Your Fare —{' '}
                <span className="text-[#152467]">{flight.origin} → {flight.destination}</span>
              </h2>
              <p className="text-[10px] font-bold text-gray-400 mt-0.5 uppercase tracking-widest">
                {flight.airline} · {flight.flightNumber} · {fares.length} fare {fares.length === 1 ? 'option' : 'options'} available
              </p>
            </div>
          </div>

          {/* Currently selected badge */}
          {selectedFare && (
            <div className="hidden md:flex items-center gap-2 px-5 py-2.5 bg-purple-50 rounded-2xl border border-purple-100">
              <Zap size={12} className="text-[#152467]" />
              <span className="text-[10px] font-black text-[#152467] uppercase tracking-widest">
                {selectedFare.name} · {flight.currency} {selectedFare.price.toLocaleString()}
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable content ───────────────────────────────────────────────── */}
        <div className="overflow-y-auto flex-1 custom-scrollbar">

          {/* Flight summary bar */}
          <div className="mx-12 mt-8 mb-8 px-10 py-6 bg-[#F8F9FA] rounded-[2.5rem] border border-gray-100 flex flex-wrap items-center justify-between gap-6 shadow-inner">
            <div className="flex items-center gap-10">
              <div className="space-y-2">
                <p className="text-xl font-black text-gray-900 tracking-tight">
                  {new Date(flight.departureTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  {' '}–{' '}
                  {new Date(flight.arrivalTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 bg-white rounded-full text-[10px] font-bold text-gray-500 border border-gray-100 uppercase tracking-wider">
                    {flight.stops === 0 ? 'Nonstop' : `${flight.stops} Stop${flight.stops > 1 ? 's' : ''}`}
                  </span>
                  <span className="text-[11px] font-bold text-gray-400">{flight.duration}</span>
                </div>
              </div>
              <div className="h-10 w-px bg-gray-200" />
              <div className="flex items-center gap-3">
                {flight.airlineLogo && (
                  <img
                    src={flight.airlineLogo}
                    className="h-8 w-8 object-contain rounded-full bg-white p-1 shadow-sm"
                    alt={flight.airline}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                )}
                <span className="text-sm font-black text-gray-900">{flight.airline}</span>
                {flight.refundable && (
                  <span className="px-2 py-0.5 bg-green-50 border border-green-100 rounded-full text-[9px] font-black text-green-600 uppercase tracking-wider">Refundable</span>
                )}
              </div>
            </div>
            <Button
              onClick={onClose}
              className="bg-[#EC5C4C] hover:bg-[#FACC15] text-[#1E1B4B] font-black text-xs px-10 py-4 rounded-2xl shadow-xl shadow-yellow-100 transition-all uppercase tracking-[0.2em] hover:-translate-y-0.5 active:scale-95"
            >
              Keep Current Fare
            </Button>
          </div>

          {/* ── Fare cards grid ────────────────────────────────────────────────── */}
          <div className="px-12 pb-12 relative">

            {/* Carousel nav — only shown when > 3 fares */}
            {canPrev && (
              <button
                onClick={() => setOffset(o => Math.max(0, o - 1))}
                className="absolute left-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border border-gray-100 text-[#152467] flex items-center justify-center shadow-2xl z-20 hover:scale-110 hover:border-[#152467] transition-all"
              >
                <ChevronLeft size={26} />
              </button>
            )}
            {canNext && (
              <button
                onClick={() => setOffset(o => Math.min(fares.length - visibleCount, o + 1))}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white border border-gray-100 text-[#152467] flex items-center justify-center shadow-2xl z-20 hover:scale-110 hover:border-[#152467] transition-all"
              >
                <ChevronRight size={26} />
              </button>
            )}

            <div className={`grid gap-6 ${visibleFares.length === 1 ? 'grid-cols-1 max-w-sm mx-auto' : visibleFares.length === 2 ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {visibleFares.map((fare) => {
                const isActive = fare.id === activeFareId;
                return (
                  <div
                    key={fare.id}
                    className={`p-8 rounded-[2.5rem] border transition-all duration-500 flex flex-col relative overflow-hidden cursor-pointer group
                      ${isActive
                        ? 'border-[#152467] bg-white ring-4 ring-[#152467]/10 shadow-2xl shadow-purple-100/50 scale-[1.03] z-10'
                        : 'border-gray-100 hover:border-[#152467]/30 bg-white hover:-translate-y-1 hover:shadow-xl'
                      }`}
                    onClick={() => setActiveFareId(fare.id)}
                  >
                    {/* Active accent bar */}
                    {isActive && (
                      <div className="absolute top-0 inset-x-0 h-1.5 bg-gradient-to-r from-[#152467] to-purple-400 rounded-t-full" />
                    )}

                    {/* Keyword badges */}
                    {fare.keywords && fare.keywords.length > 0 && (
                      <div className="absolute top-4 right-4 flex flex-col gap-1.5 items-end">
                        {fare.keywords.map(kw => (
                          <span key={kw} className="flex items-center gap-1 px-2.5 py-1 bg-[#152467] text-white rounded-full text-[8px] font-black uppercase tracking-wider shadow-sm">
                            {kw === 'Best Value' ? <Tag size={8} /> : <Star size={8} />}
                            {kw}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Price */}
                    <div className="mb-6 text-center pt-2">
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1">Per Person</p>
                      <h3 className="text-3xl font-black text-gray-900 tracking-tighter">
                        {flight.currency} {fare.price.toLocaleString()}
                      </h3>
                      {fare.price !== fare.originalPrice && (
                        <p className="text-[10px] text-gray-400 line-through mt-0.5">
                          {flight.currency} {fare.originalPrice.toLocaleString()}
                        </p>
                      )}
                    </div>

                    {/* Cabin label */}
                    <div className="mb-7 text-center bg-gray-50/60 py-3.5 rounded-2xl border border-gray-50">
                      <p className="text-sm font-black text-[#152467] uppercase tracking-[0.2em]">{fare.name}</p>
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">{fare.cabin}</p>
                    </div>

                    {/* Benefits */}
                    <div className="flex-1 space-y-7 mb-8">
                      <div className="space-y-3.5">
                        <p className="text-[9px] font-black text-gray-300 uppercase tracking-[3px] text-center">Included</p>
                        {fare.benefits.map((b, i) => (
                          <div key={i} className="flex items-start gap-3">
                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${b.included ? 'bg-[#152467]/10' : 'bg-gray-50'}`}>
                              {b.included
                                ? <Check size={10} className="text-[#152467] stroke-[3px]" />
                                : <DollarSign size={10} className="text-gray-300" />
                              }
                            </div>
                            <div className="flex-1 flex justify-between items-start gap-1">
                              <span className={`text-[11px] font-bold leading-snug ${b.included ? 'text-gray-900' : 'text-gray-400'}`}>
                                {b.label}
                              </span>
                              {b.price && (
                                <span className="text-[9px] font-black text-[#152467] whitespace-nowrap">{b.price}</span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Flexibility */}
                      {fare.flexibility.length > 0 && (
                        <div className="pt-6 border-t border-dashed border-gray-100 space-y-3">
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-[3px] text-center">Flexibility</p>
                          {fare.flexibility.map((item, i) => (
                            <div key={i} className="flex items-center gap-3">
                              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 ${item.included ? 'bg-green-50' : 'bg-red-50'}`}>
                                {item.included
                                  ? <Check size={10} className="text-green-500 stroke-[3px]" />
                                  : <X size={10} className="text-red-400 stroke-[3px]" />
                                }
                              </div>
                              <div className="flex-1 flex justify-between items-center gap-1">
                                <span className={`text-[11px] font-bold ${item.included ? 'text-gray-900' : 'text-gray-400'}`}>
                                  {item.label}
                                </span>
                                {item.price && (
                                  <span className={`text-[9px] font-black ${item.included ? 'text-green-500' : 'text-[#152467]'}`}>
                                    {item.price}
                                  </span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Notes */}
                      {fare.notes && fare.notes.length > 0 && (
                        <div className="pt-4 space-y-1">
                          {fare.notes.map((note, i) => (
                            <p key={i} className="text-[9px] text-gray-400 leading-relaxed">{note}</p>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* CTA button */}
                    <Button
                      onClick={(e) => { e.stopPropagation(); handleSelect(fare); }}
                      className={`w-full py-5 rounded-2xl text-[10px] font-black uppercase tracking-[0.3em] shadow-lg transition-all active:scale-95 hover:-translate-y-0.5
                        ${isActive
                          ? 'bg-[#152467] text-white shadow-purple-200 hover:bg-[#0A1C50]'
                          : 'bg-white border border-gray-200 text-[#111827] hover:bg-gray-50 hover:border-[#152467]'
                        }`}
                    >
                      {isActive ? '✓ Selected' : 'Select Fare'}
                    </Button>
                  </div>
                );
              })}
            </div>

            {/* Carousel dots */}
            {fares.length > visibleCount && (
              <div className="flex items-center justify-center gap-2 mt-8">
                {Array.from({ length: fares.length - visibleCount + 1 }, (_, i) => (
                  <button
                    key={i}
                    onClick={() => setOffset(i)}
                    className={`w-2 h-2 rounded-full transition-all ${i === offset ? 'bg-[#152467] w-6' : 'bg-gray-200'}`}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ── Footer ───────────────────────────────────────────────────────────── */}
        <div className="px-12 py-6 bg-white border-t border-gray-100 flex items-center justify-between shrink-0">
          <div>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-[3px] mb-1">
              {selectedFare ? `${selectedFare.name} — Selected` : 'No fare selected'}
            </p>
            {selectedFare && (
              <p className="text-2xl font-black text-gray-900 tracking-tighter">
                {flight.currency} {selectedFare.price.toLocaleString()}
                <span className="text-[11px] font-bold text-gray-400 ml-2">per person</span>
              </p>
            )}
          </div>
          <Button
            onClick={() => selectedFare && handleSelect(selectedFare)}
            className="px-12 py-5 rounded-2xl bg-[#152467] hover:bg-[#0A1C50] text-white font-black text-xs uppercase tracking-[3px] shadow-2xl shadow-purple-200 transition-all hover:-translate-y-1 active:scale-95"
          >
            Confirm & Continue
          </Button>
        </div>
      </div>
    </div>
  );
};
