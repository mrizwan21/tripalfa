/**
 * Hotel Search Service
 * Optimized for 2M hotels at 100 RPS with <200ms latency
 * Uses Redis caching + raw SQL for performance
 */

import { PrismaClient, Prisma } from '@prisma/client';
import crypto from 'crypto';

// Types
export interface HotelSearchFilters {
    city?: string;
    countryCode?: string;
    chainCode?: string;
    starRating?: number[];
    facilities?: number[];
    facilityFlags?: {
        hasWifi?: boolean;
        hasPool?: boolean;
        hasSpa?: boolean;
        hasParking?: boolean;
        hasRestaurant?: boolean;
        hasGym?: boolean;
        hasBeach?: boolean;
        hasPetFriendly?: boolean;
    };
    minPrice?: number;
    maxPrice?: number;
    boardBasis?: string[];
    paymentType?: string[];
    checkIn: Date;
    checkOut: Date;
    occupancy?: number;
    viewType?: string[];
    query?: string; // For fuzzy name search
}

export interface HotelSearchResult {
    id: number;
    name: string;
    slug: string | null;
    chainCode: string | null;
    starRating: number | null;
    reviewScore: number | null;
    reviewCount: number;
    minPrice: number | null;
    primaryImage: string | null;
    location: {
        city: string | null;
        countryCode: string | null;
    };
    facilities: {
        hasWifi: boolean;
        hasPool: boolean;
        hasSpa: boolean;
        hasRestaurant: boolean;
        hasGym: boolean;
        hasParking: boolean;
    };
}


export interface HotelSearchResponse {
    hotels: HotelSearchResult[];
    total: number;
    page: number;
    limit: number;
    cached: boolean;
    queryTime: number;
}

// Redis interface (use your Redis client)
interface RedisClient {
    get(key: string): Promise<string | null>;
    setex(key: string, seconds: number, value: string): Promise<void>;
}

export class HotelSearchService {
    private prisma: PrismaClient;
    private redis?: RedisClient;
    private cacheEnabled: boolean;

    constructor(prisma: PrismaClient, redis?: RedisClient) {
        this.prisma = prisma;
        this.redis = redis;
        this.cacheEnabled = !!redis;
    }

    /**
     * Search hotels with complex filters
     * Target: <200ms at 100 RPS
     */
    async searchHotels(
        filters: HotelSearchFilters,
        page = 1,
        limit = 20
    ): Promise<HotelSearchResponse> {
        const startTime = Date.now();

        // 1. Check cache first (5 min TTL)
        if (this.cacheEnabled && this.redis) {
            const cacheKey = this.buildCacheKey(filters, page, limit);
            const cached = await this.redis.get(cacheKey);
            if (cached) {
                const result = JSON.parse(cached) as HotelSearchResponse;
                result.cached = true;
                result.queryTime = Date.now() - startTime;
                return result;
            }
        }

        // 2. Build and execute optimized query
        const hotels = await this.executeSearch(filters, page, limit);
        const total = await this.countResults(filters);

        const response: HotelSearchResponse = {
            hotels,
            total,
            page,
            limit,
            cached: false,
            queryTime: Date.now() - startTime,
        };

        // 3. Cache result (5 min TTL)
        if (this.cacheEnabled && this.redis) {
            const cacheKey = this.buildCacheKey(filters, page, limit);
            await this.redis.setex(cacheKey, 300, JSON.stringify(response));
        }

        return response;
    }

    /**
     * Execute the main search query using raw SQL for performance
     */
    private async executeSearch(
        filters: HotelSearchFilters,
        page: number,
        limit: number
    ): Promise<HotelSearchResult[]> {
        const offset = (page - 1) * limit;
        const params: any[] = [];
        let paramIndex = 1;

        // Build WHERE clauses
        const whereClauses: string[] = ['h.is_active = true'];

        if (filters.city) {
            whereClauses.push(`h.city = $${paramIndex++}`);
            params.push(filters.city);
        }

        if (filters.countryCode) {
            whereClauses.push(`h.country_code = $${paramIndex++}`);
            params.push(filters.countryCode);
        }

        if (filters.chainCode) {
            whereClauses.push(`h.chain_code = $${paramIndex++}`);
            params.push(filters.chainCode);
        }

        if (filters.starRating?.length) {
            whereClauses.push(`h.star_rating = ANY($${paramIndex++}::decimal[])`);
            params.push(filters.starRating);
        }

        if (filters.facilities?.length) {
            whereClauses.push(`h.facility_ids @> $${paramIndex++}::integer[]`);
            params.push(filters.facilities);
        }

        // Denormalized facility flags for O(1) filtering
        if (filters.facilityFlags) {
            if (filters.facilityFlags.hasWifi) {
                whereClauses.push('h.has_wifi = true');
            }
            if (filters.facilityFlags.hasPool) {
                whereClauses.push('h.has_pool = true');
            }
            if (filters.facilityFlags.hasSpa) {
                whereClauses.push('h.has_spa = true');
            }
            if (filters.facilityFlags.hasParking) {
                whereClauses.push('h.has_parking = true');
            }
            if (filters.facilityFlags.hasRestaurant) {
                whereClauses.push('h.has_restaurant = true');
            }
            if (filters.facilityFlags.hasGym) {
                whereClauses.push('h.has_gym = true');
            }
            if (filters.facilityFlags.hasBeach) {
                whereClauses.push('h.has_beach = true');
            }
            if (filters.facilityFlags.hasPetFriendly) {
                whereClauses.push('h.has_pet_friendly = true');
            }
        }

        // Fuzzy name or city search using trigram
        if (filters.query) {
            whereClauses.push(`(h.name ILIKE $${paramIndex} OR h.city ILIKE $${paramIndex})`);
            params.push(`%${filters.query}%`);
            paramIndex++;
        }

        // Price and date filters require joining room_rates
        const needsRateJoin = filters.minPrice || filters.maxPrice || filters.boardBasis?.length || filters.paymentType?.length;

        let rateJoin = '';
        if (needsRateJoin) {
            rateJoin = `
        INNER JOIN room_rates r ON h.id = r.hotel_id
          AND r.valid_from <= $${paramIndex++}::date
          AND r.valid_to >= $${paramIndex++}::date
      `;
            params.push(filters.checkIn, filters.checkOut);

            if (filters.minPrice) {
                whereClauses.push(`r.price_amount >= $${paramIndex++}`);
                params.push(filters.minPrice);
            }

            if (filters.maxPrice) {
                whereClauses.push(`r.price_amount <= $${paramIndex++}`);
                params.push(filters.maxPrice);
            }

            if (filters.boardBasis?.length) {
                whereClauses.push(`r.board_basis = ANY($${paramIndex++}::varchar[])`);
                params.push(filters.boardBasis);
            }

            if (filters.paymentType?.length) {
                whereClauses.push(`r.payment_type = ANY($${paramIndex++}::varchar[])`);
                params.push(filters.paymentType);
            }
        }

        // Add pagination params
        params.push(limit, offset);

        const priceSelect = needsRateJoin ? 'MIN(r.price_amount)' : 'NULL';
        const groupBy = needsRateJoin
            ? 'GROUP BY h.id, h.name, h.slug, h.chain_code, h.star_rating, h.review_score, h.review_count, h.city, h.country_code, h.has_wifi, h.has_pool, h.has_spa, h.has_restaurant, h.has_gym, h.has_parking, img.url'
            : '';

        const query = `
      SELECT 
        h.id,
        h.name,
        h.slug,
        h.chain_code as "chainCode",
        h.star_rating as "starRating",
        h.review_score as "reviewScore",
        h.review_count as "reviewCount",
        ${priceSelect} as "minPrice",
        h.city,
        h.country_code as "countryCode",
        h.has_wifi as "hasWifi",
        h.has_pool as "hasPool",
        h.has_spa as "hasSpa",
        h.has_restaurant as "hasRestaurant",
        h.has_gym as "hasGym",
        h.has_parking as "hasParking",
        img.url as "primaryImage"
      FROM hotels h
      LEFT JOIN LATERAL (
        SELECT url FROM hotel_images 
        WHERE hotel_id = h.id 
        ORDER BY is_primary DESC, sort_order ASC 
        LIMIT 1
      ) img ON true
      ${rateJoin}
      WHERE ${whereClauses.join(' AND ')}
      ${groupBy}
      ORDER BY h.review_score DESC NULLS LAST, h.name ASC
      LIMIT $${paramIndex++}
      OFFSET $${paramIndex++}
    `;

        const results = await this.prisma.$queryRawUnsafe(query, ...params) as any[];

        return results.map(row => ({
            id: row.id,
            name: row.name,
            slug: row.slug,
            chainCode: row.chainCode,
            starRating: row.starRating ? Number(row.starRating) : null,
            reviewScore: row.reviewScore ? Number(row.reviewScore) : null,
            reviewCount: row.reviewCount,
            minPrice: row.minPrice ? Number(row.minPrice) : null,
            primaryImage: row.primaryImage,
            location: {
                city: row.city,
                countryCode: row.countryCode,
            },
            facilities: {
                hasWifi: row.hasWifi,
                hasPool: row.hasPool,
                hasSpa: row.hasSpa,
                hasRestaurant: row.hasRestaurant,
                hasGym: row.hasGym,
                hasParking: row.hasParking,
            },
        }));
    }

    /**
     * Count total results for pagination
     */
    private async countResults(filters: HotelSearchFilters): Promise<number> {
        const whereClause = this.buildPrismaWhere(filters);
        return this.prisma.hotel.count({ where: whereClause });
    }

    /**
     * Build Prisma where clause for count query
     */
    /**
     * Build Prisma where clause for count query
     */
    private buildPrismaWhere(filters: HotelSearchFilters): any {
        const where: any = { isActive: true };

        if (filters.city) where.city = filters.city;
        if (filters.countryCode) where.countryCode = filters.countryCode;
        if (filters.chainCode) where.chainCode = filters.chainCode;
        if (filters.starRating?.length) {
            where.starRating = { in: filters.starRating };
        }

        if (filters.facilityFlags) {
            if (filters.facilityFlags.hasWifi) where.hasWifi = true;
            if (filters.facilityFlags.hasPool) where.hasPool = true;
            if (filters.facilityFlags.hasSpa) where.hasSpa = true;
            if (filters.facilityFlags.hasParking) where.hasParking = true;
            if (filters.facilityFlags.hasRestaurant) where.hasRestaurant = true;
        }

        if (filters.query) {
            where.name = { contains: filters.query, mode: 'insensitive' };
        }

        return where;
    }

    /**
     * Build cache key from filters
     */
    private buildCacheKey(filters: HotelSearchFilters, page: number, limit: number): string {
        const hash = crypto
            .createHash('md5')
            .update(JSON.stringify({ ...filters, page, limit }))
            .digest('hex');
        return `hotel:search:${hash}`;
    }

    /**
     * Get hotel by ID with rooms and rates
     */
    async getHotelDetails(hotelId: number, checkIn: Date, checkOut: Date) {
        const hotel = await this.prisma.hotel.findUnique({
            where: { id: hotelId },
            include: {
                chain: true,
                rooms: {
                    where: { isActive: true },
                    include: {
                        rates: {
                            where: {
                                validFrom: { lte: checkIn },
                                validTo: { gte: checkOut },
                            },
                            orderBy: { priceAmount: 'asc' },
                        },
                    },
                },
                hotelImages: {
                    orderBy: { sortOrder: 'asc' },
                    take: 20,
                },
            },
        });

        return hotel;
    }

    /**
     * Get popular destinations with price ranges
     */
    async getPopularDestinations(limit = 10) {
        const cacheKey = `hotel:popular_destinations:${limit}`;

        if (this.cacheEnabled && this.redis) {
            const cached = await this.redis.get(cacheKey);
            if (cached) return JSON.parse(cached);
        }

        // Use materialized view for fast aggregation
        const results = await this.prisma.$queryRaw`
      SELECT 
        country_code,
        city,
        hotel_count,
        avg_rating,
        min_price,
        max_price
      FROM mv_hotel_search_cache
      WHERE hotel_count > 10
      ORDER BY hotel_count DESC
      LIMIT ${limit}
    `;

        if (this.cacheEnabled && this.redis) {
            await this.redis.setex(cacheKey, 21600, JSON.stringify(results)); // 6 hour TTL
        }

        return results;
    }
}

export default HotelSearchService;
