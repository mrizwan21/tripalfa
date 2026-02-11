import axios, { AxiosInstance } from 'axios';

interface HotelSearchParams {
  location: string;
  checkInDate: string;
  checkOutDate: string;
  guests: number;
  rooms?: number;
}

interface HotelSearchResult {
  id: string;
  name: string;
  location: string;
  rating: number;
  roomType: string;
  pricePerNight: number;
  totalPrice: number;
  currency: string;
  availableRooms: number;
  amenities: string[];
  images?: string[];
  checkInDate: string;
  checkOutDate: string;
  guests: number;
}

interface HotelSearchResponse {
  success: boolean;
  data: {
    hotels: HotelSearchResult[];
    total: number;
  };
}

class HotelApi {
  private api: AxiosInstance;
  private baseURL = process.env.REACT_APP_API_URL || 'http://localhost:3000/api';

  constructor() {
    this.api = axios.create({
      baseURL: `${this.baseURL}/hotels`,
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
   * Search for hotels
   * POST /api/hotels/search
   */
  async search(params: HotelSearchParams): Promise<{ hotels: HotelSearchResult[] }> {
    try {
      const response = await this.api.post<HotelSearchResponse>('/search', params);
      return {
        hotels: response.data.data.hotels,
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
   * Get hotel details
   * GET /api/hotels/:id
   */
  async getHotelDetails(hotelId: string): Promise<HotelSearchResult> {
    try {
      const response = await this.api.get<{ success: boolean; data: HotelSearchResult }>(
        `/${hotelId}`
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
      }>(`/${hotelId}/availability`, {
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
}

// Export singleton instance
const hotelApi = new HotelApi();
export default hotelApi;
