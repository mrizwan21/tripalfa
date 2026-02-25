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
    pnpm install \
    --frozen-lockfile \
    --ignore-scripts \
    --fetch-timeout=300000

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Build the service with cache mount for TypeScript incremental build info
RUN find . -name "*.tsbuildinfo" -delete
RUN --mount=type=cache,target=/app/.tsbuildcache pnpm --filter @tripalfa/booking-engine-service... build

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
COPY services/booking-engine-service/package.json ./services/booking-engine-service/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install production dependencies only with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install \
    --frozen-lockfile \
    --prod \
    --ignore-scripts \
    --fetch-timeout=300000

# Copy built dist from builder
COPY --from=builder /app/services/booking-engine-service/dist ./services/booking-engine-service/dist

WORKDIR /app/services/booking-engine-service

EXPOSE 3021

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3021/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]
