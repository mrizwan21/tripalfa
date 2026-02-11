# Phase 3 Integration Checklist

**Target:** Booking Engine UI Components  
**Estimated Time:** 30-45 minutes  
**Difficulty:** Medium (straightforward integration)

---

## 📋 Pre-Integration Checks

### Phase 2 Completed ✅
- [ ] B2B Admin dashboard implemented and working
- [ ] Backend API endpoints functional
- [ ] API Gateway running on port 3001
- [ ] Booking service running on port 3002
- [ ] Database migrations applied
- [ ] Existing types imported successfully

### Development Environment ✅
- [ ] Node.js and npm installed
- [ ] Booking engine workspace ready
- [ ] React and TypeScript set up
- [ ] Tailwind CSS configured
- [ ] Shadcn/ui components available
- [ ] React Router configured

---

## 🔧 Integration Steps

### Step 1: Verify Files Created (5 min)

**Files to check:**
- [ ] `/apps/booking-engine/src/components/OfflineRequests/RequestChangeModal.tsx` - 380 lines
- [ ] `/apps/booking-engine/src/components/OfflineRequests/RequestApprovalFlow.tsx` - 300 lines
- [ ] `/apps/booking-engine/src/components/OfflineRequests/RequestHistory.tsx` - 290 lines
- [ ] `/apps/booking-engine/src/components/OfflineRequests/RequestStatus.tsx` - 350 lines
- [ ] `/apps/booking-engine/src/components/OfflineRequests/RequestDetailSection.tsx` - 330 lines
- [ ] `/apps/booking-engine/src/components/OfflineRequests/BookingDetailsRequestButton.tsx` - 180 lines
- [ ] `/apps/booking-engine/src/components/OfflineRequests/index.ts` - Barrel export
- [ ] `/apps/booking-engine/src/hooks/useCustomerOfflineRequests.ts` - 180 lines
- [ ] `/apps/booking-engine/src/pages/MyOfflineRequests.tsx` - 420 lines

**Verification:**
```bash
cd /apps/booking-engine

# Check directory structure
find src/components/OfflineRequests -type f -name "*.tsx" | wc -l
# Should output: 7 (6 components + index.ts)

# Check hook exists
ls -la src/hooks/useCustomerOfflineRequests.ts
# Should show file exists

# Check page exists
ls -la src/pages/MyOfflineRequests.tsx
# Should show file exists
```

**Checklist:**
```
Verify each file exists:
- [ ] RequestChangeModal.tsx
- [ ] RequestApprovalFlow.tsx
- [ ] RequestHistory.tsx
- [ ] RequestStatus.tsx
- [ ] RequestDetailSection.tsx
- [ ] BookingDetailsRequestButton.tsx
- [ ] index.ts
- [ ] useCustomerOfflineRequests.ts (hook)
- [ ] MyOfflineRequests.tsx (page)
```

---

### Step 2: TypeScript Compilation (5 min)

**Run TypeScript check:**
```bash
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node

# Full project check
npx tsc -p tsconfig.json --noEmit

# Should output: 0 errors
```

**Common TypeScript errors to fix:**
- [ ] No "Cannot find module" errors
- [ ] No "OfflineChangeRequest" type errors
- [ ] No "React" import errors
- [ ] No missing component imports

**Troubleshooting if errors:**
1. Check all imports are correct
2. Verify shared-types package installed
3. Ensure UI component library available
4. Check index.ts has all exports

**Expected output:**
```
✓ No TypeScript errors found
✓ Ready for runtime testing
```

---

### Step 3: Import Verification (5 min)

**Test imports work in isolation:**

Create test file `/apps/booking-engine/src/__tests__/imports.test.ts`:
```typescript
// Test barrel export
import { 
  RequestChangeModal,
  RequestApprovalFlow,
  RequestHistory,
  RequestStatus,
  RequestDetailSection,
  BookingDetailsRequestButton,
} from '@/components/OfflineRequests';

// Test hook
import { useCustomerOfflineRequests } from '@/hooks/useCustomerOfflineRequests';

// Test types
import { OfflineChangeRequest } from '@tripalfa/shared-types';

export function verifyImports() {
  console.log('✓ All imports successful');
  return true;
}
```

**Run test:**
```bash
cd /apps/booking-engine
npm run dev  # Or check for import errors
```

**Checklist:**
- [ ] Barrel export imports working
- [ ] Individual component imports working
- [ ] Hook imports working
- [ ] Type imports working
- [ ] No import errors in console

---

### Step 4: Add Route Configuration (5 min)

**File to modify:** `/apps/booking-engine/src/App.tsx` (or your routing file)

**Current state:** Probably looks like
```typescript
import { BrowserRouter, Routes, Route } from 'react-router-dom';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/bookings" element={<MyBookings />} />
        {/* Add route below */}
      </Routes>
    </BrowserRouter>
  );
}
```

**Add this route:**
```typescript
import MyOfflineRequests from '@/pages/MyOfflineRequests';

// Add to Routes
<Route 
  path="/my-requests" 
  element={<MyOfflineRequests />}
  requiresAuth={true}
/>

// Or with middleware/guard
{
  requiresAuth: true,
  path: '/my-requests',
  element: <MyOfflineRequests />,
}
```

**Checklist:**
- [ ] Import MyOfflineRequests page
- [ ] Add route with correct path `/my-requests`
- [ ] Apply authentication guard/requiresAuth
- [ ] Route definition follows your routing pattern
- [ ] No TypeScript errors in App.tsx

---

### Step 5: Update Navigation (5 min)

**File to modify:** (e.g., `Navigation.tsx`, `Sidebar.tsx`, or main layout component)

**Find navigation component:**
```bash
find /apps/booking-engine/src -name "*Nav*" -o -name "*Menu*" -o -name "*Layout*"
```

**Add navigation link:**
```typescript
import { useNavigate } from 'react-router-dom';
import { MessageSquare } from 'lucide-react'; // or your icon

export function Navigation() {
  const navigate = useNavigate();

  return (
    <nav>
      {/* Existing nav items */}
      
      {/* Add this link */}
      <div
        onClick={() => navigate('/my-requests')}
        className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100 cursor-pointer"
      >
        <MessageSquare className="w-4 h-4" />
        <span>My Change Requests</span>
      </div>
    </nav>
  );
}
```

**Or as a Link:**
```typescript
import { Link } from 'react-router-dom';

<Link 
  to="/my-requests"
  className="flex items-center gap-2 px-4 py-2 rounded hover:bg-gray-100"
>
  <MessageSquare className="w-4 h-4" />
  <span>My Change Requests</span>
</Link>
```

**Checklist:**
- [ ] Found navigation component
- [ ] Added link to `/my-requests`
- [ ] Link appears in dev server
- [ ] Click navigates to MyOfflineRequests page
- [ ] Navigation styling matches your design

---

### Step 6: Integrate in Booking Details Page (10 min)

**File to modify:** Your booking details page (likely `pages/BookingDetails.tsx`)

**Find the page:**
```bash
find /apps/booking-engine/src -name "*Booking*Details*" -o -name "*Booking*" | grep pages
```

**Current page structure might be:**
```typescript
export function BookingDetailsPage() {
  const { bookingId } = useParams();
  const { booking, isLoading } = useBooking(bookingId);

  return (
    <div className="space-y-6">
      <h1>{booking.route}</h1>
      
      {/* Booking info cards */}
      <BookingInfoCard booking={booking} />
      <PassengerCard passengers={booking.passengers} />
      <PricingCard pricing={booking.pricing} />
      
      {/* Add component here */}
    </div>
  );
}
```

**Add import:**
```typescript
import { BookingDetailsRequestButton } from '@/components/OfflineRequests';
```

**Add component:**
```typescript
export function BookingDetailsPage() {
  const { bookingId } = useParams();
  const { booking, isLoading } = useBooking(bookingId);
  
  // Optionally fetch linked requests - only if you have requests per booking
  const { requests } = useOfflineRequests(bookingId);

  return (
    <div className="space-y-6">
      <h1>{booking.route}</h1>
      
      {/* Existing components */}
      <BookingInfoCard booking={booking} />
      
      {/* Add this */}
      <BookingDetailsRequestButton
        bookingId={bookingId}
        bookingDetails={{
          route: `${booking.origin} → ${booking.destination}`,
          departureDate: booking.departureDate,
          passengers: booking.passengers.length,
          totalPrice: booking.totalPrice,
        }}
        linkedRequests={requests}
        onRequestCreated={() => {
          // Refresh linked requests or refetch booking
          refetchRequests?.();
        }}
      />
    </div>
  );
}
```

**Checklist:**
- [ ] Added import for BookingDetailsRequestButton
- [ ] Found booking details page
- [ ] Added component with correct props
- [ ] Component appears below booking info
- [ ] Styling matches page layout
- [ ] Can click "Submit Change Request" button

---

### Step 7: Test Component Loading (5 min)

**Start dev server:**
```bash
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npm run dev --workspace=@tripalfa/booking-engine
```

**Run in browser:**
```
http://localhost:5173 (or your dev port)
```

**Test checks:**
- [ ] Page loads without errors
- [ ] Navigation link visible
- [ ] Click navigation link navigates to `/my-requests`
- [ ] MyOfflineRequests page loads
- [ ] Search and filter UI appears
- [ ] Table loads (even if empty)
- [ ] "New Request" button visible
- [ ] No console errors

**If errors appear, check:**
1. All dependencies installed: `npm install`
2. API Gateway running: `npm run dev --workspace=@tripalfa/api-gateway`
3. TypeScript errors: `npx tsc -p tsconfig.json --noEmit`
4. Check browser console for errors

---

### Step 8: Test Modal Functionality (5 min)

**On MyOfflineRequests page:**
- [ ] Click "+ New Request" button
- [ ] RequestChangeModal opens
- [ ] Close button works
- [ ] Form fields appear
- [ ] Can type in fields
- [ ] Submit button visible

**From booking details page:**
- [ ] BookingDetailsRequestButton card appears
- [ ] Click "Submit Change Request" button
- [ ] RequestChangeModal opens
- [ ] Booking is pre-selected (if initialBookingId works)
- [ ] Can fill and submit form

---

### Step 9: Test API Connectivity (10 min)

**Test getting requests:**
```javascript
// In browser console
const response = await fetch('http://localhost:3001/api/offline-requests/my-requests', {
  headers: {
    'Authorization': `Bearer YOUR_JWT_TOKEN`,
    'Content-Type': 'application/json',
  }
});
const data = await response.json();
console.log(data);
```

**Expected response:**
```json
{
  "data": [],
  "meta": {
    "total": 0,
    "page": 1,
    "limit": 50
  }
}
```

**Test creating request:**
```javascript
const response = await fetch('http://localhost:3001/api/offline-requests/submit-request', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer YOUR_JWT_TOKEN`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    bookingId: 'BOOKING_123',
    changeType: 'date',
    newDate: '2024-07-15',
    reason: 'Test request',
  })
});
const data = await response.json();
console.log(data);
```

**Checklist:**
- [ ] API Gateway responding on port 3001
- [ ] GET /my-requests returns 200
- [ ] POST /submit-request returns 201
- [ ] No CORS errors
- [ ] No 401/403 errors (auth working)
- [ ] Response format matches expected schema

---

### Step 10: Run Full Verification (5 min)

**TypeScript compilation:**
```bash
cd /Users/mohamedrizwan/Desktop/TripAlfa\ -\ Node
npx tsc -p tsconfig.json --noEmit
```
- [ ] 0 errors

**Component build:**
```bash
npm run build --workspace=@tripalfa/booking-engine
```
- [ ] No build errors
- [ ] All imports resolved

**Linting:**
```bash
npm run lint
```
- [ ] No major linting errors (warnings OK)

**Manual browser testing:**
- [ ] Page loads
- [ ] Navigation works
- [ ] Modals open/close
- [ ] Forms functional
- [ ] No console errors

---

## ✅ Final Verification

### All Systems Go? ✅

**Checklist:**
- [ ] Step 1: All 9 files present and accounted for
- [ ] Step 2: TypeScript compilation 0 errors
- [ ] Step 3: All imports verified
- [ ] Step 4: Route added to router config
- [ ] Step 5: Navigation link added
- [ ] Step 6: IntegrationButton added to booking details
- [ ] Step 7: Dev server running, no errors
- [ ] Step 8: Modals opening/closing correctly
- [ ] Step 9: API connectivity verified
- [ ] Step 10: Full build and lint passing

**Ready for production?**
- [ ] All above checks passed ✅
- [ ] No console errors or warnings
- [ ] API responses match expected format
- [ ] All components rendering correctly
- [ ] Can create request end-to-end
- [ ] Can view requests in list
- [ ] Can open details modal

**If everything checks out:** 🎉 **Phase 3 Integration Complete!**

---

## 🐛 Troubleshooting Guide

### Issue: Import errors for components

```
Error: Cannot find module '@/components/OfflineRequests'
```

**Solutions:**
1. [ ] Run `npm install` in booking-engine workspace
2. [ ] Check index.ts file exists with exports
3. [ ] Verify path alias in tsconfig.json
4. [ ] Restart dev server

---

### Issue: Types not found

```
Error: Cannot find name 'OfflineChangeRequest'
```

**Solutions:**
1. [ ] Check import statement: `import { OfflineChangeRequest } from '@tripalfa/shared-types';`
2. [ ] Verify shared-types package installed
3. [ ] Run `npm run db:generate` to regenerate types
4. [ ] Check @tripalfa/shared-types/types/offline-request.ts exists

---

### Issue: API Gateway not responding

```
Error: fetch failed - Connection refused to 3001
```

**Solutions:**
1. [ ] Start API Gateway: `npm run dev --workspace=@tripalfa/api-gateway`
2. [ ] Check port is actually 3001: `lsof -i :3001`
3. [ ] Verify API Gateway is listening: `curl http://localhost:3001/health`
4. [ ] Check booking-service running on 3002

---

### Issue: Modal won't open

**Solutions:**
1. [ ] Check state management: `const [open, setOpen] = useState(false)`
2. [ ] Verify props: `open={open} onOpenChange={setOpen}`
3. [ ] Check click handler: `onClick={() => setOpen(true)}`
4. [ ] Browser console for React warnings

---

### Issue: Form won't submit

**Solutions:**
1. [ ] Check hook is exported: useCustomerOfflineRequests
2. [ ] Verify API key/JWT token is valid
3. [ ] Check required fields filled
4. [ ] Review browser network tab for API errors
5. [ ] Check API Gateway logs for request details

---

## 📞 Getting Help

**If stuck:**
1. Check `docs/PHASE3_BOOKING_ENGINE_COMPLETE.md` for detailed documentation
2. Review `docs/PHASE3_QUICK_REFERENCE.md` for common patterns
3. Check `docs/B2B_ADMIN_OFFLINE_REQUESTS_PHASE2.md` for similar implementation (B2B Admin)
4. Review `/apps/b2b-admin/src/components/OfflineRequests/` for reference implementation

---

## 🎯 Next Steps After Integration

1. **User Testing:** Have team test the UI
2. **Load Testing:** Test with multiple concurrent requests
3. **Notification Setup:** Prepare Phase 4 (email/SMS notifications)
4. **Documentation:** Update API docs with customer endpoints
5. **Deployment:** Push to staging environment

---

**Integration Started:** [Your date]  
**Integration Completed:** [Completion date]  
**Completed By:** [Your name]

---

**Status:** Ready to proceed to Phase 4 - Notification Integration 🚀
