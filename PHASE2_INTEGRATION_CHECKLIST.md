# Phase 2 Integration Checklist

## Pre-Integration Verification

- [ ] TypeScript compilation passes: `npx tsc -p tsconfig.json --noEmit`
- [ ] All files created in correct locations
- [ ] Dev server running: `npm run dev`
- [ ] API Gateway running on port 3001
- [ ] Booking Service running on port 3002
- [ ] Database connection verified

---

## Step 1: Verify Files Are In Place

```bash
# Check hook exists
ls -la apps/b2b-admin/src/hooks/useOfflineRequests.ts

# Check components exist
ls -la apps/b2b-admin/src/components/OfflineRequests/

# Check page exists
ls -la apps/b2b-admin/src/pages/OfflineRequestsManagement.tsx
```

Expected files:
- [x] useOfflineRequests.ts (260 lines)
- [x] RequestQueueTable.tsx (200 lines)
- [x] PricingSubmissionForm.tsx (280 lines)
- [x] RequestDetailModal.tsx (300 lines)
- [x] index.ts (3 lines)
- [x] OfflineRequestsManagement.tsx (350 lines)

---

## Step 2: Add Route to Application

In your main routing configuration file (e.g., `App.tsx` or `src/router.tsx`):

```typescript
import { OfflineRequestsPage } from '@/pages/OfflineRequestsManagement';

// Add to your routes array:
{
  path: '/admin/offline-requests',
  element: <OfflineRequestsPage />,
  // Optional: Add permission guard
  // errorElement: <PermissionGuard requiredPermission="manage_offline_requests" />
}
```

**Verify:**
- [ ] Route added to routing configuration
- [ ] Component imported correctly
- [ ] No TypeScript errors after adding route

---

## Step 3: Add Navigation Menu Item

In your B2B Admin sidebar/navigation component:

```typescript
import { ListTodo } from 'lucide-react';

// Add to navigation items array:
{
  title: 'Offline Requests',
  icon: ListTodo,
  href: '/admin/offline-requests',
  description: 'Manage customer change requests',
  // Optional permission:
  // requiredPermission: 'manage_offline_requests'
}
```

**Verify:**
- [ ] Navigation item appears in sidebar
- [ ] Clicking navigates to `/admin/offline-requests`
- [ ] Page loads without errors

---

## Step 4: Configure Environment Variables

Update your `.env` file in the b2b-admin app:

```env
# Add or verify these settings:
VITE_USE_API_GATEWAY=true
VITE_API_GATEWAY_URL=http://localhost:3001
VITE_API_BASE_URL=/api/offline-requests

# Authentication
VITE_AUTH_TOKEN_KEY=auth_token
```

**Verify:**
- [ ] `.env` file exists in app root
- [ ] All variables set correctly
- [ ] Environment variables passed to build

---

## Step 5: Verify API Gateway Configuration

Check that your API Gateway is properly configured:

```bash
# Test API Gateway connectivity
curl -X GET http://localhost:3001/api/offline-requests/queue \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Expected response:
# {
#   "data": [...],
#   "pagination": {...},
#   "meta": {...}
# }
```

**Verify:**
- [ ] API Gateway responds to requests
- [ ] Authentication token is valid
- [ ] Response format matches expected structure

---

## Step 6: Add Permission Configuration (if using permissions)

If your app uses permission-based access control:

```typescript
// In your permissions configuration file:
export const OFFLINE_REQUEST_PERMISSIONS = {
  VIEW: 'manage_offline_requests:view',
  SUBMIT_PRICING: 'manage_offline_requests:submit_pricing',
  ADD_NOTES: 'manage_offline_requests:add_notes',
  CANCEL: 'manage_offline_requests:cancel',
};

// Wrap the page with permission guard:
<PermissionGuard requiredPermission={OFFLINE_REQUEST_PERMISSIONS.VIEW}>
  <OfflineRequestsPage />
</PermissionGuard>
```

**Verify:**
- [ ] Permission configuration matches your system
- [ ] Guard prevents unauthorized access
- [ ] Users with correct permission can access

---

## Step 7: Test Core Functionality

### Test Queue Display
- [ ] Navigate to `/admin/offline-requests`
- [ ] Page loads without errors
- [ ] Queue displays if requests exist
- [ ] Status badges show with correct colors
- [ ] Priority indicators display correctly

### Test Filtering
- [ ] Status filter works
- [ ] Priority filter works
- [ ] Combined filters work
- [ ] Results update when filters applied

### Test Pagination
- [ ] Pagination controls appear
- [ ] Next/Previous buttons work
- [ ] Page counter updates
- [ ] Correct requests shown per page

### Test Request Detail
- [ ] Click "View" on a request
- [ ] Detail modal opens
- [ ] All tabs load correctly
- [ ] Close button works

### Test Pricing Submission
- [ ] Click "Submit Pricing" on a request
- [ ] Form modal opens
- [ ] Original prices display
- [ ] Enter new prices
- [ ] Price difference calculates correctly
- [ ] Submit button works

---

## Step 8: Verify No Console Errors

Open browser DevTools (F12) and check:

```javascript
// Should see no errors related to:
// - Component imports
// - Hook usage
// - API calls
// - Type errors

// Expected console output:
// "Queue loaded successfully"
// "Request added: [count]"
```

**Verify:**
- [ ] No red errors in console
- [ ] No TypeScript warnings
- [ ] Network tab shows successful API calls
- [ ] Authentication headers present in requests

---

## Step 9: Test API Integration

```javascript
// In browser console, test the API client:
const token = localStorage.getItem('auth_token');
console.log('Auth Token:', token ? 'Present' : 'Missing');

// If Axios is available:
axios.get('http://localhost:3001/api/offline-requests/queue', {
  headers: { Authorization: `Bearer ${token}` }
}).then(res => console.log('API Works:', res.data));
```

**Verify:**
- [ ] Auth token exists in localStorage
- [ ] API endpoint is reachable
- [ ] Response contains expected data structure

---

## Step 10: Performance Check

- [ ] Page loads in < 3 seconds
- [ ] Queue table renders smoothly
- [ ] Pagination works smoothly
- [ ] Modals open/close without lag
- [ ] No memory leaks in DevTools

**Verify:**
- [ ] Performance timeline looks healthy
- [ ] No 404 errors in network tab
- [ ] API responses are reasonable size

---

## Step 11: Cross-Browser Testing

Test in multiple browsers:

- [ ] Chrome/Edge (Latest)
- [ ] Firefox (Latest)
- [ ] Safari (if on Mac)
- [ ] Mobile Safari (if on iPad/iPhone)

**Verify:**
- [ ] Layout responsive
- [ ] All interactions work
- [ ] No visual issues

---

## Step 12: Security Verification

- [ ] Auth token not visible in console logs
- [ ] Sensitive data not exposed in modals
- [ ] CORS headers configured correctly
- [ ] API validates all inputs

**Verify:**
- [ ] No sensitive data leaked
- [ ] Permission guards working
- [ ] Only authenticated users can access

---

## Rollback Plan (If Issues Occur)

If you need to rollback:

```bash
# Remove added route from routing config
# Remove navigation menu item  
# Remove components and hook files:
rm -rf apps/b2b-admin/src/components/OfflineRequests/
rm apps/b2b-admin/src/hooks/useOfflineRequests.ts
rm apps/b2b-admin/src/pages/OfflineRequestsManagement.tsx

# Restart dev server:
npm run dev
```

**After Rollback:**
- [ ] Verify app starts without errors
- [ ] Verify other features still work
- [ ] Check no broken imports

---

## Production Deployment Checklist

Before deploying to production:

- [ ] Run full test suite: `npm run test`
- [ ] Build succeeds: `npm run build`
- [ ] No TypeScript errors: `npx tsc --noEmit`
- [ ] Environment variables configured
- [ ] API Gateway URLs point to production
- [ ] Database connection verified
- [ ] Monitoring/alerting configured
- [ ] Rollback procedure tested
- [ ] Backup taken before deployment

---

## Common Issues & Quick Fixes

| Issue | Solution | Status |
|-------|----------|--------|
| Page shows "No offline requests" | Verify database has data, check filters | [Fix](#solution-1) |
| API Gateway 404 | Ensure gateway running on 3001, check URL | [Fix](#solution-2) |
| Authentication error | Verify JWT token in localStorage | [Fix](#solution-3) |
| Styling issues | Check Tailwind CSS is loaded | [Fix](#solution-4) |
| TypeScript errors | Run `npm install` to update types | [Fix](#solution-5) |

### Solution 1: No Requests Display
```bash
# Check if booking-service has data
curl http://localhost:3002/api/offline-requests

# If no data, create test request first
```

### Solution 2: API Gateway 404
```bash
# Verify gateway is running
curl http://localhost:3001/health

# Check route exists
curl http://localhost:3001/api/offline-requests/queue
```

### Solution 3: Authentication Error
```javascript
// In browser console:
localStorage.getItem('auth_token')
// Should return a JWT token, not null

// If missing, login first:
// Navigate to login page and complete authentication
```

### Solution 4: Styling Issues
```bash
# Rebuild Tailwind CSS
npm run build:css

# Or restart dev server
npm run dev
```

### Solution 5: TypeScript Errors
```bash
# Update all dependencies
npm install

# Regenerate types
npm run build

# Check for type conflicts
npx tsc --noEmit
```

---

## Support Resources

| Resource | Location | Purpose |
|----------|----------|---------|
| API Documentation | `docs/OFFLINE_REQUEST_GATEWAY_INTEGRATION.md` | API reference |
| Quick Reference | `B2B_ADMIN_QUICK_REFERENCE.md` | Developer guide |
| Implementation Guide | `docs/B2B_ADMIN_OFFLINE_REQUESTS_PHASE2.md` | Integration details |
| Type Definitions | `packages/shared-types/types/offline-request.ts` | TypeScript types |
| Backend Setup | `NEON_SETUP_GUIDE.md` | Database setup |

---

## Sign-Off

- [ ] All integration steps completed
- [ ] Testing passed
- [ ] No errors in console
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Ready for deployment

**Integrated By:** ________________
**Date:** ________________
**Status:** ✅ Ready for Production

---

## Post-Integration Tasks

After successful integration:

1. **Notify stakeholders**
   - Update team on feature availability
   - Share quick reference guide
   - Provide access to new page

2. **Monitor usage**
   - Watch API endpoints for errors
   - Monitor performance metrics
   - Collect user feedback

3. **Plan Phase 3**
   - Schedule booking engine implementation
   - Prepare customer-facing components
   - Allocate resources for next phase

---

*Last Updated: 2024*
*Status: Ready for Integration*
