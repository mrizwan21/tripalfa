'use client';

/**
 * Packages Search Form - Professional OTA Design
 *
 * Inspired by: Booking.com, Expedia, Kayak
 * Features:
 * - Unified connected search bar with consistent heights
 * - Origin + Destination + Dates layout
 * - Seamless field connections with subtle dividers
 */

import React, { useState, type ChangeEvent } from 'react';
import {
  MapPin,
  CalendarBlank,
  Users,
  X,
  MagnifyingGlass,
  AirplaneTilt,
  GlobeHemisphereWest,
} from '@phosphor-icons/react';
import { cn } from '@tripalfa/shared-utils/utils';

interface PackagesSearchFormProps {
  searchLabels?: {
    origin: string;
    destination: string;
    checkIn: string;
    checkOut: string;
    originPlaceholder: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  isSearchEnabled?: boolean;
  onSearch?: (data: PackagesSearchData) => void;
}

export interface PackagesSearchData {
  origin: string;
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

export function PackagesSearchForm({
  searchLabels,
  isSearchEnabled = true,
  onSearch,
}: PackagesSearchFormProps) {
  const [origin, setOrigin] = useState('');
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests] = useState(2);

  const defaultLabels = {
    origin: 'From',
    destination: 'To',
    checkIn: 'Check-in',
    checkOut: 'Check-out',
    originPlaceholder: 'Departure city',
    destinationPlaceholder: 'Where to?',
    searchCtaLabel: 'Search',
    disabledLabel: 'Package search coming soon',
  };

  const labels = { ...defaultLabels, ...searchLabels };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ origin, destination, checkIn, checkOut, guests, rooms: 1 });
    }
  };

  return (
    <div className="p-4 lg:p-5">
      {/* Unified Search Bar - Consistent 56px height fields */}
      <div className="flex flex-col lg:flex-row bg-white border border-gray-200 rounded-xl overflow-visible hover:border-gray-300 transition-colors duration-200 focus-within:border-[#003b95] focus-within:ring-2 focus-within:ring-[#003b95]/10">
        {/* Origin Field */}
        <div className="relative flex-1 min-w-0 group">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <AirplaneTilt size={10} weight="fill" className="text-[#003b95]" />
              {labels.origin}
            </label>
            <input
              type="text"
              placeholder={labels.originPlaceholder}
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 outline-none truncate leading-5"
              value={origin}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setOrigin(e.target.value)}
              disabled={!isSearchEnabled}
            />
          </div>
          {origin && (
            <button
              type="button"
              onClick={() => setOrigin('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3 text-gray-400" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Destination Field */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <MapPin size={10} weight="fill" className="text-[#003b95]" />
              {labels.destination}
            </label>
            <input
              type="text"
              placeholder={labels.destinationPlaceholder}
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 outline-none truncate leading-5"
              value={destination}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
              disabled={!isSearchEnabled}
            />
          </div>
          {destination && (
            <button
              type="button"
              onClick={() => setDestination('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3 text-gray-400" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Check-in Date */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <CalendarBlank size={10} weight="fill" className="text-[#003b95]" />
              {labels.checkIn}
            </label>
            <input
              type="date"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={checkIn}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <CalendarBlank size={10} weight="fill" className="text-[#003b95]" />
              {labels.checkOut}
            </label>
            <input
              type="date"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={checkOut}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
          </div>
        </div>

        {/* Guests */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <Users size={10} weight="fill" className="text-[#003b95]" />
              Guests
            </label>
            <div className="text-[15px] font-semibold text-gray-900 leading-5">
              {guests} travelers
            </div>
          </div>
        </div>

        {/* Search Button */}
        <div className="flex items-stretch p-2 lg:p-2 lg:pl-0 border-t lg:border-t-0 shrink-0">
          <button
            type="button"
            disabled={!isSearchEnabled}
            onClick={handleSearch}
            className={cn(
              'w-full lg:w-auto h-[50px] px-5 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all duration-200 outline-none',
              'bg-[#003b95] text-white',
              'hover:bg-[#002a6e] shadow-md hover:shadow-lg',
              'active:scale-[0.98]',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none'
            )}
          >
            <MagnifyingGlass size={18} weight="bold" />
            <span>{labels.searchCtaLabel}</span>
          </button>
        </div>
      </div>

      {/* Disabled Message */}
      {!isSearchEnabled && (
        <div className="mt-3 text-center">
          <p className="text-sm font-medium text-gray-500 bg-gray-50 inline-flex items-center gap-2 px-4 py-2 rounded-full ring-1 ring-gray-200">
            <GlobeHemisphereWest size={14} weight="duotone" />
            {labels.disabledLabel}
          </p>
        </div>
      )}
    </div>
  );
}
