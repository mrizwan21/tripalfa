# Repository Structure Guide

This guide defines where code and assets belong in this monorepo.

## Top-level directory responsibilities

- `apps/`: Frontend applications only (React/Vite/Next UI surfaces).
- `services/`: Deployable backend services only.
- `packages/`: Reusable shared libraries consumed by apps/services.
- `database/`: Prisma schema, migrations, and static DB-specific assets.
- `infrastructure/`: Container, gateway, monitoring, and deployment infrastructure artifacts.
- `scripts/`: Local automation scripts, setup helpers, and integration test runners.
- `docs/`: Product, API, architecture, and operational documentation.
- `types/`: Global ambient type declarations.
- `secrets/`: Local-only secrets for development; never imported by runtime code.

## Placement rules

1. New frontend feature work must stay inside `apps/<app-name>/src`.
2. New HTTP APIs must be added under the owning service in `services/<service-name>/src`.
3. Cross-service/app logic must move to `packages/*` instead of copy-pasting.
4. Shared type contracts go in `packages/shared-types`.
5. Shared non-UI utilities go in `packages/shared-utils`.
6. Shared UI primitives/components go in `packages/ui-components`.
7. DB schema and migrations live in `database/prisma`; service-local SQL files should be avoided.
8. Long-lived documentation belongs in `docs/`; temporary notes should not live at the repo root.

## Recommended internal layout (per workspace)

### Apps

```text
apps/<app>/
├── src/
│   ├── features/
│   ├── pages/
│   ├── components/
│   ├── hooks/
│   ├── services/
│   └── types/
├── tests/
└── public/
```

### Services

```text
services/<service>/
├── src/
│   ├── routes/
│   ├── middleware/
│   ├── services/
│   ├── config/
│   ├── types/
│   └── index.ts
├── tests/
└── Dockerfile
```

### Packages

```text
packages/<package>/
├── src/
├── package.json
└── tsconfig.json
```

## Documentation organization (target)

When adding new docs, place them using these prefixes in filename or folder grouping:

- Architecture/system design: `docs/architecture/*` (or `docs/ARCHITECTURE_*.md` if file-only)
- API contracts/integration: `docs/api/*`
- Deployment/ops/runbooks: `docs/operations/*`
- Product requirements/specs: `docs/specs/*`
- Migration notes: `docs/migrations/*`

If folders are not yet created, prefer creating them when adding a batch of new docs.

## Access and import guidance

- Prefer workspace package imports (e.g., `@tripalfa/shared-types`) over deep relative imports across boundaries.
- Never import code directly from sibling app/service directories.
- Keep each service deployable independently: shared logic belongs in `packages/*`.

## Non-breaking cleanup strategy

To keep runtime stable, structural changes should follow this sequence:

1. Move files in small batches by domain.
2. Update imports/paths in the same PR.
3. Run type-check/build after each batch.
4. Remove dead paths only after successful verification.
