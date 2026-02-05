import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import axios from 'axios';
import { Intent } from '@tripalfa/shared-types';
import { dynamicPrisma, staticPrisma, staticPool } from '../db.js';

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
            const { location } = params;
            // Use staticPool to query canonical_hotels and its normalized relations
            const query = `
                SELECT 
                    h.id, h.name, h.address, h.city, h.country, h.star_rating, h.latitude, h.longitude,
                    img.url as primary_image,
                    COALESCE(am.names, ARRAY[]::text[]) as amenity_names
                FROM canonical_hotels h
                LEFT JOIN LATERAL (
                    SELECT url FROM hotel_images 
                    WHERE canonical_hotel_id = h.id 
                    ORDER BY is_primary DESC, sort_order ASC 
                    LIMIT 1
                ) img ON true
                LEFT JOIN LATERAL (
                    SELECT array_agg(a.name) as names
                    FROM (
                        SELECT a.name
                        FROM hotel_amenity_instances hai
                        JOIN amenities a ON a.id = hai.amenity_id
                        WHERE hai.canonical_hotel_id = h.id
                        LIMIT 10
                    ) a
                ) am ON true
                WHERE h.archive = false
                AND (h.city ILIKE $1 OR h.name ILIKE $1)
                LIMIT 50
            `;

            const searchPattern = `%${location}%`;
            const result = await staticPool.query(query, [searchPattern]);

            return result.rows.map((h: any) => {
                return {
                    id: `local_h_${h.id}`,
                    name: h.name,
                    image: h.primary_image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&q=80',
                    location: `${h.address || ''}, ${h.city}`,
                    rating: h.star_rating ? parseFloat(h.star_rating) : 4,
                    reviews: 100,
                    reviewCount: 100,
                    pricePerNight: 200,
                    currency: 'USD',
                    amenities: h.amenity_names,
                    provider: 'Local'
                };
            });
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
