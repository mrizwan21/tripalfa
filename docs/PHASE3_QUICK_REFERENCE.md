# Phase 3 Quick Reference - Booking Engine UI

**Status:** ✅ COMPLETE | **Lines of Code:** 2,800+ | **Components:** 6

---

## 🚀 Quick Start

### 1. Import Components

```typescript
// Single component import
import { RequestChangeModal } from '@/components/OfflineRequests/RequestChangeModal';

// Or use barrel export
import { 
  RequestChangeModal,
  RequestStatus,
  RequestHistory,
  RequestApprovalFlow,
  RequestDetailSection,
  BookingDetailsRequestButton,
} from '@/components/OfflineRequests';
```

### 2. Use in a Page

```typescript
import { RequestChangeModal } from '@/components/OfflineRequests';
import { useState } from 'react';

export function MyPage() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button onClick={() => setOpen(true)}>
        Request Change
      </button>
      
      <RequestChangeModal
        open={open}
        onOpenChange={setOpen}
        onSubmit={() => {
          setOpen(false);
          // Refresh data here
        }}
      />
    </>
  );
}
```

---

## 📦 Components at a Glance

| Component | Purpose | Props Required | Where to Use |
|-----------|---------|-----------------|---|
| **RequestChangeModal** | Create new request | `open`, `onOpenChange` | Floating action, booking details |
| **RequestStatus** | Show request progress | `request` | Details modal, dashboard |
| **RequestApprovalFlow** | Handle customer approval | `request`, `onAccept?`, `onReject?` | Details modal (approved status) |
| **RequestHistory** | Show audit trail | `request`, `auditLogs?` | Details modal |
| **RequestDetailSection** | Compare original vs changes | `request` | Details modal |
| **BookingDetailsRequestButton** | Embed in booking page | `bookingId`, `bookingDetails`, `linkedRequests?` | Booking details page |

---

## 💡 Common Patterns

### Pattern 1: Show Request in Modal

```typescript
const [request, setRequest] = useState<OfflineChangeRequest | null>(null);
const [showDetails, setShowDetails] = useState(false);

// When user clicks "View"
const handleView = (req: OfflineChangeRequest) => {
  setRequest(req);
  setShowDetails(true);
};

// In render
return (
  <>
    <Button onClick={() => handleView(request)}>View</Button>
    
    <Dialog open={showDetails} onOpenChange={setShowDetails}>
      <DialogHeader>
        <DialogTitle>Request Details</DialogTitle>
      </DialogHeader>
      
      {request && (
        <div className="space-y-6">
          <RequestStatus request={request} />
          <RequestDetailSection request={request} />
          <RequestHistory request={request} />
        </div>
      )}
    </Dialog>
  </>
);
```

### Pattern 2: Handle Approval Decision

```typescript
const handleAccept = async () => {
  setLoading(true);
  try {
    await acceptRequest(request.id);
    toast.success('Changes accepted!');
    refetch(); // Refresh request status
  } catch (err) {
    toast.error('Failed to accept changes');
  } finally {
    setLoading(false);
  }
};

// In component
<RequestApprovalFlow
  request={request}
  onAccept={handleAccept}
  onReject={handleReject}
  isLoading={loading}
/>
```

### Pattern 3: Embed in Booking Details

```typescript
// In existing booking details page
<BookingDetailsRequestButton
  bookingId="BOOKING_12345"
  bookingDetails={{
    route: "NYC → LAX",
    departureDate: "2024-06-15",
    passengers: 2,
    totalPrice: 1200.00,
  }}
  linkedRequests={activeRequests}
  onRequestCreated={() => {
    // Refresh requests list
    refetchRequests();
  }}
/>
```

---

## 🔌 Hook Usage

```typescript
import { useCustomerOfflineRequests } from '@/hooks/useCustomerOfflineRequests';

function MyComponent() {
  const { 
    getMyRequests, 
    submitRequest, 
    cancelRequest, 
    trackStatus,
    loading,
    error 
  } = useCustomerOfflineRequests();

  // Get requests
  const handleGetRequests = async () => {
    const result = await getMyRequests({
      status: 'pending',
      limit: 10,
    });
    console.log(result.data); // Array of OfflineChangeRequest
  };

  // Submit new request
  const handleSubmit = async () => {
    const result = await submitRequest({
      bookingId: 'BOOKING_123',
      changeType: 'date',
      newDate: '2024-07-20',
      reason: 'Need earlier departure',
    });
    console.log(result.data); // New request object
  };

  // Cancel request
  const handleCancel = async () => {
    await cancelRequest('REQUEST_ID_123');
  };

  return (
    <div>
      {error && <ErrorAlert message={error} />}
      {loading && <Spinner />}
      
      <Button onClick={handleGetRequests}>Load Requests</Button>
      <Button onClick={handleSubmit}>Submit Request</Button>
      <Button onClick={handleCancel}>Cancel Request</Button>
    </div>
  );
}
```

---

## 🎨 Styling Customization

### Override Component Styles

```typescript
// Custom wrapper component
function CustomRequestModal(props) {
  return (
    <div className="custom-theme">
      <RequestChangeModal 
        {...props}
        className="custom-modal" // If component accepts className
      />
    </div>
  );
}
```

### Use Tailwind Classes

All components use Tailwind CSS and Shadcn/ui, so you can:
- Override with Tailwind classes
- Use CSS modules
- Apply theme variables

---

## 📊 Type Definitions

### OfflineChangeRequest

```typescript
interface OfflineChangeRequest {
  id: string;
  bookingId: string;
  customerId: string;
  status: 'pending' | 'submitted' | 'under_review' | 'approved' | 'completed' | 'rejected';
  priority?: 'low' | 'medium' | 'high';
  
  originalBooking?: {
    route?: string;
    departureDate?: string;
    cabin?: string;
    passengers?: number;
    baseFare?: number;
    taxes?: number;
    fees?: number;
    totalPrice?: number;
    passengerNames?: string[];
    flights?: Array<{ airline: string; flightNumber: string; }>;
  };

  requestedChanges?: {
    newDepartureDate?: string;
    newRoute?: string;
    newCabin?: string;
    reason?: string;
    additionalNotes?: string;
    newBaseFare?: number;
    newTaxes?: number;
    newFees?: number;
    newTotalPrice?: number;
    newFlights?: any[];
    newPassengers?: string[];
  };

  createdAt: string;
  updatedAt: string;
  reviewDeadline?: string;
  assignedStaffId?: string;
  adminNotes?: string;
}
```

---

## 🐛 Common Issues

### Issue: Component not rendering

**Check:**
1. Is `open={true}` and `onOpenChange` provided?
2. Are dependencies in package.json?
3. Run `npm install` in workspace?

```bash
npm install
npm run dev --workspace=@tripalfa/booking-engine
```

### Issue: API calls failing

**Check:**
1. Is API Gateway running on port 3001?
2. Is booking-service running on port 3002?
3. Is JWT token valid?
4. CORS enabled?

```bash
# Verify ports
lsof -i :3001
lsof -i :3002

# Logs
tail -f services/api-gateway/logs.txt
tail -f services/booking-service/logs.txt
```

### Issue: TypeScript errors in imports

**Check:**
1. Path aliases configured in tsconfig.json?
2. File exists?
3. Correct import path?

```typescript
// ❌ Wrong
import RequestChangeModal from './RequestChangeModal.tsx';

// ✅ Correct
import { RequestChangeModal } from '@/components/OfflineRequests';
```

---

## ⏱️ Integration Timeline

| Step | Time | Description |
|------|------|-------------|
| 1 | 5 min | Import components |
| 2 | 5 min | Add routes |
| 3 | 5 min | Update navigation |
| 4 | 10 min | Integrate into booking details |
| 5 | 5 min | Test all functionality |
| 6 | 5 min | Check TypeScript |

**Total:** 30-45 minutes

---

## 🔗 Related Files

**Backend:**
- `/services/booking-service/src/controllers/offlineRequestController.ts`
- `/services/booking-service/src/services/offlineRequestService.ts`
- `/database/prisma/schema.prisma` (OfflineChangeRequest model)

**Types:**
- `/packages/shared-types/types/offline-request.ts`

**B2B Admin (Reference):**
- `/apps/b2b-admin/src/components/OfflineRequests/` (similar patterns)
- `/apps/b2b-admin/src/hooks/useOfflineRequests.ts`

**Documentation:**
- `docs/PHASE3_BOOKING_ENGINE_COMPLETE.md` (full guide)
- `docs/B2B_ADMIN_OFFLINE_REQUESTS_PHASE2.md` (B2B reference)

---

## ✅ Verification Commands

```bash
# TypeScript check
npx tsc -p tsconfig.json --noEmit

# Build booking engine
npm run build --workspace=@tripalfa/booking-engine

# Run dev server
npm run dev --workspace=@tripalfa/booking-engine

# Lint
npm run lint

# Format
npm run format
```

---

## 📚 Next Steps

1. **Integrate components into booking engine**
2. **Test all workflows** (create, view, approve, reject, cancel)
3. **Add to booking details page**
4. **Set up route** for `/my-requests`
5. **Verify API connectivity**
6. **Deploy to staging**

Then move to **Phase 4: Notification Integration** 🚀

---

**Quick Links:**
- 📋 Full docs: `docs/PHASE3_BOOKING_ENGINE_COMPLETE.md`
- 🎯 Files created: 6 components + 1 hook + 1 page
- ✅ Status: Complete
- ⏳ Next: Phase 4 - Notifications
