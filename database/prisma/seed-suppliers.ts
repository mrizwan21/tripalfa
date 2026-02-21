/**
 * Seed file for multi-supplier hotel data architecture
 * Run with: npx tsx prisma/seed-suppliers.ts
 * 
 * This seeds:
 * - Suppliers (Hotelbeds, LITEAPI, Duffel, etc.)
 * - Hotel Amenities (hotel-level facilities)
 * - Room Amenities (room-level facilities)
 * - Board types
 * - Initial destinations
 * 
 * Uses STATIC_DATABASE_URL for local Docker PostgreSQL
 */

import { PrismaClient } from '@prisma/client';

// Use the static database URL for Docker PostgreSQL
const connectionString = process.env.STATIC_DATABASE_URL || 'postgresql://postgres:postgres@localhost:5433/staticdatabase';

// Set the DATABASE_URL for the native Prisma client
process.env.DATABASE_URL = connectionString;

const prisma = new PrismaClient();

// ============================================
// SUPPLIERS
// ============================================

const suppliers = [
  {
    code: 'hotelbeds',
    name: 'Hotelbeds',
    type: 'hotel',
    status: 'active',
    apiBaseUrl: 'https://api.hotelbeds.com',
    rateLimitPerMin: 100,
    rateLimitPerDay: 10000,
    syncEnabled: true,
    syncInterval: 86400, // 24 hours
    features: {
      hotels: true,
      availability: true,
      realtime: true,
      multiCurrency: true,
      multiLanguage: true,
    },
    metadata: {
      description: 'World\'s leading bedbank for hotel accommodations',
      website: 'https://www.hotelbeds.com',
      apiDocs: 'https://developer.hotelbeds.com',
    },
  },
  {
    code: 'innstant',
    name: 'Innstant Travel',
    type: 'hotel',
    status: 'active',
    apiBaseUrl: 'https://static-data.innstant-servers.com',
    rateLimitPerMin: 60,
    rateLimitPerDay: 10000,
    syncEnabled: true,
    syncInterval: 86400, // 24 hours
    features: {
      hotels: true,
      availability: true,
      realtime: true,
      multiCurrency: true,
      multiLanguage: true,
      staticData: true,
    },
    metadata: {
      description: 'Global hotel distribution platform with extensive static data coverage (750k+ hotels)',
      website: 'https://www.innstant.com',
      searchApi: 'https://connect.mishor5.innstant-servers.com',
      bookingApi: 'https://book.mishor5.innstant-servers.com',
    },
  },
  {
    code: 'liteapi',
    name: 'LITEAPI',
    type: 'hotel',
    status: 'active',
    apiBaseUrl: 'https://api.liteapi.travel',
    rateLimitPerMin: 60,
    rateLimitPerDay: 5000,
    syncEnabled: true,
    syncInterval: 3600, // 1 hour
    features: {
      hotels: true,
      availability: true,
      realtime: true,
      loyalty: true,
      guestManagement: true,
    },
    metadata: {
      description: 'Hotel distribution API with loyalty features',
      website: 'https://liteapi.travel',
    },
  },
  {
    code: 'duffel',
    name: 'Duffel',
    type: 'flight',
    status: 'active',
    apiBaseUrl: 'https://api.duffel.com',
    rateLimitPerMin: 200,
    rateLimitPerDay: 50000,
    syncEnabled: true,
    syncInterval: 0, // Real-time
    features: {
      flights: true,
      realtime: true,
      instantTicketing: true,
      hold: true,
      ancillaries: true,
    },
    metadata: {
      description: 'Modern flight API with instant ticketing',
      website: 'https://duffel.com',
    },
  },
  {
    code: 'amadeus',
    name: 'Amadeus',
    type: 'flight',
    status: 'inactive',
    apiBaseUrl: 'https://api.amadeus.com',
    rateLimitPerMin: 100,
    rateLimitPerDay: 20000,
    syncEnabled: false,
    features: {
      flights: true,
      hotels: true,
      cars: true,
      trains: true,
    },
    metadata: {
      description: 'Global distribution system (GDS)',
      website: 'https://amadeus.com',
    },
  },
  {
    code: 'giata',
    name: 'GIATA',
    type: 'hotel',
    status: 'active',
    apiBaseUrl: 'https://ghgml.giatamedia.com',
    rateLimitPerMin: 30,
    rateLimitPerDay: 1000,
    syncEnabled: true,
    syncInterval: 604800, // 7 days
    features: {
      hotels: true,
      multiCode: true,
      images: true,
      descriptions: true,
    },
    metadata: {
      description: 'Multi-code hotel data provider for hotel mapping',
      website: 'https://www.giatamedia.com',
    },
  },
];

// ============================================
// HOTEL AMENITIES (Hotel-Level Facilities)
// ============================================

const hotelAmenities = [
  // Recreation
  { code: 'POOL', name: 'Swimming Pool', category: 'Recreation', isPopular: true, sortOrder: 10 },
  { code: 'POOL_INDOOR', name: 'Indoor Pool', category: 'Recreation', sortOrder: 11 },
  { code: 'POOL_OUTDOOR', name: 'Outdoor Pool', category: 'Recreation', sortOrder: 12 },
  { code: 'POOL_KIDS', name: "Kids' Pool", category: 'Recreation', sortOrder: 13 },
  { code: 'BEACH', name: 'Beach Access', category: 'Recreation', isPopular: true, sortOrder: 14 },
  { code: 'BEACH_PRIVATE', name: 'Private Beach', category: 'Recreation', sortOrder: 15 },
  { code: 'KIDS_CLUB', name: "Kids' Club", category: 'Recreation', sortOrder: 16 },
  { code: 'PLAYGROUND', name: 'Playground', category: 'Recreation', sortOrder: 17 },
  { code: 'GAME_ROOM', name: 'Game Room', category: 'Recreation', sortOrder: 18 },
  { code: 'TENNIS', name: 'Tennis Court', category: 'Recreation', sortOrder: 19 },
  { code: 'GOLF', name: 'Golf Course', category: 'Recreation', sortOrder: 20 },
  
  // Wellness
  { code: 'SPA', name: 'Spa', category: 'Wellness', isPopular: true, sortOrder: 30 },
  { code: 'SAUNA', name: 'Sauna', category: 'Wellness', sortOrder: 31 },
  { code: 'STEAM_ROOM', name: 'Steam Room', category: 'Wellness', sortOrder: 32 },
  { code: 'JACUZZI', name: 'Jacuzzi/Hot Tub', category: 'Wellness', sortOrder: 33 },
  { code: 'MASSAGE', name: 'Massage Services', category: 'Wellness', sortOrder: 34 },
  { code: 'FITNESS', name: 'Fitness Center', category: 'Wellness', isPopular: true, sortOrder: 35 },
  { code: 'YOGA', name: 'Yoga Classes', category: 'Wellness', sortOrder: 36 },
  
  // Dining
  { code: 'RESTAURANT', name: 'Restaurant', category: 'Dining', isPopular: true, sortOrder: 40 },
  { code: 'BAR', name: 'Bar/Lounge', category: 'Dining', sortOrder: 41 },
  { code: 'CAFE', name: 'Café', category: 'Dining', sortOrder: 42 },
  { code: 'ROOM_SERVICE', name: 'Room Service', category: 'Dining', sortOrder: 43 },
  { code: 'BREAKFAST_BUFFET', name: 'Breakfast Buffet', category: 'Dining', isPopular: true, sortOrder: 44 },
  
  // Business
  { code: 'BUSINESS_CENTER', name: 'Business Center', category: 'Business', sortOrder: 50 },
  { code: 'CONFERENCE', name: 'Conference Rooms', category: 'Business', sortOrder: 51 },
  { code: 'MEETING_ROOMS', name: 'Meeting Rooms', category: 'Business', sortOrder: 52 },
  
  // Services
  { code: 'RECEPTION_24H', name: '24-Hour Reception', category: 'Services', isPopular: true, sortOrder: 60 },
  { code: 'CONCIERGE', name: 'Concierge', category: 'Services', sortOrder: 61 },
  { code: 'LAUNDRY', name: 'Laundry Service', category: 'Services', sortOrder: 62 },
  { code: 'DRY_CLEANING', name: 'Dry Cleaning', category: 'Services', sortOrder: 63 },
  { code: 'CURRENCY_EXCHANGE', name: 'Currency Exchange', category: 'Services', sortOrder: 64 },
  { code: 'TOURS', name: 'Tour Desk', category: 'Services', sortOrder: 65 },
  { code: 'CAR_RENTAL', name: 'Car Rental Desk', category: 'Services', sortOrder: 66 },
  
  // Transportation
  { code: 'PARKING', name: 'Parking', category: 'Transportation', isPopular: true, sortOrder: 70 },
  { code: 'PARKING_FREE', name: 'Free Parking', category: 'Transportation', sortOrder: 71 },
  { code: 'VALET', name: 'Valet Parking', category: 'Transportation', sortOrder: 72 },
  { code: 'AIRPORT_SHUTTLE', name: 'Airport Shuttle', category: 'Transportation', isPopular: true, sortOrder: 73 },
  { code: 'EV_CHARGING', name: 'EV Charging Station', category: 'Transportation', sortOrder: 74 },
  
  // Accessibility
  { code: 'ACCESSIBLE', name: 'Accessible Facilities', category: 'Accessibility', sortOrder: 80 },
  { code: 'ELEVATOR', name: 'Elevator', category: 'Accessibility', sortOrder: 81 },
  { code: 'WHEELCHAIR', name: 'Wheelchair Accessible', category: 'Accessibility', sortOrder: 82 },
  
  // Pet Friendly
  { code: 'PET_FRIENDLY', name: 'Pet Friendly', category: 'Services', isPopular: true, sortOrder: 90 },
  
  // Facilities
  { code: 'GARDEN', name: 'Garden', category: 'Facilities', sortOrder: 100 },
  { code: 'TERRACE', name: 'Terrace', category: 'Facilities', sortOrder: 101 },
  { code: 'LIBRARY', name: 'Library', category: 'Facilities', sortOrder: 102 },
  { code: 'LOUNGE', name: 'Lounge Area', category: 'Facilities', sortOrder: 103 },
];

// ============================================
// ROOM AMENITIES (Room-Level Facilities)
// ============================================

const roomAmenities = [
  // Technology
  { code: 'WIFI', name: 'Free Wi-Fi', category: 'Technology', isPopular: true, sortOrder: 1 },
  { code: 'WIFI_HIGH_SPEED', name: 'High-Speed Wi-Fi', category: 'Technology', sortOrder: 2 },
  { code: 'WORKSPACE', name: 'Workspace Area', category: 'Technology', sortOrder: 3 },
  { code: 'SMART_HOME', name: 'Smart Home Features', category: 'Technology', sortOrder: 4 },
  
  // Comfort
  { code: 'AC', name: 'Air Conditioning', category: 'Comfort', isPopular: true, sortOrder: 10 },
  { code: 'HEATING', name: 'Heating', category: 'Comfort', sortOrder: 11 },
  { code: 'FAN', name: 'Ceiling Fan', category: 'Comfort', sortOrder: 12 },
  { code: 'BLACKOUT_CURTAINS', name: 'Blackout Curtains', category: 'Comfort', sortOrder: 13 },
  { code: 'SOUNDPROOF', name: 'Soundproofing', category: 'Comfort', sortOrder: 14 },
  
  // Entertainment
  { code: 'TV', name: 'Television', category: 'Entertainment', sortOrder: 20 },
  { code: 'TV_SATELLITE', name: 'Satellite TV', category: 'Entertainment', sortOrder: 21 },
  { code: 'TV_SMART', name: 'Smart TV', category: 'Entertainment', sortOrder: 22 },
  { code: 'TV_STREAMING', name: 'Streaming Services', category: 'Entertainment', sortOrder: 23 },
  { code: 'GAMING_CONSOLE', name: 'Gaming Console', category: 'Entertainment', sortOrder: 24 },
  
  // Bathroom
  { code: 'HAIRDRYER', name: 'Hairdryer', category: 'Bathroom', sortOrder: 30 },
  { code: 'BATHROBE', name: 'Bathrobe', category: 'Bathroom', sortOrder: 31 },
  { code: 'SLIPPERS', name: 'Slippers', category: 'Bathroom', sortOrder: 32 },
  { code: 'TOILETRIES', name: 'Free Toiletries', category: 'Bathroom', sortOrder: 33 },
  { code: 'JACUZZI_TUB', name: 'Jacuzzi Tub', category: 'Bathroom', sortOrder: 34 },
  { code: 'RAINFALL_SHOWER', name: 'Rainfall Shower', category: 'Bathroom', sortOrder: 35 },
  
  // Security
  { code: 'SAFE', name: 'In-Room Safe', category: 'Security', sortOrder: 40 },
  { code: 'KEYCARD', name: 'Keycard Access', category: 'Security', sortOrder: 41 },
  { code: 'VIDEO_DOORBELL', name: 'Video Doorbell', category: 'Security', sortOrder: 42 },
  
  // Views
  { code: 'BALCONY', name: 'Balcony', category: 'Views', sortOrder: 50 },
  { code: 'TERRACE', name: 'Private Terrace', category: 'Views', sortOrder: 51 },
  { code: 'SEA_VIEW', name: 'Sea View', category: 'Views', isPopular: true, sortOrder: 52 },
  { code: 'CITY_VIEW', name: 'City View', category: 'Views', sortOrder: 53 },
  { code: 'MOUNTAIN_VIEW', name: 'Mountain View', category: 'Views', sortOrder: 54 },
  { code: 'GARDEN_VIEW', name: 'Garden View', category: 'Views', sortOrder: 55 },
  { code: 'POOL_VIEW', name: 'Pool View', category: 'Views', sortOrder: 56 },
  
  // Kitchen
  { code: 'KITCHEN', name: 'Kitchen/Kitchenette', category: 'Kitchen', sortOrder: 60 },
  { code: 'KITCHEN_FULL', name: 'Full Kitchen', category: 'Kitchen', sortOrder: 61 },
  { code: 'MICROWAVE', name: 'Microwave', category: 'Kitchen', sortOrder: 62 },
  { code: 'FRIDGE', name: 'Refrigerator', category: 'Kitchen', sortOrder: 63 },
  { code: 'MINIBAR', name: 'Minibar', category: 'Kitchen', sortOrder: 64 },
  { code: 'COFFEE_MACHINE', name: 'Coffee Machine', category: 'Kitchen', isPopular: true, sortOrder: 65 },
  { code: 'KETTLE', name: 'Electric Kettle', category: 'Kitchen', sortOrder: 66 },
  { code: 'DISHWASHER', name: 'Dishwasher', category: 'Kitchen', sortOrder: 67 },
  
  // Other
  { code: 'IRON', name: 'Iron/Ironing Board', category: 'Other', sortOrder: 70 },
  { code: 'DESK', name: 'Work Desk', category: 'Other', sortOrder: 71 },
  { code: 'SOFA', name: 'Sofa/Seating Area', category: 'Other', sortOrder: 72 },
  { code: 'DINING_AREA', name: 'Dining Area', category: 'Other', sortOrder: 73 },
  { code: 'WASHER_DRYER', name: 'Washer/Dryer', category: 'Other', sortOrder: 74 },
];

// ============================================
// BOARD TYPES
// ============================================

const boardTypes = [
  {
    code: 'RO',
    name: 'Room Only',
    description: 'Room only - no meals included',
    includesBreakfast: false,
    includesLunch: false,
    includesDinner: false,
    includesDrinks: false,
    includesSnacks: false,
    sortOrder: 1,
  },
  {
    code: 'BB',
    name: 'Bed & Breakfast',
    description: 'Breakfast included',
    includesBreakfast: true,
    includesLunch: false,
    includesDinner: false,
    includesDrinks: false,
    includesSnacks: false,
    sortOrder: 2,
  },
  {
    code: 'HB',
    name: 'Half Board',
    description: 'Breakfast and dinner included',
    includesBreakfast: true,
    includesLunch: false,
    includesDinner: true,
    includesDrinks: false,
    includesSnacks: false,
    sortOrder: 3,
  },
  {
    code: 'FB',
    name: 'Full Board',
    description: 'Breakfast, lunch and dinner included',
    includesBreakfast: true,
    includesLunch: true,
    includesDinner: true,
    includesDrinks: false,
    includesSnacks: false,
    sortOrder: 4,
  },
  {
    code: 'AI',
    name: 'All Inclusive',
    description: 'All meals and selected drinks included',
    includesBreakfast: true,
    includesLunch: true,
    includesDinner: true,
    includesDrinks: true,
    includesSnacks: true,
    sortOrder: 5,
  },
  {
    code: 'UAI',
    name: 'Ultra All Inclusive',
    description: 'All meals, premium drinks and services included',
    includesBreakfast: true,
    includesLunch: true,
    includesDinner: true,
    includesDrinks: true,
    includesSnacks: true,
    sortOrder: 6,
  },
  {
    code: 'SC',
    name: 'Self Catering',
    description: 'Self-catering with kitchen facilities',
    includesBreakfast: false,
    includesLunch: false,
    includesDinner: false,
    includesDrinks: false,
    includesSnacks: false,
    sortOrder: 7,
  },
];

// ============================================
// DESTINATIONS (Sample - Top destinations)
// ============================================

const destinations = [
  // Countries
  {
    code: 'AE',
    name: 'United Arab Emirates',
    nameNormalized: 'united arab emirates',
    destinationType: 'country',
    level: 0,
    countryCode: 'AE',
    countryName: 'United Arab Emirates',
    iataCountryCode: 'AE',
    popularityScore: 9.5,
  },
  {
    code: 'GB',
    name: 'United Kingdom',
    nameNormalized: 'united kingdom',
    destinationType: 'country',
    level: 0,
    countryCode: 'GB',
    countryName: 'United Kingdom',
    iataCountryCode: 'GB',
    popularityScore: 9.0,
  },
  {
    code: 'US',
    name: 'United States',
    nameNormalized: 'united states',
    destinationType: 'country',
    level: 0,
    countryCode: 'US',
    countryName: 'United States',
    iataCountryCode: 'US',
    popularityScore: 9.8,
  },
  {
    code: 'FR',
    name: 'France',
    nameNormalized: 'france',
    destinationType: 'country',
    level: 0,
    countryCode: 'FR',
    countryName: 'France',
    iataCountryCode: 'FR',
    popularityScore: 9.2,
  },
  {
    code: 'ES',
    name: 'Spain',
    nameNormalized: 'spain',
    destinationType: 'country',
    level: 0,
    countryCode: 'ES',
    countryName: 'Spain',
    iataCountryCode: 'ES',
    popularityScore: 9.0,
  },
  {
    code: 'IT',
    name: 'Italy',
    nameNormalized: 'italy',
    destinationType: 'country',
    level: 0,
    countryCode: 'IT',
    countryName: 'Italy',
    iataCountryCode: 'IT',
    popularityScore: 8.8,
  },
  {
    code: 'TH',
    name: 'Thailand',
    nameNormalized: 'thailand',
    destinationType: 'country',
    level: 0,
    countryCode: 'TH',
    countryName: 'Thailand',
    iataCountryCode: 'TH',
    popularityScore: 8.5,
  },
  {
    code: 'JP',
    name: 'Japan',
    nameNormalized: 'japan',
    destinationType: 'country',
    level: 0,
    countryCode: 'JP',
    countryName: 'Japan',
    iataCountryCode: 'JP',
    popularityScore: 8.7,
  },
  {
    code: 'SG',
    name: 'Singapore',
    nameNormalized: 'singapore',
    destinationType: 'country',
    level: 0,
    countryCode: 'SG',
    countryName: 'Singapore',
    iataCountryCode: 'SG',
    popularityScore: 8.3,
  },
  {
    code: 'AU',
    name: 'Australia',
    nameNormalized: 'australia',
    destinationType: 'country',
    level: 0,
    countryCode: 'AU',
    countryName: 'Australia',
    iataCountryCode: 'AU',
    popularityScore: 8.0,
  },
  {
    code: 'SA',
    name: 'Saudi Arabia',
    nameNormalized: 'saudi arabia',
    destinationType: 'country',
    level: 0,
    countryCode: 'SA',
    countryName: 'Saudi Arabia',
    iataCountryCode: 'SA',
    popularityScore: 8.5,
  },
  {
    code: 'MV',
    name: 'Maldives',
    nameNormalized: 'maldives',
    destinationType: 'country',
    level: 0,
    countryCode: 'MV',
    countryName: 'Maldives',
    iataCountryCode: 'MV',
    popularityScore: 7.5,
  },
];

// ============================================
// HOTEL AMENITY SUPPLIER MAPPINGS (Hotelbeds)
// ============================================

const hotelbedsHotelAmenityMappings = [
  // Hotelbeds facility codes mapped to canonical hotel amenities
  { supplierCode: '20', supplierName: 'Swimming pool', amenityCode: 'POOL' },
  { supplierCode: '21', supplierName: 'Indoor pool', amenityCode: 'POOL_INDOOR' },
  { supplierCode: '22', supplierName: 'Outdoor pool', amenityCode: 'POOL_OUTDOOR' },
  { supplierCode: '23', supplierName: 'Children\'s pool', amenityCode: 'POOL_KIDS' },
  { supplierCode: '30', supplierName: 'Spa', amenityCode: 'SPA' },
  { supplierCode: '31', supplierName: 'Sauna', amenityCode: 'SAUNA' },
  { supplierCode: '32', supplierName: 'Steam bath', amenityCode: 'STEAM_ROOM' },
  { supplierCode: '33', supplierName: 'Jacuzzi', amenityCode: 'JACUZZI' },
  { supplierCode: '34', supplierName: 'Massage', amenityCode: 'MASSAGE' },
  { supplierCode: '40', supplierName: 'Gym', amenityCode: 'FITNESS' },
  { supplierCode: '50', supplierName: 'Restaurant', amenityCode: 'RESTAURANT' },
  { supplierCode: '51', supplierName: 'Bar/Lounge', amenityCode: 'BAR' },
  { supplierCode: '52', supplierName: 'Café', amenityCode: 'CAFE' },
  { supplierCode: '53', supplierName: 'Room service', amenityCode: 'ROOM_SERVICE' },
  { supplierCode: '60', supplierName: 'Parking', amenityCode: 'PARKING' },
  { supplierCode: '61', supplierName: 'Free parking', amenityCode: 'PARKING_FREE' },
  { supplierCode: '62', supplierName: 'Valet parking', amenityCode: 'VALET' },
  { supplierCode: '70', supplierName: 'Business centre', amenityCode: 'BUSINESS_CENTER' },
  { supplierCode: '71', supplierName: 'Conference room', amenityCode: 'CONFERENCE' },
  { supplierCode: '72', supplierName: 'Meeting room', amenityCode: 'MEETING_ROOMS' },
  { supplierCode: '80', supplierName: 'Laundry service', amenityCode: 'LAUNDRY' },
  { supplierCode: '81', supplierName: 'Dry cleaning', amenityCode: 'DRY_CLEANING' },
  { supplierCode: '90', supplierName: 'Concierge', amenityCode: 'CONCIERGE' },
  { supplierCode: '91', supplierName: '24h reception', amenityCode: 'RECEPTION_24H' },
  { supplierCode: '100', supplierName: 'Elevator', amenityCode: 'ELEVATOR' },
  { supplierCode: '110', supplierName: 'Beach', amenityCode: 'BEACH' },
  { supplierCode: '111', supplierName: 'Private beach', amenityCode: 'BEACH_PRIVATE' },
  { supplierCode: '120', supplierName: 'Tennis', amenityCode: 'TENNIS' },
  { supplierCode: '121', supplierName: 'Golf', amenityCode: 'GOLF' },
  { supplierCode: '130', supplierName: 'Kids club', amenityCode: 'KIDS_CLUB' },
  { supplierCode: '140', supplierName: 'Airport shuttle', amenityCode: 'AIRPORT_SHUTTLE' },
  { supplierCode: '150', supplierName: 'Pets allowed', amenityCode: 'PET_FRIENDLY' },
  { supplierCode: '160', supplierName: 'Accessible for disabled', amenityCode: 'ACCESSIBLE' },
  { supplierCode: '170', supplierName: 'Currency exchange', amenityCode: 'CURRENCY_EXCHANGE' },
  { supplierCode: '180', supplierName: 'Car rental', amenityCode: 'CAR_RENTAL' },
  { supplierCode: '190', supplierName: 'Tour desk', amenityCode: 'TOURS' },
];

// ============================================
// ROOM AMENITY SUPPLIER MAPPINGS (Hotelbeds)
// ============================================

const hotelbedsRoomAmenityMappings = [
  // Hotelbeds facility codes mapped to canonical room amenities
  { supplierCode: '10', supplierName: 'WIFI', amenityCode: 'WIFI' },
  { supplierCode: '200', supplierName: 'Air conditioning', amenityCode: 'AC' },
  { supplierCode: '201', supplierName: 'Heating', amenityCode: 'HEATING' },
  { supplierCode: '210', supplierName: 'Television', amenityCode: 'TV' },
  { supplierCode: '211', supplierName: 'Satellite TV', amenityCode: 'TV_SATELLITE' },
  { supplierCode: '220', supplierName: 'Safe', amenityCode: 'SAFE' },
  { supplierCode: '230', supplierName: 'Minibar', amenityCode: 'MINIBAR' },
  { supplierCode: '240', supplierName: 'Hairdryer', amenityCode: 'HAIRDRYER' },
  { supplierCode: '250', supplierName: 'Balcony', amenityCode: 'BALCONY' },
  { supplierCode: '251', supplierName: 'Terrace', amenityCode: 'TERRACE' },
  { supplierCode: '260', supplierName: 'Kitchen', amenityCode: 'KITCHEN' },
  { supplierCode: '261', supplierName: 'Microwave', amenityCode: 'MICROWAVE' },
  { supplierCode: '262', supplierName: 'Refrigerator', amenityCode: 'FRIDGE' },
  { supplierCode: '270', supplierName: 'Coffee/tea maker', amenityCode: 'COFFEE_MACHINE' },
  { supplierCode: '271', supplierName: 'Kettle', amenityCode: 'KETTLE' },
  { supplierCode: '280', supplierName: 'Iron/Ironing board', amenityCode: 'IRON' },
  { supplierCode: '290', supplierName: 'Bathrobe', amenityCode: 'BATHROBE' },
  { supplierCode: '291', supplierName: 'Slippers', amenityCode: 'SLIPPERS' },
  { supplierCode: '292', supplierName: 'Toiletries', amenityCode: 'TOILETRIES' },
  { supplierCode: '300', supplierName: 'Sea view', amenityCode: 'SEA_VIEW' },
  { supplierCode: '301', supplierName: 'City view', amenityCode: 'CITY_VIEW' },
  { supplierCode: '302', supplierName: 'Mountain view', amenityCode: 'MOUNTAIN_VIEW' },
  { supplierCode: '310', supplierName: 'Workspace', amenityCode: 'WORKSPACE' },
];

// ============================================
// BOARD TYPE SUPPLIER MAPPINGS (Hotelbeds)
// ============================================

const hotelbedsBoardMappings = [
  { supplierCode: 'RO', supplierName: 'Room Only', boardTypeCode: 'RO' },
  { supplierCode: 'BB', supplierName: 'Bed and breakfast', boardTypeCode: 'BB' },
  { supplierCode: 'HB', supplierName: 'Half board', boardTypeCode: 'HB' },
  { supplierCode: 'FB', supplierName: 'Full board', boardTypeCode: 'FB' },
  { supplierCode: 'AI', supplierName: 'All inclusive', boardTypeCode: 'AI' },
  { supplierCode: 'SC', supplierName: 'Self catering', boardTypeCode: 'SC' },
];

// ============================================
// SEED FUNCTIONS
// ============================================

async function seedSuppliers() {
  console.log('Seeding suppliers...');
  for (const supplier of suppliers) {
    await prisma.supplier.upsert({
      where: { code: supplier.code },
      update: supplier,
      create: supplier,
    });
  }
  console.log(`Seeded ${suppliers.length} suppliers`);
}

async function seedHotelAmenities() {
  console.log('Seeding hotel amenities...');
  for (const amenity of hotelAmenities) {
    await prisma.hotelAmenity.upsert({
      where: { code: amenity.code },
      update: {
        ...amenity,
        nameLocalized: {
          en: amenity.name,
        },
      },
      create: {
        ...amenity,
        nameLocalized: {
          en: amenity.name,
        },
      },
    });
  }
  console.log(`Seeded ${hotelAmenities.length} hotel amenities`);
}

async function seedRoomAmenities() {
  console.log('Seeding room amenities...');
  for (const amenity of roomAmenities) {
    await prisma.roomAmenity.upsert({
      where: { code: amenity.code },
      update: {
        ...amenity,
        nameLocalized: {
          en: amenity.name,
        },
      },
      create: {
        ...amenity,
        nameLocalized: {
          en: amenity.name,
        },
      },
    });
  }
  console.log(`Seeded ${roomAmenities.length} room amenities`);
}

async function seedBoardTypes() {
  console.log('Seeding board types...');
  for (const boardType of boardTypes) {
    await prisma.boardType.upsert({
      where: { code: boardType.code },
      update: {
        ...boardType,
        nameLocalized: {
          en: boardType.name,
        },
      },
      create: {
        ...boardType,
        nameLocalized: {
          en: boardType.name,
        },
      },
    });
  }
  console.log(`Seeded ${boardTypes.length} board types`);
}

async function seedDestinations() {
  console.log('Seeding destinations...');
  for (const destination of destinations) {
    await prisma.destination.upsert({
      where: { code: destination.code },
      update: destination,
      create: destination,
    });
  }
  console.log(`Seeded ${destinations.length} destinations`);
}

async function seedHotelAmenitySupplierMappings() {
  console.log('Seeding hotel amenity supplier mappings for Hotelbeds...');
  
  const hotelbeds = await prisma.supplier.findUnique({
    where: { code: 'hotelbeds' },
  });
  
  if (!hotelbeds) {
    console.log('Hotelbeds supplier not found, skipping hotel amenity mappings');
    return;
  }
  
  for (const mapping of hotelbedsHotelAmenityMappings) {
    const amenity = await prisma.hotelAmenity.findUnique({
      where: { code: mapping.amenityCode },
    });
    
    if (!amenity) {
      console.log(`Hotel amenity ${mapping.amenityCode} not found, skipping`);
      continue;
    }
    
    await prisma.hotelAmenitySupplierMapping.upsert({
      where: {
        supplierId_supplierCode: {
          supplierId: hotelbeds.id,
          supplierCode: mapping.supplierCode,
        },
      },
      update: {
        supplierName: mapping.supplierName,
        matchConfidence: 1.0,
        isVerified: true,
      },
      create: {
        supplierId: hotelbeds.id,
        supplierCode: mapping.supplierCode,
        supplierName: mapping.supplierName,
        amenityId: amenity.id,
        matchConfidence: 1.0,
        isVerified: true,
      },
    });
  }
  console.log(`Seeded ${hotelbedsHotelAmenityMappings.length} Hotelbeds hotel amenity mappings`);
}

async function seedRoomAmenitySupplierMappings() {
  console.log('Seeding room amenity supplier mappings for Hotelbeds...');
  
  const hotelbeds = await prisma.supplier.findUnique({
    where: { code: 'hotelbeds' },
  });
  
  if (!hotelbeds) {
    console.log('Hotelbeds supplier not found, skipping room amenity mappings');
    return;
  }
  
  for (const mapping of hotelbedsRoomAmenityMappings) {
    const amenity = await prisma.roomAmenity.findUnique({
      where: { code: mapping.amenityCode },
    });
    
    if (!amenity) {
      console.log(`Room amenity ${mapping.amenityCode} not found, skipping`);
      continue;
    }
    
    await prisma.roomAmenitySupplierMapping.upsert({
      where: {
        supplierId_supplierCode: {
          supplierId: hotelbeds.id,
          supplierCode: mapping.supplierCode,
        },
      },
      update: {
        supplierName: mapping.supplierName,
        matchConfidence: 1.0,
        isVerified: true,
      },
      create: {
        supplierId: hotelbeds.id,
        supplierCode: mapping.supplierCode,
        supplierName: mapping.supplierName,
        amenityId: amenity.id,
        matchConfidence: 1.0,
        isVerified: true,
      },
    });
  }
  console.log(`Seeded ${hotelbedsRoomAmenityMappings.length} Hotelbeds room amenity mappings`);
}

async function seedBoardTypeSupplierMappings() {
  console.log('Seeding board type supplier mappings for Hotelbeds...');
  
  const hotelbeds = await prisma.supplier.findUnique({
    where: { code: 'hotelbeds' },
  });
  
  if (!hotelbeds) {
    console.log('Hotelbeds supplier not found, skipping mappings');
    return;
  }
  
  for (const mapping of hotelbedsBoardMappings) {
    const boardType = await prisma.boardType.findUnique({
      where: { code: mapping.boardTypeCode },
    });
    
    if (!boardType) {
      console.log(`Board type ${mapping.boardTypeCode} not found, skipping`);
      continue;
    }
    
    await prisma.boardTypeSupplierMapping.upsert({
      where: {
        supplierId_supplierCode: {
          supplierId: hotelbeds.id,
          supplierCode: mapping.supplierCode,
        },
      },
      update: {
        supplierName: mapping.supplierName,
        matchConfidence: 1.0,
        isVerified: true,
      },
      create: {
        supplierId: hotelbeds.id,
        supplierCode: mapping.supplierCode,
        supplierName: mapping.supplierName,
        boardTypeId: boardType.id,
        matchConfidence: 1.0,
        isVerified: true,
      },
    });
  }
  console.log(`Seeded ${hotelbedsBoardMappings.length} Hotelbeds board type mappings`);
}

async function main() {
  console.log('Starting seed process...\n');
  
  await seedSuppliers();
  await seedHotelAmenities();
  await seedRoomAmenities();
  await seedBoardTypes();
  await seedDestinations();
  await seedHotelAmenitySupplierMappings();
  await seedRoomAmenitySupplierMappings();
  await seedBoardTypeSupplierMappings();
  
  console.log('\nSeed process completed!');
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
