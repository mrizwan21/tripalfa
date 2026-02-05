# Low-level SRS Implementation Spec & Datasheet — Booking Engine

Version: 1.0  
Source: "08. SRS-End user" (attached)  
Scope: UI + frontend API contracts + client-side business rules for hotel, flight, booking management, view booking, payments, wallet.

---

## 1 — Goals & assumptions
- Exact UI behavior, fields and validations must follow the SRS controls and business rules.
- Frontend implements UI, validation, price-calculation UX and API contracts (stubs). Backend implements authoritative pricing, holds, confirms, supplier integrations.
- Currency conversion, tax/fees authority: backend. Frontend displays where required and mirrors formulas for user clarity.

---

## 2 — High-level pages and components (map to files)
- Booking management
  - Pages: src/pages/BookingManagement.tsx, src/pages/BookingDetail.tsx
  - Components: BookingFilters, BookingTable, BookingCard, BookingActions
- Hotel
  - Pages: src/pages/HotelSearch.tsx, src/pages/HotelList.tsx, src/pages/HotelDetail.tsx, src/pages/BookingCheckout.tsx, src/pages/BookingConfirmation.tsx
  - Components: HotelCard, ImageGallery, Facilities, RoomList, RoomSelectControl, AddOnService, FareSummary, PassengerForm
- Flight
  - Pages: src/pages/FlightSearch.tsx, src/pages/FlightList.tsx, src/pages/FlightDetail.tsx, src/pages/FlightCheckout.tsx
  - Components: FareCard, AddExtraBaggage, SeatSelection, TravelAddons, FareSummary, PassengerForm
- Payment & Wallet
  - Components/Pages: CardForm, WalletSelector, WalletPage, WalletTopUp
- Shared
  - src/lib/api.ts (API stubs & contracts)
  - src/lib/srs-types.ts (types)
  - src/lib/price.ts (price helpers)
  - src/lib/validation.ts

---

## 3 — Control-level specs (per SRS items)
Format: Control name — type — required — constraints — validation/error message

Booking Management
- Search bar — textbox — optional — maxlength 50 — searches bookingRef, details, date, passenger
- Booking status — select — optional — enum (On hold, In process, Ticketed, Refund on hold, Refunded, Cancel in process, Canceled, Additional request, Service confirmed, Service rejected, Used, Vouchered)
- Product — select — optional — [All, Hotel, Flight]
- From-To — date picker (two fields) — optional — if one filled, require both; To >= From
- Filter button — button — applies filters
- PDF button — button — export list (front-end export of current page)

Hotel Search / List / Detail
- Location search — textbox — required — maxlength 250 — inline error "Location cannot be empty"
- Checkin-checkout — date range — required — cannot select past dates — format dd/mm/yyyy
- Category, Nationality, Passenger count — selects — optional
- Search result hotel card fields: image (hero, maxwidth=800), hotel general info (name, rating), room summary (names combined), facilities (only free ones up to 6), price (inclusive), Select Room button
- Room selection controls:
  - Select rooms number control — number input — min 0 — cannot exceed initial requested rooms
  - Book Now — disabled until selected rooms total == requested rooms; on click calls hold flow
- Add-on service UI:
  - Refund Protect, Travel Insurance — radio/select or add button — show price inclusive
  - Tooltip icon — shows room info with RateType, RoomView, Board

Passenger Information (hotel & flight)
- Guest 1:
  - First name — text — required — maxlength 250
  - Last name — text — required — maxlength 250
  - Nationality — combobox — required — from staticdata[Nationalities]
  - DOB — date picker — required — must be < today
  - Gender — combobox — required
  - Country code + Mobile — required for guest1
  - Email — required — validation ER_02
- Guest 2..N:
  - Required: first name, last name, nationality, DOB
- Billing info checkbox: copy from guest1 if checked

Payment UI
- If logged-in: show Wallet and Pay now (= Card/Stripe/PayPal); else show Pay now only
- Wallet selector shows account balance per currency
- Card form: Card number (13–19 digits numeric), Expiry (MM/YY not past), CVV (3–4 digits), Name (letters, spaces, hyphens)
- Pay Now button triggers processCardPayment stub then confirmBooking

Booking Confirmation
- After success return bookingId: format TL-[6 digits] and status Issued
- If hold only: status Hold and send on-hold confirmation + invoice for total payable

Flight Controls (selection/filters)
- From/To: autocomplete select boxes (from staticdata)
- Depart date / Return date: date pickers (no past)
- Cabin default: Economy
- Passenger selector: counts
- FareCard shows: departure time (time only), duration (PT..), stops, airline name (map iata code), cabin types, fares, included baggage (quantity & weight)

---

## 4 — Data models / datasheet (frontend types)

Booking
| field | type | notes |
|---|---:|---|
| id | string | internal id |
| bookingId | string | TL-###### (6 digits) |
| product | "hotel"|"flight" | |
| status | string | SRS enum |
| reference | string | supplier/booking ref |
| total | { amount:number, currency:string } | final payable |
| createdAt | string (ISO) | |
| details | any | hotel/flight raw details |

Hotel
| field | type | notes |
|---|---:|---|
| id | string | hotel id |
| name | string | |
| rating | number | |
| address | {street, city, country, zip} | |
| latitude | number | |
| longitude | number | |
| images | [{url, hero:boolean, maxwidth:number}] | pick hero:maxwidth=800 |
| facilities | [{code,name,free:boolean}] | display only free ones up to 6 |
| rooms | [{id,name,boardType,rateType,originalPrice:{amount,currency},tax:number,commission:number,roomView:string}] | price components provided by supplier

Flight
| field | type | notes |
|---|---:|---|
| id | string | flight id |
| segments | [{ from, to, departTime, arriveTime, duration, carrierCode }] | |
| fares | [{fareId, cabin,currency,amount,checkedBagsIncluded,seatInfo}] | fare per cabin |

WalletAccount
| field | type | notes |
|---|---:|---|
| currency | string | e.g., USD |
| currentBalance | number | |
| pendingBalance | number | |

---

## 5 — API Contracts (detailed request/response snippets)

GET /api/bookings
- Query: userId?, q?, status?, product?, from?, to?, page=1, perPage=10
- Response:
```json
{
  "items":[{ "id":"1","bookingId":"TL-123456","product":"hotel","status":"Vouchered","reference":"ABC123","total":{"amount":250,"currency":"USD"},"createdAt":"2025-07-01T12:00:00Z","details":{}} ],
  "total": 1,
  "page":1,
  "perPage":10
}
```

GET /api/bookings/{id}
- Response: Booking (full), including details and add-ons, payment status, documents list (ticket/voucher/invoice)

POST /api/bookings/{id}/action
- Body:
```json
{ "action":"cancel_and_refund", "reason":"user requested", "payload":{} }
```
- Response: updated Booking object

POST /api/hotels/search
- Body:
```json
{ "location":"City X","checkin":"2026-02-10","checkout":"2026-02-13","adults":2,"children":1,"rooms":1,"currency":"USD" }
```
- Response: list of hotel offers (cheapest per hotel) with inclusive totals and breakdown:
```json
{
 "id":"h_1","name":"Hotel A","location":"City X", "price":{ "amount":120,"currency":"USD","breakdown":{"original":100,"tax":15,"commission":5} }, "roomsSummary":[{"name":"Standard","quantity":1}]
}
```

POST /api/bookings/hotel/hold
- Body: hotelId, rooms, guestInfo, contact, addons
- Response: { holdReference, expiry }

POST /api/bookings/hotel/confirm
- Body: holdReference, paymentMethod
- Response: { bookingId:"TL-XXXXXX", status:"Issued" }

GET /integrations/hepstar/addons?hotelId={id}
- Response: [{code,title,description,price:{amount,currency}}]

POST /api/flights/search (similar to hotels; respond fares)

POST /api/payments/card
- Body: { amount, currency, card: {number,expiry,cvv,name} }
- Response: { success:true, transactionId:"TXN-..." }

POST /api/wallets/topup
- Body: { accountFrom, accountTo, amount, currency, paymentType }
- Response: { invoiceNo:"CI-123", status:"On-Request" }

---

## 6 — Business logic & algorithms (client-side mirrors)

Price display rules
- Show displayed price = totalNight * rooms * ((originalPrice) + (tax + fee + commission))
- Fare summary shows:
  - Original Price (per pax group) — tax — add-ons — discounts — Grand total

Search result selection (cheapest-per-hotel)
- Algorithm (frontend mock):
  - For each hotel gather supplier offers
  - For each hotel keep cheapest total (inclusive)
  - If tie, pick supplier with higher profit (supplierProfit field if available) — mock choose first

Booking actions enablement (sample)
- If product == flight:
  - status == "On hold" => enable Pay
  - status == "Ticketed" => enable Cancel & refund (if refundable)
  - status == "Ticketed" or "Change accepted" => enable Re-issue via offline request form
- If product == hotel:
  - status == "On hold" => cancel
  - status == "Vouchered" => cancel & refund if refundable
  - Amendment requests => open offline request form

Validation summary (client-side)
- Emails: regex per SRS (local-part@domain.tld min 1 char segments)
- Card number: digits only length 13–19
- CVV: digits only length 3–4
- DOB: must be in past (not today/future)
- Date ranges: Check-in <= Check-out, both >= today

Error codes (standardized)
- ER_01 — Required field is empty => "[Field name] cannot be left blank"
- ER_02 — Invalid format email => "Please enter a valid email address"
- TNS-03 — System error: "An error occurred during processing"

---

## 7 — UI flows (step-by-step)

Hotel booking flow
1. User enters location, checkin-checkout, passengers -> validate -> POST /api/hotels/search
2. Show HotelList (10 per page) sorted low->high by inclusive price; map centers on first result
3. User selects hotel -> navigate HotelDetail
4. On HotelDetail user selects rooms (must match initial rooms count); select add-ons; click Book Now -> call POST /api/bookings/hotel/hold -> receives holdReference
5. Navigate to PassengerInfo step; auto-fill guest1 if logged-in
6. Click Pay Now or Wallet -> initiate payment flow (processCardPayment or wallet flow)
7. On payment success -> POST /api/bookings/hotel/confirm -> receives TL-###### bookingId -> navigate BookingConfirmation

Flight booking flow (similar) with steps for fare selection, add extra baggage, seat selection, passenger info, hold vs pay option.

Booking management flow
- Avatar → Account settings → My booking -> GET /api/bookings (10 per page)
- Filters apply; actions available per booking status; View opens BookingDetail which queries GET /api/bookings/{id}

Wallet top-up
- Wallet -> Top Up -> fill form per SRS -> POST /api/wallets/topup -> returns invoice no and sets status On-Request

---

## 8 — Acceptance tests (sample)
- Hotel Search: when location empty and search clicked, inline "Location cannot be empty" appears.
- Hotel List: returned hotels ordered by price ascending; map centered on first hotel lat/lng.
- Room selection: Book Now disabled until selected rooms total == requested rooms.
- Add-on: selecting Refund Protect updates Fare Summary "Travel Add-ons" and Grand total.
- Passenger fields: guest1 autofills when logged in; guest2 only first/last/nationality/dob required.
- Payment: On card pay simulation, BookingConfirmation shows booking id pattern TL-###### and status Issued.

---

## 9 — Implementation tasks (developer checklist)
- [ ] Create low-level components and pages as listed
- [ ] Implement src/lib/srs-types.ts and price/validation utilities
- [ ] Implement full API stubs in src/lib/api.ts with sample datasets covering supplier variations
- [ ] Enforce client-side validations and map to ER_01/ER_02 codes
- [ ] Add unit tests for price calc and validation (jest)
- [ ] Manual QA of Hotel and Flight flows
- [ ] Prepare PRs per PR breakdown (atomic)

---

## 10 — Deliverables produced after implementation
- docs/srs-low-level-spec.md (this file)
- docs/srs-api-contracts.md (detailed JSON schemas for backend)
- PRs implementing UI + api stubs + tests
- QA report with test evidence and discrepancy log against SRS

---

If you confirm, I will:
- Generate docs/srs-api-contracts.md (full JSON schemas) and
- Create all missing components/pages and expand src/lib/api.ts in a single batch (multiple writes), then open PRs per the task list.