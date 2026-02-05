/**
 * Centralized supplier data for B2B admin
 */

// Types are defined locally below

// Supplier data structure
export interface Supplier {
    id: string;
    code: string;
    name: string;
    type: 'GDS' | 'DIRECT_API' | 'LOCAL';
    category: 'MULTI_SERVICE' | 'AIRLINE' | 'HOTEL' | 'TRANSFER';
    status: 'ACTIVE' | 'INACTIVE';
    isPreferred: boolean;
    priority: number;
    services: string[];
    health: 'HEALTHY' | 'DEGRADED' | 'OFFLINE';
}

// API Vendor data structure
export interface ApiVendor {
    id: string;
    name: string;
    type: 'GDS' | 'AGGREGATOR' | 'DIRECT';
    status: 'ACTIVE' | 'INACTIVE';
    healthStatus: 'HEALTHY' | 'DEGRADED';
    lastHealthCheck: string;
    endpoint: string;
    auth: 'OAUTH2' | 'BEARER' | 'API_KEY';
}

// Contract data structure
export interface Contract {
    id: string;
    supplier: string;
    ref: string;
    type: 'PREFERRED' | 'NET_RATE' | 'STANDARD';
    status: 'ACTIVE' | 'EXPIRED';
    creditLimit: number;
    currency: string;
    startDate: string;
    endDate: string;
}

// Centralized mock suppliers data
export const MOCK_SUPPLIERS: Supplier[] = [
    {
        id: '1',
        code: 'AMD',
        name: 'Amadeus GDS',
        type: 'GDS',
        category: 'MULTI_SERVICE',
        status: 'ACTIVE',
        isPreferred: true,
        priority: 1,
        services: ['Flights', 'Hotels', 'Cars'],
        health: 'HEALTHY'
    },
    {
        id: '2',
        code: 'DUF',
        name: 'Duffel API',
        type: 'DIRECT_API',
        category: 'AIRLINE',
        status: 'ACTIVE',
        isPreferred: true,
        priority: 2,
        services: ['Flights'],
        health: 'HEALTHY'
    },
    {
        id: '3',
        code: 'LAPI',
        name: 'LiteAPI Hotels',
        type: 'DIRECT_API',
        category: 'HOTEL',
        status: 'ACTIVE',
        isPreferred: false,
        priority: 3,
        services: ['Hotels'],
        health: 'DEGRADED'
    },
    {
        id: '4',
        code: 'LX-DXB',
        name: 'Local Express Dubai',
        type: 'LOCAL',
        category: 'TRANSFER',
        status: 'INACTIVE',
        isPreferred: false,
        priority: 10,
        services: ['Transfers'],
        health: 'OFFLINE'
    }
];

// Centralized mock API vendors data
export const MOCK_VENDORS: ApiVendor[] = [
    {
        id: '1',
        name: 'Amadeus Enterprise',
        type: 'GDS',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:15:00Z',
        endpoint: 'https://api.amadeus.com/v2',
        auth: 'OAUTH2'
    },
    {
        id: '2',
        name: 'Duffel Aviation',
        type: 'AGGREGATOR',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        lastHealthCheck: '2024-03-28T11:22:00Z',
        endpoint: 'https://api.duffel.com',
        auth: 'BEARER'
    },
    {
        id: '3',
        name: 'LiteAPI Global',
        type: 'DIRECT',
        status: 'ACTIVE',
        healthStatus: 'DEGRADED',
        lastHealthCheck: '2024-03-28T11:20:00Z',
        endpoint: 'https://lite.api.travel/v1',
        auth: 'API_KEY'
    }
];

// Centralized mock contracts data
export const MOCK_CONTRACTS: Contract[] = [
    {
        id: '1',
        supplier: 'Amadeus GDS',
        ref: 'CT-AMD-2024-01',
        type: 'PREFERRED',
        status: 'ACTIVE',
        creditLimit: 500000,
        currency: 'USD',
        startDate: '2024-01-01',
        endDate: '2025-12-31'
    },
    {
        id: '2',
        supplier: 'Duffel API',
        ref: 'API-DUF-982',
        type: 'NET_RATE',
        status: 'ACTIVE',
        creditLimit: 0,
        currency: 'USD',
        startDate: '2023-06-15',
        endDate: '2024-06-14'
    },
    {
        id: '3',
        supplier: 'Local Express Dubai',
        ref: 'LCL-DXB-0013',
        type: 'STANDARD',
        status: 'EXPIRED',
        creditLimit: 10000,
        currency: 'AED',
        startDate: '2023-01-01',
        endDate: '2023-12-31'
    }
];

// Export for convenience
export const getMockSuppliers = (): Supplier[] => MOCK_SUPPLIERS;
export const getMockVendors = (): ApiVendor[] => MOCK_VENDORS;
export const getMockContracts = (): Contract[] => MOCK_CONTRACTS;