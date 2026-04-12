/**
 * Flight Map Component
 * ====================
 * A specialized map component for displaying flight routes.
 * Uses Mapbox GL JS for interactive maps with flight paths.
 * cspell:ignore Mapbox
 */

import React from "react";
import { Plane, Clock, Navigation } from "lucide-react";
import { MapboxMap } from "./MapboxMap";
import {
  FlightMapMarker,
  FlightPath,
  MapCoordinates,
  MARKER_COLORS,
} from "../../lib/mapbox-config";

// ── Types ─────────────────────────────────────────────────────────────────────

interface FlightSegment {
  from: string; // IATA code
  to: string; // IATA code
  depart?: string;
  arrive?: string;
  airline?: string;
  flightNumber?: string;
  duration?: number;
}

interface FlightMapProps {
  // Flight segments
  segments?: FlightSegment[];

  // Airport coordinates (looked up from DB or API)
  airports?: Record<
    string,
    {
      code: string;
      name: string;
      city: string;
      country?: string;
      latitude: number;
      longitude: number;
    }
  >;

  // Or provide pre-built flight path
  flightPath?: FlightPath;
  flightMarkers?: FlightMapMarker[];

  // Map configuration
  height?: string;
  className?: string;

  // UI options
  showFlightInfo?: boolean;
  animated?: boolean;
}

// ── Helper Functions ─────────────────────────────────────────────────────────

/**
 * Convert flight segments to map data
 */
function segmentsToMapData(
  segments: FlightSegment[],
  airports: Record<
    string,
    {
      code: string;
      name: string;
      city: string;
      latitude: number;
      longitude: number;
    }
  >,
): { path: FlightPath; markers: FlightMapMarker[] } {
  if (segments.length === 0) {
    // Return default (empty)
    return {
      path: {
        origin: { longitude: 0, latitude: 0 },
        destination: { longitude: 0, latitude: 0 },
      },
      markers: [],
    };
  }

  const markers: FlightMapMarker[] = [];
  const stopovers: MapCoordinates[] = [];

  // Process each segment
  segments.forEach((segment, index) => {
    const originAirport = airports[segment.from];
    const destAirport = airports[segment.to];

    // Add origin marker (only for first segment)
    if (index === 0 && originAirport) {
      markers.push({
        id: `origin-${segment.from}`,
        code: segment.from,
        name: originAirport.name,
        city: originAirport.city,
        latitude: originAirport.latitude,
        longitude: originAirport.longitude,
        type: "origin",
      });
    }

    // Add stopover markers (for connecting flights)
    if (index > 0 && originAirport) {
      markers.push({
        id: `stopover-${segment.from}`,
        code: segment.from,
        name: originAirport.name,
        city: originAirport.city,
        latitude: originAirport.latitude,
        longitude: originAirport.longitude,
        type: "stopover",
      });
      stopovers.push({
        latitude: originAirport.latitude,
        longitude: originAirport.longitude,
      });
    }

    // Add destination marker (only for last segment)
    if (index === segments.length - 1 && destAirport) {
      markers.push({
        id: `destination-${segment.to}`,
        code: segment.to,
        name: destAirport.name,
        city: destAirport.city,
        latitude: destAirport.latitude,
        longitude: destAirport.longitude,
        type: "destination",
      });
    }

    // Add intermediate destinations as stopovers
    if (index < segments.length - 1 && destAirport) {
      stopovers.push({
        latitude: destAirport.latitude,
        longitude: destAirport.longitude,
      });
    }
  });

  // Build flight path
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const originAirport = airports[firstSegment.from];
  const destAirport = airports[lastSegment.to];

  const path: FlightPath = {
    origin: originAirport
      ? { longitude: originAirport.longitude, latitude: originAirport.latitude }
      : { longitude: 0, latitude: 0 },
    destination: destAirport
      ? { longitude: destAirport.longitude, latitude: destAirport.latitude }
      : { longitude: 0, latitude: 0 },
    stopovers: stopovers.length > 0 ? stopovers : undefined,
  };

  return { path, markers };
}

/**
 * Format duration in hours and minutes
 */
function formatDuration(minutes?: number): string {
  if (!minutes) return "";
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
}

// ── Flight Info Card ─────────────────────────────────────────────────────────

function FlightInfoCard({
  segments,
  airports,
}: {
  segments: FlightSegment[];
  airports: Record<
    string,
    {
      code: string;
      name: string;
      city: string;
      latitude: number;
      longitude: number;
    }
  >;
}) {
  if (segments.length === 0) return null;

  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];
  const totalDuration = segments.reduce((sum, s) => sum + (s.duration || 0), 0);

  return (
    <div className="absolute top-6 left-6 bg-white rounded-2xl shadow-2xl p-4 z-10 border border-gray-100">
      <div className="flex items-center gap-4">
        {/* Origin */}
        <div className="text-center">
          <p className="text-2xl font-black text-gray-900">
            {firstSegment.from}
          </p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {airports[firstSegment.from]?.city || "Origin"}
          </p>
        </div>

        {/* Flight path indicator */}
        <div className="flex items-center gap-2 px-4">
          <div className="w-2 h-2 rounded-full bg-green-500" />
          <div className="w-20 h-0.5 bg-gradient-to-r from-green-500 via-purple-500 to-red-500 relative">
            <Plane
              size={16}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-primary rotate-90"
            />
          </div>
          <div className="w-2 h-2 rounded-full bg-red-500" />
        </div>

        {/* Destination */}
        <div className="text-center">
          <p className="text-2xl font-black text-gray-900">{lastSegment.to}</p>
          <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
            {airports[lastSegment.to]?.city || "Destination"}
          </p>
        </div>
      </div>

      {/* Flight details */}
      <div className="flex items-center justify-center gap-6 mt-3 pt-3 border-t border-gray-100">
        {totalDuration > 0 && (
          <div className="flex items-center gap-2 text-xs text-gray-500">
            <Clock size={12} />
            <span className="font-bold">{formatDuration(totalDuration)}</span>
          </div>
        )}
        {segments.length > 1 && (
          <span className="text-xs font-bold text-amber-600 bg-amber-50 px-2 py-1 rounded-full">
            {segments.length - 1} Stop{segments.length > 2 ? "s" : ""}
          </span>
        )}
        {segments.length === 1 && (
          <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-full">
            Direct
          </span>
        )}
      </div>
    </div>
  );
}

// ── Main Component ───────────────────────────────────────────────────────────

export function FlightMap({
  segments,
  airports = {},
  flightPath,
  flightMarkers,
  height = "400px",
  className = "",
  showFlightInfo = true,
  animated = true,
}: FlightMapProps): React.JSX.Element {
  // Get flight path and markers
  let path: FlightPath | undefined = flightPath;
  let markers: FlightMapMarker[] = flightMarkers || [];

  // Build from segments if provided
  if (segments && segments.length > 0 && Object.keys(airports).length > 0) {
    const mapData = segmentsToMapData(segments, airports);
    path = mapData.path;
    markers = mapData.markers;
  }

  // No flight data
  if (!path || markers.length === 0) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 rounded-2xl ${className}`}
        style={{ height }}
      >
        <div className="text-center p-8">
          <Plane className="mx-auto text-gray-300 mb-4" size={48} />
          <p className="text-gray-500 font-bold">Flight route not available</p>
          <p className="text-gray-400 text-sm mt-2">
            Airport coordinates not provided
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <MapboxMap
        mode="flight"
        flightPath={path}
        flightMarkers={markers}
        height={height}
        showControls={true}
        interactive={true}
      />

      {/* Flight info card */}
      {showFlightInfo && segments && segments.length > 0 && (
        <FlightInfoCard segments={segments} airports={airports} />
      )}

      {/* Legend */}
      <div className="absolute bottom-6 right-6 bg-white rounded-xl shadow-lg p-3 z-10 border border-gray-100">
        <div className="flex items-center gap-4 text-[10px] font-bold">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-gray-600">Origin</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <span className="text-gray-600">Destination</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-500" />
            <span className="text-gray-600">Stopover</span>
          </div>
        </div>
      </div>
    </div>
  );
}
