# Static Data Package

## Overview

The Static Data Package provides comprehensive hotel, city, country, and airport data management for the TripAlfa platform. It includes a complete import system for UAE data from LiteAPI and a production-ready REST API server for optimal performance.

## Features

### 🏨 **Hotel Data Management**
- **8,483 UAE Hotels** with complete information
- **Rich Hotel Details**: Images, amenities, descriptions, contacts, reviews, rooms
- **Advanced Search**: By name, location, amenities, ratings, and coordinates
- **Geolocation Support**: Hotels near coordinates with distance calculation

### 🌍 **Geographic Data**
- **67 UAE Cities** with geographic coordinates and timezone information
- **Complete Country Data** with international standards (ISO codes, currencies, etc.)
- **Airport Information** with IATA codes and coordinates

### 🚀 **Production-Ready API**
- **REST API Server** with 15+ endpoints
- **Performance Optimized**: Direct database access bypassing API Gateway
- **Security Features**: Rate limiting, CORS, input validation
- **Monitoring**: Health checks, structured logging, error handling

### 📊 **Advanced Features**
- **Pagination**: Efficient handling of large datasets
- **Filtering**: Advanced filtering by location, ratings, amenities, price
- **Statistics**: System metrics and popular destinations
- **Search**: Full-text search across hotel names and descriptions

## Quick Start

### Installation

```bash
cd packages/static-data
npm install
```

### Start the API Server

```bash
# Development mode
npm run dev

# Production mode
npm start

# With hot reload
npm run dev:watch
```

### API Base URL

```
http://localhost:3002/api
```

## API Endpoints

### Health Check
- `GET /health` - Service health status

### Countries
- `GET /api/countries` - Get all countries
- `GET /api/countries/:continent` - Get countries by continent

### Cities
- `GET /api/cities/:countryCode` - Get cities by country

### Hotels
- `GET /api/hotels` - Get hotels with filtering and pagination
- `GET /api/hotels/:id` - Get hotel by ID
- `GET /api/hotels/:id/full` - Get complete hotel details
- `GET /api/hotels/search/:query` - Search hotels by name/description
- `GET /api/hotels/near/:lat/:lon` - Get hotels near coordinates
- `GET /api/hotels/amenities/:amenities` - Get hotels by amenities

### Popular Destinations
- `GET /api/popular-destinations` - Get popular destinations

### Statistics
- `GET /api/statistics` - Get system statistics

## Data Import

### Import All Data

```bash
npm run import:all
```

### Import Specific Data

```bash
npm run import:countries  # Import UAE countries
npm run import:cities     # Import UAE cities
npm run import:airports   # Import UAE airports
npm run import:hotels     # Import UAE hotels
```

### Import Scripts

- `scripts/import-uae-countries.js` - Import country data
- `scripts/import-uae-cities.js` - Import city data
- `scripts/import-uae-airports.js` - Import airport data
- `scripts/import-uae-hotels.js` - Import hotel data

## Frontend Integration

### Using the API Client

```javascript
import { staticDataApi } from '@tripalfa/static-data';

// Get all UAE hotels
const hotels = await staticDataApi.getUAEHotels();

// Search hotels in Dubai
const dubaiHotels = await staticDataApi.getDubaiHotels();

// Get hotel details
const hotel = await staticDataApi.getHotelById('hotel-id');

// Search hotels by amenities
const hotelsWithPool = await staticDataApi.getHotelsByAmenities(['Pool']);
```

### Example Usage

```javascript
// Hotel search service
import { HotelSearchService } from './lib/examples/hotel-search-example';

const searchService = new HotelSearchService();

// Search for 4+ star hotels in Dubai
const results = await searchService.searchHotels('Dubai', {
    minStars: 4,
    limit: 20,
    sortBy: 'rating',
    sortOrder: 'DESC'
});

console.log(`Found ${results.hotels.length} hotels`);
results.hotels.forEach(hotel => {
    console.log(`${hotel.name} - ${hotel.rating}/10 stars`);
});
```

## Database Schema

### Tables

- **hotel.countries** - Country information with international standards
- **hotel.cities** - City information with geographic data
- **hotel.airports** - Airport information with IATA codes
- **hotel.hotels** - Hotel information with basic details
- **hotel.hotel_images** - Hotel images with types and primary flags
- **hotel.hotel_amenities** - Hotel amenities with categories
- **hotel.hotel_descriptions** - Hotel descriptions in multiple languages
- **hotel.hotel_contacts** - Hotel contact information
- **hotel.hotel_reviews** - Hotel reviews and ratings
- **hotel.hotel_rooms** - Hotel room types and configurations

### Indexes

- Primary keys on all tables
- Foreign key relationships
- Performance indexes on frequently queried fields
- Full-text search indexes on hotel names and descriptions

## Configuration

### Environment Variables

```bash
# Database Configuration
STATIC_DATABASE_URL=postgresql://username:password@hostname:port/database_name

# Server Configuration
STATIC_DATA_PORT=3002
NODE_ENV=production

# CORS Configuration
CORS_ORIGIN=https://your-frontend-domain.com

# Security
API_KEY=your-api-key-here (optional for production)

# Logging
LOG_LEVEL=info
```

### Database Setup

1. **Create Database**:
   ```sql
   CREATE DATABASE staticdatabase;
   CREATE SCHEMA hotel;
   ```

2. **Install Extensions**:
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   CREATE EXTENSION IF NOT EXISTS "pg_stat_statements";
   ```

3. **Run Import Scripts**:
   ```bash
   npm run import:all
   ```

## Performance

### Optimizations

- **Connection Pooling**: Efficient database connection management
- **Query Optimization**: Indexed queries for fast response times
- **Pagination**: Efficient handling of large datasets
- **Caching**: Ready for Redis integration
- **Compression**: Gzip compression for API responses

### Benchmarks

- **Hotel Search**: < 100ms response time
- **City Lookup**: < 50ms response time
- **Country Data**: < 20ms response time
- **Full Hotel Details**: < 200ms response time

## Security

### Features

- **Input Validation**: All inputs validated server-side
- **SQL Injection Protection**: Parameterized queries
- **Rate Limiting**: 1000 requests per 15 minutes per IP
- **CORS**: Configurable CORS settings
- **Security Headers**: Helmet.js security headers

### Best Practices

- Use HTTPS in production
- Implement API key authentication
- Configure firewall rules
- Monitor for suspicious activity
- Regular security audits

## Monitoring

### Health Checks

- **Application Health**: `GET /health`
- **Database Health**: Database connection monitoring
- **Response Times**: API performance metrics
- **Error Rates**: Error tracking and alerting

### Logging

- **Structured Logging**: JSON format logs
- **Request Logging**: All requests logged with timestamps
- **Error Tracking**: Detailed error messages and stack traces
- **Performance Metrics**: Query performance and response times

## Testing

### Unit Tests

```bash
npm test
```

### Integration Tests

```bash
# Requires running API server
npm run test:integration
```

### Test Coverage

- **API Endpoints**: All endpoints tested
- **Error Handling**: Error scenarios covered
- **Performance**: Response time tests
- **Data Validation**: Input validation tests

## Deployment

### Production Deployment

1. **Build the Application**:
   ```bash
   npm run build
   ```

2. **Start the Server**:
   ```bash
   npm start
   ```

3. **Monitor the Application**:
   - Check health endpoint: `GET /health`
   - Monitor logs for errors
   - Track performance metrics

### Docker Deployment

```bash
# Build the image
docker build -t static-data-api .

# Run the container
docker run -d \
  --name static-data-api \
  -p 3002:3002 \
  -e STATIC_DATABASE_URL=your_database_url \
  -e NODE_ENV=production \
  static-data-api
```

### Kubernetes Deployment

See `PRODUCTION_DEPLOYMENT_GUIDE.md` for complete Kubernetes deployment instructions.

## Development

### Code Structure

```
packages/static-data/
├── src/
│   ├── static-data-service.ts    # Core service class
│   ├── server.ts                 # Express API server
│   ├── index.ts                  # Package exports
│   └── scripts/                  # Import scripts
├── scripts/                      # Import and utility scripts
├── tests/                        # Test files
├── API_DOCUMENTATION.md          # Complete API docs
├── PRODUCTION_DEPLOYMENT_GUIDE.md # Deployment guide
└── README.md                     # This file
```

### Development Workflow

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm run dev:watch
   ```

3. **Run Tests**:
   ```bash
   npm test
   ```

4. **Build for Production**:
   ```bash
   npm run build
   ```

### Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for your changes
5. Run the test suite
6. Submit a pull request

## Support

### Documentation

- **API Documentation**: `API_DOCUMENTATION.md`
- **Deployment Guide**: `PRODUCTION_DEPLOYMENT_GUIDE.md`
- **Implementation Summary**: `IMPLEMENTATION_SUCCESS_SUMMARY.md`

### Examples

- **Hotel Search Example**: `src/lib/examples/hotel-search-example.ts`
- **API Client Tests**: `src/lib/api/__tests__/static-data-api.test.ts`
- **Integration Tests**: `src/lib/api/__tests__/static-data-integration.test.ts`

### Issues

For support and questions:

1. Check the documentation
2. Review the test files for usage examples
3. Check the import scripts for data handling
4. Submit an issue with detailed information

## License

MIT License - see LICENSE file for details.

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## Changelog

### v1.0.0
- Initial release with complete UAE data import system
- Production-ready REST API server
- Comprehensive test suite
- Full documentation and examples

## Contact

For questions and support, please contact the TripAlfa development team.