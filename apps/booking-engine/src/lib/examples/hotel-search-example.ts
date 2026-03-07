/**
 * Hotel Search Example
 * 
 * Comprehensive example demonstrating how to use the Static Data API
 * for hotel search and discovery in a real application.
 */

import { staticDataApi } from '../api/static-data-api';
import type { Hotel, City, Country, HotelFilters, PaginationParams } from '../api/static-data-api';

// Example interfaces for application state
export interface SearchState {
    destination: string;
    checkIn: Date;
    checkOut: Date;
    guests: number;
    rooms: number;
}

export interface FilterState {
    minStars: number;
    maxStars: number;
    minRating: number;
    maxRating: number;
    amenities: string[];
    priceRange: { min: number; max: number };
}

export interface SearchResult {
    hotels: Hotel[];
    pagination: {
        total: number;
        limit: number;
        offset: number;
        pages: number;
        currentPage: number;
    };
    filters: HotelFilters;
    appliedFilters: FilterState;
}

export class HotelSearchService {
    private searchState: SearchState;
    private filterState: FilterState;
    private currentResults: SearchResult | null = null;

    constructor() {
        this.searchState = {
            destination: '',
            checkIn: new Date(),
            checkOut: new Date(Date.now() + 24 * 60 * 60 * 1000), // Tomorrow
            guests: 2,
            rooms: 1
        };

        this.filterState = {
            minStars: 0,
            maxStars: 5,
            minRating: 0,
            maxRating: 10,
            amenities: [],
            priceRange: { min: 0, max: 1000 }
        };
    }

    // Search State Management
    updateSearchState(updates: Partial<SearchState>): void {
        this.searchState = { ...this.searchState, ...updates };
    }

    getSearchState(): SearchState {
        return { ...this.searchState };
    }

    // Filter State Management
    updateFilterState(updates: Partial<FilterState>): void {
        this.filterState = { ...this.filterState, ...updates };
    }

    getFilterState(): FilterState {
        return { ...this.filterState };
    }

    // Hotel Search
    async searchHotels(
        destination?: string,
        pagination: PaginationParams = { limit: 20, offset: 0 }
    ): Promise<SearchResult> {
        try {
            // Determine filters based on destination and current state
            const filters: HotelFilters = this.buildFilters(destination);
            
            // Make API request
            const response = await staticDataApi.getHotels(filters, pagination);
            
            if (response.success) {
                this.currentResults = {
                    hotels: response.data,
                    pagination: response.pagination,
                    filters,
                    appliedFilters: { ...this.filterState }
                };
                
                return this.currentResults;
            } else {
                throw new Error(response.error || 'Search failed');
            }
        } catch (error) {
            console.error('Hotel search failed:', error);
            throw error;
        }
    }

    // Advanced Search Methods
    async searchByCity(city: string, pagination?: PaginationParams): Promise<SearchResult> {
        return this.searchHotels(city, pagination);
    }

    async searchByCoordinates(
        latitude: number,
        longitude: number,
        radiusKm: number = 50,
        pagination?: PaginationParams
    ): Promise<SearchResult> {
        try {
            const response = await staticDataApi.getHotelsNearCoordinates(
                latitude,
                longitude,
                radiusKm,
                pagination?.limit || 20
            );

            if (response.success) {
                this.currentResults = {
                    hotels: response.data,
                    pagination: {
                        total: response.data.length,
                        limit: pagination?.limit || 20,
                        offset: pagination?.offset || 0,
                        pages: Math.ceil(response.data.length / (pagination?.limit || 20)),
                        currentPage: Math.floor((pagination?.offset || 0) / (pagination?.limit || 20)) + 1
                    },
                    filters: { city: 'Near Coordinates' }, // Use a placeholder since coordinates aren't in HotelFilters
                    appliedFilters: { ...this.filterState }
                };

                return this.currentResults;
            } else {
                throw new Error(response.error || 'Search by coordinates failed');
            }
        } catch (error) {
            console.error('Search by coordinates failed:', error);
            throw error;
        }
    }

    async searchByAmenities(amenities: string[], pagination?: PaginationParams): Promise<SearchResult> {
        try {
            const response = await staticDataApi.getHotelsByAmenities(amenities, pagination?.limit || 20);

            if (response.success) {
                this.currentResults = {
                    hotels: response.data,
                    pagination: {
                        total: response.data.length,
                        limit: pagination?.limit || 20,
                        offset: pagination?.offset || 0,
                        pages: Math.ceil(response.data.length / (pagination?.limit || 20)),
                        currentPage: Math.floor((pagination?.offset || 0) / (pagination?.limit || 20)) + 1
                    },
                    filters: { amenities },
                    appliedFilters: { ...this.filterState }
                };

                return this.currentResults;
            } else {
                throw new Error(response.error || 'Search by amenities failed');
            }
        } catch (error) {
            console.error('Search by amenities failed:', error);
            throw error;
        }
    }

    // Filter Management
    applyFilters(filters: Partial<FilterState>): void {
        this.updateFilterState(filters);
    }

    clearFilters(): void {
        this.filterState = {
            minStars: 0,
            maxStars: 5,
            minRating: 0,
            maxRating: 10,
            amenities: [],
            priceRange: { min: 0, max: 1000 }
        };
    }

    // Pagination
    async goToPage(page: number, limit: number = 20): Promise<SearchResult> {
        if (!this.currentResults) {
            throw new Error('No search results available');
        }

        const offset = (page - 1) * limit;
        return this.searchHotels(undefined, { limit, offset });
    }

    // Hotel Details
    async getHotelDetails(hotelId: string): Promise<Hotel | null> {
        try {
            const response = await staticDataApi.getHotelFullDetails(hotelId);
            
            if (response.success) {
                return response.data.hotel;
            } else {
                console.error('Failed to get hotel details:', response.error);
                return null;
            }
        } catch (error) {
            console.error('Error getting hotel details:', error);
            return null;
        }
    }

    // Utility Methods
    private buildFilters(destination?: string): HotelFilters {
        const filters: HotelFilters = {};

        // Add destination filter
        if (destination) {
            filters.city = destination;
        }

        // Add rating filters
        if (this.filterState.minRating > 0) {
            filters.minRating = this.filterState.minRating;
        }
        if (this.filterState.maxRating < 10) {
            filters.maxRating = this.filterState.maxRating;
        }

        // Add star filters
        if (this.filterState.minStars > 0) {
            filters.minStars = this.filterState.minStars;
        }
        if (this.filterState.maxStars < 5) {
            filters.maxStars = this.filterState.maxStars;
        }

        // Add amenities filter
        if (this.filterState.amenities.length > 0) {
            filters.amenities = this.filterState.amenities;
        }

        return filters;
    }

    // Popular Destinations
    async getPopularDestinations(): Promise<City[]> {
        try {
            const response = await staticDataApi.getPopularDestinations(10);
            
            if (response.success) {
                // Convert PopularDestination to City format for consistency
                return response.data.map(dest => ({
                    id: dest.city.toLowerCase().replace(/\s+/g, '-'),
                    name: dest.city,
                    country_code: 'AE', // Assuming UAE for this example
                    country_name: dest.country,
                    latitude: 0, // Would need actual coordinates
                    longitude: 0,
                    timezone: 'Asia/Dubai',
                    population: 0,
                    is_capital: false
                }));
            } else {
                throw new Error(response.error || 'Failed to get popular destinations');
            }
        } catch (error) {
            console.error('Failed to get popular destinations:', error);
            return [];
        }
    }

    // Statistics
    async getSearchStatistics(): Promise<any> {
        try {
            const response = await staticDataApi.getStatistics();
            
            if (response.success) {
                return response.data;
            } else {
                throw new Error(response.error || 'Failed to get statistics');
            }
        } catch (error) {
            console.error('Failed to get statistics:', error);
            return null;
        }
    }
}

// Example Usage Functions
export class HotelSearchExamples {
    private searchService = new HotelSearchService();

    // Example 1: Basic Hotel Search
    async basicHotelSearch(): Promise<void> {
        console.log('=== Basic Hotel Search Example ===');

        try {
            const results = await this.searchService.searchHotels('Dubai', {
                limit: 10,
                offset: 0,
                sortBy: 'rating',
                sortOrder: 'DESC'
            });

            console.log('Found', results.hotels.length, 'hotels in Dubai');
            console.log('Total hotels available:', results.pagination.total);
            
            results.hotels.forEach(hotel => {
                console.log(`- ${hotel.name} (${hotel.stars}★, ${hotel.rating}/10)`);
            });

        } catch (error) {
            console.error('Basic search failed:', error);
        }
    }

    // Example 2: Filtered Search
    async filteredHotelSearch(): Promise<void> {
        console.log('\n=== Filtered Hotel Search Example ===');

        try {
            // Apply filters
            this.searchService.applyFilters({
                minStars: 4,
                minRating: 8,
                amenities: ['Free WiFi', 'Pool']
            });

            const results = await this.searchService.searchHotels('Abu Dhabi');

            console.log('Found', results.hotels.length, '4+ star hotels with high ratings in Abu Dhabi');
            
            results.hotels.forEach(hotel => {
                console.log(`- ${hotel.name} (${hotel.stars}★, ${hotel.rating}/10)`);
            });

        } catch (error) {
            console.error('Filtered search failed:', error);
        }
    }

    // Example 3: Search by Coordinates
    async searchByCoordinates(): Promise<void> {
        console.log('\n=== Search by Coordinates Example ===');

        try {
            const dubaiLat = 25.2048;
            const dubaiLon = 55.2708;

            const results = await this.searchService.searchByCoordinates(
                dubaiLat,
                dubaiLon,
                20, // 20km radius
                { limit: 15, offset: 0 }
            );

            console.log('Found', results.hotels.length, 'hotels near Dubai coordinates');
            
            results.hotels.forEach(hotel => {
                console.log(`- ${hotel.name} (Distance not available)`);
            });

        } catch (error) {
            console.error('Coordinate search failed:', error);
        }
    }

    // Example 4: Hotel Details
    async getHotelDetailsExample(): Promise<void> {
        console.log('\n=== Hotel Details Example ===');

        try {
            // First, get a hotel ID
            const searchResults = await this.searchService.searchHotels('Dubai', { limit: 1 });
            
            if (searchResults.hotels.length > 0) {
                const hotelId = searchResults.hotels[0].id;
                const hotelDetails = await this.searchService.getHotelDetails(hotelId);

                if (hotelDetails) {
                    console.log('Hotel Details:');
                    console.log('- Name:', hotelDetails.name);
                    console.log('- Address:', hotelDetails.address);
                    console.log('- Rating:', hotelDetails.rating);
                    console.log('- Stars:', hotelDetails.stars);
                    console.log('- Check-in:', hotelDetails.check_in_time);
                    console.log('- Check-out:', hotelDetails.check_out_time);
                }
            }

        } catch (error) {
            console.error('Hotel details search failed:', error);
        }
    }

    // Example 5: Popular Destinations
    async popularDestinationsExample(): Promise<void> {
        console.log('\n=== Popular Destinations Example ===');

        try {
            const destinations = await this.searchService.getPopularDestinations();

            console.log('Popular destinations in UAE:');
            destinations.forEach((dest, index) => {
                console.log(`${index + 1}. ${dest.name}, ${dest.country_name} (${dest.population} hotels)`);
            });

        } catch (error) {
            console.error('Popular destinations search failed:', error);
        }
    }

    // Example 6: Statistics
    async statisticsExample(): Promise<void> {
        console.log('\n=== Statistics Example ===');

        try {
            const stats = await this.searchService.getSearchStatistics();

            if (stats) {
                console.log('System Statistics:');
                console.log('- Total Hotels:', stats.total_hotels);
                console.log('- Total Cities:', stats.total_cities);
                console.log('- Average Rating:', stats.average_rating);
                console.log('- Average Stars:', stats.average_stars);
                
                console.log('\nTop 5 Cities by Hotel Count:');
                stats.hotels_by_city.slice(0, 5).forEach((city, index) => {
                    console.log(`${index + 1}. ${city.city}: ${city.count} hotels`);
                });
            }

        } catch (error) {
            console.error('Statistics search failed:', error);
        }
    }

    // Run All Examples
    async runAllExamples(): Promise<void> {
        console.log('🚀 Starting Hotel Search Examples...\n');

        await this.basicHotelSearch();
        await this.filteredHotelSearch();
        await this.searchByCoordinates();
        await this.getHotelDetailsExample();
        await this.popularDestinationsExample();
        await this.statisticsExample();

        console.log('\n✅ All examples completed!');
    }
}

// Export for use in other modules
export const hotelSearchService = new HotelSearchService();
export const hotelSearchExamples = new HotelSearchExamples();

// Default export
export default HotelSearchService;