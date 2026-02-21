# Dockerfile for api-gateway - NEON Database Support
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=api-gateway, WORKSPACE_NAME=@tripalfa/api-gateway, PORT=3000, HEALTH_PATH=health

FROM node:20-alpine AS builder

# Enable corepack and pnpm
RUN corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy lockfile and workspace config first for layer caching
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./

# Copy all project files
COPY services ./services/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/
COPY tsconfig.json tsconfig.base.json ./

# Install dependencies using pnpm with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install \
      --frozen-lockfile \
      --ignore-scripts \
      --fetch-timeout=300000

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Clean up build info files from the host
RUN find . -name "*.tsbuildinfo" -delete

# Build the service
RUN pnpm --filter @tripalfa/api-gateway... build

# Production stage
FROM node:20-alpine

# Install dumb-init and curl for health checks, enable corepack and pnpm for production stage
RUN apk add --no-cache dumb-init curl && \
    corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy essential files for pnpm production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/api-gateway/package.json ./services/api-gateway/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install production dependencies only with cache mount (skip husky hooks)
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install \
      --frozen-lockfile \
      --prod \
      --ignore-scripts \
      --fetch-timeout=300000

# Copy built dist from builder
COPY --from=builder /app/services/api-gateway/dist ./services/api-gateway/dist

WORKDIR /app/services/api-gateway

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3000/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/index.js"]