import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as Popover from '@radix-ui/react-popover';
import { Plane, Building2, Loader2 } from 'lucide-react';
import { fetchAirports } from '../../lib/api';

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
  placeholder = 'Where to?',
  icon,
  value,
  onChange,
  onSelect,
}: LocationAutocompleteProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [results, setResults] = useState<Location[]>([]);
  const [loading, setLoading] = useState(false);
  const searchRef = useRef(search);
  const [staticLocations, setStaticLocations] = useState<Location[]>([]);

  // Load popular airports and cities on mount
  useEffect(() => {
    const loadStaticLocations = async () => {
      try {
        const { fetchInitialSuggestions } = await import('../../lib/api');
        const locations = await fetchInitialSuggestions(20);

        // Map to our internal Location interface if needed
        const mapped: Location[] = locations.map((loc: any) => ({
          code: loc.code || 'XXX',
          name: loc.title || loc.name || '',
          city: loc.city || '',
          country: loc.country || '',
          type: (loc.type?.toLowerCase() === 'city' ? 'city' : 'airport') as 'city' | 'airport',
        }));

        setStaticLocations(mapped);
      } catch (error) {
        console.error('Failed to load initial static locations:', error);
      }
    };

    loadStaticLocations();
  }, []);

  useEffect(() => {
    searchRef.current = search;
  }, [search]);

  // Initialize results with static data when component mounts or when results are empty
  useEffect(() => {
    if (results.length === 0 && staticLocations.length > 0) {
      setResults(staticLocations.slice(0, 50));
    }
  }, [staticLocations]);

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
        // fetchAirports returns an array directly
        const airports = await fetchAirports(search);

        // Map to our Location interface
        const mappedLocations: Location[] = (airports || []).map((airport: any) => ({
          code: airport.code || airport.iata_code || 'XXX',
          name: airport.title || airport.name || '',
          city: airport.city || '',
          country: airport.country || '',
          type: 'airport' as const,
        }));

        setResults(mappedLocations.slice(0, 50));
      } catch (error) {
        console.error('Failed to fetch airports:', error);
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
    <div className="overflow-visible [&_*]:overflow-visible">
      <Popover.Root open={open} onOpenChange={setOpen} modal={false}>
        {/* @ts-ignore - Radix UI / React 19 type mismatch */}
        <Popover.Anchor asChild>
          <div className="w-full h-full relative group cursor-pointer">
            {icon && (
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none">
                {icon}
              </div>
            )}
            <div
              className={`w-full h-full flex items-center bg-card ${icon ? 'pl-12' : 'pl-4'} pr-4 rounded-lg border border-transparent hover:border-border/80 focus-within:border-[hsl(var(--primary))] transition-all`}
            >
              <input
                type="text"
                value={displayValue}
                onChange={e => {
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
                className="w-full bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-medium truncate"
                autoComplete="off"
              />
              {loading && <Loader2 className="animate-spin text-muted-foreground" size={16} />}
            </div>
          </div>
        </Popover.Anchor>

        <Popover.Content
          className="w-[var(--radix-popover-trigger-width)] bg-card rounded-lg shadow-xl border border-border p-2 z-50 max-h-[400px] overflow-y-auto animate-in fade-in-0 zoom-in-95 data-[side=bottom]:slide-in-from-top-2"
          align="start"
          sideOffset={8}
          onOpenAutoFocus={e => e.preventDefault()}
        >
          <div className="space-y-2">
            {results.length === 0 && !loading ? (
              <div className="p-4 text-center text-muted-foreground text-sm">
                No locations found
              </div>
            ) : (
              results.map((loc, idx) => (
                <div
                  key={`${loc.code}-${loc.type}-${idx}`}
                  className="flex items-start gap-3 p-3 hover:bg-muted/50 rounded cursor-pointer group"
                  onClick={() => {
                    const displayText = `${loc.name} (${loc.code})`;
                    onChange?.(displayText);
                    setSearch(displayText);
                    onSelect?.(loc);
                    setOpen(false);
                  }}
                >
                  <div className="mt-1 text-muted-foreground group-hover:text-foreground">
                    {loc.type === 'city' ? <Building2 size={18} /> : <Plane size={18} />}
                  </div>
                  <div className="flex-1 gap-4">
                    <div className="flex justify-between items-center gap-4">
                      <span className="font-bold text-foreground text-sm">{loc.name}</span>
                      <span className="text-xs font-mono text-muted-foreground bg-muted/50 px-1 rounded">
                        {loc.code}
                      </span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      {loc.city}
                      {loc.country ? `, ${loc.country}` : ''}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </Popover.Content>
      </Popover.Root>
    </div>
  );
}
