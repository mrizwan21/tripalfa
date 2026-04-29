// ============================================================
// OTA PLATFORM - API CLIENTS
// ============================================================
// Generated API clients for all OTA Platform services
// Used by frontend applications
// ============================================================

import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiClientConfig {
  baseUrl: string;
  authToken?: string;
  apiKey?: string;
}

function createApiClient(config: ApiClientConfig): AxiosInstance {
  const client = axios.create({
    baseURL: config.baseUrl,
    headers: {
      'Content-Type': 'application/json',
      ...(config.authToken ? { Authorization: `Bearer ${config.authToken}` } : {}),
      ...(config.apiKey ? { 'X-API-Key': config.apiKey } : {}),
    },
  });

  client.interceptors.response.use(
    (res) => res,
    (error) => {
      if (error.response?.status === 401) {
        // Token expired — redirect to login or refresh
        console.warn('[API] Authentication failed');
      }
      return Promise.reject(error);
    }
  );

  return client;
}

// ============================================================
// AUTH CLIENT
// ============================================================

export function createAuthClient(config: ApiClientConfig) {
  const client = createApiClient(config);

  return {
    login: async (agentCode: string, username: string, password: string, salesChannel?: string) => {
      const res = await client.post('/api/v1/auth/login', { agentCode, username, password, salesChannel });
      return res.data;
    },
    verify: async (token: string) => {
      const res = await client.post('/api/v1/auth/verify', {}, { headers: { Authorization: `Bearer ${token}` } });
      return res.data;
    },
    apiKeyAuth: async (apiKey: string) => {
      const res = await client.post('/api/v1/auth/api-key', { apiKey });
      return res.data;
    },
  };
}

// ============================================================
// BOOKING CLIENT
// ============================================================

export function createBookingClient(config: ApiClientConfig) {
  const client = createApiClient(config);

  return {
    list: async (params?: Record<string, string>) => {
      const res = await client.get('/api/v1/bookings', { params });
      return res.data;
    },
    create: async (data: any) => {
      const res = await client.post('/api/v1/bookings', data);
      return res.data;
    },
    get: async (id: string) => {
      const res = await client.get(`/api/v1/bookings/${id}`);
      return res.data;
    },
    pay: async (id: string, method: string) => {
      const res = await client.post(`/api/v1/bookings/${id}/pay`, { method });
      return res.data;
    },
    refund: async (id: string, amount: number, note: string) => {
      const res = await client.post(`/api/v1/bookings/${id}/refund`, { amount, note });
      return res.data;
    },
    cancel: async (id: string, reason: string) => {
      const res = await client.post(`/api/v1/bookings/${id}/cancel`, { reason });
      return res.data;
    },
  };
}

// ============================================================
// SEARCH CLIENT
// ============================================================

export function createSearchClient(config: ApiClientConfig) {
  const client = createApiClient(config);

  return {
    searchFlights: async (data: any) => {
      const res = await client.post('/api/v1/search/flights', data);
      return res.data;
    },
    searchHotels: async (data: any) => {
      const res = await client.post('/api/v1/search/hotels', data);
      return res.data;
    },
    getAirports: async () => {
      const res = await client.get('/api/v1/search/static/airports');
      return res.data;
    },
    getAirlines: async () => {
      const res = await client.get('/api/v1/search/static/airlines');
      return res.data;
    },
  };
}

// ============================================================
// PAYMENT CLIENT
// ============================================================

export function createPaymentClient(config: ApiClientConfig) {
  const client = createApiClient(config);

  return {
    getWallet: async (ownerId: string, ownerType: string) => {
      const res = await client.get('/api/v1/payments/wallet', { params: { ownerId, ownerType } });
      return res.data;
    },
    createTransaction: async (data: any) => {
      const res = await client.post('/api/v1/payments/wallet/transaction', data);
      return res.data;
    },
  };
}

// ============================================================
// TENANT CLIENT
// ============================================================

export function createTenantClient(config: ApiClientConfig) {
  const client = createApiClient(config);

  return {
    list: async () => {
      const res = await client.get('/api/v1/tenants');
      return res.data;
    },
    get: async (id: string) => {
      const res = await client.get(`/api/v1/tenants/${id}`);
      return res.data;
    },
    provision: async (data: any) => {
      const res = await client.post('/api/v1/tenants/provision', data);
      return res.data;
    },
  };
}
