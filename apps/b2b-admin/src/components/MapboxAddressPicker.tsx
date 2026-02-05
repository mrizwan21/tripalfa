import React, { useState, useEffect, useRef, useCallback } from 'react';
import { MapPin, Search, X, Navigation } from 'lucide-react';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';

interface MapboxAddressPickerProps {
    value?: Address;
    onChange: (address: Address) => void;
    placeholder?: string;
    className?: string;
}

export interface Address {
    street: string;
    city: string;
    state?: string;
    country: string;
    postalCode: string;
    coordinates: { lat: number; lng: number };
    formattedAddress?: string;
}

interface MapboxFeature {
    id: string;
    place_name: string;
    center: [number, number];
    context?: Array<{ id: string; text: string }>;
    properties?: { address?: string };
    text?: string;
}

// Mapbox access token - should be set in environment
const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || 'pk.eyJ1IjoiZXhhbXBsZSIsImEiOiJjbGEifQ.example';

export function MapboxAddressPicker({ value, onChange, placeholder = "Search address...", className }: MapboxAddressPickerProps) {
    const [query, setQuery] = useState(value?.formattedAddress || '');
    const [suggestions, setSuggestions] = useState<MapboxFeature[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [mapLoaded, setMapLoaded] = useState(false);
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<any>(null);
    const markerRef = useRef<any>(null);
    const debounceRef = useRef<number | undefined>(undefined);

    // Initialize map
    useEffect(() => {
        if (!mapContainerRef.current || mapRef.current) return;

        const initMap = async () => {
            try {
                // @ts-ignore - Mapbox GL loaded via CDN
                if (typeof mapboxgl === 'undefined') {
                    // Load Mapbox GL JS dynamically
                    const script = document.createElement('script');
                    script.src = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.js';
                    script.async = true;
                    document.head.appendChild(script);

                    const link = document.createElement('link');
                    link.href = 'https://api.mapbox.com/mapbox-gl-js/v3.0.1/mapbox-gl.css';
                    link.rel = 'stylesheet';
                    document.head.appendChild(link);

                    await new Promise(resolve => script.onload = resolve);
                }

                // @ts-ignore
                mapboxgl.accessToken = MAPBOX_TOKEN;

                const center = value?.coordinates
                    ? [value.coordinates.lng, value.coordinates.lat]
                    : [55.2708, 25.2048]; // Default: Dubai

                // @ts-ignore
                mapRef.current = new mapboxgl.Map({
                    container: mapContainerRef.current!,
                    style: 'mapbox://styles/mapbox/streets-v12',
                    center,
                    zoom: 14,
                });

                // @ts-ignore
                mapRef.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

                // Add marker
                // @ts-ignore
                markerRef.current = new mapboxgl.Marker({ draggable: true, color: '#7c3aed' })
                    .setLngLat(center)
                    .addTo(mapRef.current);

                // Handle marker drag
                markerRef.current.on('dragend', () => {
                    const lngLat = markerRef.current.getLngLat();
                    reverseGeocode(lngLat.lng, lngLat.lat);
                });

                // Handle map click
                mapRef.current.on('click', (e: any) => {
                    markerRef.current.setLngLat([e.lngLat.lng, e.lngLat.lat]);
                    reverseGeocode(e.lngLat.lng, e.lngLat.lat);
                });

                setMapLoaded(true);
            } catch (error) {
                console.error('Failed to initialize map:', error);
            }
        };

        initMap();

        return () => {
            if (mapRef.current) {
                mapRef.current.remove();
                mapRef.current = null;
            }
        };
    }, []);

    // Update marker when value changes
    useEffect(() => {
        if (mapRef.current && markerRef.current && value?.coordinates) {
            const { lng, lat } = value.coordinates;
            markerRef.current.setLngLat([lng, lat]);
            mapRef.current.flyTo({ center: [lng, lat], zoom: 16 });
        }
    }, [value?.coordinates]);

    // Reverse geocode coordinates to address
    const reverseGeocode = useCallback(async (lng: number, lat: number) => {
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${MAPBOX_TOKEN}`
            );
            const data = await response.json();

            if (data.features && data.features.length > 0) {
                const feature = data.features[0];
                const address = parseFeatureToAddress(feature);
                setQuery(feature.place_name);
                onChange(address);
            }
        } catch (error) {
            console.error('Reverse geocode failed:', error);
        }
    }, [onChange]);

    // Search for addresses
    const searchAddress = useCallback(async (searchQuery: string) => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        setIsLoading(true);
        try {
            const response = await fetch(
                `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(searchQuery)}.json?access_token=${MAPBOX_TOKEN}&types=address,place,locality,neighborhood&limit=5`
            );
            const data = await response.json();
            setSuggestions(data.features || []);
            setShowSuggestions(true);
        } catch (error) {
            console.error('Search failed:', error);
            setSuggestions([]);
        } finally {
            setIsLoading(false);
        }
    }, []);

    // Debounced search
    const handleQueryChange = (newQuery: string) => {
        setQuery(newQuery);

        if (debounceRef.current) {
            window.clearTimeout(debounceRef.current);
        }

        debounceRef.current = window.setTimeout(() => {
            searchAddress(newQuery);
        }, 300);
    };

    // Parse Mapbox feature to our Address format
    const parseFeatureToAddress = (feature: MapboxFeature): Address => {
        const context = feature.context || [];

        const getContextValue = (type: string) => {
            const item = context.find(c => c.id.startsWith(type));
            return item?.text || '';
        };

        return {
            street: feature.properties?.address || feature.text || '',
            city: getContextValue('place') || getContextValue('locality'),
            state: getContextValue('region'),
            country: getContextValue('country'),
            postalCode: getContextValue('postcode'),
            coordinates: {
                lng: feature.center[0],
                lat: feature.center[1],
            },
            formattedAddress: feature.place_name,
        };
    };

    // Handle suggestion selection
    const selectSuggestion = (feature: MapboxFeature) => {
        const address = parseFeatureToAddress(feature);
        setQuery(feature.place_name);
        setShowSuggestions(false);
        onChange(address);

        // Update map
        if (mapRef.current && markerRef.current) {
            mapRef.current.flyTo({ center: feature.center, zoom: 16 });
            markerRef.current.setLngLat(feature.center);
        }
    };

    // Get current location
    const getCurrentLocation = () => {
        if (!navigator.geolocation) return;

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { longitude, latitude } = position.coords;
                if (mapRef.current && markerRef.current) {
                    mapRef.current.flyTo({ center: [longitude, latitude], zoom: 16 });
                    markerRef.current.setLngLat([longitude, latitude]);
                }
                reverseGeocode(longitude, latitude);
            },
            (error) => console.error('Geolocation error:', error)
        );
    };

    return (
        <div className={`space-y-4 ${className}`}>
            {/* Search Input */}
            <div className="relative">
                <div className="relative">
                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                        value={query}
                        onChange={(e) => handleQueryChange(e.target.value)}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        placeholder={placeholder}
                        className="pl-10 pr-20 h-12 bg-white border-gray-200 rounded-xl" /> <div className="absolute right-2 top-2 flex gap-1">
                        {query && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => { setQuery(''); setSuggestions([]); }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-primary"
                            onClick={getCurrentLocation}
                            title="Use current location"
                        >
                            <Navigation className="h-4 w-4" />
                        </Button>
                    </div>
                </div>

                {/* Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                    <div className="absolute z-50 w-full mt-1 bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                        {suggestions.map((feature) => (
                            <button
                                key={feature.id}
                                type="button"
                                className="w-full px-4 py-3 text-left hover:bg-gray-50 flex items-start gap-3 transition-colors"
                                onClick={() => selectSuggestion(feature)}
                            >
                                <MapPin className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{feature.place_name}</span>
                            </button>
                        ))}
                    </div>
                )}

                {isLoading && (
                    <div className="absolute right-12 top-3.5">
                        <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>

            {/* Map Container */}
            <div
                ref={mapContainerRef}
                className="h-64 rounded-2xl overflow-hidden border border-gray-200 shadow-sm"
                style={{ minHeight: '256px' }}
            />

            {/* Address Preview */}
            {value && (
                <div className="bg-gray-50 rounded-xl p-4 space-y-2">
                    <div className="flex items-center gap-2 text-sm font-medium text-gray-900">
                        <MapPin className="h-4 w-4 text-primary" />
                        Selected Location
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                        {value.street && <div><span className="text-gray-400">Street:</span> {value.street}</div>}
                        {value.city && <div><span className="text-gray-400">City:</span> {value.city}</div>}
                        {value.state && <div><span className="text-gray-400">State:</span> {value.state}</div>}
                        {value.country && <div><span className="text-gray-400">Country:</span> {value.country}</div>}
                        {value.postalCode && <div><span className="text-gray-400">Postal:</span> {value.postalCode}</div>}
                        <div className="col-span-2 text-xs text-gray-400">
                            Coordinates: {value.coordinates.lat.toFixed(6)}, {value.coordinates.lng.toFixed(6)}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default MapboxAddressPicker;
