# TripAlfa Booking Engine - Design System Standards

This document defines the professional OTA (Online Travel Agency) design system applied consistently across all booking engine pages and components.

## Design Principles

Inspired by Booking.com, Expedia, and Kayak design languages:
- Clean, airy layouts with strategic whitespace
- Consistent rounded corners (xl = 12px for cards, lg = 8px for inputs)
- Professional blue brand color (#003b95) for primary actions
- Seamless connected search form patterns
- Card-based content architecture
- Mobile-first responsive design

## Shared Components

### AppCard

```tsx
import { AppCard } from '../components/shared';

// Elevated card (default)
<AppCard variant="elevated">
  Content with hover shadow effect
</AppCard>

// Flat card
<AppCard variant="flat">
  Content without shadow
</AppCard>

// Shadow card
<AppCard variant="shadow">
  Content with permanent shadow
</AppCard>
```

### AppInput

```tsx
import { AppInput } from '../components/shared';

<AppInput
  label="Email"
  labelIcon={<MailIcon />}
  placeholder="Enter your email"
  error={fieldError}
  helperText="We'll send your confirmation here"
/>
```

## Design Standards

### Card Base
| Style | Classes |
|-------|---------|
| Elevated | `bg-white rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-300` |
| Flat | `bg-white rounded-xl border border-gray-100` |
| Shadow | `bg-white rounded-xl shadow-md` |
| Glass | `bg-white/80 backdrop-blur-md border border-white/20 shadow-lg` |
| Gradient | `bg-gradient-to-br from-[#003b95] to-[#002a6e]` |

### Input Field
```
h-12 lg:h-14 rounded-xl border border-gray-200 bg-white px-4

text-sm text-gray-900 placeholder:text-gray-400

hover:border-gray-300 focus:border-[#003b95] focus:ring-2 focus:ring-[#003b95]/10
outline-none transition-all duration-200
disabled:bg-gray-50 disabled:text-gray-400
```

### Buttons
**Primary**: `bg-[#003b95] text-white rounded-lg px-6 py-2.5 font-semibold text-sm shadow-md hover:bg-[#002a6e] hover:shadow-lg active:scale-[0.98] transition-all duration-200`

**Secondary**: `bg-gray-900 text-white rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-700 transition-colors`

**Outline**: `border border-gray-200 text-gray-700 rounded-lg px-6 py-2.5 font-semibold text-sm hover:bg-gray-50 transition-colors`

**Pill**: `rounded-full bg-[#003b95] text-white px-6 py-2 font-semibold text-sm hover:bg-[#002a6e] transition-colors`

**Ghost**: `bg-transparent text-gray-700 hover:bg-gray-100 rounded-lg transition-colors`

### Typography
| Role | Classes |
|------|---------|
| Section heading | `text-sm font-bold text-[#003b95] uppercase tracking-wider` |
| Card title | `text-lg font-bold text-[#1d1d1f]` |
| Body text | `text-sm text-gray-600` |
| Label | `text-[11px] font-bold text-gray-500 uppercase tracking-wider` |
| Error | `mt-1.5 text-xs text-red-600 font-medium` |
| Helper text | `mt-1.5 text-xs text-gray-500` |
| Amount/price | `text-2xl font-bold text-[#1d1d1f]` |

### Search Form Pattern
All search forms follow this unified OTA-style layout:
```
flex flex-col lg:flex-row bg-white border border-gray-200 rounded-xl
  Fields: flex-1 min-w-0 border-t lg:border-t-0 lg:border-l border-gray-200
    Inner: px-4 py-3 lg:h-[56px] flex flex-col justify-center
  Button: flex items-stretch p-2 lg:p-1.5
    Inner: w-full lg:w-auto lg:h-[calc(100%)] px-6 rounded-lg
```

### Responsive
| Breakpoint | Policy |
|------------|--------|
| Mobile (<640px) | Full-width stacked, 12px padding, 16px font-sm |
| Tablet (640-1024px) | 2-column grids, gap-4 |
| Desktop (1024px+) | Multi-column grids, xl rounded, lg padding |

## Completed Pages

- ✅ `Search Widget` - All forms, tabs, buttons
- ✅ `Home.tsx` - Hero, cards, destinations, CTA
- ✅ `BookingCard.tsx` - Card and detail views
- ✅ `BookingTable.tsx` - Row styling and layout
- ✅ `BookingList.tsx` - List container spacing
- ✅ `Login.tsx` - Auth form card and inputs
- ✅ `Register.tsx` - Registration form
- ✅ `ForgotPassword.tsx` - Password reset
- ✅ `Dashboard.tsx` - Summary cards, charts, bookings list
- ✅ `Profile.tsx` - Tabs, forms, document upload
- ✅ `FlightDetail.tsx` - Segments, tabs, interactive elements
- ✅ `HotelDetail.tsx` - Room cards, tabs, features
- ✅ `Wallet.tsx` - Account cards, transaction list
- ✅ `Loyalty.tsx` - Tier status, points, benefits

## Remaining Work (Medium Priority)

### Search Results
- `FlightList.tsx` - Search results layout (filters, cards)
- `HotelList.tsx` - Search results layout (filters, cards)
- `FlightSearch.tsx` - Search process (e.g. loading, sorting, pagination)

### Booking Flow
- `BookingCheckout.tsx` - Payment method, review, addons
- `BookingConfirmation.tsx` - Confirmation/success page
- `BookingDetail.tsx` - Booking history with timeline
- `PassengerDetails.tsx` - Multi-passenger form
- `FlightAddons.tsx` - Add-on services (baggage, seats)
- `HotelAddons.tsx` - Add-on services (insurance etc.)
- `SeatSelection.tsx` - Seat map and cost display

### Account & Support
- `Alerts.tsx` - Notification alerts
- `HelpCenter.tsx` - Support and FAQ section
- `Notifications.tsx` - Inbox and settings
- `AccountSettings.tsx` - Account preferences and settings

## How to Apply to New Components

1. Import shared components:
```tsx
import { AppCard } from '../components/shared';
```

2. Use standardized patterns:
```tsx
<AppCard variant="elevated" className="p-6">
  <h2 className="text-lg font-bold text-[#1d1d1f]">Title</h2>
  <p className="text-sm text-gray-600">Description body</p>
  <button className="bg-[#003b95] text-white rounded-lg 
    px-6 py-2.5 font-semibold text-sm">
    Action
  </button>
</AppCard>
```

3. Ensure responsive behavior:
```tsx
// Mobile-first responsive
<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Key Asset URLs

Card backgrounds (example images used in popular destinations grid):
- Dubai: `https://images.unsplash.com/photo-1512453979798-5ea266f8880c?auto=format&fit=crop&q=80&w=600`
- London: `https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?auto=format&fit=crop&q=80&w=600`
- Paris: `https://images.unsplash.com/photo-1502602898657-3e91760cbb34?auto=format&fit=crop&q=80&w=600`
- New York: `https://images.unsplash.com/photo-1496442226666-8d4a0e62e6e9?auto=format&fit=crop&q=80&w=600`
