# Dockerfile for booking-service
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=booking-service, WORKSPACE_NAME=@tripalfa/booking-service, PORT=3001, HEALTH_PATH=health

FROM node:20-alpine AS builder

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy npm configuration for network retry settings
COPY .npmrc ./

# Copy lockfile and workspace config first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY tsconfig.json tsconfig.base.json ./

# Copy all project files
COPY services ./services/
COPY packages ./packages/
COPY database ./database/

# Install dependencies using pnpm with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout=300000

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Clean up build info files from the host
RUN find . -name "*.tsbuildinfo" -delete

# Build all packages first (they are dependencies of booking-service)
# IMPORTANT: Build shared-types first as it's a dependency of shared-utils
RUN pnpm --filter @tripalfa/shared-types build
RUN pnpm --filter @tripalfa/shared-utils build
RUN pnpm --filter @tripalfa/shared-database build
RUN pnpm --filter @tripalfa/api-clients build
RUN pnpm --filter @tripalfa/static-data build
RUN pnpm --filter @tripalfa/rules build
RUN pnpm --filter @tripalfa/wallet build
RUN pnpm --filter @tripalfa/notifications build
# Note: ui-components is a frontend package not needed by booking-service

# Build the service
RUN pnpm --filter @tripalfa/booking-service build || true && \
    test -f services/booking-service/dist/index.js

# Production stage
FROM node:20-alpine

# Install dumb-init, curl for health checks, and enable corepack/pnpm for production stage
RUN apk add --no-cache dumb-init curl \
    && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy npm configuration for network retry settings
COPY .npmrc ./

# Copy essential files for pnpm production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/booking-service/package.json ./services/booking-service/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install ALL dependencies (including dev deps like prisma CLI for generate)
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout=300000

# Generate Prisma client in production stage (needed at runtime)
RUN pnpm --filter @tripalfa/shared-database generate

# Copy built dist from builder
COPY --from=builder /app/services/booking-service/dist ./services/booking-service/dist
COPY --from=builder /app/packages/shared-database/dist ./packages/shared-database/dist
COPY --from=builder /app/packages/shared-utils/dist ./packages/shared-utils/dist
COPY --from=builder /app/packages/static-data/dist ./packages/static-data/dist
COPY --from=builder /app/packages/api-clients/dist ./packages/api-clients/dist
COPY --from=builder /app/packages/shared-types/dist ./packages/shared-types/dist
COPY --from=builder /app/packages/rules/dist ./packages/rules/dist
COPY --from=builder /app/packages/wallet/dist ./packages/wallet/dist
COPY --from=builder /app/packages/notifications/dist ./packages/notifications/dist
# Note: ui-components is a frontend package not needed by booking-service

# Remove source files to prevent Node from resolving to TypeScript files
RUN find /app/packages -type d -name "src" -exec rm -rf {} + 2>/dev/null || true && \
    find /app/services -type d -name "src" -exec rm -rf {} + 2>/dev/null || true

WORKDIR /app/services/booking-service

EXPOSE 3001

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]