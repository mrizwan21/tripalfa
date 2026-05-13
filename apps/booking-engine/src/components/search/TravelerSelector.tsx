'use client';

/**
 * Traveler Selector - Kayak.com style passenger/cabin dropdown
 * 
 * From screenshot (ST of No of pax dropdown in flights.png):
 * - White card, rounded corners
 * - "Travelers" section with Adults, Children, Infants rows
 * - Each row: label, subtitle, minus button, count, plus button
 * - Minus/Plus: simple rounded border buttons with −/+ symbols
 * - "Cabin Class" section below (separated by border)
 * - 2x2 grid: Economy, Premium Economy, Business, First
 * - Selected: black border, unselected: gray border
 */

import React, { useState, useEffect, useRef } from 'react';
import { cn } from '@tripalfa/shared-utils/utils';

export interface TravelerConfig {
  adults: number;
  children: number;
  infants: number;
}

interface TravelerSelectorProps {
  value: TravelerConfig;
  onChange: (travelers: TravelerConfig) => void;
  cabinClass?: string;
  onCabinChange?: (cabin: string) => void;
  className?: string;
}

const CABIN_CLASSES = [
  { id: 'economy', label: 'Economy' },
  { id: 'premium-economy', label: 'Premium Economy' },
  { id: 'business', label: 'Business' },
  { id: 'first', label: 'First' },
];

export function TravelerSelector({
  value,
  onChange,
  cabinClass = 'economy',
  onCabinChange,
  className,
}: TravelerSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const updateTraveler = (key: keyof TravelerConfig, delta: number) => {
    const newValue = { ...value, [key]: Math.max(0, value[key] + delta) };
    // Ensure minimum 1 adult
    if (key === 'adults' && newValue.adults < 1) newValue.adults = 1;
    onChange(newValue);
  };

  const totalTravelers = value.adults + value.children + value.infants;

  return (
    <div ref={containerRef} className={cn('relative', className)}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 h-9 px-3 rounded-lg text-sm font-medium transition-all duration-200 outline-none',
          'bg-white text-gray-700 hover:text-gray-900 border border-gray-200 hover:border-gray-300',
          isOpen && 'border-gray-400'
        )}
      >
        <span className="whitespace-nowrap">
          {totalTravelers} {totalTravelers === 1 ? 'adult' : 'adults'}
          {value.children > 0 && `, ${value.children} child${value.children !== 1 ? 'ren' : ''}`}
          {value.infants > 0 && `, ${value.infants} infant${value.infants !== 1 ? 's' : ''}`}
        </span>
        <svg
          className="w-3 h-3 text-gray-400 transition-transform"
          style={{ transform: isOpen ? 'rotate(180deg)' : 'none' }}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/60 z-50 overflow-hidden">
          {/* Travelers section */}
          <div className="p-4 space-y-4">
            <h3 className="text-sm font-bold text-gray-900 mb-2">Travelers</h3>
            
            {/* Adults */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">Adults</p>
                <p className="text-xs text-gray-500">18+</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateTraveler('adults', -1)}
                  disabled={value.adults <= 1}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-medium leading-none -mt-0.5">−</span>
                </button>
                <span className="w-5 text-center font-semibold text-sm">{value.adults}</span>
                <button
                  onClick={() => updateTraveler('adults', 1)}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <span className="text-lg font-medium leading-none -mt-0.5">+</span>
                </button>
              </div>
            </div>

            {/* Children */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">Children</p>
                <p className="text-xs text-gray-500">0-17</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateTraveler('children', -1)}
                  disabled={value.children <= 0}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-medium leading-none -mt-0.5">−</span>
                </button>
                <span className="w-5 text-center font-semibold text-sm">{value.children}</span>
                <button
                  onClick={() => updateTraveler('children', 1)}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <span className="text-lg font-medium leading-none -mt-0.5">+</span>
                </button>
              </div>
            </div>

            {/* Infants on lap */}
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-sm text-gray-900">Infants on lap</p>
                <p className="text-xs text-gray-500">Under 2</p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => updateTraveler('infants', -1)}
                  disabled={value.infants <= 0}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <span className="text-lg font-medium leading-none -mt-0.5">−</span>
                </button>
                <span className="w-5 text-center font-semibold text-sm">{value.infants}</span>
                <button
                  onClick={() => updateTraveler('infants', 1)}
                  className="w-7 h-7 rounded border border-gray-200 flex items-center justify-center hover:border-gray-400 transition-colors"
                >
                  <span className="text-lg font-medium leading-none -mt-0.5">+</span>
                </button>
              </div>
            </div>
          </div>

          {/* Cabin Class section */}
          {onCabinChange && (
            <div className="border-t border-gray-200 p-4">
              <h3 className="text-sm font-bold text-gray-900 mb-3">Cabin Class</h3>
              <div className="grid grid-cols-2 gap-2">
                {CABIN_CLASSES.map((c) => (
                  <button
                    key={c.id}
                    onClick={() => onCabinChange(c.id)}
                    className={cn(
                      'w-full px-3 py-2 rounded-lg text-sm font-medium border transition-all',
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
          )}
        </div>
      )}
    </div>
  );
}

export default TravelerSelector;
