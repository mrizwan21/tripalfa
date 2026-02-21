# Flight Amendment Workflow - Quick Start Guide

## 🎯 What Was Built

A complete **5-step flight amendment workflow** that handles complex booking amendments with financial reconciliation, traveler approvals, and intuitive admin UX.

### Key Components
1. **FlightAmendmentWorkflow.tsx** - Main modal component (440 lines)
2. **BookingQueues Integration** - "Amend Flight" action for queue items
3. **Comprehensive Documentation** - Design specs, API contracts, UX patterns

---

## 🚀 Quick Start for Backend Developers

### Step 1: Implement 4 API Endpoints

#### 1.1 GET /admin/bookings/:id/amendment-request
```typescript
// Fetch flight amendment request
// Called when admin clicks "Amend Flight" in queue

// Response
{
  id: "amd-123",
  bookingId: "bk-456",
  bookingReference: "BK-9001",
  traveler: "Sarah Green",
  currentFlight: {
    id: "fl-001",
    airline: "Emirates",
    departure: "JFK",
    arrival: "DXB",
    departureTime: "2024-02-15 10:00",
    arrivalTime: "2024-02-16 04:30",
    duration: "14h 30m",
    stops: 0,
    price: 780,
    currency: "USD"
  },
  requestType: "date_change", // or "route_change", "both"
  requestedDate: "2024-02-20",
  requestedRoute: null,
  requestReason: "Family emergency - need earlier flight",
  userApprovalStatus: "pending",
  userApprovedOffer: null
}
```

#### 1.2 POST /admin/bookings/:id/amendment/search-flights
```typescript
// Search alternative flights based on amendment criteria
// Called when admin clicks "Search Alternatives"

// Request Body
{
  currentFlight: { ... },
  requestType: "date_change",
  requestedDate: "2024-02-20",
  requestedRoute: null
}

// Response
{
  flights: [
    {
      id: "fl-101",
      airline: "Emirates",
      departure: "JFK",
      arrival: "DXB",
      departureTime: "2024-02-20 09:00",
      arrivalTime: "2024-02-21 03:30",
      duration: "14h 30m",
      stops: 0,
      price: 850,
      currency: "USD"
    },
    // ... more flights
  ],
  financialImpact: {
    currentFarePrice: 780,
    newFarePrice: 850,
    priceDifference: 70,
    adjustmentType: "charge",
    adjustmentAmount: 70,
    currency: "USD"
  }
}
```

#### 1.3 POST /admin/bookings/:id/amendment/send-user-approval
```typescript
// Send amendment offer to traveler for approval
// Called when admin clicks "Send to Traveler for Approval"

// Request Body
{
  amendmentId: "amd-123",
  selectedFlight: { ... },
  financialImpact: { ... },
  expiresIn: 1440  // 24 hours in minutes
}

// Response
{
  approvalId: "apr-789",
  expiresAt: "2024-02-14T14:30:00Z",
  approvalLinkSent: true,
  approvalLink: "https://app.com/amendment/approve/tok_xyz123"
}
```

**Email to send to traveler:**
```
Subject: Flight Amendment Request - Action Required

Dear Sarah,

Your booking BK-9001 has a flight amendment offer that needs your approval.

CURRENT FLIGHT:
Emirates - JFK → DXB
Feb 15, 10:00 AM - Feb 16, 4:30 AM
$780 USD

PROPOSED FLIGHT:
Emirates - JFK → DXB
Feb 20, 9:00 AM - Feb 21, 3:30 AM
$850 USD

FINANCIAL IMPACT:
Additional charge: $70 USD
(Will be charged to your payment method)

APPROVE THIS AMENDMENT:
[Unique Approval Link - Valid for 24 hours]

Questions? Contact support@tripalfa.com
```

#### 1.4 POST /admin/bookings/:id/amendment/finalize
```typescript
// Process amendment after traveler approval
// Called when admin clicks "Finalize Amendment" in Step 5

// Request Body
{
  amendmentId: "amd-123",
  selectedFlight: { ... },
  financialImpact: { ... }
}

// Response - Updated amendment record
{
  id: "amd-123",
  bookingId: "bk-456",
  bookingReference: "BK-9001",
  traveler: "Sarah Green",
  currentFlight: { ... original ... },
  requestType: "date_change",
  requestedDate: "2024-02-20",
  requestedRoute: null,
  requestReason: "Family emergency - need earlier flight",
  userApprovalStatus: "approved",  // Changed!
  userApprovedOffer: {
    flight: { ... new flight ... },
    estimatedApprovalDate: "2024-02-14T10:30:00Z"
  }
}
```

---

## 🔄 Workflow Flow Diagram

```
Admin Queue View
    ↓
[Sees "Amend Flight" action on flight product]
    ↓
[Clicks dropdown → Selects "Amend Flight"]
    ↓
handleOpenAmendment() → Fetch amendment-request
    ↓
FlightAmendmentWorkflow Modal Opens (Step 1: View)
    ├─ Shows current flight details
    ├─ Shows traveler's amendment request reason
    └─ Click "Search Alternatives"
           ↓
    [Step 2: Search]
    ├─ Calls POST /amendment/search-flights
    ├─ Shows list of available options
    └─ Click flight card
           ↓
    [Step 3: Compare]
    ├─ Side-by-side itinerary comparison
    ├─ Financial impact analysis (charge/refund/none)
    └─ Click "Send to Traveler for Approval"
           ↓
    [Transfer to Step 4: User Approval]
    ├─ Calls POST /amendment/send-user-approval
    ├─ Email sent to traveler
    ├─ Shows approval pending state
    └─ Admin comes back later...
           ↓
    [Traveler receives email with unique approval link]
    ├─ Clicks link in email
    ├─ Reviews amendment details on consumer portal
    └─ Clicks "Accept Amendment"
           ↓
    [Approval recorded in system]
    ├─ Admin checks approval status
    └─ Click "Check Approval Status" if needed
           ↓
    [Step 5: Finalize]
    ├─ Shows amendment summary
    ├─ Click "Finalize Amendment"
    ├─ Calls POST /amendment/finalize
    └─ Success! Queue refreshes
           ↓
Amendment Complete ✓
- New flight ticket issued
- Financial adjustment processed (if any)
- Confirmation email sent to traveler
```

---

## 💾 Database Schema Recommendations

### Flight Amendment Table
```sql
CREATE TABLE flight_amendments (
  id UUID PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES bookings(id),
  amendment_request_id UUID,
  
  -- Current Booking Info
  current_flight_id UUID NOT NULL,
  current_flight_price DECIMAL(10, 2),
  
  -- Request Details
  request_type ENUM('date_change', 'route_change', 'both'),
  requested_date DATE,
  requested_route_from VARCHAR(3),
  requested_route_to VARCHAR(3),
  request_reason TEXT,
  
  -- Selected Amendment
  selected_flight_id UUID,
  new_flight_price DECIMAL(10, 2),
  
  -- Financial Impact
  adjustment_type ENUM('refund', 'charge', 'none'),
  adjustment_amount DECIMAL(10, 2),
  currency VARCHAR(3),
  
  -- Status Tracking
  status ENUM('pending', 'search_sent', 'awaiting_approval', 'approved', 'rejected', 'completed'),
  user_approval_status ENUM('pending', 'approved', 'rejected'),
  user_approved_at TIMESTAMP,
  finalized_at TIMESTAMP,
  
  -- Audit
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_by UUID,
  
  INDEX idx_booking_id (booking_id),
  INDEX idx_status (status),
  INDEX idx_created_at (created_at)
);

CREATE TABLE amendment_approvals (
  id UUID PRIMARY KEY,
  amendment_id UUID NOT NULL REFERENCES flight_amendments(id),
  approval_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  approved_at TIMESTAMP,
  rejected_at TIMESTAMP,
  rejection_reason TEXT,
  
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_amendment_id (amendment_id),
  INDEX idx_token (approval_token),
  INDEX idx_expires_at (expires_at)
);
```

---

## 🎨 Frontend Usage

### In BookingQueues.tsx
```typescript
import FlightAmendmentWorkflow, { FlightAmendmentRequest } from "../components/FlightAmendmentWorkflow";

export default function BookingQueuesPage() {
  // ... existing state ...
  const [selectedAmendment, setSelectedAmendment] = useState<FlightAmendmentRequest | null>(null);
  const [amendmentDialogOpen, setAmendmentDialogOpen] = useState(false);

  const handleOpenAmendment = async (queueItem: QueueItem) => {
    try {
      const res = await api.get(`/admin/bookings/${queueItem.id}/amendment-request`);
      setSelectedAmendment(res.data as FlightAmendmentRequest);
      setAmendmentDialogOpen(true);
    } catch (err) {
      setUpdateError("Unable to load amendment details.");
    }
  };

  // ... in JSX ...
  <DropdownMenuContent>
    {/* ... status options ... */}
    {queueItem.product === "Flight" && (
      <DropdownMenuItem onClick={() => handleOpenAmendment(queueItem)}>
        <Zap className="mr-2 h-3 w-3" />
        Amend Flight
      </DropdownMenuItem>
    )}
  </DropdownMenuContent>

  // At bottom of component:
  <FlightAmendmentWorkflow
    amendment={selectedAmendment}
    open={amendmentDialogOpen}
    onOpenChange={setAmendmentDialogOpen}
    onAmendmentComplete={(result) => {
      console.log("Amendment completed:", result);
      refreshQueues(); // Refresh queue
      setAmendmentDialogOpen(false);
    }}
  />
}
```

---

## ✅ Implementation Checklist

Backend:
- [ ] Create flight_amendments table
- [ ] Create amendment_approvals table
- [ ] Implement GET /admin/bookings/:id/amendment-request
- [ ] Implement POST /admin/bookings/:id/amendment/search-flights
- [ ] Implement POST /admin/bookings/:id/amendment/send-user-approval
- [ ] Implement POST /admin/bookings/:id/amendment/finalize
- [ ] Setup email service for amendment notifications
- [ ] Add background job for approval expiration cleanup
- [ ] Add financial adjustment processing logic
- [ ] Create amendment status transitions in booking service

Frontend:
- [ ] Verify FlightAmendmentWorkflow component mounts correctly
- [ ] Test all 5 step transitions
- [ ] Verify API calls match contracts
- [ ] Test error states on each step
- [ ] Verify loading states prevent double-submission
- [ ] Mobile responsiveness test
- [ ] Accessibility audit (keyboard navigation, screen readers)

Quality:
- [ ] API endpoint integration tests
- [ ] End-to-end workflow test
- [ ] Financial calculation validation
- [ ] Email content verification
- [ ] Performance testing (search results with large data)
- [ ] Security: Authorization checks on all endpoints
- [ ] Security: SQL injection prevention
- [ ] Security: XSS prevention in traveler reason display

---

## 📚 Reference Documents

- [FLIGHT_AMENDMENT_WORKFLOW.md](FLIGHT_AMENDMENT_WORKFLOW.md) - Comprehensive 600+ line guide with detailed UX flow, API contracts, error handling
- [FLIGHT_AMENDMENT_IMPLEMENTATION.md](FLIGHT_AMENDMENT_IMPLEMENTATION.md) - Architecture overview, component details, testing checklist
- Component Type Definitions: See FlightAmendmentWorkflow.tsx top section for Flight, FlightAmendmentRequest, AmendmentOffer types

---

## 🔐 Security Considerations

1. **Authorization**: Verify user has 'bookings:manage' permission before accessing amendment endpoints
2. **Validation**: Sanitize all traveler input (reason, request details)
3. **Token Security**: Use cryptographically secure random tokens for approval links
4. **Expiration**: Approve links must expire after 24 hours (non-negotiable)
5. **Financial**: Double-check all financial calculations server-side
6. **Audit Trail**: Log all amendment actions for compliance

---

## 🚨 Troubleshooting

**Modal opens but no data shows:**
- Verify amendment-request endpoint returns correct FlightAmendmentRequest shape
- Check console for API errors

**Search returns no results:**
- Verify flight search endpoint has access to inventory data
- Check requested date is in future
- Verify airline codes are valid

**Traveler never gets approval email:**
- Check email service is configured correctly
- Verify approval link is generated and sent
- Check spam folder / email logs

**Financial impact shows incorrect amounts:**
- Verify currentFarePrice and newFarePrice match actual flight prices
- Double-check adjustmentType logic: charge vs refund vs none
- Verify currency matches booking currency

---

## 📞 Support & Questions

If implementing this workflow, refer to:
1. FLIGHT_AMENDMENT_WORKFLOW.md for detailed UX/flow specs
2. FLIGHT_AMENDMENT_IMPLEMENTATION.md for architecture
3. Type definitions in FlightAmendmentWorkflow.tsx
4. API contracts section in this document

Good luck! 🚀

