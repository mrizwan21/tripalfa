Frontend notification components scaffold

Files:
- `notificationsApi.ts` - lightweight API client used by components
- `AdminNotifications.tsx` - admin view for recent global notifications
- `UserPreferences.tsx` - allows users to set preferred channels
- `InAppBell.tsx` - in-app bell with unread count and recent list

Usage:
- Mount `InAppBell` and `UserPreferences` in the app pages; ensure backend endpoints exist at `/api/...` paths.
