Notification module (scaffold)

Structure:
- channels/: Email, SMS, Push, InApp channel implementations
- core/: NotificationServiceCore to coordinate channels and persistence
- scheduler/: BullScheduler (BullMQ lazy-load + in-memory fallback)
- templates/: TemplateManager (Handlebars)
- preferences/: UserPreferencesStore
- api/: admin router stub

Notes:
- This is a scaffold inspired by Courier for an internal, modular notification platform.
- Integrate production providers (SES/SendGrid, Twilio, FCM/APNs) and a durable job queue for scheduling.
