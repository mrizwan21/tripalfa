# Offline Request Management System - Quick Integration Guide

## 🚀 Quick Start (5 minutes)

### Step 1: Import Components
```typescript
// In your booking details page
import {
  OfflineRequestForm,
  RequestStatusTracker,
  PricingApprovalView,
  OfflineRequestPayment,
} from '@/components/OfflineRequests';
```

### Step 2: Add Button to Booking
```tsx
<button
  onClick={() => setShowOfflineRequest(true)}
  className="btn btn-primary"
>
  Request Change
</button>

{showOfflineRequest && (
  <OfflineRequestForm
    bookingId={booking.id}
    bookingRef={booking.reference}
    bookingType="flight" // or "hotel"
    originalDetails={booking.details}
    onSuccess={(request) => {
      navigate(`/offline-requests/${request.id}`);
    }}
  />
)}
```

### Step 3: Display Status Page
```tsx
// In offline-requests/:id page
export function RequestStatusPage({ id }: { id: string }) {
  const [request, setRequest] = useState<OfflineChangeRequest | null>(null);

  return (
    <RequestStatusTracker
      requestId={id}
      autoRefresh={true}
      onStatusChange={(status) => {
        if (status === 'pending_customer_approval') {
          // Show pricing approval view
        }
      }}
    />
  );
}
```

---

## 📦 Component Props Reference

### OfflineRequestForm
```typescript
interface Props {
  bookingId: string;              // Required
  bookingRef: string;             // Required
  bookingType: 'flight' | 'hotel'; // Required
  originalDetails: any;           // Required - booking details object
  onSuccess?: (request) => void;  // Optional - called after submission
  onCancel?: () => void;          // Optional - called on cancel
}
```

### RequestStatusTracker
```typescript
interface Props {
  requestId: string;              // Required
  requestRef?: string;            // Optional - for display
  onStatusChange?: (status) => void; // Optional - status change callback
  autoRefresh?: boolean;          // Optional (default: true)
  refreshInterval?: number;       // Optional (default: 30000ms)
}
```

### PricingApprovalView
```typescript
interface Props {
  request: OfflineChangeRequest;  // Required
  onApproved?: () => void;        // Optional - when customer approves
  onRejected?: () => void;        // Optional - when customer rejects
  onPaymentRequired?: () => void; // Optional - when ready for payment
}
```

### OfflineRequestPayment
```typescript
interface Props {
  request: OfflineChangeRequest;  // Required
  amount: number;                 // Required - amount to pay
  currency?: string;              // Optional (default: 'USD')
  onSuccess?: (txnId) => void;   // Optional - called after payment
  onError?: (error) => void;     // Optional - error handler
}
```

---

## 🔌 API Usage

### Create Request
```typescript
import offlineRequestApi from '@/api/offlineRequestApi';

const request = await offlineRequestApi.createRequest({
  bookingId: 'book-123',
  bookingRef: 'TRP-2024-001234',
  requestType: 'schedule_change',
  requestedChanges: {
    newItinerary: { /* new flight/hotel */ },
    changeReason: 'Schedule conflict',
  },
});
```

### Track Status
```typescript
// Single fetch
const request = await offlineRequestApi.getRequest(requestId);

// Or with React Query for auto-polling
const { data: request } = useQuery({
  queryKey: ['offline-request', requestId],
  queryFn: () => offlineRequestApi.getRequest(requestId),
  refetchInterval: 30000, // Poll every 30 seconds
});
```

### Approve Pricing
```typescript
const approvedRequest = await offlineRequestApi.approveRequest(requestId);

// Customer is now ready to pay
```

### Process Payment
```typescript
const result = await offlineRequestApi.recordPayment(requestId, {
  paymentMethod: 'credit_card',
  amount: 185.00,
  currency: 'USD',
});

console.log('Transaction ID:', result.payment?.transactionRef);
```

---

## 🎨 UI Integration Examples

### Full Journey Component
```tsx
import { useState } from 'react';
import {
  OfflineRequestForm,
  RequestStatusTracker,
  PricingApprovalView,
  OfflineRequestPayment,
} from '@/components/OfflineRequests';
import { useQuery } from '@tanstack/react-query';
import offlineRequestApi from '@/api/offlineRequestApi';

type Step = 'form' | 'status' | 'pricing' | 'payment' | 'success';

export function OfflineRequestJourney() {
  const [step, setStep] = useState<Step>('form');
  const [requestId, setRequestId] = useState<string>('');

  const { data: request } = useQuery({
    queryKey: ['offline-request', requestId],
    queryFn: () => offlineRequestApi.getRequest(requestId),
    enabled: !!requestId,
    refetchInterval: 30000,
  });

  if (step === 'form') {
    return (
      <OfflineRequestForm
        bookingId="book-123"
        bookingRef="TRP-2024-001234"
        bookingType="flight"
        originalDetails={booking}
        onSuccess={(newRequest) => {
          setRequestId(newRequest.id);
          setStep('status');
        }}
      />
    );
  }

  if (step === 'status' && request) {
    return (
      <>
        <RequestStatusTracker
          requestId={request.id}
          onStatusChange={(status) => {
            if (status === 'pending_customer_approval') {
              setStep('pricing');
            }
          }}
        />
        <button onClick={() => setStep('status')}>Refresh</button>
      </>
    );
  }

  if (step === 'pricing' && request) {
    return (
      <PricingApprovalView
        request={request}
        onApproved={() => setStep('payment')}
        onRejected={() => setStep('status')}
      />
    );
  }

  if (step === 'payment' && request) {
    return (
      <OfflineRequestPayment
        request={request}
        amount={request.priceDifference?.totalDiff || 0}
        onSuccess={() => setStep('success')}
      />
    );
  }

  return (
    <div className="success-message">
      <h2>Request Completed!</h2>
      <p>Your new e-ticket will be sent to your email shortly.</p>
      <button onClick={() => window.location.href = '/'}>
        Back to Home
      </button>
    </div>
  );
}
```

### Minimal Status Display
```tsx
import { RequestStatusTracker } from '@/components/OfflineRequests';

export function BookingDetailsPage({ bookingId }: Props) {
  const requestId = getOfflineRequestId(bookingId);

  if (!requestId) {
    return <button>Request Change</button>;
  }

  return (
    <RequestStatusTracker
      requestId={requestId}
      compact={true}
    />
  );
}
```

---

## 🔐 Authentication

The API clients automatically handle authentication:

```typescript
// Token is read from localStorage
const token = localStorage.getItem('authToken');

// And automatically added to all requests
// Authorization: Bearer {token}
```

To set the token after login:
```typescript
localStorage.setItem('authToken', response.token);
```

---

## ⚠️ Error Handling

All components include built-in error handling:

```tsx
// Errors are displayed to users automatically
// But you can also handle them programmatically

<OfflineRequestForm
  {...props}
  onSuccess={(request) => {
    console.log('Success:', request);
  }}
/>

// Errors are caught and displayed in the component
```

For API errors:
```typescript
try {
  const request = await offlineRequestApi.createRequest(payload);
} catch (error) {
  console.error('Failed to create request:', error.message);
  // Show error to user
}
```

---

## 🔄 Real-time Updates

### Auto-refreshing (Default)
```tsx
<RequestStatusTracker
  requestId={id}
  autoRefresh={true}          // Enable auto-refresh
  refreshInterval={30000}     // Every 30 seconds
  onStatusChange={(status) => {
    console.log('Status updated to:', status);
  }}
/>
```

### Manual Polling
```tsx
const { refetch, isRefetching } = useQuery({
  queryKey: ['offline-request', id],
  queryFn: () => offlineRequestApi.getRequest(id),
  refetchInterval: false, // Disable auto-refresh
});

// Manually refetch
<button onClick={() => refetch()}>
  {isRefetching ? 'Refreshing...' : 'Refresh Status'}
</button>
```

---

## 📊 Data Structure

### OfflineChangeRequest
```typescript
{
  id: string;
  requestRef: string;              // e.g., "OCR-2024-001234"
  bookingId: string;
  bookingRef: string;
  requestType: string;
  status: string;                  // pending_staff, pricing_submitted, etc.
  priority: string;                // low, medium, high, critical
  originalDetails: any;            // Original booking details
  requestedChanges: any;           // New itinerary + reason
  staffPricing?: {
    newBaseFare: number;
    newTaxes: number;
    newMarkup: number;
    newTotalPrice: number;
    currency: string;
  };
  priceDifference?: {
    totalDiff: number;
  };
  customerApproval?: {
    approved: boolean;
  };
  payment?: {
    paymentId: string;
    amount: number;
    transactionRef: string;
  };
  timeline: {
    requestedAt: string;           // ISO datetime
    staffPricedAt?: string;
    customerApprovedAt?: string;
    paymentCompletedAt?: string;
  };
}
```

---

## 🧪 Testing

### Unit Tests
```typescript
import { render, screen } from '@testing-library/react';
import { OfflineRequestForm } from '@/components/OfflineRequests';

test('renders request form', () => {
  render(
    <OfflineRequestForm
      bookingId="book-123"
      bookingRef="TRP-2024-001234"
      bookingType="flight"
      originalDetails={{}}
    />
  );
  expect(screen.getByText(/Request Flight Change/i)).toBeInTheDocument();
});
```

### Integration Tests
```typescript
test('complete request flow', async () => {
  // 1. Submit request
  // 2. Wait for status update
  // 3. Approve pricing
  // 4. Process payment
  // 5. Verify success
});
```

---

## 🚨 Common Issues & Solutions

### Issue: Token Not Sent
**Solution:** Ensure token is stored in `localStorage` with key `authToken`
```typescript
localStorage.setItem('authToken', 'your-token');
```

### Issue: CORS Errors
**Solution:** Check API gateway CORS configuration
```typescript
// In api-gateway config
cors: {
  origin: process.env.FRONTEND_URL,
  credentials: true,
}
```

### Issue: Components Not Found
**Solution:** Verify component export in index.ts
```typescript
// apps/booking-engine/src/components/OfflineRequests/index.ts
export { OfflineRequestForm } from './OfflineRequestForm';
export { RequestStatusTracker } from './RequestStatusTracker';
// etc.
```

### Issue: API Timeout
**Solution:** Increase timeout in axios config
```typescript
this.api = axios.create({
  timeout: 30000, // 30 seconds
  // ...
});
```

---

## 📱 Mobile Responsiveness

All components are fully responsive. For mobile optimization:

```tsx
// Use responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
  {/* Components */}
</div>

// Stack buttons vertically on mobile
<div className="flex flex-col gap-3 md:flex-row">
  {/* Buttons */}
</div>
```

---

## 🎯 Next Steps

1. **Install & Setup**
   ```bash
   npm install
   npm run build
   npm run dev
   ```

2. **Add to Your Page**
   - Import components
   - Add to your JSX
   - Pass required props

3. **Test**
   - Create a test request
   - Track status updates
   - Process a test payment

4. **Deploy**
   - Run linting checks
   - Build for production
   - Deploy to staging first

---

## 📞 Support

For integration help:
- Check `OFFLINE_REQUEST_CUSTOMER_EXPERIENCE_API.md` for API details
- Review examples in this document
- Check component source code for inline documentation
- See `OFFLINE_REQUEST_CUSTOMER_EXPERIENCE_IMPLEMENTATION_COMPLETE.md` for full details

---

**Happy integrating! 🎉**
