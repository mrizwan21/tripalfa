
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { MapPin, Plane, Bed, Building2 } from 'lucide-react';
import { fetchSuggestions } from '../../lib/api';

export interface Suggestion {
    type: 'CITY' | 'AIRPORT' | 'HOTEL';
    icon: string;
    title: string;
    subtitle: string;
    code: string | number;
    city: string;
    country: string;
    countryCode?: string;
}

interface SearchAutocompleteProps {
    type: 'flight' | 'hotel';
    placeholder?: string;
    defaultValue?: string;
    value?: string; // Controlled value
    onSelect: (value: Suggestion) => void;
    onChange?: (val: string) => void; // Bubble up text change
    className?: string;
    icon?: React.ReactNode;
    dataTestId?: string;
}

export function SearchAutocomplete({ type, placeholder, defaultValue, value, onSelect, onChange, className, icon, dataTestId }: SearchAutocompleteProps): React.JSX.Element {
    const [internalQuery, setInternalQuery] = useState(defaultValue || '');
    // Use controlled value if provided, else internal
    const query = value !== undefined ? value : internalQuery;

    const [results, setResults] = useState<Suggestion[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // Close on click outside
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleSearch = async (val: string) => {
        console.log(`[SearchAutocomplete] Input changed to: "${val}"`);
        if (value === undefined) setInternalQuery(val);
        if (onChange) onChange(val);

        // If empty or less than 2 chars, don't fetch
        if (val.length < 2) {
            console.log(`[SearchAutocomplete] Query too short (${val.length} chars), not fetching`);
            setIsOpen(false);
            setResults([]);
            return;
        }

        // Fetch from API
        console.log(`[SearchAutocomplete] Fetching suggestions for: "${val}"`);
        setLoading(true);
        try {
            const data = await fetchSuggestions(val, type);
            console.log(`[SearchAutocomplete] Received data:`, data);
            const suggestions: Suggestion[] = (data as any[])
                .filter(item => item && item.title) // Filter out invalid items
                // Filter to only AIRPORT results when flight search
                .filter(item => type === 'flight' ? item.type === 'AIRPORT' : true)
                .map((item) => ({
                    type: (item.type === 'AIRPORT' ? 'AIRPORT' : (item.type === 'HOTEL' ? 'HOTEL' : 'CITY')) as 'AIRPORT' | 'HOTEL' | 'CITY',
                    icon: item.icon || (item.type === 'AIRPORT' ? 'plane' : (item.type === 'HOTEL' ? 'bed' : 'map-pin')),
                    title: item.title,
                    subtitle: item.subtitle || item.country || '',
                    code: item.code,
                    city: item.city || '',
                    country: item.country || '',
                    countryCode: item.countryCode
                }))
                // Sort to prioritize AIRPORT entries first, then HOTEL, then CITY
                .sort((a, b) => {
                    const typeOrder: Record<string, number> = { 'AIRPORT': 0, 'HOTEL': 1, 'CITY': 2 };
                    return (typeOrder[a.type] || 99) - (typeOrder[b.type] || 99);
                });
            console.log(`[SearchAutocomplete] Transformed suggestions:`, suggestions);
            setResults(suggestions);
            setIsOpen(suggestions.length > 0);
            console.log(`[SearchAutocomplete] Opening dropdown with ${suggestions.length} items`);
        } catch (err) {
            console.error('[SearchAutocomplete] Failed to fetch suggestions:', err);
            setResults([]);
            setIsOpen(false);
        } finally {
            setLoading(false);
        }
    };

    const IconMap: Record<string, any> = {
        'map-pin': MapPin,
        'plane': Plane,
        'bed': Bed,
        'hotel': Building2
    };

    return (
        <div className="relative w-full h-12 bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all group" ref={wrapperRef}>
            <div className="relative h-full flex items-center px-4">
                <div className="mr-3 text-gray-400 flex-shrink-0">
                    {icon ? icon : <MapPin className="text-[#6366F1]" size={16} />}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => {
                        if (query.length > 0) setIsOpen(true);
                    }}
                    className={`w-full h-full bg-transparent border-none text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-0 p-0 truncate ${className}`}
                    placeholder={placeholder || "Where to?"}
                    autoComplete="off"
                    data-testid={dataTestId}
                />
                {loading && <span className="text-xs text-gray-400">Loading...</span>}
            </div>

            {/* Dropdown Results */}
            {isOpen && results.length > 0 && (
                <div className="absolute top-full left-0 w-full min-w-[300px] mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 py-2 z-[999] animate-in fade-in slide-in-from-top-1">
                    <div className="max-h-64 overflow-y-auto no-scrollbar">
                        {results.map((item, idx) => {
                            const IconComp = (item.icon && IconMap[item.icon]) || MapPin;
                            return (
                                <div
                                    key={idx}
                                    className="px-4 py-3 hover:bg-gray-50 cursor-pointer flex items-center gap-3 group transition-colors border-b last:border-0 border-gray-50"
                                    onClick={() => {
                                        if (value === undefined) setInternalQuery(item.title);
                                        if (onChange) onChange(item.title);
                                        setIsOpen(false);
                                        onSelect(item);
                                    }}
                                >
                                    <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-gray-400 group-hover:bg-[#6366F1]/10 group-hover:text-[#6366F1] transition-colors">
                                        <IconComp size={16} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 truncate">{item.title}</p>
                                        <p className="text-xs text-gray-500 truncate">{item.subtitle}</p>
                                    </div>
                                    {item.code && (
                                        <span className="text-[10px] font-black uppercase bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded ml-2">
                                            {typeof item.code === 'string' ? item.code : item.code}
                                        </span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}


