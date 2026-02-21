# Dockerfile for rule-engine-service - NEON Database Support
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=rule-engine-service, WORKSPACE_NAME=@tripalfa/rule-engine-service, PORT=3010, HEALTH_PATH=health

FROM node:20-alpine AS builder

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

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

# Build shared-types first
RUN pnpm --filter @tripalfa/shared-types build

# Build shared-utils which depends on shared-types
RUN pnpm --filter @tripalfa/shared-utils build

# Build shared-database which depends on shared-types
RUN pnpm --filter @tripalfa/shared-database build

# Clean up build info files from the host
RUN find . -name "*.tsbuildinfo" -delete

# Build the service - clean tsbuildinfo first to force rebuild
RUN rm -f services/rule-engine-service/tsconfig.tsbuildinfo && pnpm --filter @tripalfa/rule-engine-service build

# Production stage
FROM node:20-alpine

# Install dumb-init and curl for health checks, enable corepack and pnpm for production stage
RUN apk add --no-cache dumb-init curl && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy essential files for pnpm production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/rule-engine-service/package.json ./services/rule-engine-service/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install production dependencies only with cache mount
# Using --network-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --fetch-timeout=300000

# Copy built dist from builder
COPY --from=builder /app/services/rule-engine-service/dist ./services/rule-engine-service/dist

WORKDIR /app/services/rule-engine-service

EXPOSE 3010

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3010/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]