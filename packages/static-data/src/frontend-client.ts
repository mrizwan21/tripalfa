export type NamedCode = {
  code: string;
  name: string;
  is_popular?: boolean;
};

export type NamedId = {
  id: string;
  name: string;
  is_popular?: boolean;
};

export type Destination = {
  id: string;
  name: string;
  country: string;
  city: string;
  code: string;
  isPopular?: boolean;
};

// API base URL - can be configured via environment or defaults to localhost:3022
const STATIC_API_URL = 
  (typeof process !== 'undefined' && process.env?.VITE_STATIC_API_URL) ||
  (typeof process !== 'undefined' && process.env?.STATIC_API_URL) ||
  'http://localhost:3022';

// Cached data (starts with hardcoded fallbacks)
let AMENITIES: NamedCode[] = [
  { code: "WIFI", name: "Wi-Fi", is_popular: true },
  { code: "POOL", name: "Swimming Pool", is_popular: true },
  { code: "GYM", name: "Gym", is_popular: true },
  { code: "PARKING", name: "Parking" },
  { code: "SPA", name: "Spa" },
  { code: "RESTAURANT", name: "Restaurant", is_popular: true },
  { code: "BAR", name: "Bar" },
  { code: "ROOM_SERVICE", name: "Room Service" }
];

let BOARD_TYPES: NamedCode[] = [
  { code: "RO", name: "Room Only" },
  { code: "BB", name: "Bed & Breakfast", is_popular: true },
  { code: "HB", name: "Half Board", is_popular: true },
  { code: "FB", name: "Full Board" },
  { code: "AI", name: "All Inclusive" }
];

let TYPES: NamedCode[] = [
  { code: "HOTEL", name: "Hotel", is_popular: true },
  { code: "RESORT", name: "Resort", is_popular: true },
  { code: "APARTMENT", name: "Apartment" },
  { code: "VILLA", name: "Villa" }
];

let CHAINS: NamedCode[] = [
  { code: "MARRIOTT", name: "Marriott" },
  { code: "HILTON", name: "Hilton" },
  { code: "IHG", name: "IHG" },
  { code: "HYATT", name: "Hyatt" }
];

let STAR_RATINGS: NamedId[] = [
  { id: "3", name: "3 Star" },
  { id: "4", name: "4 Star", is_popular: true },
  { id: "5", name: "5 Star", is_popular: true }
];

let ROOM_TYPES: NamedCode[] = [
  { code: "STD", name: "Standard Room", is_popular: true },
  { code: "DLX", name: "Deluxe Room", is_popular: true },
  { code: "STE", name: "Suite" },
  { code: "FAM", name: "Family Room" }
];

let VIEW_TYPES: NamedCode[] = [
  { code: "CITY", name: "City View" },
  { code: "SEA", name: "Sea View", is_popular: true },
  { code: "POOL", name: "Pool View" },
  { code: "GARDEN", name: "Garden View" }
];

let PAYMENT_TYPES: NamedCode[] = [
  { code: "PREPAID", name: "Prepaid", is_popular: true },
  { code: "PAY_AT_HOTEL", name: "Pay at Hotel", is_popular: true }
];

let POPULAR_DESTINATIONS: Destination[] = [
  { id: "DXB", name: "Dubai", country: "UAE", city: "Dubai", code: "DXB", isPopular: true },
  { id: "AUH", name: "Abu Dhabi", country: "UAE", city: "Abu Dhabi", code: "AUH", isPopular: true },
  { id: "DOH", name: "Doha", country: "Qatar", city: "Doha", code: "DOH", isPopular: true },
  { id: "BAH", name: "Bahrain", country: "Bahrain", city: "Manama", code: "BAH", isPopular: true }
];

let initialized = false;

// Fetch wrapper with fallback
async function fetchWithFallback(url: string, fallback: any[]) {
  try {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const result = await response.json();
    return result.success ? result.data : fallback;
  } catch (err) {
    console.warn(`Failed to fetch from ${url}, using fallback:`, err);
    return fallback;
  }
}

// Initialize function - call this at app startup
export async function initStaticData() {
  if (initialized) return;
  
  try {
    const [
      amenities,
      boardTypes,
      types,
      chains,
      starRatings,
      roomTypes,
      viewTypes,
      paymentTypes,
      destinations
    ] = await Promise.all([
      fetchWithFallback(`${STATIC_API_URL}/amenities`, AMENITIES),
      fetchWithFallback(`${STATIC_API_URL}/board-types`, BOARD_TYPES),
      fetchWithFallback(`${STATIC_API_URL}/hotel-types`, TYPES),
      fetchWithFallback(`${STATIC_API_URL}/chains`, CHAINS),
      fetchWithFallback(`${STATIC_API_URL}/star-ratings`, STAR_RATINGS),
      fetchWithFallback(`${STATIC_API_URL}/room-types`, ROOM_TYPES),
      fetchWithFallback(`${STATIC_API_URL}/view-types`, VIEW_TYPES),
      fetchWithFallback(`${STATIC_API_URL}/payment-types`, PAYMENT_TYPES),
      fetchWithFallback(`${STATIC_API_URL}/destinations`, POPULAR_DESTINATIONS)
    ]);

    AMENITIES = amenities;
    BOARD_TYPES = boardTypes;
    TYPES = types;
    CHAINS = chains;
    STAR_RATINGS = starRatings;
    ROOM_TYPES = roomTypes;
    VIEW_TYPES = viewTypes;
    PAYMENT_TYPES = paymentTypes;
    POPULAR_DESTINATIONS = destinations;
    
    initialized = true;
    console.log('[static-data] Initialized from API');
  } catch (err) {
    console.warn('[static-data] Failed to initialize from API, using fallbacks:', err);
  }
}

// Export HOTEL_STATIC_DATA with synchronous access
export const HOTEL_STATIC_DATA = {
  get AMENITIES() { return { all: AMENITIES } },
  get BOARD_TYPES() { return { all: BOARD_TYPES } },
  get TYPES() { return { all: TYPES } },
  get CHAINS() { return { all: CHAINS } },
  get STAR_RATINGS() { return { all: STAR_RATINGS } },
  get ROOM_TYPES() { return { all: ROOM_TYPES } },
  get VIEW_TYPES() { return { all: VIEW_TYPES } },
  get PAYMENT_TYPES() { return { all: PAYMENT_TYPES } },
  get POPULAR_DESTINATIONS() { return POPULAR_DESTINATIONS }
};

// Search destinations
export async function searchHotelDestinations(query: string): Promise<Destination[]> {
  const q = query.trim().toLowerCase();
  if (!q) return POPULAR_DESTINATIONS.slice(0, 10);
  return POPULAR_DESTINATIONS.filter((item: Destination) => {
    return (
      item.name.toLowerCase().includes(q) ||
      item.city.toLowerCase().includes(q) ||
      item.country.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q)
    );
  });
}
