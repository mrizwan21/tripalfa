# Service-Layer Integration Guide for v2.0 Schema

## Overview

This guide provides TypeScript/Node.js examples for integrating with the new multi-database schema, including:

- Multi-database Prisma client setup
- Hotel detail sync patterns
- Cross-database query examples
- Error handling and validation
- Performance optimization

---

## 1. Multi-Database Client Setup

### Initialize Prisma Clients (packages/shared-database/src/index.ts)

```typescript
import { PrismaClient as LocalClient } from './generated/local';
import { PrismaClient as CoreClient } from './generated/core';
import { PrismaClient as OpsClient } from './generated/ops';
import { PrismaClient as FinanceClient } from './generated/finance';

// Singleton pattern to avoid connection leaks
let localDb: LocalClient;
let coreDb: CoreClient;
let opsDb: OpsClient;
let financeDb: FinanceClient;

export function getLocalDb() {
  if (!localDb) {
    localDb = new LocalClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_LOCAL,
        },
      },
    });
  }
  return localDb;
}

export function getCoreDb() {
  if (!coreDb) {
    coreDb = new CoreClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_CORE,
        },
      },
    });
  }
  return coreDb;
}

export function getOpsDb() {
  if (!opsDb) {
    opsDb = new OpsClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_OPS,
        },
      },
    });
  }
  return opsDb;
}

export function getFinanceDb() {
  if (!financeDb) {
    financeDb = new FinanceClient({
      datasources: {
        db: {
          url: process.env.DATABASE_URL_FINANCE,
        },
      },
    });
  }
  return financeDb;
}

// Convenience exports
export const db = {
  local: getLocalDb,
  core: getCoreDb,
  ops: getOpsDb,
  finance: getFinanceDb,
};

export async function disconnectAll() {
  await Promise.all([
    localDb?.$disconnect(),
    coreDb?.$disconnect(),
    opsDb?.$disconnect(),
    financeDb?.$disconnect(),
  ]);
}
```

### Environment Configuration (.env.example)

```env
# Database connection strings for v2 schema
DATABASE_URL_LOCAL=postgresql://user:password@localhost:5432/tripalfa_local
DATABASE_URL_CORE=postgresql://user:password@localhost:5432/tripalfa_core
DATABASE_URL_OPS=postgresql://user:password@localhost:5432/tripalfa_ops
DATABASE_URL_FINANCE=postgresql://user:password@localhost:5432/tripalfa_finance

# Application
NODE_ENV=development
LOG_LEVEL=info
```

---

## 2. Hotel Query Patterns

### Get Complete Hotel with Details

```typescript
async function getHotelWithDetails(liteapiId: string) {
  const localDb = getLocalDb();

  // Get hotel + details in one query (one-to-one relationship)
  const hotel = await localDb.hotel.hotels.findUnique({
    where: { liteapi_id: liteapiId },
    include: {
      hotel_details: true,
      hotel_images: {
        orderBy: { display_order: 'asc' },
      },
      facilities: {
        include: {
          hotel_facility_map: true,
        },
      },
      rooms: {
        include: {
          room_amenities: {
            include: {
              room_amenity_map: true,
            },
          },
          room_bed_types: true,
        },
      },
      policies: true,
      accessibility: true,
    },
  });

  if (!hotel) {
    throw new NotFoundError(`Hotel ${liteapiId} not found`);
  }

  // Details not yet synced?
  if (!hotel.is_detail_fetched) {
    console.warn(`Hotel ${liteapiId} detail sync pending, returning partial data`);
    // In UI: show loading state or trigger background sync
  }

  return hotel;
}
```

### Search Hotels with Pagination

```typescript
interface SearchHotelsParams {
  countryCode?: string;
  cityId?: string;
  searchText?: string;
  minStars?: number;
  limit?: number;
  offset?: number;
}

async function searchHotels({
  countryCode,
  cityId,
  searchText,
  minStars = 0,
  limit = 20,
  offset = 0,
}: SearchHotelsParams) {
  const localDb = getLocalDb();

  const hotels = await localDb.hotel.hotels.findMany({
    where: {
      ...(countryCode && { iso2_country_code: countryCode }),
      ...(cityId && { city_id: cityId }),
      ...(minStars && { stars: { gte: minStars } }),
      // Full-text search using trigram index
      ...(searchText && {
        OR: [{ name: { search: searchText } }, { city_name: { search: searchText } }],
      }),
    },
    select: {
      id: true,
      liteapi_id: true,
      name: true,
      city_name: true,
      iso2_country_code: true,
      latitude: true,
      longitude: true,
      stars: true,
      main_photo_url: true,
      is_detail_fetched: true,
      // Don't load full details in list view
      hotel_images: {
        take: 1, // Just the main image
        where: { is_default: true },
      },
    },
    orderBy: { name: 'asc' },
    take: limit,
    skip: offset,
  });

  return hotels;
}
```

### Geo-Proximity Search (Requires PostGIS)

```typescript
interface GeoSearchParams {
  latitude: number;
  longitude: number;
  radiusKm?: number;
  limit?: number;
}

async function searchHotelsByProximity({
  latitude,
  longitude,
  radiusKm = 10,
  limit = 20,
}: GeoSearchParams) {
  const localDb = getLocalDb();

  // Raw query using PostGIS distance function
  const hotels = await localDb.$queryRaw`
    SELECT 
      id, 
      liteapi_id, 
      name, 
      city_name,
      latitude,
      longitude,
      stars,
      main_photo_url,
      ST_DistanceSphere(
        ST_MakePoint(${longitude}, ${latitude})::geography,
        ST_MakePoint(longitude, latitude)::geography
      ) / 1000 AS distance_km
    FROM hotel.hotels
    WHERE 
      ST_DWithin(
        ST_MakePoint(${longitude}, ${latitude})::geography,
        ST_MakePoint(longitude, latitude)::geography,
        ${radiusKm * 1000}
      )
    ORDER BY distance_km ASC
    LIMIT ${limit}
  `;

  return hotels;
}
```

---

## 3. Hotel Sync Pattern

### Background Hotel Detail Sync Job

```typescript
async function syncHotelDetails(batchSize = 100) {
  const localDb = getLocalDb();
  const liteapiClient = getLiteAPIClient(); // Your API client

  // Find hotels pending detail fetch
  const hotelsPending = await localDb.hotel.hotels.findMany({
    where: { is_detail_fetched: false },
    select: { id: true, liteapi_id: true },
    take: batchSize,
  });

  console.log(`Found ${hotelsPending.length} hotels pending detail sync`);

  for (const hotel of hotelsPending) {
    try {
      // Fetch hotel details from LiteAPI
      const details = await liteapiClient.getHotelDetails(hotel.liteapi_id);

      // Upsert hotel.hotel_details (one-to-one)
      await localDb.hotel.hotel_details.upsert({
        where: { hotel_id: hotel.id },
        create: {
          hotel_id: hotel.id,
          description: details.intro,
          checkin_time: details.check_in_time,
          checkout_time: details.check_out_time,
          currency_code: details.currency,
          star_rating: details.rating,
          facilities: details.facilities, // JSONB
          terms_and_conditions: details.policies,
          detail_fetched_at: new Date(),
        },
        update: {
          description: details.intro,
          checkin_time: details.check_in_time,
          checkout_time: details.check_out_time,
          currency_code: details.currency,
          star_rating: details.rating,
          facilities: details.facilities,
          terms_and_conditions: details.policies,
          detail_fetched_at: new Date(),
          updated_at: new Date(),
        },
      });

      // Sync images (separate table)
      if (details.images && details.images.length > 0) {
        // Delete old images
        await localDb.hotel.hotel_images.deleteMany({
          where: { hotel_id: hotel.id },
        });

        // Bulk insert new images
        const imagesToInsert = details.images.map((img, idx) => ({
          hotel_id: hotel.id,
          url: img.url,
          thumbnail_url: img.thumbnail_url,
          caption: img.caption,
          display_order: idx,
          is_default: idx === 0, // First image is default
        }));

        await localDb.hotel.hotel_images.createMany({
          data: imagesToInsert,
        });
      }

      // Mark hotel as detail-fetched
      await localDb.hotel.hotels.update({
        where: { id: hotel.id },
        data: {
          is_detail_fetched: true,
          last_synced_at: new Date(),
        },
      });

      console.log(`✓ Synced details for hotel ${hotel.liteapi_id}`);
    } catch (error) {
      console.error(`✗ Failed to sync hotel ${hotel.liteapi_id}:`, error);
      // Continue with next hotel; mark as failed later if needed
    }
  }
}

// Run as scheduled job (e.g., every 6 hours)
// schedule.scheduleJob('0 */6 * * *', () => syncHotelDetails());
```

---

## 4. Booking with Hotel Reference

### Create Hotel Booking (Cross-DB)

```typescript
async function createHotelBooking(data: {
  userId: string;
  companyId: string;
  liteapiHotelId: string;
  checkInDate: Date;
  checkOutDate: Date;
  roomCount: number;
  guestCount: number;
  currency: string;
  totalPrice: number;
}) {
  const coreDb = getCoreDb();
  const localDb = getLocalDb();

  // Step 1: Verify hotel exists in tripalfa_local
  const hotel = await localDb.hotel.hotels.findUnique({
    where: { liteapi_id: data.liteapiHotelId },
    select: { id: true, name: true, is_detail_fetched: true },
  });

  if (!hotel) {
    throw new ValidationError(`Hotel ${data.liteapiHotelId} not found in catalog`);
  }

  // Step 2: Verify user exists in tripalfa_core
  const user = await coreDb.user.findUnique({
    where: { id: data.userId },
  });

  if (!user) {
    throw new ValidationError(`User ${data.userId} not found`);
  }

  // Step 3: Create booking in tripalfa_core (within transaction)
  const booking = await coreDb.$transaction(async tx => {
    // Create the booking
    const newBooking = await tx.booking.create({
      data: {
        user_id: data.userId,
        company_id: data.companyId,
        booking_type: 'HOTEL',
        supplier_type: 'LITEAPI',
        supplier_booking_id: data.liteapiHotelId, // References tripalfa_local.hotel.hotels.liteapi_id
        status: 'CONFIRMED',
        check_in_date: data.checkInDate,
        check_out_date: data.checkOutDate,
        room_count: data.roomCount,
        guest_count: data.guestCount,
        currency: data.currency,
        total_price: new Decimal(data.totalPrice),
        metadata: {
          hotel_name: hotel.name,
          detail_fetched: hotel.is_detail_fetched,
        },
      },
      include: {
        booking_passengers: true,
        booking_segments: true,
      },
    });

    // Create wallet transaction if payment applied
    if (data.totalPrice > 0) {
      await tx.wallet_transaction.create({
        data: {
          wallet_id: user.wallet_id!, // User should have default wallet
          booking_id: newBooking.id,
          transaction_type: 'DEBIT',
          amount: new Decimal(data.totalPrice),
          currency: data.currency,
          description: `Hotel booking: ${hotel.name}`,
          status: 'PENDING',
        },
      });
    }

    return newBooking;
  });

  // Step 4: Publish booking event (for async processing)
  await publishEvent('booking.created', {
    bookingId: booking.id,
    hotelId: hotel.id,
    liteapiId: data.liteapiHotelId,
    hotelDetailsFetched: hotel.is_detail_fetched,
  });

  return booking;
}
```

### Get Booking with Full Hotel Info

```typescript
async function getBookingWithHotel(bookingId: string) {
  const coreDb = getCoreDb();
  const localDb = getLocalDb();

  // Get core booking
  const booking = await coreDb.booking.findUnique({
    where: { id: bookingId },
    include: {
      user: true,
      booking_passengers: true,
      booking_segments: true,
    },
  });

  if (!booking) {
    throw new NotFoundError(`Booking ${bookingId} not found`);
  }

  // If hotel booking, fetch from tripalfa_local
  let hotel = null;
  if (booking.booking_type === 'HOTEL' && booking.supplier_booking_id) {
    hotel = await localDb.hotel.hotels.findUnique({
      where: { liteapi_id: booking.supplier_booking_id },
      include: {
        hotel_details: true,
        hotel_images: {
          where: { is_default: true },
          take: 1,
        },
        city: true,
      },
    });
  }

  return {
    booking,
    hotel,
    hotelUrl: hotel ? `https://your-app.com/hotels/${hotel.liteapi_id}` : null,
  };
}
```

---

## 5. Campaign & Discount Management

### Create Marketing Campaign with Coupons

```typescript
async function createCampaignWithCoupons(data: {
  name: string;
  type: 'internal' | 'marketing' | 'promotion';
  description: string;
  status: 'draft' | 'active' | 'paused' | 'ended';
  startDate: Date;
  endDate: Date;
  coupons: Array<{
    code: string;
    discountValue: number;
    discountType: 'fixed' | 'percentage';
    maxUses?: number;
  }>;
}) {
  const financeDb = getFinanceDb();

  // v2: Single campaigns table (merged campaign + marketing_campaign)
  const campaign = await financeDb.campaign.create({
    data: {
      name: data.name,
      type: data.type, // Discriminator column
      description: data.description,
      status: data.status,
      start_date: data.startDate,
      end_date: data.endDate,
      // All campaign fields consolidated
      discount_coupons: {
        create: data.coupons.map(coupon => ({
          code: coupon.code,
          discount_value: new Decimal(coupon.discountValue),
          discount_type: coupon.discountType,
          max_uses: coupon.maxUses,
          status: 'active',
        })),
      },
    },
    include: {
      discount_coupons: true,
    },
  });

  return campaign;
}
```

### Query Campaign Performance

```typescript
async function getCampaignMetrics(campaignId: string) {
  const financeDb = getFinanceDb();

  const campaign = await financeDb.campaign.findUnique({
    where: { id: campaignId },
    include: {
      discount_coupons: {
        select: {
          id: true,
          code: true,
          discount_value: true,
          discount_type: true,
          status: true,
          coupon_redemptions: {
            select: {
              id: true,
              redeemed_at: true,
            },
          },
        },
      },
    },
  });

  if (!campaign) {
    throw new NotFoundError(`Campaign ${campaignId} not found`);
  }

  // Calculate metrics
  const totalCoupons = campaign.discount_coupons.length;
  const totalRedemptions = campaign.discount_coupons.reduce(
    (sum, c) => sum + c.coupon_redemptions.length,
    0
  );

  return {
    campaign,
    metrics: {
      totalCoupons,
      totalRedemptions,
      redemptionRate: totalCoupons > 0 ? (totalRedemptions / totalCoupons) * 100 : 0,
      byType: {
        internal: campaign.type === 'internal',
        marketing: campaign.type === 'marketing',
        promotion: campaign.type === 'promotion',
      },
    },
  };
}
```

---

## 6. Multi-Database Transactions

### Booking with Wallet + Loyalty + Commission

```typescript
async function completeBookingWithCommission(bookingId: string, supplierId: string) {
  const coreDb = getCoreDb();
  const financeDb = getFinanceDb();

  // Step 1: Get booking and total from core
  const booking = await coreDb.booking.findUnique({
    where: { id: bookingId },
    include: {
      wallet_transactions: true,
      user: true,
    },
  });

  if (!booking) {
    throw new NotFoundError(`Booking ${bookingId} not found`);
  }

  // Step 2: Process in separate transactions (cannot be atomically joined)
  // First transaction: wallet + ledger in core
  const ledgerEntry = await coreDb.$transaction(async tx => {
    // Record wallet transaction
    const walletTxn = await tx.wallet_transaction.update({
      where: { id: booking.wallet_transactions[0].id },
      data: { status: 'COMPLETED' },
    });

    // Add ledger entry with explicit link to transaction AND wallet
    const ledger = await tx.wallet_ledger.create({
      data: {
        wallet_id: booking.user.wallet_id!,
        wallet_transaction_id: walletTxn.id, // FK added in v2
        transaction_type: 'DEBIT',
        amount: walletTxn.amount,
        description: `Booking ${bookingId} completed`,
        balance_after: await calculateWalletBalance(booking.user.wallet_id!, tx),
        recorded_at: new Date(),
      },
    });

    return ledger;
  });

  // Second transaction: commission in finance
  const commission = await financeDb.$transaction(async tx => {
    // Find commission rule for this supplier/booking type
    const rule = await tx.commission_rule.findFirst({
      where: {
        supplier_id: supplierId,
        is_active: true,
      },
    });

    if (!rule) {
      throw new Error(`No active commission rule for supplier ${supplierId}`);
    }

    // Calculate commission
    const amount = booking.total_price.mul(rule.percentage.div(100));

    // Record settlement with links to rule AND booking (v2 improvement)
    const settlement = await tx.commission_settlement.create({
      data: {
        commission_rule_id: rule.id, // NEW: FK to rule
        booking_id: bookingId, // NEW: FK to booking
        supplier_id: supplierId,
        gross_amount: booking.total_price,
        commission_amount: amount,
        net_amount: booking.total_price.minus(amount),
        status: 'PENDING',
        settlement_date: new Date(),
      },
    });

    return settlement;
  });

  return {
    booking,
    ledgerEntry,
    commission,
  };
}

async function calculateWalletBalance(walletId: string, tx: any): Promise<Decimal> {
  const ledger = await tx.wallet_ledger.aggregate({
    where: { wallet_id: walletId },
    _sum: { amount: true },
  });
  return new Decimal(ledger._sum?.amount || 0);
}
```

---

## 7. Error Handling & Validation

### Centralized Error Types

```typescript
export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class CrossDatabaseError extends Error {
  constructor(
    message: string,
    public sourceDb: string,
    public targetDb: string
  ) {
    super(message);
    this.name = 'CrossDatabaseError';
  }
}

// Middleware for catching and logging
export function handleDatabaseErrors(error: unknown) {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === 'P2025') {
      return new NotFoundError('Record not found');
    }
    if (error.code === 'P2002') {
      return new ValidationError(`Unique constraint violation: ${error.meta?.target}`);
    }
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    return new ValidationError(`Invalid query: ${error.message}`);
  }

  return error;
}
```

### Validation Helper

```typescript
async function validateCrossDbReference(
  sourceDb: string,
  targetDb: string,
  targetTable: string,
  referenceKey: string,
  referenceValue: string | number
): Promise<boolean> {
  try {
    let record = null;

    if (targetDb === 'local' && targetTable === 'hotels') {
      record = await getLocalDb().hotel.hotels.findUnique({
        where: { [referenceKey]: referenceValue },
      });
    } else if (targetDb === 'core' && targetTable === 'users') {
      record = await getCoreDb().user.findUnique({
        where: { [referenceKey]: referenceValue },
      });
    }

    if (!record) {
      throw new CrossDatabaseError(
        `Reference not found: ${targetTable}.${referenceKey}=${referenceValue}`,
        sourceDb,
        targetDb
      );
    }

    return true;
  } catch (error) {
    console.error(`Cross-DB validation failed`, error);
    throw error;
  }
}
```

---

## 8. Performance Tips

### 1. Use `select` to minimize data transfer

```typescript
// ❌ SLOW: Fetch entire hotel object
const hotels = await db.local().hotel.hotels.findMany({ take: 100 });

// ✅ FAST: Fetch only needed fields
const hotels = await db.local().hotel.hotels.findMany({
  select: { id: true, name: true, liteapi_id: true, stars: true },
  take: 100,
});
```

### 2. Batch queries with Promise.all

```typescript
// Fetch multiple hotels in parallel
const hotelIds = ['123', '456', '789'];
const hotels = await Promise.all(
  hotelIds.map(id =>
    db.local().hotel.hotels.findUnique({
      where: { id },
      include: { hotel_details: true },
    })
  )
);
```

### 3. Use partial indexes for targeted queries

```typescript
// Leverage partial index on is_detail_fetched=FALSE
const pendingHotels = await db.local().hotel.hotels.findMany({
  where: { is_detail_fetched: false },
  take: 100,
  // Index query planner will use partial index
});
```

### 4. Cache cross-database joins

```typescript
const BOOKING_HOTEL_CACHE = new Map<string, any>();

async function getCachedBookingWithHotel(bookingId: string) {
  const cacheKey = `booking:${bookingId}`;
  if (BOOKING_HOTEL_CACHE.has(cacheKey)) {
    return BOOKING_HOTEL_CACHE.get(cacheKey);
  }

  const result = await getBookingWithHotel(bookingId);
  BOOKING_HOTEL_CACHE.set(cacheKey, result);

  // Invalidate after 5 minutes
  setTimeout(() => BOOKING_HOTEL_CACHE.delete(cacheKey), 5 * 60 * 1000);

  return result;
}
```

---

## 9. Location & Timezone Integration

### Setup

TripAlfa uses two external services for location and timezone detection:

1. **IP Geolocation** (`ipapi.co`)
   - Detects user location from IP address
   - Returns: City, country, coordinates, currency, timezone
   - Free tier: 30,000 requests/month
   - Integration: `services/booking-service/src/lib/geolocation.ts`

2. **Timezone Database** (`timezonedb.com`)
   - Provides timezone information by IP or coordinates
   - Returns: Timezone name, UTC offset, DST information
   - Free tier: 1 request/second, 50 requests/day
   - Integration: `services/booking-service/src/lib/timezone.ts`

### Configuration

Add to `.env` or `.env.local.private`:

```bash
# IP Geolocation API key (from ipapi.co)
IPAPI_API_KEY="your_api_key_here"

# Timezone API key (from timezonedb.com)
VITE_TIMEZONEDB_API_KEY="your_api_key_here"
TIMEZONEDB_API_KEY="your_api_key_here"
```

### Middleware Setup

Add to your main Express app:

```typescript
import {
  createLocationMiddleware,
  injectLocationHeaders,
} from 'services/booking-service/src/middleware/location.middleware';

const app = express();

// Add location detection to all requests
app.use(
  createLocationMiddleware({
    includeTimezone: true,
    includeGeolocation: true,
    cache: true,
  })
);

// Optional: Inject location info into response headers (for debugging)
app.use(injectLocationHeaders);
```

After middleware runs, `req.userLocation` and `req.userTimezone` will be populated:

```typescript
interface UserLocation {
  ip: string;
  city: string;
  region: string;
  country: string;
  countryCode: string;
  latitude: number;
  longitude: number;
  timezone: string;
  currency: string;
  languages: string[];
  flag: string;
  fetchedAt: Date;
  isVpn?: boolean;
}

interface UserTimezone {
  zone: string; // e.g., "America/New_York"
  abbreviation: string; // e.g., "EST"
  offset: number; // e.g., -300 (minutes from UTC)
  isDst: boolean;
  fetchedAt: Date;
  source: 'ip' | 'user_provided';
}
```

### Common Use Cases

#### 1. Personalized Pricing Based on User Location

```typescript
import GeolocationService from '../lib/geolocation';

async function getPriceWithLocalAdjustment(
  basePrice: number,
  userLocation: UserLocation
): Promise<number> {
  const geolocationService = new GeolocationService();

  // Define regional pricing adjustments
  const regionalMultipliers: Record<string, number> = {
    IN: 0.75, // 25% discount for India
    BR: 0.85, // 15% discount for Brazil
    US: 1.0, // Base price for US
    GB: 1.2, // 20% premium for UK
    SG: 1.15, // 15% premium for Singapore
    AE: 1.1, // 10% premium for UAE
  };

  const multiplier = regionalMultipliers[userLocation.countryCode] || 1.0;
  const adjustedPrice = basePrice * multiplier;

  // Optional: Add loyalty discount for frequent travelers from region
  return Math.round(adjustedPrice * 100) / 100;
}

// Usage in controller
app.get('/api/flights/quote', async (req, res) => {
  const basePrice = 450;
  const finalPrice = await getPriceWithLocalAdjustment(basePrice, req.userLocation!);

  res.json({
    base_price: basePrice,
    final_price: finalPrice,
    currency: req.userLocation!.currency,
    applied_discount: basePrice - finalPrice,
  });
});
```

#### 2. Display Times in User's Timezone

```typescript
import TimezoneService from '../lib/timezone';

const timezoneService = new TimezoneService();

// Convert flight times to user's timezone
const flightDetailWithLocalTimes = {
  departure_utc: '2026-04-01T14:00:00Z',
  departure_local: timezoneService.convertTime(
    new Date('2026-04-01T14:00:00Z'),
    'UTC',
    req.userTimezone!.zone
  ).date,
  departure_timezone: req.userTimezone!.zone,
  departure_formatted: `${departureLocal.toLocaleString('en-US', {
    timeZone: req.userTimezone!.zone,
  })} ${req.userTimezone!.abbreviation}`,
};
```

#### 3. Check Availability Based on User Location

```typescript
// Hotels/flights might have location-specific availability
async function getAvailabilityForUserLocation(destinationId: string, userLocation: UserLocation) {
  const db = getLocalDb();

  // Get availability for user's market
  const availability = await db.availability.findFirst({
    where: {
      destination_id: destinationId,
      // Market selection logic could be:
      // - Exact country match
      // - Regional (Asia, Europe, Americas)
      // - Currency-based grouping
      market_country_code: userLocation.countryCode,
    },
  });

  return availability;
}
```

#### 4. Distance-Based Hotel Recommendations

```typescript
import GeolocationService from '../lib/geolocation';

const geolocationService = new GeolocationService();

async function getNearbyHotels(
  userLocation: UserLocation,
  destination: string,
  radiusKm: number = 50
) {
  const db = getLocalDb();

  // Get all hotels in destination
  const hotelsInCity = await db.hotel.hotels.findMany({
    where: { city_name: destination },
    select: {
      id: true,
      name: true,
      latitude: true,
      longitude: true,
      stars: true,
    },
  });

  // Calculate distances and sort
  const hotelsByDistance = hotelsInCity
    .map(hotel => ({
      ...hotel,
      distance_km: geolocationService.getDistanceBetweenCoordinates(
        userLocation.latitude,
        userLocation.longitude,
        hotel.latitude,
        hotel.longitude
      ),
    }))
    .filter(h => h.distance_km <= radiusKm)
    .sort((a, b) => a.distance_km - b.distance_km);

  return hotelsByDistance;
}
```

#### 5. Timezone-Aware Booking Confirmation

```typescript
async function generateBookingConfirmation(bookingId: string, userTimezone: UserTimezone) {
  const booking = await getBooking(bookingId);
  const timezoneService = new TimezoneService();

  // Convert all times to user's timezone for confirmation email
  const confirmation = {
    confirmation_number: booking.confirmation_number,
    flights: booking.flights.map(flight => ({
      ...flight,
      departure_local: timezoneService.convertTime(
        new Date(flight.departure_time),
        'UTC',
        userTimezone.zone
      ),
      arrival_local: timezoneService.convertTime(
        new Date(flight.arrival_time),
        'UTC',
        userTimezone.zone
      ),
    })),
    hotel: {
      ...booking.hotel,
      checkin_local: timezoneService.convertTime(
        new Date(booking.hotel.checkin_time),
        'UTC',
        userTimezone.zone
      ),
      checkout_local: timezoneService.convertTime(
        new Date(booking.hotel.checkout_time),
        'UTC',
        userTimezone.zone
      ),
    },
    user_timezone: userTimezone.zone,
    important_timezone_note: `All times above are in your timezone (${userTimezone.abbreviation}). 
Hotel times are in the destination's local timezone.`,
  };

  return confirmation;
}
```

### Caching Strategy

Both services cache results in Redis (7 days for geolocation, 24 hours for timezone):

```typescript
// These are done automatically by the services, but you can also manually clear:
const geolocationService = new GeolocationService();
await geolocationService.clearCache('192.168.1.1');

// Check cache stats
const stats = await geolocationService.getCacheStats();
console.log(`Cached IPs: ${stats.keysCount}`);
```

### Health Checks

```typescript
import TimezoneService from '../lib/timezone';
import GeolocationService from '../lib/geolocation';

const healthChecks = {
  async checkLocationServices() {
    const geolocationService = new GeolocationService();
    const timezoneService = new TimezoneService();

    const [geoHealth, tzHealth] = await Promise.all([
      geolocationService.healthCheck(),
      timezoneService.healthCheck(),
    ]);

    return {
      geolocation_api: geoHealth ? 'healthy' : 'unhealthy',
      timezone_api: tzHealth ? 'healthy' : 'unhealthy',
    };
  },
};

// Add to your health endpoint
app.get('/api/health', async (req, res) => {
  const status = await healthChecks.checkLocationServices();
  res.json(status);
});
```

### Advanced: Custom Location-Based Pricing Rules

```typescript
interface PricingRule {
  country_code: string;
  discount_percentage: number;
  min_booking_value?: number;
  max_booking_value?: number;
  valid_until?: Date;
  enabled: boolean;
}

async function applyCustomPricingRules(
  basePrice: number,
  userLocation: UserLocation,
  userTimezone: UserTimezone
): Promise<{ price: number; discount_applied: string }> {
  // Get pricing rules for user's country
  const rules = await db.core().pricing_rules.findMany({
    where: {
      country_code: userLocation.countryCode,
      enabled: true,
      valid_until: { gt: new Date() },
    },
  });

  if (!rules.length) {
    return { price: basePrice, discount_applied: 'none' };
  }

  // Apply highest discount
  const bestRule = rules.reduce((prev, current) =>
    (current.discount_percentage || 0) > (prev.discount_percentage || 0) ? current : prev
  );

  const finalPrice = basePrice * (1 - bestRule.discount_percentage / 100);

  return {
    price: finalPrice,
    discount_applied: `${bestRule.discount_percentage}% regional discount`,
  };
}
```

---

## Deployment Checklist

- [ ] All 4 databases created and schemas loaded
- [ ] Prisma schemas reviewed and updated
- [ ] Prisma clients regenerated: `npm run db:generate`
- [ ] All service files import from correct generated clients
- [ ] Cross-database query helpers tested
- [ ] Hotel sync job configured and tested
- [ ] Integration tests pass with new schema
- [ ] Monitoring/alerting configured for `is_detail_fetched` sync status
- [ ] Database backups created before migration
- [ ] Rollback plan documented
- [ ] Team trained on new schema layout
- [ ] **Location & Timezone Services**:
  - [ ] API keys obtained (ipapi.co, timezonedb.com)
  - [ ] Added to `.env` and `.env.example`
  - [ ] Redis configured for caching (both services require Redis)
  - [ ] Timezone/Geolocation middleware integrated in main app
  - [ ] Location-based pricing rules configured (if applicable)
  - [ ] Health checks tested
  - [ ] Rate limits monitored (ipapi: 30k/month free; timezonedb: 1 req/sec)
  - [ ] Fallback behavior tested when API unavailable
