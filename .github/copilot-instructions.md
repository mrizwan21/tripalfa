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
- API integration tests (ts-node scripts): `npm run test:api` and specific targets like `npm run test:api:hotelston`.

Project conventions and patterns (practical points)
- Shared code: prefer packages in `packages/*` (eg `shared-types`, `shared-utils`) for cross-service types and helpers.
- One-off scripts and integration test harnesses live in `scripts/` (use `ts-node` locally to run them).
- Keep workspace dependency changes minimal: add deps to the smallest affected workspace, not root, unless intentionally shared.
- Code style: `prettier`, `eslint`, `husky`, `lint-staged` are configured at the root; run `npm run lint` and `npm run format` when editing.

Integration points and external systems
- Database: PostgreSQL managed via Prisma under `database/prisma` (migrations + client generation live here).
- API Gateway: central routing/auth (check `services/api-gateway`).
- External integrations: Hotelston, Innstant, Duffel, Amadeus — tested via `scripts/test-*.ts` scripts; consult `scripts/` before editing integration logic.

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

-- End --
# Copilot / AI agent instructions for TripAlfa repository

This file gives concise, project-specific guidance for AI coding agents to be productive in this monorepo.

Key concepts
- Monorepo using npm workspaces. See [package.json](package.json) and workspaces under `apps/*`, `services/*`, `packages/*`.
- Frontends live in [apps](apps) (Vite + React or Next.js). Backends are in [services](services) (Express + TypeScript).
- Database schema and migrations live under [database/prisma](database/prisma) (Prisma + PostgreSQL).

Developer workflows (concrete commands)
- Install: `npm install` (root, installs all workspaces). See [package.json](package.json).
- Dev (start multiple workspaces): `npm run dev` or run a single workspace: `npm run dev --workspace=@tripalfa/booking-engine`.
- Prisma: `npm run db:generate`, `npm run db:migrate`, `npm run db:push` (root scripts).
- Run API test scripts (examples): `npm run test:api`, `npm run test:api:hotelston` (these use `ts-node` on files in [scripts](scripts)).
- Docker: use `docker-compose up -d` at repo root or the `docker-compose*.yml` files in the root for composed environments.

Project conventions and patterns (discoverable)
- Services follow an Express + TypeScript pattern; look under [services/booking-service](services/booking-service) for examples.
- Shared types and utilities are under [packages/*](packages). Prefer these packages when adding cross-service types.
- Scripts: many repo-level utilities live in [scripts](scripts) (for example, [scripts/import-languages.ts](scripts/import-languages.ts)). Prefer adding utility scripts here.
- Tests and one-off tasks often use `ts-node` (no separate transpile step required for many scripts).

Code quality and CI-related notes
- Formatting and linting: `prettier`, `eslint`, `husky`, `lint-staged` configured from root (see [package.json](package.json)).
- Commit messages use conventional commits; PRs should include clear descriptions and affected workspaces.

Integration points and external dependencies
- Primary DB is PostgreSQL managed via Prisma schemas in [database/prisma](database/prisma).
- API gateway is the central routing/auth layer (see [services/api-gateway](services/api-gateway)).
- Third-party integrations and API tests are exercised via scripts in [scripts](scripts) (e.g., Hotelston, Innstant, Duffel).

When editing files (mandatory steps for AI agents)
1. If you create or modify any repository files, prefer minimal, focused changes.
2. Run repo-level checks: `npm run build`, `npx tsc -p tsconfig.json --noEmit`, and `npm run lint` if applicable.
3. If you modify code, update or add tests in the relevant workspace and run `npm test`.

Files to check first for context
- [README.md](README.md) - high-level architecture and ports
- [package.json](package.json) - workspace, scripts and dev workflow
- [database/prisma](database/prisma) - DB schema and migrations
- [scripts](scripts) - repo utility scripts and API test harnesses
- Representative service: [services/booking-service](services/booking-service)

Examples (how to perform common tasks)
- Start only the booking service for debugging:
  - `npm run dev --workspace=@tripalfa/booking-service`
- Run migration locally and generate Prisma client:
  - `npm run db:migrate` then `npm run db:generate`
- Execute an integration test script:
  - `npm run test:api:hotelston`

Notes and restrictions
- Do not introduce global deps that break workspace isolation; add packages to the minimal workspace unless intentionally shared.
- Avoid changing many workspaces in a single PR - split cross-cutting changes into clear, reviewable chunks.

If anything in this file looks incomplete or off, ask the maintainer which workspace or service to prioritize, and request example env files if needed.
