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
    // Granular fields for ingestion
    latitude?: number;
    longitude?: number;
    address?: string;
    zip?: string;
    website?: string;
    phone?: string;
    email?: string;
    description?: string;
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


    /**
     * Retrieve a list of hotels with pagination
     */
    async getHotels(countryCode: string, offset: number = 0, limit: number = 1000): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
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
    /**
     * Get detailed information about a specific hotel
     */
    async getHotel(hotelId: string): Promise<HotelResult | null> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return null;

        try {
            const response = await axios.get(`${this.baseUrl}/data/hotel`, {
                headers: { 'X-API-Key': apiKey },
                params: { hotelId }
            });
            const data = response.data?.data;
            return data ? this.mapResponse([data])[0] : null;
        } catch (error: any) {
            console.error(`LiteAPI Hotel Details Failed [${hotelId}]:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get reviews for a specific hotel
     */
    async getReviews(hotelId: string, limit: number = 10, offset: number = 0): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/reviews`, {
                headers: { 'X-API-Key': apiKey },
                params: { hotelId, limit, offset }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error(`LiteAPI Reviews Failed [${hotelId}]:`, error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Fetch a list of cities within a specified country
     */
    async getCities(countryCode: string, limit: number = 1000, offset: number = 0): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/cities`, {
                headers: { 'X-API-Key': apiKey },
                params: { countryCode, limit, offset }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error(`LiteAPI Cities Failed [${countryCode}]:`, error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Obtain a list of all countries
     */
    async getCountries(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/countries`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI Countries Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Retrieve a list of supported currencies
     */
    async getCurrencies(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/currencies`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI Currencies Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Get IATA codes for airports and cities
     */
    async getIataCodes(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/iataCodes`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI IATA Codes Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * List the Hotel facilities
     */
    async getFacilities(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/facilities`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI Facilities Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * List of the Hotel types
     */
    async getHotelTypes(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/hotelTypes`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI Hotel Types Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * List of Hotel chains
     */
    async getChains(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/data/chains`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI Chains Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Fetch room rates for a list of hotel IDs
     */
    async getHotelsRates(params: {
        hotelIds: string[];
        checkin: string;
        checkout: string;
        currency?: string;
        guestNationality?: string;
        occupancies: Array<{ adults: number; children?: number[] }>;
    }): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.post(`${this.baseUrl}/hotels/rates`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.hotels || [];
        } catch (error: any) {
            console.error('LiteAPI Hotels Rates Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Fetch all guests with loyalty info
     */
    async getGuests(): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/guests`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error('LiteAPI Get Guests Failed:', error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Fetch a specific guest
     */
    async getGuest(guestId: string): Promise<any | null> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return null;

        try {
            const response = await axios.get(`${this.baseUrl}/guests/${guestId}`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        } catch (error: any) {
            console.error(`LiteAPI Get Guest Failed [${guestId}]:`, error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Fetch all guest's bookings
     */
    async getGuestBookings(guestId: string): Promise<any[]> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return [];

        try {
            const response = await axios.get(`${this.baseUrl}/guests/${guestId}/bookings`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        } catch (error: any) {
            console.error(`LiteAPI Get Guest Bookings Failed [${guestId}]:`, error.response?.data || error.message);
            return [];
        }
    }

    /**
     * Enable the loyalty program
     */
    async enableLoyalty(cashbackRate: string = "0.03"): Promise<any> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return null;

        try {
            const response = await axios.post(`${this.baseUrl}/loyalties`, { cashback: cashbackRate }, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        } catch (error: any) {
            console.error('LiteAPI Enable Loyalty Failed:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Update the loyalty program
     */
    async updateLoyalty(params: { status?: string; cashback?: string }): Promise<any> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return null;

        try {
            const response = await axios.put(`${this.baseUrl}/loyalties`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        } catch (error: any) {
            console.error('LiteAPI Update Loyalty Failed:', error.response?.data || error.message);
            return null;
        }
    }

    /**
     * Get the loyalty program settings
     */
    async getLoyaltySettings(): Promise<any> {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey) return null;

        try {
            const response = await axios.get(`${this.baseUrl}/loyalties`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        } catch (error: any) {
            console.error('LiteAPI Get Loyalty Settings Failed:', error.response?.data || error.message);
            return null;
        }
    }
}

export default new LiteAPIClient();
