# Optics-to-Tailwind Integration Report

**Date:** 2026-02-04  
**Status:** Phase 1 Complete — Design Token Infrastructure Ready

---

## What Was Done

### 1. Dependency Cleanup

| Package | Removed | Reason |
|---------|---------|--------|
| `apps/booking-engine/package.json` | `@headlessui/react` | Zero usage in source; Radix/Shadcn provides same primitives |
| `apps/booking-engine/package.json` | `@shadcn/ui` | CLI-only package, not needed at runtime |
| `apps/booking-engine/package.json` | `lucide-animated` | Zero usage; Framer Motion + lucide-react covers all icon needs |
| `apps/b2b-admin/package.json` | `lucide-animated` | Zero usage in source |
| `packages/ui-components/package.json` | `lucide-animated` (peer + dep) | Zero usage in source |
| `packages/ui-components/ui/` folder | Deleted entirely | Orphaned dead code — not exported from package index |

**Result:** 31 packages removed from lockfile; dependency tree reduced.

### 2. CSS Design Token Architecture

Three new CSS files created in `packages/ui-components/`:

| File | Purpose | Import Order |
|------|---------|-------------|
| `optics-raw-tokens.css` | Extracted Optics design primitives (color channels, spacing, radius, shadows, z-index) without component CSS | 1st — raw primitives |
| `design-tokens.css` (existing) | TripAlfa semantic design tokens (brand, destructive, success, warning, etc.) — whitelabel-ready | 2nd — semantic names |
| `optics-tripalfa-bridge.css` | Maps Optics tokens to TripAlfa semantic names, enabling seamless transition from Optics CSS to Tailwind | 3rd — bridge layer |

### 3. Package Exports Updated

`@tripalfa/ui-components` now exports:

```json
"./design-tokens.css": "./design-tokens.css",
"./optics-raw-tokens.css": "./optics-raw-tokens.css",
"./optics-tripalfa-bridge.css": "./optics-tripalfa-bridge.css"
```

### 4. b2b-admin CSS Integration

Created `apps/b2b-admin/src/index.css` with:
- Shared design tokens import
- Shadcn-compatible CSS variable mapping
- Light/dark mode support
- Fallback values for all variables

---

## Architecture Diagram

```
@rolemodel/optics (reference)
       │
       ▼ (extracted primitives only)
optics-raw-tokens.css  ──►  ~2KB (vs 174KB full Optics CSS)
       │
       ▼ (maps to semantic names)
design-tokens.css  ──►  TripAlfa brand tokens (whitelabel-ready)
       │
       ▼ (bridge for future migration)
optics-tripalfa-bridge.css  ──►  Maps Optics → TripAlfa names
       │
       ▼
Tailwind CSS (via @import "tailwindcss")
       │
       ▼
Shadcn components (via components.json → @/components/optics)
```

---

## Performance Impact

| Metric | Before | After (projected) |
|--------|--------|-------------------|
| Design token CSS | 174 KB (full Optics) | ~2 KB (raw tokens only) |
| CSS reset | Dual (Tailwind Preflight + Optics modern-css-reset) | Single (Tailwind only) |
| Bundle tree-shaking | N/A (raw CSS imports) | Tailwind JIT ships only used classes |
| Estimated CSS reduction | — | 90%+ (174KB → ~5-15KB critical CSS) |

---

## Next Steps (Phase 2)

1. **Import shared tokens in both apps' entry CSS files:**
   ```css
   @import "@tripalfa/ui-components/optics-raw-tokens.css";
   @import "@tripalfa/ui-components/design-tokens.css";
   ```

2. **Migrate Optics component CSS classes to Tailwind utilities:**
   - `btn btn--primary` → `inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-primary-foreground font-medium`
   - Existing Shadcn patterns already follow this

3. **Remove Optics component CSS imports:**
   - Remove `@import 'components'` from optics.css
   - Replace with Tailwind utility classes in components

4. **Disable Tailwind Preflight for Optics compatibility:**
   If keeping Optics component styles temporarily:
   ```js
   corePlugins: { preflight: false }
   ```

5. **Visual regression testing after each component migration**

---

## Token Mapping Quick Reference

| Optics Token | TripAlfa Semantic | Tailwind Utility |
|-------------|-------------------|-----------------|
| `--op-color-primary-h/s/l` | `--brand-primary` | `bg-primary`, `text-primary` |
| `--op-color-alerts-danger-h/s/l` | `--destructive` | `bg-destructive`, `text-destructive` |
| `--op-color-neutral-plus-five` | `--border` | `border`, `border-border` |
| `--op-radius-medium` | `--radius` | `rounded-md` |
| `--op-radius-large` | `--radius-lg` | `rounded-lg` |
| `--op-space-medium` | `--space-4` | `p-4`, `gap-4` |
| `--op-shadow-medium` | `--shadow-lg` | `shadow-lg` |
| `--op-z-index-header` | `--z-dropdown` | `- z-500` |

---

## Files Modified

| File | Change |
|------|--------|
| `apps/booking-engine/package.json` | Removed 3 unused dependencies |
| `apps/b2b-admin/package.json` | Removed 1 unused dependency |
| `apps/b2b-admin/src/index.css` | Created — shared tokens + Shadcn variables |
| `packages/ui-components/package.json` | Added 3 new CSS exports, removed lucide-animated |
| `packages/ui-components/design-tokens.css` | Existing — TripAlfa semantic tokens |
| `packages/ui-components/optics-raw-tokens.css` | Created — extracted Optics primitives |
| `packages/ui-components/optics-tripalfa-bridge.css` | Created — maps Optics → TripAlfa |
| `packages/ui-components/ui/` | Deleted — orphaned dead code |