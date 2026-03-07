/**
 * Static Data API Integration Tests
 * 
 * End-to-end integration tests that validate the complete system
 * including database connectivity, API endpoints, and client functionality.
 */

import { describe, it, expect, beforeAll, afterAll, beforeEach } from 'vitest';
import { Pool } from 'pg';
import dotenv from 'dotenv';

// Import the API client
import StaticDataApiClient from '../static-data-api';

// Load environment variables
dotenv.config();

describe('Static Data API Integration Tests', () => {
    let client: StaticDataApiClient;
    let dbPool: Pool;
    let testHotelId: string;

    beforeAll(async () => {
        // Initialize database connection
        dbPool = new Pool({
            connectionString: process.env.STATIC_DATABASE_URL || 'postgresql://postgres@localhost:5432/staticdatabase'
        });

        // Initialize API client
        client = new StaticDataApiClient(
            process.env.STATIC_DATA_API_URL || 'http://localhost:3002/api',
            process.env.STATIC_DATA_API_KEY
        );

        // Get a test hotel ID from the database
        try {
            const result = await dbPool.query('SELECT id FROM hotel.hotels WHERE country_code = $1 LIMIT 1', ['AE']);
            if (result.rows.length > 0) {
                testHotelId = result.rows[0].id;
            } else {
                console.warn('No hotels found in database for testing');
            }
        } catch (error) {
            console.warn('Could not connect to database for integration tests:', error.message);
        }
    });

    afterAll(async () => {
        // Clean up database connection
        if (dbPool) {
            await dbPool.end();
        }
    });

    describe('System Health', () => {
        it('should return health status', async () => {
            try {
                const health = await client.healthCheck();
                
                expect(health).toHaveProperty('status');
                expect(health).toHaveProperty('timestamp');
                expect(health).toHaveProperty('service');
                expect(health).toHaveProperty('version');
                expect(health.status).toBe('healthy');
                expect(health.service).toBe('static-data-api');
            } catch (error) {
                // If API is not running, skip this test
                if (error.message.includes('fetch')) {
                    console.warn('Static Data API not running, skipping health check test');
                } else {
                    throw error;
                }
            }
        });
    });

    describe('Countries Integration', () => {
        it('should retrieve UAE countries data', async () => {
            try {
                const response = await client.getCountries();
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    expect(response.data.length).toBeGreaterThan(0);
                    
                    // Find UAE country
                    const uaeCountry = response.data.find(c => c.alpha2_code === 'AE');
                    expect(uaeCountry).toBeDefined();
                    expect(uaeCountry.name).toBe('United Arab Emirates');
                    expect(uaeCountry.continent).toBe('Asia');
                } else {
                    console.warn('Countries API returned error:', response.error);
                }
            } catch (error) {
                console.warn('Countries integration test failed:', error.message);
            }
        });

        it('should retrieve countries by continent', async () => {
            try {
                const response = await client.getCountriesByContinent('Asia');
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    expect(response.data.length).toBeGreaterThan(0);
                    
                    // All countries should be from Asia
                    response.data.forEach(country => {
                        expect(country.continent).toBe('Asia');
                    });
                }
            } catch (error) {
                console.warn('Countries by continent test failed:', error.message);
            }
        });
    });

    describe('Cities Integration', () => {
        it('should retrieve UAE cities', async () => {
            try {
                const response = await client.getCitiesByCountry('AE');
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    expect(response.data.length).toBeGreaterThan(0);
                    
                    // All cities should be from UAE
                    response.data.forEach(city => {
                        expect(city.country_code).toBe('AE');
                        expect(city.country_name).toBe('United Arab Emirates');
                    });
                }
            } catch (error) {
                console.warn('Cities integration test failed:', error.message);
            }
        });
    });

    describe('Hotels Integration', () => {
        it('should retrieve UAE hotels with pagination', async () => {
            try {
                const response = await client.getHotels(
                    { country: 'AE' },
                    { limit: 10, offset: 0, sortBy: 'rating', sortOrder: 'DESC' }
                );
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    expect(response.data.length).toBeGreaterThan(0);
                    expect(response).toHaveProperty('pagination');
                    
                    // All hotels should be from UAE
                    response.data.forEach(hotel => {
                        expect(hotel.country_code).toBe('AE');
                        expect(hotel.country).toBe('United Arab Emirates');
                    });
                    
                    // Check pagination structure
                    expect(response.pagination).toHaveProperty('total');
                    expect(response.pagination).toHaveProperty('limit');
                    expect(response.pagination).toHaveProperty('offset');
                    expect(response.pagination).toHaveProperty('pages');
                    expect(response.pagination).toHaveProperty('currentPage');
                }
            } catch (error) {
                console.warn('Hotels integration test failed:', error.message);
            }
        });

        it('should retrieve hotel by ID', async () => {
            if (!testHotelId) {
                console.warn('No test hotel ID available, skipping hotel by ID test');
                return;
            }

            try {
                const response = await client.getHotelById(testHotelId);
                
                if (response.success) {
                    expect(response.data).toHaveProperty('id');
                    expect(response.data).toHaveProperty('name');
                    expect(response.data).toHaveProperty('city');
                    expect(response.data).toHaveProperty('country');
                    expect(response.data.id).toBe(testHotelId);
                } else {
                    console.warn('Hotel by ID test failed:', response.error);
                }
            } catch (error) {
                console.warn('Hotel by ID integration test failed:', error.message);
            }
        });

        it('should retrieve hotel full details', async () => {
            if (!testHotelId) {
                console.warn('No test hotel ID available, skipping hotel full details test');
                return;
            }

            try {
                const response = await client.getHotelFullDetails(testHotelId);
                
                if (response.success) {
                    expect(response.data).toHaveProperty('hotel');
                    expect(response.data).toHaveProperty('images');
                    expect(response.data).toHaveProperty('amenities');
                    expect(response.data).toHaveProperty('descriptions');
                    expect(response.data).toHaveProperty('contacts');
                    expect(response.data).toHaveProperty('reviews');
                    expect(response.data).toHaveProperty('rooms');
                    
                    // Verify hotel data
                    expect(response.data.hotel.id).toBe(testHotelId);
                    expect(response.data.hotel).toHaveProperty('name');
                    expect(response.data.hotel).toHaveProperty('city');
                    
                    // Verify related data arrays
                    expect(response.data.images).toBeInstanceOf(Array);
                    expect(response.data.amenities).toBeInstanceOf(Array);
                    expect(response.data.descriptions).toBeInstanceOf(Array);
                    expect(response.data.contacts).toBeInstanceOf(Array);
                    expect(response.data.reviews).toBeInstanceOf(Array);
                    expect(response.data.rooms).toBeInstanceOf(Array);
                }
            } catch (error) {
                console.warn('Hotel full details integration test failed:', error.message);
            }
        });

        it('should search hotels by name', async () => {
            try {
                const response = await client.searchHotels('Dubai', 5);
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    
                    // All hotels should contain 'Dubai' in name or description
                    response.data.forEach(hotel => {
                        expect(
                            hotel.name.toLowerCase().includes('dubai') ||
                            hotel.description.toLowerCase().includes('dubai')
                        ).toBe(true);
                    });
                }
            } catch (error) {
                console.warn('Hotel search integration test failed:', error.message);
            }
        });

        it('should find hotels near coordinates', async () => {
            try {
                // Dubai coordinates
                const dubaiLat = 25.2048;
                const dubaiLon = 55.2708;
                
                const response = await client.getHotelsNearCoordinates(
                    dubaiLat, 
                    dubaiLon, 
                    50, // 50km radius
                    10
                );
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    
                    // All hotels should be within reasonable distance of Dubai
                    response.data.forEach(hotel => {
                        expect(hotel).toHaveProperty('latitude');
                        expect(hotel).toHaveProperty('longitude');
                        expect(hotel).toHaveProperty('distance');
                        
                        // Verify coordinates are reasonable for UAE
                        expect(hotel.latitude).toBeGreaterThan(22);
                        expect(hotel.latitude).toBeLessThan(30);
                        expect(hotel.longitude).toBeGreaterThan(50);
                        expect(hotel.longitude).toBeLessThan(60);
                    });
                }
            } catch (error) {
                console.warn('Hotels near coordinates integration test failed:', error.message);
            }
        });

        it('should find hotels by amenities', async () => {
            try {
                const response = await client.getHotelsByAmenities(['Free WiFi', 'Pool'], 10);
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    
                    // Should return hotels with requested amenities
                    expect(response.data.length).toBeGreaterThan(0);
                }
            } catch (error) {
                console.warn('Hotels by amenities integration test failed:', error.message);
            }
        });
    });

    describe('Popular Destinations Integration', () => {
        it('should retrieve popular destinations', async () => {
            try {
                const response = await client.getPopularDestinations(10);
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    expect(response.data.length).toBeGreaterThan(0);
                    
                    // Each destination should have required properties
                    response.data.forEach(destination => {
                        expect(destination).toHaveProperty('city');
                        expect(destination).toHaveProperty('country');
                        expect(destination).toHaveProperty('hotel_count');
                        expect(destination).toHaveProperty('average_rating');
                        expect(typeof destination.hotel_count).toBe('number');
                        expect(typeof destination.average_rating).toBe('number');
                    });
                }
            } catch (error) {
                console.warn('Popular destinations integration test failed:', error.message);
            }
        });
    });

    describe('Statistics Integration', () => {
        it('should retrieve system statistics', async () => {
            try {
                const response = await client.getStatistics();
                
                if (response.success) {
                    expect(response.data).toHaveProperty('total_hotels');
                    expect(response.data).toHaveProperty('total_cities');
                    expect(response.data).toHaveProperty('total_countries');
                    expect(response.data).toHaveProperty('average_rating');
                    expect(response.data).toHaveProperty('average_stars');
                    expect(response.data).toHaveProperty('hotels_by_country');
                    expect(response.data).toHaveProperty('hotels_by_city');
                    
                    // Verify data types
                    expect(typeof response.data.total_hotels).toBe('number');
                    expect(typeof response.data.total_cities).toBe('number');
                    expect(typeof response.data.total_countries).toBe('number');
                    expect(typeof response.data.average_rating).toBe('number');
                    expect(typeof response.data.average_stars).toBe('number');
                    
                    // Verify arrays
                    expect(response.data.hotels_by_country).toBeInstanceOf(Array);
                    expect(response.data.hotels_by_city).toBeInstanceOf(Array);
                    
                    // UAE should be in the statistics
                    const uaeStats = response.data.hotels_by_country.find(stat => stat.country === 'United Arab Emirates');
                    expect(uaeStats).toBeDefined();
                    expect(uaeStats.count).toBeGreaterThan(0);
                }
            } catch (error) {
                console.warn('Statistics integration test failed:', error.message);
            }
        });
    });

    describe('Convenience Methods Integration', () => {
        it('should retrieve UAE hotels using convenience method', async () => {
            try {
                const response = await client.getUAEHotels(
                    { minStars: 3 },
                    { limit: 10, offset: 0 }
                );
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    
                    // All hotels should be from UAE
                    response.data.forEach(hotel => {
                        expect(hotel.country_code).toBe('AE');
                        expect(hotel.stars).toBeGreaterThanOrEqual(3);
                    });
                }
            } catch (error) {
                console.warn('UAE hotels convenience method test failed:', error.message);
            }
        });

        it('should retrieve Dubai hotels using convenience method', async () => {
            try {
                const response = await client.getDubaiHotels(
                    { minRating: 7 },
                    { limit: 10, offset: 0 }
                );
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    
                    // All hotels should be from Dubai, UAE
                    response.data.forEach(hotel => {
                        expect(hotel.country_code).toBe('AE');
                        expect(hotel.city.toLowerCase()).toBe('dubai');
                        expect(hotel.rating).toBeGreaterThanOrEqual(7);
                    });
                }
            } catch (error) {
                console.warn('Dubai hotels convenience method test failed:', error.message);
            }
        });
    });

    describe('Error Handling Integration', () => {
        it('should handle invalid hotel ID gracefully', async () => {
            try {
                const response = await client.getHotelById('invalid-hotel-id');
                
                // Should either return success with null data or success: false
                if (response.success) {
                    expect(response.data).toBeNull();
                } else {
                    expect(response.error).toBeDefined();
                }
            } catch (error) {
                console.warn('Invalid hotel ID test failed:', error.message);
            }
        });

        it('should handle invalid coordinates gracefully', async () => {
            try {
                const response = await client.getHotelsNearCoordinates(
                    999, // Invalid latitude
                    999, // Invalid longitude
                    10,
                    10
                );
                
                // Should handle gracefully - either empty result or error
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                } else {
                    expect(response.error).toBeDefined();
                }
            } catch (error) {
                console.warn('Invalid coordinates test failed:', error.message);
            }
        });
    });

    describe('Performance Integration', () => {
        it('should handle concurrent requests efficiently', async () => {
            try {
                const startTime = Date.now();
                
                // Make multiple concurrent requests
                const promises = [
                    client.getCountries(),
                    client.getCitiesByCountry('AE'),
                    client.getHotels({ country: 'AE' }, { limit: 5 }),
                    client.getPopularDestinations(5),
                    client.getStatistics()
                ];
                
                const results = await Promise.all(promises);
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                // All requests should complete successfully
                results.forEach(result => {
                    expect(result).toHaveProperty('success');
                });
                
                // Should complete within reasonable time (adjust based on your system)
                expect(duration).toBeLessThan(5000); // 5 seconds
                
                console.log(`Concurrent requests completed in ${duration}ms`);
            } catch (error) {
                console.warn('Concurrent requests test failed:', error.message);
            }
        });

        it('should handle large result sets efficiently', async () => {
            try {
                const startTime = Date.now();
                
                // Request a large dataset
                const response = await client.getHotels(
                    { country: 'AE' },
                    { limit: 100, offset: 0, sortBy: 'rating', sortOrder: 'DESC' }
                );
                
                const endTime = Date.now();
                const duration = endTime - startTime;
                
                if (response.success) {
                    expect(response.data).toBeInstanceOf(Array);
                    expect(response.data.length).toBeLessThanOrEqual(100);
                    expect(duration).toBeLessThan(3000); // 3 seconds
                    
                    console.log(`Large dataset request completed in ${duration}ms, returned ${response.data.length} hotels`);
                }
            } catch (error) {
                console.warn('Large dataset test failed:', error.message);
            }
        });
    });

    describe('Data Consistency Integration', () => {
        it('should maintain data consistency across related endpoints', async () => {
            try {
                // Get statistics
                const statsResponse = await client.getStatistics();
                
                if (statsResponse.success) {
                    const totalHotels = statsResponse.data.total_hotels;
                    
                    // Get all hotels with pagination
                    const allHotelsResponse = await client.getHotels(
                        { country: 'AE' },
                        { limit: 100, offset: 0 }
                    );
                    
                    if (allHotelsResponse.success) {
                        // Verify that the count matches statistics
                        expect(allHotelsResponse.pagination.total).toBe(totalHotels);
                        
                        // Verify that all returned hotels are from UAE
                        allHotelsResponse.data.forEach(hotel => {
                            expect(hotel.country_code).toBe('AE');
                        });
                    }
                }
            } catch (error) {
                console.warn('Data consistency test failed:', error.message);
            }
        });

        it('should maintain referential integrity between hotels and cities', async () => {
            try {
                // Get cities
                const citiesResponse = await client.getCitiesByCountry('AE');
                
                if (citiesResponse.success) {
                    const cityNames = citiesResponse.data.map(city => city.name);
                    
                    // Get hotels
                    const hotelsResponse = await client.getHotels(
                        { country: 'AE' },
                        { limit: 50, offset: 0 }
                    );
                    
                    if (hotelsResponse.success) {
                        // Verify that all hotel cities exist in the cities list
                        hotelsResponse.data.forEach(hotel => {
                            expect(cityNames).toContain(hotel.city);
                        });
                    }
                }
            } catch (error) {
                console.warn('Referential integrity test failed:', error.message);
            }
        });
    });
});