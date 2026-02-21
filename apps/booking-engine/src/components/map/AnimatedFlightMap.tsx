/**
 * Animated Flight Map Component
 * =============================
 * A map component that shows an animated plane flying from origin to destination.
 * Used during flight search loading state.
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  MARKER_COLORS,
  MapCoordinates,
} from '../../lib/mapbox-config';

// Set Mapbox access token
mapboxgl.accessToken = MAPBOX_TOKEN;

// ── Types ─────────────────────────────────────────────────────────────────────

interface AnimatedFlightMapProps {
  origin: MapCoordinates & { code: string; name: string; city: string };
  destination: MapCoordinates & { code: string; name: string; city: string };
  
  // Animation options
  animationDuration?: number; // in milliseconds
  loopAnimation?: boolean;
  
  // Map options
  className?: string;
  height?: string;
  
  // Callbacks
  onAnimationComplete?: () => void;
}

// ── Plane SVG Icon ────────────────────────────────────────────────────────────

const PLANE_SVG = `
<svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="${MARKER_COLORS.flight}">
  <path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>
</svg>
`;

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Calculate bearing between two points
 */
function calculateBearing(start: MapCoordinates, end: MapCoordinates): number {
  const startLat = (start.latitude * Math.PI) / 180;
  const startLng = (start.longitude * Math.PI) / 180;
  const endLat = (end.latitude * Math.PI) / 180;
  const endLng = (end.longitude * Math.PI) / 180;

  const dLng = endLng - startLng;

  const y = Math.sin(dLng) * Math.cos(endLat);
  const x =
    Math.cos(startLat) * Math.sin(endLat) -
    Math.sin(startLat) * Math.cos(endLat) * Math.cos(dLng);

  let bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

/**
 * Interpolate position between two points
 */
function interpolatePosition(
  start: MapCoordinates,
  end: MapCoordinates,
  progress: number
): MapCoordinates {
  // Simple linear interpolation (for short distances)
  // For longer distances, you'd want to use great circle interpolation
  return {
    latitude: start.latitude + (end.latitude - start.latitude) * progress,
    longitude: start.longitude + (end.longitude - start.longitude) * progress,
  };
}

/**
 * Generate arc points for flight path
 */
function generateArcPoints(
  start: MapCoordinates,
  end: MapCoordinates,
  numPoints: number = 100
): [number, number][] {
  const points: [number, number][] = [];
  
  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    
    // Calculate arc height based on distance
    const distance = Math.sqrt(
      Math.pow(end.longitude - start.longitude, 2) +
      Math.pow(end.latitude - start.latitude, 2)
    );
    const arcHeight = distance * 0.15;
    
    // Parabolic arc
    const arc = Math.sin(t * Math.PI) * arcHeight;
    
    const lat = start.latitude + (end.latitude - start.latitude) * t;
    const lng = start.longitude + (end.longitude - start.longitude) * t + arc;
    
    points.push([lng, lat]);
  }
  
  return points;
}

// ── Main Component ───────────────────────────────────────────────────────────

export function AnimatedFlightMap({
  origin,
  destination,
  animationDuration = 5000,
  loopAnimation = true,
  className = '',
  height = '500px',
  onAnimationComplete,
}: AnimatedFlightMapProps): React.JSX.Element {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const planeMarker = useRef<mapboxgl.Marker | null>(null);
  const animationFrame = useRef<number | null>(null);
  const startTime = useRef<number>(0);
  
  const [mapLoaded, setMapLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    try {
      // Calculate bounds to fit both points
      const bounds = new mapboxgl.LngLatBounds();
      bounds.extend([origin.longitude, origin.latitude]);
      bounds.extend([destination.longitude, destination.latitude]);

      map.current = new mapboxgl.Map({
        container: mapContainer.current,
        style: MAPBOX_STYLES.dark,
        center: [
          (origin.longitude + destination.longitude) / 2,
          (origin.latitude + destination.latitude) / 2,
        ],
        fitBoundsOptions: { padding: 100 },
        interactive: false, // Disable interactions during loading
      });

      // Fit bounds on load
      map.current.on('load', () => {
        setMapLoaded(true);
        map.current?.fitBounds(bounds, { padding: 80, maxZoom: 6 });
      });

      map.current.on('error', (e) => {
        console.error('Mapbox error:', e);
        setError('Failed to load map');
      });

    } catch (err) {
      console.error('Failed to initialize map:', err);
      setError('Failed to initialize map');
    }

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
      if (planeMarker.current) {
        planeMarker.current.remove();
      }
      if (map.current) {
        map.current.remove();
        map.current = null;
      }
    };
  }, []);

  // Add markers and flight path
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // ── Add origin marker ───────────────────────────────────────────────────
    const originEl = document.createElement('div');
    originEl.innerHTML = `
      <div style="
        background: ${MARKER_COLORS.origin};
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 12px;
        box-shadow: 0 4px 16px ${MARKER_COLORS.origin}66;
        border: 3px solid white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">
        ${origin.code}
      </div>
    `;
    new mapboxgl.Marker(originEl)
      .setLngLat([origin.longitude, origin.latitude])
      .addTo(map.current);

    // ── Add destination marker ──────────────────────────────────────────────
    const destEl = document.createElement('div');
    destEl.innerHTML = `
      <div style="
        background: ${MARKER_COLORS.destination};
        color: white;
        padding: 12px 16px;
        border-radius: 12px;
        font-weight: 800;
        font-size: 12px;
        box-shadow: 0 4px 16px ${MARKER_COLORS.destination}66;
        border: 3px solid white;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      ">
        ${destination.code}
      </div>
    `;
    new mapboxgl.Marker(destEl)
      .setLngLat([destination.longitude, destination.latitude])
      .addTo(map.current);

    // ── Add flight path (arc) ───────────────────────────────────────────────
    const arcPoints = generateArcPoints(origin, destination, 100);
    
    map.current.addSource('flight-path', {
      type: 'geojson',
      data: {
        type: 'Feature',
        properties: {},
        geometry: {
          type: 'LineString',
          coordinates: arcPoints,
        },
      },
    });

    // Glow layer
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
        'line-width': 6,
        'line-opacity': 0.3,
      },
    });

    // Main line
    map.current.addLayer({
      id: 'flight-path-line',
      type: 'line',
      source: 'flight-path',
      layout: {
        'line-join': 'round',
        'line-cap': 'round',
      },
      paint: {
        'line-color': MARKER_COLORS.flight,
        'line-width': 2,
        'line-dasharray': [2, 2],
      },
    });

    // ── Create plane marker ─────────────────────────────────────────────────
    const planeEl = document.createElement('div');
    planeEl.style.cssText = `
      transform-origin: center;
      transition: transform 0.1s linear;
    `;
    planeEl.innerHTML = PLANE_SVG;
    
    // Calculate initial bearing
    const bearing = calculateBearing(origin, destination);
    planeEl.style.transform = `rotate(${bearing - 45}deg)`;
    
    planeMarker.current = new mapboxgl.Marker(planeEl, {
      anchor: 'center',
    })
      .setLngLat([origin.longitude, origin.latitude])
      .addTo(map.current);

    // ── Start animation ─────────────────────────────────────────────────────
    const animate = (timestamp: number) => {
      if (!startTime.current) {
        startTime.current = timestamp;
      }
      
      const elapsed = timestamp - startTime.current;
      let progress = Math.min(elapsed / animationDuration, 1);
      
      // Ease in-out function for smoother animation
      progress = progress < 0.5
        ? 2 * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 2) / 2;
      
      // Calculate current position on arc
      const arcIndex = Math.floor(progress * (arcPoints.length - 1));
      const currentPoint = arcPoints[arcIndex] || arcPoints[0];
      
      // Update plane position
      if (planeMarker.current) {
        planeMarker.current.setLngLat(currentPoint);
      }
      
      // Continue animation or loop
      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate);
      } else {
        if (loopAnimation) {
          startTime.current = 0;
          animationFrame.current = requestAnimationFrame(animate);
        } else {
          onAnimationComplete?.();
        }
      }
    };
    
    animationFrame.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrame.current) {
        cancelAnimationFrame(animationFrame.current);
      }
    };
  }, [mapLoaded, origin, destination, animationDuration, loopAnimation, onAnimationComplete]);

  // ── Render ───────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-900 rounded-2xl ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <p className="text-gray-400 font-bold">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className={`relative rounded-2xl overflow-hidden ${className}`}
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
        <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
          <div className="text-center">
            <div className="w-10 h-10 border-4 border-[#8B5CF6] border-t-transparent rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-400 font-bold text-sm">Loading map...</p>
          </div>
        </div>
      )}
      
      {/* Route info overlay */}
      <div className="absolute top-6 left-6 bg-gray-900/80 backdrop-blur-md rounded-2xl p-4 z-10 border border-gray-700">
        <div className="flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-black text-white">{origin.code}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{origin.city}</p>
          </div>
          <div className="flex items-center gap-2 px-4">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <div className="w-16 h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-red-500" />
            <div className="w-2 h-2 rounded-full bg-red-500" />
          </div>
          <div className="text-center">
            <p className="text-2xl font-black text-white">{destination.code}</p>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{destination.city}</p>
          </div>
        </div>
      </div>
      
      {/* Mapbox attribution */}
      <div className="absolute bottom-1 left-1 text-[10px] text-gray-500 bg-black/50 px-1 rounded">
        © Mapbox © OpenStreetMap
      </div>
    </div>
  );
}

export default AnimatedFlightMap;
