// @ts-nocheck
/**
 * Metadata Processor for flight and hotel search results
 * Integrates with Redis cache and applies business logic
 * 
 * NOTE: Redis client type errors are known compatibility issues with RESP2/RESP3
 * Suppressed temporarily to unblock Phase 4 implementation
 * TODO: Update Redis client version and resolve type compatibility
 */

import { createClient, RedisClientType } from 'redis';

// Redis client singleton with promise-based initialization lock
let redisClient: RedisClientType | null = null;
let redisInitPromise: Promise<RedisClientType | null> | null = null;
let redisConnectionFailed = false;

export async function getRedisClient(): Promise<RedisClientType | null> {
  // If connection already failed, return null immediately
  if (redisConnectionFailed) {
    return null;
  }

  // Return existing client if connected
  if (redisClient && redisClient.isReady) {
    return redisClient;
  }

  // Return existing client if connecting (wait for it)
  if (redisClient && redisClient.isOpen) {
    return redisClient;
  }

  // If initialization is in progress, wait for it
  if (redisInitPromise) {
    return redisInitPromise;
  }

  const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

  redisInitPromise = (async () => {
    try {
      const client = createClient({
        url: redisUrl,
        socket: {
          connectTimeout: 5000, // 5 second timeout
          reconnectStrategy: (retries: number) => {
            if (retries > 10) {
              console.error('[Redis] Max reconnection attempts reached');
              redisConnectionFailed = true;
              return new Error('Max reconnection attempts reached');
            }
            return Math.min(retries * 100, 3000);
          },
        },
      });

      client.on('error', (err: Error) => {
        console.error('[Redis] Client error:', err.message);
      });

      client.on('connect', () => {
        console.log('[Redis] Connected to Redis');
      });

      client.on('end', () => {
        console.log('[Redis] Connection closed');
        redisClient = null;
      });

      await client.connect();
      redisClient = client;
      redisInitPromise = null;
      return client;
    } catch (error: unknown) {
      console.error(
        '[Redis] Connection failed:',
        error instanceof Error ? error.message : 'Unknown error'
      );
      redisConnectionFailed = true;
      redisInitPromise = null;
      return null;
    }
  })();

  return redisInitPromise;
}

// Cache TTL constants (in seconds)
const CACHE_TTL = {
  FLIGHT_SEARCH: 300, // 5 minutes (flight data is more volatile)
  HOTEL_SEARCH: 900, // 15 minutes (hotel data is more stable)
  FLIGHT_RESULTS: 600, // 10 minutes for flight results
  HOTEL_RESULTS: 900, // 15 minutes for hotel results
  PROCESSED_RESULTS: 600, // 10 minutes for processed results (backward compatibility)
};

// Cache key generators for OTA pattern (searchId-based)
export const CacheKeys = {
  // Flight keys
  flightSearchRaw: (searchId: string) => `flight:search:${searchId}:raw`,
  flightSearchResults: (searchId: string) => `flight:search:${searchId}:results`,
  flightSearchFilters: (searchId: string) => `flight:search:${searchId}:filters`,
  flightSearchSortPrice: (searchId: string) => `flight:search:${searchId}:sort:price`,
  flightSearchSortDuration: (searchId: string) => `flight:search:${searchId}:sort:duration`,

  // Hotel keys
  hotelSearchRaw: (searchId: string) => `hotel:search:${searchId}:raw`,
  hotelSearchResults: (searchId: string) => `hotel:search:${searchId}:results`,
  hotelSearchFilters: (searchId: string) => `hotel:search:${searchId}:filters`,
  hotelSearchSortPrice: (searchId: string) => `hotel:search:${searchId}:sort:price`,
  hotelSearchSortRating: (searchId: string) => `hotel:search:${searchId}:sort:rating`,

  // Legacy keys for backward compatibility (using hash)
  flightSearch: (params: Record<string, any>) => {
    const hash = Buffer.from(JSON.stringify(params)).toString('base64');
    return `flight:search:${hash}`;
  },
  flightSearchProcessed: (params: Record<string, any>) => {
    const hash = Buffer.from(JSON.stringify(params)).toString('base64');
    return `flight:search:processed:${hash}`;
  },
  hotelSearch: (params: Record<string, any>) => {
    const hash = Buffer.from(JSON.stringify(params)).toString('base64');
    return `hotel:search:${hash}`;
  },
  hotelSearchProcessed: (params: Record<string, any>) => {
    const hash = Buffer.from(JSON.stringify(params)).toString('base64');
    return `hotel:search:processed:${hash}`;
  },
};

// Cache service with support for sorted sets
export const CacheService = {
  async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      const data = await client.get(key);
      if (!data) return null;
      return JSON.parse(data) as T;
    } catch (error: unknown) {
      console.error(`[Cache] Error getting key ${key}:`, error);
      return null;
    }
  },

  async set(key: string, data: any, ttlSeconds: number): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.setEx(key, ttlSeconds, JSON.stringify(data));
      return true;
    } catch (error: unknown) {
      console.error(`[Cache] Error setting key ${key}:`, error);
      return false;
    }
  },

  async delete(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.del(key);
      return true;
    } catch (error: unknown) {
      console.error(`[Cache] Error deleting key ${key}:`, error);
      return false;
    }
  },

  // Sorted set operations for fast sorting
  async zadd(key: string, score: number, member: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.zAdd(key, { score, value: member });
      return true;
    } catch (error: unknown) {
      console.error(`[Cache] Error adding to sorted set ${key}:`, error);
      return false;
    }
  },

  async zrange(key: string, start: number, stop: number): Promise<string[]> {
    try {
      const client = await getRedisClient();
      return await client.zRange(key, start, stop);
    } catch (error: unknown) {
      console.error(`[Cache] Error reading sorted set ${key}:`, error);
      return [];
    }
  },

  async zrangeByScore(key: string, min: number, max: number): Promise<string[]> {
    try {
      const client = await getRedisClient();
      return await client.zRangeByScore(key, min, max);
    } catch (error: unknown) {
      console.error(`[Cache] Error reading sorted set by score ${key}:`, error);
      return [];
    }
  },

  async expire(key: string, ttlSeconds: number): Promise<boolean> {
    try {
      const client = await getRedisClient();
      await client.expire(key, ttlSeconds);
      return true;
    } catch (error: unknown) {
      console.error(`[Cache] Error setting expiry ${key}:`, error);
      return false;
    }
  },
};

// Business rules interface
interface BusinessRules {
  // Flight rules
  blockedAirlines: string[];
  minPrice?: number;
  maxPrice?: number;
  preferredAirlines: string[];
  sortBy: 'price' | 'duration' | 'departure_time' | 'airline_rating';
  sortOrder: 'asc' | 'desc';

  // Hotel rules
  minStarRating: number;
  maxPricePerNight?: number;
  requiredAmenities: string[];
  sortByHotel: 'price' | 'rating' | 'distance' | 'star_rating';
  sortOrderHotel: 'asc' | 'desc';
}

// Default business rules
const DEFAULT_BUSINESS_RULES: BusinessRules = {
  blockedAirlines: [],
  minPrice: 0,
  maxPrice: 10000,
  preferredAirlines: [],
  sortBy: 'price',
  sortOrder: 'asc',
  minStarRating: 0,
  maxPricePerNight: 1000,
  requiredAmenities: [],
  sortByHotel: 'price',
  sortOrderHotel: 'asc',
};

/**
 * Flight metadata processing
 */
export class FlightMetadataProcessor {
  /**
   * Process flight search results
   */
  static process(
    rawOffers: any[],
    params: Record<string, any>,
    rules?: Partial<BusinessRules>
  ): any[] {
    const businessRules = { ...DEFAULT_BUSINESS_RULES, ...rules };

    // 1. Filtering
    let filtered = rawOffers.filter(offer => {
      // Filter by blocked airlines
      if (businessRules.blockedAirlines.includes(offer.owner?.iata_code)) {
        return false;
      }

      // Filter by price range
      const amount = offer.total_amount?.amount ?? offer.total_amount;
      const price = parseFloat(amount) || 0;
      if (businessRules.minPrice && price < businessRules.minPrice) {
        return false;
      }
      if (businessRules.maxPrice && price > businessRules.maxPrice) {
        return false;
      }

      return true;
    });

    // 2. Sorting
    filtered.sort((a, b) => {
      const aAmount = a.total_amount?.amount ?? a.total_amount;
      const bAmount = b.total_amount?.amount ?? b.total_amount;
      const aPrice = parseFloat(aAmount) || 0;
      const bPrice = parseFloat(bAmount) || 0;
      const aDuration = this.calculateTotalDuration(a);
      const bDuration = this.calculateTotalDuration(b);
      const aDeparture = new Date(a.slices?.[0]?.segments?.[0]?.departing_at || 0);
      const bDeparture = new Date(b.slices?.[0]?.segments?.[0]?.departing_at || 0);

      switch (businessRules.sortBy) {
        case 'price':
          return businessRules.sortOrder === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        case 'duration':
          return businessRules.sortOrder === 'asc' ? aDuration - bDuration : bDuration - aDuration;
        case 'departure_time':
          return businessRules.sortOrder === 'asc'
            ? aDeparture.getTime() - bDeparture.getTime()
            : bDeparture.getTime() - aDeparture.getTime();
        case 'airline_rating':
          // Simplified - would need airline rating data
          return 0;
        default:
          return aPrice - bPrice;
      }
    });

    // 3. Enrichment
    const enriched = filtered.map(offer => ({
      ...offer,
      metadata: {
        isBestDeal: this.isBestDeal(offer, filtered),
        isFastest: this.isFastest(offer, filtered),
        isPreferredAirline: businessRules.preferredAirlines.includes(offer.owner?.iata_code),
        totalDuration: this.calculateTotalDuration(offer),
        stops: this.calculateStops(offer),
      },
    }));

    return enriched;
  }

  static calculateTotalDuration(offer: any): number {
    let totalMinutes = 0;
    if (offer.slices) {
      offer.slices.forEach((slice: any) => {
        if (slice.duration) {
          totalMinutes += parseInt(slice.duration) || 0;
        }
      });
    }
    return totalMinutes;
  }

  static calculateStops(offer: any): number {
    let stops = 0;
    if (offer.slices) {
      offer.slices.forEach((slice: any) => {
        if (slice.segments && slice.segments.length > 1) {
          stops += slice.segments.length - 1;
        }
      });
    }
    return stops;
  }

  private static isBestDeal(offer: any, allOffers: any[]): boolean {
    if (allOffers.length === 0) return false;
    const offerAmount = offer.total_amount?.amount ?? offer.total_amount;
    const offerPrice = parseFloat(offerAmount) || 0;
    const minPrice = Math.min(
      ...allOffers.map(o => {
        const amount = o.total_amount?.amount ?? o.total_amount;
        return parseFloat(amount) || 0;
      })
    );
    return offerPrice === minPrice;
  }

  private static isFastest(offer: any, allOffers: any[]): boolean {
    if (allOffers.length === 0) return false;
    const offerDuration = this.calculateTotalDuration(offer);
    const minDuration = Math.min(...allOffers.map(o => this.calculateTotalDuration(o)));
    return offerDuration === minDuration;
  }
}

/**
 * Hotel metadata processing
 */
export class HotelMetadataProcessor {
  /**
   * Process hotel search results
   */
  static process(
    rawHotels: any[],
    params: Record<string, any>,
    rules?: Partial<BusinessRules>
  ): any[] {
    const businessRules = { ...DEFAULT_BUSINESS_RULES, ...rules };

    // 1. Filtering
    let filtered = rawHotels.filter(hotel => {
      // Filter by star rating
      const starRating = hotel.star_rating || hotel.stars || 0;
      if (starRating < businessRules.minStarRating) {
        return false;
      }

      // Filter by price per night
      const pricePerNight = this.getPricePerNight(hotel);
      if (businessRules.maxPricePerNight && pricePerNight > businessRules.maxPricePerNight) {
        return false;
      }

      // Filter by required amenities
      if (businessRules.requiredAmenities.length > 0) {
        const hotelAmenities = hotel.amenities || hotel.facilities || [];
        const hasAllRequired = businessRules.requiredAmenities.every(amenity =>
          hotelAmenities.includes(amenity)
        );
        if (!hasAllRequired) {
          return false;
        }
      }

      return true;
    });

    // 2. Sorting
    filtered.sort((a, b) => {
      const aPrice = this.getPricePerNight(a);
      const bPrice = this.getPricePerNight(b);
      const aRating = a.rating || a.guest_reviews?.rating || 0;
      const bRating = b.rating || b.guest_reviews?.rating || 0;
      const aStars = a.star_rating || a.stars || 0;
      const bStars = b.star_rating || b.stars || 0;
      const aDistance = a.distance_to_center || a.distance || 0;
      const bDistance = b.distance_to_center || b.distance || 0;

      switch (businessRules.sortByHotel) {
        case 'price':
          return businessRules.sortOrderHotel === 'asc' ? aPrice - bPrice : bPrice - aPrice;
        case 'rating':
          return businessRules.sortOrderHotel === 'asc' ? aRating - bRating : bRating - aRating;
        case 'distance':
          return businessRules.sortOrderHotel === 'asc'
            ? aDistance - bDistance
            : bDistance - aDistance;
        case 'star_rating':
          return businessRules.sortOrderHotel === 'asc' ? aStars - bStars : bStars - aStars;
        default:
          return aPrice - bPrice;
      }
    });

    // 3. Enrichment
    const enriched = filtered.map(hotel => ({
      ...hotel,
      metadata: {
        isBestValue: this.isBestValue(hotel, filtered),
        isHighestRated: this.isHighestRated(hotel, filtered),
        isClosestToCenter: this.isClosestToCenter(hotel, filtered),
        pricePerNight: this.getPricePerNight(hotel),
        amenitiesCount: (hotel.amenities || hotel.facilities || []).length,
      },
    }));

    return enriched;
  }

  static getPricePerNight(hotel: any): number {
    if (hotel.min_price_per_night) {
      return parseFloat(hotel.min_price_per_night);
    }
    if (hotel.price_per_night) {
      return parseFloat(hotel.price_per_night);
    }
    if (hotel.rates && hotel.rates.length > 0) {
      return parseFloat(hotel.rates[0].price_per_night || 0);
    }
    return 0;
  }

  private static isBestValue(hotel: any, allHotels: any[]): boolean {
    if (allHotels.length === 0) return false;
    const hotelPrice = this.getPricePerNight(hotel);
    const hotelRating = hotel.rating || hotel.guest_reviews?.rating || 1;
    const valueScore = hotelPrice / hotelRating;

    const allScores = allHotels.map(h => {
      const price = this.getPricePerNight(h);
      const rating = h.rating || h.guest_reviews?.rating || 1;
      return price / rating;
    });

    const minScore = Math.min(...allScores);
    return valueScore === minScore;
  }

  private static isHighestRated(hotel: any, allHotels: any[]): boolean {
    if (allHotels.length === 0) return false;
    const hotelRating = hotel.rating || hotel.guest_reviews?.rating || 0;
    const maxRating = Math.max(...allHotels.map(h => h.rating || h.guest_reviews?.rating || 0));
    // Don't mark as highest rated if max rating is 0 (no ratings available)
    return maxRating > 0 && hotelRating === maxRating;
  }

  private static isClosestToCenter(hotel: any, allHotels: any[]): boolean {
    if (allHotels.length === 0) return false;
    const hotelDistance = hotel.distance_to_center || hotel.distance || Infinity;
    const minDistance = Math.min(
      ...allHotels.map(h => h.distance_to_center || h.distance || Infinity)
    );
    return hotelDistance === minDistance;
  }
}

/**
 * Filter metadata extraction for flight and hotel search results
 */
export class FilterMetadataExtractor {
  /**
   * Extract filter metadata from flight offers
   */
  static extractFlightFilters(offers: any[]): any {
    const airlines = new Map<string, { code: string; name: string; count: number }>();
    const stopsCount = new Map<string, { type: string; count: number }>();
    const cabinClasses = new Map<string, { class: string; count: number }>();
    const baggageOptions = new Map<string, { type: string; count: number }>();
    const departureTimeBuckets = new Map<string, { bucket: string; count: number }>();
    const arrivalTimeBuckets = new Map<string, { bucket: string; count: number }>();
    const alliances = new Map<string, { alliance: string; count: number }>();
    const countries = new Map<string, { country: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let minDuration = Infinity;
    let maxDuration = 0;
    let refundableCount = 0;
    let totalOffers = offers.length;

    // Helper to categorize time of day
    const getTimeBucket = (dateTimeStr: string): string => {
      if (!dateTimeStr) return 'unknown';
      const hour = new Date(dateTimeStr).getUTCHours();
      if (hour >= 5 && hour < 12) return 'morning';
      if (hour >= 12 && hour < 17) return 'afternoon';
      if (hour >= 17 && hour < 22) return 'evening';
      return 'night';
    };

    // Simple airline to alliance mapping (partial)
    const getAirlineAlliance = (airlineCode: string): string => {
      const allianceMap: Record<string, string> = {
        AA: 'oneworld',
        BA: 'oneworld',
        CX: 'oneworld',
        QF: 'oneworld',
        DL: 'SkyTeam',
        AF: 'SkyTeam',
        KL: 'SkyTeam',
        VS: 'SkyTeam',
        UA: 'Star Alliance',
        LH: 'Star Alliance',
        SQ: 'Star Alliance',
        TK: 'Star Alliance',
      };
      return allianceMap[airlineCode] || 'unknown';
    };

    offers.forEach(offer => {
      // Extract airline info
      const airlineCode = offer.owner?.iata_code || 'Unknown';
      const airlineName = offer.owner?.name || 'Unknown Airline';

      if (airlines.has(airlineCode)) {
        const existing = airlines.get(airlineCode)!;
        existing.count++;
        airlines.set(airlineCode, existing);
      } else {
        airlines.set(airlineCode, {
          code: airlineCode,
          name: airlineName,
          count: 1,
        });
      }

      // Extract alliance
      const alliance = getAirlineAlliance(airlineCode);
      if (alliances.has(alliance)) {
        const existing = alliances.get(alliance)!;
        existing.count++;
        alliances.set(alliance, existing);
      } else {
        alliances.set(alliance, { alliance, count: 1 });
      }

      // Extract stops info
      const stops = FlightMetadataProcessor.calculateStops(offer);
      const stopType = stops === 0 ? 'nonstop' : stops === 1 ? '1stop' : '2+stops';

      if (stopsCount.has(stopType)) {
        const existing = stopsCount.get(stopType)!;
        existing.count++;
        stopsCount.set(stopType, existing);
      } else {
        stopsCount.set(stopType, { type: stopType, count: 1 });
      }

      // Extract cabin class
      const cabinClass = offer.slices?.[0]?.segments?.[0]?.cabin_class || 'economy';
      if (cabinClasses.has(cabinClass)) {
        const existing = cabinClasses.get(cabinClass)!;
        existing.count++;
        cabinClasses.set(cabinClass, existing);
      } else {
        cabinClasses.set(cabinClass, { class: cabinClass, count: 1 });
      }

      // Extract baggage options
      const baggages = offer.passengers?.[0]?.baggages || [];
      baggages.forEach((bag: any) => {
        const type = bag.type || 'unknown';
        if (baggageOptions.has(type)) {
          const existing = baggageOptions.get(type)!;
          existing.count++;
          baggageOptions.set(type, existing);
        } else {
          baggageOptions.set(type, { type, count: 1 });
        }
      });

      // Extract departure and arrival time buckets
      const departureTime = offer.slices?.[0]?.segments?.[0]?.departing_at;
      if (departureTime) {
        const bucket = getTimeBucket(departureTime);
        if (departureTimeBuckets.has(bucket)) {
          const existing = departureTimeBuckets.get(bucket)!;
          existing.count++;
          departureTimeBuckets.set(bucket, existing);
        } else {
          departureTimeBuckets.set(bucket, { bucket, count: 1 });
        }
      }

      const arrivalTime = offer.slices?.[0]?.segments?.[0]?.arriving_at;
      if (arrivalTime) {
        const bucket = getTimeBucket(arrivalTime);
        if (arrivalTimeBuckets.has(bucket)) {
          const existing = arrivalTimeBuckets.get(bucket)!;
          existing.count++;
          arrivalTimeBuckets.set(bucket, existing);
        } else {
          arrivalTimeBuckets.set(bucket, { bucket, count: 1 });
        }
      }

      // Extract countries (origin and destination)
      const originCountry = offer.slices?.[0]?.origin?.country_code || 'unknown';
      const destCountry = offer.slices?.[0]?.destination?.country_code || 'unknown';
      [originCountry, destCountry].forEach(country => {
        if (country !== 'unknown') {
          if (countries.has(country)) {
            const existing = countries.get(country)!;
            existing.count++;
            countries.set(country, existing);
          } else {
            countries.set(country, { country, count: 1 });
          }
        }
      });

      // Extract price range
      const amount = offer.total_amount?.amount ?? offer.total_amount;
      const price = parseFloat(amount) || 0;
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;

      // Extract duration range
      const duration = FlightMetadataProcessor.calculateTotalDuration(offer);
      if (duration < minDuration) minDuration = duration;
      if (duration > maxDuration) maxDuration = duration;

      // Count refundable offers
      if (offer.refundable === true) {
        refundableCount++;
      }
    });

    return {
      airlines: Array.from(airlines.values()),
      stops: Array.from(stopsCount.values()),
      cabinClasses: Array.from(cabinClasses.values()),
      baggageOptions: Array.from(baggageOptions.values()),
      departureTimeBuckets: Array.from(departureTimeBuckets.values()),
      arrivalTimeBuckets: Array.from(arrivalTimeBuckets.values()),
      alliances: Array.from(alliances.values()).filter(a => a.alliance !== 'unknown'),
      countries: Array.from(countries.values()),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice === 0 ? 1000 : maxPrice,
      },
      durationRange: {
        min: minDuration === Infinity ? 0 : minDuration,
        max: maxDuration === 0 ? 1000 : maxDuration,
      },
      refundableCount,
      totalResults: totalOffers,
    };
  }

  /**
   * Extract filter metadata from hotel results
   */
  static extractHotelFilters(hotels: any[]): any {
    const starRatings = new Map<number, { stars: number; count: number }>();
    const amenities = new Map<string, { name: string; count: number }>();
    const propertyTypes = new Map<string, { type: string; count: number }>();
    const boardTypes = new Map<string, { board: string; count: number }>();
    const roomTypes = new Map<string, { room: string; count: number }>();
    const cancellationPolicies = new Map<string, { policy: string; count: number }>();
    const paymentOptions = new Map<string, { option: string; count: number }>();
    const guestPolicies = new Map<string, { policy: string; count: number }>();
    const chainIds = new Map<string, { chain: string; count: number }>();
    let minPrice = Infinity;
    let maxPrice = 0;
    let minRating = Infinity;
    let maxRating = 0;
    let minDistance = Infinity;
    let maxDistance = 0;
    let minGuestRating = Infinity;
    let maxGuestRating = 0;
    let minReviewsCount = Infinity;
    let maxReviewsCount = 0;

    hotels.forEach(hotel => {
      // Extract star rating
      const stars = Math.floor(hotel.star_rating || hotel.stars || 0);
      if (starRatings.has(stars)) {
        const existing = starRatings.get(stars)!;
        existing.count++;
        starRatings.set(stars, existing);
      } else {
        starRatings.set(stars, { stars, count: 1 });
      }

      // Extract amenities
      const hotelAmenities = hotel.amenities || hotel.facilities || [];
      hotelAmenities.forEach((amenity: string) => {
        if (amenities.has(amenity)) {
          const existing = amenities.get(amenity)!;
          existing.count++;
          amenities.set(amenity, existing);
        } else {
          amenities.set(amenity, { name: amenity, count: 1 });
        }
      });

      // Extract property type
      const propertyType = hotel.property_type || hotel.type || 'Hotel';
      if (propertyTypes.has(propertyType)) {
        const existing = propertyTypes.get(propertyType)!;
        existing.count++;
        propertyTypes.set(propertyType, existing);
      } else {
        propertyTypes.set(propertyType, { type: propertyType, count: 1 });
      }

      // Extract board types
      const boards = hotel.board_types || hotel.board || [];
      if (Array.isArray(boards)) {
        boards.forEach((board: string) => {
          if (boardTypes.has(board)) {
            const existing = boardTypes.get(board)!;
            existing.count++;
            boardTypes.set(board, existing);
          } else {
            boardTypes.set(board, { board, count: 1 });
          }
        });
      }

      // Extract room types
      const rooms = hotel.room_types || hotel.room || [];
      if (Array.isArray(rooms)) {
        rooms.forEach((room: string) => {
          if (roomTypes.has(room)) {
            const existing = roomTypes.get(room)!;
            existing.count++;
            roomTypes.set(room, existing);
          } else {
            roomTypes.set(room, { room, count: 1 });
          }
        });
      }

      // Extract cancellation policy
      const cancellation = hotel.cancellation_policy || hotel.cancellation || 'unknown';
      if (cancellationPolicies.has(cancellation)) {
        const existing = cancellationPolicies.get(cancellation)!;
        existing.count++;
        cancellationPolicies.set(cancellation, existing);
      } else {
        cancellationPolicies.set(cancellation, {
          policy: cancellation,
          count: 1,
        });
      }

      // Extract payment options
      const payments = hotel.payment_options || hotel.payment || [];
      if (Array.isArray(payments)) {
        payments.forEach((payment: string) => {
          if (paymentOptions.has(payment)) {
            const existing = paymentOptions.get(payment)!;
            existing.count++;
            paymentOptions.set(payment, existing);
          } else {
            paymentOptions.set(payment, { option: payment, count: 1 });
          }
        });
      }

      // Extract guest policies
      const policies = hotel.guest_policies || hotel.guest || [];
      if (Array.isArray(policies)) {
        policies.forEach((policy: string) => {
          if (guestPolicies.has(policy)) {
            const existing = guestPolicies.get(policy)!;
            existing.count++;
            guestPolicies.set(policy, existing);
          } else {
            guestPolicies.set(policy, { policy, count: 1 });
          }
        });
      }

      // Extract chain ID
      const chain = hotel.chain_id || hotel.chain || 'unknown';
      if (chain !== 'unknown') {
        if (chainIds.has(chain)) {
          const existing = chainIds.get(chain)!;
          existing.count++;
          chainIds.set(chain, existing);
        } else {
          chainIds.set(chain, { chain, count: 1 });
        }
      }

      // Extract price range
      const price = HotelMetadataProcessor.getPricePerNight(hotel);
      if (price < minPrice) minPrice = price;
      if (price > maxPrice) maxPrice = price;

      // Extract rating range (overall rating)
      const rating = hotel.rating || hotel.guest_reviews?.rating || 0;
      if (rating < minRating) minRating = rating;
      if (rating > maxRating) maxRating = rating;

      // Extract guest rating (separate from overall rating)
      const guestRating = hotel.guest_reviews?.rating || hotel.guest_rating || 0;
      if (guestRating < minGuestRating) minGuestRating = guestRating;
      if (guestRating > maxGuestRating) maxGuestRating = guestRating;

      // Extract distance from center (in km)
      const distance = hotel.distance_to_center || hotel.distance || 0;
      if (distance < minDistance) minDistance = distance;
      if (distance > maxDistance) maxDistance = distance;

      // Extract reviews count
      const reviewsCount = hotel.reviews_count || hotel.reviews?.total || 0;
      if (reviewsCount < minReviewsCount) minReviewsCount = reviewsCount;
      if (reviewsCount > maxReviewsCount) maxReviewsCount = reviewsCount;
    });

    // Sort amenities by count (most common first) and take top 20
    const sortedAmenities = Array.from(amenities.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    return {
      starRatings: Array.from(starRatings.values()).sort((a, b) => b.stars - a.stars),
      amenities: sortedAmenities,
      propertyTypes: Array.from(propertyTypes.values()),
      boardTypes: Array.from(boardTypes.values()),
      roomTypes: Array.from(roomTypes.values()),
      cancellationPolicies: Array.from(cancellationPolicies.values()),
      paymentOptions: Array.from(paymentOptions.values()),
      guestPolicies: Array.from(guestPolicies.values()),
      chainIds: Array.from(chainIds.values()),
      priceRange: {
        min: minPrice === Infinity ? 0 : minPrice,
        max: maxPrice === 0 ? 500 : maxPrice,
      },
      ratingRange: {
        min: minRating === Infinity ? 0 : minRating,
        max: maxRating === 0 ? 5 : maxRating,
      },
      guestRatingRange: {
        min: minGuestRating === Infinity ? 0 : minGuestRating,
        max: maxGuestRating === 0 ? 5 : maxGuestRating,
      },
      distanceRange: {
        min: minDistance === Infinity ? 0 : minDistance,
        max: maxDistance === 0 ? 50 : maxDistance,
      },
      reviewsCountRange: {
        min: minReviewsCount === Infinity ? 0 : minReviewsCount,
        max: maxReviewsCount === 0 ? 1000 : maxReviewsCount,
      },
      totalResults: hotels.length,
    };
  }
}

/**
 * Main metadata processing service with caching using OTA pattern
 */
export class MetadataProcessingService {
  /**
   * Process flight search with OTA caching pattern
   * Returns searchId for reference
   */
  static async processFlightSearch(
    params: Record<string, any>,
    fetchRawData: () => Promise<{
      rawResponse: any;
      offers: any[];
      searchId?: string;
    }>,
    rules?: Partial<BusinessRules>
  ): Promise<{
    data: any[];
    cached: boolean;
    source: string;
    searchId: string;
    filters: any;
  }> {
    // Generate or use provided searchId
    let searchId =
      params.searchId || `flight_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Check if we have cached results for this searchId
    const resultsKey = CacheKeys.flightSearchResults(searchId);
    const cachedResults = await CacheService.get<any[]>(resultsKey);

    if (cachedResults) {
      // Try to get filters from cache
      const filtersKey = CacheKeys.flightSearchFilters(searchId);
      const cachedFilters =
        (await CacheService.get<any>(filtersKey)) ||
        FilterMetadataExtractor.extractFlightFilters(cachedResults);

      return {
        data: cachedResults,
        cached: true,
        source: 'redis-results',
        searchId,
        filters: cachedFilters,
      };
    }

    // Check for raw data cache (legacy or new)
    const rawKey = CacheKeys.flightSearchRaw(searchId);
    let rawResponseData = await CacheService.get<any>(rawKey);
    let source = 'redis-raw';

    if (!rawResponseData) {
      // Fetch raw data from supplier
      const fetchResult = await fetchRawData();
      rawResponseData = fetchResult.rawResponse;
      source = 'api';

      // Use searchId from fetch result if available
      if (fetchResult.searchId) {
        searchId = fetchResult.searchId;
      }

      // Cache raw response
      await CacheService.set(
        CacheKeys.flightSearchRaw(searchId),
        rawResponseData,
        CACHE_TTL.FLIGHT_SEARCH
      );
    }

    // Extract offers from raw response
    const offers = rawResponseData.offers || rawResponseData.data?.offers || rawResponseData;
    if (!Array.isArray(offers)) {
      throw new Error('Invalid flight data format');
    }

    // Process data
    const processedData = FlightMetadataProcessor.process(offers, params, rules);

    // Extract filter metadata
    const filters = FilterMetadataExtractor.extractFlightFilters(processedData);

    // Cache all components - use Promise.allSettled to prevent single failure from losing entire result
    const cacheOperations = [
      // Cache normalized results
      CacheService.set(
        CacheKeys.flightSearchResults(searchId),
        processedData,
        CACHE_TTL.PROCESSED_RESULTS
      ),
      // Cache filter metadata
      CacheService.set(
        CacheKeys.flightSearchFilters(searchId),
        filters,
        CACHE_TTL.PROCESSED_RESULTS
      ),
    ];

    // Add sorted set operations with individual error handling
    for (let index = 0; index < processedData.length; index++) {
      const offer = processedData[index];
      const amount = offer.total_amount?.amount ?? offer.total_amount;
      const price = parseFloat(amount) || 0;
      const duration = FlightMetadataProcessor.calculateTotalDuration(offer);
      const memberId = offer.id || `offer_${index}`;

      cacheOperations.push(
        CacheService.zadd(CacheKeys.flightSearchSortPrice(searchId), price, memberId).catch(
          () => {}
        ),
        CacheService.zadd(CacheKeys.flightSearchSortDuration(searchId), duration, memberId).catch(
          () => {}
        )
      );
    }

    await Promise.allSettled(cacheOperations);

    // Set expiry on sorted sets
    await CacheService.expire(
      CacheKeys.flightSearchSortPrice(searchId),
      CACHE_TTL.PROCESSED_RESULTS
    );
    await CacheService.expire(
      CacheKeys.flightSearchSortDuration(searchId),
      CACHE_TTL.PROCESSED_RESULTS
    );

    return {
      data: processedData,
      cached: false,
      source,
      searchId,
      filters,
    };
  }

  /**
   * Process hotel search with OTA caching pattern
   */
  static async processHotelSearch(
    params: Record<string, any>,
    fetchRawData: () => Promise<{
      rawResponse: any;
      hotels: any[];
      searchId?: string;
    }>,
    rules?: Partial<BusinessRules>
  ): Promise<{
    data: any[];
    cached: boolean;
    source: string;
    searchId: string;
    filters: any;
  }> {
    // Generate or use provided searchId
    let searchId =
      params.searchId || `hotel_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;

    // Check if we have cached results for this searchId
    const resultsKey = CacheKeys.hotelSearchResults(searchId);
    const cachedResults = await CacheService.get<any[]>(resultsKey);

    if (cachedResults) {
      // Try to get filters from cache
      const filtersKey = CacheKeys.hotelSearchFilters(searchId);
      const cachedFilters =
        (await CacheService.get<any>(filtersKey)) ||
        FilterMetadataExtractor.extractHotelFilters(cachedResults);

      return {
        data: cachedResults,
        cached: true,
        source: 'redis-results',
        searchId,
        filters: cachedFilters,
      };
    }

    // Check for raw data cache
    const rawKey = CacheKeys.hotelSearchRaw(searchId);
    let rawResponseData = await CacheService.get<any>(rawKey);
    let source = 'redis-raw';

    if (!rawResponseData) {
      // Fetch raw data from supplier
      const fetchResult = await fetchRawData();
      rawResponseData = fetchResult.rawResponse;
      source = 'api';

      // Use searchId from fetch result if available
      if (fetchResult.searchId) {
        searchId = fetchResult.searchId;
      }

      // Cache raw response
      await CacheService.set(
        CacheKeys.hotelSearchRaw(searchId),
        rawResponseData,
        CACHE_TTL.HOTEL_SEARCH
      );
    }

    // Extract hotels from raw response
    const hotels = rawResponseData.hotels || rawResponseData.data?.hotels || rawResponseData;
    if (!Array.isArray(hotels)) {
      throw new Error('Invalid hotel data format');
    }

    // Process data
    const processedData = HotelMetadataProcessor.process(hotels, params, rules);

    // Extract filter metadata
    const filters = FilterMetadataExtractor.extractHotelFilters(processedData);

    // Cache all components - use Promise.allSettled to prevent single failure from losing entire result
    const hotelCacheOperations = [
      // Cache normalized results
      CacheService.set(
        CacheKeys.hotelSearchResults(searchId),
        processedData,
        CACHE_TTL.PROCESSED_RESULTS
      ),
      // Cache filter metadata
      CacheService.set(
        CacheKeys.hotelSearchFilters(searchId),
        filters,
        CACHE_TTL.PROCESSED_RESULTS
      ),
    ];

    // Add sorted set operations with individual error handling
    for (let index = 0; index < processedData.length; index++) {
      const hotel = processedData[index];
      const price = HotelMetadataProcessor.getPricePerNight(hotel);
      const rating = hotel.rating || hotel.guest_reviews?.rating || 0;
      const memberId = hotel.id || hotel.hotelId || `hotel_${index}`;

      hotelCacheOperations.push(
        CacheService.zadd(CacheKeys.hotelSearchSortPrice(searchId), price, memberId)
          .catch(() => false) as Promise<boolean>
      );
      hotelCacheOperations.push(
        CacheService.zadd(CacheKeys.hotelSearchSortRating(searchId), rating, memberId)
          .catch(() => false) as Promise<boolean>
      );
    }

    await Promise.allSettled(hotelCacheOperations as Promise<boolean>[]);

    // Set expiry on sorted sets
    await CacheService.expire(
      CacheKeys.hotelSearchSortPrice(searchId),
      CACHE_TTL.PROCESSED_RESULTS
    );
    await CacheService.expire(
      CacheKeys.hotelSearchSortRating(searchId),
      CACHE_TTL.PROCESSED_RESULTS
    );

    return {
      data: processedData,
      cached: false,
      source,
      searchId,
      filters,
    };
  }

  /**
   * Get flight filters for a searchId
   */
  static async getFlightFilters(searchId: string): Promise<any> {
    const filtersKey = CacheKeys.flightSearchFilters(searchId);
    const filters = await CacheService.get<any>(filtersKey);

    if (!filters) {
      // Try to extract from results
      const resultsKey = CacheKeys.flightSearchResults(searchId);
      const results = await CacheService.get<any[]>(resultsKey);
      if (results) {
        return FilterMetadataExtractor.extractFlightFilters(results);
      }
      throw new Error(`No flight search found for searchId: ${searchId}`);
    }

    return filters;
  }

  /**
   * Get hotel filters for a searchId
   */
  static async getHotelFilters(searchId: string): Promise<any> {
    const filtersKey = CacheKeys.hotelSearchFilters(searchId);
    const filters = await CacheService.get<any>(filtersKey);

    if (!filters) {
      // Try to extract from results
      const resultsKey = CacheKeys.hotelSearchResults(searchId);
      const results = await CacheService.get<any[]>(resultsKey);
      if (results) {
        return FilterMetadataExtractor.extractHotelFilters(results);
      }
      throw new Error(`No hotel search found for searchId: ${searchId}`);
    }

    return filters;
  }

  /**
   * Get sorted flight results
   */
  static async getSortedFlights(
    searchId: string,
    sortBy: 'price' | 'duration',
    limit: number = 50
  ): Promise<string[]> {
    const sortKey =
      sortBy === 'price'
        ? CacheKeys.flightSearchSortPrice(searchId)
        : CacheKeys.flightSearchSortDuration(searchId);

    return await CacheService.zrange(sortKey, 0, limit - 1);
  }

  /**
   * Get sorted hotel results
   */
  static async getSortedHotels(
    searchId: string,
    sortBy: 'price' | 'rating',
    limit: number = 50
  ): Promise<string[]> {
    const sortKey =
      sortBy === 'price'
        ? CacheKeys.hotelSearchSortPrice(searchId)
        : CacheKeys.hotelSearchSortRating(searchId);

    return await CacheService.zrange(sortKey, 0, limit - 1);
  }

  /**
   * Invalidate cache for specific searchId
   */
  static async invalidateSearchCache(searchId: string, type: 'flight' | 'hotel'): Promise<void> {
    const keys =
      type === 'flight'
        ? [
            CacheKeys.flightSearchRaw(searchId),
            CacheKeys.flightSearchResults(searchId),
            CacheKeys.flightSearchFilters(searchId),
            CacheKeys.flightSearchSortPrice(searchId),
            CacheKeys.flightSearchSortDuration(searchId),
          ]
        : [
            CacheKeys.hotelSearchRaw(searchId),
            CacheKeys.hotelSearchResults(searchId),
            CacheKeys.hotelSearchFilters(searchId),
            CacheKeys.hotelSearchSortPrice(searchId),
            CacheKeys.hotelSearchSortRating(searchId),
          ];

    await Promise.all(keys.map(key => CacheService.delete(key)));
  }

  /**
   * Legacy method for backward compatibility
   */
  static async processFlightSearchLegacy(
    params: Record<string, any>,
    fetchRawData: () => Promise<any[]>,
    rules?: Partial<BusinessRules>
  ): Promise<{ data: any[]; cached: boolean; source: string }> {
    const processedCacheKey = CacheKeys.flightSearchProcessed(params);

    // 1. Check cache for processed results
    const cachedProcessed = await CacheService.get<any[]>(processedCacheKey);
    if (cachedProcessed) {
      return { data: cachedProcessed, cached: true, source: 'redis-processed' };
    }

    const rawCacheKey = CacheKeys.flightSearch(params);

    // 2. Check cache for raw data
    let rawData = await CacheService.get<any[]>(rawCacheKey);
    let source = 'redis-raw';

    if (!rawData) {
      // 3. Fetch raw data from supplier
      rawData = await fetchRawData();
      source = 'api';

      // Cache raw data
      await CacheService.set(rawCacheKey, rawData, CACHE_TTL.FLIGHT_SEARCH);
    }

    // 4. Process data
    const processedData = FlightMetadataProcessor.process(rawData, params, rules);

    // 5. Cache processed data
    await CacheService.set(processedCacheKey, processedData, CACHE_TTL.PROCESSED_RESULTS);

    return { data: processedData, cached: false, source };
  }

  /**
   * Legacy method for backward compatibility
   */
  static async processHotelSearchLegacy(
    params: Record<string, any>,
    fetchRawData: () => Promise<any[]>,
    rules?: Partial<BusinessRules>
  ): Promise<{ data: any[]; cached: boolean; source: string }> {
    const processedCacheKey = CacheKeys.hotelSearchProcessed(params);

    // 1. Check cache for processed results
    const cachedProcessed = await CacheService.get<any[]>(processedCacheKey);
    if (cachedProcessed) {
      return { data: cachedProcessed, cached: true, source: 'redis-processed' };
    }

    const rawCacheKey = CacheKeys.hotelSearch(params);

    // 2. Check cache for raw data
    let rawData = await CacheService.get<any[]>(rawCacheKey);
    let source = 'redis-raw';

    if (!rawData) {
      // 3. Fetch raw data from supplier
      rawData = await fetchRawData();
      source = 'api';

      // Cache raw data
      await CacheService.set(rawCacheKey, rawData, CACHE_TTL.HOTEL_SEARCH);
    }

    // 4. Process data
    const processedData = HotelMetadataProcessor.process(rawData, params, rules);

    // 5. Cache processed data
    await CacheService.set(processedCacheKey, processedData, CACHE_TTL.PROCESSED_RESULTS);

    return { data: processedData, cached: false, source };
  }

  /**
   * Legacy invalidateCache method for backward compatibility
   */
  static async invalidateCache(
    params: Record<string, any>,
    type: 'flight' | 'hotel'
  ): Promise<void> {
    const rawKey =
      type === 'flight' ? CacheKeys.flightSearch(params) : CacheKeys.hotelSearch(params);
    const processedKey =
      type === 'flight'
        ? CacheKeys.flightSearchProcessed(params)
        : CacheKeys.hotelSearchProcessed(params);

    await Promise.all([CacheService.delete(rawKey), CacheService.delete(processedKey)]);
  }
}

/**
 * Cache warming service for pre-loading frequently accessed data
 */
class CacheWarmingService {
  /**
   * Warm cache for popular flight searches
   */
  static async warmPopularFlightSearches(
    popularSearches: Array<{
      origin: string;
      destination: string;
      departureDate: string;
      returnDate?: string;
      passengers: number;
    }>,
    fetchFunction: (params: any) => Promise<any>
  ): Promise<void> {
    console.log('[CacheWarming] Starting to warm popular flight searches');

    for (const search of popularSearches) {
      try {
        const searchId = `warm_flight_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const params = {
          ...search,
          searchId,
          cabin_class: 'economy',
        };

        // Use MetadataProcessingService to process and cache
        await MetadataProcessingService.processFlightSearch(
          params,
          async () => {
            const rawResponse = await fetchFunction(search);
            return {
              rawResponse,
              offers: rawResponse.offers || rawResponse.data?.offers || [],
              searchId,
            };
          },
          {} // Default business rules
        );

        console.log(
          `[CacheWarming] Warmed flight search: ${search.origin} -> ${search.destination}`
        );
      } catch (error: unknown) {
        console.error(
          `[CacheWarming] Failed to warm flight search ${search.origin}->${search.destination}:`,
          error
        );
      }
    }

    console.log('[CacheWarming] Completed warming popular flight searches');
  }

  /**
   * Warm cache for popular hotel searches
   */
  static async warmPopularHotelSearches(
    popularSearches: Array<{
      cityId: string;
      checkin: string;
      checkout: string;
      guests: number;
      rooms: number;
    }>,
    fetchFunction: (params: any) => Promise<any>
  ): Promise<void> {
    console.log('[CacheWarming] Starting to warm popular hotel searches');

    for (const search of popularSearches) {
      try {
        const searchId = `warm_hotel_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        const params = {
          ...search,
          searchId,
        };

        // Use MetadataProcessingService to process and cache
        await MetadataProcessingService.processHotelSearch(
          params,
          async () => {
            const rawResponse = await fetchFunction(search);
            return {
              rawResponse,
              hotels: rawResponse.hotels || rawResponse.data?.hotels || [],
              searchId,
            };
          },
          {} // Default business rules
        );

        console.log(
          `[CacheWarming] Warmed hotel search: ${search.cityId} (${search.checkin} - ${search.checkout})`
        );
      } catch (error: unknown) {
        console.error(`[CacheWarming] Failed to warm hotel search ${search.cityId}:`, error);
      }
    }

    console.log('[CacheWarming] Completed warming popular hotel searches');
  }

  /**
   * Refresh expiring cache entries in background
   */
  static async refreshExpiringEntries(
    type: 'flight' | 'hotel',
    thresholdSeconds: number = 60 // Refresh entries expiring within this time
  ): Promise<void> {
    console.log(`[CacheWarming] Refreshing expiring ${type} cache entries`);

    // This is a simplified implementation
    // In production, you would:
    // 1. Scan for keys with TTL < thresholdSeconds
    // 2. Extract search parameters from keys
    // 3. Re-fetch and update cache

    // For now, just log the intent
    console.log(
      `[CacheWarming] Would refresh expiring ${type} entries with TTL < ${thresholdSeconds}s`
    );
  }

  /**
   * Get cache statistics for monitoring
   */
  static async getCacheStats(): Promise<{
    flightKeys: number;
    hotelKeys: number;
    memoryUsage: string;
  }> {
    // Simplified implementation
    // In production, use Redis INFO command or scan keys
    return {
      flightKeys: 0,
      hotelKeys: 0,
      memoryUsage: '0MB',
    };
  }
}

/**
 * Metrics and monitoring service for cache performance
 */
class CacheMetricsService {
  private static metrics = {
    flightCacheHits: 0,
    flightCacheMisses: 0,
    hotelCacheHits: 0,
    hotelCacheMisses: 0,
    totalFlightRequests: 0,
    totalHotelRequests: 0,
    flightResponseTimes: [] as number[],
    hotelResponseTimes: [] as number[],
    errors: 0,
    lastUpdated: Date.now(),
  };

  /**
   * Record cache hit for flight search
   */
  static recordFlightCacheHit(responseTimeMs: number): void {
    this.metrics.flightCacheHits++;
    this.metrics.totalFlightRequests++;
    this.metrics.flightResponseTimes.push(responseTimeMs);
    this.trimResponseTimes();
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Record cache miss for flight search
   */
  static recordFlightCacheMiss(responseTimeMs: number): void {
    this.metrics.flightCacheMisses++;
    this.metrics.totalFlightRequests++;
    this.metrics.flightResponseTimes.push(responseTimeMs);
    this.trimResponseTimes();
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Record cache hit for hotel search
   */
  static recordHotelCacheHit(responseTimeMs: number): void {
    this.metrics.hotelCacheHits++;
    this.metrics.totalHotelRequests++;
    this.metrics.hotelResponseTimes.push(responseTimeMs);
    this.trimResponseTimes();
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Record cache miss for hotel search
   */
  static recordHotelCacheMiss(responseTimeMs: number): void {
    this.metrics.hotelCacheMisses++;
    this.metrics.totalHotelRequests++;
    this.metrics.hotelResponseTimes.push(responseTimeMs);
    this.trimResponseTimes();
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Record error
   */
  static recordError(): void {
    this.metrics.errors++;
    this.metrics.lastUpdated = Date.now();
  }

  /**
   * Get current metrics
   */
  static getMetrics() {
    const flightHitRate =
      this.metrics.totalFlightRequests > 0
        ? (this.metrics.flightCacheHits / this.metrics.totalFlightRequests) * 100
        : 0;

    const hotelHitRate =
      this.metrics.totalHotelRequests > 0
        ? (this.metrics.hotelCacheHits / this.metrics.totalHotelRequests) * 100
        : 0;

    const avgFlightResponseTime =
      this.metrics.flightResponseTimes.length > 0
        ? this.metrics.flightResponseTimes.reduce((a, b) => a + b, 0) /
          this.metrics.flightResponseTimes.length
        : 0;

    const avgHotelResponseTime =
      this.metrics.hotelResponseTimes.length > 0
        ? this.metrics.hotelResponseTimes.reduce((a, b) => a + b, 0) /
          this.metrics.hotelResponseTimes.length
        : 0;

    return {
      ...this.metrics,
      flightHitRate: Math.round(flightHitRate * 100) / 100, // Round to 2 decimal places
      hotelHitRate: Math.round(hotelHitRate * 100) / 100,
      avgFlightResponseTime: Math.round(avgFlightResponseTime * 100) / 100,
      avgHotelResponseTime: Math.round(avgHotelResponseTime * 100) / 100,
      flightResponseTimeP95: this.calculatePercentile(this.metrics.flightResponseTimes, 95),
      hotelResponseTimeP95: this.calculatePercentile(this.metrics.hotelResponseTimes, 95),
    };
  }

  /**
   * Reset metrics
   */
  static resetMetrics(): void {
    this.metrics = {
      flightCacheHits: 0,
      flightCacheMisses: 0,
      hotelCacheHits: 0,
      hotelCacheMisses: 0,
      totalFlightRequests: 0,
      totalHotelRequests: 0,
      flightResponseTimes: [],
      hotelResponseTimes: [],
      errors: 0,
      lastUpdated: Date.now(),
    };
  }

  /**
   * Export metrics for external monitoring systems (Prometheus, etc.)
   */
  static exportMetrics(): Record<string, number> {
    const metrics = this.getMetrics();
    return {
      cache_flight_hits: metrics.flightCacheHits,
      cache_flight_misses: metrics.flightCacheMisses,
      cache_hotel_hits: metrics.hotelCacheHits,
      cache_hotel_misses: metrics.hotelCacheMisses,
      cache_flight_hit_rate: metrics.flightHitRate,
      cache_hotel_hit_rate: metrics.hotelHitRate,
      cache_errors: metrics.errors,
      cache_avg_flight_response_time_ms: metrics.avgFlightResponseTime,
      cache_avg_hotel_response_time_ms: metrics.avgHotelResponseTime,
    };
  }

  private static trimResponseTimes(): void {
    // Keep only last 1000 response times to prevent memory growth
    if (this.metrics.flightResponseTimes.length > 1000) {
      this.metrics.flightResponseTimes = this.metrics.flightResponseTimes.slice(-1000);
    }
    if (this.metrics.hotelResponseTimes.length > 1000) {
      this.metrics.hotelResponseTimes = this.metrics.hotelResponseTimes.slice(-1000);
    }
  }

  private static calculatePercentile(values: number[], percentile: number): number {
    if (values.length === 0) return 0;

    const sorted = [...values].sort((a, b) => a - b);
    const index = Math.ceil((percentile / 100) * sorted.length) - 1;
    return sorted[Math.max(0, index)];
  }
}
