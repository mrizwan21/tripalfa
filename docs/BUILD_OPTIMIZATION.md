# Build Optimization Documentation

This document outlines the strategies and optimizations implemented in the TripAlfa monorepo to ensure fast, reliable, and scalable builds.

## 1. Package Manager: pnpm

We use `pnpm` for its superior performance and disk space efficiency. Key benefits include:

- **Efficient Node Modules**: `pnpm` uses a content-addressable storage system and symlinks to avoid duplicate packages across projects.
- **Fast Installs**: Dependency resolution and installation are significantly faster than `npm` or `yarn`.
- **Workspace Support**: Built-in support for monorepo workspaces allows for parallel execution and dependency management.

### Commands
- Full Install: `pnpm install`
- Production Build: `pnpm build`
- Workspace-only Build: `pnpm --filter ./packages/* build`

## 2. Docker Layer Optimization

Our Dockerfiles are structured to maximize layer caching. We separate dependency installation from source code copying.

### Multi-Stage Builds
We use multi-stage builds to keep production images lean:
1. **Builder Stage**: Installs all dependencies (including devDependencies) and builds the source code.
2. **Production Stage**: Copies only the built artifacts and production dependencies from the builder stage.

### Cache Strategy
```dockerfile
# Step 1: Install dependencies (cached unless package.json/pnpm-lock.yaml change)
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY packages/shared-utils/package.json ./packages/shared-utils/package.json
RUN pnpm install --frozen-lockfile

# Step 2: Build source (cached unless source code changes)
COPY . .
RUN pnpm build
```

## 3. CI/CD Caching

In our CI/CD pipelines (e.g., GitHub Actions), we cache the following directories:
- `~/.pnpm-store`: Global pnpm store.
- `node_modules`: To speed up repeated runs.
- `.turbo` (if Turborepo is implemented): For task results caching.

## 4. Build Scoping and Parallelization

- **Selective Builds**: Use `pnpm --filter` to build only the packages that have changed.
- **Parallel Execution**: By default, `pnpm` executes tasks in parallel across the workspace when safe to do so.

## 5. TypeScript Optimizations

- **Incremental Builds**: We use `incremental: true` in `tsconfig.json` where appropriate.
- **Composite Projects**: Using `references` in `tsconfig.json` allows for faster, incremental compilation of large projects.
- **Isolated Modules**: Ensuring `isolatedModules: true` for faster transpilation by tools like `esbuild` or `swc`.

---
*Last Updated: February 2026*
