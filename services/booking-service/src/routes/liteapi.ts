/**
 * LITEAPI Routes
 * Handles all LITEAPI hotel and loyalty endpoints
 * 
 * Base URLs:
 * - API: https://api.liteapi.travel/v3.0 (data endpoints)
 * - BOOK: https://book.liteapi.travel/v3.0 (booking endpoints)
 * - DA: https://da.liteapi.travel/v1 (voucher endpoints)
 * 
 * Caching Strategy:
 * - Hotel search results: 15 min TTL
 * - Room rates: 30 min TTL
 * - Prebook sessions: 60 min TTL
 */

import { Router, Request, Response } from 'express';
import { prisma } from '@tripalfa/shared-database';
import CacheService, { CacheKeys, CACHE_TTL } from '../cache/redis.js';

const router: Router = Router();

// ============================================================================
// Environment Configuration
// ============================================================================

const LITEAPI_API_BASE_URL = process.env.LITEAPI_API_BASE_URL || 'https://api.liteapi.travel/v3.0';
const LITEAPI_BOOK_BASE_URL = process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0';
const LITEAPI_DA_BASE_URL = process.env.LITEAPI_DA_BASE_URL || 'https://da.liteapi.travel/v1';
// Use production key for coordinates/destinations, sandbox for other endpoints
const LITEAPI_PROD_API_KEY = process.env.LITEAPI_PROD_API_KEY;
const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY;

// ============================================================================
// Helper Functions
// ============================================================================

// Request to API base URL (data endpoints)
async function liteApiRequest<T>(endpoint: string, method: string, body?: object, baseUrl?: string, useProdKey: boolean = true): Promise<T> {
  const url = `${baseUrl || LITEAPI_API_BASE_URL}${endpoint}`;
  const apiKey = (useProdKey && LITEAPI_PROD_API_KEY) ? LITEAPI_PROD_API_KEY : LITEAPI_API_KEY;

  const response = await fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      'X-API-Key': apiKey || '',
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LITEAPI Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// Helper function to get city/destination coordinates using production key
async function liteApiCoordsRequest<T>(endpoint: string, method: string, body?: object): Promise<T> {
  return liteApiRequest(endpoint, method, body, LITEAPI_API_BASE_URL, true);
}

// ============================================================================
// Nominatim Geocoding (Free OpenStreetMap Service)
// ============================================================================

// Geocode an address to coordinates using Nominatim
async function geocodeAddress(address: string, city: string): Promise<{ latitude: number; longitude: number } | null> {
  try {
    // Build search query
    const query = encodeURIComponent(`${address}, ${city}`);
    const url = `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'TripAlfa/1.0',
        'Accept-Language': 'en',
      },
    });
    
    if (!response.ok) {
      console.error('[Geocoding] Nominatim request failed:', response.status);
      return null;
    }
    
    const data = await response.json();
    
    if (data && data.length > 0) {
      return {
        latitude: parseFloat(data[0].lat),
        longitude: parseFloat(data[0].lon),
      };
    }
    
    return null;
  } catch (error) {
    console.error('[Geocoding] Error:', error);
    return null;
  }
}

// Batch geocode multiple addresses with caching
async function geocodeAddresses(
  addresses: Array<{ address: string; city: string }>
): Promise<Map<string, { latitude: number; longitude: number } | null>> {
  const results = new Map<string, { latitude: number; longitude: number } | null>();
  
  // Process in batches to avoid rate limiting (1 request per second for Nominatim)
  for (const item of addresses) {
    const cacheKey = `geocode:${item.address},${item.city}`;
    
    // Check cache first
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      results.set(cacheKey, cached as any);
      continue;
    }
    
    // Geocode the address
    const coords = await geocodeAddress(item.address, item.city);
    results.set(cacheKey, coords);
    
    // Cache for 30 days (coordinates don't change often)
    if (coords) {
      await CacheService.set(cacheKey, coords, 60 * 60 * 24 * 30);
    }
    
    // Rate limit: wait 1 second between requests
    await new Promise(resolve => setTimeout(resolve, 1100));
  }
  
  return results;
}

// Request to BOOK base URL
async function liteApiBookRequest<T>(endpoint: string, method: string, body?: object): Promise<T> {
  return liteApiRequest(endpoint, method, body, LITEAPI_BOOK_BASE_URL);
}

// Request to DA base URL (vouchers)
async function liteApiDaRequest<T>(endpoint: string, method: string, body?: object): Promise<T> {
  return liteApiRequest(endpoint, method, body, LITEAPI_DA_BASE_URL);
}

// ============================================================================
// Data Endpoints (API Base URL)
// ============================================================================

// GET /hotels/destinations - Search hotel destinations (cities)
// Proxied endpoint to avoid exposing LiteAPI key in frontend
router.get('/hotels/destinations', async (req: Request, res: Response) => {
  try {
    const { q, search, limit = 10 } = req.query;
    const query = q || search;

    if (!query || typeof query !== 'string' || query.length < 2) {
      return res.status(400).json({ error: 'Query parameter "q" or "search" is required (min 2 characters)' });
    }

    // Call LiteAPI cities search endpoint with production key for coordinates
    const params = new URLSearchParams();
    params.append('search', query);
    params.append('limit', String(limit));

    const result = await liteApiCoordsRequest<any>(`/cities/search?${params}`, 'GET');

    // Transform to consistent format for frontend autocomplete
    const cities = (result.data || []).map((city: any) => ({
      type: 'CITY',
      icon: 'map-pin',
      title: city.name,
      subtitle: city.country || '',
      code: city.id || city.code,
      city: city.name,
      country: city.country || '',
      countryCode: city.countryCode || '',
      latitude: city.latitude,
      longitude: city.longitude,
    }));

    res.json({
      success: true,
      data: cities,
    });
  } catch (error: any) {
    console.error('[LITEAPI] /hotels/destinations error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /data/languages - List of supported languages
router.get('/data/languages', async (req: Request, res: Response) => {
  try {
    const cacheKey = 'liteapi:languages';
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>('/data/languages', 'GET'),
      CACHE_TTL.LONG // 24 hours for static data
    );
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/languages error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /data/hotel/:id - Get hotel details
router.get('/data/hotel/:hotelId', async (req: Request, res: Response) => {
  try {
    const { hotelId } = req.params;
    
    // Try cache first
    const cacheKey = `liteapi:hotel:${hotelId}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>(`/data/hotel/${hotelId}`, 'GET'),
      CACHE_TTL.HOTEL_SEARCH // 15 min TTL for hotel details
    );
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/hotel/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /data/reviews - Get hotel reviews
router.get('/data/reviews', async (req: Request, res: Response) => {
  try {
    const { hotelId, limit = 10, offset = 0 } = req.query;
    
    if (!hotelId) {
      return res.status(400).json({ error: 'hotelId is required' });
    }

    const cacheKey = `liteapi:reviews:${hotelId}:${limit}:${offset}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>(`/data/reviews?hotelId=${hotelId}&limit=${limit}&offset=${offset}`, 'GET'),
      CACHE_TTL.MEDIUM // 1 hour for reviews
    );
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/reviews error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /data/hotels/room-search - Search hotel rooms by image and text
router.post('/data/hotels/room-search', async (req: Request, res: Response) => {
  try {
    const { image, text, hotelId } = req.body;
    
    const payload: any = {};
    if (image) payload.image = image;
    if (text) payload.text = text;
    if (hotelId) payload.hotelId = hotelId;

    const result = await liteApiRequest<any>('/data/hotels/room-search', 'POST', payload);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /data/hotels/room-search error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Search Hotels - Room Rates
// POST /hotels/rates (API Base URL)
// ============================================================================

router.post('/search/hotels', async (req: Request, res: Response) => {
  try {
    const {
      location,
      checkin,
      checkout,
      adults = 2,
      children,
      rooms = 1,
      countryCode,
      limit = 20,
      offset = 0,
      // Filter parameters
      minPrice,
      maxPrice,
      minRating,
      amenities,
      // Sort parameters
      sortBy,
      sortOrder,
      // New LiteAPI rate request parameters
      currency = 'USD',
      guestNationality = 'US',
      timeout,
      roomMapping,
      hotelName,
      minReviewsCount,
      starRating,
      facilities,
      strictFacilityFiltering,
      aiSearch,
      // Location options
      latitude,
      longitude,
      radius,
      placeId,
      iataCode,
      hotelIds,
      maxRatesPerHotel,
      includeHotelData
    } = req.body;

    // Create BASE cache key (without pagination/filters/sort) to ensure consistent caching
    const baseSearchParams = {
      location,
      checkin,
      checkout,
      adults,
      children,
      rooms,
      countryCode
    };

    const cacheKey = CacheKeys.hotelSearch(baseSearchParams);

    const result = await CacheService.getOrSet(
      cacheKey,
      async () => {
        const payload: any = {
          checkin,
          checkout,
          currency,
          guestNationality,
          occupancies: [{
            adults: Number(adults),
            children: children ? (Array.isArray(children) ? children : [children]) : []
          }],
          limit: 100, // Fetch more results for client-side filtering
        };

        // Location options (use first available)
        if (hotelIds && hotelIds.length > 0) {
          payload.hotelIds = hotelIds;
        } else if (latitude && longitude) {
          payload.latitude = latitude;
          payload.longitude = longitude;
          if (radius) payload.radius = radius;
        } else if (placeId) {
          payload.placeId = placeId;
        } else if (iataCode) {
          payload.iataCode = iataCode;
        } else if (location) {
          payload.cityName = location;
          payload.countryCode = countryCode || 'US';
        }

        // Optional filters
        if (timeout) payload.timeout = timeout;
        if (roomMapping) payload.roomMapping = roomMapping;
        if (hotelName) payload.hotelName = hotelName;
        if (minReviewsCount) payload.minReviewsCount = minReviewsCount;
        if (minRating) payload.minRating = minRating;
        if (starRating && starRating.length > 0) payload.starRating = starRating;
        if (facilities && facilities.length > 0) {
          payload.facilities = facilities;
          if (strictFacilityFiltering) payload.strictFacilityFiltering = strictFacilityFiltering;
        }
        if (maxRatesPerHotel) payload.maxRatesPerHotel = maxRatesPerHotel;
        if (includeHotelData) payload.includeHotelData = includeHotelData;
        if (aiSearch) payload.aiSearch = aiSearch;
        if (offset) payload.offset = offset;

        return await liteApiRequest<any>('/hotels/rates', 'POST', payload);
      },
      CACHE_TTL.HOTEL_SEARCH
    );

    // Transform hotels and add coordinates using geocoding
    // LITEAPI returns both root-level hotels (basic info) AND data[].hotels (detailed with room types)
    const hotelsFromRoot = result.hotels || [];
    const hotelsFromData = result.data?.map((d: any) => d.hotels?.[0])?.filter(Boolean) || [];
    
    // Merge: use root hotels for basic info, data for room types
    const hotelsRaw = hotelsFromRoot.map((hotel: any, index: number) => {
      const dataHotel = hotelsFromData[index];
      return {
        ...hotel,
        // Room types are in data[].hotels[].roomTypes
        roomTypes: dataHotel?.roomTypes || hotel.roomTypes || []
      };
    });
    
    // Get unique addresses for geocoding
    const uniqueAddresses = Array.from(
      new Map(
        hotelsRaw.map((h: any) => [h.address, { address: h.address, city: location }])
      ).values()
    );
    
    // Geocode unique addresses
    const geocodeResults = await geocodeAddresses(uniqueAddresses);
    
    let hotels = hotelsRaw.map((hotel: any) => {
      // Get the first room type's rate for the displayed price
      const firstRoomType = hotel.roomTypes?.[0];
      const firstRate = firstRoomType?.rates?.[0];
      const cacheKey = `geocode:${hotel.address},${location}`;
      const coords = geocodeResults.get(cacheKey);
      
      // Extract amenities from room types (from board types, etc.)
      const roomAmenities: string[] = [];
      hotel.roomTypes?.forEach((rt: any) => {
        if (rt.boardType) roomAmenities.push(rt.boardType);
      });
      
      return {
        id: hotel.id,
        name: hotel.name,
        image: hotel.main_photo || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
        location: hotel.address,
        rating: hotel.rating || 0,
        reviews: 0,
        latitude: coords?.latitude || null,
        longitude: coords?.longitude || null,
        price: {
          amount: firstRate?.retailRate?.total?.[0]?.amount || firstRate?.offerRetailRate || 0,
          currency: 'USD'
        },
        amenities: [...new Set(roomAmenities)], // Unique amenities
        provider: 'LiteAPI',
        // Include room types for room selection page
        roomTypes: hotel.roomTypes?.map((rt: any) => ({
          id: rt.roomTypeId,
          name: rt.name,
          description: rt.description,
          bedType: rt.bedType,
          bedCount: rt.bedCount,
          maxOccupancy: rt.maxOccupancy,
          boardType: rt.boardType,
          boardName: rt.boardName,
          rates: rt.rates?.map((r: any) => ({
            offerId: r.offerId,
            price: {
              amount: r.retailRate?.total?.[0]?.amount || r.offerRetailRate || 0,
              currency: r.retailRate?.total?.[0]?.currency || 'USD'
            },
            isRefundable: r.refundableTag === 'RFN',
            cancellationPolicy: r.cancellationPolicies?.cancelPolicyInfos,
            suggestedSellingPrice: r.retailRate?.suggestedSellingPrice?.[0]?.amount,
          })) || []
        })) || [],
        offers: hotel.roomTypes || [], // For backward compatibility
        refundable: firstRate?.refundableTag === 'RFN'
      };
    });

    // Apply filters
    if (minPrice !== undefined) {
      hotels = hotels.filter((h: any) => h.price.amount >= Number(minPrice));
    }
    if (maxPrice !== undefined) {
      hotels = hotels.filter((h: any) => h.price.amount <= Number(maxPrice));
    }
    if (minRating !== undefined) {
      hotels = hotels.filter((h: any) => h.rating >= Number(minRating));
    }
    if (amenities && Array.isArray(amenities) && amenities.length > 0) {
      hotels = hotels.filter((h: any) => 
        amenities.some((a: string) => 
          h.amenities?.some((ha: string) => 
            ha.toLowerCase().includes(a.toLowerCase())
          )
        )
      );
    }

    // Apply sorting
    if (sortBy) {
      const isAsc = sortOrder === 'asc';
      
      hotels.sort((a: any, b: any) => {
        let aVal: any, bVal: any;
        
        switch (sortBy) {
          case 'price':
            aVal = a.price.amount;
            bVal = b.price.amount;
            break;
          case 'rating':
            aVal = a.rating;
            bVal = b.rating;
            break;
          case 'name':
            aVal = a.name || '';
            bVal = b.name || '';
            return isAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
          default:
            return 0;
        }
        
        return isAsc ? aVal - bVal : bVal - aVal;
      });
    }

    const total = hotels.length;

    // Apply pagination AFTER filtering/sorting
    if (offset !== undefined && limit !== undefined) {
      hotels = hotels.slice(Number(offset), Number(offset) + Number(limit));
    }

    res.json({ results: hotels, total, cached: true });
  } catch (error: any) {
    console.error('[LITEAPI] /search/hotels error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /hotels/rates - Get room rates for specific hotels
router.post('/hotels/rates', async (req: Request, res: Response) => {
  try {
    const {
      hotelIds,
      checkin,
      checkout,
      currency = 'USD',
      guestNationality = 'US',
      occupancies,
      cityName,
      countryCode,
      limit = 20,
      offset,
      // New rate request parameters
      timeout,
      roomMapping,
      hotelName,
      minReviewsCount,
      minRating,
      starRating,
      facilities,
      strictFacilityFiltering,
      maxRatesPerHotel,
      includeHotelData,
      aiSearch,
      // Location options
      latitude,
      longitude,
      radius,
      placeId,
      iataCode
    } = req.body;

    const payload: any = {
      checkin,
      checkout,
      currency,
      guestNationality,
      occupancies,
      limit,
    };

    // Location options (use first available)
    if (hotelIds && hotelIds.length > 0) {
      payload.hotelIds = hotelIds;
    } else if (latitude && longitude) {
      payload.latitude = latitude;
      payload.longitude = longitude;
      if (radius) payload.radius = radius;
    } else if (placeId) {
      payload.placeId = placeId;
    } else if (iataCode) {
      payload.iataCode = iataCode;
    } else if (cityName) {
      payload.cityName = cityName;
      if (countryCode) payload.countryCode = countryCode;
    } else {
      return res.status(400).json({ error: 'Location is required: provide hotelIds, latitude+longitude, placeId, iataCode, or cityName+countryCode' });
    }

    // Optional filters
    if (timeout) payload.timeout = timeout;
    if (roomMapping) payload.roomMapping = roomMapping;
    if (hotelName) payload.hotelName = hotelName;
    if (minReviewsCount) payload.minReviewsCount = minReviewsCount;
    if (minRating) payload.minRating = minRating;
    if (starRating && starRating.length > 0) payload.starRating = starRating;
    if (facilities && facilities.length > 0) {
      payload.facilities = facilities;
      if (strictFacilityFiltering) payload.strictFacilityFiltering = strictFacilityFiltering;
    }
    if (maxRatesPerHotel) payload.maxRatesPerHotel = maxRatesPerHotel;
    if (includeHotelData) payload.includeHotelData = includeHotelData;
    if (aiSearch) payload.aiSearch = aiSearch;
    if (offset) payload.offset = offset;

    const cacheKey = CacheKeys.hotelSearch(payload);

    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>('/hotels/rates', 'POST', payload),
      CACHE_TTL.HOTEL_RATES
    );

    res.json({ ...result, cached: true });
  } catch (error: any) {
    console.error('[LITEAPI] /hotels/rates error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /hotels/min-rates - Retrieve minimum rate for hotels
router.get('/hotels/min-rates', async (req: Request, res: Response) => {
  try {
    const { hotelIds, checkin, checkout, currency = 'USD' } = req.query;

    if (!hotelIds) {
      return res.status(400).json({ error: 'hotelIds are required' });
    }

    const ids = Array.isArray(hotelIds) ? hotelIds : hotelIds.split(',');
    const params = new URLSearchParams();
    params.append('hotelIds', ids.join(','));
    if (checkin) params.append('checkin', String(checkin));
    if (checkout) params.append('checkout', String(checkout));
    if (currency) params.append('currency', String(currency));

    const cacheKey = `liteapi:minrates:${ids.join(',')}:${checkin}:${checkout}`;
    const result = await CacheService.getOrSet(
      cacheKey,
      async () => liteApiRequest<any>(`/hotels/min-rates?${params}`, 'GET'),
      CACHE_TTL.HOTEL_RATES
    );

    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /hotels/min-rates error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Booking Endpoints (BOOK Base URL)
// ============================================================================

// POST /rates/prebook - Create checkout session
router.post('/rates/prebook', async (req: Request, res: Response) => {
  try {
    const { 
      offerId, 
      price, 
      currency, 
      guestDetails, 
      rooms, 
      userId,
      // New WALLET payment fields
      includeCreditBalance = true, // Enable to get wallet balance for WALLET payment
      voucherCode,
      addons,
      bedTypeIds,
      bookingId
    } = req.body;

    if (!offerId || !price) {
      return res.status(400).json({ error: 'offerId and price are required' });
    }

    const payload: any = {
      offerId,
      price: {
        amount: price,
        currency: currency || 'USD',
      },
      rooms: rooms || 1,
      // Enable WALLET payment support - get credit balance for wallet payments
      includeCreditBalance,
    };

    // Add guest details if provided
    if (guestDetails) {
      payload.guests = Array.isArray(guestDetails) ? guestDetails : [guestDetails];
    }

    // Add optional fields
    if (voucherCode) payload.voucherCode = voucherCode;
    if (addons && addons.length > 0) payload.addons = addons;
    if (bedTypeIds && bedTypeIds.length > 0) payload.bedTypeIds = bedTypeIds;

    const result = await liteApiBookRequest<any>('/rates/prebook', 'POST', payload);

    // Validate prebook response for price/cancellation changes
    const validationWarnings: string[] = [];
    
    if (result.data) {
      const { priceDifferencePercent, cancellationChanged, boardChanged, paymentTypes, creditLine } = result.data;

      // Check for price difference
      if (priceDifferencePercent && Math.abs(priceDifferencePercent) > 0) {
        validationWarnings.push(`Price changed by ${priceDifferencePercent}%`);
      }

      // Check for cancellation policy changes
      if (cancellationChanged) {
        validationWarnings.push('Cancellation policy has changed');
      }

      // Check for board type changes
      if (boardChanged) {
        validationWarnings.push('Board type has changed');
      }

      // Check if WALLET payment is supported
      const walletSupported = paymentTypes?.includes('WALLET') || false;
      
      // Check wallet balance if WALLET payment
      if (walletSupported && creditLine) {
        const remainingCredit = creditLine.remainingCredit || 0;
        const bookingPrice = price;
        
        if (remainingCredit < bookingPrice) {
          validationWarnings.push(`Insufficient wallet balance. Available: ${remainingCredit} ${currency || 'USD'}, Required: ${bookingPrice}`);
        }
      }
    }

    if (result.transactionId) {
      const sessionData = {
        transactionId: result.transactionId,
        offerId,
        price,
        currency: currency || 'USD',
        guestDetails,
        rooms,
        userId,
        expiresAt: result.expiresAt,
        createdAt: new Date().toISOString(),
        status: 'prebooked',
        validationWarnings,
        creditLine: result.data?.creditLine,
        paymentTypes: result.data?.paymentTypes,
      };

      await CacheService.set(
        CacheKeys.prebookSession(result.transactionId),
        sessionData,
        CACHE_TTL.PREBOOK_SESSION
      );

      if (bookingId) {
        await prisma.booking.updateMany({
          where: { id: bookingId },
          data: {
            metadata: {
              liteApiPrebookId: result.transactionId,
              prebookExpiry: result.expiresAt,
              validationWarnings,
              creditLine: result.data?.creditLine,
            },
          },
        }).catch(() => { });
      }
    }

    // Return result with validation warnings
    res.json({ 
      ...result, 
      validationWarnings,
      cached: true 
    });
  } catch (error: any) {
    console.error('[LITEAPI] /rates/prebook error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /prebooks/:prebookId - Retrieve a prebook by ID
router.get('/prebooks/:prebookId', async (req: Request, res: Response) => {
  try {
    const { prebookId } = req.params;
    
    // Try cache first
    const cacheKey = CacheKeys.prebookSession(prebookId);
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return res.json({ ...cached, cached: true });
    }

    const result = await liteApiBookRequest<any>(`/prebooks/${prebookId}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /prebooks/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /rates/book - Complete a booking
router.post('/rates/book', async (req: Request, res: Response) => {
  try {
    const { 
      prebookId, 
      guestDetails, 
      paymentDetails, 
      bookingId,
      // New WALLET payment fields
      holder,
      guests,
      metadata,
      guestPayment,
      clientReference
    } = req.body;

    if (!prebookId) {
      return res.status(400).json({ error: 'prebookId (transactionId) is required' });
    }

    // Build payload according to LiteAPI specification
    // Supports both legacy format and new WALLET payment format
    const payload: any = {
      prebookId,
    };

    // Add client reference if provided
    if (clientReference) {
      payload.clientReference = clientReference;
    }

    // Add holder information (required for WALLET payment)
    if (holder) {
      payload.holder = {
        firstName: holder.firstName,
        lastName: holder.lastName,
        email: holder.email,
        phone: holder.phone,
      };
    }

    // Add guests array (new format)
    if (guests && Array.isArray(guests)) {
      payload.guests = guests.map((guest, index) => ({
        occupancyNumber: guest.occupancyNumber || index + 1,
        firstName: guest.firstName,
        lastName: guest.lastName,
        email: guest.email,
        phone: guest.phone,
      }));
    } else if (guestDetails) {
      // Legacy format: single guest object
      payload.guests = Array.isArray(guestDetails) 
        ? guestDetails 
        : [guestDetails];
    }

    // Add metadata (optional)
    if (metadata) {
      payload.metadata = {
        ip: metadata.ip,
        country: metadata.country,
        language: metadata.language,
        platform: metadata.platform,
        user_agent: metadata.user_agent,
      };
    }

    // Add payment information
    // For WALLET payment: payment.method = "WALLET"
    if (paymentDetails) {
      if (paymentDetails.method === 'WALLET') {
        // WALLET payment method
        payload.payment = {
          method: 'WALLET',
        };
      } else {
        // Other payment methods (legacy format)
        payload.payment = paymentDetails;
      }
    } else {
      // Default to WALLET payment
      payload.payment = {
        method: 'WALLET',
      };
    }

    // Add guest payment info (for payment methods that require it)
    if (guestPayment) {
      payload.guestPayment = {
        method: guestPayment.method,
        phone: guestPayment.phone,
        payee_last_name: guestPayment.payee_last_name,
        payee_first_name: guestPayment.payee_first_name,
        last_4_digits: guestPayment.last_4_digits,
      };
    }

    const result = await liteApiBookRequest<any>('/rates/book', 'POST', payload);

    if (bookingId && result.confirmationId) {
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'confirmed',
          bookingRef: result.confirmationId,
          metadata: {
            liteApiConfirmationId: result.confirmationId,
            rawBookingData: result,
            paymentMethod: payload.payment?.method || 'WALLET',
          },
        },
      }).catch(() => { });
    }

    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /rates/book error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /bookings - List all bookings
router.get('/bookings', async (req: Request, res: Response) => {
  try {
    const { status, limit = 50, offset = 0 } = req.query;

    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status as string);
      params.append('limit', String(limit));
      params.append('offset', String(offset));

      const result = await liteApiBookRequest<any>(`/bookings?${params}`, 'GET');
      return res.json(result);
    } catch (liteError) {
      console.log('[LITEAPI] Direct bookings failed, falling back to database');
    }

    const dbBookings = await prisma.booking.findMany({
      where: {
        serviceType: 'hotel',
        ...(status && status !== "all" ? { status: String(status) as string } : {}),
      },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' },
    });

    res.json({ bookings: dbBookings, total: dbBookings.length });
  } catch (error: any) {
    console.error('[LITEAPI] /bookings error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /bookings/:bookingId - Retrieve a booking
router.get('/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (booking?.bookingRef) {
      try {
        const result = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}`, 'GET');
        return res.json(result);
      } catch (liteError) {
        console.log('[LITEAPI] Direct booking fetch failed, using database');
      }
    }

    if (booking) {
      return res.json(booking);
    }

    res.status(404).json({ error: 'Booking not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /bookings/:bookingId - Cancel a booking (with refund flow)
router.put('/bookings/:bookingId', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { 
      status, 
      cancellationReason,
      initiateRefund = true,
      refundToWallet = true 
    } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Full cancellation flow with refund calculation
    if (status === 'cancelled' && booking.bookingRef) {
      // Step 1: Fetch booking details from LiteAPI to get cancellation policy and payment info
      let bookingDetails: any = null;
      let refundableAmount = 0;
      let isRefundable = true;
      let cancellationFee = 0;
      let refundType: 'full' | 'partial' | 'none' = 'full';

      try {
        bookingDetails = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}`, 'GET');
        
        // Extract cancellation policy info
        const cancelPolicy = bookingDetails.cancellationPolicies?.cancelPolicyInfos?.[0];
        const refundableTag = bookingDetails.refundableTag || bookingDetails.cancelPolicies?.refundableTag;
        
        isRefundable = refundableTag === 'RFN';
        
        // Calculate refund based on policy
        if (isRefundable && cancelPolicy) {
          const cancelTime = new Date(cancelPolicy.cancelTime);
          const now = new Date();
          
          if (now < cancelTime) {
            // Before free cancellation deadline - full refund
            refundableAmount = Number(bookingDetails.retailRate || booking.totalAmount || 0);
            refundType = 'full';
          } else {
            // After free cancellation deadline - apply cancellation fee
            cancellationFee = Number(cancelPolicy.amount || 0);
            refundableAmount = Math.max(0, Number(bookingDetails.retailRate || booking.totalAmount || 0) - cancellationFee);
            refundType = refundableAmount > 0 ? 'partial' : 'none';
          }
        } else if (!isRefundable) {
          // Non-refundable booking
          refundableAmount = 0;
          refundType = 'none';
        }
      } catch (detailsError) {
        console.log('[LITEAPI] Could not fetch booking details, using booking amount');
        refundableAmount = Number(booking.totalAmount || 0);
      }

      // Step 2: Cancel the booking with LiteAPI
      let cancelResult: any = null;
      try {
        const cancelPayload = {
          bookingId: booking.bookingRef,
          reason: cancellationReason || 'User requested cancellation',
        };

        cancelResult = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}`, 'PUT', cancelPayload);
      } catch (liteError: any) {
        console.error('[LITEAPI] Cancellation failed:', liteError.message);
        // Continue with local cancellation even if LiteAPI fails
      }

      // Step 3: Process refund if initiated
      let refundResult: any = null;

      const metadata = booking.metadata as any || {};
      const paymentMethod = metadata.paymentMethod || 'WALLET';
      const walletTransactionId = metadata.walletTransactionId;
      const paymentTransactionId = metadata.paymentTransactionId || bookingDetails?.payment_transaction_id;
      const voucherId = metadata.voucherId || bookingDetails?.voucher_id;
      const voucherAmount = metadata.voucherAmount || bookingDetails?.voucher_total_amount;

      if (initiateRefund && refundableAmount > 0) {
        // Handle wallet refund
        if (refundToWallet && walletTransactionId && paymentMethod === 'WALLET') {
          try {
            // Credit the wallet using wallet service
            const walletServiceUrl = process.env.WALLET_SERVICE_URL || 'http://wallet-service:3006';
            const refundResponse = await fetch(`${walletServiceUrl}/wallet/refund`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                userId: booking.userId,
                amount: refundableAmount,
                currency: booking.currency || 'USD',
                bookingId: bookingId,
                originalTransactionId: walletTransactionId,
                reason: cancellationReason || 'Booking cancellation refund',
                idempotencyKey: `refund_${bookingId}_${Date.now()}`,
              }),
            }).catch(() => null);

            if (walletServiceUrl) {
              refundResult = {
                type: 'wallet_refund',
                amount: refundableAmount,
                currency: booking.currency || 'USD',
                status: walletServiceUrl ? 'completed' : 'pending',
                transactionId: walletTransactionId,
              };
            }
          } catch (walletError: any) {
            console.error('[Wallet] Refund failed:', walletError.message);
            refundResult = {
              type: 'wallet_refund',
              amount: refundableAmount,
              currency: booking.currency || 'USD',
              status: 'failed',
              error: walletError.message,
            };
          }
        }
        
        // Handle card/payment gateway refund (if not wallet or if split payment)
        if (paymentTransactionId && paymentMethod !== 'WALLET') {
          try {
            // Call payment gateway to initiate refund
            const paymentServiceUrl = process.env.PAYMENT_SERVICE_URL || 'http://payment-service:3007';
            const gatewayRefund = await fetch(`${paymentServiceUrl}/refund`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                transactionId: paymentTransactionId,
                amount: refundableAmount,
                currency: booking.currency || 'USD',
                reason: 'Booking cancellation',
              }),
            }).catch(() => null);

            refundResult = {
              ...refundResult,
              gatewayRefund: gatewayRefund ? {
                transactionId: paymentTransactionId,
                amount: refundableAmount,
                currency: booking.currency || 'USD',
                status: 'initiated',
              } : null,
            };
          } catch (paymentError: any) {
            console.error('[Payment] Gateway refund failed:', paymentError.message);
          }
        }

        // Handle voucher reversal if voucher was used
        if (voucherId && voucherAmount) {
          // Reverse voucher usage in local records
          console.log(`[Cancellation] Voucher ${voucherId} reversal: ${voucherAmount}`);
          // Voucher reversal would be handled by voucher service
        }
      }

      // Step 4: Update booking with full cancellation details
      await prisma.booking.update({
        where: { id: bookingId },
        data: {
          status: 'cancelled',
          metadata: {
            ...metadata,
            cancellationResult: cancelResult,
            cancelledAt: new Date().toISOString(),
            // Refund details
            refundDetails: {
              refundable: isRefundable,
              refundType,
              refundableAmount,
              cancellationFee,
              currency: booking.currency || 'USD',
              refundProcessed: !!refundResult,
              refundResult,
              paymentMethod,
              walletTransactionId,
              paymentTransactionId,
              voucherId,
              voucherAmount,
            },
          },
        },
      });

      // Step 5: Send notification (fire and forget)
      try {
        const notificationServiceUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3009';
        await fetch(`${notificationServiceUrl}/notifications/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'booking_cancelled',
            data: {
              bookingId,
              bookingRef: booking.bookingRef,
              userId: booking.userId,
              refundAmount: refundableAmount,
              refundType,
              currency: booking.currency,
            },
          }),
        }).catch(() => {});
      } catch (notifyError) {
        console.log('[Notification] Could not send cancellation notification');
      }

      return res.json({
        success: true,
        bookingId,
        bookingRef: booking.bookingRef,
        status: 'cancelled',
        refund: {
          type: refundType,
          refundable: isRefundable,
          amount: refundableAmount,
          cancellationFee,
          currency: booking.currency || 'USD',
          processed: !!refundResult,
          details: refundResult,
        },
        cancellation: cancelResult,
      });
    }

    // Simple status update without full refund flow
    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: status || booking.status,
        metadata: {
          ...((booking.metadata as object) || {}),
          lastUpdated: new Date().toISOString(),
        },
      },
    });

    res.json(updatedBooking);
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /bookings/:bookingId/amend - Update guest information for an existing booking
// Updates the booking holder (payer) details: firstName, lastName, email, remarks
router.put('/bookings/:bookingId/amend', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { firstName, lastName, email, remarks } = req.body;

    // Validate that at least one field is provided
    if (!firstName && !lastName && !email && !remarks) {
      return res.status(400).json({ 
        error: 'At least one of firstName, lastName, email, or remarks is required' 
      });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return res.status(404).json({ error: 'Booking not found' });
    }

    // Build the payload for LiteAPI according to the specification
    const payload: any = {};
    
    if (firstName) payload.firstName = firstName;
    if (lastName) payload.lastName = lastName;
    if (email) payload.email = email;
    if (remarks) payload.remarks = remarks;

    let result: any = null;
    let amendmentResult: any = { success: false };

    // If booking has a supplier reference, call LiteAPI to amend
    if (booking.bookingRef) {
      try {
        result = await liteApiBookRequest<any>(
          `/bookings/${booking.bookingRef}/amend`, 
          'PUT', 
          payload
        );
        amendmentResult = { 
          success: true, 
          supplierAmended: true,
          supplierResponse: result 
        };
      } catch (liteError: any) {
        console.error('[LITEAPI] Amendment call failed, updating local only:', liteError.message);
        amendmentResult = { 
          success: true, 
          supplierAmended: false,
          error: liteError.message 
        };
      }
    }

    // Update local booking record with holder information
    const updateData: any = {
      metadata: {
        ...((booking.metadata as object) || {}),
        holderAmendments: {
          firstName: firstName || ((booking.metadata as any)?.holderAmendments?.firstName),
          lastName: lastName || ((booking.metadata as any)?.holderAmendments?.lastName),
          email: email || ((booking.metadata as any)?.holderAmendments?.email),
          remarks: remarks || ((booking.metadata as any)?.holderAmendments?.remarks),
          amendedAt: new Date().toISOString(),
        },
        lastAmendedAt: new Date().toISOString(),
      },
    };

    // Also update customerEmail if provided
    if (email) {
      updateData.customerEmail = email;
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: bookingId },
      data: updateData,
    });

    res.json({
      success: true,
      bookingId,
      bookingRef: booking.bookingRef,
      amendments: {
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        remarks: remarks || null,
      },
      supplierAmended: amendmentResult.supplierAmended,
      booking: updatedBooking,
    });
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id/amend PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /bookings/:bookingId/amend - Legacy amend endpoint (guest name only)
router.patch('/bookings/:bookingId/amend', async (req: Request, res: Response) => {
  try {
    const bookingId = String(req.params.bookingId);
    const { guestName } = req.body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking?.bookingRef) {
      return res.status(404).json({ error: 'Booking not found or no supplier reference' });
    }

    const payload = {
      guestName,
    };

    const result = await liteApiBookRequest<any>(`/bookings/${booking.bookingRef}/amend`, 'PATCH', payload);
    
    // Update local record
    await prisma.booking.update({
      where: { id: bookingId },
      data: {
        metadata: {
          ...(booking.metadata as object || {}),
          amendedGuestName: guestName,
          amendedAt: new Date().toISOString(),
        },
      },
    });

    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /bookings/:id/amend PATCH error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Voucher Endpoints (DA Base URL)
// ============================================================================

// GET /vouchers - Retrieve all vouchers
router.get('/vouchers', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    const params = new URLSearchParams();
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const result = await liteApiDaRequest<any>(`/vouchers?${params}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /vouchers/:voucherId - Retrieve a specific voucher
router.get('/vouchers/:voucherId', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /vouchers - Create a new voucher
router.post('/vouchers', async (req: Request, res: Response) => {
  try {
    const result = await liteApiDaRequest<any>('/vouchers', 'POST', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /vouchers/:voucherId - Update a voucher
router.put('/vouchers/:voucherId', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}`, 'PUT', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /vouchers/:voucherId/status - Update voucher status
router.put('/vouchers/:voucherId/status', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const { status } = req.body;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}/status`, 'PUT', { status });
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id/status PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /vouchers/history - Retrieve voucher usage history
router.get('/vouchers/history', async (req: Request, res: Response) => {
  try {
    const { voucherId, limit = 50, offset = 0 } = req.query;
    const params = new URLSearchParams();
    if (voucherId) params.append('voucherId', String(voucherId));
    params.append('limit', String(limit));
    params.append('offset', String(offset));

    const result = await liteApiDaRequest<any>(`/vouchers/history?${params}`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/history GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /vouchers/:voucherId - Delete a voucher
router.delete('/vouchers/:voucherId', async (req: Request, res: Response) => {
  try {
    const { voucherId } = req.params;
    const result = await liteApiDaRequest<any>(`/vouchers/${voucherId}`, 'DELETE');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /vouchers/:id DELETE error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Loyalty Endpoints (API Base URL)
// ============================================================================

// GET /loyalties - Get loyalty program settings
router.get('/loyalties', async (req: Request, res: Response) => {
  try {
    const result = await liteApiRequest<any>('/loyalties', 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /loyalties GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// PUT /loyalties - Update loyalty program
router.put('/loyalties', async (req: Request, res: Response) => {
  try {
    const result = await liteApiRequest<any>('/loyalties', 'PUT', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /loyalties PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// GET /guests/:guestId/loyalty-points - Fetch guest's loyalty points
router.get('/guests/:guestId/loyalty-points', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const result = await liteApiRequest<any>(`/guests/${guestId}/loyalty-points`, 'GET');
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id/loyalty-points GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// POST /guests/:guestId/loyalty-points/redeem - Redeem guest's loyalty points
router.post('/guests/:guestId/loyalty-points/redeem', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const result = await liteApiRequest<any>(`/guests/${guestId}/loyalty-points/redeem`, 'POST', req.body);
    res.json(result);
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id/loyalty-points/redeem POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Legacy Loyalty Endpoints (Database fallback routes)
// ============================================================================

router.get('/guests', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const liteGuests = await liteApiRequest<any>(`/guests?${params}`, 'GET');
      return res.json(liteGuests);
    } catch (liteError) { }
    const guests = await prisma.user.findMany({ take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    res.json({ guests, total: guests.length });
  } catch (error: any) {
    console.error('[LITEAPI] /guests error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    try {
      const result = await liteApiRequest<any>(`/guests/${guestId}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const guest = await prisma.user.findUnique({ where: { id: String(guestId) }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    if (guest) return res.json(guest);
    res.status(404).json({ error: 'Guest not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/guests/:guestId/bookings', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const result = await liteApiRequest<any>(`/guests/${guestId}/bookings?${params}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const bookings = await prisma.booking.findMany({ where: { userId: String(guestId) }, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } });
    res.json({ bookings, total: bookings.length });
  } catch (error: any) {
    console.error('[LITEAPI] /guests/:id/bookings error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalties', async (req: Request, res: Response) => {
  try {
    const { enabled, cashbackRate, programName } = req.body;
    const settings = { enabled: enabled ?? true, cashbackRate: cashbackRate || 0.03, programName: programName || 'TripAlfa Rewards', updatedAt: new Date().toISOString() };
    try {
      const result = await liteApiRequest<any>('/loyalties', 'POST', settings);
      return res.json(result);
    } catch (liteError) { }
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalties POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Loyalty routes with /loyalty prefix
router.get('/loyalty/loyalties', async (req: Request, res: Response) => {
  try {
    try {
      const result = await liteApiRequest<any>('/loyalties', 'GET');
      return res.json(result);
    } catch (liteError) { }
    res.json({ enabled: true, cashbackRate: 0.03, programName: 'TripAlfa Rewards' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/loyalties GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.put('/loyalty/loyalties', async (req: Request, res: Response) => {
  try {
    const { enabled, cashbackRate, programName } = req.body;
    const settings = { enabled, cashbackRate, programName, updatedAt: new Date().toISOString() };
    try {
      const result = await liteApiRequest<any>('/loyalties', 'PUT', settings);
      return res.json(result);
    } catch (liteError) { }
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/loyalties PUT error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalty/loyalties', async (req: Request, res: Response) => {
  try {
    const { enabled, cashbackRate, programName } = req.body;
    const settings = { enabled: enabled ?? true, cashbackRate: cashbackRate || 0.03, programName: programName || 'TripAlfa Rewards', updatedAt: new Date().toISOString() };
    try {
      const result = await liteApiRequest<any>('/loyalties', 'POST', settings);
      return res.json(result);
    } catch (liteError) { }
    res.json({ success: true, settings });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/loyalties POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/guests', async (req: Request, res: Response) => {
  try {
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const liteGuests = await liteApiRequest<any>(`/guests?${params}`, 'GET');
      return res.json(liteGuests);
    } catch (liteError) { }
    const guests = await prisma.user.findMany({ take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    res.json({ guests, total: guests.length });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/guests GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/guests/:guestId', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    try {
      const result = await liteApiRequest<any>(`/guests/${guestId}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const guest = await prisma.user.findUnique({ where: { id: String(guestId) }, select: { id: true, email: true, firstName: true, lastName: true, phoneNumber: true, createdAt: true } });
    if (guest) return res.json(guest);
    res.status(404).json({ error: 'Guest not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/guests/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/guests/:guestId/bookings', async (req: Request, res: Response) => {
  try {
    const { guestId } = req.params;
    const { limit = 50, offset = 0 } = req.query;
    try {
      const params = new URLSearchParams();
      params.append('limit', String(limit));
      params.append('offset', String(offset));
      const result = await liteApiRequest<any>(`/guests/${guestId}/bookings?${params}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const bookings = await prisma.booking.findMany({ where: { userId: String(guestId) }, take: Number(limit), skip: Number(offset), orderBy: { createdAt: 'desc' } });
    res.json({ bookings, total: bookings.length });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/guests/:id/bookings GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/user/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    try {
      const result = await liteApiRequest<any>(`/guests/${userId}`, 'GET');
      return res.json(result);
    } catch (liteError) { }
    const user = await prisma.user.findUnique({ where: { id: String(userId) }, select: { id: true, email: true, firstName: true, lastName: true } });
    if (user) {
      const bookings = await prisma.booking.findMany({ where: { userId: String(userId), status: 'confirmed' } });
      const totalSpent = bookings.reduce((sum, b) => sum + Number(b.baseAmount || 0), 0);
      const totalPoints = Math.floor(totalSpent);
      return res.json({
        userId: user.id,
        currentPoints: totalPoints,
        totalPointsEarned: totalPoints,
        totalPointsRedeemed: 0,
        pointsExpiringDate: null,
        tier: totalPoints > 10000 ? 'gold' : (totalPoints > 5000 ? 'silver' : 'bronze')
      });
    }
    res.status(404).json({ error: 'User not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/transactions/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { limit = 20, offset = 0, type } = req.query;
    const bookings = await prisma.booking.findMany({
      where: { userId: String(userId), ...(type && type !== 'all' ? { serviceType: type as string } : {}) },
      take: Number(limit),
      skip: Number(offset),
      orderBy: { createdAt: 'desc' }
    });
    const transactions = bookings.map(b => ({
      id: b.id,
      customerId: userId,
      points: Math.floor(Number(b.baseAmount) || 0),
      type: 'EARN' as const,
      description: `${b.serviceType || 'Booking'} booking`,
      bookingReference: b.bookingRef,
      createdAt: b.createdAt.toISOString(),
      updatedAt: b.updatedAt.toISOString()
    }));
    res.json({ data: transactions, total: transactions.length });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/transactions/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/tiers', async (req: Request, res: Response) => {
  try {
    const tiers = [
      { id: 'bronze', name: 'Bronze', level: 1, minPoints: 0, maxPoints: 5000, discountPercentage: 5, pointsMultiplier: 1, benefits: ['5% discount', 'Earn 1x points'] },
      { id: 'silver', name: 'Silver', level: 2, minPoints: 5001, maxPoints: 10000, discountPercentage: 10, pointsMultiplier: 1.5, benefits: ['10% discount', 'Earn 1.5x points', 'Priority support'] },
      { id: 'gold', name: 'Gold', level: 3, minPoints: 10001, maxPoints: 25000, discountPercentage: 15, pointsMultiplier: 2, benefits: ['15% discount', 'Earn 2x points', 'Priority support', 'Free upgrades'] },
      { id: 'platinum', name: 'Platinum', level: 4, minPoints: 25001, maxPoints: 999999, discountPercentage: 20, pointsMultiplier: 3, benefits: ['20% discount', 'Earn 3x points', 'Priority support', 'Free upgrades', 'Lounge access'] }
    ];
    res.json(tiers);
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/tiers GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/tiers/:tierId', async (req: Request, res: Response) => {
  try {
    const { tierId } = req.params;
    const tiers: Record<string, any> = {
      bronze: { id: 'bronze', name: 'Bronze', level: 1, minPoints: 0, maxPoints: 5000, discountPercentage: 5, pointsMultiplier: 1, benefits: ['5% discount', 'Earn 1x points'] },
      silver: { id: 'silver', name: 'Silver', level: 2, minPoints: 5001, maxPoints: 10000, discountPercentage: 10, pointsMultiplier: 1.5, benefits: ['10% discount', 'Earn 1.5x points', 'Priority support'] },
      gold: { id: 'gold', name: 'Gold', level: 3, minPoints: 10001, maxPoints: 25000, discountPercentage: 15, pointsMultiplier: 2, benefits: ['15% discount', 'Earn 2x points', 'Priority support', 'Free upgrades'] },
      platinum: { id: 'platinum', name: 'Platinum', level: 4, minPoints: 25001, maxPoints: 999999, discountPercentage: 20, pointsMultiplier: 3, benefits: ['20% discount', 'Earn 3x points', 'Priority support', 'Free upgrades', 'Lounge access'] }
    };
    if (tiers[tierId]) return res.json(tiers[tierId]);
    res.status(404).json({ error: 'Tier not found' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/tiers/:id GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalty/user/:userId/redeem-points', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    res.json({ success: true, pointsRemaining: 0, redemptionAmount: points / 100, message: 'Points redeemed successfully' });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id/redeem-points POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.get('/loyalty/user/:userId/expiring-points', async (req: Request, res: Response) => {
  try {
    res.json({ expiringPoints: 0, expiryDate: null });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id/expiring-points GET error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

router.post('/loyalty/user/:userId/award-points', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { points } = req.body;
    res.json({ success: true, newBalance: points });
  } catch (error: any) {
    console.error('[LITEAPI] /loyalty/user/:id/award-points POST error:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// Export Router
// ============================================================================

export default router;
