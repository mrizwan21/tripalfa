# Supplier Module - Component Library

Complete patterns and specifications for all supplier management components.

---

## Component Hierarchy

```
SupplierModule
├── Pages
│   ├── SuppliersList
│   ├── SupplierDetail
│   └── SupplierAnalytics
│
├── Layout Components
│   ├── SupplierHeader
│   ├── SupplierTabs
│   └── SupplierSidebar
│
├── Data Display
│   ├── SupplierCard
│   ├── SupplierTable
│   ├── StatsCard
│   └── MetricDisplay
│
├── Forms & Input
│   ├── SupplierForm
│   ├── ProductForm
│   ├── RuleForm
│   ├── PaymentForm
│   ├── DocumentUploader
│   └── FilterPanel
│
├── Status & Indicators
│   ├── StatusBadge
│   ├── HealthStatus
│   ├── TypeBadge
│   └── RatingDisplay
│
└── Utility Components
    ├── ConfirmDialog
    ├── BulkActionBar
    ├── EmptyState
    └── LoadingState
```

---

## 📦 COMPONENT: SupplierCard

**Purpose**: Display single supplier as a card with key metrics and actions

**Props**:
```typescript
interface SupplierCardProps {
  supplier: SupplierProfile
  isSelected?: boolean
  onSelect?: (id: string) => void
  onEdit?: (id: string) => void
  onDelete?: (id: string) => void
  showStats?: boolean
  showHealth?: boolean
}
```

**Design**:
```
┌─────────────────────────────────────┐
│ 📦 [GDS] ⋯                          │
│ Supplier Name                       │
│ ──────────────────────────────────  │
│ ★★★★☆ 4.5/5 │ ✓ Active            │
│ 📊 1,234 Orders │ 💰 $45,231       │
├─────────────────────────────────────┤
│ Status: Operational  Last: 2m ago   │
│ Comm: 8% | Response: 1.2s          │
├─────────────────────────────────────┤
│ [Edit] [View] [Menu ▼]              │
└─────────────────────────────────────┘
```

**Colors**:
```typescript
const statusColors = {
  active: 'bg-green-50 border-green-200',
  inactive: 'bg-gray-50 border-gray-200',
  suspended: 'bg-red-50 border-red-200',
  pending: 'bg-blue-50 border-blue-200',
}

const typeColors = {
  'GDS': 'bg-purple-100 text-purple-800',
  'Aggregator': 'bg-blue-100 text-blue-800',
  'Direct': 'bg-orange-100 text-orange-800',
  'Wholesaler': 'bg-green-100 text-green-800',
}
```

**States**:
- Normal: Gray text, standard spacing
- Hover: Shadow increase, background color change
- Selected: Blue border, checkmark icon
- Loading: Skeleton loader, reduced opacity
- Error: Red border, error icon

---

## 📊 COMPONENT: SupplierTable

**Purpose**: Display suppliers in tabular format with sorting/filtering

**Props**:
```typescript
interface SupplierTableProps {
  suppliers: SupplierProfile[]
  loading?: boolean
  onSort?: (field: keyof SupplierProfile) => void
  onRowClick?: (supplier: SupplierProfile) => void
  selectable?: boolean
  selectedIds?: string[]
  onSelectionChange?: (ids: string[]) => void
}
```

**Layout**:
```
┌──────────────────────────────────────────────────────────────┐
│ Columns: [ID] Name | Type | Status | Rating | Orders | Menu │
├──────────────────────────────────────────────────────────────┤
│ ☐ SUP-001 Supplier 1 │ GDS │ ✓Act │ ★★★★★ │ 1,234 │ ⋯    │
│ ☐ SUP-002 Supplier 2 │ Agg │ ⚠Pend│ ★★★★  │ 567   │ ⋯    │
│ ☐ SUP-003 Supplier 3 │ Dir │ ✓Act │ ★★★   │ 789   │ ⋯    │
└──────────────────────────────────────────────────────────────┘
```

**Features**:
- Sortable columns (click header to sort)
- Multi-select with checkbox
- Inline actions (Edit, Delete, More)
- Row highlighting on hover
- Status indicators with icons
- Responsive: Hides columns on mobile

---

## 📝 COMPONENT: SupplierForm

**Purpose**: Create or edit supplier information

**Props**:
```typescript
interface SupplierFormProps {
  initialData?: SupplierFormData
  onSubmit: (data: SupplierFormData) => Promise<void>
  loading?: boolean
  error?: string
}
```

**Sections**:
1. **Basic Information**
   - Name (required)
   - Type (dropdown)
   - Status (active/inactive)
   - Pricing Model (dropdown)

2. **Contact Information**
   - Primary Person Name
   - Email Address
   - Phone Number
   - Alternative Phone

3. **Location**
   - Country (required)
   - City
   - Address
   - Region

4. **Commission Settings**
   - Commission Percentage
   - Markup Percentage
   - Currency

**Validation**:
```typescript
- Name: min 2, max 100 chars
- Email: valid email format
- Phone: international format
- Country: non-empty
- Commission: 0-100%
```

**Design**:
```
┌─────────────────────────────────────────┐
│ Basic Information                       │
├─────────────────────────────────────────┤
│ Name: [____________]  Required          │
│ Type: [GDS ▼]                           │
│ Status: [Active ▼]                      │
├─────────────────────────────────────────┤
│ Contact Information                     │
├─────────────────────────────────────────┤
│ Person: [______________]                │
│ Email: [____________________]           │
│ Phone: [______________]                 │
├─────────────────────────────────────────┤
│ Commission: [10]%  Markup: [5]%         │
├─────────────────────────────────────────┤
│ [Cancel] [Save]                         │
└─────────────────────────────────────────┘
```

---

## 🏷️ COMPONENT: TypeBadge

**Purpose**: Display supplier type with color coding

**Props**:
```typescript
interface TypeBadgeProps {
  type: SupplierType
  size?: 'sm' | 'md' | 'lg'
  variant?: 'solid' | 'outline'
}
```

**Variants**:
```
Solid (default):
┌─────────────┐
│ GDS ◆       │
└─────────────┘

Outline:
┌─────────────┐
│ Aggregator  │
└─────────────┘
```

**Color Map**:
```typescript
const typeColorMap = {
  'GDS': {
    bg: 'bg-purple-100',
    text: 'text-purple-800',
    border: 'border-purple-300',
    dark: 'dark:bg-purple-900 dark:text-purple-100'
  },
  'Aggregator': {
    bg: 'bg-blue-100',
    text: 'text-blue-800',
    border: 'border-blue-300',
    dark: 'dark:bg-blue-900 dark:text-blue-100'
  },
  'Direct': {
    bg: 'bg-orange-100',
    text: 'text-orange-800',
    border: 'border-orange-300',
    dark: 'dark:bg-orange-900 dark:text-orange-100'
  },
  'Wholesaler': {
    bg: 'bg-green-100',
    text: 'text-green-800',
    border: 'border-green-300',
    dark: 'dark:bg-green-900 dark:text-green-100'
  }
}
```

---

## ✅ COMPONENT: StatusBadge

**Purpose**: Show supplier status (Active, Inactive, Suspended, Pending)

**Props**:
```typescript
interface StatusBadgeProps {
  status: SupplierStatus
  showIcon?: boolean
  animate?: boolean
}
```

**Visual States**:
```
✓ Active (Green)
┌────────────┐
│ ✓ Active   │ → Solid green background
└────────────┘

⚠ Pending (Blue)
┌────────────┐
│ ⏳ Pending  │ → Animated pulse
└────────────┘

✕ Suspended (Red)
┌────────────┐
│ ✕ Suspended│ → Red with warning icon
└────────────┘

⊘ Inactive (Gray)
┌────────────┐
│ ⊘ Inactive │ → Gray, muted
└────────────┘
```

---

## ⭐ COMPONENT: RatingDisplay

**Purpose**: Show supplier rating and order count

**Props**:
```typescript
interface RatingDisplayProps {
  rating: number  // 0-5
  count: number   // Order count
  variant?: 'compact' | 'full'
}
```

**Variants**:
```
Compact:
★★★★☆ (4.5) | 1,234 orders

Full:
Rating: 4.5 out of 5 ⭐
Based on 1,234 orders
Success Rate: 98%
Response Time: 1.2s avg
```

---

## 🏥 COMPONENT: HealthStatus

**Purpose**: Display supplier system health

**Props**:
```typescript
interface HealthStatusProps {
  health: SupplierHealthCheck
  showTrend?: boolean
  compact?: boolean
}
```

**States**:
```
🟢 Healthy
  Response: 1.2s
  Uptime: 99.9%
  Last check: 2m ago

🟡 Degraded
  Response: 3.5s (⚠ slow)
  Uptime: 98%
  Last check: 5m ago

🔴 Down
  Last successful: 15m ago
  Error: Connection timeout
  Action: Contact supplier
```

---

## 📤 COMPONENT: DocumentUploader

**Purpose**: Handle supplier document uploads with validation

**Props**:
```typescript
interface DocumentUploaderProps {
  supplierId: string
  documentType: DocumentType
  onUpload?: (file: SupplierDocument) => void
  maxSize?: number // in MB
  acceptedTypes?: string[]
}
```

**Design**:
```
Drag & Drop Area:
┌───────────────────────────────────┐
│                                   │
│     📄 Drop files here or click   │
│     to select                     │
│                                   │
│     Supported: PDF, JPG, PNG      │
│     Max: 10MB                     │
│                                   │
└───────────────────────────────────┘

Upload Progress:
[████████░░░░░░░░] 65% Uploading...
```

**Features**:
- Drag & drop support
- Multiple file selection
- Progress indication
- File preview generation
- Validation (size, type, virus scan)
- Expiry date picker
- Auto-retry on failure

---

## 📋 COMPONENT: ProductTable

**Purpose**: Display and manage supplier products

**Props**:
```typescript
interface ProductTableProps {
  products: SupplierProduct[]
  supplierId: string
  onAdd?: () => void
  onEdit?: (product: SupplierProduct) => void
  onDelete?: (productId: string) => void
  loading?: boolean
}
```

**Columns**:
```
Product Name | Commission Type | Contact | Presence | Status | Actions
─────────────────────────────────────────────────────────────────────
Hotel Search │ API            │ John    │ Online   │ ✓ Act  │ [Edit] [✕]
Flight       │ Offline        │ Jane    │ Online   │ ✓ Act  │ [Edit] [✕]
Tours        │ API            │ Bob     │ Offline  │ ⊘ Inc  │ [Edit] [✕]
```

---

## 💳 COMPONENT: PaymentMethodCard

**Purpose**: Display payment method information

**Props**:
```typescript
interface PaymentMethodCardProps {
  payment: SupplierPayment
  onEdit?: () => void
  onDelete?: () => void
  isDefault?: boolean
}
```

**Design**:
```
┌────────────────────────────────┐
│ 💳 Bank Transfer               │
│ ☆ Set as default              │
├────────────────────────────────┤
│ Account: •••• •••• •••• 1234   │
│ Currency: USD, EUR             │
│ Status: ✓ Active               │
│ Added: 2024-01-15              │
├────────────────────────────────┤
│ [Edit] [Delete]                │
└────────────────────────────────┘
```

**Status Indicators**:
```
✓ Active:    Green checkmark, full opacity
⚠ Expiring:  Yellow warning, 30 days left
✕ Expired:   Red X, grayed out
⏳ Pending:   Blue hourglass
```

---

## 📊 COMPONENT: StatsCard

**Purpose**: Display key supplier metrics

**Props**:
```typescript
interface StatsCardProps {
  icon: React.ReactNode
  title: string
  value: string | number
  change?: {
    value: number
    type: 'increase' | 'decrease'
    period: string
  }
  color?: 'blue' | 'green' | 'red' | 'purple' | 'orange'
  loading?: boolean
}
```

**Design**:
```
┌────────────────────────┐
│ 📊 Total Orders        │
│                        │
│ 1,234                  │
│ ↑ 12.5% from last week │
└────────────────────────┘

With Chart:
┌────────────────────────┐
│ 💰 Revenue             │
│                        │
│ $45,231     📈/        │
│ ↑ 8% this month  /    │
└────────────────────────┘
```

**Color Variants**:
```typescript
const colorMap = {
  'blue': 'bg-blue-50 text-blue-700 border-blue-200',
  'green': 'bg-green-50 text-green-700 border-green-200',
  'red': 'bg-red-50 text-red-700 border-red-200',
  'purple': 'bg-purple-50 text-purple-700 border-purple-200',
  'orange': 'bg-orange-50 text-orange-700 border-orange-200',
}
```

---

## 🎯 COMPONENT: FilterPanel

**Purpose**: Advanced filtering for supplier lists

**Props**:
```typescript
interface FilterPanelProps {
  onFilterChange: (filters: SupplierListFilters) => void
  defaultFilters?: SupplierListFilters
}
```

**Filter Options**:
- Type (GDS, Aggregator, Direct, Wholesaler)
- Status (Active, Inactive, Suspended, Pending)
- Pricing Model (Commissionable, Net, Markup)
- Country (Dropdown)
- Rating Range (1-5 stars)
- Date Range (Founded After/Before)

**Design**:
```
┌─────────────────────────────┐
│ Filters                  ✕  │
├─────────────────────────────┤
│ Type:                       │
│ ☐ GDS  ☐ Aggregator        │
│ ☐ Direct  ☐ Wholesaler     │
│                             │
│ Status:                     │
│ ☐ Active  ☐ Inactive       │
│ ☐ Suspended  ☐ Pending     │
│                             │
│ Country: [Select...]        │
│ Min Rating: [☆☆☆☆☆]        │
│                             │
│ [Clear All] [Apply] [Save]  │
└─────────────────────────────┘
```

---

## 🗑️ COMPONENT: ConfirmDialog

**Purpose**: Confirmation before destructive actions

**Props**:
```typescript
interface ConfirmDialogProps {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  destructive?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}
```

**Example**:
```
┌─────────────────────────────────┐
│ Delete Supplier?                │
├─────────────────────────────────┤
│                                 │
│ This action cannot be undone.   │
│ All associated data will be     │
│ permanently removed.            │
│                                 │
├─────────────────────────────────┤
│ [Cancel] [Delete] ← Red button  │
└─────────────────────────────────┘
```

---

## 📋 COMPONENT: BulkActionBar

**Purpose**: Perform actions on multiple selected suppliers

**Props**:
```typescript
interface BulkActionBarProps {
  selectedCount: number
  onDelete?: () => void
  onStatusChange?: (status: SupplierStatus) => void
  onExport?: () => void
  onCancel?: () => void
}
```

**Design**:
```
┌──────────────────────────────────────────────────┐
│ ✓ 5 selected                                     │
│ [Activate] [Deactivate] [Download] [Delete] [✕]│
└──────────────────────────────────────────────────┘
```

---

## 🚫 COMPONENT: EmptyState

**Purpose**: Show when no suppliers exist

**Variants**:
```
No Suppliers
┌────────────────────────────┐
│                            │
│        📦                  │
│                            │
│   No suppliers found       │
│   Start by adding one      │
│                            │
│   [+ Add Supplier]         │
│                            │
└────────────────────────────┘

No Results (Filtered)
┌────────────────────────────┐
│                            │
│        🔍                  │
│                            │
│   No suppliers match your  │
│   filters                  │
│                            │
│   [Clear Filters]          │
│                            │
└────────────────────────────┘
```

---

## ⏳ COMPONENT: LoadingState

**Purpose**: Display during data loading

**Variants**:
```
Skeleton Card:
┌─────────────────────────┐
│ ▓▓▓▓▓▓▓▓▓ (pulsing)     │
│ ▓▓▓▓▓ ▓▓▓              │
│ ▓▓▓▓▓▓▓▓ ▓▓▓▓▓▓        │
└─────────────────────────┘

Loading Bar:
─ ▊▓▓▓▓▓▓▓▓ 30% Loading...

Spinner:
  ◐ Loading...
```

---

## 🎨 Design Tokens Usage

```typescript
// Colors
import { COLORS } from '@/theme/tokens'

const statusColor = {
  'Active': COLORS.success[500],
  'Inactive': COLORS.neutral[400],
  'Suspended': COLORS.error[500],
  'Pending': COLORS.primary[500],
}

// Typography
import { TYPOGRAPHY } from '@/theme/tokens'

const title = `font-${TYPOGRAPHY.fontWeight[600]} text-${TYPOGRAPHY.fontSize['lg']}`

// Spacing
import { SPACING } from '@/theme/tokens'

const padding = `p-${SPACING[4]}`  // 16px

// Shadows
import { SHADOWS } from '@/theme/tokens'

const boxShadow = SHADOWS.lg  // elevation-lg shadow

// Animations
import { ANIMATIONS } from '@/theme/tokens'

const transition = 'transition-all duration-300 ease-out'
```

---

## 📱 Responsive Design

**Breakpoints in use**:
```typescript
xs: 320px   → Single column, full-width
sm: 640px   → Single column, cards stacked
md: 768px   → 2 columns, simplified forms
lg: 1024px  → 2-3 columns, full UI
xl: 1280px  → 3-4 columns, all features
2xl: 1536px → 4+ columns, side panels
```

---

## ♿ Accessibility

**Requirements for all components**:
- Proper ARIA labels for icons
- Keyboard navigation support (Tab, Enter, Space)
- Color not as only indicator (use icons/text too)
- Focus indicators on all interactive elements
- Screen reader announcements for status changes
- Semantic HTML (buttons, links, forms)

---

## 🧪 Component Testing Checklist

```
□ Renders without crashing
□ Props validation works
□ Loading states display
□ Error states display
□ Accessibility: keyboard nav
□ Accessibility: screen reader
□ Mobile responsive
□ Dark mode support
□ Interactions work (click, hover, focus)
□ API integration works
□ Form validation works
□ Error messages display
□ Success messages display
```

---

**Library Status**: ✅ Complete  
**Components Count**: 15+  
**Implementation Ready**: Yes  
**Last Updated**: February 2026
