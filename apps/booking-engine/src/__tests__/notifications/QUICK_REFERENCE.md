# Notifications Test Suite - Quick Reference

## File Map

```
notifications/
├── Notifications.test.tsx               # 16 main page tests
├── NotificationDetailsPopup.test.tsx    # 11 popup tests
├── Toast.test.tsx                       # 7 toast tests
├── notification-types.test.ts           # 16 type validation tests
├── __mocks__/
│   ├── fixtures.ts                      # Mock data + utility functions
│   └── handlers.ts                      # MSW API handlers
└── README.md                            # Full documentation
```

## Quick Test Commands

```bash
# Run all notification tests
npm test -- src/__tests__/notifications

# Run specific test file
npm test -- Notifications.test.tsx

# Watch mode
npm test -- --watch src/__tests__/notifications

# UI dashboard
npm test -- --ui

# Coverage report
npm test -- --coverage
```

## Mock Data Quick Access

```typescript
import {
  MOCK_NOTIFICATION_LIST, // All mock notifications
  MOCK_SSR_NOTIFICATION, // Special service request
  MOCK_CONFIRMATION_NOTIFICATION, // Booking confirmed
  MOCK_REJECTED_AMENDMENT_NOTIFICATION, // Rejected request
  MOCK_SYSTEM_NOTIFICATION, // System message
  createMockNotification, // Factory function
  sortNotificationsByDateNewest, // Sort utilities
  filterNotificationsByType, // Filter utilities
  searchNotifications, // Search utility
  getUnreadNotificationCount, // Count utilities
} from "../__mocks__/fixtures";
```

## Common Test Patterns

### Test Page Component

```typescript
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Notifications from '../../../pages/Notifications';

it('should render notifications', async () => {
  render(
    <BrowserRouter>
      <Notifications />
    </BrowserRouter>
  );

  await waitFor(() => {
    expect(screen.getByRole('heading')).toBeInTheDocument();
  });
});
```

### Test Popup Component

```typescript
import { NotificationDetailsPopup } from '../../../components/NotificationDetailsPopup';
import { MOCK_SSR_NOTIFICATION } from '../__mocks__/fixtures';

it('should display details', () => {
  render(
    <NotificationDetailsPopup
      isOpen={true}
      onClose={vi.fn()}
      notification={MOCK_SSR_NOTIFICATION}
    />
  );

  expect(screen.getByText(MOCK_SSR_NOTIFICATION.title)).toBeInTheDocument();
});
```

### Test with API Mocking

```typescript
import { initializeMSWServer } from "../setup";
import { initializeNotificationsStore } from "../__mocks__/handlers";

beforeEach(() => {
  initializeMSWServer();
  initializeNotificationsStore(MOCK_NOTIFICATION_LIST);
});
```

### Test User Interactions

```typescript
import userEvent from '@testing-library/user-event';

it('should handle click', async () => {
  const user = userEvent.setup();
  render(<MyComponent />);

  const button = screen.getByRole('button');
  await user.click(button);

  expect(screen.getByText('Result')).toBeInTheDocument();
});
```

### Test Async Operations

```typescript
it('should fetch data', async () => {
  render(<Notifications />);

  await waitFor(() => {
    expect(screen.getByText('Loaded')).toBeInTheDocument();
  }, { timeout: 5000 });
});
```

## Notification Types Reference

### Types

```typescript
type NotificationType = "SUCCESS" | "INFO" | "WARNING" | "ERROR";
```

### Statuses

```typescript
type NotificationStatus =
  | "PENDING"
  | "CONFIRMED"
  | "REJECTED"
  | "INFO"
  | "CANCELLED";
```

### Full Structure

```typescript
interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  description: string;
  when: string; // ISO date
  read: boolean;
  status?: NotificationStatus;
  passengerName?: string;
  segment?: string;
  price?: number;
  currency?: string;
  remarks?: string;
}
```

## API Endpoints (Mocked)

| Method | Endpoint                        | Notes                         |
| ------ | ------------------------------- | ----------------------------- |
| GET    | `/api/notifications`            | List with filters, pagination |
| GET    | `/api/notifications/:id`        | Get single                    |
| PATCH  | `/api/notifications/:id/read`   | Mark as read                  |
| PATCH  | `/api/notifications/:id/unread` | Mark as unread                |
| POST   | `/api/notifications/search`     | Full-text search              |
| PATCH  | `/api/notifications/bulk-read`  | Mark multiple read            |
| DELETE | `/api/notifications/:id`        | Delete                        |

## Setup in New Test Files

```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import {
  MOCK_NOTIFICATION_LIST,
  createMockNotification,
  // ... other imports
} from "../__mocks__/fixtures";

import {
  initializeNotificationsStore,
  resetNotificationsStore,
} from "../__mocks__/handlers";

describe("Feature", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    initializeNotificationsStore(MOCK_NOTIFICATION_LIST);
  });

  afterEach(() => {
    resetNotificationsStore();
  });

  it("should test something", async () => {
    // Test code here
  });
});
```

## Utility Snippets

### Create notification with custom data

```typescript
const notification = createMockNotification({
  title: "Custom Title",
  read: true,
  status: "CONFIRMED",
  passengerName: "John Doe",
});
```

### Filter and sort

```typescript
const sorted = sortNotificationsByDateNewest(MOCK_NOTIFICATION_LIST);
const confirmed = filterNotificationsByStatus(sorted, "CONFIRMED");
const unread = getUnreadNotifications(confirmed);
```

### Search

```typescript
const results = searchNotifications(MOCK_NOTIFICATION_LIST, "booking");
results.forEach((notif) => console.log(notif.title));
```

## Troubleshooting Checklist

- [ ] Vitest installed and configured
- [ ] MSW installed and handlers working
- [ ] Test files in correct location
- [ ] Imports use correct relative paths
- [ ] beforeEach/afterEach cleanup in place
- [ ] waitFor used for async operations
- [ ] Mock data initialized before test
- [ ] React Router wrapped for navigation tests
- [ ] User interactions use userEvent (not fireEvent)
- [ ] Console errors checked in test output

## Performance Tips

1. Use `vi.useFakeTimers()` for timer tests
2. Only import needed fixtures, not entire object
3. Reuse test data across related tests
4. Use `beforeEach` for setup, not `beforeAll`
5. Clean up mocks in `afterEach`
6. Keep individual tests focused and fast
7. Use mocking for external APIs

## Common Issues & Solutions

### "Cannot find module"

- Check import paths relative to file location
- Verify **mocks** folder exists
- Check spelling of import names

### "MSW not intercepting"

- Verify handlers exported from handlers.ts
- Ensure initializeMSWServer called in beforeEach
- Check URL in handler matches request

### "act() warning"

- Wrap state updates in act()
- Use waitFor for async updates
- Use userEvent instead of fireEvent for interactions

### Timeout in tests

- Increase timeout in waitFor: `{ timeout: 5000 }`
- Verify mock handlers return data
- Check for unresolved promises

## Adding New Notification Type

1. Update fixture with new mock:

   ```typescript
   export const MOCK_NEW_TYPE: NotificationItem = {
     id: "notif-new",
     type: "SUCCESS",
     // ... other fields
   };
   ```

2. Add to MOCK_NOTIFICATION_LIST

3. Create tests in appropriate test file

4. Update README with new type info

## Code Coverage Goals

- Statements: > 90%
- Branches: > 85%
- Functions: > 90%
- Lines: > 90%

Check with: `npm test -- --coverage`

## Resources

- [Vitest Docs](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [MSW Docs](https://mswjs.io/)
- [Jest DOM Matchers](https://github.com/testing-library/jest-dom)

## Next Steps

1. Run `npm install` to install MSW
2. Run `npm test` to verify tests pass
3. Add new notification features following same patterns
4. Maintain test coverage above 85%
5. Update fixture data as business rules change
