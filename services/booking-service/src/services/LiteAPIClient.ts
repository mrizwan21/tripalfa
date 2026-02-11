import axios from 'axios';
import { apiManagerService, APIUsageRecord } from './apiManagerService';

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

        const startTime = Date.now();
        let statusCode = 0;
        let errorMessage: string | undefined;

        try {
            const response = await axios.post(`${this.baseUrl}/rates/prebook`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            statusCode = response.status;

            // Record successful API usage
            await this.recordAPIUsage(`${this.baseUrl}/rates/prebook`, 'POST', startTime, statusCode);

            return response.data?.data || response.data;
        } catch (error: any) {
            if (error.response) {
                statusCode = error.response.status;
                errorMessage = error.response.data?.message || error.message;
            } else {
                errorMessage = error.message;
            }

            // Record failed API usage
            await this.recordAPIUsage(`${this.baseUrl}/rates/prebook`, 'POST', startTime, statusCode || 0, errorMessage);

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

        const startTime = Date.now();
        let statusCode = 0;
        let errorMessage: string | undefined;

        try {
            const response = await axios.post(`${this.baseUrl}/rates/book`, params, {
                headers: { 'X-API-Key': apiKey }
            });
            statusCode = response.status;

            // Record successful API usage
            await this.recordAPIUsage(`${this.baseUrl}/rates/book`, 'POST', startTime, statusCode);

            return response.data?.data || response.data;
        } catch (error: any) {
            if (error.response) {
                statusCode = error.response.status;
                errorMessage = error.response.data?.message || error.message;
            } else {
                errorMessage = error.message;
            }

            // Record failed API usage
            await this.recordAPIUsage(`${this.baseUrl}/rates/book`, 'POST', startTime, statusCode || 0, errorMessage);

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

        const startTime = Date.now();
        let statusCode = 0;
        let errorMessage: string | undefined;

        try {
            const response = await axios.put(`${this.baseUrl}/bookings/${bookingId}`, { status: 'cancelled' }, {
                headers: { 'X-API-Key': apiKey }
            });
            statusCode = response.status;

            // Record successful API usage
            await this.recordAPIUsage(`${this.baseUrl}/bookings/${bookingId}`, 'PUT', startTime, statusCode);

            return response.data?.data || response.data;
        } catch (error: any) {
            if (error.response) {
                statusCode = error.response.status;
                errorMessage = error.response.data?.message || error.message;
            } else {
                errorMessage = error.message;
            }

            // Record failed API usage
            await this.recordAPIUsage(`${this.baseUrl}/bookings/${bookingId}`, 'PUT', startTime, statusCode || 0, errorMessage);

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

        const startTime = Date.now();
        let statusCode = 0;
        let errorMessage: string | undefined;

        try {
            const response = await axios.get(`${this.baseUrl}/bookings/${bookingId}`, {
                headers: { 'X-API-Key': apiKey }
            });
            statusCode = response.status;

            // Record successful API usage
            await this.recordAPIUsage(`${this.baseUrl}/bookings/${bookingId}`, 'GET', startTime, statusCode);

            return response.data?.data || response.data;
        } catch (error: any) {
            if (error.response) {
                statusCode = error.response.status;
                errorMessage = error.response.data?.message || error.message;
            } else {
                errorMessage = error.message;
            }

            // Record failed API usage
            await this.recordAPIUsage(`${this.baseUrl}/bookings/${bookingId}`, 'GET', startTime, statusCode || 0, errorMessage);

            console.error('LiteAPI Get Booking Failed:', error.response?.data || error.message);
            throw error;
        }
    }

    /**
     * Record API usage for monitoring and alerting
     */
    private async recordAPIUsage(
        url: string,
        method: string,
        startTime: number,
        statusCode: number,
        error?: string
    ): Promise<void> {
        try {
            const responseTime = Date.now() - startTime;

            const record: APIUsageRecord = {
                apiKey: this.getApiKey(), // Use current API key
                endpoint: url,
                method,
                timestamp: startTime,
                responseTime,
                statusCode,
                error
            };

            await apiManagerService.recordUsage(record);
        } catch (recordError) {
            console.error('[LiteAPIClient] Failed to record API usage:', recordError);
            // Don't throw - API monitoring failure shouldn't break the API call
        }
    }
}

export default new LiteAPIBookingClient();
