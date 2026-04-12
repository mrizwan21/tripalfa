// Gateway API Service Layer
// Handles all API Gateway configuration and management operations

import APIManager from './APIManager';

type ApiResponse<T = any> = {
  success: boolean;
  data?: T;
  error?: any;
  message?: string;
};

type SupplierAPIGateway = Record<string, any>;
type SupplierAPIGatewayFormData = Record<string, any>;
type GatewayTestResponse = Record<string, any>;
type GatewayListResponse = Record<string, any>;
type SupplierAPIGatewayResponse = Record<string, any>;
type GatewayEndpointsResponse = Record<string, any>;
type GatewayHealthCheckResult = Record<string, any>;
type CredentialValidation = Record<string, any>;
type GatewayMetrics = Record<string, any>;
type GatewayAlert = Record<string, any>;

type APIEndpoint = {
  id?: string;
  method?: string;
  path?: string;
  description?: string;
  [key: string]: any;
};

const apiManager = APIManager.getInstance();

// ============================================================================
// GATEWAY MODULE DEFINITION
// ============================================================================

const GATEWAY_MODULE = {
  name: 'gateway',
  baseURL: '/api/suppliers', // Will be appended with {supplierId}/gateway
  version: 'v1',
  endpoints: {
    // List Gateways
    listGateways: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways',
      description: 'List all API gateways for a supplier',
      cache: {
        enabled: true,
        ttl: 300000,
      },
      requiresAuth: true,
    },

    // Get Gateway Detail
    getGateway: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}',
      description: 'Get detailed API gateway configuration',
      cache: {
        enabled: true,
        ttl: 300000,
      },
      requiresAuth: true,
    },

    // Create Gateway
    createGateway: {
      method: 'POST' as const,
      path: '/api/suppliers/{supplierId}/gateways',
      description: 'Create new API gateway configuration',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Update Gateway
    updateGateway: {
      method: 'PUT' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}',
      description: 'Update API gateway configuration',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Delete Gateway
    deleteGateway: {
      method: 'DELETE' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}',
      description: 'Delete API gateway configuration',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Test Credentials
    testCredentials: {
      method: 'POST' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/test-credentials',
      description: 'Validate API credentials',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Test Endpoint
    testEndpoint: {
      method: 'POST' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/test-endpoint',
      description: 'Test a specific API endpoint',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
      timeout: 30000,
    },

    // Full Gateway Test
    testGateway: {
      method: 'POST' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/test',
      description: 'Run full gateway health check',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
      timeout: 60000,
    },

    // Get Gateway Endpoints
    getGatewayEndpoints: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/endpoints',
      description: 'Get all endpoints for a gateway',
      cache: {
        enabled: true,
        ttl: 300000,
      },
      requiresAuth: true,
    },

    // Add Endpoint to Gateway
    addGatewayEndpoint: {
      method: 'POST' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/endpoints',
      description: 'Add a new endpoint to gateway configuration',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Update Endpoint
    updateGatewayEndpoint: {
      method: 'PUT' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/endpoints/{endpointId}',
      description: 'Update gateway endpoint configuration',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Delete Endpoint
    deleteGatewayEndpoint: {
      method: 'DELETE' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/endpoints/{endpointId}',
      description: 'Delete gateway endpoint',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },

    // Get Gateway Metrics
    getGatewayMetrics: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/metrics',
      description: 'Get gateway usage and performance metrics',
      cache: {
        enabled: true,
        ttl: 60000,
      },
      requiresAuth: true,
    },

    // Get Gateway Health
    getGatewayHealth: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/health',
      description: 'Get gateway health status',
      cache: {
        enabled: true,
        ttl: 60000,
      },
      requiresAuth: true,
    },

    // Get Gateway Alerts
    getGatewayAlerts: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/alerts',
      description: 'Get active alerts for gateway',
      cache: {
        enabled: true,
        ttl: 30000,
      },
      requiresAuth: true,
    },

    // Get Product-Specific Configuration
    getProductGatewayConfig: {
      method: 'GET' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/products/{productId}',
      description: 'Get product-specific gateway configuration',
      cache: {
        enabled: true,
        ttl: 300000,
      },
      requiresAuth: true,
    },

    // Update Product Configuration
    updateProductGatewayConfig: {
      method: 'PUT' as const,
      path: '/api/suppliers/{supplierId}/gateways/{gatewayId}/products/{productId}',
      description: 'Update product-specific endpoint mappings',
      cache: {
        enabled: false,
      },
      requiresAuth: true,
    },
  },
};

// Register the module
apiManager.registerModule(GATEWAY_MODULE);

// ============================================================================
// GATEWAY SERVICE CLASS
// ============================================================================

class GatewayAPIService {
  /**
   * List all API gateways for a supplier
   */
  static async listGateways(
    supplierId: string,
    params?: { page?: number; limit?: number }
  ): Promise<ApiResponse<GatewayListResponse>> {
    return apiManager.get(`/api/suppliers/${supplierId}/gateways`, { params });
  }

  /**
   * Get specific gateway configuration with all details
   */
  static async getGateway(
    supplierId: string,
    gatewayId: string
  ): Promise<ApiResponse<SupplierAPIGatewayResponse>> {
    return apiManager.get(`/api/suppliers/${supplierId}/gateways/${gatewayId}`);
  }

  /**
   * Create new API gateway for supplier
   */
  static async createGateway(
    supplierId: string,
    data: SupplierAPIGatewayFormData
  ): Promise<ApiResponse<SupplierAPIGateway>> {
    return apiManager.post(`/api/suppliers/${supplierId}/gateways`, data);
  }

  /**
   * Update existing gateway configuration
   */
  static async updateGateway(
    supplierId: string,
    gatewayId: string,
    data: Partial<SupplierAPIGatewayFormData>
  ): Promise<ApiResponse<SupplierAPIGateway>> {
    return apiManager.put(`/api/suppliers/${supplierId}/gateways/${gatewayId}`, data);
  }

  /**
   * Delete API gateway configuration
   */
  static async deleteGateway(
    supplierId: string,
    gatewayId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiManager.delete(`/api/suppliers/${supplierId}/gateways/${gatewayId}`);
  }

  /**
   * Test API credentials validity
   */
  static async testCredentials(
    supplierId: string,
    gatewayId: string
  ): Promise<ApiResponse<CredentialValidation>> {
    return apiManager.post(
      `/api/suppliers/${supplierId}/gateways/${gatewayId}/test-credentials`,
      {}
    );
  }

  /**
   * Test a specific endpoint
   */
  static async testEndpoint(
    supplierId: string,
    gatewayId: string,
    endpointId: string,
    testData?: any
  ): Promise<ApiResponse<GatewayTestResponse>> {
    return apiManager.post(`/api/suppliers/${supplierId}/gateways/${gatewayId}/test-endpoint`, {
      endpointId,
      testData,
    });
  }

  /**
   * Run full gateway health check
   */
  static async testGateway(
    supplierId: string,
    gatewayId: string
  ): Promise<ApiResponse<GatewayHealthCheckResult>> {
    return apiManager.post(`/api/suppliers/${supplierId}/gateways/${gatewayId}/test`, {});
  }

  /**
   * Get all endpoints for a gateway
   */
  static async getGatewayEndpoints(
    supplierId: string,
    gatewayId: string,
    productId?: string
  ): Promise<ApiResponse<GatewayEndpointsResponse>> {
    const url = productId
      ? `/api/suppliers/${supplierId}/gateways/${gatewayId}/products/${productId}`
      : `/api/suppliers/${supplierId}/gateways/${gatewayId}/endpoints`;

    return apiManager.get(url);
  }

  /**
   * Add new endpoint to gateway
   */
  static async addGatewayEndpoint(
    supplierId: string,
    gatewayId: string,
    endpoint: Omit<APIEndpoint, 'id'>
  ): Promise<ApiResponse<APIEndpoint>> {
    return apiManager.post(
      `/api/suppliers/${supplierId}/gateways/${gatewayId}/endpoints`,
      endpoint
    );
  }

  /**
   * Update gateway endpoint
   */
  static async updateGatewayEndpoint(
    supplierId: string,
    gatewayId: string,
    endpointId: string,
    data: Partial<APIEndpoint>
  ): Promise<ApiResponse<APIEndpoint>> {
    return apiManager.put(
      `/api/suppliers/${supplierId}/gateways/${gatewayId}/endpoints/${endpointId}`,
      data
    );
  }

  /**
   * Delete gateway endpoint
   */
  static async deleteGatewayEndpoint(
    supplierId: string,
    gatewayId: string,
    endpointId: string
  ): Promise<ApiResponse<{ success: boolean }>> {
    return apiManager.delete(
      `/api/suppliers/${supplierId}/gateways/${gatewayId}/endpoints/${endpointId}`
    );
  }

  /**
   * Get gateway metrics (usage, performance, errors)
   */
  static async getGatewayMetrics(
    supplierId: string,
    gatewayId: string,
    period?: 'hour' | 'day' | 'week' | 'month'
  ): Promise<ApiResponse<GatewayMetrics>> {
    return apiManager.get(`/api/suppliers/${supplierId}/gateways/${gatewayId}/metrics`, {
      params: { period },
    });
  }

  /**
   * Get gateway health status
   */
  static async getGatewayHealth(
    supplierId: string,
    gatewayId: string
  ): Promise<ApiResponse<GatewayHealthCheckResult>> {
    return apiManager.get(`/api/suppliers/${supplierId}/gateways/${gatewayId}/health`);
  }

  /**
   * Get active alerts for gateway
   */
  static async getGatewayAlerts(
    supplierId: string,
    gatewayId: string
  ): Promise<ApiResponse<GatewayAlert[]>> {
    return apiManager.get(`/api/suppliers/${supplierId}/gateways/${gatewayId}/alerts`);
  }

  /**
   * Get product-specific gateway configuration
   */
  static async getProductGatewayConfig(
    supplierId: string,
    gatewayId: string,
    productId: string
  ): Promise<ApiResponse<any>> {
    return apiManager.get(
      `/api/suppliers/${supplierId}/gateways/${gatewayId}/products/${productId}`
    );
  }

  /**
   * Update product-specific endpoint mappings
   */
  static async updateProductGatewayConfig(
    supplierId: string,
    gatewayId: string,
    productId: string,
    config: any
  ): Promise<ApiResponse<any>> {
    return apiManager.put(
      `/api/suppliers/${supplierId}/gateways/${gatewayId}/products/${productId}`,
      config
    );
  }

  /**
   * Clear gateway cache
   */
  static async clearGatewayCache(supplierId?: string, gatewayId?: string): Promise<void> {
    const cacheKeysToInvalidate = [
      'gateways',
      'gateway-detail',
      'gateway-endpoints',
      'gateway-metrics',
      'gateway-health',
      'gateway-alerts',
      'product-gateway-config',
    ];

    cacheKeysToInvalidate.forEach(key => {
      apiManager.invalidateCache(key);
    });
  }
}

export default GatewayAPIService;
