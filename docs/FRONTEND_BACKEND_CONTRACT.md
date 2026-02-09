# Frontend-Backend Contract: Seat Selection Feature

## Overview

This document formalizes the contract between Frontend and Backend teams for the Seat Selection feature. It defines the API interface, data formats, error handling, and expectations for both sides.

**Effective Date**: February 6, 2026  
**Component**: SeatSelection.tsx (Booking Engine)  
**API Endpoint**: `GET /bookings/flight/seat-maps`  
**Status**: Ready for implementation

---

## Table of Contents

1. [Request Contract](#request-contract)
2. [Response Contract](#response-contract)
3. [Data Type Specifications](#data-type-specifications)
4. [Error Handling Contract](#error-handling-contract)
5. [Business Logic Contract](#business-logic-contract)
6. [Performance Contract](#performance-contract)
7. [Testing Contract](#testing-contract)
8. [Implementation Responsibilities](#implementation-responsibilities)

---

## Request Contract

### Endpoint
```
GET /bookings/flight/seat-maps
```

### Authentication
- **Header**: `Authorization: Bearer {jwt_token}`
- **Backend Requirement**: Validate token and extract userId
- **Frontend Requirement**: Include valid Bearer token in all requests

### Query Parameters

#### Booking Flow (Required)
```typescript
interface BookingFlowRequest {
  offerId: string;      // Offer ID from Duffel API (format: off_[alphanumeric])
  provider: string;     // Always "duffel" for now (allows future provider swaps)
  env: string;          // "sandbox" | "test" | "production"
}

// Example:
GET /bookings/flight/seat-maps?offerId=off_123abc&provider=duffel&env=test
```

#### Post-Booking Flow (Required)
```typescript
interface PostBookingFlowRequest {
  orderId: string;      // Order ID from Duffel API (format: ord_[alphanumeric])
  provider: string;     // Always "duffel" for now
  env: string;          // "sandbox" | "test" | "production"
}

// Example:
GET /bookings/flight/seat-maps?orderId=ord_456xyz&provider=duffel&env=test
```

### Frontend Responsibilities
- ✅ Include valid authentication token
- ✅ Pass correct offerId OR orderId (never both)
- ✅ Specify correct provider ("duffel")
- ✅ Use environment matching current deployment ("test" for staging, "production" for prod)
- ✅ Handle query parameter properly (may use search params API)
- ✅ Retry on network errors (exponential backoff: 1s, 2s, 4s)

### Backend Responsibilities
- ✅ Validate token and authorize access
- ✅ Validate query parameters (required fields, format)
- ✅ Route to correct provider API (Duffel)
- ✅ Handle timeout (max 5 seconds to Duffel API)
- ✅ Cache response for 30 minutes (optional but recommended)
- ✅ Return appropriate HTTP status codes

---

## Response Contract

### Success Response (HTTP 200)

```typescript
interface SeatMapResponse {
  success: true;
  data: {
    seat_maps: SeatMap[];
    aircraft_config: AircraftConfig;
    // Post-booking only:
    current_seats?: CurrentSeatAssignment[];
    order_id?: string;
    booking_ref?: string;
  };
}

// REQUIRED in both modes
interface SeatMap {
  segment_id: string;           // e.g., "seg_001" (must match segment in offer)
  cabin_class: string;          // "economy" | "business" | "first" | "premium_economy"
  deck?: string;                // "lower" | "upper" (only for wide-body)
  cabin: {
    rows: SeatRow[];            // Must include ALL rows, even if all occupied
  };
}

interface SeatRow {
  designator: string;           // Row number: "1", "2", ..., "68"
  issuable_seat_designators: SeatDesignator[];  // All seats in row (order: A, B, C, ...)
}

interface SeatDesignator {
  designator: string;           // Single letter: "A", "B", "C", ...
  available: boolean;           // true = available for booking
  restrictions?: {
    code: string;               // e.g., "OCCUPIED", "LAVATORY", "CREW_REST"
    reason: string;             // Human-readable: "Seat already booked"
  };
}

interface AircraftConfig {
  type: string;                 // Aircraft model: "airbus-320", "boeing-777", etc.
  fuselage_width: "narrow-body" | "wide-body";
  row_pattern: string;          // e.g., "3-3", "3-4-3", "2-4-2"
  cabins: CabinConfig[];
}

interface CabinConfig {
  cabin_class: string;          // Cabin type matching seat_maps
  first_row: number;
  last_row: number;
  seat_pitch: number;           // Distance between rows (inches)
  seat_width: number;           // Width of seat (inches)
}

// POST-BOOKING ONLY
interface CurrentSeatAssignment {
  segment_id: string;
  passenger_id: string;
  current_seat: string;         // e.g., "12A"
  available_seats: string[];    // Seats this passenger can change to
}
```

### Example: Bookingflow Response (Narrow-Body ATR-320)

```json
{
  "success": true,
  "data": {
    "seat_maps": [
      {
        "segment_id": "seg_lhr_cdg_20260306",
        "cabin_class": "economy",
        "cabin": {
          "rows": [
            {
              "designator": "1",
              "issuable_seat_designators": [
                {"designator": "A", "available": true},
                {"designator": "B", "available": false, "restrictions": {"code": "OCCUPIED", "reason": "Seat already booked"}},
                {"designator": "C", "available": true},
                {"designator": "D", "available": true},
                {"designator": "E", "available": true},
                {"designator": "F", "available": true}
              ]
            },
            {
              "designator": "2",
              "issuable_seat_designators": [
                {"designator": "A", "available": true},
                {"designator": "B", "available": true},
                {"designator": "C", "available": true},
                {"designator": "D", "available": true},
                {"designator": "E", "available": true},
                {"designator": "F", "available": true}
              ]
            }
          ]
        }
      }
    ],
    "aircraft_config": {
      "type": "airbus-320",
      "fuselage_width": "narrow-body",
      "row_pattern": "3-3",
      "cabins": [
        {
          "cabin_class": "economy",
          "first_row": 1,
          "last_row": 30,
          "seat_pitch": 31,
          "seat_width": 17.2
        }
      ]
    }
  }
}
```

### Example: Post-Booking Response

```json
{
  "success": true,
  "data": {
    "seat_maps": [
      {
        "segment_id": "seg_lhr_cdg_20260306",
        "cabin_class": "economy",
        "cabin": {
          "rows": [
            {
              "designator": "1",
              "issuable_seat_designators": [
                {"designator": "A", "available": true},
                {"designator": "B", "available": true},
                {"designator": "C", "available": true},
                {"designator": "D", "available": true},
                {"designator": "E", "available": true},
                {"designator": "F", "available": true}
              ]
            }
          ]
        }
      }
    ],
    "aircraft_config": {
      "type": "airbus-320",
      "fuselage_width": "narrow-body",
      "row_pattern": "3-3",
      "cabins": [
        {
          "cabin_class": "economy",
          "first_row": 1,
          "last_row": 30,
          "seat_pitch": 31,
          "seat_width": 17.2
        }
      ]
    },
    "current_seats": [
      {
        "segment_id": "seg_lhr_cdg_20260306",
        "passenger_id": "pass_john_doe",
        "current_seat": "5A",
        "available_seats": ["1A", "1B", "1C", "1D", "1E", "1F", "2A", "2B"]
      },
      {
        "segment_id": "seg_lhr_cdg_20260306",
        "passenger_id": "pass_jane_smith",
        "current_seat": "5B",
        "available_seats": ["1A", "1C", "1D", "1E", "1F", "2A", "2B"]
      }
    ],
    "order_id": "ord_123abc",
    "booking_ref": "TPA456789"
  }
}
```

---

## Data Type Specifications

### TypeScript Type Definitions (Shared)

**Location**: `packages/shared-types/src/seat-selection.types.ts`

```typescript
/**
 * Shared type definitions for Frontend and Backend
 * IMPORTANT: Changes to these types require approval from BOTH teams
 */

export type FuselageWidth = 'narrow-body' | 'wide-body';
export type CabinClass = 'economy' | 'business' | 'first' | 'premium_economy';
export type SeatRestrictionCode = 'OCCUPIED' | 'LAVATORY' | 'GALLEY' | 'CREW_REST' | 'BLOCKED';

export interface SeatMapRequestParams {
  offerId?: string;
  orderId?: string;
  provider: 'duffel';
  env: 'sandbox' | 'test' | 'production';
}

export interface SeatDesignator {
  designator: string;
  available: boolean;
  restrictions?: {
    code: SeatRestrictionCode;
    reason: string;
  };
}

export interface SeatRow {
  designator: string;
  issuable_seat_designators: SeatDesignator[];
}

export interface Cabin {
  rows: SeatRow[];
}

export interface SeatMap {
  segment_id: string;
  cabin_class: CabinClass;
  deck?: 'lower' | 'upper';
  cabin: Cabin;
}

export interface CabinConfig {
  cabin_class: CabinClass;
  first_row: number;
  last_row: number;
  seat_pitch: number;
  seat_width: number;
}

export interface AircraftConfig {
  type: string;
  fuselage_width: FuselageWidth;
  row_pattern: string;
  cabins: CabinConfig[];
}

export interface CurrentSeatAssignment {
  segment_id: string;
  passenger_id: string;
  current_seat: string;
  available_seats: string[];
}

export interface SeatMapResponse {
  success: boolean;
  data?: {
    seat_maps: SeatMap[];
    aircraft_config: AircraftConfig;
    current_seats?: CurrentSeatAssignment[];
    order_id?: string;
    booking_ref?: string;
  };
  error?: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
}
```

---

## Error Handling Contract

### Error Response Format (HTTP 4xx/5xx)

```typescript
interface ErrorResponse {
  success: false;
  error: {
    code: string;                    // Machine-readable error code
    message: string;                 // User-friendly message
    details?: {
      field?: string;                // Which parameter caused error
      hint?: string;                 // How to fix it
      requestId?: string;            // For debugging/logging
    };
  };
}
```

### Error Codes & HTTP Status Meanings

| HTTP | Error Code | Meaning | Frontend Action |
|------|-----------|---------|-----------------|
| 400 | INVALID_PARAMS | Missing/malformed query params | Show form error |
| 400 | INVALID_OFFER_ID | Offer ID format incorrect | Show validation error |
| 400 | INVALID_ORDER_ID | Order ID format incorrect | Show validation error |
| 401 | UNAUTHORIZED | Missing/invalid token | Redirect to login |
| 403 | FORBIDDEN | User not authorized for offer/order | Show access denied |
| 404 | OFFER_NOT_FOUND | Offer doesn't exist or expired | Show "offer expired" error |
| 404 | ORDER_NOT_FOUND | Order doesn't exist | Show "booking not found" error |
| 429 | RATE_LIMITED | Too many requests | Retry after + exponential backoff |
| 500 | INTERNAL_ERROR | Server error | Show "try again later" |
| 503 | PROVIDER_UNAVAILABLE | Duffel API unreachable | Show "temporarily unavailable" |
| 504 | GATEWAY_TIMEOUT | Request timeout | Retry with backoff |

### Example Error Responses

**Missing Required Parameter**:
```json
{
  "success": false,
  "error": {
    "code": "INVALID_PARAMS",
    "message": "Missing required parameter",
    "details": {
      "field": "offerId",
      "hint": "Either offerId (for booking) or orderId (for post-booking) is required"
    }
  }
}
```

**Offer Expired**:
```json
{
  "success": false,
  "error": {
    "code": "OFFER_NOT_FOUND",
    "message": "The selected offer has expired or is no longer available",
    "details": {
      "field": "offerId",
      "hint": "Please search for flights again and select a new offer"
    }
  }
}
```

**Rate Limited**:
```json
{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Too many requests. Please try again later.",
    "details": {
      "hint": "Retry after 30 seconds",
      "retryAfter": 30
    }
  }
}
```

### Frontend Error Handling Expectations
- ✅ Display user-friendly error messages
- ✅ Implement exponential backoff for 429/5xx errors
- ✅ Log error details for debugging
- ✅ Retry transient errors (429, 5xx) automatically
- ✅ Don't retry permanent errors (400, 401, 403, 404)
- ✅ Show loading state while retrying
- ✅ Provide manual "try again" button after 3 auto-retries

### Backend Error Handling Expectations
- ✅ Use appropriate HTTP status codes
- ✅ Include machine-readable error codes
- ✅ Provide helpful error messages
- ✅ Include request ID for debugging
- ✅ Log all errors with context
- ✅ Never expose sensitive data in error messages

---

## Business Logic Contract

### Mode 1: Booking Flow Logic

**Trigger**: User selects a flight and clicks "Book" / "Select Seats"

**Frontend Flow**:
```
1. User clicked fare booking button
2. Extract offerId from offer object
3. Call: GET /bookings/flight/seat-maps?offerId={id}&provider=duffel&env=test
4. Load response into UI
5. User selects seats
6. Continue to passenger details (seats stored in component state)
7. Seats submitted with passenger data in next API call
```

**Backend Flow**:
```
1. Receive request with offerId
2. Validate offerId format
3. Call Duffel API: GET /seat_maps?offer_id={offerId}
4. Extract aircraft type from offer
5. Map to aircraft configuration
6. Transform Duffel response to schema
7. Return response
```

**Data Persistence**:
- Frontend: Seat selection stored IN COMPONENT STATE (not submitted until final booking)
- Backend: No data persistence (stateless - just returns current data)

### Mode 2: Post-Booking Flow Logic

**Trigger**: User navigates to existing booking and clicks "Change Seats"

**Frontend Flow**:
```
1. User entered booking management screen
2. Navigate to seat selection: /seat-selection?mode=post-booking&orderId={id}
3. Call: GET /bookings/flight/seat-maps?orderId={id}&provider=duffel&env=test
4. Load response, highlight CURRENT seats
5. User selects NEW seats (replaces current)
6. Confirm change → Submit to backend
```

**Backend Flow**:
```
1. Receive request with orderId
2. Validate orderId format
3. Fetch order from Duffel
4. Extract current seat assignments
5. Get fresh seat map from Duffel
6. Transform to schema + add current_seats field
7. Return response
```

**Data Persistence**:
- Frontend: Seat selection stored in component state (same as booking flow)
- Backend: Seat changes submitted via DIFFERENT endpoint (not defined in this contract)

### Contract Agreement on Business Logic

**Backend Commits To**:
- ✅ Handle both offerId and orderId in same endpoint
- ✅ Detect mode automatically based on query param
- ✅ Return appropriate data for each mode
- ✅ Include current_seats ONLY in post-booking mode
- ✅ Not modify booking until officially submitted
- ✅ Cache responses appropriately

**Frontend Commits To**:
- ✅ Pass correct parameter (offerId XOR orderId)
- ✅ Respect mode-specific response fields
- ✅ Only show current seats when in post-booking mode
- ✅ Not call this endpoint for final submission
- ✅ Track mode internally for UI differences

---

## Performance Contract

### Response Time SLA

| Operation | P50 | P95 | P99 | Target |
|-----------|-----|-----|-----|--------|
| Booking flow (first call) | 300ms | 800ms | 2000ms | < 1s avg |
| Booking flow (cached) | 100ms | 200ms | 500ms | < 200ms avg |
| Post-booking flow | 400ms | 1000ms | 2500ms | < 1.2s avg |

### Payload Size Limits

| Aircraft | Typical | Max | Limit |
|----------|---------|-----|-------|
| Narrow-body (A320) | 15KB | 30KB | 50KB |
| Wide-body (B777) | 50KB | 150KB | 200KB |
| Regional (E190) | 8KB | 15KB | 30KB |

### Caching Strategy

```typescript
// RECOMMENDED caching approach
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Cache key format
const cacheKey = `seat_map:${offerId || orderId}:${provider}:${env}`;

// Invalidate cache on:
// - User completes booking
// - Order is cancelled
// - 30 minutes expires
```

### Frontend Performance Expectations
- ✅ Component lazy-loads (not in main bundle)
- ✅ Initial render paint < 2 seconds
- ✅ Seat selection click response < 100ms
- ✅ No re-renders on state changes beyond seat list
- ✅ Proper cleanup on unmount (no memory leaks)
- ✅ Mobile-optimized rendering

### Backend Performance Expectations
- ✅ Response time < 500ms with cache hit
- ✅ Response time < 2s on cache miss
- ✅ Handle 100+ concurrent requests
- ✅ Implement request batching for duplicate requests
- ✅ Add logging for slow queries (> 1s)

---

## Testing Contract

### Backend Testing Requirements
- [ ] Unit tests for request validation
- [ ] Unit tests for response transformation
- [ ] Integration tests with mock Duffel API
- [ ] Tests for all error scenarios
- [ ] Tests for both booking and post-booking modes
- [ ] Performance tests (< 500ms response time)
- [ ] Tests with various aircraft types
- [ ] Tests for rate limiting

### Frontend Testing Requirements
- [ ] Unit tests for seat selection state
- [ ] Integration tests with mock API responses
- [ ] Tests for mode detection (booking vs post-booking)
- [ ] Tests for error handling and display
- [ ] Tests for multi-segment flights
- [ ] Performance tests for large seat maps
- [ ] Tests for accessibility (a11y)
- [ ] E2E tests for complete user flows

### Shared Test Data

**Mock Narrow-Body Offer**:
```
offerId: off_narrow_body_test_001
Aircraft: Airbus A320
Layout: 3-3 (6 seats per row, 30 rows)
Occupied Seats: [1A, 2B, 5C, 10A, 15B, 20C]
```

**Mock Wide-Body Offer**:
```
offerId: off_wide_body_test_001
Aircraft: Boeing 777
Layout: 3-4-3 (10 seats per row, 68 rows)
Occupied Seats: [1A, 3D, 8F, 15E, 42K]
```

**Mock Existing Order**:
```
orderId: ord_test_001
Current Seats: [John Doe: 12A, Jane Smith: 12B]
Available Changes: 1-10 (economy) for both
```

---

## Implementation Responsibilities

### Backend Team Responsibilities

**✅ Must Implement**:
1. Endpoint: `GET /bookings/flight/seat-maps`
2. Query parameter validation for offerId + orderId
3. Authorization check (verify user has access)
4. Call Duffel API with proper retry logic
5. Response transformation to exact schema
6. Aircraft configuration mapping
7. Error handling (all codes specified)
8. Request logging
9. Cache layer (optional but recommended)
10. Rate limiting / throttling

**❌ Should NOT**:
- Return raw Duffel response (must transform)
- Expose internal error messages
- Modify booking data before official submission
- Make assumptions about aircraft if not provided
- Return sensitive passenger data

**Timeline**: 5-7 business days  
**Milestones**: 
- Day 1-2: Basic endpoint + booking flow
- Day 3-4: Post-booking mode + aircraft config
- Day 5: Error handling + testing
- Day 6-7: Optimization + caching + staging

### Frontend Team Responsibilities

**✅ Must Implement**:
1. Mode detection (booking vs post-booking) ✓
2. Query parameter handling ✓
3. API integration (with error handling) ✓
4. Component rendering for both modes ✓
5. Seat selection state management ✓
6. Dynamic layout rendering ✓
7. Accessibility compliance (WCAG 2.1 AA)
8. Mobile responsiveness
9. Error display + recovery UI
10. Testing + test data

**❌ Should NOT**:
- Hard-code aircraft configs (use from API) ✓
- Assume specific response format (use types) ✓
- Retry indefinitely (max 3 attempts)
- Cache responses locally
- Submit seats from this endpoint (separate flow)

**Status**: ✅ COMPLETE (component ready)  
**Build Status**: ✅ Compiles successfully  
**Future Work**: Waiting for backend API

### DevOps/Infrastructure Team Responsibilities

**✅ Must Setup**:
1. Deploy backend API to staging/production
2. Configure environment variables
3. Setup monitoring/alerting
4. Configure rate limiting
5. Setup caching layer (Redis/CDN)
6. Deployment pipelines
7. Rollback procedures
8. Health checks

---

## API Version & Compatibility

**Current Version**: 1.0.0  
**Release Date**: February 6, 2026  
**Sunset Date**: TBD (minimum 6 months after v2 release)

### Compatibility Notes
- This contract is FINAL and LOCKED for feature development
- Breaking changes require new major version (2.0.0)
- Non-breaking additions allowed in minor versions (1.1.0, 1.2.0, etc.)
- Deprecated fields require 3-month notice before removal

### Change Management Process
1. Both teams review proposed change
2. Document in CHANGELOG.md
3. Agree on migration path for clients
4. Update this contract document
5. Implement change with version bump
6. Deploy to staging first

---

## Approval & Sign-Off

### Frontend Team
- **Lead**: [Name] - Date: ___________
- **Approval**: ✅ Agreed to terms

### Backend Team
- **Lead**: [Name] - Date: ___________
- **Approval**: ❌ Pending implementation

### DevOps Team
- **Lead**: [Name] - Date: ___________
- **Approval**: ❌ Pending infrastructure setup

### QA Team
- **Lead**: [Name] - Date: ___________
- **Approval**: ❌ Pending testing

---

## Appendix: Quick Reference

### Frontend Integration Code Example

```typescript
// SeatSelection.tsx
import { getSeatMapsForBooking } from '../lib/api';

const loadSeatMap = async () => {
  try {
    const response = await getSeatMapsForBooking(offerId, 'duffel', 'test');
    
    if (!response.success) {
      showError(response.error.message);
      return;
    }

    const { seat_maps, aircraft_config, current_seats } = response.data;
    setSeatMaps(seat_maps);
    setAircraft(aircraft_config);
    
    // Only post-booking has current_seats
    if (current_seats) {
      setCurrentSeats(current_seats);
    }
  } catch (error) {
    showError('Failed to load seats. Please try again.');
  }
};
```

### Backend Implementation Code Example

```typescript
// API handler
app.get('/bookings/flight/seat-maps', async (req, res) => {
  try {
    const { offerId, orderId, provider, env } = req.query;
    
    // Validate params
    if (!offerId && !orderId) {
      return res.status(400).json({
        success: false,
        error: { code: 'INVALID_PARAMS', message: '...' }
      });
    }

    // Check authorization
    const user = getAuthenticatedUser(req);
    // ... verify user has access

    // Determine mode
    const mode = offerId ? 'booking' : 'post-booking';

    // Get seat map
    let seatMapData;
    if (mode === 'booking') {
      seatMapData = await getSeatMapsFromProvider(offerId, provider, env);
    } else {
      seatMapData = await getPostBookingSeatMap(orderId, provider, env);
    }

    // Transform to schema
    const response = transformToSchema(seatMapData, mode);

    res.json({
      success: true,
      data: response
    });
  } catch (error) {
    handleError(res, error);
  }
});
```

---

**Last Updated**: February 6, 2026  
**Contract Version**: 1.0.0  
**Status**: ✅ Ready for Implementation

---

## Document History

| Date | Author | Change |
|------|--------|--------|
| Feb 6, 2026 | Frontend Team | Initial contract creation |
| TBD | Backend Team | Sign-off and implementation plan |
| TBD | All Teams | Final approval |

