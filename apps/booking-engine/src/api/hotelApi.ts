import axios, { AxiosInstance } from 'axios';

/**
 * Hotel API Client
 * 
 * Connects to LITEAPI backend routes with Redis caching:
 * - Hotel search: 15 min TTL
 * - Room rates: 30 min TTL
 * - Prebook sessions: 60 min TTL
 */

interface HotelSearchParams {
  location: string;
  checkin: string;
  checkout: string;
  adults?: number;
  children?: number[];
  rooms?: number;
  countryCode?: string;
  limit?: number;
}

interface HotelSearchResult {
  id: string;
  name: string;
  image: string;
  location: string;
  rating: number;
  reviews: number;
  price: {
    amount: number;
    currency: string;
  };
  amenities: string[];
  provider: string;
  offers: any[];
  refundable: boolean;
}

interface HotelRatesParams {
  hotelIds?: string[];
  cityName?: string;
  countryCode?: string;
  checkin: string;
  checkout: string;
  currency?: string;
  guestNationality?: string;
  occupancies: Array<{ adults: number; children?: number[] }>;
  limit?: number;
}

interface PrebookParams {
  offerId: string;
  price: number;
  currency?: string;
  guestDetails?: any;
  rooms?: number;
  userId?: string;
}

interface BookParams {
  prebookId: string;
  guestDetails: any;
  paymentDetails?: any;
  bookingId?: string;
}

class HotelApi {
  private api: AxiosInstance;
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add auth token to requests
    this.api.interceptors.request.use((config) => {
      const token = localStorage.getItem('authToken');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });
  }

  /**
   * Search for hotels (LITEAPI with Redis caching - 15 min TTL)
   * POST /api/liteapi/search/hotels
   */
  async search(params: HotelSearchParams): Promise<{ hotels: HotelSearchResult[]; cached?: boolean }> {
    try {
      const response = await this.api.post<{ 
        results: HotelSearchResult[]; 
        total: number;
        cached?: boolean;
      }>('/liteapi/search/hotels', {
        location: params.location,
        checkin: params.checkin,
        checkout: params.checkout,
        adults: params.adults || 2,
        children: params.children,
        rooms: params.rooms || 1,
        countryCode: params.countryCode,
        limit: params.limit || 20
      });
      
      return {
        hotels: response.data.results,
        cached: response.data.cached
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to search hotels'
      );
    }
  }

  /**
   * Get room rates for specific hotels (Redis caching - 30 min TTL)
   * POST /api/liteapi/hotels/rates
   */
  async getRates(params: HotelRatesParams): Promise<{ data: any; cached?: boolean }> {
    try {
      const response = await this.api.post<{ 
        hotels?: any[];
        cached?: boolean;
      }>('/liteapi/hotels/rates', params);
      
      return {
        data: response.data,
        cached: response.data.cached
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch room rates'
      );
    }
  }

  /**
   * Create prebook session (Redis session - 60 min TTL)
   * POST /api/liteapi/rates/prebook
   */
  async prebook(params: PrebookParams): Promise<{ transactionId: string; cached?: boolean }> {
    try {
      const response = await this.api.post<{ 
        transactionId: string;
        expiresAt?: string;
        cached?: boolean;
      }>('/liteapi/rates/prebook', params);
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to create prebook session'
      );
    }
  }

  /**
   * Confirm booking
   * POST /api/liteapi/rates/book
   */
  async book(params: BookParams): Promise<{ confirmationId: string }> {
    try {
      const response = await this.api.post<{ 
        confirmationId: string;
        bookingRef?: string;
      }>('/liteapi/rates/book', params);
      
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to confirm booking'
      );
    }
  }

  /**
   * Get hotel details
   * GET /api/hotels/:id
   */
  async getHotelDetails(hotelId: string): Promise<HotelSearchResult> {
    try {
      const response = await this.api.get<{ success: boolean; data: HotelSearchResult }>(
        `/hotels/${hotelId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch hotel details'
      );
    }
  }

  /**
   * Get available rooms for dates
   * GET /api/hotels/:id/availability
   */
  async getAvailability(
    hotelId: string,
    checkInDate: string,
    checkOutDate: string
  ): Promise<{ availableRooms: number }> {
    try {
      const response = await this.api.get<{
        success: boolean;
        data: { availableRooms: number };
      }>(`/hotels/${hotelId}/availability`, {
        params: { checkInDate, checkOutDate },
      });
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch availability'
      );
    }
  }

  /**
   * List hotel bookings
   * GET /api/liteapi/bookings
   */
  async listBookings(params?: { status?: string; limit?: number; offset?: number }): Promise<any> {
    try {
      const queryParams = new URLSearchParams();
      if (params?.status) queryParams.set('status', params.status);
      if (params?.limit) queryParams.set('limit', String(params.limit));
      if (params?.offset) queryParams.set('offset', String(params.offset));
      
      const response = await this.api.get(`/liteapi/bookings?${queryParams}`);
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to list bookings'
      );
    }
  }

  /**
   * Cancel booking
   * PUT /api/liteapi/bookings/:bookingId
   */
  async cancelBooking(bookingId: string, reason?: string): Promise<any> {
    try {
      const response = await this.api.put(`/liteapi/bookings/${bookingId}`, {
        status: 'cancelled',
        cancellationReason: reason
      });
      return response.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to cancel booking'
      );
    }
  }
}

// Export singleton instance
const hotelApi = new HotelApi();
export default hotelApi;
export type { HotelSearchParams, HotelSearchResult, HotelRatesParams, PrebookParams, BookParams };
