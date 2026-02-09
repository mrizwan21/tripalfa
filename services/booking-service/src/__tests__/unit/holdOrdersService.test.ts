import holdOrdersService from '../../services/holdOrdersService';
import axios from 'axios';
import { jest } from '@jest/globals';

jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('HoldOrdersService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('checkHoldEligibility', () => {
        it('should return eligible for hotel type', async () => {
            const eligibility = await holdOrdersService.checkHoldEligibility('hotel-offer-123', 'hotel');
            expect(eligibility.eligible).toBe(true);
            expect(eligibility.paymentRequiredBy).toBeDefined();
        });

        it('should check Duffel for flight type', async () => {
            const mockOffer = {
                data: {
                    data: {
                        payment_requirements: {
                            requires_instant_payment: false,
                            price_guarantee_expires_at: '2026-02-10T10:00:00Z',
                            payment_required_by: '2026-02-10T08:00:00Z'
                        }
                    }
                }
            };
            // Mocking the instance call
            (holdOrdersService as any).duffelClient = {
                get: jest.fn().mockResolvedValue(mockOffer)
            };

            const eligibility = await holdOrdersService.checkHoldEligibility('offer_123', 'flight');
            expect(eligibility.eligible).toBe(true);
            expect(eligibility.requiresInstantPayment).toBe(false);
        });
    });

    describe('createHoldOrder', () => {
        it('should create a virtual hold for hotel', async () => {
            const data = {
                offerId: 'hotel-rate-456',
                passengers: [],
                customerId: 'cust_1',
                customerEmail: 'test@example.com',
                customerPhone: '123456',
                type: 'hotel' as const
            };

            const order = await holdOrdersService.createHoldOrder(data);
            expect(order.orderId).toContain('HL-');
            expect(order.reference).toContain('TRIP-HOTEL-');
            expect(order.status).toBe('active');
        });

        it('should enforce refundable check for flights', async () => {
            const data = {
                offerId: 'flight-offer-not-refundable',
                passengers: [],
                customerId: 'cust_1',
                customerEmail: 'test@example.com',
                customerPhone: '123456',
                type: 'flight' as const
            };

            // Mock eligibility
            jest.spyOn(holdOrdersService, 'checkHoldEligibility').mockResolvedValue({
                eligible: true,
                requiresInstantPayment: false,
                priceGuaranteeExpiresAt: null,
                paymentRequiredBy: null
            });

            // Mock Duffel Response - NON REFUNDABLE
            const mockDuffelOrder = {
                data: {
                    data: {
                        id: 'ord_123',
                        total_amount: '500',
                        total_currency: 'USD',
                        conditions: {
                            refund_before_departure: { allowed: false }
                        }
                    }
                }
            };

            (holdOrdersService as any).duffelClient = {
                post: jest.fn().mockResolvedValue(mockDuffelOrder)
            };

            await expect(holdOrdersService.createHoldOrder(data)).rejects.toThrow('This flight fare is non-refundable and cannot be held.');
        });
    });
});
