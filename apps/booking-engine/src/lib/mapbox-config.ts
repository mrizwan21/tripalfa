/**
 * Mapbox Configuration
 * ====================
 * Centralized configuration for Mapbox GL JS integration.
 * Used by both hotel and flight map components.
 * 
 * Set MAPBOX_ACCESS_TOKEN environment variable or NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN
 */

import { COLORS } from "./constants/theme";

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
