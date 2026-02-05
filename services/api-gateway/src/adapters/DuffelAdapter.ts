import axios from 'axios';
import { Adapter, FlightResult } from '../../../../packages/shared-types/src/index.js';

interface DuffelResponse {
    data: {
        offers: any[];
        [key: string]: any;
    };
}

export default class DuffelAdapter implements Adapter {
    name = 'duffel';
    private testKey = process.env.DUFFEL_TEST_API_KEY;
    private prodKey = process.env.DUFFEL_PROD_API_KEY;
    private baseUrl = 'https://api.duffel.com/air';

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
        console.log('Duffel Request Payload:', JSON.stringify(requestPayload, null, 2));

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

        console.log('Duffel Response Data:', JSON.stringify(response.data, null, 2));
        return this.mapResponse(response.data.data);
    }

    private mapResponse(data: any): FlightResult[] {
        if (!data || !data.offers) return [];

        return data.offers.map((offer: any) => {
            const slice = offer.slices[0];
            const segment = slice.segments[0];

            return {
                id: offer.id,
                airline: offer.owner.name,
                carrierCode: offer.owner.iata_code,
                flightNumber: `${offer.owner.iata_code}${segment.marketing_carrier_flight_number || ''}`,
                origin: segment.origin.iata_code,
                destination: segment.destination.iata_code,
                departureTime: segment.departing_at,
                arrivalTime: segment.arriving_at,
                duration: this.formatDuration(slice.duration),
                amount: parseFloat(offer.total_amount),
                currency: offer.total_currency,
                stops: slice.segments.length - 1,
                isLCC: false,
                // Use official Duffel logo from response (matches stored DB data)
                airlineLogo: offer.owner.logo_symbol_url || offer.owner.logo_lockup_url || `https://logo.clearbit.com/${offer.owner.name.toLowerCase().replace(/\s+/g, '')}.com`
            };
        });
    }

    private formatDuration(isoDuration: string): string {
        const hours = isoDuration.match(/(\d+)H/)?.[1] || '0';
        const minutes = isoDuration.match(/(\d+)M/)?.[1] || '0';
        return `${hours}h ${minutes}m`;
    }

    async health(): Promise<boolean> {
        return !!(this.testKey || this.prodKey);
    }
}

