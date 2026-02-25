import { api } from '../lib/api';

// ============================================================================
// Types
// ============================================================================

export interface HotelSearchParams {
  // Required fields
  location?: string;
  checkin: string;
  checkout: string;
  
  // Guest configuration
  adults?: number;
  children?: number[];
  rooms?: number;
  occupancies?: Occupancy[];  // LiteAPI format: [{ adults: 2, children: [{ age: 5 }] }]
  
  // Location filters
  countryCode?: string;
  cityName?: string;
  placeId?: string;
  latitude?: number;
  longitude?: number;
  radius?: number;
  hotelIds?: string[];
  
  // Pagination
  limit?: number;
  offset?: number;
  
  // Price filters
  minPrice?: number;
  maxPrice?: number;
  
  // Rating filters
  minRating?: number;
  minReviewsCount?: number;
  
  // Star rating filter (array of star ratings)
  starRating?: number[];
  
  // Facility/Amenity filters
  amenities?: string[];
  facilityIds?: number[];  // LiteAPI facility IDs from GET /data/facilities
  strictFacilitiesFiltering?: boolean;  // true = AND (all facilities), false = OR (any facility)
  strictFacilityFiltering?: boolean;  // Alternative param name for some endpoints
  
  // Hotel type filters
  hotelTypeIds?: number[];
  chainIds?: number[];
  
  // Board type filter
  boardType?: 'RO' | 'BB' | 'HB' | 'FB' | 'AI';
  
  // Refundable rates only
  refundableRatesOnly?: boolean;
  
  // Accessibility
  advancedAccessibilityOnly?: boolean;
  
  // Sorting
  sortBy?: 'top_picks' | 'price' | 'rating' | 'name';
  sortOrder?: 'asc' | 'desc';
  sort?: string;  // LiteAPI sort parameter
  
  // Currency
  currency?: string;
  guestNationality?: string;
  
  // Performance options
  maxRatesPerHotel?: number;
  timeout?: number;
  stream?: boolean;
  includeHotelData?: boolean;
  roomMapping?: boolean;
  
  // AI Search (beta)
  aiSearch?: string;
}

export interface Occupancy {
  adults: number;
  children?: Array<{ age: number }>;
}

export interface HotelFacility {
  id: number;
  code: string;
  name: string;
  category?: string;
}

export interface HotelSearchResult {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  latitude?: number;
  longitude?: number;
  price: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  provider: string;
  roomTypes?: RoomType[];
  refundable?: boolean;
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
}

export interface RoomRate {
  offerId: string;
  price: {
    amount: number;
    currency: string;
  };
  isRefundable: boolean;
  cancellationPolicy?: any;
  suggestedSellingPrice?: number;
}

export interface HotelDetails {
  id: string;
  name: string;
  description?: string;
  address: string;
  city: string;
  country: string;
  rating: number;
  images: string[];
  amenities: string[];
  contact?: {
    phone?: string;
    email?: string;
  };
  rooms?: RoomType[];
}

export interface PrebookRequest {
  offerId: string;
  price: number;
  currency?: string;
  guestDetails?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  rooms?: number;
  bookingId?: string;
}

export interface PrebookResponse {
  transactionId: string;
  expiresAt: string;
  status?: string;
}

export interface BookRequest {
  prebookId: string;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  paymentDetails?: any;
  bookingId?: string;
}

export interface BookResponse {
  confirmationId: string;
  status: string;
  hotelName?: string;
  checkin?: string;
  checkout?: string;
}

// ============================================================================
// LiteAPI Voucher Types
// ============================================================================

export interface Voucher {
  id?: string;
  voucherId?: string;
  bookingId?: string;
  hotelName?: string;
  guestName?: string;
  checkinDate?: string;
  checkoutDate?: string;
  roomType?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface VoucherCreateRequest {
  bookingId: string;
  hotelName: string;
  guestName: string;
  checkinDate: string;
  checkoutDate: string;
  roomType: string;
  totalAmount: number;
  currency?: string;
}

export interface VoucherUpdateRequest {
  hotelName?: string;
  guestName?: string;
  checkinDate?: string;
  checkoutDate?: string;
  roomType?: string;
}

export interface VoucherStatusUpdate {
  status: 'active' | 'used' | 'cancelled' | 'expired';
}

export interface VoucherHistoryParams {
  voucherId?: string;
  limit?: number;
  offset?: number;
}

// ============================================================================
// API Class - Uses centralized API manager for all requests
// ============================================================================

/**
 * HotelApi class - Uses centralized API manager for all requests
 * 
 * This class routes all API calls through the centralized `api` object from lib/api.ts
 * which provides:
 * - Consistent authentication token handling
 * - Request/response interceptors
 * - Error handling standardization
 * - Logging and monitoring
 */
class HotelApi {
  // ============================================================================
  // Hotel Search & Details
  // ============================================================================

  /**
   * Search for hotels - Hybrid (Static DB + Live Rates)
   * POST /api/hotels/search
   * 
   * Strategy:
   * - Static data (95%) from Postgres DB
   * - Live rates from LITEAPI
   * - Fallback to LITEAPI if no static data
   */
  async search(params: HotelSearchParams): Promise<{ 
    results: HotelSearchResult[]; 
    total: number;
    source?: string;  // 'static-db' | 'liteapi-fallback' | 'cache'
  }> {
    try {
      const response = await api.post<{ 
        success: boolean;
        results: HotelSearchResult[]; 
        total: number;
        source?: string;
      }>('/hotels/search', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to search hotels');
    }
  }

  /**
   * Get hotel details
   * GET /api/hotels/:hotelId
   */
  async getHotelDetails(hotelId: string): Promise<HotelDetails> {
    try {
      const response = await api.get<HotelDetails>(`/hotels/${hotelId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get hotel details');
    }
  }

  /**
   * Get hotel room rates
   * POST /api/hotels/rates
   */
  async getRoomRates(params: {
    hotelIds?: string[];
    checkin: string;
    checkout: string;
    currency?: string;
    guestNationality?: string;
    occupancies: any[];
    cityName?: string;
    countryCode?: string;
    limit?: number;
  }): Promise<any> {
    try {
      const response = await api.post<any>('/hotels/rates', params);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get room rates');
    }
  }

  /**
   * Prebook hotel rooms
   * POST /api/liteapi/rates/prebook
   */
  async prebook(request: PrebookRequest): Promise<PrebookResponse> {
    try {
      const response = await api.post<PrebookResponse>('/liteapi/rates/prebook', request);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to prebook');
    }
  }

  /**
   * Book hotel (confirm booking)
   * POST /api/liteapi/rates/book
   */
  async book(request: BookRequest): Promise<BookResponse> {
    try {
      const response = await api.post<BookResponse>('/liteapi/rates/book', request);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to book');
    }
  }

  /**
   * Get booking details
   * GET /api/liteapi/bookings/:bookingId
   */
  async getBooking(bookingId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/liteapi/bookings/${bookingId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get booking');
    }
  }

  /**
   * Cancel booking
   * PUT /api/liteapi/bookings/:bookingId
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<any> {
    try {
      const response = await api.put<any>(`/liteapi/bookings/${bookingId}`, {
        status: 'cancelled',
        cancellationReason: reason
      });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to cancel booking');
    }
  }

  // ============================================================================
  // LiteAPI Voucher Endpoints (Admin)
  // ============================================================================

  /**
   * Get all vouchers
   * GET /api/liteapi/vouchers
   */
  async getVouchers(params?: { limit?: number; offset?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const response = await api.get<any>(`/liteapi/vouchers?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get vouchers');
    }
  }

  /**
   * Get voucher by ID
   * GET /api/liteapi/vouchers/:voucherId
   */
  async getVoucher(voucherId: string): Promise<Voucher> {
    try {
      const response = await api.get<Voucher>(`/liteapi/vouchers/${voucherId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get voucher');
    }
  }

  /**
   * Create a new voucher (Admin)
   * POST /api/liteapi/vouchers
   */
  async createVoucher(request: VoucherCreateRequest): Promise<Voucher> {
    try {
      const response = await api.post<Voucher>('/liteapi/vouchers', request);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to create voucher');
    }
  }

  /**
   * Update a voucher (Admin)
   * PUT /api/liteapi/vouchers/:voucherId
   */
  async updateVoucher(voucherId: string, request: VoucherUpdateRequest): Promise<Voucher> {
    try {
      const response = await api.put<Voucher>(`/liteapi/vouchers/${voucherId}`, request);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update voucher');
    }
  }

  /**
   * Update voucher status (Admin)
   * PUT /api/liteapi/vouchers/:voucherId/status
   */
  async updateVoucherStatus(voucherId: string, status: VoucherStatusUpdate['status']): Promise<Voucher> {
    try {
      const response = await api.put<Voucher>(`/liteapi/vouchers/${voucherId}/status`, { status });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to update voucher status');
    }
  }

  /**
   * Get voucher history
   * GET /api/liteapi/vouchers/history
   */
  async getVoucherHistory(params?: VoucherHistoryParams): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.voucherId) queryParams.append('voucherId', params.voucherId);
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      
      const response = await api.get<any>(`/liteapi/vouchers/history?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get voucher history');
    }
  }

  /**
   * Delete a voucher (Admin)
   * DELETE /api/liteapi/vouchers/:voucherId
   */
  async deleteVoucher(voucherId: string): Promise<{ success: boolean }> {
    try {
      const response = await api.delete<{ success: boolean }>(`/liteapi/vouchers/${voucherId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to delete voucher');
    }
  }

  // ============================================================================
  // Loyalty
  // ============================================================================

  /**
   * Get loyalty points for user
   * GET /api/liteapi/loyalty/user/:userId
   */
  async getLoyaltyPoints(userId: string): Promise<any> {
    try {
      const response = await api.get<any>(`/liteapi/loyalty/user/${userId}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get loyalty points');
    }
  }

  /**
   * Get loyalty transactions
   * GET /api/liteapi/loyalty/transactions/:userId
   */
  async getLoyaltyTransactions(userId: string, params?: { limit?: number; offset?: number; type?: string }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.limit) queryParams.append('limit', params.limit.toString());
      if (params?.offset) queryParams.append('offset', params.offset.toString());
      if (params?.type) queryParams.append('type', params.type);
      
      const response = await api.get<any>(`/liteapi/loyalty/transactions/${userId}?${queryParams.toString()}`);
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get transactions');
    }
  }

  /**
   * Redeem loyalty points
   * POST /api/liteapi/loyalty/user/:userId/redeem-points
   */
  async redeemPoints(userId: string, points: number): Promise<any> {
    try {
      const response = await api.post<any>(`/liteapi/loyalty/user/${userId}/redeem-points`, { points });
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to redeem points');
    }
  }

  /**
   * Get loyalty tiers
   * GET /api/liteapi/loyalty/tiers
   */
  async getLoyaltyTiers(): Promise<any[]> {
    try {
      const response = await api.get<any[]>('/liteapi/loyalty/tiers');
      return response;
    } catch (error: any) {
      throw new Error(error.response?.data?.message || error.message || 'Failed to get tiers');
    }
  }

  // ============================================================================
  // Static Data - Facilities & Filter Options
  // ============================================================================

  /**
   * Get hotel facilities (amenities) - Hybrid
   * GET /api/hotels/facilities/list
   * 
   * Strategy:
   * - First from Postgres static DB
   * - Fallback to LITEAPI if empty
   */
  async getFacilities(): Promise<HotelFacility[]> {
    try {
      // Try the new hybrid endpoint first
      const response = await api.get<{ success: boolean; facilities: HotelFacility[] }>('/hotels/facilities/list');
      return response?.facilities || [];
    } catch (error: any) {
      // Fallback to LiteAPI endpoint
      try {
        const response = await api.get<HotelFacility[]>('/liteapi/data/facilities');
        return response || [];
      } catch (fallbackError: any) {
        throw new Error(fallbackError.response?.data?.message || fallbackError.message || 'Failed to get facilities');
      }
    }
  }

  /**
   * Get filter options for hotel search UI
   * GET /api/hotels/filters/options
   * 
   * Returns pre-configured filter options for:
   * - Star ratings
   * - Price range
   * - Facilities/Amenities
   * - Sort options
   */
  async getFilterOptions(): Promise<{
    starRating: Array<{ value: number; label: string }>;
    priceRange: { min: number; max: number; step: number };
    facilities: Array<{ value: number; label: string }>;
    sortOptions: Array<{ value: string; label: string; defaultOrder: string }>;
  }> {
    try {
      const response = await api.get<{ 
        success: boolean; 
        filters: {
          starRating: Array<{ value: number; label: string }>;
          priceRange: { min: number; max: number; step: number };
          facilities: Array<{ value: number; label: string }>;
          sortOptions: Array<{ value: string; label: string; defaultOrder: string }>;
        }
      }>('/hotels/filters/options');
      return response?.filters || {
        starRating: [
          { value: 5, label: '5 Stars' },
          { value: 4, label: '4 Stars' },
          { value: 3, label: '3 Stars' },
          { value: 2, label: '2 Stars' },
          { value: 1, label: '1 Star' },
        ],
        priceRange: { min: 0, max: 10000, step: 50 },
        facilities: [],
        sortOptions: [
          { value: 'price', label: 'Price', defaultOrder: 'asc' },
          { value: 'rating', label: 'Rating', defaultOrder: 'desc' },
          { value: 'name', label: 'Name', defaultOrder: 'asc' },
        ],
      };
    } catch (error: any) {
      // Return defaults on error
      return {
        starRating: [
          { value: 5, label: '5 Stars' },
          { value: 4, label: '4 Stars' },
          { value: 3, label: '3 Stars' },
          { value: 2, label: '2 Stars' },
          { value: 1, label: '1 Star' },
        ],
        priceRange: { min: 0, max: 10000, step: 50 },
        facilities: [],
        sortOptions: [
          { value: 'price', label: 'Price', defaultOrder: 'asc' },
          { value: 'rating', label: 'Rating', defaultOrder: 'desc' },
          { value: 'name', label: 'Name', defaultOrder: 'asc' },
        ],
      };
    }
  }
}

// Export singleton instance
const hotelApi = new HotelApi();
export default hotelApi;
