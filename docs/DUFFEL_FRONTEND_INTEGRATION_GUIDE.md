/**

* FRONTEND INTEGRATION QUICK START
* ================================
*
* How to integrate Duffel endpoints via the API Manager with hybrid caching
* in your booking-engine React application
 */

// ============================================================================
// 1. UPDATE API.TS IMPORTS
// ============================================================================

/**

* File: apps/booking-engine/src/lib/api.ts
*
* The hybrid caching happens automatically via the API Gateway.
* Your frontend code doesn't need to change significantly.
*
* Just ensure your base URL routes to the API Gateway:
*
* const api = axios.create({
* baseURL: process.env.REACT_APP_API_URL || '<http://localhost:3000>',
* headers: {
*     'Content-Type': 'application/json',
* },
* });
 */

// ============================================================================
// 2. HANDLE CACHE METADATA IN RESPONSES
// ============================================================================

/**

* Now responses include cache metadata.
* Update your components to display this info:
*
* interface APIResponse<T> {
* success: boolean;
* data: T;
* cached: boolean;
* source: 'redis' | 'neon' | 'api';
* cachedAt?: string;
* expiresAt?: string;
* _cache?: {
*     cached: boolean;
*     source: string;
*     ttl: number;
* };
* _stats?: {
*     duration: string;
*     endpoint: string;
* };
* }
 */

// ============================================================================
// 3. UPDATE DUFFEL API MANAGER
// ============================================================================

/**

* File: apps/booking-engine/src/services/duffelApiManager.ts
*
* Example updated helper function:
 */

import { api } from '../lib/api';

export async function getOfferRequest(id: string) {
  try {
    const response = await api.get(`/api/flights/offer-requests/${id}`);

    // Now response includes cache metadata
    console.log('Response from cache?', response.data.cached);
    console.log('Cache source:', response.data.source);
    console.log('Cache expires:', response.data.expiresAt);
    
    return response.data;
  } catch (error) {
    console.error('[Duffel API Manager] Error fetching offer request:', error);
    throw error;
  }
}

export async function createOfferRequest(params: any) {
  try {
    const response = await api.post(`/api/flights/offer-requests`, {
      slices: params.slices,
      passengers: params.passengers,
      cabin_class: params.cabin_class || 'economy',
    });

    // First request from API
    console.log('New search (not cached):', response.data.cached === false);
    
    return response.data;
  } catch (error) {
    console.error('[Duffel API Manager] Error creating offer request:', error);
    throw error;
  }
}

export async function getOrder(orderId: string) {
  try {
    const response = await api.get(`/api/flights/orders/${orderId}`);

    // Check if this came from cache
    if (response.data.cached) {
      console.log('✅ Order loaded from cache (fast!)');
    } else {
      console.log('📡 Order loaded from API');
    }
    
    return response.data;
  } catch (error) {
    console.error('[Duffel API Manager] Error fetching order:', error);
    throw error;
  }
}

// ============================================================================
// 4. DISPLAY CACHE STATUS IN UI
// ============================================================================

/**

* Create a cache status indicator component:
 */

/* markdownlint-disable MD033 */
export function CacheIndicator({ response }: { response: any }) {
  if (!response._cache) return null;

  return (
    <div style={{
      padding: '8px 12px',
      fontSize: '12px',
      background: response.cached ? '#e8f5e9' : '#f5f5f5',
      borderLeft: `3px solid ${response.cached ? '#4caf50' : '#999'}`,
      marginBottom: '10px'
    }}>
      {response.cached ? (
        <>
          ✅ <strong>From Cache</strong> ({response.source}) -
          Expires in {Math.round((new Date(response.expiresAt).getTime() - Date.now()) / 1000)}s
        </>
      ) : (
        <>
          📡 <strong>Fresh Data</strong> - Response time: {response._stats?.duration}
        </>
      )}
    </div>
  );
}

// ============================================================================
// 5. EXAMPLE: FLIGHT SEARCH COMPONENT
// ============================================================================

/**

* Example React component using cached endpoints:
 */

import React, { useState, useEffect } from 'react';

interface FlightSearchProps {
  onSearchComplete?: (results: any) => void;
}

export const FlightSearch: React.FC&lt;FlightSearchProps&gt; = ({ onSearchComplete }) => {
  const [searchParams, setSearchParams] = useState<any>(null);
  const [offerRequestId, setOfferRequestId] = useState<string | null>(null);
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [cacheStatus, setCacheStatus] = useState<any>(null);

  const handleSearch = async (params: any) => {
    setLoading(true);
    setSearchParams(params);

    try {
      // First request: Create offer request
      const createResponse = await createOfferRequest(params);
      
      setCacheStatus({
        cached: createResponse.cached,
        source: createResponse.source,
        message: createResponse.cached 
          ? 'Loaded from cache (fast!)' 
          : 'Fresh search results'
      });

      setOfferRequestId(createResponse.data.id);
      setResults(createResponse.data);
      onSearchComplete?.(createResponse.data);

    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    if (!offerRequestId) return;

    setLoading(true);
    try {
      // Second request: Get same offer (likely cached!)
      const response = await getOfferRequest(offerRequestId);
      
      setCacheStatus({
        cached: response.cached,
        source: response.source,
        message: response.cached 
          ? '⚡ Lightning fast from cache!' 
          : 'Refreshed from API'
      });

      setResults(response.data);

    } catch (error) {
      console.error('Refresh failed:', error);
    } finally {
      setLoading(false);
    }
  };

  {/* markdownlint-disable MD033 */}
  return (
    <div className="flight-search">
      <h2>Flight Search</h2>

      {cacheStatus && (
        <CacheIndicator response={cacheStatus} />
      )}

      {loading && <p>Loading...</p>}

      {results && (
        <div>
          <p>Found {results.data?.offers?.length || 0} flights</p>
          <button onClick={handleRefresh}>
            Refresh Results {cacheStatus?.cached && '⚡'}
          </button>
        </div>
      )}

      <button onClick={() => handleSearch(searchParams)}>
        Search Flights
      </button>
    </div>
  );
};

// ============================================================================
// 6. MONITOR CACHE EFFECTIVENESS
// ============================================================================

/**

* Track cache hit rates in your app:
 */

interface CacheMetrics {
  totalRequests: number;
  cachedRequests: number;
  apiRequests: number;
  totalTimeSaved: number; // in ms
}

class CacheMonitor {
  metrics: CacheMetrics = {
    totalRequests: 0,
    cachedRequests: 0,
    apiRequests: 0,
    totalTimeSaved: 0
  };

  trackResponse(response: any) {
    this.metrics.totalRequests++;

    if (response.cached) {
      this.metrics.cachedRequests++;
      // Estimate 2 seconds saved per cached request
      this.metrics.totalTimeSaved += 2000;
    } else {
      this.metrics.apiRequests++;
    }
  }

  getStats() {
    const hitRate = (
      this.metrics.cachedRequests / this.metrics.totalRequests * 100
    ).toFixed(1);

    return {
      hitRate: `${hitRate}%`,
      cached: this.metrics.cachedRequests,
      fresh: this.metrics.apiRequests,
      timeSaved: `${(this.metrics.totalTimeSaved / 1000).toFixed(1)}s`
    };
  }
}

const monitor = new CacheMonitor();

// Use in your API response handler:
export function trackCacheResponse(response: any) {
  monitor.trackResponse(response);
  console.log('Cache stats:', monitor.getStats());
}

// ============================================================================
// 7. ERROR HANDLING WITH CACHE FALLBACK
// ============================================================================

/**

* Enhanced error handling that uses cached data if API fails:
 */

export async function getOrderWithFallback(orderId: string) {
  try {
    const response = await api.get(`/api/flights/orders/${orderId}`);
    return response.data;
  } catch (error: any) {
    // If API error and we can get from cache
    if (error.response?.status >= 500) {
      console.warn('API error, attempting to use cached data...');

      try {
        // Since cache middleware is automatic, this will hitting cache if available
        const cachedResponse = await api.get(`/api/flights/orders/${orderId}`, {
          params: { useCache: 'force' } // Backend can support this
        });
        
        if (cachedResponse.data.cached) {
          console.log('⚠️ Using stale cached data due to API error');
          return cachedResponse.data;
        }
      } catch {
        // Even cache failed, throw original error
        throw error;
      }
    }
    
    throw error;
  }
}

// ========================================================================
// 8. BEST PRACTICES FOR YOUR COMPONENTS
// ========================================================================

/**

* ✅ DO:
*
* 1. Display cache status to users
* → Shows transparency
* → Users appreciate fast cached responses
*
* 1. Use cache metadata for analytics
* → Track performance
* → Identify slow endpoints
*
* 1. Let middleware handle cache
* → Don't re-implement caching logic
* → Focus on UI/UX
*
* 1. Test with cache disabled
* → Verify API still works
* → Use Redis CLI: FLUSH
*
* ❌ DON'T:
*
* 1. Force cache clear on every request
* → Defeats the purpose of caching
* → Kills performance
*
* 1. Assume data is always fresh
* → Cached offers last 30 minutes
* → May not reflect real-time inventory
*
* 1. Bypass the API Gateway
* → Cache only works through gateway
* → Direct backend calls skip caching
 */

// ============================================================================
// 9. TESTING THE INTEGRATION
// ============================================================================

/**

* Manual testing steps:
*
* 1. First search:
* * Note response time: ~2500ms
* * Check: response.cached === false
* * Check: response.source === 'api'
*
* 1. Same search again:
* * Note response time: ~47ms (50x faster!)
* * Check: response.cached === true
* * Check: response.source === 'redis'
*
* 1. After 15 minutes:
* * Cache expires for offer requests
* * Next search hits API again
*
* 1. Create order:
* * Check: orders:list cache invalidated
* * List orders shows fresh data
 */

/**

* Automated testing:
 */

describe('Duffel API with Hybrid Caching', () => {
  it('should cache offer requests', async () => {
    const params = {
      slices: [/*... */],
      passengers: [/* ...*/]
    };

    // First request
    const first = await createOfferRequest(params);
    expect(first.cached).toBe(false);
    expect(first.source).toBe('api');
    const firstTime = Date.now();

    // Second request (same ID)
    const second = await getOfferRequest(first.data.id);
    const secondTime = Date.now();

    expect(second.cached).toBe(true);
    expect(second.source).toBe('redis');
    expect(secondTime - firstTime).toBeLessThan(100);
  });

  it('should invalidate order cache on creation', async () => {
    const orderParams = { /*...*/ };

    // Create order
    const created = await createFlightOrder(orderParams);
    expect(created.cached).toBe(false);

    // List orders (should be fresh, not cached)
    const list = await listFlightOrders();
    expect(list.data).toContainEqual(
      expect.objectContaining({ id: created.data.id })
    );
  });
});

// ============================================================================
// 10. DEPLOYMENT CHECKLIST
// ============================================================================

export const DEPLOYMENT_CHECKLIST = [
  '✅ Redis configured and running',
  '✅ NEON database connected',
  '✅ Duffel API key set',
  '✅ Environment variables updated',
  '✅ API gateway routing verified',
  '✅ Cache middleware enabled',
  '✅ Frontend handles cache metadata',
  '✅ Cache indicators display in UI',
  '✅ Error handling with fallbacks',
  '✅ Analytics tracking cache hits',
  '✅ Load tests show improvement',
  '✅ Monitoring alerts set up'
];

export default {};
