# Optics Migration Tracker

**Created:** 2026-04-01
**Phase:** Phase 2 — Core Component Alignment (Adapters Active)
**Branch:** `migration/optics`

## Summary

| Metric                          | Value |
| ------------------------------- | ----- |
| Total import lines              | 369   |
| Unique files affected           | 92    |
| Unique component modules        | 21    |
| b2b-admin files                 | 91    |
| booking-engine files            | 1     |
| Components migrated (adapter)   | 10    |
| Components pending (Radix kept) | 7     |
| Components deferred (no equiv)  | 4     |
| Components N/A                  | 1     |

## Component Import Count (by module)

| Component     | Import Count | Optics Equivalent                    | Priority       | Status                              |
| ------------- | ------------ | ------------------------------------ | -------------- | ----------------------------------- |
| button        | 77           | `optics/components/button`           | P1             | ✅ Adapter Active                   |
| card          | 54           | `optics/components/card`             | P2             | ✅ Adapter Active                   |
| badge         | 51           | `optics/components/badge`            | P4             | ✅ Adapter Active                   |
| input         | 43           | `optics/components/form`             | P3             | ✅ Adapter Active                   |
| label         | 26           | `optics/components/form` (FormField) | P14            | ✅ Adapter Active                   |
| dialog        | 25           | `optics/components/modal`            | P6             | ⬜ Pending (Radix kept, deprecated) |
| tabs          | 21           | `optics/components/tab`              | P5             | ✅ Adapter Active                   |
| select        | 17           | `optics/components/form`             | P8             | ⬜ Pending (Radix kept, deprecated) |
| textarea      | 7            | `optics/components/form`             | P3             | ✅ Direct re-export                 |
| switch        | 7            | `optics/components/switch`           | P9             | ✅ Adapter Active                   |
| data-table    | 7            | wraps `optics/components/table`      | P17            |
| checkbox      | 6            | No Optics equivalent                 | P13 (Deferred) |
| table         | 5            | `optics/components/table`            | P7             |
| dropdown-menu | 5            | No Optics equivalent                 | P11 (Deferred) |
| alert-dialog  | 5            | `optics/components/modal`            | P6             |
| form          | 4            | `optics/components/form`             | P3             |
| progress      | 3            | No Optics equivalent                 | P16 (Deferred) |
| separator     | 2            | `optics/components/divider`          | P15            |
| avatar        | 2            | `optics/components/avatar`           | P10            |
| sonner        | 1            | No Optics equivalent                 | P19 (N/A)      |
| modal         | 1            | `optics/components/modal`            | P6             |

## Migration Checklist — b2b-admin

### Auth (4 files)

| File                                            | Components                           | Status     |
| ----------------------------------------------- | ------------------------------------ | ---------- |
| `features/auth/components/SSOProviders.tsx`     | button                               | ⬜ Pending |
| `features/auth/pages/B2BSignup.tsx`             | button, card, checkbox, input, label | ⬜ Pending |
| `features/auth/pages/EmailVerificationPage.tsx` | button, card                         | ⬜ Pending |
| `features/auth/pages/Login.tsx`                 | button, card, checkbox, input, label | ⬜ Pending |

### Bookings (7 files)

| File                                                       | Components                                           | Status     |
| ---------------------------------------------------------- | ---------------------------------------------------- | ---------- |
| `features/bookings/components/FlightAmendmentWorkflow.tsx` | badge, button, card, dialog, tabs                    | ⬜ Pending |
| `features/bookings/pages/BookingDetails.tsx`               | badge, button, card                                  | ⬜ Pending |
| `features/bookings/pages/BookingQueues.tsx`                | badge, button, data-table, dropdown-menu             | ⬜ Pending |
| `features/bookings/pages/BookingsList.tsx`                 | badge, button, data-table, input, label, select      | ⬜ Pending |
| `features/bookings/pages/NewBookingOffline.tsx`            | button, card, dialog, input, label, select, textarea | ⬜ Pending |
| `features/bookings/pages/NewBookingOnline.tsx`             | button, card, input, label, tabs                     | ⬜ Pending |
| `features/bookings/pages/columns.tsx`                      | badge                                                | ⬜ Pending |

### Companies (2 files)

| File                                                         | Components                                                            | Status     |
| ------------------------------------------------------------ | --------------------------------------------------------------------- | ---------- |
| `features/companies/components/CorporateLoyaltyAccounts.tsx` | badge, button, card, dialog, input, label, select                     | ⬜ Pending |
| `features/companies/pages/CompanyManagement.tsx`             | badge, button, card, checkbox, data-table, input, label, select, tabs | ⬜ Pending |

### CRM (19 files)

| File                                               | Components                                                | Status     |
| -------------------------------------------------- | --------------------------------------------------------- | ---------- |
| `modules/crm/components/ContactDetailModal.tsx`    | alert-dialog, badge, button, card, dialog, tabs, textarea | ⬜ Pending |
| `modules/crm/pages/ActivityTimelinePage.tsx`       | badge, button, card, input, tabs                          | ⬜ Pending |
| `modules/crm/pages/AttachmentsPage.tsx`            | badge, button, card, dialog, input                        | ⬜ Pending |
| `modules/crm/pages/BlocklistPage.tsx`              | badge, button, card, dialog, input                        | ⬜ Pending |
| `modules/crm/pages/CalendarPage.tsx`               | badge, button, card, dialog                               | ⬜ Pending |
| `modules/crm/pages/CampaignsPage.tsx`              | badge, button, card, dropdown-menu, input, progress, tabs | ⬜ Pending |
| `modules/crm/pages/ConnectedAccountsPage.tsx`      | badge, button, card, dialog, input                        | ⬜ Pending |
| `modules/crm/pages/ContactCreationManagerPage.tsx` | badge, button, card, dialog, input                        | ⬜ Pending |
| `modules/crm/pages/ContactsPage.tsx`               | badge, button, card, dropdown-menu, input, tabs           | ⬜ Pending |
| `modules/crm/pages/DashboardSyncPage.tsx`          | badge, card                                               | ⬜ Pending |
| `modules/crm/pages/EmailTemplatesPage.tsx`         | badge, button, card, input, tabs                          | ⬜ Pending |
| `modules/crm/pages/FavoritesPage.tsx`              | badge, button, card, dialog, input                        | ⬜ Pending |
| `modules/crm/pages/LeadsPage.tsx`                  | badge, button, card, input, progress, tabs                | ⬜ Pending |
| `modules/crm/pages/MatchParticipantPage.tsx`       | badge, button, card, dialog                               | ⬜ Pending |
| `modules/crm/pages/NotesPage.tsx`                  | badge, button, card, dialog, input, tabs                  | ⬜ Pending |
| `modules/crm/pages/OpportunitiesPage.tsx`          | badge, button, card, dialog, input                        | ⬜ Pending |
| `modules/crm/pages/SettingsPage.tsx`               | badge, button, card, input, label, modal, tabs            | ⬜ Pending |
| `modules/crm/pages/TasksPage.tsx`                  | badge, button, card, dialog, input, tabs                  | ⬜ Pending |
| `modules/crm/pages/VisitorAnalyticsPage.tsx`       | badge, button, card                                       | ⬜ Pending |
| `modules/crm/pages/WorkflowPage.tsx`               | badge, button, card, dialog, input                        | ⬜ Pending |

### Dashboard (1 file)

| File                                            | Components | Status     |
| ----------------------------------------------- | ---------- | ---------- |
| `features/dashboard/components/RecentSales.tsx` | avatar     | ⬜ Pending |

### Documents (1 file)

| File                                           | Components                        | Status     |
| ---------------------------------------------- | --------------------------------- | ---------- |
| `features/documents/pages/DocumentManager.tsx` | badge, button, card, input, table | ⬜ Pending |

### Finance (5 files)

| File                                      | Components                                                                     | Status     |
| ----------------------------------------- | ------------------------------------------------------------------------------ | ---------- |
| `features/finance/pages/B2BReports.tsx`   | badge, button, card, data-table, input, select, tabs                           | ⬜ Pending |
| `features/finance/pages/B2CReports.tsx`   | badge, button, card, data-table, select                                        | ⬜ Pending |
| `features/finance/pages/CurrencyList.tsx` | badge, button, data-table, dialog, dropdown-menu, input, label, select, switch | ⬜ Pending |
| `features/finance/pages/FinanceList.tsx`  | badge, data-table                                                              | ⬜ Pending |
| `features/finance/pages/columns.tsx`      | badge                                                                          | ⬜ Pending |

### Inventory (1 file)

| File                                         | Components                       | Status     |
| -------------------------------------------- | -------------------------------- | ---------- |
| `features/inventory/pages/InventoryList.tsx` | badge, button, card, input, tabs | ⬜ Pending |

### KYC (2 files)

| File                                   | Components                                    | Status     |
| -------------------------------------- | --------------------------------------------- | ---------- |
| `features/kyc/pages/KYCStatus.tsx`     | badge, button, card, progress, separator      | ⬜ Pending |
| `features/kyc/pages/KYCSubmission.tsx` | button, card, input, label, select, separator | ⬜ Pending |

### Marketing (1 file)

| File                                            | Components                              | Status     |
| ----------------------------------------------- | --------------------------------------- | ---------- |
| `features/marketing/pages/BrandingSettings.tsx` | badge, button, card, input, label, tabs | ⬜ Pending |

### Notifications (6 files)

| File                                                                  | Components                                                                  | Status     |
| --------------------------------------------------------------------- | --------------------------------------------------------------------------- | ---------- |
| `features/notifications/components/NotificationAnalyticsOverview.tsx` | button                                                                      | ⬜ Pending |
| `features/notifications/components/NotificationCampaignManager.tsx`   | button                                                                      | ⬜ Pending |
| `features/notifications/components/NotificationChannelForm.tsx`       | button                                                                      | ⬜ Pending |
| `features/notifications/components/NotificationScheduler.tsx`         | button                                                                      | ⬜ Pending |
| `features/notifications/components/NotificationTemplateBuilder.tsx`   | button                                                                      | ⬜ Pending |
| `features/notifications/pages/NotificationCenter.tsx`                 | badge, button, card, checkbox, input, label, select, switch, tabs, textarea | ⬜ Pending |

### Rules (7 files)

| File                                               | Components                                     | Status     |
| -------------------------------------------------- | ---------------------------------------------- | ---------- |
| `features/rules/components/ActionConfigurator.tsx` | button                                         | ⬜ Pending |
| `features/rules/components/ConditionEditor.tsx`    | button                                         | ⬜ Pending |
| `features/rules/components/RuleAnalyzer.tsx`       | button                                         | ⬜ Pending |
| `features/rules/components/RuleBuilder.tsx`        | button                                         | ⬜ Pending |
| `features/rules/components/RuleDebugger.tsx`       | button                                         | ⬜ Pending |
| `features/rules/components/RuleExecutor.tsx`       | button                                         | ⬜ Pending |
| `features/rules/pages/RulesList.tsx`               | button, dialog, input, label, select, textarea | ⬜ Pending |

### Shared (5 files)

| File                                            | Components                    | Status     |
| ----------------------------------------------- | ----------------------------- | ---------- |
| `shared/components/ErrorBoundary.tsx`           | button, card                  | ⬜ Pending |
| `shared/components/inputs/CityAutocomplete.tsx` | input, label                  | ⬜ Pending |
| `shared/components/inputs/DatePicker.tsx`       | input                         | ⬜ Pending |
| `shared/components/layout/Header.tsx`           | avatar, button, dropdown-menu | ⬜ Pending |
| `shared/components/layout/Layout.tsx`           | sonner                        | ⬜ Pending |

### Suppliers (11 files)

| File                                                                 | Components                                                            | Status     |
| -------------------------------------------------------------------- | --------------------------------------------------------------------- | ---------- |
| `features/suppliers/components/ApiConfigurationView.tsx`             | button, card, input, label, select, switch, tabs                      | ⬜ Pending |
| `features/suppliers/components/SupplierAnalytics.tsx`                | badge, card                                                           | ⬜ Pending |
| `features/suppliers/components/api-gateway/AuthenticationForm.tsx`   | button                                                                | ⬜ Pending |
| `features/suppliers/components/api-gateway/EndpointConfigurator.tsx` | button                                                                | ⬜ Pending |
| `features/suppliers/components/api-gateway/EnvironmentSelector.tsx`  | button                                                                | ⬜ Pending |
| `features/suppliers/components/api-gateway/GatewayForm.tsx`          | button                                                                | ⬜ Pending |
| `features/suppliers/components/api-gateway/GatewayHealthStatus.tsx`  | button                                                                | ⬜ Pending |
| `features/suppliers/components/api-gateway/ProductSelector.tsx`      | button                                                                | ⬜ Pending |
| `features/suppliers/components/api-gateway/RoutingConfigurator.tsx`  | button                                                                | ⬜ Pending |
| `features/suppliers/pages/SupplierGateway.tsx`                       | button                                                                | ⬜ Pending |
| `features/suppliers/pages/SuppliersList.tsx`                         | badge, button, card, dialog, form, input, label, select, switch, tabs | ⬜ Pending |
| `features/suppliers/pages/SuppliersManagement.tsx`                   | alert-dialog, badge, button, card, dialog, input, label, table        | ⬜ Pending |

### System (5 files)

| File                                                     | Components                                                      | Status     |
| -------------------------------------------------------- | --------------------------------------------------------------- | ---------- |
| `features/system/pages/BookingEngineRuntimeSettings.tsx` | badge, button, card, input, label, select, switch               | ⬜ Pending |
| `features/system/pages/ContentSettings.tsx`              | button, card, label, textarea                                   | ⬜ Pending |
| `features/system/pages/OrganizationOnboarding.tsx`       | badge, button, card, dialog, form, input, label, tabs, textarea | ⬜ Pending |
| `features/system/pages/OrganizationsList.tsx`            | alert-dialog, badge, button, card, dialog, input, label, table  | ⬜ Pending |
| `features/system/pages/PermissionManager.tsx`            | badge, button, card, label, select, switch                      | ⬜ Pending |

### Users (5 files)

| File                                            | Components                                                                        | Status     |
| ----------------------------------------------- | --------------------------------------------------------------------------------- | ---------- |
| `features/users/pages/B2BCompaniesList.tsx`     | alert-dialog, badge, button, card, dialog, input, label, table                    | ⬜ Pending |
| `features/users/pages/B2BCompanyOnboarding.tsx` | badge, button, card, checkbox, dialog, form, input, label, select, tabs, textarea | ⬜ Pending |
| `features/users/pages/UserForm.tsx`             | badge, button, card, checkbox, dialog, form, input, label, select, tabs           | ⬜ Pending |
| `features/users/pages/UsersList.tsx`            | alert-dialog, badge, button, card, dialog, input, label, table                    | ⬜ Pending |
| `features/users/pages/columns.tsx`              | badge                                                                             | ⬜ Pending |

### Wallet (2 files)

| File                                         | Components                  | Status     |
| -------------------------------------------- | --------------------------- | ---------- |
| `features/wallet/pages/VirtualCardsPage.tsx` | badge, button, card         | ⬜ Pending |
| `features/wallet/pages/WalletOverview.tsx`   | badge, button, card, switch | ⬜ Pending |

## Migration Checklist — booking-engine

### Notifications (1 file)

| File                                              | Components                  | Status     |
| ------------------------------------------------- | --------------------------- | ---------- |
| `components/Notifications/NotificationCenter.tsx` | button, card, input, select | ⬜ Pending |

## Phase 0 Completion Criteria

- [x] Zero backup files in ui/
- [x] Single canonical primary color documented (navy `229 66% 24%`)
- [x] ESLint warns on every legacy import
- [x] MIGRATION_TRACKER.md exists with all import sites cataloged

## Legend

| Symbol         | Meaning                                       |
| -------------- | --------------------------------------------- |
| ⬜ Pending     | Not yet started                               |
| 🔄 In Progress | Migration underway                            |
| ✅ Done        | Migration complete, legacy import removed     |
| ⏸️ Deferred    | No Optics equivalent, kept as-is with adapter |
