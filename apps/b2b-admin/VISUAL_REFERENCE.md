# Modern Dashboard - Visual Reference & Examples

## 🎨 Visual Component Gallery

This document provides visual references and code examples for all major components in the modern design system.

---

## 1. BUTTONS

### Primary Button
```
┌─────────────────────────────┐
│  Button Label   [Icon]      │  ← Hover: lift effect + shadow
└─────────────────────────────┘

Colors: Blue(#3B82F6) → Purple(#A855F7) gradient
Dimensions: 44px height (md), 16px horizontal padding
Hover: shadow-lg, translate-y[-2px]
```

**Code**:
```typescript
<Button variant="primary" size="md" iconBefore={<PlusIcon />}>
  Create New
</Button>
```

### Secondary Button
```
┌─────────────────────────────┐
│      Button Label           │
└─────────────────────────────┘

Background: Slate-200 (light) / Slate-700 (dark)
Text: Slate-900 (light) / White (dark)
Animate on hover: fade to darker shade
```

### Outline Button
```
┌ - - - - - - - - - - - - - - ┐
│      Button Label           │
└ - - - - - - - - - - - - - ─ ┘

Border: 2px Blue
Text: Blue
Background: Transparent
Hover: light blue background
```

### States

```
Default:     ┌──────────────┐
             │   Regular    │
             └──────────────┘

Hover:       ┌──────────────┐
             │   Elevated   │ ← shadow-lg
             └──────────────┘

Active:      ┌──────────────┐
             │[Pressed]     │ ← ring-2 visible
             └──────────────┘

Loading:     ┌──────────────┐
             │ ⟳ Saving...  │
             └──────────────┘

Disabled:    ┌──────────────┐
             │   Grayed     │ ← opacity: 50%
             └──────────────┘
```

---

## 2. CARDS

### Default Card
```
╔════════════════════════════════════════╗
║                                        ║
║  Card Title                            ║
║  ───────────────                       ║
║  Card content goes here...             ║
║  More content...                       ║
║                                        ║
╚════════════════════════════════════════╝

Background: White (light) / Slate-900 (dark)
Border: 1px slate-200 (light) / slate-700 (dark)
Radius: 12px (rounded-xl)
Shadow: soft shadow
```

### Gradient Card
```
╔════════════════════════════════════════╗
║ ┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓   ║
║ ┃ Highlighted Content            ┃   ║
║ ┃ Blue → Purple gradient blend   ┃   ║
║ ┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┛   ║
║                                        ║
╚════════════════════════════════════════╝

Background: Gradient (blue/purple at 10% opacity)
Border: 1px colored
Hover: shadow-lg
```

### Glass Card (Glassmorphism)
```
                    ✨ Frosted glass effect
╭────────────────────────────────────────╮
│⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀│
│⌀  Frosted Glass Content        ⌀│
│⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀⌀│
╰────────────────────────────────────────╯

Background: rgba(255,255,255,0.7)
Blur: 12px backdrop filter
Border: 1px white/20
Tech: CSS backdrop-filter
```

---

## 3. METRIC CARD

```
╔════════════════════════════════════════╗
║  ┌──────────┐                          ║
║  │    📈    │  Total Revenue           ║
║  └──────────┘  ▲ 12.5%                 ║
║                                        ║
║              $45,231                   ║
║                                        ║
║  Details below card...                 ║
╚════════════════════════════════════════╝

Icon: Colored background with scale on hover
Title: Small gray text (14px)
Value: Large bold (30px)
Change: ▲ Green (increase) / ▼ Red (decrease)
```

**Code**:
```typescript
<MetricCard
  icon={<TrendingUpIcon />}
  title="Total Revenue"
  value="$45,231"
  change={{ value: 12.5, type: 'increase' }}
  color="green"
/>
```

---

## 4. STATUS BADGES

### Success Badge
```
┌─────────────────────────┐
│ ✓ Active                │ ← Green background
└─────────────────────────┘

Background: rgba(16, 185, 129, 0.1) [Green at 10%]
Border: 1px Green-200 (light) / Green-900 (dark)
Text: Green-700 (light) / Green-400 (dark)
```

### Warning Badge
```
┌─────────────────────────┐
│ ⚠ Pending               │ ← Yellow background
└─────────────────────────┘

Background: rgba(251, 191, 36, 0.1) [Yellow at 10%]
Border: 1px Yellow-200 (light) / Yellow-900 (dark)
Text: Yellow-700 (light) / Yellow-400 (dark)
```

### Error Badge
```
┌─────────────────────────┐
│ ✕ Failed                │ ← Red background
└─────────────────────────┘

Background: rgba(239, 68, 68, 0.1) [Red at 10%]
Border: 1px Red-200 (light) / Red-900 (dark)
Text: Red-700 (light) / Red-400 (dark)
```

---

## 5. INPUT FIELDS

### Default Input
```
┌────────────────────────────────────────┐
│ Enter your text here...                │
└────────────────────────────────────────┘

Background: Slate-50 (light) / Slate-800 (dark)
Border: 1px Slate-300 (light) / Slate-600 (dark)
Height: 40px (md size)
Padding: 12px horizontal
Radius: 8px
```

### Focused Input
```
┌────────────────────────────────────────┐
│ Enter your text here...                │  ← Glow effect
├────────────────────────────────────────┤   Ring: 2px blue
│ ✓ Focus ring visible                   │
└────────────────────────────────────────┘

Ring: 2px Blue at 50% opacity
Box-shadow: blue glow effect
Border: Blue-500
```

### Error Input
```
┌────────────────────────────────────────┐
│ ✗ Invalid input                        │
└────────────────────────────────────────┘
  ! This field is required

Border: 2px Red
Ring: Red focus ring
Text: Red error message
```

---

## 6. GRID LAYOUTS

### Responsive Grid - 3 Columns

```
Mobile (< 640px):
┌──────────────────┐
│   Card 1         │
└──────────────────┘
┌──────────────────┐
│   Card 2         │
└──────────────────┘
┌──────────────────┐
│   Card 3         │
└──────────────────┘

Tablet (640px - 1024px):
┌──────────────────┐ ┌──────────────────┐
│   Card 1         │ │   Card 2         │
└──────────────────┘ └──────────────────┘
┌──────────────────┐
│   Card 3         │
└──────────────────┘

Desktop (1024px+):
┌────────────┐ ┌────────────┐ ┌────────────┐
│  Card 1    │ │  Card 2    │ │  Card 3    │
└────────────┘ └────────────┘ └────────────┘
```

**Code**:
```typescript
<div className="
  grid gap-4
  grid-cols-1
  sm:grid-cols-2
  lg:grid-cols-3
">
  <Card>Card 1</Card>
  <Card>Card 2</Card>
  <Card>Card 3</Card>
</div>
```

---

## 7. DATA TABLE

```
┌─────────────────────────────────────────────────────────┐
│ ┌──────┬─────────┬──────────┬──────────┬────────────┐   │
│ │ ☐ ID │ Name    │ Email    │ Status   │ Action     │   │
│ ├──────┼─────────┼──────────┼──────────┼────────────┤   │
│ │ ☐ 1  │ John    │ john@... │ ✓Active  │ ⋯          │   │
│ ├──────┼─────────┼──────────┼──────────┼────────────┤   │
│ │ ☐ 2  │ Jane    │ jane@... │ ⊘Pending │ ⋯          │   │
│ ├──────┼─────────┼──────────┼──────────┼────────────┤   │
│ │ ☐ 3  │ Bob     │ bob@...  │ ✕Error   │ ⋯          │   │
│ └──────┴─────────┴──────────┴──────────┴────────────┘   │
└─────────────────────────────────────────────────────────┘

Header: Dark background, bold text
Rows: Alternating hover effect
Borders: Subtle 1px separators
Status: Color-coded badges
```

---

## 8. MODAL/DIALOG

```
                    ┌──────────────────────────────┐
                    │           ✕                  │
    ┌───────────────┤ Dialog Title                 ├────────┐
    │               ├──────────────────────────────┤        │
    │ ░░░░░░░░░░░░░░│                              │░░░░░░░░│
    │ ░░Modal Content│  Dialog content goes here   │░░░░░░░░│
    │ ░░░░░░░░░░░░░░│  More text...                │░░░░░░░░│
    │               ├──────────────────────────────┤        │
    │  [Cancel]   [Confirm]                        │        │
    └───────────────┴──────────────────────────────┴────────┘
    
    Backdrop: rgba(0,0,0,0.5) blur behind
    Modal: Centered, shadow-lg
    Z-index: modal (1060)
```

---

## 9. DASHBOARD LAYOUT

```
╔════════════════════════════════════════════════════════════════════╗
║ ☰  Logo  [Search...]  🔔  👤  🌙  [Account ▼]                      ║
╠════════════════════════════════════════════════════════════════════╣
║                                                                    ║
║ ┌──────────┐ ┌──────────────────────────────────────────────────  ║
║ │ Dashboard│ │ Heading                                 [Filters] │ ║
║ │ Rules    │ ├───────────────────────────────────────────────────┤ ║
║ │ Monitoring│ │                                                  │ ║
║ │ Settings │ │ ┌──────┐ ┌──────┐ ┌──────┐ ┌──────┐             │ ║
║ │ Logout   │ │ │Card 1│ │Card 2│ │Card 3│ │Card 4│             │ ║
║ │          │ │ └──────┘ └──────┘ └──────┘ └──────┘             │ ║
║ │          │ │                                                  │ ║
║ │          │ │ ┌────────────────────────────────────────────┐   │ ║
║ │          │ │ │ Table or Chart Content                    │   │ ║
║ │          │ │ └────────────────────────────────────────────┘   │ ║
║ │          │ │                                                  │ ║
║ └──────────┘ └──────────────────────────────────────────────────┘ ║
╚════════════════════════════════════════════════════════════════════╝

Sidebar: 250px (collapsible to 60px)
Header: 64px height, sticky
Content: Flexible remainder
Navigation: Light background hover
Active: Blue highlight + icon
```

---

## 10. ANIMATIONS

### Fade In
```
Time: 300ms
Curve: ease-out

Frame 0:   █░░░░░░░ (opacity: 0%)
Frame 50:  ████████░ (opacity: 50%)
Frame 100: ████████ (opacity: 100%)
```

### Scale In
```
Time: 300ms
Curve: ease-out

Frame 0:   ░ (scale: 95%, opacity: 0%)
Frame 50:  ░░░░░ (scale: 97.5%, opacity: 50%)
Frame 100: ████ (scale: 100%, opacity: 100%)
```

### Slide Up
```
Time: 500ms
Curve: ease-out

Frame 0:   ↓████ (translateY: 16px, opacity: 0%)
Frame 50:  ↑░░░░ (translateY: 8px, opacity: 50%)
Frame 100: ────► (translateY: 0px, opacity: 100%)
```

### Hover Lift (Button)
```
Default:      [Button] (shadow: sm)
Hover:        [Button] ↑ (shadow: lg, translateY: -2px)
Duration:     300ms
Easing:       ease-out
```

---

## 11. COLOR USAGE GUIDE

### Context-Based Colors

**Data Visualization**:
```
Primary Series:   Blue (#3B82F6)
Secondary Series: Purple (#A855F7)
Accent Series:    Teal/Emerald
Background:       Light gray (#F8FAFC)
```

**Status Indicators**:
```
✓ Success:  Green (#10B981)
⚠ Warning: Yellow (#FBBF24)
✕ Error:    Red (#EF4444)
ⓘ Info:     Blue (#3B82F6)
```

**Interactive Elements**:
```
Default:  Blue (#3B82F6)
Hover:    Dark Blue (#2563EB)
Active:   Even Darker Blue (#1D4ED8)
Disabled: Gray (#94A3B8)
```

---

## 12. DARK MODE COMPARISON

### Light Mode
```
Background: White (#FFFFFF)
Text:       Dark gray (#0F172A)
Borders:    Light gray (#E2E8F0)
Cards:      White (#FFFFFF)
Icons:      Blue (#3B82F6)
```

### Dark Mode
```
Background: Dark blue (#0F172A)
Text:       Light gray (#F8FAFC)
Borders:    Dark gray (#334155)
Cards:      Dark slate (#1E293B)
Icons:      Light blue (#0EA5E9)
```

**Toggle Effect**:
```
User clicks 🌙/☀️
  ↓
JavaScript: toggle 'dark' class on <html>
  ↓
CSS: dark: prefix rules activate
  ↓
All colors update instantly
  ↓
Preference saved to localStorage
```

---

## 13. RESPONSIVE BREAKPOINTS

```
Mobile (0px - 640px):
┌────────────────────┐
│  Mobile Layout     │ ← Single column
│  Stack cards       │   Smaller text
│  Large touch area  │   Hamburger menu
└────────────────────┘

Tablet (640px - 1024px):
┌─────────────────────────────────┐
│  Tablet Layout                  │ ← Two columns
│  ┌────────────┐ ┌────────────┐  │   Medium text
│  │            │ │            │  │   Flexible menu
│  └────────────┘ └────────────┘  │
└─────────────────────────────────┘

Desktop (1024px+):
┌─────────────────────────────────────────────────────┐
│  Desktop Layout                                     │
│  ┌────────────┐ ┌────────────┐ ┌────────────┐     │ ← Three+ columns
│  │            │ │            │ │            │     │   Optimal text
│  └────────────┘ └────────────┘ └────────────┘     │   Full menu
└─────────────────────────────────────────────────────┘
```

---

## 14. ACCESSIBILITY FOCUS STATES

### Keyboard Focus Ring
```
┌────────────────────────────┐
│  [Button with focus↔]      │ ← Ring: 2px blue
└────────────────────────────┘
 ↓
outline: none (removed)
ring: 2px (added)
ring-offset: small gap
color: Blue (#3B82F6)
```

### Tab Navigation Order
```
1. Logo
   ↓
2. Search input
   ↓
3. Notification icon
   ↓
4. Profile menu
   ↓
5. Sidebar items
   ↓
6. Main content
   ↓
...and so on
```

---

## 15. LOADING STATES

### Skeleton Loader
```
┌────────────────────────────────────┐
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │ ← Shimmer animation
│                                    │
│ ▓░░░░░ ░░░░░░░░░░░░░░░░░░░░░░░░░░ │
│ ░░░░░░░░░░░░░░░░░░                 │
│                                    │
│ ▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │
└────────────────────────────────────┘

Animation: wave effect left to right
Duration: 2s, infinite
Easing: linear
```

### Spinner
```
        ⟳
      ⟲   ⟳
    ⟲       ⟳
      ⟳   ⟲
        ⟲

Animation: rotate 360° continuously
Duration: 1s per rotation
Easing: linear
Size: Available in xs, sm, md, lg, xl
```

---

## Summary

This visual reference provides quick lookups for:
- Component layouts and dimensions
- Color applications
- Interactive states
- Responsive behavior
- Animation specifications
- Accessibility considerations

**Use this guide alongside the code examples in the documentation!**

---

**Last Updated**: 2024
**Design System Version**: 1.0.0
**Status**: ✅ Complete & Production Ready
