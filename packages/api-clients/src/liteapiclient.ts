import axios, { AxiosInstance } from 'axios';

/**
 * LITEAPI Axios Client
 * Centralizes authentication and base URL handling for:
 * - Data API: https://api.liteapi.travel/v3.0
 * - Booking API: https://book.liteapi.travel/v3.0
 * - Voucher API: https://da.liteapi.travel/v1
 */

// Sanitize URL for logging (remove query params that may contain PII)
function sanitizeUrl(url?: string): string {
  if (!url) return 'unknown';
  try {
    const parsed = new URL(url);
    return `${parsed.protocol}//${parsed.host}${parsed.pathname}`;
  } catch {
    return url.split('?')[0] || 'unknown';
  }
}

const LITEAPI_API_KEY = process.env.LITEAPI_API_KEY || process.env.VITE_LITEAPI_TEST_API_KEY || '';
const LITEAPI_PROD_API_KEY = process.env.LITEAPI_PROD_API_KEY || '';

// Base URLs
const LITEAPI_API_BASE_URL = process.env.LITEAPI_API_BASE_URL || 'https://api.liteapi.travel/v3.0';
const LITEAPI_BOOK_BASE_URL =
  process.env.LITEAPI_BOOK_BASE_URL || 'https://book.liteapi.travel/v3.0';
const LITEAPI_DA_BASE_URL = process.env.LITEAPI_DA_BASE_URL || 'https://da.liteapi.travel/v1';

const createClient = (baseURL: string, useProd: boolean = false): AxiosInstance => {
  const apiKey = useProd && LITEAPI_PROD_API_KEY ? LITEAPI_PROD_API_KEY : LITEAPI_API_KEY;

  return axios.create({
    baseURL,
    headers: {
      'X-API-Key': apiKey,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    timeout: 30000,
  });
};

// Export specialized clients
export const liteapiDataClient = createClient(LITEAPI_API_BASE_URL);
export const liteapiBookClient = createClient(LITEAPI_BOOK_BASE_URL);
export const liteapiDaClient = createClient(LITEAPI_DA_BASE_URL);

// Also export a helper for production-key-only requests (like coordinate search)
export const liteapiProdDataClient = createClient(LITEAPI_API_BASE_URL, true);

// Add interceptors to all clients
const clients = [liteapiDataClient, liteapiBookClient, liteapiDaClient, liteapiProdDataClient];

clients.forEach(client => {
  client.interceptors.response.use(
    response => response.data,
    error => {
      const errorData = error.response?.data || { message: error.message };
      const status = error.response?.status;
      console.error(
        `[LITEAPI Error] ${error.config?.method?.toUpperCase()} ${sanitizeUrl(error.config?.url)} (${status}):`,
        errorData
      );

      const message = errorData.error || errorData.message || 'Unknown LITEAPI API error';
      throw new Error(`LITEAPI Error (${status || 'Network'}): ${message}`);
    }
  );
});

/**
 * Generic request helper
 */
export const liteapiRequest = async <T>(
  endpoint: string,
  method: string = 'GET',
  data?: any,
  baseUrlType: 'api' | 'book' | 'da' = 'api'
): Promise<T> => {
  let client: AxiosInstance;

  switch (baseUrlType) {
    case 'book':
      client = liteapiBookClient;
      break;
    case 'da':
      client = liteapiDaClient;
      break;
    case 'api':
    default:
      client = liteapiDataClient;
      break;
  }

  const response = await client.request({
    url: endpoint,
    method,
    data,
  });

  // Interceptor already returns response.data, so response is already the data
  return response as T;
};
