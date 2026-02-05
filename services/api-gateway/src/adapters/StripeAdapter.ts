type Adapter = any;
// Assuming stripe package is installed or we use axios for direct API calls
import axios from 'axios';

export default class StripeAdapter implements Adapter {
    name = 'stripe';
    private apiKey = process.env.STRIPE_SECRET_KEY;
    private baseUrl = 'https://api.stripe.com/v1';

    async request(payload: any): Promise<any> {
        const { action, body } = payload;

        if (!this.apiKey || this.apiKey.includes('your-stripe')) {
            throw new Error('Stripe API key not configured');
        }

        switch (action) {
            case 'create_payment_intent':
                return await this.createPaymentIntent(body);
            default:
                throw new Error(`Unsupported Stripe action: ${action}`);
        }
    }

    private async createPaymentIntent(body: any) {
        const { amount, currency, metadata } = body;

        // Stripe uses URL encoded form data
        const params = new URLSearchParams();
        params.append('amount', Math.round(amount * 100).toString()); // Stripe expects cents
        params.append('currency', currency.toLowerCase());

        if (metadata) {
            Object.keys(metadata).forEach(key => {
                params.append(`metadata[${key}]`, metadata[key]);
            });
        }

        const response = await axios.post(
            `${this.baseUrl}/payment_intents`,
            params.toString(),
            {
                headers: {
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
            }
        );

        return response.data;
    }

    async health(): Promise<boolean> {
        return !!this.apiKey;
    }
}
