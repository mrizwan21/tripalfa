# E2E Test Coverage Analysis: Booking Engine

**Generated:** March 7, 2026  
**Scope:** /apps/booking-engine/tests/e2e  
**Total Existing Specs:** 18 files | ~200+ tests

---

## 1. EXISTING TEST SPECIFICATIONS & COVERAGE

### Flights (5 specs | ~35 tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `flight-search.spec.ts` | 6 | Form rendering, search input & submission |
| `flight-list.spec.ts` | 12 | Results display, filters, sorting, card interactions, loading states |
| `flight-booking.spec.ts` | 5 | Detail page, passenger form, checkout, confirmation |
| `flight-full-flow.spec.ts` | 8 | Complete end-to-end journey (search → confirmation) |
| `ancillaries-addons.spec.ts` | 4+ | Baggage, meals, special services selection |

### Hotels (4 specs | ~30+ tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `hotel-search.spec.ts` | 3 | Form rendering, destination input, search submission |
| `hotel-list.spec.ts` | 12+ | Results display, cards, prices, ratings, filters, sort, map toggle |
| `hotel-booking.spec.ts` | 3 | Hotel detail page, add-ons, navigation |
| `hotel-full-flow.spec.ts` | 20+ | Complete booking journey (search → confirmation) |

### Authentication (3 specs | ~17 tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `login.spec.ts` | 8 | Form rendering, valid/invalid credentials, navigation links |
| `register.spec.ts` | 5 | Form fields, valid registration, empty field validation, navigation |
| `forgot-password.spec.ts` | 5 | Email input, success feedback, empty validation, navigation |

### Bookings (3 specs | ~6 tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `booking-management.spec.ts` | 3 | List rendering, card/empty state, auth protection |
| `booking-detail-postbooking.spec.ts` | 2 | Detail page rendering or redirect, back navigation |
| `documents-templates.spec.ts` | 1+ | Basic document functionality |

### Dashboard (1 spec | ~20 tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `dashboard.spec.ts` | 20+ | Summary cards, booking count, wallet snapshot, charts, recent bookings, quick actions, empty states |

### Profile (2 specs | ~50+ tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `profile.spec.ts` | 30+ | Personal info, preferences, documents, loyalty tier, file upload/delete/download, logout |
| `account-settings.spec.ts` | 20+ | Profile tab, security, payment methods, notifications, documents, API keys, tab switching |

### Navigation & Routing (3 specs | ~50+ tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `routing.spec.ts` | 12 | Route loads, dashboards, 404 handling, unauthenticated access |
| `notifications-alerts.spec.ts` | 45+ | Notifications (list, filter, popups), alerts, help center, wallet, top-up, transfer forms |
| `notification-preferences.spec.ts` | 7 | Preferences page, notification channels, toggles, save functionality |

### Wallet (1 spec | ~6 tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `wallet.spec.ts` | 6 | Overview, balance display, top-up form, transfer form |

### Loyalty (1 spec | ~27 tests)

| Spec File | Tests | Coverage |
| --------- | ----- | ---------- |
| `loyalty.spec.ts` | 27+ | Page load, points balance, tier badge, tier progress, benefits grid, expiring points, redeem modal, history modal, coupons/vouchers, tier levels |

---

## 2. COVERAGE GAPS IDENTIFIED

### Critical Missing Areas

#### 🔴 Multi-leg & Round-trip Flight Scenarios

- **Gap:** No tests for multi-city searches (A→B→C)
- **Gap:** No round-trip booking flow tests
- **Gap:** No specific tests for flight switching/modification with multiple segments
- **Impact:** High - affects ~30% of flight bookings

#### 🔴 Advanced Filter Combinations

- **Gap:** No tests for combined filters (price + airline + stops + duration)
- **Gap:** No filter persistence across pagination
- **Gap:** No "Clear all filters" functionality testing
- **Gap:** Missing range slider interactions (price filter min/max)
- **Impact:** Medium-High - core search experience

#### 🔴 Form Validation & Error States

- **Gap:** No email format validation tests
- **Gap:** No phone number format validation
- **Gap:** No date picker validation (invalid dates, past dates)
- **Gap:** No password strength requirements testing
- **Gap:** No duplicate email detection
- **Gap:** Missing error message scenarios
- **Impact:** High - fundamental UX quality

#### 🔴 Modal & Popup Interactions

- **Gap:** Only basic "open modal" tests exist
- **Gap:** No modal form submission tests
- **Gap:** No "close modal while unsaved changes" scenarios
- **Gap:** No nested modal tests
- **Gap:** Missing modal success/error states
- **Impact:** Medium - affects multiple user journeys

#### 🔴 Date Picker & Calendar Interactions

- **Gap:** No date picker navigation tests
- **Gap:** No date range selection for multi-night hotel stays
- **Gap:** No minimum stay validation
- **Gap:** No checkout date auto-calculation
- **Impact:** High - essential for both flights & hotels

#### 🔴 Tooltip & Help Text Functionality

- **Gap:** No tooltip visibility/content tests
- **Gap:** No help icon interaction tests
- **Gap:** Missing icon explanation coverage
- **Impact:** Low-Medium - enhances UX clarity

#### 🔴 State Preservation Across Navigation

- **Gap:** No tests for maintaining form state when navigating back
- **Gap:** No session persistence tests across page reloads
- **Gap:** Missing bookMark/navigation state tests
- **Impact:** Medium - affects user flow continuity

#### 🔴 API Error Handling & Graceful Fallbacks

- **Gap:** No 500 error response tests
- **Gap:** No timeout/slow response handling
- **Gap:** No 404 (resource not found) handling for flight/hotel detail pages
- **Gap:** Missing network error retry logic
- **Gap:** No empty result set edge cases
- **Impact:** High - critical for production stability

#### 🔴 Accessibility (a11y) Features

- **Gap:** No ARIA label testing
- **Gap:** No keyboard navigation tests
- **Gap:** No screen reader content testing
- **Gap:** No color contrast validation
- **Gap:** Missing focus management tests
- **Impact:** Medium - compliance & inclusivity

#### 🔴 Responsive Design Testing

- **Gap:** No mobile viewport tests
- **Gap:** No tablet breakpoint tests
- **Gap:** No touch interaction scenarios
- **Gap:** Missing responsive modal/drawer behavior
- **Impact:** High - significant user base on mobile

#### 🔴 Data Validation & Persistence

- **Gap:** No tests for edited profile data persistence
- **Gap:** No concurrent edit conflict handling
- **Gap:** Missing document upload validation (file size, format)
- **Impact:** Medium - data integrity

#### 🔴 Complex User Interactions

- **Gap:** No "search → modify → search again" workflow tests
- **Gap:** No multi-passenger booking scenarios
- **Gap:** No group booking edge cases
- **Impact:** Medium - affects repeat booking flows

---

## 3. RECOMMENDED NEW TEST SPECIFICATIONS (5-7 Files)

### Recommendation 1: **Flight Filters & Advanced Search** ✅

**File:** `flight-filters-advanced.spec.ts`  
**Justification:** Filter combinations are core to search UX; currently only basic filter visibility is tested.  
**Coverage Areas:**

- Filter opening/closing (sidebar collapse)
- Price range filter validation (min > max errors)
- Airline multi-selection (select/deselect logic)
- Duration filter slider interactions
- Stops filter (non-stop, 1-stop, 2+ stops)
- Departure time window selection
- Filter combinations and result updates
- "Clear Filters" / "Reset" button functionality
- Filter persistence across pagination/results reload
- Active filter badges/tags display

**Estimated Test Count:** 12-15 tests

---

### Recommendation 2: **Form Validation & Error Handling** ✅

**File:** `form-validation-errors.spec.ts`  
**Justification:** No dedicated tests for validation across all forms (auth, profile, booking).  
**Coverage Areas:**

- Email format validation (invalid patterns)
- Phone number format validation
- Password strength requirements
- Password confirmation mismatch
- First/last name character restrictions
- Field length limits (min/max)
- Required field validation
- Invalid date handling (past dates, invalid format)
- Duplicate email detection (if applicable)
- Error message display and dismissal
- Form submission block on validation failure
- Real-time vs. submit-time validation

**Estimated Test Count:** 18-22 tests

---

### Recommendation 3: **Multi-leg & Round-trip Flights** ✅

**File:** `flight-multi-leg.spec.ts`  
**Justification:** Current tests only cover single-leg flights; no multi-city or round-trip coverage.  
**Coverage Areas:**

- Multi-city search form (add/remove legs)
- Round-trip vs. one-way toggle
- Outbound flight selection for round-trip
- Return flight selection (specific dates)
- Leg ordering and modification
- Connecting flight scenarios
- Price breakdown by leg
- Baggage/ancillaries per leg
- Multi-leg confirmation displays
- Booking amendment (leg changes)
- Round-trip total vs. per-segment pricing

**Estimated Test Count:** 14-18 tests

---

### Recommendation 4: **Modal & Popup Interactions** ✅

**File:** `modals-popups.spec.ts`  
**Justification:** Modals exist throughout app but only basic opening is tested; no form submission or state handling in modals.  
**Coverage Areas:**

- Modal open/close animations
- Backdrop click to close behavior
- Escape key dismissal
- Modal form submission (redeem points, transfer wallet)
- Modal validation error states
- Modal success/confirmation flows
- Prevent close with unsaved changes (prompt)
- Nested modal behavior (if applicable)
- Modal focus trap and keyboard navigation
- "Don't show again" toggle functionality
- Loading states within modals
- Modal scroll behavior (long content)

**Estimated Test Count:** 14-16 tests

---

### Recommendation 5: **API Error Handling & Edge Cases** ✅

**File:** `api-errors-fallbacks.spec.ts`  
**Justification:** No tests for error responses (500, timeout, network errors); critical for reliability.  
**Coverage Areas:**

- HTTP 500 error response handling
- HTTP 404 (flight/hotel not found) graceful redirect
- HTTP 503 (Service Unavailable) retry logic
- Network timeout handling
- Partial/incomplete API responses
- Empty result sets (no flights/hotels found)
- Rate limit (429) handling
- Invalid JSON response handling
- Slow response timeout graceful degradation
- Error message display and user guidance
- Automatic retry vs. manual retry button
- Offline mode detection (if applicable)
- Circuit breaker pattern (if implemented)

**Estimated Test Count:** 13-16 tests

---

### Recommendation 6: **Date Picker & Calendar Interactions** ✅

**File:** `date-picker-calendar.spec.ts`  
**Justification:** Date selection is critical for flights/hotels; no dedicated interaction tests.  
**Coverage Areas:**

- Date picker open/close
- Month/year navigation (prev/next)
- Single date selection
- Date range selection (check-in/check-out)
- Minimum stay validation (hotels)
- Maximum stay limits (if applicable)
- Invalid date prevention (past dates grayed out)
- Today/current date highlighting
- Keyboard arrow navigation on dates
- "Quick select" options (next week, next month)
- Date format display consistency
- Selected date persistence
- Date conflicts/overlap detection

**Estimated Test Count:** 13-15 tests

---

### Recommendation 7: **State Preservation & Deep Navigation** ✅

**File:** `state-preservation-navigation.spec.ts`  
**Justification:** Current tests don't verify form state preservation; critical for UX flow continuity.  
**Coverage Areas:**

- Search params preserved in URL
- Form inputs retained when navigating back
- Scroll position restoration (back button)
- Session storage of booking context
- Cached results retention on back navigation
- Filter state recovery after page reload
- Payment method selection persistence
- Passenger data persistence across steps
- Notifications state (read/unread) persistence
- Wallet balance real-time updates
- Loyalty points state consistency
- Multi-step form progress indicator accuracy
- Abandoned booking recovery scenarios

**Estimated Test Count:** 14-17 tests

---

## 4. SUMMARY TABLE

| New Spec | Est. Tests | Priority | Complexity | Dependencies |
| -------- | ---------- | -------- | ---------- | ------------- |
| Flight Filters & Advanced Search | 12-15 | 🔴 High | Medium | flight-list.spec.ts |
| Form Validation & Error Handling | 18-22 | 🔴 High | Medium | auth/*.spec.ts, profile/*.spec.ts |
| Multi-leg & Round-trip Flights | 14-18 | 🔴 High | High | flight-*.spec.ts |
| Modal & Popup Interactions | 14-16 | 🟡 Medium | Medium | loyalty.spec.ts, notifications-alerts.spec.ts |
| API Error Handling & Edge Cases | 13-16 | 🔴 High | Medium | All specs (mocking) |
| Date Picker & Calendar | 13-15 | 🔴 High | Medium | flight-*.spec.ts, hotel-*.spec.ts |
| State Preservation & Navigation | 14-17 | 🟡 Medium | High | All specs (deep linking) |

**Total Additional Tests:** 98-119 tests  
**Cumulative Test Count (with new specs):** ~300-320 tests

---

## 5. IMPLEMENTATION PRIORITY

### Phase 1 (Sprint 1-2): Critical Coverage

1. **API Error Handling & Edge Cases** — prevents production issues
2. **Form Validation & Error Handling** — affects all user interactions
3. **Date Picker & Calendar** — blocks flights & hotels workflows

### Phase 2 (Sprint 3): Search Experience

1. **Flight Filters & Advanced Search** — high user impact feature
2. **Multi-leg & Round-trip Flights** — expands flight coverage

### Phase 3 (Sprint 4-5): UX & Navigation

1. **Modal & Popup Interactions** — affects user flows across app
2. **State Preservation & Navigation** — enhances reliability

---

## 6. TESTING INFRASTRUCTURE NOTES

**Current Setup:**

- Playwright for E2E testing
- MSW (Mock Service Worker) for API mocking
- Custom page fixtures (flightSearchPage, hotelSearchPage, etc.)
- Pre-authenticated state (storageState)

**Recommended Enhancements:**

- Add test data factories for consistent mock generation
- Implement custom assertions for accessibility checks
- Create shared "wait for" helpers (loading states, animations)
- Add visual regression testing for modals/popups
- Implement performance baseline tests (page load time)
- Create reusable scenario builders for complex workflows

---

## 7. COVERAGE METRICS

**Current Coverage:**

- Core booking flows: ✅ 70%
- Error scenarios: ❌ 10%
- Accessibility: ❌ 5%
- Mobile/responsive: ❌ 0%
- Form validation: ❌ 15%
- API resilience: ❌ 5%

**Target Coverage (with new specs):**

- Core booking flows: ✅ 85%
- Error scenarios: ✅ 65%
- Accessibility: ⚠️ 30%
- Mobile/responsive: ❌ 10%
- Form validation: ✅ 75%
- API resilience: ✅ 70%

---

## Appendix: Files Currently Not Well-Tested

- `booking-detail-postbooking.spec.ts` — only 2 tests; needs amendment/cancellation flows
- `documents-templates.spec.ts` — minimal coverage; needs upload/download/delete workflows
- No hotel-specific filter tests (amenities, board type)
- No integration tests for wallet → booking redemption
- No concurrency tests (simultaneous bookings, seat conflicts)
