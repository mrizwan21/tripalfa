/**
 * Hotel Domain Static Data
 * 
 * All hotel-related static data centralized in one place.
 * This eliminates duplication between frontend-index and fallbacks.
 */

import { HotelChain, HotelAmenity, HotelType } from '../types';

// ============================================
// AMENITY ICON MAPPING (Lucide icons)
// ============================================

/**
 * Maps amenity codes to Lucide icon names for dynamic rendering
 * Usage: const IconComponent = Icons[amenity.icon] || Info;
 */
export const AMENITY_ICONS: Record<string, string> = {
  // Technology
  'WIFI': 'Wifi',
  
  // Recreation
  'SWIMMING_POOL': 'Waves',
  'KIDS_CLUB': 'Baby',
  'BEACH_ACCESS': 'Umbrella',
  
  // Wellness
  'FITNESS_CENTER': 'Dumbbell',
  'SPA': 'Sparkles',
  
  // Dining
  'RESTAURANT': 'Utensils',
  'BAR': 'Wine',
  
  // Transportation
  'PARKING': 'Car',
  'AIRPORT_SHUTTLE': 'Bus',
  
  // Services
  'ROOM_SERVICE': 'RoomService',
  'LAUNDRY_SERVICE': 'Shirt',
  'PET_FRIENDLY': 'Dog',
  'RECEPTION_24H': 'Clock',
  'CONCIERGE': 'Bell',
  
  // Business
  'BUSINESS_CENTER': 'Briefcase',
  'CONFERENCE_ROOMS': 'Presentation',
  
  // Room
  'AIR_CONDITIONING': 'Thermometer',
  'MINIBAR': 'GlassWater',
  'SAFE': 'Lock',
  'TV': 'Tv',
  'BALCONY': 'DoorOpen',
  
  // Default fallback
  'DEFAULT': 'Info'
};

// ============================================
// HOTEL CHAINS
// ============================================

export const HOTEL_CHAINS: HotelChain[] = [
  { name: 'Marriott International', code: 'MAR', updated_at: new Date().toISOString() },
  { name: 'Hilton Worldwide', code: 'HIL', updated_at: new Date().toISOString() },
  { name: 'InterContinental Hotels Group', code: 'IHG', updated_at: new Date().toISOString() },
  { name: 'Hyatt Hotels Corporation', code: 'H', updated_at: new Date().toISOString() },
  { name: 'Accor', code: 'ACC', updated_at: new Date().toISOString() },
  { name: 'Choice Hotels', code: 'CHI', updated_at: new Date().toISOString() },
  { name: 'Best Western', code: 'BW', updated_at: new Date().toISOString() },
  { name: 'Radisson Hotel Group', code: 'RAD', updated_at: new Date().toISOString() }
];

// Indexed hotel chains for O(1) lookup
export const HOTEL_CHAINS_BY_CODE: Record<string, HotelChain> = HOTEL_CHAINS.reduce(
  (acc, chain) => ({ ...acc, [chain.code]: chain }),
  {}
);

// ============================================
// HOTEL AMENITIES (Unified - replaces facilities)
// ============================================

/**
 * Canonical hotel amenities list
 * Consolidates previous hotel_facilities concept
 */
export const HOTEL_AMENITIES: HotelAmenity[] = [
  { code: 'WIFI', name: 'Wi-Fi', category: 'Technology', applies_to: 'both', is_popular: true, sort_order: 1, updated_at: new Date().toISOString() },
  { code: 'SWIMMING_POOL', name: 'Swimming Pool', category: 'Recreation', applies_to: 'hotel', is_popular: true, sort_order: 2, updated_at: new Date().toISOString() },
  { code: 'FITNESS_CENTER', name: 'Fitness Center', category: 'Wellness', applies_to: 'hotel', is_popular: true, sort_order: 3, updated_at: new Date().toISOString() },
  { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', applies_to: 'hotel', is_popular: true, sort_order: 4, updated_at: new Date().toISOString() },
  { code: 'BAR', name: 'Bar', category: 'Dining', applies_to: 'hotel', sort_order: 5, updated_at: new Date().toISOString() },
  { code: 'SPA', name: 'Spa', category: 'Wellness', applies_to: 'hotel', is_popular: true, sort_order: 6, updated_at: new Date().toISOString() },
  { code: 'PARKING', name: 'Parking', category: 'Transportation', applies_to: 'hotel', is_popular: true, sort_order: 7, updated_at: new Date().toISOString() },
  { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Services', applies_to: 'hotel', sort_order: 8, updated_at: new Date().toISOString() },
  { code: 'BUSINESS_CENTER', name: 'Business Center', category: 'Business', applies_to: 'hotel', sort_order: 9, updated_at: new Date().toISOString() },
  { code: 'CONFERENCE_ROOMS', name: 'Conference Rooms', category: 'Business', applies_to: 'hotel', sort_order: 10, updated_at: new Date().toISOString() },
  { code: 'LAUNDRY_SERVICE', name: 'Laundry Service', category: 'Services', applies_to: 'hotel', sort_order: 11, updated_at: new Date().toISOString() },
  { code: 'AIRPORT_SHUTTLE', name: 'Airport Shuttle', category: 'Transportation', applies_to: 'hotel', sort_order: 12, updated_at: new Date().toISOString() },
  { code: 'PET_FRIENDLY', name: 'Pet Friendly', category: 'Services', applies_to: 'hotel', sort_order: 13, updated_at: new Date().toISOString() },
  { code: 'KIDS_CLUB', name: 'Kids Club', category: 'Recreation', applies_to: 'hotel', sort_order: 14, updated_at: new Date().toISOString() },
  { code: 'BEACH_ACCESS', name: 'Beach Access', category: 'Recreation', applies_to: 'hotel', sort_order: 15, updated_at: new Date().toISOString() },
  // Room-level amenities
  { code: 'AIR_CONDITIONING', name: 'Air Conditioning', category: 'Room', applies_to: 'room', is_popular: true, sort_order: 20, updated_at: new Date().toISOString() },
  { code: 'MINIBAR', name: 'Minibar', category: 'Room', applies_to: 'room', sort_order: 21, updated_at: new Date().toISOString() },
  { code: 'SAFE', name: 'Safe', category: 'Room', applies_to: 'room', sort_order: 22, updated_at: new Date().toISOString() },
  { code: 'TV', name: 'Television', category: 'Room', applies_to: 'room', sort_order: 23, updated_at: new Date().toISOString() },
  { code: 'BALCONY', name: 'Balcony', category: 'Room', applies_to: 'room', sort_order: 24, updated_at: new Date().toISOString() }
];

// Indexed amenities by code for O(1) lookup
export const HOTEL_AMENITIES_BY_CODE: Record<string, HotelAmenity> = HOTEL_AMENITIES.reduce(
  (acc, amenity) => ({ ...acc, [amenity.code]: amenity }),
  {}
);

// Indexed amenities by name for O(1) lookup
export const HOTEL_AMENITIES_BY_NAME: Record<string, HotelAmenity> = HOTEL_AMENITIES.reduce(
  (acc, amenity) => ({ ...acc, [amenity.name]: amenity }),
  {}
);

// Amenities grouped by category
export const HOTEL_AMENITIES_BY_CATEGORY: Record<string, HotelAmenity[]> = HOTEL_AMENITIES.reduce(
  (acc, amenity) => {
    if (!acc[amenity.category]) {
      acc[amenity.category] = [];
    }
    acc[amenity.category].push(amenity);
    return acc;
  },
  {} as Record<string, HotelAmenity[]>
);

// Filter helpers
export const HOTEL_LEVEL_AMENITIES = HOTEL_AMENITIES.filter(a => a.applies_to === 'hotel' || a.applies_to === 'both');
export const ROOM_LEVEL_AMENITIES = HOTEL_AMENITIES.filter(a => a.applies_to === 'room' || a.applies_to === 'both');
export const POPULAR_AMENITIES = HOTEL_AMENITIES.filter(a => a.is_popular);


// ============================================
// HOTEL TYPES
// ============================================

export const HOTEL_TYPES: HotelType[] = [
  { code: 'HOTEL', name: 'Hotel', description: 'Standard hotel accommodation', sort_order: 1, updated_at: new Date().toISOString() },
  { code: 'RESORT', name: 'Resort', description: 'Full-service resort with amenities', sort_order: 2, updated_at: new Date().toISOString() },
  { code: 'APARTMENT', name: 'Apartment', description: 'Self-contained apartment units', sort_order: 3, updated_at: new Date().toISOString() },
  { code: 'VILLA', name: 'Villa', description: 'Private standalone villa', sort_order: 4, updated_at: new Date().toISOString() },
  { code: 'HOSTEL', name: 'Hostel', description: 'Budget accommodation with shared facilities', sort_order: 5, updated_at: new Date().toISOString() },
  { code: 'BOUTIQUE', name: 'Boutique Hotel', description: 'Stylish, intimate hotel with unique character', sort_order: 6, updated_at: new Date().toISOString() },
  { code: 'MOTEL', name: 'Motel', description: 'Roadside hotel with parking access', sort_order: 7, updated_at: new Date().toISOString() },
  { code: 'GUESTHOUSE', name: 'Guest House', description: 'Small family-run accommodation', sort_order: 8, updated_at: new Date().toISOString() },
  { code: 'BNB', name: 'Bed & Breakfast', description: 'Accommodation with breakfast included', sort_order: 9, updated_at: new Date().toISOString() },
  { code: 'SERVICED_APT', name: 'Serviced Apartment', description: 'Apartment with hotel-style services', sort_order: 10, updated_at: new Date().toISOString() }
];

// Indexed hotel types by code for O(1) lookup
export const HOTEL_TYPES_BY_CODE: Record<string, HotelType> = HOTEL_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code!]: type }),
  {}
);

// Indexed hotel types by name for O(1) lookup
export const HOTEL_TYPES_BY_NAME: Record<string, HotelType> = HOTEL_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.name]: type }),
  {}
);

// ============================================
// STAR RATINGS
// ============================================

export interface StarRating {
  value: number;
  label: string;
  icon: string;
}

export const STAR_RATINGS: StarRating[] = [
  { value: 1, label: '1 Star', icon: '★' },
  { value: 2, label: '2 Stars', icon: '★★' },
  { value: 3, label: '3 Stars', icon: '★★★' },
  { value: 4, label: '4 Stars', icon: '★★★★' },
  { value: 5, label: '5 Stars', icon: '★★★★★' }
];

export const STAR_RATINGS_BY_VALUE: Record<number, StarRating> = STAR_RATINGS.reduce(
  (acc, rating) => ({ ...acc, [rating.value]: rating }),
  {}
);

// ============================================
// POPULAR HOTEL DESTINATIONS
// ============================================

export interface HotelDestination {
  city: string;
  country: string;
  country_code: string;
  popularity: number;
}

// Populated from PostgreSQL at build time - do not hardcode
export const POPULAR_HOTEL_DESTINATIONS: HotelDestination[] = [];

// ============================================
// ROOM TYPES
// ============================================

export interface RoomType {
  code: string;
  name: string;
  description: string;
  max_occupancy: number;
}

export const ROOM_TYPES: RoomType[] = [
  { code: 'SGL', name: 'Single Room', description: 'Room with one single bed', max_occupancy: 1 },
  { code: 'DBL', name: 'Double Room', description: 'Room with one double bed', max_occupancy: 2 },
  { code: 'TWN', name: 'Twin Room', description: 'Room with two single beds', max_occupancy: 2 },
  { code: 'TRP', name: 'Triple Room', description: 'Room with three single beds or one double and one single', max_occupancy: 3 },
  { code: 'QAD', name: 'Quad Room', description: 'Room with four single beds or two double beds', max_occupancy: 4 },
  { code: 'FAM', name: 'Family Room', description: 'Spacious room suitable for families', max_occupancy: 4 },
  { code: 'STE', name: 'Suite', description: 'Luxury suite with separate living area', max_occupancy: 2 },
  { code: 'JST', name: 'Junior Suite', description: 'Suite with open-plan layout', max_occupancy: 2 },
  { code: 'APT', name: 'Apartment', description: 'Self-contained apartment with kitchen', max_occupancy: 4 },
  { code: 'VIL', name: 'Villa', description: 'Private villa with multiple rooms', max_occupancy: 6 }
];

export const ROOM_TYPES_BY_CODE: Record<string, RoomType> = ROOM_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code]: type }),
  {}
);

// ============================================
// BOARD TYPES (MEAL PLANS)
// ============================================

export interface BoardType {
  code: string;
  name: string;
  description: string;
  sort_order: number;
}

export const BOARD_TYPES: BoardType[] = [
  { code: 'RO', name: 'Room Only', description: 'Room only - no meals included', sort_order: 1 },
  { code: 'BB', name: 'Bed & Breakfast', description: 'Breakfast included', sort_order: 2 },
  { code: 'HB', name: 'Half Board', description: 'Breakfast and dinner included', sort_order: 3 },
  { code: 'FB', name: 'Full Board', description: 'Breakfast, lunch and dinner included', sort_order: 4 },
  { code: 'AI', name: 'All Inclusive', description: 'All meals and selected drinks included', sort_order: 5 },
  { code: 'UAI', name: 'Ultra All Inclusive', description: 'All meals, drinks and premium services included', sort_order: 6 }
];

export const BOARD_TYPES_BY_CODE: Record<string, BoardType> = BOARD_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code]: type }),
  {}
);

// ============================================
// PAYMENT TYPES
// ============================================

export interface PaymentType {
  code: string;
  name: string;
  description: string;
}

export const PAYMENT_TYPES: PaymentType[] = [
  { code: 'PREPAY', name: 'Pay Now', description: 'Full payment required at booking' },
  { code: 'PAY_AT_HOTEL', name: 'Pay at Hotel', description: 'Payment at check-in or check-out' },
  { code: 'DEPOSIT', name: 'Deposit', description: 'Partial payment now, remainder at hotel' }
];

export const PAYMENT_TYPES_BY_CODE: Record<string, PaymentType> = PAYMENT_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code]: type }),
  {}
);

// ============================================
// VIEW TYPES (for room views)
// ============================================

export interface ViewType {
  code: string;
  name: string;
}

export const VIEW_TYPES: ViewType[] = [
  { code: 'SEA', name: 'Sea View' },
  { code: 'POOL', name: 'Pool View' },
  { code: 'GARDEN', name: 'Garden View' },
  { code: 'CITY', name: 'City View' },
  { code: 'MOUNTAIN', name: 'Mountain View' },
  { code: 'COURTYARD', name: 'Courtyard View' },
  { code: 'LAKE', name: 'Lake View' },
  { code: 'PARK', name: 'Park View' },
  { code: 'STREET', name: 'Street View' },
  { code: 'NO_VIEW', name: 'No View / Interior' }
];

export const VIEW_TYPES_BY_CODE: Record<string, ViewType> = VIEW_TYPES.reduce(
  (acc, type) => ({ ...acc, [type.code]: type }),
  {}
);
