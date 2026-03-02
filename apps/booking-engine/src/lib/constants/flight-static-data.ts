/**
 * Flight Static Data Constants
 *
 * Fallback data used when static-data-service is unavailable.
 * Primary source: PostgreSQL static-data-service running in Docker container
 * Frontend fetches directly from /static/* endpoint (no API manager routing)
 */

// ============================================================================
// CABIN CLASSES WITH RBDs (Reservation Booking Designators)
// ============================================================================
// RBDs are IATA standard fare class codes used by airlines
// Each cabin can have multiple RBDs representing different fare buckets

export interface CabinClass {
  code: string;
  name: string;
  description: string;
  rbds: string[]; // Reservation Booking Designators
}

export const CABINS: CabinClass[] = [
  {
    code: "ECONOMY",
    name: "Economy",
    description: "Standard economy class",
    rbds: ["Y", "B", "H", "K", "M", "L", "V", "N", "S", "Q", "O", "G"],
  },
  {
    code: "PREMIUM_ECONOMY",
    name: "Premium Economy",
    description: "Enhanced economy with more legroom",
    rbds: ["W", "P", "R"],
  },
  {
    code: "BUSINESS",
    name: "Business",
    description: "Business class with lie-flat seats",
    rbds: ["J", "C", "D", "I", "Z"],
  },
  {
    code: "FIRST",
    name: "First Class",
    description: "Premium first class experience",
    rbds: ["F", "A"],
  },
];

// ============================================================================
// BAGGAGE ALLOWANCE TYPES
// ============================================================================

export const BAGGAGE_TYPES = [
  { code: "CHECKED", name: "Checked Baggage", description: "Checked luggage" },
  { code: "CABIN", name: "Cabin Baggage", description: "Carry-on baggage" },
  {
    code: "PERSONAL",
    name: "Personal Item",
    description: "Personal item (purse, laptop)",
  },
];

// ============================================================================
// FLIGHT AMENITIES
// ============================================================================

export const FLIGHT_AMENITIES = [
  { code: "WIFI", name: "WiFi", category: "Technology" },
  {
    code: "ENTERTAINMENT",
    name: "In-Flight Entertainment",
    category: "Entertainment",
  },
  { code: "MEAL", name: "Complimentary Meals", category: "Food" },
  { code: "POWER", name: "Power Outlets", category: "Technology" },
  { code: "LIQUOR", name: "Complimentary Drinks", category: "Food" },
  { code: "LOUNGE", name: "Airport Lounge Access", category: "Service" },
  { code: "PRIORITY_BOARDING", name: "Priority Boarding", category: "Service" },
  { code: "EXTRA_LEGROOM", name: "Extra Legroom", category: "Comfort" },
];

// ============================================================================
// AGGREGATED FLIGHT STATIC DATA
// ============================================================================

export const FLIGHT_STATIC_DATA = {
  CABINS: {
    all: CABINS,
  },
  BAGGAGE_TYPES: {
    all: BAGGAGE_TYPES,
  },
  AMENITIES: {
    all: FLIGHT_AMENITIES,
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get cabin by code
 */
export function getCabinByCode(code: string) {
  return CABINS.find((c) => c.code === code);
}

/**
 * Get baggage type by code
 */
export function getBaggageTypeByCode(code: string) {
  return BAGGAGE_TYPES.find((b) => b.code === code);
}
