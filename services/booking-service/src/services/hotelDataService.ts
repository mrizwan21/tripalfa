/**
 * Hotel Data Service
 * ===================
 * Hybrid data fetching service for hotel search and details.
 *
 * Strategy:
 * 1. Static data (95%) - from Postgres static DB (liteapi schema)
 * 2. Live data (rates/availability) - from LITEAPI
 * 3. Fallback - LITEAPI if static DB has no data
 *
 * Tables used from Postgres:
 * - liteapi_hotels (main hotel data + metadata)
 * - liteapi_facilities (lookup)
 * - liteapi_reviews (synced reviews)
 */

import { Pool } from "pg";
import CacheService, { CacheKeys, CACHE_TTL } from "../cache/redis.js";

// Database connection — MUST point to the static PostgreSQL instance for hotel & flight reference data, never Neon
const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL;
if (!STATIC_DATABASE_URL) {
  throw new Error(
    "STATIC_DATABASE_URL env var must be set for hotel & flight static data (local PostgreSQL instance on port 5433)",
  );
}
const pool = new Pool({
  connectionString: STATIC_DATABASE_URL,
  max: 10,
});

// LiteAPI configuration
const LITEAPI_API_BASE_URL =
  process.env.LITEAPI_API_BASE_URL || "https://api.liteapi.travel/v3.0";
const LITEAPI_BOOK_BASE_URL =
  process.env.LITEAPI_BOOK_BASE_URL || "https://book.liteapi.travel/v3.0";
const LITEAPI_PROD_API_KEY = process.env.LITEAPI_PROD_API_KEY;
const LITEAPI_API_KEY =
  process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY;
// LITEAPI Booking Types
export interface LiteAPIPrebookRequest {
  offerId: string;
  usePaymentSdk?: boolean;
}

export interface LiteAPIPrebookResponse {
  prebookId: string;
  status?: string;
  hotelCode?: string;
  hotelName?: string;
  checkin?: string;
  checkout?: string;
  rooms?: Array<{
    occupancyRefId: number;
    roomName?: string;
    boardCode?: string;
    boardName?: string;
  }>;
  price?: {
    currency: string;
    net: number;
    gross?: number;
    taxesAndFees?: number;
  };
  cancellationPolicy?: {
    refundable: boolean;
    cancelPenalties?: Array<{
      deadline: string;
      penaltyType: string;
      currency: string;
      value: number;
    }>;
  };
}

export interface LiteAPIPax {
  name: string;
  surname: string;
  age?: number;
}

export interface LiteAPIBookingRoom {
  occupancyRefId: number;
  paxes: LiteAPIPax[];
}

export interface LiteAPIBookingHolder {
  name: string;
  surname: string;
  email?: string;
  phone?: string;
}

export interface LiteAPIBookingRequest {
  prebookId: string;
  clientReference: string;
  holder: LiteAPIBookingHolder;
  rooms: LiteAPIBookingRoom[];
  remarks?: string;
  payment?: {
    type: string;
    token?: string;
  };
}

export interface LiteAPIBookingReference {
  client?: string;
  supplier?: string;
  hotel?: string;
  bookingID?: string;
  hotelConfirmationNumberStatus?: string;
  amendmentID?: string;
}

export interface LiteAPIBookingPrice {
  currency: string;
  binding: boolean;
  net: number;
  gross?: number;
  minimumSellingPrice?: number;
  exchange?: {
    currency: string;
    rate: number;
  };
  markups?: Array<{
    type: string;
    value: number;
  }>;
}

export interface LiteAPIBookingRoomInfo {
  occupancyRefId: number;
  code?: string;
  description?: string;
  refundable?: boolean;
  beds?: number;
  ratePlans?: Array<{
    start: string;
    end: string;
    code: string;
    name: string;
  }>;
}

export interface LiteAPIBookingHotel {
  bookingDate?: string;
  start?: string;
  end?: string;
  hotelCode?: string;
  hotelName?: string;
  boardCode?: string;
  occupancies?: Array<{
    id: number;
    paxes?: Array<{ age: number }>;
  }>;
  rooms?: LiteAPIBookingRoomInfo[];
}

export interface LiteAPICancelPenalty {
  deadline: string;
  isCalculatedDeadline?: boolean;
  penaltyType: string;
  currency: string;
  value: number;
}

export interface LiteAPIBookingCancellationPolicy {
  refundable: boolean;
  cancelPenalties?: LiteAPICancelPenalty[];
}

export interface LiteAPIBookingResponse {
  booking?: {
    status: string;
    billingSupplierCode?: string;
    supplierCode?: string;
    accessCode?: string;
    remarks?: string;
    reference: LiteAPIBookingReference;
    price: LiteAPIBookingPrice;
    holder: {
      name: string;
      surname: string;
    };
    hotel: LiteAPIBookingHotel;
    cancelPolicy: LiteAPIBookingCancellationPolicy;
  };
  error?: string;
}

// ============================================================================
// Types
// ============================================================================

export interface HotelSearchResult {
  id: string;
  name: string;
  description?: string;
  image: string;
  images?: string[];
  location: string;
  city?: string;
  country?: string;
  countryCode?: string;
  rating: number;
  starRating?: number;
  reviewCount: number;
  latitude?: number | null;
  longitude?: number | null;
  price?: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  facilityIds: number[];
  provider: string;
  roomTypes?: RoomType[];
  refundable?: boolean;
  chainId?: number;
  chainName?: string;
  hotelTypeId?: number;
  distanceFromCenter?: number;
}

export interface RoomType {
  id: string;
  name: string;
  description?: string;
  bedType?: string;
  bedCount?: number;
  maxOccupancy?: number;
  boardType?: string;
  boardName?: string;
  rates: RoomRate[];
  images?: string[];
}

export interface RoomRate {
  offerId: string;
  rateId?: string;
  roomTypeId?: string;
  price: {
    amount: number;
    currency: string;
  };
  suggestedSellingPrice?: {
    amount: number;
    currency: string;
    source?: string;
  };
  initialPrice?: {
    amount: number;
    currency: string;
  };
  taxesAndFees?:
  | {
    included: boolean;
    description?: string;
    amount: number;
    currency: string;
  }[]
  | null;
  priceType?: string; // 'commission' or 'net'
  isRefundable: boolean;
  refundableTag?: "RFN" | "NRFN";
  cancellationPolicy?: {
    cancelPolicyInfos: Array<{
      cancelTime: string;
      amount: number;
      currency: string;
      type: "amount" | "percent";
      timezone: string;
    }>;
    hotelRemarks?: string[];
    refundableTag: "RFN" | "NRFN";
  };
  boardType?: string;
  boardName?: string;
  maxOccupancy?: number;
  adultCount?: number;
  childCount?: number;
  occupancyNumber?: number;
  remarks?: string;
}

// LITEAPI Hotel Details Types
export interface LiteAPIHotelImage {
  url: string;
  caption?: string;
  order?: number;
  defaultImage?: boolean;
}

export interface LiteAPIFacility {
  facilityId?: number;
  name: string;
}

export interface LiteAPIBedType {
  quantity?: number;
  bedType?: string;
  bedSize?: string;
}

export interface LiteAPIRoomAmenity {
  amenitiesId?: number;
  name?: string;
  sort?: number;
}

export interface LiteAPIRoomPhoto {
  url?: string;
  imageDescription?: string;
  imageClass1?: string;
  imageClass2?: string;
  failoverPhoto?: string;
  mainPhoto?: boolean;
  score?: number;
  classId?: number;
  classOrder?: number;
}

export interface LiteAPIRoom {
  id?: string;
  roomId?: string;
  name?: string;
  roomName?: string;
  description?: string;
  roomSizeSquare?: number;
  roomSizeUnit?: string;
  hotelId?: string;
  maxOccupancy?: number;
  maxAdults?: number;
  maxChildren?: number;
  bedTypes?: LiteAPIBedType[];
  bedType?: string;
  bedCount?: number;
  sizeSqm?: number;
  roomAmenities?: LiteAPIRoomAmenity[];
  photos?: LiteAPIRoomPhoto[];
}

export interface LiteAPICheckinCheckoutTimes {
  checkin?: string;
  checkout?: string;
  checkinStart?: string;
}

export interface HotelDetail extends Omit<HotelSearchResult, "location"> {
  // LITEAPI fields
  hotelDescription?: string;
  hotelImportantInformation?: string;
  hotelImages?: LiteAPIHotelImage[];
  geoLocation?: {
    latitude?: number;
    longitude?: number;
  };
  checkinCheckoutTimes?: LiteAPICheckinCheckoutTimes;

  // Override location to allow both string and object
  location?: string;

  // Standard fields
  address?: string;
  zip?: string;
  phone?: string;
  email?: string;
  checkInTime?: string;
  checkOutTime?: string;
  policies?: HotelPolicy[];
  reviews?: HotelReview[];
  accessibility?: any;

  // Additional LITEAPI fields
  facilities?: LiteAPIFacility[];
  rooms?: LiteAPIRoom[];
}

export interface HotelPolicy {
  type: string;
  name?: string;
  description?: string;
}

export interface HotelReview {
  id: string;
  averageScore?: number;
  reviewerName?: string;
  name?: string;
  rating?: number;
  date?: string | Date;
  dateStr?: string;
  headline?: string;
  pros?: string;
  cons?: string;
  travelerType?: string;
  type?: string;
  country?: string;
  language?: string;
}

// LITEAPI Review Sentiment Analysis Types
export interface LiteAPISentimentCategory {
  name?: string;
  rating?: number;
  description?: string;
}

export interface LiteAPIReviewSentiment {
  categories?: LiteAPISentimentCategory[];
  pros?: string[];
  cons?: string[];
}

export interface LiteAPIHotelReviews {
  data?: HotelReview[];
  sentimentAnalysis?: LiteAPIReviewSentiment;
}

// ============================================================================
// LiteAPI Helper
// ============================================================================

async function liteApiRequest<T>(
  endpoint: string,
  method: string = "GET",
  body?: object,
): Promise<T> {
  const url = `${LITEAPI_API_BASE_URL}${endpoint}`;
  const apiKey = LITEAPI_PROD_API_KEY || LITEAPI_API_KEY;

  const response = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey || "",
    },
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LITEAPI Error (${response.status}): ${errorText}`);
  }

  return response.json();
}

// ============================================================================
// Static Database Queries
// ============================================================================

/**
 * Search hotels from static Postgres database
 */
async function searchHotelsFromDB(params: {
  cityName?: string;
  countryCode?: string;
  limit?: number;
  offset?: number;
  facilityIds?: number[];
  starRating?: number[];
  minPrice?: number;
  maxPrice?: number;
}): Promise<HotelSearchResult[]> {
  const client = await pool.connect();

  try {
    const conditions: string[] = ["h.is_deleted = FALSE"];
    const queryParams: any[] = [];
    let paramIndex = 1;

    // City filter
    if (params.cityName) {
      conditions.push(`LOWER(h.city) LIKE LOWER($${paramIndex})`);
      queryParams.push(`%${params.cityName}%`);
      paramIndex++;
    }

    // Country filter
    if (params.countryCode) {
      conditions.push(`h.country_code = $${paramIndex}`);
      queryParams.push(params.countryCode);
      paramIndex++;
    }

    // Star rating filter
    if (params.starRating && params.starRating.length > 0) {
      conditions.push(
        `h.stars IN (${params.starRating.map(() => `$${paramIndex++}`).join(", ")})`,
      );
      queryParams.push(...params.starRating);
    }

    const whereClause = conditions.join(" AND ");
    const limit = params.limit || 50;
    const offset = params.offset || 0;

    const query = `
      SELECT 
        h.id,
        h.name,
        h.hotel_description as description,
        h.city,
        h.country_code,
        h.address,
        h.latitude,
        h.longitude,
        h.star_rating as stars,
        h.metadata->>'rating' as rating,
        h.metadata->>'reviewCount' as review_count,
        h.metadata->'hotelImages' as images,
        COALESCE(
          (SELECT json_agg(f->'name') FROM jsonb_array_elements(h.metadata->'facilities') f),
          '[]'::json
        ) as facility_names,
        COALESCE(
          (SELECT json_agg(f->'facilityId') FROM jsonb_array_elements(h.metadata->'facilities') f),
          '[]'::json
        ) as facility_ids
      FROM liteapi_hotels h
      WHERE ${whereClause}
      ORDER BY (h.metadata->>'rating')::numeric DESC NULLS LAST
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    queryParams.push(limit, offset);

    const result = await client.query(query, queryParams);

    return result.rows.map((row) => {
      const images = Array.isArray(row.images) ? row.images.map((img: any) => img.url || img) : [];
      return {
        id: row.id,
        name: row.name,
        description: row.description,
        image: images[0] || "/images/placeholder-hotel.jpg",
        images: images,
        location: row.address || row.city || "",
        city: row.city,
        country: row.country_code,
        countryCode: row.country_code,
        rating: parseFloat(row.rating) || 0,
        starRating: parseFloat(row.stars) || undefined,
        reviewCount: parseInt(row.review_count) || 0,
        latitude: row.latitude,
        longitude: row.longitude,
        amenities: row.facility_names || [],
        facilityIds: row.facility_ids || [],
        provider: "LiteAPI-Static",
      };
    });
  } finally {
    client.release();
  }
}

/**
 * Get single hotel details from static database
 */
async function getHotelFromDB(hotelId: string): Promise<HotelDetail | null> {
  const client = await pool.connect();

  try {
    // Main hotel query
    const hotelQuery = `
      SELECT 
        h.*,
        h.metadata->'hotelImages' as images,
        h.metadata->'facilities' as facilities,
        h.metadata->'rooms' as rooms
      FROM liteapi_hotels h
      WHERE h.id = $1
    `;

    const hotelResult = await client.query(hotelQuery, [hotelId]);

    if (hotelResult.rows.length === 0) {
      return null;
    }

    const row = hotelResult.rows[0];

    // Policies and accessibility are now in metadata
    const metadata = row.metadata || {};


    // Get recent reviews
    const reviewsQuery = `
      SELECT id, author, rating, text, date 
      FROM liteapi_reviews 
      WHERE hotel_id = $1
      ORDER BY date DESC NULLS LAST
      LIMIT 10
    `;
    const reviewsResult = await client.query(reviewsQuery, [hotelId]);

    const images = Array.isArray(row.images) ? row.images.map((img: any) => img.url || img) : [];

    return {
      id: row.id,
      name: row.name,
      description: row.hotel_description || row.metadata?.hotelDescription,
      image: images[0] || "/images/placeholder-hotel.jpg",
      images: images,
      location: row.address || "",
      city: row.city,
      country: row.country_code,
      countryCode: row.country_code,
      address: row.address,
      rating: parseFloat(row.metadata?.rating) || 0,
      starRating: parseFloat(row.star_rating) || undefined,
      reviewCount: parseInt(row.metadata?.reviewCount) || 0,
      latitude: row.latitude,
      longitude: row.longitude,
      phone: row.phone,
      email: row.email,
      checkInTime: row.checkin_time,
      checkOutTime: row.checkout_time,
      amenities: (row.facilities || []).map((f: any) => f.name || f.facility),
      facilityIds: (row.facilities || []).map((f: any) => f.id || f.facilityId),
      provider: "LiteAPI-Static",
      policies: metadata.policies || [],
      reviews: reviewsResult.rows.map((r) => ({
        id: r.id,
        reviewerName: r.author,
        rating: r.rating,
        date: r.date,
        text: r.text,
      })),
      accessibility: metadata.accessibility || null,
      roomTypes: (row.rooms || []).map((r: any) => ({
        id: r.id || r.roomId || "",
        name: r.name || r.roomName,
        description: r.description,
        maxOccupancy: r.maxOccupancy || (r.maxAdults + r.maxChildren),
        rates: [],
      })),
    };
  } finally {
    client.release();
  }
}

/**
 * Get facilities from static database
 */
async function getFacilitiesFromDB(): Promise<
  Array<{ id: number; code: string; name: string }>
> {
  const client = await pool.connect();

  try {
    const query = `
      SELECT id, name
      FROM liteapi_facilities
      ORDER BY name
    `;

    const result = await client.query(query);
    return result.rows;
  } finally {
    client.release();
  }
}

// ============================================================================
// Live Rates (LITEAPI)
// ============================================================================

/**
 * Get live room rates from LITEAPI
 * Cached in Redis for short duration (seconds/minutes)
 */
async function getLiveRates(params: {
  hotelIds: string[];
  checkin: string;
  checkout: string;
  currency?: string;
  guestNationality?: string;
  occupancies: Array<{ adults: number; children?: number[] }>;
  maxRatesPerHotel?: number;
  roomMapping?: boolean;
  timeout?: number;
}): Promise<Map<string, { rates: any[]; cheapestPrice?: number }>> {
  const cacheKey = CacheKeys.hotelSearch({
    hotelIds: params.hotelIds,
    checkin: params.checkin,
    checkout: params.checkout,
    occupancies: params.occupancies,
  });

  // Check Redis cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    return new Map(Object.entries(cached as any));
  }

  try {
    const response = await liteApiRequest<any>("/hotels/rates", "POST", {
      hotelIds: params.hotelIds,
      checkin: params.checkin,
      checkout: params.checkout,
      currency: params.currency || "USD",
      guestNationality: params.guestNationality || "US",
      occupancies: params.occupancies,
      maxRatesPerHotel: params.maxRatesPerHotel || 3,
      roomMapping: params.roomMapping ?? true,
      timeout: params.timeout || 8,
    });

    const ratesMap = new Map<
      string,
      { rates: any[]; cheapestPrice?: number }
    >();

    // Parse response - LiteAPI returns data as array of hotel objects
    const hotels = response.data || response.hotels || [];

    for (const hotel of hotels) {
      const rates: any[] = [];
      let cheapestPrice = Infinity;

      // Extract rates from room types (offers)
      const roomTypes = hotel.roomTypes || [];
      for (const room of roomTypes) {
        for (const rate of room.rates || []) {
          const price =
            rate.retailRate?.total?.[0]?.amount ||
            rate.offerRetailRate?.amount ||
            0;

          // Parse cancellation policy
          const cancellationPolicy = rate.cancellationPolicies
            ? {
              cancelPolicyInfos:
                rate.cancellationPolicies.cancelPolicyInfos || [],
              hotelRemarks: rate.cancellationPolicies.hotelRemarks || [],
              refundableTag:
                rate.cancellationPolicies.refundableTag || "NRFN",
            }
            : undefined;

          rates.push({
            // Basic identifiers
            offerId: rate.offerId,
            rateId: rate.rateId,
            roomTypeId: room.roomTypeId,
            roomName: room.name,

            // Occupancy info
            occupancyNumber: rate.occupancyNumber,
            maxOccupancy: rate.maxOccupancy,
            adultCount: rate.adultCount,
            childCount: rate.childCount,

            // Pricing - retail rate (what customer pays)
            price: {
              amount: price,
              currency:
                rate.retailRate?.total?.[0]?.currency ||
                rate.offerRetailRate?.currency ||
                "USD",
            },

            // Suggested selling price (public facing price)
            suggestedSellingPrice: rate.suggestedSellingPrice?.[0]
              ? {
                amount: rate.suggestedSellingPrice[0].amount,
                currency: rate.suggestedSellingPrice[0].currency,
                source: rate.suggestedSellingPrice[0].source,
              }
              : rate.suggestedSellingPrice
                ? {
                  amount: rate.suggestedSellingPrice.amount,
                  currency: rate.suggestedSellingPrice.currency,
                  source: rate.suggestedSellingPrice.source,
                }
                : undefined,

            // Initial price (direct hotel discount)
            initialPrice: rate.initialPrice?.[0]
              ? {
                amount: rate.initialPrice[0].amount,
                currency: rate.initialPrice[0].currency,
              }
              : undefined,

            // Taxes and fees
            taxesAndFees: rate.taxesAndFees,

            // Price type (commission or net)
            priceType: rate.priceType,

            // Board/meal type
            boardType: room.boardType,
            boardName: room.boardName,

            // Refundability
            isRefundable: rate.refundableTag === "RFN",
            refundableTag: rate.refundableTag,

            // Cancellation policy
            cancellationPolicy,

            // Additional info
            remarks: rate.remarks,
          });

          if (price < cheapestPrice) {
            cheapestPrice = price;
          }
        }
      }

      ratesMap.set(hotel.id || hotel.hotelId, {
        rates,
        cheapestPrice: cheapestPrice === Infinity ? undefined : cheapestPrice,
      });
    }

    // Cache for 5 minutes
    await CacheService.set(
      cacheKey,
      Object.fromEntries(ratesMap),
      CACHE_TTL.HOTEL_RATES,
    );

    return ratesMap;
  } catch (error) {
    console.error("[HotelDataService] Failed to fetch live rates:", error);
    return new Map();
  }
}

// ============================================================================
// Hybrid Public API
// ============================================================================

const HotelDataService = {
  /**
   * Search hotels - hybrid approach
   * 1. Get static data from Postgres
   * 2. Enrich with live rates from LITEAPI
   */
  async searchHotels(params: {
    location?: string;
    cityName?: string;
    countryCode?: string;
    checkin: string;
    checkout: string;
    adults?: number;
    children?: number[];
    rooms?: number;
    limit?: number;
    offset?: number;
    facilityIds?: number[];
    starRating?: number[];
    minPrice?: number;
    maxPrice?: number;
    sortBy?: string;
    sortOrder?: string;
  }): Promise<{ results: HotelSearchResult[]; total: number; source: string }> {
    const cacheKey = `hotel:search:${JSON.stringify(params)}`;

    // Check cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return { ...(cached as any), source: "cache" };
    }

    // 1. Try static DB first
    let hotels = await searchHotelsFromDB({
      cityName: params.location || params.cityName,
      countryCode: params.countryCode,
      limit: params.limit ? params.limit * 2 : 100, // Get more for filtering
      offset: params.offset,
      facilityIds: params.facilityIds,
      starRating: params.starRating,
    });

    let source = "static-db";

    // 2. Fallback to LITEAPI if no results from DB
    if (hotels.length === 0) {
      console.log(
        "[HotelDataService] No results from static DB, falling back to LITEAPI",
      );

      try {
        const liteApiParams: any = {
          checkin: params.checkin,
          checkout: params.checkout,
          currency: "USD",
          guestNationality: "US",
          occupancies: [
            {
              adults: params.adults || 2,
              children: params.children || [],
            },
          ],
          limit: params.limit || 50,
        };

        if (params.location) {
          liteApiParams.cityName = params.location;
        }
        if (params.countryCode) {
          liteApiParams.countryCode = params.countryCode;
        }

        const response = await liteApiRequest<any>(
          "/hotels/rates",
          "POST",
          liteApiParams,
        );
        const apiHotels = response.data || response.hotels || [];

        hotels = apiHotels.map((h: any) => ({
          id: h.id || h.hotelId,
          name: h.name,
          image: h.main_photo || h.thumbnail || "/images/placeholder-hotel.jpg",
          location: h.address || "",
          city: h.city,
          rating: h.rating || 0,
          reviewCount: 0,
          latitude: h.latitude,
          longitude: h.longitude,
          price: {
            amount:
              h.roomTypes?.[0]?.rates?.[0]?.retailRate?.total?.[0]?.amount || 0,
            currency: "USD",
          },
          amenities: [],
          facilityIds: h.facilityIds || [],
          provider: "LiteAPI",
          roomTypes:
            h.roomTypes?.map((rt: any) => ({
              id: rt.roomTypeId,
              name: rt.name,
              rates:
                rt.rates?.map((r: any) => ({
                  offerId: r.offerId,
                  price: {
                    amount: r.retailRate?.total?.[0]?.amount || 0,
                    currency: r.retailRate?.total?.[0]?.currency || "USD",
                  },
                  isRefundable: r.refundableTag === "RFN",
                })) || [],
            })) || [],
          refundable: h.roomTypes?.[0]?.rates?.[0]?.refundableTag === "RFN",
        }));

        source = "liteapi-fallback";
      } catch (error) {
        console.error("[HotelDataService] LITEAPI fallback failed:", error);
      }
    }

    // 3. Enrich with live rates if we have check-in/out dates
    if (params.checkin && params.checkout && hotels.length > 0) {
      const hotelIds = hotels.map((h) => h.id).slice(0, 50); // Max 50 hotels at a time
      const ratesMap = await getLiveRates({
        hotelIds,
        checkin: params.checkin,
        checkout: params.checkout,
        occupancies: [
          {
            adults: params.adults || 2,
            children: params.children || [],
          },
        ],
      });

      // Merge rates into hotels
      hotels = hotels.map((hotel) => {
        const rateData = ratesMap.get(hotel.id);
        if (rateData) {
          return {
            ...hotel,
            price: rateData.cheapestPrice
              ? {
                amount: rateData.cheapestPrice,
                currency: "USD",
              }
              : hotel.price,
            roomTypes:
              rateData.rates.length > 0
                ? rateData.rates.map((r) => ({
                  id: r.roomTypeId || "",
                  name: r.roomName || "Room",
                  boardType: r.boardType,
                  boardName: r.boardName,
                  rates: [
                    {
                      offerId: r.offerId,
                      price: r.price,
                      isRefundable: r.isRefundable,
                      cancellationPolicy: r.cancellationPolicy,
                    },
                  ],
                }))
                : hotel.roomTypes,
          };
        }
        return hotel;
      });
    }

    // 4. Apply client-side filtering
    let filteredHotels = hotels;

    if (params.minPrice !== undefined) {
      filteredHotels = filteredHotels.filter(
        (h) => (h.price?.amount || 0) >= params.minPrice!,
      );
    }
    if (params.maxPrice !== undefined) {
      filteredHotels = filteredHotels.filter(
        (h) => (h.price?.amount || 0) <= params.maxPrice!,
      );
    }

    // 5. Apply sorting
    if (params.sortBy) {
      const isAsc = params.sortOrder === "asc";
      filteredHotels.sort((a, b) => {
        let aVal: any, bVal: any;

        switch (params.sortBy) {
          case "price":
            aVal = a.price?.amount || 0;
            bVal = b.price?.amount || 0;
            break;
          case "rating":
            aVal = a.rating || 0;
            bVal = b.rating || 0;
            break;
          case "name":
            return isAsc
              ? a.name.localeCompare(b.name)
              : b.name.localeCompare(a.name);
          default:
            return 0;
        }

        return isAsc ? aVal - bVal : bVal - aVal;
      });
    }

    const total = filteredHotels.length;
    const results = filteredHotels.slice(
      params.offset || 0,
      (params.offset || 0) + (params.limit || 50),
    );

    const response = { results, total, source };

    // Cache for 15 minutes
    await CacheService.set(cacheKey, response, CACHE_TTL.HOTEL_SEARCH);

    return response;
  },

  /**
   * Get hotel details - hybrid approach
   */
  async getHotelDetails(
    hotelId: string,
    params?: {
      checkin?: string;
      checkout?: string;
      adults?: number;
      children?: number[];
    },
  ): Promise<{ hotel: HotelDetail | null; source: string }> {
    const cacheKey = `hotel:detail:${hotelId}:${params?.checkin || ""}:${params?.checkout || ""}`;

    // Check cache
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return { ...(cached as any), source: "cache" };
    }

    // 1. Try static DB first
    let hotel = await getHotelFromDB(hotelId);
    let source = "static-db";

    // 2. Fallback to LITEAPI if not found
    if (!hotel) {
      try {
        const response = await liteApiRequest<any>(
          `/data/hotel?hotelId=${hotelId}`,
          "GET",
        );
        const data = response.data || response;

        if (data) {
          hotel = {
            // Basic identifiers
            id: data.id || hotelId,
            name: data.name || "",

            // Description
            description: data.hotelDescription || data.description,
            hotelDescription: data.hotelDescription,
            hotelImportantInformation: data.hotelImportantInformation,

            // Images
            image:
              data.hotelImages?.[0]?.url ||
              data.main_photo ||
              data.thumbnail ||
              "/images/placeholder-hotel.jpg",
            images: data.hotelImages?.map((img: any) => img.url) || [],
            hotelImages: data.hotelImages,

            // Location
            location: data.address || "",
            city: data.city,
            country: data.country,
            countryCode: data.country?.toUpperCase(),
            address: data.address,
            geoLocation: {
              latitude: data.location?.latitude || data.latitude,
              longitude: data.location?.longitude || data.longitude,
            },
            latitude: data.location?.latitude || data.latitude,
            longitude: data.location?.longitude || data.longitude,

            // Ratings
            rating: data.rating || 0,
            starRating: data.starRating,
            reviewCount: data.reviewCount || 0,

            // Contact
            phone: data.phone,
            email: data.email,

            // Check-in/out times
            checkInTime:
              data.checkinCheckoutTimes?.checkin ||
              data.checkinStart ||
              data.check_in,
            checkOutTime: data.checkinCheckoutTimes?.checkout || data.checkout,
            checkinCheckoutTimes: data.checkinCheckoutTimes,

            // Facilities/Amenities
            amenities: data.hotelFacilities || [],
            facilities:
              data.facilities?.map((f: any) => ({
                facilityId: f.facilityId,
                name: f.name,
              })) || [],
            facilityIds: data.facilities?.map((f: any) => f.facilityId) || [],

            // Rooms
            rooms:
              data.rooms?.map((r: any) => ({
                id: r.roomId || r.id?.toString(),
                roomId: r.roomId,
                name: r.roomName || r.name,
                description: r.description,
                maxOccupancy: r.maxOccupancy,
                maxAdults: r.maxAdults,
                maxChildren: r.maxChildren,
                bedType: r.bedType,
                bedCount: r.bedCount,
                sizeSqm: r.sizeSqm,
                roomAmenities: r.roomAmenities,
              })) || [],
            roomTypes: (data.rooms || []).map((r: any) => ({
              id: r.roomId || r.id?.toString() || "",
              name: r.roomName || r.name,
              description: r.description,
              maxOccupancy: r.maxOccupancy,
              bedType: r.bedType,
              rates: [],
            })),

            // Provider
            provider: "LiteAPI",
          };
          source = "liteapi-fallback";
        }
      } catch (error) {
        console.error("[HotelDataService] LITEAPI fallback failed:", error);
      }
    }

    // 3. Enrich with live rates if dates provided
    if (hotel && params?.checkin && params?.checkout) {
      const ratesMap = await getLiveRates({
        hotelIds: [hotelId],
        checkin: params.checkin,
        checkout: params.checkout,
        occupancies: [
          {
            adults: params.adults || 2,
            children: params.children || [],
          },
        ],
      });

      const rateData = ratesMap.get(hotelId);
      if (rateData && rateData.rates.length > 0) {
        hotel.roomTypes = rateData.rates.map((r) => ({
          id: r.roomTypeId || "",
          name: r.roomName || "Room",
          boardType: r.boardType,
          boardName: r.boardName,
          rates: [
            {
              offerId: r.offerId,
              price: r.price,
              isRefundable: r.isRefundable,
              cancellationPolicy: r.cancellationPolicy,
            },
          ],
        }));
        hotel.price = rateData.cheapestPrice
          ? {
            amount: rateData.cheapestPrice,
            currency: "USD",
          }
          : undefined;
      }
    }

    const response = { hotel, source };

    // Cache for 15 minutes
    if (hotel) {
      await CacheService.set(cacheKey, response, CACHE_TTL.HOTEL_SEARCH);
    }

    return response;
  },

  /**
   * Get facilities (amenities) list
   */
  async getFacilities(): Promise<
    Array<{ id: number; code: string; name: string }>
  > {
    const cacheKey = "hotel:facilities:all";

    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return cached as any[];
    }

    // Try DB first
    let facilities = await getFacilitiesFromDB();

    // Fallback to LITEAPI if empty
    if (facilities.length === 0) {
      try {
        const response = await liteApiRequest<any>("/data/facilities", "GET");
        facilities = (response.data || response || []).map((f: any) => ({
          id: f.id,
          code: f.code || f.name,
          name: f.name,
        }));
      } catch (error) {
        console.error("[HotelDataService] Failed to fetch facilities:", error);
      }
    }

    // Cache for 24 hours
    await CacheService.set(cacheKey, facilities, CACHE_TTL.LONG);

    return facilities;
  },

  /**
   * Get live rates for specific hotels
   */
  getLiveRates,
};

export default HotelDataService;
