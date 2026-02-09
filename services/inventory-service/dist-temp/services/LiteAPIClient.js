import axios from 'axios';
class LiteAPIClient {
    testKey;
    prodKey;
    baseUrl;
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
    async searchHotels(params, env = 'test') {
        const apiKey = env === 'prod' ? this.prodKey : this.testKey;
        if (!apiKey)
            return [];
        try {
            // Updated to v3 search if available, or keep using what works. 
            // Assuming v3.0 structure for now based on 'data' consistency.
            const response = await axios.post(`${this.baseUrl}/hotels/search`, params, { headers: { 'X-API-Key': apiKey } });
            return this.mapResponse(response.data?.data || []);
        }
        catch (error) {
            console.warn('LiteAPI Search Failed', error);
            return [];
        }
    }
    /**
     * Retrieve a list of hotels with pagination
     */
    async getHotels(countryCode, offset = 0, limit = 1000) {
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
        }
        catch (error) {
            console.error(`LiteAPI Data Fetch Failed [${countryCode}]:`, error.response?.data || error.message);
            return [];
        }
    }
    mapResponse(data) {
        if (!data || !Array.isArray(data))
            return [];
        // Mapping logic adaptable to v3 response
        return data.map((hotel) => ({
            id: hotel.id || hotel.hotelId,
            name: hotel.name,
            image: hotel.main_photo || hotel.image,
            location: hotel.address,
            rating: hotel.star_rating || hotel.stars || 0,
            reviews: hotel.review_count || 0,
            pricePerNight: hotel.price || 0,
            currency: hotel.currency || 'USD',
            amenities: hotel.amenities ? hotel.amenities.map((a) => a.name) : [],
            provider: 'LiteAPI'
        }));
    }
    /**
     * Get detailed information about a specific hotel
     */
    async getHotel(hotelId) {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return null;
        try {
            const response = await axios.get(`${this.baseUrl}/data/hotel`, {
                headers: { 'X-API-Key': apiKey },
                params: { hotelId }
            });
            const data = response.data?.data;
            return data ? this.mapResponse([data])[0] : null;
        }
        catch (error) {
            console.error(`LiteAPI Hotel Details Failed [${hotelId}]:`, error.response?.data || error.message);
            return null;
        }
    }
    /**
     * Get reviews for a specific hotel
     */
    async getReviews(hotelId, limit = 10, offset = 0) {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/reviews`, {
                headers: { 'X-API-Key': apiKey },
                params: { hotelId, limit, offset }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error(`LiteAPI Reviews Failed [${hotelId}]:`, error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Fetch a list of cities within a specified country
     */
    async getCities(countryCode, limit = 1000, offset = 0) {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/cities`, {
                headers: { 'X-API-Key': apiKey },
                params: { countryCode, limit, offset }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error(`LiteAPI Cities Failed [${countryCode}]:`, error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Obtain a list of all countries
     */
    async getCountries() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/countries`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI Countries Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Retrieve a list of supported currencies
     */
    async getCurrencies() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/currencies`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI Currencies Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Get IATA codes for airports and cities
     */
    async getIataCodes() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/iataCodes`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI IATA Codes Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * List the Hotel facilities
     */
    async getFacilities() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/facilities`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI Facilities Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * List of the Hotel types
     */
    async getHotelTypes() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/hotelTypes`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI Hotel Types Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * List of Hotel chains
     */
    async getChains() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/data/chains`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI Chains Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Fetch all guests with loyalty info
     */
    async getGuests() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/guests`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error('LiteAPI Get Guests Failed:', error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Fetch a specific guest
     */
    async getGuest(guestId) {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return null;
        try {
            const response = await axios.get(`${this.baseUrl}/guests/${guestId}`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        }
        catch (error) {
            console.error(`LiteAPI Get Guest Failed [${guestId}]:`, error.response?.data || error.message);
            return null;
        }
    }
    /**
     * Fetch all guest's bookings
     */
    async getGuestBookings(guestId) {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return [];
        try {
            const response = await axios.get(`${this.baseUrl}/guests/${guestId}/bookings`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || [];
        }
        catch (error) {
            console.error(`LiteAPI Get Guest Bookings Failed [${guestId}]:`, error.response?.data || error.message);
            return [];
        }
    }
    /**
     * Enable the loyalty program
     */
    async enableLoyalty(cashbackRate = "0.03") {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return null;
        try {
            const response = await axios.post(`${this.baseUrl}/loyalties`, { cashback: cashbackRate }, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        }
        catch (error) {
            console.error('LiteAPI Enable Loyalty Failed:', error.response?.data || error.message);
            return null;
        }
    }
    /**
     * Update the loyalty program
     */
    async updateLoyalty(params) {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return null;
        try {
            const response = await axios.put(`${this.baseUrl}/loyalties`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        }
        catch (error) {
            console.error('LiteAPI Update Loyalty Failed:', error.response?.data || error.message);
            return null;
        }
    }
    /**
     * Get the loyalty program settings
     */
    async getLoyaltySettings() {
        const apiKey = this.prodKey || this.testKey;
        if (!apiKey)
            return null;
        try {
            const response = await axios.get(`${this.baseUrl}/loyalties`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || null;
        }
        catch (error) {
            console.error('LiteAPI Get Loyalty Settings Failed:', error.response?.data || error.message);
            return null;
        }
    }
}
export default new LiteAPIClient();
