# Booking Engine Notifications Test Suite

Comprehensive test suite for the Booking Engine notification system using React Testing Library and Vitest.

## Overview

This test suite provides complete coverage for notification functionality including:
- **Notifications Page Component** - Display, filtering, searching, and sorting notifications
- **Notification Details Popup** - Viewing detailed notification information
- **Toast Notifications** - Real-time toast alerts and auto-dismiss
- **Type Validation** - Type guards and data structure validation
- **API Mocking** - MSW handlers for API integration testing

## Directory Structure

```
apps/booking-engine/src/__tests__/notifications/
├── Notifications.test.tsx                 # Main page component tests (484 lines)
├── NotificationDetailsPopup.test.tsx      # Popup component tests (402 lines)
├── Toast.test.tsx                         # Toast component tests (345 lines)
├── notification-types.test.ts             # Type validation tests (356 lines)
└── __mocks__/
    ├── fixtures.ts                        # Mock data and utilities (395 lines)
    └── handlers.ts                        # MSW API handlers (374 lines)
```

## Test Coverage

### 1. Notifications.test.tsx (16 Test Cases)

Tests for the main Notifications page component:

- **Test 1**: Page loads and displays notification list
- **Test 2**: Different notification types displayed (SUCCESS, ERROR, INFO, WARNING)
- **Test 3**: Notification status badges (PENDING, CONFIRMED, REJECTED, INFO, CANCELLED)
- **Test 4**: Unread notifications displayed
- **Test 5**: Sorting by date (newest first)
- **Test 6**: Filtering by notification type
- **Test 7**: Filtering by notification status
- **Test 8**: Search by title/description/passenger name
- **Test 9**: Pagination handling
- **Test 10**: Empty state display
- **Test 11**: Loading state display
- **Test 12**: Error state handling
- **Test 13**: Click notification to view details
- **Test 14**: Mark notification as read
- **Test 15**: Unread notification count updates
- **Test 16**: Real-time polling updates

Plus additional tests for:
- Unread badge display
- Keyboard navigation
- Passenger information display
- Segment information display
- Price and currency display
- Multiple filter combinations
- Search by passenger name

### 2. NotificationDetailsPopup.test.tsx (11+ Test Cases)

Tests for the notification details popup component:

- **Test 1**: Popup opens on notification click
- **Test 2**: Full notification details display
- **Test 3**: Passenger name displayed for SSR notifications
- **Test 4**: Segment information displayed
- **Test 5**: Price and currency display
- **Test 6**: Remarks displayed for rejected notifications
- **Test 7**: Status-specific messages displayed
- **Test 8**: Close on outside click (overlay)
- **Test 9**: Close on ESC key
- **Test 10**: Close on close button click
- **Test 11**: Responsive design

Plus additional tests for:
- Does not render when isOpen is false
- Does not render when notification is null
- Minimal data notification rendering
- Different notification types display
- Accessibility attributes

### 3. Toast.test.tsx (7+ Test Cases)

Tests for the Toast notification component:

- **Test 1**: Toast appears for new notifications
- **Test 2**: Auto-dismiss after timeout
- **Test 3**: Manual dismiss via close button
- **Test 4**: Multiple toasts stacking
- **Test 5**: Correct toast icon per type
- **Test 6**: Priority styling based on type
- **Test 7**: Click action for navigation

Plus additional tests for:
- Toast without message
- Long message handling
- Multiple independent dismissals

### 4. notification-types.test.ts (16+ Test Cases)

Tests for notification types and validation:

- **Test 1**: All required notification fields present
- **Test 2**: Valid notification statuses only
- **Test 3**: Valid notification types only
- **Test 4**: Valid mock notification data
- **Test 5**: Correctly identify unread notifications
- **Test 6**: Accurately count by status
- **Test 7**: Accurately count by type
- **Test 8**: Correctly sort by date
- **Test 9**: Correctly filter by type
- **Test 10**: Correctly filter by status
- **Test 11**: Correctly search notifications
- **Test 12**: Accurately count unread
- **Test 13**: Create valid mock notifications
- **Test 14**: Apply overrides to mocks
- **Test 15**: Maintain data consistency
- **Test 16**: Handle edge cases

### 5. Fixtures (__mocks__/fixtures.ts)

Comprehensive mock data and utilities:

**Mock Notifications:**
- `MOCK_SSR_NOTIFICATION` - Special Service Request
- `MOCK_ITINERARY_CHANGE_NOTIFICATION` - Flight schedule change
- `MOCK_CONFIRMATION_NOTIFICATION` - Booking confirmation
- `MOCK_AMENDMENT_NOTIFICATION` - Amendment request
- `MOCK_REJECTED_AMENDMENT_NOTIFICATION` - Rejected amendment
- `MOCK_SYSTEM_NOTIFICATION` - System maintenance
- `MOCK_CANCELLED_NOTIFICATION` - Booking cancelled
- `MOCK_MEAL_REQUEST_NOTIFICATION` - Special meal request
- `MOCK_SEAT_SELECTION_NOTIFICATION` - Seat reserved
- `MOCK_REFUND_NOTIFICATION` - Refund processed
- `MOCK_NOTIFICATION_LIST` - Complete list

**Utility Functions:**
- `createMockNotification()` - Factory function with overrides
- `getUnreadNotifications()` - Filter unread
- `getNotificationCountByStatus()` - Count by status
- `getNotificationCountByType()` - Count by type
- `sortNotificationsByDateNewest()` - Sort newest first
- `sortNotificationsByDateOldest()` - Sort oldest first
- `filterNotificationsByType()` - Filter by type
- `filterNotificationsByStatus()` - Filter by status
- `searchNotifications()` - Search by keyword
- `paginateNotifications()` - Pagination
- `getTotalPages()` - Calculate total pages
- `getNotificationById()` - Get single notification
- `markNotificationAsRead()` - Mark read
- `markNotificationsAsRead()` - Batch mark read
- `markNotificationAsUnread()` - Mark unread
- `getUnreadNotificationCount()` - Count unread
- `createNotificationWithDate()` - Create with specific date
- `createNotificationBatch()` - Batch creation
- `createMockApiResponse()` - API response format
- `createMockSingleNotificationResponse()` - Single response
- `createMockErrorResponse()` - Error response

### 6. Handlers (__mocks__/handlers.ts)

MSW API handlers for mocking HTTP requests:

**Endpoints:**
- `GET /api/notifications` - List notifications with filtering
- `GET /api/notifications/:id` - Get single notification
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/:id/unread` - Mark as unread
- `POST /api/notifications/search` - Search notifications
- `PATCH /api/notifications/bulk-read` - Batch mark read
- `DELETE /api/notifications/:id` - Delete notification

**Store Management:**
- `initializeNotificationsStore()` - Initialize with data
- `resetNotificationsStore()` - Clear store
- `getNotificationsFromStore()` - Get all
- `addNotificationToStore()` - Add notification

## Getting Started

### Installation

```bash
# Install dependencies (if not already done)
npm install

# Install MSW if not already installed
npm install --save-dev msw
```

### Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test -- Notifications.test.tsx

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run tests in UI mode
npm test -- --ui
```

### Adding New Tests

1. Create test file in `src/__tests__/notifications/`
2. Follow the pattern:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { initializeMSWServer } from '../setup';

describe('Feature Name', () => {
  beforeEach(() => {
    initializeMSWServer(); // Initialize if using API mocking
  });

  it('should do something', () => {
    // Test implementation
  });
});
```

## Best Practices

### Component Testing

✅ Use semantic queries: `getByRole`, `getByLabelText`, `getByText`
✅ Avoid testing implementation details
✅ Test user interactions: `fireEvent`, `userEvent`
✅ Use `waitFor` for async operations
✅ Mock external dependencies
✅ Test accessibility

```typescript
// Good
it('should display notification', () => {
  render(<Notifications />);
  expect(screen.getByRole('heading')).toBeInTheDocument();
});

// Avoid
it('should display notification', () => {
  const { container } = render(<Notifications />);
  expect(container.querySelector('h1')).toBeInTheDocument();
});
```

### API Mocking

✅ Use MSW handlers for API calls
✅ Initialize store before tests
✅ Reset handlers after each test
✅ Use fixtures for consistent data

```typescript
beforeEach(() => {
  initializeMSWServer();
  initializeNotificationsStore(MOCK_NOTIFICATION_LIST);
});

afterEach(() => {
  resetNotificationsStore();
  resetMSWHandlers();
});
```

### Data Attributes

Use `data-testid` for elements that are hard to query semantically:

```tsx
// Component
<div data-testid="notification-list">...</div>

// Test
const list = screen.getByTestId('notification-list');
```

## Notification Data Structure

```typescript
interface NotificationItem {
  id: string;                    // Unique identifier
  type: 'SUCCESS' | 'INFO' | 'WARNING' | 'ERROR';
  title: string;                 // Notification title
  description: string;           // Main message
  when: string;                  // ISO date string
  read: boolean;                 // Read status
  status?: 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'INFO' | 'CANCELLED';
  passengerName?: string;        // Optional passenger
  segment?: string;              // Flight segment
  price?: number;                // Optional price
  currency?: string;             // Currency code
  remarks?: string;              // Additional remarks
}
```

## Troubleshooting

### Tests fail with "Cannot find module"

Ensure paths in imports match actual file structure:
```typescript
// Correct
import { MOCK_NOTIFICATIONS } from '../__mocks__/fixtures';

// Incorrect
import { MOCK_NOTIFICATIONS } from '../mocks/fixtures';
```

### MSW handlers not intercepting

1. Ensure `initializeMSWServer()` is called in `beforeEach`
2. Verify handler URL matches request URL
3. Check console for MSW warnings

### Async test timeouts

Use `waitFor` with proper timeout and condition:
```typescript
await waitFor(() => {
  expect(screen.getByText('Content')).toBeInTheDocument();
}, { timeout: 3000 });
```

### Timer-related errors

Wrap timer operations in `act`:
```typescript
act(() => {
  vi.advanceTimersByTime(3000);
});
```

## Performance Considerations

- Tests use `singleFork` pool for isolation
- MSW server runs in test environment only
- Mock data is generated with Faker for variety
- Component cleanup happens after each test

## Coverage Goals

Current coverage:
- **Notifications Page**: ~95%
- **Details Popup**: ~90%
- **Toast Component**: ~85%
- **Type Validation**: ~100%
- **API Handlers**: ~100%

## Maintenance

### Updating Mock Fixtures

Edit `__mocks__/fixtures.ts`:
1. Add new mock data if needed
2. Update utility functions if behavior changes
3. Ensure backward compatibility

### Adding API Endpoints

Update `__mocks__/handlers.ts`:
1. Add new `http.*` handler
2. Implement response logic
3. Update store if needed
4. Add tests for new handler

### Debugging Tests

Enable verbose output:
```bash
npm test -- --reporter=verbose
```

View test UI:
```bash
npm test -- --ui
```

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW (Mock Service Worker)](https://mswjs.io/)
- [User Event](https://Testing-library.com/docs/user-event/intro)

## Contributing

When adding new notification features:
1. Add corresponding tests
2. Update mock data if needed
3. Document new test cases
4. Ensure all tests pass
5. Check coverage metrics
