/**
 * Centralized API Manager
 * Single source of truth for all API endpoints across the application
 * Handles routing, error handling, caching, and request/response interceptors
 */

import axios, { AxiosInstance, AxiosError, AxiosResponse } from 'axios';

// ============================================================================
// TYPES
// ============================================================================

export interface APIEndpoint {
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  path: string;
  description: string;
  cache?: {
    enabled: boolean;
    ttl?: number; // in seconds
  };
  requiresAuth?: boolean;
}

export interface APIModule {
  name: string;
  baseURL: string;
  endpoints: Record<string, APIEndpoint>;
  timeout?: number;
  retryConfig?: {
    attempts: number;
    delay: number;
  };
}

export interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

export interface APIResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  meta?: {
    timestamp: string;
    requestId: string;
  };
}

export interface APIManagerConfig {
  baseURL: string;
  timeout: number;
  retryAttempts: number;
  retryDelay: number;
  enableCache: boolean;
  cacheTTL: number;
  enableLogging: boolean;
}

// ============================================================================
// API MANAGER
// ============================================================================

export class APIManager {
  private static instance: APIManager;
  private axiosInstance: AxiosInstance;
  private modules: Map<string, APIModule> = new Map();
  private cache: Map<string, CacheEntry> = new Map();
  private config: APIManagerConfig;
  private requestInterceptors: Array<(config: any) => any> = [];
  private responseInterceptors: Array<(response: AxiosResponse) => AxiosResponse> = [];
  private errorInterceptors: Array<(error: AxiosError) => Promise<never>> = [];

  private constructor(config: APIManagerConfig) {
    this.config = config;
    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
    });

    this.setupInterceptors();
    this.registerMicroserviceModules();
  }

  /**
   * Get singleton instance of APIManager
   */
  public static getInstance(config?: APIManagerConfig): APIManager {
    if (!APIManager.instance) {
      const defaultConfig: APIManagerConfig = {
        baseURL: (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:3000/api',
        timeout: 30000,
        retryAttempts: 3,
        retryDelay: 1000,
        enableCache: true,
        cacheTTL: 300, // 5 minutes
        enableLogging: true,
      };
      APIManager.instance = new APIManager(config || defaultConfig);
    }
    return APIManager.instance;
  }

  /**
   * Register an API module
   */
  public registerModule(module: APIModule): void {
    this.modules.set(module.name, module);
    this.log('Module registered', { module: module.name, baseURL: module.baseURL });
  }

  /**
   * Get registered module
   */
  public getModule(name: string): APIModule | undefined {
    return this.modules.get(name);
  }

  /**
   * Get all registered modules
   */
  public getModules(): APIModule[] {
    return Array.from(this.modules.values());
  }

  /**
   * Add request interceptor
   */
  public addRequestInterceptor(interceptor: (config: any) => any): void {
    this.requestInterceptors.push(interceptor);
  }

  /**
   * Add response interceptor
   */
  public addResponseInterceptor(interceptor: (response: AxiosResponse) => AxiosResponse): void {
    this.responseInterceptors.push(interceptor);
  }

  /**
   * Add error interceptor
   */
  public addErrorInterceptor(interceptor: (error: AxiosError) => Promise<never>): void {
    this.errorInterceptors.push(interceptor);
  }

  /**
   * Setup axios interceptors
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.axiosInstance.interceptors.request.use(
      (config) => {
        // Add auth token if available
        const token = localStorage.getItem('token') || localStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add request ID for tracking
        config.headers['X-Request-ID'] = this.generateRequestId();

        // Run custom interceptors
        let finalConfig = config;
        for (const interceptor of this.requestInterceptors) {
          finalConfig = interceptor(finalConfig);
        }

        this.log('Request sent', {
          method: config.method,
          url: config.url,
          requestId: config.headers['X-Request-ID'],
        });

        return finalConfig;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor
    this.axiosInstance.interceptors.response.use(
      (response) => {
        // Run custom interceptors
        let finalResponse = response;
        for (const interceptor of this.responseInterceptors) {
          finalResponse = interceptor(finalResponse);
        }

        this.log('Response received', {
          method: response.config.method,
          url: response.config.url,
          status: response.status,
          requestId: response.config.headers['X-Request-ID'],
        });

        return finalResponse;
      },
      async (error) => {
        // Run custom error interceptors
        for (const interceptor of this.errorInterceptors) {
          try {
            await interceptor(error);
          } catch (err) {
            // Continue with other interceptors
          }
        }

        // Handle errors
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Make GET request
   */
  public async get<T = any>(
    url: string,
    options?: any
  ): Promise<APIResponse<T>> {
    try {
      // Check cache first
      if (this.config.enableCache && !options?.skipCache) {
        const cached = this.getCached<T>(url);
        if (cached) {
          this.log('Cache hit', { url });
          return { success: true, data: cached };
        }
      }

      const response = await this.axiosInstance.get<APIResponse<T>>(url, options);
      
      // Cache response if enabled
      if (this.config.enableCache && response.data) {
        this.setCached(url, response.data.data, this.config.cacheTTL);
      }

      return response.data;
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Make POST request
   */
  public async post<T = any>(
    url: string,
    data?: any,
    options?: any
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.axiosInstance.post<APIResponse<T>>(url, data, options);
      
      // Invalidate related cache entries
      this.invalidateCache(url);

      return response.data;
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Make PUT request
   */
  public async put<T = any>(
    url: string,
    data?: any,
    options?: any
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.axiosInstance.put<APIResponse<T>>(url, data, options);
      
      // Invalidate related cache entries
      this.invalidateCache(url);

      return response.data;
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Make PATCH request
   */
  public async patch<T = any>(
    url: string,
    data?: any,
    options?: any
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.axiosInstance.patch<APIResponse<T>>(url, data, options);
      
      // Invalidate related cache entries
      this.invalidateCache(url);

      return response.data;
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Make DELETE request
   */
  public async delete<T = any>(
    url: string,
    options?: any
  ): Promise<APIResponse<T>> {
    try {
      const response = await this.axiosInstance.delete<APIResponse<T>>(url, options);
      
      // Invalidate related cache entries
      this.invalidateCache(url);

      return response.data;
    } catch (error) {
      return this.handleRequestError(error);
    }
  }

  /**
   * Get cached data
   */
  private getCached<T = any>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const age = Date.now() - entry.timestamp;
    if (age > entry.ttl * 1000) {
      this.cache.delete(key);
      return null;
    }

    return entry.data as T;
  }

  /**
   * Set cached data
   */
  private setCached<T = any>(key: string, data: T, ttl: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  /**
   * Invalidate cache entries
   */
  public invalidateCache(pattern?: string): void {
    if (!pattern) {
      this.cache.clear();
      return;
    }

    for (const [key] of this.cache) {
      if (key.includes(pattern)) {
        this.cache.delete(key);
      }
    }
  }

  /**
   * Handle request errors
   */
  private handleRequestError(error: any): APIResponse {
    const axiosError = error as AxiosError;

    return {
      success: false,
      error: {
        code: axiosError.code || 'UNKNOWN_ERROR',
        message: axiosError.message || 'An error occurred',
        details: axiosError.response?.data,
      },
    };
  }

  /**
   * Handle errors globally
   */
  private handleError(error: AxiosError): void {
    const status = error.response?.status;

    switch (status) {
      case 401:
        // Unauthorized - clear auth and redirect to login
        localStorage.removeItem('token');
        localStorage.removeItem('authToken');
        window.location.href = '/login';
        break;
      case 403:
        // Forbidden
        this.log('Access forbidden', { url: error.request.url });
        break;
      case 404:
        // Not found
        this.log('Resource not found', { url: error.request.url });
        break;
      case 429:
        // Rate limited
        this.log('Rate limited', { url: error.request.url, retryAfter: error.response?.headers['retry-after'] });
        break;
      case 500:
        // Server error
        this.log('Server error', { url: error.request.url });
        break;
      default:
        this.log('Request error', { status, message: error.message });
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Log messages (only in development or if enabled)
   */
  private log(message: string, data?: any): void {
    const isDev = typeof import.meta !== 'undefined' && import.meta.env?.DEV;
    if (this.config.enableLogging && isDev) {
      console.log(`[APIManager] ${message}`, data || '');
    }
  }

  /**
   * Get cache statistics
   */
  public getCacheStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys()),
    };
  }

  /**
   * Clear all caches
   */
  public clearCache(): void {
    this.cache.clear();
    this.log('Cache cleared');
  }

  /**
   * Register all microservice modules
   */
  private registerMicroserviceModules(): void {
    const getEnvVar = (key: string, fallback: string): string => {
      if (typeof import.meta !== 'undefined' && import.meta.env) {
        return (import.meta.env as Record<string, string | undefined>)[key] || fallback;
      }
      return fallback;
    };

    // Payment Service Module
    this.registerModule({
      name: 'payment',
      baseURL: getEnvVar('VITE_PAYMENT_SERVICE_URL', 'http://localhost:3003'),
      endpoints: {
        processPayment: { method: 'POST', path: '/api/payments/process', description: 'Process payment' },
        getPayments: { method: 'GET', path: '/api/payments', description: 'List payments' },
        getPayment: { method: 'GET', path: '/api/payments/:id', description: 'Get payment details' },
        refundPayment: { method: 'POST', path: '/api/payments/:id/refund', description: 'Refund payment' },
        getPaymentMethods: { method: 'GET', path: '/api/payments/methods', description: 'Get payment methods' },
        getPaymentAnalytics: { method: 'GET', path: '/api/payments/analytics', description: 'Get payment analytics' },
        getVirtualCards: { method: 'GET', path: '/api/virtual-cards', description: 'List virtual cards' },
        createVirtualCard: { method: 'POST', path: '/api/virtual-cards', description: 'Create virtual card' },
        getVirtualCard: { method: 'GET', path: '/api/virtual-cards/:id', description: 'Get virtual card details' },
        updateVirtualCard: { method: 'PUT', path: '/api/virtual-cards/:id', description: 'Update virtual card' },
        activateVirtualCard: { method: 'POST', path: '/api/virtual-cards/:id/activate', description: 'Activate virtual card' },
        deactivateVirtualCard: { method: 'POST', path: '/api/virtual-cards/:id/deactivate', description: 'Deactivate virtual card' },
        blockVirtualCard: { method: 'POST', path: '/api/virtual-cards/:id/block', description: 'Block virtual card' },
        unblockVirtualCard: { method: 'POST', path: '/api/virtual-cards/:id/unblock', description: 'Unblock virtual card' },
        getVirtualCardTransactions: { method: 'GET', path: '/api/virtual-cards/:id/transactions', description: 'Get card transactions' },
        createVirtualCardTransaction: { method: 'POST', path: '/api/virtual-cards/:id/transactions', description: 'Create card transaction' },
        getVirtualCardSettings: { method: 'GET', path: '/api/virtual-cards/settings', description: 'Get card settings' },
        updateVirtualCardSettings: { method: 'PUT', path: '/api/virtual-cards/settings', description: 'Update card settings' },
        getVirtualCardStats: { method: 'GET', path: '/api/virtual-cards/stats', description: 'Get card statistics' },
      }
    });

    // KYC Service Module
    this.registerModule({
      name: 'kyc',
      baseURL: getEnvVar('VITE_KYC_SERVICE_URL', 'http://localhost:3008'),
      endpoints: {
        getKycStatus: { method: 'GET', path: '/api/kyc/status/:userId', description: 'Get KYC status' },
        submitKyc: { method: 'POST', path: '/api/kyc/submit', description: 'Submit KYC documents' },
        verifyKyc: { method: 'PUT', path: '/api/kyc/verify/:userId', description: 'Verify KYC' },
        getPendingKyc: { method: 'GET', path: '/api/kyc/pending', description: 'Get pending KYC verifications' },
        getDocuments: { method: 'GET', path: '/api/documents/:userId', description: 'Get user documents' },
        uploadDocument: { method: 'POST', path: '/api/documents/upload', description: 'Upload document' },
        deleteDocument: { method: 'DELETE', path: '/api/documents/:documentId', description: 'Delete document' },
        verifyDocument: { method: 'PUT', path: '/api/documents/:documentId/verify', description: 'Verify document' },
        getDocumentTypes: { method: 'GET', path: '/api/documents/types/list', description: 'Get document types' },
      }
    });

    // Marketing Service Module
    this.registerModule({
      name: 'marketing',
      baseURL: getEnvVar('VITE_MARKETING_SERVICE_URL', 'http://localhost:3009'),
      endpoints: {
        getCampaigns: { method: 'GET', path: '/api/campaigns', description: 'List campaigns' },
        createCampaign: { method: 'POST', path: '/api/campaigns', description: 'Create campaign' },
        getCampaign: { method: 'GET', path: '/api/campaigns/:id', description: 'Get campaign details' },
        updateCampaign: { method: 'PUT', path: '/api/campaigns/:id', description: 'Update campaign' },
        deleteCampaign: { method: 'DELETE', path: '/api/campaigns/:id', description: 'Delete campaign' },
      }
    });

    // Support Service Module
    this.registerModule({
      name: 'support',
      baseURL: getEnvVar('VITE_SUPPORT_SERVICE_URL', 'http://localhost:3010'),
      endpoints: {
        getTickets: { method: 'GET', path: '/api/tickets', description: 'List support tickets' },
        createTicket: { method: 'POST', path: '/api/tickets', description: 'Create support ticket' },
      }
    });

    // Tax Service Module
    this.registerModule({
      name: 'tax',
      baseURL: getEnvVar('VITE_TAX_SERVICE_URL', 'http://localhost:3011'),
      endpoints: {
        calculateTax: { method: 'GET', path: '/api/tax/calculate', description: 'Calculate taxes' },
        getTaxRates: { method: 'GET', path: '/api/tax/rates/:country', description: 'Get tax rates' },
      }
    });

    // Audit Service Module
    this.registerModule({
      name: 'audit',
      baseURL: getEnvVar('VITE_AUDIT_SERVICE_URL', 'http://localhost:3012'),
      endpoints: {
        getAuditLogs: { method: 'GET', path: '/api/audit/logs', description: 'Get audit logs' },
        logAction: { method: 'POST', path: '/api/audit/log', description: 'Log action' },
        getComplianceReport: { method: 'GET', path: '/api/audit/compliance', description: 'Get compliance report' },
      }
    });

    // API Gateway Module (existing functionality)
    this.registerModule({
      name: 'gateway',
      baseURL: getEnvVar('VITE_API_GATEWAY_URL', 'http://localhost:3000'),
      endpoints: {
        // Keep existing gateway endpoints
        getBookings: { method: 'GET', path: '/api/bookings', description: 'Get bookings' },
        createBooking: { method: 'POST', path: '/api/bookings', description: 'Create booking' },
        getBooking: { method: 'GET', path: '/api/bookings/:id', description: 'Get booking details' },
        updateBooking: { method: 'PUT', path: '/api/bookings/:id', description: 'Update booking' },
        cancelBooking: { method: 'DELETE', path: '/api/bookings/:id', description: 'Cancel booking' },
        getUsers: { method: 'GET', path: '/api/users', description: 'List users' },
        getUser: { method: 'GET', path: '/api/users/:id', description: 'Get user details' },
        updateUser: { method: 'PUT', path: '/api/users/:id', description: 'Update user' },
        getCompanies: { method: 'GET', path: '/api/companies', description: 'List companies' },
        getCompany: { method: 'GET', path: '/api/companies/:id', description: 'Get company details' },
        updateCompany: { method: 'PUT', path: '/api/companies/:id', description: 'Update company' },
      }
    });
  }
}

export default APIManager;
