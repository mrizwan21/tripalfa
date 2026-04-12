# API Gateway Tab - Design & Implementation Guide

Comprehensive guide for the API Gateway configuration tab in supplier management with environment-aware dynamic forms.

---

## 📋 Overview

The API Gateway tab enables suppliers to configure and manage API integrations with dynamic endpoint mapping based on:

- Selected **Product** (Hotel, Flight, Tours, etc.)
- Deployment **Environment** (Development, Staging, Production)
- **Geography** and **Channel** routing rules
- **Authentication** credentials per environment

---

## 🎯 Key Features

### 1. Multi-Environment Support

```
┌─────────────────────────────────────────┐
│ Environment Selector                    │
├─────────────────────────────────────────┤
│ [Development ○] [Staging ○] [Production ○] │
│                                         │
│ Current: Development (Active)           │
└─────────────────────────────────────────┘
```

**Environment Configurations:**

- **Development**: Sandbox URLs, test credentials, permissive settings, detailed logging
- **Staging**: Pre-production URLs, validated credentials, moderate rate limits, info logging
- **Production**: Live URLs, secure credentials, strict rate limits, warning logging only

### 2. Product-Specific Dynamic Forms

When a product is selected, the form dynamically loads:

```typescript
// Product Selection triggers endpoint configuration
Product Selected: "Hotel"
↓
Load Hotel-specific API endpoints
Load Hotel-specific request/response mappings
Load Hotel-specific validation rules
Load Hotel-specific authentication requirements
```

**Example: Hotel Product Form**

```
┌──────────────────────────────────────────────────────────────┐
│ Configure: Hotel Product API                                 │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ Environment: [Development ▼]                                 │
│                                                              │
│ Base Configuration:                                          │
│ ─────────────────────────────────────────────────────────   │
│ Base URL: [https://api-sandbox.hotel.com] *Required         │
│ API Version: [v2]                                            │
│                                                              │
│ Authentication:                                              │
│ ─────────────────────────────────────────────────────────   │
│ Type: [API Key ▼]                                            │
│ API Key: [••••••••••••••] [🔄 Generate] [Test]             │
│ Key Expires: 2025-12-31                                      │
│                                                              │
│ Endpoints:                                                   │
│ ─────────────────────────────────────────────────────────   │
│ ☐ GET /hotels/search    [Config] [Test] [✓ Active]         │
│ ☐ GET /hotels/{id}      [Config] [Test] [✓ Active]         │
│ ☐ POST /bookings        [Config] [Test] [✓ Active]         │
│ ☐ GET /bookings/{id}    [Config] [Test] [✓ Active]         │
│                                                              │
│ [Save] [Test All] [Preview] [Cancel]                       │
└──────────────────────────────────────────────────────────────┘
```

---

## 🔄 Environment Switching

```mermaid
Current Environment: Development

                    ┌─────────────────┐
                    │  Development    │
                    │ ✓ Sandbox URLs  │
                    │ ✓ Test Creds    │
                    └────────┬────────┘
                             │
                        [Promote]
                             │
                    ┌────────▼────────┐
                    │    Staging      │
                    │ ⚠ Requires Auth │
                    │ ⚠ Extra Tests   │
                    └────────┬────────┘
                             │
                       [Deploy](*)
                             │
                    ┌────────▼────────┐
                    │   Production    │
                    │ 🔒 Secure URLs  │
                    │ 🔒 Prod Creds   │
                    └─────────────────┘

(*) Requires approval + deployment window validation
```

---

## 🏗️ Dynamic Form Structure

### Phase 1: Environment & Product Selection

```
┌─────────────────────────────────────────┐
│ Step 1: Select Environment              │
├─────────────────────────────────────────┤
│ Which environment to configure?          │
│                                         │
│ ○ Development (Sandbox)                 │
│ ○ Staging (Pre-Production)              │
│ ○ Production (Live)                     │
│                                         │
│ [Next]                                  │
└─────────────────────────────────────────┘

        ↓

┌─────────────────────────────────────────┐
│ Step 2: Select Product                  │
├─────────────────────────────────────────┤
│ Which product to configure?              │
│                                         │
│ ☐ Hotel                                 │
│ ☐ Flight                                │
│ ☐ Tours                                 │
│ ☐ Transfers                             │
│ ☐ Activities                            │
│                                         │
│ [Next]                                  │
└─────────────────────────────────────────┘
```

### Phase 2: Base Configuration

Dynamically shows fields based on selected product:

```text
Hotel Product Form:
┌─────────────────────────────────────┐
│ Hotel API - Base Configuration      │
├─────────────────────────────────────┤
│ Base URL: [________________]         │
│ API Version: [v2]                   │
│ Auth Type: [API Key ▼]              │
│ API Key: [____________________]      │
│ Key Expiry: [2025-12-31]            │
│ Rate Limit: [100] req/sec           │
│ Timeout: [10000] ms                 │
│ Require SSL: [✓]                    │
└─────────────────────────────────────┘

Flight Product Form:
┌─────────────────────────────────────┐
│ Flight API - Base Configuration     │
├─────────────────────────────────────┤
│ Base URL: [________________]         │
│ API Version: [v1]                   │
│ Auth Type: [OAuth2 ▼]               │
│ Client ID: [____________________]    │
│ Client Secret: [____________________]│
│ Refresh URL: [____________________]  │
│ Token Expiry: [3600] seconds        │
│ Rate Limit: [50] req/sec            │
│ Timeout: [15000] ms                 │
│ Require SSL: [✓]                    │
└─────────────────────────────────────┘
```

### Phase 3: Endpoint Configuration

```text
┌──────────────────────────────────────────────────────┐
│ Configure Endpoints for Hotel/Development           │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Available Endpoints (from Product spec):            │
│                                                      │
│ [+] GET /hotels/search                              │
│     Required Params: [checkIn] [checkOut] [city]   │
│     Response Maps: [hotelList] [rates] [reviews]   │
│     Timeout: [5000]ms  Retries: [3]                │
│     Cache: [5 minutes] [✓]                         │
│                                                      │
│ [+] GET /hotels/{hotelId}                           │
│     Path Param: {hotelId}                          │
│     Response Maps: [hotelDetail] [facilities]      │
│     Timeout: [3000]ms  Retries: [2]                │
│     Cache: [30 minutes] [✓]                        │
│                                                      │
│ [+] POST /bookings                                  │
│     Request Body: [hotelId] [dates] [guests]      │
│     Response Maps: [bookingId] [confirmation]      │
│     Timeout: [10000]ms  Retries: [1]               │
│     Cache: [✗] (No caching for writes)             │
│                                                      │
│ [+] GET /bookings/{bookingId}                       │
│     Path Param: {bookingId}                        │
│     Response Maps: [booking] [status] [totals]     │
│     Timeout: [5000]ms  Retries: [3]                │
│     Cache: [10 minutes] [✓]                        │
│                                                      │
│ [Add Custom Endpoint] [Save] [Test All]            │
└──────────────────────────────────────────────────────┘
```

### Phase 4: Request/Response Mapping

```text
┌──────────────────────────────────────────────────────┐
│ Request/Response Transformations                     │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Request Transformations:                            │
│ ─────────────────────────────────────────          │
│ checkInDate (Client) → departureDate (Supplier)    │
│ checkOutDate (Client) → returnDate (Supplier)      │
│ numberOfGuests (Client) → numPersons (Supplier)    │
│                                                      │
│ Response Transformations:                           │
│ ─────────────────────────────────────────          │
│ hotel_id → id                                      │
│ hotel_name → name                                  │
│ total_price → totalAmount                          │
│ currency_code → currency                           │
│                                                      │
│ [Add Transformation] [Save]                        │
└──────────────────────────────────────────────────────┘
```

### Phase 5: Geography & Channel Routing

```text
┌──────────────────────────────────────────────────────┐
│ Routing Configuration                                │
├──────────────────────────────────────────────────────┤
│                                                      │
│ Geography Routing:                                  │
│ ─────────────────────────────────────────          │
│ Europe:          [Primary Endpoint ▼] [✓]         │
│ Asia:            [Primary Endpoint ▼] [✓]         │
│ North America:   [Fallback Endpoint ▼] [✓]        │
│ Middle East:     [Primary Endpoint ▼] [⊘]         │
│                                                      │
│ Channel Routing:                                    │
│ ─────────────────────────────────────────          │
│ Web Channel:     [Endpoint 1 ▼] Priority: [1]     │
│ Mobile App:      [Endpoint 2 ▼] Priority: [2]     │
│ B2B API:         [Endpoint 3 ▼] Priority: [1]     │
│ B2C Web:         [Endpoint 1 ▼] Priority: [2]     │
│                                                      │
│ [Save] [Cancel]                                    │
└──────────────────────────────────────────────────────┘
```

---

## 🔐 Authentication per Environment

### Development Environment

```typescript
Configuration: PERMISSIVE
┌────────────────────────────────────┐
│ Development Credentials            │
├────────────────────────────────────┤
│ Type: API Key (Simple)             │
│ Key: sandbox-key-12345             │
│ Secret: Log output: Full Data      │
│ Verify SSL: No (Skip)              │
│ Timeout: 30 seconds (High)         │
└────────────────────────────────────┘
```

### Staging Environment

```typescript
Configuration: VALIDATED
┌────────────────────────────────────┐
│ Staging Credentials                │
├────────────────────────────────────┤
│ Type: OAuth2                       │
│ Client ID: **** staging-001 ****  │
│ Secret: **** hidden ****          │
│ Verify SSL: Yes                    │
│ Timeout: 15 seconds               │
│ Alerts: All errors                │
└────────────────────────────────────┘
```

### Production Environment

```typescript
Configuration: SECURE & STRICT
┌────────────────────────────────────┐
│ Production Credentials             │
├────────────────────────────────────┤
│ Type: OAuth2 + Mutual TLS          │
│ Client ID: **** prod-001 ****     │
│ Secret: **** hidden ****          │
│ Certificate: [prod-cert.pem] ✓    │
│ Verify SSL: Yes (Strict)          │
│ Timeout: 10 seconds (Strict)      │
│ Log Level: Warnings only          │
│ Change Window: Mon-Fri 2-4 AM UTC │
│ Requires Approval: [✓]            │
└────────────────────────────────────┘
```

---

## 🧪 Testing Strategy

### Credentia Test

```
┌────────────────────────────────────┐
│ Test Credentials (Environment)     │
├────────────────────────────────────┤
│                                    │
│ Testing: Development Environment   │
│ ⏳ [████░░░░░░░] Testing...        │
│                                    │
│ Status: Checking connection...     │
│                                    │
│ [Stop]                             │
└────────────────────────────────────┘

Result:
┌────────────────────────────────────┐
│ ✓ Credentials Valid                │
│ Status Code: 200 OK                │
│ Response Time: 1.2 seconds         │
│ Expires: 2025-12-31                │
│                                    │
│ [Done]                             │
└────────────────────────────────────┘
```

### Endpoint Test

```
┌─────────────────────────────────────────────┐
│ Test Endpoint: GET /hotels/search           │
├─────────────────────────────────────────────┤
│                                             │
│ Test with sample data:                      │
│ checkIn: [2025-06-01]                      │
│ checkOut: [2025-06-10]                     │
│ city: [paris]                              │
│                                             │
│ [Run Test]                                  │
│                                             │
│ Result: ✓ Success (200 OK)                  │
│ Response Time: 2.5 seconds                  │
│ Sample Response:                            │
│ {                                           │
│   "hotels": [                               │
│     {"id": 123, "name": "Hotel A", ...}    │
│   ],                                        │
│   "totalResults": 45                        │
│ }                                           │
│                                             │
│ Mapping Check: ✓ All fields mapped          │
└─────────────────────────────────────────────┘
```

### Environment Health Check

```
┌──────────────────────────────────────┐
│ Health Check: Production             │
├──────────────────────────────────────┤
│ Testing all endpoints...             │
│                                      │
│ 🟢 API Connectivity    ✓ OK          │
│ 🟢 Authentication      ✓ Valid       │
│ 🟢 Endpoint Responses  ✓ All OK      │
│ 🟢 Performance         ✓ Normal      │
│ 🟢 Rate Limits         ✓ Available   │
│                                      │
│ Overall: HEALTHY                     │
│ Last Check: 2 minutes ago            │
│                                      │
│ [Details]                            │
└──────────────────────────────────────┘
```

---

## 📊 Visual Status Indicators

### Connection Status

```
🟢 Connected:    All endpoints responding normally
🟡 Degraded:     Some endpoints slow or timeout issues
🔴 Disconnected: Cannot reach API endpoints
⚫ Untested:     Configuration not yet tested
```

### Credential Status

```
🟢 Valid:         Credentials working, no expiry soon
🟡 Expiring:      Less than 7 days until expiry
🔴 Expired:       Credentials no longer valid
⏳ Testing:       Validating credentials
```

### Environment Readiness

```
Development:   🟢 Ready    (Can edit freely)
Staging:       🟡 Ready    (Requires testing before prod)
Production:    🔴 Ready    (Locked, requires approval)
```

---

## 🔄 Environment Promotion Flow

```
Step 1: Test in Development
┌────────────────┐
│ ✓ All tests    │
│   pass         │
└────────┬───────┘
         │
         ↓
Step 2: Promote to Staging
┌────────────────┐
│ ⚠ Auto-tests   │
│   enabled      │
└────────┬───────┘
         │
         ↓
Step 3: Validate in Staging
┌────────────────┐
│ ✓ Integration  │
│   tests pass   │
└────────┬───────┘
         │
         ↓
Step 4: Request Production Approval
┌────────────────┐
│ 👤 Admin       │
│   approves     │
└────────┬───────┘
         │
         ↓
Step 5: Deploy to Production
┌────────────────┐
│ 🔒 Deployed    │
│   (Locked)     │
└────────────────┘
```

---

## 🎨 Design System Integration

### Colors

```
Development:  Blue (#3B82F6) - Safe to experiment
Staging:      Orange (#F97316) - Caution, affects testing
Production:   Red (#EF4444) - Careful, affects live users
Healthy:      Green (#10B981) - All systems operational
Warning:      Yellow (#FBBF24) - Attention needed
Error:        Red (#EF4444) - Critical action required
```

### Typography

- Section Headers: Heading 3 (24px, 600 weight)
- Labels: Body (14px, 500 weight)
- Values: Code (14px, 400 weight, monospace)
- Alerts: Body (14px, 400 weight, status color)

### Spacing

- Section padding: 24px (6 × 4px units)
- Field spacing: 16px (4 × 4px units)
- Component gap: 12px (3 × 4px units)

---

## 🚀 Performance Optimization

```
Lazy Loading:
- Load product endpoints only when product selected
- Load environment-specific config on env switch
- Virtual scrolling for 50+ endpoints

Caching:
- Development: 5 min cache
- Staging: 10 min cache
- Production: 15 min cache

API Calls:
- Batch endpoint tests (max 5 at a time)
- Debounce URL/auth field changes (500ms)
- Cancel previous requests on env switch
```

---

## ♿ Accessibility

- ✅ Keyboard navigation (Tab, Enter, Arrow keys)
- ✅ Screen reader labels on all fields
- ✅ Color-blind friendly indicators (icons + text)
- ✅ Focus management in modals
- ✅ Status updates announced to screen readers
- ✅ Validation messages linked to fields

---

## 📱 Responsive Behavior

```
Mobile (< 640px):
- Stacked tabs (accordion style)
- Full-width fields
- Simplified endpoint view
- Inline test results

Tablet (640-1024px):
- Side-by-side panels
- Multi-column form layout
- Compact endpoint tables

Desktop (> 1024px):
- 3-column layout
- Full details visible
- Comparison views available
- Advanced filtering
```

---

**Status**: ✅ Complete  
**Version**: 1.0  
**Last Updated**: February 2026
