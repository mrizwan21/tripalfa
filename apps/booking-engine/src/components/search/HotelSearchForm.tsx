'use client';

/**
 * Hotel Search Form - Premium International OTA Design
 *
 * Upgraded with:
 * - Strict height tokens for perfect alignment
 * - Premium glassmorphism design
 * - Enhanced guest/rooms selector with smooth animations
 * - Professional typography and spacing */

import React, { useState, useRef, useEffect, type ChangeEvent } from 'react';
import {
  MapPin,
  CalendarBlank,
  Users,
  X,
  MagnifyingGlass,
  Bed,
  GlobeHemisphereWest,
  Minus,
  Plus,
} from '@phosphor-icons/react';
import { cn } from '@tripalfa/shared-utils/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface HotelSearchFormProps {
  searchLabels: {
    destination: string;
    checkIn: string;
    checkOut: string;
    destinationPlaceholder: string;
    searchCtaLabel: string;
    disabledLabel?: string;
  };
  isSearchEnabled?: boolean;
  onSearch?: (data: HotelSearchData) => void;
}

export interface HotelSearchData {
  destination: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  rooms: number;
}

// Animated Icon with hover effect
function AnimatedIcon({
  icon: Icon,
  className,
  size = 20,
  weight = 'duotone',
}: {
  icon: React.ComponentType<any>;
  className?: string;
  size?: number;
  weight?: 'thin' | 'light' | 'regular' | 'fill' | 'duotone';
}) {
  return (
    <Icon
      className={cn(
        'transition-all duration-300 group-focus-within:scale-110 group-focus-within:text-[hsl(var(--primary))]',
        className
      )}
      size={size}
      weight={weight}
    />
  );
}

// Guest Selector Dropdown
function GuestSelector({
  guests,
  rooms,
  onGuestsChange,
  onRoomsChange,
  onClose,
}: {
  guests: number;
  rooms: number;
  onGuestsChange: (guests: number) => void;
  onRoomsChange: (rooms: number) => void;
  onClose: () => void;
}) {
  const popoverRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const CounterRow = ({
    label,
    value,
    onChange,
    min,
    max,
    sublabel,
  }: {
    label: string;
    value: number;
    onChange: (val: number) => void;
    min: number;
    max: number;
    sublabel?: string;
  }) => (
    <div className="flex items-center justify-between py-3 px-4">
      <div>
        <p className="text-sm font-medium text-gray-900">{label}</p>
        {sublabel && <p className="text-xs text-gray-400 mt-0.5">{sublabel}</p>}
      </div>
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
          disabled={value <= min}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200',
            value <= min
              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[hsl(var(--primary))]/30 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5'
          )}
        >
          <Minus size={14} weight="bold" />
        </button>
        <span className="w-6 text-center text-sm font-semibold text-gray-900">{value}</span>
        <button
          type="button"
          onClick={() => onChange(Math.min(max, value + 1))}
          disabled={value >= max}
          className={cn(
            'w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-200',
            value >= max
              ? 'border-gray-100 bg-gray-50 text-gray-300 cursor-not-allowed'
              : 'border-gray-200 bg-white text-gray-600 hover:border-[hsl(var(--primary))]/30 hover:text-[hsl(var(--primary))] hover:bg-[hsl(var(--primary))]/5'
          )}
        >
          <Plus size={14} weight="bold" />
        </button>
      </div>
    </div>
  );

  return (
    <div
      ref={popoverRef}
      className="absolute top-full left-0 mt-2 w-72 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/50 z-50 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
    >
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50/50">
        <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
          Guests & Rooms
        </p>
      </div>
      <CounterRow
        label="Adults"
        sublabel="Age 13+"
        value={guests}
        onChange={onGuestsChange}
        min={1}
        max={10}
      />
      <div className="border-t border-gray-100" />
      <CounterRow
        label="Children"
        sublabel="Ages 2-12"
        value={0}
        onChange={() => {}}
        min={0}
        max={6}
      />
      <div className="border-t border-gray-100" />
      <CounterRow
        label="Rooms"
        sublabel="Number of rooms"
        value={rooms}
        onChange={onRoomsChange}
        min={1}
        max={5}
      />
      <div className="px-4 py-3 border-t border-gray-100 bg-gray-50/50">
        <button
          type="button"
          onClick={onClose}
          className="w-full py-2.5 rounded-xl bg-[hsl(var(--primary))] text-white text-sm font-semibold hover:bg-[hsl(var(--primary))]/90 transition-colors duration-200"
        >
          Done
        </button>
      </div>
    </div>
  );
}

export function HotelSearchForm({
  searchLabels,
  isSearchEnabled = true,
  onSearch,
}: HotelSearchFormProps) {
  const [destination, setDestination] = useState('');
  const [checkIn, setCheckIn] = useState('');
  const [checkOut, setCheckOut] = useState('');
  const [guests, setGuests] = useState(2);
  const [rooms, setRooms] = useState(1);
  const [showGuestSelector, setShowGuestSelector] = useState(false);

  const handleSearch = () => {
    if (onSearch) {
      onSearch({ destination, checkIn, checkOut, guests, rooms });
    }
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-end">
        {/* Destination Input */}
        <div className="lg:col-span-4 relative group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <MapPin size={12} weight="fill" className="text-[hsl(var(--primary))]" />
            {searchLabels.destination}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <AnimatedIcon icon={MapPin} size={20} className="text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder={searchLabels.destinationPlaceholder}
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[hsl(var(--primary))]/50 focus:ring-4 focus:ring-[hsl(var(--primary))]/10 focus:bg-white focus:shadow-lg hover:border-gray-300"
              value={destination}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setDestination(e.target.value)}
              onFocus={() => {}}
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
        </div>

        {/* Check-in Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CalendarBlank size={12} weight="fill" className="text-[hsl(var(--primary))]" />
            {searchLabels.checkIn}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <AnimatedIcon icon={CalendarBlank} size={20} className="text-gray-400" />
            </div>
            <Input
              type="date"
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[hsl(var(--primary))]/50 focus:ring-4 focus:ring-[hsl(var(--primary))]/10 focus:bg-white focus:shadow-lg hover:border-gray-300"
              value={checkIn}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckIn(e.target.value)}
            />
          </div>
        </div>

        {/* Check-out Date */}
        <div className="lg:col-span-2 group">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <CalendarBlank size={12} weight="fill" className="text-[hsl(var(--primary))]" />
            {searchLabels.checkOut}
          </Label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 w-12 flex items-center justify-center pointer-events-none">
              <AnimatedIcon icon={CalendarBlank} size={20} className="text-gray-400" />
            </div>
            <Input
              type="date"
              className="pl-12 h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 focus:border-[hsl(var(--primary))]/50 focus:ring-4 focus:ring-[hsl(var(--primary))]/10 focus:bg-white focus:shadow-lg hover:border-gray-300"
              value={checkOut}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setCheckOut(e.target.value)}
            />
          </div>
        </div>

        {/* Guests & Rooms */}
        <div className="lg:col-span-2 group relative">
          <Label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 flex items-center gap-1.5">
            <Bed size={12} weight="fill" className="text-[hsl(var(--primary))]" />
            Guests & Rooms
          </Label>
          <button
            type="button"
            onClick={() => setShowGuestSelector(!showGuestSelector)}
            className="w-full flex items-center h-14 rounded-xl border border-gray-200/80 bg-white/90 backdrop-blur-md text-sm font-medium transition-all duration-300 hover:border-gray-300 hover:bg-white focus:border-[hsl(var(--primary))]/50 focus:ring-4 focus:ring-[hsl(var(--primary))]/10 focus:bg-white focus:shadow-lg px-3"
          >
            <Users size={20} weight="duotone" className="text-gray-400 mr-3 shrink-0" />
            <span className="text-gray-700 truncate">
              {guests} Adult{guests > 1 ? 's' : ''}, {rooms} Room{rooms > 1 ? 's' : ''}
            </span>
          </button>
          {showGuestSelector && (
            <GuestSelector
              guests={guests}
              rooms={rooms}
              onGuestsChange={setGuests}
              onRoomsChange={setRooms}
              onClose={() => setShowGuestSelector(false)}
            />
          )}
        </div>

        {/* Search Button */}
        <div className="lg:col-span-2">
          <button
            type="button"
            disabled={!isSearchEnabled}
            onClick={handleSearch}
            className={cn(
              'w-full h-14 rounded-xl font-semibold text-sm flex items-center justify-center gap-2.5 transition-all duration-300 outline-none',
              'bg-[hsl(var(--primary))] text-white',
              'hover:bg-[hsl(var(--primary))]/90 shadow-lg hover:shadow-xl hover:-translate-y-0.5',
              'active:translate-y-0 active:shadow-md',
              'disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none disabled:hover:translate-y-0'
            )}
          >
            <MagnifyingGlass size={20} weight="duotone" />
            {searchLabels.searchCtaLabel}
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
