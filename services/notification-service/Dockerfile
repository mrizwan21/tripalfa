# Dockerfile for notification-service - NEON Database Support
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=notification-service, WORKSPACE_NAME=@tripalfa/notification-service, PORT=3005, HEALTH_PATH=health

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
# Using --network-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout=300000

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Build the service with cache mount for TypeScript incremental build info
RUN find . -name "*.tsbuildinfo" -delete
RUN --mount=type=cache,target=/app/.tsbuildcache pnpm --filter @tripalfa/notification-service... build

# Production stage
FROM node:20-alpine

# Install dumb-init and curl for health checks
# Enable corepack and pnpm for production stage if needed
RUN apk add --no-cache dumb-init curl && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy npm configuration for network retry settings
COPY .npmrc ./

# Copy essential files for pnpm production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/notification-service/package.json ./services/notification-service/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install production dependencies only with cache mount
# Using --network-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --fetch-timeout=300000

# Copy built dist from builder
COPY --from=builder /app/services/notification-service/dist ./services/notification-service/dist

WORKDIR /app/services/notification-service

EXPOSE 3005

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3005/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]