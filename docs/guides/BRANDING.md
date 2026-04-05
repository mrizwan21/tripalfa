# TripAlfa Branding Guide

## Overview

This document outlines the official TripAlfa brand colors and how they're applied throughout the booking engine.

## Official Brand Colors

| Color Name | Hex Code | HSL Value | Usage |
|------------|---------|-----------|--------|
| Primary | `#2596be` | `190 67% 44.5%` | Main CTAs, links, headers |
| Secondary | `#f56753` | `6 86% 64%` | Accent buttons, highlights |
| Third/Accent | `#47d8e0` | `183 72% 58%` | Decorative elements |

## Where Colors Are Defined

### 1. Environment Variables (`.env`)

```
BRAND_PRIMARY=#2596be
BRAND_PRIMARY_HSL=190 67% 44.5%
BRAND_SECONDARY=#f56753
BRAND_SECONDARY_HSL=6 86% 64%
BRAND_THIRD=#47d8e0
BRAND_THIRD_HSL=183 72% 58%
```

### 2. Design Tokens (`packages/ui-components/design-tokens.css`)

```css
:root {
  --brand-primary: 190 67% 44.5%;
  --brand-secondary: 6 86% 64%;
  --brand-accent: 183 72% 58%;
}
```

### 3. Branding Provider (`packages/ui-components/providers/branding-provider.tsx`)

```typescript
const defaultBranding = {
  colors: {
    primary: "190 67% 44.5%",
    secondary: "6 86% 64%",
    accent: "183 72% 58%",
  },
};
```

### 4. Tenant Branding (`apps/booking-engine/src/lib/tenantBranding.ts`)

```typescript
const DEFAULT_BRANDING = {
  primaryColor: '190 67% 44.5%',
  secondaryColor: '6 86% 64%',
  accentColor: '183 72% 58%',
};
```

## How to Use Brand Colors

### In CSS

Use the CSS custom properties:

```css
.button {
  background: hsl(var(--brand-primary));
  color: hsl(var(--brand-primary-foreground));
}

.accent {
  background: hsl(var(--brand-secondary));
}
```

### In Tailwind CSS

Use the semantic color utilities:

```tsx
// Primary button
<button className="bg-primary text-primary-foreground">Click Me</button>

// Secondary/accent button
<button className="bg-secondary text-secondary-foreground">Subscribe</button>

// Brand-specific utilities
<div className="bg-brand-primary">Brand Color</div>
<div className="bg-brand-secondary">Accent Color</div>
```

### In JS/TSX

Access via the tenant runtime:

```typescript
import { useTenantRuntime } from '@/components/providers/TenantRuntimeProvider';

function MyComponent() {
  const { branding } = useTenantRuntime();
  
  return (
    <div style={{ 
      backgroundColor: `hsl(${branding.primaryColor})` 
    }}>
      Content
    </div>
  );
}
```

## Color Architecture

```
[Design Tokens] → [Tailwind Config] → [Components]
       ↓
[Tenant Branding API] (overrides defaults)
       ↓
[Runtime CSS Variables] (applied to :root)
```

1. **Design Tokens** (`design-tokens.css`) provide the baseline brand colors
2. **Tailwind Config** exposes brand colors as utility classes (`bg-brand-primary`)
3. **Tenant Branding API** allows runtime overrides per tenant
4. **Runtime CSS Variables** are applied to the document root

## Whitelabel Support

The branding system supports per-tenant customization:

1. Admin can configure branding via B2B Admin panel
2. Colors are stored in database and fetched via API
3. Fallback to TripAlfa defaults if no custom config

## Component Color Guidelines

| Component Type | Recommended Color |
|---------------|------------------|
| Primary CTA | `--brand-primary` |
| Secondary CTA | `--brand-secondary` |
| Links | `--brand-primary` |
| Accents | `--brand-accent` |
| Success states | `--success` |
| Error states | `--destructive` |
| Warnings | `--warning` |
| Info | `--info` |
