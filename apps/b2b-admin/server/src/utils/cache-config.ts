// Cache TTL Configuration for Redis
export const CACHE_TTL = {
  // Search results
  searchResults: 30 * 60,     // 30 minutes
  autocomplete: 60 * 60,      // 1 hour
  popularDestinations: 24 * 3600, // 24 hours

  // Availability & Pricing
  flightAvailability: 5 * 60, // 5 minutes
  flightPricing: 10 * 60,     // 10 minutes
  hotelAvailability: 5 * 60,  // 5 minutes
  hotelPricing: 15 * 60,      // 15 minutes

  // Static data
  airportData: 7 * 24 * 3600, // 7 days
  airlineData: 7 * 24 * 3600, // 7 days
  hotelData: 24 * 3600,       // 24 hours

  // User data
  userSession: 24 * 3600,     // 24 hours
  userPreferences: 7 * 24 * 3600, // 7 days
  searchHistory: 30 * 24 * 3600, // 30 days

  // Business data
  cartData: 24 * 3600,        // 24 hours
  bookingData: 365 * 24 * 3600 // 1 year
};

// Cache Key Generators
export const CACHE_KEYS = {
  flightSearch: (searchId: string) => `search:flights:${searchId}`,
  hotelSearch: (searchId: string) => `search:hotels:${searchId}`,
  availability: (type: string, id: string, date: string) => `${type}:availability:${id}:${date}`,
  pricing: (type: string, id: string, date: string) => `${type}:price:${id}:${date}`,
  suggestions: (sessionId: string) => `suggestions:${sessionId}`,
  cart: (userId: string) => `cart:${userId}`,
  session: (userId: string) => `session:${userId}`,
  popularDestinations: () => 'popular:destinations'
};

// Search ID Generator
export function generateSearchId(): string {
  return `search_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Rate Limiting Configuration
export const RATE_LIMITS = {
  search: {
    window: 'minute',
    maxRequests: 100
  },
  booking: {
    window: 'minute',
    maxRequests: 20
  },
  api: {
    window: 'hour',
    maxRequests: 1000
  }
};

// Cache Invalidation Rules
export const INVALIDATION_RULES = {
  flight: {
    onBooking: ['availability', 'pricing'],
    onScheduleChange: ['routes', 'schedules'],
    onPriceChange: ['pricing', 'search_results']
  },
  hotel: {
    onBooking: ['availability', 'pricing'],
    onRateChange: ['pricing', 'search_results'],
    onInventoryUpdate: ['availability']
  }
};

// Redis Configuration
export const REDIS_CONFIG = {
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB || '0'),
  retryDelayOnFailover: 100,
  enableReadyCheck: false,
  maxRetriesPerRequest: 3,
  lazyConnect: true,
  keyPrefix: 'travelkingdom:'
};

// Cache Performance Monitoring
export const CACHE_METRICS = {
  hits: 'metrics:cache:hits',
  misses: 'metrics:cache:misses',
  evictions: 'metrics:cache:evictions',
  memoryUsage: 'metrics:cache:memory'
};
