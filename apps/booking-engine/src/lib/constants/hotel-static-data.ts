/**
 * Hotel Static Data Constants
 *
 * Fallback data used when static-data-service is unavailable.
 * Imports base data from @tripalfa/static-data/frontend and augments
 * with app-specific data (AMENITY_ICONS, etc.).
 *
 * Primary source: PostgreSQL static-data-service running locally on port 3002
 * Frontend fetches directly from /static/* endpoint (no API manager routing)
 *
 * @see docs/operations/DATABASE_POLICY.md
 */

import {
  HOTEL_STATIC_DATA as BASE_HOTEL_STATIC_DATA,
  searchHotelDestinations as baseSearchDestinations,
} from '@tripalfa/static-data/frontend';

// Re-export searchHotelDestinations from the shared package
export const searchHotelDestinations = baseSearchDestinations;

// ============================================================================
// APP-SPECIFIC EXTENSIONS
// ============================================================================

// Amenity icon mapping (app-specific, not in shared package)
const AMENITY_ICONS: Record<string, string> = {
  WIFI: 'wifi',
  PARKING: 'car',
  POOL: 'waves',
  GYM: 'dumbbell',
  SPA: 'sparkles',
  RESTAURANT: 'utensils',
  AC: 'wind',
  BAR: 'wine',
  ROOM_SERVICE: 'bell',
  CONCIERGE: 'concierge',
  LAUNDRY: 'shirt',
  SHUTTLE: 'bus',
  BUSINESS_CENTER: 'briefcase',
  MEETING_ROOMS: 'users',
  KIDS_CLUB: 'baby',
  BEACH_ACCESS: 'umbrella',
};

// ============================================================================
// AGGREGATED HOTEL STATIC DATA
// ============================================================================

export const HOTEL_STATIC_DATA = {
  ...BASE_HOTEL_STATIC_DATA,
  AMENITY_ICONS,
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get amenity by code
 */
function getAmenityByCode(code: string) {
  return BASE_HOTEL_STATIC_DATA.AMENITIES.all.find((a) => a.code === code);
}

/**
 * Get board type by code
 */
function getBoardTypeByCode(code: string) {
  return BASE_HOTEL_STATIC_DATA.BOARD_TYPES.all.find((b) => b.code === code);
}

/**
 * Get popular amenities (for quick filters)
 */
function getPopularAmenities() {
  return BASE_HOTEL_STATIC_DATA.AMENITIES.all.filter((a) => a.is_popular);
}
