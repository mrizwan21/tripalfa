# Static Data Resources: Duffel & LiteAPI

This document outlines the static reference data (Resources) provided by our suppliers and how they map to our local `staticdatabase`.

## Duffel (Flights)

Reference: [Duffel Resources](https://duffel.com/docs/api/airports)

| Resource | Duffel Endpoint | Local Table | Key Fields |
| :--- | :--- | :--- | :--- |
| Airports | `GET /air/airports` | `airports` | `iata_code`, `name`, `city_name`, `country_name`, `latitude`, `longitude` |
| Airlines | `GET /air/airlines` | `airlines` | `iata_code`, `name`, `logo_symbol_url` |
| Aircraft | `GET /air/aircraft` | `aircraft` | `iata_code`, `name` |

## LiteAPI (Hotels)

Reference: [LiteAPI Static Data](https://liteapi.travel/docs/static-data)

| Resource | LiteAPI Endpoint | Local Table | Key Fields |
| :--- | :--- | :--- | :--- |
| Hotels | `GET /data/hotels` | `hotels` | `hotel_id`, `name`, `address`, `stars`, `rating`, `images` |
| Countries | `GET /data/countries` | `countries` | `code`, `name` |
| Cities | `GET /data/cities` | `cities` | `name`, `country_code` |
| Chains | `GET /data/chains` | `hotel_chains` | `id`, `name` |
| Facilities | `GET /data/facilities` | `hotel_facilities` | `id`, `name` |
| Currencies | `GET /data/currencies` | `currencies` | `code`, `name` |
| Hotel Types | `GET /data/hotelTypes` | `hotel_types` | `id`, `name` |

## Local Schema Mapping

### Airports
```sql
CREATE TABLE IF NOT EXISTS airports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    iata_code VARCHAR(3) UNIQUE NOT NULL,
    name VARCHAR(255),
    city_name VARCHAR(255),
    country_code VARCHAR(2),
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6)
);
```

### Hotels
```sql
CREATE TABLE IF NOT EXISTS hotels (
    id VARCHAR(50) PRIMARY KEY, -- LiteAPI ID
    name VARCHAR(255),
    address TEXT,
    city VARCHAR(100),
    country_code VARCHAR(2),
    stars INTEGER,
    rating DECIMAL(3,2),
    image_url TEXT,
    amenities JSONB
);
```

## Ingestion Strategy
1. **Fetch**: Use `static-importer.ts` with supplier API keys.
2. **Transform**: Map JSON response to local schema fields.
3. **Upsert**: Use `ON CONFLICT (iata_code/id) DO UPDATE` to keep data fresh without duplicates.
4. **Trigger**: Manually triggered via GitHub Action or admin CLI.
