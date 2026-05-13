'use client';

/**
 * Hotel Search Form - Kayak.com style
 * 
 * Labels (different from flights):
 * - Hotel: Where to? (not From/To)
 * - Hotel: Check-in / Check-out (not Departure/Return)
 * - Consistent 56px field heights
 * - Clean, aligned layout with proper spacing
 */

import React, { useState } from 'react';
import { Buildings, MapPin, Users, CalendarBlank, MagnifyingGlass } from '@phosphor-icons/react';
import { cn } from '@tripalfa/shared-utils/utils';
import { format } from 'date-fns';
import { DualMonthCalendar } from '../ui/DualMonthCalendar';

// ─── Types ───

export interface HotelSearchData {
  destination: string;
  checkInDate: string;
  checkOutDate: string;
  adults: number;
  children: number;
  rooms: number;
}

interface HotelSearchFormProps {
  onSearch: (data: HotelSearchData) => void;
  isSearchEnabled: boolean;
  searchLabels?: {
    destination?: string;
    checkIn?: string;
    checkOut?: string;
    destinationPlaceholder?: string;
    searchCtaLabel?: string;
    disabledLabel?: string;
  };
}

export function HotelSearchForm({ onSearch, isSearchEnabled, searchLabels }: HotelSearchFormProps) {
  const [destination, setDestination] = useState('');
  const [checkInDate, setCheckInDate] = useState<Date | null>(null);
  const [checkOutDate, setCheckOutDate] = useState<Date | null>(null);
  const [adults, setAdults] = useState(2);
  const [children, setChildren] = useState(0);
  const [rooms, setRooms] = useState(1);
  const [showTravelerPanel, setShowTravelerPanel] = useState(false);

  const handleSearch = () => {
    onSearch({
      destination,
      checkInDate: checkInDate ? format(checkInDate, 'yyyy-MM-dd') : '',
      checkOutDate: checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : '',
      adults,
      children,
      rooms,
    });
  };

  return (
    <div className="w-full max-w-5xl mx-auto p-4 lg:p-5">
      <div className="flex flex-col lg:flex-row flex-nowrap bg-white border border-gray-200 rounded-xl overflow-visible hover:border-gray-300 transition-colors focus-within:border-[#003b95] focus-within:ring-2 focus-within:ring-[#003b95]/10">
        {/* Destination Field */}
        <div className="relative flex-1 min-w-0 group">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <MapPin size={10} weight="fill" className="text-[#003b95]" />
              Where to?
            </label>
            <input
              type="text"
              placeholder="Destination, hotel name"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 placeholder:text-gray-400 outline-none truncate leading-5"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
              disabled={!isSearchEnabled}
            />
          </div>
        </div>

        {/* Check-in */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <CalendarBlank size={10} weight="fill" className="text-[#003b95]" />
              Check-in
            </label>
            <input
              type="date"
              className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
              value={checkInDate ? format(checkInDate, 'yyyy-MM-dd') : ''}
              onChange={(e) => {
                const d = e.target.value ? new Date(e.target.value) : null;
                setCheckInDate(d);
              }}
              disabled={!isSearchEnabled}
              style={{ padding: 0, margin: 0, border: 'none' }}
            />
          </div>
        </div>

        {/* Check-out */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
        <div className="px-5 py-2 h-[56px] flex flex-col justify-center">
          <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
            <CalendarBlank size={10} weight="fill" className="text-[#003b95]" />
            Check-out
          </label>
          <input
            type="date"
            className="w-full h-5 bg-transparent text-[15px] font-semibold text-gray-900 outline-none cursor-pointer appearance-none leading-5 p-0 m-0 border-0"
            value={checkOutDate ? format(checkOutDate, 'yyyy-MM-dd') : ''}
            onChange={(e) => {
              const d = e.target.value ? new Date(e.target.value) : null;
              setCheckOutDate(d);
            }}
            disabled={!isSearchEnabled}
            style={{ padding: 0, margin: 0, border: 'none' }}
          />
        </div>
        </div>

        {/* Travelers */}
        <div className="relative flex-1 min-w-0 group border-t lg:border-t-0 lg:border-l border-gray-200">
          <div className="px-5 py-2 h-[56px] flex flex-col justify-center cursor-pointer" onClick={() => setShowTravelerPanel(!showTravelerPanel)}>
            <label className="text-[10px] font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1 mb-0">
              <Users size={10} weight="fill" className="text-[#003b95]" />
              Travelers
            </label>
            <span className="text-[15px] font-semibold text-gray-900 leading-5">
              {adults} Adults, {children} Kids
            </span>
          </div>
          {/* Traveler Dropdown Panel */}
          {showTravelerPanel && (
            <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/60 z-50 p-4 w-72 animate-scale-in">
              {/* Adults */}
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Adults</p>
                  <p className="text-xs text-gray-500">Age 18+</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setAdults(Math.max(1, adults - 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#003b95] transition-colors">
                    <span className="text-lg font-bold text-gray-600">-</span>
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{adults}</span>
                  <button onClick={() => setAdults(Math.min(8, adults + 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#003b95] transition-colors">
                    <span className="text-lg font-bold text-gray-600">+</span>
                  </button>
                </div>
              </div>
              {/* Children */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Children</p>
                  <p className="text-xs text-gray-500">Age 0-17</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setChildren(Math.max(0, children - 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#003b95] transition-colors">
                    <span className="text-lg font-bold text-gray-600">-</span>
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{children}</span>
                  <button onClick={() => setChildren(Math.min(6, children + 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#003b95] transition-colors">
                    <span className="text-lg font-bold text-gray-600">+</span>
                  </button>
                </div>
              </div>
              {/* Rooms */}
              <div className="flex items-center justify-between py-2 border-t border-gray-100">
                <div>
                  <p className="font-semibold text-sm text-gray-900">Rooms</p>
                  <p className="text-xs text-gray-500">Number of rooms</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => setRooms(Math.max(1, rooms - 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#003b95] transition-colors">
                    <span className="text-lg font-bold text-gray-600">-</span>
                  </button>
                  <span className="w-6 text-center font-semibold text-sm">{rooms}</span>
                  <button onClick={() => setRooms(Math.min(5, rooms + 1))} className="w-8 h-8 rounded-full border border-gray-200 flex items-center justify-center hover:border-[#003b95] transition-colors">
                    <span className="text-lg font-bold text-gray-600">+</span>
                  </button>
                </div>
              </div>
            </div>
          )}
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
            <span>Search Hotels</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export default HotelSearchForm;
