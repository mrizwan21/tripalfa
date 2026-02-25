/**
 * Frontend-safe static data exports
 * These exports provide static reference data for use in React components.
 * All actual API calls should go through the centralized API manager (api.ts).
 */

// ============================================================================
// FLIGHT STATIC DATA
// ============================================================================

export const FLIGHT_STATIC_DATA = {
  // Cabin classes
  CABINS: {
    all: [
      { code: 'economy', name: 'Economy', description: 'Standard economy class' },
      { code: 'premium_economy', name: 'Premium Economy', description: 'Enhanced economy with extra legroom' },
      { code: 'business', name: 'Business', description: 'Business class with lie-flat seats' },
      { code: 'first', name: 'First Class', description: 'Premium first class experience' },
    ],
  },
  
  // Trip types
  TRIP_TYPES: {
    all: [
      { code: 'roundTrip', name: 'Round Trip', description: 'Return to origin' },
      { code: 'oneWay', name: 'One Way', description: 'Single journey' },
      { code: 'multiCity', name: 'Multi-City', description: 'Multiple destinations' },
    ],
  },
  
  // Passenger types
  PASSENGER_TYPES: {
    all: [
      { code: 'adult', name: 'Adult', description: '12+ years', minAge: 12 },
      { code: 'child', name: 'Child', description: '2-11 years', minAge: 2, maxAge: 11 },
      { code: 'infant', name: 'Infant', description: 'Under 2 years', maxAge: 1 },
    ],
  },
  
  // Popular flight routes
  POPULAR_ROUTES: [
    { origin: 'DXB', destination: 'LHR', name: 'Dubai to London' },
    { origin: 'DXB', destination: 'JFK', name: 'Dubai to New York' },
    { origin: 'LHR', destination: 'DXB', name: 'London to Dubai' },
    { origin: 'JFK', destination: 'LAX', name: 'New York to Los Angeles' },
    { origin: 'SIN', destination: 'HKG', name: 'Singapore to Hong Kong' },
  ],
};

// ============================================================================
// HOTEL STATIC DATA
// ============================================================================

// Hotel Static Data - In-memory fallback data for hotels
export const HOTEL_STATIC_DATA = {
  // Amenity types for hotels
  AMENITIES: {
    all: [
      { code: 'WIFI', name: 'Free WiFi', category: 'General', is_popular: true },
      { code: 'PARKING', name: 'Parking', category: 'General', is_popular: true },
      { code: 'POOL', name: 'Swimming Pool', category: 'Recreation', is_popular: true },
      { code: 'GYM', name: 'Fitness Center', category: 'Recreation', is_popular: true },
      { code: 'SPA', name: 'Spa', category: 'Wellness', is_popular: true },
      { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', is_popular: true },
      { code: 'BAR', name: 'Bar/Lounge', category: 'Dining', is_popular: false },
      { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Dining', is_popular: false },
      { code: 'AC', name: 'Air Conditioning', category: 'Room', is_popular: true },
      { code: 'MINIBAR', name: 'Minibar', category: 'Room', is_popular: false },
      { code: 'SAFE', name: 'In-room Safe', category: 'Room', is_popular: false },
      { code: 'LAUNDRY', name: 'Laundry Service', category: 'Services', is_popular: false },
      { code: 'CONCIERGE', name: 'Concierge', category: 'Services', is_popular: false },
      { code: 'BUSINESS_CENTER', name: 'Business Center', category: 'Business', is_popular: false },
      { code: 'MEETING_ROOMS', name: 'Meeting Rooms', category: 'Business', is_popular: false },
      { code: 'KIDS_CLUB', name: 'Kids Club', category: 'Family', is_popular: false },
      { code: 'BABYSITTING', name: 'Babysitting', category: 'Family', is_popular: false },
      { code: 'BEACH', name: 'Private Beach', category: 'Recreation', is_popular: false },
      { code: 'WATER_SPORTS', name: 'Water Sports', category: 'Recreation', is_popular: false },
      { code: 'TENNIS', name: 'Tennis Court', category: 'Recreation', is_popular: false },
    ],
  },

  // Board types (meal plans)
  BOARD_TYPES: {
    all: [
      { code: 'RO', name: 'Room Only', description: 'No meals included' },
      { code: 'BB', name: 'Bed & Breakfast', description: 'Breakfast included' },
      { code: 'HB', name: 'Half Board', description: 'Breakfast and dinner included' },
      { code: 'FB', name: 'Full Board', description: 'All meals included' },
      { code: 'AI', name: 'All Inclusive', description: 'All meals, drinks, and activities included' },
      { code: 'BBR', name: 'Bed & Breakfast + Refreshments', description: 'Breakfast and select beverages included' },
    ],
  },

  // Hotel property types
  TYPES: {
    all: [
      { code: 'HOTEL', name: 'Hotel', description: 'Traditional hotel property' },
      { code: 'RESORT', name: 'Resort', description: 'Full-service resort property' },
      { code: 'APARTMENT', name: 'Apartment', description: 'Self-catering apartment' },
      { code: 'VILLA', name: 'Villa', description: 'Private villa accommodation' },
      { code: 'HOSTEL', name: 'Hostel', description: 'Budget shared accommodation' },
      { code: 'BOUTIQUE', name: 'Boutique Hotel', description: 'Small luxury hotel' },
      { code: 'BED_BREAKFAST', name: 'Bed & Breakfast', description: 'Small lodging with breakfast' },
      { code: 'GUESTHOUSE', name: 'Guesthouse', description: 'Small lodging property' },
      { code: 'MOTEL', name: 'Motel', description: 'Roadside lodging' },
      { code: 'LODGE', name: 'Lodge', description: 'Nature-focused accommodation' },
    ],
  },

  // Hotel chains
  CHAINS: {
    all: [
      { code: 'MARRIOTT', name: 'Marriott International' },
      { code: 'HILTON', name: 'Hilton Worldwide' },
      { code: 'IHG', name: 'InterContinental Hotels Group' },
      { code: 'WYNDHAM', name: 'Wyndham Hotels & Resorts' },
      { code: 'ACCOR', name: 'Accor' },
      { code: 'CHOICE', name: 'Choice Hotels' },
      { code: 'HYATT', name: 'Hyatt Hotels Corporation' },
      { code: 'BESTWESTERN', name: 'Best Western' },
      { code: 'RADISSON', name: 'Radisson Hotel Group' },
      { code: 'JUMEIRAH', name: 'Jumeirah Group' },
    ],
  },

  // Star ratings
  STAR_RATINGS: {
    all: [
      { value: 1, label: '1 Star', icon: '★' },
      { value: 2, label: '2 Stars', icon: '★★' },
      { value: 3, label: '3 Stars', icon: '★★★' },
      { value: 4, label: '4 Stars', icon: '★★★★' },
      { value: 5, label: '5 Stars', icon: '★★★★★' },
    ],
  },

  // Room types
  ROOM_TYPES: {
    all: [
      { code: 'SINGLE', name: 'Single Room', description: 'Room for 1 person' },
      { code: 'DOUBLE', name: 'Double Room', description: 'Room for 2 people with 1 bed' },
      { code: 'TWIN', name: 'Twin Room', description: 'Room for 2 people with 2 beds' },
      { code: 'TRIPLE', name: 'Triple Room', description: 'Room for 3 people' },
      { code: 'QUAD', name: 'Quad Room', description: 'Room for 4 people' },
      { code: 'SUITE', name: 'Suite', description: 'Premium multi-room accommodation' },
      { code: 'FAMILY', name: 'Family Room', description: 'Room for families with children' },
      { code: 'STUDIO', name: 'Studio', description: 'Open-plan room with kitchenette' },
      { code: 'DELUXE', name: 'Deluxe Room', description: 'Upgraded room with extra amenities' },
      { code: 'EXECUTIVE', name: 'Executive Room', description: 'Business-oriented room' },
    ],
  },

  // View types
  VIEW_TYPES: {
    all: [
      { code: 'SEA', name: 'Sea View' },
      { code: 'OCEAN', name: 'Ocean View' },
      { code: 'CITY', name: 'City View' },
      { code: 'MOUNTAIN', name: 'Mountain View' },
      { code: 'GARDEN', name: 'Garden View' },
      { code: 'POOL', name: 'Pool View' },
      { code: 'BEACH', name: 'Beach View' },
      { code: 'LAKE', name: 'Lake View' },
    ],
  },

  // Payment types
  PAYMENT_TYPES: {
    all: [
      { code: 'CREDIT_CARD', name: 'Credit Card' },
      { code: 'DEBIT_CARD', name: 'Debit Card' },
      { code: 'WALLET', name: 'Digital Wallet' },
      { code: 'BANK_TRANSFER', name: 'Bank Transfer' },
      { code: 'CASH', name: 'Cash at Hotel' },
    ],
  },

  // Popular destinations for homepage
  POPULAR_DESTINATIONS: [
    { id: '1', name: 'Dubai', countryName: 'United Arab Emirates', countryCode: 'AE', hotelCount: 850, imageUrl: 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80' },
    { id: '2', name: 'Abu Dhabi', countryName: 'United Arab Emirates', countryCode: 'AE', hotelCount: 420, imageUrl: 'https://images.unsplash.com/photo-1512632578888-169bbbc64f33?auto=format&fit=crop&q=80' },
    { id: '3', name: 'Riyadh', countryName: 'Saudi Arabia', countryCode: 'SA', hotelCount: 580, imageUrl: 'https://images.unsplash.com/photo-1586724237569-f3d0c1dee8c6?auto=format&fit=crop&q=80' },
    { id: '4', name: 'Jeddah', countryName: 'Saudi Arabia', countryCode: 'SA', hotelCount: 340, imageUrl: 'https://images.unsplash.com/photo-1564769625673-cb560fa24828?auto=format&fit=crop&q=80' },
    { id: '5', name: 'Doha', countryName: 'Qatar', countryCode: 'QA', hotelCount: 290, imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80' },
    { id: '6', name: 'Kuwait City', countryName: 'Kuwait', countryCode: 'KW', hotelCount: 180, imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80' },
    { id: '7', name: 'Manama', countryName: 'Bahrain', countryCode: 'BH', hotelCount: 150, imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80' },
    { id: '8', name: 'Muscat', countryName: 'Oman', countryCode: 'OM', hotelCount: 210, imageUrl: 'https://images.unsplash.com/photo-1580674684081-7617fbf3d745?auto=format&fit=crop&q=80' },
    { id: '9', name: 'London', countryName: 'United Kingdom', countryCode: 'GB', hotelCount: 4500, imageUrl: 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80' },
    { id: '10', name: 'Paris', countryName: 'France', countryCode: 'FR', hotelCount: 3800, imageUrl: 'https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80' },
    { id: '11', name: 'New York', countryName: 'United States', countryCode: 'US', hotelCount: 5200, imageUrl: 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?auto=format&fit=crop&q=80' },
    { id: '12', name: 'Istanbul', countryName: 'Turkey', countryCode: 'TR', hotelCount: 2100, imageUrl: 'https://images.unsplash.com/photo-1524231757912-21f4fe3a7200?auto=format&fit=crop&q=80' },
  ],
};

/**
 * Search hotel destinations by query string
 * This is a simple client-side filter on the static data.
 * For production, use the API endpoint via the centralized API manager.
 */
export function searchHotelDestinations(query: string) {
  const lowerQuery = query.toLowerCase();
  return HOTEL_STATIC_DATA.POPULAR_DESTINATIONS.filter(
    dest => dest.name.toLowerCase().includes(lowerQuery) ||
            dest.countryName.toLowerCase().includes(lowerQuery) ||
            dest.countryCode.toLowerCase().includes(lowerQuery)
  );
}

// ============================================================================
// AIRPORT DATA
// ============================================================================

// Popular airports for static fallback
const POPULAR_AIRPORTS = [
  { iata_code: 'LHR', name: 'London Heathrow Airport', city: 'London', country: 'United Kingdom' },
  { iata_code: 'JFK', name: 'John F. Kennedy International Airport', city: 'New York', country: 'United States' },
  { iata_code: 'DXB', name: 'Dubai International Airport', city: 'Dubai', country: 'United Arab Emirates' },
  { iata_code: 'SIN', name: 'Singapore Changi Airport', city: 'Singapore', country: 'Singapore' },
  { iata_code: 'HKG', name: 'Hong Kong International Airport', city: 'Hong Kong', country: 'Hong Kong' },
  { iata_code: 'LAX', name: 'Los Angeles International Airport', city: 'Los Angeles', country: 'United States' },
  { iata_code: 'CDG', name: 'Paris Charles de Gaulle Airport', city: 'Paris', country: 'France' },
  { iata_code: 'AMS', name: 'Amsterdam Airport Schiphol', city: 'Amsterdam', country: 'Netherlands' },
  { iata_code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt', country: 'Germany' },
  { iata_code: 'IST', name: 'Istanbul Airport', city: 'Istanbul', country: 'Turkey' },
  { iata_code: 'DOH', name: 'Hamad International Airport', city: 'Doha', country: 'Qatar' },
  { iata_code: 'AUH', name: 'Abu Dhabi International Airport', city: 'Abu Dhabi', country: 'United Arab Emirates' },
  { iata_code: 'BOM', name: 'Chhatrapati Shivaji Maharaj International Airport', city: 'Mumbai', country: 'India' },
  { iata_code: 'DEL', name: 'Indira Gandhi International Airport', city: 'Delhi', country: 'India' },
  { iata_code: 'SYD', name: 'Sydney Kingsford Smith Airport', city: 'Sydney', country: 'Australia' },
  { iata_code: 'NRT', name: 'Narita International Airport', city: 'Tokyo', country: 'Japan' },
  { iata_code: 'ICN', name: 'Incheon International Airport', city: 'Seoul', country: 'South Korea' },
  { iata_code: 'PEK', name: 'Beijing Capital International Airport', city: 'Beijing', country: 'China' },
  { iata_code: 'CAN', name: 'Guangzhou Baiyun International Airport', city: 'Guangzhou', country: 'China' },
  { iata_code: 'BKK', name: 'Suvarnabhumi Airport', city: 'Bangkok', country: 'Thailand' },
];

/**
 * Get airports by query string
 * This is a simple client-side filter on the static data.
 * For production, use the API endpoint via the centralized API manager.
 */
export function getAirports(options?: { query?: string; limit?: number }) {
  const query = (options?.query || '').toLowerCase();
  const limit = options?.limit || 50;
  
  if (!query) {
    return { data: POPULAR_AIRPORTS.slice(0, limit) };
  }
  
  const filtered = POPULAR_AIRPORTS.filter(
    airport => 
      airport.iata_code.toLowerCase().includes(query) ||
      airport.name.toLowerCase().includes(query) ||
      airport.city.toLowerCase().includes(query) ||
      airport.country.toLowerCase().includes(query)
  );
  
  return { data: filtered.slice(0, limit) };
}

export default HOTEL_STATIC_DATA;