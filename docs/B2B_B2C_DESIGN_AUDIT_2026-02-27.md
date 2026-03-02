# B2B & B2C Design Audit and Hardcode Removal

Date: 2026-02-27

## Scope

- B2B app: `apps/b2b-admin/src/**`
- B2C app: `apps/booking-engine/src/**`
- Objective: remove hardcoded design/color values in implementation code, align with tokens/utilities, and verify compile/static quality.

## What Was Audited

- Tailwind arbitrary hex classes (e.g., `bg-[#...]`, `from-[#...]`)
- Raw hex literals in TS/TSX/CSS
- Inline style literals that can be moved to classes/tokens
- Repeated hardcoded visual constants (hero URLs, fixed style values)

## Completed Remediations

### Cross-App Hardcode Cleanup

- Replaced hardcoded hex color literals with token-compatible forms (`rgb(...)`, token references, or semantic utility classes).
- Normalized style constants in active implementation files.

### B2B (b2b-admin)

- Removed/normalized hardcoded color literals across shared layout and feature pages.
- Updated style/token/config sources:
  - `src/shared/styles/index.css`
  - `src/styles/global.css`
  - `src/theme/tokens.ts`
  - `tailwind.config.ts`
- Removed literal inline padding and static token-color inline styles in branding preview (moved to utility classes where possible).
- Toaster style in layout aligned with design tokens (`--card`, `--border`, `--radius`, `--shadow-md`).

### B2C (booking-engine)

- Updated booking-engine theme constants to non-hex color values.
- Removed inline full-size map styles in map components by using utility classes (`w-full h-full`).
- Replaced inline animation delay with utility/arbitrary class syntax.
- Removed hardcoded accordion max-height literal (`2000px`) and switched to measured height.
- Centralized hero image URLs in page-level constants instead of inlined URL literals.

## Verification Performed

- Codacy CLI analysis run per edited file (ESLint/Semgrep/Trivy).
- Typecheck passed for:
  - `apps/b2b-admin`
  - `apps/booking-engine`

## Current Residual Matches (Reviewed)

Residual `#...` grep hits in app sources are false positives or non-color content, including:

- Booking/reference IDs (e.g., `#12345`, `#892`)
- HTML entities (`&#039;`, `&#123;`)

No active hardcoded hex color usage remains in implementation files within audited B2B/B2C app source.

## Notes on Intentional Dynamic Inline Styles

Some inline styles remain by design where values are dynamic/runtime-driven and cannot be statically represented via utility classes without behavior loss. Current intentional examples:

- Branding live preview swatches using form-driven HSL values in `BrandingSettings.tsx`
- Hero background images injected via constants in `FlightHome.tsx` and `HotelHome.tsx`
- Accordion content `maxHeight` using measured runtime height in `accordion.tsx`

These are intentional and not hardcoded design debt.
