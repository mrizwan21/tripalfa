# Copilot / AI agent instructions for TripAlfa

Concise, repo-specific guidance to get an AI coding agent productive quickly.

Overview

- Monorepo using pnpm workspaces. Key roots: `apps/`, `packages/`, `tools/scripts/`, `infrastructure/`.
- Frontends: Vite + React across all active frontend apps.
- Backends: Express + TypeScript services under `packages/` (see `packages/booking-service` for a canonical example).

Essential workflows (concrete commands)

- Install all workspaces: `pnpm install` (run at repo root).
- Start development (root): `pnpm run dev`.
- Start a single workspace: `pnpm --filter booking-engine dev` or `pnpm --filter @tripalfa/booking-service dev`.
- Prisma lifecycle (run from repo root):
  - `pnpm run db:migrate` then `pnpm run db:generate`
  - `pnpm run db:push` for non-destructive schema pushes
- Workspace checks: `pnpm -r build` and `pnpm -r --if-present test`.

Project conventions and patterns (practical points)

- Shared code: prefer packages in `packages/*` (eg `shared-types`, `shared-utils`) for cross-service types and helpers.
- Curated operational scripts live in `tools/scripts/`.
- Keep workspace dependency changes minimal: add deps to the smallest affected workspace, not root, unless intentionally shared.
- Code style: `prettier`, `eslint`, `husky`, `lint-staged` are configured at the root; run `pnpm run lint` and `pnpm run format` when editing.

Integration points and external systems

- Database: PostgreSQL managed via Prisma under `packages/shared-database/prisma`.
- API Gateway policy/config lives in `infrastructure/wicked-config`.
- External integrations are routed through backend packages and API Manager (Kong/Wicked).

What to check before making changes

- Files: `package.json`, `packages/shared-database/prisma`, `tools/scripts/`, and the package you plan to change (e.g., `packages/booking-service`).
- Verify TypeScript and build status:
  - `npx tsc -p tsconfig.json --noEmit`
  - `pnpm run build`
  - `pnpm -r --if-present test`

Editing rules for AI agents (must-follow)

- Make small, focused edits. Avoid large refactors without maintainer sign-off.
- After making edits run root checks: `npx tsc -p tsconfig.json --noEmit`, `pnpm run lint`, `pnpm run build`.
- If you add or modify workspace dependencies, run `pnpm install` and request a security scan (see repo policies).
- Ask for missing example environment files before changing anything that depends on secrets or external APIs.

Key files to reference

- `package.json` (root) - workspaces and scripts
- `docs/README.md` - project documentation entrypoint
- `packages/shared-database/prisma` - schema and migrations
- `tools/scripts/` - curated automation scripts
- `packages/booking-service` - canonical backend service example

If anything is unclear, ask the maintainers which workspace to prioritize or request sample `.env` files and run credentials.
