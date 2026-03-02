# Dockerfile for organization-service - Neon Database Support
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=organization-service, WORKSPACE_NAME=@tripalfa/organization-service, PORT=3006, HEALTH_PATH=health

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

# Create symlinks for workspace packages in node_modules so TypeScript can resolve them
RUN mkdir -p node_modules/.pnpm/@tripalfa+shared-types && \
    mkdir -p node_modules/@tripalfa && \
    if [ ! -L node_modules/@tripalfa/shared-types ]; then \
        ln -sf ../../../packages/shared-types node_modules/@tripalfa/shared-types; \
    fi && \
    if [ ! -L node_modules/@tripalfa/shared-utils ]; then \
        ln -sf ../../../packages/shared-utils node_modules/@tripalfa/shared-utils; \
    fi && \
    if [ ! -L node_modules/@tripalfa/shared-database ]; then \
        ln -sf ../../../packages/shared-database node_modules/@tripalfa/shared-database; \
    fi

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Build shared-types first
RUN pnpm --filter @tripalfa/shared-types build

# Build shared-utils which depends on shared-types
RUN pnpm --filter @tripalfa/shared-utils build

# Build shared-database which depends on shared-types
RUN pnpm --filter @tripalfa/shared-database build

# Build the service
RUN find . -name "*.tsbuildinfo" -delete
RUN --mount=type=cache,target=/app/.tsbuildcache pnpm --filter @tripalfa/organization-service build

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
COPY services/organization-service/package.json ./services/organization-service/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install production dependencies only with cache mount
# Using --network-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --fetch-timeout=300000

# Copy built dist from builder
COPY --from=builder /app/services/organization-service/dist ./services/organization-service/dist

WORKDIR /app/services/organization-service

EXPOSE 3006

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3006/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]