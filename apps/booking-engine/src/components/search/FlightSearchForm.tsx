'use client';

/**
 * Flight Search Form - Kayak.com Style
 * Built to match the exact screenshots (ST Flight Search Widget.png)
 * 
 * Key design elements from screenshots:
 * - Clean white search card with rounded-xl and subtle shadow
 * - From: shows selected airport as a pill chip (e.g. "Hanoi (HAN)") with X
 * - Swap button: circular, between From and To
 * - To: text input with "To?" placeholder
 * - Departure/Return: date pickers with "exact" dropdown
 * - Travelers: "1 adult, Economy" compact button
 * - Search button: Orange (#FF5722) background, white text, rounded-lg
 * - No liquid glass, no dark backgrounds
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  X,
  ArrowLeftRight,
  Search,
  User,
  MapPin,
  Plane,
  ChevronDown,
  CaretDown,
} from 'lucide-react';
import { cn } from '@tripalfa/shared-utils/utils';
import { fetchAirports } from '@/lib/api';

// --- Types ---

interface AirportResult {
  type: 'AIRPORT' | 'CITY';
  title: string;
  subtitle: string;
  code: string;
  city?: string;
  country?: string;
}

export interface SelectedAirport {
  title: string;
  code: string;
  city: string;
  country: string;
}

export interface TravelerConfig {
  adults: number;
  children: number;
  infants: number;
}

export type TripType = 'roundtrip' | 'oneway' | 'multicity';

export interface FlightSearchData {
  origin?: SelectedAirport;
  destination?: SelectedAirport;
  departureDate: string;
  returnDate: string;
  tripType: TripType;
  travelers: TravelerConfig;
  cabinClass: string;
}

interface FlightSearchFormProps {
  isSearchEnabled?: boolean;
  onSearch?: (data: FlightSearchData) => void;
  searchLabels?: {
    from?: string;
    to?: string;
    departure?: string;
    return?: string;
    originPlaceholder?: string;
    destinationPlaceholder?: string;
    searchCtaLabel?: string;
    disabledLabel?: string;
  };
  tripType?: TripType;
  onTripTypeChange?: (type: TripType) => void;
  travelers?: TravelerConfig;
  onTravelersChange?: (travelers: TravelerConfig) => void;
  cabinClass?: string;
  onCabinChange?: (cabin: string) => void;
  directFlightsOnly?: boolean;
  onDirectFlightsChange?: (value: boolean) => void;
}

const CABIN_CLASSES = [
  { id: 'economy', label: 'Economy' },
  { id: 'premium-economy', label: 'Premium Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First' },
];

// --- Component ---

export function FlightSearchForm({
  isSearchEnabled = true,
  onSearch,
}: FlightSearchFormProps) {
  // ─── State ───
  const [tripType, setTripType] = useState<TripType>('roundtrip');
  const [origin, setOrigin] = useState<SelectedAirport | null>(null);
  const [destination, setDestination] = useState<SelectedAirport | null>(null);
  const [departureDate, setDepartureDate] = useState<Date | null>(null);
  const [returnDate, setReturnDate] = useState<Date | null>(null);
  const [showAirportDropdown, setShowAirportDropdown] = useState(false);
  const [airportDropdownFor, setAirportDropdownFor] = useState<'from' | 'to'>('from');
  const [airportSearch, setAirportSearch] = useState('');
  const [airportResults, setAirportResults] = useState<AirportResult[]>([]);
  const [isSwapping, setIsSwapping] = useState(false);
  const [travelers, setTravelers] = useState<TravelerConfig>({ adults: 1, children: 0, infants: 0 });
  const [cabinClass, setCabinClass] = useState('economy');
  const [showTravelerPanel, setShowTravelerPanel] = useState(false);
  const [showDepartureCalendar, setShowDepartureCalendar] = useState(false);
  const [showReturnCalendar, setShowReturnCalendar] = useState(false);
  const [fromSearchFocused, setFromSearchFocused] = useState(false);
  const [toSearchFocused, setToSearchFocused] = useState(false);

  const fromRef = useRef<HTMLDivElement>(null);
  const toRef = useRef<HTMLDivElement>(null);
  const travelerRef = useRef<HTMLDivElement>(null);

  // ─── Fetch Airports ───
  const fetchAirportData = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAirportResults([]);
      return;
    }
    try {
      const results = await fetchAirports(query);
      setAirportResults((results || []) as AirportResult[]);
    } catch {
      setAirportResults([]);
    }
  }, []);

  // ─── Handlers ───
  const handleOriginSelect = (airport: AirportResult) => {
    setOrigin({
      title: airport.title,
      code: airport.code,
      city: airport.city || airport.title,
      country: airport.country || '',
    });
    setShowAirportDropdown(false);
    setAirportSearch('');
    setAirportResults([]);
  };

  const handleDestinationSelect = (airport: AirportResult) => {
    setDestination({
      title: airport.title,
      code: airport.code,
      city: airport.city || airport.title,
      country: airport.country || '',
    });
    setShowAirportDropdown(false);
    setAirportSearch('');
    setAirportResults([]);
  };

  const handleSwapLocations = () => {
    if (!origin && !destination) return;
    setIsSwapping(true);
    const temp = origin;
    setOrigin(destination);
    setDestination(temp);
    setTimeout(() => setIsSwapping(false), 400);
  };

  const handleSearch = () => {
    const searchData: FlightSearchData = {
      origin: origin || undefined,
      destination: destination || undefined,
      departureDate: '', // @TODO: format when calendar is ready
      returnDate: '',
      tripType,
      travelers,
      cabinClass,
    };
    onSearch?.(searchData);
  };

  const totalPax = travelers.adults + travelers.children + travelers.infants;
  const travelerLabel = `${totalPax} ${totalPax === 1 ? 'adult' : 'adults'}, ${CABIN_CLASSES.find(c => c.id === cabinClass)?.label}`;

  // ─── Click outside to close dropdowns ───
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (fromRef.current && !fromRef.current.contains(e.target as Node)) {
        setFromSearchFocused(false);
        setShowAirportDropdown(false);
      }
      if (toRef.current && !toRef.current.contains(e.target as Node)) {
        setToSearchFocused(false);
        setShowAirportDropdown(false);
      }
      if (travelerRef.current && !travelerRef.current.contains(e.target as Node)) {
        setShowTravelerPanel(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ─── Render Airport Dropdown ───
  const renderAirportDropdown = () => (
    <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/60 z-50 max-h-72 overflow-y-auto">
      {airportResults.map((airport, index) => (
        <button
          key={index}
          type="button"
          className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
          onClick={() => {
            if (airportDropdownFor === 'from') {
              handleOriginSelect(airport);
              setFromSearchFocused(false);
            } else {
              handleDestinationSelect(airport);
              setToSearchFocused(false);
            }
          }}
        >
          <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
            <Plane className="text-gray-500" size={18} weight="bold" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm text-gray-900 truncate">{airport.title}</p>
            <p className="text-xs text-gray-500 truncate">{airport.subtitle}</p>
          </div>
          <div className="px-2 py-0.5 rounded-md bg-gray-100 text-gray-700 text-xs font-bold font-mono">
            {airport.code}
          </div>
        </button>
      ))}
    </div>
  );

  return (
    <div className="w-full">
      {/* ─── Trip Type & Options Row ─── */}
      <div className="flex flex-wrap items-center gap-3 mb-3">
        {/* Trip Type Radio Buttons */}
        <div className="flex items-center gap-4">
          {(['roundtrip', 'oneway', 'multicity'] as TripType[]).map((type) => (
            <label key={type} className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="radio"
                name="tripType"
                checked={tripType === type}
                onChange={() => setTripType(type)}
                className="w-4 h-4 text-gray-900 border-gray-300 focus:ring-0 focus:ring-offset-0"
              />
              <span className="text-sm text-gray-700 font-medium">
                {type === 'roundtrip' ? 'Round trip' : type === 'oneway' ? 'One way' : 'Multi-city'}
              </span>
            </label>
          ))}
        </div>

        {/* Cabin Class Dropdown */}
        <div className="relative">
          <select
            value={cabinClass}
            onChange={(e) => setCabinClass(e.target.value)}
            className="text-sm text-gray-700 font-medium bg-transparent border-none outline-none cursor-pointer hover:text-gray-900"
          >
            {CABIN_CLASSES.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Direct Flights Only */}
        <label className="flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            className="w-4 h-4 rounded border-gray-300 text-gray-900"
          />
          <span className="text-sm text-gray-700 font-medium">Direct flights only</span>
        </label>

        {/* Traveler Pills */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1 text-sm text-gray-700 font-medium">
            <User size={14} weight="bold" className="text-gray-500" />
            {travelers.adults} adult
          </span>
          {travelers.children > 0 && (
            <span className="inline-flex items-center gap-1 text-sm text-gray-700 font-medium">
              <User size={14} weight="bold" className="text-gray-500" />
              {travelers.children} child
            </span>
          )}
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-visible">
        <div className="flex flex-col lg:flex-row lg:flex-nowrap items-stretch min-h-[56px]">
          
          {/* ─── From Field ─── */}
          <div ref={fromRef} className="relative flex-1 min-w-0">
            <div className="h-full px-5 flex flex-col justify-center py-3 lg:py-0 border-b lg:border-b-0 lg:border-r border-gray-200">
              {origin ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {origin.title} ({origin.code})
                  </span>
                  <button
                    type="button"
                    onClick={() => setOrigin(null)}
                    className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} weight="bold" className="text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2" onFocus={() => { setFromSearchFocused(true); setAirportDropdownFor('from'); }}>
                  <MapPin size={18} weight="fill" className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="From?"
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
                    value={airportSearch}
                    onChange={(e) => {
                      setAirportSearch(e.target.value);
                      setAirportDropdownFor('from');
                      fetchAirportData(e.target.value);
                    }}
                    onFocus={() => { setFromSearchFocused(true); setAirportDropdownFor('from'); }}
                  />
                </div>
              )}
            </div>
            {/* From Airport Dropdown */}
            {(fromSearchFocused && airportResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50" style={{ width: '280px' }}>
                {renderAirportDropdown()}
              </div>
            )}
          </div>

          {/* ─── Swap Button (Desktop) ─── */}
          <div className="hidden lg:flex items-center justify-center w-8 shrink-0 -ml-4 z-10 relative">
            <button
              type="button"
              onClick={handleSwapLocations}
              className={cn(
                'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300',
                'bg-white border border-gray-200 shadow-sm',
                'hover:border-gray-300 hover:shadow',
                isSwapping && 'rotate-180'
              )}
            >
              <ArrowLeftRight size={14} className="text-gray-600" />
            </button>
          </div>

          {/* ─── To Field ─── */}
          <div ref={toRef} className="relative flex-1 min-w-0">
            <div className="h-full px-5 flex flex-col justify-center py-3 lg:py-0 border-b lg:border-b-0 lg:border-r border-gray-200">
              {destination ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">
                    {destination.title} ({destination.code})
                  </span>
                  <button
                    type="button"
                    onClick={() => setDestination(null)}
                    className="p-0.5 rounded-full hover:bg-gray-100 transition-colors"
                  >
                    <X size={14} weight="bold" className="text-gray-400" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2" onFocus={() => { setToSearchFocused(true); setAirportDropdownFor('to'); }}>
                  <MapPin size={18} weight="fill" className="text-gray-400 shrink-0" />
                  <input
                    type="text"
                    placeholder="To?"
                    className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
                    value={airportSearch}
                    onChange={(e) => {
                      setAirportSearch(e.target.value);
                      setAirportDropdownFor('to');
                      fetchAirportData(e.target.value);
                    }}
                    onFocus={() => { setToSearchFocused(true); setAirportDropdownFor('to'); }}
                  />
                </div>
              )}
            </div>
            {/* To Airport Dropdown */}
            {(toSearchFocused && airportResults.length > 0) && (
              <div className="absolute top-full left-0 right-0 mt-1 z-50" style={{ width: '280px' }}>
                {renderAirportDropdown()}
              </div>
            )}
          </div>

          {/* ─── Departure ─── */}
          <div className="relative flex-1 min-w-0">
            <div className="h-full px-5 flex flex-col justify-center py-3 lg:py-0 border-b lg:border-b-0 lg:border-r border-gray-200">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <span className="text-sm font-medium text-gray-900">Departure</span>
                  <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                    exact <ChevronDown size={10} />
                  </button>
                </div>
                {departureDate && (
                  <span className="text-sm font-semibold text-gray-900 ml-2">
                    {departureDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* ─── Return ─── */}
          <div className="relative flex-1 min-w-0">
            <div className="h-full px-5 flex flex-col justify-center py-3 lg:py-0 border-b lg:border-b-0 lg:border-r border-gray-200">
              {tripType === 'roundtrip' ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    <span className="text-sm font-medium text-gray-900">Return</span>
                    <button className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-0.5">
                      exact <ChevronDown size={10} />
                    </button>
                  </div>
                </div>
              ) : (
                <span className="text-sm text-gray-400">Return</span>
              )}
            </div>
          </div>

          {/* ─── Travelers ─── */}
          <div ref={travelerRef} className="relative flex-1 min-w-0">
            <div className="h-full px-5 flex flex-col justify-center py-3 lg:py-0 border-b lg:border-b-0 lg:border-r border-gray-200">
              <button
                type="button"
                onClick={() => setShowTravelerPanel(!showTravelerPanel)}
                className="flex items-center gap-2 text-left"
              >
                <User size={16} weight="fill" className="text-gray-400 shrink-0" />
                <span className="text-sm font-medium text-gray-900">{travelerLabel}</span>
                <ChevronDown size={12} className="text-gray-400 mt-0.5" />
              </button>
            </div>
            {/* Traveler Panel */}
            {showTravelerPanel && (
              <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/60 z-50 p-4 w-72">
                {/* Travelers */}
                <div className="space-y-4 mb-4">
                  {[
                    { key: 'adults', label: 'Adults', sub: 'Age 18+', min: 1 },
                    { key: 'children', label: 'Children', sub: 'Age 0-17', min: 0 },
                    { key: 'infants', label: 'Infants on lap', sub: 'Under 2', min: 0 },
                  ].map(item => (
                    <div key={item.key} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm text-gray-900">{item.label}</p>
                        <p className="text-xs text-gray-500">{item.sub}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setTravelers(prev => ({ ...prev, [item.key]: Math.max(item.min, prev[item.key as keyof TravelerConfig] - 1) }))}
                          disabled={travelers[item.key as keyof TravelerConfig] <= item.min}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-30"
                        >
                          <span className="text-lg font-medium -mt-0.5">−</span>
                        </button>
                        <span className="w-5 text-center font-medium text-sm">{travelers[item.key as keyof TravelerConfig]}</span>
                        <button
                          onClick={() => setTravelers(prev => ({ ...prev, [item.key]: prev[item.key as keyof TravelerConfig] + 1 }))}
                          className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
                        >
                          <span className="text-lg font-medium -mt-0.5">+</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                {/* Cabin Class */}
                <div className="border-t border-gray-100 pt-4">
                  <p className="text-sm font-semibold text-gray-900 mb-2">Cabin Class</p>
                  <div className="grid grid-cols-2 gap-2">
                    {CABIN_CLASSES.map(c => (
                      <button
                        key={c.id}
                        onClick={() => setCabinClass(c.id)}
                        className={cn(
                          'px-3 py-2 rounded-lg text-sm font-medium border transition-all',
                          cabinClass === c.id
                            ? 'border-gray-900 text-gray-900 bg-white'
                            : 'border-gray-200 text-gray-600 hover:border-gray-400'
                        )}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* ─── Search Button ─── */}
          <div className="flex items-center p-1.5 shrink-0">
            <button
              type="button"
              disabled={!isSearchEnabled}
              onClick={handleSearch}
              className={cn(
                'h-[48px] px-6 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 outline-none',
                'bg-[#FF5722] text-white',
                'hover:bg-[#E64A19] shadow-sm hover:shadow-md',
                'active:scale-[0.98]',
                'disabled:opacity-50 disabled:cursor-not-allowed'
              )}
            >
              <span>Search</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default FlightSearchForm;
