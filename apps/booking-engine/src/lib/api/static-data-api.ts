/**
 * Static Data API Client
 * 
 * Provides a comprehensive client for interacting with the Static Data API.
 * Handles authentication, error handling, and response processing.
 */

export interface Hotel {
    id: string;
    name: string;
    city: string;
    country: string;
    country_code: string;
    latitude: number;
    longitude: number;
    stars: number;
    rating: number;
    address: string;
    description: string;
    check_in_time: string;
    check_out_time: string;
    amenities_count: number;
    images_count: number;
    created_at: string;
    updated_at: string;
}

export interface City {
    id: string;
    name: string;
    country_code: string;
    country_name: string;
    latitude: number;
    longitude: number;
    timezone: string;
    population: number;
    is_capital: boolean;
}

export interface Country {
    id: string;
    name: string;
    alpha2_code: string;
    alpha3_code: string;
    numeric_code: number;
    demonym: string;
    currency_code: string;
    currency_name: string;
    currency_symbol: string;
    phone_prefix: string;
    continent: string;
    capital: string;
    population: number;
    area_km2: number;
    timezones: string[];
    languages: string[];
}

export interface HotelFullDetails {
    hotel: Hotel;
    images: HotelImage[];
    amenities: HotelAmenity[];
    descriptions: HotelDescription[];
    contacts: HotelContact[];
    reviews: HotelReview[];
    rooms: HotelRoom[];
}

export interface HotelImage {
    id: number;
    hotel_id: string;
    image_url: string;
    is_primary: boolean;
    image_type: string;
    created_at: string;
}

export interface HotelAmenity {
    id: number;
    name: string;
    category: string;
    is_popular: boolean;
    created_at: string;
}

export interface HotelDescription {
    id: number;
    hotel_id: string;
    description_type: string;
    description_text: string;
    language_code: string;
    created_at: string;
}

export interface HotelContact {
    id: number;
    hotel_id: string;
    contact_type: string;
    contact_value: string;
    created_at: string;
}

export interface HotelReview {
    id: number;
    hotel_id: string;
    review_text: string;
    rating: number;
    reviewer_name: string;
    review_date: string;
}

export interface HotelRoom {
    id: number;
    hotel_id: string;
    room_type: string;
    room_name: string;
    max_occupancy: number;
    bed_type: string;
    created_at: string;
}

export interface PopularDestination {
    city: string;
    country: string;
    hotel_count: number;
    average_rating: number;
}

export interface SystemStatistics {
    total_hotels: number;
    total_cities: number;
    total_countries: number;
    average_rating: number;
    average_stars: number;
    hotels_by_country: { country: string; count: number }[];
    hotels_by_city: { city: string; count: number }[];
}

export interface PaginationParams {
    limit?: number;
    offset?: number;
    sortBy?: 'name' | 'rating' | 'stars' | 'price';
    sortOrder?: 'ASC' | 'DESC';
}

export interface HotelFilters {
    city?: string;
    country?: string;
    minStars?: number;
    maxStars?: number;
    minRating?: number;
    maxRating?: number;
    amenities?: string[];
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
    message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
    pagination: {
        total: number;
        limit: number;
        offset: number;
        pages: number;
        currentPage: number;
    };
}

class StaticDataApiClient {
    private baseUrl: string;
    private apiKey?: string;
    private defaultHeaders: HeadersInit;

    constructor(baseUrl: string = 'http://localhost:3002/api', apiKey?: string) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
        
        this.defaultHeaders = {
            'Content-Type': 'application/json',
            ...(apiKey && { 'X-API-Key': apiKey })
        };
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
        const url = `${this.baseUrl}${endpoint}`;
        
        const config: RequestInit = {
            headers: {
                ...this.defaultHeaders,
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(url, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data: ApiResponse<T> = await response.json();
            return data;
        } catch (error) {
            console.error('API request failed:', error);
            return {
                success: false,
                data: null as any,
                error: 'Network error',
                message: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    // Health Check
    async healthCheck(): Promise<{ status: string; timestamp: string; service: string; version: string }> {
        const response = await fetch(`${this.baseUrl}/health`);
        return await response.json();
    }

    // Countries
    async getCountries(): Promise<ApiResponse<Country[]>> {
        return await this.request<Country[]>('/countries');
    }

    async getCountriesByContinent(continent: string): Promise<ApiResponse<Country[]>> {
        return await this.request<Country[]>(`/countries/${encodeURIComponent(continent)}`);
    }

    // Cities
    async getCitiesByCountry(countryCode: string): Promise<ApiResponse<City[]>> {
        return await this.request<City[]>(`/cities/${encodeURIComponent(countryCode)}`);
    }

    // Hotels
    async getHotels(
        filters: HotelFilters = {},
        pagination: PaginationParams = {}
    ): Promise<PaginatedResponse<Hotel>> {
        const params = new URLSearchParams();
        
        // Add filters
        Object.entries(filters).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                if (Array.isArray(value)) {
                    params.append(key, value.join(','));
                } else {
                    params.append(key, String(value));
                }
            }
        });

        // Add pagination
        Object.entries(pagination).forEach(([key, value]) => {
            if (value !== undefined && value !== null) {
                params.append(key, String(value));
            }
        });

        const queryString = params.toString();
        const endpoint = `/hotels${queryString ? `?${queryString}` : ''}`;
        
        return await this.request<Hotel[]>(endpoint) as PaginatedResponse<Hotel>;
    }

    async getHotelById(id: string): Promise<ApiResponse<Hotel>> {
        return await this.request<Hotel>(`/hotels/${encodeURIComponent(id)}`);
    }

    async getHotelFullDetails(id: string): Promise<ApiResponse<HotelFullDetails>> {
        return await this.request<HotelFullDetails>(`/hotels/${encodeURIComponent(id)}/full`);
    }

    async searchHotels(query: string, limit: number = 20): Promise<ApiResponse<Hotel[]>> {
        return await this.request<Hotel[]>(`/hotels/search/${encodeURIComponent(query)}?limit=${limit}`);
    }

    async getHotelsNearCoordinates(
        latitude: number,
        longitude: number,
        radiusKm: number = 50,
        limit: number = 20
    ): Promise<ApiResponse<Hotel[]>> {
        return await this.request<Hotel[]>(
            `/hotels/near/${latitude}/${longitude}?radius=${radiusKm}&limit=${limit}`
        );
    }

    async getHotelsByAmenities(amenities: string[], limit: number = 20): Promise<ApiResponse<Hotel[]>> {
        return await this.request<Hotel[]>(
            `/hotels/amenities/${encodeURIComponent(amenities.join(','))}?limit=${limit}`
        );
    }

    // Popular Destinations
    async getPopularDestinations(limit: number = 10): Promise<ApiResponse<PopularDestination[]>> {
        return await this.request<PopularDestination[]>(`/popular-destinations?limit=${limit}`);
    }

    // Statistics
    async getStatistics(): Promise<ApiResponse<SystemStatistics>> {
        return await this.request<SystemStatistics>('/statistics');
    }

    // Convenience Methods
    async getUAEHotels(
        filters: Omit<HotelFilters, 'country'> = {},
        pagination: PaginationParams = {}
    ): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({ ...filters, country: 'AE' }, pagination);
    }

    async getDubaiHotels(
        filters: Omit<HotelFilters, 'country' | 'city'> = {},
        pagination: PaginationParams = {}
    ): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({ ...filters, country: 'AE', city: 'Dubai' }, pagination);
    }

    async getAbuDhabiHotels(
        filters: Omit<HotelFilters, 'country' | 'city'> = {},
        pagination: PaginationParams = {}
    ): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({ ...filters, country: 'AE', city: 'Abu Dhabi' }, pagination);
    }

    async getSharjahHotels(
        filters: Omit<HotelFilters, 'country' | 'city'> = {},
        pagination: PaginationParams = {}
    ): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({ ...filters, country: 'AE', city: 'Sharjah' }, pagination);
    }

    // Search Methods
    async searchUAEHotels(query: string, limit: number = 20): Promise<ApiResponse<Hotel[]>> {
        const hotels = await this.searchHotels(query, limit);
        if (hotels.success) {
            hotels.data = hotels.data.filter(hotel => hotel.country_code === 'AE');
        }
        return hotels;
    }

    async getHotelsByRating(minRating: number, maxRating?: number): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({
            minRating,
            maxRating
        });
    }

    async getHotelsByStars(minStars: number, maxStars?: number): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({
            minStars,
            maxStars
        });
    }

    async getHotelsWithAmenities(amenities: string[]): Promise<PaginatedResponse<Hotel>> {
        return await this.getHotels({
            amenities
        });
    }

    // Utility Methods
    async getCitiesInUAE(): Promise<ApiResponse<City[]>> {
        return await this.getCitiesByCountry('AE');
    }

    async getHotelImages(hotelId: string): Promise<ApiResponse<HotelImage[]>> {
        const result = await this.getHotelFullDetails(hotelId);
        if (result.success) {
            return {
                success: true,
                data: result.data.images
            };
        }
        return {
            success: false,
            data: [],
            error: result.error,
            message: result.message
        };
    }

    async getHotelAmenities(hotelId: string): Promise<ApiResponse<HotelAmenity[]>> {
        const result = await this.getHotelFullDetails(hotelId);
        if (result.success) {
            return {
                success: true,
                data: result.data.amenities
            };
        }
        return {
            success: false,
            data: [],
            error: result.error,
            message: result.message
        };
    }

    async getHotelReviews(hotelId: string): Promise<ApiResponse<HotelReview[]>> {
        const result = await this.getHotelFullDetails(hotelId);
        if (result.success) {
            return {
                success: true,
                data: result.data.reviews
            };
        }
        return {
            success: false,
            data: [],
            error: result.error,
            message: result.message
        };
    }

    async getHotelRooms(hotelId: string): Promise<ApiResponse<HotelRoom[]>> {
        const result = await this.getHotelFullDetails(hotelId);
        if (result.success) {
            return {
                success: true,
                data: result.data.rooms
            };
        }
        return {
            success: false,
            data: [],
            error: result.error,
            message: result.message
        };
    }
}

// Create default client instance
export const staticDataApi = new StaticDataApiClient();

// Create client with custom configuration
export function createStaticDataApiClient(baseUrl?: string, apiKey?: string): StaticDataApiClient {
    return new StaticDataApiClient(baseUrl, apiKey);
}


export default StaticDataApiClient;