import axios from 'axios';

class LiteAPIBookingClient {
    private testKey: string | undefined;
    private prodKey: string | undefined;
    private baseUrl: string;

    constructor() {
        this.testKey = process.env.LITEAPI_TEST_API_KEY;
        this.prodKey = process.env.LITEAPI_PROD_API_KEY;
        this.baseUrl = 'https://api.liteapi.travel/v3.0';
    }

    private getApiKey(env: 'test' | 'prod' = 'test'): string {
        return (env === 'prod' ? this.prodKey : this.testKey) || '';
    }

    /**
     * Initiate a prebooking session
     */
    async prebook(params: {
        offerId: string;
        price: number;
        currency: string;
    }, env: 'test' | 'prod' = 'test'): Promise<any> {
        const apiKey = this.getApiKey(env);
        if (!apiKey) throw new Error('LiteAPI Key not configured');

        try {
            const response = await axios.post(`${this.baseUrl}/rates/prebook`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            console.error('LiteAPI Prebook Failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Confirm a booking
     */
    async book(params: {
        prebookId: string;
        guestDetails: any;
        paymentDetails?: any;
    }, env: 'test' | 'prod' = 'test'): Promise<any> {
        const apiKey = this.getApiKey(env);
        if (!apiKey) throw new Error('LiteAPI Key not configured');

        try {
            const response = await axios.post(`${this.baseUrl}/rates/book`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            console.error('LiteAPI Book Failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Cancel a booking
     */
    async cancel(bookingId: string, env: 'test' | 'prod' = 'test'): Promise<any> {
        const apiKey = this.getApiKey(env);
        if (!apiKey) throw new Error('LiteAPI Key not configured');

        try {
            const response = await axios.put(`${this.baseUrl}/bookings/${bookingId}`, { status: 'cancelled' }, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            console.error('LiteAPI Cancel Failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Retrieve a booking
     */
    async getBooking(bookingId: string, env: 'test' | 'prod' = 'test'): Promise<any> {
        const apiKey = this.getApiKey(env);
        if (!apiKey) throw new Error('LiteAPI Key not configured');

        try {
            const response = await axios.get(`${this.baseUrl}/bookings/${bookingId}`, {
                headers: { 'X-API-Key': apiKey }
            });
            return response.data?.data || response.data;
        } catch (error: any) {
            console.error('LiteAPI Get Booking Failed:', error.response?.data || error.message);
            throw error;
        }
    }
}

export default new LiteAPIBookingClient();
