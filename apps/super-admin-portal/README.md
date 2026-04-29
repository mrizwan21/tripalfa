# Super Admin Portal

Super Admin Portal is the platform administration frontend for governance, configuration, and cross-tenant controls.

## Tech stack

- React + TypeScript + Vite
- Shared components/features from workspace packages

## Run locally

From repo root:

```bash
pnpm --filter super-admin-portal dev
```

## Build

```bash
pnpm --filter super-admin-portal build
```

## Architecture notes

- Frontend app only; backend runtime is package-based under `packages/*`.
- APIs should be consumed through API Manager (Kong/Wicked).
