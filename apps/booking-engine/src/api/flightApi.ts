import axios, { AxiosInstance } from 'axios';

interface FlightSearchParams {
  departureDate: string;
  departureAirport: string;
  arrivalAirport: string;
  passengers: number;
  returnDate?: string;
  tripType?: 'oneway' | 'roundtrip';
}

interface FlightSearchResult {
  id: string;
  airline: string;
  flightNumber: string;
  departure: {
    airport: string;
    city: string;
    time: string;
  };
  arrival: {
    airport: string;
    city: string;
    time: string;
  };
  duration: number; // in minutes
  cabin: string;
  passengers: number;
  price: number;
  currency: string;
  availableSeats: number;
}

interface FlightSearchResponse {
  success: boolean;
  data: {
    flights: FlightSearchResult[];
    total: number;
  };
}

class FlightApi {
  private api: AxiosInstance;
  private baseURL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  constructor() {
    this.api = axios.create({
      baseURL: `${this.baseURL}/flights`,
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
   * Search for flights
   * POST /api/flights/search
   */
  async search(params: FlightSearchParams): Promise<{ flights: FlightSearchResult[] }> {
    try {
      const response = await this.api.post<FlightSearchResponse>('/search', params);
      return {
        flights: response.data.data.flights,
      };
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to search flights'
      );
    }
  }

  /**
   * Get flight details
   * GET /api/flights/:id
   */
  async getFlightDetails(flightId: string): Promise<FlightSearchResult> {
    try {
      const response = await this.api.get<{ success: boolean; data: FlightSearchResult }>(
        `/${flightId}`
      );
      return response.data.data;
    } catch (error: any) {
      throw new Error(
        error.response?.data?.message ||
          error.message ||
          'Failed to fetch flight details'
      );
    }
  }
}

// Export singleton instance
const flightApi = new FlightApi();
export default flightApi;
