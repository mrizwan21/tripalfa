import React, { useState, useEffect, useRef } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Plane, Building2, Loader2 } from 'lucide-react';
import { getLocations } from '@tripalfa/static-data';

interface Location {
    code: string;
    name: string;
    city: string;
    country: string;
    type: 'city' | 'airport';
}

interface LocationAutocompleteProps {
    label?: string;
    placeholder?: string;
    icon?: React.ReactNode;
    value?: string;
    onChange?: (val: string) => void;
    onSelect?: (location: Location) => void;
}

export function LocationAutocomplete({
    label,
    placeholder = "Where to?",
    icon,
    value,
    onChange,
    onSelect
}: LocationAutocompleteProps) {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState('');
    const [results, setResults] = useState<Location[]>([]);
    const [loading, setLoading] = useState(false);
    const searchRef = useRef(search);

    // Initial static data - will be replaced by centralized system
    const staticLocations: Location[] = [];

    useEffect(() => {
        searchRef.current = search;
    }, [search]);

    useEffect(() => {
        // If empty or short, use static data
        if (!search || search.length < 2) {
            setResults(staticLocations.slice(0, 50));
            setLoading(false);
            return;
        }

        const timer = setTimeout(async () => {
            if (searchRef.current !== search) return;

            setLoading(true);
            try {
                const locations = await getLocations(search);
                
                // Map to our Location interface
                const mappedLocations: Location[] = locations.map((loc: any) => ({
                    code: loc.iata_code || loc.code || 'XXX',
                    name: loc.name,
                    city: loc.city || loc.name,
                    country: loc.country,
                    type: loc.type
                }));

                setResults(mappedLocations.slice(0, 50));
            } catch (error) {
                console.error('Failed to fetch locations:', error);
                // Fallback to empty results
                setResults([]);
            } finally {
                setLoading(false);
            }
        }, 300); // 300ms debounce

        return () => clearTimeout(timer);
    }, [search]);

    const displayValue = value || search;

    return (
        <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
            <Popover.Anchor asChild>
                <div className="w-full h-full relative group cursor-pointer">
                    {icon && <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none">{icon}</div>}
                    <div className={`w-full h-full flex items-center bg-white ${icon ? 'pl-12' : 'pl-4'} pr-4 rounded-lg border border-transparent hover:border-gray-200 focus-within:border-[#003B95] transition-all`}>
                        <input
                            type="text"
                            value={displayValue}
                            onChange={(e) => {
                                const val = e.target.value;
                                setSearch(val);
                                onChange?.(val);
                                if (!open && val.length > 0) setOpen(true);
                            }}
                            onFocus={() => {
                                setOpen(true);
                                if (results.length === 0) setResults(staticLocations.slice(0, 50));
                            }}
                            placeholder={placeholder}
                            className="w-full bg-transparent outline-none text-gray-900 placeholder-gray-500 font-medium truncate"
                            autoComplete="off"
                        />
                        {loading && <Loader2 className="animate-spin text-gray-400" size={16} />}
                    </div>
                </div>
            </Popover.Anchor>

            <Popover.Content
                className="w-[var(--radix-popover-trigger-width)] bg-white rounded-lg shadow-xl border border-gray-100 p-2 z-50 max-h-[400px] overflow-y-auto animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
                align="start"
                sideOffset={8}
                onOpenAutoFocus={(e) => e.preventDefault()}
            >
                <div className="space-y-1">
                    {results.length === 0 && !loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">
                            No locations found
                        </div>
                    ) : (
                        results.map((loc, idx) => (
                            <div
                                key={`${loc.code}-${loc.type}-${idx}`}
                                className="flex items-start gap-3 p-3 hover:bg-gray-50 rounded cursor-pointer group"
                                onClick={() => {
                                    const displayText = `${loc.name} (${loc.code})`;
                                    onChange?.(displayText);
                                    setSearch(displayText);
                                    onSelect?.(loc);
                                    setOpen(false);
                                }}
                            >
                                <div className="mt-1 text-gray-400 group-hover:text-gray-600">
                                    {loc.type === 'city' ? <Building2 size={18} /> : <Plane size={18} />}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-center">
                                        <span className="font-bold text-gray-900 text-sm">{loc.name}</span>
                                        <span className="text-xs font-mono text-gray-500 bg-gray-100 px-1 rounded">{loc.code}</span>
                                    </div>
                                    <div className="text-xs text-gray-500">
                                        {loc.city}{loc.country ? `, ${loc.country}` : ''}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </Popover.Content>
        </Popover.Root>
    );
}
