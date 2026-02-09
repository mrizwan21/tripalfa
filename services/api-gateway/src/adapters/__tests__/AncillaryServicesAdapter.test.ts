/**
 * Unit Tests: AncillaryServicesAdapter
 * Tests the adapter's methods in isolation with mocked API responses
 * Run: npm test -- AncillaryServicesAdapter.test.ts
 */

import AncillaryServicesAdapter from '../AncillaryServicesAdapter.js';

// Mock axios
jest.mock('axios');
import axios from 'axios';

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('AncillaryServicesAdapter', () => {
    let adapter: AncillaryServicesAdapter;

    beforeEach(() => {
        adapter = new AncillaryServicesAdapter();
        jest.clearAllMocks();
    });

    // ============================================================================
    // GET SEAT MAPS TESTS
    // ============================================================================

    describe('getSeatMaps', () => {
        it('should return seat maps for a valid offer', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            cabins: [
                                {
                                    rows: [
                                        {
                                            sections: [
                                                {
                                                    elements: [
                                                        {
                                                            designator: '12A',
                                                            type: 'seat',
                                                            availability: 'available'
                                                        }
                                                    ]
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await adapter.getSeatMaps({
                offerId: 'offer_123',
                env: 'test'
            });

            expect(result).toBeDefined();
            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.stringContaining('seat_maps'),
                expect.objectContaining({
                    params: { offer_id: 'offer_123' }
                })
            );
        });

        it('should throw error for missing API key', async () => {
            // Temporarily set API key to invalid value
            process.env.DUFFEL_TEST_API_KEY = 'your-duffel-test';

            await expect(
                adapter.getSeatMaps({
                    offerId: 'offer_123',
                    env: 'test'
                })
            ).rejects.toThrow('API key not configured');
        });

        it('should use production API key when env is prod', async () => {
            process.env.DUFFEL_PROD_API_KEY = 'prod_key_123';
            mockedAxios.get.mockResolvedValue({ data: { data: [] } });

            await adapter.getSeatMaps({
                offerId: 'offer_123',
                env: 'prod'
            });

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    headers: expect.objectContaining({
                        'Authorization': 'Bearer prod_key_123'
                    })
                })
            );
        });

        it('should handle API errors gracefully', async () => {
            mockedAxios.get.mockRejectedValue({
                response: {
                    data: {
                        errors: [{ message: 'Offer not found' }]
                    }
                }
            });

            await expect(
                adapter.getSeatMaps({
                    offerId: 'invalid_offer',
                    env: 'test'
                })
            ).rejects.toThrow('Failed to get seat maps');
        });
    });

    // ============================================================================
    // GET ANCILLARY OFFERS TESTS
    // ============================================================================

    describe('getAncillaryOffers', () => {
        it('should return all ancillary offers for an order', async () => {
            const mockResponse = {
                data: {
                    data: [
                        {
                            id: 'service_seat_12A',
                            type: 'seat',
                            description: 'Seat 12A'
                        },
                        {
                            id: 'service_baggage_extra',
                            type: 'baggage',
                            description: 'Extra baggage'
                        }
                    ]
                }
            };

            mockedAxios.get.mockResolvedValue(mockResponse);

            const result = await adapter.getAncillaryOffers({
                orderId: 'ord_123',
                env: 'test'
            });

            expect(result).toBeDefined();
            expect(result.data).toHaveLength(2);
        });

        it('should filter by service type', async () => {
            mockedAxios.get.mockResolvedValue({
                data: {
                    data: [
                        {
                            id: 'service_seat_12A',
                            type: 'seat'
                        }
                    ]
                }
            });

            await adapter.getAncillaryOffers({
                orderId: 'ord_123',
                type: 'seat',
                env: 'test'
            });

            expect(mockedAxios.get).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    params: expect.objectContaining({
                        type: 'seat'
                    })
                })
            );
        });

        it('should handle empty results', async () => {
            mockedAxios.get.mockResolvedValue({
                data: {
                    data: []
                }
            });

            const result = await adapter.getAncillaryOffers({
                orderId: 'ord_123',
                env: 'test'
            });

            expect(result.data).toEqual([]);
        });
    });

    // ============================================================================
    // SELECT ANCILLARY SERVICE TESTS
    // ============================================================================

    describe('selectAncillaryService', () => {
        it('should successfully select an ancillary service', async () => {
            const mockResponse = {
                data: {
                    data: {
                        id: 'service_seat_12A',
                        status: 'selected'
                    }
                }
            };

            mockedAxios.post.mockResolvedValue(mockResponse);

            const result = await adapter.selectAncillaryService({
                orderId: 'ord_123',
                serviceId: 'service_seat_12A',
                passengerId: 'pax_456',
                env: 'test'
            });

            expect(result.data.status).toBe('selected');
            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: expect.objectContaining({
                        service_id: 'service_seat_12A',
                        passenger_id: 'pax_456'
                    })
                })
            );
        });

        it('should include quantity when provided', async () => {
            mockedAxios.post.mockResolvedValue({
                data: { data: { status: 'selected' } }
            });

            await adapter.selectAncillaryService({
                orderId: 'ord_123',
                serviceId: 'service_baggage',
                quantity: 2,
                env: 'test'
            });

            expect(mockedAxios.post).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    data: expect.objectContaining({
                        quantity: 2
                    })
                })
            );
        });

        it('should handle selection conflicts', async () => {
            mockedAxios.post.mockRejectedValue({
                response: {
                    status: 409,
                    data: {
                        errors: [{ message: 'Seat already taken' }]
                    }
                }
            });

            await expect(
                adapter.selectAncillaryService({
                    orderId: 'ord_123',
                    serviceId: 'service_seat_12A',
                    env: 'test'
                })
            ).rejects.toThrow('Failed to select ancillary service');
        });
    });

    // ============================================================================
    // REMOVE ANCILLARY SERVICE TESTS
    // ============================================================================

    describe('removeAncillaryService', () => {
        it('should successfully remove an ancillary service', async () => {
            const mockResponse = {
                data: {
                    data: {
                        id: 'service_seat_12A',
                        status: 'removed'
                    }
                }
            };

            mockedAxios.delete.mockResolvedValue(mockResponse);

            const result = await adapter.removeAncillaryService(
                'ord_123',
                'service_seat_12A',
                'test'
            );

            expect(result.data.status).toBe('removed');
            expect(mockedAxios.delete).toHaveBeenCalled();
        });

        it('should handle service not found', async () => {
            mockedAxios.delete.mockRejectedValue({
                response: {
                    status: 404,
                    data: {
                        errors: [{ message: 'Service not found' }]
                    }
                }
            });

            await expect(
                adapter.removeAncillaryService(
                    'ord_123',
                    'invalid_service',
                    'test'
                )
            ).rejects.toThrow('Failed to remove ancillary service');
        });
    });

    // ============================================================================
    // GENERIC REQUEST METHOD TESTS
    // ============================================================================

    describe('request', () => {
        it('should route to getSeatMaps for get_seat_maps action', async () => {
            mockedAxios.get.mockResolvedValue({
                data: { data: [] }
            });

            const result = await adapter.request({
                action: 'get_seat_maps',
                offerId: 'offer_123',
                env: 'test'
            });

            expect(result).toBeDefined();
        });

        it('should route to getAncillaryOffers for get_ancillary_offers action', async () => {
            mockedAxios.get.mockResolvedValue({
                data: { data: [] }
            });

            const result = await adapter.request({
                action: 'get_ancillary_offers',
                orderId: 'ord_123',
                env: 'test'
            });

            expect(result).toBeDefined();
        });

        it('should route to selectAncillaryService for select_ancillary action', async () => {
            mockedAxios.post.mockResolvedValue({
                data: { data: { status: 'selected' } }
            });

            const result = await adapter.request({
                action: 'select_ancillary',
                orderId: 'ord_123',
                serviceId: 'service_123',
                env: 'test'
            });

            expect(result).toBeDefined();
        });

        it('should route to removeAncillaryService for remove_ancillary action', async () => {
            mockedAxios.delete.mockResolvedValue({
                data: { data: { status: 'removed' } }
            });

            const result = await adapter.request({
                action: 'remove_ancillary',
                orderId: 'ord_123',
                serviceId: 'service_123',
                env: 'test'
            });

            expect(result).toBeDefined();
        });

        it('should throw error for unknown action', async () => {
            await expect(
                adapter.request({
                    action: 'unknown_action',
                    env: 'test'
                })
            ).rejects.toThrow('Unknown ancillary service action');
        });
    });

    // ============================================================================
    // ERROR HANDLING TESTS
    // ============================================================================

    describe('Error Handling', () => {
        it('should provide helpful error messages', async () => {
            mockedAxios.get.mockRejectedValue({
                response: {
                    data: {
                        errors: [
                            {
                                message: 'Invalid offer ID format'
                            }
                        ]
                    }
                }
            });

            try {
                await adapter.getSeatMaps({
                    offerId: 'invalid',
                    env: 'test'
                });
            } catch (error: any) {
                expect(error.message).toContain('Invalid offer ID format');
            }
        });

        it('should handle network errors', async () => {
            mockedAxios.get.mockRejectedValue(
                new Error('Network timeout')
            );

            await expect(
                adapter.getSeatMaps({
                    offerId: 'offer_123',
                    env: 'test'
                })
            ).rejects.toThrow('Failed to get seat maps');
        });
    });
});
