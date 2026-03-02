# Flight Amendment Workflow - Admin Documentation

## Overview

The Flight Amendment Workflow is a sophisticated multi-step process that allows admins to manage flight changes for existing bookings. This workflow handles complex scenarios with financial impacts, itinerary changes, and traveler approvals.

## Workflow Architecture

### Five-Step Process

1. **View Current Booking** - Display existing flight details and amendment request context
2. **Search Alternatives** - Query available flight options matching amendment criteria
3. **Compare & Financial Impact** - Side-by-side comparison with financial calculations
4. **User Approval** - Send amendment offer to traveler for approval (24-hour window)
5. **Finalize Amendment** - Process final amendment and communicate to traveler

## UX Flow Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    FLIGHT AMENDMENT WORKFLOW                             │
└─────────────────────────────────────────────────────────────────────────┘

QUEUE ITEM (Admin sees "Amend Flight" action for flight products)
         ↓
    [STEP 1: VIEW]
    ├─ Current Flight Details
    │  ├─ Airline, Route, Times, Duration, Stops
    │  └─ Price
    ├─ Amendment Request Context
    │  ├─ Request Type (date_change, route_change, both)
    │  ├─ Desired Date/Route
    │  └─ User Reason
    └─ "Search Alternatives" Button
         ↓
    [STEP 2: SEARCH] ← API calls /admin/bookings/:id/amendment/search-flights
    ├─ Loading State
    └─ Available Options (list of flights)
         ↓
    [STEP 3: COMPARE] ← Admin selects a flight
    ├─ Itinerary Comparison (Current vs Proposed)
    ├─ Financial Impact Analysis
    │  ├─ Current Fare: $X
    │  ├─ New Fare: $Y
    │  ├─ Price Difference: $(Y-X)
    │  └─ Adjustment Type & Amount
    │     ├─ Refund: traveler gets money back
    │     ├─ Charge: traveler pays additional
    │     └─ None: no change
    └─ "Send to Traveler for Approval" Button
         ↓
    [STEP 4: USER APPROVAL] ← API calls /admin/bookings/:id/amendment/send-user-approval
    ├─ Approval link sent to traveler
    ├─ 24-hour expiration timer
    ├─ What's pending approval displayed
    └─ Admin waits for traveler response
         ↓
         (Traveler reviews email, clicks approval link, accepts terms)
         ↓
    [STEP 5: FINALIZE] ← Admin checks approval status
    ├─ Confirmation: "Traveler has approved the amendment"
    ├─ Amendment Summary
    │  ├─ Booking Reference
    │  ├─ Traveler Name
    │  ├─ New Flight Assignment
    │  └─ Financial Settlement Details
    └─ "Finalize Amendment" Button (triggers /admin/bookings/:id/amendment/finalize)
         ↓
    [COMPLETE]
    ├─ Queue item updated
    ├─ Confirmation email sent to traveler
    └─ Amendment archived
```

## Step Details

### Step 1: View Current Booking

**Purpose**: Context for the admin before starting amendment process

**Displays**:

- Grid layout with two panels:
  - **Left Panel** - Current Flight Details (slate background):
    - Airline with logo/text
    - Route (DEP → ARR)
    - Departure time
    - Arrival time
    - Duration
    - Direct/Stops
  - **Right Panel** - Amendment Request Info (blue background):
    - Request type badge (date_change, route_change, both)
    - Desired date (if applicable)
    - Desired route (if applicable)
    - User's reason (quoted)

**Actions**:

- Cancel: Close dialog
- Search Alternatives: Proceed to Step 2

### Step 2: Search Alternatives

**Purpose**: Find available flight options matching amendment criteria

**API Endpoint**:

```
POST /admin/bookings/:bookingId/amendment/search-flights
{
  currentFlight: Flight,
  requestType: "date_change" | "route_change" | "both",
  requestedDate?: string,
  requestedRoute?: { from: string, to: string }
}
```

**Response**:

```typescript
{
  flights: Flight[],  // Array of matching options
  financialImpact: {
    currentFarePrice: number,
    newFarePrice: number,
    priceDifference: number,
    adjustmentType: "refund" | "charge" | "none",
    adjustmentAmount: number,
    currency: string
  }
}
```

**Displays**:

- Success message: "Found X alternative flight option(s)"
- Each flight in a clickable card showing:
  - Airline name
  - Date/times
  - Duration and stops
  - Price (right-aligned, bold)
  - "View Details" button

**Behavior**:

- Clicking a flight card proceeds to Step 3 with that flight selected

### Step 3: Compare & Financial Impact

**Purpose**: Show detailed comparison and financial implications

**Left Column (Current Booking - Slate Background)**:

- Current flight details (route, times, duration, price)

**Right Column (Proposed Amendment - Emerald Background)**:

- New flight details (route, times, duration, price)

**Financial Analysis Section**:

- Current Fare: $X (gray box)
- New Fare: $Y (green box)
- Price Difference: Display

**Financial Adjustment Alert**:

- **If Refund** (Emerald alert with check icon):
  - "Refund Due"
  - Amount prominently displayed
  - Explanation: "Traveler will receive a refund for the price difference. Credit to original payment method within 5-7 business days."
- **If Charge** (Amber alert with warning icon):
  - "Additional Charge"
  - Amount prominently displayed
  - Explanation: "Traveler needs to pay the additional amount for the new flight. Charge will be applied to existing payment method on file."

- **If No Change** (Slate alert):
  - "No Change"
  - Explanation: "No financial adjustment needed"

**Actions**:

- Back: Return to Step 2
- Send to Traveler for Approval: Proceed to Step 4

### Step 4: User Approval

**Purpose**: Show that approval request has been sent and wait for traveler response

**Approval Status Alert** (Blue):

- Spinning loader icon
- "Approval Request In Progress"
- Time remaining (starts at ~24 hours)
- Explanation message

**What Awaiting Approval** Section:

- New Flight Details card
- Financial Impact card with same styling as Step 3

**Important Notice** (Amber alert):

- "Once the traveler approves, you must finalize the amendment to complete the process..."

**Note**: This step is monitored in background. Admin should check back periodically or be notified when traveler responds.

### Step 5: Finalize Amendment

**Purpose**: Process the amendment after traveler approval

**Approval Confirmed Alert** (Emerald):

- Check circle icon
- "✓ Traveler has approved the amendment"
- "All details are confirmed. Click below to finalize..."

**Amendment Summary** (Gray background cards):

- Booking Reference
- Traveler Name

**New Flight Assignment** (Emerald border + light background):

- Airline
- Route with arrow
- Times and duration
- Price (right-aligned)

**Financial Settlement** (Conditional):
If adjustment exists:

- Refund or Charge alert (matching Step 3 styling)
- Detailed explanation

**Actions**:

- Save Draft & Exit: Save without finalizing (leaves in queue)
- Finalize Amendment: Complete the process

## Financial Impact Calculation

### Adjustment Types

```typescript
interface FinancialImpact {
  currentFarePrice: number; // Original flight price
  newFarePrice: number; // New flight price
  priceDifference: number; // Always (newPrice - oldPrice)
  adjustmentType: "refund" | "charge" | "none";
  adjustmentAmount: number; // Always positive, interpretation varies
  currency: string;
}

// Example 1: Price went down
// Current: $500, New: $400
// adjustmentType: "refund"
// adjustmentAmount: 100  ← Traveler receives $100

// Example 2: Price went up
// Current: $500, New: $600
// adjustmentType: "charge"
// adjustmentAmount: 100  ← Traveler pays additional $100

// Example 3: Same price
// Current: $500, New: $500
// adjustmentType: "none"
// adjustmentAmount: 0
```

### Color Coding

| Type   | Color   | Icon            | Meaning                  |
| ------ | ------- | --------------- | ------------------------ |
| Refund | Emerald | ✓ CheckCircle2  | Traveler receives credit |
| Charge | Amber   | ⚠ AlertTriangle | Traveler pays additional |
| None   | Slate   | -               | No financial change      |

## Traveler Approval Process

### Email Content (Sent in Step 4)

```
Subject: Amendment Request - Flight Change Required

Dear [Traveler Name],

Your booking [BK-REF] has a flight amendment request that needs your approval.

CURRENT FLIGHT:
[FROM] → [TO]
[DATE] at [TIME]
$[PRICE]

PROPOSED FLIGHT:
[FROM] → [TO]
[DATE] at [TIME]
$[PRICE]

FINANCIAL IMPACT:
[Amount] to be [refunded/charged]

[Unique Approval Link - valid for 24 hours]

This offer expires in 24 hours. Please review and respond promptly.
```

### Approval Link Flow (Customer Side)

1. Customer clicks unique link in email
2. Portal shows amendment details with visual comparison
3. Customer can:
   - Accept amendment (confirms in system)
   - Request changes (re-queues for admin)
   - Decline amendment (item returns to queue for alternatives)

## Error Handling

### Search Failures

```
"Unable to search alternative flights. Please try again."
- User can retry search
- Can modify search criteria (though not in current UI)
```

### Approval Send Failures

```
"Unable to send approval request. Please try again."
- User can retry sending approval
- Traveler hasn't been notified yet
```

### Finalization Failures

```
"Unable to finalize amendment. Please try again."
- User can retry finalization
- Traveler was already approved, safe to retry
```

## State Management

```typescript
// Modal state
const [selectedAmendment, setSelectedAmendment] =
  useState<FlightAmendmentRequest | null>(null);
const [amendmentDialogOpen, setAmendmentDialogOpen] = useState(false);

// Workflow state
const [step, setStep] = useState<
  "view" | "search" | "compare" | "user_approval" | "finalize"
>("view");

// Data state
const [offers, setOffers] = useState<AmendmentOffer | null>(null);
const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);

// UI state
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [userApprovalSent, setUserApprovalSent] = useState(false);
const [userApprovalWaitTime, setUserApprovalWaitTime] = useState<number | null>(
  null,
);
```

## Integration with BookingQueues

### Trigger

- Admin sees queue item with `product === "Flight"`
- Clicks dropdown actions menu
- Selects "Amend Flight" option (with lightning bolt icon)

### Flow

1. `handleOpenAmendment()` called with queue item
2. API call to fetch amendment request details
3. Modal opens with amendment data
4. Admin proceeds through 5-step workflow
5. On completion, `onAmendmentComplete()` callback fires
6. Queue refreshes automatically
7. Modal closes

## API Contracts

### Search Alternatives

```
POST /admin/bookings/:bookingId/amendment/search-flights
Authorization: Required
Request Body:
{
  currentFlight: {
    airline, departure, arrival, departureTime, arrivalTime,
    duration, stops, price, currency, id
  },
  requestType: "date_change" | "route_change" | "both",
  requestedDate?: "2024-02-15",
  requestedRoute?: { from: "JFK", to: "LAX" }
}
Response:
{
  flights: [ ... ],
  financialImpact: { }
}
```

### Send User Approval

```
POST /admin/bookings/:bookingId/amendment/send-user-approval
Authorization: Required
Request Body:
{
  amendmentId: string,
  selectedFlight: Flight,
  financialImpact: FinancialImpact,
  expiresIn: number (minutes, e.g., 1440 = 24 hours)
}
Response:
{
  approvalId: string,
  expiresAt: string (ISO timestamp),
  approvalLinkSent: boolean
}
```

### Get Amendment Request

```
GET /admin/bookings/:bookingId/amendment-request
Authorization: Required
Response:
{
  id: string,
  bookingId: string,
  bookingReference: string,
  traveler: string,
  currentFlight: Flight,
  requestType: "date_change" | "route_change" | "both",
  requestedDate?: string,
  requestedRoute?: { from: string, to: string },
  requestReason?: string,
  userApprovalStatus: "pending" | "approved" | "rejected",
  userApprovedOffer?: {
    flight: Flight,
    estimatedApprovalDate?: string
  }
}
```

### Finalize Amendment

```
POST /admin/bookings/:bookingId/amendment/finalize
Authorization: Required
Request Body:
{
  amendmentId: string,
  selectedFlight: Flight,
  financialImpact: FinancialImpact
}
Response:
{
  ... updated FlightAmendmentRequest
}
```

## UX Best Practices Implemented

1. **Clear Visual Hierarchy**: Each step has distinct sections with clear headers
2. **Color Coding**: Financial impacts use semantic colors (green=refund, amber=charge)
3. **Confirmation Mechanics**: Important actions require explicit user approval (e.g., "Send to Traveler")
4. **Error Prevention**: Modal tabs prevent accidental navigation before completing steps
5. **Progress Indication**: Tab bar shows workflow progress with disabled tabs for incomplete steps
6. **Detailed Feedback**: Each alert clearly explains what will happen next
7. **Time Awareness**: Shows 24-hour approval window explicitly
8. **Financial Transparency**: Breaks down all charges/refunds clearly
9. **Traveler Context**: Consistently shows traveler name and booking reference
10. **Recovery Options**: "Save Draft & Exit" allows pause without loss of data

## Future Enhancements

- [ ] Multi-leg journey amendments (connecting flights)
- [ ] Group traveler amendments (multiple passengers)
- [ ] Amendment history and audit trail per booking
- [ ] Automated alternative suggestions based on preferences
- [ ] SMS backup notification channel for approvals
- [ ] Refund processing integration
- [ ] Credit note generation for charge adjustments
- [ ] Dispute resolution workflow for declined amendments
