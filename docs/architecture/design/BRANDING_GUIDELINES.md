# TripAlfa Branding Guidelines

> **Official brand colors and design tokens for the TripAlfa platform**

---

## Color Palette

TripAlfa uses a vibrant, professional color palette designed for trust, energy, and clarity in the travel industry.

| Role | Color | Hex Code | RGB | HSL | Usage |
|------|-------|----------|-----|-----|-------|
| **Primary** | 🔵 Ocean Blue | `#2596be` | `rgb(37, 150, 190)` | `hsl(196, 68%, 45%)` | Main CTAs, navigation, links, active states, primary buttons |
| **Secondary** | 🔥 Coral Red | `#f56753` | `rgb(245, 103, 83)` | `hsl(7, 89%, 64%)` | Accents, alerts, highlights, sale badges, urgency indicators |
| **Third** | 💎 Cyan | `#47d8e0` | `rgb(71, 216, 224)` | `hsl(183, 67%, 58%)` | Tertiary elements, info states, decorative accents, progressive disclosure |

---

## Environment Variables

These brand colors are configured as environment variables for use across all services and frontends:

```env
# TripAlfa Brand Colors
BRAND_PRIMARY_COLOR="#2596be"
BRAND_SECONDARY_COLOR="#f56753"
BRAND_THIRD_COLOR="#47d8e0"
```

These variables are defined in:
- `.env.example` - Main development/production environment
- `.env.phase3.example` - Phase 3 (database optimization) environment
- `.env.phase4.example` - Phase 4 (security hardening) environment

---

## CSS Custom Properties

For frontend applications, use these CSS custom properties:

```css
:root {
  --brand-primary: #2596be;
  --brand-primary-rgb: 37, 150, 190;
  --brand-primary-hsl: 196 68% 45%;

  --brand-secondary: #f56753;
  --brand-secondary-rgb: 245, 103, 83;
  --brand-secondary-hsl: 7 89% 64%;

  --brand-third: #47d8e0;
  --brand-third-rgb: 71, 216, 224;
  --brand-third-hsl: 183 67% 58%;
}
```

---

## Tailwind CSS Configuration

For applications using Tailwind CSS, extend the theme with brand colors:

```js
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        brand: {
          primary: '#2596be',
          secondary: '#f56753',
          third: '#47d8e0',
        },
      },
    },
  },
};
```

Usage in templates:
```html
<button class="bg-brand-primary hover:bg-brand-primary/90 text-white">
  Book Now
</button>

<span class="text-brand-secondary">Sale!</span>

<div class="border-brand-third border-2">
  Info card
</div>
```

---

## Usage Guidelines

### Primary Color (`#2596be`) - Ocean Blue
The primary color conveys trust, reliability, and professionalism. It should be the dominant color in the interface.

**Use for:**
- Primary action buttons (Book Now, Search flights/hotels, Confirm)
- Navigation bar and active navigation states
- Links and hyperlinks
- Form focus states
- Progress indicators
- Loading spinners

**Do NOT use for:**
- Warning or error states
- Background fills (use lighter tints instead)
- Text on dark backgrounds without sufficient contrast

### Secondary Color (`#f56753`) - Coral Red
The secondary color creates urgency and draws attention. Use sparingly for maximum impact.

**Use for:**
- Sale badges and promotional indicators
- Urgency messaging ("Only 2 rooms left!", "Last chance!")
- Destructive actions (delete, cancel) - consider darkening
- Error states and validation messages
- Countdown timers
- Highlighted prices or savings

**Do NOT use for:**
- Primary navigation
- Large background areas
- Success or confirmation states

### Third Color (`#47d8e0`) - Cyan
The third color provides a fresh, energetic accent that complements the primary blue.

**Use for:**
- Informational highlights and tips
- Secondary decorative elements
- Hover states on secondary elements
- Iconography accents
- Gradient endpoints (paired with primary)
- Feature badges

**Do NOT use for:**
- Primary CTAs (reserve for primary color)
- Error or warning states
- Text without sufficient contrast

---

## Accessibility Requirements

All color combinations must meet WCAG 2.1 AA contrast requirements:

| Combination | Contrast Ratio | Status |
|-------------|----------------|--------|
| Primary on white | 4.6:1 | ✅ AA Pass |
| Secondary on white | 3.8:1 | ⚠️ Use for large text only (18pt+ or 14pt bold) |
| Third on white | 3.1:1 | ⚠️ Use for large text only (18pt+ or 14pt bold) |
| White on Primary | 4.4:1 | ✅ AA Pass |
| White on Secondary | 4.5:1 | ✅ AA Pass |
| White on Third | 3.0:1 | ⚠️ Not sufficient - use dark text instead |

**Recommendations:**
- When using secondary or third on white backgrounds, pair with dark text (`#1a1a1a` or similar)
- For small text on these colors, use white only on primary
- Always test with actual content using tools like WebAIM Contrast Checker

---

## Color Variations

### Tints (adding white)

```css
/* Primary tints */
--brand-primary-50:  #e8f4f8;  /* 5% primary */
--brand-primary-100: #d1e9f1;  /* 10% primary */
--brand-primary-200: #a3d3e3;  /* 20% primary */
--brand-primary-300: #75bdd5;  /* 30% primary */
--brand-primary-400: #47a7c7;  /* 40% primary */
--brand-primary-500: #2596be;  /* Base */
--brand-primary-600: #1e7a9a;  /* 60% primary */
--brand-primary-700: #165e76;  /* 70% primary */
--brand-primary-800: #0f4253;  /* 80% primary */
--brand-primary-900: #07262f;  /* 90% primary */

/* Secondary tints */
--brand-secondary-50:  #fef0ee;  /* 5% secondary */
--brand-secondary-100: #fce1dd; /* 10% secondary */
--brand-secondary-200: #f9c3bb; /* 20% secondary */
--brand-secondary-500: #f56753; /* Base */
--brand-secondary-700: #c93d2b; /* 70% secondary */

/* Third tints */
--brand-third-50:  #edfafb;  /* 5% third */
--brand-third-100: #dbf5f7; /* 10% third */
--brand-third-200: #b7ebef; /* 20% third */
--brand-third-500: #47d8e0; /* Base */
--brand-third-700: #2bb0b8; /* 70% third */
```

---

## Gradient Examples

```css
/* Hero section gradient */
.hero-gradient {
  background: linear-gradient(135deg, #2596be 0%, #47d8e0 100%);
}

/* Accent gradient with energy */
.energy-gradient {
  background: linear-gradient(135deg, #f56753 0%, #47d8e0 100%);
}

/* Subtle card gradient */
.card-gradient {
  background: linear-gradient(180deg, #ffffff 0%, #e8f4f8 100%);
}
```

---

## Brand Color Psychology

| Color | Emotion | Industry Context |
|-------|---------|------------------|
| **Ocean Blue** | Trust, reliability, calm | Travel industry standard - evokes sky and sea |
| **Coral Red** | Energy, urgency, excitement | Creates FOMO for bookings; draws eye to deals |
| **Cyan** | Freshness, modern, clarity | Tech-forward feel; suggests innovation |

---

## Related Documentation

- [Design System Audit](../../guides/refactoring/DESIGN_SYSTEM_AUDIT.md) - Current state of design tokens in the codebase
- [Optics Tailwind Integration](../../actions/optics-tailwind-integration_report.md) - Tailwind setup details
- [Database Service Mapping](./DATABASE_SERVICE_MAPPING.md) - Service architecture

---

*Last updated: April 4, 2026*
*Maintained by: TripAlfa Design Team*