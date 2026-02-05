
import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Plane, Bed, Building2 } from 'lucide-react';
import { fetchSuggestions } from '../../lib/api';

export interface Suggestion {
    type: 'CITY' | 'AIRPORT' | 'HOTEL';
    icon: string;
    title: string;
    subtitle: string;
    code: string;
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
}

export function SearchAutocomplete({ type, placeholder, defaultValue, value, onSelect, onChange, className, icon }: SearchAutocompleteProps): React.JSX.Element {
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
        if (value === undefined) setInternalQuery(val);
        if (onChange) onChange(val);

        if (val.length > 1) {
            setLoading(true);
            try {
                const data = await fetchSuggestions(val, type);
                const suggestions: Suggestion[] = (data as any[]).map((item) => ({
                    type: item.type === 'airport' ? 'AIRPORT' : (item.icon === 'bed' ? 'HOTEL' : 'CITY'),
                    icon: item.icon || (item.type === 'airport' ? 'plane' : 'map-pin'),
                    title: item.name,
                    subtitle: item.subtitle || item.country || '',
                    code: item.iata_code || '',
                    city: item.type === 'city' ? item.name : '',
                    country: item.country || '',
                    countryCode: item.country_code
                }));
                // Deduplicate mapping code - oops I typed it twice in reasoning but corrected here? No wait.
                // I will just use clean replacement.
                setResults(suggestions);
                setIsOpen(true);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        } else {
            setIsOpen(false);
            setResults([]);
        }
    };

    const IconMap: Record<string, any> = {
        'map-pin': MapPin,
        'plane': Plane,
        'bed': Bed,
        'hotel': Building2
    };

    return (
        <div className="relative w-full h-full bg-white rounded-xl border-2 border-gray-100 hover:border-gray-200 transition-all group" ref={wrapperRef}>
            <div className="relative h-full flex items-center px-4">
                <div className="mr-3 text-gray-400 flex-shrink-0">
                    {icon ? icon : <MapPin className="text-[#6366F1]" size={16} />}
                </div>
                <input
                    type="text"
                    value={query}
                    onChange={(e) => handleSearch(e.target.value)}
                    onFocus={() => query.length > 1 && setIsOpen(true)}
                    className={`w-full h-full bg-transparent border-none text-sm font-bold text-gray-900 placeholder-gray-400 focus:ring-0 p-0 truncate ${className}`}
                    placeholder={placeholder || "Where to?"}
                    autoComplete="off"
                />
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
                                            {item.code}
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
