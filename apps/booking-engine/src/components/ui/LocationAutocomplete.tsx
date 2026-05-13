'use client';

/**
 * Location Autocomplete - Kayak.com style airport dropdown
 * 
 * From screenshot (ST Flight Airport dropdown.png):
 * - White card, rounded-xl
 * - Gray circular icon with airplane
 * - City name bold, subtitle below
 * - Code badge (e.g. "LON") on the right
 * - "All airports" entry at the top for cities
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Plane, X } from 'lucide-react';
import { cn } from '@tripalfa/shared-utils/utils';
import { fetchAirports } from '@/lib/api';

// --- Types ---

export interface Location {
  code: string;
  name: string;
  city: string;
  country: string;
  type: 'city' | 'airport';
}

interface LocationAutocompleteProps {
  label?: string;
  placeholder?: string;
  displayStyle?: 'pill' | 'input';
  value?: Location | null;
  onChange?: (location: Location | null) => void;
}

// --- Component ---

export function LocationAutocomplete({
  label = 'From',
  placeholder = 'From?',
  displayStyle = 'input',
  value,
  onChange,
}: LocationAutocompleteProps) {
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch on search
  useEffect(() => {
    if (!search || search.length < 2) {
      setResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const airports = await fetchAirports(search);
        const mappedLocations: Location[] = (airports || []).map((airport: any) => ({
          code: airport.code || airport.iata_code || 'XXX',
          name: airport.title || airport.name || '',
          city: airport.city || airport.title || '',
          country: airport.country || '',
          type: 'airport' as const,
        }));
        setResults(mappedLocations.slice(0, 20));
      } catch (error) {
        console.error('Failed to fetch airports:', error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [search]);

  const handleSelect = (loc: Location) => {
    onChange?.(loc);
    setSearch('');
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange?.(null);
    setSearch('');
  };

  const handleClick = () => {
    if (!value) {
      setIsOpen(true);
      inputRef.current?.focus();
    }
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Display value as a pill or input */}
      {value ? (
        <div className="flex items-center gap-2 px-3 py-2 bg-white rounded-lg">
          <span className="text-sm font-medium text-gray-900">
            {value.city} ({value.code})
          </span>
          <button onClick={handleClear} className="p-0.5 hover:bg-gray-100 rounded-full transition-colors">
            <X size={14} weight="bold" className="text-gray-400" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleClick}
          className="w-full px-3 py-2 rounded-lg cursor-pointer flex items-center gap-2"
        >
          <Plane size={16} weight="bold" className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder={placeholder}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => setIsOpen(true)}
            className="w-full bg-transparent text-sm font-semibold text-gray-900 placeholder:text-gray-400 outline-none"
            autoComplete="off"
          />
        </div>
      )}

      {/* Dropdown - White card with Kayak-style items */}
      {isOpen && (search.length >= 2 || loading) && (
        <div className="absolute top-full left-0 mt-1 bg-white rounded-xl shadow-2xl shadow-black/10 ring-1 ring-gray-200/60 z-50 w-full max-w-sm overflow-hidden">
          {loading ? (
            <div className="p-4 text-center">
              <div className="animate-spin w-5 h-5 border-2 border-gray-200 border-t-gray-600 rounded-full mx-auto" />
              <p className="text-xs text-gray-400 mt-2">Searching...</p>
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center">
              <p className="text-sm text-gray-500">No airports found</p>
              <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto">
              {results.map((loc, index) => (
                <button
                  key={index}
                  onClick={() => handleSelect(loc)}
                  className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-100 last:border-b-0"
                >
                  {/* Gray circular icon with airplane */}
                  <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center shrink-0">
                    <Plane size={18} weight="bold" className="text-gray-500" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm text-gray-900 truncate">
                      {loc.name}
                      <span className="ml-2 text-xs font-mono font-normal text-gray-400">{loc.code}</span>
                    </p>
                    <p className="text-xs text-gray-500 truncate">{loc.city}, {loc.country}</p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LocationAutocomplete;
