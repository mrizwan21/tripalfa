import axios from 'axios';
import { Adapter, FlightResult } from '@tripalfa/shared-types';

interface DuffelResponse {
    data: {
        offers: any[];
        [key: string]: any;
    };
}

interface DuffelOrder {
    id: string;
    type: 'order';
    created_at: string;
    updated_at: string;
    bookings: any[];
    owner: {
        name: string;
        iata_code: string;
    };
    total_amount: string;
    total_currency: string;
    services: any[];
}

interface CreateOrderRequest {
    selected_offers: string[];
    passengers: Array<{
        id: string;
        email: string;
        type: 'adult' | 'child' | 'infant';
        given_name: string;
        family_name: string;
        born_at?: string;
        gender?: 'M' | 'F';
        phone_number: string;
    }>;
    type: 'instant' | 'hold';
    payment_method?: {
        type: 'balance' | 'card';
        id?: string;
    };
}

interface PaymentIntentRequest {
    order_id: string;
    amount: string;
    currency: string;
    return_url: string;
}

export default class DuffelAdapter implements Adapter {
    name = 'duffel';
    private testKey = process.env.DUFFEL_TEST_API_KEY;
    private prodKey = process.env.DUFFEL_PROD_API_KEY;
    /**
     * Kong/Wicked API Manager proxy URL
     * Routes all Duffel API calls through centralized API management
     * Falls back to direct Duffel API if Kong is not available
     */
    private baseUrl = process.env.KONG_PROXY_URL || process.env.DUFFEL_API_BASE_URL || 'https://api.duffel.com/air';

    async request(payload: any): Promise<FlightResult[]> {
        const env = payload.env || 'test';
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        const data = payload.data || payload;
        const requestPayload = {
            data: {
                slices: data.slices,
                passengers: data.passengers,
                cabin_class: data.cabinClass || data.cabin_class || 'economy',
                return_available_services: true
            },
        };
        console.log('[DuffelAdapter] Duffel Request Payload:', JSON.stringify(requestPayload, null, 2));

        try {
            const response = await axios.post<DuffelResponse>(
                `${this.baseUrl}/offer_requests`,
                requestPayload,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('[DuffelAdapter] Duffel Response Data:', JSON.stringify(response.data, null, 2));
            return this.mapResponse(response.data.data);
        } catch (error: any) {
            console.error('[DuffelAdapter] Duffel Request Error:', {
                status: error?.response?.status,
                statusText: error?.response?.statusText,
                data: error?.response?.data,
                message: error?.message
            });
            throw error;
        }
    }

    private mapResponse(data: any): FlightResult[] {
        if (!data || !data.offers) return [];

        return data.offers.map((offer: any) => {
            const slice = offer.slices[0];
            const firstSegment = slice.segments[0];
            const lastSegment = slice.segments[slice.segments.length - 1];

            // Map all segments for itinerary display
            const segments = slice.segments.map((seg: any, idx: number) => {
                const nextSeg = slice.segments[idx + 1];
                return {
                    id: seg.id,
                    origin: seg.origin.iata_code,
                    originCity: seg.origin.city_name || seg.origin.name || seg.origin.iata_code,
                    destination: seg.destination.iata_code,
                    destinationCity: seg.destination.city_name || seg.destination.name || seg.destination.iata_code,
                    departureTime: seg.departing_at,
                    arrivalTime: seg.arriving_at,
                    flightNumber: `${seg.marketing_carrier?.iata_code || ''}${seg.marketing_carrier_flight_number || ''}`,
                    carrierCode: seg.marketing_carrier?.iata_code || offer.owner.iata_code,
                    airline: seg.marketing_carrier?.name || offer.owner.name,
                    duration: this.formatDuration(seg.duration),
                    layoverDuration: nextSeg ? this.calculateLayover(seg.arriving_at, nextSeg.departing_at) : null,
                    departureTerminal: seg.origin_terminal,
                    arrivalTerminal: seg.destination_terminal,
                    aircraft: seg.aircraft?.name || seg.aircraft?.iata_code || 'Aircraft Info Unavailable'
                };
            });

            // Map baggage info
            const includedBags = offer.passengers?.[0]?.baggages?.map((b: any) => ({
                quantity: b.quantity || 1,
                weight: b.type === 'checked' ? 23 : 7,
                unit: 'kg',
                type: b.type
            })) || [{ quantity: 1, weight: 23, unit: 'kg', type: 'checked' }];

            return {
                id: offer.id,
                airline: offer.owner.name,
                carrierCode: offer.owner.iata_code,
                flightNumber: `${offer.owner.iata_code}${firstSegment.marketing_carrier_flight_number || ''}`,
                origin: firstSegment.origin.iata_code,
                originCity: firstSegment.origin.city_name || firstSegment.origin.name || firstSegment.origin.iata_code,
                destination: lastSegment.destination.iata_code,
                destinationCity: lastSegment.destination.city_name || lastSegment.destination.name || lastSegment.destination.iata_code,
                departureTime: firstSegment.departing_at,
                arrivalTime: lastSegment.arriving_at,
                duration: this.formatDuration(slice.duration),
                amount: parseFloat(offer.total_amount),
                currency: offer.total_currency,
                stops: slice.segments.length - 1,
                isLCC: false,
                refundable: offer.conditions?.refund_before_departure?.allowed || false,
                cabin: slice.fare_brand_name || offer.passengers?.[0]?.cabin_class_marketing_name || 'Economy',
                segments,
                includedBags,
                airlineLogo: offer.owner.logo_symbol_url || offer.owner.logo_lockup_url || `https://logo.clearbit.com/${offer.owner.name.toLowerCase().replace(/\s+/g, '')}.com`
            };
        });
    }

    private calculateLayover(arrival: string, departure: string): string {
        const arr = new Date(arrival);
        const dep = new Date(departure);
        const diffMs = dep.getTime() - arr.getTime();
        if (diffMs <= 0) return '0h 0m';
        const diffHrs = Math.floor(diffMs / 3600000);
        const diffMins = Math.floor((diffMs % 3600000) / 60000);
        return `${diffHrs}h ${diffMins}m`;
    }

    private formatDuration(isoDuration: string): string {
        const hours = isoDuration.match(/(\d+)H/)?.[1] || '0';
        const minutes = isoDuration.match(/(\d+)M/)?.[1] || '0';
        return `${hours}h ${minutes}m`;
    }

    private getHeaders(env: string = 'test'): Record<string, string> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;
        return {
            'Authorization': `Bearer ${apiKey}`,
            'Duffel-Version': 'v2',
            'Content-Type': 'application/json',
        };
    }

    async health(): Promise<boolean> {
        return !!(this.testKey || this.prodKey);
    }

    /**
     * Create an order for selected flights
     * Supports both instant and hold order types
     */
    async createOrder(payload: any): Promise<DuffelOrder> {
        const env = payload.env || 'test';
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        const orderData: CreateOrderRequest = {
            selected_offers: payload.selectedOffers,
            passengers: payload.passengers,
            type: payload.orderType || 'instant',
            payment_method: payload.paymentMethod,
        };

        console.log('Creating Duffel Order:', JSON.stringify(orderData, null, 2));

        try {
            const response = await axios.post<{ data: DuffelOrder }>(
                `${this.baseUrl}/orders`,
                { data: orderData },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Duffel Order Created:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } catch (error: any) {
            console.error('Duffel Order Creation Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to create order: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get order details by order ID
     */
    async getOrder(orderId: string, env: string = 'test'): Promise<DuffelOrder> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.get<{ data: DuffelOrder }>(
                `${this.baseUrl}/orders/${orderId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                    },
                }
            );

            console.log('Duffel Order Retrieved:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } catch (error: any) {
            console.error('Duffel Get Order Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to get order: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Confirm a held order (convert hold to instant)
     */
    async confirmOrder(orderId: string, env: string = 'test'): Promise<DuffelOrder> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.post<{ data: DuffelOrder }>(
                `${this.baseUrl}/orders/${orderId}/confirm`,
                {},
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Duffel Order Confirmed:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } catch (error: any) {
            console.error('Duffel Confirm Order Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to confirm order: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Create a payment intent for an order
     */
    async createPaymentIntent(payload: any): Promise<any> {
        const env = payload.env || 'test';
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        const paymentData: PaymentIntentRequest = {
            order_id: payload.orderId,
            amount: payload.amount,
            currency: payload.currency,
            return_url: payload.returnUrl,
        };

        console.log('Creating Payment Intent:', JSON.stringify(paymentData, null, 2));

        try {
            const response = await axios.post(
                `${this.baseUrl}/payment_intents`,
                { data: paymentData },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Payment Intent Created:', JSON.stringify(response.data, null, 2));
            return response.data.data;
        } catch (error: any) {
            console.error('Payment Intent Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to create payment intent: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Update an order (add services, etc.)
     */
    async updateOrder(orderId: string, payload: any, env: string = 'test'): Promise<DuffelOrder> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.patch<{ data: DuffelOrder }>(
                `${this.baseUrl}/orders/${orderId}`,
                { data: payload },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Duffel Order Updated:', JSON.stringify(response.data.data, null, 2));
            return response.data.data;
        } catch (error: any) {
            console.error('Duffel Update Order Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to update order: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get available payment methods
     */
    async getPaymentMethods(env: string = 'test'): Promise<any> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/payment_methods`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                    },
                }
            );

            console.log('Payment Methods Retrieved:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Payment Methods Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to get payment methods: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get available payment methods for specific order
     */
    async getOrderPaymentMethods(orderId: string, env: string = 'test'): Promise<any> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/orders/${orderId}/available_payment_methods`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                    },
                }
            );

            console.log('Order Payment Methods Retrieved:', response.data);
            return response.data;
        } catch (error: any) {
            console.error('Order Payment Methods Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to get payment methods for order: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Confirm a payment to complete the booking
     */
    async confirmPayment(payload: any, env: string = 'test'): Promise<any> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.post(
                `${this.baseUrl}/payment_confirmations`,
                { data: payload },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Payment Confirmed:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error: any) {
            console.error('Payment Confirmation Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to confirm payment: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get payment details
     */
    async getPayment(paymentId: string, env: string = 'test'): Promise<any> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured`);
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/payments/${paymentId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                    },
                }
            );

            console.log('Payment Retrieved:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error: any) {
            console.error('Get Payment Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to get payment: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get seat maps for an offer
     * Returns available seats for all segments
     */
    async getSeatMaps(offerId: string, env: string = 'test'): Promise<any> {
        try {
            console.log(`[DuffelAdapter] Fetching seat maps for offer: ${offerId}`);

            const response = await axios.get(`${this.baseUrl}/seat_maps`, {
                headers: this.getHeaders(env),
                params: {
                    offer_id: offerId
                }
            });

            console.log(`[DuffelAdapter] Seat maps retrieved for offer ${offerId}`);
            return response.data;
        } catch (error: any) {
            console.error(`[DuffelAdapter] Error fetching seat maps: ${error.message}`);
            throw new Error(
                `Failed to get seat maps: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get seat map for a specific segment
     * Filters seat maps by segment ID
     */
    async getSeatMapForSegment(offerId: string, segmentId: string, env: string = 'test'): Promise<any> {
        try {
            console.log(`[DuffelAdapter] Fetching seat map for segment: ${segmentId}`);

            const seatMaps = await this.getSeatMaps(offerId, env);
            const segmentMap = seatMaps.data?.find((map: any) => map.segment_id === segmentId);

            if (!segmentMap) {
                console.log(`[DuffelAdapter] No seat map available for segment: ${segmentId}`);
                return null;
            }

            console.log(`[DuffelAdapter] Seat map retrieved for segment ${segmentId}`);
            return { data: [segmentMap] };
        } catch (error: any) {
            console.error(`[DuffelAdapter] Error fetching seat map for segment: ${error.message}`);
            throw new Error(
                `Failed to get seat map for segment: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Select seats for passengers (passed to order creation)
     * Prepares seat selection data for order
     */
    async selectSeats(offerId: string, selectedSeats: any[], env: string = 'test'): Promise<any> {
        try {
            console.log(`[DuffelAdapter] Selecting seats for offer: ${offerId}`, selectedSeats);

            // Seat selection is handled during order creation
            // This method validates the seats before passing to createOrder
            const seatMaps = await this.getSeatMaps(offerId, env);

            const validSeats = selectedSeats.map((seat: any) => {
                // Find the seat in the seat maps to validate availability
                let seatFound = false;
                for (const map of seatMaps.data) {
                    for (const cabin of map.cabins) {
                        for (const row of cabin.rows) {
                            for (const section of row.sections) {
                                const element = section.elements.find(
                                    (el: any) => el.designator === seat.designator && el.type === 'seat'
                                );
                                if (element) {
                                    seatFound = true;
                                    break;
                                }
                            }
                        }
                    }
                }
                if (!seatFound) {
                    throw new Error(`Seat ${seat.designator} not found or unavailable`);
                }
                return {
                    service_id: seat.serviceId,
                    passenger_id: seat.passengerId
                };
            });

            console.log(`[DuffelAdapter] Seats validated successfully`);
            return { data: validSeats };
        } catch (error: any) {
            console.error(`[DuffelAdapter] Error selecting seats: ${error.message}`);
            throw new Error(
                `Failed to select seats: ${error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }
}
