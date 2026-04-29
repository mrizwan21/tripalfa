# Apple Inspired Design System — B2B Travel Portal

[DESIGN.md](./DESIGN.md) extracted from the public [Apple](https://apple.com/) website. This is not the official design system. Colors, fonts, and spacing may not be 100% accurate. But it's a good starting point for building something similar.

## Design System Files

| File | Description |
| --- | --- |
| `DESIGN.md` | Complete design system documentation (9 sections) |
| `packages/design-tokens/DESIGN.md` | Shared design tokens reference |
| `packages/ui-components/DESIGN.md` | Shared UI components design reference |

Use [DESIGN.md](./DESIGN.md) as a reference for AI agents (Claude, Cursor, Stitch) to generate UI that looks like the Apple design language.

## Preview

A sample landing page built with DESIGN.md. It shows the actual colors, typography, buttons, cards, spacing, and elevation, all in one page.

### Dark Mode

![Apple Design System — Dark Mode](https://pub-2e4ecbcbc9b24e7b93f1a6ab5b2bc71f.r2.dev/designs/apple/preview-dark-screenshot.png)

### Light Mode

![Apple Design System — Light Mode](https://pub-2e4ecbcbc9b24e7b93f1a6ab5b2bc71f.r2.dev/designs/apple/preview-screenshot.png)

## Tech Stack

This project is built with:

- **React 19** + **TypeScript** + **Vite 8**
- **Tailwind CSS 3** for utility-first styling
- **Radix UI** primitives (Dialog, Dropdown, Select, Tabs, Tooltip)
- **Lucide React** for icons
- **React Router v7** for navigation
- **TanStack React Query** for data fetching
- **date-fns** for date utilities

## Development

```bash
pnpm install
pnpm --filter b2b-portal dev
```

## Design Standards

See [design tokens](../../packages/design-tokens/DESIGN.md) and [UI components](../../packages/ui-components/DESIGN.md) for shared design references used across the B2B portal.
