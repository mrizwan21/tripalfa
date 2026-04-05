# Booking Engine Application Structure Analysis

**Date**: March 12, 2026  
**Status**: Complete Exploration of Current Architecture

---

## 1. APPLICATION OVERVIEW

The booking-engine is a **Vite + React SPA** with React Router v7 that provides a
unified interface for flight and hotel bookings. It uses feature-flagging to
enable/disable modules and lazy-loads all page components for performance.

### Key Technologies

- **Framework**: React 19.2.4 + React Router 7.13.0
- **Build**: Vite 4.x
- **Styling**: TailwindCSS 4.1.18 + custom components (shadcn/ui)
- **Forms**: React Hook Form 7.71.1 + Zod 4.3.6
- **State**: TanStack React Query 5.90.21
- **UI**: Lucide React icons, Framer Motion animations
- **Maps**: Mapbox GL 3.18.1

---

## 2. CURRENT PAGE/ROUTE STRUCTURE

### 2.1 Route Hierarchy

```text
/
├── Authentication (no layout wrapper)
│   ├── /login                    → Login.tsx
│   ├── /register                 → Register.tsx
│   ├── /forgot-password          → ForgotPassword.tsx
│   └── /auth/callback            → AuthCallback.tsx
│
├── Main Layout Routes (with Layout wrapper)
│   ├── /dashboard                → Dashboard.tsx
│   ├── /loyalty                  → Loyalty.tsx
│   ├── /profile                  → Profile.tsx
│   ├── /account-settings         → AccountSettings.tsx
│   ├── /notifications            → Notifications.tsx
│   ├── /settings/notifications   → NotificationPreferencesPage.tsx
│   ├── /alerts                   → Alerts.tsx
│   ├── /bookings                 → BookingManagement.tsx
│   ├── /bookings/:id             → BookingDetail.tsx
│   ├── /wallet                   → Wallet.tsx (feature-flagged)
│   ├── /wallet/topup             → WalletTopUp.tsx (feature-flagged)
│   ├── /wallet/transfer          → WalletTransfer.tsx (feature-flagged)
│   ├── /help                     → HelpCenter.tsx
│   └── /destinations/:slug       → DestinationPage.tsx
│
├── Flight Booking Routes
│   ├── /flights                  → FlightHome.tsx (search form)
│   ├── /flights/search           → FlightSearch.tsx (search results/filtering - LEGACY)
│   ├── /flights/list             → FlightList.tsx (search results display)
│   ├── /flights/detail           → FlightDetail.tsx (single flight view)
│   ├── /flights/addons           → FlightAddons.tsx
│   └── /flights/duffel           → DuffelFlightsPage.tsx
│
├── Hotel Booking Routes
│   ├── /hotels                   → HotelHome.tsx (search form)
│   ├── /hotels/search            → HotelSearch.tsx (search results/filtering - LEGACY)
│   ├── /hotels/list              → HotelList.tsx (search results display)
│   ├── /hotels/:id               → HotelDetail.tsx (single hotel view)
│   └── /hotels/addons            → HotelAddons.tsx
│
├── Booking Flow Routes (independent from main layout)
│   ├── /seat-selection           → SeatSelection.tsx (feature-flagged)
│   ├── /passenger-details        → PassengerDetails.tsx
│   ├── /checkout                 → BookingCheckout.tsx
│   ├── /confirmation             → BookingConfirmation.tsx
│   └── /add-ons                  → AddOns.tsx (feature-flagged)
│
└── Standalone Card Routes
    ├── /booking-card/:id         → BookingCard.tsx
    └── /hotel-booking-card/:id   → HotelBookingCard.tsx
```

### 2.2 Feature-Gated Routes

The app uses a **FeatureRoute** wrapper component to enable/disable routes based on tenant config:

```typescript
<FeatureRoute
  enabled={runtimeConfig.features.flightBookingEnabled}
  redirectTo={defaultLandingRoute}
>
  <FlightHome />
</FeatureRoute>
```

**Configurable Features**:

- `flightBookingEnabled` - Enable/disable all flight features
- `hotelBookingEnabled` - Enable/disable all hotel features
- `walletEnabled` - Enable/disable wallet module
- `walletTopupEnabled` - Enable wallet top-up functionality
- `seatSelectionEnabled` - Enable seat selection during booking
- `ancillariesEnabled` - Enable ancillary services (add-ons)

---

## 3. LAYOUT & STRUCTURE OF EXISTING PAGES

### 3.1 Page Types

#### A. **Search/Home Pages** (FlightHome, HotelHome)

- Full-screen hero section with gradient background
- Search form with autocomplete inputs
- Popular destinations carousel
- Tab-based destination filtering
- **Navigation**: From here, users navigate to `/flights/list` or `/hotels/list` with query params

**FlightHome.tsx Example**:

```typescript
const handleSearch = () => {
  const params = new URLSearchParams();
  params.set('origin', fromCode);
  params.set('destination', toCode);
  params.set('departureDate', format(departureDate, 'yyyy-MM-dd'));

  navigate(`/flights/list?${params.toString()}`);
};
```

#### B. **Results Pages** (FlightList, HotelList)

- **Purpose**: Display filtered search results
- **Data Loading**:
  - From location state (passed via navigation)
  - From URL search params
  - From API calls using search params
- **Features**:
  - Advanced filtering (price, stops, airlines, time, amenities)
  - Sorting (price, duration, departure time)
  - Map view and list view
  - Pagination/infinite scroll
  - Modify search capability

**Data Flow in FlightList**:

```typescript
// 1. First check for navigation state
if (location.state?.flights) {
  setFlights(location.state.flights);
}

// 2. Fall back to URL params
const origin = searchParams.get('origin');
const destination = searchParams.get('destination');
const departureDate = searchParams.get('departureDate');

// 3. Fetch if needed
if (origin && destination && departureDate) {
  // Fetch flights from API
  searchFlights(origin, destination, departureDate);
}
```

#### C. **Detail Pages** (FlightDetail, HotelDetail)

- **Input**: Flight/hotel ID or Duffel offer ID from props/params
- **Display**:
  - Full flight itinerary with segments
  - Amenities and inclusions
  - Pricing breakdown
  - Fare rules and terms
- **Action**: Select and proceed to passenger details

**FlightDetail Navigation**:

```typescript
// Gets data from location.state or fetches by ID
const id = searchParams.get('id');
const offerId = searchParams.get('offerId');
const flight = location.state?.flight || fetchFlightById(id);
```

#### D. **Booking Flow Pages**

1. **PassengerDetails** - Collect passenger information
2. **SeatSelection** - Choose seats (flights only)
3. **AddOns** - Select ancillary services (meals, baggage, etc.)
4. **BookingCheckout** - Payment and order confirmation
5. **BookingConfirmation** - Order complete with booking reference

These are **standalone pages** (not inside main layout) for focused user experience.

### 3.2 Layout Components

**Main Layouts**:

1. **Layout.tsx** - Main app layout with header, sidebar, footer
   - Used for: Dashboard, profile, bookings, wallet, account settings, etc.
   - Includes: Navigation header, sidebar, content area

2. **TripLogerLayout.tsx** - Booking-focused layout
   - Used for: Home, search, results, detail pages
   - Includes: Custom header, booking stepper, footer
   - Full-width content area

---

## 4. COMPONENT ORGANIZATION

### 4.1 Directory Structure

```text
src/components/
├── layout/
│   ├── Layout.tsx           (main app layout)
│   ├── TripLogerLayout.tsx (booking layout)
│   ├── Header.tsx
│   ├── Sidebar.tsx
│   └── Footer.tsx
│
├── ui/
│   ├── button.tsx
│   ├── card.tsx
│   ├── SearchAutocomplete.tsx
│   ├── TravelerSelector.tsx
│   ├── CabinSelector.tsx
│   ├── GuestSelector.tsx
│   ├── DualMonthCalendar.tsx
│   ├── BookingStepper.tsx
│   └── ... (shadcn/ui components)
│
├── flight/
│   ├── FareCard.tsx
│   ├── FlightSearchWaitPage.tsx
│   ├── SeatSelection.tsx
│   ├── DuffelFlightResults.tsx
│   └── ... (flight-specific UI)
│
├── hotel/
│   ├── HotelCard.tsx
│   ├── HotelSearchFilters.tsx
│   ├── HotelSearchWaitPage.tsx
│   ├── Facilities.tsx
│   ├── ImageGallery.tsx
│   ├── RoomList.tsx
│   └── ... (hotel-specific UI)
│
├── booking/
│   ├── BookingCard.tsx
│   ├── BookingFilters.tsx
│   ├── BookingList.tsx
│   ├── BookingStepper.tsx
│   ├── ModifySearchPanel.tsx
│   ├── PassengerForm.tsx
│   └── sections/ (booking form sections)
│
├── payment/
│   ├── PaymentMethodSelector.tsx
│   ├── CardPaymentProcessor.tsx
│   ├── CombinedPaymentFlow.tsx
│   └── ... (payment integration)
│
├── map/
│   ├── FlightMap.tsx
│   ├── AnimatedFlightMap.tsx
│   ├── HotelMap.tsx
│   └── ... (mapbox integration)
│
├── providers/
│   ├── TenantRuntimeProvider.tsx (config provider)
│   └── ... (context providers)
│
├── modals/
│   ├── FlightDetailPopup.tsx
│   ├── FareUpsellPopup.tsx
│   ├── SeatSelectionPopup.tsx
│   └── ... (modal dialogs)
│
└── shared/
    ├── ErrorBoundary.tsx
    ├── Notifications/ (notification system)
    └── ... (shared utilities)
```

### 4.2 Component Patterns

**UI Components** (`src/components/ui/`)

- Reusable, headless components
- Examples: `SearchAutocomplete`, `DualMonthCalendar`, `TravelerSelector`
- Used across flight and hotel booking flows

**Feature Components** (`src/components/flight/`, `src/components/hotel/`)

- Domain-specific UI
- Examples: `FareCard.tsx`, `HotelCard.tsx`, `Facilities.tsx`
- Used within their respective feature pages

**Layout Components** (`src/components/layout/`)

- Page structure and navigation
- Examples: `TripLogerLayout`, `Layout`
- Each page selects appropriate layout

---

## 5. SEARCH FLOW & RESULTS NAVIGATION

### 5.1 Flight Search Flow

```text
1. FlightHome (/flights)
   ├─ User fills search form
   ├─ Selects: Origin, Destination, Dates, Passengers, Cabin
   └─ Clicks "Search"
      ↓
2. Navigate to /flights/list?origin=AMS&destination=JFK&departureDate=2026-04-01&adults=2&children=0&cabin=economy
   ├─ FlightList page loads
   ├─ Extracts search params from URL
   ├─ Calls API to fetch flights
   └─ Displays list with filters
      ↓
3. User filters results (price, stops, airlines, etc.)
   └─ Updates URL params, keeps state in-sync
      ↓
4. User clicks flight in list
   ├─ Navigate to /flights/detail?id=<flightId>&adults=2&children=0&...
   ├─ FlightDetail loads flight data
   ├─ Displays full itinerary, pricing, fare rules
   └─ User sees "Select" button
      ↓
5. User clicks "Select"
   ├─ Store flight selection in state/context
   ├─ Navigate to /passenger-details
   └─ Begin booking flow
```

### 5.2 Hotel Search Flow

```text
1. HotelHome (/hotels)
   ├─ User fills search form
   ├─ Selects: Location, Check-in, Check-out, Guests
   └─ Clicks "Search"
      ↓
2. Navigate to /hotels/list?location=Dubai&checkin=2026-04-01&checkout=2026-04-05&adults=2
   ├─ HotelList page loads
   ├─ Extracts search params from URL
   ├─ Calls LiteAPI to fetch hotels
   └─ Displays list with filters
      ↓
3. User filters results (price, amenities, hotel type, rating, etc.)
   └─ Updates URL params, keeps state in-sync
      ↓
4. User clicks hotel in list
   ├─ Navigate to /hotels/:hotelId
   ├─ HotelDetail loads hotel data
   ├─ Displays photos, description, facilities, room types, pricing
   └─ User sees room selection
      ↓
5. User selects room and clicks "Book"
   ├─ Store hotel + room selection in state/context
   ├─ Navigate to /passenger-details
   └─ Begin booking flow
```

### 5.3 Universal Booking Flow

After selecting a flight or hotel:

```text
/passenger-details
  ├─ Collect passenger/guest info
  └─ Next button
     ↓
/seat-selection (for flights only, if enabled)
  ├─ Select seats for selected flight
  └─ Next button
     ↓
/add-ons (if ancillaries enabled)
  ├─ Add meals, baggage, lounge access, etc.
  └─ Next button
     ↓
/checkout
  ├─ Review booking
  ├─ Select payment method
  └─ Confirm order
     ↓
/confirmation
  ├─ Order confirmation
  └─ Booking reference & next steps
```

---

## 6. DATA FLOW & STATE MANAGEMENT

### 6.1 Static Data Bootstrap

The app bootstraps **13 critical static data sets** on mount via `useBootstrapStaticData()`:

```typescript
// In App.tsx
useBootstrapStaticData(); // Prefetches all static data
```

**Cached Data** (from backend `/api/static/` endpoints):

1. Airports
2. Airlines
3. Countries
4. Currencies
5. Hotel amenities
6. Hotel types
7. Airport facilities
8. Airline alliances
9. Aircraft types
10. Destinations
11. Popular destinations
12. Terms & conditions
13. Privacy policy

### 6.2 Search State Management

**Per-Page State**:

- FlightList uses `useState` for filters, sorting, flights array
- HotelList uses custom hooks (`useLiteApiHotels`) for API state

**URL as Source of Truth**:

- All search params stored in URL query string
- State synced with URL using `useSearchParams()`
- Users can share search links

**API Integration**:

- TanStack React Query for API caching
- Custom hooks: `useLiteApiHotels()`, `useFlightSearch()`, etc.

### 6.3 Booking State Management

**Multi-Step State** (across booking flow pages):

- Stored in location.state during navigation
- Persisted in context/session storage for page refreshes
- Clear on booking completion

---

## 7. EXISTING COMPONENT USE PATTERNS

### 7.1 Search/Filter Components

**BookingFilters.tsx**

- Used in: FlightList
- Features: Price slider, stops filter, airline filter, time filter
- Props: filters, setFilters, options from API results

**HotelSearchFilters.tsx**

- Used in: HotelList
- Features: Price filter, amenities filter, hotel type filter, rating filter
- Props: Similar to BookingFilters

**ModifySearchPanel.tsx**

- Used in: FlightList
- Features: Quick search modifier (change dates, origin, destination)
- Props: Current search params, onModify callback

### 7.2 Results Card Components

**FareCard.tsx** (Flight results)

```typescript
<FareCard
  flight={flight}
  onClick={() => navigateToDetail(flight.id)}
  isSelected={selectedFlightId === flight.id}
  formatCurrency={formatCurrency}
/>
```

**HotelCard.tsx** (Hotel results)

```typescript
<HotelCard
  hotel={hotel}
  onClick={() => navigateToDetail(hotel.id)}
  facilities={hotel.facilities}
  images={hotel.images}
/>
```

### 7.3 Map Components

**AnimatedFlightMap.tsx** (FlightList)

- Shows departure and arrival airports
- Animated flight path
- Coordinates from airport data

**HotelMap.tsx** (HotelList)

- Shows hotel locations
- Cluster pins for multiple hotels
- Click to focus on particular hotel

---

## 8. RECOMMENDED STRUCTURE FOR FLIGHTS LIST & HOTELS LIST

Both `/flights/list` and `/hotels/list` pages follow a **unified results page pattern**:

### 8.1 FlightList Page Structure (Current)

```text
/flights/list
├─ Header
│  └─ ModifySearchPanel (quick search change)
│
├─ Content Grid
│  ├─ Sidebar (40% width)
│  │  ├─ Filters header with clear button
│  │  ├─ Price filter (slider)
│  │  ├─ Stops filter (checkboxes)
│  │  ├─ Airlines filter (checkboxes)
│  │  ├─ Time filter (time range picker)
│  │  └─ Alliance filter (checkboxes)
│  │
│  └─ Main Content (60% width)
│     ├─ Results toolbar
│     │  ├─ Sort dropdown (Best Value, Price, Duration, etc.)
│     │  ├─ View toggle (list/map)
│     │  └─ Results count
│     │
│     ├─ Results List
│     │  ├─ FareCard (repeated for each flight)
│     │  │  ├─ Airline icon + name
│     │  │  ├─ Departure/arrival times
│     │  │  ├─ Duration + stops
│     │  │  ├─ Price per cabin
│     │  │  └─ "View Details" button
│     │  │
│     │  ├─ FareCard
│     │  └─ ... (more flights)
│     │
│     ├─ Pagination/Load More
│     │
│     └─ Map View (when toggled)
│        └─ AnimatedFlightMap
│
└─ Footer (booking stepper progress)
   └─ "1. Search → 2. Passengers → 3. Payment → 4. Confirmation"
```

### 8.2 HotelList Page Structure (Current)

```text
/hotels/list
├─ Header
│  └─ Quick search bar with destination autocomplete
│
├─ Content Grid
│  ├─ Sidebar (30-35% width)
│  │  ├─ Filters header
│  │  ├─ Price filter (slider)
│  │  ├─ Hotel type filter (checkboxes)
│  │  ├─ Rating filter (star rating toggle)
│  │  ├─ Amenities filter (multi-select)
│  │  └─ Board type filter (room basis)
│  │
│  └─ Main Content (65-70% width)
│     ├─ Results toolbar
│     │  ├─ Sort dropdown (Recommended, Price: Low-High, Rating, etc.)
│     │  ├─ View toggle (List/Map/Grid)
│     │  └─ Results count
│     │
│     ├─ Results Display (varies by view)
│     │  ├─ LIST VIEW:
│     │  │  └─ HotelCard (repeated)
│     │  │     ├─ Hotel image
│     │  │     ├─ Hotel name + location
│     │  │     ├─ Rating + reviews count
│     │  │     ├─ Key amenities icons
│     │  │     ├─ Room type + price
│     │  │     └─ "View Rooms" button
│     │  │
│     │  └─ MAP VIEW:
│     │     └─ HotelMap with clustered pins
│     │
│     └─ Pagination/Load More
│
└─ Footer (booking stepper progress)
   └─ "1. Search → 2. Rooms → 3. Guests → 4. Payment → 5. Confirmation"
```

### 8.3 Key UI Patterns

**Consistent Elements Across Both**:

1. ✅ Sidebar with filters
2. ✅ Sort/view toggle toolbar
3. ✅ Card-based results
4. ✅ Detail navigation pattern
5. ✅ Modify search capability
6. ✅ Map view option
7. ✅ Loading states with pagination
8. ✅ Booking stepper footer

**Differences**:

- Flight: Focuses on time/stops/airlines filtering
- Hotel: Focuses on amenities/type/rating filtering
- Flight detail: Full itinerary view
- Hotel detail: Photo gallery + room selection

---

## 9. API ENDPOINTS USED

### 9.1 Flight Endpoints

```text
GET /api/static/suggestions?q=<query>&type=flight
  → Airport autocomplete suggestions (code, name, country)

GET /api/flights/search?origin=AMS&destination=JFK&date=2026-04-01&adults=2
  → Search for flights (if using SRS backend)

GET /api/flights/:id
  → Get single flight details

POST /api/duffel/offers
  → Create flight offer (Duffel integration)

GET /api/duffel/offers/:id
  → Get offer details
```

### 9.2 Hotel Endpoints

```text
POST /api/hotels/search
  → Search hotels (LiteAPI backend)
  → Payload: { location, checkin, checkout, adults, rooms }

GET /api/hotels/:id
  → Get single hotel details

GET /api/hotels/:id/rooms
  → Get available room types
```

### 9.3 Static Data Endpoints

```text
GET /api/static/airports
GET /api/static/airlines
GET /api/static/countries
GET /api/static/currencies
GET /api/static/hotel-amenities
GET /api/static/hotel-types
GET /api/static/popular-destinations
```

---

## 10. SEARCH PARAMETER CONVENTIONS

### 10.1 Flight Search Params

```text
/flights/list?
  origin=AMS&
  destination=JFK&
  departureDate=2026-04-01&
  returnDate=2026-04-08&          (optional, for round-trip)
  adults=2&
  children=0&
  infants=0&
  cabin=economy
```

### 10.2 Hotel Search Params

```text
/hotels/list?
  location=Dubai&
  countryCode=AE&                 (optional)
  checkin=2026-04-01&
  checkout=2026-04-05&
  adults=2&
  children=0&
  rooms=1
```

---

## 11. AVAILABLE HOOKS FOR DATA FETCHING

### Common Data Hooks

```typescript
// Static data
usePopularDestinations(limit)      → Fetch top destinations
useAirlines()                       → Fetch all airlines
useAirports()                       → Fetch all airports
useCountries()                      → Fetch all countries
useHotelAmenities()                 → Fetch hotel amenities
useHotelTypes()                     → Fetch hotel types
useBoardTypes()                     → Fetch room basis types

// Booking data
useFlight(flightId)                 → Fetch single flight
useHotel(hotelId)                   → Fetch single hotel
useLiteApiHotels()                  → Hotel search hook
useFlightSearch()                   → Flight search hook

// Static data bundle (for performance)
useBundledStaticData()              → Get pre-loaded static data
```

---

## 12. FEATURE FLAG SYSTEM

The app uses a **tenant runtime provider** to manage feature flags:

```typescript
// In any component
const { config: runtimeConfig } = useTenantRuntime();

// Access features
if (runtimeConfig.features.flightBookingEnabled) {
  // Show flight booking UI
}

// Available flags
-flightBookingEnabled -
  hotelBookingEnabled -
  walletEnabled -
  walletTopupEnabled -
  seatSelectionEnabled -
  ancillariesEnabled;
```

**Admin Control**: These are set per-tenant in the backend configuration

---

## 13. DEVELOPMENT NOTES

### 13.1 Key Files to Understand

1. **App.tsx** - Route definitions and feature gating
2. **pages/FlightHome.tsx** - Flight search form
3. **pages/FlightList.tsx** - Flight results + filtering
4. **pages/FlightDetail.tsx** - Single flight details
5. **pages/HotelHome.tsx** - Hotel search form
6. **pages/HotelList.tsx** - Hotel results + filtering
7. **pages/HotelDetail.tsx** - Single hotel details
8. **pages/PassengerDetails.tsx** - Universal booking form
9. **components/booking/** - Shared booking components
10. **lib/api/** - API client methods

### 13.2 Vite Configuration

```typescript
// vite.config.ts
proxy: {
  '/api': {
    target: 'http://localhost:3001', // Points to booking-service
    changeOrigin: true,
  }
}
```

### 13.3 TypeScript Paths

```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": "./src/*"
    }
  }
}
```

---

## 14. SUMMARY TABLE

| Aspect             | Flight                                           | Hotel                          |
| ------------------ | ------------------------------------------------ | ------------------------------ |
| **Home Page**      | /flights                                         | /hotels                        |
| **Results Page**   | /flights/list                                    | /hotels/list                   |
| **Detail Page**    | /flights/detail                                  | /hotels/:id                    |
| **Search Form**    | ✅ Origin/Dest/Date/Cabin                        | ✅ Location/Dates/Guests       |
| **Filter Options** | Cost, Stops, Airlines, Time                      | Cost, Type, Amenities, Rating  |
| **Map View**       | ✅ Flight path animation                         | ✅ Hotel clusters              |
| **Results Card**   | FareCard                                         | HotelCard                      |
| **Post-Selection** | /passenger-details → /seat-selection → /checkout | /passenger-details → /checkout |

---

## 15. NEXT STEPS FOR DEVELOPMENT

### If Adding New Features

1. **Create new page** in `src/pages/`
2. **Add route** in `App.tsx`
3. **Create components** in `src/components/[feature]`
4. **Wrap with FeatureRoute** if needed
5. **Use layout component** (Layout or TripLogerLayout)
6. **Integrate data hooks** for API calls
7. **Add TypeScript types** in `src/types/`

### If Extending Results Pages

1. Extend filter options in sidebar
2. Add new sort options
3. Add view toggle options (currently: list/map)
4. Update result card components
5. Ensure URL params stay in sync
6. Test with various result counts

### If Modifying Booking Flow

1. Add new step in `/pages/`
2. Update routing in `App.tsx`
3. Update `BookingStepper` component
4. Manage state across page boundaries (via location.state or context)
5. Test complete workflows

---

**Document Version**: 1.0  
**Last Updated**: March 12, 2026  
**Status**: Complete & Verified
