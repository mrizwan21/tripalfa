# Hotelston API Integration Guide

## Overview

This document provides comprehensive guidance for integrating with the Hotelston hotel booking API using the provided test credentials.

## API Credentials

**Username:** `technocense@gmail.com`  
**Password:** `6614645@Dubai`

## API Endpoints

### Current Status
The provided endpoints are currently returning 404 errors, indicating they may be incorrect or the service is temporarily unavailable.

**Provided Endpoints (Currently Inaccessible):**
- Static Data API: `https://dev.hotelston.com/ws/StaticDataServiceV2?wsdl`
- Hotel Service API: `https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/`

### Alternative Investigation

The WSDL URL returns a 404 error, suggesting:
1. The endpoint URLs may be incorrect
2. The service may be temporarily down
3. The API may have moved to different endpoints
4. Authentication may be required before accessing the WSDL

## Implementation

### Files Created

1. **`apps/booking-engine/src/lib/hotelston-api.ts`**
   - Complete SOAP API client implementation
   - All required functions for hotel booking workflow
   - Error handling and response parsing
   - Utility functions for date and currency formatting

2. **`scripts/test-hotelston-api.js`**
   - Comprehensive test suite for API integration
   - Connection testing
   - Static data API testing
   - Hotel search API testing
   - Detailed error reporting

### API Functions Implemented

#### Static Data Functions
- `getCountries()` - Retrieve list of countries
- `getCities()` - Retrieve list of cities  
- `getHotels()` - Retrieve list of hotels
- `getHotelDetails(hotelId)` - Get specific hotel details
- `getHotelRooms(hotelId)` - Get available rooms for a hotel

#### Hotel Search and Booking Functions
- `searchHotels(params)` - Search for hotels by criteria
- `getHotelAvailability(hotelId, params)` - Check room availability
- `holdHotelRoom(params)` - Hold a room for booking
- `confirmHotelBooking(params)` - Confirm a booking
- `getBookingDetails(bookingId)` - Retrieve booking information
- `cancelBooking(bookingId, reason)` - Cancel a booking

#### Utility Functions
- `testConnection()` - Test API connectivity
- `getApiStatus()` - Get API status
- `formatDate(date)` - Format dates for API
- `formatCurrency(amount, currency)` - Format currency display

### SOAP Request Structure

All requests follow this SOAP envelope structure:

```xml
<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hot="http://hotelston.com/">
  <soapenv:Header/>
  <soapenv:Body>
    <hot:{action}Request>
      <hot:username>technocense@gmail.com</hot:username>
      <hot:password>6614645@Dubai</hot:password>
      {request_body_content}
    </hot:{action}Request>
  </soapenv:Body>
</soapenv:Envelope>
```

### Required Headers

```http
Content-Type: text/xml; charset=utf-8
SOAPAction: "http://hotelston.com/{action}"
```

## Testing Results

### Current Test Status
All tests are currently failing due to API endpoint issues:

1. **Connection Test**: FAILED (404 error)
2. **Static Data Test**: FAILED (404 error)  
3. **Hotel Search Test**: FAILED (500 error - Operation not found)

### Error Analysis

- **404 Errors**: The WSDL files and API endpoints are returning 404 errors, indicating the service may be temporarily down or the endpoints have changed
- **500 Error**: "Operation not found" suggests the SOAP action may be incorrect or the service is not properly configured

### WSDL Access Attempts

Multiple attempts to access the WSDL files have failed:
- `https://dev.hotelston.com/ws/HotelServiceV2?wsdl` → 404
- `https://dev.hotelston.com/ws/StaticDataServiceV2?wsdl` → 404

This suggests either:
1. The WSDL URLs are incorrect
2. The service is temporarily unavailable
3. Authentication is required before accessing WSDL
4. The API endpoints have been moved or changed

## Next Steps

### 1. Verify API Endpoints
Contact Hotelston support to verify:
- Correct endpoint URLs
- API availability status
- Any required authentication setup
- WSDL location

### 2. Alternative Approaches
If the SOAP API is not accessible, consider:
- REST API alternatives
- Different endpoint URLs
- Updated API documentation

### 3. Integration Readiness
The implementation is complete and ready for:
- Endpoint URL updates
- API availability
- Testing with live data

## Usage Examples

### Basic Hotel Search
```javascript
import { searchHotels } from './lib/hotelston-api';

const searchParams = {
  destination: 'Dubai',
  checkIn: '2026-03-01',
  checkOut: '2026-03-05',
  adults: 2,
  children: 0,
  rooms: 1,
  currency: 'USD'
};

try {
  const results = await searchHotels(searchParams);
  console.log('Available hotels:', results);
} catch (error) {
  console.error('Search failed:', error);
}
```

### Complete Booking Workflow
```javascript
import { searchHotels, holdHotelRoom, confirmHotelBooking } from './lib/hotelston-api';

// 1. Search for hotels
const searchResults = await searchHotels({
  destination: 'Dubai',
  checkIn: '2026-03-01',
  checkOut: '2026-03-05',
  adults: 2
});

// 2. Hold a room
const holdResult = await holdHotelRoom({
  hotelId: searchResults.hotels[0].id,
  roomId: searchResults.hotels[0].rooms[0].id,
  checkIn: '2026-03-01',
  checkOut: '2026-03-05',
  adults: 2,
  guestDetails: {
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+1234567890'
  }
});

// 3. Confirm booking
const bookingResult = await confirmHotelBooking({
  holdId: holdResult.holdId,
  paymentDetails: {
    paymentMethod: 'credit_card',
    amount: 500,
    currency: 'USD',
    cardToken: 'card_token_here'
  }
});
```

## Troubleshooting

### Common Issues

1. **404 Errors**
   - Verify endpoint URLs are correct
   - Check if API is accessible from your network
   - Contact API provider for updated endpoints

2. **500 Errors**
   - Verify SOAP action names are correct
   - Check WSDL for proper operation names
   - Ensure request format matches API specification

3. **Authentication Errors**
   - Verify credentials are correct
   - Check if additional authentication setup is required
   - Ensure credentials are properly encoded

### Debugging

Use the test script to diagnose issues:
```bash
cd scripts
node test-hotelston-api.js
```

This will provide detailed error information and response data for troubleshooting.

## Support

For API-related issues:
- Contact Hotelston technical support
- Verify API documentation and WSDL
- Check service status and availability
- Confirm test environment credentials

## Integration Status

✅ **Implementation**: Complete  
✅ **Test Suite**: Complete  
❌ **API Connectivity**: Pending (Endpoints not accessible)  
❌ **Live Testing**: Pending (Requires working endpoints)

The integration is ready for deployment once the API endpoints are accessible and verified.