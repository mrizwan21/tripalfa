# Multi-Supplier Hotel Data Architecture

## Overview

This document describes the multi-supplier hotel data architecture that enables importing and managing hotel data from multiple suppliers (Hotelbeds, LITEAPI, Innstant Travel, Duffel, GIATA, etc.) while maintaining a canonical hotel identity.

## Supported Suppliers

|Supplier|Type|Coverage|Status|
|---|---|---|---|
|Hotelbeds|Hotel|Global|Active|
|LITEAPI|Hotel|Global|Active|
|Innstant Travel|Hotel|750k+ hotels|Active|
|Duffel|Flight|Global|Active|
|Amadeus|Flight/Hotel|Global|Active|
|GIATA|Hotel Multi-code|Global|Active|

## Architecture

### Core Principles

1. **Canonical Hotel Identity**: Each physical hotel has one canonical record regardless of how many suppliers provide data for it
2. **Supplier Mapping**: Supplier-specific hotel data is linked to canonical hotels via mapping tables
3. **Incremental Sync**: Support for delta imports with pagination state tracking
4. **Deduplication**: Fuzzy matching on normalized name and address for automatic hotel matching

### Entity Relationship Diagram

```text
+----------------+       +----------------------+       +----------------+
|    Supplier    |<------| SupplierHotelMapping |------>| CanonicalHotel |
+----------------+       +----------------------+       +----------------+
       |                         |                              |
       v                         |                              v
+----------------+               |                    +----------------+
| SupplierSyncLog|               |                    |   HotelImage   |
+----------------+               |                    +----------------+
                                 |                              |
                                 |                              v
                                 |                    +----------------+
                                 +----------->        | HotelDescription|
                                                      +----------------+
                                                              |
                                                              v
                                                      +----------------+
                                                      |  HotelContact  |
                                                      +----------------+
                                                              |
                                                              v
                                                      +----------------+
                                                      | HotelAmenity   |
                                                      |    Mapping     |
                                                      +----------------+
```

## Database Models

### Supplier Registry

#### Supplier

Central registry of all integrated suppliers.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|code|String|Unique supplier code (hotelbeds, liteapi, duffel)|
|name|String|Display name|
|type|String|Service type (hotel, flight, transfer, activity)|
|status|String|active, inactive, suspended|
|apiBaseUrl|String|API endpoint|
|apiKey|String|Encrypted API key|
|apiSecret|String|Encrypted API secret|
|apiCredentials|Json|Multiple credential sets for rate limit rotation|
|rateLimitPerMin|Int|Rate limit per minute|
|rateLimitPerDay|Int|Rate limit per day|
|syncEnabled|Boolean|Enable automatic sync|
|syncInterval|Int|Sync interval in seconds|
|lastSyncAt|DateTime|Last sync timestamp|
|features|Json|Feature flags|

#### SupplierCredential

Multiple API credentials per supplier for rotation.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|supplierId|String|Parent supplier|
|name|String|Credential name (Primary, Secondary)|
|apiKey|String|Encrypted API key|
|apiSecret|String|Encrypted API secret|
|usageCount|Int|Usage counter|
|status|String|active, rate_limited, expired|

#### SupplierSyncLog

Sync tracking for incremental imports.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|supplierId|String|Parent supplier|
|syncType|String|full, incremental, delta|
|dataType|String|hotels, rooms, rates, availability|
|status|String|pending, running, completed, failed|
|totalRecords|Int|Total records to process|
|processedRecords|Int|Records processed|
|createdRecords|Int|New records created|
|updatedRecords|Int|Records updated|
|failedRecords|Int|Failed records|
|paginationState|Json|Last position for resumable imports|

### Canonical Hotel Models

#### CanonicalHotel

Unified hotel identity across all suppliers.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|giataId|String|GIATA multi-code identifier (unique)|
|canonicalCode|String|Internal unique code|
|name|String|Hotel name|
|nameNormalized|String|Lowercase for fuzzy matching|
|description|Text|Hotel description|
|address|String|Street address|
|city|String|City name|
|countryCode|String|ISO 3166-1 alpha-2|
|latitude|Float|Geographic latitude|
|longitude|Float|Geographic longitude|
|starRating|Float|Star rating (1.0-5.0)|
|chainCode|String|Chain code (MAR, HIL, etc.)|
|qualityScore|Decimal|Computed quality (0.00-1.00)|
|status|String|active, inactive, closed|

#### SupplierHotelMapping

Links supplier hotels to canonical hotels.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|canonicalHotelId|String|Canonical hotel reference|
|supplierId|String|Supplier reference|
|supplierHotelId|String|Supplier's hotel code|
|matchType|String|auto, manual, giata|
|matchConfidence|Decimal|Match confidence (0.00-1.00)|
|supplierData|Json|Raw supplier data snapshot|
|lastSyncedAt|DateTime|Last sync timestamp|
|syncStatus|String|pending, synced, error|

#### HotelImage

Hotel images from multiple suppliers.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|canonicalHotelId|String|Canonical hotel reference|
|supplierId|String|Image source supplier|
|url|String|Image URL|
|urlHash|String|MD5 for deduplication|
|imageType|String|exterior, lobby, room, pool, etc.|
|isPrimary|Boolean|Primary image flag|
|displayOrder|Int|Display order|

#### HotelDescription

Hotel descriptions in multiple languages.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|canonicalHotelId|String|Canonical hotel reference|
|languageCode|String|Language code (en, fr, de, ar)|
|descriptionType|String|general, location, amenities, dining|
|content|Text|Description content|

#### HotelContact

Hotel contact information.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|canonicalHotelId|String|Canonical hotel reference|
|contactType|String|main, reservations, groups, events|
|phone|String|Phone number|
|email|String|Email address|
|website|String|Website URL|

### Amenity Models

#### Amenity

Canonical amenity definitions.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|code|String|Unique code (WIFI, POOL, SPA)|
|name|String|Display name|
|category|String|Technology, Recreation, Wellness, Dining|
|icon|String|Icon identifier|
|isPopular|Boolean|Popular amenity flag|

#### HotelAmenityMapping

Mapping of hotel to amenities.

| Field | Type | Description |
| --- | --- | --- |
| id | String | Unique identifier |
| canonicalHotelId | String | Canonical hotel reference |
| amenityId | String | Amenity reference |
| isFree | Boolean | Free or paid |
| operatingHours | String | Operating hours |

#### AmenitySupplierMapping

Supplier-specific amenity code mapping.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|amenityId|String|Canonical amenity reference|
|supplierId|String|Supplier reference|
|supplierCode|String|Supplier's amenity code|

### Room & Board Types

#### HotelRoomType

Hotel room type definitions.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|canonicalHotelId|String|Canonical hotel reference|
|roomTypeCode|String|Internal room type code|
|roomTypeName|String|Room type name|
|bedType|String|king, queen, twin, double|
|maxOccupancy|Int|Maximum occupancy|
|supplierRoomCode|String|Supplier's room code|

#### BoardType

Board type (meal plan) definitions.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|code|String|Unique code (RO, BB, HB, FB, AI)|
|name|String|Display name|
|includesBreakfast|Boolean|Breakfast included|
|includesLunch|Boolean|Lunch included|
|includesDinner|Boolean|Dinner included|

#### BoardTypeSupplierMapping

Supplier-specific board type mapping.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|boardTypeId|String|Board type reference|
|supplierId|String|Supplier reference|
|supplierCode|String|Supplier's board type code|

### Destination Models

#### Destination

Geographic destination hierarchy.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|code|String|Unique destination code|
|name|String|Destination name|
|parentId|String|Parent destination (for hierarchy)|
|level|Int|Hierarchy level (0=country, 1=state, 2=city)|
|destinationType|String|country, state, city, area, airport|
|countryCode|String|ISO country code|
|latitude|Float|Geographic latitude|
|longitude|Float|Geographic longitude|

#### DestinationSupplierMapping

Supplier-specific destination mapping.

|Field|Type|Description|
|---|---|---|
|id|String|Unique identifier|
|destinationId|String|Destination reference|
|supplierId|String|Supplier reference|
|supplierCode|String|Supplier's destination code|

## Setup Instructions

### Step 1: Run Database Migration

```bash
cd database
npx prisma migrate dev --name multi_supplier_hotel_architecture
```

### Step 2: Seed Static Data

Seed suppliers, amenities, board types, and destinations:

```bash
npx tsx prisma/seed-suppliers.ts
```

This will create:

- Supplier records for Hotelbeds, LITEAPI, Duffel, GIATA
- 80+ canonical amenities with Hotelbeds facility code mappings
- Board types (RO, BB, HB, FB, AI, UAI, SC)

### Step 3: Import Hotel Data

Use the Hotelbeds importer to import hotels:

```bash
cd services/ingest
npm run import:hotelbeds -- --type hotels --full
```

For incremental imports:

```bash
npm run import:hotelbeds -- --type hotels --delta --from-last-sync
```

## Usage Examples

### Querying Hotels

```typescript
import { prisma } from '@tripalfa/database';

// Get hotel with all supplier mappings
const hotel = await prisma.canonicalHotel.findFirst({
  where: { canonicalCode: 'HOTEL-DXB-001' },
  include: {
    supplierMappings: {
      include: {
        supplier: true
      }
    },
    images: {
      where: { isPrimary: true }
    },
    amenities: {
      include: {
        amenity: true
      }
    }
  }
});

// Get hotel by supplier ID
const mapping = await prisma.supplierHotelMapping.findFirst({
  where: {
    supplierId: 'hotelbeds',
    supplierHotelId: '12345'
  },
  include: {
    canonicalHotel: true
  }
});
```

### Creating a New Hotel

```typescript
// Create canonical hotel
const hotel = await prisma.canonicalHotel.create({
  data: {
    canonicalCode: 'HOTEL-DXB-001',
    name: 'Atlantis The Palm',
    nameNormalized: 'atlantis the palm',
    city: 'Dubai',
    countryCode: 'AE',
    starRating: 5.0,
    supplierMappings: {
      create: [
        {
          supplierId: 'hotelbeds',
          supplierHotelId: '12345',
          matchType: 'auto',
          matchConfidence: 0.95
        },
        {
          supplierId: 'liteapi',
          supplierHotelId: 'lite-67890',
          matchType: 'giata'
        }
      ]
    }
  }
});
```

### Sync Progress Tracking

```typescript
// Check sync status
const syncLog = await prisma.supplierSyncLog.findFirst({
  where: {
    supplierId: 'hotelbeds',
    dataType: 'hotels',
    status: 'running'
  }
});

console.log(`Progress: ${syncLog.processedRecords}/${syncLog.totalRecords}`);
console.log(`Pagination: ${JSON.stringify(syncLog.paginationState)}`);
```

## Hotelbeds Importer

The Hotelbeds importer service (`services/ingest/src/hotelbeds-importer.ts`) provides:

- **Full Import**: Import all hotels from Hotelbeds
- **Delta Import**: Import only changed hotels since last sync
- **Rate Limit Handling**: Automatic credential rotation
- **Deduplication**: Fuzzy matching for hotel deduplication
- **Progress Tracking**: Resumable imports with pagination state

### Importer Configuration

```typescript
const importer = new HotelbedsImporter({
  supplierId: 'hotelbeds',
  apiBaseUrl: 'https://api.test.hotelbeds.com/hotel-api/3.0',
  credentials: [
    { apiKey: 'key1', apiSecret: 'secret1', name: 'Primary' },
    { apiKey: 'key2', apiSecret: 'secret2', name: 'Secondary' }
  ],
  rateLimitPerSec: 10,
  batchSize: 100
});
```

## Innstant Travel API Integration

The Innstant Travel API is a **search/booking API** (not a static data download API).

### API Endpoints

- **Search API**: `https://connect.mishor5.innstant-servers.com`
- **Booking API**: `https://book.mishor5.innstant-servers.com`
- **Static Data API**: `https://static-data.innstant-servers.com` (appears deprecated)

### Authentication

The API requires both:

- `Aether-application-key`: Application key for search API
- `Aether-access-token`: Access token for booking API

### Search Request Format

```json
{
  "destinations": [{"type": "location", "code": "DXB"}],
  "dates": {"from": "2026-03-15", "to": "2026-03-17"},
  "customerCountry": "AE",
  "pax": {"adults": 2, "children": []},
  "currencies": ["USD"]
}
```

### Importer Service

The Innstant importer service (`services/ingest/src/innstant-importer.ts`) provides:

- **Full Import**: Import hotels from Innstant Travel search results
- **Incremental Import**: Import only changed hotels since last sync
- **Rate Limit Handling**: 60 requests/minute with automatic throttling
- **Image Size Mapping**: Support for multiple image sizes (thumbnail, small, medium, large, original)
- **GIATA Integration**: Automatic matching via GIATA multi-code
- **Room Type Processing**: Import room types with amenities and images

### API Configuration

```bash
# Environment variables
INNSTANT_API_KEY=$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6
INNSTANT_STATIC_URL=https://static-data.innstant-servers.com
```

### Importer Usage

```bash
# Full import
cd services/ingest
npx tsx src/innstant-importer.ts --limit=10000

# Incremental import
npx tsx src/innstant-importer.ts --incremental --from=2024-01-01

# Dry run (test without writing)
npx tsx src/innstant-importer.ts --dry-run --limit=100
```

### Image Size Variants

The Innstant importer supports size-based image mapping:

```typescript
// Images are stored with size variants
{
  url: "https://example.com/hotel_original.jpg",
  sizeVariant: "original",
  width: 1920,
  height: 1080,
  variants: {
    thumbnail: "https://example.com/hotel_thumb.jpg",
    small: "https://example.com/hotel_small.jpg",
    medium: "https://example.com/hotel_medium.jpg",
    large: "https://example.com/hotel_large.jpg",
    original: "https://example.com/hotel_original.jpg"
  }
}
```

## BookingSegment Integration

The `BookingSegment` model now references hotels through:

- `canonicalHotelId` - Reference to CanonicalHotel
- `supplierId` - Reference to Supplier
- `supplierHotelId` - Supplier's hotel ID
- `supplierOfferId` - Supplier's offer/rate key

This provides flexibility to reference hotels from any supplier while maintaining a canonical identity.

## Best Practices

1. **Always use CanonicalHotel for display**: The canonical hotel provides the unified view
2. **Use SupplierHotelMapping for supplier operations**: When making API calls to a specific supplier, use the mapping to get the supplier's hotel ID
3. **Track sync progress**: Always check SupplierSyncLog before starting a new import
4. **Handle rate limits**: Use credential rotation for high-volume imports
5. **Verify matches**: Review low-confidence matches manually

## Future Enhancements

1. **GIATA Integration**: Add GIATA multi-code importer for better hotel matching
2. **Real-time Availability**: Add real-time availability caching
3. **Rate Shopping**: Compare rates across suppliers for the same hotel
4. **Image Deduplication**: Advanced image similarity detection
5. **Review Aggregation**: Aggregate reviews from multiple sources
