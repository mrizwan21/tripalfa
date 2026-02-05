# 📋 **SYSTEM DATABASE DESIGN DATASHEET: TRAVEL KINGDOM PLATFORM**

## 📖 **Overview**

This datasheet provides a comprehensive blueprint for integrating flight and hotel booking capabilities into the Travel Kingdom platform. It combines static PostgreSQL data for reliability with Redis for real-time performance, designed specifically around the frontend UI requirements.

**Version:** 1.0
**Date:** January 22, 2026
**Authors:** Travel Kingdom Development Team

---

## 🎯 **UI REQUIREMENTS ANALYSIS**

### **Flight Search Module Requirements**
- ✅ Origin/Destination with autocomplete (cities + airports)
- ✅ Departure/Return dates
- ✅ Real-time search suggestions
- ✅ Flight results display (airline, times, stops, pricing)
- ✅ Cart integration for booking
- ✅ Popular destinations showcase
- ✅ Featured flight deals

### **Hotel Search Module Requirements**
- ✅ Destination/location search with autocomplete
- ✅ Check-in/Check-out dates
- ✅ Guest selection (adults, children)
- ✅ Hotel results with pricing and amenities
- ✅ Cart integration for booking
- ✅ Popular destinations showcase

### **Cross-Module Features**
- ✅ Shopping cart with real-time updates
- ✅ Search suggestions and autocomplete
- ✅ Price comparison and alerts
- ✅ Multi-currency support
- ✅ Mobile-responsive design

---

## 🗄️ **POSTGRESQL STATIC DATABASE SCHEMA**

### **1. Core Reference Data Tables**

```sql
-- Airports and Cities (Static Reference Data)
CREATE TABLE airports (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    icao_code VARCHAR(4),
    name VARCHAR(255) NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    timezone VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE cities (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    country_code VARCHAR(2) NOT NULL,
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    population INTEGER,
    timezone VARCHAR(50),
    is_popular BOOLEAN DEFAULT false,
    image_url VARCHAR(500),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Airlines (Static Data)
CREATE TABLE airlines (
    id SERIAL PRIMARY KEY,
    iata_code VARCHAR(2) UNIQUE NOT NULL,
    icao_code VARCHAR(3),
    name VARCHAR(255) NOT NULL,
    country VARCHAR(255),
    logo_url VARCHAR(500),
    website VARCHAR(255),
    alliance VARCHAR(50), -- SkyTeam, Star Alliance, Oneworld
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **2. Flight Inventory Tables**

```sql
-- Flight Routes (Static Schedule Data)
CREATE TABLE flight_routes (
    id SERIAL PRIMARY KEY,
    airline_id INTEGER REFERENCES airlines(id) ON DELETE CASCADE,
    flight_number VARCHAR(10) NOT NULL,
    origin_airport_id INTEGER REFERENCES airports(id) ON DELETE CASCADE,
    destination_airport_id INTEGER REFERENCES airports(id) ON DELETE CASCADE,
    departure_time TIME NOT NULL,
    arrival_time TIME NOT NULL,
    duration_minutes INTEGER NOT NULL,
    distance_km INTEGER,
    aircraft_type VARCHAR(50),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(airline_id, flight_number, origin_airport_id, destination_airport_id)
);

-- Flight Schedules (Static - weekly patterns)
CREATE TABLE flight_schedules (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES flight_routes(id) ON DELETE CASCADE,
    day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6), -- 0=Sunday
    is_operational BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(route_id, day_of_week)
);

-- Base Pricing (Static pricing structure)
CREATE TABLE flight_base_prices (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES flight_routes(id) ON DELETE CASCADE,
    cabin_class VARCHAR(20) NOT NULL, -- economy, premium_economy, business, first
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    valid_from DATE NOT NULL,
    valid_to DATE,
    minimum_stay INTEGER DEFAULT 0,
    maximum_stay INTEGER,
    cancellation_policy TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(route_id, cabin_class, valid_from)
);

-- Flight Amenities and Features
CREATE TABLE flight_amenities (
    id SERIAL PRIMARY KEY,
    route_id INTEGER REFERENCES flight_routes(id) ON DELETE CASCADE,
    cabin_class VARCHAR(20) NOT NULL,
    amenity_type VARCHAR(50) NOT NULL, -- wifi, entertainment, food, seats
    description TEXT,
    is_available BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### **3. Hotel Inventory Tables**

```sql
-- Hotel Properties (Static Data)
CREATE TABLE hotels (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    address VARCHAR(500) NOT NULL,
    city VARCHAR(255) NOT NULL,
    country VARCHAR(255) NOT NULL,
    postal_code VARCHAR(20),
    latitude DECIMAL(10,8),
    longitude DECIMAL(11,8),
    star_rating DECIMAL(2,1) CHECK (star_rating >= 0 AND star_rating <= 5),
    chain_name VARCHAR(255),
    website VARCHAR(255),
    phone VARCHAR(50),
    email VARCHAR(255),
    checkin_time TIME DEFAULT '15:00',
    checkout_time TIME DEFAULT '11:00',
    amenities JSONB, -- ["wifi", "pool", "gym", "spa", "parking"]
    images JSONB, -- Array of image URLs with metadata
    policies JSONB, -- Cancellation, check-in/out, pet policies
    nearby_attractions JSONB, -- Array of nearby points of interest
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotel Room Types (Static)
CREATE TABLE hotel_room_types (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL, -- "Deluxe King", "Standard Double"
    description TEXT,
    max_occupancy INTEGER NOT NULL,
    bed_type VARCHAR(100), -- "1 King Bed", "2 Double Beds"
    room_size_sqm DECIMAL(6,2),
    view_type VARCHAR(50), -- "City View", "Ocean View", "Garden View"
    amenities JSONB, -- Room-specific amenities
    images JSONB, -- Room-specific images
    is_accessible BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotel Base Rates (Static pricing)
CREATE TABLE hotel_base_rates (
    id SERIAL PRIMARY KEY,
    room_type_id INTEGER REFERENCES hotel_room_types(id) ON DELETE CASCADE,
    season_start DATE NOT NULL,
    season_end DATE NOT NULL,
    base_rate DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    minimum_stay INTEGER DEFAULT 1,
    maximum_stay INTEGER,
    cancellation_policy VARCHAR(50),
    breakfast_included BOOLEAN DEFAULT false,
    refundable BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Hotel Reviews and Ratings (Static aggregation)
CREATE TABLE hotel_reviews_summary (
    id SERIAL PRIMARY KEY,
    hotel_id INTEGER REFERENCES hotels(id) ON DELETE CASCADE,
    total_reviews INTEGER DEFAULT 0,
    average_rating DECIMAL(3,2) DEFAULT 0.00,
    rating_breakdown JSONB, -- { "5": 10, "4": 25, "3": 8, "2": 2, "1": 1 }
    common_amenities_rating DECIMAL(3,2),
    location_rating DECIMAL(3,2),
    service_rating DECIMAL(3,2),
    cleanliness_rating DECIMAL(3,2),
    value_rating DECIMAL(3,2),
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(hotel_id)
);
```

### **4. User and Session Management**

```sql
-- User Search Preferences
CREATE TABLE user_search_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    preferred_airlines JSONB, -- Array of preferred airline IATA codes
    preferred_hotel_chains JSONB, -- Array of preferred hotel chains
    preferred_cabin_class VARCHAR(20) DEFAULT 'economy',
    preferred_hotel_star_rating DECIMAL(2,1),
    budget_range JSONB, -- { "min": 100, "max": 1000, "currency": "USD" }
    preferred_destinations JSONB, -- Array of city/country preferences
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    UNIQUE(user_id)
);

-- Search History
CREATE TABLE search_history (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_id VARCHAR(255),
    search_type VARCHAR(20) NOT NULL, -- 'flight', 'hotel', 'package'
    search_query JSONB NOT NULL,
    results_count INTEGER DEFAULT 0,
    search_duration_ms INTEGER,
    user_agent TEXT,
    ip_address INET,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## 🔴 **REDIS REAL-TIME DATA STRUCTURES**

### **1. Search & Autocomplete (Real-time)**

```redis
# City/Airport Search Index
# Key: search:cities:{query}
# Type: Sorted Set (score = relevance/popularity)
ZADD search:cities:dubai 1000000 "dubai:UAE:25.2048:55.2708"
ZADD search:cities:newy 500000 "new york:USA:40.7128:-74.0060"
ZADD search:cities:lond 450000 "london:GB:51.5074:-0.1278"

# Airport Autocomplete with coordinates
# Key: search:airports:{query}
# Type: Sorted Set
ZADD search:airports:jfk 1 "JFK:John F. Kennedy International:New York:USA:40.6413:-73.7781"
ZADD search:airports:lhr 1 "LHR:Heathrow:London:GB:51.4700:-0.4543"

# Popular Destinations (updated daily)
# Key: popular:destinations
# Type: Sorted Set (score = search frequency)
ZADD popular:destinations 1500 "Paris:France:48.8566:2.3522"
ZADD popular:destinations 1200 "London:UK:51.5074:-0.1278"
ZADD popular:destinations 1100 "Dubai:UAE:25.2048:55.2708"
```

### **2. Dynamic Pricing & Availability (Real-time)**

```redis
# Flight Availability Cache
# Key: flight:availability:{routeId}:{date}
# Type: Hash (TTL: 5 minutes)
HSET flight:availability:123:2026-02-15 economy 45 business 8 first 2
EXPIRE flight:availability:123:2026-02-15 300

# Flight Dynamic Pricing
# Key: flight:price:{routeId}:{date}:{class}
# Type: Hash (TTL: 10 minutes)
HSET flight:price:123:2026-02-15:economy base 450 markup 25 final 475 currency "USD" taxes 50
EXPIRE flight:price:123:2026-02-15:economy 600

# Hotel Availability by date range
# Key: hotel:availability:{hotelId}:{roomTypeId}:{startDate}:{endDate}
# Type: String (TTL: 5 minutes)
SET hotel:availability:456:789:2026-02-15:2026-02-17 3
EXPIRE hotel:availability:456:789:2026-02-15:2026-02-17 300

# Hotel Dynamic Pricing with occupancy
# Key: hotel:price:{hotelId}:{roomTypeId}:{dateRange}
# Type: Hash (TTL: 15 minutes)
HSET hotel:price:456:789:2026-02-15_2026-02-17 base 180 occupancy 85 surge 20 final 200 currency "USD"
EXPIRE hotel:price:456:789:2026-02-15_2026-02-17 900
```

### **3. Search Results & User Sessions (Real-time)**

```redis
# Flight Search Results Cache
# Key: search:flights:{searchId}
# Type: Hash (TTL: 30 minutes)
HSET search:flights:abc123 query "NYC-LON-2026-02-15" results_count 25 last_updated "2026-01-22T08:30:00Z" filters "[]"
EXPIRE search:flights:abc123 1800

# Individual Flight Results (sorted by price)
# Key: search:flights:{searchId}:results
# Type: Sorted Set (score = total price)
ZADD search:flights:abc123:results 525 "AA101:2026-02-15T14:30:00Z:8h30m:1:450:75"
ZADD search:flights:abc123:results 595 "BA227:2026-02-15T16:45:00Z:7h45m:0:520:75"

# Hotel Search Results
# Key: search:hotels:{searchId}
# Type: Hash (TTL: 30 minutes)
HSET search:hotels:xyz789 destination "Paris" checkin "2026-02-15" checkout "2026-02-17" guests 2 adults 2 children 0
EXPIRE search:hotels:xyz789 1800

# Hotel Results (sorted by price)
# Key: search:hotels:{searchId}:results
# Type: Sorted Set (score = total price for stay)
ZADD search:hotels:xyz789:results 360 "Sheraton:4.2:180:2:pool,gym,wifi"
ZADD search:hotels:xyz789:results 420 "Marriott:4.5:210:1:spa,pool,gym"

# User Session Data
# Key: session:{userId}
# Type: Hash (TTL: 24 hours)
HSET session:user123 preferences '{"currency":"USD","language":"en","cabinClass":"economy"}' recent_searches '["NYC-LON", "PAR-3nights"]' cart_items 2
EXPIRE session:user123 86400

# Search Suggestions Cache
# Key: suggestions:{sessionId}:{type}
# Type: Hash (TTL: 30 minutes)
HSET suggestions:user123:flights origin "New York (JFK)" destination "London (LHR)" dates "2026-02-15|2026-02-20"
EXPIRE suggestions:user123:flights 1800
```

### **4. Rate Limiting & Performance (Real-time)**

```redis
# API Rate Limiting
# Key: ratelimit:{userId}:{endpoint}:{window}
# Type: Sorted Set (TTL: 1 hour)
ZADD ratelimit:user123:search:minute 1640995200000 "request1"
ZADD ratelimit:user123:search:minute 1640995260000 "request2"
EXPIRE ratelimit:user123:search:minute 3600

# Cache Performance Metrics
# Key: metrics:cache:hits
# Type: String (incremented)
SET metrics:cache:hits 15420
SET metrics:cache:misses 2340

# Price Change Alerts Queue
# Key: alerts:price:{userId}
# Type: List (TTL: 24 hours)
LPUSH alerts:price:user123 '{"flight":"AA101","oldPrice":450,"newPrice":425,"change":-5.5,"url":"/flights/AA101"}'
EXPIRE alerts:price:user123 86400
```

---

## 🔗 **ADMIN MODULES DATABASE INTEGRATION**

### **B2B Admin Module - Database Integration Points**

Based on the frontend components analysis, here are the specific database calls needed for B2B Admin features:

#### **1. Booking Management (`/bookings`)**
```typescript
// BookingsListPage.tsx - Main booking list with filters
Database Calls:
├── GET /api/bookings?status={status}&type={type}&page={page}&limit={limit}
│   └── PostgreSQL: bookings, users, companies tables
├── PUT /api/bookings/{id}/status
│   └── PostgreSQL: UPDATE bookings SET status = ?, updated_at = NOW()
├── PUT /api/bookings/{id}/cancel
│   └── PostgreSQL: UPDATE bookings SET status = 'cancelled'
└── GET /api/bookings/{id} (BookingDetailPage)
    └── PostgreSQL: bookings with JOIN users, companies

Redis Integration:
├── Cache booking lists: search:bookings:{filters}:{page}
├── Cache individual bookings: booking:{id}
└── Invalidate on updates: booking:{id}, search:bookings:*
```

#### **2. Inventory Management (`/inventory/*`)**
```typescript
// Hotel, Room, Allocation management pages
Database Calls:
├── GET /api/inventory/hotels - HotelListPage
│   └── PostgreSQL: hotels table with amenities, images
├── GET /api/inventory/rooms - RoomsListPage
│   └── PostgreSQL: rooms JOIN hotel_room_types
├── GET /api/inventory/allocations - AllocationsListPage
│   └── PostgreSQL: allocations JOIN rooms JOIN hotels
├── GET /api/inventory/room-contracts - RoomContractsListPage
│   └── PostgreSQL: room_contracts with pricing data
└── GET /api/inventory/revenue-blocks - RevenueBlocksListPage
    └── PostgreSQL: revenue_blocks for availability management

Redis Integration:
├── Hotel search cache: hotel:search:{destination}:{dates}
├── Room availability: hotel:availability:{hotelId}:{roomTypeId}:{dates}
├── Pricing cache: hotel:price:{hotelId}:{roomTypeId}:{dates}
└── Revenue management: revenue:blocks:{hotelId}:{dateRange}
```

#### **3. Company & User Management**
```typescript
// CompaniesListPage, UsersListPage
Database Calls:
├── GET /api/companies - Company listing with pagination
│   └── PostgreSQL: companies with user counts, booking stats
├── GET /api/users - User listing with filters
│   └── PostgreSQL: users JOIN companies, roles
├── POST /api/companies - Create new company
│   └── PostgreSQL: INSERT companies with default settings
└── PUT /api/users/{id} - Update user permissions
    └── PostgreSQL: UPDATE users SET role_id = ?, updated_at = NOW()

Redis Integration:
├── Company cache: company:{id} with user counts
├── User permissions: user:{id}:permissions
└── Search indexes: search:companies:{query}, search:users:{query}
```

#### **4. Audit & Security (`/audit-logs`)**
```typescript
// AuditLogsListPage - Security monitoring
Database Calls:
├── GET /api/audit-logs?user={user}&action={action}&date_from={date}
│   └── PostgreSQL: audit_logs with pagination
└── GET /api/audit-logs/stats - Dashboard metrics
    └── PostgreSQL: Aggregated counts by action, user, date

Redis Integration:
├── Recent logs cache: audit:recent:{limit}
└── Security alerts: security:alerts:{type}
```

#### **5. Business Modules (Marketing, Tax, Promotions)**
```typescript
// MarketingManagementPage, TaxManagementPage, PromotionsManagementPage
Database Calls:
├── GET /api/marketing/campaigns - Campaign management
│   └── PostgreSQL: marketing_campaigns, banners, content_blocks
├── GET /api/tax/rules - Tax calculation rules
│   └── PostgreSQL: tax_rules, tax_rates by region/country
├── GET /api/promotions - Active promotions and discounts
│   └── PostgreSQL: promotions, coupons, loyalty_programs
└── POST /api/marketing/analytics - Campaign performance
    └── PostgreSQL: marketing_analytics aggregated data

Redis Integration:
├── Tax rates cache: tax:rates:{country}:{region}
├── Active promotions: promotions:active
├── Marketing content: marketing:content:{page}:{section}
└── Analytics cache: analytics:marketing:{campaignId}:{dateRange}
```

### **Super Admin Module - Database Integration Points**

Based on Super Admin dashboard and navigation structure:

#### **1. System Dashboard (`/`)**
```typescript
// Dashboard.tsx - System-wide metrics
Database Calls:
├── GET /api/super-admin/stats - Overall system statistics
│   ├── PostgreSQL: COUNT(*) across all major tables
│   ├── Bookings: Total bookings, revenue, conversion rates
│   ├── Users: Active users, new registrations
│   ├── Companies: Total companies, active tenants
│   └── System: Error rates, performance metrics
├── GET /api/super-admin/revenue - Revenue analytics
│   └── PostgreSQL: Aggregated booking data by date, company, region
└── GET /api/super-admin/health - System health metrics
    └── PostgreSQL: Recent errors, failed operations, performance stats

Redis Integration:
├── System stats cache: superadmin:stats (TTL: 5 minutes)
├── Revenue cache: superadmin:revenue:{period} (TTL: 15 minutes)
└── Health metrics: system:health:{component} (TTL: 1 minute)
```

#### **2. Multi-Tenant Company Management**
```typescript
// TenantSelector, Company management across all tenants
Database Calls:
├── GET /api/super-admin/companies - All companies across tenants
│   └── PostgreSQL: companies with tenant isolation
├── GET /api/super-admin/companies/{id}/stats - Company-specific metrics
│   └── PostgreSQL: Bookings, users, revenue for specific company
├── POST /api/super-admin/companies - Create new tenant
│   └── PostgreSQL: INSERT company with tenant setup
└── PUT /api/super-admin/companies/{id}/suspend - Suspend tenant
    └── PostgreSQL: UPDATE companies SET status = 'suspended'

Redis Integration:
├── Tenant cache: tenant:{companyId}:data
├── Multi-tenant queries: superadmin:companies:{page}:{filters}
└── Company stats: company:{id}:stats:{period}
```

#### **3. Global User Management**
```typescript
// User management across all tenants
Database Calls:
├── GET /api/super-admin/users - All users with tenant context
│   └── PostgreSQL: users JOIN companies (tenant-aware)
├── GET /api/super-admin/users/{id}/activity - User activity logs
│   └── PostgreSQL: user_sessions, audit_logs for specific user
├── PUT /api/super-admin/users/{id}/block - Block user globally
│   └── PostgreSQL: UPDATE users SET status = 'blocked'
└── GET /api/super-admin/security/threats - Security monitoring
    └── PostgreSQL: Failed login attempts, suspicious activities

Redis Integration:
├── Global user cache: global:users:{page}:{filters}
├── User activity: user:{id}:activity:{period}
└── Security events: security:threats:{type}
```

#### **4. System Notifications (`/notifications`)**
```typescript
// Notifications.tsx - System-wide alerts and messages
Database Calls:
├── GET /api/super-admin/notifications - System notifications
│   └── PostgreSQL: system_notifications, alerts, maintenance notices
├── GET /api/super-admin/notifications/unread - Unread count
│   └── PostgreSQL: COUNT(*) WHERE read = false
├── PUT /api/super-admin/notifications/{id}/read - Mark as read
│   └── PostgreSQL: UPDATE notifications SET read = true
└── POST /api/super-admin/notifications - Create system notification
    └── PostgreSQL: INSERT system_notifications

Redis Integration:
├── Notification cache: notifications:{userId}:{page}
├── Unread count: notifications:{userId}:unread_count
└── System alerts: system:notifications:active
```

### **Database Query Patterns by Module**

#### **B2B Admin Query Patterns:**
```sql
-- Booking Management Queries
SELECT b.*, u.first_name, u.last_name, u.email, c.name as company_name
FROM bookings b
LEFT JOIN users u ON b.user_id = u.id
LEFT JOIN companies c ON b.company_id = c.id
WHERE b.company_id = $1 AND b.status IN ($2, $3)
ORDER BY b.created_at DESC
LIMIT $4 OFFSET $5;

-- Inventory Management Queries
SELECT h.*, rt.name as room_type, rt.max_occupancy,
       COALESCE(AVG(r.rating), 0) as avg_rating
FROM hotels h
LEFT JOIN hotel_room_types rt ON h.id = rt.hotel_id
LEFT JOIN hotel_reviews_summary r ON h.id = r.hotel_id
WHERE h.is_active = true AND h.city = $1
ORDER BY h.star_rating DESC, r.avg_rating DESC;

-- Company Performance Queries
SELECT c.name, c.id,
       COUNT(b.id) as total_bookings,
       SUM(b.total_amount) as total_revenue,
       AVG(b.total_amount) as avg_booking_value
FROM companies c
LEFT JOIN bookings b ON c.id = b.company_id
WHERE b.created_at >= $1 AND b.created_at <= $2
GROUP BY c.id, c.name
ORDER BY total_revenue DESC;
```

#### **Super Admin Query Patterns:**
```sql
-- System-wide Statistics
SELECT
  (SELECT COUNT(*) FROM companies WHERE status = 'active') as active_companies,
  (SELECT COUNT(*) FROM users WHERE created_at >= CURRENT_DATE - INTERVAL '30 days') as new_users_30d,
  (SELECT SUM(total_amount) FROM bookings WHERE status = 'confirmed' AND created_at >= CURRENT_DATE - INTERVAL '30 days') as revenue_30d,
  (SELECT COUNT(*) FROM bookings WHERE status = 'confirmed' AND created_at >= CURRENT_DATE) as bookings_today;

-- Cross-tenant User Activity
SELECT u.id, u.email, u.first_name, u.last_name, c.name as company_name,
       u.last_login, u.status, u.created_at,
       COUNT(b.id) as total_bookings,
       SUM(b.total_amount) as lifetime_value
FROM users u
JOIN companies c ON u.company_id = c.id
LEFT JOIN bookings b ON u.id = b.user_id AND b.status = 'confirmed'
WHERE u.status = 'active'
GROUP BY u.id, u.email, u.first_name, u.last_name, c.name, u.last_login, u.status, u.created_at
ORDER BY u.created_at DESC
LIMIT $1 OFFSET $2;

-- Security Monitoring
SELECT event_type, COUNT(*) as occurrences,
       array_agg(DISTINCT user_id) as affected_users,
       MAX(created_at) as last_occurrence
FROM audit_logs
WHERE created_at >= CURRENT_DATE - INTERVAL '24 hours'
  AND event_type IN ('failed_login', 'suspicious_activity', 'unauthorized_access')
GROUP BY event_type
ORDER BY occurrences DESC;
```

---

## 🔄 **INTEGRATION ARCHITECTURE**

### **1. Service Layer Architecture**

```typescript
interface BookingEngineService {
  // Static Data Services (PostgreSQL)
  flightRoutes: FlightRouteService;
  hotelInventory: HotelInventoryService;
  basePricing: BasePricingService;

  // Real-time Services (Redis)
  availabilityCache: AvailabilityCacheService;
  pricingEngine: DynamicPricingService;
  searchIndex: SearchIndexService;

  // Integration Services
  externalAPIs: ExternalAPIService; // Amadeus, Duffel, Hotelbeds
  cartManager: CartManagerService;
  notificationService: NotificationService;
}

class FlightSearchFlow {
  async searchFlights(searchQuery: FlightSearchQuery) {
    // 1. Generate search ID
    const searchId = generateSearchId();

    // 2. Check Redis cache first
    const cachedResults = await this.cacheService.getFlightSearch(searchId);
    if (cachedResults) {
      await this.trackSearchMetrics(searchId, 'cache_hit');
      return cachedResults;
    }

    // 3. Query PostgreSQL for base data
    const baseData = await this.flightService.searchRoutes(searchQuery);

    // 4. Apply real-time pricing from Redis/external APIs
    const pricedResults = await this.pricingService.applyDynamicPricing(baseData);

    // 5. Get real-time availability
    const availableResults = await this.availabilityService.filterAvailable(pricedResults);

    // 6. Cache results in Redis
    await this.cacheService.setFlightSearch(searchId, availableResults);

    // 7. Track search metrics
    await this.trackSearchMetrics(searchId, 'fresh_search');

    return availableResults;
  }

  async getAutocompleteSuggestions(query: string, type: 'city' | 'airport') {
    const cacheKey = `autocomplete:${type}:${query.toLowerCase()}`;

    // Check Redis cache first
    const cached = await this.redis.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Query database
    const suggestions = await this.searchService.getSuggestions(query, type);

    // Cache for 1 hour
    await this.redis.setex(cacheKey, 3600, JSON.stringify(suggestions));

    return suggestions;
  }
}
```

### **2. API Endpoints Design**

```typescript
// Flight Search APIs
GET  /api/flights/search?origin={iata}&destination={iata}&date={yyyy-mm-dd}&return={yyyy-mm-dd}&passengers=1
GET  /api/flights/{flightId}/availability?date={yyyy-mm-dd}
GET  /api/flights/{flightId}/pricing?date={yyyy-mm-dd}&class={economy}
POST /api/flights/{flightId}/book

// Hotel Search APIs
GET  /api/hotels/search?destination={city}&checkin={date}&checkout={date}&guests=2&rooms=1
GET  /api/hotels/{hotelId}/availability?checkin={date}&checkout={date}&rooms=1
GET  /api/hotels/{hotelId}/pricing?checkin={date}&checkout={date}&rooms=1
GET  /api/hotels/{hotelId}/rooms/{roomId}/details
POST /api/hotels/{hotelId}/book

// Autocomplete APIs
GET  /api/search/cities?q={query}&limit=10
GET  /api/search/airports?q={query}&limit=10
GET  /api/search/hotels?q={query}&city={city}&limit=10

// Cache Management APIs (Admin)
POST /api/cache/flights/invalidate?route={routeId}
POST /api/cache/hotels/invalidate?hotel={hotelId}
GET  /api/cache/stats
DELETE /api/cache/clear

// User Preferences APIs
GET  /api/user/preferences
PUT  /api/user/preferences
GET  /api/user/search-history
```

### **3. External API Integration**

```typescript
interface ExternalAPIConfig {
  amadeus: {
    apiKey: string;
    apiSecret: string;
    baseUrl: 'https://test.api.amadeus.com';
    endpoints: {
      flightSearch: '/v2/shopping/flight-offers',
      flightPrice: '/v1/shopping/flight-offers/pricing',
      seatAvailability: '/v1/shopping/seatmaps'
    };
  };

  duffel: {
    apiKey: string;
    baseUrl: 'https://api.duffel.com';
    endpoints: {
      flightSearch: '/air/offer_requests',
      flightPrice: '/air/offers/{id}',
      flightBook: '/air/orders'
    };
  };

  hotelbeds: {
    apiKey: string;
    apiSecret: string;
    baseUrl: 'https://api.test.hotelbeds.com';
    endpoints: {
      hotelSearch: '/hotel-api/1.0/hotels',
      hotelDetails: '/hotel-api/1.0/hotels/{hotelId}',
      hotelBooking: '/hotel-api/1.0/bookings'
    };
  };
}

class ExternalAPIService {
  async getFlightPrices(origin: string, destination: string, date: string) {
    // Try Amadeus first
    try {
      return await this.amadeusAPI.searchFlights(origin, destination, date);
    } catch (error) {
      console.log('Amadeus API failed, trying Duffel...');
      return await this.duffelAPI.searchFlights(origin, destination, date);
    }
  }

  async getHotelAvailability(city: string, checkin: string, checkout: string) {
    return await this.hotelbedsAPI.searchHotels(city, checkin, checkout);
  }
}
```

---

## 📊 **PERFORMANCE & SCALING**

### **1. Database Indexes**

```sql
-- Flight search performance
CREATE INDEX CONCURRENTLY idx_flight_routes_origin_dest ON flight_routes(origin_airport_id, destination_airport_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_flight_schedules_route_day ON flight_schedules(route_id, day_of_week) WHERE is_operational = true;
CREATE INDEX CONCURRENTLY idx_flight_base_prices_route_class_dates ON flight_base_prices(route_id, cabin_class, valid_from, valid_to) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_airports_iata_active ON airports(iata_code) WHERE is_active = true;

-- Hotel search performance
CREATE INDEX CONCURRENTLY idx_hotels_city_country_active ON hotels(city, country) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_hotels_location ON hotels USING gist(point(longitude, latitude)) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_hotel_room_types_hotel_active ON hotel_room_types(hotel_id) WHERE is_active = true;
CREATE INDEX CONCURRENTLY idx_hotel_base_rates_room_dates ON hotel_base_rates(room_type_id, season_start, season_end) WHERE is_active = true;

-- Search optimization
CREATE INDEX CONCURRENTLY idx_cities_name_country ON cities(name, country) WHERE is_popular = true;
CREATE INDEX CONCURRENTLY idx_search_history_user_created ON search_history(user_id, created_at DESC);
```

### **2. Redis Cluster Configuration**

```yaml
# redis-cluster.yml
version: '3.8'
services:
  redis-1:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "7001:6379"
    volumes:
      - redis-1-data:/data

  redis-2:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "7002:6379"
    volumes:
      - redis-2-data:/data

  redis-3:
    image: redis:7-alpine
    command: redis-server --cluster-enabled yes --cluster-config-file nodes.conf --cluster-node-timeout 5000
    ports:
      - "7003:6379"
    volumes:
      - redis-3-data:/data
```

### **3. Cache TTL Strategy**

```typescript
export const CACHE_TTL = {
  // Search results
  searchResults: 30 * 60,     // 30 minutes
  autocomplete: 60 * 60,      // 1 hour
  popularDestinations: 24 * 3600, // 24 hours

  // Availability & Pricing
  flightAvailability: 5 * 60, // 5 minutes
  flightPricing: 10 * 60,     // 10 minutes
  hotelAvailability: 5 * 60,  // 5 minutes
  hotelPricing: 15 * 60,      // 15 minutes

  // Static data
  airportData: 7 * 24 * 3600, // 7 days
  airlineData: 7 * 24 * 3600, // 7 days
  hotelData: 24 * 3600,       // 24 hours

  // User data
  userSession: 24 * 3600,     // 24 hours
  userPreferences: 7 * 24 * 3600, // 7 days
  searchHistory: 30 * 24 * 3600, // 30 days

  // Business data
  cartData: 24 * 3600,        // 24 hours
  bookingData: 365 * 24 * 3600 // 1 year
};
```

---

## 🔧 **IMPLEMENTATION ROADMAP**

### **Phase 1: Database Schema Setup**
```bash
# 1. Update Prisma schema
npx prisma migrate dev --name add_booking_engine_tables

# 2. Generate Prisma client
npx prisma generate

# 3. Seed initial data
npm run db:seed:airports
npm run db:seed:airlines
npm run db:seed:hotels
npm run db:seed:routes
```

### **Phase 2: Redis Infrastructure**
```typescript
// 1. Redis service configuration
import Redis from 'ioredis';

const redis = new Redis.Cluster([
  { host: 'redis-1', port: 6379 },
  { host: 'redis-2', port: 6379 },
  { host: 'redis-3', port: 6379 }
], {
  redisOptions: {
    password: process.env.REDIS_PASSWORD
  }
});

// 2. Cache service implementation
class RedisCacheService {
  async getFlightSearch(searchId: string) {
    const key = `search:flights:${searchId}`;
    const data = await redis.get(key);
    return data ? JSON.parse(data) : null;
  }

  async setFlightSearch(searchId: string, results: any) {
    const key = `search:flights:${searchId}`;
    await redis.setex(key, CACHE_TTL.searchResults, JSON.stringify(results));
  }
}
```

### **Phase 3: API Implementation**
```typescript
// Flight search endpoint
app.get('/api/flights/search', async (req, res) => {
  try {
    const {
      origin,
      destination,
      departureDate,
      returnDate,
      passengers = 1,
      cabinClass = 'economy'
    } = req.query;

    const searchQuery = {
      origin: origin.toUpperCase(),
      destination: destination.toUpperCase(),
      departureDate,
      returnDate,
      passengers: parseInt(passengers),
      cabinClass
    };

    const results = await bookingEngine.searchFlights(searchQuery);

    res.json({
      data: results,
      meta: {
        total: results.length,
        searchId: generateSearchId(),
        cached: false
      }
    });

  } catch (error) {
    console.error('Flight search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});

// Hotel search endpoint
app.get('/api/hotels/search', async (req, res) => {
  try {
    const {
      destination,
      checkin,
      checkout,
      guests = 2,
      rooms = 1
    } = req.query;

    const searchQuery = {
      destination,
      checkin,
      checkout,
      guests: parseInt(guests),
      rooms: parseInt(rooms)
    };

    const results = await bookingEngine.searchHotels(searchQuery);

    res.json({
      data: results,
      meta: {
        total: results.length,
        searchId: generateSearchId(),
        currency: 'USD'
      }
    });

  } catch (error) {
    console.error('Hotel search error:', error);
    res.status(500).json({ error: 'Search failed', message: error.message });
  }
});
```

### **Phase 4: Real-time Synchronization**
```typescript
// External API synchronization
class DataSynchronizationService {
  constructor() {
    this.syncInterval = setInterval(() => {
      this.syncFlightData();
      this.syncHotelData();
    }, 5 * 60 * 1000); // Every 5 minutes
  }

  async syncFlightData() {
    try {
      const updates = await externalAPI.getFlightUpdates();
      await cacheService.updateFlightAvailability(updates);
      await cacheService.updateFlightPricing(updates);
    } catch (error) {
      console.error('Flight data sync failed:', error);
    }
  }

  async syncHotelData() {
    try {
      const updates = await externalAPI.getHotelUpdates();
      await cacheService.updateHotelAvailability(updates);
      await cacheService.updateHotelPricing(updates);
    } catch (error) {
      console.error('Hotel data sync failed:', error);
    }
  }
}
```

---

## 📈 **SUCCESS METRICS & MONITORING**

### **Performance Targets**
- **Search Response Time**: < 100ms (cached), < 500ms (fresh)
- **Cache Hit Rate**: > 85%
- **API Availability**: 99.9%
- **Data Freshness**: < 5 minutes for pricing, < 1 minute for availability

### **Business Metrics**
- **Search Conversion**: > 3% click-through rate
- **Booking Completion**: > 25% of cart initiations
- **User Satisfaction**: > 4.5/5 rating
- **Revenue per Search**: > $2.50

### **Monitoring Setup**
```typescript
const monitoringMetrics = {
  search: {
    queriesPerSecond: 'counter',
    averageResponseTime: 'histogram',
    errorRate: 'percentage',
    cacheHitRate: 'percentage'
  },

  cache: {
    hitRate: 'percentage',
    missRate: 'percentage',
    evictionRate: 'counter',
    memoryUsage: 'gauge'
  },

  business: {
    searchesPerformed: 'counter',
    bookingsCompleted: 'counter',
    revenueGenerated: 'counter',
    averageOrderValue: 'gauge'
  }
};
```

---

## 🚀 **DEPLOYMENT & MAINTENANCE**

### **Environment Configuration**
```bash
# Production environment variables
DATABASE_URL=postgresql://user:pass@host:5432/travel_kingdom
REDIS_URL=redis://:password@cluster:6379
AMADEUS_API_KEY=your_key
DUFFEL_API_KEY=your_key
HOTELBEDS_API_KEY=your_key
CACHE_TTL_SEARCH=1800
CACHE_TTL_AVAILABILITY=300
```

### **Health Checks**
```typescript
// Service health endpoints
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'booking-engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    dependencies: {
      database: await checkDatabaseHealth(),
      redis: await checkRedisHealth(),
      externalAPIs: await checkExternalAPIHealth()
    }
  });
});
```

### **Backup & Recovery**
- **Database**: Daily snapshots with 30-day retention
- **Redis**: AOF persistence with hourly backups
- **Cache**: Automatic failover with Redis Sentinel
- **Logs**: Centralized logging with ELK stack

---

## 📞 **SUPPORT & TROUBLESHOOTING**

### **Common Issues**
1. **Slow Search Response**: Check Redis cache hit rate, database indexes
2. **Stale Pricing Data**: Verify external API synchronization
3. **Cache Memory Issues**: Monitor Redis memory usage, adjust TTL
4. **Database Connection Pool**: Check connection limits and timeouts

### **Debug Commands**
```bash
# Redis debugging
redis-cli --cluster check redis-cluster:6379
redis-cli KEYS "search:*" | head -10

# Database debugging
psql -c "SELECT * FROM pg_stat_activity WHERE state = 'active';"
psql -c "EXPLAIN ANALYZE SELECT * FROM flight_routes WHERE origin_airport_id = 1;"

# API debugging
curl -H "Authorization: Bearer <token>" "http://localhost:3000/api/flights/search?origin=JFK&destination=LHR"
```

---

## 🔄 **VERSION HISTORY**

| Version | Date | Changes | Author |
|---------|------|---------|--------|
| 1.0 | 2026-01-22 | Initial booking engine datasheet | Travel Kingdom Team |
| 1.1 | Future | Add package deals integration | TBD |
| 1.2 | Future | Mobile app API optimization | TBD |

---

**This datasheet serves as the comprehensive blueprint for the Travel Kingdom booking engine implementation. It combines static PostgreSQL data reliability with Redis real-time performance to deliver a world-class travel booking experience.**

**Document Status: ✅ FINAL - Ready for Implementation**
