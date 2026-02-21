# Copilot / AI agent instructions for TripAlfa

Concise, repo-specific guidance to get an AI coding agent productive quickly.

Overview
- Monorepo using npm workspaces. Key roots: `apps/`, `services/`, `packages/`, `database/prisma`.
- Frontends: Vite + React (e.g., `apps/booking-engine`), Next.js for the B2B admin path.
- Backends: Express + TypeScript services under `services/` (see `services/booking-service` for a canonical example).

Essential workflows (concrete commands)
- Install all workspaces: `npm install` (run at repo root).
- Start development (root): `npm run dev` (composes `api-gateway` + `booking-engine` by default).
- Start a single workspace: `npm run dev --workspace=@tripalfa/booking-engine` or `--workspace=@tripalfa/booking-service`.
- Prisma lifecycle (run from repo root):
  - `npm run db:migrate` then `npm run db:generate`
  - `npm run db:push` for non-destructive schema pushes
- API integration tests (ts-node scripts): `npm run test:api` and specific targets like `npm run test:api:innstant`.

Project conventions and patterns (practical points)
- Shared code: prefer packages in `packages/*` (eg `shared-types`, `shared-utils`) for cross-service types and helpers.
- One-off scripts and integration test harnesses live in `scripts/infra/` (use `ts-node` locally to run them).
- Keep workspace dependency changes minimal: add deps to the smallest affected workspace, not root, unless intentionally shared.
- Code style: `prettier`, `eslint`, `husky`, `lint-staged` are configured at the root; run `npm run lint` and `npm run format` when editing.

Integration points and external systems
- Database: PostgreSQL managed via Prisma under `database/prisma` (migrations + client generation live here).
- API Gateway: central routing/auth (check `services/api-gateway`).
- External integrations: Innstant, Duffel, Amadeus — tested via `scripts/test-*.ts` scripts; consult `scripts/` before editing integration logic.

What to check before making changes
- Files: `README.md`, `package.json`, `database/prisma`, `scripts/`, and the service folder you plan to change (e.g., `services/booking-service`).
- Verify TypeScript and build status:
  - `npx tsc -p tsconfig.json --noEmit`
  - `npm run build`
  - `npm test` (workspace-level tests run with `npm run test --workspaces`)

Editing rules for AI agents (must-follow)
- Make small, focused edits. Avoid large refactors without maintainer sign-off.
- After making edits run root checks: `npx tsc -p tsconfig.json --noEmit`, `npm run lint`, `npm run build`.
- If you add or modify workspace dependencies, run `npm install` and request a security scan (see repo policies).
- Ask for missing example environment files before changing anything that depends on secrets or external APIs.

Key files to reference
- `package.json` (root) - workspaces and scripts
- `README.md` - high-level architecture and ports
- `database/prisma` - schema and migrations
- `scripts/` - integration tests and automation scripts
- `services/booking-service` - canonical backend service example

If anything is unclear, ask the maintainers which workspace to prioritize or request sample `.env` files and run credentials.
