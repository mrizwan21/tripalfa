# Booking Engine - Static & Realtime Data Mapping Document

> **Version:** 1.0.0  
> **Last Updated:** February 2026  
> **Purpose:** Comprehensive mapping of every frontend UI data point to static database or real-time API  
> **Principle:** ZERO HARDODING - 95% Hotel data from Static DB, Only availability/pricing/cancellation from real-time API

---

## Executive Summary

### Data Source Split

| Data Type | Source | Percentage |
| --------- | ------ | ---------- |
| **Hotel Static Data** | PostgreSQL Static Database | ~95% |
| **Hotel Real-time Data** | LiteAPI / Hotelbeds API | ~5% (availability, pricing, cancellation) |
| **Flight Static Data** | PostgreSQL Static Database | ~80% |
| **Flight Real-time Data** | Duffel API → Redis Cache | ~20% (search, pricing, seat maps) |

### Data Fetching Strategy

#### Hotel Detail Page

```
┌─────────────────────────────────────────────────────────────┐
│                    HOTEL DETAIL DATA FLOW                    │
├─────────────────────────────────────────────────────────────┤
│  1. STATIC DB (Primary)                                      │
│     - Hotel basic info (name, address, star rating)         │
│     - Check-in/out times                                    │
│     - Hotel images, amenities, room types                   │
│     - Reviews (static)                                       │
│     - House rules, policies                                  │
│                                                              │
│  2. REAL-TIME API (Fallback - if static unavailable)        │
│     - Via LiteAPI/Hotelbeds                                 │
│     - Cached in Redis for 1 hour                            │
│                                                              │
│  3. REAL-TIME API (Always)                                   │
│     - Room availability & pricing                           │
│     - Cancellation policies                                  │
│     - Live rates                                             │
└─────────────────────────────────────────────────────────────┘
```

#### Flight Search Page

```
┌─────────────────────────────────────────────────────────────┐
│                    FLIGHT SEARCH DATA FLOW                   │
├─────────────────────────────────────────────────────────────┤
│  1. REAL-TIME API (Primary)                                  │
│     - Duffel API → Offers, schedules, pricing               │
│                                                              │
│  2. REDIS CACHE LAYER                                        │
│     - All real-time API data cached                         │
│     - Multi-API aggregation (future: Amadeus, etc.)         │
│     - TTL: 15-30 minutes                                     │
│                                                              │
│  3. BUSINESS LOGIC PROCESSING                                │
│     - De-duplication of flights across suppliers            │
│     - Sorting by price, duration, stops                     │
│     - Filtering by airline, time, stops                     │
│                                                              │
│  4. STATIC DB (Reference)                                    │
│     - Airport/airline names & logos                         │
│     - Cabin class definitions                               │
└─────────────────────────────────────────────────────────────┘
```

#### Wallet Page

```
┌─────────────────────────────────────────────────────────────┐
│                    EXCHANGE RATES DATA FLOW                  │
├─────────────────────────────────────────────────────────────┤
│  1. EXTERNAL API (Open Exchange Rates)                       │
│     - Fetched every 1 hour via cron job                     │
│     - All currency pairs                                    │
│                                                              │
│  2. STATIC POSTGRESQL DB                                     │
│     - ExchangeRate table stores latest rates                │
│     - Historical rates preserved                            │
│     - Docker-deployed instance                              │
│                                                              │
│  3. FRONTEND                                                 │
│     - Reads from ExchangeRate table                         │
│     - No direct API calls from frontend                     │
└─────────────────────────────────────────────────────────────┘
```

### Real-time API Data (NOT in Static DB)

| Category | Data Points | Source |
|----------|-------------|--------|
| **Hotel Availability** | Room availability, dates blocked | LiteAPI/Hotelbeds |
| **Hotel Pricing** | Rates, taxes, fees, commissions | LiteAPI/Hotelbeds |
| **Cancellation Policies** | Refundable status, policy text, deadlines | LiteAPI/Hotelbeds |
| **Flight Search** | Offers, schedules, pricing | Duffel API → Redis Cache |
| **Seat Maps** | Seat availability, pricing | Duffel API |
| **Exchange Rates** | Currency conversion rates | Open Exchange API → Static DB |

---

## 1. Hotel Search Page (`HotelSearch.tsx`)

### 1.1 Search Form - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Location Dropdown | `location` | **STATIC** | `Destination` table + `HOTEL_STATIC_DATA.POPULAR_DESTINATIONS` | ✅ Available |
| Check-in/out Dates | `checkin/checkout` | USER INPUT | N/A | ✅ N/A |
| Adults/Children/Rooms | `adults/children/rooms` | USER INPUT | N/A | ✅ N/A |
| Nationality | `countryCode` | **STATIC** | `Country` table | ⚠️ Limited data (6 countries) |

### 1.2 Popular Destinations Section

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Destination Name | `dest.name` | **STATIC** | `HOTEL_STATIC_DATA.POPULAR_DESTINATIONS[].city` | ✅ Available (10 cities) |
| Destination Country | `dest.country` | **STATIC** | `HOTEL_STATIC_DATA.POPULAR_DESTINATIONS[].country` | ✅ Available |
| Destination Image | `dest.image` | **STATIC** | **MISSING** - Need `Destination.imageUrl` | ❌ Missing |
| Hotel Count | `dest.hotels` | **STATIC** | **MISSING** - Need `Destination.hotelCount` | ❌ Missing |

**🔴 HARDCODED TO FIX:**

```typescript
// ❌ CURRENT: Hardcoded in HotelSearch.tsx lines 108-111
{ name: 'Dubai', image: 'https://images.unsplash.com/...', hotels: '2,450+' }

// ✅ REQUIRED: Fetch from static data
const destinations = HOTEL_STATIC_DATA.POPULAR_DESTINATIONS.map(dest => ({
  name: dest.city,
  image: dest.image_url,    // Need to add to Destination model
  hotels: dest.hotel_count   // Need to add to Destination model
}));
```

### 1.3 Hotel Search Results - MIXED

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Hotel ID | `hotel.id` | **STATIC** | `CanonicalHotel.id` | ⚠️ Need import |
| Hotel Name | `hotel.name` | **STATIC** | `CanonicalHotel.name` | ⚠️ Need import |
| Hotel Image | `hotel.image` | **STATIC** | `HotelImage.url` | ⚠️ Need import |
| Hotel Location | `hotel.location` | **STATIC** | `CanonicalHotel.city + country` | ⚠️ Need import |
| Star Rating | `hotel.rating` | **STATIC** | `CanonicalHotel.starRating` | ⚠️ Need import |
| Review Count | `hotel.reviews` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |
| Amenities List | `hotel.amenities` | **STATIC** | `HotelAmenityMapping` + `HotelAmenity` | ✅ Available |
| **Price Amount** | `hotel.price.amount` | **REALTIME** | LiteAPI `/hotels/rates` | ✅ API |
| **Price Currency** | `hotel.price.currency` | **REALTIME** | LiteAPI `/hotels/rates` | ✅ API |
| **Refundable Status** | `hotel.refundable` | **REALTIME** | LiteAPI `/hotels/rates` | ✅ API |
| Provider Name | `hotel.provider` | **STATIC** | `Supplier.name` via `SupplierHotelMapping` | ⚠️ Need import |

---

## 2. Hotel Detail Page (`HotelDetail.tsx`)

### 2.1 Hotel Basic Information - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Hotel Name | `hotel.name` | **STATIC** | `CanonicalHotel.name` | ⚠️ Need import |
| Description | `hotel.description` | **STATIC** | `CanonicalHotel.description` | ⚠️ Need import |
| Star Rating | `hotel.rating` | **STATIC** | `CanonicalHotel.starRating` | ⚠️ Need import |
| Address | `hotel.address` | **STATIC** | `CanonicalHotel.address` | ⚠️ Need import |
| City | `hotel.city` | **STATIC** | `CanonicalHotel.city` | ⚠️ Need import |
| Country | `hotel.country` | **STATIC** | `CanonicalHotel.country` | ⚠️ Need import |
| Latitude | `hotel.latitude` | **STATIC** | `CanonicalHotel.latitude` | ⚠️ Need import |
| Longitude | `hotel.longitude` | **STATIC** | `CanonicalHotel.longitude` | ⚠️ Need import |
| Check-in Time | `hotel.checkInTime` | **STATIC** | `CanonicalHotel.checkInTime` | ⚠️ Need import |
| Check-out Time | `hotel.checkOutTime` | **STATIC** | `CanonicalHotel.checkOutTime` | ⚠️ Need import |

**🔴 HARDCODED TO FIX:**

```typescript
// ❌ CURRENT: Hardcoded in HotelDetail.tsx
<span>From 14:00</span>  // Check-in time
<span>Until 12:00</span> // Check-out time

// ✅ REQUIRED: Fetch from static data
const checkInTime = hotel.checkInTime || "14:00";
const checkOutTime = hotel.checkOutTime || "12:00";
```

### 2.2 Image Gallery - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Image URL | `image.url` | **STATIC** | `HotelImage.url` | ⚠️ Need import |
| Thumbnail URL | `image.thumbnailUrl` | **STATIC** | `HotelImage.thumbnailUrl` | ⚠️ Need import |
| Caption | `image.caption` | **STATIC** | `HotelImage.caption` | ⚠️ Need import |
| Image Type | `image.imageType` | **STATIC** | `HotelImage.imageType` | ⚠️ Need import |
| Is Primary | `image.isPrimary` | **STATIC** | `HotelImage.isPrimary` | ⚠️ Need import |
| Size Variants | `image.variants` | **STATIC** | `HotelImage.variants` (JSON) | ⚠️ Need import |

### 2.3 Facilities/Amenities - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Amenity Code | `amenity.code` | **STATIC** | `HotelAmenity.code` | ✅ Available |
| Amenity Name | `amenity.name` | **STATIC** | `HotelAmenity.name` | ✅ Available |
| Amenity Category | `amenity.category` | **STATIC** | `HotelAmenity.category` | ✅ Available |
| Amenity Icon | `amenity.icon` | **STATIC** | **MISSING** - Need `HotelAmenity.icon` field | ❌ Missing |
| Is Free | `amenity.isFree` | **STATIC** | `HotelAmenityMapping.isFree` | ⚠️ Need import |
| Operating Hours | `amenity.operatingHours` | **STATIC** | `HotelAmenityMapping.operatingHours` | ⚠️ Need import |

**🔴 HARDCODED TO FIX:**

```typescript
// ❌ CURRENT: Hardcoded icons in HotelDetail.tsx
const getCategoryIcon = (category: string) => {
  switch (category.toLowerCase()) {
    case 'recreation': return <Waves size={14} />;
    case 'dining': return <Utensils size={14} />;
    // ...
  }
}

// ✅ REQUIRED: Store icon name in DB, render dynamically
// In HotelAmenity table: { code: 'POOL', icon: 'Waves', ... }
// In component: const IconComponent = Icons[amenity.icon] || Info;
```

### 2.4 Reviews Section - All STATIC (User Requirement)

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Overall Rating | `review.rating` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |
| Review Count | `review.count` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |
| Review Author | `review.author` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |
| Review Date | `review.date` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |
| Review Text | `review.text` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |
| Review Score | `review.score` | **STATIC** | **MISSING** - Need `HotelReview` table | ❌ Missing |

**🔴 HARDCODED TO FIX:**

```typescript
// ❌ CURRENT: Hardcoded mock reviews in HotelDetail.tsx
{[1, 2, 3, 4, 5].map(i => (
  <div key={i}>
    <span>John Doe</span>
    <p>"Perfect location & amazing staff!"</p>
  </div>
))}

// ✅ REQUIRED: Create HotelReview table and fetch from static DB
```

### 2.5 House Rules - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Check-in Time | `rules.checkIn` | **STATIC** | `CanonicalHotel.checkInTime` | ⚠️ Need import |
| Check-out Time | `rules.checkOut` | **STATIC** | `CanonicalHotel.checkOutTime` | ⚠️ Need import |
| Pets Policy | `rules.pets` | **STATIC** | **MISSING** - Need `CanonicalHotel.metadata.petsPolicy` | ❌ Missing |
| Children Policy | `rules.children` | **STATIC** | **MISSING** - Need `CanonicalHotel.metadata.childrenPolicy` | ❌ Missing |
| Cancellation Policy | `rules.cancellation` | **STATIC** | **MISSING** - Need `CanonicalHotel.metadata.cancellationPolicy` | ❌ Missing |

### 2.6 Room Types - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Room ID | `room.id` | **STATIC** | `HotelRoomType.id` | ⚠️ Need import |
| Room Name | `room.name` | **STATIC** | `HotelRoomType.roomTypeName` | ⚠️ Need import |
| Room Code | `room.code` | **STATIC** | `HotelRoomType.roomTypeCode` | ⚠️ Need import |
| Max Occupancy | `room.maxOccupancy` | **STATIC** | `HotelRoomType.maxOccupancy` | ⚠️ Need import |
| Max Adults | `room.maxAdults` | **STATIC** | `HotelRoomType.maxAdults` | ⚠️ Need import |
| Max Children | `room.maxChildren` | **STATIC** | `HotelRoomType.maxChildren` | ⚠️ Need import |
| Bed Type | `room.bedType` | **STATIC** | `HotelRoomType.bedType` | ⚠️ Need import |
| Bed Count | `room.bedCount` | **STATIC** | `HotelRoomType.bedCount` | ⚠️ Need import |
| Room Size | `room.roomSize` | **STATIC** | `HotelRoomType.roomSize` | ⚠️ Need import |
| Room Image | `room.image` | **STATIC** | `RoomImage.url` | ⚠️ Need import |
| Room Amenities | `room.amenities` | **STATIC** | `RoomAmenityMapping` + `RoomAmenity` | ⚠️ Need import |

### 2.7 Room Rates - REALTIME (Only Pricing)

| UI Element | Field ID | Source | API Endpoint | Status |
|------------|----------|--------|--------------|--------|
| **Rate ID** | `rate.id` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Original Price** | `rate.originalPrice` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Tax Amount** | `rate.tax` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Commission** | `rate.commission` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Final Price** | `rate.price.amount` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Currency** | `rate.price.currency` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Availability** | `rate.availability` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Is Refundable** | `rate.isRefundable` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| **Cancellation Policy** | `rate.cancellationPolicy` | **REALTIME** | `POST /hotels/rates` | ✅ API |
| Board Type | `rate.boardType` | **STATIC** | `BoardType` mapped from API code | ✅ Available |

---

## 3. Flight Search Page (`FlightSearch.tsx`)

### 3.1 Search Form - All STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Origin Airport | `origin` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS` | ⚠️ Limited (5 airports) |
| Destination Airport | `destination` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS` | ⚠️ Limited (5 airports) |
| Cabin Class | `cabinClass` | **STATIC** | `FLIGHT_STATIC_DATA.CABINS` | ✅ Available (4 classes) |
| Departure Date | `departureDate` | USER INPUT | N/A | ✅ N/A |
| Return Date | `returnDate` | USER INPUT | N/A | ✅ N/A |
| Travelers Count | `travelers` | USER INPUT | N/A | ✅ N/A |

### 3.2 Airport Autocomplete - STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Airport Name | `airport.name` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS.byIataCode` | ⚠️ Limited (5) |
| Airport IATA Code | `airport.iata_code` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS.byIataCode` | ⚠️ Limited (5) |
| City Name | `airport.city` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS.byIataCode` | ⚠️ Limited (5) |
| Country | `airport.country` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS.byIataCode` | ⚠️ Limited (5) |
| Latitude/Longitude | `airport.lat/lng` | **STATIC** | `FLIGHT_STATIC_DATA.AIRPORTS.byIataCode` | ⚠️ Limited (5) |

**🔴 DATA GAP: Only 5 airports available. Need comprehensive airport data import.**

### 3.3 Flight Search Results - MIXED

| UI Element | Field ID | Source | API/DB Location | Status |
|------------|----------|--------|-----------------|--------|
| Offer ID | `flight.id` | **REALTIME** | Duffel API `offers[].id` | ✅ API |
| Airline Name | `flight.airline` | **STATIC** | `FLIGHT_STATIC_DATA.AIRLINES` (fallback) | ⚠️ Limited (5) |
| Airline Code | `flight.carrierCode` | **REALTIME** | Duffel API `offers[].owner.iata_code` | ✅ API |
| Airline Logo | `flight.airlineLogo` | **STATIC** | `FLIGHT_STATIC_DATA.AIRLINES.byIataCode[].logo_url` | ⚠️ Limited (5) |
| **Flight Number** | `flight.flightNumber` | **REALTIME** | Duffel API | ✅ API |
| **Origin/Destination** | `flight.origin/destination` | **REALTIME** | Duffel API | ✅ API |
| **Departure/Arrival Time** | `flight.departureTime/arrivalTime` | **REALTIME** | Duffel API | ✅ API |
| **Duration** | `flight.duration` | **REALTIME** | Duffel API | ✅ API |
| **Stops Count** | `flight.stops` | **REALTIME** | Duffel API | ✅ API |
| **Price** | `flight.amount` | **REALTIME** | Duffel API | ✅ API |
| **Currency** | `flight.currency` | **REALTIME** | Duffel API | ✅ API |
| **Included Bags** | `flight.includedBags` | **REALTIME** | Duffel API | ✅ API |
| **Refundable** | `flight.refundable` | **REALTIME** | Duffel API | ✅ API |

### 3.4 Filter Options - STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Stops Filter | `stopsFilter` | **STATIC** | Hardcoded UI options | ✅ Acceptable |
| Airlines Filter | `airlinesFilter` | **STATIC** | Extract from search results | ⚠️ Dynamic from results |

**🔴 HARDCODED TO FIX:**

```typescript
// ❌ CURRENT: Hardcoded airlines in FlightSearch.tsx
{['Emirates', 'Qatar Airways', 'Etihad', 'Lufthansa'].map((airline) => ...)}

// ✅ REQUIRED: Extract unique airlines from search results dynamically
const uniqueAirlines = [...new Set(flights.map(f => f.airline))];
```

---

## 4. Booking Management Page (`BookingManagement.tsx`)

### 4.1 Filters - STATIC + USER INPUT

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Search Query | `filters.q` | USER INPUT | N/A | ✅ N/A |
| Status Filter | `filters.status` | **STATIC** | **MISSING** - Need booking status enum | ❌ Missing |
| Product Filter | `filters.product` | **STATIC** | Hardcoded ['all', 'hotel', 'flight'] | ✅ Acceptable |
| Date Range | `filters.from/to` | USER INPUT | N/A | ✅ N/A |

### 4.2 Booking Table - REALTIME

| UI Element | Field ID | Source | API Endpoint | DB Model |
|------------|----------|--------|--------------|----------|
| Booking ID | `booking.id` | **REALTIME** | `GET /api/bookings` | `Booking.id` |
| Booking Reference | `booking.bookingId` | **REALTIME** | `GET /api/bookings` | `Booking.bookingRef` |
| Product Type | `booking.product` | **REALTIME** | `GET /api/bookings` | `Booking.serviceType` |
| Status | `booking.status` | **REALTIME** | `GET /api/bookings` | `Booking.status` |
| Total Amount | `booking.total.amount` | **REALTIME** | `GET /api/bookings` | `Booking.totalAmount` |
| Currency | `booking.total.currency` | **REALTIME** | `GET /api/bookings` | `Booking.currency` |
| Created Date | `booking.createdAt` | **REALTIME** | `GET /api/bookings` | `Booking.createdAt` |

---

## 5. Booking Detail Page (`BookingDetail.tsx`)

### 5.1 Booking Header - REALTIME

| UI Element | Field ID | Source | API Endpoint | DB Model |
|------------|----------|--------|--------------|----------|
| Booking Reference | `detail.reference` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.bookingRef` |
| Status | `detail.status` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.status` |
| Route Summary | `detail.route` | **REALTIME** | `GET /api/bookings/{id}` | Computed from segments |
| Travel Date | `detail.date` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.travelDate` |

### 5.2 Flight Segments - REALTIME

| UI Element | Field ID | Source | API Endpoint | DB Model |
|------------|----------|--------|--------------|----------|
| Carrier Name | `segment.carrier` | **REALTIME** | `GET /api/bookings/{id}` | `BookingSegment.airline` |
| Flight Number | `segment.code` | **REALTIME** | `GET /api/bookings/{id}` | `BookingSegment.flightNumber` |
| Origin/Destination | `segment.from/to` | **REALTIME** | `GET /api/bookings/{id}` | `BookingSegment.departureAirport/arrivalAirport` |
| Departure/Arrival Time | `segment.times` | **REALTIME** | `GET /api/bookings/{id}` | `BookingSegment.departureTime/arrivalTime` |

### 5.3 Payment Summary - REALTIME

| UI Element | Field ID | Source | API Endpoint | DB Model |
|------------|----------|--------|--------------|----------|
| Base Fare | `payment.baseFare` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.baseAmount` |
| Taxes & Fees | `payment.taxes` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.taxAmount` |
| Markup | `payment.markup` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.markupAmount` |
| Total | `payment.total` | **REALTIME** | `GET /api/bookings/{id}` | `Booking.totalAmount` |

---

## 6. Wallet Page (`Wallet.tsx`)

### 6.1 Wallet Accounts - REALTIME

| UI Element | Field ID | Source | API Endpoint | DB Model |
|------------|----------|--------|--------------|----------|
| Wallet ID | `wallet.id` | **REALTIME** | `GET /api/wallets` | `Wallet.id` |
| Currency | `wallet.currency` | **REALTIME** | `GET /api/wallets` | `Wallet.currency` |
| Current Balance | `wallet.currentBalance` | **REALTIME** | `GET /api/wallets` | `Wallet.balance` |
| Reserved Balance | `wallet.reservedBalance` | **REALTIME** | `GET /api/wallets` | `Wallet.reservedBalance` |

### 6.2 Transaction History - REALTIME

| UI Element | Field ID | Source | API Endpoint | DB Model |
|------------|----------|--------|--------------|----------|
| Transaction ID | `tx.id` | **REALTIME** | `GET /api/wallets/transactions` | `WalletTransaction.id` |
| Type | `tx.type` | **REALTIME** | `GET /api/wallets/transactions` | `WalletTransaction.type` |
| Amount | `tx.amount` | **REALTIME** | `GET /api/wallets/transactions` | `WalletTransaction.amount` |
| Date | `tx.date` | **REALTIME** | `GET /api/wallets/transactions` | `WalletTransaction.createdAt` |

### 6.3 Currency Conversion - STATIC

| UI Element | Field ID | Source | Static Data Location | Status |
|------------|----------|--------|---------------------|--------|
| Exchange Rate | `rate` | **STATIC** | **MISSING** - Need `ExchangeRate` table | ❌ Missing |

**🔴 HARDCODED TO FIX:**

```typescript
// ❌ CURRENT: Hardcoded exchange rates in Wallet.tsx
const rates: Record<string, number> = { USD: 1, EUR: 1.18, GBP: 1.39, AED: 0.27 };

// ✅ REQUIRED: Fetch from ExchangeRate table
const rates = await fetchExchangeRates();
```

---

## 7. Static Data Gap Analysis

### 7.1 Data Currently Available in Static Package

| Category | Items Available | Count |
|----------|-----------------|-------|
| Hotel Chains | `HOTEL_CHAINS` | 8 |
| Hotel Amenities | `HOTEL_AMENITIES` | 20 |
| Hotel Types | `HOTEL_TYPES` | 10 |
| Star Ratings | `STAR_RATINGS` | 5 |
| Popular Destinations | `POPULAR_HOTEL_DESTINATIONS` | 10 |
| Room Types | `ROOM_TYPES` | 10 |
| Board Types | `BOARD_TYPES` | 6 |
| Payment Types | `PAYMENT_TYPES` | 3 |
| View Types | `VIEW_TYPES` | 10 |
| Airports | `FLIGHT_STATIC_DATA.AIRPORTS` | 5 |
| Airlines | `FLIGHT_STATIC_DATA.AIRLINES` | 5 |
| Cabins | `FLIGHT_STATIC_DATA.CABINS` | 4 |
| Currencies | `SHARED_STATIC_DATA.CURRENCIES` | 6 |
| Cities | `SHARED_STATIC_DATA.CITIES` | 5 |
| Countries | `SHARED_STATIC_DATA.COUNTRIES` | 6 |

### 7.2 Data MISSING - Requires Import

| Category | Required Data | DB Model | Priority |
|----------|---------------|----------|----------|
| **Hotel Reviews** | Review data for hotels | `HotelReview` (NEW TABLE) | P0 |
| **Hotel Images** | Image URLs, variants, thumbnails | `HotelImage` | P0 |
| **Room Images** | Room-specific images | `RoomImage` | P0 |
| **Hotel Policies** | Pets, children, cancellation | `CanonicalHotel.metadata` | P0 |
| **Amenity Icons** | Icon component names | `HotelAmenity.icon` | P1 |
| **Destination Images** | Images for popular destinations | `Destination.imageUrl` | P1 |
| **Hotel Count** | Hotels per destination | `Destination.hotelCount` | P1 |
| **Nationalities** | Full list of nationalities | `Country.demonym` | P1 |
| **Titles** | Mr, Mrs, Ms, Dr, etc. | `Title` (NEW TABLE) | P2 |
| **Airports** | Comprehensive airport data (10,000+) | `Airport` (NEW TABLE) | P1 |
| **Airlines** | Comprehensive airline data (500+) | `Airline` (NEW TABLE) | P1 |
| **Exchange Rates** | Live currency rates | `ExchangeRate` | P2 |

### 7.3 Required New Database Tables

```sql
-- Hotel Reviews (User requirement: from static DB)
CREATE TABLE "HotelReview" (
  id TEXT PRIMARY KEY,
  hotel_id TEXT REFERENCES "CanonicalHotel"(id),
  author_name TEXT NOT NULL,
  author_country TEXT,
  rating DECIMAL(2,1) NOT NULL,
  title TEXT,
  review_text TEXT,
  stay_date DATE,
  traveler_type TEXT, -- solo, couple, family, business
  language TEXT DEFAULT 'en',
  helpful_count INTEGER DEFAULT 0,
  source TEXT, -- tripadvisor, booking.com, google, internal
  source_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Titles (for passenger forms)
CREATE TABLE "Title" (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  gender TEXT, -- male, female, neutral
  sort_order INTEGER DEFAULT 0
);

-- Airports (comprehensive)
CREATE TABLE "Airport" (
  iata_code TEXT PRIMARY KEY,
  icao_code TEXT,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  country TEXT NOT NULL,
  country_code TEXT NOT NULL,
  latitude DECIMAL(10,7),
  longitude DECIMAL(10,7),
  timezone TEXT,
  is_active BOOLEAN DEFAULT true
);

-- Airlines (comprehensive)
CREATE TABLE "Airline" (
  iata_code TEXT PRIMARY KEY,
  icao_code TEXT,
  name TEXT NOT NULL,
  logo_url TEXT,
  country_code TEXT,
  is_active BOOLEAN DEFAULT true
);
```

---

## 8. Implementation Priority Checklist

### P0 - Critical (Blocking UI)

- [ ] Create `HotelReview` table and import review data
- [ ] Import hotel images into `HotelImage` table
- [ ] Import room images into `RoomImage` table
- [ ] Add hotel policies to `CanonicalHotel.metadata`
- [ ] Update `HotelDetail.tsx` to use dynamic check-in/out times

### P1 - High Priority

- [ ] Add `icon` field to `HotelAmenity` table
- [ ] Add `imageUrl` and `hotelCount` to `Destination` table
- [ ] Import comprehensive airport data (IATA airports)
- [ ] Import comprehensive airline data (IATA airlines)
- [ ] Create `Title` table for passenger forms
- [ ] Update `HotelSearch.tsx` popular destinations from DB

### P2 - Medium Priority

- [ ] Create exchange rate sync for `ExchangeRate` table
- [ ] Import nationalities from `Country.demonym`
- [ ] Update `Wallet.tsx` to use dynamic exchange rates
- [ ] Update `FlightSearch.tsx` airline filter from results

---

## 9. API Endpoint Mapping Summary

### Static Data Endpoints (From PostgreSQL)

| Endpoint | Data Source | Cache TTL |
|----------|-------------|-----------|
| `GET /static-data/hotels/{id}` | `CanonicalHotel` | 1 hour |
| `GET /static-data/hotels/{id}/images` | `HotelImage` | 1 hour |
| `GET /static-data/hotels/{id}/rooms` | `HotelRoomType` | 1 hour |
| `GET /static-data/hotels/{id}/amenities` | `HotelAmenityMapping` | 1 hour |
| `GET /static-data/hotels/{id}/reviews` | `HotelReview` (NEW) | 1 hour |
| `GET /static-data/destinations` | `Destination` | 24 hours |
| `GET /static-data/destinations/popular` | `Destination` WHERE popular=true | 24 hours |
| `GET /static-data/amenities` | `HotelAmenity` | 24 hours |
| `GET /static-data/board-types` | `BoardType` | 24 hours |
| `GET /static-data/room-types` | `HotelRoomType` (generic) | 24 hours |
| `GET /static-data/airports` | `Airport` (NEW) | Weekly |
| `GET /static-data/airlines` | `Airline` (NEW) | Weekly |
| `GET /static-data/currencies` | `Currency` | Daily |
| `GET /static-data/exchange-rates` | `ExchangeRate` | Hourly |
| `GET /static-data/nationalities` | `Country` | Weekly |
| `GET /static-data/titles` | `Title` (NEW) | Monthly |

### Real-time API Endpoints (External)

| Endpoint | Purpose | Response Time |
|----------|---------|---------------|
| `POST /api/search` | Hotel search with availability | 2-5 seconds |
| `POST /hotels/rates` | Hotel rates & cancellation | 1-3 seconds |
| `POST /rates/prebook` | Hold hotel booking | 1-2 seconds |
| `POST /rates/book` | Confirm hotel booking | 2-4 seconds |
| `POST /search/flights` | Flight search | 3-10 seconds |
| `GET /duffel/seat-maps` | Seat map retrieval | 1-3 seconds |
| `GET /api/bookings` | List bookings | < 500ms |
| `GET /api/bookings/{id}` | Booking details | < 500ms |
| `GET /api/wallets` | Wallet balances | < 500ms |
| `POST /api/payments/*` | Payment processing | 2-5 seconds |

---

## 10. Data Import Requirements

### 10.1 Hotel Data Sources

| Data Type | Source | Import Script |
|-----------|--------|---------------|
| Hotel Master Data | GIATA / Hotelbeds | `services/ingest/src/static-importer.ts` |
| Hotel Images | Supplier APIs | `services/ingest/src/*-importer.ts` |
| Hotel Reviews | Internal / TripAdvisor API | **NEW** - Create importer |
| Room Types | Supplier APIs | Existing importers |
| Amenities | Supplier APIs + Manual | `HotelAmenity.seed.ts` |

### 10.2 Flight Data Sources

| Data Type | Source | Import Script |
|-----------|--------|---------------|
| Airports | OurAirports / IATA | **NEW** - Create importer |
| Airlines | IATA / Clearbit | **NEW** - Create importer |
| Aircraft | IATA / OpenFlights | **NEW** - Create importer |

### 10.3 Reference Data Sources

| Data Type | Source | Import Script |
|-----------|--------|---------------|
| Currencies | ISO 4217 | Manual seed |
| Exchange Rates | Fixer.io / Open Exchange | **NEW** - Create sync job |
| Countries | ISO 3166 | Manual seed |
| Nationalities | ISO 3166 | Manual seed |

---

## Appendix: Current Hardcoded Values to Replace

| Page | Line | Hardcoded Value | Required Action |
|------|------|-----------------|-----------------|
| `HotelSearch.tsx` | 108-111 | Popular destinations array | Fetch from `Destination` WHERE popular=true |
| `HotelDetail.tsx` | 200+ | Check-in/out times | Fetch from `CanonicalHotel` |
| `HotelDetail.tsx` | 250+ | House rules text | Fetch from `CanonicalHotel.metadata` |
| `HotelDetail.tsx` | 300+ | Reviews | Fetch from `HotelReview` table |
| `HotelDetail.tsx` | 150+ | Amenity icons | Fetch from `HotelAmenity.icon` |
| `FlightSearch.tsx` | 80+ | Airline filter list | Extract from search results |
| `Wallet.tsx` | 50+ | Exchange rates | Fetch from `ExchangeRate` table |

---

*Document End - Generated for TripAlfa Booking Engine Data Mapping*
