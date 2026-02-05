import axios from 'axios';

class AmadeusClient {
    private clientId: string | undefined;
    private clientSecret: string | undefined;
    private baseUrl: string;
    private token: string | null = null;
    private tokenExpiry: number = 0;

    constructor() {
        this.clientId = process.env.AMADEUS_CLIENT_ID || process.env.AMADEUS_API_KEY;
        this.clientSecret = process.env.AMADEUS_CLIENT_SECRET || process.env.AMADEUS_API_SECRET;
        this.baseUrl = process.env.AMADEUS_BASE_URL || 'https://test.api.amadeus.com';
    }

    private async authenticate() {
        if (this.token && Date.now() < this.tokenExpiry) return this.token;

        if (!this.clientId || !this.clientSecret) {
            console.warn('Amadeus credentials configured');
            return null;
        }

        try {
            const params = new URLSearchParams();
            params.append('grant_type', 'client_credentials');
            params.append('client_id', this.clientId);
            params.append('client_secret', this.clientSecret);

            const res = await axios.post(`${this.baseUrl}/v1/security/oauth2/token`, params, {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
            });

            this.token = res.data.access_token;
            // Expires in seconds, subtract 60s buffer
            this.tokenExpiry = Date.now() + (res.data.expires_in * 1000) - 60000;
            return this.token;
        } catch (error: unknown) {
            console.error('Amadeus Auth Failed:', error.response?.data || error.message);
            return null;
        }
    }

    async fetchReferenceData(url: string, params: Record<string, unknown> = {}) {
        const token = await this.authenticate();
        if (!token) return [];

        try {
            const res = await axios.get(`${this.baseUrl}${url}`, {
                headers: { Authorization: `Bearer ${token}` },
                params
            });
            return res.data.data;
        } catch (error: unknown) {
            console.error(`Amadeus Request Failed [${url}]:`, error.response?.data || error.message);
            return [];
        }
    }

    async getAirports(keyword: string) {
        return this.fetchReferenceData('/v1/reference-data/locations', {
            subType: 'AIRPORT,CITY',
            keyword,
            'page[limit]': 20
        });
    }

    async getAirlines(airlineCodes?: string) {
        return this.fetchReferenceData('/v1/reference-data/airlines', {
            airlineCodes
        });
    }
}

export default new AmadeusClient();
