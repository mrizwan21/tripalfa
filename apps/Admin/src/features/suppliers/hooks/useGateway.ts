// Custom hooks for API Gateway management
import { useCallback, useEffect, useState } from 'react';
import GatewayAPIService from '@/services/api-manager/GatewayAPIService';
import { ENVIRONMENT_CONFIGS } from '@/services/api-manager/types-gateway';

type Environment = 'development' | 'staging' | 'production';

type SupplierProduct = {
  name?: string;
  [key: string]: any;
};

type GatewayHealthCheckResult = Record<string, any>;
type GatewayMetrics = Record<string, any>;

type SupplierAPIGatewayFormData = {
  environments: any[];
  activeEnvironment: Environment;
  globalHeaders: any[];
  globalQueryParameters: any[];
  productConfigs: any[];
  geographyRoutings: any[];
  channelRoutings: any[];
  allowDevelopment: boolean;
  requireStagingApproval: boolean;
  requireProductionApproval: boolean;
  [key: string]: any;
};

type SupplierAPIGateway = {
  id?: string;
  activeEnvironment: Environment;
  environments: Record<string, any>;
  globalConfiguration: {
    globalHeaders: any[];
    globalQueryParameters: any[];
    productConfigs: any[];
    geographyRoutings: any[];
    channelRoutings: any[];
  };
  environmentManagement: {
    allowDevelopment: boolean;
    requireStagingApproval: boolean;
    requireProductionApproval: boolean;
  };
  [key: string]: any;
};

// ============================================================================
// HOOK: useEnvironmentConfig - Get configuration for selected environment
// ============================================================================

export const useEnvironmentConfig = (environment: Environment) => {
  const config = ENVIRONMENT_CONFIGS[environment];

  return {
    config,
    isProduction: config.isProduction,
    requiresSSL: config.requiresSSL,
    allowCORS: config.allowCORS,
    rateLimit: config.rateLimit,
    timeout: config.timeout,
    requiresApproval: environment === 'production',
    requiresMonitoring: config.requiresMonitoring,
  };
};

// ============================================================================
// HOOK: useGatewayTest - Test gateway configuration
// ============================================================================

export const useGatewayTest = (supplierId: string, gatewayId: string) => {
  const [testing, setTesting] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = useCallback(
    async (endpointId: string, testData?: any) => {
      setTesting(true);
      setError(null);

      try {
        const response = await GatewayAPIService.testEndpoint(
          supplierId,
          gatewayId,
          endpointId,
          testData
        );
        setResult(response.data);
        return response.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Test failed';
        setError(message);
        throw err;
      } finally {
        setTesting(false);
      }
    },
    [supplierId, gatewayId]
  );

  const testCredentials = useCallback(async () => {
    setTesting(true);
    setError(null);

    try {
      const response = await GatewayAPIService.testCredentials(supplierId, gatewayId);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Credential test failed';
      setError(message);
      throw err;
    } finally {
      setTesting(false);
    }
  }, [supplierId, gatewayId]);

  const testGateway = useCallback(async () => {
    setTesting(true);
    setError(null);

    try {
      const response = await GatewayAPIService.testGateway(supplierId, gatewayId);
      return response.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Health check failed';
      setError(message);
      throw err;
    } finally {
      setTesting(false);
    }
  }, [supplierId, gatewayId]);

  return {
    testing,
    result,
    error,
    testEndpoint,
    testCredentials,
    testGateway,
  };
};

// ============================================================================
// HOOK: useProductSchema - Get product-specific endpoint schema
// ============================================================================

export const useProductSchema = (product?: string | SupplierProduct) => {
  const [schema, setSchema] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!product) {
      setSchema(null);
      return;
    }

    // In real implementation, fetch from backend or use registry
    setLoading(true);

    // Simulated product schema
    const productSchemas: Record<string, any> = {
      hotel: {
        endpoints: [
          {
            method: 'GET',
            path: '/hotels/search',
            name: 'Search Hotels',
            requiredParams: ['checkIn', 'checkOut', 'city'],
          },
          {
            method: 'GET',
            path: '/hotels/{hotelId}',
            name: 'Get Hotel Detail',
            requiredParams: ['hotelId'],
          },
          {
            method: 'POST',
            path: '/bookings',
            name: 'Create Booking',
            requiredParams: ['hotelId', 'checkIn', 'checkOut'],
          },
        ],
        authTypes: ['api-key', 'oauth2'],
      },
      flight: {
        endpoints: [
          {
            method: 'GET',
            path: '/flights/search',
            name: 'Search Flights',
            requiredParams: ['departure', 'destination', 'departureDate'],
          },
          {
            method: 'POST',
            path: '/bookings',
            name: 'Book Flight',
            requiredParams: ['flightId', 'passengers'],
          },
        ],
        authTypes: ['oauth2', 'jwt'],
      },
    };

    const productKey =
      typeof product === 'string' ? product.toLowerCase() : product.name?.toLowerCase() || '';
    const productSchema = productSchemas[productKey] || {
      endpoints: [],
      authTypes: ['api-key'],
    };

    setSchema(productSchema);
    setLoading(false);
  }, [product]);

  return { schema, loading };
};

// ============================================================================
// UTILITY: Initialize form data from existing gateway
// ============================================================================

function initializeFormData(gateway?: SupplierAPIGateway): SupplierAPIGatewayFormData {
  if (!gateway) {
    return {
      environments: [],
      activeEnvironment: 'development',
      globalHeaders: [],
      globalQueryParameters: [],
      productConfigs: [],
      geographyRoutings: [],
      channelRoutings: [],
      allowDevelopment: true,
      requireStagingApproval: true,
      requireProductionApproval: true,
    };
  }

  return {
    environments: Object.entries(gateway.environments).map(([env, config]) => ({
      environment: env as Environment,
      isActive: config?.isActive || false,
      baseUrl: config?.baseUrl || '',
      apiVersion: config?.apiVersion,
      authenticationType: config?.authentication?.type || 'api-key',
      authenticationCredentials: config?.authentication?.credentials || {},
      headers: config?.headers || [],
      queryParameters: config?.queryParameters || [],
      endpoints: config?.endpoints || [],
      timeout: config?.settings?.timeout || 10000,
      maxRetries: config?.settings?.retryPolicy?.maxRetries || 3,
      rateLimit: config?.settings?.rateLimit,
      requiresSSL: config?.settings?.requiresSSL || true,
      monitoringEnabled: config?.monitoring?.enabled || false,
    })),
    activeEnvironment: gateway.activeEnvironment,
    globalHeaders: gateway.globalConfiguration.globalHeaders,
    globalQueryParameters: gateway.globalConfiguration.globalQueryParameters,
    productConfigs: gateway.globalConfiguration.productConfigs.map(pc => ({
      productId: pc.productId,
      endpoints: pc.endpoints,
    })),
    geographyRoutings: gateway.globalConfiguration.geographyRoutings,
    channelRoutings: gateway.globalConfiguration.channelRoutings,
    allowDevelopment: gateway.environmentManagement.allowDevelopment,
    requireStagingApproval: gateway.environmentManagement.requireStagingApproval,
    requireProductionApproval: gateway.environmentManagement.requireProductionApproval,
  };
}
