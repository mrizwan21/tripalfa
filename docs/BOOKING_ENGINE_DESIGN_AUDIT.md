# Booking Engine Design Audit (Multitenant)

## Executive Summary

The booking engine has a mixed styling model: reusable primitives exist (`Button`, `Input`, `Label`), but many high-traffic screens still use ad-hoc classes with hard-coded colors, radius, font weights, and spacing. This causes inconsistent button shapes/sizes, uneven forms/labels, and weak brand portability for multitenant B2B customers.

This implementation introduces a tenant-aware theme foundation and applies it to primary hero/search controls in `FlightHome` and `HotelHome`.

## Key Findings

### 1) Inconsistent control system

- Pages mix primitive usage (`Button`) and raw `<button>` with one-off Tailwind classes.
- Same action type appears with multiple sizes, radii, and font weights.

### 2) Hard-coded brand styles in page components

- Colors are often hard-coded (e.g. `#152467`, `#EC5C4C`, `#6366F1`) directly in page files.
- Button and input radii are manually defined (`rounded-lg`, `rounded-xl`, `rounded-2xl`) without standards.

### 3) Typography hierarchy drift

- Labels and headings use different style patterns per page, reducing visual coherence.
- Form controls combine custom text sizes with utility overrides, creating unstable alignment.

### 4) Branding pipeline gap

- B2B Admin already stores branding values (`/branding/colors`), but booking-engine did not consistently consume/apply them globally.
- No reliable runtime mapping from tenant branding settings to booking-engine design tokens.

## What Was Implemented

### A) Tenant theme runtime for booking-engine

- Added tenant branding model and loader:
  - `apps/booking-engine/src/types/branding.ts`
  - `apps/booking-engine/src/lib/tenantBranding.ts`

- Added provider to load and apply branding before app render:
  - `apps/booking-engine/src/components/providers/TenantThemeProvider.tsx`

- Wired provider in app bootstrap:
  - `apps/booking-engine/src/main.tsx`

### B) Global token wiring for control consistency

- Updated global CSS to support tenant-managed control radii and font family via CSS variables:
  - `--ui-button-radius`
  - `--ui-input-radius`
  - `--font-sans`

- File:
  - `apps/booking-engine/src/index.css`

### C) Initial UI normalization in high-traffic pages

- Migrated primary hero/search actions and carousel nav controls to shared `Button` primitive in:
  - `apps/booking-engine/src/pages/FlightHome.tsx`
  - `apps/booking-engine/src/pages/HotelHome.tsx`

## Multitenant Management Model

### Source of truth

- B2B Admin branding endpoint: `/branding/colors`

### Booking-engine runtime behavior

1. Try fetch branding from `/branding/colors`
2. Fallback to local cached branding config
3. Fallback to default theme tokens
4. Apply all theme values to CSS variables at root level

This keeps tenant branding editable from admin without touching booking-engine code.

## Recommended Phase-2 Rollout

### Priority 1 (critical user journeys)

- `PassengerDetails`, `BookingCheckout`, `BookingConfirmation`, `FlightSearch`, `HotelDetail`
- Replace raw action buttons with shared `Button`
- Standardize form controls to `Input`/`Label` primitives

### Priority 2 (account and service screens)

- `Profile`, `AccountSettings`, `Loyalty`, `Notifications`, `BookingManagement`
- Remove one-off color/radius classes from action controls

### Priority 3 (visual governance)

- Add lint rule checks for hard-coded hex colors in booking-engine pages
- Add a small design token usage checklist in PR template
- Add snapshot coverage for button variants/sizes in critical pages

## Definition of Done for Full Standardization

- No hard-coded brand hex values in booking-engine pages
- Primary/secondary/destructive actions mapped only through `Button` variants
- All customer-facing forms use standardized `Input` and `Label`
- Tenant branding from admin updates booking-engine visuals without deployment
- Typecheck and lint pass for workspace
