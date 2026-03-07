/**
 * Hotel Static Data Constants
 *
 * Fallback data used when static-data-service is unavailable.
 * Primary source: PostgreSQL static-data-service running locally on port 3002
 * Frontend fetches directly from /static/* endpoint (no API manager routing)
 *
 * @see docs/migrations/STATIC_DATA_MIGRATION.md
 */

// ============================================================================
// AMENITIES
// ============================================================================

export const HOTEL_AMENITIES = [
  { code: "WIFI", name: "Free WiFi", category: "General", is_popular: true },
  { code: "PARKING", name: "Parking", category: "General", is_popular: true },
  {
    code: "POOL",
    name: "Swimming Pool",
    category: "Recreation",
    is_popular: true,
  },
  {
    code: "GYM",
    name: "Fitness Center",
    category: "Recreation",
    is_popular: true,
  },
  { code: "SPA", name: "Spa", category: "Wellness", is_popular: true },
  {
    code: "RESTAURANT",
    name: "Restaurant",
    category: "Dining",
    is_popular: true,
  },
  { code: "AC", name: "Air Conditioning", category: "Room", is_popular: true },
  { code: "BAR", name: "Bar/Lounge", category: "Dining", is_popular: false },
  {
    code: "ROOM_SERVICE",
    name: "Room Service",
    category: "Dining",
    is_popular: false,
  },
  {
    code: "CONCIERGE",
    name: "Concierge",
    category: "Service",
    is_popular: false,
  },
  {
    code: "LAUNDRY",
    name: "Laundry Service",
    category: "Service",
    is_popular: false,
  },
  {
    code: "SHUTTLE",
    name: "Airport Shuttle",
    category: "Transport",
    is_popular: false,
  },
  {
    code: "BUSINESS_CENTER",
    name: "Business Center",
    category: "Business",
    is_popular: false,
  },
  {
    code: "MEETING_ROOMS",
    name: "Meeting Rooms",
    category: "Business",
    is_popular: false,
  },
  {
    code: "KIDS_CLUB",
    name: "Kids Club",
    category: "Family",
    is_popular: false,
  },
  {
    code: "BEACH_ACCESS",
    name: "Beach Access",
    category: "Recreation",
    is_popular: false,
  },
];

// ============================================================================
// BOARD TYPES
// ============================================================================

export const BOARD_TYPES = [
  { code: "RO", name: "Room Only", description: "No meals included" },
  { code: "BB", name: "Bed & Breakfast", description: "Breakfast included" },
  {
    code: "HB",
    name: "Half Board",
    description: "Breakfast and dinner included",
  },
  { code: "FB", name: "Full Board", description: "All meals included" },
  {
    code: "AI",
    name: "All Inclusive",
    description: "All meals, drinks, and activities included",
  },
  {
    code: "UAI",
    name: "Ultra All Inclusive",
    description: "Premium all-inclusive with branded drinks and extras",
  },
];

// ============================================================================
// HOTEL TYPES
// ============================================================================

export const HOTEL_TYPES = [
  { code: "HOTEL", name: "Hotel", description: "Traditional hotel property" },
  {
    code: "RESORT",
    name: "Resort",
    description: "Full-service resort property",
  },
  {
    code: "APARTMENT",
    name: "Apartment",
    description: "Self-catering apartment",
  },
  { code: "VILLA", name: "Villa", description: "Private villa accommodation" },
  {
    code: "HOSTEL",
    name: "Hostel",
    description: "Budget shared accommodation",
  },
  {
    code: "BOUTIQUE",
    name: "Boutique Hotel",
    description: "Small stylish hotel",
  },
  {
    code: "B&B",
    name: "Bed & Breakfast",
    description: "Small lodging with breakfast",
  },
  {
    code: "GUESTHOUSE",
    name: "Guesthouse",
    description: "Private home offering lodging",
  },
];

// ============================================================================
// HOTEL CHAINS
// ============================================================================

export const HOTEL_CHAINS = [
  { code: "MARRIOTT", name: "Marriott International" },
  { code: "HILTON", name: "Hilton Worldwide" },
  { code: "IHG", name: "InterContinental Hotels Group" },
  { code: "ACCOR", name: "Accor Hotels" },
  { code: "WYNDHAM", name: "Wyndham Hotels & Resorts" },
  { code: "HYATT", name: "Hyatt Hotels Corporation" },
  { code: "CHOICE", name: "Choice Hotels International" },
  { code: "BEST_WESTERN", name: "Best Western International" },
  { code: "RADISSON", name: "Radisson Hotel Group" },
  { code: "MELIA", name: "Meliá Hotels International" },
];

// ============================================================================
// STAR RATINGS
// ============================================================================

export const STAR_RATINGS = [
  { value: 1, label: "1 Star", icon: "★" },
  { value: 2, label: "2 Stars", icon: "★★" },
  { value: 3, label: "3 Stars", icon: "★★★" },
  { value: 4, label: "4 Stars", icon: "★★★★" },
  { value: 5, label: "5 Stars", icon: "★★★★★" },
];

// ============================================================================
// ROOM TYPES
// ============================================================================

export const ROOM_TYPES = [
  { code: "SINGLE", name: "Single Room", description: "Room for 1 person" },
  {
    code: "DOUBLE",
    name: "Double Room",
    description: "Room for 2 people with 1 bed",
  },
  {
    code: "TWIN",
    name: "Twin Room",
    description: "Room for 2 people with 2 beds",
  },
  { code: "TRIPLE", name: "Triple Room", description: "Room for 3 people" },
  {
    code: "SUITE",
    name: "Suite",
    description: "Premium multi-room accommodation",
  },
  { code: "FAMILY", name: "Family Room", description: "Room for 4+ people" },
  {
    code: "STUDIO",
    name: "Studio",
    description: "Open-plan room with kitchenette",
  },
  { code: "DUPLEX", name: "Duplex", description: "Two-level accommodation" },
];

// ============================================================================
// VIEW TYPES
// ============================================================================

export const VIEW_TYPES = [
  { code: "SEA", name: "Sea View" },
  { code: "OCEAN", name: "Ocean View" },
  { code: "CITY", name: "City View" },
  { code: "POOL", name: "Pool View" },
  { code: "GARDEN", name: "Garden View" },
  { code: "MOUNTAIN", name: "Mountain View" },
  { code: "LAKE", name: "Lake View" },
  { code: "RIVER", name: "River View" },
];

// ============================================================================
// PAYMENT TYPES
// ============================================================================

export const PAYMENT_TYPES = [
  { code: "CREDIT_CARD", name: "Credit Card" },
  { code: "DEBIT_CARD", name: "Debit Card" },
  { code: "WALLET", name: "Digital Wallet" },
  { code: "BANK_TRANSFER", name: "Bank Transfer" },
  { code: "CASH", name: "Cash at Hotel" },
];

// ============================================================================
// POPULAR DESTINATIONS
// ============================================================================

export const POPULAR_DESTINATIONS = [
  {
    id: "1",
    name: "Dubai",
    countryName: "United Arab Emirates",
    countryCode: "AE",
    hotelCount: 850,
  },
  {
    id: "2",
    name: "Abu Dhabi",
    countryName: "United Arab Emirates",
    countryCode: "AE",
    hotelCount: 420,
  },
  {
    id: "3",
    name: "Riyadh",
    countryName: "Saudi Arabia",
    countryCode: "SA",
    hotelCount: 580,
  },
  {
    id: "4",
    name: "Jeddah",
    countryName: "Saudi Arabia",
    countryCode: "SA",
    hotelCount: 340,
  },
  {
    id: "5",
    name: "Doha",
    countryName: "Qatar",
    countryCode: "QA",
    hotelCount: 290,
  },
  {
    id: "6",
    name: "London",
    countryName: "United Kingdom",
    countryCode: "GB",
    hotelCount: 1200,
  },
  {
    id: "7",
    name: "Paris",
    countryName: "France",
    countryCode: "FR",
    hotelCount: 950,
  },
  {
    id: "8",
    name: "New York",
    countryName: "United States",
    countryCode: "US",
    hotelCount: 780,
  },
  {
    id: "9",
    name: "Singapore",
    countryName: "Singapore",
    countryCode: "SG",
    hotelCount: 420,
  },
  {
    id: "10",
    name: "Tokyo",
    countryName: "Japan",
    countryCode: "JP",
    hotelCount: 650,
  },
];

// ============================================================================
// AGGREGATED HOTEL STATIC DATA
// ============================================================================

export const HOTEL_STATIC_DATA = {
  AMENITIES: {
    all: HOTEL_AMENITIES,
  },
  BOARD_TYPES: {
    all: BOARD_TYPES,
  },
  TYPES: {
    all: HOTEL_TYPES,
  },
  CHAINS: {
    all: HOTEL_CHAINS,
  },
  STAR_RATINGS: {
    all: STAR_RATINGS,
  },
  ROOM_TYPES: {
    all: ROOM_TYPES,
  },
  VIEW_TYPES: {
    all: VIEW_TYPES,
  },
  PAYMENT_TYPES: {
    all: PAYMENT_TYPES,
  },
  POPULAR_DESTINATIONS,
  AMENITY_ICONS: {
    WIFI: "wifi",
    PARKING: "car",
    POOL: "waves",
    GYM: "dumbbell",
    SPA: "sparkles",
    RESTAURANT: "utensils",
    AC: "wind",
    BAR: "wine",
    ROOM_SERVICE: "bell",
    CONCIERGE: "concierge",
    LAUNDRY: "shirt",
    SHUTTLE: "bus",
    BUSINESS_CENTER: "briefcase",
    MEETING_ROOMS: "users",
    KIDS_CLUB: "baby",
    BEACH_ACCESS: "umbrella",
  },
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Search hotel destinations by query string
 */
export function searchHotelDestinations(query: string) {
  const lowerQuery = query.toLowerCase();
  return POPULAR_DESTINATIONS.filter(
    (dest) =>
      dest.name.toLowerCase().includes(lowerQuery) ||
      dest.countryName.toLowerCase().includes(lowerQuery),
  );
}

/**
 * Get amenity by code
 */
export function getAmenityByCode(code: string) {
  return HOTEL_AMENITIES.find((a) => a.code === code);
}

/**
 * Get board type by code
 */
export function getBoardTypeByCode(code: string) {
  return BOARD_TYPES.find((b) => b.code === code);
}

/**
 * Get popular amenities (for quick filters)
 */
export function getPopularAmenities() {
  return HOTEL_AMENITIES.filter((a) => a.is_popular);
}
