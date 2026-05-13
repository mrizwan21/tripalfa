'use client';

/**
 * Cars Search Form - Professional OTA Design
 *
 * Inspired by: Booking.com, Expedia, Kayak
 * Features:
 * - Unified connected search bar with consistent heights
 * - Pickup/Return location and dates
 * - Seamless field connections with subtle dividers
 */

import React, { useState, type ChangeEvent } from 'react';
import {
  MapPin,
  CalendarBlank,
  Clock,
  X,
  MagnifyingGlass,
  Car,
  GlobeHemisphereWest,
} from '@phosphor-icons/react';
import { cn } from '@tripalfa/shared-utils/utils';

interface CarsSearchFormProps {
  searchLabels?: {
    pickupLocation: string;
    pickupDate: string;
    pickupTime: string;
    returnDate: string;
    returnTime: string;
    locationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  isSearchEnabled?: boolean;
  onSearch?: (data: CarsSearchData) => void;
}

export interface CarsSearchData {
  pickupLocation: string;
  pickupDate: string;
  pickupTime: string;
  returnDate: string;
  returnTime: string;
}

export function CarsSearchForm({
  searchLabels,
  isSearchEnabled = true,
  onSearch,
}: CarsSearchFormProps) {
  const [pickupLocation, setPickupLocation] = useState('');
  const [pickupDate, setPickupDate] = useState('');
  const [pickupTime, setPickupTime] = useState('10:00');
  const [returnDate, setReturnDate] = useState('');
  const [returnTime, setReturnTime] = useState('10:00');

  const defaultLabels = {
    pickupLocation: 'Pick-up Location',
    pickupDate: 'Pick-up Date',
    pickupTime: 'Time',
    returnDate: 'Return Date',
    returnTime: 'Time',
    locationPlaceholder: 'Airport, city, or hotel',
    searchCtaLabel: 'Search',
    disabledLabel: 'Car rental search coming soon',
  };

  const labels = { ...defaultLabels, ...searchLabels };

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ pickupLocation, pickupDate, pickupTime, returnDate, returnTime });
    }
  };

  return (
    <div className="p-4 lg:p-5">
      {/* Unified Search Bar - Consistent 56px height fields */}
      <div className="flex flex-col lg:flex-row bg-white border border-gray-200 rounded-xl overflow-visible hover:border-gray-300 transition-colors duration-200 focus-within:border-[#003b95] focus-within:ring-2 focus-within:ring-[#003b95]/10">
        {/* Pickup Location */}
        <div className="relative flex-1 min-w-0 group">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <Car size={10} weight="fill" className="text-[#003b95]" />
              {labels.pickupLocation}
            </label>
            <input
              type="text"
              placeholder={labels.locationPlaceholder}
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 outline-none truncate leading-5"
              value={pickupLocation}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPickupLocation(e.target.value)}
              disabled={!isSearchEnabled}
            />
          </div>
          {pickupLocation && (
            <button
              type="button"
              onClick={() => setPickupLocation('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 transition-colors"
            >
              <X className="h-3 w-3 text-gray-400" strokeWidth={2.5} />
            </button>
          )}
        </div>

        {/* Pickup Date */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <CalendarBlank size={10} weight="fill" className="text-[#003b95]" />
              {labels.pickupDate}
            </label>
            <input
              type="date"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={pickupDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPickupDate(e.target.value)}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
          </div>
        </div>

        {/* Pickup Time */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <Clock size={10} weight="fill" className="text-[#003b95]" />
              {labels.pickupTime}
            </label>
            <input
              type="time"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={pickupTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setPickupTime(e.target.value)}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
          </div>
        </div>

        {/* Return Date */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <CalendarBlank size={10} weight="fill" className="text-[#003b95]" />
              {labels.returnDate}
            </label>
            <input
              type="date"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={returnDate}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReturnDate(e.target.value)}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
          </div>
        </div>

        {/* Return Time */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <Clock size={10} weight="fill" className="text-[#003b95]" />
              {labels.returnTime}
            </label>
            <input
              type="time"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={returnTime}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setReturnTime(e.target.value)}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
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
