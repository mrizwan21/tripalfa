"use client";

/**
 * Flight Search Form - Premium International OTA Design
 * 
 * Upgraded with:
 * - Strict height tokens for perfect alignment
 * - Premium glassmorphism design
 * - Enhanced micro-interactions
 * - Professional typography
 */

import React, { useState, useEffect, useRef, type ChangeEvent } from 'react';
import {
  AirplaneTakeoff,
  AirplaneInFlight,
  CalendarBlank,
  X,
  ArrowLeftRight,
  MagnifyingGlass,
  MapPin,
  GlobeHemisphereWest,
} from '@phosphor-icons/react';
import { cn } from '@tripalfa/shared-utils/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { api, fetchAirports } from '@/lib/api';

interface AirportResult {
  type: 'AIRPORT';
  icon: string;
  title: string;
  subtitle: string;
  code: string;
  city?: string;
  country?: string;
  countryCode?: string;
}

interface FlightSearchFormProps {
  searchLabels: {
    from: string;
    to: string;
    departure: string;
    return: string;
    originPlaceholder: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  isSearchEnabled?: boolean;
  onSearch?: (data: FlightSearchData) => void;
}

export interface FlightSearchData {
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  tripType: string;
}

// Animated Icon with hover effect
function AnimatedIcon({
  icon: Icon,
  className,
  size = 20,
  weight = 'duotone',
  color,
}: {
  icon: React.ComponentType<any>;
  className?: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'fill' | 'duotone';
  color?: string;
}) {
  return (
    <Icon
      className={cn('transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:text-[#F45D48]', className)}
      size={size}
      weight={weight}
      color={color}
    />
  );
}

// Airport suggestion item component
function AirportSuggestion({
  airport,
  onSelect,
  icon: Icon,
}: {
  airport: AirportResult;
  onSelect: (airport: AirportResult) => void;
  icon: React.ComponentType<any>;
}) {
  return (
    <button
      type="button"
      className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gradient-to-r hover:from-[#F45D48]/5 hover:to-transparent transition-all duration-200 text-left border-b border-gray-100/50 last:border-b-0 group/item"
      onClick={() => onSelect(airport)}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#F45D48]/10 to-[#F45D48]/5 flex items-center justify-center shrink-0 transition-all duration-200 group-hover/item:from-[#F45D48]/20 group-hover/item:to-[#F45D48]/10">
        <Icon className="text-[#F45D48]" size={18} weight="duotone" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-sm text-gray-900 truncate">{airport.title}</p>
        <p className="text-xs text-gray-500 truncate">{airport.subtitle}</p>
      </div>
      <div className="px-2.5 py-1 rounded-lg bg-[#F45D48]/10 text-[#F45D48] text-xs font-bold shrink-0 font-mono">
        {airport.code}
      </div>
    </button>
  );
}

export function FlightSearchForm({
  searchLabels,
  isSearchEnabled = true,
  onSearch,
}: FlightSearchFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [departureDate, setDepartureDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [originAirports, setOriginAirports] = useState<AirportResult[]>([]);
  const [destAirports, setDestAirports] = useState<AirportResult[]>([]);
  const [activeField, setActiveField] = useState<'origin' | 'destination' | null>(null);
  const [isSwapping, setIsSwapping] = useState(false);
  const originRef = useRef<HTMLDivElement>(null);
  const destRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (originRef.current && !originRef.current.contains(e.target as Node)) {
        setActiveField((prev) => (prev === 'origin' ? null : prev));
      }
      if (destRef.current && !destRef.current.contains(e.target as Node)) {
        setActiveField((prev) => (prev === 'destination' ? null : prev));
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (origin.length > 1 && activeField === 'origin') {
      const fetch = async () => {
        try {
          const results = await fetchAirports(origin);
          setOriginAirports((results || []) as AirportResult[]);
        } catch {
          setOriginAirports([]);
        }
      };
      const debounce = setTimeout(fetch, 300);
      return () => clearTimeout(debounce);
    } else {
      setOriginAirports([]);
    }
  }, [origin, activeField]);

  useEffect(() => {
    if (destination.length > 1 && activeField === 'destination') {
      const fetch = async () => {
        try {
          const results = await fetchAirports(destination);
          setDestAirports((results || []) as AirportResult[]);
        } catch {
          setDestAirports([]);
        }
      };
      const debounce = setTimeout(fetch, 300);
      return () => clearTimeout(debounce);
    } else {
      setDestAirports([]);
    }
  }, [destination, activeField]);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ origin, destination, departureDate, returnDate, tripType: 'roundtrip' });
    }
  };

  const handleSwapLocations = () => {
    setIsSwapping(true);
    const tempOrigin = origin;
    setOrigin(destination);
    setDestination(tempOrigin);
    setTimeout(() => setIsSwapping(false), 500);
  };

  const handleAirportSelect = (
    airport: AirportResult,
    field: 'origin' | 'destination'
  ) => {
    if (field === 'origin') {
      setOrigin(airport.title);
    } else {
      setDestination(airport.title);
    }
    setActiveField(null);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        {/* Origin Input */}
        <div ref={originRef} className="lg:col-span-3 relative group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin size={12} weight="fill" className="text-[#F45D48]" />
            {searchLabels.from}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <AnimatedIcon
                icon={AirplaneTakeoff}
                size={20}
                weight="duotone"
                className="text-gray-400"
              />
            </div>
            <Input
              type="text"
              placeholder={searchLabels.originPlaceholder}
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[#F45D48]/50 focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white focus:shadow-lg focus:shadow-[#F45D48]/5 hover:border-gray-300"
              value={origin}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOrigin(e.target.value)}
              onFocus={() => setActiveField('origin')}
            />
            {origin && (
              <button
                type="button"
                onClick={() => setOrigin('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 group/clear"
              >
                <X
                  className="h-3 w-3 text-gray-400 group-hover/clear:text-gray-600 transition-colors"
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>

          {/* Origin Dropdown */}
          {originAirports.length > 0 && activeField === 'origin' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/50 z-50 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Select Origin Airport
                </p>
              </div>
              {originAirports.map((airport, index) => (
                <AirportSuggestion
                  key={index}
                  airport={airport}
                  onSelect={(apt) => handleAirportSelect(apt, 'origin')}
                  icon={AirplaneTakeoff}
                />
              ))}
            </div>
          )}
        </div>

        {/* Swap Button */}
        <div className="lg:col-span-1 flex items-center justify-center pt-6">
          <button
            type="button"
            onClick={handleSwapLocations}
            disabled={!origin && !destination}
            className={cn(
              'w-11 h-11 rounded-full flex items-center justify-center transition-all duration-500 group',
              'bg-white border border-gray-200 shadow-sm',
              'hover:shadow-lg hover:border-[#F45D48]/30 hover:bg-gradient-to-br hover:from-[#F45D48]/5 hover:to-transparent',
              'disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:shadow-sm',
              isSwapping && 'rotate-180 scale-110'
            )}
            aria-label="Swap origin and destination"
          >
            <ArrowLeftRight
              className="text-gray-500 group-hover:text-[#F45D48] transition-all duration-300"
              size={18}
              weight="duotone"
            />
          </button>
        </div>

        {/* Destination Input */}
        <div ref={destRef} className="lg:col-span-3 relative group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin size={12} weight="fill" className="text-[#F45D48]" />
            {searchLabels.to}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <AnimatedIcon
                icon={AirplaneInFlight}
                size={20}
                weight="duotone"
                className="text-gray-400"
              />
            </div>
            <Input
              type="text"
              placeholder={searchLabels.destinationPlaceholder}
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[#F45D48]/50 focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white focus:shadow-lg focus:shadow-[#F45D48]/5 hover:border-gray-300"
              value={destination}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
              onFocus={() => setActiveField('destination')}
            />
            {destination && (
              <button
                type="button"
                onClick={() => setDestination('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full hover:bg-gray-100 transition-all duration-200 group/clear"
              >
                <X
                  className="h-3 w-3 text-gray-400 group-hover/clear:text-gray-600 transition-colors"
                  strokeWidth={2.5}
                />
              </button>
            )}
          </div>

          {/* Destination Dropdown */}
          {destAirports.length > 0 && activeField === 'destination' && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/50 z-50 max-h-72 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
              <div className="px-4 py-2.5 border-b border-gray-100">
                <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">
                  Select Destination Airport
                </p>
              </div>
              {destAirports.map((airport, index) => (
                <AirportSuggestion
                  key={index}
                  airport={airport}
                  onSelect={(apt) => handleAirportSelect(apt, 'destination')}
                  icon={AirplaneInFlight}
                />
              ))}
            </div>
          )}
        </div>

        {/* Departure Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CalendarBlank size={12} weight="fill" className="text-[#F45D48]" />
            {searchLabels.departure}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <CalendarBlank
                size={20}
                weight="duotone"
                className="text-gray-400 group-focus-within:text-[#F45D48] transition-all duration-300"
              />
            </div>
            <Input
              type="date"
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[#F45D48]/50 focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white focus:shadow-lg focus:shadow-[#F45D48]/5 hover:border-gray-300"
              value={departureDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDepartureDate(e.target.value)}
            />
          </div>
        </div>

        {/* Return Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CalendarBlank size={12} weight="fill" className="text-[#F45D48]" />
            {searchLabels.return}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <CalendarBlank
                size={20}
                weight="duotone"
                className="text-gray-400 group-focus-within:text-[#F45D48] transition-all duration-300"
              />
            </div>
            <Input
              type="date"
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[#F45D48]/50 focus:ring-4 focus:ring-[#F45D48]/10 focus:bg-white focus:shadow-lg focus:shadow-[#F45D48]/5 hover:border-gray-300"
              value={returnDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReturnDate(e.target.value)}
            />
          </div>
        </div>

        {/* Search Button */}
        <div className="lg:col-span-1">
          <button
            type="button"
            disabled={!isSearchEnabled}
            onClick={handleSearch}
            className={cn(
              'w-full h-14 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-300 outline-none',
              'bg-gradient-to-r from-[#F45D48] via-[#F45D48] to-[#E8453A] text-white',
              'hover:from-[#E8453A] hover:to-[#D63A2F] shadow-lg shadow-[#F45D48]/30 hover:shadow-xl hover:shadow-[#F45D48]/40 hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-md',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0'
            )}
          >
            <MagnifyingGlass size={20} weight="duotone" />
            <span className="sr-only">{searchLabels.searchCtaLabel}</span>
          </button>
        </div>
      </div>

      {/* Disabled Message */}
      {!isSearchEnabled && (
        <div className="mt-4 text-center py-3">
          <p className="text-sm font-medium text-gray-500 bg-gray-50/80 backdrop-blur-sm inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-gray-200/50">
            <GlobeHemisphereWest size={14} weight="duotone" />
            {searchLabels.disabledLabel}
          </p>
        </div>
      )}
    </div>
  );
}