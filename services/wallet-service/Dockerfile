# Dockerfile for wallet-service
# This Dockerfile follows the shared template at infrastructure/templates/service.Dockerfile.template
# Parameters: SERVICE_NAME=wallet-service, WORKSPACE_NAME=wallet-service, PORT=3008, HEALTH_PATH=health

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
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --ignore-scripts --fetch-timeout=300000

# Generate Prisma client
RUN pnpm --filter @tripalfa/shared-database generate

# Clean up build info files from the host
RUN find . -name "*.tsbuildinfo" -delete

# Build the service
RUN pnpm --filter wallet-service build

# Production stage
FROM node:20-alpine

# Install dumb-init, curl for health checks, and enable corepack/pnpm for production stage
RUN apk add --no-cache dumb-init curl \
    && corepack enable && corepack prepare pnpm@latest --activate

WORKDIR /app

# Copy essential files for pnpm production install
COPY pnpm-lock.yaml pnpm-workspace.yaml package.json ./
COPY services/wallet-service/package.json ./services/wallet-service/
COPY packages ./packages/
COPY database ./database/
COPY scripts ./scripts/

# Install production dependencies only with cache mount
# Using --fetch-timeout for better handling of slow connections
RUN --mount=type=cache,id=pnpm,target=/pnpm/store \
    pnpm install --frozen-lockfile --prod --ignore-scripts --fetch-timeout=300000

# Copy built dist from builder
COPY --from=builder /app/services/wallet-service/dist ./services/wallet-service/dist

WORKDIR /app/services/wallet-service

EXPOSE 3008

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:3008/health || exit 1

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "--enable-source-maps", "dist/app.js"]
