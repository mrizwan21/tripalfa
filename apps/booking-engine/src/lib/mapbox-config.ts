/**
 * Mapbox Configuration
 * ====================
 * Centralized configuration for Mapbox GL JS integration.
 * Used by both hotel and flight map components.
 * 
 * Set MAPBOX_ACCESS_TOKEN environment variable or NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
 */

// Mapbox access token - must be set via environment variable
export const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN || process.env.MAPBOX_ACCESS_TOKEN;

// Mapbox style URLs
export const MAPBOX_STYLES = {
  streets: "mapbox://styles/mapbox/streets-v12",
  satellite: "mapbox://styles/mapbox/satellite-streets-v12",
  dark: "mapbox://styles/mapbox/dark-v11",
  light: "mapbox://styles/mapbox/light-v11",
  outdoors: "mapbox://styles/mapbox/outdoors-v12",
} as const;

// ── Types ─────────────────────────────────────────────────────────────────────

export interface MapCoordinates {
  longitude: number;
  latitude: number;
}

export interface HotelMapMarker {
  id: string;
  name: string;
  longitude: number;
  latitude: number;
  price?: number;
  rating?: number;
}

export interface FlightMapMarker {
  id: string;
  code: string;
  city: string;
  type: "origin" | "destination" | "stopover";
  longitude: number;
  latitude: number;
}

export interface FlightPath {
  origin: MapCoordinates;
  destination: MapCoordinates;
  stopovers?: MapCoordinates[];
  airline?: string;
}

// ── Marker Colors ──────────────────────────────────────────────────────────────

export const MARKER_COLORS = {
  origin: "#3b82f6",     // Blue for origin airport
  destination: "#10b981", // Green for destination airport
  stopover: "#f59e0b",    // Amber for stopover
  hotel: "#6366f1",       // Indigo for hotel markers
  flight: "#6366f1",      // Indigo for flight path
  selected: "#ec4899",    // Pink for selected markers
} as const;

// ── Default Map Configuration ──────────────────────────────────────────────────

export const DEFAULT_MAP_CONFIG = {
  center: [55.2708, 25.2048] as [number, number], // Dubai, UAE
  zoom: 10,
  minZoom: 2,
  maxZoom: 18,
  pitch: 0,
  bearing: 0,
} as const;
