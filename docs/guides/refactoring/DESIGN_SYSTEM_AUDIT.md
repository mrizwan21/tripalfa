# TripAlfa Booking Engine - Design System Audit & Standardization

## Current Issues Identified

### 1. HEIGHT INCONSISTENCIES

```text
CURRENT USAGE:
- h-14 (56px) - Being replaced with h-[54px]
- h-12 (48px) - Search components, spinners
- h-10 (40px) - Some buttons
- h-8 (32px) - Remove/add buttons
- h-4, h-3 (16px, 12px) - Icons, small elements
- Custom heights: h-14, w-14, etc.

STANDARD NEEDED:
- Primary Input/Button: h-[54px] (form inputs)
- Secondary Button: h-[44px] (less prominent actions)
- Icon Button: h-[40px] (icon-only buttons)
- Small Button: h-[32px] (tertiary actions)
```

### 2. COLOR INCONSISTENCIES

```text
PRIMARY COLORS BEING USED:
- bg-primary (purple) - Primary CTAs, focus states
- bg-secondary (yellow) - Was used for flight search (WRONG - not
  on Hotel)
- bg-accent (orange) - Hotel search, proper branding color
- bg-foreground/background/card/muted - Various text/container
  colors
- Hardcoded: bg-white, bg-red-50, bg-blue-50, text-white, etc.

PROBLEMS:
1. Flight search was yellow (secondary) - should be orange (accent)
2. No consistent rules for button variants
3. Text colors mixing: text-white, text-foreground, text-primary
4. Border colors: border-gray-200, border-border, border-primary
5. Shadows mixing colors: shadow-yellow-500/20, shadow-purple-200, etc.

STANDARD NEEDED:
- Primary CTA: bg-accent (orange) + text-accent-foreground
- Secondary CTA: bg-card border-border + text-foreground
- Tertiary CTA: bg-muted + text-muted-foreground
- Text: text-foreground (default), text-muted-foreground
  (secondary), text-white (on dark bg)
- Borders: border-border (default), border-primary (focus states)
- Shadows: shadow-lg (default), shadow-xl (elevated)
```

### 3. BUTTON STYLING INCONSISTENCIES

**Examples found:**

```tsx
// INCONSISTENT EXAMPLES:
1. Flight Search (OLD):
   className="w-full h-full bg-[hsl(var(--secondary))] text-white font-bold
              rounded-xl border-2 border-[hsl(var(--secondary))]
              hover:bg-[hsl(var(--secondary)/0.9)]
              shadow-lg shadow-yellow-500/20"

2. Hotel Search (CORRECT):
   className="w-full h-[54px] bg-accent text-accent-foreground shadow-lg"

3. SeatSelection Button:
   className="h-14 px-8 bg-primary text-primary-foreground rounded-2xl
              text-[10px] font-black uppercase tracking-widest
              hover:bg-primary/90 transition-all
              active:scale-95 shadow-lg shadow-purple-100"

4. Ancillary Popup Button:
   className="bg-[hsl(var(--primary))] hover:bg-[hsl(var(--primary)/0.9)]
              text-[hsl(var(--primary-foreground))] px-12 py-6 rounded-[2rem]
              text-xs font-black uppercase tracking-[0.2em] shadow-xl shadow-border"
```

### 4. SPACING/PADDING INCONSISTENCIES

```text
p-3, p-4, p-6, p-8, p-10, p-12 - All used inconsistently
gap-2, gap-3, gap-4 - Mixed spacing
px-4, px-6, px-8, px-10, px-12 - Various horizontal padding
py-2, py-3, py-4, py-6 - Various vertical padding

ISSUE: No consistent spacing pattern or scale
```

### 5. BORDER RADIUS INCONSISTENCIES

```text
rounded-full (full border radius)
rounded-[3rem] (48px)
rounded-[2.5rem] (40px)
rounded-[2rem] (32px)
rounded-xl (12px)
rounded-lg (8px)
rounded-2xl (16px)

ISSUE: Too many breakpoints, inconsistent sizing
```

### 6. FONT SIZE & WEIGHT INCONSISTENCIES

```text
Font Sizes:
- text-sm, text-xs, text-[10px], text-[11px] - Buttons
- text-lg, text-xl, text-3xl - Headings
- No consistent typography scale

Font Weights:
- font-bold, font-black, font-semibold, font-medium - All over
- No hierarchy defined

Letter Spacing:
- tracking-[0.2em], tracking-[0.3em], tracking-widest
- Mixed approaches
```

### 7. SHADOW INCONSISTENCIES

```text
shadow-sm, shadow-lg, shadow-xl, shadow-2xl
shadow-yellow-500/20, shadow-purple-100, shadow-purple-200, shadow-indigo-200

ISSUE: Color-specific shadows tied to component styling
```

---

## STANDARDIZED DESIGN SYSTEM SOLUTION

### SIZE SCALE (Based on 4px base unit)

```text
Spacing: 4, 8, 12, 16, 20, 24, 32, 40, 48, 54, 56, 64px
Heights: 32px (sm), 40px (md), 44px (lg), 54px (xl) ← PRIMARY
Padding: 8, 12, 16, 24px (p-2, p-3, p-4, p-6)
Gaps: 8, 12, 16, 20px (gap-2, gap-3, gap-4, gap-5)
```

### COLOR HIERARCHY

```text
PRIMARY ACTION (Main CTA):
  - bg-accent (orange: #EAB308)
  - text-accent-foreground (white/dark)
  - shadow-lg
  - h-[54px]
  - Example: Hotel/Flight Search button

SECONDARY ACTION (Alternative CTA):
  - bg-card
  - border-2 border-border
  - text-foreground
  - shadow-md
  - h-[44px]
  - Example: Back, Secondary buttons

TERTIARY ACTION (Low priority):
  - bg-muted
  - text-muted-foreground
  - no shadow
  - h-[40px]
  - Example: Cancel, close

TEXT HIERARCHY:
  - Heading 1: text-3xl font-black
  - Heading 2: text-xl font-bold
  - Body: text-base font-medium
  - Label: text-xs font-semibold uppercase
  - Muted: text-muted-foreground

COMMON COLORS:
  - background
  - foreground
  - muted (less prominent)
  - border (dividers, outlines)
  - primary (accent for selected/focus)
```

### BUTTON STANDARDIZATION

```text
PRIMARY BUTTON:
  className="h-[54px] bg-accent text-accent-foreground px-8 rounded-xl
             font-bold shadow-lg hover:bg-accent/90 transition-all
             active:scale-95"

SECONDARY BUTTON:
  className="h-[44px] bg-card border-2 border-border text-foreground
             px-6 rounded-lg font-medium shadow-md hover:bg-muted
             transition-all"

TERTIARY BUTTON:
  className="h-[40px] bg-muted text-muted-foreground px-4 rounded-lg
             font-medium hover:bg-muted/80 transition-all"

INPUT FIELD:
  className="h-[54px] w-full px-4 bg-card border-2 border-border
             rounded-lg text-foreground placeholder:text-muted-foreground
             focus:border-primary focus:bg-background transition-all"
```

### BORDER RADIUS STANDARD

```text
Tiny: rounded-lg (8px) - Small, subtle elements
Small: rounded-xl (12px) - Inputs, buttons, cards
Medium: rounded-2xl (16px) - Modals, important cards
Large: rounded-3xl (24px) - Hero sections, major components
Full: rounded-full - Pills, badges
```

### SPACING SCALE

```text
xs: 4px (gap-1, p-1)
sm: 8px (gap-2, p-2)
md: 12px (gap-3, p-3)
lg: 16px (gap-4, p-4)
xl: 24px (gap-6, p-6)
2xl: 32px (gap-8, p-8)
```

### SHADOW STANDARD

```text
sm: shadow-sm - Subtle elevation
md: shadow-md - Normal elevation (inputs, cards)
lg: shadow-lg - Prominent (buttons, important elements)
xl: shadow-xl - High elevation (modals, popovers)
2xl: shadow-2xl - Highest elevation (full-screen modals)

NO COLOR-SPECIFIC SHADOWS - Use neutral shadows only
```

---

## IMPLEMENTATION PRIORITY

### PHASE 1: CORE COMPONENTS (IMMEDIATE)

1. [ ] Standardize all button styles (Primary, Secondary, Tertiary)
2. [ ] Standardize all input fields (54px height)
3. [ ] Update FlightHome search button (DONE - needs verification)
4. [ ] Update HotelHome search button (DONE - needs verification)
5. [ ] Create reusable Button component with variants
6. [ ] Create reusable Input component with consistent styling

### PHASE 2: PAGE COMPONENTS

1. [ ] BookingCheckout form
2. [ ] PassengerDetails form
3. [ ] HotelSearch filter inputs
4. [ ] Booking management forms

### PHASE 3: MODALS & POPOVERS

1. [ ] AncillaryPopup standardization
2. [ ] SeatSelectionPopup standardization
3. [ ] FareUpsellPopup standardization
4. [ ] All other modal components

### PHASE 4: TYPOGRAPHY & SPACING

1. [ ] Define typography scale
2. [ ] Standardize padding/margins
3. [ ] Update all text elements
4. [ ] Fix spacing in forms

### PHASE 5: FINAL AUDIT

1. [ ] Review all colors
2. [ ] Remove hardcoded colors
3. [ ] Fix all shadows
4. [ ] Border radius consistency

---

## FILES TO UPDATE

### Critical Files (Design System Impact)

1. `tailwind.config.ts` - Add height, spacing scales
2. `components/ui/button.tsx` - Create button variants
3. `components/ui/input.tsx` - Standardize input styling
4. `pages/FlightHome.tsx` - Update button colors (PARTIALLY DONE)
5. `pages/HotelHome.tsx` - Verify color consistency (PARTIALLY DONE)
6. `pages/Home.tsx` - Update input heights/colors (PARTIALLY DONE)

### Component Files (High Priority)

- `pages/FlightSearch.tsx`
- `pages/HotelSearch.tsx`
- `pages/BookingCheckout.tsx`
- `pages/PassengerDetails.tsx`
- `pages/HotelDetail.tsx`
- `components/flight/SeatSelection.tsx`
- `components/AncillaryPopup.tsx`
- `components/FareUpsellPopup.tsx`

---

## TESTING CHECKLIST

After all changes:

- [ ] All buttons are 54px (primary), 44px (secondary), or 40px (tertiary)
- [ ] All CTAs use orange (accent) color
- [ ] All inputs have 54px height
- [ ] All text uses correct color hierarchy
- [ ] No hardcoded colors (white, black, red-50, etc.)
- [ ] All shadows are neutral (no color-specific)
- [ ] All borders use border-border or border-primary
- [ ] Spacing is consistent (8px, 12px, 16px, 24px grid)
- [ ] Border radius follows standard (8px, 12px, 16px, 24px)
- [ ] Typography is consistent (sizes, weights, spacing)

---

## SUCCESS CRITERIA

✅ The booking engine will have:

- Consistent button sizing across all pages
- Unified color palette (orange for primary, blue/purple for secondary)
- Proper height alignment for form elements
- Professional spacing and typography
- No visual inconsistencies
- Professional, cohesive brand appearance
