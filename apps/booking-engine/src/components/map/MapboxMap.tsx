/**
 * Mapbox Map Component
 * ====================
 * A reusable map component using Mapbox GL JS.
 * Supports both hotel locations and flight routes.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  DEFAULT_MAP_CONFIG,
  MARKER_COLORS,
  HotelMapMarker,
  FlightMapMarker,
  FlightPath,
  MapCoordinates,
} from '../../lib/mapbox-config';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_TOKEN;

// ── Types ─────────────────────────────────────────────────────────────────────

interface MapboxMapProps {
  // Map mode
  mode: 'hotel' | 'flight';
  
  // Hotel mode props
  markers?: HotelMapMarker[];
  selectedMarkerId?: string;
  onMarkerClick?: (marker: HotelMapMarker) => void;
  
  // Flight mode props
  flightPath?: FlightPath;
  flightMarkers?: FlightMapMarker[];
  
  // Common props
  center?: MapCoordinates;
  zoom?: number;
  style?: keyof typeof MAPBOX_STYLES;
  className?: string;
  height?: string;
  showControls?: boolean;
  interactive?: boolean;
  
  // Callbacks
  onMapLoad?: (map: mapboxgl.Map) => void;
  onMapClick?: (coordinates: MapCoordinates) => void;
}

// ── Hotel Marker Component ───────────────────────────────────────────────────

function createHotelMarker(
  marker: HotelMapMarker,
  isSelected: boolean,
  onClick?: (marker: HotelMapMarker) => void
): mapboxgl.Marker {
  // Create custom marker element
  const el = document.createElement('div');
  el.className = 'hotel-marker';
  el.style.cssText = `
    cursor: pointer;
    transition: transform 0.2s ease;
  `;
  
  // Marker HTML with price badge
  el.innerHTML = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        background: ${isSelected ? '#EC5C4C' : MARKER_COLORS.hotel};
        color: white;
        padding: 8px 12px;
        border-radius: 20px;
        font-weight: 700;
        font-size: 12px;
        box-shadow: 0 4px 12px rgba(99, 102, 241, 0.4);
        white-space: nowrap;
        border: 3px solid white;
        ${isSelected ? 'transform: scale(1.1);' : ''}
      ">
        ${marker.price ? `$${marker.price}` : marker.name.slice(0, 10)}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 8px solid transparent;
        border-right: 8px solid transparent;
        border-top: 10px solid ${isSelected ? '#EC5C4C' : MARKER_COLORS.hotel};
        margin-top: -2px;
      "></div>
    </div>
  `;
  
  // Add hover effect
  el.addEventListener('mouseenter', () => {
    el.style.transform = 'scale(1.1)';
  });
  el.addEventListener('mouseleave', () => {
    el.style.transform = isSelected ? 'scale(1.1)' : 'scale(1)';
  });
  
  // Add click handler
  if (onClick) {
    el.addEventListener('click', () => onClick(marker));
  }
  
  // Create Mapbox marker
  return new mapboxgl.Marker(el)
    .setLngLat([marker.longitude, marker.latitude]);
}

// ── Airport Marker Component ─────────────────────────────────────────────────

function createAirportMarker(
  marker: FlightMapMarker,
  onClick?: (marker: FlightMapMarker) => void
): mapboxgl.Marker {
  const el = document.createElement('div');
  el.className = 'airport-marker';
  el.style.cssText = `
    cursor: pointer;
    transition: transform 0.2s ease;
  `;
  
  const color = marker.type === 'origin' 
    ? MARKER_COLORS.origin 
    : marker.type === 'destination' 
      ? MARKER_COLORS.destination 
      : MARKER_COLORS.stopover;
  
  el.innerHTML = `
    <div style="
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
    ">
      <div style="
        background: ${color};
        color: white;
        padding: 10px 14px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 11px;
        box-shadow: 0 4px 16px ${color}66;
        white-space: nowrap;
        border: 3px solid white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">
        ${marker.code}
      </div>
      <div style="
        width: 0;
        height: 0;
        border-left: 10px solid transparent;
        border-right: 10px solid transparent;
        border-top: 12px solid ${color};
        margin-top: -2px;
      "></div>
      <div style="
        background: white;
        padding: 4px 8px;
        border-radius: 6px;
        font-size: 10px;
        font-weight: 600;
        color: #374151;
        margin-top: 4px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        max-width: 120px;
        text-align: center;
        overflow: hidden;
        text-overflow: ellipsis;
      ">
        ${marker.city}
      </div>
    </div>
  `;
  
  if (onClick) {
    el.addEventListener('click', () => onClick(marker));
  }
  
  return new mapboxgl.Marker(el)
    .setLngLat([marker.longitude, marker.latitude]);
}

// ── Main Map Component ───────────────────────────────────────────────────────

export function MapboxMap({
  mode,
  markers = [],
  selectedMarkerId,
  onMarkerClick,
  flightPath,
  flightMarkers = [],
  center,
  zoom = DEFAULT_MAP_CONFIG.zoom,
  style = 'streets',
  className = '',
  height = '400px',
  showControls = true,
  interactive = true,
  onMapLoad,
  onMapClick,
}: MapboxMapProps): React.JSX.Element {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      const mapCenter: [number, number] = center 
        ? [center.longitude, center.latitude]
        : DEFAULT_MAP_CONFIG.center;

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLES[style],
        center: mapCenter,
        zoom,
        minZoom: DEFAULT_MAP_CONFIG.minZoom,
        maxZoom: DEFAULT_MAP_CONFIG.maxZoom,
        interactive,
      });

      // Add navigation controls
      if (showControls) {
        map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
        map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
      }

      // Map load event
      map.current.on('load', () => {
        setMapLoaded(true);
        if (map.current && onMapLoad) {
          onMapLoad(map.current);
        }
      });

      // Map click event
      map.current.on('click', (e) => {
        if (onMapClick) {
          onMapClick({ longitude: e.lngLat.lng, latitude: e.lngLat.lat });
        }
      });

      // Error handling
      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
      });

    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to initialize map');
    }

    // Cleanup
    return () => {
      // Clear markers
      markersRef.current.forEach(marker => marker.remove());
      markersRef.current = [];
      
      // Remove map
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Update map style
  useEffect(() => {
    if (map.current && mapLoaded) {
      map.current.setStyle(MAPBOX_STYLES[style]);
    }
  }, [style, mapLoaded]);

  // Update map center
  useEffect(() => {
    if (map.current && center && mapLoaded) {
      map.current.flyTo({
        center: [center.longitude, center.latitude],
        zoom,
        duration: 1000,
      });
    }
  }, [center, zoom, mapLoaded]);

  // ── Hotel Mode: Add markers ───────────────────────────────────────────────
  useEffect(() => {
    if (!map.current || !mapLoaded || mode !== 'hotel') return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    markers.forEach(marker => {
      const isSelected = marker.id === selectedMarkerId;
      const mapboxMarker = createHotelMarker(marker, isSelected, onMarkerClick);
      mapboxMarker.addTo(map.current!);
      markersRef.current.push(mapboxMarker);
    });

    // Fit bounds if multiple markers
    if (markers.length > 1) {
      const bounds = new mapboxgl.LngLatBounds();
      markers.forEach(m => bounds.extend([m.longitude, m.latitude]));
      map.current.fitBounds(bounds, { padding: 80, maxZoom: 14 });
    }
  }, [markers, selectedMarkerId, mode, mapLoaded, onMarkerClick]);

  // ── Flight Mode: Add flight path and markers ───────────────────────────────
  useEffect(() => {
    if (!map.current || !mapLoaded || mode !== 'flight') return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add flight markers
    flightMarkers.forEach(marker => {
      const mapboxMarker = createAirportMarker(marker, (m) => console.log('Airport clicked:', m));
      mapboxMarker.addTo(map.current!);
      markersRef.current.push(mapboxMarker);
    });

    // Draw flight path
    if (flightPath && map.current.getSource('flight-path')) {
      // Remove existing source and layer
      if (map.current.getLayer('flight-path-layer')) {
        map.current.removeLayer('flight-path-layer');
      }
      if (map.current.getLayer('flight-path-glow')) {
        map.current.removeLayer('flight-path-glow');
      }
      if (map.current.getSource('flight-path')) {
        map.current.removeSource('flight-path');
      }
    }

    if (flightPath && map.current) {
      // Build coordinates array for the path
      const coordinates: [number, number][] = [[flightPath.origin.longitude, flightPath.origin.latitude]];
      
      // Add stopovers
      if (flightPath.stopovers) {
        flightPath.stopovers.forEach(stop => {
          coordinates.push([stop.longitude, stop.latitude]);
        });
      }
      
      coordinates.push([flightPath.destination.longitude, flightPath.destination.latitude]);

      // Add source
      map.current.addSource('flight-path', {
        type: 'geojson',
        data: {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates,
          },
        },
      });

      // Add glow layer (behind the main line)
      map.current.addLayer({
        id: 'flight-path-glow',
        type: 'line',
        source: 'flight-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': MARKER_COLORS.flight,
          'line-width': 8,
          'line-opacity': 0.3,
        },
      });

      // Add main line layer
      map.current.addLayer({
        id: 'flight-path-layer',
        type: 'line',
        source: 'flight-path',
        layout: {
          'line-join': 'round',
          'line-cap': 'round',
        },
        paint: {
          'line-color': MARKER_COLORS.flight,
          'line-width': 3,
          'line-dasharray': [2, 2],
        },
      });

      // Fit bounds to show entire route
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([flightPath.origin.longitude, flightPath.origin.latitude]);
      bounds.extend([flightPath.destination.longitude, flightPath.destination.latitude]);
      
      if (flightPath.stopovers) {
        flightPath.stopovers.forEach(stop => {
          bounds.extend([stop.longitude, stop.latitude]);
        });
      }
      
      map.current.fitBounds(bounds, { padding: 100, maxZoom: 8 });
    }

    // Cleanup flight path on unmount
    return () => {
      if (map.current) {
        if (map.current.getLayer('flight-path-layer')) {
          map.current.removeLayer('flight-path-layer');
        }
        if (map.current.getLayer('flight-path-glow')) {
          map.current.removeLayer('flight-path-glow');
        }
        if (map.current.getSource('flight-path')) {
          map.current.removeSource('flight-path');
        }
      }
    };
  }, [flightPath, flightMarkers, mode, mapLoaded]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 rounded-2xl ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-gray-500 font-bold">{error}</p>
          <p className="text-gray-400 text-sm mt-2">Please check your internet connection</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden shadow-xl ${className}`}
      style={{ height }}
    >
      {/* Map container */}
      <div 
        ref={mapContainer} 
        className="absolute inset-0"
        style={{ width: '100%', height: '100%' }}
      />
      
      {/* Loading overlay */}
      {!mapLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#6366F1] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 font-bold text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Mapbox attribution (required by Mapbox ToS) */}
      <div className="absolute bottom-1 left-1 text-[10px] text-gray-500 bg-white/80 px-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}

// ── Utility Functions ────────────────────────────────────────────────────────

/**
 * Calculate the center point between multiple coordinates
 */
export function calculateCenter(coordinates: MapCoordinates[]): MapCoordinates {
  if (coordinates.length === 0) {
    return { longitude: DEFAULT_MAP_CONFIG.center[0], latitude: DEFAULT_MAP_CONFIG.center[1] };
  }
  
  const sum = coordinates.reduce(
    (acc, coord) => ({
      longitude: acc.longitude + coord.longitude,
      latitude: acc.latitude + coord.latitude,
    }),
    { longitude: 0, latitude: 0 }
  );
  
  return {
    longitude: sum.longitude / coordinates.length,
    latitude: sum.latitude / coordinates.length,
  };
}

/**
 * Calculate zoom level based on distance between points
 */
export function calculateZoom(coordinates: MapCoordinates[]): number {
  if (coordinates.length < 2) return 12;
  
  // Simple heuristic: more spread out points = lower zoom
  const center = calculateCenter(coordinates);
  const maxDistance = Math.max(
    ...coordinates.map(coord => 
      Math.sqrt(
        Math.pow(coord.longitude - center.longitude, 2) +
        Math.pow(coord.latitude - center.latitude, 2)
      )
    )
  );
  
  if (maxDistance > 50) return 3;
  if (maxDistance > 20) return 5;
  if (maxDistance > 10) return 7;
  if (maxDistance > 5) return 9;
  if (maxDistance > 1) return 11;
  return 13;
}

export default MapboxMap;
