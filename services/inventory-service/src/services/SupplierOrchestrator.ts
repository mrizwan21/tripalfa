import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
// import { Intent } from '../../../packages/shared-types/src/index';
const Intent = {
    READ_STATIC: "READ_STATIC",
    QUERY_STATIC: "QUERY_STATIC",
    WRITE: "WRITE",
    READ_REALTIME: "READ_REALTIME",
    QUERY_REALTIME: "QUERY_REALTIME",
    ADAPTER: "ADAPTER"
} as any;
import { dynamicPrisma, staticPrisma, staticPool } from '../db.js';
import { getHotelSearchService } from './index.js';

const GATEWAY_URL = process.env.API_GATEWAY_URL || 'http://localhost:3001/api';

interface SearchFlightsParams {
    origin: string;
    destination: string;
    departureDate: string;
    returnDate?: string;
    passengers?: any[];
    cabinClass?: string;
}

interface SearchHotelsParams {
    location: string;
    checkin: string;
    checkout: string;
    adults: number;
    children: number;
}

interface PricingContext {
    tenantId?: string;
    companyId?: string;
    branchId?: string;
    currency?: string;
}

class SupplierOrchestrator {
    async searchLocalFlights(params: SearchFlightsParams) {
        try {
            const { origin, destination, departureDate } = params;

            // Basic lookup in static DB (using raw query or Prisma if models exist)
            // Since we are using staticPrisma via db.ts, we can query FlightRoute
            // But FlightRoute is in 'schema.prisma' which is used by dynamicPrisma usually?
            // Actually schema.prisma is one file, usually shared.
            // Let's assume staticPrisma has access to 'flight_routes' table in static db.

            // Note: The schema for static data might vary. 
            // Here we just return a simplified mock or query if possible.
            // For now, returning empty to satisfy interface, logic can be expanded.

            /* 
            const routes = await staticPrisma.flightRoute.findMany({
                 where: { 
                     originAirport: { iataCode: origin },
                     destinationAirport: { iataCode: destination }
                 },
                 include: { airline: true }
            });
            */

            return []; // Placeholder implementation
        } catch (e) {
            console.error('Local Flight Search Failed:', e);
            return [];
        }
    }

    async searchFlights(params: SearchFlightsParams, context: PricingContext = {}) {
        const activeSuppliers = await dynamicPrisma.supplier.findMany({
            where: { isActive: true, category: 'flights' },
            include: { vendor: true }
        });

        const tasks = activeSuppliers.map(async (supplier) => {
            if (supplier.vendor) {
                try {
                    const response = await axios.post(`${GATEWAY_URL}/route`, {
                        intent: Intent.READ_REALTIME,
                        body: {
                            provider: supplier.vendor.code.toLowerCase(),
                            origin: params.origin,
                            destination: params.destination,
                            departureDate: params.departureDate, // Consistent naming
                            returnDate: params.returnDate,
                            passengers: params.passengers || [{ type: 'adult' }],
                            cabinClass: params.cabinClass || 'economy',
                            // Add slices if it's Duffel
                            slices: [
                                {
                                    origin: params.origin,
                                    destination: params.destination,
                                    departure_date: params.departureDate
                                }
                            ]
                        },
                        meta: {
                            adapter: supplier.vendor.code.toLowerCase()
                        }
                    });
                    return response.data;
                } catch (e) {
                    console.error(`Gateway error for ${supplier.vendor.code}:`, e);
                    return [];
                }
            }

            if (supplier.category === 'LOCAL') {
                return this.searchLocalFlights(params);
            }
            return [];
        });

        const results = await Promise.all(tasks);
        return this.applyPricingRules(results.flat(), 'FLIGHT', context);
    }

    async searchHotels(params: SearchHotelsParams, context: PricingContext = {}) {
        const activeSuppliers = await dynamicPrisma.supplier.findMany({
            where: { isActive: true, category: 'hotels' },
            include: { vendor: true }
        });

        // Start vendor tasks
        const tasks = activeSuppliers
            .filter(supplier => supplier.vendor)
            .map(async (supplier) => {
                try {
                    const response = await axios.post(`${GATEWAY_URL}/route`, {
                        intent: Intent.READ_REALTIME,
                        body: {
                            provider: supplier.vendor!.code.toLowerCase(),
                            location: params.location,
                            checkin: params.checkin,
                            checkout: params.checkout,
                            adults: params.adults,
                            children: params.children
                        },
                        meta: {
                            adapter: supplier.vendor!.code.toLowerCase()
                        }
                    });
                    return response.data;
                } catch (e) {
                    console.error(`Gateway error for ${supplier.vendor!.code}:`, e);
                    return [];
                }
            });

        // Always include local search task
        tasks.push(this.searchLocalHotels(params));

        const results = await Promise.all(tasks);
        return this.applyPricingRules(results.flat(), 'HOTEL', context);
    }

    async searchLocalHotels(params: SearchHotelsParams) {
        try {
            const hotelService = getHotelSearchService();
            const searchResult = await hotelService.searchHotels({
                query: params.location,
                checkIn: new Date(params.checkin),
                checkOut: new Date(params.checkout),
                occupancy: params.adults + params.children
            }, 1, 50);

            return searchResult.hotels.map(h => ({
                id: `local_h_${h.id}`,
                name: h.name,
                image: h.primaryImage || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
                location: `${h.location.city}, ${h.location.countryCode}`,
                rating: h.starRating ? Number(h.starRating) : 4,
                reviews: h.reviewScore ? h.reviewScore * 20 : 0,
                reviewCount: h.reviewCount || 0,
                pricePerNight: h.minPrice || 200,
                currency: 'USD',
                amenities: [
                    h.facilities.hasWifi ? 'WiFi' : null,
                    h.facilities.hasPool ? 'Pool' : null,
                    h.facilities.hasSpa ? 'Spa' : null,
                    h.facilities.hasGym ? 'Gym' : null,
                    h.facilities.hasParking ? 'Parking' : null,
                    h.facilities.hasRestaurant ? 'Restaurant' : null
                ].filter(Boolean),
                provider: 'Local'
            }));
        } catch (e) {
            console.error('Local Hotel Search Failed:', e);
            return [];
        }
    }

    async applyPricingRules(results: any[], serviceType: 'FLIGHT' | 'HOTEL', context: PricingContext) {
        try {
            const { tenantId, companyId, branchId } = context;

            // Fetch applicable rules ordered by priority
            // We look for Global rules OR specific target matches
            const rules = await dynamicPrisma.pricingRule.findMany({
                where: {
                    status: 'ACTIVE',
                    serviceType: { in: [serviceType, 'ALL'] },
                    OR: [
                        { targetType: 'GLOBAL' },
                        tenantId ? { targetType: 'TENANT', targetId: tenantId } : undefined,
                        companyId ? { targetType: 'COMPANY', targetId: companyId } : undefined,
                        branchId ? { targetType: 'BRANCH', targetId: branchId } : undefined,
                    ].filter(Boolean) as any
                },
                orderBy: { priority: 'desc' }
            });

            if (rules.length === 0) return results;

            return results.map(item => {
                let finalAmount = item.amount || item.pricePerNight;

                // Apply rules in order of priority (or just the highest priority one if preferred)
                // For now, we apply the highest priority applicable rule
                const rule = rules[0];

                if (rule.markupType === 'PERCENTAGE') {
                    // markupValue is Decimal, need to convert
                    finalAmount = finalAmount * (1 + parseFloat(rule.markupValue.toString()) / 100);
                } else if (rule.markupType === 'FIXED') {
                    finalAmount = finalAmount + parseFloat(rule.markupValue.toString());
                }

                return {
                    ...item,
                    originalAmount: item.amount || item.pricePerNight,
                    amount: serviceType === 'FLIGHT' ? parseFloat(finalAmount.toFixed(2)) : undefined,
                    pricePerNight: serviceType === 'HOTEL' ? parseFloat(finalAmount.toFixed(2)) : undefined,
                    markupApplied: rule.name
                };
            });
        } catch (e) {
            console.error('Markup Application Failed:', e);
            return results;
        }
    }
}

export default new SupplierOrchestrator();
