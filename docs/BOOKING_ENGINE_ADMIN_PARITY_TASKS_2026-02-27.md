# Booking Engine ↔ B2B Admin Parity Task Plan

Date: 2026-02-27
Owner: Product + B2B Admin + Booking Engine
Status: Draft for execution

## Objective

Ensure all booking engine customer-facing behavior is controlled from B2B Admin as a dynamic system (not code changes/manual deployments).

---

## 1) Current State Audit

## A. Already Available in Booking Engine (Dynamic-Ready)

The booking engine already consumes runtime configuration for key controls:

- Feature flags: `walletEnabled`, `walletTopupEnabled`, `flightBookingEnabled`, `hotelBookingEnabled`, `seatSelectionEnabled`, `ancillariesEnabled`
- Pricing policy: `markupPercent`, `markupFlat`, `commissionPercent`, `commissionFlat`, `commissionChargeableToCustomer`
- Checkout policy: `defaultPaymentMethod`, `allowedPaymentMethods`, `enforceSupplierWallet`
- Branding policy: `appName`, `logoUrl`, `defaultAvatarUrl`, `rtlEnabled`

Source implementation:

- `apps/booking-engine/src/types/runtimeConfig.ts`
- `apps/booking-engine/src/lib/tenantRuntimeConfig.ts`
- `apps/booking-engine/src/App.tsx` + multiple pages via `useTenantRuntime()`

## B. Already Available in B2B Admin (Foundations)

Available modules/routes (UI shell exists):

- Bookings, booking queues, booking details, create booking pages
- Suppliers + supplier gateway/config pages
- Rules page
- Finance + currency + reports pages
- Wallet + virtual cards pages
- Branding page
- Notifications page
- System health/monitoring pages

Key backend-integration clients exist in codebase:

- Rule engine service client
- Notification service client
- Supplier/API gateway services

Source implementation:

- `apps/b2b-admin/src/app/App.tsx`
- `apps/b2b-admin/src/config/routing.tsx`
- `apps/b2b-admin/src/services/rule-engine-client/RuleEngineService.ts`
- `apps/b2b-admin/src/services/notification-client/NotificationService.ts`

## C. Gaps (Why parity is not complete yet)

Several B2B modules still use mock/local state or are not connected to the runtime contract consumed by booking engine:

- Notifications page currently mock data (`mockNotifications`, `mockTemplates`)
- Rules page currently renders mock rules in `RulesManager`
- Some operations modules fallback to mock data (queues/finance/wallet/company flows)
- No dedicated “Booking Engine Runtime Settings” admin module that manages the full runtime contract in one place
- Booking-engine content blocks still hardcoded in pages (help center FAQs/categories/contact, alerts defaults, promotional/home copy sections)

---

## 2) Task Backlog (Available vs New Build)

## Track A — Convert Existing Admin Capabilities to Production-Managed (High Priority)

### A1. Runtime Configuration Management (NEW MODULE, uses existing BE contract)

Priority: P0

Build in B2B Admin:

- New page: `Platform Settings > Booking Engine Runtime`
- CRUD for:
  - Feature flags
  - Pricing policy
  - Checkout policy
  - Branding policy (or link/sync with branding module)
- Save/publish workflow (draft + publish optional)
- Tenant scoping support

API contract target (align with BE):

- `GET /branding/settings` (or move to dedicated `/runtime-settings` and update BE)
- `POST/PATCH /branding/settings`

Acceptance criteria:

- Toggling a feature in admin changes BE route access/visibility after refresh
- Pricing and checkout changes affect booking checkout calculations/flow
- No code deploy required for business rule change

### A2. Rules Module: Replace Mock UI with Real Rule Engine

Priority: P0

Work:

- Replace `RulesManager` mock rules with `RuleEngineService` integration
- Add create/edit/activate/deactivate/priority/reorder flows
- Add rule audit trail display (createdBy/updatedAt/version)

Acceptance criteria:

- Rules list persisted in backend
- Rule changes reflect in runtime pricing behavior (or linked services)

### A3. Notifications Module: Replace Mock NotificationCenter with Service-backed data

Priority: P0

Work:

- Connect notification activity/templates/campaign actions to `NotificationService`
- Persist channels, template variables, scheduling
- Add retry + delivery status views

Acceptance criteria:

- Creating templates/campaigns in admin triggers backend-stored entities
- Booking engine-triggered notifications can be monitored in admin

### A4. Booking Queues/Finance/Wallet/Company pages: Remove mock fallbacks

Priority: P1

Work:

- Identify each page using mock/fallback and connect real APIs
- Add explicit empty/error/loading states
- Keep fallback only in dev mode (if needed)

Acceptance criteria:

- Production mode does not silently use mock data
- All operational pages represent real system state

---

## Track B — Add Missing Dynamic Controls for Booking Engine Content/Behavior

### B1. CMS for Home + Marketing Blocks (Flight/Hotel Home)

Priority: P1

Target hardcoded blocks in BE:

- Hero titles/subtitles
- Promotional cards/copy
- “Benefits” strip content
- Featured article copy/images

Build:

- Admin content schema + editor with preview
- Publish workflow + locale support (phase 2)

Acceptance criteria:

- Marketing copy/assets editable from admin and reflected on BE without deploy

### B2. Help Center Management

Priority: P1

Target hardcoded blocks in BE:

- FAQ list
- Help categories
- Contact channels (phone/email/chat labels)

Build:

- Help center admin module (FAQs/categories/contact settings)
- Ordering, enable/disable, visibility

Acceptance criteria:

- Help center content fully driven by admin data source

### B3. Alerts/Subscriptions Policy Management

Priority: P1

Target hardcoded blocks in BE:

- Default alert subscriptions
- Alert type catalog and channel defaults

Build:

- Admin “Alerts Policy” module: default subscriptions, alert rules, channels

Acceptance criteria:

- New alert type/config can be enabled from admin and appears in BE

### B4. Booking Flow Configurations

Priority: P2

Build:

- Admin controls for search defaults (trip type/cabin/travelers), result sorting defaults, and ancillary presentation behavior
- Per-tenant/per-market overrides

Acceptance criteria:

- Booking flow defaults in BE are data-driven from admin

### B5. Feature Exposure by Role/Segment

Priority: P2

Build:

- Rules for exposing BE features by customer segment/company/channel
- Integrate with existing permissions/rules framework

Acceptance criteria:

- Admin can enable/disable specific BE experiences by segment without code changes

---

## 3) Suggested Delivery Phases

### Phase 1 (2 weeks) — Core Runtime Control

- A1 Runtime Configuration Management
- A2 Rules integration
- A3 Notifications integration

### Phase 2 (2–3 weeks) — Remove Mock Ops Risk

- A4 Remove mock fallbacks from operational modules
- Hardening: error handling, audit logs, permissions

### Phase 3 (3 weeks) — Content Dynamicization

- B1 Home/marketing CMS
- B2 Help Center management
- B3 Alerts policy

### Phase 4 (2 weeks) — Advanced Control

- B4 Booking flow config
- B5 Role/segment exposure

---

## 4) Definition of Done (Program Level)

This initiative is complete when:

1. Booking engine behavior changes (features/pricing/checkout/branding/content) can be done via B2B Admin
2. No critical customer-facing module in admin depends on mock data in production
3. Every runtime setting has auditability (who changed what/when)
4. Tenant-scoped dynamic settings are versioned and safely publishable

---

## 5) Immediate Next Sprint Tasks (Ready to assign)

1. Create `Booking Engine Runtime` admin page and backend endpoints alignment (A1)
2. Replace `RulesManager` mock source with `RuleEngineService` data adapter (A2)
3. Refactor `NotificationCenter` to repository/service-driven implementation (A3)
4. Produce “mock usage inventory” for B2B admin pages and convert top 4 pages in P1 order (A4)
5. Draft content schema for FlightHome/HotelHome/HelpCenter and validate with product (B1/B2)

---

## 6) Execution Status (Updated 2026-02-27)

### Completed in this implementation cycle

- Added `System > Booking Engine Runtime` in b2b-admin and wired runtime save/load via `/branding/settings`.
- Added `System > Content Settings` in b2b-admin and wired runtime content save/load via `/branding/settings`.
- Added global permission governance layer in b2b-admin (route guard, read-only mode, permission manager, sidebar filtering).
- Migrated booking-engine Help Center and Alerts feed/subscriptions from hardcoded content to tenant runtime content.
- Migrated booking-engine Profile option catalogs (country/currency/hotel category/location tags) to tenant runtime content.
- Migrated booking-engine Loyalty coupons/history defaults to tenant runtime content.
- Migrated booking-engine Flight/Hotel loading tips to tenant runtime content.
- Migrated booking-engine Dashboard labels/actions/cards/chart/recent-bookings copy to tenant runtime content.
- Migrated booking-engine Account Settings navigation labels and seeded profile/payment/notification/API-key defaults to tenant runtime content.
- Made Home/Hotel/Flight popular destinations card labels (nameLabel, priceLabel, viewDetailsLabel, featuredLabel) content-configurable via admin Content Settings. All card UI strings now dynamic.
- Made Hotel/Flight search form labels and trip type labels content-configurable via admin Content Settings (`searchFormLabels`, `tripTypeLabels`).

#### Copy-ready content snippet (search/trip labels)

```json
{
  "marketing": {
    "flightHome": {
      "searchFormLabels": { "departure": "Departure", "return": "Return" },
      "tripTypeLabels": {
        "oneWay": "One Way",
        "roundTrip": "Round Trip",
        "multiCity": "Multi City"
      }
    },
    "hotelHome": {
      "searchFormLabels": { "checkIn": "Check-in", "checkOut": "Check-out" },
      "tripTypeLabels": {
        "oneWay": "One Way",
        "roundTrip": "Round Trip",
        "multiCity": "Multi City"
      }
    }
  }
}
```

### Bi-directional Module Mapping Matrix (Admin ↔ Booking Engine)

| B2B Admin Module                  | Booking Engine Module(s)                                                       | Mapping Type                                    | Status    |
| --------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------- | --------- |
| `System > Booking Engine Runtime` | Route features, checkout, pricing, branding                                    | Direct runtime contract (`/branding/settings`)  | ✅ Active |
| `System > Content Settings`       | Help Center, Alerts feed/subs, Profile options, Loyalty defaults, Loading tips | Content contract (`/branding/settings.content`) | ✅ Active |
| `System > Permission Manager`     | Access to admin modules that control booking-engine behavior/content           | Governance/authorization                        | ✅ Active |
| `Rules`                           | Booking pricing behavior and policy application                                | Service-backed rules integration                | ✅ Wired  |
| `Notifications`                   | Alert/notification template and send operations                                | Service-backed notification integration         | ✅ Wired  |
| `Branding`                        | Runtime branding values consumed in booking-engine                             | Runtime contract linkage                        | ✅ Active |

### Booking Engine → Admin Control Coverage

- `flights`, `hotels`, `wallet`, `checkout`, `seat selection`, `ancillaries`: controlled by runtime settings.
- `help center` and `alerts` UX content: controlled by content settings.
- `profile dropdown catalogs` (countries/currencies/categories/location tags): controlled by content settings.
- `loyalty coupons/default history content`: controlled by content settings.
- `search loading tips`: controlled by content settings.
- `dashboard copy/actions/cards/chart/recent bookings labels`: controlled by content settings.
- `account settings tab labels + seeded profile/payment/notification/API-key defaults`: controlled by content settings.
- `home/flight/hotel hero + nav tabs`: controlled by content settings.
- `home package/car tabs + flight/hotel benefits bar`: controlled by content settings.
- `home/flight/hotel section headers + guide labels`: controlled by content settings.
- `hotel/flight search date labels + trip type labels`: controlled by content settings.

### Remaining parity work (non-blocking for runtime/content phase)

- Replace residual user-facing demo/mock datasets that are data-service concerns (including account settings seeded demo data) with production APIs.
- Extend content schema for additional marketing/homepage copy blocks where required by product.
