import axios from 'axios';

interface LiteAPISearchHotelsParams {
    location: string;
    checkin: string;
    checkout: string;
    adults?: number;
    children?: number;
    currency?: string;
}

interface HotelResult {
    id: string;
    name: string;
    image: string;
    location: string;
    rating: number;
    reviews: number;
    pricePerNight: number;
    currency: string;
    amenities: string[];
    provider: string;
}

class LiteAPIClient {
    private testKey: string | undefined;
    private prodKey: string | undefined;
    private baseUrl: string;

    constructor() {
        this.testKey = process.env.LITEAPI_TEST_API_KEY;
        this.prodKey = process.env.LITEAPI_PROD_API_KEY;
        this.baseUrl = 'https://api.liteapi.travel/v3.0';
    }

    // ... searchHotels keeps using v3.0 if compatible or adapt it ...
    // Note: Search was using v1 in previous code. We should upgrade to v3.0 for consistency if possible, 
    // or keep v1 search if that's what's working, but 'data' endpoint is definitely v3.0.
    // The search results indicated https://api.liteapi.travel/v3.0/data/hotels

    // Existing searchHotels implementation might need adjustment for v3 structure 
    // but focusing on getHotels for ingestion first.

    async searchHotels(params: LiteAPISearchHotelsParams, env: 'test' | 'prod' = 'test'): Promise<HotelResult[]> {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;
        if (!apiKey) return [];

        try {
            // Updated to v3 search if available, or keep using what works. 
            // Assuming v3.0 structure for now based on 'data' consistency.
            const response = await axios.post(
                `${this.baseUrl}/hotels/search`,
                params,
                { headers: { 'X-API-Key': apiKey } }
            );
            return this.mapResponse(response.data?.data || []);
        } catch (error) {
            console.warn('LiteAPI Search Failed', error);
            return [];
        }
    }

    async getHotels(countryCode: string, offset: number = 0, limit: number = 1000): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey; // Prefer prod for static data if available
        if (!apiKey) {
            console.warn('No LiteAPI key found');
            return [];
        }

        try {
            const response = await axios.get(`${this.baseUrl}/data/hotels`, {
                headers: { 'X-API-Key': apiKey },
                params: {
                    countryCode,
                    offset,
                    limit
                }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error(`LiteAPI Data Fetch Failed [${countryCode}]:`, error.response?.data || error.message);
            return [];
        }
    }

    private mapResponse(data: any): HotelResult[] {
        if (!data || !Array.isArray(data)) return [];
        // Mapping logic adaptable to v3 response
        return data.map((hotel: any) => ({
            id: hotel.id || hotel.hotelId,
            name: hotel.name,
            image: hotel.main_photo || hotel.image,
            location: hotel.address,
            rating: hotel.star_rating || hotel.stars || 0,
            reviews: hotel.review_count || 0,
            pricePerNight: hotel.price || 0,
            currency: hotel.currency || 'USD',
            amenities: hotel.amenities ? hotel.amenities.map((a: any) => a.name) : [],
            provider: 'LiteAPI'
        }));
    }
}

export default new LiteAPIClient();
