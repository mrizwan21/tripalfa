# Hotelbeds Static Data Integration Documentation

This document describes the integration of Hotelbeds static data into the TripAlfa canonical database.

## Architecture Overview

The integration uses a TypeScript-based importer located in `services/ingest/src/hotelbeds-importer.ts`. This class handles communication with the Hotelbeds API, signature generation, and mapping to canonical models.

## API Credentials & Rotation

To manage Hotelbeds' rate limits, the system supports multiple API credential sets.

### Credential Rotation Logic
The `HotelbedsImporter` maintains an internal index of credential sets. If an API request returns a `429 Too Many Requests` status, the importer automatically:
1. Rotates to the next set of credentials.
2. Retries the request with an exponential backoff.

### Environment Variables
Set the following variables in the root `.env` file:
- `HOTELBEDS_API_KEY`: Primary API key.
- `HOTELBEDS_API_SECRET`: Primary API secret.
- `HOTELBEDS_API_KEY_2`: Secondary API key.
- `HOTELBEDS_API_SECRET_2`: Secondary API secret.

## Syncing Data

Run the following command from `services/ingest` to sync hotels:

```bash
npm run import-static -- hotelbeds-hotels --limit=100
```

## Data Mapping

### Hotel Mapping
Hotelbeds hotel data is mapped to the `CanonicalHotel` model via `mapping-utils.ts`. 

| Hotelbeds Field | Canonical Field | Mapping Logic |
|---|---|---|
| `code` | `external_id` | Direct mapping |
| `name` | `name` | Uses `content` field for multi-lang |
| `address` | `address` | Uses `content` field |
| `coordinates` | `latitude`, `longitude` | Direct mapping |
| `categoryCode` | `star_rating` | Extracted from `*EST` pattern (e.g., `4EST` -> 4) |
| `facilities` | `amenities` | Normalized via `upsertNormalizedAmenities` |
| `images` | `hotel_images` | Mapped to GIATA photo URLs: `http://photos.hotelbeds.com/giata/{path}` |

### Image Normalization
Images are stored in the `hotel_images` table with an MD5 hash of the URL to prevent duplicates.

## Best Practices
- **Rate Limiting**: Always use multiple keys for large imports.
- **Incremental Sync**: The importer supports pagination to fetch data in chunks.
- **Canonical Deduplication**: The system uses fuzzy matching on name and address to link Hotelbeds hotels to existing canonical records from other sources (e.g., GIATA, LiteAPI).
