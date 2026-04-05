# Location & Timezone Detection Setup Guide

## Quick Start

This guide walks you through setting up timezone detection and IP geolocation features for the TripAlfa booking system.

**Time to complete**: ~15 minutes  
**Prerequisites**: Node.js, Redis, access to external APIs

---

## Step 1: Get API Keys

### IP Geolocation API (ipapi.co)

1. Go to https://ipapi.co
2. Click "Sign Up" → Create free account
3. Copy your API key from dashboard
4. **Free Tier**: 30,000 requests/month (~1 per second average)
5. **Pro Tier**: Available for higher volume

### Timezone API (timezonedb.com)

1. Go to https://timezonedb.com/account
2. Click "Sign Up" → Create free account
3. API key is generated automatically
4. **Free Tier**: 1 request/second, 50 requests/day
5. **Pro Tier**: Unlimited requests

---

## Step 2: Configure Environment Variables

Create or update `.env.local.private`:

```bash
# IP Geolocation (ipapi.co)
IPAPI_API_KEY="X0SV76DQEO00"

# Timezone Database (timezonedb.com)
TIMEZONEDB_API_KEY="X0SV76DQEO00"
VITE_TIMEZONEDB_API_KEY="X0SV76DQEO00"

# Redis (for caching)
REDIS_HOST=localhost
REDIS_PORT=6379
```

---

## Step 3: Ensure Redis is Running

Both services cache results in Redis to avoid redundant API calls.

**Check Redis status:**

```bash
redis-cli ping
# Should output: PONG
```

**If not running:**

```bash
# macOS with Homebrew
brew services start redis

# Docker
docker run -d -p 6379:6379 redis:7-alpine

# Manual
redis-server
```

---

## Step 4: Add Middleware to Booking Service

Edit `services/booking-service/src/index.ts`:

```typescript
import express from 'express';
import { createLocationMiddleware, injectLocationHeaders } from './middleware/location.middleware';

const app = express();

// ... other middleware ...

// Add location detection (runs for all requests)
app.use(
  createLocationMiddleware({
    includeTimezone: true,
    includeGeolocation: true,
    cache: true,
    cacheDuration: 3600, // 1 hour
    skipIps: ['127.0.0.1', '::1'], // Skip localhost
  })
);

// Optional: Add location headers to responses (for debugging)
app.use(injectLocationHeaders);

// ... rest of app ...
```

---

## Step 5: Use Location Data in Controllers

### Example: Get User's Timezone

```typescript
import { Router, Request, Response } from 'express';
import TimezoneService from '../lib/timezone';

const router = Router();
const timezoneService = new TimezoneService();

router.get('/api/user/timezone', (req: Request, res: Response) => {
  if (!req.userTimezone) {
    return res.status(400).json({ error: 'Could not detect timezone' });
  }

  const currentTime = timezoneService.getCurrentTimeInTimezone(req.userTimezone.zone);

  res.json({
    timezone: req.userTimezone.zone,
    abbreviation: req.userTimezone.abbreviation,
    utc_offset: req.userTimezone.offset,
    current_time: currentTime.formatted,
    is_dst: req.userTimezone.isDst,
  });
});

export default router;
```

### Example: Get User's Location

```typescript
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/api/user/location', (req: Request, res: Response) => {
  if (!req.userLocation) {
    return res.status(400).json({ error: 'Could not detect location' });
  }

  res.json({
    city: req.userLocation.city,
    region: req.userLocation.region,
    country: req.userLocation.country,
    country_code: req.userLocation.countryCode,
    latitude: req.userLocation.latitude,
    longitude: req.userLocation.longitude,
    currency: req.userLocation.currency,
    languages: req.userLocation.languages,
    flag: req.userLocation.flag,
  });
});

export default router;
```

### Example: Personalized Flight Booking

```typescript
import { Router, Request, Response } from 'express';
import TimezoneService from '../lib/timezone';
import GeolocationService from '../lib/geolocation';

const router = Router();
const timezoneService = new TimezoneService();
const geolocationService = new GeolocationService();

router.get('/api/flights/quote', async (req: Request, res: Response) => {
  const { from, to } = req.query;

  if (!req.userLocation || !req.userTimezone) {
    return res.status(400).json({ error: 'Location data unavailable' });
  }

  // Mock flight data
  const flight = {
    id: 'FL123',
    airline: 'United',
    departure_utc: new Date('2026-04-01T14:00:00Z'),
    arrival_utc: new Date('2026-04-01T22:00:00Z'),
    price_usd: 450,
  };

  // Convert times to user's timezone
  const departureLocal = timezoneService.convertTime(
    flight.departure_utc,
    'UTC',
    req.userTimezone.zone
  );

  const arrivalLocal = timezoneService.convertTime(
    flight.arrival_utc,
    'UTC',
    req.userTimezone.zone
  );

  res.json({
    flight_id: flight.id,
    airline: flight.airline,
    departure_utc: flight.departure_utc.toISOString(),
    departure_local: departureLocal.date.toISOString(),
    departure_timezone: req.userTimezone.zone,
    arrival_utc: flight.arrival_utc.toISOString(),
    arrival_local: arrivalLocal.date.toISOString(),
    arrival_timezone: req.userTimezone.zone,
    price: flight.price_usd,
    currency: req.userLocation.currency,
    user_location: {
      city: req.userLocation.city,
      country: req.userLocation.country,
    },
  });
});

export default router;
```

---

## Step 6: Testing

### Test Location Detection

```bash
curl -X GET http://localhost:3001/api/user/location \
  -H "X-Forwarded-For: 1.1.1.1"

# Response:
# {
#   "city": "Los Angeles",
#   "region": "California",
#   "country": "United States",
#   "country_code": "US",
#   "latitude": 34.0522,
#   "longitude": -118.2437,
#   "currency": "USD",
#   "languages": ["en"]
# }
```

### Test Timezone Detection

```bash
curl -X GET http://localhost:3001/api/user/timezone \
  -H "X-Forwarded-For: 1.1.1.1"

# Response:
# {
#   "timezone": "America/Los_Angeles",
#   "abbreviation": "PDT",
#   "utc_offset": -420,
#   "current_time": "2026-03-17 10:30:00",
#   "is_dst": true
# }
```

### Test with Different IPs

```bash
# London
curl -X GET http://localhost:3001/api/user/location \
  -H "X-Forwarded-For: 8.8.8.8,193.139.30.1"

# Tokyo
curl -X GET http://localhost:3001/api/user/location \
  -H "X-Forwarded-For: 202.32.163.0"
```

---

## Step 7: Monitor API Usage

### IPapi.co Usage

1. Go to https://ipapi.co/account
2. Check "Recent Requests" tab
3. Monitor usage against your plan limits

### TimeZoneDB Usage

1. Go to https://timezonedb.com/account
2. View "API Calls Statistics"
3. Check daily request count

---

## Step 8: Configure Rate Limits (Optional)

If you hit rate limits, implement request queuing:

```typescript
import pLimit from 'p-limit';

// Limit to 1 request per second for TimeZoneDB
const limit = pLimit(1);

class RateLimitedTimezoneService extends TimezoneService {
  async getTimezoneByIp(ip: string) {
    return limit(() => super.getTimezoneByIp(ip));
  }
}
```

---

## Troubleshooting

### Issue: "API key not configured" warning

**Solution**: Ensure `.env` file contains API keys:

```bash
grep -E "TIMEZONEDB_API_KEY|IPAPI_API_KEY" .env
```

If missing, add them and restart the service.

### Issue: Redis connection error

**Solution**: Check Redis is running:

```bash
redis-cli ping
# Should output: PONG

# If not, start Redis:
redis-server
```

### Issue: API returns 403 Unauthorized

**Solution**:

1. Verify API key is correct
2. Check if you've exceeded rate limits
3. Switch to a new API key
4. Upgrade to paid plan if needed

### Issue: Location/timezone data is NULL

This can happen legitimately for:

- Localhost IPs (127.0.0.1, ::1)
- VPN/Proxy connections
- Requests from blocked/suspicious IPs

**Handling in code:**

```typescript
if (!req.userLocation) {
  // Use defaults or ask user to provide location
  req.userLocation = { city: 'Unknown', country: 'US', ... };
}
```

### Issue: Inconsistent results between APIs

TimeZoneDB and IPapi.co may return slightly different timezone names (e.g., `US/Pacific` vs `America/Los_Angeles`). Both are valid. Normalize if needed:

```typescript
function normalizeTimezone(tz: string): string {
  const aliases: Record<string, string> = {
    'US/Pacific': 'America/Los_Angeles',
    'US/Eastern': 'America/New_York',
    // ... etc
  };
  return aliases[tz] || tz;
}
```

---

## Complete API Reference

### GeolocationService

```typescript
// Initialize
const geolocationService = new GeolocationService();

// Get location by IP
const location = await geolocationService.getLocationByIp('1.1.1.1');

// Get distance between two locations
const distance = geolocationService.getDistanceBetweenCoordinates(
  40.7128,
  -74.006, // NYC
  34.0522,
  -118.2437 // LA
);
// Returns: 3944.53 km

// Check if two locations are nearby
const nearby = geolocationService.isLocationNearby(location1, location2, 100); // 100km radius

// Get travel time estimates
const travel = geolocationService.estimateTravelDistance(location1, location2);
// Returns: { kilometers, miles, hours_by_flight, hours_by_car }

// Health check
const isHealthy = await geolocationService.healthCheck();

// Clear cache
await geolocationService.clearCache('1.1.1.1');
```

### TimezoneService

```typescript
// Initialize
const timezoneService = new TimezoneService();

// Get timezone by IP
const tz = await timezoneService.getTimezoneByIp('1.1.1.1');

// Get timezone by coordinates
const tz = await timezoneService.getTimezoneByCoordinates(40.7128, -74.006);

// Get timezone by city
const tz = await timezoneService.getTimezoneByCity('New York', 'US');

// Convert time between timezones
const converted = timezoneService.convertTime(new Date(), 'UTC', 'America/New_York');

// Get current time in timezone
const now = timezoneService.getCurrentTimeInTimezone('Asia/Tokyo');

// Get offset between timezones
const offset = timezoneService.getTimezoneOffset('America/New_York', 'Europe/London');

// Health check
const isHealthy = await timezoneService.healthCheck();
```

### Middleware

```typescript
// Full middleware
import { createLocationMiddleware } from './middleware/location.middleware';

app.use(
  createLocationMiddleware({
    cache: true,
    cacheDuration: 3600,
    skipIps: ['127.0.0.1'],
    includeTimezone: true,
    includeGeolocation: true,
  })
);

// Require location (throws 400 if missing)
import { requireLocationMiddleware } from './middleware/location.middleware';
app.get('/api/protected', requireLocationMiddleware, (req, res) => {
  // req.userLocation is guaranteed here
});

// Require timezone (throws 400 if missing)
import { requireTimezoneMiddleware } from './middleware/location.middleware';
```

---

## Next Steps

1. **Implement location-based pricing**
   - See: [SERVICE_INTEGRATION_GUIDE.md](SERVICE_INTEGRATION_GUIDE.md#personalized-pricing-based-on-user-location)

2. **Add location-aware hotel recommendations**
   - Use `geolocationService.isLocationNearby()` to suggest nearby hotels

3. **Display all times in user's timezone**
   - Use `timezoneService.convertTime()` in flight/hotel confirmations

4. **Monitor API usage**
   - Set up alerts for approaching rate limits
   - Upgrade plans when needed

5. **Implement fallbacks for API outages**
   - Cache results more aggressively
   - Use geoDB library as fallback for coordinates
   - Default to UTC if timezone detection fails

---

## API Costs & Limits

| Service        | Free Tier         | Cost               |
| -------------- | ----------------- | ------------------ |
| **ipapi.co**   | 30k req/month     | $19/month for 500k |
| **TimeZoneDB** | 1 req/sec, 50/day | $9/month for pro   |

**Estimate for TripAlfa**:

- 1M bookings/month
- 1 location check per user → ~1M ipapi requests
- 1 timezone check per user → ~1M TimeZoneDB requests
- **Monthly cost**: ~$28 (1M ipapi + 1M TimeZoneDB at pro rates)

---

## Production Checklist

- [ ] API keys stored in `.env.local.private` (never in code)
- [ ] Redis configured and backed up
- [ ] Rate limiting implemented
- [ ] Error handling covers API downtime
- [ ] Caching configured (7 days geolocation, 1 day timezone)
- [ ] Monitoring/alerting set up for failed API calls
- [ ] Fallback behavior tested
- [ ] Location data logged for analytics (privacy compliant)
- [ ] GDPR/privacy policy updated for location tracking
- [ ] User consent obtained for location tracking
