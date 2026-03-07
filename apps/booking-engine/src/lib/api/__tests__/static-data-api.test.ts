/**
 * Static Data API Client Tests
 * 
 * Comprehensive test suite for the Static Data API client.
 * Tests all API endpoints and functionality.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import StaticDataApiClient, {
    staticDataApi,
    createStaticDataApiClient,
    Hotel,
    City,
    Country,
    HotelFullDetails,
    PopularDestination,
    SystemStatistics,
    ApiResponse,
    PaginatedResponse
} from '../static-data-api';

// Mock fetch globally
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('StaticDataApiClient', () => {
    let client: StaticDataApiClient;

    beforeEach(() => {
        vi.clearAllMocks();
        client = new StaticDataApiClient('http://localhost:3002/api', 'test-api-key');
    });

    describe('Constructor', () => {
        it('should create client with default values', () => {
            const defaultClient = new StaticDataApiClient();
            expect(defaultClient).toBeInstanceOf(StaticDataApiClient);
        });

        it('should create client with custom base URL and API key', () => {
            const customClient = new StaticDataApiClient('https://api.example.com', 'custom-key');
            expect(customClient).toBeInstanceOf(StaticDataApiClient);
        });
    });

    describe('Health Check', () => {
        it('should return health status', async () => {
            const mockResponse = {
                status: 'healthy',
                timestamp: '2026-07-03T04:00:00.000Z',
                service: 'static-data-api',
                version: '1.0.0'
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.healthCheck();
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith('http://localhost:3002/api/health');
        });
    });

    describe('Countries API', () => {
        it('should get all countries', async () => {
            const mockCountries: Country[] = [
                {
                    id: 'AE',
                    name: 'United Arab Emirates',
                    alpha2_code: 'AE',
                    alpha3_code: 'ARE',
                    numeric_code: 784,
                    demonym: 'Emirati',
                    currency_code: 'AED',
                    currency_name: 'UAE Dirham',
                    currency_symbol: 'د.إ',
                    phone_prefix: '+971',
                    continent: 'Asia',
                    capital: 'Abu Dhabi',
                    population: 9991000,
                    area_km2: 83600.00,
                    timezones: ['Asia/Dubai'],
                    languages: ['ar']
                }
            ];

            const mockResponse: ApiResponse<Country[]> = {
                success: true,
                data: mockCountries
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getCountries();
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/countries',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });

        it('should get countries by continent', async () => {
            const mockCountries: Country[] = [
                {
                    id: 'AE',
                    name: 'United Arab Emirates',
                    alpha2_code: 'AE',
                    alpha3_code: 'ARE',
                    numeric_code: 784,
                    demonym: 'Emirati',
                    currency_code: 'AED',
                    currency_name: 'UAE Dirham',
                    currency_symbol: 'د.إ',
                    phone_prefix: '+971',
                    continent: 'Asia',
                    capital: 'Abu Dhabi',
                    population: 9991000,
                    area_km2: 83600.00,
                    timezones: ['Asia/Dubai'],
                    languages: ['ar']
                }
            ];

            const mockResponse: ApiResponse<Country[]> = {
                success: true,
                data: mockCountries
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getCountriesByContinent('Asia');
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/countries/Asia',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });
    });

    describe('Cities API', () => {
        it('should get cities by country', async () => {
            const mockCities: City[] = [
                {
                    id: 'dubai',
                    name: 'Dubai',
                    country_code: 'AE',
                    country_name: 'United Arab Emirates',
                    latitude: 25.2048,
                    longitude: 55.2708,
                    timezone: 'Asia/Dubai',
                    population: 3331420,
                    is_capital: false
                }
            ];

            const mockResponse: ApiResponse<City[]> = {
                success: true,
                data: mockCities
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getCitiesByCountry('AE');
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/cities/AE',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });
    });

    describe('Hotels API', () => {
        it('should get hotels with filters and pagination', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: PaginatedResponse<Hotel> = {
                success: true,
                data: mockHotels,
                pagination: {
                    total: 8483,
                    limit: 20,
                    offset: 0,
                    pages: 425,
                    currentPage: 1
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getHotels(
                { city: 'Dubai', country: 'AE', minStars: 4 },
                { limit: 20, offset: 0, sortBy: 'rating', sortOrder: 'DESC' }
            );
            
            expect(result).toEqual(mockResponse);
            
            // Check that the URL was constructed correctly
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('http://localhost:3002/api/hotels?'),
                expect.any(Object)
            );
        });

        it('should get hotel by ID', async () => {
            const mockHotel: Hotel = {
                id: 'lpd7009',
                name: 'Canopy by Hilton Dubai Al Seef',
                city: 'Dubai',
                country: 'United Arab Emirates',
                country_code: 'AE',
                latitude: 25.2697,
                longitude: 55.2975,
                stars: 4.0,
                rating: 9.0,
                address: 'Al Seef Road, Dubai, United Arab Emirates',
                description: 'Boutique hotel in historic Al Seef district',
                check_in_time: '15:00',
                check_out_time: '12:00',
                amenities_count: 15,
                images_count: 25,
                created_at: '2026-07-03T03:00:00.000Z',
                updated_at: '2026-07-03T03:00:00.000Z'
            };

            const mockResponse: ApiResponse<Hotel> = {
                success: true,
                data: mockHotel
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getHotelById('lpd7009');
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/hotels/lpd7009',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });

        it('should get hotel full details', async () => {
            const mockHotelFullDetails: HotelFullDetails = {
                hotel: {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                },
                images: [],
                amenities: [],
                descriptions: [],
                contacts: [],
                reviews: [],
                rooms: []
            };

            const mockResponse: ApiResponse<HotelFullDetails> = {
                success: true,
                data: mockHotelFullDetails
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getHotelFullDetails('lpd7009');
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/hotels/lpd7009/full',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });

        it('should search hotels', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: ApiResponse<Hotel[]> = {
                success: true,
                data: mockHotels
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.searchHotels('Dubai', 20);
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/hotels/search/Dubai?limit=20',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });

        it('should get hotels near coordinates', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: ApiResponse<Hotel[]> = {
                success: true,
                data: mockHotels
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getHotelsNearCoordinates(25.2697, 55.2975, 50, 20);
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/hotels/near/25.2697/55.2975?radius=50&limit=20',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });

        it('should get hotels by amenities', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: ApiResponse<Hotel[]> = {
                success: true,
                data: mockHotels
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getHotelsByAmenities(['Free WiFi', 'Pool'], 20);
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/hotels/amenities/Free%20WiFi,Pool?limit=20',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });
    });

    describe('Popular Destinations API', () => {
        it('should get popular destinations', async () => {
            const mockDestinations: PopularDestination[] = [
                {
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    hotel_count: 4231,
                    average_rating: 8.5
                }
            ];

            const mockResponse: ApiResponse<PopularDestination[]> = {
                success: true,
                data: mockDestinations
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getPopularDestinations(10);
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/popular-destinations?limit=10',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });
    });

    describe('Statistics API', () => {
        it('should get system statistics', async () => {
            const mockStatistics: SystemStatistics = {
                total_hotels: 8483,
                total_cities: 67,
                total_countries: 195,
                average_rating: 8.2,
                average_stars: 3.8,
                hotels_by_country: [
                    {
                        country: 'United Arab Emirates',
                        count: 8483
                    }
                ],
                hotels_by_city: [
                    {
                        city: 'Dubai',
                        count: 4231
                    }
                ]
            };

            const mockResponse: ApiResponse<SystemStatistics> = {
                success: true,
                data: mockStatistics
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getStatistics();
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/statistics',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });
    });

    describe('Convenience Methods', () => {
        it('should get UAE hotels', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: PaginatedResponse<Hotel> = {
                success: true,
                data: mockHotels,
                pagination: {
                    total: 8483,
                    limit: 20,
                    offset: 0,
                    pages: 425,
                    currentPage: 1
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getUAEHotels(
                { minStars: 4 },
                { limit: 20, offset: 0 }
            );
            
            expect(result).toEqual(mockResponse);
            
            // Verify that country filter was automatically added
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('country=AE'),
                expect.any(Object)
            );
        });

        it('should get Dubai hotels', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: PaginatedResponse<Hotel> = {
                success: true,
                data: mockHotels,
                pagination: {
                    total: 4231,
                    limit: 20,
                    offset: 0,
                    pages: 212,
                    currentPage: 1
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getDubaiHotels(
                { minStars: 4 },
                { limit: 20, offset: 0 }
            );
            
            expect(result).toEqual(mockResponse);
            
            // Verify that country and city filters were automatically added
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('country=AE'),
                expect.any(Object)
            );
            expect(mockFetch).toHaveBeenCalledWith(
                expect.stringContaining('city=Dubai'),
                expect.any(Object)
            );
        });
    });

    describe('Utility Methods', () => {
        it('should get cities in UAE', async () => {
            const mockCities: City[] = [
                {
                    id: 'dubai',
                    name: 'Dubai',
                    country_code: 'AE',
                    country_name: 'United Arab Emirates',
                    latitude: 25.2048,
                    longitude: 55.2708,
                    timezone: 'Asia/Dubai',
                    population: 3331420,
                    is_capital: false
                }
            ];

            const mockResponse: ApiResponse<City[]> = {
                success: true,
                data: mockCities
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getCitiesInUAE();
            
            expect(result).toEqual(mockResponse);
            expect(mockFetch).toHaveBeenCalledWith(
                'http://localhost:3002/api/cities/AE',
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-API-Key': 'test-api-key'
                    }
                }
            );
        });

        it('should get hotel images', async () => {
            const mockHotelFullDetails: HotelFullDetails = {
                hotel: {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                },
                images: [
                    {
                        id: 1,
                        hotel_id: 'lpd7009',
                        image_url: 'https://example.com/hotel-image.jpg',
                        is_primary: true,
                        image_type: 'exterior',
                        created_at: '2026-07-03T03:00:00.000Z'
                    }
                ],
                amenities: [],
                descriptions: [],
                contacts: [],
                reviews: [],
                rooms: []
            };

            const mockResponse: ApiResponse<HotelFullDetails> = {
                success: true,
                data: mockHotelFullDetails
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await client.getHotelImages('lpd7009');
            
            expect(result).toEqual({
                success: true,
                data: mockHotelFullDetails.images
            });
        });
    });

    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            const result = await client.getCountries();
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
            expect(result.data).toBeNull();
        });

        it('should handle HTTP errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500
            });

            const result = await client.getCountries();
            
            expect(result.success).toBe(false);
            expect(result.error).toBe('Network error');
        });
    });

    describe('Default Client Instance', () => {
        it('should use default client for convenience methods', async () => {
            const mockHotels: Hotel[] = [
                {
                    id: 'lpd7009',
                    name: 'Canopy by Hilton Dubai Al Seef',
                    city: 'Dubai',
                    country: 'United Arab Emirates',
                    country_code: 'AE',
                    latitude: 25.2697,
                    longitude: 55.2975,
                    stars: 4.0,
                    rating: 9.0,
                    address: 'Al Seef Road, Dubai, United Arab Emirates',
                    description: 'Boutique hotel in historic Al Seef district',
                    check_in_time: '15:00',
                    check_out_time: '12:00',
                    amenities_count: 15,
                    images_count: 25,
                    created_at: '2026-07-03T03:00:00.000Z',
                    updated_at: '2026-07-03T03:00:00.000Z'
                }
            ];

            const mockResponse: PaginatedResponse<Hotel> = {
                success: true,
                data: mockHotels,
                pagination: {
                    total: 8483,
                    limit: 20,
                    offset: 0,
                    pages: 425,
                    currentPage: 1
                }
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve(mockResponse)
            });

            const result = await staticDataApi.getUAEHotels();
            
            expect(result).toEqual(mockResponse);
        });
    });

    describe('Factory Function', () => {
        it('should create client with custom configuration', () => {
            const customClient = createStaticDataApiClient('https://api.example.com', 'custom-key');
            expect(customClient).toBeInstanceOf(StaticDataApiClient);
        });
    });
});