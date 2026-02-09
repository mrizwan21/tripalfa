import axios from 'axios';

interface SeatMapRequest {
    offerId: string;
    env?: 'test' | 'prod';
}

interface AncillaryOfferRequest {
    orderId: string;
    type?: 'seat' | 'baggage' | 'insurance' | 'lounge';
    env?: 'test' | 'prod';
}

interface SelectAncillaryRequest {
    orderId: string;
    serviceId: string;
    quantity?: number;
    passengerId?: string;
    env?: 'test' | 'prod';
}

export default class AncillaryServicesAdapter {
    name = 'ancillary_services';
    private testKey = process.env.DUFFEL_TEST_API_KEY;
    private prodKey = process.env.DUFFEL_PROD_API_KEY;
    /**
     * Kong/Wicked API Manager proxy URL
     * Routes all Duffel ancillary service calls through centralized API management
     * Falls back to direct Duffel API if Kong is not available
     */
    private baseUrl = process.env.KONG_PROXY_URL || process.env.DUFFEL_API_BASE_URL || 'https://api.duffel.com/air';

    /**
     * Get seat maps for a specific offer
     * Returns available seats and seat configurations
     */
    async getSeatMaps(payload: SeatMapRequest): Promise<any> {
        const env = payload.env || 'test';
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured for seat maps`);
        }

        try {
            const response = await axios.get(
                `${this.baseUrl}/seat_maps`,
                {
                    params: {
                        offer_id: payload.offerId
                    },
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Seat Maps Retrieved:', JSON.stringify(response.data, null, 2));
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Seat Maps Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to get seat maps: ${
                    error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Get available ancillary services for an order
     * Returns available seat selections, baggage options, insurance, lounges, etc.
     */
    async getAncillaryOffers(payload: AncillaryOfferRequest): Promise<any> {
        const env = payload.env || 'test';
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured for ancillary offers`);
        }

        try {
            const params: any = {
                order_id: payload.orderId
            };

            if (payload.type) {
                params.type = payload.type;
            }

            const response = await axios.get(
                `${this.baseUrl}/orders/${payload.orderId}/available_services`,
                {
                    params,
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Ancillary Offers Retrieved:', JSON.stringify(response.data, null, 2));
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Ancillary Offers Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to get ancillary offers: ${
                    error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Select and add an ancillary service to an order
     * Can be used for seat selection, baggage, insurance, lounge access, etc.
     */
    async selectAncillaryService(payload: SelectAncillaryRequest): Promise<any> {
        const env = payload.env || 'test';
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured for selecting ancillary services`);
        }

        try {
            const requestData: any = {
                data: {
                    service_id: payload.serviceId
                }
            };

            if (payload.quantity) {
                requestData.data.quantity = payload.quantity;
            }

            if (payload.passengerId) {
                requestData.data.passenger_id = payload.passengerId;
            }

            const response = await axios.post(
                `${this.baseUrl}/orders/${payload.orderId}/services`,
                requestData,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Ancillary Service Selected:', JSON.stringify(response.data, null, 2));
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Select Ancillary Service Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to select ancillary service: ${
                    error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Remove an ancillary service from an order
     * Used to deselect seats, baggage, or other services
     */
    async removeAncillaryService(orderId: string, serviceId: string, env: string = 'test'): Promise<any> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            throw new Error(`Duffel ${env} API key not configured for removing ancillary services`);
        }

        try {
            const response = await axios.delete(
                `${this.baseUrl}/orders/${orderId}/services/${serviceId}`,
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                        'Content-Type': 'application/json',
                    },
                }
            );

            console.log('Ancillary Service Removed:', JSON.stringify(response.data, null, 2));
            return response.data.data || response.data;
        } catch (error: any) {
            console.error('Remove Ancillary Service Error:', error.response?.data || error.message);
            throw new Error(
                `Failed to remove ancillary service: ${
                    error.response?.data?.errors?.[0]?.message || error.message
                }`
            );
        }
    }

    /**
     * Generic request method for compatibility with adapter interface
     */
    async request(payload: any): Promise<any> {
        const action = payload.action || 'get_seat_maps';

        switch (action) {
            case 'get_seat_maps':
                return this.getSeatMaps(payload);
            case 'get_ancillary_offers':
                return this.getAncillaryOffers(payload);
            case 'select_ancillary':
                return this.selectAncillaryService(payload);
            case 'remove_ancillary':
                return this.removeAncillaryService(payload.orderId, payload.serviceId, payload.env);
            default:
                throw new Error(`Unknown ancillary service action: ${action}`);
        }
    }
}
