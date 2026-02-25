# Integration Guide: Duffel Endpoints with Hybrid Caching via API Manager

This guide explains how the frontend (booking-engine) integrates with
* the Duffel API endpoints through the API Gateway's API Manager with
* hybrid Redis + NEON caching layer.
 */

// ============================================================================
// ARCHITECTURE OVERVIEW
// ============================================================================

/**

* Data Flow:
*
* Frontend (booking-engine)
*     ↓ HTTP Request via api.ts
* API Gateway (/api/flights/*)
*     ↓
* Cache Middleware (Redis check)
*     ↓ MISS
* Duffel API Routes (booking-service)
*     ↓
* Duffel API Request
*     ↓
* Response Processing (API Manager)
*     ↓
* Store in NEON (durable) + Redis (cache)
*     ↓
* Return to Frontend with cache metadata
*
*
* Next Request (CACHED):
*
* Frontend (booking-engine)
*     ↓
* API Gateway
*     ↓
* Cache Middleware (Redis HIT!)
*     ↓
* Return cached response immediately
*     ↓ 50-100ms latency
* Frontend receives data
 */

// ============================================================================
// ENVIRONMENT SETUP
// ============================================================================

/**

* Required environment variables:
*
* Backend (booking-service):
* * DUFFEL_API_URL=<https://api.duffel.com>
* * DUFFEL_API_KEY=REDACTED
* * DUFFEL_TEST_TOKEN=REDACTED
*
* Caching:
* * REDIS_URL=redis://localhost:6379
* * NEON_DATABASE_URL=postgresql://[user]:[password]@[host]/[database]
 */

// ============================================================================
// CACHE CONFIGURATION
// ============================================================================

/**

* Cache TTL (Time To Live) per endpoint:
*
* Offer Requests:  15 min (900s)  - Duffel expires offers after 24 hours
* Offers:          30 min (1800s) - Semi-static until offer expires
* Orders:          1 hour (3600s) - Relatively stable
* Seat Maps:       10 min (600s)  - Can change when flights update
* Available Svcs:  20 min (1200s) - May change with inventory
* Cancellations:   30 min (1800s) - Stable once created
* List Endpoints:  5 min (300s)   - May change frequently
 */

// ============================================================================
// ENDPOINT MAPPING & RESPONSE FORMAT
// ============================================================================

/**

* Offer Requests (Flight Search)
*
* POST /api/duffel/offer-requests
* Input: { slices, passengers, cabin_class }
* Output: APIManagerResponse<OfferRequest>
* Cache: Redis (15 min) + NEON
*
* {
* success: true,
* data: {
*     id: "off_req_...",
*     slices: [...],
*     passengers: [...],
*     offers: [...]
* },
* cached: false,
* source: "api",
* stats: { cacheTime: "900s" }
* }
 */

/**

* GET Offer Request
*
* GET /api/duffel/offer-requests/:id
* Cache Strategy: Redis FIRST → NEON SECOND
* Response includes _cache metadata
*
* {
* success: true,
* data: { ... },
* cached: true,
* source: "redis",
* cachedAt: "2026-02-22T10:30:00Z",
* expiresAt: "2026-02-22T10:45:00Z"
* }
 */

/**

* Orders (Bookings)
*
* POST /api/duffel/orders
* Input: { selected_offers, passengers, payments, contact, userId }
* Output: APIManagerResponse<Order>
* Cache: Redis (1 hr) + NEON
* Invalidation: On create, replaces cache
*
* {
* success: true,
* data: { id: "ord_...", status: "pending", ... },
* cached: false,
* source: "api",
* localId: "local-booking-id"
* }
 */

/**

* GET Order
*
* GET /api/duffel/orders/:id
* Cache Strategy: Redis FIRST → NEON SECOND
* Mutation Safety: Automatically invalidated on order updates
 */

/**

* Seat Maps
*
* GET /api/duffel/seat-maps?offer_id=...
* Cache: Redis (10 min)
* Response: Array of seat maps
* Use for seat selection UI
 */

/**

* Available Services (Ancillaries)
*
* GET /api/duffel/orders/:id/available-services
* Cache: Redis (20 min)
* Response: Baggage, meals, seats, etc.
* Invalidates after adding services
 */

// ============================================================================
// FRONTEND IMPLEMENTATION
// ============================================================================

/**

* Usage in React Components:
*
* // In duffelApiManager.ts (frontend)
*
* // 1. Search flights
* const response = await createOfferRequest({
* slices: [...],
* passengers: [...],
* cabin_class: 'economy'
* });
*
* // Response includes cache info
* console.log('From cache?', response.cached); // false (first request)
* console.log('Cache source:', response.source); // "api"
*
* // 2. Get same search again (CACHED)
* const cachedResponse = await getOfferRequest(requestId);
*
* // Response from Redis (instant)
* console.log('From cache?', cachedResponse.cached); // true
* console.log('Cache source:', cachedResponse.source); // "redis"
* console.log('Cached at:', cachedResponse.cachedAt);
 */

// ============================================================================
// CACHE INVALIDATION STRATEGY
// ============================================================================

/**

* Automatic Cache Invalidation:
*
* 1. POST /api/duffel/orders (create)
* → Invalidates: orders:list:*, user:orders:*
*
* 1. PATCH /api/duffel/orders/:id (update)
* → Invalidates: order:${id}, available-services:${id}
*
* 1. POST /api/duffel/order-services (add services)
* → Invalidates: available-services:${orderId}, order:${orderId}
*
* 1. POST /api/duffel/order-cancellations (cancel)
* → Invalidates: order:${orderId}, cancellations:list:*
*
* 1. POST /api/duffel/orders/:id/price (pricing)
* → Invalidates: available-services:${orderId}
 */

/**

* Manual Cache Controls (API Manager):
*
* // Clear specific order cache
* await OrderManager.invalidate(orderId);
*
* // Clear user's orders
* await CacheBulkOperations.invalidateUserData(userId);
*
* // Clear all offer caches
* await CacheBulkOperations.invalidateOffers();
*
* // Emergency: Clear entire Duffel cache
* await CacheBulkOperations.clearAll();
 */

// ============================================================================
// ERROR HANDLING & FALLBACKS
// ============================================================================

/**

* Cache Error Fallback Strategy:
*
* 1. Redis DOWN → Try NEON
* 1. NEON DOWN → Try Duffel API (fresh)
* 1. Duffel API DOWN → Return 500 with error
*
* This ensures service availability even with cache failures.
 */

/**

* Example Error Response:
*
* {
* success: false,
* error: "Duffel API Error (500): Service unavailable",
* cached: false,
* source: "api",
* fallback: "cached-data-unavailable"
* }
 */

// ============================================================================
// PERFORMANCE METRICS
// ============================================================================

/**

* Expected Response Times:
*
* First Request (no cache):
* * API Gateway: 5ms
* * Cache check (MISS): 2ms
* * Duffel API: 800-2000ms
* * NEON write: 50ms
* * Redis write: 10ms
* Total: ~1000-2100ms
*
* Second Request (cached in Redis):
* * API Gateway: 5ms
* * Cache check (HIT): 1ms
* * Return response: 1ms
* Total: ~7ms (99.7% improvement!)
*
* If Redis fails (NEON fallback):
* * API Gateway: 5ms
* * Cache check (MISS): 2ms
* * NEON read: 30-50ms
* * Return response: 1ms
* Total: ~40-60ms (still fast!)
 */

// ============================================================================
// MONITORING & DEBUGGING
// ============================================================================

/**

* Cache Statistics (from response):
*
* {
* _cache: {
*     cached: true/false,
*     source: "redis" | "neon" | "api",
*     ttl: 900,
*     cachedAt: "2026-02-22T10:30:00Z",
*     expiresAt: "2026-02-22T10:45:00Z"
* },
* _stats: {
*     duration: "47ms",
*     endpoint: "/api/duffel/offers/...",
*     method: "GET",
*     timestamp: "2026-02-22T10:30:00Z"
* }
* }
 */

/**

* Redis CLI Monitoring:
*

* # Connect to Redis

* redis-cli
*

* # Monitor cache hits

* MONITOR
*

* # View all Duffel cache keys

* KEYS duffel:*
*

* # Check specific key

* GET duffel:offer:off_123
*

* # View expiration

* TTL duffel:offer:off_123
*

* # Clear cache

* DEL duffel:*
 */

/**

* NEON Database Monitoring:
*

* # Query cached orders

* SELECT * FROM "DuffelOrder"
* WHERE "externalId" = 'ord_...'
*

* # Check cache hit rates

* SELECT COUNT(*) as total,
*        COUNT(CASE WHEN "cachedAt" > NOW() - INTERVAL '1 hour' 
*                   THEN 1 END) as recent_cache
* FROM "DuffelOrder"
 */

// ============================================================================
// BEST PRACTICES
// ============================================================================

/**

* ✅ DO:
* * Check response._cache.source before showing "loading" spinners
* * Use cached data for read-only operations
* * Implement UI states for "cache" vs "fresh API"
* * Monitor cache hit rates in analytics
*
* ❌ DON'T:
* * Force cache clear on every request
* * Bypass cache for debugging (use tools instead)
* * Store sensitive data in Redis
* * Rely on cache for real-time inventory (use WebSockets)
 */

// ============================================================================
// TESTING THE INTEGRATION
// ============================================================================

/**

* Test Script:
*
* // 1. First request (should be from API)
* const response1 = await api.post('/api/duffel/offer-requests', {
* slices: [...],
* passengers: [...]
* });
* console.assert(response1.cached === false, 'First request should not be cached');
* const requestId = response1.data.id;
*
* // 2. Second request (should be from Redis)
* const response2 = await api.get(`/api/duffel/offer-requests/${requestId}`);
* console.assert(response2.cached === true, 'Second request should be cached');
* console.assert(response2.source === 'redis', 'Should be from Redis');
*
* // 3. Check TTL
* const ttlSeconds = Math.floor(
* (new Date(response2.expiresAt) - new Date()) / 1000
* );
* console.assert(ttlSeconds <= 900, `TTL should be <= 900s, got ${ttlSeconds}s`);
 */

export default {};
