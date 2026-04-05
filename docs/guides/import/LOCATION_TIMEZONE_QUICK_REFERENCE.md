# Location & Timezone Integration - Quick Reference Card

## ⚡ TL;DR Setup (5 minutes)

```bash
# 1. Add to .env.local.private
IPAPI_API_KEY="X0SV76DQEO00"
TIMEZONEDB_API_KEY="X0SV76DQEO00"
REDIS_HOST=localhost
REDIS_PORT=6379

# 2. Start Redis (if not running)
redis-server

# 3. Add middleware to services/booking-service/src/index.ts
import { createLocationMiddleware } from './middleware/location.middleware';
app.use(createLocationMiddleware());

# 4. Use in controllers
if (req.userLocation && req.userTimezone) {
  // req.userLocation.city, .country, .currency, .latitude, .longitude
  // req.userTimezone.zone, .abbreviation, .offset
}
```

---

## 📍 Get User Location

```typescript
// Automatically injected by middleware into every request:
req.userLocation = {
  ip: '1.1.1.1',
  city: 'Los Angeles',
  region: 'California',
  country: 'United States',
  countryCode: 'US',
  latitude: 34.0522,
  longitude: -118.2437,
  timezone: 'America/Los_Angeles',
  currency: 'USD',
  languages: ['en'],
  flag: '🇺🇸',
  fetchedAt: Date,
  isVpn: false,
};
```

## 🕐 Get User Timezone

```typescript
// Automatically injected by middleware into every request:
req.userTimezone = {
  zone: 'America/Los_Angeles',
  abbreviation: 'PDT',
  offset: -420, // minutes from UTC
  isDst: true,
  fetchedAt: Date,
  source: 'ip',
};
```

---

## 💻 Code Snippets

### Convert Time to User's Timezone

```typescript
const timezoneService = new TimezoneService();

const localTime = timezoneService.convertTime(
  new Date('2026-04-01T14:00:00Z'), // UTC time
  'UTC',
  req.userTimezone!.zone // "America/Los_Angeles"
);

console.log(localTime.date); // 2026-04-01 07:00:00 (PDT)
```

### Get Distance Between Locations

```typescript
const geolocationService = new GeolocationService();

const distanceKm = geolocationService.getDistanceBetweenCoordinates(
  40.7128,
  -74.006, // NYC
  34.0522,
  -118.2437 // LA
);

console.log(distanceKm); // 3944.53 km
```

### Apply Location-Based Pricing

```typescript
const basePrice = 450;
const regionalMultipliers = {
  US: 1.0,
  IN: 0.75, // 25% discount
  BR: 0.85, // 15% discount
};

const finalPrice = basePrice * (regionalMultipliers[req.userLocation!.countryCode] || 1.0);
```

### Get Current Time in User's Timezone

```typescript
const timezoneService = new TimezoneService();

const currentTime = timezoneService.getCurrentTimeInTimezone(req.userTimezone!.zone);

console.log(currentTime.formatted);
// "2026-03-17 10:30:00"
```

---

## 📊 Service Methods

### GeolocationService

```typescript
const geo = new GeolocationService();

// Get location by IP
const location = await geo.getLocationByIp('1.1.1.1');

// Distance between two points (km)
const km = geo.getDistanceBetweenCoordinates(lat1, lon1, lat2, lon2);

// Check if nearby (within radius)
const near = geo.isLocationNearby(location1, location2, 50); // 50km

// Travel distance estimates
const travel = geo.estimateTravelDistance(location1, location2);
// { kilometers, miles, hours_by_flight, hours_by_car }

// Health check
const healthy = await geo.healthCheck();

// Clear cache
await geo.clearCache('1.1.1.1');
```

### TimezoneService

```typescript
const tz = new TimezoneService();

// Get timezone by IP
const tzInfo = await tz.getTimezoneByIp('1.1.1.1');

// Get timezone by coordinates
const tzInfo = await tz.getTimezoneByCoordinates(40.7128, -74.006);

// Get timezone by city
const tzInfo = await tz.getTimezoneByCity('New York', 'US');

// Convert time
const converted = tz.convertTime(date, 'UTC', 'America/New_York');

// Current time in timezone
const now = tz.getCurrentTimeInTimezone('Asia/Tokyo');

// Timezone offset difference
const offset = tz.getTimezoneOffset('UTC', 'America/New_York'); // 300

// Health check
const healthy = await tz.healthCheck();
```

---

## 🛠️ Middleware Options

```typescript
app.use(
  createLocationMiddleware({
    cache: true, // Enable Redis caching
    cacheDuration: 3600, // Cache for 1 hour
    skipIps: ['127.0.0.1'], // Don't detect for localhost
    includeTimezone: true, // Get timezone
    includeGeolocation: true, // Get geolocation
  })
);
```

---

## ❌ Error Handling

```typescript
// If location detection fails, fields will be undefined
if (!req.userLocation) {
  // Fallback behavior
  req.userLocation = {
    city: 'Unknown',
    country: 'US',
    currency: 'USD',
    // ... other defaults
  };
}

if (!req.userTimezone) {
  // Fallback behavior
  req.userTimezone = {
    zone: 'UTC',
    abbreviation: 'UTC',
    offset: 0,
    // ... other defaults
  };
}
```

---

## 🔍 Testing

```bash
# Test from India
curl -H "X-Forwarded-For: 1.1.1.1" \
  http://localhost:3001/api/user/location

# Test from US
curl -H "X-Forwarded-For: 8.8.8.8" \
  http://localhost:3001/api/user/timezone

# Test from Asia
curl -H "X-Forwarded-For: 202.32.163.0" \
  http://localhost:3001/api/user/location
```

---

## 📈 API Rate Limits

| Service        | Free      | Status          | Action             |
| -------------- | --------- | --------------- | ------------------ |
| **ipapi.co**   | 30k/month | ⚠️ Limited      | Cache aggressively |
| **TimeZoneDB** | 50/day    | ⚠️ Very limited | Upgrade soon       |

**Recommended**: Upgrade to paid plans ($28/month total)

---

## 🚀 Real-World Examples

### 1. Personalized Flight Price

```typescript
app.get('/api/flights/quote', async (req, res) => {
  const basePrice = 450;
  const multiplier = req.userLocation?.countryCode === 'IN' ? 0.75 : 1.0;
  res.json({
    price: basePrice * multiplier,
    currency: req.userLocation?.currency || 'USD',
  });
});
```

### 2. Flight Times in User's Timezone

```typescript
const flightTimes = {
  departure_utc: '2026-04-01T14:00:00Z',
  departure_local: timezoneService.convertTime(
    new Date('2026-04-01T14:00:00Z'),
    'UTC',
    req.userTimezone?.zone || 'UTC'
  ).date,
};
```

### 3. Find Nearby Hotels

```typescript
const nearbyHotels = allHotels
  .map(h => ({
    ...h,
    distance_km: geo.getDistanceBetweenCoordinates(
      req.userLocation.latitude,
      req.userLocation.longitude,
      h.latitude,
      h.longitude
    ),
  }))
  .filter(h => h.distance_km < 50)
  .sort((a, b) => a.distance_km - b.distance_km);
```

---

## 📚 Full Documentation

- **Setup Guide**: [LOCATION_TIMEZONE_SETUP_GUIDE.md](LOCATION_TIMEZONE_SETUP_GUIDE.md)
- **Integration Examples**: [SERVICE_INTEGRATION_GUIDE.md](SERVICE_INTEGRATION_GUIDE.md#9-location--timezone-integration)
- **Complete Details**: [LOCATION_TIMEZONE_INTEGRATION_COMPLETE.md](LOCATION_TIMEZONE_INTEGRATION_COMPLETE.md)

---

## 🎯 Common Patterns

```typescript
// Check if user is from specific region
if (['IN', 'BR', 'PK'].includes(req.userLocation?.countryCode)) {
  // Apply regional pricing
}

// Check if in same timezone as hotel
const hotelTimezone = 'America/New_York';
const sameTimezone = req.userTimezone?.zone === hotelTimezone;

// Get timezone offset for display
const offset = req.userTimezone?.offset || 0;
const sign = offset >= 0 ? '+' : '-';
console.log(`UTC${sign}${Math.abs(offset / 60)}:00`);

// Convert epoch to user timezone
const date = new Date(timestamp);
const converted = timezoneService.convertTime(date, 'UTC', req.userTimezone?.zone || 'UTC');
```

---

**Status**: ✅ Ready to use  
**Last Updated**: 2026-03-17  
**Files**: 6 created, 2 updated  
**Lines of Code**: 1,000+  
**Documentation**: 1,000+
