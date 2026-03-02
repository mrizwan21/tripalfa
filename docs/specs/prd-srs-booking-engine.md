# PRD: TripLoger — Booking Engine (SRS Implementation)

Version: 1.0  
Derived from: "08. SRS - End user" (attached)  
Author: automation (developer requested)  
Date: 2026-01-23

---

## 1. Purpose & Background

Deliver a frontend implementation in apps/booking-engine that precisely implements the SRS "End user" requirements for Booking Management, Hotel flows, Flight flows, Payments and Customer Wallets. The PRD defines scope, UX controls, data contracts, business rules, acceptance criteria, implementation plan, timeline, risks and deliverables.

---

## 2. Objectives & Success Metrics

- UI parity with SRS controls and workflows for hotel & flight booking and booking management.
- Accurate client-side validation and price-display logic mirroring SRS formulas.
- Stubs/API contracts ready for backend integration.
- Automated tests covering price calculation, validation, and primary flows.
  Success metrics:
- 100% SRS mandatory fields implemented.
- All positive/negative acceptance tests pass locally.
- PRs split into reviewable units with clear acceptance criteria.

---

## 3. Scope

In scope:

- All screens and UI controls specified in the SRS: Booking Management, View Booking, Hotel (search, list, detail, select room, add-ons, passengers, payment, confirmation), Flight (search, list, fare select, add-ons, passenger, payment, confirmation), Wallet (view, top-up).
- Client-side business rules, validation, price calculation helpers and API stub endpoints.
- Documentation: low-level spec, API JSON schemas, PRD, acceptance test list.
  Out of scope:
- Real supplier integrations, payment gateway production integration, and backend persistence. These will use stubs/mock endpoints.

---

## 4. Stakeholders

- Product Owner: (TBD)
- Frontend engineering: Booking-engine team
- Backend engineering: booking, payment, inventory teams
- QA: manual and automated testers
- UX: UI refinements based on SRS figma links

---

## 5. High-level Architecture & Data Contracts

- Frontend (React + Vite): pages/components under apps/booking-engine/src.
- Shared types & utilities in apps/booking-engine/src/lib (srs-types.ts, price.ts, validation.ts, api.ts).
- API contract docs: docs/api/srs-api-contracts.md (JSON schemas).
- Key endpoints (stubs): /api/bookings, /api/hotels/search, /api/hotels/:id, /api/bookings/hotel/hold, /api/bookings/hotel/confirm, /api/flights/search, /api/bookings/flight/hold, /api/payments/card, /api/wallets/topup, /integrations/hepstar/addons.

Datasheet excerpts (canonical fields):

- Booking: id, bookingId (TL-######), product, status, reference, total {amount,currency}, createdAt, details
- Hotel: id, name, rating, address, lat,lng, images[], facilities[], rooms[]
- Room: id, name, originalPrice, tax, commission, availability, boardType, rateType, roomView
- Flight: id, segments[], fares[] (fareId, cabin, amount, currency, includedBags, rules)
- WalletAccount: currency, currentBalance, pendingBalance, status

Full JSON schemas are in docs/api/srs-api-contracts.md.

---

## 6. Detailed Feature Specifications (per SRS)

Note: each control below lists type, required, validations, UI behavior, and API interactions.

6.1 Booking Management (SRS §1)

- Pages: /bookings (BookingManagement), /booking/:id (BookingDetail)
- Controls:
  - Search bar (textbox, maxlength 50) — searches ref/details/date/passenger — UI-side filtering and API query q param.
  - Booking status (select) — SRS enum values — single selection.
  - Product select — All / Hotel / Flight — affects displayed rows.
  - Date from/to pickers — both required if either filled; To >= From.
  - Filter button — triggers GET /api/bookings with filters; pagination 10/page.
  - PDF button — exports current page as printable PDF (frontend).
  - Action dropdown per row — dynamic options per product/status. Actions may open offline forms (Re-issue, Name correction, Special request) or call API (Pay, Cancel & refund).
- Business rules:
  - Display 10 records per page.
  - Booking statuses map exactly to SRS; UI only enables actions that SRS permits for that status.
- Acceptance:
  - Filters applied return expected results; action menu matches SRS mapping.

    6.2 View Booking (SRS §1.6)

- Shows detailed booking card with tabs (General, Special service for hotel; General, Notification for flight).
- Fields: payer name, booking date, sync button, docs dropdown (Ticket/Voucher, Invoice, Receipt), room/segment details, passenger list, price (currency + amount), total price, check rules button linking to policy text.
- Behavior:
  - Sync triggers GET /api/bookings/{id} refresh.
  - Documents dropdown fetches/links to documents.
- Acceptance:
  - Booking detail renders all SRS-specified fields for sample mock payload.

    6.3 Hotel Flows (SRS §2)

- Homepage search: Location (required), checkin/checkout (current+future), category, nationality, passengers.
  - Validation: location non-empty (inline "Location cannot be empty"), date range not in past.
- Search logic: frontend mock implements cheapest-per-hotel selection across supplier offers; sort low → high by inclusive total. Default map centers on 1st hotel.
- HotelList: hotel card fields per SRS: hero image (maxwidth=800), name, rating, address, rooms summary, up-to-6 free facilities, price inclusive.
- HotelDetail:
  - Components: ImageGallery, Facilities, RoomList (two rate types visible: refundable/non-refundable), Room quantity selectors, real-time Total room information box showing formula: ([Original Price]+[Tax&Fees]+[Commission]) _nights_ qty
  - Book Now disabled until selected rooms total == requested rooms (from search).
  - Add-on Service screen: Refund Protect and Travel Insurance from Hepstar; add-ons displayed with inclusive price; selection updates Fare Summary and Grand Total.
- Passenger info:
  - Guest 1 auto-filled when logged-in. Validation: all fields required for guest1; guest2+ only first/last/nationality/DOB required.
  - Billing contact optional; copy option to autofill guest1.
- Payment:
  - If logged in: show Wallet + Pay Now. If not: Pay Now only.
  - Wallet selector shows currency and balances.
  - Card form: number (13–19 digits), expiry (MM/YY not past), CVV (3–4 digits), name (letters, spaces, hyphens).
  - Payment flow: card -> POST /api/payments/card -> on success POST /api/bookings/hotel/confirm -> bookingId TL-###### returned.
- Confirmation:
  - Show booking ID TL-6digits, summary, send email UI to add more recipients.
- Acceptance criteria: All SRS validation messages and UI states behave as specified.

  6.4 Flight Flows (SRS §3)

- Search (default cabin = Economy) with autocomplete from/to (staticdata), depart/return dates no-past, pax counts.
- FlightList: fare cards with time-only display, duration parsed from PT.., stops, airline name via IATA mapping, included baggage text.
- Fare selection -> Additional Services -> Add-ons (baggage/seat/meal) -> Passenger info -> Payment (Hold vs Pay).
- Hold flow: pressing Hold creates booking in Hold status; sends on-hold email + invoice (frontend displays same).
- Acceptance: Fare breakdown and fare summary (AirTicketFare info, Travel Add-ons, Grand total) displayed per SRS.

  6.5 Customer Wallets (SRS §4)

- Wallet page: list accounts per currency, currentBalance, pendingBalance, total.
- Top-up: Top-Up screen with source account selection, amount, currency, paymentType -> POST /api/wallets/topup -> returns invoiceNo & status On-Request.
- Acceptance: Top-up form validates amounts and displays invoice returned.

---

## 7. Error codes & validation mapping

- ER_01 — Required field empty: "[Field name] cannot be left blank"
- ER_02 — Invalid email format: "Please enter a valid email address"
- TNS-03 — System error: "An error occurred during processing"

Validation utilities created in apps/booking-engine/src/lib/validation.ts.

---

## 8. UX flows & wireframe references

- Use Figma links provided in SRS for pixel/flow details (links are embedded in SRS pages).
- For each page the PRD requires: mobile+desktop responsive behavior; map defaults; inline error states; accordions/tabs exact sequencing as SRS.

---

## 9. Acceptance Tests (representative)

- Hotel Search: empty location -> inline error shown; valid search -> hotels returned, sorted low→high, 10 per page.
- Room selection: selecting insufficient rooms disables Book Now.
- Add-on selection: Fare Summary updates travel add-ons and grand total.
- Passenger info: guest1 autofill when logged-in; DOB validation prevents future date.
- Payment: invalid card number triggers ER_02-like error; successful card flow shows TL-###### booking id.
- Booking Management: filters + pagination produce correct subset; actions rendered per booking status.

Full test cases will be delivered in a separate test-plan file.

---

## 10. Implementation plan & PR breakdown (atomic)

PR A: Types & utilities — srs-types.ts, price.ts, validation.ts, unit tests for price/validation.  
PR B: Booking Management UI (filters, table, detail) + GET /api/bookings stub + acceptance tests.  
PR C: Hotel search + list + hotel card + map + search validation + searchHotels stub.  
PR D: Hotel detail + room selection + ImageGallery + Facilities + RoomList + AddOnService + holdHotelBooking stub.  
PR E: Passenger info + checkout multi-step + payment selection UI + processCardPayment stub.  
PR F: Booking confirmation + send-email UI + invoice formatting.  
PR G: Flight flows: search, list, fare select, add-ons (baggage/seat), hold/confirm stubs.  
PR H: Wallet UI + top-up flow + wallet stubs.  
PR I: Tests, QA fixes, docs, final polish.

Each PR must include:

- Description mapping to SRS sections / control names.
- Acceptance criteria checklist.
- Unit tests for added utilities.
- Demo steps to manually validate.

---

## 11. Timeline & resourcing (proposal)

Estimated total effort: 8–10 developer-weeks (frontend) across phases described in implementation plan. Breakdown approximations in docs/srs-mapping-and-implementation-plan.md.

---

## 12. Risks & Mitigations

- Supplier data variation -> create adapter data model and extensive mock dataset.
- Payment integration complexities -> simulate flows with stubs; backend to implement secure gateway.
- Large PR sizes -> mitigate by strict PR plan and small atomic PRs with traceable SRS mapping.

---

## 13. Next actions (on approval)

- Produce docs/api/srs-api-contracts.md (done)
- Implement PR A → PR I in order; create branches/commits (requires git remote access).
- Deliver test-plan and seed mock datasets for QA.

---

If approved I will:

- Create the PR A files (types & utilities) and unit tests now, commit locally, and provide the git commands to create PRs.
