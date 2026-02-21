/**
 * Supplier Management API Service
 * Handles all supplier-related API calls through the centralized APIManager
 */

import APIManager, { APIModule, APIResponse } from '../api-manager/APIManager';
import { SupplierListFilters, SupplierFormData, SupplierPaymentData, SupplierDocumentData } from './types';

// ============================================================================
// SUPPLIER API ENDPOINTS REGISTRY
// ============================================================================

const SUPPLIER_MODULE: APIModule = {
  name: 'suppliers',
  baseURL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000/api',
  timeout: 30000,
  retryConfig: {
    attempts: 3,
    delay: 1000,
  },
  endpoints: {
    // Supplier CRUD
    LIST_SUPPLIERS: {
      method: 'GET',
      path: '/suppliers',
      description: 'Get list of suppliers with filters',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },
    GET_SUPPLIER: {
      method: 'GET',
      path: '/suppliers/:id',
      description: 'Get supplier by ID',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },
    CREATE_SUPPLIER: {
      method: 'POST',
      path: '/suppliers',
      description: 'Create new supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    UPDATE_SUPPLIER: {
      method: 'PUT',
      path: '/suppliers/:id',
      description: 'Update supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    DELETE_SUPPLIER: {
      method: 'DELETE',
      path: '/suppliers/:id',
      description: 'Delete supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },

    // Supplier Products
    LIST_SUPPLIER_PRODUCTS: {
      method: 'GET',
      path: '/suppliers/:id/products',
      description: 'Get supplier products',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },
    ADD_SUPPLIER_PRODUCT: {
      method: 'POST',
      path: '/suppliers/:id/products',
      description: 'Add product to supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    UPDATE_SUPPLIER_PRODUCT: {
      method: 'PUT',
      path: '/suppliers/:id/products/:productId',
      description: 'Update supplier product',
      cache: { enabled: false },
      requiresAuth: true,
    },
    DELETE_SUPPLIER_PRODUCT: {
      method: 'DELETE',
      path: '/suppliers/:id/products/:productId',
      description: 'Remove product from supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },

    // Supplier Rules
    LIST_SUPPLIER_RULES: {
      method: 'GET',
      path: '/suppliers/:id/rules',
      description: 'Get supplier pricing rules',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },
    APPLY_SUPPLIER_RULE: {
      method: 'POST',
      path: '/suppliers/:id/rules',
      description: 'Apply rule to supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    UPDATE_SUPPLIER_RULE: {
      method: 'PUT',
      path: '/suppliers/:id/rules/:ruleId',
      description: 'Update supplier rule',
      cache: { enabled: false },
      requiresAuth: true,
    },

    // Supplier Payments
    LIST_SUPPLIER_PAYMENTS: {
      method: 'GET',
      path: '/suppliers/:id/payments',
      description: 'Get supplier payment methods',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },
    ADD_SUPPLIER_PAYMENT: {
      method: 'POST',
      path: '/suppliers/:id/payments',
      description: 'Add payment method to supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    UPDATE_SUPPLIER_PAYMENT: {
      method: 'PUT',
      path: '/suppliers/:id/payments/:paymentId',
      description: 'Update supplier payment method',
      cache: { enabled: false },
      requiresAuth: true,
    },
    DELETE_SUPPLIER_PAYMENT: {
      method: 'DELETE',
      path: '/suppliers/:id/payments/:paymentId',
      description: 'Remove payment method from supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },

    // Supplier Documents
    LIST_SUPPLIER_DOCUMENTS: {
      method: 'GET',
      path: '/suppliers/:id/documents',
      description: 'Get supplier documents',
      cache: { enabled: true, ttl: 600 },
      requiresAuth: true,
    },
    UPLOAD_SUPPLIER_DOCUMENT: {
      method: 'POST',
      path: '/suppliers/:id/documents',
      description: 'Upload document for supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    DELETE_SUPPLIER_DOCUMENT: {
      method: 'DELETE',
      path: '/suppliers/:id/documents/:docId',
      description: 'Delete supplier document',
      cache: { enabled: false },
      requiresAuth: true,
    },

    // Supplier API Credentials
    LIST_SUPPLIER_API_CREDENTIALS: {
      method: 'GET',
      path: '/suppliers/:id/api-credentials',
      description: 'Get supplier API credentials',
      cache: { enabled: false }, // Don't cache sensitive data
      requiresAuth: true,
    },
    ADD_SUPPLIER_API_CREDENTIALS: {
      method: 'POST',
      path: '/suppliers/:id/api-credentials',
      description: 'Add API credentials for supplier',
      cache: { enabled: false },
      requiresAuth: true,
    },
    UPDATE_SUPPLIER_API_CREDENTIALS: {
      method: 'PUT',
      path: '/suppliers/:id/api-credentials/:credId',
      description: 'Update supplier API credentials',
      cache: { enabled: false },
      requiresAuth: true,
    },
    DELETE_SUPPLIER_API_CREDENTIALS: {
      method: 'DELETE',
      path: '/suppliers/:id/api-credentials/:credId',
      description: 'Delete supplier API credentials',
      cache: { enabled: false },
      requiresAuth: true,
    },

    // Supplier Analytics & Stats
    GET_SUPPLIER_STATS: {
      method: 'GET',
      path: '/suppliers/:id/stats',
      description: 'Get supplier performance statistics',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },
    GET_SUPPLIER_ANALYTICS: {
      method: 'GET',
      path: '/suppliers/analytics',
      description: 'Get supplier analytics dashboard data',
      cache: { enabled: true, ttl: 300 },
      requiresAuth: true,
    },

    // Supplier Health Check
    CHECK_SUPPLIER_HEALTH: {
      method: 'POST',
      path: '/suppliers/:id/health-check',
      description: 'Check supplier API connection health',
      cache: { enabled: false },
      requiresAuth: true,
    },
  },
};

// ============================================================================
// SUPPLIER API SERVICE CLASS
// ============================================================================

export class SupplierAPIService {
  private static instance: SupplierAPIService;
  private apiManager: APIManager;

  private constructor() {
    this.apiManager = APIManager.getInstance();
    this.apiManager.registerModule(SUPPLIER_MODULE);
  }

  /**
   * Get singleton instance
   */
  public static getInstance(): SupplierAPIService {
    if (!SupplierAPIService.instance) {
      SupplierAPIService.instance = new SupplierAPIService();
    }
    return SupplierAPIService.instance;
  }

  // =========================================================================
  // SUPPLIER CRUD OPERATIONS
  // =========================================================================

  /**
   * Get list of suppliers with optional filters
   */
  async listSuppliers(
    filters?: SupplierListFilters,
    pagination?: { page: number; limit: number }
  ): Promise<APIResponse> {
    const params = new URLSearchParams();

    if (filters?.search) params.append('search', filters.search);
    if (filters?.supplierType) params.append('supplierType', filters.supplierType);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.pricingModel) params.append('pricingModel', filters.pricingModel);
    if (filters?.country) params.append('country', filters.country);

    if (pagination) {
      params.append('page', pagination.page.toString());
      params.append('limit', pagination.limit.toString());
    }

    const url = `/suppliers?${params.toString()}`;
    return this.apiManager.get(url);
  }

  /**
   * Get supplier by ID
   */
  async getSupplier(id: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${id}`);
  }

  /**
   * Create new supplier
   */
  async createSupplier(data: SupplierFormData): Promise<APIResponse> {
    return this.apiManager.post('/suppliers', data);
  }

  /**
   * Update supplier
   */
  async updateSupplier(id: string, data: Partial<SupplierFormData>): Promise<APIResponse> {
    return this.apiManager.put(`/suppliers/${id}`, data);
  }

  /**
   * Delete supplier
   */
  async deleteSupplier(id: string): Promise<APIResponse> {
    return this.apiManager.delete(`/suppliers/${id}`);
  }

  // =========================================================================
  // SUPPLIER PRODUCTS
  // =========================================================================

  /**
   * Get supplier products
   */
  async listSupplierProducts(supplierId: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${supplierId}/products`);
  }

  /**
   * Add product to supplier
   */
  async addSupplierProduct(supplierId: string, productData: any): Promise<APIResponse> {
    return this.apiManager.post(`/suppliers/${supplierId}/products`, productData);
  }

  /**
   * Update supplier product
   */
  async updateSupplierProduct(
    supplierId: string,
    productId: string,
    productData: any
  ): Promise<APIResponse> {
    return this.apiManager.put(`/suppliers/${supplierId}/products/${productId}`, productData);
  }

  /**
   * Delete supplier product
   */
  async deleteSupplierProduct(supplierId: string, productId: string): Promise<APIResponse> {
    return this.apiManager.delete(`/suppliers/${supplierId}/products/${productId}`);
  }

  // =========================================================================
  // SUPPLIER RULES
  // =========================================================================

  /**
   * Get supplier rules
   */
  async listSupplierRules(supplierId: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${supplierId}/rules`);
  }

  /**
   * Apply rule to supplier
   */
  async applySupplierRule(supplierId: string, ruleData: any): Promise<APIResponse> {
    return this.apiManager.post(`/suppliers/${supplierId}/rules`, ruleData);
  }

  /**
   * Update supplier rule
   */
  async updateSupplierRule(supplierId: string, ruleId: string, ruleData: any): Promise<APIResponse> {
    return this.apiManager.put(`/suppliers/${supplierId}/rules/${ruleId}`, ruleData);
  }

  // =========================================================================
  // SUPPLIER PAYMENTS
  // =========================================================================

  /**
   * Get supplier payment methods
   */
  async listSupplierPayments(supplierId: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${supplierId}/payments`);
  }

  /**
   * Add payment method to supplier
   */
  async addSupplierPayment(supplierId: string, paymentData: SupplierPaymentData): Promise<APIResponse> {
    return this.apiManager.post(`/suppliers/${supplierId}/payments`, paymentData);
  }

  /**
   * Update supplier payment method
   */
  async updateSupplierPayment(
    supplierId: string,
    paymentId: string,
    paymentData: Partial<SupplierPaymentData>
  ): Promise<APIResponse> {
    return this.apiManager.put(`/suppliers/${supplierId}/payments/${paymentId}`, paymentData);
  }

  /**
   * Delete supplier payment method
   */
  async deleteSupplierPayment(supplierId: string, paymentId: string): Promise<APIResponse> {
    return this.apiManager.delete(`/suppliers/${supplierId}/payments/${paymentId}`);
  }

  // =========================================================================
  // SUPPLIER DOCUMENTS
  // =========================================================================

  /**
   * Get supplier documents
   */
  async listSupplierDocuments(supplierId: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${supplierId}/documents`);
  }

  /**
   * Upload document for supplier
   */
  async uploadSupplierDocument(
    supplierId: string,
    documentData: SupplierDocumentData
  ): Promise<APIResponse> {
    const formData = new FormData();
    formData.append('name', documentData.name);
    formData.append('type', documentData.type);
    formData.append('file', documentData.file);
    if (documentData.expiryDate) {
      formData.append('expiryDate', documentData.expiryDate);
    }

    return this.apiManager.post(
      `/suppliers/${supplierId}/documents`,
      formData,
      {
        headers: { 'Content-Type': 'multipart/form-data' },
      }
    );
  }

  /**
   * Delete supplier document
   */
  async deleteSupplierDocument(supplierId: string, docId: string): Promise<APIResponse> {
    return this.apiManager.delete(`/suppliers/${supplierId}/documents/${docId}`);
  }

  // =========================================================================
  // SUPPLIER API CREDENTIALS
  // =========================================================================

  /**
   * Get supplier API credentials
   */
  async listSupplierAPICredentials(supplierId: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${supplierId}/api-credentials`, {
      skipCache: true, // Never cache credentials
    });
  }

  /**
   * Add API credentials for supplier
   */
  async addSupplierAPICredentials(supplierId: string, credentialsData: any): Promise<APIResponse> {
    return this.apiManager.post(`/suppliers/${supplierId}/api-credentials`, credentialsData);
  }

  /**
   * Update supplier API credentials
   */
  async updateSupplierAPICredentials(
    supplierId: string,
    credId: string,
    credentialsData: any
  ): Promise<APIResponse> {
    return this.apiManager.put(
      `/suppliers/${supplierId}/api-credentials/${credId}`,
      credentialsData
    );
  }

  /**
   * Delete supplier API credentials
   */
  async deleteSupplierAPICredentials(supplierId: string, credId: string): Promise<APIResponse> {
    return this.apiManager.delete(`/suppliers/${supplierId}/api-credentials/${credId}`);
  }

  // =========================================================================
  // SUPPLIER ANALYTICS & MONITORING
  // =========================================================================

  /**
   * Get supplier performance statistics
   */
  async getSupplierStats(supplierId: string): Promise<APIResponse> {
    return this.apiManager.get(`/suppliers/${supplierId}/stats`);
  }

  /**
   * Get supplier analytics dashboard data
   */
  async getSupplierAnalytics(): Promise<APIResponse> {
    return this.apiManager.get('/suppliers/analytics');
  }

  /**
   * Check supplier API connection health
   */
  async checkSupplierHealth(supplierId: string): Promise<APIResponse> {
    return this.apiManager.post(`/suppliers/${supplierId}/health-check`);
  }

  // =========================================================================
  // CACHE MANAGEMENT
  // =========================================================================

  /**
   * Clear supplier-related caches
   */
  public clearSupplierCache(supplierId?: string): void {
    if (supplierId) {
      this.apiManager.invalidateCache(`/suppliers/${supplierId}`);
    } else {
      this.apiManager.invalidateCache('/suppliers');
    }
  }

  /**
   * Get API manager for advanced usage
   */
  public getAPIManager(): APIManager {
    return this.apiManager;
  }
}

export const supplierAPIService = SupplierAPIService.getInstance();
export default supplierAPIService;
