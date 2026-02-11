# Phase 2 B2B Admin - Quick Reference

## 🚀 Quick Start

### 1. Import the Hook
```typescript
import { useOfflineRequests } from '@/hooks/useOfflineRequests';
```

### 2. Use in Component
```typescript
const MyComponent = () => {
  const { queue, loading, error, fetchQueue } = useOfflineRequests();

  useEffect(() => {
    fetchQueue();
  }, []);

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {queue.map(request => (
        <div key={request.id}>{request.bookingId}</div>
      ))}
    </div>
  );
};
```

---

## 📦 Component API Reference

### useOfflineRequests Hook

**State:**
```typescript
{
  queue: OfflineChangeRequest[],        // All requests in current page
  currentRequest: OfflineChangeRequest | null,  // Currently selected request
  auditLog: OfflineRequestAuditLog[],  // History for current request
  loading: boolean,                     // Loading state
  error: string | null,                 // Error message
  pagination: {
    total: number,
    page: number,
    pageSize: number,
    totalPages: number,
  }
}
```

**Methods:**

#### fetchQueue(filters?)
Fetch staff queue with optional filtering and pagination.

```typescript
// Basic usage
await fetchQueue();

// With filters
await fetchQueue({
  status: 'submitted',
  priority: 'high',
  page: 1,
  pageSize: 50,
});
```

#### getRequest(id)
Get detailed information for a single request.

```typescript
const request = await getRequest('req-123');
// Sets currentRequest state
```

#### submitPricing(id, baseFare, taxes, fees, notes?)
Submit new pricing for a request.

```typescript
await submitPricing('req-123', 450, 89, 10, 'Price adjustment due to availability');
```

#### completeRequest(id, documents, notes?)
Mark a request as complete with generated documents.

```typescript
await completeRequest('req-123', {
  eTicketNumber: 'TKT-XXX-YYY',
  voucherNumber: 'VOC-XXX-YYY',
  invoiceId: 'INV-XXX-YYY',
}, 'Booking completed and confirmed');
```

#### addNote(id, note)
Add an internal note to a request.

```typescript
await addNote('req-123', 'Customer called - needs urgent processing');
```

#### getAuditLog(id)
Fetch the complete audit trail for a request.

```typescript
const logs = await getAuditLog('req-123');
// Sets auditLog state
```

#### cancelRequest(id, reason)
Cancel a request with reason.

```typescript
await cancelRequest('req-123', 'Customer decided to keep original booking');
```

---

## 🎨 Component Props

### RequestQueueTable

```typescript
interface RequestQueueTableProps {
  requests: OfflineChangeRequest[];
  onSelectRequest: (request: OfflineChangeRequest) => void;
  onPricingSubmit: (request: OfflineChangeRequest) => void;
  loading?: boolean;
}
```

**Usage:**
```typescript
<RequestQueueTable
  requests={queue}
  onSelectRequest={handleSelectRequest}
  onPricingSubmit={handlePricingSubmit}
  loading={loading}
/>
```

---

### PricingSubmissionForm

```typescript
interface PricingSubmissionFormProps {
  request: OfflineChangeRequest;
  onSubmit: (baseFare: number, taxes: number, fees: number, notes?: string) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}
```

**Usage:**
```typescript
<PricingSubmissionForm
  request={currentRequest}
  onSubmit={handlePricingFormSubmit}
  onCancel={() => setOpen(false)}
  isLoading={loading}
/>
```

---

### RequestDetailModal

```typescript
interface RequestDetailModalProps {
  request: OfflineChangeRequest | null;
  auditLog?: OfflineRequestAuditLog[];
  isOpen: boolean;
  onClose: () => void;
  onAddNote?: () => void;
  onCancel?: () => void;
}
```

**Usage:**
```typescript
<RequestDetailModal
  request={currentRequest}
  auditLog={auditLog}
  isOpen={isDetailOpen}
  onClose={() => setDetailOpen(false)}
  onAddNote={() => setAddNoteOpen(true)}
  onCancel={handleCancel}
/>
```

---

## 🔑 Key Types

```typescript
// Status values
type OfflineRequestStatus = 
  | 'pending'
  | 'submitted'
  | 'under_review'
  | 'approved'
  | 'rejected'
  | 'completed'
  | 'cancelled'
  | 'expired';

// Priority values
type RequestPriority = 'low' | 'medium' | 'high' | 'urgent';

// Main request object
interface OfflineChangeRequest {
  id: string;
  bookingId: string;
  customerId: string;
  customerEmail: string;
  status: OfflineRequestStatus;
  priority?: RequestPriority;
  reasonForChange?: string;
  originalBooking?: {
    departureCity: string;
    arrivalCity: string;
    departureDate: string;
    adultPassengers?: number;
    childPassengers?: number;
    baseFare?: number;
    taxes?: number;
    fees?: number;
    totalPrice?: number;
  };
  requestedChanges?: {
    newDepartureDate?: string;
    newReturnDate?: string;
    newRoute?: string;
    newAdultPassengers?: number;
    newChildPassengers?: number;
    newBaseFare?: number;
    newTaxes?: number;
    newFees?: number;
    newTotalPrice?: number;
    additionalNotes?: string;
  };
  createdAt: string;
  updatedAt: string;
}

// Audit log entry
interface OfflineRequestAuditLog {
  id: string;
  requestId: string;
  action: string; // CREATED, SUBMITTED, APPROVED, REJECTED, etc.
  changedFields?: Record<string, any>;
  createdAt: string;
}
```

---

## 📊 Status Badge Colors

| Status | Color |
|--------|-------|
| pending | yellow |
| submitted | blue |
| under_review | orange |
| approved | green |
| rejected | red |
| completed | purple |
| cancelled | gray |
| expired | gray |

---

## 🎯 Common Tasks

### Display Queue
```typescript
const { queue, fetchQueue, loading } = useOfflineRequests();

useEffect(() => {
  fetchQueue();
}, []);

return !loading ? (
  <RequestQueueTable requests={queue} {...props} />
) : (
  <Loading />
);
```

### Filter by Status
```typescript
const handleFilterChange = async (status: string) => {
  await fetchQueue({ status, page: 1 });
};
```

### Handle Pricing Submission
```typescript
const handlePricingSubmit = async (
  baseFare: number,
  taxes: number,
  fees: number,
  notes?: string
) => {
  try {
    await submitPricing(currentRequest.id, baseFare, taxes, fees, notes);
    setShowSuccess(true);
  } catch (error) {
    setError(error.message);
  }
};
```

### Show Request Details
```typescript
const handleViewRequest = async (request: OfflineChangeRequest) => {
  await getRequest(request.id);
  await getAuditLog(request.id);
  setShowModal(true);
};
```

---

## 🔗 API Endpoints Quick Reference

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/offline-requests/queue` | Get staff queue |
| GET | `/api/offline-requests/:id` | Get request details |
| PUT | `/api/offline-requests/:id/pricing` | Submit pricing |
| PUT | `/api/offline-requests/:id/complete` | Mark complete |
| POST | `/api/offline-requests/:id/notes` | Add note |
| GET | `/api/offline-requests/:id/audit` | Get audit log |
| PUT | `/api/offline-requests/:id/cancel` | Cancel request |

---

## ⚠️ Common Issues & Solutions

### Issue: AuthenticationError
**Solution:** Check auth token in localStorage
```typescript
localStorage.getItem('auth_token') // Should return JWT token
```

### Issue: 404 API Not Found
**Solution:** Verify API Gateway is running
```bash
curl http://localhost:3001/api/offline-requests/queue
```

### Issue: Empty Queue
**Solution:** Check filters and database connection
```typescript
// Try without filters
await fetchQueue({ page: 1, pageSize: 50 });
```

### Issue: Pagination Not Working
**Solution:** Check pagination state
```typescript
console.log(pagination); // Should show correct totalPages
```

---

## 📚 Useful Utilities

### Format Currency
```typescript
const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(value);

// Usage
formatCurrency(450.50) // "$450.50"
```

### Format Date
```typescript
const formatDate = (date: string | Date) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(date));

// Usage
formatDate('2024-01-15T10:30:00Z') // "Jan 15, 10:30 AM"
```

### Calculate Price Difference
```typescript
const calculateDifference = (original: number, current: number) => {
  const diff = current - original;
  const percentage = ((diff / original) * 100).toFixed(2);
  return { diff, percentage };
};

// Usage
const { diff, percentage } = calculateDifference(500, 450);
// { diff: -50, percentage: "-10.00" }
```

---

## 🚀 Performance Tips

1. **Pagination:** Always use pagination to avoid loading all requests
2. **Filtering:** Filter on the backend, not frontend
3. **Caching:** The hook caches current page - refresh to update
4. **Lazy Loading:** Load audit logs only when viewing details

---

## 📞 Support Files

- Backend Docs: `docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md`
- API Reference: `GATEWAY_ROUTING_REFERENCE.md`
- Architecture: `ARCHITECTURE_GATEWAY_ROUTING.md`
- Types: `packages/shared-types/types/offline-request.ts`

---

**Last Updated:** 2024
**Maintained By:** Development Team
