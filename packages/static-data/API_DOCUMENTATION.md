# Static Data API Documentation

## Overview

The Static Data API provides REST endpoints for accessing hotel, city, country, and airport data directly from PostgreSQL. This service bypasses the API Gateway for optimal performance and reliability.

## Base URL

```
http://localhost:3002/api
```

## Authentication

No authentication required for development. In production, implement API key authentication as needed.

## Rate Limiting

- 1000 requests per 15 minutes per IP address
- Headers include rate limit information

## Response Format

All responses follow this format:

```json
{
  "success": boolean,
  "data": any,
  "error": string | null,
  "message": string | null
}
```

## Endpoints

### Health Check

#### GET /health

Returns service health status.

**Response:**
```json
{
  "status": "healthy",
  "timestamp": "2026-07-03T03:59:00.000Z",
  "service": "static-data-api",
  "version": "1.0.0"
}
```

### Countries

#### GET /api/countries

Get all countries.

**Query Parameters:**
- None

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "AE",
      "name": "United Arab Emirates",
      "alpha2_code": "AE",
      "alpha3_code": "ARE",
      "numeric_code": 784,
      "demonym": "Emirati",
      "currency_code": "AED",
      "currency_name": "UAE Dirham",
      "currency_symbol": "د.إ",
      "phone_prefix": "+971",
      "continent": "Asia",
      "capital": "Abu Dhabi",
      "population": 9991000,
      "area_km2": 83600.00,
      "timezones": ["Asia/Dubai"],
      "languages": ["ar"]
    }
  ],
  "count": 1
}
```

#### GET /api/countries/:continent

Get countries by continent.

**Path Parameters:**
- `continent`: Continent name (e.g., "Asia", "Europe")

**Response:**
Same as GET /api/countries but filtered by continent.

### Cities

#### GET /api/cities/:countryCode

Get cities by country.

**Path Parameters:**
- `countryCode`: ISO 3166-1 alpha-2 country code (e.g., "AE")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "dubai",
      "name": "Dubai",
      "country_code": "AE",
      "country_name": "United Arab Emirates",
      "latitude": 25.2048,
      "longitude": 55.2708,
      "timezone": "Asia/Dubai",
      "population": 3331420,
      "is_capital": false
    }
  ],
  "count": 1
}
```

### Hotels

#### GET /api/hotels

Get hotels with filtering and pagination.

**Query Parameters:**
- `city`: Filter by city name
- `country`: Filter by country code
- `minStars`: Minimum star rating (0-5)
- `maxStars`: Maximum star rating (0-5)
- `minRating`: Minimum rating (0-10)
- `maxRating`: Maximum rating (0-10)
- `amenities`: Comma-separated list of amenities
- `limit`: Number of results per page (default: 20, max: 100)
- `offset`: Offset for pagination (default: 0)
- `sortBy`: Sort field ("name", "rating", "stars", "price")
- `sortOrder`: Sort order ("ASC", "DESC")

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lpd7009",
      "name": "Canopy by Hilton Dubai Al Seef",
      "city": "Dubai",
      "country": "United Arab Emirates",
      "country_code": "AE",
      "latitude": 25.2697,
      "longitude": 55.2975,
      "stars": 4.0,
      "rating": 9.0,
      "address": "Al Seef Road, Dubai, United Arab Emirates",
      "description": "Boutique hotel in historic Al Seef district",
      "check_in_time": "15:00",
      "check_out_time": "12:00",
      "amenities_count": 15,
      "images_count": 25,
      "created_at": "2026-07-03T03:00:00.000Z",
      "updated_at": "2026-07-03T03:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 8483,
    "limit": 20,
    "offset": 0,
    "pages": 425,
    "currentPage": 1
  }
}
```

#### GET /api/hotels/:id

Get hotel by ID.

**Path Parameters:**
- `id`: Hotel ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "lpd7009",
    "name": "Canopy by Hilton Dubai Al Seef",
    "city": "Dubai",
    "country": "United Arab Emirates",
    "country_code": "AE",
    "latitude": 25.2697,
    "longitude": 55.2975,
    "stars": 4.0,
    "rating": 9.0,
    "address": "Al Seef Road, Dubai, United Arab Emirates",
    "description": "Boutique hotel in historic Al Seef district",
    "check_in_time": "15:00",
    "check_out_time": "12:00",
    "amenities_count": 15,
    "images_count": 25,
    "created_at": "2026-07-03T03:00:00.000Z",
    "updated_at": "2026-07-03T03:00:00.000Z"
  }
}
```

#### GET /api/hotels/:id/full

Get hotel with full details including related data.

**Path Parameters:**
- `id`: Hotel ID

**Response:**
```json
{
  "success": true,
  "data": {
    "hotel": { /* hotel data */ },
    "images": [
      {
        "id": 1,
        "hotel_id": "lpd7009",
        "image_url": "https://example.com/hotel-image.jpg",
        "is_primary": true,
        "image_type": "exterior"
      }
    ],
    "amenities": [
      {
        "id": 1,
        "name": "Free WiFi",
        "category": "Connectivity",
        "is_popular": true
      }
    ],
    "descriptions": [
      {
        "id": 1,
        "hotel_id": "lpd7009",
        "description_type": "general",
        "description_text": "Boutique hotel in historic Al Seef district",
        "language_code": "en"
      }
    ],
    "contacts": [
      {
        "id": 1,
        "hotel_id": "lpd7009",
        "contact_type": "phone",
        "contact_value": "+971 4 123 4567"
      }
    ],
    "reviews": [
      {
        "id": 1,
        "hotel_id": "lpd7009",
        "review_text": "Excellent hotel with great service",
        "rating": 9.5,
        "reviewer_name": "John Doe",
        "review_date": "2026-07-01T00:00:00.000Z"
      }
    ],
    "rooms": [
      {
        "id": 1,
        "hotel_id": "lpd7009",
        "room_type": "Deluxe",
        "room_name": "Deluxe King Room",
        "max_occupancy": 2,
        "bed_type": "King"
      }
    ]
  }
}
```

#### GET /api/hotels/search/:query

Search hotels by name or description.

**Path Parameters:**
- `query`: Search query

**Query Parameters:**
- `limit`: Number of results (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [/* array of hotels */],
  "query": "Dubai",
  "count": 150
}
```

#### GET /api/hotels/near/:lat/:lon

Get hotels near coordinates.

**Path Parameters:**
- `lat`: Latitude
- `lon`: Longitude

**Query Parameters:**
- `radius`: Search radius in kilometers (default: 50)
- `limit`: Number of results (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "lpd7009",
      "name": "Canopy by Hilton Dubai Al Seef",
      "city": "Dubai",
      "country": "United Arab Emirates",
      "country_code": "AE",
      "latitude": 25.2697,
      "longitude": 55.2975,
      "stars": 4.0,
      "rating": 9.0,
      "address": "Al Seef Road, Dubai, United Arab Emirates",
      "distance": 2.5
    }
  ],
  "coordinates": {
    "lat": 25.2697,
    "lon": 55.2975
  },
  "radius": 50,
  "count": 15
}
```

#### GET /api/hotels/amenities/:amenities

Get hotels by amenities.

**Path Parameters:**
- `amenities`: Comma-separated list of amenities

**Query Parameters:**
- `limit`: Number of results (default: 20, max: 100)

**Response:**
```json
{
  "success": true,
  "data": [/* array of hotels */],
  "amenities": ["Free WiFi", "Pool"],
  "count": 120
}
```

### Popular Destinations

#### GET /api/popular-destinations

Get popular destinations (cities with most hotels).

**Query Parameters:**
- `limit`: Number of destinations (default: 10, max: 50)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "city": "Dubai",
      "country": "United Arab Emirates",
      "hotel_count": 4231,
      "average_rating": 8.5
    }
  ],
  "count": 10
}
```

### Statistics

#### GET /api/statistics

Get system statistics.

**Response:**
```json
{
  "success": true,
  "data": {
    "total_hotels": 8483,
    "total_cities": 67,
    "total_countries": 195,
    "average_rating": 8.2,
    "average_stars": 3.8,
    "hotels_by_country": [
      {
        "country": "United Arab Emirates",
        "count": 8483
      }
    ],
    "hotels_by_city": [
      {
        "city": "Dubai",
        "count": 4231
      }
    ]
  }
}
```

## Error Responses

All error responses follow this format:

```json
{
  "success": false,
  "error": "Error type",
  "message": "Detailed error message"
}
```

### Common Error Types

- `Not found`: Resource not found (404)
- `Validation error`: Invalid input parameters (400)
- `Internal server error`: Server error (500)
- `Too many requests`: Rate limit exceeded (429)

## Examples

### Get all UAE hotels in Dubai with 4+ stars

```bash
GET /api/hotels?city=Dubai&minStars=4&country=AE&sortBy=rating&sortOrder=DESC
```

### Search for hotels with pool and free WiFi

```bash
GET /api/hotels/amenities/Pool,Free%20WiFi?limit=10
```

### Get hotels near Burj Khalifa

```bash
GET /api/hotels/near/25.197197/55.274376?radius=5&limit=10
```

### Get hotel details with all related data

```bash
GET /api/hotels/lpd7009/full
```

## Performance Tips

1. **Use filtering**: Always use filters to reduce result sets
2. **Limit results**: Use appropriate limits for pagination
3. **Sort wisely**: Use indexed fields for sorting (rating, stars)
4. **Cache responses**: Implement client-side caching for frequently accessed data
5. **Batch requests**: Use bulk operations when possible

## Security

1. **Input validation**: All inputs are validated server-side
2. **SQL injection protection**: Uses parameterized queries
3. **CORS**: Configurable CORS settings
4. **Rate limiting**: Built-in rate limiting per IP
5. **HTTPS**: Use HTTPS in production

## Monitoring

The API includes health check endpoints and comprehensive logging for monitoring:

- Health endpoint: `/health`
- Request logging: All requests are logged with timestamps
- Error tracking: Detailed error messages and stack traces
- Performance metrics: Response times and query performance

## Development

### Starting the Server

```bash
cd packages/static-data
npm install
npm start
```

### Development with Hot Reload

```bash
npm run dev:watch
```

### Building for Production

```bash
npm run build
```

### Running Tests

```bash
npm test
```

## Support

For support and questions:

- Check the API documentation
- Review the source code in `src/`
- Check the test files for usage examples
- Review the import scripts in `scripts/`