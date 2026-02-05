import axios from 'axios';

interface DuffelSearchFlightsParams {
    origin: string;
    destination: string;
    departureDate: string;
    cabinClass?: string;
    passengers?: unknown[];
}

interface FlightResult {
    id: string;
    airline: string;
    carrierCode: string;
    flightNumber: string;
    origin: string;
    destination: string;
    departureTime: string;
    arrivalTime: string;
    duration: string;
    amount: number;
    currency: string;
    stops: number;
    isLCC: boolean;
    airlineLogo: string;
}

class DuffelClient {
    private testKey: string | undefined;
    private prodKey: string | undefined;
    private baseUrl: string;

    constructor() {
        this.testKey = process.env.DUFFEL_TEST_API_KEY;
        this.prodKey = process.env.DUFFEL_PROD_API_KEY;
        this.baseUrl = 'https://api.duffel.com/air';
    }

    async searchFlights(params: DuffelSearchFlightsParams, env: 'test' | 'prod' = 'test'): Promise<FlightResult[]> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;

        if (!apiKey || apiKey.includes('your-duffel')) {
            console.warn(`Duffel ${env} API key not configured, returning empty results`);
            return [];
        }

        try {
            const { origin, destination, departureDate, cabinClass = 'economy', passengers = [{ type: 'adult' }] } = params;

            const response = await axios.post(
                `${this.baseUrl}/offer_requests`,
                {
                    data: {
                        slices: [
                            {
                                origin: origin,
                                destination: destination,
                                departure_date: departureDate,
                            },
                        ],
                        passengers: passengers,
                        cabin_class: cabinClass,
                    },
                },
                {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'beta',
                        'Content-Type': 'application/json',
                    },
                }
            );

            return this.mapResponse(response.data.data);
        } catch (error: unknown) {
            console.error('Duffel API Error:', error.response?.data || error.message);
            return [];
        }
    }

    async getAirlines(env: 'test' | 'prod' = 'test'): Promise<unknown[]> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;
        if (!apiKey || apiKey.includes('your-duffel')) return [];

        let allAirlines: unknown[] = [];
        let after: string | null = null;
        let keepFetching = true;

        console.log('Fetching Airlines from Duffel...');

        try {
            while (keepFetching) {
                const response: { data?: { data?: unknown[]; meta?: { after?: string } } } = await axios.get(`${this.baseUrl}/airlines`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                    },
                    params: {
                        limit: 200,
                        after: after
                    }
                });

                const data = response.data?.data || [];
                allAirlines = [...allAirlines, ...data];

                after = response.data?.meta?.after;
                if (!after) keepFetching = false;

                // Safety break to avoid infinite loops if pagination fails
                if (allAirlines.length > 2000) keepFetching = false;
            }
        } catch (error: unknown) {
            console.error('Duffel Airlines Fetch Error:', error.response?.data || error.message);
        }

        return allAirlines;
    }

    async getAirports(env: 'test' | 'prod' = 'test'): Promise<unknown[]> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;
        if (!apiKey || apiKey.includes('your-duffel')) return [];

        let allAirports: unknown[] = [];
        let after: string | null = null;
        let keepFetching = true;

        console.log('Fetching Airports from Duffel...');

        try {
            while (keepFetching) {
                const response: { data?: { data?: unknown[]; meta?: { after?: string } } } = await axios.get(`${this.baseUrl}/airports`, {
                    headers: {
                        'Authorization': `Bearer ${apiKey}`,
                        'Duffel-Version': 'v2',
                    },
                    params: {
                        limit: 200,
                        after: after
                    }
                });

                const data = response.data?.data || [];
                allAirports = [...allAirports, ...data];

                after = response.data?.meta?.after;
                if (!after) keepFetching = false;

                // Safety limit
                if (allAirports.length > 15000) keepFetching = false;
            }
        } catch (error: unknown) {
            console.error('Duffel Airports Fetch Error:', error.response?.data || error.message);
        }

        return allAirports;
    }

    private mapResponse(data: unknown): FlightResult[] {
        if (!data || !(data as { offers?: unknown[] }).offers) return [];

        return ((data as { offers: unknown[] }).offers).map((offer: unknown) => {
            const slice = offer.slices[0];
            const segment = slice.segments[0];

            return {
                id: offer.id,
                airline: offer.owner.name,
                carrierCode: offer.owner.iata_code,
                flightNumber: `${offer.owner.iata_code}${segment.marketing_carrier_flight_number}`,
                origin: segment.origin.iata_code,
                destination: segment.destination.iata_code,
                departureTime: new Date(segment.departing_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                arrivalTime: new Date(segment.arriving_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }),
                duration: this.formatDuration(slice.duration),
                amount: parseFloat(offer.total_amount),
                currency: offer.total_currency,
                stops: slice.segments.length - 1,
                isLCC: false, // Duffel handles both but mostly GDS
                airlineLogo: `https://logo.clearbit.com/${offer.owner.name.toLowerCase().replace(/\s+/g, '')}.com`
            };
        });
    }

    private formatDuration(isoDuration: string): string {
        // Basic ISO 8601 duration parser (e.g., PT14H45M)
        const hours = isoDuration.match(/(\d+)H/)?.[1] || '0';
        const minutes = isoDuration.match(/(\d+)M/)?.[1] || '0';
        return `${hours}h ${minutes}m`;
    }
}

export default new DuffelClient();
