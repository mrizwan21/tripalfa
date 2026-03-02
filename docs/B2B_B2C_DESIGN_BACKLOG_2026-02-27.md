# B2B & B2C Design Consistency Backlog

Date: 2026-02-27

## Purpose

This backlog tracks **remaining design consistency work** after hardcoded
color/style debt cleanup. Items listed here are mostly dynamic/runtime or
framework-mixing concerns (not hardcoded hex debt).

## Priority Levels

- P1: High impact on design-system consistency
- P2: Medium impact; safe incremental refactors
- P3: Low impact / optional polish

## Backlog

### P1 — Framework Consistency (B2B)

1. `apps/b2b-admin/src/pages/SystemMonitoring.tsx`
   - Uses Material UI components (`@mui/material`) and extensive `sx` styling
     while most B2B UI uses Tailwind + shared UI components.
   - Recommendation: migrate to shared component primitives and Tailwind
     utilities, or isolate this page behind a clearly documented MUI boundary.

### P2 — Dynamic Inline Style Consolidation

1. `apps/booking-engine/src/components/ui/accordion.tsx`
   - Dynamic `maxHeight` style is intentional (animation/layout measurement).
   - Recommendation: keep as-is or move to CSS variable-based transition helper
     for consistency.

2. `apps/booking-engine/src/pages/FlightHome.tsx`
   - Hero background image uses runtime `backgroundImage` binding from constant
     URL.
   - Recommendation: keep if runtime image swap is desired; otherwise move to
     CSS class token.

3. `apps/booking-engine/src/pages/HotelHome.tsx`
   - Hero background image uses runtime `backgroundImage` binding from constant
     URL.
   - Recommendation: same as FlightHome.

4. `apps/b2b-admin/src/features/marketing/pages/BrandingSettings.tsx`
   - Remaining inline styles are form-driven dynamic HSL preview swatches.
   - Recommendation: keep for live preview behavior; optionally wrap in preview
     helper components to reduce style object repetition.

### P3 — Optional Refactors

1. Progress bar width styles across B2B/B2C
   (`style={{ width: \`${x}%\` }}` patterns)
   - Dynamic widths are expected and acceptable.
   - Optional: standardize via reusable progress bar component.

2. Mixed dashboard chart tooltip styles in B2B overview
   - Dynamic tooltip marker color is chart-library driven and acceptable.
   - Optional: centralize tooltip renderer and marker style helper.

## Out of Scope (Already Completed)

- Hardcoded hex color removal in active B2B/B2C implementation files.
- Replacement of static inline color literals with tokens/utilities where safe.
- Typecheck and Codacy validation for edited files.
