import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@tripalfa/ui-components/ui/input";
import { Label } from "@tripalfa/ui-components/ui/label";
import { MapPin, Loader2, Plane, Building2 } from "lucide-react";

export interface CitySuggestion {
  code: string;
  title: string;
  subtitle: string;
  city: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  type: "AIRPORT" | "CITY" | "DESTINATION";
}

interface CityAutocompleteProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChange: (value: string, suggestion?: CitySuggestion) => void;
  type?: "flight" | "hotel";
  disabled?: boolean;
  className?: string;
}

// Global cache for suggestions
const suggestionCache = new Map<string, CitySuggestion[]>();

export function CityAutocomplete({
  label,
  placeholder = "Search city or airport...",
  value,
  onChange,
  type = "hotel",
  disabled = false,
  className = "",
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(value);
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync external value changes
  useEffect(() => {
    setInputValue(value);
  }, [value]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSelectedIndex(-1);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions from static data service API (queries full database)
  const fetchSuggestions = useCallback(async (query: string) => {
    if (query.length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    // Check cache first
    const cacheKey = `${type}:${query.toLowerCase()}`;
    const cached = suggestionCache.get(cacheKey);
    if (cached) {
      setSuggestions(cached);
      setIsOpen(cached.length > 0);
      return;
    }

    setIsLoading(true);

    try {
      // Call the static data service API which queries the full database
      const response = await fetch(
        `/static/suggestions?q=${encodeURIComponent(query)}&type=${type}&limit=15`
      );

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const apiSuggestions: CitySuggestion[] = (data.data || []).map((item: any) => ({
        code: item.code || item.iata_code || item.id || '',
        title: item.title || item.name || '',
        subtitle: item.subtitle || `${item.city || ''}, ${item.country || ''}`.trim(),
        city: item.city || item.name || '',
        country: item.country || item.countryName || '',
        countryCode: item.countryCode || item.country_code || '',
        latitude: item.latitude || 0,
        longitude: item.longitude || 0,
        type: item.type === 'AIRPORT' ? 'AIRPORT' : item.type === 'DESTINATION' ? 'DESTINATION' : 'CITY',
      }));

      if (apiSuggestions.length > 0) {
        setSuggestions(apiSuggestions);
        setIsOpen(true);
        setSelectedIndex(-1);
        // Cache the results
        suggestionCache.set(cacheKey, apiSuggestions);
      } else {
        setSuggestions([]);
        setIsOpen(false);
      }
    } catch (error) {
      console.error("Error fetching suggestions from static data service:", error);
      setSuggestions([]);
      setIsOpen(false);
    } finally {
      setIsLoading(false);
    }
  }, [type]);

  // Debounced search
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange(newValue);

    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      fetchSuggestions(newValue);
    }, 300);
  };

  // Handle suggestion selection
  const selectSuggestion = (suggestion: CitySuggestion) => {
    setInputValue(suggestion.title);
    onChange(suggestion.title, suggestion);
    setIsOpen(false);
    setSelectedIndex(-1);
  };

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case "ArrowUp":
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
        break;
      case "Enter":
        e.preventDefault();
        if (selectedIndex >= 0 && suggestions[selectedIndex]) {
          selectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case "Escape":
        setIsOpen(false);
        setSelectedIndex(-1);
        break;
    }
  };

  // Focus input on click
  const handleWrapperClick = () => {
    inputRef.current?.focus();
  };

  const getIcon = (suggestionType: string) => {
    switch (suggestionType) {
      case "AIRPORT":
        return <Plane className="h-4 w-4 text-blue-500" />;
      case "CITY":
      case "DESTINATION":
      default:
        return <Building2 className="h-4 w-4 text-purple-500" />;
    }
  };

  return (
    <div ref={wrapperRef} className={`relative ${className}`}>
      {label && (
        <Label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
          {label}
        </Label>
      )}
      <div
        className="relative group mt-2 cursor-text"
        onClick={handleWrapperClick}
      >
        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 text-[#6366F1] group-hover:scale-110 transition-transform" size={18} />
        <Input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (inputValue.length >= 2 && suggestions.length > 0) {
              setIsOpen(true);
            }
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full h-11 pl-10 pr-10 bg-gray-50 border-2 border-transparent rounded-xl text-sm font-bold text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#6366F1] focus:bg-white hover:bg-white transition-all"
        />
        {isLoading && (
          <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
        )}
      </div>

      {/* Dropdown */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden">
          <ul className="max-h-60 overflow-auto py-1">
            {suggestions.map((suggestion, index) => (
              <li
                key={`${suggestion.code}-${index}`}
                className={`px-4 py-3 cursor-pointer flex items-center gap-3 transition-colors ${
                  index === selectedIndex
                    ? "bg-[#6366F1]/10 border-l-2 border-[#6366F1]"
                    : "hover:bg-gray-50"
                }`}
                onClick={() => selectSuggestion(suggestion)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
                  {getIcon(suggestion.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">
                    {suggestion.title}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {suggestion.subtitle}
                    {suggestion.code && (
                      <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-[10px] font-mono">
                        {suggestion.code}
                      </span>
                    )}
                  </p>
                </div>
                <div className="flex-shrink-0 text-xs text-gray-400 uppercase">
                  {suggestion.type}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

export default CityAutocomplete;