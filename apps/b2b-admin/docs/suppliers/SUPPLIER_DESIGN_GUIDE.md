# Supplier Management Module - Complete Design & Architecture Guide

## 📋 Overview

A comprehensive supplier management module built with modern React architecture, following the same design system as the dashboard with specialized components for supplier workflows.

---

## 🎨 Module Design System

### Color Coding for Supplier Status

```typescript
// Supplier Status Colors (extends base design system)
Status Colors:
  ✓ Active:     Green (#10B981) - Operational
  ✗ Inactive:   Gray (#64748B) - Disabled
  ⚠ Suspended:  Red (#EF4444) - Account blocked
  ⏳ Pending:    Blue (#3B82F6) - Awaiting approval

Type Badges:
  GDS:         Purple (#A855F7)
  Aggregator:  Blue (#3B82F6)
  Direct:      Orange (#F97316)
  Wholesaler:  Green (#10B981)

Payment Status:
  ✓ Active:     Green (#10B981)
  ⚠ Expiring:   Yellow (#FBBF24)
  ✕ Expired:    Red (#EF4444)
  ⊘ Suspended:  Orange (#F97316)
```

---

## 📁 Module Structure

```
src/features/suppliers/
├── pages/
│   ├── SuppliersList.tsx          ← List view with filters
│   ├── SuppliersManagement.tsx     ← Main management page
│   ├── SupplierDetail.tsx          ← Detail view
│   ├── SupplierProfile.tsx         ← Profile tab
│   ├── SupplierProducts.tsx        ← Products tab
│   ├── SupplierRules.tsx           ← Pricing rules tab
│   ├── SupplierPayments.tsx        ← Payment methods tab
│   ├── SupplierDocuments.tsx       ← Documents tab
│   └── SupplierAnalytics.tsx       ← Analytics & stats
│
├── components/
│   ├── SupplierCard.tsx            ← Reusable supplier card
│   ├── SupplierForm.tsx            ← Create/Edit form
│   ├── ProductTable.tsx            ← Products list
│   ├── RulesTable.tsx              ← Rules list
│   ├── PaymentTable.tsx            ← Payment methods
│   ├── DocumentUpload.tsx          ← Document management
│   ├── HealthStatus.tsx            ← Health indicator
│   ├── StatsCard.tsx               ← Statistics card
│   ├── BulkActions.tsx             ← Batch operations
│   └── Filters.tsx                 ← Advanced filters
│
├── hooks/
│   ├── useSuppliers.ts             ← Supplier list hook
│   ├── useSupplierDetail.ts        ← Detail hook
│   ├── useSupplierForm.ts          ← Form management
│   └── useSupplierFilters.ts       ← Filter logic
│
├── utils/
│   ├── validation.ts               ← Form validation
│   ├── formatters.ts               ← Data formatting
│   └── helpers.ts                  ← Utility functions
│
├── types/
│   └── index.ts                    ← Local types
│
└── index.tsx                       ← Module entry point
```

---

## 🎯 Main Views & Layouts

### 1. Supplier List View

```
╔════════════════════════════════════════════════════════════════════╗
║ ☰  Suppliers  [Search...] [Filters▼] [+Add] [⋯]                  ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║  Type: [All▼] Status: [All▼] Country: [All▼] [Search]            ║
║                                                                    ║
║  ┌────────────────────────────────────────────────────────────┐   ║
║  │ ☐ Name        │ Type        │ Status │ Rating │ Orders    │   ║
║  ├────────────────────────────────────────────────────────────┤   ║
║  │ ☐ Supplier 1  │ GDS ◆       │ ✓Activ │ ★★★★★ │ 1,234     │   ║
║  │ ☐ Supplier 2  │ Aggregator ◆│ ⚠Pend │ ★★★★  │ 567       │   ║
║  │ ☐ Supplier 3  │ Direct ◆    │ ✓Activ │ ★★★   │ 789       │   ║
║  │ ☐ Supplier 4  │ Wholesaler◆ │ ✕Susp  │ ★★    │ 234       │   ║
║  └────────────────────────────────────────────────────────────┘   ║
║                                                                    ║
║  [Prev] [1] [2] [3] [Next]  Showing 1-10 of 42                   ║
╚════════════════════════════════════════════════════════════════════╝
```

### 2. Supplier Detail View (Tabbed)

```
╔════════════════════════════════════════════════════════════════════╗
║ ← Supplier Name  [Edit] [Delete] [⋯]  Status: ✓Active            ║
╠════════════════════════════════════════════════════════════════════╣
║ Profile | Products | Rules | Payments | Documents | API | Stats   ║
║─────────────────────────────────────────────────────────────────   ║
║                                                                    ║
║  ┌─────────────────────────┐  ┌─────────────────────────┐         ║
║  │ Supplier Information    │  │ Contact Information     │         ║
║  │ ─────────────────────── │  │ ─────────────────────── │         ║
║  │ ID: SUP-12345           │  │ Person: John Doe        │         ║
║  │ Type: GDS               │  │ Email: john@supplier.com│         ║
║  │ Pricing: Commissionable │  │ Phone: +1-234-567-8900 │         ║
║  │ Founded: 2020           │  │ Address: ...            │         ║
║  └─────────────────────────┘  └─────────────────────────┘         ║
║                                                                    ║
║  ┌──────────────────────────────────────────────────────────────┐  ║
║  │ Performance Metrics                                          │  ║
║  │ ──────────────────────────────────────                       │  ║
║  │ Rating: ★★★★☆ (4.5/5)  | Orders: 1,234 | Revenue: $45,231 │  ║
║  │ Success Rate: 98%       | Avg Response: 1.2s                │  ║
║  └──────────────────────────────────────────────────────────────┘  ║
║                                                                    ║
╚════════════════════════════════════════════════════════════════════╝
```

### 3. Products Tab

```
┌────────────────────────────────────────────────────────────────┐
│ [+Add Product]  [Import] [Export]  Showing 5 products         │
├────────────────────────────────────────────────────────────────┤
│ ☐ Product Name │ Commission │ Contact │ Presence │ Status      │
├────────────────────────────────────────────────────────────────┤
│ ☐ Hotel Search │ API        │ John    │ Online   │ ✓ Active    │
│ ☐ Flight       │ Offline    │ Jane    │ Online   │ ✓ Active    │
│ ☐ Tours        │ API        │ Bob     │ Offline  │ ⊘ Inactive  │
└────────────────────────────────────────────────────────────────┘
```

### 4. Pricing Rules Tab

```
┌────────────────────────────────────────────────────────────────┐
│ [+Add Rule] [Bulk Actions▼] [▼Priority Order]                 │
├────────────────────────────────────────────────────────────────┤
│ ☐ Rule Name │ Product │ Markup │ Comm. │ Discount │ Status    │
├────────────────────────────────────────────────────────────────┤
│ ☐ Rule 1    │ Hotel   │ 5%     │ 8%    │ -        │ ✓ Active  │
│ ☐ Rule 2    │ Flight  │ 3%     │ -     │ 2%       │ ✓ Active  │
│ ☐ Rule 3    │ Tours   │ -      │ 10%   │ 5%       │ ✕ Expired │
└────────────────────────────────────────────────────────────────┘
```

### 5. Payment Methods Tab

```
┌────────────────────────────────────────────────────────────────┐
│ [+Add Payment]  Payment Methods                                │
├────────────────────────────────────────────────────────────────┤
│ ☐ Account Type │ Account No │ Mode   │ Currency │ Status       │
├────────────────────────────────────────────────────────────────┤
│ ☐ Bank Transfer│ XXXX1234   │ Online │ USD      │ ✓ Active     │
│ ☐ PayPal       │ XXXX5678   │ Online │ EUR      │ ⚠ Expiring   │
│ ☐ Cash         │ N/A        │Offline│ SAR      │ ✓ Active     │
└────────────────────────────────────────────────────────────────┘
```

### 6. Documents Tab

```
┌────────────────────────────────────────────────────────────────┐
│ [⬆ Upload Document]  [Download All]                             │
├────────────────────────────────────────────────────────────────┤
│ ☐ Document Name │ Type │ Issue Date │ Expire Date │ Status     │
├────────────────────────────────────────────────────────────────┤
│ ☐ Contract      │ PDF  │ 2023-01-15 │ 2025-01-15  │ ✓ Valid    │
│ ☐ License       │ PDF  │ 2022-06-01 │ 2024-06-01  │ ⚠ Expiring │
│ ☐ Passport Copy │ JPG  │ 2020-03-20 │ 2030-03-20  │ ✓ Valid    │
└────────────────────────────────────────────────────────────────┘
```

### 7. Analytics Tab

```
╔════════════════════════════════════════════════════════════════╗
║ Performance Metrics                                            ║
├────┬────────────────┬────────────────┬────────────────┐        ║
│ 📊 │ Total Orders   │ Total Revenue  │ Avg Order Value│        ║
│    │    1,234       │   $45,231      │   $36.67       │        ║
├────┼────────────────┼────────────────┼────────────────┤        ║
│ ⏱️  │ Response Time  │ Success Rate   │ Customer Rating│        ║
│    │   1.2 seconds  │    98%         │   ★★★★☆ (4.5) │        ║
└────┴────────────────┴────────────────┴────────────────┘        ║
║                                                                ║
║  Orders Over Time                Revenue Over Time             ║
║  ┌──────────────────┐                ┌──────────────────┐     ║
║  │     📈/         │                │    📈/           │     ║
║  │    /  \         │                │   /   \          │     ║
║  │  /      \       │  (Area chart)  │ /       \        │     ║
║  │/        \____   │                │/         \____   │     ║
║  └──────────────────┘                └──────────────────┘     ║
║                                                                ║
╚════════════════════════════════════════════════════════════════╝
```

---

## 🧩 Component Library

### SupplierCard
```typescript
<SupplierCard
  supplier={supplierData}
  showRating={true}
  showStats={true}
  onSelect={handleSelect}
  actionMenu={['Edit', 'Delete', 'View Details']}
/>
```

Visual:
```
┌────────────────────────────────┐
│ 📦 Supplier Name               │ ← Type badge (GDS)
│ ────────────────────────────── │
│ ★★★★☆ (4.5/5) │ 📊 1,234 Orders
│ 💰 $45,231 Revenue  │ ✓ Active     │
├────────────────────────────────┤
│ [Edit] [Delete] [⋯]            │
└────────────────────────────────┘
```

### StatsCard

```typescript
<StatsCard
  icon={TrendingIcon}
  title="Total Revenue"
  value="$45,231"
  change={{ value: 12.5, type: 'increase' }}
  color="green"
/>
```

### HealthStatus Indicator

```typescript
<HealthStatus
  status="healthy"  // healthy | degraded | down
  responseTime={1.2}
  lastCheck="2 minutes ago"
/>
```

Visual:
```
🟢 Healthy (1.2s response)
  Last check: 2 minutes ago

🟡 Degraded (3.5s response)
  Last check: 5 minutes ago
  Issue: Slow response times

🔴 Down
  Last check: 10 minutes ago
  Issue: Connection refused
```

---

## 🔌 API Integration Pattern

```typescript
// Using the centralized API Manager
import { supplierAPIService } from '@/services/api-manager'

// List suppliers with filters
const { data: suppliers } = await supplierAPIService.listSuppliers({
  supplierType: 'GDS',
  status: 'Active',
}, { page: 1, limit: 10 })

// Get supplier details
const { data: detail } = await supplierAPIService.getSupplier(id)

// Add payment method
const { data: payment } = await supplierAPIService.addSupplierPayment(id, {
  accountType: 'Bank Transfer',
  currency: 'USD',
  // ...
})

// Upload document
const { data: doc } = await supplierAPIService.uploadSupplierDocument(id, {
  name: 'Contract',
  type: 'Supplier Contract',
  file: fileObj,
  expiryDate: '2025-12-31'
})
```

---

## 📊 Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│ UI Components (React)                                       │
│ - SuppliersList, SupplierDetail, Tabs, Forms               │
└────────────┬──────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────┐
│ Custom Hooks (Business Logic)                             │
│ - useSuppliers, useSupplierDetail, useSupplierForm        │
└────────────┬──────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────┐
│ API Service Layer (SupplierAPIService)                    │
│ - Endpoints registry, request mapping                      │
└────────────┬──────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────┐
│ Centralized API Manager                                   │
│ - Request/Response handling, Caching, Interceptors        │
└────────────┬──────────────────────────────────────────────┘
             │
┌────────────▼──────────────────────────────────────────────┐
│ Backend API (Express/Node.js)                             │
│ - Database operations, Business logic                      │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Security Considerations

```typescript
// API Credentials - NEVER cached
const credentials = await supplierAPIService.listSupplierAPICredentials(id, {
  skipCache: true  // Force fresh request
})

// Password fields are never returned in full
// Backend masks sensitive data

// Document URLs use temporary signed URLs
// Expires after 15 minutes
```

---

## 🎨 Form Validation

```typescript
// Uses Zod for validation
const supplierSchema = z.object({
  supplierName: z.string().min(2).max(100),
  supplierType: z.enum(['GDS', 'Aggregator', 'Direct', 'Wholesaler']),
  emailAddress: z.string().email().optional(),
  country: z.string().nonempty('Country is required'),
  pricingModel: z.enum(['Commissionable', 'Net', 'Markup']),
  isActive: z.boolean(),
})
```

---

## 📱 Responsive Behavior

```typescript
// Mobile: Stacked card layout, inline forms
// Tablet: 2-column grid, horizontal tabs
// Desktop: 3-column grid, full table view
// XL: 4-column grid, advanced features visible

// Example:
<div className="
  grid gap-4
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
  xl:grid-cols-4
">
  {suppliers.map(s => <SupplierCard key={s.id} supplier={s} />)}
</div>
```

---

## 🚀 Performance Optimization

```typescript
// Caching Strategy
- List endpoints: 5-10 minute cache
- Detail endpoints: 5 minute cache
- Sensitive data (credentials): No cache
- Real-time data (stats): 2-3 minute cache

// Pagination
- Default: 20 items per page
- Lazy load: 10 items at a time
- Virtual scrolling: For large lists

// Lazy Loading
import { lazy } from 'react'
const SupplierAnalytics = lazy(() => import('./SupplierAnalytics'))
```

---

## 🧪 Testing Strategy

```typescript
// Unit tests
- Validation schemas
- Utility functions
- Hooks logic

// Integration tests
- API service integration
- Form submission flows
- Data fetching scenarios

// E2E tests
- Full supplier creation flow
- Product addition workflow
- Payment method management
```

---

## 📊 Accessibility Features

- Semantic HTML with proper ARIA labels
- Keyboard navigation throughout
- Screen reader support
- Color-blind friendly status indicators
- Focus management for modals
- Status updates announced to screen readers

---

## 🔄 State Management

```typescript
// Context for module-level state
<SupplierContext>

// Zustand for complex state
const useSupplierStore = create((set) => ({
  filters: {},
  setFilters: (filters) => set({ filters }),
  selectedSupplier: null,
  setSelected: (s) => set({ selectedSupplier: s }),
}))

// React Query for server state
const { data, status, error } = useQuery({
  queryKey: ['suppliers', filters],
  queryFn: () => supplierAPIService.listSuppliers(filters),
})
```

---

## 🎓 Key Design Principles

1. **Consistency** - Use design system tokens throughout
2. **Clarity** - Status, types, and actions clearly visible
3. **Efficiency** - Bulk actions, quick filters, shortcuts
4. **Responsiveness** - Works seamlessly on all devices
5. **Accessibility** - WCAG AA compliant
6. **Performance** - Optimized caching and rendering
7. **Security** - Sensitive data handling, validation
8. **Maintainability** - Well-organized, well-documented code

---

**Module Status**: ✅ Design Complete  
**Implementation Phase**: Ready for Component Development  
**Last Updated**: February 2026
