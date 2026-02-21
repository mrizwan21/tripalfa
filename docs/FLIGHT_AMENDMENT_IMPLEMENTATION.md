# Flight Amendment Workflow - Implementation Summary

## 📋 Overview
A sophisticated five-step workflow designed to handle complex flight amendment scenarios in the B2B admin booking system. This workflow manages financial impacts, itinerary changes, traveler approvals, and final processing with an intuitive, transparent user experience.

## 🎯 Key Features

### Multi-Step Workflow
- **Step 1: View Current Booking** - Display context and amendment request details
- **Step 2: Search Alternatives** - Find available flight options  
- **Step 3: Compare & Financial Impact** - Side-by-side comparison with financial calculations
- **Step 4: User Approval** - Send offer to traveler with 24-hour expiration
- **Step 5: Finalize Amendment** - Process confirmed amendment

### Financial Impact Calculation
- **Automatic Detection**: Calculates whether amendment results in refund, charge, or no change
- **Semantic Color Coding**: Emerald for refunds, amber for charges, slate for no change
- **Transparent Breakdown**: Shows current fare, new fare, and adjustment difference
- **Clear Communication**: Explains what happens next (e.g., "5-7 business days" for refunds)

### Traveler Approval System
- **Secure 24-Hour Window**: Approval links expire after 24 hours
- **Email Notification**: Sends summary to traveler with unique approval link
- **Visual Tracking**: Admin can see approval status and remaining time
- **Transparent Details**: Shows what the traveler is approving before finalization

## 📁 Files Created/Modified

### New Files
1. **FlightAmendmentWorkflow.tsx** (577 lines)
   - Main component managing the 5-step workflow
   - Type definitions for Flight, FlightAmendmentRequest, AmendmentOffer
   - API integration for search, approval, and finalization
   - State management for step progression and data handling

2. **FLIGHT_AMENDMENT_WORKFLOW.md** 
   - Comprehensive documentation with ASCII diagrams
   - API contracts for all endpoints
   - "Best practices" for UX implementation
   - Error handling strategies

### Modified Files
1. **BookingQueues.tsx**
   - Added import for FlightAmendmentWorkflow component
   - Added state for amendment modal management
   - Added `handleOpenAmendment()` function to load amendment requests
   - Enhanced actions dropdown with "Amend Flight" option (flight icon + lightning bolt)
   - Integrated FlightAmendmentWorkflow modal at component bottom
   - Added refresh on amendment completion

## 🏗️ Architecture

### Component Hierarchy
```
BookingQueuesPage
├── Dropdown Menu
│   └── "Amend Flight" Action (for Flight products)
│       └── handleOpenAmendment() 
│           └── Fetch amendment details
│               └── Open FlightAmendmentWorkflow Modal
│
└── FlightAmendmentWorkflow Modal
    ├── Step 1: View (Current booking context)
    ├── Step 2: Search (Alternative flights)
    ├── Step 3: Compare (Financial analysis)
    ├── Step 4: User Approval (Wait for traveler)
    └── Step 5: Finalize (Process amendment)
```

### State Management
```typescript
// Workflow control
const [step, setStep] = useState<"view" | "search" | "compare" | "user_approval" | "finalize">("view");

// Data
const [offers, setOffers] = useState<AmendmentOffer | null>(null);
const [selectedFlight, setSelectedFlight] = useState<Flight | null>(null);
const [selectedAmendment, setSelectedAmendment] = useState<FlightAmendmentRequest | null>(null);

// UI
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
const [userApprovalSent, setUserApprovalSent] = useState(false);
const [userApprovalWaitTime, setUserApprovalWaitTime] = useState<number | null>(null);
```

## 🔌 API Integration Points

### 1. Get Amendment Request
```
GET /admin/bookings/:bookingId/amendment-request
```
Called when admin clicks "Amend Flight" action

### 2. Search Alternatives
```
POST /admin/bookings/:bookingId/amendment/search-flights
Body: { currentFlight, requestType, requestedDate?, requestedRoute? }
Response: { flights[], financialImpact{} }
```
Called in Step 2

### 3. Send User Approval
```
POST /admin/bookings/:bookingId/amendment/send-user-approval
Body: { amendmentId, selectedFlight, financialImpact, expiresIn }
Response: { approvalId, expiresAt, approvalLinkSent }
```
Called in Step 3 → 4 transition

### 4. Finalize Amendment
```
POST /admin/bookings/:bookingId/amendment/finalize
Body: { amendmentId, selectedFlight, financialImpact }
Response: { updated FlightAmendmentRequest }
```
Called in Step 5

## 💰 Financial Impact Logic

### Calculation Flow
```
1. Get Current Fare from existing flight
2. Get New Fare from selected alternative
3. Calculate priceDifference = newFare - currentFare
4. Determine adjustmentType:
   - If newFare > currentFare → "charge" (admin charges traveler difference)
   - If newFare < currentFare → "refund" (admin refunds traveler difference)
   - If newFare = currentFare → "none" (no adjustment)
5. adjustmentAmount = abs(priceDifference)
```

### Example Scenarios
| Current | New | Type | Amount | Traveler Action |
|---------|-----|------|--------|-----------------|
| $500 | $450 | refund | $50 | Receives credit |
| $500 | $600 | charge | $100 | Pays additional |
| $500 | $500 | none | $0 | No change |

## 🎨 UI Components Used

- **Dialog** - Modal container
- **Card** - Section containers
- **Button** - Actions (variants: default, outline, secondary)
- **Badge** - Status indicators
- **Tabs** - Step navigation
- **Lucide Icons** - Visual feedback (Plane, ArrowRight, CheckCircle2, AlertTriangle, etc.)
- **Custom Alert Divs** - Colored alert boxes (semantic colors)

## 🔒 Security & Validation

### Early Validations
- Amendment request must exist before opening workflow
- Selected flight validation in Step 3 transition
- User approval confirmation required before finalization
- 24-hour expiration prevents stale approvals

### Error Handling
- Try-catch blocks on all API calls
- User-friendly error messages
- State cleanup on failures
- Retry capability maintained

## 📊 User Experience Flows

### Happy Path (Admin Perspective)
1. Click "Amend Flight" → Modal opens with current booking
2. Click "Search Alternatives" → Wait for results, see list of options
3. Click flight card → Move to comparison view
4. See side-by-side comparison + financial impact
5. Click "Send to Traveler..." → Approval sent, wait display shown
6. Check back later, see "Traveler approved"
7. Click "Finalize Amendment" → Complete!
8. Queue automatically refreshes

### Traveler Perspective (Email)
1. Receive email with amendment summary
2. Click unique approval link
3. See current vs proposed itinerary + financial impact
4. Accept or decline
5. If accepted, receive booking confirmation with new details

## 🚀 Features Highlighting Best Practices

### 1. **Transparent Financial Communication**
- Shows all numbers clearly
- Explains impacts in plain language
- Color-coded for quick understanding
- Processing time explicit (5-7 days for refunds)

### 2. **Confirmation Mechanics**
- "Send to Traveler" requires deliberate action (not automatic)
- Finalization requires 24-hour traveler approval completion
- Multi-step process prevents accidental confirmations

### 3. **Progress Indication**
- Step tabs show workflow progress
- Disabled tabs prevent jumping ahead
- Current step always clear
- Completion path obvious

### 4. **Error Prevention**
- Validation at each step
- Loading states prevent double-clicks
- Cancelled amendments can be restarted
- Draft options for pause points

### 5. **Admin Context**
- Always shows booking reference + traveler name
- Request details (why amendment needed) visible
- Amendment reason quoted from traveler
- Calendar-aware date displays

## 📝 Type Safety

```typescript
export interface Flight {
  id: string;
  airline: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  duration: string;
  stops: number;
  price: number;
  currency: string;
}

export interface FlightAmendmentRequest {
  id: string;
  bookingId: string;
  bookingReference: string;
  traveler: string;
  currentFlight: Flight;
  requestType: "date_change" | "route_change" | "both";
  requestedDate?: string;
  requestedRoute?: { from: string; to: string };
  requestReason?: string;
  userApprovalStatus: "pending" | "approved" | "rejected";
  userApprovedOffer?: { flight: Flight; estimatedApprovalDate?: string };
}

export interface AmendmentOffer {
  flights: Flight[];
  financialImpact: {
    currentFarePrice: number;
    newFarePrice: number;
    priceDifference: number;
    adjustmentType: "refund" | "charge" | "none";
    adjustmentAmount: number;
    currency: string;
  };
}
```

## 🔄 Integration with BookingQueues

### Queue Item Selection
- Flight product type → Shows "Amend Flight" action
- Other products (Hotel, Package) → Don't show amendment option

### Action Trigger
```typescript
const handleOpenAmendment = async (queueItem: QueueItem) => {
  try {
    const res = await api.get(`/admin/bookings/${queueItem.id}/amendment-request`);
    setSelectedAmendment(res.data);
    setAmendmentDialogOpen(true);
  } catch (err) {
    setUpdateError("Unable to load amendment details. Please try again.");
  }
};
```

### Queue Refresh
- On amendment completion, `refreshQueues()` called
- Queue automatically updates
- Admin can see amendment status updated

## 📊 Next Steps for Backend Implementation

1. **Endpoint: GET /admin/bookings/:id/amendment-request**
   - Fetch flight amendment request from database
   - Include current flight details, request reason, traveler info
   - Return FlightAmendmentRequest type

2. **Endpoint: POST /admin/bookings/:id/amendment/search-flights**
   - Accept search criteria (current flight, request type, dates, routes)
   - Query flight inventory provider APIs
   - Calculate financial impact for each option
   - Return array of flights with impacts

3. **Endpoint: POST /admin/bookings/:id/amendment/send-user-approval**
   - Generate unique approval token
   - Send email to traveler with amendment summary + approval link
   - Store approval request with 24-hour expiration
   - Return approval metadata

4. **Endpoint: POST /admin/bookings/:id/amendment/finalize**
   - Verify traveler approval exists and is valid
   - Update booking with new flight details
   - Process financial adjustment (refund or charge)
   - Send confirmation email to traveler
   - Update amendment status to 'completed'
   - Return updated booking

## ✅ Testing Checklist

- [ ] Amendment modal opens with correct queue item data
- [ ] Search alternatives works with various request types
- [ ] Financial impact calculation is accurate
- [ ] Traveler approval email sent successfully
- [ ] 24-hour timer displays correctly
- [ ] Finalization processes amendment correctly
- [ ] Queue refreshes after amendment completion
- [ ] Error messages display appropriately
- [ ] Loading states prevent double-submissions
- [ ] All step transitions work as expected
- [ ] Mobile responsiveness validated (tab text hides on small screens)
- [ ] Accessibility verified (icons have descriptions, focus management)

## 🎓 Learning Resources

For developers implementing the backend:
- Review FLIGHT_AMENDMENT_WORKFLOW.md for detailed flow diagrams
- Check API contract section for exact request/response shapes
- Financial impact calculation examples in Financial Impact Analysis section
- Error handling strategies in Error Handling section

