# Redis vs Neon Database for Real-time LITEAPI Data

## Recommendation: **Hybrid Approach - Redis for Cache, Neon for Persistence**

---

## Analysis

### LITEAPI Data Characteristics

| Data Type | Size | Lifespan | Access Pattern |
|-----------|------|----------|----------------|
| Hotel Search Results | 50-500KB per search | 15-30 minutes | High frequency reads |
| Room Rates | 10-100KB per hotel | 15-30 minutes | High frequency reads |
| Prebook Session | 5-20KB | 30-60 minutes | Single session |
| Booking Confirmation | 20-50KB | Permanent | Low frequency |
| Guest Loyalty Data | 5-10KB | Permanent | Medium frequency |

---

## Why Redis is Better for Real-time Hotel Data

### ✅ Advantages

1. **Speed**: Sub-millisecond reads vs 10-50ms for Neon
2. **TTL Support**: Auto-expire search results after 15-30 mins
3. **Lower Cost**: Don't pay for expensive writes to persistent storage
4. **Session Management**: Perfect for prebook/checkout sessions
5. **Rate Limiting**: Built-in support for API rate limiting
6. **No Schema Migration**: Flexible JSON storage

### ❌ Disadvantages

1. **Data Loss Risk**: If Redis crashes, data is lost
2. **Memory Cost**: RAM is more expensive than disk
3. **No Complex Queries**: Can't do JOINs or aggregations

---

## Why Neon is Better for Persistent Data

### ✅ Advantages

1. **ACID Compliance**: Guaranteed data integrity
2. **Complex Queries**: JOINs, aggregations, filtering
3. **Audit Trail**: Track all booking history
4. **Data Relationships**: Link bookings → users → payments
5. **Unlimited Storage**: No memory constraints
6. **Backup & Recovery**: Point-in-time recovery

### ❌ Disadvantages

1. **Slower Writes**: 10-50ms vs sub-ms for Redis
2. **Connection Limits**: Need connection pooling
3. **Cost per Write**: More expensive for high-volume writes

---

## Recommended Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        DATA FLOW ARCHITECTURE                        │
└─────────────────────────────────────────────────────────────────────┘

┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────▶│  API Gateway │────▶│   Booking    │
│  (React)     │◀────│   (Wicked)   │◀────│   Service    │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                   │
                    ┌──────────────────────────────┼──────────────────────────────┐
                    │                              │                              │
                    ▼                              ▼                              ▼
           ┌────────────────┐            ┌────────────────┐            ┌────────────────┐
           │     Redis      │            │     LITEAPI    │            │     Neon       │
           │   (Hot Cache)  │            │   (Supplier)   │            │  (Persistent)  │
           └────────────────┘            └────────────────┘            └────────────────┘
                    │                              │                              │
                    │                              │                              │
                    ▼                              ▼                              ▼
           ┌────────────────┐            ┌────────────────┐            ┌────────────────┐
           │ • Search Cache │            │ • Hotel Rates  │            │ • Bookings     │
           │ • Rate Cache   │            │ • Availability │            │ • Users        │
           │ • Prebook Data │            │ • Prebook API  │            │ • Payments     │
           │ • Sessions     │            │ • Book API     │            │ • Loyalty      │
           │ • Temp Data    │            │                │            │ • Audit Logs   │
           │                │            │                │            │                │
           │ TTL: 15-30 min │            │ Real-time API  │            │ Permanent      │
           └────────────────┘            └────────────────┘            └────────────────┘
```

---

## Implementation Strategy

### Tier 1: Redis (Cache Layer) - **RECOMMENDED FOR REAL-TIME DATA**

```typescript
// Cache Key Structure
const CACHE_KEYS = {
  hotelSearch: (params) => `hotel:search:${hash(params)}`,      // TTL: 15 min
  hotelRates: (hotelId, dates) => `hotel:rates:${hotelId}:${dates}`, // TTL: 30 min
  prebookSession: (sessionId) => `prebook:${sessionId}`,        // TTL: 60 min
  rateLock: (offerId) => `rate:lock:${offerId}`,               // TTL: 10 min
};
```

### Tier 2: Neon (Persistence Layer) - **FOR BOOKINGS & USER DATA**

```sql
-- Store only finalized bookings, not transient search data
INSERT INTO bookings (id, user_id, hotel_id, status, ...)
VALUES (...);

-- User profiles, loyalty points, payment history
-- All permanent data goes here
```

---

## Cost Comparison

| Scenario | Redis Only | Neon Only | Hybrid |
|----------|------------|-----------|--------|
| 1000 searches/hour | $5/mo | $25/mo | $10/mo |
| Storage for 1M searches | 500MB RAM | 50GB disk | 500MB RAM |
| Read latency | <1ms | 20-50ms | <1ms (cache hit) |
| Data persistence | ❌ Lost | ✅ Permanent | ✅ Selective |

---

## My Recommendation

### Use Redis for:
1. ✅ **Hotel search results** (TTL: 15 min)
2. ✅ **Room rate data** (TTL: 30 min)
3. ✅ **Prebook sessions** (TTL: 60 min)
4. ✅ **API response caching**
5. ✅ **Rate limiting counters**

### Use Neon for:
1. ✅ **Confirmed bookings**
2. ✅ **User profiles & auth**
3. ✅ **Payment transactions**
4. ✅ **Loyalty points balance**
5. ✅ **Audit logs & history**

---

## Implementation Plan

### Step 1: Add Redis to booking-service
```bash
pnpm add ioredis @types/ioredis
```

### Step 2: Create Redis cache service
```typescript
// services/booking-service/src/cache/redis.ts
import Redis from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

export const cacheService = {
  async getHotelSearch(params: SearchParams) {
    const key = `hotel:search:${hash(params)}`;
    const cached = await redis.get(key);
    if (cached) return JSON.parse(cached);
    
    const results = await liteApiSearch(params);
    await redis.setex(key, 900, JSON.stringify(results)); // 15 min TTL
    return results;
  }
};
```

### Step 3: Update frontend API to use cached endpoints
```typescript
// Frontend calls /api/hotels/search
// Backend checks Redis first, then LITEAPI, caches result
```

---

## Conclusion

**For real-time LITEAPI hotel data, Redis is the clear winner for:**
- Search results (temporary, high-frequency access)
- Room rates (short-lived, expensive to fetch)
- Prebook sessions (session-based, auto-expire)

**Use Neon for everything that needs to persist:**
- Confirmed bookings
- User data
- Payment history
- Loyalty points

This hybrid approach gives you the **speed of Redis** for real-time data and the **reliability of Neon** for permanent records.