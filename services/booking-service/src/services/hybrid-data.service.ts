/**
 * Hybrid Data Service
 * Manages real-time hotel data using a hybrid Redis + NEON approach
 * 
 * Strategy:
 * - REDIS: Fast caching for frequently accessed data (search results, rates, sessions)
 * - NEON: Persistent storage for bookings, guests, transactions, vouchers
 * 
 * This provides:
 * - Low latency responses from Redis cache
 * - Data durability and consistency from NEON
 * - Cost-effective caching with configurable TTL
 */

import { PrismaClient } from '@prisma/client';
import CacheService, { CacheKeys, CACHE_TTL } from '../cache/redis.js';

// Initialize NEON Prisma client
const neon = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NEON_DATABASE_URL || process.env.DATABASE_URL,
    },
  },
});

export type { PrismaClient };

// ============================================================================
// Booking Data Management
// ============================================================================

export const BookingDataService = {
  /**
   * Get booking from cache first, then NEON
   */
  async getBooking(bookingId: string) {
    // Try Redis cache first
    const cacheKey = CacheKeys.prebookSession(bookingId);
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    // Fetch from NEON
    const booking = await neon.booking.findUnique({
      where: { id: bookingId },
    });

    // Cache the result
    if (booking) {
      await CacheService.set(cacheKey, booking, CACHE_TTL.MEDIUM);
    }

    return booking ? { ...booking, source: 'neon' } : null;
  },

  /**
   * Create booking in NEON and optionally cache
   */
  async createBooking(data: {
    userId: string;
    serviceType: string;
    status: string;
    bookingRef?: string;
    baseAmount: number;
    currency: string;
    metadata?: any;
  }) {
    const booking = await neon.booking.create({
      data: {
        ...data,
        metadata: data.metadata || {},
      },
    });

    // Cache the booking
    const cacheKey = CacheKeys.prebookSession(booking.id);
    await CacheService.set(cacheKey, booking, CACHE_TTL.MEDIUM);

    return booking;
  },

  /**
   * Update booking in NEON and invalidate cache
   */
  async updateBooking(bookingId: string, data: any) {
    const booking = await neon.booking.update({
      where: { id: bookingId },
      data,
    });

    // Invalidate cache
    const cacheKey = CacheKeys.prebookSession(bookingId);
    await CacheService.delete(cacheKey);

    return booking;
  },

  /**
   * List bookings with optional filtering
   */
  async listBookings(params: {
    userId?: string;
    serviceType?: string;
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const { userId, serviceType, status, limit = 50, offset = 0 } = params;

    const where: any = {};
    if (userId) where.userId = userId;
    if (serviceType) where.serviceType = serviceType;
    if (status) where.status = status;

    const [bookings, total] = await Promise.all([
      neon.booking.findMany({
        where,
        take: limit,
        skip: offset,
        orderBy: { createdAt: 'desc' },
      }),
      neon.booking.count({ where }),
    ]);

    return { bookings, total };
  },
};

// ============================================================================
// Guest Data Management
// ============================================================================

export const GuestDataService = {
  /**
   * Get guest from cache first, then NEON
   */
  async getGuest(guestId: string) {
    const cacheKey = CacheKeys.guestData(guestId);
    const cached = await CacheService.get(cacheKey);
    if (cached) {
      return { ...cached, source: 'cache' };
    }

    const guest = await neon.user.findUnique({
      where: { id: guestId },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        createdAt: true,
      },
    });

    if (guest) {
      await CacheService.set(cacheKey, guest, CACHE_TTL.GUEST_DATA);
    }

    return guest ? { ...guest, source: 'neon' } : null;
  },

  /**
   * Get or create guest
   */
  async getOrCreateGuest(data: {
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
  }) {
    // Try to find existing guest
    let guest = await neon.user.findUnique({
      where: { email: data.email },
    });

    // Create if not exists
    if (!guest) {
      guest = await neon.user.create({
        data: {
          email: data.email,
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phoneNumber,
        },
      });
    }

    // Cache the guest
    const cacheKey = CacheKeys.guestData(guest.id);
    await CacheService.set(cacheKey, guest, CACHE_TTL.GUEST_DATA);

    return guest;
  },

  /**
   * Update guest in NEON and invalidate cache
   */
  async updateGuest(guestId: string, data: any) {
    const guest = await neon.user.update({
      where: { id: guestId },
      data,
    });

    // Invalidate cache
    const cacheKey = CacheKeys.guestData(guestId);
    await CacheService.delete(cacheKey);

    return guest;
  },
};

// ============================================================================
// Transaction Data Management  
// ============================================================================

export const TransactionDataService = {
  /**
   * Record a transaction in NEON
   */
  async createTransaction(data: {
    bookingId: string;
    userId: string;
    type: 'payment' | 'refund' | 'award' | 'redeem';
    amount: number;
    currency: string;
    description?: string;
    metadata?: any;
  }) {
    // In a real implementation, this would create a transaction record
    // For now, we update the booking metadata
    const booking = await neon.booking.update({
      where: { id: data.bookingId },
      data: {
        metadata: {
          transactions: {
            push: {
              type: data.type,
              amount: data.amount,
              currency: data.currency,
              description: data.description,
              createdAt: new Date().toISOString(),
            },
          },
        },
      },
    });

    return booking;
  },

  /**
   * Get transaction history
   */
  async getTransactionHistory(userId: string, limit = 20, offset = 0) {
    const bookings = await neon.booking.findMany({
      where: { userId },
      select: {
        id: true,
        bookingRef: true,
        baseAmount: true,
        currency: true,
        status: true,
        createdAt: true,
        metadata: true,
      },
      take: limit,
      skip: offset,
      orderBy: { createdAt: 'desc' },
    });

    return bookings.map(b => ({
      id: b.id,
      bookingRef: b.bookingRef,
      amount: b.baseAmount,
      currency: b.currency,
      status: b.status,
      createdAt: b.createdAt,
      transactions: b.metadata?.transactions || [],
    }));
  },
};

// ============================================================================
// Hotel Search Caching (Redis only - ephemeral data)
// ============================================================================

export const HotelSearchCache = {
  /**
   * Cache hotel search results
   */
  async cacheSearchResults(params: {
    location: string;
    checkin: string;
    checkout: string;
    results: any[];
  }) {
    const cacheKey = CacheKeys.hotelSearch(params);
    await CacheService.set(cacheKey, {
      ...params,
      cachedAt: new Date().toISOString(),
    }, CACHE_TTL.HOTEL_SEARCH);
  },

  /**
   * Get cached search results
   */
  async getCachedSearchResults(params: {
    location: string;
    checkin: string;
    checkout: string;
  }) {
    const cacheKey = CacheKeys.hotelSearch(params);
    return CacheService.get(cacheKey);
  },

  /**
   * Cache room rates
   */
  async cacheRoomRates(hotelId: string, checkin: string, checkout: string, rates: any[]) {
    const cacheKey = CacheKeys.hotelRates(hotelId, checkin, checkout);
    await CacheService.set(cacheKey, {
      hotelId,
      checkin,
      checkout,
      rates,
      cachedAt: new Date().toISOString(),
    }, CACHE_TTL.HOTEL_RATES);
  },

  /**
   * Get cached room rates
   */
  async getCachedRoomRates(hotelId: string, checkin: string, checkout: string) {
    const cacheKey = CacheKeys.hotelRates(hotelId, checkin, checkout);
    return CacheService.get(cacheKey);
  },
};

// ============================================================================
// Voucher Management (NEON persistence)
// ============================================================================

export const VoucherDataService = {
  /**
   * Create voucher record in NEON
   */
  async createVoucher(data: {
    code: string;
    bookingId: string;
    userId: string;
    amount: number;
    currency: string;
    status: 'active' | 'used' | 'expired';
    expiresAt?: Date;
  }) {
    // This would create a voucher record in a Voucher table
    // For now, we store it in booking metadata
    const booking = await neon.booking.update({
      where: { id: data.bookingId },
      data: {
        metadata: {
          voucher: {
            code: data.code,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            expiresAt: data.expiresAt,
            createdAt: new Date().toISOString(),
          },
        },
      },
    });

    return booking.metadata?.voucher;
  },

  /**
   * Get voucher by code
   */
  async getVoucherByCode(code: string) {
    // This would query a Voucher table
    // For now, we search through bookings
    const bookings = await neon.booking.findMany({
      where: {
        metadata: {
          path: ['voucher', 'code'],
          equals: code,
        },
      },
      take: 1,
    });

    return bookings[0]?.metadata?.voucher || null;
  },

  /**
   * Update voucher status
   */
  async updateVoucherStatus(bookingId: string, status: 'active' | 'used' | 'expired') {
    const booking = await neon.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking?.metadata?.voucher) {
      throw new Error('Voucher not found');
    }

    return neon.booking.update({
      where: { id: bookingId },
      data: {
        metadata: {
          ...booking.metadata,
          voucher: {
            ...booking.metadata.voucher,
            status,
            updatedAt: new Date().toISOString(),
          },
        },
      },
    });
  },
};

// ============================================================================
// Export services
// ============================================================================

export default {
  bookings: BookingDataService,
  guests: GuestDataService,
  transactions: TransactionDataService,
  hotelSearch: HotelSearchCache,
  vouchers: VoucherDataService,
  prisma: neon,
};
