# Call Center Portal

Call Center Portal is the agent-facing frontend app for assisted booking and operational workflows.

## Tech stack

- React + TypeScript + Vite
- Shared UI and feature modules from workspace packages

## Run locally

From repo root:

```bash
pnpm --filter call-center-portal dev
```

## Build

```bash
pnpm --filter call-center-portal build
```

## Architecture notes

- Frontend app only; backend runtime lives in `packages/*`.
- API requests should be routed through API Manager (Kong/Wicked).
