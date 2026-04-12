/**
 * Map Components Index
 * ====================
 * Export all map-related components and utilities.
 */

// Main map component
export { MapboxMap, calculateCenter, calculateZoom } from './MapboxMap';

// Hotel-specific map
export { HotelMap } from './HotelMap';

// Flight-specific map
export { FlightMap } from './FlightMap';

// Animated flight map (loading/search state)
export { AnimatedFlightMap } from './AnimatedFlightMap';

// Animated hotel map (loading/search state)
export { default as AnimatedHotelMap } from './AnimatedHotelMap';

// Re-export types and config
export {
  MAPBOX_TOKEN,
  MAPBOX_STYLES,
  DEFAULT_MAP_CONFIG,
  MARKER_COLORS,
  type MapCoordinates,
  type HotelMapMarker,
  type FlightMapMarker,
  type FlightPath,
} from '../../lib/mapbox-config';
