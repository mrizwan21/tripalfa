import axios from 'axios';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

// Load environment variables
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: resolve(__dirname, '../../.env') });

const DUFFEL_API_KEY = process.env.DUFFEL_API_KEY;
const DUFFEL_BASE_URL = process.env.DUFFEL_API_BASE_URL || 'https://api.duffel.com';

if (!DUFFEL_API_KEY) {
    console.warn('⚠️ WARNING: DUFFEL_API_KEY is not set in the environment variables.');
}

/**
 * Configure the Axios client for Duffel API requests.
 * Includes necessary headers for Duffel API versioning and authorization.
 */
export const duffelClient = axios.create({
    baseURL: DUFFEL_BASE_URL,
    headers: {
        'Authorization': `Bearer ${DUFFEL_API_KEY}`,
        'Accept-Encoding': 'gzip',
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Duffel-Version': 'v2' // Current Duffel API Version
    },
    timeout: 30000, // 30 seconds timeout
});

// Add interceptors for error handling/logging
duffelClient.interceptors.response.use(
    (response) => {
        // Only return the actual data payload from Duffel
        return response.data;
    },
    (error) => {
        // Standardize error formats thrown by Duffel
        const errorBody = error.response?.data?.errors?.[0] || { message: error.message };
        console.error(`[Duffel API Error] ${error.config?.url}:`, errorBody);

        // Throw a generic error object that service layers can catch safely
        throw new Error(errorBody.message || 'Unknown Duffel API error occurred');
    }
);
